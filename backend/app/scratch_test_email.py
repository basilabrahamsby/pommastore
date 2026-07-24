import smtplib

user = "sales@poshgallery.ae"
pw = "pomma@posh&sales!"

hosts = [
    "mail.poshgallery.ae",
    "poshgallery.ae",
    "cpanel-002-syd.hosting.onlydomains.com",
    "syd-cpanel002.onlydomains.com",
    "cpanel.poshgallery.ae"
]

for host in hosts:
    print(f"Testing host: {host}:465...")
    try:
        server = smtplib.SMTP_SSL(host, 465, timeout=5)
        server.login(user, pw)
        print(f"✅ SUCCESS! Connected & Authenticated on: {host}")
        server.quit()
        break
    except Exception as e:
        print(f"❌ Failed for {host}: {e}")
