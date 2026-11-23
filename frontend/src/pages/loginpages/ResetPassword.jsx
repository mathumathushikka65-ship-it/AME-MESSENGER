import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API_URL from "../../services/api";
import "./Login.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to reset password.");
      setMessage(data.message || "Password updated.");
      window.setTimeout(() => navigate("/Login"), 1200);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <div className="login-page"><header className="login-header"><Link to="/" className="login-brand"><img src="/102893.jpg" alt="AME Logo" className="logo-image"/><span>AME MESSENGER</span></Link><p><Link to="/Login">Back to login</Link></p></header><main className="login-main"><section className="login-card"><h1>Create a new password</h1><p className="login-subtitle">Choose a strong password with at least 8 characters.</p>{!token ? <p className="login-error">This reset link is missing. Request a new one.</p> : <form onSubmit={submit}><div className="form-group"><label htmlFor="new-password">New password</label><input id="new-password" type="password" minLength="8" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required/></div><div className="form-group"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" minLength="8" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required/></div>{message && <p className="login-success">{message}</p>}{error && <p className="login-error">{error}</p>}<button className="sign-in-button" type="submit" disabled={loading}>{loading ? "Updating..." : "Update password"}</button></form>}<p className="login-footer"><Link to="/forgot-password">Request another reset link</Link></p></section></main></div>;
}