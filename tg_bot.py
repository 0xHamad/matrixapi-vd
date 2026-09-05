# -*- coding: utf-8 -*-
"""
Telegram Bot → Supabase Announcements Saver
============================================
This bot polls the private Telegram channel and saves every new
SMS message to Supabase so the web dashboard can display them.

Setup:
  pip install python-telegram-bot requests supabase
  
Set env vars (or edit directly below):
  SUPABASE_URL    = your supabase project URL
  SUPABASE_KEY    = your supabase service role key
  TG_BOT_TOKEN    = your Telegram bot token
  TG_CHANNEL_ID   = the private channel ID (e.g. -1003721669079)
"""

import os
import time
import logging
import requests
import random
from datetime import datetime

# ===================== CONFIG =====================
TG_BOT_TOKEN  = "8899866025:AAFS0Dw1DBjb7PzjJqdnM8El9mAma4jTQ98"
TG_CHANNEL_ID = "-1003721669079"   # private channel
TG_USER_ID    = "5360297263"       # your personal TG ID (for error alerts)

SUPABASE_URL  = os.environ.get("SUPABASE_URL", "https://YOUR_PROJECT.supabase.co")
SUPABASE_KEY  = os.environ.get("SUPABASE_KEY", "YOUR_SERVICE_ROLE_KEY")

WEB_API_URL   = os.environ.get("WEB_URL", "https://matrix.hassanai.xyz")  # your web domain
POLL_SLEEP    = 2   # seconds between Telegram polls

# ===================== LOGGING =====================
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ===================== COUNTRY MAP =====================
PREFIX_MAP = {
    "880":"Bangladesh","998":"Uzbekistan","996":"Kyrgyzstan","994":"Azerbaijan",
    "993":"Turkmenistan","992":"Tajikistan","977":"Nepal","976":"Mongolia",
    "974":"Qatar","973":"Bahrain","972":"Israel","971":"UAE","968":"Oman",
    "967":"Yemen","966":"Saudi Arabia","965":"Kuwait","964":"Iraq","963":"Syria",
    "962":"Jordan","961":"Lebanon","886":"Taiwan","856":"Laos","855":"Cambodia",
    "852":"Hong Kong","380":"Ukraine","375":"Belarus","374":"Armenia","373":"Moldova",
    "255":"Tanzania","256":"Uganda","254":"Kenya","251":"Ethiopia","249":"Sudan",
    "244":"Angola","237":"Cameroon","234":"Nigeria","233":"Ghana","225":"Ivory Coast",
    "221":"Senegal","218":"Libya","216":"Tunisia","213":"Algeria","212":"Morocco",
    "95":"Myanmar","94":"Sri Lanka","93":"Afghanistan","92":"Pakistan","91":"India",
    "90":"Turkey","86":"China","84":"Vietnam","82":"South Korea","81":"Japan",
    "77":"Kazakhstan","7":"Russia","66":"Thailand","65":"Singapore","64":"New Zealand",
    "63":"Philippines","62":"Indonesia","61":"Australia","60":"Malaysia","58":"Venezuela",
    "57":"Colombia","56":"Chile","55":"Brazil","54":"Argentina","53":"Cuba",
    "52":"Mexico","51":"Peru","49":"Germany","48":"Poland","47":"Norway",
    "46":"Sweden","45":"Denmark","44":"UK","43":"Austria","41":"Switzerland",
    "40":"Romania","39":"Italy","36":"Hungary","34":"Spain","33":"France",
    "32":"Belgium","31":"Netherlands","30":"Greece","27":"South Africa",
    "20":"Egypt","98":"Iran","1":"USA/Canada",
}

def get_country(number: str) -> str:
    clean = str(number).lstrip("+")
    for pfx in sorted(PREFIX_MAP.keys(), key=len, reverse=True):
        if clean.startswith(pfx):
            return PREFIX_MAP[pfx]
    return f"Unknown (+{clean[:3]})"

# ===================== SUPABASE =====================
def supabase_insert(row: dict) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/announcements"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        r = requests.post(url, json=row, headers=headers, timeout=10)
        return r.status_code in (200, 201)
    except Exception as e:
        log.error(f"Supabase insert error: {e}")
        return False

# ===================== TELEGRAM =====================
def tg_get(method: str, params: dict = {}) -> dict:
    url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/{method}"
    try:
        r = requests.get(url, params=params, timeout=15)
        return r.json()
    except Exception as e:
        log.error(f"Telegram API error ({method}): {e}")
        return {"ok": False}

