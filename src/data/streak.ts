/** Streaks and streak freezes, replayed from raw activity dates. Import-free so the always-mounted shell
 *  (TopBar HUD) can use it without loading the lab catalog that achievements.ts depends on. */

export interface StreakInfo {
  /** active days in the run ending today or yesterday — 0 if the streak is already broken */
  current: number;
  /** the longest run of active days this learner has ever had, even if broken now */
  longest: number;
  /** streak freezes banked right now (0–MAX_FREEZES) */
  freezes: number;
  /** missed days a freeze covered, so the activity strip can show them as frozen rather than empty */
  frozenDates: string[];
}

/** One freeze is earned for every FREEZE_EVERY active days in a row; at most MAX_FREEZES are banked. */
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Streaks with freezes, replayed from the raw activity dates every time — so freezes need no storage
 *  of their own and come out identical on every device. A freeze silently covers a single missed day
 *  (never two in a row); a longer gap breaks the run. Banked freezes survive a broken streak. */
export function computeStreak(activityDates: string[]): StreakInfo {
  if (activityDates.length === 0) return { current: 0, longest: 0, freezes: 0, frozenDates: [] };
  const sorted = [...new Set(activityDates)].sort();

  let run = 1;
  let longest = 1;
  let freezes = 0;
  let towardFreeze = 1;
  const frozenDates: string[] = [];
  const advance = () => {
    run++;
    towardFreeze++;
    if (towardFreeze >= FREEZE_EVERY) {
      freezes = Math.min(MAX_FREEZES, freezes + 1);
      towardFreeze = 0;
    }
    longest = Math.max(longest, run);
  };

  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i]);
    if (gap === 1) advance();
    else if (gap === 2 && freezes > 0) {
      freezes--;
      frozenDates.push(addDays(sorted[i - 1], 1));
      advance();
    } else {
      run = 1;
      towardFreeze = 1;
    }
  }

  const localToday = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const gapFromToday = daysBetween(sorted[sorted.length - 1], localToday);
  // A streak survives "haven't been active yet today" (gap 1). Missing all of yesterday (gap 2) spends a
  // banked freeze on it; anything longer, or no freeze to spend, breaks the run.
  if (gapFromToday <= 1) return { current: run, longest, freezes, frozenDates };
  if (gapFromToday === 2 && freezes > 0) {
    return { current: run, longest, freezes: freezes - 1, frozenDates: [...frozenDates, addDays(localToday, -1)] };
  }
  return { current: 0, longest, freezes, frozenDates };
}
