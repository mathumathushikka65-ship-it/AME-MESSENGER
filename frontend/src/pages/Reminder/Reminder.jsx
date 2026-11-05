
// import React, { useMemo, useState ,useEffect , useRef } from "react";
// import {
//   FaHome,
//   FaBell,
//   FaTasks,
//   FaComments,
//   FaFileAlt,
//   FaCalendarAlt,
//   FaPlus,
//   FaSearch,
//   FaClock,
//   FaCheckCircle,
//   FaExclamationCircle,
//   FaEdit,
//   FaTrash,
//   FaTimes,
//   FaFilter,
//   FaRegCalendarCheck,
//   FaGraduationCap,
//   FaUser,
// } from "react-icons/fa";
// import "./Reminder.css";

// const getDate = (days = 0) => {
//   const date = new Date();
//   date.setDate(date.getDate() + days);

//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// };

// const initialReminders = [
//   {
//     id: 1,
//     title: "Submit React Assignment",
//     description: "Complete the React project and upload the final files.",
//     category: "Assignment",
//     date: getDate(1),
//     time: "10:00",
//     priority: "High",
//     completed: false,
//   },
//   {
//     id: 2,
//     title: "Database Management Exam",
//     description: "Revise SQL queries, ER diagrams and database concepts.",
//     category: "Exam",
//     date: getDate(3),
//     time: "09:30",
//     priority: "High",
//     completed: false,
//   },
//   {
//     id: 3,
//     title: "Project Team Meeting",
//     description: "Discuss AME Messenger project progress with the team.",
//     category: "Meeting",
//     date: getDate(0),
//     time: "15:00",
//     priority: "Medium",
//     completed: false,
//   },
//   {
//     id: 4,
//     title: "Read Chapter 5",
//     description: "Complete the reading task for the programming module.",
//     category: "Study",
//     date: getDate(-1),
//     time: "11:00",
//     priority: "Low",
//     completed: true,
//   },
// ];

// const emptyForm = {
//   title: "",
//   description: "",
//   category: "Assignment",
//   date: getDate(0),
//   time: "09:00",
//   priority: "Medium",
// };

// const categories = [
//   "Assignment",
//   "Exam",
//   "Meeting",
//   "Study",
//   "Personal",
//   "Event",
// ];

// const formatDate = (date) => {
//   if (!date) return "";

//   return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// const getDateLabel = (date) => {
//   if (date === getDate(0)) return "Today";
//   if (date === getDate(1)) return "Tomorrow";
//   return formatDate(date);
// };

// export default function Reminder() {
//   const [reminders, setReminders] = useState(initialReminders);
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("All");
//   const [categoryFilter, setCategoryFilter] = useState("All");
//   const [modal, setModal] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [form, setForm] = useState(emptyForm);
//   const [toast, setToast] = useState("");

//   const today = getDate(0);

//   const showToast = (message) => {
//     setToast(message);
//     window.setTimeout(() => setToast(""), 2500);
//   };

//   const totalCount = reminders.length;
//   const completedCount = reminders.filter(
//     (item) => item.completed
//   ).length;

//   const todayCount = reminders.filter(
//     (item) => item.date === today && !item.completed
//   ).length;

//   const upcomingCount = reminders.filter(
//     (item) => item.date > today && !item.completed
//   ).length;

//   const filteredReminders = useMemo(() => {
//     return reminders
//       .filter((item) => {
//         const searchMatch =
//           item.title.toLowerCase().includes(search.toLowerCase()) ||
//           item.description.toLowerCase().includes(search.toLowerCase());

//         const statusMatch =
//           filter === "All" ||
//           (filter === "Pending" && !item.completed) ||
//           (filter === "Completed" && item.completed) ||
//           (filter === "Today" && item.date === today && !item.completed) ||
//           (filter === "Upcoming" && item.date > today && !item.completed);

//         const categoryMatch =
//           categoryFilter === "All" || item.category === categoryFilter;

//         return searchMatch && statusMatch && categoryMatch;
//       })
//       .sort((a, b) => {
//         if (a.completed !== b.completed) {
//           return Number(a.completed) - Number(b.completed);
//         }

