import { useState } from "react";
import { useShop } from "../context/ShopContext";
import { useLanguage } from "../context/LanguageContext";

export default function AnnouncementBar() {
  const { shop } = useShop();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(true);

  if (!visible || !shop.announcement) return null;
  return (
    <div className="announcement-bar">
      <p>{shop.announcement}</p>
      <button type="button" aria-label="Dismiss announcement" onClick={() => setVisible(false)}>
        {t("close", "Dismiss")}
      </button>
    </div>
  );
}
