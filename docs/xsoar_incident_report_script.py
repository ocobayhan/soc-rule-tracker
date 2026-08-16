"""
SOC Tracker — Olay Raporu webhook'ları için örnek XSOAR automation script'i.

Bu dosya XSOAR'da bir "Automation" (Python 3) olarak oluşturulup bir
playbook task'ına bağlanacak şekilde yazıldı. `demisto` modülü sadece
XSOAR'ın çalışma zamanında (playbook içinde) mevcuttur — bu script'i
yerelde `python` ile direkt çalıştıramazsınız, sadece referans/başlangıç
noktasıdır.

Kapsar:
  - send_incident_report(...)  -> POST /api/integrations/xsoar/incident-report
  - add_incident_image(...)    -> POST /api/integrations/xsoar/incident-report/image
  - file_to_data_uri(...)      -> XSOAR'daki bir attachment'ı base64 data URI'ye çevirir

Tam alan sözlüğü (zorunlu/opsiyonel alanlar, hata kodları, mükerrer-case
davranışı) için bkz. docs/xsoar_integration.md.
"""

import requests

# ---------------------------------------------------------------------------
# Ayarlar — kendi ortamınıza göre doldurun
# ---------------------------------------------------------------------------

BASE_URL = "https://<sunucu>:9897"  # TODO: gerçek SOC Tracker adresi

# TODO: API anahtarını playbook'a düz metin olarak GÖMMEYİN. XSOAR'da bir
# "Credentials" (secret) oluşturup script argümanı olarak alın, örn.:
#   api_key = demisto.args().get("api_key")  # playbook'ta bir Credentials
#                                              # alanına bağlanır
API_KEY = None  # burada None bırakın, aşağıdaki fonksiyonlara parametre olarak geçirin


def _headers(api_key):
    return {
        "Content-Type": "application/json",
        "X-API-Key": api_key,
    }


def send_incident_report(api_key, xsoar_case_id, title, environment,
                          sections, images=None, requested_by=None,
                          base_url=BASE_URL, verify=True):
    """Ana webhook — rapor + (varsa) tüm görselleri TEK çağrıda gönderir.

    sections: [{"heading": "Olay Özeti", "text": "..."}, ...] — en az bir
        maddenin dolu 'text' alanı olmalı, aksi halde 400 döner.
    images: opsiyonel, ham base64 STRING listesi (obje değil!) —
        her biri file_to_data_uri() ile üretilebilir. Sırasına göre
        "Görsel 1, Görsel 2..." diye numaralanır.

    Döner: (ok: bool, data: dict) — ok=False ise data içinde 'error' vardır.
    Mükerrer case: aynı case_id için zaten aktif bir rapor varsa 409 döner,
    data içinde 'existing_id' bulunur — bu genelde hata değil, "zaten var"
    anlamına gelir; playbook tarafında ayrıca ele alınabilir.
    """
    payload = {
        "xsoar_case_id": str(xsoar_case_id),
        "title": title,
        "environment": environment,
        "sections": sections,
    }
    if images:
        payload["images"] = images
    if requested_by:
        payload["requested_by"] = requested_by

    resp = requests.post(
        f"{base_url}/api/integrations/xsoar/incident-report",
        json=payload,
        headers=_headers(api_key),
        timeout=30,
        verify=verify,  # kendi imzalı sertifikanız varsa CA bundle path'i verin, kapatmayın
    )
    try:
        data = resp.json()
    except ValueError:
        data = {"error": f"Beklenmeyen yanıt (HTTP {resp.status_code}): {resp.text[:300]}"}
    return resp.status_code == 201, data


def add_incident_image(api_key, xsoar_case_id, image_data_uri, order=None,
                        base_url=BASE_URL, verify=True):
    """Case'e ait EN SON rapora sonradan tek bir görsel ekler — raporun
    Taslak/Onaylandı/Reddedildi durumunda olması fark etmez. Rapor önce
    send_incident_report() ile açılmış olmalı (yoksa 404 döner).

    order verilmezse otomatik sıradaki numara atanır. Verilip çakışırsa
    (örn. iki ayrı çağrı da order=1 gönderirse) veri üzerine yazılmaz,
    "1a" gibi bir harf ekiyle ilk boş etiket kullanılır.
    """
    payload = {"xsoar_case_id": str(xsoar_case_id), "image": image_data_uri}
    if order is not None:
        payload["order"] = order

    resp = requests.post(
        f"{base_url}/api/integrations/xsoar/incident-report/image",
        json=payload,
        headers=_headers(api_key),
        timeout=30,
        verify=verify,
    )
    try:
        data = resp.json()
    except ValueError:
        data = {"error": f"Beklenmeyen yanıt (HTTP {resp.status_code}): {resp.text[:300]}"}
    return resp.status_code == 201, data


