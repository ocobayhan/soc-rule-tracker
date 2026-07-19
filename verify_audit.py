#!/usr/bin/env python3
"""verify_audit.py — audit_log hash-zincirinin bütünlüğünü doğrular.

Her audit_log satırı bir önceki satırın hash'ini (`prev_hash`) içerir ve
kendi hash'i (`record_hash`) tüm alanlar + prev_hash + gizli bir salt'tan
hesaplanır (bkz. `app.py:write_audit`, `docs/audit_logging.md`). Bir kayıt
veritabanına doğrudan erişilerek silinir/değiştirilirse zincir kopar ve bu
script bunu tespit eder.

Kullanım:
  python verify_audit.py                    # varsayılan DB yolu (DATABASE env / ./tracker.db)
  python verify_audit.py --db /data/tracker.db

Bu script, bir yedek dosyasına (tracker_YYYYMMDD_HHMMSS.db) karşı da
çalıştırılabilir — sertifikasyon denetimi için canlıya dokunmadan
bağımsız doğrulama sağlar.
"""
import argparse
import hashlib
import os
import sqlite3
import sys

AUDIT_CHAIN_SECRET = os.environ.get(
    "AUDIT_CHAIN_SECRET", "soc-tracker-audit-chain-dev-secret-CHANGE-IN-PRODUCTION"
)
AUDIT_GENESIS = "GENESIS"


def audit_hash(prev_hash, user_id, username, action, record_type, record_id, detail, created_at):
    payload = "|".join([
        AUDIT_CHAIN_SECRET, prev_hash or "",
        str(user_id or ""), username or "", action or "",
        record_type or "", str(record_id or ""), detail or "", created_at or "",
    ])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def verify_chain(db_path: str) -> dict:
    """Zinciri baştan sona yeniden hesaplar. Dönüş: {total, chained, valid, problems}."""
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute(
            "SELECT id,user_id,username,action,record_type,record_id,detail,"
            "created_at,prev_hash,record_hash FROM audit_log ORDER BY id"
        ).fetchall()
    finally:
        con.close()

    chained = [r for r in rows if r["record_hash"]]
    problems = []
    expected_prev = None
    for r in chained:
        prev = expected_prev if expected_prev is not None else AUDIT_GENESIS
        if r["prev_hash"] != prev:
            problems.append(f"id={r['id']}: prev_hash uyuşmuyor (zincir kopmuş olabilir)")
        recomputed = audit_hash(prev, r["user_id"], r["username"], r["action"],
                                 r["record_type"], r["record_id"], r["detail"], r["created_at"])
        if recomputed != r["record_hash"]:
            problems.append(f"id={r['id']}: record_hash uyuşmuyor (kayıt değiştirilmiş olabilir)")
        expected_prev = r["record_hash"]

    return {
        "total": len(rows),
        "chained": len(chained),
        "valid": not problems,
        "problems": problems,
        "chain_tip_hash": chained[-1]["record_hash"] if chained else None,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--db",
        default=os.environ.get(
            "DATABASE", os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracker.db")
        ),
    )
    args = ap.parse_args()

    if not os.path.exists(args.db):
        print(f"HATA: Veritabanı bulunamadı: {args.db}", file=sys.stderr)
        sys.exit(2)

    result = verify_chain(args.db)
    print(f"Toplam {result['total']} audit kaydı, {result['chained']} tanesi zincirli.")
    if result["problems"]:
        print(f"UYARI: {len(result['problems'])} sorun bulundu:")
        for p in result["problems"]:
            print(f"  - {p}")
    else:
        print("Zincir GEÇERLİ — hiçbir zincirli kayıt değiştirilmemiş/silinmemiş.")
    if result["chain_tip_hash"]:
        print(f"Zincir ucu hash: {result['chain_tip_hash']}")
    sys.exit(0 if result["valid"] else 1)
