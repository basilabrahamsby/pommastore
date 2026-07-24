import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_smtp_email
from app.core.config import settings

print("CONFIG CHECK:")
print("HOST:", settings.SMTP_HOST)
print("PORT:", settings.SMTP_PORT)
print("USER:", settings.SMTP_USER)
print("FROM:", settings.SMTP_FROM_EMAIL)
print("SSL:", settings.SMTP_SSL)

res = send_smtp_email(
    to_email="sales@poshgallery.ae",
    subject="Pommastore Live Order System - Verification Successful",
    body_html="""
    <div style="font-family:sans-serif;padding:20px;background:#FAF8F5;border:1px solid #E2D9C8;border-radius:8px;">
      <h2 style="color:#D2168D;margin-top:0;">Pommastore Email Verification</h2>
      <p style="color:#333;font-size:14px;line-height:1.6;">
        This email verifies that <strong>sales@poshgallery.ae</strong> is successfully configured via Titan Email SMTP.
      </p>
      <hr style="border:0;border-top:1px solid #E2D9C8;margin:20px 0;">
      <p style="font-size:11px;color:#888;">Pommastore Luxury Fragrances &bull; Automated System</p>
    </div>
    """,
    body_text="Pommastore Email Verification - Transmission Successful."
)

print("\n----------------------------------------")
print("EMAIL DISPATCH SUCCESSFUL:", res)
print("----------------------------------------")
