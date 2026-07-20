/* ============================================================
   SOC Tracker UI Kit — davranış yardımcıları  v1
   ------------------------------------------------------------
   soc-ui.css'teki class'ları kullanan projeler için framework-
   bağımsız, saf DOM tabanlı yardımcı fonksiyonlar. React/Vue gibi
   bir framework kullanıyorsanız bunları birebir kopyalamak yerine
   aynı MANTIĞI kendi component'lerinize taşıyın (örn. bir <Modal>
   component'i, açık/kapalı state'i kendi state yönetiminizle tutar
   ama görünüm yine soc-ui.css class'larını kullanır).

   Düz HTML/vanilla JS bir projeyseniz bu dosyayı olduğu gibi
   <script> ile dahil edip aşağıdaki fonksiyonları çağırabilirsiniz.
   ============================================================ */

/* ---- Sekme (tab) navigasyonu ----------------------------------------------
   HTML deseni:
     <button class="nav-btn active" data-tab="dashboard">...</button>
     <section id="tab-dashboard" class="tab-panel active">...</section>
   Kullanım:
     initTabNav(tabName => { if (tabName === "dashboard") loadDashboard(); });
*/
function initTabNav(onTabChange) {
  document.querySelectorAll(".nav-btn[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn[data-tab]").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById("tab-" + btn.dataset.tab);
      if (panel) panel.classList.add("active");
      if (typeof onTabChange === "function") onTabChange(btn.dataset.tab);
    });
  });
}

/* ---- Modal aç/kapat --------------------------------------------------------
   HTML deseni:
     <div class="modal-overlay" id="my-modal" style="display:none">
       <div class="modal"> ... <button class="modal-close" onclick="closeModal('my-modal')">&times;</button> ... </div>
     </div>
   Not: .modal-overlay'e tıklayınca kapanması istenirse (dış tıklama),
   openModal çağrısında closeOnOverlayClick:true geçin. */
function openModal(id, { closeOnOverlayClick = true } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "flex";
  if (closeOnOverlayClick && !el.dataset.overlayBound) {
    el.addEventListener("click", e => { if (e.target === el) closeModal(id); });
    el.dataset.overlayBound = "1";
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

/* ---- Tablo kolonlarını sürükle-genişlet ------------------------------------
   HTML deseni: <table class="table table-fixed"><colgroup><col style="width:140px"/>...</colgroup>...
   Kullanım: document.querySelectorAll(".table-fixed").forEach(makeColumnsResizable);
   İlk ve son kolon atlanır (genelde durum noktası / işlem butonları). */
function makeColumnsResizable(table) {
  if (!table) return;
  const ths  = Array.from(table.querySelectorAll("thead tr th"));
  const cols = Array.from(table.querySelectorAll("col"));

  ths.forEach((th, i) => {
    if (i === 0 || i === ths.length - 1) return;

    const handle = document.createElement("div");
    handle.className = "col-resize-handle";
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

/* ---- Panoya kopyala (tek tık, kısa "Kopyalandı" geri bildirimi) ------------
   HTML deseni: <button class="btn-copy-inline" data-copy="metin" onclick="copyFromAttr(this)">Kopyala</button> */
function copyFromAttr(btn) {
  const text = btn.getAttribute("data-copy") || "";
  const done = () => {
    const old = btn.innerHTML;
    btn.innerHTML = "&#10003; Kopyalandı";
    setTimeout(() => { btn.innerHTML = old; }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => _fallbackCopy(text, done));
  } else {
    _fallbackCopy(text, done);
  }
}
function _fallbackCopy(text, done) {
  // navigator.clipboard yalnızca güvenli bağlamlarda (https/localhost) çalışır;
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

/* ---- Sidebar/overflow'a takılmayan açılır kutu -----------------------------
   .search-results gibi kutuları, bir input/tetikleyici elemente göre
   position:fixed konumlandırır — üst konteynerin overflow:hidden/auto'suna
   takılmaz. Kullanım:
     positionFixedBox(document.getElementById("search-results"),
                       document.getElementById("global-search")); */
function positionFixedBox(box, anchorEl, { gap = 4 } = {}) {
  if (!box || !anchorEl) return;
  const rect = anchorEl.getBoundingClientRect();
  box.style.left = Math.round(rect.left) + "px";
  box.style.top  = Math.round(rect.bottom + gap) + "px";
}
