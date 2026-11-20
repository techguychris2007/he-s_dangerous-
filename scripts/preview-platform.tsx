import InstallPrompt from '../src/features/offline/components/InstallPrompt';
// Development-only, in-memory learner fixture. This entry is not part of the production build.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import '../src/app/styles/index.css';
import { applyInitialTheme } from '../src/shared/state/theme';

applyInitialTheme();
import { AuthContext } from '../src/features/account/state/authStore';
import { ProgressContext, type ProgressApi, type ProgressState } from '../src/features/progress/state/progressStore';
import AppLayout from '../src/app/layout/AppLayout';
import HomePage from '../src/features/curriculum/pages/HomePage';
import RoadmapPage from '../src/features/curriculum/pages/RoadmapPage';
import ModulePage from '../src/features/curriculum/pages/ModulePage';
import LessonPage from '../src/features/curriculum/pages/LessonPage';
import LabPage from '../src/features/labs/pages/LabPage';
import LabsIndexPage from '../src/features/labs/pages/LabsIndexPage';
import SiemLabPage from '../src/features/soc/pages/SiemLabPage';
import ProfilePage from '../src/features/account/pages/ProfilePage';
import MyLearningPage from '../src/features/curriculum/pages/MyLearningPage';
import ResourcesPage from '../src/features/library/pages/ResourcesPage';
import LibraryPage from '../src/features/library/pages/LibraryPage';
import MyTasksPage from '../src/features/labs/pages/MyTasksPage';
import ProgressPage from '../src/features/progress/pages/ProgressPage';
import '../src/app/styles/academy-system.css';

import CodePortalPage from '../src/features/code-practice/pages/CodePortalPage';

import CodeTaskPage from '../src/features/code-practice/pages/CodeTaskPage';

import MlPortalPage from '../src/features/curriculum/pages/MlPortalPage';

import MlLessonPage from '../src/features/curriculum/pages/MlLessonPage';

import SocPortalPage from '../src/features/soc/pages/SocPortalPage';

import BuildPortalPage from '../src/features/code-practice/pages/BuildPortalPage';

import ProjectTaskPage from '../src/features/code-practice/pages/ProjectTaskPage';

import BookReaderPage from '../src/features/library/pages/BookReaderPage';

import LeaderboardPage from '../src/features/progress/pages/LeaderboardPage';

import SchedulePage from '../src/features/curriculum/pages/SchedulePage';

import AnnouncementsPage from '../src/features/support/pages/AnnouncementsPage';

import SecurityPage from '../src/features/support/pages/SecurityPage';

import HelpFaqPage from '../src/features/support/pages/HelpFaqPage';

import FeedbackPage from '../src/features/support/pages/FeedbackPage';

import IntroPage from '../src/features/marketing/pages/IntroPage';

import LoginPage from '../src/features/account/pages/LoginPage';

import ResetPasswordPage from '../src/features/account/pages/ResetPasswordPage';

export function Preview() {
  const [state, setState] = useState<ProgressState>({ completedLessons: {}, labFlags: {}, quizScores: {}, learnerName: 'Preview Learner', bookmarkedLabs: {}, labCompletedAt: {}, completedCodeTasks: {}, activityDates: [], codeTaskAttempts: {}, codeTaskHintsUsed: {}, codeTaskSolutionRevealed: {}, leaderboardOptIn: false, lastUserId: 'local-preview' });
  const progress: ProgressApi = {
    ...state,
    completeLesson: id => setState(s => ({ ...s, completedLessons: { ...s.completedLessons, [id]: true } })),
    isLessonComplete: id => Boolean(state.completedLessons[id]),
    captureFlag: (id, flag) => setState(s => ({ ...s, labFlags: { ...s.labFlags, [id]: [...new Set([...(s.labFlags[id] ?? []), flag])] } })),
    hasFlag: (id, flag) => Boolean(state.labFlags[id]?.includes(flag)), flagCount: id => state.labFlags[id]?.length ?? 0,
    recordQuizScore: (id, score) => setState(s => ({ ...s, quizScores: { ...s.quizScores, [id]: score } })),
    resetModuleProgress: () => {}, syncIdentity: () => {}, toggleBookmark: id => setState(s => ({ ...s, bookmarkedLabs: { ...s.bookmarkedLabs, [id]: !s.bookmarkedLabs[id] } })), isBookmarked: id => Boolean(state.bookmarkedLabs[id]),
    markLabCompleted: id => setState(s => s.labCompletedAt[id] ? s : ({ ...s, labCompletedAt: { ...s.labCompletedAt, [id]: Date.now() } })), completeCodeTask: () => {}, isCodeTaskComplete: () => false, recordCodeTaskAttempt: () => {}, recordCodeTaskHintUsed: () => {}, recordCodeTaskSolutionRevealed: () => {}, setLeaderboardOptIn: () => {}, mergeFromRemote: () => {},
  };
  const noop = async () => ({ error: null });
  const publicPreview = new URLSearchParams(window.location.search).get('public') === '1';
  const auth = { user: publicPreview ? null : { id: 'local-preview', email: 'learner@example.test', user_metadata: {}, app_metadata: {}, email_confirmed_at: '2026-10-05T00:00:00Z' }, session: null, isGuest: false, loading: false, signUp: async () => ({ error: null, needsEmailConfirm: false }), signIn: noop, signInAsGuest: noop, upgradeGuestAccount: noop, signOut: async () => {}, sendPasswordReset: noop, updatePassword: noop };
  return <AuthContext.Provider value={auth as any}><ProgressContext.Provider value={progress}><HashRouter><InstallPrompt/><Routes><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/welcome" element={<IntroPage />} /><Route path="/library" element={<LibraryPage />} /><Route path="/code-portal" element={<CodePortalPage />} /><Route path="/code-task/:taskId" element={<CodeTaskPage />} /><Route path="/ml-portal" element={<MlPortalPage />} /><Route path="/ml-lesson/:lessonId" element={<MlLessonPage />} /><Route path="/soc-portal" element={<SocPortalPage />} /><Route path="/build-portal" element={<BuildPortalPage />} /><Route path="/build-task/:taskId" element={<ProjectTaskPage />} /><Route path="/library/:bookId" element={<BookReaderPage />} /><Route element={<AppLayout />}><Route path="/" element={<HomePage />} /><Route path="/roadmap" element={<RoadmapPage />} /><Route path="/module/:moduleSlug" element={<ModulePage />} /><Route path="/module/:moduleSlug/lesson/:lessonSlug" element={<LessonPage />} /><Route path="/lab/:labSlug" element={<LabPage />} /><Route path="/siem-lab/:labId" element={<SiemLabPage />} /><Route path="/labs" element={<LabsIndexPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/my-learning" element={<MyLearningPage />} /><Route path="/resources" element={<ResourcesPage />} /><Route path="/tasks" element={<MyTasksPage />} /><Route path="/progress" element={<ProgressPage />} /><Route path="/leaderboard" element={<LeaderboardPage />} /><Route path="/schedule" element={<SchedulePage />} /><Route path="/announcements" element={<AnnouncementsPage />} /><Route path="/security" element={<SecurityPage />} /><Route path="/help" element={<HelpFaqPage />} /><Route path="/feedback" element={<FeedbackPage />} /><Route path="*" element={<Navigate to="/roadmap" />} /></Route></Routes></HashRouter></ProgressContext.Provider></AuthContext.Provider>;
}
const previewRoot = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
previewRoot.render(<Preview />);
if (import.meta.hot) {
  import.meta.hot.data.root = previewRoot;
  import.meta.hot.accept();
}
