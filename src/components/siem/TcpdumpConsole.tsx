import { useState } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { matchesQuery, extractFlag } from '../../labs/siemTypes';

export default function TcpdumpConsole({
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
    const entry = `tcpdump -r capture.pcap -nn '${q}'\n  ${visible.length} packets (of ${scenario.entries.length} captured)`;
    const next = [...history, entry];
    setHistory(next);
    onTranscriptChange?.(next.join('\n\n'));
  };

  const results = ran ? scenario.entries.filter((e) => matchesQuery(e, appliedQuery)) : scenario.entries;

  return (
    <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden border border-black/30 shadow-lg font-mono text-sm">
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-3 h-9 bg-[#1a1a1a] border-b border-black/30 shrink-0">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-[#d0d0d0]/60">analyst@kali: ~</span>
        <span className="ml-auto text-xs text-[#d0d0d0]/40">{scenario.datasetLabel}</span>
      </div>

      {/* BPF filter line */}
      <div className="px-3 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-[#e0e0e0]">
          <span className="text-[#4ec9b0] shrink-0">$</span>
          <span className="text-[#d0d0d0]/70 shrink-0">tcpdump -r capture.pcap -nn</span>
          <input
            type="text"
            aria-label="Investigation query"
              value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(query)}
            placeholder="'host 8.8.8.8 and udp port 53'"
            className="flex-1 min-w-0 bg-transparent outline-none text-[#f0f0f0] placeholder:text-[#d0d0d0]/30"
          />
          <button
            onClick={() => run(query)}
            className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e0e0e0] text-xs rounded border border-white/10 transition shrink-0"
          >
            run
          </button>
        </div>
      </div>

      {/* Packet output */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {results.map((e, i) => (
          <div key={i} className="py-0.5 leading-relaxed text-[#e0e0e0] break-all">
            <span className="text-[#808080]">{e.timestamp ?? '—'}</span> {e.line}
          </div>
        ))}
        {results.length === 0 && <div className="py-10 text-center text-[#808080]">0 packets captured</div>}
      </div>

      <div className="px-3 py-1.5 bg-[#1a1a1a] border-t border-white/10 text-xs text-[#808080] shrink-0">
        {results.length} packets captured
      </div>
    </div>
  );
}
