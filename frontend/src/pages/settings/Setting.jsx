import React, { useState, useEffect, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../services/api";
import "./Setting.css";
import { useTheme } from "../../context/ThemeContext";
import { applyAccent, getSavedAccent, ACCENT_COLORS } from "../../utils/accent";

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
  FaArrowLeft,
  FaTrash,
} from "react-icons/fa";

const API_URL = API_BASE.replace(/\/api\/?$/, "");

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
const getCroppedPhotoBlob = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);

  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const rotatedWidth = image.width * cos + image.height * sin;
  const rotatedHeight = image.width * sin + image.height * cos;

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = Math.round(rotatedWidth);
  rotatedCanvas.height = Math.round(rotatedHeight);

  const rotatedContext = rotatedCanvas.getContext("2d");
  if (!rotatedContext) throw new Error("Unable to process image.");

  rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 512;
  outputCanvas.height = 512;

  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Unable to crop image.");

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
      (blob) => (blob ? resolve(blob) : reject(new Error("Image cropping failed."))),
      "image/jpeg",
      0.92
    );
  });
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("ameUser") || "null");

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
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profilePhoto || "");
  const [previewPhoto, setPreviewPhoto] = useState(currentUser?.profilePhoto || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // CROP EDITOR STATES
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const [settings, setSettings] = useState(defaultSettings);
  const { theme, setTheme } = useTheme();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const firstSave = useRef(true);
  const [search, setSearch] = useState("");

  // PASSWORD + DELETE ACCOUNT STATES
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [accent, setAccent] = useState(getSavedAccent);

  useEffect(() => {
    document.documentElement.dataset.textSize = localStorage.getItem("ameTextSize") || "normal";
    document.documentElement.classList.toggle(
      "ame-reduce-motion",
      localStorage.getItem("ameReduceMotion") === "true"
    );
  }, []);

  // LOAD SAVED SETTINGS FROM BACKEND
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("ameToken");

      if (!token) {
        alert("Please login again.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/settings`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch settings");
        }

        setSettings({ ...defaultSettings, ...(data.settings || {}) });
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
        console.error("Settings could not be saved: login token missing.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/settings`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ settings, theme }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Settings update failed");
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
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateProfile = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
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

    if (cropImage) URL.revokeObjectURL(cropImage);

    const imageUrl = URL.createObjectURL(file);

    setCropImage(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCropModalOpen(true);

    e.target.value = "";
  };

  // CANCEL CROP
  const handleCancelCrop = () => {
    if (uploadingPhoto) return;

    if (cropImage) URL.revokeObjectURL(cropImage);

    setCropImage("");
    setCropModalOpen(false);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
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

      const croppedBlob = await getCroppedPhotoBlob(cropImage, croppedAreaPixels, rotation);

      if (!croppedBlob) throw new Error("Image cropping failed.");

      const formData = new FormData();
      formData.append("file", croppedBlob, "profile-photo.jpg");

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || "Image upload failed");
      }

      const uploadedImageUrl = uploadData.data?.fileUrl;
      const publicId = uploadData.data?.publicId;

      if (!uploadedImageUrl) throw new Error("Image URL was not returned.");

      const profileResponse = await fetch(`${API_URL}/api/auth/profile`, {
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
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.message || "Profile photo save failed");
      }

      const savedUser =
        profileData.user || JSON.parse(localStorage.getItem("ameUser") || "null") || {};

      const updatedUser = {
        ...savedUser,
        profilePhoto: uploadedImageUrl,
        profilePhotoPublicId: publicId,
      };

      localStorage.setItem("ameUser", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("ameUserUpdated"));

      setProfilePhoto(uploadedImageUrl);
      setPreviewPhoto(uploadedImageUrl);

      URL.revokeObjectURL(cropImage);

      setCropImage("");
      setCropModalOpen(false);
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);

      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Cropped Profile Photo Error:", error);
      alert(error.message || "Unable to upload profile picture.");
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

      const response = await fetch(`${API_URL}/api/auth/profile`, {
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      const updatedUser = {
        ...data.user,
        profilePhoto: data.user.profilePhoto || profilePhoto,
      };

      localStorage.setItem("ameUser", JSON.stringify(updatedUser));
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
  const clearSession = () => {
    ["ameToken", "ameUser", "ameAdminToken", "ameAdminUser"].forEach((key) =>
      localStorage.removeItem(key)
    );
  };

  const handleLogout = () => {
    clearSession();
    navigate("/Login", { replace: true });
  };

  // CHANGE PASSWORD
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (pwForm.next.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }

    if (pwForm.next !== pwForm.confirm) {
      alert("New password and confirm password do not match.");
      return;
    }

    const token = localStorage.getItem("ameToken");

    try {
      setPwSaving(true);

      const response = await fetch(`${API_URL}/api/settings/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.next,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password");
      }

      setPwForm({ current: "", next: "", confirm: "" });
      alert("Password changed successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setPwSaving(false);
    }
  };

  // DELETE ACCOUNT
  const handleDeleteAccount = async () => {
    const sure = window.confirm(
      "Your account will be permanently deleted. This cannot be undone. Continue?"
    );

    if (!sure) return;

    const token = localStorage.getItem("ameToken");

    try {
      setDeleting(true);

      const response = await fetch(`${API_URL}/api/settings/account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete account");
      }

      clearSession();
      navigate("/", { replace: true });
    } catch (error) {
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // REMOVE PROFILE PHOTO
  const handleRemovePhoto = async () => {
    if (!window.confirm("Remove your profile photo?")) return;

    const token = localStorage.getItem("ameToken");

    try {
      setRemovingPhoto(true);

      const response = await fetch(`${API_URL}/api/settings/profile-photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove photo");
      }

      const savedUser = JSON.parse(localStorage.getItem("ameUser") || "null") || {};

      localStorage.setItem(
        "ameUser",
        JSON.stringify({ ...savedUser, profilePhoto: "", profilePhotoPublicId: "" })
      );

      window.dispatchEvent(new Event("ameUserUpdated"));

      setProfilePhoto("");
      setPreviewPhoto("");
    } catch (error) {
      alert(error.message);
    } finally {
      setRemovingPhoto(false);
    }
  };

  // ACCENT COLOR
  const handleAccent = (color) => {
    setAccent(color);
    applyAccent(color);
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
        className={`setting-switch ${settings[settingKey] ? "active" : ""}`}
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
                  <img src={previewPhoto} alt="Profile" className="profile-photo-image" />
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
                <p className="photo-upload-status">Uploading profile picture...</p>
              )}

              {previewPhoto && (
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={handleRemovePhoto}
                  disabled={removingPhoto || uploadingPhoto}
                >
                  <FaTrash /> {removingPhoto ? "Removing..." : "Remove photo"}
                </button>
              )}

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
                  onChange={(e) => updateProfile("name", e.target.value)}
                />
              </div>

              <div className="profile-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile("email", e.target.value)}
                />
              </div>

              <div className="profile-input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => updateProfile("phone", e.target.value)}
                />
              </div>

              <div className="profile-input-group">
                <label>About</label>
                <textarea
                  value={profile.about}
                  onChange={(e) => updateProfile("about", e.target.value)}
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
              <h3>Two-Step Verification</h3>

              <SettingToggle
                label="Two-Step Verification"
                description="Add an extra layer of security to your account."
                settingKey="twoFactor"
              />
            </div>

            <form className="settings-card" onSubmit={handleChangePassword}>
              <h3>Change Password</h3>

              <div className="profile-input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  required
                />
              </div>

              <div className="profile-input-group">
                <label>New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  required
                />
              </div>

              <div className="profile-input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="save-settings-btn" disabled={pwSaving}>
                <FaCheck />
                {pwSaving ? "Updating..." : "Update Password"}
              </button>
            </form>

            <div className="settings-card danger-card">
              <h3>Delete Account</h3>
              <p>This will permanently delete your account. It cannot be undone.</p>

              <div className="profile-input-group">
                <label>Enter your password to confirm</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="danger-btn"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
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
                  className={`theme-choice ${theme === "Light" ? "selected" : ""}`}
                  onClick={() => setTheme("Light")}
                >
                  <FaSun />
                  <span>Light</span>
                  {theme === "Light" && <FaCheck />}
                </button>

                <button
                  type="button"
                  className={`theme-choice ${theme === "Dark" ? "selected" : ""}`}
                  onClick={() => setTheme("Dark")}
                >
                  <FaMoon />
                  <span>Dark</span>
                  {theme === "Dark" && <FaCheck />}
                </button>

                <button
                  type="button"
                  className={`theme-choice ${theme === "System" ? "selected" : ""}`}
                  onClick={() => setTheme("System")}
                >
                  <FaDesktop />
                  <span>System</span>
                  {theme === "System" && <FaCheck />}
                </button>
              </div>
            </div>
            <div className="settings-card">
              <h3>Accent Color</h3>

              <div className="accent-options">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`accent-swatch ${accent === color.value ? "selected" : ""}`}
                    style={{ background: color.value }}
                    title={color.name}
                    aria-label={`${color.name} accent`}
                    onClick={() => handleAccent(color.value)}
                  >
                    {accent === color.value && <FaCheck />}
                  </button>
                ))}

                <label className="accent-custom" title="Pick a custom color">
                  <input
                    type="color"
                    value={accent || "#2563eb"}
                    onChange={(e) => handleAccent(e.target.value)}
                  />
                </label>
              </div>

              <button
                type="button"
                className="accent-reset"
                onClick={() => handleAccent("")}
                disabled={!accent}
              >
                Reset to default
              </button>
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

              <div className="profile-input-group">
                <label htmlFor="ame-text-size">Interface text size</label>
                <select
                  id="ame-text-size"
                  defaultValue={localStorage.getItem("ameTextSize") || "normal"}
                  onChange={(event) => {
                    const value = event.target.value;
                    localStorage.setItem("ameTextSize", value);
                    document.documentElement.dataset.textSize = value;
                  }}
                >
                  <option value="normal">Default</option>
                  <option value="large">Large</option>
                  <option value="larger">Extra large</option>
                </select>
              </div>

              <div className="profile-input-group">
                <label>
                  <input
                    type="checkbox"
                    defaultChecked={localStorage.getItem("ameReduceMotion") === "true"}
                    onChange={(event) => {
                      localStorage.setItem("ameReduceMotion", String(event.target.checked));
                      document.documentElement.classList.toggle(
                        "ame-reduce-motion",
                        event.target.checked
                      );
                    }}
                  />{" "}
                  Reduce animations
                </label>
              </div>
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
                  <h4>Contact Support</h4>
                  <p>Get assistance from our support team.</p>
                </div>
                <button
                  type="button"
                  className="settings-inline-action"
                  onClick={() => navigate("/Contact")}
                  aria-label="Open contact page"
                >
                  <FaEnvelope />
                </button>
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
        <button
          type="button"
          className="settings-back-arrow"
          onClick={() => navigate("/Home")}
          aria-label="Back to Home"
          title="Back to Home"
        >
          <FaArrowLeft />
        </button>

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
              className={`settings-nav-item ${activeTab === item.name ? "active" : ""}`}
              onClick={() => setActiveTab(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              <FaChevronRight className="nav-arrow" />
            </button>
          ))}
        </nav>

        <div className="settings-sidebar-bottom">
          <button
            type="button"
            className="sidebar-user"
            onClick={() => setActiveTab("Profile")}
            aria-label="Open profile settings"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="sidebar-profile-image" />
            ) : (
              <FaUserCircle />
            )}

            <div>
              <h4>{profile.name}</h4>
              <p>{profile.role}</p>
            </div>
          </button>

          <button type="button" className="settings-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      </aside>

      <main className="settings-main">
        <div className="settings-content">{renderContent()}</div>

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
                Drag, zoom and rotate your photo to get the perfect profile picture.
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
                  onChange={(e) => setZoom(Number(e.target.value))}
                />

                <span>{zoom.toFixed(2)}x</span>
              </div>

              <div className="crop-rotate-section">
                <label>Rotate Photo</label>

                <div className="crop-rotate-buttons">
                  <button type="button" onClick={() => setRotation((prev) => prev - 90)}>
                    ↶ Rotate Left
                  </button>

                  <button type="button" onClick={() => setRotation((prev) => prev + 90)}>
                    ↷ Rotate Right
                  </button>
                </div>

                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
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
                  disabled={!croppedAreaPixels || uploadingPhoto}
                >
                  {uploadingPhoto ? "Uploading..." : "Use Photo"}
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