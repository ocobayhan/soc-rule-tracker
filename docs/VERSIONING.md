# Versiyonlama

## Kural (Semantic Versioning — kısaca)

Versiyon üç rakamdan oluşur: **MAJOR.MINOR.PATCH** (örn. `0.1.0`).

| Rakam | Ne zaman artırılır | Örnek |
|-------|---------------------|-------|
| **PATCH** (sondaki) | Küçük düzeltmeler: bug fix, görsel düzeltme, küçük bir alan/filtre eklenmesi. Kullanıcı akışını değiştirmez. | `0.1.0 → 0.1.1` |
| **MINOR** (ortadaki) | Yeni bir özellik/modül eklendi ama mevcut kullanım şekli bozulmadı (ör. bu oturumdaki KPI'lar, Audit Log filtreleme, Ad Soyad desteği gibi "ara versiyon" güncellemeleri). | `0.1.4 → 0.2.0` |
| **MAJOR** (baştaki) | Büyük, temel bir değişiklik: mimari değişiklik, geriye dönük uyumsuz bir kırılma, ya da "artık gerçekten yeni bir sürüm" denilebilecek kapsamlı bir güncelleme (ör. varlık envanteri/CMDB modülü, SIEM entegrasyonu gibi köklü eklemeler). | `0.7.0 → 1.0.0` |

`0.x.y` aralığı "henüz olgunlaşma/aktif geliştirme" dönemini ifade eder —
gündelik kullanımda değişebilecek küçük kırılmalar olabilir. `1.0.0`'a
geçiş, "bu artık kurumun üzerine güvenle inşa edebileceği, stabil bir taban"
anlamına gelir — kullanıcı ne zaman bu eşiğe geçmek istediğine karar verir.

## Şu anki versiyon

**v0.1.0** — bu oturumdan (2026-07-20) itibaren, mevcut kod tabanının
başlangıç noktası olarak kabul edildi (öncesindeki tüm Faz 1-7 + A-L
çalışması dahil).

## Nerede tanımlı, nerede görünür

- **Tek kaynak:** `app.py` içindeki `APP_VERSION` sabiti.
- Flask `context_processor` ile **her template'e otomatik** `app_version`
  olarak geçiyor — yeni bir sayfa eklerken elle bir şey yapmaya gerek yok.
- Görünür olduğu yerler: sidebar alt köşesi (`index.html`), giriş sayfası
  (`login.html`), aylık rapor'un altbilgisi (`report.html` — hangi versiyonun
  bu raporu ürettiğini gösterir, sertifikasyon kanıtı için faydalı), Excel
  export'un "KPI Özeti" sayfası ("Uygulama Versiyonu" satırı).

## Bunu KARIŞTIRMAYIN: `static/app.js`/`styles.css`'teki `?v=NN` sayıları

Bunlar **ürün versiyonu DEĞİL** — sadece tarayıcı önbelleğini temizletmek
için kullanılan, her JS/CSS değişikliğinde 1 artan sayaçlar (bkz. CLAUDE.md:
"Frontend ve backend bağımsız hızlarda ilerleyebilir"). `APP_VERSION`
değiştiğinde bunları da güncellemeniz gerekmez, birbirinden bağımsızdır.

## Versiyon nasıl artırılır

1. `app.py`'de `APP_VERSION = "X.Y.Z"` satırını güncelle.
2. `docs/PROGRESS.md`'ye o versiyonda neyin değiştiğini not et (zaten her
   fazda yapılan bir şey — versiyon numarasını da o kayda ekleyin).
3. Commit mesajına versiyonu eklemek isteğe bağlı ama faydalı olur, örn.
   `chore: bump version to 0.2.0`.

Şu anki tempoda (küçük düzeltmeler + orta boy özellikler karışık) her
konuşma turunda otomatik artırmıyoruz — kullanıcı "bu kadarlık bir birikim
oldu, versiyonu atlayalım" dediğinde ya da belirgin bir özellik seti
tamamlandığında elle artırılır.
