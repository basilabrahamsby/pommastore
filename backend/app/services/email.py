import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict, Any, Optional
from app.core.config import settings

# ─────────────────────────────────────────────────────────────────────────────
# Core SMTP Dispatcher
# ─────────────────────────────────────────────────────────────────────────────

def send_smtp_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: str = None,
    attachment_bytes: Optional[bytes] = None,
    attachment_filename: Optional[str] = None
) -> bool:
    """Sends an email using standard SMTP configurations in settings, with optional file attachment."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print("SMTP settings are not configured. Skipping email transmission.")
        return False

    msg = MIMEMultipart('mixed')
    msg['Subject'] = subject
    msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email

    # Alternative section for text vs html bodies
    alt_part = MIMEMultipart('alternative')
    if body_text:
        alt_part.attach(MIMEText(body_text, 'plain', 'utf-8'))
    alt_part.attach(MIMEText(body_html, 'html', 'utf-8'))
    msg.attach(alt_part)

    # File attachment
    if attachment_bytes and attachment_filename:
        from email.mime.application import MIMEApplication
        part = MIMEApplication(attachment_bytes, Name=attachment_filename)
        part['Content-Disposition'] = f'attachment; filename="{attachment_filename}"'
        msg.attach(part)

    try:
        if settings.SMTP_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)

        if settings.SMTP_TLS:
            server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(settings.SMTP_FROM_EMAIL or settings.SMTP_USER, to_email, msg.as_string())
        server.quit()
        print(f"[EMAIL] ✓ Sent to {to_email} — {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] ✗ Failed to {to_email}: {str(e)}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Shared HTML Template Builder
# ─────────────────────────────────────────────────────────────────────────────

def _base_template(title_line: str, tagline: str, content_html: str, cta_url: str = "", cta_label: str = "") -> str:
    cta_block = ""
    if cta_url and cta_label:
        cta_block = f"""
        <div style="text-align:center; margin: 30px 0 10px;">
          <a href="{cta_url}" target="_blank"
             style="display:inline-block; padding:13px 36px; background:#0A0A0A; color:#FFFFFF;
                    font-family:'Montserrat','Helvetica Neue',Arial,sans-serif; font-size:11px;
                    font-weight:700; letter-spacing:0.25em; text-transform:uppercase;
                    text-decoration:none; border-radius:2px;">
            {cta_label}
          </a>
        </div>"""

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title_line}</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF8F5">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#FFFFFF;border:1px solid #EAE6DF;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.05);">

        <!-- Header -->
        <tr>
          <td bgcolor="#FFFFFF" style="padding:28px 20px;text-align:center;border-bottom:1px solid #EAE6DF;">
            <img src="https://kozmocart.com/logo.png" alt="KOZMOCART" style="height:42px;display:block;margin:0 auto;border:0;" />
            <p style="margin:6px 0 0;color:#D2168D;font-size:8px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;">{tagline}</p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 48px 30px;">
            {content_html}
            {cta_block}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td bgcolor="#FAF8F5" style="padding:24px 20px;text-align:center;border-top:1px solid #EAE6DF;">
            <p style="margin:0;font-size:9px;color:#999999;letter-spacing:0.18em;text-transform:uppercase;line-height:1.8;">
              © 2026 Kozmocart Luxury Fragrances &nbsp;|&nbsp; info@kozmocart.com<br>
              You are receiving this because you placed an order on Kozmocart.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _order_items_table(items: List[Dict[str, Any]]) -> str:
    """Renders order items as a formatted HTML table."""
    rows = ""
    for item in items:
        name = item.get("product_name", "Product")
        size = f" — {item['size_ml']}ml" if item.get("size_ml") else ""
        qty = item.get("quantity", 1)
        price = item.get("total_price", 0)
        rows += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:13px;color:#1A1A1A;font-weight:600;">{name}{size}</td>
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:13px;color:#666666;text-align:center;">×{qty}</td>
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:13px;color:#1A1A1A;text-align:right;font-weight:700;">₹{float(price):,.2f}</td>
        </tr>"""

    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <th style="padding:8px 0;font-size:9px;color:#888888;letter-spacing:0.15em;text-transform:uppercase;text-align:left;border-bottom:2px solid #EAE6DF;font-weight:700;">Item</th>
        <th style="padding:8px 0;font-size:9px;color:#888888;letter-spacing:0.15em;text-transform:uppercase;text-align:center;border-bottom:2px solid #EAE6DF;font-weight:700;">Qty</th>
        <th style="padding:8px 0;font-size:9px;color:#888888;letter-spacing:0.15em;text-transform:uppercase;text-align:right;border-bottom:2px solid #EAE6DF;font-weight:700;">Total</th>
      </tr>
      {rows}
    </table>"""


def _order_summary_block(order_number: str, total: float, subtotal: float,
                          discount: float, shipping: float, tax: float, loyalty_used: int) -> str:
    discount_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Discount</td><td style="font-size:12px;color:#D2168D;text-align:right;padding:4px 0;">−₹{discount:,.2f}</td></tr>' if discount > 0 else ""
    loyalty_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Loyalty Points Used</td><td style="font-size:12px;color:#D2168D;text-align:right;padding:4px 0;">−₹{float(loyalty_used):,.2f}</td></tr>' if loyalty_used > 0 else ""
    shipping_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Shipping</td><td style="font-size:12px;color:#1A1A1A;text-align:right;padding:4px 0;">₹{shipping:,.2f}</td></tr>' if shipping > 0 else ""
    tax_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Tax</td><td style="font-size:12px;color:#1A1A1A;text-align:right;padding:4px 0;">₹{tax:,.2f}</td></tr>' if tax > 0 else ""

    return f"""
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 10px;font-size:9px;color:#888;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Order Summary — {order_number}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:12px;color:#666;padding:4px 0;">Subtotal</td><td style="font-size:12px;color:#1A1A1A;text-align:right;padding:4px 0;">₹{subtotal:,.2f}</td></tr>
        {discount_row}
        {loyalty_row}
        {shipping_row}
        {tax_row}
        <tr><td colspan="2" style="padding:6px 0;border-top:1px solid #E0D9CF;"></td></tr>
        <tr>
          <td style="font-size:14px;color:#0A0A0A;font-weight:800;padding:4px 0;">Total</td>
          <td style="font-size:16px;color:#0A0A0A;font-weight:800;text-align:right;padding:4px 0;">₹{total:,.2f}</td>
        </tr>
      </table>
    </div>"""


def _address_block(address: Optional[Dict[str, Any]]) -> str:
    if not address:
        return ""
    parts = [
        address.get("address_line1", ""),
        address.get("address_line2", ""),
        address.get("city", ""),
        address.get("state", ""),
        address.get("pincode", ""),
        address.get("country", "India"),
    ]
    addr_str = ", ".join(p for p in parts if p)
    return f"""
    <div style="margin:12px 0;">
      <p style="margin:0 0 4px;font-size:9px;color:#888;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Delivery Address</p>
      <p style="margin:0;font-size:13px;color:#444;line-height:1.6;">{addr_str}</p>
    </div>"""


# ─────────────────────────────────────────────────────────────────────────────
# 1. OTP / Login Verification
# ─────────────────────────────────────────────────────────────────────────────

def send_otp_email(to_email: str, otp_code: str) -> bool:
    subject = f"{otp_code} is your Kozmocart Access Code"
    body_text = f"Your verification code is {otp_code}. This code is valid for 5 minutes."

    content = f"""
    <div style="text-align:center;">
      <p style="margin:0 0 6px;font-size:9px;font-weight:800;letter-spacing:0.25em;color:#D2168D;text-transform:uppercase;">Secure Identity Verification</p>
      <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:24px;font-style:italic;color:#1A1A1A;line-height:1.3;">Access the Inner Circle.</h2>
      <div style="width:40px;height:1px;background:#E2D9C8;margin:0 auto 20px;"></div>
      <p style="margin:0 0 28px;font-size:13px;color:#555;line-height:1.7;max-width:380px;margin-left:auto;margin-right:auto;">
        Use the secure verification code below to authorize your session on Kozmocart. This code is valid for <strong>5 minutes</strong>.
      </p>
      <div style="display:inline-block;background:#FAF8F5;border:1px dashed #E2D9C8;border-radius:4px;padding:20px 40px;margin-bottom:28px;">
        <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:0.3em;color:#0A0A0A;padding-left:0.3em;">{otp_code}</p>
      </div>
      <p style="margin:0;font-size:11px;color:#888;line-height:1.6;">
        If you did not request this authorization, you can safely ignore this email.
      </p>
    </div>"""

    html = _base_template("Access the Inner Circle", "Secure Identity Verification", content)
    return send_smtp_email(to_email, subject, html, body_text)


def generate_invoice_html(order, company_details: Optional[Dict[str, Any]] = None) -> str:
    """Generates a beautiful printable tax invoice HTML for an order."""
    if not company_details:
        company_details = {
            "companyName": "Kozmocart Luxury Innovations Pvt Ltd",
            "registeredAddress": "Registered Corporate Office, New Delhi, India",
            "gstin": "N/A",
            "pan": "N/A",
            "stateCode": "07 (Delhi)"
        }

    company_name = company_details.get("companyName", "Kozmocart Luxury Innovations Pvt Ltd")
    company_address = company_details.get("registeredAddress", "Registered Corporate Office, New Delhi, India")
    gstin = company_details.get("gstin", "")
    pan = company_details.get("pan", "")
    state_code = company_details.get("stateCode", "")

    gstin_line = f'<p style="margin:2px 0 0;"><strong>GSTIN:</strong> {gstin}</p>' if gstin else ""
    pan_line = f'<p style="margin:2px 0 0;"><strong>PAN:</strong> {pan}</p>' if pan else ""
    state_line = f'<p style="margin:2px 0 0;"><strong>State Code:</strong> {state_code}</p>' if state_code else ""

    date_str = order.created_at.strftime("%d/%m/%Y, %H:%M") if order.created_at else "N/A"
    payment_method = (order.payment_method.value if hasattr(order.payment_method, 'value') else str(order.payment_method)).upper() if order.payment_method else "N/A"
    payment_status = (order.payment_status.value if hasattr(order.payment_status, 'value') else str(order.payment_status)).upper() if order.payment_status else "PENDING"

    # Address block formatting
    shipping_address_str = "No shipping details"
    if order.shipping_address:
        sa = order.shipping_address
        if isinstance(sa, dict):
            shipping_address_str = sa.get("full_address") or f"{sa.get('address_line1') or ''}, {sa.get('address_line2') or ''}, {sa.get('city') or ''}, {sa.get('state') or ''} - {sa.get('pincode') or ''}"
        else:
            shipping_address_str = str(sa)

    items_rows = ""
    for item in order.items:
        prod_desc = f'<div style="font-weight:700;font-size:13px;margin-bottom:2px;">{item.product_name or "Product SKU"}</div>'
        if item.sku:
            prod_desc += f'<div style="font-size:10px;color:#888;font-family:monospace;">SKU: {item.sku}</div>'
        if item.size_ml:
            prod_desc += f'<div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Size: {item.size_ml} ml</div>'
            
        unit_price = float(item.unit_price)
        total_price = unit_price * item.quantity
        items_rows += f"""
        <tr>
          <td>{prod_desc}</td>
          <td style="text-align: center;font-weight:600;">{item.quantity}</td>
          <td style="text-align: right;">₹{unit_price:,.2f}</td>
          <td style="text-align: right;font-weight:700;">₹{total_price:,.2f}</td>
        </tr>
        """

    discount = float(order.discount_amount or 0)
    shipping = float(order.shipping_amount or 0)
    tax = float(order.tax_amount or 0)
    subtotal = float(order.subtotal or 0)
    total = float(order.total_amount or 0)

    discount_row = f'<tr><td>Discount</td><td style="text-align: right;color:#E11D48;">-₹{discount:,.2f}</td></tr>' if discount > 0 else ""
    shipping_row = f'<tr><td>Logistics (Standard)</td><td style="text-align: right;">{"FREE" if shipping == 0 else f"₹{shipping:,.2f}"}</td></tr>'
    tax_row = f'<tr><td>Statutory Taxes (GST)</td><td style="text-align: right;">₹{tax:,.2f}</td></tr>' if tax > 0 else ""

    subtotal_str = f"{subtotal:,.2f}"
    total_str = f"{total:,.2f}"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice — {order.order_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
      background: #FAF8F5;
      color: #1A1A1A;
      margin: 0;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }}
    .invoice-container {{
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #EAE6DF;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.04);
      padding: 48px;
      box-sizing: border-box;
    }}
    .invoice-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0A0A0A;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }}
    .logo-container img {{
      height: 48px;
      display: block;
    }}
    .invoice-title {{
      text-align: right;
    }}
    .invoice-title h1 {{
      margin: 0;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }}
    .invoice-title p {{
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 700;
      color: #D2168D;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }}
    .details-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
      font-size: 12px;
      line-height: 1.6;
    }}
    .details-col h3 {{
      margin: 0 0 8px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #888888;
      text-transform: uppercase;
      border-bottom: 1px solid #EAE6DF;
      padding-bottom: 4px;
    }}
    .details-col p {{
      margin: 0;
    }}
    .invoice-meta {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      background: #FAF8F5;
      border: 1px solid #EAE6DF;
      border-radius: 3px;
      padding: 16px;
      margin-bottom: 30px;
      font-size: 11px;
    }}
    .meta-item span {{
      display: block;
      color: #888888;
      text-transform: uppercase;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.15em;
      margin-bottom: 2px;
    }}
    .meta-item strong {{
      color: #1A1A1A;
      font-weight: 700;
    }}
    .items-table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }}
    .items-table th {{
      background: #0A0A0A;
      color: #FFFFFF;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.15em;
      padding: 12px 16px;
      text-align: left;
    }}
    .items-table td {{
      padding: 16px;
      border-bottom: 1px solid #EAE6DF;
    }}
    .items-table tr:nth-child(even) {{
      background: #FAF8F5;
    }}
    .summary-section {{
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }}
    .summary-table {{
      width: 300px;
      font-size: 12px;
      line-height: 2;
    }}
    .summary-table td {{
      padding: 2px 0;
    }}
    .summary-table tr.grand-total td {{
      border-top: 1px solid #0A0A0A;
      font-size: 15px;
      font-weight: 800;
      color: #D2168D;
      padding-top: 8px;
    }}
    .invoice-footer {{
      border-top: 1px solid #EAE6DF;
      padding-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #888888;
      letter-spacing: 0.05em;
      line-height: 1.6;
    }}
    .print-actions {{
      max-width: 800px;
      margin: 0 auto 20px;
      display: flex;
      justify-content: flex-end;
    }}
    @media print {{
      body {{
        background: #FFFFFF;
        padding: 0;
      }}
      .invoice-container {{
        border: none;
        box-shadow: none;
        padding: 0;
      }}
      .print-actions {{
        display: none;
      }}
    }}
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()" style="padding: 10px 24px; background: #0A0A0A; color: #FFFFFF; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; border: none; border-radius: 2px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
      Print / Download PDF
    </button>
  </div>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="logo-container">
        <img src="https://kozmocart.com/logo.png" alt="Kozmocart Logo">
      </div>
      <div class="invoice-title">
        <h1>TAX INVOICE</h1>
        <p>Invoice Copy</p>
      </div>
    </div>
    
    <div class="invoice-meta">
      <div class="meta-item">
        <span>Invoice Number</span>
        <strong>{order.order_number}</strong>
      </div>
      <div class="meta-item">
        <span>Date Issued</span>
        <strong>{date_str}</strong>
      </div>
      <div class="meta-item">
        <span>Payment Method</span>
        <strong>{payment_method}</strong>
      </div>
      <div class="meta-item">
        <span>Payment Status</span>
        <strong>{payment_status}</strong>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-col">
        <h3>Sold By (Seller)</h3>
        <p style="font-weight:700;font-size:13px;margin-bottom:4px;">{company_name}</p>
        <p>{company_address}</p>
        {gstin_line}
        {pan_line}
        {state_line}
      </div>
      <div class="details-col">
        <h3>Shipping Destination (Buyer)</h3>
        <p style="font-weight:700;font-size:13px;margin-bottom:4px;">{order.customer_name}</p>
        <p>{shipping_address_str}</p>
        <p style="margin-top:6px;"><strong>Phone:</strong> {order.customer_phone or 'N/A'}</p>
        <p><strong>Email:</strong> {order.customer_email or 'N/A'}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th width="50%">Product Description</th>
          <th width="15%" style="text-align: center;">Qty</th>
          <th width="15%" style="text-align: right;">Unit Price</th>
          <th width="20%" style="text-align: right;">Total Price</th>
        </tr>
      </thead>
      <tbody>
        {items_rows}
      </tbody>
    </table>

    <div class="summary-section">
      <table class="summary-table">
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right;">₹{subtotal_str}</td>
        </tr>
        {discount_row}
        {shipping_row}
        {tax_row}
        <tr class="grand-total">
          <td>Grand Total</td>
          <td style="text-align: right;">₹{total_str}</td>
        </tr>
      </table>
    </div>

    <div class="invoice-footer">
      <p style="margin: 0 0 6px; font-weight: 700; text-transform: uppercase; color: #1A1A1A;">Thank you for your purchase with Kozmocart</p>
      <p style="margin: 0;">This is a computer-generated statutory tax invoice record. No signature is required.</p>
    </div>
  </div>
</body>
</html>
"""


