import os
import logging
from twilio.rest import Client

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def send_leave_sms(student_name: str, start_date: str, end_date: str, reason: str, to_phone: str = None) -> bool:
    """
    Sends an SMS notification using Twilio when a new leave request is submitted.
    Uses environment variables for configuration.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "ACb417aacbd8bb03d74eec9c13a1ec51fd")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "cc86bef3032402a837cf3e980484a391")
    from_phone = os.getenv("TWILIO_PHONE_NUMBER", "+12602613182")
    
    # If a specific recipient is not provided, fallback
    if not to_phone:
        to_phone = os.getenv("FACULTY_PHONE_NUMBER", "+919486783749")
        
    # Ensure phone number is in E.164 format (starts with +)
    # Default to +91 if it's a 10-digit number
    if to_phone:
        to_phone = to_phone.strip()
        if len(to_phone) == 10 and to_phone.isdigit():
            to_phone = f"+91{to_phone}"
        elif not to_phone.startswith("+"):
            to_phone = f"+{to_phone}"
            
    if not all([account_sid, auth_token, from_phone, to_phone]):
        logger.warning(f"Twilio SMS not sent: Missing env vars. SID: {'Yes' if account_sid else 'No'}, Token: {'Yes' if auth_token else 'No'}, From: {from_phone}, To: {to_phone}")
        return False
        
    message_body = (
        f"New Leave Request:\n"
        f"Student: {student_name}\n"
        f"From: {start_date}\n"
        f"To: {end_date}\n"
        f"Reason: {reason}"
    )

    try:
        logger.info(f"Attempting to send SMS to {to_phone} using Twilio SID {account_sid[:5]}...")
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_body,
            from_=from_phone,
            to=to_phone
        )
        logger.info(f"Twilio SMS sent successfully. Message SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Twilio SMS to {to_phone}: {e}")
        return False

def send_otp_sms(student_name: str, otp_code: str, to_phone: str = None) -> bool:
    """
    Sends an OTP SMS to the parent.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "ACb417aacbd8bb03d74eec9c13a1ec51fd")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "cc86bef3032402a837cf3e980484a391")
    from_phone = os.getenv("TWILIO_PHONE_NUMBER", "+12602613182")
    
    if not to_phone:
        to_phone = os.getenv("FACULTY_PHONE_NUMBER", "+919486783749")
        
    if not all([account_sid, auth_token, from_phone, to_phone]):
        logger.warning("Twilio OTP SMS not sent: Missing env vars.")
        return False
        
    message_body = (
        f"Leave Request Verification:\n"
        f"Your ward {student_name} is applying for a leave. "
        f"Provide them this OTP to confirm: {otp_code}"
    )

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_body,
            from_=from_phone,
            to=to_phone
        )
        logger.info(f"Twilio OTP SMS sent successfully. Message SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Twilio OTP SMS: {e}")
        return False

def send_silent_leave_sms(student_name: str, to_phone: str = None) -> bool:
    """
    Sends an SMS to the parent when a student is marked absent without leave.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "ACb417aacbd8bb03d74eec9c13a1ec51fd")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "cc86bef3032402a837cf3e980484a391")
    from_phone = os.getenv("TWILIO_PHONE_NUMBER", "+12602613182")
    
    if not to_phone:
        to_phone = os.getenv("FACULTY_PHONE_NUMBER", "+919486783749")
        
    message_body = f"URGENT: Your ward {student_name} is marked ABSENT without an approved leave today. Please contact the hostel office."

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=message_body,
            from_=from_phone,
            to=to_phone
        )
        logger.info(f"Twilio Silent Leave SMS sent. Message SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Twilio Silent Leave SMS: {e}")
        return False
