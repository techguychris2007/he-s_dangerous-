import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { SIEM_LABS } from '../labs/siemScenarios';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import StepChecklist from '../components/lesson/StepChecklist';
import SiemConsole from '../components/siem/SiemConsole';
import OsintTerminal from '../components/labs/OsintTerminal';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabComments from '../components/labs/LabComments';
import DifficultyPill from '../components/common/DifficultyPill';
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
  const siemScenario = SIEM_LABS.find((s) => s.id === labId);
  const osintScenario = OSINT_LABS.find((s) => s.id === labId);
  const scenario = siemScenario ?? osintScenario;
  const isOsint = !siemScenario && !!osintScenario;
  const transcriptRef = useRef('');

  useEffect(() => {
    setHintIndex(0);
    transcriptRef.current = '';
  }, [labId]);

  if (!scenario) return <Navigate to="/labs" replace />;

  const captured = progress.flagCount(scenario.id);
  const onFlagCaptured = (flag: string) => progress.captureFlag(scenario.id, flag);
  const done = captured >= scenario.totalFlags;
  // Same fix as the offensive-lab LabPage: ties off to flags actually captured, not queries run,
  // so a stream of wrong/unrelated queries can never tick a guided step off.
  const autoCheckedCount = done
    ? scenario.objectives.length
    : Math.floor((scenario.objectives.length * captured) / Math.max(scenario.totalFlags, 1));

  const narrative = siemScenario?.narrative;

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 overflow-y-auto">
        <Link
          to={isOsint ? '/labs' : '/soc-portal'}
          className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-3 inline-block"
        >
          &larr; Back to {isOsint ? 'Lab Catalog' : 'SOC Portal'}
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <DifficultyPill difficulty={scenario.difficulty} />
          <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{TOOL_LABEL[scenario.tool]}</span>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-dim)]">
            <IconFlag className="w-3.5 h-3.5" />
            {captured}/{scenario.totalFlags} flags
          </span>
        </div>

        {/* Narrative banner replaces the plain briefing for gamified labs */}
        {narrative ? (
          <>
            <h1 className="text-xl font-bold text-[var(--color-heading)] mb-3">{scenario.title}</h1>
            <NarrativeBanner narrative={narrative} done={done} />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-3">{scenario.title}</h1>
            <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5">{scenario.briefing}</p>
          </>
        )}

        {/* Placed before the checklist instead of appended after it, so it's never buried below a
            long objectives list — same fix as the offensive-lab LabPage. */}
        {captured >= scenario.totalFlags && (
          <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
            <IconCheck className="w-4 h-4" /> {narrative ? 'Case closed — investigation complete!' : 'Lab complete — all flags captured!'}
          </div>
        )}

        <div className="mb-6">
          <StepChecklist
            steps={scenario.objectives}
            autoCheckedCount={autoCheckedCount}
            title={narrative ? 'Your Mission' : 'Lab Guide'}
            variant="prominent"
          />
        </div>

        {captured < scenario.totalFlags && (
          <>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)] leading-relaxed mb-3">
              {isOsint
                ? `Type the real ${TOOL_LABEL[scenario.tool]} command straight into the terminal, exactly as a hint shows it — output streams back the way the real tool would.`
                : narrative
                  ? `Search the Splunk logs to trace Afomiya's breach — each query uncovers the next chapter. Type search terms, field values, or raw log keywords directly into the search bar.`
                  : `Type your filter/query directly into the ${TOOL_LABEL[scenario.tool]} bar and run it — the tool highlights whatever matches, exactly like the real thing.`}
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

      <div className="flex-1 min-h-[420px] p-4">
        {osintScenario ? (
          <OsintTerminal
            scenario={osintScenario}
            onFlagCaptured={onFlagCaptured}
            onTranscriptChange={(t) => {
              transcriptRef.current = t;
            }}
          />
        ) : (
          siemScenario && (
            <SiemConsole
              scenario={siemScenario}
              onFlagCaptured={onFlagCaptured}
              onTranscriptChange={(t) => {
                transcriptRef.current = t;
              }}
            />
          )
        )}
      </div>

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

