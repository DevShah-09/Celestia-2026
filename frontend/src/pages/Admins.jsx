import { useState } from 'react';
import { useAdmin } from '../components/AdminLayout';
import { useAdminData } from '../lib/useAdminData';
import DataStatus from '../components/DataStatus';

function Activity({ admin, close }) {
  const state = useAdminData(`/admin/activity-logs/${admin._id}`);
  return <section aria-label="Admin activity" className="portal-success">
    <div className="portal-heading"><h2>Activity: {admin.name}</h2><button className="portal-button secondary" onClick={close}>Close activity</button></div>
    <DataStatus {...state} />
    {state.data && (state.data.activityLog.length ? <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>When</th><th>Action</th><th>Description</th></tr></thead><tbody>{state.data.activityLog.map((entry, index) => <tr key={entry._id || index}><td>{new Date(entry.timestamp).toLocaleString()}</td><td>{entry.action}</td><td>{entry.description}</td></tr>)}</tbody></table></div> : <p>No activity recorded.</p>)}
  </section>;
}

export default function Admins() {
  const { request, profile } = useAdmin();
  const canManage = profile.role === 'superadmin';
  const state = useAdminData('/admin/all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(null);
  const [activity, setActivity] = useState(null);
  async function create(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = { name: fields.get('name').trim(), email: fields.get('email').trim().toLowerCase(), password: fields.get('password'), role: fields.get('role') };
    if (!body.name) { setError('Enter an admin name.'); return; }
    setBusy(true); setError(''); setMessage('');
    try { await request('/admin/create', { body }); form.reset(); state.refresh(); setMessage('Admin created. Share the credentials privately.'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function deactivate() {
    if (busy || !pending) return;
    setBusy(true); setError(''); setMessage('');
    try { await request(`/admin/deactivate/${pending._id}`, { method: 'PATCH' }); setMessage(`${pending.name} deactivated.`); setPending(null); state.refresh(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <><h1>Admins</h1><p>{canManage ? 'Create organizer accounts, manage access, and review activity.' : 'Review organizer accounts and activity. Only a superadmin can create or deactivate admins.'} The event supports up to seven admin accounts, including inactive accounts.</p>
    {error && <p role="alert" className="portal-error">{error}</p>}{message && <p role="status" className="portal-success">{message}</p>}
    {canManage && <><h2>Create admin</h2><form className="portal-form" onSubmit={create}><fieldset className="portal-fields" disabled={busy}>
      <label>Admin name<input name="name" required maxLength={150} /></label><label>Admin email<input name="email" type="email" required autoComplete="off" /></label>
      <label>Password<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label>
      <label>Role<select name="role"><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></label>
      <button className="portal-button">{busy ? 'Saving...' : 'Create admin'}</button>
    </fieldset></form></>}
    <div className="portal-heading"><h2>Organizer accounts</h2><button className="portal-button secondary" disabled={busy || state.loading} onClick={state.refresh}>Refresh admins</button></div><DataStatus {...state} />
    {state.data && <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Admin</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{state.data.map(admin => <tr key={admin._id}><td>{admin.name}<small>{admin.email}</small></td><td>{admin.role}</td><td>{admin.isActive ? 'Active' : 'Inactive'}</td><td><div className="table-actions"><button className="portal-button secondary" onClick={() => setActivity(admin)}>Activity for {admin.name}</button>{canManage && admin.isActive && String(admin._id) !== String(profile._id) && <button className="portal-button secondary" disabled={busy} onClick={() => setPending(admin)}>Deactivate {admin.name}</button>}</div></td></tr>)}</tbody></table></div>}
    {pending && <section className="portal-error" aria-label="Confirm admin deactivation"><h2>Deactivate {pending.name}?</h2><p>This account will lose organizer access.</p><button className="portal-button" disabled={busy} onClick={deactivate}>Confirm deactivation</button> <button className="portal-button secondary" disabled={busy} onClick={() => setPending(null)}>Cancel</button></section>}
    {activity && <Activity key={activity._id} admin={activity} close={() => setActivity(null)} />}
  </>;
}
