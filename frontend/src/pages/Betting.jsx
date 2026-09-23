import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAdmin } from '../components/AdminLayout';

export default function Betting() {
  const { request } = useAdmin();
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [team, setTeam] = useState(null);
  const [amount, setAmount] = useState('');
  const [selection, setSelection] = useState('1');
  const [bets, setBets] = useState([]);
  const [multipliers, setMultipliers] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const lock = useRef(false);
  const game = games.find(item => item._id === gameId);
  const completed = game?.auctionConfig?.auctionCompleted;
  async function loadGames() { setGames((await request('/games')).filter(item => item.gameType === 'auction')); }
  useEffect(() => { loadGames().catch(failure => setError(failure.message)); }, [request]);
  useEffect(() => {
    let active = true;
    setBets([]); setMultipliers(['', '', '', '', '', '']); setConfirm(false); setResults([]); setSelection('1');
    if (game) request('/gamble/auction' + '/bets?gameId=' + gameId)
      .then(data => { if (active) setBets(data.bets); }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [gameId, request]);
  async function act(work) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await work(); }
    catch (failure) { setError(failure.message + ' Refresh the team and bets before retrying after a connection failure.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function refreshBets() {
    if (game) setBets((await request('/gamble/auction' + '/bets?gameId=' + gameId)).bets);
  }
  async function refreshTeam() {
    setTeam(await request('/gamble/active-bet-status?teamId=' + encodeURIComponent(teamId)));
  }
  async function placeBet() {
    const pointsBet = Number(amount);
    if (!team || !game || !Number.isSafeInteger(pointsBet) || pointsBet <= 0 || pointsBet > team.totalPoints) throw new Error('Enter a positive whole-number bet within the team balance.');
    const data = await request('/gamble/auction' + '/bet', { body: { teamId: team.teamId, gameId, pointsBet, cupNumber: Number(selection) } });
    setMessage('Bet placed. Remaining points: ' + data.remainingPoints); setAmount('');
    await refreshTeam(); await refreshBets();
  }
  function validateMultipliers() {
    if (multipliers.some(value => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
      setError('Enter a custom multiplier of zero or more for every token.');
      return false;
    }
    setError('');
    return true;
  }
  async function settle() {
    if (!validateMultipliers()) return;
    const body = { gameId, cupMultipliers: Object.fromEntries(multipliers.map((value, i) => [i + 1, Number(value)])) };
    const data = await request('/gamble/auction/reveal', { body });
    const rows = data.allResults;
    setResults(rows); setConfirm(false); setMessage('Results recorded. Team balances updated.');
    await loadGames(); await refreshBets(); if (team) await refreshTeam();
  }
  return <><h1>Auction token betting</h1><p>Bets are deducted immediately. Results return the stake multiplied by the outcome. Auction payouts are rounded down to whole points.</p>
    <section aria-label="Betting instructions"><p>1. Select a betting game. 2. Enter the team ID and check its balance. 3. Place the bet. 4. Reveal the results below.</p><p><strong>Auction multipliers:</strong> enter any nonnegative value for each token, such as 0, 1.25 or 3. Tokens may use the same multiplier.</p></section>
    {error && <p className="portal-error" role="alert">{error}</p>}{message && <p className="portal-success" role="status">{message}</p>}
    <button className="portal-button secondary" disabled={busy} onClick={() => act(async () => { await loadGames(); await refreshBets(); if (team) await refreshTeam(); })}>Refresh</button>
    <fieldset className="portal-fields" disabled={busy}>
      <label className="portal-search">Betting game<select value={gameId} onChange={event => setGameId(event.target.value)}><option value="">Select a game</option>{games.map(item => <option key={item._id} value={item._id}>{item.gameName} ({item.gameType})</option>)}</select></label>
      {!games.length && <p>No betting games are available. <Link className="portal-link" to="/admin/games">Create an Auction in Games</Link> Existing regular games do not appear here. Each betting game is one round.</p>}
      <form className="portal-form" onSubmit={event => { event.preventDefault(); act(refreshTeam); }}><label>Team ID<input required type="number" min="1" step="1" value={teamId} onChange={event => { setTeamId(event.target.value); setTeam(null); }} /></label><button className="portal-button secondary">Check team</button></form>
      {team && <section><h2>{team.teamName} · #{team.teamId}</h2><p>Available points: {team.totalPoints}</p>{team.activeBet ? <><p>Active bet: {team.activeBet.pointsBet} points on {team.activeBet.gameName}, selection {team.activeBet.cupNumber}</p><button className="portal-button secondary" onClick={() => act(async () => { const data = await request('/gamble/cancel-bet', { body: { teamId: team.teamId } }); setMessage('Refunded ' + data.refundedPoints + ' points.'); await refreshTeam(); await refreshBets(); })}>Cancel bet and refund</button></> : null}</section>}
      {!team?.activeBet && !completed && <form className="portal-form" onSubmit={event => { event.preventDefault(); act(placeBet); }}><fieldset className="portal-fields" disabled={!team || !game}><label>Points to bet<input required type="number" min="1" max={team?.totalPoints} step="1" value={amount} onChange={event => setAmount(event.target.value)} /></label><label>Tokens<select value={selection} onChange={event => setSelection(event.target.value)}>{Array.from({ length: 6 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><p>{team ? `After placing this bet: ${team.totalPoints - Number(amount || 0)} points` : 'Check a team to see its available balance.'}</p><button className="portal-button">Place bet and deduct points</button></fieldset>{(!team || !game) && <p>Select a betting game and check the team ID to enable betting.</p>}</form>}
      {game && <><h2>Active bets</h2><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Team</th><th>Token</th><th>Bet</th></tr></thead><tbody>{bets.map(bet => <tr key={bet.teamId}><td>{bet.teamName} · #{bet.teamId}</td><td>{bet.cupNumber}</td><td>{bet.pointsBet}</td></tr>)}</tbody></table></div>{!bets.length && <p>No active bets.</p>}
        {completed ? <p>This round is complete. Create a new game for the next round.</p> : <><h2>Reveal token multipliers</h2><p>Enter a custom multiplier for each token. Use 0 for no payout or 1 to return the stake.</p><div className="portal-form">{multipliers.map((value, i) => <label key={i}>Token {i + 1} multiplier<input type="number" min="0" step="any" required placeholder="e.g. 2.5" value={value} onChange={event => { setConfirm(false); setMultipliers(old => old.map((v, j) => j === i ? event.target.value : v)); }} /></label>)}</div><button className="portal-button" disabled={!bets.length} onClick={() => { if (validateMultipliers()) setConfirm(true); }}>Review results</button>{confirm && <section className="portal-success"><p>Finalize these results for {game.gameName} and update {bets.length} team balances? This completes the round.</p><button className="portal-button" onClick={() => act(settle)}>Confirm results and update points</button> <button className="portal-button secondary" onClick={() => setConfirm(false)}>Cancel</button></section>}</>}
      </>}
    </fieldset>
    {!!results.length && <><h2>Results</h2><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Team</th><th>Bet</th><th>Multiplier</th><th>Payout</th><th>Net change</th><th>Balance</th></tr></thead><tbody>{results.map(row => <tr key={row.teamId}><td>{row.teamName}</td><td>{row.pointsBet}</td><td>{row.multiplier}×</td><td>{row.pointsAwarded}</td><td>{row.netChange}</td><td>{row.totalPoints}</td></tr>)}</tbody></table></div></>}
  </>;
}
