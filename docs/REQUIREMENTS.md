# SOC Tracker — Gereksinimler

## Genel Bakış

SOC (Security Operations Center) analistleri için web tabanlı takip ve raporlama aracı.  
Flask + SQLite backend, vanilla JS SPA frontend (Jinja2 server-side render, client-side routing).

---

## Kullanıcı Rolleri

| Rol | Açıklama |
|-----|----------|
| `admin` | Tüm modüllere tam erişim, kullanıcı oluşturma, tüm kayıtları düzenleme/silme |
| `analyst` | Kendi taleplerini açar, atanan taleplerin raporunu doldurur |
| `settings` | Sadece Ayarlar sayfasına erişir, kullanıcı yönetimi yapar |

Ayrıca her kullanıcının `role`den bağımsız bir **onay seviyesi** (`tier`)
vardır: `Analist` / `Kıdemli Analist` / `Müdür`. Onay gerektiren işlemler
(tune/UC/hunt approve) bu alana bakar. Detay: `docs/rbac.md`.

---

## Modüller

### 1. Kural Tuning
Kural gürültüsü / false-positive azaltma taleplerinin yönetimi.

**Alanlar:** Ortam, Kural Adı, Tune Sebebi, Tetiklenme Sıklığı, Analist, Nasıl Tune Edildi, Durum  
**Görseller:** Kanıt, Çözüm  
**Durumlar:** Ön Onay Bekliyor → Açık → İnceleniyor → Tune Edildi → Tune Başarılı (veya Yeniden Tune → Açık) / Tune Edilmedi — ön onay reddedilirse Reddedildi (bkz. "Onay Süreci" altta)  
**XSOAR entegrasyonu:** "Needs Tuning" playbook adımından webhook ile otomatik talep açılabilir (`xsoar_case_id`, `xsoar_url` alanları) — bkz. `docs/xsoar_integration.md`  

### 2. Use-Case
SIEM use-case geliştirme taleplerinin yönetimi.

**Alanlar:** Ortam (multi-select), Use-Case Tanımı, Kural Adı, Kural Yazarı, Notlar, Durum  
**Kapanış:** MITRE ATT&CK sınıflandırması (tactic + technique + yöntem notu), "Sınıflandırma yapıldı" checkbox  
**Durumlar:** Ön Onay Bekliyor → Açık → İnceleniyor → Test Ediliyor → Prod'da Aktif (veya revizyon → İnceleniyor) / Yazılamaz — ön onay reddedilirse Reddedildi (bkz. "Onay Süreci" altta)  

### 3. Threat Hunting
Proaktif tehdit avı taleplerinin ve raporlarının yönetimi.

