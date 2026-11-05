import "./App.css";
import "./Introductionpage.css";
import { Link } from "react-router-dom";
import { FaBell, FaCalendarAlt, FaCamera, FaCheck, FaComment, FaFileAlt, FaFilePdf, FaGraduationCap, FaHome, FaTasks,} from "react-icons/fa";
import logo from "./assets/Neon AME Messenger Logo (2).png";



export default function IntroductionPage() {
  return (
    <div className="introduction-page">
      {/* navbar */}
      <nav className="navbar">
        <div className="Logo">
         <img src={logo} alt="Logo" className="logo"/>
          <span className="App-name">AME MESSENGER</span>
          
        </div>

        <div className="nav-links">
          <a href="#Features">Features</a>
          <a href="#Roles">Roles</a>
          <a href="#Security">Security</a>
        </div>

        <div className="nav-action">
          <Link to="/login" className="login-button">
            Login
          </Link>
          <Link to="/Signup" className="Get-started-button">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero section */}


<section className="Main-div">

  {/* Left side: All text and buttons */}
  <div className="left-paragraph">

    <span className="intro-page">
      <FaGraduationCap />
      For schools and universities
    </span>

    <h1>
      Every tool your institution needs, in one workspace.
    </h1>

    <p className="hero-text">
      Messaging, assignments, reminders, calendar, and documents for
      students, teachers, and officers. One secure platform instead of
      many separate apps.
    </p>

    <div className="hero-buttons">
      <Link to="/Signup" className="Create-account-btn">
        Create account
      </Link>

      <Link to="/login" className="outline-btn">
        Log in
      </Link>
    </div>

    <div className="hero-checks">
      <span>
        <FaCheck className="check-green" /> Free to start
      </span>

      <span>
        <FaCheck className="check-green" /> Role-based access
      </span>

      <span>
        <FaCheck className="check-green" /> Secure by design
      </span>
    </div>

  </div>

  {/* Right side: Dashboard box */}
  <div className="side-box">

    <div className="top-navbar">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>

    <div className="Main-box">

      <aside className="side-navbar">
        <span className="side-icon active">
          <FaHome/>
        </span>

        <span className="side-icon">
          
        </span>

        <span className="side-icon">
          <FaBell/>
        </span>
      </aside>

      <main className="main-content">

        <div className="chat-header">
          <span className="chat-title">Class 10-B</span>
          <span className="chat-sub">Science</span>
        </div>

        <div className="chat-row">
          <div className="avatar avatar-blue">T</div>

          <div className="chat-name">
            Teacher <time>9:10 AM</time>
          </div>

          <div className="file-card">
            <FaFileAlt className="file-icon" />
            <div>
              <div className="file-title">Assignment 3</div>
              <div className="file-sub">Due Friday, 5:00 PM</div>
            </div>
          </div>
        </div>

        <div className="chat-row">
          <div className="avatar avatar-blue">S</div>

          <div>
            <div className="chat-name">
              Student <time>11:42 AM</time>
            </div>

            <div className="file-card file-card-green">
              <FaFileAlt className="file-icon" />
            </div>

            <div className="file-title">assignment-3.pdf</div>
            <div className="file-sub">Submitted and converted</div>
          </div>
        </div>

        <div className="reminder-bar">
          <FaBell /> Reminder: Quiz tomorrow at 9:00 AM
        </div>

      </main>
    </div>
  </div>

</section>


      {/* Section 2 : Features */}
      <section className="features-section" id="Features">
        <div className="section-head">
          <p className="eyebrow">All in one</p>
          <h2>Replace five apps with one</h2>
          <p className="section-text">
            Everything students and staff juggle every day, built into a single
            workspace.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon-wrap">
              <FaComment className="feature-icon" />
            </span>
            <h3>Messenger</h3>
            <p>Direct, class, and group chats in one place.</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-wrap">
              <FaTasks className="feature-icon" />
            </span>
            <h3>Assignments</h3>
            <p>Create, assign, and submit with automatic PDF conversion.</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-wrap">
              <FaBell className="feature-icon" />
            </span>
            <h3>Reminders</h3>
            <p>Never miss a deadline, exam, or class.</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-wrap">
              <FaCalendarAlt className="feature-icon" />
            </span>
            <h3>Calendar</h3>
            <p>Timetables, exams, and events in one view.</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-wrap">
              <FaFilePdf className="feature-icon" />
            </span>
            <h3>File and PDF creator</h3>
            <p>Write documents and export them as PDF.</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-wrap">
              <FaCamera className="feature-icon" />
            </span>
            <h3>Photo editing</h3>
            <p>Quick edits without leaving the app.</p>
          </div>
        </div>
      </section>

      {/* Section 3 : Roles */}
      <section className="roles-section" id="Roles">
        <div className="section-head">
          <p className="eyebrow">Roles</p>
          <h2>Built for everyone on campus</h2>
        </div>

        <div className="role-grid">
          <div className="role-card">
            <h4>Students</h4>
            <ul>
              <li>
                <FaCheck /> Submit work as PDF
              </li>
              <li>
                <FaCheck /> Class and group chat
              </li>
              <li>
                <FaCheck /> Deadline reminders
              </li>
            </ul>
          </div>

          <div className="role-card">
            <h4>Teachers</h4>
            <ul>
              <li>
                <FaCheck /> Create and assign tasks
              </li>
              <li>
                <FaCheck /> Track submissions
              </li>
              <li>
                <FaCheck /> Message classes
              </li>
            </ul>
          </div>

          <div className="role-card">
            <h4>Officers</h4>
            <ul>
              <li>
                <FaCheck /> Announcements
              </li>
              <li>
                <FaCheck /> Requests and approvals
              </li>
              <li>
                <FaCheck /> Reports and timetables
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="cta-section" id="Security">
              <h2>Ready to simplify your institution workspace?</h2>
        <Link to="/Signup" className="Create-account-btn">
          Get Started for Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>© 2026 AME Messenger</span>
        <span>Built for students, teachers, and officers</span>
      </footer>
    </div>
  );
}