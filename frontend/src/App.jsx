
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
import Contact from "./pages/contectpage/Contact";
import ProtectedRoute from "./components/ProtectedRoute";
import Document from "./pages/DocumentCreation/Documentcreation";





function App() {
  return (
<BrowserRouter><Routes>
  
  <Route path="/" element={<IntroductionPage/>} />
  <Route path="/Login" element={<Login />} />
  <Route path="/signup" element={<Signup/>} />
  <Route element={<ProtectedRoute/>}>
   <Route path="/Home" element={ <Home/>} />
  <Route path="/Messenger" element={<Messenger/>} />
  <Route path="/Assignment" element={<Assignment/>}/> 
  <Route path="/Setting"  element={<Setting/>}/>
  <Route path="/Reminder" element={<Reminder/>}/>
  <Route path="/Admin" element={<Admin/>}/>
  <Route path="/Contact" element={<Contact/>}/>
  <Route path="/DocumentCreation" element={<Document/>}/>

  </Route>
  </Routes>


  
  </BrowserRouter>

  

  );
}

export default App;