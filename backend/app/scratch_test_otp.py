import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Testing send_otp_email...")
res = send_otp_email("sales@poshgallery.ae", "889900")
print("OTP EMAIL TRANSMISSION RESULT:", res)
