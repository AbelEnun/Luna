import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Owner: number of chats waiting for a reply. Customer: 1 if the owner has replied.
export function useUnread() {
  const { user, isAdmin } = useAuth();
  const [n, setN] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setN(0);
      return;
    }
    if (isAdmin) {
      return onSnapshot(
        query(collection(db, "chats"), where("unreadByAdmin", "==", true)),
        (snapshot) => {
          setN(snapshot.size);
          setError("");
        },
        (listenerError) => setError(listenerError.message || "Could not load unread chats.")
      );
    }
    return onSnapshot(
      doc(db, "chats", user.uid),
      (snapshot) => {
        setN(snapshot.data()?.unreadByCustomer ? 1 : 0);
        setError("");
      },
      (listenerError) => setError(listenerError.message || "Could not load chat status.")
    );
  }, [user, isAdmin]);

  return { count: n, error };
}
