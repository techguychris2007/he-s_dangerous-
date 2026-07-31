import type { ProgressState } from '../state/progressStore';
import { LABS, LAB_CATEGORIES, labsForCategory, findLab } from './labs';

/** Every quantity here is derived live from existing progress state on every render — nothing new
 *  is persisted except `activityDates` (see progressStore.ts), so this whole system ships with zero
 *  Supabase schema change and can never drift out of sync with the stats it's built on. */

export interface StreakInfo {
  /** consecutive days of activity ending today or yesterday — 0 if the streak is already broken */
  current: number;
  /** the longest run of consecutive-day activity this learner has ever had, even if broken now */
  longest: number;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86_400_000);
}

export function computeStreak(activityDates: string[]): StreakInfo {
  if (activityDates.length === 0) return { current: 0, longest: 0 };
  const sorted = [...new Set(activityDates)].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = daysBetween(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const lastActive = sorted[sorted.length - 1];
  const gapFromToday = daysBetween(lastActive, today);
  // A streak survives through "haven't logged in yet today" (gap 1) but breaks once a full day was
  // skipped (gap 2+) — the same grace real streak features (Duolingo etc.) give.
  if (gapFromToday > 1) return { current: 0, longest };

  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    if (daysBetween(sorted[i - 1], sorted[i]) === 1) current++;
    else break;
  }
  return { current, longest };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: (progress: ProgressState) => boolean;
}

function labsCompletedCount(progress: ProgressState): number {
  return Object.keys(progress.labCompletedAt).length;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Capture your first flag.',
    icon: '🚩',
    isUnlocked: (p) => Object.values(p.labFlags).some((flags) => flags.length > 0),
  },
  {
    id: 'first-lesson',
    title: 'Getting Started',
    description: 'Complete your first lesson.',
    icon: '📖',
    isUnlocked: (p) => Object.values(p.completedLessons).some(Boolean),
  },
  {
    id: 'ten-labs',
    title: 'Script Kiddie No More',
    description: 'Fully complete 10 labs.',
    icon: '🎯',
    isUnlocked: (p) => labsCompletedCount(p) >= 10,
  },
  {
    id: 'fifty-labs',
    title: 'Half Century',
    description: 'Fully complete 50 labs.',
    icon: '🏆',
    isUnlocked: (p) => labsCompletedCount(p) >= 50,
  },
  {
    id: 'hundred-labs',
    title: 'Centurion',
    description: 'Fully complete 100 labs.',
    icon: '👑',
    isUnlocked: (p) => labsCompletedCount(p) >= 100,
  },
  {
    id: 'coder',
    title: 'Coder',
    description: 'Pass 10 Code Portal exercises.',
    icon: '💻',
    isUnlocked: (p) => Object.values(p.completedCodeTasks).filter(Boolean).length >= 10,
  },
  {
    id: 'master-coder',
    title: 'Master Coder',
    description: 'Pass 50 Code Portal exercises.',
    icon: '🧠',
    isUnlocked: (p) => Object.values(p.completedCodeTasks).filter(Boolean).length >= 50,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz.',
    icon: '💯',
    isUnlocked: (p) => Object.values(p.quizScores).some((s) => s >= 100),
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Complete 10 lesson quizzes.',
    icon: '🎓',
    isUnlocked: (p) => Object.keys(p.quizScores).length >= 10,
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Bookmark 5 labs to revisit.',
    icon: '🔖',
    isUnlocked: (p) => Object.values(p.bookmarkedLabs).filter(Boolean).length >= 5,
  },
  {
    id: 'on-fire',
    title: 'On Fire',
    description: 'Reach a 3-day activity streak.',
    icon: '🔥',
    isUnlocked: (p) => computeStreak(p.activityDates).longest >= 3,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Reach a 7-day activity streak.',
    icon: '⚡',
    isUnlocked: (p) => computeStreak(p.activityDates).longest >= 7,
  },
  {
    id: 'legendary',
    title: 'Legendary',
    description: 'Reach a 30-day activity streak.',
    icon: '🌟',
    isUnlocked: (p) => computeStreak(p.activityDates).longest >= 30,
  },
  {
    id: 'jack-of-all-trades',
    title: 'Jack of All Trades',
    description: 'Complete at least one lab in every category.',
    icon: '🗺️',
    isUnlocked: (p) => {
      const categories = new Set<string>();
      for (const slug of Object.keys(p.labCompletedAt)) {
        const cat = findLab(slug)?.scenario.category;
        if (cat) categories.add(cat);
      }
      return categories.size >= LAB_CATEGORIES.length;
    },
  },
  {
    id: 'category-master',
    title: 'Category Master',
    description: 'Fully complete every lab in one category.',
    icon: '🥇',
    isUnlocked: (p) =>
      LAB_CATEGORIES.some((cat) => {
        const inCategory = labsForCategory(cat);
        return inCategory.length > 0 && inCategory.every((l) => p.labCompletedAt[l.scenario.id]);
      }),
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: `Fully complete all ${LABS.length} labs.`,
    icon: '🏅',
    isUnlocked: (p) => labsCompletedCount(p) >= LABS.length,
  },
];
