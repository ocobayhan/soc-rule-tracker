# SOC Tracker — İlerleme Günlüğü

## Son Güncelleme: 2026-05-06

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

## 🔧 Bilinen Sorunlar / Bekleyen İşler

- [ ] Sunucu testi: son oturumda sunucu offline'dı (192.168.1.39) — tüm değişiklikler pull + restart bekliyor
- [ ] Excel export'ta Hunt Ortamı multi-select düzgün görünüyor mu kontrol edilmeli
- [ ] Hunt raporu görselleri (scope_image, findings_image, recommendations_image) backend'de kayıt + detay görünümünde render

---

## 📌 Commit Geçmişi (Son 5)

| Hash | Açıklama |
|------|----------|
| 321f8ad | feat: user management - role change and password reset |
| 240b08b | feat: multi-env select, MITRE dedup, remove related requests |
| 33ce45b | feat: complete Threat Hunting module with MITRE ATT&CK integration |
| 29083d5 | feat: add Threat Hunting module — request/claim/report/detail, DB schema, KPI, Excel export |
| 1b64b44 | docs: add Threat Hunting module design plan |
