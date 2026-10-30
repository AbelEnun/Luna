import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { usePublishedProducts } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Wishlist() {
  const { user } = useAuth();
  const { items, loading, error } = usePublishedProducts();
  const { ids, toggle, loading: wishlistLoading } = useWishlist();
  const { t } = useLanguage();
  const nav = useNavigate();

  if (!user)
    return (
      <main className="page">
        <h1>{t("wishlist", "Your wishlist")}</h1>
        <p><Link to="/login" state={{ from: "/wishlist" }}>{t("signIn", "Sign in")}</Link> {t("authSubtitle", "to save pieces you love.")}</p>
      </main>
    );

  const saved = (items || []).filter((p) => ids.has(p.id));

  return (
    <main className="page">
      <h1>{t("wishlist", "Your wishlist")}</h1>
      {(loading || wishlistLoading) && <p className="muted">{t("loading", "Loading your saved pieces…")}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && saved.length === 0 && (
        <p className="muted">{t("wishlistEmptyDesc", "Nothing saved yet. Tap the heart on any piece to keep it here.")}</p>
      )}
      <div className="grid">
        {saved.map((p) => (
          <ProductCard key={p.id} p={p} liked onLike={(id) => toggle(id).then((ok) => !ok && nav("/login"))} />
        ))}
      </div>
    </main>
  );
}
