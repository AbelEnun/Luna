import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search, Heart, MessageSquare, Menu, X, LayoutDashboard,
  CalendarDays, LogOut, User, Store, ShieldCheck, ChevronRight
} from "lucide-react";
import { useTenant } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { useTenantChats } from "../hooks/useTenantChats";
import { useTenantWishlist } from "../hooks/useTenantWishlist";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ConfirmDialog from "./ConfirmDialog";

export default function StoreHeader() {
  const { business, slug, isOwner } = useTenant();
  const { user, logout, isSuperAdmin } = useAuth();
  const { unreadCount } = useTenantChats({ admin: false });
  const { count: wishlistCount } = useTenantWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [query, setQuery] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const avatarRef = useRef(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [avatarOpen]);

  function handleSearch(e) {
    e.preventDefault();
    const val = query.trim();
    navigate(val ? `/store/${slug}?search=${encodeURIComponent(val)}` : `/store/${slug}`);
    setSearchOpen(false);
    setMobileOpen(false);
  }

  async function handleSignOut() {
    setAvatarOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    navigate(`/store/${slug}`);
  }

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <>
      {/* Top Announcement Bar */}
      {!announcementDismissed && business?.announcement && (
        <aside className="announcement-bar" role="region" aria-label="Showroom announcement">
          <p>{business.announcement}</p>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setAnnouncementDismissed(true)}
            style={{ fontSize: "16px", lineHeight: 1, padding: "2px 6px" }}
          >
            ×
          </button>
        </aside>
      )}

      {/* Owner Quick Bar */}
      {isOwner && (
        <div className="owner-notice">
          <span>You are previewing your showroom as the verified owner.</span>
          <Link to={`/portal/${slug}`}>
            <LayoutDashboard size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
            Open ERP Portal
          </Link>
        </div>
      )}

      {/* Super Admin Notice Bar (Restricted strictly to Super Admin Console) */}
      {isSuperAdmin && (
        <div className="owner-notice" style={{ background: "#1e3a5f" }}>
          <span>Viewing public showroom as Platform Super Administrator.</span>
          <Link to="/super-admin" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <ShieldCheck size={14} /> Super Admin Console
          </Link>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="site-header">
        <div className="header-main">
          {/* Mobile hamburger */}
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Boutique Brand */}
          <Link to={`/store/${slug}`} className="brand" aria-label={`${business?.name || "Boutique"} home`}>
            {business?.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} />
            ) : (
              <span>{business?.name || "Atelier"}</span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="main-nav desktop-only" aria-label="Store navigation">
            <NavLink to={`/store/${slug}`} end className={({ isActive }) => (isActive ? "active" : "")}>
              {t("home", "Showroom")}
            </NavLink>
            {!isOwner && (
              <>
                <NavLink to={`/store/${slug}/wishlist`} className={({ isActive }) => `nav-link-badge ${isActive ? "active" : ""}`}>
                  <Heart size={14} />
                  {t("wishlist", "Wishlist")}
                  {wishlistCount > 0 && <span className="header-pill-count">{wishlistCount}</span>}
                </NavLink>
                <NavLink to={`/store/${slug}/reservations`} className={({ isActive }) => `nav-link-badge ${isActive ? "active" : ""}`}>
                  <CalendarDays size={14} />
                  {t("reservations", "My Reservations")}
                </NavLink>
                <NavLink to={`/store/${slug}/chat`} className={({ isActive }) => `nav-link-badge ${isActive ? "active" : ""}`}>
                  <MessageSquare size={14} />
                  {t("chat", "Concierge")}
                  {unreadCount > 0 && <span className="dot customer-unread" />}
                </NavLink>
              </>
            )}
          </nav>

          {/* Header Action Tools */}
          <div className="header-actions">
            {/* Language Switcher Dropdown */}
            <LanguageSwitcher />

            {/* Search Trigger */}
            <button
              type="button"
              className="search-trigger"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((val) => !val)}
              title={t("search", "Search showroom")}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%" }}
            >
              <Search size={18} />
            </button>

            {/* User Account / Avatar */}
            {user ? (
              <div ref={avatarRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-label="User account menu"
                  aria-expanded={avatarOpen}
                  onClick={() => setAvatarOpen((v) => !v)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#18392f",
                    color: "#ffffff",
                    border: "2px solid #ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {userInitial}
                </button>

                {/* Dropdown Popover */}
                {avatarOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 10px)",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 14px 34px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)",
                      minWidth: "220px",
                      zIndex: 300,
                      overflow: "hidden",
                      animation: "fadeIn 0.15s ease",
                    }}
                  >
                    {/* User info head */}
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px", marginBottom: "2px" }}>
                        {user.displayName || "Customer"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </div>
                    </div>

                    {/* Nav Links */}
                    <div style={{ padding: "6px" }}>
                      {(user?.uid === business?.ownerId || (business?.staffIds && business?.staffIds.includes(user?.uid))) && (
                        <Link
                          to={`/portal/${slug}`}
                          onClick={() => setAvatarOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px",
                            fontSize: "13px", color: "#18392f", fontWeight: 600, textDecoration: "none",
                            borderRadius: "8px", background: "rgba(24,57,47,0.06)", marginBottom: "4px",
                          }}
                        >
                          <LayoutDashboard size={14} /> {t("businessPortal", "Business Portal")}
                        </Link>
                      )}

                      {isSuperAdmin && (
                        <Link
                          to="/super-admin"
                          onClick={() => setAvatarOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px",
                            fontSize: "13px", color: "#2563eb", fontWeight: 600, textDecoration: "none",
                            borderRadius: "8px", background: "rgba(37,99,235,0.06)", marginBottom: "4px",
                          }}
                        >
                          <ShieldCheck size={14} /> {t("superAdminConsole", "Super Admin Console")}
                        </Link>
                      )}

                      {!isOwner && (
                        <>
                          <Link
                            to={`/store/${slug}/wishlist`}
                            onClick={() => setAvatarOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "9px 12px", fontSize: "13.5px", color: "#334155",
                              textDecoration: "none", borderRadius: "8px", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <Heart size={14} color="#64748b" /> {t("wishlist", "Wishlist")}
                            </span>
                            {wishlistCount > 0 && (
                              <span style={{ fontSize: "11px", fontWeight: 700, background: "#f1f5f9", padding: "2px 8px", borderRadius: "99px", color: "#334155" }}>
                                {wishlistCount}
                              </span>
                            )}
                          </Link>

                          <Link
                            to={`/store/${slug}/reservations`}
                            onClick={() => setAvatarOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "9px 12px", fontSize: "13.5px", color: "#334155",
                              textDecoration: "none", borderRadius: "8px", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <CalendarDays size={14} color="#64748b" /> {t("reservations", "My Reservations")}
                          </Link>

                          <Link
                            to={`/store/${slug}/chat`}
                            onClick={() => setAvatarOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "9px 12px", fontSize: "13.5px", color: "#334155",
                              textDecoration: "none", borderRadius: "8px", transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <MessageSquare size={14} color="#64748b" /> {t("chat", "Concierge Chat")}
                            </span>
                            {unreadCount > 0 && (
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                            )}
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Sign out button */}
                    <div style={{ borderTop: "1px solid #f1f5f9", padding: "6px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarOpen(false);
                          setConfirmSignOut(true);
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          width: "100%", padding: "9px 12px", fontSize: "13px",
                          color: "#dc2626", background: "transparent", border: "none",
                          outline: "none", boxShadow: "none",
                          borderRadius: "8px", cursor: "pointer", fontWeight: 600,
                          textAlign: "left", transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                          e.currentTarget.style.color = "#b91c1c";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#dc2626";
                        }}
                      >
                        <LogOut size={14} /> {t("signOut", "Sign out")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                state={{ from: `/store/${slug}` }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#18392f",
                  padding: "7px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#18392f";
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                {t("signIn", "Sign In")}
              </Link>
            )}
          </div>
        </div>

        {/* Search Input Bar (Dropdown) */}
        {searchOpen && (
          <form className="header-search" role="search" onSubmit={handleSearch}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPiecesPlaceholder", "Search pieces by title, category, or brand…")}
              aria-label="Search showroom products"
            />
            <button type="submit" className="btn" style={{ padding: "8px 18px", borderRadius: "8px" }}>
              {t("search", "Search")}
            </button>
          </form>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <>
            <div
              className="drawer-backdrop"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="main-nav open" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontWeight: 700, fontSize: "16px", fontFamily: "var(--display)" }}>{business?.name}</span>
                <button
                  type="button"
                  className="mobile-close"
                  onClick={() => setMobileOpen(false)}
                  style={{ padding: "4px" }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                <NavLink to={`/store/${slug}`} end onClick={() => setMobileOpen(false)}>
                  {t("theCollection", "Showroom Collection")}
                </NavLink>
                {!isOwner && (
                  <>
                    <NavLink to={`/store/${slug}/wishlist`} onClick={() => setMobileOpen(false)}>
                      {t("wishlist", "Wishlist")} ({wishlistCount})
                    </NavLink>
                    <NavLink to={`/store/${slug}/reservations`} onClick={() => setMobileOpen(false)}>
                      {t("reservations", "My Reservations")}
                    </NavLink>
                    <NavLink to={`/store/${slug}/chat`} onClick={() => setMobileOpen(false)}>
                      {t("chat", "Concierge Chat")} {unreadCount > 0 && "•"}
                    </NavLink>
                  </>
                )}
                {isOwner && (
                  <NavLink to={`/portal/${slug}`} onClick={() => setMobileOpen(false)} style={{ color: "#18392f", fontWeight: 700 }}>
                    {t("businessPortal", "Business Portal")} →
                  </NavLink>
                )}
              </div>

              {user ? (
                <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                    Signed in as <strong>{user.displayName || user.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setConfirmSignOut(true);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "none", border: "none", color: "#dc2626",
                      fontSize: "14px", fontWeight: 600, cursor: "pointer", padding: "8px 0",
                    }}
                  >
                    <LogOut size={16} /> {t("signOut", "Sign out")}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
                  <Link
                    to="/login"
                    state={{ from: `/store/${slug}` }}
                    className="btn wide"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("signIn", "Sign In to Account")}
                  </Link>
                </div>
              )}
            </aside>
          </>
        )}

        {/* Confirmation Modal */}
        <ConfirmDialog
          open={confirmSignOut}
          variant="signout"
          accountEmail={user?.email}
          title={t("signOutAccountTitle", "Sign out of your account?")}
          description={t("signOutConfirmDesc", "You will exit your session on this showroom. You can sign back in anytime.")}
          confirmLabel={t("signOut", "Sign out")}
          cancelLabel={t("staySignedIn", "Stay Signed In")}
          onClose={() => setConfirmSignOut(false)}
          onConfirm={handleSignOut}
        />
      </header>
    </>
  );
}
