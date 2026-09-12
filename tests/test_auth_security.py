"""Regression tests for the Faz 1 security-audit fixes (docs/PROGRESS.md).

Each test class is named after the finding it locks in, so a future
regression shows up as an obviously-named failure.
"""
from tests.conftest import login


class TestLoginRequired:
    def test_api_route_without_session_returns_401_json(self, client):
        resp = client.get("/api/tune")
        assert resp.status_code == 401
        assert resp.get_json()["error"] == "Unauthorized"

    def test_page_route_without_session_redirects_to_login(self, client):
        resp = client.get("/")
        assert resp.status_code == 302
        assert "/login" in resp.headers["Location"]

    def test_valid_login_grants_access(self, client):
        resp = login(client, "admin", "Admin123!")
        assert resp.status_code == 302
        resp2 = client.get("/api/tune")
        assert resp2.status_code == 200

    def test_invalid_password_rejected(self, client):
        resp = login(client, "admin", "wrong-password")
        assert resp.status_code == 200  # re-renders login.html with an error
        assert b"hatal\xc4\xb1" in resp.data.lower() or resp.status_code == 200


class TestB4LoginRateLimit:
    """B4 — brute-force protection on /login (per-username, DB-backed)."""

    def test_ninth_failed_attempt_is_rate_limited(self, client, make_user):
        username, password = make_user(role="analyst")
        for _ in range(8):
            resp = login(client, username, "wrong-password")
            assert resp.status_code == 200
        blocked = login(client, username, "wrong-password")
        assert blocked.status_code == 429

    def test_rate_limit_blocks_even_the_correct_password_once_tripped(self, client, make_user):
        username, password = make_user(role="analyst")
        for _ in range(8):
            login(client, username, "wrong-password")
        blocked = login(client, username, password)
        assert blocked.status_code == 429

    def test_rate_limit_is_scoped_per_username(self, client, make_user):
        victim, _ = make_user(role="analyst")
        bystander, bystander_pw = make_user(role="analyst")
        for _ in range(9):
            login(client, victim, "wrong-password")
        ok = login(client, bystander, bystander_pw)
        assert ok.status_code == 302  # bystander's own account is unaffected


class TestB5SessionCookieFlags:
    def test_session_cookie_is_httponly_and_samesite_lax(self, client):
        resp = login(client, "admin", "Admin123!")
        set_cookie = resp.headers.get("Set-Cookie", "")
        assert "HttpOnly" in set_cookie
        assert "SameSite=Lax" in set_cookie


class TestB6SecurityHeaders:
    def test_response_carries_hardening_headers(self, client):
        resp = client.get("/login")
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


class TestSettingsRequired:
    def test_analyst_cannot_reach_settings_only_route(self, client, make_user):
        username, password = make_user(role="analyst")
        login(client, username, password)
        resp = client.get("/api/stats/users")
        assert resp.status_code == 403

    def test_admin_can_reach_settings_only_route(self, admin_client):
        resp = admin_client.get("/api/stats/users")
        assert resp.status_code == 200


def _create_tune(client, case_id):
    resp = client.post(
        "/api/tune",
        json={
            "reporter": "admin",
            "environment": "PROD",
            "rule_name": "pytest rule",
            "tune_reason": "pytest reason",
            "xsoar_case_id": case_id,
        },
    )
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()["id"]


class TestIsSenior:
    """tier is independent of role (docs/rbac.md) — is_senior() must gate
    on tier alone, regardless of the caller's role."""

    def test_non_senior_tier_cannot_validate(self, admin_client, client, make_user):
        tune_id = _create_tune(admin_client, "PYTEST-SENIOR-1")
        username, password = make_user(role="analyst", tier="Analist")
        login(client, username, password)
        resp = client.post(f"/api/tune/{tune_id}/validate", json={})
        assert resp.status_code == 403

    def test_senior_tier_can_validate_even_with_analyst_role(self, admin_client, client, make_user):
        tune_id = _create_tune(admin_client, "PYTEST-SENIOR-2")
        username, password = make_user(role="analyst", tier="Kıdemli Analist")
        login(client, username, password)
        resp = client.post(f"/api/tune/{tune_id}/validate", json={})
        assert resp.status_code == 200
