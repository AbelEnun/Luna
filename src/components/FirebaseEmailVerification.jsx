import { useState, useEffect, useRef } from "react";
import { Mail, RefreshCw, Check, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function FirebaseEmailVerification({
  email,
  title = "Verify Your Email Address",
  subtitle = "We've sent a verification link to your email inbox via Firebase.",
  onVerified,
  onCancel,
}) {
  const { sendVerificationEmail, reloadAndCheckVerified, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);
  const verifiedRef = useRef(false);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Auto-polling: periodically check if user clicked the link in their email
  useEffect(() => {
    const interval = setInterval(async () => {
      if (verifiedRef.current) return;
      try {
        const isVerified = await reloadAndCheckVerified();
        if (isVerified) {
          verifiedRef.current = true;
          clearInterval(interval);
          if (onVerified) onVerified();
        }
      } catch (e) {
        // Silent ignore during background polling
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [reloadAndCheckVerified, onVerified]);

  const handleManualCheck = async () => {
    setChecking(true);
    setError("");
    try {
      const isVerified = await reloadAndCheckVerified();
      if (isVerified) {
        verifiedRef.current = true;
        if (onVerified) onVerified();
      } else {
        setError("Email not yet verified. Please open the email from Firebase and click the verification link, then try again.");
      }
    } catch (e) {
      setError("Unable to check verification status. Please check your internet connection.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setResendSuccess(false);
    try {
      await sendVerificationEmail();
      setCooldown(60);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (e) {
      setError(e.message || "Failed to resend verification email. Please try again in a minute.");
    }
  };

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      {/* Icon */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 8px 24px rgba(13,31,25,0.25)",
        }}
      >
        <Mail size={34} color="#fcd34d" />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "20px",
          padding: "3px 12px",
          fontSize: "11px",
          color: "#16a34a",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        <ShieldCheck size={11} /> Firebase Email Verification
      </div>

      <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f1a16", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
        {title}
      </h2>

      <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: 1.55, margin: "0 0 24px" }}>
        {subtitle}
        <strong style={{ color: "#0f1a16", display: "block", fontSize: "15px", marginTop: "6px" }}>
          {email}
        </strong>
      </p>

      {/* Visual Instruction Steps */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        {[
          { num: "1", text: "Open your email inbox (and spam/junk folder)" },
          { num: "2", text: "Click the verification link from Firebase" },
          { num: "3", text: "Return here — you'll be redirected automatically" },
        ].map((item, idx) => (
          <div
            key={item.num}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: idx < 2 ? "12px" : 0,
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#0d1f19",
                color: "#fcd34d",
                fontSize: "11px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.num}
            </div>
            <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {resendSuccess && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "9px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#16a34a",
            fontSize: "13px",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          ✓ A fresh verification email has been sent! Check your inbox.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "11px 14px",
            borderRadius: "9px",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            fontSize: "13px",
            marginBottom: "16px",
            lineHeight: 1.5,
            textAlign: "left",
          }}
        >
          {error}
        </div>
      )}

      {/* Main Action Button */}
      <button
        type="button"
        onClick={handleManualCheck}
        disabled={checking}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "10px",
          background: checking ? "#9ca3af" : "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "15px",
          border: "none",
          cursor: checking ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: checking ? "none" : "0 4px 14px rgba(13,31,25,0.3)",
          marginBottom: "12px",
          transition: "all 0.2s",
        }}
      >
        {checking ? (
          <>
            <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
            Checking verification…
          </>
        ) : (
          <>
            <Check size={16} /> I've Verified My Email
          </>
        )}
      </button>

      {/* Resend button */}
      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "10px",
          background: "none",
          border: "1.5px solid #e5e7eb",
          color: cooldown > 0 ? "#9ca3af" : "#374151",
          fontWeight: 600,
          fontSize: "13px",
          cursor: cooldown > 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          marginBottom: "16px",
        }}
      >
        <RefreshCw size={13} />
        {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend Verification Email"}
      </button>

      {/* Cancel or switch account */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: "12.5px",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Use a different email address
        </button>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

