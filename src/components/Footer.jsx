import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { useLanguage } from "../context/LanguageContext";

const externalLink = (value, label) => {
  if (!value) return null;
  if (/^(https?:)?\/\//.test(value) || value.startsWith("mailto:")) return { href: value, label };
  return null;
};

export default function Footer() {
  const { shop } = useShop();
  const { t } = useLanguage();
  const contact = [
    shop.phone && { label: shop.phone, href: `tel:${shop.phone.replace(/[^+\d]/g, "")}` },
    shop.whatsapp && { label: "WhatsApp", href: shop.whatsapp },
    shop.telegram && { label: "Telegram", href: shop.telegram },
    shop.instagram && { label: "Instagram", href: shop.instagram },
    shop.email && { label: shop.email, href: `mailto:${shop.email}` },
  ].filter(Boolean);

  return (
    <footer className="site-footer">
      <div>
        <Link to="/" className="footer-brand">{shop.name}</Link>
        <p>{shop.aboutText}</p>
      </div>
      <div>
        <h2>{t("contactDetails", "Contact")}</h2>
        {contact.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>)}
        {shop.address && <p className="footer-address">{shop.address}</p>}
        {shop.openingHours && <p className="footer-address">{shop.openingHours}</p>}
      </div>
      <nav aria-label="Footer navigation">
        <h2>{t("exploreDepartment", "Explore")}</h2>
        <Link to="/?category=Clothing">{t("newArrivals", "New in")}</Link>
        <Link to="/wishlist">{t("wishlist", "Wishlist")}</Link>
        <Link to="/chat">{t("chatAboutPiece", "Chat with us")}</Link>
      </nav>
    </footer>
  );
}
