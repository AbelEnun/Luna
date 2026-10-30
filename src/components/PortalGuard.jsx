import { Navigate, useLocation, Link } from "react-router-dom";
import { Clock, XCircle, ShieldOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";
import { getPackage } from "../config";

export default function PortalGuard({ children }) {
  const { user, isSuperAdmin, loading: authLoading, myBusiness } = useAuth();
  const { isOwner, loading: tenantLoading, business, slug } = useTenant();
  const { t } = useLanguage();
  const location = useLocation();

  if (authLoading || tenantLoading) {
    return (
      <main className="page narrow center">
        <p className="muted">{t("processing", "Verifying business access credentials...")}</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Super Admin is strictly prohibited from accessing any tenant's private business portal under any circumstance!
  if (isSuperAdmin) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card" style={{ maxWidth: "540px", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <ShieldOff size={32} color="#dc2626" />
          </div>
          <p className="eyebrow" style={{ color: "#dc2626" }}>Access Restricted</p>
          <h1 style={{ fontSize: "22px", margin: "0 0 10px" }}>Super Admin Portal Access Restricted</h1>
          <p className="muted" style={{ lineHeight: 1.6, marginBottom: "24px" }}>
            As a Platform Super Administrator, you are strictly restricted from entering tenant business operations portals.
            All administrative oversight, approvals, and platform configurations must be conducted through the Super Admin Console.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/super-admin" className="btn" style={{ padding: "10px 20px" }}>
              Super Admin Console →
            </Link>
            <Link to={`/store/${slug}`} className="btn ghost" style={{ padding: "10px 18px" }}>
              View Public Showroom
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Verification is only required on registration, not during regular portal login.

  if (!isOwner) {
    // If user owns a different business, automatically route them to their own portal
    if (myBusiness && myBusiness.slug && myBusiness.slug !== slug) {
      return <Navigate to={`/portal/${myBusiness.slug}`} replace />;
    }

    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <p className="eyebrow">{t("businessPortal", "Access Restricted")}</p>
          <h1>{t("businessPortal", "Unauthorized Portal Access")}</h1>
          <p className="muted">
            You are signed in as <strong>{user.email}</strong>, but do not have
            administrative permissions for <strong>{business?.name || slug}</strong>.
          </p>
          {myBusiness ? (
            <div style={{ marginTop: "16px" }}>
              <Link to={`/portal/${myBusiness.slug}`} className="btn wide">
                {t("goToBusinessPortal", "Go to My Business Portal")} ({myBusiness.name})
              </Link>
            </div>
          ) : (
            <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
              <Link to="/register-business" className="btn wide">{t("registerBusiness", "Register Your Business")}</Link>
              <Link to={`/store/${slug}`} className="btn ghost wide">{t("viewLiveStore", "Visit Public Storefront")}</Link>
            </div>
          )}
        </section>
      </main>
    );
  }

  // Allow owners and super admins directly into the portal dashboard!
  // Pending, suspended, and rejected states are handled gracefully inside the dashboard with notification banners.
  return children;
}