**Talep Alanları:** Hunt Başlığı (2026-08-17 — kısa/tanımlayıcı, tablo/detay/PDF'te ana görüntülenen isim), Hunt Konusu (detaylı açıklama, sadece detay/PDF içeriğinde), Ortam (multi-select), Talep Eden, Atanan Analist, Notlar, Durum  
**Rapor Bölümleri:**
1. Hedef & Kapsam (textarea + görsel)
2. MITRE ATT&CK teknikleri (tactic → technique, per-technique yöntem notu)
3. Bulgular: "Bulgu var mı?" → IOC listesi, Şiddet, Etkilenen Varlıklar (koşullu)
4. Detection Önerisi (Evet/Hayır + detay)
5. Öneriler (textarea + görsel)
6. Sonuç (Pozitif / Negatif / Yetersiz Veri)
7. Rapor Durumu (Taslak / Tamamlandı)

**Durumlar:** Ön Onay Bekliyor → Açık → İnceleniyor → Sonuç Onayı Bekliyor → Tamamlandı (veya revizyon → İnceleniyor) / İptal — ön onay reddedilirse Reddedildi (bkz. "Onay Süreci" altta). İptal, sonuç onayı gerektirmez.  

### 4. Olay Raporu (Incident Report) — 2026-08-16 (Faz W)
XSOAR'da bir case bir playbook tarafından "incident" olarak kapatıldığında oluşturulan, veya bir analistin doğrudan SOC Tracker'dan elle açtığı, küçük/minik kapsamlı olay raporlarının yönetimi. RBAC gate'i yok (Tune/UC/Hunt gibi tüm giriş yapmış kullanıcılara açık).

**Alanlar:** Başlık, Ortam, Raporlayan, Case No (`xsoar_case_id`/`xsoar_url`, opsiyonel — elle açılan bir rapor bir case'e bağlı olmayabilir)  
**Bölümler:** Sabit alan listesi yok — `sections` bir `{heading, text}` dizisi, başlıkları playbook/analist serbestçe belirler (yapılandırılmış ama esnek bir "olay raporu" formatı)  
**Görseller:** Sıralı bir galeri (`images`, `sections`'dan bağımsız) — "Görsel 1, Görsel 2…" diye sırayla numaralanır; hem ekranda hem PDF çıktısında aynı etiketle görünür ki bölüm metinlerindeki "Görsel N" atıfları doğru görsele karşılık gelsin  
**Durumlar:** Taslak (webhook veya elle açılır, düzenlenebilir) → Onaylandı / Reddedildi (zorunlu gerekçe notuyla) — bkz. "Onay Süreci" altta, Hunt'ın sonuç-onayı kapısıyla aynı mantık ("bitmiş içerik iyi mi")  
**XSOAR entegrasyonu:** Webhook ile otomatik rapor açılır (`xsoar_case_id`, `title`, `environment`, `sections`, opsiyonel `images`/`requested_by`), ayrıca mevcut bir rapora sonradan tek tek görsel eklemek için ayrı bir webhook — bkz. `docs/xsoar_integration.md`, "Olay Raporu Webhook'u" bölümü  
**PDF export:** Sadece Onaylandı raporlar için — Hunt'ın PDF altyapısıyla (logo, Montserrat font, sabit görsel sınırı) aynı desen

---

## Genel Gereksinimler

### İzin Matrisi (tüm modüller)
| İşlem | Admin | Analist (talep eden) | Analist (atanan) |
|-------|-------|----------------------|-----------------|
| Talep aç | ✅ | ✅ | ✅ |
| Talep alanlarını düzenle | ✅ | ✅ | ❌ |
| Rapor doldur | ✅ | ❌ | ✅ |
| Üstlen | ✅ | ✅ | ✅ |
| Kapat | ✅ | ❌ | ✅ |
| Sil | ✅ | ❌ | ❌ |

### Onay Süreci — Tuning & Use-Case (2026-07-19, Faz 4)

Bu iki modülde yukarıdaki tabloya ek olarak **iki onay kapısı** var, ikisi de
`role`den bağımsız `tier`e (Kıdemli Analist/Müdür — bkz. `docs/rbac.md`) bakar:

1. **Ön onay:** yeni talepler `Ön Onay Bekliyor` durumunda açılır (istemciden
   gelen durum bilgisi yok sayılır). Kıdemli Analist/Müdür onaylarsa `Açık`'a
   geçer ve normal akış başlar; reddederse (gerekçe zorunlu) `Reddedildi`
   olarak kapanır.
2. **Son onay (Q&A'lı):** Tuning'de `Tune Edildi → Tune Başarılı`, UC'de
   `Test Ediliyor → Prod'da Aktif` geçişi artık otomatik değil — Kıdemli
   Analist/Müdür "test ortamında sorunsuz mu", "peer review yapıldı mı"
   sorularını işaretleyip zorunlu bir onay notu girmeden bu geçiş olmaz.

Bu iki durum arasındaki (ve bu durumlara giren/çıkan) geçişler genel
`PUT` uçlarından değil, sadece `/validate`, `/reject-validation`,
`/approve` (tune), `/test-approve`, `/test-reject` (UC) uçlarından yapılabilir.

### Onay Süreci — Threat Hunt (2026-07-19, Faz 5)

Tuning/UC ile aynı iki kapılı desen, hunt'a özel isimlerle:

1. **Ön onay:** yeni hunt talepleri `Ön Onay Bekliyor` durumunda açılır.
   Kıdemli Analist/Müdür onaylarsa `Açık`'a geçer; reddederse (gerekçe
   zorunlu) `Reddedildi` olur.
2. **Sonuç onayı:** analist raporu tamamlayıp "Rapor Tamamlandı — Onaya
   Gönder" seçtiğinde hunt `Sonuç Onayı Bekliyor`'a geçer (artık doğrudan
   `Tamamlandı` seçilemez). Kıdemli Analist/Müdür sonucu onaylar (→
   `Tamamlandı`) veya revizyona gönderir (gerekçe zorunlu → `İnceleniyor`).

`İptal` bilinçli olarak bu onay kapısının dışında bırakıldı — bir hunt'tan
vazgeçmek kalite onayı gerektirmiyor, sadece "Tamamlandı" (başarılı bir
sonuç raporu) onay ister.

### Ortam (multi-select)
- Birden fazla ortam seçilebilir (PROD, DEV, TEST, vb.)
- Storage: virgülle ayrılmış string (`"PROD,DEV"`)
- Filtreleme: INSTR tabanlı SQLite sorgusu
- UI: tag sistemi (ekle/çıkar)

### MITRE ATT&CK
- STIX JSON GitHub'dan çekilir, `mitre_cache` tablosunda saklanır
- Tactic → Technique hiyerarşisi, dropdown ile seçim
- Her teknik için yöntem notu (textarea)
- Storage: JSON array (`[{id, name, tactic, method}]`)

### Audit Log
- Her CREATE/UPDATE/DELETE/CLOSE/CLAIM işlemi loglanır
- `audit_log` tablosu: user_id, username, action, record_type, record_id, detail, created_at, prev_hash, record_hash
- Sadece admin görebilir
- Hash-zincirleme (tamper-evidence): her kayıt bir öncekine sha256 ile bağlı, "Zinciri Doğrula" butonu (admin) veya `verify_audit.py` CLI ile bütünlük doğrulanır — bkz. `docs/audit_logging.md`
- 24 saatte bir audit log JSON olarak dayanıklı bir konuma (backups dizini) dışa aktarılır

### Excel Export
- 4 sheet: Tuning, Use-Case, Threat Hunting, Kullanıcılar
- openpyxl ile oluşturulur
- Tüm kayıtlar + tüm alanlar

### KPI / Dashboard
- Açık / İnceleniyor / Tamamlandı sayıları (her modül için)
- Son aktivite listesi

---

## Teknik Kısıtlar
- Python 3.x + Flask
- SQLite (WAL mode)
- Vanilla JS (jQuery/framework yok)
- Görüntüler base64 olarak DB'de saklanır
- Jinja2 server-side rendering (is_settings branch)
- Frontend versiyonlaması: `app.js v14`, `styles.css v10`
