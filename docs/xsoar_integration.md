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
| `xsoar_url` | opsiyonel | Incident'a doğrudan tıklanabilir link. Verilirse detay ekranında case ID bir link olarak gösterilir. |
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

Şu an sadece Tuning modülü destekleniyor. Aynı desen (yeni bir `/api/
integrations/xsoar/<modül>` ucu + `api_key_required` decorator'ının
yeniden kullanılması) ileride Use-Case ve Threat Hunt için de
uygulanabilir.

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
