import { Link } from "react-router-dom";
import { CalendarDays, Store, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useTenantReservations } from "../../hooks/useTenantReservations";
import { useLanguage } from "../../context/LanguageContext";
import { money } from "../../config";

export default function StoreReservations() {
  const { user } = useAuth();
  const { business, slug, isOwner } = useTenant();
  const { items, loading, error } = useTenantReservations({ admin: false });
  const { t } = useLanguage();

  // If the owner views reservations on customer storefront, redirect them to their portal reservations
  if (isOwner) {
    return (
      <main className="page narrow center" style={{ padding: "80px 24px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "32px", marginBottom: "12px" }}>
          {t("ownerShowroomMode", "Showroom Owner Mode")}
        </h1>
        <p className="muted" style={{ maxWidth: "460px", margin: "0 auto 24px" }}>
          {t("ownerReservationsDesc", "You are signed in as the boutique owner. Client reservations and fitting holds are managed in your operations dashboard.")}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link to={`/portal/${slug}/reservations`} className="btn">
            {t("manageReservations", "Manage Client Reservations")} →
          </Link>
          <Link to={`/store/${slug}`} className="btn ghost">
            {t("returnToShowroom", "Return to Showroom")}
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page narrow center" style={{ padding: "80px 24px" }}>
        <div style={{ width: "54px", height: "54px", borderRadius: "14px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
          <CalendarDays size={26} />
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "36px", marginBottom: "12px" }}>{t("reservations", "Showroom Reservations")}</h1>
        <p className="muted" style={{ maxWidth: "420px", margin: "0 auto 24px" }}>
          {t("holdItemsFitting", "Sign in to view and track your private in-store fitting holds and reservation requests.")}
        </p>
        <Link to="/login" state={{ from: `/store/${slug}/reservations` }} className="btn">
          {t("signIn", "Sign In")}
        </Link>
      </main>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return { label: t("fittingConfirmed", "Confirmed for Hold"), bg: "#dcfce7", color: "#15803d", icon: <CheckCircle2 size={13} /> };
      case "completed":
        return { label: t("completedPickedUp", "Completed / Picked Up"), bg: "#e0e7ff", color: "#3730a3", icon: <CheckCircle2 size={13} /> };
      case "cancelled":
        return { label: t("cancelled", "Cancelled"), bg: "#fee2e2", color: "#b91c1c", icon: <XCircle size={13} /> };
      default:
        return { label: t("requested", "Under Review by Atelier"), bg: "#fef3c7", color: "#92400e", icon: <Clock size={13} /> };
    }
  };

  return (
    <main className="page" style={{ maxWidth: "1000px" }}>
      <div className="section-heading" style={{ marginBottom: "32px" }}>
        <div>
          <span className="eyebrow">{business.name} {t("home", "Showroom")}</span>
          <h1 style={{ fontFamily: "var(--display)", fontSize: "36px", margin: "4px 0 0" }}>
            {t("reservations", "My Reservations")} ({items.length})
          </h1>
        </div>
        <Link to={`/store/${slug}`} className="btn ghost" style={{ borderRadius: "8px", fontSize: "13px" }}>
          {t("exploreDepartment", "Browse Collection")}
        </Link>
      </div>

      {loading && <p className="muted">{t("loading", "Loading your requests…")}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "70px 24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <CalendarDays size={42} color="#94a3b8" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>{t("noActiveReservations", "No Active Reservations")}</h3>
          <p className="muted" style={{ maxWidth: "440px", margin: "0 auto 24px", fontSize: "14px" }}>
            {t("noReservationsDesc", "When you request an item hold or private showroom fitting from a product page, its live status will appear here.")}
          </p>
          <Link to={`/store/${slug}`} className="btn" style={{ borderRadius: "8px" }}>
            {t("exploreCollection", "Explore Showroom Collection")}
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gap: "20px" }}>
        {items.map((r) => {
          const badge = getStatusBadge(r.status);
          return (
            <article
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: "24px",
                padding: "20px",
                borderRadius: "14px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                alignItems: "center",
              }}
            >
              <div style={{ aspectRatio: "3 / 4", borderRadius: "10px", overflow: "hidden", background: "#f1f5f9" }}>
                {r.productImage ? (
                  <img src={r.productImage} alt={r.productTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#94a3b8" }}>
                    <Store size={24} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      background: badge.bg,
                      color: badge.color,
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {badge.icon} {badge.label}
                  </span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {t("requested", "Requested")}: {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "Recently"}
                  </span>
                </div>

                <h2 style={{ fontFamily: "var(--display)", fontSize: "22px", margin: "0 0 6px", fontWeight: 600 }}>
                  {r.productTitle}
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
                  {r.productPrice && (
                    <strong style={{ fontSize: "16px", color: "#18392f" }}>
                      {money(r.productPrice, business.currency)}
                    </strong>
                  )}
                  {r.size && (
                    <span style={{ fontSize: "13px", color: "#475569", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                      {t("selectSize", "Size")}: {r.size}
                    </span>
                  )}
                </div>

                {r.note && (
                  <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                    “{r.note}”
                  </p>
                )}

                <div>
                  <Link
                    to={`/store/${slug}/product/${r.productId}`}
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#18392f",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      textDecoration: "none",
                    }}
                  >
                    {t("viewShowroomDetails", "View Showroom Item Details →")}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
