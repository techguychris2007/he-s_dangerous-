import type { ProgressState } from '../state/progressStore';
import { LABS, LAB_CATEGORIES, labsForCategory, findLab } from './labs';
import { computeStreak } from './streak';

/** Every quantity here is derived live from existing progress state on every render — nothing new
 *  is persisted except `activityDates` (see progressStore.ts), so this whole system ships with zero
 *  Supabase schema change and can never drift out of sync with the stats it's built on. */

export { computeStreak, FREEZE_EVERY, MAX_FREEZES, type StreakInfo } from './streak';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIconName;
  isUnlocked: (progress: ProgressState) => boolean;
}

export type AchievementIconName = 'flag' | 'book' | 'target' | 'trophy' | 'crown' | 'code' | 'brain' | 'check' | 'certificate' | 'bookmark' | 'shield' | 'lightning' | 'star' | 'map' | 'medal';

function labsCompletedCount(progress: ProgressState): number {
  return Object.keys(progress.labCompletedAt).length;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Flag',
    description: 'Capture your first flag.',
    icon: 'flag',
    isUnlocked: (p) => Object.values(p.labFlags).some((flags) => flags.length > 0),
  },
  {
    id: 'first-lesson',
    title: 'Getting Started',
    description: 'Complete your first lesson.',
    icon: 'book',
    isUnlocked: (p) => Object.values(p.completedLessons).some(Boolean),
  },
  {
    id: 'ten-labs',
    title: 'Lab Practitioner',
    description: 'Fully complete 10 labs.',
    icon: 'target',
    isUnlocked: (p) => labsCompletedCount(p) >= 10,
  },
  {
    id: 'fifty-labs',
    title: 'Half Century',
    description: 'Fully complete 50 labs.',
    icon: 'trophy',
    isUnlocked: (p) => labsCompletedCount(p) >= 50,
  },
  {
    id: 'hundred-labs',
    title: 'Centurion',
    description: 'Fully complete 100 labs.',
    icon: 'crown',
    isUnlocked: (p) => labsCompletedCount(p) >= 100,
  },
  {
    id: 'coder',
    title: 'Coder',
    description: 'Pass 10 Code Portal exercises.',
    icon: 'code',
    isUnlocked: (p) => Object.values(p.completedCodeTasks).filter(Boolean).length >= 10,
  },
  {
    id: 'master-coder',
    title: 'Master Coder',
    description: 'Pass 50 Code Portal exercises.',
    icon: 'brain',
    isUnlocked: (p) => Object.values(p.completedCodeTasks).filter(Boolean).length >= 50,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz.',
    icon: 'check',
    isUnlocked: (p) => Object.values(p.quizScores).some((s) => s >= 100),
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Complete 10 lesson quizzes.',
    icon: 'certificate',
    isUnlocked: (p) => Object.keys(p.quizScores).length >= 10,
  },
  {
    id: 'bookworm',
    title: 'Bookworm',
    description: 'Bookmark 5 labs to revisit.',
    icon: 'bookmark',
    isUnlocked: (p) => Object.values(p.bookmarkedLabs).filter(Boolean).length >= 5,
  },
  {
    id: 'on-fire',
    title: 'On Fire',
    description: 'Reach a 3-day activity streak.',
    icon: 'shield',
    isUnlocked: (p) => computeStreak(p.activityDates).longest >= 3,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Reach a 7-day activity streak.',
    icon: 'lightning',
    isUnlocked: (p) => computeStreak(p.activityDates).longest >= 7,
  },
  {
    id: 'legendary',
    title: 'Legendary',
    description: 'Reach a 30-day activity streak.',
    icon: 'star',
    isUnlocked: (p) => computeStreak(p.activityDates).longest >= 30,
  },
  {
    id: 'jack-of-all-trades',
    title: 'Jack of All Trades',
    description: 'Complete at least one lab in every category.',
    icon: 'map',
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
    icon: 'medal',
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
    icon: 'certificate',
    isUnlocked: (p) => labsCompletedCount(p) >= LABS.length,
  },
];
