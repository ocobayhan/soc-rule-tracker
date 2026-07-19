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
**Durumlar:** Açık → İnceleniyor → Tamamlandı / İptal  

### 2. Use-Case
SIEM use-case geliştirme taleplerinin yönetimi.

**Alanlar:** Ortam (multi-select), Use-Case Tanımı, Kural Adı, Kural Yazarı, Notlar, Durum  
**Kapanış:** MITRE ATT&CK sınıflandırması (tactic + technique + yöntem notu), "Sınıflandırma yapıldı" checkbox  
**Durumlar:** Açık → İnceleniyor → Tamamlandı / İptal  

### 3. Threat Hunting
Proaktif tehdit avı taleplerinin ve raporlarının yönetimi.

**Talep Alanları:** Hunt Konusu, Ortam (multi-select), Talep Eden, Atanan Analist, Notlar, Durum  
**Rapor Bölümleri:**
1. Hedef & Kapsam (textarea + görsel)
2. MITRE ATT&CK teknikleri (tactic → technique, per-technique yöntem notu)
3. Bulgular: "Bulgu var mı?" → IOC listesi, Şiddet, Etkilenen Varlıklar (koşullu)
4. Detection Önerisi (Evet/Hayır + detay)
5. Öneriler (textarea + görsel)
6. Sonuç (Pozitif / Negatif / Yetersiz Veri)
7. Rapor Durumu (Taslak / Tamamlandı)

**Durumlar:** Açık → İnceleniyor → Tamamlandı / İptal  

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
