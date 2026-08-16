import asyncio
import json
from app.db.session import AsyncSessionLocal
from sqlalchemy import text
from app.services.email import send_smtp_email

async def main():
    async with AsyncSessionLocal() as session:
        val = json.dumps({
            "host": "smtp.gmail.com",
            "port": "587",
            "enabled": True,
            "fromName": "Pommastore",
            "password": "wbhnfnixltdmagk",
            "username": "sales@poshgallery.ae",
            "fromEmail": "sales@poshgallery.ae",
            "encryption": "TLS"
        })
        await session.execute(text("UPDATE sys_settings SET value = :v::jsonb WHERE key = 'smtpConfig'"), {"v": val})
        await session.commit()
        print("✓ DB Updated")

    res = send_smtp_email(
        "sales@poshgallery.ae", 
        "Pommastore SMTP Test", 
        "<h2>SMTP Test Successful!</h2><p>Your sales@poshgallery.ae email is now authenticated and connected.</p>",
        "SMTP Test Successful"
    )
    print("✓ Email Delivery Test Result:", res)

if __name__ == "__main__":
    asyncio.run(main())
