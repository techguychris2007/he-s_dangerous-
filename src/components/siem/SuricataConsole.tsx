import { useState } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

/** Suricata itself has no web GUI — real analysts watch its alerts by tailing fast.log or eve.json
 *  directly on the sensor, or piping it through grep to narrow in on something. This renders that
 *  reality rather than inventing a dashboard product that doesn't exist, the same reasoning that
 *  applies to TcpdumpConsole. */
function sevColor(sev?: string): string {
  switch (sev) {
    case 'Critical':
      return 'text-red-400';
    case 'High':
      return 'text-orange-400';
    case 'Medium':
      return 'text-yellow-300';
    default:
      return 'text-[#9fd3a3]';
  }
}

export default function SuricataConsole({
  scenario,
  onFlagCaptured,
  onTranscriptChange,
}: {
  scenario: SiemLabScenario;
  onFlagCaptured: (flag: string) => void;
  onTranscriptChange?: (transcript: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [ran, setRan] = useState(false);
  const [appliedQuery, setAppliedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const run = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setRan(true);
    setAppliedQuery(q);
    const visible = scenario.entries.filter((e) => matchesQuery(e, q));
    visible.forEach((e) => {
      const flag = extractFlag(e.line);
      if (flag) onFlagCaptured(flag);
    });
    const entry = `grep -i "${q}" fast.log\n  ${visible.length} lines (of ${scenario.entries.length} total)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, appliedQuery)) : scenario.entries;

  return (
    <div className="flex flex-col h-full bg-[#0c0f0a] rounded-lg overflow-hidden border border-black/30 shadow-lg font-mono text-sm">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-3 h-9 bg-[#1a1f16] border-b border-black/30 shrink-0">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-[#9fd3a3]/70">analyst@ids-sensor-01: /var/log/suricata</span>
        <span className="ml-auto text-xs text-[#9fd3a3]/40">{scenario.datasetLabel}</span>
      </div>

      {/* Command/filter line */}
      <div className="px-3 py-2.5 border-b border-black/20 shrink-0">
        <div className="flex items-center gap-2 text-[#9fd3a3]">
          <span className="text-[#5fd068]">$</span>
          <span className="text-[#9fd3a3]/70 shrink-0">grep -i</span>
          <input
            type="text"
            aria-label="Investigation query"
              value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(query)}
            placeholder='"ET SCAN"'
            className="flex-1 min-w-0 bg-transparent outline-none text-[#e8f5e9] placeholder:text-[#9fd3a3]/30"
          />
          <span className="text-[#9fd3a3]/70 shrink-0">fast.log</span>
          <button
            onClick={() => run(query)}
            className="px-3 py-1 bg-[#1f3a1f] hover:bg-[#2a4a2a] text-[#9fd3a3] text-xs rounded border border-[#2a4a2a] transition shrink-0"
          >
            run
          </button>
        </div>
      </div>

      {/* Alert feed */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {results.map((e, i) => (
          <div key={i} className="py-1 border-b border-white/5 leading-relaxed">
            <span className="text-[#9fd3a3]/50">{e.timestamp ?? '—'}</span>{' '}
            <span className={`font-semibold ${sevColor(e.severity)}`}>[{(e.severity ?? 'INFO').toUpperCase()}]</span>{' '}
            <span className="text-[#d4e8d6] break-all">{e.line}</span>
          </div>
        ))}
        {results.length === 0 && <div className="py-10 text-center text-[#9fd3a3]/30">(no matching lines)</div>}
      </div>

      <div className="px-3 py-1.5 bg-[#1a1f16] border-t border-black/30 text-xs text-[#9fd3a3]/50 shrink-0">
        {results.length} / {scenario.entries.length} lines &middot; fast.log
      </div>
    </div>
  );
}
