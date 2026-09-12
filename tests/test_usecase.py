"""Use-Case (usecase_requests) module — same shape as test_tune.py (that
file's docstring calls it the reference template), adapted for this
module's field names and status set. docs/PROGRESS.md, "Faz 2 devamı"."""
from tests.conftest import login


def _create_uc(client, **overrides):
    payload = {
        "requester": "admin",
        "usecase_description": "pytest usecase description",
        "environment": "PROD",
    }
    payload.update(overrides)
    return client.post("/api/usecase", json=payload)


class TestCreateUC:
    def test_missing_required_field_returns_400(self, admin_client):
        resp = admin_client.post("/api/usecase", json={"requester": "admin"})
        assert resp.status_code == 400

    def test_valid_create_defaults_to_pending_validation(self, admin_client):
        resp = _create_uc(admin_client)
        assert resp.status_code == 201
        assert resp.get_json()["status"] == "Ön Onay Bekliyor"

    def test_multi_select_environment_array_is_joined_with_commas(self, admin_client):
        resp = _create_uc(admin_client, environment=["PROD", "DEV"])
        assert resp.status_code == 201
        assert resp.get_json()["environment"] == "PROD,DEV"

    def test_analyst_role_is_forced_to_be_their_own_requester(self, client, make_user):
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = _create_uc(client, requester="someone-else")
        assert resp.status_code == 201
        assert resp.get_json()["requester"] == username


class TestUpdateUCOwnership:
    def test_non_owner_analyst_cannot_edit(self, admin_client, client, make_user):
        created = _create_uc(admin_client).get_json()
        outsider, outsider_pw = make_user(role="analyst")
        login(client, outsider, outsider_pw)
        resp = client.put(f"/api/usecase/{created['id']}", json={"notes": "hacked"})
        assert resp.status_code == 403

    def test_unassigned_analyst_can_claim(self, admin_client, client, make_user):
        """Regression for the claim-ordering bug fixed alongside this test
        suite (docs/PROGRESS.md, 'Faz 2' — the same fix applied to
        update_tune/update_usecase/update_hunt)."""
        created = _create_uc(admin_client).get_json()
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        client.post(f"/api/usecase/{created['id']}/validate", json={})

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        resp = client.put(f"/api/usecase/{created['id']}", json={"rule_author": worker, "status": "İnceleniyor"})
        assert resp.status_code == 200
        assert resp.get_json()["rule_author"] == worker


class TestDeleteUCIsAdminOnly:
    def test_analyst_cannot_delete(self, admin_client, client, make_user):
        created = _create_uc(admin_client).get_json()
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = client.delete(f"/api/usecase/{created['id']}")
        assert resp.status_code == 403

    def test_admin_can_delete(self, admin_client):
        created = _create_uc(admin_client).get_json()
        resp = admin_client.delete(f"/api/usecase/{created['id']}")
        assert resp.status_code == 200


class TestApprovalPipeline:
    """Ön Onay Bekliyor -> Açık -> İnceleniyor -> Test Ediliyor -> Prod'da
    Aktif, through the real dedicated approval endpoints."""

    def test_full_happy_path(self, admin_client, client, make_user):
        created = _create_uc(admin_client).get_json()
        uc_id = created["id"]

        senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
        login(client, senior, senior_pw)
        resp = client.post(f"/api/usecase/{uc_id}/validate", json={})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Açık"

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        resp = client.put(f"/api/usecase/{uc_id}", json={"rule_author": worker, "status": "İnceleniyor"})
        assert resp.status_code == 200

        resp = client.put(f"/api/usecase/{uc_id}", json={"status": "Test Ediliyor", "rule_name": "pytest rule"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Test Ediliyor"

        login(client, senior, senior_pw)
        resp = client.post(f"/api/usecase/{uc_id}/test-approve", json={})
        assert resp.status_code == 400  # test_notes is mandatory

        resp = client.post(f"/api/usecase/{uc_id}/test-approve", json={"test_notes": "works in prod"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Prod'da Aktif"

    def test_test_reject_returns_to_inceleniyor(self, admin_client, client, make_user):
        created = _create_uc(admin_client).get_json()
        uc_id = created["id"]
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        client.post(f"/api/usecase/{uc_id}/validate", json={})

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        client.put(f"/api/usecase/{uc_id}", json={"rule_author": worker, "status": "İnceleniyor"})
        client.put(f"/api/usecase/{uc_id}", json={"status": "Test Ediliyor", "rule_name": "pytest rule"})

        login(client, senior, senior_pw)
        resp = client.post(f"/api/usecase/{uc_id}/test-reject", json={"test_notes": "fails in staging"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "İnceleniyor"

    def test_non_senior_cannot_validate(self, admin_client, client, make_user):
        created = _create_uc(admin_client).get_json()
        username, password = make_user(role="analyst", tier="Analist")
        login(client, username, password)
        resp = client.post(f"/api/usecase/{created['id']}/validate", json={})
        assert resp.status_code == 403
