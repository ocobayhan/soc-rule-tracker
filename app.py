import os
import uuid
from datetime import datetime, date
from functools import wraps
from io import BytesIO

from flask import (Flask, g, jsonify, redirect, render_template, request,
                   send_file, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "soc-rule-tracker-dev-key-change-in-prod")

_BASE = os.path.dirname(os.path.abspath(__file__))
DATABASE      = os.environ.get("DATABASE",      os.path.join(_BASE, "tracker.db"))
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(_BASE, "static", "uploads"))
ALLOWED_EXT  = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------
def get_db():
    import sqlite3
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db:
        db.close()

def _col_exists(db, table, col):
    rows = db.execute(f"PRAGMA table_info({table})").fetchall()
    return any(r["name"] == col for r in rows)

def init_db():
    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'analyst',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id   INTEGER,
            username  TEXT NOT NULL,
            action    TEXT NOT NULL,
            record_type TEXT,
            record_id   INTEGER,
            detail    TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS environments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS analysts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS tune_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter TEXT NOT NULL,
            environment TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            tune_reason TEXT NOT NULL,
            trigger_frequency TEXT,
            tuning_analyst TEXT,
            how_tuned TEXT,
            status TEXT NOT NULL DEFAULT 'Açık',
            evidence_image TEXT,
            resolution_image TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS usecase_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester TEXT NOT NULL,
            usecase_description TEXT NOT NULL,
            environment TEXT NOT NULL,
            rule_name TEXT,
            rule_author TEXT,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'Açık',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS threat_hunt_requests (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            hunt_subject         TEXT NOT NULL,
            requester            TEXT NOT NULL DEFAULT '',
            assigned_analyst     TEXT DEFAULT '',
            notes                TEXT DEFAULT '',
            status               TEXT NOT NULL DEFAULT 'Açık',
            report_status        TEXT DEFAULT 'Taslak',
            hunt_environment     TEXT DEFAULT '',
            scope                TEXT DEFAULT '',
            scope_image          TEXT,
            mitre_techniques     TEXT DEFAULT '[]',
            has_findings         TEXT DEFAULT 'Hayır',
            findings             TEXT DEFAULT '',
            findings_image       TEXT,
            ioc_list             TEXT DEFAULT '[]',
            affected_assets      TEXT DEFAULT '',
            severity             TEXT DEFAULT '',
            detection_suggestion TEXT DEFAULT 'Hayır',
            detection_detail     TEXT DEFAULT '',
            recommendations      TEXT DEFAULT '',
            recommendations_image TEXT,
            related_requests     TEXT DEFAULT '[]',
            hunt_result          TEXT DEFAULT '',
            hunt_duration_hours  INTEGER DEFAULT NULL,
            started_at           TEXT,
            completed_at         TEXT,
            report_updated_at    TEXT,
            created_at           TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS mitre_cache (
            id     TEXT PRIMARY KEY,
            name   TEXT NOT NULL,
            tactic TEXT NOT NULL,
            url    TEXT DEFAULT ''
        )
    """)

    db.commit()

    # Idempotent column migrations
    for col in ["evidence_image", "resolution_image", "completed_at"]:
        if not _col_exists(db, "tune_requests", col):
            db.execute(f"ALTER TABLE tune_requests ADD COLUMN {col} TEXT")
    if not _col_exists(db, "usecase_requests", "completed_at"):
        db.execute("ALTER TABLE usecase_requests ADD COLUMN completed_at TEXT")
    if not _col_exists(db, "users", "role"):
        db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'analyst'")
    # Use-case MITRE columns
    for col, default in [("mitre_classified", "'Hayır'"), ("mitre_data", "'[]'")]:
        if not _col_exists(db, "usecase_requests", col):
            db.execute(f"ALTER TABLE usecase_requests ADD COLUMN {col} TEXT DEFAULT {default}")
    # Threat hunt new report columns (for existing deployments that have old schema)
    hunt_new_cols = [
        ("hunt_environment",     "''"),  ("has_findings",         "'Hayır'"),
        ("ioc_list",             "'[]'"), ("affected_assets",      "''"),
        ("severity",             "''"),  ("related_requests",     "'[]'"),
        ("hunt_duration_hours",  "NULL"),
    ]
    for col, default in hunt_new_cols:
        if not _col_exists(db, "threat_hunt_requests", col):
            db.execute(f"ALTER TABLE threat_hunt_requests ADD COLUMN {col} TEXT DEFAULT {default}")
    # Clear MITRE cache if it contains stale multi-tactic entries (force re-fetch with clean data)
    stale = db.execute("SELECT COUNT(*) c FROM mitre_cache WHERE tactic LIKE '%, %'").fetchone()["c"]
    if stale > 0:
        db.execute("DELETE FROM mitre_cache")

    # Migrate legacy 'user' role → 'admin'
    db.execute("UPDATE users SET role='admin' WHERE role='user'")
    db.commit()

    # Seed users
    if not db.execute("SELECT id FROM users WHERE username='admin'").fetchone():
        db.execute("INSERT INTO users (username,password_hash,role) VALUES (?,?,?)",
                   ("admin", generate_password_hash("Admin123!"), "admin"))
    if not db.execute("SELECT id FROM users WHERE username='settings'").fetchone():
        db.execute("INSERT INTO users (username,password_hash,role) VALUES (?,?,?)",
                   ("settings", generate_password_hash("Settings123!"), "settings"))
    db.commit()

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def next_available_id(db, table):
    """Return the smallest positive integer not currently used as an ID."""
    existing = {r[0] for r in db.execute(f"SELECT id FROM {table}").fetchall()}
    n = 1
    while n in existing:
        n += 1
    return n

def reset_seq_if_empty(db, table):
    """If table has no rows, reset its sqlite_sequence so next AUTOINCREMENT starts at 1."""
    c = db.execute(f"SELECT COUNT(*) c FROM {table}").fetchone()["c"]
    if c == 0:
        db.execute("DELETE FROM sqlite_sequence WHERE name=?", (table,))

def _parse_date(val):
    """Accept 'YYYY-MM-DDTHH:MM' (datetime-local) or 'YYYY-MM-DD HH:MM:SS'. Returns DB string or None."""
    if not val:
        return None
    val = str(val).strip().replace("T", " ")
    # Pad seconds if missing
    if len(val) == 16:
        val += ":00"
    try:
        datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
        return val
    except ValueError:
        return None

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Audit log helper
# ---------------------------------------------------------------------------
def write_audit(action, record_type=None, record_id=None, detail=""):
    """Write an audit entry for the currently authenticated session user."""
    try:
        db = get_db()
        db.execute(
            "INSERT INTO audit_log (user_id,username,action,record_type,record_id,detail,created_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (session.get("user_id"), session.get("username", "?"),
             action, record_type, record_id, detail,
             datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")),
        )
        db.commit()
    except Exception as e:
        app.logger.warning("Audit write failed: %s", e)

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated

def settings_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get("role") != "settings":
            return jsonify({"error": "Forbidden"}), 403
        return f(*args, **kwargs)
    return decorated

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
        if user and check_password_hash(user["password_hash"], password):
            session["user_id"]  = user["id"]
            session["username"] = user["username"]
            session["role"]     = user["role"]   # always fresh from DB
            return redirect(url_for("index"))
        error = "Kullanıcı adı veya şifre hatalı."
    return render_template("login.html", error=error)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/")
@login_required
def index():
    role = session.get("role", "analyst")
    is_settings = role == "settings"
    return render_template("index.html",
                           username=session.get("username"),
                           user_role=role,
                           is_settings=is_settings)

# ---------------------------------------------------------------------------
# File upload
# ---------------------------------------------------------------------------
@app.route("/api/upload", methods=["POST"])
@login_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "Dosya bulunamadı"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Dosya seçilmedi"}), 400
    ext = os.path.splitext(secure_filename(file.filename))[1].lower()
    if ext not in ALLOWED_EXT:
        return jsonify({"error": "Geçersiz dosya türü (jpg/png/gif/webp)"}), 400
    filename = str(uuid.uuid4()) + ext
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    return jsonify({"filename": filename, "url": f"/static/uploads/{filename}"})

# ---------------------------------------------------------------------------
# Environments
# ---------------------------------------------------------------------------
@app.route("/api/environments", methods=["GET"])
@login_required
def list_environments():
    db = get_db()
    rows = db.execute("SELECT * FROM environments ORDER BY name").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/environments", methods=["POST"])
@login_required
@settings_required
def add_environment():
    name = (request.json or {}).get("name", "").strip()
    if not name:
        return jsonify({"error": "İsim zorunludur"}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO environments (name) VALUES (?)", (name,))
        db.commit()
    except Exception:
        return jsonify({"error": "Bu ortam zaten mevcut"}), 409
    row = db.execute("SELECT * FROM environments WHERE name=?", (name,)).fetchone()
    return jsonify(dict(row)), 201

@app.route("/api/environments/<int:env_id>", methods=["DELETE"])
@login_required
@settings_required
def delete_environment(env_id):
    db = get_db()
    db.execute("DELETE FROM environments WHERE id=?", (env_id,))
    db.commit()
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Analysts — now served from the users table (role != settings)
# ---------------------------------------------------------------------------
@app.route("/api/analysts", methods=["GET"])
@login_required
def list_analysts():
    db   = get_db()
    rows = db.execute(
        "SELECT id, username AS name, role FROM users "
        "WHERE role != 'settings' ORDER BY username"
    ).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# MITRE ATT&CK cache
# ---------------------------------------------------------------------------
@app.route("/api/mitre")
@login_required
def get_mitre():
    db    = get_db()
    count = db.execute("SELECT COUNT(*) c FROM mitre_cache").fetchone()["c"]
    if count == 0:
        try:
            import urllib.request, json as _json
            url = ("https://raw.githubusercontent.com/mitre-attack/attack-stix-data"
                   "/master/enterprise-attack/enterprise-attack-16.1.json")
            req = urllib.request.Request(url, headers={"User-Agent": "SOC-Tracker/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = _json.loads(resp.read().decode())
            tactic_map = {}
            for obj in data.get("objects", []):
                if obj.get("type") == "x-mitre-tactic":
                    tactic_map[obj.get("x_mitre_shortname", "")] = obj.get("name", "")
            rows = []
            for obj in data.get("objects", []):
                if (obj.get("type") == "attack-pattern"
                        and not obj.get("x_mitre_deprecated", False)
                        and not obj.get("revoked", False)):
                    ext = obj.get("external_references", [])
                    tid = next((r["external_id"] for r in ext
                                if r.get("source_name") == "mitre-attack"), None)
                    if not tid:
                        continue
                    phases  = obj.get("kill_chain_phases", [])
                    tactic  = tactic_map.get(phases[0]["phase_name"], phases[0]["phase_name"]) if phases else ""
                    turl = next((r.get("url", "") for r in ext
                                 if r.get("source_name") == "mitre-attack"), "")
                    rows.append((tid, obj["name"], tactic, turl))
            rows.sort(key=lambda x: x[0])
            db.executemany(
                "INSERT OR IGNORE INTO mitre_cache (id, name, tactic, url) VALUES (?,?,?,?)",
                rows
            )
            db.commit()
        except Exception as e:
            app.logger.warning("MITRE fetch failed: %s", e)
            return jsonify([])
    rows = db.execute("SELECT id, name, tactic, url FROM mitre_cache ORDER BY id").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/mitre/refresh", methods=["POST"])
@login_required
def refresh_mitre():
    if session.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    get_db().execute("DELETE FROM mitre_cache")
    get_db().commit()
    return get_mitre()

# ---------------------------------------------------------------------------
# KPI
# ---------------------------------------------------------------------------
@app.route("/api/kpi")
@login_required
def get_kpi():
    month = request.args.get("month")
    db = get_db()

    def mf(col):
        return f"AND strftime('%Y-%m', {col}) = '{month}'" if month else ""

    tune_open   = db.execute(f"SELECT COUNT(*) c FROM tune_requests WHERE status='Açık' {mf('created_at')}").fetchone()["c"]
    tune_done   = db.execute(f"SELECT COUNT(*) c FROM tune_requests WHERE status='Tamamlandı' {mf('completed_at')}").fetchone()["c"]
    tune_total  = db.execute(f"SELECT COUNT(*) c FROM tune_requests WHERE 1=1 {mf('created_at')}").fetchone()["c"]
    uc_total    = db.execute(f"SELECT COUNT(*) c FROM usecase_requests WHERE 1=1 {mf('created_at')}").fetchone()["c"]
    uc_written  = db.execute(f"SELECT COUNT(*) c FROM usecase_requests WHERE status='Yazıldı' {mf('completed_at')}").fetchone()["c"]
    hunt_open   = db.execute(f"SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='Açık' {mf('created_at')}").fetchone()["c"]
    hunt_done   = db.execute(f"SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='Tamamlandı' {mf('completed_at')}").fetchone()["c"]

    return jsonify({
        "tune_open": tune_open,
        "tune_done_this_period": tune_done,
        "tune_total": tune_total,
        "uc_total": uc_total,
        "uc_written": uc_written,
        "conversion_rate": round(uc_written / uc_total * 100, 1) if uc_total else 0,
        "hunt_open": hunt_open,
        "hunt_done": hunt_done,
    })

# ---------------------------------------------------------------------------
# Tune requests
# ---------------------------------------------------------------------------
@app.route("/api/tune", methods=["GET"])
@login_required
def list_tune():
    db  = get_db()
    env    = request.args.get("environment", "")
    month  = request.args.get("month", "")
    status = request.args.get("status", "")
    q = "SELECT * FROM tune_requests WHERE 1=1"
    p = []
    if env:    q += " AND environment=?";                   p.append(env)
    if month:  q += " AND strftime('%Y-%m',created_at)=?";  p.append(month)
    if status: q += " AND status=?";                        p.append(status)
    q += " ORDER BY created_at DESC"
    return jsonify([dict(r) for r in db.execute(q, p).fetchall()])

@app.route("/api/tune", methods=["POST"])
@login_required
def create_tune():
    data = request.json or {}
    for f in ["reporter", "environment", "rule_name", "tune_reason"]:
        if not data.get(f, "").strip():
            return jsonify({"error": f"{f} zorunludur"}), 400
    # Analyst can only report as themselves
    if session.get("role") == "analyst":
        data["reporter"] = session.get("username")

    db  = get_db()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_id = next_available_id(db, "tune_requests")
    cur = db.execute("""
        INSERT INTO tune_requests
          (id,reporter,environment,rule_name,tune_reason,trigger_frequency,
           tuning_analyst,how_tuned,status,evidence_image,resolution_image,
           created_at,completed_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        new_id,
        data["reporter"].strip(), data["environment"].strip(),
        data["rule_name"].strip(), data["tune_reason"].strip(),
        data.get("trigger_frequency","").strip(),
        data.get("tuning_analyst","").strip(),
        data.get("how_tuned","").strip(),
        data.get("status","Açık"),
        data.get("evidence_image","") or None,
        data.get("resolution_image","") or None,
        now, None, now
    ))
    db.commit()
    new_row = db.execute("SELECT * FROM tune_requests WHERE id=?", (cur.lastrowid,)).fetchone()
    write_audit("CREATE_TUNE", "tune", new_row["id"],
                f"Kural: {new_row['rule_name']} | Ortam: {new_row['environment']}")
    return jsonify(dict(new_row)), 201