def parse_sms_message(text: str) -> dict:
    """
    Parse the formatted SMS message from the Telegram channel.
    Handles both Lamix and Purple panel formats.
    """
    lines = text.strip().split("\n")
    result = {
        "platform": "lamix",
        "cli": "",
        "country": "",
        "number": "",
        "content": "",
        "is_new_cli": False,
        "raw_text": text,
    }

    for line in lines:
        line = line.strip()
        # Detect panel
        if "PURPLE" in line.upper() or "🪻" in line:
            result["platform"] = "purple"
        elif "LAMIX" in line.upper() or "💠" in line:
            result["platform"] = "lamix"

        # Extract fields
        if "CLI" in line and ":" in line:
            result["cli"] = line.split(":", 1)[-1].strip().strip("`")
        elif "Country" in line and ":" in line:
            result["country"] = line.split(":", 1)[-1].strip()
        elif "Number" in line and ":" in line:
            num = line.split(":", 1)[-1].strip().strip("`")
            result["number"] = num
            if not result["country"]:
                result["country"] = get_country(num)
        elif "Message" in line and ":" in line:
            pass  # next line will be message
        elif "NEW CLI" in line.upper():
            result["is_new_cli"] = True

    # Try to extract message content (usually after Message: line)
    try:
        msg_idx = next(i for i, l in enumerate(lines) if "Message" in l and ":" in l)
        content_lines = lines[msg_idx + 1:]
        result["content"] = " ".join(l.strip().strip('"').strip("`") for l in content_lines if l.strip() and "━" not in l).strip()
    except StopIteration:
        # Fallback: just use the raw text
        result["content"] = text[:500]

    # Auto-detect country from number if still empty
    if not result["country"] and result["number"]:
        result["country"] = get_country(result["number"])

    return result

# ===================== MAIN LOOP =====================
seen_msg_ids: set = set()
last_update_id = 0

def main():
    global last_update_id

    log.info(f"🤖 Matrix Telegram→Supabase Bot started")
    log.info(f"📡 Monitoring channel: {TG_CHANNEL_ID}")
    log.info(f"💾 Saving to: {SUPABASE_URL}")

    # Verify bot works
    me = tg_get("getMe")
    if me.get("ok"):
        log.info(f"✅ Bot connected: @{me['result']['username']}")
    else:
        log.error("❌ Bot connection failed! Check TG_BOT_TOKEN")
        return

    # Get current offset to only process NEW messages
    updates = tg_get("getUpdates", {"limit": 1, "offset": -1})
    if updates.get("ok") and updates.get("result"):
        last_update_id = updates["result"][-1]["update_id"] + 1
        log.info(f"📌 Starting from update_id: {last_update_id}")

    while True:
        try:
            updates = tg_get("getUpdates", {
                "offset": last_update_id,
                "limit": 100,
                "timeout": 30,
                "allowed_updates": ["channel_post", "message"],
            })

            if not updates.get("ok"):
                time.sleep(POLL_SLEEP)
                continue

            results = updates.get("result", [])
            for update in results:
                last_update_id = update["update_id"] + 1

                # Get message from channel_post or message
                msg = update.get("channel_post") or update.get("message")
                if not msg:
                    continue

                # Only process messages from our target channel
                chat_id = str(msg.get("chat", {}).get("id", ""))
                if chat_id != TG_CHANNEL_ID:
                    continue

                msg_id = msg.get("message_id")
                if msg_id in seen_msg_ids:
                    continue
                seen_msg_ids.add(msg_id)

                text = msg.get("text", "") or msg.get("caption", "")
                if not text or len(text) < 10:
                    continue

                log.info(f"📨 New message from channel (id: {msg_id}): {text[:80]}...")

                # Parse the message
                parsed = parse_sms_message(text)

                # Save to Supabase
                ok = supabase_insert(parsed)
                if ok:
                    log.info(f"✅ Saved to Supabase — CLI: {parsed['cli']} | {parsed['platform']} | {parsed['country']}")
                else:
                    log.error(f"❌ Failed to save message to Supabase")

            time.sleep(POLL_SLEEP)

        except KeyboardInterrupt:
            log.info("👋 Bot stopped.")
            break
        except Exception as e:
            log.error(f"Loop error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
