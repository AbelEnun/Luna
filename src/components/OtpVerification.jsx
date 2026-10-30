import { useState, useRef, useEffect } from "react";
import { ShieldCheck, RefreshCw, Check, ArrowRight, ArrowLeft, Mail, Sparkles } from "lucide-react";

export default function OtpVerification({
  email,
  title = "Verify Your Account",
  subtitle = "Please enter the 6-digit verification code sent to your email.",
  generatedOtp,
  onVerify,
  onResend,
  onCancel,
  busy = false,
  error = "",
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(60);
  const [localErr, setLocalErr] = useState("");
  const inputRefs = useRef([]);

  // Auto-focus first input box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    // Handle single digit
    const char = cleaned[cleaned.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setLocalErr("");

    // Auto-focus next box
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);
      setLocalErr("");
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleAutofill = () => {
    if (generatedOtp) {
      const arr = generatedOtp.split("").slice(0, 6);
      setDigits(arr);
      setLocalErr("");
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const entered = digits.join("");
    if (entered.length < 6) {
      setLocalErr("Please enter the complete 6-digit verification code.");
      return;
    }
    if (entered !== generatedOtp) {
      setLocalErr("Invalid verification code. Please check and try again.");
      return;
    }
    setLocalErr("");
    onVerify(entered);
  };

  const handleResendClick = () => {
    if (cooldown > 0) return;
    setDigits(["", "", "", "", "", ""]);
    setLocalErr("");
    setCooldown(60);
    if (onResend) {
      onResend();
    }
    inputRefs.current[0]?.focus();
  };

  const isComplete = digits.every((d) => d !== "");
  const activeError = error || localErr;

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      {/* Icon */}
      <div
        style={{
          width: "68px",
          height: "68px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
          boxShadow: "0 8px 20px rgba(13,31,25,0.25)",
        }}
      >
        <ShieldCheck size={32} color="#fcd34d" />
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
        <Sparkles size={11} /> Two-Step Verification
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f1a16", margin: "0 0 8px" }}>
        {title}
      </h2>

      <p style={{ color: "#6b7280", fontSize: "13.5px", lineHeight: 1.5, margin: "0 0 20px" }}>
        {subtitle}{" "}
        <strong style={{ color: "#0f1a16", display: "block", marginTop: "4px" }}>
          {email}
        </strong>
      </p>

      {/* Real Email Dispatch Notice */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "22px",
          fontSize: "13px",
          color: "#15803d",
          textAlign: "left",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          lineHeight: 1.5,
        }}
      >
        <Mail size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong style={{ color: "#14532d" }}>Verification code sent to email</strong>
          <div style={{ color: "#166534", fontSize: "12px", marginTop: "2px" }}>
            A 6-digit one-time passcode has been dispatched to <strong>{email}</strong>. Check your inbox and spam folder.
          </div>
        </div>
      </div>

      {/* 6 Digit Input Boxes */}
      <form onSubmit={handleSubmit}>
        <div
          onPaste={handlePaste}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: "44px",
                height: "52px",
                borderRadius: "10px",
                border: digit ? "2px solid #0d1f19" : "1.5px solid #d1d5db",
                background: digit ? "#fff" : "#fafafa",
                fontSize: "22px",
                fontWeight: 800,
                textAlign: "center",
                color: "#0f1a16",
                outline: "none",
                transition: "all 0.15s",
                boxShadow: digit ? "0 2px 8px rgba(13,31,25,0.1)" : "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d1f19";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,31,25,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = digit ? "#0d1f19" : "#d1d5db";
                e.target.style.boxShadow = digit ? "0 2px 8px rgba(13,31,25,0.1)" : "none";
              }}
            />
          ))}
        </div>

        {activeError && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              fontSize: "13px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {activeError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={busy || !isComplete}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            background: busy || !isComplete ? "#9ca3af" : "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            border: "none",
            cursor: busy || !isComplete ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: busy || !isComplete ? "none" : "0 4px 14px rgba(13,31,25,0.3)",
            marginBottom: "14px",
            transition: "all 0.2s",
          }}
        >
          {busy ? (
            <>
              <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
              Verifying & Creating Account…
            </>
          ) : (
            <>
              <Check size={16} /> Verify & Complete Registration
            </>
          )}
        </button>

        {/* Resend & Back controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", fontSize: "13px" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              fontWeight: 600,
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <button
            type="button"
            onClick={handleResendClick}
            disabled={cooldown > 0 || busy}
            style={{
              background: "none",
              border: "none",
              cursor: cooldown > 0 ? "not-allowed" : "pointer",
              color: cooldown > 0 ? "#9ca3af" : "#0d1f19",
              fontWeight: 700,
              padding: 0,
            }}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  );
}

