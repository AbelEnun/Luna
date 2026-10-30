import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc
} from "firebase/firestore";
import {
  ShieldCheck, Building, Store, ExternalLink, CheckCircle,
  XCircle, Clock, Ban, TrendingUp, DollarSign, Users, Package,
  ChevronDown, BarChart2, Settings, LogOut, Search, Filter,
  Bell, ArrowUpRight, AlertTriangle, Trash2, UserCheck, X, Check, Eye, MessageSquare
} from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { PACKAGES, APPLICATION_STATUS, getPackage, money } from "../../config";
import ConfirmDialog from "../../components/ConfirmDialog";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import SuperAdminSupportInbox from "./SuperAdminSupportInbox";
import { getBoutiqueAgeAndTrial } from "../../utils/trialHelper";

const NAV_ITEMS = [
  { id: "Overview",              label: "Overview",              icon: BarChart2 },
  { id: "Pending Applications",  label: "Pending Applications",  icon: Clock,    badge: true },
  { id: "All Businesses",        label: "All Boutiques",         icon: Building },
  { id: "Platform Users",        label: "Platform Users",        icon: Users },
  { id: "Revenue & Pricing",     label: "Revenue & Pricing",     icon: DollarSign },
  { id: "Support Inbox",         label: "Support Inbox",         icon: MessageSquare, badge: "support" },
  { id: "Platform Settings",     label: "Platform Settings",     icon: Settings },
];

