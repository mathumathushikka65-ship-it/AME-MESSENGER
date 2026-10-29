
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const [fullname, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handleSignupSubmit = (e) => {
        e.preventDefault();

        if (!fullname || !email || !password || !role) {
            setErrorMessage("Please fill in all fields!");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters!");
            return;
        }

        setErrorMessage("");
        alert("Signup successful!");
         navigate("/Home");
    };


  return(
 <center>   <div className="Signup-page">
      <form className="signup-form"  onSubmit={handleSignupSubmit} >

        <h1>AME MESSENGER</h1>
        <h2>Create Your Account</h2>

        <p className="signup-description"> Join your learning community today. </p>

           {errorMessage && ( <p className="signup-error">{errorMessage}</p> )}

        <label className="label" htmlFor="Name">Full Name</label>
          <input    type="text"
                    placeholder="Enter your full name"
                    value={ fullname}
                    onChange={(e) => setName(e.target.value)}/>  

          <label htmlFor="Email">Email Address</label>
          <input    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} />

           <label htmlFor="Password">Password</label>
           <input   type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} />

           <label htmlFor="Select Your Role">Select Your Role</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" className="option">Choose your role</option>
                    <option value="student">School Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="university">University Student</option>
                    <option value="course-center">Course Center</option>
                    <option value="other">Other</option>
                </select>

                 <button type="submit" className="signup-button">
                    Create Account
                </button>

                <p className="login-link">
                    Already have an account? <Link to="/Login">Login</Link>
                </p>
      </form>
    </div> </center>
  );
}
   

export default Signup;
