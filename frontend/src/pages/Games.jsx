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
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      const game = await request('/games', { body: { gameName: gameName.trim(), gamePoints: points, description: description.trim() } });
      setGames(previous => [...previous, game].sort((a, b) => a.gameName.localeCompare(b.gameName)));
      setSuccess(`${game.gameName} created. It is now available for scoring.`);
      setGameName(''); setGamePoints(''); setDescription('');
    } catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <>
    <h1>Games</h1><p>Create games and set the points teams earn for completing them.</p>
    <h2>Create game</h2>
    <form className="portal-form" onSubmit={submit}>
      <fieldset className="portal-fields" disabled={busy || loading || !!loadError}>
        <label>Game name<input required value={gameName} onChange={event => setGameName(event.target.value)} /></label>
        <label>Points per completion<input required type="number" min="1" step="1" value={gamePoints} onChange={event => setGamePoints(event.target.value)} /></label>
        <label>Description (optional)<textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} /></label>
        <button className="portal-button" type="submit">{busy ? 'Creating...' : 'Create game'}</button>
      </fieldset>
    </form>
    {error && <p className="portal-error" role="alert">{error}</p>}
    {success && <p className="portal-success" role="status">{success}</p>}
    <h2>Active games</h2>
    {loading ? <p role="status">Loading games...</p> : loadError ? <p className="portal-error" role="alert">{loadError} <button onClick={() => setRetry(value => value + 1)}>Retry</button></p> : games.length === 0 ? <p>No games yet. Create your first game above.</p> :
      <div className="portal-table-wrap"><table className="portal-table"><caption className="portal-muted">Games available for scoring</caption><thead><tr><th scope="col">Game</th><th scope="col">Points</th></tr></thead>
        <tbody>{games.map(game => <tr key={game._id}><td>{game.gameName}{game.description && <small>{game.description}</small>}</td><td>{game.gamePoints}</td></tr>)}</tbody>
      </table></div>}
  </>;
}
