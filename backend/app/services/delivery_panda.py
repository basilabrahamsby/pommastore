import httpx
import logging
from typing import Dict, Any
from app.core.config import settings
from app.models.order import Order, PaymentMethod

logger = logging.getLogger(__name__)

# Valid UAE Cities according to Delivery Panda API
VALID_UAE_CITIES = [
    "Dubai", "Abu Dhabi", "Al Ain", "Sharjah", 
    "Ajman", "Umm Al Quwain", "Fujairah", "Ras Al Khaimah"
]

def normalize_uae_city(raw_city: str | None) -> str:
    """Normalize city name to match Delivery Panda's exact supported list."""
    if not raw_city:
        return "Dubai"
    
    clean = raw_city.strip().lower()
    if "abu dhabi" in clean:
        return "Abu Dhabi"
    if "al ain" in clean:
        return "Al Ain"
    if "sharjah" in clean:
        return "Sharjah"
    if "ajman" in clean:
        return "Ajman"
    if "umm" in clean or "quwain" in clean:
        return "Umm Al Quwain"
    if "fujairah" in clean:
        return "Fujairah"
    if "ras" in clean or "khaimah" in clean:
        return "Ras Al Khaimah"
    return "Dubai"

async def book_delivery_panda_shipment(order: Order) -> Dict[str, Any]:
    """
    Creates a Customer Booking consignment on Delivery Panda API.
    URL: https://app.deliverypanda.me/webservice/CustomerBooking
    """
    try:
        api_key = settings.DELIVERY_PANDA_API_KEY
        endpoint_url = settings.DELIVERY_PANDA_URL
        
        # Extract Shipping Address details
        addr = order.shipping_address or {}
        customer_name = order.customer_name or addr.get("full_name") or "Valued Customer"
        phone = order.customer_phone or addr.get("phone") or "+971500000000"
        
        street_address = addr.get("address_line1") or addr.get("street") or "Dubai"
        if addr.get("address_line2"):
            street_address += f", {addr.get('address_line2')}"
            
        city = normalize_uae_city(addr.get("city") or addr.get("state") or addr.get("emirate"))
        location = addr.get("area") or addr.get("location") or city
        
        # Calculate Pieces & Item Description
        total_pieces = 0
        item_names = []
        if order.items:
            for item in order.items:
                total_pieces += item.quantity
                if item.variant and item.variant.product:
                    item_names.append(f"{item.variant.product.name} ({item.quantity}x)")
                else:
                    item_names.append(f"Perfume ({item.quantity}x)")
        
        pieces_str = str(max(1, total_pieces))
        items_desc = ", ".join(item_names)[:250] if item_names else "Luxury Perfume / Fragrance"
        
        # Cash on Delivery Amount (NcndAmount)
        # If COD order, pass order.total_amount. If paid via Stripe/Card, pass 0.00
        is_cod = order.payment_method == PaymentMethod.cod
        ncnd_amount = f"{float(order.total_amount):.2f}" if is_cod else "0.00"
        
        payload = {
            "ToCompany": customer_name,
            "ToAddress": street_address,
            "ToCity": city,
            "ToLocation": location,
            "ToCountry": "United Arab Emirates",
            "ToCperson": customer_name,
            "ToContactno": phone,
            "ToMobileno": phone,
            "ReferenceNumber": order.order_number,
            "CompanyCode": settings.DELIVERY_PANDA_COMPANY_CODE,
            "Weight": "0.5",
            "Pieces": pieces_str,
            "PackageType": "Domestic Parcel",
            "CurrencyCode": "AED",
            "NcndAmount": ncnd_amount,
            "ItemDescription": items_desc,
            "SpecialInstruction": "Handle with care - Luxury Glass Fragrance Bottles",
            "BranchName": settings.DELIVERY_PANDA_BRANCH
        }
        
        headers = {
            "Content-Type": "application/json",
            "API-KEY": api_key
        }
        
        logger.info(f"Dispatching Order {order.order_number} to Delivery Panda: {payload}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint_url, json=payload, headers=headers)
            
        if resp.status_code != 200:
            logger.error(f"Delivery Panda API HTTP error {resp.status_code}: {resp.text}")
            return {
                "success": False,
                "error": f"Delivery Panda API returned HTTP {resp.status_code}: {resp.text}"
            }
            
        res_json = resp.json()
        logger.info(f"Delivery Panda API response for Order {order.order_number}: {res_json}")
        
        if res_json.get("success") == 1 or res_json.get("success") is True:
            awb_number = str(res_json.get("AwbNumber", ""))
            awb_pdf = res_json.get("AwbPdf", "")
            return {
                "success": True,
                "awb_number": awb_number,
                "awb_pdf": awb_pdf,
                "message": res_json.get("message", "Success")
            }
        else:
            msg = res_json.get("message") or "Failed to create consignment with Delivery Panda"
            return {
                "success": False,
                "error": msg
            }

    except Exception as e:
        logger.exception(f"Unexpected error during Delivery Panda dispatch: {e}")
        return {
            "success": False,
            "error": str(e)
        }
