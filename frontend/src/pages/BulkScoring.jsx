import { useRef, useState } from 'react';
import { useAdmin } from '../components/AdminLayout';
import GameSelect from '../components/GameSelect';
const newRow = () => ({ key: crypto.randomUUID(), teamId: '', scoreToAdd: '', reason: '' });
export default function BulkScoring() {
  const { request } = useAdmin();
  const [gameId, setGameId] = useState('');
  const [rows, setRows] = useState(() => [newRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inFlight = useRef(false);
  function edit(key, field, value) { setRows(previous => previous.map(row => row.key === key ? { ...row, [field]: value } : row)); }
  function record(data) {
    setResult(data);
    const successful = new Set(data.successful.map(team => String(team.teamId)));
    setRows(previous => { const remaining = previous.filter(row => !successful.has(String(Number(row.teamId)))); return remaining.length ? remaining : [newRow()]; });
  }
  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const updates = rows.map(({ teamId, scoreToAdd, reason }) => ({ teamId: Number(teamId), scoreToAdd: Number(scoreToAdd), reason: reason.trim() }));
    if (updates.some(row => !Number.isSafeInteger(row.teamId) || row.teamId < 1 || !Number.isSafeInteger(row.scoreToAdd) || row.scoreToAdd === 0)) { setError('Use positive whole-number team IDs and nonzero whole-number score changes.'); return; }
    if (new Set(updates.map(row => row.teamId)).size !== updates.length) { setError('Each team can appear only once in a batch.'); return; }
    inFlight.current = true; setBusy(true); setError(''); setResult(null);
    try { record(await request('/admin/bulk-update-points', { body: { updates, ...(gameId ? { gameId } : {}) } })); }
    catch (failure) {
      if (failure.data?.successful && failure.data?.failed) record(failure.data);
      else setError(`${failure.message} If the connection was interrupted, check team history before resubmitting.`);
    } finally { inFlight.current = false; setBusy(false); }
  }
  return <><h1>Bulk scoring</h1><p>Enter positive points to award or negative points to deduct. Successful rows are removed after submission; failed rows stay available for correction.</p>
    <form className="portal-form" onSubmit={submit}><GameSelect optional value={gameId} onChange={setGameId} disabled={busy} />
      <fieldset disabled={busy} className="portal-fields">{rows.map((row, index) => <div className="bulk-row" key={row.key}>
        <label>Team ID {index + 1}<input inputMode="numeric" pattern="[0-9]+" required value={row.teamId} onChange={event => edit(row.key, 'teamId', event.target.value)} /></label>
        <label>Points change {index + 1}<input type="number" step="1" required value={row.scoreToAdd} onChange={event => edit(row.key, 'scoreToAdd', event.target.value)} /></label>
        <label>Reason {index + 1}<input value={row.reason} maxLength={300} onChange={event => edit(row.key, 'reason', event.target.value)} /></label>
        <button type="button" className="portal-button secondary" disabled={rows.length === 1} onClick={() => setRows(previous => previous.filter(item => item.key !== row.key))}>Remove row {index + 1}</button>
      </div>)}<div className="portal-heading"><button type="button" className="portal-button secondary" onClick={() => setRows(previous => [...previous, newRow()])}>Add team</button><button className="portal-button" type="submit">{busy ? 'Updating…' : 'Submit scores'}</button></div></fieldset>
    </form>{error && <p className="portal-error" role="alert">{error}</p>}
    {result && <section aria-label="Batch results"><h2>Batch results</h2><p role="status">{result.successful.length} succeeded · {result.failed.length} failed</p><ul className="batch-results">{result.successful.map(row => <li key={row.teamId} className="portal-success">Team #{row.teamId} ({row.teamName}): {row.previousPoints} → {row.newTotalPoints}</li>)}{result.failed.map((row, index) => <li key={`${row.teamId}-${index}`} className="portal-error">Team #{row.teamId}: {row.reason}</li>)}</ul></section>}
  </>;
}
