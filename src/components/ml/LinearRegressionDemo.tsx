import { useState } from 'react';
import { linearRegression, parseCsvPoints } from '../../lib/mlMath';
import ScatterChart from './ScatterChart';

const SAMPLE = `1,2.1
2,4.3
3,5.8
4,8.2
5,9.9
6,12.3
7,13.8
8,16.1
9,17.9
10,20.2`;

export default function LinearRegressionDemo() {
  const [csv, setCsv] = useState(SAMPLE);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState(() => linearRegression(parseCsvPoints(SAMPLE)));

  const run = () => {
    try {
      setResult(linearRegression(parseCsvPoints(csv)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const sorted = [...result.points].sort((a, b) => a.x - b.x);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="font-bold text-[var(--color-heading)] mb-3">Try it: Linear Regression</h3>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            spellCheck={false}
            className="w-full h-40 resize-none bg-[var(--term-bg)] text-[var(--term-output)] font-mono text-xs p-3 rounded-lg border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]/60"
          />
          <div className="flex gap-2 mt-2">
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
              { label: 'data', points: result.points, color: 'var(--color-accent)', kind: 'points' },
              { label: 'fit', points: sorted.map((p) => ({ x: p.x, y: p.yhat })), color: 'var(--color-success)', kind: 'line' },
            ]}
          />
          <p className="text-xs text-[var(--color-text-dim)] font-mono mt-2">
            slope = {result.slope.toFixed(4)}, intercept = {result.intercept.toFixed(4)}, MSE = {result.mse.toFixed(4)}
          </p>
        </div>
      </div>
    </div>
  );
}
