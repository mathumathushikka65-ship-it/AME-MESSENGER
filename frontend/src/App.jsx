import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "./pages/loginpages/Login";
import Signup from "./pages/signuppages/Signup";
import IntroductionPage from "./Introductionpage";
import Home from "./pages/Homepage/Home";
import Messenger from "./pages/Messenger/Messenger";
import Assignment from "./pages/Assignments/Assignment";
import Setting from "./pages/settings/Setting";
import Reminder from "./pages/Reminder/Reminder";
import Admin from "./pages/AdminDashboard/Admin";
import AdminLogin from "./pages/AdminDashboard/AdminLogin";
import Contact from "./pages/contectpage/Contact";
import Document from "./pages/DocumentCreation/Documentcreation";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<IntroductionPage />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />

        {/* Separate Admin Login */}
        <Route path="/AdminLogin" element={<AdminLogin />} />

        {/* Normal User Protected Pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/Home" element={<Home />} />
          <Route path="/Messenger" element={<Messenger />} />
          <Route path="/Assignment" element={<Assignment />} />
          <Route path="/Setting" element={<Setting />} />
          <Route path="/Reminder" element={<Reminder />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/DocumentCreation" element={<Document />} />
        </Route>

        {/* Admin Protected Page */}
        <Route element={<AdminRoute />}>
          <Route path="/Admin" element={<Admin />} />
        </Route>

        {/* Unknown Route */}
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
