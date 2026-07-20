# Audit Logging

## Route'lara audit logu nasıl eklenir

Her state-değiştiren route, işlemi kaydettikten ve `db.commit()` çağrıldıktan
**sonra** `write_audit()` çağırmalıdır (`app.py`):

```python
write_audit(ACTION, record_type, record_id, detail)
```

- `ACTION`: sabit, büyük harf, modül_fiil biçiminde (örn. `CREATE_TUNE`,
  `CLOSE_UC`, `APPROVE_TUNE`). Yeni bir action eklerken `static/app.js`
  içindeki `ACTION_TR` (Türkçe etiket) ve `ACTION_CLS` (rozet rengi)
  haritalarına da bir satır eklenmeli, yoksa Audit Log ekranında ham action
  adı görünür.
- `record_type`: `"tune"`, `"usecase"`, `"hunt"`, `"user"`, `"audit"` gibi.
- `record_id`: ilgili kaydın ID'si (yoksa `None`).
- `detail`: kısa, insan-okur özet (örn. `f"Kural: {rule_name}"`) — form
  alanlarını olduğu gibi değil, **özetlenmiş** halde yaz; görseller/base64
  asla `detail`'e konmaz.

## Sanitizasyon

`detail` serbest metin olarak saklanır ama SQL parametreli sorgu kullanıldığı
için enjeksiyon riski yok. Frontend tarafında `static/app.js`'teki `esc()`
fonksiyonu ile HTML-escape edilerek gösterilir — yeni bir audit alanı
eklerken bunu atlamayın (bkz. `esc()` kullanılmayan bir alanın XSS'e açık
kalması, geçmişte `fmtDate`'te yaşanan bir hataydı).

## Hash-Zincirleme (Tamper-Evidence)

`audit_log` tablosuna eklenen `prev_hash`/`record_hash` kolonları ile her
kayıt bir öncekine kriptografik olarak zincirlenir:

```
record_hash = sha256(AUDIT_CHAIN_SECRET | prev_hash | user_id | username |
                      action | record_type | record_id | detail | created_at)
```

- `prev_hash`: bir önceki audit satırının `record_hash`'i (ilk satır için
  sabit `"GENESIS"` değeri).
- `AUDIT_CHAIN_SECRET`: ortam değişkeni (`app.py` / `verify_audit.py`),
  production'da `SECRET_KEY` gibi değiştirilmelidir. Bu salt olmadan biri
  bir satırı değiştirip hash'i "doğru" görünecek şekilde yeniden hesaplayamaz.
- Hash hesaplama ve doğrulama mantığı **tek yerde**, `verify_audit.py`
  içinde tanımlıdır; `app.py` bunu import eder (kod tekrarı yok).

**Sınırlama:** Migration'dan önceki (2026-07-19 öncesi) satırların
`prev_hash`/`record_hash`'i `NULL`'dur — bunlar geriye dönük zincirlenemez.
Zincir, migration sonrası ilk `write_audit()` çağrısından itibaren
`GENESIS`'ten başlar. Bu, offline/air-gapped bir ortamda (harici bir Zaman
Damgası Otoritesi kullanmadan) ulaşılabilecek en güçlü reddedilemezlik
seviyesidir: bir kayıt DB'ye doğrudan erişilerek silinir/değiştirilirse
zincir kopar ve doğrulama bunu tespit eder — ama zincirin "migration'dan bu
yana sağlam" olduğunu kanıtlar, "kayıt gerçekten o tarihte oluşturuldu"
diye bağımsız üçüncü taraf kanıtı sunmaz (bunun için RFC 3161 TSA gerekir,
kullanıcı ile bu ortamda gerekli olmadığı netleştirildi).

**Bilinen eşzamanlılık sınırı:** Zincir hesaplaması ("son hash'i oku, yeni
hash'i hesapla, ekle") açık bir transaction kilidi ile korunmuyor — kodun
geri kalanıyla tutarlı, basit read-then-write deseni kullanılıyor. Çok
nadir durumda iki eşzamanlı istek aynı `prev_hash`'i okuyup yazarsa
doğrulama o noktada bir "prev_hash uyuşmuyor" uyarısı verebilir; bu,
kayıtların **kaybolduğu** anlamına gelmez, sadece zincirleme sırasının bir
yarış durumuna denk geldiği anlamına gelir. Böyle bir uyarı görülürse önce
bu ihtimal değerlendirilmeli, otomatik olarak "tampering" varsayılmamalıdır.

## Settings Rolünün ID/Tarih Override'ları (2026-07-20)

`settings` rolündeki kullanıcılar Tuning/Use-Case/Threat Hunt kayıtlarında
ID ve tarih alanlarını (`created_at`/`completed_at`/`started_at`) elle
değiştirebilir (düzeltme amaçlı — bkz. ilgili `update_*` route'ları).
Bu güçlü bir yetenek olduğu için `detail`'e **ayrıca** ne değiştiği eski→yeni
biçiminde ekleniyor:

```
"... | MANUEL DÜZENLEME (settings): ID: 9→500; Oluşturulma Tarihi: 2026-07-19 11:25:33→2020-01-01 00:00:00"
```

Bu sayede audit log'un kendisi hash-zincirle korunsa bile, "bu kayıt manuel
olarak ne zaman/nasıl düzenlendi" sorusu ayrıca, açıkça denetlenebilir hale
gelir — genel bir "EDIT_TUNE" satırı bunu göstermezdi. Yeni bir route'a
override eklerken bu deseni (`override_parts` listesi + eski/yeni
karşılaştırması, sadece override GERÇEKTEN olduğunda `detail`'e ekleme)
takip edin.

## Doğrulama

- **UI:** Audit Log ekranında "Zinciri Doğrula" butonu → `POST /api/audit/verify`
  (admin only) → `verify_audit.verify_chain()` çalıştırır, sonucu audit
  log'a da yazar (`VERIFY_AUDIT_CHAIN`).
- **CLI / offline:** `python verify_audit.py --db /path/to/tracker.db` —
  canlıya dokunmadan, bir yedek dosyasına karşı da çalıştırılabilir. Bu,
  sertifikasyon denetimi sırasında bağımsız bir doğrulama imkânı sağlar.

## Dışa Aktarım (Certification Evidence)

`scheduler.py` üzerinden her 24 saatte bir `_export_audit_snapshot()`
(`app.py`) çalışır: tüm `audit_log` tablosunu + zincir ucu hash'ini JSON
olarak `BACKUP_DIR`'e (DB'den bağımsız, host bind-mount edilmiş dayanıklı
konum — bkz. `docs/PLAN_SCHEDULER_REDESIGN.md`) yazar, son 30 export'u
saklar. Bu, DB'nin kendisinden bağımsız ayrı bir kanıt izi oluşturur:
DB tamamen kaybedilse bile bu export'lar denetim için kullanılabilir.

## Checklist (yeni bir route eklerken)

- [ ] Durum değiştiren her POST/PUT/DELETE sonrası `write_audit()` çağrıldı mı?
- [ ] `ACTION` adı `ACTION_TR`/`ACTION_CLS`'e eklendi mi?
- [ ] `detail` özetlenmiş mi (görsel/base64 içermiyor mu)?
- [ ] Yetki kontrolü audit çağrısından **önce** yapılıyor mu (yetkisiz
      denemeler için audit yazılmaz — bu bilinçli bir tasarım kararı,
      gelecekte "reddedilen erişim denemeleri" de loglanmak istenirse
      ayrı bir action tipi (`DENIED_*`) eklenmeli)?
