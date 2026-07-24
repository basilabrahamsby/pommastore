import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Sending test OTP from sales@poshgallery.ae...")
res1 = send_otp_email("sales@poshgallery.ae", "554433")
print("RESULT TO sales@poshgallery.ae:", res1)

res2 = send_otp_email("basilabrahamsby@gmail.com", "554433")
print("RESULT TO basilabrahamsby@gmail.com:", res2)
