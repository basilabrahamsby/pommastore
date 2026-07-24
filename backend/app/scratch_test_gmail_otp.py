import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Sending OTP to basilabrahamsby@gmail.com...")
res = send_otp_email("basilabrahamsby@gmail.com", "778899")
print("RESULT:", res)
