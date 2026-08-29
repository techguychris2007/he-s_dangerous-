import { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import ModulePage from './pages/ModulePage';
import LessonPage from './pages/LessonPage';
import LabPage from './pages/LabPage';
import LabsIndexPage from './pages/LabsIndexPage';
import RoadmapPage from './pages/RoadmapPage';
import MyLearningPage from './pages/MyLearningPage';
import ProgressPage from './pages/ProgressPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import IntroPage from './pages/IntroPage';
import MyTasksPage from './pages/MyTasksPage';
import SchedulePage from './pages/SchedulePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ResourcesPage from './pages/ResourcesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import HelpFaqPage from './pages/HelpFaqPage';
import FeedbackPage from './pages/FeedbackPage';
import SocPortalPage from './pages/SocPortalPage';
import SiemLabPage from './pages/SiemLabPage';
import CodePortalPage from './pages/CodePortalPage';
import CodeTaskPage from './pages/CodeTaskPage';
import BuildPortalPage from './pages/BuildPortalPage';
import ProjectTaskPage from './pages/ProjectTaskPage';
import SeVerifyPage from './pages/SeVerifyPage';
import MlPortalPage from './pages/MlPortalPage';
import MlLessonPage from './pages/MlLessonPage';
import LibraryPage from './pages/LibraryPage';
import BookReaderPage from './pages/BookReaderPage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';
import InstallPrompt from './components/layout/InstallPrompt';
import { ProgressContext, useProgressState, useProgress } from './state/progressStore';
import { AuthContext, useAuthState, useAuth } from './state/authStore';
import { pullProgress, pushProgressWithRetry } from './lib/progressSync';
import { isInstructor } from './lib/instructorConfig';

function RequireLogin({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <FullScreenLoader />;
  if (!auth.user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

/** Route-level gate for the Instructor Dashboard — purely a UX nicety (redirects a non-instructor
 *  straight back to the dashboard instead of showing a broken page). The actual access control is
 *  server-side: instructor_dashboard_progress() rejects any caller whose email doesn't match, so
 *  this check being bypassed somehow still can't leak any data. */
function RequireInstructor({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <FullScreenLoader />;
  if (!isInstructor(auth.user?.email)) return <Navigate to="/" replace />;
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
 *  no changes to reflect real accounts. Also detects a different account signing in on this same
 *  browser (a shared-computer scenario) via syncIdentity() and resets the device-local fields
 *  (streak, achievements, learning-insight stats) so they never leak from one account to another. */
function SyncAuthToProgress() {
  const auth = useAuth();
  const progress = useProgress();

  useEffect(() => {
    if (!auth.user) return;
    const name =
      (auth.user.user_metadata?.full_name as string | undefined) ||
      auth.user.email?.split('@')[0] ||
      (auth.user.is_anonymous ? 'Guest' : 'Learner');
    progress.syncIdentity(auth.user.id, name);
    // progress.syncIdentity is stable (useCallback) and itself no-ops once nothing needs to change;
    // omitting it and `progress` from deps avoids re-running this every time unrelated progress
    // state changes, since only auth.user actually determines whether this should re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  return null;
}

/** Two-way sync with Supabase, entirely best-effort: nothing here ever blocks the UI or throws
 *  visibly, because the app must stay fully usable offline no matter what this does.
 *  - On sign-in, pull the account's remote snapshot once and fold it into local state.
 *  - On any local progress change, push after a short debounce (coalesces bursts like a fast lab run).
 *  - The instant the browser regains connectivity, push immediately instead of waiting on the debounce. */
function ProgressSync() {
  const auth = useAuth();
  const progress = useProgress();
  const pulledForUser = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!auth.user) {
      pulledForUser.current = null;
      return;
    }
    if (pulledForUser.current === auth.user.id) return;
    pulledForUser.current = auth.user.id;
    pullProgress(auth.user.id).then((remote) => {
      if (remote) progress.mergeFromRemote(remote);
    });
    // progress.mergeFromRemote is stable (useCallback), safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  const {
    completedLessons,
    labFlags,
    quizScores,
    bookmarkedLabs,
    labCompletedAt,
    completedCodeTasks,
    leaderboardOptIn,
    activityDates,
    codeTaskAttempts,
    codeTaskHintsUsed,
    codeTaskSolutionRevealed,
  } = progress;
  const syncableProgress = {
    completedLessons,
    labFlags,
    quizScores,
    bookmarkedLabs,
    labCompletedAt,
    completedCodeTasks,
    leaderboardOptIn,
    activityDates,
    codeTaskAttempts,
    codeTaskHintsUsed,
    codeTaskSolutionRevealed,
  };
  useEffect(() => {
    if (!auth.user) return;
    const userId = auth.user.id;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      if (navigator.onLine) pushProgressWithRetry(userId, syncableProgress);
    }, 2000);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, completedLessons, labFlags, quizScores, bookmarkedLabs, labCompletedAt, completedCodeTasks, leaderboardOptIn, activityDates, codeTaskAttempts, codeTaskHintsUsed, codeTaskSolutionRevealed]);

  useEffect(() => {
    if (!auth.user) return;
    const userId = auth.user.id;
    const onOnline = () => pushProgressWithRetry(userId, syncableProgress);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, completedLessons, labFlags, quizScores, bookmarkedLabs, labCompletedAt, completedCodeTasks, leaderboardOptIn, activityDates, codeTaskAttempts, codeTaskHintsUsed, codeTaskSolutionRevealed]);

  return null;
}

function LockPortraitOrientation() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
        const orientation = window.screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
        if (orientation && typeof orientation.lock === 'function') {
          orientation.lock('portrait').catch(() => {
            // Lock may be rejected if not in standalone / fullscreen mode — ignored safely
          });
        }
      }
    } catch {
      // Ignored if unsupported
    }
  }, []);

  return null;
}

