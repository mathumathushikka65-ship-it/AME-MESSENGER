
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Signup.css";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password || !role) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setErrorMessage("");
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed.");
      }

      alert("Account created successfully!");
      navigate("/Login");

    } catch (error) {
      setErrorMessage(error.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link to="/" className="signup-brand">
          <span className="signup-logo">A</span>
          <span>AME MESSENGER</span>
        </Link>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </header>

      <main className="signup-main">
        <form className="signup-form" onSubmit={handleSignupSubmit} noValidate>
          <h2>Create your account</h2>
          <p className="signup-description">
            Join your learning community today.
          </p>

          {errorMessage && <p className="signup-error">{errorMessage}</p>}

          <div className="form-field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="form-field">
            <label htmlFor="role">Select your role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Choose your role</option>
              <option value="student">School Student</option>
              <option value="teacher">Teacher</option>
              <option value="university">University Student</option>
              <option value="course-center">Course Center</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Signup;

