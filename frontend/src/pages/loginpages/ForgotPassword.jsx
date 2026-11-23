import React, { useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../../services/api";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setError(""); setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not request password reset.");
      setMessage(data.message || "Check your email for the password reset link.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <div className="login-page"><header className="login-header"><Link to="/" className="login-brand"><img src="/102893.jpg" alt="AME Logo" className="logo-image"/><span>AME MESSENGER</span></Link><p><Link to="/Login">Back to login</Link></p></header><main className="login-main"><section className="login-card"><h1>Forgot password?</h1><p className="login-subtitle">Enter your account email and we’ll send a secure reset link.</p><form onSubmit={submit}><div className="form-group"><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@institution.edu"/></div>{message && <p className="login-success">{message}</p>}{error && <p className="login-error">{error}</p>}<button className="sign-in-button" type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</button></form><p className="login-footer"><Link to="/Login">Return to login</Link></p></section></main></div>;
}