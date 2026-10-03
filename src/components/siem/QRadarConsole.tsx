import { Fragment, useState } from 'react';
import type { SiemLabScenario, SiemEntry } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

const NAV_TABS = ['Dashboard', 'Offenses', 'Log Activity', 'Network Activity', 'Assets', 'Reports', 'Risks', 'Admin'];

const TIME_RANGES = ['Last Hour', 'Last 6 Hours', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days'];

/** QRadar's real "Magnitude" is 1-10, a weighted blend of severity/relevance/credibility — not shown
 *  anywhere in this lab's source data directly, so it's derived from the same severity field every
 *  other tool's view already uses, the same way a real analyst reads magnitude as "how bad is this,
 *  roughly" rather than an exact formula they recompute by hand. */
function magnitudeFor(e: SiemEntry): number {
  switch (e.severity) {
    case 'Critical':
      return 9;
    case 'High':
      return 7;
    case 'Medium':
      return 5;
    case 'Low':
      return 2;
    default:
      return 3;
  }
}

function magnitudeColor(mag: number): string {
  if (mag >= 8) return 'bg-red-600';
  if (mag >= 6) return 'bg-orange-500';
  if (mag >= 4) return 'bg-yellow-500';
  return 'bg-blue-500';
}

const IP_RE = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const USER_RE = /\b(?:user(?:name)?|account)[:=]\s*["']?([A-Za-z0-9._-]+)/i;

function extractIps(line: string): { source: string; dest: string } {
  const matches = line.match(IP_RE) ?? [];
  return { source: matches[0] ?? '—', dest: matches[1] ?? '—' };
}

function extractUser(line: string): string {
  return line.match(USER_RE)?.[1] ?? '—';
}

/** Derives a plausible-looking Log Source name from the entry's own eventType, the same way a real
 *  QRadar deployment's Log Source name usually reflects which device/collector forwarded the event. */
function logSourceFor(e: SiemEntry): string {
  if (!e.eventType) return 'Custom Rule Engine-8 :: crexec01';
  const base = e.eventType.replace(/_/g, ' ');
  return `${base} @ WinCollector-1`;
}

export default function QRadarConsole({
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
  const [timeRange, setTimeRange] = useState('Last Hour');
  const [history, setHistory] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const run = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setRan(true);
    const visible = scenario.entries.filter((e) => matchesQuery(e, q));
    visible.forEach((e) => {
      const flag = extractFlag(e.line);
      if (flag) onFlagCaptured(flag);
    });
    const entry = `AQL: ${q}\n  ${visible.length} matching offenses (of ${scenario.entries.length} total)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, query)) : scenario.entries;

  return (
    <div className="flex flex-col h-full bg-[#f2f4f8] rounded-lg overflow-hidden border border-black/10 shadow-lg font-sans text-[#161616]">
      {/* IBM Carbon-style top bar */}
      <div className="flex items-center gap-4 px-4 h-12 bg-[#161616] text-white shrink-0">
        <span className="font-bold text-sm tracking-tight">IBM QRadar<span className="text-[#4589ff]">®</span></span>
        <span className="text-xs text-white/50 hidden sm:inline">{scenario.datasetLabel}</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-white/70">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Deployment healthy
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex items-center gap-5 px-4 h-10 bg-[#262626] text-sm shrink-0 overflow-x-auto">
        {NAV_TABS.map((tab) => (
          <span
            key={tab}
            className={`shrink-0 py-2.5 border-b-2 cursor-default select-none ${
              tab === 'Log Activity'
                ? 'border-[#4589ff] text-white font-semibold'
                : 'border-transparent text-white/50'
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* AQL search bar */}
      <div className="px-4 py-3 bg-white border-b border-black/10 shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold text-[#525252] uppercase tracking-wide">Ariel Query Language (AQL)</span>
        </div>
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(query)}
            placeholder="SELECT * FROM events WHERE category = 'Authentication' LAST 1 HOURS"
            className="flex-1 min-w-0 bg-[#f4f4f4] border border-[#8d8d8d] rounded-none px-3 py-2 text-sm font-mono text-[#161616] placeholder:text-[#a8a8a8] outline-none focus:border-[#4589ff] focus:ring-1 focus:ring-[#4589ff]"
          />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#f4f4f4] border border-[#8d8d8d] px-2 text-sm text-[#161616] outline-none focus:border-[#4589ff] shrink-0"
          >
            {TIME_RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => run(query)}
            className="px-4 py-2 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-sm font-semibold transition shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results grid */}
      <div className="flex-1 overflow-y-auto bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#e8e8e8] text-[#393939] text-xs font-semibold uppercase tracking-wide border-b border-black/10">
            <tr>
              <th className="text-left px-3 py-2.5 w-24">Magnitude</th>
              <th className="text-left px-3 py-2.5">Event Name</th>
              <th className="text-left px-3 py-2.5">Log Source</th>
              <th className="text-left px-3 py-2.5 whitespace-nowrap">Start Time</th>
              <th className="text-left px-3 py-2.5">Source IP</th>
              <th className="text-left px-3 py-2.5">Username</th>
            </tr>
          </thead>
          <tbody>
            {results.map((e, i) => {
              const mag = magnitudeFor(e);
              const { source } = extractIps(e.line);
              const user = extractUser(e.line);
              const isOpen = expanded === i;
              return (
                <Fragment key={i}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="border-b border-black/5 hover:bg-[#edf5ff] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-5 rounded-sm shrink-0 bg-[#e0e0e0] relative overflow-hidden">
                          <span className={`absolute bottom-0 left-0 right-0 ${magnitudeColor(mag)}`} style={{ height: `${mag * 10}%` }} />
                        </span>
                        <span className="font-semibold text-[#161616]">{mag}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-top font-medium text-[#161616]">{e.eventType ?? 'Unnamed Event'}</td>
                    <td className="px-3 py-2.5 align-top text-[#525252] whitespace-nowrap">{logSourceFor(e)}</td>
                    <td className="px-3 py-2.5 align-top text-[#525252] whitespace-nowrap font-mono text-xs">{e.timestamp ?? '—'}</td>
                    <td className="px-3 py-2.5 align-top text-[#525252] font-mono text-xs">{source}</td>
                    <td className="px-3 py-2.5 align-top text-[#525252]">{user}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-[#f4f8ff] border-b border-black/5">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="text-xs font-bold text-[#525252] uppercase tracking-wide mb-1">Full Event Payload</div>
                        <pre className="text-xs font-mono text-[#161616] whitespace-pre-wrap break-all bg-white border border-black/10 rounded p-2.5">
                          {e.line}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-[#8d8d8d]">
                  No events match this query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 bg-[#e8e8e8] border-t border-black/10 text-xs text-[#525252] shrink-0">
        Showing 1&ndash;{results.length} of {results.length} events &middot; {timeRange}
      </div>
    </div>
  );
}
