# RBAC — Roller ve Onay Seviyeleri

SOC Tracker'da yetkilendirme **iki bağımsız boyut** üzerinden çalışır. Bunları
karıştırmayın — birinin kontrolü diğerini etkilemez.

## Boyut 1: `role` — Sistem / CRUD Yetkisi

`users.role`, üç değerden biri: `admin`, `analyst`, `settings`. Bu, modül
bazlı günlük kullanım yetkisini belirler ve **değişmedi** (2026-07-19
roadmap'i bu boyuta dokunmuyor):

| Rol | Yetki |
|-----|-------|
| `admin` | Tüm modüllere tam erişim, kayıt silme, audit log görüntüleme; ayrıca Ayarlar sayfasına da erişir (ortam/kullanıcı yönetimi, yedekleme, XSOAR entegrasyon bilgisi) |
| `analyst` | Kendi taleplerini açar/düzenler, atandığı taleplerin raporunu doldurur — bkz. `docs/REQUIREMENTS.md` izin matrisi |
| `settings` | Sadece Ayarlar sayfası: ortam/kullanıcı yönetimi, ID/tarih override (Dashboard/Tuning/UC/Hunt/Audit'a erişimi yok) |

Backend kontrolü: `session.get("role")`. Frontend kontrolü: `USER_ROLE`
(`templates/index.html` → `static/app.js`).

**2026-07-19 düzeltmesi:** Ayarlar sayfası (`is_settings` şablon koşulu)
önceden yalnızca `role == "settings"` olduğunda render ediliyordu — admin
için nav'da "Ayarlar" hiç görünmüyordu, dolayısıyla admin yedekleme
panelini ("Veri Yedekleme") UI üzerinden hiçbir zaman göremiyordu (bu
satırın belgelediği "backup yönetimi" yetkisiyle çelişen bir durumdu).
Şablon koşulu `is_settings or user_role == "admin"` olarak, backend'de
`settings_required` decorator'ı da `role in ("settings", "admin")` olarak
güncellendi — admin artık Ayarlar sekmesinin tamamını (ortam/kullanıcı/
yedekleme/XSOAR paneli) görüp kullanabiliyor, Dashboard/Tuning/UC/Hunt/
Audit sekmeleri admin için değişmedi.

## Boyut 2: `tier` — Onay Seviyesi (Kıdem)

`users.tier`, üç değerden biri: `Analist`, `Kıdemli Analist`, `Müdür`
(sabitler: `app.py` → `TIER_ANALIST`/`TIER_KIDEMLI`/`TIER_MUDUR`/`TIERS`).
Bu, **onay gerektiren işlemleri** (tune/UC/hunt approve — Faz 4/5) kimin
yapabileceğini belirler ve `role`den tamamen bağımsızdır:

- Bir kullanıcı `role=analyst` + `tier=Kıdemli Analist` olabilir: günlük
  CRUD yetkisi normal bir analist gibidir, ama onay adımlarını
  imzalayabilir.
- Bir kullanıcı `role=admin` + `tier=Analist` olabilir (nadir, ama teknik
  olarak mümkün): sistem yönetimi yapabilir ama onay adımlarını
  imzalayamaz.

Backend kontrolü: `is_senior()` (`app.py`) — `session.get("tier") in
SENIOR_TIERS` (`SENIOR_TIERS = (TIER_KIDEMLI, TIER_MUDUR)`). Frontend
kontrolü: `USER_TIER` / `IS_SENIOR` (`templates/index.html` →
`static/app.js`).

**Neden ayrı bir boyut?** Kullanıcı 2026-07-19'da şunu netleştirdi: "ilk
roller [admin/analyst/settings] aynı kalsın kullanım olarak ama onay
süreçleri için ikinci rolleri [Müdür/Kıdemli Analist/Analist] kullanalım."
Yani mevcut günlük kullanım davranışını bozmadan, onay hiyerarşisini ayrı
bir eksen olarak eklemek gerekiyordu.

## Migration ve varsayılanlar

`tier` kolonu ilk eklendiğinde (additive `ALTER TABLE`, `app.py:init_db()`)
mevcut kullanıcılara **bir kerelik** varsayılan atanır:

- `role='admin'` → `tier='Müdür'`
- `role='analyst'` → `tier='Analist'`

Bu, mevcut sistemde kimse aniden onay yetkisi kazanmasın/kaybetmesin diye
bilinçli bir tasarım: migration sonrası **hiçbir onay davranışı değişmez**
(Faz 3 sadece altyapıyı kurar, Faz 4/5 fiilen onay akışlarını bu alana
bağlar). Kurum, hangi analistlerin "Kıdemli Analist" olacağına Ayarlar
ekranından karar verir.

## Yönetim

Ayarlar → Kullanıcılar panelinde her kullanıcı için **iki ayrı** dropdown
vardır: Rol (admin/analyst) ve Onay Seviyesi (Analist/Kıdemli
Analist/Müdür). `settings` rolündeki kullanıcı bu ekranda listelenmez
(değişmedi).

**Not:** Rol/tier değişikliği, kullanıcının session'ına sadece **yeniden
giriş yaptığında** yansır (session'da tutulan `role`/`tier` login anında
DB'den okunur, `app.py:login()`) — bu, mevcut rol değişikliği davranışıyla
tutarlıdır.

## Kullanan modüller (Faz 4/5)

`is_senior()` şu onay uçlarında kullanılacak/kullanılıyor:

- Tuning: ön onay (`Onay Bekliyor → Açık`) ve son onay (`Tune Edildi →
  Tune Başarılı`, mevcut `approve_tune`)
- Use-Case: ön onay ve son onay (`Test Ediliyor → Prod'da Aktif`, mevcut
  `test_approve_uc`/`test_reject_uc`, Q&A formuyla genişletilecek)
- Threat Hunt: ön onay (hipotez onayı) ve rapor tamamlandıktan sonraki
  ikinci onay
- Olay Raporu (Incident Report, Faz W): tek onay kapısı — Taslak → Onaylandı/
  Reddedildi (`validate_incident_report`/`reject_incident_report`). Diğer üç
  modülden farklı olarak ön onay yok (webhook'tan zaten Taslak olarak açılır,
  ikinci bir "işleme alınsın mı" kapısına gerek yok) — tek soru Hunt'ın son
  onayıyla aynı: "bitmiş içerik iyi mi".

Detaylar için `docs/PROGRESS.md`'deki Faz 4/5/W maddelerine bakın.
