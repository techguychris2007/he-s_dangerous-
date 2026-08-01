import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface ProgressState {
  completedLessons: Record<string, boolean>;
  labFlags: Record<string, string[]>;
  quizScores: Record<string, number>;
  learnerName: string | null;
  bookmarkedLabs: Record<string, boolean>;
  /** epoch ms the moment each lab's flag count first reached its totalFlags — powers the mentor companion's pacing/speed flavor. */
  labCompletedAt: Record<string, number>;
  /** Code Portal practice tasks (Python/C++/JS) whose test harness has fully passed at least once. */
  completedCodeTasks: Record<string, boolean>;
  /** Local-date strings ("YYYY-MM-DD", learner's own timezone) on which at least one real learning
   *  action happened — the raw signal streaks are computed from. Deliberately device-local only
   *  (see SyncableProgress below): a synced streak would need a real backend clock and schema
   *  change neither of which this device-local, best-effort sync model is built for yet. */
  activityDates: string[];
  /** How many "Run tests" attempts a Code Portal task has had, win or lose — the raw signal behind
   *  "how many tries did this actually take," not just pass/fail. Device-local (see SyncableProgress). */
  codeTaskAttempts: Record<string, number>;
  /** The highest hint index ever revealed for a Code Portal task — a "0 hints" solve is a genuinely
   *  different learning outcome than a "needed all 3" one. Device-local (see SyncableProgress). */
  codeTaskHintsUsed: Record<string, number>;
  /** Whether the reference solution was ever opened for a task — device-local (see SyncableProgress). */
  codeTaskSolutionRevealed: Record<string, boolean>;
  /** Consent flag: whether this account's name + score should be visible to other learners on the
   *  real cross-account leaderboard. False by default — synced (unlike the fields above) since it's
   *  the actual access-control signal the leaderboard_entries() Supabase function filters on. */
  leaderboardOptIn: boolean;
  /** The Supabase user id last seen signing in on this browser — purely local bookkeeping, never
   *  synced. Lets syncIdentity() detect "a different account just signed in on this device" (a
   *  shared-computer scenario) and reset the device-local fields below instead of leaking the
   *  previous account's name/streak/achievements into the new session. */
  lastUserId: string | null;
}

/** The subset that's actually synced to Supabase — `learnerName` stays device-local since it's
 *  redundant with the account's own name/email once real accounts exist; `activityDates` and the
 *  three `codeTask*` learning-signal fields stay device-local because they're per-device engagement
 *  telemetry, not account data a second device needs to see (and syncing any of them would need a
 *  Supabase migration this change deliberately avoids requiring). `lastUserId` is local bookkeeping
 *  only and must never sync either. */
export type SyncableProgress = Omit<
  ProgressState,
  'learnerName' | 'activityDates' | 'codeTaskAttempts' | 'codeTaskHintsUsed' | 'codeTaskSolutionRevealed' | 'lastUserId'
>;

const STORAGE_KEY = 'hackerhub.progress.v1';
const EMPTY_STATE: ProgressState = {
  completedLessons: {},
  labFlags: {},
  quizScores: {},
  learnerName: null,
  bookmarkedLabs: {},
  labCompletedAt: {},
  completedCodeTasks: {},
  activityDates: [],
  codeTaskAttempts: {},
  codeTaskHintsUsed: {},
  codeTaskSolutionRevealed: {},
  leaderboardOptIn: false,
  lastUserId: null,
};

/** "YYYY-MM-DD" in the learner's own local timezone — deliberately not UTC, since a streak should
 *  track the day the learner actually experienced, not a timezone-shifted one. */
function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Appends today's date to activityDates if it isn't already the most recent entry — cheap
 *  no-op check first since this runs on every single progress-recording action. */
function withActivityToday(s: ProgressState): Pick<ProgressState, 'activityDates'> {
  const today = todayLocalDate();
  if (s.activityDates[s.activityDates.length - 1] === today) return { activityDates: s.activityDates };
  return { activityDates: [...s.activityDates, today] };
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE };
    return { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_STATE };
  }
}

