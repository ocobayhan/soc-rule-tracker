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

### Faz F — Kullanıcı Yönetimi Genişletmesi (2026-07-19)

Kullanıcı zaten var olan rol/onay-seviyesi yönetimini test edip onayladıktan
sonra (muhtemelen ilk kez admin olarak Ayarlar'a erişebildiği için yeni
keşfetti — bkz. Faz D'deki RBAC düzeltmesi), 4 ek özellik istendi ve hepsi
eklendi:

- [x] **Son giriş tarihi:** `users.last_login` kolonu; `/login` başarılı
  girişte bunu günceller. Kullanıcı listesinde "Son giriş: ..." veya "Hiç
  giriş yapmadı" olarak gösteriliyor. **Kapsam kararı:** sadece login
  anında set edilir/okunur — role/tier'ın zaten yaptığı gibi (session'a
  login'de bir kere yazılır, istek başına DB'den tekrar okunmaz), oturum
  ortasında canlı geçersiz kılma yapılmıyor; bu tutarlı ama daha küçük bir
  garanti — istenirse ayrı bir iş olarak genişletilebilir.
- [x] **Hesap devre dışı bırakma (silme yerine):** `users.active`
  ('Evet'/'Hayır', varsayılan 'Evet'). `/login` artık `active='Hayır'` olan
  hesapları reddediyor ("Bu hesap devre dışı bırakılmış..."). Kullanıcı
  listesinde ⏸/▶ ile tek tıkla aç/kapa; devre dışı kullanıcı satırı soluk
  gösteriliyor + "Devre Dışı" rozeti. Kalıcı silme seçeneği de duruyor
  (ayrı, ek bir yetenek olarak eklendi, yerini almadı).
- [x] **Rol/Onay Seviyesi açıklama metni:** Kullanıcılar panelinin altına,
  admin'in rolün ne yaptığını ve onay seviyesinin neyi kontrol ettiğini
  (rolden bağımsız olarak) özetleyen kısa bir paragraf eklendi.
- [x] **Kendi kendini kilitleme koruması** — üç ayrı uç noktada:
  - `PUT /api/users/<id>`: kendi admin rolünü kaldırma → 400
  - `PUT /api/users/<id>`: kendi hesabını devre dışı bırakma → 400
  - `DELETE /api/users/<id>`: kendi hesabını silme → 400 (**yan bulgu:**
    bu kontrol daha önce hiç yoktu — bir admin kazayla kendi hesabını
    kalıcı olarak silebilirdi, rol düşürmeden bile daha geri dönüşsüz bir
    risk)
  - Frontend: kendi satırında devre dışı bırak/sil butonları devre dışı +
    açıklayıcı tooltip; düzenle modalinde kendi rolü alanı kilitli + uyarı notu.
- [x] **Uçtan uca doğrulandı:** create/edit/tier-değiştirme, devre dışı
  bırakılan hesabın login'de reddedilmesi, üç kendi-kendini-kilitleme
  korumasının hepsi, ve gerçek bir login sonrası `last_login`'in
  set edildiği — hepsi test edilip test verileri temizlendi.
  Test sırasında oturumun yanlışlıkla bir test kullanıcısına geçmesi
  DB'yi etkilemedi (sadece tarayıcı session cookie'si) — doğrudan
  sqlite3 ile temizlenip `/logout` ile sıfırlandı; tüm tablo satır
  sayıları test öncesiyle birebir aynı doğrulandı.

### Faz G — Detay Modalinde Rozet Metninin Harf Harf Bölünmesi (2026-07-19)

Kullanıcı ekran görüntüsüyle bildirdi: Hunt detay kutucuğunda "Rapor
Durumu" değeri ("Taslak") her harfi ayrı satıra düşecek şekilde dikey
akıyordu (T/a/s/l/a/k). Kök neden bulundu: `.status-dot` sınıfı **7x7px
sabit genişlikli, dekoratif bir nokta** için tasarlanmış (bkz.
`static/styles.css`) — metin içermesi hiç düşünülmemiş. Ama
`static/app.js`'te 6 yerde (Hunt detayında Rapor Durumu, Sonuç, Bağlı
Use-Case, Bulgu rozetleri; UC listesinde "Hunt #N" rozeti) bu sınıf
yanlışlıkla gerçek metin badge'i gibi kullanılmıştı — doğrusu `.badge`
sınıfıydı (`inline-flex`, düzgün padding, `white-space:nowrap`).

Bu yanlış kullanım önceden de vardı ama görünürde daha az zararlıydı
(metin sadece 7px'lik kutunun dışına taşıp görünür kalıyordu). Faz D'de
`.detail-value`'ya eklediğim `overflow-wrap/word-break:break-word` bu
alt öğelere **miras yoluyla** geçince, 7px'lik kutu içindeki metin artık
her karakterde satır değiştirmeye zorlandı — iki ayrı, kendi başına
zararsız değişikliğin kesişimi asıl hatayı ortaya çıkardı.

- [x] 6 yerin tamamı `status-dot` → `badge` olarak düzeltildi
  (`dot()`/`badge()` yardımcı fonksiyonları zaten doğru ayrılmıştı —
  sorun sadece bu 6 elle yazılmış HTML parçasındaydı, ana tablolardaki
  `dot()`/`badge()` kullanımları hiç etkilenmemişti).
- [x] **Yan bulgu:** `HUNT_RESULT_CLS`'in "Yetersiz Veri" için eşlediği
  `status-nottuned` sınıfı CSS'te hiç tanımlı değildi (stilsiz/renksiz
  kalıyordu) — amber renkte eklendi.
- [x] **Doğrulandı:** gerçek bir Hunt kaydı üzerinde (`report_status:
  "Taslak"`, `hunt_result: "Tehdit Tespit Edildi"`) rozet genişlik/
  yükseklik ölçümüyle (49x20px, 113x20px — tek satır, orantılı) ve
  ekran görüntüsüyle; UC listesindeki "Hunt #1" rozeti de (46x17px)
  ayrıca doğrulandı. Tune ve UC detay modalleri de (2 kolonlu
  `.detail-grid` düzeni) ekran görüntüsüyle kontrol edildi — başka bir
  görsel bozukluk bulunmadı.

### Faz H — Ad Soyad, Kişi Bazlı İstatistikler, XSOAR Talep Eden (2026-07-19/20)

Kullanıcı kararları: XSOAR eşleşmezse istek reddedilmez, genel etikete
düşülür; istatistikler hem Excel'e hem canlı bir panele eklensin.

- [x] **`users.full_name`** (opsiyonel) — DB'de eşleştirme/webhook/audit
  hep **kullanıcı adı** üzerinden çalışmaya devam ediyor, bu sadece
  gösterim katmanı. `static/app.js`'te `displayName(username)` helper'ı
  `/api/analysts`'tan (artık `full_name` de dönüyor, herkese açık —
  `/api/users` settings/admin'e özel kaldığı için buna dokunulmadı)
  gelen eşlemeyi kullanır, yoksa kullanıcı adına düşer.
  - Uygulandığı yerler: Tune/UC/Hunt ana tabloları, dashboard mini-
    tabloları, üç detay modalinin tüm kişi alanları (raporlayan, analist,
    ön onay veren, son onaylayan vb.), analist seçim dropdown'ları
    (`value` kullanıcı adı, görünen metin Ad Soyad), sidebar'daki oturum
    sahibi ismi.
  - **Bilinçli dokunulmayan yer:** Audit Log'daki `username` kolonu —
    bu adli/kanıt niteliğinde bir iz, ham sistem kimliğinin (kullanıcı
    adı) görünmesi burada daha doğru.
  - Ayarlar > Kullanıcılar formuna (ekle + düzenle) "Ad Soyad" alanı
    eklendi, opsiyonel.
- [x] **XSOAR webhook'ta `requested_by`** (opsiyonel) — gönderilen
  kullanıcı adı tracker'da varsa `reporter` o kişi olur; yoksa (kullanıcı
  seçimi gereği) istek yine kabul edilir, genel `"XSOAR Entegrasyonu"`
  etiketine düşülür. Bkz. `docs/xsoar_integration.md`.
