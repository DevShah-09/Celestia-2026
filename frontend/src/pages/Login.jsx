import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
export default function Login({ adminLogin = false }) {
  const { team, admin, saveTeam, saveAdmin } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (adminLogin ? admin : team) return <Navigate to={adminLogin ? '/admin' : '/teamprogress'} replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const body = adminLogin
        ? { email: fields.get('email').trim().toLowerCase(), password: fields.get('password') }
        : { teamName: fields.get('teamName').trim(), teamId: Number(fields.get('teamId')) };
      if (!adminLogin && (!body.teamName || !Number.isSafeInteger(body.teamId) || body.teamId <= 0)) throw new Error('Enter a team name and a valid numeric team ID.');
      const data = await api(adminLogin ? '/admin/login' : '/participants/login', { body });
      if (adminLogin) {
        if (!data?.token || !data?.admin) throw new Error('Invalid login response. Please try again.');
        saveAdmin(data);
      } else {
        if (!data?.teamId) throw new Error('Invalid login response. Please try again.');
        saveTeam(data);
      }
      navigate(adminLogin ? '/admin' : '/teamprogress', { replace: true });
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <PageShell><section className="portal-panel login-panel">
    <p className="portal-eyebrow">CELESTIA 2026</p><h1>{adminLogin ? 'Admin login' : 'Welcome, adventurers'}</h1>
    <p>{adminLogin ? 'Sign in with your organizer account.' : 'Enter your registered team details to see your progress.'}</p>
    <form onSubmit={submit} className="portal-form">
      {adminLogin ? <><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label></> : <><label>Team name<input name="teamName" autoComplete="organization" required maxLength={150} /></label><label>Team ID<input name="teamId" inputMode="numeric" pattern="[0-9]+" autoComplete="username" placeholder="e.g. 1000" required /></label></>}
      {error && <p className="portal-error" role="alert">{error}</p>}
      <button className="portal-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <Link className="portal-link" to={adminLogin ? '/login' : '/admin/login'}>{adminLogin ? 'Participant login' : 'Organizer? Admin login'}</Link>
  </section></PageShell>;
}
