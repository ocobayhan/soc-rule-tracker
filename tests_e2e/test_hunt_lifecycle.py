"""End-to-end Threat Hunting lifecycle — same template as test_tune_
lifecycle.py (docs/PROGRESS.md, "Faz 3 devamı"). Hunt's create modal has no
environment field (unlike Tune/UC), so this is the simplest of the four."""
import re

from tests_e2e.conftest import ui_login


def test_create_hunt_via_modal_appears_in_list(page, base_url, make_user):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)

    page.click("button:has-text('Threat Hunting')")
    page.wait_for_selector("#tab-threat-hunting.active")

    page.click("#tab-threat-hunting button:has-text('+ Yeni Hunt Talebi')")
    page.wait_for_selector("#hunt-modal", state="visible")

    # "Talep Eden" is locked to the logged-in analyst (lockToSelf(), app.js
    # openHuntModal) — only title/subject need filling.
    page.fill("#hunt-title", "E2E Playwright Hunt")
    page.fill("#hunt-subject", "e2e test — created via Playwright")

    with page.expect_response(lambda r: r.url.endswith("/api/hunt") and r.request.method == "POST") as resp_info:
        page.click("#hunt-modal button:has-text('Kaydet')")
    assert resp_info.value.status == 201

    page.wait_for_selector("#hunt-modal", state="hidden")
    row = page.locator("#hunt-tbody tr", has_text="E2E Playwright Hunt")
    row.wait_for()
    assert "Ön Onay Bekliyor" in row.inner_text()


def test_senior_can_approve_pending_validation_via_ui(page, base_url, make_user):
    reporter, reporter_pw = make_user(role="analyst")
    ui_login(page, base_url, reporter, reporter_pw)
    page.click("button:has-text('Threat Hunting')")
    page.wait_for_selector("#tab-threat-hunting.active")
    page.click("#tab-threat-hunting button:has-text('+ Yeni Hunt Talebi')")
    page.wait_for_selector("#hunt-modal", state="visible")
    page.fill("#hunt-title", "E2E Hunt Approval")
    page.fill("#hunt-subject", "e2e approval chain test")
    with page.expect_response(lambda r: r.url.endswith("/api/hunt") and r.request.method == "POST"):
        page.click("#hunt-modal button:has-text('Kaydet')")
    page.wait_for_selector("#hunt-modal", state="hidden")

    senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
    page.click("a[href='/logout']")
    page.wait_for_url(re.compile(r".*/login"))
    ui_login(page, base_url, senior, senior_pw)
    page.click("button:has-text('Threat Hunting')")
    page.wait_for_selector("#tab-threat-hunting.active")

    row = page.locator("#hunt-tbody tr", has_text="E2E Hunt Approval")
    row.wait_for()
    row.get_by_role("button", name="Onayla / Reddet").click()
    page.wait_for_selector("#validate-modal", state="visible")

    with page.expect_response(lambda r: "/validate" in r.url and r.request.method == "POST") as resp_info:
        page.click("#validate-modal button:has-text('Onayla')")
    assert resp_info.value.status == 200

    page.wait_for_selector("#validate-modal", state="hidden")
    row = page.locator("#hunt-tbody tr", has_text="E2E Hunt Approval")
    row.wait_for()
    assert "Açık" in row.inner_text()
