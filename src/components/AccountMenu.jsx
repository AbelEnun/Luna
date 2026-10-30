import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building, ShieldCheck, Heart, CalendarCheck, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "./ConfirmDialog";

export default function AccountMenu({ slug }) {
  const { user, isSuperAdmin, myBusiness, logout } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (user?.displayName || user?.email || "U").trim().charAt(0).toUpperCase();

  const signOut = async () => {
    setConfirming(false);
    await logout();
    setOpen(false);
    navigate("/");
  };

  const wishlistPath = slug ? `/store/${slug}/wishlist` : "/wishlist";
  const reservationsPath = slug ? `/store/${slug}/reservations` : "/reservations";
  const chatPath = slug ? `/store/${slug}/chat` : "/chat";

  return (
    <>
      <div className="account-wrap" ref={menuRef}>
        <button
          ref={triggerRef}
          className="account-button"
          type="button"
          aria-label={`Open account menu for ${user?.displayName || user?.email || "account"}`}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true">{initial}</span>
        </button>

        {open && (
          <div className="account-menu" role="menu">
            <div className="account-menu-head">
              <strong>{user?.displayName || "User"}</strong>
              <span>{user?.email}</span>
            </div>

            {myBusiness && !isSuperAdmin && (
              <Link
                role="menuitem"
                to={`/portal/${myBusiness.slug}`}
                onClick={() => setOpen(false)}
                className="account-menu-highlight"
              >
                <Building size={14} style={{ display: "inline", marginRight: "6px" }} />
                {t("myPortal", "My ERP Portal")} ({myBusiness.name})
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                role="menuitem"
                to="/super-admin"
                onClick={() => setOpen(false)}
                style={{ color: "#2563eb", fontWeight: "600" }}
              >
                <ShieldCheck size={14} style={{ display: "inline", marginRight: "6px" }} />
                {t("superAdminConsole", "Super Admin Console")}
              </Link>
            )}

            {slug && !isSuperAdmin && (
              <>
                <Link role="menuitem" to={wishlistPath} onClick={() => setOpen(false)}>
                  <Heart size={14} style={{ display: "inline", marginRight: "6px" }} />
                  {t("wishlist", "Saved Wishlist")}
                </Link>
                <Link role="menuitem" to={reservationsPath} onClick={() => setOpen(false)}>
                  <CalendarCheck size={14} style={{ display: "inline", marginRight: "6px" }} />
                  {t("reservations", "Showroom Reservations")}
                </Link>
                <Link role="menuitem" to={chatPath} onClick={() => setOpen(false)}>
                  <MessageSquare size={14} style={{ display: "inline", marginRight: "6px" }} />
                  {t("chat", "Concierge Chat")}
                </Link>
              </>
            )}

            <button
              role="menuitem"
              type="button"
              className="menu-signout"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
            >
              <LogOut size={14} style={{ display: "inline", marginRight: "6px" }} />
              {t("signOut", "Sign out")}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        variant="signout"
        accountEmail={user?.email}
        title={t("signOutAccountTitle", "Sign out of your account?")}
        description={t("signOutConfirmDesc", "You will be signed out across the platform. You can sign back in anytime.")}
        confirmLabel={t("signOut", "Sign out")}
        cancelLabel={t("staySignedIn", "Stay Signed In")}
        onClose={() => setConfirming(false)}
        onConfirm={signOut}
      />
    </>
  );
}
