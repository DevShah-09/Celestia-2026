import { useState } from 'react';
import { useAdmin } from '../components/AdminLayout';
import CsvRegistration from '../components/CsvRegistration';
export default function RegisterTeam() {
  const { request } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = Object.fromEntries(['teamName', 'leaderName', 'leaderEmail'].map(key => [key, fields.get(key).trim()]));
    body.leaderEmail = body.leaderEmail.toLowerCase();
    body.teamSize = Number(fields.get('teamSize'));
    if (!body.teamName || !body.leaderName || !Number.isSafeInteger(body.teamSize) || body.teamSize < 1) { setError('Enter team details and a positive whole-number team size.'); return; }
    setBusy(true); setError(''); setResult(null);
    try { setResult(await request('/participants/register', { body, timeoutMs: 45000 })); form.reset(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <><h1>Register a team</h1><p>Create the team and its event QR code.</p>
    {error && <p className="portal-error" role="alert">{error}</p>}
    {result && <div className="portal-success" role="status"><h2>Team registered</h2><p><strong>{result.teamName} · Team #{result.teamId}</strong></p><p>{result.emailSent ? 'Registration email sent to the team leader.' : result.emailStatus === 'pending' || result.emailStatus === 'sending' ? 'Your QR email is awaiting delivery. You can download the QR code now.' : 'Email could not be delivered or confirmed. Download the QR code below; the team is already registered.'}</p>{result.qrCode && <><img className="registration-qr" src={result.qrCode} alt={`QR code for team ${result.teamId}`} /><a className="portal-button" href={result.qrCode} download={`team-${result.teamId}-qr.png`}>Download QR code</a></>}</div>}
    <form className="portal-form" onSubmit={submit}><fieldset disabled={busy} className="portal-fields">
      <label>Team name<input name="teamName" required maxLength={150} /></label>
      <label>Leader name<input name="leaderName" required maxLength={150} autoComplete="name" /></label>
      <label>Leader email<input name="leaderEmail" type="email" required autoComplete="email" /></label>
      <label>Team size<input name="teamSize" type="number" min="1" step="1" required /></label>
      <button className="portal-button" type="submit">{busy ? 'Registering…' : 'Register team'}</button>
    </fieldset></form><CsvRegistration /></>;
}
