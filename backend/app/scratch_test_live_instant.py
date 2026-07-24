import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Sending instant OTP to basilabrahamsby@gmail.com...")
res = send_otp_email("basilabrahamsby@gmail.com", "559922")
print("INSTANT OTP RESULT:", res)
