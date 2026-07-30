import { useState } from 'react';
import type { SiemLabScenario, SiemTool } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

interface Branding {
  name: string;
  tagline: string;
  border: string;
  glow: string;
  dot: string;
  headerBg: string;
  barBg: string;
  labelText: string;
  buttonBg: string;
  buttonText: string;
  inputBorder: string;
  inputFocus: string;
  bodyBg: string;
  queryLabel: string;
  placeholder: string;
  searchLabel: string;
  resultsNoun: string;
  columns: 'severity' | 'event-type' | 'raw';
  monospaceOutput?: boolean;
  searchDelayMs?: number;
}

const BRANDING: Record<SiemTool, Branding> = {
  suricata: {
    name: 'Suricata',
    tagline: 'IDS Alert Console',
    border: 'border-orange-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(249,115,22,0.4)]',
    dot: 'bg-orange-500',
    headerBg: 'bg-[#141a21]',
    barBg: 'bg-[#0e1318]',
    labelText: 'text-orange-500',
    buttonBg: 'bg-orange-500',
    buttonText: 'text-black',
    inputBorder: 'border-orange-500/25',
    inputFocus: 'focus:border-orange-500/60',
    bodyBg: 'bg-[#0b1015]',
    queryLabel: 'filter:',
    placeholder: 'e.g. alert.signature =~ "beacon" or a raw substring',
    searchLabel: 'Apply filter',
    resultsNoun: 'alerts',
    columns: 'severity',
  },
  chronicle: {
    name: 'Chronicle',
    tagline: 'UDM Search',
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(59,130,246,0.4)]',
    dot: 'bg-blue-400',
    headerBg: 'bg-[#111827]',
    barBg: 'bg-[#0d1220]',
    labelText: 'text-blue-400',
    buttonBg: 'bg-blue-500',
    buttonText: 'text-white',
    inputBorder: 'border-blue-500/25',
    inputFocus: 'focus:border-blue-500/60',
    bodyBg: 'bg-[#0a0e17]',
    queryLabel: '🔍',
    placeholder: 'UDM query, e.g. target.ip = "185.220.101.7"',
    searchLabel: 'Search',
    resultsNoun: 'events',
    columns: 'event-type',
    searchDelayMs: 250,
  },
  tcpdump: {
    name: 'tcpdump',
    tagline: 'packet capture',
    border: 'border-green-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(34,197,94,0.4)]',
    dot: 'bg-green-500',
    headerBg: 'bg-[#0a120a]',
    barBg: 'bg-[#050805]',
    labelText: 'text-green-500',
    buttonBg: 'bg-green-500',
    buttonText: 'text-black',
    inputBorder: 'border-green-500/25',
    inputFocus: 'focus:border-green-500/60',
    bodyBg: 'bg-black',
    queryLabel: '$ tcpdump -r capture.pcap -n',
    placeholder: 'BPF filter, e.g. port 53, or host 185.220.101.7',
    searchLabel: 'Run',
    resultsNoun: 'packets',
    columns: 'raw',
    monospaceOutput: true,
  },
  splunk: {
    name: 'Splunk',
    tagline: 'Enterprise Security — SPL Search',
    border: 'border-lime-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(132,204,22,0.35)]',
    dot: 'bg-lime-500',
    headerBg: 'bg-[#111a0f]',
    barBg: 'bg-[#0c130a]',
    labelText: 'text-lime-400',
    buttonBg: 'bg-lime-500',
    buttonText: 'text-black',
    inputBorder: 'border-lime-500/25',
    inputFocus: 'focus:border-lime-500/60',
    bodyBg: 'bg-[#0a0f08]',
    queryLabel: 'SPL:',
    placeholder: 'index=main sourcetype=auth "failed login" | stats count by user',
    searchLabel: 'Search',
    resultsNoun: 'events',
    columns: 'raw',
  },
  sentinel: {
    name: 'Microsoft Sentinel',
    tagline: 'KQL Query — Incidents',
    border: 'border-sky-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(14,165,233,0.4)]',
    dot: 'bg-sky-400',
    headerBg: 'bg-[#0c1a2b]',
    barBg: 'bg-[#081422]',
    labelText: 'text-sky-400',
    buttonBg: 'bg-sky-500',
    buttonText: 'text-white',
    inputBorder: 'border-sky-500/25',
    inputFocus: 'focus:border-sky-500/60',
    bodyBg: 'bg-[#071120]',
    queryLabel: 'KQL:',
    placeholder: 'SecurityEvent | where EventID == 4625 | summarize count() by Account',
    searchLabel: 'Run query',
    resultsNoun: 'incidents',
    columns: 'severity',
  },
  qradar: {
    name: 'IBM QRadar',
    tagline: 'AQL Search — Offenses',
    border: 'border-indigo-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(99,102,241,0.4)]',
    dot: 'bg-indigo-400',
    headerBg: 'bg-[#141227]',
    barBg: 'bg-[#0e0c1c]',
    labelText: 'text-indigo-400',
    buttonBg: 'bg-indigo-500',
    buttonText: 'text-white',
    inputBorder: 'border-indigo-500/25',
    inputFocus: 'focus:border-indigo-500/60',
    bodyBg: 'bg-[#0b0918]',
    queryLabel: 'AQL:',
    placeholder: "SELECT * FROM events WHERE category = 'Authentication' LAST 1 HOURS",
    searchLabel: 'Search',
    resultsNoun: 'offenses',
    columns: 'severity',
  },
  elastic: {
    name: 'Elastic Security',
    tagline: 'Kibana Discover',
    border: 'border-teal-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(20,184,166,0.4)]',
    dot: 'bg-teal-400',
    headerBg: 'bg-[#0c1a19]',
    barBg: 'bg-[#081413]',
    labelText: 'text-teal-400',
    buttonBg: 'bg-teal-500',
    buttonText: 'text-black',
    inputBorder: 'border-teal-500/25',
    inputFocus: 'focus:border-teal-500/60',
    bodyBg: 'bg-[#071312]',
    queryLabel: 'KQL:',
    placeholder: 'event.category: "authentication" and event.outcome: "failure"',
    searchLabel: 'Search',
    resultsNoun: 'documents',
    columns: 'event-type',
  },
  shodan: {
    name: 'Shodan',
    tagline: 'Internet-wide device search',
    border: 'border-red-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(239,68,68,0.4)]',
    dot: 'bg-red-500',
    headerBg: 'bg-[#1a0e0e]',
    barBg: 'bg-[#140a0a]',
    labelText: 'text-red-400',
    buttonBg: 'bg-red-500',
    buttonText: 'text-white',
    inputBorder: 'border-red-500/25',
    inputFocus: 'focus:border-red-500/60',
    bodyBg: 'bg-[#0f0808]',
    queryLabel: '🔍',
    placeholder: 'e.g. port:502 country:"US" or product:"MongoDB"',
    searchLabel: 'Search Shodan',
    resultsNoun: 'hosts',
    columns: 'event-type',
  },
  sherlock: {
    name: 'Sherlock',
    tagline: 'Username OSINT across 400+ sites',
    border: 'border-slate-400/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(148,163,184,0.4)]',
    dot: 'bg-slate-300',
    headerBg: 'bg-[#15171c]',
    barBg: 'bg-[#0e1013]',
    labelText: 'text-slate-300',
    buttonBg: 'bg-slate-300',
    buttonText: 'text-black',
    inputBorder: 'border-slate-400/25',
    inputFocus: 'focus:border-slate-400/60',
    bodyBg: 'bg-[#0c0d10]',
    queryLabel: '$ sherlock',
    placeholder: 'username to search, e.g. shadowbroker_88',
    searchLabel: 'Run',
    resultsNoun: 'sites checked',
    columns: 'raw',
    monospaceOutput: true,
  },
  maltego: {
    name: 'Maltego',
    tagline: 'Entity link-analysis transforms',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(245,158,11,0.4)]',
    dot: 'bg-amber-400',
    headerBg: 'bg-[#1a150c]',
    barBg: 'bg-[#141007]',
    labelText: 'text-amber-400',
    buttonBg: 'bg-amber-500',
    buttonText: 'text-black',
    inputBorder: 'border-amber-500/25',
    inputFocus: 'focus:border-amber-500/60',
    bodyBg: 'bg-[#0f0c06]',
    queryLabel: 'Transform:',
    placeholder: 'e.g. "to DNS from domain" or an entity value to pivot on',
    searchLabel: 'Run transform',
    resultsNoun: 'linked entities',
    columns: 'event-type',
  },
  eyewitness: {
    name: 'EyeWitness',
    tagline: 'Bulk web screenshot triage',
    border: 'border-violet-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(139,92,246,0.4)]',
    dot: 'bg-violet-400',
    headerBg: 'bg-[#150e1f]',
    barBg: 'bg-[#100a18]',
    labelText: 'text-violet-400',
    buttonBg: 'bg-violet-500',
    buttonText: 'text-white',
    inputBorder: 'border-violet-500/25',
    inputFocus: 'focus:border-violet-500/60',
    bodyBg: 'bg-[#0c0714]',
    queryLabel: 'filter:',
    placeholder: 'filter the report, e.g. "Login" or a host/IP',
    searchLabel: 'Filter report',
    resultsNoun: 'sites captured',
    columns: 'event-type',
  },
  theharvester: {
    name: 'theHarvester',
    tagline: 'Passive email/subdomain harvesting',
    border: 'border-cyan-500/40',
    glow: 'shadow-[0_0_40px_-12px_rgba(6,182,212,0.4)]',
    dot: 'bg-cyan-400',
    headerBg: 'bg-[#0a1a1c]',
    barBg: 'bg-[#071416]',
    labelText: 'text-cyan-400',
    buttonBg: 'bg-cyan-500',
    buttonText: 'text-black',
    inputBorder: 'border-cyan-500/25',
    inputFocus: 'focus:border-cyan-500/60',
    bodyBg: 'bg-[#06100f]',
    queryLabel: '$ theHarvester -d',
    placeholder: 'domain or keyword, e.g. target-corp.com',
    searchLabel: 'Run',
    resultsNoun: 'results',
    columns: 'raw',
    monospaceOutput: true,
  },
};

