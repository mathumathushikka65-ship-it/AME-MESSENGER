import React, { useState, useEffect } from "react";
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
  FaTrash,
  FaEye,
  FaCalendarAlt,
} from "react-icons/fa";
import API_URL from "../../services/api";

// ---------- API setup ----------
const API = `${API_URL}/admin`;

const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem("ameAdminToken"); // Login.jsx save panra key

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ---------- helpers ----------
const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

const fmtDate = (date) => (date ? new Date(date).toLocaleDateString() : "-");

const activityIcons = {
  user: <FaUserPlus />,
  assignment: <FaTasks />,
  document: <FaFileAlt />,
  reminder: <FaBell />,
  message: <FaComments />,
};

// Monitor pages: endpoint + table columns
const monitorConfig = {
  Assignments: {
    title: "Assignment",
    path: "/assignments",
    icon: <FaTasks />,
    columns: [
      ["Title", (i) => i.title],
      ["Subject", (i) => i.subject],
      ["Owner", (i) => i.user?.username || "-"],
      ["Due Date", (i) => fmtDate(i.dueDate)],
      ["Priority", (i) => i.priority || "-"],
      ["Status", (i) => i.status || "-"],
    ],
  },
  Documents: {
    title: "Document",
    path: "/documents",
    icon: <FaFileAlt />,
    columns: [
      ["Title", (i) => i.title],
      ["Owner", (i) => i.owner?.username || "-"],
      ["Created", (i) => fmtDate(i.createdAt)],
      ["Updated", (i) => fmtDate(i.updatedAt)],
    ],
  },
  Messages: {
    title: "Message",
    path: "/messages",
    icon: <FaComments />,
    columns: [
      ["Sender", (i) => i.sender?.username || "-"],
      ["Type", (i) => i.messageType],
      ["Sent At", (i) => new Date(i.createdAt).toLocaleString()],
    ],
  },
  Reminders: {
    title: "Reminder",
    path: "/reminders",
    icon: <FaBell />,
    columns: [
      ["Title", (i) => i.title],
      ["Category", (i) => i.category || "-"],
      ["Date", (i) => fmtDate(i.date)],
      ["Time", (i) => i.time],
      ["Priority", (i) => i.priority || "-"],
      ["Completed", (i) => (i.completed ? "Yes" : "No")],
    ],
  },
};

const emptyForm = { username: "", email: "", password: "", role: "student" };

