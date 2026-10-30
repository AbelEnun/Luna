import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_BUSINESS } from "../config";
import { useAuth } from "./AuthContext";

const TenantContext = createContext(null);
export const useTenant = () => useContext(TenantContext);
export const useShop = () => useContext(TenantContext);

export function TenantProvider({ children, forcedSlug }) {
  const { slug: routeSlug } = useParams();
  const slug = forcedSlug || routeSlug || "atelier-22";
  const { user, isSuperAdmin, myBusiness } = useAuth();

  const [business, setBusiness] = useState(null);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      setBusiness(null);
      setBusinessId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const q = query(collection(db, "businesses"), where("slug", "==", slug.toLowerCase()));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const data = { id: docData.id, ...docData.data() };
          setBusiness(data);
          setBusinessId(docData.id);
          setError("");
        } else if (slug.toLowerCase() === "atelier-22" || slug.toLowerCase() === "demo-atelier-22") {
          // Graceful fallback for default showroom
          setBusiness({ id: "demo-atelier-22", ...DEFAULT_BUSINESS, ownerId: user?.uid });
          setBusinessId("demo-atelier-22");
          setError("");
        } else {
          setBusiness(null);
          setBusinessId(null);
          setError(`No business found with identifier: "${slug}"`);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Tenant load error:", err);
        if (slug.toLowerCase() === "atelier-22" || slug.toLowerCase() === "demo-atelier-22") {
          setBusiness({ id: "demo-atelier-22", ...DEFAULT_BUSINESS, ownerId: user?.uid });
          setBusinessId("demo-atelier-22");
          setError("");
        } else {
          setBusiness(null);
          setBusinessId(null);
          setError(err.message || "Failed to load business.");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [slug]);

  useEffect(() => {
    const accent = business?.accentColor || "#18392f";
    document.documentElement.style.setProperty("--green", accent);
  }, [business?.accentColor]);

  const isOwner = useMemo(() => {
    if (!user) return false;
    // Super Admin is strictly restricted from tenant business owner permissions
    if (isSuperAdmin) return false;
    if (!business) return false;
    const isDirectOwner = business.ownerId === user.uid;
    const isStaff = Array.isArray(business.staffIds) && business.staffIds.includes(user.uid);
    const isMatchingEmail = Boolean(
      business.email && user.email && business.email.toLowerCase() === user.email.toLowerCase()
    );
    const isMyBiz = Boolean(
      myBusiness && (myBusiness.id === businessId || myBusiness.slug === slug || myBusiness.ownerId === user.uid)
    );
    return Boolean(isDirectOwner || isStaff || isMatchingEmail || isMyBiz);
  }, [user, business, businessId, slug, isSuperAdmin, myBusiness]);

  const value = useMemo(() => ({
    business,
    shop: business,
    businessId,
    slug,
    loading,
    error,
    isOwner,
    isSuperAdmin,
  }), [business, businessId, slug, loading, error, isOwner, isSuperAdmin]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
