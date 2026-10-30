import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Check, Crown, Zap, Package, ArrowUpRight, CreditCard, Clock, CheckCircle, AlertCircle, Sparkles, Calendar } from "lucide-react";
import { db } from "../../firebase";
import { useTenant } from "../../context/TenantContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { PACKAGES, getPackage, money } from "../../config";
import { getBoutiqueAgeAndTrial } from "../../utils/trialHelper";

const ICONS = { starter: Package, growth: Zap, enterprise: Crown };

export default function PortalSubscription() {
  const { business, businessId } = useTenant();
  const { show } = useToast();
  const { t } = useLanguage();
  const [requesting, setRequesting] = useState(false);

  const currentPkg = getPackage(business?.package);
  const subStatus = business?.subscriptionStatus || "trial";
  const trialInfo = getBoutiqueAgeAndTrial(business);

  const requestUpgrade = async (targetPkgId) => {
    if (!businessId || requesting) return;
    setRequesting(true);
    try {
      await updateDoc(doc(db, "businesses", businessId), {
        upgradeRequested: targetPkgId,
        upgradeRequestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      show(`Upgrade request for ${getPackage(targetPkgId)?.name} plan sent to platform admin!`);
    } catch {
      show("Could not send upgrade request.", "error");
    } finally {
      setRequesting(false);
    }
  };

  const StatusBanner = () => {
    const banners = {
      trial:   { bg: "#eff6ff", border: "#bfdbfe", icon: <Clock size={18} color="#3b82f6" />, text: t("trialBannerText", "You are on a free trial. Contact platform support to activate your subscription."), color: "#1d4ed8" },
      active:  { bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle size={18} color="#16a34a" />, text: t("activeBannerText", "Your subscription is active. Thank you!"), color: "#15803d" },
      overdue: { bg: "#fef2f2", border: "#fecaca", icon: <AlertCircle size={18} color="#dc2626" />, text: t("overdueBannerText", "Your payment is overdue. Please contact platform support to avoid suspension."), color: "#dc2626" },
    };
    const b = banners[subStatus] || banners.trial;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "12px", background: b.bg, border: `1px solid ${b.border}`, marginBottom: "28px" }}>
        {b.icon}
        <p style={{ margin: 0, fontSize: "14px", color: b.color }}>{b.text}</p>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div className="portal-page-header">
        <div>
          <span className="eyebrow">{t("subscription", "Subscription")}</span>
          <h1>{t("planAndBilling", "Plan and Billing")}</h1>
          <p className="muted">{t("manageSubscriptionDesc", "Manage your platform subscription, view your plan features, and request upgrades.")}</p>
        </div>
      </div>

      <StatusBanner />

      {/* ── Day Counter & First Month Free Trial Card ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: "16px",
          border: "1.5px solid #e2e8f0",
          padding: "24px 28px",
          marginBottom: "28px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: trialInfo.isTrial ? "rgba(59, 130, 246, 0.12)" : "rgba(22, 163, 74, 0.12)",
                color: trialInfo.isTrial ? "#2563eb" : "#16a34a",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                  {t("dayActiveLabel", "Day")} {trialInfo.daysActive} {t("sinceCreation", "since creation")}
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "99px",
                    background: trialInfo.isTrial ? "#eff6ff" : "#f0fdf4",
                    color: trialInfo.isTrial ? "#2563eb" : "#16a34a",
                    border: trialInfo.isTrial ? "1px solid #bfdbfe" : "1px solid #bbf7d0",
                  }}
                >
                  {trialInfo.isTrial ? t("trialActiveBadge", "Free Trial Active") : t("statusActive", "Active")}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                Registered on <strong>{trialInfo.createdFormatted}</strong> · {trialInfo.isTrial ? `${t("firstMonthFree", "Your first month is completely free")} (30 days)` : "30-day complimentary trial concluded"}
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: trialInfo.isTrial ? "#2563eb" : "#16a34a" }}>
              {trialInfo.isTrial ? `${trialInfo.trialDaysRemaining}d` : `Day ${trialInfo.daysActive}`}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {trialInfo.isTrial ? t("daysRemainingLabel", "days remaining") : "operational age"}
            </div>
          </div>
        </div>

        {/* Progress Bar for the 30-Day Free Trial */}
        {trialInfo.isTrial && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>
              <span>1st Month Free Trial Progress: Day {trialInfo.daysActive} of 30</span>
              <span>{trialInfo.trialDaysRemaining} days remaining</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${trialInfo.trialProgressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
                  borderRadius: "99px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
              <span>Day 1 (Created)</span>
              <span>Day 30 (Trial Ends {trialInfo.trialEndsFormatted})</span>
            </div>
          </div>
        )}
      </div>

      {/* Current Plan Card */}
      <div className="portal-panel" style={{ marginBottom: "28px", borderTop: `4px solid ${currentPkg?.color}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="eyebrow">{t("currentPlan", "Current Plan")}</span>
            <h2 style={{ color: currentPkg?.color, margin: "4px 0 2px" }}>{currentPkg?.name}</h2>
            <p className="muted" style={{ margin: 0 }}>{currentPkg?.tagline}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "#111" }}>{currentPkg?.price?.toLocaleString()}</div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>{t("etbPerMonthPlan", "ETB per month")}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "20px", padding: "16px", background: "#f8fafc", borderRadius: "10px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>{t("maxProducts", "Max Products")}</div>
            <strong style={{ fontSize: "20px", color: currentPkg?.color }}>{currentPkg?.limits?.products === Infinity ? t("unlimited", "Unlimited") : currentPkg?.limits?.products}</strong>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Staff Accounts</div>
            <strong style={{ fontSize: "20px", color: currentPkg?.color }}>{currentPkg?.limits?.staff === Infinity ? t("unlimited", "Unlimited") : currentPkg?.limits?.staff}</strong>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>{t("status", "Subscription Status")}</div>
            <strong style={{ fontSize: "16px", color: subStatus === "active" ? "#16a34a" : subStatus === "overdue" ? "#dc2626" : "#3b82f6", textTransform: "capitalize" }}>{t(subStatus, subStatus)}</strong>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Billing</div>
            <strong style={{ fontSize: "16px" }}>Monthly</strong>
          </div>
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {currentPkg?.features?.map((f, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#374151" }}>
              <Check size={14} color={currentPkg?.color} style={{ flexShrink: 0, marginTop: "2px" }} />{f}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment Info */}
      <div className="portal-panel" style={{ marginBottom: "28px" }}>
        <div className="panel-header">
          <h3><CreditCard size={16} style={{ display: "inline", marginRight: "6px" }} />Payment Instructions</h3>
        </div>
        <p className="muted" style={{ marginBottom: "12px" }}>All payments are processed manually. Transfer your monthly subscription fee and notify the platform admin:</p>
        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="muted" style={{ fontSize: "13px" }}>Monthly Amount Due</span>
            <strong style={{ color: "#18392f" }}>{money(currentPkg?.price, "ETB")}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="muted" style={{ fontSize: "13px" }}>Payment Method</span>
            <strong>Bank Transfer / Mobile Money</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted" style={{ fontSize: "13px" }}>Reference</span>
            <code style={{ fontSize: "13px" }}>{business?.slug?.toUpperCase()}-{new Date().getFullYear()}</code>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "12px" }}>After payment, contact the platform administrator to confirm and activate your subscription.</p>
      </div>

      {/* Upgrade Options */}
      <h3 style={{ marginBottom: "16px" }}>Available Plans</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
        {PACKAGES.map((pkg) => {
          const Icon = ICONS[pkg.id] || Package;
          const isCurrent = pkg.id === business?.package;
          const isHigher = pkg.price > (currentPkg?.price || 0);
          return (
            <div key={pkg.id} style={{ border: `2px solid ${isCurrent ? pkg.color : "#e2e8f0"}`, borderRadius: "14px", padding: "20px", position: "relative", background: isCurrent ? `${pkg.color}06` : "#fff" }}>
              {isCurrent && (
                <div style={{ position: "absolute", top: "-10px", right: "16px", background: pkg.color, color: "#fff", padding: "2px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>CURRENT PLAN</div>
              )}
              {pkg.popular && !isCurrent && (
                <div style={{ position: "absolute", top: "-10px", right: "16px", background: "#f59e0b", color: "#fff", padding: "2px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>POPULAR</div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `${pkg.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={pkg.color} />
                </div>
                <div>
                  <strong style={{ color: pkg.color }}>{pkg.name}</strong>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#111" }}>{pkg.price.toLocaleString()} <span style={{ fontSize: "12px", fontWeight: 400, color: "#6b7280" }}>ETB/mo</span></div>
                </div>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
                {pkg.features.slice(0, 4).map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: "7px", fontSize: "12px", color: "#374151", padding: "3px 0" }}>
                    <Check size={12} color={pkg.color} style={{ flexShrink: 0, marginTop: "2px" }} />{f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div style={{ padding: "8px", background: pkg.color, borderRadius: "8px", textAlign: "center", color: "#fff", fontSize: "13px", fontWeight: 600 }}>{t("selectedPlan", "Your Current Plan")}</div>
              ) : isHigher ? (
                <button
                  onClick={() => requestUpgrade(pkg.id)}
                  disabled={requesting || business?.upgradeRequested === pkg.id}
                  style={{ width: "100%", padding: "9px", background: pkg.color, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {business?.upgradeRequested === pkg.id ? t("upgradeRequested", "Request Sent!") : <><ArrowUpRight size={14} /> {t("requestUpgrade", "Request Upgrade")}</>}
                </button>
              ) : (
                <div style={{ padding: "8px", background: "#f1f5f9", borderRadius: "8px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>Downgrade — contact support</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
