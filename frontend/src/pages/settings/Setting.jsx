
import React, { useState } from "react";
import "./Setting.css";

import {
  FaUserCircle,
  FaUser,
  FaShieldAlt,
  FaLock,
  FaComments,
  FaBell,
  FaPalette,
  FaDatabase,
  FaUsers,
  FaUniversalAccess,
  FaQuestionCircle,
  FaSearch,
  FaChevronRight,
  FaCamera,
  FaMoon,
  FaSun,
  FaDesktop,
  FaSignOutAlt,
  FaCheck,
  FaEnvelope,
} from "react-icons/fa";

export default function SettingsPage() {
  const currentUser = JSON.parse(
    localStorage.getItem("ameUser") || "null"
  );

  const [activeTab, setActiveTab] = useState("Profile");

  const [profile, setProfile] = useState({
    name: currentUser?.username || "",
    email: currentUser?.email || "",
    role: currentUser?.role || "Member",
    about: currentUser?.about || "Available on AME Messenger",
    phone: currentUser?.phone || "",
  });

  const [savingProfile, setSavingProfile] = useState(false);

  const [settings, setSettings] = useState({
    lastSeen: true,
    profilePhoto: true,
    readReceipts: true,
    onlineStatus: true,
    messageNotifications: true,
    groupNotifications: true,
    assignmentNotifications: true,
    reminderNotifications: true,
    notificationSound: true,
    desktopNotifications: true,
    enterToSend: false,
    mediaAutoDownload: false,
    twoFactor: false,
    groupInvitations: true,
  });

  const [theme, setTheme] = useState("Light");
  const [search, setSearch] = useState("");

  const menuItems = [
    { name: "Profile", icon: <FaUser /> },
    { name: "Account & Security", icon: <FaShieldAlt /> },
    { name: "Privacy", icon: <FaLock /> },
    { name: "Chats", icon: <FaComments /> },
    { name: "Notifications", icon: <FaBell /> },
    { name: "Appearance", icon: <FaPalette /> },
    { name: "Storage & Data", icon: <FaDatabase /> },
    { name: "Groups", icon: <FaUsers /> },
    { name: "Accessibility", icon: <FaUniversalAccess /> },
    { name: "Help & Support", icon: <FaQuestionCircle /> },
  ];

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateProfile = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      alert("Please enter your name and email.");
      return;
    }

    const token = localStorage.getItem("ameToken");

    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(
        "http://localhost:5001/api/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: profile.name,
            email: profile.email,
            about: profile.about,
            phone: profile.phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      localStorage.setItem("ameUser", JSON.stringify(data.user));

      setProfile({
        name: data.user.username,
        email: data.user.email,
        role: data.user.role,
        about: data.user.about || "",
        phone: data.user.phone || "",
      });

      alert("Profile updated successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ameToken");
    localStorage.removeItem("ameUser");
    window.location.href = "/Login";
  };

  const SettingToggle = ({ label, description, settingKey }) => (
    <div className="setting-option">
      <div className="setting-option-info">
        <h4>{label}</h4>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`setting-switch ${
          settings[settingKey] ? "active" : ""
        }`}
        onClick={() => toggleSetting(settingKey)}
        aria-label={label}
        aria-pressed={settings[settingKey]}
      >
        <span></span>
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return (
          <>
            <div className="settings-heading">
              <h2>Profile</h2>
              <p>Manage your personal information.</p>
            </div>

            <div className="profile-card">
              <div className="profile-photo">
                <FaUserCircle />
                <button type="button" title="Change photo">
                  <FaCamera />
                </button>
              </div>

              <h3>{profile.name}</h3>
              <p>{profile.email}</p>
              <span className="profile-role">{profile.role}</span>
            </div>

            <div className="settings-card">
              <h3>Personal Information</h3>

              <div className="profile-input-group">
                <label>Full Name</label>
                <input
                  value={profile.name}
                  onChange={(e) =>
                    updateProfile("name", e.target.value)
                  }
                />
              </div>

              <div className="profile-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    updateProfile("email", e.target.value)
                  }
                />
              </div>

              <div className="profile-input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    updateProfile("phone", e.target.value)
                  }
                />
              </div>

              <div className="profile-input-group">
                <label>About</label>
                <textarea
                  value={profile.about}
                  onChange={(e) =>
                    updateProfile("about", e.target.value)
                  }
                />
              </div>

              <button
                type="button"
                className="save-settings-btn"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                <FaCheck />
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        );

      case "Account & Security":
        return (
          <>
            <div className="settings-heading">
              <h2>Account & Security</h2>
              <p>Protect your AME Messenger account.</p>
            </div>

            <div className="settings-card">
              <h3>Account Security</h3>

              <SettingToggle
                label="Two-Step Verification"
                description="Add an extra layer of security to your account."
                settingKey="twoFactor"
              />

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>Change Password</h4>
                  <p>Update your account password.</p>
                </div>
                <FaChevronRight />
              </div>

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>Active Sessions</h4>
                  <p>Manage devices logged into your account.</p>
                </div>
                <FaChevronRight />
              </div>
            </div>
          </>
        );

      case "Privacy":
        return (
          <>
            <div className="settings-heading">
              <h2>Privacy</h2>
              <p>Control who can see your information.</p>
            </div>

            <div className="settings-card">
              <h3>Visibility</h3>

              <SettingToggle
                label="Last Seen"
                description="Allow others to see your last seen status."
                settingKey="lastSeen"
              />

              <SettingToggle
                label="Profile Photo"
                description="Allow others to view your profile photo."
                settingKey="profilePhoto"
              />

              <SettingToggle
                label="Online Status"
                description="Show when you are online."
                settingKey="onlineStatus"
              />

              <SettingToggle
                label="Read Receipts"
                description="Let others know when you read messages."
                settingKey="readReceipts"
              />
            </div>
          </>
        );

      case "Chats":
        return (
          <>
            <div className="settings-heading">
              <h2>Chats</h2>
              <p>Customize your messaging experience.</p>
            </div>

            <div className="settings-card">
              <h3>Chat Preferences</h3>

              <SettingToggle
                label="Enter to Send"
                description="Press Enter to send messages."
                settingKey="enterToSend"
              />

              <SettingToggle
                label="Media Auto Download"
                description="Automatically download shared media."
                settingKey="mediaAutoDownload"
              />

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>Chat Wallpaper</h4>
                  <p>Customize your conversation background.</p>
                </div>
                <FaChevronRight />
              </div>
            </div>
          </>
        );

      case "Notifications":
        return (
          <>
            <div className="settings-heading">
              <h2>Notifications</h2>
              <p>Manage messages, assignments and reminders.</p>
            </div>

            <div className="settings-card">
              <h3>Notification Preferences</h3>

              <SettingToggle
                label="Message Notifications"
                description="Receive notifications for new messages."
                settingKey="messageNotifications"
              />

              <SettingToggle
                label="Group Notifications"
                description="Get alerts from group conversations."
                settingKey="groupNotifications"
              />

              <SettingToggle
                label="Assignment Notifications"
                description="Get notified about new assignments and deadlines."
                settingKey="assignmentNotifications"
              />

              <SettingToggle
                label="Reminder Notifications"
                description="Receive reminders for upcoming activities."
                settingKey="reminderNotifications"
              />

              <SettingToggle
                label="Notification Sound"
                description="Play a sound when notifications arrive."
                settingKey="notificationSound"
              />

              <SettingToggle
                label="Desktop Notifications"
                description="Show notifications on your desktop."
                settingKey="desktopNotifications"
              />
            </div>
          </>
        );

      case "Appearance":
        return (
          <>
            <div className="settings-heading">
              <h2>Appearance</h2>
              <p>Make AME Messenger look the way you like.</p>
            </div>

            <div className="settings-card">
              <h3>Theme Settings</h3>

              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-choice ${
                    theme === "Light" ? "selected" : ""
                  }`}
                  onClick={() => setTheme("Light")}
                >
                  <FaSun />
                  <span>Light</span>
                  {theme === "Light" && <FaCheck />}
                </button>

                <button
                  type="button"
                  className={`theme-choice ${
                    theme === "Dark" ? "selected" : ""
                  }`}
                  onClick={() => setTheme("Dark")}
                >
                  <FaMoon />
                  <span>Dark</span>
                  {theme === "Dark" && <FaCheck />}
                </button>

                <button
                  type="button"
                  className={`theme-choice ${
                    theme === "System" ? "selected" : ""
                  }`}
                  onClick={() => setTheme("System")}
                >
                  <FaDesktop />
                  <span>System</span>
                  {theme === "System" && <FaCheck />}
                </button>
              </div>
            </div>
          </>
        );

      case "Storage & Data":
        return (
          <>
            <div className="settings-heading">
              <h2>Storage & Data</h2>
              <p>Manage your storage and data usage.</p>
            </div>

            <div className="settings-card">
              <h3>Storage Overview</h3>

              <div className="storage-info">
                <FaDatabase />
                <div>
                  <h3>Storage Management</h3>
                  <p>View and manage your media and files.</p>
                </div>
              </div>

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>Network Usage</h4>
                  <p>Monitor your data consumption.</p>
                </div>
                <FaChevronRight />
              </div>

              <SettingToggle
                label="Media Auto Download"
                description="Automatically download received files."
                settingKey="mediaAutoDownload"
              />
            </div>
          </>
        );

      case "Groups":
        return (
          <>
            <div className="settings-heading">
              <h2>Groups</h2>
              <p>Manage your group messaging preferences.</p>
            </div>

            <div className="settings-card">
              <h3>Group Preferences</h3>

              <SettingToggle
                label="Group Invitations"
                description="Allow group invitations from other users."
                settingKey="groupInvitations"
              />
            </div>
          </>
        );

      case "Accessibility":
        return (
          <>
            <div className="settings-heading">
              <h2>Accessibility</h2>
              <p>Make messaging easier and more comfortable.</p>
            </div>

            <div className="settings-card">
              <h3>Accessibility Options</h3>
              <p>
                Accessibility preferences can be added here, including
                text size and contrast controls.
              </p>
            </div>
          </>
        );

      case "Help & Support":
        return (
          <>
            <div className="settings-heading">
              <h2>Help & Support</h2>
              <p>We are here to help you.</p>
            </div>

            <div className="settings-card">
              <h3>Support Center</h3>

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>Help Center</h4>
                  <p>Find answers to common questions.</p>
                </div>
                <FaChevronRight />
              </div>

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>Contact Support</h4>
                  <p>Get assistance from our support team.</p>
                </div>
                <FaEnvelope />
              </div>

              <div className="setting-option">
                <div className="setting-option-info">
                  <h4>About AME Messenger</h4>
                  <p>Version 1.0.0</p>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ame-settings-page">
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <div className="settings-logo">A</div>
          <div>
            <h2>AME</h2>
            <span>MESSENGER</span>
          </div>
        </div>

        <div className="settings-title">
          <h2>Settings</h2>
          <p>Manage your preferences</p>
        </div>

        <div className="settings-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <nav className="settings-navigation">
          {filteredItems.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`settings-nav-item ${
                activeTab === item.name ? "active" : ""
              }`}
              onClick={() => setActiveTab(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              <FaChevronRight className="nav-arrow" />
            </button>
          ))}
        </nav>

        <div className="settings-sidebar-bottom">
          <div className="sidebar-user">
            <FaUserCircle />
            <div>
              <h4>{profile.name}</h4>
              <p>{profile.role}</p>
            </div>
          </div>

          <button
            type="button"
            className="settings-logout"
            onClick={handleLogout}
          >
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      </aside>

      <main className="settings-main">
        <div className="settings-topbar">
          <div>
            <span>AME MESSENGER / SETTINGS</span>
            <h2>{activeTab}</h2>
          </div>

          <div className="settings-top-icon">
            <FaUserCircle />
          </div>
        </div>

        <div className="settings-content">
          {renderContent()}
        </div>

        <footer className="settings-footer">
          <span>© 2026 AME MESSENGER</span>
          <span>Designed for better communication.</span>
        </footer>
      </main>
    </div>
  );
}



