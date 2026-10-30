import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmDialog from "../components/ConfirmDialog";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function AdminLogin() {
  const { user, isAdmin, loading, login, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) navigate("/admin", { replace: true });
  }, [isAdmin, loading, navigate]);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
    } catch (exception) {
      setError(exception.message || "The owner sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    setConfirmingSignOut(false);
    await logout();
  }

  if (loading) return <main className="admin-login-page"><p className="muted">{t("processing", "Checking owner access…")}</p></main>;
  if (user && !isAdmin) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <LanguageSwitcher />
          </div>
          <p className="eyebrow">{t("businessPortal", "Owner access")}</p>
          <h1>{t("businessPortal", "Owner access only")}</h1>
          <p>{t("suspendedBannerDesc", "This account is not authorized to manage the shop.")}</p>
          <p className="admin-user-id">{t("account", "Account")}: {user.email}</p>
          <button className="btn danger" type="button" onClick={() => setConfirmingSignOut(true)}>{t("signOut", "Sign out")}</button>
        </section>
        <ConfirmDialog
          open={confirmingSignOut}
          title={`${t("signOut", "Sign out")} of ${user.email || "your account"}?`}
          description={t("signOutConfirmDesc", "You will return to the owner sign-in page.")}
          confirmLabel={t("signOut", "Sign out")}
          cancelLabel={t("cancel", "Cancel")}
          onClose={() => setConfirmingSignOut(false)}
          onConfirm={signOut}
        />
      </main>
    );
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          <LanguageSwitcher />
        </div>
        <p className="eyebrow">{t("businessPortal", "Owner portal")}</p>
        <h1>{t("signIn", "Owner sign in")}</h1>
        <p className="muted">{t("adminLoginSubtitle", "Only authorized owner accounts can access the dashboard.")}</p>
        <form className="admin-login-form" onSubmit={submit}>
          <label>{t("emailAddress", "Email")}<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>{t("password", "Password")}<input type="password" autoComplete="current-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn wide" type="submit" disabled={submitting}>{submitting ? t("processing", "Signing in…") : t("signIn", "Sign in as owner")}</button>
        </form>
      </section>
    </main>
  );
}
