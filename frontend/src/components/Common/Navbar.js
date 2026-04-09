/**
 * Navbar
 * Shows the app logo, navigation links, and user menu.
 */

import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MapPin, Calendar, LayoutDashboard, LogOut, Tv } from "lucide-react";
import useAuthStore from "../../store/authStore";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <Tv size={22} />
          <span>DOOH<strong>Platform</strong></span>
        </Link>

        {/* Nav links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            <MapPin size={16} />
            Boards Map
          </Link>
          <Link to="/my-bookings" className={`nav-link ${isActive("/my-bookings") ? "active" : ""}`}>
            <Calendar size={16} />
            My Bookings
          </Link>
          {user?.role === "admin" && (
            <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`}>
              <LayoutDashboard size={16} />
              Admin
            </Link>
          )}
        </div>

        {/* User menu */}
        <div className="navbar-user">
          <span className="user-name">{user?.full_name || user?.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
