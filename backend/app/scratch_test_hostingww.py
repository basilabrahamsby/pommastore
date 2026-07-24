import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "Delmon@posh&sales!"
hosts = [
    ("cpanel-002-syd.hostingww.com", 465, True, False),
    ("cpanel-002-syd.hostingww.com", 587, False, True),
    ("cpanel-002-syd.hostingww.com", 25, False, False),
]

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

working = False

for host, port, use_ssl, use_tls in hosts:
    print(f"\n[TESTING] {host}:{port} (SSL={use_ssl}, TLS={use_tls})...")
    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls(context=context)
        
        server.login(user, pw)
        print(f"🎉 SUCCESS! Connected and Authenticated on {host}:{port}")
        
        msg = MIMEMultipart()
        msg['Subject'] = "Pommastore Order System Verification"
        msg['From'] = f"Pommastore <{user}>"
        msg['To'] = user
        msg.attach(MIMEText("Pommastore cPanel SMTP transmission verified 100%!", "html"))
        
        server.send_message(msg)
        server.quit()
        print("✅ TEST EMAIL SENT SUCCESSFULLY!")
        working = True
        break
    except Exception as e:
        print(f"❌ Failed for {host}:{port}: {e}")

if not working:
    print("\nResult: Authentication failed.")
