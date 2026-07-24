import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "pomma@posh&sales!"

configs = [
    ("mail.poshgallery.ae", 465, True, False),
    ("mail.poshgallery.ae", 587, False, True),
    ("smtp.titan.email", 465, True, False),
    ("smtp.titan.email", 587, False, True),
]

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

working = False

for host, port, use_ssl, use_tls in configs:
    print(f"Testing {host}:{port} (SSL={use_ssl}, TLS={use_tls})...")
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=8)
        else:
            server = smtplib.SMTP(host, port, timeout=8)
            if use_tls:
                server.starttls(context=context)
        
        server.login(user, pw)
        print(f"🎉 SUCCESS! Connected and Authenticated on {host}:{port}")
        
        msg = MIMEMultipart()
        msg['Subject'] = "Pommastore Webmail Verification"
        msg['From'] = f"Pommastore <{user}>"
        msg['To'] = user
        msg.attach(MIMEText("Pommastore Webmail SMTP verified successfully!", "html"))
        
        server.send_message(msg)
        server.quit()
        print("✅ EMAIL DELIVERED SUCCESSFULLY!")
        working = True
        break
    except Exception as e:
        print(f"❌ Failed on {host}:{port}: {e}")

if not working:
    print("\nResult: All hosts returned authentication error for pomma@posh&sales!")
