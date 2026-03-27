import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import CustomerHome from './pages/CustomerHome';
import PropertyDetail from './pages/PropertyDetail';
import CustomerBookings from './pages/CustomerBookings';
import VisitCart from './pages/VisitCart';
import PaymentSuccess from './pages/PaymentSuccess';
import RiderDashboard from './pages/RiderDashboard';
import AdminDashboard from './pages/AdminDashboard';
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

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role === 'customer' ? 'customer' : user.role === 'rider' ? 'rider' : 'admin'}`} replace /> : <Login />} />

      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/property/:id"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <PropertyDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/bookings"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/cart"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <VisitCart />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-success"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-cancelled"
        element={<div className="min-h-screen flex items-center justify-center"><p>Payment cancelled</p></div>}
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
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'support_admin', 'inventory_admin', 'rider_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors expand={true} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;