import { useState } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

const LEFT_NAV = ['Overview', 'Logs', 'Workbooks', 'Incidents', 'Hunting', 'Analytics', 'Watchlists'];

const TABLES = ['OfficeActivity', 'SecurityEvent', 'SigninLogs', 'AuditLogs', 'DeviceEvents'];

export default function SentinelConsole({
  scenario,
  onFlagCaptured,
  onTranscriptChange,
  onResults,
  compact = false,
}: {
  scenario: SiemLabScenario;
  onFlagCaptured: (flag: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  onResults?: (entries: SiemLabScenario['entries']) => void;
  compact?: boolean;
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
    onResults?.(visible);
    visible.forEach((e) => {
      const flag = extractFlag(e.line);
      if (flag) onFlagCaptured(flag);
    });
    const entry = `KQL: ${q}\n  ${visible.length} results (of ${scenario.entries.length} rows)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, appliedQuery)) : scenario.entries;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-black/10 shadow-lg font-sans text-[#242424]">
      {/* Azure portal top bar */}
      <div className="flex items-center gap-3 px-4 h-11 bg-[#0078d4] text-white shrink-0">
        <span className="font-semibold text-sm">Microsoft Sentinel</span>
        {!compact && <span className="text-xs text-white/70 hidden sm:inline">| {scenario.datasetLabel}</span>}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-white/80">
          <span className="w-2 h-2 rounded-full bg-[#6bb700]" />
          {compact ? 'Offline case' : 'Connected'}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left resource nav */}
        {!compact && <div className="w-40 shrink-0 bg-[#faf9f8] border-r border-black/10 py-2 hidden md:block">
          {LEFT_NAV.map((item) => (
            <div
              key={item}
              className={`px-3 py-1.5 text-sm cursor-default select-none border-l-2 ${
                item === 'Logs'
                  ? 'border-[#0078d4] bg-[#edebe9] text-[#242424] font-semibold'
                  : 'border-transparent text-[#605e5c]'
              }`}
            >
              {item}
            </div>
          ))}
        </div>}

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Table picker strip */}
          {!compact && <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/10 bg-[#faf9f8] overflow-x-auto shrink-0">
            {TABLES.map((t) => (
              <span
                key={t}
                className="shrink-0 text-xs px-2 py-1 rounded bg-white border border-black/10 text-[#323130] font-mono"
              >
                {t}
              </span>
            ))}
          </div>}

          {/* KQL editor */}
          <div className="px-3 py-3 border-b border-black/10 shrink-0">
            <div className="text-xs font-semibold text-[#605e5c] uppercase tracking-wide mb-1.5">{compact ? 'Search case evidence' : 'New Query 1*'}</div>
            <textarea
              aria-label="Investigation query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
                  e.preventDefault();
                  run(query);
                }
              }}
              placeholder={compact ? 'Filter case records, e.g. phase=triage' : 'OfficeActivity\n| where Operation == "MailItemsAccessed"\n| where ClientIP !in (KnownIPs)'}
              rows={compact ? 2 : 3}
              className="w-full bg-[#1e1e1e] text-[#d4d4d4] border border-black/10 rounded px-3 py-2.5 text-sm font-mono outline-none focus:ring-1 focus:ring-[#0078d4] resize-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => run(query)}
                className="px-4 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-sm font-semibold rounded transition flex items-center gap-1.5"
              >
                <span className="text-xs">&#9654;</span> Run
              </button>
              <span className="text-xs text-[#605e5c]">Time range: Last 24 hours &middot; Ctrl+Enter to run</span>
            </div>
          </div>

          {/* Results table */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className={`w-full text-sm ${compact ? 'table-fixed min-w-[600px]' : ''}`}>
              {compact && <colgroup><col style={{ width: 180 }} /><col style={{ width: 125 }} /><col /></colgroup>}
              <thead className="sticky top-0 bg-[#faf9f8] text-[#605e5c] text-xs font-semibold uppercase tracking-wide border-b border-black/10">
                <tr>
                  <th className="text-left px-3 py-2 whitespace-nowrap">TimeGenerated</th>
                  <th className="text-left px-3 py-2">OperationName</th>
                  <th className="text-left px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((e, i) => (
                  <tr key={i} className="border-b border-black/5 hover:bg-[#f3f2f1]">
                    <td className="px-3 py-2 align-top font-mono text-xs text-[#605e5c] whitespace-nowrap">{e.timestamp ?? '—'}</td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[#e1dfdd] text-[#242424] text-xs font-mono">
                        {e.eventType ?? 'Event'}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top font-mono text-xs text-[#323130] break-words">{e.line}</td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-10 text-center text-[#a19f9d]">
                      Query returned no results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-3 py-1.5 bg-[#faf9f8] border-t border-black/10 text-xs text-[#605e5c] shrink-0">
            {results.length} rows &middot; Workspace: sentinel-lab-ws
          </div>
        </div>
      </div>
    </div>
  );
}
