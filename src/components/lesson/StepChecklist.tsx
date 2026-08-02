import { useEffect, useState } from 'react';
import { IconCheck } from '../layout/icons';

export interface GuidedStep {
  text: string;
  why?: string;
}

export type StepInput = string | GuidedStep;

interface StepChecklistProps {
  steps: StepInput[];
  title?: string;
  /** How many leading steps should already read as done, driven by real progress (commands run,
   *  flags captured) rather than the learner clicking a box. Manual clicks still layer on top of
   *  this for any step the auto-detection hasn't reached yet. */
  autoCheckedCount?: number;
}

function normalize(step: StepInput): GuidedStep {
  return typeof step === 'string' ? { text: step } : step;
}

export default function StepChecklist({ steps, title = 'Guided Steps', autoCheckedCount = 0 }: StepChecklistProps) {
  const items = steps.map(normalize);
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

  // `steps` can change (e.g. navigating directly from one lab/lesson to another without this
  // component unmounting, since the route component instance is reused). Without this, `checked`
  // would keep stale completion state from the previous set of steps.
  useEffect(() => {
    setChecked(items.map(() => false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const toggle = (i: number) => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));
  const isAutoChecked = (i: number) => i < autoCheckedCount;
  const isDone = (i: number) => checked[i] || isAutoChecked(i);
  const doneCount = items.filter((_, i) => isDone(i)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-heading)]">{title}</h2>
        <span className="text-xs font-mono text-[var(--color-text-dim)]">{doneCount}/{items.length}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((step, i) => {
          const done = isDone(i);
          const auto = isAutoChecked(i) && !checked[i];
          return (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-start gap-2.5 text-left group"
                type="button"
                title={auto ? 'Auto-detected as complete — click to override' : undefined}
                aria-pressed={done}
              >
                <span
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-2xs font-bold transition-colors ${
                    done
                      ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-dim)] group-hover:border-[var(--color-accent)]'
                  }`}
                >
                  {done ? <IconCheck className="w-3 h-3" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm leading-snug pt-0.5 ${
                      done ? 'text-[var(--color-text-dim)] line-through decoration-1' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {step.text}
                  </span>
                  {step.why && (
                    <span className="block text-xs text-[var(--color-text-dim)] mt-0.5 leading-snug">
                      <span className="font-semibold text-[var(--color-accent-dim)]">Why: </span>
                      {step.why}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
