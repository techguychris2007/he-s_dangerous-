import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { SIEM_LABS } from '../labs/siemScenarios';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import StepChecklist from '../components/lesson/StepChecklist';
import SiemConsole from '../components/siem/SiemConsole';
import OsintTerminal from '../components/labs/OsintTerminal';
import CyberLabAI from '../components/labs/CyberLabAI';
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

export default function SiemLabPage() {
  const { labId } = useParams();
  const progress = useProgress();
  const [hintIndex, setHintIndex] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const siemScenario = SIEM_LABS.find((s) => s.id === labId);
  const osintScenario = OSINT_LABS.find((s) => s.id === labId);
  const scenario = siemScenario ?? osintScenario;
  const isOsint = !siemScenario && !!osintScenario;
  const transcriptRef = useRef('');

  useEffect(() => {
    setHintIndex(0);
    setQueryCount(0);
    transcriptRef.current = '';
  }, [labId]);

  if (!scenario) return <Navigate to="/labs" replace />;

  const captured = progress.flagCount(scenario.id);
  const onFlagCaptured = (flag: string) => progress.captureFlag(scenario.id, flag);
  const autoCheckedCount =
    captured >= scenario.totalFlags ? scenario.objectives.length : Math.min(queryCount, scenario.objectives.length);

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
        <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-3">{scenario.title}</h1>
        <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5">{scenario.briefing}</p>

        {/* Placed before the checklist instead of appended after it, so it's never buried below a
            long objectives list — same fix as the offensive-lab LabPage. */}
        {captured >= scenario.totalFlags && (
          <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 mb-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
            <IconCheck className="w-4 h-4" /> Lab complete — all flags captured!
          </div>
        )}

        <div className="mb-6">
          <StepChecklist steps={scenario.objectives} autoCheckedCount={autoCheckedCount} />
        </div>

        {captured < scenario.totalFlags && (
          <>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-xs text-[var(--color-text-dim)] leading-relaxed mb-3">
              {isOsint
                ? `Type the real ${TOOL_LABEL[scenario.tool]} command straight into the terminal, exactly as a hint shows it — output streams back the way the real tool would.`
                : `Type your filter/query directly into the ${TOOL_LABEL[scenario.tool]} bar and run it — the tool highlights whatever matches, exactly like the real thing.`}
            </div>

            <button
              onClick={() => setHintIndex((i) => Math.min(i + 1, scenario.hints.length))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
            >
              {hintIndex === 0 ? 'Show a hint' : 'Next hint'}
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
      </div>

      <div className="flex-1 min-h-[420px] p-4">
        {osintScenario ? (
          <OsintTerminal
            scenario={osintScenario}
            onFlagCaptured={onFlagCaptured}
            onCommandRun={() => setQueryCount((c) => c + 1)}
            onTranscriptChange={(t) => {
              transcriptRef.current = t;
            }}
          />
        ) : (
          siemScenario && (
            <SiemConsole
              scenario={siemScenario}
              onFlagCaptured={onFlagCaptured}
              onQueryRun={() => setQueryCount((c) => c + 1)}
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
            scenario.briefing +
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
