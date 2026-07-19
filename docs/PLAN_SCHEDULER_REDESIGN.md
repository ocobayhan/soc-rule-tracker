# Scheduler — JobScheduler Tasarımı

## Neden

Yedekleme daha önce sadece iki durumda tetikleniyordu: (1) uygulama başlarken
(`_auto_backup_on_start`, son 5 günde yedek yoksa) ve (2) admin panelden
manuel "Yedek Al" butonuyla. Konteyner haftalarca yeniden başlamazsa
gerçek bir periyodik zamanlayıcı olmadığı için yeni yedek alınmıyordu. Bu
dosya, CLAUDE.md'de referans verilen ama daha önce yazılmamış "JobScheduler
engine / ScheduledJob dataclass" tasarımını uygular.

## Bileşenler (`scheduler.py`)

- **`ScheduledJob`** — `name`, `func` (parametresiz çağrılabilir), `interval_hours`,
  `last_run`. `is_due(now)` son çalıştırmadan bu yana yeterli süre geçip
  geçmediğini söyler.
- **`JobScheduler`** — kayıtlı `ScheduledJob`ları tutar, `check_interval_seconds`
  aralıkla (varsayılan 1 saat) hepsini kontrol eden bir arka plan thread'i
  çalıştırır. `register(job)` ile yeni bir iş eklenir.

## Gunicorn çoklu worker sorunu ve çözümü

Uygulama Gunicorn ile 2 worker process olarak çalışıyor (`Dockerfile`). Her
worker `app.py`'yi ayrı ayrı import eder — kilitlemeden bir arka plan thread'i
başlatılırsa iş **iki kez** çalışır (örn. çift yedek).

Çözüm: `JobScheduler.start()` önce bir **dosya kilidi** almaya çalışır
(`fcntl.flock`, non-blocking, `lock_path=BACKUP_DIR/.scheduler.lock`).
Kilidi alamayan worker döngüyü hiç başlatmadan sessizce çıkar. Kilidi tutan
worker restart/crash olursa OS kilidi otomatik bırakır, başka bir worker
devralabilir. Ek bağımlılık veya ayrı bir process gerekmez.

## Kayıtlı işler

| İş adı | Fonksiyon | Sıklık (kontrol) | Ne yapar |
|---|---|---|---|
| `db_backup` | `_backup_if_due()` (`app.py`) | 6 saatte bir kontrol | Son 5 günde yedek yoksa yeni yedek alır, 12 yedek saklar |

## Yeni iş eklemek için

```python
scheduler.register(ScheduledJob("job_adi", fonksiyon, interval_hours=24))
```

`fonksiyon` parametre almamalı ve kendi "gerçekten çalışmam gerekiyor mu"
kontrolünü (varsa) kendi içinde yapmalı — `interval_hours` sadece scheduler'ın
o fonksiyonu ne sıklıkla *çağıracağını* belirler, fonksiyonun her çağrıda
gerçekten iş yapıp yapmayacağına karar vermez.

## Planlanan gelecek işler

- Audit log periyodik dışa aktarım + zincir-ucu hash'i (bkz. `docs/audit_logging.md`, Faz 2).
