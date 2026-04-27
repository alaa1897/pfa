/**
 * AuthPage.js
 * Unified auth page — handles both login and register.
 * Replaces the old LoginPage.js and RegisterPage.js.
 *
 * Usage in App.js:
 *   <Route path="/login"    element={<AuthPage initialMode="login" />} />
 *   <Route path="/register" element={<AuthPage initialMode="register" />} />
 *
 * Layout: left robot panel | right form card
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import useAuthStore from "../store/authStore";
import useRobotStore from "../store/useRobotStore";
import "./AuthPage.css";

export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { login, registerAndLogin, isLoading } = useAuthStore();
  const { notify } = useRobotStore();
  const [mode, setMode] = useState(initialMode);

  // ── Login state ──────────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const handleLoginChange = (field) => (e) =>
    setLoginForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(loginForm.email, loginForm.password);
    if (result.success) {
      navigate("/map");
    } else {
      notify("error", result.error || "Login failed. Please check your credentials.");
    }
  };

  // ── Register state ───────────────────────────────────────────────────────
  const [regForm, setRegForm] = useState({
    first_name: "", last_name: "", email: "",
    username: "", company_name: "", password: "", password_confirm: "",
  });
  const handleRegChange = (field) => (e) =>
    setRegForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.password_confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    const result = await registerAndLogin(regForm);
    if (result.success) {
      navigate("/map");
    } else {
      notify("error", result.error || "Registration failed. Please check your details.");
    }
  };

  const isLogin = mode === "login";

  return (
    <div className={`ap-page ${isLogin ? "ap-blue" : "ap-green"}`}>
      {/* ── Navbar ── */}
      <nav className="ap-nav">
        <Link to="/" className="ap-logo">
          <span className="ap-logo-dot" />
          <span>DOOH</span>
          <span className="ap-logo-muted">Platform</span>
        </Link>
        <Link to="/" className="ap-home-btn">← Home</Link>
      </nav>

      <div className="ap-body">
        {/* ── Left: robot panel ── */}
        <div className={`ap-panel ${isLogin ? "ap-panel-blue" : "ap-panel-green"}`}>
          {isLogin ? <RobotLogin /> : <RobotRegister />}
          <div className={`ap-panel-msg ${isLogin ? "ap-msg-blue" : "ap-msg-green"}`}>
            <strong>{isLogin ? "Sign in to your account" : "Create your account"}</strong>
            <span>{isLogin ? "Your campaigns are waiting" : "Start booking screens in minutes"}</span>
          </div>
        </div>

        {/* ── Right: form card ── */}
        <div className="ap-form-panel">
          <div className="ap-card">
            {isLogin ? (
              <>
                <h2 className="ap-heading">Welcome back</h2>
                <p className="ap-sub">Sign in to manage your campaigns</p>
                <form onSubmit={handleLogin}>
                  <div className="ap-field">
                    <label>Email</label>
                    <input type="email" placeholder="you@company.com"
                      value={loginForm.email} onChange={handleLoginChange("email")} required />
                  </div>
                  <div className="ap-field">
                    <label>Password</label>
                    <input type="password" placeholder="••••••••"
                      value={loginForm.password} onChange={handleLoginChange("password")} required />
                  </div>
                  <button type="submit" className="ap-btn-green" disabled={isLoading}>
                    {isLoading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>
                <p className="ap-switch">
                  New here?{" "}
                  <span onClick={() => setMode("register")}>Create an account</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="ap-heading">Create account</h2>
                <p className="ap-sub">Start advertising on premium screens today</p>
                <form onSubmit={handleRegister}>
                  <div className="ap-row">
                    <div className="ap-field">
                      <label>First name</label>
                      <input placeholder="Jane" value={regForm.first_name}
                        onChange={handleRegChange("first_name")} required />
                    </div>
                    <div className="ap-field">
                      <label>Last name</label>
                      <input placeholder="Doe" value={regForm.last_name}
                        onChange={handleRegChange("last_name")} required />
                    </div>
                  </div>
                  <div className="ap-field">
                    <label>Email</label>
                    <input type="email" placeholder="you@company.com" value={regForm.email}
                      onChange={handleRegChange("email")} required />
                  </div>
                  <div className="ap-row">
                    <div className="ap-field">
                      <label>Username</label>
                      <input placeholder="janedoe" value={regForm.username}
                        onChange={handleRegChange("username")} required />
                    </div>
                    <div className="ap-field">
                      <label>Company</label>
                      <input placeholder="Acme Corp" value={regForm.company_name}
                        onChange={handleRegChange("company_name")} />
                    </div>
                  </div>
                  <div className="ap-row">
                    <div className="ap-field">
                      <label>Password</label>
                      <input type="password" placeholder="Min 8 chars" value={regForm.password}
                        onChange={handleRegChange("password")} required />
                    </div>
                    <div className="ap-field">
                      <label>Confirm</label>
                      <input type="password" placeholder="Repeat" value={regForm.password_confirm}
                        onChange={handleRegChange("password_confirm")} required />
                    </div>
                  </div>
                  <button type="submit" className="ap-btn-green" disabled={isLoading}>
                    {isLoading ? "Creating account…" : "Create Account & Sign In →"}
                  </button>
                </form>
                <p className="ap-switch">
                  Already have an account?{" "}
                  <span onClick={() => setMode("login")}>Sign in</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Robot: Sign In ───────────────────────────────────────────────────────────
function RobotLogin() {
  return (
    <svg width="160" height="190" viewBox="0 0 164 195"
      xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <g style={{ animation: "bodyBounce 2.4s ease-in-out infinite", transformOrigin: "59px 175px" }}>
        <rect x="37" y="184" width="15" height="10" rx="4" fill="#334155"/>
        <rect x="58" y="184" width="15" height="10" rx="4" fill="#334155"/>
        <rect x="40" y="166" width="9" height="21" rx="3" fill="#475569"/>
        <rect x="61" y="166" width="9" height="21" rx="3" fill="#475569"/>
        <rect x="29" y="128" width="54" height="42" rx="9" fill="#334155"/>
        <rect x="35" y="135" width="19" height="11" rx="3" fill="#1e293b"/>
        <circle cx="40" cy="141" r="2" fill="#10b981"/>
        <circle cx="47" cy="141" r="2" fill="#f59e0b"/>
        <circle cx="54" cy="141" r="1.5" fill="#ef4444"/>
        <rect x="35" y="150" width="40" height="5" rx="2" fill="#1e293b"/>
        <rect x="38" y="151.5" width="12" height="2" rx="1" fill="#2563eb"/>
        <g style={{ animation: "armWave 3.2s ease-in-out infinite", transformOrigin: "29px 138px" }}>
          <rect x="19" y="131" width="13" height="8" rx="4" fill="#475569"/>
          <rect x="20" y="133" width="10" height="23" rx="4" fill="#475569"/>
        </g>
        <g style={{ animation: "armWave 3.2s .8s ease-in-out infinite", transformOrigin: "83px 138px" }}>
          <rect x="82" y="131" width="13" height="8" rx="4" fill="#475569"/>
          <rect x="83" y="133" width="10" height="23" rx="4" fill="#475569"/>
        </g>
        <rect x="47" y="116" width="17" height="13" rx="3" fill="#475569"/>
        <g style={{ animation: "headWiggle 4.5s ease-in-out infinite", transformOrigin: "56px 96px" }}>
          <rect x="33" y="76" width="46" height="40" rx="10" fill="#334155"/>
          <rect x="38" y="83" width="35" height="24" rx="5" fill="#0f172a"/>
          <g style={{ animation: "blink 4s ease-in-out infinite", transformOrigin: "49px 96px" }}>
            <rect x="42" y="89" width="12" height="8" rx="3" fill="#2563eb"/>
            <circle style={{ animation: "eyeLookLeft 6s ease-in-out infinite" }} cx="48" cy="93" r="3" fill="#93c5fd"/>
          </g>
          <g style={{ animation: "doubleBlink 4s 1.2s ease-in-out infinite", transformOrigin: "67px 96px" }}>
            <rect x="60" y="89" width="12" height="8" rx="3" fill="#2563eb"/>
            <circle style={{ animation: "eyeLookLeft 6s .4s ease-in-out infinite" }} cx="66" cy="93" r="3" fill="#93c5fd"/>
          </g>
          <path d="M44 105 Q56 113 70 105" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="53" y="67" width="5" height="11" rx="2" fill="#475569"/>
          <circle style={{ animation: "antennaPulse 1.8s ease-in-out infinite" }} cx="55" cy="64" r="5" fill="#2563eb"/>
        </g>
      </g>
      {/* Speech bubble */}
      <rect x="2" y="4" width="160" height="48" rx="10" fill="#fff" stroke="#dbeafe" strokeWidth="1.5"/>
      <polygon points="52,52 66,52 59,63" fill="#fff" stroke="#dbeafe" strokeWidth="1"/>
      <polygon points="53,51 65,51 59,61" fill="#fff"/>
      <text x="82" y="22" textAnchor="middle" fontFamily="'Syne',sans-serif" fontSize="11" fontWeight="800" fill="#0f172a">Welcome back!</text>
      <text x="82" y="38" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="#64748b">Good to see you again</text>
    </svg>
  );
}

// ── Robot: Sign Up ───────────────────────────────────────────────────────────
function RobotRegister() {
  return (
    <svg width="160" height="190" viewBox="0 0 164 195"
      xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible", zIndex: 1, position: "relative" }}>
      <g style={{ animation: "bodyBounce 1.8s ease-in-out infinite", transformOrigin: "56px 175px" }}>
        <rect x="37" y="184" width="15" height="10" rx="4" fill="#334155"/>
        <rect x="58" y="184" width="15" height="10" rx="4" fill="#334155"/>
        <rect x="40" y="166" width="9" height="21" rx="3" fill="#475569"/>
        <rect x="61" y="166" width="9" height="21" rx="3" fill="#475569"/>
        <rect x="29" y="128" width="54" height="42" rx="9" fill="#334155"/>
        <rect x="35" y="135" width="19" height="11" rx="3" fill="#1e293b"/>
        <circle cx="40" cy="141" r="2" fill="#10b981"/>
        <circle cx="47" cy="141" r="2" fill="#f59e0b"/>
        <circle cx="54" cy="141" r="1.5" fill="#ef4444"/>
        <rect x="35" y="150" width="40" height="5" rx="2" fill="#1e293b"/>
        <rect x="38" y="151.5" width="12" height="2" rx="1" fill="#10b981"/>
        <g style={{ animation: "armWave 2.8s ease-in-out infinite", transformOrigin: "29px 138px" }}>
          <rect x="19" y="131" width="13" height="8" rx="4" fill="#475569"/>
          <rect x="20" y="133" width="10" height="23" rx="4" fill="#475569"/>
        </g>
        {/* raised arm */}
        <g style={{ animation: "raisedArmBounce 1.6s ease-in-out infinite", transformOrigin: "89px 120px" }}>
          <rect x="82" y="118" width="13" height="8" rx="4" fill="#475569"/>
          <rect x="83" y="100" width="10" height="26" rx="4" fill="#475569"/>
        </g>
        {/* confetti */}
        <circle style={{ animation: "confettiSpin 2s linear infinite" }} cx="106" cy="92" r="3" fill="#f59e0b"/>
        <circle style={{ animation: "confettiSpin 2s .5s linear infinite" }} cx="118" cy="83" r="2.5" fill="#10b981"/>
        <circle style={{ animation: "confettiSpin 2s 1s linear infinite" }} cx="102" cy="80" r="2" fill="#ef4444"/>
        <circle style={{ animation: "confettiSpin 2s 1.5s linear infinite" }} cx="114" cy="98" r="2" fill="#2563eb"/>
        <rect x="47" y="116" width="17" height="13" rx="3" fill="#475569"/>
        <g style={{ animation: "headWiggle 3s ease-in-out infinite", transformOrigin: "56px 96px" }}>
          <rect x="33" y="76" width="46" height="40" rx="10" fill="#334155"/>
          <rect x="38" y="83" width="35" height="24" rx="5" fill="#0f172a"/>
          <g style={{ animation: "blink 2.8s ease-in-out infinite", transformOrigin: "50px 95px" }}>
            <rect x="43" y="88" width="14" height="9" rx="4" fill="#2563eb"/>
            <circle style={{ animation: "eyeLookLeft 4s ease-in-out infinite" }} cx="50" cy="93" r="3.5" fill="#93c5fd"/>
          </g>
          <g style={{ animation: "doubleBlink 2.8s .7s ease-in-out infinite", transformOrigin: "68px 95px" }}>
            <rect x="61" y="88" width="14" height="9" rx="4" fill="#2563eb"/>
            <circle style={{ animation: "eyeLookLeft 4s .3s ease-in-out infinite" }} cx="68" cy="93" r="3.5" fill="#93c5fd"/>
          </g>
          <path d="M42 107 Q56 118 72 107" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
          <rect x="53" y="67" width="5" height="11" rx="2" fill="#475569"/>
          <circle style={{ animation: "antennaPulse 1.2s ease-in-out infinite" }} cx="55" cy="64" r="6" fill="#10b981"/>
        </g>
      </g>
      {/* Speech bubble */}
      <rect x="2" y="2" width="158" height="50" rx="10" fill="#fff" stroke="#bbf7d0" strokeWidth="1.5"/>
      <polygon points="52,52 66,52 59,63" fill="#fff" stroke="#bbf7d0" strokeWidth="1"/>
      <polygon points="53,51 65,51 59,61" fill="#fff"/>
      <text x="81" y="22" textAnchor="middle" fontFamily="'Syne',sans-serif" fontSize="11" fontWeight="800" fill="#0f172a">Thanks for joining!</text>
      <text x="81" y="38" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="9.5" fill="#64748b">Let's get your first ad live</text>
    </svg>
  );
}