- [x] **Kişi bazlı istatistikler** — `get_user_activity_stats()` tek bir
  yerden hem `/api/stats/users` (admin/settings, canlı panel) hem Excel
  "Kullanıcı Aktivitesi" sayfasını besliyor (Faz B'nin dersi: tek
  kaynak, iki yerde asla sapmaz). Kullanıcı başına: Tune/UC ayrı ayrı
  girdiği, bitirdiği (terminal durum: Tune Başarılı/Edilmedi,
  Prod'da Aktif/Yazılamaz), ön onayladığı (`validated_by`), son
  onayladığı (`approved_by` / `test_approved_by`) sayıları. **Tüm
  zamanların toplamı** — ay filtresinden bağımsız (KPI Özeti'nin aksine),
  çünkü "kaç talep girmiş" sorusu doğası gereği kariyer toplamı.
  - Ayarlar sayfasına canlı bir panel eklendi (kullanıcı seçtiği ikinci
    yer — Excel'e ek olarak).
- [x] **Uçtan uca doğrulandı:** `displayName()` üç ana tabloda, üç detay
  modalinde, dropdown'larda ve sidebar'da test edildi; XSOAR webhook'u
  hem eşleşen hem eşleşmeyen `requested_by` ile denendi (ikisi de 201,
  ikincisi genel etikete düştü); kişi bazlı istatistik sayıları hem
  canlı panelde hem indirilen Excel'de birebir aynı çıktı; toplamların
  (XSOAR genel etiketli kayıtlar hariç) gerçek toplam kayıt sayısına
  eşit olduğu doğrulandı. Test için oluşturulan geçici hesap ve test
  amaçlı atanan Ad Soyad değerleri temizlendi, tüm tablo satır sayıları
  test öncesiyle uyumlu.

### Faz I — "Hunt'tan Use-Case Oluştur" Formundaki Serbest Alanlar (2026-07-20)

Hunt Raporu modalindeki "Bu Hunt için Use-Case oluştur" mini-formu, uygulamanın
geri kalanıyla tutarsız iki serbest alan içeriyordu:

- [x] **Talep Eden** serbest metin (`<input placeholder="Analist adı…">`) idi
  — herhangi bir isim elle yazılabiliyordu, mevcut analist listesiyle hiçbir
  ilişkisi yoktu. Diğer tüm "talep eden/raporlayan" alanlarıyla aynı desene
  (`<select>` + `analystOpts()`) çevrildi; boş bırakılırsa (backend zaten
  destekliyordu) Hunt'ın kendi talep edeni kullanılıyor.
- [x] **Ortam** bir `<select>` idi ama seçenekleri **sabit kodlanmış**
  "Dev/Test/Prod" idi — gerçek Ortamlar listesiyle (Settings > Ortamlar)
  hiç ilgisi yoktu, hem de tek seçimlikti. Diğer UC ortam alanlarıyla aynı
  çoklu-etiket desenine (`_ucCreateFromHuntEnv` + seç/Ekle/etiket listesi)
  çevrildi; form açıldığında Hunt'ın kendi ortam etiketleriyle önceden
  dolduruluyor, analist isterse etiketleri kaldırıp gerçek ortamlar
  listesinden başka(larını) ekleyebiliyor.
- [x] **Yan bulgu:** UC otomatik oluşturulduktan sonra çağrılan
  `loadUseCase()` fonksiyonu hiç tanımlı değildi (doğrusu `loadUC()`) —
  her seferinde konsola sessiz bir hata düşüyor, Use-Case tablosu yeni
  oluşan kaydı göstermek için sayfa yenilenene kadar bekliyordu. Düzeltildi.
- [x] **Doğrulandı:** gerçek bir Hunt kaydı üzerinde (detection_suggestion
  Evet yapılıp) form açıldı — Talep Eden alanı gerçek analist listesini,
  Ortam alanı gerçek ortam listesini gösterdi; Hunt'ın kendi ortamıyla
  ön-dolu geldi; ikinci bir gerçek ortam eklenip (`_TMP_TEST_ENV2`, sonradan
  silindi) kaydedildi, oluşan Use-Case kaydında hem talep eden hem ortam
  doğru şekilde göründü. Test kayıtları (UC, geçici ortam, hunt'ın test
  amaçlı değiştirilen alanları) temizlendi.

### Faz J — SOC-CMM Hunt Programı Metrikleri (2026-07-20)

Kullanıcı SOC-CMM'in standart Threat Hunting metrik listesini paylaştı, hangi
metriklerin zaten çıkarılabildiğini/hangilerinin eksik olduğunu sorup üç
"kısmen" işaretlenen metrik için kendi yorumunu netleştirdi:
- **% Time spent on threat hunting** — dışarıda ayrı şekilde kıyaslanacak,
  sistem sadece hunt'a harcanan toplam süreyi tutsun yeterli (zaten
  `hunt_duration_hours` ile tutuluyordu — yeni olan, bunun toplamının
  raporlara çıkması).
- **% Planned vs. executed hunts** — kullanıcının tanımı: onaylanan
  (ön onaydan geçen) hunt talepleri "planlanmış" sayılsın.
- **# Newly created detections** — Hunt'tan önerilen bir Use-Case, gerçekten
  bir kurala (Prod'da Aktif) dönüşürse bu "hunt'tan doğan detection" sayılsın.

Bu üç tanımı doğrudan uygulayan `get_hunt_program_stats()` eklendi — Excel
"KPI Özeti" sayfası ve görsel Rapor arasında paylaşılan tek kaynak (yine
Faz B dersi):
- [x] **Planlanan/Gerçekleştirilen Hunt Oranı** — planlanan = durumu
  `Ön Onay Bekliyor`/`Reddedildi` dışında olan tüm hunt talepleri (ön
  onaydan geçmiş); gerçekleştirilen = `Tamamlandı`'ya ulaşanlar.
- [x] **Hunt'tan Kurala Dönüşüm Oranı** — `detection_suggestion='Evet'`
  olan hunt sayısı (öneri verildi) vs. bağlı Use-Case'i `Prod'da Aktif`'e
  ulaşan hunt sayısı (`source_hunt_id` join'i üzerinden) — gerçekten
  kurala dönüşen oran.
- [x] **Toplam Hunt Süresi** — `Tamamlandı` durumundaki hunt'ların
  `hunt_duration_hours` toplamı; kullanıcı bunu kendi "toplam analist
  saati" kıyaslamasında dışarıda kullanacak.
- **Ay filtresi kararı:** ilk ikisi bilinçli olarak tüm zamanların
  toplamı (programın bugüne kadarki etkinliği sorusu, aylık akış değil,
  Kullanıcı Aktivitesi sayfasıyla aynı gerekçe); sadece toplam hunt
  süresi ay filtresine duyarlı.
- [x] **Doğrulandı:** gerçek veri üzerinde elle hesaplanan beklenen
  değerlerle (5 planlanan/4 gerçekleştirilen=%80, 2 öneri/1 dönüşüm=%50,
  11 saat toplam) hem `/report` sayfası hem indirilen Excel'in "KPI
  Özeti" sayfası birebir aynı sonucu verdi.
- [ ] **Kapsam dışı bırakılan (kullanıcıya bildirildi, henüz istenmedi):**
  "% Percentage of assets covered" (varlık envanteri/CMDB gerektirir,
  sistemde hiç yok) — bu, gerçek bir yeni özellik gerektirir.

### Faz K — DB/Upload'lar da Named Volume'den Bind-Mount'a (2026-07-20)

Kullanıcı canlıdaki **gerçek kurumsal verinin** (test/dummy veri değil)
kesinlikle kaybolmaması gerektiğini vurguladı. Bu vesileyle `docker-
compose.yml` yeniden gözden geçirildi ve Faz 1'den kalma bilinen bir risk
bulundu: yedekler zaten host bind-mount'taydı ama **DB'nin kendisi hâlâ
`soc_data` adlı bir Docker named volume'ündeydi** — yani `docker volume rm
soc_data` veya `docker-compose down -v` hâlâ canlı DB'yi (sadece yedeğini
değil) doğrudan silebiliyordu. Bu, `docs/PROGRESS.md`'de zaten "bilinen
risk, kalıcılık sertleştirmesi planlanıyor" olarak not edilmişti (Faz 1),
ama hiç kapatılmamıştı.

- [x] `docker-compose.yml`: `soc_data`/`soc_uploads` named volume'leri
  kaldırıldı, DB (`./data`) ve upload'lar (`./uploads`) da yedekler gibi
  host bind-mount oldu — üçü de birbirinden **ayrı** host dizinlerinde
  (yedekler DB'nin dizininin altında değil, kardeş bir dizinde — host
  üzerinde yanlışlıkla `rm -rf ./data` çalıştırılsa bile yedekler etkilenmez).
- [x] `.gitignore`'a `uploads/` eklendi — yeni host dizini `static/uploads/`
  deseniyle eşleşmiyordu, gerçek yüklenmiş görseller yanlışlıkla commit'e
  girebilirdi.
- [x] `docs/BACKUP_RESTORE.md` tamamen yeniden yazıldı: normal restore artık
  Docker volume gymnastics'i gerektirmiyor (düz dosya kopyalama); **eski
  (named volume) kurulumdan yeni (bind-mount) kuruluma geçiş** için ayrı,
  adım adım bir prosedür eklendi — özellikle "önce eski volume'deki gerçek
  veriyi yeni host dizinine kopyala, SONRA yeni compose dosyasını devreye
  al" sırası vurgulandı, çünkü bu sıra atlanırsa yeni kurulum boş bir
  `./data` ile başlar ve gerçek veri (hâlâ eski volume'de duruyor olsa da)
  uygulamada görünmez hale gelir.
- [ ] **Doğrulanmadı — canlıda henüz denenmedi.** Kullanıcının gerçek
  sunucusu muhtemelen hâlâ eski (`soc_data` named volume'lü) kurulumla
  çalışıyor; bu geçiş kullanıcıyla birlikte, `docs/BACKUP_RESTORE.md`'deki
  prosedür izlenerek yapılmalı — SSH oturumu kullanıcı ne zaman isterse.

### Faz L — Settings Override'larının Audit Detayına Ayrıntılı Yazılması (2026-07-20)

Kullanıcı, audit hash-zincirinin sadece "audit log'un kendisi değiştirilmedi"
diye kanıtladığını, asıl veri satırlarının imzalanmadığını netleştirdiğim
konuşmadan sonra, en azından **settings rolünün bilinçli ID/tarih
override'larının** ayrıntılı loglanmasını istedi ("değişilen kısmın
ayrıntısını verebiliriz").

- [x] Tune/UC/Hunt'ın üçünün de `update_*` route'larında aynı desen:
  override gerçekleşirse (`role=='settings'` VE ID veya tarihlerden biri
  gerçekten değiştiyse) `write_audit()`'e giden `detail`'e
  `"MANUEL DÜZENLEME (settings): ID: eski→yeni; Oluşturulma Tarihi:
  eski→yeni; ..."` şeklinde bir ek yapılıyor. Override yoksa (normal
  günlük düzenlemeler) `detail` eskisi gibi temiz kalıyor — sadece gerçek
  override'lar bu ek metni alıyor.
  - Tune: ID, Oluşturulma Tarihi, Tamamlanma Tarihi
  - UC: ID, Oluşturulma Tarihi, Tamamlanma Tarihi
  - Hunt: ID, Oluşturulma Tarihi, Başlangıç Tarihi, Tamamlanma Tarihi,
    Rapor Güncelleme Tarihi
- [x] `docs/audit_logging.md`'ye bu desen belgelendi (yeni bir route'a
  override eklerken izlenecek örnekle birlikte).
- [x] **Uçtan uca doğrulandı:** geçici bir `settings` rolü test hesabıyla
  üçünde de gerçek bir ID+tarih override'ı yapılıp geri alındı (round-trip);
  audit log'da hem override hem geri alma kaydının eski→yeni değerleri
  doğru gösterdiği teyit edildi; hash zinciri yeni `detail` formatıyla
  hâlâ geçerli (`verify_audit.py` ile); normal (override içermeyen) bir
  düzenlemenin `detail`'inin hiç ek metin almadığı ayrıca doğrulandı; tüm
  kayıtların ID'leri test sonrası orijinal haline döndüğü, tablo satır
  sayılarının değişmediği kontrol edildi. Test hesabı ve script'leri
  temizlendi.

### Faz M — Versiyonlama, Hunt İkon Çakışması, Audit Log Filtreleme (2026-07-20)

- [x] **Versiyonlama:** `APP_VERSION = "0.1.0"` (`app.py`), Flask
  `context_processor` ile her template'e otomatik geçiyor. Görünür olduğu
  yerler: sidebar alt köşesi, login sayfası, aylık rapor'un altbilgisi,
  Excel'in "KPI Özeti" sayfası. `docs/VERSIONING.md` yazıldı — SemVer
  mantığı (PATCH: küçük düzeltme, MINOR: yeni özellik/ara versiyon, MAJOR:
  köklü değişiklik) ve bunun `static/app.js`/`styles.css`'teki `?v=NN`
  önbellek-temizleme sayaçlarıyla **karıştırılmaması gerektiği** açıklandı
  — ikisi tamamen bağımsız.
- [x] **Hunt ikon çakışması:** "Rapor Yaz/Düzenle" (İnceleniyor durumunda)
  ve "PDF İndir" (Tamamlandı durumunda) butonları **aynı** ikonu (`&#128196;`
  📄) kullanıyordu, sadece renkleri farklıydı — kullanıcı haklı olarak
  bunları ayırt edemediğini belirtti. "Rapor Yaz/Düzenle" artık 📝
  (`&#128221;`), "PDF İndir" artık ⬇ (`&#8681;`) — görsel olarak da,
  `title`/erişilebilir isim olarak da net bir şekilde ayrışıyor.
- [x] **Audit Log filtreleme:** Aktivite türü (8 kategori: Oluşturma,
  Üstlenme/Başlatma, Ön Onay, Son Onay, İş Tamamlama, Düzenleme, Silme,
  Sistem/Dışa Aktarım — sınıflandırma kullanıcının isteğiyle bana
  bırakıldı) ve kullanıcı adına göre filtre eklendi. Backend `/api/audit`
  mevcut Tune/UC/Hunt filtreleme deseniyle (query param) tutarlı;
  kategori→action listesi `app.py`'deki `AUDIT_CATEGORIES`'te tanımlı.
  Kullanıcı dropdown'u audit log'daki **gerçek** (o an registered olan
  değil, geçmişte işlem yapmış — silinen hesaplar dahil) kullanıcı
  adlarından türetiliyor; `write_audit()`'in oturumsuz istekler (XSOAR
  webhook gibi) için düştüğü `"?"` değeri dropdown'da "Sistem (oturumsuz
  — ör. XSOAR webhook)" olarak anlaşılır gösteriliyor. Kullanıcı adı
  sütunu artık Ad Soyad gösteriyor (ham kullanıcı adı `title` tooltip'inde)
  — Faz H'de "audit log'a dokunma" kararını burada bilinçli olarak
  gözden geçirdim: filtrelemenin asıl amacı "hangi analist ne yapmış"
  olduğu için burada okunabilirlik daha öncelikli.
- [x] **Uçtan uca doğrulandı:** hem API üzerinden (kategori/kullanıcı
  filtreleri, geçersiz kategori değerinin filtresiz listeye düşmesi,
  kombine filtre) hem gerçek tarayıcıda (Claude in Chrome ile) görsel
  olarak — "Silme" kategorisi seçilince sadece silme aksiyonlarının
  göründüğü, dropdown etiketlerinin doğru olduğu, ikonların artık farklı
  olduğu ve versiyon numarasının sidebar'da göründüğü teyit edildi.

### Faz N — XSOAR Case URL Şablonu, Audit Log İndirme + Genişletilebilir Kolonlar (2026-07-20)

- [x] **SOAR Case URL şablonu:** Ayarlar > XSOAR Entegrasyonu'na yeni bir
  alan eklendi — kullanıcı bir kez `https://xsoar-soc.diasteknoloji.com/
  Custom/caseinfoid/[CASENO]` gibi bir şablon tanımlıyor, sonrasında Tuning
  talebi açarken/düzenlerken **case URL'i elle kopyalamak yerine sadece
  case numarası** yeterli oluyor. Genel amaçlı `app_settings` (key/value)
  tablosu + `get_app_setting`/`set_app_setting` yardımcıları eklendi —
  ilk gerçek kullanım alanı bu, ama ileride başka tekil ayarlar için de
  kullanılabilir. `build_xsoar_url(case_id)`, şablondaki `[CASENO]`'yu
  URL-encode edilmiş case numarasıyla değiştiriyor; `PUT /api/settings/
  xsoar-url-template` yer tutucusu doğruluyor (yoksa `400`).
  Otomatik URL oluşturma üç noktaya eklendi — **elle girilen bir URL her
  zaman önceliklidir**, sadece boş bırakılıp case "SOAR'da bulunamadı"
  olarak işaretlenmemişse devreye giriyor: manuel Tuning oluşturma
  (`POST /api/tune`), manuel Tuning düzenleme (`PUT /api/tune/<id>`), XSOAR
  webhook'u (`POST /api/integrations/xsoar/tune`). Bkz.
  `docs/xsoar_integration.md`.
- [x] **Audit Log Excel indirme:** `GET /api/audit/export` — o an ekranda
  seçili kategori/kullanıcı filtresini aynen uyguluyor (`_audit_filter_where`
  yardımcı fonksiyonu `/api/audit` ile paylaşılıyor, filtre mantığı iki
  yerde asla sapmıyor — Faz B'nin dersi burada da geçerli). İndirme kendi
  `EXPORT_AUDIT_LOG` aksiyonuyla audit log'a yazılıyor (kim, ne zaman, hangi
  filtreyle indirdi — sertifikasyon kanıtı için önemli, "kim baktı"
  izlenebilir).
- [x] **Audit Log kolonları genişletilip daraltılabiliyor:** tablo
  `table-fixed` + 6 kolonluk `<colgroup>`'a çevrildi, Tune/UC/Hunt
  tablolarında zaten var olan `makeColumnsResizable()` mekanizması hiç
  değiştirilmeden otomatik uygulanıyor (sayfa başlangıcında tüm
  `.table-fixed` tablolara jenerik uygulanıyor zaten).
- [x] **Gerçek bug yakalandı ve düzeltildi:** `_audit_filter_where`
  yardımcı fonksiyonunu ayrı bir fonksiyona çıkarırken (refactor sırasında)
  `@app.route("/api/audit")` + `@login_required` dekoratörleri yanlışlıkla
  `_audit_filter_where`'in üzerine yapışmış kalmıştı, asıl route handler'ı
  olması gereken `get_audit()` hiç dekoratörsüz/route'suz kalmıştı. Sonuç:
  Flask, parametresiz çağrılan `_audit_filter_where()`'i view function
  olarak çalıştırıyor, `category`/`username` argümanları eksik olduğu için
  her istekte `500` dönüyordu — audit log sayfası hiç yüklenmiyordu.
  Gerçek tarayıcıda (Claude in Chrome) test ederken tabloda hiç satır
  görünmemesi + konsolda "Sunucu hatası" üzerine Flask loglarından kök
  nedeni bulundu; dekoratörler doğru fonksiyona (`get_audit`) taşındı.
- [x] **Uçtan uca doğrulandı** (geçici debug admin hesabıyla, hem doğrudan
  `requests` script'leriyle hem gerçek tarayıcıda): şablon kaydet/yükle/
  geçersiz-değer reddi; case ID + boş URL ile oluşturma → otomatik URL;
  elle girilen URL'in **geçersiz kılınmadığı**; "case bulunamadı"
  işaretlenince otomatik URL **oluşturulmadığı**; düzenlemede case ID
  değişince URL'in yeniden üretildiği; XSOAR webhook'unun aynı şablona
  düştüğü; Excel indirmenin kategori/kullanıcı filtresine göre farklı
  satır sayısı döndürdüğü (içerik açılıp doğrulandı); indirme sonrası
  audit zincirinin (`verify_audit.py`) hâlâ geçerli olduğu; kolon
  resize handle'larının doğru sütunlara (ilk/son hariç) eklendiği.
  Test için oluşturulan geçici Tuning kayıtları ve debug admin hesabı
  temizlendi, Dashboard'daki toplam talep sayısının teste başlamadan
  önceki değere (9) döndüğü doğrulandı.

### Faz O — Tekil SOAR Case Kuralı + Case URL Kopyala Butonu (2026-07-20)

- [x] **Aynı SOAR case ID altında mükerrer tuning engeli:** Yanlışlıkla
  aynı case için ikinci bir tuning talebi açılmasın diye, üç giriş
  noktasında da (`create_tune`, `update_tune`, XSOAR webhook
  `xsoar_create_tune`) `xsoar_case_id` çakışması kontrol ediliyor —
  çakışma varsa `409` + mevcut talebin ID'si dönüyor. **Karar:**
  reddedilmiş (`Reddedildi`) talepler kontrol dışı — reddedilen bir case
  bilinçli olarak yeniden açılabilir; sadece aktif bir talep engelliyor.
  Düzenlemede kaydın kendisi hariç tutuluyor (self-collision yok). Webhook
  yanıtında `existing_id` + `duplicate:true` dönüyor ki XSOAR playbook'u
  "zaten var, sorun değil" olarak ele alabilsin (retry/çift-ateşleme
  koruması). Mevcut veri **grandfather** ediliyor: kural sadece yeni
  create/edit'lerde uygulanıyor, DB'ye UNIQUE kısıtı eklenmedi (eski veride
  çift case varsa düzenlemeyi kilitlememek için — uygulama seviyesinde
  kontrol daha esnek).
- [x] **SOAR case URL'i için "Kopyala" butonu:** Kullanıcı, case linkine
  **tıklayınca** XSOAR giriş ekranına düştüğünü ama URL'i **kopyalayıp yeni
  sekmeye yapıştırınca** case'e sorunsuz gittiğini bildirdi. Kök neden:
  XSOAR'ın oturum çerezi `SameSite=Strict` — tarayıcı, başka bir siteden
  (SOC Tracker'dan) tıklanan cross-site bağlantılarda bu çerezi
  göndermiyor, ama adres çubuğuna yazılan/yapıştırılan URL'de gönderiyor.
  Bu XSOAR'ın çerez ayarı olduğu için bizim tarafımızdan düzeltilemez;
  bunun yerine çalışan kopyala-yapıştır akışını **tek tık** yaptık: tune
  detay modalinde case linkinin yanına 📋 Kopyala butonu eklendi
  (`copyFromAttr`, güvenli-olmayan http bağlamı için `execCommand`
  yedeğiyle). Bu, ürünün bir "bug"ı değil — tarayıcı güvenlik davranışı;
  gerçek çözüm istenirse XSOAR yöneticisinin çerez SameSite ayarını
  gevşetmesi gerekir (XSOAR'ın CSRF duruşunu zayıflatır, önerilmez).
- [x] **Uçtan uca doğrulandı** (geçici debug admin, requests script'leri +
  gerçek tarayıcı): 1. create → 201, aynı case ikinci create → 409;
  düzenlemeyle çakışma → 409, kendi case'ini koruyan düzenleme → 200;
  case reddedilince aynı case yeniden create → 201 (red istisnası çalışıyor);
  webhook mükerrer → 409 + `existing_id`, webhook yeni case → 201. Kopyala
  butonu doğru URL'i (`data-copy`) taşıyor, link `target=_blank`, JS
  hatası yok, modalde görünür. Test verileri (case 70001-70003) ve debug
  hesap temizlendi, tune sayısı teste başlamadan önceki değere (9) döndü,
  audit hash zinciri geçerli.

### Faz T — Hunt Raporu: Numaralı Bulgu Listesi, Sabit Görsel Sınırı, Montserrat Font (2026-08-16)

Kullanıcının Threat Hunt raporu için istediği 4 iyileştirme:

- [x] **"Bulgu Var Mı? Evet" satırı kaldırıldı:** PDF'te ve detay modalinde
  bu Q&A tarzı fazlalık satır yerine, bulgular artık "Bulgular" başlığının
  altında doğrudan yazılıyor — hiç bulgu yoksa "Bulgu saptanmadı." yazıyor.
- [x] **Bulgular artık numaralı bir liste, her maddenin kendi metni + kendi
  görseli var:** Yeni `findings_items` kolonu (JSON: `[{text, image}, ...]`).
  Formda "+ Ekle" her tıklamada yeni bir "N. Bulgu" kartı açıyor (MITRE
  teknik girişleriyle aynı `.mitre-entry` görseli), her kartın kendi
  metin kutusu + Ctrl+V ile yapıştırılan kendi görseli var. **Geriye dönük
  uyumluluk:** eski tekil `findings`/`findings_image` kolonları silinmedi —
  bu özellikten önce tamamlanmış raporlar hâlâ eski formatlarıyla doğru
  render oluyor (PDF şablonu `findings_items` boşsa eskiye düşüyor); formu
  ilk kez bu özellikle açan eski bir rapor, mevcut tek metnini/görselini
  otomatik olarak listenin ilk maddesine taşıyor (analist Kaydet'e basınca
  kalıcılaşıyor). `findings` kolonu artık madde metinlerinin birleşimiyle
  otomatik güncelleniyor — `/api/search` ve Excel export'un hiçbir kod
  değişikliği gerektirmeden çalışmaya devam etmesi için (tek kaynak orada
  hâlâ o kolon).
- [x] **Rapordaki tüm görseller için sabit, tutarlı bir üst sınır:**
  `max-width:420px; max-height:280px` (en-boy oranı bozulmadan,
  `object-fit:contain`) — kapsam/bulgu/detection/öneri görsellerinin
  hepsi aynı kuralı paylaşıyor. Bu bir ZORLAMA değil bir TAVAN: sınırın
  altındaki küçük görseller kendi doğal boyutunda kalıyor, büyük görseller
  en-boy oranını koruyarak bu kutuya sığacak şekilde küçülüyor — hiçbiri
  gerilmiyor/bozulmuyor (1600×1200 bir test görseliyle canlı doğrulandı,
  bkz. aşağıdaki doğrulama notu).
- [x] **Font: Montserrat.** Gotham istenmişti ama ücretli/lisanslı bir font
  (Hoefler&Co.) — internetten indirip gömmek telif ihlali olurdu, kullanıcı
  lisanslı dosya sağlayamayınca en yakın ücretsiz alternatif seçildi
  (kullanıcı onayıyla). Google Fonts'un resmi OFL deposundaki değişken
  fontundan (`fonttools varLib.instancer`) 4 statik ağırlık (400/500/600/700)
  üretilip `static/fonts/`'a kondu — SIL Open Font License (`static/fonts/
  OFL.txt`), ticari kullanım dahil serbest. WeasyPrint'in değişken font
  desteğindeki olası tutarsızlıkları baştan elemek için bilinçli olarak
  statik ağırlıklar tercih edildi. `@font-face` ile `file://` üzerinden
  gömülüyor (görsellerle aynı desen), DejaVu Sans/Arial yedek olarak kalıyor.
  Türkçe karakter kapsamı (ğşıöüçĞŞİÖÜÇ) doğrulandı.
- [x] **Kurum logosu (2026-08-16, takip):** Kullanıcı DiAS logosunu
  `static/logo_dias.jpg`'e koydu. `hunt_report_pdf()`'e `_font_uri` ile aynı
  `file://` URI deseniyle bir `logo_uri` context değişkeni eklendi (dosya
  yoksa `None` — şablon `{% if %}` ile atlıyor, hata vermiyor); header'da
  başlığın solunda 42px yükseklikte, en-boy oranı korunarak render ediliyor.
  PyMuPDF ile PDF sayfası PNG'ye çevrilip görsel olarak konumu/boyutu
  doğrulandı — mevcut header düzeniyle (başlık/durum rozeti/tarih) hizalı,
  taşma yok. Restart sırasında `WEASYPRINT_EXE`'nin göreli yol yerine mutlak
  yolla verilmesi gerektiği fark edildi (göreli yol bu ortamda
  `subprocess.run`'da `FileNotFoundError` veriyordu) — dev restart talimatı
  buna göre not edilmeli. Test hesabı temizlendi, audit zinciri geçerli
  (209 kayıt, 185 zincirli).
- [x] **Renk uyumu (2026-08-16, takip):** Kullanıcı logoyla birlikte mavi
  vurgu rengini (`--accent: #5E6AD2`) sevmedi — logonun arka planıyla
  (`#1A1A1A`, dosyadan piksel örneklenerek doğrulandı) uyumlu olması için
  `--accent` bu tona çevrildi. Bu tek değişken; bölüm başlıkları, header alt
  çizgisi ve ortam etiketleri (`.tag`) hepsi ondan besleniyor — tek yerden
  değişip her yerde tutarlı oldu. `.tag`'in eski maviye sabitlenmiş rgba
  arka planı da (`rgba(94,106,210,...)` → `rgba(26,26,26,...)`) ayrıca
  güncellendi (CSS değişkeni değil, elle yazılmış rgba olduğu için otomatik
  takip etmiyordu). PDF yeniden üretilip PNG'ye çevrilerek görsel doğrulandı,
  test hesabı temizlendi, audit zinciri geçerli (210 kayıt, 186 zincirli).
- [x] **Küçük düzeltme (2026-08-16):** "Onay Bilgileri" bölüm başlığındaki
  "(Hesap Verebilirlik)" eki kaldırıldı (kullanıcı isteğiyle) — PDF yeniden
  üretilip doğrulandı, audit zinciri geçerli (212 kayıt, 188 zincirli).
- [x] **Uçtan uca doğrulandı** (geçici debug admin, requests + PyMuPDF ile
  PDF sayfalarını PNG'ye render edip görsel inceleme): eski formatlı 4
  tamamlanmış hunt (id 1,4,6,7) hâlâ hatasız PDF üretiyor (geriye dönük
  uyumluluk kırılmadı); yeni 3 maddelik (2'si görselli) bir bulgu listesi
  oluşturulup Tamamlandı'ya kadar götürüldü, PDF'te "BULGULAR" başlığı
  altında "1. Bulgu/2. Bulgu/3. Bulgu" doğru numaralandırılmış, her görsel
  kendi maddesinin altında, Montserrat fontu ve Türkçe karakterler
  (ğşıöüçĞŞİÖÜÇ) doğru render oluyor (görsel olarak PNG'ye çevrilip
  incelendi); finding 1'in görseli 1600×1200 oversized bir görselle
  değiştirilip PDF'teki gerçek gömülü görsel boyutu ölçüldü — 420×280 üst
  sınırına en-boy oranı korunarak sığdığı, finding 2'nin küçük (300×200)
  görselinin ise doğal boyutunda kaldığı (büyütülmediği) doğrulandı.
  `/api/search` ve Excel export'un `findings` türetilmiş metniyle hâlâ
  çalıştığı doğrulandı. Tarayıcıda rapor formu açılıp mevcut 3 madde doğru
  yüklendiği (metin + görsel önizleme), "+ Ekle"nin yeni madde ekleyip
  odaklandığı, "×"in doğru maddeyi sildiği DOM durumu üzerinden teyit
  edildi, konsol hatasız. Test verileri (hunt, görseller, debug hesap)
  temizlendi, hunt sayısı 7'ye döndü, audit hash zinciri geçerli.

### Faz U — Ay Filtresi Düzeltmesi (2026-08-16)

- [x] **Gerçek bug, kullanıcı bildirimiyle bulundu:** "Temmuz'u filtreleyince
  hem o ay açılan hem o ay biten kayıtları görmem lazım" — kod okunarak
  doğrulandı: `list_tune()`, `list_usecase()`, `list_hunt()` (3 liste
  endpoint'i) ve Excel'in 3 satır-listeleme sorgusu (KPI Özeti sayfası hariç
  — o zaten her state için doğru tarih kolonunu kullanıyordu, ayrı ve önceden
  doğru bir tasarım) SADECE `created_at`'e bakıyordu — başka bir ayda açılıp
  seçili ayda tamamlanan kayıtlar filtreden düşüyordu.
- [x] **Fix:** 6 sorguda da filtre `(strftime('%Y-%m',created_at)=? OR
  strftime('%Y-%m',completed_at)=?)`'e çevrildi — UI'da hiçbir değişiklik
  gerekmedi, mevcut ay seçici aynı kaldı, sadece anlamı düzeldi.
- [x] **Uçtan uca doğrulandı:** Haziran'da açılıp Temmuz'da tamamlanan test
  kayıtları (Tune/UC/Hunt, üçü de) oluşturulup Haziran/Temmuz/Ağustos
  filtreleriyle sorgulandı — Haziran ve Temmuz'da doğru şekilde görünüp
  Ağustos'ta (ne açılma ne bitiş ayı) doğru şekilde görünmediği hem liste
  API'lerinde hem Excel'in 3 sayfasında teyit edildi. Test verileri
  temizlendi, baseline sayılar (tune 9, UC 4, hunt 7) korundu, audit zinciri
  bu testten etkilenmedi (ham SQL insert, write_audit çağrılmadı).

### Faz V — Tune/UC/Hunt: Case No Kolonu, Kolon Göster/Gizle, Kolona Göre Filtre (2026-08-16)

- [x] **Case No kolonu (Tune tablosu):** `xsoar_case_id` artık Kural İsmi'nden
  sonra ayrı bir kolon — düz metin (link değil; Faz O'daki SameSite=Strict
  gerekçesiyle, detay modalindeki 📋 Kopyala butonu zaten çözümü sağlıyor).
- [x] **Kolon göster/gizle (Tune+UC+Hunt, üçü de):** Her tabloya "☰ Kolonlar"
  butonu — açılan panelde her kolon için checkbox, seçim `localStorage`'da
  (`soc_cols_tune`/`soc_cols_uc`/`soc_cols_hunt`) kalıcı. Tek bir jenerik
  mekanizma (`initTableColumns`/`applyColumnVisibility`/`toggleColumnPanel`,
  `static/app.js`) üç tabloya da `columns` config dizisiyle uygulandı — kod
  tekrarı yok.
- [x] **Kolona göre filtre:** `<thead>` altına ikinci bir satır (`col-filter-row`)
  — durum/ortam/sıklık gibi zaten sınırlı değer kümesi olan kolonlarda o anki
  veriden türeyen bir `<select>`, diğerlerinde serbest metin `<input>`. Tamamen
  client-side (`matchesColumnFilters`), mevcut global arama + sıralama
  zincirine (`tuneSearch`/`clientSort`) ek bir `.filter()` olarak eklendi —
  yeni bir backend endpoint'i gerekmedi (tablolar zaten tüm veriyi tek
  seferde çekip client-side işliyordu).
- [x] **Uçtan uca doğrulandı** (geçici debug admin, gerçek tarayıcı + DOM
  durumu üzerinden): Case No kolonu doğru pozisyonda render oluyor; kolon
  gizleme hem `<th>` hem `<td>`'leri doğru gizliyor VE sayfa yeniden
  yüklendiğinde (tam navigasyon, sadece JS state değil) `localStorage`'dan
  geri geliyor; kolona göre metin filtresi (Case No'da "789" → 9 satırdan
  1'e indi) ve select filtresi (Durum="Tune Başarılı" → 5 satır, hepsi doğru
  durumda) doğru çalışıyor; global arama + kolon filtresi birlikte
  uygulanınca doğru kesişim kümesi çıkıyor (regresyon yok); "Kolonlar"
  panelinin gerçek checkbox tıklamasıyla açılıp kapandığı, dışarı tıklayınca
  kapandığı doğrulandı. UC (11 filtre hücresi) ve Hunt (9 filtre hücresi)
  tabloları da aynı mekanizmayla doğru kuruldu. Test hesabı temizlendi,
  audit zinciri etkilenmedi.

### Faz W — XSOAR Olay Raporu: Yeni Modül (2026-08-16)

- [x] **Yeni tablo `incident_reports`:** `xsoar_case_id`/`xsoar_url` (mevcut
  `build_xsoar_url()` ile Tune'la aynı desen), `title`/`environment`/
  `reporter`, `sections` (JSON — `[{heading, text}]`, başlıklar koda gömülü
  değil, kullanıcı/XSOAR playbook'u belirliyor), `images` (JSON — sıralı
  `[{order, filename}]`), `status` (Taslak/Onaylandı/Reddedildi) + onay alanları
  (`validated_by/at/note`).
- [x] **Webhook `POST /api/integrations/xsoar/incident-report`** (`@api_key_required`,
  mevcut `XSOAR_WEBHOOK_TOKEN`): `sections` zorunlu (en az bir dolu madde),
  `images` opsiyonel — tek çağrıda hepsi birden, base64 dizisi (öğeler ham
  string, `data:image/X;base64,...` önekiyle veya önek olmadan), yeni
  `_decode_incident_image()` ile çözülüp `UPLOAD_FOLDER`'a yazılıyor, sırasına
  göre `order` alanı atanıyor. Tune'daki AYNI mükerrer-case engeli
  (`Reddedildi` olmayan aynı `xsoar_case_id` → `409`) ve `requested_by`
  kullanıcı-adı eşleştirme + nazik fallback deseni yeniden kullanıldı.
- [x] **Onay akışı VAR** (kullanıcı kararı: XSOAR'dan gelen veri bozuk/eksik
  olabilir) — webhook → `Taslak`; bir analist başlık/bölüm/görselleri serbestçe
  düzenleyebilir (`PUT`, sadece `Taslak` durumdayken); bir Kıdemli Analist/Müdür
  Onaylar veya (zorunlu gerekçe notuyla) Reddeder — Tune'un onay modalı
  (`validate-modal`/`openValidateModal`/`execValidate`/`execRejectValidation`)
  aynen yeniden kullanıldı, sadece route öneki farkı için küçük bir
  `_validatePathBase(type)` yardımccısı eklendi.
- [x] **Frontend — yeni üst-seviye modül** ("📋 Olay Raporları", RBAC gate yok —
  Tune/UC/Hunt gibi tüm giriş yapmış kullanıcılara açık): liste tablosu (Faz
  V'nin kolon göster/gizle + kolona göre filtre mekanizması 4. tablo olarak
  buraya da uygulandı), düzenleme modalı (dinamik bölüm listesi ekle/çıkar +
  görsel galerisi paste-ile-ekle/çıkar, "Görsel 1/2/…" sıralı etiketleme),
  salt-okunur detay modalı (bölümler + galeri + onay/red bilgisi), audit
  kategorileri (`CREATE_INCIDENT_XSOAR`/`EDIT_INCIDENT`/`APPROVE_INCIDENT`/
  `REJECT_INCIDENT`/`DELETE_INCIDENT`) ve global arama (`incident_reports`
  4. modül olarak `goToItem`'a eklendi).
- [x] **Uçtan uca doğrulandı** (geçici debug admin, gerçek tarayıcı + DOM +
  webhook `requests` çağrıları): webhook `sections`+`images` (2 test görseli,
  sıralı) ile `201` dönüp doğru galeri oluşturuyor; mükerrer case `409`
  veriyor; liste tablosu 3 farklı durumdaki (Taslak/Onaylandı/Reddedildi) kaydı
  doğru render ediyor; detay modalinin footer butonları duruma göre doğru
  değişiyor (Taslak → Düzenle+Onayla/Reddet+Kapat, diğerleri → sadece Kapat);
  düzenleme modalinde bölüm ekleme/çıkarma + kaydetme round-trip doğru
  persist ediyor; onay modalinde red gerekçesi zorunluluğu (notsuz reddet →
  engellendi) ve hem onayla hem reddet akışının gerçek API'ye doğru gidip
  (`_validatePathBase` düzeltmesi doğrulandı) durumu güncellediği; silme
  (gerçek `deleteIncident()` fonksiyonu, `confirm()` override edilerek) doğru
  çalıştığı; kolon göster/gizle + kolona göre filtrenin 4. tabloda da doğru
  işlediği; genel aramanın olay raporunu bulup `pickSearch`→`goToItem` ile
  doğru sekmeye/detay moduna zıpladığı; audit log'da 5 action'ın da doğru
  Türkçe etiket/renk sınıfıyla (`ACTION_TR`/`ACTION_CLS`) göründüğü teyit
  edildi. Test verileri (kayıtlar, yüklenen görseller, debug hesapları)
  temizlendi, `verify_audit.py` zincirin geçerli kaldığını doğruladı (206
  kayıt, 182 zincirli).
- [x] **Geliştirme sürecinde bulunup düzeltilen 2 gerçek bug:** `_colFilters`
  state objesinde `incident` anahtarı eksikti (Faz V'nin genel kolon-filtre
  motoru 3 tablo için yazılmıştı, 4. tabloya eklenirken unutulmuştu) —
  `matchesColumnFilters` içinde `TypeError` fırlatıp tabloyu tamamen boş
  render ediyordu; `onColumnFilterInput`'ta da aynı sebepten `incident` dispatch
  dalı eksikti. İkisi de eklendi, `app.js` versiyonu `v34`'e yükseltildi
  (tarayıcı önbelleğini kesin olarak atlamak için).
- [x] **Kapsam dışı (bilinçli, v1):** PDF export bu fazda yok — Hunt'ın PDF
  deseni (Montserrat, `.report-img` sabit sınırı, `WEASYPRINT_EXE` yedek yolu)
  doğrudan yeniden kullanılabilir hale geldiğinde ayrı bir takip fazı olarak
  eklenecek.
- [x] **Takip (2026-08-16): Case'e sonradan/ayrı görsel ekleme webhook'u.**
  Kullanıcı isteğiyle ana "tek çağrıda hepsi birden" webhook'undan bağımsız
  yeni bir uç nokta: `POST /api/integrations/xsoar/incident-report/image`
  (`xsoar_case_id` ile en son raporu bulur, tek bir `image` + opsiyonel
  `order` alır). Kullanıcı kararı: **raporun durumuna bakılmaksızın çalışır**
  (Taslak/Onaylandı/Reddedildi fark etmez — geç gelen ek kanıt senaryosu),
  bu bilinçli olarak `PUT` düzenlemenin Taslak-only kısıtından farklı.
  Numaralandırma: `order` verilmezse otomatik (mevcut en yüksek + 1); verilip
  çakışırsa (iki çağrı da aynı numarayı gönderirse) veri sessizce üzerine
  yazılmaz — `1, 1a, 1b...` gibi bir harf ekiyle ilk boş etiket bulunur
  (yeni `_incident_next_image_label()` yardımcısı).
  **Geliştirirken bulunan gerçek bir tasarım açığı:** galeri arayüzü
  (düzenleme modali + salt-okunur detay modali) görsellerin etiketini
  `img.order` yerine dizideki SIRA NUMARASINA (`i+1`) göre gösteriyordu —
  yani "1a" gibi bir etiket hâlâ ekranda düz "Görsel 3" olarak görünürdü,
  özelliğin tüm amacı boşa çıkardı. Daha ciddisi: düzenleme modalinin
  Kaydet akışı da `order`'ı her seferinde `i+1`'e sıfırlıyordu — bir analist
  Taslak bir raporu SADECE başka bir alanı değiştirip kaydetse bile,
  webhook'un özenle atadığı "1a" etiketi sessizce sıradan bir sayıya
  dönüşüp kaybolurdu. Üç yer de düzeltildi: galeri render'ları artık
  `img.order` kullanıyor (yoksa `i+1`'e düşüyor), Kaydet artık mevcut
  `order` değerini koruyor (sadece gerçekten eksikse `i+1` atıyor).
  `app.js` versiyonu `v35`'e yükseltildi.
  **Yan bulgu (bu fazın kapsamı dışında, ayrıca not edildi):** `login_required`
  session'da sadece `user_id` var mı diye bakıyor, kullanıcının DB'de hâlâ
  var olduğunu tekrar sorgulamıyor — silinen bir hesabın önceden açılmış
  oturumu, çerez süresi dolana kadar geçerli kalmaya devam ediyor. Bu fazın
  konusu değil, düzeltilmedi, ayrıca bildirildi.
  **Doğrulandı:** requests ile otomatik numaralama (1, 2), açık numarayla
  çakışma (`order:1` → `1a`), çakışmasız açık numara (`order:5` → `5`),
  var olmayan case için `404`, Onaylandı bir rapora görsel ekleme (durum
  kısıtı yok) — hepsi test edildi. Gerçek tarayıcı + gerçek giriş ile: detay
  modalinde "Görsel 1a" doğru göründüğü, düzenleme modalinde galeri etiketi
  doğru göründüğü VE ilgisiz bir alanı değiştirip Kaydet'e basınca "1a"
  etiketinin hayatta kaldığı (sıradan sayıya dönüşmediği) DOM/API durumu
  üzerinden teyit edildi. Test verileri (2 rapor, 7 görsel dosyası, debug
  hesap) temizlendi, audit zinciri geçerli (222 kayıt, 198 zincirli).
- [x] **Takip (2026-08-16): PDF export + manuel oluşturma.** Faz W'nin
  bilinçli olarak v1 dışı bıraktığı iki parça şimdi eklendi:
  - **PDF export** (`GET /incident-reports/<id>/report/pdf`, sadece
    `Onaylandı` durumundaki raporlar için): Hunt'ın PDF altyapısı
    (Montserrat font, DiAS logosu, `.report-img` sabit görsel sınırı,
    `WEASYPRINT_EXE` yerel yedek yolu) doğrudan yeniden kullanıldı — bu
    sırada `hunt_report_pdf()` içine gömülü olan `_font_uri`/logo hesaplama
    ve WeasyPrint/`WEASYPRINT_EXE` deneme-yanılma bloğu modül seviyesine
    (`_pdf_font_uri`/`_pdf_logo_uri`/`_render_pdf_bytes`) çıkarılıp iki PDF
    route'unda da ortak kullanılır hale getirildi (kod tekrarı yok). Yeni
    şablon `templates/incident_report_print.html` — bölümler + görsel
    galerisi, **her görselin altında "Görsel N" etiketi** (kullanıcının asıl
    isteği: rapor metni görsellere numarayla atıf yapıyor, PDF'te de aynı
    numaralandırma görünmeli — ekrandaki `img.order` mantığıyla birebir
    aynı, madde-halinde-array-index değil).
  - **Manuel oluşturma** (`POST /api/incident-reports`, `login_required`):
    bir analist artık "+ Yeni Olay Raporu" ile XSOAR'dan bağımsız da bir
    olay raporu açabiliyor — SOAR Case No burada opsiyonel (elle açılan bir
    olay bir case'e hiç bağlı olmayabilir; verilirse yine mükerrer-case
    kontrolünden geçer). Diğer tüm modüllerle tutarlı olarak **aynı Taslak →
    onay akışından geçer** — manuel oluşturma onay kapısını atlamaz. Aynı
    düzenleme modali (bölüm ekle/çıkar + paste-ile-görsel-ekle) create/edit
    ikili modda çalışacak şekilde genişletildi (`incident-edit-id` boşsa
    `POST`, doluysa `PUT`) — yeni bir modal yazılmadı.
  - Yeni audit action'ları: `CREATE_INCIDENT` (create), `EXPORT_INCIDENT_PDF`
    (system).
  - **Doğrulandı:** requests ile manuel oluşturma (case id'li/id'siz, mükerrer
    case 409, başlıksız 400); Taslak bir rapor için PDF isteği 400; rapor
    onaylanıp PDF üretildi, PyMuPDF ile PNG'ye çevrilip görsel olarak
    incelendi — logo, rapor/onay bilgileri, bölümler, ve "Görsel 1"/"Görsel
    2" etiketli galeri hepsi doğru render oluyor (2 sayfa). Gerçek tarayıcı +
    gerçek giriş ile: "+ Yeni Olay Raporu" modali doğru boş state'te açılıyor,
    form doldurup Kaydet'e basınca gerçekten `POST` ile yeni kayıt oluşuyor
    ve tabloda görünüyor; PDF indirme linki hem tablo satırında hem detay
    modali footer'ında SADECE Onaylandı satırlarda görünüyor (Taslak
    satırlarda yok) DOM durumu üzerinden teyit edildi. `app.js` versiyonu
    `v36`'ya yükseltildi. Test verileri (3 rapor, 2 görsel dosyası, debug
    hesap) temizlendi, audit zinciri geçerli (228 kayıt, 204 zincirli).

### Takip (2026-08-16) — Ad Soyad, kalan yüzeyler (PDF/rapor/Excel)

Ad Soyad altyapısı (kolon, kullanıcı yönetimi UI, `displayName()`) zaten
Faz H'de (2026-07-19) vardı ama sadece **istemci tarafı** (JS) çalışıyordu —
Jinja/PDF/Excel gibi Python tarafında hiç karşılığı yoktu. Kullanıcı bunu
Hunt/Incident PDF'lerinde ve diğer "göze batan" yerlerde fark edip istedi.

- Yeni `display_name(username)` (`app.py`) — `displayName()`'in sunucu
  tarafı eşi, `g` üzerinde istek başına önbelleklenen tek bir sorgu.
  `inject_app_version` ile aynı `@app.context_processor` deseniyle her
  template'te otomatik erişilebilir hale getirildi.
- Kapsanan yerler: Hunt PDF (4 alan), Olay Raporu PDF (2 alan), `/report`
  aylık görsel rapor (3 alan), Excel export Sheet 1-3 (12 kolon), Audit Log
  Excel export (1 kolon), sidebar (artık ilk render'da doğru — önceden JS'in
  async `/api/analysts` çağrısını bekliyordu), 8+3 "kendine kilitli" dropdown
  (`lockToSelf` + 3 "Üstlen" modali) ve 2 "meslektaşın atamasını salt-okunur
  gör" dropdown'u (`value` ham kullanıcı adı kalıyor, sadece görünen metin
  Ad Soyad'a çevrildi — DB/eşleştirme etkilenmedi).
- **Bilinçli dokunulmayan yer:** audit `detail` serbest metnine gömülü
  kullanıcı adları (CREATE_USER/EDIT_USER/DELETE_USER/EXPORT_AUDIT_LOG) —
  Faz H'nin kendi gerekçesiyle aynı: bunlar adli/kanıt niteliğinde, ham
  sistem kimliği burada daha doğru.
- **Doğrulandı** (gerçek hesap "Kerem Kundakçı"/admin + "Ayşe Yılmaz"/analist,
  gerçek tarayıcı + PyMuPDF ile PDF görsel inceleme + openpyxl ile Excel
  okuma): Hunt PDF'in 4 alanı, Incident PDF'in 2 alanı, `/report`'ta Ad
  Soyad doğru render oluyor (ham kullanıcı adı hiçbir yerde görünmüyor);
  Excel Sheet 3'te Ad Soyad doğru yazılı; sidebar ilk yüklemede (ekstra JS
  round-trip beklemeden) doğru isim gösteriyor; analist hesabıyla Hunt
  formu açılınca `value="AyseY"` (ham, backend için) + görünen metin "Ayşe
  Yılmaz" olan kilitli dropdown doğrulandı. `app.js` versiyonu `v37`'ye
  yükseltildi. Test verileri (2 hesap, 1 hunt, 1 olay raporu) temizlendi,
  audit zinciri geçerli (241 kayıt, 217 zincirli).

### Takip (2026-08-17) — PDF başlık hiyerarşisi + Hunt Başlığı alanı

- **Olay Raporu PDF:** Başlık/rapor-no yer değiştirdi — rapor adı artık büyük
  ana başlık, "Olay Raporu — #N" altında küçük alt başlık (öncesi tersiydi).
- **Hunt Başlığı (yeni alan):** `threat_hunt_requests.hunt_title` — hunt
  oluştururken artık önce kısa/tanımlayıcı bir başlık, sonra (eskisi gibi)
  detaylı "Hunt Konusu" soruluyor. Kullanıcı kararıyla `hunt_title`, Olay
  Raporu'ndaki `title` ile aynı rolü üstlendi — **her yerde ana görüntülenen
  isim**: tablo (kolon adı da "Hunt Başlığı" oldu, sıralama artık bu alana
  göre), detay modali başlığı, PDF başlığı (Olay Raporu'yla aynı desen: başlık
  büyük, "#N" altında küçük), genel arama, onay modali metni, dashboard mini-
  tablosu, Excel export (yeni kolon). `hunt_subject` içerik alanı olarak kaldı
  — detay modali ve PDF'te "Hunt Konusu" satırı olarak (sadece `hunt_title`
  doluysa gösteriliyor, eski kayıtlarda tekrar olmasın diye).
  Eski kayıtlarda `hunt_title` boş — her gösterim noktasında `hunt_title or
  hunt_subject` fallback'i var, hiçbir yerde boş başlık görünmüyor.
  `/api/my-work` ve `/api/search`'teki hunt sorguları `COALESCE(hunt_title,
  hunt_subject)` ile aynı fallback'i SQL tarafında uyguluyor (bu iki uç genel
  `norm()`/`add()` yardımcısını üç modülle paylaştığı için Python tarafında
  hunt'a özel dallanma yerine SQL'de çözüldü).
  Düzenleme yetkisi `hunt_subject` ile birebir aynı (sadece talebi açan kişi
  değiştirebilir).
- **Doğrulandı:** başlıksız oluşturma isteği `400`; gerçek oluşturma +
  PDF (PyMuPDF ile görsel inceleme — başlık büyük, "#N" küçük, "Hunt Konusu"
  gövdede doğru göründü) + Excel ("Hunt Başlığı" kolonu doğru) + gerçek
  tarayıcıda tablo/detay/oluşturma formu (alan sırası: önce başlık, sonra
  konu) + gerçek `POST` ile UI'dan oluşturma + genel arama + onay modali metni
  — hepsi test edildi. `app.js` versiyonu `v38`'e yükseltildi. Test verileri
  (1 hesap, 2 hunt) temizlendi, baseline hunt sayısı 7'ye döndü, audit
  zinciri geçerli (246 kayıt, 222 zincirli).

### Takip (2026-08-17) — Ayarlar sekmeleri, Olay Raporu XSOAR rehberi, Dashboard hover

- **Ayarlar sayfası sekmelere ayrıldı:** Daha önce tek uzun sayfa halinde
  kayan 5 panel (Ortamlar/Kullanıcılar/Yedekleme/XSOAR/Kullanıcı Aktivitesi)
  artık admin için 4 sekme: **Genel** (Ortamlar+Kullanıcılar — ikisi de
  `settings` rolüne de açık olduğu için birlikte), **Yedekleme**, **XSOAR
  Entegrasyonu**, **Kullanıcı Aktivitesi**. `settings` rolü hâlâ sadece
  Genel'i görüyor — sekme çubuğu sadece admin'e render oluyor (`{% if
  user_role == 'admin' %}`), tek seçenek varken gereksiz UI karmaşası
  olmasın diye. Yeni jenerik `.settings-subnav`/`.settings-subtab-btn`/
  `.settings-subpanel` CSS + `switchSettingsSubtab(name)` — sidebar'ın
  `nav-btn`/`tab-panel` desenini küçük ölçekte tekrarlıyor, ilk kurulan
  "sayfa içi sekme" bileşeni bu projede. Veri yükleme davranışı değişmedi
  (`loadSettings()` hâlâ hepsini baştan yüklüyor, sekme geçişi salt görünüm).
- **XSOAR sekmesine Olay Raporu rehberi eklendi:** Panelde şimdiye kadar
  sadece Kural Tuning webhook'u anlatılıyordu (ve altındaki "Şu an kapsamı"
  notu hâlâ "sadece Kural Tuning" diyordu — Faz W'den beri yanlıştı). Şimdi
  Kural Tuning'in hemen altında paralel bir "Olay Raporu (Incident Report)
  Webhook'u" bölümü var: ne işe yaradığı, onay akışı, kurulum için
  gereken adres/anahtar/zorunlu alanlar, `docs/xsoar_incident_report_script.py`
  ve `docs/xsoar_integration.md`'ye pointer. "SOAR Case URL Şablonu"nun
  her iki entegrasyon için de ortak olduğu netleştirildi, "Şu an kapsamı"
  notu güncellendi.
- **Dashboard KPI kartlarına hover-büyüme:** `.kpi-module` (Kural Tuning/
  Use-Case/Threat Hunting kartları) zaten `:hover`'da kenarlık+gölge
  değiştiriyordu — `transform: scale(1.02)` eklendi (küçük/abartısız,
  `transition`e de `transform` eklendi ki pürüzsüz büyüsün/küçülsün).
- **Doğrulandı:** gerçek admin hesabıyla, gerçek tarayıcı: sekme
  butonlarına tıklayınca doğru panel görünür/gizlenir oluyor (DOM
  `.active` durumu üzerinden), XSOAR sekmesinde yeni Olay Raporu bölümü ve
  URL şablonu inputu'nun mevcut değeri (taşımadan önce kaydedilen) hâlâ
  doğru yükleniyor, Kullanıcı Aktivitesi sekmesi tıklayınca tablo gerçek
  veriyle doluyor. Hover CSS kuralı (`transform: scale(1.02)`) sayfanın
  yüklü stylesheet'inde doğru şekilde bulundu (CSSOM üzerinden). `app.js`
  `v39`, `styles.css` `v11.14`'e yükseltildi. Test hesabı temizlendi, audit
  zinciri geçerli (246 kayıt, 222 zincirli — bu faz veri mutasyonu içermedi).
- **Takip (2026-08-17):** Kullanıcı geri bildirimiyle 3 küçük ayar: Trend
  kartlarına (`.trend-card`, önceden hiç hover'ı yoktu) `.kpi-module` ile
  aynı hover-büyüme eklendi; her ikisinde de büyüme miktarı `scale(1.02)` →
  `scale(1.05)` (öncekinin fark edilmesi zor olduğu belirtildi); Hunt ve
  Olay Raporu PDF'lerinin başlık font boyutu `18px` → `17px` (başlık artık
  uzun bir isim olabildiği için — Hunt Başlığı/Olay Raporu adı — biraz daha
  küçük daha iyi oturuyor). CSSOM üzerinden doğrulandı, PyMuPDF ile PDF
  görsel karşılaştırması yapıldı. `styles.css` `v11.15`'e yükseltildi. Test
  hesabı temizlendi, audit zinciri geçerli (249 kayıt, 225 zincirli).
- **Takip (2026-08-17) — hover büyümesi hâlâ az geldi:** Kullanıcı geri
  bildirimiyle iki kez daha artırıldı: `scale(1.05)` → `scale(1.08)` (KPI
  kartları + Trend kartları, ikisi de).

### Takip (2026-08-17) — Trend kartı: tıkla-büyüt detay grafiği

- **Trend kartına tıklayınca büyüyen grafik:** Dashboard'daki 4 mini Trend
  kartının (Kural Tuning/Use-Case/Threat Hunt/Hunt Saati) her biri artık
  tıklanabilir (`cursor:pointer`) — tıklayınca `#trend-detail-modal` içinde
  aynı verinin büyütülmüş (780×320 viewBox) bir versiyonu açılıyor: ızgara
  çizgileri + Y ekseni değer etiketleri, X ekseninde ay adları (yeni
  `fmtMonthShort()`/`TR_MONTHS_SHORT` — "Eyl 25" gibi kısa Türkçe ay
  formatı), her veri noktasının üzerinde/altında sayısal değer etiketi
  (birinci seri nokta üstü, ikinci seri nokta altı). Mini kartlardaki
  `_sparkPath` ham veri kaybetmeden büyütülmüş SVG'ye aktarılsın diye
  `loadTrends()` artık `_trendCardDefs` adında modül-seviyeli bir dizi
  dolduruyor (kart başına `{title, months, series}`), `openTrendDetail(idx)`
  bu diziden okuyor — ekstra bir API çağrısı yok, mevcut `/api/trends`
  verisi tekrar kullanılıyor.
- **Bulunan/düzeltilen bir bug:** İlk sürümde ay etiketleri ile ikinci
  serinin "nokta altı" değer etiketleri aynı taban çizgisine yakın sabit
  ofsetlerle konumlandırılmıştı (~2px fark) — bir serinin değeri sıfıra
  yakın olduğunda (bu dev DB'de yaygın) etiketler görsel olarak çakışıyordu.
  Ay etiketi ofseti `+16` → `+27`, ikinci seri "altta" etiket ofseti `+14`
  → `+12` yapılarak ~15px boşluk sağlandı.
  **Doğrulandı:** gerçek tarayıcıda çalışan sunucudan `outerHTML` ile SVG
  çıkarılıp koordinatlar sayısal olarak karşılaştırıldı — gerçek trend
  verisi (`/api/trends` ile birebir eşleşiyor), ay etiketi `y=307`, ikinci
  seri etiketi `y=292` (15px boşluk, çakışma yok), modal `display:flex`
  ile açılıp başlık doğru geliyor, kutu 243×147'den 843×489'a büyüyor.
  `app.js` `v41`'e, ilgili script tag'i de aynı sürüme yükseltildi. Test
  hesabı (`_dbgtrendtest`) temizlendi, audit zinciri geçerli (249 kayıt,
  225 zincirli — bu faz veri mutasyonu içermedi).
- **Not (ayrı, kapsam dışı bug):** `.trend-card` (ve `.mywork-col`,
  `.sidebar-search-input`, `.search-results`) `background: var(--bg-1)`
  kullanıyor ama `--bg-1` hiçbir yerde tanımlı değil — bu 4 öğe şu an şeffaf
  arka planla render oluyor. Bu oturumdan önce de var olan, bu özellikle
  ilgisiz bir bug; ayrı bir görev olarak işaretlendi, burada dokunulmadı.

### Takip (2026-08-17) — Olay Raporu: settings rolüne silme yetkisi

- **Bulunan kök neden:** Tune/UC/Hunt'ın üçünde de silme butonu
  `USER_ROLE === "admin" || "user" || "settings"` (`isAdmin`) koşuluyla
  gösteriliyor — `settings` rolü bu üç modülde zaten admin gibi
  sayılıyordu. Olay Raporu (Faz W) bu deseni tekrarlamamış,
  `incidentActionBtns()` (`app.js`) sadece `USER_ROLE === "admin"`
  kontrol ediyordu — `settings` rolündeki kullanıcı silme butonunu hiç
  görmüyordu. Backend'de (`DELETE /api/incident-reports/<id>`) zaten hiç
  rol kontrolü yok (`@login_required` yeterli) — düzeltme sadece bu tek
  satırlık frontend koşulunu üç modülle tutarlı hale getirmekti.
- **Doğrulandı:** geçici bir `settings` rollü debug hesabıyla gerçek
  tarayıcı + gerçek API: silme butonu artık görünüyor, aynı hesapla bir
  test kaydı oluşturulup (`201`) hemen silindi (`200`, `{"ok":true}`),
  listeden kaybolduğu doğrulandı. `app.js` `v42`'ye yükseltildi. Test
  hesabı temizlendi, audit zinciri geçerli (251 kayıt, 227 zincirli).
- **Ayrı not (`docs/rbac.md` güncel değil):** Doküman "settings rolünün
  Dashboard/Tuning/UC/Hunt/Audit'a erişimi yok" diyor — ama kod
  (`templates/index.html`) sadece Dashboard ve Audit Log'u
  `{% if not is_settings %}` / `{% if user_role == "admin" %}` ile
  gerçekten gizliyor; Tuning/UC/Hunt/Olay Raporu sekmeleri settings
  rolüne de DOM'da açık (kod içindeki yorum da bunu doğruluyor: "sadece
  'settings' rolünde dashboard sekmesi hiç render edilmiyor"). Doküman
  muhtemelen daha eski bir davranışı yansıtıyor; düzeltilmedi, kapsam
  dışı — ayrıca not edildi.
- **Silinen kayıt numaralarının yeniden kullanılması (kullanıcı talebi,
  reddedildi):** Kullanıcı silinen bir olay raporunun ID'sinin bir
  sonraki kayıtta tekrar kullanılmasını istedi. Uygulanmadı — `id`
  kolonu `INTEGER PRIMARY KEY AUTOINCREMENT`, SQLite'ın bunu bilinçli
  olarak asla tekrar kullanmama garantisi var; ID'ler audit log'da
  (`entity_id`) ve XSOAR tarafındaki case notlarında referans olarak
  kullanılıyor — silinen bir ID'nin farklı bir kayda yeniden atanması
  audit izini ve XSOAR çapraz referanslarını yanıltıcı hale getirir.
  Kullanıcıya bu risk anlatılıp alternatif soruldu, cevap bekleniyor.

### Takip (2026-08-21) — UI/UX + performans denetimi

Kullanıcı genel bir "hata/eksik var mı, hızlandırma neresi gerekli" denetimi
istedi. Canlı uygulamayı admin hesabıyla gezip kod tarafını (sorgu desenleri,
index'ler, hata yönetimi) inceledim; bulunanlar önceliklendirilip kullanıcıyla
paylaşıldı, "gerçek hata" + "risksiz performans" kategorisindeki 4 madde onay
alıp uygulandı:

- **Threat Hunting ortam filtresi tamamen boştu:** `populateEnvFilters()`
  (`app.js`) ortam listesini `["tune-filter-env","uc-filter-env",
  "incident-filter-env"]` elemanlarına dolduruyordu — Hunt'ın kendi filtre
  elemanı (`hunt-filter-status-env`, isimlendirmesi diğer üçünden farklı
  olduğu için muhtemelen bu yüzden atlanmış) listede hiç yoktu. Listeye
  eklendi.
- **Oturum süresi dolunca kullanıcı anlamsız bir "Unauthorized" hatasıyla
  baş başa kalıyordu:** `apiFetch()` artık `401`'i özel olarak yakalayıp
  doğrudan `/login`'e yönlendiriyor (diğer hata kodları eskisi gibi
  `Error` fırlatıp çağıran yerin kendi hata kutusunda gösteriliyor).
- **Audit Log 1000 kayıtta sessizce kesiliyordu, arayüzde hiçbir uyarı
  yoktu:** `/api/audit` artık `{rows, total}` şeklinde dönüyor (önceden
  düz dizi); `loadAuditLog()` `total > rows.length` olduğunda "Son N kayıt
  gösteriliyor (toplam: M) — tam liste için Excel indirin" notunu
  gösteriyor. Excel export zaten sınırsızdı, değişmedi — bu sadece
  ekrandaki görünümün şeffaflığıyla ilgili.
- **Hiçbir tabloda index yoktu** (sadece implicit PK/UNIQUE index'leri) —
  `init_db()`'ye 9 tane `CREATE INDEX IF NOT EXISTS` eklendi: her üç
  modülün + Olay Raporu'nun `status` kolonu (KPI COUNT sorguları ve liste
  filtreleri için), Tune + Olay Raporu'nun `xsoar_case_id`'si (mükerrer-case
  kontrolü için), audit_log'un `created_at`/`username`/`action`'ı (sıralama
  + filtre için). Bilinçli olarak `created_at` üzerine tune/uc/hunt/incident
  tablolarına index eklenmedi — ay filtreleri `strftime()` ile sarılı
  olduğu için düz bir index'ten faydalanamazlar, boşuna index bakımı
  olurdu.
- **Ertelenen bulgular (kullanıcıyla ayrıca karar verilecek):** `/api/kpi`
  24 ayrı `COUNT(*)` sorgusu atıyor (3 modül × 8 durum, `GROUP BY` ile 3'e
  inebilir); Tune/UC/Hunt/Olay Raporu tabloları tüm kayıtları tek seferde
  çekip client-side filtreliyor (mimari, şu anki veri hacminde sorun değil);
  şifre politikası sadece min 6 karakter; pratikte mobil/responsive destek
  yok (sidebar her ekranda sabit 210px, sadece 3 media query var, hiçbiri
  sidebar/tabloyu etkilemiyor).
- **Doğrulandı:** geçici bir admin debug hesabıyla gerçek tarayıcı + gerçek
  API: Hunt ortam dropdown'ı artık `["Tüm Ortamlar","sdadsa"]` gösteriyor;
  `/api/audit` yanıtı `{rows,total}` şeklinde geliyor, Audit Log sekmesi
  251 satırı doğru render ediyor, not mantığı (sahte 1000/4523 verisiyle)
  doğru metni/görünürlüğü üretiyor; oturum temizlenip `apiFetch` çağrısı
  yapıldığında gerçekten `/login`'e yönlendirildiği (sayfa metninden)
  doğrulandı; 9 index'in hepsi `sqlite_master`'da göründü. `app.js` `v43`'e
  yükseltildi. Test hesabı temizlendi, audit zinciri geçerli (251 kayıt,
  227 zincirli — bu faz veri mutasyonu içermedi).

### Takip (2026-09-07) — Olay Raporu/Hunt PDF sayfalama hatası

- **Kullanıcı bulgusu (ekran görüntüleriyle):** Olay Raporu PDF'lerinde
  Onay Bilgileri'nden sonra sayfa geçişinde büyük bir boşluk oluşuyor;
  "Görseller" başlığı bazen bir sayfanın en üstünde tek başına kalıp
  altındaki görseller ancak bir sonraki sayfada başlıyordu.
- **Kök neden:** `templates/incident_report_print.html` ve
  `templates/hunt_report_print.html`'de `.section { break-inside: avoid }`
  TÜM bölümlere (kısa/sabit olanlara da, döngüden gelip uzayabilenlere de)
  uygulanmıştı. Bir bölüm (Olay Detayları, Görseller, Hunt'ta Bulgular/
  MITRE/Öneriler/Zafiyetler) mevcut sayfaya sığmadığında WeasyPrint
  bölümün TAMAMINI bir sonraki sayfaya atıyor, önceki sayfada kalan boşluk
  öylece kalıyordu. Ayrıca Incident'ın "Görseller" galerisi `display:flex`
  kullanıyordu — WeasyPrint flex/grid konteynerlerini sayfalar arası
  bölemiyor, bu da "Görseller" başlığının galeri bir sonraki sayfaya
  komple atılınca yalnız kalmasına sebep oluyordu.
- **Düzeltme:** `break-inside:avoid`, büyüyebilen kapsayıcılardan alınıp
  en küçük atomik birime taşındı — yeni `.section-flow` sınıfı (sadece
  Olay Detayları/Görseller/Bulgular/MITRE/Öneriler/Zafiyetler'e uygulandı,
  Rapor Bilgileri/Onay Bilgileri gibi kısa/sabit bölümler eskisi gibi
  `break-inside:avoid` korudu) bölümün kendisinin doğal sayfalanmasına
  izin veriyor; `.report-body-block`/`.image-item`/`.finding-block`/tablo
  satırları/liste öğeleri kendi `break-inside:avoid`'ını alıp bölüm
  ortasında değil, sadece öğeler arasında bölünüyor. `.section-title`'a
  `break-after:avoid` eklendi (bir başlık hiçbir zaman altında içerik
  olmadan yalnız kalmasın diye). Incident'ın `.image-grid`'i
  `display:flex`'ten `display:block` + `.image-item { display:inline-block }`
  düzenine çevrildi — WeasyPrint bunu normal satır-içi akış gibi görüp
  doğal sayfalayabiliyor.
- **Doğrulandı:** gerçek uygulama üzerinden (XSOAR webhook + manuel
  onay akışı), 6 bölümlü/6 görselli sentetik bir test raporu VE
  kullanıcının kendi örnek kaydı (id=7) ile gerçek PDF üretilip
  PyMuPDF'le sayfa sayfa görsel incelendi — artık her bölüm başlığı
  hemen altındaki içerikle aynı sayfada başlıyor, büyük boşluk yok,
  içerik sayfa sığdığı kadarını alıp doğal şekilde bir sonraki sayfaya
  akıyor. Hunt tarafı da (8 satırlık MITRE tablosu, 6 görselli bulgu,
  10 maddelik öneri listesi, 6 maddelik zafiyet listesi içeren sentetik
  bir test kaydıyla) aynı şekilde doğrulandı. Test verileri (2 olay
  raporu, 1 hunt kaydı, yüklenen test görselleri, debug hesabı)
  temizlendi.
  **Not (kendi hatam):** Temizlik sırasında audit_log'dan doğrudan satır
  sildim, bu tamper-evident zinciri kırdı (`verify_audit.py` yakaladı) —
  zincir `write_audit()`'in kullandığı aynı `audit_hash()` fonksiyonuyla
  mevcut satır kümesi üzerinden yeniden hesaplanıp onarıldı (252/252
  zincirli, geçerli). Bundan sonra temizlikte audit_log'a hiç
  dokunulmayacak, sadece kayıt/kullanıcı tabloları silinecek.

### Takip (2026-09-07) — Aylık Rapor'da ay filtresi eksik kalmıştı

- **Kullanıcı bulgusu:** Dashboard'daki "Görsel aylık rapor oluştur"
  sayfasında bir ay seçince, o ay TAMAMLANAN ama başka bir ayda AÇILAN
  kayıtlar tabloya düşmüyordu (örn. Ağustos'ta filtrelenince Ağustos'ta
  kapatılan ama Temmuz'da açılmış bir use-case görünmüyordu).
- **Kök neden:** Bu tam olarak 2026-08-16'da `/api/tune`, `/api/usecase`,
  `/api/hunt` liste endpoint'lerinde ve Excel export'ta düzeltilmiş olan
  hatanın aynısı — ama `/report` (`monthly_report()`, `app.py`) o düzeltme
  turunda atlanmış. Sayfanın KPI sayıları zaten doğruydu (her durum kendi
  tarihine bakıyor, örn. "Tune Başarılı" → `approved_at`) — sorun sadece
  alttaki kayıt tablolarında (`tune_rows`/`uc_rows`/`hunt_rows`), bunlar
  `rows()` yardımcısıyla sadece `created_at`'e bakıyordu.
- **Düzeltme:** `rows()` yardımcısı `(table, extra_col=None)` alacak
  şekilde güncellendi — `extra_col` verildiğinde liste endpoint'leriyle
  aynı `(strftime('%Y-%m',created_at)=? OR strftime('%Y-%m',extra_col)=?)`
  deseni kullanılıyor. Üç çağrı da kendi tamamlanma kolonuyla güncellendi:
  `tune_requests`/`usecase_requests`/`threat_hunt_requests` → `completed_at`.
  Olay Raporu bu sayfada hiç yok (modül, bu rapordan sonra eklenmiş),
  kapsam dışı bırakıldı.
- **Doğrulandı:** veritabanında zaten var olan, oluşturma/tamamlanma ayı
  farklı 3 gerçek kayıtla (tune #1: Mayıs→Haziran, UC #1: Nisan→Haziran,
  hunt #6: Temmuz→Ağustos) test edildi — her biri artık tamamlandığı ayın
  raporunda doğru görünüyor, alakasız bir ayda (negatif kontrol) hâlâ
  görünmüyor. Test hesabı temizlendi (audit_log'a dokunulmadı), audit
  zinciri geçerli (252 kayıt, 252 zincirli).

### Takip (2026-09-07) — Olay Raporu durum akışı + Etkilenen Varlıklar + Hunt KPI'ları

Kullanıcının netleştirme sorularıyla kesinleşen üç ayrı iyileştirme, birlikte
uygulandı (üçü de aynı modülleri/dosyaları etkiliyor).

- **Olay Raporu 4 durumlu döngüye geçti:** Eski tek-kapılı model (Taslak →
  Onaylandı/Reddedildi) yerine **Açıldı → İncelemede → Onay Bekliyor →
  Kapandı**. Açıldı→İncelemede (`start-review`) ve İncelemede→Onay Bekliyor
  (`submit-for-approval`) için iki yeni, onay gerektirmeyen uç nokta eklendi
  (`is_senior()` sadece Onay Bekliyor→Kapandı/İncelemede geçişinde gerekli).
  Onay Bekliyor'da sorun bulunursa (Hunt'ın sonuç-onayı reddiyle aynı desen)
  notla birlikte İncelemede'ye geri döner — artık terminal bir "Reddedildi"
  yok. PDF export gate'i `Kapandı`'ya taşındı. Yeni audit action'ları:
  `START_INCIDENT_REVIEW`/`SUBMIT_INCIDENT_FOR_APPROVAL`/`CLOSE_INCIDENT`/
  `RETURN_INCIDENT_FOR_REVISION` (eski `APPROVE_INCIDENT`/`REJECT_INCIDENT`
  geçmiş kayıtlar için dokunulmadan kaldı). Mevcut kayıtlar için idempotent
  migration: Taslak→Açıldı, Onaylandı→Kapandı, Reddedildi→İncelemede
  (validation_note/validated_by/validated_at BİLEREK korunuyor — geri
  dönen bir kaydın gerekçesi kaybolmasın diye).
  **Bulunan/düzeltilen bir yan hata:** mükerrer-case engeli üç yerde hâlâ
  eski `STATUS_REJECTED` ("Reddedildi") değerini dışlıyordu — ama bu değer
  artık olay raporlarında hiç kullanılmıyor, yani hiçbir kapanmış case asla
  yeniden açılamıyordu (sonsuz mükerrer engeli). `INCIDENT_STATUS_CLOSED`
  ("Kapandı") ile değiştirildi.
- **Etkilenen Varlıklar:** Yeni `affected_assets` JSON kolonu (isim+tür,
  sections'la aynı desen ama opsiyonel) — sabit tür listesi: Makine/
  Bilgisayar, Kullanıcı Hesabı, Sunucu, E-posta Hesabı, Uygulama/Servis,
  Diğer. Tabloya "Etkilenen Varlık" kolonu (sayı gösterir, tür bazlı
  filtrelenebilir — filtre için türetilmiş `_affected_asset_types` alanı
  kullanıldı, ham JSON alanı değil). `/report` ve Excel "KPI Özeti"ne yeni
  paylaşılan `get_incident_stats()` fonksiyonuyla toplam rapor + toplam
  varlık sayısı eklendi. Dashboard'a bilinçli olarak eklenmedi (Olay
  Raporu için orada hiç kart yok, sıfırdan tasarım ayrı bir karar).
- **Hunt KPI'ları:** `get_hunt_program_stats()`'a iki yeni metrik —
  `hunt_recommendations_count` (tüm hunt'ların öneri listesi toplamı) ve
  `hunt_ucs_from_hunt` (hunt'tan açılan TÜM Use-Case sayısı, durumdan
  bağımsız — mevcut `hunt_detections_created`'la KARIŞTIRILMAMASI gerektiği
  docstring'e not edildi, o sadece Prod'da Aktif'e ulaşanları sayıyor).
  Zaten var olan `hunt_total_hours`/`hunt_planned_executed_rate` ile
  birlikte Dashboard'a ilk kez taşındı — `/api/kpi` artık
  `get_hunt_program_stats()`'ı da çağırıp birleştiriyor (önceden tamamen
  ayrı, kopya bir hesaplamaydı), Threat Hunting kartına ikinci bir
  `.kpi-module-extra` satırı eklendi.
- **Doğrulandı:** iki geçici hesapla (analist + kıdemli analist) gerçek API
  üzerinden tam döngü — oluştur (Açıldı) → düzenle → incelemeye başla
  (İncelemede) → 2 etkilenen varlık ekle → onaya gönder (Onay Bekliyor) →
  bu durumda düzenleme denemesi `400` → notsuz reddet `400` → notlu reddet
  (İncelemede'ye döner, not korunur) → tekrar onaya gönder → onayla
  (Kapandı) → PDF `200`. Webhook path ayrıca test edildi: yeni kayıt
  Açıldı ile başlıyor, aktifken mükerrer case `409`, Kapandı olduktan
  sonra aynı case için yeni kayıt `201` (düzeltilen davranış). Migration
  sentetik Taslak/Onaylandı/Reddedildi(notlu) kayıtlarla doğrulandı — üçü
  de doğru eşlendi, gerçek örnek kayıt (id=7) de doğru şekilde Kapandı'ya
  geçti. `/api/kpi`, `/report`, Excel'in yeni metrikleri birbiriyle
  tutarlı gösterdiği (4 olay raporu, 3 etkilenen varlık, 4 öneri, 1 UC)
  sayısal olarak doğrulandı. Gerçek tarayıcıda tablo kolonu/durum
  rozetleri/aksiyon butonları kontrol edildi, konsol hatası yok. `app.js`
  `v44`'e yükseltildi. Test hesapları/kayıtları temizlendi (audit_log'a
  dokunulmadı), audit zinciri geçerli (263 kayıt, 263 zincirli).

### Takip (2026-09-08) — Liste ekleme deneyimi: otomatik büyüme + iki adımlı ekleme

Kullanıcı "Etkilenen Varlık Ekle" gibi listelere madde ekleme kısımlarını
"güncel/profesyonel" bulmadı — metin kutuları içerik ne olursa olsun sabit
boyutta kalıyordu, "+ Ekle" de kalıcı olarak açık bir kutu ekliyordu.
Araştırma sonucu uygulamada bu deseni paylaşan **6 liste** bulundu:
Olay Raporu Bölümleri, Etkilenen Varlıklar, Hunt Bulguları, Hunt MITRE
teknik notları, Hunt Önerileri, Hunt Keşfedilen Zafiyetleri. ("Seç/yaz +
Ekle → sabit etiket" deseniyle çalışan 6 tag listesi — UC MITRE, IOC,
ortam seçimleri — kullanıcının şikayetiyle ilgisiz, dokunulmadı.)

- **Otomatik büyüyen metin kutuları:** `.form-textarea` artık `resize:none;
  min-height:40px; max-height:280px; overflow-y:auto` — JS'teki
  `autoGrowTextarea()`/`autoGrowAll()` yazdıkça `scrollHeight`'e göre
  büyütüyor (global `input` dinleyicisiyle), 280px sonrası kaydırmaya
  geçiyor. `resize:vertical` bilinçli olarak kaldırıldı — otomatik
  büyümeyle birlikte kullanıcının elle sürüklediği boyut bir sonraki
  tuşta sıfırlanıp kırık bir davranış üretirdi. Var olan bir kayıt açılıp
  içine önceden yazılmış uzun metin geldiğinde de doğru boyunun baştan
  görünmesi için her ilgili `open*Modal()`'ın (Tune/UC/Hunt/Olay Raporu,
  15 fonksiyon) ve her liste `render*()`'ının sonuna `autoGrowAll()`
  eklendi — `input` olayı sadece yazarken tetiklenir, `innerHTML` ile
  basılan/`.value=` ile doldurulan mevcut içerik için ayrıca çağrı gerekti.
- **İki adımlı ekleme (yaz → onayla → yerleş):** "+ Ekle" artık kalıcı
  açık bir kutu değil, önce bir yazma alanı + İptal/Ekle butonu gösteriyor;
  onaylanınca madde düz/temiz bir "yerleşmiş" görünüme geçiyor (kalın
  başlık + metin, ya da "isim — tür" gibi listeye özgü bir özet), kalem
  ikonuyla tekrar düzenlenebiliyor. Tek, paylaşılan bir state machine
  (`makeListEditState`/`listEditBeginNew`/`listEditBeginEdit`/
  `listEditConfirm`/`listEditSettleActive`/`listRemoveItem`/
  `renderComposeRow`, `app.js`) 6 listenin hepsinde kullanıldı — her
  listenin kendi alan şekli (başlık+metin, metin+görsel, isim+tür, düz
  metin) ve kaydetme/doğrulama mantığı aynen korundu. Düzenleme durumu
  **hiçbir zaman** dizi elemanlarının içine yazılmadı (ayrı `_*Edit`
  nesnelerinde tutuldu) — bu sayede backend'e giden veri şekli hiç
  değişmedi, `app.py`'de tek satır bile dokunulmadı.
  MITRE teknik notları hibrit: id/taktik/teknik başlığı bugünkü gibi
  seçimle sabitleniyor, sadece `method` (yöntem notu) alanı bu davranışı
  aldı — opsiyonel olduğu için onaylama hiçbir zaman engellenmiyor.
- **Bulunan/düzeltilen iki gerçek hata (uygulamadan önce, kod okuyarak ve
  test ederek):**
  1. Düz string listelerinde (Öneriler/Zafiyetler) paylaşılan snapshot
     mantığı `{ ...string }` yapıyordu — bu bir string'i karakter
     dizisine çeviriyor, İptal ile geri dönüşü bozuyordu. String'ler
     immutable olduğu için `typeof` kontrolüyle obje değilse doğrudan
     referans alınacak şekilde düzeltildi.
  2. `openIncidentCreateModal()`/`openIncidentEditModal()` ve Hunt'ın 4
     liste yükleme noktası, yeni state machine'i hiç kullanmadan diziyi
     doğrudan dolduruyordu — bu, yeni bir olay raporu açıldığında ilk
     bölümün "boş" bir SETTLED satır olarak görünmesine (yazma kutusu
     hiç açılmadan) sebep oluyordu. Her ilgili `open*` fonksiyonuna
     `_*Edit = makeListEditState()` sıfırlaması ve (Olay Raporu Bölümleri
     için, tek zorunlu liste) `listEditBeginNew` ile ilk satırın gerçekten
     compose modunda açılması eklendi.
- **Doğrulandı:** gerçek tarayıcıda DOM/state incelemesiyle (ekran görüntüsü
  bu ortamda güvenilmez, `requestAnimationFrame`'in gizli pane'de hiç
  tetiklenmediği doğrulanıp piksel bazlı büyüme ölçümü yerine mantık
  doğrulamasına geçildi) — Olay Raporu Bölümleri: yeni rapor açılışında
  compose kutusu geliyor, yazıp onaylayınca settled'a dönüyor, kalemle
  tekrar açılınca eski değerler geliyor, değiştirip İptal'e basınca ESKİ
  değere dönüyor (rollback), boşken onaylamak satır içi hata veriyor,
  "+ Ekle" sonra İptal taslağı tamamen kaldırıyor. Etkilenen Varlıklar:
  "isim — tür" doğru yerleşiyor. Hunt Önerileri (düz string): aynı
  rollback akışı string'lerde de doğru çalışıyor (yukarıdaki 1. hatanın
  düzeltmesi doğrulandı). Hunt MITRE: teknik başlığı sabit kalıp sadece
  yöntem notu compose/settled arasında geçiş yapıyor. Gerçek bir olay
  raporu oluşturulup (bölüm + varlık, compose→onayla akışıyla) kaydedilip
  DB'de `sections`/`affected_assets` alanlarının tamamen temiz kaldığı
  (index/snapshot/error gibi yabancı bir anahtar sızmadığı) doğrulandı.
  `app.js` `v45`'e, `styles.css` `v11.17`'ye yükseltildi. Test hesabı/
  kaydı temizlendi (audit_log'a dokunulmadı), audit zinciri geçerli
  (264 kayıt, 264 zincirli).

### Takip (2026-09-08) — Kolon sürükleme, varsayılan tarih filtresi, renk/okunabilirlik, kutu tasarımı

Kullanıcı uygulamayı kendi tarayıcısında test ederken 4 ayrı iyileştirme
istedi; hepsi tek planda araştırılıp (3 paralel Explore ajanı: renk
token'ları, filtre mimarisi, compose-row CSS'i) uygulandı.

- **Kolon genişliği sürükleme hatası** — kök neden: tablolar
  `table-layout:fixed` ama kolonlar karışık `%`/`px` genişlikte tanımlıydı;
  tek bir kolonu px'e sabitlemek diğer `%` kolonların tabloyu yeniden
  bölüşmesine yol açıyordu (alakasız kolonlar oynuyordu).
  `makeColumnsResizable()`'ın `mousedown` handler'ının başına, o tablodaki
  TÜM kolonların o anki genişliğini px'e sabitleyen bir döngü eklendi —
  sürükleme başladığı an tablo tam deterministik hale geliyor, sadece
  sürüklenen kolon değişiyor. Sadece `app.js`, CSS'e dokunulmadı.
- **Varsayılan tarih filtresi (son 6 ay):** Tune/UC/Hunt/Olay Raporu
  tablolarının hepsi client-side'a `withinLastMonths(created_at, 6)`
  filtresi eklendi (mevcut arama/kolon-filtresi zincirine katılan bir
  adım daha) — backend'e dokunulmadı, veri zaten tamamen client'a geliyordu.
  Her filtre çubuğuna sessiz bir gizleme olmasın diye durumu gösteren VE
  kaldıran tek bir "Tümünü Göster" / "Son 6 Aya Dön" toggle butonu eklendi.
  Kullanıcı zaten var olan ay/ortam/durum filtresini uygulayıp
  "Filtrele"ye basarsa kapak otomatik kalkıyor (`xShowAll=true`) — yoksa
  eski bir ayı bilerek seçtiğinde 6 aylık kapak sonucu saklardı. "Temizle"
  kapağı varsayılana döndürüyor.
- **Renk paleti ve tablo başlığı düzeltmeleri** — kapsamlı bir yeniden
  tasarım değil, ölçülmüş bir okunabilirlik sorunu + Explore ajanının
  bulduğu gerçek hatalar: `.table th` `color:var(--text-3)` (kontrast
  ~2.3:1, WCAG AA'nın yarısından az) arka plansız haldeyken `var(--text-2)`
  + `background:var(--bg-tertiary)`'e çevrildi. `:root`'ta hiç
  tanımlanmamış (görünmez/varsayılana düşen) 7 CSS değişkeni gerçek
  token'lara bağlandı: `--bg-1`→`--bg-tertiary`, `--accent-blue`→`--blue`,
  `--accent-green`→`--green`, `--danger`→`--red`, `--border-subtle`→
  `--border`, `--text-muted`→`--text-2`, `--text-primary`→`--text-1`.
  `FREQ_CLS`'in ürettiği `freq-medium` sınıfı hiç CSS'te yoktu ("Orta"
  sıklık rozeti renksiz çıkıyordu) — CSS'teki `.freq-mid` `.freq-medium`
  olarak yeniden adlandırıldı. `--accent-orange` (== `--amber`, ayrı bir
  token) kaldırıldı, 11 inline kullanım `--amber`'e çevrildi. Audit zinciri
  doğrulama kutusu ve yedek silme ikonu tema dışı renk/inline stil yerine
  gerçek token'lara/`.btn-icon.danger` sınıfına bağlandı.
- **Kutu içi düzen — kullanıcıya iki mockup gösterilip seçilen yön
  ("belirgin düzenleme + hover"):** Aktif düzenlenen satır (`.compose-row`)
  artık `--accent` renginde sol kenarlık + `--bg-secondary` zeminle
  vurgulanıyor (tek taraflı kenarlıkla köşe çakışmasın diye sol köşeler
  keskin). Yerleşmiş (settled) satırlardaki kalem/sil ikonları varsayılan
  gizli, sadece satırın üzerine gelince beliriyor (Notion/Linear tarzı,
  daha sade bir liste görünümü) — `renderComposeRow()` paylaşılan
  fonksiyon olduğu için bu CSS değişikliği 6 listenin hepsine otomatik
  yayıldı. Şimdiye kadar hiçbir compose alanı etiket kullanmıyordu (sadece
  placeholder metni) — Bölümler/Etkilenen Varlıklar/Öneriler/Zafiyetler/
  MITRE yöntem notu alanlarına mevcut `.form-group`/`.form-label` deseniyle
  etiket eklendi.
- **Doğrulandı:** `node -c`/Jinja2 sözdizimi kontrolleri; gerçek tarayıcıda
  — kolon dondurma: tek bir `mousedown` dispatch'i TÜM kolonların
  `style.width`'ini gerçek piksel değerlerine sabitlediği doğrulandı
  (bu ortamda pixel-bazlı sürükleme testi güvenilmez olduğundan, önceki
  oturumlarda kurulan desene uyularak state/DOM incelemesine geçildi);
  tarih filtresi — mevcut bir olay raporunun `created_at`'i geçici olarak
  6 aydan eski bir tarihe çekilip varsayılanda gizlendiği, "Tümünü
  Göster"le çıktığı, sonra orijinal değere geri döndürüldüğü doğrulandı
  (audit_log'a dokunulmadı); Filtrele/Temizle ile `xShowAll` doğru
  set/reset oluyor; tablo başlığı `computed style` ile `#1C1C1C`/`#888888`
  render ettiği doğrulandı; kutu tasarımı — yeni bölüm eklerken
  `.compose-row`'un doğru kenarlık/zemin/köşe değerleriyle geldiği, onay
  sonrası settled satırın etiketi doğru gösterdiği, aksiyon ikonlarının
  varsayılan `opacity:0` olduğu doğrulandı. `app.js` `v46`'ya, `styles.css`
  sürüm sorgu dizesi `v11.18`'e yükseltildi. Audit zinciri geçerli (270
  kayıt, 270 zincirli).
- **Ek not:** `design-system/` klasörü (uygulamanın taşınabilir UI kiti,
  `soc-ui.css`/`soc-ui.js` — başka projelere kopyalanmak için, uygulamanın
  kendisi tarafından kullanılmıyor) bu turdaki iki uygulanabilir düzeltmeyi
  de aldı: kolon sürükleme dondurma mantığı (`soc-ui.js`) ve tablo başlığı
  kontrast/arka plan + `.freq-mid`→`.freq-medium` (`soc-ui.css`). Kit ayrı
  bir geçici sunucuda (python http.server) gerçek tarayıcıda doğrulandı.
  Kitin `.list-item-row`'u hâlâ 2026-09-07/08'deki compose/settled iki
  adımlı ekleme özelliğinden önceki (tek adımlı, hep açık kutu) hâlde —
  bu daha büyük, ayrı bir taşıma kararı olduğu için bu turda kapsam dışı
  bırakıldı, kullanıcıya bildirildi.

### Takip (2026-09-08) — Detay kutucukları (Tune/UC/Hunt/Incident) kapsamlı yeniden düzenleme

Kullanıcı satıra tıklayınca açılan read-only "detay" modallarını —
özellikle Use-Case ve Threat Hunt'takini — kapsamlı ele almamı istedi. Tek
bir Explore ajanıyla 4 modülün detay fonksiyonları/CSS'i tam çıkarıldı:
`openHuntDetail()`'de ~20 dağınık inline `style="..."` (aynı "etiket
satırı" deseni 3 kez, "numaralı liste" deseni 2 kez kopyala-yapıştır),
`.detail-section` sınıfının hiç CSS'i olmaması (satırlar arası boşluk
sıfırdı), iki ayrı (biri ölü, terk edilmiş bir "slide-over panel"
tasarımından kalma) `.detail-row`/`.detail-grid`/`.detail-title` tanımı,
modal genişliğinin tutarsız olması (Tune/UC/Hunt 720px, Incident 860px),
ve kapatma mantığının tutarsız olması (Incident kendi fonksiyonunu
kullanırken diğer 3'ü HTML'e gömülü tekrarlı inline closure kullanıyordu,
ayrıca Incident dış tıklamayla kapanma listesinde hiç yoktu — gerçek bir
tutarsızlık). Kullanıcıya bir mockup (gruplu bölümler + başlıkta durum
rozeti + temiz numaralı liste) gösterildi, onaylandı; Tune/UC/Hunt'a
Olay Raporu gibi durum-bazlı aksiyon kısayolları eklenmesi ayrıca
soruldu — istenmedi, kapsam sadece bilgi gösterimi ile sınırlı tutuldu.

- **Paylaşılan CSS temizliği**: ölü `.detail-overlay`/`.detail-panel`/
  `.detail-header`/`.detail-body`/`.detail-image`/`.detail-title` bloğu
  silindi (`.detail-section-title` tek canlı tanımı olarak korundu).
  `.detail-section { display:flex; flex-direction:column; gap:8px; }`
  eklendi. `.detail-section-title:not(:first-child) { margin-top:16px; }`
  ile bir bölümün ilk başlığı normal, ikinci+ başlıkları otomatik ayrışıyor
  — `openHuntDetail`/`openIncidentDetail` içindeki 6+ elle yazılmış
  `style="margin-top:12px/8px"` kaldırıldı. Yeni `.detail-tag-row`
  (Ortam/MITRE/IOC etiket satırlarının 3 kez kopyalanan inline stilinin
  yerine) ve `.detail-list-row`/`.detail-list-index` (Öneriler/Zafiyetler/
  Bulgular numaralı listelerinin yerine) eklendi. 3 yerdeki gereksiz
  `style="white-space:pre-wrap"` kaldırıldı (`.detail-value` zaten
  sağlıyor). `.modal-detail` (720px) kaldırıldı, 4 detay modalı da artık
  `.modal-wide` (860px) kullanıyor.
- **Kapatma tutarlılığı**: `closeTuneDetailModal()`/`closeUCDetailModal()`
  eklendi (Incident'ın deseniyle aynı), HTML'deki tekrarlı inline
  closure'lar bunlara çevrildi; Hunt'ın zaten var olan
  `closeHuntDetailModal()`'ı HTML'e de bağlandı. `incident-detail-modal`
  dış-tıklamayla-kapanma listesine eklendi (gerçek bir tutarsızlık
  düzeltmesi — diğer 3'ü zaten kapanıyordu).
- **Tune & UC**: tek düz `.detail-grid` duvarı, 4 mantıksal bölüme
  ayrıldı (Genel Bilgiler / Ön Onay [koşullu] / Tune-Kural Detayları /
  Son Onay [koşullu]) — `detailRow()` helper'ı ve backend'e giden hiçbir
  şey değişmedi, sadece hangi `.detail-grid`'e düştüğü değişti.
- **Hunt**: aynı mantık (JSON parse/hazırlama) korunarak render madde 1'in
  yeni sınıflarını kullanacak şekilde yeniden yazıldı; "Genel Bilgiler"
  de artık Tune/UC gibi 2 kolonlu bir `.detail-grid`, "Ön Onay"/"Sonuç
  Onayı" koşullu olarak ayrıldı; "Rapor" bölümü (karışık içerik tipleri
  — etiketler/listeler/görseller grid'e uymadığı için) tek kolon akışta
  kaldı, sadece yeni sınıflarla temizlendi.
- **Incident**: en az dokunulan — sadece artık gereksiz inline
  `margin-top`/`white-space:pre-wrap`'ler kaldırıldı, görsel galerisi
  var olan `.detail-images` sınıfına bağlandı.
- **4 modalın hepsine** başlığın yanına durum rozeti eklendi (mevcut
  `TUNE_CLS`/`UC_CLS`/`HUNT_CLS`/`INCIDENT_CLS` haritaları ve zaten var
  olan `badge()` helper'ıyla, yeni kod yok).
- **Doğrulandı**: geçici debug hesabıyla gerçek tarayıcıda 4 modülün
  hepsi — durum rozetlerinin doğru göründüğü, koşullu bölümlerin
  (örn. onaylanmamış bir UC'de "Ön Onay" bölümünün hiç çıkmadığı, bir
  Hunt'ta hem "Ön Onay" hem "Sonuç Onayı" bölümlerinin göründüğü) doğru
  render edildiği, `.detail-section-title` boşluğunun ilk/sonraki
  başlıkta doğru (4px/16px) hesaplandığı, Incident'ın dış tıklamayla artık
  kapandığı, Tune/UC'nin yeni kapatma fonksiyonlarının çalıştığı
  doğrulandı. `app.js` `v47`'ye, `styles.css` sürüm sorgu dizesi
  `v11.19`'a yükseltildi. Bu iş salt frontend/görünüm olduğu için
  audit_log'a hiç yazılmadı; zincir yine de kontrol edildi, geçerli
  (271 kayıt, 271 zincirli).

### Takip (2026-09-08) — Uygulama geneli filtreleme düzeltmeleri

Kullanıcı "filtrelemede hata var mı bak" dedi. 3 paralel Explore ajanı +
bizzat gerçek verilerle yapılan canlı tarayıcı testleriyle 4 modülün
(Tune/UC/Hunt/Incident) hepsini etkileyen birkaç gerçek hata bulundu ve
düzeltildi:

- **Arama/kolon filtreleri görünen adı değil ham kullanıcı adını
  arıyordu.** Tabloda `displayName()` ile "Ahmet Yılmaz" gösterilirken
  arama/filtre hep ham `username`'e bakıyordu — kullanıcı gördüğü ismi
  aratınca 0 sonuç alıyordu. Yeni `fieldMatchesTerm()` yardımcısı hem ham
  değeri hem `displayName()`'i dener; `matchesColumnFilters()`'a da aynı
  mantık eklendi. Canlı testte doğrulandı: bir kullanıcıya geçici
  `full_name` verilip görünen adla arama yapıldı, doğru kayıtlar çıktı.
- **Türkçe büyük/küçük harf.** Arama/filtre yolları düz `.toLowerCase()`
  kullanıyordu — "İstanbul" içeren bir kayıt düz "istanbul" aramasıyla
  bulunamıyordu (İ, `.toLowerCase()`'de "i" + görünmez bir kombine nokta
  karakterine ayrılıyor). Yeni `trLower()` yardımcısı SADECE İ'yi hedefli
  düzeltiyor (`.replace(/İ/g,"i")` sonra `.toLowerCase()`) — tam Türkçe
  locale'ine (`toLocaleLowerCase("tr")`) bilerek GEÇİLMEDİ, çünkü o da düz
  ASCII "I"yı "ı"ya çevirip İngilizce/teknik terimlerde ("MITRE", "UNIQUE"
  gibi) aramayı bozuyordu — bu regresyon uygulamadan önce canlı testte
  yakalanıp düzeltildi.
- **"Temizle" kolon filtrelerini hiç sıfırlamıyordu** (bizzat doğrulandı,
  4 modülün hepsinde) — artık `clearXFilters()`'ların hepsi `_colFilters`'ı
  da sıfırlıyor.
- **Varsayılan 6 aylık filtre, aktif arama/kolon filtresiyle TAM eşleşen
  eski bir kaydı bile gizliyordu** (bizzat doğrulandı) — hem "kayıt
  yokmuş gibi" görünmesine hem kolon filtresi dropdown'ının 6 ay dışı bir
  değeri sunup sonra "0 sonuç" vermesine yol açıyordu. Düzeltme: 6 aylık
  kapak sadece HİÇBİR arama/kolon filtresi aktif değilken uygulanıyor —
  kullanıcı bir şey arıyorsa/filtreliyorsa tarih kısıtlaması devre dışı
  kalıyor, `xShowAll`'a dokunmadan (varsayılan görünüm hâlâ 6 ayla sınırlı
  kalmaya devam ediyor).
- **Threat Hunt'ta ortam filtresi tamamen kırıktı** — `/api/hunt` yanlış
  kolonu (`environment` — her zaman boş) sorguluyordu, gerçek veri
  `hunt_environment`'ta; ayrıca çoklu-seçim olduğu için `=` değil `INSTR`
  gerekiyordu (UC'nin zaten kullandığı desen). Filtre çubuğundaki
  `hunt-filter-status-env` select'i doğru dolduruluyordu ama gizliydi ve
  hiç okunmuyordu — görünür yapılıp `hunt-filter-env` olarak (diğer 3
  modülle tutarlı isim) yeniden adlandırıldı, `loadHunt()`/
  `clearHuntFilters()`'a bağlandı. Canlı testte doğrulandı: gerçek bir
  ortam seçilince doğru 3 kayıt geldi.
- **Kolon filtrelerinde "seçim" tipi de aslında "içerir" eşleşmesi
  yapıyordu** — "PROD" seçince "PROD-DR" sızabiliyordu, UC'nin çoklu-
  seçim ortamında sıra farkı ("DEV,PROD" ≠ "PROD,DEV") eşleşmeyi
  bozuyordu, Incident'ın `_affected_asset_types` gibi virgülle birleşik
  alanlarında tek başına hiç görünmeyen bir değer dropdown'da seçilemez
  hale geliyordu. `matchesColumnFilters` artık seçim tipi için hücreyi
  virgülle ayırıp üye-eşleşmesi yapıyor; `buildColumnFilterRow` da
  dropdown seçeneklerini birleşik string yerine ayrı değerler olarak
  üretiyor. Canlı testte doğrulandı: çoklu tür içeren bir olay
  raporunda tek bir türü seçince doğru eşleşti, dropdown'da türler ayrı
  ayrı listelendi.
- Tune aramasına Case No, Incident aramasına rapor bölüm metni ve
  etkilenen varlık türü eklendi.
- **Kritik not:** İlk `trLower()` denemesi tam Türkçe locale kullanıyordu
  ve canlı testte "UNIQUE" gibi düz İngilizce kelimeleri bozduğu (ASCII
  "I"yı "ı"ya çevirip arama terimiyle eşleşmemesine yol açtığı)
  tespit edilip düzeltildi — uygulamadan önce yakalanan gerçek bir hata.
- **Doğrulandı:** tüm düzeltmeler geçici debug hesabıyla, gerçek verilerle
  (gerekli yerlerde geçici SQL ile eski tarihli/çoklu-değerli test
  kayıtları oluşturup hemen sonra geri alınarak, audit_log'a hiç
  dokunulmadan) canlı tarayıcıda test edildi. `node -c`/`py_compile`
  sözdizimi kontrolleri geçti. Audit zinciri geçerli (271 kayıt, 271
  zincirli — bu iş salt frontend/backend sorgu mantığı, audit_log'a
  hiç yazmıyor).

### Takip (2026-09-08) — Dashboard'a Olay Raporu eklendi + sadeleştirme

Bir Explore ajanının tam envanteriyle Dashboard'da şu gerçek durum tespit
edildi: Olay Raporu modülü Dashboard'da (KPI kartı/onay listesi/son
talepler/trend) hiç yoktu — diğer 3 modülün hepsinde var, kasıtlı
olduğuna dair hiçbir not yoktu; Threat Hunting kartı 11 sayı gösterip
tüm-zamanlar/bu-ay metriklerini ayrım olmadan karıştırıyordu; kıdemli
olmayan kullanıcıda "Bana Bekleyen İşler" panelinin yarısı boş kalıyordu.

- **Olay Raporu KPI kartı** (4. kart) eklendi: `get_kpi()`'a Tune/UC/Hunt
  ile aynı `count()`/`count_all()` deseninde Açıldı/İncelemede/Onay
  Bekliyor/Kapandı sayıları + zaten var olan `get_incident_stats()`
  (toplam + etkilenen varlık toplamı) eklendi. `.kpi-modules` grid'i
  3'ten 4 sütuna çıkarıldı (dar ekranlarda 2'ye, çok darda 1'e düşen
  responsive kural eklendi — trend kartlarıyla aynı desen).
- **"Onayımı Bekleyenler" paneline Incident eklendi** (senior-only, tek
  onay kapısı — `_INCIDENT_GATE`). "Üzerimdeki İşler"e eklenmedi —
  Incident'ın Tune/UC/Hunt'taki gibi kalıcı bir "atanan analist" kolonu
  yok (RBAC'ta İncelemede'ye herhangi bir kullanıcı geçebiliyor), sahte
  bir alan icat etmek yerine bu kısım kapsam dışı bırakıldı.
  **Uygulamadan önce kod okuyarak bulunan kritik bir hata**:
  `renderMyWorkList()`'in durum-rozeti class map'i (`clsMap`) sadece
  tune/usecase/hunt içeriyordu, incident yoktu — bir Incident öğesi
  listeye girer girmez `badge(status, undefined)` çağrısı JS hatası
  fırlatıp PANELİN TAMAMINI boş bırakırdı. `incident: INCIDENT_CLS`
  eklenerek düzeltildi, canlı testte bir olay raporu geçici olarak "Onay
  Bekliyor"a alınıp panelin hatasız render ettiği doğrulandı.
- **"Son Olay Raporları" mini-tablosu** eklendi (4. `dash-section`,
  diğer 3'le birebir aynı desen). `.dashboard-row` de 4 sütuna çıkarıldı.
- **Trend sparkline'larına Incident bilinçli olarak eklenmedi** —
  `incident_reports`'ta `completed_at` kolonu yok, `validated_at` hem
  "İncelemede'ye geri gönder" hem "Kapat" aksiyonlarında set edildiği
  için "Kapanan" serisi için güvenilir değil; yanlış veri göstermektense
  bu bölüm dışarıda bırakıldı.
- **Sadeleştirme:** kıdemli olmayan kullanıcıda onay sütunu gizlenince
  "Üzerimdeki İşler" artık tüm genişliği kullanıyor (yeni
  `.mywork-single-col` sınıfı, `loadMyWork()`'te `IS_SENIOR`'a göre
  takılıyor) — önceden yarısı boş kalıyordu. Threat Hunting kartındaki
  tüm-zamanlar metrikleri artık "(tüm zamanlar)" ibaresiyle, "Toplam
  Süre" bir ay seçiliyken "(bu ay)" ibaresiyle etiketleniyor. Toplamı
  sıfır olan herhangi bir KPI kartının altına (istatistik kutuları
  korunarak) küçük bir "Henüz kayıt yok" notu ekleniyor.
- **Doğrulandı:** geçici debug hesaplarıyla (biri Müdür/senior, biri
  Analist/non-senior) canlı tarayıcıda — 4 kartın da doğru sayılarla
  geldiği, bir olay raporu geçici olarak "Onay Bekliyor"a alınınca
  Onayımı Bekleyenler panelinin hatasız (konsol hatasız) render ettiği ve
  `goToItem('incident',...)` ile doğru sekmeye/detaya gittiği, non-senior
  hesapta tek sütun genişliğinin doğru hesaplandığı (computed
  `grid-template-columns` tek değer döndü) doğrulandı; ekran görüntüsüyle
  4 kartın/4 trend kartının/4 son-talep tablosunun 1300px genişlikte
  düzgün sığdığı görüldü. `node -c`/`py_compile`/Jinja2 kontrolleri
  geçti. Audit zinciri geçerli (271 kayıt, 271 zincirli).

### Takip (2026-09-08) — Excel ve Incident PDF'ine Olay Raporu eklendi

Bir Explore ajanı Excel export'unun ve PDF şablonlarının güncelliğini
tarayınca en somut eksik ortaya çıktı: Olay Raporu, Excel'de sadece KPI
Özeti'ndeki 2 toplam sayı olarak vardı — Tuning/UC/Hunt'ın hepsinin kayıt
bazlı kendi sayfası olduğu halde Incident'ın hiç yoktu. Ayrıca Incident
PDF'i "Etkilenen Varlıklar" alanını (uygulamada ve Excel KPI özetinde
zaten var olan bir alan) hiç göstermiyordu — hem route hem şablon
seviyesinde eksikti. (Hunt Excel/PDF'teki daha küçük eksiklikler —
"Öneriler" kolonunun ham JSON çıkması, PDF'te Notlar/Rapor Güncelleme
eksikliği — kullanıcı tarafından bu turda bilinçli olarak kapsam dışı
bırakıldı.)

- **Excel'e "Olay Raporları" sayfası eklendi** (Threat Hunt Talepleri'nden
  hemen sonra, KPI Özeti'nden önce — 4 modülün per-record sayfaları bir
  arada) — ID/Başlık/Case No/Ortam/Raporlayan/Durum/Etkilenen
  Varlıklar/Talep Tarihi/İşlemi Yapan/İşlem Tarihi/İşlem Notu kolonları,
  diğer sayfaların kullandığı aynı yardımcılarla (`gv`/`fmt_date`/
  `display_name`/`write_headers`/`auto_width`) tutarlı.
- **Incident PDF'ine "Etkilenen Varlıklar" bölümü eklendi** — "Olay
  Detayları" ile "Görseller" arasına, uygulamanın kendi detay
  modalındaki `isim (tür)` formatıyla birebir aynı.
- **Doğrulandı** — statik kontrollerin ötesinde gerçek dosyalar üretilip
  incelendi: geçici debug hesabıyla `/api/export`'u doğrudan indirip
  openpyxl ile açıldı, yeni sayfanın doğru sırada ve (çoklu varlıklı bir
  test kaydıyla) "PC-01 (Makine/Bilgisayar), user1 (Kullanıcı Hesabı)"
  gibi doğru biçimlendirilmiş satırlar ürettiği doğrulandı; aynı test
  kaydı için gerçek bir Incident PDF'i indirilip (bu makinede kurulu özel
  WeasyPrint exe ile üretildi) PyMuPDF ile metni çıkarılarak "ETKİLENEN
  VARLIKLAR" başlığının ve varlık listesinin Olay Detayları ile
  Görseller arasında doğru konumda göründüğü teyit edildi. Test verisi
  geri alındı, debug hesabı silindi. `py_compile`/Jinja2 kontrolleri
  geçti. Audit zinciri geçerli (272 kayıt, 272 zincirli — artış PDF
  export testinin kendisinin ürettiği gerçek, meşru bir `EXPORT_INCIDENT_
  PDF` audit kaydından, audit_log'a hiç elle dokunulmadı).

### Takip (2026-09-08) — Daraltılabilir sidebar

Kullanıcı sol navigasyonun daraltılıp genişletilebilmesini istedi —
daraltılınca sadece ikonlar görünüp çalışma alanı genişlesin.

- `.sidebar`'a bir `.collapsed` durumu eklendi (210px → 52px, `width`
  geçişi animasyonlu). Logo yazısı, madde etiketleri (Dashboard/Kural
  Tuning/vb.), kullanıcı adı, arama kutusu ve sürüm satırı daraltılmış
  halde gizleniyor; her nav butonuna zaten `title` eklendi ki üzerine
  gelince (tooltip) hangi sayfa olduğu görünsün. Tercih `localStorage`'a
  yazılıyor (`toggleSidebar()`), sayfa yeniden açılınca korunuyor.
  Daraltma butonunun oku (‹) CSS `transform:rotate(180deg)` ile yön
  değiştiriyor, ayrı bir ikon/metin yönetimine gerek kalmadı.
- **Uygulamadan önce koddan bulunan gerçek bir hata**: sekme geçiş
  listener'ı `document.querySelectorAll(".nav-btn")` ile TÜM
  `.nav-btn` sınıflı elemanlara bağlanıyordu — ama "Çıkış" linki de
  (ve şimdi yeni daraltma butonu da) aynı sınıfı görsel tutarlılık için
  kullanıyor, `data-tab` özniteliği olmadan. Tıklanınca
  `document.getElementById("tab-undefined")` `null` dönüp
  `.classList.add()` çağrısı JS hatası fırlatıyordu — "Çıkış" linkinde
  zararsızdı (sayfa zaten `/logout`'a gidiyordu) ama yeni daraltma
  butonunda ÇALIŞAN sekmenin `active` sınıfını kaybedip hiç geri
  koymayacağı, dolayısıyla tüm içerik alanının boş kalacağı bir
  senaryo olurdu. Seçici `.nav-btn[data-tab]`'e daraltılarak düzeltildi.
- **Doğrulandı:** gerçek tarayıcıda ekran görüntüsüyle (bu ortamda
  `getComputedStyle().width` daraltılmış halde bile eski değeri
  döndürüyordu — daha önce bu oturumda kurulan "pane görünür değilken
  layout'a bağlı computed-style'lar güvenilmez" desenine uyularak
  ekran görüntüsüne geçildi, sidebar'ın gerçekten sadece ikonlara
  daraldığı doğrulandı) daraltma/genişletme, sayfa yenilemesinde
  tercihin korunduğu, ve `.nav-btn[data-tab]`/`.nav-btn:not([data-tab])`
  sayımlarının (7/2) beklenen ayrımı doğru yaptığı doğrulandı. Konsol
  hatasız. `node -c`/Jinja2 kontrolleri geçti. `app.js` `v48`'e,
  `styles.css` sürüm sorgu dizesi `v11.20`'ye yükseltildi.

### Takip (2026-09-11) — Composio tema katmanı

Kullanıcı, `tema/` klasöründe hazırlanmış (design skill ile üretilmiş
mockup + marka analizi) yeni "Composio" görünümüne geçişi istedi. Kural:
hiçbir class/id/DOM yapısı değişmeyecek, tüm değişiklik ayrı bir CSS
katmanında kalacak — geri alması tek `<link>` satırını silmek kadar basit
olacak.

- `tema/soc-theme-composio.css` → `static/soc-theme-composio.css` (asıl
  çalışan dosya) ve `design-system/soc-theme-composio.css` (taşınabilir
  kit ile tutarlılık için, `soc-ui.css`'in yanına) kopyalandı. Bu dosya
  yalnızca `:root` token'larını (`--bg`, `--text-1/2/3`, `--accent` vb.)
  ve birkaç ek seçiciyi ezer; `static/styles.css`'e dokunulmadı.
- `templates/index.html` ve `templates/login.html` `<head>`'ine, mevcut
  `styles.css` satırından SONRA tema `<link>`'i (`?v=1` cache-bust) ve
  Inter+JetBrains Mono Google Fonts linki eklendi. `index.html`'de zaten
  var olan eski Inter-only font linki, yeni birleşik linkle değiştirildi
  (aynı ağırlıklar + JetBrains Mono eklendi, tekrar link kalmadı).
- `#tab-dashboard`'a `has-spotlight` sınıfı eklendi (tema dosyasındaki
  `::before` radial-gradient glow'u tetikliyor).
- **Kontrast düzeltmesi (asıl iş burasıydı):** İstem açıkça yasaklıyordu —
  yeni marka mavisi `#0007CD` koyu zeminde METİN olarak kullanılırsa
  kontrast 1.6:1'e düşüyor (WCAG AA eşiği 4.5:1). `static/styles.css`'i
  tarayınca `--accent`'in salt DOLGU (buton/checkbox/odak kenarlığı)
  dışında, doğrudan `color:` olarak da kullanıldığı 7 seçici bulundu:
  `.tag`, `.mitre-tag`, `.role-analyst`, `.status-reviewing`,
  `.audit-login`, `.range-toggle-active`, `.cell-link:hover` ve
  `.settings-subtab-btn.active`'in metin rengi. Bunların hepsi
  `styles.css`'e dokunmadan tema dosyasında `--blue` (#60A5FA — projede
  zaten var olan, WCAG uyumlu ikincil mavi) ile yeniden renklendirildi;
  `--accent` yalnızca buton dolgusu/aktif-sekme alt çizgisi/odak
  kenarlığı/checkbox'ta (istemin izin verdiği roller) kaldı.
- Sidebar/login logosundaki kalkan ikonu inline `fill="#5E6AD2"`
  (eski accent) kullanıyordu — HTML'e dokunmadan, CSS'in presentation
  attribute'unu ezme kuralından yararlanılıp `.sidebar-logo-icon
  path:first-child` / `.login-logo-icon path:first-child` için
  `fill: var(--accent)` eklendi; ikinci path (beyaz onay işareti)
  dokunulmadan kaldı.
- **Doğrulandı:** gerçek tarayıcıda admin ile giriş yapılıp dashboard,
  kural tuning (liste + detay modalı), use-case (liste + yeni-talep
  compose modalı, form odak durumu), threat hunting (liste + detay
  modalı, kolon-görünürlük dropdown'u), olay raporları, ayarlar (Genel +
  XSOAR Entegrasyonu alt-sekmeleri, kullanıcı rol rozetleri), audit log
  (zincir doğrulama sonucu dahil) tek tek gezildi — konsolda hiç hata
  yok. Yukarıdaki 8 seçicinin tema dosyasındaki override'ı CSSOM
  üzerinden (`document.styleSheets`) doğrudan okunarak her birinin
  gerçekten `--blue`'ya döndüğü, `.settings-subtab-btn.active` ve
  `.role-analyst`'in computed `color` değerinin `rgb(96, 165, 250)`
  olduğu doğrulandı. Tablet genişliğinde (768px) dashboard'daki
  spotlight glow'un `.page-content`'in `overflow-x:hidden`'ına
  takılıp yatay kaydırma çubuğu yaratmadığı doğrulandı.
- `templates/report.html`, `incident_report_print.html`,
  `hunt_report_print.html`'e dokunulmadı — PDF çıktıları isteğe uygun
  şekilde ayrı, beyaz kağıt temalı kalmaya devam ediyor.
- Kapsam dışı bırakılanlar (mockup'ta var, ayrı geliştirme gerektirir):
  sidebar'ın ikon-moduna daraltılması (bu zaten önceki bir turda ayrı
  yapıldı, ayrıca bkz. bir üstteki "Daraltılabilir sidebar" girdisi),
  tablo sayfalama/kolon göster-gizle paneli, olay raporlarında
  tablo/kart görünüm geçişi, aylık PDF rapor şablonunun yenilenmesi.
- **Geri alma:** `templates/index.html` ve `templates/login.html`'deki
  tek `soc-theme-composio.css` `<link>` satırı silinirse eski görünüm
  aynen döner (token'lar dışında hiçbir class/DOM değişmediği için).

### Takip (2026-09-11) — Hunt Raporu PDF'i Composio tasarımına + Bütünlük hash'i

Kullanıcı Composio tema katmanından sonra `tema/` klasöründeki PDF
mockup'larını (`Hunt Raporu PDF.dc.html` vb., design skill ile üretilmiş)
beğenip PDF raporlarının da bu görsel dile taşınmasını istedi. Plan Mode
ile netleştirildi: kapsam Hunt+Olay Raporu+Aylık Rapor'un ÜÇÜ de, ve
mockup'taki "Bütünlük: <hash>" satırı gerçek bir özellik olarak
uygulanacak (bkz. plan dosyası). Bu girdi sadece **Faz A (backend) + Faz B
(Hunt şablonu)**'yi kapsıyor — Incident ve Aylık Rapor ayrı takip
girdileriyle gelecek.

- **Faz A — `report_integrity_hash()`** (app.py, `write_audit`'in yanına):
  `write_audit`'teki `audit_hash` ile AYNI gizli anahtarı
  (`AUDIT_CHAIN_SECRET`, `verify_audit.py`'den import edildi) kullanan ama
  zincire hiç eklenmeyen, tek bir raporun üretildiği anı imzalayan bir
  SHA-256 parmak izi. Girdi: rapor tipi + kayıt id + `generated` zaman
  damgası + raporun kaynak verisinin `json.dumps(sort_keys=True)` ile
  deterministik hâli. İlk 16 hex karakteri hem PDF footer'ına hem de
  `write_audit`'in `detail` alanına yazılıyor ki ikisi karşılaştırılıp
  raporun üretildiği andan beri değişmediği teyit edilebilsin. Yeni
  `EXPORT_MONTHLY_REPORT` aksiyonu `_ACTIVITY["system"]` listesine ve
  `app.js`'teki `ACTION_LABELS`/`ACTION_CLS` map'lerine eklendi (henüz
  hiçbir route bunu yazmıyor — Faz D'de gelecek).
- **Font:** Composio'nun Inter+JetBrains Mono'su tarayıcı sayfalarında
  (index/login) zaten Google Fonts CDN'den geliyordu, ama Hunt/Olay
  Raporu PDF'leri WeasyPrint ile SUNUCU tarafında üretiliyor — internete
  çıkamayabileceği için (mevcut Montserrat gibi) yerel `.ttf` dosyası
  gerekiyor. Kullanıcı onayıyla resmi kaynaklardan (rsms/inter ve
  JetBrains/JetBrainsMono GitHub release'leri, ikisi de SIL OFL lisanslı)
  Inter (Regular/Medium/SemiBold) ve JetBrains Mono (Regular/Medium)
  statik `.ttf`'leri indirilip `static/fonts/`'a Montserrat'la aynı
  desende eklendi (+ lisans dosyaları).
- **Faz B — `templates/hunt_report_print.html`** tamamen yeniden
  tasarlandı: header'da gerçek shield logosu (index.html'deki
  `.sidebar-logo-icon` ile birebir — mockup'ın iki tutarsız placeholder'ı
  yerine) + sınıflandırma etiketi (`HUNT-{yıl}-{id:03d} · Gizli /
  Dahili`, `hunt_report_pdf()`'te hesaplanıp template'e geçiliyor) + DIAS
  logosu; DIAS/eyebrow/H1 gövde girişi; mockup'taki 4-kolonlu bilgi
  tablosu deseni (Talep Eden/Analist/Ortamlar/Süre + Talep/Başlangıç/
  Tamamlanma/Sonuç); Jinja `namespace` ile otomatik numaralanan bölümler
  (`01 · Onay Süreci` [yeni, ayrı bölüm — mockup'ın tek-aşamalı örneğinde
  yoktu ama Hunt'ın gerçek iki-aşamalı onayı (Ön Onay + Sonuç Onayı) için
  gerekliydi, hiçbir alan/koşul kaybolmadan taşındı] → Hedef & Kapsam →
  MITRE → Bulgular → Detection Önerisi [artık `linked_uc`'nin gerçek
  açıklaması+durumuyla mockup'taki UC-kart deseninde] → Zafiyetler →
  Öneriler → boş olsalar bölüm hiç basılmıyor, numaralar hep ardışık
  kalıyor); imza bloğu (Hazırlayan/Onaylayan, yeni `user_tier()` yardımcı
  fonksiyonuyla `display_name()`'in yanına "· Kıdemli Analist" gibi tier
  ekleniyor); footer'da `Oluşturma` + `Bütünlük` hash. **Hiçbir mevcut
  alan/görsel/koşul kaldırılmadı** — sadece yeni görsel dille yeniden
  düzenlendi.
- **Doğrulandı:** gerçek WeasyPrint (`WEASYPRINT_EXE`) ile, gerçek
  veritabanı kayıtlarıyla (Hunt #7 — MITRE'siz/tek aşamalı örnek, Hunt #4
  — MITRE'li/notlu iki aşamalı onay örneği) PDF üretilip `pymupdf` ile
  sayfa görüntülerine çevrilerek incelendi: tüm bölümler, koşullu
  alanlar, MITRE tablosu, gömülü test görseli, imza bloğu (doğru
  tier'larla: "lowtier · Analist", "admin · Müdür"), sınıflandırma
  etiketi ve Bütünlük hash'i doğru render oluyor. Audit Log'da
  `EXPORT_HUNT_PDF` detail'indeki hash'in PDF footer'ındakiyle BİREBİR
  eştiği doğrulandı (`946d1e46908d458f`, `aa411fc39fe2dbf3`).
  `verify_audit.py`: 286/286 zincirli, geçerli (iki gerçek test
  indirmesi audit'e yazıldığı için kayıt sayısı arttı, zincir bozulmadı).

### Takip (2026-09-11) — Olay Raporu PDF'i Composio tasarımına + Bütünlük hash'i

Bir önceki Hunt PDF girdisinin devamı — aynı plan/tur, **Faz C**.
`templates/incident_report_print.html` aynı paylaşılan görsel dile
(header/footer/eyebrow/H1/bilgi tablosu/imza bloğu, `docs/PROGRESS.md`daki
Hunt girdisine bakınız) taşındı, `incident_report_pdf()` route'u
`classification_tag` (`OLAY-{yıl}-{id:03d} · Gizli / Dahili`),
`integrity_hash` ve `reporter_tier`/`approver_tier` (`user_tier()`) ile
güncellendi.

- **Bilgi tablosu**, Hunt'tan farklı olarak Incident'ın tek-aşamalı onay
  akışına uygun TEK tabloda toplandı (Hunt'taki gibi ayrı bir "Onay
  Süreci" bölümüne gerek yok — mockup'ın deseniyle birebir): 1. satır
  Case No (mono) / Ortam / Raporlayan / Durum (rozet), 2. satır
  Onaylayan / Onay Tarihi / Talep Tarihi / **Son Güncelleme**
  (`r.updated_at` — mevcut şemada zaten var olan ama print şablonunda
  hiç gösterilmeyen gerçek bir alan, tabloyu 8 hücreye tamamlamak için
  eklendi; uydurma veri değil). Onay Notu varsa 3. bir satır (colspan 4)
  olarak altına ekleniyor.
- `sections`/`assets`/`image_items` mantığı aynen korunup Jinja
  `namespace` sayaçlı numaralı bölümlere (`01 · Olay Detayları`,
  `02 · Etkilenen Varlıklar`, `03 · Görseller`) taşındı — boş bölüm
  atlanınca numaralar hep ardışık kalıyor (test edildi: varlık yoksa
  Olay Detayları'ndan direkt Görseller'e 01→02 geçiyor, boşluk yok).
- İmza bloğu: Hazırlayan = raporlayan (+ varsa tier), Onaylayan =
  `validated_by` (+ varsa tier). `reporter` bir insan değilse (ör.
  "XSOAR Entegrasyonu" webhook kaydı) `user_tier()` `None` dönüyor ve
  " · tier" eki hiç basılmıyor — test edilip doğrulandı, hatasız.
- **Doğrulandı:** gerçek WeasyPrint ile Olay Raporu #7 (2 bölüm metni,
  2 gömülü görsel, XSOAR raporlayan + admin/Müdür onaylayan) PDF'e
  çevrilip `pymupdf` ile incelendi — bilgi tablosu, numaralı bölümler,
  görsel galerisi, imza bloğu, Bütünlük hash'i doğru. Audit Log'daki
  `EXPORT_INCIDENT_PDF` detail hash'i (`7c54a21ac5b2c165`) PDF
  footer'ıyla birebir eşleşti. `verify_audit.py`: 287/287 zincirli,
  geçerli.

### Takip (2026-09-11) — Aylık Rapor Composio tasarımına + Bütünlük hash'i

Aynı plan/turun son fazı — **Faz D**. `templates/report.html`, Hunt/Olay
Raporu'ndan farklı olarak bu ikisinden çok daha zengin, tarayıcıdan
`window.print()` ile PDF'e giden bir sayfa (WeasyPrint'e hiç uğramıyor —
bu akış değişmedi). Mockup'ın görsel dili (header/footer/eyebrow/H1/
bilgi kartı stili/mono sayılar/hairline tablo) mevcut TÜM zengin içeriğe
(11+4 KPI kutusu, 2 rate-card, Hunt Programı 5 kutusu, Olay Raporu 2
kutusu, 3× özet çubuğu, 3× Chart.js donut, 3× kayıt tablosu) uygulandı —
**hiçbir KPI/tablo/grafik kaldırılmadı**, mockup'ın kendisi bunların
çoğunu hiç içermiyordu ama gerçek/işlevsel veri oldukları için taşındı.

- **Renk:** eski accent `#5E6AD2`'nin dosyadaki 11 kullanımı (KPI kart
  şeridi, shield logo, "İnceleniyor" donut/legend/özet-çubuğu rengi)
  tek seferde `#0007CD`'ye çevrildi. Bu sayfa hep AÇIK zeminde
  olduğundan (kağıt/print), koyu-zeminde-metin kontrast kısıtı (tema
  katmanındaki gibi) burada geçerli değil — `--accent` metin olarak da
  serbestçe kullanılabiliyor.
- **KPI kartları:** mockup'ın sade kutu diline geçildi — üstteki 3px
  renkli şerit kaldırıldı, rengin taşıyıcısı doğrudan değer metnine
  taşındı (`.kpi-card.green .kpi-value{color:var(--green)}` vb.) ki
  hızlı kırmızı/yeşil tarama işlevi kaybolmasın, sadece görsel olarak
  sadeleşsin. Etiketler mockup gibi 9px uppercase gri oldu.
- **Tablolar:** `.rpt-table th`'deki gri arka plan kaldırılıp sade
  hairline alt-çizgiye geçildi (mockup deseni); ID ve tarih kolonlarına
  `.mono` (JetBrains Mono) eklendi. `.pill` durum rozetleri ve
  `.section-icon` modül renkleri KASITLI OLARAK değiştirilmedi — ikisi
  de zaten sabit Tailwind-tonu hex değerleri kullanıyor, eski accent'e
  bağlı değiller, yeni paletle çakışmıyorlar (gereksiz risk alınmadı).
- **Header/footer:** Hunt/Olay Raporu'yla aynı `doc-header` + `cover`
  (DIAS logosu + adı, ilk kez bu sayfaya eklendi — `/static/logo_dias.jpg`
  düz HTTP yoluyla, WeasyPrint'in `file://` URI'siyle KARIŞTIRILMADI çünkü
  bu sayfa istemci tarayıcısında render oluyor) + eyebrow + H1 deseni.
  Sınıflandırma etiketi: `Aylık Rapor · {ay etiketi} · Gizli / Dahili`.
  Footer'a mevcut "v{{app_version}} · Oluşturulma · Dönem · Gizlilik"
  bilgisi solda aynen kalıp sağa **Bütünlük hash'i** eklendi. Google
  Fonts Inter+JetBrains Mono linki eklendi (sayfa tarayıcıda render
  olduğu için WeasyPrint'in font kısıtı burada yok).
- **Bütünlük hash'i + audit:** `monthly_report()`'a `report_integrity_hash
  ("monthly", month or "all", generated, <kpi+3 tablo JSON'u>)` eklendi;
  yeni `write_audit("EXPORT_MONTHLY_REPORT", ...)` çağrısı — bu sayfa
  daha önce HİÇ audit'lenmiyordu, artık her görüntülemede (ay filtresi
  değişse de) bir audit girdisi düşüyor.
- **Doğrulandı:** gerçek tarayıcıda `/report` açılıp (Tüm Zamanlar)
  header/cover/eyebrow/H1, tüm KPI kutuları (renkli değerler), Hunt
  Programı/Olay Raporu alt-blokları, 3 donut grafiği (Chart.js, konsol
  hatasız), 3 özet çubuğu, 3 kayıt tablosu (mono ID/tarih), footer +
  Bütünlük hash'i tek tek kontrol edildi. `GET /api/audit?category=
  system` ile yeni `EXPORT_MONTHLY_REPORT`'un doğru kategoriye girdiği
  ve audit detail hash'inin (`3edda88d94a136a7`) sayfa footer'ıyla
  birebir eştiği doğrulandı. `verify_audit.py`: 288/288 zincirli,
  geçerli. Bununla Composio PDF/rapor geçişi (Faz A-D) tamamlandı.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 1: ortak bileşen katmanı

Kullanıcı önceki iki turun (tema + PDF) yetersiz kaldığını, asıl mockup'ın
(`tema/SOC Tracker.dc.html` — design skill ile üretilmiş, tam interaktif
prototip) uygulamanın neredeyse HER ekranını farklı tasarladığını
belirtti ("birebir kopya olsun"). Mockup'ı (1855 satır) baştan sona
okuyup 7 sekmenin + Hunt/Incident detay görünümlerinin tamamını
katalogladım; en büyük fark **Hunt/Olay Raporu'na tıklayınca modal değil
tam sayfa bir görünüm açılması**. Plan Mode ile 8 fazlık bir yol
haritası onaylandı (plan dosyası). Bu girdi sadece **Faz 1**'i kapsıyor.

- **Ortak radius/pill sistemi:** mockup neredeyse her ekranda aynı 3
  bileşeni tekrar kullanıyor — 16px radius'lu kart, tam-yuvarlak
  (`9999px`) pill rozet, 40px yükseklikli buton/input. `static/
  soc-theme-composio.css`'teki `--r-sm/--r/--r-lg` token'ları (bu dosya
  zaten TÜM token'ları ezdiği için `styles.css`'teki eşdeğer değişiklik
  etkisiz kalıyordu — önce fark edilmedi, sonra doğru dosyada düzeltildi)
  `8px/8px/16px`'e çekildi; bu tek değişiklik `.kpi-module`, `.modal`,
  `.login-card`, `.settings-panel`, `.mywork-col`, `.trend-card` gibi
  `var(--r)`/`var(--r-lg)` kullanan HER kartı otomatik günceledi.
- `.badge` (tüm durum rozetlerinin TEK ortak class'ı — `badge()` JS
  yardımcısı) `border-radius:10px` → `9999px` pill'e, padding/font-weight
  mockup'a çekildi — 4 modülün TÜM durum rozetlerini tek satırda güncelledi.
- `.page-title` 16px→32px/500 (mockup'ın her liste sayfası H1'i), yeni
  `.page-subtitle` class'ı eklendi (içerik Faz 2'de dolacak — sayı
  özetleri KPI/count verisinden türetilecek). `.page-header` `align-
  items:flex-end`, `margin-bottom:24px` — filtre çubuğu zaten ayrı bir
  satırda olduğu için bu değişiklik hiçbir toolbar'la çakışmadı.
- `.btn`/`.btn-ghost-sm`/`.form-input`/`.sidebar-search-input` 40px
  yüksekliğe, 14px fonta geçti; `.btn-icon` mockup'ın satır-aksiyonu
  ikon butonlarıyla eşleşsin diye sabit 30×30px'e sabitlendi.
- **Bulunup düzeltilen gerçek regresyon:** `.form-input`'a `height:40px`
  eklemek, `class="form-input ... search-input"` olan 4 arama kutusunda
  (`#tune-search` vb.) `.search-wrap` konteynerinin İÇİNE kendi
  arka planı/border'ı/40px yüksekliğiyle İKİNCİ bir kutu açtı ("kutu
  içinde kutu"). `.form-input.search-input` için kutu stilini (bg/
  border/height/padding/radius) sıfırlayan bir override eklenerek
  düzeltildi — canlı `getComputedStyle` ile önce hatayı, sonra düzeldiğini
  doğruladım. `.form-textarea`'ya da benzer bir çakışma riski vardı
  (yeni `height:40px` çok satırlı kutuyu tek satıra sıkıştırırdı) —
  `height:auto` + kendi padding'i eklenerek proaktif olarak önlendi.
- **Doğrulandı:** gerçek tarayıcıda (admin), Kural Tuning ekranında
  `getComputedStyle` ile buton/input/badge/arama kutusu/kart
  radius-yükseklik-font değerleri tek tek doğrulandı, tablo satırları
  ve filtre çubuğu canlı veriyle sorunsuz render oldu, konsol hatasız.
  Ekran görüntüsüyle de (dar viewport'ta bile) genel görünümün
  bozulmadığı teyit edildi.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 2: liste görünümleri

- **Tablo kartı:** `.table-wrapper`'ın şu ana kadar HİÇ arka planı/
  border'ı/radius'u yoktu (satırlar doğrudan sayfa zemininde, sadece alt
  çizgilerle ayrılıyordu) — mockup'ın 16px radius'lu kart konteyneri
  eklendi (`background/border/border-radius` + köşe-radius'un header
  hücrelerine `inherit` ile taşınması). `.table th`/`.table td` padding
  (7-9px→12-14px) ve font (10-12px→11-13px) mockup'ın "nefes alan"
  satır yüksekliğine çekildi.
- **Sayfa başlığı özet satırı:** mockup'taki "142 talep · 18 açık · 7 ön
  onay bekliyor" deseni 4 modüle de eklendi — yeni `setPageSubtitle()`
  yardımcısı, her modülün `render*Rows()`'unun başında zaten yüklü olan
  `tuneRows`/`ucRows`/`huntRows`/`incidentRows` dizisinden (yeni bir
  backend endpoint'e gerek kalmadan) sayıyor. Not: bu sayı, sunucu
  tarafı ay/ortam/durum filtresi aktifken o filtrenin kapsamını
  yansıtır (tüm-zamanlar sabit bir toplam değil) — kasıtlı, basit bir
  seçim.
- **Doğrulandı:** gerçek tarayıcıda 1280×800 viewport'ta Kural Tuning
  (13 kolonlu, en yoğun tablo), Threat Hunting ve Olay Raporları
  ekranları uçtan uca kontrol edildi — özet satırları gerçek veriyle
  doğru sayıyor ("9 talep · 1 açık · 1 ön onay bekliyor" vb.), pill
  rozetler/tablo kartı/filtre çubuğu mockup'a çok yakın görünüyor,
  konsol hatasız. Kolon başlıklarının bazılarının (CASE NO/ORTAM gibi
  dar kolonlarda) kısaldığı fark edildi — bu, mevcut sabit-piksel
  `colgroup` genişliklerinden kaynaklanan önceden var olan bir durum
  (yeni padding'le hafif belirginleşti), Faz 8 genel geçiş taramasında
  ele alınacak, şimdilik işlevsellik bozulmadı.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 3: Dashboard

- **KPI kartları:** her istatistik kendi kutucuğunda (`background:var(
  --bg)` iç kutu) gösteriliyordu — mockup'ta sayılar düz, kutu içinde
  değil, sadece boşlukla ayrılmış. `.kpi-stat`'ın iç kutusu kaldırıldı,
  `.kpi-stat-val` 22px→30px'e büyütüldü, etiketler uppercase/mono
  hizasına çekildi. **3 istatistik de korundu** (mockup'ın 2 istatistik
  örneğine indirilmedi — hiçbir veri kaybı olmasın diye). İlerleme
  çubuğu rengi modül-özel yeşilden tek tip `--accent`'e çekildi
  (mockup'ta tüm modüllerin çubuğu aynı marka rengini kullanıyor).
- **Bulunan ikinci "kutu içinde kutu" regresyonu:** `.dash-section`
  ("Son Tuning Talepleri" vb. 4 mini tablo) CSS'te **tamamen boştu**
  (`{}`) — hiç kart/border/radius yoktu, tablolar çıplak sayfa
  zemininde duruyordu. Kart stili (16px radius, kendi padding'i)
  eklendi; `.table` içindeki header arka planı bu context'te kaldırıldı
  ki kart zaten kendi arka planını versin.
- `.mywork-col` ve `.trend-card` radius'u `var(--r)` (8px) → `var(
  --r-lg)` (16px) — Dashboard'daki TÜM büyük kartlar artık aynı radius'ı
  paylaşıyor.
- **Kapsam dışı bırakılan (bilinçli):** mockup'ta 4 ayrı sparkline
  yerine TEK birleşik bar-chart + tıklanınca büyüyen modal var — bu,
  4 modülün farklı tarih alanlarını (created_at/completed_at) tek bir
  grafikte anlamlı şekilde birleştirmeyi gerektiren ayrı bir veri
  modelleme işi. Zaman baskısı altında bu turda ATLANDI, mevcut 4
  sparkline kart (gerçek/işlevsel veri) sadece yeni radius'a taşındı.
  Kullanıcıya ayrıca bildirilecek.
- **Doğrulandı:** gerçek tarayıcıda 1280×900'de Dashboard uçtan uca
  incelendi — KPI kartları/ilerleme çubukları/mywork panelleri/trend
  kartları/dash-section'lar hepsi doğru render oluyor, konsol hatasız,
  `getComputedStyle` ile radius/font değerleri doğrulandı.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 4: Threat Hunting detayı (modal → tam sayfa)

Kullanıcının en somut şikayeti buydu: "threat hunt'ların içeriğinde farklı
ekran açılıyor". Mockup'ta Hunt satırına tıklayınca modal değil, listeyi
YERİNDE değiştiren tam sayfa bir görünüm açılıyor (iki kolonlu, numaralı
kartlar + kenar çubuğunda Durum/Onay). Bu mimari değişiklik yapıldı.

- **HTML:** `#tab-threat-hunting` içi ikiye bölündü — mevcut liste içeriği
  `#hunt-list-view`'a taşındı, yanına boş bir `#hunt-detail-view` eklendi.
  Eski `#hunt-detail-modal` (`.modal-overlay`) TAMAMEN kaldırıldı.
- **`openHuntDetail(id)` yeniden yazıldı** — TÜM mevcut veri-ayrıştırma
  mantığı (MITRE/IOC/ortam/öneri/zafiyet/bulgu JSON parse'ları) BİREBİR
  korundu, sadece son HTML derlemesi değişti: eski düz `.detail-section`
  listesi yerine mockup'ın numaralı kart deseni (`secnum()` — Jinja
  `namespace` sayaç desenin JS karşılığı, boş kart atlanınca numaralar
  ardışık kalıyor) + iki kolonlu grid (`detail-page-grid`/`-main`/`-side`).
  Kenar çubuğundaki "Onay" kartı **`huntActionBtns(r)`'ı olduğu gibi
  yeniden kullanıyor** — Üstlen/Ön Onay/Rapor Yaz/Sonucu Onayla/PDF İndir/
  Düzenle/Sil mantığının HİÇBİRİ tekrar yazılmadı, zaten var olan
  fonksiyon çağrıldı.
- **`backToHunts()`** eklendi (liste↔detay geçişi). `loadHunt()`'ın
  sonuna otomatik `backToHunts()` çağrısı eklendi: bir aksiyon (onay/
  üstlenme/kapama) detay görünümündeyken `loadHunt()`'ı tetiklerse
  kullanıcı otomatik güncel listeye döner — `goToItem()` zaten hemen
  ardından `openHuntDetail()`'i tekrar çağırdığı için dashboard/arama
  akışını bozmuyor.
- **Detection Önerisi kartı iyileştirildi:** eski kod `detection_
  suggestion==="Hayır"` olduğunda bölümü TAMAMEN gizliyordu (hiç
  "Hayır" cevabı gösterilmiyordu). PDF export'ta (Faz B) zaten düzeltilen
  bu davranış, burada da eşitlendi — "Öneriliyor mu?" satırı artık her
  zaman gösteriliyor.
- **Doğrulandı:** gerçek tarayıcıda 1280×900'de, MITRE'siz basit bir
  hunt (#9) ve MITRE+iki-aşamalı-onay+notlu zengin bir hunt (#4)
  açılıp incelendi — numaralı kartlar, MITRE kod-bloğu, Durum kartındaki
  TÜM alanlar (onay notları dahil), Onay kartındaki 3 gerçek aksiyon
  butonu (PDF İndir/Düzenle/Sil, `huntActionBtns()`'tan doğru geldiği
  `innerHTML` ile teyit edildi) doğru render oldu. "← Tüm hunt'lar"
  ile listeye dönüş, liste durumunun (filtre/sıralama) bozulmadan
  korunduğu doğrulandı. Konsol hatasız.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 5: Olay Raporu detayı (modal → tam sayfa)

Faz 4 ile birebir aynı desen, Olay Raporu için. `#tab-incident` içi
`#incident-list-view`/`#incident-detail-view`'a bölündü, eski
`#incident-detail-modal` kaldırıldı, `openIncidentDetail(id)` yeniden
yazıldı — `sections`/`images`/`affected_assets` JSON ayrıştırma mantığı
BİREBİR korunup mockup'ın "BÖLÜM N" numaralı kart deseniyle (`secnum()`,
Faz 4'teki ile aynı yardımcı) yeniden düzenlendi. Durum-bazlı aksiyon
mantığı (Açıldı→Düzenle+İncelemeye Başla, İncelemede→Düzenle+Onaya
Gönder, Onay Bekliyor→senior'a Onayla/Reddet, Kapandı→PDF İndir) eski
modal footer'ından BİREBİR taşındı, sadece `closeIncidentDetailModal()`
çağrıları `backToIncidents()`'e çevrildi. `loadIncidents()` sonuna da
Faz 4'teki gibi otomatik `backToIncidents()` eklendi.

- **Doğrulandı:** gerçek tarayıcıda Olay Raporu #7 (2 bölüm + 2 görsel,
  Kapandı durumu) açılıp incelendi — "01 · Olay Özeti"/"02 · Zaman
  Çizelgesi" gibi numaralı kartlar, Künye/Onay kenar çubuğu kartları
  doğru render oldu, `actionsHtml` içeriği ("Listeye Dön" + "PDF İndir")
  doğru koşuldan geldiği doğrulandı. "← Tüm olay raporları" ile listeye
  dönüşte satır sayısının (1) korunduğu doğrulandı. Konsol hatasız.
  Bununla Faz 4-5 (en somut şikayet — modal yerine tam sayfa) tamamlandı;
  sırada Faz 6 (sidebar/kabuk) var.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 6: sidebar sayaçları

- **Sidebar modül sayaçları:** mockup'ta her modülün yanında toplam
  kayıt sayısı var (`18`, `9`, `5`, `11`). `.nav-count` CSS class'ı
  koddan bulundu — daha önce eklenmiş ama HİÇBİR YERDE kullanılmıyordu
  (ölü stil). 4 modül nav butonuna `<span class="nav-count" id="nav-
  count-X">` eklendi, `loadKPI()`'a (zaten `/api/kpi`'den `*_total`
  alanlarını çeken fonksiyon) 4 satırlık bir güncelleme eklendi — yeni
  endpoint gerekmedi. **Kasıtlı detay:** bu güncelleme sadece Dashboard'da
  ay filtresi YOKKEN çalışıyor (`if (!month)`), aksi halde kullanıcı
  Dashboard'da bir ay seçtiğinde sidebar sayıları o aya düşüp "toplam
  kayıt" anlamını yanıltıcı hale getirirdi. Sidebar daraltıldığında
  (`toggleSidebar()`) sayaç da etikelerle birlikte gizleniyor.
- **Kapsam dışı bırakılan (bilinçli):** mockup'taki global "SOC Tracker
  / {Aktif Sekme}" breadcrumb üst çubuğu + her sekmede aynı kalan
  "Aylık PDF/Excel/+Yeni Talep" butonları eklenmedi — mevcut mimari
  (her sekmenin kendi `.page-header`'ında kendi ilgili butonları)
  zaten doğru davranıyor, global bara taşımak Dashboard/Audit/Ayarlar
  gibi "+Yeni Talep" kavramının anlamsız olduğu sekmelerde kafa
  karıştırırdı. Zaman/kapsam baskısı altında bu, düşük katma değerli
  bir kozmetik değişiklik olarak ATLANDI.
- **Doğrulandı:** gerçek tarayıcıda sayaçlar gerçek verilerle (9/4/9/1)
  doğru gösterdi, sidebar daraltılınca sayaçların da gizlendiği
  `getComputedStyle` ile teyit edildi, konsol hatasız.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 7: Audit Log Hash kolonu

Mockup'ın Audit Log tablosunda satır başına bir Hash kolonu var
(`9f2ac41b7e08d5c3…`). `record_hash` zaten `/api/audit`'in `SELECT *`
yanıtında dönüyordu, sadece frontend'de hiç gösterilmiyordu — salt
frontend değişikliği (yeni backend endpoint/alan gerekmedi). Tabloya
7. kolon (`th`/`colgroup`) eklendi, `loadAuditLog()`'un satır şablonuna
`record_hash`'in ilk 16 hex karakteri (mono, `title`'da tam hash)
eklendi.

- **Kapsam dışı bırakılan (bilinçli):** mockup'ta zincir her sekme
  açılışında otomatik doğrulanmış gibi (varsayılan yeşil banner)
  görünüyor — ama bu, her ziyarette TÜM zinciri yeniden hesaplamak
  demek (kayıt sayısı arttıkça maliyeti büyüyen bir işlem). Mevcut
  "Zinciri Doğrula" butonuna tıklama davranışı (istek üzerine doğrulama)
  korundu, sadece davranış aynı kalırken kolon eklendi.
- **Doğrulandı:** gerçek tarayıcıda Audit Log açılıp satır başına 7
  hücre (Hash dahil) render olduğu, en son kaydın hash'inin
  `verify_audit.py`'nin raporladığı zincir-ucu hash'iyle eştiği
  (`15c8462bf7e13ab5…`) doğrulandı. Konsol hatasız.

### Takip (2026-09-12) — Mockup tam entegrasyonu, Faz 8: genel geçiş taraması

Faz 1'de kurulan ortak bileşen katmanı (kart 16px, pill rozet 9999px,
40px buton/input) sayesinde bu son fazda **neredeyse hiç ek değişiklik
gerekmedi** — Ayarlar (Ortamlar/Kullanıcılar kartları, pill rol
rozetleri, alt-sekme çubuğu), Tune/UC detay modalleri (aynı `.modal`/
`.badge`/`.detail-*` class'larını paylaşıyorlar) gerçek tarayıcıda tek
tek kontrol edildi ve zaten mockup'ın diline uygun görünüyorlar —
Faz 1'in "önce ortak sözlüğü tanımla, sonra her ekrana uygula" stratejisi
doğrulandı.

**Bu turda mockup'a göre bilinçli olarak farklı/eksik bırakılanlar
(kullanıcıya ayrıca bildirilecek):**
- Dashboard'daki 4 ayrı sparkline yerine mockup'ın tek birleşik bar-chart
  + tıklanınca büyüyen modal deseni (Faz 3'te not edildi).
- Global "SOC Tracker / {Sekme}" breadcrumb üst çubuğu + tüm sekmelerde
  sabit kalan Aylık PDF/Excel/+Yeni Talep butonları (Faz 6'da not edildi)
  — mevcut per-tab header mimarisi kasıtlı olarak korundu.
- Audit Log'daki varsayılan-yeşil "otomatik doğrulandı" banner'ı (Faz
  7'de not edildi) — performans nedeniyle "isteğe bağlı doğrulama"
  davranışı korundu, sadece Hash kolonu eklendi.
- Kolon başlıklarının bazı dar `colgroup` genişliklerinde kısalması
  (Faz 2'de not edildi) — önceden var olan bir durum, bu turda
  belirginleşti ama düzeltilmedi (küçük, kozmetik).
- Tune/Use-Case detayı bilinçli olarak modal kaldı (mockup'ın kendisi
  de bunları modal tutuyor — sadece Hunt/Olay Raporu tam sayfaya
  taşındı).

Composio mockup entegrasyonu (Faz 1-8) burada tamamlandı. Sekiz fazın
hepsi ayrı commit'lerle (a3ef366, c9a38e4, 5787880, b0ae2f7, f416b2c,
efe3c08, cb17b33 + bu girdi) canlıda test edilip pushlandı.

### Takip (2026-09-12) — Tune/UC detay modali + hover durumları: pixel-seviyesi düzeltme

Kullanıcı, mockup'ın kendi genel "hasModal" dialog'undan aldığı iki ekran
görüntüsünü (Kural Tuning #1284, Use-Case "Deneme Use case...") mevcut
uygulamanın modalleriyle yan yana koyup "en minik ayrıntıya, hover'lanan
kutunun mavi çizgisine kadar" birebir eşleşme istedi. `tema/SOC
Tracker.dc.html`'deki `hasModal` bloğunu (satır 1285-1320) ve TÜM
`style-hover` kullanımlarını (`grep` ile 7 farklı desen, ~190 örnek)
tekrar satır satır okuyup mevcut `.modal-*`/`.detail-*` CSS'iyle
karşılaştırdım. Bulunan somut farklar ve düzeltmeler:

- **Kicker satırı hiç yoktu:** mockup'ta başlığın üstünde mono "Kural
  Tuning · #1284" satırı var, bizde YOKTU. Yeni `.modal-kicker` class'ı
  + `tune-detail-modal`/`uc-detail-modal` header'larına eklendi,
  `openTuneDetail()`/`openUCDetail()`'e birer satır eklenerek dolduruldu.
- **Başlık 14px/500 → mockup'ta 20px/600:** `#tune-detail-modal
  .modal-title`/`#uc-detail-modal .modal-title` için scoped override
  eklendi (diğer modallerin başlığı hâlâ 17px/600 — küçük dialoglar
  için mockup'ın kendi `dlgValidate`/`dlgClaim` boyutuyla eşleşiyor).
- **Backdrop yanlıştı:** `rgba(0,0,0,0.6)` + `backdrop-filter:blur(2px)`
  kullanılıyordu; mockup'ta blur YOK, düz `rgba(0,0,0,0.72)`. İkisi de
  düzeltildi (TÜM modaller için, mockup'ta hiçbir yerde blur yok).
- **Etiket/değer satırları 2 kolonlu KART grid'iydi** (`.detail-grid{
  grid-template-columns:1fr 1fr}` + `.detail-row{flex-direction:column}`
  — iki alan yan yana, her biri kendi içinde etiket üstte/değer altta).
  Mockup'ın deseni TAMAMEN farklı: tek sütun, her satır kendi başına
  `grid-template-columns:minmax(120px,180px) minmax(0,1fr)` ile etiket
  SOLDA/değer SAĞDA aynı satırda. `.detail-grid`/`.detail-row`/
  `.detail-label`/`.detail-value` mockup'a birebir çekildi (font 10-12px
  → 13-14px, uppercase kaldırıldı). Bu class'lar Hunt/Olay Raporu'nun
  Faz 4-5'te yazdığım tam-sayfa kenar çubuğu kartlarında da ORTAK
  kullanıldığı için, TEK bir CSS değişikliği 4 modülü birden düzeltti.
  **Doğrulama notu:** ilk bakışta ekran görüntüsünde etiket/değerin
  hâlâ alt alta göründüğünü DÜŞÜNDÜM — `getBoundingClientRect()` ile
  ölçünce ikisinin de AYNI y-aralığında olduğu (yan yana, doğru)
  kanıtlandı; görsel yanılgı ekran görüntüsü sıkıştırmasından kaynaklıydı.
- **Bölüm ayracı ters yöndeydi:** `.detail-section-title`de ÜST border
  vardı (önceki bölümden ayırmak için); mockup her `.detail-section`'ın
  ALT'ında ayraç kullanıyor. `.detail-section:not(:last-child){border-
  bottom}` deseni ile değiştirildi.
- **Footer'da arka plan farkı yoktu:** mockup'ın TÜM modal footer'ları
  (`hasModal` + `dlgValidate` + `dlgClaim` + ...) `background:#1a1a1a`
  kullanıyor (body'nin `#181818`'inden hafif farklı) — `.modal-footer`
  buna göre güncellendi, padding 12px 20px → 16-18px 24px.
- **`.modal-close` boyutu tutarsızdı** (`padding:2px 4px`, içerik kadar
  büyük) — mockup'ta sabit `32×32px`. Düzeltildi.
- **Dashboard KPI kartları hover'da GRİ border + `scale(1.08)` zoom
  efekti kullanıyordu** — mockup'ta bu 4 kart (`grep` ile doğrulandı,
  toplam 7 blue-border-hover kullanımından 4'ü bunlar) hover'da SADECE
  `border-color:#0007cd`'ye geçiyor, zoom/gölge yok. `.kpi-module:hover`
  düzeltildi, padding de 14px 16px → 20px 24px'e çekildi (mockup'ın
  kart iç boşluğu). `.trend-card`'daki aynı zoom efekti de kaldırıldı
  (nötr border rengine, çünkü mockup bu karta blue-hover UYGULAMIYOR —
  sadece tıklanabilir dashboard modül kartları ve kanıt-görseli
  thumbnail'leri mavi hover alıyor, ayrım bilinçli korundu).
- **Doğrulandı:** gerçek tarayıcıda Tune #1 ve UC #2 detay modalleri
  açılıp kullanıcının referans ekran görüntüleriyle karşılaştırıldı —
  kicker/başlık/rozet/bölüm/satır düzeni artık eşleşiyor. Küçük bir
  onay dialog'u (`openValidateModal`) da yeni header/footer stiliyle
  sorunsuz render oldu. Dashboard'da Kural Tuning kartına gerçek fare
  hover'ı uygulanıp mavi kenarlığın göründüğü ekran görüntüsüyle teyit
  edildi. Konsol hatasız.

**Not:** Bu, mockup'ın TÜM 1855 satırının satır-satır yeniden taranması
değil — kullanıcının işaret ettiği somut örnek (detay modal ailesi +
dashboard hover'ları) üzerinden derinlemesine, kanıta dayalı bir
düzeltme turu. Başka bir ekranda benzer bir fark fark edilirse aynı
yöntemle (mockup kaynağını oku, mevcut CSS'i karşılaştır, canlı ölç)
ele alınabilir.

### Takip (2026-09-12) — Proaktif kendi-kendine denetim: form/buton ortak bileşen katmanı

Kullanıcı bir önceki turun kapanışında önerdiğim "sen bana ekran görüntüsü
göster, ben düzeltirim" akışını reddetti: *"mevcut html'yi inceleyip 'ah
burayı yapmamışım' deyip migrate edemez misin"* — yani kullanıcı beklemeden,
kalan farkları kendim bulup düzeltmemi istedi. Bunun üzerine, kullanıcıdan
yeni bir ekran görüntüsü beklemeden, `tema/SOC Tracker.dc.html`'deki TÜM
form alanlarını (dlgValidate/dlgClose/dlgApprove/dlgHuntResult/dlgIncEdit/
dlgUser/formOpen) ve TÜM liste-görünümü filtre çubuklarını (Tuning/UC/Hunt/
Olay Raporu/Audit Log) satır satır yeniden okuyup mevcut `.form-*`/`.btn-*`
CSS ailesiyle karşılaştırdım. Bunlar önceki turda hiç incelenmemişti çünkü
önceki tur sadece kullanıcının işaret ettiği Tune/UC detay modali + Dashboard
hover'ına odaklanmıştı — bu tur bilinçli olarak GERİ KALAN paylaşılan
bileşenleri (her diyalogda, her liste ekranında tekrarlanan form/buton
kalıpları) hedefledi. Bulunan somut farklar:

- **Modal içi input/textarea/select zemini yanlıştı:** TÜM modal formları
  (Yeni Tuning Talebi, düzenleme diyalogları, Kullanıcı Düzenle, Onay/Kapama
  diyalogları) `--bg-secondary` (#181818, kartla aynı ton) kullanıyordu;
  mockup'ta modal içi form alanları HER YERDE daha koyu `#0f0f0f` zeminde
  (kart zemininden ayrışsın diye). Liste ekranlarının filtre çubuğu
  input/select'leri ise mockup'ta zaten `#181818` kullanıyor — yani bunlar
  iki farklı, kasıtlı kural. `.modal-body .form-input { background:
  var(--bg) }` scoped override'ı eklendi, filtre çubuğu dokunulmadı.
- **Input/select border'ı `0.5px var(--border-md)` (#333) idi**, mockup'ta
  HER yerde (modal içi de filtre çubuğu da) `1px solid #222222`
  (`var(--border)`). Global olarak düzeltildi.
- **Odak halkası eski (indigo) temadan kalma bir renkti** (`box-shadow: 0 0
  0 3px rgba(94,106,210,.12)` — Composio'nun mavisi #0007CD değil, eski
  #5E6AD2'nin rengiydi). Mockup'ta zaten hiçbir input'ta glow yok, sadece
  `border-color` değişiyor — glow kaldırıldı. (Not: `soc-theme-composio.css`
  zaten `box-shadow:none` ile bunu token katmanında eziyordu, ama
  `styles.css`'teki kaynak hâlâ yanlış rengi taşıyordu — iki dosya
  arasında sessiz bir çelişkiydi.)
- **`select` elemanlarında `appearance:none` custom ok OLMADAN
  kullanılıyordu** — yani TÜM açılır kutularda native ok tamamen kayıptı.
  Mockup düz `<select>` kullanıp native oku gösteriyor. `select.form-input
  { appearance:auto }` ile geri getirildi.
- **Form etiketleri (`.form-label`) 11px büyük-harf'ti** — mockup'ta 13px,
  normal harf, `font-weight:500`. Kaynağı ilginç: `styles.css`'teki
  `.form-label` zaten 13px'e çekilmişti ama `soc-theme-composio.css`'teki
  ESKİ bir grup kural (`.section-label, .form-label, .table th { font-
  size:11px; text-transform:uppercase; ... }`) tema dosyası SONRA
  yüklendiği için onu eziyordu — canlı testte `getComputedStyle` ile 11px
  görünce fark edildi, tema dosyasından `.form-label` grup kuralından
  çıkarılarak çözüldü. (Bu, PROGRESS.md'de daha önce de not edilen "tema
  dosyası stiles.css'i ezer" tuzağının yeni bir örneği.)
- **Buton aileleri mockup'ta aslında 4 farklı arketipe ayrılıyor**, biz
  hepsini `.btn-secondary`/`.btn-ghost-sm` gibi 2 class'a sıkıştırmıştık:
  - `.btn-secondary` (Filtrele/Uygula/Yenile/Zinciri Doğrula/+Ekle): dolgu
    ve hover rengi mockup'a göre TERSTİ (taban `--bg-active`, hover
    `--bg-hover` — olması gereken tam tersi) ve gereksiz bir border
    taşıyordu. Düzeltildi: taban `--bg-hover`, hover `--bg-active`, border
    yok.
  - `.btn-ghost-sm` (Temizle/İptal/detay modalinin tek "Kapat" butonu):
    border taşıyordu ve hover'da arka plan doluyordu; mockup'ta tamamen
    şeffaf, border yok, hover SADECE metin rengini değiştiriyor. Ayrıca
    Tune/UC detay sayfasının "Kapat" butonu yanlışlıkla `.btn-secondary`
    (dolgu) kullanıyordu — mockup'ta bu buton `closeModal`'ın borderless
    ghost'u, `.btn-ghost-sm`'e taşındı.
  - **Yeni `.btn-outline`** eklendi (şeffaf + `1px solid #333` + beyaz
    metin, hover'da hafif dolgu) — mockup'ın "☰ Kolonlar" ve hasModal'ın
    Üstlen-dışı aksiyon butonlarının deseni. 4 modülün "Kolonlar"
    butonuna uygulandı (önceden `.btn-ghost-sm` kullanıyorlardı, border
    kaybolacaktı).
  - **Yeni `.btn-danger-outline`** eklendi — Reddet/Revizyona Gönder/
    Yeniden Tune/Revizyon butonları önceden `.btn-secondary` + satır-içi
    `style="color:...;border-color:..."` ile taklit ediliyordu (bu yüzden
    dolgu zemini ve yanlış hover'ı miras alıyorlardı); artık gerçek
    transparent+kırmızı-outline+kırmızı-tint-hover.
  - **`.range-toggle`** ("Tümünü Göster") için ayrı kesikli-border kuralı
    eklendi — `.btn-ghost-sm` borderless olunca bu da border'ını
    kaybedecekti, mockup'ta özellikle `1px dashed #333333` (hover'da
    `#666666`) kullanıyor.
- **Doğrulandı (canlı tarayıcı + `getComputedStyle`):** Kural Tuning filtre
  çubuğunda Filtrele (`rgb(34,34,34)`/border yok) — Temizle (şeffaf/border
  yok) — Tümünü Göster (`1px dashed rgb(51,51,51)`) — Kolonlar
  (`1px solid rgb(51,51,51)`/beyaz metin) dördü de mockup'la birebir;
  aynı "Kolonlar" kontrolü UC/Hunt/Olay Raporu sekmelerinde de tekrarlanıp
  aynı sonuç doğrulandı. Yeni Tuning Talebi formunda input/select zemini
  `rgb(15,15,15)` + border `rgb(34,34,34)`, etiket `13px/500/rgb(168,168,
  168)` ölçüldü. Tune detay sayfasının "Kapat" butonu borderless/şeffaf,
  Tune Onaylama diyalogunun "Yeniden Tune" butonu şeffaf+kırmızı-outline
  ölçüldü. Konsol hatasız, brace-balance (404/404) ve Jinja2 template
  doğrulaması geçti.
- **Bilinçli sınırlama:** "+ Ekle" satır-ekleme butonları (`addUCEnvCreate`
  vb., ~7 yer) mockup'ta 32px yükseklik/13px font kullanıyor ama
  `.btn-secondary` üzerinden 40px/14px alıyorlar — küçük bir boyut farkı,
  bu turda kapsam dışı bırakıldı (renk/border/hover hatalarının aksine
  görsel etkisi düşük). `.form-textarea`/`.form-input` padding'i modal
  içinde mockup'ın 12px'ine karşı bizim 14px'imiz de aynı gerekçeyle
  ertelendi. İkisi de gelecekte benzer bir geçiş turunda ele alınabilir.

`static/styles.css` (v12.7), `static/soc-theme-composio.css`,
`templates/index.html` değişti; `app.js`'e dokunulmadı (JS mantığı
değişmedi, sadece render edilen class'lar).

### Takip (2026-09-12) — Sidebar aktif renk + kural listelerindeki gereksiz nokta

Kullanıcı iki gerçek ekran görüntüsünü (mevcut Use-Case listesi + mockup'ın
Kural Tuning listesi) yan yana koyup üç somut şey işaret etti: (1) sol
navigasyondaki renk farkı çok belirgin, (2) kural listelerinde `#`'den önceki
renkli yuvarlağa gerek yok, (3) Use-Case tablosundaki "Yazılan Kural" rozeti
zaten doğru — dokunma. Üçüncüsü zaten mevcut haliyle mockup'a uygun olduğu
için sadece ilk ikisi + karşılaştırırken fark edilen ek bir nokta ele alındı:

- **Sidebar'da aktif modül rengi yanlıştı:** `.nav-btn.active` soluk gri
  dolgu (`--bg-active`, #2a2a2a) kullanıyordu; mockup'ta aktif sekme TAM
  dolu accent mavisi (`#0007cd`) + beyaz metin. Düzeltildi. Aynı taramada
  `.nav-btn`'in kendisinin de mockup'tan biraz küçük olduğu görüldü
  (padding 6px 8px/13px font yerine mockup'ın 9px 10px/14px'i) — birlikte
  düzeltildi. `.nav-count` da mockup'ta pill-rozet DEĞİL, düz mono metin
  (aktifken `rgba(255,255,255,.7)`, pasifken `#666666`) — önceki halimiz
  gri pill arka planlı bir rozetti, sadeleştirildi.
- **Kural Tuning/Use-Case/Threat Hunting/Olay Raporu listelerindeki `#`
  sütunundan önceki renkli durum noktası** (`.status-dot`/`dot-*`
  class'ları, `dot()` JS helper'ı, `TUNE_DOT`/`UC_DOT`/`HUNT_DOT`/
  `INCIDENT_DOT` map'leri) mockup'ta hiç yok — durum zaten aynı satırda
  ayrı bir "Durum" rozet sütununda tam metinle gösteriliyor, nokta sadece
  fazladan/gereksiz bir tekrar. Kullanıcının "gerek yok" tespiti doğrulandı
  ve dört tablonun TAMAMINDAN (colgroup/thead/tbody + JS render + kolon-
  index'leri) kaldırıldı — ölü kod olarak `dot()`, 4 DOT map'i ve 12 adet
  `.dot-*` CSS kuralı da silindi (kullanılmadıkları `grep` ile doğrulandı).
- **Dikkat edilen risk:** `#`-sütunu kaldırılan yeni ilk sütun olduğu için,
  4 modülün `_COLUMNS` dizisindeki (kolon göster/gizle + kolona göre filtre
  özelliğinin dayandığı) `index` değerleri 1 kaydırılıp yeniden 0-tabanlı
  hale getirildi (`TUNE_COLUMNS`/`UC_COLUMNS`/`HUNT_COLUMNS`/
  `INCIDENT_COLUMNS`), `buildColumnFilterRow()`'daki filtre satırının
  başındaki fazladan boş `<td>` de kaldırıldı (aksi halde kolon filtre
  girişleri bir sütun kayardı). Canlı tarayıcıda sıralama, kolona göre
  filtre (select + text tipi) ve kolon göster/gizle üçü de ayrı ayrı test
  edilip DOM/veri hizası doğrulandı (`onColumnFilterInput`/`onColumnToggle`
  çağrılarıyla), 4 modülün tamamında ilk hücrenin artık `#`
  olduğu doğrulandı, konsol hatasız.

`static/styles.css` (v12.8), `static/app.js` (v55), `templates/index.html`
değişti.

### Takip (2026-09-12) — Tablo çerçevesi: dolgu/ayraç/hover mockup'a çekildi

Aynı iki ekran görüntüsünü karşılaştırırken sidebar ve nokta sütunu dışında
tablonun kendisinde de fark bulundu — mockup'ın liste tablosu satır satır
(`tema/SOC Tracker.dc.html` satır 331-333) yeniden okunup şu 4 farkla
karşılaştırıldı:

- **`.table-wrapper` border'ı** `0.5px var(--border-md)` (#333) idi, mockup
  `1px solid #222222`. Düzeltildi.
- **Header/satır dolgusu çok sıkıydı** (`12px 14px`) — mockup'ta header
  `14px 24px`, satır `16px 24px`. Genişletildi (tablolar zaten
  `.table-fixed{min-width:1100px}` + `.table-wrapper{overflow-x:auto}` ile
  yatay kaydırmaya hazır, mockup da aynı gerekçeyle `min-width:1060px`
  kullanıyor — dar ekranda kaydırma bekleniyor, kırılma değil).
- **Header zemini kart zeminiyle AYNIYDI** (`--bg-tertiary` = #181818,
  `--bg-secondary` ile birebir aynı token) — mockup'ta header bir tık daha
  koyu (`#1a1a1a`). Yeni bir `--bg-elevated` token'ı eklendi
  (`soc-theme-composio.css`) ve satır ayracı rengi de buna çekildi (mockup
  satır border'ı `#1a1a1a`, header'ın kendi alt border'ı ise `#222222` —
  ikisi ayrı, doğru şekilde ayrıştırıldı).
- **En önemlisi — satır hover'ı neredeyse görünmüyordu:** `.table
  tr:hover td` rengi `var(--bg-secondary)` (#181818) yani KART ZEMİNİYLE
  AYNIYDI, dolayısıyla üstüne gelince pratikte hiçbir şey değişmiyordu.
  Mockup'ta hover `#222222` (`--bg-hover`) — belirgin bir renk sıçraması.
  Bu, muhtemelen daha önce `--bg-hover`/`--bg-secondary`'nin bir noktada
  karıştırılmasından kalma bir regresyon; düzeltildi.
- **Doğrulandı:** canlı tarayıcıda Kural Tuning ve Audit Log tabloları
  (ikisi de aynı paylaşılan `.table` class'ını kullanıyor) yeni dolgu/
  header rengiyle render edildi, `table-wrapper.scrollWidth >
  clientWidth` ile yatay kaydırmanın devrede olduğu doğrulandı, gerçek
  fare hover'ı ekran görüntüsüyle rengin artık belirgin şekilde
  değiştiği teyit edildi, konsol hatasız.

`static/styles.css` (v12.9), `static/soc-theme-composio.css` değişti.

### Takip (2026-09-12) — Hunt/Olay Raporu tam sayfa detayı: sayfa yerleşimi

Kullanıcı bu kez 4 ekran görüntüsü verdi (Hunt detayı mockup+güncel, Olay
Raporu detayı güncel+mockup) ve "sayfa yerleşim hatalarını görüp düzelt"
dedi. `tema/SOC Tracker.dc.html`'in Hunt detay bloğunu (satır 619-765) ve
Olay Raporu detay bloğunu (satır 934-1033) satır satır okuyup mevcut
`openHuntDetail()`/`openIncidentDetail()` (app.js) ile karşılaştırdım.
Bulunan somut farklar:

- **Bölüm numaralarında gereksiz sıfır:** `secnum()` (her iki fonksiyonda
  da) `.padStart(2,"0")` kullanıyordu → "01 · Hedef", mockup'ta Hunt için
  düz "1 · Hedef". Hunt'ta düzeltildi (dikkat: bulgu/öneri/güvenlik-açığı
  listelerinin İÇİNDEKİ madde numaraları — `hp-list-idx` — mockup'ta HÂLÂ
  sıfırlı "01"/"02"; o kod satırlarına dokunulmadı, doğru haliyle kaldı).
- **Olay Raporu'nun bölüm başlığı Hunt'tan FARKLI bir kalıp kullanıyor:**
  Hunt "N · Başlık" tek span iken, mockup'ta Olay Raporu ayrı bir mono
  "BÖLÜM N" kicker + ayrı büyük-harf başlık ikilisi (iki ayrı `<span>`,
  bkz. dc.html satır 950-951) — biz ikisini de aynı `.hp-card-label`
  içine "01 · Başlık" olarak basıyorduk. Yeni `.hp-card-kicker` class'ı
  eklenip `openIncidentDetail()`'deki 3 bölüm başlığı (sections/assets/
  images) buna göre ikiye ayrıldı.
- **Olay Raporu'nda kimlik satırı YANLIŞ YERDEYDİ:** mockup'ta "OLAY-XXXX
  · Case #XXXX" + durum rozeti başlığın ÜSTÜNDE tek satırda; bizde bu
  satır (rozetsiz) başlığın ALTINDA duruyordu (Hunt'ın kendi kalıbı —
  ki Hunt için bu doğruydu, mockup Hunt'ta da ID'yi başlığın altında
  tutuyor, satır 624). Olay Raporu için yeni `.detail-page-kicker-row`
  ile satır başlığın üstüne taşındı ve durum rozeti eklendi. (Mockup'ta
  ayrıca bir "şiddet" rozeti de var ama incident_reports tablosunda
  `severity` kolonu yok — bu Hunt'a özgü bir alan — sahte veri
  uydurmamak için eklenmedi, bilinçli sınırlama.)
- **En büyük fark — Hunt'ın "Onay" kartı, liste satırının küçük ikon
  butonlarını (`huntActionBtns()`) yeniden kullanıyordu:** ekran
  görüntüsünde görülen 3 küçük kare buton bu yüzdendi. Mockup'ta bu kart
  tam-genişlik, etiketli, birincil/ikincil/ghost hiyerarşili butonlar
  kullanıyor (Sonucu Onayla mavi dolgu / Revizyona Gönder outline / PDF
  İndir ghost-link). Liste satırındaki kompakt ikon butonlarını BOZMADAN
  (hâlâ `huntActionBtns()` kullanıyor), sadece tam sayfa detayı için аynı
  durum dallanmasını etiketli tam-genişlik butonlarla tekrar eden yeni
  bir `huntDetailActions()` fonksiyonu yazıldı — yeni `.btn-outline`/
  `.btn-danger-outline` class'ları (önceki oturumdan) burada da işe
  yaradı. `.hp-actions` CSS'i `flex-wrap` satırdan `flex-direction:
  column` + `width:100%` çocuklara çekildi (mockup'ın dikey buton
  yığını, dc.html satır 756-760) — Olay Raporu'nun Onay kartı zaten
  düzgün etiketli butonlar kullanıyordu, sadece bu genel `.hp-actions`
  düzeltmesinden otomatik faydalandı.
- **Küçük ek düzeltmeler:** `.hp-card`/`.hp-card-side` border'ı (`0.5px
  var(--border-md)` → `1px var(--border)`, önceki oturumlardaki aynı
  desen); MITRE kod bloğu (`.hp-code-block`) zemini `var(--bg)`
  (#0f0f0f) yerine mockup'ın `#000000`'ına, radius 8px→16px'e çekildi.
- **Doğrulandı:** canlı tarayıcıda Hunt'ın mevcut TÜM durumları
  (İnceleniyor/Tamamlandı/Reddedildi) ve Olay Raporu'nun mevcut durumu
  (Kapandı) hatasız açıldı; Tamamlandı durumundaki Hunt'ın Onay kartı
  artık tam-genişlik "PDF İndir" (mavi) + "Düzenle" (outline) + "Sil"
  (kırmızı outline) gösteriyor; Olay Raporu'nun "BÖLÜM 1" kickeri mono
  font + `#666666` ölçüldü; kimlik satırı artık başlığın üstünde rozetle
  birlikte; MITRE verisi olan bir Hunt kaydında kod bloğu `rgb(0,0,0)`/
  `16px` radius doğrulandı; konsol hatasız.

`static/styles.css` (v13.0), `static/app.js` (v56) değişti.

### Takip (2026-09-12) — Tam sayfa detayda sağda kalan boşluk (grid/max-width çakışması)

Kullanıcı bir ekran görüntüsüyle Olay Raporu detay sayfasının sağında
büyük bir boş alan kaldığını gösterdi ("yerleşim olarak bir saçmalık
var"), hem Olay Raporu hem Threat Hunting için düzeltilmesini istedi.

Kök neden bulundu: `.detail-page-grid` `grid-template-columns: repeat(
auto-fit, minmax(320px, 1fr))` kullanıyordu — sayfada sadece 2 grid öğesi
(ana içerik + yan kolon) olduğundan bu, ikisine de EŞİT pay veriyordu
(geniş bir ekranda her ikisi de ~700px). Ama `.detail-page-side` AYRICA
`max-width:340px` ile sıkıştırılmıştı — yani grid TRACK'i ~700px
genişlik ayırıyordu, kutunun kendisi ise 340px'te duruyordu, aradaki
~360px boş alan olarak kalıyordu. Kartın kendisi 340px'te durduğu için
sorun screenshot'ta net görülüyordu.

Düzeltme: track genişliğini kutunun kendi max-width'iyle çakışmayacak
şekilde grid tanımının içine taşıdım — `grid-template-columns: minmax(0,
1fr) minmax(280px, 380px)` (≥900px'te; altında tek sütuna katlanıyor,
mobil/dar ekran davranışı korunuyor). Artık yan kolonun kutusu KENDİ
track'ini tam dolduruyor, ayrı bir max-width'e gerek yok. Bu, `.detail-
page-grid`/`.detail-page-side` paylaşılan class'lar olduğu için hem Hunt
hem Olay Raporu'nda TEK değişiklikle düzeldi.

**Doğrulandı:** canlı tarayıcıda pencere 1400px'e büyütülüp
`getBoundingClientRect()` ile ölçüldü — hem Olay Raporu hem Hunt'ta
`grid.right - side.right === 0` (sıfır boşluk), yan kolon 380px, ana
kolon geri kalanı (722px) aldı. 700px'e küçültülünce grid tek sütuna
düştüğü (`gridTemplateColumns` tek track) doğrulandı — dar ekran/mobil
davranışı bozulmadı. Konsol hatasız.

`static/styles.css` (v13.1) değişti.

### Takip (2026-09-12) — Kenar çubuğunda satır kayması (etiket kolonu çok genişti)

Önceki düzeltme boşluğu gidermişti ama kullanıcı hâlâ "Raporlayan / XSOAR
Entegrasyon u" gibi değerlerin alt satıra kaydığını, kısımların kapladığı
alanın "saçma" göründüğünü belirtti — asıl kalan sorun buydu.

Kök neden: Künye/Durum kartlarındaki key-value satırları paylaşılan
`.detail-row` class'ını kullanıyor — bu class Tune/UC detay MODALİ için
ayarlanmış bir CSS grid (`grid-template-columns: minmax(120px,180px)
minmax(0,1fr)`), yani "Raporlayan" gibi 10 karakterlik kısa bir etiket
için bile ZORUNLU olarak 180px ayırıyordu. Modal 700px+ genişken bu sorun
değil, ama şimdi sidebar kartı sadece ~380px (280px padding çıkınca
~330px) — 180px etikete gidince değere sadece ~130px kalıyor, "XSOAR
Entegrasyonu" gibi bir değer bu genişliğe sığmayıp satır kaydırıyor.
Mockup'ın kendisi bu kartlarda zaten grid değil `display:flex;justify-
content:space-between` kullanıyor (dc.html satır 743) — etiket ne kadar
yer kaplıyorsa o kadar, kalan TÜM genişlik değere gidiyor.

Düzeltme: `detailRow()` JS helper'ına (Tune/UC modalinde hâlâ doğru
çalışan grid'i bozmadan) dokunmadım — sadece `.hp-card-side .detail-row`
scoped override'ı ekleyip SADECE bu dar bağlamda flex+space-between'e
çevirdim. `static/app.js`'e hiç dokunulmadı, salt CSS.

**Doğrulandı:** canlı tarayıcıda (1400px) Olay Raporu'nda "Raporlayan"
etiketi artık ~69px (önceden zorunlu 180px), değer ~142px'e çıktı,
`getClientRects().length === 1` ile tek satıra sığdığı doğrulandı.
Hunt'ın TÜM künye satırları (Talep Eden/Atanan Analist/Ön Onayı Veren/
Sonucu Onaylayan gibi daha uzun etiketler dahil) tek tek kontrol edilip
hepsinin tek satırda kaldığı doğrulandı. Tune/UC detay modalinin kendi
`.detail-row`'unun HÂLÂ grid (`180px 610px`) kullandığı, bu değişiklikten
etkilenmediği ayrıca doğrulandı. Konsol hatasız.

`static/styles.css` (v13.2) değişti.

### Takip (2026-09-12) — Güvenlik Denetimi (Faz 1): bulgular + kritik düzeltmeler

Kullanıcı geniş çaplı bir kod incelemesi istedi: güvenlik açığı taraması,
test kapsamı, CI/CD, arayüz hata tespiti. Netleştirme sonrası kapsam: bu
turda sadece **denetim + kritik düzeltmeler**; pytest test paketi ve
Playwright UI testleri ayrı, gelecekteki oturumlara bırakıldı (plan dosyası:
`C:\Users\Oguzhan\.claude\plans\cheerful-puzzling-pumpkin.md`).

Bir Explore ajanıyla `app.py`'nin (3926 satır, 69 route) TÜM güvenlik
yüzeyi (auth/session, RBAC, SQL, dosya yükleme, XSS, CSRF, XSOAR webhook,
PDF üretimi, audit zinciri, config) satır satır tarandı. Proje daha önce
HİÇ test/CI/güvenlik-tarama altyapısına sahip değildi — sıfırdan başlandı.

#### Düzeltilen bulgular

- **B1 (KRİTİK) — `delete_incident_report` yetki kontrolü eksikti**
  (`app.py`, artık `delete_tune`/`delete_usecase`/`delete_hunt` ile aynı
  `if session.get("role")=="analyst": 403` bloğu eklendi). Önceden herhangi
  bir analist `DELETE /api/incident-reports/<id>` ile olay raporu
  silebiliyordu — `docs/REQUIREMENTS.md`'deki izin matrisine ("Sil" =
  sadece Admin) aykırıydı. **Doğrulandı:** test kaydı oluşturup `lowtier`
  (analyst) hesabıyla silme denendi → `403`; admin ile denendi → `200`.
- **B2 (KRİTİK) — `xsoar_url` alanında şema doğrulaması yoktu → saklı XSS**
  riski. Herhangi bir kullanıcı `javascript:...` gibi bir URI yazabiliyordu;
  bu değer `app.js`'te bir `<a href>`'e `esc()` ile (sadece `&<>"` kaçıran,
  şema kontrolü yapmayan) konuyordu — daha yetkili bir kullanıcı o kaydı
  açıp linke tıklarsa kendi oturumunda keyfi JS çalışabilirdi. Yeni
  `sanitize_external_url()` helper'ı (`app.py`) eklendi — sadece `http`/
  `https` şemasına izin veriyor, `create_tune` ve `update_tune`'daki her
  iki save path'inde de uygulandı. **Doğrulandı:** `xsoar_url=
  "javascript:alert(1)"` ile create/update denendi → kayıtta `null`;
  `xsoar_url="https://example.com/..."` ile denendi → olduğu gibi kaydedildi.
- **B4 (ORTA) — Login route'unda brute-force koruması yoktu.** Yeni
  SQLite-backed `login_attempts` tablosu + `LOGIN_MAX_ATTEMPTS=8`/
  `LOGIN_WINDOW_MINUTES=15` sabitleri eklendi (in-memory DEĞİL —
  gunicorn 2 worker'la çalışıyor, worker'lar bellek paylaşmıyor).
  Kullanıcı adı bazında sayılıyor (IP bazında değil — iç kurumsal araç,
  NAT arkasında IP paylaşımı olabilir). Başarılı girişte o kullanıcının
  kayıtları temizleniyor. **Doğrulandı:** aynı kullanıcı adıyla 9 kez
  yanlış şifre denendi → 9.'da `429`; doğru şifre bile artık `429`
  (eşik aşılınca kimlik bilgisi hiç kontrol edilmiyor, beklenen davranış);
  farklı bir kullanıcı adı (`admin`) etkilenmedi, normal giriş yaptı.
- **B5 (ORTA) — Session cookie'de `Secure`/`HttpOnly`/`SameSite` açık
  ayarlanmamıştı.** `SESSION_COOKIE_HTTPONLY=True`, `SESSION_COOKIE_
  SAMESITE="Lax"` eklendi; `SESSION_COOKIE_SECURE` yeni bir `FORCE_HTTPS`
  ortam değişkenine bağlandı (yerel HTTP dev ortamı kırılmasın diye) —
  **prod'da `docker-compose.yml`'e `FORCE_HTTPS=1` eklenmesi gerekiyor**,
  bunu yapmadan bu bayrak prod'da da kapalı kalır (mevcut davranışla aynı,
  regresyon yok, ama etkisiz).
- **B6 (ORTA) — Hiç güvenlik header'ı yoktu.** Yeni `@app.after_request`
  hook'u `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin` ekliyor. **Bilinçli
  sınırlama:** tam bir Content-Security-Policy bu turda YAPILMADI —
  uygulama yoğun inline `style="..."` kullanıyor + Google Fonts CDN'i
  çekiyor, sıkı bir CSP bunları kırar; ayrı/dikkatli bir tur gerektirir.
  **Doğrulandı:** canlı `fetch()` ile response header'larında üçü de
  göründü.
- **B7 (ORTA) — Base64/dosya yükleme yollarında format doğrulaması yoktu**
  — çözülen/yüklenen bytes, gerçekten resim olup olmadığına bakılmaksızın
  diske yazılıyordu (sadece uzantı/mime tahmini vardı). Yeni bağımlılık
  eklemeden (Pillow yok, `imghdr` Python 3.11'de deprecated) PNG/JPEG/GIF/
  WEBP magic-byte imza kontrolü (`_looks_like_image()`, `app.py`) eklendi.
  Onaylanan plandaki kapsam (XSOAR webhook) yanında, AYNI gerekçeyle
  `/api/upload`'a (normal kullanıcı paste/upload akışı) da uygulandı —
  aynı sınıftan bir eksiklik olduğu ve tek satırlık bir genişletme olduğu
  için, ayrı onay beklemeden ekledim (şeffaflık için burada not ediyorum).
  **Doğrulandı:** her iki uçta da rastgele/bozuk bytes → `400`
  ("geçerli bir görsele benzemiyor"); gerçek bir PNG (1x1, base64) → kabul.
  XSOAR webhook'un çoklu-görsel dizisinde geçersiz bir öğe sessizce
  atlanıp geçerli olan kabul edildiği de doğrulandı (mevcut "sessizce
  atla" davranışıyla tutarlı).
- **B8 (DÜŞÜK) — Audit log ekranında eşlenmeyen action label'ı için
  `innerHTML`'e escape'siz fallback** (`static/app.js`) — `esc()` eklendi.
  Şu an sömürülemez (action'lar hep sabit sunucu-taraflı string) ama ucuz
  bir sertleştirme.
- **B9 (DÜŞÜK) — Docker container root olarak çalışıyordu** —
  `Dockerfile`'a non-root `appuser` (`useradd --uid 1000`) + `USER
  appuser` eklendi, `/app` ve `/data` ona chown edildi. **Not:** bu
  makinede Docker kurulu değil, bu yüzden gerçek bir `docker build` ile
  test edilemedi — sadece inceleme yoluyla doğrulandı, prod'a
  dağıtımdan önce bir build/run denemesi önerilir (bind-mount edilen host
  dizinlerinin bu UID'nin yazabileceği izinlerde olması gerekebilir).

#### Sadece raporlanan, kod değişikliği yapılmayan bulgular

- **CSRF token mekanizması yok** — mevcut `fetch()+JSON` deseni klasik
  form-based CSRF'i zorlaştırıyor ama garanti değil; tam bir token
  sistemi (Flask-WTF/custom) büyük bir değişiklik, ayrı bir tur gerektirir.
- **`requirements.txt`'te üst sınır/lockfile yok** — `pip-audit` ile CVE
  taraması öneriliyor, internet erişimi + kurulum + ayrı onay gerektirir.
- **Reddedilen/yetkisiz erişim denemeleri audit log'a yazılmıyor** —
  `docs/audit_logging.md`'de bilinçli bir tasarım kararı olarak zaten
  dokümante edilmiş; bir SOC aracı için yeniden değerlendirilebilir ama
  değiştirilmedi.
- **B3 — Üç secret (`SECRET_KEY`, `AUDIT_CHAIN_SECRET`,
  `XSOAR_WEBHOOK_TOKEN`) + iki varsayılan şifre (`admin`/`Admin123!`,
  `settings`/`Settings123!`), prod'da `.env` ile override edilmezse bu
  repodaki bilinen değerlerle çalışır.** Bu kod değil, deployment/config
  sorunu — production sunucusuna erişim/dokunma yetkisi olmadığı için
  koddan düzeltilemedi. **Kullanıcıya soruldu:** prod'da bu 3 secret ve
  2 varsayılan şifre gerçekten değiştirilmiş mi? Değilse ayrı, acil bir
  "Faz 0" (SSH ile birlikte ele alınacak) iş olarak takip edilmeli.

#### Genel doğrulama

Tüm düzeltmeler canlı tarayıcıda (yerel dummy DB, `tracker.db`) test
edildi: login/logout, Tune/Incident CRUD, XSOAR webhook, sidebar/tab
gezinme regresyon göstermedi; konsol temiz (test sırasında bilerek
tetiklenen 403/429/400'ler hariç); test amaçlı oluşturulan tüm kayıtlar
(2 tune, 2 incident report) temizlendi, `lowtier` test hesabının login
kilidi elle temizlendi.

`app.py`, `static/app.js` (v57), `templates/index.html`, `Dockerfile`
değişti.

### Takip (2026-09-12) — Faz 2: pytest test paketi + coverage + yeni bir fonksiyonel bug

Kullanıcı "devam" dedi — Faz 1'de anlaşılan sıradaki adım: otomatik test
paketi + coverage ölçümü (Playwright UI testleri hâlâ ayrı, Faz 3). Proje
daha önce hiç test altyapısına sahip değildi.

**Test edilebilirlik ön-koşulu:** `app.py`'yi import etmek başlı başına
yan etkiliydi — modül seviyesinde (`if __name__` dışında) `init_db()` VE
`_scheduler.start()` (arka plan job thread'i) çalışıyordu. `app.py`'ye
tek satırlık bir `DISABLE_SCHEDULER` ortam değişkeni gate'i eklendi
(env değişkeni yoksa davranış aynı kalır); `tests/conftest.py` da
`DATABASE`/`UPLOAD_FOLDER`/`BACKUP_DIR`'i `import app`'tan ÖNCE geçici
dizinlere yönlendiriyor — gerçek `tracker.db`'ye asla dokunulmuyor
(mtime testinden önce/sonra aynı kaldığı doğrulandı).

**Yeni bağımlılık:** `requirements-dev.txt` (production image'a girmez):
`pytest`, `pytest-cov`.

**Yazılan test dosyaları** (`tests/`, 49 test, hepsi yeşil):
- `test_auth_security.py` — Faz 1'in TÜM bulgularını (B1 hariç, o
  `test_incident.py`'de) kilitleyen regresyon testleri: login/logout,
  B4 rate-limit, B5 cookie flag'leri, B6 header'lar, `settings_required`/
  `is_senior()` temel davranışı.
- `test_tune.py` — Kural Tuning'in TAMAMI (create/update/delete/validate/
  reject/approve) — diğer 3 modül için referans şablon.
- `test_incident.py` — B1 regresyon testi + 4 durumlu onay akışı.
- `test_xsoar_webhook.py` — `api_key_required`, B2 (webhook path) ve B7
  görsel doğrulaması, mükerrer case koruması, `requested_by` eşleme.

**Coverage:** `pytest --cov=app --cov-report=term-missing` → **%39**
(2253 satırdan 874'ü kapsanıyor). %100 hedeflenmedi — bu ilk tur
"kritik güvenlik yolları + Tuning modülü tam" kapsıyor; Use-Case/Threat
Hunting (aynı `test_tune.py` şablonuyla), Excel/PDF export, backup/
restore, MITRE cache fetch (dış HTTP, mock gerekir) bilinçli olarak bu
turun dışında bırakıldı — Faz 2'nin devamı olarak işaretlendi.

**Test yazarken bulunan yeni bug (güvenlik denetiminin dışında,
fonksiyonel bir hata):** Tune/Use-Case/Hunt'ın ÜÇÜNDE de `update_*()`
route'larının yetki kontrolü, "bir analist raporlamadığı/atanmadığı bir
talebi düzenleyemez" kapısını "kendine atama (claim)" istisnasından ÖNCE
kontrol ediyordu — yani raporlayan olmayan VE henüz atanmamış bir analist
"Üstlen" butonuna bassa (ki arayüz bunu HERKESE gösteriyor, bkz.
`tuneActionBtns()` app.js) backend 403 döndürüyordu. Kullanıcıya soruldu,
"şimdi düzelt" onayı alındı: `is_claiming` hesaplaması ilk yetki
kapısından ÖNCEye taşınıp kapıya eklendi (üç modülde de aynı düzeltme).
**Doğrulandı:** hem pytest'te (`test_full_happy_path`, raporlayan
olmayan bir "worker" kullanıcısının claim etmesi artık 200) hem canlı
tarayıcıda (`lowtier` hesabı, admin'in raporladığı bir kaydı claim etti,
200 + `status: İnceleniyor` + `tuning_analyst: lowtier` doğrulandı).

**Ayrıca fark edilen tutarsızlık:** `sanitize_external_url()` (B2, Faz 1)
sadece manuel `create_tune`/`update_tune`'a uygulanmıştı; XSOAR webhook'un
kendi `xsoar_url` alanı (`xsoar_create_tune()`) aynı sanitizasyondan
GEÇMİYORDU. Aynı fonksiyon oraya da uygulandı — webhook zaten paylaşılan
bir secret gerektirdiği için tehdit modeli daha düşük, ama aynı çıktı
noktasına (aynı `<a href>`) yazdığı için tutarlılık/derinlemesine savunma
adına düzeltildi.

**Doğrulama:** `pytest -v` (49/49 yeşil), coverage raporu üretildi,
`tracker.db` mtime'ı test öncesi/sonrası aynı kaldı, test süreci arka
planda thread bırakmadan (`DISABLE_SCHEDULER=1`) temiz çıktı, canlı
tarayıcıda tüm sekmeler gezilip konsol/sunucu log'u hatasız kaldı.

**Not (kapsam dışı, gelecekte ele alınabilir):** coverage raporunda
`datetime.utcnow()` için çok sayıda `DeprecationWarning` görüldü (Python
3.12+'ta kademeli olarak kaldırılıyor) — `app.py` genelinde ~15+ çağrı
noktası var, ayrı bir temizlik turu gerektirir, bu turda dokunulmadı.

`app.py`, `requirements-dev.txt` (yeni), `pytest.ini` (yeni), `tests/`
(yeni, 4 dosya), `.gitignore` değişti.

### Takip (2026-09-12) — Faz 3: Playwright otomatik UI test paketi

Kullanıcı yine "devam" dedi — üzerinde en başta anlaşılan son faz:
gerçek bir tarayıcıda (Chromium) kritik akışları uçtan uca doğrulayan,
kalıcı/tekrar çalıştırılabilir bir test paketi. Faz 2'nin `tests/`'i
sadece Flask `test_client()` (HTTP katmanı) test ediyordu — JS/DOM'un
gerçekten çalıştığını değil.

**Test edilebilirlik:** Playwright gerçek bir soket ister, `test_client()`
yetmiyor. `werkzeug.serving.make_server()` arka plan thread'inde
başlatılıp testler bitince `.shutdown()` ile kapatılıyor (subprocess
değil — daha hızlı). Faz 2'deki AYNI "ortam değişkenlerini `import
app`'tan ÖNCE ayarla" izolasyon deseni burada da uygulandı.

**Yeni bağımlılıklar:** `playwright`, `pytest-playwright`
(`requirements-dev.txt`); `python -m playwright install chromium` ile
tek seferlik ~115MB'lık tarayıcı ikili dosyası indirildi (bu oturumda
sorunsuz tamamlandı).

**Dizin yapısı:** `tests_e2e/` — Faz 2'nin `tests/`inden BİLİNÇLİ olarak
ayrı (yavaş + tarayıcı kurulumu gerektiriyor, `pytest.ini`'nin varsayılan
`testpaths = tests`'iyle karışmıyor).

**Yazılan testler** (7 test, hepsi yeşil, headless Chromium):
- `test_login_flow.py` — geçerli/geçersiz giriş, giriş yapmamışken
  yönlendirme, logout, B4 rate-limit'in GERÇEK tarayıcıda da (form submit
  + response'un 429 döndüğü) tetiklendiği.
- `test_tune_lifecycle.py` — REFERANS ŞABLON: "+ Yeni Talep" modalını
  gerçek DOM etkileşimiyle (select/fill/click) doldurup kaydetme, listede
  göründüğünü doğrulama; ardından kıdemli bir kullanıcıyla "Onayla/
  Reddet" → validate-modal → "Onayla ✓" tıklayarak ön onay adımını
  tamamlama.

**Bu turda YAZILMAYAN (Faz 3'ün devamı, aynı şablonla):** Use-Case/Hunt/
Incident'ın UI akışları, Dashboard/Audit Log görsel kontrolleri.

**Test yazarken bulunan ve düzeltilen paketleme hatası:** `tests/` VE
`tests_e2e/`'nin HER İKİSİ de kendi `conftest.py`'ına sahip; ikisinde de
`__init__.py` yokken aynı anda çalıştırılınca (`pytest tests/
tests_e2e/`) pytest ikisini de aynı global `conftest` modül adıyla
import etmeye çalışıp ikincisi `ImportError` ile çöküyordu. `tests/
__init__.py` ve `tests_e2e/__init__.py` eklenip importlar `from
tests.conftest import ...` / `from tests_e2e.conftest import ...`
olarak netleştirildi — artık isim çakışması yok. **Önemli mimari not**
(kod olarak "düzeltilmedi", tasarım gereği): `tests/` ve `tests_e2e/`
YİNE DE aynı pytest sürecinde BİRLİKTE çalıştırılamaz — `app.py` kendi
`DATABASE`/`UPLOAD_FOLDER`/`BACKUP_DIR` global'lerini ve `init_db()`/
scheduler başlatmayı import anında, süreç başına BİR KEZ çalıştırıyor;
hangi suite'in conftest'i `app`'i önce import ederse o "kazanır", ikinci
suite'in ortam değişkenleri artık etkisiz kalır. Bu, `pytest.ini`'nin
`testpaths = tests` ile `tests_e2e/`'yi bilinçli olarak dışladığı asıl
sebep — ikisi HER ZAMAN ayrı `pytest` çağrılarıyla çalıştırılmalı
(`pytest tests/` ve ayrıca `pytest tests_e2e/`), bu artık `tests_e2e/
conftest.py`'ın modül docstring'inde de açıkça yazıyor.

**Doğrulama:** `pytest tests_e2e/ -v` → 7/7 yeşil; `pytest tests/` ve
`pytest tests_e2e/` ayrı ayrı çalıştırılıp ikisinin de (49 + 7 = 56 test)
bağımsız geçtiği doğrulandı; `tracker.db` mtime'ı test öncesi/sonrası
aynı kaldı; test süreci arkada thread bırakmadan temiz çıktı.

`requirements-dev.txt`, `tests/__init__.py` (yeni), `tests_e2e/` (yeni,
3 dosya), `.gitignore` değişti; `tests/test_*.py`'deki importlar
`tests.conftest`'e güncellendi (davranış değişmedi).

### Takip (2026-09-12) — GitHub Actions CI

Faz 2 ve Faz 3 tamamlandığına göre (49 + 7 test), her push/PR'da otomatik
çalışan bir CI hattı artık anlamlı — kurulumu bir önceki mesajda önerdim,
kullanıcı onayladı.

`.github/workflows/tests.yml` — iki paralel job:
- **`unit-tests`**: `pytest tests/ --cov=app --cov-report=term-missing`
  (Python 3.11 — prod `Dockerfile`'ın Python sürümüyle tutarlı, bu
  makinenin yerel 3.14'ünden bilinçli olarak farklı).
- **`e2e-tests`**: `python -m playwright install --with-deps chromium`
  (GitHub'ın minimal Ubuntu runner'ında Chromium'un ihtiyaç duyduğu OS
  paketlerini de kurar) + `pytest tests_e2e/`. Tarayıcı ikili dosyası
  `actions/cache` ile önbelleğe alınıyor (sonraki çalıştırmalar daha
  hızlı olsun diye); cache hit olsa bile OS bağımlılıkları ayrı bir
  adımda garanti ediliyor (`install-deps`), çünkü onlar cache'in kendisi
  değil apt paketleri.

Tetikleyiciler: `push` (master), `pull_request` (her dal), `workflow_
dispatch` (elle tetikleme). İki job PARALEL çalışıyor (birbirine bağımlı
değil) — Faz 3'ün dokümante ettiği "tests/ ve tests_e2e/ aynı süreçte
BİRLİKTE çalıştırılamaz" kısıtı burada otomatik olarak sağlanıyor, çünkü
GitHub Actions zaten her job'u ayrı bir runner/süreçte çalıştırıyor.

**Doğrulama:** workflow dosyasının YAML söz dizimi `python -c "import
yaml; yaml.safe_load(...)"` ile ayrıştırılıp doğrulandı (PyYAML'ın
bilinen "Norveç sorunu" nedeniyle `on:` anahtarını `True` olarak
gösterdiği görüldü — bu GitHub'ın kendi ayrıştırıcısını etkilemeyen,
her GitHub Actions dosyasında var olan zararsız bir PyYAML tuhaflığı,
düzeltme gerektirmiyor). Gerçek bir GitHub çalıştırması bu oturumdan
push edildikten sonra Actions sekmesinde görülebilir.

`.github/workflows/tests.yml` (yeni) eklendi.

### Takip (2026-09-12) — Faz 2 devamı: Use-Case + Threat Hunting test modülleri

Kullanıcı yine "devam" dedi. CI kurulduğuna göre, Faz 2'de açıkça
"devamı" olarak işaretlenen iş bu: `test_tune.py` şablonu Use-Case ve
Threat Hunting modüllerine uygulandı (Faz 2'nin orijinal notu: "Use-Case
ve Threat Hunting modülleri test_tune.py şablonu doğrulandıktan sonra
aynı desenle genişletilecek").

Her iki modülün TÜM route'larını (`create_usecase`/`update_usecase`/
`validate`/`reject-validation`/`test-approve`/`test-reject`/
`delete_usecase`; `create_hunt`/`update_hunt`/`validate`/`reject-
validation`/`approve-result`/`reject-result`/`start`/`delete_hunt`)
okuyup tam durum makinelerini (`UC_LOCKED_LEAVE`/`ARRIVE`,
`HUNT_LOCKED_LEAVE`/`ARRIVE` sabitleri) çıkararak yazdım — bu sayede
tahmine dayalı bir deneme-yanılma turu olmadan, ilk çalıştırmada 21
testin TAMAMI yeşil geçti (önceki iki fazda olduğu gibi test yazarken
yeni bir bug bulunmadı bu kez, ama bu da beklenen bir sonuç: claim-
sıralama düzeltmesi zaten önceki turda üç modülün üçüne de uygulanmıştı).

**Yeni testler:**
- `tests/test_usecase.py` (11 test): create validasyonu (zorunlu alanlar,
  çoklu-seçim ortamın virgülle birleştirilmesi), sahiplik kısıtı (claim
  dahil — önceki turdaki düzeltmeyi Use-Case tarafında da regresyon
  testine bağladı), admin-only silme, tam onay hattı (Ön Onay Bekliyor →
  Açık → İnceleniyor → Test Ediliyor → Prod'da Aktif, ayrıca test-reject
  ile geri dönüş).
- `tests/test_hunt.py` (10 test): create validasyonu, admin-only silme,
  claim + "sadece atanan analist başlatabilir" kısıtı (`/start` ucu —
  Tune/UC'de karşılığı olmayan hunt'a özgü bir davranış), tam onay hattı
  (Ön Onay Bekliyor → Açık → İnceleniyor → Sonuç Onayı Bekliyor →
  Tamamlandı, reject-result not zorunluluğu).

**Coverage:** %39 → **%52** (2253 satırdan 1168'i kapsanıyor), 70 test
(49 → 70). Kalan kapsam dışı alanlar aynı (Excel/PDF export, backup/
restore, MITRE cache fetch — dış bağımlılık/mock gerektirenler).

**Doğrulama:** `pytest tests/ -v` → 70/70 yeşil; `tracker.db` mtime'ı
öncesi/sonrası aynı kaldı.

`tests/test_usecase.py` (yeni), `tests/test_hunt.py` (yeni) eklendi.

### Takip (2026-09-12) — Faz 3 devamı: Playwright'ı Use-Case/Hunt/Incident + Dashboard/Audit'e genişletme

Kullanıcı "süreci ilerlet" dedi; birkaç somut seçenek arasından Faz 3'ün
orijinal planında açıkça "bu turda yazılmayacak, aynı şablonla
genişletilecek" diye not edilen işi seçti: `test_tune_lifecycle.py`
şablonu diğer üç modüle + Dashboard/Audit Log'a uygulandı.

**Yeni testler (4 dosya, 8 test, `tests_e2e/`):**
- `test_usecase_lifecycle.py`, `test_hunt_lifecycle.py` — Tune şablonuyla
  birebir aynı iki test (modal ile oluştur → listede görün, Kıdemli Analist
  UI'dan Onayla/Reddet → Açık). UC'nin ortam alanı Tune'unkinden farklı bir
  widget (tek `<select>` değil, "seç + Ekle" etiket listesi) olduğu için
  ayrıca `#uc-env-select` + "+ Ekle" tıklaması gerekti.
- `test_incident_lifecycle.py` — Incident'in farklı akışına uyarlandı: ön
  onay kapısı yok (oluşturma doğrudan "Açıldı"), paylaşılan `validate-modal`
  bileşenine ulaşmadan önce iki düz buton daha var ("İncelemeye Başla",
  "Onaya Gönder"). İkinci test tam zinciri (Açıldı→İncelemede→Onay
  Bekliyor→Kapandı) UI'dan sürüyor.
- `test_dashboard_and_audit.py` — bu ikisinin kendi CRUD modülü yok, o
  yüzden iş akışı sürmek yerine SPA'nın API verisini gerçekten DOM'a
  bastığını doğruluyor: Dashboard KPI kartları girişten sonra sayısal
  değer render ediyor mu; Audit Log ekranı bir aksiyon sonrası doğru
  eşlenmiş etiketle (`ACTION_TR`) bir satır gösteriyor mu.

**Yol boyu bulunan iki gerçek sorun (kod değil, test/varsayım hatası):**
1. İlk yazımda Audit Log testi girişin (`LOGIN`) bir audit satırı
   yazacağını varsaydı — **yanlıştı**: `app.py`'nin `login()` route'u hiç
   `write_audit()` çağırmıyor (`app.js`'teki `ACTION_TR.LOGIN` eşlemesi
   kullanılmayan ölü bir girdi). Test, gerçekten audit yazan bir aksiyona
   (`CREATE_TUNE`) çevrildi.
2. `tests_e2e/conftest.py`'ın `seed_reference_data` fixture'ı bir
   `analysts` tablosuna satır ekliyor ("Talep Eden" dropdown'ları için
   kullanılacağı varsayımıyla) — ama `/api/analysts` route'u (`app.py`)
   aslında `users` tablosunu okuyor; `analysts` tablosu şemada var ama
   hiçbir route tarafından hiç okunmuyor/yazılmıyor, tamamen ölü. Bu
   varsayım daha önce hiç sınanmamıştı çünkü Tune testleri "Talep Eden"i
   hep analist-kendine-kilitli (`lockToSelf`) senaryosunda kullanmıştı.
   Yeni Audit Log testi admin ile (kilitsiz, serbest seçim) bir tune
   oluşturduğu için bu ilk kez ortaya çıktı — dropdown'da seçilecek
   "e2e-reporter" hiç yoktu. **Düzeltme kapsamı bilinçli olarak dar
   tutuldu:** ölü `analysts` tablosunu/route'unu temizlemek bu turun
   konusu değil (istenmedi, ayrı bir iş); sadece yeni testte gerçek bir
   `users` satırı (admin'in kendisi) seçilecek şekilde düzeltildi ve
   kök neden bir yorumla test dosyasına not edildi.

**Doğrulama:** `pytest tests_e2e/ -v --browser chromium` → 15/15 yeşil
(7 önceki + 8 yeni); `pytest tests/ -q` → 70/70 yeşil (regresyon yok);
`tracker.db`'nin mtime'ı çalıştırma öncesi/sonrası değişmedi.

`tests_e2e/test_usecase_lifecycle.py`, `tests_e2e/test_hunt_lifecycle.py`,
`tests_e2e/test_incident_lifecycle.py`, `tests_e2e/test_dashboard_and_audit.py`
(hepsi yeni) eklendi.

### Zengin Metin (Rich Text) Biçimlendirme — Threat Hunting & Olay Raporu (2026-09-13)

Kullanıcı Hunt Raporu ve Olay Raporu'nu yazarken kalın/italik/altı çizili/
satır içi kod/kod bloğu kullanmak istedi; ayrıca XSOAR webhook'undan gelen
metnin de aynı şekilde biçimlendirilebilmesini istedi. Araştırma, bugün
hiçbir yerde (ne manuel girişte ne XSOAR'da) böyle bir standardın var
olmadığını doğruladı — bu tur standardı tanımladı: **Markdown değil,
izin-listeli (allowlist) ham HTML tag'leri** (`<b>` `<i>` `<u>` `<code>`
`<pre>` `<br>`, hiç öznitelik yok). Gerekçe: XSOAR tarafında bir otomasyon
script'i için doğru Markdown kaçışı yapmaktansa string birleştirmek çok
daha kolay; yeni bağımlılık gerekmiyor (stdlib `html.parser.HTMLParser`);
tek, statik bir izin listesiyle güvenlik yüzeyi küçük kalıyor.

- [x] **Sanitizer (`app.py`):** `sanitize_rich_text()`/`strip_rich_text_
  for_plaintext()` — `_RichTextParser(HTMLParser)` tabanlı, regex DEĞİL
  (bilinen bir anti-pattern). `sanitize_external_url()` ile aynı desen:
  yazma anında bir kere temizle, render tarafı buna güvenir. 4 yazma
  yoluna bağlandı: `update_hunt()` (`scope`/`affected_assets`/
  `detection_detail`/`findings_items[].text`/`mitre_techniques[].method`/
  `recommendations[]`/`discovered_vulnerabilities[]` — yeni `jv_rich()`
  helper'ı), `create_incident_report()`, `update_incident_report()`,
  `xsoar_create_incident_report()` (`sections[].text`). Tune'a ve Use-
  Case'e, bölüm **başlığına** ve Hunt'ın `#hunt-modal` (rapor değil, talep
  formu) alanlarına bilinçli olarak dokunulmadı. Threat Hunting'in bugün
  hiç XSOAR webhook'u yok, o yüzden Hunt tarafında özellik sadece manuel
  girişte devrede.
- [x] **Toolbar (`static/app.js`):** `richToolbarHtml()`/`wrapSelection()`
  — `<textarea>`'lar contenteditable'a çevrilmedi (mevcut görsel-yapıştırma
  özelliği bozulmasın diye), toolbar her zaman kontrol ettiği textarea'nın
  DOM'da bir önceki kardeşi olacak şekilde eklenip seçili metni
  `textarea.selectionStart/End` ile sarıyor, gerçek bir `input` event'i
  tetikleyerek mevcut veri-bağlama/autoGrow kodunu değiştirmeden yeniden
  çalıştırıyor. 3 sabit Hunt Raporu alanına + 5 dinamik listeye (Bulgu,
  MITRE Yöntem Notu, Öneri, Zafiyet, Olay bölüm metni) eklendi.
- [x] **Render:** `openHuntDetail()`/`openIncidentDetail()`'deki ilgili
  ~8 `esc()` çağrısı, veri zaten yazma anında sanitize edildiği için ham
  HTML olarak basılacak şekilde değiştirildi (bazı `esc()` çağrıları
  sadece bir truthy-kontrolü için hesaplanıp asla DOM'a basılmadığı
  doğrulanıp DOKUNULMADI). `.hp-card-body`'ye eksik olan `white-space:
  pre-wrap` eklendi (yoksa gerçek satır sonları görsel olarak kayboluyordu
  — `<pre>`/`<br>`'dan bağımsız, önceden var olan bir eksiklik). `static/
  styles.css`'e bare `pre`/`code` render kuralları + `.rt-toolbar`/
  `.rt-btn` eklendi.
- [x] **PDF şablonları:** `hunt_report_print.html`/`incident_report_
  print.html`'de ilgili alanlara `| safe` eklendi (bu kod tabanında İLK
  `|safe` kullanımı — veri zaten sanitize edildiği için güvenli) + her
  ikisinin kendi `<style>` bloğuna `pre`/`code` kuralı (PDF'te scroll
  olmadığı için sarma var, overflow yok).
- [x] **Excel export:** `strip_rich_text_for_plaintext()` ile ilgili
  hücreler düz metne çevrildi; bu sırada **mevcut bir hata da düzeltildi**
  — `recommendations` bugüne kadar ham JSON string olarak export
  ediliyordu (`mitre_txt`/`ioc_txt`/`vuln_txt` gibi `json.loads()`+join
  YAPILMIYORDU), zaten dokunulacak satır olduğu için aynı desene çevrildi.
  Olay Raporu `sections`'ının Excel'e hiç export edilmediği (önceden de
  öyleydi) bilinçli olarak bu turda EKLENMEDİ, kod içine `# TODO` notu
  bırakıldı.
- [x] `docs/xsoar_integration.md`'ye yeni bir alt-başlık eklendi: `sections
  [].text` için desteklenen 6 tag + örnek + "allowlist dışı her şey
  sessizce süzülür, istek reddedilmez" notu.
- [x] **Doğrulandı (pytest + canlı tarayıcı + gerçek PDF/Excel):**
  - `tests/test_rich_text.py` (yeni, 10 test): sanitizer'ın allowlist/
    script-kaçırma/entity-round-trip/malformed-tag/plaintext davranışları.
  - `tests/test_hunt.py`, `tests/test_incident.py`'a birer entegrasyon
    testi (izinli+izinsiz tag karışık gönderilip GET'te doğrulandı).
  - `tests/test_xsoar_webhook.py`'a `<script>`/`<img onerror>` içeren
    kötü niyetli bir payload'ın webhook üzerinden (oturum-kimlik-
    doğrulamasız tek dış erişilebilir yazma yolu) sanitize edildiğini
    doğrulayan test.
  - `pytest tests/ -q` → **84/84 yeşil** (70→84, +14 yeni test).
  - Canlı tarayıcıda: toolbar'ın 3 butonu (Kalın/İtalik/Satır içi kod) hem
    statik Hunt alanında hem dinamik olmayan bir Incident bölümünde
    denendi, doğru sarıldığı ve detay view'da gerçekten render olduğu
    (literal tag değil) doğrulandı; çok satırlı metnin göründüğü teyit
    edildi (`.hp-card-body` düzeltmesi). Gerçek bir kötü niyetli payload
    doğrudan XSOAR webhook'undan (doğru API anahtarıyla) gönderilip
    hem API yanıtında hem `openIncidentDetail()` render'ında `<script>`/
    `onerror`'ın tamamen temizlendiği, `<b>ok</b>`'un kalın render
    olduğu, konsolda hiç alert/hata çıkmadığı doğrulandı. Gerçek bir
    Hunt'ı "Tamamlandı"ya taşıyıp PDF'i indirip **WeasyPrint çıktısını
    doğrudan okuyarak** kalın/kod render'ının PDF'te de doğru göründüğü
    teyit edildi. Excel export indirilip "Hedef & Kapsam" hücresinin
    tag'siz, `<br>`'siz temiz düz metin gösterdiği doğrulandı. Test
    kayıtları (Hunt #2, Incident #30/#31) temizlendi, sidebar sayaçları
    test öncesi haline (Tuning 2, UC 2, Hunt 1) döndüğü teyit edildi.

`app.py`, `static/app.js`, `static/styles.css`, `templates/hunt_report_
print.html`, `templates/incident_report_print.html`, `templates/index.html`
(cache-buster `?v=`), `docs/xsoar_integration.md`, `tests/test_rich_text.py`
(yeni), `tests/test_hunt.py`, `tests/test_incident.py`, `tests/
test_xsoar_webhook.py` güncellendi.

### Kapsamlı Test Turu — Güvenlik + Arayüz + Fonksiyonel Regresyon (2026-09-13)

Kullanıcı Zengin Metin özelliğinden sonra geniş kapsamlı bir test istedi:
güvenlik açığı, arayüz bozulması/çakışması, "sıkışma" olmasın. Önce plan
sunuldu (bkz. bu dosyanın sürüm geçmişinde, plan dosyası
`cheerful-puzzling-pumpkin.md`), onaylandıktan sonra 4 izde uygulandı.

**A) Otomatik regresyon:** `pytest tests/ -v --cov` → 84/84 yeşil (%54
coverage), `pytest tests_e2e/` → 15/15 yeşil. B1-B9 (Faz 1) hâlâ kodda
mevcut, regresyon yok.

**B) Kod-seviyesi güvenlik incelemesi — `security-review` becerisi (2 alt-
ajan: bulgu tespiti + bağımsız doğrulama):**

- 🔴 **KRİTİK, GERÇEK BULGU — hemen düzeltildi:** `update_hunt()`'ın yeni
  `jv_rich()` yardımcı fonksiyonu (düz-string-listesi dalı — Öneriler/
  Zafiyetler), bir liste öğesi `string` DEĞİLSE (ör. bir JSON dict) onu
  `sanitize_rich_text()`'ten HİÇ geçirmeden olduğu gibi saklıyordu. Bir
  saldırgan (o hunt'ın talep edeni veya atanan analisti — `discovered_
  vulnerabilities` alanı `not is_assigned` kilit listesinde bile değildi,
  yani sadece talep eden bile yeterliydi) `PUT /api/hunt/<id>` ile
  `{"discovered_vulnerabilities": [{"x": "<img src=... onerror=...>"}]}`
  gönderebiliyordu — Jinja bir dict'i `|safe` ile basarken Python'ın dict
  repr'ini (`{'x': '<img ...>'}`) OLDUĞU GİBİ yazdırıyor, WeasyPrint bunun
  içindeki `<img>`/`<link>` etiketini gerçek bir etiket olarak tanıyor
  (öznitelikleri dahil) — hem PDF'e keyfi/attribute'lu HTML enjeksiyonu
  hem de (WeasyPrint varsayılan URL fetcher'ı `file://`/`http(s)://`
  kısıtlamasız desteklediği için, bu render pipeline'ın zaten logo/font
  gömmek için `file://` kullandığı doğrulandı) sunucu taraflı istek
  sahteciliği (SSRF) / yerel dosya erişimi riski. **Düzeltme:** `jv_rich()`
  artık her öğeyi tipi ne olursa olsun `sanitize_rich_text()`'ten geçiriyor
  (`sanitize_rich_text()` zaten kendi içinde `str()` dönüşümü yapıyor);
  `hunt_report_pdf()`'e de savunma-derinliği olarak `isinstance(v, str)`
  filtresi eklendi. Regresyon testi: `tests/test_hunt.py::
  TestRichTextSanitization::test_non_string_list_items_do_not_bypass_sanitizer`.
  İki alt-ajanla bağımsız doğrulandı (confidence 8/10, gerçek/High).
- Ek saldırı payload'ları elle denendi (`<ScRiPt>`, `<b/onmouseover=...>`,
  `<svg/onload=...>`, çift `&lt;`-kodlama, iç içe/bozuk tag'ler,
  string-olmayan tipler doğrudan `sanitize_rich_text()`'e) — hepsi güvenli
  şekilde ele alındı, ek bulgu çıkmadı. Tek kozmetik (güvenlik dışı) not:
  eşleşmeyen bir kapanış tag'i (`<b>a</i>x</b>`) sanitizer'dan öznitelik-
  siz ama dengesiz HTML olarak geçebiliyor — tarayıcılar bunu zararsızca
  tolere ediyor (adoption-agency algoritması), gerçek kullanım senaryosunda
  oluşması da beklenmiyor (toolbar hep dengeli çift üretiyor); düzeltme
  gerektirmiyor.

**C) Arayüz/erişilebilirlik incelemesi — `web-design-guidelines` becerisi:**
Yeni `.rt-btn` (araç çubuğu butonları) sitedeki diğer ikon butonlarla
(`.btn-icon`, 30×30px + `:focus-visible` halkası) TUTARSIZDI — 26×26px
ve klavye ile Tab'lanınca markalı odak halkası yoktu (tarayıcı varsayılan
halkasına düşüyordu — erişilebilirlik açığı değil ama görsel tutarsızlık).
**Düzeltildi:** `.rt-btn` 30×30px'e çıkarıldı, `:focus-visible` kuralına
eklendi. `aria-label` eksikliği tüm sitede (sadece `title`) zaten var olan,
bu oturumla ilgisi olmayan bir desen — yeni butonlar bilinçli olarak aynı
deseni izliyor, ayrı bir iş olarak not edildi.

**D) Canlı tarayıcı fonksiyonel yürüyüşü:** Yeni bir Hunt (#2) üzerinde
zengin metin araç çubuğunun **8 alanının TAMAMI** (3 statik: Hedef&Kapsam/
Etkilenen Varlıklar/Detection Detayı + 5 dinamik: Bulgu/MITRE Yöntem Notu/
Öneri/Zafiyet), 5 butonun (Kalın/İtalik/Altı Çizili/Kod/Kod Bloğu) HER
BİRİYLE tek tek denendi — hepsi doğru sarıyor, ayrı `input` event'i doğru
tetikleniyor, paste dinleyicileri (`_pasteReady` flag + `onpaste`
attribute) toolbar eklenince de sağlam kaldığı DOM'dan doğrudan doğrulandı.
Kaydedilen kayıt `openHuntDetail()`'de 6/6 bölümde doğru render edildi;
Hunt "Tamamlandı"ya taşınıp **PDF indirilip gerçek içeriği okunarak**
2 sayfa boyunca tüm biçimlendirmenin (kod bloğu dahil, taşma yok) doğru
göründüğü teyit edildi. Aynı döngü Olay Raporu (#33, kod bloğu) için de
tekrarlandı — PDF'te kusursuz render. **Yol boyu bulunan ikinci küçük
bulgu:** legacy `findings` alanı (frontend her kaydede `findings_items`
ile senkronize ediyor) Excel'in "Bulgular" sütununda artık ham tag
gösterebiliyordu — `strip_rich_text_for_plaintext()` eklenerek düzeltildi.
Responsive: masaüstü ve **tablet (768px)** genişlikte Dashboard + Hunt
Raporu modali (en yoğun ekran) kusursuz; **mobil (375px)** genişlikte
sidebar sabit kalıp içeriği büyük ölçüde kapatıyor — bu, bu oturumdan
ÖNCE VAR OLAN, kapsam dışı bir sınırlama (uygulama masaüstü/tablet
odaklı tasarlanmış, `styles.css`'te mobil-genişlik için bir off-canvas
sidebar deseni hiç yok) — düzeltilmedi, ayrı bir iş olarak not edildi.
Audit Log ("Zinciri Doğrula" → 381/381 kayıt geçerli), Kural Tuning/
Use-Case/Ayarlar/Audit Log sayfaları görsel olarak da hatasız.

**Temizlik:** test kayıtları (Hunt #2, Incident #33) silindi; kullanıcının
kendi manuel testinden kalan Incident #32 ("Dbasadas") bilinçli olarak
DOKUNULMADI (kendi verisi). Son durum: Tuning 2, UC 2, Hunt 1, Incident 2
(#7 örnek + #32 kullanıcı testi) — doğrulandı.

`app.py` (jv_rich + hunt_report_pdf + Excel findings düzeltmeleri),
`static/styles.css` (.rt-btn boyut/focus-visible), `tests/test_hunt.py`
(yeni regresyon testi) güncellendi.

### Faz P/R/S — Dashboard İş Listesi, Trend Grafikleri, Genel Arama (2026-07-20)

Kullanıcının seçtiği üç iyileştirme (öneri #3/#4/#5), her biri ayrı fazda
yapılıp doğrulandı ve commit'lendi.

- [x] **Faz P — "Bana Bekleyen İşler" paneli** (dashboard en üstü):
  *Onayımı Bekleyenler* (onay kapısındaki tüm talepler — tune Ön Onay/Tune
  Edildi, UC Ön Onay/Test Ediliyor, hunt Ön Onay/Sonuç Onayı; yalnızca
  `is_senior` olan Kıdemli Analist/Müdür'e gösterilir, değilse sütun gizli)
  ve *Üzerimdeki İşler* (kullanıcının çalışan analist olarak atandığı,
  terminal olmayan talepler). Tek kaynak `GET /api/my-work`. Satıra tıklama
  → `goToItem()` ilgili sekmeyi açıp detay modalini açar.
- [x] **Faz R — Trend (Son 12 Ay) mini grafikleri:** `GET /api/trends?
  months=N` (1-24 clamp) → modül başına ay-ay Açılan (`created_at`) vs
  Kapanan (`completed_at`) + Hunt Saati (`hunt_duration_hours` toplamı).
  Kapanan = completed_at; üç modülde de başarı/kapanış terminaline geçişte
  set edildiği doğrulandı. Dashboard'da 4 kompakt inline-SVG sparkline
  kartı (dış kütüphane yok). Aylık rapor tek ayın fotoğrafıyken bu SOC-CMM
  "sürekli iyileşme" ekseni için zaman-serisi kanıtı verir. Trend, tek-ay
  filtresinden bağımsız hep tam geçmişi gösterir.
- [x] **Faz S — Genel arama** (sidebar, tüm modüller): `GET /api/search?q=`
  (min 2 karakter, modül başına ≤8) tune/UC/hunt içinde case ID, kural adı,
  konu, gerekçe, analist üzerinde LIKE arar. Sidebar'daki kutuya yazınca
  (220ms debounce) `position:fixed` bir sonuç açılır listesi çıkar
  (sidebar'ın `overflow-y:auto`'suna takılmasın diye konum JS ile
  hesaplanır); tıklama `goToItem()` ile öğeyi açar. "Bu case daha önce
  açılmış mı" için mükerrer-case engeliyle örtüşür.
- [x] **Uçtan uca doğrulandı** (geçici senior/analyst debug hesaplar,
  `requests` script'leri + gerçek tarayıcı): my-work senior/non-senior
  gating + assigned filtresi; trends 12 aylık seri DB ile tutarlı (tune
  opened 9, closed 5, hunt saati 3+8); search tüm modüllerde eşleşme, min-2
  kuralı, dropdown konumu (sidebar overflow'una takılmıyor), tıklama
  navigasyonu + detay modali. Yol boyu bir TDZ bug'ı yakalandı (`HUNT_CLS`e
  modül-eval anında erişim) ve class map'i render anına taşıyarak çözüldü.
  Test hesapları temizlendi, tune sayısı 9, audit zinciri geçerli.

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
