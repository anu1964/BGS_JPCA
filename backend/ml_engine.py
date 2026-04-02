import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime

_TRAIN = np.array([
    [9,  0.1, 1, 0.1],  [10, 0.2, 1, 0.1], [11, 0.15, 2, 0.1],
    [14, 0.3, 1, 0.2],  [15, 0.25, 1, 0.1],[16, 0.2,  2, 0.1],
    [9,  0.4, 2, 0.2],  [10, 0.35, 1, 0.1],[11, 0.3,  1, 0.1],
    [10, 0.1, 1, 0.05], [14, 0.2,  2, 0.1],[15, 0.15, 1, 0.1],
    [9,  0.05,1, 0.05], [11, 0.1,  1, 0.1],[13, 0.2,  2, 0.1],
    [16, 0.3, 1, 0.2],  [10, 0.4,  1, 0.2],[14, 0.25, 2, 0.1],
])

_MODEL = IsolationForest(n_estimators=100, contamination=0.2, random_state=42)
_MODEL.fit(_TRAIN)

# -- Thresholds ---------------------------------------------------------------
ALERT_THRESHOLD = 15000   # OTP + Voice fires above this
WARN_THRESHOLD  = 10000   # Screen warning between this and ALERT_THRESHOLD

def _amount_risk(amount):
    if amount <= 1000:   return 0.02
    if amount <= 5000:   return 0.05
    if amount <= 10000:  return 0.1
    if amount <= 15000:  return 0.3
    return 0.9


def analyze(transaction_hour: int, amount: float, login_count: int, last_access_time: int):
    login_count      = login_count or 0
    last_access_time = last_access_time or 0

    now           = int(datetime.now().timestamp())
    time_diff_hrs = (now - last_access_time) / 3600 if last_access_time > 0 else 24
    login_freq    = round(login_count / max(time_diff_hrs, 1), 4)

    ar       = _amount_risk(amount)
    features = np.array([[transaction_hour, ar, login_count, login_freq]])
    raw      = float(_MODEL.score_samples(features)[0])

    anomaly_score = round(max(0, min(100, (raw + 0.5) * -100)), 1)

    # -- User stage -----------------------------------------------------------
    # NEW:         0-1  transactions → log only
    # LEARNING:    2-3  transactions → screen warning only
    # ESTABLISHED: 4+   transactions → OTP + call if amount > ₹15,000
    if login_count <= 1:
        user_stage = "NEW"
    elif login_count <= 3:
        user_stage = "LEARNING"
    else:
        user_stage = "ESTABLISHED"

    # -- Amount-only decision logic -------------------------------------------
    # ONLY the transaction amount decides the action.
    # Login frequency / AI model are used for anomaly score display only.
    # This prevents false alerts on small amounts like ₹20, ₹600, ₹6000.

    amount_triggers_otp  = amount > ALERT_THRESHOLD   # above ₹15,000
    amount_triggers_warn = amount > WARN_THRESHOLD     # above ₹10,000

    # Build reasons for display
    reasons = []
    if amount > ALERT_THRESHOLD:
        reasons.append(f"High-value transaction above ₹{ALERT_THRESHOLD:,}")
    elif amount > WARN_THRESHOLD:
        reasons.append(f"Moderate transaction above ₹{WARN_THRESHOLD:,}")
    else:
        reasons.append("Transaction within normal parameters")

    if transaction_hour < 6 or transaction_hour > 22:
        reasons.append("Unusual hour — outside banking hours")

    # -- Decide action --------------------------------------------------------
    if user_stage == "NEW":
        is_fraud      = False
        action        = "LOG_ONLY"
        threat        = "LOW"
        stage_message = (
            f"New user ({login_count} txn). Building behaviour baseline. "
            f"Make {2 - login_count} more transactions to activate warnings."
        )

    elif user_stage == "LEARNING":
        is_fraud      = False
        action        = "WARN_SCREEN" if amount_triggers_otp else "LOG_ONLY"
        threat        = "MEDIUM" if amount_triggers_otp else "LOW"
        stage_message = (
            f"Learning stage ({login_count} txns). "
            f"Screen warning only — OTP and voice call activate after 4 transactions."
        )

    else:  # ESTABLISHED (4+ txns)
        if amount_triggers_otp:
            # Above ₹15,000 → full fraud alert
            is_fraud = True
            action   = "OTP_AND_CALL"
            threat   = "HIGH"
            stage_message = (
                f"Established user ({login_count} txns). "
                f"Amount ₹{amount:,.0f} exceeds ₹{ALERT_THRESHOLD:,} — "
                f"OTP + Voice call fired."
            )
        elif amount_triggers_warn:
            # Between ₹10,000-₹15,000 → screen warning only
            is_fraud = False
            action   = "WARN_SCREEN"
            threat   = "MEDIUM"
            stage_message = (
                f"Established user ({login_count} txns). "
                f"Amount ₹{amount:,.0f} is above ₹{WARN_THRESHOLD:,} — "
                f"screen warning issued."
            )
        else:
            # Below ₹10,000 → always approved, no alert
            is_fraud = False
            action   = "APPROVED"
            threat   = "LOW"
            stage_message = (
                f"Established user ({login_count} txns). "
                f"Amount ₹{amount:,.0f} is within safe limit — transaction approved."
            )

    return {
        "is_fraud":        is_fraud,
        "action":          action,
        "user_stage":      user_stage,
        "stage_message":   stage_message,
        "label":           "FRAUD" if is_fraud else ("SUSPICIOUS" if action == "WARN_SCREEN" else "NORMAL"),
        "threat_level":    threat,
        "anomaly_score":   anomaly_score,
        "reasons":         reasons,
        "amount":          amount,
        "alert_threshold": ALERT_THRESHOLD,
        "features": {
            "transaction_hour": transaction_hour,
            "amount_risk":      round(ar, 2),
            "login_count":      login_count,
            "login_frequency":  login_freq,
        },
    }