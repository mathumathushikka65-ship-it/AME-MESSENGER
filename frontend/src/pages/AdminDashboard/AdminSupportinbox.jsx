import React, { useCallback, useEffect, useState } from 'react';
import { FaLifeRing, FaSearch, FaPaperPlane, FaSyncAlt, FaArrowLeft } from 'react-icons/fa';
import API_URL from '../../services/api';
import './AdminSupportinbox.css';

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved'];

const adminRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}/admin-support${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('ameAdminToken')}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Admin support request failed.');
  return data;
};

const statusClass = (status) => (status || 'Open').toLowerCase().replace(/\s+/g, '-');
const formatTime = (value) => value ? new Date(value).toLocaleString() : '-';

export default function AdminSupportInbox() {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'All' ? '' : `?status=${encodeURIComponent(filter)}`;
      const data = await adminRequest(query);
      const rows = Array.isArray(data.tickets) ? data.tickets : [];
      setTickets(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openTicket = async (ticket) => {
    setError('');
    try {
      const data = await adminRequest(`/${ticket._id}`);
      setActiveTicket(data.ticket);
      setReply('');
      if (data.guestEmailSent === false) setError('Reply saved, but guest email was not sent. Configure SMTP settings in the backend environment.');
    } catch (err) {
      setError(err.message);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const cleanReply = reply.trim();
    if (!activeTicket || !cleanReply || sending) return;
    setSending(true);
    setError('');
    try {
      const data = await adminRequest(`/${activeTicket._id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: cleanReply }),
      });
      setActiveTicket(data.ticket);
      setTickets((previous) => [data.ticket, ...previous.filter((item) => item._id !== data.ticket._id)]);
      setReply('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status) => {
    if (!activeTicket) return;
    setError('');
    try {
      const data = await adminRequest(`/${activeTicket._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setActiveTicket(data.ticket);
      setTickets((previous) => previous.map((item) => item._id === data.ticket._id ? data.ticket : item));
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const userName = ticket.user?.username || ticket.guestName || '';
    const email = ticket.user?.email || ticket.guestEmail || '';
    return `${ticket.subject || ''} ${ticket.category || ''} ${userName} ${email}`.toLowerCase().includes(search.toLowerCase().trim());
  });

  const counts = {
    Open: tickets.filter((ticket) => ticket.status === 'Open').length,
    'In Progress': tickets.filter((ticket) => ticket.status === 'In Progress').length,
    Resolved: tickets.filter((ticket) => ticket.status === 'Resolved').length,
  };

  return (
    <div className="admin-support-page">
      <div className="admin-support-heading">
        <div>
          <span className="admin-support-eyebrow"><FaLifeRing /> CUSTOMER CARE</span>
          <h2>Support Inbox</h2>
          <p>Review user requests and reply directly from the admin dashboard.</p>
        </div>
        <button type="button" className="admin-support-refresh" onClick={loadTickets} disabled={loading}><FaSyncAlt /> Refresh</button>
      </div>

      <div className="admin-support-summary">
        <div><span>Open</span><strong>{counts.Open}</strong></div>
        <div><span>In Progress</span><strong>{counts['In Progress']}</strong></div>
        <div><span>Resolved</span><strong>{counts.Resolved}</strong></div>
      </div>

      {error && <div className="admin-support-error" role="alert">{error}</div>}

      <div className="admin-support-workspace">
        <aside className={`admin-support-list ${activeTicket ? 'has-selection' : ''}`}>
          <div className="admin-support-list-tools">
            <div className="admin-support-search"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." /></div>
            <div className="admin-support-filters">
              {STATUSES.map((status) => <button type="button" key={status} className={filter === status ? 'active' : ''} onClick={() => { setFilter(status); setActiveTicket(null); }}>{status}</button>)}
            </div>
          </div>
          <div className="admin-support-tickets">
            {loading ? <p className="admin-support-empty">Loading support requests...</p> : filteredTickets.length === 0 ? <p className="admin-support-empty">No support requests found.</p> : filteredTickets.map((ticket) => (
              <button type="button" key={ticket._id} className={`admin-support-ticket ${activeTicket?._id === ticket._id ? 'active' : ''}`} onClick={() => openTicket(ticket)}>
                <div className="admin-support-ticket-top"><strong>{ticket.subject}</strong><i className={`admin-support-dot ${statusClass(ticket.status)}`} /></div>
                <span>{ticket.user?.username || ticket.guestName || 'Visitor'} · {ticket.user?.email || ticket.guestEmail || 'No email'} · {ticket.category}</span>
                <small>{formatTime(ticket.updatedAt)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className={`admin-support-detail ${activeTicket ? 'show-detail' : ''}`}>
          {activeTicket ? (
            <>
              <header className="admin-support-detail-header">
                <button type="button" className="admin-support-back" onClick={() => setActiveTicket(null)}><FaArrowLeft /></button>
                <div className="admin-support-detail-title">
                  <h3>{activeTicket.subject}</h3>
                  <p>{activeTicket.user?.username || activeTicket.guestName || 'Visitor'} · {activeTicket.user?.email || activeTicket.guestEmail || 'No email'} · {activeTicket.category}</p>
                </div>
                <select aria-label="Support status" value={activeTicket.status} onChange={(event) => updateStatus(event.target.value)}>
                  {STATUSES.filter((item) => item !== 'All').map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </header>
              <div className="admin-support-thread">
                {(activeTicket.messages || []).map((item) => {
                  const isAdmin = item.senderRole === 'admin';
                  return <article key={item._id || `${item.createdAt}-${item.message}`} className={`admin-support-message ${isAdmin ? 'admin' : 'user'}`}>
                    <div><strong>{isAdmin ? 'Admin' : (item.sender?.username || activeTicket.user?.username || activeTicket.guestName || 'Visitor')}</strong><time>{formatTime(item.createdAt)}</time></div>
                    <p>{item.message}</p>
                  </article>;
                })}
              </div>
              <form className="admin-support-reply" onSubmit={sendReply}>
                <textarea rows={3} value={reply} onChange={(event) => setReply(event.target.value)} maxLength={5000} placeholder="Write a reply to the user..." />
                <div><small>{reply.length}/5000</small><button type="submit" disabled={sending || !reply.trim()}>{sending ? 'Sending...' : 'Send Reply'} <FaPaperPlane /></button></div>
              </form>
            </>
          ) : (
            <div className="admin-support-select-state"><span><FaLifeRing /></span><h3>Select a support request</h3><p>Choose a request from the inbox to view its conversation and reply.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}