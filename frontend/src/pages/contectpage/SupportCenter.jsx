import React, { useEffect, useState } from 'react';
import { FaLifeRing, FaTimes, FaPaperPlane, FaPlus, FaArrowLeft } from 'react-icons/fa';
import API_URL from '../../services/api';
import './SupportCenter.css';

const CATEGORIES = [
  'Account & Login',
  'Messenger',
  'Contacts & Groups',
  'Assignments',
  'Documents',
  'Payments',
  'Other',
];

const supportRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}/support${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('ameToken')}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Support request failed.');
  return data;
};

const statusClass = (status) => (status || 'Open').toLowerCase().replace(/\s+/g, '-');
const formatTime = (value) => value ? new Date(value).toLocaleString() : '';

export default function SupportCenter({ onClose }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [category, setCategory] = useState('Account & Login');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await supportRequest('/mine');
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const startNewRequest = () => {
    setActiveTicket(null);
    setCategory('Account & Login');
    setSubject('');
    setMessage('');
    setError('');
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || sending) return;
    if (!activeTicket && !subject.trim()) {
      setError('Please enter a subject for your support request.');
      return;
    }

    setSending(true);
    setError('');
    try {
      const path = activeTicket ? `/${activeTicket._id}/messages` : '';
      const body = activeTicket
        ? { message: cleanMessage }
        : { category, subject: subject.trim(), message: cleanMessage };
      const data = await supportRequest(path, {
        method: activeTicket ? 'POST' : 'POST',
        body: JSON.stringify(body),
      });
      const updatedTicket = data.ticket;
      setTickets((previous) => [
        updatedTicket,
        ...previous.filter((item) => String(item._id) !== String(updatedTicket._id)),
      ]);
      setActiveTicket(updatedTicket);
      setMessage('');
      setSubject(updatedTicket.subject);
      setCategory(updatedTicket.category);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const openTicket = async (ticket) => {
    setActiveTicket(ticket);
    setSubject(ticket.subject || '');
    setCategory(ticket.category || 'Other');
    setMessage('');
    try {
      const data = await supportRequest(`/${ticket._id}`);
      if (data.ticket) {
        setActiveTicket(data.ticket);
        setTickets((previous) => previous.map((item) => item._id === data.ticket._id ? data.ticket : item));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="support-center-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="support-center" role="dialog" aria-modal="true" aria-labelledby="support-center-title">
        <header className="support-center-header">
          <div className="support-center-brand">
            <span className="support-center-icon"><FaLifeRing /></span>
            <div>
              <h2 id="support-center-title">Help & Support</h2>
              <p>Contact the AME Messenger support team</p>
            </div>
          </div>
          <button type="button" className="support-close" onClick={onClose} aria-label="Close support"><FaTimes /></button>
        </header>

        <div className="support-center-body">
          <aside className="support-ticket-sidebar">
            <button type="button" className="support-new-ticket" onClick={startNewRequest}>
              <FaPlus /> New request
            </button>
            <div className="support-ticket-list-heading">YOUR REQUESTS</div>
            {loading ? <p className="support-muted">Loading requests...</p> : tickets.length === 0 ? (
              <p className="support-muted">You have not contacted support yet.</p>
            ) : tickets.map((ticket) => (
              <button
                type="button"
                key={ticket._id}
                className={`support-ticket-item ${activeTicket?._id === ticket._id ? 'active' : ''}`}
                onClick={() => openTicket(ticket)}
              >
                <strong>{ticket.subject}</strong>
                <span>{ticket.category}</span>
                <small><i className={`support-status-dot ${statusClass(ticket.status)}`} />{ticket.status}</small>
              </button>
            ))}
          </aside>

          <main className="support-conversation">
            {activeTicket ? (
              <>
                <div className="support-conversation-heading">
                  <button type="button" className="support-back-button" onClick={startNewRequest}><FaArrowLeft /> New</button>
                  <div className="support-conversation-title">
                    <h3>{activeTicket.subject}</h3>
                    <span>{activeTicket.category}</span>
                  </div>
                  <span className={`support-status-pill ${statusClass(activeTicket.status)}`}>{activeTicket.status}</span>
                </div>
                <div className="support-message-thread">
                  {(activeTicket.messages || []).map((item) => {
                    const fromAdmin = item.senderRole === 'admin';
                    return (
                      <article className={`support-message ${fromAdmin ? 'from-admin' : 'from-user'}`} key={item._id || `${item.createdAt}-${item.message}`}>
                        <div className="support-message-meta">
                          <strong>{fromAdmin ? 'AME Support' : 'You'}</strong>
                          <time>{formatTime(item.createdAt)}</time>
                        </div>
                        <p>{item.message}</p>
                      </article>
                    );
                  })}
                </div>
                {activeTicket.status === 'Resolved' && (
                  <p className="support-resolved-note">This request is marked as resolved. Sending a new message will reopen it.</p>
                )}
              </>
            ) : (
              <div className="support-new-heading">
                <span><FaLifeRing /></span>
                <h3>How can we help?</h3>
                <p>Tell us what happened. The support team will reply here.</p>
              </div>
            )}

            <form className="support-compose" onSubmit={submitMessage}>
              {!activeTicket && (
                <>
                  <label>Problem category</label>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <label>Subject</label>
                  <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="Briefly describe the problem" required />
                </>
              )}
              <label>{activeTicket ? 'Your message' : 'Describe the problem'}</label>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} rows={4} placeholder="Write your message here..." required />
              {error && <p className="support-form-error" role="alert">{error}</p>}
              <div className="support-compose-footer">
                <small>{message.length}/5000 characters</small>
                <button type="submit" disabled={sending || !message.trim() || (!activeTicket && !subject.trim())}>
                  {sending ? 'Sending...' : activeTicket ? 'Send reply' : 'Send to Admin'} <FaPaperPlane />
                </button>
              </div>
            </form>
          </main>
        </div>
      </section>
    </div>
  );
}