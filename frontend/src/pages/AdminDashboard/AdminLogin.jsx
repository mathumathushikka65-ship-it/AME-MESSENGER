import "../../App.css";
import "./AdminLogin.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import API_URL from "../../services/api";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin-auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      // Check whether the logged-in account is an admin
      if (data.user?.role !== "admin") {
        throw new Error("Access denied! Admin account only.");
      }

      if (!data.token) {
        throw new Error("Authentication token not received.");
      }

      // Clear previous login information
      localStorage.removeItem("ameToken");
      localStorage.removeItem("ameUser");

      // Store admin authentication separately
      localStorage.setItem("ameAdminToken", data.token);
      localStorage.setItem("ameAdminUser", JSON.stringify(data.user));

      // Navigate to Admin Dashboard
      navigate("/Admin");

    } catch (error) {
      setErrorMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-brand">
          <img src="/102893.jpg" alt="AME Logo" className="logo-image" />
          <span>AME MESSENGER</span>
        </Link>
      </header>

      <main className="login-main">
        <section className="login-card">

          <div className="login-illustration">
            <div className="illustration-circle">
              <span className="chat-symbol">✉</span>
              <span className="illustration-star">✦</span>
            </div>
          </div>

          <h1>Admin Login</h1>

          <p className="login-subtitle">
            Securely access your AME MESSENGER administration workspace.
          </p>

          <div className="login-divider">
            <span>ADMIN ACCESS ONLY</span>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="email">Admin Email Address</label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="admin@institution.edu"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Admin Password</label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your admin password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="login-error">{errorMessage}</p>
            )}

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading}
            >
              {loading ? "Verifying Admin..." : "Admin Login"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>

          </form>

          <div className="login-divider">
            <span>SECURE ADMINISTRATOR ACCESS</span>
          </div>

          <p className="login-subtitle">
            Only authorized administrators can access this workspace.
          </p>

        </section>

        <p className="login-bottom-text">
          © 2026 AME MESSENGER · Administrator Portal
        </p>
      </main>
    </div>
  );
}