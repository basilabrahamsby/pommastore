import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

user = "sales@poshgallery.ae"
pw = "pomma@posh&sales!"
hosts = [
    ("mail.poshgallery.ae", 587, "TLS"),
    ("mail.poshgallery.ae", 465, "SSL"),
    ("poshgallery.ae", 587, "TLS"),
    ("poshgallery.ae", 465, "SSL"),
]

for host, port, mode in hosts:
    print(f"\n--- Testing {host}:{port} ({mode}) ---")
    try:
        if mode == "SSL":
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            server.starttls()
        
        server.login(user, pw)
        print(f"SUCCESS AUTHENTICATING ON {host}:{port} ({mode})!")
        
        msg = MIMEMultipart()
        msg['Subject'] = "Pommastore SMTP Test"
        msg['From'] = f"Pommastore <{user}>"
        msg['To'] = user
        msg.attach(MIMEText("SMTP connection successful!", "plain"))
        server.send_message(msg)
        server.quit()
        print("EMAIL SENT SUCCESSFULLY!")
        break
    except Exception as e:
        print(f"FAILED on {host}:{port} ({mode}): {e}")
