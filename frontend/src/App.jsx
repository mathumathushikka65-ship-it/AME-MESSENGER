
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/loginpages/Login";
import Signup from "./pages/signuppages/Signup";
import IntroductionPage from "./Introductionpage";

import Home from "./pages/Homepage/Home";
import Assignments from "./pages/Assignments/Assignments";
import Messenger from "./pages/Messenger/Messenger";



function App() {
  return (
<BrowserRouter><Routes>
  
  <Route path="/" element={<IntroductionPage/>} />
  <Route path="/Login" element={<Login />} />
  <Route path="/signup" element={<Signup/>} />
   <Route path="/Home" element={ <Home/>} />
   <Route path="/Assignments" element={<Assignments/>} />
   <Route path="/Messenger" element={<Messenger/>} />
   

  </Routes>

  
  </BrowserRouter>

  

  );
}

export default App;