import type { RoadmapTrack } from '../../../shared/types/domain';

/** Accounts that can use the offline workspace and the owner-only tracks (machine learning,
 *  C# & .NET, software engineering). Everyone else never sees them. This is an interface gate: the
 *  lesson content still ships in the app bundle. Kept free of app imports so data modules and
 *  Node check scripts can use it. */
const OWNER_EMAILS = new Set(['techguychris2007@gmail.com', 'christopherbondam@gmail.com']);

export function isOwnerEmail(email?: string | null): boolean {
  return Boolean(email && OWNER_EMAILS.has(email.trim().toLowerCase()));
}

let currentOwner = false;
const ownerListeners = new Set<(owner: boolean) => void>();

/** Set from the root component with the signed-in account, before any page renders. */
export function setOwnerSession(owner: boolean) {
  if (owner === currentOwner) return;
  currentOwner = owner;
  ownerListeners.forEach(listener => listener(owner));
}

/** Runs now with the current value, then on every change (used by the curriculum data). */
export function watchOwnerSession(listener: (owner: boolean) => void) {
  ownerListeners.add(listener);
  listener(currentOwner);
}

/** The current session's owner status, for code outside React components. */
export function isOwnerSession() { return currentOwner; }


/** Roadmap tracks only owners can see. */
export const OWNER_TRACKS: ReadonlySet<RoadmapTrack> = new Set<RoadmapTrack>(['software', 'dotnet', 'ml']);

/** Coding tasks that belong to the owner-only tracks: C#, the software engineering track and ML. */
export function isOwnerOnlyTask(task: { language: string; category: string }): boolean {
  return task.language === 'csharp' || task.category === 'Software Engineering' || task.category.startsWith('ML:');
}

/** Paths that belong to the owner-only portals. */
export function isOwnerOnlyPath(path: string): boolean {
  return /^\/(ml-portal|ml-lesson|build-portal|build-task|se-verify)(\/|$)/.test(path) || /[?&]track=(software|dotnet|ml)(&|$)/.test(path);
}
