import { useRef, useState } from 'react';
import { useAdmin } from '../components/AdminLayout';
import GameSelect from '../components/GameSelect';
import QrScanner from '../components/QrScanner';
export default function Scoring() {
  const { request } = useAdmin();
  const [gameId, setGameId] = useState('');
  const [game, setGame] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [verified, setVerified] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('award');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const inFlight = useRef(false);
  async function verify(text) {
    if (inFlight.current) return;
    setScanning(false); setVerified(null); setResult(null); setError(''); setQrData(null);
    let id = Number(teamId);
    try {
      if (text !== undefined) id = Number(JSON.parse(text)?.teamId);
      if (!Number.isSafeInteger(id) || id < 1) throw new Error();
    } catch { setError('Enter a valid team ID or scan a Celestia team QR code.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      const data = text === undefined ? await request(`/participants/${id}`) : await request('/points/verify-qr', { body: { qrData: text } });
      setTeamId(String(data.teamId)); setVerified(data); setQrData(text ?? null);
    } catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function award() {
    if (inFlight.current || !verified || !gameId) return;
    inFlight.current = true; setBusy(true); setError(''); setResult(null);
    try {
      const result = await request(qrData ? '/points/assign-by-qr' : '/points/assign', { body: qrData ? { qrData, gameId } : { teamId: verified.teamId, gameId } });
      setResult(result); setVerified(null); setTeamId(''); setQrData(null);
    } catch (failure) { setError(`${failure.message} Check the team's history before retrying if the connection was interrupted.`); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function deduct() {
    const amount = Number(points);
    if (inFlight.current || !verified) return;
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > verified.totalPoints) { setError('Enter positive whole-number points within the team balance.'); return; }
    inFlight.current = true; setBusy(true); setError(''); setResult(null);
    try {
      const result = await request(qrData ? '/admin/subtract-points-qr' : '/admin/subtract-points', { body: { ...(qrData ? { qrData } : { teamId: verified.teamId }), points: amount, reason: reason.trim() } });
      setResult({ ...result, deduction: true }); setVerified(null); setTeamId(''); setQrData(null); setPoints(''); setReason('');
    } catch (failure) { setError(`${failure.message} Check team history before retrying if the connection was interrupted.`); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <><h1>Record game score</h1><p>Choose a game, verify the team, then award its points.</p>
    <div className="portal-form"><label>Scoring action<select value={mode} disabled={busy} onChange={event => { setMode(event.target.value); setVerified(null); setQrData(null); setScanning(false); setResult(null); setError(''); }}><option value="award">Award game points</option><option value="deduct">Deduct points</option></select></label>
      {mode === 'award' ? <GameSelect value={gameId} disabled={busy} onChange={(id, selected) => { setGameId(id); setGame(selected); setResult(null); }} /> : <><label>Points to deduct<input type="number" min="1" step="1" value={points} disabled={busy} onChange={event => setPoints(event.target.value)} /></label><label>Deduction reason<input maxLength={300} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label></>}
      <form className="portal-fields" onSubmit={event => { event.preventDefault(); verify(); }}><label>Team ID<input inputMode="numeric" pattern="[0-9]+" required value={teamId} disabled={busy || scanning} onChange={event => { setTeamId(event.target.value); setVerified(null); setQrData(null); setResult(null); }} /></label><button className="portal-button secondary" disabled={busy || scanning}>Verify team</button></form>
      <button className="portal-button secondary" disabled={busy} onClick={() => { setVerified(null); setQrData(null); setScanning(!scanning); }}>{scanning ? 'Close scanner' : 'Scan QR code'}</button>
      {scanning && <QrScanner onScan={verify} />}
    </div>
    {busy && <p role="status">Processing…</p>}{error && <p className="portal-error" role="alert">{error}</p>}
    {verified && <div className="portal-success"><h2>{verified.teamName} · #{verified.teamId}</h2><p>Leader: {verified.leaderName} · Current points: {verified.totalPoints}</p>{mode === 'award' ? <><p>{game ? `${game.gameName}: +${game.gamePoints} points` : 'Select a game to continue.'}</p><button className="portal-button" disabled={busy || !gameId} onClick={award}>Award points</button></> : <><p>Deduct {points || '0'} points from this team{reason && `: ${reason}`}.</p><button className="portal-button" disabled={busy || !points} onClick={deduct}>Confirm deduction</button></>}</div>}
    {result && <div className="portal-success" role="status"><h2>{result.deduction ? 'Points deducted' : 'Points awarded'}</h2>{result.deduction ? <><p>{result.teamName}: -{result.pointsSubtracted}</p><p>New total: {result.newTotalPoints}</p></> : <><p>{result.teamName}: +{result.pointsAwarded} for {result.gameCompleted}</p><p>New total: {result.totalPoints} · Completions: {result.timesCompletedThisGame}</p></>}</div>}
  </>;
}
