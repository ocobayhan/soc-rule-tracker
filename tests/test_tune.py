"""Kural Tuning (tune_requests) module — reference test template for the
other three near-identical modules (Use-Case / Threat Hunt / Incident),
per docs/PROGRESS.md ("Faz 2: pytest test paketi")."""
from tests.conftest import login


def _create_tune(client, case_id, **overrides):
    payload = {
        "reporter": "admin",
        "environment": "PROD",
        "rule_name": "pytest rule",
        "tune_reason": "pytest reason",
        "xsoar_case_id": case_id,
    }
    payload.update(overrides)
    return client.post("/api/tune", json=payload)


class TestCreateTune:
    def test_missing_required_field_returns_400(self, admin_client):
        resp = admin_client.post("/api/tune", json={"reporter": "admin"})
        assert resp.status_code == 400

    def test_missing_soar_case_id_returns_400(self, admin_client):
        resp = admin_client.post("/api/tune", json={
            "reporter": "admin", "environment": "PROD",
            "rule_name": "x", "tune_reason": "y",
        })
        assert resp.status_code == 400

    def test_valid_create_defaults_to_pending_validation(self, admin_client):
        resp = _create_tune(admin_client, "PYTEST-CREATE-1")
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["status"] == "Ön Onay Bekliyor"
        assert body["rule_name"] == "pytest rule"

    def test_duplicate_active_case_id_returns_409(self, admin_client):
        first = _create_tune(admin_client, "PYTEST-DUP-1").get_json()
        resp = _create_tune(admin_client, "PYTEST-DUP-1")
        assert resp.status_code == 409
        assert resp.get_json()["error"].find(str(first["id"])) != -1

    def test_analyst_role_is_forced_to_be_their_own_reporter(self, client, make_user):
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = _create_tune(client, "PYTEST-CREATE-2", reporter="someone-else")
        assert resp.status_code == 201
        assert resp.get_json()["reporter"] == username


class TestUpdateTuneOwnership:
    def test_non_owner_analyst_cannot_edit(self, admin_client, client, make_user):
        created = _create_tune(admin_client, "PYTEST-OWN-1").get_json()
        outsider, outsider_pw = make_user(role="analyst")
        login(client, outsider, outsider_pw)
        resp = client.put(f"/api/tune/{created['id']}", json={"tune_reason": "hacked"})
        assert resp.status_code == 403

    def test_reporter_can_edit_their_own_request(self, client, make_user):
        reporter, reporter_pw = make_user(role="analyst")
        login(client, reporter, reporter_pw)
        created = _create_tune(client, "PYTEST-OWN-2", reporter=reporter).get_json()
        resp = client.put(f"/api/tune/{created['id']}", json={"tune_reason": "updated reason"})
        assert resp.status_code == 200
        assert resp.get_json()["tune_reason"] == "updated reason"

    def test_analyst_cannot_reassign_someone_else_to_themselves_style_field_tamper(self, client, make_user):
        """An analyst claiming an unassigned request may only assign
        themselves — not a third party — to the tuning_analyst field."""
        reporter, reporter_pw = make_user(role="analyst")
        login(client, reporter, reporter_pw)
        created = _create_tune(client, "PYTEST-OWN-3", reporter=reporter).get_json()
        resp = client.put(f"/api/tune/{created['id']}", json={"tuning_analyst": "someone-else"})
        assert resp.status_code == 403


class TestDeleteTuneIsAdminOnly:
    def test_analyst_cannot_delete(self, admin_client, client, make_user):
        created = _create_tune(admin_client, "PYTEST-DEL-1").get_json()
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = client.delete(f"/api/tune/{created['id']}")
        assert resp.status_code == 403

    def test_admin_can_delete(self, admin_client):
        created = _create_tune(admin_client, "PYTEST-DEL-2").get_json()
        resp = admin_client.delete(f"/api/tune/{created['id']}")
        assert resp.status_code == 200


class TestApprovalPipeline:
    """Ön Onay Bekliyor -> Açık -> (manual close by assigned analyst) ->
    Tune Edildi -> Tune Başarılı, exercised end-to-end through the real
    dedicated approval endpoints (docs/REQUIREMENTS.md, docs/rbac.md)."""

    def test_full_happy_path(self, admin_client, client, make_user):
        created = _create_tune(admin_client, "PYTEST-PIPE-1").get_json()
        tune_id = created["id"]

        senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
        login(client, senior, senior_pw)
        resp = client.post(f"/api/tune/{tune_id}/validate", json={})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Açık"

        # Claim (self-assign) as the assigned analyst
        worker, worker_pw = make_user(role="analyst")
        login(client, worker, worker_pw)
        resp = client.put(f"/api/tune/{tune_id}", json={"tuning_analyst": worker})
        assert resp.status_code == 200

        # Close as the assigned analyst
        resp = client.put(f"/api/tune/{tune_id}", json={"status": "Tune Edildi", "how_tuned": "pytest fix"})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Tune Edildi"

        # Final approval requires a senior tier + a mandatory note
        login(client, senior, senior_pw)
        resp = client.post(f"/api/tune/{tune_id}/approve", json={})
        assert resp.status_code == 400  # approval_note is mandatory

        resp = client.post(f"/api/tune/{tune_id}/approve", json={
            "approval_note": "looks good", "qa_test_ok": "Evet", "qa_peer_reviewed": "Evet",
        })
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Tune Başarılı"

    def test_rejected_validation_reopens_case_id_for_reuse(self, admin_client, client, make_user):
        """docs/xsoar_integration.md: a rejected case's ID is exempt from
        the duplicate-active-case guard — a new request may reuse it."""
        created = _create_tune(admin_client, "PYTEST-REJECT-1").get_json()
        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        resp = client.post(
            f"/api/tune/{created['id']}/reject-validation",
            json={"validation_note": "not valid"},
        )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Reddedildi"

        # NOTE: `client` here is the same underlying test client as
        # `admin_client` (both wrap one cookie jar) and is currently logged
        # in as `senior` from the reject-validation call above — that's
        # fine, any authenticated user can create a tune request; only the
        # duplicate-case-id exemption itself is under test here.
        resp = _create_tune(client, "PYTEST-REJECT-1")
        assert resp.status_code == 201  # no 409 — rejected cases are exempt
