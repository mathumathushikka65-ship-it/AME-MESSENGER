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
  FaClipboardCheck,
  FaImage,
  FaFilePdf,
  FaFileVideo,
  FaYoutube,
  FaGoogleDrive,
  FaGlobe,
  FaLink
} from "react-icons/fa";
import "./Assignment.css";

const today = new Date().toISOString().split("T")[0];

// Backend server address (/api illama) - local files load aaga
const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

// Login token-kulla irukkura userId-a edukkum (student submission-a kandupidikka)
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem("ameToken");

    if (!token) return null;

    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return payload.userId || null;
  } catch {
    return null;
  }
};

// ATTACHMENT SETTINGS
const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const DOCUMENT_EXTENSIONS = ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"];

const KIND_LABELS = {
  image: "Image",
  video: "Video",
  pdf: "PDF",
  document: "Document",
  youtube: "YouTube",
  drive: "Google Drive",
  website: "Website",
};

function formatDate(date) {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ATTACHMENT HELPERS
const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileKind = (file) => {
  const extension = file.name.split(".").pop().toLowerCase();

  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || extension === "pdf") return "pdf";
  if (DOCUMENT_EXTENSIONS.includes(extension)) return "document";

  return null;
};

const normalizeLink = (value) => {
  const text = value.trim();

  if (!text) return null;

  const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
};

const getLinkKind = (url) => {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    return "youtube";
  }

  if (host === "drive.google.com" || host === "docs.google.com") {
    return "drive";
  }

  return "website";
};

const getYouTubeId = (url) => {
  const host = url.hostname.replace(/^www\./, "");
  let id = null;

  if (host === "youtu.be") {
    id = url.pathname.slice(1);
  } else if (url.searchParams.get("v")) {
    id = url.searchParams.get("v");
  } else {
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    id = match ? match[1] : null;
  }

  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
};

// Browser memory-la irukkura preview URLs-a free pannum
const revokeAttachmentUrls = (items = []) => {
  items.forEach((item) => {
    if (item.type === "file") URL.revokeObjectURL(item.url);
  });
};

const renderAttachmentThumb = (item) => {
  if (item.kind === "image") {
    return <img src={item.url} alt={item.name} />;
  }

  if (item.kind === "video") {
    return <video src={item.url} controls preload="metadata" />;
  }

  if (item.kind === "youtube" && item.youtubeId) {
    return (
      <img
        src={`https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`}
        alt={item.name}
      />
    );
  }

  if (item.kind === "pdf") return <FaFilePdf />;
  if (item.kind === "youtube") return <FaYoutube />;
  if (item.kind === "drive") return <FaGoogleDrive />;
  if (item.kind === "website") return <FaGlobe />;
  if (item.kind === "image") return <FaImage />;
  if (item.kind === "video") return <FaFileVideo />;

  return <FaFileAlt />;
};

