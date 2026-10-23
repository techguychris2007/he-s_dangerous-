/** Cyber names ("handles") and operator-avatar variants. Both are derived from the account id, so a
 *  learner's identity is the same on every device without any new database column. A learner can roll a
 *  different handle; that choice is a small per-device offset (see useHandle). */

const PREFIX = ['Silent', 'Neon', 'Null', 'Ghost', 'Iron', 'Shadow', 'Quantum', 'Cobalt', 'Binary', 'Static', 'Hollow', 'Crimson', 'Signal', 'Vector', 'Obsidian', 'Midnight', 'Arc', 'Rogue', 'Zero', 'Echo', 'Lunar', 'Frost', 'Onyx', 'Phantom', 'Atlas', 'Nova', 'Stealth', 'Cipher', 'Kernel', 'Blue'];
const SUFFIX = ['Cipher', 'Vanguard', 'Sentry', 'Runner', 'Warden', 'Specter', 'Falcon', 'Byte', 'Shell', 'Packet', 'Wraith', 'Hunter', 'Pilot', 'Tracer', 'Raven', 'Forge', 'Signal', 'Lynx', 'Nomad', 'Circuit', 'Sentinel', 'Proxy', 'Vector', 'Owl', 'Drift', 'Spark', 'Beacon', 'Glyph', 'Harbor', 'Oracle'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function cyberHandle(seed: string, roll = 0): string {
  const h = hash(`${seed}#${roll}`);
  let prefix = PREFIX[h % PREFIX.length];
  let suffix = SUFFIX[Math.floor(h / PREFIX.length) % SUFFIX.length];
  if (prefix === suffix) suffix = SUFFIX[(SUFFIX.indexOf(suffix) + 1) % SUFFIX.length];
  if (prefix.toLowerCase() === suffix.toLowerCase()) prefix = 'Neon';
  const number = 1000 + (Math.floor(h / 900) % 9000);
  return `${prefix}${suffix}${number}`;
}

export interface OperatorLook {
  trim: 'gold' | 'accent' | 'violet';
  visor: 'band' | 'split' | 'lens';
  antenna: boolean;
}

export function operatorLook(seed: string): OperatorLook {
  const h = hash(`look:${seed}`);
  return {
    trim: (['gold', 'accent', 'violet'] as const)[h % 3],
    visor: (['band', 'split', 'lens'] as const)[Math.floor(h / 3) % 3],
    antenna: Math.floor(h / 9) % 2 === 0,
  };
}
