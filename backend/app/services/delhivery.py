import httpx
from typing import Dict, Any, List
from app.core.config import settings
import logging
from app.core.database import AsyncSessionLocal
from app.models.system import SystemSettings
from sqlalchemy import select

logger = logging.getLogger(__name__)

# Base URLs
SANDBOX_URL = "https://staging-express.delhivery.com"
PRODUCTION_URL = "https://track.delhivery.com"

async def get_delhivery_config() -> Dict[str, Any]:
    """
    Fetches Delhivery configuration. 
    API Token and Sandbox mode are loaded from code settings (.env),
    while the Pickup Location can be set from the database system_settings table.
    """
    db_pickup_location = None
    try:
        async with AsyncSessionLocal() as db:
            q = select(SystemSettings).where(SystemSettings.key == "delhivery")
            res = await db.execute(q)
            setting = res.scalar_one_or_none()
            if setting and setting.value:
                db_pickup_location = setting.value.get("pickup_location")
    except Exception as e:
        logger.error(f"Failed to fetch Delhivery config from DB: {e}")
        
    return {
        "api_token": settings.DELHIVERY_API_TOKEN,
        "sandbox": settings.DELHIVERY_SANDBOX,
        "pickup_location": db_pickup_location or settings.DELHIVERY_PICKUP_LOCATION
    }

def get_base_url(sandbox: bool) -> str:
    return SANDBOX_URL if sandbox else PRODUCTION_URL

def get_headers(api_token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Token {api_token}",
        "Content-Type": "application/json"
    }

async def check_pincode_serviceability(pincode: str) -> Dict[str, Any]:
    """
    Checks if Delhivery delivers to the given pincode.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]

    if api_token == "placeholder_delhivery_token":
        # Mock successful serviceability for local/testing flows
        return {
            "serviceable": True,
            "cod_available": True,
            "prepaid_available": True,
            "district": "Mumbai",
            "state": "Maharashtra",
            "message": "Mock Serviceable"
        }

    url = f"{get_base_url(sandbox)}/c/api/pin-codes/json/?filter_codes={pincode}"
    headers = {"Authorization": f"Token {api_token}"}
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, timeout=10.0)
            if res.status_code == 200:
                data = res.json()
                delivery_codes = data.get("delivery_codes", [])
                if delivery_codes:
                    postal_code = delivery_codes[0].get("postal_code", {})
                    is_cod = postal_code.get("is_cod") == "Y" or postal_code.get("cash") == "Y"
                    pre_paid = postal_code.get("pre_paid") == "Y"
                    return {
                        "serviceable": True,
                        "cod_available": is_cod,
                        "prepaid_available": pre_paid,
                        "district": postal_code.get("district", ""),
                        "state": postal_code.get("state_code", ""),
                        "message": "Serviceable"
                    }
    except Exception as e:
        logger.error(f"Delhivery Pincode check error: {str(e)}")
        
    return {
        "serviceable": False,
        "cod_available": False,
        "prepaid_available": False,
        "district": "",
        "state": "",
        "message": "Not serviceable or API error"
    }

async def create_delhivery_shipment(order_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Book a shipment with Delhivery and return waybill/tracking details.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]
    pickup_location = config["pickup_location"]

    if api_token == "placeholder_delhivery_token":
        # Mock successful waybill generation for testing
        import random
        mock_waybill = "".join([str(random.randint(0, 9)) for _ in range(12)])
        return {
            "success": True,
            "waybill": mock_waybill,
            "carrier": "Delhivery",
            "message": "Mock shipment created successfully"
        }

    # Format address
    sa = order_data.get("shipping_address") or {}
    full_address = f"{sa.get('address_line1', '')} {sa.get('address_line2', '') or ''}, {sa.get('city', '')}, {sa.get('state', '')}"
    pincode = sa.get("pincode", "")

    cod_amount = "0"
    payment_mode = "Prepaid"
    if order_data.get("payment_method") in ["cod", "cash"]:
        payment_mode = "COD"
        cod_amount = str(order_data.get("total_amount", 0))

    payload = {
        "shipments": [
            {
                "name": order_data.get("customer_name", "Customer"),
                "add": full_address,
                "phone": order_data.get("customer_phone", ""),
                "payment_mode": payment_mode,
                "cod_amount": cod_amount,
                "order": order_data.get("order_number", ""),
                "pin": pincode,
                "weight": 500, # average weight in grams
                "products_desc": "Luxury Fragrance Curation",
                "hsn_code": "330300"
            }
        ],
        "pickup_location": {
            "name": pickup_location
        }
    }

    url = f"{get_base_url(sandbox)}/api/v1/packages/json/"
    headers = get_headers(api_token)

    try:
        async with httpx.AsyncClient() as client:
            # Delhivery expects parameters formatted as form params: format=json and data=<JSON_STRING>
            import json
            form_data = {
                "format": "json",
                "data": json.dumps(payload)
            }
            # Sending as application/x-www-form-urlencoded
            res = await client.post(url, data=form_data, headers={"Authorization": headers["Authorization"]}, timeout=15.0)
            if res.status_code == 200:
                res_data = res.json()
                packages = res_data.get("packages", [])
                if packages:
                    package = packages[0]
                    if package.get("status") == "Success":
                        return {
                            "success": True,
                            "waybill": package.get("waybill"),
                            "carrier": "Delhivery",
                            "message": "Shipment created successfully"
                        }
                    else:
                        return {
                            "success": False,
                            "waybill": None,
                            "carrier": "Delhivery",
                            "message": f"Delhivery packaging error: {package.get('remarks')}"
                        }
    except Exception as e:
        logger.error(f"Delhivery shipment booking error: {str(e)}")

    return {
        "success": False,
        "waybill": None,
        "carrier": "Delhivery",
        "message": "Network or server failure during Delhivery booking"
    }

async def get_delhivery_tracking_status(waybill: str) -> Dict[str, Any]:
    """
    Retrieves real-time tracking status of a shipment from Delhivery.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]

    if api_token == "placeholder_delhivery_token":
        # Simulates delivery updates based on the waybill digits for sandbox demo
        last_digit = int(waybill[-1]) if waybill and waybill[-1].isdigit() else 5
        if last_digit <= 3:
            status_str = "In Transit"
        elif last_digit <= 6:
            status_str = "Out for Delivery"
        else:
            status_str = "Delivered"
            
        return {
            "success": True,
            "status": status_str,
            "remarks": "Mock tracking response"
        }

    url = f"{get_base_url(sandbox)}/api/v1/packages/json/?waybills={waybill}"
    headers = {"Authorization": f"Token {api_token}"}

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, timeout=10.0)
            if res.status_code == 200:
                data = res.json()
                shipment_data = data.get("shipment_data", [])
                if shipment_data:
                    shipment = shipment_data[0].get("shipment", {})
                    status_obj = shipment.get("status", {})
                    status_name = status_obj.get("status", "")
                    return {
                        "success": True,
                        "status": status_name,
                        "remarks": status_obj.get("instructions", "")
                    }
    except Exception as e:
        logger.error(f"Delhivery tracking check error: {str(e)}")

    return {
        "success": False,
        "status": None,
        "remarks": "Failed to fetch status"
    }
