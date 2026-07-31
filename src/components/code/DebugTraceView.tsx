import { useEffect, useMemo, useRef, useState } from 'react';
import type { TraceStep } from '../../lib/pyodideRunner';

interface DebugTraceViewProps {
  code: string;
  steps: TraceStep[];
  stepLimitHit: boolean;
}

/** Step-through visualization over a real CPython execution trace (see runPythonTraced): highlights
 *  the exact line the interpreter is about to run and shows local-variable state at that point,
 *  with changed-since-last-step values called out — the "why did my code do that" view a printf/
 *  Run-tests loop can't give you. */
export default function DebugTraceView({ code, steps, stepLimitHit }: DebugTraceViewProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const codeLines = useMemo(() => code.split('\n'), [code]);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [steps]);

  useEffect(() => {
    if (!playing) return;
    if (index >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), 450);
    return () => clearTimeout(t);
  }, [playing, index, steps.length]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'center' });
  }, [index]);

  if (steps.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs text-[var(--color-text-dim)]">
        No trace was captured — the code likely failed before any line ran (e.g. a syntax error). Check the output above.
      </div>
    );
  }

  const current = steps[index];
  const previous = index > 0 ? steps[index - 1] : null;
  const localEntries = Object.entries(current.locals);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] flex-wrap">
        <button
          onClick={() => setIndex(0)}
          disabled={index === 0}
          className="px-2 py-1 rounded text-xs font-mono text-[var(--color-text-dim)] hover:text-[var(--color-heading)] disabled:opacity-30"
          aria-label="Jump to first step"
        >
          ⏮
        </button>
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="px-2 py-1 rounded text-xs font-mono text-[var(--color-text-dim)] hover:text-[var(--color-heading)] disabled:opacity-30"
          aria-label="Previous step"
        >
          ◀ Prev
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="px-2.5 py-1 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-xs font-semibold hover:bg-[var(--color-accent)]/25"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={index === steps.length - 1}
          className="px-2 py-1 rounded text-xs font-mono text-[var(--color-text-dim)] hover:text-[var(--color-heading)] disabled:opacity-30"
          aria-label="Next step"
        >
          Next ▶
        </button>
        <button
          onClick={() => setIndex(steps.length - 1)}
          disabled={index === steps.length - 1}
          className="px-2 py-1 rounded text-xs font-mono text-[var(--color-text-dim)] hover:text-[var(--color-heading)] disabled:opacity-30"
          aria-label="Jump to last step"
        >
          ⏭
        </button>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="flex-1 min-w-[80px]"
          aria-label="Step scrubber"
        />
        <span className="text-xs font-mono text-[var(--color-text-dim)] shrink-0">
          Step {index + 1}/{steps.length}
        </span>
      </div>

      {stepLimitHit && index === steps.length - 1 && (
        <div className="px-3 py-2 text-xs text-[var(--color-warn)] bg-[var(--color-warn)]/10 border-b border-[var(--color-border)]">
          Trace stopped early — this looks like an infinite loop (hit the step limit).
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
        <div className="max-h-72 overflow-y-auto font-mono text-xs">
          {codeLines.map((line, i) => {
            const lineNo = i + 1;
            const isActive = lineNo === current.line;
            return (
              <div
                key={i}
                ref={isActive ? activeLineRef : undefined}
                className={`flex px-2 py-0.5 ${isActive ? 'bg-[var(--color-accent)]/15' : ''}`}
              >
                <span className="w-8 shrink-0 text-right pr-2 text-[var(--color-text-dim)] select-none">{lineNo}</span>
                <span className={isActive ? 'text-[var(--color-heading)] font-semibold' : 'text-[var(--color-text)]'}>
                  {isActive && <span className="text-[var(--color-accent)] mr-1">&rarr;</span>}
                  {line || ' '}
                </span>
              </div>
            );
          })}
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-dim)] px-1.5 mb-1.5">
            Local variables
          </div>
          {localEntries.length === 0 ? (
            <div className="text-xs text-[var(--color-text-dim)] px-1.5">(none yet)</div>
          ) : (
            <table className="w-full text-xs font-mono">
              <tbody>
                {localEntries.map(([name, value]) => {
                  const changed = !previous || previous.locals[name] !== value;
                  return (
                    <tr key={name}>
                      <td className="align-top py-0.5 pr-2 text-[var(--color-accent-2)] whitespace-nowrap">{name}</td>
                      <td
                        className={`align-top py-0.5 break-all ${
                          changed ? 'text-[var(--color-heading)] font-semibold' : 'text-[var(--color-text-dim)]'
                        }`}
                      >
                        {value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
