
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import Cropper from "react-easy-crop";
import "./Setting.css";
import { useTheme } from "../../context/ThemeContext";

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

const defaultSettings = {
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
};

// LOAD IMAGE
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

// CROP AND ROTATE IMAGE
const getCroppedPhotoBlob = async (
  imageSrc,
  pixelCrop,
  rotation = 0
) => {
  const image = await createImage(imageSrc);

  const radians = (rotation * Math.PI) / 180;

  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const rotatedWidth =
    image.width * cos + image.height * sin;

  const rotatedHeight =
    image.width * sin + image.height * cos;

  const rotatedCanvas = document.createElement("canvas");

  rotatedCanvas.width = Math.round(rotatedWidth);
  rotatedCanvas.height = Math.round(rotatedHeight);

  const rotatedContext = rotatedCanvas.getContext("2d");

  if (!rotatedContext) {
    throw new Error("Unable to process image.");
  }

  rotatedContext.translate(
    rotatedCanvas.width / 2,
    rotatedCanvas.height / 2
  );

  rotatedContext.rotate(radians);

  rotatedContext.drawImage(
    image,
    -image.width / 2,
    -image.height / 2
  );

  // FINAL CROPPED IMAGE
  const outputCanvas = document.createElement("canvas");

  outputCanvas.width = 512;
  outputCanvas.height = 512;

  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("Unable to crop image.");
  }

  outputContext.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    512,
    512
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Image cropping failed."));
        }
      },
      "image/jpeg",
      0.92
    );
  });
};

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

  // PROFILE PHOTO STATES
  const [profilePhoto, setProfilePhoto] = useState(
    currentUser?.profilePhoto || ""
  );

  const [previewPhoto, setPreviewPhoto] = useState(
    currentUser?.profilePhoto || ""
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef(null);

  // PROFILE PHOTO CROP EDITOR STATES
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const [cropImage, setCropImage] = useState("");

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [rotation, setRotation] = useState(0);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  // SAVE CROP AREA
  const onCropComplete = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const [settings, setSettings] = useState(defaultSettings);
  const { theme, setTheme } = useTheme();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const firstSave = useRef(true);
  const [search, setSearch] = useState("");

  // LOAD SAVED SETTINGS FROM BACKEND
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("ameToken");

      if (!token) {
        alert("Please login again.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5001/api/settings",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to fetch settings"
          );
        }

        setSettings({
          ...defaultSettings,
          ...(data.settings || {}),
        });

        setTheme(data.theme || "Light");
        setSettingsLoaded(true);
      } catch (error) {
        console.error("Fetch Settings Error:", error);
        alert(error.message || "Unable to load settings");
      }
    };

    fetchSettings();
  }, []);

  // SAVE SETTINGS AND THEME AUTOMATICALLY
  useEffect(() => {
    if (!settingsLoaded) return;

    if (firstSave.current) {
      firstSave.current = false;
      return;
    }

    const saveTimer = setTimeout(async () => {
      const token = localStorage.getItem("ameToken");

      if (!token) {
        console.error(
          "Settings could not be saved: login token missing."
        );
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5001/api/settings",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              settings,
              theme,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Settings update failed"
          );
        }

        console.log("Settings saved successfully");
      } catch (error) {
        console.error("Save Settings Error:", error);
        alert(error.message || "Unable to save settings");
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [settings, theme, settingsLoaded]);

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

  // OPEN IMAGE SELECTOR
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // SELECT IMAGE AND OPEN CROP EDITOR
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    // RELEASE PREVIOUS TEMPORARY IMAGE URL
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    const imageUrl = URL.createObjectURL(file);

    setCropImage(imageUrl);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);

    setCropModalOpen(true);

    // Allows selecting the same image again
    e.target.value = "";
  };

  // CANCEL CROP
  const handleCancelCrop = () => {
    if (uploadingPhoto) return;

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage("");
    setCropModalOpen(false);
    setCroppedAreaPixels(null);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setRotation(0);
  };

  // CROP AND UPLOAD PROFILE PHOTO
  const handleSaveCroppedPhoto = async () => {
    if (!cropImage || !croppedAreaPixels) {
      alert("Please adjust your profile photo.");
      return;
    }

    const token = localStorage.getItem("ameToken");

    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      setUploadingPhoto(true);

      // STEP 1: CREATE CROPPED IMAGE
      const croppedBlob = await getCroppedPhotoBlob(
        cropImage,
        croppedAreaPixels,
        rotation
      );

      if (!croppedBlob) {
        throw new Error("Image cropping failed.");
      }

      // STEP 2: UPLOAD CROPPED IMAGE TO CLOUDINARY
      const formData = new FormData();

      formData.append(
        "file",
        croppedBlob,
        "profile-photo.jpg"
      );

      const uploadResponse = await fetch(
        "http://localhost:5001/api/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message || "Image upload failed"
        );
      }

      const uploadedImageUrl = uploadData.data?.fileUrl;
      const publicId = uploadData.data?.publicId;

      if (!uploadedImageUrl) {
        throw new Error("Image URL was not returned.");
      }

      // STEP 3: SAVE PROFILE PHOTO IN MONGODB
      const profileResponse = await fetch(
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
            profilePhoto: uploadedImageUrl,
            profilePhotoPublicId: publicId,
          }),
        }
      );

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.message || "Profile photo save failed"
        );
      }

      // STEP 4: UPDATE LOCAL STORAGE
      const savedUser =
        profileData.user ||
        JSON.parse(localStorage.getItem("ameUser") || "null") ||
        {};

      const updatedUser = {
        ...savedUser,
        profilePhoto: uploadedImageUrl,
        profilePhotoPublicId: publicId,
      };

      localStorage.setItem(
        "ameUser",
        JSON.stringify(updatedUser)
      );

      window.dispatchEvent(new Event("ameUserUpdated"));

      // STEP 5: UPDATE PROFILE PHOTO DISPLAY
      setProfilePhoto(uploadedImageUrl);
      setPreviewPhoto(uploadedImageUrl);

      // CLOSE CROP EDITOR
      URL.revokeObjectURL(cropImage);

      setCropImage("");
      setCropModalOpen(false);
      setCroppedAreaPixels(null);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);
      setRotation(0);

      alert("Profile picture updated successfully!");

    } catch (error) {
      console.error("Cropped Profile Photo Error:", error);

      alert(
        error.message || "Unable to upload profile picture."
      );

    } finally {
      setUploadingPhoto(false);
    }
  };

  // SAVE PROFILE INFORMATION
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
            profilePhoto,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Profile update failed"
        );
      }

      const updatedUser = {
        ...data.user,
        profilePhoto: data.user.profilePhoto || profilePhoto,
      };

      localStorage.setItem(
        "ameUser",
        JSON.stringify(updatedUser)
      );

      window.dispatchEvent(new Event("ameUserUpdated"));

      setProfile({
        name: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        about: updatedUser.about || "",
        phone: updatedUser.phone || "",
      });

      setProfilePhoto(updatedUser.profilePhoto || "");
      setPreviewPhoto(updatedUser.profilePhoto || "");

      alert("Profile updated successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("ameToken");
    localStorage.removeItem("ameUser");
    window.location.href = "/Login";
  };

  // SETTINGS TOGGLE
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

  // SETTINGS CONTENT
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
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt="Profile"
                    className="profile-photo-image"
                  />
                ) : (
                  <FaUserCircle />
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleProfilePhotoChange}
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  title="Change photo"
                  onClick={handleCameraClick}
                  disabled={uploadingPhoto}
                >
                  <FaCamera />
                </button>
              </div>

              {uploadingPhoto && (
                <p className="photo-upload-status">
                  Uploading profile picture...
                </p>
              )}

              <h3>{profile.name}</h3>
              <p>{profile.email}</p>

              <span className="profile-role">
                {profile.role}
              </span>
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
          <img
            src="/102893.jpg"
            alt="AME Logo"
            className="logo-image"
          />

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
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="sidebar-profile-image"
              />
            ) : (
              <FaUserCircle />
            )}

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

          {/* TOPBAR DEFAULT USER ICON */}
          <div className="settings-top-icon">
            <FaUserCircle />
          </div>
        </div>

        <div className="settings-content">
          {renderContent()}
        </div>

        {/* PROFILE PHOTO CROP EDITOR MODAL */}
        {cropModalOpen && cropImage && (
          <div className="crop-modal-overlay">
            <div className="crop-modal-content">

              <div className="crop-modal-header">
                <h3>Adjust Profile Photo</h3>

                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={uploadingPhoto}
                  aria-label="Close crop editor"
                >
                  ×
                </button>
              </div>

              <p className="crop-description">
                Drag, zoom and rotate your photo to get
                the perfect profile picture.
              </p>

              <div className="cropper-container">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  minZoom={1}
                  maxZoom={3}
                />
              </div>

              <div className="crop-control-group">
                <label>Zoom</label>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) =>
                    setZoom(Number(e.target.value))
                  }
                />

                <span>{zoom.toFixed(2)}x</span>
              </div>

              <div className="crop-rotate-section">
                <label>Rotate Photo</label>

                <div className="crop-rotate-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      setRotation((prev) => prev - 90)
                    }
                  >
                    ↶ Rotate Left
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRotation((prev) => prev + 90)
                    }
                  >
                    ↷ Rotate Right
                  </button>
                </div>

                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) =>
                    setRotation(Number(e.target.value))
                  }
                />

                <span>{rotation}°</span>
              </div>

              <div className="crop-modal-actions">
                <button
                  type="button"
                  className="crop-cancel-btn"
                  onClick={handleCancelCrop}
                  disabled={uploadingPhoto}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="crop-save-btn"
                  onClick={handleSaveCroppedPhoto}
                  disabled={
                    !croppedAreaPixels || uploadingPhoto
                  }
                >
                  {uploadingPhoto
                    ? "Uploading..."
                    : "Use Photo"}
                </button>
              </div>

            </div>
          </div>
        )}

        <footer className="settings-footer">
          <span>© 2026 AME MESSENGER</span>
          <span>Designed for better communication.</span>
        </footer>
      </main>
    </div>
  );
}
