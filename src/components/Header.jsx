import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUnread } from "../hooks/useUnread";
import { useShop } from "../context/ShopContext";
import { useLanguage } from "../context/LanguageContext";
import AccountMenu from "./AccountMenu";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { user, isAdmin } = useAuth();
  const { shop } = useShop();
  const { count: unread } = useUnread();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  function search(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/?search=${encodeURIComponent(value)}` : "/");
    setSearchOpen(false);
    setMobileOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-main">
        <button className="mobile-menu-button" type="button" aria-label="Open menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
          {t("menu", "Menu")}
        </button>
        <Link to="/" className="brand" aria-label={`${shop.name} home`}>
          {shop.logoUrl ? <img src={shop.logoUrl} alt="" /> : <span>{shop.name}</span>}
        </Link>
        <nav className={`main-nav ${mobileOpen ? "open" : ""}`} aria-label="Main navigation">
          <button className="mobile-close" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            {t("close", "Close")}
          </button>
          <NavLink to="/" end onClick={() => setMobileOpen(false)}>{t("newArrivals", "New in")}</NavLink>
          {!isAdmin && <NavLink to="/wishlist" onClick={() => setMobileOpen(false)}>{t("wishlist", "Wishlist")}</NavLink>}
          {!isAdmin && <NavLink to="/chat" onClick={() => setMobileOpen(false)}>{t("chat", "Chat")} {unread > 0 && <span className="dot customer-unread" aria-label={`${unread} unread`} />}</NavLink>}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          <button type="button" className="search-trigger" aria-expanded={searchOpen} onClick={() => setSearchOpen((value) => !value)}>
            {t("search", "Search")}
          </button>
          {user ? <AccountMenu /> : <Link to="/login" className="account-link">{t("signIn", "Sign in")}</Link>}
        </div>
      </div>
      {searchOpen && (
        <form className="header-search" role="search" onSubmit={search}>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPiecesPlaceholder", "Search by name or brand")} aria-label="Search products" />
          <button type="submit" className="btn">{t("search", "Search")}</button>
        </form>
      )}
      {mobileOpen && <button className="drawer-backdrop" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    </header>
  );
}
