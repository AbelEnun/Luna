import { useState } from "react";
import { Plus, Edit, Trash2, Image, AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import { useTenantProducts } from "../../hooks/useTenantProducts";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES, money } from "../../config";
import ConfirmDialog from "../../components/ConfirmDialog";

const BLANK_FORM = {
  title: "",
  brand: "",
  price: "",
  costPrice: "",
  stockQuantity: "1",
  sku: "",
  category: CATEGORIES[0],
  sizes: "",
  description: "",
  urls: "",
  isNew: true,
  soldOut: false,
  published: true,
  editingId: "",
};

export default function PortalProducts() {
  const { business } = useTenant();
  const { items: products, loading, error, addProduct, updateProduct, deleteProduct } = useTenantProducts({ publishedOnly: false });
  const { show } = useToast();
  const { t } = useLanguage();

  const [form, setForm] = useState(BLANK_FORM);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const set = (key) => (e) => {
    setForm((current) => ({
      ...current,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  };

  const handleEdit = (product) => {
    setForm({
      title: product.title,
      brand: product.brand || "",
      price: product.price || "",
      costPrice: product.costPrice || "",
      stockQuantity: product.stockQuantity || "1",
      sku: product.sku || "",
      category: product.category || CATEGORIES[0],
      sizes: (product.sizes || []).join(", "),
      description: product.description || "",
      urls: (product.images || []).join("\n"),
      isNew: !!product.isNew,
      soldOut: !!product.soldOut,
      published: product.published !== false,
      editingId: product.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(BLANK_FORM);
    setFiles([]);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      show("Demo mode: register your own business to add products.", "error");
      return;
    }
    setBusy(true);
    setFormError("");

    try {
      await addProduct(form, files);
      show(form.editingId ? "Product updated successfully." : "Product posted to showroom.");
      resetForm();
    } catch (err) {
      setFormError(err.message || "Failed to save product.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      show("Product deleted.");
      setDeleteTarget(null);
    } catch (err) {
      show(err.message || "Could not delete product.", "error");
    }
  };

  return (
    <div className="portal-products-page">
      <div className="portal-page-header">
        <div>
          <span className="eyebrow">{t("inventoryERP", "Inventory ERP")}</span>
          <h1>{t("productsAndCatalog", "Products & Catalog")}</h1>
          <p className="muted">{t("manageShowroomPieces", "Manage showroom pieces, SKUs, inventory stock, and pricing.")}</p>
        </div>
      </div>

      {/* Product Form */}
      <form className="form admin-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{form.editingId ? t("editProduct", "Edit Product") : t("addNewShowroomPiece", "Add New Showroom Piece")}</h2>
            {form.editingId && (
              <button type="button" className="link" onClick={resetForm}>
                {t("cancelEdit", "Cancel Edit")}
              </button>
            )}
          </div>

          <div className="row">
            <label>
              {t("productTitle", "Product Title")}
              <input value={form.title} onChange={set("title")} placeholder="e.g. Silk Organza Trench" required />
            </label>
            <label>
              {t("designerBrand", "Designer / Brand")}
              <input value={form.brand} onChange={set("brand")} placeholder="e.g. Atelier Studio" />
            </label>
            <label>
              {t("category", "Category")}
              <select value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="row">
            <label>
              {t("retailPrice", "Retail Price")} ({business?.currency || "ETB"})
              <input type="number" min="0" value={form.price} onChange={set("price")} required />
            </label>
            <label>
              {t("costPrice", "Cost Price")} ({business?.currency || "ETB"})
              <input type="number" min="0" value={form.costPrice} onChange={set("costPrice")} placeholder="Internal ERP cost" />
            </label>
            <label>
              {t("stockQuantity", "Stock Quantity")}
              <input type="number" min="0" value={form.stockQuantity} onChange={set("stockQuantity")} required />
            </label>
            <label>
              {t("skuCode", "SKU Code")}
              <input value={form.sku} onChange={set("sku")} placeholder="e.g. SK-204" />
            </label>
          </div>

          <label>
            {t("sizesCommaSeparated", "Sizes (comma separated)")}
            <input value={form.sizes} onChange={set("sizes")} placeholder="XS, S, M, L, XL or 38, 39, 40" />
          </label>

          <label>
            {t("editorialDescription", "Editorial Description")}
            <textarea rows="3" value={form.description} onChange={set("description")} placeholder="Describe tailoring, fabric, and styling notes…" />
          </label>

          <div className="row">
            <label>
              {t("uploadPhotos", "Upload Photos")}
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
            </label>
            <label>
              {t("orImageUrls", "Or Image URLs (one per line)")}
              <textarea rows="2" value={form.urls} onChange={set("urls")} placeholder="https://images.unsplash.com/…" />
            </label>
          </div>

          <div className="row">
            <label className="check">
              <input type="checkbox" checked={form.isNew} onChange={set("isNew")} /> {t("showInJustArrived", 'Show in "Just Arrived"')}
            </label>
            <label className="check">
              <input type="checkbox" checked={form.published} onChange={set("published")} /> {t("visibleInPublicStorefront", "Visible in Public Storefront")}
            </label>
            <label className="check">
              <input type="checkbox" checked={form.soldOut} onChange={set("soldOut")} /> {t("markAsSoldOut", "Mark as Sold Out")}
            </label>
          </div>

          {formError && <p className="error" role="alert">{formError}</p>}

          <div className="actions">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? t("saving", "Saving…") : form.editingId ? t("saveChanges", "Save Changes") : t("postProduct", "Post Product")}
            </button>
          </div>
        </form>

      {/* Inventory Catalog List */}
      <div className="portal-panel" style={{ marginTop: "32px" }}>
        <div className="panel-header">
          <h2>{t("productsAndCatalog", "Inventory Catalog")} ({products.length})</h2>
        </div>

        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error" role="alert">{error}</p>}

        {products.length === 0 && !loading ? (
          <p className="muted empty">No products found.</p>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>{t("products", "Product")}</th>
                  <th>{t("skuCode", "SKU")}</th>
                  <th>{t("inventory", "Stock")}</th>
                  <th>{t("retailPrice", "Retail Price")}</th>
                  <th>Cost / Margin</th>
                  <th>{t("status", "Showroom Status")}</th>
                  <th>{t("actionsCol", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const margin = p.costPrice && p.price ? Math.round(((p.price - p.costPrice) / p.price) * 100) : null;
                  const isLowStock = Number(p.stockQuantity) <= 2;

                  return (
                    <tr key={p.id}>
                      <td className="table-product-cell">
                        <img src={p.images?.[0]} alt="" className="table-thumb" />
                        <div>
                          <strong>{p.title}</strong>
                          <span className="muted">{p.brand} · {p.category}</span>
                        </div>
                      </td>
                      <td><code>{p.sku || "—"}</code></td>
                      <td>
                        <span className={`stock-badge ${isLowStock ? "stock-low" : "stock-ok"}`}>
                          {p.stockQuantity || 0} {t("inStock", "in stock")}
                        </span>
                      </td>
                      <td><strong>{money(p.price, business?.currency)}</strong></td>
                      <td>
                        {p.costPrice ? (
                          <span>
                            {money(p.costPrice, business?.currency)}
                            {margin !== null && <small className="margin-tag"> ({margin}% margin)</small>}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="table-toggles">
                          <button
                            type="button"
                            className={`toggle-pill ${p.published !== false ? "on" : "off"}`}
                            onClick={() => updateProduct(p.id, { published: p.published === false })}
                            title="Toggle public visibility"
                          >
                            {p.published !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                            {p.published !== false ? "Visible" : "Hidden"}
                          </button>

                          <button
                            type="button"
                            className={`toggle-pill ${p.soldOut ? "sold" : ""}`}
                            onClick={() => updateProduct(p.id, { soldOut: !p.soldOut })}
                            title="Toggle sold out"
                          >
                            {p.soldOut ? t("soldOutBadge", "Sold Out") : t("available", "Available")}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="link" onClick={() => handleEdit(p)}>
                            {t("edit", "Edit")}
                          </button>
                          <button type="button" className="link danger" onClick={() => setDeleteTarget(p)}>
                            {t("delete", "Delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("confirmDeleteProductTitle", `Delete "${deleteTarget?.title}"?`)}
        description={t("confirmDeleteProductDesc", "This piece will be removed from your catalog and client showroom.")}
        confirmLabel={t("delete", "Delete")}
        cancelLabel={t("cancel", "Cancel")}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