def generate_invoice_pdf(order, company_details: Optional[Dict[str, Any]] = None):
    """Generates a beautiful printable tax invoice PDF for an order."""
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch

    if not company_details:
        company_details = {
            "companyName": "Kozmocart Luxury Innovations Pvt Ltd",
            "registeredAddress": "Registered Corporate Office, New Delhi, India",
            "gstin": "07AAAAA0000A1Z1",
            "pan": "N/A",
            "stateCode": "07 (Delhi)"
        }

    company_name = company_details.get("companyName", "Kozmocart Luxury Innovations Pvt Ltd")
    company_address = company_details.get("registeredAddress", "Registered Corporate Office, New Delhi, India")
    gstin = company_details.get("gstin", "07AAAAA0000A1Z1")
    pan = company_details.get("pan", "N/A")
    state_code = company_details.get("stateCode", "07 (Delhi)")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#000000')
    )

    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#D2168D'),
        alignment=2
    )

    h3_style = ParagraphStyle(
        'H3Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#888888')
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#333333')
    )

    bold_body_style = ParagraphStyle(
        'BoldBodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#000000')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#FFFFFF')
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#333333')
    )

    table_cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#000000')
    )

    story = []

    subtitle_para = Paragraph("Invoice Copy", subtitle_style)
    header_data = [
        [Paragraph("KOZMOCART", title_style), subtitle_para]
    ]
    header_table = Table(header_data, colWidths=[4*inch, 3.27*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    meta_data = [
        [
            Paragraph("INVOICE NUMBER<br/><b>" + order.order_number + "</b>", body_style),
            Paragraph("DATE ISSUED<br/><b>" + (order.created_at.strftime("%d/%m/%Y") if order.created_at else "N/A") + "</b>", body_style),
            Paragraph("PAYMENT METHOD<br/><b>" + ((order.payment_method.value if hasattr(order.payment_method, 'value') else str(order.payment_method)).upper() if order.payment_method else "N/A") + "</b>", body_style),
            Paragraph("PAYMENT STATUS<br/><b>" + ((order.payment_status.value if hasattr(order.payment_status, 'value') else str(order.payment_status)).upper() if order.payment_status else "PENDING") + "</b>", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[1.8*inch, 1.8*inch, 1.8*inch, 1.87*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAF8F5')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#EAE6DF')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EAE6DF')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    seller_details = f"<b>{company_name}</b><br/>"
    seller_details += f"{company_address}<br/>"
    if gstin:
        seller_details += f"GSTIN: {gstin}<br/>"
    if pan:
        seller_details += f"PAN: {pan}<br/>"
    if state_code:
        seller_details += f"State Code: {state_code}"

    shipping_address_str = "No shipping details"
    if order.shipping_address:
        sa = order.shipping_address
        if isinstance(sa, dict):
            shipping_address_str = sa.get("full_address") or f"{sa.get('address_line1') or ''}, {sa.get('city') or ''} - {sa.get('pincode') or ''}"
        else:
            shipping_address_str = str(sa)

    buyer_details = f"<b>{order.customer_name}</b><br/>"
    buyer_details += f"{shipping_address_str}<br/>"
    buyer_details += f"Phone: {order.customer_phone or 'N/A'}<br/>"
    buyer_details += f"Email: {order.customer_email or 'N/A'}"

    details_data = [
        [Paragraph("SOLD BY (SELLER)", h3_style), Paragraph("SHIPPING DESTINATION (BUYER)", h3_style)],
        [Paragraph(seller_details, body_style), Paragraph(buyer_details, body_style)]
    ]
    details_table = Table(details_data, colWidths=[3.6*inch, 3.67*inch])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,1), (-1,1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 25))

    table_data = [
        [
            Paragraph("PRODUCT DESCRIPTION", table_header_style),
            Paragraph("QTY", table_header_style),
            Paragraph("UNIT PRICE", table_header_style),
            Paragraph("TOTAL PRICE", table_header_style)
        ]
    ]

    for item in order.items:
        desc = f"<b>{item.product_name or 'Product'}</b>"
        if item.sku:
            desc += f"<br/>SKU: {item.sku}"
        if item.size_ml:
            desc += f" | Size: {item.size_ml} ml"

        table_data.append([
            Paragraph(desc, table_cell_style),
            Paragraph(str(item.quantity), table_cell_style),
            Paragraph(f"INR {float(item.unit_price):,.2f}", table_cell_style),
            Paragraph(f"INR {float(item.unit_price * item.quantity):,.2f}", table_cell_bold_style)
        ])

    items_table = Table(table_data, colWidths=[4*inch, 0.8*inch, 1.2*inch, 1.27*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#000000')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EAE6DF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#EAE6DF')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    summary_data = [
        [Paragraph("Subtotal", body_style), Paragraph(f"INR {float(order.subtotal):,.2f}", body_style)],
    ]
    if order.discount_amount and float(order.discount_amount) > 0:
        summary_data.append([Paragraph("Discount", body_style), Paragraph(f"-INR {float(order.discount_amount):,.2f}", body_style)])
    if order.shipping_amount and float(order.shipping_amount) > 0:
        summary_data.append([Paragraph("Shipping", body_style), Paragraph(f"INR {float(order.shipping_amount):,.2f}", body_style)])
    if order.tax_amount and float(order.tax_amount) > 0:
        summary_data.append([Paragraph("Tax (GST)", body_style), Paragraph(f"INR {float(order.tax_amount):,.2f}", body_style)])

    summary_data.append([
        Paragraph("<b>GRAND TOTAL</b>", bold_body_style),
        Paragraph(f"<b>INR {float(order.total_amount):,.2f}</b>", ParagraphStyle('TotalVal', parent=bold_body_style, textColor=colors.HexColor('#D2168D'), alignment=2))
    ])

    summary_table = Table(summary_data, colWidths=[2.2*inch, 1.27*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,-1), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))

    outer_table_data = [
        ["", summary_table]
    ]
    outer_table = Table(outer_table_data, colWidths=[3.8*inch, 3.47*inch])
    outer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(outer_table)
    story.append(Spacer(1, 30))

    footer_text = "<para align=center>Thank you for shopping with Kozmocart Luxury Fragrances<br/><font size=7 color='#888888'>This is a computer generated statutory tax invoice record. No signature is required.</font></para>"
    story.append(Paragraph(footer_text, ParagraphStyle('FooterStyle', parent=body_style, alignment=1)))

    doc.build(story)
    buffer.seek(0)
    return buffer


class InvoiceOrderWrapper:
    def __init__(self, data: Dict[str, Any], items: List[Dict[str, Any]]):
        self.order_number = data.get("order_number")
        self.created_at = data.get("created_at") or datetime.now()
        self.payment_method = data.get("payment_method") or "COD"
        self.payment_status = data.get("payment_status") or "PENDING"
        self.shipping_address = data.get("shipping_address")
        self.customer_name = data.get("customer_name") or "Customer"
        self.customer_phone = data.get("customer_phone")
        self.customer_email = data.get("customer_email")
        self.discount_amount = data.get("discount_amount") or 0.0
        self.shipping_amount = data.get("shipping_amount") or 0.0
        self.tax_amount = data.get("tax_amount") or 0.0
        self.subtotal = data.get("subtotal") or 0.0
        self.total_amount = data.get("total_amount") or 0.0
        self.items = [InvoiceOrderItemWrapper(i) for i in items]

class InvoiceOrderItemWrapper:
    def __init__(self, data: Dict[str, Any]):
        self.product_name = data.get("product_name") or data.get("name") or "Product"
        self.sku = data.get("sku") or "N/A"
        self.size_ml = data.get("size_ml") or data.get("sizeMl")
        self.quantity = data.get("quantity") or 1
        self.unit_price = data.get("unit_price") or data.get("price") or 0.0
        self.total_price = self.unit_price * self.quantity


# ─────────────────────────────────────────────────────────────────────────────
# 2. Order Placed Confirmation
# ─────────────────────────────────────────────────────────────────────────────

def send_admin_invoice_email(
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    order_number: str,
    items: List[Dict[str, Any]],
    total: float,
    subtotal: float,
    discount: float,
    shipping: float,
    tax: float,
    loyalty_used: int,
    shipping_address: Optional[Dict[str, Any]] = None,
    payment_method: str = "",
    coupon_code: str = "",
    gift_message: str = "",
) -> bool:
    subject = f"[INVOICE/ORDER] {order_number} - New Order Details"
    body_text = f"New Order Details for {order_number}. Customer: {customer_name}. Total: ₹{total:,.2f}"

    coupon_row = f'<p style="margin:8px 0 0;font-size:12px;color:#666;">Coupon Applied: <strong style="color:#D2168D;">{coupon_code}</strong></p>' if coupon_code else ""
    gift_row = f'<div style="margin:12px 0;padding:12px 16px;background:#FFF5F9;border-left:3px solid #D2168D;border-radius:2px;"><p style="margin:0;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#D2168D;font-weight:700;margin-bottom:4px;">Gift Message</p><p style="margin:0;font-size:13px;color:#444;font-style:italic;">"{gift_message}"</p></div>' if gift_message else ""
    payment_row = f'<p style="margin:8px 0 0;font-size:12px;color:#666;">Payment Method: <strong style="color:#1A1A1A;">{payment_method.upper()}</strong></p>' if payment_method else ""

    items_html = _order_items_table(items)
    summary_html = _order_summary_block(order_number, total, subtotal, discount, shipping, tax, loyalty_used)
    address_html = _address_block(shipping_address)

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#0A0A0A;text-transform:uppercase;">Company Order Invoice Copy</p>
    <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">New Order Received — {order_number}</h2>
    
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="top" width="50%">
            <p style="margin:0 0 4px;font-size:9px;color:#888;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Customer Details</p>
            <p style="margin:0;font-size:13px;color:#1A1A1A;font-weight:700;">{customer_name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#444;">Email: {customer_email or 'N/A'}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#444;">Phone: {customer_phone or 'N/A'}</p>
          </td>
          <td valign="top" width="50%" style="padding-left:20px;">
            <p style="margin:0 0 4px;font-size:9px;color:#888;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;">Fulfillment Details</p>
            {payment_row}
            {coupon_row}
          </td>
        </tr>
      </table>
    </div>

    {items_html}
    {summary_html}
    {address_html}
    {gift_row}
    """

    html = _base_template(f"New Order — {order_number}", "Order Management System", content)
    
    # Compile PDF attachment
    pdf_bytes = None
    try:
        order_data = {
            "order_number": order_number,
            "created_at": datetime.now(),
            "payment_method": payment_method,
            "payment_status": "PAID" if payment_method.lower() in ("card", "upi", "razorpay") else "PENDING",
            "shipping_address": shipping_address,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "customer_email": customer_email,
            "discount_amount": discount,
            "shipping_amount": shipping,
            "tax_amount": tax,
            "subtotal": subtotal,
            "total_amount": total
        }
        wrapper = InvoiceOrderWrapper(order_data, items)
        pdf_buffer = generate_invoice_pdf(wrapper)
        pdf_bytes = pdf_buffer.getvalue()
    except Exception as e:
        print(f"Failed to generate PDF for admin email: {e}")

    return send_smtp_email(
        "info@kozmocart.com", 
        subject, 
        html, 
        body_text,
        attachment_bytes=pdf_bytes,
        attachment_filename=f"invoice_{order_number}.pdf"
    )


def send_order_confirmation_email(
    to_email: Optional[str],
    customer_name: str,
    order_number: str,
    items: List[Dict[str, Any]],
    total: float,
    subtotal: float,
    discount: float,
    shipping: float,
    tax: float,
    loyalty_used: int,
    shipping_address: Optional[Dict[str, Any]] = None,
    payment_method: str = "",
    coupon_code: str = "",
    gift_message: str = "",
    customer_email: str = "",
    customer_phone: str = "",
) -> bool:
    subject = f"Your Kozmocart Order is Confirmed — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} has been confirmed. Total: ₹{total:,.2f}"

    coupon_row = f'<p style="margin:8px 0 0;font-size:12px;color:#666;">Coupon Applied: <strong style="color:#D2168D;">{coupon_code}</strong></p>' if coupon_code else ""
    gift_row = f'<div style="margin:12px 0;padding:12px 16px;background:#FFF5F9;border-left:3px solid #D2168D;border-radius:2px;"><p style="margin:0;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#D2168D;font-weight:700;margin-bottom:4px;">Gift Message</p><p style="margin:0;font-size:13px;color:#444;font-style:italic;">"{gift_message}"</p></div>' if gift_message else ""
    payment_row = f'<p style="margin:8px 0 0;font-size:12px;color:#666;">Payment Method: <strong style="color:#1A1A1A;">{payment_method.upper()}</strong></p>' if payment_method else ""

    items_html = _order_items_table(items)
    summary_html = _order_summary_block(order_number, total, subtotal, discount, shipping, tax, loyalty_used)
    address_html = _address_block(shipping_address)

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Order Confirmed</p>
    <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Thank you, {customer_name}.</h2>
    <p style="margin:0 0 24px;font-size:13px;color:#555;line-height:1.7;">
      Your order has been received and is being prepared with care. We'll notify you at every step of the journey.
    </p>
    {items_html}
    {summary_html}
    {coupon_row}
    {payment_row}
    {address_html}
    {gift_row}
    <div style="width:40px;height:1px;background:#E2D9C8;margin:24px 0;"></div>
    <p style="margin:0;font-size:11px;color:#888;line-height:1.7;">
      Track your order anytime at <a href="https://kozmocart.com/track-order" style="color:#D2168D;text-decoration:none;">kozmocart.com/track-order</a> using your order number and email.
    </p>"""

    html = _base_template(f"Order Confirmed — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://kozmocart.com/track-order",
                          cta_label="Track My Order")
    
    # Always send detailed invoice copy with full customer details to info@kozmocart.com
    send_admin_invoice_email(
        customer_name=customer_name,
        customer_email=customer_email or to_email or "",
        customer_phone=customer_phone,
        order_number=order_number,
        items=items,
        total=total,
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        tax=tax,
        loyalty_used=loyalty_used,
        shipping_address=shipping_address,
        payment_method=payment_method,
        coupon_code=coupon_code,
        gift_message=gift_message
    )

    # Send to customer if email is provided
    if to_email:
        pdf_bytes = None
        try:
            order_data = {
                "order_number": order_number,
                "created_at": datetime.now(),
                "payment_method": payment_method,
                "payment_status": "PAID" if payment_method.lower() in ("card", "upi", "razorpay") else "PENDING",
                "shipping_address": shipping_address,
                "customer_name": customer_name,
                "customer_phone": customer_phone,
                "customer_email": customer_email or to_email,
                "discount_amount": discount,
                "shipping_amount": shipping,
                "tax_amount": tax,
                "subtotal": subtotal,
                "total_amount": total
            }
            wrapper = InvoiceOrderWrapper(order_data, items)
            pdf_buffer = generate_invoice_pdf(wrapper)
            pdf_bytes = pdf_buffer.getvalue()
        except Exception as e:
            print(f"Failed to generate PDF for customer email: {e}")

        return send_smtp_email(
            to_email, 
            subject, 
            html, 
            body_text,
            attachment_bytes=pdf_bytes,
            attachment_filename=f"invoice_{order_number}.pdf"
        )
    return True


# ─────────────────────────────────────────────────────────────────────────────
# 3. Order Confirmed by Admin (Processing Started)
# ─────────────────────────────────────────────────────────────────────────────

def send_order_processing_email(to_email: str, customer_name: str, order_number: str) -> bool:
    subject = f"Your Order is Being Prepared — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} is now confirmed and being prepared."

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Preparation Underway</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order is confirmed.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, great news — your order <strong>{order_number}</strong> has been confirmed by our team and is now being carefully prepared for dispatch.
    </p>
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:9px;color:#888;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Order Number</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#0A0A0A;letter-spacing:0.1em;">{order_number}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      You will receive another notification once your order has been shipped with tracking details.
    </p>"""

    html = _base_template(f"Order Confirmed — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://pommaholidays.com/kozmocart/orders",
                          cta_label="View My Order")
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Order Shipped
# ─────────────────────────────────────────────────────────────────────────────

def send_order_shipped_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    carrier: str = "",
    tracking_number: str = "",
    items: Optional[List[Dict[str, Any]]] = None,
) -> bool:
    subject = f"Your Order Has Shipped — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} has been shipped. Tracking: {tracking_number or 'N/A'}"

    tracking_block = ""
    if tracking_number or carrier:
        tracking_block = f"""
        <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 10px;font-size:9px;color:#888;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Shipment Details</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            {"<tr><td style='font-size:12px;color:#666;padding:3px 0;'>Carrier</td><td style='font-size:12px;font-weight:700;color:#1A1A1A;text-align:right;'>" + carrier.upper() + "</td></tr>" if carrier else ""}
            {"<tr><td style='font-size:12px;color:#666;padding:3px 0;'>Tracking Number</td><td style='font-size:12px;font-weight:700;color:#D2168D;text-align:right;'>" + tracking_number + "</td></tr>" if tracking_number else ""}
          </table>
        </div>"""

    items_html = _order_items_table(items) if items else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">On Its Way</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order has shipped.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your order <strong>{order_number}</strong> has left our warehouse and is on its way to you. The essence of luxury is coming your way.
    </p>
    {tracking_block}
    {items_html}
    <p style="margin:16px 0 0;font-size:12px;color:#888;line-height:1.7;">
      If you have any questions, contact us at <a href="mailto:info@kozmocart.com" style="color:#D2168D;text-decoration:none;">info@kozmocart.com</a>.
    </p>"""

    html = _base_template(f"Order Shipped — {order_number}", "Your Fragrance is En Route", content,
                          cta_url="https://pommaholidays.com/kozmocart/orders",
                          cta_label="Track My Shipment")
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Out for Delivery
# ─────────────────────────────────────────────────────────────────────────────

def send_out_for_delivery_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    shipping_address: Optional[Dict[str, Any]] = None,
) -> bool:
    subject = f"Your Order is Out for Delivery — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} is out for delivery today!"

    address_html = _address_block(shipping_address)

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Arriving Today</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order is out for delivery.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your Kozmocart order <strong>{order_number}</strong> is with our delivery partner and on its way to you right now. Please ensure someone is available to receive it.
    </p>
    <div style="background:#FFF5F9;border-left:3px solid #D2168D;border-radius:2px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#D2168D;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Expected Today</p>
    </div>
    {address_html}
    <p style="margin:16px 0 0;font-size:12px;color:#888;line-height:1.7;">
      If you are unavailable, please contact the delivery partner. Reach us at <a href="mailto:info@kozmocart.com" style="color:#D2168D;text-decoration:none;">info@kozmocart.com</a>.
    </p>"""

    html = _base_template(f"Out for Delivery — {order_number}", "Arriving Today", content)
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Order Delivered
# ─────────────────────────────────────────────────────────────────────────────

def send_order_delivered_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    items: Optional[List[Dict[str, Any]]] = None,
) -> bool:
    subject = f"Your Order Has Been Delivered — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} has been delivered. Thank you for choosing Kozmocart!"

    items_html = _order_items_table(items) if items else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Delivered</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order has arrived.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your Kozmocart order <strong>{order_number}</strong> has been successfully delivered. We hope you enjoy your fragrance experience.
    </p>
    {items_html}
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#555;line-height:1.6;">We'd love to hear from you. Share your experience and earn loyalty points.</p>
      <p style="margin:0;font-size:11px;color:#888;">Contact: <a href="mailto:info@kozmocart.com" style="color:#D2168D;text-decoration:none;">info@kozmocart.com</a></p>
    </div>
    <p style="margin:0;font-size:11px;color:#888;line-height:1.7;">
      If you have any concerns about your delivery, please reach out to us within 48 hours.
    </p>"""

    html = _base_template(f"Delivered — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://pommaholidays.com/kozmocart/shop",
                          cta_label="Explore More Fragrances")
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Order Cancelled
# ─────────────────────────────────────────────────────────────────────────────

def send_order_cancelled_email(
    to_email: str,
    customer_name: str,
    order_number: str,
    reason: str = "",
    total: float = 0,
) -> bool:
    subject = f"Your Order Has Been Cancelled — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} has been cancelled."

    reason_block = f'<p style="margin:12px 0 0;font-size:12px;color:#666;">Reason: <em>{reason}</em></p>' if reason else ""
    refund_block = f'<div style="background:#FAF8F5;border-left:3px solid #EAE6DF;border-radius:2px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:12px;color:#555;line-height:1.6;">Refund of <strong>₹{total:,.2f}</strong> will be processed within 5–7 business days to your original payment method.</p></div>' if total > 0 else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Order Cancelled</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order has been cancelled.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, we're sorry to inform you that your order <strong>{order_number}</strong> has been cancelled.
    </p>
    {reason_block}
    {refund_block}
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      If you believe this is an error or need assistance, please contact us at <a href="mailto:info@kozmocart.com" style="color:#D2168D;text-decoration:none;">info@kozmocart.com</a>.
    </p>"""

    html = _base_template(f"Order Cancelled — {order_number}", "We're Sorry", content,
                          cta_url="https://kozmocart.com/shop",
                          cta_label="Continue Shopping")
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Order Packed
# ─────────────────────────────────────────────────────────────────────────────

def send_order_packed_email(to_email: str, customer_name: str, order_number: str) -> bool:
    subject = f"Your Order is Packed & Ready — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} is packed and ready for pickup by courier."

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Packed & Ready</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order is packed.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your order <strong>{order_number}</strong> has been carefully packed and is awaiting pickup by our courier partner. It will be shipped very soon.
    </p>
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:9px;color:#888;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Order Number</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#0A0A0A;letter-spacing:0.1em;">{order_number}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      You will receive another notification once your order is shipped with tracking details.
    </p>"""

    html = _base_template(f"Packed — {order_number}", "Luxury Fragrance House", content)
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 9. Order Completed
# ─────────────────────────────────────────────────────────────────────────────

def send_order_completed_email(to_email: str, customer_name: str, order_number: str) -> bool:
    subject = f"Order Complete — Thank You, {customer_name}!"
    body_text = f"Dear {customer_name}, your order {order_number} is now complete. Thank you for shopping with Kozmocart!"

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Order Complete</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Thank you for choosing Kozmocart.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your order <strong>{order_number}</strong> is now marked as complete. We hope you're enjoying your fragrance. Your loyalty points have been updated.
    </p>
    <div style="background:#FFF5F9;border-left:3px solid #D2168D;border-radius:2px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#D2168D;font-weight:700;line-height:1.6;">We'd love to hear your thoughts — write to us at <a href="mailto:info@kozmocart.com" style="color:#D2168D;">info@kozmocart.com</a></p>
    </div>"""

    html = _base_template(f"Order Complete — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://kozmocart.com/shop",
                          cta_label="Shop Again")
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 10. Return Requested
# ─────────────────────────────────────────────────────────────────────────────

def send_return_requested_email(to_email: str, customer_name: str, order_number: str, reason: str = "") -> bool:
    subject = f"Return Request Received — {order_number}"
    body_text = f"Dear {customer_name}, we have received your return request for order {order_number}."

    reason_block = f'<p style="margin:12px 0 0;font-size:12px;color:#666;">Reason: <em>{reason}</em></p>' if reason else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Return Requested</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Return request received.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, we have received your return request for order <strong>{order_number}</strong>. Our team will review it within 24–48 hours and contact you.
    </p>
    {reason_block}
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">Please keep the items in their original packaging until our team confirms the pickup.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      For queries, contact us at <a href="mailto:info@kozmocart.com" style="color:#D2168D;text-decoration:none;">info@kozmocart.com</a>.
    </p>"""

    html = _base_template(f"Return Request — {order_number}", "We're Here to Help", content)
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 11. Order Returned
# ─────────────────────────────────────────────────────────────────────────────

def send_order_returned_email(to_email: str, customer_name: str, order_number: str, total: float = 0) -> bool:
    subject = f"Return Confirmed & Refund Initiated — {order_number}"
    body_text = f"Dear {customer_name}, your return for order {order_number} has been confirmed and refund initiated."

    refund_block = f'<div style="background:#FAF8F5;border-left:3px solid #D2168D;border-radius:2px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:12px;color:#555;line-height:1.6;">Refund of <strong>₹{total:,.2f}</strong> will be processed within 5–7 business days to your original payment method.</p></div>' if total > 0 else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Return Confirmed</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your return is confirmed.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, we have confirmed the return for your order <strong>{order_number}</strong> and your refund has been initiated.
    </p>
    {refund_block}
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      Thank you for your patience. If you have questions, reach us at <a href="mailto:info@kozmocart.com" style="color:#D2168D;text-decoration:none;">info@kozmocart.com</a>.
    </p>"""

    html = _base_template(f"Return Confirmed — {order_number}", "Refund Initiated", content,
                          cta_url="https://kozmocart.com/shop",
                          cta_label="Continue Shopping")
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# Helper: Build items list from order items ORM objects
# ─────────────────────────────────────────────────────────────────────────────

def order_items_to_email_list(items) -> List[Dict[str, Any]]:
    """Convert ORM OrderItem list to email-friendly dicts."""
    result = []
    for item in items:
        result.append({
            "product_name": item.product_name or "Product",
            "size_ml": item.size_ml,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "discount_amount": float(item.discount_amount),
            "total_price": float(item.total_price),
        })
    return result
