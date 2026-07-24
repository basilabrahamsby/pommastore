import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "pomma@posh&sales!"

test_configs = [
    # (host, port, use_ssl, use_tls)
    ("mail.poshgallery.ae", 465, True, False),
    ("mail.poshgallery.ae", 587, False, True),
    ("mail.poshgallery.ae", 25, False, False),
    ("mail.poshgallery.ae", 25, False, True),
    ("poshgallery.ae", 465, True, False),
    ("poshgallery.ae", 587, False, True),
]

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

working_config = None

for host, port, use_ssl, use_tls in test_configs:
    print(f"\n[TESTING] {host}:{port} (SSL={use_ssl}, TLS={use_tls})...")
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
        msg['Subject'] = "Pommastore Order Email System Check"
        msg['From'] = f"Pommastore <{user}>"
        msg['To'] = user
        msg.attach(MIMEText("Pommastore SMTP transmission verified 100%!", "html"))
        
        server.send_message(msg)
        server.quit()
        print("✅ TEST EMAIL DELIVERED SUCCESSFULLY!")
        working_config = (host, port, use_ssl, use_tls)
        break
    except Exception as e:
        print(f"❌ Failed: {e}")

if not working_config:
    print("\n⚠️ None of the SMTP configs authenticated with password 'pomma@posh&sales!'.")
