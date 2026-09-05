# -*- coding: utf-8 -*-
"""
Matrix SMS Collector — Lamix + Purple → Supabase
=================================================
Polls both APIs every 3 seconds.
Saves every NEW SMS permanently to Supabase.
The web dashboard Announcements page reads from there.

Setup:
  pip install requests

Run:
  python3 sms_collector.py

PM2:
  pm2 start sms_collector.py --name matrix-collector --interpreter python3
"""

import time
import requests
import logging
import hashlib
from datetime import datetime

# ===================== CONFIG =====================
LAMIX_TOKEN  = "FN9LfZtOhoMFx6zOjdUm2n1Xt3t2Wh860lqChIcVhjY"
PURPLE_TOKEN = "QlZTR0FOfkJET1dI"
PURPLE_URL   = "http://137.74.1.203/crapi/reseller/mdr.php"

SUPABASE_URL = "https://owvgnnhayikisrehjkfz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dmdubmhheWlraXNyZWhqa2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwOTE1MywiZXhwIjoyMTA0MTg1MTUzfQ.gglfJOcCy_-lZuJKTRoZ-4_cHd0klfz3OT5xPy8QKww"

FETCH_RECORDS = 50
POLL_DELAY    = 3  # seconds

# ===================== LOGGING =====================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger(__name__)

# ===================== COUNTRY MAP =====================
PREFIX_MAP = {
    "880":"Bangladesh","998":"Uzbekistan","996":"Kyrgyzstan","994":"Azerbaijan",
    "993":"Turkmenistan","992":"Tajikistan","977":"Nepal","976":"Mongolia",
    "974":"Qatar","973":"Bahrain","972":"Israel","971":"UAE","968":"Oman",
    "967":"Yemen","966":"Saudi Arabia","965":"Kuwait","964":"Iraq","963":"Syria",
    "962":"Jordan","961":"Lebanon","886":"Taiwan","856":"Laos","855":"Cambodia",
    "852":"Hong Kong","380":"Ukraine","375":"Belarus","374":"Armenia","373":"Moldova",
    "263":"Zimbabwe","260":"Zambia","258":"Mozambique","256":"Uganda","255":"Tanzania",
    "254":"Kenya","251":"Ethiopia","249":"Sudan","244":"Angola","237":"Cameroon",
    "234":"Nigeria","233":"Ghana","225":"Ivory Coast","221":"Senegal","218":"Libya",
    "216":"Tunisia","213":"Algeria","212":"Morocco","95":"Myanmar","94":"Sri Lanka",
    "93":"Afghanistan","92":"Pakistan","91":"India","90":"Turkey","86":"China",
    "84":"Vietnam","82":"South Korea","81":"Japan","77":"Kazakhstan","7":"Russia",
    "66":"Thailand","65":"Singapore","64":"New Zealand","63":"Philippines",
    "62":"Indonesia","61":"Australia","60":"Malaysia","58":"Venezuela","57":"Colombia",
    "56":"Chile","55":"Brazil","54":"Argentina","53":"Cuba","52":"Mexico","51":"Peru",
    "49":"Germany","48":"Poland","47":"Norway","46":"Sweden","45":"Denmark",
    "44":"UK","43":"Austria","41":"Switzerland","40":"Romania","39":"Italy",
    "36":"Hungary","34":"Spain","33":"France","32":"Belgium","31":"Netherlands",
    "30":"Greece","27":"South Africa","20":"Egypt","98":"Iran","1":"USA/Canada",
}

def get_country(number: str) -> str:
    clean = str(number).lstrip("+").replace(" ", "").replace("-", "")
    for pfx in sorted(PREFIX_MAP.keys(), key=len, reverse=True):
        if clean.startswith(pfx):
            return PREFIX_MAP[pfx]
    return f"Unknown (+{clean[:3]})" if len(clean) >= 3 else "Unknown"

def make_id(panel: str, time_str: str, number: str, cli: str, content: str) -> str:
    """Create a stable unique ID for deduplication."""
    raw = f"{panel}|{time_str}|{number}|{cli}|{content[:50]}"
    return hashlib.md5(raw.encode()).hexdigest()

# ===================== SUPABASE =====================
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def check_exists(uid: str) -> bool:
    """Check if record already exists in Supabase."""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/announcements?uid=eq.{uid}&select=id",
            headers=SUPABASE_HEADERS, timeout=5
        )
        return len(r.json()) > 0
    except:
        return False

