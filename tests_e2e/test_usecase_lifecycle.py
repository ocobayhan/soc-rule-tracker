"""End-to-end Use-Case lifecycle — same template as test_tune_lifecycle.py
(docs/PROGRESS.md, "Faz 3 devamı"), adapted for Use-Case's environment
tag-list widget (multi-select "+ Ekle" pattern instead of a plain <select>)."""
import re

from tests_e2e.conftest import ui_login


def test_create_usecase_via_modal_appears_in_list(page, base_url, make_user, seed_reference_data):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)

    page.click("button:has-text('Use-Case')")
    page.wait_for_selector("#tab-usecase.active")

    page.click("#tab-usecase button:has-text('+ Yeni Use-Case')")
    page.wait_for_selector("#uc-modal", state="visible")

    # "Talep Eden" is locked to the logged-in analyst (lockToSelf(), app.js
    # openUCModal) — only environment + description need filling.
    page.select_option("#uc-env-select", label=seed_reference_data["environment"])
    page.click("#uc-env-add-row button:has-text('+ Ekle')")
    page.fill("#uc-desc", "E2E Playwright use-case description")

    with page.expect_response(lambda r: r.url.endswith("/api/usecase") and r.request.method == "POST") as resp_info:
        page.click("#uc-modal button:has-text('Kaydet')")
    assert resp_info.value.status == 201

    page.wait_for_selector("#uc-modal", state="hidden")
    row = page.locator("#uc-tbody tr", has_text="E2E Playwright use-case description")
    row.wait_for()
    assert "Ön Onay Bekliyor" in row.inner_text()


def test_senior_can_approve_pending_validation_via_ui(page, base_url, make_user, seed_reference_data):
    reporter, reporter_pw = make_user(role="analyst")
    ui_login(page, base_url, reporter, reporter_pw)
    page.click("button:has-text('Use-Case')")
    page.wait_for_selector("#tab-usecase.active")
    page.click("#tab-usecase button:has-text('+ Yeni Use-Case')")
    page.wait_for_selector("#uc-modal", state="visible")
    page.select_option("#uc-env-select", label=seed_reference_data["environment"])
    page.click("#uc-env-add-row button:has-text('+ Ekle')")
    page.fill("#uc-desc", "E2E UC approval chain test")
    with page.expect_response(lambda r: r.url.endswith("/api/usecase") and r.request.method == "POST"):
        page.click("#uc-modal button:has-text('Kaydet')")
    page.wait_for_selector("#uc-modal", state="hidden")

    senior, senior_pw = make_user(role="analyst", tier="Kıdemli Analist")
    page.click("a[href='/logout']")
    page.wait_for_url(re.compile(r".*/login"))
    ui_login(page, base_url, senior, senior_pw)
    page.click("button:has-text('Use-Case')")
    page.wait_for_selector("#tab-usecase.active")

    row = page.locator("#uc-tbody tr", has_text="E2E UC approval chain test")
    row.wait_for()
    row.get_by_role("button", name="Onayla / Reddet").click()
    page.wait_for_selector("#validate-modal", state="visible")

    with page.expect_response(lambda r: "/validate" in r.url and r.request.method == "POST") as resp_info:
        page.click("#validate-modal button:has-text('Onayla')")
    assert resp_info.value.status == 200

    page.wait_for_selector("#validate-modal", state="hidden")
    row = page.locator("#uc-tbody tr", has_text="E2E UC approval chain test")
    row.wait_for()
    assert "Açık" in row.inner_text()