//         return (
//           new Date(`${a.date}T${a.time}`) -
//           new Date(`${b.date}T${b.time}`)
//         );
//       });
//   }, [reminders, search, filter, categoryFilter, today]);

//   const openCreateModal = () => {
//     setEditingId(null);
//     setForm({ ...emptyForm, date: today });
//     setModal(true);
//   };

//   const openEditModal = (reminder) => {
//     setEditingId(reminder.id);
//     setForm({
//       title: reminder.title,
//       description: reminder.description,
//       category: reminder.category,
//       date: reminder.date,
//       time: reminder.time,
//       priority: reminder.priority,
//     });
//     setModal(true);
//   };

//   const closeModal = () => {
//     setModal(false);
//     setEditingId(null);
//   };

//   const handleSave = (event) => {
//     event.preventDefault();

//     if (!form.title.trim() || !form.date || !form.time) {
//       showToast("Please complete all required fields.");
//       return;
//     }

//     if (editingId) {
//       setReminders((previous) =>
//         previous.map((item) =>
//           item.id === editingId ? { ...item, ...form } : item
//         )
//       );
//       showToast("Reminder updated successfully.");
//     } else {
//       const newReminder = {
//         ...form,
//         id: Date.now(),
//         completed: false,
//       };

//       setReminders((previous) => [newReminder, ...previous]);
//       showToast("Reminder created successfully.");
//     }

//     closeModal();
//   };

//   const toggleComplete = (id) => {
//     setReminders((previous) =>
//       previous.map((item) =>
//         item.id === id
//           ? { ...item, completed: !item.completed }
//           : item
//       )
//     );

//     const reminder = reminders.find((item) => item.id === id);

//     showToast(
//       reminder?.completed
//         ? "Reminder marked as pending."
//         : "Reminder completed!"
//     );
//   };

//   const deleteReminder = (id) => {
//     const confirmed = window.confirm(
//       "Are you sure you want to delete this reminder?"
//     );

//     if (!confirmed) return;

//     setReminders((previous) =>
//       previous.filter((item) => item.id !== id)
//     );

//     showToast("Reminder deleted.");
//   };

//   const getPriorityClass = (priority) => {
//     return `priority-${priority.toLowerCase()}`;
//   };

//   const getCategoryClass = (category) => {
//     return `category-${category.toLowerCase()}`;
//   };

//   const upcomingReminders = reminders
//     .filter((item) => !item.completed && item.date >= today)
//     .sort(
//       (a, b) =>
//         new Date(`${a.date}T${a.time}`) -
//         new Date(`${b.date}T${b.time}`)
//     )
//     .slice(0, 3);

//   return (
//     <div className="reminders-page">
//       {/* SIDEBAR */}
//       <aside className="reminders-sidebar">
//         <div className="reminders-logo">
//           <span className="reminders-logo-icon">A</span>
//           <span>AME MESSENGER</span>
//         </div>

//         <p className="reminders-menu-label">MAIN MENU</p>

//         <nav className="reminders-nav">
//           <a href="/Home">
//             <FaHome /> Dashboard
//           </a>

//           <a href="/Assignments">
//             <FaTasks /> Assignments
//           </a>

//           <a href="/Messenger">
//             <FaComments /> Messenger
//           </a>

//           <a href="/Documents">
//             <FaFileAlt /> Documents
//           </a>

//           <a href="/Reminders" className="active">
//             <FaBell /> Reminders
//           </a>

//           <a href="/Calendar">
//             <FaCalendarAlt /> Calendar
//           </a>
//         </nav>

//         <div className="reminders-sidebar-profile">
//           <div className="reminders-avatar">K</div>
//           <div>
//             <strong>Kavitha</strong>
//             <small>Student</small>
//           </div>
//         </div>
//       </aside>

//       {/* MAIN CONTENT */}
//       <main className="reminders-main">
//         {/* HEADER */}
//         <header className="reminders-header">
//           <div>
//             <p className="reminders-breadcrumb">
//               Dashboard / Reminders
//             </p>
//             <h1>Reminders</h1>
//             <p className="reminders-subtitle">
//               Stay organised and never miss an important task.
//             </p>
//           </div>

