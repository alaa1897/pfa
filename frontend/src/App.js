/**
 * App.js — Root component with all routes
 *
 * Route structure:
 *   /           → LandingPage   (public only — redirects to /map if logged in)
 *   /login      → AuthPage      (public only)
 *   /register   → AuthPage      (public only)
 *   /map        → MapPage       (protected — was /)
 *   /board/:id/book → BookingPage (protected)
 *   /my-bookings    → MyBookingsPage (protected)
 *   /simulator/:id  → SimulatorPage (public)
 *   /admin          → AdminPage (admin only)
 */
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";

// Pages
import LandingPage    from "./pages/LandingPage";
import AuthPage       from "./pages/AuthPage";
import MapPage        from "./pages/MapPage";
import BookingPage    from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import SimulatorPage  from "./pages/SimulatorPage";
import AdminPage      from "./pages/AdminPage";

// ── Route Guards ──────────────────────────────────────────────────────────────
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

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public landing — redirects to /map if logged in */}
        <Route path="/" element={
          <PublicOnlyRoute><LandingPage /></PublicOnlyRoute>
        }/>

        {/* Auth — public only */}
        <Route path="/login" element={
          <PublicOnlyRoute><AuthPage initialMode="login" /></PublicOnlyRoute>
        }/>
        <Route path="/register" element={
          <PublicOnlyRoute><AuthPage initialMode="register" /></PublicOnlyRoute>
        }/>

        {/* Protected */}
        <Route path="/map" element={
          <ProtectedRoute><MapPage /></ProtectedRoute>
        }/>
        <Route path="/board/:boardId/book" element={
          <ProtectedRoute><BookingPage /></ProtectedRoute>
        }/>
        <Route path="/my-bookings" element={
          <ProtectedRoute><MyBookingsPage /></ProtectedRoute>
        }/>

        {/* Simulator — public (boards run on their own screens) */}
        <Route path="/simulator/:boardId" element={<SimulatorPage />}/>

        {/* Admin only */}
        <Route path="/admin" element={
          <ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>
        }/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />}/>
      </Routes>
    </BrowserRouter>
  );
}
