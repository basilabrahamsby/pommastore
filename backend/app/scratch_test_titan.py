import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "Delmon@posh&sales!"

hosts = [
    ("smtp.titan.email", 465, True, False),
    ("smtp.titan.email", 587, False, True),
    ("mail.poshgallery.ae", 465, True, False),
    ("mail.poshgallery.ae", 587, False, True)
]

context = ssl.create_default_context()

for host, port, use_ssl, use_tls in hosts:
    print(f"\nTesting {host}:{port} (SSL={use_ssl}, TLS={use_tls})...")
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls(context=context)
        
        server.login(user, pw)
        print(f"🎉 SUCCESS! Authenticated cleanly on {host}:{port}")
        
        msg = MIMEMultipart()
        msg['Subject'] = "Pommastore Titan Email Verification"
        msg['From'] = f"Pommastore <{user}>"
        msg['To'] = user
        msg.attach(MIMEText("Pommastore SMTP transmission verified 100%!", "html"))
        
        server.send_message(msg)
        server.quit()
        print("✅ TEST EMAIL DELIVERED SUCCESSFULLY!")
        break
    except Exception as e:
        print(f"❌ Failed for {host}:{port}: {e}")
