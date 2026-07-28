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
}

/** The subset that's actually synced to Supabase — `learnerName` stays device-local since it's
 *  redundant with the account's own name/email once real accounts exist. */
export type SyncableProgress = Omit<ProgressState, 'learnerName'>;

const STORAGE_KEY = 'hackerhub.progress.v1';
const EMPTY_STATE: ProgressState = {
  completedLessons: {},
  labFlags: {},
  quizScores: {},
  learnerName: null,
  bookmarkedLabs: {},
  labCompletedAt: {},
  completedCodeTasks: {},
};

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
  resetAll: () => void;
  resetModuleProgress: (lessonIds: string[]) => void;
  login: (name: string) => void;
  logout: () => void;
  toggleBookmark: (labId: string) => void;
  isBookmarked: (labId: string) => boolean;
  markLabCompleted: (labId: string) => void;
  completeCodeTask: (taskId: string) => void;
  isCodeTaskComplete: (taskId: string) => boolean;
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
    setState((s) => ({ ...s, completedLessons: { ...s.completedLessons, [lessonId]: true } }));
  }, []);

  const isLessonComplete = useCallback(
    (lessonId: string) => Boolean(state.completedLessons[lessonId]),
    [state.completedLessons],
  );

  const captureFlag = useCallback((labId: string, flag: string) => {
    setState((s) => {
      const existing = s.labFlags[labId] ?? [];
      if (existing.includes(flag)) return s;
      return { ...s, labFlags: { ...s.labFlags, [labId]: [...existing, flag] } };
    });
  }, []);

  const hasFlag = useCallback(
    (labId: string, flag: string) => (state.labFlags[labId] ?? []).includes(flag),
    [state.labFlags],
  );

  const flagCount = useCallback((labId: string) => (state.labFlags[labId] ?? []).length, [state.labFlags]);

  const recordQuizScore = useCallback((lessonId: string, score: number) => {
    setState((s) => ({ ...s, quizScores: { ...s.quizScores, [lessonId]: score } }));
  }, []);

  const resetAll = useCallback(() => {
    setState((s) => ({ ...EMPTY_STATE, learnerName: s.learnerName }));
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

  const login = useCallback((name: string) => {
    setState((s) => ({ ...s, learnerName: name.trim() }));
  }, []);

  const logout = useCallback(() => {
    setState({ ...EMPTY_STATE });
  }, []);

  const toggleBookmark = useCallback((labId: string) => {
    setState((s) => ({ ...s, bookmarkedLabs: { ...s.bookmarkedLabs, [labId]: !s.bookmarkedLabs[labId] } }));
  }, []);

  const isBookmarked = useCallback((labId: string) => Boolean(state.bookmarkedLabs[labId]), [state.bookmarkedLabs]);

  const markLabCompleted = useCallback((labId: string) => {
    setState((s) => {
      if (s.labCompletedAt[labId]) return s;
      return { ...s, labCompletedAt: { ...s.labCompletedAt, [labId]: Date.now() } };
    });
  }, []);

  const completeCodeTask = useCallback((taskId: string) => {
    setState((s) => (s.completedCodeTasks[taskId] ? s : { ...s, completedCodeTasks: { ...s.completedCodeTasks, [taskId]: true } }));
  }, []);

  const isCodeTaskComplete = useCallback(
    (taskId: string) => Boolean(state.completedCodeTasks[taskId]),
    [state.completedCodeTasks],
  );

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

      return { ...s, completedLessons, labFlags, quizScores, bookmarkedLabs, labCompletedAt, completedCodeTasks };
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
      resetAll,
      resetModuleProgress,
      login,
      logout,
      toggleBookmark,
      isBookmarked,
      markLabCompleted,
      completeCodeTask,
      isCodeTaskComplete,
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
      resetAll,
      resetModuleProgress,
      login,
      logout,
      toggleBookmark,
      isBookmarked,
      markLabCompleted,
      completeCodeTask,
      isCodeTaskComplete,
      mergeFromRemote,
    ],
  );
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressContext.Provider');
  return ctx;
}
