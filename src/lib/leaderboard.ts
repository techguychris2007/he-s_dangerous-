import { supabase } from './supabaseClient';
import { findLab } from '../data/labs';

const POINTS: Record<string, number> = { Easy: 10, Medium: 20, Hard: 30 };

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  labsCompleted: number;
  points: number;
}

interface RpcRow {
  user_id: string;
  display_name: string;
  lab_flags: Record<string, string[]>;
}

/** Computes the same "labs completed" / "points" definition every other page in the app uses
 *  (ProfilePage, Instructor Dashboard) so a learner's rank here always matches what they see about
 *  themselves elsewhere. */
export function computeLabPoints(labFlags: Record<string, string[]>): { labsCompleted: number; points: number } {
  let labsCompleted = 0;
  let points = 0;
  for (const [labId, flags] of Object.entries(labFlags)) {
    const lab = findLab(labId);
    if (lab && (flags?.length ?? 0) >= lab.scenario.totalFlags) {
      labsCompleted += 1;
      points += POINTS[lab.scenario.difficulty] ?? 10;
    }
  }
  return { labsCompleted, points };
}

/** Calls `leaderboard_entries()` (see supabase/migrations/0004_leaderboard.sql) and returns every
 *  opted-in learner ranked by points, highest first. Returns null on any failure (migration not yet
 *  run, offline) so the page can fall back to a solo view instead of showing a raw error. */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const { data, error } = await supabase.rpc('leaderboard_entries');
  if (error || !data) return null;
  return (data as RpcRow[])
    .map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      ...computeLabPoints(r.lab_flags ?? {}),
    }))
    .sort((a, b) => b.points - a.points);
}
