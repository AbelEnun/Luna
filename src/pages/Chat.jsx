import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ChatThread from "../components/ChatThread";

export default function Chat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const pid = params.get("product");
  const [attach, setAttach] = useState(null);

  useEffect(() => {
    if (!pid) {
      setAttach(null);
      return;
    }
    getDoc(doc(db, "products", pid))
      .then((s) => {
        if (s.exists()) setAttach({ id: s.id, title: s.data().title, image: s.data().images?.[0] || "" });
      })
      .catch(() => {});
  }, [pid]);

  return (
    <main className="page narrow">
      <h1>{t("chatAboutPiece", "Chat with the boutique")}</h1>
      <ChatThread
        chatId={user.uid}
        role="customer"
        customerName={user.displayName || user.email}
        attach={attach}
        onClearAttach={() => setParams({})}
      />
    </main>
  );
}
