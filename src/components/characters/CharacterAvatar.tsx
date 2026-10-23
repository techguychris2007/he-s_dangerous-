import { useId, type ReactNode } from 'react';
import { CHARACTERS, type CharacterId, type Crew } from '../../data/characters';
import { operatorLook, type OperatorLook } from '../../data/handles';
import './characters.css';

/** Lit, 3D-style bust portraits. Every colour derives from platform tokens (via color-mix), so the cast
 *  follows the theme and the palette: Bastion wears navy ceramic with gold trim (matching Sentinel's
 *  rendered portrait), Breach Unit brushed slate with the indigo accent, the rival dark glass with violet. */
interface Palette {
  /** base shell colour; light and shadow tones are mixed from it */
  shell: string;
  trim: string;
  glow: string;
  halo: string;
}

const PALETTE: Record<Crew, Palette> = {
  bastion: {
    shell: 'color-mix(in srgb, var(--color-navy-dim) 72%, var(--color-accent) 28%)',
    trim: 'var(--color-gold)',
    glow: 'var(--color-accent-dim)',
    halo: 'var(--color-gold)',
  },
  breach: {
    shell: 'color-mix(in srgb, var(--color-navy-dim) 55%, var(--color-text-dim) 45%)',
    trim: 'var(--color-accent)',
    glow: 'var(--color-accent-dim)',
    halo: 'var(--color-accent)',
  },
  rival: {
    shell: 'color-mix(in srgb, var(--color-navy) 80%, var(--color-accent-2) 20%)',
    trim: 'var(--color-accent-2)',
    glow: 'var(--color-accent-2)',
    halo: 'var(--color-accent-2)',
  },
};

const light = (c: string, pct: number) => `color-mix(in srgb, ${c} ${100 - pct}%, white ${pct}%)`;
const dark = (c: string, pct: number) => `color-mix(in srgb, ${c} ${100 - pct}%, black ${pct}%)`;

