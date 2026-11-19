import { LearningShell } from './layout/LearningNavigation';
import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import InstallPrompt from '../features/offline/components/InstallPrompt';
import { ProgressContext, useProgressState, useProgress } from '../features/progress/state/progressStore';
import { AuthContext, useAuthState, useAuth } from '../features/account/state/authStore';
import { pullProgress, pushProgressWithRetry } from '../features/progress/lib/progressSync';
import { isInstructor } from '../features/admin/lib/instructorConfig';
import { isAdmin } from '../features/admin/lib/adminConfig';
import { isOwnerEmail, setOwnerSession, useIsOwner } from '../features/account/lib/ownerAccess';
import { setSyncStatus } from '../features/progress/state/syncStatus';
import { enableOfflineCaching } from '../features/offline/state/pwa';
import { startAnalytics } from '../shared/lib/analytics';
import { loadOwnerContent, useOwnerContent } from '../features/account/lib/ownerContent';
import { PAID_PLANS_LIVE } from '../features/billing/lib/billing';

// Keep sign-in independent of the academy shell and curriculum downloads.
import LoginPage from '../features/account/pages/LoginPage';
import ResetPasswordPage from '../features/account/pages/ResetPasswordPage';

// ─── Lazily loaded: every app page (only parsed/executed when navigated to) ──
const AppLayout = lazy(() => import('./layout/AppLayout'));
const IntroPage = lazy(() => import('../features/marketing/pages/IntroPage'));
const HomePage = lazy(() => import('../features/curriculum/pages/HomePage'));
const ModulePage = lazy(() => import('../features/curriculum/pages/ModulePage'));
const LessonPage = lazy(() => import('../features/curriculum/pages/LessonPage'));
const LabPage = lazy(() => import('../features/labs/pages/LabPage'));
const LabsIndexPage = lazy(() => import('../features/labs/pages/LabsIndexPage'));
const RoadmapPage = lazy(() => import('../features/curriculum/pages/RoadmapPage'));
const MyLearningPage = lazy(() => import('../features/curriculum/pages/MyLearningPage'));
const ProgressPage = lazy(() => import('../features/progress/pages/ProgressPage'));
const MyTasksPage = lazy(() => import('../features/labs/pages/MyTasksPage'));
const SchedulePage = lazy(() => import('../features/curriculum/pages/SchedulePage'));
const LeaderboardPage = lazy(() => import('../features/progress/pages/LeaderboardPage'));
const ResourcesPage = lazy(() => import('../features/library/pages/ResourcesPage'));
const AnnouncementsPage = lazy(() => import('../features/support/pages/AnnouncementsPage'));
const ProfilePage = lazy(() => import('../features/account/pages/ProfilePage'));
const CertificatesPage = lazy(() => import('../features/progress/pages/CertificatesPage'));
const SecurityPage = lazy(() => import('../features/support/pages/SecurityPage'));
const HelpFaqPage = lazy(() => import('../features/support/pages/HelpFaqPage'));
const FeedbackPage = lazy(() => import('../features/support/pages/FeedbackPage'));
const SocPortalPage = lazy(() => import('../features/soc/pages/SocPortalPage'));
const SiemLabPage = lazy(() => import('../features/soc/pages/SiemLabPage'));
const CodePortalPage = lazy(() => import('../features/code-practice/pages/CodePortalPage'));
const CodeTaskPage = lazy(() => import('../features/code-practice/pages/CodeTaskPage'));
const BuildPortalPage = lazy(() => import('../features/code-practice/pages/BuildPortalPage'));
const ProjectTaskPage = lazy(() => import('../features/code-practice/pages/ProjectTaskPage'));
const SeVerifyPage = lazy(() => import('../features/code-practice/pages/SeVerifyPage'));
const MlPortalPage = lazy(() => import('../features/curriculum/pages/MlPortalPage'));
const MlLessonPage = lazy(() => import('../features/curriculum/pages/MlLessonPage'));
const LibraryPage = lazy(() => import('../features/library/pages/LibraryPage'));
const BookReaderPage = lazy(() => import('../features/library/pages/BookReaderPage'));
const InstructorDashboardPage = lazy(() => import('../features/admin/pages/InstructorDashboardPage'));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
const PricingPage = lazy(() => import('../features/billing/pages/PricingPage'));
const BillingPage = lazy(() => import('../features/billing/pages/BillingPage'));

// ─── Shared route-level spinner ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div role="status" aria-live="polite" className="min-h-[60vh] w-full flex flex-col gap-4 items-center justify-center">
      <div aria-hidden="true" className="w-6 h-6 rounded-full border-2 border-[#c9a15f] border-t-transparent animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-[var(--color-text-dim)]">Loading your workspace…</p>
    </div>
  );
}

