import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Dispatching live cPanel Webmail OTP from sales@poshgallery.ae...")
res1 = send_otp_email("sales@poshgallery.ae", "771122")
print("RESULT TO WEBMALL (sales@poshgallery.ae):", res1)

res2 = send_otp_email("basilabrahamsby@gmail.com", "771122")
print("RESULT TO GMAIL (basilabrahamsby@gmail.com):", res2)
