import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";
import { FaArrowRight, FaBell, FaGraduationCap, FaOdnoklassnikiSquare, FaSearch } from "react-icons/fa";


function Home() {
   const [search, setSearch] = useState("");

   return(
    <div className="dashboard">
        {/* Navbar */}
      <nav className="search-box">
             <FaSearch/>
            <input
              type="search"
              placeholder="Search tools and activities..."
              aria-label="Search workspace tools"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div>
               <h4>  Welcome back!</h4>
               <p>Your AME workspace</p>
            </div>
      </nav>


        {/* Top box */}
        <div className="top-box">
     <div><h5>YOUR ACADEMIC WORKSPACE</h5>
         <h1>Everything you need.<br></br>All in one place.</h1>
         <p className="p">Bring assignments, documents, messages and important reminders together with AME MESSENGER.</p>
         <button>Go to Assignments<FaArrowRight/></button>
                                                      </div>    
         <div className="graduatecap"><FaGraduationCap/> </div>
        </div>
           {/* Features */}
        <div>
         <div>
            <span>GET THINGS DONE</span>
            <h1>Your workspace tools</h1>
            <p>Choose a tool to continue with your academic work.</p>
         </div>
         <div></div>
        </div>

        <div className="boxes">
                 <div className="box">
                    <FaOdnoklassnikiSquare/>
                    <h4>Assignments</h4>
                    <p>Organize coursework, instructions and student submissions.</p>
                    <hr></hr>
                    <Link to="/Assignments">Open Assignments <FaArrowRight/></Link> </div>

                 <div className="box"> <h4>Documents</h4>
                    <p>Keep your academic documents organized in one place.</p>
                    <hr></hr>
                    <p>Create Document <FaArrowRight/></p></div>

                 <div className="box"> <h4>Messages</h4>
                    <p>Prepare and organize communication for your institution.</p>
                    <hr></hr>
                    <p>Open Messeges<FaArrowRight/></p></div>

                 <div className="box"> <h4>Reminders</h4>
                    <p>Keep track of important tasks, classes and deadlines.</p>
                    <hr></hr>
                    <p>Open Reminder<FaArrowRight/></p></div>

                 <div className="box"> <h4>Calendar</h4>

                    <p>Keep important academic dates and activities in view.</p>
                    <hr></hr>
                    <p>View Calender<FaArrowRight/></p></div>
        </div> 
        <div className="last-box">
         <div><FaBell/></div>
         <div>
            <span>A LITTLE REMINDER</span>
            <h5>Make time for what matters.</h5>
            <p>Keep upcoming classes, assignments and important dates on your radar.</p>
         </div>
         <button>Explore reminders <FaArrowRight/></button>
        </div>
    </div>
   ); 
} export default Home;