# SOC Tracker — İlerleme Günlüğü

## Son Güncelleme: 2026-06-11 (commit f9a9d9d'e kadar)

---

## ✅ Tamamlanan Özellikler

### Temel Altyapı
- [x] Flask + SQLite SPA mimarisi
- [x] Oturum bazlı kimlik doğrulama (login/logout)
- [x] Rol tabanlı yetki kontrolü: `admin`, `analyst`, `settings`
- [x] Audit log altyapısı (`audit_log` tablosu, `write_audit()` helper)
- [x] Ortam yönetimi (environments tablosu, admin-only CRUD)
- [x] Excel export (openpyxl, tüm modüller ayrı sheet)
- [x] KPI / Dashboard (kart + son aktivite)
- [x] Dark-mode Notion tarzı UI (CSS custom properties)

### Kural Tuning Modülü
- [x] Talep oluşturma / düzenleme / silme
- [x] Üstlenme ve kapama akışı
- [x] Görsel ekleme (base64 evidence/resolution)
- [x] İzin matrisi (reporter / assigned / admin)
- [x] Audit log entegrasyonu

### Use-Case Modülü
- [x] Talep oluşturma / düzenleme / silme
- [x] Üstlenme ve kapama akışı
- [x] UC Close modal: MITRE ATT&CK sınıflandırması (tactic → technique seçimi, per-technique yöntem notu)
- [x] "MITRE ATT&CK sınıflandırması yapıldı" checkbox (kural yazıldıktan sonra SIEM'de yapıldığını teyit)
- [x] Ortam multi-select tag sistemi (virgülle ayrılmış storage, INSTR filtresi)
- [x] İzin matrisi (reporter / assigned / admin)
- [x] Audit log entegrasyonu

### Threat Hunting Modülü
- [x] Veritabanı şeması (`threat_hunt_requests` tablosu)
- [x] Backend CRUD endpoint'leri (`/api/hunt` GET/POST, `/api/hunt/<id>` GET/PUT/DELETE)
- [x] Üstlenme endpoint'i (`/api/hunt/<id>/claim`)
- [x] İzin matrisi (reporter / assigned / admin)
- [x] Audit log entegrasyonu
- [x] Nav'da "Threat Hunting" sekmesi
- [x] Talep listesi tablosu
- [x] Yeni talep modal'ı
- [x] Düzenle modal'ı (talep alanları)
- [x] Hunt Raporu modal'ı:
  - Hedef & Kapsam (textarea + görsel)
  - MITRE ATT&CK: tactic→technique dropdown, per-technique yöntem notu
  - Bulgu var mı? (Evet/Hayır) koşullu bölüm: IOC listesi (tag), Şiddet, Etkilenen Varlıklar
  - Detection Önerisi (Evet/Hayır + detay)
  - Öneriler (textarea + görsel)
  - Sonuç (Pozitif/Negatif/Yetersiz Veri)
  - Rapor Durumu (Taslak/Tamamlandı)
  - Hunt Ortamı multi-select tag sistemi
- [x] Üstlen / Kapat modal'ları
- [x] Detay görünümü
- [x] Excel export'a 4. sheet olarak eklendi
- [x] KPI / Dashboard entegrasyonu

### MITRE ATT&CK Entegrasyonu
- [x] MITRE STIX JSON cache (`mitre_cache` tablosu, GitHub'dan fetch)
- [x] Tactic → Technique hiyerarşisi
- [x] MITRE dedup fix: `kill_chain_phases[0]` only (çok taktikli teknikler tek taktikle gösterilir)
- [x] Stale cache migration (eski "Credential Access, Defense Evasion" kayıtları otomatik temizlenir)
- [x] Dropdown: tactic seç → teknik listesi yenilenir

### Kullanıcı Yönetimi (Settings)
- [x] Kullanıcı oluşturma (`POST /api/users`)
- [x] Kullanıcı listesi (`GET /api/users`)
- [x] Kullanıcı rol değiştirme + şifre sıfırlama (`PUT /api/users/<id>`)
- [x] Settings kullanıcısı düzenlenemez (korumalı)
- [x] Audit log: `EDIT_USER` aksiyonu

---

### Tune Onaylama Süreci (2026-06-11)
- [x] Yeni durum akışı: Açık → İnceleniyor → Tune Edildi → Tune Başarılı / Yeniden Tune
- [x] `tuned_at` + `approval_deadline` (5 gün) kolonları
- [x] `approved_by`, `approved_at` kolonları
- [x] POST /api/tune/<id>/approve — admin veya talep eden onaylar
- [x] POST /api/tune/<id>/retry — admin geri alır, Açık'a döner
- [x] Tune Onaylama modal'ı (Tune Başarılı / Yeniden Tune butonları)
- [x] Tablo: "Tune Edildi" satırında "Onayla" butonu (son onay tarihi tooltip)

### UC Test Süreci (2026-06-11)
- [x] Yeni durum akışı: Açık → İnceleniyor → Test Ediliyor → Prod'da Aktif / Revizyon
- [x] `test_started_at`, `test_approved_at`, `test_approved_by`, `test_notes` kolonları
- [x] POST /api/usecase/<id>/test-approve — Prod'da Aktif yapar
- [x] POST /api/usecase/<id>/test-reject — İnceleniyor'a döner
- [x] Test Onaylama modal'ı (Prod'a Geç / Revizyon + test notu)
- [x] Tablo: "Test Ediliyor" satırında "Test Onayla" butonu (admin only)

### KPI Güncellemesi (2026-06-11)
- [x] Yeni kartlar: Onay Bekleyen, Tune Başarılı, Başarı Oranı, Test Ediliyor, Prod'da Aktif
- [x] `tune_success_rate` (yüzde) hesabı

### Linear UI Redesign (2026-06-11)
- [x] CSS v11: tam yeniden yazım, Linear #5E6AD2 accent, koyu tema
- [x] Sidebar navigasyon (header yerine sol kenar çubuğu)
- [x] Yeni badge/dot renk sistemi (TUNE_DOT, UC_DOT, HUNT_DOT ayrı haritalar)
- [x] Temiz tablo stili, KPI kart düzeni, modal geliştirmeleri
- [x] JS v15: tüm yeni durum sınıfları, onaylama fonksiyonları

### Docker & Deployment (2026-06-11)
- [x] Dockerfile + docker-compose.yml (port 9897, named volumes)
- [x] Settings kullanıcısı tüm sekmeleri (Tuning/UC/Hunt) görebilir
- [x] Settings kullanıcısı tüm düzenleme modallarını açabilir

---

### Görsel Aylık Rapor (2026-06-11)
- [x] `/report` route — aylık filtre, tüm KPI hesapları, Jinja2 template
- [x] `templates/report.html` — Chart.js donut grafikler, KPI kartları, progress bar özeti, tablolar
- [x] Rapor: Tune / UC / Hunt durum dağılımı donut chart + legend
- [x] Rapor: Başarı oranı + UC prod dönüşüm oranı kartları
- [x] Yazdır/PDF butonu, ay picker, "Tüm Zamanlar" seçeneği
- [x] Print CSS: toolbar gizle, sayfa kırılma kontrolleri
- [x] Dashboard'a "Rapor" butonu eklendi (aktif ay filtresini taşır)
- [x] Excel export: Tuning'e tuned_at, approved_by, approved_at kolonları eklendi
- [x] Excel export: UC'ye test_started_at, test_approved_at, test_approved_by, test_notes eklendi
- [x] Excel KPI sayfası: Tune Edildi, Tune Başarılı, Yeniden Tune, UC Test/Prod satırları güncellendi
- [x] Excel KPI: tune_success_rate ve uc_prod_rate hesapları

### Otomatik Veritabanı Yedekleme (2026-06-11)
- [x] `_do_backup()` — anlık SQLite kopyası, kota bazlı eski yedek temizliği
- [x] Uygulama başlangıcında otomatik yedek (son 5 gün içinde yedek yoksa)
- [x] Yedek sıklığı: 5 günde bir, 12 yedek saklanır (≈2 ay)
- [x] `/api/admin/backup` (oluştur), `/api/admin/backups` (listele), `/api/admin/backup/<file>` (indir/sil) — admin only
- [x] Docker: yedekler `/data/backups` altında `soc_data` volume'üne kalıcı yazılıyor
- [ ] ⚠️ **Bilinen risk:** yedekler DB ile aynı Docker volume'ünde (`soc_data`) — volume silinirse (`docker volume rm` / `down -v`) hem DB hem yedekler birlikte gider. Kalıcılık sertleştirmesi planlanıyor.

### Faz 1 — Yedekleme Dayanıklılığı (2026-07-19)
- [x] `docker-compose.yml`: `/data/backups` artık `soc_data` named volume'ü yerine host bind-mount (`${BACKUP_HOST_DIR:-./backups}`) — `docker volume rm soc_data` / `down -v` artık yedekleri silmiyor
- [x] `scheduler.py`: `JobScheduler` / `ScheduledJob` — Gunicorn'un 2 worker'ından yalnızca biri çalıştırsın diye dosya kilidi (`fcntl.flock`) ile korunan arka plan thread'i
- [x] `app.py`: `_auto_backup_on_start` → `_backup_if_due(keep, max_age_days)` olarak genelleştirildi; hem başlangıçta hem de scheduler tarafından 6 saatte bir kontrol ediliyor (konteyner haftalarca yeniden başlamasa bile 5 günlük yedekleme politikası devam ediyor)
- [x] `docs/PLAN_SCHEDULER_REDESIGN.md` ve `docs/BACKUP_RESTORE.md` yazıldı
- [ ] **Doğrulanmadı:** Ubuntu test sunucusunda `docker volume rm` sonrası yedeklerin sağlam kaldığı ve restore adımlarının çalıştığı henüz canlıda denenmedi — kullanıcı ile birlikte deploy günü test edilecek
- [ ] `backup.py` (standalone script) host crontab'ında gerçekten kullanılıyor mu henüz teyit edilmedi — SSH erişimi olduğunda kontrol edilecek

### Faz 2 — Audit Log Sertleştirme / Hash-Zincirleme (2026-07-19)
- [x] `audit_log` tablosuna additive `prev_hash`/`record_hash` kolonları eklendi
- [x] `write_audit()` her satırı bir öncekine sha256 hash-zincirle bağlıyor (gizli salt: `AUDIT_CHAIN_SECRET`, ilk satır `GENESIS`'ten başlıyor)
- [x] `verify_audit.py` — bağımsız CLI script, zinciri baştan sona doğrular, bir yedek dosyasına karşı da çalıştırılabilir (offline sertifikasyon denetimi için)
- [x] `POST /api/audit/verify` (admin only) — aynı doğrulamayı UI'dan tetikler, sonucu audit log'a da yazar (`VERIFY_AUDIT_CHAIN`)
- [x] Audit Log ekranına "Zinciri Doğrula" butonu eklendi
- [x] `scheduler.py`'a yeni iş: `audit_export` — audit log'u 24 saatte bir JSON olarak `BACKUP_DIR`'e (DB'den bağımsız) dışa aktarır, zincir ucu hash'ini not eder, son 30 export'u saklar
- [x] `docs/audit_logging.md` yazıldı — hash zinciri modeli, sanitizasyon, checklist, bilinen sınırlamalar (geçmiş kayıtlar zincirlenemez, nadir eşzamanlılık senaryosu)
- [x] **Doğrulandı (preview/local):** hash-zincirleme migration hatasız çalıştı; "Zinciri Doğrula" butonu doğru sonuç veriyor; bir satır doğrudan SQL ile değiştirilip zincirin bunu yakaladığı (`record_hash uyuşmuyor`) canlı olarak test edildi ve satır geri alınınca zincir tekrar geçerli oldu; `verify_audit.py --db tracker.db` CLI de bağımsız çalışıyor
- [ ] Ubuntu test sunucusunda (Gunicorn 2 worker, gerçek prod DB'ye dokunmadan bir kopya üzerinde) henüz denenmedi — deploy günü doğrulanacak

### Faz 3 — RBAC Temeli: Onay Seviyesi (Tier) Alanı (2026-07-19)
- [x] `users` tablosuna additive `tier` kolonu (`Analist`/`Kıdemli Analist`/`Müdür`, varsayılan `Analist`)
- [x] Bir kerelik migration: mevcut `role='admin'` → `tier='Müdür'`, `role='analyst'` → `tier='Analist'` (davranış anında değişmedi, sadece altyapı)
- [x] `is_senior()` helper (`app.py`) — `tier in (Kıdemli Analist, Müdür)`, Faz 4/5'teki onay uçları bunu kullanacak
- [x] `session["tier"]` login'de DB'den taze okunuyor; `/` route'u `user_tier`/`is_senior`'ı template'e geçiyor (`USER_TIER`/`IS_SENIOR` JS sabitleri)
- [x] `/api/users` GET/POST/PUT: `tier` alanı eklendi, doğrulanıyor, audit detail'inde rol/tier değişikliği ayrı ayrı raporlanıyor
- [x] Settings → Kullanıcılar: rol dropdown'unun yanına ikinci bir "Onay Seviyesi" dropdown'u eklendi (yeni kullanıcı ekleme + düzenleme modalı), rozet olarak gösteriliyor (`tier-analist`/`tier-kidemli`/`tier-mudur` CSS sınıfları)
- [x] `docs/rbac.md` yazıldı — iki boyutlu model (role=sistem/CRUD, tier=onay seviyesi), neden ayrı tutulduğu, migration mantığı
- [x] **Doğrulandı (preview/local):** migration hatasız çalıştı (`admin→Müdür`, `analyst→Analist` doğru uygulandı); Settings ekranında bir kullanıcının onay seviyesi "Kıdemli Analist" olarak değiştirildi ve rozet güncellendi; o kullanıcı ile giriş yapılıp `IS_SENIOR=true` render edildiği doğrulandı (curl ile)
- [ ] Ubuntu test sunucusunda henüz denenmedi — deploy günü doğrulanacak

### Faz 4 — Tuning & UC: Ön Onay + Q&A'lı Son Onay (2026-07-19)
- [x] Yeni durumlar: `Ön Onay Bekliyor` (yeni taleplerin varsayılanı — istemciden gelen `status` artık yok sayılıyor) ve `Reddedildi` (terminal)
- [x] Yeni uçlar: `POST /api/tune|usecase/<id>/validate` ve `.../reject-validation` (sadece `is_senior()`; red için gerekçe zorunlu)
- [x] `approve_tune`, `retry_tune`, `test_approve_uc`, `test_reject_uc`: onaylayıcı kontrolü `is_senior()`'a çevrildi (öncesinde "admin veya talep eden" / salt admin gibi gevşek kontroller vardı)
- [x] `approve_tune`/`test_approve_uc`: zorunlu Q&A — `qa_test_ok`, `qa_peer_reviewed`, onay notu (tune: yeni `approval_note`, UC: mevcut `test_notes` — notu zorunlu hale getirildi)
- [x] UC'nin otomatik prod geçişi kaldırıldı — artık Q&A + `is_senior()` onayı olmadan `Prod'da Aktif` olamaz
- [x] Hunt'tan otomatik oluşturulan UC talepleri de artık `Ön Onay Bekliyor` ile açılıyor (önceden doğrudan `Açık` ile açılan ayrı bir kod yolu vardı — bulunup düzeltildi)
- [x] **Güvenlik kapıları:** `update_tune`/`update_usecase` (PUT) artık onay-korumalı durumlardan (`Ön Onay Bekliyor`, `Tune Edildi`/`Test Ediliyor`, `Tune Başarılı`/`Prod'da Aktif`, `Reddedildi`) çıkışı ve bu durumlara (`Tune Başarılı`/`Prod'da Aktif`, `Reddedildi`) doğrudan girişi engelliyor — sadece dedicated onay uçlarından geçilebilir
- [x] Yan bug düzeltmesi: UC test-approve/reject'te frontend `notes` gönderiyordu, backend `test_notes` okuyordu — anahtar uyuşmazlığı giderildi (not hep boş kaydediliyordu)
- [x] Frontend: yeni "Onayla / Reddet" (validate) modalı (Tuning+UC ortak), mevcut Tune/UC onay modallarına Q&A checkbox'ları + zorunlu not eklendi, yeni durum badge/dot renkleri (`status-pending`/`status-rejected`), detay panellerine ön onay + Q&A alanları eklendi
- [x] `docs/REQUIREMENTS.md` onay matrisi güncellendi
- [x] **Doğrulandı (preview + API testleri):** Tuning ve UC için tam yaşam döngüsü (oluştur → ön onay/red → üstlen → kapat → son onay Q&A ile) API üzerinden test edildi; güvenlik kapıları için bypass denemeleri (durum korumalı alanlardan/durumlara doğrudan PUT) doğru şekilde 400 ile reddedildi — **ilk yazımda bir kaçak bulundu ve düzeltildi** (Reddedildi/Tune Başarılı/Test Ediliyor gibi korumalı durumlardan genel PUT ile çıkış engellenmemişti); düşük onay seviyeli (Analist) bir kullanıcının validate/approve denemesi 403 ile reddedildiği doğrulandı
- [ ] Ubuntu test sunucusunda henüz denenmedi — deploy günü doğrulanacak
- [ ] KPI kartları, Excel export ve aylık rapor yeni durumları (Ön Onay Bekliyor/Reddedildi) henüz yansıtmıyor — kapsam dışı bırakıldı, ayrı bir iyileştirme olarak not edildi

### Faz 5 — Threat Hunt: Aynı Onay Deseni (2026-07-19)
- [x] Yeni hunt talepleri `Ön Onay Bekliyor` ile açılıyor (Tuning/UC ile aynı desen); Kıdemli Analist/Müdür onaylar (`/validate` → `Açık`) veya gerekçeli reddeder (`/reject-validation` → `Reddedildi`)
- [x] Yeni ikinci kapı: analist raporu tamamlayıp "Rapor Tamamlandı — Onaya Gönder" seçtiğinde hunt `Sonuç Onayı Bekliyor`'a geçer (eskiden doğrudan `Tamamlandı` seçilebiliyordu); Kıdemli Analist/Müdür sonucu onaylar (`/approve-result` → `Tamamlandı`) veya revizyona gönderir (`/reject-result` → `İnceleniyor`, gerekçe zorunlu)
- [x] `İptal` yolu bilinçli olarak onay kapısı dışında bırakıldı — vazgeçilen bir hunt'ın kalite onayına ihtiyacı yok
- [x] `update_hunt` (PUT) aynı LEAVE/ARRIVE kilit desenini kullanıyor (`HUNT_LOCKED_LEAVE`/`HUNT_LOCKED_ARRIVE`)
- [x] Hunt'tan otomatik oluşturulan UC talepleri zaten Faz 4'te `Ön Onay Bekliyor`'a çekilmişti — hunt'ın kendisi de artık aynı zincirde
- [x] Ortak "Onayla / Reddet" (validate) modalı hunt için de genişletildi (tune/usecase/hunt üçü de aynı modalı paylaşıyor)
- [x] Yeni "Hunt Sonuç Onayı" modalı (Tamamlandı ✓ / Revizyona Gönder)
- [x] Detay panele ön onay + sonuç onayı alanları eklendi
- [x] **Doğrulandı (preview + API testleri):** tam yaşam döngüsü (oluştur → ön onay/red → üstlen → rapor onaya gönder → onay/revizyon → Tamamlandı), her iki yöndeki bypass denemesi (Ön Onay Bekliyor'dan çıkış, Sonuç Onayı Bekliyor'dan çıkış, Tamamlandı'ya/Reddedildi'ye doğrudan giriş, Reddedildi'den çıkış) doğru şekilde 400 ile reddedildi, düşük onay seviyeli kullanıcı 403 ile reddedildi
- [ ] Ubuntu test sunucusunda henüz denenmedi — deploy günü doğrulanacak
- [ ] KPI/Excel/rapor bu modülde de yeni durumları henüz yansıtmıyor (Faz 4'teki notla aynı kapsam dışı bırakma)

### Faz 6 — Threat Hunt Raporu: UI + PDF Export (2026-07-19)
- [x] `templates/hunt_report_print.html` — tamamlanmış bir hunt için tek sayfalık, temiz, yazdırılabilir rapor şablonu (talep bilgileri, onay/hesap verebilirlik bilgileri, kapsam, MITRE tablosu, bulgular, IOC'ler, detection önerisi, öneriler, keşfedilen zafiyetler, sonuç)
- [x] `requirements.txt`'e `weasyprint` eklendi; `Dockerfile`'a Pango/Cairo/gdk-pixbuf + DejaVu font sistem paketleri eklendi
- [x] `GET /hunt/<id>/report/pdf` — sadece `status == 'Tamamlandı'` (Faz 5'in onayladığı, nihai) hunt'lar için; görseller diskteki dosyadan `file://` URI ile WeasyPrint'e veriliyor (ağ round-trip'i yok)
- [x] Hunt satırlarında ve detay panelinde "PDF İndir" butonu (sadece Tamamlandı hunt'larda görünür)
- [x] Audit: `EXPORT_HUNT_PDF` aksiyonu
- [x] **Doğrulandı (yerelde, tam):** route'un durum kontrolü (`Tamamlandı` değilse 400) test edildi; WeasyPrint'in resmi taşınabilir Windows derlemesi (`weasyprint.exe`, GitHub release) indirilip gerçek bir PDF üretildi — MITRE tablosu, IOC etiketleri, Türkçe karakterler (ğ/ş/ı/ö/ü), sayfa numaralandırma, `file://` ile görsel gömme, onay/hesap verebilirlik bölümü hepsi doğru render oldu (bkz. proje köküne bırakılan örnek: `ORNEK_hunt_raporu.pdf`)
- [x] `os.environ.get("WEASYPRINT_EXE")` fallback'i eklendi: `from weasyprint import HTML` başarısız olursa (Windows'ta native kütüphaneler yok) ve bu env var taşınabilir exe'ye işaret ediyorsa ona düşülür — production (Linux) bu satıra hiç düşmez, sadece `.claude/launch.json`'da (git'e girmeyen) tanımlı. Bu sayede gerçek `/hunt/<id>/report/pdf` route'u bu Windows makinesinde de uçtan uca (butona basarak) test edilebildi.
- [ ] Yine de gerçek Docker/Ubuntu ortamında (Dockerfile'ın apt paketleriyle) hiç denenmedi — kütüphanelerin farklı paketleme şekli (native apt kurulumu vs. taşınabilir derleme) aynı WeasyPrint motorunu kullandığından yüksek güven var, ama deploy günü bir kez denemek gerekiyor.

### Faz 7 — XSOAR Webhook Entegrasyonu (Tuning) (2026-07-19)
- [x] `POST /api/integrations/xsoar/tune` — session yerine `X-API-Key` header ile korunuyor (`api_key_required` decorator, `hmac.compare_digest`, ortam değişkeni `XSOAR_WEBHOOK_TOKEN`)
- [x] Zorunlu alanlar: `xsoar_case_id`, `rule_name`, `environment`, `analyst_comment`; opsiyonel: `xsoar_url`
- [x] Oluşan talep `reporter="XSOAR Entegrasyonu"`, `status="Ön Onay Bekliyor"` ile açılıyor — otomatik kaynaklı olduğu için Faz 4'ün insan onayı kapısından geçmesi bilinçli bir güvenlik katmanı
- [x] `tune_requests` tablosuna `xsoar_case_id`/`xsoar_url` kolonları eklendi; tune detay panelinde tıklanabilir case linki olarak gösteriliyor
- [x] Audit: `CREATE_TUNE_XSOAR` aksiyonu
- [x] `docker-compose.yml`'e `XSOAR_WEBHOOK_TOKEN` eklendi — **yan düzeltme:** `AUDIT_CHAIN_SECRET` de (Faz 2'de env-var olarak tanımlanmış ama docker-compose.yml'e hiç eklenmemişti) aynı seferde eklendi, yoksa production'da audit zinciri sessizce dev-fallback salt ile çalışıyor olacaktı
- [x] `docs/xsoar_integration.md` yazıldı — tam JSON şeması, auth, örnek curl isteği, XSOAR tarafı için notlar
- [x] **Doğrulandı (yerelde):** auth kontrolü (anahtar yok/yanlış → 401), eksik alan kontrolü (→ 400), başarılı istek (→ 201, doğru alanlarla `Ön Onay Bekliyor` durumunda kayıt), detay panelinde XSOAR case linkinin tıklanabilir render edildiği (DOM üzerinden doğrudan doğrulandı)
- [ ] Sadece Tuning modülünde — UC/Hunt'a genişletme ileride aynı desenle (`api_key_required` + yeni bir uç) yapılabilir
- [ ] Ubuntu test sunucusunda henüz denenmedi; XSOAR tarafının gerçek isteği atıp atamadığı (ağ erişimi teyit edildi ama gerçek deneme yapılmadı) deploy günü doğrulanacak

### Faz A — Görsel Ekleme Akışı Düzeltmeleri (2026-07-19)
- [x] `recommendations_image` uçtan uca bağlandı — DB kolonu ve Hunt PDF şablonu zaten vardı (Faz 6) ama hiçbir UI onu doldurmuyordu: yeni bir paste-hedefi (`report-hunt-recommendations-paste`) + preview + hidden input eklendi, `setupAllPaste()`'e kaydedildi, `saveHuntReport()` payload'ına eklendi, modal yeniden açıldığında restore ediliyor, detay panelinde gösteriliyor
- [x] Ölü/yinelenen `setupPaste()` tanımı silindi (iki tanım vardı; `_pasteReady` guard'ı olmayanı — modal her yeniden açıldığında listener'ların birikmesini önleyen guard'lı tanım korundu)
- [x] `uploadBlob()` artık backend'in gerçek hata mesajını gösteriyor (önceden sabit "Görsel yüklenemedi" metni basıyordu, gerçek sebep kayboluyordu)
- [x] `/api/upload`: `file.save()` etrafına try/except eklendi (disk/izin hatası artık çirkin 500 yerine anlamlı JSON hatası döndürüyor); `MAX_CONTENT_LENGTH` (10 MB) + 413 handler eklendi
- [x] **Doğrulandı (API + DOM):** görsel yükleme → hunt kaydına kaydetme → kayıt yeniden çekildiğinde kalıcı olduğu → rapor modalı yeniden açıldığında önizlemenin geri geldiği → detay panelinde `<img>` olarak göründüğü uçtan uca test edildi
- [ ] İlk ajan raporunun "`restorePreview()` hiç çağrılmıyor" iddiası **yanlıştı** — grep ile doğrulandı, zaten 3 yerde çağrılıyordu; bu not gelecekte aynı yanlış varsayımın tekrarlanmaması için

### Faz B — Dashboard / Rapor / Excel Doğruluğu (2026-07-19)
- [x] **Gerçek bir veri gizleme hatası bulundu ve düzeltildi:** Dashboard'da "9 toplam talep" yazarken KPI kartı sadece 6'sını gösteriyordu (Ön Onay Bekliyor + Reddedildi hiçbir yerde yoktu) — Faz 4/5'in eklediği yeni durumlar Dashboard (`/api/kpi`), Aylık Rapor (`/report` + `report.html`) ve Excel'in (KPI Özeti sayfası) hiçbirine eklenmemişti. Üçüne de eklendi.
- [x] **Gerçek bir tutarsızlık düzeltildi:** Dashboard'daki `tune_success_rate` formülü (payda: başarılı+yeniden tune) ile Rapor/Excel'deki aynı isimli metrik (payda: +edilmedi) farklıydı — Dashboard, Rapor/Excel'in formülüne eşitlendi.
- [x] **Gerçek bir SQL injection düzeltildi:** `/api/kpi`'deki ay filtresi (`mf()`) `month` parametresini doğrudan f-string ile sorguya ekliyordu — parametreli sorguya çevrildi (Rapor/Excel zaten güvenliydi, sadece Dashboard'daki en eski/ilk yazılan fonksiyon bu deseni kullanmıyordu).
- [x] **Faz 4'ten bağımsız, önceden var olan iki eksiklik de giderildi:** Dashboard'da tune/UC için "İnceleniyor" bucket'ı hiç yoktu; Tune için "Tune Edilmedi" bucket'ı hiç yoktu — ikisi de eklendi.
- [x] Yeni "Ön Onay Red Oranı" metriği (tune/UC/hunt ayrı ayrı) — kullanıcı kararına göre Reddedildi, başarı/prod oranlarına karışmıyor, ayrı ve açıkça etiketlenmiş bir metrik
- [x] Excel'e onay-izi/hesap verebilirlik kolonları eklendi: Tuning (`validated_by/at/note`, `qa_test_ok`, `qa_peer_reviewed`, `approval_note`, `xsoar_case_id`, `xsoar_url`), UC (`validated_by/at/note`, `qa_test_ok`, `qa_peer_reviewed`), Hunt (`validated_by/at/note`, `result_approved_by/at/note`, `hunt_duration_hours`, keşfedilen zafiyetler)
- [x] Dashboard KPI kartlarına yeni bir özet satırı eklendi ("Ön Onay Bekliyor: N · Reddedildi: N") — mevcut 3-slotluk tasarım bozulmadan hiçbir sayı gizli kalmıyor
- [x] **Doğrulandı (API + gerçek Excel dosyası indirilip açılarak):** her üç modül için `/api/kpi`'de gösterilen tüm bucket'ların toplamının `*_total`'a **birebir eşit olduğu** doğrulandı (Tuning 9=9, UC 3=3, Hunt 7=7); aynı doğrulama `/report`'un donut chart verileri ve indirilen Excel'in "KPI Özeti" sayfası için de tekrarlandı — üçü de aynı sayıları veriyor; Excel'in yeni onay-izi kolonlarının (ör. XSOAR case ID) gerçek verilerle doğru dolduğu teyit edildi

### Faz C — Logo, Favicon, Genel Arayüz Düzeltmeleri (2026-07-19)
- [x] **Gerçek, canlı ortamda doğrulanmış bir tablo düzeni hatası bulundu ve düzeltildi:** Tuning/UC/Hunt tablolarında (`table-fixed`, karışık px/% kolon genişlikleri) dar bir görünürlük alanında sabit-pikselli kolonlar (Durum, İşlem, tarihler) yüzde-tabanlı kolonların (Kural İsmi, Ortam, Raporlayan, Tune Nedeni, Tune Eden) neredeyse tüm genişliğini yiyordu — canlı ölçümde bu kolonlar 7-15px'e kadar sıkışıp metin tamamen çakışıyordu ("KUBURTASREPORLAENI TONE EDEN" gibi okunaksız başlıklar). `.table-fixed`'e `min-width: 1100px` eklendi — artık `.table-wrapper`'ın zaten var olan `overflow-x:auto`'su devreye giriyor, kolonlar okunabilir kalıyor. `<th>` hücrelerine de taşma koruması eklendi.
- [x] Yeni SVG logo (kalkan + onay işareti, `--accent` renginde) — `static/favicon.svg`; sidebar, login, aylık rapor'daki eski "harf kutusu" yerine kullanılıyor
- [x] Favicon eklendi (`index.html`, `login.html`, `report.html`) — önceden hiç yoktu, tarayıcı sekmesi boştu
- [x] **Yan düzeltme:** `login.html`'in `styles.css` versiyonu (`?v=3`) `index.html`'inkinden (`?v=11.5`) çok geride kalmıştı — login sayfası muhtemelen eski/stale CSS'i tarayıcı önbelleğinden sunuyordu. Versiyon eşitlendi.
- [x] Dashboard mini-tablolarındaki ve ana tablolardaki kısaltılan hücrelere (`title=`) tooltip eklendi — üzerine gelince tam metin görünüyor
- [x] `:focus-visible` durumları eklendi (`.btn`, `.btn-icon`, `.nav-btn`, `.modal-close`) — önceden sadece form input'larında vardı, klavye ile gezinme hiç görsel geri bildirim vermiyordu
- [ ] `.th-sortable`/`.cell-link` (onclick'li `<th>`/`<span>`) hâlâ `tabindex` almıyor, Tab ile hiç odaklanamıyor — bu daha kapsamlı bir klavye-erişilebilirliği işi, bilinçli olarak bu turun dışında bırakıldı
- [x] Mojibake/encoding taraması yapıldı — **sorun bulunmadı**, tüm dosyalar doğru UTF-8
- [x] **Doğrulandı (ekran görüntüleriyle, önce/sonra karşılaştırmalı):** Tuning tablosunun başlıkları artık tamamen okunabilir ve ayrık; yeni logo hem sidebar'da hem login sayfasında doğru render oluyor

### Faz D — Detay Modalı Çakışması, Ayarlar/Backup RBAC Düzeltmesi, SOAR Case Zorunluluğu (2026-07-19)

Kullanıcının Faz C sonrası bildirdiği 4 talep üzerine:

1. **Hunt/Tune/UC detay kutucuklarında metin çakışması — bulundu, doğrulandı, düzeltildi.**
   Onay verecek analistin raporu okuyamamasına neden olan gerçek bir hata:
   `detailRow()`/`detailImgRow()` (üç modülün de paylaştığı ortak render
   fonksiyonu) `.detail-value` span'ına `white-space`/`overflow-wrap`
   vermiyordu. Fetch-mock ile (DB'ye hiç yazmadan) canlı ölçüldü: boşluksuz
   uzun bir token (hostname, hash, IOC) `.modal-body`'yi 41-61px taşırıyordu
   (flex kolonunun varsayılan `min-width:auto`'su nedeniyle), üstüne
   çok-paragraflı yapıştırılan metin satır sonu korumasız tek bloğa
   dönüşüyordu. `.detail-value`'ya `overflow-wrap/word-break:break-word` +
   `white-space:pre-wrap`, `.detail-row`'a `min-width:0` eklendi — tek yerden
   üç modülü birden düzeltti. Düzeltme sonrası ölçümde taşma 0.

2. **Beklenmedik bulgu: Ayarlar sayfası (yedekleme dahil) admin için hiç erişilemezdi.**
   `is_settings` şablon koşulu sadece `role=='settings'` iken doğruydu — admin
   nav'da "Ayarlar"ı hiç göremiyordu, dolayısıyla `docs/rbac.md`'nin
   belgelediği "backup yönetimi" yetkisine rağmen yedekleme panelini UI'dan
   hiç kullanamıyordu. `is_settings or user_role=='admin'` yapıldı (nav,
   şablon bölümü, `settings_required` decorator'ı); admin artık Dashboard/
   Tuning/UC/Hunt/Audit'i kaybetmeden Ayarlar'ı da görüyor. `app.js`'teki
   init dalı (`IS_SETTINGS` → `HAS_DASHBOARD`) da bu yüzden düzeltildi,
   yoksa admin dashboard'unu kaybedecekti.

3. **XSOAR entegrasyonu bilgilendirme paneli** — Ayarlar sayfasına, teknik
   olmayan bir dille "bu ne işe yarar / kurulum için XSOAR ekibine ne
   verilir" açıklaması eklendi (mevcut `docs/xsoar_integration.md`'nin
   içeriğine dayanıyor, admin-only backup panelinin yanına).

4. **Manuel Tuning taleplerinde SOAR Case ID zorunluluğu** (kullanıcı kararı:
   gerçek zamanlı XSOAR API doğrulaması değil, zorunlu alan + "case
   bulunamadı" kutucuğuyla manuel case no; kapsam sadece Tuning).
   - Yeni kolon: `tune_requests.xsoar_case_missing` (TEXT, 'Evet'/'Hayır').
   - `POST /api/tune`: `xsoar_case_id` boşsa 400 (istemci + sunucu tarafında).
   - "Yeni Talep" ve "Düzenle" modallerine Case ID/Link alanları + "SOAR'da
     case bulunamadı" kutucuğu eklendi (`toggleXsoarMissing()`); işaretlenince
     alan etiketi "Case No (manuel)"a döner, case linki devre dışı kalır.
   - **Geriye dönük kilitlemiyor:** bu özellikten önce açılmış, case ID'si
     olmayan kayıtlar düzenlenmeye devam edilebiliyor — zorunluluk sadece
     yeni kayıt oluştururken geçerli.
   - Detay modali ve Excel export'u güncellendi (yeni "SOAR'da Case
     Bulunamadı" kolonu).
   - Uçtan uca doğrulandı: gerçek case ID'li ve "case yok" (manuel)
     senaryolarının ikisi de test edilip temizlendi.

### Faz E — Eski Şemalı DB'nin Güvenli Geçişi (2026-07-19)

Kullanıcının canlı ortamda çalışan, eski şemalı bir DB'si var — güncellemenin
veri kaybetmeden yeni şemaya geçmesi gerekiyordu. Gerçek DB'ye hiç
dokunmadan, izole bir temp dizinde eski-şema bir SQLite kopyası oluşturup
(`users`/`tune_requests`/`usecase_requests`/`threat_hunt_requests`/
`audit_log` — Faz 1 öncesi minimal kolon seti, gerçekçi örnek veriyle) gerçek
`init_db()` migrasyonunu buna karşı çalıştırarak doğrulandı.

- [x] **Kritik bulgu — çöküyordu:** `threat_hunt_requests` tablosuna zaman
  içinde eklenen 12 kolon (`scope`, `scope_image`, `mitre_techniques`,
  `findings`, `findings_image`, `detection_suggestion`, `detection_detail`,
  `recommendations`, `recommendations_image`, `hunt_result`, `started_at`,
  `report_updated_at`) sadece sıfırdan-kurulum şemasına (`CREATE TABLE IF NOT
  EXISTS`) eklenmişti — mevcut/eski bir tabloyu yükseltecek `ALTER TABLE`
  migrasyonu hiç yazılmamıştı. `init_db()`, `hunt_result` kolonunu
  içermeyen bir tabloya karşı çalışınca `sqlite3.OperationalError: no such
  column: hunt_result` ile çöküyordu — uygulama eski bir DB ile **hiç
  açılamıyordu**. Bu 12 kolon idempotent migrasyon listesine eklendi.
- [x] **İkinci bulgu — yedekleme sırası ters:** `init_db()` (riskli
  migrasyon adımı) `_backup_if_due()`'dan ÖNCE çalışıyordu; üstelik
  `_backup_if_due()` son 5 gün içinde bir yedek varsa hiç yedek almadan
  atlıyor — tam olarak migrasyonun ilk kez çalıştığı, riskin en yüksek
  olduğu anda "yakında zaten yedek var" diye yeni bir yedek alınmayabiliyordu.
  Yeni `_backup_before_migration()` eklendi — maliyeti düşük olduğu için
  (dosya kopyası) her başlangıçta koşulsuz çalışır, `init_db()`'den önce.
- [x] **Doğrulandı:** düzeltmeler sonrası aynı izole test tekrar çalıştırıldı
  — migrasyon hatasız tamamlandı, orijinal tüm satırlar (id, tüm sütun
  değerleri) birebir korundu, sadece yeni kolonlar makul varsayılanlarla
  eklendi. Beklenen tek fark: `init_db()`'nin zaten yaptığı `settings`
  kullanıcı seed'i (eğer yoksa) — veri kaybı değil, kasıtlı ekleme.
- [ ] Bu test sentetik/izole bir kopyaydı — gerçek canlı DB'nin bir
  kopyasıyla aynı testin tekrarlanması hâlâ değerli olur (bkz. Faz 0,
  hâlâ beklemede — kullanıcı SSH oturumunu şimdilik istemedi).

### Hunt Raporu Modalı Geliştirmeleri (2026-06-11)
- [x] Öneriler / bulgular için liste yapısı (recommendations/vuln lists)
- [x] Hunt bulgusundan otomatik Use-Case talebi oluşturma (`source_hunt_id` bağlantısı)
- [x] Görsel yapıştırma (paste) desteği
- [x] Tune & UC detay modallarında onaylayan kullanıcı + onay tarihi gösterimi (önceki bilinen eksik giderildi)
- [x] `fmtDate` düzeltmesi — `esc()` çift encode sorunu giderildi
- [x] Hunt raporu modalı: dış tıklamayla kapanmıyor, sadece X butonu kapatıyor (yanlışlıkla veri kaybını önlemek için)
- [x] UC form reset null-safe hale getirildi (sessiz TypeError önlendi)

### UX Kalite İyileştirmeleri (2026-06-11)
- [x] Animasyon ve geçiş iyileştirmeleri
- [x] Scroll performansı optimizasyonu

## 🔧 Bilinen Sorunlar / Bekleyen İşler

- [x] ~~Yedekleme dayanıklılığı~~ — Faz 1'de koddan giderildi (host bind-mount + scheduler); **canlıda henüz doğrulanmadı**
- [x] ~~Audit log tamper-evidence~~ — Faz 2'de hash-zincirleme ile giderildi (koddan doğrulandı); **canlıda (Ubuntu/Gunicorn) henüz doğrulanmadı**
- [x] ~~Rol yapısı genişletilecek~~ — Faz 3'te `tier` alanı (Müdür/Kıdemli Analist/Analist) eklendi (koddan doğrulandı); onay uçlarını fiilen buna bağlamak **Faz 4/5**'te
- [x] ~~Tuning & UC otomatik prod geçişi~~ — Faz 4'te ön onay + Q&A'lı son onay ile giderildi (koddan doğrulandı); **canlıda henüz doğrulanmadı**
- [x] ~~Threat Hunt ön onay yok~~ — Faz 5'te tuning/UC ile aynı iki kapılı desen eklendi (koddan doğrulandı); **canlıda henüz doğrulanmadı**
- [x] ~~Threat Hunt PDF export yok~~ — Faz 6'da eklendi (koddan/şablondan doğrulandı); **gerçek PDF üretimi Ubuntu'da henüz doğrulanmadı** (Windows'ta WeasyPrint native kütüphaneleri yok)
- [x] ~~XSOAR entegrasyonu yok~~ — Faz 7'de Tuning için webhook eklendi (doğrulandı); UC/Hunt'a genişletme ileride; **canlıda / gerçek XSOAR isteğiyle henüz doğrulanmadı**

> Not: 2026-07-19'da konuşulan 8 fazlı (Faz 0-7) güvenilirlik/hesap verebilirlik yol haritası onaylandı —
> plan dosyası: `C:\Users\Oguzhan\.claude\plans\cheerful-puzzling-pumpkin.md`. **Faz 1-7'nin kod tarafı
> tamamlandı ve her biri ayrı commit olarak yerelde (preview + doğrudan API testleriyle) doğrulandı.**
> Sadece **Faz 0** (SSH erişimi gerektiren canlı sunucu doğrulaması — docker volume rm testi, gerçek
> restore denemesi, Gunicorn çoklu worker davranışı, gerçek WeasyPrint PDF üretimi, gerçek bir XSOAR
> isteği) kullanıcıyla birlikte deploy günü yapılmak üzere bekliyor. Bu, yol haritasındaki son adım.

---

## 📌 Commit Geçmişi (Son 5)

| Hash | Açıklama |
|------|----------|
| f9a9d9d | feat: UX quality improvements — animations, transitions, scroll performance |
| d998975 | fix: remove hunt-report-modal from global overlay-click-close listener |
| 0a7369f | fix: disable outside-click close on hunt report modal — only X button closes it |
| bf19053 | fix: null-safe UC form reset in openHuntReportModal to prevent silent TypeError |
| c63f0e7 | fix: fmtDate returns plain dash instead of HTML to prevent esc() double-encoding in detailRow |
