import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict, Any, Optional
from app.core.config import settings

# ─────────────────────────────────────────────────────────────────────────────
# Core SMTP Dispatcher
# ─────────────────────────────────────────────────────────────────────────────

def send_smtp_email(to_email: str, subject: str, body_html: str, body_text: str = None) -> bool:
    """Sends an email using standard SMTP configurations in settings."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        print("SMTP settings are not configured. Skipping email transmission.")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email

    if body_text:
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
    msg.attach(MIMEText(body_html, 'html', 'utf-8'))

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
          <td bgcolor="#0A0A0A" style="padding:28px 20px;text-align:center;">
            <p style="margin:0;color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:0.35em;text-transform:uppercase;">KOZMOCART</p>
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
    return send_smtp_email("info@kozmocart.com", subject, html, body_text)


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
      Track your order anytime at <a href="https://pommaholidays.com/kozmocart/orders" style="color:#D2168D;text-decoration:none;">kozmocart.com/orders</a> using your order number and email.
    </p>"""

    html = _base_template(f"Order Confirmed — {order_number}", "Luxury Fragrance House", content,
                          cta_url="https://pommaholidays.com/kozmocart/orders",
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
        return send_smtp_email(to_email, subject, html, body_text)
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
