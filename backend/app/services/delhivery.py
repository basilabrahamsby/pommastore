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

async def get_delhivery_shipping_rate(origin_pin: str, dest_pin: str, weight_grams: int = 500) -> float:
    """
    Queries Delhivery live invoice calculation API for exact shipping charges.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]

    if api_token == "placeholder_delhivery_token":
        return None

    # Delhivery invoice charges estimation endpoint
    url = f"{get_base_url(sandbox)}/api/kinko/v1/invoice/charges/.json"
    headers = {"Authorization": f"Token {api_token}", "Content-Type": "application/json"}
    params = {
        "md": "E", # Express mode
        "cgm": weight_grams, # weight in grams
        "o_pin": origin_pin,
        "d_pin": dest_pin,
        "ss": "Delivered"
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params, timeout=8.0)
            if res.status_code == 200:
                data = res.json()
                if isinstance(data, list) and len(data) > 0:
                    total_amount = data[0].get("total_amount")
                    if total_amount is not None:
                        return float(total_amount)
    except Exception as e:
        logger.error(f"Delhivery live shipping rate check failed: {e}")
        
    return None

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
            "shipping_fee": 120.0,
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
                    
                    # Calculate dynamic shipping rate based on Delhivery guidelines as fallback
                    state_code = (postal_code.get("state_code") or "").upper().strip()
                    district = (postal_code.get("district") or "").lower().strip()
                    
                    if state_code == "KL": # Kerala
                        if "ernakulam" in district or "kochi" in district:
                            shipping_fee = 60.0 # Local
                        else:
                            shipping_fee = 85.0 # Regional
                    elif state_code in ["DL", "KA", "MH", "TN", "TS", "WB"] or district in ["bengaluru", "chennai", "mumbai", "hyderabad", "kolkata"]:
                        shipping_fee = 120.0 # Metro / Near National
                    else:
                        shipping_fee = 150.0 # Rest of India / Far National
                        
                    # Fetch origin pincode from settings or db
                    origin_pin = 682026
                    try:
                        async with AsyncSessionLocal() as db:
                            q = select(SystemSettings).where(SystemSettings.key == "delhivery")
                            db_res = await db.execute(q)
                            setting = db_res.scalar_one_or_none()
                            if setting and setting.value:
                                origin_pin = setting.value.get("origin_pincode") or setting.value.get("pickup_pincode") or 682026
                    except Exception:
                        pass
                        
                    # Query Delhivery invoice charges estimation API for exact rate
                    exact_rate = await get_delhivery_shipping_rate(str(origin_pin), str(pincode))
                    if exact_rate is not None:
                        shipping_fee = exact_rate
                        
                    return {
                        "serviceable": True,
                        "cod_available": is_cod,
                        "prepaid_available": pre_paid,
                        "district": postal_code.get("district", ""),
                        "state": postal_code.get("state_code", ""),
                        "shipping_fee": shipping_fee,
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
        "shipping_fee": 150.0,
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

    url = f"{get_base_url(sandbox)}/api/cmu/create.json"
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
            else:
                logger.error(f"Delhivery HTTP Error {res.status_code}: {res.text}")
                return {
                    "success": False,
                    "waybill": None,
                    "carrier": "Delhivery",
                    "message": f"Delhivery API responded with status {res.status_code}: {res.text}"
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


async def cancel_delhivery_shipment(waybill: str) -> Dict[str, Any]:
    """
    Cancels a shipment booking in Delhivery system.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]

    if api_token == "placeholder_delhivery_token":
        # Mock successful cancellation in staging
        return {
            "success": True,
            "message": "Mock shipment cancelled successfully"
        }

    url = f"{get_base_url(sandbox)}/api/p/edit"
    headers = get_headers(api_token)
    payload = {
        "waybill": waybill,
        "cancellation": "true"
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if res.status_code == 200:
                try:
                    import xml.etree.ElementTree as ET
                    root = ET.fromstring(res.text)
                    status_node = root.find("status")
                    remark_node = root.find("remark")
                    
                    status_val = status_node.text if status_node is not None else ""
                    remark_val = remark_node.text if remark_node is not None else ""
                    
                    if status_val.strip().lower() in ("true", "success") or "cancelled" in remark_val.lower():
                        return {
                            "success": True,
                            "message": f"Delhivery cancellation successful: {remark_val}"
                        }
                    else:
                        return {
                            "success": False,
                            "message": f"Delhivery cancellation failed with remark: {remark_val}"
                        }
                except Exception as parse_err:
                    logger.error(f"Delhivery XML parsing error: {str(parse_err)}")
                    if "true" in res.text.lower() or "cancelled" in res.text.lower():
                        return {
                            "success": True,
                            "message": "Shipment cancellation request sent successfully (parsed via fallback)"
                        }
                    return {
                        "success": False,
                        "message": f"Failed to parse Delhivery cancellation response: {res.text}"
                    }
    except Exception as e:
        logger.error(f"Delhivery shipment cancellation error: {str(e)}")

    return {
        "success": False,
        "message": "Failed to cancel shipment with Delhivery"
    }


from typing import Optional

async def fetch_delhivery_packing_slip(waybill: str) -> Optional[Dict[str, Any]]:
    """
    Fetches packing slip details for a waybill.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]

    if api_token == "placeholder_delhivery_token":
        return None

    url = f"{get_base_url(sandbox)}/api/p/packing_slip"
    headers = {"Authorization": f"Token {api_token}"}
    params = {"wbns": waybill}

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params, timeout=10.0)
            if res.status_code == 200:
                data = res.json()
                packages = data.get("packages", [])
                if packages:
                    return packages[0]
    except Exception as e:
        logger.error(f"Failed to fetch Delhivery packing slip: {e}")
    return None

def generate_delhivery_label_html(order, pkg: Optional[Dict[str, Any]] = None) -> str:
    # Extracted fields from packing slip or order
    waybill = pkg.get("wbn") if (pkg and pkg.get("wbn")) else (order.tracking_number or "27438910005456")
    order_num = pkg.get("oid") if (pkg and pkg.get("oid")) else order.order_number
    
    # Destination fields
    dest_name = pkg.get("name") if (pkg and pkg.get("name")) else order.customer_name
    
    shipping_addr_obj = order.shipping_address or {}
    dest_address = pkg.get("address") if (pkg and pkg.get("address")) else (
        shipping_addr_obj.get("address_line1", "") + ", " + 
        shipping_addr_obj.get("address_line2", "") + ", " +
        shipping_addr_obj.get("city", "") + ", " +
        shipping_addr_obj.get("state", "")
    )
    dest_pin = pkg.get("pin") if (pkg and pkg.get("pin")) else shipping_addr_obj.get("pincode", "")
    
    # Date formatting
    date_str = pkg.get("cd") if (pkg and pkg.get("cd")) else order.created_at.strftime("%Y-%m-%d %H:%M:%S")
    if date_str and "T" in date_str:
        date_str = date_str.split(".")[0].replace("T", " ")
        
    # Build list of products
    products_html = ""
    total_val = 0.0
    for item in order.items:
        qty = item.quantity
        price = float(item.unit_price)
        total_price = price * qty
        total_val += total_price
        products_html += f"""
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="padding: 6px 10px; font-size: 11px;">{item.variant.product.name} ({qty})</td>
            <td style="padding: 6px; font-size: 11px; text-align: center;">INR {int(price)}</td>
            <td style="padding: 6px 10px; font-size: 11px; text-align: right;">INR {int(total_price)}</td>
        </tr>
        """
        
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delhivery Packing Label - {order_num}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Outfit:wght@400;700&display=swap');
        
        body {{
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }}
        
        .label-card {{
            width: 420px;
            background: white;
            border: 2px solid black;
            padding: 0;
            box-sizing: border-box;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }}
        
        .table-layout {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        .table-layout td {{
            border-bottom: 1px solid black;
            vertical-align: top;
        }}
        
        .header-left {{
            width: 60%;
            padding: 10px;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.3;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border-right: 1px solid black;
        }}
        
        .header-right {{
            width: 40%;
            padding: 10px;
            text-align: center;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            border-bottom: 1px solid black;
        }}
        
        .barcode-section {{
            text-align: center;
            padding: 12px 10px;
            border-bottom: 1px solid black;
        }}
        
        .barcode-font {{
            font-family: 'Libre Barcode 39', cursive;
            font-size: 44px;
            line-height: 1;
            margin: 0;
            letter-spacing: 1px;
        }}
        
        .barcode-text {{
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1.5px;
            margin-top: 4px;
        }}
        
        .routing-section {{
            display: flex;
            border-bottom: 1px solid black;
            width: 100%;
        }}
        
        .routing-left {{
            width: 60%;
            padding: 8px 10px;
            font-size: 20px;
            font-weight: 700;
            border-right: 1px solid black;
            box-sizing: border-box;
        }}
        
        .routing-right {{
            width: 40%;
            padding: 8px 10px;
            font-size: 14px;
            font-weight: 700;
            text-align: right;
            text-transform: uppercase;
            box-sizing: border-box;
        }}
        
        .info-split {{
            display: flex;
            border-bottom: 1px solid black;
            width: 100%;
        }}
        
        .info-left {{
            width: 70%;
            padding: 8px 10px;
            font-size: 10px;
            line-height: 1.4;
            border-right: 1px solid black;
            box-sizing: border-box;
        }}
        
        .info-right {{
            width: 30%;
            padding: 8px 10px;
            font-size: 10px;
            line-height: 1.4;
            text-align: center;
            box-sizing: border-box;
        }}
        
        .product-table-wrapper {{
            padding: 0;
            border-bottom: 1px solid black;
        }}
        
        .product-table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        .product-table th {{
            background: #f7f7f7;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 6px;
            border-bottom: 1px solid black;
            text-align: left;
        }}
        
        .product-table td {{
            border-bottom: 1px dotted #ccc;
        }}
        
        .print-btn-container {{
            margin-top: 20px;
            text-align: center;
        }}
        
        .print-btn {{
            background: black;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            border-radius: 2px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            .print-btn-container {{
                display: none;
            }}
            .label-card {{
                border: 2px solid black;
                box-shadow: none;
            }}
        }}
    </style>
</head>
<body>
    <div>
        <div class="label-card">
            <!-- Header -->
            <table class="table-layout">
                <tr>
                    <td class="header-left">
                        KOZMOCART COMMODITIES<br>PRIVATE LIMITED
                    </td>
                    <td class="header-right">
                        <span style="color: #e31e24;">DELHI</span><span>very</span>
                    </td>
                </tr>
            </table>
            
            <!-- Waybill Barcode -->
            <div class="barcode-section">
                <div class="barcode-font">*{waybill}*</div>
                <div class="barcode-text">{waybill}</div>
            </div>
            
            <!-- Routing Info -->
            <div class="routing-section">
                <div class="routing-left">{dest_pin}</div>
                <div class="routing-right" style="align-self: center;">TRN/KPH</div>
            </div>
            
            <!-- Ship To Section -->
            <div class="info-split">
                <div class="info-left">
                    <span style="font-weight: 700; text-transform: uppercase; font-size: 8px; color: #666; display: block; margin-bottom: 2px;">Ship To:</span>
                    <strong style="font-size: 13px; display: block; margin-bottom: 4px;">{dest_name.upper()}</strong>
                    <div style="font-size: 10px; line-height: 1.3;">{dest_address}</div>
                    <strong style="margin-top: 5px; display: block; font-size: 11px;">PIN: {dest_pin}</strong>
                </div>
                <div class="info-right">
                    <span style="font-weight: 700; display: block; font-size: 10px;">Pre-paid<br>Surface</span>
                    <div style="margin-top: 15px; font-size: 10px;">
                        INR<br><strong style="font-size: 16px;">{int(order.total_amount)}</strong>
                    </div>
                </div>
            </div>
            
            <!-- Seller Section -->
            <div class="info-split">
                <div class="info-left">
                    <strong>Seller:</strong> KOZMOCART COMMODITIES PRIVATE LIMITED<br>
                    <strong>Address:</strong> Kozmocart Commodities Pvt Ltd 72/826, B.T.S RRA-283, BTS Road, Keerthi Nagar, Elamakkara P.O Kochi - 682026 Kerala<br>
                    <strong>GST:</strong> 32AAHCK3784H1ZF
                </div>
                <div class="info-right" style="font-size: 9px; align-self: center;">
                    <strong>Date:</strong><br>{date_str}
                </div>
            </div>
            
            <!-- Products Table -->
            <div class="product-table-wrapper">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th style="width: 60%; padding-left: 10px;">Product(Qty)</th>
                            <th style="width: 20%; text-align: center;">Price</th>
                            <th style="width: 20%; text-align: right; padding-right: 10px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products_html}
                        <tr style="font-weight: 700; background: #fafafa;">
                            <td style="padding: 8px 10px; font-size: 11px;">Total</td>
                            <td style="padding: 8px 6px; font-size: 11px; text-align: center;"></td>
                            <td style="padding: 8px 10px; font-size: 11px; text-align: right;">INR {int(order.total_amount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Order ID Barcode -->
            <div class="barcode-section" style="border-bottom: 1px solid black; padding: 12px 10px;">
                <div class="barcode-font" style="font-size: 38px;">*{order_num}*</div>
                <div class="barcode-text" style="font-size: 11px;">{order_num}</div>
            </div>
            
            <!-- Return Address -->
            <div style="padding: 8px 10px; font-size: 9px; line-height: 1.3; color: #333;">
                <strong>Return Address:</strong> Kozmocart Commodities Pvt Ltd 72/826, B.T.S RRA-283, BTS Road, Keerthi Nagar, Elamakkara P.O Kochi - 682026 Kerala
            </div>
        </div>
        
        <div class="print-btn-container">
            <button class="print-btn" onclick="window.print()">Print Shipping Label</button>
        </div>
    </div>
</body>
</html>"""
    return html

async def schedule_delhivery_pickup(pickup_date: str, pickup_time: str, pickup_location: str, expected_count: int = 1) -> Dict[str, Any]:
    """
    Schedules a courier pickup request with Delhivery.
    """
    config = await get_delhivery_config()
    api_token = config["api_token"]
    sandbox = config["sandbox"]

    if api_token == "placeholder_delhivery_token":
        return {
            "success": True,
            "message": "Mock Pickup scheduled successfully",
            "pickup_id": "MOCK-PK-12345"
        }

    url = f"{get_base_url(sandbox)}/fm/request/new/"
    headers = {
        "Authorization": f"Token {api_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "pickup_time": pickup_time,
        "pickup_date": pickup_date,
        "pickup_location": pickup_location,
        "expected_package_count": expected_count
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, headers=headers, json=payload, timeout=12.0)
            if res.status_code in [200, 201]:
                data = res.json()
                return {
                    "success": True,
                    "message": "Pickup scheduled successfully",
                    "data": data
                }
            else:
                logger.error(f"Delhivery pickup scheduling failed: {res.status_code} - {res.text}")
                return {
                    "success": False,
                    "message": f"Delhivery API error: {res.text}"
                }
    except Exception as e:
        logger.error(f"Failed to schedule Delhivery pickup: {e}")
        return {
            "success": False,
            "message": str(e)
        }
