import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "Delmon@posh&sales!"
host = "mail.poshgallery.ae"
port = 465

print(f"Connecting to cPanel SMTP {host}:{port}...")

# Create unverified SSL context to handle cPanel self-signed / wildcard certs
context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

try:
    server = smtplib.SMTP_SSL(host, port, context=context, timeout=10)
    server.login(user, pw)
    print("🎉 SUCCESS! Authenticated cleanly with cPanel Mail!")
    
    msg = MIMEMultipart()
    msg['Subject'] = "Pommastore Order Email System Check"
    msg['From'] = f"Pommastore <{user}>"
    msg['To'] = user
    msg.attach(MIMEText("Pommastore cPanel SMTP transmission verified 100%!", "html"))
    
    server.send_message(msg)
    server.quit()
    print("✅ TEST EMAIL SENT SUCCESSFULLY VIA CPANEL MAIL!")
except Exception as e:
    print(f"❌ cPanel SMTP Test Failed: {e}")
