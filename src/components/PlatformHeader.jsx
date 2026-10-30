import { Link } from "react-router-dom";
import { Store, ShieldCheck, ArrowRight, Building, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AccountMenu from "./AccountMenu";
import LanguageSwitcher from "./LanguageSwitcher";

export default function PlatformHeader() {
  const { user, isSuperAdmin, myBusiness } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="platform-header">
      <div className="platform-header-inner">
        <Link to="/" className="platform-brand">
          <span className="platform-brand-mark">L</span>
          <div className="platform-brand-text">
            <strong>Luna</strong>
            <span className="platform-brand-badge">Boutique Platform</span>
          </div>
        </Link>

        <nav className="platform-nav" aria-label="Platform navigation">
          <a href="#features">{t("features", "Features")}</a>
          <a href="#how-it-works">{t("howItWorks", "How It Works")}</a>
          <a href="#directory">{t("activeBoutiques", "Active Boutiques")}</a>
          {myBusiness && !isSuperAdmin && (
            <Link to={`/portal/${myBusiness.slug}`} className="platform-nav-highlight">
              <Building size={15} /> {t("myPortal", "My Portal")} ({myBusiness.name})
            </Link>
          )}
          {isSuperAdmin && (
            <Link to="/super-admin" className="platform-nav-admin">
              <ShieldCheck size={15} /> {t("superAdmin", "Super Admin")}
            </Link>
          )}
        </nav>

        <div className="platform-actions">
          {/* Language Switcher — always visible */}
          <LanguageSwitcher />

          {!user ? (
            <>
              <Link to="/login" className="platform-signin-link">
                {t("signIn", "Sign in")}
              </Link>
              <Link to="/register-business" className="btn platform-register-btn">
                {t("registerBusiness", "Register Your Business")} <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <div className="platform-user-actions">
              {isSuperAdmin ? (
                <Link to="/super-admin" className="btn portal-cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={14} /> {t("superAdminConsole", "Super Admin Console")}
                </Link>
              ) : myBusiness ? (
                <Link to={`/portal/${myBusiness.slug}`} className="btn portal-cta-btn">
                  {t("manage", "Manage")} {myBusiness.name}
                </Link>
              ) : (
                <Link to="/register-business" className="btn platform-register-btn">
                  {t("registerBusiness", "Register Your Business")}
                </Link>
              )}
              <AccountMenu />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
