import { LABS, type LabEntry } from './labs';

/** The Daily Op: one featured lab per calendar day, the same for every learner on that date. Clearing
 *  it on the day pays a bonus — worked out from labCompletedAt timestamps, so it needs no storage. */

export const DAILY_OP_BONUS = 50;

/** Sunday-first: weekends and Fridays are the hard ones. */
const WEEKDAY_DIFFICULTY: LabEntry['scenario']['difficulty'][] = ['Hard', 'Easy', 'Medium', 'Easy', 'Medium', 'Hard', 'Medium'];

export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pool = new Map<string, LabEntry[]>();
function labsOfDifficulty(difficulty: LabEntry['scenario']['difficulty']): LabEntry[] {
  let labs = pool.get(difficulty);
  if (!labs) {
    labs = LABS.filter((l) => l.scenario.difficulty === difficulty);
    if (labs.length === 0) labs = [...LABS];
    pool.set(difficulty, labs);
  }
  return labs;
}

/** `date` is a local "YYYY-MM-DD". */
export function dailyOpFor(date: string): LabEntry {
  const weekday = new Date(date + 'T00:00:00').getDay();
  const labs = labsOfDifficulty(WEEKDAY_DIFFICULTY[weekday]);
  return labs[hash('daily-op:' + date) % labs.length];
}

/** Every Daily Op the learner cleared on its own day. */
export function dailyOpsCleared(labCompletedAt: Record<string, number>): string[] {
  const days: string[] = [];
  for (const [labId, at] of Object.entries(labCompletedAt)) {
    const day = localDate(new Date(at));
    if (dailyOpFor(day).scenario.id === labId) days.push(day);
  }
  return days.sort();
}
