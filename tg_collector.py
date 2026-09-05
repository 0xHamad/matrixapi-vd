# -*- coding: utf-8 -*-
"""
Matrix Telegram Channel Collector → Supabase
=============================================
Uses BOT TOKEN to poll getUpdates.
Bot must be ADMIN or MEMBER of the channel.
Saves every new channel message to Supabase → shown in web Announcements.

Setup:
  pip install requests

Run:
  python3 tg_collector.py

PM2:
  pm2 start tg_collector.py --name matrix-tg --interpreter python3
"""

import time
import requests
import logging

# ===================== CONFIG =====================
BOT_TOKEN    = "8899866025:AAFS0Dw1DBjb7PzjJqdnM8El9mAma4jTQ98"
CHANNEL_ID   = -1003721669079   # the private channel

SUPABASE_URL = "https://owvgnnhayikisrehjkfz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dmdubmhheWlraXNyZWhqa2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwOTE1MywiZXhwIjoyMTA0MTg1MTUzfQ.gglfJOcCy_-lZuJKTRoZ-4_cHd0klfz3OT5xPy8QKww"

POLL_DELAY = 1  # seconds

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
    "263":"Zimbabwe","260":"Zambia","258":"Mozambique","256":"Uganda","255":"Tanzania",
    "254":"Kenya","251":"Ethiopia","249":"Sudan","244":"Angola","237":"Cameroon",
    "234":"Nigeria","233":"Ghana","225":"Ivory Coast","221":"Senegal","218":"Libya",
    "216":"Tunisia","213":"Algeria","212":"Morocco","95":"Myanmar","94":"Sri Lanka",
    "93":"Afghanistan","92":"Pakistan","91":"India","90":"Turkey","86":"China",
    "84":"Vietnam","82":"South Korea","81":"Japan","77":"Kazakhstan","7":"Russia",
    "66":"Thailand","65":"Singapore","64":"New Zealand","63":"Philippines",
    "62":"Indonesia","61":"Australia","60":"Malaysia","58":"Venezuela","57":"Colombia",
    "56":"Chile","55":"Brazil","54":"Argentina","52":"Mexico","51":"Peru",
    "49":"Germany","48":"Poland","47":"Norway","46":"Sweden","45":"Denmark",
    "44":"UK","43":"Austria","41":"Switzerland","40":"Romania","39":"Italy",
    "34":"Spain","33":"France","32":"Belgium","31":"Netherlands","30":"Greece",
    "27":"South Africa","20":"Egypt","98":"Iran","1":"USA/Canada",
}

def get_country(number: str) -> str:
    clean = str(number).lstrip("+").replace(" ","").replace("-","")
    for pfx in sorted(PREFIX_MAP.keys(), key=len, reverse=True):
        if clean.startswith(pfx):
            return PREFIX_MAP[pfx]
    return f"Unknown (+{clean[:3]})" if len(clean) >= 3 else "Unknown"

# ===================== SUPABASE =====================
SB_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def supabase_insert(row: dict) -> bool:
    try:
        r = requests.post(f"{SUPABASE_URL}/rest/v1/announcements", json=row, headers=SB_HEADERS, timeout=10)
        return r.status_code in (200, 201, 204)
    except Exception as e:
        log.error(f"Supabase error: {e}")
        return False

