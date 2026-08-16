import asyncio
import json
from app.services.email import send_smtp_email

def main():
    print("Testing send_smtp_email with sales@poshgallery.ae...")
    res = send_smtp_email(
        "sales@poshgallery.ae",
        "Pommastore SMTP Connected 🎉",
        "<h2>SMTP Connection Successful!</h2><p>Your sales@poshgallery.ae email is now authenticated and sending live store emails.</p>",
        "SMTP Connection Successful"
    )
    print("✓ LIVE EMAIL DELIVERY RESULT:", res)

if __name__ == "__main__":
    main()
