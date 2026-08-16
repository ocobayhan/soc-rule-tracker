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
- [ ] **Kurum logosu — bekliyor.** Kullanıcı bir logo görseli paylaştı ama
  bu araç setinde sohbete yapıştırılan bir görseli doğrudan dosyaya kaydetme
  imkanı yok — kullanıcının dosyayı `static/`'e koyması veya yolunu vermesi
  gerekiyor. Header'a eklenmesi ayrı, küçük bir takip işi.
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
