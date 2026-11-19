/** The first-visit guided tour: its steps, when it starts on its own, what is remembered, and where
 *  its card sits on screen. Free of React and DOM-library imports so tests/check-navigation.cjs can
 *  test it directly. The component that draws it is src/features/onboarding/components/GuidedTour.tsx. */
import type { CharacterId } from '../../../shared/characters/characters';

/** `dig` is the learning assistant; every other guide is a member of the cast in data/characters.ts. */
export type TourGuide = CharacterId | 'dig';

export interface TourStep {
  id: 'welcome' | 'tabs' | 'learn' | 'practice' | 'search' | 'dig' | 'account' | 'finish';
  guide: TourGuide;
  title: string;
  body: string;
  /** CSS selector of the element to spotlight. Without one, the card sits in the middle of the screen. */
  target?: string;
  /** Left out when its element is not on screen (dig's launcher only shows on some pages). */
  optional?: boolean;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'welcome', guide: 'byte', title: 'Welcome to DarkWorld',
    body: 'I’m Byte, and I’ll show you around. It takes about a minute, and you can skip whenever you like.',
  },
  {
    id: 'tabs', guide: 'byte', target: '[data-tour="tabs"]', title: 'Your way around',
    body: 'These tabs reach every part of the academy. Overview is your base: your next room, streak and XP are always here.',
  },
  {
    id: 'learn', guide: 'sentinel', target: '[data-tour="tab-learn"]', title: 'Start in Learn',
    body: 'Lessons and learning paths live here. New to security? Begin with Pre-security: it starts from zero and builds every skill the labs rely on.',
  },
  {
    id: 'practice', guide: 'vex', target: '[data-tour="tab-practice"]', title: 'Practise on real systems',
    body: 'Rooms give you real terminals, live websites and SIEM consoles. Everything is sandboxed, so experiment freely. Capture flags to earn XP.',
  },
  {
    id: 'search', guide: 'beacon', target: '[data-tour="tools"] .dw-search-trigger', title: 'Find anything fast',
    body: 'Search jumps straight to any lesson, room or page. Press {shortcut} from anywhere in the academy.',
  },
  {
    id: 'dig', guide: 'dig', target: '.dig-floating-launcher', optional: true, title: 'Ask dig when you’re stuck',
    body: 'dig is your learning assistant. Ask about a concept, a command, or where to go next.',
  },
  {
    id: 'account', guide: 'ledger', target: '[data-tour="account"]', title: 'Your account',
    body: 'Your profile, progress and certificates are here, with Help & FAQ. You can take this tour again from here too.',
  },
  {
    id: 'finish', guide: 'sentinel', title: 'You’re ready, {handle}',
    body: 'Start with Pre-security for a guided first step, or explore on your own. Your progress, XP and streak save automatically.',
  },
];

/** Where the finish step's main button leads: the beginner path, open to every account. */
export const TOUR_START_PATH = '/roadmap?track=presecurity';

/** Fired on window to replay the tour, for example from the account menu. */
export const TOUR_EVENT = 'darkworld:tour';

/** Bump to show a reworked tour once more to people who saw an earlier one. */
const TOUR_VERSION = 1;
export type TourRecord = 'completed' | 'skipped';
export const tourStorageKey = (seed: string) => `darkworld.tour.v${TOUR_VERSION}.${seed}`;

/** What this device remembers about the tour for this learner. Unreadable storage counts as seen, so a
 *  browser that blocks storage is never shown the tour on every single visit. */
export function readTourRecord(storage: Pick<Storage, 'getItem'> | undefined, seed: string): TourRecord | null {
  try {
    const value = storage?.getItem(tourStorageKey(seed));
    if (value === 'completed' || value === 'skipped') return value;
    return storage ? null : 'skipped';
  } catch {
    return 'skipped';
  }
}

export function writeTourRecord(storage: Pick<Storage, 'setItem'> | undefined, seed: string, record: TourRecord): void {
  try { storage?.setItem(tourStorageKey(seed), record); } catch { /* shown again next visit; harmless */ }
}

/** The tour starts by itself only on the Overview, once the cyber-name welcome has been dismissed,
 *  and only for a learner who has neither finished nor skipped it on this device. */
export function shouldAutoStart(input: { pathname: string; handleSeen: boolean; record: TourRecord | null }): boolean {
  return input.pathname === '/' && input.handleSeen && input.record === null;
}

/** Fills {handle} and {shortcut} in a step's text. Without a keyboard shortcut (phones, tablets),
 *  the sentence that mentions it is left out rather than shown with a gap. */
export function fillTourText(text: string, values: { handle: string; shortcut: string }): string {
  const withShortcut = values.shortcut ? text.replace('{shortcut}', values.shortcut) : text.replace(/\s*[^.]*\{shortcut\}[^.]*\./g, '');
  return withShortcut.replace('{handle}', values.handle);
}

export interface TourRect { top: number; left: number; width: number; height: number }
export type TourPlacement =
  | { mode: 'center' }
  | { mode: 'sheet'; edge: 'top' | 'bottom' }
  | { mode: 'below' | 'above'; top: number; left: number; arrowLeft: number };

/** Narrower than this, the card docks to the screen edge like a bottom sheet instead of floating. */
export const TOUR_SHEET_BELOW = 640;

/** Where the card goes for a spotlighted element: under it when there is room, otherwise above it,
 *  kept inside the viewport. Small screens use a docked sheet on the edge away from the element. */
export function placeTourCard(target: TourRect | null, card: { width: number; height: number }, viewport: { width: number; height: number }, gap = 14, margin = 16): TourPlacement {
  if (!target) return { mode: 'center' };
  const targetMiddle = target.top + target.height / 2;
  if (viewport.width < TOUR_SHEET_BELOW) return { mode: 'sheet', edge: targetMiddle > viewport.height / 2 ? 'top' : 'bottom' };
  const below = target.top + target.height + gap;
  const above = target.top - gap - card.height;
  const fitsBelow = below + card.height <= viewport.height - margin;
  const fitsAbove = above >= margin;
  if (!fitsBelow && !fitsAbove) return { mode: 'sheet', edge: targetMiddle > viewport.height / 2 ? 'top' : 'bottom' };
  const maxLeft = Math.max(margin, viewport.width - card.width - margin);
  const left = Math.min(Math.max(target.left + target.width / 2 - card.width / 2, margin), maxLeft);
  // The arrow points at the element's centre, but never past the card's rounded corners.
  const arrowLeft = Math.min(Math.max(target.left + target.width / 2 - left, 24), card.width - 24);
  return fitsBelow ? { mode: 'below', top: below, left, arrowLeft } : { mode: 'above', top: above, left, arrowLeft };
}
