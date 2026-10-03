import { useMemo, useState } from 'react';
import type { SiemLabScenario, SiemEntry } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

const TIME_RANGES = ['Last 15 minutes', 'Last 60 minutes', 'Last 24 hours', 'Last 7 days', 'All time'];
const TABS = ['Events', 'Patterns', 'Statistics', 'Visualization'];

/** Splunk's raw-event view highlights every recognized key=value pair it finds in the text — this is
 *  one of the most recognizable things about the real product's results view, so it's reproduced here
 *  against the same raw `line` text every other view already has, rather than needing new fields. */
const KV_RE = /\b([A-Za-z_][A-Za-z0-9_]*)=("[^"]*"|'[^']*'|\S+)/g;

function highlightLine(line: string): (string | { key: string; value: string })[] {
  const parts: (string | { key: string; value: string })[] = [];
  let lastIndex = 0;
  for (const m of line.matchAll(KV_RE)) {
    if (m.index! > lastIndex) parts.push(line.slice(lastIndex, m.index));
    parts.push({ key: m[1], value: m[2] });
    lastIndex = m.index! + m[0].length;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

/** A deterministic, not-random, histogram shape — derived from each entry's own severity so the bars
 *  are at least loosely meaningful (louder severities render taller) instead of being pure decoration
 *  that happens to look busy. */
function histogramHeights(entries: SiemEntry[]): number[] {
  const buckets = 28;
  const heights = new Array(buckets).fill(0.08);
  entries.forEach((e, i) => {
    const bucket = i % buckets;
    const weight = e.severity === 'Critical' ? 1 : e.severity === 'High' ? 0.75 : e.severity === 'Medium' ? 0.5 : 0.3;
    heights[bucket] = Math.max(heights[bucket], weight);
  });
  return heights;
}

export default function SplunkConsole({
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
  const [timeRange, setTimeRange] = useState('Last 24 hours');
  const [history, setHistory] = useState<string[]>([]);

  const run = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setRan(true);
    const visible = scenario.entries.filter((e) => matchesQuery(e, q));
    visible.forEach((e) => {
      const flag = extractFlag(e.line);
      if (flag) onFlagCaptured(flag);
    });
    const entry = `SPL: ${q}\n  ${visible.length} matching events (of ${scenario.entries.length} total)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, query)) : scenario.entries;
  const heights = useMemo(() => histogramHeights(results), [results]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border border-black/10 shadow-lg font-sans text-[#2b2b2b]">
      {/* Splunk header */}
      <div className="flex items-center gap-4 px-4 h-12 bg-[#171717] text-white shrink-0">
        <span className="font-bold text-base tracking-tight">
          splunk<span className="text-[#ff6a00]">&gt;</span>
        </span>
        <span className="text-xs text-white/50 hidden sm:inline">Search &amp; Reporting</span>
        <span className="ml-auto text-xs text-white/40">{scenario.datasetLabel}</span>
      </div>

      {/* Search bar + time range */}
      <div className="px-4 py-3 bg-[#f5f5f5] border-b border-black/10 shrink-0">
        <div className="flex items-stretch gap-0">
          <div className="flex-1 min-w-0 flex items-center bg-white border border-[#d0d0d0] border-r-0 rounded-l">
            <span className="pl-3 text-[#ff6a00] font-mono text-sm shrink-0">Q</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run(query)}
              placeholder='index=main sourcetype=auth "failed login" | stats count by user'
              className="flex-1 min-w-0 px-2 py-2.5 text-sm font-mono text-[#2b2b2b] placeholder:text-[#9a9a9a] outline-none"
            />
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-[#d0d0d0] border-r-0 px-2 text-sm text-[#2b2b2b] outline-none shrink-0"
          >
            {TIME_RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => run(query)}
            className="px-4 bg-[#5cc05c] hover:bg-[#4caf4c] text-white text-sm font-bold rounded-r transition shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Summary + histogram */}
      <div className="px-4 py-2.5 border-b border-black/10 shrink-0">
        <div className="text-sm text-[#5a5a5a] mb-1.5">
          <span className="font-semibold text-[#2b2b2b]">{results.length}</span> events ({timeRange.toLowerCase()})
        </div>
        <div className="flex items-end gap-[2px] h-10">
          {heights.map((h, i) => (
            <div key={i} className="flex-1 bg-[#6fa8dc] rounded-sm" style={{ height: `${h * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-5 px-4 h-9 border-b border-black/10 text-sm shrink-0">
        {TABS.map((t) => (
          <span
            key={t}
            className={`py-2 border-b-2 cursor-default select-none ${
              t === 'Events' ? 'border-[#ff6a00] text-[#2b2b2b] font-semibold' : 'border-transparent text-[#9a9a9a]'
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Raw events list */}
      <div className="flex-1 overflow-y-auto">
        {results.map((e, i) => (
          <div key={i} className="px-4 py-2.5 border-b border-black/5 hover:bg-[#fafafa] flex gap-3 text-sm">
            <span className="shrink-0 font-mono text-xs text-[#6a6a6a] w-40 pt-0.5">{e.timestamp ?? '—'}</span>
            <pre className="flex-1 min-w-0 whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-[#2b2b2b]">
              {highlightLine(e.line).map((part, j) =>
                typeof part === 'string' ? (
                  <span key={j}>{part}</span>
                ) : (
                  <span key={j}>
                    <span className="text-[#ff6a00] font-semibold">{part.key}</span>
                    <span className="text-[#9a9a9a]">=</span>
                    <span className="text-[#006d9c]">{part.value}</span>
                  </span>
                ),
              )}
            </pre>
          </div>
        ))}
        {results.length === 0 && <div className="px-4 py-10 text-center text-sm text-[#9a9a9a]">No results found.</div>}
      </div>

      <div className="px-4 py-2 bg-[#f5f5f5] border-t border-black/10 text-xs text-[#6a6a6a] shrink-0">
        {results.length} of {scenario.entries.length} events &middot; job completed
      </div>
    </div>
  );
}
