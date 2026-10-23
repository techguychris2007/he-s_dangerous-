import type { ProgressState } from '../state/progressStore';
import { findLab } from './labs';
import { SIEM_LABS } from '../labs/siemScenarios';
import { ACHIEVEMENTS } from './achievements';
import { DAILY_OP_BONUS, dailyOpsCleared } from './dailyOp';
import { FLAG_XP, LAB_CLEAR_BONUS, LESSON_XP, QUIZ_MAX_XP } from './levels';
import { WEEKLY_CHEST_XP, chestsOpened } from './weekly';

/** Like achievements.ts, XP is derived live from existing progress state — nothing is persisted, so
 *  a learner's level is identical on every device the moment their progress syncs, and the whole
 *  system ships with zero Supabase schema change. Every learning action earns something, not only
 *  finished labs (which is all the legacy "points" counted).
 *
 *  This module imports the full lab catalog, so shell components must load it through useXp() rather
 *  than importing it directly. */

const CODE_TASK_XP = 40;
const CODE_HINT_PENALTY = 10;
const CODE_SOLUTION_XP = 10;
const ACHIEVEMENT_XP = 50;

/** XP a solved code task is worth: a clean solve earns the most, each hint costs a little, and reading
 *  the reference solution still earns a small amount. */
export function codeTaskXp(hintsUsed: number, solutionRevealed: boolean): number {
  return solutionRevealed ? CODE_SOLUTION_XP : Math.max(CODE_SOLUTION_XP, CODE_TASK_XP - hintsUsed * CODE_HINT_PENALTY);
}

const SIEM_BY_ID = new Map(SIEM_LABS.map((lab) => [lab.id, lab]));

/** Difficulty and proof count for a terminal lab or a SOC case, whichever the id belongs to. */
function roomMeta(id: string): { difficulty: string; totalFlags: number } | undefined {
  const lab = findLab(id);
  if (lab) return lab.scenario;
  return SIEM_BY_ID.get(id);
}

export interface XpBreakdown {
  lessons: number;
  quizzes: number;
  flags: number;
  labClears: number;
  codeTasks: number;
  achievements: number;
  dailyOps: number;
  weeklyChests: number;
  total: number;
}

export function computeXp(progress: ProgressState): XpBreakdown {
  const lessons = Object.values(progress.completedLessons).filter(Boolean).length * LESSON_XP;
  const quizzes = Object.values(progress.quizScores).reduce((sum, score) => sum + Math.round((Math.min(100, Math.max(0, score)) / 100) * QUIZ_MAX_XP), 0);

  let flags = 0;
  let labClears = 0;
  for (const [labId, captured] of Object.entries(progress.labFlags)) {
    const room = roomMeta(labId);
    const difficulty = room?.difficulty ?? 'Easy';
    flags += (captured?.length ?? 0) * (FLAG_XP[difficulty] ?? FLAG_XP.Easy);
    if (room && (captured?.length ?? 0) >= room.totalFlags) labClears += LAB_CLEAR_BONUS[difficulty] ?? LAB_CLEAR_BONUS.Easy;
  }

  let codeTasks = 0;
  for (const [taskId, done] of Object.entries(progress.completedCodeTasks)) {
    if (!done) continue;
    // Reading the reference solution is still worth something, but a clean solve is worth four times as much.
    codeTasks += codeTaskXp(progress.codeTaskHintsUsed[taskId] ?? 0, !!progress.codeTaskSolutionRevealed[taskId]);
  }

  const achievements = ACHIEVEMENTS.filter((a) => a.isUnlocked(progress)).length * ACHIEVEMENT_XP;
  const dailyOps = dailyOpsCleared(progress.labCompletedAt).length * DAILY_OP_BONUS;
  const weeklyChests = chestsOpened(progress).length * WEEKLY_CHEST_XP;
  return { lessons, quizzes, flags, labClears, codeTasks, achievements, dailyOps, weeklyChests, total: lessons + quizzes + flags + labClears + codeTasks + achievements + dailyOps + weeklyChests };
}

export { findLab };
