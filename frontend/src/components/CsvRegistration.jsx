import { useEffect, useRef, useState } from 'react';
import { useAdmin } from './AdminLayout';
import { parseRegistrationCsv, registrationTemplate } from '../lib/registrationCsv';

export default function CsvRegistration() {
  const { request } = useAdmin();
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const stopped = useRef(false);
  const running = useRef(false);
  useEffect(() => () => { stopped.current = true; }, []);
  useEffect(() => {
    if (!busy) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);
  async function upload(event) {
    const file = event.target.files?.[0];
    setRows([]); setError('');
    if (!file) return;
    if (file.size > 1024 * 1024) { setError('Choose a CSV smaller than 1 MB.'); return; }
    setReading(true);
    try { setRows(parseRegistrationCsv(await file.text())); }
    catch (failure) { setError(failure.message); }
    finally { setReading(false); }
  }
  async function register() {
    if (running.current) return;
    running.current = true; stopped.current = false; setBusy(true); setError('');
    try {
      for (const row of rows.filter(item => item.status === 'Ready')) {
        if (stopped.current) break;
        const update = changes => setRows(previous => previous.map(item => item.row === row.row ? { ...item, ...changes } : item));
        update({ status: 'Registering' });
        try {
          const result = await request('/participants/register', { body: row.body, timeoutMs: 45000 });
          update({ status: 'Registered', result, message: result.emailSent ? 'Email sent' : 'Email unavailable; download QR code' });
        } catch (failure) {
          const knownFailure = [400, 401, 403, 409, 422].includes(failure.status);
          update({ status: knownFailure ? 'Failed' : 'Check team directory', message: failure.message });
          if (!knownFailure || [401, 403].includes(failure.status)) {
            stopped.current = true;
            setError('Import stopped. Check the team directory before importing again; the last request may have saved a team.');
          }
        }
      }
    } finally { running.current = false; setBusy(false); }
  }
  const ready = rows.filter(row => row.status === 'Ready').length;
  return <section aria-label="CSV registration"><h2>Register teams from CSV</h2><p>Upload a CSV, review the rows, then register the valid teams. Each new team receives an ID and QR code. Keep this page open during import.</p>
    <a className="portal-button secondary" href={`data:text/csv;charset=utf-8,${encodeURIComponent(registrationTemplate)}`} download="team-registration-template.csv">Download CSV template</a>
    <div className="portal-form"><label>Team CSV file<input type="file" accept=".csv,text/csv" disabled={busy || reading} onChange={upload} /></label></div>
    {reading && <p role="status">Reading CSV...</p>}{error && <p className="portal-error" role="alert">{error}</p>}
    {!!rows.length && <><p role="status">{rows.filter(row => row.status === 'Registered').length} registered · {ready} ready · {rows.filter(row => row.status === 'Invalid' || row.status === 'Failed').length} invalid or failed</p>
      <div className="portal-heading"><button className="portal-button" disabled={busy || !ready} onClick={register}>{busy ? 'Registering teams...' : `Register ${ready} teams`}</button>{busy && <button className="portal-button secondary" onClick={() => { stopped.current = true; }}>Stop after current team</button>}</div>
      <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Row</th><th>Team / leader</th><th>Members</th><th>Status</th><th>QR code</th></tr></thead><tbody>{rows.map(row => <tr key={row.row}><td>{row.row}</td><td>{row.body.teamName}<small>{row.body.leaderName} · {row.body.leaderEmail}</small></td><td>{row.body.teamSize || '—'}</td><td>{row.status}<small>{row.message}</small>{row.result && <small>Team #{row.result.teamId}</small>}</td><td>{row.result?.qrCode && <a className="portal-button secondary" href={row.result.qrCode} download={`team-${row.result.teamId}-qr.png`}>Download QR #{row.result.teamId}</a>}</td></tr>)}</tbody></table></div></>}
  </section>;
}
