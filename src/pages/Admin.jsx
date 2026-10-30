import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase";
import { CATEGORIES, money } from "../config";
import { useShop } from "../context/ShopContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { fileToDataUrl } from "../utils/imageHelper";

const blank = { title: "", brand: "", price: "", category: CATEGORIES[0], sizes: "", description: "", urls: "", isNew: true, soldOut: false, published: true };

export default function Admin() {
  const { shop } = useShop();
  const { show } = useToast();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState("");

  useEffect(
    () =>
      onSnapshot(
        collection(db, "products"),
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now()));
          setProducts(list);
          setLoading(false);
          setError("");
        },
        (listenerError) => {
          setError(listenerError.message || "Could not load products.");
          setLoading(false);
        }
      ),
    []
  );

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const images = form.urls.split("\n").map((s) => s.trim()).filter(Boolean);
      for (const f of files) {
        try {
          const r = ref(storage, `products/${Date.now()}-${f.name}`);
          await uploadBytes(r, f);
          images.push(await getDownloadURL(r));
        } catch {
          try {
            const dataUrl = await fileToDataUrl(f);
            images.push(dataUrl);
          } catch {}
        }
      }
      if (images.length === 0) throw new Error("Add at least one photo or image link.");

      const product = {
        title: form.title.trim(),
        brand: form.brand.trim(),
        price: Number(form.price),
        category: form.category,
        description: form.description.trim(),
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        images,
        isNew: form.isNew,
        soldOut: form.soldOut,
        published: form.published,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await setDoc(doc(db, "products", editingId), product, { merge: true });
        show(t("productUpdatedSuccess", "Product updated."));
      } else {
        await addDoc(collection(db, "products"), { ...product, createdAt: serverTimestamp() });
        show(t("productPostedSuccess", "Product posted."));
      }
      setForm(blank);
      setFiles([]);
      setEditingId("");
      e.target.reset();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  const patch = (id, data) => updateDoc(doc(db, "products", id), data);
  const edit = (product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      brand: product.brand || "",
      price: product.price,
      category: product.category,
      sizes: (product.sizes || []).join(", "),
      description: product.description || "",
      urls: (product.images || []).join("\n"),
      isNew: !!product.isNew,
      soldOut: !!product.soldOut,
      published: product.published !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const resetForm = () => {
    setEditingId("");
    setForm(blank);
    setFiles([]);
  };
  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "products", deleteTarget.id));
      setDeleteTarget(null);
      show(t("productDeleted", "Product deleted."));
    } catch (exception) {
      setErr(exception.message || "The product could not be deleted.");
    }
  };

  return (
    <main className="page">
      <h1>{t("products", "Products")}</h1>

      <form className="form admin-form" onSubmit={add}>
        <div className="form-heading">
          <h2>{editingId ? t("editProduct", "Edit product") : t("addNewShowroomPiece", "Post a new piece")}</h2>
          {editingId && <button type="button" className="link" onClick={resetForm}>{t("cancelEdit", "Cancel edit")}</button>}
        </div>
        <label>{t("productTitle", "Name")}<input value={form.title} onChange={set("title")} required /></label>
        <div className="row">
          <label>{t("designerBrand", "Brand")}<input value={form.brand} onChange={set("brand")} /></label>
          <label>{t("retailPrice", "Price")}<input type="number" min="0" value={form.price} onChange={set("price")} required /></label>
          <label>{t("category", "Category")}
            <select value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label>{t("sizesCommaSeparated", "Sizes, separated by commas")}<input value={form.sizes} onChange={set("sizes")} placeholder="S, M, L" /></label>
        <label>{t("editorialDescription", "Description")}<textarea rows="3" value={form.description} onChange={set("description")} /></label>
        <label>{t("uploadPhotos", "Photos")}
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
        </label>
        <label>{t("orImageUrls", "Or image links, one per line")}
          <textarea rows="2" value={form.urls} onChange={set("urls")} placeholder="https://…" />
        </label>
        <div className="row">
          <label className="check"><input type="checkbox" checked={form.isNew} onChange={set("isNew")} /> {t("showInJustArrived", "Show in New in")}</label>
          <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> {t("visibleInPublicStorefront", "Visible to customers")}</label>
          <label className="check"><input type="checkbox" checked={form.soldOut} onChange={(e) => setForm({ ...form, soldOut: e.target.checked })} /> {t("markAsSoldOut", "Mark as sold out")}</label>
        </div>
        {err && <p className="error" role="alert">{err}</p>}
        <div className="actions">
          <button className="btn" disabled={busy}>{busy ? t("saving", "Saving…") : editingId ? t("saveChanges", "Save changes") : t("postProduct", "Post product")}</button>
        </div>
      </form>

      <h2>{t("products", "All products")} ({products.length})</h2>
      {loading && <p className="muted">{t("loading", "Loading products…")}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <ul className="admin-list">
        {products.map((p) => (
          <li key={p.id}>
            <img src={p.images?.[0]} alt="" />
            <div className="grow">
              <strong>{p.title}</strong>
              <span className="muted"> {p.category} · {money(p.price, shop.currency)}</span>
            </div>
            <label className="check"><input type="checkbox" checked={!!p.isNew} onChange={(e) => patch(p.id, { isNew: e.target.checked })} /> {t("newBadge", "New")}</label>
            <label className="check"><input type="checkbox" checked={!!p.published} onChange={(e) => patch(p.id, { published: e.target.checked })} /> {t("available", "Visible")}</label>
            <label className="check"><input type="checkbox" checked={!!p.soldOut} onChange={(e) => patch(p.id, { soldOut: e.target.checked })} /> {t("soldOutBadge", "Sold out")}</label>
            <button className="link" onClick={() => edit(p)}>{t("edit", "Edit")}</button>
            <button className="link danger" onClick={() => setDeleteTarget(p)}>{t("delete", "Delete")}</button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!deleteTarget}
        title={`${t("delete", "Delete")} “${deleteTarget?.title || "this product"}”?`}
        description={t("confirmDeleteProductDesc", "This action cannot be undone.")}
        confirmLabel={t("delete", "Delete product")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </main>
  );
}