//           <button
//             className="reminder-primary-btn"
//             onClick={openCreateModal}
//           >
//             <FaPlus /> Create Reminder
//           </button>
//         </header>

//         {/* WELCOME BANNER */}
//         <section className="reminder-banner">
//           <div>
//             <span className="reminder-banner-label">
//               <FaGraduationCap /> YOUR PERSONAL PLANNER
//             </span>
//             <h2>Plan your day. Achieve your goals.</h2>
//             <p>
//               Keep track of assignments, exams, meetings and
//               important activities in one place.
//             </p>
//           </div>

//           <div className="reminder-banner-icon">
//             <FaBell />
//           </div>
//         </section>

//         {/* STATISTICS */}
//         <section className="reminder-stats">
//           <div className="reminder-stat-card">
//             <div className="reminder-stat-icon stat-blue">
//               <FaBell />
//             </div>
//             <div>
//               <p>Total Reminders</p>
//               <h2>{totalCount}</h2>
//             </div>
//           </div>

//           <div className="reminder-stat-card">
//             <div className="reminder-stat-icon stat-orange">
//               <FaClock />
//             </div>
//             <div>
//               <p>Today's Tasks</p>
//               <h2>{todayCount}</h2>
//             </div>
//           </div>

//           <div className="reminder-stat-card">
//             <div className="reminder-stat-icon stat-purple">
//               <FaCalendarAlt />
//             </div>
//             <div>
//               <p>Upcoming</p>
//               <h2>{upcomingCount}</h2>
//             </div>
//           </div>

//           <div className="reminder-stat-card">
//             <div className="reminder-stat-icon stat-green">
//               <FaCheckCircle />
//             </div>
//             <div>
//               <p>Completed</p>
//               <h2>{completedCount}</h2>
//             </div>
//           </div>
//         </section>

//         {/* CONTENT LAYOUT */}
//         <div className="reminders-content-layout">
//           <section className="reminders-list-section">
//             <div className="reminders-section-heading">
//               <div>
//                 <h2>All Reminders</h2>
//                 <p>Manage your daily tasks and activities.</p>
//               </div>
//             </div>

//             {/* SEARCH AND FILTER */}
//             <div className="reminders-toolbar">
//               <div className="reminder-search">
//                 <FaSearch />
//                 <input
//                   type="text"
//                   placeholder="Search reminders..."
//                   value={search}
//                   onChange={(event) => setSearch(event.target.value)}
//                 />
//               </div>

//               <select
//                 value={filter}
//                 onChange={(event) => setFilter(event.target.value)}
//               >
//                 <option value="All">All Status</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Today">Today</option>
//                 <option value="Upcoming">Upcoming</option>
//                 <option value="Completed">Completed</option>
//               </select>

//               <select
//                 value={categoryFilter}
//                 onChange={(event) =>
//                   setCategoryFilter(event.target.value)
//                 }
//               >
//                 <option value="All">All Categories</option>
//                 {categories.map((category) => (
//                   <option value={category} key={category}>
//                     {category}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* REMINDER LIST */}
//             <div className="reminder-list">
//               {filteredReminders.map((reminder) => (
//                 <article
//                   className={`reminder-card ${
//                     reminder.completed ? "is-completed" : ""
//                   }`}
//                   key={reminder.id}
//                 >
//                   <button
//                     className={`reminder-check ${
//                       reminder.completed ? "checked" : ""
//                     }`}
//                     title="Mark as completed"
//                     onClick={() => toggleComplete(reminder.id)}
//                   >
//                     {reminder.completed && <FaCheckCircle />}
//                   </button>

//                   <div className="reminder-card-content">
//                     <div className="reminder-card-top">
//                       <span
//                         className={`reminder-category ${getCategoryClass(
//                           reminder.category
//                         )}`}
//                       >
//                         {reminder.category}
//                       </span>

