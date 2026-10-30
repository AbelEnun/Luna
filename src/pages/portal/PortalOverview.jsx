import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  CalendarCheck,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Store,
  Layers,
  ArrowRight,
  CreditCard,
  Plus,
  Bell,
  Info,
  AlertTriangle,
  XCircle,
  Palette,
  Headphones,
  Sparkles,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { useTenantProducts } from "../../hooks/useTenantProducts";
import { useTenantReservations } from "../../hooks/useTenantReservations";
import { useTenantChats } from "../../hooks/useTenantChats";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { getBoutiqueAgeAndTrial } from "../../utils/trialHelper";
import { money, getPackage } from "../../config";

export default function PortalOverview() {
  const { business, slug } = useTenant();
  const { items: products, loading: productsLoading } = useTenantProducts({ publishedOnly: false });
  const { items: reservations, loading: reservationsLoading, updateStatus } = useTenantReservations({ admin: true });
  const { chats, unreadCount } = useTenantChats({ admin: true });
  const { show } = useToast();
  const { t } = useLanguage();
  const trialInfo = getBoutiqueAgeAndTrial(business);

  const [copied, setCopied] = useState(false);
  const storeUrl = `${window.location.origin}/store/${slug}`;
  const pkg = getPackage(business?.package);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      show("Client showroom link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      show("Could not copy link automatically.", "error");
    }
  };

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning", "Good morning");
    if (hour < 18) return t("goodAfternoon", "Good afternoon");
    return t("goodEvening", "Good evening");
  }, [t]);

  // ERP Metrics Calculations
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const visibleCount = products.filter((p) => p.published !== false).length;
    const soldOutCount = products.filter((p) => p.soldOut).length;
    const inventoryValuation = products.reduce(
      (acc, p) => acc + (Number(p.price) || 0) * (Number(p.stockQuantity) || 0),
      0
    );
    const pendingReservations = reservations.filter((r) => r.status === "requested").length;

    return {
      totalCount,
      visibleCount,
      soldOutCount,
      inventoryValuation,
      pendingReservations,
    };
  }, [products, reservations]);

  // Sales pipeline breakdown
  const pipeline = useMemo(() => {
    const requested = reservations.filter((r) => r.status === "requested").length;
    const confirmed = reservations.filter((r) => r.status === "confirmed").length;
    const completed = reservations.filter((r) => r.status === "completed").length;
    const cancelled = reservations.filter((r) => r.status === "cancelled").length;
    return { total: reservations.length, requested, confirmed, completed, cancelled };
  }, [reservations]);

  // Subscription status helper
  const subStatusColor = () => {
    const s = business?.subscriptionStatus;
    if (s === "active") return { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: t("statusActive", "Active & Good Standing") };
    if (s === "trial") return { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: t("statusTrial", "Trial Period") };
    if (s === "overdue") return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: t("statusOverdue", "Payment Due") };
    return { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: s || "Standard" };
  };
  const subStyle = subStatusColor();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* ── LUXURY HERO HEADER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#18392f",
                background: "rgba(24,57,47,0.08)",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              <Sparkles size={12} color="#18392f" />
              {business?.name || "Boutique"} Operations
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#10b981",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              {t("showroomLiveStatus", "Showroom Live")}
            </span>

            {/* Day Counter & Trial Status */}
            <Link
              to={`/portal/${slug}/subscription`}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 700,
                color: trialInfo.isTrial ? "#2563eb" : "#166534",
                background: trialInfo.isTrial ? "#eff6ff" : "#f0fdf4",
                border: trialInfo.isTrial ? "1px solid #bfdbfe" : "1px solid #bbf7d0",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              <Clock size={12} />
              <span>
                {t("dayActiveLabel", "Day")} {trialInfo.daysActive} · {trialInfo.isTrial ? `${t("freeTrial", "Free Trial")} (${trialInfo.trialDaysRemaining} ${t("daysRemainingLabel", "days left")})` : t("statusActive", "Active")}
              </span>
            </Link>
          </div>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            {greeting}, {business?.name || "Boutique Owner"}
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            {t("operationsOverviewDesc", "Live concierge holds, catalog inventory, and VIP customer inquiries.")}
          </p>
        </div>

        {/* Quick Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            to={`/portal/${slug}/products`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "#18392f",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(24,57,47,0.25)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#245344")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#18392f")}
          >
            <Plus size={16} />
            <span>{t("addNewProduct", "Add Product")}</span>
          </Link>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            <Store size={15} />
            <span>{t("viewLiveStore", "Visit Store")}</span>
            <ArrowUpRight size={13} color="#64748b" />
          </a>
        </div>
      </div>

      {/* ── BUSINESS STATUS WARNING BANNERS ── */}
      {business?.status === "pending" && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <AlertTriangle size={22} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: "#92400e", fontSize: "14.5px", display: "block", marginBottom: 2 }}>
              {t("pendingApprovalBannerTitle", "Application Under Review")}
            </strong>
            <span style={{ color: "#78350f", fontSize: "13.5px" }}>
              {t("pendingApprovalBannerDesc", "Your boutique application is being verified by the platform administration team. Your storefront will activate upon approval.")}
            </span>
          </div>
        </div>
      )}

      {business?.status === "suspended" && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <XCircle size={22} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: "#991b1b", fontSize: "14.5px", display: "block", marginBottom: 2 }}>
              {t("suspendedBannerTitle", "Showroom Temporarily Suspended")}
            </strong>
            <span style={{ color: "#7f1d1d", fontSize: "13.5px" }}>
              {business.suspensionReason || t("suspendedBannerDesc", "Your account has been placed on hold. Please message platform support to resolve.")}
            </span>
          </div>
        </div>
      )}

      {business?.upgradeRequested && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Info size={19} style={{ color: "#2563eb", flexShrink: 0 }} />
          <span style={{ color: "#1e40af", fontSize: "13.5px" }}>
            {t("upgradeRequested", "Plan Upgrade Pending")}: You requested an upgrade to <strong>{business.upgradeRequested}</strong>. The platform admin is reviewing your account.
          </span>
        </div>
      )}

      {/* ── 4 QUICK-LAUNCH ACTION TILES ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Tile 1: Add Product */}
        <Link
          to={`/portal/${slug}/products`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "18px 20px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            color: "inherit",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.07)";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(24,57,47,0.12) 0%, rgba(24,57,47,0.05) 100%)",
              color: "#18392f",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Plus size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: "14.5px", color: "#0f172a" }}>
              {t("addNewProduct", "Add Product")}
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {metrics.totalCount} {t("itemsCataloged", "items in catalog")}
            </span>
          </div>
          <ChevronRight size={17} color="#94a3b8" />
        </Link>

        {/* Tile 2: Client Holds / Reservations */}
        <Link
          to={`/portal/${slug}/reservations`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "18px 20px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            color: "inherit",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.07)";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.05) 100%)",
              color: "#2563eb",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <CalendarCheck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: "14.5px", color: "#0f172a" }}>
              {t("reservations", "Client Holds")}
            </strong>
            <span style={{ fontSize: "12px", color: metrics.pendingReservations > 0 ? "#d97706" : "#64748b", fontWeight: metrics.pendingReservations > 0 ? 600 : 400 }}>
              {metrics.pendingReservations} {t("statusPending", "awaiting confirmation")}
            </span>
          </div>
          <ChevronRight size={17} color="#94a3b8" />
        </Link>

        {/* Tile 3: VIP Customer Chat */}
        <Link
          to={`/portal/${slug}/inbox`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "18px 20px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            color: "inherit",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.07)";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.05) 100%)",
              color: "#dc2626",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: "14.5px", color: "#0f172a" }}>
              {t("conciergeInbox", "Client Inquiries")}
            </strong>
            <span style={{ fontSize: "12px", color: unreadCount > 0 ? "#dc2626" : "#64748b", fontWeight: unreadCount > 0 ? 600 : 400 }}>
              {unreadCount > 0 ? `${unreadCount} ${t("unread", "new messages")}` : t("allCaughtUp", "All caught up")}
            </span>
          </div>
          <ChevronRight size={17} color="#94a3b8" />
        </Link>

        {/* Tile 4: Branding Studio */}
        <Link
          to={`/portal/${slug}/branding`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "18px 20px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            textDecoration: "none",
            color: "inherit",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.07)";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(217,119,6,0.12) 0%, rgba(217,119,6,0.05) 100%)",
              color: "#d97706",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Palette size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", fontSize: "14.5px", color: "#0f172a" }}>
              {t("branding", "Branding Studio")}
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t("paletteAndIdentity", "Identity, logo & hero")}
            </span>
          </div>
          <ChevronRight size={17} color="#94a3b8" />
        </Link>
      </div>

      {/* ── 5 REFINED KPI METRIC CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "18px",
        }}
      >
        {/* KPI 1: Catalog */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
              {t("catalogProducts", "Showroom Catalog")}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(24,57,47,0.08)",
                color: "#18392f",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", lineHeight: 1, margin: "0 0 6px" }}>
            {metrics.totalCount}
          </div>
          <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 500 }}>
            ✓ {metrics.visibleCount} {t("liveOnShowroom", "published in showroom")}
          </span>
        </div>

        {/* KPI 2: Inventory Valuation */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
              {t("inventoryValuation", "Inventory Value")}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(180,83,9,0.1)",
                color: "#b45309",
                display: "grid",
                placeItems: "center",
              }}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, margin: "0 0 6px" }}>
            {money(metrics.inventoryValuation, business?.currency)}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {t("estimatedRetailTotal", "Estimated retail inventory")}
          </span>
        </div>

        {/* KPI 3: Pending Reservations */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
              {t("pendingHolds", "Pending Holds")}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(37,99,235,0.1)",
                color: "#2563eb",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CalendarCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", lineHeight: 1, margin: "0 0 6px" }}>
            {metrics.pendingReservations}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {reservations.length} {t("reservationsTotal", "total client requests")}
          </span>
        </div>

        {/* KPI 4: Unread Inquiries */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
              {t("unreadConciergeMessages", "VIP Inquiries")}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(220,38,38,0.1)",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
              }}
            >
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", lineHeight: 1, margin: "0 0 6px" }}>
            {unreadCount}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {chats.length} {t("activeCustomerThreads", "active client threads")}
          </span>
        </div>

        {/* KPI 5: Subscription Tier */}
        <Link
          to={`/portal/${slug}/subscription`}
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            textDecoration: "none",
            color: "inherit",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#94a3b8")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
              {t("plan", "Plan Tier")}
            </span>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: subStyle.bg,
                color: subStyle.color,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: pkg?.color || "#18392f", lineHeight: 1.2, margin: "0 0 6px" }}>
            {pkg?.name}
          </div>
          <span style={{ fontSize: "12px", color: subStyle.color, fontWeight: 600 }}>
            ● {subStyle.label}
          </span>
        </Link>
      </div>

      {/* ── LIVE SHOWROOM SHOWCASE BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0e221b 0%, #1a3e32 100%)",
          borderRadius: "16px",
          padding: "26px 30px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px -5px rgba(14,34,27,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.12)",
              display: "grid",
              placeItems: "center",
              color: "#34d399",
              flexShrink: 0,
            }}
          >
            <Store size={26} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 700 }}>
              {t("clientStorefront", "Your Client Storefront is Live")}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
              Share this dedicated link with VIP clients, Instagram bio, or WhatsApp catalog:
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "9px",
              padding: "7px 14px",
            }}
          >
            <code style={{ color: "#34d399", fontSize: "13.5px", fontFamily: "monospace", fontWeight: 600 }}>
              {storeUrl}
            </code>
          </div>

          <button
            type="button"
            onClick={copyLink}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              borderRadius: "9px",
              background: copied ? "#10b981" : "#ffffff",
              color: copied ? "#ffffff" : "#0f172a",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? t("copied", "Copied!") : t("copy", "Copy Link")}</span>
          </button>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              borderRadius: "9px",
              background: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            <span>{t("openStore", "Open")}</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── TWO-COLUMN COMMAND CENTER (RECENT HOLDS + VIP CHAT) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px" }}>
        {/* Left: Recent Client Reservations */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {t("recentReservations", "Recent Fitting Holds")}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {reservations.length} {t("requestsReceived", "total client requests")}
              </span>
            </div>
            <Link
              to={`/portal/${slug}/reservations`}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#18392f",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{t("viewAll", "View all")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {reservationsLoading ? (
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>{t("loading", "Loading holds…")}</p>
          ) : reservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <CalendarCheck size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>No reservation requests yet.</p>
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>When VIP clients request items, they will appear here.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reservations.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {r.productImage ? (
                    <img
                      src={r.productImage}
                      alt=""
                      style={{ width: "44px", height: "52px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "44px",
                        height: "52px",
                        borderRadius: "8px",
                        background: "#e2e8f0",
                        display: "grid",
                        placeItems: "center",
                        color: "#94a3b8",
                        flexShrink: 0,
                      }}
                    >
                      <ShoppingBag size={18} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.productTitle || "Boutique Item"}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {r.customerName || "Client"} {r.size ? `· Size ${r.size}` : ""}
                    </span>
                    {r.note && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                        "{r.note}"
                      </p>
                    )}
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <select
                      value={r.status || "requested"}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "1px solid #cbd5e1",
                        background:
                          r.status === "confirmed"
                            ? "#eff6ff"
                            : r.status === "completed"
                            ? "#f0fdf4"
                            : r.status === "cancelled"
                            ? "#fef2f2"
                            : "#fffbeb",
                        color:
                          r.status === "confirmed"
                            ? "#2563eb"
                            : r.status === "completed"
                            ? "#15803d"
                            : r.status === "cancelled"
                            ? "#b91c1c"
                            : "#b45309",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="requested">{t("requested", "Requested")}</option>
                      <option value="confirmed">{t("confirmed", "Confirmed")}</option>
                      <option value="completed">{t("completed", "Completed")}</option>
                      <option value="cancelled">{t("cancelled", "Cancelled")}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Customer Conversations Feed */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {t("recentCustomerChats", "VIP Concierge Inquiries")}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {unreadCount > 0 ? `${unreadCount} ${t("unread", "unread")}` : t("liveConcierge", "Realtime chat")}
              </span>
            </div>
            <Link
              to={`/portal/${slug}/inbox`}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#18392f",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{t("openInbox", "Open")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {chats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <MessageSquare size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>No customer messages yet.</p>
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>When clients chat on your store, messages appear here.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {chats.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  to={`/portal/${slug}/inbox`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: chat.unreadByBusiness ? "rgba(220,38,38,0.04)" : "#f8fafc",
                    border: "1px solid " + (chat.unreadByBusiness ? "rgba(220,38,38,0.2)" : "#e2e8f0"),
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#94a3b8")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = chat.unreadByBusiness ? "rgba(220,38,38,0.2)" : "#e2e8f0")
                  }
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #18392f 0%, #2f6553 100%)",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {chat.customerName?.charAt(0) || "C"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>
                        {chat.customerName || "Customer"}
                      </strong>
                      {chat.unreadByBusiness && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#dc2626",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: chat.unreadByBusiness ? "#0f172a" : "#64748b",
                        fontWeight: chat.unreadByBusiness ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chat.lastMessage || "Product inquiry"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SALES PIPELINE BREAKDOWN ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "24px 28px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "0 0 2px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              <TrendingUp size={18} color="#10b981" />
              {t("reservationPipeline", "Client Reservation Pipeline")}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {t("reservationPipelineDesc", "Lifecycle stages of all client holds & fitting requests.")}
            </span>
          </div>

          <Link
            to={`/portal/${slug}/reservations`}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#18392f",
              textDecoration: "none",
            }}
          >
            {t("manageReservations", "Manage Pipeline")} →
          </Link>
        </div>

        {pipeline.total === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "13.5px", margin: 0 }}>
            {t("noPipelineData", "No client reservations received yet. They will automatically populate this pipeline.")}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: t("requested", "Hold Requested"), count: pipeline.requested, color: "#f59e0b", bg: "#fef3c7" },
              { label: t("confirmed", "Confirmed Fitting"), count: pipeline.confirmed, color: "#2563eb", bg: "#dbeafe" },
              { label: t("completed", "Fulfilled / Completed"), count: pipeline.completed, color: "#10b981", bg: "#d1fae5" },
              { label: t("cancelled", "Cancelled / Expired"), count: pipeline.cancelled, color: "#ef4444", bg: "#fee2e2" },
            ].map(({ label, count, color, bg }) => {
              const pct = pipeline.total > 0 ? Math.round((count / pipeline.total) * 100) : 0;
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ width: "160px", fontSize: "13px", fontWeight: 500, color: "#334155", flexShrink: 0 }}>
                    {label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "10px",
                      borderRadius: "999px",
                      background: "#f1f5f9",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: "999px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      minWidth: "32px",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {count}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b", width: "40px", textAlign: "right" }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
