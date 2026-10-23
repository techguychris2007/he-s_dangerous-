/** Circular completion ring for room-style cards — the at-a-glance "how far am I" of a lab or module. */
export default function ProgressRing({ value, size = 44, stroke = 4, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = pct === 100;
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${pct}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={done ? 'var(--color-success)' : 'var(--color-accent)'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <span className="absolute text-2xs font-black text-[var(--color-heading)] font-mono" aria-hidden="true">{pct}%</span>
    </span>
  );
}
