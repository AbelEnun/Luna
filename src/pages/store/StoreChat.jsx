import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { useLanguage } from "../../context/LanguageContext";
import ChatThread from "../../components/ChatThread";

export default function StoreChat() {
  const { user } = useAuth();
  const { business, businessId, slug, isOwner } = useTenant();
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const pid = params.get("product");
  const [attach, setAttach] = useState(null);

  useEffect(() => {
    if (!pid || !businessId) {
      setAttach(null);
      return;
    }

    getDoc(doc(db, "businesses", businessId, "products", pid))
      .then((s) => {
        if (s.exists()) {
          setAttach({ id: s.id, title: s.data().title, image: s.data().images?.[0] || "" });
        }
      })
      .catch(() => {});
  }, [pid, businessId]);

  // If the showroom owner or super admin views this, prevent them from chatting with themselves
  if (isOwner) {
    return (
      <main className="page narrow center" style={{ padding: "80px 24px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "32px", marginBottom: "12px" }}>
          {t("ownerShowroomMode", "Showroom Owner Mode")}
        </h1>
        <p className="muted" style={{ maxWidth: "460px", margin: "0 auto 24px" }}>
          {t("ownerChatDesc", "You are the owner of this boutique. Customer inquiries are handled through your Business Operations Portal.")}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link to={`/portal/${slug}/inbox`} className="btn">
            {t("openCustomerInbox", "Open Customer Inbox")} →
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
        <h1>{t("chatAboutPiece", "Chat with")} {business?.name || "Boutique"}</h1>
        <p className="muted">{t("conciergeServiceDesc", "Please sign in so the atelier team can reply directly to your account.")}</p>
        <div style={{ marginTop: "24px" }}>
          <Link
            to="/login"
            state={{ from: `/store/${slug}/chat${pid ? `?product=${pid}` : ""}` }}
            className="btn"
          >
            {t("signIn", "Sign In")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <div className="section-heading" style={{ marginBottom: "16px" }}>
        <div>
          <span className="eyebrow">{business?.name || "Boutique"} {t("chat", "Concierge")}</span>
          <h1 style={{ margin: "4px 0" }}>{t("chat", "Live Showroom Chat")}</h1>
        </div>
      </div>

      <ChatThread
        businessId={businessId}
        chatId={user.uid}
        role="customer"
        customerName={user.displayName || user.email}
        attach={attach}
        onClearAttach={() => setParams({})}
        slug={slug}
      />
    </main>
  );
}
