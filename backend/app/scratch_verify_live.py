import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_order_confirmation_email

print("Testing send_order_confirmation_email...")

res = send_order_confirmation_email(
    to_email="sales@poshgallery.ae",
    customer_name="Test Customer",
    order_number="PS-TEST-101",
    items=[
        {
            "product_name": "Mystic Ocean Perfume 100ml",
            "variant_sku": "0028",
            "quantity": 1,
            "unit_price": 250.00,
            "total_price": 250.00
        }
    ],
    total=250.00,
    subtotal=250.00,
    discount=0.0,
    shipping=0.0,
    tax=0.0,
    loyalty_used=0,
    shipping_address={
        "first_name": "Test",
        "last_name": "Customer",
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
print("ORDER CONFIRMATION & INVOICE DISPATCH RESULT:", res)
print("----------------------------------------")
