"""End-to-end Kural Tuning lifecycle — reference template for the other
three modules (docs/PROGRESS.md, "Faz 3: Playwright"). Drives the actual
"+ Yeni Talep" modal and the ön onay (validate) dialog through real DOM
clicks, complementing tests/test_tune.py's HTTP-client-level coverage of
the same flow."""
import re

from tests_e2e.conftest import ui_login


def test_create_tune_request_via_modal_appears_in_list(page, base_url, make_user, seed_reference_data):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)

    page.click("button:has-text('Kural Tuning')")
    page.wait_for_selector("#tab-tuning.active")

    page.click("#tab-tuning button:has-text('+ Yeni Talep')")
    page.wait_for_selector("#tune-modal", state="visible")

    # "Raporlayan" is locked to the logged-in analyst (lockToSelf(), app.js
    # openTuneModal) — only the environment needs picking.
    page.select_option("#tune-env", label=seed_reference_data["environment"])
    page.fill("#tune-rule-name", "E2E Playwright Rule")
    page.fill("#tune-reason", "e2e test — created via Playwright")
    page.fill("#tune-xsoar-case-id", "E2E-CASE-1")

    with page.expect_response(lambda r: r.url.endswith("/api/tune") and r.request.method == "POST") as resp_info:
        page.click("#tune-modal button:has-text('Kaydet')")
    assert resp_info.value.status == 201

    page.wait_for_selector("#tune-modal", state="hidden")
    row = page.locator("#tune-tbody tr", has_text="E2E Playwright Rule")
    row.wait_for()
    assert "Ön Onay Bekliyor" in row.inner_text()


def test_senior_can_approve_pending_validation_via_ui(page, base_url, make_user, seed_reference_data):
    reporter, reporter_pw = make_user(role="analyst")
    ui_login(page, base_url, reporter, reporter_pw)
    page.click("button:has-text('Kural Tuning')")
    page.wait_for_selector("#tab-tuning.active")
    page.click("#tab-tuning button:has-text('+ Yeni Talep')")
    page.wait_for_selector("#tune-modal", state="visible")
    page.select_option("#tune-env", label=seed_reference_data["environment"])
    page.fill("#tune-rule-name", "E2E Approval Rule")
    page.fill("#tune-reason", "e2e approval chain test")
    page.fill("#tune-xsoar-case-id", "E2E-CASE-2")
    with page.expect_response(lambda r: r.url.endswith("/api/tune") and r.request.method == "POST"):
        page.click("#tune-modal button:has-text('Kaydet')")
    page.wait_for_selector("#tune-modal", state="hidden")

    senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
    page.click("a[href='/logout']")
    page.wait_for_url(re.compile(r".*/login"))
    ui_login(page, base_url, senior, senior_pw)
    page.click("button:has-text('Kural Tuning')")
    page.wait_for_selector("#tab-tuning.active")

    row = page.locator("#tune-tbody tr", has_text="E2E Approval Rule")
    row.wait_for()
    row.get_by_role("button", name="Onayla / Reddet").click()
    page.wait_for_selector("#validate-modal", state="visible")

    with page.expect_response(lambda r: "/validate" in r.url and r.request.method == "POST") as resp_info:
        page.click("#validate-modal button:has-text('Onayla')")
    assert resp_info.value.status == 200

    page.wait_for_selector("#validate-modal", state="hidden")
    row = page.locator("#tune-tbody tr", has_text="E2E Approval Rule")
    row.wait_for()
    assert "Açık" in row.inner_text()
