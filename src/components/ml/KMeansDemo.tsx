import { useState } from 'react';
import { kmeans, parseCsvPoints } from '../../lib/mlMath';
import ScatterChart from './ScatterChart';

const SAMPLE = `2,2
2.5,1.8
1.8,2.4
2.2,2.1
1.5,1.9
8,3
8.5,2.7
7.8,3.3
8.2,3.1
7.5,2.9
5,9
5.4,8.7
4.8,9.3
5.2,9.1
4.9,8.8`;

const PALETTE = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warn)', 'var(--color-danger)', '#c48bee', '#5ec9d6'];

export default function KMeansDemo() {
  const [csv, setCsv] = useState(SAMPLE);
  const [k, setK] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState(() => kmeans(parseCsvPoints(SAMPLE), 3));

  const run = () => {
    try {
      setResult(kmeans(parseCsvPoints(csv), k));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const clusterCount = Math.max(...result.points.map((p) => p.cluster), -1) + 1;
  const clusterSeries = Array.from({ length: clusterCount }, (_, c) => ({
    label: `cluster ${c}`,
    points: result.points.filter((p) => p.cluster === c),
    color: PALETTE[c % PALETTE.length],
    kind: 'points' as const,
  }));

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="font-bold text-[var(--color-heading)] mb-3">Try it: k-means Clustering</h3>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            spellCheck={false}
            className="w-full h-40 resize-none bg-[var(--term-bg)] text-[var(--term-output)] font-mono text-xs p-3 rounded-lg border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]/60"
          />
          <div className="flex items-center gap-3 mt-2">
            <label className="text-xs text-[var(--color-text-dim)] flex items-center gap-1.5">
              k
              <input
                type="number"
                min={1}
                max={6}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-14 bg-[var(--term-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded px-1.5 py-1"
              />
            </label>
            <button
              onClick={run}
              className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Run
            </button>
            <button
              onClick={() => setCsv(SAMPLE)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Load sample data
            </button>
          </div>
          {error && <p className="text-xs text-[var(--color-danger)] mt-2">{error}</p>}
        </div>
        <div>
          <ScatterChart
            series={[
              ...clusterSeries,
              { label: 'centroids', points: result.centroids, color: 'var(--color-heading)', kind: 'cross' },
            ]}
          />
          <p className="text-xs text-[var(--color-text-dim)] font-mono mt-2">
            k = {result.k}, converged in {result.iterations} iteration(s)
          </p>
        </div>
      </div>
    </div>
  );
}
