import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, Sparkles, MessageSquare,
  ShieldCheck, Clock, ArrowRight, Store, SlidersHorizontal, X
} from "lucide-react";
import ProductCard from "../../components/ProductCard";
import { useTenant } from "../../context/TenantContext";
import { useTenantProducts } from "../../hooks/useTenantProducts";
import { useTenantWishlist } from "../../hooks/useTenantWishlist";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../config";

const FALLBACK_HERO = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85";

export default function StoreHome() {
  const { business, slug, isOwner } = useTenant();
  const { items, loading, error } = useTenantProducts({ publishedOnly: true });
  const { ids, toggle } = useTenantWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const arrivalsRef = useRef(null);

  const [cat, setCat] = useState(searchParams.get("category") || "All");
  const [gender, setGender] = useState(searchParams.get("gender") || "All");
  const [q, setQ] = useState(searchParams.get("search") || "");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [slug]);

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

  function clearSearch() {
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    setQ("");
    setSearchParams(next);
  }

  async function handleLike(id) {
    const ok = await toggle(id);
    if (!ok) navigate("/login", { state: { from: `/store/${slug}` } });
  }

  const list = items || [];

  // Extract only available categories that exist in this boutique's catalog
  const availableCategories = useMemo(() => {
    const cats = new Set();
    list.forEach((p) => {
      if (p.category && typeof p.category === "string" && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats);
  }, [list]);

  function handleCategoryClick(category) {
    updateFilter(category);
    setTimeout(() => {
      const catalogEl = document.getElementById("catalog");
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  }

  const fresh = list.filter((p) => p.isNew).slice(0, 6);
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

  const scrollArrivals = (direction) => {
    if (!arrivalsRef.current) return;
    const amount = direction === "left" ? -340 : 340;
    arrivalsRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const heroImage = business?.heroImageUrl || FALLBACK_HERO;

  return (
    <main className="showroom-home">
      {/* ── LUXURY EDITORIAL HERO ── */}
      <section
        className="luxury-hero"
        style={{
          position: "relative",
          minHeight: "78vh",
          display: "flex",
          alignItems: "flex-end",
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#ffffff",
          padding: "60px clamp(20px, 6vw, 80px)",
        }}
      >
        <div style={{ maxWidth: "780px", position: "relative", zIndex: 2 }}>
          {/* Eyebrow badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "99px",
              background: "rgba(255, 255, 255, 0.16)",
              backdropFilter: "blur(12px)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#ffffff",
              marginBottom: "18px",
            }}
          >
            <Sparkles size={13} color="#fcd34d" />
            {business?.category || "Curated Boutique Showroom"}
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(42px, 7vw, 76px)",
              lineHeight: 1.05,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
              color: "#ffffff",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {business?.heroTitle || "A Considered Collection"}
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: "580px",
              margin: "0 0 32px",
              fontWeight: 400,
            }}
          >
            {business?.tagline || "Discover private showroom reservations, hand-selected seasonal drops, and concierge styling."}
          </p>

          {/* Action Row */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <a
              href="#catalog"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#18392f",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              {t("exploreCollection", "Explore Collection")} <ArrowRight size={15} />
            </a>

            {isOwner ? (
              <Link
                to={`/portal/${slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.28)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)")}
              >
                <span>{t("businessPortal", "Business Portal")}</span> <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to={`/store/${slug}/chat`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.22)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
              >
                <MessageSquare size={15} /> {t("conciergeStyling", "Concierge Styling")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── VALUE PILLARS STRIP ── */}
      <section
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "20px clamp(20px, 6vw, 80px)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center" }}>
              <Sparkles size={18} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{t("handCuratedCatalog", "Hand-Curated Catalog")}</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{t("authenticDesignerDrops", "100% authentic designer drops")}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center" }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{t("privateReservations", "Private Reservations")}</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{t("holdItemsFitting", "Hold items for in-store fitting")}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(24,57,47,0.08)", color: "#18392f", display: "grid", placeItems: "center" }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{t("personalConcierge", "Personal Concierge")}</strong>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{t("directChatCurators", "Direct chat with boutique staff")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SHOWROOM BODY CONTAINER ── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px clamp(20px, 6vw, 80px) 100px" }}>

        {/* ── JUST ARRIVED SECTION ── */}
        {fresh.length > 0 && (
          <section style={{ marginBottom: "64px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#18392f", display: "block", marginBottom: "4px" }}>
                  {t("freshFromShowroom", "Fresh From Showroom")}
                </span>
                <h2 style={{ fontFamily: "var(--display)", fontSize: "32px", margin: 0, fontWeight: 500 }}>
                  {t("newArrivals", "New Arrivals")}
                </h2>
              </div>

              {/* Refined Navigation Controls */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => scrollArrivals("left")}
                  aria-label="Previous products"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#0f172a",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#18392f"; e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#0f172a"; }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollArrivals("right")}
                  aria-label="Next products"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#0f172a",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#18392f"; e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.color = "#0f172a"; }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div
              ref={arrivalsRef}
              style={{
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: "clamp(240px, 30%, 300px)",
                gap: "20px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: "16px",
                scrollbarWidth: "none",
              }}
            >
              {fresh.map((p) => (
                <div key={p.id} style={{ scrollSnapAlign: "start" }}>
                  <ProductCard
                    p={p}
                    liked={ids.has(p.id)}
                    onLike={handleLike}
                    basePath={`/store/${slug}`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SHOP BY CATEGORY (Curated Departments) ── */}
        {availableCategories.length > 0 && (
          <section style={{ marginBottom: "64px" }}>
            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#18392f", display: "block", marginBottom: "4px" }}>
                {t("exploreByCategory", "Explore By Category")}
              </span>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "32px", margin: 0, fontWeight: 500 }}>
                {t("curatedDepartments", "Curated Departments")}
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 240px))",
                gap: "16px",
              }}
            >
              {availableCategories.map((category) => {
                const categoryProducts = list.filter((p) => p.category === category);
                const count = categoryProducts.length;
                const productWithImage = categoryProducts.find((p) => p.images && p.images.length > 0);
                const img = productWithImage?.images?.[0] || FALLBACK_HERO;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      height: "210px",
                      width: "100%",
                      maxWidth: "240px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "flex-start",
                      padding: "16px",
                      textAlign: "left",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
                    }}
                  >
                    <img
                      src={img}
                      alt={category}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.05) 20%, rgba(15,23,42,0.85) 100%)",
                      }}
                    />
                    <div style={{ position: "relative", zIndex: 2 }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.8)",
                          marginBottom: "2px",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {count} {count === 1 ? t("piece", "piece") : t("pieces", "pieces")}
                      </span>
                      <h3
                        style={{
                          fontFamily: "var(--display)",
                          fontSize: "20px",
                          color: "#ffffff",
                          fontWeight: 600,
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        {category}
                      </h3>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "6px",
                          fontSize: "12px",
                          color: "#ffffff",
                          fontWeight: 600,
                        }}
                      >
                        {t("exploreDepartment", "Explore")} <ArrowRight size={12} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CONCIERGE SPOTLIGHT BANNER (Client facing only) ── */}
        {!isOwner && (
          <section
            style={{
              background: "linear-gradient(135deg, #18392f 0%, #0d231d 100%)",
              borderRadius: "18px",
              padding: "48px 40px",
              color: "#ffffff",
              marginBottom: "72px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
              alignItems: "center",
              boxShadow: "0 16px 40px rgba(24,57,47,0.15)",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#fcd34d", fontWeight: 700 }}>
                {t("conciergeStyling", "Showroom Concierge Service")}
              </span>
              <h3 style={{ fontFamily: "var(--display)", fontSize: "clamp(26px, 3.5vw, 36px)", margin: "8px 0 14px", fontWeight: 500, color: "#ffffff" }}>
                {t("conciergeServiceTitle", "Private Reservations & Personal Inquiries")}
              </h3>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "15px", lineHeight: 1.6, margin: 0, maxWidth: "500px" }}>
                {t("conciergeServiceDesc", "Interested in bespoke fittings, item holds, or sizing details? Chat directly with the boutique curators through our private client channel.")}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <Link
                to={`/store/${slug}/chat`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 26px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#18392f",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}
              >
                <MessageSquare size={16} /> {t("openConciergeChat", "Open Concierge Chat")}
              </Link>
              <Link
                to={`/store/${slug}/reservations`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 22px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                {t("reservations", "My Reservations")}
              </Link>
            </div>
          </section>
        )}

        {/* ── CATALOG SHOWROOM GRID ── */}
        <section id="catalog" style={{ scrollMarginTop: "90px" }}>
          {/* Header & Filter Controls */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#18392f", display: "block", marginBottom: "4px" }}>
                  {t("completeShowroom", "Complete Showroom")}
                </span>
                <h2 style={{ fontFamily: "var(--display)", fontSize: "34px", margin: 0, fontWeight: 500 }}>
                  {t("theCollection", "The Collection")}
                </h2>
              </div>
              <span style={{ fontSize: "14px", color: "#64748b" }}>
                {t("showing", "Showing")} <strong>{shown.length}</strong> {shown.length === 1 ? t("piece", "piece") : t("pieces", "pieces")}
              </span>
            </div>

            {/* Filter Bar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              {/* Category Pills */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {["All", ...(availableCategories.length > 0 ? availableCategories : CATEGORIES)].map((c) => {
                  const active = cat === c;
                  const label = c === "All" ? t("all", "All") : c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateFilter(c)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "99px",
                        fontSize: "13px",
                        fontWeight: active ? 700 : 500,
                        border: active ? "1px solid #18392f" : "1px solid #e2e8f0",
                        background: active ? "#18392f" : "#f8fafc",
                        color: active ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Gender & Search */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                {/* Gender toggle */}
                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px" }}>
                  {["All", "women", "men"].map((g) => {
                    const active = gender === g;
                    const gLabel = g === "All" ? t("all", "All") : (g === "women" ? t("women", "Women") : t("men", "Men"));
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateGender(g)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: active ? 700 : 500,
                          border: "none",
                          background: active ? "#ffffff" : "transparent",
                          color: active ? "#0f172a" : "#64748b",
                          boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {gLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Search Bar */}
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => {
                      const next = new URLSearchParams(searchParams);
                      if (e.target.value) next.set("search", e.target.value);
                      else next.delete("search");
                      setQ(e.target.value);
                      setSearchParams(next);
                    }}
                    placeholder={t("searchCatalogPlaceholder", "Search catalog…")}
                    style={{
                      padding: "8px 30px 8px 34px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      fontSize: "13px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#94a3b8",
                        padding: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Catalog State & Grid */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#64748b", fontSize: "15px" }}>{t("loading", "Loading curated pieces…")}</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "16px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", marginBottom: "24px" }}>
              {error}
            </div>
          )}

          {!loading && list.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Store size={40} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "18px" }}>{t("catalogCuratedMsg", "Showroom catalog being curated")}</h3>
              <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>{t("checkBackShortly", "Check back shortly for new collections.")}</p>
            </div>
          )}

          {!loading && list.length > 0 && shown.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Search size={36} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "18px" }}>{t("noMatchingPieces", "No matching pieces found")}</h3>
              <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: "14px" }}>{t("tryAdjustingFilters", "Try adjusting your filters or search keyword.")}</p>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setCat("All");
                  setGender("All");
                  clearSearch();
                }}
                style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "13px" }}
              >
                {t("resetAllFilters", "Reset All Filters")}
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "28px 24px",
            }}
          >
            {shown.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                liked={ids.has(p.id)}
                onLike={handleLike}
                basePath={`/store/${slug}`}
              />
            ))}
          </div>
        </section>

        {/* ── THE ATELIER STORY ── */}
        {business?.aboutText && (
          <section
            style={{
              marginTop: "80px",
              paddingTop: "60px",
              borderTop: "1px solid #e2e8f0",
              maxWidth: "760px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#18392f", display: "block", marginBottom: "8px" }}>
              {t("theAtelierStory", "The Atelier Story")}
            </span>
            <h2 style={{ fontFamily: "var(--display)", fontSize: "36px", margin: "0 0 16px", fontWeight: 500 }}>
              {t("aboutAtelier", "About")} {business?.name || "Our Atelier"}
            </h2>
            <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#475569" }}>
              {business.aboutText}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