/** Machine learning and Build (software engineering) portals: owner accounts only. */
function RequireOwner({ children }: { children: React.ReactNode }) {
  return useIsOwner() ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireLogin({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const ownerContent = useOwnerContent();
  if (auth.loading) return <FullScreenLoader />;
  if (!auth.user || auth.user.is_anonymous) return <Navigate to="/welcome" replace />;
  // Owner accounts wait for their private content so every page sees the full curriculum.
  const owner = isOwnerEmail(auth.user.email);
  if (owner && (ownerContent.status === 'idle' || ownerContent.status === 'loading')) return <FullScreenLoader />;
  return <>{children}{owner && ownerContent.status === 'unavailable' && <OwnerContentNotice message={ownerContent.error} />}</>;
}

function OwnerContentNotice({ message }: { message: string }) {
  return <div role="alert" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 60, maxWidth: 360, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-heading)', boxShadow: '0 12px 32px #0000003d', fontSize: 13, lineHeight: 1.5 }}>
    <strong>Machine learning, C# and software engineering content is unavailable.</strong> {message}{' '}
    <button type="button" onClick={() => void loadOwnerContent()} style={{ color: 'var(--color-accent)', fontWeight: 650 }}>Try again</button>
  </div>;
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

/** Route-level gate for the Admin Dashboard. UX only: admin_access() in
 *  supabase/migrations/0015_admin_dashboard.sql is what keeps the data from non-admins. */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) return <FullScreenLoader />;
  if (!isAdmin(auth.user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 10000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div role="status" className="min-h-screen w-full flex flex-col gap-4 items-center justify-center" style={{ background: '#0a1420' }}>
      <div aria-hidden="true" className="w-8 h-8 rounded-full border-2 border-[#c9a15f] border-t-transparent animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-[var(--chrome-text)]">Opening DarkWorld…</p>
      {slow && <div className="text-center text-sm text-[var(--chrome-text)]">
        <p>Opening your workspace is taking longer than usual. Check your connection.</p>
        <button type="button" className="mt-4 underline" onClick={() => window.location.reload()}>Retry opening DarkWorld</button>
      </div>}
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
  const owner = isOwnerEmail(auth.user?.email);
  setOwnerSession(owner);
  // Offline caching follows the account, but only once sign-in has resolved.
  useEffect(() => { if (!auth.loading) enableOfflineCaching(owner); }, [auth.loading, owner]);
  // Page-view analytics also waits for sign-in, so owner visits are never counted.
  useEffect(() => { if (!auth.loading) startAnalytics(owner); }, [auth.loading, owner]);
  useEffect(() => { if (!auth.loading && owner) void loadOwnerContent(); }, [auth.loading, owner]);

  return (
    <ProgressContext.Provider value={progress}>
      <AuthContext.Provider value={auth}>
        <SyncAuthToProgress />
        <ProgressSync />
        <InstallPrompt />
        <HashRouter>
          <Routes>
            <Route path="/welcome" element={<Suspense fallback={<FullScreenLoader />}><IntroPage /></Suspense>} />
            {/* Pricing and Billing exist only once paid plans are switched on (src/features/billing/lib/billing.ts). */}
            <Route path="/pricing" element={PAID_PLANS_LIVE ? <Suspense fallback={<FullScreenLoader />}><PricingPage /></Suspense> : <Navigate to="/welcome" replace />} />
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
                    <LearningShell><SiemLabPage /></LearningShell>
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
                    <LearningShell><CodeTaskPage /></LearningShell>
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/build-portal"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <RequireOwner><BuildPortalPage /></RequireOwner>
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/build-task/:taskId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <RequireOwner><LearningShell><ProjectTaskPage /></LearningShell></RequireOwner>
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/se-verify"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <RequireOwner><SeVerifyPage /></RequireOwner>
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
                    <LearningShell><BookReaderPage /></LearningShell>
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/ml-portal"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <RequireOwner><MlPortalPage /></RequireOwner>
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              path="/ml-lesson/:lessonId"
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}>
                    <RequireOwner><LearningShell><MlLessonPage /></LearningShell></RequireOwner>
                  </Suspense>
                </RequireLogin>
              }
            />
            <Route
              element={
                <RequireLogin>
                  <Suspense fallback={<PageLoader />}><AppLayout /></Suspense>
                </RequireLogin>
              }
            >
              {/* All routes inside AppLayout share one Suspense boundary — the page-transition
                  wrapper already handles enter animation, so a brief spinner on first nav is fine. */}
              <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
              <Route path="/my-learning" element={<Suspense fallback={<PageLoader />}><MyLearningPage /></Suspense>} />
              <Route path="/roadmap" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />
              <Route path="/progress" element={<Suspense fallback={<PageLoader />}><ProgressPage /></Suspense>} />
              <Route path="/certificates" element={<Suspense fallback={<PageLoader />}><CertificatesPage /></Suspense>} />
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
              <Route path="/billing" element={PAID_PLANS_LIVE ? <Suspense fallback={<PageLoader />}><BillingPage /></Suspense> : <Navigate to="/" replace />} />
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
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <Suspense fallback={<PageLoader />}>
                      <AdminDashboardPage />
                    </Suspense>
                  </RequireAdmin>
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