@app.route("/api/tune/<int:item_id>", methods=["PUT"])
@login_required
def update_tune(item_id):
    data = request.json or {}
    db   = get_db()
    row  = db.execute("SELECT * FROM tune_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404

    # ── Permission checks for analyst role ──────────────────────────────────
    role    = session.get("role", "analyst")
    uname   = session.get("username", "")
    if role == "analyst":
        cur_analyst = row["tuning_analyst"] or ""
        new_analyst = data.get("tuning_analyst", cur_analyst).strip()
        new_st      = data.get("status", row["status"])
        is_reporter = row["reporter"] == uname
        is_assigned = cur_analyst == uname

        # Must be the reporter OR the assigned analyst to edit at all
        if not is_reporter and not is_assigned:
            return jsonify({"error": "Sadece kendi raporladığınız veya size atanan talepleri düzenleyebilirsiniz."}), 403
        # Only the assigned analyst can change the analyst field
        # Exception: claiming an unassigned request (self-assign on empty slot) is always allowed
        if new_analyst != cur_analyst:
            is_claiming = (cur_analyst == "" and new_analyst == uname)
            if not is_assigned and not is_claiming:
                return jsonify({"error": "Atama alanını değiştirme yetkiniz yok."}), 403
            if new_analyst != uname:
                return jsonify({"error": "Sadece kendinize atama yapabilirsiniz."}), 403
        # Only the assigned analyst can close
        if new_st in ("Tamamlandı", "Tune Edilmedi") and not is_assigned:
            return jsonify({"error": "Sadece size atanan talepleri kapatabilirsiniz."}), 403
        # Reporter field is always preserved
        data["reporter"] = row["reporter"]
        # Rapor alanları yalnızca raporlayan tarafından değiştirilebilir
        if not is_reporter:
            for f in ("environment", "rule_name", "tune_reason", "trigger_frequency", "evidence_image"):
                data[f] = row[f]
        # Çalışma alanları yalnızca atanmış analist tarafından değiştirilebilir
        if not is_assigned:
            for f in ("how_tuned", "resolution_image"):
                data[f] = row[f]

    now       = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_status = data.get("status", row["status"])

    # completed_at: set when first reaching Tamamlandı, clear if reverted
    if new_status == "Tamamlandı" and not row["completed_at"]:
        completed_at = now
    elif new_status != "Tamamlandı":
        completed_at = None
    else:
        completed_at = row["completed_at"]

    # Settings role: allow manual date + ID overrides
    if role == "settings":
        created_at_val = _parse_date(data.get("created_at")) or row["created_at"]
        completed_at   = _parse_date(data.get("completed_at")) if "completed_at" in data else completed_at
        new_id_val     = int(data["new_id"]) if str(data.get("new_id","")).strip().isdigit() else item_id
        if new_id_val != item_id:
            conflict = db.execute("SELECT id FROM tune_requests WHERE id=?", (new_id_val,)).fetchone()
            if conflict:
                return jsonify({"error": f"ID {new_id_val} zaten kullanımda"}), 409
    else:
        created_at_val = row["created_at"]
        new_id_val     = item_id

    db.execute("""
        UPDATE tune_requests SET
          id=?,reporter=?,environment=?,rule_name=?,tune_reason=?,trigger_frequency=?,
          tuning_analyst=?,how_tuned=?,status=?,
          evidence_image=?,resolution_image=?,
          created_at=?,completed_at=?,updated_at=?
        WHERE id=?
    """, (
        new_id_val,
        data.get("reporter",        row["reporter"]).strip(),
        data.get("environment",     row["environment"]).strip(),
        data.get("rule_name",       row["rule_name"]).strip(),
        data.get("tune_reason",     row["tune_reason"]).strip(),
        data.get("trigger_frequency", row["trigger_frequency"] or "").strip(),
        data.get("tuning_analyst",  row["tuning_analyst"] or "").strip(),
        data.get("how_tuned",       row["how_tuned"] or "").strip(),
        new_status,
        data.get("evidence_image",    row["evidence_image"]) or None,
        data.get("resolution_image",  row["resolution_image"]) or None,
        created_at_val, completed_at, now, item_id
    ))
    db.commit()
    updated = db.execute("SELECT * FROM tune_requests WHERE id=?", (new_id_val,)).fetchone()
    # Determine audit action
    if new_status == "İnceleniyor" and data.get("tuning_analyst"):
        a_action = "CLAIM_TUNE"
        a_detail = f"Kural: {updated['rule_name']} | Analist: {updated['tuning_analyst']}"
    elif new_status in ("Tamamlandı", "Tune Edilmedi"):
        a_action = "CLOSE_TUNE"
        a_detail = f"Kural: {updated['rule_name']} | Durum: {new_status}"
    else:
        a_action = "EDIT_TUNE"
        a_detail = f"Kural: {updated['rule_name']}"
    write_audit(a_action, "tune", item_id, a_detail)
    return jsonify(dict(updated))

@app.route("/api/tune/<int:item_id>", methods=["DELETE"])
@login_required
def delete_tune(item_id):
    if session.get("role") == "analyst":
        return jsonify({"error": "Kayıt silmek için admin yetkisi gereklidir."}), 403
    db = get_db()
    row = db.execute("SELECT * FROM tune_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    db.execute("DELETE FROM tune_requests WHERE id=?", (item_id,))
    reset_seq_if_empty(db, "tune_requests")
    db.commit()
    write_audit("DELETE_TUNE", "tune", item_id, f"Kural: {row['rule_name']}")
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Use-case requests
# ---------------------------------------------------------------------------
@app.route("/api/usecase", methods=["GET"])
@login_required
def list_usecase():
    db  = get_db()
    env    = request.args.get("environment","")
    month  = request.args.get("month","")
    status = request.args.get("status","")
    q = "SELECT * FROM usecase_requests WHERE 1=1"
    p = []
    if env:    q += " AND INSTR(',' || environment || ',', ',' || ? || ',') > 0"; p.append(env)
    if month:  q += " AND strftime('%Y-%m',created_at)=?";  p.append(month)
    if status: q += " AND status=?";                        p.append(status)
    q += " ORDER BY created_at DESC"
    return jsonify([dict(r) for r in db.execute(q, p).fetchall()])

@app.route("/api/usecase", methods=["POST"])
@login_required
def create_usecase():
    data = request.json or {}
    # Normalize environment: accept array or string, store as comma-separated
    env_raw = data.get("environment", "")
    if isinstance(env_raw, list):
        data["environment"] = ",".join(e.strip() for e in env_raw if str(e).strip())
    else:
        data["environment"] = str(env_raw).strip()
    for f in ["requester","usecase_description","environment"]:
        if not data.get(f,"").strip():
            return jsonify({"error": f"{f} zorunludur"}), 400

    # Analyst can only request as themselves
    if session.get("role") == "analyst":
        data["requester"] = session.get("username")

    db  = get_db()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_id = next_available_id(db, "usecase_requests")
    cur = db.execute("""
        INSERT INTO usecase_requests
          (id,requester,usecase_description,environment,rule_name,rule_author,notes,
           status,created_at,completed_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (
        new_id,
        data["requester"].strip(), data["usecase_description"].strip(),
        data["environment"],
        data.get("rule_name","").strip(), data.get("rule_author","").strip(),
        data.get("notes","").strip(), data.get("status","Açık"),
        now, None, now
    ))
    db.commit()
    new_row = db.execute("SELECT * FROM usecase_requests WHERE id=?", (cur.lastrowid,)).fetchone()
    write_audit("CREATE_UC", "usecase", new_row["id"],
                f"Tanım: {new_row['usecase_description'][:80]} | Ortam: {new_row['environment']}")
    return jsonify(dict(new_row)), 201

@app.route("/api/usecase/<int:item_id>", methods=["PUT"])
@login_required
def update_usecase(item_id):
    data = request.json or {}
    # Normalize environment (may arrive as array from multi-select)
    env_raw = data.get("environment")
    if env_raw is not None:
        if isinstance(env_raw, list):
            data["environment"] = ",".join(e.strip() for e in env_raw if str(e).strip())
        else:
            data["environment"] = str(env_raw).strip()
    db   = get_db()
    row  = db.execute("SELECT * FROM usecase_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404

    # ── Permission checks for analyst role ──────────────────────────────────
    role    = session.get("role", "analyst")
    uname   = session.get("username", "")
    if role == "analyst":
        cur_author  = row["rule_author"] or ""
        new_author  = data.get("rule_author", cur_author).strip()
        new_st      = data.get("status", row["status"])
        is_requester = row["requester"] == uname
        is_assigned  = cur_author == uname

        # Must be the requester OR the assigned analyst to edit at all
        if not is_requester and not is_assigned:
            return jsonify({"error": "Sadece kendi talep ettiğiniz veya size atanan use-case'leri düzenleyebilirsiniz."}), 403
        # Only the assigned analyst can change the author field
        # Exception: claiming an unassigned request (self-assign on empty slot) is always allowed
        if new_author != cur_author:
            is_claiming = (cur_author == "" and new_author == uname)
            if not is_assigned and not is_claiming:
                return jsonify({"error": "Atama alanını değiştirme yetkiniz yok."}), 403
            if new_author != uname:
                return jsonify({"error": "Sadece kendinize atama yapabilirsiniz."}), 403
        # Only the assigned analyst can close
        if new_st in ("Yazıldı", "Yazılamaz") and not is_assigned:
            return jsonify({"error": "Sadece size atanan talepleri kapatabilirsiniz."}), 403
        # Requester field is always preserved
        data["requester"] = row["requester"]
        # Talep alanları yalnızca talep eden tarafından değiştirilebilir
        if not is_requester:
            for f in ("usecase_description", "environment"):
                data[f] = row[f]
        # Çalışma alanları yalnızca atanmış analist tarafından değiştirilebilir
        if not is_assigned:
            for f in ("rule_name", "notes", "mitre_classified", "mitre_data"):
                data[f] = row[f]

    now        = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_status = data.get("status", row["status"])

    if new_status == "Yazıldı" and not row["completed_at"]:
        completed_at = now
    elif new_status != "Yazıldı":
        completed_at = None
    else:
        completed_at = row["completed_at"]

    # Settings role: allow manual date + ID overrides
    uc_role = session.get("role", "analyst")
    if uc_role == "settings":
        uc_created_at  = _parse_date(data.get("created_at")) or row["created_at"]
        completed_at   = _parse_date(data.get("completed_at")) if "completed_at" in data else completed_at
        uc_new_id      = int(data["new_id"]) if str(data.get("new_id","")).strip().isdigit() else item_id
        if uc_new_id != item_id:
            conflict = db.execute("SELECT id FROM usecase_requests WHERE id=?", (uc_new_id,)).fetchone()
            if conflict:
                return jsonify({"error": f"ID {uc_new_id} zaten kullanımda"}), 409
    else:
        uc_created_at  = row["created_at"]
        uc_new_id      = item_id

    import json as _j
    def _jv_uc(key, fallback="[]"):
        v = data.get(key)
        if v is not None:
            return _j.dumps(v) if isinstance(v, (list, dict)) else str(v)
        return row[key] or fallback

    db.execute("""
        UPDATE usecase_requests SET
          id=?,requester=?,usecase_description=?,environment=?,rule_name=?,
          rule_author=?,notes=?,status=?,mitre_classified=?,mitre_data=?,
          created_at=?,completed_at=?,updated_at=?
        WHERE id=?
    """, (
        uc_new_id,
        data.get("requester",           row["requester"]).strip(),
        data.get("usecase_description", row["usecase_description"]).strip(),
        data.get("environment",         row["environment"] or ""),
        data.get("rule_name",           row["rule_name"] or "").strip(),
        data.get("rule_author",         row["rule_author"] or "").strip(),
        data.get("notes",               row["notes"] or "").strip(),
        new_status,
        data.get("mitre_classified",    row["mitre_classified"] if "mitre_classified" in row.keys() else "Hayır"),
        _jv_uc("mitre_data"),
        uc_created_at, completed_at, now, item_id
    ))
    db.commit()
    updated = db.execute("SELECT * FROM usecase_requests WHERE id=?", (uc_new_id,)).fetchone()
    if new_status == "İnceleniyor" and data.get("rule_author"):
        a_action = "CLAIM_UC"
        a_detail = f"Tanım: {updated['usecase_description'][:60]} | Analist: {updated['rule_author']}"
    elif new_status in ("Yazıldı", "Yazılamaz"):
        a_action = "CLOSE_UC"
        a_detail = f"Tanım: {updated['usecase_description'][:60]} | Durum: {new_status}"
    else:
        a_action = "EDIT_UC"
        a_detail = f"Tanım: {updated['usecase_description'][:60]}"
    write_audit(a_action, "usecase", item_id, a_detail)
    return jsonify(dict(updated))

@app.route("/api/usecase/<int:item_id>", methods=["DELETE"])
@login_required
def delete_usecase(item_id):
    if session.get("role") == "analyst":
        return jsonify({"error": "Kayıt silmek için admin yetkisi gereklidir."}), 403
    db = get_db()
    row = db.execute("SELECT * FROM usecase_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    db.execute("DELETE FROM usecase_requests WHERE id=?", (item_id,))
    reset_seq_if_empty(db, "usecase_requests")
    db.commit()
    write_audit("DELETE_UC", "usecase", item_id, f"Tanım: {row['usecase_description'][:60]}")
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Threat Hunt requests
# ---------------------------------------------------------------------------
@app.route("/api/hunt", methods=["GET"])
@login_required
def list_hunts():
    db  = get_db()
    p   = request.args
    q   = "SELECT * FROM threat_hunt_requests WHERE 1=1"
    args = []
    if p.get("month"):
        q += " AND strftime('%Y-%m', created_at)=?"; args.append(p["month"])
    if p.get("environment"):
        q += " AND environment=?"; args.append(p["environment"])
    if p.get("status"):
        q += " AND status=?"; args.append(p["status"])
    q += " ORDER BY id DESC"
    rows = db.execute(q, args).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/hunt", methods=["POST"])
@login_required
def create_hunt():
    data = request.json or {}
    now  = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    db   = get_db()

    hunt_subject = data.get("hunt_subject", "").strip()
    requester    = data.get("requester",    "").strip()

    if not hunt_subject or not requester:
        return jsonify({"error": "Hunt Konusu ve Talep Eden zorunludur."}), 400
    if session.get("role") == "analyst":
        requester = session.get("username", "")

    new_id = next_available_id(db, "threat_hunt_requests")
    cur = db.execute("""
        INSERT INTO threat_hunt_requests
          (id, hunt_subject, requester, assigned_analyst, notes, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, (new_id, hunt_subject, requester,
          data.get("assigned_analyst", "").strip(),
          data.get("notes", "").strip(), "Açık", now, now))
    db.commit()
    row = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (cur.lastrowid,)).fetchone()
    write_audit("CREATE_HUNT", "hunt", row["id"], f"Konu: {hunt_subject}")
    return jsonify(dict(row)), 201

@app.route("/api/hunt/<int:item_id>", methods=["GET"])
@login_required
def get_hunt(item_id):
    db  = get_db()
    row = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    return jsonify(dict(row))

@app.route("/api/hunt/<int:item_id>", methods=["PUT"])
@login_required
def update_hunt(item_id):
    data = request.json or {}
    db   = get_db()
    row  = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404

    role  = session.get("role", "analyst")
    uname = session.get("username", "")

    if role == "analyst":
        cur_analyst  = row["assigned_analyst"] or ""
        new_analyst  = data.get("assigned_analyst", cur_analyst).strip()
        new_st       = data.get("status", row["status"])
        is_requester = row["requester"] == uname
        is_assigned  = cur_analyst == uname

        if not is_requester and not is_assigned:
            return jsonify({"error": "Sadece kendi talep ettiğiniz veya size atanan hunt'ları düzenleyebilirsiniz."}), 403

        if new_analyst != cur_analyst:
            is_claiming = (cur_analyst == "" and new_analyst == uname)
            if not is_assigned and not is_claiming:
                return jsonify({"error": "Atama alanını değiştirme yetkiniz yok."}), 403
            if new_analyst != uname:
                return jsonify({"error": "Sadece kendinize atama yapabilirsiniz."}), 403

        if new_st in ("Tamamlandı", "İptal") and not is_assigned:
            return jsonify({"error": "Sadece size atanan hunt'ları kapatabilirsiniz."}), 403

        data["requester"] = row["requester"]
        if not is_requester:
            for f in ("hunt_subject",):
                data[f] = row[f]
        if not is_assigned:
            for f in ("hunt_environment", "scope", "scope_image",
                      "mitre_techniques", "has_findings",
                      "findings", "findings_image", "ioc_list", "affected_assets", "severity",
                      "detection_suggestion", "detection_detail",
                      "recommendations", "recommendations_image",
                      "related_requests", "hunt_result", "report_status"):
                data[f] = row[f]

    now        = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_status = data.get("status", row["status"])
    hunt_role  = session.get("role", "analyst")

    # started_at is NO LONGER set automatically on claim — use /start endpoint instead
    started_at = row["started_at"]

    if new_status in ("Tamamlandı", "İptal") and not row["completed_at"]:
        completed_at = now
    elif new_status not in ("Tamamlandı", "İptal"):
        completed_at = None
    else:
        completed_at = row["completed_at"]

    # Settings role: allow manual date + ID overrides
    if hunt_role == "settings":
        hunt_created_at    = _parse_date(data.get("created_at"))    or row["created_at"]
        started_at         = _parse_date(data.get("started_at"))    if "started_at"    in data else started_at
        completed_at       = _parse_date(data.get("completed_at"))  if "completed_at"  in data else completed_at
        report_updated_at_override = _parse_date(data.get("report_updated_at")) if "report_updated_at" in data else None
        hunt_new_id        = int(data["new_id"]) if str(data.get("new_id","")).strip().isdigit() else item_id
        if hunt_new_id != item_id:
            conflict = db.execute("SELECT id FROM threat_hunt_requests WHERE id=?", (hunt_new_id,)).fetchone()
            if conflict:
                return jsonify({"error": f"ID {hunt_new_id} zaten kullanımda"}), 409
    else:
        hunt_created_at            = row["created_at"]
        report_updated_at_override = None
        hunt_new_id                = item_id

    report_fields = ("hunt_environment", "scope", "mitre_techniques", "has_findings",
                     "findings", "ioc_list", "affected_assets", "severity",
                     "detection_suggestion", "detection_detail", "recommendations",
                     "hunt_result", "report_status", "related_requests",
                     "scope_image", "findings_image", "recommendations_image",
                     "hunt_duration_hours")
    report_changed = any(
        str(data.get(f) if data.get(f) is not None else row[f] or "") != str(row[f] or "")
        for f in report_fields
    )
    report_updated_at = (report_updated_at_override or now) if report_changed else (report_updated_at_override or row["report_updated_at"])

    def sv(key, fallback=""):
        v = data.get(key)
        return str(v).strip() if v is not None else (row[key] or fallback)

    def nv(key):
        return data[key] or None if key in data else row[key]

    def jv(key, fallback="[]"):
        """JSON field — store as-is string."""
        v = data.get(key)
        if v is not None:
            import json as _j
            return _j.dumps(v) if isinstance(v, (list, dict)) else str(v)
        return row[key] or fallback

    # hunt_duration_hours: integer or None
    dur_raw = data.get("hunt_duration_hours")
    if dur_raw is not None and str(dur_raw).strip() != "":
        try:
            hunt_duration_hours = int(dur_raw)
        except (ValueError, TypeError):
            hunt_duration_hours = row["hunt_duration_hours"]
    else:
        hunt_duration_hours = row["hunt_duration_hours"]

    db.execute("""
        UPDATE threat_hunt_requests SET
          id=?,
          hunt_subject=?, requester=?, assigned_analyst=?, notes=?, status=?,
          hunt_environment=?, scope=?, scope_image=?,
          mitre_techniques=?, has_findings=?,
          findings=?, findings_image=?, ioc_list=?, affected_assets=?, severity=?,
          detection_suggestion=?, detection_detail=?,
          recommendations=?, recommendations_image=?,
          related_requests=?, hunt_result=?, report_status=?,
          hunt_duration_hours=?,
          created_at=?, started_at=?, completed_at=?, report_updated_at=?, updated_at=?
        WHERE id=?
    """, (
        hunt_new_id,
        sv("hunt_subject"), sv("requester"), sv("assigned_analyst"), sv("notes"), new_status,
        sv("hunt_environment"), sv("scope"), nv("scope_image"),
        jv("mitre_techniques"), sv("has_findings", "Hayır"),
        sv("findings"), nv("findings_image"), jv("ioc_list"), sv("affected_assets"), sv("severity"),
        sv("detection_suggestion", "Hayır"), sv("detection_detail"),
        sv("recommendations"), nv("recommendations_image"),
        jv("related_requests"), sv("hunt_result"), sv("report_status", "Taslak"),
        hunt_duration_hours,
        hunt_created_at,
        started_at, completed_at, report_updated_at, now, item_id
    ))
    db.commit()
    updated = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (hunt_new_id,)).fetchone()

    if new_status == "İnceleniyor" and data.get("assigned_analyst") and not row["assigned_analyst"]:
        a_action = "CLAIM_HUNT"
        a_detail = f"Konu: {updated['hunt_subject']} | Analist: {updated['assigned_analyst']}"
    elif new_status in ("Tamamlandı", "İptal"):
        a_action = "CLOSE_HUNT"
        a_detail = f"Konu: {updated['hunt_subject']} | Durum: {new_status}"
    elif report_changed:
        a_action = "REPORT_HUNT"
        a_detail = f"Konu: {updated['hunt_subject']}"
    else:
        a_action = "EDIT_HUNT"
        a_detail = f"Konu: {updated['hunt_subject']}"
    write_audit(a_action, "hunt", item_id, a_detail)
    return jsonify(dict(updated))

@app.route("/api/hunt/<int:item_id>", methods=["DELETE"])
@login_required
def delete_hunt(item_id):
    if session.get("role") == "analyst":
        return jsonify({"error": "Kayıt silmek için admin yetkisi gereklidir."}), 403
    db  = get_db()
    row = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    db.execute("DELETE FROM threat_hunt_requests WHERE id=?", (item_id,))
    reset_seq_if_empty(db, "threat_hunt_requests")
    db.commit()
    write_audit("DELETE_HUNT", "hunt", item_id, f"Konu: {row['hunt_subject']}")
    return jsonify({"ok": True})

@app.route("/api/hunt/<int:item_id>/start", methods=["POST"])
@login_required
def start_hunt(item_id):
    """Mark hunt as officially started (sets started_at). Called via 'Başla' button."""
    db  = get_db()
    row = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    role  = session.get("role", "analyst")
    uname = session.get("username", "")
    if role == "analyst" and row["assigned_analyst"] != uname:
        return jsonify({"error": "Sadece size atanan hunt'ı başlatabilirsiniz."}), 403
    if row["started_at"]:
        return jsonify({"error": "Hunt zaten başlatılmış."}), 400
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    db.execute("UPDATE threat_hunt_requests SET started_at=?, updated_at=? WHERE id=?",
               (now, now, item_id))
    db.commit()
    updated = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (item_id,)).fetchone()
    write_audit("START_HUNT", "hunt", item_id, f"Konu: {row['hunt_subject']}")
    return jsonify(dict(updated))

