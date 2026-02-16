import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PortalLayout from './pages/portal/PortalLayout';
import PortalDashboard from './pages/portal/Dashboard';
import PortalOrders from './pages/portal/Orders';
import PortalOrderDetail from './pages/portal/OrderDetail';
import PortalProjects from './pages/portal/Projects';
import PortalIntake from './pages/portal/Intake';
import PortalMessages from './pages/portal/Messages';
import PortalThreadDetail from './pages/portal/ThreadDetail';
import PortalFiles from './pages/portal/Files';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminServices from './pages/admin/Services';
import AdminOrders from './pages/admin/Orders';
import AdminIntakes from './pages/admin/Intakes';
import AdminPortfolio from './pages/admin/Portfolio';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import CCCAdmin from './pages/CCCAdmin';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/portal" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Client Portal Routes */}
      <Route path="/portal" element={
        <ProtectedRoute>
          <PortalLayout />
        </ProtectedRoute>
      }>
        <Route index element={<PortalDashboard />} />
        <Route path="orders" element={<PortalOrders />} />
        <Route path="orders/:id" element={<PortalOrderDetail />} />
        <Route path="projects" element={<PortalProjects />} />
        <Route path="intake" element={<PortalIntake />} />
        <Route path="messages" element={<PortalMessages />} />
        <Route path="messages/:id" element={<PortalThreadDetail />} />
        <Route path="files" element={<PortalFiles />} />
      </Route>

      {/* CCC Admin Route (Special - restricted to crownccreative@gmail.com) */}
      <Route path="/ccc-admin" element={
        <ProtectedRoute>
          <CCCAdmin />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="intakes" element={<AdminIntakes />} />
        <Route path="portfolio" element={<AdminPortfolio />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
