/** Pure progression rules — reward sizes, the level curve, ranks and leagues. Deliberately import-free so
 *  the always-mounted shell (TopBar, toasts) can use it without pulling the lab catalog into the main
 *  bundle; see useLabsData.ts for why that matters. The XP *total* lives in xp.ts and loads lazily. */

export const FLAG_XP: Record<string, number> = { Easy: 15, Medium: 25, Hard: 40 };
export const LAB_CLEAR_BONUS: Record<string, number> = { Easy: 30, Medium: 60, Hard: 100 };
export const LESSON_XP = 20;
/** A perfect quiz adds this much on top of the lesson itself, scaled by score. */
export const QUIZ_MAX_XP = 30;

/** Everything a lab can pay out: every flag plus the clear bonus. Shown on room cards before you start. */
export function labXpReward(difficulty: string, totalFlags: number): number {
  return totalFlags * (FLAG_XP[difficulty] ?? FLAG_XP.Easy) + (LAB_CLEAR_BONUS[difficulty] ?? LAB_CLEAR_BONUS.Easy);
}

export interface League {
  name: string;
  /** Lab points needed to enter this league. */
  min: number;
  /** A platform colour token — leagues never introduce colours of their own. */
  color: string;
}

/** Leaderboard leagues, keyed on the same lab points the cross-account leaderboard ranks by (see
 *  computeLabPoints) so a learner's league always agrees with their position on the board. */
export const LEAGUES: League[] = [
  { name: 'Bronze', min: 0, color: 'var(--color-warn)' },
  { name: 'Silver', min: 50, color: 'var(--color-text-dim)' },
  { name: 'Gold', min: 150, color: 'var(--color-gold)' },
  { name: 'Platinum', min: 400, color: 'var(--color-heading)' },
  { name: 'Diamond', min: 1000, color: 'var(--color-accent)' },
  { name: 'Obsidian', min: 2500, color: 'var(--color-accent-2)' },
];

export function leagueFor(points: number): { league: League; next: League | null } {
  let index = 0;
  while (index + 1 < LEAGUES.length && points >= LEAGUES[index + 1].min) index++;
  return { league: LEAGUES[index], next: LEAGUES[index + 1] ?? null };
}

/** Total XP needed to reach `level` — 0, 35, 140, 315, 560… Quadratic, so early levels come fast and the top
 *  rank (level 49, ~80k XP) sits near the ceiling of what the whole catalog pays out. */
export function xpForLevel(level: number): number {
  return 35 * (level - 1) ** 2;
}

export interface Rank {
  /** Hex rank code shown beside the title, e.g. "0x4". */
  code: string;
  title: string;
}

export const RANK_STEP = 4;

const RANK_TITLES = [
  'Initiate', 'Script Runner', 'Packet Sniffer', 'Shell Popper', 'Root Seeker', 'Exploit Smith', 'Threat Hunter',
  'Red Operator', 'Zero-Day Artisan', 'Ghost in the Wire', 'Kernel Architect', 'Phantom', 'DarkWorld Legend',
];

export function rankForLevel(level: number): Rank {
  // A new rank every four levels until the final one at level 49.
  const index = Math.min(RANK_TITLES.length - 1, Math.floor((level - 1) / RANK_STEP));
  return { code: `0x${(index + 1).toString(16).toUpperCase()}`, title: RANK_TITLES[index] };
}

export interface LevelInfo {
  level: number;
  rank: Rank;
  xp: number;
  /** XP earned since the current level started. */
  intoLevel: number;
  /** XP the current level spans in total. */
  levelSpan: number;
  /** 0–1 progress through the current level. */
  fraction: number;
  nextRank: Rank | null;
  /** The level at which `nextRank` is awarded. */
  nextRankLevel: number | null;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const start = xpForLevel(level);
  const levelSpan = xpForLevel(level + 1) - start;
  const rank = rankForLevel(level);
  let nextRankLevel: number | null = level + 1;
  while (rankForLevel(nextRankLevel).code === rank.code && nextRankLevel < level + RANK_STEP + 1) nextRankLevel++;
  const nextRank = rankForLevel(nextRankLevel).code === rank.code ? null : rankForLevel(nextRankLevel);
  return {
    level,
    rank,
    xp,
    intoLevel: xp - start,
    levelSpan,
    fraction: (xp - start) / levelSpan,
    nextRank,
    nextRankLevel: nextRank ? nextRankLevel : null,
  };
}