/** Shared gradient definitions for one portrait instance. */
function Defs({ uid, p }: { uid: string; p: Palette }) {
  const stop = (offset: string, color: string, opacity = 1) => <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />;
  return (
    <defs>
      <radialGradient id={`${uid}-bg`} cx="50%" cy="34%" r="75%">
        {stop('0', light('var(--color-navy-dim)', 6))}
        {stop('1', dark('var(--color-navy)', 25))}
      </radialGradient>
      <radialGradient id={`${uid}-halo`} cx="50%" cy="42%" r="45%">
        {stop('0', p.halo, 0.28)}
        {stop('1', p.halo, 0)}
      </radialGradient>
      {/* Key light from the upper left; the far edge falls into shadow. */}
      <radialGradient id={`${uid}-shell`} cx="34%" cy="26%" r="78%">
        {stop('0', light(p.shell, 38))}
        {stop('0.45', p.shell)}
        {stop('1', dark(p.shell, 55))}
      </radialGradient>
      <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0.35" y2="1">
        {stop('0', light(p.shell, 22))}
        {stop('0.6', p.shell)}
        {stop('1', dark(p.shell, 60))}
      </linearGradient>
      <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="0" y2="1">
        {stop('0', dark('var(--color-navy)', 45))}
        {stop('1', dark('var(--color-navy)', 10))}
      </linearGradient>
      <linearGradient id={`${uid}-trim`} x1="0" y1="0" x2="1" y2="1">
        {stop('0', light(p.trim, 35))}
        {stop('0.5', p.trim)}
        {stop('1', dark(p.trim, 35))}
      </linearGradient>
      <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
        {stop('0', 'black', 0.45)}
        {stop('1', 'black', 0)}
      </radialGradient>
      <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.8" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

/** Highlight streak that sells a glossy, curved surface. */
const Spec = ({ d }: { d: string }) => <path d={d} fill="none" stroke="white" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" />;

function Art({ id, uid, p }: { id: CharacterId; uid: string; p: Palette }): ReactNode {
  const shell = `url(#${uid}-shell)`, body = `url(#${uid}-body)`, visor = `url(#${uid}-visor)`, trim = `url(#${uid}-trim)`, glow = `url(#${uid}-glow)`;
  const rim = { stroke: p.trim, strokeOpacity: 0.55, strokeWidth: 1.2 };
  switch (id) {
    case 'vex':
      return (
        <g>
          <path d="M12 121c4-25 23-35 48-35s44 10 48 35z" fill={body} {...rim} />
          <path d="M40 92l20 13 20-13-3-5-17 10-17-10z" fill={trim} />
          <rect x="52" y="71" width="16" height="17" rx="4" fill={dark(p.shell, 45)} />
          <path d="M57 6h6l5 22H52z" fill={trim} />
          <path d="M35 45c0-18 11-27 25-27s25 9 25 27l-2 17c-2 13-11 19-23 19s-21-6-23-19z" fill={shell} {...rim} />
          <path d="M39 44h42l-4 14H43z" fill={visor} />
          <g className="dw-eye" filter={glow} fill={p.glow}>
            <path d="M45 48.5l11 2.8-1 3.4-11-2.8zM75 48.5l-11 2.8 1 3.4 11-2.8z" />
          </g>
          <circle cx="34.5" cy="50" r="5" fill={trim} />
          <circle cx="85.5" cy="50" r="5" fill={trim} />
          <rect x="54" y="68" width="12" height="3" rx="1.5" fill={p.trim} opacity=".8" />
          <Spec d="M43 31c4-5 10-7 16-7" />
        </g>
      );
    case 'cipher':
      return (
        <g>
          <path d="M14 121c4-24 22-34 46-34s42 10 46 34z" fill={body} {...rim} />
          <path d="M50 104l-6 5 6 5M70 104l6 5-6 5M62 101l-4 15" fill="none" stroke={p.glow} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" filter={glow} />
          <rect x="53" y="73" width="14" height="13" rx="4" fill={dark(p.shell, 45)} />
          <path d="M36 34l-4-18 14 12zM84 34l4-18-14 12z" fill={trim} />
          <ellipse cx="60" cy="50" rx="29" ry="27" fill={shell} {...rim} />
          <circle cx="47.5" cy="50" r="11.5" fill={visor} stroke={trim} strokeWidth="3" />
          <circle cx="72.5" cy="50" r="11.5" fill={visor} stroke={trim} strokeWidth="3" />
          <g className="dw-eye" filter={glow} fill={p.glow}>
            <circle cx="48.5" cy="51" r="4.2" />
            <circle cx="73.5" cy="51" r="4.2" />
          </g>
          <path d="M57 63h6l-3 6z" fill="var(--color-gold)" />
          <Spec d="M40 34c6-6 12-8 19-8" />
        </g>
      );
    case 'byte':
      return (
        <g>
          <ellipse cx="60" cy="106" rx="20" ry="4" fill={`url(#${uid}-floor)`} />
          <path d="M60 34V21" stroke={dark(p.shell, 30)} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="18" r="4.5" fill={p.glow} filter={glow} className="dw-eye" />
          <rect x="21" y="55" width="10" height="19" rx="5" fill={body} {...rim} />
          <rect x="89" y="55" width="10" height="19" rx="5" fill={body} {...rim} />
          <rect x="29" y="33" width="62" height="60" rx="15" fill={shell} {...rim} />
          <rect x="37" y="42" width="46" height="33" rx="7" fill={visor} />
          <g className="dw-eye" filter={glow} stroke={p.glow} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M46 51l8 7-8 7" />
            <path d="M60 65h12" />
          </g>
          <circle cx="44" cy="84" r="2.6" fill={trim} />
          <circle cx="52" cy="84" r="2.6" fill={dark(p.shell, 35)} />
          <Spec d="M36 39c4-3 9-4 15-4" />
        </g>
      );
    case 'wraith':
      return (
        <g>
          <path d="M10 121c3-22 16-32 30-36l20 14 20-14c14 4 27 14 30 36z" fill={body} {...rim} />
          <path d="M26 97l-6-15 18 6zM94 97l6-15-18 6z" fill={trim} />
          <path d="M44 26l3-17 6 15zM57 21l3-18 3 18zM67 24l6-15 3 17z" fill={trim} />
          <path d="M60 16l24 17-4 33-20 16-20-16-4-33z" fill={shell} {...rim} />
          <path d="M60 16l24 17-24 7-24-7z" fill="white" opacity=".07" />
          <g className="dw-eye" filter={glow} fill={p.glow}>
            <path d="M42 45l14 4.5-11 5zM78 45l-14 4.5 11 5z" />
          </g>
          <path d="M51 67l9 4 9-4" stroke={p.trim} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'ledger':
      return (
        <g>
          <path d="M14 121c4-24 22-34 46-34s42 10 46 34z" fill={body} {...rim} />
          <path d="M40 92l20 14 20-14" fill="none" stroke={trim} strokeWidth="2.6" />
          <path d="M60 104l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={trim} />
          <rect x="53" y="72" width="14" height="14" rx="4" fill={dark(p.shell, 45)} />
          <path d="M37 46c0-18 10-27 23-27s23 9 23 27l-2 16c-2 13-10 19-21 19s-19-6-21-19z" fill={shell} {...rim} />
          <rect x="40" y="42" width="40" height="15" rx="7.5" fill={visor} />
          <path d="M45 51q4-4 8 0" stroke={p.glow} strokeWidth="2.6" fill="none" strokeLinecap="round" filter={glow} className="dw-eye" />
          <circle cx="70" cy="50" r="10.5" fill={visor} stroke={trim} strokeWidth="3" />
          <circle cx="70" cy="50" r="3.6" fill={p.glow} filter={glow} className="dw-eye" />
          <path d="M79 58l5 10" stroke={trim} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="37" cy="50" r="4.5" fill="none" stroke={trim} strokeWidth="2.6" />
          <Spec d="M44 30c5-5 10-6 16-6" />
        </g>
      );
    case 'beacon':
      return (
        <g>
          <ellipse cx="60" cy="107" rx="22" ry="4" fill={`url(#${uid}-floor)`} />
          <g stroke={p.glow} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".75">
            <path d="M46 20a20 20 0 0128 0" />
            <path d="M40 13a29 29 0 0140 0" opacity=".55" />
          </g>
          <path d="M20 62a40 11 0 0080 0" fill="none" stroke={trim} strokeWidth="3.2" />
          <circle cx="60" cy="60" r="28" fill={shell} {...rim} />
          <path d="M20 62a40 11 0 0180 0" fill="none" stroke={trim} strokeWidth="3.2" opacity=".5" />
          <circle cx="60" cy="58" r="11" fill={visor} stroke={trim} strokeWidth="2" />
          <circle cx="60" cy="58" r="5" fill={p.glow} filter={glow} className="dw-eye" />
          <path d="M54 88l6 12 6-12" fill={trim} />
          <Spec d="M41 45c5-8 12-11 20-11" />
        </g>
      );
    default:
      return null;
  }
}

export default function CharacterAvatar({ id, size = 56, className = '', decorative = false }: { id: CharacterId; size?: number; className?: string; decorative?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const character = CHARACTERS[id];
  const label = decorative ? undefined : `${character.name}, ${character.role}`;

  if (id === 'sentinel') {
    return (
      <span className={`dw-avatar ${className}`} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={decorative || undefined}>
        <img src={`${import.meta.env.BASE_URL}characters/sentinel-portrait.webp`} alt="" width={size} height={size} decoding="async" loading="lazy" />
      </span>
    );
  }

  const p = PALETTE[character.crew];
  return (
    <span className={`dw-avatar ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={decorative || undefined}>
        <Defs uid={uid} p={p} />
        <rect width="120" height="120" fill={`url(#${uid}-bg)`} />
        <rect width="120" height="120" fill={`url(#${uid}-halo)`} />
        <Art id={id} uid={uid} p={p} />
      </svg>
    </span>
  );
}

const OPERATOR_TRIM: Record<OperatorLook['trim'], Palette> = {
  gold: PALETTE.bastion,
  accent: PALETTE.breach,
  violet: { ...PALETTE.rival, shell: PALETTE.breach.shell },
};

/** The learner's own avatar: an operator helmet in the cast's lit style, varied per account (visor,
 *  trim, antenna) so every learner looks distinct without uploading a photo. */
export function OperatorAvatar({ seed, size = 56, className = '', label }: { seed: string; size?: number; className?: string; label?: string }) {
  const uid = useId().replace(/:/g, '');
  const look = operatorLook(seed);
  const p = OPERATOR_TRIM[look.trim];
  const shell = `url(#${uid}-shell)`, body = `url(#${uid}-body)`, visor = `url(#${uid}-visor)`, trim = `url(#${uid}-trim)`, glow = `url(#${uid}-glow)`;
  const rim = { stroke: p.trim, strokeOpacity: 0.55, strokeWidth: 1.2 };
  return (
    <span className={`dw-avatar ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <Defs uid={uid} p={p} />
        <rect width="120" height="120" fill={`url(#${uid}-bg)`} />
        <rect width="120" height="120" fill={`url(#${uid}-halo)`} />
        <path d="M13 121c4-24 22-34 47-34s43 10 47 34z" fill={body} {...rim} />
        <path d="M42 93l18 11 18-11" fill="none" stroke={trim} strokeWidth="2.6" strokeLinecap="round" />
        <rect x="52" y="72" width="16" height="15" rx="4" fill={dark(p.shell, 45)} />
        {look.antenna && <><path d="M74 24l7-13" stroke={trim} strokeWidth="2.6" strokeLinecap="round" /><circle cx="82" cy="10" r="3.4" fill={p.glow} filter={glow} className="dw-eye" /></>}
        <path d="M36 46c0-18 11-27 24-27s24 9 24 27l-2 16c-2 13-11 19-22 19s-20-6-22-19z" fill={shell} {...rim} />
        {look.visor === 'band' && <><rect x="39" y="43" width="42" height="13" rx="6.5" fill={visor} /><rect x="45" y="47.5" width="30" height="3.6" rx="1.8" fill={p.glow} filter={glow} className="dw-eye" /></>}
        {look.visor === 'split' && <><path d="M39 44h42l-4 13H43z" fill={visor} /><g className="dw-eye" filter={glow} fill={p.glow}><path d="M45 48.5l11 2.6-1 3.2-11-2.6zM75 48.5l-11 2.6 1 3.2 11-2.6z" /></g></>}
        {look.visor === 'lens' && <><rect x="39" y="42" width="42" height="15" rx="7.5" fill={visor} /><g className="dw-eye" filter={glow} fill={p.glow}><circle cx="50" cy="49.5" r="3.6" /><circle cx="70" cy="49.5" r="3.6" /></g></>}
        <circle cx="35.5" cy="50" r="4.4" fill={trim} />
        <circle cx="84.5" cy="50" r="4.4" fill={trim} />
        <Spec d="M43 31c4-5 10-7 16-7" />
      </svg>
    </span>
  );
}
