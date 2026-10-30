import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";

export function useTenantChats({ admin = false } = {}) {
  const { user } = useAuth();
  const { businessId } = useTenant();
  const [chats, setChats] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!businessId || !user) {
      setChats([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (businessId === "demo-atelier-22" || businessId === "sample-default") {
      const demoChats = [
        {
          id: "demo-cust-1",
          customerName: "Amina K.",
          lastMessage: "Do you have the trench in size M in store today?",
          lastMessageAt: { toMillis: () => Date.now() - 1800000 },
          unreadByBusiness: true,
          unreadByCustomer: false,
        }
      ];
      setChats(demoChats);
      setUnreadCount(admin ? 1 : 0);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (admin) {
      const q = query(collection(db, "businesses", businessId, "chats"), orderBy("lastMessageAt", "desc"));
      return onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setChats(list);
          const unread = list.filter((c) => c.unreadByBusiness).length;
          setUnreadCount(unread);
          setLoading(false);
        },
        (err) => {
          console.error("Error loading business chats:", err);
          setError(err.message || "Failed to load inbox.");
          setLoading(false);
        }
      );
    } else {
      const chatDocRef = doc(db, "businesses", businessId, "chats", user.uid);
      return onSnapshot(
        chatDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = { id: snapshot.id, ...snapshot.data() };
            setChats([data]);
            setUnreadCount(data.unreadByCustomer ? 1 : 0);
          } else {
            setChats([]);
            setUnreadCount(0);
          }
          setLoading(false);
        },
        (err) => {
          setError(err.message || "Failed to load chat status.");
          setLoading(false);
        }
      );
    }
  }, [businessId, admin, user]);

  return { chats, unreadCount, loading, error };
}
