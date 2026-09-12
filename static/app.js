/* ============================================================
   SOC Tracker — Frontend  v57
   ============================================================ */

const IS_SETTINGS = !!document.getElementById("tab-settings");
// Admin artık hem Dashboard hem Ayarlar sekmesine sahip; hangisinin
// başlangıçta eager-load edileceği IS_SETTINGS yerine tab-dashboard'ın
// DOM'da var olup olmamasına göre belirlenir (sadece 'settings' rolünde
// dashboard sekmesi hiç render edilmiyor).
const HAS_DASHBOARD = !!document.getElementById("tab-dashboard");

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------
// [data-tab] şart — "Çıkış" linki ve sidebar daraltma butonu da .nav-btn
// sınıfını (görsel tutarlılık için) kullanıyor ama gerçek bir sekme değil;
// data-tab'sız bir düğmede document.getElementById("tab-undefined") null
// dönüp .classList.add çağrısı hata fırlatırdı (2026-09-08, koddan bulundu).
document.querySelectorAll(".nav-btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "dashboard")      loadDashboard();
    if (btn.dataset.tab === "tuning")         loadTune();
    if (btn.dataset.tab === "usecase")        loadUC();
    if (btn.dataset.tab === "threat-hunting") loadHunt();
    if (btn.dataset.tab === "incident")       loadIncidents();
    if (btn.dataset.tab === "settings")       loadSettings();
    if (btn.dataset.tab === "auditlog")       loadAuditLog();
  });
});

// ---------------------------------------------------------------------------
// Sidebar daraltma/genişletme — tercih localStorage'da kalıcı (2026-09-08)
// ---------------------------------------------------------------------------
function toggleSidebar() {
  const sb = document.getElementById("app-sidebar");
  if (!sb) return;
  const collapsed = sb.classList.toggle("collapsed");
  try { localStorage.setItem("soc_sidebar_collapsed", collapsed ? "1" : "0"); } catch {}
  const btn = document.getElementById("sidebar-toggle-btn");
  if (btn) btn.title = collapsed ? "Genişlet" : "Daralt";
}
(function restoreSidebarState() {
  let collapsed = false;
  try { collapsed = localStorage.getItem("soc_sidebar_collapsed") === "1"; } catch {}
  if (!collapsed) return;
  const sb = document.getElementById("app-sidebar");
  if (sb) sb.classList.add("collapsed");
  const btn = document.getElementById("sidebar-toggle-btn");
  if (btn) btn.title = "Genişlet";
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Oturum sona erdi, giriş sayfasına yönlendiriliyorsunuz…");
  }
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

/** Arama/filtre karşılaştırmaları için küçük harfe çevirme. Sadece Türkçe
 * büyük noktalı İ (U+0130) için hedefli düzeltme yapar — düz `.toLowerCase()`
 * bunu "i" + ayrı bir kombine nokta karakterine ayırıyor, düz "istanbul" arama
 * terimiyle asla eşleşmiyor. Tam Türkçe locale'ine (`toLocaleLowerCase("tr")`)
 * GEÇİLMİYOR — o da düz ASCII "I"yı "ı"ya çeviriyor, bu da İngilizce/teknik
 * terimlerde ("MITRE", "UNIQUE" vb.) aramayı bozuyor (canlı testte
 * doğrulandı: "MITRE" ıTRE'ye dönüşüp arama terimiyle eşleşmiyordu). */
function trLower(s) { return String(s).replace(/İ/g, "i").toLowerCase(); }

/** Serbest metin aramasında bir alanın ham değeriyle VEYA görünen adıyla
 * (displayName) eşleşip eşleşmediğini kontrol eder — kullanıcı tabloda
 * "Ahmet Yılmaz" görüp aynı ismi arayınca ham kullanıcı adına ("ayilmaz")
 * göre eşleşme yapılmadığı için 0 sonuç dönmesin diye (2026-09-08). */
function fieldMatchesTerm(row, field, term) {
  const raw = row[field];
  if (raw == null) return false;
  if (trLower(String(raw)).includes(term)) return true;
  return trLower(displayName(raw)).includes(term);
}

/** created_at "YYYY-MM-DD HH:MM:SS" son N ay içinde mi? (varsayılan tarih filtresi) */
function withinLastMonths(dateStr, months) {
  if (!dateStr) return true;
  const d = new Date(String(dateStr).replace(" ", "T"));
  if (isNaN(d)) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return d >= cutoff;
}

/** "Son 6 Ay" / "Tümünü Göster" toggle butonunun etiketini günceller. */
function updateRangeToggleUI(prefix, showAll) {
  const btn = document.getElementById(`${prefix}-range-toggle`);
  if (!btn) return;
  btn.textContent = showAll ? "Son 6 Aya Dön" : "Tümünü Göster";
  btn.classList.toggle("range-toggle-active", showAll);
}

// ---------------------------------------------------------------------------
// Otomatik büyüyen metin kutuları (2026-09-07) — .form-textarea yazdıkça
// içeriğe göre büyür, styles.css'teki max-height'ten sonra kaydırmaya geçer.
// ---------------------------------------------------------------------------
function autoGrowTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
function autoGrowAll(root) {
  (root || document).querySelectorAll(".form-textarea").forEach(autoGrowTextarea);
}
document.addEventListener("input", e => {
  if (e.target.matches && e.target.matches(".form-textarea")) autoGrowTextarea(e.target);
});

// ---------------------------------------------------------------------------
// Liste ekleme: yaz → onayla → yerleş (2026-09-07) — Bölümler/Bulgular/MITRE
// notu/Etkilenen Varlıklar/Öneriler/Zafiyetler listelerinin paylaştığı state
// machine. Düzenleme durumu ASLA dizi elemanlarının içine yazılmaz (ayrı bir
// state nesnesinde tutulur) — kaydetme/doğrulama kodu ve backend'e giden veri
// şekli hiç değişmez, bkz. docs/PROGRESS.md.
// ---------------------------------------------------------------------------
function makeListEditState() { return { index: null, snapshot: null, error: null }; }

function listEditSettleActive(state, list) {
  if (state.index === null) return;
  if (state.snapshot === null) list.splice(state.index, 1);
  else list[state.index] = state.snapshot;
  state.index = null; state.snapshot = null; state.error = null;
}
function listEditBeginNew(state, list, blankItem) {
  listEditSettleActive(state, list);
  list.push(blankItem);
  state.index = list.length - 1;
  state.snapshot = null;
}
function listEditBeginEdit(state, list, index) {
  const shift = state.index !== null && state.snapshot === null && state.index < index;
  listEditSettleActive(state, list);
  state.index = shift ? index - 1 : index;
  const current = list[state.index];
  // Düz string listeleri (Öneriler/Zafiyetler) için obje spread'i yanlış
  // sonuç üretir (string'i karakter dizisine çevirir) — string'ler zaten
  // immutable olduğu için doğrudan referans almak güvenli bir "kopya"dır.
  state.snapshot = (current !== null && typeof current === "object") ? { ...current } : current;
}
function listEditConfirm(state, list, isValidFn, errorMsg, renderFn) {
  if (state.index === null) return;
  if (!isValidFn(list[state.index])) { state.error = errorMsg; renderFn(); return; }
  state.index = null; state.snapshot = null; state.error = null;
  renderFn();
}
function listRemoveItem(state, list, index) {
  list.splice(index, 1);
  if (state.index === null) return;
  if (state.index === index) { state.index = null; state.snapshot = null; state.error = null; }
  else if (state.index > index) { state.index -= 1; }
}

function renderComposeRow({ isEditing, isNew, composeHtml, settledHtml, error, index, confirmFn, cancelFn, editFn, removeFn }) {
  if (isEditing) {
    return `<div class="mitre-entry compose-row">
      ${composeHtml}
      ${error ? `<div class="compose-row-error">${esc(error)}</div>` : ""}
      <div class="compose-row-actions">
        <button type="button" class="btn-ghost-sm" onclick="${cancelFn}(${index})">İptal</button>
        <button type="button" class="btn btn-primary" onclick="${confirmFn}(${index})">${isNew ? "Ekle" : "Kaydet"}</button>
      </div></div>`;
  }
  return `<div class="mitre-entry settled-row">
    <div class="settled-row-body">${settledHtml}</div>
    <div class="settled-row-actions">
      <button type="button" class="btn-icon success" title="Düzenle" onclick="${editFn}(${index})">&#9998;</button>
      <button type="button" class="btn-icon danger" title="Kaldır" onclick="${removeFn}(${index})">&#x2715;</button>
    </div></div>`;
}

/** data-copy attribute'ündeki metni panoya kopyalar, butonda kısa bir
 * "Kopyalandı" geri bildirimi gösterir. SOAR case linki gibi, tıklamayla
 * açıldığında SameSite=Strict yüzünden giriş ekranına düşen ama yeni sekmeye
 * yapıştırınca çalışan URL'ler için (bkz. tune detay modali). */
function copyFromAttr(btn) {
  const text = btn.getAttribute("data-copy") || "";
  const done = () => {
    const old = btn.innerHTML;
    btn.innerHTML = "&#10003; Kopyalandı";
    setTimeout(() => { btn.innerHTML = old; }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  // navigator.clipboard yalnızca güvenli bağlamlarda (https / localhost) çalışır;
  // düz http üzerinden erişilen kurulumlar için execCommand yedeği.
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    done();
  } catch (e) { console.error("Kopyalama başarısız", e); }
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
const UC_CLS = {
  "Ön Onay Bekliyor": "status-pending",
  "Açık":          "status-open",
  "İnceleniyor":   "status-reviewing",
  "Test Ediliyor": "status-testing",
  "Prod'da Aktif": "status-prod",
  "Yazılamaz":     "status-cant",
  "Reddedildi":    "status-rejected",
};
function badge(label, map) {
  return `<span class="badge ${map[label] || "status-skipped"}">${esc(label)}</span>`;
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
  if (!res.ok) {
    let msg = "Görsel yüklenemedi";
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
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
  // Sidebar'daki oturum sahibi ismi de kullanıcı adından Ad Soyad'a çevrilir
  const nameEl = document.getElementById("sidebar-user-name");
  if (nameEl && typeof CURRENT_USER !== "undefined") {
    const shown = displayName(CURRENT_USER);
    nameEl.textContent = shown;
    const avatarEl = document.getElementById("sidebar-user-avatar");
    if (avatarEl && shown) avatarEl.textContent = shown[0].toUpperCase();
  }
}

function envOpts(cur = "") {
  return `<option value="">— Seçin —</option>` +
    _envs.map(e => `<option value="${esc(e.name)}"${e.name===cur?" selected":""}>${esc(e.name)}</option>`).join("");
}

function analystOpts(cur = "", allowEmpty = true) {
  const empty = allowEmpty ? `<option value="">— Seçin —</option>` : "";
  return empty + _analysts.map(a =>
    `<option value="${esc(a.name)}"${a.name===cur?" selected":""}>${esc(a.full_name || a.name)}</option>`
  ).join("");
}

/** Kullanıcı adını arayüzde göstermek için Ad Soyad'a çevirir (yoksa
 * kullanıcı adına düşer). DB/eşleştirme/webhook her zaman kullanıcı
 * adı üzerinden çalışmaya devam eder — bu sadece gösterim katmanı. */
function displayName(username) {
  if (!username) return username;
  const a = _analysts.find(x => x.name === username);
  return (a && a.full_name) || username;
}

function populateEnvDropdowns() {
  // Tune + Incident Report still use plain single-selects
  ["tune-env","edit-tune-env","incident-edit-env"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value; el.innerHTML = envOpts(cur);
  });
  // UC + Hunt use tag-based selectors — populate their hidden selects
  const envOpsSimple = `<option value="">— Ortam seçin —</option>` +
    _envs.map(e => `<option value="${esc(e.name)}">${esc(e.name)}</option>`).join("");
  ["uc-env-select","edit-uc-env-select","hunt-report-env-select","uc-create-env-select"].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = envOpsSimple;
  });
  ["tune-filter-env","uc-filter-env","incident-filter-env","hunt-filter-env"].forEach(id => {
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
   "hunt-requester","edit-hunt-requester","claim-hunt-analyst",
   "uc-create-requester"].forEach(id => {
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
    const setEmpty = (id, total) => { const el = document.getElementById(id); if (el) el.style.display = total === 0 ? "" : "none"; };
    // Sidebar modül sayaçları (mockup deseni) — sadece ay filtresi
    // yokken güncellenir, Dashboard'daki ay seçimi bu sayıları
    // yanıltıcı şekilde değiştirmesin diye (bunlar "toplam kayıt"
    // anlamına geliyor, seçili aya özgü değil).
    if (!month) {
      set("nav-count-tuning", d.tune_total);
      set("nav-count-usecase", d.uc_total);
      set("nav-count-threat-hunting", d.hunt_total);
      set("nav-count-incident", d.incident_total);
    }
    set("kpi-tune-total",     d.tune_total);
    set("kpi-tune-open",      d.tune_open);
    set("kpi-tune-pending",   d.tune_pending);
    set("kpi-tune-success",   d.tune_success);
    const rate = d.tune_success_rate ?? 0;
    set("kpi-tune-rate", rate + "%");
    const fill = document.getElementById("kpi-tune-rate-fill");
    if (fill) fill.style.width = Math.min(rate, 100) + "%";
    set("kpi-tune-pendingval", d.tune_pending_validation);
    set("kpi-tune-rejected",   d.tune_rejected);
    setEmpty("kpi-tune-empty", d.tune_total);
    set("kpi-uc-total",       d.uc_total);
    set("kpi-uc-open",        d.uc_open);
    set("kpi-uc-testing",     d.uc_testing);
    set("kpi-uc-prod",        d.uc_prod);
    set("kpi-uc-pendingval",  d.uc_pending_validation);
    set("kpi-uc-rejected",    d.uc_rejected);
    setEmpty("kpi-uc-empty", d.uc_total);
    set("kpi-hunt-total",     d.hunt_total);
    set("kpi-hunt-open",      d.hunt_open);
    set("kpi-hunt-reviewing", d.hunt_reviewing);
    set("kpi-hunt-done",      d.hunt_done);
    set("kpi-hunt-pendingval",   d.hunt_pending_validation);
    set("kpi-hunt-resultpending", d.hunt_result_pending);
    set("kpi-hunt-rejected",     d.hunt_rejected);
    set("kpi-hunt-recommendations", d.hunt_recommendations_count);
    set("kpi-hunt-ucs",             d.hunt_ucs_from_hunt);
    set("kpi-hunt-planned-rate",    (d.hunt_planned_executed_rate ?? 0) + "%");
    set("kpi-hunt-total-hours",     d.hunt_total_hours);
    set("kpi-hunt-hours-scope",     month ? "(bu ay)" : "(tüm zamanlar)");
    setEmpty("kpi-hunt-empty", d.hunt_total);
    set("kpi-incident-total",   d.incident_total);
    set("kpi-incident-open",    d.incident_open);
    set("kpi-incident-review",  d.incident_review);
    set("kpi-incident-closed",  d.incident_closed);
    set("kpi-incident-pending", d.incident_pending);
    set("kpi-incident-assets",  d.incident_affected_assets_total);
    setEmpty("kpi-incident-empty", d.incident_total);
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
          <td class="td-truncate" title="${esc(r.rule_name)}">${esc(r.rule_name)}</td>
          <td class="text-muted" title="${esc(r.tuning_analyst || r.reporter)}">${esc(displayName(r.tuning_analyst || r.reporter))}</td>
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
          <td class="td-truncate" title="${esc(r.usecase_description)}">${esc(r.usecase_description)}</td>
          <td class="text-muted" title="${esc(r.rule_author || r.requester)}">${esc(displayName(r.rule_author || r.requester))}</td>
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
          <td class="td-truncate" title="${esc(r.hunt_title || r.hunt_subject)}">${esc(r.hunt_title || r.hunt_subject)}</td>
          <td class="text-muted" title="${esc(r.assigned_analyst || r.requester)}">${esc(displayName(r.assigned_analyst || r.requester))}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : empty(4);
  } catch (_) {}

  try {
    const rows = await apiFetch("/api/incident-reports?");
    const tb   = document.getElementById("dash-incident-tbody");
    if (!tb) return;
    tb.innerHTML = rows.length
      ? rows.slice(0,6).map(r => `<tr>
          <td>${badge(r.status,INCIDENT_CLS)}</td>
          <td class="td-truncate" title="${esc(r.title)}">${esc(r.title)}</td>
          <td class="text-muted" title="${esc(r.reporter)}">${esc(displayName(r.reporter))}</td>
          <td class="text-muted">${fmtDate(r.created_at)}</td>
        </tr>`).join("")
      : empty(4);
  } catch (_) {}
}

// ---- Bana bekleyen işler --------------------------------------------------
const WORK_TYPE_LABEL = { tune: "Tune", usecase: "UC", hunt: "Hunt", incident: "Olay" };
const WORK_TYPE_COLOR = { tune: "var(--amber)", usecase: "var(--teal)", hunt: "var(--purple)", incident: "var(--red)" };

function renderMyWorkList(elId, items) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!items.length) { el.innerHTML = `<div class="mywork-empty">Bekleyen bir iş yok.</div>`; return; }
  // Durum-badge class map'i çağrı anında kurulur — TUNE_CLS/UC_CLS/HUNT_CLS/
  // INCIDENT_CLS dosyada bu satırdan sonra tanımlı, modül yüklenirken
  // erişilemezler (TDZ). incident eksikse badge(status, undefined) JS
  // hatası fırlatıp tüm paneli boş bırakırdı (2026-09-08, uygulamadan önce
  // kod okuyarak bulundu).
  const clsMap = { tune: TUNE_CLS, usecase: UC_CLS, hunt: HUNT_CLS, incident: INCIDENT_CLS };
  el.innerHTML = items.map(it => `
    <div class="mywork-item" onclick="goToItem('${it.type}', ${it.id})" title="Aç: #${it.id}">
      <span class="mywork-type" style="color:${WORK_TYPE_COLOR[it.type]}">${WORK_TYPE_LABEL[it.type]}</span>
      <span class="mywork-title" title="${esc(it.title)}">${esc(it.title)}</span>
      ${badge(it.status, clsMap[it.type])}
      <span class="mywork-meta">${it.sub ? esc(displayName(it.sub)) : ""} · ${fmtDate(it.created_at)}</span>
    </div>`).join("");
}

async function loadMyWork() {
  const panel = document.getElementById("mywork-panel");
  if (!panel) return;
  try {
    const d = await apiFetch("/api/my-work");
    // Onay sütunu yalnızca onay yetkisi olanlar (Kıdemli Analist/Müdür) için
    // anlamlı — değilse tümüyle gizle, yer kaplamasın. Gizlenince "Üzerimdeki
    // İşler" tek başına kalıp grid'in yarısını boş bırakmasın diye panel
    // tam genişlik moduna geçer (2026-09-08).
    const approvalCol = document.getElementById("mywork-approval-col");
    if (approvalCol) approvalCol.style.display = IS_SENIOR ? "" : "none";
    panel.classList.toggle("mywork-single-col", !IS_SENIOR);
    renderMyWorkList("mywork-approval", d.awaiting_approval || []);
    renderMyWorkList("mywork-assigned", d.assigned_to_me || []);
    const setC = (id, n) => { const e = document.getElementById(id); if (e) e.textContent = n; };
    setC("mywork-approval-count", (d.awaiting_approval || []).length);
    setC("mywork-assigned-count", (d.assigned_to_me || []).length);
  } catch (_) {}
}

/** Bir modül öğesine git: sekmeyi aç, verisini yükle, detay modalini aç. */
async function goToItem(type, id) {
  const map = {
    tune:     { tab: "tuning",         load: loadTune,      open: openTuneDetail },
    usecase:  { tab: "usecase",        load: loadUC,        open: openUCDetail },
    hunt:     { tab: "threat-hunting", load: loadHunt,      open: openHuntDetail },
    incident: { tab: "incident",       load: loadIncidents, open: openIncidentDetail },
  };
  const m = map[type]; if (!m) return;
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-tab="${m.tab}"]`);
  if (btn) btn.classList.add("active");
  const panel = document.getElementById("tab-" + m.tab);
  if (panel) panel.classList.add("active");
  await m.load();
  m.open(id);
}

// ---- Trend (son 12 ay) mini grafikleri ------------------------------------
function _sparkPath(values, w, h, pad, max) {
  const n = values.length;
  if (!n) return "";
  const dx = (w - pad * 2) / Math.max(1, n - 1);
  return values.map((v, i) => {
    const x = pad + i * dx;
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

const TR_MONTHS_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
function fmtMonthShort(ym) {
  const [y, m] = (ym || "").split("-");
  const idx = parseInt(m, 10) - 1;
  return (TR_MONTHS_SHORT[idx] || ym) + " " + (y || "").slice(2);
}

let _trendCardDefs = [];  // { title, months, series } — index eşleşir onclick="openTrendDetail(i)" ile

function trendCard(idx, title, months, series) {
  const w = 280, h = 76, pad = 8;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const lines = series.map(s =>
    `<path d="${_sparkPath(s.values, w, h, pad, max)}" fill="none" stroke="${s.color}"
       stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`).join("");
  const dots = series.map(s => {
    const n = s.values.length, dx = (w - pad * 2) / Math.max(1, n - 1);
    const x = pad + (n - 1) * dx, y = h - pad - (s.values[n - 1] / max) * (h - pad * 2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="${s.color}"/>`;
  }).join("");
  const legend = series.map(s =>
    `<span class="trend-leg"><span class="trend-dot" style="background:${s.color}"></span>${s.name}
       <strong>${s.values[s.values.length - 1]}</strong></span>`).join("");
  return `<div class="trend-card" onclick="openTrendDetail(${idx})" style="cursor:pointer" title="Büyütmek için tıklayın">
    <div class="trend-title">${title}</div>
    <svg viewBox="0 0 ${w} ${h}" class="trend-svg" preserveAspectRatio="none">${lines}${dots}</svg>
    <div class="trend-legend">${legend}</div>
    <div class="trend-range">${months[0]} → ${months[months.length - 1]}</div>
  </div>`;
}

