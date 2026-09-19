import { useState } from 'react';
import { useAdminData } from '../lib/useAdminData';
import DataStatus from '../components/DataStatus';

export default function Teams() {
  const state = useAdminData('/participants');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const teams = (state.data || []).filter(team => [team.teamName, team.teamId, team.leaderName, team.leaderEmail].some(value => String(value).toLowerCase().includes(query.trim().toLowerCase())));
  return <><h1>Teams</h1><p>Find registered teams, contact their leaders, and download their QR codes.</p>
    <div className="portal-heading"><label className="portal-search">Search registered teams<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, ID, or email" /></label><button className="portal-button secondary" disabled={state.loading} onClick={state.refresh}>Refresh teams</button></div>
    <DataStatus {...state} />
    {state.data && <><p>{teams.length} team(s)</p><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Team</th><th>Leader</th><th>Members</th><th>Points</th><th>QR code</th></tr></thead><tbody>{teams.map(team => <tr key={team._id || team.teamId}><td>{team.teamName}<small>#{team.teamId}</small></td><td>{team.leaderName}<small>{team.leaderEmail}</small></td><td>{team.teamSize}</td><td>{team.totalPoints}</td><td>{team.qrCode ? <button className="portal-button secondary" onClick={() => setSelected(team)}>QR for #{team.teamId}</button> : 'Unavailable'}</td></tr>)}{!teams.length && <tr><td colSpan={5}>No matching teams.</td></tr>}</tbody></table></div></>}
    {selected && <section className="portal-success" aria-label="Team QR code"><h2>{selected.teamName} · #{selected.teamId}</h2><img className="registration-qr" src={selected.qrCode} alt={`QR code for team ${selected.teamId}`} /><a className="portal-button" href={selected.qrCode} download={`team-${selected.teamId}-qr.png`}>Download QR code</a> <button className="portal-button secondary" onClick={() => setSelected(null)}>Close QR code</button></section>}
  </>;
}