//                       <span
//                         className={`reminder-priority ${getPriorityClass(
//                           reminder.priority
//                         )}`}
//                       >
//                         <FaExclamationCircle />
//                         {reminder.priority}
//                       </span>
//                     </div>

//                     <h3>{reminder.title}</h3>

//                     <p className="reminder-description">
//                       {reminder.description || "No description provided."}
//                     </p>

//                     <div className="reminder-card-meta">
//                       <span>
//                         <FaCalendarAlt />
//                         {getDateLabel(reminder.date)}
//                       </span>

//                       <span>
//                         <FaClock />
//                         {reminder.time}
//                       </span>

//                       <span className="reminder-status">
//                         {reminder.completed ? "Completed" : "Pending"}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="reminder-card-actions">
//                     <button
//                       className="reminder-action edit"
//                       title="Edit reminder"
//                       onClick={() => openEditModal(reminder)}
//                     >
//                       <FaEdit />
//                     </button>

//                     <button
//                       className="reminder-action delete"
//                       title="Delete reminder"
//                       onClick={() => deleteReminder(reminder.id)}
//                     >
//                       <FaTrash />
//                     </button>
//                   </div>
//                 </article>
//               ))}

//               {filteredReminders.length === 0 && (
//                 <div className="reminder-empty">
//                   <FaRegCalendarCheck />
//                   <h3>No reminders found</h3>
//                   <p>
//                     Try another search or create a new reminder.
//                   </p>
//                   <button
//                     className="reminder-primary-btn"
//                     onClick={openCreateModal}
//                   >
//                     <FaPlus /> Create Reminder
//                   </button>
//                 </div>
//               )}
//             </div>
//           </section>

//           {/* RIGHT PANEL */}
//           <aside className="reminders-right-panel">
//             <div className="upcoming-panel">
//               <div className="panel-heading">
//                 <div>
//                   <h3>Coming Up</h3>
//                   <p>Your next important reminders</p>
//                 </div>
//                 <FaCalendarAlt />
//               </div>

//               {upcomingReminders.length > 0 ? (
//                 <div className="upcoming-list">
//                   {upcomingReminders.map((item) => (
//                     <div className="upcoming-item" key={item.id}>
//                       <div className="upcoming-date">
//                         <strong>
//                           {new Date(
//                             `${item.date}T00:00:00`
//                           ).getDate()}
//                         </strong>
//                         <small>
//                           {new Date(
//                             `${item.date}T00:00:00`
//                           ).toLocaleDateString("en-US", {
//                             month: "short",
//                           })}
//                         </small>
//                       </div>

//                       <div className="upcoming-details">
//                         <strong>{item.title}</strong>
//                         <span>
//                           <FaClock /> {item.time}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="upcoming-empty">
//                   No upcoming reminders.
//                 </div>
//               )}
//             </div>

//             <div className="reminder-tips">
//               <div className="tips-icon">
//                 <FaGraduationCap />
//               </div>
//               <h3>Stay productive!</h3>
//               <p>
//                 Break big tasks into smaller steps and complete
//                 them one by one.
//               </p>
//             </div>

//             <div className="reminder-progress-panel">
//               <h3>Your Progress</h3>
//               <div className="progress-info">
//                 <span>Completed reminders</span>
//                 <strong>
//                   {totalCount === 0
//                     ? 0
//                     : Math.round((completedCount / totalCount) * 100)}
//                   %
//                 </strong>
//               </div>

//               <div className="reminder-progress-track">
//                 <div
//                   className="reminder-progress-fill"
//                   style={{
//                     width: `${
//                       totalCount === 0
//                         ? 0
//                         : (completedCount / totalCount) * 100
//                     }%`,
//                   }}
//                 />
//               </div>

//               <small>
//                 {completedCount} of {totalCount} reminders completed
//               </small>
//             </div>
//           </aside>
//         </div>
//       </main>

//       {/* CREATE / EDIT MODAL */}
//       {modal && (
//         <div
//           className="reminder-modal-overlay"
//           onClick={closeModal}
//         >
//           <div
//             className="reminder-modal"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="reminder-modal-header">
//               <div>
//                 <h2>
//                   {editingId ? "Edit Reminder" : "Create Reminder"}
//                 </h2>
//                 <p>
//                   Add the details of your reminder below.
//                 </p>
//               </div>

