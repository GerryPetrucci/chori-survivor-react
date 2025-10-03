import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Components
import Layout from '../components/layout/Layout.tsx';
import ProtectedRoute from '../components/ui/ProtectedRoute.tsx';

// Pages
import LoginPage from '../pages/Login.tsx';
import DashboardPage from '../pages/Dashboard.tsx';
import PicksPage from '../pages/Picks.tsx';
import RankingPage from '../pages/Ranking.tsx';
import ProfilePage from '../pages/Profile.tsx';
import RulesPage from '../pages/Rules.tsx';
import HistoryPage from '../pages/History.tsx';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard.tsx';
import AdminMatches from '../pages/admin/AdminMatches.tsx';
import AdminUsers from '../pages/admin/AdminUsers.tsx';

export default function AppRouter() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* User Routes */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="picks" element={<PicksPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="history" element={<HistoryPage />} />
            
            {/* Admin Routes */}
            {user?.user_type === 'admin' && (
              <>
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/matches" element={<AdminMatches />} />
                <Route path="admin/users" element={<AdminUsers />} />
              </>
            )}
          </Route>
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}