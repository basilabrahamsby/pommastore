import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "Delmon@posh&sales!"
host = "cpanel-002-syd.hostingww.com"
port = 465

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

recipients = ["sales@poshgallery.ae", "basilabrahamsby@gmail.com"]

for recipient in recipients:
    print(f"\n[TESTING] Sending from {user} to {recipient} via {host}:{port}...")
    try:
        server = smtplib.SMTP_SSL(host, port, context=context, timeout=12)
        server.login(user, pw)
        
        msg = MIMEMultipart()
        msg['Subject'] = f"Pommastore Test Email to {recipient}"
        msg['From'] = f"Pommastore <{user}>"
        msg['To'] = recipient
        msg.attach(MIMEText(f"This is a live test email sent to {recipient}.", "html"))
        
        server.send_message(msg)
        server.quit()
        print(f"🎉 SUCCESS! Email dispatched to {recipient} cleanly.")
    except Exception as e:
        print(f"❌ Failed to {recipient}: {e}")