//               <button
//                 className="reminder-modal-close"
//                 onClick={closeModal}
//                 type="button"
//               >
//                 <FaTimes />
//               </button>
//             </div>

//             <form
//               className="reminder-form"
//               onSubmit={handleSave}
//             >
//               <div className="reminder-form-group">
//                 <label>Reminder Title *</label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Submit assignment"
//                   value={form.title}
//                   onChange={(event) =>
//                     setForm({ ...form, title: event.target.value })
//                   }
//                   required
//                 />
//               </div>

//               <div className="reminder-form-group">
//                 <label>Description</label>
//                 <textarea
//                   placeholder="Write a short description..."
//                   value={form.description}
//                   onChange={(event) =>
//                     setForm({
//                       ...form,
//                       description: event.target.value,
//                     })
//                   }
//                 />
//               </div>

//               <div className="reminder-form-row">
//                 <div className="reminder-form-group">
//                   <label>Category</label>
//                   <select
//                     value={form.category}
//                     onChange={(event) =>
//                       setForm({
//                         ...form,
//                         category: event.target.value,
//                       })
//                     }
//                   >
//                     {categories.map((category) => (
//                       <option value={category} key={category}>
//                         {category}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="reminder-form-group">
//                   <label>Priority</label>
//                   <select
//                     value={form.priority}
//                     onChange={(event) =>
//                       setForm({
//                         ...form,
//                         priority: event.target.value,
//                       })
//                     }
//                   >
//                     <option value="High">High</option>
//                     <option value="Medium">Medium</option>
//                     <option value="Low">Low</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="reminder-form-row">
//                 <div className="reminder-form-group">
//                   <label>Date *</label>
//                   <input
//                     type="date"
//                     value={form.date}
//                     onChange={(event) =>
//                       setForm({ ...form, date: event.target.value })
//                     }
//                     required
//                   />
//                 </div>

//                 <div className="reminder-form-group">
//                   <label>Time *</label>
//                   <input
//                     type="time"
//                     value={form.time}
//                     onChange={(event) =>
//                       setForm({ ...form, time: event.target.value })
//                     }
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="reminder-modal-actions">
//                 <button
//                   type="button"
//                   className="reminder-cancel-btn"
//                   onClick={closeModal}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="reminder-primary-btn"
//                 >
//                   <FaCheckCircle />
//                   {editingId ? "Save Changes" : "Create Reminder"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* TOAST */}
//       {toast && (
//         <div className="reminder-toast">
//           <FaCheckCircle />
//           {toast}
//         </div>
//       )}
//     </div>
//   );
// }




import React, { useMemo, useState ,useEffect , useRef } from "react";
import {
  FaHome,
  FaBell,
  FaTasks,
  FaComments,
  FaFileAlt,
  FaCalendarAlt,
  FaPlus,
  FaSearch,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaEdit,
  FaTrash,
  FaTimes,
  FaFilter,
  FaRegCalendarCheck,
  FaGraduationCap,
  FaUser,
} from "react-icons/fa";
import "./Reminder.css";

