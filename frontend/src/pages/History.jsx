import { useState } from 'react';
import { useAdminData } from '../lib/useAdminData';
import DataStatus from '../components/DataStatus';

export default function History() {
  const state = useAdminData('/admin/history');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const rows = (state.data?.pointsHistory || []).filter(row => (type === 'all' || (type === 'deductions' ? row.pointsAwarded < 0 : row.pointsAwarded >= 0)) && [row.teamName, row.teamId, row.gameName, row.assignedBy?.adminName, row.reason].some(value => String(value || '').toLowerCase().includes(query.trim().toLowerCase())));
  return <><h1>Scoring history</h1><p>Review awards and deductions across all teams and organizers.</p>
    <div className="portal-form"><label>Search scoring history<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Team, game, organizer, or reason" /></label><label>Entry type<select value={type} onChange={event => setType(event.target.value)}><option value="all">All entries</option><option value="awards">Awards</option><option value="deductions">Deductions</option></select></label></div>
    <button className="portal-button secondary" disabled={state.loading} onClick={state.refresh}>Refresh history</button><DataStatus {...state} />
    {state.data && <><p>{rows.length} matching entries · Net points: {rows.reduce((total, row) => total + row.pointsAwarded, 0)}</p><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>When</th><th>Team</th><th>Game / adjustment</th><th>Points</th><th>Organizer</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{row.assignedAt ? new Date(row.assignedAt).toLocaleString() : '—'}</td><td>{row.teamName}<small>#{row.teamId}</small></td><td>{row.gameName}<small>{row.reason}</small></td><td>{row.pointsAwarded > 0 ? '+' : ''}{row.pointsAwarded}</td><td>{row.assignedBy?.adminName || 'Unknown'}</td></tr>)}{!rows.length && <tr><td colSpan={5}>No matching history.</td></tr>}</tbody></table></div></>}
  </>;
}