interface ProgressApi extends ProgressState {
  completeLesson: (lessonId: string) => void;
  isLessonComplete: (lessonId: string) => boolean;
  captureFlag: (labId: string, flag: string) => void;
  hasFlag: (labId: string, flag: string) => boolean;
  flagCount: (labId: string) => number;
  recordQuizScore: (lessonId: string, score: number) => void;
  resetModuleProgress: (lessonIds: string[]) => void;
  /** Call once whenever a Supabase session becomes available, with a fallback display name derived
   *  from the account (real name or email prefix). If this is a different account than whichever
   *  one's data is currently sitting in this browser's device-local fields, those are reset first —
   *  see the `lastUserId` field doc for why. Safe to call on every render; no-ops once the account
   *  matches and a name is already set. */
  syncIdentity: (userId: string, fallbackName: string) => void;
  toggleBookmark: (labId: string) => void;
  isBookmarked: (labId: string) => boolean;
  markLabCompleted: (labId: string) => void;
  completeCodeTask: (taskId: string) => void;
  isCodeTaskComplete: (taskId: string) => boolean;
  recordCodeTaskAttempt: (taskId: string) => void;
  recordCodeTaskHintUsed: (taskId: string, hintIndex: number) => void;
  recordCodeTaskSolutionRevealed: (taskId: string) => void;
  setLeaderboardOptIn: (optIn: boolean) => void;
  /** Folds a remote snapshot into local state without ever losing progress on either side:
   *  flags/completions/bookmarks union, quiz scores take the higher value, completion
   *  timestamps take the earlier one. Safe to call with a partial/empty remote snapshot. */
  mergeFromRemote: (remote: Partial<SyncableProgress>) => void;
}

export const ProgressContext = createContext<ProgressApi | null>(null);

