import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerMenu from './pages/CustomerMenu';
import CustomerCart from './pages/CustomerCart';
import CustomerOrders from './pages/CustomerOrders';
import Orders from './pages/Orders';
import Queue from './pages/Queue';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Profile from './pages/Profile';
import Users from './pages/Users';
import TrackOrder from './pages/TrackOrder';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center text-white/30">
        <div className="text-4xl mb-2 animate-pulse">🍽️</div>
        <div className="text-sm">Loading...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// Redirects /dashboard to the right dashboard based on role
function SmartDashboard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'customer') return <Navigate to="/customer" replace />;
  return (
    <Protected roles={['admin', 'staff']}>
      <Layout><Dashboard /></Layout>
    </Protected>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'DM Sans' },
          success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Smart dashboard redirect */}
        <Route path="/dashboard" element={<SmartDashboard />} />

        {/* Customer-only routes */}
        <Route path="/customer" element={
          <Protected roles={['customer']}>
            <CustomerLayout><CustomerDashboard /></CustomerLayout>
          </Protected>
        } />
        <Route path="/customer/menu" element={
          <Protected roles={['customer']}>
            <CustomerLayout><CustomerMenu /></CustomerLayout>
          </Protected>
        } />
        <Route path="/customer/cart" element={
          <Protected roles={['customer']}>
            <CustomerLayout><CustomerCart /></CustomerLayout>
          </Protected>
        } />
        <Route path="/customer/orders" element={
          <Protected roles={['customer']}>
            <CustomerLayout><CustomerOrders /></CustomerLayout>
          </Protected>
        } />
        <Route path="/profile" element={
          <Protected>
            {user?.role === 'customer'
              ? <CustomerLayout><Profile /></CustomerLayout>
              : <Layout><Profile /></Layout>}
          </Protected>
        } />

        {/* Staff + Admin routes */}
        <Route path="/orders" element={
          <Protected roles={['admin','staff']}><Layout><Orders /></Layout></Protected>
        } />
        <Route path="/queue" element={
          <Protected roles={['admin','staff']}><Layout><Queue /></Layout></Protected>
        } />
        <Route path="/products" element={
          <Protected roles={['admin','staff']}><Layout><Products /></Layout></Protected>
        } />
        <Route path="/customers" element={
          <Protected roles={['admin','staff']}><Layout><Customers /></Layout></Protected>
        } />
        <Route path="/users" element={
          <Protected roles={['admin']}><Layout><Users /></Layout></Protected>
        } />
      </Routes>

      {user && <Chatbot />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
