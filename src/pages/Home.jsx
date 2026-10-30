import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { usePublishedProducts } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";
import { useShop } from "../context/ShopContext";
import { useLanguage } from "../context/LanguageContext";
import { CATEGORIES } from "../config";

export default function Home() {
  const { items, loading, error } = usePublishedProducts();
  const { ids, toggle } = useWishlist();
  const { shop } = useShop();
  const { t } = useLanguage();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cat, setCat] = useState(searchParams.get("category") || "All");
  const [gender, setGender] = useState(searchParams.get("gender") || "All");
  const [q, setQ] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setCat(searchParams.get("category") || "All");
    setGender(searchParams.get("gender") || "All");
    setQ(searchParams.get("search") || "");
  }, [searchParams]);

  function updateFilter(nextCategory) {
    const next = new URLSearchParams(searchParams);
    if (nextCategory === "All") next.delete("category");
    else next.set("category", nextCategory);
    setSearchParams(next);
  }

  function updateGender(nextGender) {
    const next = new URLSearchParams(searchParams);
    if (nextGender === "All") next.delete("gender");
    else next.set("gender", nextGender);
    setSearchParams(next);
  }

  async function like(id) {
    const ok = await toggle(id);
    if (!ok) nav("/login", { state: { from: "/" } });
  }

  const list = items || [];
  const fresh = list.filter((p) => p.isNew).slice(0, 3);
  const needle = q.trim().toLowerCase();
  const genderCategories = {
    women: ["Clothing", "Bags", "Accessories"],
    men: ["Clothing", "Shoes", "Accessories"],
  };
  const shown = list.filter((p) => {
    const matchesGender = gender === "All" || !genderCategories[gender] || genderCategories[gender].includes(p.category);
    const matchesCategory = cat === "All" || p.category === cat;
    return matchesGender && matchesCategory && `${p.title} ${p.brand || ""}`.toLowerCase().includes(needle);
  });

  return (
    <main className="page home-page">
      <section className="editorial-hero">
        <div className="editorial-hero-copy">
          <p className="eyebrow">{shop.name}</p>
          <h1>{shop.heroTitle || t("consideredCollection", "A considered collection")}</h1>
          <p className="lede">{shop.tagline}</p>
          <a href="#new-arrivals" className="btn">{t("exploreCollection", "Explore the collection")}</a>
        </div>
      </section>

      <section id="new-arrivals" className="new-arrivals-section">
        <div className="section-heading">
          <div><p className="eyebrow">{t("freshFromShowroom", "Just arrived")}</p><h2>{t("newArrivals", "New arrivals")}</h2></div>
          <div className="scroll-controls" aria-label="New arrivals controls">
            <button type="button" aria-label="Scroll new arrivals left" onClick={() => document.getElementById("new-arrivals-row")?.scrollBy({ left: -320, behavior: "smooth" })}>←</button>
            <button type="button" aria-label="Scroll new arrivals right" onClick={() => document.getElementById("new-arrivals-row")?.scrollBy({ left: 320, behavior: "smooth" })}>→</button>
          </div>
        </div>
        <div id="new-arrivals-row" className="new-arrivals-row">
          {fresh.map((p) => <ProductCard key={p.id} p={p} liked={ids.has(p.id)} onLike={like} />)}
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-heading">
        <div className="section-heading"><div><p className="eyebrow">{t("exploreByCategory", "Shop by form")}</p><h2 id="category-heading">{t("curatedDepartments", "Find your piece")}</h2></div></div>
        <div className="category-tiles">
          {CATEGORIES.map((category) => {
            const product = list.find((p) => p.category === category);
            return (
              <Link key={category} to={`/?category=${encodeURIComponent(category)}`} className="category-tile">
                {product?.images?.[0] && <img src={product.images[0]} alt="" loading="lazy" />}
                <span>{category}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="about-section">
        <p className="eyebrow">{t("theAtelierStory", "The Atelier")}</p>
        <h2>{t("aboutAtelier", "About the boutique")}</h2>
        <p>{shop.aboutText}</p>
      </section>

      <section id="all" className="catalog">
        <div className="filters">
          <div className="chips" role="group" aria-label="Category">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} className="chip" aria-pressed={cat === c} onClick={() => updateFilter(c)}>
                {c === "All" ? t("all", "All") : c}
              </button>
            ))}
          </div>
          <div className="gender-filter" role="group" aria-label="Audience">
            {["All", "women", "men"].map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={gender === g} onClick={() => updateGender(g)}>
                {g === "All" ? t("all", "All pieces") : g === "women" ? t("women", "Women") : t("men", "Men")}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={q}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) next.set("search", event.target.value);
              else next.delete("search");
              setQ(event.target.value);
              setSearchParams(next);
            }}
            placeholder={t("searchPiecesPlaceholder", "Search by name or brand")}
            aria-label="Search products"
          />
        </div>

        {loading && <p className="muted">{t("loading", "Loading the latest pieces…")}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {!loading && list.length === 0 && (
          <p className="muted">{t("catalogCuratedMsg", "Nothing here yet. Check back soon.")}</p>
        )}
        {!loading && list.length > 0 && shown.length === 0 && (
          <p className="muted">{t("noMatchingPieces", "No matches. Try another category or search.")}</p>
        )}

        <div className="grid">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} liked={ids.has(p.id)} onLike={like} />
          ))}
        </div>
      </section>
    </main>
  );
}
