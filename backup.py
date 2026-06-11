#!/usr/bin/env python3
"""
backup.py — SOC Tracker veritabanı yedekleme aracı

Kullanım:
  python backup.py              # Anlık yedek al, eski yedekleri temizle (varsayılan: 30 adet sakla)
  python backup.py --keep 60   # 60 yedek sakla
  python backup.py --list      # Mevcut yedekleri listele

Cron örneği (her gece 02:00):
  0 2 * * * cd /opt/soc-tracker && python backup.py >> logs/backup.log 2>&1
"""
import os, sys, shutil, glob
from datetime import datetime

BASE       = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.environ.get("DATABASE",   os.path.join(BASE, "tracker.db"))
BACKUP_DIR = os.environ.get("BACKUP_DIR", os.path.join(BASE, "backups"))


def create_backup(keep: int = 12) -> str | None:
    """tracker.db'yi backups/ altına timestamp'li kopyalar. Eski yedekleri temizler."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    if not os.path.exists(DB_PATH):
        print(f"[backup] HATA: Veritabanı bulunamadı: {DB_PATH}", file=sys.stderr)
        return None
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"tracker_{ts}.db"
    dest = os.path.join(BACKUP_DIR, name)
    shutil.copy2(DB_PATH, dest)
    size_kb = os.path.getsize(dest) // 1024
    print(f"[backup] Yedek oluşturuldu: {name}  ({size_kb} KB)")
    _prune(keep)
    return name


def list_backups() -> list[dict]:
    """backups/ dizinindeki tüm yedekleri listeler."""
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, "tracker_*.db")), reverse=True)
    result = []
    for f in files:
        stat = os.stat(f)
        result.append({
            "filename":   os.path.basename(f),
            "size_kb":    stat.st_size // 1024,
            "created_at": datetime.fromtimestamp(stat.st_mtime).strftime("%d.%m.%Y %H:%M"),
        })
    return result


def _prune(keep: int) -> None:
    """En eski yedekleri siler, sadece `keep` adet bırakır."""
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, "tracker_*.db")))
    to_delete = files[:-keep] if len(files) > keep else []
    for f in to_delete:
        os.remove(f)
        print(f"[backup] Silindi (eski): {os.path.basename(f)}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--list" in args:
        backups = list_backups()
        if not backups:
            print("Yedek bulunamadı.")
        for b in backups:
            print(f"  {b['filename']}  {b['size_kb']} KB  {b['created_at']}")
    else:
        keep = 12
        if "--keep" in args:
            try:
                keep = int(args[args.index("--keep") + 1])
            except (IndexError, ValueError):
                pass
        create_backup(keep=keep)
