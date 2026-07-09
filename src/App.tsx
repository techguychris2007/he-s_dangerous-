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
import MyTasksPage from './pages/MyTasksPage';
import SchedulePage from './pages/SchedulePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ResourcesPage from './pages/ResourcesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import HelpFaqPage from './pages/HelpFaqPage';
import InstallPrompt from './components/layout/InstallPrompt';
import { ProgressContext, useProgressState, useProgress } from './state/progressStore';

function RequireLogin({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  if (!progress.learnerName) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const progress = useProgressState();

  return (
    <ProgressContext.Provider value={progress}>
      <InstallPrompt />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          </Route>
        </Routes>
      </HashRouter>
    </ProgressContext.Provider>
  );
}

export default App;
