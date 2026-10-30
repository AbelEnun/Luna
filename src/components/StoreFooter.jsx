import { Link } from "react-router-dom";
import { Phone, MessageCircle, Send, Camera, Mail, MapPin, Clock, ArrowUpRight, Sparkles } from "lucide-react";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";

export default function StoreFooter() {
  const { business, slug } = useTenant();
  const { t } = useLanguage();

  return (
    <footer
      style={{
        background: "#0f231d",
        color: "#ffffff",
        padding: "70px clamp(20px, 6vw, 80px) 30px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "48px 40px",
          paddingBottom: "50px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Brand Column */}
        <div>
          <Link
            to={`/store/${slug}`}
            style={{
              fontFamily: "var(--display)",
              fontSize: "30px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              display: "block",
              marginBottom: "14px",
            }}
          >
            {business?.name || "Boutique"}
          </Link>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", lineHeight: 1.65, margin: "0 0 20px", maxWidth: "340px" }}>
            {business?.aboutText || business?.tagline || "Curated luxury showroom offering private fittings, custom reservations, and concierge styling."}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.08)", fontSize: "12px", color: "rgba(255, 255, 255, 0.65)" }}>
            <Sparkles size={12} color="#fcd34d" /> {t("verifiedShowroom", "Verified Boutique Showroom")}
          </div>
        </div>

        {/* Concierge & Contact Column */}
        <div>
          <h3 style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fcd34d", fontWeight: 700, margin: "0 0 20px" }}>
            {t("conciergeAndLocation", "Concierge & Location")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {business?.address && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.8)" }}>
                <MapPin size={16} color="#fcd34d" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{business.address}</span>
              </div>
            )}

            {business?.openingHours && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.8)" }}>
                <Clock size={16} color="#fcd34d" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{business.openingHours}</span>
              </div>
            )}

            {business?.phone && (
              <a
                href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}
                style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", textDecoration: "none" }}
              >
                <Phone size={15} /> {business.phone}
              </a>
            )}

            {business?.whatsapp && (
              <a
                href={business.whatsapp}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", textDecoration: "none" }}
              >
                <MessageCircle size={15} /> WhatsApp Concierge <ArrowUpRight size={12} />
              </a>
            )}

            {business?.telegram && (
              <a
                href={business.telegram}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", textDecoration: "none" }}
              >
                <Send size={15} /> Telegram Channel <ArrowUpRight size={12} />
              </a>
            )}

            {business?.instagram && (
              <a
                href={business.instagram}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", textDecoration: "none" }}
              >
                <Camera size={15} /> Instagram Lookbook <ArrowUpRight size={12} />
              </a>
            )}

            {business?.email && (
              <a
                href={`mailto:${business.email}`}
                style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", textDecoration: "none" }}
              >
                <Mail size={15} /> {business.email}
              </a>
            )}
          </div>
        </div>

        {/* Explore Showroom Column */}
        <div>
          <h3 style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fcd34d", fontWeight: 700, margin: "0 0 20px" }}>
            {t("exploreDepartment", "Explore Showroom")}
          </h3>
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }} aria-label="Footer showroom links">
            <Link to={`/store/${slug}`} style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none" }}>
              {t("home", "Showroom Collection")}
            </Link>
            <Link to={`/store/${slug}/wishlist`} style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none" }}>
              {t("wishlist", "Saved Wishlist")}
            </Link>
            <Link to={`/store/${slug}/reservations`} style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none" }}>
              {t("reservations", "Showroom Reservations")}
            </Link>
            <Link to={`/store/${slug}/chat`} style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none" }}>
              {t("chat", "Live Concierge Styling")}
            </Link>
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <Link to="/" style={{ color: "#fcd34d", fontSize: "13px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {t("browseBoutiques", "Browse other boutiques on Luna →")}
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Bottom Copyright bar */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "rgba(255, 255, 255, 0.45)",
        }}
      >
        <span>© {new Date().getFullYear()} {business?.name || "Boutique"}. {t("allRightsReserved", "All rights reserved.")}</span>
        <span>
          Powered by{" "}
          <Link to="/" style={{ color: "rgba(255, 255, 255, 0.7)", textDecoration: "underline" }}>
            Luna
          </Link>{" "}
          Platform
        </span>
      </div>
    </footer>
  );
}