# ---------------------------------------------------------------------------
# User management  (settings role only)
# ---------------------------------------------------------------------------
@app.route("/api/users", methods=["GET"])
@login_required
@settings_required
def list_users():
    db = get_db()
    rows = db.execute(
        "SELECT id, username, role, created_at FROM users "
        "WHERE role != 'settings' ORDER BY username"
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/users", methods=["POST"])
@login_required
@settings_required
def create_user():
    data     = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    role     = data.get("role", "analyst")
    if not username or not password:
        return jsonify({"error": "Kullanıcı adı ve şifre zorunludur"}), 400
    if role not in ("admin", "analyst"):
        return jsonify({"error": "Geçersiz rol (admin veya analyst olmalı)"}), 400
    if len(password) < 6:
        return jsonify({"error": "Şifre en az 6 karakter olmalıdır"}), 400
    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (username,password_hash,role) VALUES (?,?,?)",
            (username, generate_password_hash(password), role)
        )
        db.commit()
    except Exception:
        return jsonify({"error": "Bu kullanıcı adı zaten mevcut"}), 409
    user = db.execute(
        "SELECT id,username,role,created_at FROM users WHERE username=?", (username,)
    ).fetchone()
    write_audit("CREATE_USER", "user", user["id"], f"Kullanıcı: {username} | Rol: {role}")
    return jsonify(dict(user)), 201

