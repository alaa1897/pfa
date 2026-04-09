/**
 * LoginPage
 */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Tv } from "lucide-react";
import useAuthStore from "../store/authStore";
import "./AuthPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo"><Tv size={28} /><span>DOOH Platform</span></div>
          <h1>Sign in</h1>
          <p>Book digital screens across the city</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block mt-2" type="submit" disabled={isLoading}>
              {isLoading ? <><div className="spinner" /> Signing in…</> : "Sign in"}
            </button>
          </form>
          <p className="auth-footer">
            No account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
