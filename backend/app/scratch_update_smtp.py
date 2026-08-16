import smtplib
import ssl

def test_auth(user, pwd):
    print(f"Testing SMTP login for {user} with password: '{pwd}'...")
    try:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls(context=context)
        server.login(user, pwd)
        print(f"✓ LOGIN SUCCESSFUL for '{pwd}'!")
        server.quit()
        return True
    except Exception as e:
        print(f"✗ LOGIN FAILED for '{pwd}': {e}")
        return False

if __name__ == "__main__":
    user = "sales@poshgallery.ae"
    test_auth(user, "wbhnfnixltdmagk")
    test_auth(user, "wbhh nfni xltd magk")