@app.route("/api/users/<int:user_id>", methods=["PUT"])
@login_required
@settings_required
def update_user(user_id):
    data = request.json or {}
    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    if user["role"] == "settings":
        return jsonify({"error": "Settings kullanıcısı düzenlenemez"}), 403

    new_role = data.get("role", user["role"])
    if new_role not in ("admin", "analyst"):
        return jsonify({"error": "Geçersiz rol (admin veya analyst olmalı)"}), 400

    new_password = data.get("password", "").strip()
    if new_password:
        if len(new_password) < 6:
            return jsonify({"error": "Şifre en az 6 karakter olmalıdır"}), 400
        db.execute(
            "UPDATE users SET role=?, password_hash=? WHERE id=?",
            (new_role, generate_password_hash(new_password), user_id)
        )
    else:
        db.execute("UPDATE users SET role=? WHERE id=?", (new_role, user_id))
    db.commit()

    audit_parts = []
    if new_role != user["role"]:
        audit_parts.append(f"Rol: {user['role']} → {new_role}")
    if new_password:
        audit_parts.append("Şifre değiştirildi")
    write_audit("EDIT_USER", "user", user_id,
                f"Kullanıcı: {user['username']} | " + " | ".join(audit_parts))
    updated = db.execute("SELECT id,username,role,created_at FROM users WHERE id=?", (user_id,)).fetchone()
    return jsonify(dict(updated))

