import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import FirebaseEmailVerification from "../components/FirebaseEmailVerification";

export default function Login() {
  const { user, isSuperAdmin, myBusinessSlug, loading, google, login, signup, resetPassword, sendVerificationEmail, reloadAndCheckVerified, logout } = useAuth();
  const { t } = useLanguage();
  const nav = useNavigate();
  const loc = useLocation();
  const returnTo = loc.state?.from;

  const [mode, setMode] = useState("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Email verification state
  const [verificationPending, setVerificationPending] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      // If user is currently in the middle of a new registration flow, wait on verification screen
      if (verificationPending) {
        return;
      }

      if (returnTo) {
        if (isSuperAdmin && returnTo.startsWith("/portal")) {
          nav("/super-admin", { replace: true });
        } else {
          nav(returnTo, { replace: true });
        }
      } else if (isSuperAdmin) {
        nav("/super-admin", { replace: true });
      } else if (myBusinessSlug) {
        nav(`/portal/${myBusinessSlug}`, { replace: true });
      } else {
        nav("/", { replace: true });
      }
    }
  }, [user, isSuperAdmin, loading, returnTo, myBusinessSlug, nav, verificationPending]);

  async function handleResetPassword() {
    if (!email) {
      setErr("Please enter your email address first to reset your password.");
      return;
    }
    setErr("");
    setMessage("");
    setBusy(true);
    try {
      await resetPassword(email);
      setMessage(`A password reset link has been sent to ${email}. Check your inbox!`);
    } catch (e) {
      setErr(String(e.code || e.message).replace("auth/", "").replace(/-/g, " "));
    } finally {
      setBusy(false);
    }
  }

  async function run(fn) {
    setErr("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(String(e.code || e.message).replace("auth/", "").replace(/-/g, " "));
    } finally {
      setBusy(false);
    }
  }

  // Handle registration with Firebase Email Verification
  async function handleFormSubmit(e) {
    e.preventDefault();
    setErr("");
    setMessage("");

    if (mode === "in") {
      run(() => login(email, password));
    } else {
      // Registration: Create account and dispatch Firebase verification email!
      if (!name.trim()) {
        setErr("Please enter your full name.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErr("Please enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setErr("Password must be at least 6 characters.");
        return;
      }

      setBusy(true);
      try {
        await signup(name.trim(), email.trim(), password);
        await sendVerificationEmail();
        setVerificationPending(true);
      } catch (e) {
        setErr(String(e.code || e.message).replace("auth/", "").replace(/-/g, " "));
      } finally {
        setBusy(false);
      }
    }
  }

  // Once verified via link, release hold and proceed
  function handleEmailVerified() {
    setVerificationPending(false);
    if (returnTo) {
      nav(returnTo, { replace: true });
    } else {
      nav("/", { replace: true });
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8f6f1" }}>
      {/* Left decorative panel */}
      <div style={{
        display: "none",
        flex: "0 0 44%",
        background: "linear-gradient(160deg, #0d1f19 0%, #132b23 50%, #0a1a14 100%)",
        padding: "60px 50px",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }} className="login-left-panel">
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "rgba(252, 211, 77, 0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "80px", left: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        {/* Logo */}
        <div>
          <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, color: "#fcd34d" }}>L</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "17px", letterSpacing: "0.02em" }}>Luna</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Multi-Tenant Platform</div>
            </div>
          </Link>
        </div>

        {/* Tagline block */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(252,211,77,0.12)", border: "1px solid rgba(252,211,77,0.25)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", color: "#fcd34d", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "24px" }}>
            <Sparkles size={11} /> Premium Boutique ERP
          </div>
          <h2 style={{ color: "#fff", fontSize: "clamp(28px, 3vw, 36px)", fontWeight: 700, lineHeight: 1.25, margin: "0 0 18px", fontFamily: "var(--display, serif)" }}>
            Your luxury boutique,<br />
            <span style={{ color: "#fcd34d" }}>managed beautifully.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 36px" }}>
            Reservations, inventory, concierge chat and client management — all in one elegant workspace.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {["Private showroom reservations", "Real-time concierge chat", "Curated product catalog", "Subscription & plan management"].map((feat) => (
              <div key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(134,239,172,0.2)", border: "1px solid rgba(134,239,172,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#86efac", fontSize: "10px", lineHeight: 1 }}>✓</span>
                </div>
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          © {new Date().getFullYear()} Luna. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 5vw, 60px) clamp(16px, 4vw, 48px)",
        minHeight: "100vh",
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Mobile logo */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#0d1f19", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#fcd34d" }}>L</div>
              <span style={{ color: "#0d1f19", fontWeight: 700, fontSize: "16px", letterSpacing: "0.02em" }}>Luna</span>
            </Link>
          </div>

          {/* Card */}
          <div style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "clamp(28px, 4vw, 44px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            {verificationPending ? (
              <FirebaseEmailVerification
                email={user?.email || email}
                title="Verify Your Email Address"
                subtitle="Google Firebase has sent a verification email to:"
                onVerified={handleEmailVerified}
                onCancel={async () => {
                  setVerificationPending(false);
                  await logout();
                  setMode("in");
                }}
              />
            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", color: "#16a34a", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" }}>
                    <Sparkles size={10} />
                    {mode === "in" ? t("welcomeBack", "Welcome back") : t("getStarted", "Get Started")}
                  </div>
                  <h1 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, margin: "0 0 6px", color: "#0f1a16", letterSpacing: "-0.02em" }}>
                    {mode === "in" ? t("signIn", "Sign in to your account") : t("createAccount", "Create your account")}
                  </h1>
                  <p style={{ color: "#6b7280", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                    {mode === "in"
                      ? t("authSubtitle", "Access your showroom, reservations, or business portal.")
                      : t("signUpSubtitle", "Join Luna to manage your showroom or wishlist.")}
                  </p>
                </div>

                {/* Google button */}
                <button
                  type="button"
                  onClick={() => run(google)}
                  disabled={busy}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    padding: "11px 16px", borderRadius: "10px",
                    border: "1.5px solid #e5e7eb", background: "#fff", cursor: busy ? "not-allowed" : "pointer",
                    fontSize: "14px", fontWeight: 600, color: "#374151",
                    transition: "all 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    marginBottom: "20px",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#0d1f19"; e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}
                >
                  {/* Google SVG */}
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {t("continueWithGoogle", "Continue with Google")}
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ flex: 1, height: "1px", background: "#f0f0f0" }} />
                  <span style={{ color: "#9ca3af", fontSize: "12px", fontWeight: 500 }}>{t("orUseEmail", "or with email")}</span>
                  <div style={{ flex: 1, height: "1px", background: "#f0f0f0" }} />
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit}>
                  {mode === "up" && (
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{t("fullName", "Full Name")}</label>
                      <div style={{ position: "relative" }}>
                        <User size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                        <input
                          value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sara K." required
                          style={{ width: "100%", paddingLeft: "36px", paddingRight: "14px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#fafafa", color: "#111" }}
                          onFocus={e => e.target.style.borderColor = "#0d1f19"}
                          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{t("emailAddress", "Email Address")}</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required
                        style={{ width: "100%", paddingLeft: "36px", paddingRight: "14px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#fafafa", color: "#111" }}
                        onFocus={e => e.target.style.borderColor = "#0d1f19"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{t("password", "Password")}</label>
                      {mode === "in" && (
                        <button type="button" onClick={handleResetPassword} disabled={busy} style={{ fontSize: "12px", color: "#0d1f19", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                          {t("forgotPassword", "Forgot password?")}
                        </button>
                      )}
                    </div>
                    <div style={{ position: "relative" }}>
                      <Lock size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                      <input
                        type={showPw ? "text" : "password"} minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                        style={{ width: "100%", paddingLeft: "36px", paddingRight: "42px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "9px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", boxSizing: "border-box", background: "#fafafa", color: "#111" }}
                        onFocus={e => e.target.style.borderColor = "#0d1f19"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex" }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {message && (
                    <div style={{ padding: "11px 14px", borderRadius: "9px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>
                      {message}
                    </div>
                  )}

                  {err && (
                    <div style={{ padding: "11px 14px", borderRadius: "9px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>
                      {err}
                      {err.toLowerCase().includes("email already in use") && (
                        <button type="button" onClick={() => { setMode("in"); setErr(""); }} style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "#dc2626", background: "none", border: "1px solid #fca5a5", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
                          Switch to Sign In →
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit" disabled={busy}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "10px",
                      background: busy ? "#9ca3af" : "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
                      color: "#fff", fontWeight: 700, fontSize: "15px", border: "none",
                      cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      transition: "all 0.2s", letterSpacing: "0.01em",
                      boxShadow: busy ? "none" : "0 4px 14px rgba(13,31,25,0.35)",
                    }}
                  >
                    {busy ? t("processing", "Processing…") : (
                      <>
                        {mode === "in" ? t("signIn", "Sign In") : "Create Account & Verify Email"}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Mode toggle */}
                <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#6b7280" }}>
                    {mode === "in" ? t("needCustomerAccount", "Don't have an account?") : t("alreadyRegistered", "Already have an account?")}{" "}
                    <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setVerificationPending(false); setErr(""); setMessage(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#0d1f19", fontWeight: 700, fontSize: "13px", padding: 0 }}>
                      {mode === "in" ? t("createAccount", "Create an account") : t("signIn", "Sign in")}
                    </button>
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                    {t("boutiqueOwnerPrompt", "Are you a boutique owner?")}{" "}
                    <Link to="/register-business" style={{ color: "#0d1f19", fontWeight: 700, textDecoration: "none", fontSize: "12px" }}>
                      {t("registerBusinessHere", "Register your business →")}
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Responsive style: show left panel on wide screens */}
      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
