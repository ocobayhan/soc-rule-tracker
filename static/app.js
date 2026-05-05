/* ============================================================
   SOC Tracker — Frontend  v6
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
    if (btn.dataset.tab === "dashboard") loadDashboard();
    if (btn.dataset.tab === "tuning")    loadTune();
    if (btn.dataset.tab === "usecase")   loadUC();
    if (btn.dataset.tab === "settings")  loadSettings();
    if (btn.dataset.tab === "auditlog")  loadAuditLog();
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
  if (!iso) return '<span class="text-muted">—</span>';
  return iso.slice(0, 10);
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
const TUNE_CLS = {
  "Açık":          "status-open",
  "İnceleniyor":   "status-reviewing",
  "Tamamlandı":    "status-done",
  "Tune Edilmedi": "status-nottuned",
};
const UC_CLS = {
  "Açık":        "status-open",
  "İnceleniyor": "status-reviewing",
  "Yazıldı":     "status-written",
  "Yazılamaz":   "status-cantwrite",
};

function badge(label, map) {
  return `<span class="status-dot ${map[label] || "status-nottuned"}">${esc(label)}</span>`;
}
function dot(label, map) {
  return `<span class="status-dot ${map[label] || "status-nottuned"}" style="gap:0"></span>`;
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
  ["tune-env","edit-tune-env","uc-env","edit-uc-env"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value; el.innerHTML = envOpts(cur);
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
   "edit-uc-rule-author","claim-uc-analyst"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value; el.innerHTML = analystOpts(cur);
  });
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------
async function loadKPI() {
  const month = document.getElementById("kpi-month").value;
  try {
    const d = await apiFetch(`/api/kpi${month ? "?month="+month : ""}`);
    document.getElementById("kpi-tune-open").textContent  = d.tune_open;
    document.getElementById("kpi-tune-done").textContent  = d.tune_done_this_period;
    document.getElementById("kpi-uc-written").textContent = d.uc_written;
    document.getElementById("kpi-conversion").textContent = d.conversion_rate + "%";
  } catch (_) {}
}

async function loadDashboardTables() {
  try {
    const rows = await apiFetch("/api/tune?");
    const tb   = document.getElementById("dash-tune-tbody");
    tb.innerHTML = rows.length
      ? rows.slice(0,8).map(r => `<tr>
          <td>${badge(r.status,TUNE_CLS)}</td>
          <td class="td-truncate">${esc(r.rule_name)}</td>
          <td>${esc(r.environment)}</td>
          <td>${esc(r.reporter)}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="text-muted" style="padding:16px;text-align:center">Henüz kayıt yok.</td></tr>`;
  } catch (_) {}

  try {
    const rows = await apiFetch("/api/usecase?");
    const tb   = document.getElementById("dash-uc-tbody");
    tb.innerHTML = rows.length
      ? rows.slice(0,8).map(r => `<tr>
          <td>${badge(r.status,UC_CLS)}</td>
          <td class="td-truncate">${esc(r.usecase_description)}</td>
          <td>${esc(r.environment)}</td>
          <td>${esc(r.requester)}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="text-muted" style="padding:16px;text-align:center">Henüz kayıt yok.</td></tr>`;
  } catch (_) {}
}

function loadDashboard() { loadKPI(); loadDashboardTables(); }

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
  document.getElementById("tune-detail-title").textContent = r.rule_name;
  document.getElementById("tune-detail-body").innerHTML = `<div class="detail-grid">
    ${detailRow("Raporlayan",    r.reporter)}
    ${detailRow("Ortam",         r.environment)}
    ${detailRow("Durum",         r.status)}
    ${detailRow("Tetiklenme",    r.trigger_frequency)}
    ${detailRow("Tune Nedeni",   r.tune_reason)}
    ${detailImgRow("Kanıt Görseli", [r.evidence_image])}
    ${detailRow("Tune Eden",     r.tuning_analyst)}
    ${detailRow("Nasıl Tune Edildi", r.how_tuned)}
    ${detailImgRow("Çözüm Görseli", [r.resolution_image])}
    ${detailRow("Raporlandı",    r.created_at ? r.created_at.slice(0,10) : "")}
    ${detailRow("Tamamlandı",    r.completed_at ? r.completed_at.slice(0,10) : "")}
  </div>`;
  document.getElementById("tune-detail-modal").style.display = "flex";
}

function openUCDetail(id) {
  const r = ucRows.find(x => x.id === id); if (!r) return;
  document.getElementById("uc-detail-title").textContent = r.usecase_description.slice(0, 60) + (r.usecase_description.length > 60 ? "…" : "");
  document.getElementById("uc-detail-body").innerHTML = `<div class="detail-grid">
    ${detailRow("Talep Eden",    r.requester)}
    ${detailRow("Ortam",         r.environment)}
    ${detailRow("Durum",         r.status)}
    ${detailRow("Use-Case",      r.usecase_description)}
    ${detailRow("Analist",       r.rule_author)}
    ${detailRow("Yazılan Kural", r.rule_name)}
    ${detailRow("Notlar",        r.notes)}
    ${detailRow("Talep Tarihi",  r.created_at ? r.created_at.slice(0,10) : "")}
    ${detailRow("Yazılma Tarihi",r.completed_at ? r.completed_at.slice(0,10) : "")}
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
  const cols = prefix === "tune"
    ? ["id", "rule_name", "status", "created_at"]
    : ["id", "usecase_description", "status", "created_at"];
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
  const isAdmin      = USER_ROLE === "admin" || USER_ROLE === "user";
  const isMyTask     = r.tuning_analyst === CURRENT_USER;
  const isMyReport   = r.reporter === CURRENT_USER;

  const canEdit = isAdmin || isMyTask || isMyReport;
  const edit = canEdit
    ? `<button class="btn-icon" title="Düzenle" onclick="openTuneEditModal(${r.id})">&#9998;</button>`
    : "";
  const del = isAdmin
    ? `<button class="btn-icon danger" title="Sil" onclick="deleteTune(${r.id})">&#x1F5D1;</button>`
    : "";

  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openTuneClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor" && (isAdmin || isMyTask))
    return `<button class="btn-action-close" onclick="openTuneCloseModal(${r.id})">Kapat</button> ${edit}${del}`;
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
    <td>${dot(r.status, TUNE_CLS)}</td>
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
  document.getElementById("close-tune-status").value = "Tamamlandı";
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
// UC list
// ---------------------------------------------------------------------------
function ucActionBtns(r) {
  const isAdmin    = USER_ROLE === "admin" || USER_ROLE === "user";
  const isMyTask   = r.rule_author === CURRENT_USER;
  const isMyReport = r.requester  === CURRENT_USER;

  const canEdit = isAdmin || isMyTask || isMyReport;
  const edit = canEdit
    ? `<button class="btn-icon" title="Düzenle" onclick="openUCEditModal(${r.id})">&#9998;</button>`
    : "";
  const del  = isAdmin
    ? `<button class="btn-icon danger" title="Sil" onclick="deleteUC(${r.id})">&#x1F5D1;</button>`
    : "";

  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openUCClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor" && (isAdmin || isMyTask))
    return `<button class="btn-action-close" onclick="openUCCloseModal(${r.id})">Kapat</button> ${edit}${del}`;
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
    <td>${dot(r.status, UC_CLS)}</td>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.usecase_description)}">
      <span class="cell-link" onclick="openUCDetail(${r.id})" style="cursor:pointer">${esc(r.usecase_description)}</span>
    </td>
    <td class="td-truncate">${esc(r.environment)}</td>
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
  document.getElementById("uc-id").value  = "";
  document.getElementById("uc-env").value = "";
  document.getElementById("uc-desc").value = "";
  // Talep Eden: analist sadece kendisi
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
  const payload = {
    requester:           document.getElementById("uc-requester").value,
    environment:         document.getElementById("uc-env").value,
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
  document.getElementById("edit-uc-id").value     = r.id;
  document.getElementById("edit-uc-env").value    = r.environment || "";
  document.getElementById("edit-uc-desc").value   = r.usecase_description || "";
  document.getElementById("edit-uc-status").value = r.status || "Açık";
  document.getElementById("edit-uc-rule-name").value = r.rule_name || "";
  document.getElementById("edit-uc-notes").value  = r.notes || "";
  // Alan kilitleme: role ve sahipliğe göre
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    const isAssigned  = r.rule_author === CURRENT_USER;
    const isRequester = r.requester   === CURRENT_USER;
    // Talep eden her zaman kilitli
    lockToSelf("edit-uc-requester");
    // Kural yazarı alanı: atanmışsa kendine kilitli, değilse salt okunur
    if (isAssigned) {
      lockToSelf("edit-uc-rule-author");
    } else {
      const sel = document.getElementById("edit-uc-rule-author");
      sel.innerHTML = `<option value="${esc(r.rule_author||"")}">${esc(r.rule_author||"—")}</option>`;
      sel.disabled  = true;
    }
    // Talep alanları (talep eden doldurur): yalnızca talep eden düzenleyebilir
    ["edit-uc-env","edit-uc-desc"].forEach(id => {
      document.getElementById(id).disabled = !isRequester;
    });
    // Çalışma alanları (analist doldurur): yalnızca atanmış analist düzenleyebilir
    ["edit-uc-status","edit-uc-rule-name","edit-uc-notes"].forEach(id => {
      document.getElementById(id).disabled = !isAssigned;
    });
  } else {
    // Admin: tüm alanlar serbest
    ["edit-uc-env","edit-uc-desc","edit-uc-status","edit-uc-rule-name","edit-uc-notes"].forEach(id => {
      document.getElementById(id).disabled = false;
    });
    freeSelect("edit-uc-requester",   r.requester   || "");
    freeSelect("edit-uc-rule-author", r.rule_author || "");
    document.getElementById("edit-uc-rule-author").disabled = false;
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
    environment:         document.getElementById("edit-uc-env").value,
    usecase_description: document.getElementById("edit-uc-desc").value.trim(),
    status:              document.getElementById("edit-uc-status").value,
    rule_author:         document.getElementById("edit-uc-rule-author").value,
    rule_name:           document.getElementById("edit-uc-rule-name").value.trim(),
    notes:               document.getElementById("edit-uc-notes").value.trim(),
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
// UC — Close (Kapat)
// ---------------------------------------------------------------------------
function openUCCloseModal(id) {
  document.getElementById("close-uc-id").value        = id;
  document.getElementById("close-uc-rule-name").value = "";
  document.getElementById("close-uc-notes").value     = "";
  document.getElementById("close-uc-status").value    = "Yazıldı";
  document.getElementById("close-uc-error").style.display = "none";
  document.getElementById("uc-close-modal").style.display = "flex";
}
function closeUCCloseModal() { document.getElementById("uc-close-modal").style.display = "none"; }

async function saveUCClose() {
  const id    = document.getElementById("close-uc-id").value;
  const errEl = document.getElementById("close-uc-error");
  errEl.style.display = "none";
  const payload = {
    rule_name:   document.getElementById("close-uc-rule-name").value.trim(),
    notes:       document.getElementById("close-uc-notes").value.trim(),
    status:      document.getElementById("close-uc-status").value,
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
  "CREATE_USER": "Kullanıcı oluşturuldu",
  "DELETE_USER": "Kullanıcı silindi",
};
const ACTION_CLS = {
  "LOGIN": "audit-login",
  "CREATE_TUNE": "audit-create", "CREATE_UC": "audit-create", "CREATE_USER": "audit-create",
  "CLAIM_TUNE":  "audit-claim",  "CLAIM_UC":  "audit-claim",
  "CLOSE_TUNE":  "audit-close",  "CLOSE_UC":  "audit-close",
  "EDIT_TUNE":   "audit-edit",   "EDIT_UC":   "audit-edit",
  "DELETE_TUNE": "audit-delete", "DELETE_UC": "audit-delete", "DELETE_USER": "audit-delete",
};

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
}

async function loadUsersList() {
  const list = document.getElementById("user-settings-list");
  if (!list) return;
  try {
    const users = await apiFetch("/api/users");
    const ROLE_LABEL = { admin: "Admin", analyst: "Analist" };
    list.innerHTML = users.length
      ? users.map(u => `<li>
          <span>${esc(u.username)}
            <span class="user-role-badge role-${u.role}">${ROLE_LABEL[u.role] || u.role}</span>
          </span>
          <button class="btn-icon danger" onclick="deleteUser(${u.id}, '${esc(u.username)}')">&#x1F5D1;</button>
        </li>`).join("")
      : `<li class="text-muted" style="justify-content:center">Henüz kullanıcı eklenmedi.</li>`;
  } catch (e) { console.error(e); }
}

async function addUser() {
  const username = document.getElementById("new-user-username").value.trim();
  const password = document.getElementById("new-user-password").value.trim();
  const role     = document.getElementById("new-user-role").value;
  const errEl    = document.getElementById("user-form-error");
  errEl.style.display = "none";
  if (!username || !password) {
    errEl.textContent = "Kullanıcı adı ve şifre zorunludur.";
    errEl.style.display = "block"; return;
  }
  try {
    await apiFetch("/api/users", { method: "POST", body: JSON.stringify({ username, password, role }) });
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
["tune-modal","tune-edit-modal","tune-claim-modal","tune-close-modal",
 "tune-detail-modal","uc-detail-modal",
 "uc-modal","uc-edit-modal","uc-claim-modal","uc-close-modal"].forEach(id => {
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
// Init
// ---------------------------------------------------------------------------
if (IS_SETTINGS) {
  loadSettings();
} else {
  loadDropdownData().then(() => {
    loadDashboard();
    setupAllPaste();
    // Attach column resizers (tables are in static HTML, always present)
    document.querySelectorAll(".table-fixed").forEach(makeColumnsResizable);
  });
}
