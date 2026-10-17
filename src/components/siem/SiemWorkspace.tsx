import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { SiemLabScenario } from '../../labs/siemTypes';
import './siem-workspace.css';

/** Shared investigation chrome; the individual tools keep their own query and result UI. */
export default function SiemWorkspace({ scenario, children }: { scenario: SiemLabScenario; children: ReactNode }) {
  const workspace = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState('');
  const priority = scenario.entries.filter((entry) => entry.severity === 'Critical' || entry.severity === 'High').length;
  const classified = scenario.entries.some((entry) => entry.severity);
  const types = new Set(scenario.entries.flatMap((entry) => entry.eventType ? [entry.eventType] : []));

  useEffect(() => {
    const update = () => setExpanded(document.fullscreenElement === workspace.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === workspace.current) await document.exitFullscreen();
      else await workspace.current?.requestFullscreen();
      setNotice('');
    } catch {
      setNotice('Full screen is unavailable in this browser.');
    }
  }

  return (
    <section ref={workspace} aria-label="Investigation workspace" className="siem-workspace flex h-full min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-slate-700/60 bg-[#0c1220] shadow-xl">
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Security operations
          </div>
          <h2 className="text-sm font-semibold text-slate-100">Investigation workspace</h2>
        </div>
        <button type="button" onClick={toggleFullscreen} aria-pressed={expanded} className="flex items-center gap-2 rounded-lg border border-slate-600/70 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/60 hover:bg-slate-700">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4" /></svg>
          {expanded ? 'Exit full screen' : 'Full screen'}
        </button>
      </header>
      <dl className="shrink-0 grid grid-cols-2 gap-px border-b border-slate-700/50 bg-slate-700/30 sm:grid-cols-4">
        {[
          { label: 'Dataset records', value: scenario.entries.length.toLocaleString() },
          { label: classified ? 'High / critical' : 'Event types', value: classified ? priority.toLocaleString() : types.size || 'Unclassified' },
          { label: 'Objectives', value: scenario.objectives.length },
          { label: 'Environment', value: 'Simulation' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#101827] px-4 py-3 sm:px-5">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{stat.label}</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-100">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className="shrink-0 flex items-start gap-2 border-b border-slate-700/40 px-4 py-2 text-xs text-slate-400 sm:px-5">
        <span className="shrink-0 font-medium text-slate-300">Source</span>
        <span className="min-w-0 break-words">{scenario.datasetLabel}</span>
      </div>
      {notice && <p role="status" className="px-4 py-2 text-xs text-amber-300">{notice}</p>}
      <div className="siem-workspace-console flex min-h-[420px] flex-[1_0_420px] flex-col p-2 sm:p-3">{children}</div>
      <p className="shrink-0 px-4 pb-2 text-[10px] leading-relaxed text-slate-400 sm:px-5">Training search supports text, patterns and selected field/value examples. It does not execute the full vendor query language or connect to a live SIEM.</p>
      <footer className="shrink-0 flex flex-wrap justify-between gap-2 px-4 pb-3 text-[10px] text-slate-400 sm:px-5">
        <span>Search → inspect evidence → complete objectives</span>
        <span>{expanded ? 'Press Esc to return to your lab guide' : scenario.tool === 'sentinel' ? 'Press Ctrl+Enter to run the query' : 'Press Enter in the query field to search'}</span>
      </footer>
    </section>
  );
}
