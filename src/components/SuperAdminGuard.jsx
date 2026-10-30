import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function SuperAdminGuard({ children }) {
  const { user, isSuperAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return <main className="page narrow center"><p className="muted">{t("processing", "Verifying super admin access...")}</p></main>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isSuperAdmin) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <p className="eyebrow">{t("superAdmin", "Restricted Area")}</p>
          <h1>{t("superAdminConsole", "Platform Owner Only")}</h1>
          <p className="muted">{t("suspendedBannerDesc", "This console is restricted to the platform owner. You are signed in as")} <strong>{user.email}</strong>.</p>
        </section>
      </main>
    );
  }

  return children;
}
