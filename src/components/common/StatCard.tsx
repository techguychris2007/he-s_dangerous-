/** Single canonical stat tile — previously reimplemented separately in HomePage (icon + accent
 *  color) and ProgressPage (no icon, different padding/text size), so the same kind of stat looked
 *  inconsistent between the two pages showing it. `icon`/`color` are optional; when there's no icon
 *  the tile centers its text instead of leaving a dangling gap where an icon would have been. */
export default function StatCard({
  icon,
  color = 'var(--color-accent)',
  label,
  value,
}: {
  icon?: React.ReactNode;
  color?: string;
  label: string;
  value: string | number;
}) {
  if (!icon) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col items-center justify-center text-center">
        <div className="text-xl font-extrabold text-[var(--color-heading)] leading-none mb-1">{value}</div>
        <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wide">{label}</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex items-center gap-4">
      <span
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
      >
        {icon}
      </span>
      <div>
        <div className="text-xl font-extrabold text-[var(--color-heading)] leading-none mb-1">{value}</div>
        <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
