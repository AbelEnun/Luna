import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";

export function useTenantWishlist() {
  const { user } = useAuth();
  const { businessId } = useTenant();
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !businessId) {
      setIds(new Set());
      setLoading(false);
      return;
    }

    if (businessId === "demo-atelier-22" || businessId === "sample-default") {
      setIds(new Set(["sample-1"]));
      setLoading(false);
      return;
    }

    setLoading(true);
    const wishlistCol = collection(db, "users", user.uid, "wishlist");
    const q = query(wishlistCol, where("businessId", "==", businessId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const set = new Set(snap.docs.map((d) => d.data().productId || d.id));
        setIds(set);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error loading wishlist:", err);
        setError(err.message || "Could not load wishlist.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, businessId]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) return false;
      if (!businessId) return true;

      const docId = `${businessId}_${productId}`;
      const itemRef = doc(db, "users", user.uid, "wishlist", docId);

      if (ids.has(productId)) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, {
          businessId,
          productId,
          createdAt: serverTimestamp(),
        });
      }
      return true;
    },
    [user, businessId, ids]
  );

  return { ids, loading, error, toggle };
}