export function useProgressState(): ProgressApi {
  const [state, setState] = useState<ProgressState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completeLesson = useCallback((lessonId: string) => {
    setState((s) => ({ ...s, ...withActivityToday(s), completedLessons: { ...s.completedLessons, [lessonId]: true } }));
  }, []);

  const isLessonComplete = useCallback(
    (lessonId: string) => Boolean(state.completedLessons[lessonId]),
    [state.completedLessons],
  );

  const captureFlag = useCallback((labId: string, flag: string) => {
    setState((s) => {
      const existing = s.labFlags[labId] ?? [];
      if (existing.includes(flag)) return s;
      return { ...s, ...withActivityToday(s), labFlags: { ...s.labFlags, [labId]: [...existing, flag] } };
    });
  }, []);

  const hasFlag = useCallback(
    (labId: string, flag: string) => (state.labFlags[labId] ?? []).includes(flag),
    [state.labFlags],
  );

  const flagCount = useCallback((labId: string) => (state.labFlags[labId] ?? []).length, [state.labFlags]);

  const recordQuizScore = useCallback((lessonId: string, score: number) => {
    setState((s) => ({ ...s, ...withActivityToday(s), quizScores: { ...s.quizScores, [lessonId]: score } }));
  }, []);

  const resetModuleProgress = useCallback((lessonIds: string[]) => {
    setState((s) => {
      const completedLessons = { ...s.completedLessons };
      const quizScores = { ...s.quizScores };
      for (const id of lessonIds) {
        delete completedLessons[id];
        delete quizScores[id];
      }
      return { ...s, completedLessons, quizScores };
    });
  }, []);

  const syncIdentity = useCallback((userId: string, fallbackName: string) => {
    setState((s) => {
      if (s.lastUserId === userId) {
        // Same account as last time on this device — leave streak/achievements/etc. alone, only
        // backfill the name if it's somehow still empty.
        return s.learnerName ? s : { ...s, learnerName: fallbackName.trim() };
      }
      // Either the first sign-in ever on this browser, or a genuinely different account than
      // whichever one's local-only data is currently here (a shared-computer scenario) — either
      // way, the device-local fields should only ever reflect this account. Synced fields aren't
      // touched here since pullProgress()/mergeFromRemote() immediately overwrite them with this
      // account's real data right after this runs.
      return {
        ...s,
        lastUserId: userId,
        learnerName: fallbackName.trim(),
        activityDates: [],
        codeTaskAttempts: {},
        codeTaskHintsUsed: {},
        codeTaskSolutionRevealed: {},
      };
    });
  }, []);

  const toggleBookmark = useCallback((labId: string) => {
    setState((s) => ({ ...s, bookmarkedLabs: { ...s.bookmarkedLabs, [labId]: !s.bookmarkedLabs[labId] } }));
  }, []);

  const isBookmarked = useCallback((labId: string) => Boolean(state.bookmarkedLabs[labId]), [state.bookmarkedLabs]);

  const markLabCompleted = useCallback((labId: string) => {
    setState((s) => {
      if (s.labCompletedAt[labId]) return s;
      return { ...s, ...withActivityToday(s), labCompletedAt: { ...s.labCompletedAt, [labId]: Date.now() } };
    });
  }, []);

  const completeCodeTask = useCallback((taskId: string) => {
    setState((s) => (s.completedCodeTasks[taskId] ? s : { ...s, ...withActivityToday(s), completedCodeTasks: { ...s.completedCodeTasks, [taskId]: true } }));
  }, []);

  const isCodeTaskComplete = useCallback(
    (taskId: string) => Boolean(state.completedCodeTasks[taskId]),
    [state.completedCodeTasks],
  );

  const recordCodeTaskAttempt = useCallback((taskId: string) => {
    setState((s) => ({ ...s, ...withActivityToday(s), codeTaskAttempts: { ...s.codeTaskAttempts, [taskId]: (s.codeTaskAttempts[taskId] ?? 0) + 1 } }));
  }, []);

  const recordCodeTaskHintUsed = useCallback((taskId: string, hintIndex: number) => {
    setState((s) => {
      const current = s.codeTaskHintsUsed[taskId] ?? 0;
      if (hintIndex <= current) return s;
      return { ...s, codeTaskHintsUsed: { ...s.codeTaskHintsUsed, [taskId]: hintIndex } };
    });
  }, []);

  const recordCodeTaskSolutionRevealed = useCallback((taskId: string) => {
    setState((s) => (s.codeTaskSolutionRevealed[taskId] ? s : { ...s, codeTaskSolutionRevealed: { ...s.codeTaskSolutionRevealed, [taskId]: true } }));
  }, []);

  const setLeaderboardOptIn = useCallback((optIn: boolean) => {
    setState((s) => (s.leaderboardOptIn === optIn ? s : { ...s, leaderboardOptIn: optIn }));
  }, []);

  const mergeFromRemote = useCallback((remote: Partial<SyncableProgress>) => {
    setState((s) => {
      const completedLessons = { ...s.completedLessons };
      for (const [k, v] of Object.entries(remote.completedLessons ?? {})) if (v) completedLessons[k] = true;

      const labFlags = { ...s.labFlags };
      for (const [k, flags] of Object.entries(remote.labFlags ?? {})) {
        const existing = labFlags[k] ?? [];
        const merged = [...existing];
        for (const f of flags) if (!merged.includes(f)) merged.push(f);
        labFlags[k] = merged;
      }

      const quizScores = { ...s.quizScores };
      for (const [k, v] of Object.entries(remote.quizScores ?? {})) quizScores[k] = Math.max(quizScores[k] ?? 0, v);

      const bookmarkedLabs = { ...s.bookmarkedLabs };
      for (const [k, v] of Object.entries(remote.bookmarkedLabs ?? {})) if (v) bookmarkedLabs[k] = true;

      const labCompletedAt = { ...s.labCompletedAt };
      for (const [k, v] of Object.entries(remote.labCompletedAt ?? {})) {
        labCompletedAt[k] = labCompletedAt[k] ? Math.min(labCompletedAt[k], v) : v;
      }

      const completedCodeTasks = { ...s.completedCodeTasks };
      for (const [k, v] of Object.entries(remote.completedCodeTasks ?? {})) if (v) completedCodeTasks[k] = true;

      // Not a "union" like the maps above — it's a single consent flag, so the remote (last
      // synced) value wins if present at all; a local toggle after this pull re-pushes and stays
      // authoritative from then on.
      const leaderboardOptIn = remote.leaderboardOptIn ?? s.leaderboardOptIn;

      return { ...s, completedLessons, labFlags, quizScores, bookmarkedLabs, labCompletedAt, completedCodeTasks, leaderboardOptIn };
    });
  }, []);

  return useMemo(
    () => ({
      ...state,
      completeLesson,
      isLessonComplete,
      captureFlag,
      hasFlag,
      flagCount,
      recordQuizScore,
      resetModuleProgress,
      syncIdentity,
      toggleBookmark,
      isBookmarked,
      markLabCompleted,
      completeCodeTask,
      isCodeTaskComplete,
      recordCodeTaskAttempt,
      recordCodeTaskHintUsed,
      recordCodeTaskSolutionRevealed,
      setLeaderboardOptIn,
      mergeFromRemote,
    }),
    [
      state,
      completeLesson,
      isLessonComplete,
      captureFlag,
      hasFlag,
      flagCount,
      recordQuizScore,
      resetModuleProgress,
      syncIdentity,
      toggleBookmark,
      isBookmarked,
      markLabCompleted,
      completeCodeTask,
      isCodeTaskComplete,
      recordCodeTaskAttempt,
      recordCodeTaskHintUsed,
      recordCodeTaskSolutionRevealed,
      setLeaderboardOptIn,
      mergeFromRemote,
    ],
  );
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressContext.Provider');
  return ctx;
}
