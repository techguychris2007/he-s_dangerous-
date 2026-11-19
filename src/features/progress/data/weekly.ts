import type { ProgressState } from '../state/progressStore';
import { dailyOpsCleared, localDate } from './dailyOp';

/** Weekly missions (Monday–Sunday, learner's local time). All three done in a week opens the chest:
 *  a one-off bonus for that week. Everything is replayed from synced timestamps, so nothing is stored. */

export const WEEKLY_CHEST_XP = 100;

export interface Mission {
  id: 'active' | 'rooms' | 'daily';
  label: string;
  target: number;
  current: number;
}

/** Monday of the week containing `date` ("YYYY-MM-DD"). */
export function weekStart(date: string): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(d);
}

function missionsFor(week: string, progress: Pick<ProgressState, 'activityDates' | 'labCompletedAt'>, dailies: string[]): Mission[] {
  const inWeek = (date: string) => weekStart(date) === week;
  return [
    { id: 'active', label: 'Be active on 4 days', target: 4, current: new Set(progress.activityDates.filter(inWeek)).size },
    { id: 'rooms', label: 'Clear 3 rooms', target: 3, current: Object.values(progress.labCompletedAt).filter((at) => inWeek(localDate(new Date(at)))).length },
    { id: 'daily', label: 'Clear a Daily Op', target: 1, current: dailies.filter(inWeek).length },
  ];
}

export function currentMissions(progress: Pick<ProgressState, 'activityDates' | 'labCompletedAt'>): { week: string; missions: Mission[] } {
  const week = weekStart(localDate());
  return { week, missions: missionsFor(week, progress, dailyOpsCleared(progress.labCompletedAt)) };
}

export function missionsComplete(missions: Mission[]): boolean {
  return missions.every((m) => m.current >= m.target);
}

/** Every week in which the learner completed all three missions. */
export function chestsOpened(progress: Pick<ProgressState, 'activityDates' | 'labCompletedAt'>): string[] {
  const dailies = dailyOpsCleared(progress.labCompletedAt);
  const weeks = new Set(progress.activityDates.map(weekStart));
  return [...weeks].filter((week) => missionsComplete(missionsFor(week, progress, dailies))).sort();
}