// Büyütülmüş grafik: her noktanın altında ay etiketi, üstünde/altında değeri.
function _trendDetailSvg(months, series) {
  const w = 780, h = 320, padL = 36, padR = 20, padT = 24, padB = 40;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const n = months.length;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const dx = innerW / Math.max(1, n - 1);
  const xAt = i => padL + i * dx;
  const yAt = v => padT + innerH - (v / max) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y = padT + innerH - f * innerH;
    return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>
            <text x="${padL - 6}" y="${(y + 3).toFixed(1)}" font-size="9" fill="var(--text-3)" text-anchor="end">${Math.round(f * max)}</text>`;
  }).join("");

  const monthLabels = months.map((mo, i) =>
    `<text x="${xAt(i).toFixed(1)}" y="${h - padB + 27}" font-size="9" fill="var(--text-3)" text-anchor="middle">${fmtMonthShort(mo)}</text>`
  ).join("");

  const seriesSvg = series.map((s, si) => {
    const path = s.values.map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
    const dots = s.values.map((v, i) => {
      const x = xAt(i), y = yAt(v);
      // İki seri üst üste binmesin diye: ilk seri etiketleri üstte, ikincisi altta.
      const labelY = si === 0 ? y - 8 : y + 12;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${s.color}"/>
              <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" font-size="9.5" font-weight="600" fill="${s.color}" text-anchor="middle">${v}</text>`;
    }).join("");
    return `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
  }).join("");

  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">${gridLines}${monthLabels}${seriesSvg}</svg>`;
}

function openTrendDetail(idx) {
  const def = _trendCardDefs[idx]; if (!def) return;
  document.getElementById("trend-detail-title").textContent = def.title;
  const legend = def.series.map(s =>
    `<span class="trend-leg"><span class="trend-dot" style="background:${s.color}"></span>${s.name}</span>`).join("");
  document.getElementById("trend-detail-chart").innerHTML =
    _trendDetailSvg(def.months, def.series) + `<div class="trend-legend" style="margin-top:8px">${legend}</div>`;
  document.getElementById("trend-detail-modal").style.display = "flex";
}
function closeTrendDetailModal() { document.getElementById("trend-detail-modal").style.display = "none"; }

async function loadTrends() {
  const box = document.getElementById("trend-cards");
  if (!box) return;
  try {
    const d = await apiFetch("/api/trends?months=12");
    const m = d.months;
    _trendCardDefs = [
      { title: "Kural Tuning", months: m, series: [
        { name: "Açılan",  values: d.tune.opened,    color: "var(--amber)" },
        { name: "Kapanan", values: d.tune.closed,    color: "var(--green)" },
      ]},
      { title: "Use-Case", months: m, series: [
        { name: "Açılan",  values: d.usecase.opened, color: "var(--teal)" },
        { name: "Kapanan", values: d.usecase.closed, color: "var(--green)" },
      ]},
      { title: "Threat Hunt", months: m, series: [
        { name: "Açılan",  values: d.hunt.opened,    color: "var(--purple)" },
        { name: "Kapanan", values: d.hunt.closed,    color: "var(--green)" },
      ]},
      { title: "Hunt Saati", months: m, series: [
        { name: "Saat",    values: d.hunt.hours,     color: "var(--blue)" },
      ]},
    ];
    box.innerHTML = _trendCardDefs.map((def, i) => trendCard(i, def.title, def.months, def.series)).join("");
  } catch (_) {}
}

function loadDashboard() { loadMyWork(); loadKPI(); loadTrends(); loadDashboardTables(); }

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
          <button class="btn-icon danger" title="Sil"
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
  document.getElementById("tune-detail-kicker").textContent = `Kural Tuning · #${r.id}`;
  document.getElementById("tune-detail-title").textContent = r.rule_name;
  document.getElementById("tune-detail-status-badge").innerHTML = badge(r.status, TUNE_CLS);
  const finalApproval = r.tuned_at || r.approved_by || r.qa_test_ok || r.qa_peer_reviewed;
  document.getElementById("tune-detail-body").innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Genel Bilgiler</div>
      <div class="detail-grid">
        ${detailRow("Raporlayan",        displayName(r.reporter))}
        ${r.xsoar_case_id ? `<div class="detail-row">
            <span class="detail-label">${r.xsoar_case_missing === "Evet" ? "Case No (SOAR'da yok, manuel)" : "SOAR Case"}</span>
            <span class="detail-value">${r.xsoar_url
              ? `<a href="${esc(r.xsoar_url)}" target="_blank" rel="noopener">#${esc(r.xsoar_case_id)}</a>
                 <button class="btn-copy-inline" data-copy="${esc(r.xsoar_url)}" onclick="copyFromAttr(this)"
                         title="URL'i kopyala — link tıklamayla SOAR giriş ekranına atarsa, yeni sekmeye yapıştırın">&#128203; Kopyala</button>`
              : esc(r.xsoar_case_id)}</span>
          </div>` : ""}
        ${detailRow("Ortam",             r.environment)}
        ${detailRow("Durum",             r.status)}
        ${detailRow("Raporlandı",        fmt(r.created_at))}
        ${detailRow("Tamamlandı",        fmt(r.completed_at))}
      </div>
    </div>
    ${r.validated_by ? `<div class="detail-section">
      <div class="detail-section-title">Ön Onay</div>
      <div class="detail-grid">
        ${detailRow("Ön Onay Veren",   displayName(r.validated_by))}
        ${detailRow("Ön Onay Tarihi",  fmt(r.validated_at))}
        ${r.validation_note ? detailRow("Ön Onay Notu", r.validation_note) : ""}
      </div>
    </div>` : ""}
    <div class="detail-section">
      <div class="detail-section-title">Tune Detayları</div>
      <div class="detail-grid">
        ${detailRow("Tetiklenme",        r.trigger_frequency)}
        ${detailRow("Tune Nedeni",       r.tune_reason)}
        ${detailImgRow("Kanıt Görseli",  [r.evidence_image])}
        ${detailRow("Tune Eden",         r.tuning_analyst ? displayName(r.tuning_analyst) : "")}
        ${detailRow("Nasıl Tune Edildi", r.how_tuned)}
        ${detailImgRow("Çözüm Görseli",  [r.resolution_image])}
      </div>
    </div>
    ${finalApproval ? `<div class="detail-section">
      <div class="detail-section-title">Son Onay</div>
      <div class="detail-grid">
        ${r.tuned_at ? detailRow("Tune Tarihi",  fmt(r.tuned_at)) : ""}
        ${r.approved_by  ? detailRow("Onaylayan",    displayName(r.approved_by)) : ""}
        ${r.approved_at  ? detailRow("Onay Tarihi",  fmt(r.approved_at))  : ""}
        ${r.approval_note ? detailRow("Onay Notu",   r.approval_note)     : ""}
        ${r.qa_test_ok ? detailRow("Test Ortamında Sorunsuz", r.qa_test_ok) : ""}
        ${r.qa_peer_reviewed ? detailRow("Peer Review", r.qa_peer_reviewed) : ""}
      </div>
    </div>` : ""}`;
  document.getElementById("tune-detail-modal").style.display = "flex";
}
function closeTuneDetailModal() { document.getElementById("tune-detail-modal").style.display = "none"; }

function openUCDetail(id) {
  const r = ucRows.find(x => x.id === id); if (!r) return;
  const fmt = v => v ? v.slice(0,10) : "";
  document.getElementById("uc-detail-kicker").textContent = `Use-Case · #${r.id}`;
  document.getElementById("uc-detail-title").textContent = r.usecase_description.slice(0, 60) + (r.usecase_description.length > 60 ? "…" : "");
  document.getElementById("uc-detail-status-badge").innerHTML = badge(r.status, UC_CLS);
  const finalApproval = r.test_started_at || r.test_approved_by || r.qa_test_ok || r.qa_peer_reviewed;
  document.getElementById("uc-detail-body").innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">Genel Bilgiler</div>
      <div class="detail-grid">
        ${detailRow("Talep Eden",       displayName(r.requester))}
        ${detailRow("Ortam",            parseEnvStr(r.environment).join(", ") || r.environment)}
        ${detailRow("Durum",            r.status)}
        ${detailRow("Talep Tarihi",     fmt(r.created_at))}
        ${detailRow("Tamamlandı",       fmt(r.completed_at))}
      </div>
    </div>
    ${r.validated_by ? `<div class="detail-section">
      <div class="detail-section-title">Ön Onay</div>
      <div class="detail-grid">
        ${detailRow("Ön Onay Veren",   displayName(r.validated_by))}
        ${detailRow("Ön Onay Tarihi",  fmt(r.validated_at))}
        ${r.validation_note ? detailRow("Ön Onay Notu", r.validation_note) : ""}
      </div>
    </div>` : ""}
    <div class="detail-section">
      <div class="detail-section-title">Kural Detayları</div>
      <div class="detail-grid">
        ${detailRow("Use-Case",         r.usecase_description)}
        ${detailRow("Analist",          r.rule_author ? displayName(r.rule_author) : "")}
        ${detailRow("Yazılan Kural",    r.rule_name)}
        ${detailRow("Notlar",           r.notes)}
      </div>
    </div>
    ${finalApproval ? `<div class="detail-section">
      <div class="detail-section-title">Son Onay</div>
      <div class="detail-grid">
        ${r.test_started_at  ? detailRow("Test Başlama",     fmt(r.test_started_at))  : ""}
        ${r.test_approved_by ? detailRow("Prod Onaylayan",   displayName(r.test_approved_by)) : ""}
        ${r.test_approved_at ? detailRow("Prod Onay Tarihi", fmt(r.test_approved_at)) : ""}
        ${r.test_notes       ? detailRow("Test Notları",     r.test_notes)            : ""}
        ${r.qa_test_ok ? detailRow("Test Ortamında Sorunsuz", r.qa_test_ok) : ""}
        ${r.qa_peer_reviewed ? detailRow("Peer Review", r.qa_peer_reviewed) : ""}
      </div>
    </div>` : ""}`;
  document.getElementById("uc-detail-modal").style.display = "flex";
}
function closeUCDetailModal() { document.getElementById("uc-detail-modal").style.display = "none"; }

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

// Varsayılan tarih filtresi (2026-09-08): tablolar büyüdükçe kalabalık
// olmasın diye varsayılan olarak son 6 ay gösterilir; kullanıcı "Tümünü
// Göster"e basınca (veya ay/ortam/durum filtresi uygulayınca) kalkar.
let tuneShowAll = false;
let ucShowAll   = false;

function onTuneSearch(val) { tuneSearch = trLower(val); renderTuneRows(); }
function onUCSearch(val)   { ucSearch   = trLower(val); renderUCRows();  }

function toggleTuneRange() { tuneShowAll = !tuneShowAll; renderTuneRows(); }
function toggleUCRange()   { ucShowAll   = !ucShowAll;   renderUCRows();  }

// ---------------------------------------------------------------------------
// Role-aware select helpers
// lockToSelf  → analist için dropdown'u kendi adına kilitler
// freeSelect  → admin için dropdown'u serbest bırakır (mevcut değer korunur)
// ---------------------------------------------------------------------------
function lockToSelf(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = `<option value="${esc(CURRENT_USER)}" selected>${esc(displayName(CURRENT_USER))}</option>`;
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
  const cols = prefix === "tune"     ? ["id", "rule_name",          "status", "created_at"]
             : prefix === "hunt"     ? ["id", "hunt_title",          "status", "created_at"]
             : prefix === "incident" ? ["id", "title",               "status", "created_at"]
             :                         ["id", "usecase_description", "status", "created_at"];
  cols.forEach(col => {
    const th    = document.getElementById(`th-${prefix}-${col}`);
    if (!th) return;
    const arrow = th.querySelector(".sort-arrow");
    const isActive = col === activeCol;
    if (arrow) arrow.textContent = isActive ? (dir === 1 ? "↑" : "↓") : "";
    th.classList.toggle("th-sorted", isActive);
  });
}

// ---------------------------------------------------------------------------
// Tablo kolonları: göster/gizle + kolona göre filtre (Tune/UC/Hunt ortak)
// ---------------------------------------------------------------------------
const _tableColumns = {};                        // tableKey -> columns config
const _colFilters    = { tune: {}, uc: {}, hunt: {}, incident: {} };

/** columns: [{ index, key, label, filterType: 'text'|'select' }] — index,
 * <colgroup>/<thead>/<tbody><tr> içindeki 0-based sütun sırası. Son (İşlem)
 * kolon bilinçli olarak listede yok — hep görünür kalır. */
function initTableColumns(tableKey, columns) {
  _tableColumns[tableKey] = columns;
  applyColumnVisibility(tableKey);
}

function _colStorageKey(tableKey) { return `soc_cols_${tableKey}`; }

function getHiddenCols(tableKey) {
  try {
    return new Set(JSON.parse(localStorage.getItem(_colStorageKey(tableKey)) || "[]"));
  } catch { return new Set(); }
}

function applyColumnVisibility(tableKey) {
  const columns = _tableColumns[tableKey];
  const table = document.getElementById(`${tableKey}-table`);
  if (!table || !columns) return;
  const hidden = getHiddenCols(tableKey);
  const ths = table.querySelectorAll("thead tr:first-child th");
  const filterCells = document.querySelectorAll(`#${tableKey}-filter-row td`);
  columns.forEach(c => {
    const show = !hidden.has(c.key);
    if (ths[c.index])         ths[c.index].style.display = show ? "" : "none";
    if (filterCells[c.index]) filterCells[c.index].style.display = show ? "" : "none";
  });
  applyColumnVisibilityToBody(tableKey);
}

function applyColumnVisibilityToBody(tableKey) {
  const columns = _tableColumns[tableKey];
  const table = document.getElementById(`${tableKey}-table`);
  if (!table || !columns) return;
  const hidden = getHiddenCols(tableKey);
  table.querySelectorAll("tbody tr").forEach(tr => {
    columns.forEach(c => {
      const td = tr.children[c.index];
      if (td) td.style.display = hidden.has(c.key) ? "none" : "";
    });
  });
}

/** Sonuç/panel kutularını bir tetikleyici elemente göre position:fixed
 * konumlandırır — üst konteynerin overflow'una takılmaz (bkz. sidebar arama
 * kutusu, aynı yaklaşım). */
