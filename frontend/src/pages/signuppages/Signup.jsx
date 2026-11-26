
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF } from "react-icons/fa";
import { firebaseAuth, isFirebaseConfigured } from "../../firebase";
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "firebase/auth";
import API_URL from "../../services/api";
import "./Signup.css";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // CHECK PASSWORD MATCH
  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordsMismatch =
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  // SIGNUP SUBMIT
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword ||
      !role
    ) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    // CONFIRM PASSWORD VALIDATION
    if (password !== confirmPassword) {
      setErrorMessage(
        "Passwords do not match. Please check your password."
      );
      return;
    }

    try {
      setErrorMessage("");
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: fullName.trim(),
            email: email.trim(),
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed.");
      }

      alert("Account created successfully!");

      localStorage.setItem("ameUser", JSON.stringify(data.user));

      navigate("/Login");

    } catch (error) {
      setErrorMessage(
        error.message || "Unable to connect to the server."
      );

    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (providerName) => {
    setErrorMessage("");
    if (!isFirebaseConfigured || !firebaseAuth) {
      setErrorMessage("Social signup is not configured. Please contact Admin or use email signup.");
      return;
    }
    setLoading(true);
    try {
      const provider = providerName === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();
      if (providerName === "facebook") provider.addScope("email");
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(firebaseAuth, provider);
      const idToken = await credential.user.getIdToken();
      const response = await fetch(`${API_URL}/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role: role || "student" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Social signup failed.");
      localStorage.setItem("ameToken", data.token);
      localStorage.setItem("ameUser", JSON.stringify(data.user));
      navigate("/Home", { replace: true });
    } catch (error) {
      setErrorMessage(error.code === "auth/popup-closed-by-user" ? "Sign-up window was closed." : error.message || "Social signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* HEADER */}
      <header className="signup-header">

        <Link to="/" className="signup-brand">
          <img
            src="/102893.jpg"
            alt="AME Logo"
            className="logo-image"
          />

          <span>AME MESSENGER</span>
        </Link>

        <p>
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>

      </header>

      {/* SIGNUP FORM */}
      <main className="signup-main">

        <form
          className="signup-form"
          onSubmit={handleSignupSubmit}
          noValidate
        >

          <h2>Create your account</h2>

          <p className="signup-description">
            Join your learning community today.
          </p>

          {errorMessage && (
            <p className="signup-error">
              {errorMessage}
            </p>
          )}

          {/* FULL NAME */}
          <div className="form-field">

            <label htmlFor="fullName">
              Full name
            </label>

            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrorMessage("");
              }}
            />

          </div>

          {/* EMAIL */}
          <div className="form-field">

            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
            />

          </div>

          {/* PASSWORD */}
          <div className="form-field">

            <label htmlFor="password">
              Password
            </label>

            <div className="password-wrapper">

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>

            </div>

          </div>

          {/* CONFIRM PASSWORD */}
          <div className="form-field">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div
              className={`password-wrapper confirm-password-wrapper ${
                passwordsMatch
                  ? "password-matched"
                  : passwordsMismatch
                    ? "password-not-matched"
                    : ""
              }`}
            >

              <input
                id="confirmPassword"
                type={
                  showConfirmPassword ? "text" : "password"
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>

            </div>

            {/* LIVE PASSWORD MATCH STATUS */}
            {passwordsMatch && (
              <p className="password-match-message match">
                ✓ Passwords match.
              </p>
            )}

            {passwordsMismatch && (
              <p className="password-match-message mismatch">
                ✕ Passwords do not match.
              </p>
            )}

          </div>

          {/* ROLE */}
          <div className="form-field">

            <label htmlFor="role">
              Select your role
            </label>

            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setErrorMessage("");
              }}
            >
              <option value="">Choose your role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>

          </div>

          <div className="signup-social-actions">
            <button type="button" onClick={() => handleSocialSignup("google")} disabled={loading}><FaGoogle /> Continue with Google</button>
            <button type="button" onClick={() => handleSocialSignup("facebook")} disabled={loading}><FaFacebookF /> Continue with Facebook</button>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

      </main>
    </div>
  );
}

export default Signup;
























