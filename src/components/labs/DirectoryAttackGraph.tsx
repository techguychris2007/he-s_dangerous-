import { useState } from 'react';
import type { DirectoryMapDef } from '../../labs/types';
import type { LabSnapshot } from '../../labs/engine';

export default function DirectoryAttackGraph({ map, snapshot }: { map: DirectoryMapDef; snapshot?: LabSnapshot }) {
  const [selectedId, setSelectedId] = useState(map.nodes[0].id);
  const events = snapshot?.events ?? [];
  const selected = map.nodes.find(node => node.id === selectedId) ?? map.nodes[0];
  const relevantEvents = events.filter(event => event.hostIp === selected.hostIp && (!selected.actor || event.actor === selected.actor));
  const edgeState = (edge: DirectoryMapDef['edges'][number]) => {
    const evidence = events.find(event => event.kind === edge.event && event.hostIp === edge.hostIp && (!edge.actor || event.actor === edge.actor));
    if (!evidence) return 'unverified';
    return 'verified';
  };
  return (
    <section aria-label="Live directory attack graph" className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#101a25] text-[#d9e4ef] shadow-lg">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#263444] p-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#91a4b7]">Directory relationship map</p><h2 className="mt-1 text-base font-bold tracking-tight text-white">{map.domain}</h2></div>
        <span className="rounded-full border border-[#345044] bg-[#173127] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8bd8b0]">Live evidence</span>
      </header>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 610 300" role="img" aria-label="Known directory topology. Use the node buttons and relationship table below for complete accessible details." className="h-auto w-full min-w-[430px]">
          <defs><pattern id="directory-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#2b3b4c" /></pattern></defs>
          <rect width="610" height="300" fill="url(#directory-grid)" />
          {map.edges.map((edge, index) => {
            const source = map.nodes.find(node => node.id === edge.from)!;
            const target = map.nodes.find(node => node.id === edge.to)!;
            const state = edgeState(edge);
            const color = state === 'verified' ? '#75d3aa' : '#506476';
            return <g key={index}><line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={color} strokeWidth={state === 'unverified' ? 1.5 : 2.5} strokeDasharray={state === 'verified' ? undefined : '5 5'} /><circle cx={(source.x + target.x) / 2} cy={(source.y + target.y) / 2} r="5" fill={color} /></g>;
          })}
          {map.nodes.map(node => {
            const session = snapshot?.sessions.find(item => item.hostIp === node.hostIp && (!node.actor || node.actor === item.user));
            const observed = events.some(event => event.hostIp === node.hostIp && (!node.actor || node.actor === event.actor) && event.kind !== 'contact');
            return <g key={node.id}>
              <rect x={node.x - 110} y={node.y - 32} width="220" height="65" rx="12" fill={node.id === selectedId ? '#22374b' : '#172635'} stroke={session ? '#75d3aa' : observed ? '#88afd2' : '#3b5063'} strokeWidth={node.id === selectedId ? 2 : 1} />
              <text x={node.x - 94} y={node.y - 10} fontSize="9" fill="#91a4b7" letterSpacing="1">{node.kind.toUpperCase()}{session ? ' · ACTIVE' : ''}</text>
              <text x={node.x - 94} y={node.y + 6} fontSize="12" fontWeight="600" fill="#e5edf5">{node.label}</text>
              <text x={node.x - 94} y={node.y + 22} fontSize="9" fill="#a4b7c9">{node.subtitle}</text>
            </g>;
          })}
        </svg>
      </div>
      <div className="space-y-3 px-4 pb-4">
        <div className="flex flex-wrap gap-2" aria-label="Inspect directory nodes">{map.nodes.map(node => <button type="button" key={node.id} onClick={() => setSelectedId(node.id)} aria-pressed={selected.id === node.id} className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75d3aa] ${selected.id === node.id ? 'border-[#7fa8cb] bg-[#253d51] text-white' : 'border-[#34495b] text-[#afc2d3] hover:bg-[#203347]'}`}>{node.label}</button>)}</div>
        <div className="rounded-lg border border-[#314557] bg-[#152332] p-3" aria-live="polite"><p className="text-xs font-semibold text-[#e5edf5]">{selected.label} · {selected.kind}</p><p className="mt-1 text-xs leading-relaxed text-[#9db2c5]">{relevantEvents.at(-1)?.detail ?? 'Known from assessment scope. No access relationship has been proved in this attempt.'}</p></div>
        <details>
          <summary className="cursor-pointer text-xs font-semibold text-[#bbcede]">Relationship evidence and status</summary>
          <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-[11px]"><thead><tr className="border-b border-[#314557] text-[#90a5b9]"><th className="py-2 pr-3 font-medium">Relationship</th><th className="py-2 font-medium">Observed state</th></tr></thead><tbody>{map.edges.map((edge, index) => <tr key={index} className="border-b border-[#263a4b]"><td className="py-2 pr-3">{map.nodes.find(node => node.id === edge.from)?.label} → {map.nodes.find(node => node.id === edge.to)?.label}<span className="block text-[#91a7bb]">{edge.label}</span></td><td className="py-2 capitalize">{edgeState(edge)}</td></tr>)}</tbody></table></div>
        </details>
        <p className="text-[11px] leading-relaxed text-[#91a7bb]">{map.description} Green means verified evidence. Dashed means unverified. The graph is a learning view of identity relationships.</p>
      </div>
    </section>
  );
}