function positionFixedBox(box, anchorEl, gap = 4) {
  if (!box || !anchorEl) return;
  const rect = anchorEl.getBoundingClientRect();
  box.style.left = Math.round(rect.left) + "px";
  box.style.top  = Math.round(rect.bottom + gap) + "px";
}

function toggleColumnPanel(tableKey, btn) {
  const panel = document.getElementById(`${tableKey}-col-panel`);
  if (!panel) return;
  const opening = panel.style.display !== "block";
  document.querySelectorAll(".col-toggle-panel").forEach(p => p.style.display = "none");
  if (!opening) return;
  const columns = _tableColumns[tableKey] || [];
  const hidden = getHiddenCols(tableKey);
  panel.innerHTML = columns.map(c => `
    <label class="col-toggle-item">
      <input type="checkbox" ${hidden.has(c.key) ? "" : "checked"}
             onchange="onColumnToggle('${tableKey}','${c.key}',this.checked)"/>
      ${esc(c.label)}
    </label>`).join("");
  positionFixedBox(panel, btn);
  panel.style.display = "block";
}
document.addEventListener("click", e => {
  if (!e.target.closest(".col-toggle-wrap")) {
    document.querySelectorAll(".col-toggle-panel").forEach(p => p.style.display = "none");
  }
});

function onColumnToggle(tableKey, key, checked) {
  const hidden = getHiddenCols(tableKey);
  if (checked) hidden.delete(key); else hidden.add(key);
  localStorage.setItem(_colStorageKey(tableKey), JSON.stringify([...hidden]));
  applyColumnVisibility(tableKey);
}

/** Kolona göre filtre satırını (thead altındaki ikinci <tr>) yeniden kurar —
 * her veri yüklemesinde (loadTune/loadUC/loadHunt) çağrılır ki select
 * tipindeki kolonların seçenekleri o anki veriden türesin. Filtrenin kendisi
 * (_colFilters) veri yeniden yüklenene kadar korunur. */
function buildColumnFilterRow(tableKey, rows) {
  const columns = _tableColumns[tableKey];
  const row = document.getElementById(`${tableKey}-filter-row`);
  if (!row || !columns) return;
  const current = _colFilters[tableKey];
  row.innerHTML = columns.map(c => {
    if (c.filterType === "select") {
      // Virgülle ayrılmış çoklu değerli hücreler (örn. "DEV,PROD") tek bir
      // seçenek olarak değil, her değer ayrı seçenek olarak listelenir —
      // aksi halde sadece bir kombinasyonda geçen bir değer (örn. sadece
      // "Server,Workstation" içindeki "Workstation") hiç seçilemez olurdu
      // (2026-09-08).
      const values = [...new Set(rows.flatMap(r => String(r[c.key] || "").split(/,\s*/)).filter(Boolean))]
        .sort((a,b) => String(a).localeCompare(String(b), "tr"));
      const sel = current[c.key] || "";
      return `<td><select class="col-filter-input" onchange="onColumnFilterInput('${tableKey}','${c.key}',this.value)">
        <option value="">Tümü</option>
        ${values.map(v => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(v)}</option>`).join("")}
      </select></td>`;
    }
    return `<td><input type="text" class="col-filter-input" placeholder="Filtrele…"
      value="${esc(current[c.key] || "")}"
      oninput="onColumnFilterInput('${tableKey}','${c.key}',this.value)"/></td>`;
  }).join("") + `<td></td>`;
  applyColumnVisibility(tableKey);
}

function onColumnFilterInput(tableKey, key, value) {
  _colFilters[tableKey][key] = trLower(value.trim());
  if (tableKey === "tune")     renderTuneRows();
  if (tableKey === "uc")       renderUCRows();
  if (tableKey === "hunt")     renderHuntRows();
  if (tableKey === "incident") renderIncidentRows();
}

function matchesColumnFilters(tableKey, row) {
  const columns = _tableColumns[tableKey] || [];
  const filters = _colFilters[tableKey];
  return columns.every(c => {
    const val = filters[c.key];
    if (!val) return true;
    const cell = row[c.key];
    if (cell == null) return false;
    if (c.filterType === "select") {
      // Tam/üye eşleşmesi — "PROD" seçince "PROD-DR" sızmasın, çoklu
      // değerli hücrelerde (virgülle ayrılmış) sıra farketmesin (2026-09-08).
      return trLower(String(cell)).split(/,\s*/).includes(val);
    }
    if (trLower(String(cell)).includes(val)) return true;
    return trLower(displayName(cell)).includes(val);
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

const TUNE_COLUMNS = [
  { index: 0,  key: "id",              label: "#",           filterType: "text" },
  { index: 1,  key: "rule_name",       label: "Kural İsmi",   filterType: "text" },
  { index: 2,  key: "xsoar_case_id",   label: "Case No",      filterType: "text" },
  { index: 3,  key: "environment",     label: "Ortam",        filterType: "select" },
  { index: 4,  key: "reporter",        label: "Raporlayan",   filterType: "text" },
  { index: 5,  key: "tune_reason",     label: "Tune Nedeni",  filterType: "text" },
  { index: 6,  key: "trigger_frequency", label: "Sıklık",     filterType: "select" },
  { index: 7,  key: "tuning_analyst",  label: "Tune Eden",    filterType: "text" },
  { index: 8,  key: "status",          label: "Durum",        filterType: "select" },
  { index: 9,  key: "created_at",      label: "Raporlandı",   filterType: "text" },
  { index: 10, key: "completed_at",    label: "Tamamlandı",   filterType: "text" },
];

function setPageSubtitle(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderTuneRows() {
  setPageSubtitle("tune-subtitle",
    `${tuneRows.length} talep · ${tuneRows.filter(r => r.status === "Açık").length} açık · `
    + `${tuneRows.filter(r => r.status === "Ön Onay Bekliyor").length} ön onay bekliyor`);
  const TUNE_FIELDS = ["rule_name","tune_reason","reporter","environment","tuning_analyst","how_tuned","xsoar_case_id"];
  const tuneOtherFilterActive = !!tuneSearch || Object.values(_colFilters.tune).some(Boolean);
  const visible = tuneRows
    .filter(r => !tuneSearch || TUNE_FIELDS.some(f => fieldMatchesTerm(r, f, tuneSearch)))
    .filter(r => matchesColumnFilters("tune", r))
    .filter(r => tuneShowAll || tuneOtherFilterActive || withinLastMonths(r.created_at, 6));
  updateRangeToggleUI("tune", tuneShowAll);
  const sorted = clientSort(visible, tuneSortCol, tuneSortDir);
  updateSortUI("tune", tuneSortCol, tuneSortDir);
  const tbody = document.getElementById("tune-tbody");
  const empty = document.getElementById("tune-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.rule_name)}">
      <span class="cell-link" onclick="openTuneDetail(${r.id})" style="cursor:pointer">${esc(r.rule_name)}</span>
    </td>
    <td class="td-truncate" style="font-size:11px" title="${esc(r.xsoar_case_id || '')}${r.xsoar_case_missing==='Evet' ? ' — case bulunamadı' : ''}">${r.xsoar_case_id ? esc(r.xsoar_case_id) : '<span class="text-muted">—</span>'}</td>
    <td class="td-truncate" title="${esc(r.environment)}">${esc(r.environment)}</td>
    <td class="td-truncate" title="${esc(r.reporter)}">${esc(displayName(r.reporter))}</td>
    <td class="td-truncate" title="${esc(r.tune_reason)}">${esc(r.tune_reason)}</td>
    <td>${freqBadge(r.trigger_frequency)}</td>
    <td class="td-truncate" title="${esc(r.tuning_analyst||'')}">${r.tuning_analyst ? esc(displayName(r.tuning_analyst)) : '<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, TUNE_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td class="text-muted">${fmtDate(r.completed_at)}</td>
    <td style="white-space:nowrap">${tuneActionBtns(r)}</td>
  </tr>`).join("");
  applyColumnVisibilityToBody("tune");
}

async function loadTune() {
  const p = new URLSearchParams();
  const month  = document.getElementById("tune-filter-month").value;
  const env    = document.getElementById("tune-filter-env").value;
  const status = document.getElementById("tune-filter-status").value;
  if (month)  p.set("month", month);
  if (env)    p.set("environment", env);
  if (status) p.set("status", status);
  if (month || env || status) tuneShowAll = true;
  try {
    tuneRows = await apiFetch(`/api/tune?${p}`);
    buildColumnFilterRow("tune", tuneRows);
    renderTuneRows();
  } catch (e) { console.error(e); }
}

function clearTuneFilters() {
  ["tune-filter-month","tune-filter-env","tune-filter-status"].forEach(id => { document.getElementById(id).value = ""; });
  const s = document.getElementById("tune-search"); if (s) s.value = "";
  tuneSearch = "";
  tuneShowAll = false;
  _colFilters.tune = {};
  loadTune();
}

// ---------------------------------------------------------------------------
// SOAR case ID — "case bulunamadı" kutucuğu işaretlenince case ID alanı
// gerçek bir SOAR referansı yerine elle girilen bir case no'ya dönüşür,
// case linki alanı ise anlamsız hale geldiği için kilitlenir.
// ---------------------------------------------------------------------------
function toggleXsoarMissing(prefix) {
  const missing  = document.getElementById(`${prefix}-xsoar-missing`).checked;
  const idInput  = document.getElementById(`${prefix}-xsoar-case-id`);
  const idLabel  = document.getElementById(`${prefix}-xsoar-case-id-label`);
  const urlGroup = document.getElementById(`${prefix}-xsoar-url-group`);
  const urlInput = document.getElementById(`${prefix}-xsoar-url`);
  if (missing) {
    idLabel.textContent = "Case No (manuel) *";
    idInput.placeholder = "SOAR'da yok — elle takip için bir numara girin";
    urlInput.value = "";
    urlInput.disabled = true;
    urlGroup.style.opacity = "0.5";
  } else {
    idLabel.textContent = "SOAR Case ID *";
    idInput.placeholder = "örn. INC-12345";
    urlInput.disabled = false;
    urlGroup.style.opacity = "1";
  }
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
  document.getElementById("tune-xsoar-case-id").value = "";
  document.getElementById("tune-xsoar-url").value     = "";
  document.getElementById("tune-xsoar-missing").checked = false;
  toggleXsoarMissing("tune");
  // Raporlayan: analist sadece kendisi, admin seçebilir
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    lockToSelf("tune-reporter");
  } else {
    freeSelect("tune-reporter", "");
  }
  clearPastePreview("tune-evidence-preview","tune-evidence-image");
  document.getElementById("tune-modal-error").style.display = "none";
  document.getElementById("tune-modal").style.display = "flex";
  autoGrowAll(document.getElementById("tune-modal"));
}
function closeTuneModal() { document.getElementById("tune-modal").style.display = "none"; }

