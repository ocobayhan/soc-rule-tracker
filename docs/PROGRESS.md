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
- [ ] Threat Hunt: talep açılır açılmaz "gerçek" hunt sayılıyor, ön onay (hipotez onayı) adımı yok — **Faz 5**
- [ ] Threat Hunt raporları için PDF export yok — **Faz 6**
- [ ] XSOAR entegrasyonu yok (Needs Tuning → otomatik tuning talebi) — **Faz 7**

> Not: 2026-07-19'da konuşulan 8 fazlı (Faz 0-7) güvenilirlik/hesap verebilirlik yol haritası onaylandı —
> plan dosyası: `C:\Users\Oguzhan\.claude\plans\cheerful-puzzling-pumpkin.md`. Faz 0/1 (SSH gerektiren
> canlı doğrulama ve volume-rm testi) kullanıcıyla birlikte deploy günü yapılacak şekilde ertelendi;
> Faz 1'in kod tarafı tamamlandı.

---

## 📌 Commit Geçmişi (Son 5)

| Hash | Açıklama |
|------|----------|
| f9a9d9d | feat: UX quality improvements — animations, transitions, scroll performance |
| d998975 | fix: remove hunt-report-modal from global overlay-click-close listener |
| 0a7369f | fix: disable outside-click close on hunt report modal — only X button closes it |
| bf19053 | fix: null-safe UC form reset in openHuntReportModal to prevent silent TypeError |
| c63f0e7 | fix: fmtDate returns plain dash instead of HTML to prevent esc() double-encoding in detailRow |
