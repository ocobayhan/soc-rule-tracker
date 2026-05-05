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

DATABASE     = os.path.join(os.path.dirname(__file__), "tracker.db")
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "static", "uploads")
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
            environment          TEXT NOT NULL DEFAULT '',
            requester            TEXT NOT NULL DEFAULT '',
            assigned_analyst     TEXT DEFAULT '',
            notes                TEXT DEFAULT '',
            status               TEXT NOT NULL DEFAULT 'Açık',
            report_status        TEXT DEFAULT 'Taslak',
            scope                TEXT DEFAULT '',
            scope_image          TEXT,
            method               TEXT DEFAULT '',
            method_image         TEXT,
            findings             TEXT DEFAULT '',
            findings_image       TEXT,
            mitre_techniques     TEXT DEFAULT '',
            detection_suggestion TEXT DEFAULT 'Hayır',
            detection_detail     TEXT DEFAULT '',
            recommendations      TEXT DEFAULT '',
            recommendations_image TEXT,
            hunt_result          TEXT DEFAULT '',
            started_at           TEXT,
            completed_at         TEXT,
            report_updated_at    TEXT,
            created_at           TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
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
    cur = db.execute("""
        INSERT INTO tune_requests
          (reporter,environment,rule_name,tune_reason,trigger_frequency,
           tuning_analyst,how_tuned,status,evidence_image,resolution_image,
           created_at,completed_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
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

    db.execute("""
        UPDATE tune_requests SET
          reporter=?,environment=?,rule_name=?,tune_reason=?,trigger_frequency=?,
          tuning_analyst=?,how_tuned=?,status=?,
          evidence_image=?,resolution_image=?,
          completed_at=?,updated_at=?
        WHERE id=?
    """, (
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
        completed_at, now, item_id
    ))
    db.commit()
    updated = db.execute("SELECT * FROM tune_requests WHERE id=?", (item_id,)).fetchone()
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
    if env:    q += " AND environment=?";                   p.append(env)
    if month:  q += " AND strftime('%Y-%m',created_at)=?";  p.append(month)
    if status: q += " AND status=?";                        p.append(status)
    q += " ORDER BY created_at DESC"
    return jsonify([dict(r) for r in db.execute(q, p).fetchall()])

@app.route("/api/usecase", methods=["POST"])
@login_required
def create_usecase():
    data = request.json or {}
    for f in ["requester","usecase_description","environment"]:
        if not data.get(f,"").strip():
            return jsonify({"error": f"{f} zorunludur"}), 400

    # Analyst can only request as themselves
    if session.get("role") == "analyst":
        data["requester"] = session.get("username")

    db  = get_db()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cur = db.execute("""
        INSERT INTO usecase_requests
          (requester,usecase_description,environment,rule_name,rule_author,notes,
           status,created_at,completed_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        data["requester"].strip(), data["usecase_description"].strip(),
        data["environment"].strip(),
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
            for f in ("rule_name", "notes"):
                data[f] = row[f]

    now        = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_status = data.get("status", row["status"])

    if new_status == "Yazıldı" and not row["completed_at"]:
        completed_at = now
    elif new_status != "Yazıldı":
        completed_at = None
    else:
        completed_at = row["completed_at"]

    db.execute("""
        UPDATE usecase_requests SET
          requester=?,usecase_description=?,environment=?,rule_name=?,
          rule_author=?,notes=?,status=?,completed_at=?,updated_at=?
        WHERE id=?
    """, (
        data.get("requester",           row["requester"]).strip(),
        data.get("usecase_description", row["usecase_description"]).strip(),
        data.get("environment",         row["environment"]).strip(),
        data.get("rule_name",           row["rule_name"] or "").strip(),
        data.get("rule_author",         row["rule_author"] or "").strip(),
        data.get("notes",               row["notes"] or "").strip(),
        new_status, completed_at, now, item_id
    ))
    db.commit()
    updated = db.execute("SELECT * FROM usecase_requests WHERE id=?", (item_id,)).fetchone()
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
    environment  = data.get("environment",  "").strip()
    requester    = data.get("requester",    "").strip()

    if not hunt_subject or not environment or not requester:
        return jsonify({"error": "Hunt Konusu, Ortam ve Talep Eden zorunludur."}), 400
    if session.get("role") == "analyst":
        requester = session.get("username", "")

    cur = db.execute("""
        INSERT INTO threat_hunt_requests
          (hunt_subject, environment, requester, assigned_analyst, notes, status, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, (hunt_subject, environment, requester,
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
            for f in ("hunt_subject", "environment"):
                data[f] = row[f]
        if not is_assigned:
            for f in ("scope", "scope_image", "method", "method_image",
                      "findings", "findings_image", "mitre_techniques",
                      "detection_suggestion", "detection_detail",
                      "recommendations", "recommendations_image",
                      "hunt_result", "report_status"):
                data[f] = row[f]

    now        = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    new_status = data.get("status", row["status"])

    started_at = row["started_at"]
    if new_status == "İnceleniyor" and not started_at:
        started_at = now

    if new_status in ("Tamamlandı", "İptal") and not row["completed_at"]:
        completed_at = now
    elif new_status not in ("Tamamlandı", "İptal"):
        completed_at = None
    else:
        completed_at = row["completed_at"]

    report_fields = ("scope", "method", "findings", "mitre_techniques",
                     "detection_suggestion", "detection_detail", "recommendations",
                     "hunt_result", "report_status",
                     "scope_image", "method_image", "findings_image", "recommendations_image")
    report_changed = any(
        str(data.get(f) if data.get(f) is not None else row[f] or "") != str(row[f] or "")
        for f in report_fields
    )
    report_updated_at = now if report_changed else row["report_updated_at"]

    def sv(key, fallback=""):
        v = data.get(key)
        return str(v).strip() if v is not None else (row[key] or fallback)

    def nv(key):
        return data[key] or None if key in data else row[key]

    db.execute("""
        UPDATE threat_hunt_requests SET
          hunt_subject=?, environment=?, requester=?, assigned_analyst=?, notes=?, status=?,
          scope=?, scope_image=?, method=?, method_image=?,
          findings=?, findings_image=?, mitre_techniques=?,
          detection_suggestion=?, detection_detail=?,
          recommendations=?, recommendations_image=?,
          hunt_result=?, report_status=?,
          started_at=?, completed_at=?, report_updated_at=?, updated_at=?
        WHERE id=?
    """, (
        sv("hunt_subject"), sv("environment"), sv("requester"),
        sv("assigned_analyst"), sv("notes"), new_status,
        sv("scope"), nv("scope_image"), sv("method"), nv("method_image"),
        sv("findings"), nv("findings_image"), sv("mitre_techniques"),
        sv("detection_suggestion", "Hayır"), sv("detection_detail"),
        sv("recommendations"), nv("recommendations_image"),
        sv("hunt_result"), sv("report_status", "Taslak"),
        started_at, completed_at, report_updated_at, now, item_id
    ))
    db.commit()
    updated = db.execute("SELECT * FROM threat_hunt_requests WHERE id=?", (item_id,)).fetchone()

    if new_status == "İnceleniyor" and data.get("assigned_analyst") and not row["started_at"]:
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
    db.commit()
    write_audit("DELETE_HUNT", "hunt", item_id, f"Konu: {row['hunt_subject']}")
    return jsonify({"ok": True})

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

    for r in db.execute("SELECT * FROM tune_requests ORDER BY id").fetchall():
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

    for r in db.execute("SELECT * FROM usecase_requests ORDER BY id").fetchall():
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
                 "Durum", "Sonuç", "MITRE Teknikleri",
                 "Hedef & Kapsam", "Analiz Yöntemi", "Bulgular",
                 "Detection Önerisi", "Öneriler",
                 "Talep Tarihi", "Başlama", "Tamamlanma"]
    write_headers(ws3, hunt_cols)

    for r in db.execute("SELECT * FROM threat_hunt_requests ORDER BY id").fetchall():
        row = [r["id"], r["hunt_subject"], r["environment"], r["requester"],
               r["assigned_analyst"] or "", r["status"], r["hunt_result"] or "",
               r["mitre_techniques"] or "",
               r["scope"] or "", r["method"] or "", r["findings"] or "",
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

    def q(sql): return db.execute(sql).fetchone()["c"]

    total_tune = q("SELECT COUNT(*) c FROM tune_requests")
    total_hunt = q("SELECT COUNT(*) c FROM threat_hunt_requests")
    kpi_rows = [
        ("── TUNING ──────────────────────", ""),
        ("Toplam Tuning Talebi",      total_tune),
        ("Açık",                      q("SELECT COUNT(*) c FROM tune_requests WHERE status='Açık'")),
        ("İnceleniyor",               q("SELECT COUNT(*) c FROM tune_requests WHERE status='İnceleniyor'")),
        ("Tamamlandı",                q("SELECT COUNT(*) c FROM tune_requests WHERE status='Tamamlandı'")),
        ("Tune Edilmedi",             q("SELECT COUNT(*) c FROM tune_requests WHERE status='Tune Edilmedi'")),
        ("", ""),
        ("── USE-CASE ────────────────────", ""),
    ]
    total_uc   = q("SELECT COUNT(*) c FROM usecase_requests")
    written_uc = q("SELECT COUNT(*) c FROM usecase_requests WHERE status='Yazıldı'")
    kpi_rows  += [
        ("Toplam Use-Case Talebi",    total_uc),
        ("Açık",                      q("SELECT COUNT(*) c FROM usecase_requests WHERE status='Açık'")),
        ("İnceleniyor",               q("SELECT COUNT(*) c FROM usecase_requests WHERE status='İnceleniyor'")),
        ("Yazıldı",                   written_uc),
        ("Yazılamaz",                 q("SELECT COUNT(*) c FROM usecase_requests WHERE status='Yazılamaz'")),
        ("Dönüşüm Oranı (%)",         round(written_uc / total_uc * 100, 1) if total_uc else 0),
        ("", ""),
        ("── THREAT HUNT ─────────────────", ""),
        ("Toplam Hunt Talebi",        total_hunt),
        ("Açık",                      q("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='Açık'")),
        ("İnceleniyor",               q("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='İnceleniyor'")),
        ("Tamamlandı",                q("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='Tamamlandı'")),
        ("İptal",                     q("SELECT COUNT(*) c FROM threat_hunt_requests WHERE status='İptal'")),
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

    filename = f"SOC_RuleTracker_{date.today().isoformat()}.xlsx"
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
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 5000))
    app.run(host=host, port=port, debug=True)
