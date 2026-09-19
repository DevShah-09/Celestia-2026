import { Link } from 'react-router-dom';
import { useAdmin } from '../components/AdminLayout';
export default function AdminAccount() {
  const { profile } = useAdmin();
  return <><h1>Welcome, {profile.name}</h1><p>{profile.email}</p><p className="portal-eyebrow">{profile.role}</p><p>Register teams and record event scores from your organizer dashboard.</p>
    <div className="admin-actions"><Link className="portal-button" to="/admin/games">Create a game</Link><Link className="portal-button" to="/admin/register">Register a team</Link><Link className="portal-button" to="/admin/scoring">Record a score</Link><Link className="portal-button" to="/admin/bulkupdate">Update multiple teams</Link><Link className="portal-button" to="/admin/teams">Browse teams</Link><Link className="portal-button" to="/admin/history">Scoring history</Link><Link className="portal-button" to="/admin/admins">Manage admins</Link></div>
    <Link className="portal-link" to="/leaderboard">View live leaderboard</Link></>;
}
