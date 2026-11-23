
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../services/api";
import "./Contact.css";
import Cropper from "react-easy-crop";

import {
  FaUserPlus,
  FaSearch,
  FaEnvelope,
  FaComments,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUserCircle,
  FaAddressBook,
  FaHome,
  FaTasks,
  FaUsers,
  FaFileAlt,
  FaBell,
  FaCalendarAlt,
  FaCheck,
  FaCrown,
  FaUserMinus,
  FaBan,
  FaSignOutAlt
} from "react-icons/fa";

const ROLE_LABELS = {
  student: "Student",
  teacher: "Teacher",
  university: "University Student",
  "course-center": "Course Center",
  other: "Other",
  admin: "Admin"
};

const emptyForm = { email: "", nickname: "" };

// AUTH HEADERS
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("ameToken")}`
});

// GET LOGGED-IN USER ID FROM JWT
const getLoggedInUserId = () => {
  try {
    const token = localStorage.getItem("ameToken");

    if (!token) return "";

    const payload = token.split(".")[1];

    if (!payload) return "";

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = JSON.parse(
      atob(base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "="))
    );

    return String(
      decoded.userId ||
      decoded.id ||
      decoded._id ||
      decoded.sub ||
      ""
    );

  } catch (error) {
    console.error("Unable to read login user ID:", error);
    return "";
  }
};

// GET USER ID FROM OBJECT OR ID
const getUserId = (user) => {
  if (!user) return "";

  return String(
    typeof user === "object"
      ? user._id || user.id || ""
      : user
  );
};

// REMOVE DUPLICATE CONTACTS
const dedupeContacts = (items = []) => {
  const seenUserIds = new Set();

  return (Array.isArray(items) ? items : []).filter((contact) => {
    const userId = contact.contactUser?._id;

    if (!userId) return false;

    const key = String(userId);

    if (seenUserIds.has(key)) return false;

    seenUserIds.add(key);
    return true;
  });
};

const createCroppedImage = (imageSrc, pixelCrop, rotation = 0) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not create image canvas."));
        return;
      }

      const radians = (rotation * Math.PI) / 180;

      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      const rotatedWidth =
        image.width * cos + image.height * sin;

      const rotatedHeight =
        image.width * sin + image.height * cos;

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      tempCanvas.width = rotatedWidth;
      tempCanvas.height = rotatedHeight;

      tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      tempCtx.rotate(radians);
      tempCtx.drawImage(
        image,
        -image.width / 2,
        -image.height / 2
      );

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        tempCanvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image cropping failed."));
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = () => reject(
      new Error("Unable to load selected image.")
    );

    image.src = imageSrc;
  });
};

export default function Contact() {
  const navigate = useNavigate();

  const role = "Student";

  const [currentUserId] = useState(() => getLoggedInUserId());

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // GROUP LIST
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupListSearch, setGroupListSearch] = useState("");

  // GROUP MEMBERS VIEW
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [openingMemberId, setOpeningMemberId] = useState(null);

  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // CONTACT PAGE IMPROVEMENTS
  const contactsListRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [toastMessage, setToastMessage] = useState("");
  const [openingContactId, setOpeningContactId] = useState(null);
  const [openingGroupId, setOpeningGroupId] = useState(null);

  // GROUP CREATION
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // GROUP PROFILE PHOTO
const [groupImage, setGroupImage] = useState(null);
const [groupImagePreview, setGroupImagePreview] = useState("");
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [rotation, setRotation] = useState(0);
const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
const [croppedImageBlob, setCroppedImageBlob] = useState(null);
const [uploadingGroupImage, setUploadingGroupImage] = useState(false);

const groupImageInputRef = useRef(null);

  // GROUP MANAGEMENT
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteSelectedIds, setInviteSelectedIds] = useState([]);
  const [groupActionLoading, setGroupActionLoading] = useState(false);

  // SUCCESS NOTIFICATION
  const showToast = (message) => {
    setToastMessage(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 3000);
  };

  // CLEAN UP TIMER
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // LOAD CONTACTS
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch(`${API_URL}/contacts`, {
          headers: authHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load contacts.");
        }

        setContacts(dedupeContacts(data));

      } catch (error) {
        alert(error.message);

      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  // LOAD GROUPS
  const refreshGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        headers: authHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load groups.");
      }

      const conversations = Array.isArray(data)
        ? data
        : Array.isArray(data.conversations)
          ? data.conversations
          : [];

      const groupConversations = conversations.filter(
        (conversation) => conversation.type === "group"
      );

      setGroups(groupConversations);

      return groupConversations;

    } catch (error) {
      console.error("Load groups error:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadInitialGroups = async () => {
      await refreshGroups();
      setGroupsLoading(false);
    };

    loadInitialGroups();
  }, []);

  // HANDLE FORM INPUT
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // RESET CONTACT FORM
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // ADD OR EDIT CONTACT
  const saveContact = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/contacts/${editingId}`
          : `${API_URL}/contacts`,
        {
          method: editingId ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify(
            editingId ? { nickname: form.nickname } : form
          )
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save contact.");
      }

      setContacts((previous) => {
        if (editingId) {
          return dedupeContacts(
            previous.map((contact) =>
              String(contact._id) === String(editingId)
                ? data
                : contact
            )
          );
        }

        const newUserId = String(data.contactUser?._id || "");

        const filteredContacts = previous.filter(
          (contact) =>
            String(contact.contactUser?._id) !== newUserId
        );

        return dedupeContacts([data, ...filteredContacts]);
      });

      showToast(
        editingId
          ? "Contact updated successfully!"
          : "Contact saved successfully!"
      );

      resetForm();

    } catch (error) {
      alert(error.message);

    } finally {
      setSaving(false);
    }
  };

  // EDIT CONTACT
  const editContact = (contact) => {
    setForm({
      email: contact.contactUser.email,
      nickname: contact.nickname || ""
    });

    setEditingId(contact._id);
    setShowForm(true);
  };

  // BLOCK / UNBLOCK CONTACT
  const toggleBlockContact = async (contact) => {
    const nextBlocked = !contact.isBlocked;
    try {
      const response = await fetch(`${API_URL}/contacts/${contact._id}/block`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isBlocked: nextBlocked })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update contact.");
      setContacts((items) => items.map((item) => item._id === contact._id ? data.contact : item));
      showToast(data.message || (nextBlocked ? "Contact blocked" : "Contact unblocked"));
    } catch (error) { alert(error.message); }
  };

  // DELETE CONTACT
  const deleteContact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/contacts/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete contact.");
      }

      setContacts((previous) =>
        previous.filter((contact) => contact._id !== id)
      );

      showToast("Contact deleted successfully!");

    } catch (error) {
      alert(error.message);
    }
  };

  // OPEN PERSONAL CHAT
  const startChat = async (contact) => {
    const contactUserId = contact.contactUser?._id;

    if (!contactUserId || openingContactId) return;

    try {
      setOpeningContactId(contact._id);

      const response = await fetch(
        `${API_URL}/conversations/personal`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userId: contactUserId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to open chat.");
      }

      if (!data._id) {
        throw new Error("Personal conversation ID was not returned.");
      }

      navigate("/Messenger", {
        state: {
          conversationId: data._id
        }
      });

    } catch (error) {
      alert(error.message);

    } finally {
      setOpeningContactId(null);
    }
  };

  // OPEN GROUP CHAT
  const startGroupChat = (group) => {
    if (!group?._id || openingGroupId) return;

    setOpeningGroupId(group._id);

    navigate("/Messenger", {
      state: {
        conversationId: group._id
      }
    });
  };

  // VIEW GROUP MEMBERS
  const viewGroupMembers = (group) => {
    setSelectedGroup(group);
    setShowInvitePanel(false);
    setInviteSelectedIds([]);
    setInviteSearch("");
    setShowMembersModal(true);
  };

  // CHECK IF LOGGED-IN USER IS GROUP ADMIN
  const isGroupAdmin = (group) => {
    const adminId = getUserId(group?.groupAdmin);

    return Boolean(
      currentUserId &&
      adminId &&
      currentUserId === adminId
    );
  };

  // UPDATE GROUP IN FRONTEND STATE
  const updateGroupState = (updatedGroup) => {
    if (!updatedGroup?._id) return;

    setSelectedGroup(updatedGroup);

    setGroups((previous) =>
      previous.map((group) =>
        String(group._id) === String(updatedGroup._id)
          ? updatedGroup
          : group
      )
    );
  };

  // OPEN GROUP MEMBER PERSONAL CHAT
  const startMemberPersonalChat = async (member) => {
    const memberId =
      typeof member === "object" ? member?._id : member;

    if (!memberId || openingMemberId) return;

    // Do not open personal chat with yourself
    if (String(memberId) === currentUserId) {
      showToast("This is your own account.");
      return;
    }

    try {
      setOpeningMemberId(String(memberId));

      const response = await fetch(
        `${API_URL}/conversations/personal`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userId: memberId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to open personal chat.");
      }

      if (!data._id) {
        throw new Error("Personal conversation ID was not returned.");
      }

      setShowMembersModal(false);

      navigate("/Messenger", {
        state: {
          conversationId: data._id
        }
      });

    } catch (error) {
      alert(error.message);

    } finally {
      setOpeningMemberId(null);
    }
  };

  // OPEN GROUP CREATION WINDOW
