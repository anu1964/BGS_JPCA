import os, sys
from dotenv import load_dotenv

load_dotenv()

FAST2SMS_KEY = os.getenv("FAST2SMS_API_KEY")
TWILIO_SID   = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

# ── Change this to your real Indian number (no +91, just 10 digits) ──────────
TEST_PHONE = "8105819844"
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 60)
print("ZeroChain API Connection Test")
print("=" * 60)

# ── [1] Key check ─────────────────────────────────────────────────────────────
print("\n[1] Checking .env keys...")
ok = True
for name, val in [
    ("FAST2SMS_KEY",  FAST2SMS_KEY),
    ("TWILIO_SID",    TWILIO_SID),
    ("TWILIO_TOKEN",  TWILIO_TOKEN),
    ("TWILIO_PHONE",  TWILIO_PHONE),
]:
    if val:
        print(f"  {name:14s}: OK  loaded ({val[:6]}...)")
    else:
        print(f"  {name:14s}: MISSING — check backend/.env")
        ok = False

if not ok:
    print("\n  Fix .env first, then re-run this script.")
    sys.exit(1)

# ── [2] Fast2SMS SMS test ─────────────────────────────────────────────────────
import requests
print(f"\n[2] Testing Fast2SMS SMS to +91{TEST_PHONE}...")
try:
    # Use ASCII-only message to avoid encoding issues in the test
    message = (
        f"ZeroChain ALERT: Rs.65000 transaction attempted. "
        f"OTP: 123456. Do NOT share with anyone."
    )
    r = requests.post(
        "https://www.fast2sms.com/dev/bulkV2",
        headers={
            "authorization": FAST2SMS_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "route": "q",
            "message": message,
            "numbers": TEST_PHONE,
        },
        timeout=10,
    )
    resp = r.json()
    if resp.get("return") is True:
        print(f"  SMS sent successfully! Response: {resp}")
    else:
        print(f"  Fast2SMS error: {resp}")
        print("  Common fixes:")
        print("    - Check wallet balance at fast2sms.com")
        print("    - Make sure API key is correct")
        print("    - DND numbers may block promotional route — try route=otp")
except Exception as e:
    print(f"  Fast2SMS exception: {e}")

# ── [3] Twilio voice call test ────────────────────────────────────────────────
print(f"\n[3] Testing Twilio voice call to +91{TEST_PHONE}...")
try:
    from twilio.rest import Client

    AUDIO_URL = os.getenv(
        "AUDIO_OTP_URL",
        "https://raw.githubusercontent.com/anu-2027/JPCA_BGS/main/backend/audio/otp_alert.mp3",
    )

    # Fallback TTS if no audio file uploaded yet
    twiml = (
        f'<Response>'
        f'<Say voice="alice" language="en-IN">'
        f'This is a ZeroChain fraud alert. '
        f'A transaction of Rupees 65000 was attempted. '
        f'Your OTP is 1 2 3 4 5 6. Do not share with anyone.'
        f'</Say></Response>'
    )

    client = Client(TWILIO_SID, TWILIO_TOKEN)
    call = client.calls.create(
        twiml=twiml,
        to=f"+91{TEST_PHONE}",
        from_=TWILIO_PHONE,
    )
    print(f"  Call placed! SID: {call.sid}")
    print(f"  Status: {call.status}")
    print(f"  NOTE: If this is a Twilio trial account, +91{TEST_PHONE}")
    print(f"        must be verified at:")
    print(f"        https://console.twilio.com/us1/develop/phone-numbers/verified-caller-ids")

except Exception as e:
    print(f"  Twilio error: {e}")
    if "20003" in str(e):
        print("  Fix: Auth Token wrong/expired.")
        print("       Go to https://console.twilio.com → Auth Token → Regenerate")
    elif "21608" in str(e):
        print("  Fix: Number not verified for trial account!")
        print("       Go to: https://console.twilio.com/us1/develop/phone-numbers/verified-caller-ids")
        print(f"       Add +91{TEST_PHONE} and verify it.")
    elif "21214" in str(e):
        print("  Fix: 'To' number is not a valid phone number format.")

print("\n" + "=" * 60)
print("Test complete.")
print("=" * 60)