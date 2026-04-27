/**
 * App.js – Root component with all routes
 *
 * Route structure:
 *   /               → LandingPage (public only)
 *   /login          → AuthPage login mode (public only)
 *   /register       → AuthPage register mode (public only)
 *   /map            → MapPage (protected)
 *   /board/:id/book → BookingPage (protected)
 *   /my-bookings    → MyBookingsPage (protected)
 *   /simulator/:id  → SimulatorPage (public)
 *   /admin          → AdminPage (admin only)
 */
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

// Pages
import LandingPage    from "./pages/LandingPage";
import AuthPage       from "./pages/AuthPage";
import MapPage        from "./pages/MapPage";
import BookingPage    from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import SimulatorPage  from "./pages/SimulatorPage";
import AdminPage      from "./pages/AdminPage";

// Global robot notification — replaces react-hot-toast entirely
import RobotNotification from "./components/Common/RobotNotification";

// ── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return user.role === "admin" ? children : <Navigate to="/map" replace />;
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/map" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const fetchProfile    = useAuthStore((s) => s.fetchProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
  }, []);

  return (
    <BrowserRouter>
      {/* Robot notification — mounted once, visible globally */}
      <RobotNotification />

      <Routes>
        <Route path="/" element={
          <PublicOnlyRoute><LandingPage /></PublicOnlyRoute>
        }/>
        <Route path="/login" element={
          <PublicOnlyRoute><AuthPage initialMode="login" /></PublicOnlyRoute>
        }/>
        <Route path="/register" element={
          <PublicOnlyRoute><AuthPage initialMode="register" /></PublicOnlyRoute>
        }/>
        <Route path="/map" element={
          <ProtectedRoute><MapPage /></ProtectedRoute>
        }/>
        <Route path="/board/:boardId/book" element={
          <ProtectedRoute><BookingPage /></ProtectedRoute>
        }/>
        <Route path="/my-bookings" element={
          <ProtectedRoute><MyBookingsPage /></ProtectedRoute>
        }/>
        <Route path="/simulator/:boardId" element={<SimulatorPage />}/>
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminRoute><AdminPage /></AdminRoute>
          </ProtectedRoute>
        }/>
        <Route path="*" element={<Navigate to="/" replace />}/>
      </Routes>
    </BrowserRouter>
  );
}
