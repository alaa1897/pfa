import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Tv } from "lucide-react";
import useAuthStore from "../store/authStore";
import "./AuthPage.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "", username: "", first_name: "", last_name: "",
    company_name: "", password: "", password_confirm: "",
  });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide card">
        <div className="auth-header">
          <div className="auth-logo"><Tv size={28} /><span>DOOH Platform</span></div>
          <h1>Create account</h1>
          <p>Start advertising on digital screens today</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First name</label>
                <input className="form-input" value={form.first_name} onChange={set("first_name")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input className="form-input" value={form.last_name} onChange={set("last_name")} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={set("username")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Company name (optional)</label>
              <input className="form-input" value={form.company_name} onChange={set("company_name")} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={set("password")} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input className="form-input" type="password" value={form.password_confirm} onChange={set("password_confirm")} required />
              </div>
            </div>
            <button className="btn btn-primary btn-block mt-2" type="submit" disabled={isLoading}>
              {isLoading ? <><div className="spinner" /> Creating account…</> : "Create account"}
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
