
import "../../App.css";
import "./Login.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaFacebookF, FaEyeSlash, FaEye } from "react-icons/fa";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const currentUser = JSON.parse(
  localStorage.getItem("ameUser") || "null"
);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
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
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("ameToken", data.token);
      localStorage.setItem("ameUser", JSON.stringify(data.user));

      navigate("/Home");

    } catch (error) {
      setErrorMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("Google login requires OAuth configuration.");
  };

  const handleFacebookLogin = () => {
    alert("Facebook login requires OAuth configuration.");
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-brand">
          <span className="brand-icon">A</span>
          <span>AME MESSENGER</span>
        </Link>

        <p>
          New here? <Link to="/Signup">Create an account</Link>
        </p>
      </header>

      <main className="login-main">
        <section className="login-card">
          <div className="login-illustration">
            <div className="illustration-circle">
              <span className="chat-symbol">✉</span>
              <span className="illustration-star">✦</span>
            </div>
          </div>

          <h1>Welcome back</h1>

          <p className="login-subtitle">
            Log in to continue to your workspace.
          </p>

          <div className="social-login">
            <button
              type="button"
              className="social-button google-button"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="google-icon" />
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="social-button facebook-button"
              onClick={handleFacebookLogin}
            >
              <FaFacebookF className="facebook-icon" />
              <span>Continue with Facebook</span>
            </button>
          </div>

          <div className="login-divider">
            <span>OR LOGIN WITH EMAIL</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@institution.edu"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
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

            <div className="login-options">
              <label className="remember-option">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="login-divider">
            <span>SECURE ACCESS FOR YOUR INSTITUTION</span>
          </div>

          <p className="login-footer">
            Don't have an account?{" "}
            <Link to="/Signup">Create one</Link>
          </p>
        </section>

        <p className="login-bottom-text">
          © 2026 AME MESSENGER · Connecting your campus
        </p>
      </main>
    </div>
  );
}
