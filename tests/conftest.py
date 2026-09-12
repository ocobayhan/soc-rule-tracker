"""Pytest fixtures for the SOC Tracker test suite.

`app.py` has import-time side effects (schema migration, backup, and a
background job-scheduler thread all run at module load — not inside
`if __name__ == "__main__"`). This module MUST set the relevant
environment variables *before* `import app` executes, otherwise tests
would migrate/write to the real `tracker.db` and leave a scheduler
thread running. See docs/PROGRESS.md ("Faz 2: pytest test paketi").
"""
import os
import sqlite3
import uuid

import pytest
from werkzeug.security import generate_password_hash

TEST_XSOAR_TOKEN = "test-xsoar-token-not-a-real-secret"


@pytest.fixture(scope="session")
def flask_app(tmp_path_factory):
    base = tmp_path_factory.mktemp("soc_tracker_test")
    os.environ["DATABASE"] = str(base / "tracker_test.db")
    os.environ["UPLOAD_FOLDER"] = str(base / "uploads")
    os.environ["BACKUP_DIR"] = str(base / "backups")
    os.environ["DISABLE_SCHEDULER"] = "1"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["AUDIT_CHAIN_SECRET"] = "test-audit-chain-secret"
    os.environ["XSOAR_WEBHOOK_TOKEN"] = TEST_XSOAR_TOKEN
    os.environ.setdefault("FORCE_HTTPS", "0")

    import app as app_module  # import AFTER env vars are set — see module docstring

    return app_module


@pytest.fixture()
def client(flask_app):
    return flask_app.app.test_client()


@pytest.fixture()
def db_path(flask_app):
    return flask_app.DATABASE


def _insert_user(db_path, username, password, role="analyst", tier="Analist", active="Evet"):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, tier, active, full_name) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (username, generate_password_hash(password), role, tier, active, username),
        )
        conn.commit()
    finally:
        conn.close()


@pytest.fixture()
def make_user(db_path):
    """Factory fixture: make_user(role='analyst', tier='Analist') -> (username, password).

    Inserts directly into the DB (bypassing the `/api/users` endpoint, which
    itself requires an authenticated settings/admin session) so tests can
    freely create users of any role/tier without a bootstrapping chicken-
    and-egg problem.
    """
    created = []

    def _make(role="analyst", tier="Analist", active="Evet"):
        username = f"test_{role}_{uuid.uuid4().hex[:8]}"
        password = "TestPass123"
        _insert_user(db_path, username, password, role=role, tier=tier, active=active)
        created.append(username)
        return username, password

    return _make


def login(client, username, password):
    return client.post(
        "/login",
        data={"username": username, "password": password},
        follow_redirects=False,
    )


@pytest.fixture()
def admin_client(client):
    """The seeded default admin (created by init_db()) — see app.py."""
    login(client, "admin", "Admin123!")
    return client


@pytest.fixture()
def analyst_client(client, make_user):
    username, password = make_user(role="analyst", tier="Analist")
    login(client, username, password)
    return client, username