const openGroupForm = () => {
  setGroupName("");
  setGroupSearch("");
  setSelectedMemberIds([]);

  setGroupImage(null);
  setGroupImagePreview("");
  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setRotation(0);
  setCroppedAreaPixels(null);
  setCroppedImageBlob(null);

  setShowGroupForm(true);
};

  // SELECT / UNSELECT GROUP MEMBERS
  const toggleGroupMember = (userId) => {
    const id = String(userId);

    setSelectedMemberIds((previous) =>
      previous.includes(id)
        ? previous.filter((memberId) => memberId !== id)
        : [...previous, id]
    );
  };

// SELECT GROUP PROFILE PHOTO
const handleGroupImageSelect = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    e.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Image size must be less than 5 MB.");
    e.target.value = "";
    return;
  }

  if (groupImagePreview) {
    URL.revokeObjectURL(groupImagePreview);
  }

  const previewUrl = URL.createObjectURL(file);

  setGroupImage(file);
  setGroupImagePreview(previewUrl);
  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setRotation(0);
  setCroppedAreaPixels(null);
  setCroppedImageBlob(null);
};

// SAVE CROP AREA
const handleCropComplete = (croppedArea, croppedAreaPixels) => {
  setCroppedAreaPixels(croppedAreaPixels);
};

