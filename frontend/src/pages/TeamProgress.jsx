import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSession } from '../lib/session';
import { useLiveData } from '../lib/useLiveData';
export default function TeamProgress() {
  const { team, saveTeam } = useSession();
  return team?.teamId ? <Progress key={team.teamId} team={team} logout={() => saveTeam(null)} /> : <Navigate to="/login" replace />;
}
function Progress({ team, logout }) {
  const { data, loading, error, updated, refresh } = useLiveData(`/points/progress/${encodeURIComponent(team.teamId)}`);
  const [search, setSearch] = useState('');
  const games = (data?.gameStatistics || []).filter(game => game.gameName.toLowerCase().includes(search.trim().toLowerCase()));
  return <PageShell><section className="portal-panel">
    <div className="portal-heading"><div><p className="portal-eyebrow">TEAM #{team.teamId}</p><h1>{data?.teamName || team.teamName}</h1><p>{data?.leaderName || team.leaderName}</p></div><button className="portal-button secondary" onClick={logout}>Sign out</button></div>
    {loading && <p role="status">Loading team progress…</p>}
    {error && <p className="portal-error" role="alert">{error} {data && 'Showing the last available scores.'} <button onClick={refresh}>Retry</button></p>}
    {data && <>
      <div className="portal-stats"><div><strong>{data.totalPoints.toLocaleString()}</strong><span>Total points</span></div><div><strong>{data.totalGamesPlayed}</strong><span>Games played</span></div><div><strong>{data.uniqueGamesCompleted}</strong><span>Unique games</span></div></div>
      <div className="portal-heading"><h2>Game progress</h2><button className="portal-button secondary" onClick={refresh}>Refresh</button></div>
      <label className="portal-search">Search games<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Game name" /></label>
      <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Game</th><th>Game points</th><th>Times played</th><th>Points earned</th></tr></thead><tbody>{games.map(game => <tr key={game.gameId || game.gameName}><td>{game.gameName}</td><td>{game.gamePoints}</td><td>{game.timesCompleted}</td><td>{game.totalPointsEarned}</td></tr>)}{!games.length && <tr><td colSpan={4}>{search ? 'No matching games.' : 'No games played yet. Your progress will appear here.'}</td></tr>}</tbody></table></div>
      <h2>Activity history</h2><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Game / adjustment</th><th>Points</th><th>When</th><th>Recorded by</th></tr></thead><tbody>{[...(data.gameDetails || [])].reverse().map((entry, index) => <tr key={index}><td>{entry.gameName}{entry.reason && <small>{entry.reason}</small>}</td><td>{entry.points > 0 ? '+' : ''}{entry.points}</td><td>{entry.completedAt ? new Date(entry.completedAt).toLocaleString() : '—'}</td><td>{entry.assignedBy}</td></tr>)}{!data.gameDetails?.length && <tr><td colSpan={4}>No activity yet.</td></tr>}</tbody></table></div>
      <p className="portal-muted">Updates every 10 seconds{updated && ` · Last updated ${updated.toLocaleTimeString()}`}</p>
    </>}
  </section></PageShell>;
}