# ===================== PARSE MESSAGE =====================
def parse_tg_message(text: str) -> dict:
    """Parse SMS-style formatted messages from the channel."""
    lines = text.strip().split("\n")
    result = {
        "platform": "telegram",
        "cli": "",
        "country": "",
        "number": "",
        "content": "",
        "is_new_cli": False,
        "raw_text": text[:2000],
    }

    content_capture = False
    content_lines = []

    for line in lines:
        s = line.strip()
        if not s or "━" in s: continue

        up = s.upper()

        # Detect panel type from emojis/text
        if "PURPLE" in up or "🪻" in s:
            result["platform"] = "purple"
        elif "LAMIX" in up or "💠" in s:
            result["platform"] = "lamix"

        if "NEW CLI" in up or "🆕" in s:
            result["is_new_cli"] = True

        if content_capture:
            clean = s.strip('`"\'')
            if clean: content_lines.append(clean)
            continue

        if ":" in s:
            key, _, val = s.partition(":")
            # Strip emojis and spaces from key
            key_c = ''.join(c for c in key if c.isalpha() or c == ' ').strip().lower()
            val_c = val.strip().strip('`"\'  ')

            if "cli" in key_c and val_c:
                result["cli"] = val_c
            elif "country" in key_c and val_c:
                result["country"] = val_c
            elif "number" in key_c and val_c:
                result["number"] = val_c
                if not result["country"]:
                    result["country"] = get_country(val_c)
            elif "message" in key_c or "msg" in key_c:
                if val_c: content_lines.append(val_c)
                content_capture = True

    result["content"] = " ".join(content_lines).strip()[:500]

    # Fallback if parsing failed
    if not result["cli"] and not result["content"]:
        result["content"] = text[:500]
        # Try to detect any phone number in text
        import re
        nums = re.findall(r'\+?\d{10,15}', text)
        if nums:
            result["number"] = nums[0]
            result["country"] = get_country(nums[0])

    return result

# ===================== TELEGRAM POLLING =====================
def tg_get(method: str, params: dict = {}) -> dict:
    try:
        r = requests.get(
            f"https://api.telegram.org/bot{BOT_TOKEN}/{method}",
            params=params, timeout=35
        )
        return r.json()
    except Exception as e:
        log.error(f"TG {method} error: {e}")
        return {"ok": False}

def main():
    log.info("🤖 Matrix Telegram Collector starting...")

    # Verify bot
    me = tg_get("getMe")
    if me.get("ok"):
        log.info(f"✅ Bot: @{me['result']['username']}")
    else:
        log.error("❌ Bot token invalid!")
        return

    # Set offset to only get new messages
    offset = 0
    init = tg_get("getUpdates", {"limit": 1, "offset": -1})
    if init.get("ok") and init.get("result"):
        offset = init["result"][-1]["update_id"] + 1
        log.info(f"📌 Starting from update_id: {offset}")

    log.info(f"👂 Listening to channel {CHANNEL_ID}...")
    seen_msg_ids = set()

    while True:
        try:
            updates = tg_get("getUpdates", {
                "offset": offset,
                "limit": 100,
                "timeout": 30,
                "allowed_updates": ["channel_post", "message"],
            })

            if not updates.get("ok"):
                time.sleep(POLL_DELAY)
                continue

            for update in updates.get("result", []):
                offset = update["update_id"] + 1

                # Accept both channel_post and regular messages
                msg = update.get("channel_post") or update.get("message")
                if not msg: continue

                chat_id = msg.get("chat", {}).get("id", 0)

                # Accept from our channel OR direct messages (if someone forwards)
                if str(chat_id) != str(CHANNEL_ID) and str(chat_id) != str(CHANNEL_ID).lstrip("-100"):
                    # Also accept from the user's personal chat (forwarded msgs)
                    pass

                msg_id = msg.get("message_id")
                if msg_id in seen_msg_ids: continue
                seen_msg_ids.add(msg_id)

                text = msg.get("text", "") or msg.get("caption", "")
                if not text or len(text) < 5: continue

                log.info(f"📨 Message from chat {chat_id}: {text[:80]}")

                parsed = parse_tg_message(text)
                ok = supabase_insert(parsed)
                if ok:
                    flag = "🆕" if parsed["is_new_cli"] else "✅"
                    log.info(f"{flag} Saved: [{parsed['platform'].upper()}] {parsed['cli']} | {parsed['country']}")

            time.sleep(POLL_DELAY)

        except KeyboardInterrupt:
            log.info("👋 Stopped.")
            break
        except Exception as e:
            log.error(f"Error: {e}")
            time.sleep(3)

if __name__ == "__main__":
    main()
