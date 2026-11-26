import React, { useEffect, useState } from 'react';
import API_URL from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import './AdminSettings.css';

const DEFAULTS = {
  messageNotifications: true,
  groupNotifications: true,
  assignmentNotifications: true,
  reminderNotifications: true,
  notificationSound: true,
  desktopNotifications: true,
};

export default function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState(DEFAULTS);
  const [profile, setProfile] = useState({ username: '', email: '', about: '', phone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${localStorage.getItem('ameAdminToken')}`,
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [settingsData, profileData] = await Promise.all([
          request('/settings'),
          request('/auth/me').catch(() => null),
        ]);
        if (!alive) return;
        setSettings({ ...DEFAULTS, ...(settingsData.settings || {}) });
        if (settingsData.theme) setTheme(settingsData.theme);
        const stored = JSON.parse(localStorage.getItem('ameAdminUser') || 'null') || {};
        const user = profileData?.user || stored;
        setProfile({
          username: user.username || '',
          email: user.email || '',
          about: user.about || '',
          phone: user.phone || '',
        });
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const savePreferences = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const data = await request('/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings, theme }),
      });
      setSettings({ ...DEFAULTS, ...(data.settings || {}) });
      setNotice('Preferences saved successfully.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const data = await request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      if (data.user) localStorage.setItem('ameAdminUser', JSON.stringify(data.user));
      setNotice('Admin profile updated.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      await request('/settings/password', {
        method: 'PUT',
        body: JSON.stringify(passwords),
      });
      setPasswords({ currentPassword: '', newPassword: '' });
      setNotice('Password changed successfully. Please keep it safe.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="admin-settings"><p>Loading administrator settings...</p></div>;

  return (
    <div className="admin-settings">
      <div className="admin-settings-heading"><h3>Administrator Settings</h3><p>Manage your admin profile, security and dashboard preferences.</p></div>
      {error && <div className="admin-settings-alert error" role="alert">{error}</div>}
      {notice && <div className="admin-settings-alert success" role="status">{notice}</div>}

      <section className="admin-settings-card">
        <h4>Admin Profile</h4>
        <form onSubmit={saveProfile} className="admin-settings-grid">
          <label>Username<input value={profile.username} maxLength={30} onChange={e => setProfile({ ...profile, username: e.target.value })} required /></label>
          <label>Email<input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} required /></label>
          <label>Phone<input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label>
          <label>About<input value={profile.about} maxLength={150} onChange={e => setProfile({ ...profile, about: e.target.value })} /></label>
          <button type="submit" disabled={saving}>Save Profile</button>
        </form>
      </section>

      <section className="admin-settings-card">
        <h4>Appearance</h4>
        <div className="admin-settings-theme">
          {['Light', 'Dark', 'System'].map(value => (
            <button type="button" key={value} className={theme === value ? 'selected' : ''} onClick={() => setTheme(value)}>{value}</button>
          ))}
        </div>
        <p>Choose Light, Dark, or follow your device appearance. Save preferences to keep the selection in your account.</p>
      </section>

      <section className="admin-settings-card">
        <h4>Notifications</h4>
        <div className="admin-settings-toggles">
          {[
            ['messageNotifications', 'Message notifications'],
            ['groupNotifications', 'Group notifications'],
            ['assignmentNotifications', 'Assignment notifications'],
            ['reminderNotifications', 'Reminder notifications'],
            ['notificationSound', 'Notification sound'],
            ['desktopNotifications', 'Desktop notifications'],
          ].map(([key, label]) => (
            <label key={key}><span>{label}</span><input type="checkbox" checked={Boolean(settings[key])} onChange={e => setSettings(old => ({ ...old, [key]: e.target.checked }))} /></label>
          ))}
        </div>
        <button type="button" onClick={savePreferences} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</button>
      </section>

      <section className="admin-settings-card">
        <h4>Security</h4>
        <form onSubmit={changePassword} className="admin-settings-grid">
          <label>Current password<input type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></label>
          <label>New password<input type="password" autoComplete="new-password" minLength={8} value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required /></label>
          <button type="submit" disabled={saving}>Change Password</button>
        </form>
      </section>
    </div>
  );
}