import { useId } from 'react';
import './dig.css';

/** Original vector scout: bevelled shell, glass visor and an orbital search antenna. */
export default function DigAvatar({ size = 48, decorative = true, thinking = false }: { size?: number; decorative?: boolean; thinking?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return <svg className={`dig-avatar${thinking ? ' dig-avatar--thinking' : ''}`} width={size} height={size} viewBox="0 0 128 128" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : 'dig, your learning and library assistant'}>
    <defs>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--chrome-highlight)"/><stop offset=".4" stopColor="var(--color-accent)"/><stop offset="1" stopColor="var(--chrome-bg)"/></linearGradient>
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--chrome-text)"/><stop offset=".3" stopColor="var(--chrome-line-strong)"/><stop offset="1" stopColor="var(--chrome-bg)"/></linearGradient>
      <linearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--chrome-raise)"/><stop offset=".7" stopColor="var(--chrome-bg)"/><stop offset="1" stopColor="var(--chrome-line-strong)"/></linearGradient>
      <radialGradient id={`${id}g`} cx=".3" cy=".2"><stop stopColor="var(--chrome-ink)"/><stop offset=".5" stopColor="var(--color-gold)"/><stop offset="1" stopColor="var(--color-accent)"/></radialGradient>
    </defs>
    <ellipse cx="64" cy="116" rx="35" ry="6" fill="var(--chrome-bg)" opacity=".18"/>
    <g className="dig-avatar__scout">
      <path d="M64 31V19l14-7" fill="none" stroke={`url(#${id}b)`} strokeWidth="6" strokeLinecap="round"/>
      <circle cx="81" cy="11" r="5" fill={`url(#${id}g)`}/>
      <ellipse cx="81" cy="11" rx="11" ry="5" fill="none" stroke="var(--color-gold)" strokeWidth="1.3" opacity=".7" transform="rotate(-28 81 11)"/>
      <path d="M35 37 64 27l30 12 12 24-6 29-29 21-32-13-15-26z" fill={`url(#${id}b)`}/>
      <path d="M32 42 60 30l31 10 11 24-8 27-28 15-29-12-12-24z" fill={`url(#${id}s)`} stroke="var(--chrome-highlight)" strokeWidth="1.5"/>
      <path d="m32 42 28-12 31 10-29 3z" fill="var(--chrome-ink)" opacity=".35"/>
      <path d="m94 91-28 15 5 7 29-21 6-29-4 1z" fill="var(--chrome-bg)" opacity=".6"/>
      <rect x="34" y="48" width="59" height="40" rx="17" fill={`url(#${id}v)`} stroke="var(--chrome-bg)" strokeWidth="3"/>
      <path d="M42 55q19-10 41 0" fill="none" stroke="var(--chrome-ink)" strokeWidth="2" opacity=".18" strokeLinecap="round"/>
      <rect className="dig-avatar__eye" x="45" y="61" width="10" height="15" rx="5" fill="var(--chrome-highlight)"/>
      <rect className="dig-avatar__eye" x="73" y="61" width="10" height="15" rx="5" fill="var(--chrome-highlight)"/>
      <circle cx="49" cy="64" r="2" fill="var(--chrome-ink)"/><circle cx="77" cy="64" r="2" fill="var(--chrome-ink)"/>
      <path d="m59 78 5 3 5-3" fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="64" cy="96" r="4" fill={`url(#${id}g)`}/>
      <path d="m24 64-8 5 3 13 9-2m74-16 9 5-3 13-10-2" fill={`url(#${id}b)`} stroke="var(--chrome-line-strong)" strokeWidth="1.5"/>
    </g>
  </svg>;
}
