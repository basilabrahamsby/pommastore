import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import generate_invoice_pdf, InvoiceOrderWrapper, generate_invoice_html

# Mock order data
order_data = {
    "order_number": "POMMA-TEST-999",
    "created_at": datetime.now(),
    "payment_method": "COD",
    "payment_status": "PENDING",
    "shipping_address": {
        "address_line1": "Test St",
        "city": "Dubai",
        "state": "Dubai"
    },
    "customer_name": "Test Customer",
    "customer_phone": "+971501234567",
    "customer_email": "test@example.com",
    "discount_amount": 0,
    "shipping_amount": 0,
    "tax_amount": 5,
    "subtotal": 100,
    "total_amount": 105
}

items = [
    {
        "product_name": "RIDER",
        "sku": "N/A",
        "size": "100 ml",
        "quantity": 1,
        "price": 100,
        "total": 100
    }
]

wrapper = InvoiceOrderWrapper(order_data, items)

# 1. Check HTML Invoice
html = generate_invoice_html(wrapper)
print("=== HTML INVOICE CHECK ===")
assert "POSH NICHE PERFUMES & COSMETICS TRADING LLC" in html
assert "Al Muteena, Dubai" in html
assert "Kerala" not in html
print("✓ HTML Invoice Verified Clean!")

# 2. Check PDF Invoice
import reportlab.rl_config
reportlab.rl_config.pageCompression = 0

pdf_buffer = generate_invoice_pdf(wrapper)
pdf_bytes = pdf_buffer.getvalue()
pdf_text = pdf_bytes.decode('latin-1', errors='ignore')

print("UNCOMPRESSED PDF TEXT SAMPLE:")
print(pdf_text[500:2000])

print("=== PDF INVOICE CHECK ===")
assert "POSH NICHE PERFUMES" in pdf_text
assert "Al Muteena" in pdf_text or "Dubai" in pdf_text
assert "104349616300003" in pdf_text
assert "Elamakkara" not in pdf_text
assert "Kerala" not in pdf_text
print("✓ PDF Invoice Plain Text Verified 100% Clean!")
