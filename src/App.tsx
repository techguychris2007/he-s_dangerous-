import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import ModulePage from './pages/ModulePage';
import LessonPage from './pages/LessonPage';
import LabPage from './pages/LabPage';
import LabsIndexPage from './pages/LabsIndexPage';
import RoadmapPage from './pages/RoadmapPage';
import ProgressPage from './pages/ProgressPage';
import LoginPage from './pages/LoginPage';
import IntroPage from './pages/IntroPage';
import MyTasksPage from './pages/MyTasksPage';
import SchedulePage from './pages/SchedulePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ResourcesPage from './pages/ResourcesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import HelpFaqPage from './pages/HelpFaqPage';
import SocPortalPage from './pages/SocPortalPage';
import SiemLabPage from './pages/SiemLabPage';
import InstallPrompt from './components/layout/InstallPrompt';
import { ProgressContext, useProgressState, useProgress } from './state/progressStore';
import { AuthContext, useAuthState, useAuth } from './state/authStore';

function RequireLogin({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <FullScreenLoader />;
  if (!auth.user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#0a1420' }}>
      <div className="w-8 h-8 rounded-full border-2 border-[#c9a15f] border-t-transparent animate-spin" />
    </div>
  );
}

/** Keeps the local, device-scoped progress store's display name in sync with the authenticated
 *  Supabase account, so the rest of the app (which only knows about `progress.learnerName`) needs
 *  no changes to reflect real accounts. */
function SyncAuthToProgress() {
  const auth = useAuth();
  const progress = useProgress();

  useEffect(() => {
    if (auth.user && !progress.learnerName) {
      const name = (auth.user.user_metadata?.full_name as string | undefined) || auth.user.email?.split('@')[0] || 'Learner';
      progress.login(name);
    }
  }, [auth.user, progress]);

  return null;
}

function App() {
  const progress = useProgressState();
  const auth = useAuthState();

  return (
    <ProgressContext.Provider value={progress}>
      <AuthContext.Provider value={auth}>
        <SyncAuthToProgress />
        <InstallPrompt />
        <HashRouter>
          <Routes>
            <Route path="/welcome" element={<IntroPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/soc-portal"
              element={
                <RequireLogin>
                  <SocPortalPage />
                </RequireLogin>
              }
            />
            <Route
              path="/siem-lab/:labId"
              element={
                <RequireLogin>
                  <SiemLabPage />
                </RequireLogin>
              }
            />
            <Route
              element={
                <RequireLogin>
                  <AppLayout />
                </RequireLogin>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/module/:moduleSlug" element={<ModulePage />} />
              <Route path="/module/:moduleSlug/lesson/:lessonSlug" element={<LessonPage />} />
              <Route path="/labs" element={<LabsIndexPage />} />
              <Route path="/lab/:labSlug" element={<LabPage />} />
              <Route path="/tasks" element={<MyTasksPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/help" element={<HelpFaqPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthContext.Provider>
    </ProgressContext.Provider>
  );
}

export default App;
