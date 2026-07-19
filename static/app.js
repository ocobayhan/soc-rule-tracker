/* ============================================================
   SOC Tracker — Frontend  v18
   ============================================================ */

const IS_SETTINGS = !!document.getElementById("tab-settings");

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "dashboard")      loadDashboard();
    if (btn.dataset.tab === "tuning")         loadTune();
    if (btn.dataset.tab === "usecase")        loadUC();
    if (btn.dataset.tab === "threat-hunting") loadHunt();
    if (btn.dataset.tab === "settings")       loadSettings();
    if (btn.dataset.tab === "auditlog")       loadAuditLog();
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Sunucu hatası" }));
    throw new Error(err.error || "Sunucu hatası");
  }
  return res.json();
}

function fmtDate(iso) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

/** Show/hide settings-only date fields inside a modal by ID. */
function showSettingsDateFields(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.querySelectorAll(".settings-date-fields").forEach(el => {
    el.style.display = USER_ROLE === "settings" ? "block" : "none";
  });
}

/** Set a datetime-local input from a DB timestamp string "YYYY-MM-DD HH:MM:SS". */
function setDateTimeInput(inputId, dbVal) {
  const el = document.getElementById(inputId);
  if (!el) return;
  if (!dbVal) { el.value = ""; return; }
  // datetime-local format: "YYYY-MM-DDTHH:MM"
  el.value = String(dbVal).slice(0, 16).replace(" ", "T");
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Status & frequency badges
// ---------------------------------------------------------------------------
const STATUS_PENDING_VALIDATION = "Ön Onay Bekliyor";
const STATUS_REJECTED           = "Reddedildi";
const STATUS_HUNT_RESULT_PENDING = "Sonuç Onayı Bekliyor";

const TUNE_CLS = {
  "Ön Onay Bekliyor": "status-pending",
  "Açık":          "status-open",
  "İnceleniyor":   "status-reviewing",
  "Tune Edildi":   "status-tuned",
  "Tune Başarılı": "status-success",
  "Yeniden Tune":  "status-retry",
  "Tune Edilmedi": "status-skipped",
  "Reddedildi":    "status-rejected",
};
const TUNE_DOT = {
  "Ön Onay Bekliyor": "dot-pending",
  "Açık":          "dot-open",
  "İnceleniyor":   "dot-reviewing",
  "Tune Edildi":   "dot-tuned",
  "Tune Başarılı": "dot-success",
  "Yeniden Tune":  "dot-retry",
  "Tune Edilmedi": "dot-skipped",
  "Reddedildi":    "dot-rejected",
};
const UC_CLS = {
  "Ön Onay Bekliyor": "status-pending",
  "Açık":          "status-open",
  "İnceleniyor":   "status-reviewing",
  "Test Ediliyor": "status-testing",
  "Prod'da Aktif": "status-prod",
  "Yazılamaz":     "status-cant",
  "Reddedildi":    "status-rejected",
};
const UC_DOT = {
  "Ön Onay Bekliyor": "dot-pending",
  "Açık":          "dot-open",
  "İnceleniyor":   "dot-reviewing",
  "Test Ediliyor": "dot-testing",
  "Prod'da Aktif": "dot-prod",
  "Yazılamaz":     "dot-skipped",
  "Reddedildi":    "dot-rejected",
};

function badge(label, map) {
  return `<span class="badge ${map[label] || "status-skipped"}">${esc(label)}</span>`;
}
function dot(label, dotMap) {
  return `<span class="status-dot ${dotMap[label] || "dot-skipped"}"></span>`;
}

const FREQ_CLS = { "Düşük": "freq-low", "Orta": "freq-medium", "Yüksek": "freq-high" };
function freqBadge(val) {
  if (!val) return '<span class="text-muted">—</span>';
  return `<span class="freq-badge ${FREQ_CLS[val] || ""}">${esc(val)}</span>`;
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------
function openLightbox(url) {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  document.getElementById("lightbox-img").src = url;
  lb.style.display = "flex";
}

// ---------------------------------------------------------------------------
// Paste image capture
// ---------------------------------------------------------------------------
async function uploadBlob(blob, filename = "paste.png") {
  const fd = new FormData();
  fd.append("file", blob, filename);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Görsel yüklenemedi");
  return (await res.json()).filename;
}

function showPastePreview(filename, previewAreaId, hiddenId) {
  const area   = document.getElementById(previewAreaId);
  const hidden = document.getElementById(hiddenId);
  if (!area) return;
  const url = `/static/uploads/${filename}`;
  if (hidden) hidden.value = filename;
  area.innerHTML = `
    <div class="paste-thumb-wrap">
      <img class="paste-thumb" src="${url}" onclick="openLightbox('${url}')" title="Büyütmek için tıklayın"/>
      <button class="paste-thumb-remove" type="button"
        onclick="clearPastePreview('${previewAreaId}','${hiddenId}')">&#x2715;</button>
    </div>`;
}

function clearPastePreview(previewAreaId, hiddenId) {
  const area = document.getElementById(previewAreaId);
  if (area) area.innerHTML = "";
  const hid = document.getElementById(hiddenId);
  if (hid) hid.value = "";
}

function restorePreview(filename, previewAreaId, hiddenId) {
  if (!filename) return;
  showPastePreview(filename, previewAreaId, hiddenId);
}

// Attach paste listener to a textarea; captured image goes to previewAreaId / hiddenId
function setupPaste(textareaId, previewAreaId, hiddenId) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  el.addEventListener("paste", async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const img   = items.find(i => i.type.startsWith("image/"));
    if (!img) return;
    e.preventDefault();
    try {
      const blob     = img.getAsFile();
      const filename = await uploadBlob(blob);
      showPastePreview(filename, previewAreaId, hiddenId);
    } catch (err) {
      console.error("Paste upload failed:", err);
    }
  });
}

// ---------------------------------------------------------------------------
// Dropdown data
// ---------------------------------------------------------------------------
let _envs     = [];
let _analysts = [];

async function loadDropdownData() {
  [_envs, _analysts] = await Promise.all([
    apiFetch("/api/environments").catch(() => []),
    apiFetch("/api/analysts").catch(() => []),
  ]);
  populateEnvDropdowns();
  populateAnalystDropdowns();
}

function envOpts(cur = "") {
  return `<option value="">— Seçin —</option>` +
    _envs.map(e => `<option value="${esc(e.name)}"${e.name===cur?" selected":""}>${esc(e.name)}</option>`).join("");
}

function analystOpts(cur = "", allowEmpty = true) {
  const empty = allowEmpty ? `<option value="">— Seçin —</option>` : "";
  return empty + _analysts.map(a =>
    `<option value="${esc(a.name)}"${a.name===cur?" selected":""}>${esc(a.name)}</option>`
  ).join("");
}

function populateEnvDropdowns() {
  // Tune still uses plain selects
  ["tune-env","edit-tune-env"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value; el.innerHTML = envOpts(cur);
  });
  // UC + Hunt use tag-based selectors — populate their hidden selects
  const envOpsSimple = `<option value="">— Ortam seçin —</option>` +
    _envs.map(e => `<option value="${esc(e.name)}">${esc(e.name)}</option>`).join("");
  ["uc-env-select","edit-uc-env-select","hunt-report-env-select"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = envOpsSimple;
  });
  ["tune-filter-env","uc-filter-env"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value;
    el.innerHTML = `<option value="">Tüm Ortamlar</option>` +
      _envs.map(e => `<option value="${esc(e.name)}"${e.name===cur?" selected":""}>${esc(e.name)}</option>`).join("");
  });
}

function populateAnalystDropdowns() {
  ["tune-reporter","edit-tune-reporter","edit-tune-analyst",
   "claim-tune-analyst","uc-requester","edit-uc-requester",
   "edit-uc-rule-author","claim-uc-analyst",
   "hunt-requester","edit-hunt-requester","claim-hunt-analyst"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value; el.innerHTML = analystOpts(cur);
  });
}

// ---------------------------------------------------------------------------
// Excel Export
// ---------------------------------------------------------------------------
function exportExcel() {
  const month = document.getElementById("kpi-month")?.value || "";
  const url = month ? `/api/export?month=${encodeURIComponent(month)}` : "/api/export";
  window.location.href = url;
}

function openReport() {
  const month = document.getElementById("kpi-month")?.value || "";
  const url = month ? `/report?month=${encodeURIComponent(month)}` : "/report";
  window.open(url, "_blank");
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------
async function loadKPI() {
  const month = document.getElementById("kpi-month").value;
  try {
    const d = await apiFetch(`/api/kpi${month ? "?month="+month : ""}`);
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? "—"; };
    set("kpi-tune-total",     d.tune_total);
    set("kpi-tune-open",      d.tune_open);
    set("kpi-tune-pending",   d.tune_pending);
    set("kpi-tune-success",   d.tune_success);
    const rate = d.tune_success_rate ?? 0;
    set("kpi-tune-rate", rate + "%");
    const fill = document.getElementById("kpi-tune-rate-fill");
    if (fill) fill.style.width = Math.min(rate, 100) + "%";
    set("kpi-uc-total",       d.uc_total);
    set("kpi-uc-open",        d.uc_open);
    set("kpi-uc-testing",     d.uc_testing);
    set("kpi-uc-prod",        d.uc_prod);
    set("kpi-hunt-total",     d.hunt_total);
    set("kpi-hunt-open",      d.hunt_open);
    set("kpi-hunt-reviewing", d.hunt_reviewing);
    set("kpi-hunt-done",      d.hunt_done);
  } catch (_) {}
}

