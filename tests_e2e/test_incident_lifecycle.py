"""End-to-end Olay Raporu (Incident) lifecycle — same template as test_
tune_lifecycle.py (docs/PROGRESS.md, "Faz 3 devamı"), adapted for this
module's distinct shape: no reporter/ownership field, no upfront ön onay
gate (creation defaults straight to "Açıldı"), and two extra plain-button
transitions (İncelemeye Başla / Onaya Gönder) before it reaches the same
shared validate-modal component Tune/UC/Hunt use for their ön onay gate."""
from tests_e2e.conftest import ui_login


def test_create_incident_report_via_modal_appears_in_list(page, base_url, make_user):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)

    page.click("button:has-text('Olay Raporları')")
    page.wait_for_selector("#tab-incident.active")

    page.click("#tab-incident button:has-text('+ Yeni Olay Raporu')")
    page.wait_for_selector("#incident-edit-modal", state="visible")

    page.fill("#incident-edit-title", "E2E Playwright Incident")
    page.fill("#incident-section-list input[type=text]", "Özet")
    page.fill("#incident-section-list textarea", "e2e test — created via Playwright")

    with page.expect_response(lambda r: r.url.endswith("/api/incident-reports") and r.request.method == "POST") as resp_info:
        page.click("#incident-edit-modal button:has-text('Kaydet')")
    assert resp_info.value.status == 201

    page.wait_for_selector("#incident-edit-modal", state="hidden")
    row = page.locator("#incident-tbody tr", has_text="E2E Playwright Incident")
    row.wait_for()
    assert "Açıldı" in row.inner_text()


def test_senior_can_drive_full_pipeline_to_kapandi_via_ui(page, base_url, make_user):
    senior, senior_pw = make_user(role="analyst", tier="Müdür")
    ui_login(page, base_url, senior, senior_pw)
    page.click("button:has-text('Olay Raporları')")
    page.wait_for_selector("#tab-incident.active")
    page.click("#tab-incident button:has-text('+ Yeni Olay Raporu')")
    page.wait_for_selector("#incident-edit-modal", state="visible")
    page.fill("#incident-edit-title", "E2E Incident Approval")
    page.fill("#incident-section-list input[type=text]", "Özet")
    page.fill("#incident-section-list textarea", "e2e approval chain test")
    with page.expect_response(lambda r: r.url.endswith("/api/incident-reports") and r.request.method == "POST"):
        page.click("#incident-edit-modal button:has-text('Kaydet')")
    page.wait_for_selector("#incident-edit-modal", state="hidden")

    row = page.locator("#incident-tbody tr", has_text="E2E Incident Approval")
    row.wait_for()
    with page.expect_response(lambda r: "/start-review" in r.url and r.request.method == "POST") as resp_info:
        row.get_by_role("button", name="İncelemeye Başla").click()
    assert resp_info.value.status == 200
    row = page.locator("#incident-tbody tr", has_text="E2E Incident Approval")
    row.wait_for()
    assert "İncelemede" in row.inner_text()

    with page.expect_response(lambda r: "/submit-for-approval" in r.url and r.request.method == "POST") as resp_info:
        row.get_by_role("button", name="Onaya Gönder").click()
    assert resp_info.value.status == 200
    row = page.locator("#incident-tbody tr", has_text="E2E Incident Approval")
    row.wait_for()
    assert "Onay Bekliyor" in row.inner_text()

    row.get_by_role("button", name="Onayla / Reddet").click()
    page.wait_for_selector("#validate-modal", state="visible")
    with page.expect_response(lambda r: "/validate" in r.url and r.request.method == "POST") as resp_info:
        page.click("#validate-modal button:has-text('Onayla')")
    assert resp_info.value.status == 200

    page.wait_for_selector("#validate-modal", state="hidden")
    row = page.locator("#incident-tbody tr", has_text="E2E Incident Approval")
    row.wait_for()
    assert "Kapandı" in row.inner_text()