@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@login_required
@settings_required
def delete_user(user_id):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    if user["role"] == "settings":
        return jsonify({"error": "Settings kullanıcısı silinemez"}), 403
    db.execute("DELETE FROM users WHERE id=?", (user_id,))
    db.commit()
    write_audit("DELETE_USER", "user", user_id, f"Kullanıcı: {user['username']}")
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------
@app.route("/api/audit")
@login_required
def get_audit():
    if session.get("role") != "admin":
        return jsonify({"error": "Forbidden"}), 403
    db    = get_db()
    limit = min(int(request.args.get("limit", 300)), 1000)
    rows  = db.execute(
        "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

# ---------------------------------------------------------------------------
# Export (Excel)
# ---------------------------------------------------------------------------
@app.route("/api/export")
@login_required
def export_data():
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment
        from openpyxl.utils import get_column_letter
    except ImportError:
        return jsonify({"error": "openpyxl kütüphanesi eksik. pip install openpyxl"}), 500

    db = get_db()
    exp_month = request.args.get("month", "").strip()  # e.g. "2024-01"
    wb = Workbook()

    HDR_FONT  = Font(bold=True, color="F7F7F7", size=10)
    HDR_FILL  = PatternFill("solid", fgColor="1C1C1C")
    HDR_ALIGN = Alignment(horizontal="left", vertical="center", wrap_text=False)
    CELL_ALIGN = Alignment(vertical="top", wrap_text=True)

    def write_headers(ws, headers):
        for ci, h in enumerate(headers, 1):
            c = ws.cell(row=1, column=ci, value=h)
            c.font, c.fill, c.alignment = HDR_FONT, HDR_FILL, HDR_ALIGN
        ws.row_dimensions[1].height = 22
        ws.freeze_panes = "A2"

    def auto_width(ws, min_w=8, max_w=60):
        for col in ws.columns:
            width = max(
                (len(str(cell.value)) for cell in col if cell.value),
                default=min_w
            )
            ws.column_dimensions[get_column_letter(col[0].column)].width = min(max(width + 2, min_w), max_w)

    def fmt_date(val):
        return val[:10] if val else ""

    # ── Sheet 1 : Tuning Talepleri ─────────────────────────────────────────
    ws1 = wb.active
    ws1.title = "Tuning Talepleri"
    tune_cols = ["ID", "Kural İsmi", "Ortam", "Raporlayan", "Tune Nedeni",
                 "Tetiklenme Sıklığı", "Tune Eden Analist", "Nasıl Tune Edildi",
                 "Durum", "Raporlandı", "Tamamlandı"]
    write_headers(ws1, tune_cols)

    tune_q = "SELECT * FROM tune_requests"
    tune_q += " WHERE strftime('%Y-%m',created_at)=?" if exp_month else " WHERE 1=1"
    tune_q += " ORDER BY id"
    for r in db.execute(tune_q, (exp_month,) if exp_month else ()).fetchall():
        row = [r["id"], r["rule_name"], r["environment"], r["reporter"],
               r["tune_reason"], r["trigger_frequency"] or "",
               r["tuning_analyst"] or "", r["how_tuned"] or "",
               r["status"], fmt_date(r["created_at"]), fmt_date(r["completed_at"])]
        ws1.append(row)
        for ci in range(1, len(tune_cols) + 1):
            ws1.cell(row=ws1.max_row, column=ci).alignment = CELL_ALIGN

    auto_width(ws1)

    # ── Sheet 2 : Use-Case Talepleri ───────────────────────────────────────
    ws2 = wb.create_sheet("Use-Case Talepleri")
    uc_cols = ["ID", "Use-Case Tanımı", "Ortam", "Talep Eden",
               "Analist", "Yazılan Kural Adı", "Notlar",
               "Durum", "Talep Tarihi", "Yazılma Tarihi"]
    write_headers(ws2, uc_cols)

    uc_q = "SELECT * FROM usecase_requests"
    uc_q += " WHERE strftime('%Y-%m',created_at)=?" if exp_month else " WHERE 1=1"
    uc_q += " ORDER BY id"
    for r in db.execute(uc_q, (exp_month,) if exp_month else ()).fetchall():
        row = [r["id"], r["usecase_description"], r["environment"], r["requester"],
               r["rule_author"] or "", r["rule_name"] or "", r["notes"] or "",
               r["status"], fmt_date(r["created_at"]), fmt_date(r["completed_at"])]
        ws2.append(row)
        for ci in range(1, len(uc_cols) + 1):
            ws2.cell(row=ws2.max_row, column=ci).alignment = CELL_ALIGN

    auto_width(ws2)

    # ── Sheet 3 : Threat Hunt Talepleri ───────────────────────────────────
    ws3 = wb.create_sheet("Threat Hunt Talepleri")
    hunt_cols = ["ID", "Hunt Konusu", "Ortam", "Talep Eden", "Atanan Analist",
                 "Durum", "Rapor Durumu", "Sonuç", "Şiddet",
                 "MITRE Teknikleri", "Bulgular", "IOC Listesi",
                 "Etkilenen Varlıklar", "Hedef & Kapsam",
                 "Detection Önerisi", "Öneriler",
                 "Talep Tarihi", "Başlama", "Tamamlanma"]
    write_headers(ws3, hunt_cols)

    hunt_q = "SELECT * FROM threat_hunt_requests"
    hunt_q += " WHERE strftime('%Y-%m',created_at)=?" if exp_month else " WHERE 1=1"
    hunt_q += " ORDER BY id"
    import json as _json
    for r in db.execute(hunt_q, (exp_month,) if exp_month else ()).fetchall():
        # Summarize MITRE entries to text
        try:
            mitre_list = _json.loads(r["mitre_techniques"] or "[]")
            mitre_txt  = ", ".join(e.get("id","") + " " + e.get("name","") for e in mitre_list if isinstance(e, dict))
        except Exception:
            mitre_txt  = r["mitre_techniques"] or ""
        try:
            ioc_list = _json.loads(r["ioc_list"] or "[]")
            ioc_txt  = ", ".join(ioc_list) if isinstance(ioc_list, list) else ""
        except Exception:
            ioc_txt  = ""
        env_val = r["hunt_environment"] if "hunt_environment" in r.keys() and r["hunt_environment"] else (r["environment"] if "environment" in r.keys() else "")
        row = [r["id"], r["hunt_subject"], env_val, r["requester"],
               r["assigned_analyst"] or "", r["status"],
               r["report_status"] or "", r["hunt_result"] or "",
               r["severity"] if "severity" in r.keys() else "",
               mitre_txt, r["findings"] or "", ioc_txt,
               r["affected_assets"] if "affected_assets" in r.keys() else "",
               r["scope"] or "",
               (r["detection_suggestion"] or "") + ((" — " + r["detection_detail"]) if r["detection_detail"] else ""),
               r["recommendations"] or "",
               fmt_date(r["created_at"]), fmt_date(r["started_at"]), fmt_date(r["completed_at"])]
        ws3.append(row)
        for ci in range(1, len(hunt_cols) + 1):
            ws3.cell(row=ws3.max_row, column=ci).alignment = CELL_ALIGN

    auto_width(ws3)

    # ── Sheet 4 : KPI Özeti ────────────────────────────────────────────────
    ws4 = wb.create_sheet("KPI Özeti")
    write_headers(ws4, ["Metrik", "Değer"])

    # Month-aware query helpers
    # mfc = filter on created_at, mfd = filter on completed_at
    _mf_args = (exp_month,) if exp_month else ()
    def qc(sql, extra=""):
        """Count with optional created_at month filter."""
        mf = f" AND strftime('%Y-%m',created_at)=?" if exp_month else ""
        return db.execute(sql + mf + extra, _mf_args).fetchone()["c"]
    def qd(sql, extra=""):
        """Count with optional completed_at month filter."""
        mf = f" AND strftime('%Y-%m',completed_at)=?" if exp_month else ""
        return db.execute(sql + mf + extra, _mf_args).fetchone()["c"]

    total_tune = qc("SELECT COUNT(*) c FROM tune_requests WHERE 1=1")
    total_hunt = qc("SELECT COUNT(*) c FROM threat_hunt_requests WHERE 1=1")

    kpi_rows = []
    if exp_month:
        kpi_rows.append(("Dönem", exp_month))
        kpi_rows.append(("", ""))
    kpi_rows += [
        ("── TUNING ──────────────────────", ""),
        ("Toplam Tuning Talebi",      total_tune),
        ("Açık",                      qc("SELECT COUNT(*) c FROM tune_requests WHERE status='Açık'")),
        ("İnceleniyor",               qc("SELECT COUNT(*) c FROM tune_requests WHERE status='İnceleniyor'")),
        ("Tamamlandı",                qd("SELECT COUNT(*) c FROM tune_requests WHERE status='Tamamlandı'")),
        ("Tune Edilmedi",             qd("SELECT COUNT(*) c FROM tune_requests WHERE status='Tune Edilmedi'")),
        ("", ""),
        ("── USE-CASE ────────────────────", ""),
    ]
    total_uc   = qc("SELECT COUNT(*) c FROM usecase_requests WHERE 1=1")
    written_uc = qd("SELECT COUNT(*) c FROM usecase_requests WHERE status='Yazıldı'")
    kpi_rows  += [
        ("Toplam Use-Case Talebi",    total_uc),
        ("Açık",                      qc("SELECT COUNT(*) c FROM usecase_requests WHERE status='Açık'")),
        ("İnceleniyor",               qc("SELECT COUNT(*) c FROM usecase_requests WHERE status='İnceleniyor'")),
        ("Yazıldı",                   written_uc),
        ("Yazılamaz",                 qd("SELECT COUNT(*) c FROM usecase_requests WHERE status='Yazılamaz'")),
        ("Dönüşüm Oranı (%)",         round(written_uc / total_uc * 100, 1) if total_uc else 0),
        ("", ""),
        ("── THREAT HUNT ─────────────────", ""),
        ("Toplam Hunt Talebi",        total_hunt),
        ("Açık",                      qc("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='Açık'")),
        ("İnceleniyor",               qc("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='İnceleniyor'")),
        ("Tamamlandı",                qd("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='Tamamlandı'")),
        ("İptal",                     qd("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='İptal'")),
        ("", ""),
        ("Dışa Aktarım Tarihi",       date.today().isoformat()),
    ]
    for label, val in kpi_rows:
        ws4.append([label, val])

    auto_width(ws4)

    # ── Serve ──────────────────────────────────────────────────────────────
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)

    period_suffix = f"_{exp_month}" if exp_month else ""
    filename = f"SOC_RuleTracker{period_suffix}_{date.today().isoformat()}.xlsx"
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename,
    )

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
with app.app_context():
    init_db()

if __name__ == "__main__":
    host  = os.environ.get("HOST", "127.0.0.1")
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
