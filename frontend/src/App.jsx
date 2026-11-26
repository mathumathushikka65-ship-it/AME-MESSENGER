
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";


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
import PublicSupport from "./pages/contectpage/PublicSupport";
import Document from "./pages/DocumentCreation/Documentcreation";
import Calendar from "./pages/calander/Calander";
import ForgotPassword from "./pages/loginpages/ForgotPassword";
import ResetPassword from "./pages/loginpages/ResetPassword";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

        {/* Public Pages (login aanavanga ulla poga mudiyaadhu) */}
<Route element={<PublicRoute />}>
  <Route path="/" element={<IntroductionPage />} />
  <Route path="/Login" element={<Login />} />
  <Route path="/Signup" element={<Signup />} />
</Route>

{/* Idhu logged-in user-um use pannalam, so PublicRoute-ku veliya */}
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/support" element={<PublicSupport />} />
<Route path="/ame-control-x7k2" element={<AdminLogin />} />

          {/* Normal User Protected Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/Home" element={<Home />} />
            <Route path="/Messenger" element={<Messenger />} />
            <Route path="/Assignment" element={<Assignment />} />
            <Route path="/Assignments" element={<Assignment />} />
            <Route path="/Setting" element={<Setting />} />
            <Route path="/Reminder" element={<Reminder />} />
            <Route path="/Contact" element={<Contact />} />
            <Route path="/DocumentCreation" element={<Document />} />
            <Route path="/Calendar" element={<Calendar />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/Documents" element={<Document />} />
            <Route path="/Reminders" element={<Reminder />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/Settings" element={<Setting />} />
          </Route>

          {/* Admin Protected Page */}
          <Route element={<AdminRoute />}>
            <Route path="/Admin" element={<Admin />} />
          </Route>

          {/* Unknown Route */}
          <Route path="*" element={<h2>404 - Page Not Found</h2>} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
