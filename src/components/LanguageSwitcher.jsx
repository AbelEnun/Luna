import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";

export default function LanguageSwitcher({ variant = "default" }) {
  const { lang, setLang, currentLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Pill style variant for compact headers
  const isDark = variant === "dark";

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Switch Language / ቋንቋ ቀይር"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 11px",
          fontSize: "12.5px",
          fontWeight: 600,
          borderRadius: "8px",
          cursor: "pointer",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.16)" : "1px solid #e2e8f0",
          background: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
          color: isDark ? "#ffffff" : "#1e293b",
          boxShadow: isDark ? "none" : "0 1px 2px rgba(0, 0, 0, 0.03)",
          transition: "all 0.15s ease",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          if (isDark) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
          } else {
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.background = "#f8fafc";
          }
        }}
        onMouseLeave={(e) => {
          if (isDark) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
          } else {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.background = "#ffffff";
          }
        }}
      >
        <Globe size={14} color={isDark ? "#86efac" : "#18392f"} />
        <span style={{ fontWeight: 700 }}>{currentLanguage?.label || "EN"}</span>
        <span style={{ fontSize: "10px", opacity: 0.6, marginLeft: "1px" }}>▼</span>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04)",
            padding: "5px",
            minWidth: "150px",
            zIndex: 400,
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {LANGUAGES.map((item) => {
            const isSelected = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLang(item.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#18392f" : "#334155",
                  background: isSelected ? "rgba(24, 57, 47, 0.08)" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{item.flag}</span>
                  <span>{item.name}</span>
                </span>
                {isSelected && <Check size={14} color="#18392f" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