const SEVERITY_STYLE: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  Low: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
};

export default function SiemConsole({
  scenario,
  onFlagCaptured,
  onQueryRun,
  onTranscriptChange,
}: {
  scenario: SiemLabScenario;
  onFlagCaptured: (flag: string) => void;
  /** Fires once per query actually run (not every keystroke) — used to drive the guided-steps
   *  checklist's automatic tick-off, since each objective is designed to correspond to roughly one query. */
  onQueryRun?: () => void;
  /** Fires with the accumulated query/result log (plain text) after every query actually run — same
   *  role as Terminal's onTranscriptChange, for the AI lab tutor to see real session activity. */
  onTranscriptChange?: (transcript: string) => void;
}) {
  const b = BRANDING[scenario.tool];
  const [query, setQuery] = useState('');
  const [ran, setRan] = useState(false);
  const [searching, setSearching] = useState(false);
  const [, setHistory] = useState<string[]>([]);

  const run = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    const commit = () => {
      setSearching(false);
      setRan(true);
      const visible = scenario.entries.filter((e) => matchesQuery(e.line, q));
      visible.forEach((e) => {
        const flag = extractFlag(e.line);
        if (flag) onFlagCaptured(flag);
      });
      onQueryRun?.();
      const sample = visible.slice(0, 3).map((e) => `    ${e.line}`).join('\n');
      const entry =
        `${b.queryLabel} ${q}\n  ${visible.length} matching ${b.resultsNoun} (of ${scenario.entries.length} total)` +
        (sample ? `\n${sample}${visible.length > 3 ? '\n    ...' : ''}` : '');
      setHistory((h) => {
        const next = [...h, entry];
        onTranscriptChange?.(next.join('\n\n'));
        return next;
      });
    };
    if (b.searchDelayMs) {
      setSearching(true);
      setTimeout(commit, b.searchDelayMs);
    } else {
      commit();
    }
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e.line, query)) : scenario.entries;

  return (
    <div className={`flex flex-col h-full ${b.bodyBg} border-2 ${b.border} rounded-lg overflow-hidden ${b.glow} ${b.monospaceOutput ? 'font-mono' : ''}`}>
      {/* header */}
      <div className={`flex items-center gap-2 px-4 py-2.5 ${b.headerBg} border-b ${b.border}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${b.dot} shrink-0`} />
        <span className={`font-bold text-sm tracking-wide ${b.labelText}`}>{b.name}</span>
        <span className="text-xs text-slate-500">{b.tagline}</span>
        <span className="ml-auto text-[11px] font-mono text-slate-500">{scenario.datasetLabel}</span>
      </div>

      {/* query bar */}
      <div className={`px-4 py-2.5 border-b ${b.border} ${b.barBg} flex items-center gap-2`}>
        <span className={`font-mono text-sm shrink-0 ${b.labelText}`}>{b.queryLabel}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run(query)}
          placeholder={b.placeholder}
          className={`flex-1 min-w-0 bg-black/40 border ${b.inputBorder} rounded px-3 py-1.5 text-sm font-mono text-slate-200 placeholder:text-slate-600 outline-none ${b.inputFocus}`}
        />
        <button
          onClick={() => run(query)}
          className={`px-3.5 py-1.5 rounded ${b.buttonBg} ${b.buttonText} text-xs font-bold uppercase tracking-wide hover:brightness-110 transition shrink-0`}
        >
          {b.searchLabel}
        </button>
      </div>

      {/* results */}
      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <div className={`flex items-center justify-center h-full text-sm font-mono ${b.labelText} opacity-70`}>Running query&hellip;</div>
        ) : b.monospaceOutput ? (
          <div className="p-3 space-y-0.5">
            {results.map((e, i) => (
              <pre key={i} className="whitespace-pre-wrap break-all text-green-300 text-xs leading-relaxed">
                {e.timestamp ? `${e.timestamp} ` : ''}
                {e.line}
              </pre>
            ))}
            {results.length === 0 && <div className="text-green-800 text-xs px-1">0 {b.resultsNoun} matched.</div>}
          </div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className={`sticky top-0 ${b.headerBg} text-slate-400 uppercase text-[10px] tracking-wider`}>
              <tr>
                {b.columns === 'severity' && <th className="text-left px-3 py-2">Severity</th>}
                <th className="text-left px-3 py-2">Timestamp</th>
                {b.columns === 'event-type' && <th className="text-left px-3 py-2">Event Type</th>}
                <th className="text-left px-3 py-2">{b.columns === 'raw' ? 'Raw Event' : 'Details'}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((e, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                  {b.columns === 'severity' && (
                    <td className="px-3 py-2 align-top">
                      <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${SEVERITY_STYLE[e.severity ?? 'Low']}`}>
                        {e.severity ?? 'Low'}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2 align-top text-slate-500 whitespace-nowrap">{e.timestamp ?? '—'}</td>
                  {b.columns === 'event-type' && (
                    <td className="px-3 py-2 align-top">
                      <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold bg-white/5 ${b.labelText} ${b.border}`}>
                        {e.eventType ?? 'EVENT'}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2 align-top text-slate-300 whitespace-pre-wrap break-all">{e.line}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-600">No {b.resultsNoun} match this query.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={`px-4 py-1.5 border-t ${b.border} ${b.barBg} text-[11px] font-mono text-slate-500`}>
        {results.length} of {scenario.entries.length} {b.resultsNoun} shown
      </div>
    </div>
  );
}
