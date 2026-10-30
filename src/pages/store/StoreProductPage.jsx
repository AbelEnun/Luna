import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { MessageSquare, Heart, Check, ArrowLeft, ShieldCheck, Sparkles, Store, Clock } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useTenantWishlist } from "../../hooks/useTenantWishlist";
import { useTenantReservations } from "../../hooks/useTenantReservations";
import { useLanguage } from "../../context/LanguageContext";
import { money } from "../../config";

export default function StoreProductPage() {
  const { id } = useParams();
  const { business, businessId, slug, isOwner } = useTenant();
  const { user } = useAuth();
  const { ids, toggle } = useTenantWishlist();
  const { create } = useTenantReservations({ admin: false });
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [p, setP] = useState(undefined); // undefined = loading, null = not found
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [reservationNote, setReservationNote] = useState("");
  const [reservationSent, setReservationSent] = useState(false);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    setActiveImg(0);
    setSelectedSize(null);
    setReservationSent(false);

    if (!businessId) {
      setP(null);
      return;
    }

    const docRef = doc(db, "businesses", businessId, "products", id);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setP({ id: snap.id, ...snap.data() });
        } else {
          setP(null);
        }
      },
      () => setP(null)
    );
  }, [businessId, id]);

  if (p === undefined) {
    return (
      <main className="page" style={{ padding: "80px 24px", textAlign: "center" }}>
        <p className="muted">{t("loadingProductDetails", "Loading product details…")}</p>
      </main>
    );
  }

  if (p === null) {
    return (
      <main className="page narrow center" style={{ padding: "100px 24px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "36px", marginBottom: "8px" }}>{t("pieceNotFound", "Piece Not Found")}</h1>
        <p className="muted" style={{ marginBottom: "24px" }}>{t("noMatchingPieces", "This item is no longer available in the active showroom collection.")}</p>
        <Link to={`/store/${slug}`} className="btn ghost" style={{ borderRadius: "8px" }}>
          <ArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          {t("returnToShowroom", "Return to Showroom")}
        </Link>
      </main>
    );
  }

  const liked = ids.has(p.id);

  const handleAsk = () => {
    if (isOwner) {
      navigate(`/portal/${slug}/inbox`);
      return;
    }
    if (!user) {
      navigate("/login", { state: { from: `/store/${slug}/chat?product=${p.id}` } });
    } else {
      navigate(`/store/${slug}/chat?product=${p.id}`);
    }
  };

  const handleLike = async () => {
    if (isOwner) return;
    const ok = await toggle(p.id);
    if (!ok) {
      navigate("/login", { state: { from: `/store/${slug}/product/${p.id}` } });
    }
  };

  const handleReserve = async () => {
    if (isOwner) {
      navigate(`/portal/${slug}/reservations`);
      return;
    }
    if (!user) {
      navigate("/login", { state: { from: `/store/${slug}/product/${p.id}` } });
      return;
    }
    setReserving(true);
    try {
      await create(p, reservationNote, selectedSize);
      setReservationSent(true);
    } finally {
      setReserving(false);
    }
  };

  const images = p.images?.length ? p.images : ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85"];

  return (
    <main className="page" style={{ maxWidth: "1280px", padding: "40px clamp(20px, 5vw, 60px) 100px" }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "32px" }}>
        <Link to={`/store/${slug}`} style={{ color: "#18392f", textDecoration: "none", fontWeight: 600 }}>
          {business?.name || "Showroom"}
        </Link>
        <span>/</span>
        {p.category && (
          <>
            <Link to={`/store/${slug}?category=${encodeURIComponent(p.category)}`} style={{ color: "#64748b", textDecoration: "none" }}>
              {p.category}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: "#0f172a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
          {p.title}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "56px", alignItems: "flex-start" }}>
        {/* Gallery Column */}
        <div>
          <div style={{ borderRadius: "16px", overflow: "hidden", aspectRatio: "3 / 4", background: "#f1f3f2", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
            <img
              src={images[activeImg] || images[0]}
              alt={p.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {images.length > 1 && (
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", overflowX: "auto", paddingBottom: "4px" }}>
              {images.map((src, index) => (
                <button
                  key={src + index}
                  type="button"
                  onClick={() => setActiveImg(index)}
                  aria-label={`Photo ${index + 1}`}
                  style={{
                    width: "74px",
                    height: "92px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: index === activeImg ? "2px solid #18392f" : "1px solid #e2e8f0",
                    padding: 0,
                    cursor: "pointer",
                    background: "none",
                    flexShrink: 0,
                    opacity: index === activeImg ? 1 : 0.65,
                    transition: "all 0.15s ease",
                  }}
                >
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase/Reserve Column */}
        <div>
          {p.brand && (
            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              {p.brand}
            </span>
          )}

          <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(30px, 4vw, 44px)", margin: "0 0 12px", fontWeight: 500, lineHeight: 1.15, color: "#0f172a" }}>
            {p.title}
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "24px" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "#18392f", fontVariantNumeric: "tabular-nums" }}>
              {money(p.price, business.currency)}
            </span>
            {p.isNew && (
              <span style={{ padding: "3px 8px", borderRadius: "4px", background: "rgba(24,57,47,0.08)", color: "#18392f", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                {t("newArrivals", "New Arrival")}
              </span>
            )}
          </div>

          {p.description && (
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#475569", marginBottom: "32px", borderBottom: "1px solid #e2e8f0", paddingBottom: "24px" }}>
              {p.description}
            </p>
          )}

          {/* Size Selector */}
          {p.sizes?.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "10px" }}>
                {t("selectSize", "Select Size:")}
              </span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {p.sizes.map((s) => {
                  const active = selectedSize === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      style={{
                        minWidth: "48px",
                        height: "44px",
                        padding: "0 14px",
                        borderRadius: "8px",
                        border: active ? "2px solid #18392f" : "1px solid #cbd5e1",
                        background: active ? "#18392f" : "#ffffff",
                        color: active ? "#ffffff" : "#0f172a",
                        fontWeight: active ? 700 : 500,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Row & Booking — Hidden for Showroom Owner */}
          {isOwner ? (
            <div
              style={{
                padding: "20px 24px",
                borderRadius: "14px",
                background: "rgba(24,57,47,0.06)",
                border: "1px solid rgba(24,57,47,0.2)",
                marginBottom: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <strong style={{ display: "block", fontSize: "14.5px", color: "#18392f", marginBottom: "2px" }}>
                  Showroom Preview Mode
                </strong>
                <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                  Viewing as boutique owner. Customer chat holds & favorites are hidden.
                </span>
              </div>
              <Link
                to={`/portal/${slug}/products`}
                className="btn"
                style={{
                  fontSize: "13px",
                  padding: "10px 18px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                }}
              >
                <span>Edit in Portal</span> →
              </Link>
            </div>
          ) : (
            <>
              {/* Action Row */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
                <button
                  className="btn"
                  type="button"
                  onClick={handleAsk}
                  style={{
                    flex: "1 1 220px",
                    padding: "14px 22px",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  <MessageSquare size={16} />
                  {selectedSize ? `${t("chatAboutPiece", "Ask Concierge")} (${selectedSize})` : t("chatAboutPiece", "Ask Concierge About This Piece")}
                </button>

                <button
                  type="button"
                  onClick={handleLike}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: liked ? "#fef2f2" : "#ffffff",
                    color: liked ? "#dc2626" : "#0f172a",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Heart size={16} fill={liked ? "#dc2626" : "none"} color={liked ? "#dc2626" : "#0f172a"} />
                  {liked ? t("saved", "Saved") : t("save", "Save")}
                </button>
              </div>

              {/* Private Showroom Fitting / Reservation Card */}
              <div
                style={{
                  padding: "24px",
                  borderRadius: "14px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <ShieldCheck size={18} color="#18392f" />
                  <strong style={{ fontSize: "15px", color: "#0f172a" }}>{t("requestFittingHold", "Request Showroom Fitting Hold")}</strong>
                </div>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {t("holdDesc", "Hold this piece exclusively for you at the boutique. No payment is charged online; you try and pay in-store.")}
                </p>

                {reservationSent ? (
                  <div style={{ padding: "14px", borderRadius: "8px", background: "#dcfce7", color: "#15803d", fontSize: "13.5px", fontWeight: 600 }}>
                    {t("reservationSubmitted", "✓ Reservation request submitted! Track status in")}{" "}
                    <Link to={`/store/${slug}/reservations`} style={{ color: "#166534", textDecoration: "underline" }}>
                      {t("reservations", "My Reservations")}
                    </Link>.
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      {t("preferredFittingDate", "Preferred fitting date or notes (optional)")}
                    </label>
                    <textarea
                      rows="2"
                      value={reservationNote}
                      onChange={(e) => setReservationNote(e.target.value)}
                      placeholder={t("fittingPlaceholder", "e.g. Would love to try this in store this Friday afternoon…")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "13px",
                        marginBottom: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleReserve}
                      disabled={reserving}
                      className="btn"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        fontWeight: 700,
                      }}
                    >
                      {reserving ? t("submittingRequest", "Submitting Request…") : t("submitHoldRequest", "Submit Hold Request")}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