const getDate = (days = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialReminders = [
  {
    id: 1,
    title: "Submit React Assignment",
    description: "Complete the React project and upload the final files.",
    category: "Assignment",
    date: getDate(1),
    time: "10:00",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "Database Management Exam",
    description: "Revise SQL queries, ER diagrams and database concepts.",
    category: "Exam",
    date: getDate(3),
    time: "09:30",
    priority: "High",
    completed: false,
  },
  {
    id: 3,
    title: "Project Team Meeting",
    description: "Discuss AME Messenger project progress with the team.",
    category: "Meeting",
    date: getDate(0),
    time: "15:00",
    priority: "Medium",
    completed: false,
  },
  {
    id: 4,
    title: "Read Chapter 5",
    description: "Complete the reading task for the programming module.",
    category: "Study",
    date: getDate(-1),
    time: "11:00",
    priority: "Low",
    completed: true,
  },
];

const emptyForm = {
  title: "",
  description: "",
  category: "Assignment",
  date: getDate(0),
  time: "09:00",
  priority: "Medium",
};

const categories = [
  "Assignment",
  "Exam",
  "Meeting",
  "Study",
  "Personal",
  "Event",
];

const formatDate = (date) => {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDateLabel = (date) => {
  if (date === getDate(0)) return "Today";
  if (date === getDate(1)) return "Tomorrow";
  return formatDate(date);
};

export default function Reminder() {
  const [reminders, setReminders] = useState(initialReminders);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");

  const today = getDate(0);

  const showToast = (message, duration = 2500) => {
    setToast(message);
    window.setTimeout(() => setToast(""), duration);
  };

  // Already alert kaatina reminders-oda ids
  const alertedIds = useRef(new Set());

  // Notification permission kekkum
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Ovoru 10 second-um reminders neram vandhucha nu check pannum
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      reminders.forEach((item) => {
        if (item.completed || alertedIds.current.has(item.id)) return;

        const dueTime = new Date(`${item.date}T${item.time}`);
        const diff = now - dueTime;

        if (diff >= 0 && diff <= 5 * 60 * 1000) {
          alertedIds.current.add(item.id);

          showToast(`⏰ Reminder: ${item.title}`, 8000);

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Reminder", { body: item.title });
          }
        }
      });
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 10000);

    return () => window.clearInterval(timer);
  }, [reminders]);

  const totalCount = reminders.length;
  const completedCount = reminders.filter(
    (item) => item.completed
  ).length;

  const todayCount = reminders.filter(
    (item) => item.date === today && !item.completed
  ).length;

  const upcomingCount = reminders.filter(
    (item) => item.date > today && !item.completed
  ).length;

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((item) => {
        const searchMatch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase());

        const statusMatch =
          filter === "All" ||
          (filter === "Pending" && !item.completed) ||
          (filter === "Completed" && item.completed) ||
          (filter === "Today" && item.date === today && !item.completed) ||
          (filter === "Upcoming" && item.date > today && !item.completed);

        const categoryMatch =
          categoryFilter === "All" || item.category === categoryFilter;

        return searchMatch && statusMatch && categoryMatch;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return Number(a.completed) - Number(b.completed);
        }

        return (
          new Date(`${a.date}T${a.time}`) -
          new Date(`${b.date}T${b.time}`)
        );
      });
  }, [reminders, search, filter, categoryFilter, today]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: today });
    setModal(true);
  };

  const openEditModal = (reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      description: reminder.description,
      category: reminder.category,
      date: reminder.date,
      time: reminder.time,
      priority: reminder.priority,
    });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.date || !form.time) {
      showToast("Please complete all required fields.");
      return;
    }

    if (editingId) {
      setReminders((previous) =>
        previous.map((item) =>
          item.id === editingId ? { ...item, ...form } : item
        )
      );
      showToast("Reminder updated successfully.");
    } else {
      const newReminder = {
        ...form,
        id: Date.now(),
        completed: false,
      };

      setReminders((previous) => [newReminder, ...previous]);
      showToast("Reminder created successfully.");
    }

    closeModal();
  };

  const toggleComplete = (id) => {
    setReminders((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed }
          : item
      )
    );

    const reminder = reminders.find((item) => item.id === id);

    showToast(
      reminder?.completed
        ? "Reminder marked as pending."
        : "Reminder completed!"
    );
  };

  const deleteReminder = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reminder?"
    );

    if (!confirmed) return;

    setReminders((previous) =>
      previous.filter((item) => item.id !== id)
    );

    showToast("Reminder deleted.");
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  const getCategoryClass = (category) => {
    return `category-${category.toLowerCase()}`;
  };

  const upcomingReminders = reminders
    .filter((item) => !item.completed && item.date >= today)
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`) -
        new Date(`${b.date}T${b.time}`)
    )
    .slice(0, 3);

  return (
    <div className="reminders-page">
      {/* SIDEBAR */}
      <aside className="reminders-sidebar">
        <div className="reminders-logo">
          <span className="reminders-logo-icon">A</span>
          <span>AME MESSENGER</span>
        </div>

        <p className="reminders-menu-label">MAIN MENU</p>

        <nav className="reminders-nav">
          <a href="/Home">
            <FaHome /> Dashboard
          </a>

          <a href="/Assignments">
            <FaTasks /> Assignments
          </a>

          <a href="/Messenger">
            <FaComments /> Messenger
          </a>

          <a href="/Documents">
            <FaFileAlt /> Documents
          </a>

          <a href="/Reminders" className="active">
            <FaBell /> Reminders
          </a>

          <a href="/Calendar">
            <FaCalendarAlt /> Calendar
          </a>
        </nav>

        <div className="reminders-sidebar-profile">
          <div className="reminders-avatar">K</div>
          <div>
            <strong>Kavitha</strong>
            <small>Student</small>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="reminders-main">
        {/* HEADER */}
        <header className="reminders-header">
          <div>
            <p className="reminders-breadcrumb">
              Dashboard / Reminders
            </p>
            <h1>Reminders</h1>
            <p className="reminders-subtitle">
              Stay organised and never miss an important task.
            </p>
          </div>

          <button
            className="reminder-primary-btn"
            onClick={openCreateModal}
          >
            <FaPlus /> Create Reminder
          </button>
        </header>

        {/* WELCOME BANNER */}
        <section className="reminder-banner">
          <div>
            <span className="reminder-banner-label">
              <FaGraduationCap /> YOUR PERSONAL PLANNER
            </span>
            <h2>Plan your day. Achieve your goals.</h2>
            <p>
              Keep track of assignments, exams, meetings and
              important activities in one place.
            </p>
          </div>

          <div className="reminder-banner-icon">
            <FaBell />
          </div>
        </section>

        {/* STATISTICS */}
        <section className="reminder-stats">
          <div className="reminder-stat-card">
            <div className="reminder-stat-icon stat-blue">
              <FaBell />
            </div>
            <div>
              <p>Total Reminders</p>
              <h2>{totalCount}</h2>
            </div>
          </div>

          <div className="reminder-stat-card">
            <div className="reminder-stat-icon stat-orange">
              <FaClock />
            </div>
            <div>
              <p>Today's Tasks</p>
              <h2>{todayCount}</h2>
            </div>
          </div>

          <div className="reminder-stat-card">
            <div className="reminder-stat-icon stat-purple">
              <FaCalendarAlt />
            </div>
            <div>
              <p>Upcoming</p>
              <h2>{upcomingCount}</h2>
            </div>
          </div>

          <div className="reminder-stat-card">
            <div className="reminder-stat-icon stat-green">
              <FaCheckCircle />
            </div>
            <div>
              <p>Completed</p>
              <h2>{completedCount}</h2>
            </div>
          </div>
        </section>

        {/* CONTENT LAYOUT */}
        <div className="reminders-content-layout">
          <section className="reminders-list-section">
            <div className="reminders-section-heading">
              <div>
                <h2>All Reminders</h2>
                <p>Manage your daily tasks and activities.</p>
              </div>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="reminders-toolbar">
              <div className="reminder-search">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search reminders..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Today">Today</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* REMINDER LIST */}
            <div className="reminder-list">
              {filteredReminders.map((reminder) => (
                <article
                  className={`reminder-card ${
                    reminder.completed ? "is-completed" : ""
                  }`}
                  key={reminder.id}
                >
                  <button
                    className={`reminder-check ${
                      reminder.completed ? "checked" : ""
                    }`}
                    title="Mark as completed"
                    onClick={() => toggleComplete(reminder.id)}
                  >
                    {reminder.completed && <FaCheckCircle />}
                  </button>

                  <div className="reminder-card-content">
                    <div className="reminder-card-top">
                      <span
                        className={`reminder-category ${getCategoryClass(
                          reminder.category
                        )}`}
                      >
                        {reminder.category}
                      </span>

                      <span
                        className={`reminder-priority ${getPriorityClass(
                          reminder.priority
                        )}`}
                      >
                        <FaExclamationCircle />
                        {reminder.priority}
                      </span>
                    </div>

                    <h3>{reminder.title}</h3>

                    <p className="reminder-description">
                      {reminder.description || "No description provided."}
                    </p>

                    <div className="reminder-card-meta">
                      <span>
                        <FaCalendarAlt />
                        {getDateLabel(reminder.date)}
                      </span>

                      <span>
                        <FaClock />
                        {reminder.time}
                      </span>

                      <span className="reminder-status">
                        {reminder.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="reminder-card-actions">
                    <button
                      className="reminder-action edit"
                      title="Edit reminder"
                      onClick={() => openEditModal(reminder)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="reminder-action delete"
                      title="Delete reminder"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </article>
              ))}

              {filteredReminders.length === 0 && (
                <div className="reminder-empty">
                  <FaRegCalendarCheck />
                  <h3>No reminders found</h3>
                  <p>
                    Try another search or create a new reminder.
                  </p>
                  <button
                    className="reminder-primary-btn"
                    onClick={openCreateModal}
                  >
                    <FaPlus /> Create Reminder
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT PANEL */}
          <aside className="reminders-right-panel">
            <div className="upcoming-panel">
              <div className="panel-heading">
                <div>
                  <h3>Coming Up</h3>
                  <p>Your next important reminders</p>
                </div>
                <FaCalendarAlt />
              </div>

              {upcomingReminders.length > 0 ? (
                <div className="upcoming-list">
                  {upcomingReminders.map((item) => (
                    <div className="upcoming-item" key={item.id}>
                      <div className="upcoming-date">
                        <strong>
                          {new Date(
                            `${item.date}T00:00:00`
                          ).getDate()}
                        </strong>
                        <small>
                          {new Date(
                            `${item.date}T00:00:00`
                          ).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </small>
                      </div>

                      <div className="upcoming-details">
                        <strong>{item.title}</strong>
                        <span>
                          <FaClock /> {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="upcoming-empty">
                  No upcoming reminders.
                </div>
              )}
            </div>

            <div className="reminder-tips">
              <div className="tips-icon">
                <FaGraduationCap />
              </div>
              <h3>Stay productive!</h3>
              <p>
                Break big tasks into smaller steps and complete
                them one by one.
              </p>
            </div>

            <div className="reminder-progress-panel">
              <h3>Your Progress</h3>
              <div className="progress-info">
                <span>Completed reminders</span>
                <strong>
                  {totalCount === 0
                    ? 0
                    : Math.round((completedCount / totalCount) * 100)}
                  %
                </strong>
              </div>

              <div className="reminder-progress-track">
                <div
                  className="reminder-progress-fill"
                  style={{
                    width: `${
                      totalCount === 0
                        ? 0
                        : (completedCount / totalCount) * 100
                    }%`,
                  }}
                />
              </div>

              <small>
                {completedCount} of {totalCount} reminders completed
              </small>
            </div>
          </aside>
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {modal && (
        <div
          className="reminder-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="reminder-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reminder-modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Reminder" : "Create Reminder"}
                </h2>
                <p>
                  Add the details of your reminder below.
                </p>
              </div>

              <button
                className="reminder-modal-close"
                onClick={closeModal}
                type="button"
              >
                <FaTimes />
              </button>
            </div>

            <form
              className="reminder-form"
              onSubmit={handleSave}
            >
              <div className="reminder-form-group">
                <label>Reminder Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Submit assignment"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                />
              </div>

              <div className="reminder-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Write a short description..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                />
              </div>

              <div className="reminder-form-row">
                <div className="reminder-form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="reminder-form-group">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value,
                      })
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="reminder-form-row">
                <div className="reminder-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="reminder-form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) =>
                      setForm({ ...form, time: event.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="reminder-modal-actions">
                <button
                  type="button"
                  className="reminder-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="reminder-primary-btn"
                >
                  <FaCheckCircle />
                  {editingId ? "Save Changes" : "Create Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="reminder-toast">
          <FaCheckCircle />
          {toast}
        </div>
      )}
    </div>
  );
}
