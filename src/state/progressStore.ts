import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface ProgressState {
  completedLessons: Record<string, boolean>;
  labFlags: Record<string, string[]>;
  quizScores: Record<string, number>;
  learnerName: string | null;
  bookmarkedLabs: Record<string, boolean>;
}

const STORAGE_KEY = 'hackerhub.progress.v1';
const EMPTY_STATE: ProgressState = { completedLessons: {}, labFlags: {}, quizScores: {}, learnerName: null, bookmarkedLabs: {} };

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
    }),
    [state, completeLesson, isLessonComplete, captureFlag, hasFlag, flagCount, recordQuizScore, resetAll, resetModuleProgress, login, logout, toggleBookmark, isBookmarked],
  );
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressContext.Provider');
  return ctx;
}
