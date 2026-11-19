export type SpeedTier = 'first' | 'lightning' | 'swift' | 'steady';

const LIGHTNING_MS = 6 * 60 * 1000; // under 6 min since your last lab finished
const SWIFT_MS = 20 * 60 * 1000; // under 20 min

/** Classifies how quickly the learner moved from finishing their last lab to finishing this one. */
export function computeSpeedTier(prevCompletedAt: number | null, now: number): SpeedTier {
  if (prevCompletedAt === null) return 'first';
  const gap = now - prevCompletedAt;
  if (gap <= LIGHTNING_MS) return 'lightning';
  if (gap <= SWIFT_MS) return 'swift';
  return 'steady';
}

const STANDARD_LINES = [
  'Flag captured. That box is yours.',
  'Clean compromise, start to finish.',
  'Another one down — the methodology is sinking in.',
  'That\'s exactly how a real engagement reads: recon, foothold, proof.',
  'Nicely done. You followed the chain all the way through.',
  'Box owned. Your report-writing muscle is getting a workout too.',
];

const LIGHTNING_LINES = [
  'You barely paused between labs — that\'s serious momentum.',
  'Back-to-back compromises. You\'re in the zone right now.',
  'That was fast. You\'re reading these environments on sight now.',
];

const SWIFT_LINES = [
  'Solid pace — you\'re building real fluency with this methodology.',
  'You\'re moving with purpose. Keep this rhythm going.',
];

const FIRST_LINES = [
  'First flag of the session — welcome to the work.',
  'That\'s one. The methodology only gets more natural from here.',
];

const MILESTONE_LINES: Record<number, string> = {
  1: 'Your very first captured flag on this platform. Everyone who does this professionally started exactly here.',
  5: '5 labs in the bag. The nmap-then-enumerate-then-exploit rhythm is becoming muscle memory.',
  10: 'Double digits. You\'re no longer guessing at commands — you\'re running a methodology.',
  25: '25 labs completed. That\'s a real portfolio of hands-on offensive work now.',
  50: '50 labs. At this point you\'ve practiced more real attack chains than most junior pentesters see in their first year.',
  100: '100 labs completed. This is genuinely dangerous-good territory.',
};

function pick(pool: string[], seed: number): string {
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

export interface CompanionMessage {
  headline: string;
  isMilestone: boolean;
}

export function buildCongratsMessage(tier: SpeedTier, totalCompleted: number, seed: number): CompanionMessage {
  const milestone = MILESTONE_LINES[totalCompleted];
  if (milestone) return { headline: milestone, isMilestone: true };

  const pool = tier === 'first' ? FIRST_LINES : tier === 'lightning' ? LIGHTNING_LINES : tier === 'swift' ? SWIFT_LINES : STANDARD_LINES;
  return { headline: pick(pool, seed), isMilestone: false };
}

const ENCOURAGEMENT_LINES = [
  'Ready for the next one? The next box on your roadmap is waiting.',
  'Don\'t stop the streak — the next lab is right there.',
  'Keep the chain going. One more box, one more technique locked in.',
  'The best way to get dangerously good is the one you\'re already doing: reps.',
];

export function pickEncouragement(seed: number): string {
  return pick(ENCOURAGEMENT_LINES, seed);
}
