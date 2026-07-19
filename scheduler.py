#!/usr/bin/env python3
"""scheduler.py — SOC Tracker için basit periyodik iş çalıştırıcı (JobScheduler).

Gunicorn birden fazla worker process ile çalıştığından, arka plan
döngüsünün yalnızca TEK bir worker'da çalıştığından emin olmak gerekir
(aksi halde her worker aynı işi tekrar tekrar çalıştırır). Bunun için
bir dosya kilidi (fcntl.flock, non-blocking) kullanılır: kilidi
alamayan worker'lar döngüyü hiç başlatmadan sessizce çıkar — kilidi
tutan worker restart edilirse OS kilidi otomatik serbest bırakır ve
başka bir worker devralabilir.

Kullanım:
    from scheduler import JobScheduler, ScheduledJob

    scheduler = JobScheduler(lock_path="/data/.scheduler.lock")
    scheduler.register(ScheduledJob("db_backup", my_backup_func, interval_hours=6))
    scheduler.start()
"""
import fcntl
import os
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, List, Optional


@dataclass
class ScheduledJob:
    name: str
    func: Callable[[], None]
    interval_hours: float
    last_run: Optional[datetime] = field(default=None)

    def is_due(self, now: datetime) -> bool:
        if self.last_run is None:
            return True
        return (now - self.last_run).total_seconds() >= self.interval_hours * 3600


class JobScheduler:
    """Kayıtlı işleri periyodik olarak kontrol edip zamanı gelenleri çalıştıran
    minimal arka plan zamanlayıcısı."""

    def __init__(self, check_interval_seconds: int = 3600, lock_path: Optional[str] = None):
        self.jobs: List[ScheduledJob] = []
        self.check_interval_seconds = check_interval_seconds
        self.lock_path = lock_path
        self._lock_fd = None
        self._thread: Optional[threading.Thread] = None

    def register(self, job: ScheduledJob) -> None:
        self.jobs.append(job)

    def _acquire_singleton_lock(self) -> bool:
        """Sadece tek bir process döngüyü çalıştırsın diye dosya kilidi alır.
        lock_path verilmemişse kilitlemeden her zaman True döner (tek worker'lı
        dev ortamı için)."""
        if not self.lock_path:
            return True
        os.makedirs(os.path.dirname(self.lock_path), exist_ok=True)
        self._lock_fd = open(self.lock_path, "w")
        try:
            fcntl.flock(self._lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except OSError:
            self._lock_fd.close()
            self._lock_fd = None
            return False

    def start(self) -> None:
        """Arka plan thread'ini başlatır. Kilit başka bir worker'da ise
        sessizce çıkar (o worker zaten çalıştırıyordur)."""
        if not self._acquire_singleton_lock():
            return

        def _loop():
            while True:
                now = datetime.utcnow()
                for job in self.jobs:
                    if job.is_due(now):
                        try:
                            job.func()
                        except Exception as e:
                            print(f"[scheduler] '{job.name}' işi hata verdi: {e}")
                        job.last_run = now
                time.sleep(self.check_interval_seconds)

        self._thread = threading.Thread(target=_loop, daemon=True, name="job-scheduler")
        self._thread.start()
