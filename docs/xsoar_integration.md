# XSOAR Entegrasyonu — Webhook (Tuning)

XSOAR'da bir playbook "Needs Tuning" adımına geldiğinde, bu uç noktaya bir
HTTP isteği atarak SOC Tracker'da otomatik bir Tuning talebi açılabilir.

## Uç Nokta

```
POST /api/integrations/xsoar/tune
```

## Kimlik Doğrulama

Kullanıcı oturumu (session/cookie) **kullanılmaz** — sabit bir API anahtarı
header'ı gerekir:

```
X-API-Key: <XSOAR_WEBHOOK_TOKEN ortam değişkeninin değeri>
```

`XSOAR_WEBHOOK_TOKEN`, `docker-compose.yml`'de tanımlıdır (varsayılan bir
dev/placeholder değeri vardır — **production'da mutlaka `.env` üzerinden
override edilmeli**, `SECRET_KEY`/`AUDIT_CHAIN_SECRET` ile aynı desen).
Karşılaştırma `hmac.compare_digest` ile zamanlama saldırılarına karşı
korumalı yapılır (bkz. `app.py:api_key_required`).

Anahtar eksik/yanlışsa `401` döner.

## İstek Gövdesi (JSON)

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `xsoar_case_id` | ✅ | XSOAR incident/case numarası. Tune talebinde referans olarak saklanır, detay ekranında case linkiyle birlikte gösterilir. |
| `rule_name` | ✅ | Tune edilmesi gereken SIEM kuralının adı. |
| `environment` | ✅ | Ortam (örn. `PROD`, `DEV`) — mevcut ortamlar listesindeki bir isimle eşleşmeli. |
| `analyst_comment` | ✅ | Playbook'u ilerleten analistin tune gerekçesi. `tune_reason` alanına yazılır. |
| `xsoar_url` | opsiyonel | Incident'a doğrudan tıklanabilir link. Verilirse detay ekranında case ID bir link olarak gösterilir. Boş bırakılırsa ve Ayarlar'da bir URL şablonu tanımlıysa, `xsoar_case_id`'den otomatik oluşturulur (bkz. aşağıdaki "SOAR Case URL Şablonu" bölümü). |
| `requested_by` | opsiyonel | Talebi XSOAR tarafında ilerleten analistin **SOC Tracker'daki kullanıcı adı** (Ad Soyad değil). Eşleşen bir kullanıcı bulunursa `reporter` o kullanıcı olur — kişi bazlı istatistiklerde (`/api/stats/users`, Excel "Kullanıcı Aktivitesi" sayfası) bu talep artık doğru analiste sayılır. Eşleşmezse (yazım hatası, tracker'da olmayan biri) istek yine kabul edilir, `reporter` genel `"XSOAR Entegrasyonu"` etiketine düşer — hiçbir istek bu yüzden reddedilmez. |

Eksik zorunlu alan varsa `400` ve hangi alan(lar)ın eksik olduğunu belirten
bir hata döner.

## Davranış

- Oluşan talep **`reporter = "XSOAR Entegrasyonu"`**, **`status = "Ön Onay
  Bekliyor"`** ile açılır — otomatik/harici kaynaklı bir talep olduğu için,
  tıpkı elle açılan taleplerde olduğu gibi bir insan (Kıdemli Analist/Müdür)
  onaylamadan işleme alınmaz. Bkz. `docs/rbac.md`, Faz 4.
- Audit log'a `CREATE_TUNE_XSOAR` aksiyonu ile, XSOAR case ID referanslı
  şekilde yazılır.
- Başarılı yanıt: oluşturulan tune kaydının tamamı (`201`).
- **Mükerrer case koruması (2026-07-20):** Gönderilen `xsoar_case_id` için
  zaten aktif (reddedilmemiş) bir tuning talebi varsa, yeni kayıt
  **açılmaz** — `409` döner ve gövdede `{"existing_id": <mevcut talep ID>,
  "duplicate": true}` bulunur. Böylece XSOAR playbook'unun aynı case'i iki
  kez tetiklemesi (retry / çift ateşleme) mükerrer talep yaratmaz. Playbook
  tarafında `409` + `duplicate:true` yanıtı "zaten var, sorun değil" olarak
  ele alınabilir. Reddedilmiş bir case için gönderim yine yeni talep açar.

## Örnek İstek

```bash
curl -X POST https://<sunucu>:9897/api/integrations/xsoar/tune \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <XSOAR_WEBHOOK_TOKEN>" \
  -d '{
    "xsoar_case_id": "12345",
    "xsoar_url": "https://xsoar.example.com/#/Details/12345",
    "rule_name": "Suspicious PowerShell Execution",
    "environment": "PROD",
    "analyst_comment": "Kural çok fazla yanlış pozitif üretiyor, whitelist gerekiyor.",
    "requested_by": "analist1"
  }'
```

## XSOAR Tarafında Kurulum

