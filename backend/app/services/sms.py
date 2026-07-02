import httpx
import logging
from typing import Optional

logger = logging.getLogger("app.services.sms")

# API Keys & Tokens from PHP configuration
SAP_API_KEY = "b0310625-177e-11ec-864e-e29d2b69142c"
SAP_SENDER_NAME = "KZMCRT"

CMERCURY_Q_TOKEN = "HZ64sJ5AMxVW5+kztGpl6Z1mZFqUVtvPciIYCSxGJaUMp6O4oHig2JmuT1bZ9i4jkHycHruurdXC5pxGGgQATrCm7P04D4DmK+MQZH7Bm4uOI/lHvDUyzxQuZ8FqEEm/xwQU3Wi3GKsoJRRj/6qYbSPNPesxTkC+SHiNyxO1f+uBLF7TNit211csCy1/d31PwGNAGk+3WivBqEeEyzKb2EMEG0kLfC9810i7YRu1WySO/o54ZvJluaYn83Yeli4ybCWelgHAyx+Dm19BEiuzSI8nt2iWDbAigkFcRQ0DVVcwAMaMUFKVU+hLsallm1eu1q1UtWYkRGF+/q9SgWwO2A=="

CMERCURY_STANDARD_TOKEN = "Aft6Wl5Yno9a7yRns8eLFa0ZdzyxvtOQehhMMi2jghTcvqPE8MM3xHp9J8pOLvQMza+VWxrPVRnrab1nuwcDxOGASagDvWGP0q7HEEuzvqhLf9Cx5NPn+wQxN/AO4Q9ZGb3Y7qtAcWeZGL/ejNfP2HyolGTATC/OsfhAW5s6D6dmFuI/7zH0lMKYTtP7IbilGLt7weTJ+WDIz4OCBOLemzSAMieUWDtC4HkMbaudA5FKQJVjFjUP5xWBopeHkFFy+/xH1DbNLdc8oZZ2rooa6o3MwRR6KTFF53iyTerqZkyECZDLA8xFkQ7lBfTH6G3nLjs7ioMgOZEvZwRLCuXaZw=="

async def sendsms(phone: str, message: str, tid: str) -> Optional[str]:
    """
    Sends a general transactional SMS via SapTeleServices GET API.
    """
    url = "https://sapteleservices.com/SMS_API/sendsms.php"
    params = {
        "apikey": SAP_API_KEY,
        "mobile": phone,
        "routetype": "1",
        "sendername": SAP_SENDER_NAME,
        "message": message,
        "tid": tid
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params=params, timeout=10.0)
            res.raise_for_status()
            logger.info(f"SMS sent successfully to {phone} via SapTeleServices. Response: {res.text}")
            return res.text
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone} via SapTeleServices: {e}")
        return None

async def sendsms_otp(phone: str, otp: str) -> Optional[str]:
    """
    Sends a login OTP SMS via SapTeleServices GET API using DL T-TID template.
    """
    message = f"{otp} is your One-Time-Password (OTP) to login at your KOZMOCART account. It is valid for 10 mins."
    tid = "1707174314117516014"
    return await sendsms(phone, message, tid)

async def _send_cmercury_sms(phone: str, message: str, token: str, trigger_id: int, list_id: int) -> Optional[str]:
    """
    Helper function to send a JSON POST request to cMercury SMS API.
    """
    url = "https://api.cmercury.com/api/sms/TriggerSMS"
    headers = {
        "Content-Type": "application/json",
        "accept": "application/json",
        "X-Token": token
    }
    payload = {
        "Mobile": int(phone) if phone.isdigit() else phone,
        "Message": message,
        "MessageType": "Trans",
        "TriggerSMSid": trigger_id,
        "Listid": list_id
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=15.0)
            res.raise_for_status()
            logger.info(f"cMercury SMS sent successfully to {phone}. Response: {res.text}")
            return res.text
    except Exception as e:
        logger.error(f"Failed to send SMS to {phone} via cMercury: {e}")
        return None

async def sendsmsq(phone: str, message: str) -> Optional[str]:
    """
    Sends SMS using cMercury API using the CMERCURY_Q_TOKEN.
    """
    return await _send_cmercury_sms(
        phone=phone,
        message=message,
        token=CMERCURY_Q_TOKEN,
        trigger_id=18915,
        list_id=13658
    )

async def sendsms_welcome(phone: str, message: str) -> Optional[str]:
    """
    Sends a welcome SMS to the user via cMercury API.
    """
    return await _send_cmercury_sms(
        phone=phone,
        message=message,
        token=CMERCURY_STANDARD_TOKEN,
        trigger_id=18918,
        list_id=13941
    )

async def sendsms_orderadmin(phone: str, message: str) -> Optional[str]:
    """
    Sends an order notification SMS to the admin via cMercury API.
    """
    return await _send_cmercury_sms(
        phone=phone,
        message=message,
        token=CMERCURY_STANDARD_TOKEN,
        trigger_id=18918,
        list_id=13941
    )

async def sendsms_ordercustomer(phone: str, message: str) -> Optional[str]:
    """
    Sends an order confirmation SMS to the customer via cMercury API.
    """
    return await _send_cmercury_sms(
        phone=phone,
        message=message,
        token=CMERCURY_STANDARD_TOKEN,
        trigger_id=18918,
        list_id=13941
    )

async def sendsms_status(phone: str, message: str) -> Optional[str]:
    """
    Sends an order status update SMS to the customer via cMercury API.
    """
    return await _send_cmercury_sms(
        phone=phone,
        message=message,
        token=CMERCURY_STANDARD_TOKEN,
        trigger_id=18918,
        list_id=13941
    )