export default function Admin() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  // backend data
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState(new Array(12).fill(0));
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [monitorData, setMonitorData] = useState({});
  const [error, setError] = useState("");

  // add user modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  // ---------- load data ----------
  const loadStats = () =>
    authFetch("/stats").then(setStats).catch((e) => setError(e.message));

  useEffect(() => {
    loadStats();
    authFetch("/chart").then(setChart).catch((e) => setError(e.message));
    authFetch("/activities").then(setActivities).catch((e) => setError(e.message));
    authFetch("/users").then(setUsers).catch((e) => setError(e.message));
  }, []);

  // monitor page open aagum bodhu andha page data load
  useEffect(() => {
    const config = monitorConfig[activePage];
    if (!config) return;

    authFetch(config.path)
      .then((data) => setMonitorData((prev) => ({ ...prev, [activePage]: data })))
      .catch((e) => setError(e.message));
  }, [activePage]);

  // ---------- actions ----------
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await authFetch(`/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      loadStats();
    } catch (e) {
      alert(e.message);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      const updated = await authFetch(`/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e) {
      alert(e.message);
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const created = await authFetch("/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUsers((prev) => [created, ...prev]);
      setShowAddUser(false);
      setForm(emptyForm);
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("ameAdminToken");
    localStorage.removeItem("ameAdminUser");
    window.location.href = "/Login";
  };

  // ---------- derived data ----------
  const changeText = (card) =>
    card ? `${card.change >= 0 ? "+" : ""}${card.change}%` : "";

  const cardNumber = (card) => (card ? card.count.toLocaleString() : "...");

  const stat = (key) => (stats ? stats[key] : null);

  const statCards = [
    { title: "Total Users", key: "totalUsers", icon: <FaUsers />, color: "blue" },
    { title: "Students", key: "students", icon: <FaGraduationCap />, color: "purple" },
    { title: "Teachers", key: "teachers", icon: <FaChalkboardTeacher />, color: "green" },
    { title: "Officers", key: "officers", icon: <FaUserShield />, color: "orange" },
    { title: "Assignments", key: "assignments", icon: <FaTasks />, color: "pink" },
    { title: "Documents", key: "documents", icon: <FaFileAlt />, color: "cyan" },
    { title: "Messages", key: "messages", icon: <FaComments />, color: "indigo" },
    { title: "Reminders", key: "reminders", icon: <FaBell />, color: "yellow" },
  ];

  const totalUsers = stats ? stats.totalUsers.count : 0;
  const percent = (card) =>
    totalUsers && card ? Math.round((card.count / totalUsers) * 100) : 0;

  const maxChart = Math.max(...chart, 1);

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ---------- pages ----------
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
        {statCards.map((item) => (
          <div className="admin-stat-card" key={item.key}>
            <div className={`admin-stat-icon ${item.color}`}>{item.icon}</div>
            <div>
              <p>{item.title}</p>
              <h2>{cardNumber(stat(item.key))}</h2>
              <span className="admin-growth">
                {changeText(stat(item.key))} from last month
              </span>
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
            </select>
          </div>

          <div className="admin-chart">
            {chart.map((value, i) => (
              <div className="admin-chart-column" key={i}>
                <div
                  className="admin-chart-bar"
                  style={{ height: `${Math.max((value / maxChart) * 100, 2)}%` }}
                  title={`${value} activities`}
                />
                <span>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                </span>
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
                <h2>{totalUsers.toLocaleString()}</h2>
                <span>Total Users</span>
              </div>
            </div>

            <div className="admin-legend">
              <p><i className="legend-student" /> Students <b>{percent(stat("students"))}%</b></p>
              <p><i className="legend-teacher" /> Teachers <b>{percent(stat("teachers"))}%</b></p>
              <p><i className="legend-officer" /> Officers <b>{percent(stat("officers"))}%</b></p>
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
          {activities.length === 0 && <p>No activities yet.</p>}
          {activities.map((activity, index) => (
            <div className="admin-activity-item" key={index}>
              <div className="admin-activity-icon">{activityIcons[activity.type]}</div>
              <div className="admin-activity-details">
                <h4>{activity.title}</h4>
                <p>{activity.detail}</p>
              </div>
              <span>{timeAgo(activity.createdAt)}</span>
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
        <button className="admin-primary-btn" onClick={() => setShowAddUser(true)}>
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
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <select
                    className={`admin-status ${user.status.toLowerCase()}`}
                    value={user.status}
                    onChange={(e) => changeStatus(user.id, e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <button
                    className="admin-icon-btn"
                    title="View user"
                    onClick={() =>
                      alert(`${user.name}\n${user.email}\n${user.role}\n${user.status}`)
                    }
                  >
                    <FaEye />
                  </button>
                  <button
                    className="admin-icon-btn delete"
                    title="Delete user"
                    onClick={() => deleteUser(user.id)}
                  >
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

  const renderMonitor = (page) => {
    const config = monitorConfig[page];
    const rows = monitorData[page];

    return (
      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h3>{config.title} Monitoring</h3>
            <p>Latest records (max 100)</p>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                {config.columns.map(([label]) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!rows && (
                <tr><td colSpan={config.columns.length}>Loading...</td></tr>
              )}
              {rows && rows.length === 0 && (
                <tr><td colSpan={config.columns.length}>No records found.</td></tr>
              )}
              {rows &&
                rows.map((item) => (
                  <tr key={item._id}>
                    {config.columns.map(([label, getValue]) => (
                      <td key={label}>{getValue(item)}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPlaceholder = (title, description, icon) => (
    <div className="admin-panel admin-empty-panel">
      <div className="admin-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();
      case "Users":
        return renderUsers();
      case "Assignments":
      case "Documents":
      case "Messages":
      case "Reminders":
        return renderMonitor(activePage);
      case "Analytics":
        return renderPlaceholder("Analytics", "View platform growth and activity reports.", <FaChartBar />);
      case "Settings":
        return renderPlaceholder("Settings", "Manage administrator preferences and platform settings.", <FaCog />);
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
          <img src="/102893.jpg" alt="AME Logo" className="logo-image" />
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

          <button className="admin-logout" onClick={logout}>
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
          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {renderContent()}
        </section>

        <footer className="admin-footer">
          © 2026 AME MESSENGER. All rights reserved.
        </footer>
      </main>

      {showAddUser && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowAddUser(false)}
        >
          <form
            onSubmit={addUser}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", padding: 24, borderRadius: 12, width: 360, display: "flex", flexDirection: "column", gap: 12 }}
          >
            <h3>Add User</h3>
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="university">University</option>
              <option value="course-center">Course Center</option>
              <option value="other">Other</option>
            </select>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAddUser(false)}>Cancel</button>
              <button type="submit" className="admin-primary-btn">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}