import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Clock, CheckCircle, XCircle, User, Mail, Tag } from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { useTenantReservations } from "../../hooks/useTenantReservations";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { money } from "../../config";

const STATUSES = ["all", "requested", "confirmed", "completed", "cancelled"];

export default function PortalReservations() {
  const { business, slug } = useTenant();
  const { items: reservations, loading, error, updateStatus } = useTenantReservations({ admin: true });
  const { show } = useToast();
  const { t } = useLanguage();

  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  const filtered = reservations.filter((r) => (filter === "all" ? true : r.status === filter));

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateStatus(id, newStatus);
      show(`Reservation marked as ${newStatus}.`);
    } catch {
      show("Failed to update reservation status.", "error");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="portal-reservations-page">
      <div className="portal-page-header">
        <div>
          <span className="eyebrow">{t("clientServices", "Client Services")}</span>
          <h1>{t("reservationPipeline", "Reservation Pipeline")}</h1>
          <p className="muted">{t("reviewFittingRequests", "Review client fitting requests, hold orders, and update booking statuses.")}</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="chips" role="group" aria-label={t("filterStatus", "Filter status")} style={{ marginBottom: "24px" }}>
        {STATUSES.map((status) => {
          const label = status === "all" ? t("all", "All") : t(status, status);
          return (
            <button
              key={status}
              type="button"
              className="chip"
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
              style={{ textTransform: "capitalize" }}
            >
              {label} ({status === "all" ? reservations.length : reservations.filter((r) => r.status === status).length})
            </button>
          );
        })}
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {filtered.length === 0 && !loading && (
        <div className="portal-panel center" style={{ padding: "48px 24px" }}>
          <p className="muted empty">No reservations found.</p>
        </div>
      )}

      <div className="reservation-cards-grid">
        {filtered.map((r) => (
          <article key={r.id} className="reservation-pipeline-card">
            <div className="pipeline-card-left">
              {r.productImage && (
                <img src={r.productImage} alt="" className="pipeline-product-thumb" />
              )}
              <div className="pipeline-product-info">
                <span className="pipeline-status-badge status-${r.status || 'requested'}">
                  {t(r.status || "requested", r.status || "requested")}
                </span>
                <strong className="pipeline-product-title">{r.productTitle}</strong>
                {r.productPrice && (
                  <span className="pipeline-product-price">
                    {money(r.productPrice, business?.currency)}
                  </span>
                )}
                {r.size && <span className="pipeline-size-tag">{t("details", "Size")}: {r.size}</span>}
              </div>
            </div>

            <div className="pipeline-card-center">
              <div className="customer-meta">
                <span>
                  <User size={13} style={{ display: "inline", marginRight: "4px" }} />
                  <strong>{r.customerName || "Customer"}</strong>
                </span>
                {r.customerEmail && (
                  <span className="customer-email">
                    <Mail size={13} style={{ display: "inline", marginRight: "4px" }} />
                    {r.customerEmail}
                  </span>
                )}
              </div>
              {r.note && (
                <div className="pipeline-note-box">
                  <p>“{r.note}”</p>
                </div>
              )}
            </div>

            <div className="pipeline-card-right">
              <label>
                {t("status", "Status")}
                <select
                  value={r.status || "requested"}
                  disabled={updatingId === r.id}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className={`status-select status-${r.status || "requested"}`}
                >
                  <option value="requested">{t("requested", "Requested")}</option>
                  <option value="confirmed">{t("confirmed", "Confirmed")}</option>
                  <option value="completed">{t("completed", "Completed")}</option>
                  <option value="cancelled">{t("cancelled", "Cancelled")}</option>
                </select>
              </label>
              {slug && (
                <Link to={`/store/${slug}/product/${r.productId}`} target="_blank" className="link" style={{ fontSize: "12px", marginTop: "6px" }}>
                  {t("viewStore", "View Piece")} ↗
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
