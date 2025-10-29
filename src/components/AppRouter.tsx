import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Components
import Layout from '../components/layout/Layout.tsx';
import ProtectedRoute from '../components/ui/ProtectedRoute.tsx';

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

export default function AppRouter() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            // Allow access to login page if in recovery mode (even if authenticated)
            (() => {
              const isRecoveryMode = window.location.search.includes('type=recovery') || 
                                   window.location.search.includes('recovery=true') ||
                                   window.location.hash.includes('type=recovery') ||
                                   window.location.hash.includes('access_token') ||
                                   window.location.hash.includes('refresh_token') ||
                                   window.location.search.includes('access_token');
              
              return isAuthenticated && !isRecoveryMode ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPage />;
            })()
          }
        />
        <Route 
          path="/activate-token" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <ActivateTokenPage />
          } 
        />
        <Route 
          path="/request-password-reset" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RequestPasswordResetPage />
          } 
        />
        <Route 
          path="/debug-auth" 
          element={<DebugAuthPage />} 
        />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* User Routes */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="picks" element={<PicksPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="trends" element={<TrendsPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="history" element={<HistoryPage />} />
            
            {/* Admin Routes */}
            {user?.user_type === 'admin' && (
              <>
                <Route path="admin" element={<AdminDashboard />} />
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