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
            <img src="https://pommastore.com/logo.png" alt="POMMASTORE" style="height:42px;display:block;margin:0 auto;border:0;" />
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
              © 2026 Pommastore Luxury Fragrances &nbsp;|&nbsp; info@pommastore.com<br>
              You are receiving this because you placed an order on Pommastore.
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
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;font-size:13px;color:#1A1A1A;text-align:right;font-weight:700;">AED {float(price):,.2f}</td>
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
    discount_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Discount</td><td style="font-size:12px;color:#D2168D;text-align:right;padding:4px 0;">−AED {discount:,.2f}</td></tr>' if discount > 0 else ""
    loyalty_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Loyalty Points Used</td><td style="font-size:12px;color:#D2168D;text-align:right;padding:4px 0;">−AED {float(loyalty_used):,.2f}</td></tr>' if loyalty_used > 0 else ""
    shipping_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Shipping</td><td style="font-size:12px;color:#1A1A1A;text-align:right;padding:4px 0;">AED {shipping:,.2f}</td></tr>' if shipping > 0 else ""
    tax_row = f'<tr><td style="font-size:12px;color:#666;padding:4px 0;">Tax</td><td style="font-size:12px;color:#1A1A1A;text-align:right;padding:4px 0;">AED {tax:,.2f}</td></tr>' if tax > 0 else ""

    return f"""
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 10px;font-size:9px;color:#888;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Order Summary — {order_number}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:12px;color:#666;padding:4px 0;">Subtotal</td><td style="font-size:12px;color:#1A1A1A;text-align:right;padding:4px 0;">AED {subtotal:,.2f}</td></tr>
        {discount_row}
        {loyalty_row}
        {shipping_row}
        {tax_row}
        <tr><td colspan="2" style="padding:6px 0;border-top:1px solid #E0D9CF;"></td></tr>
        <tr>
          <td style="font-size:14px;color:#0A0A0A;font-weight:800;padding:4px 0;">Total</td>
          <td style="font-size:16px;color:#0A0A0A;font-weight:800;text-align:right;padding:4px 0;">AED {total:,.2f}</td>
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
    subject = f"{otp_code} is your Pommastore Access Code"
    body_text = f"Your verification code is {otp_code}. This code is valid for 5 minutes."

    content = f"""
    <div style="text-align:center;">
      <p style="margin:0 0 6px;font-size:9px;font-weight:800;letter-spacing:0.25em;color:#D2168D;text-transform:uppercase;">Secure Identity Verification</p>
      <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:24px;font-style:italic;color:#1A1A1A;line-height:1.3;">Access the Inner Circle.</h2>
      <div style="width:40px;height:1px;background:#E2D9C8;margin:0 auto 20px;"></div>
      <p style="margin:0 0 28px;font-size:13px;color:#555;line-height:1.7;max-width:380px;margin-left:auto;margin-right:auto;">
        Use the secure verification code below to authorize your session on Pommastore. This code is valid for <strong>5 minutes</strong>.
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
    company_name = "POSH NICHE PERFUMES & COSMETICS TRADING LLC"
    company_address = "Office No. C-81, Al Muteena, Dubai, United Arab Emirates"
    trn = "104349616300003"
    phone = "+971 4 453 9119"
    email = "sales@poshgallery.ae"

    if company_details and isinstance(company_details, dict):
        if company_details.get("companyName"):
            company_name = company_details.get("companyName")
        if company_details.get("registeredAddress"):
            company_address = company_details.get("registeredAddress")
        if company_details.get("gstin") or company_details.get("trn"):
            trn = company_details.get("gstin") or company_details.get("trn")
        if company_details.get("phone"):
            phone = company_details.get("phone")
        if company_details.get("email"):
            email = company_details.get("email")

    trn_line = f'TRN: {trn}<br>' if trn else ""
    support_line = f'Support: {phone}<br>' if phone else ""

    date_str = order.created_at.strftime("%d/%m/%Y, %H:%M") if order.created_at else "N/A"
    payment_method = (order.payment_method.value if hasattr(order.payment_method, 'value') else str(order.payment_method)).upper() if order.payment_method else "N/A"
    payment_status = (order.payment_status.value if hasattr(order.payment_status, 'value') else str(order.payment_status)).upper() if order.payment_status else "PENDING"

    # Address block formatting
    shipping_address_str = "No shipping details"
    if order.shipping_address:
        sa = order.shipping_address
        if isinstance(sa, dict):
            parts = [
                sa.get("address_line1"),
                sa.get("address_line2"),
                sa.get("city"),
                sa.get("state")
            ]
            parts = [p.strip() for p in parts if p and p.strip()]
            addr_base = ", ".join(parts)
            pincode = sa.get("pincode")
            shipping_address_str = sa.get("full_address") or (f"{addr_base} - {pincode}" if pincode else addr_base)
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
          <td style="text-align: right;">AED {unit_price:,.2f}</td>
          <td style="text-align: right;font-weight:700;">AED {total_price:,.2f}</td>
        </tr>
        """

    discount = float(order.discount_amount or 0)
    shipping = float(order.shipping_amount or 0)
    tax = float(order.tax_amount or 0)
    subtotal = float(order.subtotal or 0)
    total = float(order.total_amount or 0)

    # Calculate UAE VAT Breakdown (5.0% Inclusive)
    vat_rate = 0.05
    taxable_val = subtotal / (1 + vat_rate)
    total_vat = subtotal - taxable_val
    
    gst_rows_html = f"""
    <tr>
      <td style="font-size: 11px; color: #555555; padding-left: 10px;">Taxable Value:</td>
      <td style="text-align: right; font-size: 11px; color: #555555;">AED {taxable_val:,.2f}</td>
    </tr>
    <tr>
      <td style="font-size: 11px; color: #555555; padding-left: 10px;">UAE VAT (5.0%):</td>
      <td style="text-align: right; font-size: 11px; color: #555555;">AED {total_vat:,.2f}</td>
    </tr>
    """
    discount_row = f'<tr><td>Discount:</td><td style="text-align: right;color:#E11D48;">-AED {discount:,.2f}</td></tr>' if discount > 0 else ""
    shipping_row = f'<tr><td>Logistics (Standard):</td><td style="text-align: right;">{"FREE" if shipping == 0 else f"AED {shipping:,.2f}"}</td></tr>'

    subtotal_str = f"{subtotal:,.2f}"
    total_str = f"{total:,.2f}"

    tracking_number = getattr(order, 'tracking_number', None)
    carrier = getattr(order, 'carrier', None)
    tracking_line = f'<p style="margin:0 0 4px;"><strong>Tracking Number:</strong> {tracking_number}</p>' if tracking_number else ""
    carrier_line = f'<p style="margin:0 0 4px;"><strong>Carrier:</strong> {carrier}</p>' if carrier else ""

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice — {order.order_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Montserrat', Arial, sans-serif;
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
      position: relative;
    }}
    .top-bar {{
      height: 6px;
      background: #D2168D;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      border-radius: 4px 4px 0 0;
    }}
    .bottom-bar {{
      height: 6px;
      background: #D2168D;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      border-radius: 0 0 4px 4px;
    }}
    .invoice-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
    }}
    .logo-block img {{
      height: 48px;
      display: block;
      margin-bottom: 12px;
    }}
    .company-address {{
      font-size: 11px;
      line-height: 1.5;
      color: #555555;
    }}
    .invoice-title-block {{
      text-align: right;
    }}
    .invoice-title-block h1 {{
      margin: 0;
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 0.05em;
    }}
    .invoice-meta-info {{
      margin-top: 15px;
      font-size: 11px;
      line-height: 1.6;
      color: #555555;
      text-align: right;
    }}
    .invoice-meta-info strong {{
      color: #000000;
    }}
    .billed-to-section {{
      margin-bottom: 35px;
      font-size: 12px;
      line-height: 1.6;
    }}
    .billed-to-section h3 {{
      margin: 0 0 6px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #D2168D;
      text-transform: uppercase;
    }}
    .items-table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
      font-size: 12px;
    }}
    .items-table th {{
      background: #F3F4F6;
      color: #1A1A1A;
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
    .summary-payment-grid {{
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
      font-size: 12px;
      line-height: 1.6;
    }}
    .payment-info-col h4 {{
      margin: 0 0 8px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #D2168D;
      text-transform: uppercase;
    }}
    .payment-info-col p {{
      margin: 0 0 4px;
      color: #555555;
    }}
    .summary-col {{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }}
    .summary-table {{
      width: 100%;
      line-height: 1.8;
    }}
    .summary-table td {{
      padding: 2px 0;
    }}
    .summary-table tr.total-row td {{
      border-top: 1px solid #EAE6DF;
      padding-top: 8px;
    }}
    .summary-table tr.total-row .total-box {{
      background: #F3F4F6;
      color: #1A1A1A;
      font-weight: 800;
      font-size: 15px;
      padding: 8px 16px;
      text-align: right;
      display: inline-block;
      min-width: 180px;
      box-sizing: border-box;
    }}
    .invoice-footer {{
      border-top: 1px solid #EAE6DF;
      padding-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #888888;
      line-height: 1.6;
    }}
    .print-actions {{
      max-width: 800px;
      margin: 0 auto 20px;
      display: flex;
      justify-content: flex-end;
    }}
    @media print {{
      @page {{
        size: A4 portrait;
        margin: 10mm;
      }}
      html, body {{
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 auto !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
      }}
      .invoice-container {{
        width: 100% !important;
        max-width: 100% !important;
        border: none !important;
        box-shadow: none !important;
        padding: 24px 20px !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }}
      .print-actions {{
        display: none !important;
      }}
    }}
  </style>
</head>
<body>
  <div class="print-actions">
    <button onclick="window.print()" style="padding: 10px 24px; background: #D2168D; color: #FFFFFF; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; border: none; border-radius: 2px; cursor: pointer;">
      Print / Download PDF
    </button>
  </div>
  <div class="invoice-container">
    <div class="top-bar"></div>
    <div class="invoice-header">
      <div class="logo-block">
        <img src="https://pommaholidays.com/pommastore/logo.png" alt="POMMASTORE" style="height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 12px;">
        <div class="company-address">
          <strong>{company_name}</strong><br>
          {company_address}<br>
          {trn_line}
          {support_line}
        </div>
      </div>
      <div class="invoice-title-block">
        <h1>INVOICE</h1>
        <div class="invoice-meta-info">
          <strong>Invoice No:</strong> {order.order_number}<br>
          <strong>Date:</strong> {date_str}<br>
          <strong>Status:</strong> {payment_status}
        </div>
      </div>
    </div>

    <div class="billed-to-section">
      <h3>Bill To / Ship To:</h3>
      <strong>{order.customer_name}</strong><br>
      {shipping_address_str}<br>
      <strong>Phone:</strong> {order.customer_phone or 'N/A'}<br>
      <strong>Email:</strong> {order.customer_email or 'N/A'}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th width="50%">Description</th>
          <th width="15%" style="text-align: center;">Quantity</th>
          <th width="15%" style="text-align: right;">Unit Price</th>
          <th width="20%" style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {items_rows}
      </tbody>
    </table>

    <div class="summary-payment-grid">
      <div class="payment-info-col">
        <h4>Payment & Shipping Info:</h4>
        <p><strong>Payment Method:</strong> {payment_method}</p>
        {tracking_line}
        {carrier_line}
      </div>
      <div class="summary-col">
        <table class="summary-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">AED {subtotal_str}</td>
          </tr>
          {discount_row}
          {shipping_row}
          {gst_rows_html}
          <tr class="total-row">
            <td colspan="2" style="text-align: right; padding-top: 10px;">
              <div class="total-box">
                Total: AED {total_str}
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="invoice-footer">
      <p style="margin: 0 0 6px; font-style: italic;">Thank you for your business!</p>
      <p style="margin: 0 0 6px; font-size: 10px; color: #555555; font-weight: 700;">{company_name}</p>
      <p style="margin: 0 0 4px; font-size: 10px; color: #555555;">{company_address}</p>
      <p style="margin: 0; font-size: 10px; color: #555555;">TRN: {trn} &nbsp;|&nbsp; <a href="mailto:{email}" style="color: #D2168D; text-decoration: none;">{email}</a> &nbsp;|&nbsp; www.pommaholidays.com</p>
    </div>
    <div class="bottom-bar"></div>
  </div>
</body>
</html>
"""


