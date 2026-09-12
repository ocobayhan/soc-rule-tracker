"""End-to-end login flow — real Chromium against the real Flask app
(docs/PROGRESS.md, "Faz 3: Playwright"). Complements tests/test_auth_
security.py, which exercises the same behavior at the HTTP-client level
without a real browser/DOM."""
from tests_e2e.conftest import ui_login


def test_valid_login_redirects_to_dashboard(page, base_url, make_user):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)
    assert page.url == f"{base_url}/"
    assert page.locator(".sidebar-logo-text").inner_text() == "SOC Tracker"


def test_invalid_password_shows_error_and_stays_on_login(page, base_url, make_user):
    username, _ = make_user(role="analyst")
    page.goto(f"{base_url}/login")
    page.fill("#username", username)
    page.fill("#password", "wrong-password")
    page.click("button[type=submit]")
    page.wait_for_selector(".login-error")
    assert "hatal" in page.locator(".login-error").inner_text().lower()
    assert page.url == f"{base_url}/login"


def test_unauthenticated_visit_redirects_to_login(page, base_url):
    page.goto(f"{base_url}/")
    page.wait_for_url(f"{base_url}/login")


def test_logout_returns_to_login_and_revokes_access(page, base_url, make_user):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)
    page.click("a[href='/logout']")
    page.wait_for_url(f"{base_url}/login")
    page.goto(f"{base_url}/")
    page.wait_for_url(f"{base_url}/login")


def test_b4_rate_limit_triggers_in_the_real_browser(page, base_url, make_user):
    """Regression for B4 (docs/PROGRESS.md, Faz 1) — exercised here through
    the actual login form/redirect cycle, not just a raw HTTP client."""
    username, _ = make_user(role="analyst")
    for _ in range(8):
        page.goto(f"{base_url}/login")
        page.fill("#username", username)
        page.fill("#password", "wrong-password")
        page.click("button[type=submit]")
        page.wait_for_selector(".login-error")

    page.goto(f"{base_url}/login")
    page.fill("#username", username)
    page.fill("#password", "wrong-password")
    with page.expect_response(lambda r: r.url.endswith("/login") and r.request.method == "POST") as resp_info:
        page.click("button[type=submit]")
    assert resp_info.value.status == 429
