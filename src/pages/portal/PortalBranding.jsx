import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Palette, Check, Sparkles, ExternalLink, Globe, Store,
  Image as ImageIcon, MessageSquare, MapPin, Clock, Phone,
  Send, ArrowRight, Eye, ShieldCheck, Camera
} from "lucide-react";
import { db } from "../../firebase";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { CURRENCIES } from "../../config";

const LUXURY_PALETTES = [
  { name: "Emerald Atelier", hex: "#18392f" },
  { name: "Imperial Noir",   hex: "#0f172a" },
  { name: "Sand Brass",      hex: "#a8874f" },
  { name: "Bordeaux Velvet", hex: "#701a75" },
  { name: "Terracotta Earth",hex: "#9a3412" },
  { name: "Sapphire Midnight",hex: "#1e3a5f" },
  { name: "Classic Onyx",    hex: "#111111" },
];

const EMPTY_BRANDING = {
  name: "",
  tagline: "",
  logoUrl: "",
  heroImageUrl: "",
  heroTitle: "",
  aboutText: "",
  currency: "ETB",
  announcement: "",
  accentColor: "#18392f",
  phone: "",
  whatsapp: "",
  telegram: "",
  instagram: "",
  email: "",
  address: "",
  openingHours: "",
};

export default function PortalBranding() {
  const { business, businessId, slug } = useTenant();
  const { show } = useToast();
  const { t } = useLanguage();

  const [form, setForm] = useState(EMPTY_BRANDING);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (business) {
      setForm((prev) => ({ ...prev, ...business }));
    }
  }, [business]);

  const update = (key) => (e) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
  };

  const handleColorSelect = (hex) => {
    setForm((current) => ({ ...current, accentColor: hex }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaved(false);

    try {
      if (businessId) {
        await updateDoc(doc(db, "businesses", businessId), {
          name: form.name.trim(),
          tagline: form.tagline.trim(),
          logoUrl: form.logoUrl?.trim() || "",
          heroImageUrl: form.heroImageUrl?.trim() || "",
          heroTitle: form.heroTitle?.trim() || "",
          aboutText: form.aboutText?.trim() || "",
          currency: form.currency || "ETB",
          announcement: form.announcement?.trim() || "",
          accentColor: form.accentColor || "#18392f",
          phone: form.phone?.trim() || "",
          whatsapp: form.whatsapp?.trim() || "",
          telegram: form.telegram?.trim() || "",
          instagram: form.instagram?.trim() || "",
          email: form.email?.trim() || "",
          address: form.address?.trim() || "",
          openingHours: form.openingHours?.trim() || "",
          updatedAt: serverTimestamp(),
        });
      }
      setSaved(true);
      show("Storefront branding saved successfully!");
      setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      setSaveError(err.message || "Failed to update branding settings.");
    } finally {
      setSaving(false);
    }
  };

  const storeUrl = `${window.location.origin}/store/${slug}`;

  return (
    <div className="portal-branding-page" style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* ── HEADER ACTION BAR ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "32px",
          paddingBottom: "24px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#18392f",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "6px",
            }}
          >
            <Palette size={14} /> {t("brandIdentityAndStorefront", "Visual Studio")}
          </span>
          <h1 style={{ fontFamily: "var(--display)", fontSize: "32px", margin: 0, fontWeight: 600 }}>
            {t("brandIdentityAndStorefront", "Storefront & Brand Customizer")}
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>
            {t("customizeVisualIdentity", "Fine-tune color palette, editorial hero photography, brand messaging, and client channels.")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13.5px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#94a3b8";
              e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.background = "#ffffff";
            }}
          >
            <Eye size={15} /> {t("viewLiveStore", "Visit Live Showroom")} <ExternalLink size={13} color="#94a3b8" />
          </a>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "8px",
              background: saved ? "#16a34a" : "#18392f",
              color: "#ffffff",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(24,57,47,0.18)",
              transition: "all 0.2s ease",
            }}
          >
            {saved ? (
              <>
                <Check size={16} /> {t("saved", "Saved Successfully")}
              </>
            ) : saving ? (
              t("saving", "Saving Changes…")
            ) : (
              t("saveChanges", "Save All Changes")
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div
          style={{
            padding: "14px 18px",
            marginBottom: "24px",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "10px",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          {saveError}
        </div>
      )}

      {/* ── TWO-COLUMN STUDIO GRID ── */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 380px",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* ── LEFT: STUDIO CONTROLS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* CARD 1: Identity & Palette */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "24px 28px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(24,57,47,0.08)",
                    color: "#18392f",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Palette size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    {t("boutiqueIdentityAndPalette", "Boutique Identity & Palette")}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {t("coreBrandingSubtitle", "Core branding elements visible across client discovery.")}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("boutiqueName", "Boutique Name *")}
                  </label>
                  <input
                    type="text"
                    value={form.name || ""}
                    onChange={update("name")}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("operatingCurrency", "Operating Currency")}
                  </label>
                  <select
                    value={form.currency || "ETB"}
                    onChange={update("currency")}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                      cursor: "pointer",
                    }}
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.code} ({cur.symbol}) — {cur.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Accent Color Palette Selector */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                  {t("brandAccentColor", "Brand Accent Color")}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {LUXURY_PALETTES.map((p) => {
                    const isSelected = (form.accentColor || "#18392f").toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => handleColorSelect(p.hex)}
                        title={p.name}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: p.hex,
                          border: isSelected ? "3px solid #ffffff" : "2px solid transparent",
                          outline: isSelected ? `2px solid ${p.hex}` : "none",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                          transition: "transform 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        {isSelected && <Check size={14} color="#ffffff" />}
                      </button>
                    );
                  })}

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "6px" }}>
                    <input
                      type="color"
                      value={form.accentColor || "#18392f"}
                      onChange={update("accentColor")}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        cursor: "pointer",
                        padding: "2px",
                        background: "#ffffff",
                      }}
                    />
                    <code style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                      {form.accentColor || "#18392f"}
                    </code>
                  </div>
                </div>
              </div>

              {/* Logo URL with Live Thumbnail Preview */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  {t("logoImageAddress", "Logo Image URL")}
                </label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      border: "1px dashed #cbd5e1",
                      background: "#f8fafc",
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <Store size={20} color="#94a3b8" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={form.logoUrl || ""}
                    onChange={update("logoUrl")}
                    placeholder="https://.../brand-logo.png"
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Hero Visuals & Editorial Headline */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "24px 28px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(24,57,47,0.08)",
                    color: "#18392f",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    {t("showroomHeroTitle", "Showroom Hero & Editorial Headline")}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {t("showroomHeroSubtitle", "The primary visual showcase greeting clients on landing.")}
                  </span>
                </div>
              </div>

              {/* Tagline & Headline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("heroHeadlineTitle", "Hero Headline Title")}
                  </label>
                  <input
                    type="text"
                    value={form.heroTitle || ""}
                    onChange={update("heroTitle")}
                    placeholder="A considered collection"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("curatorTagline", "Curator Tagline")}
                  </label>
                  <input
                    type="text"
                    value={form.tagline || ""}
                    onChange={update("tagline")}
                    placeholder="New arrivals, chosen by hand and photographed weekly."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>

              {/* Hero Banner Image URL */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  {t("heroBannerPhotoAddress", "Hero Banner Photography URL")}
                </label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div
                    style={{
                      width: "68px",
                      height: "44px",
                      borderRadius: "8px",
                      border: "1px dashed #cbd5e1",
                      background: "#f8fafc",
                      overflow: "hidden",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {form.heroImageUrl ? (
                      <img src={form.heroImageUrl} alt="Hero preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <ImageIcon size={18} color="#94a3b8" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={form.heroImageUrl || ""}
                    onChange={update("heroImageUrl")}
                    placeholder="https://images.unsplash.com/photo-..."
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>

              {/* Top Announcement Bar */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  {t("topAnnouncementStrip", "Top Announcement Strip")}
                </label>
                <input
                  type="text"
                  value={form.announcement || ""}
                  onChange={update("announcement")}
                  placeholder="Complimentary private styling appointments available this weekend."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#f8fafc",
                  }}
                />
              </div>

              {/* Editorial About Text */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  {t("brandStoryAndPhilosophy", "Editorial Brand Story & Philosophy")}
                </label>
                <textarea
                  rows={4}
                  value={form.aboutText || ""}
                  onChange={update("aboutText")}
                  placeholder="Share your atelier origin, design philosophy, materials curation, and fashion commitment..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#f8fafc",
                    lineHeight: 1.5,
                  }}
                />
              </div>
            </div>

            {/* CARD 3: Concierge & Client Channels */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "24px 28px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(24,57,47,0.08)",
                    color: "#18392f",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    {t("conciergeAndAtelier", "Concierge Channels & Physical Atelier")}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {t("conciergeAndAtelierSubtitle", "Direct inquiry links and showroom visit details.")}
                  </span>
                </div>
              </div>

              {/* Phone, WhatsApp, Telegram */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("telephone", "Telephone")}
                  </label>
                  <input
                    type="tel"
                    value={form.phone || ""}
                    onChange={update("phone")}
                    placeholder="+251 91 123 4567"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("whatsAppLink", "WhatsApp Link")}
                  </label>
                  <input
                    type="url"
                    value={form.whatsapp || ""}
                    onChange={update("whatsapp")}
                    placeholder="https://wa.me/251..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("telegramChannel", "Telegram Channel")}
                  </label>
                  <input
                    type="url"
                    value={form.telegram || ""}
                    onChange={update("telegram")}
                    placeholder="https://t.me/brand..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>

              {/* Instagram & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("instagramUrl", "Instagram URL")}
                  </label>
                  <input
                    type="url"
                    value={form.instagram || ""}
                    onChange={update("instagram")}
                    placeholder="https://instagram.com/brand..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("conciergeEmail", "Concierge Email")}
                  </label>
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={update("email")}
                    placeholder="concierge@brand.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>

              {/* Physical Address & Hours */}
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("physicalShowroomAddress", "Physical Showroom Address")}
                  </label>
                  <input
                    type="text"
                    value={form.address || ""}
                    onChange={update("address")}
                    placeholder="Bole Medhanialem, Addis Ababa"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    {t("hoursOfOperation", "Opening Hours")}
                  </label>
                  <input
                    type="text"
                    value={form.openingHours || ""}
                    onChange={update("openingHours")}
                    placeholder="Mon – Sat: 10:00 AM – 8:00 PM"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 28px",
                  borderRadius: "8px",
                  background: saved ? "#16a34a" : "#18392f",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(24,57,47,0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                {saved ? <Check size={16} /> : null}
                {saving ? t("saving", "Saving Changes…") : saved ? t("saved", "Changes Saved ✓") : t("saveAllBrandChanges", "Save All Brand Changes")}
              </button>
            </div>
          </div>

          {/* ── RIGHT: LIVE MINI STOREFRONT PREVIEW DOCK ── */}
          <aside
            style={{
              position: "sticky",
              top: "90px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#64748b",
                }}
              >
                {t("liveStorefrontMirror", "Live Storefront Mirror")}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#16a34a",
                  background: "#dcfce7",
                  padding: "2px 8px",
                  borderRadius: "99px",
                }}
              >
                ● Real-time
              </span>
            </div>

            {/* Miniature Browser Frame */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 14px 34px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)",
                overflow: "hidden",
                borderTop: `4px solid ${form.accentColor || "#18392f"}`,
              }}
            >
              {/* Browser chrome top bar */}
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    color: "#64748b",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  /store/{slug}
                </div>
              </div>

              {/* Announcement Bar */}
              {form.announcement && (
                <div
                  style={{
                    background: form.accentColor || "#18392f",
                    color: "#ffffff",
                    padding: "6px 12px",
                    fontSize: "11px",
                    textAlign: "center",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {form.announcement}
                </div>
              )}

              {/* Mini Brand Nav */}
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#ffffff",
                }}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" style={{ height: "24px", maxWidth: "120px", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>
                    {form.name || "Boutique"}
                  </span>
                )}
                <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#64748b" }}>
                  <span>Showroom</span>
                  <span>Wishlist</span>
                  <span>Chat</span>
                </div>
              </div>

              {/* Mini Hero */}
              <div
                style={{
                  position: "relative",
                  minHeight: "180px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "20px 18px",
                  backgroundImage: form.heroImageUrl
                    ? `linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%), url(${form.heroImageUrl})`
                    : `linear-gradient(135deg, ${form.accentColor || "#18392f"} 0%, #0f172a 100%)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: "#ffffff",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#f8fafc",
                    opacity: 0.9,
                    marginBottom: "3px",
                  }}
                >
                  {form.name || "Showroom"}
                </span>
                <h4
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "18px",
                    fontWeight: 600,
                    margin: "0 0 4px",
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  {form.heroTitle || "A considered collection"}
                </h4>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", margin: "0 0 10px", lineHeight: 1.4 }}>
                  {form.tagline || "Curated luxury drops."}
                </p>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      background: "#ffffff",
                      color: form.accentColor || "#18392f",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "4px",
                    }}
                  >
                    Explore Collection →
                  </span>
                </div>
              </div>

              {/* Mini Footer / Details Strip */}
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                  color: "#64748b",
                }}
              >
                <span>
                  Currency: <strong>{form.currency || "ETB"}</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: form.accentColor || "#18392f",
                      display: "inline-block",
                    }}
                  />
                  <code>{form.accentColor || "#18392f"}</code>
                </span>
              </div>
            </div>

            {/* Quick Link Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color="#16a34a" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{t("instantClientAccess", "Instant Client Access")}</span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {t("feature1Desc", "Share this link directly on Instagram bio, WhatsApp catalog, or private client SMS.")}
              </p>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(24,57,47,0.06)",
                  color: "#18392f",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <span>{t("openPublicShowroom", "Open Public Showroom")}</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
