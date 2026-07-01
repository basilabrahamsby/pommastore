import httpx
from typing import Dict, Any, List
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Base URLs
SANDBOX_URL = "https://staging-express.delhivery.com"
PRODUCTION_URL = "https://track.delhivery.com"

def get_base_url() -> str:
    return SANDBOX_URL if settings.DELHIVERY_SANDBOX else PRODUCTION_URL

def get_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Token {settings.DELHIVERY_API_TOKEN}",
        "Content-Type": "application/json"
    }

async def check_pincode_serviceability(pincode: str) -> Dict[str, Any]:
    """
    Checks if Delhivery delivers to the given pincode.
    """
    if settings.DELHIVERY_API_TOKEN == "placeholder_delhivery_token":
        # Mock successful serviceability for local/testing flows
        return {
            "serviceable": True,
            "cod_available": True,
            "prepaid_available": True,
            "district": "Mumbai",
            "state": "Maharashtra",
            "message": "Mock Serviceable"
        }

    url = f"{get_base_url()}/c/api/pin-codes/json/?filter_codes={pincode}"
    headers = {"Authorization": f"Token {settings.DELHIVERY_API_TOKEN}"}
    
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
    Books a shipment with Delhivery and returns waybill/tracking details.
    
    Input order_data expects:
        - order_number
        - total_amount
        - payment_method ("cod" or "prepaid" / "razorpay" etc.)
        - customer_name
        - customer_phone
        - customer_email
        - shipping_address (dict containing address_line1, city, state, pincode)
    """
    if settings.DELHIVERY_API_TOKEN == "placeholder_delhivery_token":
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
            "name": settings.DELHIVERY_PICKUP_LOCATION
        }
    }

    url = f"{get_base_url()}/api/v1/packages/json/"
    headers = get_headers()

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
