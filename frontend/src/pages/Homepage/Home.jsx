
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTasks,
  FaFileAlt,
  FaComments,
  FaBell,
  FaCalendarAlt,
  FaSearch,
  FaSignOutAlt,
  FaPlus,
  FaBars,
  FaTimes,
  FaArrowRight,
  FaGraduationCap,
} from "react-icons/fa";
import "./Home.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("ameUser") || "null"
  );

  const features = [
    {
      title: "Assignments",
      description: "Organize coursework, instructions and student submissions.",
      icon: <FaTasks />,
      color: "purple",
      action: "Open Assignments",
      path: "/Assignment",
    },
    {
      title: "Documents",
      description: "Keep your academic documents organized in one place.",
      icon: <FaFileAlt />,
      color: "blue",
      action: "Create Document",
      path: "/DocumentCreation",
    },
    {
      title: "Messages",
      description: "Prepare and organize communication for your institution.",
      icon: <FaComments />,
      color: "green",
      action: "Open Messages",
      path: "/Messenger"
    },
    {
      title: "Reminders",
      description: "Keep track of important tasks, classes and deadlines.",
      icon: <FaBell />,
      color: "orange",
      action: " open Reminder",
      path: "/Reminder",
    },
    {
      title: "Calendar",
      description: "Keep important academic dates and activities in view.",
      icon: <FaCalendarAlt />,
      color: "pink",
      action: "View Calendar",
    },
  ];

  const filteredFeatures = features.filter((feature) =>
    `${feature.title} ${feature.description}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  const handleFeatureClick = (feature) => {
    setMenuOpen(false);

    if (feature.path) {
      navigate(feature.path);
    } else {
      alert(`${feature.title} page is not available yet.`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ameToken");
    localStorage.removeItem("ameUser");

    navigate("/Login", { replace: true });
  };

  return (
    <div className="dashboard">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <img src="/102893.jpg" alt="AME Logo" className="logo-image" />
          <span>AME Messanger </span>

          <button
            type="button"
            className="close-menu"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <Link
            to="/Home"
            className="sidebar-link active"
            onClick={() => setMenuOpen(false)}
          >
            <FaHome />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/Assignment"
            className="sidebar-link"
            onClick={() => setMenuOpen(false)}
          >
            <FaTasks />
            <span>Assignments</span>
          </Link>

          <Link
            to="/DocumentCreation"
            type="button"
            className="sidebar-link"
          >
            <FaFileAlt />
            <span>Documents</span>
          </Link>

          <Link
            type="button"
            className="sidebar-link"
          >
            <FaComments />
            <span>Messages</span>
          </Link>

          <Link
            to="/Reminder"
            className="sidebar-link"
            onClick={() => setMenuOpen(false)}
          >
            <FaBell />
            <span>Reminders</span>
          </Link>

          <button
            type="button"
            className="sidebar-link"
            onClick={() => alert("Calendar page is coming soon!")}
          >
            <FaCalendarAlt />
            <span>Calendar</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">
              <FaGraduationCap />
            </div>
            <h4>Your learning space</h4>
            <p>
              Keep your academic activities together and stay organized.
            </p>
          </div>

          <button
            type="button"
            className="logout-link"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className="header-search">
            <FaSearch />
            <input
              type="search"
              placeholder="Search tools and activities..."
              aria-label="Search workspace tools"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="header-profile">
            <Link to="/Setting" className="profile-avatar">
              {currentUser?.username?.charAt(0).toUpperCase() || "A"}
            </Link>

            <div className="profile-details">
              <strong>
                Welcome, {currentUser?.username || "User"}!
              </strong>

              <span>
                {currentUser?.email || "Your AME workspace"}
              </span>

              <span>
                {currentUser?.role || "Member"}
              </span>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <section className="dashboard-welcome">
            <div className="welcome-copy">
              <span className="welcome-badge">
                YOUR ACADEMIC WORKSPACE
              </span>

              <h1>
                Everything you need.
                <br />
                All in one place.
              </h1>

              <p>
                Bring assignments, documents, messages and important
                reminders together with AME MESSENGER.
              </p>

              <button
                type="button"
                className="welcome-primary"
                onClick={() => navigate("/Assignment")}
              >
                Go to Assignments
                <FaArrowRight />
              </button>
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="welcome-decoration-circle">
                <FaGraduationCap />
              </div>
              <span className="decoration-dot dot-one" />
              <span className="decoration-dot dot-two" />
              <span className="decoration-dot dot-three" />
            </div>
          </section>

          <div className="section-heading">
            <div>
              <span className="section-kicker">GET THINGS DONE</span>
              <h2>Your workspace tools</h2>
              <p>Choose a tool to continue with your academic work.</p>
            </div>

            <span className="tool-count">
              {filteredFeatures.length}{" "}
              {filteredFeatures.length === 1 ? "tool" : "tools"}
            </span>
          </div>

          <div className="feature-grid">
            {filteredFeatures.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-card-top">
                  <div className={`feature-icon ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <span className="feature-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <button
                  type="button"
                  className="feature-action"
                  onClick={() => handleFeatureClick(feature)}
                >
                  <span>{feature.action}</span>
                  <FaArrowRight />
                </button>
              </article>
            ))}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="no-results">
              <FaSearch />
              <h3>No matching tools</h3>
              <p>Try another keyword to find what you need.</p>
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            </div>
          )}

          <section className="quick-start">
            <div className="quick-start-icon">
              <FaBell />
            </div>

            <div className="quick-start-copy">
              <span className="section-kicker">A LITTLE REMINDER</span>
              <h3>Make time for what matters.</h3>
              <p>
                Keep upcoming classes, assignments and important dates
                on your radar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => alert("Reminder page is coming soon!")}
            >
              Explore reminders
              <FaArrowRight />
            </button>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 AME MESSENGER</span>
            <span>Built for your learning community.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default Home;
