from app.services.email import send_smtp_email

if __name__ == "__main__":
    to_email = "basilabrahamsby@gmail.com"
    subject = "Pommastore Luxury Fragrances — Test Email 🌟"
    body_html = """
    <div style="font-family:'Montserrat',sans-serif;max-width:550px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #eae6df;border-radius:6px;">
      <h2 style="font-family:'Playfair Display',serif;color:#1a1a1a;margin-top:0;">Hello Basil! 👋</h2>
      <p style="color:#444;font-size:14px;line-height:1.6;">
        This is a live test email sent directly from <strong>sales@poshgallery.ae</strong> via standard Google Workspace SMTP.
      </p>
      <div style="background:#faf8f5;padding:16px;border-left:4px solid #d2168d;margin:20px 0;border-radius:4px;">
        <p style="margin:0;font-size:13px;color:#222;font-weight:600;">Status: SMTP Fully Connected & Authenticated ✅</p>
      </div>
      <p style="color:#888;font-size:12px;">Pommastore Luxury Fragrance House — Dubai, UAE</p>
    </div>
    """
    body_text = "Hello Basil! This is a test email sent from sales@poshgallery.ae. Everything is working perfectly!"
    
    print(f"Sending test email to {to_email}...")
    res = send_smtp_email(to_email, subject, body_html, body_text)
    print(f"✓ DELIVERY RESULT FOR {to_email}: {res}")
