"""Threat Hunting (threat_hunt_requests) module — same shape as
test_tune.py, adapted for this module's field names and status set
(docs/PROGRESS.md, "Faz 2 devamı")."""
from tests.conftest import login


def _create_hunt(client, **overrides):
    payload = {
        "hunt_title": "pytest hunt title",
        "hunt_subject": "pytest hunt subject",
        "requester": "admin",
    }
    payload.update(overrides)
    return client.post("/api/hunt", json=payload)


class TestCreateHunt:
    def test_missing_required_field_returns_400(self, admin_client):
        resp = admin_client.post("/api/hunt", json={"hunt_title": "x"})
        assert resp.status_code == 400

    def test_valid_create_defaults_to_pending_validation(self, admin_client):
        resp = _create_hunt(admin_client)
        assert resp.status_code == 201
        assert resp.get_json()["status"] == "Ön Onay Bekliyor"

    def test_analyst_role_is_forced_to_be_their_own_requester(self, client, make_user):
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = _create_hunt(client, requester="someone-else")
        assert resp.status_code == 201
        assert resp.get_json()["requester"] == username


class TestDeleteHuntIsAdminOnly:
    def test_analyst_cannot_delete(self, admin_client, client, make_user):
        created = _create_hunt(admin_client).get_json()
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = client.delete(f"/api/hunt/{created['id']}")
        assert resp.status_code == 403

    def test_admin_can_delete(self, admin_client):
        created = _create_hunt(admin_client).get_json()
        resp = admin_client.delete(f"/api/hunt/{created['id']}")
        assert resp.status_code == 200


class TestClaimAndStart:
    def test_unassigned_analyst_can_claim(self, admin_client, client, make_user):
        """Regression for the claim-ordering bug fixed alongside this test
        suite (docs/PROGRESS.md, 'Faz 2') — applies identically to hunt's
        update_hunt()."""
        created = _create_hunt(admin_client).get_json()
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        client.post(f"/api/hunt/{created['id']}/validate", json={})

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        resp = client.put(f"/api/hunt/{created['id']}", json={"assigned_analyst": worker, "status": "İnceleniyor"})
        assert resp.status_code == 200
        assert resp.get_json()["assigned_analyst"] == worker

    def test_only_assigned_analyst_can_start(self, admin_client, client, make_user):
        created = _create_hunt(admin_client).get_json()
        hunt_id = created["id"]
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        client.post(f"/api/hunt/{hunt_id}/validate", json={})

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        client.put(f"/api/hunt/{hunt_id}", json={"assigned_analyst": worker, "status": "İnceleniyor"})

        outsider, outsider_pw = make_user(role="analyst")
        login(client, outsider, outsider_pw)
        resp = client.post(f"/api/hunt/{hunt_id}/start")
        assert resp.status_code == 403

        login(client, worker, worker_pw)
        resp = client.post(f"/api/hunt/{hunt_id}/start")
        assert resp.status_code == 200
        assert resp.get_json()["started_at"] is not None

        resp = client.post(f"/api/hunt/{hunt_id}/start")
        assert resp.status_code == 400  # already started


class TestApprovalPipeline:
    """Ön Onay Bekliyor -> Açık -> İnceleniyor -> Sonuç Onayı Bekliyor ->
    Tamamlandı, through the real dedicated approval endpoints."""

    def test_full_happy_path(self, admin_client, client, make_user):
        created = _create_hunt(admin_client).get_json()
        hunt_id = created["id"]

        senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
        login(client, senior, senior_pw)
        resp = client.post(f"/api/hunt/{hunt_id}/validate", json={})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Açık"

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        client.put(f"/api/hunt/{hunt_id}", json={"assigned_analyst": worker, "status": "İnceleniyor"})

        resp = client.put(f"/api/hunt/{hunt_id}", json={"status": "Sonuç Onayı Bekliyor"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Sonuç Onayı Bekliyor"

        login(client, senior, senior_pw)
        resp = client.post(f"/api/hunt/{hunt_id}/approve-result", json={"result_approval_note": "confirmed"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Tamamlandı"

    def test_reject_result_requires_a_note_and_returns_to_inceleniyor(self, admin_client, client, make_user):
        created = _create_hunt(admin_client).get_json()
        hunt_id = created["id"]
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        client.post(f"/api/hunt/{hunt_id}/validate", json={})

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        client.put(f"/api/hunt/{hunt_id}", json={"assigned_analyst": worker, "status": "İnceleniyor"})
        client.put(f"/api/hunt/{hunt_id}", json={"status": "Sonuç Onayı Bekliyor"})

        login(client, senior, senior_pw)
        resp = client.post(f"/api/hunt/{hunt_id}/reject-result", json={})
        assert resp.status_code == 400  # note is mandatory

        resp = client.post(f"/api/hunt/{hunt_id}/reject-result", json={"result_approval_note": "incomplete report"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "İnceleniyor"

    def test_non_senior_cannot_approve_result(self, admin_client, client, make_user):
        created = _create_hunt(admin_client).get_json()
        hunt_id = created["id"]
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        client.post(f"/api/hunt/{hunt_id}/validate", json={})

        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        client.put(f"/api/hunt/{hunt_id}", json={"assigned_analyst": worker, "status": "İnceleniyor"})
        client.put(f"/api/hunt/{hunt_id}", json={"status": "Sonuç Onayı Bekliyor"})

        resp = client.post(f"/api/hunt/{hunt_id}/approve-result", json={})
        assert resp.status_code == 403
