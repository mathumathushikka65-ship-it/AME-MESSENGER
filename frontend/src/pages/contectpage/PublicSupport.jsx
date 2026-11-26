import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../../services/api';
import './PublicSupport.css';

const CATEGORIES = ['Account & Login', 'Messenger', 'Contacts & Groups', 'Assignments', 'Documents', 'Payments', 'Other'];

export default function PublicSupport() {
  const [form, setForm] = useState({ name: '', email: '', category: 'Account & Login', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const response = await fetch(`${API_URL}/support/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to send your request.');
      setSuccess(data);
      setForm({ name: '', email: '', category: 'Account & Login', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="public-support-page">
      <section className="public-support-card">
        <header>
          <span className="public-support-mark">AME</span>
          <h1>Contact Admin</h1>
          <p>Can't log in or sign up? Tell us what happened. You do not need an account.</p>
        </header>
        {success ? (
          <div className="public-support-success" role="status">
            <h2>Request sent successfully</h2>
            <p>{success.message}</p>
            <strong>Reference: {success.reference}</strong>
            <p>Keep this reference number. Admin can reply to the email address you provided.</p>
            <button type="button" onClick={() => setSuccess(null)}>Send another request</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>Your name<input value={form.name} maxLength={80} onChange={(e) => update('name', e.target.value)} required /></label>
            <label>Email address<input type="email" value={form.email} maxLength={254} onChange={(e) => update('email', e.target.value)} required /></label>
            <label>Problem type<select value={form.category} onChange={(e) => update('category', e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Subject<input value={form.subject} maxLength={120} onChange={(e) => update('subject', e.target.value)} required /></label>
            <label>Describe the problem<textarea value={form.message} maxLength={5000} rows={5} onChange={(e) => update('message', e.target.value)} required /></label>
            {error && <p className="public-support-error" role="alert">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send to Admin'}</button>
          </form>
        )}
        <footer><Link to="/Login">Back to Login</Link><span>·</span><Link to="/Signup">Create account</Link></footer>
      </section>
    </main>
  );
}