import { useState } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

const NAV = ['Enterprise Insights', 'Search', 'Investigate', 'Dashboards', 'Rules', 'Settings'];

export default function ChronicleConsole({
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
    const entry = `UDM search: ${q}\n  ${visible.length} events (of ${scenario.entries.length} total)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, appliedQuery)) : scenario.entries;

  return (
    <div className="flex flex-col h-full bg-[#202124] rounded-lg overflow-hidden border border-black/20 shadow-lg font-sans text-[#e8eaed]">
      {/* Google-style header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[#202124] border-b border-white/10 shrink-0">
        <span className="font-medium text-base text-white">Chronicle</span>
        <span className="text-xs text-white/40 hidden sm:inline">{scenario.datasetLabel}</span>
        <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
          <span className="w-6 h-6 rounded-full bg-[#8ab4f8] text-[#202124] flex items-center justify-center font-semibold">A</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-5 px-4 h-10 border-b border-white/10 text-sm shrink-0 overflow-x-auto">
        {NAV.map((item) => (
          <span
            key={item}
            className={`shrink-0 py-2.5 border-b-2 cursor-default select-none ${
              item === 'Search' ? 'border-[#8ab4f8] text-white font-medium' : 'border-transparent text-white/50'
            }`}
          >
            {item}
          </span>
        ))}
      </div>

      {/* UDM search bar */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 bg-[#303134] rounded-full px-4 py-2.5 border border-white/10 focus-within:border-[#8ab4f8]">
          <span className="text-[#8ab4f8] text-sm">&#128269;</span>
          <input
            type="text"
            aria-label="Investigation query"
              value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(query)}
            placeholder='target.ip = "169.254.169.254" OR principal.user.userid = "svc_backup"'
            className="flex-1 min-w-0 bg-transparent text-sm font-mono text-[#e8eaed] placeholder:text-white/30 outline-none"
          />
          <button
            onClick={() => run(query)}
            className="px-4 py-1.5 bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] text-sm font-semibold rounded-full transition shrink-0"
          >
            Search
          </button>
        </div>
        <div className="text-xs text-white/40 mt-2">
          {results.length} events matched &middot; Last 30 days &middot; UDM (Unified Data Model)
        </div>
      </div>

      {/* Timeline-style results */}
      <div className="flex-1 overflow-y-auto">
        {results.map((e, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/5">
            <div className="flex flex-col items-center shrink-0 w-28">
              <span className="text-xs font-mono text-white/50">{e.timestamp ?? '—'}</span>
              <span className="w-px flex-1 bg-white/10 mt-1" />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              {e.eventType && (
                <span className="inline-block mb-1 px-2 py-0.5 rounded bg-[#394457] text-[#8ab4f8] text-xs font-mono">
                  {e.eventType}
                </span>
              )}
              <pre className="whitespace-pre-wrap break-all font-mono text-xs text-[#e8eaed] leading-relaxed">{e.line}</pre>
            </div>
          </div>
        ))}
        {results.length === 0 && <div className="px-4 py-10 text-center text-sm text-white/30">No UDM events matched this search.</div>}
      </div>
    </div>
  );
}
