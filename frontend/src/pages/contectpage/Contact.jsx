import React, { useEffect, useState } from "react";
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
  FaCalendarAlt
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

// Ovoru request-layum login token-a anuppum
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("ameToken")}`
});

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

  // Page open aagum pothu DB-la irundhu contacts load pannum
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

        setContacts(data);
      } catch (error) {
        alert(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  // ADD (POST) illa EDIT (PUT)
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

      setContacts((previous) =>
        editingId
          ? previous.map((contact) =>
              contact._id === editingId ? data : contact
            )
          : [data, ...previous]
      );

      alert(
        editingId
          ? "Contact updated successfully!"
          : "Contact added successfully!"
      );

      resetForm();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const editContact = (contact) => {
    setForm({
      email: contact.contactUser.email,
      nickname: contact.nickname || ""
    });
    setEditingId(contact._id);
    setShowForm(true);
  };

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
    } catch (error) {
      alert(error.message);
    }
  };

  // Message button: andha contact-oda chat create/open panni Messenger-ku poga
  const startChat = async (contact) => {
    try {
      const response = await fetch(`${API_URL}/conversations/personal`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ userId: contact.contactUser._id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to open chat.");
      }

      navigate("/Messenger", { state: { conversationId: data._id } });
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    `${contact.nickname} ${contact.contactUser?.username} ${contact.contactUser?.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const onlineCount = contacts.filter(
    (contact) => contact.contactUser?.isOnline
  ).length;

  return (
    <div className="contacts-layout">

      {/*  SIDEBAR  */}
      <aside className="assignments-sidebar">
        <div className="sidebar-logo">
          <img src="/102893.jpg" alt="AME Logo" className="logo-image" />
          <span>AME MESSENGER</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-menu">
          <a href="/Home"><FaHome /> Dashboard</a>
          <a href="/Assignment"><FaTasks /> Assignments</a>
          <a href="/Messenger"><FaUsers /> Messenger</a>
          <a href="/Contact" className="active"><FaAddressBook /> Contacts</a>
          <a href="/Documents"><FaFileAlt /> Documents</a>
          <a href="/Reminder"><FaBell /> Reminders</a>
          <a href="/Calendar"><FaCalendarAlt /> Calendar</a>
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

      {/*  MAIN CONTENT  */}
      <div className="contacts-page">

        <div className="contacts-header">
          <div>
            <span>AME MESSENGER / CONTACTS</span>
            <h1>Contacts</h1>
            <p>Manage your people and start conversations.</p>
          </div>

          <button
            className="add-contact-btn"
            onClick={() => setShowForm(true)}
          >
            <FaUserPlus /> Add Contact
          </button>
        </div>

        <div className="contacts-stats">
          <div className="contact-stat-card">
            <FaAddressBook />
            <div>
              <h2>{contacts.length}</h2>
              <p>Total Contacts</p>
            </div>
          </div>

          <div className="contact-stat-card">
            <FaUsers />
            <div>
              <h2>{onlineCount}</h2>
              <p>Online Now</p>
            </div>
          </div>
        </div>

        <div className="contacts-list-container">

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
                    </h3>
                    <p><FaEnvelope /> {contact.contactUser.email}</p>
                    <span>
                      {ROLE_LABELS[contact.contactUser.role] ||
                        contact.contactUser.role}
                      {contact.nickname &&
                        ` · ${contact.contactUser.username}`}
                    </span>
                  </div>

                  <div className="contact-actions">
                    <button
                      title="Message"
                      onClick={() => startChat(contact)}
                    >
                      <FaComments />
                    </button>

                    <button
                      title="Edit nickname"
                      onClick={() => editContact(contact)}
                    >
                      <FaEdit />
                    </button>

                    <button
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

        {showForm && (
          <div className="contact-modal-overlay">
            <div className="contact-modal">

              <div className="contact-modal-header">
                <div>
                  <h2>{editingId ? "Edit Contact" : "New Contact"}</h2>
                  <p>
                    {editingId
                      ? "You can change the nickname of this contact."
                      : "Enter the email address of a registered user."}
                  </p>
                </div>

                <button onClick={resetForm}>
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

      </div>
    </div>
  );
}


