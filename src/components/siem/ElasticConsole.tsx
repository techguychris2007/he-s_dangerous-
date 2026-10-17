import { Fragment, useState } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

const NAV = ['Discover', 'Dashboard', 'Visualize', 'Alerts', 'Cases', 'Timelines'];

export default function ElasticConsole({
  scenario,
  onFlagCaptured,
  onTranscriptChange,
  onResults,
}: {
  scenario: SiemLabScenario;
  onFlagCaptured: (flag: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  onResults?: (entries: SiemLabScenario['entries']) => void;
}) {
  const [query, setQuery] = useState('');
  const [ran, setRan] = useState(false);
  const [appliedQuery, setAppliedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const run = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setRan(true);
    setAppliedQuery(q);
    const visible = scenario.entries.filter((e) => matchesQuery(e, q));
    onResults?.(visible);
    visible.forEach((e) => {
      const flag = extractFlag(e.line);
      if (flag) onFlagCaptured(flag);
    });
    const entry = `KQL: ${q}\n  ${visible.length} hits (of ${scenario.entries.length} docs)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, appliedQuery)) : scenario.entries;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-black/10 shadow-lg font-sans text-[#1a1c21]">
      {/* Elastic header */}
      <div className="flex items-center gap-3 px-4 h-12 bg-[#07101f] text-white shrink-0">
        <span className="font-semibold text-sm">
          elastic<span className="text-[#f04e98]">.</span>
        </span>
        <span className="text-xs text-white/40 hidden sm:inline">{scenario.datasetLabel}</span>
        <div className="ml-auto text-xs text-white/50">security-logs-*</div>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-5 px-4 h-9 border-b border-black/10 bg-[#fafbfd] text-sm shrink-0 overflow-x-auto">
        {NAV.map((item) => (
          <span
            key={item}
            className={`shrink-0 py-2 border-b-2 cursor-default select-none ${
              item === 'Discover' ? 'border-[#0077cc] text-[#1a1c21] font-semibold' : 'border-transparent text-[#69707d]'
            }`}
          >
            {item}
          </span>
        ))}
      </div>

      {/* KQL search bar */}
      <div className="px-4 py-3 border-b border-black/10 shrink-0">
        <div className="flex items-stretch gap-2">
          <div className="flex-1 min-w-0 flex items-center bg-white border border-[#d3dae6] rounded px-3">
            <span className="text-[#69707d] text-sm mr-2">&#128269;</span>
            <input
              type="text"
              aria-label="Investigation query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run(query)}
              placeholder='action: "password_reset" and target_account: "@elonmusk"'
              className="flex-1 min-w-0 py-2 text-sm font-mono text-[#1a1c21] placeholder:text-[#98a2b3] outline-none"
            />
          </div>
          <button
            onClick={() => run(query)}
            className="px-4 py-2 bg-[#0077cc] hover:bg-[#005a9e] text-white text-sm font-semibold rounded transition shrink-0"
          >
            Search
          </button>
        </div>
        <div className="text-xs text-[#69707d] mt-1.5">{results.length} hits &middot; Last 15 minutes &ndash; now</div>
      </div>

      {/* Document table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#fafbfd] text-[#69707d] text-xs font-semibold uppercase tracking-wide border-b border-black/10">
            <tr>
              <th className="text-left px-3 py-2 w-6" />
              <th className="text-left px-3 py-2 whitespace-nowrap">@timestamp</th>
              <th className="text-left px-3 py-2">event.type</th>
              <th className="text-left px-3 py-2">_source</th>
            </tr>
          </thead>
          <tbody>
            {results.map((e, i) => {
              const isOpen = expanded === i;
              return (
                <Fragment key={i}>
                  <tr onClick={() => setExpanded(isOpen ? null : i)} className="border-b border-black/5 hover:bg-[#f5f7fa] cursor-pointer">
                    <td className="px-3 py-2 align-top text-[#69707d]">{isOpen ? '▾' : '▸'}</td>
                    <td className="px-3 py-2 align-top font-mono text-xs text-[#69707d] whitespace-nowrap">{e.timestamp ?? '—'}</td>
                    <td className="px-3 py-2 align-top">
                      {e.eventType && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#0077cc] text-xs font-mono">{e.eventType}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-xs text-[#1a1c21] break-all">{e.line}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-[#f5f7fa] border-b border-black/5">
                      <td colSpan={4} className="px-3 py-3">
                        <div className="text-xs font-bold text-[#69707d] uppercase tracking-wide mb-1">JSON</div>
                        <pre className="text-xs font-mono text-[#1a1c21] whitespace-pre-wrap break-all bg-white border border-black/10 rounded p-2.5">
{`{
  "@timestamp": "${e.timestamp ?? ''}",
  "event.type": "${e.eventType ?? 'unknown'}",
  "message": "${e.line.replace(/"/g, '\\"')}"
}`}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {results.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-[#98a2b3]">
                  No results match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
