# SOC Tracker — İlerleme Günlüğü

## Son Güncelleme: 2026-06-11

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

## 🔧 Bilinen Sorunlar / Bekleyen İşler

- [ ] Detay görünümlerinde (tune/UC/hunt) `approved_by`, `tuned_at`, `test_notes` alanları gösterilmeli

---

## 📌 Commit Geçmişi (Son 5)

| Hash | Açıklama |
|------|----------|
| 321f8ad | feat: user management - role change and password reset |
| 240b08b | feat: multi-env select, MITRE dedup, remove related requests |
| 33ce45b | feat: complete Threat Hunting module with MITRE ATT&CK integration |
| 29083d5 | feat: add Threat Hunting module — request/claim/report/detail, DB schema, KPI, Excel export |
| 1b64b44 | docs: add Threat Hunting module design plan |
