"""Fixtures for the Playwright end-to-end suite (Faz 3, docs/PROGRESS.md).

Unlike tests/conftest.py (Flask test_client — no real socket), Playwright
needs an actual HTTP server a browser can connect to. This starts the real
Flask app on a background thread bound to an ephemeral port, using the
SAME env-var-before-import isolation trick as tests/conftest.py so the
real tracker.db is never touched and no scheduler thread leaks.

IMPORTANT — run this suite SEPARATELY from tests/ (`pytest tests_e2e/`,
never `pytest tests/ tests_e2e/` in one invocation): `app.py` binds its
module-level DATABASE/UPLOAD_FOLDER/BACKUP_DIR globals (and runs init_db()
+ starts/skips the scheduler) at IMPORT time, once per Python process.
Whichever suite's conftest imports `app` first "wins" for the whole
process; the second suite's env vars are set too late to have any effect.
This is exactly why pytest.ini's `testpaths = tests` deliberately excludes
tests_e2e/ — a bare `pytest` never combines them by accident.
"""
import os
import threading
import uuid

import pytest
from werkzeug.security import generate_password_hash
from werkzeug.serving import make_server

E2E_XSOAR_TOKEN = "e2e-xsoar-token-not-a-real-secret"


class _ServerThread(threading.Thread):
    def __init__(self, flask_app, host="127.0.0.1", port=0):
        super().__init__(daemon=True)
        self.srv = make_server(host, port, flask_app)
        self.port = self.srv.server_port

    def run(self):
        self.srv.serve_forever()

    def shutdown(self):
        self.srv.shutdown()


@pytest.fixture(scope="session")
def live_server(tmp_path_factory):
    base = tmp_path_factory.mktemp("soc_tracker_e2e")
    os.environ["DATABASE"] = str(base / "tracker_e2e.db")
    os.environ["UPLOAD_FOLDER"] = str(base / "uploads")
    os.environ["BACKUP_DIR"] = str(base / "backups")
    os.environ["DISABLE_SCHEDULER"] = "1"
    os.environ["SECRET_KEY"] = "e2e-secret-key"
    os.environ["AUDIT_CHAIN_SECRET"] = "e2e-audit-chain-secret"
    os.environ["XSOAR_WEBHOOK_TOKEN"] = E2E_XSOAR_TOKEN

    import app as app_module  # import AFTER env vars are set — see module docstring

    server = _ServerThread(app_module.app)
    server.start()
    base_url = f"http://127.0.0.1:{server.port}"
    yield base_url
    server.shutdown()
    server.join(timeout=5)


@pytest.fixture(scope="session")
def base_url(live_server):
    """Overrides pytest-playwright's own `base_url` fixture so `page.goto("/login")`
    resolves against our live_server instead of requiring a --base-url flag."""
    return live_server


def _insert_user(role="analyst", tier="Analist"):
    import sqlite3
    username = f"e2e_{role}_{uuid.uuid4().hex[:8]}"
    password = "TestPass123"
    conn = sqlite3.connect(os.environ["DATABASE"])
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, tier, active, full_name) "
            "VALUES (?, ?, ?, ?, 'Evet', ?)",
            (username, generate_password_hash(password), role, tier, username),
        )
        conn.commit()
    finally:
        conn.close()
    return username, password


@pytest.fixture()
def make_user(live_server):
    """Factory fixture: make_user(role='analyst', tier='Analist') -> (username, password)."""
    def _make(role="analyst", tier="Analist"):
        return _insert_user(role=role, tier=tier)
    return _make


@pytest.fixture()
def seed_reference_data(live_server):
    """The #tune-env / #tune-reporter dropdowns are populated from the
    `environments`/`analysts` tables (app.py list_environments/list_
    analysts) — separate from `users` and empty by default. Seed one of
    each so the "+ Yeni Talep" form has something selectable."""
    import sqlite3
    conn = sqlite3.connect(os.environ["DATABASE"])
    try:
        conn.execute("INSERT OR IGNORE INTO environments (name) VALUES ('PROD')")
        conn.execute("INSERT OR IGNORE INTO analysts (name) VALUES ('e2e-reporter')")
        conn.commit()
    finally:
        conn.close()
    return {"environment": "PROD", "reporter": "e2e-reporter"}


def ui_login(page, base_url, username, password):
    page.goto(f"{base_url}/login")
    page.fill("#username", username)
    page.fill("#password", password)
    page.click("button[type=submit]")
    page.wait_for_url(f"{base_url}/")
