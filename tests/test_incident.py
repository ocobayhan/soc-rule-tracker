"""Olay Raporu (incident_reports) module — B1 regression test (missing
delete-authorization check, docs/PROGRESS.md "Güvenlik Denetimi") plus the
4-state approval pipeline (docs/REQUIREMENTS.md, docs/rbac.md)."""
from conftest import login


def _create_incident(client, title="pytest incident", **overrides):
    payload = {
        "title": title,
        "sections": [{"heading": "Özet", "text": "pytest section text"}],
    }
    payload.update(overrides)
    return client.post("/api/incident-reports", json=payload)


class TestCreateIncident:
    def test_missing_title_returns_400(self, admin_client):
        resp = admin_client.post("/api/incident-reports", json={
            "sections": [{"heading": "x", "text": "y"}],
        })
        assert resp.status_code == 400

    def test_all_sections_empty_returns_400(self, admin_client):
        """A section survives if EITHER heading or text is non-blank
        (app.py create_incident_report) — only a section with BOTH blank
        is dropped, and an empty result list is what triggers the 400."""
        resp = admin_client.post("/api/incident-reports", json={
            "title": "pytest", "sections": [{"heading": "   ", "text": "  "}],
        })
        assert resp.status_code == 400

    def test_valid_create_defaults_to_acildi(self, admin_client):
        resp = _create_incident(admin_client)
        assert resp.status_code == 201
        assert resp.get_json()["status"] == "Açıldı"

    def test_duplicate_active_case_id_returns_409_with_existing_id(self, admin_client):
        first = _create_incident(admin_client, xsoar_case_id="PYTEST-INC-DUP-1").get_json()
        resp = _create_incident(admin_client, xsoar_case_id="PYTEST-INC-DUP-1")
        assert resp.status_code == 409
        assert resp.get_json()["existing_id"] == first["id"]


class TestB1DeleteIsAdminOnly:
    """Locks in the fix for B1: delete_incident_report was previously
    missing the same admin-only guard its sibling modules already had."""

    def test_analyst_cannot_delete(self, admin_client, client, make_user):
        created = _create_incident(admin_client).get_json()
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = client.delete(f"/api/incident-reports/{created['id']}")
        assert resp.status_code == 403

    def test_admin_can_delete(self, admin_client):
        created = _create_incident(admin_client).get_json()
        resp = admin_client.delete(f"/api/incident-reports/{created['id']}")
        assert resp.status_code == 200


class TestApprovalPipeline:
    def test_full_happy_path_acildi_to_kapandi(self, admin_client, client, make_user):
        created = _create_incident(admin_client).get_json()
        item_id = created["id"]

        resp = admin_client.post(f"/api/incident-reports/{item_id}/start-review")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "İncelemede"

        resp = admin_client.post(f"/api/incident-reports/{item_id}/submit-for-approval")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Onay Bekliyor"

        non_senior, non_senior_pw = make_user(role="analyst", tier="Analist")
        login(client, non_senior, non_senior_pw)
        resp = client.post(f"/api/incident-reports/{item_id}/validate", json={})
        assert resp.status_code == 403

        senior, senior_pw = make_user(role="analyst", tier="Müdür")
        login(client, senior, senior_pw)
        resp = client.post(f"/api/incident-reports/{item_id}/validate", json={})
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "Kapandı"

    def test_reject_validation_requires_a_note_and_returns_to_incelemede(self, admin_client, client, make_user):
        created = _create_incident(admin_client).get_json()
        item_id = created["id"]
        admin_client.post(f"/api/incident-reports/{item_id}/start-review")
        admin_client.post(f"/api/incident-reports/{item_id}/submit-for-approval")

        senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
        login(client, senior, senior_pw)

        resp = client.post(f"/api/incident-reports/{item_id}/reject-validation", json={})
        assert resp.status_code == 400  # note is mandatory

        resp = client.post(
            f"/api/incident-reports/{item_id}/reject-validation",
            json={"validation_note": "needs more detail"},
        )
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "İncelemede"

    def test_cannot_edit_a_closed_report(self, admin_client):
        created = _create_incident(admin_client).get_json()
        item_id = created["id"]
        admin_client.post(f"/api/incident-reports/{item_id}/start-review")
        admin_client.post(f"/api/incident-reports/{item_id}/submit-for-approval")
        admin_client.post(f"/api/incident-reports/{item_id}/validate", json={})

        resp = admin_client.put(f"/api/incident-reports/{item_id}", json={"title": "hacked"})
        assert resp.status_code == 400
