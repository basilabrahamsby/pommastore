import asyncio
import httpx
import logging
import sys

# Configure logging to stdout
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("test_sms")

# Config from backend app
SAP_API_KEY = "b0310625-177e-11ec-864e-e29d2b69142c"
SAP_SENDER_NAME = "KZMCRT"
CMERCURY_STANDARD_TOKEN = "Aft6Wl5Yno9a7yRns8eLFa0ZdzyxvtOQehhMMi2jghTcvqPE8MM3xHp9J8pOLvQMza+VWxrPVRnrab1nuwcDxOGASagDvWGP0q7HEEuzvqhLf9Cx5NPn+wQxN/AO4Q9ZGb3Y7qtAcWeZGL/ejNfP2HyolGTATC/OsfhAW5s6D6dmFuI/7zH0lMKYTtP7IbilGLt7weTJ+WDIz4OCBOLemzSAMieUWDtC4HkMbaudA5FKQJVjFjUP5xWBopeHkFFy+/xH1DbNLdc8oZZ2rooa6o3MwRR6KTFF53iyTerqZkyECZDLA8xFkQ7lBfTH6G3nLjs7ioMgOZEvZwRLCuXaZw=="

async def sendsms_sap(phone: str, message: str, tid: str):
    url = "https://sapteleservices.com/SMS_API/sendsms.php"
    params = {
        "apikey": SAP_API_KEY,
        "mobile": phone,
        "routetype": "1",
        "sendername": SAP_SENDER_NAME,
        "message": message,
        "tid": tid
    }
    print(f"Testing SapTeleServices GET to {phone}...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params, timeout=10.0)
            print(f"SapTeleServices success! Response: {res.text}")
    except Exception as e:
        print(f"SapTeleServices failed: {e}")

async def sendsms_cmercury(phone: str, message: str):
    url = "https://api.cmercury.com/api/sms/TriggerSMS"
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json",
        "X-Token": CMERCURY_STANDARD_TOKEN
    }
    payload = {
        "Mobile": int(phone) if phone.isdigit() else phone,
        "Message": message,
        "MessageType": "Trans",
        "TriggerSMSid": 18918,
        "Listid": 13941
    }
    print(f"Testing cMercury POST to {phone}...")
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=15.0)
            print(f"cMercury success! Response: {res.text}")
    except Exception as e:
        print(f"cMercury failed: {e}")

async def main():
    phone = "9035810416"
    test_msg_sap = "123456 is your One-Time-Password (OTP) to login at your KOZMOCART account. It is valid for 10 mins."
    tid_sap = "1707174314117516014"
    
    test_msg_cmercury = "Your order #KZM-2026-327348 is packed and ready for courier pickup at KOZMOCART. Shipping soon!"
    
    await sendsms_sap(phone, test_msg_sap, tid_sap)
    print("-" * 50)
    await sendsms_cmercury(phone, test_msg_cmercury)

if __name__ == "__main__":
    asyncio.run(main())
