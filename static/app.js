/* ============================================================
   SOC Rule Tracker — Frontend  v5
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
// Tune list
// ---------------------------------------------------------------------------
function tuneActionBtns(r) {
  const edit = `<button class="btn-icon" title="Düzenle" onclick="openTuneEditModal(${r.id})">&#9998;</button>`;
  const del  = `<button class="btn-icon danger" title="Sil" onclick="deleteTune(${r.id})">&#x1F5D1;</button>`;
  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openTuneClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor")
    return `<button class="btn-action-close" onclick="openTuneCloseModal(${r.id})">Kapat</button> ${edit}${del}`;
  return `${edit}${del}`;
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
    const tbody = document.getElementById("tune-tbody");
    const empty = document.getElementById("tune-empty");
    if (!tuneRows.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = tuneRows.map(r => `<tr>
      <td>${dot(r.status, TUNE_CLS)}</td>
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
  } catch (e) { console.error(e); }
}

function clearTuneFilters() {
  ["tune-filter-month","tune-filter-env","tune-filter-status"].forEach(id => { document.getElementById(id).value = ""; });
  loadTune();
}

// ---------------------------------------------------------------------------
// Tune — Create modal
// ---------------------------------------------------------------------------
function openTuneModal() {
  populateEnvDropdowns(); populateAnalystDropdowns();
  document.getElementById("tune-id").value        = "";
  document.getElementById("tune-reporter").value  = "";
  document.getElementById("tune-env").value        = "";
  document.getElementById("tune-rule-name").value  = "";
  document.getElementById("tune-reason").value     = "";
  document.getElementById("tune-freq").value       = "";
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
  document.getElementById("edit-tune-id").value          = r.id;
  document.getElementById("edit-tune-reporter").value    = r.reporter || "";
  document.getElementById("edit-tune-env").value         = r.environment || "";
  document.getElementById("edit-tune-rule-name").value   = r.rule_name || "";
  document.getElementById("edit-tune-reason").value      = r.tune_reason || "";
  document.getElementById("edit-tune-freq").value        = r.trigger_frequency || "";
  document.getElementById("edit-tune-status").value      = r.status || "Açık";
  document.getElementById("edit-tune-analyst").value     = r.tuning_analyst || "";
  document.getElementById("edit-tune-how").value         = r.how_tuned || "";
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
  document.getElementById("claim-tune-id").value      = id;
  document.getElementById("claim-tune-analyst").value = "";
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
  const edit = `<button class="btn-icon" title="Düzenle" onclick="openUCEditModal(${r.id})">&#9998;</button>`;
  const del  = `<button class="btn-icon danger" title="Sil" onclick="deleteUC(${r.id})">&#x1F5D1;</button>`;
  if (r.status === "Açık")
    return `<button class="btn-action-claim" onclick="openUCClaimModal(${r.id})">Üstlen</button> ${edit}${del}`;
  if (r.status === "İnceleniyor")
    return `<button class="btn-action-close" onclick="openUCCloseModal(${r.id})">Kapat</button> ${edit}${del}`;
  return `${edit}${del}`;
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
    const tbody = document.getElementById("uc-tbody");
    const empty = document.getElementById("uc-empty");
    if (!ucRows.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = ucRows.map(r => `<tr>
      <td>${dot(r.status, UC_CLS)}</td>
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
  } catch (e) { console.error(e); }
}

function clearUCFilters() {
  ["uc-filter-month","uc-filter-env","uc-filter-status"].forEach(id => { document.getElementById(id).value = ""; });
  loadUC();
}

// ---------------------------------------------------------------------------
// UC — Create
// ---------------------------------------------------------------------------
function openUCModal() {
  populateEnvDropdowns(); populateAnalystDropdowns();
  document.getElementById("uc-id").value        = "";
  document.getElementById("uc-requester").value = "";
  document.getElementById("uc-env").value       = "";
  document.getElementById("uc-desc").value      = "";
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
  document.getElementById("edit-uc-id").value          = r.id;
  document.getElementById("edit-uc-requester").value   = r.requester || "";
  document.getElementById("edit-uc-env").value         = r.environment || "";
  document.getElementById("edit-uc-desc").value        = r.usecase_description || "";
  document.getElementById("edit-uc-status").value      = r.status || "Açık";
  document.getElementById("edit-uc-rule-author").value = r.rule_author || "";
  document.getElementById("edit-uc-rule-name").value   = r.rule_name || "";
  document.getElementById("edit-uc-notes").value       = r.notes || "";
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
  document.getElementById("claim-uc-id").value      = id;
  document.getElementById("claim-uc-analyst").value = "";
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
async function loadSettings() {
  await loadDropdownData();
  const envList = document.getElementById("env-settings-list");
  if (envList) {
    envList.innerHTML = _envs.length
      ? _envs.map(e => `<li><span>${esc(e.name)}</span>
          <button class="btn-icon danger" onclick="deleteEnvironment(${e.id})">&#x1F5D1;</button></li>`).join("")
      : `<li class="text-muted" style="justify-content:center">Henüz ortam eklenmedi.</li>`;
  }
  const analyList = document.getElementById("analyst-settings-list");
  if (analyList) {
    analyList.innerHTML = _analysts.length
      ? _analysts.map(a => `<li><span>${esc(a.name)}</span>
          <button class="btn-icon danger" onclick="deleteAnalyst(${a.id})">&#x1F5D1;</button></li>`).join("")
      : `<li class="text-muted" style="justify-content:center">Henüz analist eklenmedi.</li>`;
  }
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
async function addAnalyst() {
  const inp = document.getElementById("new-analyst-input");
  const name = inp.value.trim(); if (!name) return;
  try { await apiFetch("/api/analysts", { method: "POST", body: JSON.stringify({ name }) }); inp.value = ""; loadSettings(); }
  catch (e) { alert(e.message); }
}
async function deleteAnalyst(id) {
  if (!confirm("Bu analisti silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/analysts/${id}`, { method: "DELETE" }); loadSettings(); }
  catch (e) { alert(e.message); }
}

document.getElementById("new-env-input")?.addEventListener("keydown", e => { if (e.key==="Enter") addEnvironment(); });
document.getElementById("new-analyst-input")?.addEventListener("keydown", e => { if (e.key==="Enter") addAnalyst(); });

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
// Init
// ---------------------------------------------------------------------------
if (IS_SETTINGS) {
  loadSettings();
} else {
  loadDropdownData().then(() => {
    loadDashboard();
    setupAllPaste();
  });
}