def generate_invoice_pdf(order, company_details: Optional[Dict[str, Any]] = None):
    """Generates a beautiful printable tax invoice PDF for an order."""
    from io import BytesIO
    import urllib.request
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch

    if not company_details:
        company_details = {
            "companyName": "POMMASTORE COMMODITIES PRIVATE LIMITED",
            "registeredAddress": "71/826, B.T.S RRA-283, BTS Road, Keerthi Nagar, Elamakkara P.O, Kochi, Kerala - 682026",
            "gstin": "32AAHCK3784H1ZF",
            "pan": "AAHCK3784H",
            "stateCode": "32 (Kerala)"
        }

    company_name = company_details.get("companyName") or "POMMASTORE COMMODITIES PRIVATE LIMITED"
    company_address = company_details.get("registeredAddress") or "71/826, B.T.S RRA-283, BTS Road, Keerthi Nagar, Elamakkara P.O, Kochi, Kerala - 682026"
    # Short address for header (city/state only)
    short_address = "Kochi, Kerala - 682026"
    gstin = company_details.get("gstin") or "32AAHCK3784H1ZF"
    pan = company_details.get("pan") or "AAHCK3784H"
    state_code = company_details.get("stateCode") or "32 (Kerala)"
    # Override incorrect state code if admin saved wrong value
    if state_code and ("delhi" in state_code.lower() or state_code.strip() in ("07", "07 (Delhi)", "37", "37 (Delhi)")):
        state_code = "32 (Kerala)"

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=80,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Premium Typography & Colors
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#000000')
    )

    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#D2168D'),
        alignment=2
    )

    h3_style = ParagraphStyle(
        'H3Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#D2168D')
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor('#333333')
    )

    bold_body_style = ParagraphStyle(
        'BoldBodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor('#000000')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1A1A1A')
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=colors.HexColor('#333333')
    )

    table_cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=12,
        textColor=colors.HexColor('#000000')
    )

    story = []

    # Dynamic Logo Download with Fallback
    logo_flowable = None
    try:
        req = urllib.request.Request(
            "https://pommaholidays.com/pommastore/logo.png",
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        logo_data = urllib.request.urlopen(req, timeout=3).read()
        logo_flowable = Image(BytesIO(logo_data), width=1.8*inch, height=0.4*inch)
    except Exception as img_err:
        print(f"Skipping remote logo loading: {img_err}")
        logo_flowable = Paragraph("POMMASTORE", title_style)

    # Left Header: Logo & Company Address info
    left_header_text = f"<b>{company_name}</b><br/>{company_address}<br/>TRN: {trn}<br/>Support: {phone}"
    
    left_header_data = [
        [logo_flowable],
        [Spacer(1, 4)],
        [Paragraph(left_header_text, ParagraphStyle('LeftCompText', parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor('#555555')))]
    ]
    left_header_table = Table(left_header_data, colWidths=[3.5*inch])
    left_header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))

    # Right Header: INVOICE title & Meta details
    right_header_text = f"<b>Invoice No:</b> {order.order_number}<br/>"
    right_header_text += f"<b>Date:</b> {(order.created_at.strftime('%d/%m/%Y, %H:%M') if order.created_at else 'N/A')}<br/>"
    right_header_text += f"<b>Status:</b> {((order.payment_status.value if hasattr(order.payment_status, 'value') else str(order.payment_status)).upper() if order.payment_status else 'PENDING')}"

    right_header_data = [
        [Paragraph("INVOICE", ParagraphStyle('InvTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=28, leading=30, alignment=2))],
        [Spacer(1, 10)],
        [Paragraph(right_header_text, ParagraphStyle('InvMetaText', parent=body_style, fontSize=9, leading=12, alignment=2, textColor=colors.HexColor('#555555')))]
    ]
    right_header_table = Table(right_header_data, colWidths=[3.5*inch])
    right_header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))

    header_table = Table([[left_header_table, right_header_table]], colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    header_table.hAlign = 'CENTER'
    story.append(header_table)

    # Hot Pink Accent Separator Line
    divider = Table([[""]], colWidths=[7.0*inch], rowHeights=[2])
    divider.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#D2168D')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    divider.hAlign = 'CENTER'
    story.append(divider)
    story.append(Spacer(1, 15))

    # Billed To Section
    shipping_address_str = "No shipping details"
    if order.shipping_address:
        sa = order.shipping_address
        if isinstance(sa, dict):
            parts = [
                sa.get("address_line1"),
                sa.get("address_line2"),
                sa.get("city"),
                sa.get("state")
            ]
            parts = [p.strip() for p in parts if p and p.strip()]
            addr_base = ", ".join(parts)
            pincode = sa.get("pincode")
            shipping_address_str = sa.get("full_address") or (f"{addr_base} - {pincode}" if pincode else addr_base)
        else:
            shipping_address_str = str(sa)

    buyer_details = f"<b>{order.customer_name}</b><br/>"
    buyer_details += f"{shipping_address_str}<br/>"
    buyer_details += f"Phone: {order.customer_phone or 'N/A'}<br/>"
    buyer_details += f"Email: {order.customer_email or 'N/A'}"

    billed_to_data = [
        [Paragraph("BILL TO / SHIP TO:", h3_style)],
        [Paragraph(buyer_details, body_style)]
    ]
    billed_to_table = Table(billed_to_data, colWidths=[7.0*inch])
    billed_to_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    billed_to_table.hAlign = 'CENTER'
    story.append(billed_to_table)
    story.append(Spacer(1, 15))

    # Items table (Description, Quantity, Unit Price, Total)
    table_data = [
        [
            Paragraph("DESCRIPTION", table_header_style),
            Paragraph("QUANTITY", ParagraphStyle('ThRight', parent=table_header_style, alignment=1)),
            Paragraph("UNIT PRICE", ParagraphStyle('ThRight2', parent=table_header_style, alignment=2)),
            Paragraph("TOTAL", ParagraphStyle('ThRight3', parent=table_header_style, alignment=2))
        ]
    ]

    for item in order.items:
        desc = f"<b>{item.product_name or 'Product'}</b>"
        if item.sku:
            desc += f"<br/><font size=6 color='#888888'>SKU: {item.sku}</font>"
        if item.size_ml:
            desc += f" | <font size=6 color='#666666'>Size: {item.size_ml} ml</font>"

        table_data.append([
            Paragraph(desc, table_cell_style),
            Paragraph(str(item.quantity), ParagraphStyle('TdRight', parent=table_cell_style, alignment=1)),
            Paragraph(f"Rs. {float(item.unit_price):,.2f}", ParagraphStyle('TdRight2', parent=table_cell_style, alignment=2)),
            Paragraph(f"Rs. {float(item.unit_price * item.quantity):,.2f}", ParagraphStyle('TdRight3', parent=table_cell_bold_style, alignment=2))
        ])

    items_table = Table(table_data, colWidths=[4.0*inch, 0.7*inch, 1.1*inch, 1.2*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EAE6DF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#EAE6DF')),
    ]))
    items_table.hAlign = 'CENTER'
    story.append(items_table)
    story.append(Spacer(1, 15))

    # Payment & Shipping Info (Left) vs Totals (Right)
    tracking_num_pdf = getattr(order, 'tracking_number', None)
    carrier_pdf = getattr(order, 'carrier', None)
    tracking_text = f"Tracking Number: {tracking_num_pdf}<br/>" if tracking_num_pdf else ""
    carrier_text = f"Carrier: {carrier_pdf}<br/>" if carrier_pdf else ""
    pm_text = f"Payment Method: {((order.payment_method.value if hasattr(order.payment_method, 'value') else str(order.payment_method)).upper() if order.payment_method else 'N/A')}"
    
    payment_info_text = f"<b>Payment & Shipping Info:</b><br/>{pm_text}<br/>{tracking_text}{carrier_text}"
    payment_info_para = Paragraph(payment_info_text, ParagraphStyle('PayInfoText', parent=body_style, fontSize=8, leading=12, textColor=colors.HexColor('#555555')))

    subtotal = float(order.subtotal or 0)
    vat_rate = 0.05
    taxable_val = subtotal / (1 + vat_rate)
    total_vat = subtotal - taxable_val

    gst_label_style = ParagraphStyle('GstLabel', parent=body_style, fontSize=7, leading=10, textColor=colors.HexColor('#666666'))
    gst_val_style = ParagraphStyle('GstVal', parent=body_style, fontSize=7, leading=10, textColor=colors.HexColor('#666666'), alignment=2)

    summary_data = [
        [Paragraph("Subtotal (VAT Incl.):", body_style), Paragraph(f"AED {subtotal:,.2f}", body_style)],
        [Paragraph("Taxable Value:", gst_label_style), Paragraph(f"AED {taxable_val:,.2f}", gst_val_style)],
        [Paragraph("UAE VAT (5.0%):", gst_label_style), Paragraph(f"AED {total_vat:,.2f}", gst_val_style)],
    ]

    if order.discount_amount and float(order.discount_amount) > 0:
        summary_data.append([Paragraph("Discount:", body_style), Paragraph(f"-AED {float(order.discount_amount):,.2f}", body_style)])
    if order.shipping_amount and float(order.shipping_amount) > 0:
        summary_data.append([Paragraph("Shipping:", body_style), Paragraph(f"AED {float(order.shipping_amount):,.2f}", body_style)])
    else:
        summary_data.append([Paragraph("Shipping:", body_style), Paragraph("FREE", body_style)])

    summary_data.append([
        Paragraph("<b>Total:</b>", ParagraphStyle('TotalLabel', parent=bold_body_style, textColor=colors.HexColor('#1A1A1A'))),
        Paragraph(f"<b>AED {float(order.total_amount):,.2f}</b>", ParagraphStyle('TotalVal', parent=bold_body_style, textColor=colors.HexColor('#1A1A1A'), alignment=2))
    ])

    summary_table = Table(summary_data, colWidths=[2.2*inch, 1.2*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-2), 3),
        ('BOTTOMPADDING', (0,0), (-1,-2), 3),
        # Grand total solid box style!
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F3F4F6')),
        ('TOPPADDING', (0,-1), (-1,-1), 8),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 8),
        ('LEFTPADDING', (0,-1), (-1,-1), 12),
        ('RIGHTPADDING', (0,-1), (-1,-1), 12),
    ]))

    bottom_grid_data = [
        [payment_info_para, summary_table]
    ]
    bottom_grid_table = Table(bottom_grid_data, colWidths=[3.6*inch, 3.4*inch])
    bottom_grid_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    bottom_grid_table.hAlign = 'CENTER'
    story.append(bottom_grid_table)
    story.append(Spacer(1, 20))

    # Footer divider
    footer_divider = Table([[""]], colWidths=[7.0*inch], rowHeights=[1])
    footer_divider.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#E0E0E0')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    footer_divider.hAlign = 'CENTER'
    story.append(footer_divider)
    story.append(Spacer(1, 10))

    # Footer note with full address and toll-free — shown on separate lines
    footer_addr_style = ParagraphStyle('FooterAddr', parent=body_style, alignment=1, fontSize=7, leading=12, textColor=colors.HexColor('#666666'), wordWrap='CJK')
    footer_thanks_style = ParagraphStyle('FooterThanks', parent=body_style, alignment=1, fontSize=8, leading=12, textColor=colors.HexColor('#333333'))

    # Strip any trailing Mob: / Phone: info from address for cleaner display
    import re as _re
    clean_address = _re.sub(r'\s*(Mob|Phone|Tel|Mobile)\s*:.*$', '', company_address, flags=_re.IGNORECASE).strip().rstrip(',')

    story.append(Paragraph("<i>Thank you for your business!</i>", footer_thanks_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(company_name, footer_addr_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(clean_address, footer_addr_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "Toll Free: 1800 890 2621  \u2502  Email: info@pommastore.com  \u2502  www.pommastore.com",
        footer_addr_style
    ))

    # ── Vertical centering: measure story height, prepend a top spacer ──
    from reportlab.platypus import SimpleDocTemplate as _SDT
    from io import BytesIO as _BIO
    _measure_buf = _BIO()
    _measure_doc = _SDT(_measure_buf, pagesize=A4, rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=45)
    _measure_doc.build(list(story))          # build a throw-away copy
    _content_height = _measure_doc.page - 45 - 45  # rough: page cursor at end

    page_h = A4[1]                           # 841.89 pt
    usable_h = page_h - 45 - 45             # 751.89 pt
    story_h = sum(getattr(f, '_height', 0) or 0 for f in story)

    # Estimate using a reasonable fraction if measurement gives 0
    top_pad = max(0, (usable_h - 520) / 2)  # 520pt ≈ typical invoice height
    final_story = [Spacer(1, top_pad)] + story if top_pad > 10 else story

    doc.build(final_story)
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
    body_text = f"New Order Details for {order_number}. Customer: {customer_name}. Total: AED {total:,.2f}"

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
        "info@pommastore.com", 
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
    subject = f"Your Pommastore Order is Confirmed — {order_number}"
    body_text = f"Dear {customer_name}, your order {order_number} has been confirmed. Total: AED {total:,.2f}"

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
      Track your order anytime at <a href="https://pommastore.com/track-order" style="color:#D2168D;text-decoration:none;">pommastore.com/track-order</a> using your order number and email.
    </p>"""

    html = _base_template(f"Order Confirmed — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://pommastore.com/track-order",
                          cta_label="Track My Order")
    
    # Always send detailed invoice copy with full customer details to info@pommastore.com
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
                          cta_url="https://pommaholidays.com/pommastore/orders",
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
      If you have any questions, contact us at <a href="mailto:info@pommastore.com" style="color:#D2168D;text-decoration:none;">info@pommastore.com</a>.
    </p>"""

    html = _base_template(f"Order Shipped — {order_number}", "Your Fragrance is En Route", content,
                          cta_url="https://pommaholidays.com/pommastore/orders",
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
      Dear <strong>{customer_name}</strong>, your Pommastore order <strong>{order_number}</strong> is with our delivery partner and on its way to you right now. Please ensure someone is available to receive it.
    </p>
    <div style="background:#FFF5F9;border-left:3px solid #D2168D;border-radius:2px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#D2168D;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Expected Today</p>
    </div>
    {address_html}
    <p style="margin:16px 0 0;font-size:12px;color:#888;line-height:1.7;">
      If you are unavailable, please contact the delivery partner. Reach us at <a href="mailto:info@pommastore.com" style="color:#D2168D;text-decoration:none;">info@pommastore.com</a>.
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
    body_text = f"Dear {customer_name}, your order {order_number} has been delivered. Thank you for choosing Pommastore!"

    items_html = _order_items_table(items) if items else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Delivered</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order has arrived.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your Pommastore order <strong>{order_number}</strong> has been successfully delivered. We hope you enjoy your fragrance experience.
    </p>
    {items_html}
    <div style="background:#FAF8F5;border:1px solid #EAE6DF;border-radius:3px;padding:16px 20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#555;line-height:1.6;">We'd love to hear from you. Share your experience and earn loyalty points.</p>
      <p style="margin:0;font-size:11px;color:#888;">Contact: <a href="mailto:info@pommastore.com" style="color:#D2168D;text-decoration:none;">info@pommastore.com</a></p>
    </div>
    <p style="margin:0;font-size:11px;color:#888;line-height:1.7;">
      If you have any concerns about your delivery, please reach out to us within 48 hours.
    </p>"""

    html = _base_template(f"Delivered — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://pommaholidays.com/pommastore/shop",
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
    refund_block = f'<div style="background:#FAF8F5;border-left:3px solid #EAE6DF;border-radius:2px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:12px;color:#555;line-height:1.6;">Refund of <strong>AED {total:,.2f}</strong> will be processed within 5–7 business days to your original payment method.</p></div>' if total > 0 else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#888;text-transform:uppercase;">Order Cancelled</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your order has been cancelled.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, we're sorry to inform you that your order <strong>{order_number}</strong> has been cancelled.
    </p>
    {reason_block}
    {refund_block}
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      If you believe this is an error or need assistance, please contact us at <a href="mailto:info@pommastore.com" style="color:#D2168D;text-decoration:none;">info@pommastore.com</a>.
    </p>"""

    html = _base_template(f"Order Cancelled — {order_number}", "We're Sorry", content,
                          cta_url="https://pommastore.com/shop",
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
    body_text = f"Dear {customer_name}, your order {order_number} is now complete. Thank you for shopping with Pommastore!"

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Order Complete</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Thank you for choosing Pommastore.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, your order <strong>{order_number}</strong> is now marked as complete. We hope you're enjoying your fragrance. Your loyalty points have been updated.
    </p>
    <div style="background:#FFF5F9;border-left:3px solid #D2168D;border-radius:2px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#D2168D;font-weight:700;line-height:1.6;">We'd love to hear your thoughts — write to us at <a href="mailto:info@pommastore.com" style="color:#D2168D;">info@pommastore.com</a></p>
    </div>"""

    html = _base_template(f"Order Complete — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://pommastore.com/shop",
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
      For queries, contact us at <a href="mailto:info@pommastore.com" style="color:#D2168D;text-decoration:none;">info@pommastore.com</a>.
    </p>"""

    html = _base_template(f"Return Request — {order_number}", "We're Here to Help", content)
    return send_smtp_email(to_email, subject, html, body_text)


# ─────────────────────────────────────────────────────────────────────────────
# 11. Order Returned
# ─────────────────────────────────────────────────────────────────────────────

def send_order_returned_email(to_email: str, customer_name: str, order_number: str, total: float = 0) -> bool:
    subject = f"Return Confirmed & Refund Initiated — {order_number}"
    body_text = f"Dear {customer_name}, your return for order {order_number} has been confirmed and refund initiated."

    refund_block = f'<div style="background:#FAF8F5;border-left:3px solid #D2168D;border-radius:2px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:12px;color:#555;line-height:1.6;">Refund of <strong>AED {total:,.2f}</strong> will be processed within 5–7 business days to your original payment method.</p></div>' if total > 0 else ""

    content = f"""
    <p style="margin:0 0 6px;font-size:9px;font-weight:700;letter-spacing:0.2em;color:#D2168D;text-transform:uppercase;">Return Confirmed</p>
    <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#1A1A1A;">Your return is confirmed.</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.7;">
      Dear <strong>{customer_name}</strong>, we have confirmed the return for your order <strong>{order_number}</strong> and your refund has been initiated.
    </p>
    {refund_block}
    <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
      Thank you for your patience. If you have questions, reach us at <a href="mailto:info@pommastore.com" style="color:#D2168D;text-decoration:none;">info@pommastore.com</a>.
    </p>"""

    html = _base_template(f"Return Confirmed — {order_number}", "Refund Initiated", content,
                          cta_url="https://pommastore.com/shop",
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
