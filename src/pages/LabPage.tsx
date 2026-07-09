import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findLab } from '../data/labs';
import { useProgress } from '../state/progressStore';
import Terminal from '../components/terminal/Terminal';
import StepChecklist from '../components/lesson/StepChecklist';
import ShareWriteupModal from '../components/labs/ShareWriteupModal';
import { IconFlag, IconCheck } from '../components/layout/icons';

export default function LabPage() {
  const { labSlug } = useParams();
  const progress = useProgress();
  const [sharing, setSharing] = useState(false);
  const entry = findLab(labSlug);
  if (!entry) return <Navigate to="/" replace />;
  const { scenario } = entry;
  const captured = progress.flagCount(scenario.id);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`pill ${
              scenario.difficulty === 'Easy'
                ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                : scenario.difficulty === 'Medium'
                ? 'bg-[var(--color-warn)]/15 text-[var(--color-warn)]'
                : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
            }`}
          >
            {scenario.difficulty}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-dim)]">
            <IconFlag className="w-3.5 h-3.5" />
            {captured}/{scenario.totalFlags} flags
          </span>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-heading)] mb-3">{scenario.title}</h1>
        <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5">{scenario.briefing}</p>

        <div className="mb-6">
          <StepChecklist steps={scenario.objectives} />
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)] leading-relaxed">
          Stuck? Type <code className="text-[var(--color-accent-2)]">hint</code> in the terminal for a
          progressive nudge, or <code className="text-[var(--color-accent-2)]">objectives</code> to
          re-read your goals. Type <code className="text-[var(--color-accent-2)]">help</code> for the full
          command list.
        </div>

        {captured >= scenario.totalFlags && (
          <div className="mt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)] mb-3">
              <IconCheck className="w-4 h-4" /> Lab complete — all flags captured!
            </div>
            <button
              onClick={() => setSharing(true)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-navy)] text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Generate shareable documentation &rarr;
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[420px] p-4">
        <Terminal scenario={scenario} onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag)} />
      </div>

      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}
    </div>
  );
}
