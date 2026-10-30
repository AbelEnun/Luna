import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Sparkles, Store } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useTenantProducts } from "../../hooks/useTenantProducts";
import { useTenantWishlist } from "../../hooks/useTenantWishlist";
import { useLanguage } from "../../context/LanguageContext";

export default function StoreWishlist() {
  const { user } = useAuth();
  const { business, slug, isOwner } = useTenant();
  const { items, loading: productsLoading } = useTenantProducts({ publishedOnly: true });
  const { ids, toggle, loading: wishlistLoading } = useTenantWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // If the owner views wishlist on customer storefront, guide them to their portal
  if (isOwner) {
    return (
      <main className="page narrow center" style={{ padding: "80px 24px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "32px", marginBottom: "12px" }}>
          {t("ownerShowroomMode", "Showroom Owner Mode")}
        </h1>
        <p className="muted" style={{ maxWidth: "460px", margin: "0 auto 24px" }}>
          {t("ownerWishlistDesc", "The wishlist is a client shopping tool. To manage your boutique catalog pieces, visit your Business Portal.")}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link to={`/portal/${slug}/products`} className="btn">
            {t("manageProducts", "Manage Products in Portal")} →
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
        <div style={{ width: "54px", height: "54px", borderRadius: "14px", background: "rgba(220,38,38,0.08)", color: "#dc2626", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
          <Heart size={26} />
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "36px", marginBottom: "12px" }}>{t("wishlist", "Saved Wishlist")}</h1>
        <p className="muted" style={{ maxWidth: "420px", margin: "0 auto 24px" }}>
          {t("authSubtitle", "Sign in to your account to save your favorite pieces and access them across all your devices.")}
        </p>
        <Link to="/login" state={{ from: `/store/${slug}/wishlist` }} className="btn">
          {t("signIn", "Sign In")}
        </Link>
      </main>
    );
  }

  const saved = (items || []).filter((p) => ids.has(p.id));

  return (
    <main className="page" style={{ maxWidth: "1280px" }}>
      <div className="section-heading" style={{ marginBottom: "32px" }}>
        <div>
          <span className="eyebrow">{business.name} {t("home", "Showroom")}</span>
          <h1 style={{ fontFamily: "var(--display)", fontSize: "36px", margin: "4px 0 0" }}>
            {t("wishlist", "Saved Pieces")} ({saved.length})
          </h1>
        </div>
        <Link to={`/store/${slug}`} className="btn ghost" style={{ borderRadius: "8px", fontSize: "13px" }}>
          {t("exploreDepartment", "Continue Browsing")}
        </Link>
      </div>

      {(productsLoading || wishlistLoading) && <p className="muted">Loading…</p>}

      {!productsLoading && !wishlistLoading && saved.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <Heart size={44} color="#cbd5e1" style={{ marginBottom: "14px" }} />
          <h3 style={{ margin: "0 0 8px", fontSize: "20px" }}>{t("wishlistEmpty", "Your Wishlist is Empty")}</h3>
          <p className="muted" style={{ maxWidth: "420px", margin: "0 auto 24px", fontSize: "14px" }}>
            {t("wishlistEmptyDesc", "Tap the heart icon on any curated piece in the showroom to save it here for private viewing.")}
          </p>
          <Link to={`/store/${slug}`} className="btn" style={{ borderRadius: "8px" }}>
            {t("exploreCollection", "Explore Showroom Collection")}
          </Link>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "28px 24px",
        }}
      >
        {saved.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            liked
            onLike={(id) => toggle(id)}
            basePath={`/store/${slug}`}
          />
        ))}
      </div>
    </main>
  );
}
