import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function OwnerNotice() {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  if (!isAdmin || pathname.startsWith("/admin")) return null;

  return (
    <div className="owner-notice">
      <span>{t("businessPortal", "Signed in as owner")}</span>
      <Link to="/admin">{t("businessPortal", "Back to dashboard")}</Link>
    </div>
  );
}
