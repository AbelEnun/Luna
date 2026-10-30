import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useReservations } from "../hooks/useReservations";
import { useLanguage } from "../context/LanguageContext";

export default function Reservations() {
  const { user } = useAuth();
  const { items, loading, error } = useReservations();
  const { t } = useLanguage();

  if (!user) {
    return (
      <main className="page narrow">
        <h1>{t("reservations", "My reservations")}</h1>
        <p><Link to="/login" state={{ from: "/reservations" }}>{t("signIn", "Sign in")}</Link> {t("holdItemsFitting", "to view your requests.")}</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>{t("reservations", "My reservations")}</h1>
      {loading && <p className="muted">{t("loading", "Loading your requests…")}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {items.length === 0 && !loading && (
        <p className="muted">{t("noActiveReservations", "No reservations yet. Select an item to request it.")}</p>
      )}
      <div className="reservation-list">
        {items.map((reservation) => (
          <article className="reservation-card" key={reservation.id}>
            <div className="reservation-image">
              {reservation.productImage && <img src={reservation.productImage} alt="" />}
            </div>
            <div>
              <p className="eyebrow">{t("reservationSubmitted", "Reservation requested")}</p>
              <h2>{reservation.productTitle}</h2>
              <p className="muted">{t("status", "Status")}: {reservation.status}</p>
              {reservation.note && <p className="reservation-note">{reservation.note}</p>}
              <Link to={`/product/${reservation.productId}`} className="btn ghost">{t("details", "View item")}</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
