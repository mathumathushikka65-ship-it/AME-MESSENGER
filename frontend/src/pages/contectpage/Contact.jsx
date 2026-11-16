import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../services/api";
import "./Contact.css";

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
  FaCheck
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

export default function Contact() {
  const navigate = useNavigate();

  const role = "Student";

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // WHATSAPP-STYLE GROUP CREATION
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

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

  // LOAD CONTACTS FROM DATABASE
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

      // UPDATE CONTACT LIST WITHOUT DUPLICATES
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

  // OPEN EXISTING CHAT OR CREATE NEW CHAT
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

  // OPEN GROUP CREATION WINDOW
  const openGroupForm = () => {
    setGroupName("");
    setGroupSearch("");
    setSelectedMemberIds([]);
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

  // CREATE GROUP
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

      const response = await fetch(
        `${API_URL}/conversations/group`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            groupName: cleanName,
            participants: selectedMemberIds
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

      setShowGroupForm(false);
      setGroupName("");
      setGroupSearch("");
      setSelectedMemberIds([]);

      showToast("Group created successfully! Opening group chat...");

      // OPEN NEW GROUP IN MESSENGER
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

  // FILTER GROUP MEMBERS
  const filteredGroupContacts = contacts.filter((contact) => {
    const displayName =
      contact.nickname || contact.contactUser?.username || "";

    const email = contact.contactUser?.email || "";
    const query = groupSearch.toLowerCase().trim();

    return `${displayName} ${email}`
      .toLowerCase()
      .includes(query);
  });

  // ONLINE CONTACT COUNT
  const onlineCount = contacts.filter(
    (contact) => contact.contactUser?.isOnline
  ).length;

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

                  {/* CONTACT PROFILE PHOTO */}
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

                  {/* CONTACT INFORMATION */}
                  <div className="contact-details">

                    <h3>
                      {contact.nickname ||
                        contact.contactUser.username}
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

                  {/* CONTACT ACTIONS */}
                  <div className="contact-actions">

                    <button
                      type="button"
                      title={
                        openingContactId === contact._id
                          ? "Opening chat..."
                          : "Message"
                      }
                      disabled={openingContactId === contact._id}
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

                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteContact(contact._id)}
                    >
                      <FaTrash />
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>
        </div>

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
                    onClick={() => setShowGroupForm(false)}
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



