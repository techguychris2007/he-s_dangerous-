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
      <div className="premium-card rounded-2xl p-5 flex flex-col items-center justify-center text-center">
        <div className="text-xl font-extrabold text-[var(--color-heading)] leading-none mb-1">{value}</div>
        <div className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wide">{label}</div>
      </div>
    );
  }
  return (
    <div className="premium-card premium-card-hover rounded-2xl p-5 flex items-center gap-4 overflow-hidden">
      <span
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
      >
        {icon}
      </span>
      <div>
        <div className="text-2xl font-black tracking-[-0.04em] text-[var(--color-heading)] leading-none mb-1">{value}</div>
        <div className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
