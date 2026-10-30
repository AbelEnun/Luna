import { useEffect, useRef } from "react";
import { LogOut, AlertTriangle, Trash2, X, User } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  variant, // "signout" | "danger" | "default"
  accountEmail,
}) {
  const closeButtonRef = useRef(null);
  const { t } = useLanguage();

  const isSignOut =
    variant === "signout" ||
    /sign\s*out/i.test(title || "") ||
    /sign\s*out/i.test(confirmLabel || "");

  const isDanger =
    variant === "danger" ||
    (!isSignOut && (/delete|remove|revoke|unpublish/i.test(title || "") || /delete|remove/i.test(confirmLabel || "")));

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(document.querySelectorAll('[role="dialog"] button:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Extract email if title includes one and no explicit accountEmail prop was passed
  const emailMatch = title?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const displayEmail = accountEmail || (emailMatch ? emailMatch[1] : null);

  // If email was embedded in title, provide a cleaner headline
  let cleanTitle = title;
  if (emailMatch && isSignOut) {
    cleanTitle = t("signOutAccountTitle", "Sign out of your account?");
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13, 31, 25, 0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "32px 28px 26px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 24px 48px -12px rgba(13, 31, 25, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          textAlign: "center",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Close 'X' button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close", "Close")}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#0f172a";
            e.currentTarget.style.background = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.background = "none";
          }}
        >
          <X size={18} />
        </button>

        {/* Centered Top Icon Badge */}
        {isSignOut ? (
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fff7ed 0%, #fee2e2 100%)",
              border: "2px solid #ffedd5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#ea580c",
              boxShadow: "0 8px 20px -4px rgba(234, 88, 12, 0.2)",
            }}
          >
            <LogOut size={26} style={{ transform: "translateX(1px)" }} />
          </div>
        ) : isDanger ? (
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fef2f2",
              border: "2px solid #fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#dc2626",
              boxShadow: "0 8px 20px -4px rgba(220, 38, 38, 0.2)",
            }}
          >
            <Trash2 size={26} />
          </div>
        ) : (
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#475569",
            }}
          >
            <AlertTriangle size={26} />
          </div>
        )}

        {/* User Account Pill if email is known */}
        {displayEmail && isSignOut && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: "12.5px",
              fontWeight: 500,
              color: "#475569",
              marginBottom: "12px",
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <User size={13} color="#64748b" />
            <span>{displayEmail}</span>
          </div>
        )}

        {/* Centered Heading */}
        <h2
          id="confirm-title"
          style={{
            fontFamily: "var(--display, serif)",
            fontSize: "21px",
            fontWeight: 700,
            color: "#0f1a16",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
            textAlign: "center",
          }}
        >
          {cleanTitle}
        </h2>

        {/* Centered Description */}
        {description && (
          <p
            style={{
              fontSize: "13.5px",
              color: "#64748b",
              lineHeight: 1.55,
              margin: "0 0 24px",
              textAlign: "center",
            }}
          >
            {description}
          </p>
        )}

        {/* Centered Action Choice Buttons */}
        <div
          className="dialog-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            width: "100%",
          }}
        >
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {cancelLabel || t("staySignedIn", "Stay Signed In")}
          </button>
          <button
            type="button"
            className={isDanger ? "btn danger" : "btn"}
            ref={closeButtonRef}
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: "10px",
              background: isSignOut
                ? "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)"
                : isDanger
                ? "#dc2626"
                : "#0d1f19",
              border: isSignOut ? "1px solid #18392f" : "none",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: isSignOut
                ? "0 4px 14px rgba(13, 31, 25, 0.25)"
                : isDanger
                ? "0 4px 14px rgba(220, 38, 38, 0.25)"
                : "none",
              transition: "all 0.15s ease",
            }}
          >
            {isSignOut && <LogOut size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
