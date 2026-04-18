// @ts-nocheck
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import CustomerHome from './pages/CustomerHome';
import PropertyDetail from './pages/PropertyDetail';
import PublicPropertyDetail from './pages/PublicPropertyDetail';
import CustomerBookings from './pages/CustomerBookings';
import VisitCart from './pages/VisitCart';
import PaymentSuccess from './pages/PaymentSuccess';
import RiderDashboard from './pages/RiderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import BuilderDashboard from './pages/BuilderDashboard';
import PackersMovers from './pages/PackersMovers';
import AdvertiseWithUs from './pages/AdvertiseWithUs';
import CustomerProfile from './pages/CustomerProfile';
import CustomerPayments from './pages/CustomerPayments';
import CustomerNotifications from './pages/CustomerNotifications';
import CustomerSupport from './pages/CustomerSupport';
import CustomerPrivacy from './pages/CustomerPrivacy';
import RiderProfile from './pages/RiderProfile';
import LegalPolicies from './pages/LegalPolicies';
import AddPropertyLocation from './pages/AddPropertyLocation';
// New Rider Onboarding Module
import RiderOnboarding from './pages/onboarding/RiderOnboarding';
// Privacy Policy Pages
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
// SEO Module - Isolated imports (read-only, no DB modifications)
import SEOListingPage from './seo-pages/pages/SEOListingPage';
import BlogListPage from './seo-pages/pages/BlogListPage';
import BlogPostPage from './seo-pages/pages/BlogPostPage';
import SitemapPage from './seo-pages/pages/SitemapPage';
// Rider Earning SEO Pages - Informational + Lead Capture (no core transaction logic)
import EarnMoneyPage from './seo-pages/pages/EarnMoneyPage';
import CityRiderPage from './seo-pages/pages/CityRiderPage';
import Earn2000Page from './seo-pages/pages/Earn2000Page';
import ErrorBoundary from './components/ErrorBoundary';
import '@/App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getRedirectPath = (role, redirectParam = null) => {
    // If redirect param exists and user is customer/advertiser/builder, use it
    if (redirectParam && ['customer', 'advertiser', 'builder'].includes(role)) {
      return redirectParam;
    }
    
    if (role === 'customer' || role === 'advertiser') {
      return '/customer';
    } else if (role === 'builder') {
      return '/builder';
    } else if (role === 'rider') {
      return '/rider';
    } else if (role === 'seller') {
      return '/seller';
    } else if (['admin', 'support_admin', 'inventory_admin', 'rider_admin'].includes(role)) {
      return '/admin';
    }
    return '/customer'; // Default fallback
  };

  // Component to handle login redirect with query params
  const LoginRedirectHandler = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectParam = searchParams.get('redirect');
    const currentPath = window.location.pathname;
    
    if (user) {
      // If we're already at a customer property page (meaning redirect already happened), don't redirect again
      if (currentPath.startsWith('/customer/property/')) {
        return <Navigate to={currentPath} replace />;
      }
      
      const targetPath = getRedirectPath(user.role, redirectParam);
      return <Navigate to={targetPath} replace />;
    }
    return <Login />;
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getRedirectPath(user.role)} replace /> : <Login />} />
      {/* Login route with redirect support for property sharing flow */}
      <Route path="/login" element={<LoginRedirectHandler />} />

      {/* PUBLIC ROUTES */}
      <Route path="/property/:id" element={<PublicPropertyDetail />} />
      <Route path="/legal" element={<LegalPolicies />} />
      <Route path="/add-location/:propertyId" element={<AddPropertyLocation />} />

      {/* BUILDER DASHBOARD */}
      <Route
        path="/builder"
        element={
          <ProtectedRoute allowedRoles={['builder']}>
            <BuilderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser']}>
            <CustomerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/property/:id"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder', 'seller']}>
            <PropertyDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/bookings"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <CustomerBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/cart"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <VisitCart />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-success"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-cancelled"
        element={<div className="min-h-screen flex items-center justify-center"><p>Payment cancelled</p></div>}
      />

      <Route
        path="/customer/packers"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <PackersMovers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/advertise"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <AdvertiseWithUs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <CustomerProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/payments"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <CustomerPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/notifications"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <CustomerNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/support"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <CustomerSupport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/privacy"
        element={
          <ProtectedRoute allowedRoles={['customer', 'advertiser', 'builder']}>
            <CustomerPrivacy />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/profile"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'support_admin', 'inventory_admin', 'rider_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ============================================
          SEO PAGES MODULE - Completely Isolated
          These are PUBLIC routes for search engine indexing
          NO authentication required, NO DB modifications
          ============================================ */}
      
      {/* Blog Routes */}
      <Route path="/blogs" element={<BlogListPage />} />
      <Route path="/blogs/:slug" element={<BlogPostPage />} />
      
      {/* Sitemap */}
      <Route path="/sitemap" element={<SitemapPage />} />
      
      {/* SEO Listing Pages - Dynamic slug parsing */}
      <Route path="/rent/:slug" element={<SEOListingPage listingType="rent" />} />
      <Route path="/buy/:slug" element={<SEOListingPage listingType="buy" />} />
      <Route path="/pg/:slug" element={<SEOListingPage listingType="pg" />} />
      
      {/* Rider Earning SEO Pages - Informational + Lead Capture */}
      <Route path="/earn-money-by-visiting-properties" element={<EarnMoneyPage />} />
      <Route path="/become-property-rider/:city" element={<CityRiderPage />} />
      <Route path="/earn-2000-per-day-real-estate" element={<Earn2000Page />} />

      {/* ============================================
          RIDER ONBOARDING MODULE - New rider applications
          PUBLIC route - no authentication required
          ============================================ */}
      <Route path="/join-as-rider" element={<RiderOnboarding />} />

      {/* ============================================
          PRIVACY POLICY PAGES - Role-specific policies
          PUBLIC routes - no authentication required
          ============================================ */}
      <Route path="/privacy-policy-riders" element={<PrivacyPolicyPage role="riders" />} />
      <Route path="/privacy-policy-customers" element={<PrivacyPolicyPage role="customers" />} />
      <Route path="/privacy-policy-sellers" element={<PrivacyPolicyPage role="sellers" />} />
      <Route path="/privacy-policy-builders" element={<PrivacyPolicyPage role="builders" />} />
      <Route path="/privacy-policy-advertisers" element={<PrivacyPolicyPage role="advertisers" />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Toaster position="top-right" richColors expand={true} />
            <AppRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
