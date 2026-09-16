import { lazy, Suspense, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import InstallPrompt from './components/layout/InstallPrompt';
import { ProgressContext, useProgressState, useProgress } from './state/progressStore';
import { AuthContext, useAuthState, useAuth } from './state/authStore';
import { pullProgress, pushProgressWithRetry } from './lib/progressSync';
import { isInstructor } from './lib/instructorConfig';

// ─── Eagerly loaded: auth flow + shell pages needed on first render ──────────
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import IntroPage from './pages/IntroPage';

// ─── Lazily loaded: every app page (only parsed/executed when navigated to) ──
const HomePage = lazy(() => import('./pages/HomePage'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const LabsIndexPage = lazy(() => import('./pages/LabsIndexPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const MyLearningPage = lazy(() => import('./pages/MyLearningPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const MyTasksPage = lazy(() => import('./pages/MyTasksPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const HelpFaqPage = lazy(() => import('./pages/HelpFaqPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const SocPortalPage = lazy(() => import('./pages/SocPortalPage'));
const SiemLabPage = lazy(() => import('./pages/SiemLabPage'));
const CodePortalPage = lazy(() => import('./pages/CodePortalPage'));
const CodeTaskPage = lazy(() => import('./pages/CodeTaskPage'));
const BuildPortalPage = lazy(() => import('./pages/BuildPortalPage'));
const ProjectTaskPage = lazy(() => import('./pages/ProjectTaskPage'));
const SeVerifyPage = lazy(() => import('./pages/SeVerifyPage'));
const MlPortalPage = lazy(() => import('./pages/MlPortalPage'));
const MlLessonPage = lazy(() => import('./pages/MlLessonPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const BookReaderPage = lazy(() => import('./pages/BookReaderPage'));
const InstructorDashboardPage = lazy(() => import('./pages/InstructorDashboardPage'));

// ─── Shared route-level spinner ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#c9a15f] border-t-transparent animate-spin" />
    </div>
  );
}

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
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches &&
        'screen' in window &&
        'orientation' in window.screen
      ) {
        const orientation = window.screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
        if (orientation && typeof orientation.lock === 'function') {
          orientation.lock('portrait').catch(() => {});
        }
      }
    } catch {
      // Handled safely
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
                  <Suspense fallback={<PageLoader />}>
                    <SocPortalPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/siem-lab/:labId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <SiemLabPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/code-portal"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <CodePortalPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/code-task/:taskId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <CodeTaskPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/build-portal"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <BuildPortalPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/build-task/:taskId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <ProjectTaskPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/se-verify"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <SeVerifyPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/library"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <LibraryPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/library/:bookId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <BookReaderPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/ml-portal"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <MlPortalPage />
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/ml-lesson/:lessonId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <MlLessonPage />
                  </Suspense>
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
              {/* All routes inside AppLayout share one Suspense boundary — the page-transition
                  wrapper already handles enter animation, so a brief spinner on first nav is fine. */}
              <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
              <Route path="/my-learning" element={<Suspense fallback={<PageLoader />}><MyLearningPage /></Suspense>} />
              <Route path="/roadmap" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />
              <Route path="/progress" element={<Suspense fallback={<PageLoader />}><ProgressPage /></Suspense>} />
              <Route path="/module/:moduleSlug" element={<Suspense fallback={<PageLoader />}><ModulePage /></Suspense>} />
              <Route path="/module/:moduleSlug/lesson/:lessonSlug" element={<Suspense fallback={<PageLoader />}><LessonPage /></Suspense>} />
              <Route path="/labs" element={<Suspense fallback={<PageLoader />}><LabsIndexPage /></Suspense>} />
              <Route path="/lab/:labSlug" element={<Suspense fallback={<PageLoader />}><LabPage /></Suspense>} />
              <Route path="/tasks" element={<Suspense fallback={<PageLoader />}><MyTasksPage /></Suspense>} />
              <Route path="/schedule" element={<Suspense fallback={<PageLoader />}><SchedulePage /></Suspense>} />
              <Route path="/leaderboard" element={<Suspense fallback={<PageLoader />}><LeaderboardPage /></Suspense>} />
              <Route path="/resources" element={<Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense>} />
              <Route path="/announcements" element={<Suspense fallback={<PageLoader />}><AnnouncementsPage /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
              <Route path="/security" element={<Suspense fallback={<PageLoader />}><SecurityPage /></Suspense>} />
              <Route path="/help" element={<Suspense fallback={<PageLoader />}><HelpFaqPage /></Suspense>} />
              <Route path="/feedback" element={<Suspense fallback={<PageLoader />}><FeedbackPage /></Suspense>} />
              <Route
                path="/instructor"
                element={
                  <RequireInstructor>
                    <Suspense fallback={<PageLoader />}>
                      <InstructorDashboardPage />
                    </Suspense>
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
