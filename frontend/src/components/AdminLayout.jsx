import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useOutletContext } from 'react-router-dom';
import PageShell from './PageShell';
import { api } from '../lib/api';
import { useSession } from '../lib/session';

export default function AdminLayout() {
  const { admin, saveAdmin } = useSession();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!admin?.token) return;
    let active = true;
    setProfile(null); setError(''); setExpired(false);
    api('/admin/profile', { token: admin.token }).then(data => {
      if (active) setProfile(data);
    }).catch(failure => {
      if (!active) return;
      if ([401, 403].includes(failure.status)) setExpired(true);
      else setError(failure.message);
    });
    return () => { active = false; };
  }, [admin?.token, retry]);
  const request = useCallback(async (path, options = {}) => {
    try { return await api(path, { ...options, token: admin.token }); }
    catch (failure) {
      if ([401, 403].includes(failure.status)) setExpired(true);
      throw failure;
    }
  }, [admin?.token]);
  if (!admin?.token) return <Navigate to="/admin/login" replace />;
  return <PageShell><section className="portal-panel">
    {expired ? <><h1>Session expired</h1><p>Please sign in again to continue.</p><button className="portal-button" onClick={() => saveAdmin(null)}>Return to login</button></> : !profile ? <>
      <h1>Verifying your session…</h1>{error && <p className="portal-error" role="alert">{error} <button onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
      <button className="portal-button secondary" onClick={() => saveAdmin(null)}>Sign out</button>
    </> : !['admin', 'superadmin'].includes(profile.role) ? <><h1>Access denied</h1><p>An organizer account is required.</p><button className="portal-button" onClick={() => saveAdmin(null)}>Sign out</button></> : <>
      <div className="portal-heading"><p className="portal-eyebrow">ORGANIZER · {profile.name}</p><button className="portal-button secondary" onClick={() => saveAdmin(null)}>Sign out</button></div>
      <nav className="admin-tabs" aria-label="Organizer navigation">{[['/admin', 'Overview'], ['/admin/games', 'Games'], ['/admin/register', 'Register team'], ['/admin/scoring', 'Scoring / QR'], ['/admin/bulkupdate', 'Bulk scoring'], ['/admin/teams', 'Teams'], ['/admin/history', 'History'], ['/admin/admins', 'Admins']].map(([to, title]) => <NavLink key={to} to={to} end>{title}</NavLink>)}</nav>
      <Outlet context={{ profile, request }} />
    </>}
  </section></PageShell>;
}
export const useAdmin = () => useOutletContext();
