import os
import uuid
from datetime import datetime
from functools import wraps

from flask import (Flask, g, jsonify, redirect, render_template, request,
                   session, url_for)
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
            role TEXT NOT NULL DEFAULT 'user',
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

    db.commit()

    # Idempotent column migrations
    for col in ["evidence_image", "resolution_image", "completed_at"]:
        if not _col_exists(db, "tune_requests", col):
            db.execute(f"ALTER TABLE tune_requests ADD COLUMN {col} TEXT")
    if not _col_exists(db, "usecase_requests", "completed_at"):
        db.execute("ALTER TABLE usecase_requests ADD COLUMN completed_at TEXT")
    if not _col_exists(db, "users", "role"):
        db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
    db.commit()

    # Seed users
    if not db.execute("SELECT id FROM users WHERE username='admin'").fetchone():
        db.execute("INSERT INTO users (username,password_hash,role) VALUES (?,?,?)",
                   ("admin", generate_password_hash("Admin123!"), "user"))
    if not db.execute("SELECT id FROM users WHERE username='settings'").fetchone():
        db.execute("INSERT INTO users (username,password_hash,role) VALUES (?,?,?)",
                   ("settings", generate_password_hash("Settings123!"), "settings"))
    db.commit()

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
            session["role"]     = user["role"]
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
    is_settings = session.get("role") == "settings"
    return render_template("index.html",
                           username=session.get("username"),
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
# Analysts
# ---------------------------------------------------------------------------
@app.route("/api/analysts", methods=["GET"])
@login_required
def list_analysts():
    db = get_db()
    rows = db.execute("SELECT * FROM analysts ORDER BY name").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/analysts", methods=["POST"])
@login_required
@settings_required
def add_analyst():
    name = (request.json or {}).get("name", "").strip()
    if not name:
        return jsonify({"error": "İsim zorunludur"}), 400
    db = get_db()
    try:
        db.execute("INSERT INTO analysts (name) VALUES (?)", (name,))
        db.commit()
    except Exception:
        return jsonify({"error": "Bu analist zaten mevcut"}), 409
    row = db.execute("SELECT * FROM analysts WHERE name=?", (name,)).fetchone()
    return jsonify(dict(row)), 201

@app.route("/api/analysts/<int:analyst_id>", methods=["DELETE"])
@login_required
@settings_required
def delete_analyst(analyst_id):
    db = get_db()
    db.execute("DELETE FROM analysts WHERE id=?", (analyst_id,))
    db.commit()
    return jsonify({"ok": True})

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

    tune_open  = db.execute(f"SELECT COUNT(*) c FROM tune_requests WHERE status='Açık' {mf('created_at')}").fetchone()["c"]
    tune_done  = db.execute(f"SELECT COUNT(*) c FROM tune_requests WHERE status='Tamamlandı' {mf('completed_at')}").fetchone()["c"]
    tune_total = db.execute(f"SELECT COUNT(*) c FROM tune_requests WHERE 1=1 {mf('created_at')}").fetchone()["c"]
    uc_total   = db.execute(f"SELECT COUNT(*) c FROM usecase_requests WHERE 1=1 {mf('created_at')}").fetchone()["c"]
    uc_written = db.execute(f"SELECT COUNT(*) c FROM usecase_requests WHERE status='Yazıldı' {mf('completed_at')}").fetchone()["c"]

    return jsonify({
        "tune_open": tune_open,
        "tune_done_this_period": tune_done,
        "tune_total": tune_total,
        "uc_total": uc_total,
        "uc_written": uc_written,
        "conversion_rate": round(uc_written / uc_total * 100, 1) if uc_total else 0,
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
    return jsonify(dict(db.execute("SELECT * FROM tune_requests WHERE id=?", (cur.lastrowid,)).fetchone())), 201

@app.route("/api/tune/<int:item_id>", methods=["PUT"])
@login_required
def update_tune(item_id):
    data = request.json or {}
    db   = get_db()
    row  = db.execute("SELECT * FROM tune_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404

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
    return jsonify(dict(db.execute("SELECT * FROM tune_requests WHERE id=?", (item_id,)).fetchone()))

@app.route("/api/tune/<int:item_id>", methods=["DELETE"])
@login_required
def delete_tune(item_id):
    db = get_db()
    if not db.execute("SELECT id FROM tune_requests WHERE id=?", (item_id,)).fetchone():
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    db.execute("DELETE FROM tune_requests WHERE id=?", (item_id,))
    db.commit()
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
    return jsonify(dict(db.execute("SELECT * FROM usecase_requests WHERE id=?", (cur.lastrowid,)).fetchone())), 201

@app.route("/api/usecase/<int:item_id>", methods=["PUT"])
@login_required
def update_usecase(item_id):
    data = request.json or {}
    db   = get_db()
    row  = db.execute("SELECT * FROM usecase_requests WHERE id=?", (item_id,)).fetchone()
    if not row:
        return jsonify({"error": "Kayıt bulunamadı"}), 404

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
    return jsonify(dict(db.execute("SELECT * FROM usecase_requests WHERE id=?", (item_id,)).fetchone()))

@app.route("/api/usecase/<int:item_id>", methods=["DELETE"])
@login_required
def delete_usecase(item_id):
    db = get_db()
    if not db.execute("SELECT id FROM usecase_requests WHERE id=?", (item_id,)).fetchone():
        return jsonify({"error": "Kayıt bulunamadı"}), 404
    db.execute("DELETE FROM usecase_requests WHERE id=?", (item_id,))
    db.commit()
    return jsonify({"ok": True})

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
with app.app_context():
    init_db()

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 5000))
    app.run(host=host, port=port, debug=True)
