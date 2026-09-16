import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

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
   *  action happened — the raw signal streaks are computed from. Synced (see SyncableProgress below)
   *  so a streak survives switching devices instead of silently resetting on a new browser. */
  activityDates: string[];
  /** How many "Run tests" attempts a Code Portal task has had, win or lose — the raw signal behind
   *  "how many tries did this actually take," not just pass/fail. Synced (see SyncableProgress). */
  codeTaskAttempts: Record<string, number>;
  /** The highest hint index ever revealed for a Code Portal task — a "0 hints" solve is a genuinely
   *  different learning outcome than a "needed all 3" one. Synced (see SyncableProgress). */
  codeTaskHintsUsed: Record<string, number>;
  /** Whether the reference solution was ever opened for a task — synced (see SyncableProgress). */
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

export type SyncableProgress = Omit<ProgressState, 'learnerName' | 'lastUserId'>;

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

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// ─── External Store for Fine-Grained Reactive Subscriptions ──────────────────
let currentState: ProgressState = loadState();
const listeners = new Set<() => void>();

function emitChange() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch {
    // Ignore storage quota issues
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ProgressState {
  return currentState;
}

function updateState(updater: (prev: ProgressState) => ProgressState) {
  const next = updater(currentState);
  if (next !== currentState) {
    currentState = next;
    emitChange();
  }
}

// ─── Action Functions (Stable References) ────────────────────────────────────
export const progressActions = {
  completeLesson: (lessonId: string) => {
    updateState((s) => ({
      ...s,
      ...withActivityToday(s),
      completedLessons: { ...s.completedLessons, [lessonId]: true },
    }));
  },
  captureFlag: (labId: string, flag: string) => {
    updateState((s) => {
      const existing = s.labFlags[labId] ?? [];
      if (existing.includes(flag)) return s;
      return { ...s, ...withActivityToday(s), labFlags: { ...s.labFlags, [labId]: [...existing, flag] } };
    });
  },
  recordQuizScore: (lessonId: string, score: number) => {
    updateState((s) => ({ ...s, ...withActivityToday(s), quizScores: { ...s.quizScores, [lessonId]: score } }));
  },
  resetModuleProgress: (lessonIds: string[]) => {
    updateState((s) => {
      const completedLessons = { ...s.completedLessons };
      const quizScores = { ...s.quizScores };
      for (const id of lessonIds) {
        delete completedLessons[id];
        delete quizScores[id];
      }
      return { ...s, completedLessons, quizScores };
    });
  },
  syncIdentity: (userId: string, fallbackName: string) => {
    updateState((s) => {
      if (s.lastUserId === userId) {
        return s.learnerName ? s : { ...s, learnerName: fallbackName.trim() };
      }
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
  },
  toggleBookmark: (labId: string) => {
    updateState((s) => ({ ...s, bookmarkedLabs: { ...s.bookmarkedLabs, [labId]: !s.bookmarkedLabs[labId] } }));
  },
  markLabCompleted: (labId: string) => {
    updateState((s) => {
      if (s.labCompletedAt[labId]) return s;
      return { ...s, ...withActivityToday(s), labCompletedAt: { ...s.labCompletedAt, [labId]: Date.now() } };
    });
  },
  completeCodeTask: (taskId: string) => {
    updateState((s) =>
      s.completedCodeTasks[taskId]
        ? s
        : { ...s, ...withActivityToday(s), completedCodeTasks: { ...s.completedCodeTasks, [taskId]: true } },
    );
  },
  recordCodeTaskAttempt: (taskId: string) => {
    updateState((s) => ({
      ...s,
      ...withActivityToday(s),
      codeTaskAttempts: { ...s.codeTaskAttempts, [taskId]: (s.codeTaskAttempts[taskId] ?? 0) + 1 },
    }));
  },
  recordCodeTaskHintUsed: (taskId: string, hintIndex: number) => {
    updateState((s) => {
      const current = s.codeTaskHintsUsed[taskId] ?? 0;
      if (hintIndex <= current) return s;
      return { ...s, codeTaskHintsUsed: { ...s.codeTaskHintsUsed, [taskId]: hintIndex } };
    });
  },
  recordCodeTaskSolutionRevealed: (taskId: string) => {
    updateState((s) =>
      s.codeTaskSolutionRevealed[taskId]
        ? s
        : { ...s, codeTaskSolutionRevealed: { ...s.codeTaskSolutionRevealed, [taskId]: true } },
    );
  },
  setLeaderboardOptIn: (optIn: boolean) => {
    updateState((s) => (s.leaderboardOptIn === optIn ? s : { ...s, leaderboardOptIn: optIn }));
  },
  mergeFromRemote: (remote: Partial<SyncableProgress>) => {
    updateState((s) => {
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

      const activityDates = [...new Set([...s.activityDates, ...(remote.activityDates ?? [])])].sort();

      const codeTaskAttempts = { ...s.codeTaskAttempts };
      for (const [k, v] of Object.entries(remote.codeTaskAttempts ?? {}))
        codeTaskAttempts[k] = Math.max(codeTaskAttempts[k] ?? 0, v);

      const codeTaskHintsUsed = { ...s.codeTaskHintsUsed };
      for (const [k, v] of Object.entries(remote.codeTaskHintsUsed ?? {}))
        codeTaskHintsUsed[k] = Math.max(codeTaskHintsUsed[k] ?? 0, v);

      const codeTaskSolutionRevealed = { ...s.codeTaskSolutionRevealed };
      for (const [k, v] of Object.entries(remote.codeTaskSolutionRevealed ?? {}))
        if (v) codeTaskSolutionRevealed[k] = true;

      const leaderboardOptIn = remote.leaderboardOptIn ?? s.leaderboardOptIn;

      return {
        ...s,
        completedLessons,
        labFlags,
        quizScores,
        bookmarkedLabs,
        labCompletedAt,
        completedCodeTasks,
        activityDates,
        codeTaskAttempts,
        codeTaskHintsUsed,
        codeTaskSolutionRevealed,
        leaderboardOptIn,
      };
    });
  },
};

export interface ProgressApi extends ProgressState {
  completeLesson: (lessonId: string) => void;
  isLessonComplete: (lessonId: string) => boolean;
  captureFlag: (labId: string, flag: string) => void;
  hasFlag: (labId: string, flag: string) => boolean;
  flagCount: (labId: string) => number;
  recordQuizScore: (lessonId: string, score: number) => void;
  resetModuleProgress: (lessonIds: string[]) => void;
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
  mergeFromRemote: (remote: Partial<SyncableProgress>) => void;
}

export const ProgressContext = createContext<ProgressApi | null>(null);

/** Hook to initialize the app-level state provider */
export function useProgressState(): ProgressApi {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isLessonComplete = useCallback((lessonId: string) => Boolean(state.completedLessons[lessonId]), [state.completedLessons]);
  const hasFlag = useCallback((labId: string, flag: string) => (state.labFlags[labId] ?? []).includes(flag), [state.labFlags]);
  const flagCount = useCallback((labId: string) => (state.labFlags[labId] ?? []).length, [state.labFlags]);
  const isBookmarked = useCallback((labId: string) => Boolean(state.bookmarkedLabs[labId]), [state.bookmarkedLabs]);
  const isCodeTaskComplete = useCallback((taskId: string) => Boolean(state.completedCodeTasks[taskId]), [state.completedCodeTasks]);

  return useMemo(
    () => ({
      ...state,
      ...progressActions,
      isLessonComplete,
      hasFlag,
      flagCount,
      isBookmarked,
      isCodeTaskComplete,
    }),
    [state, isLessonComplete, hasFlag, flagCount, isBookmarked, isCodeTaskComplete],
  );
}

/** Legacy / Full Progress hook (for full dashboard/summary views) */
export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (ctx) return ctx;
  // Fallback direct store access if used outside context
  return {
    ...currentState,
    ...progressActions,
    isLessonComplete: (id) => Boolean(currentState.completedLessons[id]),
    hasFlag: (labId, flag) => (currentState.labFlags[labId] ?? []).includes(flag),
    flagCount: (labId) => (currentState.labFlags[labId] ?? []).length,
    isBookmarked: (labId) => Boolean(currentState.bookmarkedLabs[labId]),
    isCodeTaskComplete: (taskId) => Boolean(currentState.completedCodeTasks[taskId]),
  };
}

/** Stable action functions that never cause re-renders when passed as callbacks */
export function useProgressActions() {
  return progressActions;
}

/** Fine-grained selector hook: only re-renders when the selected primitive or value changes */
export function useProgressSelector<T>(selector: (state: ProgressState) => T): T {
  const slice = useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
  return slice;
}

/** Fine-grained hook for individual LabCard components — ONLY re-renders when this specific lab changes */
export function useLabProgress(labId: string) {
  const flags = useSyncExternalStore(
    subscribe,
    () => currentState.labFlags[labId] ?? [],
    () => currentState.labFlags[labId] ?? [],
  );

  const isBookmarked = useSyncExternalStore(
    subscribe,
    () => Boolean(currentState.bookmarkedLabs[labId]),
    () => Boolean(currentState.bookmarkedLabs[labId]),
  );

  return {
    flagCount: flags.length,
    flags,
    isBookmarked,
  };
}

/** Fine-grained hook for lesson items */
export function useLessonProgress(lessonId: string) {
  return useSyncExternalStore(
    subscribe,
    () => Boolean(currentState.completedLessons[lessonId]),
    () => Boolean(currentState.completedLessons[lessonId]),
  );
}
