import { useMemo, useState } from 'react';
import {
  applyToolTraining,
  filterTrainingPackets,
  initialTrainingRequest,
  newToolTrainingState,
  trainingArtifacts,
  type ToolTrainingAction,
  type TrainingPacket,
  type TrainingTool,
} from '../../labs/preSecurityTools';

type Mode = TrainingTool | 'capstone';

const toolLabels: Record<TrainingTool, string> = {
  wireshark: 'Wireshark',
  burp: 'Burp Suite',
  autopsy: 'Autopsy',
};

const checkpointLabels: Record<string, string> = {
  'wireshark-dns': 'Explain the DNS answer',
  'wireshark-http': 'Identify the HTTP request',
  'wireshark-stream': 'Follow the readable stream',
  'burp-baseline': 'Send the baseline request',
  'burp-boundary': 'Test an authorization boundary',
  'burp-session': 'Recognize missing authentication',
  'autopsy-ingest': 'Create a case and ingest evidence',
  'autopsy-search': 'Find the case keyword',
  'autopsy-tag': 'Tag evidence without overclaiming',
};

function tabsForMode(mode: Mode): TrainingTool[] {
  return mode === 'capstone' ? ['wireshark', 'burp', 'autopsy'] : [mode];
}

export default function PreSecurityWorkbench({
  mode,
  scenarioId,
  onFlagCaptured,
  onTranscriptChange,
}: {
  mode: Mode;
  scenarioId: string;
  onFlagCaptured: (flag: string) => void;
  onTranscriptChange?: (transcript: string) => void;
}) {
  const tabs = tabsForMode(mode);
  const [active, setActive] = useState<TrainingTool>(tabs[0]);
  const [state, setState] = useState(() => newToolTrainingState());
  const [output, setOutput] = useState('Ready. Complete the tool steps from the lab guide.');

  function run(action: ToolTrainingAction) {
    const result = applyToolTraining(state, action);
    setState(result.state);
    setOutput(result.message);
    const transcript = result.state.events.join('\n\n');
    onTranscriptChange?.(transcript);
    if (result.checkpoint) onFlagCaptured(`flag{${scenarioId}_${result.checkpoint}}`);
  }

  return (
    <section className="h-full min-h-0 overflow-hidden premium-card rounded-2xl">
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">Pre-security tool bench</p>
              <h2 className="text-lg font-bold text-[var(--color-heading)]">{mode === 'capstone' ? 'Toolkit Capstone' : toolLabels[mode]}</h2>
            </div>
            <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
              {tabs.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActive(tab)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${active === tab ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'}`}
                >
                  {toolLabels[tab]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(checkpointLabels).map(([checkpoint, label]) => (
              <span
                key={checkpoint}
                className={`rounded-full border px-2.5 py-1 text-2xs ${state.completed.includes(checkpoint) ? 'border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border-[var(--color-border)] text-[var(--color-text-dim)]'}`}
              >
                {state.completed.includes(checkpoint) ? 'Done: ' : ''}{label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] overflow-hidden lg:grid-cols-[1fr_360px] lg:grid-rows-1">
          <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
            {active === 'wireshark' && <WiresharkPanel run={run} />}
            {active === 'burp' && <BurpPanel run={run} />}
            {active === 'autopsy' && <AutopsyPanel run={run} ingested={state.ingested} />}
          </div>
          <aside className="min-h-0 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-bold text-[var(--color-heading)]">Tool output</h3>
            <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[#070b12] p-3 text-xs leading-relaxed text-slate-100 lg:max-h-none lg:h-[calc(100%-2rem)]">{output}</pre>
          </aside>
        </div>
      </div>
    </section>
  );
}

function WiresharkPanel({ run }: { run: (action: ToolTrainingAction) => void }) {
  const [filter, setFilter] = useState('dns');
  const packets = useMemo(() => {
    try {
      return filterTrainingPackets(filter);
    } catch {
      return [] as TrainingPacket[];
    }
  }, [filter]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-dim)]" htmlFor="packet-filter">Display filter</label>
        <div className="mt-2 flex gap-2">
          <input id="packet-filter" value={filter} onChange={event => setFilter(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" />
          <button type="button" onClick={() => run({ type: 'packet', filter, packetId: packets[0]?.id ?? 0 })} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">Inspect first row</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
            <tr><th className="p-2">No.</th><th className="p-2">Time</th><th className="p-2">Source</th><th className="p-2">Destination</th><th className="p-2">Protocol</th><th className="p-2">Info</th><th className="p-2">Action</th></tr>
          </thead>
          <tbody>
            {packets.map(packet => (
              <tr key={packet.id} className="border-t border-[var(--color-border)]">
                <td className="p-2">{packet.id}</td><td className="p-2">{packet.time}</td><td className="p-2">{packet.source}</td><td className="p-2">{packet.destination}</td><td className="p-2 font-semibold">{packet.protocol}</td><td className="p-2">{packet.info}</td>
                <td className="p-2"><button type="button" onClick={() => run({ type: 'packet', filter, packetId: packet.id })} className="rounded-md border border-[var(--color-border)] px-2 py-1">Inspect</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => run({ type: 'stream', packetId: 6 })} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Follow TCP stream 0</button>
    </div>
  );
}

function BurpPanel({ run }: { run: (action: ToolTrainingAction) => void }) {
  const [raw, setRaw] = useState(initialTrainingRequest);
  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-dim)]" htmlFor="burp-request">Repeater request</label>
      <textarea id="burp-request" value={raw} onChange={event => setRaw(event.target.value)} spellCheck={false} className="h-72 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 font-mono text-xs leading-relaxed" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRaw(initialTrainingRequest)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Baseline</button>
        <button type="button" onClick={() => setRaw(initialTrainingRequest.replace('/alex', '/sam'))} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Change object</button>
        <button type="button" onClick={() => setRaw(initialTrainingRequest.replace('Cookie: session=learner-alex\n', ''))} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Remove cookie</button>
        <button type="button" onClick={() => run({ type: 'request', raw })} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">Send</button>
      </div>
    </div>
  );
}

function AutopsyPanel({ run, ingested }: { run: (action: ToolTrainingAction) => void; ingested: boolean }) {
  const [caseName, setCaseName] = useState('DW-101 laptop triage');
  const [keyword, setKeyword] = useState('BLUE-LANTERN');
  const [artifactId, setArtifactId] = useState('F-01');
  const [interpretation, setInterpretation] = useState('reference-only');
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input value={caseName} onChange={event => setCaseName(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm" aria-label="Case name" />
        <button type="button" onClick={() => run({ type: 'ingest', caseName })} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white">Create case</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-[var(--color-surface-2)] text-[var(--color-text-dim)]"><tr><th className="p-2">ID</th><th className="p-2">Path</th><th className="p-2">Time</th><th className="p-2">State</th></tr></thead>
          <tbody>{trainingArtifacts.map(artifact => <tr key={artifact.id} className="border-t border-[var(--color-border)]"><td className="p-2 font-semibold">{artifact.id}</td><td className="p-2">{artifact.path}</td><td className="p-2">{artifact.time}</td><td className="p-2">{artifact.state}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input value={keyword} onChange={event => setKeyword(event.target.value)} disabled={!ingested} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm disabled:opacity-60" aria-label="Keyword search" />
        <button type="button" onClick={() => run({ type: 'search', keyword })} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Search</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <select value={artifactId} onChange={event => setArtifactId(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
          {trainingArtifacts.map(artifact => <option key={artifact.id} value={artifact.id}>{artifact.id}</option>)}
        </select>
        <select value={interpretation} onChange={event => setInterpretation(event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
          <option value="reference-only">Reference only</option>
          <option value="password-found">Password found</option>
          <option value="user-confession">User confession</option>
        </select>
        <button type="button" onClick={() => run({ type: 'tag', artifactId, interpretation })} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold">Tag evidence</button>
      </div>
    </div>
  );
}
