import smtplib
import ssl
from app.services.email import send_smtp_email

if __name__ == "__main__":
    print("Testing send_smtp_email with sales@poshgallery.ae...")
    res = send_smtp_email(
        "sales@poshgallery.ae",
        "Pommastore SMTP Test",
        "<h2>SMTP Test Successful!</h2><p>Your sales@poshgallery.ae email is now authenticated and connected.</p>",
        "SMTP Test Successful"
    )
    print("✓ EMAIL DELIVERY TEST RESULT:", res)
