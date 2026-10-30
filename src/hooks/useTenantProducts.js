import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useTenant } from "../context/TenantContext";
import { fileToDataUrl } from "../utils/imageHelper";

export function useTenantProducts({ publishedOnly = false } = {}) {
  const { businessId } = useTenant();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!businessId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, "businesses", businessId, "products");
    const q = publishedOnly ? query(colRef, where("published", "==", true)) : colRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now()));
        setItems(list);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error fetching tenant products:", err);
        setError(err.message || "Failed to load products.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [businessId, publishedOnly]);

  const addProduct = useCallback(
    async (formData, uploadedFiles = []) => {
      if (!businessId) throw new Error("No business selected.");

      const imageUrls = (formData.urls || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const file of uploadedFiles) {
        try {
          const fileRef = ref(storage, `businesses/${businessId}/${Date.now()}-${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          imageUrls.push(url);
        } catch (storageErr) {
          console.warn("Storage upload bypassed (saving as compressed image):", storageErr);
          try {
            const dataUrl = await fileToDataUrl(file);
            imageUrls.push(dataUrl);
          } catch (compressErr) {
            console.error("Image conversion failed:", compressErr);
          }
        }
      }

      if (imageUrls.length === 0) {
        throw new Error("Please add at least one product photo or image URL.");
      }

      const productData = {
        title: formData.title.trim(),
        brand: formData.brand.trim() || "",
        price: Number(formData.price) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 1,
        sku: formData.sku?.trim() || "",
        category: formData.category || "Clothing",
        description: formData.description.trim() || "",
        sizes: (formData.sizes || "").split(",").map((s) => s.trim()).filter(Boolean),
        images: imageUrls,
        isNew: !!formData.isNew,
        soldOut: !!formData.soldOut,
        published: formData.published !== false,
        updatedAt: serverTimestamp(),
      };

      if (formData.editingId) {
        await updateDoc(doc(db, "businesses", businessId, "products", formData.editingId), productData);
      } else {
        await addDoc(collection(db, "businesses", businessId, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }
    },
    [businessId]
  );

  const updateProduct = useCallback(
    async (productId, updates) => {
      if (!businessId) return;
      await updateDoc(doc(db, "businesses", businessId, "products", productId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },
    [businessId]
  );

  const deleteProduct = useCallback(
    async (productId) => {
      if (!businessId) return;
      await deleteDoc(doc(db, "businesses", businessId, "products", productId));
    },
    [businessId]
  );

  return { items, loading, error, addProduct, updateProduct, deleteProduct, isDemo: false };
}