async function loadDashboardTables() {
  const empty = (n) => `<tr><td colspan="${n}" class="text-muted" style="padding:16px;text-align:center">Henüz kayıt yok.</td></tr>`;

  try {
    const rows = await apiFetch("/api/tune?");
    const tb   = document.getElementById("dash-tune-tbody");
    tb.innerHTML = rows.length
      ? rows.slice(0,6).map(r => `<tr>
          <td>${badge(r.status,TUNE_CLS)}</td>
          <td class="td-truncate">${esc(r.rule_name)}</td>
          <td class="text-muted">${esc(r.tuning_analyst || r.reporter)}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : empty(4);
  } catch (_) {}

  try {
    const rows = await apiFetch("/api/usecase?");
    const tb   = document.getElementById("dash-uc-tbody");
    tb.innerHTML = rows.length
      ? rows.slice(0,6).map(r => `<tr>
          <td>${badge(r.status,UC_CLS)}</td>
          <td class="td-truncate">${esc(r.usecase_description)}</td>
          <td class="text-muted">${esc(r.rule_author || r.requester)}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : empty(4);
  } catch (_) {}

  try {
    const rows = await apiFetch("/api/hunt");
    const tb   = document.getElementById("dash-hunt-tbody");
    if (!tb) return;
    tb.innerHTML = rows.length
      ? rows.slice(0,6).map(r => `<tr>
          <td>${badge(r.status,HUNT_CLS)}</td>
          <td class="td-truncate">${esc(r.hunt_subject)}</td>
          <td class="text-muted">${esc(r.assigned_analyst || r.requester)}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : empty(4);
  } catch (_) {}
}

function loadDashboard() { loadKPI(); loadDashboardTables(); }

// ---------------------------------------------------------------------------
// Backup (admin only)
// ---------------------------------------------------------------------------
async function loadBackupList() {
  const tb = document.getElementById("backup-tbody");
  if (!tb) return;
  try {
    const list = await apiFetch("/api/admin/backups");
    if (!list.length) {
      tb.innerHTML = `<tr><td colspan="4" class="text-muted" style="padding:16px;text-align:center">Henüz yedek yok.</td></tr>`;
      return;
    }
    tb.innerHTML = list.map(b => {
      const kb = (b.size / 1024).toFixed(0);
      return `<tr>
        <td style="font-family:monospace;font-size:11px">${esc(b.filename)}</td>
        <td class="text-muted">${kb} KB</td>
        <td class="text-muted">${esc(b.created_at)}</td>
        <td>
          <a href="/api/admin/backup/${encodeURIComponent(b.filename)}"
             class="btn-icon" title="İndir" download>&#8675;</a>
          <button class="btn-icon" title="Sil" style="color:var(--red)"
                  onclick="deleteBackup('${esc(b.filename)}')">&#10005;</button>
        </td>
      </tr>`;
    }).join("");
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="4" class="text-muted" style="padding:16px;text-align:center">Yüklenemedi.</td></tr>`;
  }
}

async function createBackup() {
  const msg = document.getElementById("backup-msg");
  msg.style.display = "block";
  msg.style.color = "var(--text-2)";
  msg.textContent = "Yedekleniyor…";
  try {
    const r = await apiFetch("/api/admin/backup", { method: "POST" });
    msg.style.color = "var(--green)";
    msg.textContent = `✓ Yedek oluşturuldu: ${r.filename}`;
    loadBackupList();
  } catch (e) {
    msg.style.color = "var(--red)";
    msg.textContent = `Hata: ${e.message}`;
  }
}

async function deleteBackup(filename) {
  if (!confirm(`"${filename}" yedeğini silmek istiyor musunuz?`)) return;
  try {
    await apiFetch(`/api/admin/backup/${encodeURIComponent(filename)}`, { method: "DELETE" });
    loadBackupList();
  } catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// Detail modals (read-only)
// ---------------------------------------------------------------------------
function detailRow(label, value, muted = false) {
  if (!value) value = "—";
  return `<div class="detail-row">
    <span class="detail-label">${label}</span>
    <span class="detail-value${!value || value==="—" ? " muted" : ""}">${esc(value)}</span>
  </div>`;
}

function detailImgRow(label, filenames) {
  const imgs = filenames.filter(Boolean);
  if (!imgs.length) return detailRow(label, "");
  const thumbs = imgs.map(f => {
    const url = `/static/uploads/${f}`;
    return `<img class="detail-img" src="${url}" onclick="openLightbox('${url}')" title="Büyütmek için tıklayın"/>`;
  }).join("");
  return `<div class="detail-row">
    <span class="detail-label">${label}</span>
    <div class="detail-value"><div class="detail-images">${thumbs}</div></div>
  </div>`;
}

function openTuneDetail(id) {
  const r = tuneRows.find(x => x.id === id); if (!r) return;
  const fmt = v => v ? v.slice(0,10) : "";
  document.getElementById("tune-detail-title").textContent = r.rule_name;
  document.getElementById("tune-detail-body").innerHTML = `<div class="detail-grid">
    ${detailRow("Raporlayan",        r.reporter)}
    ${detailRow("Ortam",             r.environment)}
    ${detailRow("Durum",             r.status)}
    ${r.validated_by ? detailRow("Ön Onay Veren",   r.validated_by)      : ""}
    ${r.validated_at ? detailRow("Ön Onay Tarihi",  fmt(r.validated_at)) : ""}
    ${r.validation_note ? detailRow("Ön Onay Notu", r.validation_note)   : ""}
    ${detailRow("Tetiklenme",        r.trigger_frequency)}
    ${detailRow("Tune Nedeni",       r.tune_reason)}
    ${detailImgRow("Kanıt Görseli",  [r.evidence_image])}
    ${detailRow("Tune Eden",         r.tuning_analyst)}
    ${detailRow("Nasıl Tune Edildi", r.how_tuned)}
    ${detailImgRow("Çözüm Görseli",  [r.resolution_image])}
    ${r.tuned_at     ? detailRow("Tune Tarihi",  fmt(r.tuned_at))     : ""}
    ${r.approved_by  ? detailRow("Onaylayan",    r.approved_by)       : ""}
    ${r.approved_at  ? detailRow("Onay Tarihi",  fmt(r.approved_at))  : ""}
    ${r.approval_note ? detailRow("Onay Notu",   r.approval_note)     : ""}
    ${r.qa_test_ok ? detailRow("Test Ortamında Sorunsuz", r.qa_test_ok) : ""}
    ${r.qa_peer_reviewed ? detailRow("Peer Review", r.qa_peer_reviewed) : ""}
    ${detailRow("Raporlandı",        fmt(r.created_at))}
    ${detailRow("Tamamlandı",        fmt(r.completed_at))}
  </div>`;
  document.getElementById("tune-detail-modal").style.display = "flex";
}

function openUCDetail(id) {
  const r = ucRows.find(x => x.id === id); if (!r) return;
  const fmt = v => v ? v.slice(0,10) : "";
  document.getElementById("uc-detail-title").textContent = r.usecase_description.slice(0, 60) + (r.usecase_description.length > 60 ? "…" : "");
  document.getElementById("uc-detail-body").innerHTML = `<div class="detail-grid">
    ${detailRow("Talep Eden",       r.requester)}
    ${detailRow("Ortam",            parseEnvStr(r.environment).join(", ") || r.environment)}
    ${detailRow("Durum",            r.status)}
    ${r.validated_by ? detailRow("Ön Onay Veren",   r.validated_by)      : ""}
    ${r.validated_at ? detailRow("Ön Onay Tarihi",  fmt(r.validated_at)) : ""}
    ${r.validation_note ? detailRow("Ön Onay Notu", r.validation_note)   : ""}
    ${detailRow("Use-Case",         r.usecase_description)}
    ${detailRow("Analist",          r.rule_author)}
    ${detailRow("Yazılan Kural",    r.rule_name)}
    ${detailRow("Notlar",           r.notes)}
    ${r.test_started_at  ? detailRow("Test Başlama",     fmt(r.test_started_at))  : ""}
    ${r.test_approved_by ? detailRow("Prod Onaylayan",   r.test_approved_by)      : ""}
    ${r.test_approved_at ? detailRow("Prod Onay Tarihi", fmt(r.test_approved_at)) : ""}
    ${r.test_notes       ? detailRow("Test Notları",     r.test_notes)            : ""}
    ${r.qa_test_ok ? detailRow("Test Ortamında Sorunsuz", r.qa_test_ok) : ""}
    ${r.qa_peer_reviewed ? detailRow("Peer Review", r.qa_peer_reviewed) : ""}
    ${detailRow("Talep Tarihi",     fmt(r.created_at))}
    ${detailRow("Tamamlandı",       fmt(r.completed_at))}
  </div>`;
  document.getElementById("uc-detail-modal").style.display = "flex";
}

// ---------------------------------------------------------------------------
// Cached rows for quick modal population
// ---------------------------------------------------------------------------
let tuneRows = [];
let ucRows   = [];

// ---------------------------------------------------------------------------
// Client-side sort & search state
// ---------------------------------------------------------------------------
let tuneSortCol = "id", tuneSortDir = 1;   // 1 = asc, -1 = desc
let ucSortCol   = "id", ucSortDir   = 1;

let tuneSearch = "";
let ucSearch   = "";

function onTuneSearch(val) { tuneSearch = val.toLowerCase(); renderTuneRows(); }
function onUCSearch(val)   { ucSearch   = val.toLowerCase(); renderUCRows();  }

// ---------------------------------------------------------------------------
// Role-aware select helpers
// lockToSelf  → analist için dropdown'u kendi adına kilitler
// freeSelect  → admin için dropdown'u serbest bırakır (mevcut değer korunur)
// ---------------------------------------------------------------------------
function lockToSelf(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="${esc(CURRENT_USER)}" selected>${esc(CURRENT_USER)}</option>`;
  el.disabled  = true;
}
function freeSelect(selectId, currentVal) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.disabled = false;
  if (currentVal !== undefined) el.value = currentVal;
}

function clientSort(rows, col, dir) {
  return [...rows].sort((a, b) => {
    const av = a[col] ?? "", bv = b[col] ?? "";
    if (col === "id") return dir * (Number(av) - Number(bv));
    return dir * String(av).localeCompare(String(bv), "tr", { sensitivity: "base" });
  });
}

function updateSortUI(prefix, activeCol, dir) {
  const cols = prefix === "tune"  ? ["id", "rule_name",          "status", "created_at"]
             : prefix === "hunt"  ? ["id", "hunt_subject",        "status", "created_at"]
             :                      ["id", "usecase_description", "status", "created_at"];
  cols.forEach(col => {
    const th    = document.getElementById(`th-${prefix}-${col}`);
    if (!th) return;
    const arrow = th.querySelector(".sort-arrow");
    const isActive = col === activeCol;
    if (arrow) arrow.textContent = isActive ? (dir === 1 ? "↑" : "↓") : "";
    th.classList.toggle("th-sorted", isActive);
  });
}

function sortTune(col) {
  tuneSortDir = tuneSortCol === col ? tuneSortDir * -1 : 1;
  tuneSortCol = col;
  renderTuneRows();
}

function sortUC(col) {
  ucSortDir = ucSortCol === col ? ucSortDir * -1 : 1;
  ucSortCol = col;
  renderUCRows();
}

// ---------------------------------------------------------------------------
// Tune list
// ---------------------------------------------------------------------------
function tuneActionBtns(r) {
  const isAdmin      = USER_ROLE === "admin" || USER_ROLE === "user" || USER_ROLE === "settings";
  const isMyTask     = r.tuning_analyst === CURRENT_USER;
  const isMyReport   = r.reporter === CURRENT_USER;

  const canEdit = isAdmin || isMyTask || isMyReport;
  const edit = canEdit
    ? `<button class="btn-icon" title="Düzenle" onclick="openTuneEditModal(${r.id})">&#9998;</button>`
    : "";
  const del = isAdmin
    ? `<button class="btn-icon danger" title="Sil" onclick="deleteTune(${r.id})">&#x1F5D1;</button>`
    : "";

  if (r.status === STATUS_PENDING_VALIDATION && IS_SENIOR)
    return `<button class="btn-action-claim" onclick="openValidateModal('tune',${r.id})">Onayla / Reddet</button> ${edit}${del}`;
  if (r.status === STATUS_PENDING_VALIDATION)
    return `${edit}${del}`;
  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openTuneClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor" && (isAdmin || isMyTask))
    return `<button class="btn-action-close" onclick="openTuneCloseModal(${r.id})">Kapat</button> ${edit}${del}`;
  if (r.status === "Tune Edildi" && IS_SENIOR) {
    const dl = r.approval_deadline ? r.approval_deadline.slice(0, 10) : "";
    const dlTip = dl ? ` title="Son: ${dl}"` : "";
    return `<button class="btn-action-close" onclick="openTuneApproveModal(${r.id})"${dlTip}>Onayla</button> ${edit}${del}`;
  }
  return `${edit}${del}`;
}

function renderTuneRows() {
  const TUNE_FIELDS = ["rule_name","tune_reason","reporter","environment","tuning_analyst","how_tuned"];
  const visible = tuneSearch
    ? tuneRows.filter(r => TUNE_FIELDS.some(f => r[f] && String(r[f]).toLowerCase().includes(tuneSearch)))
    : tuneRows;
  const sorted = clientSort(visible, tuneSortCol, tuneSortDir);
  updateSortUI("tune", tuneSortCol, tuneSortDir);
  const tbody = document.getElementById("tune-tbody");
  const empty = document.getElementById("tune-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td>${dot(r.status, TUNE_DOT)}</td>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.rule_name)}">
      <span class="cell-link" onclick="openTuneDetail(${r.id})" style="cursor:pointer">${esc(r.rule_name)}</span>
    </td>
    <td class="td-truncate">${esc(r.environment)}</td>
    <td class="td-truncate">${esc(r.reporter)}</td>
    <td class="td-truncate" title="${esc(r.tune_reason)}">${esc(r.tune_reason)}</td>
    <td>${freqBadge(r.trigger_frequency)}</td>
    <td class="td-truncate">${esc(r.tuning_analyst)||'<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, TUNE_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td class="text-muted">${fmtDate(r.completed_at)}</td>
    <td style="white-space:nowrap">${tuneActionBtns(r)}</td>
  </tr>`).join("");
}

async function loadTune() {
  const p = new URLSearchParams();
  const month  = document.getElementById("tune-filter-month").value;
  const env    = document.getElementById("tune-filter-env").value;
  const status = document.getElementById("tune-filter-status").value;
  if (month)  p.set("month", month);
  if (env)    p.set("environment", env);
  if (status) p.set("status", status);
  try {
    tuneRows = await apiFetch(`/api/tune?${p}`);
    renderTuneRows();
  } catch (e) { console.error(e); }
}

function clearTuneFilters() {
  ["tune-filter-month","tune-filter-env","tune-filter-status"].forEach(id => { document.getElementById(id).value = ""; });
  const s = document.getElementById("tune-search"); if (s) s.value = "";
  tuneSearch = "";
  loadTune();
}

// ---------------------------------------------------------------------------
// Tune — Create modal
// ---------------------------------------------------------------------------
function openTuneModal() {
  populateEnvDropdowns(); populateAnalystDropdowns();
  document.getElementById("tune-id").value       = "";
  document.getElementById("tune-env").value      = "";
  document.getElementById("tune-rule-name").value = "";
  document.getElementById("tune-reason").value   = "";
  document.getElementById("tune-freq").value     = "";
  // Raporlayan: analist sadece kendisi, admin seçebilir
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    lockToSelf("tune-reporter");
  } else {
    freeSelect("tune-reporter", "");
  }
  clearPastePreview("tune-evidence-preview","tune-evidence-image");
  document.getElementById("tune-modal-error").style.display = "none";
  document.getElementById("tune-modal").style.display = "flex";
}
function closeTuneModal() { document.getElementById("tune-modal").style.display = "none"; }

async function saveTune() {
  const errEl = document.getElementById("tune-modal-error");
  errEl.style.display = "none";
  const payload = {
    reporter:          document.getElementById("tune-reporter").value,
    environment:       document.getElementById("tune-env").value,
    rule_name:         document.getElementById("tune-rule-name").value.trim(),
    tune_reason:       document.getElementById("tune-reason").value.trim(),
    trigger_frequency: document.getElementById("tune-freq").value,
    status:            "Açık",
    evidence_image:    document.getElementById("tune-evidence-image").value || null,
  };
  try {
    await apiFetch("/api/tune", { method: "POST", body: JSON.stringify(payload) });
    closeTuneModal();
    loadTune(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Tune — Edit modal (corrections)
// ---------------------------------------------------------------------------
function openTuneEditModal(id) {
  const r = tuneRows.find(x => x.id === id); if (!r) return;
  populateEnvDropdowns(); populateAnalystDropdowns();
  document.getElementById("edit-tune-id").value        = r.id;
  document.getElementById("edit-tune-env").value       = r.environment || "";
  document.getElementById("edit-tune-rule-name").value = r.rule_name || "";
  document.getElementById("edit-tune-reason").value    = r.tune_reason || "";
  document.getElementById("edit-tune-freq").value      = r.trigger_frequency || "";
  document.getElementById("edit-tune-status").value    = r.status || "Açık";
  document.getElementById("edit-tune-how").value       = r.how_tuned || "";
  // Alan kilitleme: role ve sahipliğe göre
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    const isAssigned = r.tuning_analyst === CURRENT_USER;
    const isReporter = r.reporter       === CURRENT_USER;
    // Raporlayan her zaman kilitli
    lockToSelf("edit-tune-reporter");
    // Analist alanı: atanmışsa kendine kilitli, değilse salt okunur
    if (isAssigned) {
      lockToSelf("edit-tune-analyst");
    } else {
      const sel = document.getElementById("edit-tune-analyst");
      sel.innerHTML = `<option value="${esc(r.tuning_analyst||"")}">${esc(r.tuning_analyst||"—")}</option>`;
      sel.disabled  = true;
    }
    // Rapor alanları (raporlayan doldurur): yalnızca raporlayan düzenleyebilir
    ["edit-tune-env","edit-tune-rule-name","edit-tune-reason","edit-tune-freq"].forEach(id => {
      document.getElementById(id).disabled = !isReporter;
    });
    // Çalışma alanları (analist doldurur): yalnızca atanmış analist düzenleyebilir
    document.getElementById("edit-tune-how").disabled    = !isAssigned;
    document.getElementById("edit-tune-status").disabled = !isAssigned;
  } else {
    // Admin: tüm alanlar serbest
    ["edit-tune-env","edit-tune-rule-name","edit-tune-reason","edit-tune-freq",
     "edit-tune-how","edit-tune-status"].forEach(id => {
      document.getElementById(id).disabled = false;
    });
    freeSelect("edit-tune-reporter", r.reporter || "");
    freeSelect("edit-tune-analyst",  r.tuning_analyst || "");
    document.getElementById("edit-tune-analyst").disabled = false;
  }
  clearPastePreview("edit-tune-evidence-preview","edit-tune-evidence-image");
  clearPastePreview("edit-tune-resolution-preview","edit-tune-resolution-image");
  if (r.evidence_image)   restorePreview(r.evidence_image,   "edit-tune-evidence-preview",   "edit-tune-evidence-image");
  if (r.resolution_image) restorePreview(r.resolution_image, "edit-tune-resolution-preview", "edit-tune-resolution-image");
  // Settings: show ID + date fields
  showSettingsDateFields("tune-edit-modal");
  if (USER_ROLE === "settings") {
    document.getElementById("edit-tune-new-id").value = r.id;
    setDateTimeInput("edit-tune-created-at",   r.created_at);
    setDateTimeInput("edit-tune-completed-at", r.completed_at);
  }
  document.getElementById("tune-edit-modal-error").style.display = "none";
  document.getElementById("tune-edit-modal").style.display = "flex";
}
function closeTuneEditModal() { document.getElementById("tune-edit-modal").style.display = "none"; }

async function saveTuneEdit() {
  const id    = document.getElementById("edit-tune-id").value;
  const errEl = document.getElementById("tune-edit-modal-error");
  errEl.style.display = "none";
  const payload = {
    reporter:          document.getElementById("edit-tune-reporter").value,
    environment:       document.getElementById("edit-tune-env").value,
    rule_name:         document.getElementById("edit-tune-rule-name").value.trim(),
    tune_reason:       document.getElementById("edit-tune-reason").value.trim(),
    trigger_frequency: document.getElementById("edit-tune-freq").value,
    status:            document.getElementById("edit-tune-status").value,
    tuning_analyst:    document.getElementById("edit-tune-analyst").value,
    how_tuned:         document.getElementById("edit-tune-how").value.trim(),
    evidence_image:    document.getElementById("edit-tune-evidence-image").value || null,
    resolution_image:  document.getElementById("edit-tune-resolution-image").value || null,
    ...(USER_ROLE === "settings" ? {
      new_id:       document.getElementById("edit-tune-new-id").value       || undefined,
      created_at:   document.getElementById("edit-tune-created-at").value   || undefined,
      completed_at: document.getElementById("edit-tune-completed-at").value || undefined,
    } : {}),
  };
  try {
    await apiFetch(`/api/tune/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeTuneEditModal(); loadTune(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Tune — Claim (Üstlen)
// ---------------------------------------------------------------------------
function openTuneClaimModal(id) {
  populateAnalystDropdowns();
  document.getElementById("claim-tune-id").value = id;
  const sel = document.getElementById("claim-tune-analyst");
  if (USER_ROLE === "analyst") {
    sel.innerHTML  = `<option value="${esc(CURRENT_USER)}" selected>${esc(CURRENT_USER)}</option>`;
    sel.disabled   = true;
  } else {
    sel.disabled = false;
    sel.value    = "";
  }
  document.getElementById("claim-tune-error").style.display = "none";
  document.getElementById("tune-claim-modal").style.display = "flex";
}
function closeTuneClaimModal() { document.getElementById("tune-claim-modal").style.display = "none"; }

async function saveTuneClaim() {
  const id       = document.getElementById("claim-tune-id").value;
  const analyst  = document.getElementById("claim-tune-analyst").value;
  const errEl    = document.getElementById("claim-tune-error");
  errEl.style.display = "none";
  if (!analyst) { errEl.textContent = "Analist seçilmedi."; errEl.style.display = "block"; return; }
  try {
    await apiFetch(`/api/tune/${id}`, { method: "PUT",
      body: JSON.stringify({ tuning_analyst: analyst, status: "İnceleniyor" }) });
    closeTuneClaimModal(); loadTune(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Tune — Close (Kapat)
// ---------------------------------------------------------------------------
function openTuneCloseModal(id) {
  document.getElementById("close-tune-id").value  = id;
  document.getElementById("close-tune-how").value = "";
  document.getElementById("close-tune-status").value = "Tune Edildi";
  clearPastePreview("close-tune-img-preview","close-tune-resolution-image");
  document.getElementById("close-tune-error").style.display = "none";
  document.getElementById("tune-close-modal").style.display = "flex";
}
function closeTuneCloseModal() { document.getElementById("tune-close-modal").style.display = "none"; }

async function saveTuneClose() {
  const id    = document.getElementById("close-tune-id").value;
  const errEl = document.getElementById("close-tune-error");
  errEl.style.display = "none";
  const how = document.getElementById("close-tune-how").value.trim();
  if (!how) { errEl.textContent = "Açıklama girilmedi."; errEl.style.display = "block"; return; }
  const payload = {
    how_tuned:        how,
    status:           document.getElementById("close-tune-status").value,
    resolution_image: document.getElementById("close-tune-resolution-image").value || null,
  };
  try {
    await apiFetch(`/api/tune/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeTuneCloseModal(); loadTune(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function deleteTune(id) {
  if (!confirm("Bu tuning talebini silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/tune/${id}`, { method: "DELETE" }); loadTune(); loadKPI(); loadDashboardTables(); }
  catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// Tune — Approve / Retry
// ---------------------------------------------------------------------------
function openTuneApproveModal(id) {
  const r = tuneRows.find(x => x.id === id); if (!r) return;
  document.getElementById("approve-tune-id").value = id;
  const dl = r.approval_deadline ? ` Son onay: ${r.approval_deadline.slice(0,10)}.` : "";
  document.getElementById("approve-tune-desc").textContent =
    `"${r.rule_name}" kuralı için tune onayı.${dl} Onaylamak için "Tune Başarılı", yeniden tune için "Yeniden Tune"yi seçin.`;
  document.getElementById("approve-tune-test-ok").checked = false;
  document.getElementById("approve-tune-peer").checked    = false;
  document.getElementById("approve-tune-note").value      = "";
  document.getElementById("approve-tune-error").style.display = "none";
  const retryBtn = document.getElementById("btn-retry-tune");
  if (retryBtn) retryBtn.style.display = IS_SENIOR ? "" : "none";
  document.getElementById("tune-approve-modal").style.display = "flex";
}

async function execApproveTune() {
  const id    = document.getElementById("approve-tune-id").value;
  const errEl = document.getElementById("approve-tune-error");
  errEl.style.display = "none";
  const approval_note = document.getElementById("approve-tune-note").value.trim();
  if (!approval_note) {
    errEl.textContent = "Onay notu zorunludur.";
    errEl.style.display = "block"; return;
  }
  try {
    await apiFetch(`/api/tune/${id}/approve`, { method: "POST", body: JSON.stringify({
      qa_test_ok:       document.getElementById("approve-tune-test-ok").checked ? "Evet" : "Hayır",
      qa_peer_reviewed: document.getElementById("approve-tune-peer").checked    ? "Evet" : "Hayır",
      approval_note,
    }) });
    document.getElementById("tune-approve-modal").style.display = "none";
    loadTune(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function execRetryTune() {
  const id    = document.getElementById("approve-tune-id").value;
  const errEl = document.getElementById("approve-tune-error");
  errEl.style.display = "none";
  try {
    await apiFetch(`/api/tune/${id}/retry`, { method: "POST" });
    document.getElementById("tune-approve-modal").style.display = "none";
    loadTune(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Ön onay (validate/reject) — Tuning + UC ortak
// ---------------------------------------------------------------------------
function openValidateModal(type, id) {
  const rows = type === "tune" ? tuneRows : (type === "usecase" ? ucRows : huntRows);
  const r = rows.find(x => x.id === id); if (!r) return;
  const label = type === "tune" ? r.rule_name : (type === "usecase" ? (r.usecase_description || "").slice(0, 80) : r.hunt_subject);
  document.getElementById("validate-type").value = type;
  document.getElementById("validate-id").value   = id;
  document.getElementById("validate-desc").textContent =
    `"${label}" talebinin geçerliliğini onaylıyor musunuz? Reddederseniz talep "Reddedildi" olarak kapanır.`;
  document.getElementById("validate-note").value = "";
  document.getElementById("validate-error").style.display = "none";
  document.getElementById("validate-modal").style.display = "flex";
}

async function execValidate() {
  const type  = document.getElementById("validate-type").value;
  const id    = document.getElementById("validate-id").value;
  const note  = document.getElementById("validate-note").value.trim();
  const errEl = document.getElementById("validate-error");
  errEl.style.display = "none";
  try {
    await apiFetch(`/api/${type}/${id}/validate`, { method: "POST", body: JSON.stringify({ validation_note: note }) });
    document.getElementById("validate-modal").style.display = "none";
    reloadAfterValidate(type);
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function execRejectValidation() {
  const type  = document.getElementById("validate-type").value;
  const id    = document.getElementById("validate-id").value;
  const note  = document.getElementById("validate-note").value.trim();
  const errEl = document.getElementById("validate-error");
  errEl.style.display = "none";
  if (!note) {
    errEl.textContent = "Red gerekçesi zorunludur.";
    errEl.style.display = "block"; return;
  }
  try {
    await apiFetch(`/api/${type}/${id}/reject-validation`, { method: "POST", body: JSON.stringify({ validation_note: note }) });
    document.getElementById("validate-modal").style.display = "none";
    reloadAfterValidate(type);
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

function reloadAfterValidate(type) {
  if (type === "tune") { loadTune(); }
  else if (type === "usecase") { loadUC(); }
  else { loadHunt(); }
  loadKPI(); loadDashboardTables();
}

// ---------------------------------------------------------------------------
// Hunt — Sonuç Onayı (approve-result / reject-result)
// ---------------------------------------------------------------------------
function openHuntResultModal(id) {
  const r = huntRows.find(x => x.id === id); if (!r) return;
  document.getElementById("hunt-result-id").value = id;
  document.getElementById("hunt-result-desc").textContent =
    `"${r.hunt_subject}" hunt'ının sonucunu/raporunu onaylıyor musunuz? Revizyona gönderirseniz İnceleniyor'a döner.`;
  document.getElementById("hunt-result-note").value = "";
  document.getElementById("hunt-result-error").style.display = "none";
  document.getElementById("hunt-result-modal").style.display = "flex";
}

async function execApproveHuntResult() {
  const id    = document.getElementById("hunt-result-id").value;
  const note  = document.getElementById("hunt-result-note").value.trim();
  const errEl = document.getElementById("hunt-result-error");
  errEl.style.display = "none";
  try {
    await apiFetch(`/api/hunt/${id}/approve-result`, { method: "POST", body: JSON.stringify({ result_approval_note: note }) });
    document.getElementById("hunt-result-modal").style.display = "none";
    loadHunt(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function execRejectHuntResult() {
  const id    = document.getElementById("hunt-result-id").value;
  const note  = document.getElementById("hunt-result-note").value.trim();
  const errEl = document.getElementById("hunt-result-error");
  errEl.style.display = "none";
  if (!note) {
    errEl.textContent = "Revizyon gerekçesi zorunludur.";
    errEl.style.display = "block"; return;
  }
  try {
    await apiFetch(`/api/hunt/${id}/reject-result`, { method: "POST", body: JSON.stringify({ result_approval_note: note }) });
    document.getElementById("hunt-result-modal").style.display = "none";
    loadHunt(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// UC list
// ---------------------------------------------------------------------------
function ucActionBtns(r) {
  const isAdmin    = USER_ROLE === "admin" || USER_ROLE === "user" || USER_ROLE === "settings";
  const isMyTask   = r.rule_author === CURRENT_USER;
  const isMyReport = r.requester  === CURRENT_USER;

  const canEdit = isAdmin || isMyTask || isMyReport;
  const edit = canEdit
    ? `<button class="btn-icon" title="Düzenle" onclick="openUCEditModal(${r.id})">&#9998;</button>`
    : "";
  const del  = isAdmin
    ? `<button class="btn-icon danger" title="Sil" onclick="deleteUC(${r.id})">&#x1F5D1;</button>`
    : "";

  if (r.status === STATUS_PENDING_VALIDATION && IS_SENIOR)
    return `<button class="btn-action-claim" onclick="openValidateModal('usecase',${r.id})">Onayla / Reddet</button> ${edit}${del}`;
  if (r.status === STATUS_PENDING_VALIDATION)
    return `${edit}${del}`;
  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openUCClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor" && (isAdmin || isMyTask))
    return `<button class="btn-action-close" onclick="openUCCloseModal(${r.id})">Kapat</button> ${edit}${del}`;
  if (r.status === "Test Ediliyor" && IS_SENIOR)
    return `<button class="btn-action-close" onclick="openUCTestApproveModal(${r.id})">Test Onayla</button> ${edit}${del}`;
  return `${edit}${del}`;
}

function renderUCRows() {
  const UC_FIELDS = ["usecase_description","requester","environment","rule_name","rule_author","notes"];
  const visible = ucSearch
    ? ucRows.filter(r => UC_FIELDS.some(f => r[f] && String(r[f]).toLowerCase().includes(ucSearch)))
    : ucRows;
  const sorted = clientSort(visible, ucSortCol, ucSortDir);
  updateSortUI("uc", ucSortCol, ucSortDir);
  const tbody = document.getElementById("uc-tbody");
  const empty = document.getElementById("uc-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td>${dot(r.status, UC_DOT)}</td>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.usecase_description)}">
      <span class="cell-link" onclick="openUCDetail(${r.id})" style="cursor:pointer">${esc(r.usecase_description)}</span>
      ${r.source_hunt_id ? `<span class="status-dot" style="font-size:10px;padding:1px 5px;margin-left:4px;background:rgba(94,106,210,.15);color:var(--accent-blue)">Hunt #${r.source_hunt_id}</span>` : ""}
    </td>
    <td class="td-truncate">${esc(parseEnvStr(r.environment).join(", ") || r.environment)}</td>
    <td class="td-truncate">${esc(r.requester)}</td>
    <td class="td-truncate">${esc(r.rule_name)||'<span class="text-muted">—</span>'}</td>
    <td class="td-truncate">${esc(r.rule_author)||'<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, UC_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td class="text-muted">${fmtDate(r.completed_at)}</td>
    <td style="white-space:nowrap">${ucActionBtns(r)}</td>
  </tr>`).join("");
}

async function loadUC() {
  const p = new URLSearchParams();
  const month  = document.getElementById("uc-filter-month").value;
  const env    = document.getElementById("uc-filter-env").value;
  const status = document.getElementById("uc-filter-status").value;
  if (month)  p.set("month", month);
  if (env)    p.set("environment", env);
  if (status) p.set("status", status);
  try {
    ucRows = await apiFetch(`/api/usecase?${p}`);
    renderUCRows();
  } catch (e) { console.error(e); }
}

function clearUCFilters() {
  ["uc-filter-month","uc-filter-env","uc-filter-status"].forEach(id => { document.getElementById(id).value = ""; });
  const s = document.getElementById("uc-search"); if (s) s.value = "";
  ucSearch = "";
  loadUC();
}

// ---------------------------------------------------------------------------
// UC — Create
// ---------------------------------------------------------------------------
function openUCModal() {
  populateEnvDropdowns(); populateAnalystDropdowns();
  document.getElementById("uc-id").value   = "";
  document.getElementById("uc-desc").value = "";
  _ucEnvCreate = [];
  renderUCEnvCreate();
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    lockToSelf("uc-requester");
  } else {
    freeSelect("uc-requester", "");
  }
  document.getElementById("uc-modal-error").style.display = "none";
  document.getElementById("uc-modal").style.display = "flex";
}
function closeUCModal() { document.getElementById("uc-modal").style.display = "none"; }

async function saveUC() {
  const errEl = document.getElementById("uc-modal-error");
  errEl.style.display = "none";
  if (!_ucEnvCreate.length) {
    errEl.textContent = "En az bir ortam seçin."; errEl.style.display = "block"; return;
  }
  const payload = {
    requester:           document.getElementById("uc-requester").value,
    environment:         _ucEnvCreate.join(","),
    usecase_description: document.getElementById("uc-desc").value.trim(),
    status:              "Açık",
  };
  try {
    await apiFetch("/api/usecase", { method: "POST", body: JSON.stringify(payload) });
    closeUCModal(); loadUC(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// UC — Edit (corrections)
// ---------------------------------------------------------------------------
function openUCEditModal(id) {
  const r = ucRows.find(x => x.id === id); if (!r) return;
  populateEnvDropdowns(); populateAnalystDropdowns();
  document.getElementById("edit-uc-id").value        = r.id;
  document.getElementById("edit-uc-desc").value      = r.usecase_description || "";
  document.getElementById("edit-uc-status").value    = r.status || "Açık";
  document.getElementById("edit-uc-rule-name").value = r.rule_name || "";
  document.getElementById("edit-uc-notes").value     = r.notes || "";
  // Env tags
  _ucEnvEdit = parseEnvStr(r.environment);
  // Alan kilitleme: role ve sahipliğe göre
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    const isAssigned  = r.rule_author === CURRENT_USER;
    const isRequester = r.requester   === CURRENT_USER;
    lockToSelf("edit-uc-requester");
    if (isAssigned) {
      lockToSelf("edit-uc-rule-author");
    } else {
      const sel = document.getElementById("edit-uc-rule-author");
      sel.innerHTML = `<option value="${esc(r.rule_author||"")}">${esc(r.rule_author||"—")}</option>`;
      sel.disabled  = true;
    }
    setUCEnvEditDisabled(!isRequester);
    document.getElementById("edit-uc-desc").disabled = !isRequester;
    ["edit-uc-status","edit-uc-rule-name","edit-uc-notes"].forEach(i => {
      document.getElementById(i).disabled = !isAssigned;
    });
  } else {
    freeSelect("edit-uc-requester",   r.requester   || "");
    freeSelect("edit-uc-rule-author", r.rule_author || "");
    document.getElementById("edit-uc-rule-author").disabled = false;
    setUCEnvEditDisabled(false);
    ["edit-uc-desc","edit-uc-status","edit-uc-rule-name","edit-uc-notes"].forEach(i => {
      document.getElementById(i).disabled = false;
    });
  }
  // Settings: show ID + date fields
  showSettingsDateFields("uc-edit-modal");
  if (USER_ROLE === "settings") {
    document.getElementById("edit-uc-new-id").value = r.id;
    setDateTimeInput("edit-uc-created-at",   r.created_at);
    setDateTimeInput("edit-uc-completed-at", r.completed_at);
  }
  document.getElementById("uc-edit-modal-error").style.display = "none";
  document.getElementById("uc-edit-modal").style.display = "flex";
}
function closeUCEditModal() { document.getElementById("uc-edit-modal").style.display = "none"; }

async function saveUCEdit() {
  const id    = document.getElementById("edit-uc-id").value;
  const errEl = document.getElementById("uc-edit-modal-error");
  errEl.style.display = "none";
  const payload = {
    requester:           document.getElementById("edit-uc-requester").value,
    environment:         _ucEnvEdit.join(","),
    usecase_description: document.getElementById("edit-uc-desc").value.trim(),
    status:              document.getElementById("edit-uc-status").value,
    rule_author:         document.getElementById("edit-uc-rule-author").value,
    rule_name:           document.getElementById("edit-uc-rule-name").value.trim(),
    notes:               document.getElementById("edit-uc-notes").value.trim(),
    ...(USER_ROLE === "settings" ? {
      new_id:       document.getElementById("edit-uc-new-id").value        || undefined,
      created_at:   document.getElementById("edit-uc-created-at").value    || undefined,
      completed_at: document.getElementById("edit-uc-completed-at").value  || undefined,
    } : {}),
  };
  try {
    await apiFetch(`/api/usecase/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeUCEditModal(); loadUC(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// UC — Claim (Üstlen)
// ---------------------------------------------------------------------------
function openUCClaimModal(id) {
  populateAnalystDropdowns();
  document.getElementById("claim-uc-id").value = id;
  const sel = document.getElementById("claim-uc-analyst");
  if (USER_ROLE === "analyst") {
    sel.innerHTML = `<option value="${esc(CURRENT_USER)}" selected>${esc(CURRENT_USER)}</option>`;
    sel.disabled  = true;
  } else {
    sel.disabled = false;
    sel.value    = "";
  }
  document.getElementById("claim-uc-error").style.display = "none";
  document.getElementById("uc-claim-modal").style.display = "flex";
}
function closeUCClaimModal() { document.getElementById("uc-claim-modal").style.display = "none"; }

async function saveUCClaim() {
  const id      = document.getElementById("claim-uc-id").value;
  const analyst = document.getElementById("claim-uc-analyst").value;
  const errEl   = document.getElementById("claim-uc-error");
  errEl.style.display = "none";
  if (!analyst) { errEl.textContent = "Analist seçilmedi."; errEl.style.display = "block"; return; }
  try {
    await apiFetch(`/api/usecase/${id}`, { method: "PUT",
      body: JSON.stringify({ rule_author: analyst, status: "İnceleniyor" }) });
    closeUCClaimModal(); loadUC(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// UC MITRE state
// ---------------------------------------------------------------------------
let _ucMitreList = [];

function toggleUCMitre() {
  const checked = document.getElementById("close-uc-mitre-check").checked;
  const section = document.getElementById("close-uc-mitre-section");
  if (section) section.style.display = checked ? "block" : "none";
}

function onUCMitreTacticChange() {
  const tactic = document.getElementById("uc-mitre-tactic-select").value;
  populateMitreTechniqueSelect("uc-mitre-technique-select", tactic);
}

function addUCMitreTechnique() {
  const tactic  = document.getElementById("uc-mitre-tactic-select").value;
  const techSel = document.getElementById("uc-mitre-technique-select");
  const techId  = techSel.value;
  if (!tactic || !techId) return;
  if (_ucMitreList.find(e => e.id === techId)) return;
  const rawName = techSel.options[techSel.selectedIndex]?.text || "";
  const name = rawName.replace(/^[^—]*—\s*/, "");
  _ucMitreList.push({ id: techId, name, tactic });
  renderUCMitreList();
}

function removeUCMitre(techId) {
  _ucMitreList = _ucMitreList.filter(e => e.id !== techId);
  renderUCMitreList();
}

function renderUCMitreList() {
  const container = document.getElementById("uc-mitre-list"); if (!container) return;
  document.getElementById("close-uc-mitre-json").value = JSON.stringify(_ucMitreList);
  container.innerHTML = _ucMitreList.map(e =>
    `<span class="mitre-tag">${esc(e.id)} — ${esc(e.name)}<button type="button" class="tag-remove"
       onclick="removeUCMitre('${esc(e.id).replace(/'/g,"\\'")}')">&#x2715;</button></span>`
  ).join("");
}

// ---------------------------------------------------------------------------
// UC — Close (Kapat)
// ---------------------------------------------------------------------------
async function openUCCloseModal(id) {
  await loadMitreData();
  document.getElementById("close-uc-id").value        = id;
  document.getElementById("close-uc-rule-name").value = "";
  document.getElementById("close-uc-notes").value     = "";
  document.getElementById("close-uc-status").value    = "Test Ediliyor";
  // Reset MITRE
  _ucMitreList = [];
  const mitreCk = document.getElementById("close-uc-mitre-check");
  if (mitreCk) mitreCk.checked = false;
  toggleUCMitre();
  populateMitreTacticSelect("uc-mitre-tactic-select");
  populateMitreTechniqueSelect("uc-mitre-technique-select", "");
  renderUCMitreList();
  document.getElementById("close-uc-error").style.display = "none";
  document.getElementById("uc-close-modal").style.display = "flex";
}
function closeUCCloseModal() { document.getElementById("uc-close-modal").style.display = "none"; }

async function saveUCClose() {
  const id    = document.getElementById("close-uc-id").value;
  const errEl = document.getElementById("close-uc-error");
  errEl.style.display = "none";
  const mitreCk = document.getElementById("close-uc-mitre-check");
  const payload = {
    rule_name:        document.getElementById("close-uc-rule-name").value.trim(),
    notes:            document.getElementById("close-uc-notes").value.trim(),
    status:           document.getElementById("close-uc-status").value,
    mitre_classified: (mitreCk && mitreCk.checked) ? "Evet" : "Hayır",
    mitre_data:       (mitreCk && mitreCk.checked) ? _ucMitreList : [],
  };
  try {
    await apiFetch(`/api/usecase/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeUCCloseModal(); loadUC(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function deleteUC(id) {
  if (!confirm("Bu use-case talebini silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/usecase/${id}`, { method: "DELETE" }); loadUC(); loadKPI(); loadDashboardTables(); }
  catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// UC — Test Approve / Reject
// ---------------------------------------------------------------------------
function openUCTestApproveModal(id) {
  const r = ucRows.find(x => x.id === id); if (!r) return;
  document.getElementById("test-approve-uc-id").value = id;
  document.getElementById("test-approve-uc-desc").textContent =
    `"${r.usecase_description?.slice(0,80) || ""}" — Test sonucunu seçin.`;
  document.getElementById("test-approve-test-ok").checked = false;
  document.getElementById("test-approve-peer").checked    = false;
  document.getElementById("test-approve-notes").value = "";
  document.getElementById("test-approve-uc-error").style.display = "none";
  document.getElementById("uc-test-approve-modal").style.display = "flex";
}

async function execTestApproveUC() {
  const id         = document.getElementById("test-approve-uc-id").value;
  const test_notes = document.getElementById("test-approve-notes").value.trim();
  const errEl      = document.getElementById("test-approve-uc-error");
  errEl.style.display = "none";
  if (!test_notes) {
    errEl.textContent = "Onay notu zorunludur.";
    errEl.style.display = "block"; return;
  }
  try {
    await apiFetch(`/api/usecase/${id}/test-approve`, { method: "POST", body: JSON.stringify({
      test_notes,
      qa_test_ok:       document.getElementById("test-approve-test-ok").checked ? "Evet" : "Hayır",
      qa_peer_reviewed: document.getElementById("test-approve-peer").checked    ? "Evet" : "Hayır",
    }) });
    document.getElementById("uc-test-approve-modal").style.display = "none";
    loadUC(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function execTestRejectUC() {
  const id         = document.getElementById("test-approve-uc-id").value;
  const test_notes = document.getElementById("test-approve-notes").value.trim();
  const errEl      = document.getElementById("test-approve-uc-error");
  errEl.style.display = "none";
  try {
    await apiFetch(`/api/usecase/${id}/test-reject`, { method: "POST", body: JSON.stringify({ test_notes }) });
    document.getElementById("uc-test-approve-modal").style.display = "none";
    loadUC(); loadKPI(); loadDashboardTables();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
const ACTION_TR = {
  "LOGIN":       "Giriş yapıldı",
  "CREATE_TUNE": "Tuning oluşturuldu",
  "CLAIM_TUNE":  "Tuning üstlenildi",
  "CLOSE_TUNE":  "Tuning kapatıldı",
  "EDIT_TUNE":   "Tuning düzenlendi",
  "DELETE_TUNE": "Tuning silindi",
  "CREATE_UC":   "Use-Case oluşturuldu",
  "CLAIM_UC":    "Use-Case üstlenildi",
  "CLOSE_UC":    "Use-Case kapatıldı",
  "EDIT_UC":     "Use-Case düzenlendi",
  "DELETE_UC":   "Use-Case silindi",
  "CREATE_USER":  "Kullanıcı oluşturuldu",
  "EDIT_USER":    "Kullanıcı düzenlendi",
  "DELETE_USER":  "Kullanıcı silindi",
  "CREATE_HUNT":  "Hunt oluşturuldu",
  "CLAIM_HUNT":   "Hunt üstlenildi",
  "REPORT_HUNT":  "Hunt raporu güncellendi",
  "CLOSE_HUNT":   "Hunt kapatıldı",
  "EDIT_HUNT":    "Hunt düzenlendi",
  "DELETE_HUNT":    "Hunt silindi",
  "APPROVE_TUNE":   "Tune onaylandı",
  "RETRY_TUNE":     "Yeniden tune istendi",
  "TEST_APPROVE_UC":"UC test onaylandı",
  "TEST_REJECT_UC": "UC test reddedildi",
  "VERIFY_AUDIT_CHAIN": "Audit zinciri doğrulandı",
  "VALIDATE_TUNE":          "Tune talebi onaylandı (ön onay)",
  "REJECT_VALIDATION_TUNE": "Tune talebi reddedildi (ön onay)",
  "VALIDATE_UC":            "UC talebi onaylandı (ön onay)",
  "REJECT_VALIDATION_UC":   "UC talebi reddedildi (ön onay)",
  "VALIDATE_HUNT":          "Hunt talebi onaylandı (ön onay)",
  "REJECT_VALIDATION_HUNT": "Hunt talebi reddedildi (ön onay)",
  "APPROVE_HUNT_RESULT":    "Hunt sonucu onaylandı",
  "REJECT_HUNT_RESULT":     "Hunt sonucu revizyona gönderildi",
};
const ACTION_CLS = {
  "LOGIN": "audit-login",
  "CREATE_TUNE": "audit-create", "CREATE_UC": "audit-create", "CREATE_USER": "audit-create", "CREATE_HUNT": "audit-create",
  "CLAIM_TUNE":  "audit-claim",  "CLAIM_UC":  "audit-claim",  "CLAIM_HUNT":  "audit-claim",
  "CLOSE_TUNE":  "audit-close",  "CLOSE_UC":  "audit-close",  "CLOSE_HUNT":  "audit-close",
  "EDIT_TUNE":   "audit-edit",   "EDIT_UC":   "audit-edit",   "EDIT_HUNT":   "audit-edit",   "EDIT_USER":   "audit-edit",  "REPORT_HUNT": "audit-edit",
  "DELETE_TUNE": "audit-delete", "DELETE_UC": "audit-delete", "DELETE_USER": "audit-delete", "DELETE_HUNT": "audit-delete",
  "VERIFY_AUDIT_CHAIN": "audit-edit",
  "VALIDATE_TUNE": "audit-claim", "VALIDATE_UC": "audit-claim", "VALIDATE_HUNT": "audit-claim",
  "REJECT_VALIDATION_TUNE": "audit-delete", "REJECT_VALIDATION_UC": "audit-delete", "REJECT_VALIDATION_HUNT": "audit-delete",
  "APPROVE_HUNT_RESULT": "audit-close", "REJECT_HUNT_RESULT": "audit-delete",
};

async function verifyAuditChain() {
  const box = document.getElementById("audit-verify-result");
  box.style.display = "block";
  box.innerHTML = `<div class="empty-state">Zincir doğrulanıyor…</div>`;
  try {
    const r = await apiFetch("/api/audit/verify", { method: "POST" });
    if (r.valid) {
      box.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.35);color:#4ade80;font-size:13px">
        ✅ Zincir geçerli — ${r.chained}/${r.total} kayıt zincirli, hiçbiri değiştirilmemiş/silinmemiş.
      </div>`;
    } else {
      box.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);color:#f87171;font-size:13px">
        ⚠️ Zincirde ${r.problems.length} sorun bulundu (${r.chained}/${r.total} kayıt zincirli):<br>
        ${r.problems.map(p => esc(p)).join("<br>")}
      </div>`;
    }
    loadAuditLog();
  } catch (e) {
    box.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);color:#f87171;font-size:13px">Doğrulama başarısız: ${esc(e.message || String(e))}</div>`;
  }
}

async function loadAuditLog() {
  try {
    const rows  = await apiFetch("/api/audit");
    const tbody = document.getElementById("audit-tbody");
    const empty = document.getElementById("audit-empty");
    if (!rows.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = rows.map(r => {
      const cls  = ACTION_CLS[r.action] || "";
      const label = ACTION_TR[r.action]  || r.action;
      const time  = r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : "—";
      return `<tr>
        <td class="text-muted" style="font-size:12px;white-space:nowrap">${time}</td>
        <td style="font-weight:500">${esc(r.username)}</td>
        <td><span class="audit-badge ${cls}">${label}</span></td>
        <td class="text-muted" style="font-size:12px">${esc(r.record_type || "")}</td>
        <td class="text-muted" style="font-size:12px">${r.record_id ? "#"+r.record_id : ""}</td>
        <td class="text-muted" style="font-size:12px">${esc(r.detail || "")}</td>
      </tr>`;
    }).join("");
  } catch (e) { console.error(e); }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
async function loadSettings() {
  await loadDropdownData();
  const envList = document.getElementById("env-settings-list");
  if (envList) {
    envList.innerHTML = _envs.length
      ? _envs.map(e => `<li><span>${esc(e.name)}</span>
          <button class="btn-icon danger" onclick="deleteEnvironment(${e.id})">&#x1F5D1;</button></li>`).join("")
      : `<li class="text-muted" style="justify-content:center">Henüz ortam eklenmedi.</li>`;
  }
  await loadUsersList();
  loadBackupList();
}

const ROLE_LABEL = { admin: "Admin", analyst: "Analist" };
const TIER_CLS   = { "Analist": "tier-analist", "Kıdemli Analist": "tier-kidemli", "Müdür": "tier-mudur" };

async function loadUsersList() {
  const list = document.getElementById("user-settings-list");
  if (!list) return;
  try {
    const users = await apiFetch("/api/users");
    list.innerHTML = users.length
      ? users.map(u => `<li>
          <span>${esc(u.username)}
            <span class="user-role-badge role-${u.role}">${ROLE_LABEL[u.role] || u.role}</span>
            <span class="user-role-badge ${TIER_CLS[u.tier] || ""}">${esc(u.tier || "Analist")}</span>
          </span>
          <span style="display:flex;gap:4px">
            <button class="btn-icon" title="Düzenle"
              onclick="openEditUserModal(${u.id},'${esc(u.username)}','${u.role}','${esc(u.tier || "Analist")}')">&#9998;</button>
            <button class="btn-icon danger" title="Sil"
              onclick="deleteUser(${u.id},'${esc(u.username)}')">&#x1F5D1;</button>
          </span>
        </li>`).join("")
      : `<li class="text-muted" style="justify-content:center">Henüz kullanıcı eklenmedi.</li>`;
  } catch (e) { console.error(e); }
}

async function addUser() {
  const username = document.getElementById("new-user-username").value.trim();
  const password = document.getElementById("new-user-password").value.trim();
  const role     = document.getElementById("new-user-role").value;
  const tier     = document.getElementById("new-user-tier").value;
  const errEl    = document.getElementById("user-form-error");
  errEl.style.display = "none";
  if (!username || !password) {
    errEl.textContent = "Kullanıcı adı ve şifre zorunludur.";
    errEl.style.display = "block"; return;
  }
  try {
    await apiFetch("/api/users", { method: "POST", body: JSON.stringify({ username, password, role, tier }) });
    document.getElementById("new-user-username").value = "";
    document.getElementById("new-user-password").value = "";
    loadUsersList();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function deleteUser(id, name) {
  if (!confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
  try { await apiFetch(`/api/users/${id}`, { method: "DELETE" }); loadUsersList(); }
  catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// User edit modal
// ---------------------------------------------------------------------------
function openEditUserModal(id, username, role, tier) {
  document.getElementById("edit-user-id").value           = id;
  document.getElementById("edit-user-modal-title").textContent = `Kullanıcı Düzenle — ${username}`;
  document.getElementById("edit-user-name-display").value = username;
  document.getElementById("edit-user-role").value         = role;
  document.getElementById("edit-user-tier").value         = tier || "Analist";
  document.getElementById("edit-user-password").value     = "";
  document.getElementById("edit-user-password2").value    = "";
  document.getElementById("edit-user-error").style.display = "none";
  document.getElementById("edit-user-modal").style.display = "flex";
}
function closeEditUserModal() {
  document.getElementById("edit-user-modal").style.display = "none";
}

async function saveEditUser() {
  const id      = document.getElementById("edit-user-id").value;
  const role    = document.getElementById("edit-user-role").value;
  const tier    = document.getElementById("edit-user-tier").value;
  const pw1     = document.getElementById("edit-user-password").value;
  const pw2     = document.getElementById("edit-user-password2").value;
  const errEl   = document.getElementById("edit-user-error");
  errEl.style.display = "none";

  if (pw1 && pw1 !== pw2) {
    errEl.textContent = "Şifreler eşleşmiyor.";
    errEl.style.display = "block"; return;
  }
  if (pw1 && pw1.length < 6) {
    errEl.textContent = "Şifre en az 6 karakter olmalıdır.";
    errEl.style.display = "block"; return;
  }

  const payload = { role, tier };
  if (pw1) payload.password = pw1;

  try {
    await apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeEditUserModal();
    loadUsersList();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

async function addEnvironment() {
  const inp = document.getElementById("new-env-input");
  const name = inp.value.trim(); if (!name) return;
  try { await apiFetch("/api/environments", { method: "POST", body: JSON.stringify({ name }) }); inp.value = ""; loadSettings(); }
  catch (e) { alert(e.message); }
}
async function deleteEnvironment(id) {
  if (!confirm("Bu ortamı silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/environments/${id}`, { method: "DELETE" }); loadSettings(); }
  catch (e) { alert(e.message); }
}

document.getElementById("new-env-input")?.addEventListener("keydown", e => { if (e.key==="Enter") addEnvironment(); });

// ---------------------------------------------------------------------------
// Modal overlay close
// ---------------------------------------------------------------------------
["tune-modal","tune-edit-modal","tune-claim-modal","tune-close-modal","tune-approve-modal",
 "tune-detail-modal","uc-detail-modal",
 "uc-modal","uc-edit-modal","uc-claim-modal","uc-close-modal","uc-test-approve-modal",
 "hunt-modal","hunt-edit-modal","hunt-claim-modal","hunt-detail-modal"].forEach(id => {
  document.getElementById(id)?.addEventListener("click", e => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = "none";
  });
});

// ---------------------------------------------------------------------------
// Paste image setup (after DOM ready — textareas are in modals)
// Wire up on modal open instead so elements exist
// ---------------------------------------------------------------------------
function setupAllPaste() {
  setupPaste("tune-reason",       "tune-evidence-preview",      "tune-evidence-image");
  setupPaste("edit-tune-reason",  "edit-tune-evidence-preview", "edit-tune-evidence-image");
  setupPaste("edit-tune-how",     "edit-tune-resolution-preview","edit-tune-resolution-image");
  setupPaste("close-tune-how",    "close-tune-img-preview",     "close-tune-resolution-image");
  // Hunt report paste targets
  setupPaste("report-hunt-scope",            "report-hunt-scope-preview",            "report-hunt-scope-image");
  setupPaste("report-hunt-affected-assets",  "report-hunt-affected-assets-preview",  "report-hunt-affected-assets-image");
  setupPaste("report-hunt-findings",         "report-hunt-findings-preview",         "report-hunt-findings-image");
  setupPaste("report-hunt-detection-detail", "report-hunt-detection-detail-preview", "report-hunt-detection-detail-image");
}

function setupPaste(textareaId, previewAreaId, hiddenId) {
  const el = document.getElementById(textareaId);
  if (!el || el._pasteReady) return;
  el._pasteReady = true;
  el.addEventListener("paste", async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const img   = items.find(i => i.type.startsWith("image/"));
    if (!img) return;
    e.preventDefault();
    try {
      const blob     = img.getAsFile();
      const filename = await uploadBlob(blob);
      showPastePreview(filename, previewAreaId, hiddenId);
    } catch (err) { console.error("Paste upload failed:", err); }
  });
}

// ---------------------------------------------------------------------------
// Resizable columns
// ---------------------------------------------------------------------------
function makeColumnsResizable(table) {
  if (!table) return;
  const ths  = Array.from(table.querySelectorAll("thead tr th"));
  const cols = Array.from(table.querySelectorAll("col"));

  ths.forEach((th, i) => {
    // Skip first (status dot) and last (actions)
    if (i === 0 || i === ths.length - 1) return;

    const handle = document.createElement("div");
    handle.className = "col-resize-handle";

    // Prevent click on handle from firing the sort onclick
    handle.addEventListener("click", e => e.stopPropagation());

    handle.addEventListener("mousedown", e => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.pageX;
      const startW = th.offsetWidth;
      handle.classList.add("dragging");
      document.body.style.cursor     = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = e => {
        const w = Math.min(Math.max(startW + (e.pageX - startX), 60), 450);
        th.style.width = w + "px";
        if (cols[i]) cols[i].style.width = w + "px";
      };

      const onUp = () => {
        handle.classList.remove("dragging");
        document.body.style.cursor     = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    });

    th.appendChild(handle);
  });
}

// ---------------------------------------------------------------------------
// Threat Hunt
// ---------------------------------------------------------------------------
const HUNT_CLS = {
  "Ön Onay Bekliyor":      "status-pending",
  "Açık":                  "status-open",
  "İnceleniyor":           "status-reviewing",
  "Sonuç Onayı Bekliyor":  "status-tuned",
  "Tamamlandı":            "status-done",
  "İptal":                 "status-skipped",
  "Reddedildi":            "status-rejected",
};
const HUNT_DOT = {
  "Ön Onay Bekliyor":      "dot-pending",
  "Açık":                  "dot-open",
  "İnceleniyor":           "dot-reviewing",
  "Sonuç Onayı Bekliyor":  "dot-tuned",
  "Tamamlandı":            "dot-done",
  "İptal":                 "dot-skipped",
  "Reddedildi":            "dot-rejected",
};

let huntRows    = [];
let huntSearch  = "";
let huntSortCol = "id";
let huntSortDir = -1;

function onHuntSearch(val) { huntSearch = val.toLowerCase(); renderHuntRows(); }

function sortHunt(col) {
  if (huntSortCol === col) huntSortDir *= -1; else { huntSortCol = col; huntSortDir = -1; }
  renderHuntRows();
}

function huntActionBtns(r) {
  const isAdmin    = USER_ROLE === "admin" || USER_ROLE === "user" || USER_ROLE === "settings";
  const isMyTask   = r.assigned_analyst === CURRENT_USER;
  const isMyReport = r.requester === CURRENT_USER;
  const canEdit    = isAdmin || isMyTask || isMyReport;

  const edit = canEdit
    ? `<button class="btn-icon" title="Düzenle" onclick="openHuntEditModal(${r.id})">&#9998;</button>`
    : "";
  const report = (isAdmin || isMyTask) && r.status === "İnceleniyor"
    ? `<button class="btn-icon" title="Rapor" onclick="openHuntReportModal(${r.id})" style="color:var(--accent-blue)">&#128196;</button>`
    : "";
  const del = isAdmin
    ? `<button class="btn-icon danger" title="Sil" onclick="deleteHunt(${r.id})">&#x1F5D1;</button>`
    : "";

  if (r.status === STATUS_PENDING_VALIDATION && IS_SENIOR)
    return `<button class="btn-action-claim" onclick="openValidateModal('hunt',${r.id})">Onayla / Reddet</button> ${edit}${del}`;
  if (r.status === STATUS_PENDING_VALIDATION)
    return `${edit}${del}`;
  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openHuntClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor") {
    const canStart = (isAdmin || isMyTask) && !r.started_at;
    const startBtn = canStart
      ? `<button class="btn-action-claim" onclick="startHunt(${r.id})" style="background:var(--accent-green,#22c55e);color:#fff">▶ Başla</button> `
      : "";
    return `${startBtn}${report} ${edit}${del}`;
  }
  if (r.status === STATUS_HUNT_RESULT_PENDING && IS_SENIOR)
    return `<button class="btn-action-close" onclick="openHuntResultModal(${r.id})">Sonucu Onayla</button> ${edit}${del}`;
  return `${edit}${del}`;
}

function renderHuntRows() {
  const HUNT_FIELDS = ["hunt_subject","requester","assigned_analyst","environment","notes"];
  const visible = huntSearch
    ? huntRows.filter(r => HUNT_FIELDS.some(f => r[f] && String(r[f]).toLowerCase().includes(huntSearch)))
    : huntRows;
  const sorted = clientSort(visible, huntSortCol, huntSortDir);
  updateSortUI("hunt", huntSortCol, huntSortDir);
  const tbody = document.getElementById("hunt-tbody");
  const empty = document.getElementById("hunt-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td>${dot(r.status, HUNT_DOT)}</td>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.hunt_subject)}">
      <span class="cell-link" onclick="openHuntDetail(${r.id})" style="cursor:pointer">${esc(r.hunt_subject)}</span>
    </td>
    <td class="td-truncate">${esc(r.requester)}</td>
    <td class="td-truncate">${esc(r.assigned_analyst)||'<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, HUNT_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td class="text-muted">${fmtDate(r.completed_at)}</td>
    <td style="white-space:nowrap">${huntActionBtns(r)}</td>
  </tr>`).join("");
}

async function loadHunt() {
  const p = new URLSearchParams();
  const month  = document.getElementById("hunt-filter-month")?.value;
  const status = document.getElementById("hunt-filter-status")?.value;
  if (month)  p.set("month", month);
  if (status) p.set("status", status);
  try {
    huntRows = await apiFetch(`/api/hunt?${p}`);
    renderHuntRows();
  } catch (e) { console.error(e); }
}

function clearHuntFilters() {
  ["hunt-filter-month","hunt-filter-status"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const s = document.getElementById("hunt-search"); if (s) s.value = "";
  huntSearch = "";
  loadHunt();
}

async function startHunt(id) {
  if (!confirm("Hunt'ı şimdi başlatmak istiyor musunuz? Bu işlem başlangıç zamanını kaydeder.")) return;
  try {
    await apiFetch(`/api/hunt/${id}/start`, { method: "POST" });
    loadHunt();
  } catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// Hunt — Create
// ---------------------------------------------------------------------------
function openHuntModal() {
  populateAnalystDropdowns();
  document.getElementById("hunt-subject").value = "";
  document.getElementById("hunt-notes").value   = "";
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    lockToSelf("hunt-requester");
  } else {
    freeSelect("hunt-requester", "");
  }
  document.getElementById("hunt-modal-error").style.display = "none";
  document.getElementById("hunt-modal").style.display = "flex";
}
function closeHuntModal() { document.getElementById("hunt-modal").style.display = "none"; }

async function saveHunt() {
  const errEl = document.getElementById("hunt-modal-error");
  errEl.style.display = "none";
  const payload = {
    hunt_subject: document.getElementById("hunt-subject").value.trim(),
    requester:    document.getElementById("hunt-requester").value,
    notes:        document.getElementById("hunt-notes").value.trim(),
  };
  try {
    await apiFetch("/api/hunt", { method: "POST", body: JSON.stringify(payload) });
    closeHuntModal(); loadHunt(); loadKPI();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Hunt — Edit
// ---------------------------------------------------------------------------
function openHuntEditModal(id) {
  const r = huntRows.find(x => x.id === id); if (!r) return;
  populateAnalystDropdowns();
  document.getElementById("edit-hunt-id").value      = r.id;
  document.getElementById("edit-hunt-subject").value = r.hunt_subject || "";
  document.getElementById("edit-hunt-notes").value   = r.notes || "";

  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    const isAssigned  = r.assigned_analyst === CURRENT_USER;
    const isRequester = r.requester === CURRENT_USER;
    lockToSelf("edit-hunt-requester");
    document.getElementById("edit-hunt-subject").disabled = !isRequester;
    document.getElementById("edit-hunt-notes").disabled   = !isRequester;
    if (!isRequester && !isAssigned) {
      // Shouldn't reach here (button wouldn't show), but guard anyway
    }
  } else {
    document.getElementById("edit-hunt-subject").disabled = false;
    document.getElementById("edit-hunt-notes").disabled   = false;
    freeSelect("edit-hunt-requester", r.requester || "");
  }
  // Settings: show ID + date fields
  showSettingsDateFields("hunt-edit-modal");
  if (USER_ROLE === "settings") {
    document.getElementById("edit-hunt-new-id").value = r.id;
    setDateTimeInput("edit-hunt-created-at",        r.created_at);
    setDateTimeInput("edit-hunt-started-at",         r.started_at);
    setDateTimeInput("edit-hunt-completed-at",       r.completed_at);
    setDateTimeInput("edit-hunt-report-updated-at",  r.report_updated_at);
  }
  document.getElementById("hunt-edit-modal-error").style.display = "none";
  document.getElementById("hunt-edit-modal").style.display = "flex";
}
function closeHuntEditModal() { document.getElementById("hunt-edit-modal").style.display = "none"; }

async function saveHuntEdit() {
  const id    = document.getElementById("edit-hunt-id").value;
  const errEl = document.getElementById("hunt-edit-modal-error");
  errEl.style.display = "none";
  const payload = {
    hunt_subject: document.getElementById("edit-hunt-subject").value.trim(),
    requester:    document.getElementById("edit-hunt-requester").value,
    notes:        document.getElementById("edit-hunt-notes").value.trim(),
    ...(USER_ROLE === "settings" ? {
      new_id:            document.getElementById("edit-hunt-new-id").value              || undefined,
      created_at:        document.getElementById("edit-hunt-created-at").value          || undefined,
      started_at:        document.getElementById("edit-hunt-started-at").value          || undefined,
      completed_at:      document.getElementById("edit-hunt-completed-at").value        || undefined,
      report_updated_at: document.getElementById("edit-hunt-report-updated-at").value   || undefined,
    } : {}),
  };
  try {
    await apiFetch(`/api/hunt/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeHuntEditModal(); loadHunt();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Hunt — Claim
// ---------------------------------------------------------------------------
function openHuntClaimModal(id) {
  populateAnalystDropdowns();
  document.getElementById("claim-hunt-id").value = id;
  const sel = document.getElementById("claim-hunt-analyst");
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    sel.innerHTML = `<option value="${esc(CURRENT_USER)}" selected>${esc(CURRENT_USER)}</option>`;
    sel.disabled  = true;
  } else {
    sel.disabled = false;
    sel.value    = "";
  }
  document.getElementById("claim-hunt-error").style.display = "none";
  document.getElementById("hunt-claim-modal").style.display = "flex";
}
function closeHuntClaimModal() { document.getElementById("hunt-claim-modal").style.display = "none"; }
function closeHuntDetailModal() { document.getElementById("hunt-detail-modal").style.display = "none"; }

async function saveHuntClaim() {
  const id      = document.getElementById("claim-hunt-id").value;
  const analyst = document.getElementById("claim-hunt-analyst").value;
  const errEl   = document.getElementById("claim-hunt-error");
  errEl.style.display = "none";
  if (!analyst) { errEl.textContent = "Analist seçilmedi."; errEl.style.display = "block"; return; }
  try {
    await apiFetch(`/api/hunt/${id}`, {
      method: "PUT",
      body: JSON.stringify({ assigned_analyst: analyst, status: "İnceleniyor" }),
    });
    closeHuntClaimModal(); loadHunt(); loadKPI();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// MITRE ATT&CK cache
// ---------------------------------------------------------------------------
let _mitreData = [];

async function loadMitreData() {
  if (_mitreData.length) return _mitreData;
  try {
    _mitreData = await apiFetch("/api/mitre");
    return _mitreData;
  } catch (e) { console.error("MITRE yüklenemedi:", e); return []; }
}

function getMitreTactics() {
  const seen = new Set(), tactics = [];
  for (const t of _mitreData) {
    if (!seen.has(t.tactic)) { seen.add(t.tactic); tactics.push(t.tactic); }
  }
  return tactics.sort();
}

function getMitreTechniquesByTactic(tactic) {
  return _mitreData.filter(t => t.tactic === tactic);
}

function populateMitreTacticSelect(selectId) {
  const el = document.getElementById(selectId); if (!el) return;
  el.innerHTML = `<option value="">— Taktik seçin —</option>` +
    getMitreTactics().map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
}

function populateMitreTechniqueSelect(selectId, tactic) {
  const el = document.getElementById(selectId); if (!el) return;
  el.innerHTML = `<option value="">— Teknik seçin —</option>`;
  if (!tactic) return;
  getMitreTechniquesByTactic(tactic).forEach(t => {
    el.innerHTML += `<option value="${esc(t.id)}">${esc(t.id)} — ${esc(t.name)}</option>`;
  });
}

// ---------------------------------------------------------------------------
// Hunt MITRE entry state
// ---------------------------------------------------------------------------
let _huntMitreEntries = [];

function onMitreTacticChange() {
  const tactic = document.getElementById("mitre-tactic-select").value;
  populateMitreTechniqueSelect("mitre-technique-select", tactic);
}

function addMitreTechniqueEntry() {
  const tactic  = document.getElementById("mitre-tactic-select").value;
  const techSel = document.getElementById("mitre-technique-select");
  const techId  = techSel.value;
  if (!tactic || !techId) return;
  if (_huntMitreEntries.find(e => e.id === techId)) return; // no duplicates
  const rawName = techSel.options[techSel.selectedIndex]?.text || "";
  const name = rawName.replace(/^[^—]*—\s*/, "");
  _huntMitreEntries.push({ id: techId, name, tactic, method: "", method_image: "" });
  renderHuntMitreEntries();
}

function removeHuntMitreEntry(techId) {
  _huntMitreEntries = _huntMitreEntries.filter(e => e.id !== techId);
  renderHuntMitreEntries();
}

function updateHuntMitreMethod(techId, value) {
  const entry = _huntMitreEntries.find(e => e.id === techId);
  if (entry) entry.method = value;
  document.getElementById("report-hunt-mitre-json").value = JSON.stringify(_huntMitreEntries);
}

function renderHuntMitreEntries() {
  const container = document.getElementById("hunt-mitre-entries"); if (!container) return;
  document.getElementById("report-hunt-mitre-json").value = JSON.stringify(_huntMitreEntries);
  if (!_huntMitreEntries.length) { container.innerHTML = ""; return; }
  container.innerHTML = _huntMitreEntries.map(e => `
    <div class="mitre-entry">
      <div class="mitre-entry-header">
        <span class="mitre-tag">${esc(e.id)}</span>
        <span class="text-muted" style="font-size:11px;margin-left:4px">${esc(e.tactic)}</span>
        <span style="font-size:12px;margin-left:6px">${esc(e.name)}</span>
        <button type="button" class="btn-icon danger" style="margin-left:auto;font-size:11px"
                onclick="removeHuntMitreEntry('${esc(e.id)}')">&#x2715;</button>
      </div>
      <textarea class="form-input form-textarea" style="margin-top:6px;min-height:60px"
        placeholder="Bu teknikle ilgili bulgular, araçlar, gözlemler…"
        oninput="updateHuntMitreMethod('${esc(e.id)}',this.value)">${esc(e.method)}</textarea>
    </div>`).join("");
}

// ---------------------------------------------------------------------------
// Multi-env helper (shared by UC create, UC edit, Hunt report)
// ---------------------------------------------------------------------------
function _makeEnvTagSystem(listId, stateRef) {
  // stateRef is an object { arr: [] } so we can mutate by reference
}

// UC Create env tags
let _ucEnvCreate = [];
function addUCEnvCreate() {
  const sel = document.getElementById("uc-env-select");
  const val = sel.value; if (!val) return;
  if (!_ucEnvCreate.includes(val)) { _ucEnvCreate.push(val); renderUCEnvCreate(); }
  sel.value = "";
}
function removeUCEnvCreate(val) {
  _ucEnvCreate = _ucEnvCreate.filter(v => v !== val);
  renderUCEnvCreate();
}
function renderUCEnvCreate() {
  const c = document.getElementById("uc-env-list"); if (!c) return;
  c.innerHTML = _ucEnvCreate.map(v =>
    `<span class="ioc-tag">${esc(v)}<button type="button" class="tag-remove"
       onclick="removeUCEnvCreate('${esc(v).replace(/'/g,"\\'")}')">&#x2715;</button></span>`
  ).join("");
}

// UC Edit env tags
let _ucEnvEdit = [];
function addUCEnvEdit() {
  const sel = document.getElementById("edit-uc-env-select");
  const val = sel.value; if (!val) return;
  if (!_ucEnvEdit.includes(val)) { _ucEnvEdit.push(val); renderUCEnvEdit(); }
  sel.value = "";
}
function removeUCEnvEdit(val) {
  _ucEnvEdit = _ucEnvEdit.filter(v => v !== val);
  renderUCEnvEdit();
}
function renderUCEnvEdit(disabled) {
  const c = document.getElementById("edit-uc-env-list"); if (!c) return;
  if (disabled) {
    c.innerHTML = _ucEnvEdit.map(v =>
      `<span class="ioc-tag" style="cursor:default">${esc(v)}</span>`
    ).join("");
  } else {
    c.innerHTML = _ucEnvEdit.map(v =>
      `<span class="ioc-tag">${esc(v)}<button type="button" class="tag-remove"
         onclick="removeUCEnvEdit('${esc(v).replace(/'/g,"\\'")}')">&#x2715;</button></span>`
    ).join("");
  }
}
function setUCEnvEditDisabled(disabled) {
  const sel = document.getElementById("edit-uc-env-select");
  const btn = document.getElementById("edit-uc-env-btn");
  if (sel) sel.disabled = disabled;
  if (btn) btn.disabled = disabled;
  renderUCEnvEdit(disabled);
}

// Hunt env tags
let _huntEnvList = [];
function addHuntEnv() {
  const sel = document.getElementById("hunt-report-env-select");
  const val = sel.value; if (!val) return;
  if (!_huntEnvList.includes(val)) { _huntEnvList.push(val); renderHuntEnvTags(); }
  sel.value = "";
}
function removeHuntEnv(val) {
  _huntEnvList = _huntEnvList.filter(v => v !== val);
  renderHuntEnvTags();
}
function renderHuntEnvTags() {
  const c = document.getElementById("hunt-env-list"); if (!c) return;
  c.innerHTML = _huntEnvList.map(v =>
    `<span class="ioc-tag">${esc(v)}<button type="button" class="tag-remove"
       onclick="removeHuntEnv('${esc(v).replace(/'/g,"\\'")}')">&#x2715;</button></span>`
  ).join("");
}

// Parse comma-sep env string → array
function parseEnvStr(str) {
  if (!str) return [];
  return str.split(",").map(s => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Hunt IOC list state
// ---------------------------------------------------------------------------
let _huntIOCList = [];

function addIOC() {
  const input = document.getElementById("ioc-input");
  const val = input.value.trim(); if (!val) return;
  if (!_huntIOCList.includes(val)) { _huntIOCList.push(val); renderIOCList(); }
  input.value = "";
}

function removeIOC(val) {
  _huntIOCList = _huntIOCList.filter(x => x !== val);
  renderIOCList();
}

function renderIOCList() {
  const container = document.getElementById("hunt-ioc-list"); if (!container) return;
  document.getElementById("report-hunt-ioc-json").value = JSON.stringify(_huntIOCList);
  container.innerHTML = _huntIOCList.map(v =>
    `<span class="ioc-tag">${esc(v)}<button type="button" class="tag-remove"
       onclick="removeIOC('${esc(v).replace(/'/g,"\\'")}')">&#x2715;</button></span>`
  ).join("");
}

// ---------------------------------------------------------------------------
// Hunt findings section toggle
// ---------------------------------------------------------------------------
function toggleFindingsSection() {
  const val = document.getElementById("report-hunt-has-findings")?.value;
  const section   = document.getElementById("hunt-findings-section");
  const sevGrp    = document.getElementById("hunt-severity-group");
  if (section) section.style.display = val === "Evet" ? "block" : "none";
  if (sevGrp)  sevGrp.style.display  = val === "Evet" ? "" : "none";
}

// ---------------------------------------------------------------------------
// Hunt — Report modal
// ---------------------------------------------------------------------------
function huntReportOverlayClick(e) {
  if (e.target !== e.currentTarget) return;
  if (!confirm("Raporu kapatmak istediğinize emin misiniz? Kaydedilmemiş değişiklikler kaybolacak.")) return;
  closeHuntReportModal();
}

let _huntRecommendations = [];
let _huntVulnerabilities = [];

function renderRecommendations() {
  const list = document.getElementById("rec-list");
  if (!list) return;
  list.innerHTML = _huntRecommendations.map((v, i) => `
    <div class="list-item-row">
      <textarea class="form-input" rows="2" placeholder="Öneri maddesi…" oninput="_huntRecommendations[${i}]=this.value">${esc(v)}</textarea>
      <button class="btn-remove" onclick="removeRecommendation(${i})">×</button>
    </div>`).join("");
}
function addRecommendation() {
  _huntRecommendations.push("");
  renderRecommendations();
  const els = document.querySelectorAll("#rec-list textarea");
  if (els.length) els[els.length - 1].focus();
}
function removeRecommendation(i) { _huntRecommendations.splice(i, 1); renderRecommendations(); }

function renderVulnerabilities() {
  const list = document.getElementById("vuln-list");
  if (!list) return;
  list.innerHTML = _huntVulnerabilities.map((v, i) => `
    <div class="list-item-row">
      <textarea class="form-input" rows="2" placeholder="Güvenlik açığı…" oninput="_huntVulnerabilities[${i}]=this.value">${esc(v)}</textarea>
      <button class="btn-remove" onclick="removeVulnerability(${i})">×</button>
    </div>`).join("");
}
function addVulnerability() {
  _huntVulnerabilities.push("");
  renderVulnerabilities();
  const els = document.querySelectorAll("#vuln-list textarea");
  if (els.length) els[els.length - 1].focus();
}
function removeVulnerability(i) { _huntVulnerabilities.splice(i, 1); renderVulnerabilities(); }

function toggleUcCreateFields() {
  const cb = document.getElementById("report-create-uc");
  const fields = document.getElementById("uc-create-fields");
  if (fields) fields.style.display = cb?.checked ? "block" : "none";
}

function toggleDetectionDetail() {
  const val = document.getElementById("report-hunt-detection-suggest")?.value;
  const grp = document.getElementById("detection-detail-group");
  if (grp) grp.style.display = val === "Evet" ? "block" : "none";
  if (val !== "Evet") {
    const cb = document.getElementById("report-create-uc");
    if (cb) { cb.checked = false; toggleUcCreateFields(); }
  }
}

async function openHuntReportModal(id) {
  let r = huntRows.find(x => x.id === id); if (!r) return;
  await loadMitreData();
  setupAllPaste();
  // Fetch linked_uc_id — not in list cache, computed by single-item endpoint
  try { const fresh = await apiFetch(`/api/hunt/${id}`); r = { ...r, linked_uc_id: fresh.linked_uc_id }; } catch {}

  // Hunt env tags
  _huntEnvList = parseEnvStr(r.hunt_environment);
  renderHuntEnvTags();

  // MITRE tactic/technique dropdowns
  populateMitreTacticSelect("mitre-tactic-select");
  populateMitreTechniqueSelect("mitre-technique-select", "");

  document.getElementById("report-hunt-id").value = r.id;
  document.getElementById("hunt-report-title").textContent = `Hunt Raporu — #${r.id}`;
  document.getElementById("report-hunt-scope").value = r.scope || "";

  // MITRE entries
  try {
    _huntMitreEntries = JSON.parse(r.mitre_techniques || "[]");
    if (!Array.isArray(_huntMitreEntries)) _huntMitreEntries = [];
  } catch { _huntMitreEntries = []; }
  renderHuntMitreEntries();

  // Findings section
  document.getElementById("report-hunt-has-findings").value = r.has_findings || "Hayır";
  toggleFindingsSection();
  document.getElementById("report-hunt-severity").value = r.severity || "";

  // IOC list
  try {
    _huntIOCList = JSON.parse(r.ioc_list || "[]");
    if (!Array.isArray(_huntIOCList)) _huntIOCList = [];
  } catch { _huntIOCList = []; }
  renderIOCList();

  document.getElementById("report-hunt-affected-assets").value = r.affected_assets || "";
  document.getElementById("report-hunt-findings").value        = r.findings || "";
  document.getElementById("report-hunt-detection-suggest").value = r.detection_suggestion || "Hayır";
  document.getElementById("report-hunt-detection-detail").value  = r.detection_detail || "";
  toggleDetectionDetail();

  // Recommendations list
  try {
    _huntRecommendations = JSON.parse(r.recommendations || "[]");
    if (!Array.isArray(_huntRecommendations)) _huntRecommendations = r.recommendations ? [r.recommendations] : [];
  } catch { _huntRecommendations = r.recommendations ? [r.recommendations] : []; }
  renderRecommendations();

  // Vulnerabilities list
  try {
    _huntVulnerabilities = JSON.parse(r.discovered_vulnerabilities || "[]");
    if (!Array.isArray(_huntVulnerabilities)) _huntVulnerabilities = [];
  } catch { _huntVulnerabilities = []; }
  renderVulnerabilities();

  // UC creation form — reset; disable if a linked UC already exists
  const createUcCb = document.getElementById("report-create-uc");
  if (createUcCb) { createUcCb.checked = false; createUcCb.disabled = !!r.linked_uc_id; }
  const _ucReq  = document.getElementById("uc-create-requester");
  const _ucEnv  = document.getElementById("uc-create-environment");
  const _ucDesc = document.getElementById("uc-create-description");
  if (_ucReq)  _ucReq.value  = r.requester || "";
  if (_ucEnv)  _ucEnv.value  = "";
  if (_ucDesc) _ucDesc.value = "";
  toggleUcCreateFields();
  const ucForm = document.getElementById("uc-create-form");
  if (ucForm) {
    const lbl = ucForm.querySelector("label[for='report-create-uc']");
    if (lbl) lbl.textContent = r.linked_uc_id
      ? `Bu Hunt için Use-Case zaten oluşturuldu (UC #${r.linked_uc_id})`
      : "Bu Hunt için Use-Case oluştur";
  }

  document.getElementById("report-hunt-result").value        = r.hunt_result || "";
  document.getElementById("report-hunt-duration").value      = r.hunt_duration_hours != null ? r.hunt_duration_hours : "";
  document.getElementById("report-hunt-report-status").value = r.report_status || "Taslak";
  document.getElementById("report-hunt-status").value        = r.status || "İnceleniyor";

  // Images
  [
    ["scope",           "scope_image"],
    ["affected-assets", "affected_assets_image"],
    ["findings",        "findings_image"],
    ["detection-detail","detection_detail_image"],
  ].forEach(([htmlKey, apiKey]) => {
    clearPastePreview(`report-hunt-${htmlKey}-preview`, `report-hunt-${htmlKey}-image`);
    if (r[apiKey]) restorePreview(r[apiKey], `report-hunt-${htmlKey}-preview`, `report-hunt-${htmlKey}-image`);
  });

  document.getElementById("hunt-report-modal-error").style.display = "none";
  document.getElementById("hunt-report-modal").style.display = "flex";
}
function closeHuntReportModal() { document.getElementById("hunt-report-modal").style.display = "none"; }

async function saveHuntReport() {
  const id    = document.getElementById("report-hunt-id").value;
  const errEl = document.getElementById("hunt-report-modal-error");
  errEl.style.display = "none";
  const detectionSuggest = document.getElementById("report-hunt-detection-suggest").value;
  const createUcCb = document.getElementById("report-create-uc");
  const payload = {
    scope:                    document.getElementById("report-hunt-scope").value.trim(),
    scope_image:              document.getElementById("report-hunt-scope-image").value || null,
    mitre_techniques:         _huntMitreEntries,
    has_findings:             document.getElementById("report-hunt-has-findings").value,
    severity:                 document.getElementById("report-hunt-severity").value,
    ioc_list:                 _huntIOCList,
    affected_assets:          document.getElementById("report-hunt-affected-assets").value.trim(),
    affected_assets_image:    document.getElementById("report-hunt-affected-assets-image").value || null,
    findings:                 document.getElementById("report-hunt-findings").value.trim(),
    findings_image:           document.getElementById("report-hunt-findings-image").value || null,
    detection_suggestion:     detectionSuggest,
    detection_detail:         document.getElementById("report-hunt-detection-detail").value.trim(),
    detection_detail_image:   document.getElementById("report-hunt-detection-detail-image").value || null,
    recommendations:          JSON.stringify(_huntRecommendations.filter(v => v.trim())),
    discovered_vulnerabilities: JSON.stringify(_huntVulnerabilities.filter(v => v.trim())),
    hunt_environment:         _huntEnvList.join(","),
    hunt_result:              document.getElementById("report-hunt-result").value,
    hunt_duration_hours:      document.getElementById("report-hunt-duration").value !== "" ? parseInt(document.getElementById("report-hunt-duration").value) : null,
    report_status:            document.getElementById("report-hunt-report-status").value,
    status:                   document.getElementById("report-hunt-status").value,
    create_uc:                !!(createUcCb?.checked && !createUcCb?.disabled && detectionSuggest === "Evet"),
    uc_description:           document.getElementById("uc-create-description").value.trim(),
    uc_requester:             document.getElementById("uc-create-requester").value.trim(),
    uc_environment:           document.getElementById("uc-create-environment").value,
  };
  try {
    const res = await apiFetch(`/api/hunt/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeHuntReportModal(); loadHunt(); loadKPI();
    if (res?.uc_created_id) {
      setTimeout(() => alert(`Use-Case #${res.uc_created_id} başarıyla oluşturuldu (Hunt #${id} sonucu).`), 200);
      loadUseCase();
    }
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Hunt — Detail (read-only)
// ---------------------------------------------------------------------------
async function openHuntDetail(id) {
  try {
    const r = await apiFetch(`/api/hunt/${id}`);
    document.getElementById("hunt-detail-title").textContent = `Hunt #${r.id} — ${r.hunt_subject}`;
    const HUNT_RESULT_CLS = { "Tehdit Tespit Edildi": "status-done", "Tehdit Tespit Edilmedi": "status-reviewing", "Yetersiz Veri": "status-nottuned" };
    const reportBadge = r.report_status === "Tamamlandı"
      ? `<span class="status-dot status-done">${esc(r.report_status)}</span>`
      : `<span class="status-dot status-open">${esc(r.report_status||"Taslak")}</span>`;

    // Parse JSON fields safely
    let mitreEntries = [];
    try { mitreEntries = JSON.parse(r.mitre_techniques || "[]"); if (!Array.isArray(mitreEntries)) mitreEntries = []; } catch {}
    let iocList = [];
    try { iocList = JSON.parse(r.ioc_list || "[]"); if (!Array.isArray(iocList)) iocList = []; } catch {}
    const envList = parseEnvStr(r.hunt_environment);

    const mitreBadges = mitreEntries.length
      ? mitreEntries.map(e => `<span class="mitre-tag">${esc(e.id)} — ${esc(e.name)}</span>`).join(" ")
      : "";
    const iocBadges = iocList.length
      ? iocList.map(v => `<span class="ioc-tag" style="cursor:default">${esc(v)}</span>`).join(" ")
      : "";
    const envBadges = envList.length
      ? envList.map(v => `<span class="ioc-tag" style="cursor:default">${esc(v)}</span>`).join(" ")
      : "";

    // MITRE detail section
    const mitreDetail = mitreEntries.filter(e => e.method).map(e =>
      `<div style="margin-top:8px"><span class="mitre-tag">${esc(e.id)}</span> <span class="text-muted" style="font-size:11px">${esc(e.tactic)}</span><br/><span style="white-space:pre-wrap;font-size:13px">${esc(e.method)}</span></div>`
    ).join("");

    // Parse recommendations and vulnerabilities
    let recList = [], vulnList = [];
    try { recList = JSON.parse(r.recommendations || "[]"); if (!Array.isArray(recList)) recList = r.recommendations ? [r.recommendations] : []; } catch { recList = r.recommendations ? [r.recommendations] : []; }
    try { vulnList = JSON.parse(r.discovered_vulnerabilities || "[]"); if (!Array.isArray(vulnList)) vulnList = []; } catch {}
    recList  = recList.filter(v => v.trim());
    vulnList = vulnList.filter(v => v.trim());

    const recHtml  = recList.length  ? recList.map((v, i)  => `<div style="padding:4px 0;border-bottom:1px solid var(--border-subtle, rgba(255,255,255,.06))"><span style="color:var(--text-3);margin-right:6px">${i+1}.</span>${esc(v)}</div>`).join("") : "";
    const vulnHtml = vulnList.length ? vulnList.map((v, i) => `<div style="padding:4px 0;border-bottom:1px solid var(--border-subtle, rgba(255,255,255,.06))"><span style="color:var(--text-3);margin-right:6px">${i+1}.</span>${esc(v)}</div>`).join("") : "";

    let body = `
      <div class="detail-section">
        ${detailRow("Durum", r.status)}
        ${r.validated_by ? detailRow("Ön Onay Veren", r.validated_by) : ""}
        ${r.validated_at ? detailRow("Ön Onay Tarihi", fmtDate(r.validated_at)) : ""}
        ${r.validation_note ? detailRow("Ön Onay Notu", r.validation_note) : ""}
        ${r.result_approved_by ? detailRow("Sonucu Onaylayan", r.result_approved_by) : ""}
        ${r.result_approved_at ? detailRow("Sonuç Onay Tarihi", fmtDate(r.result_approved_at)) : ""}
        ${r.result_approval_note ? detailRow("Sonuç Onay Notu", r.result_approval_note) : ""}
        ${detailRow("Talep Eden", r.requester)}
        ${detailRow("Atanan Analist", r.assigned_analyst)}
        ${envBadges ? `<div class="detail-row"><span class="detail-label">Ortam</span><span class="detail-value" style="display:flex;flex-wrap:wrap;gap:4px">${envBadges}</span></div>` : ""}
        ${detailRow("Talep Tarihi", fmtDate(r.created_at))}
        ${r.started_at ? detailRow("Hunt Başlangıcı", fmtDate(r.started_at)) : ""}
        ${detailRow("Tamamlanma Tarihi", fmtDate(r.completed_at))}
        ${r.hunt_duration_hours != null ? detailRow("Hunt Süresi", r.hunt_duration_hours + " saat") : ""}
        ${detailRow("Rapor Güncelleme", r.report_updated_at ? r.report_updated_at.slice(0,16) : "")}
        ${r.notes ? detailRow("Notlar", r.notes) : ""}
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Rapor</div>
        <div class="detail-row"><span class="detail-label">Rapor Durumu</span><span class="detail-value">${reportBadge}</span></div>
        ${r.hunt_result ? `<div class="detail-row"><span class="detail-label">Sonuç</span><span class="detail-value"><span class="status-dot ${HUNT_RESULT_CLS[r.hunt_result]||''}">${esc(r.hunt_result)}</span></span></div>` : ""}
        ${r.linked_uc_id ? `<div class="detail-row"><span class="detail-label">Bağlı Use-Case</span><span class="detail-value"><span class="status-dot status-done" style="cursor:pointer" onclick="closeHuntDetailModal();openUCDetail(${r.linked_uc_id})">UC #${r.linked_uc_id}</span></span></div>` : ""}
        ${r.has_findings === "Evet" ? `<div class="detail-row"><span class="detail-label">Bulgu</span><span class="detail-value"><span class="status-dot status-done">Evet</span></span></div>` : ""}
        ${r.severity ? detailRow("Şiddet", r.severity) : ""}
        ${mitreBadges ? `<div class="detail-row"><span class="detail-label">MITRE ATT&amp;CK</span><span class="detail-value" style="display:flex;flex-wrap:wrap;gap:4px">${mitreBadges}</span></div>` : ""}
        ${mitreDetail ? `<div style="padding:8px 0">${mitreDetail}</div>` : ""}
        ${r.scope ? `<div class="detail-section-title" style="margin-top:12px">Hedef &amp; Kapsam</div>${detailRow("", r.scope)}${r.scope_image ? detailImgRow("Görsel", [r.scope_image]) : ""}` : ""}
        ${iocBadges ? `<div class="detail-row"><span class="detail-label">IOC Listesi</span><span class="detail-value" style="display:flex;flex-wrap:wrap;gap:4px">${iocBadges}</span></div>` : ""}
        ${r.affected_assets ? `${detailRow("Etkilenen Varlıklar", r.affected_assets)}${r.affected_assets_image ? detailImgRow("Görsel", [r.affected_assets_image]) : ""}` : ""}
        ${r.findings ? `<div class="detail-section-title" style="margin-top:12px">Bulgular</div>${detailRow("", r.findings)}${r.findings_image ? detailImgRow("Görsel", [r.findings_image]) : ""}` : ""}
        ${r.detection_suggestion === "Evet" ? `<div class="detail-section-title" style="margin-top:12px">Detection Önerisi</div>${detailRow("", r.detection_detail)}${r.detection_detail_image ? detailImgRow("Görsel", [r.detection_detail_image]) : ""}` : ""}
        ${vulnHtml ? `<div class="detail-section-title" style="margin-top:12px">Keşfedilen Güvenlik Açıkları</div><div style="font-size:13px;line-height:1.6">${vulnHtml}</div>` : ""}
        ${recHtml  ? `<div class="detail-section-title" style="margin-top:12px">Güvenlik Önerileri</div><div style="font-size:13px;line-height:1.6">${recHtml}</div>` : ""}
      </div>`;
    document.getElementById("hunt-detail-body").innerHTML = body;
    document.getElementById("hunt-detail-modal").style.display = "flex";
  } catch (e) { console.error(e); }
}

async function deleteHunt(id) {
  if (!confirm("Bu hunt talebini silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/hunt/${id}`, { method: "DELETE" }); loadHunt(); loadKPI(); }
  catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
if (IS_SETTINGS) {
  loadDropdownData().then(() => {
    loadSettings();
    setupAllPaste();
    document.querySelectorAll(".table-fixed").forEach(makeColumnsResizable);
  });
} else {
  loadDropdownData().then(() => {
    loadDashboard();
    setupAllPaste();
    // Attach column resizers (tables are in static HTML, always present)
    document.querySelectorAll(".table-fixed").forEach(makeColumnsResizable);
  });
}
