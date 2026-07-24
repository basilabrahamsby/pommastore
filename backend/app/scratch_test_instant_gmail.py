import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Sending instant OTP via Gmail SMTP to basilabrahamsby@gmail.com...")
res = send_otp_email("basilabrahamsby@gmail.com", "991122")
print("RESULT:", res)