def supabase_insert(row: dict) -> bool:
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/announcements",
            json=row, headers=SUPABASE_HEADERS, timeout=10
        )
        return r.status_code in (200, 201, 204)
    except Exception as e:
        log.error(f"Supabase insert error: {e}")
        return False

# ===================== FETCH APIs =====================
def fetch_lamix() -> list:
    try:
        r = requests.get(
            f"https://panel.lamix.org/api/v1/messages?limit={FETCH_RECORDS}",
            headers={"Authorization": f"Bearer {LAMIX_TOKEN}", "Accept": "application/json"},
            timeout=12
        )
        data = r.json()
        if "records" in data:
            return [
                {
                    "platform": "lamix",
                    "cli": str(rec.get("cli") or ""),
                    "number": str(rec.get("number") or ""),
                    "content": str(rec.get("content") or ""),
                    "time": str(rec.get("time") or ""),
                    "payout": str(rec.get("payout") or "0"),
                    "range": str(rec.get("range") or ""),
                }
                for rec in data["records"]
            ]
    except Exception as e:
        log.warning(f"Lamix fetch error: {e}")
    return []

def fetch_purple() -> list:
    try:
        r = requests.get(
            f"{PURPLE_URL}?token={PURPLE_TOKEN}&records={FETCH_RECORDS}",
            timeout=12
        )
        data = r.json()
        if str(data.get("status", "")).lower() == "success" and isinstance(data.get("data"), list):
            return [
                {
                    "platform": "purple",
                    "cli": str(rec.get("cli") or ""),
                    "number": str(rec.get("number") or ""),
                    "content": str(rec.get("message") or ""),
                    "time": str(rec.get("datetime") or ""),
                    "payout": str(rec.get("payout") or rec.get("cost") or "0"),
                    "range": str(rec.get("country") or ""),
                }
                for rec in data["data"]
            ]
    except Exception as e:
        log.warning(f"Purple fetch error: {e}")
    return []

# ===================== MAIN LOOP =====================
# In-memory seen set for fast dedup (cleared on restart — Supabase handles permanent dedup)
seen_uids: set = set()
known_clis: set = set()
initialized = False

def main():
    global initialized, seen_uids, known_clis

    log.info("🚀 Matrix SMS Collector starting...")
    log.info(f"📡 Polling Lamix + Purple every {POLL_DELAY}s → Supabase")

    while True:
        try:
            lamix_records  = fetch_lamix()
            purple_records = fetch_purple()
            all_records    = lamix_records + purple_records

            saved = 0
            for rec in all_records:
                uid = make_id(rec["platform"], rec["time"], rec["number"], rec["cli"], rec["content"])

                # Skip if already seen this session
                if uid in seen_uids:
                    continue
                seen_uids.add(uid)

                # On first run, populate seen set without saving (avoid bulk insert of old data)
                if not initialized:
                    continue

                # Detect new CLI
                cli_key = f"{rec['platform']}:{rec['cli']}"
                is_new_cli = cli_key not in known_clis
                known_clis.add(cli_key)

                # Resolve country
                country = rec.get("range") or get_country(rec["number"])

                row = {
                    "uid": uid,
                    "platform": rec["platform"],
                    "cli": rec["cli"],
                    "country": country,
                    "number": rec["number"],
                    "content": rec["content"],
                    "payout": rec["payout"],
                    "is_new_cli": is_new_cli,
                    "raw_text": f"{rec['platform'].upper()} | {rec['cli']} | {country} | {rec['content'][:200]}",
                }

                ok = supabase_insert(row)
                if ok:
                    saved += 1
                    flag = "🆕" if is_new_cli else "✅"
                    log.info(f"{flag} [{rec['platform'].upper()}] CLI: {rec['cli']} | {country} | saved")

            if not initialized:
                initialized = True
                log.info(f"✅ Initialized with {len(seen_uids)} existing records. Watching for NEW ones...")

            if saved > 0:
                log.info(f"💾 Saved {saved} new SMS to Supabase")

        except KeyboardInterrupt:
            log.info("👋 Collector stopped.")
            break
        except Exception as e:
            log.error(f"Loop error: {e}")

        time.sleep(POLL_DELAY)

if __name__ == "__main__":
    main()
