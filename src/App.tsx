import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuizSession from './pages/QuizSession';
import Onboarding from './pages/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import Mentor from './pages/Mentor';
import Leaderboard from './pages/Leaderboard';
import ThematicTests from './pages/ThematicTests';
import Tests from './pages/Tests';
import History from './pages/History';
import ResultDetail from './pages/ResultDetail';
import Progress from './pages/Progress';
import Plans from './pages/Plans';
import DashboardLayout from './components/DashboardLayout';
import Admin from './pages/Admin';
import OnboardingQuiz from './pages/OnboardingQuiz';
import Notifications from './pages/Notifications';
import GuestQuizSession from './pages/GuestQuizSession';
import IntroQuiz from './pages/IntroQuiz';
import { useLimitStore } from './store/useLimitStore';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import MockExamSession from './pages/MockExamSession';

function App() {
  const { isAuthenticated, isGuest, fetchUser, accessToken } = useAuthStore();
  const { isOpen, title, reason, resetAt, closeLimitModal } = useLimitStore();

  useEffect(() => {
    if (accessToken) {
      fetchUser();
    }
  }, [accessToken, fetchUser]);

  const isRealAuth = isAuthenticated && !isGuest;

  return (
    <BrowserRouter>
      <div className="relative min-h-screen overflow-hidden">
        {/* Glowing Ellipses Background */}
        <div className="fixed bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-cyan-400/30 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="fixed top-[20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-purple-600/30 rounded-full blur-[140px] -z-10 pointer-events-none" />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={isRealAuth ? <Navigate to="/dashboard" replace /> : <Landing />} />
          <Route path="/login" element={isRealAuth ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          
          {/* Guest Flow Routes */}
          <Route path="/intro" element={<Navigate to="/onboarding-quiz" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding-quiz" element={<OnboardingQuiz />} />
          <Route path="/guest-quiz" element={<GuestQuizSession />} />
          <Route path="/quiz/:sessionId" element={<QuizSession />} />
          <Route path="/mock-exam" element={<MockExamSession />} />
          <Route path="/mock-exam/:id" element={<MockExamSession />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Sidebar Layout Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mentor" element={<Mentor />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/tests/thematic" element={<ThematicTests />} />
              <Route path="/tests" element={<Tests />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:resultId" element={<ResultDetail />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* Standalone Protected Routes (Admin) */}
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>

        {/* Global Pro Upgrade & Limit Modal */}
        <ProUpgradeModal
          isOpen={isOpen}
          onClose={closeLimitModal}
          title={title}
          reason={reason}
          resetAt={resetAt}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;

