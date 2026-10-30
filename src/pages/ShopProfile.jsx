import { useEffect, useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { DEFAULT_SHOP } from "../config";

export default function ShopProfile() {
  const { shop, loading, error } = useShop();
  const { show } = useToast();
  const { t } = useLanguage();
  const [form, setForm] = useState(DEFAULT_SHOP);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const fieldLabels = {
    name: t("boutiqueName", "Shop name"),
    tagline: t("curatorTagline", "Tagline"),
    logoUrl: t("logoImageAddress", "Logo image URL"),
    heroImageUrl: t("heroBannerPhotoAddress", "Hero image URL"),
    heroTitle: t("heroHeadlineTitle", "Hero title"),
    aboutText: t("brandStoryAndPhilosophy", "About text"),
    phone: t("phone", "Phone"),
    whatsapp: t("whatsApp", "WhatsApp"),
    telegram: t("telegram", "Telegram"),
    instagram: t("instagram", "Instagram"),
    email: t("email", "Email"),
    address: t("physicalShowroomAddress", "Address"),
    openingHours: t("openingHours", "Opening hours"),
    currency: t("currency", "Currency"),
    announcement: t("topAnnouncementStrip", "Announcement"),
    accentColor: t("brandAccentColor", "Accent color"),
  };

  const fields = [
    ["name", fieldLabels.name], ["tagline", fieldLabels.tagline], ["logoUrl", fieldLabels.logoUrl],
    ["heroImageUrl", fieldLabels.heroImageUrl], ["heroTitle", fieldLabels.heroTitle], ["aboutText", fieldLabels.aboutText],
    ["phone", fieldLabels.phone], ["whatsapp", fieldLabels.whatsapp], ["telegram", fieldLabels.telegram],
    ["instagram", fieldLabels.instagram], ["email", fieldLabels.email], ["address", fieldLabels.address],
    ["openingHours", fieldLabels.openingHours], ["currency", fieldLabels.currency], ["announcement", fieldLabels.announcement],
    ["accentColor", fieldLabels.accentColor]
  ];

  useEffect(() => {
    setForm({ ...DEFAULT_SHOP, ...shop });
  }, [shop]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await setDoc(doc(db, "settings", "shop"), { ...form, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
      show(t("saved", "Shop profile saved."));
      window.setTimeout(() => setSaved(false), 2400);
    } catch (exception) {
      setSaveError(exception.message || "The shop profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="shop-profile">
      <h2>{t("branding", "Shop profile")}</h2>
      {loading && <p className="muted">{t("loading", "Loading shop profile…")}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <form className="profile-form" onSubmit={save}>
        <div className="profile-fields">
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              {key === "accentColor" ? <input type="color" value={form[key] || DEFAULT_SHOP.accentColor} onChange={update(key)} /> : <input value={form[key] || ""} onChange={update(key)} />}
            </label>
          ))}
          <label>{t("brandStoryAndPhilosophy", "About text")}<textarea rows="4" value={form.aboutText || ""} onChange={update("aboutText")} /></label>
        </div>
        <aside className="profile-preview">
          <div className="profile-preview-logo">{form.logoUrl ? <img src={form.logoUrl} alt="" /> : <span>{form.name || "Atelier 22"}</span>}</div>
          <p className="preview-name">{form.name || "Your shop"}</p>
          <p>{form.tagline || "Your boutique tagline"}</p>
          {form.announcement && <div className="preview-banner">{form.announcement}</div>}
          <div className="preview-hero" style={{ backgroundImage: form.heroImageUrl ? `url(${form.heroImageUrl})` : "none" }}>
            <strong>{form.heroTitle || "Your new collection"}</strong>
          </div>
        </aside>
        {saveError && <p className="error" role="alert">{saveError}</p>}
        <div className="actions">
          <button className="btn" type="submit" disabled={saving}>{saving ? t("saving", "Saving…") : saved ? t("saved", "Saved ✓") : t("saveChanges", "Save changes")}</button>
        </div>
      </form>
    </section>
  );
}
