/**
 * App.js – Root component with all routes defined
 *
 * Route structure:
 *   /login              → Login page (public)
 *   /register           → Register page (public)
 *   /                   → Map page — browse boards (protected)
 *   /board/:id/book     → Booking flow for a specific board (protected)
 *   /my-bookings        → User's booking history (protected)
 *   /simulator/:id      → Board simulator — fullscreen ad display (public)
 *   /admin/*            → Admin dashboard (admin only)
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import SimulatorPage from "./pages/SimulatorPage";
import AdminPage from "./pages/AdminPage";

// ── Route Guards ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return user.role === "admin" ? children : <Navigate to="/" replace />;
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // On first load, fetch the user's profile if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, []);

  return (
    <BrowserRouter>
      {/* Global toast notifications (success, error, info) */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: "14px" },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Board simulator — public so the "screen" can connect without auth */}
        <Route path="/simulator/:boardId" element={<SimulatorPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/board/:boardId/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
