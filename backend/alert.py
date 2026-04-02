import os
import random
import time
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_SID   = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

AUDIO_OTP_URL    = "https://raw.githubusercontent.com/anu-2027/JPCA_BGS/main/backend/audio/otp_alert.mp3"
AUDIO_ATTACK_URL = "https://raw.githubusercontent.com/anu-2027/JPCA_BGS/main/backend/audio/attack_alert.mp3"

# In-memory OTP store: { user_id: { otp, sent_at, registration_ip, attempts } }
otp_store = {}

def _twilio_client():
    return Client(TWILIO_SID, TWILIO_TOKEN)

def generate_otp():
    return str(random.randint(100000, 999999))

# -- SMS OTP via Twilio -------------------------------------------------------
def send_sms_otp(phone: str, otp: str, amount: float):
    message = (
        f"ZeroChain ALERT: Rs.{amount:,.0f} transaction attempted on your account. "
        f"OTP: {otp}. "
        f"Do NOT share this OTP with anyone. "
        f"If you did not make this transaction, contact your bank immediately."
    )
    try:
        client = _twilio_client()
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE,
            to=f"+91{phone}",
        )
        print(f"[SMS] Sent to +91{phone} | SID: {msg.sid} | Status: {msg.status}")
        return {"status": "sent", "sid": msg.sid}
    except Exception as e:
        print(f"[SMS] Error: {e}")
        return {"status": "error", "error": str(e)}

# -- Voice Call via Twilio with recorded Kannada audio -----------------------
def send_voice_call(phone: str, otp: str, amount: float):
    # Use recorded Kannada audio from GitHub
    audio_url = AUDIO_ATTACK_URL if otp == "000000" else AUDIO_OTP_URL

    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Play>{audio_url}</Play></Response>'

    try:
        client = _twilio_client()
        call = client.calls.create(
            twiml=twiml,
            to=f"+91{phone}",
            from_=TWILIO_PHONE,
        )
        print(f"[VOICE] Call placed to +91{phone} | SID: {call.sid} | Status: {call.status}")
        return {"status": "connected", "call_sid": call.sid}
    except Exception as e:
        print(f"[VOICE] Error: {e}")
        return {"status": "simulated", "message": f"[DEMO] Voice alert to +91{phone}"}

# -- OTP Store helpers --------------------------------------------------------
def store_otp(user_id: str, otp: str, registration_ip: str):
    otp_store[user_id] = {
        "otp":             otp,
        "sent_at":         time.time(),
        "registration_ip": registration_ip,
        "attempts":        0,
        "verified":        False,
    }

def verify_otp(user_id: str, entered_otp: str, verify_ip: str):
    record = otp_store.get(user_id)
    if not record:
        return {"valid": False, "reason": "No OTP found for this user", "attack_type": "NO_OTP"}

    elapsed = time.time() - record["sent_at"]

    # Check 1: Expiry (5 minutes)
    if elapsed > 300:
        del otp_store[user_id]
        return {"valid": False, "reason": "OTP expired (5 min limit)", "attack_type": "EXPIRED"}

    # Check 2: Rate limit (max 3 attempts)
    record["attempts"] += 1
    if record["attempts"] > 3:
        del otp_store[user_id]
        return {
            "valid":       False,
            "reason":      "Too many OTP attempts. Account blocked.",
            "attack_type": "RATE_LIMIT",
        }

    # Check 3: Speed check (< 8 seconds = bot/automated attack)
    if elapsed < 8:
        return {
            "valid":       False,
            "reason":      f"OTP submitted too fast ({round(elapsed, 1)}s). Possible automated attack.",
            "attack_type": "TOO_FAST",
        }

    # Check 4: OTP match
    if record["otp"] != entered_otp:
        return {"valid": False, "reason": "Wrong OTP", "attack_type": "WRONG_OTP"}

    # Check 5: IP mismatch - SIM swap / OTP relay detection
    if record["registration_ip"] != verify_ip:
        return {
            "valid":           False,
            "reason":          "IP mismatch - OTP submitted from a different device than the transaction.",
            "attack_type":     "OTP_RELAY",
            "registration_ip": record["registration_ip"],
            "verify_ip":       verify_ip,
        }

    # All checks passed
    del otp_store[user_id]
    return {"valid": True, "reason": "OTP verified successfully"}