import { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useReservations } from "../hooks/useReservations";
import { useLanguage } from "../context/LanguageContext";

const statuses = ["requested", "confirmed", "cancelled", "completed"];

export default function AdminReservations() {
  const { items, loading, error } = useReservations({ admin: true });
  const { t } = useLanguage();
  const [updating, setUpdating] = useState("");

  async function setStatus(id, status) {
    setUpdating(id);
    try {
      await updateDoc(doc(db, "reservations", id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdating("");
    }
  }

  const statusLabels = {
    requested: t("requested", "Requested"),
    confirmed: t("confirmed", "Confirmed"),
    cancelled: t("cancelled", "Cancelled"),
    completed: t("completed", "Completed"),
  };

  return (
    <section className="admin-overview">
      <h2>{t("reservations", "Reservations")}</h2>
      {loading && <p className="muted">{t("loading", "Loading reservations…")}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {items.length === 0 && !loading && <p className="muted">{t("noCustomerConversationsYet", "No reservation requests yet.")}</p>}
      <div className="reservation-admin-list">
        {items.map((reservation) => (
          <article className="reservation-admin-card" key={reservation.id}>
            <div>
              <strong>{reservation.productTitle}</strong>
              <p className="muted">{reservation.customerName} · {reservation.customerEmail}</p>
              {reservation.note && <p>{reservation.note}</p>}
            </div>
            <label>
              {t("status", "Status")}
              <select
                value={reservation.status || "requested"}
                disabled={updating === reservation.id}
                onChange={(event) => setStatus(reservation.id, event.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status] || status}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