// ATTACHMENT PREVIEW LIST (onRemove kudutha X button varum)
function AttachmentList({ attachments, onRemove }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="attachment-grid">
      {attachments.map((item) => (
        <div className="attachment-card" key={item.id}>
          <div className={`attachment-thumb kind-${item.kind}`}>
            {renderAttachmentThumb(item)}
          </div>

          <div className="attachment-info">
            <strong title={item.name}>{item.name}</strong>
            <small>
              {KIND_LABELS[item.kind]}
              {item.type === "file" && ` • ${formatSize(item.size)}`}
            </small>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </div>

          {onRemove && (
            <button
              type="button"
              className="attachment-remove"
              title="Remove attachment"
              onClick={() => onRemove(item.id)}
            >
              <FaTimes />
            </button>
          )}
        </div>
      ))}
    </div>
  );
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
      notes: submission.notes || "",
      attachments: (submission.attachments || []).map((attachment) => ({
        id: attachment._id,
        type: attachment.type,
        kind: attachment.kind,
        name: attachment.name,
        size: attachment.size,
        url:
          attachment.type === "link"
            ? attachment.url
            : attachment.localPath
              ? `${SERVER_URL}${attachment.localPath}`
              : attachment.url,
        youtubeId: attachment.youtubeId,
      })),
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
    attachments: [],
    notes: "",
  });

  const [linkInput, setLinkInput] = useState("");

  const [reviewForm, setReviewForm] = useState({
    marks: "",
    feedback: "",
  });

  const showToast = (message, duration = 2500) => {
    setToast(message);
    window.setTimeout(() => setToast(""), duration);
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

  const currentUserId = getUserIdFromToken();

  const studentSubmission = (assignment) =>
    assignment.submissions.find(
      (submission) => String(submission.studentId) === String(currentUserId)
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
    setSubmissionForm({ attachments: [], notes: "" });
    setLinkInput("");
    setModal("submit");
  };

  // MULTIPLE FILES ADD
  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    const room = MAX_ATTACHMENTS - submissionForm.attachments.length;
    const accepted = [];
    let skipped = 0;

    files.forEach((file) => {
      const kind = getFileKind(file);

      if (!kind || file.size > MAX_FILE_SIZE || accepted.length >= room) {
        skipped += 1;
        return;
      }

      accepted.push({
        id: makeId(),
        type: "file",
        kind,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        file,
      });
    });

    if (accepted.length > 0) {
      setSubmissionForm((previous) => ({
        ...previous,
        attachments: [...previous.attachments, ...accepted],
      }));
    }

    if (skipped > 0) {
      showToast(
        `${skipped} file(s) skipped. Max ${MAX_ATTACHMENTS} attachments, 50 MB each (image, video, PDF or document).`,
        4000
      );
    }
  };

  // LINK ADD (website / YouTube / Google Drive)
  const addLink = () => {
    if (submissionForm.attachments.length >= MAX_ATTACHMENTS) {
      showToast(`You can add up to ${MAX_ATTACHMENTS} attachments.`);
      return;
    }

    const url = normalizeLink(linkInput);

    if (!url) {
      showToast("Please enter a valid link.");
      return;
    }

    const exists = submissionForm.attachments.some(
      (item) => item.type === "link" && item.url === url.href
    );

    if (exists) {
      showToast("This link is already added.");
      return;
    }

    const kind = getLinkKind(url);

    const newLink = {
      id: makeId(),
      type: "link",
      kind,
      name:
        kind === "youtube"
          ? "YouTube video"
          : kind === "drive"
            ? "Google Drive link"
            : url.hostname.replace(/^www\./, ""),
      url: url.href,
      youtubeId: kind === "youtube" ? getYouTubeId(url) : null,
    };

    setSubmissionForm((previous) => ({
      ...previous,
      attachments: [...previous.attachments, newLink],
    }));

    setLinkInput("");
  };

  // REMOVE ATTACHMENT BEFORE SUBMISSION
  const removeAttachment = (id) => {
    const target = submissionForm.attachments.find((item) => item.id === id);

    if (target) revokeAttachmentUrls([target]);

    setSubmissionForm((previous) => ({
      ...previous,
      attachments: previous.attachments.filter((item) => item.id !== id),
    }));
  };

  const submitAssignment = async (event) => {
    event.preventDefault();

    const attachments = submissionForm.attachments;

    if (attachments.length === 0) {
      showToast("Please add at least one file or link before submitting.");
      return;
    }

    const token = localStorage.getItem("ameToken");

    if (!token) {
      showToast("Please login again.");
      return;
    }

    // Files + links + notes-a FormData-la serthu anuppum
    const formData = new FormData();

    attachments
      .filter((item) => item.type === "file")
      .forEach((item) => formData.append("files", item.file));

    const links = attachments
      .filter((item) => item.type === "link")
      .map(({ kind, name, url }) => ({ kind, name, url }));

    formData.append("links", JSON.stringify(links));
    formData.append("notes", submissionForm.notes);

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/assignments/${selected.id}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit assignment.");
      }

      revokeAttachmentUrls(attachments);
      await fetchAssignments();

      setSubmissionForm({ attachments: [], notes: "" });
      setLinkInput("");
      setModal("");

      showToast(
        data.warnings?.length
          ? "Submitted. Cloud backup failed for some files."
          : "Assignment submitted successfully!",
        data.warnings?.length ? 4000 : 2500
      );
    } catch (error) {
      showToast(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
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
    // Submit modal-a submit pannama close pannina, draft attachments-a clean pannum
    if (modal === "submit") {
      revokeAttachmentUrls(submissionForm.attachments);
      setSubmissionForm({ attachments: [], notes: "" });
      setLinkInput("");
    }

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
                <label>Upload files</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={handleFilesChange}
                />
                <small className="helper-text">
                  Images, videos, PDF and documents. Up to {MAX_ATTACHMENTS}{" "}
                  attachments, 50 MB each.
                </small>
              </div>

              <div className="form-group">
                <label>Add a link</label>
                <div className="link-input-row">
                  <input
                    type="text"
                    placeholder="Website, YouTube or Google Drive link"
                    value={linkInput}
                    onChange={(event) => setLinkInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addLink();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={addLink}
                  >
                    <FaLink /> Add
                  </button>
                </div>
              </div>

              {submissionForm.attachments.length > 0 && (
                <div className="form-group">
                  <label>
                    Attachments ({submissionForm.attachments.length}/
                    {MAX_ATTACHMENTS})
                  </label>

                  <AttachmentList
                    attachments={submissionForm.attachments}
                    onRemove={removeAttachment}
                  />
                </div>
              )}

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

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  <FaUpload /> {saving ? "Submitting..." : "Submit Work"}
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

              <AttachmentList attachments={selected.submission.attachments} />
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

                  <AttachmentList
                    attachments={studentSubmission(selected).attachments}
                  />


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