def file_to_data_uri(file_bytes, mime="image/png"):
    """Ham dosya bytes'ını webhook'un beklediği 'data:image/X;base64,...'
    formatına çevirir."""
    import base64
    b64 = base64.b64encode(file_bytes).decode("ascii")
    return f"data:{mime};base64,{b64}"


# ---------------------------------------------------------------------------
# XSOAR Automation — Arguments sekmesinde tanımlanacak alanlar
# ---------------------------------------------------------------------------
# Bu script'i XSOAR'da bir Automation olarak kaydederken, "Arguments" sekmesine
# aşağıdaki alanları ekleyin (isim/açıklama/zorunlu — Value sütununu DOLDURMAYIN,
# o playbook'ta bu automation'ı bir task olarak kullandığınızda, o task'ın kendi
# ekranında doldurulur, genelde ${incident.xxx} ile):
#
#   case_id        | Zorunlu değil | Varsayılan değer alanına: ${incident.id}
#   title          | Zorunlu değil | Varsayılan değer alanına: ${incident.name}
#   environment    | ZORUNLU       | örn. playbook'ta sabit "PROD" ya da bir custom field
#   sections       | ZORUNLU       | JSON dizi metni — bkz. aşağıdaki not
#   requested_by   | Zorunlu değil | Varsayılan değer alanına: ${incident.owner}
#   api_key        | ZORUNLU       | Type: Credentials — düz metin YAZMAYIN, bir
#                  |               | XSOAR Credentials (secret) seçin
#
# 'sections' için: playbook task'ının bu argümana verdiği DEĞER, şuna benzer bir
# JSON metni olmalı (bunu genelde bir önceki "Set a value in context" veya küçük
# bir yardımcı script ile oluşturursunuz):
#   [{"heading": "Olay Özeti", "text": "..."}, {"heading": "Etki", "text": "..."}]
# JSON yazmak istemiyorsanız aşağıdaki main() bunu tolere eder: 'sections' geçerli
# JSON değilse, tek bölümlük bir rapor olarak (başlık "Olay Özeti", metin = girdiğiniz
# düz metnin tamamı) otomatik sarmalanır — küçük/basit raporlar için JSON'a hiç
# gerek kalmaz.

import json


def main():
    args = demisto.args()  # noqa: F821
    incident = demisto.incident()  # noqa: F821

    sections_raw = args.get("sections", "")
    try:
        sections = json.loads(sections_raw)
        if not isinstance(sections, list):
            raise ValueError
    except (ValueError, TypeError):
        sections = [{"heading": "Olay Özeti", "text": sections_raw}]

    ok, result = send_incident_report(
        api_key=args.get("api_key"),
        xsoar_case_id=args.get("case_id") or incident.get("id"),
        title=args.get("title") or incident.get("name"),
        environment=args.get("environment", ""),
        sections=sections,
        requested_by=args.get("requested_by") or incident.get("owner"),
    )

    if ok:
        demisto.results(f"Olay raporu oluşturuldu: #{result.get('id')}")  # noqa: F821
    elif result.get("duplicate"):
        demisto.results(f"Bu case için zaten bir rapor var: #{result.get('existing_id')}")  # noqa: F821
    else:
        return_error(f"Olay raporu oluşturulamadı: {result.get('error')}")  # noqa: F821


# XSOAR script'i çalıştırdığında bu isimlerden biriyle eşleşir (demisto-sdk'nin
# standart automation şablonuyla aynı desen) — dosyayı modül olarak import
# etmek (örn. test için) main()'i tetiklemez.
if __name__ in ("__main__", "__builtin__", "builtins"):
    main()
