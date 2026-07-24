import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email import send_otp_email

print("Dispatching live cPanel Webmail OTP from sales@poshgallery.ae...")
res = send_otp_email("sales@poshgallery.ae", "662288")
print("RESULT TO WEBMALL (sales@poshgallery.ae):", res)

res2 = send_otp_email("basilabrahamsby@gmail.com", "662288")
print("RESULT TO GMAIL (basilabrahamsby@gmail.com):", res2)
