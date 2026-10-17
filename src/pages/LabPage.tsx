import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { findLab } from '../data/labs';
import { useProgress } from '../state/progressStore';
import Terminal, { type TerminalHandle } from '../components/terminal/Terminal';
import type { LabSnapshot } from '../labs/engine';
import LiveWebsiteLab from '../components/labs/LiveWebsiteLab';
import DirectoryAttackGraph from '../components/labs/DirectoryAttackGraph';
import PreSecurityWorkbench from '../components/labs/PreSecurityWorkbench';
import StepChecklist from '../components/lesson/StepChecklist';
import ShareWriteupModal from '../components/labs/ShareWriteupModal';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabRatingWidget from '../components/labs/LabRatingWidget';
import LabComments from '../components/labs/LabComments';
import DifficultyPill from '../components/common/DifficultyPill';
import LabLearningBridge from '../components/labs/LabLearningBridge';
import LabAccess from '../components/labs/LabAccess';
import { IconFlag, IconCheck } from '../components/layout/icons';

export default function LabPage() {
  const { labSlug } = useParams();
  const progress = useProgress();
  const [sharing, setSharing] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const entry = findLab(labSlug);
  const scenarioId = entry?.scenario.id;
  const transcriptRef = useRef('');
  const terminalRef = useRef<TerminalHandle>(null);
  const [snapshot, setSnapshot] = useState<LabSnapshot>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    transcriptRef.current = '';
  }, [scenarioId]);

  if (!entry) return <Navigate to="/" replace />;
  const { scenario } = entry;
  const captured = progress.flagCount(scenario.id);
  const done = captured >= scenario.totalFlags;
  const progressPct = Math.round((100 * captured) / Math.max(scenario.totalFlags, 1));
  // Ties off to real, verified progress (flags actually captured), not commands typed — typing
  // wrong or unrelated commands must never tick a guided step off. Steps and flags aren't 1:1 in
  // every lab, so this checks off a proportional share of the list per flag captured, and only
  // guarantees the full list once every flag is in.
  const autoCheckedCount = done
    ? scenario.objectives.length
    : Math.floor((scenario.objectives.length * captured) / Math.max(scenario.totalFlags, 1));

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden lg:flex-row">
      <aside className="lg:w-[26rem] min-h-0 max-h-[42%] lg:max-h-none shrink-0 overscroll-contain border-b lg:border-b-0 lg:border-r border-[var(--color-border)] surface-glass overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] surface-glass px-4 py-3 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <DifficultyPill difficulty={scenario.difficulty} />
              <span className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">{scenario.category}</span>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-text-dim)]">
              <IconFlag className="h-3.5 w-3.5" />
              {captured}/{scenario.totalFlags}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-[var(--color-heading)] mb-2 sm:mb-3">{scenario.title}</h1>
        <LabAccess scenario={scenario} />
        <button className="lg:hidden mb-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)]" aria-expanded={guideExpanded} aria-controls="lab-guide-panel" onClick={() => setGuideExpanded(value => !value)}>{guideExpanded ? 'Hide briefing & guide' : 'Show briefing & guide'}</button>
        <div id="lab-guide-panel" className={guideExpanded ? '' : 'hidden lg:block'}>
        <p className="text-xs sm:text-sm text-[var(--color-text-dim)] leading-relaxed mb-4 sm:mb-5">{scenario.briefing}</p>
        <LabLearningBridge scenario={scenario} />
        {/* The single most important thing to see the moment the last flag lands — placed before the
            checklist instead of appended after it, so it's never buried below a long objectives list. */}
        {done && (
          <div
            className="premium-card rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)] mb-3">
              <IconCheck className="w-4 h-4" /> Lab complete — all flags captured!
            </div>
            <button
              onClick={() => setSharing(true)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Open evidence notebook &rarr;
            </button>
          </div>
        )}

        {done && <LabRatingWidget labId={scenario.id} />}

        <div className="mb-6">
          <StepChecklist steps={scenario.objectives} autoCheckedCount={autoCheckedCount} title="Lab Guide" variant="prominent" />
        </div>

        {!done && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)] leading-relaxed">
            Stuck? {scenario.preSecurityTool ? 'Use the guided controls in the tool bench and compare each result to the lab guide.' : <>Type <code className="text-[var(--color-accent-2)]">hint</code> in the terminal for a
            progressive nudge, or <code className="text-[var(--color-accent-2)]">objectives</code> to
            re-read your goals. Type <code className="text-[var(--color-accent-2)]">help</code> for the full
            command list.</>}
          </div>
        )}

        <LabComments labId={scenario.id} />
        </div>
        </div>
      </aside>

      <section className="flex flex-1 min-w-0 min-h-0 flex-col gap-3 overflow-hidden bg-[var(--color-bg)] p-2 sm:p-4" aria-label="Lab workspace">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 premium-card rounded-2xl px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-dim)]">Workspace</p>
            <p className="truncate text-xs text-[var(--color-text-dim)]">{scenario.preSecurityTool ? 'Guided tool bench' : scenario.webApplication || scenario.directoryMap ? 'Terminal synced with visual evidence' : 'Attack terminal'}</p>
          </div>
          <button onClick={() => setSharing(true)} className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface-2)]">{done ? 'Evidence notebook & certificate' : 'Evidence notebook'}</button>
        </div>
        {(scenario.webApplication || scenario.directoryMap) && <div className="min-h-0 max-h-[45%] shrink overflow-y-auto overscroll-contain premium-card rounded-2xl p-2" aria-label="Visual lab evidence">
        {scenario.webApplication && <LiveWebsiteLab application={scenario.webApplication} snapshot={snapshot?.scenarioId === scenario.id ? snapshot.webApplication : undefined} onCommand={command => terminalRef.current?.executeCommand(command)} disabled={busy} />}
        {scenario.directoryMap && <DirectoryAttackGraph key={scenario.id} map={scenario.directoryMap} snapshot={snapshot?.scenarioId === scenario.id ? snapshot : undefined} />}
        </div>}
        <div className="min-h-0 flex-1 overflow-hidden">
        {scenario.preSecurityTool ? (
          <PreSecurityWorkbench
            key={scenario.id}
            mode={scenario.preSecurityTool}
            scenarioId={scenario.id}
            onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag, scenario.totalFlags)}
            onTranscriptChange={(transcript) => {
              transcriptRef.current = transcript;
            }}
          />
        ) : (
          <Terminal
            key={scenario.id}
            ref={terminalRef}
            onStateChange={setSnapshot}
            onBusyChange={setBusy}
            scenario={scenario}
            onFlagCaptured={(flag) => progress.captureFlag(scenario.id, flag, scenario.totalFlags)}
            onTranscriptChange={(transcript) => {
              transcriptRef.current = transcript;
            }}
          />
        )}
        </div>
      </section>

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