export default function SuperAdmin() {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItemLabels = {
    "Overview": t("overview", "Overview"),
    "Pending Applications": t("pendingApplications", "Pending Applications"),
    "All Businesses": t("allBoutiques", "All Boutiques"),
    "Platform Users": t("platformUsers", "Platform Users"),
    "Revenue & Pricing": t("revenuePricing", "Revenue & Pricing"),
    "Support Inbox": t("supportInbox", "Support Inbox"),
    "Platform Settings": t("platformSettings", "Platform Settings"),
  };

  // Businesses State
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Inspector & Modal States
  const [inspectBiz, setInspectBiz] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Business Filters
  const [bizSearch, setBizSearch] = useState("");
  const [bizStatusFilter, setBizStatusFilter] = useState("All");

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");

  // Platform Settings State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [supportContact, setSupportContact] = useState("");

  // Support Inbox unread count
  const [supportUnread, setSupportUnread] = useState(0);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "support_chats"), (snap) => {
      const count = snap.docs.filter((d) => d.data().unreadByAdmin).length;
      setSupportUnread(count);
    }, () => {});
    return () => unsub();
  }, []);

  // Real-time Businesses Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "businesses"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setBusinesses(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time Users Listener
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setUsersList(list);
      setUsersLoading(false);
    });
    return () => unsubUsers();
  }, []);

  // Load Platform Settings
  useEffect(() => {
    if (activeTab !== "Platform Settings") return;
    setSettingsLoading(true);
    getDoc(doc(db, "platform_settings", "main")).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setPaymentInstructions(d.paymentInstructions || "");
        setSupportContact(d.supportContact || "");
      }
      setSettingsLoading(false);
    }).catch(() => setSettingsLoading(false));
  }, [activeTab]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await setDoc(doc(db, "platform_settings", "main"), {
        paymentInstructions,
        supportContact,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid,
      }, { merge: true });
      show("Platform settings saved successfully!");
    } catch {
      show("Could not save settings.", "error");
    }
    setSettingsSaving(false);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const approved  = businesses.filter((b) => b.status === "approved" || b.status === "active");
    const pending   = businesses.filter((b) => b.status === "pending");
    const rejected  = businesses.filter((b) => b.status === "rejected");
    const suspended = businesses.filter((b) => b.status === "suspended");
    const overdue   = businesses.filter((b) => b.subscriptionStatus === "overdue");
    const upgradeRequested = businesses.filter((b) => !!b.upgradeRequested);
    const mrr = approved.reduce((sum, b) => sum + (getPackage(b.package)?.price || 0), 0);
    const arr = mrr * 12;
    const expectedMrr = businesses.filter((b) => b.status === "approved" || b.status === "active" || b.status === "suspended")
      .reduce((sum, b) => sum + (getPackage(b.package)?.price || 0), 0);
    const byPackage = PACKAGES.map((pkg) => ({
      ...pkg,
      count: approved.filter((b) => b.package === pkg.id).length,
    }));
    // Trial tracking
    const inTrial     = businesses.filter((b) => getBoutiqueAgeAndTrial(b).isTrial);
    const trialExpired = businesses.filter((b) => getBoutiqueAgeAndTrial(b).isTrialExpired);
    return {
      approved, pending, rejected, suspended, overdue,
      upgradeRequested, mrr, arr, expectedMrr, byPackage,
      total: businesses.length,
      inTrial, trialExpired,
    };
  }, [businesses]);

  /* ── Business Mutation Actions ── */
  const approve = async (biz) => {
    try {
      await updateDoc(doc(db, "businesses", biz.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: user?.uid,
        rejectionReason: "",
        updatedAt: serverTimestamp(),
      });
      show(`${biz.name} approved and live!`);
    } catch {
      show("Could not approve business.", "error");
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    try {
      await updateDoc(doc(db, "businesses", rejectModal.id), {
        status: "rejected",
        rejectionReason: rejectReason || "Application did not meet platform requirements.",
        updatedAt: serverTimestamp(),
      });
      show(`${rejectModal.name} application rejected.`);
      setRejectModal(null);
      setRejectReason("");
    } catch {
      show("Could not reject application.", "error");
    }
  };

  const suspend = async () => {
    if (!suspendModal) return;
    try {
      await updateDoc(doc(db, "businesses", suspendModal.id), {
        status: "suspended",
        suspensionReason: suspendReason || "Account suspended by platform administrator.",
        updatedAt: serverTimestamp(),
      });
      show(`${suspendModal.name} suspended.`);
      setSuspendModal(null);
      setSuspendReason("");
    } catch {
      show("Could not suspend business.", "error");
    }
  };

  const reactivate = async (biz) => {
    try {
      await updateDoc(doc(db, "businesses", biz.id), {
        status: "approved",
        suspensionReason: "",
        updatedAt: serverTimestamp(),
      });
      show(`${biz.name} reactivated and active.`);
    } catch {
      show("Could not reactivate.", "error");
    }
  };

  const updateBusinessField = async (bizId, updates) => {
    try {
      await updateDoc(doc(db, "businesses", bizId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      show("Boutique settings updated!");
      if (inspectBiz && inspectBiz.id === bizId) {
        setInspectBiz((cur) => ({ ...cur, ...updates }));
      }
    } catch (err) {
      show(err.message || "Failed to update business.", "error");
    }
  };

  const approveUpgrade = async (biz) => {
    if (!biz || !biz.upgradeRequested) return;
    const targetPkg = biz.upgradeRequested;
    try {
      await updateDoc(doc(db, "businesses", biz.id), {
        package: targetPkg,
        monthlyFee: getPackage(targetPkg)?.price || biz.monthlyFee,
        upgradeRequested: null,
        upgradeRequestedAt: null,
        updatedAt: serverTimestamp(),
      });
      show(`Upgraded ${biz.name} to ${getPackage(targetPkg)?.name} plan!`);
      if (inspectBiz?.id === biz.id) {
        setInspectBiz((cur) => ({ ...cur, package: targetPkg, upgradeRequested: null }));
      }
    } catch (err) {
      show("Could not approve upgrade.", "error");
    }
  };

  const handleDeleteBusiness = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "businesses", deleteTarget.id));
      show(`Boutique "${deleteTarget.name}" deleted permanently.`);
      if (inspectBiz?.id === deleteTarget.id) setInspectBiz(null);
      setDeleteTarget(null);
    } catch (err) {
      show(err.message || "Could not delete business.", "error");
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      show(`User role updated to ${newRole}`);
    } catch (err) {
      show(err.message || "Could not update user role.", "error");
    }
  };

  /* ── Filtered Businesses ── */
  const filteredBiz = useMemo(() => {
    return businesses.filter((b) => {
      const status = b.status === "active" ? "approved" : (b.status || "pending");
      const matchStatus = bizStatusFilter === "All" || status.toLowerCase() === bizStatusFilter.toLowerCase();
      const q = bizSearch.toLowerCase();
      const matchSearch = !q || b.name?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [businesses, bizSearch, bizStatusFilter]);

  /* ── Filtered Users ── */
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchRole = userRoleFilter === "All" || u.role === userRoleFilter.toLowerCase();
      const q = userSearch.toLowerCase();
      const matchSearch = !q || u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.businessSlug?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [usersList, userSearch, userRoleFilter]);

  /* ── Badges ── */
  const StatusBadge = ({ status }) => {
    const s = APPLICATION_STATUS[status] || APPLICATION_STATUS.pending;
    return (
      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: s.bg, color: s.color, display: "inline-block" }}>
        {s.label}
      </span>
    );
  };

  const SubBadge = ({ status }) => {
    const map = {
      trial:   { label: "Trial",   bg: "#eff6ff", color: "#2563eb" },
      active:  { label: "Active",  bg: "#f0fdf4", color: "#16a34a" },
      overdue: { label: "Overdue", bg: "#fef2f2", color: "#dc2626" },
    };
    const s = map[status] || { label: "—", bg: "#f1f5f9", color: "#6b7280" };
    return (
      <span style={{ padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color, display: "inline-block" }}>
        {s.label}
      </span>
    );
  };

  /* ── Styles ── */
  const sidebarW = 230;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "var(--body)" }}>
      {/* ── SUPER ADMIN MASTER SIDEBAR ── */}
      <aside
        style={{
          width: `${sidebarW}px`,
          minHeight: "100vh",
          background: "#0f231d",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
          boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
              }}
            >
              <ShieldCheck size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>Platform Super Admin</div>
              <div style={{ color: "#86efac", fontSize: "11px", fontWeight: 600 }}>Master Operations Console</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: "16px 10px" }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "11px 16px",
                  cursor: "pointer",
                  borderRadius: "9px",
                  margin: "3px 0",
                  background: active ? "rgba(255,255,255,0.16)" : "transparent",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13.5px",
                  border: "none",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={17} color={active ? "#86efac" : "rgba(255,255,255,0.6)"} />
                <span style={{ flex: 1 }}>{navItemLabels[id] || label}</span>
                {badge === true && metrics.pending.length > 0 && (
                  <span style={{ background: "#f59e0b", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                    {metrics.pending.length}
                  </span>
                )}
                {badge === "support" && supportUnread > 0 && (
                  <span style={{ background: "#dc2626", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: 700 }}>
                    {supportUnread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Platform Return & Sign Out */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              fontSize: "12.5px",
              fontWeight: 600,
              textDecoration: "none",
              marginBottom: "12px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <Store size={14} /> {t("platformHome", "Platform Home")}
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#86efac", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                {t("superAdmin", "Super Admin")}
              </div>
              <div style={{ fontSize: "12px", color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </div>
            <button
              type="button"
              className="logout-btn-dark"
              onClick={() => setConfirmSignOut(true)}
              title={t("signOut", "Sign out")}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div style={{ marginLeft: `${sidebarW}px`, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Sticky Header */}
        <header
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 36px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
              {navItemLabels[activeTab] || activeTab}
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Luna Platform Master Control
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <LanguageSwitcher />

            {metrics.pending.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("Pending Applications")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Bell size={14} /> {metrics.pending.length} {t("statusPending", "Pending Review")}
              </button>
            )}

            <button
              type="button"
              className="logout-btn"
              onClick={() => setConfirmSignOut(true)}
            >
              <LogOut size={14} /> {t("signOut", "Sign out")}
            </button>
          </div>
        </header>

        {/* Tab Content Canvas */}
        <main style={{ padding: "32px 36px", flex: 1 }}>
          {/* ══════════════════════════════════════
              TAB 1: OVERVIEW
             ══════════════════════════════════════ */}
          {activeTab === "Overview" && (
            <div>
              {/* Top Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "32px" }}>
                <div className="kpi-card" style={{ borderLeft: "4px solid #18392f", background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    {t("monthlyRecurringRevenue", "Platform Monthly Revenue")}
                  </span>
                  <strong style={{ fontSize: "26px", color: "#18392f", display: "block", marginBottom: "2px" }}>
                    {money(metrics.mrr, "ETB")}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>ARR Run Rate: {money(metrics.arr, "ETB")}</span>
                </div>

                <div className="kpi-card" style={{ borderLeft: "4px solid #16a34a", background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    {t("activeBoutiquesCount", "Live Active Boutiques")}
                  </span>
                  <strong style={{ fontSize: "26px", color: "#16a34a", display: "block", marginBottom: "2px" }}>
                    {metrics.approved.length}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{t("statusApproved", "Approved")}</span>
                </div>

                <div className="kpi-card" style={{ borderLeft: "4px solid #f59e0b", background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    {t("pendingApprovalsCount", "Pending Applications")}
                  </span>
                  <strong style={{ fontSize: "26px", color: "#f59e0b", display: "block", marginBottom: "2px" }}>
                    {metrics.pending.length}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{t("statusPending", "Awaiting Decision")}</span>
                </div>

                <div className="kpi-card" style={{ borderLeft: "4px solid #6366f1", background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    {t("totalUsersCount", "Platform Users")}
                  </span>
                  <strong style={{ fontSize: "26px", color: "#4f46e5", display: "block", marginBottom: "2px" }}>
                    {usersList.length}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{t("platformUsers", "Registered Accounts")}</span>
                </div>

                {/* Free Trial KPI Card */}
                <div className="kpi-card" style={{ borderLeft: "4px solid #0891b2", background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                    🎁 {t("freeTrial", "Free Trial (30-Day)")}
                  </span>
                  <strong style={{ fontSize: "26px", color: "#0891b2", display: "block", marginBottom: "2px" }}>
                    {businesses.filter((b) => getBoutiqueAgeAndTrial(b).isTrial).length}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {businesses.filter((b) => getBoutiqueAgeAndTrial(b).isTrialExpired).length} {t("trialExpiredBadge", "Trial Expired")}
                  </span>
                </div>
              </div>

              {/* Two Column Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Platform Health */}
                <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
                    Platform Health &amp; Subscriptions
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f0fdf4", borderRadius: "8px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#166534" }}>Active MRR</span>
                      <strong style={{ fontSize: "16px", color: "#15803d" }}>{money(metrics.mrr, "ETB")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#334155" }}>Overdue Subscriptions</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: metrics.overdue.length > 0 ? "#dc2626" : "#64748b" }}>
                        {metrics.overdue.length} boutiques
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#334155" }}>Suspended Boutiques</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: metrics.suspended.length > 0 ? "#ea580c" : "#64748b" }}>
                        {metrics.suspended.length} boutiques
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#334155" }}>Upgrade Requests</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: metrics.upgradeRequested.length > 0 ? "#7c3aed" : "#64748b" }}>
                        {metrics.upgradeRequested.length} pending
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Applications Feed */}
                <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                      Pending Review Queue ({metrics.pending.length})
                    </h3>
                    <button type="button" onClick={() => setActiveTab("Pending Applications")} style={{ background: "none", border: "none", color: "#18392f", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                      View all →
                    </button>
                  </div>

                  {metrics.pending.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "14px" }}>
                      No pending applications right now.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {metrics.pending.slice(0, 4).map((b) => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                          <div>
                            <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{b.name}</strong>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>{b.category} · {b.email}</span>
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => approve(b)}
                              style={{ padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                              {t("approve", "Approve")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectModal(b)}
                              style={{ padding: "6px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                              {t("reject", "Reject")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 2: PENDING APPLICATIONS
             ══════════════════════════════════════ */}
          {activeTab === "Pending Applications" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                  Boutique Registration Applications
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  Review submitted applications, inspect brand information, and approve or reject access.
                </p>
              </div>

              {metrics.pending.length === 0 ? (
                <div style={{ background: "#ffffff", padding: "60px 24px", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <CheckCircle size={40} color="#16a34a" style={{ marginBottom: "12px" }} />
                  <h3 style={{ fontSize: "18px", color: "#0f172a", margin: "0 0 6px" }}>All Applications Reviewed</h3>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>There are currently no new boutiques awaiting review.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {metrics.pending.map((biz) => {
                    const pkg = getPackage(biz.package);
                    const date = biz.createdAt?.toDate?.()?.toLocaleDateString() || "Recently";
                    return (
                      <div
                        key={biz.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "14px",
                          padding: "24px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "#18392f", color: "#ffffff", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: 700 }}>
                              {biz.name?.charAt(0) || "B"}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>{biz.name}</h3>
                                <StatusBadge status="pending" />
                                <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "rgba(24,57,47,0.08)", color: "#18392f" }}>
                                  {pkg?.name} Plan ({money(pkg?.price, "ETB")}/mo)
                                </span>
                              </div>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                Category: <strong>{biz.category}</strong> · Currency: <strong>{biz.currency || "ETB"}</strong> · Slug: <code>/store/{biz.slug}</code>
                              </span>
                            </div>
                          </div>

                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Applied on {date}</span>
                        </div>

                        {biz.tagline && (
                          <p style={{ fontSize: "13.5px", color: "#334155", fontStyle: "italic", margin: "0 0 16px" }}>
                            "{biz.tagline}"
                          </p>
                        )}

                        {/* Contact details row */}
                        <div style={{ display: "flex", gap: "24px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", marginBottom: "18px", fontSize: "13px" }}>
                          <div><span style={{ color: "#64748b" }}>Owner Email:</span> <strong>{biz.email}</strong></div>
                          {biz.phone && <div><span style={{ color: "#64748b" }}>Phone:</span> <strong>{biz.phone}</strong></div>}
                          {biz.whatsapp && <div><span style={{ color: "#64748b" }}>WhatsApp:</span> <strong>{biz.whatsapp}</strong></div>}
                        </div>

                        {/* Decision Action Buttons */}
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => approve(biz)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 22px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}
                          >
                            <Check size={16} /> {t("approve", "Approve & Activate")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModal(biz)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "8px", fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}
                          >
                            <X size={16} /> {t("reject", "Reject Application")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectBiz(biz)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }}
                          >
                            {t("details", "Inspect Details")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 3: ALL BOUTIQUES & SHOWROOMS
             ══════════════════════════════════════ */}
          {activeTab === "All Businesses" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                  All Registered Boutiques ({businesses.length})
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  Manage boutique statuses, change subscription tiers, or delete obsolete stores in-place without accessing their private portals.
                </p>
              </div>

              {/* Search & Status Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                  <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search by boutique name, slug, email, or category…"
                    value={bizSearch}
                    onChange={(e) => setBizSearch(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px", background: "#ffffff", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["All", "Active", "Pending", "Suspended", "Rejected"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setBizStatusFilter(status)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: bizStatusFilter === status ? "1px solid #18392f" : "1px solid #cbd5e1",
                        background: bizStatusFilter === status ? "#18392f" : "#ffffff",
                        color: bizStatusFilter === status ? "#ffffff" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Boutiques Table */}
              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                {loading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading registered boutiques…</div>
                ) : filteredBiz.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No boutiques match your filters.</div>
                ) : (
                  <div className="inventory-table-wrap">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>{t("boutiqueNameCol", "Boutique")}</th>
                          <th>{t("showroomLink", "Showroom URL")}</th>
                          <th>{t("planCol", "Plan Tier")}</th>
                          <th>{t("statusCol", "Showroom Status")}</th>
                          <th>{t("subscription", "Billing")}</th>
                          <th>{t("dateCol", "Joined")}</th>
                          <th style={{ textAlign: "right" }}>{t("actionsCol", "Actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBiz.map((biz) => {
                          const pkg = getPackage(biz.package);
                          const joined = biz.createdAt?.toDate?.()?.toLocaleDateString() || "—";
                          const status = biz.status === "active" ? "approved" : (biz.status || "pending");
                          const trialInfo = getBoutiqueAgeAndTrial(biz);

                          return (
                            <tr key={biz.id}>
                              <td className="table-product-cell">
                                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: biz.accentColor || "#18392f", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "14px" }}>
                                  {biz.name?.charAt(0) || "B"}
                                </div>
                                <div>
                                  <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {biz.name}
                                    {biz.upgradeRequested && (
                                      <span style={{ padding: "1px 6px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, background: "#f3e8ff", color: "#7c3aed" }}>
                                        Upgrade Requested
                                      </span>
                                    )}
                                  </strong>
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>{biz.email} · {biz.category}</span>
                                </div>
                              </td>
                              <td>
                                {biz.slug ? (
                                  <a href={`/store/${biz.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12.5px", color: "#18392f", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    /store/{biz.slug} <ExternalLink size={11} color="#94a3b8" />
                                  </a>
                                ) : "—"}
                              </td>
                              <td>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: pkg?.color || "#334155" }}>
                                  {pkg?.name}
                                </span>
                              </td>
                              <td>
                                <StatusBadge status={status} />
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  <SubBadge status={biz.subscriptionStatus} />
                                  {trialInfo.isTrial ? (
                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: "3px", width: "fit-content" }}>
                                      🎁 {t("freeTrial", "Free Trial")} · {trialInfo.trialDaysRemaining}d {t("daysRemainingLabel", "left")}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                                      {t("trialExpiredBadge", "Trial Expired")}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>{joined}</span>
                                <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#18392f", display: "block" }}>
                                  {t("dayActiveLabel", "Day")} {trialInfo.daysActive}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                                  <button
                                    type="button"
                                    onClick={() => setInspectBiz(biz)}
                                    style={{
                                      padding: "6px 12px",
                                      background: "#18392f",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12.5px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {t("manage", "Manage ⚙")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(biz)}
                                    title="Delete boutique"
                                    style={{
                                      padding: "6px 8px",
                                      background: "none",
                                      border: "none",
                                      color: "#dc2626",
                                      cursor: "pointer",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    <Trash2 size={15} />
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
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 4: PLATFORM USERS
             ══════════════════════════════════════ */}
          {activeTab === "Platform Users" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                  Registered Platform Accounts ({usersList.length})
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  Inspect all authenticated users, assign or modify roles, and view associated businesses.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                  <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search by email, name, or business slug…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px", background: "#ffffff", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {["All", "super_admin", "business_owner", "customer"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setUserRoleFilter(role)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: userRoleFilter === role ? "1px solid #18392f" : "1px solid #cbd5e1",
                        background: userRoleFilter === role ? "#18392f" : "#ffffff",
                        color: userRoleFilter === role ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {role === "All" ? "All Roles" : role.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {usersLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading accounts…</div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No users found matching your search.</div>
                ) : (
                  <div className="inventory-table-wrap">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>{t("account", "User")}</th>
                          <th>{t("email", "Email")}</th>
                          <th>{t("userRoleAdmin", "Role")}</th>
                          <th>{t("boutiqueNameCol", "Associated Boutique")}</th>
                          <th>{t("dateCol", "Joined")}</th>
                          <th style={{ textAlign: "right" }}>{t("actionsCol", "Assign Role")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => {
                          const date = u.createdAt?.toDate?.()?.toLocaleDateString() || "—";
                          const roleColors = {
                            super_admin: { bg: "#dbeafe", color: "#1d4ed8" },
                            business_owner: { bg: "#dcfce7", color: "#15803d" },
                            customer: { bg: "#f1f5f9", color: "#475569" },
                          };
                          const style = roleColors[u.role] || roleColors.customer;

                          return (
                            <tr key={u.id}>
                              <td className="table-product-cell">
                                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#e2e8f0", color: "#334155", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "13px" }}>
                                  {(u.name || u.email || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong>{u.name || "User"}</strong>
                                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>UID: {u.id.slice(0, 8)}…</span>
                                </div>
                              </td>
                              <td><code>{u.email}</code></td>
                              <td>
                                <span style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "11.5px", fontWeight: 700, background: style.bg, color: style.color }}>
                                  {u.role || "customer"}
                                </span>
                              </td>
                              <td>
                                {u.businessSlug ? (
                                  <a href={`/store/${u.businessSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#18392f", fontWeight: 600, fontSize: "12.5px" }}>
                                    /store/{u.businessSlug}
                                  </a>
                                ) : (
                                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>None (Client)</span>
                                )}
                              </td>
                              <td><span style={{ fontSize: "12px", color: "#64748b" }}>{date}</span></td>
                              <td style={{ textAlign: "right" }}>
                                <select
                                  value={u.role || "customer"}
                                  onChange={(e) => updateUserRole(u.id, e.target.value)}
                                  style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#f8fafc", cursor: "pointer" }}
                                >
                                  <option value="customer">Customer</option>
                                  <option value="business_owner">Business Owner</option>
                                  <option value="super_admin">Super Admin</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 5: REVENUE & PRICING
             ══════════════════════════════════════ */}
          {activeTab === "Revenue & Pricing" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                  Platform Revenue &amp; Tier Subscriptions
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  Overview of recurring revenue across plans and queue of boutique upgrade requests.
                </p>
              </div>

              {/* Pending Upgrade Requests Banner */}
              {metrics.upgradeRequested.length > 0 && (
                <div style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", borderRadius: "14px", padding: "20px", marginBottom: "28px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#6b21a8", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ArrowUpRight size={18} /> Pending Plan Upgrade Requests ({metrics.upgradeRequested.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {metrics.upgradeRequested.map((b) => {
                      const target = getPackage(b.upgradeRequested);
                      return (
                        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#ffffff", borderRadius: "8px" }}>
                          <div>
                            <strong>{b.name}</strong> currently on <code>{b.package}</code> requested upgrade to <strong style={{ color: target?.color }}>{target?.name}</strong> ({money(target?.price, "ETB")}/mo).
                          </div>
                          <button
                            type="button"
                            onClick={() => approveUpgrade(b)}
                            style={{ padding: "6px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                          >
                            Approve Upgrade
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Plan Distribution Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                {PACKAGES.map((pkg) => {
                  const count = metrics.approved.filter((b) => b.package === pkg.id).length;
                  const revenue = count * pkg.price;
                  return (
                    <div key={pkg.id} style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", borderTop: `4px solid ${pkg.color}`, padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <h3 style={{ margin: 0, color: pkg.color, fontSize: "18px" }}>{pkg.name}</h3>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{pkg.tagline}</span>
                        </div>
                        {pkg.popular && (
                          <span style={{ background: pkg.color, color: "#fff", padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 700 }}>
                            POPULAR
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "14px 0 6px" }}>
                        {money(pkg.price, "ETB")} <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>/ month</span>
                      </div>

                      <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#64748b" }}>Active Boutiques:</span>
                        <strong style={{ color: "#0f172a" }}>{count} ({money(revenue, "ETB")}/mo)</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB: SUPPORT INBOX
             ══════════════════════════════════════ */}
          {activeTab === "Support Inbox" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Support Inbox</h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Direct support messages from business owners.</p>
              </div>
              <SuperAdminSupportInbox />
            </div>
          )}

          {/* ══════════════════════════════════════
              TAB 6: PLATFORM SETTINGS
             ══════════════════════════════════════ */}
          {activeTab === "Platform Settings" && (
            <div style={{ maxWidth: "700px" }}>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                  Platform Settings &amp; Billing Instructions
                </h2>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  Configure what boutiques see when making payments or reaching support.
                </p>
              </div>

              {settingsLoading ? (
                <div style={{ padding: "40px 0", color: "#64748b" }}>Loading settings…</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                      Subscription Payment Instructions
                    </label>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 10px" }}>
                      Displayed in boutique portals when owners are in trial or overdue. Specify Commercial Bank of Ethiopia (CBE), Telebirr, or Awash bank details.
                    </p>
                    <textarea
                      rows={5}
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      placeholder="e.g. Telebirr: 0911234567 or CBE Account: 1000123456789. Send screenshot to admin@yourdomain.com."
                      style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>

                  <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase" }}>
                      Support &amp; Inquiries Contact
                    </label>
                    <textarea
                      rows={3}
                      value={supportContact}
                      onChange={(e) => setSupportContact(e.target.value)}
                      placeholder="e.g. For platform help, message WhatsApp +251 91 123 4567 or email abelenun25@gmail.com."
                      style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13.5px", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={settingsSaving}
                      style={{
                        padding: "12px 28px",
                        background: "#18392f",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: settingsSaving ? "wait" : "pointer",
                      }}
                    >
                      {settingsSaving ? "Saving Settings…" : "Save Platform Settings"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── BOUTIQUE MASTER INSPECTOR DRAWER / MODAL ── */}
      {inspectBiz && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
            zIndex: 1000,
            animation: "fadeIn 0.15s ease",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectBiz(null);
          }}
        >
          <div
            style={{
              width: "560px",
              maxWidth: "100vw",
              background: "#ffffff",
              height: "100%",
              overflowY: "auto",
              boxShadow: "-8px 0 30px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              padding: "32px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#16a34a" }}>
                  Boutique Master Control
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "4px 0 2px", color: "#0f172a" }}>
                  {inspectBiz.name}
                </h2>
                <a
                  href={`/store/${inspectBiz.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "12.5px", color: "#18392f", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  /store/{inspectBiz.slug} <ExternalLink size={12} />
                </a>
              </div>
              <button
                type="button"
                onClick={() => setInspectBiz(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "grid", placeItems: "center", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Day Counter & Trial Card ── */}
            {(() => {
              const inspectTrial = getBoutiqueAgeAndTrial(inspectBiz);
              return (
                <div style={{
                  background: inspectTrial.isTrial ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "#f8fafc",
                  border: `1px solid ${inspectTrial.isTrial ? "#bfdbfe" : "#e2e8f0"}`,
                  borderRadius: "12px",
                  padding: "18px 20px",
                  marginBottom: "24px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#475569", display: "block", marginBottom: "4px" }}>
                        🗓 {t("dayActiveLabel", "Day Counter")}
                      </span>
                      <span style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
                        {t("dayActiveLabel", "Day")} {inspectTrial.daysActive}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginTop: "2px" }}>
                        {t("sinceCreation", "since registration")} · {inspectTrial.createdFormatted}
                      </span>
                    </div>
                    {inspectTrial.isTrial ? (
                      <span style={{ padding: "6px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700, background: "#2563eb", color: "#fff", whiteSpace: "nowrap" }}>
                        🎁 {t("trialActiveBadge", "Free Trial Active")}
                      </span>
                    ) : (
                      <span style={{ padding: "6px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700, background: "#f1f5f9", color: "#64748b", whiteSpace: "nowrap" }}>
                        {t("trialExpiredBadge", "Trial Expired")}
                      </span>
                    )}
                  </div>
                  {/* Trial Progress Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#64748b", marginBottom: "6px" }}>
                      <span>{t("firstMonthFree", "30-Day Free Trial")}</span>
                      <span>
                        {inspectTrial.isTrial
                          ? `${inspectTrial.trialDaysRemaining} ${t("daysRemainingLabel", "days remaining")} · ends ${inspectTrial.trialEndsFormatted}`
                          : `${t("trialExpiredBadge", "Trial ended")} ${inspectTrial.trialEndsFormatted}`}
                      </span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "99px", background: "#e2e8f0", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${inspectTrial.trialProgressPercent}%`,
                        background: inspectTrial.isTrial ? "#2563eb" : "#94a3b8",
                        borderRadius: "99px",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Status Changers */}
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 14px", fontSize: "13px", textTransform: "uppercase", color: "#475569" }}>
                {t("platformSettings", "Operational & Subscription Controls")}
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    {t("status", "Operating Status")}
                  </label>
                  <select
                    value={inspectBiz.status === "active" ? "approved" : (inspectBiz.status || "pending")}
                    onChange={(e) => updateBusinessField(inspectBiz.id, { status: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="approved">{t("statusApproved", "Approved / Live")}</option>
                    <option value="pending">{t("statusPending", "Pending Review")}</option>
                    <option value="suspended">{t("statusSuspended", "Suspended")}</option>
                    <option value="rejected">{t("statusRejected", "Rejected")}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                    {t("plan", "Subscription Plan Tier")}
                  </label>
                  <select
                    value={inspectBiz.package || "growth"}
                    onChange={(e) => updateBusinessField(inspectBiz.id, { package: e.target.value, monthlyFee: getPackage(e.target.value)?.price })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    {PACKAGES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({money(p.price, "ETB")}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  {t("subscription", "Billing / Subscription Status")}
                </label>
                <select
                  value={inspectBiz.subscriptionStatus || "trial"}
                  onChange={(e) => updateBusinessField(inspectBiz.id, { subscriptionStatus: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="active">{t("statusActive", "Active (Paid)")}</option>
                  <option value="trial">{t("statusTrial", "Trial Mode")}</option>
                  <option value="overdue">{t("statusOverdue", "Payment Overdue")}</option>
                </select>
              </div>

              {inspectBiz.upgradeRequested && (
                <div style={{ marginTop: "14px", padding: "12px", background: "#f3e8ff", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12.5px", color: "#6b21a8" }}>
                    Requested upgrade to <strong>{getPackage(inspectBiz.upgradeRequested)?.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => approveUpgrade(inspectBiz)}
                    style={{ padding: "5px 12px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>

            {/* Storefront Details */}
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "13px", textTransform: "uppercase", color: "#475569" }}>
                {t("brandInformation", "Brand & Contact Information")}
              </h4>
              <div style={{ display: "grid", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{t("ownerCol", "Owner Email")}</span>
                  <strong>{inspectBiz.email || "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{t("categoryCol", "Category")}</span>
                  <strong>{inspectBiz.category || "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{t("currency", "Currency")}</span>
                  <strong>{inspectBiz.currency || "ETB"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{t("phone", "Phone")}</span>
                  <strong>{inspectBiz.phone || "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{t("whatsApp", "WhatsApp")}</span>
                  <strong>{inspectBiz.whatsapp || "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{t("showroomAddress", "Showroom Address")}</span>
                  <strong>{inspectBiz.address || "—"}</strong>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid #fee2e2" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "13px", color: "#dc2626", textTransform: "uppercase" }}>
                {t("delete", "Danger Zone")}
              </h4>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px" }}>
                Permanently purge this boutique and its data from the platform.
              </p>
              <button
                type="button"
                onClick={() => setDeleteTarget(inspectBiz)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} /> {t("delete", "Delete Boutique Permanently")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", width: "420px", maxWidth: "90vw" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px" }}>Reject Application</h3>
            <p style={{ color: "#64748b", fontSize: "13.5px", marginBottom: "16px" }}>
              Rejecting <strong>{rejectModal.name}</strong>. Provide an optional reason:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete showroom details. Please re-submit with accurate contact information."
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13.5px", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button type="button" onClick={() => { setRejectModal(null); setRejectReason(""); }} style={{ flex: 1, padding: "10px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button type="button" onClick={reject} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Permanently delete "${deleteTarget?.name}"?`}
        description="This will remove the boutique document and unpublish its client showroom from Luna."
        confirmLabel="Delete Boutique"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBusiness}
      />

      {/* ── Sign Out Confirmation Dialog ── */}
      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out of Super Admin?"
        description="You will exit the master platform administrator session."
        confirmLabel={t("signOut", "Sign out")}
        cancelLabel={t("cancel", "Cancel")}
        onClose={() => setConfirmSignOut(false)}
        onConfirm={async () => {
          setConfirmSignOut(false);
          await logout();
          navigate("/login");
        }}
      />
    </div>
  );
}