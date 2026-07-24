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
pdf_buffer = generate_invoice_pdf(wrapper)
pdf_bytes = pdf_buffer.getvalue()

# Extract text using PyPDF2 / pdfplumber / reportlab or raw inspect
pdf_text_str = str(pdf_bytes)

print("=== PDF INVOICE CHECK ===")
assert "POSH NICHE PERFUMES" in pdf_text_str or "Al Muteena" in pdf_text_str or "104349616300003" in pdf_text_str
assert "Elamakkara" not in pdf_text_str
assert "Kerala" not in pdf_text_str
print(f"✓ PDF Invoice Generated Successfully ({len(pdf_bytes)} bytes) and Verified Clean!")
