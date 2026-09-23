import Betting from './pages/Betting';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import Login from './pages/Login';
import TeamProgress from './pages/TeamProgress';
import AdminAccount from './pages/AdminAccount';
import AdminLayout from './components/AdminLayout';
import RegisterTeam from './pages/RegisterTeam';
import Scoring from './pages/Scoring';
import BulkScoring from './pages/BulkScoring';
import Games from './pages/Games';
import ArcadeGames from './pages/ArcadeGames';
import Admins from './pages/Admins';
import Teams from './pages/Teams';
import History from './pages/History';
import { SessionProvider } from './lib/session';
import './styles/portal.css';

export default function App() {
  return (
    <SessionProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<ArcadeGames />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/login" element={<Login key="participant" />} />
        <Route path="/admin/login" element={<Login key="admin" adminLogin />} />
        <Route path="/teamprogress" element={<TeamProgress />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminAccount />} />
          <Route path="register" element={<RegisterTeam />} />
          <Route path="scoring" element={<Scoring />} />
          <Route path="bulkupdate" element={<BulkScoring />} />
          <Route path="games" element={<Games />} />
          <Route path="betting" element={<Betting />} />
          <Route path="betting/rounds" element={<Navigate to="/admin/betting" replace />} />
          <Route path="admins" element={<Admins />} />
          <Route path="teams" element={<Teams />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter></SessionProvider>
  );
}
