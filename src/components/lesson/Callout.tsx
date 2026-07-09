import type { ReactNode } from 'react';

type Variant = 'info' | 'warn' | 'danger' | 'tip';

const STYLES: Record<Variant, { border: string; bg: string; label: string; labelColor: string }> = {
  info: { border: 'border-[var(--color-accent-2)]/40', bg: 'bg-[var(--color-accent-2)]/5', label: 'NOTE', labelColor: 'text-[var(--color-accent-2)]' },
  tip: { border: 'border-[var(--color-accent)]/40', bg: 'bg-[var(--color-accent)]/5', label: 'TIP', labelColor: 'text-[var(--color-accent)]' },
  warn: { border: 'border-[var(--color-warn)]/40', bg: 'bg-[var(--color-warn)]/5', label: 'CAUTION', labelColor: 'text-[var(--color-warn)]' },
  danger: { border: 'border-[var(--color-danger)]/40', bg: 'bg-[var(--color-danger)]/5', label: 'LEGAL / ETHICS', labelColor: 'text-[var(--color-danger)]' },
};

export default function Callout({ variant = 'info', children }: { variant?: Variant; children: ReactNode }) {
  const s = STYLES[variant];
  return (
    <div className={`my-4 rounded-lg border ${s.border} ${s.bg} p-4`}>
      <div className={`text-xs font-bold tracking-wide mb-1.5 ${s.labelColor}`}>{s.label}</div>
      <div className="text-sm text-[var(--color-text)] leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
