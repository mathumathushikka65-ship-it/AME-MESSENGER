import "../../App.css";
import "./Login.css";
import { FaArrowAltCircleRight, FaLock, FaRegAddressCard, FaRegEnvelope } from "react-icons/fa";
import { Form, Link, useNavigate } from "react-router-dom";
import React,  { useState } from "react";

export default function Login(){
   const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

      const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (email === "admin@gmail.com" && password === "123456") {
            setErrorMessage("");
            alert("Login victory!");
            navigate("/dashboard"); 
        } else {
            setErrorMessage("Wrong Email or Password!");
        }
    };
    return(
        <div className="login-page">
                <header className="login-header">
            <Link to="/" className="login-brand">
            <span className="logo-mark">A</span>
            <span className="App-name">AME MESSENGER</span>
            </Link>
      <p> New here? <Link to="/Signup">Create an account </Link>  </p>
        </header>

        <div className="main-content">
            <div className="top-icon">
                 <FaRegEnvelope/>
                 <h1>Welcome back</h1>
                 <p>Sign in to continue to your workspace.</p>
            </div>
         <form onSubmit={handleLoginSubmit} className="login-form">
                    {errorMessage && <p className="error-text" style={{ color: "red" }}>{errorMessage}</p>}

                <div className="input-group">
                        <FaRegEnvelope className="input-icon" />
                        <h4>Email address</h4>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>   

                     <div className="input-group">
                        <FaLock className="input-icon" />
                        <h4>Password</h4>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
<div className="checkbox-forgotpassword">
                <input
                type="checkbox" />
                    <label class="form-check-box" for="exampleCheck1"> Remember Me</label>
                    <h4>Forgot password?</h4>
                    </div>

                    <button type="submit" className="login-btn">
                        Sign In <FaArrowAltCircleRight/>
                    </button>
                </form>
  </div>
      <p className="signup-footer">
          © 2026 AME MESSENGER. All rights reserved.
        </p>   
   
</div>
        
        
    );
}