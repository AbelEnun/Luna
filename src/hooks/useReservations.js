import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useReservations({ admin = false } = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const collectionRef = admin
      ? collection(db, "reservations")
      : query(collection(db, "reservations"), where("customerId", "==", user.uid));

    setLoading(true);
    setError("");
    return onSnapshot(
      collectionRef,
      (snapshot) => {
        const list = snapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setItems(list);
        setLoading(false);
      },
      (listenerError) => {
        setError(listenerError.message || "Could not load reservations.");
        setLoading(false);
      }
    );
  }, [admin, user]);

  const create = useCallback(async (product, note = "") => {
    if (!user) return false;
    await addDoc(collection(db, "reservations"), {
      customerId: user.uid,
      customerName: user.displayName || user.email || "Customer",
      customerEmail: user.email || "",
      productId: product.id,
      productTitle: product.title,
      productImage: product.images?.[0] || "",
      note: note.trim(),
      status: "requested",
      createdAt: serverTimestamp(),
    });
    return true;
  }, [user]);

  return { items, loading, error, create };
}
