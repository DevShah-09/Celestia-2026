import { Home, Trophy, Menu, X, Users, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSession } from '../lib/session';
export default function Navbar({ open, setOpen }) {
  const { team, admin } = useSession();
  const links = [['HOME', '/', Home], ['LEADERBOARD', '/leaderboard', Trophy],
    [team ? 'MY TEAM' : 'TEAM LOGIN', team ? '/teamprogress' : '/login', Users],
    [admin ? 'ADMIN' : 'ADMIN LOGIN', admin ? '/admin' : '/admin/login', Shield]];
  return <header className="top-nav">
    <NavLink to="/" className="brand" aria-label="Celestia home"><span className="brand-play">CELES</span><span className="brand-verse">TIA</span></NavLink>
    <button className="mobile-menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    <nav className={`nav-links ${open ? 'nav-open' : ''}`} aria-label="Main navigation">
      {links.map(([label, path, Icon]) => <NavLink key={path} to={path} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}
    </nav>
  </header>;
}
