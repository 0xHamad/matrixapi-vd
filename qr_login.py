import asyncio
import qrcode
from telethon import TelegramClient

API_ID = 6
API_HASH = "eb06d4abfb49dc3eeb1aeb98ae0f581e"

async def main():
    print("Connecting to Telegram...")
    # Proxy removed because QR login does not require it and the current proxy returns 407
    client = TelegramClient("matrix_userbot", API_ID, API_HASH)
    await client.connect()

    if await client.is_user_authorized():
        print("Already logged in!")
        return

    try:
        qr_login = await client.qr_login()
        
        print("\n=========================================")
        print(" SCAN THIS QR CODE WITH YOUR TELEGRAM APP ")
        print(" Go to: Settings -> Devices -> Link Device")
        print("=========================================\n")
        
        qr = qrcode.QRCode()
        qr.add_data(qr_login.url)
        qr.print_ascii(invert=True)
        
        print("\nWaiting for scan...")
        
        # Wait for the user to scan the QR code
        await qr_login.wait(timeout=120)
        print("✅ Login Successful! Session saved as matrix_userbot.session")
        
    except Exception as e:
        print(f"Error during QR login: {e}")

if __name__ == "__main__":
    asyncio.run(main())
