import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { SIEM_LABS } from '../labs/siemScenarios';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import StepChecklist from '../components/lesson/StepChecklist';
import SiemConsole from '../components/siem/SiemConsole';
import InvestigationWorkbench from '../components/siem/InvestigationWorkbench';
import OsintTerminal from '../components/labs/OsintTerminal';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabComments from '../components/labs/LabComments';
import DifficultyPill from '../components/common/DifficultyPill';
import ShareWriteupModal from '../components/labs/ShareWriteupModal';
import LabLearningBridge from '../components/labs/LabLearningBridge';
import { IconFlag, IconCheck } from '../components/layout/icons';

const TOOL_LABEL: Record<string, string> = {
  suricata: 'Suricata',
  chronicle: 'Chronicle',
  tcpdump: 'tcpdump',
  splunk: 'Splunk',
  sentinel: 'Microsoft Sentinel',
  qradar: 'IBM QRadar',
  elastic: 'Elastic Security',
  shodan: 'Shodan',
  sherlock: 'Sherlock',
  maltego: 'Maltego',
  eyewitness: 'EyeWitness',
  theharvester: 'theHarvester',
};

/** Cinematic story banner shown at the top of gamified narrative SIEM labs. */
function NarrativeBanner({
  narrative,
  done,
}: {
  narrative: NonNullable<(typeof SIEM_LABS)[0]['narrative']>;
  done: boolean;
}) {
  return (
    <div className="mb-5 rounded-xl overflow-hidden border border-[var(--color-border)]">
      {/* Story header */}
      <div
        className="px-4 py-4 relative"
        style={{
          background:
            'linear-gradient(135deg, var(--color-navy) 0%, color-mix(in srgb, var(--color-navy) 70%, var(--color-accent-2)) 100%)',
        }}
      >
        {/* Decorative grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            {narrative.emoji && (
              <span className="text-xl" aria-hidden>
                {narrative.emoji}
              </span>
            )}
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/60">
              Case File — {narrative.victim}
            </span>
          </div>
          <div className="text-white font-bold text-base leading-snug mb-2">{narrative.hook}</div>
          {done && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-success)]/20 border border-[var(--color-success)]/40 text-[var(--color-success)] text-xs font-bold">
              <IconCheck className="w-3 h-3" /> Case closed
            </div>
          )}
        </div>
      </div>

      {/* Story body */}
      <div className="bg-[var(--color-surface-2)] px-4 py-3">
        <p className="text-xs text-[var(--color-text)] leading-relaxed mb-3">{narrative.scene}</p>

        <div className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-3 py-2.5 mb-3">
          <div className="text-2xs font-mono uppercase tracking-wide text-[var(--color-accent)] mb-1">
            🕵️ Your Mission
          </div>
          <p className="text-xs text-[var(--color-text)] leading-relaxed">{narrative.mission}</p>
        </div>

        {/* Chapter pills */}
        <div className="flex flex-wrap gap-1.5">
          {narrative.chapters.map((ch, i) => (
            <span
              key={i}
              className="inline-block text-2xs font-semibold px-2 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)]"
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SiemLabPage() {
  const { labId } = useParams();
  const progress = useProgress();
  const [hintIndex, setHintIndex] = useState(0);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const siemScenario = SIEM_LABS.find((s) => s.id === labId);
  const osintScenario = OSINT_LABS.find((s) => s.id === labId);
  const scenario = siemScenario ?? osintScenario;
  const isOsint = !siemScenario && !!osintScenario;
  const transcriptRef = useRef('');

  useEffect(() => {
    setHintIndex(0);
    setGuideExpanded(false);
    setSharing(false);
    transcriptRef.current = '';
  }, [labId]);

  if (!scenario) return <Navigate to="/labs" replace />;

  const captured = progress.flagCount(scenario.id);
  const onFlagCaptured = (flag: string) => progress.captureFlag(scenario.id, flag, scenario.totalFlags);
  const done = captured >= scenario.totalFlags;
  const progressPct = Math.min(100, Math.round((100 * captured) / Math.max(scenario.totalFlags, 1)));
  // Same fix as the offensive-lab LabPage: ties off to flags actually captured, not queries run,
  // so a stream of wrong/unrelated queries can never tick a guided step off.
  const autoCheckedCount = done
    ? scenario.objectives.length
    : Math.floor((scenario.objectives.length * captured) / Math.max(scenario.totalFlags, 1));

  const narrative = siemScenario?.narrative;

  if (siemScenario?.investigation) return (
    <div className="investigation-casefile">
      <header className="investigation-casefile-header"><div><Link to="/soc-portal">← Back to SOC Portal</Link><h1>{scenario.title}</h1></div><button type="button" onClick={() => setSharing(true)}>{done ? 'Evidence notebook & certificate' : 'Evidence notebook'}</button></header>
      <InvestigationWorkbench key={siemScenario.id} scenario={siemScenario} completed={progress.labFlags[siemScenario.id] ?? []} onComplete={onFlagCaptured} onTranscriptChange={transcript => { transcriptRef.current = transcript; }} />
      {sharing && <ShareWriteupModal entry={{ slug: scenario.id, scenario: { id: scenario.id, title: scenario.title, category: 'SOC', difficulty: scenario.difficulty, totalFlags: scenario.totalFlags, briefing: scenario.briefing, objectives: scenario.objectives } }} onClose={() => setSharing(false)} />}
    </div>
  );

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden lg:flex-row">
      <aside className="lg:w-[26rem] min-h-0 max-h-[42%] lg:max-h-none shrink-0 overscroll-contain border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <DifficultyPill difficulty={scenario.difficulty} />
              <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{TOOL_LABEL[scenario.tool]}</span>
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
        <Link
          to={isOsint ? '/labs' : '/soc-portal'}
          className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-3 inline-block"
        >
          &larr; Back to {isOsint ? 'Lab Catalog' : 'SOC Portal'}
        </Link>

        <h1 className="text-xl font-bold text-[var(--color-heading)] mb-3">{scenario.title}</h1>
        <button className="lg:hidden mb-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)]" aria-expanded={guideExpanded} aria-controls="investigation-guide" onClick={() => setGuideExpanded(value => !value)}>{guideExpanded ? 'Hide investigation guide' : 'Show investigation guide'}</button>
        <button onClick={() => setSharing(true)} className="mb-4 block rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-heading)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface-2)]">{done ? 'Open evidence notebook & certificate' : 'Open evidence notebook'}</button>
        <div id="investigation-guide" className={guideExpanded ? '' : 'hidden lg:block'}>
        {/* Narrative banner replaces the plain briefing for gamified labs */}
        {narrative ? (
          <>
            <NarrativeBanner narrative={narrative} done={done} />
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5">{scenario.briefing}</p>
          </>
        )}

        {/* Placed before the checklist instead of appended after it, so it's never buried below a
            long objectives list — same fix as the offensive-lab LabPage. */}
        {captured >= scenario.totalFlags && (
          <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
            <IconCheck className="w-4 h-4" /> {siemScenario?.investigation ? 'Training complete — all evidence checkpoints verified.' : narrative ? 'Case closed — investigation complete!' : 'Lab complete — all flags captured!'}
          </div>
        )}

        <div className="mb-6">
          <LabLearningBridge scenario={{ category: 'SOC' }} />
          <StepChecklist
            steps={scenario.objectives}
            autoCheckedCount={autoCheckedCount}
            title={narrative ? 'Your Mission' : 'Lab Guide'}
            variant="prominent"
          />
        </div>

        {captured < scenario.totalFlags && (
          <>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)] leading-relaxed mb-3">
              {isOsint
                ? `Use the supported ${TOOL_LABEL[scenario.tool]} command shown in a hint to explore this simulated dataset.`
                : narrative
                  ? `Search the ${TOOL_LABEL[scenario.tool]} records to follow this case. Use search terms, field values or raw log keywords in the search bar.`
                  : `Type a supported filter/query into the ${TOOL_LABEL[scenario.tool]} bar to investigate the training dataset. This workspace models selected tool behavior.`}
            </div>

            <button
              onClick={() => setHintIndex((i) => Math.min(i + 1, scenario.hints.length))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
            >
              {hintIndex === 0 ? (narrative ? '🔍 Show investigation hint' : 'Show a hint') : 'Next hint'}
            </button>
            {hintIndex > 0 && (
              <div className="mt-2 space-y-1.5">
                {scenario.hints.slice(0, hintIndex).map((h, i) => (
                  <div key={i} className="text-xs font-mono bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2 py-1.5 text-[var(--color-accent-dim)]">
                    {h}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <LabComments labId={scenario.id} />
        </div>
        </div>
      </aside>

      <section className="flex flex-1 min-w-0 min-h-0 flex-col gap-3 overflow-hidden bg-[var(--color-bg)] p-2 sm:p-4 lg:p-5" aria-label="Investigation workspace">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 premium-card rounded-2xl px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-dim)]">{isOsint ? 'OSINT workspace' : 'SIEM investigation'}</p>
            <p className="truncate text-xs text-[var(--color-text-dim)]">{TOOL_LABEL[scenario.tool]} · {scenario.totalFlags} proof points</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${done ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]'}`}>{done ? siemScenario?.investigation ? 'Training complete' : 'Case closed' : 'Case active'}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
        {osintScenario ? (
          <OsintTerminal
            key={osintScenario.id}
            scenario={osintScenario}
            onFlagCaptured={onFlagCaptured}
            onTranscriptChange={(t) => {
              transcriptRef.current = t;
            }}
          />
        ) : (
          siemScenario && (
            <SiemConsole
              key={siemScenario.id}
              scenario={siemScenario}
              onFlagCaptured={onFlagCaptured}
              onTranscriptChange={(t) => {
                transcriptRef.current = t;
              }}
            />
          )
        )}
        </div>
      </section>

      {sharing && <ShareWriteupModal entry={{ slug: scenario.id, scenario: { id: scenario.id, title: scenario.title, category: isOsint ? 'Network' : 'SOC', difficulty: scenario.difficulty, totalFlags: scenario.totalFlags, briefing: scenario.briefing, objectives: scenario.objectives } }} onClose={() => setSharing(false)} />}
      <CyberLabAI
        key={scenario.id}
        getContext={() => ({
          kind: 'lab',
          title: scenario.title,
          subtitle: `${scenario.difficulty} · ${TOOL_LABEL[scenario.tool]}`,
          bodyText:
            (narrative
              ? `CASE: ${narrative.hook}\nVICTIM: ${narrative.victim}\n\n${narrative.scene}\n\nMISSION: ${narrative.mission}\n\n`
              : scenario.briefing) +
            '\n\nGuided steps:\n' +
            scenario.objectives
              .map((o, i) => {
                const step = typeof o === 'string' ? { text: o } : o;
                return `${i + 1}. ${step.text}${step.why ? ` (Why: ${step.why})` : ''}`;
              })
              .join('\n'),
          terminalTranscript: transcriptRef.current,
          revealedHints: scenario.hints.slice(0, hintIndex),
        })}
      />
    </div>
  );
}

