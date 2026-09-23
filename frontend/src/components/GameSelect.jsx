import { useLiveData } from '../lib/useLiveData';
import { useId } from 'react';
export default function GameSelect({ value, onChange, optional = false, disabled = false }) {
  const { data, loading, error, refresh } = useLiveData('/games');
  const id = useId();
  return <div>
    <div className="portal-search"><label htmlFor={id}>Game</label><select id={id} required={!optional} value={value} disabled={disabled || loading} onChange={event => onChange(event.target.value, data?.find(game => game._id === event.target.value))}>
      <option value="">{optional ? 'Custom adjustment (no game)' : 'Select a game'}</option>
      {(data || []).filter(game => !game.gameType || game.gameType === 'regular').map(game => <option key={game._id} value={game._id}>{game.gameName} — {game.gamePoints} points</option>)}
    </select></div>
    {loading && <p role="status">Loading games…</p>}
    {error && <p className="portal-error" role="alert">{error} <button type="button" onClick={refresh}>Retry games</button></p>}
    {data?.length === 0 && <p>No active games available. Ask an organizer to create or activate a game.</p>}
  </div>;
}
