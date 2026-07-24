import smtplib

host = "mail.poshgallery.ae"
port = 465
pw = "pomma@posh&sales!"
usernames = [
    "sales@poshgallery.ae",
    "sales+poshgallery.ae",
    "sales",
    "poshgallery"
]

for user in usernames:
    print(f"Testing username: '{user}' on {host}:{port}...")
    try:
        server = smtplib.SMTP_SSL(host, port, timeout=5)
        server.login(user, pw)
        print(f"✅ SUCCESS! Correct Username is: '{user}'")
        server.quit()
        break
    except Exception as e:
        print(f"❌ Failed for '{user}': {e}")
