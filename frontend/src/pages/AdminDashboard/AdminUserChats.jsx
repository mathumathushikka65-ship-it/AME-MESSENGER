import React, { useCallback, useEffect, useState } from 'react';
import API_URL from '../../services/api';
import './AdminUserChats.css';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('ameAdminToken')}`,
});

export default function AdminUserChats() {
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const adminId = (() => {
    try { return JSON.parse(localStorage.getItem('ameAdminUser') || 'null')?.id || ''; }
    catch { return ''; }
  })();

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  };

  const loadChats = useCallback(async () => {
    try {
      const data = await request('/conversations');
      const adminChats = (Array.isArray(data) ? data : []).filter(c => c.type === 'personal' && c.participants?.some(p => p.role !== 'admin'));
      setChats(adminChats);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const data = await request(`/messages/${conversationId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      loadChats();
      if (active?._id) loadMessages(active._id);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [active, loadChats, loadMessages]);

  const openChat = async (chat) => {
    setActive(chat);
    setError('');
    await loadMessages(chat._id);
  };

  const send = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!active || !content || sending) return;
    setSending(true); setError('');
    try {
      const created = await request(`/messages/${active._id}`, { method: 'POST', body: JSON.stringify({ content, messageType: 'text' }) });
      setMessages(old => [...old, created.data || created]);
      setDraft('');
      loadChats();
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  const otherUser = (chat) => chat.participants?.find(p => p.role !== 'admin') || {};
  const time = (value) => value ? new Date(value).toLocaleString() : '';

  return (
    <div className="admin-user-chats">
      <header><div><h3>User Chats</h3><p>Private conversations started by users who contacted Admin.</p></div><button type="button" onClick={loadChats}>Refresh</button></header>
      {error && <div className="admin-user-chats-error" role="alert">{error}</div>}
      <div className="admin-user-chats-layout">
        <aside>
          {loading ? <p className="muted">Loading conversations...</p> : chats.length === 0 ? <p className="muted">No user chats yet. A conversation appears here when a user selects “Admin” in Messenger.</p> : chats.map(chat => {
            const user = otherUser(chat);
            return <button type="button" key={chat._id} className={active?._id === chat._id ? 'active' : ''} onClick={() => openChat(chat)}>
              <strong>{user.username || 'User'}</strong><small>{user.email || user.role || 'Member'}</small>
              <span>{chat.lastMessage?.content || 'No messages yet'}</span>
            </button>;
          })}
        </aside>
        <section>
          {active ? <>
            <div className="admin-user-chat-heading"><strong>{otherUser(active).username || 'User'}</strong><small>{otherUser(active).email}</small></div>
            <div className="admin-user-chat-messages">
              {messages.map(message => <article key={message._id} className={String(message.sender?._id || message.sender) === String(adminId) ? 'mine' : ''}>
                <p>{message.content || (message.messageType !== 'text' ? `[${message.messageType}]` : '')}</p><time>{time(message.createdAt)}</time>
              </article>)}
              {messages.length === 0 && <p className="muted">No messages yet.</p>}
            </div>
            <form onSubmit={send}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a reply..." maxLength={5000} /><button type="submit" disabled={sending || !draft.trim()}>{sending ? 'Sending...' : 'Send'}</button></form>
          </> : <div className="admin-user-chat-empty"><strong>Select a user conversation</strong><span>Choose a chat on the left to read and reply.</span></div>}
        </section>
      </div>
    </div>
  );
}