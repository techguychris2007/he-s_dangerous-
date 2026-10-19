import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import InstallPrompt from './components/layout/InstallPrompt';
import { ProgressContext, useProgressState, useProgress } from './state/progressStore';
import { AuthContext, useAuthState, useAuth } from './state/authStore';
import { pullProgress, pushProgressWithRetry } from './lib/progressSync';
import { isInstructor } from './lib/instructorConfig';
import { setSyncStatus } from './state/syncStatus';

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
    <div role="status" aria-live="polite" className="min-h-[60vh] w-full flex flex-col gap-4 items-center justify-center">
      <div aria-hidden="true" className="w-6 h-6 rounded-full border-2 border-[#c9a15f] border-t-transparent animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-[var(--color-text-dim)]">Loading your workspace…</p>
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
  if (!isInstructor(auth.user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div role="status" className="min-h-screen w-full flex flex-col gap-4 items-center justify-center" style={{ background: '#0a1420' }}>
      <div aria-hidden="true" className="w-8 h-8 rounded-full border-2 border-[#c9a15f] border-t-transparent animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-slate-300">Opening DarkWorld…</p>
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
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const userId = auth.user?.id;

  useEffect(() => {
    setReadyUserId(null);
    if (!userId || progress.lastUserId !== userId) { setSyncStatus('idle'); return; }
    let cancelled = false;
    let loading = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
      const hydrate = async () => {
        if (cancelled || loading) return;
        clearTimeout(retry);
      loading = true;
      setReadyUserId(null);
      setSyncStatus(navigator.onLine ? 'loading' : 'local');
      try {
        if (!navigator.onLine) throw new Error('Offline');
        const remote = await pullProgress(userId);
        if (cancelled) return;
        if (remote) progress.mergeFromRemote(remote);
        setReadyUserId(userId);
        setSyncStatus('saved');
      } catch {
        if (!cancelled) { setSyncStatus('local'); retry = setTimeout(hydrate, 15000); }
      } finally { loading = false; }
    };
    void hydrate();
    window.addEventListener('online', hydrate);
    return () => { cancelled = true; clearTimeout(retry); window.removeEventListener('online', hydrate); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, progress.lastUserId]);

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
    if (!userId || readyUserId !== userId || progress.lastUserId !== userId) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!navigator.onLine) { setSyncStatus('local'); return; }
      setSyncStatus('saving');
      try {
        const saved = await pushProgressWithRetry(userId, syncableProgress, 2, 4000, controller.signal);
        if (!controller.signal.aborted) setSyncStatus(saved ? 'saved' : 'local');
      } catch { if (!controller.signal.aborted) setSyncStatus('local'); }
    }, 2000);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, readyUserId, progress.lastUserId, completedLessons, labFlags, quizScores, bookmarkedLabs, labCompletedAt, completedCodeTasks, leaderboardOptIn, activityDates, codeTaskAttempts, codeTaskHintsUsed, codeTaskSolutionRevealed]);

  return null;
}

function App() {
  const progress = useProgressState();
  const auth = useAuthState();

  return (
    <ProgressContext.Provider value={progress}>
      <AuthContext.Provider value={auth}>
        <SyncAuthToProgress />
        <ProgressSync />
        {auth.user && <InstallPrompt />}
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
