import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Components
import Layout from '../components/layout/Layout.tsx';
import ProtectedRoute from '../components/ui/ProtectedRoute.tsx';
import OffSeason from '../pages/OffSeason';

// Pages
import LoginPage from '../pages/Login.tsx';
import ActivateTokenPage from '../pages/ActivateToken.tsx';
import RequestPasswordResetPage from '../pages/RequestPasswordReset.tsx';
import DashboardPage from '../pages/Dashboard.tsx';
import PicksPage from '../pages/Picks.tsx';
import MatchesPage from '../pages/Matches.tsx';
import TrendsPage from '../pages/Trends.tsx';
import RankingPage from '../pages/Ranking.tsx';
import ProfilePage from '../pages/Profile.tsx';
import RulesPage from '../pages/Rules.tsx';
import HistoryPage from '../pages/History.tsx';
import DebugAuthPage from '../pages/DebugAuth.tsx';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard.tsx';
import ShowPicks from '../pages/admin/ShowPicks.tsx';

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<OffSeason />} />
      </Routes>
    </Router>
  );
}