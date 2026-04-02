import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8001";

/* ── Scanline / grid background ─────────────────────────────── */
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #020812;
    --bg2:      #040f1e;
    --bg3:      #071628;
    --panel:    #061220;
    --border:   #0d2d4a;
    --border2:  #0f3a60;
    --cyan:     #00d4ff;
    --cyan2:    #00aacc;
    --green:    #00ff88;
    --red:      #ff2244;
    --amber:    #ffaa00;
    --text:     #c8e6f5;
    --text2:    #5a8faa;
    --text3:    #2a5f7a;
    --font-mono: 'Share Tech Mono', monospace;
    --font-hud:  'Orbitron', monospace;
    --font-body: 'Rajdhani', sans-serif;
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,212,255,0.02) 40px, rgba(0,212,255,0.02) 41px);
    pointer-events: none;
    z-index: 0;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 30px var(--panel) inset !important;
    -webkit-text-fill-color: var(--cyan) !important;
  }

  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes pulse-border {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0); }
    50%       { box-shadow: 0 0 0 3px rgba(0,212,255,0.15); }
  }
  @keyframes flicker {
    0%, 95%, 100% { opacity: 1; }
    96%           { opacity: 0.85; }
    97%           { opacity: 1; }
    98%           { opacity: 0.9; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes glitch {
    0%   { clip-path: inset(0 0 98% 0); transform: translateX(-4px); }
    10%  { clip-path: inset(40% 0 50% 0); transform: translateX(4px); }
    20%  { clip-path: inset(80% 0 5% 0); transform: translateX(-2px); }
    30%  { clip-path: inset(10% 0 80% 0); transform: translateX(0); }
    100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
  }
  @keyframes rotate-ring {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes counter-ring {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes threat-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(0.97); }
  }
  @keyframes data-stream {
    0%   { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-20px); opacity: 0; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .page { animation: fade-up 0.5s ease forwards; }

  .hud-input {
    width: 100%;
    background: rgba(0,15,30,0.8);
    border: 1px solid var(--border2);
    color: var(--cyan);
    font-family: var(--font-mono);
    font-size: 15px;
    padding: 12px 16px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  }
  .hud-input::placeholder { color: var(--text3); font-family: var(--font-mono); }
  .hud-input:focus {
    border-color: var(--cyan);
    box-shadow: 0 0 20px rgba(0,212,255,0.2), inset 0 0 10px rgba(0,212,255,0.05);
  }

  .hud-btn {
    width: 100%;
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    font-family: var(--font-hud);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    padding: 14px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .hud-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,212,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .hud-btn:hover::before { opacity: 1; }
  .hud-btn:hover {
    box-shadow: 0 0 30px rgba(0,212,255,0.4);
    text-shadow: 0 0 10px var(--cyan);
  }
  .hud-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .hud-btn.red  { border-color: var(--red);   color: var(--red);   }
  .hud-btn.red:hover  { box-shadow: 0 0 30px rgba(255,34,68,0.4); text-shadow: 0 0 10px var(--red); }
  .hud-btn.green{ border-color: var(--green); color: var(--green); }
  .hud-btn.green:hover{ box-shadow: 0 0 30px rgba(0,255,136,0.4); text-shadow: 0 0 10px var(--green); }
  .hud-btn.amber{ border-color: var(--amber); color: var(--amber); }

  .panel {
    background: var(--panel);
    border: 1px solid var(--border2);
    position: relative;
    overflow: hidden;
    clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
  }
  .panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    opacity: 0.6;
  }

  .corner-tl::after {
    content: '';
    position: absolute;
    top: 8px; left: 8px;
    width: 16px; height: 16px;
    border-top: 2px solid var(--cyan);
    border-left: 2px solid var(--cyan);
  }
  .corner-br::after {
    content: '';
    position: absolute;
    bottom: 8px; right: 8px;
    width: 16px; height: 16px;
    border-bottom: 2px solid var(--cyan);
    border-right: 2px solid var(--cyan);
  }

  .label {
    font-family: var(--font-hud);
    font-size: 10px;
    letter-spacing: 3px;
    color: var(--text3);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .threat-high  { color: var(--red);   text-shadow: 0 0 10px var(--red); }
  .threat-med   { color: var(--amber); text-shadow: 0 0 10px var(--amber); }
  .threat-low   { color: var(--green); text-shadow: 0 0 10px var(--green); }

  .animate-in { animation: slide-in 0.4s ease forwards; }

  .status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 8px var(--green);
    animation: pulse-border 2s infinite;
    display: inline-block;
  }
`;

/* ── Utility ────────────────────────────────────────────────── */
const L = (lang, en, kn) => lang === "kn" ? kn : en;

/* ── Scanline overlay ───────────────────────────────────────── */
function Scanline() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: "3px",
        background: "linear-gradient(180deg, transparent, rgba(0,212,255,0.04), transparent)",
        animation: "scanline 6s linear infinite"
      }} />
    </div>
  );
}

/* ── HUD Label ──────────────────────────────────────────────── */
function Label({ children }) {
  return <div className="label">{children}</div>;
}

/* ── Score Bar ──────────────────────────────────────────────── */
function ScoreBar({ score, threat }) {
  const c = score > 70 ? "var(--red)" : score > 40 ? "var(--amber)" : "var(--green)";
  const cls = score > 70 ? "threat-high" : score > 40 ? "threat-med" : "threat-low";
  return (
    <div style={{ margin: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Label>AI Anomaly Score</Label>
        <span className={cls} style={{ fontFamily: "var(--font-hud)", fontSize: 13, fontWeight: 700 }}>
          {score}/100
        </span>
      </div>
      <div style={{ height: 6, background: "rgba(0,212,255,0.08)", borderRadius: 0, position: "relative", overflow: "hidden" }}>
        <div style={{
          width: `${score}%`, height: "100%", background: `linear-gradient(90deg, ${c}88, ${c})`,
          boxShadow: `0 0 12px ${c}`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
        }} />
        {[25,50,75].map(t => (
          <div key={t} style={{
            position: "absolute", top: 0, left: `${t}%`, width: 1, height: "100%",
            background: "rgba(0,212,255,0.2)"
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span className={cls} style={{ fontFamily: "var(--font-hud)", fontSize: 10, letterSpacing: 2 }}>
          THREAT: {threat}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)" }}>
          {score < 40 ? "NOMINAL" : score < 70 ? "ELEVATED" : "CRITICAL"}
        </span>
      </div>
    </div>
  );
}

/* ── Chain Status Bar ───────────────────────────────────────── */
function ChainStatus({ lang }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    const go = () => axios.get(`${API}/chain/status`).then(r => setInfo(r.data)).catch(() => {});
    go();
    const t = setInterval(go, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      padding: "10px 20px", marginBottom: 24,
      background: "rgba(0,212,255,0.03)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--cyan)",
      fontFamily: "var(--font-mono)", fontSize: 12,
    }}>
      <span className="status-dot" />
      <span style={{ color: "var(--green)", letterSpacing: 1 }}>
        {L(lang, "BLOCKCHAIN ONLINE", "ಬ್ಲಾಕ್‌ಚೈನ್ ಆನ್‌ಲೈನ್")}
      </span>
      {info && <>
        <span style={{ color: "var(--text3)" }}>|</span>
        <span style={{ color: "var(--text2)" }}>
          BLOCK <span style={{ color: "var(--cyan)" }}>#{info.block_number}</span>
        </span>
        <span style={{ color: "var(--text3)" }}>|</span>
        <span style={{ color: "var(--text2)" }}>
          {L(lang, "USERS", "ಬಳಕೆದಾರರು")}: <span style={{ color: "var(--cyan)" }}>{info.user_count}</span>
        </span>
        <span style={{ color: "var(--text3)" }}>|</span>
        <span style={{ color: "var(--text3)" }}>NO-DB · ON-CHAIN ONLY</span>
      </>}
    </div>
  );
}

/* ── Page 1: Register ───────────────────────────────────────── */
function RegisterPage({ lang, onDone }) {
  const [form, setForm] = useState({ user_id: "", name: "", phone: "", region: "" });
  const [res,  setRes]  = useState(null);
  const [err,  setErr]  = useState(null);
  const [busy, setBusy] = useState(false);

  const fields = [
    { key: "user_id", en: "AADHAAR / PHONE ID",      kn: "ಆಧಾರ್ / ಫೋನ್ ID",       icon: "◈" },
    { key: "name",    en: "FULL NAME",                kn: "ಪೂರ್ಣ ಹೆಸರು",           icon: "◉" },
    { key: "phone",   en: "PHONE NUMBER (10 DIGITS)", kn: "ಫೋನ್ ಸಂಖ್ಯೆ (10 ಅಂಕಿ)", icon: "◎" },
    { key: "region",  en: "VILLAGE / DISTRICT",       kn: "ಗ್ರಾಮ / ಜಿಲ್ಲೆ",        icon: "◆" },
  ];

  const submit = async () => {
    setErr(null); setRes(null); setBusy(true);
    try { const r = await axios.post(`${API}/register`, form); setRes(r.data); }
    catch (e) { setErr(e.response?.data?.detail || "Registration failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="page" style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          fontFamily: "var(--font-hud)", fontSize: 11, letterSpacing: 6,
          color: "var(--text3)", marginBottom: 12
        }}>ZEROCHAIN SECURE PORTAL</div>
        <div style={{
          fontFamily: "var(--font-hud)", fontSize: 28, fontWeight: 900,
          color: "var(--cyan)", textShadow: "0 0 30px rgba(0,212,255,0.5)",
          letterSpacing: 3, animation: "flicker 8s infinite"
        }}>
          {L(lang, "IDENTITY REGISTRATION", "ಗುರುತು ನೋಂದಣಿ")}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)", marginTop: 8
        }}>
          {L(lang, "// BLOCKCHAIN SECURED · DECENTRALIZED · NO DATABASE", "// ಬ್ಲಾಕ್‌ಚೈನ್ · ವಿಕೇಂದ್ರೀಕೃತ · DB ಇಲ್ಲ")}
        </div>
      </div>

      <div className="panel corner-tl corner-br" style={{ padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, margin: "0 auto",
            border: "2px solid var(--cyan)", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, boxShadow: "0 0 30px rgba(0,212,255,0.3)",
            background: "rgba(0,212,255,0.05)"
          }}>🔐</div>
          <div style={{
            fontFamily: "var(--font-hud)", fontSize: 10, letterSpacing: 4,
            color: "var(--cyan)", marginTop: 10, opacity: 0.7
          }}>ON-CHAIN ONLY</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <Label>{f.icon} {L(lang, f.en, f.kn)}</Label>
              <input
                className="hud-input"
                placeholder={L(lang, f.en, f.kn).toLowerCase()}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div style={{ height: 24 }} />

        <button className="hud-btn" onClick={submit} disabled={busy}>
          {busy
            ? L(lang, "[ REGISTERING... ]", "[ ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ... ]")
            : L(lang, "[ REGISTER ON BLOCKCHAIN ]", "[ ಬ್ಲಾಕ್‌ಚೈನ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ ]")}
        </button>

        {res && (
          <div className="animate-in" style={{
            marginTop: 20, padding: 16,
            border: "1px solid var(--green)", background: "rgba(0,255,136,0.04)"
          }}>
            <div style={{
              fontFamily: "var(--font-hud)", fontSize: 12, color: "var(--green)",
              letterSpacing: 2, marginBottom: 8
            }}>✓ REGISTRATION CONFIRMED</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", lineHeight: 1.8 }}>
              <div>STATUS  : {res.message}</div>
              <div>TX_HASH : {res.tx_hash?.slice(0, 28)}…</div>
              <div>STORAGE : BLOCKCHAIN · NO-DB</div>
            </div>
            <div style={{ height: 16 }} />
            <button className="hud-btn green" onClick={onDone}>
              {L(lang, "[ PROCEED TO TRANSACTION ]", "[ ವಹಿವಾಟಿಗೆ ಮುಂದುವರಿಯಿರಿ ]")}
            </button>
          </div>
        )}
        {err && (
          <div className="animate-in" style={{
            marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12,
            color: "var(--red)", padding: 12, border: "1px solid rgba(255,34,68,0.3)"
          }}>
            ✗ ERROR: {err}
          </div>
        )}
      </div>

      <div style={{
        textAlign: "center", marginTop: 20,
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: 2
      }}>
        ZEROCHAIN · ADVAYA 2.0 · RURAL BANKING SECURITY
      </div>
    </div>
  );
}

/* ── Page 2: Transaction ────────────────────────────────────── */
function TransactionPage({ lang, onFraud, onBack }) {
  const [form, setForm]   = useState({ user_id: "", amount: "" });
  const [res,  setRes]    = useState(null);
  const [err,  setErr]    = useState(null);
  const [busy, setBusy]   = useState(false);

  const submit = async () => {
    setErr(null); setRes(null); setBusy(true);
    try {
      const r = await axios.post(`${API}/access`, {
        user_id: form.user_id,
        amount:  parseFloat(form.amount),
        language: lang,
      });
      setRes(r.data);
      if (r.data.fraud_detected) {
        setTimeout(() => onFraud(r.data, form.user_id), 600);
      }
    } catch (e) { setErr(e.response?.data?.detail || "Transaction check failed"); }
    finally { setBusy(false); }
  };

  const status = res?.status;

  return (
    <div className="page" style={{ maxWidth: 580, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginBottom: 32 }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)",
          letterSpacing: 2, marginBottom: 20, display: "flex", alignItems: "center", gap: 8
        }}>
          ← {L(lang, "BACK TO REGISTER", "ನೋಂದಣಿಗೆ ಹಿಂತಿರುಗಿ")}
        </button>
        <div style={{
          fontFamily: "var(--font-hud)", fontSize: 24, fontWeight: 900,
          color: "var(--cyan)", textShadow: "0 0 20px rgba(0,212,255,0.4)", letterSpacing: 3
        }}>
          {L(lang, "TRANSACTION ANALYSIS", "ವಹಿವಾಟು ವಿಶ್ಲೇಷಣೆ")}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
          {L(lang, "// AI-POWERED FRAUD DETECTION · REAL-TIME BLOCKCHAIN VERIFICATION", "// AI ವಂಚನೆ ಪತ್ತೆ · ರಿಯಲ್-ಟೈಮ್ ಬ್ಲಾಕ್‌ಚೈನ್")}
        </div>
      </div>

      <div className="panel corner-tl corner-br" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, flexShrink: 0,
            border: "2px solid var(--cyan)", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 0 20px rgba(0,212,255,0.2)",
            background: "rgba(0,212,255,0.04)"
          }}>💳</div>
          <div>
            <div style={{ fontFamily: "var(--font-hud)", fontSize: 14, color: "var(--cyan)", letterSpacing: 2 }}>
              {L(lang, "SECURE TRANSACTION CHECK", "ಸುರಕ್ಷಿತ ವಹಿವಾಟು ತಪಾಸಣೆ")}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              {L(lang, "Login history auto-read from blockchain", "ಇತಿಹಾಸ ಬ್ಲಾಕ್‌ಚೈನ್‌ನಿಂದ ಸ್ವಯಂ ಪಡೆಯಲಾಗುತ್ತದೆ")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div>
            <Label>◈ {L(lang, "USER ID / AADHAAR", "ಬಳಕೆದಾರ ID / ಆಧಾರ್")}</Label>
            <input className="hud-input" placeholder="user_id"
              value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} />
          </div>
          <div>
            <Label>◎ {L(lang, "TRANSACTION AMOUNT (₹)", "ವಹಿವಾಟು ಮೊತ್ತ (₹)")}</Label>
            <input className="hud-input" type="number" placeholder="0.00"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
        </div>

        <button
          className={`hud-btn${status === "DENIED" ? " red" : ""}`}
          onClick={submit} disabled={busy}
        >
          {busy
            ? L(lang, "[ ANALYSING... ]", "[ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ... ]")
            : L(lang, "[ CHECK TRANSACTION ]", "[ ವಹಿವಾಟು ಪರಿಶೀಲಿಸಿ ]")}
        </button>

        {res && !res.fraud_detected && (
          <div className="animate-in" style={{ marginTop: 24 }}>
            <div style={{
              padding: "12px 18px", marginBottom: 16,
              border: `1px solid ${status === "APPROVED" ? "var(--green)" : "var(--amber)"}`,
              background: status === "APPROVED" ? "rgba(0,255,136,0.05)" : "rgba(255,170,0,0.05)",
              fontFamily: "var(--font-hud)", fontSize: 13, fontWeight: 700,
              color: status === "APPROVED" ? "var(--green)" : "var(--amber)",
              letterSpacing: 2,
              boxShadow: status === "APPROVED"
                ? "0 0 20px rgba(0,255,136,0.1)"
                : "0 0 20px rgba(255,170,0,0.1)"
            }}>
              {status === "APPROVED"
                ? `✓ ${L(lang, "ACCESS APPROVED", "ಪ್ರವೇಶ ಅನುಮೋದಿಸಲಾಗಿದೆ")}`
                : `⚠ ${L(lang, "SUSPICIOUS ACTIVITY", "ಅನುಮಾನಾಸ್ಪದ ಚಟುವಟಿಕೆ")}`}
            </div>

            <ScoreBar score={res.anomaly_score} threat={res.analysis?.threat_level || "LOW"} />

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16,
              fontFamily: "var(--font-mono)", fontSize: 12
            }}>
              {[
                ["USER",   res.name],
                ["REGION", res.region],
                ["PHONE",  `****${res.phone_last4}`],
                ["STAGE",  res.user_stage],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "10px 12px", border: "1px solid var(--border)", background: "rgba(0,212,255,0.02)" }}>
                  <div style={{ color: "var(--text3)", fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>{k}</div>
                  <div style={{ color: "var(--cyan)" }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 14, padding: "10px 14px", border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", lineHeight: 1.8
            }}>
              {res.analysis?.reasons?.map((r, i) => (
                <div key={i}>› {r}</div>
              ))}
            </div>

            <div style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)" }}>
              {res.stage_message}
            </div>
          </div>
        )}

        {res?.fraud_detected && (
          <div className="animate-in" style={{
            marginTop: 20, padding: 16,
            border: "1px solid var(--red)", background: "rgba(255,34,68,0.05)",
            fontFamily: "var(--font-hud)", fontSize: 13, color: "var(--red)",
            letterSpacing: 2, textAlign: "center",
            animation: "threat-pulse 1.5s infinite"
          }}>
            🚨 {L(lang, "FRAUD DETECTED — REDIRECTING...", "ವಂಚನೆ ಪತ್ತೆ — ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...")}
          </div>
        )}

        {err && (
          <div className="animate-in" style={{
            marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12,
            color: "var(--red)", padding: 12, border: "1px solid rgba(255,34,68,0.3)"
          }}>
            ✗ ERROR: {err}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page 3: Fraud Alert + OTP ──────────────────────────────── */
function FraudPage({ lang, fraudData, userId, onBack }) {
  const [otp,     setOtp]     = useState("");
  const [otpRes,  setOtpRes]  = useState(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  const verifyOTP = async () => {
    setOtpBusy(true);
    try {
      const r = await axios.post(`${API}/verify-otp`, { user_id: userId, entered_otp: otp });
      setOtpRes(r.data);
    } catch (e) {
      setOtpRes({ status: "ERROR", reason: e.response?.data?.detail || "Error" });
    } finally { setOtpBusy(false); }
  };

  const confirmed = otpRes?.status === "TRANSACTION_CONFIRMED";
  const blocked   = otpRes && !confirmed;

  const attackMsg = () => {
    if (!otpRes) return "";
    switch (otpRes.attack_type) {
      case "OTP_RELAY":   return L(lang, "🚨 IP MISMATCH — SIM SWAP / OTP RELAY DETECTED", "🚨 IP ಹೊಂದಾಣಿಕೆ ಇಲ್ಲ — SIM ಸ್ವಾಪ್ / OTP ರಿಲೇ ಪತ್ತೆ");
      case "TOO_FAST":    return L(lang, "🚨 BOT DETECTED — OTP SUBMITTED TOO FAST", "🚨 ಬಾಟ್ ಪತ್ತೆ — OTP ತುಂಬಾ ವೇಗವಾಗಿ");
      case "RATE_LIMIT":  return L(lang, "🚨 ACCOUNT LOCKED — TOO MANY ATTEMPTS", "🚨 ಖಾತೆ ಲಾಕ್ — ಹಲವು ಪ್ರಯತ್ನಗಳು");
      case "WRONG_OTP":   return L(lang, "✗ WRONG OTP — TRY AGAIN", "✗ ತಪ್ಪು OTP — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ");
      default:            return `✗ ${otpRes.reason}`;
    }
  };

  return (
    <div className="page" style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

      <div style={{
        textAlign: "center", marginBottom: 32,
        padding: "24px 20px",
        border: "1px solid var(--red)",
        background: "rgba(255,34,68,0.04)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 200, height: 200,
          border: "1px solid rgba(255,34,68,0.1)",
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          animation: "rotate-ring 8s linear infinite"
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 300, height: 300,
          border: "1px solid rgba(255,34,68,0.06)",
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          animation: "counter-ring 12s linear infinite"
        }} />

        <div style={{
          fontSize: 48, marginBottom: 12,
          filter: `drop-shadow(0 0 20px rgba(255,34,68,${tick % 2 === 0 ? "0.8" : "0.3"}))`
        }}>🚨</div>

        <div style={{
          fontFamily: "var(--font-hud)", fontSize: 22, fontWeight: 900,
          color: "var(--red)", letterSpacing: 3,
          textShadow: "0 0 30px rgba(255,34,68,0.6)",
          animation: "threat-pulse 1.5s infinite"
        }}>
          {L(lang, "FRAUD DETECTED", "ವಂಚನೆ ಪತ್ತೆಯಾಗಿದೆ")}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(255,34,68,0.7)",
          marginTop: 8, letterSpacing: 2
        }}>
          {L(lang, "TRANSACTION SUSPENDED · ALERTS DISPATCHED", "ವಹಿವಾಟು ಸ್ಥಗಿತ · ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ")}
        </div>
      </div>

      <div className="panel" style={{ padding: 24, marginBottom: 20 }}>
        <Label>◈ {L(lang, "SECURITY ALERTS DISPATCHED", "ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ")}</Label>

        {[
          { icon: "📲", label: L(lang, "SMS OTP sent to registered number", "ನೋಂದಾಯಿತ ಸಂಖ್ಯೆಗೆ SMS OTP") },
          { icon: "📞", label: L(lang, "Voice call fired — works on basic keypad phones", "ಧ್ವನಿ ಕರೆ — ಸಾಮಾನ್ಯ ಫೋನ್‌ಗೆ ಕೂಡ") },
          { icon: "🛡️", label: L(lang, "IP mismatch + speed check + rate limit active", "IP + ವೇಗ + ದರ ಮಿತಿ ಸಕ್ರಿಯ") },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", marginTop: 10,
            border: "1px solid var(--border)", background: "rgba(0,212,255,0.02)",
            fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)"
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
            <span style={{ marginLeft: "auto", color: "var(--green)", fontFamily: "var(--font-hud)", fontSize: 10 }}>✓ OK</span>
          </div>
        ))}

        <ScoreBar
          score={fraudData?.anomaly_score || 0}
          threat={fraudData?.analysis?.threat_level || "HIGH"}
        />

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8,
          fontFamily: "var(--font-mono)", fontSize: 11
        }}>
          {[
            ["USER",   fraudData?.name],
            ["REGION", fraudData?.region],
            ["PHONE",  `****${fraudData?.phone_last4}`],
            ["AMOUNT", `₹${parseFloat(fraudData?.analysis?.amount || 0).toLocaleString("en-IN")}`],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: "8px 10px", border: "1px solid var(--border)", background: "rgba(255,34,68,0.03)" }}>
              <div style={{ color: "var(--text3)", fontSize: 9, letterSpacing: 2 }}>{k}</div>
              <div style={{ color: "var(--red)", marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {!otpRes && (
        <div className="panel animate-in" style={{ padding: 28, marginBottom: 20, borderColor: "var(--amber)" }}>
          <div style={{
            fontFamily: "var(--font-hud)", fontSize: 14, color: "var(--amber)",
            letterSpacing: 3, marginBottom: 6
          }}>
            🔑 {L(lang, "ENTER VERIFICATION OTP", "OTP ನಮೂದಿಸಿ")}
          </div>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginBottom: 20, lineHeight: 1.8
          }}>
            {L(
              lang,
              "⚠ If you did NOT initiate this transaction — do NOT enter OTP. Contact your bank immediately.",
              "⚠ ನೀವು ಈ ವಹಿವಾಟು ಮಾಡಿಲ್ಲವಾದರೆ — OTP ನಮೂದಿಸಬೇಡಿ. ತಕ್ಷಣ ಬ್ಯಾಂಕ್‌ಗೆ ಕರೆ ಮಾಡಿ."
            )}
          </div>

          <Label>◎ {L(lang, "ONE-TIME PASSWORD", "ಒಂದು-ಬಾರಿ ಪಾಸ್‌ವರ್ಡ್")}</Label>
          <input
            className="hud-input"
            placeholder="_ _ _ _ _ _"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value)}
            style={{ letterSpacing: 12, fontSize: 24, textAlign: "center", marginBottom: 20 }}
          />

          <button
            className="hud-btn amber"
            onClick={verifyOTP}
            disabled={otpBusy || otp.length < 6}
          >
            {otpBusy
              ? L(lang, "[ VERIFYING... ]", "[ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ... ]")
              : L(lang, "[ CONFIRM OTP ]", "[ OTP ದೃಢಪಡಿಸಿ ]")}
          </button>
        </div>
      )}

      {otpRes && (
        <div className="panel animate-in" style={{
          padding: 28, marginBottom: 20,
          borderColor: confirmed ? "var(--green)" : "var(--red)"
        }}>
          <div style={{
            fontFamily: "var(--font-hud)", fontSize: 16, fontWeight: 700, letterSpacing: 2,
            color: confirmed ? "var(--green)" : "var(--red)",
            textShadow: confirmed ? "0 0 20px rgba(0,255,136,0.5)" : "0 0 20px rgba(255,34,68,0.5)",
            marginBottom: 16
          }}>
            {confirmed
              ? `✓ ${L(lang, "TRANSACTION CONFIRMED", "ವಹಿವಾಟು ದೃಢಪಡಿಸಲಾಗಿದೆ")}`
              : attackMsg()}
          </div>

          {otpRes.attack_type === "OTP_RELAY" && (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)",
              lineHeight: 1.8, padding: "12px 14px", border: "1px solid var(--border)"
            }}>
              <div>TXN_IP   : {otpRes.registered_ip}</div>
              <div>SUBMIT_IP: {otpRes.verify_ip}</div>
              <div style={{ color: "var(--red)", marginTop: 8 }}>
                › {L(lang, "Account flagged. Warning call fired to registered phone.", "ಖಾತೆ ಫ್ಲ್ಯಾಗ್. ಎಚ್ಚರಿಕೆ ಕರೆ ಕಳುಹಿಸಲಾಗಿದೆ.")}
              </div>
            </div>
          )}

          {confirmed && (
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--green)", lineHeight: 1.8
            }}>
              › {L(lang, "Identity verified on-chain", "ಬ್ಲಾಕ್‌ಚೈನ್‌ನಲ್ಲಿ ಗುರುತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ")}<br/>
              › {L(lang, "Transaction approved", "ವಹಿವಾಟು ಅನುಮೋದಿಸಲಾಗಿದೆ")}
            </div>
          )}
        </div>
      )}

      <button className="hud-btn" onClick={onBack} style={{ marginBottom: 20 }}>
        {L(lang, "[ ← BACK TO TRANSACTION ]", "[ ← ವಹಿವಾಟಿಗೆ ಹಿಂತಿರುಗಿ ]")}
      </button>

      <div style={{
        padding: "12px 16px", border: "1px solid var(--border)",
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", lineHeight: 2
      }}>
        PILLARS: IsolationForest AI · Blockchain Storage · Twilio Voice+SMS · IP/Speed/RateLimit Detection
      </div>
    </div>
  );
}

/* ── App Shell ──────────────────────────────────────────────── */
export default function App() {
  const [page,       setPage]   = useState("register");
  const [lang,       setLang]   = useState("kn");
  const [fraudData,  setFraud]  = useState(null);
  const [fraudUser,  setFUser]  = useState("");

  const handleFraud = (data, uid) => {
    setFraud(data);
    setFUser(uid);
    setPage("fraud");
  };

  return (
    <>
      <style>{globalCSS}</style>
      <Scanline />

      <div style={{
        minHeight: "100vh", padding: "32px 16px 48px",
        position: "relative", zIndex: 1
      }}>
        {/* Top bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          maxWidth: 900, margin: "0 auto 32px",
          padding: "0 16px"
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-hud)", fontSize: 20, fontWeight: 900,
              color: "var(--cyan)", letterSpacing: 4,
              textShadow: "0 0 20px rgba(0,212,255,0.5)"
            }}>⛓ ZEROCHAIN</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)", letterSpacing: 3 }}>
              RURAL BANKING SECURITY · ADVAYA 2.0
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

            {/* ── CLICKABLE PAGE DOTS ── */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[
                { key: "register",    label: "REGISTER",    canGo: true },
                { key: "transaction", label: "TRANSACTION", canGo: true },
                { key: "fraud",       label: "FRAUD ALERT", canGo: !!fraudData },
              ].map((p) => (
                <div
                  key={p.key}
                  title={p.label}
                  onClick={() => p.canGo && setPage(p.key)}
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: page === p.key ? "var(--cyan)" : "var(--border2)",
                    boxShadow: page === p.key ? "0 0 8px var(--cyan)" : "none",
                    transition: "all 0.3s",
                    cursor: p.canGo ? "pointer" : "not-allowed",
                    opacity: p.canGo ? 1 : 0.35,
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setLang(l => l === "en" ? "kn" : "en")}
              style={{
                background: "transparent", border: "1px solid var(--border2)",
                color: "var(--text2)", fontFamily: "var(--font-mono)", fontSize: 11,
                padding: "6px 14px", cursor: "pointer", letterSpacing: 2,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.target.style.borderColor = "var(--cyan)"; e.target.style.color = "var(--cyan)"; }}
              onMouseLeave={e => { e.target.style.borderColor = "var(--border2)"; e.target.style.color = "var(--text2)"; }}
            >
              {lang === "en" ? "🇮🇳 ಕನ್ನಡ" : "🇬🇧 ENG"}
            </button>
          </div>
        </div>

        {/* Chain status */}
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <ChainStatus lang={lang} />
        </div>

        {/* Pages */}
        {page === "register" && (
          <RegisterPage lang={lang} onDone={() => setPage("transaction")} />
        )}
        {page === "transaction" && (
          <TransactionPage
            lang={lang}
            onFraud={handleFraud}
            onBack={() => setPage("register")}
          />
        )}
        {page === "fraud" && (
          <FraudPage
            lang={lang}
            fraudData={fraudData}
            userId={fraudUser}
            onBack={() => setPage("transaction")}
          />
        )}
      </div>
    </>
  );
}