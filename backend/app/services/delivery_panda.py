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
        try:
            items_list = getattr(order, "items", []) or []
            for item in items_list:
                total_pieces += getattr(item, "quantity", 1)
                variant = getattr(item, "variant", None)
                product = getattr(variant, "product", None) if variant else None
                p_name = getattr(product, "name", None) if product else None
                if p_name:
                    item_names.append(f"{p_name} ({getattr(item, 'quantity', 1)}x)")
                else:
                    item_names.append(f"Perfume ({getattr(item, 'quantity', 1)}x)")
        except Exception as err:
            logger.warning(f"Could not read order items for delivery panda description: {err}")
        
        pieces_str = str(max(1, total_pieces))
        items_desc = ", ".join(item_names)[:250] if item_names else "Luxury Perfume / Fragrance"
        
        # Cash on Delivery Amount (NcndAmount)
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


def generate_delivery_panda_label_html(order: Order) -> str:
    """Generate a high-resolution, printable Delivery Panda UAE shipping label in HTML."""
    awb = order.tracking_number or (order.payment_details or {}).get("awb_number") or "DD317670"
    addr = order.shipping_address or {}
    customer_name = order.customer_name or addr.get("full_name") or "Valued Customer"
    phone = order.customer_phone or addr.get("phone") or "N/A"
    
    line1 = addr.get("address_line1") or addr.get("street") or ""
    line2 = addr.get("address_line2") or ""
    full_street = f"{line1}, {line2}".strip(", ") if line2 else line1
    city = addr.get("city") or addr.get("state") or "Dubai"
    
    is_cod = (order.payment_method == PaymentMethod.cod)
    payment_badge = f"CASH ON DELIVERY (AED {float(order.total_amount):.2f})" if is_cod else "PRE-PAID (ONLINE)"
    
    # Items summary
    items = getattr(order, "items", []) or []
    item_rows = ""
    for item in items:
        p_name = getattr(getattr(item, "variant", None), "product", None)
        name_str = getattr(p_name, "name", "Luxury Fragrance") if p_name else "Luxury Fragrance"
        qty = getattr(item, "quantity", 1)
        price = float(getattr(item, "unit_price", 0))
        item_rows += f"""
        <tr>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: left;">{name_str} (x{qty})</td>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">AED {price:.2f}</td>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">AED {(price * qty):.2f}</td>
        </tr>
        """
    if not item_rows:
        item_rows = f"""
        <tr>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: left;">Luxury Perfumes & Fragrances</td>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">AED {float(order.total_amount):.2f}</td>
            <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">AED {float(order.total_amount):.2f}</td>
        </tr>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delivery Panda Shipping Label - {awb}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        body {{
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: #f4f4f6;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }}
        .label-card {{
            width: 420px;
            background: #fff;
            border: 2px solid #000;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
            box-sizing: border-box;
        }}
        .header {{
            background: #111;
            color: #fff;
            padding: 14px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .header-title {{
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #FF5722;
        }}
        .header-sub {{
            font-size: 10px;
            color: #aaa;
            text-transform: uppercase;
        }}
        .barcode-sec {{
            text-align: center;
            padding: 16px 12px;
            border-bottom: 2px solid #000;
            background: #fafafa;
        }}
        .awb-text {{
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 2px;
            margin-top: 4px;
        }}
        .badge-sec {{
            background: {"#FFF3E0" if is_cod else "#E8F5E9"};
            color: {"#E65100" if is_cod else "#2E7D32"};
            border-bottom: 2px solid #000;
            padding: 10px 16px;
            font-weight: 800;
            font-size: 13px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .details-grid {{
            padding: 16px;
            font-size: 12px;
            line-height: 1.5;
            border-bottom: 2px solid #000;
        }}
        .section-label {{
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            color: #777;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }}
        .table-sec {{
            padding: 12px 16px;
            font-size: 11px;
        }}
        .footer-sec {{
            background: #f9f9f9;
            border-top: 1px solid #ddd;
            padding: 10px 16px;
            font-size: 9px;
            color: #666;
            text-align: center;
        }}
        .print-btn {{
            margin-top: 20px;
            background: #000;
            color: #fff;
            border: none;
            padding: 12px 28px;
            font-weight: bold;
            font-size: 13px;
            border-radius: 6px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .print-btn:hover {{
            background: #FF5722;
        }}
        @media print {{
            body {{ background: none; padding: 0; }}
            .print-btn {{ display: none; }}
            .label-card {{ border: 2px solid #000; box-shadow: none; width: 100%; max-width: 420px; }}
        }}
    </style>
</head>
<body>

    <div class="label-card">
        <div class="header">
            <div>
                <div class="header-title">🐼 DELIVERY PANDA</div>
                <div class="header-sub">UAE Domestic Express Logistics</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #fff;">
                <strong>POSH NICHE</strong><br>Dubai, UAE
            </div>
        </div>

        <div class="barcode-sec">
            <svg id="barcode"></svg>
            <div class="awb-text">AWB: {awb}</div>
        </div>

        <div class="badge-sec">
            {payment_badge}
        </div>

        <div class="details-grid">
            <div class="section-label">SHIP TO (CONSIGNEE):</div>
            <div style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 4px;">{customer_name}</div>
            <div>{full_street}</div>
            <div style="font-weight: 700; color: #000; margin-top: 2px;">{city}, United Arab Emirates</div>
            <div style="margin-top: 6px; font-family: monospace; font-weight: 700;">📞 {phone}</div>
        </div>

        <div class="details-grid" style="background: #fafafa;">
            <div class="section-label">SHIPPER (CONSIGNOR):</div>
            <div style="font-weight: 700; color: #000;">POSH NICHE PERFUMES & COSMETICS TRADING CO. L.L.C</div>
            <div>Branch: Dubai Warehouse, United Arab Emirates</div>
            <div>Ref Order #: <strong>{order.order_number}</strong></div>
        </div>

        <div class="table-sec">
            <div class="section-label" style="margin-bottom: 6px;">MANIFEST DETAILS:</div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #eee; font-size: 9px; text-transform: uppercase;">
                        <th style="padding: 4px 6px; text-align: left;">Item Description</th>
                        <th style="padding: 4px 6px; text-align: right;">Unit</th>
                        <th style="padding: 4px 6px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {item_rows}
                    <tr style="font-weight: 800;">
                        <td style="padding: 8px 6px; text-align: left;">GRAND TOTAL</td>
                        <td></td>
                        <td style="padding: 8px 6px; text-align: right;">AED {float(order.total_amount):.2f}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer-sec">
            Handle with Care — Fragile Glass Fragrance Bottles.<br>
            Powered by Delivery Panda UAE Express Logistics API.
        </div>
    </div>

    <button class="print-btn" onclick="window.print()">🖨️ PRINT SHIPPING LABEL</button>

    <script>
        JsBarcode("#barcode", "{awb}", {{
            format: "CODE128",
            width: 2,
            height: 55,
            displayValue: false
        }});
    </script>
</body>
</html>
"""
