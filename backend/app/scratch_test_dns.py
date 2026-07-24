import socket
import smtplib

for host in ["mail.poshgallery.ae", "poshgallery.ae", "smtp.poshgallery.ae"]:
    try:
        ip = socket.gethostbyname(host)
        print(f"HOST: {host} -> IP: {ip}")
    except Exception as e:
        print(f"HOST: {host} -> DNS FAIL: {e}")

for port in [465, 587, 25]:
    try:
        s = socket.create_connection(("mail.poshgallery.ae", port), timeout=5)
        print(f"PORT {port} -> CONNECTED!")
        s.close()
    except Exception as e:
        print(f"PORT {port} -> FAIL: {e}")
