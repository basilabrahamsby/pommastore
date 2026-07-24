import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_smtp_email
from app.core.config import settings

print("SMTP HOST:", settings.SMTP_HOST)
print("SMTP PORT:", settings.SMTP_PORT)
print("SMTP USER:", settings.SMTP_USER)
print("SMTP FROM EMAIL:", settings.SMTP_FROM_EMAIL)
print("SMTP SSL:", settings.SMTP_SSL)
print("SMTP TLS:", settings.SMTP_TLS)

res = send_smtp_email(
    to_email="sales@poshgallery.ae",
    subject="Pommastore Email Verification",
    body_html="<h2>Pommastore Email System</h2><p>This email confirms that SMTP transmission from sales@poshgallery.ae is working 100% cleanly.</p>",
    body_text="Pommastore Email System - SMTP transmission verified."
)

print("EMAIL TRANSMISSION RESULT:", res)
