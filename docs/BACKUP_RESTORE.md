# Yedekten Geri Yükleme (Restore) Runbook

## Ne zaman kullanılır

DB bozulduğunda, yanlışlıkla veri silindiğinde veya felaket kurtarma
senaryosunda (ör. `soc_data` volume'ü kazayla silindiğinde).

## Ön koşul

Yedekler artık `soc_data` named volume'ünün **dışında**, host'un kendi
dosya sisteminde (`BACKUP_HOST_DIR`, varsayılan `./backups`) tutulur —
bkz. `docker-compose.yml` ve `docs/PLAN_SCHEDULER_REDESIGN.md`. Bu yüzden
`docker volume rm soc_data` gibi bir kaza olsa bile bu dizin sağlam kalır.

## Adımlar

1. Uygulamayı durdur (volume'lere dokunmadan): `docker-compose stop soc-tracker`
2. Geri yüklenecek yedeği seç: `ls -lt ./backups/tracker_*.db | head`
3. Güvenlik için mevcut (muhtemelen bozuk) DB'yi de ayrıca yedekle:
   `docker run --rm -v soc_data:/data -v $(pwd)/backups:/out alpine \
     cp /data/tracker.db /out/tracker_PRE_RESTORE_$(date +%Y%m%d_%H%M%S).db`
4. Seçilen yedeği canlı konuma kopyala:
   `docker run --rm -v soc_data:/data -v $(pwd)/backups:/backups alpine \
     cp /backups/tracker_YYYYMMDD_HHMMSS.db /data/tracker.db`
5. Uygulamayı başlat: `docker-compose start soc-tracker`
6. Doğrula: giriş yap, birkaç kayıt kontrol et, `/api/audit`'ten son işlemlerin
   tutarlı olduğunu teyit et.

## Doğrulama durumu

Bu adımlar henüz Ubuntu test sunucusunda uçtan uca denenmedi — deploy günü
kullanıcı ile birlikte gerçek bir restore denemesi yapılıp bu doküman teyit
edilecek/güncellenecek.
