import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Success from "./pages/Success";
import Home from "./pages/Home";
import Checkout from "./pages/checkout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";

function AppRoutes() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
        ) : (
          <Login />
        )
      } />
      
      {/* Customer Routes */}
      <Route path="/" element={
        <ProtectedRoute requireCustomer>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute requireCustomer>
          <Checkout />
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
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
