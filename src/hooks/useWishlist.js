import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    return onSnapshot(
      collection(db, "users", user.uid, "wishlist"),
      (snap) => {
        setIds(new Set(snap.docs.map((d) => d.id)));
        setLoading(false);
        setError("");
      },
      (listenerError) => {
        setError(listenerError.message || "Could not load your wishlist.");
        setLoading(false);
      }
    );
  }, [user]);

  // Returns false when the visitor needs to sign in first.
  const toggle = useCallback(
    async (productId) => {
      if (!user) return false;
      const ref = doc(db, "users", user.uid, "wishlist", productId);
      if (ids.has(productId)) await deleteDoc(ref);
      else await setDoc(ref, { createdAt: serverTimestamp() });
      return true;
    },
    [user, ids]
  );

  return { ids, loading, error, toggle };
}
