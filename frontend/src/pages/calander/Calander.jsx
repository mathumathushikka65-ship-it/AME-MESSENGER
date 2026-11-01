import React, { useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaBook,
  FaChalkboardTeacher,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaList,
  FaCalendarDay,
  FaCalendarWeek,
  FaTable,
  FaCheckCircle,
  FaGraduationCap,
} from "react-icons/fa";
import "./Calendar.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CATEGORIES = ["Class", "Assignment", "Exam", "Meeting", "Personal"];

const today = new Date();
const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const initialEvents = [
  {
    id: 1,
    title: "Web Development",
    date: dateKey(today),
    start: "09:00",
    end: "10:30",
    category: "Class",
    location: "Lab 02",
    description: "React fundamentals",
  },
  {
    id: 2,
    title: "Database Assignment",
    date: dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
    start: "14:00",
    end: "15:00",
    category: "Assignment",
    location: "Online",
    description: "Submit database project",
  },
  {
    id: 3,
    title: "Mathematics",
    date: dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)),
    start: "10:00",
    end: "11:30",
    category: "Class",
    location: "Room 105",
    description: "Calculus lesson",
  },
  {
    id: 4,
    title: "Project Meeting",
    date: dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)),
    start: "13:00",
    end: "14:00",
    category: "Meeting",
    location: "Meeting Room",
    description: "AME Messenger project discussion",
  },
];

const initialTimetable = [
  { id: 1, day: "Monday", subject: "Web Development", lecturer: "Mr. John", room: "Lab 02", start: "09:00", end: "10:30" },
  { id: 2, day: "Monday", subject: "Database", lecturer: "Ms. Sara", room: "Room 105", start: "11:00", end: "12:30" },
  { id: 3, day: "Tuesday", subject: "Mathematics", lecturer: "Mr. David", room: "Room 201", start: "10:00", end: "11:30" },
  { id: 4, day: "Wednesday", subject: "Programming", lecturer: "Ms. Anne", room: "Lab 01", start: "09:00", end: "11:00" },
  { id: 5, day: "Thursday", subject: "Networking", lecturer: "Mr. Peter", room: "Room 204", start: "13:00", end: "14:30" },
  { id: 6, day: "Friday", subject: "Project Work", lecturer: "Project Supervisor", room: "Lab 03", start: "09:00", end: "11:00" },
];

const emptyEvent = {
  title: "",
  date: dateKey(today),
  start: "09:00",
  end: "10:00",
  category: "Class",
  location: "",
  description: "",
};

const emptyClass = {
  day: "Monday",
  subject: "",
  lecturer: "",
  room: "",
  start: "09:00",
  end: "10:00",
};

