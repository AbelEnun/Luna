import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useWishlist } from "../hooks/useWishlist";
import { useReservations } from "../hooks/useReservations";
import { useLanguage } from "../context/LanguageContext";
import { money } from "../config";

export default function ProductPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { shop } = useShop();
  const { ids, toggle } = useWishlist();
  const { create } = useReservations();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [p, setP] = useState(undefined); // undefined = loading, null = not found
  const [i, setI] = useState(0);
  const [size, setSize] = useState(null);
  const [reservationNote, setReservationNote] = useState("");
  const [reservationSent, setReservationSent] = useState(false);

  useEffect(() => {
    setI(0);
    setSize(null);
    return onSnapshot(
      doc(db, "products", id),
      (s) => setP(s.exists() ? { id: s.id, ...s.data() } : null),
      () => setP(null)
    );
  }, [id]);

  if (p === undefined) return <main className="page"><p className="muted">{t("loading", "Loading…")}</p></main>;
  if (p === null)
    return (
      <main className="page">
        <h1>{t("pieceNotFound", "We couldn't find that item")}</h1>
        <p><Link to="/">{t("returnToShowroom", "Back to new arrivals")}</Link></p>
      </main>
    );

  const liked = ids.has(p.id);
  const ask = () =>
    user
      ? nav(`/chat?product=${p.id}`)
      : nav("/login", { state: { from: `/chat?product=${p.id}` } });
  const like = async () => {
    if (!(await toggle(p.id))) nav("/login", { state: { from: `/product/${p.id}` } });
  };
  const reserve = async () => {
    if (!user) {
      nav("/login", { state: { from: `/product/${p.id}` } });
      return;
    }
    await create(p, reservationNote);
    setReservationSent(true);
  };

  return (
    <main className="page product">
      <div className="gallery">
        <img className="main-img" src={p.images?.[i]} alt={p.title} />
        {p.images?.length > 1 && (
          <div className="thumbs">
            {p.images.map((src, n) => (
              <button key={src} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} aria-pressed={n === i}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="info">
        <p className="muted">{p.brand}</p>
        <h1 className="product-title">{p.title}</h1>
        <p className="price big">{money(p.price, shop.currency)}</p>
        {p.description && <p className="desc">{p.description}</p>}

        {p.sizes?.length > 0 && (
          <fieldset className="sizes">
            <legend>{t("selectSize", "Size")}</legend>
            {p.sizes.map((s) => (
              <button key={s} className="chip" aria-pressed={size === s} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </fieldset>
        )}

        {!isAdmin && (
          <div className="actions">
            <button className="btn" onClick={ask}>
              {size ? `${t("chatAboutPiece", "Ask about size")} ${size}` : t("chatAboutPiece", "Ask about this item")}
            </button>
            <button className="btn ghost" onClick={like} aria-pressed={liked}>
              {liked ? t("saved", "Saved to wishlist") : t("save", "Save to wishlist")}
            </button>
          </div>
        )}

        {!isAdmin && (
          <fieldset className="reservation-form">
            <legend>{t("reservePiece", "Reserve this item")}</legend>
            <label>
              {t("preferredFittingDate", "Note, if needed")}
              <textarea rows="2" value={reservationNote} onChange={(event) => setReservationNote(event.target.value)} placeholder={t("fittingPlaceholder", "Preferred size or pickup details")} />
            </label>
            <button className="btn" type="button" onClick={reserve} disabled={reservationSent}>
              {reservationSent ? t("reservationSubmitted", "Reservation requested") : t("submitHoldRequest", "Request reservation")}
            </button>
          </fieldset>
        )}
      </div>
    </main>
  );
}
