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
  return <><h1>Record game score</h1><p>Choose a game, verify the team, then award its points.</p>
    <div className="portal-form"><GameSelect value={gameId} disabled={busy} onChange={(id, selected) => { setGameId(id); setGame(selected); setResult(null); }} />
      <form className="portal-fields" onSubmit={event => { event.preventDefault(); verify(); }}><label>Team ID<input inputMode="numeric" pattern="[0-9]+" required value={teamId} disabled={busy || scanning} onChange={event => { setTeamId(event.target.value); setVerified(null); setQrData(null); setResult(null); }} /></label><button className="portal-button secondary" disabled={busy || scanning}>Verify team</button></form>
      <button className="portal-button secondary" disabled={busy} onClick={() => { setVerified(null); setQrData(null); setScanning(!scanning); }}>{scanning ? 'Close scanner' : 'Scan QR code'}</button>
      {scanning && <QrScanner onScan={verify} />}
    </div>
    {busy && <p role="status">Processing…</p>}{error && <p className="portal-error" role="alert">{error}</p>}
    {verified && <div className="portal-success"><h2>{verified.teamName} · #{verified.teamId}</h2><p>Leader: {verified.leaderName} · Current points: {verified.totalPoints}</p><p>{game ? `${game.gameName}: +${game.gamePoints} points` : 'Select a game to continue.'}</p><button className="portal-button" disabled={busy || !gameId} onClick={award}>Award points</button></div>}
    {result && <div className="portal-success" role="status"><h2>Points awarded</h2><p>{result.teamName}: +{result.pointsAwarded} for {result.gameCompleted}</p><p>New total: {result.totalPoints} · Completions: {result.timesCompletedThisGame}</p></div>}
  </>;
}
