import { Route, Routes, Navigate, useParams } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { TenantProvider } from "./context/TenantContext";
import PlatformHome from "./pages/PlatformHome";
import RegisterBusiness from "./pages/RegisterBusiness";
import Login from "./pages/Login";
import SuperAdminGuard from "./components/SuperAdminGuard";
import SuperAdmin from "./pages/superadmin/SuperAdmin";
import PortalGuard from "./components/PortalGuard";
import PortalLayout from "./components/PortalLayout";
import PortalOverview from "./pages/portal/PortalOverview";
import PortalProducts from "./pages/portal/PortalProducts";
import PortalReservations from "./pages/portal/PortalReservations";
import PortalInbox from "./pages/portal/PortalInbox";
import PortalBranding from "./pages/portal/PortalBranding";
import PortalSubscription from "./pages/portal/PortalSubscription";
import PortalSupport from "./pages/portal/PortalSupport";
import StoreHeader from "./components/StoreHeader";
import StoreFooter from "./components/StoreFooter";
import StoreHome from "./pages/store/StoreHome";
import StoreProductPage from "./pages/store/StoreProductPage";
import StoreWishlist from "./pages/store/StoreWishlist";
import StoreReservations from "./pages/store/StoreReservations";
import StoreChat from "./pages/store/StoreChat";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";

function StoreWrapper() {
  return (
    <TenantProvider>
      <StoreHeader />
      <Routes>
        <Route index element={<StoreHome />} />
        <Route path="product/:id" element={<StoreProductPage />} />
        <Route path="wishlist" element={<StoreWishlist />} />
        <Route path="reservations" element={<StoreReservations />} />
        <Route path="chat" element={<StoreChat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <StoreFooter />
    </TenantProvider>
  );
}

function PortalWrapper() {
  return (
    <TenantProvider>
      <PortalGuard>
        <PortalLayout />
      </PortalGuard>
    </TenantProvider>
  );
}

function LegacyAdminRedirect() {
  const { myBusinessSlug, user, isSuperAdmin } = useAuth();
  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }
  if (myBusinessSlug) {
    return <Navigate to={`/portal/${myBusinessSlug}`} replace />;
  }
  return <Navigate to={user ? "/" : "/login"} replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<PlatformHome />} />
      <Route path="/register-business" element={<RegisterBusiness />} />
      <Route path="/login" element={<Login />} />

      <Route path="/super-admin" element={<SuperAdminGuard><SuperAdmin /></SuperAdminGuard>} />

      <Route path="/portal" element={<LegacyAdminRedirect />} />
      <Route path="/dashboard" element={<LegacyAdminRedirect />} />
      <Route path="/portal/:slug" element={<PortalWrapper />}>
        <Route index element={<PortalOverview />} />
        <Route path="products" element={<PortalProducts />} />
        <Route path="reservations" element={<PortalReservations />} />
        <Route path="inbox" element={<PortalInbox />} />
        <Route path="branding" element={<PortalBranding />} />
        <Route path="subscription" element={<PortalSubscription />} />
        <Route path="support" element={<PortalSupport />} />
      </Route>

      <Route path="/store/:slug/*" element={<StoreWrapper />} />

      <Route path="/admin/*" element={<LegacyAdminRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