// REMOVE SELECTED GROUP PHOTO
const removeGroupImage = () => {
  if (groupImagePreview) {
    URL.revokeObjectURL(groupImagePreview);
  }

  setGroupImage(null);
  setGroupImagePreview("");
  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setRotation(0);
  setCroppedAreaPixels(null);
  setCroppedImageBlob(null);

  if (groupImageInputRef.current) {
    groupImageInputRef.current.value = "";
  }
};

// CROP GROUP PHOTO
const prepareGroupImage = async () => {
  if (!groupImagePreview || !croppedAreaPixels) {
    return null;
  }

  const blob = await createCroppedImage(
    groupImagePreview,
    croppedAreaPixels,
    rotation
  );

  setCroppedImageBlob(blob);

  return blob;
};

// UPLOAD GROUP PHOTO TO CLOUDINARY
const uploadGroupImage = async (blob) => {
  if (!blob) return "";

  const formData = new FormData();

  formData.append("file", blob, "group-profile.jpg");

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("ameToken")}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Group photo upload failed.");
  }

  const imageUrl = data.data?.fileUrl;

  if (!imageUrl) {
    throw new Error("Uploaded image URL was not returned.");
  }

  return imageUrl;
};

 // CREATE GROUP WITH PROFILE PHOTO
const createGroup = async (e) => {
  e.preventDefault();

  const cleanName = groupName.trim();

  if (!cleanName) {
    alert("Please enter a group name.");
    return;
  }

  if (selectedMemberIds.length < 1) {
    alert("Please select at least one contact for the group.");
    return;
  }

  try {
    setCreatingGroup(true);

    let uploadedImageUrl = "";

    // Upload image only when a photo is selected
    if (groupImagePreview) {
      setUploadingGroupImage(true);

      const croppedBlob = await prepareGroupImage();

      if (!croppedBlob) {
        throw new Error("Please crop the group photo before saving.");
      }

      uploadedImageUrl = await uploadGroupImage(croppedBlob);

      setUploadingGroupImage(false);
    }

    const response = await fetch(
      `${API_URL}/conversations/group`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          groupName: cleanName,
          participants: selectedMemberIds,
          groupImage: uploadedImageUrl
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to create group.");
    }

    const createdConversation = data.conversation;

    if (!createdConversation?._id) {
      throw new Error(
        "Group was created, but its conversation ID was not returned."
      );
    }

    setGroups((previous) => [
      createdConversation,
      ...previous.filter(
        (group) =>
          String(group._id) !== String(createdConversation._id)
      )
    ]);

    if (groupImagePreview) {
      URL.revokeObjectURL(groupImagePreview);
    }

    setShowGroupForm(false);
    setGroupName("");
    setGroupSearch("");
    setSelectedMemberIds([]);
    setGroupImage(null);
    setGroupImagePreview("");
    setCroppedAreaPixels(null);
    setCroppedImageBlob(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);

    showToast("Group created successfully! Opening group chat...");

    window.setTimeout(() => {
      navigate("/Messenger", {
        state: {
          conversationId: createdConversation._id
        }
      });
    }, 500);

  } catch (error) {
    alert(error.message);

  } finally {
    setCreatingGroup(false);
    setUploadingGroupImage(false);
  }
};

  // OPEN INVITE MEMBERS PANEL
  const openInvitePanel = () => {
    setInviteSelectedIds([]);
    setInviteSearch("");
    setShowInvitePanel(true);
  };

  // SELECT / UNSELECT INVITE CONTACT
  const toggleInviteMember = (userId) => {
    const id = String(userId);

    setInviteSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((memberId) => memberId !== id)
        : [...previous, id]
    );
  };

  // CONTACTS NOT ALREADY IN GROUP
  const availableInviteContacts = contacts.filter((contact) => {
    const userId = String(contact.contactUser?._id || "");

    const existingIds = (selectedGroup?.participants || []).map(
      (member) => getUserId(member)
    );

    const displayName =
      contact.nickname || contact.contactUser?.username || "";

    const email = contact.contactUser?.email || "";
    const query = inviteSearch.toLowerCase().trim();

    return (
      userId &&
      !existingIds.includes(userId) &&
      `${displayName} ${email}`.toLowerCase().includes(query)
    );
  });

  // INVITE MEMBERS - ADMIN ONLY
  const inviteMembers = async () => {
    if (!selectedGroup?._id || inviteSelectedIds.length === 0) {
      return;
    }

    try {
      setGroupActionLoading(true);

      const response = await fetch(
        `${API_URL}/conversations/group/${selectedGroup._id}/members`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userIds: inviteSelectedIds
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to invite members.");
      }

      if (data.conversation) {
        updateGroupState(data.conversation);
      }

      setShowInvitePanel(false);
      setInviteSelectedIds([]);
      setInviteSearch("");

      showToast(data.message || "Members added successfully!");

    } catch (error) {
      alert(error.message);

    } finally {
      setGroupActionLoading(false);
    }
  };

  // REMOVE GROUP MEMBER - ADMIN ONLY
  const removeGroupMember = async (member) => {
    const memberId = getUserId(member);

    if (!selectedGroup?._id || !memberId) return;

    const memberName =
      typeof member === "object"
        ? member.username || member.email || "this member"
        : "this member";

    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }

    try {
      setGroupActionLoading(true);

      const response = await fetch(
        `${API_URL}/conversations/group/${selectedGroup._id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: authHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove member.");
      }

      if (data.conversation) {
        updateGroupState(data.conversation);
      }

      showToast(data.message || "Member removed successfully!");

    } catch (error) {
      alert(error.message);

    } finally {
      setGroupActionLoading(false);
    }
  };

  // LEAVE GROUP - ANY MEMBER
  const leaveGroup = async () => {
    if (!selectedGroup?._id) return;

    if (!window.confirm(
      `Are you sure you want to leave "${selectedGroup.groupName}"?`
    )) {
      return;
    }

    try {
      setGroupActionLoading(true);

      const response = await fetch(
        `${API_URL}/conversations/group/${selectedGroup._id}/leave`,
        {
          method: "POST",
          headers: authHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to leave group.");
      }

      setGroups((previous) =>
        previous.filter(
          (group) => String(group._id) !== String(selectedGroup._id)
        )
      );

      setSelectedGroup(null);
      setShowMembersModal(false);
      setShowInvitePanel(false);

      showToast(data.message || "You left the group successfully!");

    } catch (error) {
      alert(error.message);

    } finally {
      setGroupActionLoading(false);
    }
  };

  // FILTER CONTACTS
  const filteredContacts = contacts.filter((contact) =>
    `${contact.nickname || ""} ${
      contact.contactUser?.username || ""
    } ${contact.contactUser?.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  // FILTER GROUP MEMBERS FOR CREATION
  const filteredGroupContacts = contacts.filter((contact) => {
    const displayName =
      contact.nickname || contact.contactUser?.username || "";

    const email = contact.contactUser?.email || "";
    const query = groupSearch.toLowerCase().trim();

    return `${displayName} ${email}`
      .toLowerCase()
      .includes(query);
  });

  // FILTER MY GROUPS
  const filteredGroups = groups.filter((group) =>
    (group.groupName || group.name || "")
      .toLowerCase()
      .includes(groupListSearch.toLowerCase().trim())
  );

  // ONLINE CONTACT COUNT
  const onlineCount = contacts.filter(
    (contact) => contact.contactUser?.isOnline
  ).length;

  // CURRENT GROUP ADMIN STATUS
  const selectedGroupIsAdmin = isGroupAdmin(selectedGroup);

  return (
    <div className="contacts-layout">

      {/* SIDEBAR */}
      <aside className="assignments-sidebar">

        <div className="sidebar-logo">
          <img
            src="/102893.jpg"
            alt="AME Logo"
            className="logo-image"
          />

          <span>AME MESSENGER</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-menu">
          <a href="/Home">
            <FaHome /> Dashboard
          </a>

          <a href="/Assignment">
            <FaTasks /> Assignments
          </a>

          <a href="/Messenger">
            <FaUsers /> Messenger
          </a>

          <a href="/Contact" className="active">
            <FaAddressBook /> Contacts
          </a>

          <a href="/Documents">
            <FaFileAlt /> Documents
          </a>

          <a href="/Reminder">
            <FaBell /> Reminders
          </a>

          <a href="/Calendar">
            <FaCalendarAlt /> Calendar
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-avatar">K</div>

            <div>
              <strong>Kavitha</strong>
              <small>{role}</small>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <div className="contacts-page">

        <div className="contacts-header">

          <div>
            <span>AME MESSENGER / CONTACTS</span>
            <h1>Contacts</h1>
            <p>Manage your people and start conversations.</p>
          </div>

          <div className="contacts-header-actions">

            <button
              type="button"
              className="create-group-btn"
              onClick={openGroupForm}
              disabled={contacts.length === 0}
              title={
                contacts.length === 0
                  ? "Add contacts before creating a group"
                  : "Create a group"
              }
            >
              <FaUsers /> Create Group
            </button>

            <button
              type="button"
              className="add-contact-btn"
              onClick={() => setShowForm(true)}
            >
              <FaUserPlus /> Add Contact
            </button>

          </div>
        </div>

        {/* CONTACT STATISTICS */}
        <div className="contacts-stats">

          <button
            type="button"
            className="contact-stat-card contact-stat-clickable"
            onClick={() => {
              setSearch("");

              contactsListRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });
            }}
            title="View all contacts"
          >
            <FaAddressBook />

            <div>
              <h2>{contacts.length}</h2>
              <p>Total Contacts</p>
            </div>
          </button>

          <div className="contact-stat-card">
            <FaUsers />

            <div>
              <h2>{onlineCount}</h2>
              <p>Online Now</p>
            </div>
          </div>

        </div>

        {/* CONTACT LIST */}
        <div
          className="contacts-list-container"
          ref={contactsListRef}
        >

          <div className="contacts-list-header">

            <div>
              <h2>My Contacts</h2>
              <p>Your saved contacts in AME Messenger</p>
            </div>

            <div className="contact-search">
              <FaSearch />

              <input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

          </div>

          <div className="contacts-list">

            {loading ? (
              <div className="empty-contacts">
                <FaUserCircle />
                <h3>Loading contacts...</h3>
              </div>

            ) : filteredContacts.length === 0 ? (
              <div className="empty-contacts">
                <FaUserCircle />
                <h3>No contacts found</h3>
                <p>Add a new contact using their email address.</p>

                <button onClick={() => setShowForm(true)}>
                  Add Your First Contact
                </button>
              </div>

            ) : (
              filteredContacts.map((contact) => (
                <div className="contact-item" key={contact._id}>

                  <div className="contact-avatar">
                    {contact.contactUser?.profilePhoto ? (
                      <img
                        src={contact.contactUser.profilePhoto}
                        alt={contact.contactUser.username}
                        className="contact-avatar-image"
                      />
                    ) : (
                      <FaUserCircle />
                    )}
                  </div>

                  <div className="contact-details">

                    <h3>
                      {contact.nickname || contact.contactUser.username}
                      {contact.isBlocked ? <small className="contact-blocked-label"> · Blocked</small> : null}
                    </h3>

                    <p>
                      <FaEnvelope /> {contact.contactUser.email}
                    </p>

                    <span>
                      {ROLE_LABELS[contact.contactUser.role] ||
                        contact.contactUser.role}

                      {contact.nickname &&
                        ` · ${contact.contactUser.username}`}
                    </span>

                  </div>

                  <div className="contact-actions">

                    <button
                      type="button"
                      title="Message"
                      disabled={openingContactId === contact._id || contact.isBlocked}
                      onClick={() => startChat(contact)}
                    >
                      <FaComments />
                    </button>

                    <button
                      type="button"
                      title="Edit nickname"
                      onClick={() => editContact(contact)}
                    >
                      <FaEdit />
                    </button>

                    <button type="button" title={contact.isBlocked ? "Unblock" : "Block"} onClick={() => toggleBlockContact(contact)}>
                      <FaBan />
                    </button>
                    <button type="button" title="Delete" onClick={() => deleteContact(contact._id)}>
                      <FaTrash />
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>
        </div>

        {/* MY GROUPS LIST */}
        <div className="my-groups-container">

          <div className="my-groups-header">

            <div>
              <h2>
                <FaUsers /> My Groups
              </h2>

              <p>
                Your created and joined group conversations
              </p>
            </div>

            <div className="group-list-search">
              <FaSearch />

              <input
                type="search"
                placeholder="Search groups..."
                value={groupListSearch}
                onChange={(e) => setGroupListSearch(e.target.value)}
              />
            </div>

          </div>

          <div className="my-groups-list">

            {groupsLoading ? (
              <div className="empty-groups">
                <FaUsers />
                <h3>Loading groups...</h3>
              </div>

            ) : filteredGroups.length === 0 ? (
              <div className="empty-groups">
                <FaUsers />

                <h3>
                  {groups.length === 0
                    ? "No groups yet"
                    : "No groups found"}
                </h3>

                <p>
                  {groups.length === 0
                    ? "Create a group to start conversations with multiple people."
                    : "Try searching with another group name."}
                </p>

                {groups.length === 0 && (
                  <button
                    type="button"
                    onClick={openGroupForm}
                    disabled={contacts.length === 0}
                  >
                    <FaUsers /> Create Your First Group
                  </button>
                )}
              </div>

            ) : (
              filteredGroups.map((group) => (
                <div
                  className="group-contact-item"
                  key={group._id}
                  onClick={() => viewGroupMembers(group)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      viewGroupMembers(group);
                    }
                  }}
                  title="View group members"
                >

                  <span className="group-contact-avatar">

                    {group.groupImage ? (
                      <img
                        src={group.groupImage}
                        alt={group.groupName || "Group"}
                      />
                    ) : (
                      <FaUsers />
                    )}

                  </span>

                  <span className="group-contact-details">

                    <strong>
                      {group.groupName || group.name || "Unnamed Group"}
                    </strong>

                    <small>
                      <FaUsers />
                      {" "}
                      {Array.isArray(group.participants)
                        ? `${group.participants.length} members`
                        : "Group conversation"}
                    </small>

                  </span>

                  <button
                    type="button"
                    className="group-contact-action"
                    title="Open group chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      startGroupChat(group);
                    }}
                  >
                    <FaComments />
                  </button>

                </div>
              ))
            )}

          </div>
        </div>

        {/* GROUP MEMBERS MODAL */}
        {showMembersModal && selectedGroup && (
          <div
            className="group-modal-overlay"
            onClick={() => {
              setShowMembersModal(false);
              setShowInvitePanel(false);
            }}
          >

            <div
              className="group-members-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="group-members-title"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="group-modal-header">

                <div>
                  <h2 id="group-members-title">
                    {selectedGroup.groupName ||
                      selectedGroup.name ||
                      "Group Members"}
                  </h2>

                  <p>
                    {selectedGroup.participants?.length || 0} members in this group
                  </p>

                  {selectedGroupIsAdmin && (
                    <span className="group-admin-badge">
                      <FaCrown /> You are the Group Admin
                    </span>
                  )}

                </div>

                <button
                  type="button"
                  className="group-modal-close"
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowInvitePanel(false);
                  }}
                  aria-label="Close members"
                >
                  <FaTimes />
                </button>

              </div>

              <div className="group-members-list">

                {Array.isArray(selectedGroup.participants) &&
                selectedGroup.participants.length > 0 ? (

                  selectedGroup.participants.map((member, index) => {

                    const memberId = getUserId(member);

                    const displayName =
                      typeof member === "object"
                        ? member.username ||
                          member.name ||
                          member.email ||
                          "Unknown User"
                        : "Group Member";

                    const memberEmail =
                      typeof member === "object"
                        ? member.email || "AME Messenger member"
                        : "Member details unavailable";

                    const profilePhoto =
                      typeof member === "object"
                        ? member.profilePhoto
                        : null;

                    const isAdmin =
                      getUserId(selectedGroup.groupAdmin) === memberId;

                    const isCurrentUser =
                      currentUserId === memberId;

                    return (
                      <div
                        className="group-member-view-item"
                        key={memberId || index}
                      >

                        <div className="group-member-view-avatar">

                          {profilePhoto ? (
                            <img
                              src={profilePhoto}
                              alt={displayName}
                            />
                          ) : (
                            <FaUserCircle />
                          )}

                        </div>

                        <div className="group-member-view-details">
                          <strong>
                            {displayName}
                            {isCurrentUser && " (You)"}
                          </strong>

                          <small>{memberEmail}</small>

                          {isAdmin && (
                            <small className="group-admin-label">
                              <FaCrown /> Group Admin
                            </small>
                          )}
                        </div>

                        {!isCurrentUser && (
                          <button
                            type="button"
                            className="member-personal-chat-btn"
                            onClick={() =>
                              startMemberPersonalChat(member)
                            }
                            disabled={
                              !memberId ||
                              openingMemberId === String(memberId)
                            }
                            title="Open personal chat"
                          >
                            <FaComments />

                            {openingMemberId === String(memberId)
                              ? "Opening..."
                              : "Message"}
                          </button>
                        )}

                        {selectedGroupIsAdmin &&
                          !isAdmin &&
                          !isCurrentUser && (
                            <button
                              type="button"
                              className="group-member-remove-btn"
                              title="Remove member"
                              disabled={groupActionLoading}
                              onClick={() => removeGroupMember(member)}
                            >
                              <FaUserMinus />
                              Remove
                            </button>
                          )}

                      </div>
                    );
                  })

                ) : (
                  <div className="group-no-members">
                    No group members found.
                  </div>
                )}

              </div>

              {/* INVITE MEMBERS PANEL */}
              {showInvitePanel && selectedGroupIsAdmin && (
                <div className="group-invite-panel">

                  <div className="group-invite-heading">
                    <h3>Invite Members</h3>

                    <button
                      type="button"
                      onClick={() => setShowInvitePanel(false)}
                      aria-label="Close invite panel"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <p>Select saved contacts to add to this group.</p>

                  <div className="group-member-search">
                    <FaSearch />

                    <input
                      type="search"
                      value={inviteSearch}
                      onChange={(e) => setInviteSearch(e.target.value)}
                      placeholder="Search contacts..."
                    />
                  </div>

                  <div className="group-member-list">

                    {availableInviteContacts.length === 0 ? (
                      <div className="group-no-members">
                        No available contacts to invite.
                      </div>
                    ) : (
                      availableInviteContacts.map((contact) => {
                        const userId = String(
                          contact.contactUser?._id || ""
                        );

                        const checked =
                          inviteSelectedIds.includes(userId);

                        const displayName =
                          contact.nickname ||
                          contact.contactUser?.username ||
                          "Unknown user";

                        return (
                          <label
                            className={`group-member-option ${
                              checked ? "selected" : ""
                            }`}
                            key={contact._id}
                          >

                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleInviteMember(userId)}
                            />

                            <span className="group-member-avatar">
                              {contact.contactUser?.profilePhoto ? (
                                <img
                                  src={contact.contactUser.profilePhoto}
                                  alt={displayName}
                                />
                              ) : (
                                <FaUserCircle />
                              )}
                            </span>

                            <span className="group-member-copy">
                              <strong>{displayName}</strong>
                              <small>
                                {contact.contactUser?.email}
                              </small>
                            </span>

                            <span className="group-member-check">
                              {checked && <FaCheck />}
                            </span>

                          </label>
                        );
                      })
                    )}

                  </div>

                  <button
                    type="button"
                    className="group-invite-submit"
                    disabled={
                      groupActionLoading ||
                      inviteSelectedIds.length === 0
                    }
                    onClick={inviteMembers}
                  >
                    {groupActionLoading
                      ? "Adding..."
                      : `Add Selected Members (${inviteSelectedIds.length})`}

                    <FaUserPlus />
                  </button>

                </div>
              )}

              <div className="group-members-footer">

                {selectedGroupIsAdmin && !showInvitePanel && (
                  <button
                    type="button"
                    className="group-invite-btn"
                    onClick={openInvitePanel}
                    disabled={groupActionLoading}
                  >
                    <FaUserPlus /> Invite Members
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowInvitePanel(false);
                    startGroupChat(selectedGroup);
                  }}
                >
                  <FaComments /> Open Group Chat
                </button>

                <button
                  type="button"
                  className="group-leave-btn"
                  onClick={leaveGroup}
                  disabled={groupActionLoading}
                >
                  <FaSignOutAlt />
                  {groupActionLoading ? "Please wait..." : "Leave Group"}
                </button>

              </div>

            </div>
          </div>
        )}

        {/* ADD / EDIT CONTACT MODAL */}
        {showForm && (
          <div className="contact-modal-overlay">

            <div className="contact-modal">

              <div className="contact-modal-header">

                <div>
                  <h2>
                    {editingId ? "Edit Contact" : "New Contact"}
                  </h2>

                  <p>
                    {editingId
                      ? "You can change the nickname of this contact."
                      : "Enter the email address of a registered user."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                >
                  <FaTimes />
                </button>

              </div>

              <form onSubmit={saveContact}>

                <div className="contact-photo">
                  <FaUserCircle />
                </div>

                <div className="contact-form-grid">

                  <div className="contact-field full-width">
                    <label>Email Address *</label>

                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      type="email"
                      disabled={Boolean(editingId)}
                      required
                    />
                  </div>

                  <div className="contact-field full-width">
                    <label>Nickname (optional)</label>

                    <input
                      name="nickname"
                      value={form.nickname}
                      onChange={handleChange}
                      placeholder="How do you want to see this contact?"
                      maxLength={60}
                    />
                  </div>

                </div>

                <div className="contact-form-actions">

                  <button
                    type="button"
                    className="cancel-contact-btn"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="save-contact-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Contact"
                        : "Add Contact"}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {/* CREATE GROUP MODAL */}
        {showGroupForm && (
          <div className="group-modal-overlay">

            <div
              className="group-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="group-modal-title"
            >

              <div className="group-modal-header">

                <div>
                  <h2 id="group-modal-title">
                    Create New Group
                  </h2>

                  <p>
                    Choose a name and add people from your contacts.
                  </p>
                </div>

                <button
                  type="button"
                  className="group-modal-close"
                  onClick={() => setShowGroupForm(false)}
                  disabled={creatingGroup}
                  aria-label="Close group form"
                >
                  <FaTimes />
                </button>

              </div>

              <form onSubmit={createGroup}>

                {/* GROUP PROFILE PHOTO EDITOR */}
<div className="group-profile-editor">

  <div className="group-profile-heading">
    <h3>Group Profile Photo</h3>
    <p>Add a photo for your group (optional).</p>
  </div>

  <div className="group-profile-upload">

    {groupImagePreview ? (
      <div className="group-profile-crop-wrapper">

        <div className="group-profile-crop-area">
          <Cropper
            image={groupImagePreview}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="group-crop-controls">

          <label>
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span>{zoom.toFixed(1)}x</span>
          </label>

          <div className="group-rotate-controls">
            <button
              type="button"
              onClick={() => setRotation((previous) => previous - 90)}
            >
              ↶ Rotate Left
            </button>

            <button
              type="button"
              onClick={() => setRotation((previous) => previous + 90)}
            >
              ↷ Rotate Right
            </button>
          </div>

        </div>

        <button
          type="button"
          className="group-photo-remove-btn"
          onClick={removeGroupImage}
        >
          <FaTrash /> Remove Photo
        </button>

      </div>

    ) : (
      <div className="group-profile-placeholder">
        <FaUsers />
        <span>No group photo selected</span>
      </div>
    )}

    <input
      ref={groupImageInputRef}
      type="file"
      accept="image/*"
      onChange={handleGroupImageSelect}
      hidden
    />

    <button
      type="button"
      className="group-photo-select-btn"
      onClick={() => groupImageInputRef.current?.click()}
    >
      <FaUserPlus />
      {groupImagePreview ? "Change Photo" : "Choose Group Photo"}
    </button>

  </div>
</div>

                <div className="group-name-field">
                  <label htmlFor="new-group-name">
                    Group name *
                  </label>

                  <input
                    id="new-group-name"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Project Team"
                    maxLength={60}
                    required
                  />
                </div>

                <div className="group-member-heading">

                  <div>
                    <h3>Add group members</h3>
                    <p>Select one or more saved contacts.</p>
                  </div>

                  <span>
                    {selectedMemberIds.length} selected
                  </span>

                </div>

                <div className="group-member-search">
                  <FaSearch />

                  <input
                    type="search"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Search contacts..."
                    aria-label="Search group contacts"
                  />
                </div>

                <div className="group-member-list">

                  {filteredGroupContacts.length === 0 ? (
                    <div className="group-no-members">
                      {contacts.length === 0
                        ? "You have no saved contacts yet. Add contacts first."
                        : "No contacts match your search."}
                    </div>

                  ) : (
                    filteredGroupContacts.map((contact) => {
                      const userId = String(
                        contact.contactUser?._id || ""
                      );

                      const checked =
                        selectedMemberIds.includes(userId);

                      const displayName =
                        contact.nickname ||
                        contact.contactUser?.username ||
                        "Unknown user";

                      return (
                        <label
                          className={`group-member-option ${
                            checked ? "selected" : ""
                          }`}
                          key={contact._id}
                        >

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGroupMember(userId)}
                          />

                          <span className="group-member-avatar">

                            {contact.contactUser?.profilePhoto ? (
                              <img
                                src={contact.contactUser.profilePhoto}
                                alt={displayName}
                              />
                            ) : (
                              <FaUserCircle />
                            )}

                          </span>

                          <span className="group-member-copy">
                            <strong>{displayName}</strong>
                            <small>
                              {contact.contactUser?.email}
                            </small>
                          </span>

                          <span className="group-member-check">
                            {checked && <FaCheck />}
                          </span>

                        </label>
                      );
                    })
                  )}

                </div>

                <div className="group-modal-actions">

                  <button
                    type="button"
                    className="group-cancel-btn"
                   onClick={() => {removeGroupImage();
                                   setShowGroupForm(false);}}
          disabled={creatingGroup}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="group-create-submit"
                    disabled={
                      creatingGroup ||
                      !groupName.trim() ||
                      selectedMemberIds.length === 0
                    }
                  >
                    {creatingGroup
                      ? "Creating..."
                      : `Create Group (${selectedMemberIds.length})`}

                    <FaUsers />
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {/* SUCCESS NOTIFICATION */}
        {toastMessage && (
          <div
            className="contact-success-toast"
            role="status"
            aria-live="polite"
          >
            <FaCheck />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
