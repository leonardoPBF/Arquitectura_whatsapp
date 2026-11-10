import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Success from './pages/Success';
import Home from './pages/Home';
import Checkout from './pages/checkout';
import CheckoutCart from './pages/CheckoutCart';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import Landing from './pages/Landing';
import { LoadingScreen } from './components/LoadingScreen';

function AppRoutes() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={
        loading ? <LoadingScreen message="Verificando tu sesión..." /> : isAuthenticated ? (
          isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/tienda" replace />
        ) : (
          <Login />
        )
      } />
      
      {/* Customer Routes */}
      <Route path="/tienda" element={
        <ProtectedRoute requireCustomer>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute requireCustomer>
          <Checkout />
        </ProtectedRoute>
      } />
      <Route path="/checkout-cart" element={
        <ProtectedRoute requireCustomer>
          <CheckoutCart />
        </ProtectedRoute>
      } />
      <Route path="/success" element={
        <ProtectedRoute requireCustomer>
          <Success />
        </ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute requireCustomer>
          <MyOrders />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requireAdmin>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <Admin />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function UserCart({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <CartProvider key={user?.id || 'guest'}>{children}</CartProvider>;
}

export default function App() {
  return (
    <AuthProvider>
      <UserCart>
        <Router>
          <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', border: '1px solid hsl(var(--border))' } }} />
          <AppRoutes />
        </Router>
      </UserCart>
    </AuthProvider>
  );
}