async function saveTune() {
  const errEl = document.getElementById("tune-modal-error");
  errEl.style.display = "none";
  const caseId = document.getElementById("tune-xsoar-case-id").value.trim();
  if (!caseId) {
    errEl.textContent = "SOAR Case ID zorunludur (case bulunamıyorsa kutucuğu işaretleyip bir case no girin).";
    errEl.style.display = "block";
    return;
  }
  const payload = {
    reporter:          document.getElementById("tune-reporter").value,
    environment:       document.getElementById("tune-env").value,
    rule_name:         document.getElementById("tune-rule-name").value.trim(),
    tune_reason:       document.getElementById("tune-reason").value.trim(),
    trigger_frequency: document.getElementById("tune-freq").value,
    status:            "Açık",
    evidence_image:    document.getElementById("tune-evidence-image").value || null,
    xsoar_case_id:     caseId,
    xsoar_url:         document.getElementById("tune-xsoar-url").value.trim() || null,
    xsoar_case_missing: document.getElementById("tune-xsoar-missing").checked,
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
  document.getElementById("edit-tune-xsoar-case-id").value = r.xsoar_case_id || "";
  document.getElementById("edit-tune-xsoar-url").value     = r.xsoar_url || "";
  document.getElementById("edit-tune-xsoar-missing").checked = r.xsoar_case_missing === "Evet";
  toggleXsoarMissing("edit-tune");
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
      sel.innerHTML = `<option value="${esc(r.tuning_analyst||"")}">${esc(displayName(r.tuning_analyst)||"—")}</option>`;
      sel.disabled  = true;
    }
    // Rapor alanları (raporlayan doldurur): yalnızca raporlayan düzenleyebilir
    ["edit-tune-env","edit-tune-rule-name","edit-tune-reason","edit-tune-freq",
     "edit-tune-xsoar-case-id","edit-tune-xsoar-missing"].forEach(id => {
      document.getElementById(id).disabled = !isReporter;
    });
    document.getElementById("edit-tune-xsoar-url").disabled = !isReporter || r.xsoar_case_missing === "Evet";
    // Çalışma alanları (analist doldurur): yalnızca atanmış analist düzenleyebilir
    document.getElementById("edit-tune-how").disabled    = !isAssigned;
    document.getElementById("edit-tune-status").disabled = !isAssigned;
  } else {
    // Admin: tüm alanlar serbest (case linki, "case yok" kutucuğunun
    // durumuna göre toggleXsoarMissing() tarafından zaten yönetiliyor)
    ["edit-tune-env","edit-tune-rule-name","edit-tune-reason","edit-tune-freq",
     "edit-tune-how","edit-tune-status","edit-tune-xsoar-case-id",
     "edit-tune-xsoar-missing"].forEach(id => {
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
  autoGrowAll(document.getElementById("tune-edit-modal"));
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
    xsoar_case_id:      document.getElementById("edit-tune-xsoar-case-id").value.trim() || null,
    xsoar_url:          document.getElementById("edit-tune-xsoar-url").value.trim() || null,
    xsoar_case_missing: document.getElementById("edit-tune-xsoar-missing").checked,
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
    sel.innerHTML  = `<option value="${esc(CURRENT_USER)}" selected>${esc(displayName(CURRENT_USER))}</option>`;
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
  autoGrowAll(document.getElementById("tune-close-modal"));
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
  autoGrowAll(document.getElementById("tune-approve-modal"));
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
  const rows = type === "tune" ? tuneRows : (type === "usecase" ? ucRows : (type === "incident" ? incidentRows : huntRows));
  const r = rows.find(x => x.id === id); if (!r) return;
  const label = type === "tune" ? r.rule_name : (type === "usecase" ? (r.usecase_description || "").slice(0, 80) : (type === "incident" ? r.title : (r.hunt_title || r.hunt_subject)));
  document.getElementById("validate-type").value = type;
  document.getElementById("validate-id").value   = id;
  document.getElementById("validate-desc").textContent = type === "incident"
    ? `"${label}" olay raporunu onaylıyor musunuz? Onaylarsanız rapor "Kapandı" olur. Reddederseniz gerekçenizle birlikte "İncelemede"ye geri döner.`
    : `"${label}" talebinin geçerliliğini onaylıyor musunuz? Reddederseniz talep "Reddedildi" olarak kapanır.`;
  document.getElementById("validate-note").value = "";
  document.getElementById("validate-error").style.display = "none";
  document.getElementById("validate-modal").style.display = "flex";
  autoGrowAll(document.getElementById("validate-modal"));
}

// Olay raporlarının API yolu diğer üçünden farklı (/api/incident-reports,
// çoğul-tireli) — tune/usecase/hunt ise doğrudan type adını kullanıyor.
function _validatePathBase(type) {
  return type === "incident" ? "incident-reports" : type;
}

async function execValidate() {
  const type  = document.getElementById("validate-type").value;
  const id    = document.getElementById("validate-id").value;
  const note  = document.getElementById("validate-note").value.trim();
  const errEl = document.getElementById("validate-error");
  errEl.style.display = "none";
  try {
    await apiFetch(`/api/${_validatePathBase(type)}/${id}/validate`, { method: "POST", body: JSON.stringify({ validation_note: note }) });
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
    await apiFetch(`/api/${_validatePathBase(type)}/${id}/reject-validation`, { method: "POST", body: JSON.stringify({ validation_note: note }) });
    document.getElementById("validate-modal").style.display = "none";
    reloadAfterValidate(type);
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

function reloadAfterValidate(type) {
  if (type === "tune") { loadTune(); }
  else if (type === "usecase") { loadUC(); }
  else if (type === "incident") { loadIncidents(); }
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
    `"${r.hunt_title || r.hunt_subject}" hunt'ının sonucunu/raporunu onaylıyor musunuz? Revizyona gönderirseniz İnceleniyor'a döner.`;
  document.getElementById("hunt-result-note").value = "";
  document.getElementById("hunt-result-error").style.display = "none";
  document.getElementById("hunt-result-modal").style.display = "flex";
  autoGrowAll(document.getElementById("hunt-result-modal"));
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

const UC_COLUMNS = [
  { index: 0,  key: "id",                   label: "#",             filterType: "text" },
  { index: 1,  key: "usecase_description",  label: "Use-Case",      filterType: "text" },
  { index: 2,  key: "environment",          label: "Ortam",         filterType: "select" },
  { index: 3,  key: "requester",            label: "Talep Eden",    filterType: "text" },
  { index: 4,  key: "rule_name",            label: "Yazılan Kural", filterType: "text" },
  { index: 5,  key: "rule_author",          label: "Analist",       filterType: "text" },
  { index: 6,  key: "status",               label: "Durum",         filterType: "select" },
  { index: 7,  key: "created_at",           label: "Talep Tarihi",  filterType: "text" },
  { index: 8,  key: "completed_at",         label: "Yazılma Tarihi",filterType: "text" },
];

function renderUCRows() {
  setPageSubtitle("uc-subtitle",
    `${ucRows.length} talep · ${ucRows.filter(r => r.status === "Açık").length} açık · `
    + `${ucRows.filter(r => r.status === "Prod'da Aktif").length} prod'da aktif`);
  const UC_FIELDS = ["usecase_description","requester","environment","rule_name","rule_author","notes"];
  const ucOtherFilterActive = !!ucSearch || Object.values(_colFilters.uc).some(Boolean);
  const visible = ucRows
    .filter(r => !ucSearch || UC_FIELDS.some(f => fieldMatchesTerm(r, f, ucSearch)))
    .filter(r => matchesColumnFilters("uc", r))
    .filter(r => ucShowAll || ucOtherFilterActive || withinLastMonths(r.created_at, 6));
  updateRangeToggleUI("uc", ucShowAll);
  const sorted = clientSort(visible, ucSortCol, ucSortDir);
  updateSortUI("uc", ucSortCol, ucSortDir);
  const tbody = document.getElementById("uc-tbody");
  const empty = document.getElementById("uc-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.usecase_description)}">
      <span class="cell-link" onclick="openUCDetail(${r.id})" style="cursor:pointer">${esc(r.usecase_description)}</span>
      ${r.source_hunt_id ? `<span class="badge" style="font-size:10px;padding:1px 5px;margin-left:4px;background:rgba(94,106,210,.15);color:var(--blue)">Hunt #${r.source_hunt_id}</span>` : ""}
    </td>
    <td class="td-truncate" title="${esc(parseEnvStr(r.environment).join(', ') || r.environment)}">${esc(parseEnvStr(r.environment).join(", ") || r.environment)}</td>
    <td class="td-truncate" title="${esc(r.requester)}">${esc(displayName(r.requester))}</td>
    <td class="td-truncate" title="${esc(r.rule_name||'')}">${esc(r.rule_name)||'<span class="text-muted">—</span>'}</td>
    <td class="td-truncate" title="${esc(r.rule_author||'')}">${r.rule_author ? esc(displayName(r.rule_author)) : '<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, UC_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td class="text-muted">${fmtDate(r.completed_at)}</td>
    <td style="white-space:nowrap">${ucActionBtns(r)}</td>
  </tr>`).join("");
  applyColumnVisibilityToBody("uc");
}

async function loadUC() {
  const p = new URLSearchParams();
  const month  = document.getElementById("uc-filter-month").value;
  const env    = document.getElementById("uc-filter-env").value;
  const status = document.getElementById("uc-filter-status").value;
  if (month)  p.set("month", month);
  if (env)    p.set("environment", env);
  if (status) p.set("status", status);
  if (month || env || status) ucShowAll = true;
  try {
    ucRows = await apiFetch(`/api/usecase?${p}`);
    buildColumnFilterRow("uc", ucRows);
    renderUCRows();
  } catch (e) { console.error(e); }
}

function clearUCFilters() {
  ["uc-filter-month","uc-filter-env","uc-filter-status"].forEach(id => { document.getElementById(id).value = ""; });
  const s = document.getElementById("uc-search"); if (s) s.value = "";
  ucSearch = "";
  ucShowAll = false;
  _colFilters.uc = {};
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
  autoGrowAll(document.getElementById("uc-modal"));
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
      sel.innerHTML = `<option value="${esc(r.rule_author||"")}">${esc(displayName(r.rule_author)||"—")}</option>`;
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
  autoGrowAll(document.getElementById("uc-edit-modal"));
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
    sel.innerHTML = `<option value="${esc(CURRENT_USER)}" selected>${esc(displayName(CURRENT_USER))}</option>`;
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
  autoGrowAll(document.getElementById("uc-close-modal"));
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
  autoGrowAll(document.getElementById("uc-test-approve-modal"));
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
  "CREATE_TUNE_XSOAR": "Tuning oluşturuldu (XSOAR)",
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
  "EDIT_SETTING":       "Sistem ayarı değiştirildi",
  "EXPORT_AUDIT_LOG":   "Audit log Excel olarak indirildi",
  "VALIDATE_TUNE":          "Tune talebi onaylandı (ön onay)",
  "REJECT_VALIDATION_TUNE": "Tune talebi reddedildi (ön onay)",
  "VALIDATE_UC":            "UC talebi onaylandı (ön onay)",
  "REJECT_VALIDATION_UC":   "UC talebi reddedildi (ön onay)",
  "VALIDATE_HUNT":          "Hunt talebi onaylandı (ön onay)",
  "REJECT_VALIDATION_HUNT": "Hunt talebi reddedildi (ön onay)",
  "APPROVE_HUNT_RESULT":    "Hunt sonucu onaylandı",
  "REJECT_HUNT_RESULT":     "Hunt sonucu revizyona gönderildi",
  "EXPORT_HUNT_PDF":        "Hunt raporu PDF olarak indirildi",
  "EXPORT_MONTHLY_REPORT":  "Aylık rapor görüntülendi",
  "CREATE_INCIDENT_XSOAR":  "Olay raporu oluşturuldu (XSOAR)",
  "CREATE_INCIDENT":        "Olay raporu oluşturuldu",
  "ADD_INCIDENT_IMAGE_XSOAR": "Olay raporuna görsel eklendi (XSOAR)",
  "EXPORT_INCIDENT_PDF":    "Olay raporu PDF olarak indirildi",
  "EDIT_INCIDENT":          "Olay raporu düzenlendi",
  "APPROVE_INCIDENT":       "Olay raporu onaylandı",
  "REJECT_INCIDENT":        "Olay raporu reddedildi",
  "DELETE_INCIDENT":        "Olay raporu silindi",
  "START_INCIDENT_REVIEW":         "Olay raporu incelemeye alındı",
  "SUBMIT_INCIDENT_FOR_APPROVAL":  "Olay raporu onaya gönderildi",
  "CLOSE_INCIDENT":                "Olay raporu kapatıldı",
  "RETURN_INCIDENT_FOR_REVISION":  "Olay raporu revizyona gönderildi",
};
const ACTION_CLS = {
  "LOGIN": "audit-login",
  "CREATE_TUNE": "audit-create", "CREATE_UC": "audit-create", "CREATE_USER": "audit-create", "CREATE_HUNT": "audit-create",
  "CREATE_TUNE_XSOAR": "audit-create",
  "CLAIM_TUNE":  "audit-claim",  "CLAIM_UC":  "audit-claim",  "CLAIM_HUNT":  "audit-claim",
  "CLOSE_TUNE":  "audit-close",  "CLOSE_UC":  "audit-close",  "CLOSE_HUNT":  "audit-close",
  "EDIT_TUNE":   "audit-edit",   "EDIT_UC":   "audit-edit",   "EDIT_HUNT":   "audit-edit",   "EDIT_USER":   "audit-edit",  "REPORT_HUNT": "audit-edit",
  "DELETE_TUNE": "audit-delete", "DELETE_UC": "audit-delete", "DELETE_USER": "audit-delete", "DELETE_HUNT": "audit-delete",
  "VERIFY_AUDIT_CHAIN": "audit-edit",
  "EDIT_SETTING": "audit-edit",
  "EXPORT_AUDIT_LOG": "audit-edit",
  "VALIDATE_TUNE": "audit-claim", "VALIDATE_UC": "audit-claim", "VALIDATE_HUNT": "audit-claim",
  "REJECT_VALIDATION_TUNE": "audit-delete", "REJECT_VALIDATION_UC": "audit-delete", "REJECT_VALIDATION_HUNT": "audit-delete",
  "APPROVE_HUNT_RESULT": "audit-close", "REJECT_HUNT_RESULT": "audit-delete",
  "EXPORT_HUNT_PDF": "audit-edit",
  "EXPORT_MONTHLY_REPORT": "audit-edit",
  "CREATE_INCIDENT_XSOAR": "audit-create",
  "CREATE_INCIDENT": "audit-create",
  "ADD_INCIDENT_IMAGE_XSOAR": "audit-edit",
  "EXPORT_INCIDENT_PDF": "audit-edit",
  "EDIT_INCIDENT": "audit-edit",
  "APPROVE_INCIDENT": "audit-close",
  "REJECT_INCIDENT": "audit-delete",
  "DELETE_INCIDENT": "audit-delete",
  "START_INCIDENT_REVIEW": "audit-claim",
  "SUBMIT_INCIDENT_FOR_APPROVAL": "audit-edit",
  "CLOSE_INCIDENT": "audit-close",
  "RETURN_INCIDENT_FOR_REVISION": "audit-delete",
};
// Audit Log filtre kategorileri — hangi action'ın hangi kategoriye girdiği
// app.py'deki AUDIT_CATEGORIES ile eşleşmeli (bkz. docs/audit_logging.md).
const AUDIT_CATEGORY_LABELS = {
  "create":         "Oluşturma",
  "claim":          "Üstlenme / Başlatma",
  "pre_approval":   "Ön Onay",
  "final_approval": "Son Onay",
  "work_done":      "İş Tamamlama",
  "edit":           "Düzenleme",
  "delete":         "Silme",
  "system":         "Sistem / Dışa Aktarım",
};

async function verifyAuditChain() {
  const box = document.getElementById("audit-verify-result");
  box.style.display = "block";
  box.innerHTML = `<div class="empty-state">Zincir doğrulanıyor…</div>`;
  try {
    const r = await apiFetch("/api/audit/verify", { method: "POST" });
    if (r.valid) {
      box.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:var(--green-subtle);border:1px solid rgba(45,178,125,.35);color:var(--green);font-size:13px">
        ✅ Zincir geçerli — ${r.chained}/${r.total} kayıt zincirli, hiçbiri değiştirilmemiş/silinmemiş.
      </div>`;
    } else {
      box.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:var(--red-subtle);border:1px solid rgba(229,72,77,.35);color:var(--red);font-size:13px">
        ⚠️ Zincirde ${r.problems.length} sorun bulundu (${r.chained}/${r.total} kayıt zincirli):<br>
        ${r.problems.map(p => esc(p)).join("<br>")}
      </div>`;
    }
    loadAuditLog();
  } catch (e) {
    box.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:var(--red-subtle);border:1px solid rgba(229,72,77,.35);color:var(--red);font-size:13px">Doğrulama başarısız: ${esc(e.message || String(e))}</div>`;
  }
}

function populateAuditCategoryDropdown() {
  const sel = document.getElementById("audit-filter-category");
  if (!sel || sel.dataset.populated) return;
  sel.insertAdjacentHTML("beforeend", Object.entries(AUDIT_CATEGORY_LABELS)
    .map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join(""));
  sel.dataset.populated = "1";
}

/** Kullanıcı dropdown'u, o an ekranda GÖRÜNEN kayıtlardaki kullanıcı adlarından
 * türetilir — filtre uygulanmamışken bu tam listeyi verir, filtre
 * uygulandıktan sonra dropdown'daki seçenekler daralmaz (mevcut liste korunur). */
function populateAuditUsernameDropdown(rows) {
  const sel = document.getElementById("audit-filter-username");
  if (!sel || sel.dataset.populated) return;
  const names = [...new Set(rows.map(r => r.username).filter(Boolean))].sort();
  sel.insertAdjacentHTML("beforeend",
    names.map(n => {
      // "?" = write_audit()'in oturumsuz istekler (ör. XSOAR webhook) için
      // düştüğü varsayılan kullanıcı adı — dropdown'da anlaşılır göster.
      const label = n === "?" ? "Sistem (oturumsuz — ör. XSOAR webhook)" : displayName(n);
      return `<option value="${esc(n)}">${esc(label)}</option>`;
    }).join(""));
  sel.dataset.populated = "1";
}

function clearAuditFilters() {
  document.getElementById("audit-filter-category").value = "";
  document.getElementById("audit-filter-username").value = "";
  loadAuditLog();
}

async function loadAuditLog() {
  populateAuditCategoryDropdown();
  try {
    const category = document.getElementById("audit-filter-category")?.value || "";
    const username = document.getElementById("audit-filter-username")?.value || "";
    const p = new URLSearchParams({ limit: "1000" });
    if (category) p.set("category", category);
    if (username) p.set("username", username);
    const { rows, total } = await apiFetch(`/api/audit?${p}`);
    if (!category && !username) populateAuditUsernameDropdown(rows);
    const note = document.getElementById("audit-truncated-note");
    if (note) {
      if (total > rows.length) {
        note.textContent = `Son ${rows.length.toLocaleString("tr-TR")} kayıt gösteriliyor (toplam: ${total.toLocaleString("tr-TR")}) — tam liste için Excel indirin.`;
        note.style.display = "block";
      } else {
        note.style.display = "none";
      }
    }
    const tbody = document.getElementById("audit-tbody");
    const empty = document.getElementById("audit-empty");
    if (!rows.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";
    tbody.innerHTML = rows.map(r => {
      const cls  = ACTION_CLS[r.action] || "";
      const label = ACTION_TR[r.action]  || esc(r.action);
      const time  = r.created_at ? r.created_at.slice(0, 16).replace("T", " ") : "—";
      return `<tr>
        <td class="text-muted" style="font-size:12px;white-space:nowrap">${time}</td>
        <td style="font-weight:500" title="${esc(r.username)}">${esc(displayName(r.username))}</td>
        <td><span class="audit-badge ${cls}">${label}</span></td>
        <td class="text-muted" style="font-size:12px">${esc(r.record_type || "")}</td>
        <td class="text-muted" style="font-size:12px">${r.record_id ? "#"+r.record_id : ""}</td>
        <td class="text-muted" style="font-size:12px">${esc(r.detail || "")}</td>
        <td class="text-muted mono td-truncate" style="font-size:11px" title="${esc(r.record_hash || "")}">${r.record_hash ? esc(r.record_hash.slice(0,16)) + "…" : "—"}</td>
      </tr>`;
    }).join("");
  } catch (e) { console.error(e); }
}

function exportAuditLog() {
  const category = document.getElementById("audit-filter-category")?.value || "";
  const username = document.getElementById("audit-filter-username")?.value || "";
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (username) p.set("username", username);
  const qs = p.toString();
  window.location.href = `/api/audit/export${qs ? "?" + qs : ""}`;
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
  loadUserStats();
  loadXsoarUrlTemplate();
}

function switchSettingsSubtab(name) {
  document.querySelectorAll(".settings-subtab-btn").forEach(b => b.classList.toggle("active", b.dataset.subtab === name));
  document.querySelectorAll(".settings-subpanel").forEach(p => p.classList.toggle("active", p.id === `settings-subtab-${name}`));
}

async function loadXsoarUrlTemplate() {
  const input = document.getElementById("xsoar-url-template-input");
  if (!input) return;
  try {
    const r = await apiFetch("/api/settings/xsoar-url-template");
    input.value = r.value || "";
  } catch (e) { console.error(e); }
}

async function saveXsoarUrlTemplate() {
  const input = document.getElementById("xsoar-url-template-input");
  const msg   = document.getElementById("xsoar-url-template-msg");
  const value = input.value.trim();
  msg.style.display = "none";
  try {
    await apiFetch("/api/settings/xsoar-url-template", { method: "PUT", body: JSON.stringify({ value }) });
    msg.textContent = "Kaydedildi.";
    msg.style.color = "var(--green)";
    msg.style.display = "block";
  } catch (e) {
    msg.textContent = e.message;
    msg.style.color = "var(--red)";
    msg.style.display = "block";
  }
}

async function loadUserStats() {
  const tbody = document.getElementById("user-stats-tbody");
  if (!tbody) return;
  try {
    const stats = await apiFetch("/api/stats/users");
    tbody.innerHTML = stats.length
      ? stats.map(s => `<tr>
          <td>${esc(s.full_name)}${s.full_name !== s.username ? ` <span class="text-muted" style="font-size:11px">(${esc(s.username)})</span>` : ""}</td>
          <td>${s.tune_reported}</td><td>${s.tune_completed}</td><td>${s.tune_validated}</td><td>${s.tune_approved}</td>
          <td>${s.uc_reported}</td><td>${s.uc_completed}</td><td>${s.uc_validated}</td><td>${s.uc_approved}</td>
        </tr>`).join("")
      : `<tr><td colspan="9" class="text-muted" style="padding:16px;text-align:center">Henüz kullanıcı yok.</td></tr>`;
  } catch (e) { console.error(e); }
}

const ROLE_LABEL = { admin: "Admin", analyst: "Analist" };
const TIER_CLS   = { "Analist": "tier-analist", "Kıdemli Analist": "tier-kidemli", "Müdür": "tier-mudur" };

function fmtLastLogin(iso) {
  if (!iso) return "Hiç giriş yapmadı";
  return iso.slice(0, 16).replace("T", " ");
}

async function loadUsersList() {
  const list = document.getElementById("user-settings-list");
  if (!list) return;
  try {
    const users = await apiFetch("/api/users");
    list.innerHTML = users.length
      ? users.map(u => {
          const isSelf   = u.username === CURRENT_USER;
          const active   = (u.active || "Evet") !== "Hayır";
          const rowStyle = active ? "" : "opacity:0.55";
          const nameLine = u.full_name
            ? `${esc(u.full_name)} <span class="text-muted" style="font-size:11px">(${esc(u.username)})</span>`
            : esc(u.username);
          return `<li style="${rowStyle}">
          <span>
            ${nameLine}${isSelf ? ' <span class="text-muted" style="font-size:11px">(siz)</span>' : ""}
            <span class="user-role-badge role-${u.role}">${ROLE_LABEL[u.role] || u.role}</span>
            <span class="user-role-badge ${TIER_CLS[u.tier] || ""}">${esc(u.tier || "Analist")}</span>
            ${active ? "" : '<span class="user-role-badge" style="background:var(--red-subtle);color:var(--red)">Devre Dışı</span>'}
            <br><span class="text-muted" style="font-size:11px">Son giriş: ${fmtLastLogin(u.last_login)}</span>
          </span>
          <span style="display:flex;gap:4px">
            <button class="btn-icon" title="Düzenle"
              onclick="openEditUserModal(${u.id},'${esc(u.username)}','${u.role}','${esc(u.tier || "Analist")}','${esc(u.full_name || "")}')">&#9998;</button>
            <button class="btn-icon" title="${isSelf ? 'Kendi hesabınızı devre dışı bırakamazsınız' : (active ? 'Devre Dışı Bırak' : 'Yeniden Aktifleştir')}"
              ${isSelf ? "disabled" : ""}
              onclick="toggleUserActive(${u.id},'${esc(u.username)}','${active ? "Evet" : "Hayır"}')">${active ? "&#9208;" : "&#9654;"}</button>
            <button class="btn-icon danger" title="${isSelf ? 'Kendi hesabınızı silemezsiniz' : 'Sil'}" ${isSelf ? "disabled" : ""}
              onclick="deleteUser(${u.id},'${esc(u.username)}')">&#x1F5D1;</button>
          </span>
        </li>`;
        }).join("")
      : `<li class="text-muted" style="justify-content:center">Henüz kullanıcı eklenmedi.</li>`;
  } catch (e) { console.error(e); }
}

async function toggleUserActive(id, username, currentActive) {
  const next = currentActive === "Hayır" ? "Evet" : "Hayır";
  const verb = next === "Hayır" ? "devre dışı bırakmak" : "yeniden aktifleştirmek";
  if (!confirm(`"${username}" kullanıcısını ${verb} istediğinize emin misiniz?`)) return;
  try {
    await apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify({ active: next }) });
    loadUsersList();
  } catch (e) { alert(e.message); }
}

async function addUser() {
  const username = document.getElementById("new-user-username").value.trim();
  const fullName = document.getElementById("new-user-fullname").value.trim();
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
    await apiFetch("/api/users", { method: "POST", body: JSON.stringify({ username, full_name: fullName, password, role, tier }) });
    document.getElementById("new-user-username").value = "";
    document.getElementById("new-user-fullname").value = "";
    document.getElementById("new-user-password").value = "";
    loadUsersList();
    loadDropdownData();
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
function openEditUserModal(id, username, role, tier, fullName) {
  const isSelf = username === CURRENT_USER;
  document.getElementById("edit-user-id").value           = id;
  document.getElementById("edit-user-modal-title").textContent = `Kullanıcı Düzenle — ${username}`;
  document.getElementById("edit-user-name-display").value = username;
  document.getElementById("edit-user-fullname").value     = fullName || "";
  document.getElementById("edit-user-role").value         = role;
  document.getElementById("edit-user-role").disabled       = isSelf;
  document.getElementById("edit-user-tier").value         = tier || "Analist";
  document.getElementById("edit-user-password").value     = "";
  document.getElementById("edit-user-password2").value    = "";
  document.getElementById("edit-user-self-note").style.display = isSelf ? "block" : "none";
  document.getElementById("edit-user-error").style.display = "none";
  document.getElementById("edit-user-modal").style.display = "flex";
}
function closeEditUserModal() {
  document.getElementById("edit-user-modal").style.display = "none";
}

async function saveEditUser() {
  const id       = document.getElementById("edit-user-id").value;
  const role     = document.getElementById("edit-user-role").value;
  const tier     = document.getElementById("edit-user-tier").value;
  const fullName = document.getElementById("edit-user-fullname").value.trim();
  const pw1      = document.getElementById("edit-user-password").value;
  const pw2      = document.getElementById("edit-user-password2").value;
  const errEl    = document.getElementById("edit-user-error");
  errEl.style.display = "none";

  if (pw1 && pw1 !== pw2) {
    errEl.textContent = "Şifreler eşleşmiyor.";
    errEl.style.display = "block"; return;
  }
  if (pw1 && pw1.length < 6) {
    errEl.textContent = "Şifre en az 6 karakter olmalıdır.";
    errEl.style.display = "block"; return;
  }

  const payload = { role, tier, full_name: fullName };
  if (pw1) payload.password = pw1;

  try {
    await apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeEditUserModal();
    loadUsersList();
    loadDropdownData(); // Ad Soyad değişmiş olabilir — displayName() eşlemesini tazele
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
 "hunt-modal","hunt-edit-modal","hunt-claim-modal"].forEach(id => {
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
  setupPaste("report-hunt-detection-detail", "report-hunt-detection-detail-preview", "report-hunt-detection-detail-image");
  setupPaste("report-hunt-recommendations-paste", "report-hunt-recommendations-preview", "report-hunt-recommendations-image");
}

// Attach paste listener to a textarea; captured image goes to previewAreaId / hiddenId.
// _pasteReady guard prevents double-binding when setupAllPaste() reruns (e.g. hunt
// report modal reopened) — without it, listeners stack and re-upload on every paste.
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
    } catch (err) {
      console.error("Paste upload failed:", err);
      alert("Görsel yüklenemedi: " + err.message);
    }
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

      // Kolonların bir kısmı % bir kısmı px genişlikte (table-layout:fixed
      // ile birlikte) - tek bir kolonu px'e sabitlemek diğer % kolonların
      // tabloyu yeniden bölüşmesine yol açıyordu (alakasız kolonlar oynuyordu).
      // Sürükleme başlarken TÜM kolonları o anki genişliğine dondurup
      // tabloyu tam deterministik hale getiriyoruz.
      ths.forEach((otherTh, j) => {
        if (j === 0 || j === ths.length - 1) return;
        const w = otherTh.offsetWidth;
        otherTh.style.width = w + "px";
        if (cols[j]) cols[j].style.width = w + "px";
      });

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
let huntRows    = [];
let huntSearch  = "";
let huntSortCol = "id";
let huntSortDir = -1;
let huntShowAll = false;

function onHuntSearch(val) { huntSearch = trLower(val); renderHuntRows(); }
function toggleHuntRange() { huntShowAll = !huntShowAll; renderHuntRows(); }

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
    ? `<button class="btn-icon" title="Rapor Yaz/Düzenle" onclick="openHuntReportModal(${r.id})" style="color:var(--blue)">&#128221;</button>`
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
      ? `<button class="btn-action-claim" onclick="startHunt(${r.id})" style="background:var(--green);color:#fff">▶ Başla</button> `
      : "";
    return `${startBtn}${report} ${edit}${del}`;
  }
  if (r.status === STATUS_HUNT_RESULT_PENDING && IS_SENIOR)
    return `<button class="btn-action-close" onclick="openHuntResultModal(${r.id})">Sonucu Onayla</button> ${edit}${del}`;
  if (r.status === "Tamamlandı") {
    const pdf = `<a class="btn-icon" title="PDF İndir" href="/hunt/${r.id}/report/pdf" target="_blank" style="color:var(--red)">&#8681;</a>`;
    return `${pdf}${edit}${del}`;
  }
  return `${edit}${del}`;
}

/** Tam sayfa Hunt detayının "Onay" kartı için — huntActionBtns() ile AYNI
 * durum dallanması, ama liste satırının küçük ikon butonları yerine
 * mockup'ın tam-genişlik etiketli butonları (bkz. .hp-actions CSS). */
function huntDetailActions(r) {
  const isAdmin    = USER_ROLE === "admin" || USER_ROLE === "user" || USER_ROLE === "settings";
  const isMyTask   = r.assigned_analyst === CURRENT_USER;
  const isMyReport = r.requester === CURRENT_USER;
  const canEdit    = isAdmin || isMyTask || isMyReport;

  const edit = canEdit
    ? `<button class="btn btn-outline" onclick="openHuntEditModal(${r.id})">Düzenle</button>` : "";
  const del = isAdmin
    ? `<button class="btn btn-danger-outline" onclick="deleteHunt(${r.id})">Sil</button>` : "";

  if (r.status === STATUS_PENDING_VALIDATION && IS_SENIOR)
    return `<button class="btn btn-primary" onclick="openValidateModal('hunt',${r.id})">Onayla / Reddet</button>${edit}${del}`;
  if (r.status === STATUS_PENDING_VALIDATION)
    return `${edit}${del}` || `<p class="hp-actions-note">Ön onay bekleniyor.</p>`;
  if (r.status === "Açık")
    return `<button class="btn btn-primary" onclick="openHuntClaimModal(${r.id})">Üstlen</button>${edit}${del}`;
  if (r.status === "İnceleniyor") {
    const canStart = (isAdmin || isMyTask) && !r.started_at;
    const startBtn = canStart
      ? `<button class="btn btn-primary" onclick="startHunt(${r.id})" style="background:var(--green)">▶ Başla</button>` : "";
    const report = (isAdmin || isMyTask)
      ? `<button class="btn btn-outline" onclick="openHuntReportModal(${r.id})">Rapor Yaz/Düzenle</button>` : "";
    return `${startBtn}${report}${edit}${del}`;
  }
  if (r.status === STATUS_HUNT_RESULT_PENDING && IS_SENIOR)
    return `<button class="btn btn-primary" onclick="openHuntResultModal(${r.id})">Sonucu Onayla</button>${edit}${del}`;
  if (r.status === "Tamamlandı") {
    const pdf = `<a class="btn btn-primary" href="/hunt/${r.id}/report/pdf" target="_blank">&#8681; PDF İndir</a>`;
    return `${pdf}${edit}${del}`;
  }
  return `${edit}${del}` || `<p class="hp-actions-note">Bu durumda bir aksiyon yok.</p>`;
}

const HUNT_COLUMNS = [
  { index: 0, key: "id",               label: "#",            filterType: "text" },
  { index: 1, key: "hunt_title",       label: "Hunt Başlığı", filterType: "text" },
  { index: 2, key: "requester",        label: "Talep Eden",   filterType: "text" },
  { index: 3, key: "assigned_analyst", label: "Analist",      filterType: "text" },
  { index: 4, key: "status",           label: "Durum",        filterType: "select" },
  { index: 5, key: "created_at",       label: "Talep Tarihi", filterType: "text" },
  { index: 6, key: "completed_at",     label: "Tamamlandı",   filterType: "text" },
];

function renderHuntRows() {
  setPageSubtitle("hunt-subtitle",
    `${huntRows.length} hunt · ${huntRows.filter(r => r.status === "İnceleniyor").length} devam ediyor · `
    + `${huntRows.filter(r => r.status === "Tamamlandı").length} tamamlandı`);
  const HUNT_FIELDS = ["hunt_title","hunt_subject","requester","assigned_analyst","hunt_environment","notes"];
  const huntOtherFilterActive = !!huntSearch || Object.values(_colFilters.hunt).some(Boolean);
  const visible = huntRows
    .filter(r => !huntSearch || HUNT_FIELDS.some(f => fieldMatchesTerm(r, f, huntSearch)))
    .filter(r => matchesColumnFilters("hunt", r))
    .filter(r => huntShowAll || huntOtherFilterActive || withinLastMonths(r.created_at, 6));
  updateRangeToggleUI("hunt", huntShowAll);
  const sorted = clientSort(visible, huntSortCol, huntSortDir);
  updateSortUI("hunt", huntSortCol, huntSortDir);
  const tbody = document.getElementById("hunt-tbody");
  const empty = document.getElementById("hunt-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.hunt_title || r.hunt_subject)}">
      <span class="cell-link" onclick="openHuntDetail(${r.id})" style="cursor:pointer">${esc(r.hunt_title || r.hunt_subject)}</span>
    </td>
    <td class="td-truncate" title="${esc(r.requester)}">${esc(displayName(r.requester))}</td>
    <td class="td-truncate" title="${esc(r.assigned_analyst||'')}">${r.assigned_analyst ? esc(displayName(r.assigned_analyst)) : '<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, HUNT_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td class="text-muted">${fmtDate(r.completed_at)}</td>
    <td style="white-space:nowrap">${huntActionBtns(r)}</td>
  </tr>`).join("");
  applyColumnVisibilityToBody("hunt");
}

async function loadHunt() {
  const p = new URLSearchParams();
  const month  = document.getElementById("hunt-filter-month")?.value;
  const env    = document.getElementById("hunt-filter-env")?.value;
  const status = document.getElementById("hunt-filter-status")?.value;
  if (month)  p.set("month", month);
  if (env)    p.set("environment", env);
  if (status) p.set("status", status);
  if (month || env || status) huntShowAll = true;
  try {
    huntRows = await apiFetch(`/api/hunt?${p}`);
    buildColumnFilterRow("hunt", huntRows);
    renderHuntRows();
    // Tam sayfa detay açıkken bir aksiyon (onay/üstlenme/kapama vb.) bu
    // fonksiyonu tetiklerse, kullanıcıyı artık güncel olan listeye geri
    // döndürür — goToItem() zaten hemen ardından openHuntDetail()'i tekrar
    // çağırdığı için o akışı bozmaz (bkz. backToHunts()).
    backToHunts();
  } catch (e) { console.error(e); }
}

function clearHuntFilters() {
  ["hunt-filter-month","hunt-filter-env","hunt-filter-status"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const s = document.getElementById("hunt-search"); if (s) s.value = "";
  huntSearch = "";
  huntShowAll = false;
  _colFilters.hunt = {};
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
  document.getElementById("hunt-title").value   = "";
  document.getElementById("hunt-subject").value = "";
  document.getElementById("hunt-notes").value   = "";
  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    lockToSelf("hunt-requester");
  } else {
    freeSelect("hunt-requester", "");
  }
  document.getElementById("hunt-modal-error").style.display = "none";
  document.getElementById("hunt-modal").style.display = "flex";
  autoGrowAll(document.getElementById("hunt-modal"));
}
function closeHuntModal() { document.getElementById("hunt-modal").style.display = "none"; }

async function saveHunt() {
  const errEl = document.getElementById("hunt-modal-error");
  errEl.style.display = "none";
  const payload = {
    hunt_title:   document.getElementById("hunt-title").value.trim(),
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
  document.getElementById("edit-hunt-title").value   = r.hunt_title || "";
  document.getElementById("edit-hunt-subject").value = r.hunt_subject || "";
  document.getElementById("edit-hunt-notes").value   = r.notes || "";

  if (USER_ROLE === "analyst" || USER_ROLE === "user") {
    const isAssigned  = r.assigned_analyst === CURRENT_USER;
    const isRequester = r.requester === CURRENT_USER;
    lockToSelf("edit-hunt-requester");
    document.getElementById("edit-hunt-title").disabled   = !isRequester;
    document.getElementById("edit-hunt-subject").disabled = !isRequester;
    document.getElementById("edit-hunt-notes").disabled   = !isRequester;
    if (!isRequester && !isAssigned) {
      // Shouldn't reach here (button wouldn't show), but guard anyway
    }
  } else {
    document.getElementById("edit-hunt-title").disabled   = false;
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
  autoGrowAll(document.getElementById("hunt-edit-modal"));
}
function closeHuntEditModal() { document.getElementById("hunt-edit-modal").style.display = "none"; }

async function saveHuntEdit() {
  const id    = document.getElementById("edit-hunt-id").value;
  const errEl = document.getElementById("hunt-edit-modal-error");
  errEl.style.display = "none";
  const payload = {
    hunt_title:   document.getElementById("edit-hunt-title").value.trim(),
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
    sel.innerHTML = `<option value="${esc(CURRENT_USER)}" selected>${esc(displayName(CURRENT_USER))}</option>`;
    sel.disabled  = true;
  } else {
    sel.disabled = false;
    sel.value    = "";
  }
  document.getElementById("claim-hunt-error").style.display = "none";
  document.getElementById("hunt-claim-modal").style.display = "flex";
}
function closeHuntClaimModal() { document.getElementById("hunt-claim-modal").style.display = "none"; }

/** Hunt listesi ⇄ tam sayfa detay geçişi — modal DEĞİL (mockup'ta da tam
 * sayfa). backToHunts() liste tarafını tekrar render etmiyor, sadece geri
 * gösteriyor; loadHunt() zaten kendi içinde en güncel veriyi çekip
 * render ediyor (bkz. loadHunt() sonundaki otomatik geri dönüş). */
function backToHunts() {
  const list = document.getElementById("hunt-list-view");
  const detail = document.getElementById("hunt-detail-view");
  if (detail) { detail.style.display = "none"; detail.innerHTML = ""; }
  if (list) list.style.display = "";
  const pc = document.getElementById("page-content"); if (pc) pc.scrollTop = 0;
}

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
// Sadece "method" (yöntem notu) alanı yaz→onayla→yerleş davranışını alıyor —
// id/taktik/teknik başlığı zaten seçimle geldiği an sabitleniyor (Family C
// deseni), bu yüzden genel renderComposeRow yerine burada elle küçük bir
// varyant kuruluyor: kaldırma (✕) her zaman başlıkta, sadece method alanı
// compose/settled arasında geçiş yapıyor.
let _huntMitreEntriesEdit = makeListEditState();

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

function removeHuntMitreEntry(i) {
  listRemoveItem(_huntMitreEntriesEdit, _huntMitreEntries, i);
  renderHuntMitreEntries();
}

function editHuntMitreMethod(i) {
  listEditBeginEdit(_huntMitreEntriesEdit, _huntMitreEntries, i);
  renderHuntMitreEntries();
}
function cancelHuntMitreMethod() {
  listEditSettleActive(_huntMitreEntriesEdit, _huntMitreEntries);
  renderHuntMitreEntries();
}
function confirmHuntMitreMethod() {
  // Yöntem notu opsiyonel — her zaman geçerli, onayla hiçbir zaman engellenmez.
  listEditConfirm(_huntMitreEntriesEdit, _huntMitreEntries, () => true, "", renderHuntMitreEntries);
}

function updateHuntMitreMethod(i, value) {
  if (_huntMitreEntries[i]) _huntMitreEntries[i].method = value;
  const hidden = document.getElementById("report-hunt-mitre-json");
  if (hidden) hidden.value = JSON.stringify(_huntMitreEntries);
}

function renderHuntMitreEntries() {
  const container = document.getElementById("hunt-mitre-entries"); if (!container) return;
  document.getElementById("report-hunt-mitre-json").value = JSON.stringify(_huntMitreEntries);
  if (!_huntMitreEntries.length) { container.innerHTML = ""; return; }
  container.innerHTML = _huntMitreEntries.map((e, i) => {
    const editing = _huntMitreEntriesEdit.index === i;
    const body = editing
      ? `<div class="form-group" style="margin-top:8px">
          <label class="form-label">Yöntem Notu</label>
          <textarea class="form-input form-textarea"
            placeholder="Bu teknikle ilgili bulgular, araçlar, gözlemler…"
            oninput="updateHuntMitreMethod(${i},this.value)">${esc(e.method)}</textarea>
        </div>
        <div class="compose-row-actions">
          <button type="button" class="btn-ghost-sm" onclick="cancelHuntMitreMethod()">İptal</button>
          <button type="button" class="btn btn-primary" onclick="confirmHuntMitreMethod()">Kaydet</button>
        </div>`
      : `<div class="settled-row" style="margin-top:6px">
          <div class="settled-row-body">${e.method ? esc(e.method) : `<span class="settled-row-empty">Yöntem notu eklenmedi</span>`}</div>
          <div class="settled-row-actions">
            <button type="button" class="btn-icon success" title="Düzenle" onclick="editHuntMitreMethod(${i})">&#9998;</button>
          </div>
        </div>`;
    return `
    <div class="mitre-entry${editing ? " compose-row" : ""}">
      <div class="mitre-entry-header">
        <span class="mitre-tag">${esc(e.id)}</span>
        <span class="text-muted" style="font-size:11px;margin-left:4px">${esc(e.tactic)}</span>
        <span style="font-size:12px;margin-left:6px">${esc(e.name)}</span>
        <button type="button" class="btn-icon danger" style="margin-left:auto;font-size:11px"
                onclick="removeHuntMitreEntry(${i})">&#x2715;</button>
      </div>
      ${body}
    </div>`;
  }).join("");
  autoGrowAll(container);
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

// UC "Bu Hunt için Use-Case oluştur" mini-formundaki ortam etiketleri —
// önceden Dev/Test/Prod diye sabit kodlanmış tek seçimlik bir dropdown'du,
// gerçek Ortamlar listesiyle hiç ilgisi yoktu. Diğer UC ortam alanlarıyla
// aynı çoklu-etiket desenine çevrildi.
let _ucCreateFromHuntEnv = [];
function addUCCreateFromHuntEnv() {
  const sel = document.getElementById("uc-create-env-select");
  const val = sel.value; if (!val) return;
  if (!_ucCreateFromHuntEnv.includes(val)) { _ucCreateFromHuntEnv.push(val); renderUCCreateFromHuntEnv(); }
  sel.value = "";
}
function removeUCCreateFromHuntEnv(val) {
  _ucCreateFromHuntEnv = _ucCreateFromHuntEnv.filter(v => v !== val);
  renderUCCreateFromHuntEnv();
}
function renderUCCreateFromHuntEnv() {
  const c = document.getElementById("uc-create-env-list"); if (!c) return;
  c.innerHTML = _ucCreateFromHuntEnv.map(v =>
    `<span class="ioc-tag">${esc(v)}<button type="button" class="tag-remove"
       onclick="removeUCCreateFromHuntEnv('${esc(v).replace(/'/g,"\\'")}')">&#x2715;</button></span>`
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
let _huntRecommendationsEdit = makeListEditState();
let _huntVulnerabilities = [];
let _huntVulnerabilitiesEdit = makeListEditState();

function _plainTextValid(v) { return !!(v || "").trim(); }

function renderRecommendations() {
  const list = document.getElementById("rec-list");
  if (!list) return;
  list.innerHTML = _huntRecommendations.map((v, i) => renderComposeRow({
    isEditing: _huntRecommendationsEdit.index === i,
    isNew: _huntRecommendationsEdit.snapshot === null,
    error: _huntRecommendationsEdit.index === i ? _huntRecommendationsEdit.error : null,
    index: i,
    confirmFn: "confirmRecommendation", cancelFn: "cancelRecommendation",
    editFn: "editRecommendation", removeFn: "removeRecommendation",
    composeHtml: `<div class="form-group">
      <label class="form-label">Öneri Metni</label>
      <textarea class="form-input form-textarea" placeholder="Öneri maddesi…" oninput="_huntRecommendations[${i}]=this.value">${esc(v)}</textarea>
    </div>`,
    settledHtml: v ? esc(v) : `<span class="settled-row-empty">Boş öneri</span>`,
  })).join("");
  autoGrowAll(list);
}
function addRecommendation() {
  listEditBeginNew(_huntRecommendationsEdit, _huntRecommendations, "");
  renderRecommendations();
  const els = document.querySelectorAll("#rec-list textarea");
  if (els.length) els[els.length - 1].focus();
}
function editRecommendation(i) {
  listEditBeginEdit(_huntRecommendationsEdit, _huntRecommendations, i);
  renderRecommendations();
}
function cancelRecommendation() {
  listEditSettleActive(_huntRecommendationsEdit, _huntRecommendations);
  renderRecommendations();
}
function confirmRecommendation() {
  listEditConfirm(_huntRecommendationsEdit, _huntRecommendations, _plainTextValid, "Öneri metni girin.", renderRecommendations);
}
function removeRecommendation(i) {
  listRemoveItem(_huntRecommendationsEdit, _huntRecommendations, i);
  renderRecommendations();
}

function renderVulnerabilities() {
  const list = document.getElementById("vuln-list");
  if (!list) return;
  list.innerHTML = _huntVulnerabilities.map((v, i) => renderComposeRow({
    isEditing: _huntVulnerabilitiesEdit.index === i,
    isNew: _huntVulnerabilitiesEdit.snapshot === null,
    error: _huntVulnerabilitiesEdit.index === i ? _huntVulnerabilitiesEdit.error : null,
    index: i,
    confirmFn: "confirmVulnerability", cancelFn: "cancelVulnerability",
    editFn: "editVulnerability", removeFn: "removeVulnerability",
    composeHtml: `<div class="form-group">
      <label class="form-label">Zafiyet Metni</label>
      <textarea class="form-input form-textarea" placeholder="Güvenlik açığı…" oninput="_huntVulnerabilities[${i}]=this.value">${esc(v)}</textarea>
    </div>`,
    settledHtml: v ? esc(v) : `<span class="settled-row-empty">Boş madde</span>`,
  })).join("");
  autoGrowAll(list);
}
function addVulnerability() {
  listEditBeginNew(_huntVulnerabilitiesEdit, _huntVulnerabilities, "");
  renderVulnerabilities();
  const els = document.querySelectorAll("#vuln-list textarea");
  if (els.length) els[els.length - 1].focus();
}
function editVulnerability(i) {
  listEditBeginEdit(_huntVulnerabilitiesEdit, _huntVulnerabilities, i);
  renderVulnerabilities();
}
function cancelVulnerability() {
  listEditSettleActive(_huntVulnerabilitiesEdit, _huntVulnerabilities);
  renderVulnerabilities();
}
function confirmVulnerability() {
  listEditConfirm(_huntVulnerabilitiesEdit, _huntVulnerabilities, _plainTextValid, "Zafiyet metni girin.", renderVulnerabilities);
}
function removeVulnerability(i) {
  listRemoveItem(_huntVulnerabilitiesEdit, _huntVulnerabilities, i);
  renderVulnerabilities();
}

// ---------------------------------------------------------------------------
// Hunt — Bulgular (numaralı liste, her madde kendi metni + görseliyle)
// ---------------------------------------------------------------------------
let _huntFindings = [];
let _huntFindingsEdit = makeListEditState();

function _huntFindingValid(f) { return !!((f.text || "").trim() || f.image); }

function renderFindings() {
  const list = document.getElementById("finding-list");
  if (!list) return;
  list.innerHTML = _huntFindings.map((f, i) => renderComposeRow({
    isEditing: _huntFindingsEdit.index === i,
    isNew: _huntFindingsEdit.snapshot === null,
    error: _huntFindingsEdit.index === i ? _huntFindingsEdit.error : null,
    index: i,
    confirmFn: "confirmFinding", cancelFn: "cancelFinding",
    editFn: "editFinding", removeFn: "removeFinding",
    composeHtml: `
      <div class="mitre-entry-header">
        <span style="font-size:12px;font-weight:600;color:var(--text-2)">${i + 1}. Bulgu</span>
      </div>
      <textarea class="form-input form-textarea" style="margin-top:6px"
        placeholder="Bu bulgunun açıklaması…"
        oninput="_huntFindings[${i}].text=this.value"
        onpaste="handleFindingPaste(event, ${i})">${esc(f.text)}</textarea>
      <div id="finding-preview-${i}" class="paste-preview-area"></div>`,
    settledHtml: (f.text || f.image)
      ? `${f.text ? esc(f.text) : ""}${f.image ? `<div style="margin-top:6px"><img class="paste-thumb" src="/static/uploads/${f.image}" onclick="openLightbox('/static/uploads/${f.image}')" title="Büyütmek için tıklayın"/></div>` : ""}`
      : `<span class="settled-row-empty">Boş bulgu</span>`,
  })).join("");
  _huntFindings.forEach((_, i) => renderFindingPreview(i));
}

function addFinding() {
  listEditBeginNew(_huntFindingsEdit, _huntFindings, { text: "", image: null });
  renderFindings();
  const els = document.querySelectorAll("#finding-list textarea");
  if (els.length) els[els.length - 1].focus();
}
function editFinding(i) {
  listEditBeginEdit(_huntFindingsEdit, _huntFindings, i);
  renderFindings();
}
function cancelFinding() {
  listEditSettleActive(_huntFindingsEdit, _huntFindings);
  renderFindings();
}
function confirmFinding() {
  listEditConfirm(_huntFindingsEdit, _huntFindings, _huntFindingValid, "Metin veya görsel ekleyin.", renderFindings);
}
function removeFinding(i) {
  listRemoveItem(_huntFindingsEdit, _huntFindings, i);
  renderFindings();
}

async function handleFindingPaste(e, i) {
  const items = Array.from(e.clipboardData?.items || []);
  const img   = items.find(it => it.type.startsWith("image/"));
  if (!img) return;
  e.preventDefault();
  try {
    const blob     = img.getAsFile();
    const filename = await uploadBlob(blob);
    _huntFindings[i].image = filename;
    renderFindingPreview(i);
  } catch (err) {
    console.error("Paste upload failed:", err);
    alert("Görsel yüklenemedi: " + err.message);
  }
}

function renderFindingPreview(i) {
  const area = document.getElementById(`finding-preview-${i}`);
  const f = _huntFindings[i];
  if (!area || !f) return;
  if (!f.image) { area.innerHTML = ""; return; }
  const url = `/static/uploads/${f.image}`;
  area.innerHTML = `
    <div class="paste-thumb-wrap">
      <img class="paste-thumb" src="${url}" onclick="openLightbox('${url}')" title="Büyütmek için tıklayın"/>
      <button class="paste-thumb-remove" type="button" onclick="removeFindingImage(${i})">&#x2715;</button>
    </div>`;
}

function removeFindingImage(i) {
  if (_huntFindings[i]) _huntFindings[i].image = null;
  renderFindingPreview(i);
}

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
  _huntMitreEntriesEdit = makeListEditState();
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

  // Bulgular listesi — findings_items boşsa ve eski tekil findings/
  // findings_image doluysa (bu özellikten önce açılmış rapor), tek seferlik
  // olarak yeni liste formatına aktarılır (ilk madde olarak).
  try {
    _huntFindings = JSON.parse(r.findings_items || "[]");
    if (!Array.isArray(_huntFindings)) _huntFindings = [];
  } catch { _huntFindings = []; }
  if (!_huntFindings.length && (r.findings || r.findings_image)) {
    _huntFindings = [{ text: r.findings || "", image: r.findings_image || null }];
  }
  _huntFindingsEdit = makeListEditState();
  renderFindings();

  document.getElementById("report-hunt-detection-suggest").value = r.detection_suggestion || "Hayır";
  document.getElementById("report-hunt-detection-detail").value  = r.detection_detail || "";
  toggleDetectionDetail();

  // Recommendations list
  try {
    _huntRecommendations = JSON.parse(r.recommendations || "[]");
    if (!Array.isArray(_huntRecommendations)) _huntRecommendations = r.recommendations ? [r.recommendations] : [];
  } catch { _huntRecommendations = r.recommendations ? [r.recommendations] : []; }
  _huntRecommendationsEdit = makeListEditState();
  renderRecommendations();

  // Vulnerabilities list
  try {
    _huntVulnerabilities = JSON.parse(r.discovered_vulnerabilities || "[]");
    if (!Array.isArray(_huntVulnerabilities)) _huntVulnerabilities = [];
  } catch { _huntVulnerabilities = []; }
  _huntVulnerabilitiesEdit = makeListEditState();
  renderVulnerabilities();

  // UC creation form — reset; disable if a linked UC already exists
  const createUcCb = document.getElementById("report-create-uc");
  if (createUcCb) { createUcCb.checked = false; createUcCb.disabled = !!r.linked_uc_id; }
  const _ucReq  = document.getElementById("uc-create-requester");
  const _ucDesc = document.getElementById("uc-create-description");
  if (_ucReq)  _ucReq.value  = r.requester || "";
  if (_ucDesc) _ucDesc.value = "";
  // Ortam etiketleri varsayılan olarak Hunt'ın kendi ortamıyla başlar —
  // analist isterse etiketleri kaldırıp farklı ortam(lar) seçebilir.
  _ucCreateFromHuntEnv = [..._huntEnvList];
  renderUCCreateFromHuntEnv();
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
    ["detection-detail","detection_detail_image"],
    ["recommendations", "recommendations_image"],
  ].forEach(([htmlKey, apiKey]) => {
    clearPastePreview(`report-hunt-${htmlKey}-preview`, `report-hunt-${htmlKey}-image`);
    if (r[apiKey]) restorePreview(r[apiKey], `report-hunt-${htmlKey}-preview`, `report-hunt-${htmlKey}-image`);
  });

  document.getElementById("hunt-report-modal-error").style.display = "none";
  document.getElementById("hunt-report-modal").style.display = "flex";
  autoGrowAll(document.getElementById("hunt-report-modal"));
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
    // findings: eski tekil metin alanı, sadece /api/search'te aranabilirlik
    // için madde metinlerinin birleşimiyle güncel tutuluyor — gerçek veri
    // artık findings_items'ta (bkz. hunt_report_print.html render mantığı).
    findings:                 _huntFindings.filter(f => (f.text||"").trim() || f.image).map(f => f.text||"").join("\n"),
    findings_items:           JSON.stringify(_huntFindings.filter(f => (f.text||"").trim() || f.image)),
    detection_suggestion:     detectionSuggest,
    detection_detail:         document.getElementById("report-hunt-detection-detail").value.trim(),
    detection_detail_image:   document.getElementById("report-hunt-detection-detail-image").value || null,
    recommendations:          JSON.stringify(_huntRecommendations.filter(v => v.trim())),
    recommendations_image:    document.getElementById("report-hunt-recommendations-image").value || null,
    discovered_vulnerabilities: JSON.stringify(_huntVulnerabilities.filter(v => v.trim())),
    hunt_environment:         _huntEnvList.join(","),
    hunt_result:              document.getElementById("report-hunt-result").value,
    hunt_duration_hours:      document.getElementById("report-hunt-duration").value !== "" ? parseInt(document.getElementById("report-hunt-duration").value) : null,
    report_status:            document.getElementById("report-hunt-report-status").value,
    status:                   document.getElementById("report-hunt-status").value,
    create_uc:                !!(createUcCb?.checked && !createUcCb?.disabled && detectionSuggest === "Evet"),
    uc_description:           document.getElementById("uc-create-description").value.trim(),
    uc_requester:             document.getElementById("uc-create-requester").value,
    uc_environment:           _ucCreateFromHuntEnv.join(","),
  };
  try {
    const res = await apiFetch(`/api/hunt/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    closeHuntReportModal(); loadHunt(); loadKPI();
    if (res?.uc_created_id) {
      setTimeout(() => alert(`Use-Case #${res.uc_created_id} başarıyla oluşturuldu (Hunt #${id} sonucu).`), 200);
      loadUC();
    }
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

// ---------------------------------------------------------------------------
// Hunt — Detail (read-only)
// ---------------------------------------------------------------------------
async function openHuntDetail(id) {
  try {
    const r = await apiFetch(`/api/hunt/${id}`);
    const HUNT_RESULT_CLS = { "Tehdit Tespit Edildi": "status-done", "Tehdit Tespit Edilmedi": "status-reviewing", "Yetersiz Veri": "status-nottuned" };
    const reportBadge = r.report_status === "Tamamlandı"
      ? `<span class="badge status-done">${esc(r.report_status)}</span>`
      : `<span class="badge status-open">${esc(r.report_status||"Taslak")}</span>`;

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
      `<div class="detail-list-row"><span class="mitre-tag">${esc(e.id)}</span> <span class="text-muted" style="font-size:11px">${esc(e.tactic)}</span><div class="detail-value" style="margin-top:4px">${esc(e.method)}</div></div>`
    ).join("");

    // Parse recommendations and vulnerabilities
    let recList = [], vulnList = [];
    try { recList = JSON.parse(r.recommendations || "[]"); if (!Array.isArray(recList)) recList = r.recommendations ? [r.recommendations] : []; } catch { recList = r.recommendations ? [r.recommendations] : []; }
    try { vulnList = JSON.parse(r.discovered_vulnerabilities || "[]"); if (!Array.isArray(vulnList)) vulnList = []; } catch {}
    recList  = recList.filter(v => v.trim());
    vulnList = vulnList.filter(v => v.trim());

    const recHtml  = recList.length  ? recList.map((v, i)  => `<div class="detail-list-row"><span class="detail-list-index">${i+1}.</span>${esc(v)}</div>`).join("") : "";
    const vulnHtml = vulnList.length ? vulnList.map((v, i) => `<div class="detail-list-row"><span class="detail-list-index">${i+1}.</span>${esc(v)}</div>`).join("") : "";

    // Bulgular: yeni numaralı-liste formatı; findings_items boşsa (eski
    // rapor) tekil findings/findings_image alanlarına düşülür.
    let findingItems = [];
    try { findingItems = JSON.parse(r.findings_items || "[]"); if (!Array.isArray(findingItems)) findingItems = []; } catch {}
    findingItems = findingItems.filter(f => (f.text||"").trim() || f.image);
    const findingsHtml = findingItems.length
      ? findingItems.map((f, i) => `<div class="detail-list-row">
          <div class="detail-list-index" style="font-weight:600">${i+1}. Bulgu</div>
          ${f.text ? `<div class="detail-value">${esc(f.text)}</div>` : ""}
          ${f.image ? detailImgRow("", [f.image]) : ""}
        </div>`).join("")
      : (r.findings ? `${detailRow("", r.findings)}${r.findings_image ? detailImgRow("Görsel", [r.findings_image]) : ""}` : "");

    // Jinja namespace deseninin JS karşılığı — boş bölüm hiç basılmayınca
    // numaralar hep ardışık kalsın (bkz. hunt_report_print.html secnum()).
    let _n = 0;
    const secnum = () => String(++_n);

    const scopeCard = r.scope ? `
      <div class="hp-card">
        <div class="hp-card-hdr">
          <span class="hp-card-label">${secnum()} · Hedef &amp; Kapsam</span>
          ${envList.map(e => `<span class="hp-tag mono">${esc(e)}</span>`).join("")}
        </div>
        <div class="hp-card-body">${esc(r.scope)}</div>
        ${r.scope_image ? detailImgRow("Görsel", [r.scope_image]) : ""}
      </div>` : "";

    const mitreCard = mitreEntries.length ? `
      <div class="hp-card">
        <div class="hp-card-hdr"><span class="hp-card-label">${secnum()} · MITRE ATT&amp;CK</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:${mitreDetail ? "14px" : "0"}">
          ${mitreEntries.map(e => `<span class="hp-tag mono">${esc(e.id)} · ${esc(e.name)}</span>`).join("")}
        </div>
        ${mitreEntries.filter(e => e.method).map(e => `
          <div class="hp-code-block"><strong class="mono">${esc(e.id)}</strong> <span class="text-muted">${esc(e.tactic)}</span><br>${esc(e.method)}</div>
        `).join("")}
      </div>` : "";

    const hasFindingsBlock = r.has_findings === "Evet";
    const findingsCard = (findingsHtml || hasFindingsBlock) ? `
      <div class="hp-card">
        <div class="hp-card-hdr">
          <span class="hp-card-label">${secnum()} · Bulgular</span>
          ${r.severity ? `<span class="badge status-retry">Şiddet: ${esc(r.severity)}</span>` : ""}
        </div>
        ${findingItems.length ? findingItems.map((f, i) => `
          <div class="hp-list-row">
            <span class="hp-list-idx mono">${String(i+1).padStart(2,"0")}</span>
            <div style="min-width:0">
              ${f.text ? `<div class="hp-card-body" style="color:var(--text-1);font-size:14px">${esc(f.text)}</div>` : ""}
              ${f.image ? detailImgRow("", [f.image]) : ""}
            </div>
          </div>`).join("")
          : (r.findings ? `${detailRow("", r.findings)}${r.findings_image ? detailImgRow("Görsel", [r.findings_image]) : ""}` : "")}
        ${iocList.length ? `<div class="hp-row-label" style="margin:14px 0 8px;font-size:12px">IOC Listesi</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">${iocList.map(v => `<span class="hp-tag mono">${esc(v)}</span>`).join("")}</div>` : ""}
        ${r.affected_assets ? `<div class="hp-row-label" style="margin-bottom:8px;font-size:12px">Etkilenen Varlıklar</div>
          ${detailRow("", r.affected_assets)}${r.affected_assets_image ? detailImgRow("Görsel", [r.affected_assets_image]) : ""}` : ""}
      </div>` : "";

    const ucCard = r.linked_uc_id ? `
      <div class="hp-uc-card" style="margin-top:14px;cursor:pointer" onclick="backToHunts();openUCDetail(${r.linked_uc_id})">
        <span class="hp-uc-id mono">UC #${r.linked_uc_id}</span>
        <span class="hp-uc-title">Bağlı Use-Case talebini aç</span>
      </div>` : "";
    const detectionCard = `
      <div class="hp-card">
        <div class="hp-card-hdr"><span class="hp-card-label">${secnum()} · Detection Önerisi</span></div>
        <div class="hp-row"><span class="hp-row-label">Öneriliyor mu?</span><span class="hp-row-val">${esc(r.detection_suggestion || "—")}</span></div>
        ${r.detection_suggestion === "Evet" ? `
          ${r.detection_detail ? `<div class="hp-card-body" style="margin-top:8px">${esc(r.detection_detail)}</div>` : ""}
          ${r.detection_detail_image ? detailImgRow("Görsel", [r.detection_detail_image]) : ""}
          ${ucCard}` : ""}
      </div>`;

    const vulnCard = vulnHtml ? `
      <div class="hp-card">
        <div class="hp-card-hdr"><span class="hp-card-label">${secnum()} · Keşfedilen Güvenlik Açıkları</span></div>
        ${vulnList.map((v, i) => `<div class="hp-list-row"><span class="hp-list-idx mono">${String(i+1).padStart(2,"0")}</span><span style="color:var(--text-1);font-size:14px">${esc(v)}</span></div>`).join("")}
      </div>` : "";

    const recCard = recHtml ? `
      <div class="hp-card">
        <div class="hp-card-hdr"><span class="hp-card-label">${secnum()} · Güvenlik Önerileri</span></div>
        ${recList.map((v, i) => `<div class="hp-list-row"><span class="hp-list-idx mono">${String(i+1).padStart(2,"0")}</span><span style="color:var(--text-1);font-size:14px">${esc(v)}</span></div>`).join("")}
        ${r.recommendations_image ? detailImgRow("Görsel", [r.recommendations_image]) : ""}
      </div>` : "";

    const approvalRows = `
      ${r.validated_by ? detailRow("Ön Onayı Veren", displayName(r.validated_by)) : ""}
      ${r.validated_at ? detailRow("Ön Onay Tarihi", fmtDate(r.validated_at)) : ""}
      ${r.validation_note ? detailRow("Ön Onay Notu", r.validation_note) : ""}
      ${r.result_approved_by ? detailRow("Sonucu Onaylayan", displayName(r.result_approved_by)) : ""}
      ${r.result_approved_at ? detailRow("Sonuç Onay Tarihi", fmtDate(r.result_approved_at)) : ""}
      ${r.result_approval_note ? detailRow("Sonuç Onay Notu", r.result_approval_note) : ""}`;

    const body = `
      <div class="detail-page">
        <button class="detail-back" onclick="backToHunts()">&larr; Tüm hunt'lar</button>
        <h1 class="page-title">${esc(r.hunt_title || r.hunt_subject)}</h1>
        <p class="detail-page-id mono">HUNT #${r.id}</p>

        <div class="detail-page-grid">
          <div class="detail-page-main">
            ${scopeCard}
            ${mitreCard}
            ${findingsCard}
            ${detectionCard}
            ${vulnCard}
            ${recCard}
          </div>
          <div class="detail-page-side">
            <div class="hp-card hp-card-side">
              <div class="hp-card-label" style="margin-bottom:12px">Durum</div>
              <div class="hp-status-badge">${badge(r.status, HUNT_CLS)}</div>
              <div class="detail-grid">
                ${detailRow("Talep Eden", displayName(r.requester))}
                ${detailRow("Atanan Analist", r.assigned_analyst ? displayName(r.assigned_analyst) : "")}
                ${r.hunt_title ? detailRow("Hunt Konusu", r.hunt_subject) : ""}
                ${envBadges ? `<div class="detail-row"><span class="detail-label">Ortam</span><span class="detail-value detail-tag-row">${envBadges}</span></div>` : ""}
                ${detailRow("Talep Tarihi", fmtDate(r.created_at))}
                ${r.started_at ? detailRow("Hunt Başlangıcı", fmtDate(r.started_at)) : ""}
                ${detailRow("Tamamlanma Tarihi", fmtDate(r.completed_at))}
                ${r.hunt_duration_hours != null ? detailRow("Hunt Süresi", r.hunt_duration_hours + " saat") : ""}
                ${r.hunt_result ? `<div class="detail-row"><span class="detail-label">Sonuç</span><span class="detail-value"><span class="badge ${HUNT_RESULT_CLS[r.hunt_result]||''}">${esc(r.hunt_result)}</span></span></div>` : ""}
                <div class="detail-row"><span class="detail-label">Rapor Durumu</span><span class="detail-value">${reportBadge}</span></div>
                ${r.notes ? detailRow("Notlar", r.notes) : ""}
                ${approvalRows}
              </div>
            </div>
            <div class="hp-card hp-card-side">
              <div class="hp-card-label" style="margin-bottom:14px">Onay</div>
              <div class="hp-actions">${huntDetailActions(r)}</div>
            </div>
          </div>
        </div>
      </div>`;
    const detailView = document.getElementById("hunt-detail-view");
    detailView.innerHTML = body;
    document.getElementById("hunt-list-view").style.display = "none";
    detailView.style.display = "";
    const pc = document.getElementById("page-content"); if (pc) pc.scrollTop = 0;
  } catch (e) { console.error(e); }
}

async function deleteHunt(id) {
  if (!confirm("Bu hunt talebini silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/hunt/${id}`, { method: "DELETE" }); loadHunt(); loadKPI(); }
  catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// Genel arama (sidebar) — tüm modüllerde arar
// ---------------------------------------------------------------------------
let _searchTimer = null;
function initGlobalSearch() {
  const input = document.getElementById("global-search");
  const box   = document.getElementById("search-results");
  if (!input || !box) return;
  input.addEventListener("input", () => {
    clearTimeout(_searchTimer);
    const q = input.value.trim();
    if (q.length < 2) { box.style.display = "none"; box.innerHTML = ""; return; }
    _searchTimer = setTimeout(() => runGlobalSearch(q), 220);
  });
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { box.style.display = "none"; input.blur(); }
  });
  // Dışarı tıklayınca sonuç kutusunu kapat
  document.addEventListener("click", e => {
    if (!e.target.closest(".sidebar-search")) box.style.display = "none";
  });
}

/** Sonuç kutusunu göster — sidebar'ın overflow'una takılmasın diye
 * position:fixed, konum arama kutusundan hesaplanır. */
function showSearchBox(html) {
  const box = document.getElementById("search-results");
  const input = document.getElementById("global-search");
  if (!box || !input) return;
  const rect = input.getBoundingClientRect();
  box.style.left = Math.round(rect.left) + "px";
  box.style.top  = Math.round(rect.bottom + 4) + "px";
  box.innerHTML = html;
  box.style.display = "block";
}

async function runGlobalSearch(q) {
  try {
    const d = await apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!d.results.length) { showSearchBox(`<div class="search-empty">Sonuç yok</div>`); return; }
    showSearchBox(d.results.map(r => `
      <div class="search-item" onclick="pickSearch('${r.type}', ${r.id})" title="${esc(r.title)}">
        <span class="search-type" style="color:${WORK_TYPE_COLOR[r.type]}">${WORK_TYPE_LABEL[r.type]}</span>
        <span class="search-title">${esc(r.title)}</span>
        <span class="search-status">${esc(r.status)}</span>
      </div>`).join(""));
  } catch (_) {}
}

function pickSearch(type, id) {
  const box   = document.getElementById("search-results");
  const input = document.getElementById("global-search");
  if (box)   box.style.display = "none";
  if (input) input.value = "";
  goToItem(type, id);
}

// ---------------------------------------------------------------------------
// Olay Raporları (XSOAR Incident Report)
// ---------------------------------------------------------------------------
let incidentRows = [];
let incidentSearch = "";
let incidentSortCol = "created_at", incidentSortDir = -1;
let incidentShowAll = false;

const INCIDENT_COLUMNS = [
  { index: 0, key: "id",            label: "#",           filterType: "text" },
  { index: 1, key: "title",         label: "Başlık",       filterType: "text" },
  { index: 2, key: "xsoar_case_id", label: "Case No",      filterType: "text" },
  { index: 3, key: "environment",   label: "Ortam",        filterType: "select" },
  { index: 4, key: "reporter",      label: "Raporlayan",   filterType: "text" },
  { index: 5, key: "_affected_asset_types", label: "Etkilenen Varlık", filterType: "select" },
  { index: 6, key: "status",        label: "Durum",        filterType: "select" },
  { index: 7, key: "created_at",    label: "Tarih",        filterType: "text" },
];

const INCIDENT_CLS = { "Açıldı": "status-open", "İncelemede": "status-reviewing", "Onay Bekliyor": "status-tuned", "Kapandı": "status-done" };

function sortIncident(col) {
  incidentSortDir = incidentSortCol === col ? incidentSortDir * -1 : 1;
  incidentSortCol = col;
  renderIncidentRows();
}

function onIncidentSearch(val) { incidentSearch = trLower(val); renderIncidentRows(); }
function toggleIncidentRange() { incidentShowAll = !incidentShowAll; renderIncidentRows(); }

async function loadIncidents() {
  const p = new URLSearchParams();
  const month  = document.getElementById("incident-filter-month")?.value;
  const env    = document.getElementById("incident-filter-env")?.value;
  const status = document.getElementById("incident-filter-status")?.value;
  if (month)  p.set("month", month);
  if (env)    p.set("environment", env);
  if (status) p.set("status", status);
  if (month || env || status) incidentShowAll = true;
  try {
    incidentRows = await apiFetch(`/api/incident-reports?${p}`);
    incidentRows.forEach(r => {
      let assets = [];
      try { assets = JSON.parse(r.affected_assets || "[]"); if (!Array.isArray(assets)) assets = []; } catch {}
      r._affected_asset_count = assets.length;
      r._affected_asset_types = [...new Set(assets.map(a => a.type).filter(Boolean))].sort().join(", ");
    });
    buildColumnFilterRow("incident", incidentRows);
    renderIncidentRows();
    backToIncidents();
  } catch (e) { console.error(e); }
}

function clearIncidentFilters() {
  ["incident-filter-month", "incident-filter-env", "incident-filter-status"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const s = document.getElementById("incident-search"); if (s) s.value = "";
  incidentSearch = "";
  incidentShowAll = false;
  _colFilters.incident = {};
  loadIncidents();
}

function incidentActionBtns(r) {
  let btns = "";
  if (r.status === "Açıldı") {
    btns += `<button class="btn-action-claim" onclick="startIncidentReview(${r.id})">İncelemeye Başla</button> `;
    btns += `<button class="btn-icon" title="Düzenle" onclick="openIncidentEditModal(${r.id})">&#9998;</button> `;
  }
  if (r.status === "İncelemede") {
    btns += `<button class="btn-action-close" onclick="submitIncidentForApproval(${r.id})">Onaya Gönder</button> `;
    btns += `<button class="btn-icon" title="Düzenle" onclick="openIncidentEditModal(${r.id})">&#9998;</button> `;
  }
  if (r.status === "Onay Bekliyor" && IS_SENIOR) {
    btns += `<button class="btn-action-close" onclick="openValidateModal('incident', ${r.id})">Onayla / Reddet</button> `;
  }
  if (r.status === "Kapandı") {
    btns += `<a class="btn-icon" title="PDF İndir" href="/incident-reports/${r.id}/report/pdf" target="_blank" style="color:var(--red)">&#8681;</a> `;
  }
  if (USER_ROLE === "admin" || USER_ROLE === "user" || USER_ROLE === "settings") {
    btns += `<button class="btn-icon danger" onclick="deleteIncident(${r.id})" title="Sil">&#128465;</button>`;
  }
  return btns || '<span class="text-muted">—</span>';
}

async function startIncidentReview(id) {
  try {
    await apiFetch(`/api/incident-reports/${id}/start-review`, { method: "POST" });
    loadIncidents();
  } catch (e) { alert(e.message); }
}

async function submitIncidentForApproval(id) {
  try {
    await apiFetch(`/api/incident-reports/${id}/submit-for-approval`, { method: "POST" });
    loadIncidents();
  } catch (e) { alert(e.message); }
}

function renderIncidentRows() {
  setPageSubtitle("incident-subtitle",
    `${incidentRows.length} olay raporu · ${incidentRows.filter(r => r.status === "Açıldı").length} açıldı · `
    + `${incidentRows.filter(r => r.status === "Kapandı").length} kapandı`);
  const FIELDS = ["title", "xsoar_case_id", "reporter", "environment", "sections", "_affected_asset_types"];
  const incidentOtherFilterActive = !!incidentSearch || Object.values(_colFilters.incident).some(Boolean);
  const visible = incidentRows
    .filter(r => !incidentSearch || FIELDS.some(f => fieldMatchesTerm(r, f, incidentSearch)))
    .filter(r => matchesColumnFilters("incident", r))
    .filter(r => incidentShowAll || incidentOtherFilterActive || withinLastMonths(r.created_at, 6));
  updateRangeToggleUI("incident", incidentShowAll);
  const sorted = clientSort(visible, incidentSortCol, incidentSortDir);
  updateSortUI("incident", incidentSortCol, incidentSortDir);
  const tbody = document.getElementById("incident-tbody");
  const empty = document.getElementById("incident-empty");
  if (!sorted.length) { tbody.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  tbody.innerHTML = sorted.map(r => `<tr>
    <td class="text-muted" style="font-size:11px;letter-spacing:0">#${r.id}</td>
    <td class="td-truncate" title="${esc(r.title)}">
      <span class="cell-link" onclick="openIncidentDetail(${r.id})" style="cursor:pointer">${esc(r.title)}</span>
    </td>
    <td class="td-truncate" style="font-size:11px" title="${esc(r.xsoar_case_id || '')}">${r.xsoar_case_id ? esc(r.xsoar_case_id) : '<span class="text-muted">—</span>'}</td>
    <td class="td-truncate" title="${esc(r.environment || '')}">${r.environment ? esc(r.environment) : '<span class="text-muted">—</span>'}</td>
    <td class="td-truncate" title="${esc(r.reporter)}">${esc(displayName(r.reporter))}</td>
    <td class="text-muted" title="${esc(r._affected_asset_types || '')}">${r._affected_asset_count ? `${r._affected_asset_count} varlık` : '<span class="text-muted">—</span>'}</td>
    <td>${badge(r.status, INCIDENT_CLS)}</td>
    <td class="text-muted">${fmtDate(r.created_at)}</td>
    <td style="white-space:nowrap">${incidentActionBtns(r)}</td>
  </tr>`).join("");
  applyColumnVisibilityToBody("incident");
}

// ---- Bölümler (sections) ve görsel galerisi — düzenleme modali -----------
let _incidentSections = [];
let _incidentSectionsEdit = makeListEditState();
let _incidentImages   = [];   // [{order, filename}]

function _incidentSectionValid(s) { return !!((s.heading || "").trim() || (s.text || "").trim()); }

function renderIncidentSections() {
  const list = document.getElementById("incident-section-list");
  if (!list) return;
  list.innerHTML = _incidentSections.map((s, i) => renderComposeRow({
    isEditing: _incidentSectionsEdit.index === i,
    isNew: _incidentSectionsEdit.snapshot === null,
    error: _incidentSectionsEdit.index === i ? _incidentSectionsEdit.error : null,
    index: i,
    confirmFn: "confirmIncidentSection", cancelFn: "cancelIncidentSection",
    editFn: "editIncidentSection", removeFn: "removeIncidentSection",
    composeHtml: `
      <div class="form-group">
        <label class="form-label">Bölüm Başlığı</label>
        <input type="text" class="form-input input-sm" style="max-width:240px;font-weight:500"
               placeholder="Bölüm başlığı…" value="${esc(s.heading)}"
               oninput="_incidentSections[${i}].heading=this.value"/>
      </div>
      <div class="form-group" style="margin-top:8px">
        <label class="form-label">Bölüm Metni</label>
        <textarea class="form-input form-textarea"
          placeholder="Bölüm metni…"
          oninput="_incidentSections[${i}].text=this.value">${esc(s.text)}</textarea>
      </div>`,
    settledHtml: (s.heading || s.text)
      ? `${s.heading ? `<div class="settled-row-title">${esc(s.heading)}</div>` : ""}${s.text ? esc(s.text) : ""}`
      : `<span class="settled-row-empty">Boş bölüm</span>`,
  })).join("");
  autoGrowAll(list);
}
function addIncidentSection() {
  listEditBeginNew(_incidentSectionsEdit, _incidentSections, { heading: "", text: "" });
  renderIncidentSections();
  const els = document.querySelectorAll("#incident-section-list textarea");
  if (els.length) els[els.length - 1].focus();
}
function editIncidentSection(i) {
  listEditBeginEdit(_incidentSectionsEdit, _incidentSections, i);
  renderIncidentSections();
}
function cancelIncidentSection() {
  listEditSettleActive(_incidentSectionsEdit, _incidentSections);
  renderIncidentSections();
}
function confirmIncidentSection() {
  listEditConfirm(_incidentSectionsEdit, _incidentSections, _incidentSectionValid, "Başlık veya metin girin.", renderIncidentSections);
}
function removeIncidentSection(i) {
  listRemoveItem(_incidentSectionsEdit, _incidentSections, i);
  renderIncidentSections();
}

const INCIDENT_ASSET_TYPES = ["Makine/Bilgisayar", "Kullanıcı Hesabı", "Sunucu", "E-posta Hesabı", "Uygulama/Servis", "Diğer"];
let _incidentAssets = [];   // [{name, type}]
let _incidentAssetsEdit = makeListEditState();

function _incidentAssetValid(a) { return !!(a.name || "").trim(); }

function renderIncidentAssets() {
  const list = document.getElementById("incident-asset-list");
  if (!list) return;
  list.innerHTML = _incidentAssets.map((a, i) => renderComposeRow({
    isEditing: _incidentAssetsEdit.index === i,
    isNew: _incidentAssetsEdit.snapshot === null,
    error: _incidentAssetsEdit.index === i ? _incidentAssetsEdit.error : null,
    index: i,
    confirmFn: "confirmIncidentAsset", cancelFn: "cancelIncidentAsset",
    editFn: "editIncidentAsset", removeFn: "removeIncidentAsset",
    composeHtml: `
      <div class="form-group">
        <label class="form-label">Varlık Adı</label>
        <input type="text" class="form-input input-sm" style="max-width:240px;font-weight:500"
               placeholder="Varlık adı…" value="${esc(a.name)}"
               oninput="_incidentAssets[${i}].name=this.value"/>
      </div>
      <div class="form-group" style="margin-top:8px">
        <label class="form-label">Tür</label>
        <select class="form-input input-sm"
          onchange="_incidentAssets[${i}].type=this.value">
          <option value="">— Tür seçin —</option>
          ${INCIDENT_ASSET_TYPES.map(t => `<option value="${esc(t)}" ${a.type === t ? "selected" : ""}>${esc(t)}</option>`).join("")}
        </select>
      </div>`,
    settledHtml: a.name
      ? `${esc(a.name)}${a.type ? ` — ${esc(a.type)}` : ""}`
      : `<span class="settled-row-empty">Boş varlık</span>`,
  })).join("");
}
function addIncidentAsset() {
  listEditBeginNew(_incidentAssetsEdit, _incidentAssets, { name: "", type: "" });
  renderIncidentAssets();
  const els = document.querySelectorAll("#incident-asset-list input[type=text]");
  if (els.length) els[els.length - 1].focus();
}
function editIncidentAsset(i) {
  listEditBeginEdit(_incidentAssetsEdit, _incidentAssets, i);
  renderIncidentAssets();
}
function cancelIncidentAsset() {
  listEditSettleActive(_incidentAssetsEdit, _incidentAssets);
  renderIncidentAssets();
}
function confirmIncidentAsset() {
  listEditConfirm(_incidentAssetsEdit, _incidentAssets, _incidentAssetValid, "Varlık adı girin.", renderIncidentAssets);
}
function removeIncidentAsset(i) {
  listRemoveItem(_incidentAssetsEdit, _incidentAssets, i);
  renderIncidentAssets();
}

function renderIncidentGallery() {
  const gallery = document.getElementById("incident-image-gallery");
  if (!gallery) return;
  gallery.innerHTML = _incidentImages.map((img, i) => {
    const url = `/static/uploads/${img.filename}`;
    const label = (img.order !== undefined && img.order !== null) ? img.order : i + 1;
    return `<div class="paste-thumb-wrap">
      <img class="paste-thumb" src="${url}" onclick="openLightbox('${url}')" title="Görsel ${label} — büyütmek için tıklayın"/>
      <button class="paste-thumb-remove" type="button" onclick="removeIncidentImage(${i})">&#x2715;</button>
      <div style="text-align:center;font-size:10px;color:var(--text-3);margin-top:2px">Görsel ${label}</div>
    </div>`;
  }).join("");
}
function removeIncidentImage(i) { _incidentImages.splice(i, 1); renderIncidentGallery(); }

async function handleIncidentImagePaste(e) {
  const items = Array.from(e.clipboardData?.items || []);
  const img   = items.find(it => it.type.startsWith("image/"));
  if (!img) return;
  e.preventDefault();
  try {
    const blob     = img.getAsFile();
    const filename = await uploadBlob(blob);
    _incidentImages.push({ order: _incidentImages.length + 1, filename });
    renderIncidentGallery();
  } catch (err) {
    console.error("Paste upload failed:", err);
    alert("Görsel yüklenemedi: " + err.message);
  }
}

function openIncidentCreateModal() {
  document.getElementById("incident-edit-modal-title").textContent = "Yeni Olay Raporu";
  document.getElementById("incident-edit-id").value       = "";
  document.getElementById("incident-edit-title").value    = "";
  document.getElementById("incident-edit-env").value      = "";
  document.getElementById("incident-edit-case-id").value  = "";

  _incidentSections = [];
  _incidentSectionsEdit = makeListEditState();
  listEditBeginNew(_incidentSectionsEdit, _incidentSections, { heading: "", text: "" });
  renderIncidentSections();
  _incidentImages = [];
  renderIncidentGallery();
  _incidentAssets = [];
  _incidentAssetsEdit = makeListEditState();
  renderIncidentAssets();

  document.getElementById("incident-edit-image-paste").value = "";
  document.getElementById("incident-edit-modal-error").style.display = "none";
  document.getElementById("incident-edit-modal").style.display = "flex";
  autoGrowAll(document.getElementById("incident-edit-modal"));
}

function openIncidentEditModal(id) {
  const r = incidentRows.find(x => x.id === id); if (!r) return;
  if (!["Açıldı", "İncelemede"].includes(r.status)) { alert("Sadece Açıldı veya İncelemede durumundaki olay raporları düzenlenebilir."); return; }
  document.getElementById("incident-edit-modal-title").textContent = "Olay Raporunu Düzenle";
  document.getElementById("incident-edit-id").value       = id;
  document.getElementById("incident-edit-title").value    = r.title || "";
  document.getElementById("incident-edit-env").value      = r.environment || "";
  document.getElementById("incident-edit-case-id").value  = r.xsoar_case_id || "";

  try {
    _incidentSections = JSON.parse(r.sections || "[]");
    if (!Array.isArray(_incidentSections)) _incidentSections = [];
  } catch { _incidentSections = []; }
  _incidentSectionsEdit = makeListEditState();
  if (!_incidentSections.length) listEditBeginNew(_incidentSectionsEdit, _incidentSections, { heading: "", text: "" });
  renderIncidentSections();

  try {
    _incidentImages = JSON.parse(r.images || "[]");
    if (!Array.isArray(_incidentImages)) _incidentImages = [];
  } catch { _incidentImages = []; }
  renderIncidentGallery();

  try {
    _incidentAssets = JSON.parse(r.affected_assets || "[]");
    if (!Array.isArray(_incidentAssets)) _incidentAssets = [];
  } catch { _incidentAssets = []; }
  _incidentAssetsEdit = makeListEditState();
  renderIncidentAssets();

  document.getElementById("incident-edit-image-paste").value = "";
  document.getElementById("incident-edit-modal-error").style.display = "none";
  document.getElementById("incident-edit-modal").style.display = "flex";
  autoGrowAll(document.getElementById("incident-edit-modal"));
}
function closeIncidentEditModal() { document.getElementById("incident-edit-modal").style.display = "none"; }

async function saveIncidentEdit() {
  const id    = document.getElementById("incident-edit-id").value;
  const errEl = document.getElementById("incident-edit-modal-error");
  errEl.style.display = "none";
  const title = document.getElementById("incident-edit-title").value.trim();
  if (!title) { errEl.textContent = "Başlık zorunludur."; errEl.style.display = "block"; return; }
  const validSections = _incidentSections.filter(s => (s.heading || "").trim() || (s.text || "").trim());
  if (!validSections.length) { errEl.textContent = "En az bir dolu bölüm gerekli."; errEl.style.display = "block"; return; }
  const payload = {
    title,
    environment:   document.getElementById("incident-edit-env").value,
    xsoar_case_id: document.getElementById("incident-edit-case-id").value.trim(),
    sections:      validSections,
    images:        _incidentImages.map((img, i) => ({
      order: (img.order !== undefined && img.order !== null) ? img.order : i + 1,
      filename: img.filename,
    })),
    affected_assets: _incidentAssets.filter(a => (a.name || "").trim()),
  };
  try {
    if (id) {
      await apiFetch(`/api/incident-reports/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/api/incident-reports", { method: "POST", body: JSON.stringify(payload) });
    }
    closeIncidentEditModal();
    loadIncidents();
  } catch (e) { errEl.textContent = e.message; errEl.style.display = "block"; }
}

/** Olay Raporu listesi ⇄ tam sayfa detay geçişi — modal DEĞİL (mockup'ta
 * da tam sayfa, bkz. backToHunts() ile aynı desen). */
function backToIncidents() {
  const list = document.getElementById("incident-list-view");
  const detail = document.getElementById("incident-detail-view");
  if (detail) { detail.style.display = "none"; detail.innerHTML = ""; }
  if (list) list.style.display = "";
  const pc = document.getElementById("page-content"); if (pc) pc.scrollTop = 0;
}

async function openIncidentDetail(id) {
  let r = incidentRows.find(x => x.id === id);
  if (!r) { try { incidentRows = await apiFetch("/api/incident-reports"); r = incidentRows.find(x => x.id === id); } catch { return; } }
  if (!r) return;

  let sections = [], images = [];
  try { sections = JSON.parse(r.sections || "[]"); if (!Array.isArray(sections)) sections = []; } catch {}
  try { images   = JSON.parse(r.images   || "[]"); if (!Array.isArray(images))   images   = []; } catch {}
  let assets = [];
  try { assets = JSON.parse(r.affected_assets || "[]"); if (!Array.isArray(assets)) assets = []; } catch {}

  // Jinja namespace deseninin JS karşılığı (bkz. openHuntDetail/secnum) —
  // boş bölüm hiç basılmayınca numaralar ardışık kalsın. Mockup'ta Olay
  // Raporu bölümleri Hunt'tan farklı: "N · Başlık" değil, ayrı bir mono
  // "BÖLÜM N" kicker + ayrı büyük-harf başlık (bkz. tema/SOC Tracker.dc.html
  // satır 950-951).
  let _n = 0;
  const secnum = () => String(++_n);

  const sectionsHtml = sections.length ? sections.map(s => `
    <div class="hp-card">
      <div class="hp-card-hdr">
        <span class="hp-card-kicker mono">BÖLÜM ${secnum()}</span>
        ${s.heading ? `<span class="hp-card-label">${esc(s.heading)}</span>` : ""}
      </div>
      <div class="hp-card-body">${esc(s.text)}</div>
    </div>`).join("") : "";

  const assetsCard = assets.length ? `
    <div class="hp-card">
      <div class="hp-card-hdr">
        <span class="hp-card-kicker mono">BÖLÜM ${secnum()}</span>
        <span class="hp-card-label">Etkilenen Varlıklar</span>
      </div>
      ${assets.map(a => `
        <div class="hp-asset-row">
          ${a.type ? `<span class="hp-asset-type mono">${esc(a.type)}</span>` : ""}
          <span class="hp-asset-val mono">${esc(a.name)}</span>
        </div>`).join("")}
    </div>` : "";

  const imagesCard = images.length ? `
    <div class="hp-card">
      <div class="hp-card-hdr">
        <span class="hp-card-kicker mono">BÖLÜM ${secnum()}</span>
        <span class="hp-card-label">Görseller</span>
      </div>
      <div class="detail-images">
        ${images.map((img, i) => {
          const url = `/static/uploads/${img.filename}`;
          const label = (img.order !== undefined && img.order !== null) ? img.order : i + 1;
          return `<div style="text-align:center">
            <img class="detail-img" src="${url}" onclick="openLightbox('${url}')" title="Büyütmek için tıklayın"/>
            <div style="font-size:10px;color:var(--text-3);margin-top:2px">Görsel ${label}</div>
          </div>`;
        }).join("")}
      </div>
    </div>` : "";

  // Onay kartı — durum bazlı aksiyonlar, eski modal footer'ıyla BİREBİR
  // aynı mantık (bkz. docs/PROGRESS.md), sadece closeIncidentDetailModal()
  // yerine backToIncidents() çağırıyor. Sıralama mockup'ın birincil/ikincil/
  // ghost hiyerarşisini izliyor (bkz. huntDetailActions).
  let actionsHtml = "";
  if (r.status === "Açıldı") {
    actionsHtml = `<button class="btn btn-primary" onclick="backToIncidents();startIncidentReview(${r.id})">İncelemeye Başla</button>
      <button class="btn btn-outline" onclick="backToIncidents();openIncidentEditModal(${r.id})">Düzenle</button>`;
  } else if (r.status === "İncelemede") {
    actionsHtml = `<button class="btn btn-primary" onclick="backToIncidents();submitIncidentForApproval(${r.id})">Onaya Gönder</button>
      <button class="btn btn-outline" onclick="backToIncidents();openIncidentEditModal(${r.id})">Düzenle</button>`;
  } else if (r.status === "Onay Bekliyor" && IS_SENIOR) {
    actionsHtml = `<button class="btn btn-primary" onclick="backToIncidents();openValidateModal('incident', ${r.id})">Onayla / Reddet</button>`;
  } else if (r.status === "Kapandı") {
    actionsHtml = `<a class="btn btn-primary" href="/incident-reports/${r.id}/report/pdf" target="_blank">&#8681; PDF İndir</a>`;
  }
  actionsHtml += `<button class="btn btn-ghost-sm" onclick="backToIncidents()">Listeye Dön</button>`;

  const body = `
    <div class="detail-page">
      <button class="detail-back" onclick="backToIncidents()">&larr; Tüm olay raporları</button>
      <div class="detail-page-kicker-row">
        <span class="detail-page-id mono">OLAY #${r.id}${r.xsoar_case_id ? " · Case #" + esc(r.xsoar_case_id) : ""}</span>
        ${badge(r.status, INCIDENT_CLS)}
      </div>
      <h1 class="page-title">${esc(r.title)}</h1>

      <div class="detail-page-grid">
        <div class="detail-page-main">
          ${sectionsHtml}
          ${assetsCard}
          ${imagesCard}
        </div>
        <div class="detail-page-side">
          <div class="hp-card hp-card-side">
            <div class="hp-card-label" style="margin-bottom:12px">Künye</div>
            <div class="hp-status-badge">${badge(r.status, INCIDENT_CLS)}</div>
            <div class="detail-grid">
              ${detailRow("Case No", r.xsoar_case_id ? "#" + r.xsoar_case_id : "")}
              ${detailRow("Ortam", r.environment)}
              ${detailRow("Raporlayan", displayName(r.reporter))}
              ${detailRow("Tarih", fmtDate(r.created_at))}
              ${r.validated_by ? detailRow("İşlemi Yapan", displayName(r.validated_by)) : ""}
              ${r.validated_at ? detailRow("İşlem Tarihi", fmtDate(r.validated_at)) : ""}
              ${r.validation_note ? detailRow("Son İnceleme Notu", r.validation_note) : ""}
            </div>
          </div>
          <div class="hp-card hp-card-side">
            <div class="hp-card-label" style="margin-bottom:14px">Onay</div>
            <div class="hp-actions">${actionsHtml}</div>
          </div>
        </div>
      </div>
    </div>`;
  const detailView = document.getElementById("incident-detail-view");
  detailView.innerHTML = body;
  document.getElementById("incident-list-view").style.display = "none";
  detailView.style.display = "";
  const pc = document.getElementById("page-content"); if (pc) pc.scrollTop = 0;
}

async function deleteIncident(id) {
  if (!confirm("Bu olay raporunu silmek istediğinize emin misiniz?")) return;
  try { await apiFetch(`/api/incident-reports/${id}`, { method: "DELETE" }); loadIncidents(); }
  catch (e) { alert(e.message); }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
// Kolon göster/gizle + kolona göre filtre — Tune/UC/Hunt tabloları rol
// gözetmeksizin DOM'da her zaman var (IS_SETTINGS/HAS_DASHBOARD sadece hangi
// sekmenin ilk açıldığını belirliyor), o yüzden her iki init dalında da
// çağrılır.
function _initAllTableColumns() {
  initTableColumns("tune",     TUNE_COLUMNS);
  initTableColumns("uc",       UC_COLUMNS);
  initTableColumns("hunt",     HUNT_COLUMNS);
  initTableColumns("incident", INCIDENT_COLUMNS);
}

if (HAS_DASHBOARD) {
  loadDropdownData().then(() => {
    loadDashboard();
    setupAllPaste();
    // Attach column resizers (tables are in static HTML, always present)
    document.querySelectorAll(".table-fixed").forEach(makeColumnsResizable);
    _initAllTableColumns();
  });
} else {
  loadDropdownData().then(() => {
    loadSettings();
    setupAllPaste();
    document.querySelectorAll(".table-fixed").forEach(makeColumnsResizable);
    _initAllTableColumns();
  });
}
initGlobalSearch();
