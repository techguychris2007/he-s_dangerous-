import './stat-card.css';

/** Single canonical stat tile used across the dashboard, progress and profile pages. The icon sits in
 *  a navy chrome tile (the platform's game-piece look); `color` tints the icon so categories stay
 *  distinguishable without pastel backgrounds. Without an icon the tile centres its text. */
export default function StatCard({
  icon,
  color = 'var(--chrome-highlight)',
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
      <div className="dw-stat dw-stat--plain">
        <div className="dw-stat__value">{value}</div>
        <div className="dw-stat__label">{label}</div>
      </div>
    );
  }
  return (
    <div className="dw-stat" style={{ '--stat': color } as React.CSSProperties}>
      <span className="dw-stat__icon">{icon}</span>
      <div className="min-w-0">
        <div className="dw-stat__value">{value}</div>
        <div className="dw-stat__label">{label}</div>
      </div>
    </div>
  );
}
