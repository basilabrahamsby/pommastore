import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "pomma@posh&sales!"
host = "smtp.titan.email"
port = 465

print(f"Connecting to Titan Email SMTP: {host}:{port} (SSL)...")

try:
    context = ssl.create_default_context()
    server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
    server.login(user, pw)
    print("🎉 SUCCESS! Authenticated cleanly with Titan Email!")
    
    msg = MIMEMultipart()
    msg['Subject'] = "Pommastore Titan SMTP Verification"
    msg['From'] = f"Pommastore <{user}>"
    msg['To'] = user
    msg.attach(MIMEText("Pommastore Titan Email SMTP transmission verified 100%!", "html"))
    
    server.send_message(msg)
    server.quit()
    print("✅ TEST EMAIL SENT SUCCESSFULLY VIA TITAN EMAIL!")
except Exception as e:
    print(f"❌ Titan SMTP Test Failed: {e}")
