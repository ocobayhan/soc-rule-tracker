"""XSOAR inbound webhooks (docs/xsoar_integration.md) — api_key_required
auth, duplicate-case protection, and the B2/B7 security-audit fixes as they
apply to this machine-to-machine surface."""
from tests.conftest import TEST_XSOAR_TOKEN

AUTH_HEADER = {"X-API-Key": TEST_XSOAR_TOKEN}

# A 1x1 transparent PNG, base64-encoded — used across image-validation tests.
VALID_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
    "+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class TestApiKeyRequired:
    def test_missing_key_returns_401(self, client):
        resp = client.post("/api/integrations/xsoar/tune", json={})
        assert resp.status_code == 401

    def test_wrong_key_returns_401(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune", json={}, headers={"X-API-Key": "wrong"}
        )
        assert resp.status_code == 401

    def test_correct_key_passes_auth_gate(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune", json={}, headers=AUTH_HEADER
        )
        assert resp.status_code == 400  # auth passed, fails on missing required fields instead


class TestXsoarCreateTune:
    def _payload(self, **overrides):
        payload = {
            "xsoar_case_id": "PYTEST-WEBHOOK-1",
            "rule_name": "pytest webhook rule",
            "environment": "PROD",
            "analyst_comment": "pytest reason",
        }
        payload.update(overrides)
        return payload

    def test_missing_required_field_returns_400(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune",
            json={"xsoar_case_id": "X"},
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 400

    def test_valid_webhook_creates_pending_validation_tune(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune", json=self._payload(), headers=AUTH_HEADER
        )
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["status"] == "Ön Onay Bekliyor"
        assert body["reporter"] == "XSOAR Entegrasyonu"

    def test_duplicate_case_id_returns_409(self, client):
        client.post("/api/integrations/xsoar/tune", json=self._payload(), headers=AUTH_HEADER)
        resp = client.post("/api/integrations/xsoar/tune", json=self._payload(), headers=AUTH_HEADER)
        assert resp.status_code == 409
        assert resp.get_json()["duplicate"] is True

    def test_requested_by_matches_existing_tracker_user(self, client, make_user):
        username, _ = make_user(role="analyst")
        resp = client.post(
            "/api/integrations/xsoar/tune",
            json=self._payload(xsoar_case_id="PYTEST-WEBHOOK-MATCH", requested_by=username),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        assert resp.get_json()["reporter"] == username

    def test_requested_by_no_match_falls_back_to_generic_label(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune",
            json=self._payload(xsoar_case_id="PYTEST-WEBHOOK-NOMATCH", requested_by="nobody-such-user"),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        assert resp.get_json()["reporter"] == "XSOAR Entegrasyonu"

    def test_b2_javascript_scheme_url_is_rejected_falls_back_to_template_or_none(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune",
            json=self._payload(xsoar_case_id="PYTEST-WEBHOOK-XSS", xsoar_url="javascript:alert(1)"),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        assert resp.get_json()["xsoar_url"] != "javascript:alert(1)"

    def test_https_url_is_kept_as_is(self, client):
        resp = client.post(
            "/api/integrations/xsoar/tune",
            json=self._payload(xsoar_case_id="PYTEST-WEBHOOK-HTTPS", xsoar_url="https://example.com/case/1"),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        assert resp.get_json()["xsoar_url"] == "https://example.com/case/1"


class TestXsoarIncidentReportWebhook:
    def _payload(self, **overrides):
        payload = {
            "xsoar_case_id": "PYTEST-INC-WEBHOOK-1",
            "title": "pytest incident webhook",
            "environment": "PROD",
            "sections": [{"heading": "Özet", "text": "pytest text"}],
        }
        payload.update(overrides)
        return payload

    def test_missing_required_field_returns_400(self, client):
        resp = client.post(
            "/api/integrations/xsoar/incident-report",
            json={"title": "x"},
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 400

    def test_all_sections_empty_returns_400(self, client):
        resp = client.post(
            "/api/integrations/xsoar/incident-report",
            json=self._payload(sections=[{"heading": "x", "text": "  "}]),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 400

    def test_valid_webhook_creates_acildi_report(self, client):
        resp = client.post(
            "/api/integrations/xsoar/incident-report", json=self._payload(), headers=AUTH_HEADER
        )
        assert resp.status_code == 201
        assert resp.get_json()["status"] == "Açıldı"

    def test_b7_garbage_image_bytes_are_silently_skipped(self, client):
        resp = client.post(
            "/api/integrations/xsoar/incident-report",
            json=self._payload(
                xsoar_case_id="PYTEST-INC-WEBHOOK-IMG-1",
                images=["not-a-real-image-just-garbage-base64=="],
            ),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        import json as jsonlib
        assert jsonlib.loads(resp.get_json()["images"]) == []

    def test_b7_valid_png_is_accepted(self, client):
        resp = client.post(
            "/api/integrations/xsoar/incident-report",
            json=self._payload(
                xsoar_case_id="PYTEST-INC-WEBHOOK-IMG-2",
                images=[f"data:image/png;base64,{VALID_PNG_B64}"],
            ),
            headers=AUTH_HEADER,
        )
        assert resp.status_code == 201
        import json as jsonlib
        images = jsonlib.loads(resp.get_json()["images"])
        assert len(images) == 1
        assert images[0]["filename"].endswith(".png")