function App() {
  const progress = useProgressState();
  const auth = useAuthState();

  return (
    <ProgressContext.Provider value={progress}>
      <AuthContext.Provider value={auth}>
        <LockPortraitOrientation />
        <SyncAuthToProgress />
        <ProgressSync />
        <InstallPrompt />
        <HashRouter>
          <Routes>
            <Route path="/welcome" element={<IntroPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              path="/code-portal"
              element={
                <RequireLogin>
                  <CodePortalPage />
                </RequireLogin>
              }
            />
            <Route
              path="/code-task/:taskId"
              element={
                <RequireLogin>
                  <CodeTaskPage />
                </RequireLogin>
              }
            />
            <Route
              path="/build-portal"
              element={
                <RequireLogin>
                  <BuildPortalPage />
                </RequireLogin>
              }
            />
            <Route
              path="/build-task/:taskId"
              element={
                <RequireLogin>
                  <ProjectTaskPage />
                </RequireLogin>
              }
            />
            <Route
              path="/se-verify"
              element={
                <RequireLogin>
                  <SeVerifyPage />
                </RequireLogin>
              }
            />
            <Route
              path="/library"
              element={
                <RequireLogin>
                  <LibraryPage />
                </RequireLogin>
              }
            />
            <Route
              path="/library/:bookId"
              element={
                <RequireLogin>
                  <BookReaderPage />
                </RequireLogin>
              }
            />
            <Route
              path="/ml-portal"
              element={
                <RequireLogin>
                  <MlPortalPage />
                </RequireLogin>
              }
            />
            <Route
              path="/ml-lesson/:lessonId"
              element={
                <RequireLogin>
                  <MlLessonPage />
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
              <Route path="/my-learning" element={<MyLearningPage />} />
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
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route
                path="/instructor"
                element={
                  <RequireInstructor>
                    <InstructorDashboardPage />
                  </RequireInstructor>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthContext.Provider>
    </ProgressContext.Provider>
  );
}

export default App;
