# Yedekten Geri Yükleme (Restore) Runbook

## Ne zaman kullanılır

DB bozulduğunda, yanlışlıkla veri silindiğinde veya felaket kurtarma
senaryosunda.

## ÖNEMLİ — 2026-07-20 değişikliği: artık isimli volume yok

Önceden DB (`tracker.db`) bir Docker **named volume**'ünde (`soc_data`)
tutuluyordu — sadece yedekler host'un kendi dosya sistemindeydi. Bu, "yedek
DB'den ayrı, en azından yedek hayatta kalır" güvencesi veriyordu ama canlı
DB'nin kendisi hâlâ `docker volume rm soc_data` / `docker-compose down -v`
komutlarına karşı savunmasızdı.

Artık DB de, upload'lar da host'un kendi dosya sisteminde düz birer dosya/
dizin (`docker-compose.yml`'deki `DATA_HOST_DIR`/`UPLOADS_HOST_DIR`/
`BACKUP_HOST_DIR`, varsayılanlar `./data`, `./uploads`, `./backups`) —
üçü de birbirinden AYRI dizinler, hiçbiri Docker'ın "named volume" olarak
yönettiği bir şey değil. `docker volume rm` / `down -v` artık hiçbirine
dokunamıyor. Yedekler de DB'nin dizininin ALTINDA değil, ayrı bir dizinde —
host üzerinde yanlışlıkla `rm -rf ./data` çalıştırılsa bile yedekler etkilenmez.

## ⚠️ Eski (named volume) kurulumdan yeni (bind-mount) kuruluma geçiş

**Canlıda hâlâ eski `docker-compose.yml` ile (yani `soc_data` named
volume'üyle) çalışıyorsan, bu dosyayı güncellemeden önce mutlaka bu adımları
izle — aksi halde yeni kurulum boş bir `./data` dizininden başlar ve gerçek
verin (hâlâ eski named volume'de duruyor olsa da) uygulamada görünmez hale
gelir.**

1. **Önce yeni bir yedek al** — mevcut Ayarlar sayfasındaki "Şimdi Yedekle"
   butonuyla, VEYA doğrudan:
   ```bash
   docker run --rm -v soc_data:/data -v $(pwd)/backups:/out alpine \
     cp /data/tracker.db /out/tracker_PRE_MIGRATION_$(date +%Y%m%d_%H%M%S).db
   ```
2. Yeni host dizinlerini oluştur (henüz yoklarsa):
   ```bash
   mkdir -p ./data ./uploads ./backups
   ```
3. **Eski named volume'deki gerçek veriyi yeni host dizinine kopyala** —
   uygulamayı durdurmadan (konteyner çalışırken de bu kopyalama güvenle
   yapılabilir, sadece kopyalama anında yazma işlemi olmamasına dikkat et):
   ```bash
   docker run --rm -v soc_data:/data -v $(pwd)/data:/newdata alpine \
     cp /data/tracker.db /newdata/tracker.db
   docker run --rm -v soc_uploads:/up -v $(pwd)/uploads:/newup alpine \
     sh -c "cp -a /up/. /newup/"
   ```
4. Yeni `docker-compose.yml`'i (bind-mount'lu) devreye al, konteyneri yeniden
   oluştur:
   ```bash
   docker-compose down          # -v BAYRAĞI OLMADAN — named volume'lere dokunma
   docker-compose up -d --build
   ```
5. **Doğrula:** giriş yap, Dashboard'daki toplam kayıt sayılarının eskisiyle
   aynı olduğunu, birkaç gerçek kaydı, yüklenmiş görsellerin hâlâ açıldığını
   kontrol et.
6. Doğrulama başarılıysa, eski `soc_data`/`soc_uploads` named volume'lerini
   **hemen silme** — birkaç gün/hafta dokunmadan bırak, her şeyin sorunsuz
   çalıştığından emin olduktan sonra `docker volume rm soc_data soc_uploads`
   ile temizle.

## Normal restore (yedekten geri yükleme)

1. Uygulamayı durdur: `docker-compose stop soc-tracker`
2. Geri yüklenecek yedeği seç: `ls -lt ./backups/tracker_*.db | head`
3. Güvenlik için mevcut (muhtemelen bozuk) DB'yi de ayrıca yedekle:
   `cp ./data/tracker.db ./backups/tracker_PRE_RESTORE_$(date +%Y%m%d_%H%M%S).db`
4. Seçilen yedeği canlı konuma kopyala:
   `cp ./backups/tracker_YYYYMMDD_HHMMSS.db ./data/tracker.db`
5. Uygulamayı başlat: `docker-compose start soc-tracker`
6. Doğrula: giriş yap, birkaç kayıt kontrol et, `/api/audit`'ten son işlemlerin
   tutarlı olduğunu teyit et.

## Doğrulama durumu

Bu adımlar henüz Ubuntu test sunucusunda uçtan uca denenmedi — deploy günü
kullanıcı ile birlikte gerçek bir restore denemesi yapılıp bu doküman teyit
edilecek/güncellenecek.