Bu doküman sadece SOC Tracker tarafını kapsar. XSOAR'da "Needs Tuning"
durumuna geçen bir incident/playbook task'ının bu endpoint'e HTTP isteği
atacak şekilde (örn. bir "HTTP Request" otomasyon görevi veya webhook
entegrasyonu ile) yapılandırılması gerekir — bu kısmın kurulumu XSOAR
tarafındaki ekiple birlikte yapılmalı.

## Genişletme

Tuning'in yanı sıra artık Olay Raporu (Incident Report) modülü de aynı
desenle destekleniyor (bkz. aşağıdaki "Olay Raporu Webhook'u" bölümü). Aynı
yaklaşım (yeni bir `/api/integrations/xsoar/<modül>` ucu + `api_key_required`
decorator'ının yeniden kullanılması) ileride Use-Case ve Threat Hunt için de
uygulanabilir.

# Olay Raporu Webhook'u (2026-08-16)

XSOAR'da bir case bir playbook tarafından **"incident"** olarak
kapatıldığında, bu uç noktaya bir HTTP isteği atarak SOC Tracker'da
otomatik, küçük bir olay raporu açılabilir. Tuning webhook'undan farklı
olarak rapor gövdesi sabit alanlar değil, **yapılandırılmış bir bölüm
listesi** (`sections`) — başlıkları playbook/kullanıcı serbestçe belirler.

## Uç Nokta

```
POST /api/integrations/xsoar/incident-report
```

## Kimlik Doğrulama

Tuning webhook'uyla **aynı** mekanizma ve **aynı** token
(`XSOAR_WEBHOOK_TOKEN`) — yukarıdaki "Kimlik Doğrulama" bölümüne bakın.

```
X-API-Key: <XSOAR_WEBHOOK_TOKEN ortam değişkeninin değeri>
```

## İstek Gövdesi (JSON)

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `xsoar_case_id` | ✅ | XSOAR incident/case numarası. |
| `title` | ✅ | Olay raporunun başlığı. |
| `environment` | ✅ | Ortam (örn. `PROD`, `DEV`). |
| `sections` | ✅ | En az bir dolu madde gerekir. Dizi, her öğe `{"heading": "...", "text": "..."}` — `text` boş olan öğeler otomatik elenir; hepsi elenirse `400` döner. Başlıklar (`heading`) serbest metin, koda gömülü sabit bir alan listesi **yok** — playbook rapor şablonunu tamamen kendi belirler. |
| `images` | opsiyonel | En fazla 50 öğe. Dizi, **her öğe ham bir base64 string** (obje değil) — opsiyonel `data:image/png;base64,...` / `data:image/jpeg;base64,...` önekiyle, önek yoksa `.png` varsayılır. Gönderilme **sırasına** göre `order` alanı (1, 2, 3…) otomatik atanır ve rapor arayüzünde "Görsel 1", "Görsel 2"… diye numaralanır — tüm görseller **tek çağrıda**, `sections`'dan bağımsız ayrı bir galeri olarak gönderilir (Hunt raporundaki madde-başı-görsel deseninden farklı). Çözülemeyen/geçersiz bir öğe sessizce atlanır, isteğin geri kalanını etkilemez. |
| `requested_by` | opsiyonel | Tuning webhook'uyla aynı davranış: SOC Tracker'daki kullanıcı adıyla eşleşirse `reporter` o kullanıcı olur, eşleşmezse `reporter` genel `"XSOAR Entegrasyonu"` etiketine düşer — hiçbir istek bu yüzden reddedilmez. |

Eksik zorunlu alan varsa `400` ve hangi alan(lar)ın eksik olduğunu belirten
bir hata döner.

## Davranış

- Oluşan rapor **`status = "Taslak"`** ile açılır — XSOAR'dan gelen veri
  bozuk/eksik olabileceğinden, doğrudan nihai rapor haline gelmez: bir
  analist SOC Tracker üzerinde başlığı/bölümleri/görselleri serbestçe
  düzenleyebilir, ardından bir Kıdemli Analist/Müdür Onaylar veya (zorunlu
  gerekçe notuyla) Reddeder.
- `xsoar_url`, Tuning'le aynı mekanizmayla (bkz. "SOAR Case URL Şablonu"
  bölümü) `xsoar_case_id`'den otomatik oluşturulur.
- Audit log'a `CREATE_INCIDENT_XSOAR` aksiyonu ile, bölüm/görsel sayısı ve
  `requested_by` eşleşme durumu detayında yazılır.
- Başarılı yanıt: oluşturulan olay raporu kaydının tamamı (`201`).
- **Mükerrer case koruması:** Tuning'le aynı kural — gönderilen
  `xsoar_case_id` için zaten aktif (`Reddedildi` olmayan) bir olay raporu
  varsa yeni kayıt açılmaz, `409` + `{"existing_id": ..., "duplicate": true}`
  döner. Reddedilmiş bir case için gönderim yine yeni rapor açar.

