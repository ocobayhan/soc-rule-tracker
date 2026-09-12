"""End-to-end Dashboard + Audit Log visual/rendering checks — explicitly
flagged as a Faz 3 follow-up (docs/PROGRESS.md, "Faz 3 devamı"). These two
screens have no dedicated module of their own to exercise through a create/
approve flow like Tune/UC/Hunt/Incident, so instead of driving business
logic this confirms the SPA actually renders live API data into the DOM —
regression coverage for real bugs found earlier this session in this exact
area (Faz B's dashboard bucket-hiding bug, B8's unescaped audit fallback)."""
from tests_e2e.conftest import ui_login


def test_dashboard_kpi_cards_render_live_counts_after_login(page, base_url, make_user):
    username, password = make_user(role="analyst")
    ui_login(page, base_url, username, password)

    page.wait_for_selector("#tab-dashboard.active")
    page.wait_for_function("document.getElementById('kpi-tune-total').textContent !== '—'")

    for kpi_id in ("kpi-tune-total", "kpi-uc-total", "kpi-hunt-total"):
        text = page.locator(f"#{kpi_id}").inner_text()
        assert text.isdigit(), f"#{kpi_id} should render a live numeric count, got {text!r}"


def test_audit_log_shows_create_tune_entry_with_mapped_action_label(page, base_url, make_user, seed_reference_data):
    """Login itself writes no audit row (app.py's login() has no write_audit
    call) — CREATE_TUNE is the simplest real action to generate one.

    Uses admin (not analyst) so the "Talep Eden" dropdown is free-choice
    rather than locked to self — it must be filled with a real `users` row
    (app.py list_analysts() reads `users`, not the separate, unused
    `analysts` table `seed_reference_data` seeds for a different purpose),
    so the admin picks themselves."""
    username, password = make_user(role="admin")
    ui_login(page, base_url, username, password)

    page.click("button:has-text('Kural Tuning')")
    page.wait_for_selector("#tab-tuning.active")
    page.click("#tab-tuning button:has-text('+ Yeni Talep')")
    page.wait_for_selector("#tune-modal", state="visible")
    page.select_option("#tune-reporter", label=username)
    page.select_option("#tune-env", label=seed_reference_data["environment"])
    page.fill("#tune-rule-name", "E2E Audit Log Rule")
    page.fill("#tune-reason", "e2e audit log rendering check")
    page.fill("#tune-xsoar-case-id", "E2E-AUDIT-1")
    with page.expect_response(lambda r: r.url.endswith("/api/tune") and r.request.method == "POST"):
        page.click("#tune-modal button:has-text('Kaydet')")
    page.wait_for_selector("#tune-modal", state="hidden")

    page.click("button:has-text('Audit Log')")
    page.wait_for_selector("#tab-auditlog.active")

    row = page.locator("#audit-tbody tr", has_text="Tuning oluşturuldu")
    row.wait_for()
    text = row.first.inner_text()
    assert username in text
    # B8 regression (docs/PROGRESS.md, "Güvenlik Denetimi"): unmapped actions
    # used to fall back to a raw, unescaped string in innerHTML — this
    # confirms the audit badge cell renders real, mapped text, not "undefined".
    assert "undefined" not in text
