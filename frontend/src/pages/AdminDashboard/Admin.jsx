import React, { useState } from "react";
import "./Admin.css";

import {
  FaHome,
  FaUsers,
  FaTasks,
  FaFileAlt,
  FaComments,
  FaBell,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaBars,
  FaTimes,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserShield,
  FaUserPlus,
  FaCheckCircle,
  FaClock,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaDownload,
  FaEnvelope,
} from "react-icons/fa";

export default function Admin() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const menuItems = [
    { name: "Dashboard", icon: <FaHome /> },
    { name: "Users", icon: <FaUsers /> },
    { name: "Assignments", icon: <FaTasks /> },
    { name: "Documents", icon: <FaFileAlt /> },
    { name: "Messages", icon: <FaComments /> },
    { name: "Reminders", icon: <FaBell /> },
    { name: "Analytics", icon: <FaChartBar /> },
    { name: "Settings", icon: <FaCog /> },
  ];

  const users = [
    { name: "Arun Kumar", email: "arun@gmail.com", role: "Student", status: "Active" },
    { name: "Priya Devi", email: "priya@gmail.com", role: "Teacher", status: "Active" },
    { name: "Nimal Raj", email: "nimal@gmail.com", role: "Student", status: "Pending" },
    { name: "Kavitha S", email: "kavitha@gmail.com", role: "Officer", status: "Active" },
    { name: "Sanjay M", email: "sanjay@gmail.com", role: "Student", status: "Inactive" },
  ];

  const activities = [
    { title: "New user registered", detail: "Arun Kumar joined as Student", time: "5 minutes ago", icon: <FaUserPlus /> },
    { title: "Assignment created", detail: "Mathematics Assignment", time: "20 minutes ago", icon: <FaTasks /> },
    { title: "New document uploaded", detail: "Science Notes.pdf", time: "1 hour ago", icon: <FaFileAlt /> },
    { title: "New reminder created", detail: "Project submission reminder", time: "2 hours ago", icon: <FaBell /> },
    { title: "New message activity", detail: "New conversation started", time: "3 hours ago", icon: <FaComments /> },
  ];

  const stats = [
    { title: "Total Users", number: "1,250", change: "+12.5%", icon: <FaUsers />, color: "blue" },
    { title: "Students", number: "950", change: "+8.2%", icon: <FaGraduationCap />, color: "purple" },
    { title: "Teachers", number: "180", change: "+5.4%", icon: <FaChalkboardTeacher />, color: "green" },
    { title: "Officers", number: "120", change: "+3.1%", icon: <FaUserShield />, color: "orange" },
    { title: "Assignments", number: "320", change: "+15.8%", icon: <FaTasks />, color: "pink" },
    { title: "Documents", number: "485", change: "+9.6%", icon: <FaFileAlt />, color: "cyan" },
    { title: "Messages", number: "2,840", change: "+18.2%", icon: <FaComments />, color: "indigo" },
    { title: "Reminders", number: "156", change: "+6.7%", icon: <FaBell />, color: "yellow" },
  ];

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const renderDashboard = () => (
    <>
      <div className="admin-welcome">
        <div>
          <h2>Welcome back, Admin! 👋</h2>
          <p>Here's what's happening in your AME MESSENGER today.</p>
        </div>
        <div className="admin-date">
          <FaCalendarAlt /> {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="admin-stats-grid">
        {stats.map((stat, index) => (
          <div className="admin-stat-card" key={index}>
            <div className={`admin-stat-icon ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p>{stat.title}</p>
              <h2>{stat.number}</h2>
              <span className="admin-growth">{stat.change} from last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Platform Overview</h3>
              <p>Monthly platform activity</p>
            </div>
            <select defaultValue="This Year">
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
            </select>
          </div>

          <div className="admin-chart">
            {[45, 65, 50, 80, 60, 90, 70, 95, 75, 85, 65, 100].map((height, i) => (
              <div className="admin-chart-column" key={i}>
                <div
                  className="admin-chart-bar"
                  style={{ height: `${height}%` }}
                />
                <span>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>User Distribution</h3>
              <p>Users by role</p>
            </div>
          </div>

          <div className="admin-distribution">
            <div className="admin-donut">
              <div>
                <h2>1,250</h2>
                <span>Total Users</span>
              </div>
            </div>

            <div className="admin-legend">
              <p><i className="legend-student" /> Students <b>76%</b></p>
              <p><i className="legend-teacher" /> Teachers <b>14%</b></p>
              <p><i className="legend-officer" /> Officers <b>10%</b></p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel admin-activity-panel">
        <div className="admin-panel-heading">
          <div>
            <h3>Recent Activities</h3>
            <p>Latest activities across the platform</p>
          </div>
          <button onClick={() => setActivePage("Analytics")}>View All</button>
        </div>

        <div className="admin-activity-list">
          {activities.map((activity, index) => (
            <div className="admin-activity-item" key={index}>
              <div className="admin-activity-icon">{activity.icon}</div>
              <div className="admin-activity-details">
                <h4>{activity.title}</h4>
                <p>{activity.detail}</p>
              </div>
              <span>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderUsers = () => (
    <div className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>User Management</h3>
          <p>Manage all registered users</p>
        </div>
        <button className="admin-primary-btn" onClick={() => alert("Connect this action to your user registration backend.")}>
          <FaUserPlus /> Add User
        </button>
      </div>

      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder="Search name, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={index}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`admin-status ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button className="admin-icon-btn" title="View user" onClick={() => alert(`${user.name}\n${user.email}\n${user.role}\n${user.status}`)}>
                    <FaEye />
                  </button>
                  <button className="admin-icon-btn delete" title="Delete (demo)" onClick={() => alert("Connect deletion to your backend first.")}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="5">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMonitor = (title, description, icon) => (
    <div className="admin-panel admin-empty-panel">
      <div className="admin-empty-icon">{icon}</div>
      <h3>{title} Monitoring</h3>
      <p>{description}</p>
      <p className="admin-demo-note">
        Actual records will appear here after connecting the database.
      </p>
    </div>
  );

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();
      case "Users":
        return renderUsers();
      case "Assignments":
        return renderMonitor("Assignment", "Monitor assignments created by teachers and students.", <FaTasks />);
      case "Documents":
        return renderMonitor("Document", "Monitor uploaded and created documents.", <FaFileAlt />);
      case "Messages":
        return renderMonitor("Message", "Monitor messaging activity and conversations.", <FaComments />);
      case "Reminders":
        return renderMonitor("Reminder", "Monitor upcoming and completed reminders.", <FaBell />);
      case "Analytics":
        return renderMonitor("Analytics", "View platform growth and activity reports.", <FaChartBar />);
      case "Settings":
        return renderMonitor("Settings", "Manage administrator preferences and platform settings.", <FaCog />);
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-logo">
          <div className="admin-logo-icon">A</div>
          <div>
            <h2>AME</h2>
            <span>MESSENGER</span>
          </div>
          <button className="admin-close-sidebar" onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="admin-sidebar-label">MAIN MENU</div>

        <nav className="admin-menu">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={activePage === item.name ? "active" : ""}
              onClick={() => {
                setActivePage(item.name);
                setSidebarOpen(false);
                setSearch("");
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div>
              <h4>Administrator</h4>
              <span>Super Admin</span>
            </div>
          </div>

          <button className="admin-logout" onClick={() => alert("Connect this button to your authentication logout.")}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)}>
              <FaBars />
            </button>
            <div>
              <h2>{activePage}</h2>
              <p>AME MESSENGER / {activePage}</p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button className="admin-notification" onClick={() => setActivePage("Reminders")}>
              <FaBell />
              <span />
            </button>
            <div className="admin-top-avatar">A</div>
          </div>
        </header>

        <section className="admin-content">
          {renderContent()}
        </section>

        <footer className="admin-footer">
          © 2026 AME MESSENGER. All rights reserved.
        </footer>
      </main>
    </div>
  );
}