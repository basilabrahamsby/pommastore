import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "info@kozmocart.com"
pw = "boxr xytu ycye snof"
host = "smtp.gmail.com"
port = 587

print(f"Connecting to Gmail SMTP {host}:{port} for {user}...")

try:
    server = smtplib.SMTP(host, port, timeout=10)
    server.starttls()
    server.login(user, pw)
    print("🎉 SUCCESS! Authenticated cleanly with Gmail info@kozmocart.com!")
    
    msg = MIMEMultipart()
    msg['Subject'] = "Pommastore Order Email System Check"
    msg['From'] = f"Pommastore <{user}>"
    msg['To'] = user
    msg.attach(MIMEText("Pommastore Gmail SMTP transmission verified 100%!", "html"))
    
    server.send_message(msg)
    server.quit()
    print("✅ TEST EMAIL SENT SUCCESSFULLY VIA GMAIL (info@kozmocart.com)!")
except Exception as e:
    print(f"❌ Gmail SMTP Test Failed: {e}")
