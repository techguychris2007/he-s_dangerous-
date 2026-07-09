import { useState } from 'react';
import { IconCheck } from '../layout/icons';

export interface GuidedStep {
  text: string;
  why?: string;
}

export type StepInput = string | GuidedStep;

interface StepChecklistProps {
  steps: StepInput[];
  title?: string;
}

function normalize(step: StepInput): GuidedStep {
  return typeof step === 'string' ? { text: step } : step;
}

export default function StepChecklist({ steps, title = 'Guided Steps' }: StepChecklistProps) {
  const items = steps.map(normalize);
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const toggle = (i: number) => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));
  const doneCount = checked.filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-heading)]">{title}</h2>
        <span className="text-xs font-mono text-[var(--color-text-dim)]">{doneCount}/{items.length}</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((step, i) => (
          <li key={i}>
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-start gap-2.5 text-left group"
              type="button"
            >
              <span
                className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-[10px] font-bold transition-colors ${
                  checked[i]
                    ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-dim)] group-hover:border-[var(--color-accent)]'
                }`}
              >
                {checked[i] ? <IconCheck className="w-3 h-3" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm leading-snug pt-0.5 ${
                    checked[i] ? 'text-[var(--color-text-dim)] line-through decoration-1' : 'text-[var(--color-text)]'
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
        ))}
      </ul>
    </div>
  );
}
