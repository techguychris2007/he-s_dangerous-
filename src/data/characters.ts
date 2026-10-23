/** The DarkWorld cast. Two crews guide the two sides of the academy: Bastion (defensive, led by
 *  Sentinel — the same host as the lesson videos, see video/brand/character.md) and Breach Unit
 *  (offensive, an original crew). Wraith is the rival every learner chases on hard labs. Lines stay
 *  calm and evidence-led: encouragement, never hacker theatrics. */

export type CharacterId = 'sentinel' | 'ledger' | 'beacon' | 'vex' | 'cipher' | 'byte' | 'wraith';
export type Crew = 'bastion' | 'breach' | 'rival';

export interface Character {
  id: CharacterId;
  name: string;
  crew: Crew;
  role: string;
  /** One sentence the character introduces themself with. */
  bio: string;
  lines: {
    greet: string[];
    levelUp: string[];
    labClear: string[];
    empty: string[];
  };
}

export const CREWS: Record<Crew, { name: string; side: string; blurb: string }> = {
  bastion: { name: 'Bastion', side: 'Defensive', blurb: 'Detect, investigate, contain. Bastion reads the evidence and keeps the lights on.' },
  breach: { name: 'Breach Unit', side: 'Offensive', blurb: 'Authorised attackers who find the gap before anyone else does — and write it up.' },
  rival: { name: 'Rival', side: 'Adversary', blurb: 'The opponent on the far side of every hard lab.' },
};

export const CHARACTERS: Record<CharacterId, Character> = {
  sentinel: {
    id: 'sentinel', name: 'Sentinel', crew: 'bastion', role: 'SOC lead',
    bio: 'I lead Bastion. We start from the evidence and only say what it supports.',
    lines: {
      greet: ['Welcome back. Let’s see what the logs have to say today.', 'Good to see you on shift. Pick up where you left off?', 'Every alert has a story. Ready to read one?'],
      levelUp: ['Steady work. Your instincts are sharpening.', 'Another level. You’re reading signals others miss.'],
      labClear: ['Case closed, with evidence to back it. Well done.', 'Clean investigation. That’s how it’s done.'],
      empty: ['Nothing here yet. Your first case is waiting in the SOC portal.'],
    },
  },
  ledger: {
    id: 'ledger', name: 'Ledger', crew: 'bastion', role: 'Forensics investigator',
    bio: 'Timestamps, hashes, artefacts. I keep the record straight.',
    lines: {
      greet: ['The timeline never lies. Shall we build one?'],
      levelUp: ['Recorded: one level higher. The chain of custody holds.'],
      labClear: ['Every artefact accounted for. Lovely work.'],
      empty: ['No evidence collected yet. Open a forensics lab to start a timeline.'],
    },
  },
  beacon: {
    id: 'beacon', name: 'Beacon', crew: 'bastion', role: 'Detection drone',
    bio: 'I watch the SIEM so nothing slips past. Write me good rules.',
    lines: {
      greet: ['Signal’s clear. Want to tune some detections?'],
      levelUp: ['Ping! Level up detected.'],
      labClear: ['Alert resolved. True positive, nicely handled.'],
      empty: ['Quiet on the wire. Start a lab and I’ll light up.'],
    },
  },
  vex: {
    id: 'vex', name: 'Vex', crew: 'breach', role: 'Red team lead',
    bio: 'I run Breach Unit. We break things on purpose — with permission and a report.',
    lines: {
      greet: ['Scope’s signed. Let’s find the way in.', 'Back for another engagement? Recon first, always.', 'There’s a flag out there with your name on it.'],
      levelUp: ['Level up. You’re thinking like an operator now.', 'Promotion earned. Keep that methodology tight.'],
      labClear: ['Box rooted, flags captured. Now write it up.', 'Clean chain from recon to root. Nice.'],
      empty: ['No flags yet. Pick an Easy lab and get your first foothold.'],
    },
  },
  cipher: {
    id: 'cipher', name: 'Cipher', crew: 'breach', role: 'Code & crypto mentor',
    bio: 'Every exploit is just code. Learn to read it and nothing is magic.',
    lines: {
      greet: ['Tests are red? Good. That’s where learning starts.'],
      levelUp: ['Compiled successfully: you, one level up.'],
      labClear: ['All tests green. Elegant.'],
      empty: ['No code submitted yet. The Code Portal has a warm-up for you.'],
    },
  },
  byte: {
    id: 'byte', name: 'Byte', crew: 'breach', role: 'Field sidekick',
    bio: 'Small bot, big curiosity. I’ll walk you through the basics.',
    lines: {
      greet: ['Beep! Ready to learn something new?'],
      levelUp: ['Whoa, level up! Beep beep!'],
      labClear: ['You did it! Flag acquired!'],
      empty: ['Nothing here yet — let’s go explore!'],
    },
  },
  wraith: {
    id: 'wraith', name: 'Wraith', crew: 'rival', role: 'Rival operator',
    bio: 'I’m always one level ahead. Prove me wrong.',
    lines: {
      greet: ['Still here? The Hard labs are where I wait.'],
      levelUp: ['Hm. You’re closing the gap.'],
      labClear: ['You beat this one. There are harder.'],
      empty: ['Nothing to show? Predictable.'],
    },
  },
};

export const CREW_MEMBERS: Record<Crew, CharacterId[]> = {
  bastion: ['sentinel', 'ledger', 'beacon'],
  breach: ['vex', 'cipher', 'byte'],
  rival: ['wraith'],
};

/** Which guide fronts each learning area — matched against a lab category, module track or route. */
export function guideForArea(area: string | undefined): CharacterId {
  const a = (area ?? '').toLowerCase();
  if (/forensic|malware|memory|incident|ir\b/.test(a)) return 'ledger';
  if (/siem|detect|soc-detection|correlat|ueba|soar/.test(a)) return 'beacon';
  if (/soc|defen|blue|grc|compliance|securityplus|security\+|secengineering|security engineering/.test(a)) return 'sentinel';
  if (/code|python|program|javascript|cpp|ml|crypto|algorithm|engineering/.test(a)) return 'cipher';
  if (/pre-?security|linux|network|kali-foundations|fundamental/.test(a)) return 'byte';
  return 'vex';
}

/** Deterministic per day so a line doesn't change on every re-render, but does change tomorrow. */
export function pickLine(lines: string[], salt = 0): string {
  const d = new Date();
  const day = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
  return lines[(day + salt) % lines.length];
}

const GUIDE_KEY = 'darkworld.crew';

/** The learner's chosen side — a per-device preference, so it lives in localStorage and never syncs. */
export function loadChosenCrew(): Exclude<Crew, 'rival'> | null {
  try {
    const value = localStorage.getItem(GUIDE_KEY);
    return value === 'bastion' || value === 'breach' ? value : null;
  } catch {
    return null;
  }
}

export function saveChosenCrew(crew: Exclude<Crew, 'rival'>): void {
  try {
    localStorage.setItem(GUIDE_KEY, crew);
    window.dispatchEvent(new Event('darkworld:crew'));
  } catch { /* A preference that can't be saved just falls back to the default guide. */ }
}
