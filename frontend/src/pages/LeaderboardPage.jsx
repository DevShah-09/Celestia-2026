import { useState } from 'react';
import Navbar from '../components/Navbar';
import HeroTitle from '../components/HeroTitle';
import TeamSearch from '../components/TeamSearch';
import Leaderboard from '../components/Leaderboard';
import FloatingEnvironment from '../components/FloatingEnvironment';
import { useLiveData } from '../lib/useLiveData';
export function LeaderboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [teamInput, setTeamInput] = useState('');
  const { data, loading, error, updated, refresh } = useLiveData('/participants/leaderboard/top');
  const query = teamInput.trim().toLowerCase();
  const players = [...(data || [])].sort((a, b) => b.totalPoints - a.totalPoints || a.teamId - b.teamId)
    .map((team, index) => ({ rank: index + 1, name: team.teamName, team: `Team #${team.teamId}`, teamSize: team.teamSize, score: team.totalPoints }))
    .filter(team => team.name.toLowerCase().includes(query) || team.team.toLowerCase().includes(query));
  return <div className="page"><div className="background-art" /><FloatingEnvironment /><Navbar open={menuOpen} setOpen={setMenuOpen} />
    <main className="content"><HeroTitle /><TeamSearch value={teamInput} setValue={setTeamInput} />
      <div className="live-status"><span>{updated ? `Updated ${updated.toLocaleTimeString()} · Refreshes every 10 seconds` : 'Live team standings'}</span><button className="portal-button secondary" onClick={refresh}>Refresh</button></div>
      {error && <p className="portal-error" role="alert">{error} {data && 'Showing the last available scores.'} <button onClick={refresh}>Retry</button></p>}
      <div className="leaderboard-frame">{loading ? <div className="empty-state" role="status">Loading leaderboard…</div> : data && (data.length ? <Leaderboard players={players} /> : <div className="empty-state">No teams registered yet. Scores will appear here.</div>)}</div>
    </main>
  </div>;
}
