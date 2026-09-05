# -*- coding: utf-8 -*-
"""
Matrix Userbot — Private Channel Monitor → Supabase
=====================================================
Uses YOUR OWN Telegram account (Telethon userbot).
No need to be admin. Just a member of the channel.

Setup:
  pip install telethon requests

Get API credentials from: https://my.telegram.org
  → Log in → API Development Tools → Create App
  → Copy api_id and api_hash

First run: It will ask for your phone number + OTP code.
After that it saves a session file and runs silently.
"""

import os
import asyncio
import logging
import requests
from datetime import datetime
from telethon import TelegramClient, events
from telethon.tl.types import PeerChannel

# ===================== CONFIG =====================
# NO NEED to go to my.telegram.org! Using Official Telegram Android API ID.
API_ID   = 6
API_HASH = "eb06d4abfb49dc3eeb1aeb98ae0f581e"

# The private channel to monitor (the one you're a member of)
CHANNEL_ID = -1003721669079   # works even for private channels you joined

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://owvgnnhayikisrehjkfz.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dmdubmhheWlraXNyZWhqa2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwOTE1MywiZXhwIjoyMTA0MTg1MTUzfQ.gglfJOcCy_-lZuJKTRoZ-4_cHd0klfz3OT5xPy8QKww")

# Session file name (saved locally after first login)
SESSION_NAME = "matrix_userbot"

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
    clean = str(number).lstrip("+").replace(" ","")
    for pfx in sorted(PREFIX_MAP.keys(), key=len, reverse=True):
        if clean.startswith(pfx):
            return PREFIX_MAP[pfx]
    return f"Unknown (+{clean[:3]})" if len(clean) >= 3 else "Unknown"

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
        return r.status_code in (200, 201, 204)
    except Exception as e:
        log.error(f"Supabase error: {e}")
        return False

# ===================== MESSAGE PARSER =====================
def parse_message(text: str) -> dict:
    """
    Parse the formatted SMS text from the channel.
    Handles standard key-value lines and special cases like:
    "NEW LAMIX APP: Digital DXB"
    """
    import re
    result = {
        "platform": "lamix",
        "cli": "",
        "country": "",
        "number": "",
        "content": "",
        "is_new_cli": False,
        "raw_text": text[:2000],
    }

    # Special case: NEW LAMIX APP / NEW PURPLE APP
    app_match = re.search(r'NEW (LAMIX|PURPLE) APP:\s*\*?([^\*\n\r]+)\*?', text, re.IGNORECASE)
    if app_match:
        result["platform"] = app_match.group(1).lower()
        result["cli"] = app_match.group(2).strip()
        result["is_new_cli"] = True

    # Detect platform overall
    upper = text.upper()
    if "PURPLE" in upper or "🟣" in text:
        result["platform"] = "purple"
    elif "LAMIX" in upper or "💠" in text:
        result["platform"] = "lamix"
    
    if "NEW CLI" in upper:
        result["is_new_cli"] = True

    lines = text.strip().split("\n")
    content_next = False
    content_lines = []

    for line in lines:
        s = line.strip()
        if not s: continue

        # If it's the NEW APP line, skip adding it to content
        if "NEW LAMIX APP:" in upper or "NEW PURPLE APP:" in upper:
            if "NEW" in s.upper() and "APP:" in s.upper():
                continue

        if content_next:
            content_lines.append(s.strip("`\"'"))
            continue

        if ":" in s:
            key, _, val = s.partition(":")
            key_clean = key.strip().lower()
            # Clean emojis from key
            for emo in ["💠", "🌍", "📱", "💬", "🟣"]:
                key_clean = key_clean.replace(emo, "").strip()
            val_clean = val.strip().strip("`\"' ")

            if key_clean in ["cli", "sender", "from"] and val_clean and not result["cli"]:
                result["cli"] = val_clean
            elif key_clean == "country" and val_clean and not result["country"]:
                result["country"] = val_clean
            elif key_clean == "number" and val_clean and not result["number"]:
                result["number"] = val_clean
            elif key_clean in ["message", "msg", "sms"]:
                if val_clean:
                    content_lines.append(val_clean)
                content_next = True
            else:
                # If it has a colon but isn't a standard key, it's part of the actual SMS message text
                if not any(k in s.upper() for k in ["NEW LAMIX APP", "NEW PURPLE APP"]):
                    content_lines.append(s)
        else:
            # Random string without colon
            if not any(k in s.upper() for k in ["NEW LAMIX APP", "NEW PURPLE APP", "LAMIX PANEL"]):
                content_lines.append(s)

    if content_lines:
        result["content"] = "\n".join(content_lines).strip()
    else:
        # Fallback if content is completely empty: remove the headers from raw text manually
        clean_fb = text
        clean_fb = re.sub(r'🆕\s*\*\*NEW (LAMIX|PURPLE) APP:.*?\*\*', '', clean_fb, flags=re.IGNORECASE)
        clean_fb = re.sub(r'Country:.*', '', clean_fb, flags=re.IGNORECASE)
        result["content"] = clean_fb.strip()

    # Fix country from number if still empty
    if not result["country"] and result["number"]:
        result["country"] = get_country(result["number"])

    return result

# ===================== MAIN USERBOT =====================

async def main():
    log.info("🚀 Matrix Userbot starting...")
    log.info(f"📡 Monitoring channel: {CHANNEL_ID}")

    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    await client.start()  # Will prompt phone + OTP on first run

    me = await client.get_me()
    log.info(f"✅ Logged in as: {me.first_name} (@{me.username})")

    # Verify we can access the channel
    try:
        # Fetch dialogs once to populate Telethon's entity cache for new accounts
        await client.get_dialogs()
        entity = await client.get_entity(CHANNEL_ID)
        log.info(f"✅ Channel found: {getattr(entity, 'title', CHANNEL_ID)}")
    except Exception as e:
        log.error(f"❌ Cannot access channel {CHANNEL_ID}: {e}")
        log.error("Make sure you are a MEMBER of that channel!")
        return

    # Fetch the last 100 messages from the channel for history
    log.info("Fetching the latest 100 messages from the channel to backfill web...")
    try:
        # Get existing to avoid duplicates on restart
        import requests
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        res = requests.get(f"{SUPABASE_URL}/rest/v1/announcements?select=raw_text&limit=500", headers=headers)
        existing = {x.get("raw_text") for x in res.json()} if res.status_code == 200 else set()

        history = await client.get_messages(CHANNEL_ID, limit=100)
        added = 0
        for msg in reversed(history):
            text = msg.text or msg.message or ""
            if len(text) > 5:
                parsed = parse_message(text)
                if parsed["raw_text"] not in existing:
                    if supabase_insert(parsed):
                        existing.add(parsed["raw_text"])
                        added += 1
        log.info(f"✅ Backfill complete! Added {added} missing messages to web.")
    except Exception as e:
        log.error(f"Failed to fetch history: {e}")

    # Listen for live new messages ONLY in the main channel
    @client.on(events.NewMessage(chats=CHANNEL_ID))
    async def handler(event):
        text = event.message.text or event.message.message or ""
        if not text or len(text) < 5:
            return

        log.info(f"📨 New message (id:{event.message.id}): {text[:80]}...")

        parsed = parse_message(text)
        ok = supabase_insert(parsed)

        if ok:
            log.info(f"✅ Saved → CLI: {parsed['cli']} | {parsed['platform']} | {parsed['country']}")
        else:
            log.error(f"❌ Supabase save failed")

    log.info("👂 Listening for live new messages... (Ctrl+C to stop)")
    await client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
