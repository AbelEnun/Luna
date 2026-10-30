import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import ChatThread from "../components/ChatThread";

export default function AdminInbox() {
  const { t } = useLanguage();
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "chats"), orderBy("lastMessageAt", "desc")),
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setChats(list);
          setActive((current) => current ?? list[0]?.id ?? null);
          setLoading(false);
          setError("");
        },
        (listenerError) => {
          setError(listenerError.message || "Could not load the inbox.");
          setLoading(false);
        }
      ),
    []
  );

  return (
    <main className="page">
      <h1>{t("inbox", "Inbox")}</h1>
      {chats.length === 0 && <p className="muted">{t("noCustomerConversationsYet", "No conversations yet. They appear when a customer sends a message.")}</p>}
      {chats.length > 0 && (
        <div className="inbox">
          <ul className="threads">
            {chats.map((c) => (
              <li key={c.id}>
                <button className={`thread ${active === c.id ? "on" : ""}`} onClick={() => setActive(c.id)}>
                  <strong>{c.customerName || t("userRoleCustomer", "Customer")}</strong>
                  {c.unreadByAdmin && <span className="dot" aria-label="Unread" />}
                  <span className="muted clip">{c.lastMessage}</span>
                </button>
              </li>
            ))}
          </ul>
          {active && <ChatThread chatId={active} role="admin" />}
        </div>
      )}
    </main>
  );
}
