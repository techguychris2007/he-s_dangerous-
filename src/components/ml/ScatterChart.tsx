export interface ScatterSeries {
  label: string;
  points: { x: number; y: number }[];
  color: string;
  kind?: 'points' | 'line' | 'cross';
}

interface ScatterChartProps {
  series: ScatterSeries[];
  height?: number;
}

const WIDTH = 560;
const PAD = 36;

/** A small dependency-free SVG scatter/line chart — kept hand-rolled rather than pulling in a
 *  charting library, since these two demos are the only place in the app that need one. */
export default function ScatterChart({ series, height = 320 }: ScatterChartProps) {
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-[var(--color-text-dim)]" style={{ height }}>
        No data to plot yet.
      </div>
    );
  }

  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const xPadAmt = xSpan * 0.1;
  const yPadAmt = ySpan * 0.1;

  const toSvgX = (x: number) => PAD + ((x - (xMin - xPadAmt)) / (xSpan + 2 * xPadAmt)) * (WIDTH - 2 * PAD);
  const toSvgY = (y: number) => height - PAD - ((y - (yMin - yPadAmt)) / (ySpan + 2 * yPadAmt)) * (height - 2 * PAD);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full h-auto" role="img" aria-label="Chart">
      <rect x={0} y={0} width={WIDTH} height={height} fill="none" />
      {/* axes */}
      <line x1={PAD} y1={height - PAD} x2={WIDTH - PAD} y2={height - PAD} stroke="var(--color-border)" strokeWidth={1} />
      <line x1={PAD} y1={PAD} x2={PAD} y2={height - PAD} stroke="var(--color-border)" strokeWidth={1} />

      {series.map((s) => {
        if (s.kind === 'line') {
          const sorted = [...s.points].sort((a, b) => a.x - b.x);
          const d = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ');
          return <path key={s.label} d={d} fill="none" stroke={s.color} strokeWidth={2} />;
        }
        if (s.kind === 'cross') {
          return (
            <g key={s.label}>
              {s.points.map((p, i) => {
                const cx = toSvgX(p.x);
                const cy = toSvgY(p.y);
                const r = 7;
                return (
                  <g key={i} stroke={s.color} strokeWidth={2.5}>
                    <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} />
                    <line x1={cx - r} y1={cy + r} x2={cx + r} y2={cy - r} />
                  </g>
                );
              })}
            </g>
          );
        }
        return (
          <g key={s.label}>
            {s.points.map((p, i) => (
              <circle key={i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={4} fill={s.color} opacity={0.85} />
            ))}
          </g>
        );
      })}

      {/* legend */}
      <g>
        {series.map((s, i) => (
          <g key={s.label} transform={`translate(${PAD + i * 110}, ${14})`}>
            <rect width={10} height={10} rx={2} fill={s.color} />
            <text x={14} y={9} fontSize={10} fill="var(--color-text-dim)">{s.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
