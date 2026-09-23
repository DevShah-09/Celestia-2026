import { useEffect, useRef, useState } from 'react';
import { useAdmin } from '../components/AdminLayout';

export default function Games() {
  const { request } = useAdmin();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [gameName, setGameName] = useState('');
  const [gamePoints, setGamePoints] = useState('');
  const [gameType, setGameType] = useState('regular');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    request('/games').then(data => { if (active) setGames(data); })
      .catch(failure => { if (active) setLoadError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request, retry]);

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    setError(''); setSuccess('');
    const points = Number(gamePoints);
    if (!gameName.trim() || !Number.isSafeInteger(points) || points <= 0) {
      setError('Enter a game name and a positive whole number of points.');
      return;
    }
    inFlight.current = true; setBusy(true);
    try {
      const game = await request(editing ? `/games/${editing}` : '/games', { method: editing ? 'PUT' : 'POST', body: { gameName: gameName.trim(), gamePoints: points, ...(!editing && { gameType }), description: description.trim() } });
      setGames(previous => [...previous.filter(item => item._id !== game._id), game].sort((a, b) => a.gameName.localeCompare(b.gameName)));
      setSuccess(editing ? `${game.gameName} updated.` : `${game.gameName} created. It is now available for scoring.`);
      setEditing(null);
      setGameName(''); setGamePoints(''); setDescription('');
    } catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function edit(game) {
    setGameType(game.gameType || 'regular'); setEditing(game._id); setGameName(game.gameName); setGamePoints(String(game.gamePoints)); setDescription(game.description || ''); setSuccess(''); setError('');
    document.getElementById('game-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function deactivate() {
    if (inFlight.current || !pending) return;
    inFlight.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      await request(`/games/${pending._id}`, { method: 'DELETE' });
      setGames(previous => previous.filter(game => game._id !== pending._id));
      setSuccess(`${pending.gameName} deactivated. Existing scores are preserved.`);
      if (editing === pending._id) { setEditing(null); setGameName(''); setGamePoints(''); setDescription(''); }
      setPending(null);
    } catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <>
    <h1>Games</h1><p>Create games and set the points teams earn for completing them.</p>
    <h2 id="game-editor">{editing ? 'Edit game' : 'Create game'}</h2>
    <form className="portal-form" onSubmit={submit}>
      <fieldset className="portal-fields" disabled={busy || loading || !!loadError}>
        <label>Game name<input required value={gameName} onChange={event => setGameName(event.target.value)} /></label>
        <label>Game type<select value={gameType} disabled={!!editing} onChange={event => setGameType(event.target.value)}><option value="regular">Regular scoring</option><option value="auction">Auction</option></select></label>
        <label>Points per completion<input required type="number" min="1" step="1" value={gamePoints} onChange={event => setGamePoints(event.target.value)} /></label>
        <label>Description (optional)<textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} /></label>
        <button className="portal-button" type="submit">{busy ? 'Saving...' : editing ? 'Save game' : 'Create game'}</button>
        {editing && <button className="portal-button secondary" type="button" onClick={() => { setEditing(null); setGameName(''); setGamePoints(''); setDescription(''); }}>Cancel edit</button>}
      </fieldset>
    </form>
    {error && <p className="portal-error" role="alert">{error}</p>}
    {success && <p className="portal-success" role="status">{success}</p>}
    {pending && <section className="portal-error" aria-label="Confirm game deactivation"><h2>Deactivate {pending.gameName}?</h2><p>The game will no longer be available for scoring. Existing scores remain.</p><button className="portal-button" disabled={busy} onClick={deactivate}>Confirm deactivation</button> <button className="portal-button secondary" disabled={busy} onClick={() => setPending(null)}>Cancel</button></section>}
    <h2>Active games</h2>
    {loading ? <p role="status">Loading games...</p> : loadError ? <p className="portal-error" role="alert">{loadError} <button onClick={() => setRetry(value => value + 1)}>Retry</button></p> : games.length === 0 ? <p>No games yet. Create your first game above.</p> :
      <div className="portal-table-wrap"><table className="portal-table"><caption className="portal-muted">Games available for scoring</caption><thead><tr><th scope="col">Game</th><th scope="col">Points</th><th scope="col">Actions</th></tr></thead>
        <tbody>{games.map(game => <tr key={game._id}><td>{game.gameName}{game.description && <small>{game.description}</small>}</td><td>{game.gameType && game.gameType !== 'regular' ? game.gameType : game.gamePoints}</td><td><div className="table-actions"><button className="portal-button secondary" disabled={busy} onClick={() => edit(game)}>Edit {game.gameName}</button><button className="portal-button secondary" disabled={busy} onClick={() => setPending(game)}>Deactivate {game.gameName}</button></div></td></tr>)}</tbody>
      </table></div>}
  </>;
}
