import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addDoc, collection, getDocs, query, serverTimestamp, setDoc, doc, where } from "firebase/firestore";
import { Store, ArrowRight, Check, ChevronRight, Sparkles, Package, Zap, Crown, Lock, User, Mail, Phone, ShieldCheck } from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { BUSINESS_CATEGORIES, CURRENCIES, PACKAGES, slugify } from "../config";
import FirebaseEmailVerification from "../components/FirebaseEmailVerification";

const PACKAGE_ICONS = { starter: Package, growth: Zap, enterprise: Crown };

export default function RegisterBusiness() {
  const { user, login, signup, refreshUserData, sendVerificationEmail, reloadAndCheckVerified } = useAuth();
  const { show } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=plan, 2=business info, 3=account, 4=verify email
  const [selectedPackage, setSelectedPackage] = useState("growth");
  const [form, setForm] = useState({
    name: "", slug: "", category: BUSINESS_CATEGORIES[0],
    currency: "ETB", tagline: "", aboutText: "",
    phone: "", whatsapp: "",
    ownerName: user?.displayName || "",
    ownerEmail: user?.email || "",
    password: "", confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [permissionErrorGuide, setPermissionErrorGuide] = useState(false);
  const [pendingSlug, setPendingSlug] = useState("");

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((cur) => ({ ...cur, name, slug: cur.slugManual ? cur.slug : slugify(name) }));
  };
  const handleSlugChange = (e) => {
    setForm((cur) => ({ ...cur, slug: slugify(e.target.value), slugManual: true }));
  };
  const update = (key) => (e) => setForm((cur) => ({ ...cur, [key]: e.target.value }));

  // Step 3 submission: registers account + boutique in Firebase and triggers Firebase verification email!
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setPermissionErrorGuide(false);

    try {
      const slug = slugify(form.slug || form.name);
      if (!slug || slug.length < 2) throw new Error("Please specify a valid URL identifier (at least 2 characters).");

      let ownerUid = user?.uid;
      let ownerEmail = user?.email || form.ownerEmail;
      let isNewAccount = false;

      if (!user) {
        if (!form.password || form.password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match.");
        let newUser;
        try {
          newUser = await signup(form.ownerName, form.ownerEmail, form.password, "business_owner");
          isNewAccount = true;
        } catch (signupErr) {
          if (signupErr.code === "auth/email-already-in-use") {
            try {
              const cred = await login(form.ownerEmail, form.password);
              newUser = cred.user;
            } catch (loginErr) {
              throw new Error("This email is already registered. Please sign in first at /login or verify your password.");
            }
          } else {
            throw signupErr;
          }
        }
        ownerUid = newUser.uid;
        ownerEmail = newUser.email;
      }

      try {
        const existingQuery = query(collection(db, "businesses"), where("slug", "==", slug));
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) throw new Error(`The link identifier "${slug}" is already taken.`);
      } catch (slugErr) {
        if (slugErr.message?.includes("already taken")) throw slugErr;
        console.warn("Slug check skipped:", slugErr);
      }

      const pkg = PACKAGES.find((p) => p.id === selectedPackage) || PACKAGES[1];

      const businessData = {
        name: form.name.trim(),
        slug,
        ownerId: ownerUid,
        staffIds: [ownerUid],
        category: form.category,
        currency: form.currency,
        tagline: form.tagline.trim() || `New arrivals and curated pieces at ${form.name.trim()}.`,
        aboutText: form.aboutText.trim() || `${form.name.trim()} offers an exclusive, curated collection.`,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        email: ownerEmail,
        accentColor: "#18392f",
        announcement: "Welcome to our new online showroom.",
        openingHours: "Mon - Sat: 10:00 AM - 7:00 PM",
        status: "pending",
        package: selectedPackage,
        monthlyFee: pkg.price,
        subscriptionStatus: "trial",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newBizRef = await addDoc(collection(db, "businesses"), businessData);

      try {
        await setDoc(doc(db, "users", ownerUid), {
          role: "business_owner", businessId: newBizRef.id, businessSlug: slug,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (profileErr) { console.warn("Profile update:", profileErr); }

      // Send official Firebase verification email on new registration only!
      if (isNewAccount) {
        try {
          await sendVerificationEmail();
        } catch (verifErr) {
          console.warn("Could not send verification email:", verifErr);
        }
        setPendingSlug(slug);
        setStep(4); // Advance to Firebase email verification screen
        return;
      }

      await refreshUserData();
      show(`Application submitted! ${form.name} is pending platform approval.`);
      navigate(`/portal/${slug}`);
    } catch (err) {
      const isPermission = err.code === "permission-denied" || err.message?.includes("insufficient permissions");
      if (isPermission) { setPermissionErrorGuide(true); }
      setError(err.message || "Failed to register business.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "9px",
    border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none",
    boxSizing: "border-box", background: "#fafafa", color: "#111",
    transition: "border-color 0.15s",
  };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" };
  const sectionStyle = {
    background: "#fff", borderRadius: "14px", padding: "24px",
    border: "1px solid #e5e7eb", marginBottom: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  };

  const STEP_LABELS = [t("choosePlan", "Choose Plan"), t("businessInfo", "Business Info"), t("account", "Account"), "Verify Email"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f6f1" }}>
      {/* Top nav */}
      <div style={{ background: "#0d1f19", padding: "0 clamp(20px, 5vw, 60px)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "#fcd34d" }}>L</div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "15px" }}>Luna</span>
          </Link>
          <Link to="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none" }}>
            {t("alreadyHaveAccountSignIn", "Already have an account?")} <span style={{ color: "#fcd34d", fontWeight: 600 }}>Sign in →</span>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(28px, 4vw, 48px) clamp(16px, 4vw, 24px)" }}>

        {/* Page header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "4px 14px", fontSize: "11px", color: "#16a34a", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
            <Sparkles size={11} /> {t("registerYourBoutique", "Register Your Boutique")}
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: "#0f1a16", margin: "0 0 10px", letterSpacing: "-0.02em", fontFamily: "var(--display, serif)" }}>
            {t("launchYourShowroom", "Launch your luxury showroom")}
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0, maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
            {t("choosePlanSubtitle", "Select a plan, set up your boutique, and go live — all in a few minutes.")}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "36px", background: "#fff", borderRadius: "14px", padding: "14px 20px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "initial" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: step > i + 1 ? "#16a34a" : step === i + 1 ? "#0d1f19" : "#f3f4f6",
                  color: step >= i + 1 ? "#fff" : "#9ca3af",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700, transition: "all 0.25s",
                  boxShadow: step === i + 1 ? "0 0 0 3px rgba(13,31,25,0.12)" : "none",
                }}>
                  {step > i + 1 ? <Check size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: "13px", fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? "#0d1f19" : step > i + 1 ? "#16a34a" : "#9ca3af", whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: "1px", background: step > i + 1 ? "#16a34a" : "#e5e7eb", margin: "0 12px", transition: "background 0.25s" }} />}
            </div>
          ))}
        </div>

        {/* ─── STEP 4: Firebase Email Verification ─── */}
        {step === 4 && (
          <div style={{ maxWidth: "480px", margin: "0 auto", background: "#fff", borderRadius: "20px", padding: "clamp(28px, 4vw, 44px)", border: "1px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <FirebaseEmailVerification
              email={form.ownerEmail || user?.email}
              title="Verify Your Boutique Email"
              subtitle="Google Firebase has sent a verification email to:"
              onVerified={() => {
                show(`Application submitted! ${form.name} is verified and pending platform approval.`);
                navigate(`/portal/${pendingSlug || slugify(form.slug || form.name)}`);
              }}
              onCancel={() => setStep(3)}
            />
          </div>
        )}

        {/* ─── STEP 1: Plan Selection ─── */}
        {step === 1 && (
          <div>
            <div style={sectionStyle}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1a16", margin: "0 0 4px" }}>{t("chooseYourPlan", "Choose Your Plan")}</h2>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 24px" }}>{t("upgradeAnytime", "You can upgrade or change anytime after launch.")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                {PACKAGES.map((pkg) => {
                  const Icon = PACKAGE_ICONS[pkg.id] || Package;
                  const isSelected = selectedPackage === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      style={{
                        border: `2px solid ${isSelected ? pkg.color : "#e5e7eb"}`,
                        borderRadius: "14px", padding: "20px", cursor: "pointer",
                        background: isSelected ? `${pkg.color}08` : "#fff",
                        transition: "all 0.18s", position: "relative",
                        boxShadow: isSelected ? `0 0 0 1px ${pkg.color}30, 0 4px 14px ${pkg.color}15` : "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      {pkg.popular && (
                        <div style={{ position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)", background: pkg.color, color: "#fff", padding: "3px 12px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.06em" }}>
                          {t("mostPopular", "MOST POPULAR")}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `${pkg.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={18} color={pkg.color} />
                        </div>
                        <div>
                          <strong style={{ display: "block", color: pkg.color, fontSize: "14px" }}>{pkg.name}</strong>
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>{pkg.tagline?.slice(0, 28)}…</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: "14px" }}>
                        <span style={{ fontSize: "26px", fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>{pkg.price.toLocaleString()}</span>
                        <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "4px" }}>ETB/mo</span>
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {pkg.features.slice(0, 4).map((f, i) => (
                          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "5px", fontSize: "12px", color: "#4b5563" }}>
                            <Check size={12} color={pkg.color} style={{ flexShrink: 0, marginTop: "2px" }} />{f}
                          </li>
                        ))}
                      </ul>
                      {isSelected && (
                        <div style={{ marginTop: "14px", padding: "7px", background: pkg.color, borderRadius: "7px", textAlign: "center", color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em" }}>
                          ✓ {t("selectedPlan", "Selected")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep(2)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(13,31,25,0.3)" }}
              >
                {t("continueWithPlan", "Continue with")} {PACKAGES.find(p => p.id === selectedPackage)?.name} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Business Info ─── */}
        {step === 2 && (
          <div>
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Store size={18} color="#16a34a" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f1a16", margin: 0 }}>{t("boutiqueIdentity", "Boutique Identity")}</h2>
                  <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>{t("storefrontInfoDesc", "Shown on your public showroom page.")}</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>{t("boutiqueName", "Boutique Name")} *</label>
                  <input style={inputStyle} value={form.name} onChange={handleNameChange} placeholder="e.g. Velvet Atelier" required
                    onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>

                <div>
                  <label style={labelStyle}>{t("customStorefrontLink", "Storefront URL Slug")} *</label>
                  <div style={{ display: "flex", borderRadius: "9px", border: "1.5px solid #e5e7eb", overflow: "hidden", background: "#fafafa" }}>
                    <span style={{ padding: "10px 12px", background: "#f3f4f6", fontSize: "13px", color: "#6b7280", borderRight: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>/store/</span>
                    <input value={form.slug} onChange={handleSlugChange} placeholder="velvet-atelier" required
                      style={{ flex: 1, padding: "10px 12px", border: "none", outline: "none", fontSize: "14px", background: "transparent", color: "#111" }} />
                  </div>
                  {form.slug && (
                    <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", display: "block" }}>
                      Preview: <strong style={{ color: "#0d1f19" }}>{typeof window !== "undefined" ? window.location.origin : ""}/store/{form.slug}</strong>
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>{t("category", "Category")}</label>
                    <select value={form.category} onChange={update("category")} style={{ ...inputStyle }}>
                      {BUSINESS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{t("currency", "Currency")}</label>
                    <select value={form.currency} onChange={update("currency")} style={{ ...inputStyle }}>
                      {CURRENCIES.map(cur => <option key={cur.code} value={cur.code}>{cur.code} — {cur.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{t("shortTagline", "Tagline")}</label>
                  <input style={inputStyle} value={form.tagline} onChange={update("tagline")} placeholder="e.g. Contemporary bespoke garments"
                    onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
            </div>

            <div style={{ ...sectionStyle }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone size={18} color="#2563eb" />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f1a16", margin: 0 }}>{t("contactDetails", "Contact Details")}</h2>
                  <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>Optional — shown to customers in your store.</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>{t("phoneNumber", "Phone Number")}</label>
                  <input style={inputStyle} value={form.phone} onChange={update("phone")} placeholder="+251 91 123 4567"
                    onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
                <div>
                  <label style={labelStyle}>{t("whatsAppNumber", "WhatsApp")}</label>
                  <input style={inputStyle} value={form.whatsapp} onChange={update("whatsapp")} placeholder="https://wa.me/..."
                    onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fca5a5" }}>{error}</p>}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setStep(1)} style={{ padding: "11px 20px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer", color: "#374151" }}>
                {t("back", "← Back")}
              </button>
              <button
                onClick={() => { if (!form.name || !form.slug) { setError("Please fill in boutique name and URL slug."); return; } setError(""); setStep(3); }}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 22px", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(13,31,25,0.3)" }}
              >
                {t("continueBtn", "Continue")} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Account + Submit ─── */}
        {step === 3 && (
          <form onSubmit={handleRequestOtp}>
            {/* Order summary */}
            <div style={{ ...sectionStyle, background: "linear-gradient(135deg, #0d1f19 0%, #132b23 100%)", border: "none", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Your Application</p>
                  <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>{form.name || "Your Boutique"}</h2>
                  <code style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>/store/{form.slug || "—"}</code>
                </div>
                {(() => { const pkg = PACKAGES.find(p => p.id === selectedPackage); return pkg ? (
                  <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "10px 16px", textAlign: "right" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan</p>
                    <strong style={{ color: pkg.color, fontSize: "16px" }}>{pkg.name}</strong>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "2px 0 0" }}>{pkg.price.toLocaleString()} ETB/mo</p>
                  </div>
                ) : null; })()}
              </div>
            </div>

            {permissionErrorGuide && (
              <div style={{ padding: "14px 16px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #f87171", color: "#991b1b", marginBottom: "14px", fontSize: "13px" }}>
                <strong>Firebase Rules Need Publishing</strong>
                <p style={{ margin: "6px 0 0" }}>Go to Firebase Console → Firestore Database → Rules → paste the project firestore.rules → Publish.</p>
              </div>
            )}

            {!user && (
              <div style={sectionStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={18} color="#7c3aed" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f1a16", margin: 0 }}>{t("ownerCredentials", "Owner Account")}</h2>
                      <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>Your login for the business portal.</p>
                    </div>
                  </div>
                  <Link to="/login" style={{ fontSize: "12px", color: "#0d1f19", fontWeight: 600, textDecoration: "none" }}>Sign In instead →</Link>
                </div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>{t("yourFullName", "Full Name")}</label>
                    <div style={{ position: "relative" }}>
                      <User size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input value={form.ownerName} onChange={update("ownerName")} placeholder="e.g. Sara K." required
                        style={{ ...inputStyle, paddingLeft: "34px" }}
                        onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={labelStyle}>{t("emailAddress", "Email")}</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input type="email" value={form.ownerEmail} onChange={update("ownerEmail")} placeholder="owner@boutique.com" required
                          style={{ ...inputStyle, paddingLeft: "34px" }}
                          onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>{t("password", "Password")}</label>
                      <div style={{ position: "relative" }}>
                        <Lock size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                        <input type="password" minLength={6} value={form.password} onChange={update("password")} required
                          style={{ ...inputStyle, paddingLeft: "34px" }}
                          onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t("confirmPassword", "Confirm Password")}</label>
                    <div style={{ position: "relative" }}>
                      <Lock size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                      <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} required
                        style={{ ...inputStyle, paddingLeft: "34px" }}
                        onFocus={e => e.target.style.borderColor = "#0d1f19"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user && (
              <div style={{ ...sectionStyle, display: "flex", alignItems: "center", gap: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0d1f19", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={18} color="#86efac" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: "#15803d", fontSize: "14px" }}>Signed in as {user.email}</p>
                  <p style={{ margin: 0, color: "#16a34a", fontSize: "12px" }}>This account will become the boutique owner.</p>
                </div>
              </div>
            )}

            {error && !permissionErrorGuide && (
              <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fca5a5" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button type="button" onClick={() => setStep(2)} style={{ padding: "11px 20px", borderRadius: "10px", border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer", color: "#374151" }}>
                {t("back", "← Back")}
              </button>
              <button type="submit" disabled={submitting} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: submitting ? "#9ca3af" : "linear-gradient(135deg, #0d1f19 0%, #18392f 100%)", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 24px", fontWeight: 700, fontSize: "14px", cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : "0 4px 14px rgba(13,31,25,0.3)" }}>
                {submitting ? t("submittingApplication", "Submitting…") : (
                  <>Submit Application & Verify Email <ArrowRight size={15} /></>
                )}
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af", marginTop: "12px" }}>
              {t("portalActivationNotice", "Your portal will be activated once approved by the platform owner.")}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
