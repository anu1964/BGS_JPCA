from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import blockchain, ml_engine, alert

app = FastAPI(title="ZeroChain Rural Banking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# Track registration IPs: { user_id: ip }
registration_ips = {}


# ── Request models ────────────────────────────────────────────────────────────
class RegisterReq(BaseModel):
    user_id: str
    name:    str
    phone:   str
    region:  str

class AccessReq(BaseModel):
    user_id:  str
    amount:   float
    language: str = "kn"   # default Kannada for rural users

class OTPVerifyReq(BaseModel):
    user_id:     str
    entered_otp: str


# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/register")
async def register(req: RegisterReq, request: Request):
    try:
        if blockchain.is_registered(req.user_id):
            raise HTTPException(400, "User already registered on blockchain")

        client_ip = request.client.host
        tx = blockchain.register_on_chain(req.user_id, req.name, req.phone, req.region)
        registration_ips[req.user_id] = client_ip

        return {
            "status":          "SUCCESS",
            "user_id":         req.user_id,
            "tx_hash":         tx,
            "stored_on_chain": True,
            "message":         f"{req.name} registered on blockchain ✅",
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))


@app.get("/verify/{user_id}")
async def verify(user_id: str):
    try:
        identity = blockchain.get_identity(user_id)
        if not identity["isRegistered"]:
            raise HTTPException(404, "Not found on blockchain")
        return {"status": "VERIFIED", "identity": identity, "source": "BLOCKCHAIN"}
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))


@app.post("/access")
async def access(req: AccessReq, request: Request):
    try:
        if not blockchain.is_registered(req.user_id):
            raise HTTPException(404, "User not registered on blockchain")

        identity    = blockchain.get_identity(req.user_id)
        hour        = datetime.now().hour
        client_ip   = request.client.host

        # Safe defaults — new users have 0 for these
        login_count      = identity.get("loginCount", 0) or 0
        last_access_time = identity.get("lastAccessTime", 0) or 0

        result = ml_engine.analyze(
            transaction_hour = hour,
            amount           = req.amount,
            login_count      = login_count,
            last_access_time = last_access_time,
        )

        # Always record access on-chain to build behaviour history
        blockchain.record_access(req.user_id)

        otp          = None
        sms_result   = None
        voice_result = None

        action = result.get("action", "APPROVED")

        if action == "OTP_AND_CALL":
            # Full fraud — flag on chain, fire OTP + voice
            blockchain.flag_user(req.user_id)
            otp     = alert.generate_otp()
            reg_ip  = registration_ips.get(req.user_id, client_ip)
            alert.store_otp(req.user_id, otp, reg_ip)
            sms_result   = alert.send_sms_otp(identity["phone"], otp, req.amount)
            voice_result = alert.send_voice_call(identity["phone"], otp, req.amount)
            status = "DENIED"

        elif action == "WARN_SCREEN":
            # Suspicious but not enough history — warn on screen, no OTP/call
            status = "SUSPICIOUS"

        else:
            # LOG_ONLY (new user building baseline) or APPROVED
            status = "APPROVED"

        return {
            "status":          status,
            "fraud_detected":  action == "OTP_AND_CALL",
            "action":          action,
            "user_id":         req.user_id,
            "name":            identity["name"],
            "region":          identity["region"],
            "phone_last4":     identity["phone"][-4:],
            "analysis":        result,
            "anomaly_score":   result["anomaly_score"],
            "user_stage":      result["user_stage"],
            "stage_message":   result["stage_message"],
            "otp_sent":        otp is not None,
            "sms_status":      sms_result,
            "voice_status":    voice_result,
            "data_source":     "BLOCKCHAIN",
            "timestamp":       datetime.now().isoformat(),
        }
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))


@app.post("/verify-otp")
async def verify_otp(req: OTPVerifyReq, request: Request):
    """
    OTP verification with SIM swap / OTP relay attack detection.

    SIM Swap / OTP Relay detection logic:
    ─────────────────────────────────────
    1. IP mismatch  — OTP submitted from a different IP than the device
                      that triggered the fraud check → possible SIM swap
                      or OTP relay (hacker tricked granny to read OTP aloud)

    2. Speed check  — OTP submitted in < 8 seconds → bot/automated attack,
                      no human reads SMS and types that fast

    3. Rate limit   — More than 3 OTP attempts for same user → brute force,
                      block immediately

    4. Expiry       — OTP older than 5 minutes → expired, reject
    """
    try:
        client_ip = request.client.host
        result    = alert.verify_otp(req.user_id, req.entered_otp, client_ip)

        if not result["valid"]:
            attack_type = result.get("attack_type", "WRONG_OTP")

            # For any attack — flag and fire another warning call
            if attack_type in ("OTP_RELAY", "TOO_FAST", "RATE_LIMIT"):
                try:
                    blockchain.flag_user(req.user_id)
                    identity = blockchain.get_identity(req.user_id)
                    alert.send_voice_call(identity["phone"], "000000", 0)
                except Exception:
                    pass

            return {
                "status":          "BLOCKED",
                "valid":           False,
                "reason":          result["reason"],
                "attack_type":     attack_type,
                "registered_ip":   result.get("registration_ip"),
                "verify_ip":       client_ip,
            }

        return {
            "status":  "TRANSACTION_CONFIRMED",
            "valid":   True,
            "message": "OTP verified. Transaction approved.",
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/chain/status")
async def status():
    try: return blockchain.chain_status()
    except Exception as e: raise HTTPException(500, str(e))