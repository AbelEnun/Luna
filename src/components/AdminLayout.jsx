import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "./ConfirmDialog";
import LanguageSwitcher from "./LanguageSwitcher";
import { useState } from "react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const navItems = [
    [t("overview", "Overview"), "/admin"],
    [t("products", "Products"), "/admin/products"],
    [t("reservations", "Reservations"), "/admin/reservations"],
    [t("inbox", "Inbox"), "/admin/inbox"],
    [t("branding", "Shop profile"), "/admin/profile"],
  ];

  async function signOut() {
    setConfirmingSignOut(false);
    await logout();
  }

  return (
    <div className="admin-app-shell">
      <header className="admin-topbar">
        <div>
          <span className="owner-label">{t("businessPortal", "Owner dashboard")}</span>
          <strong>{user?.email || "Owner"}</strong>
        </div>
        <div className="admin-topbar-actions">
          <LanguageSwitcher />
          <a href="/" target="_blank" rel="noopener noreferrer">{t("viewStore", "View shop")}</a>
          <button type="button" className="btn ghost" onClick={() => setConfirmingSignOut(true)}>{t("signOut", "Sign out")}</button>
        </div>
      </header>
      <main className="admin-shell">
        <aside className="admin-sidebar">
          <nav aria-label="Owner navigation">
            {navItems.map(([label, to]) => (
              <NavLink key={to} to={to} end={to === "/admin"}>{label}</NavLink>
            ))}
          </nav>
        </aside>
        <div className="admin-content"><Outlet /></div>
      </main>
      <ConfirmDialog
        open={confirmingSignOut}
        title={`${t("signOut", "Sign out")} of ${user?.email || "your account"}?`}
        description={t("signOutConfirmDesc", "The owner dashboard will close and return to the owner sign-in page.")}
        confirmLabel={t("signOut", "Sign out")}
        cancelLabel={t("cancel", "Cancel")}
        onClose={() => setConfirmingSignOut(false)}
        onConfirm={signOut}
      />
    </div>
  );
}
