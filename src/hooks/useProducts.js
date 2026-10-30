import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

const ms = (p) => p.createdAt?.toMillis?.() ?? Date.now();

// Published products, newest first. Sorting happens here so no Firestore index is needed.
export function usePublishedProducts() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "products"), where("published", "==", true)),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => ms(b) - ms(a));
          setItems(list);
          setError("");
        },
        (listenerError) => {
          setError(listenerError.message || "Could not load products.");
          setItems([]);
        }
      ),
    []
  );

  return { items, loading: items === null, error };
}
