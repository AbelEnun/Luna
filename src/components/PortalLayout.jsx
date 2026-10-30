import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, CalendarCheck, MessageSquare,
  Palette, ExternalLink, Copy, Check, LogOut, Store,
  ShieldCheck, CreditCard, Bell, Headphones, Sparkles,
  ChevronRight, ArrowUpRight, CheckCircle2, AlertCircle,
  HelpCircle, User
} from "lucide-react";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { useTenantChats } from "../hooks/useTenantChats";
import { useTenantReservations } from "../hooks/useTenantReservations";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { getPackage } from "../config";
import LanguageSwitcher from "./LanguageSwitcher";
import ConfirmDialog from "./ConfirmDialog";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { getBoutiqueAgeAndTrial } from "../utils/trialHelper";

export default function PortalLayout() {
  const { business, slug, businessId } = useTenant();
  const { user, logout, isSuperAdmin } = useAuth();
  const { unreadCount } = useTenantChats({ admin: true });
  const { items: reservations } = useTenantReservations({ admin: true });
  const { show } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const trialInfo = getBoutiqueAgeAndTrial(business);

  const [copied, setCopied] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [supportUnread, setSupportUnread] = useState(false);

  // Listen for unread support replies from the platform admin
  useEffect(() => {
    if (!businessId) return;
    const unsub = onSnapshot(
      doc(db, "support_chats", businessId),
      (snap) => { setSupportUnread(!!snap.data()?.unreadByOwner); },
      () => {}
    );
    return () => unsub();
  }, [businessId]);

  const storeUrl = `${window.location.origin}/store/${slug}`;
  const pkg = getPackage(business?.package);

  const pendingReservations = reservations.filter((r) => r.status === "requested").length;
  const hasNotifications = pendingReservations > 0 || unreadCount > 0 || supportUnread;
  const totalNotifications = pendingReservations + unreadCount + (supportUnread ? 1 : 0);

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      show("Storefront link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      show("Could not copy link.", "error");
    }
  };

  // Status helper
  const statusMeta = () => {
    const s = business?.status;
    if (s === "approved") return { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: t("statusApproved", "Live & Approved") };
    if (s === "pending")  return { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: t("statusPending", "Pending Review") };
    if (s === "suspended") return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: t("statusSuspended", "Suspended") };
    if (s === "rejected")  return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: t("statusRejected", "Rejected") };
    return { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: s || "Active" };
  };
  const status = statusMeta();

  const navGroups = [
    {
      title: t("operations", "OPERATIONS"),
      items: [
        { label: t("overview", "Overview"), to: `/portal/${slug}`, icon: LayoutDashboard, end: true },
        { label: t("products", "Products & Stock"), to: `/portal/${slug}/products`, icon: Package },
        {
          label: t("reservations", "Reservations"),
          to: `/portal/${slug}/reservations`,
          icon: CalendarCheck,
          badge: pendingReservations,
          badgeColor: "#f59e0b"
        },
      ]
    },
    {
      title: t("conciergeAndChat", "CLIENT CONCIERGE"),
      items: [
        {
          label: t("customerInbox", "Customer Inbox"),
          to: `/portal/${slug}/inbox`,
          icon: MessageSquare,
          badge: unreadCount,
          badgeColor: "#ef4444"
        },
        {
          label: t("platformSupport", "Platform Support"),
          to: `/portal/${slug}/support`,
          icon: Headphones,
          badge: supportUnread ? 1 : 0,
          badgeColor: "#3b82f6"
        },
      ]
    },
    {
      title: t("brandAndAccount", "BRAND & SETTINGS"),
      items: [
        { label: t("branding", "Branding Studio"), to: `/portal/${slug}/branding`, icon: Palette },
        { label: t("subscription", "Subscription Plan"), to: `/portal/${slug}/subscription`, icon: CreditCard },
      ]
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* ── LUXURY TOPBAR / TASKBAR ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          padding: "0 28px",
          height: "70px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Boutique identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Logo / Monogram */}
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0e221b 0%, #1c4538 100%)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "19px",
                boxShadow: "0 4px 12px rgba(14,34,27,0.18)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span>{business?.name?.charAt(0) || "B"}</span>
              )}
            </div>

            {/* Title & tags */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  {business?.name || "Boutique"}
                </span>

                {/* Status dot */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: status.bg,
                    color: status.color,
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: status.color,
                      boxShadow: status.color === "#10b981" ? "0 0 6px #10b981" : "none",
                    }}
                  />
                  {status.label}
                </span>

                {/* Plan tag */}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: (pkg?.color || "#18392f") + "15",
                    color: pkg?.color || "#18392f",
                    border: `1px solid ${(pkg?.color || "#18392f")}30`,
                  }}
                >
                  {pkg?.name} {t("plan", "Plan")}
                </span>

                {/* Day Counter & Free Trial Tag */}
                <Link
                  to={`/portal/${slug}/subscription`}
                  style={{
                    textDecoration: "none",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: trialInfo.isTrial ? "#eff6ff" : "#f0fdf4",
                    color: trialInfo.isTrial ? "#2563eb" : "#166534",
                    border: trialInfo.isTrial ? "1px solid #bfdbfe" : "1px solid #bbf7d0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="View plan and trial status"
                >
                  {trialInfo.isTrial ? (
                    <>
                      <Sparkles size={11} color="#d97706" />
                      <span>{t("dayActiveLabel", "Day")} {trialInfo.daysActive}/30 {t("freeTrial", "Free Trial")} ({trialInfo.trialDaysRemaining} {t("daysRemainingLabel", "days left")})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={11} color="#16a34a" />
                      <span>{t("dayActiveLabel", "Day")} {trialInfo.daysActive} · {t("statusActive", "Active")}</span>
                    </>
                  )}
                </Link>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {business?.category || "Luxury Atelier"} · Luna
              </span>
            </div>
          </div>
        </div>

        {/* Center: Sleek Live Storefront Quick Link */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f1f5f9",
            padding: "6px 10px 6px 14px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("showroomLink", "Showroom")}:
            </span>
            <code
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: 600,
                color: "#18392f",
                background: "transparent",
                padding: 0,
              }}
            >
              /store/{slug}
            </code>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
            <button
              type="button"
              onClick={copyStoreLink}
              title="Copy client showroom link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                background: copied ? "#dcfce7" : "#ffffff",
                color: copied ? "#15803d" : "#334155",
                border: "1px solid " + (copied ? "#86efac" : "#cbd5e1"),
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? t("copied", "Copied!") : t("copy", "Copy")}</span>
            </button>

            <a
              href={`/store/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open customer showroom in new tab"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                background: "#18392f",
                color: "#ffffff",
                border: "none",
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "0 2px 4px rgba(24,57,47,0.15)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#234e40")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#18392f")}
            >
              <Store size={13} />
              <span>{t("viewLiveStore", "Visit")}</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Right: Actions, Language, Notifications, Sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Platform Support Quick Link */}
          <Link
            to={`/portal/${slug}/support`}
            title={t("platformSupport", "Platform Support Line")}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "9px",
              background: supportUnread ? "#eff6ff" : "#f8fafc",
              border: "1px solid " + (supportUnread ? "#bfdbfe" : "#e2e8f0"),
              color: supportUnread ? "#2563eb" : "#64748b",
              transition: "all 0.15s ease",
              textDecoration: "none",
            }}
          >
            <Headphones size={18} />
            {supportUnread && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  boxShadow: "0 0 6px #2563eb",
                }}
              />
            )}
          </Link>

          {/* Notification Bell */}
          <Link
            to={`/portal/${slug}/reservations`}
            title={hasNotifications ? `${totalNotifications} ${t("notifications", "notifications")}` : t("noNotifications", "All caught up")}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "9px",
              background: hasNotifications ? "rgba(245,158,11,0.1)" : "#f8fafc",
              border: "1px solid " + (hasNotifications ? "rgba(245,158,11,0.3)" : "#e2e8f0"),
              color: hasNotifications ? "#d97706" : "#64748b",
              transition: "all 0.15s ease",
              textDecoration: "none",
            }}
          >
            <Bell size={18} />
            {hasNotifications && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#dc2626",
                  color: "#ffffff",
                  borderRadius: "99px",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 5px",
                  minWidth: "16px",
                  textAlign: "center",
                  lineHeight: "1.4",
                  boxShadow: "0 2px 4px rgba(220,38,38,0.3)",
                }}
              >
                {totalNotifications > 99 ? "99+" : totalNotifications}
              </span>
            )}
          </Link>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            title={t("signOut", "Sign out")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 13px",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <LogOut size={14} />
            <span>{t("signOut", "Sign out")}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE (SIDEBAR + CONTENT) ── */}
      <div style={{ display: "flex", flex: 1, minHeight: "calc(100vh - 70px)" }}>
        {/* ── LUXURY DARK GREEN SIDEBAR ── */}
        <aside
          style={{
            width: "260px",
            flexShrink: 0,
            background: "linear-gradient(180deg, #0d1f19 0%, #132b23 60%, #0d1f19 100%)",
            color: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            top: "70px",
            height: "calc(100vh - 70px)",
            overflowY: "auto",
          }}
        >
          {/* Sidebar Navigation Groups */}
          <div style={{ flex: 1, padding: "20px 14px 10px" }}>
            {navGroups.map((group, groupIdx) => (
              <div key={group.title} style={{ marginBottom: "22px" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "rgba(255, 255, 255, 0.4)",
                    padding: "0 10px 8px",
                    textTransform: "uppercase",
                  }}
                >
                  {group.title}
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        style={({ isActive }) => ({
                          display: "flex",
                          alignItems: "center",
                          gap: "11px",
                          padding: "10px 12px",
                          borderRadius: "9px",
                          fontSize: "13.5px",
                          fontWeight: isActive ? 600 : 500,
                          textDecoration: "none",
                          color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.72)",
                          background: isActive
                            ? "linear-gradient(90deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.07) 100%)"
                            : "transparent",
                          borderLeft: isActive ? "3px solid #34d399" : "3px solid transparent",
                          boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                          transition: "all 0.15s ease",
                        })}
                      >
                        <Icon size={17} style={{ opacity: 0.9, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.badge > 0 && (
                          <span
                            style={{
                              background: item.badgeColor || "#ef4444",
                              color: "#ffffff",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "1px 7px",
                              minWidth: "18px",
                              textAlign: "center",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Storefront Launcher Card */}
          <div style={{ padding: "0 14px 16px" }}>
            <a
              href={`/store/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.09)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(52, 211, 153, 0.15)",
                  display: "grid",
                  placeItems: "center",
                  color: "#34d399",
                }}
              >
                <Store size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 600 }}>{t("liveStorefront", "Live Showroom")}</span>
                <span style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.5)" }}>{t("customerFacing", "Customer Experience")}</span>
              </div>
              <ArrowUpRight size={14} color="rgba(255,255,255,0.6)" />
            </a>
          </div>

          {/* Sidebar Footer: Boutique Passport Card */}
          <div
            style={{
              padding: "16px 14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{t("tier", "Plan Tier")}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: pkg?.color || "#34d399" }}>
                  {pkg?.name}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{t("operatingCurrency", "Currency")}</span>
                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#ffffff" }}>
                  {business?.currency || "ETB"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{t("status", "Status")}</span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: status.bg,
                    color: status.color,
                  }}
                >
                  {status.label}
                </span>
              </div>

              <Link
                to={`/portal/${slug}/subscription`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginTop: "4px",
                  padding: "6px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                <CreditCard size={12} />
                <span>{t("manageSubscription", "Manage Subscription")}</span>
              </Link>
            </div>

            {/* Day Counter & Free Trial Widget in Sidebar */}
            <div style={{ marginTop: "10px", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fcd34d", fontWeight: 700, marginBottom: "3px" }}>
                <span>{t("dayActiveLabel", "Day")} {trialInfo.daysActive}</span>
                <span style={{ fontSize: "10px", color: trialInfo.isTrial ? "#86efac" : "rgba(255,255,255,0.6)" }}>
                  {trialInfo.isTrial ? t("freeTrial", "Free Trial") : t("statusActive", "Active")}
                </span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", lineHeight: 1.3 }}>
                {trialInfo.isTrial ? `${trialInfo.trialDaysRemaining} ${t("daysRemainingLabel", "days remaining")} (${t("firstMonthFree", "1st month free")})` : `${t("sinceCreation", "since creation")}: ${trialInfo.createdFormatted}`}
              </div>
            </div>

            <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
              Luna · v2.4
            </p>
          </div>
        </aside>

        {/* ── CONTENT AREA ── */}
        <main
          style={{
            flex: 1,
            padding: "32px 36px",
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmDialog
        open={confirmSignOut}
        title={t("signOutConfirmTitle", `Sign out of ${business?.name || "your boutique"}?`)}
        description={t("signOutConfirmDesc", "You will exit the boutique operations control panel.")}
        confirmLabel={t("signOut", "Sign out")}
        cancelLabel={t("cancel", "Cancel")}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={async () => {
          setConfirmSignOut(false);
          await logout();
          navigate("/login");
        }}
      />
    </div>
  );
}
