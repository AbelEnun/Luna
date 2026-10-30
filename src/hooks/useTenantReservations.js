import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, doc, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";

export function useTenantReservations({ admin = false } = {}) {
  const { user } = useAuth();
  const { businessId } = useTenant();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!businessId || (!admin && !user)) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Demo store fallback
    if (businessId === "demo-atelier-22" || businessId === "sample-default") {
      setItems([
        {
          id: "res-demo-1",
          customerName: "Bethlehem T.",
          customerEmail: "bethlehem@example.com",
          productId: "sample-1",
          productTitle: "Silk Organza Trench",
          productImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
          size: "M",
          status: "requested",
          note: "Fitting requested for Friday afternoon at 4pm.",
          createdAt: { toMillis: () => Date.now() - 3600000 },
        },
        {
          id: "res-demo-2",
          customerName: "Dawit M.",
          customerEmail: "dawit@example.com",
          productId: "sample-2",
          productTitle: "Sculpted Nappa Loafer",
          productImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80",
          size: "42",
          status: "confirmed",
          note: "Gift packaging requested.",
          createdAt: { toMillis: () => Date.now() - 14400000 },
        }
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const colRef = collection(db, "businesses", businessId, "reservations");
    const q = admin ? colRef : query(colRef, where("customerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading reservations:", err);
        setError(err.message || "Could not load reservations.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessId, admin, user]);

  const create = useCallback(
    async (product, note = "", size = "") => {
      if (!user || !businessId) return false;
      await addDoc(collection(db, "businesses", businessId, "reservations"), {
        customerId: user.uid,
        customerName: user.displayName || user.email || "Customer",
        customerEmail: user.email || "",
        productId: product.id,
        productTitle: product.title,
        productImage: product.images?.[0] || "",
        productPrice: product.price || 0,
        size: size || "",
        note: note.trim(),
        status: "requested",
        createdAt: serverTimestamp(),
      });
      return true;
    },
    [user, businessId]
  );

  const updateStatus = useCallback(
    async (reservationId, status) => {
      if (!businessId) return;
      await updateDoc(doc(db, "businesses", businessId, "reservations", reservationId), {
        status,
        updatedAt: serverTimestamp(),
      });
    },
    [businessId]
  );

  return { items, loading, error, create, updateStatus };
}
