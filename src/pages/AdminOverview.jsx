import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useUnread } from "../hooks/useUnread";
import { useLanguage } from "../context/LanguageContext";

export default function AdminOverview() {
  const [products, setProducts] = useState([]);
  const [chats, setChats] = useState([]);
  const { count: unread } = useUnread();
  const { t } = useLanguage();

  useEffect(() => {
    const productUnsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(all);
    });
    const chatUnsub = onSnapshot(
      query(collection(db, "chats"), where("lastMessageAt", "!=", null)),
      (snapshot) => setChats(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 5))
    );
    return () => {
      productUnsub();
      chatUnsub();
    };
  }, []);

  const visible = products.filter((product) => product.published !== false).length;
  const soldOut = products.filter((product) => product.soldOut || product.status === "sold-out").length;

  return (
    <section className="admin-overview">
      <h2>{t("overview", "Overview")}</h2>
      <div className="overview-grid">
        <div className="overview-card"><span>{t("totalCatalogPieces", "Total products")}</span><strong>{products.length}</strong></div>
        <div className="overview-card"><span>{t("liveOnShowroom", "Visible products")}</span><strong>{visible}</strong></div>
        <div className="overview-card"><span>{t("soldOutBadge", "Sold out")}</span><strong>{soldOut}</strong></div>
        <div className="overview-card"><span>{t("unreadConciergeMessages", "Unread chats")}</span><strong>{unread}</strong></div>
      </div>
      <h3>{t("recentCustomerChats", "Newest chats")}</h3>
      {chats.length === 0 ? (
        <p className="muted">{t("noCustomerConversationsYet", "No conversations yet.")}</p>
      ) : (
        <ul className="overview-list">
          {chats.map((chat) => (
            <li key={chat.id}>
              <span>{chat.customerName || t("userRoleCustomer", "Customer")}</span>
              <span className="clip">{chat.lastMessage || "New message"}</span>
              <Link to={`/admin/inbox?chat=${chat.id}`}>{t("details", "Open")}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
