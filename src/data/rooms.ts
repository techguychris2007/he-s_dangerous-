export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** Rough time to clear a room: a base per difficulty plus a few minutes per step. */
export function estimateMinutes(difficulty: Difficulty, steps: number): number {
  const base = { Easy: 10, Medium: 20, Hard: 35 }[difficulty];
  return base + steps * (difficulty === 'Hard' ? 8 : 5);
}
