# Threat Hunting Modülü — Tasarım Planı

## Genel Bakış

Mevcut iki modülün (Kural Tuning, Use-Case) yanına üçüncü bir modül olarak ekleniyor.
Nav'da "Threat Hunting" sekmesi açılır; iş akışı diğerleriyle tutarlıdır:
talep aç → üstlen / ata → raporu kademeli doldur → kapat.

---

## 1. Threat Hunt Talebi — Alanlar

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| Hunt Konusu | textarea | ✅ | Araştırılacak senaryo / amaç |
| Ortam | dropdown | ✅ | Diğer modüllerle aynı ortam listesi |
| Talep Eden | dropdown | ✅ | Analist için kendi adına kilitli |
| Atanan Analist | dropdown | — | Boş bırakılabilir, sonradan üstlenilir |
| Notlar | textarea | — | Ek bağlam |
| Durum | dropdown | ✅ | Açık / İnceleniyor / Tamamlandı / İptal |

### Otomatik Takip Edilen Tarihler
| Alan | Ne Zaman Dolar |
|---|---|
| `created_at` | Talep oluşturulduğunda |
| `started_at` | Analist üstlendiğinde (status → İnceleniyor) |
| `completed_at` | Kapatıldığında (status → Tamamlandı / İptal) |
| `report_updated_at` | Rapor her kaydedildiğinde |

---

## 2. Threat Hunt Raporu — Bölümler

Rapor, talep kaydının içinde tutulur (ayrı tablo yok).
Analist kademeli doldurabilir; "Rapor Durumu: Taslak" bırakabilir, geri gelebilir.

| # | Bölüm | Textarea | Görsel |
|---|---|---|---|
| 1 | **Hedef & Kapsam** | ✅ | ✅ |
| 2 | **Analiz Yöntemi** | ✅ | ✅ |
| 3 | **Bulgular** | ✅ | ✅ |
| 4 | **MITRE ATT&CK** | ✅ (serbest metin, ör. T1059.001) | — |
| 5 | **Detection Önerisi** | Evet / Hayır seçimi + detay textarea | — |
| 6 | **Öneriler** | ✅ | ✅ |
| 7 | **Sonuç** | Pozitif / Negatif / Yetersiz Veri | — |
| 8 | **Rapor Durumu** | Taslak / Tamamlandı | — |

> Görseller her bölüme ayrı eklenir (paste veya dosya), diğer modüllerle aynı base64 mekanizması.

---

## 3. Veritabanı Şeması

```sql
CREATE TABLE IF NOT EXISTS threat_hunt_requests (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Talep alanları
    hunt_subject        TEXT NOT NULL,
    environment         TEXT NOT NULL DEFAULT '',
    requester           TEXT NOT NULL DEFAULT '',
    assigned_analyst    TEXT DEFAULT '',
    notes               TEXT DEFAULT '',
    status              TEXT NOT NULL DEFAULT 'Açık',
    -- Rapor alanları
    report_status       TEXT DEFAULT 'Taslak',
    scope               TEXT DEFAULT '',
    scope_image         TEXT,
    method              TEXT DEFAULT '',
    method_image        TEXT,
    findings            TEXT DEFAULT '',
    findings_image      TEXT,
    mitre_techniques    TEXT DEFAULT '',
    detection_suggestion TEXT DEFAULT 'Hayır',
    detection_detail    TEXT DEFAULT '',
    recommendations     TEXT DEFAULT '',
    recommendations_image TEXT,
    hunt_result         TEXT DEFAULT '',
    -- Tarihler
    created_at          TEXT NOT NULL,
    started_at          TEXT,
    completed_at        TEXT,
    report_updated_at   TEXT,
    updated_at          TEXT NOT NULL
);
```

---

## 4. İzin Modeli (Diğer Modüllerle Tutarlı)

| İşlem | Admin | Analyst (talep eden) | Analyst (atanan) |
|---|---|---|---|
| Talep aç | ✅ | ✅ | ✅ |
| Hunt Konusu / Ortam düzenle | ✅ | ✅ | ❌ |
| Rapor doldur (tüm bölümler) | ✅ | ❌ | ✅ |
| Üstlen (boş talebi al) | ✅ | ✅ | ✅ |
| Kapat / Tamamlandı | ✅ | ❌ | ✅ |
| Sil | ✅ | ❌ | ❌ |

---

## 5. İleride Eklenebilecekler (Acele Yok)

- **"Kural Öner" butonu** → Rapordan otomatik Use-Case talebi açar
- **Tekrarlayan hunt'lar** → Periyodik hunt şablonları
- **Ekip hunt'u** → Birden fazla analist ataması

---

## 6. Uygulama Adımları

- [x] `init_db()` içine `threat_hunt_requests` tablosu ekle
- [x] Backend: CRUD endpoint'leri (`/api/hunt` GET/POST, `/api/hunt/<id>` GET/PUT/DELETE)
- [x] Backend: İzin kontrolleri (reporter/assigned mantığı)
- [x] Backend: Audit log entegrasyonu
- [x] Frontend: Nav'a "Threat Hunting" sekmesi ekle
- [x] Frontend: Talep listesi tablosu (diğerleriyle tutarlı stil)
- [x] Frontend: Yeni talep modal'ı
- [x] Frontend: Düzenle modal'ı (talep alanları)
- [x] Frontend: Rapor modal'ı (MITRE ATT&CK tactic/technique + Bulgular koşullu bölüm + Hunt Ortamı multi-select)
- [x] Frontend: Üstlen / Kapat modal'ları
- [x] Frontend: Detay görünümü
- [x] Excel export'a 4. sheet olarak ekle
- [x] KPI / Dashboard entegrasyonu
- [ ] Test & commit (sunucu testi bekliyor)
