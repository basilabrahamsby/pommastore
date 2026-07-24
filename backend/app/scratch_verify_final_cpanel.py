import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_order_confirmation_email
from app.core.config import settings

print("LIVE SMTP CONFIGURATION:")
print("HOST:", settings.SMTP_HOST)
print("PORT:", settings.SMTP_PORT)
print("USER:", settings.SMTP_USER)
print("FROM:", settings.SMTP_FROM_EMAIL)
print("SSL:", settings.SMTP_SSL)

res = send_order_confirmation_email(
    to_email="sales@poshgallery.ae",
    customer_name="Pommastore VIP Client",
    order_number="PS-2026-LIVE",
    items=[
        {
            "product_name": "Mystic Ocean Luxury Eau de Parfum 100ml",
            "variant_sku": "0028",
            "quantity": 1,
            "unit_price": 350.00,
            "total_price": 350.00
        }
    ],
    total=350.00,
    subtotal=350.00,
    discount=0.0,
    shipping=0.0,
    tax=0.0,
    loyalty_used=0,
    shipping_address={
        "first_name": "Pommastore",
        "last_name": "Client",
        "address_line1": "Sheikh Zayed Road",
        "city": "Dubai",
        "state": "Dubai",
        "country": "UAE",
        "postal_code": "00000"
    },
    payment_method="CARD",
    customer_email="sales@poshgallery.ae",
    customer_phone="971501234567"
)

print("\n----------------------------------------")
print("ORDER CONFIRMATION & TAX INVOICE DISPATCH RESULT:", res)
print("----------------------------------------")
