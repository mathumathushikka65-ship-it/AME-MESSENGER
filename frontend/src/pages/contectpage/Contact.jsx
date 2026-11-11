import React, { useState } from "react";
import "./Contact.css";
import {
  FaUserPlus,
  FaSearch,
  FaPhone,
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

export default function Contact() {

  const role = "Student";

  const [contacts, setContacts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    countryCode: "+94",
    phone: "",
    email: "",
    institution: "",
    role: "Student"
  });

  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      countryCode: "+94",
      phone: "",
      email: "",
      institution: "",
      role: "Student"
    });
    setEditingId(null);
    setShowForm(false);
  };

  const saveContact = (e) => {
    e.preventDefault();

    const fullPhone = form.countryCode + form.phone.replace(/\D/g, "");

    const duplicate = contacts.some(
      (contact) =>
        contact.phone === fullPhone &&
        contact.id !== editingId
    );

    if (duplicate) {
      alert("This phone number is already saved!");
      return;
    }

    if (editingId) {
      setContacts(
        contacts.map((contact) =>
          contact.id === editingId
            ? { ...form, phone: fullPhone, id: editingId }
            : contact
        )
      );
      alert("Contact updated successfully!");
    } else {
      setContacts([
        ...contacts,
        {
          ...form,
          phone: fullPhone,
          id: Date.now()
        }
      ]);
      alert("Contact saved successfully!");
    }

    resetForm();
  };

  const editContact = (contact) => {
    setForm({
      ...contact,
      phone: contact.phone.replace(contact.countryCode, "")
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const deleteContact = (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      setContacts(contacts.filter((contact) => contact.id !== id));
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    `${contact.firstName} ${contact.lastName} ${contact.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
            <FaPhone />
            <div>
              <h2>{contacts.length}</h2>
              <p>Saved Numbers</p>
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

            {filteredContacts.length === 0 ? (
              <div className="empty-contacts">
                <FaUserCircle />
                <h3>No contacts found</h3>
                <p>Add a new contact using their phone number.</p>
                <button onClick={() => setShowForm(true)}>
                  Add Your First Contact
                </button>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div className="contact-item" key={contact.id}>

                  <div className="contact-avatar">
                    <FaUserCircle />
                  </div>

                  <div className="contact-details">
                    <h3>
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <p><FaPhone /> {contact.phone}</p>
                    <span>{contact.role} · {contact.institution}</span>
                  </div>

                  <div className="contact-actions">
                    <button
                      title="Message"
                      onClick={() =>
                        alert("Connect this contact to your chat page.")
                      }
                    >
                      <FaComments />
                    </button>

                    <button
                      title="Edit"
                      onClick={() => editContact(contact)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      title="Delete"
                      onClick={() => deleteContact(contact.id)}
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
                  <p>Enter the contact information below.</p>
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

                  <div className="contact-field">
                    <label>First Name *</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label>Last Name</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="contact-field full-width">
                    <label>Phone Number *</label>

                    <div className="phone-input">
                      <select
                        name="countryCode"
                        value={form.countryCode}
                        onChange={handleChange}
                      >
                        <option value="+94">🇱🇰 +94</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>

                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        type="tel"
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-field full-width">
                    <label>Email Address</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      type="email"
                    />
                  </div>

                  <div className="contact-field">
                    <label>Institution</label>
                    <input
                      name="institution"
                      value={form.institution}
                      onChange={handleChange}
                      placeholder="School / University"
                    />
                  </div>

                  <div className="contact-field">
                    <label>User Role</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                    >
                      <option>Student</option>
                      <option>Teacher</option>
                      <option>University Student</option>
                      <option>Course Center</option>
                      <option>Admin</option>
                    </select>
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
                  >
                    {editingId ? "Update Contact" : "Save Contact"}
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


