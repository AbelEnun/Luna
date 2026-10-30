import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { useState } from "react";

export default function AdminGuard({ children }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  if (loading) return <main className="page narrow"><p className="muted">{t("processing", "Checking owner access…")}</p></main>;
  if (!user) return <Navigate to="/admin/login" state={{ from: location.pathname + location.search }} replace />;
  if (!isAdmin) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <p className="eyebrow">{t("businessPortal", "Owner access")}</p>
          <h1>{t("businessPortal", "Owner access only")}</h1>
          <p>{t("suspendedBannerDesc", "This account is not authorized to manage the shop.")}</p>
          <p className="admin-user-id"><code>{user.uid}</code></p>
          <button className="btn danger" type="button" onClick={() => setConfirmingSignOut(true)}>{t("signOut", "Sign out")}</button>
        </section>
        <ConfirmDialog
          open={confirmingSignOut}
          title={`${t("signOut", "Sign out")} of ${user.email || "your account"}?`}
          description={t("signOutConfirmDesc", "You will return to the owner sign-in page.")}
          confirmLabel={t("signOut", "Sign out")}
          cancelLabel={t("cancel", "Cancel")}
          onClose={() => setConfirmingSignOut(false)}
          onConfirm={async () => { setConfirmingSignOut(false); await logout(); }}
        />
      </main>
    );
  }
  return children;
}