export default function Calendar() {
  const [events, setEvents] = useState(initialEvents);
  const [timetable, setTimetable] = useState(initialTimetable);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState("month");
  const [activeTab, setActiveTab] = useState("calendar");
  const [eventModal, setEventModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [classForm, setClassForm] = useState(emptyClass);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const selectedKey = dateKey(selectedDate);

  const monthLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [selectedDate]);

  const visibleEvents = useMemo(() => {
    return events
      .filter((event) => event.date === selectedKey)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, selectedKey]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => event.date >= dateKey(today))
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
      .slice(0, 5);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((event) => filter === "All" || event.category === filter)
      .filter((event) =>
        `${event.title} ${event.location} ${event.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  }, [events, filter, search]);

  const todayCount = events.filter((event) => event.date === dateKey(today)).length;
  const classCount = events.filter((event) => event.category === "Class").length;
  const deadlineCount = events.filter((event) => event.category === "Assignment").length;

  const changePeriod = (amount) => {
    const next = new Date(selectedDate);
    if (view === "month") next.setMonth(next.getMonth() + amount);
    else if (view === "week") next.setDate(next.getDate() + amount * 7);
    else next.setDate(next.getDate() + amount);
    setSelectedDate(next);
  };

  const openNewEvent = (date = selectedDate) => {
    setEditingEvent(null);
    setEventForm({ ...emptyEvent, date: dateKey(date) });
    setEventModal(true);
  };

  const saveEvent = (e) => {
    e.preventDefault();

    if (eventForm.end <= eventForm.start) {
      alert("End time must be later than start time.");
      return;
    }

    if (editingEvent) {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === editingEvent ? { ...eventForm, id: editingEvent } : item
        )
      );
    } else {
      setEvents((prev) => [...prev, { ...eventForm, id: Date.now() }]);
    }

    setEventModal(false);
    setEditingEvent(null);
  };

  const editEvent = (event) => {
    setEditingEvent(event.id);
    setEventForm({ ...event });
    setEventModal(true);
  };

  const deleteEvent = (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents((prev) => prev.filter((event) => event.id !== id));
    }
  };

  const openNewClass = () => {
    setEditingClass(null);
    setClassForm(emptyClass);
    setClassModal(true);
  };

  const saveClass = (e) => {
    e.preventDefault();

    if (classForm.end <= classForm.start) {
      alert("End time must be later than start time.");
      return;
    }

    if (editingClass) {
      setTimetable((prev) =>
        prev.map((item) =>
          item.id === editingClass ? { ...classForm, id: editingClass } : item
        )
      );
    } else {
      setTimetable((prev) => [...prev, { ...classForm, id: Date.now() }]);
    }

    setClassModal(false);
    setEditingClass(null);
  };

  const editClass = (item) => {
    setEditingClass(item.id);
    setClassForm({ ...item });
    setClassModal(true);
  };

  const deleteClass = (id) => {
    if (window.confirm("Delete this timetable class?")) {
      setTimetable((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const goToday = () => setSelectedDate(new Date());

  const getEventClass = (category) =>
    `calendar-event calendar-event-${category.toLowerCase()}`;

  const formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  }, [selectedDate]);

  return (
    <div className="ame-calendar">
      <aside className="cal-sidebar">
        <div className="cal-brand">
          <span className="cal-brand-icon">A</span>
          <div>
            <h2>AME MESSENGER</h2>
            <p>Workspace</p>
          </div>
        </div>

        <div className="cal-side-label">WORKSPACE</div>
        <nav className="cal-side-nav">
          <a href="/Home"><FaGraduationCap /> Dashboard</a>
          <a href="/Assignment"><FaBook /> Assignments</a>
          <a href="/Reminders"><FaClock /> Reminders</a>
          <a className="active" href="/Calendar"><FaCalendarAlt /> Calendar</a>
        </nav>

        <div className="cal-sidebar-bottom">
          <div className="cal-help-icon"><FaCalendarAlt /></div>
          <h3>Stay organised</h3>
          <p>Plan your classes, deadlines and important events in one place.</p>
        </div>
      </aside>

      <main className="cal-main">
        <header className="cal-topbar">
          <div>
            <p className="cal-eyebrow">PLAN YOUR WORKSPACE</p>
            <h1>Calendar & Timetable</h1>
            <p className="cal-subtitle">Manage your schedule and never miss an important date.</p>
          </div>
          <button className="cal-primary-btn" onClick={() => openNewEvent()}>
            <FaPlus /> Add event
          </button>
        </header>

        <section className="cal-stats">
          <div className="cal-stat-card">
            <span className="cal-stat-icon blue"><FaCalendarAlt /></span>
            <div><p>Total events</p><h2>{events.length}</h2></div>
          </div>
          <div className="cal-stat-card">
            <span className="cal-stat-icon green"><FaCalendarDay /></span>
            <div><p>Today's events</p><h2>{todayCount}</h2></div>
          </div>
          <div className="cal-stat-card">
            <span className="cal-stat-icon purple"><FaBook /></span>
            <div><p>Class sessions</p><h2>{classCount}</h2></div>
          </div>
          <div className="cal-stat-card">
            <span className="cal-stat-icon orange"><FaCheckCircle /></span>
            <div><p>Assignment dates</p><h2>{deadlineCount}</h2></div>
          </div>
        </section>

        <div className="cal-tabs">
          <button
            className={activeTab === "calendar" ? "selected" : ""}
            onClick={() => setActiveTab("calendar")}
          >
            <FaCalendarAlt /> Calendar
          </button>
          <button
            className={activeTab === "timetable" ? "selected" : ""}
            onClick={() => setActiveTab("timetable")}
          >
            <FaTable /> Timetable
          </button>
          <button
            className={activeTab === "events" ? "selected" : ""}
            onClick={() => setActiveTab("events")}
          >
            <FaList /> All events
          </button>
        </div>

        {activeTab === "calendar" && (
          <div className="cal-content-grid">
            <section className="cal-panel cal-calendar-panel">
              <div className="cal-panel-heading">
                <div>
                  <h2>{monthLabel}</h2>
                  <p>Choose a date to view your schedule</p>
                </div>
                <div className="cal-calendar-actions">
                  <button className="cal-today-btn" onClick={goToday}>Today</button>
                  <button className="cal-arrow-btn" onClick={() => changePeriod(-1)}><FaChevronLeft /></button>
                  <button className="cal-arrow-btn" onClick={() => changePeriod(1)}><FaChevronRight /></button>
                </div>
              </div>

              <div className="cal-view-switch">
                <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button>
                <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Week</button>
                <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Day</button>
              </div>

              {view === "month" && (
                <div className="cal-month-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div className="cal-weekday" key={day}>{day}</div>
                  ))}
                  {monthDays.map((day) => {
                    const key = dateKey(day);
                    const dayEvents = events.filter((event) => event.date === key);
                    const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                    const isToday = key === dateKey(today);
                    const isSelected = key === selectedKey;

                    return (
                      <button
                        key={key}
                        className={`cal-date-cell ${!isCurrentMonth ? "muted" : ""} ${isToday ? "today" : ""} ${isSelected ? "chosen" : ""}`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <span className="cal-date-number">{day.getDate()}</span>
                        <span className="cal-date-dots">
                          {dayEvents.slice(0, 3).map((event) => (
                            <i key={event.id} className={`dot-${event.category.toLowerCase()}`} />
                          ))}
                        </span>
                        <span className="cal-date-event-count">
                          {dayEvents.length > 0 ? `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {view === "week" && (
                <div className="cal-week-grid">
                  {weekDays.map((day) => {
                    const key = dateKey(day);
                    const dayEvents = events.filter((event) => event.date === key);
                    return (
                      <button
                        key={key}
                        className={`cal-week-day ${key === selectedKey ? "chosen" : ""}`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <span>{DAYS[day.getDay()].slice(0, 3)}</span>
                        <strong>{day.getDate()}</strong>
                        <small>{dayEvents.length} events</small>
                      </button>
                    );
                  })}
                </div>
              )}

              {view === "day" && (
                <div className="cal-day-focus">
                  <span>{DAYS[selectedDate.getDay()]}</span>
                  <strong>{selectedDate.getDate()}</strong>
                  <small>{monthLabel}</small>
                  <p>{visibleEvents.length} scheduled event(s)</p>
                </div>
              )}

              <div className="cal-selected-heading">
                <div>
                  <h3>{selectedDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</h3>
                  <p>Your schedule for this date</p>
                </div>
                <button className="cal-add-small" onClick={() => openNewEvent(selectedDate)}>
                  <FaPlus /> Add
                </button>
              </div>

              <div className="cal-selected-events">
                {visibleEvents.length === 0 ? (
                  <div className="cal-empty">
                    <FaCalendarDay />
                    <strong>No events scheduled</strong>
                    <p>Add a class, deadline or personal event for this day.</p>
                  </div>
                ) : (
                  visibleEvents.map((event) => (
                    <article className="cal-event-row" key={event.id}>
                      <div className={`cal-event-line ${event.category.toLowerCase()}`} />
                      <div className="cal-event-time">
                        <strong>{event.start}</strong>
                        <span>{event.end}</span>
                      </div>
                      <div className="cal-event-info">
                        <h4>{event.title}</h4>
                        <p><FaMapMarkerAlt /> {event.location || "Location not set"} <span className={`cal-category ${event.category.toLowerCase()}`}>{event.category}</span></p>
                      </div>
                      <div className="cal-event-actions">
                        <button onClick={() => editEvent(event)} aria-label="Edit event"><FaEdit /></button>
                        <button onClick={() => deleteEvent(event.id)} aria-label="Delete event"><FaTrash /></button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <aside className="cal-right-column">
              <section className="cal-panel cal-upcoming-panel">
                <div className="cal-panel-heading">
                  <div><h2>Upcoming events</h2><p>Your next activities</p></div>
                  <FaClock className="cal-heading-icon" />
                </div>
                {upcomingEvents.length === 0 ? (
                  <p className="cal-no-upcoming">No upcoming events.</p>
                ) : upcomingEvents.map((event) => (
                  <div className="cal-upcoming-item" key={event.id}>
                    <span className={`cal-upcoming-marker ${event.category.toLowerCase()}`} />
                    <div>
                      <h4>{event.title}</h4>
                      <p>{formatDate(event.date)} · {event.start}</p>
                    </div>
                  </div>
                ))}
              </section>

              <section className="cal-tip-card">
                <span><FaGraduationCap /></span>
                <h3>Make time for learning</h3>
                <p>Plan study sessions between your classes and keep some time free for breaks.</p>
              </section>

              <section className="cal-legend-panel">
                <h3>Event categories</h3>
                {CATEGORIES.map((category) => (
                  <div className="cal-legend-row" key={category}>
                    <i className={`dot-${category.toLowerCase()}`} />
                    <span>{category}</span>
                  </div>
                ))}
              </section>
            </aside>
          </div>
        )}

        {activeTab === "timetable" && (
          <section className="cal-panel cal-timetable-panel">
            <div className="cal-panel-heading">
              <div><h2>Weekly timetable</h2><p>Organise your regular classes and study sessions</p></div>
              <button className="cal-primary-btn" onClick={openNewClass}><FaPlus /> Add class</button>
            </div>
            <div className="cal-timetable-list">
              {DAYS.slice(1).concat("Sunday").map((day) => {
                const dayClasses = timetable
                  .filter((item) => item.day === day)
                  .sort((a, b) => a.start.localeCompare(b.start));
                return (
                  <div className="cal-timetable-day" key={day}>
                    <div className="cal-timetable-day-title">
                      <strong>{day}</strong>
                      <span>{dayClasses.length} session(s)</span>
                    </div>
                    <div className="cal-timetable-classes">
                      {dayClasses.length === 0 ? (
                        <p className="cal-no-class">No classes scheduled</p>
                      ) : dayClasses.map((item) => (
                        <article className="cal-class-card" key={item.id}>
                          <div className="cal-class-time"><FaClock /> {item.start} – {item.end}</div>
                          <div className="cal-class-details">
                            <h3>{item.subject}</h3>
                            <p><FaChalkboardTeacher /> {item.lecturer || "Lecturer not set"}</p>
                            <p><FaMapMarkerAlt /> {item.room || "Room not set"}</p>
                          </div>
                          <div className="cal-class-actions">
                            <button onClick={() => editClass(item)}><FaEdit /></button>
                            <button onClick={() => deleteClass(item.id)}><FaTrash /></button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "events" && (
          <section className="cal-panel cal-all-events">
            <div className="cal-panel-heading">
              <div><h2>All events</h2><p>Search and manage your calendar activities</p></div>
              <button className="cal-primary-btn" onClick={() => openNewEvent()}><FaPlus /> Add event</button>
            </div>
            <div className="cal-event-tools">
              <div className="cal-search"><FaSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." /></div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option>All</option>
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="cal-empty"><FaCalendarDay /><strong>No matching events</strong><p>Try another search or category.</p></div>
            ) : (
              <div className="cal-all-event-list">
                {filteredEvents.map((event) => (
                  <article className="cal-all-event-row" key={event.id}>
                    <div className={`cal-all-event-date ${event.category.toLowerCase()}`}>
                      <strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong>
                      <span>{new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span>
                    </div>
                    <div className="cal-all-event-info">
                      <h3>{event.title}</h3>
                      <p>{event.start} – {event.end} · {event.location || "No location"} · {event.category}</p>
                    </div>
                    <div className="cal-event-actions">
                      <button onClick={() => editEvent(event)}><FaEdit /></button>
                      <button onClick={() => deleteEvent(event.id)}><FaTrash /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {eventModal && (
        <div className="cal-modal-overlay" onClick={() => setEventModal(false)}>
          <form className="cal-modal" onSubmit={saveEvent} onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-heading">
              <div><h2>{editingEvent ? "Edit event" : "Create new event"}</h2><p>Add an activity to your calendar</p></div>
              <button type="button" onClick={() => setEventModal(false)}><FaTimes /></button>
            </div>

            <label>Event title *</label>
            <input required value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. Web Development class" />

            <div className="cal-form-two">
              <div><label>Date *</label><input type="date" required value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} /></div>
              <div><label>Category</label><select value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
            </div>

            <div className="cal-form-two">
              <div><label>Start time *</label><input type="time" required value={eventForm.start} onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })} /></div>
              <div><label>End time *</label><input type="time" required value={eventForm.end} onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })} /></div>
            </div>

            <label>Location</label>
            <input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Room, lab or online" />

            <label>Description</label>
            <textarea rows="3" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Add notes..." />

            <div className="cal-modal-footer">
              <button type="button" className="cal-cancel-btn" onClick={() => setEventModal(false)}>Cancel</button>
              <button type="submit" className="cal-primary-btn">{editingEvent ? "Save changes" : "Create event"}</button>
            </div>
          </form>
        </div>
      )}

      {classModal && (
        <div className="cal-modal-overlay" onClick={() => setClassModal(false)}>
          <form className="cal-modal" onSubmit={saveClass} onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-heading">
              <div><h2>{editingClass ? "Edit timetable class" : "Add timetable class"}</h2><p>Set up a regular weekly class</p></div>
              <button type="button" onClick={() => setClassModal(false)}><FaTimes /></button>
            </div>

            <label>Subject / Class name *</label>
            <input required value={classForm.subject} onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })} placeholder="e.g. Software Engineering" />

            <label>Day *</label>
            <select value={classForm.day} onChange={(e) => setClassForm({ ...classForm, day: e.target.value })}>
              {DAYS.slice(1).concat("Sunday").map((day) => <option key={day}>{day}</option>)}
            </select>

            <label>Lecturer / Teacher</label>
            <input value={classForm.lecturer} onChange={(e) => setClassForm({ ...classForm, lecturer: e.target.value })} placeholder="Lecturer name" />

            <label>Room / Location</label>
            <input value={classForm.room} onChange={(e) => setClassForm({ ...classForm, room: e.target.value })} placeholder="e.g. Lab 01" />

            <div className="cal-form-two">
              <div><label>Start time *</label><input type="time" required value={classForm.start} onChange={(e) => setClassForm({ ...classForm, start: e.target.value })} /></div>
              <div><label>End time *</label><input type="time" required value={classForm.end} onChange={(e) => setClassForm({ ...classForm, end: e.target.value })} /></div>
            </div>

            <div className="cal-modal-footer">
              <button type="button" className="cal-cancel-btn" onClick={() => setClassModal(false)}>Cancel</button>
              <button type="submit" className="cal-primary-btn">{editingClass ? "Save changes" : "Add to timetable"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}