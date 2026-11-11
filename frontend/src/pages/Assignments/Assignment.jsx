
import React, { useEffect, useMemo, useState } from "react";
import API_URL from "../../services/api";
import {
  FaHome,
  FaTasks,
  FaFileAlt,
  FaCalendarAlt,
  FaUsers,
  FaBell,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaUpload,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaGraduationCap,
  FaBook,
  FaClipboardCheck
} from "react-icons/fa";
import "./Assignment.css";

const today = new Date().toISOString().split("T")[0];

function formatDate(date) {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapAssignment(item) {
  return {
    id: item._id,
    title: item.title,
    subject: item.subject,
    description: item.description || "",
    dueDate: item.dueDate ? item.dueDate.substring(0, 10) : "",
    priority: item.priority || "Medium",
    status: item.status || "Pending",
    points: item.totalMarks || 100,
    submissions: (item.submissions || []).map((submission) => ({
      id: submission._id,
      studentId:
        typeof submission.student === "object"
          ? submission.student?._id
          : submission.student,
      student:
        typeof submission.student === "object"
          ? submission.student?.username || submission.student?.email
          : "Student",
      file: submission.fileName || "Assignment file",
      fileUrl: submission.fileUrl,
      marks: submission.marks ?? "",
      feedback: submission.feedback || "",
      status: submission.reviewStatus || "Submitted",
    })),
  };
}

export default function Assignment() {
   const [currentUser, setCurrentUser] = useState(null);
   const [role, setRole] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    dueDate: "",
    points: 100,
  });

  const [submissionForm, setSubmissionForm] = useState({
    file: null,
    notes: "",
  });

  const [reviewForm, setReviewForm] = useState({
    marks: "",
    feedback: "",
  });

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  // GET ASSIGNMENTS FROM BACKEND
  const fetchAssignments = async () => {
    const token = localStorage.getItem("ameToken");

    if (!token) {
      showToast("Please login to view assignments.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/assignments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load assignments.");
      }

      setAssignments((data.assignments || []).map(mapAssignment));
    } catch (error) {
      showToast(error.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const studentSubmission = (assignment) =>
    assignment.submissions.find(
      (submission) => submission.student === "Kavitha"
    );

  const getStudentStatus = (assignment) => {
    const submission = studentSubmission(assignment);

    if (submission) return submission.status;
    if (assignment.dueDate < today) return "Overdue";

    return "Pending";
  };

  // SEARCH AND FILTER
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const searchMatch =
        assignment.title.toLowerCase().includes(search.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(search.toLowerCase());

      const status =
        role === "Student"
          ? getStudentStatus(assignment)
          : assignment.submissions.length > 0
            ? "Submitted"
            : "Pending";

      const filterMatch =
        filter === "All" ||
        (filter === "Pending" && status === "Pending") ||
        (filter === "Submitted" && status === "Submitted") ||
        (filter === "Reviewed" && status === "Reviewed") ||
        (filter === "Overdue" && status === "Overdue");

      return searchMatch && filterMatch;
    });
  }, [assignments, search, filter, role]);

  // STATISTICS
  const totalAssignments = assignments.length;

  const pendingCount = assignments.filter(
    (assignment) => getStudentStatus(assignment) === "Pending"
  ).length;

  const submittedCount = assignments.filter(
    (assignment) => getStudentStatus(assignment) === "Submitted"
  ).length;

  const reviewedCount = assignments.filter(
    (assignment) => getStudentStatus(assignment) === "Reviewed"
  ).length;

  const totalSubmissions = assignments.reduce(
    (total, assignment) => total + assignment.submissions.length,
    0
  );

  // CREATE ASSIGNMENT MODAL
  const openCreateModal = () => {
    setForm({
      title: "",
      subject: "",
      description: "",
      dueDate: "",
      points: 100,
    });

    setSelected(null);
    setModal("create");
  };

  // EDIT ASSIGNMENT MODAL
  const openEditModal = (assignment) => {
    setSelected(assignment);

    setForm({
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description,
      dueDate: assignment.dueDate,
      points: assignment.points,
    });

    setModal("edit");
  };

  // CREATE AND UPDATE ASSIGNMENT API
  const saveAssignment = async (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.subject.trim() ||
      !form.dueDate
    ) {
      showToast("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem("ameToken");

    if (!token) {
      showToast("Please login again.");
      return;
    }

    const assignmentData = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      description: form.description,
      dueDate: form.dueDate,
      priority: selected?.priority || "Medium",
      status: selected?.status || "Pending",
    };

    setSaving(true);

    try {
      const isEditing = modal === "edit";

      const response = await fetch(
        isEditing
          ? `${API_URL}/assignments/${selected.id}`
          : `${API_URL}/assignments`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(assignmentData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save assignment.");
      }

      await fetchAssignments();

      setModal("");
      setSelected(null);

      showToast(
        isEditing
          ? "Assignment updated successfully!"
          : "Assignment created successfully!"
      );
    } catch (error) {
      showToast(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE ASSIGNMENT API
  const deleteAssignment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("ameToken");

    if (!token) {
      showToast("Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/assignments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete assignment.");
      }

      setAssignments((previous) =>
        previous.filter((assignment) => assignment.id !== id)
      );

      showToast("Assignment deleted successfully.");
    } catch (error) {
      showToast(error.message || "Unable to delete assignment.");
    }
  };

  // STUDENT SUBMISSION - FRONTEND ONLY FOR NOW
  const openSubmitModal = (assignment) => {
    setSelected(assignment);
    setSubmissionForm({ file: null, notes: "" });
    setModal("submit");
  };

  const submitAssignment = (event) => {
    event.preventDefault();

    if (!submissionForm.file) {
      showToast("Please select a file before submitting.");
      return;
    }

    const newSubmission = {
      id: Date.now(),
      student: "Kavitha",
      file: submissionForm.file.name,
      notes: submissionForm.notes,
      marks: "",
      feedback: "",
      status: "Submitted",
    };

    setAssignments((previous) =>
      previous.map((assignment) =>
        assignment.id === selected.id
          ? {
              ...assignment,
              submissions: [
                ...assignment.submissions.filter(
                  (item) => item.student !== "Kavitha"
                ),
                newSubmission,
              ],
            }
          : assignment
      )
    );

    setModal("");
    showToast("Submission saved in this session only.");
  };

  // TEACHER REVIEW - FRONTEND ONLY FOR NOW
  const openReviewModal = (assignment, submission) => {
    setSelected({
      assignmentId: assignment.id,
      submissionId: submission.id,
      assignmentTitle: assignment.title,
      submission,
    });

    setReviewForm({
      marks: submission.marks ?? "",
      feedback: submission.feedback ?? "",
    });

    setModal("review");
  };

  const saveReview = (event) => {
    event.preventDefault();

    const marks = Number(reviewForm.marks);

    if (
      reviewForm.marks === "" ||
      marks < 0 ||
      marks > 100
    ) {
      showToast("Enter marks between 0 and 100.");
      return;
    }

    setAssignments((previous) =>
      previous.map((assignment) =>
        assignment.id === selected.assignmentId
          ? {
              ...assignment,
              submissions: assignment.submissions.map((submission) =>
                submission.id === selected.submissionId
                  ? {
                      ...submission,
                      marks,
                      feedback: reviewForm.feedback,
                      status: "Reviewed",
                    }
                  : submission
              ),
            }
          : assignment
      )
    );

    setModal("");
    showToast("Review saved in this session only.");
  };

  const openDetails = (assignment) => {
    setSelected(assignment);
    setModal("details");
  };

  const closeModal = () => {
    setModal("");
    setSelected(null);
  };

  return (
    <div className="assignments-page">

      {/* SIDEBAR */}
      <aside className="assignments-sidebar">
        <div className="sidebar-logo">
           <img src="/102893.jpg" alt="AME Logo" className="logo-image" />
          <span>AME MESSENGER</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-menu">
          <a href="/Home">
            <FaHome /> Dashboard
          </a>

          <a href="/Assignment" className="active">
            <FaTasks /> Assignments
          </a>

          <a href="/Messenger">
            <FaUsers /> Messenger
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
      <main className="assignments-main">

        {/* HEADER */}
        <header className="assignments-header">
          <div>
            <p className="breadcrumb">Dashboard / Assignments</p>
            <h1>Assignments</h1>
            <p>Manage, submit and track your academic assignments.</p>
          </div>

          <div className="header-actions">
            <div className="role-switch">
              <button
                className={role === "Student" ? "active" : ""}
                onClick={() => {
                  setRole("Student");
                  setFilter("All");
                }}
              >
                Student
              </button>

              <button
                className={role === "Teacher" ? "active" : ""}
                onClick={() => {
                  setRole("Teacher");
                  setFilter("All");
                }}
              >
                Teacher
              </button>
            </div>

            {role === "Teacher" && (
              <button className="primary-btn" onClick={openCreateModal}>
                <FaPlus /> Create Assignment
              </button>
            )}
          </div>
        </header>

        {/* WELCOME BANNER */}
        <section className="assignment-welcome">
          <div>
            <span className="welcome-tag">
              <FaGraduationCap /> ACADEMIC WORKSPACE
            </span>

            <h2>
              {role === "Student"
                ? "Stay organised. Submit on time."
                : "Manage assignments with ease."}
            </h2>

            <p>
              {role === "Student"
                ? "View your tasks, complete your work and track your progress."
                : "Create assignments, review submissions and provide feedback."}
            </p>
          </div>

          <div className="welcome-icon">
            <FaBook />
          </div>
        </section>

        {/* STATISTICS */}
        <section className="assignment-stats">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FaTasks />
            </div>
            <div>
              <p>Total Assignments</p>
              <h2>{totalAssignments}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <FaClock />
            </div>
            <div>
              <p>{role === "Student" ? "Pending" : "Awaiting Submission"}</p>
              <h2>
                {role === "Student"
                  ? pendingCount
                  : totalAssignments -
                    assignments.filter(
                      (item) => item.submissions.length > 0
                    ).length}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FaUpload />
            </div>
            <div>
              <p>{role === "Student" ? "Submitted" : "Submissions"}</p>
              <h2>
                {role === "Student" ? submittedCount : totalSubmissions}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <FaClipboardCheck />
            </div>
            <div>
              <p>Reviewed</p>
              <h2>{reviewedCount}</h2>
            </div>
          </div>
        </section>

        {/* ASSIGNMENT LIST */}
        <section className="assignment-section">
          <div className="section-heading">
            <div>
              <h2>
                {role === "Student"
                  ? "My Assignments"
                  : "Assignment Management"}
              </h2>
              <p>View and manage all your assignment activities.</p>
            </div>

            {role === "Teacher" && (
              <button className="primary-btn" onClick={openCreateModal}>
                <FaPlus /> New Assignment
              </button>
            )}
          </div>

          {/* SEARCH AND FILTER */}
          <div className="assignment-filters">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search assignments..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="All">All Assignments</option>
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="empty-state">
              <h3>Loading assignments...</h3>
              <p>Please wait while we load your assignments.</p>
            </div>
          )}

          {/* ASSIGNMENT CARDS */}
          {!loading && (
            <div className="assignment-grid">
              {filteredAssignments.map((assignment) => {
                const submission = studentSubmission(assignment);

                const status =
                  role === "Student"
                    ? getStudentStatus(assignment)
                    : assignment.submissions.length > 0
                      ? "Submitted"
                      : "Pending";

                return (
                  <article className="assignment-card" key={assignment.id}>
                    <div className="assignment-card-top">
                      <span className="subject-label">
                        <FaBook /> {assignment.subject}
                      </span>

                      <span
                        className={`status-badge status-${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </div>

                    <h3>{assignment.title}</h3>

                    <p className="assignment-description">
                      {assignment.description}
                    </p>

                    <div className="assignment-meta">
                      <span>
                        <FaCalendarAlt /> Due: {formatDate(assignment.dueDate)}
                      </span>
                      <span>{assignment.points} Marks</span>
                    </div>

                    {role === "Student" &&
                      submission?.status === "Reviewed" && (
                        <div className="review-result">
                          <strong>
                            Marks: {submission.marks}/{assignment.points}
                          </strong>
                          <p>
                            {submission.feedback || "No feedback provided."}
                          </p>
                        </div>
                      )}

                    {role === "Teacher" && (
                      <div className="submission-count">
                        <FaUsers /> {assignment.submissions.length} submission(s)
                      </div>
                    )}

                    <div className="assignment-card-actions">
                      <button
                        className="secondary-btn"
                        onClick={() => openDetails(assignment)}
                      >
                        <FaEye /> View
                      </button>

                      {role === "Student" && (
                        <button
                          className="primary-btn"
                          onClick={() => openSubmitModal(assignment)}
                          disabled={
                            status === "Overdue" || status === "Reviewed"
                          }
                        >
                          <FaUpload />
                          {submission ? "Resubmit" : "Submit"}
                        </button>
                      )}

                      {role === "Teacher" && (
                        <>
                          <button
                            className="icon-btn edit-btn"
                            title="Edit assignment"
                            onClick={() => openEditModal(assignment)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="icon-btn delete-btn"
                            title="Delete assignment"
                            onClick={() => deleteAssignment(assignment.id)}
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>

                    {/* TEACHER SUBMISSIONS */}
                    {role === "Teacher" &&
                      assignment.submissions.length > 0 && (
                        <div className="submission-list">
                          <h4>Student Submissions</h4>

                          {assignment.submissions.map((item) => (
                            <div className="submission-item" key={item.id}>
                              <div>
                                <strong>{item.student}</strong>
                                <small>{item.file}</small>

                                <span
                                  className={`status-badge status-${item.status.toLowerCase()}`}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <button
                                className="review-btn"
                                onClick={() =>
                                  openReviewModal(assignment, item)
                                }
                              >
                                {item.status === "Reviewed"
                                  ? "Edit Review"
                                  : "Review"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                  </article>
                );
              })}
            </div>
          )}

          {!loading && filteredAssignments.length === 0 && (
            <div className="empty-state">
              <FaClipboardCheck />
              <h3>No assignments found</h3>
              <p>Try changing your search or filter.</p>
            </div>
          )}
        </section>
      </main>

      {/* CREATE / EDIT MODAL */}
      {(modal === "create" || modal === "edit") && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="assignment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {modal === "create"
                    ? "Create New Assignment"
                    : "Edit Assignment"}
                </h2>
                <p>Enter the assignment information below.</p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form className="assignment-form" onSubmit={saveAssignment}>
              <div className="form-group">
                <label>Assignment Title *</label>
                <input
                  type="text"
                  placeholder="Enter assignment title"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  value={form.subject}
                  onChange={(event) =>
                    setForm({ ...form, subject: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Write assignment instructions..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm({ ...form, dueDate: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.points}
                    onChange={(event) =>
                      setForm({ ...form, points: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : modal === "create"
                      ? "Create Assignment"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT SUBMISSION MODAL */}
      {modal === "submit" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="assignment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Submit Assignment</h2>
                <p>{selected.title}</p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form className="assignment-form" onSubmit={submitAssignment}>
              <div className="form-group">
                <label>Upload your file *</label>
                <input
                  type="file"
                  onChange={(event) =>
                    setSubmissionForm({
                      ...submissionForm,
                      file: event.target.files[0],
                    })
                  }
                  required
                />
                <small className="helper-text">
                  Select your completed assignment file.
                </small>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  placeholder="Write a note to your teacher..."
                  value={submissionForm.notes}
                  onChange={(event) =>
                    setSubmissionForm({
                      ...submissionForm,
                      notes: event.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
                  <FaUpload /> Submit Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER REVIEW MODAL */}
      {modal === "review" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="assignment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Review Submission</h2>
                <p>{selected.assignmentTitle}</p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="submission-preview">
              <strong>{selected.submission.student}</strong>
              <p>File: {selected.submission.file}</p>
              <p>
                Student note:{" "}
                {selected.submission.notes || "No additional notes."}
              </p>
            </div>

            <form className="assignment-form" onSubmit={saveReview}>
              <div className="form-group">
                <label>Marks (out of 100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewForm.marks}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      marks: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Feedback</label>
                <textarea
                  placeholder="Write feedback for the student..."
                  value={reviewForm.feedback}
                  onChange={(event) =>
                    setReviewForm({
                      ...reviewForm,
                      feedback: event.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
                  <FaCheckCircle /> Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNMENT DETAILS MODAL */}
      {modal === "details" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="assignment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Assignment Details</h2>
                <p>Complete assignment information.</p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="details-content">
              <span className="subject-label">{selected.subject}</span>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>

              <div className="details-info">
                <div>
                  <small>Due Date</small>
                  <strong>{formatDate(selected.dueDate)}</strong>
                </div>

                <div>
                  <small>Total Marks</small>
                  <strong>{selected.points}</strong>
                </div>

                <div>
                  <small>Submissions</small>
                  <strong>{selected.submissions.length}</strong>
                </div>
              </div>

              {role === "Student" && studentSubmission(selected) && (
                <div className="review-result">
                  <h4>My Submission</h4>
                  <p>File: {studentSubmission(selected).file}</p>
                  <p>Status: {studentSubmission(selected).status}</p>

                  {studentSubmission(selected).status === "Reviewed" && (
                    <>
                      <p>
                        Marks: {studentSubmission(selected).marks}/
                        {selected.points}
                      </p>
                      <p>
                        Feedback: {studentSubmission(selected).feedback}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="primary-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MESSAGE */}
      {toast && (
        <div className="toast-message">
          <FaCheckCircle /> {toast}
        </div>
      )}
    </div>
  );
}

