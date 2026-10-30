import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowUpRight, Eye } from "lucide-react";
import { money } from "../config";
import { useTenant } from "../context/TenantContext";
import { useLanguage } from "../context/LanguageContext";

export default function ProductCard({ p, liked, onLike, basePath = "" }) {
  const { business, isOwner } = useTenant();
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const primaryImage = p.images?.[0];
  const secondaryImage = p.images?.[1] || primaryImage;
  const productLink = basePath ? `${basePath}/product/${p.id}` : `/product/${p.id}`;

  return (
    <article
      className="card luxury-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid #e9ecef",
        boxShadow: hovered ? "0 16px 36px rgba(0,0,0,0.08)" : "0 2px 10px rgba(0,0,0,0.02)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-4px)" : "none",
        position: "relative",
      }}
    >
      {/* Media container */}
      <div
        className="card-media"
        style={{
          position: "relative",
          aspectRatio: "3 / 4",
          overflow: "hidden",
          background: "#f1f3f2",
        }}
      >
        <Link to={productLink} tabIndex={-1} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
          <img
            src={hovered && secondaryImage ? secondaryImage : primaryImage}
            alt={p.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: hovered ? "scale(1.06)" : "scale(1)",
            }}
          />
        </Link>

        {/* Floating Heart / Wishlist button (hidden for showroom owner) */}
        {!isOwner && onLike && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLike(p.id);
            }}
            aria-pressed={liked}
            aria-label={liked ? `Remove ${p.title} from wishlist` : `Save ${p.title} to wishlist`}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: liked ? "#ffffff" : "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              transform: liked ? "scale(1.08)" : "scale(1)",
              zIndex: 3,
            }}
          >
            <Heart
              size={16}
              fill={liked ? "#dc2626" : "none"}
              color={liked ? "#dc2626" : "#1e2421"}
              style={{ transition: "all 0.15s ease" }}
            />
          </button>
        )}

        {/* Status badges */}
        <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 2 }}>
          {p.isNew && (
            <span
              style={{
                padding: "3px 9px",
                borderRadius: "6px",
                background: "rgba(24, 57, 47, 0.9)",
                backdropFilter: "blur(6px)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {t("newBadge", "New")}
            </span>
          )}
          {p.soldOut && (
            <span
              style={{
                padding: "3px 9px",
                borderRadius: "6px",
                background: "rgba(220, 38, 38, 0.92)",
                backdropFilter: "blur(6px)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {t("soldOutBadge", "Sold out")}
            </span>
          )}
        </div>

        {/* Hover overlay quick action */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            right: "12px",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.25s ease",
            zIndex: 3,
          }}
        >
          <Link
            to={productLink}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(8px)",
              color: "#18392f",
              fontSize: "12.5px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <Eye size={14} /> {t("details", "View Details")}
          </Link>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        {p.brand && (
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#64748b",
              fontWeight: 600,
              marginBottom: "4px",
            }}
          >
            {p.brand}
          </span>
        )}

        <Link
          to={productLink}
          style={{
            fontFamily: "var(--body)",
            fontSize: "15px",
            fontWeight: 600,
            color: "#0f172a",
            textDecoration: "none",
            lineHeight: 1.35,
            marginBottom: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.title}
        </Link>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: "4px" }}>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#18392f",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {money(p.price, business?.currency)}
          </span>

          {p.category && (
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {p.category}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