## Örnek İstek

```bash
curl -X POST https://<sunucu>:9897/api/integrations/xsoar/incident-report \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <XSOAR_WEBHOOK_TOKEN>" \
  -d '{
    "xsoar_case_id": "12345",
    "title": "Phishing e-postası — kullanıcı tıkladı",
    "environment": "PROD",
    "requested_by": "analist1",
    "sections": [
      {"heading": "Olay Özeti", "text": "Kullanıcı X, phishing e-postasındaki linke tıkladı."},
      {"heading": "Etki", "text": "Tek istasyon etkilendi, yanal hareket gözlenmedi."},
      {"heading": "Alınan Aksiyon", "text": "İstasyon izole edildi, parola sıfırlatıldı."}
    ],
    "images": [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ]
  }'
```

## Kapsam Dışı (v1)

PDF export bu ilk sürümde yok — Hunt raporunun PDF deseni (Montserrat font,
sabit görsel sınırları, `WEASYPRINT_EXE` yerel yedek yolu) doğrudan yeniden
kullanılabilir hale geldiğinde, ayrı ve küçük bir takip fazı olarak
eklenecek.

## SOAR Case URL Şablonu (2026-07-20)

Çoğu kurulumda SOAR incident URL'leri sondaki case numarası dışında hep
aynıdır. Bunun için Ayarlar > XSOAR Entegrasyonu ekranında bir kere bir
şablon tanımlanabilir, örn.:

```
https://xsoar-soc.example.com/Custom/caseinfoid/[CASENO]
```

`[CASENO]` yer tutucusu zorunludur (`PUT /api/settings/xsoar-url-template`
bunu doğrular, yoksa `400` döner) — kaydedilirken `xsoar_case_id` URL-encode
edilerek yerine konur.

Şablon tanımlıysa, aşağıdaki üç noktada **`xsoar_url` boş bırakıldığında**
(ve case "SOAR'da bulunamadı" olarak işaretlenmediğinde) otomatik
oluşturulur — elle girilen bir URL her zaman şablona göre önceliklidir:

- Manuel Tuning talebi oluşturma (`POST /api/tune`)
- Manuel Tuning talebi düzenleme (`PUT /api/tune/<id>`)
- Bu webhook (`POST /api/integrations/xsoar/tune`) — `xsoar_url` gönderilmezse

Şablon, `app_settings` tablosunda `xsoar_url_template` anahtarıyla saklanır
(`get_app_setting`/`set_app_setting`, `app.py`). Değişiklikler audit log'a
`EDIT_SETTING` aksiyonuyla, eski→yeni değer detayında yazılır.

## Manuel Tuning Taleplerinde SOAR Case Zorunluluğu (2026-07-19)

Bu webhook'tan bağımsız bir kural: artık **elle** (UI üzerinden) açılan
Tuning taleplerinde de bir SOAR case referansı zorunlu — amaç, tune
edilen her kuralın SOAR'da işaretlenebilen gerçek bir case'e
dayanmasını sağlamak.

- `xsoar_case_id` alanı zorunlu (POST `/api/tune`, 400 döner eksikse).
- Case gerçekten SOAR'da yoksa, "SOAR'da case bulunamadı" kutucuğu
  işaretlenip aynı alana elle bir case no girilir — bu durumda
  `xsoar_case_missing='Evet'` olarak işaretlenir ve case linki alanı
  anlamsız olduğu için devre dışı kalır.
- **Not:** XSOAR'ın kendi API'sine gerçek zamanlı bir sorgu atılmıyor —
  case'in gerçekten var olup olmadığı doğrulanmıyor, sadece bir
  referansın girilmiş olması zorunlu tutuluyor. Gerçek API doğrulaması
  istenirse XSOAR'ın sorgu endpoint'i + kimlik bilgileri gerekir, bu
  ayrı ve daha büyük bir entegrasyon işi olur.
- Bu zorunluluk sadece **yeni kayıt oluştururken** geçerli — bu
  özellikten önce açılmış, case ID'si olmayan eski kayıtlar
  düzenlenebilmeye devam eder (geriye dönük olarak kilitlenmezler).
- Kapsam sadece Tuning — Use-Case ve Threat Hunt'a bilinçli olarak
  uygulanmadı.

### Mükerrer Case Engeli (2026-07-20)

Aynı `xsoar_case_id` için birden fazla **aktif** tuning talebi açılamaz —
elle oluşturmada ve düzenlemede de (webhook'la aynı kural) çakışma `409`
döner ve mevcut talebin ID'si mesajda belirtilir. **Reddedilmiş**
(`Reddedildi`) talepler istisna: reddedilen bir case bilinçli olarak
yeniden açılabilir. Kural uygulama seviyesinde (DB UNIQUE kısıtı değil)
işler; bu özellikten önce oluşmuş olası çift kayıtlar geriye dönük
kilitlenmez, sadece yeni create/edit'ler denetlenir.
