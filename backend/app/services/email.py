import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

def send_smtp_email(to_email: str, subject: str, body_html: str, body_text: str = None):
    """
    Sends an email using standard SMTP configurations in settings.
    """
    # Return early if SMTP configurations are incomplete
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
        print(f"Email successfully transmitted to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to transmit email to {to_email}: {str(e)}")
        return False

def send_otp_email(to_email: str, otp_code: str):
    subject = f"{otp_code} is your Kozmocart Access Code"
    body_text = f"Your verification code is {otp_code}. This code is valid for 5 minutes."
    body_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #FAF8F5;
      color: #1A1A1A;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      max-width: 600px;
      margin: 40px auto;
      background-color: #FFFFFF;
      border: 1px solid #EAE6DF;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }}
    .header {{
      background-color: #0A0A0A;
      padding: 30px 20px;
      text-align: center;
    }}
    .logo {{
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }}
    .content {{
      padding: 40px 50px;
      text-align: center;
    }}
    .tagline {{
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #D2168D;
      text-transform: uppercase;
      margin-bottom: 20px;
    }}
    .title {{
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-style: italic;
      color: #1A1A1A;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }}
    .divider {{
      width: 40px;
      height: 1px;
      background-color: #E2D9C8;
      margin: 20px auto;
    }}
    .description {{
      font-size: 13px;
      line-height: 1.6;
      color: #555555;
      margin-bottom: 30px;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }}
    .code-container {{
      background-color: #FAF8F5;
      border: 1px dashed #E2D9C8;
      padding: 20px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 30px;
    }}
    .code {{
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.25em;
      color: #0A0A0A;
      margin: 0;
      padding-left: 0.25em;
    }}
    .footer {{
      background-color: #FAF8F5;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #EAE6DF;
    }}
    .footer-text {{
      font-size: 10px;
      color: #888888;
      line-height: 1.6;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Kozmocart</div>
    </div>
    <div class="content">
      <div class="tagline">Secure Identity Verification</div>
      <h2 class="title">Access the Inner Circle.</h2>
      <div class="divider"></div>
      <p class="description">
        Use the secure verification code below to authorize your session on Kozmocart. This code is valid for 5 minutes.
      </p>
      <div class="code-container">
        <div class="code">{otp_code}</div>
      </div>
      <p class="description" style="font-size: 11px; color: #888888; margin-bottom: 0;">
        If you did not request this authorization, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <div class="footer-text">
        © 2026 Kozmocart Luxury Fragrances<br>
        concierge@kozmocart.com | Designed for Excellence
      </div>
    </div>
  </div>
</body>
</html>
"""
    return send_smtp_email(to_email, subject, body_html, body_text)
