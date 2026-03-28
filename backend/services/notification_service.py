"""
Notification Service for SMS and Email
- In development: Logs OTP to console
- In production: Uses Twilio (SMS) and Resend (Email)
"""

import os
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Check for API keys
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Development mode - no real SMS/Email sent
DEV_MODE = not (TWILIO_ACCOUNT_SID and RESEND_API_KEY)

if DEV_MODE:
    logger.info("📱 Notification Service running in DEVELOPMENT mode (OTP logged to console)")
else:
    logger.info("📱 Notification Service running in PRODUCTION mode")


async def send_sms_otp(phone: str, otp: str) -> dict:
    """
    Send OTP via SMS
    - Dev mode: Logs to console
    - Prod mode: Uses Twilio
    """
    message = f"Your ApnaGhr password reset OTP is: {otp}. Valid for 10 minutes. Do not share with anyone."
    
    if DEV_MODE or not TWILIO_ACCOUNT_SID:
        # Development mode - log to console
        print(f"\n{'='*50}")
        print(f"📱 SMS OTP (Dev Mode)")
        print(f"To: +91{phone}")
        print(f"OTP: {otp}")
        print(f"{'='*50}\n")
        logger.info(f"[DEV] SMS OTP for {phone}: {otp}")
        return {
            "success": True,
            "mode": "development",
            "message": "OTP logged to console (SMS not sent in dev mode)",
            "otp_for_testing": otp
        }
    
    try:
        # Production mode - use Twilio
        from twilio.rest import Client
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        sms = await asyncio.to_thread(
            client.messages.create,
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=f"+91{phone}"
        )
        
        logger.info(f"SMS sent to {phone}, SID: {sms.sid}")
        return {
            "success": True,
            "mode": "production",
            "message_sid": sms.sid
        }
        
    except Exception as e:
        logger.error(f"SMS failed: {str(e)}")
        # Fallback to dev mode on error
        print(f"\n[SMS FALLBACK] OTP for {phone}: {otp}\n")
        return {
            "success": False,
            "mode": "fallback",
            "error": str(e),
            "otp_for_testing": otp
        }


async def send_email_otp(email: str, otp: str, user_name: str = "User") -> dict:
    """
    Send OTP via Email
    - Dev mode: Logs to console
    - Prod mode: Uses Resend
    """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #FAF9F6; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; border: 2px solid #111111; box-shadow: 4px 4px 0px #111111; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #FF5A5F; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                    <span style="font-size: 32px;">🏠</span>
                </div>
                <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #111111;">
                    Apna<span style="color: #FF5A5F;">Ghr</span>
                </h1>
            </div>
            
            <h2 style="font-size: 20px; color: #111111; margin-bottom: 16px;">
                Password Reset Request
            </h2>
            
            <p style="color: #52525B; margin-bottom: 24px;">
                Hi {user_name},<br><br>
                You requested to reset your password. Use the OTP below to continue:
            </p>
            
            <div style="background: #FFD166; border: 2px solid #111111; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="font-size: 14px; color: #111111; margin: 0 0 8px 0;">Your OTP Code</p>
                <p style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #111111; margin: 0;">
                    {otp}
                </p>
            </div>
            
            <p style="color: #52525B; font-size: 14px; margin-bottom: 24px;">
                ⏰ This OTP is valid for <strong>10 minutes</strong>.<br>
                🔒 Do not share this code with anyone.
            </p>
            
            <hr style="border: none; border-top: 1px solid #E5E3D8; margin: 24px 0;">
            
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                If you didn't request this, please ignore this email.<br>
                © 2026 ApnaGhr. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    
    if DEV_MODE or not RESEND_API_KEY:
        # Development mode - log to console
        print(f"\n{'='*50}")
        print(f"📧 EMAIL OTP (Dev Mode)")
        print(f"To: {email}")
        print(f"OTP: {otp}")
        print(f"{'='*50}\n")
        logger.info(f"[DEV] Email OTP for {email}: {otp}")
        return {
            "success": True,
            "mode": "development",
            "message": "OTP logged to console (Email not sent in dev mode)",
            "otp_for_testing": otp
        }
    
    try:
        # Production mode - use Resend
        import resend
        resend.api_key = RESEND_API_KEY
        
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "🔐 ApnaGhr - Password Reset OTP",
            "html": html_content
        }
        
        result = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Email sent to {email}, ID: {result.get('id')}")
        return {
            "success": True,
            "mode": "production",
            "email_id": result.get("id")
        }
        
    except Exception as e:
        logger.error(f"Email failed: {str(e)}")
        # Fallback to dev mode on error
        print(f"\n[EMAIL FALLBACK] OTP for {email}: {otp}\n")
        return {
            "success": False,
            "mode": "fallback",
            "error": str(e),
            "otp_for_testing": otp
        }


def get_notification_status() -> dict:
    """Get current notification service status"""
    return {
        "sms_enabled": bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN),
        "email_enabled": bool(RESEND_API_KEY),
        "dev_mode": DEV_MODE,
        "sms_provider": "Twilio" if TWILIO_ACCOUNT_SID else "Console (Dev)",
        "email_provider": "Resend" if RESEND_API_KEY else "Console (Dev)"
    }
