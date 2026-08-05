import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findLab } from '../data/labs';
import { useProgress } from '../state/progressStore';
import Terminal from '../components/terminal/Terminal';
import StepChecklist from '../components/lesson/StepChecklist';
import ShareWriteupModal from '../components/labs/ShareWriteupModal';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabRatingWidget from '../components/labs/LabRatingWidget';
import LabComments from '../components/labs/LabComments';
import DifficultyPill from '../components/common/DifficultyPill';
import { IconFlag, IconCheck } from '../components/layout/icons';

export default function LabPage() {
  const { labSlug } = useParams();
  const progress = useProgress();
  const [sharing, setSharing] = useState(false);
  const entry = findLab(labSlug);
  const scenarioId = entry?.scenario.id;
  const transcriptRef = useRef('');

  useEffect(() => {
    transcriptRef.current = '';
  }, [scenarioId]);

  if (!entry) return <Navigate to="/" replace />;
  const { scenario } = entry;
  const captured = progress.flagCount(scenario.id);
  const done = captured >= scenario.totalFlags;
  // Ties off to real, verified progress (flags actually captured), not commands typed — typing
  // wrong or unrelated commands must never tick a guided step off. Steps and flags aren't 1:1 in
  // every lab, so this checks off a proportional share of the list per flag captured, and only
  // guarantees the full list once every flag is in.
  const autoCheckedCount = done
    ? scenario.objectives.length
    : Math.floor((scenario.objectives.length * captured) / Math.max(scenario.totalFlags, 1));

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <DifficultyPill difficulty={scenario.difficulty} />
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-dim)]">
            <IconFlag className="w-3.5 h-3.5" />
            {captured}/{scenario.totalFlags} flags
          </span>
        </div>
        <div className="h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
            style={{ width: `${Math.round((100 * captured) / scenario.totalFlags)}%` }}
          />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight leading-tight text-[var(--color-heading)] mb-3">{scenario.title}</h1>
        <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5">{scenario.briefing}</p>

        {/* The single most important thing to see the moment the last flag lands — placed before the
            checklist instead of appended after it, so it's never buried below a long objectives list. */}
        {done && (
          <div
            className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 mb-6"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)] mb-3">
              <IconCheck className="w-4 h-4" /> Lab complete — all flags captured!
            </div>
            <button
              onClick={() => setSharing(true)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Generate shareable documentation &rarr;
            </button>
          </div>
        )}

        {done && <LabRatingWidget labId={scenario.id} />}

        <div className="mb-6">
          <StepChecklist steps={scenario.objectives} autoCheckedCount={autoCheckedCount} title="Lab Guide" variant="prominent" />
        </div>

        {!done && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)] leading-relaxed">
            Stuck? Type <code className="text-[var(--color-accent-2)]">hint</code> in the terminal for a
            progressive nudge, or <code className="text-[var(--color-accent-2)]">objectives</code> to
            re-read your goals. Type <code className="text-[var(--color-accent-2)]">help</code> for the full
            command list.
          </div>
        )}

        <LabComments labId={scenario.id} />
      </div>

      <div className="flex-1 min-h-[420px] p-4">
        <Terminal
          scenario={scenario}
          onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag)}
          onTranscriptChange={(transcript) => {
            transcriptRef.current = transcript;
          }}
        />
      </div>

      {sharing && <ShareWriteupModal entry={entry} onClose={() => setSharing(false)} />}

      <CyberLabAI
        key={scenario.id}
        getContext={() => ({
          kind: 'lab',
          title: scenario.title,
          subtitle: `${scenario.difficulty} · ${scenario.category}`,
          bodyText:
            scenario.briefing +
            '\n\nGuided steps:\n' +
            scenario.objectives
              .map((o, i) => {
                const step = typeof o === 'string' ? { text: o } : o;
                return `${i + 1}. ${step.text}${step.why ? ` (Why: ${step.why})` : ''}`;
              })
              .join('\n'),
          terminalTranscript: transcriptRef.current,
        })}
      />
    </div>
  );
}
