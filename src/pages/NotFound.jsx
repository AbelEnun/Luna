import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="page narrow">
      <p className="eyebrow">404</p>
      <h1>{t("pieceNotFound", "This page is not in the collection.")}</h1>
      <p className="muted">{t("noMatchingPieces", "The page you requested could not be found.")}</p>
      <Link to="/" className="btn">{t("returnToShowroom", "Return to the boutique")}</Link>
    </main>
  );
}
