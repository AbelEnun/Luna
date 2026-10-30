import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import {
  Store,
  Sparkles,
  MessageCircle,
  CalendarCheck,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  X,
  ShieldCheck,
  Search,
  Copy,
  Check,
  ChevronDown,
  ShoppingBag,
  Clock,
  Compass,
  Zap,
  Lock,
  Heart,
  Building,
} from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PlatformHeader from "../components/PlatformHeader";

const CURRENCY_COLORS = {
  ETB: { bg: "#fff8e1", color: "#a16207" },
  USD: { bg: "#f0fdf4", color: "#166534" },
  EUR: { bg: "#eff6ff", color: "#1e40af" },
};

const CATEGORY_TABS = ["All", "Haute Couture", "Ready-to-Wear", "Habesha Kemis", "Leather & Bags"];

export default function PlatformHome() {
  const { user, myBusiness, isSuperAdmin } = useAuth();
  const { t } = useLanguage();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Interactive Ecosystem Tab State: 'showroom' | 'erp' | 'concierge'
  const [activeEcosystemTab, setActiveEcosystemTab] = useState("showroom");

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Link copy feedback state
  const [copiedSlug, setCopiedSlug] = useState(null);

  // How it works steps
  const howItWorksSteps = [
    {
      number: 1,
      title: t("step1Title", "Register Your Boutique"),
      description: t("step1Desc", "Enter your boutique brand name, custom URL slug, and contact details in under 60 seconds."),
    },
    {
      number: 2,
      title: t("step2Title", "Instant Platform Activation"),
      description: t("step2Desc", "Your boutique is verified and granted a personalized private ERP operations console immediately."),
    },
    {
      number: 3,
      title: t("step3Title", "Upload Drops & Brand Theme"),
      description: t("step3Desc", "Publish your lookbook collections, set custom hero imagery, color palette, and local pricing."),
    },
    {
      number: 4,
      title: t("step4Title", "Accept VIP Fitting Reservations"),
      description: t("step4Desc", "Share your dedicated link on Instagram and WhatsApp. Manage fitting reservations and chat in real time."),
    },
  ];

  // Fetch real registered businesses from Firestore only (no demo companies)
  useEffect(() => {
    async function loadDirectory() {
      try {
        const q = query(
          collection(db, "businesses"),
          where("status", "in", ["approved", "active"]),
          limit(30)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBusinesses(list);
        } else {
          setBusinesses([]);
        }
      } catch (e) {
        console.warn("Could not query directory:", e);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    }
    loadDirectory();
  }, []);

  // Filter real businesses by search query and category
  const filteredBoutiques = useMemo(() => {
    return businesses.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "All" ||
        b.category?.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [businesses, searchQuery, selectedCategory]);

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/store/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Determine smart banner content for logged-in users
  const showBanner = user && !bannerDismissed;
  let bannerContent = null;
  let bannerStyle = {};

  if (showBanner) {
    if (isSuperAdmin) {
      bannerStyle = { background: "#0f172a", color: "#f8fafc" };
      bannerContent = (
        <>
          <ShieldCheck size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span>
            <strong>{t("superAdminConsole", "Luna Master Administration")}</strong> — {t("superAdmin", "Super Admin")}.{" "}
            <Link
              to="/super-admin"
              style={{ color: "#7dd3fc", textDecoration: "underline", fontWeight: 600, marginLeft: "4px" }}
            >
              {t("openConciergeChat", "Open Admin Panel")} →
            </Link>
          </span>
        </>
      );
    } else if (myBusiness) {
      bannerStyle = { background: "#14532d", color: "#f0fdf4" };
      bannerContent = (
        <>
          <CheckCircle2 size={16} color="#86efac" style={{ flexShrink: 0 }} />
          <span>
            {t("welcomeBackBoutiqueLive", "Welcome back! Your showroom is live.")}{" "}
            <Link
              to={`/portal/${myBusiness.slug}`}
              style={{ color: "#fcd34d", textDecoration: "underline", fontWeight: 700, marginLeft: "4px" }}
            >
              {t("goToBusinessPortal", "Go to your business portal")} ({myBusiness.name}) →
            </Link>
          </span>
        </>
      );
    } else {
      bannerStyle = { background: "#f0fdf4", color: "#166534", borderBottom: "1px solid #bbf7d0" };
      bannerContent = (
        <>
          <Store size={16} style={{ flexShrink: 0 }} />
          <span>
            {t("readyToOpenBoutique", "Ready to open your boutique showroom?")}{" "}
            <Link
              to="/register-business"
              style={{ color: "#14532d", textDecoration: "underline", fontWeight: 700, marginLeft: "4px" }}
            >
              {t("registerBusiness", "Register your business in 60s")} →
            </Link>
          </span>
        </>
      );
    }
  }

  // Active business to represent the live preview (uses real business if registered, or dynamic fallback template)
  const activePreviewBiz = businesses[0] || myBusiness;

  const faqs = [
    {
      q: t("faq1Q", "How do clients reserve pieces without making online card payments upfront?"),
      a: t("faq1A", "Clients browse your high-definition lookbook and submit private fitting reservations with their phone number, WhatsApp, and preferred fitting time. You receive the reservation directly in your Luna ERP console to coordinate in-store fittings or arrange direct bank transfers."),
    },
    {
      q: t("faq2Q", "Can I use my own boutique name, currency, and brand color palette?"),
      a: t("faq2A", "Yes! Every boutique receives an isolated multi-tenant environment. You select your currency (ETB, USD, EUR), custom primary color palette, boutique logo, opening hours, and dedicated URL slug (e.g. /store/your-atelier)."),
    },
    {
      q: t("faq3Q", "How fast can I launch my boutique showroom?"),
      a: t("faq3A", "In less than 2 minutes. Fill in your boutique name and category, set your admin credentials, and your showroom link is ready to be added to your Instagram bio, WhatsApp catalog, or Telegram channel immediately."),
    },
    {
      q: t("faq4Q", "Do customers need to download a mobile app to shop?"),
      a: t("faq4A", "No app download is needed. Luna showrooms are lightning-fast responsive progressive web applications that open seamlessly inside Instagram, TikTok, WhatsApp, or any mobile browser."),
    },
    {
      q: t("faq5Q", "What operations tools are included in the Luna ERP portal?"),
      a: t("faq5A", "The Luna ERP portal provides real-time SKU inventory tracking with size/color variants, total inventory valuation metrics, an interactive reservation pipeline (Pending, Confirmed, Completed), and 1-on-1 VIP concierge inquiries."),
    },
  ];

  return (
    <div className="platform-page" style={{ background: "#fbfaf7", minHeight: "100vh" }}>
      {/* Top Glassmorphic Navigation */}
      <PlatformHeader />

      {/* Smart Alert Banner for Authenticated Users */}
      {showBanner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 24px",
            fontSize: "13.5px",
            position: "relative",
            zIndex: 30,
            ...bannerStyle,
          }}
        >
          {bannerContent}
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => setBannerDismissed(true)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.75,
              color: "inherit",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── LUXURY HERO SECTION ── */}
      <section className="luna-hero-enhanced">
        <div className="luna-hero-glow" />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", maxWidth: "860px", margin: "0 auto" }}>
            {/* Category Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 18px",
                background: "rgba(24, 57, 47, 0.08)",
                border: "1px solid rgba(24, 57, 47, 0.15)",
                borderRadius: "999px",
                color: "#18392f",
                fontSize: "12.5px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              <Sparkles size={14} color="#d97706" />
              <span>{t("heroCategoryPill", "Multi-Tenant Luxury Boutique Platform")}</span>
            </div>

            {/* Main Editorial Headline */}
            <h1
              style={{
                fontFamily: "var(--display, serif)",
                fontSize: "clamp(36px, 5.5vw, 66px)",
                fontWeight: 700,
                color: "#0d1f19",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                margin: "0 0 20px",
              }}
            >
              {t("heroTitleMain", "The Modern Operating System for Independent Boutiques.")}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 19px)",
                color: "#475569",
                lineHeight: 1.65,
                margin: "0 auto 36px",
                maxWidth: "680px",
              }}
            >
              {t("heroSubMain", "Empower your fashion atelier with an exclusive shareable client showroom link, realtime VIP concierge chat, in-store fitting reservations, and a unified inventory ERP.")}
            </p>

            {/* Primary Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "40px",
              }}
            >
              {myBusiness ? (
                <Link
                  to={`/portal/${myBusiness.slug}`}
                  className="btn"
                  style={{
                    background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
                    color: "#ffffff",
                    padding: "14px 28px",
                    borderRadius: "12px",
                    fontSize: "15.5px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(13, 31, 25, 0.25)",
                    border: "none",
                  }}
                >
                  <Building size={16} color="#fcd34d" />
                  {t("myPortal", "Open My ERP Portal")} ({myBusiness.name}) <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  to="/register-business"
                  className="btn"
                  style={{
                    background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
                    color: "#ffffff",
                    padding: "14px 30px",
                    borderRadius: "12px",
                    fontSize: "15.5px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(13, 31, 25, 0.25)",
                    border: "none",
                  }}
                >
                  <Store size={17} color="#fcd34d" />
                  {t("registerBoutique", "Launch Your Boutique")} <ArrowRight size={16} />
                </Link>
              )}

              <a
                href="#directory"
                className="btn ghost"
                style={{
                  padding: "14px 26px",
                  borderRadius: "12px",
                  fontSize: "15.5px",
                  fontWeight: 600,
                  border: "1.5px solid #cbd5e1",
                  background: "rgba(255, 255, 255, 0.8)",
                  color: "#1e293b",
                }}
              >
                {t("activeBoutiques", "Explore Active Boutiques")} ↓
              </a>
            </div>

            {/* Proof Points Strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "24px",
                flexWrap: "wrap",
                fontSize: "13px",
                color: "#334155",
                fontWeight: 500,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{t("dedicatedLink", "Dedicated client link")} (<code>/store/:slug</code>)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{t("privateReservations", "VIP Fitting Reservations")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{t("realtimeChat", "Realtime 1-on-1 Customer Chat")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>{t("noCodeRequired", "No coding required")}</span>
              </div>
            </div>
          </div>

          {/* ── HERO DYNAMIC SHOWCASE CARD ── */}
          <div
            style={{
              marginTop: "48px",
              background: "#ffffff",
              borderRadius: "24px",
              border: "1.5px solid rgba(24, 57, 47, 0.12)",
              boxShadow: "0 24px 60px -16px rgba(13, 31, 25, 0.16)",
              overflow: "hidden",
            }}
          >
            {/* Window Topbar */}
            <div
              style={{
                background: "#0d1f19",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ marginLeft: "12px", fontSize: "12px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                  {activePreviewBiz ? `/store/${activePreviewBiz.slug}` : "/store/:slug"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "11px", color: "#86efac", background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: "99px", fontWeight: 700 }}>
                  ● {t("statusActive", "LIVE SHOWROOM")}
                </span>
                <span style={{ fontSize: "11px", color: "#fcd34d", border: "1px solid rgba(252,211,77,0.3)", padding: "2px 8px", borderRadius: "99px", fontWeight: 600 }}>
                  {activePreviewBiz?.currency || "ETB"}
                </span>
              </div>
            </div>

            {/* Split Preview: Storefront Preview on Left + ERP Insights on Right */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0" }}>
              {/* Left Column: Client Showroom Sneak Peek */}
              <div style={{ padding: "32px", borderRight: "1px solid #f1f5f9", background: "linear-gradient(180deg, #ffffff 0%, #faf8f5 100%)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#854d0e", fontWeight: 700 }}>
                      {activePreviewBiz?.category || t("category", "Haute Couture & Atelier")}
                    </span>
                    <h3 style={{ fontFamily: "var(--display, serif)", fontSize: "24px", color: "#0d1f19", margin: "4px 0 0" }}>
                      {activePreviewBiz?.name || t("yourBoutiqueName", "Your Boutique Showroom")}
                    </h3>
                  </div>

                  {activePreviewBiz ? (
                    <Link
                      to={`/store/${activePreviewBiz.slug}`}
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
                      style={{
                        fontSize: "12px",
                        color: "#18392f",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(24,57,47,0.08)",
                      }}
                    >
                      {t("viewStore", "Open Live")} <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <Link
                      to="/register-business"
                      style={{
                        fontSize: "12px",
                        color: "#18392f",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(24,57,47,0.08)",
                      }}
                    >
                      {t("registerBoutique", "Launch")} <ArrowRight size={12} />
                    </Link>
                  )}
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    overflow: "hidden",
                    position: "relative",
                    height: "190px",
                    backgroundImage: activePreviewBiz?.heroImageUrl
                      ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%), url(${activePreviewBiz.heroImageUrl})`
                      : "linear-gradient(135deg, #18392f 0%, #0d1f19 100%)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "16px",
                    color: "#ffffff",
                  }}
                >
                  <span style={{ fontSize: "11px", background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: "4px", alignSelf: "flex-start", marginBottom: "6px" }}>
                    {activePreviewBiz?.tagline || t("dedicatedLink", "Exclusive Digital Showroom")}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{activePreviewBiz?.name || t("yourBoutiqueName", "Your Boutique Showroom")}</div>
                  <div style={{ fontSize: "13px", color: "#fcd34d", fontWeight: 600, marginTop: "2px" }}>
                    {activePreviewBiz?.currency || "ETB"} · {t("reservations", "Private Fittings Available")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <div style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CalendarCheck size={16} color="#16a34a" />
                    <span>{t("privateReservations", "In-Store Fitting Request")}</span>
                  </div>
                  <div style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageCircle size={16} color="#0284c7" />
                    <span>{t("realtimeChat", "Live Stylist Concierge")}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: ERP Operations Metrics Preview */}
              <div style={{ padding: "32px", background: "#0d1f19", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(252,211,77,0.15)", color: "#fcd34d", display: "grid", placeItems: "center" }}>
                        <TrendingUp size={15} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "14px" }}>Luna ERP Dashboard</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "4px" }}>
                      v2.4
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{t("reservations", "Reservations")}</span>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "#fcd34d", marginTop: "4px" }}>{t("pipeline", "Pipeline")}</div>
                      <span style={{ fontSize: "11px", color: "#86efac" }}>✓ {t("statusActive", "Live")}</span>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{t("inventory", "Inventory")}</span>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>{activePreviewBiz?.currency || "ETB"}</div>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>SKU &amp; Variant Matrix</span>
                    </div>
                  </div>

                  {/* Operational Feature Pill */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#166534", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700 }}>
                      <Zap size={15} color="#fcd34d" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{t("realtimeChat", "Realtime Concierge & Fittings")}</div>
                      <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.6)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {t("feature2Desc", "Products automatically attached to client inquiries")}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: "18px", marginTop: "18px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  <span>✓ {t("statIsolated", "100% Isolated Data")}</span>
                  <Link to="/register-business" style={{ color: "#fcd34d", textDecoration: "none", fontWeight: 600 }}>
                    {t("registerBoutique", "Register Your Boutique")} →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Metric Live Stats Banner */}
          <div className="luna-stats-strip">
            <div className="luna-stat-item">
              <div className="luna-stat-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="luna-stat-val">{t("statIsolated", "100% Isolated Data")}</div>
                <div className="luna-stat-lbl">{t("statIsolatedSub", "Multi-tenant boutique data")}</div>
              </div>
            </div>

            <div className="luna-stat-item">
              <div className="luna-stat-icon">
                <Clock size={20} />
              </div>
              <div>
                <div className="luna-stat-val">{t("statFastSetup", "< 2 Minutes")}</div>
                <div className="luna-stat-lbl">{t("statFastSetupSub", "Fast setup & live link")}</div>
              </div>
            </div>

            <div className="luna-stat-item">
              <div className="luna-stat-icon">
                <Compass size={20} />
              </div>
              <div>
                <div className="luna-stat-val">{t("statTailored", "Fashion Ateliers")}</div>
                <div className="luna-stat-lbl">{t("statTailoredSub", "Tailored to local boutiques")}</div>
              </div>
            </div>

            <div className="luna-stat-item">
              <div className="luna-stat-icon">
                <Zap size={20} />
              </div>
              <div>
                <div className="luna-stat-val">{t("statConcierge", "Realtime Concierge")}</div>
                <div className="luna-stat-lbl">{t("statConciergeSub", "Direct 1-on-1 customer link")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE BOUTIQUES DIRECTORY SECTION ── */}
      <section id="directory" className="platform-directory-section" style={{ padding: "80px 24px", background: "#ffffff" }}>
        <div className="platform-container" style={{ maxWidth: "1240px", margin: "0 auto" }}>
          {/* Section Heading */}
          <div className="platform-section-header directory-header" style={{ marginBottom: "28px" }}>
            <div>
              <p className="eyebrow" style={{ color: "#854d0e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px", margin: "0 0 6px" }}>
                {t("featuredShowrooms", "Showroom Network")}
              </p>
              <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "36px", color: "#0d1f19", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                {t("discoverAteliers", "Explore Registered Boutiques")}
              </h2>
              <p className="lede" style={{ color: "#64748b", fontSize: "15px", maxWidth: "680px", margin: 0 }}>
                {t("directoryLede", "Browse showrooms currently powered by the Luna platform. Each boutique maintains its distinct catalog, currency, and private concierge.")}
              </p>
            </div>
            <Link
              to="/register-business"
              className="btn"
              style={{
                background: "#0d1f19",
                color: "#ffffff",
                padding: "11px 20px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              {t("registerBoutique", "Register a New Boutique +")}
            </Link>
          </div>

          {/* Interactive Search Bar & Category Filter Chips */}
          <div className="luna-directory-controls">
            {/* Search Input */}
            <div className="luna-search-box">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder={t("searchBoutiquesPlaceholder", "Search boutiques by name, category, or style…")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="luna-filter-chips">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`luna-chip ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === "All" ? t("all", "All") : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Boutiques Grid (Real registered businesses only) */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "#64748b", fontSize: "14px" }}>{t("processing", "Loading registered boutiques…")}</p>
            </div>
          ) : filteredBoutiques.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", background: "#fbfaf7", borderRadius: "20px", border: "1.5px dashed #cbd5e1" }}>
              <Store size={40} color="#94a3b8" style={{ margin: "0 auto 14px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
                {t("noBoutiquesRegistered", "No Active Boutiques Yet")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "14.5px", maxWidth: "460px", margin: "0 auto 20px", lineHeight: 1.6 }}>
                {t("noBoutiquesDesc", "Be the first luxury atelier to launch your private showroom on Luna.")}
              </p>
              <Link
                to="/register-business"
                className="btn"
                style={{
                  background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
                  color: "#ffffff",
                  padding: "11px 24px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Store size={15} color="#fcd34d" />
                {t("registerBoutique", "Register Your Boutique")} →
              </Link>
            </div>
          ) : (
            <div className="directory-grid">
              {filteredBoutiques.map((biz) => {
                const currencyStyle = CURRENCY_COLORS[biz.currency] || CURRENCY_COLORS.ETB;
                const isApproved = biz.status === "active" || biz.status === "approved";
                const isCopied = copiedSlug === biz.slug;

                return (
                  <div key={biz.id || biz.slug} className="directory-card" style={{ transition: "transform 0.2s, box-shadow 0.2s" }}>
                    <div
                      className="directory-card-media"
                      style={{
                        backgroundImage: biz.heroImageUrl
                          ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%), url(${biz.heroImageUrl})`
                          : `linear-gradient(135deg, ${biz.accentColor || "#18392f"}, #111)`,
                        position: "relative",
                        height: "190px",
                      }}
                    >
                      {/* Top-right badges row */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          zIndex: 2,
                        }}
                      >
                        {isApproved && (
                          <span
                            style={{
                              background: "#16a34a",
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "999px",
                              letterSpacing: "0.04em",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#86efac",
                                display: "inline-block",
                              }}
                            />
                            {t("statusActive", "Live")}
                          </span>
                        )}

                        <span
                          style={{
                            background: currencyStyle.bg,
                            color: currencyStyle.color,
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "999px",
                            letterSpacing: "0.04em",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          }}
                        >
                          {biz.currency || "ETB"}
                        </span>
                      </div>

                      <span className="directory-badge">{biz.category}</span>

                      <Link
                        to={`/store/${biz.slug}`}
                        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div className="directory-card-title-group">
                          <h3 style={{ fontFamily: "var(--display, serif)", fontSize: "26px", fontWeight: 700 }}>
                            {biz.name}
                          </h3>
                        </div>
                      </Link>
                    </div>

                    <div className="directory-card-body">
                      <p className="directory-tagline" style={{ minHeight: "42px" }}>
                        {biz.tagline}
                      </p>

                      <div className="directory-footer">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(biz.slug)}
                          title={t("copyLink", "Copy link")}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            color: isCopied ? "#16a34a" : "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          {isCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                          <code>/store/{biz.slug}</code>
                        </button>

                        <Link
                          to={`/store/${biz.slug}`}
                          onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
                          className="btn directory-visit-btn"
                          style={{
                            background: "#0d1f19",
                            color: "#ffffff",
                            fontWeight: 600,
                            borderRadius: "8px",
                          }}
                        >
                          {t("exploreShowroom", "Visit Showroom")} →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── INTERACTIVE LUNA ECOSYSTEM EXPERIENCE ── */}
      <section style={{ padding: "80px 24px", background: "#f8f6f1", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 36px" }}>
            <p className="eyebrow" style={{ color: "#854d0e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px", margin: "0 0 6px" }}>
              {t("threePillarsEyebrow", "Unified Luxury Architecture")}
            </p>
            <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "36px", color: "#0d1f19", margin: "0 0 12px" }}>
              {t("threePillarsTitle", "Experience the Three Pillars of Luna")}
            </h2>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
              {t("threePillarsDesc", "Whether you are an independent fashion designer or an atelier director, Luna gives you complete mastery over your brand's digital presence.")}
            </p>
          </div>

          {/* Interactive Tab Switchers */}
          <div className="luna-tabs-wrap">
            <button
              type="button"
              className={`luna-tab-btn ${activeEcosystemTab === "showroom" ? "active" : ""}`}
              onClick={() => setActiveEcosystemTab("showroom")}
            >
              <Store size={16} className="tab-icon" />
              {t("tabClientShowroom", "1. The Client Showroom")}
            </button>
            <button
              type="button"
              className={`luna-tab-btn ${activeEcosystemTab === "erp" ? "active" : ""}`}
              onClick={() => setActiveEcosystemTab("erp")}
            >
              <Layers size={16} className="tab-icon" />
              {t("tabBoutiqueErp", "2. Boutique ERP Console")}
            </button>
            <button
              type="button"
              className={`luna-tab-btn ${activeEcosystemTab === "concierge" ? "active" : ""}`}
              onClick={() => setActiveEcosystemTab("concierge")}
            >
              <MessageCircle size={16} className="tab-icon" />
              {t("tabConciergeChat", "3. VIP Concierge Styling")}
            </button>
          </div>

          {/* Tab Content 1: Showroom */}
          {activeEcosystemTab === "showroom" && (
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#854d0e", letterSpacing: "0.08em" }}>
                  {t("clientStorefront", "CLIENT STOREFRONT")}
                </span>
                <h3 style={{ fontFamily: "var(--display, serif)", fontSize: "28px", color: "#0f1a16", margin: "8px 0 14px" }}>
                  {t("showroomTabTitle", "A Private, Editorial Client Showroom")}
                </h3>
                <p style={{ color: "#64748b", fontSize: "14.5px", lineHeight: 1.65, margin: "0 0 20px" }}>
                  {t("showroomTabDesc", "Replace clunky PDF catalogs and messy Instagram DM links. Your clients access an exclusive, branded link tailored with high-res piece photography, detailed fabrication notes, and transparent local pricing.")}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("feature1Desc", "Each registered business receives an exclusive, branded link")}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("privateReservations", "Private Fitting Reservations")}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("wishlist", "Client Saved Wishlist")}
                  </li>
                </ul>
              </div>

              <div style={{ background: "#faf9f6", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <strong>{t("clientStorefront", "Client Storefront Preview")}</strong>
                  <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "99px", fontWeight: 700 }}>
                    {t("statusActive", "Live View")}
                  </span>
                </div>
                <div style={{ borderRadius: "12px", overflow: "hidden", height: "160px", background: "linear-gradient(135deg, #18392f 0%, #0d1f19 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Store size={48} color="#fcd34d" />
                </div>
                <div style={{ marginTop: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "#111" }}>{t("curatedBoutiqueShowroom", "Curated Boutique Showroom")}</h4>
                    <span style={{ fontWeight: 800, color: "#166534" }}>{t("currency", "ETB / USD")}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                    <button type="button" className="btn" style={{ flex: 1, padding: "9px", borderRadius: "8px", background: "#0d1f19", color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                      {t("reservations", "Reserve for Fitting")}
                    </button>
                    <button type="button" className="btn ghost" style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <Heart size={15} color="#ea580c" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: ERP */}
          {activeEcosystemTab === "erp" && (
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#854d0e", letterSpacing: "0.08em" }}>
                  {t("businessPortal", "OPERATIONS CONSOLE")}
                </span>
                <h3 style={{ fontFamily: "var(--display, serif)", fontSize: "28px", color: "#0f1a16", margin: "8px 0 14px" }}>
                  {t("erpTabTitle", "Complete Inventory & Operations ERP")}
                </h3>
                <p style={{ color: "#64748b", fontSize: "14.5px", lineHeight: 1.65, margin: "0 0 20px" }}>
                  {t("erpTabDesc", "Say goodbye to lost paper notes and stock confusion. Your private operations portal tracks every garment, cost valuation, size/color variant matrix, and incoming customer reservation pipeline.")}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("feature4Desc", "Track stock quantities, cost prices, retail valuations, size variants, and instant publish/sold-out toggles")}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("feature3Desc", "Receive client fitting requests, review custom pickup notes, and progress orders seamlessly")}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("statIsolated", "100% Isolated Data")}
                  </li>
                </ul>
              </div>

              <div style={{ background: "#0d1f19", color: "#ffffff", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <strong style={{ fontSize: "14px" }}>{t("multiTenantERP", "Boutique ERP Console")}</strong>
                  <span style={{ fontSize: "11px", background: "rgba(252,211,77,0.2)", color: "#fcd34d", padding: "2px 8px", borderRadius: "99px", fontWeight: 700 }}>
                    ERP Portal
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{t("reservations", "RESERVATIONS")}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#fcd34d", marginTop: "4px" }}>{t("pipeline", "Pipeline")}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{t("inventory", "VALUATION")}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", marginTop: "4px" }}>ETB / USD</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                    <span>{t("reservations", "Client Fitting Request")}</span>
                    <span style={{ color: "#86efac", fontWeight: 700 }}>{t("statusApproved", "Confirmed")}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                    {t("dedicatedLink", "Automated booking & fitting notifications")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Concierge */}
          {activeEcosystemTab === "concierge" && (
            <div style={{ background: "#ffffff", borderRadius: "20px", padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(0,0,0,0.04)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#854d0e", letterSpacing: "0.08em" }}>
                  {t("chat", "VIP CONCIERGE STYLING")}
                </span>
                <h3 style={{ fontFamily: "var(--display, serif)", fontSize: "28px", color: "#0f1a16", margin: "8px 0 14px" }}>
                  {t("conciergeTabTitle", "Realtime 1-on-1 Concierge Chat")}
                </h3>
                <p style={{ color: "#64748b", fontSize: "14.5px", lineHeight: 1.65, margin: "0 0 20px" }}>
                  {t("conciergeTabDesc", "Luxury fashion is personal. Luna equips every showroom with a dedicated concierge channel where products are automatically attached to chat inquiries so your stylists know the exact size, color, and fabric being discussed.")}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("feature2Desc", "Products are automatically attached to chat inquiries")}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("statConcierge", "Direct 1-on-1 customer link")}
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", color: "#334155" }}>
                    <CheckCircle2 size={16} color="#16a34a" /> {t("realtimeChat", "Realtime Concierge")}
                  </li>
                </ul>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#18392f", color: "#fcd34d", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "13px" }}>
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#111" }}>{t("chat", "Showroom Concierge")}</div>
                    <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>● {t("statusActive", "Online")}</div>
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "6px", background: "#f1f5f9", display: "grid", placeItems: "center" }}>
                    <ShoppingBag size={20} color="#64748b" />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700 }}>{t("catalog", "Inquired Piece")}</div>
                    <div style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>{t("feature2Title", "Attached Inquiry")}</div>
                  </div>
                </div>

                <div style={{ background: "#0d1f19", color: "#fff", padding: "10px 14px", borderRadius: "12px 12px 0 12px", fontSize: "12.5px", marginLeft: "auto", maxWidth: "85%", marginBottom: "8px" }}>
                  {t("feature2Desc", "Hello! We have this piece ready for fitting.")}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section id="how-it-works" style={{ background: "#ffffff", padding: "80px 24px", borderBottom: "1px solid #e5e7eb" }}>
        <div className="platform-container" style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px" }}>
            <p className="eyebrow" style={{ color: "#854d0e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px", margin: "0 0 6px" }}>
              {t("simpleOnboarding", "Simple Onboarding")}
            </p>
            <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "36px", color: "#0d1f19", margin: 0 }}>
              {t("howItWorks", "How Luna Works in 4 Steps")}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
              position: "relative",
            }}
          >
            {howItWorksSteps.map((step) => (
              <div
                key={step.number}
                style={{
                  background: "#fbfaf7",
                  border: "1px solid #e5e7eb",
                  borderRadius: "18px",
                  padding: "32px 22px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#0d1f19",
                    color: "#fcd34d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: 800,
                    marginBottom: "18px",
                    boxShadow: "0 6px 16px rgba(13,31,25,0.25)",
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0f1a16",
                    margin: "0 0 10px",
                    lineHeight: 1.3,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: "13.5px",
                    color: "#64748b",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRADITIONAL SOCIAL SELLING VS LUNA ── */}
      <section style={{ padding: "80px 24px", background: "#f8f6f1", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 40px" }}>
            <p className="eyebrow" style={{ color: "#854d0e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px", margin: "0 0 6px" }}>
              {t("comparisonEyebrow", "The Competitive Advantage")}
            </p>
            <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "36px", color: "#0d1f19", margin: "0 0 12px" }}>
              {t("comparisonTitle", "Why Top Ateliers Upgrade to Luna")}
            </h2>
          </div>

          <div className="luna-comparison-grid">
            {/* The Old Way */}
            <div className="luna-comparison-card bad">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, background: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "99px", textTransform: "uppercase" }}>
                  {t("theOldWay", "The Old Way")}
                </span>
                <strong style={{ fontSize: "15px", color: "#1e293b" }}>Instagram &amp; Telegram DMs</strong>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  "Inquiries get buried under spam and missed messages",
                  "Manually typing prices, fabric details, and sizes over and over",
                  "Accidental double-booking of unique couture pieces",
                  "Payment screenshot fraud and zero inventory tracking",
                  "Unprofessional customer experience without branded continuity",
                ].map((item, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "#64748b", lineHeight: 1.5 }}>
                    <X size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The Luna Way */}
            <div className="luna-comparison-card good">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, background: "rgba(252,211,77,0.2)", color: "#fcd34d", padding: "3px 10px", borderRadius: "99px", textTransform: "uppercase" }}>
                  {t("theLunaWay", "The Luna Standard")}
                </span>
                <strong style={{ fontSize: "15px", color: "#ffffff" }}>Dedicated Luxury Atelier OS</strong>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  "Exclusive shareable client link (/store/your-brand) for your bio",
                  "Structured fitting reservation pipeline with client phone & notes",
                  "Real-time inventory valuation and automatic stock status",
                  "Direct 1-on-1 concierge with auto-attached product cards",
                  "Verified luxury brand prestige and elevated client trust",
                ].map((item, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                    <CheckCircle2 size={16} color="#86efac" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE COMMITMENTS (AUTHENTIC VALUE PILLARS) ── */}
      <section style={{ padding: "80px 24px", background: "#fbfaf7", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px" }}>
            <p className="eyebrow" style={{ color: "#854d0e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px", margin: "0 0 6px" }}>
              {t("commitmentsEyebrow", "Our Core Commitments")}
            </p>
            <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "36px", color: "#0d1f19", margin: 0 }}>
              {t("commitmentsTitle", "Built on Integrity, Exclusivity, and Control")}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "24px" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "30px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                {t("commitment1Title", "Zero Transaction Tax")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                {t("commitment1Desc", "You keep 100% of your earnings. Luna provides the infrastructure without taking cuts from your client fitting reservations.")}
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "30px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                <Lock size={22} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                {t("commitment2Title", "Complete Client Ownership")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                {t("commitment2Desc", "Your customer contact details, fitting appointments, and chat histories belong exclusively to your business.")}
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "30px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center", marginBottom: "16px" }}>
                <Store size={22} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>
                {t("commitment3Title", "Dedicated Mobile Storefront")}
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                {t("commitment3Desc", "Your custom link (/store/:slug) runs with full speed, custom brand colors, and zero third-party platform distractions.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS (ACCORDION) ── */}
      <section style={{ padding: "80px 24px", background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p className="eyebrow" style={{ color: "#854d0e", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "12px", margin: "0 0 6px" }}>
              {t("faqEyebrow", "Frequently Answered")}
            </p>
            <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "36px", color: "#0d1f19", margin: 0 }}>
              {t("faqTitle", "Questions About Luna")}
            </h2>
          </div>

          <div className="luna-faq-grid">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`luna-faq-card ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="luna-faq-trigger"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        color: isOpen ? "#18392f" : "#94a3b8",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {isOpen && <div className="luna-faq-answer">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LUXURY PRE-FOOTER CALL TO ACTION ── */}
      <section className="platform-cta-banner">
        <div className="platform-container" style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div
            className="cta-banner-card"
            style={{
              background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)",
              borderRadius: "24px",
              padding: "60px 40px",
              textAlign: "center",
              border: "1.5px solid rgba(252, 211, 77, 0.3)",
              boxShadow: "0 24px 60px rgba(13, 31, 25, 0.3)",
              color: "#ffffff",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(252, 211, 77, 0.15)",
                color: "#fcd34d",
                padding: "4px 14px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "16px",
              }}
            >
              <Sparkles size={13} /> {t("elevateYourBrand", "Elevate Your Brand")}
            </span>

            <h2 style={{ fontFamily: "var(--display, serif)", fontSize: "clamp(28px, 4vw, 44px)", margin: "0 0 14px", fontWeight: 700 }}>
              {t("platformCtaTitle", "Ready to launch your boutique's private showroom?")}
            </h2>

            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", maxWidth: "600px", margin: "0 auto 30px", lineHeight: 1.6 }}>
              {t("platformCtaDesc", "Join the growing network of independent luxury designers, boutiques, and fashion ateliers. Setup takes less than 2 minutes.")}
            </p>

            <div className="cta-banner-buttons" style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              <Link
                to="/register-business"
                className="btn cta-large"
                style={{
                  background: "#fcd34d",
                  color: "#0d1f19",
                  padding: "14px 32px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                }}
              >
                {t("getStartedNow", "Get Started Now")} <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── LUXURY EDITORIAL FOOTER ── */}
      <footer
        className="platform-site-footer"
        style={{
          background: "linear-gradient(180deg, #0d221c 0%, #06120e 100%)",
          color: "#ffffff",
          borderTop: "1px solid rgba(168, 135, 79, 0.25)",
          padding: "64px 24px 32px",
        }}
      >
        <div className="platform-container" style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "48px 36px",
              paddingBottom: "52px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Brand Column */}
            <div style={{ maxWidth: "340px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(168, 135, 79, 0.3) 0%, rgba(24, 57, 47, 0.8) 100%)",
                    border: "1px solid rgba(168, 135, 79, 0.4)",
                    display: "grid",
                    placeItems: "center",
                    color: "#fcd34d",
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <span style={{ fontFamily: "var(--display, serif)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.01em", color: "#fff" }}>
                  Luna
                </span>
              </div>
              <p style={{ color: "rgba(255, 255, 255, 0.72)", fontSize: "14px", lineHeight: 1.65, margin: "0 0 18px" }}>
                {t("platformFooterTagline", "Multi-tenant digital showroom & operations network for luxury fashion ateliers and independent boutiques.")}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  background: "rgba(22, 163, 74, 0.12)",
                  border: "1px solid rgba(22, 163, 74, 0.3)",
                  fontSize: "12px",
                  color: "#86efac",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                {t("builtForEthiopia", "Built specifically for Ethiopian fashion designers & boutiques")}
              </div>
            </div>

            {/* Platform & Showrooms Column */}
            <div>
              <h4 style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#a8874f", fontWeight: 700, margin: "0 0 20px" }}>
                {t("platformHome", "Platform")}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <li>
                  <a href="#directory" style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none", transition: "color 0.15s" }}
                     onMouseEnter={(e) => (e.currentTarget.style.color = "#fcd34d")}
                     onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}>
                    {t("discoverAteliers", "Explore Registered Boutiques")}
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none", transition: "color 0.15s" }}
                     onMouseEnter={(e) => (e.currentTarget.style.color = "#fcd34d")}
                     onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}>
                    {t("howItWorks", "How It Works")}
                  </a>
                </li>
                <li>
                  <a href="#features" style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none", transition: "color 0.15s" }}
                     onMouseEnter={(e) => (e.currentTarget.style.color = "#fcd34d")}
                     onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}>
                    {t("features", "Features")}
                  </a>
                </li>
                <li>
                  <Link to="/register-business" style={{ color: "#fcd34d", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                    {t("registerBoutique", "Register Your Boutique →")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Client Services & Access Column */}
            <div>
              <h4 style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#a8874f", fontWeight: 700, margin: "0 0 20px" }}>
                {t("chat", "Client Services")}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <li>
                  <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}>
                    {t("privateReservations", "Private Reservations")}
                  </span>
                </li>
                <li>
                  <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}>
                    {t("conciergeStyling", "Concierge Styling")}
                  </span>
                </li>
                <li>
                  <Link
                    to="/login"
                    style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fcd34d")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}
                  >
                    {t("signIn", "Sign In to Account")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quality Standard Column */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "20px 22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#fcd34d" }}>
                <ShieldCheck size={18} />
                <strong style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Boutique Quality Standard
                </strong>
              </div>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 14px" }}>
                {t("authenticDesignerDrops", "100% authentic designer drops")}. {t("holdItemsFitting", "Hold items for in-store fitting")}.
              </p>
              <div style={{ fontSize: "12px", color: "#86efac", fontWeight: 600 }}>
                ✓ {t("verifiedShowroom", "Verified Boutique Showroom")}
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div
            style={{
              paddingTop: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              fontSize: "12.5px",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <div>
              © {new Date().getFullYear()} Luna. {t("allRightsReserved", "All rights reserved.")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                {t("handCuratedCatalog", "Hand-Curated Catalog")}
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
              <span style={{ color: "#a8874f" }}>
                {t("realtimeChat", "Realtime Concierge")}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
