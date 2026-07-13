import { Link } from 'react-router-dom';
import type { SiemLabScenario } from '../../labs/siemTypes';
import { useProgress } from '../../state/progressStore';
import { IconCheck, IconFlag } from '../layout/icons';

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/30',
  Medium: 'bg-[var(--color-warn)]/20 text-[var(--color-warn)] border border-[var(--color-warn)]/30',
  Hard: 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/30',
};

const TOOL_STYLE: Record<string, { label: string; class: string }> = {
  suricata: { label: 'Suricata', class: 'bg-orange-500/15 text-orange-500 border border-orange-500/30' },
  chronicle: { label: 'Chronicle', class: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  tcpdump: { label: 'tcpdump', class: 'bg-green-500/15 text-green-500 border border-green-500/30' },
  splunk: { label: 'Splunk', class: 'bg-lime-500/15 text-lime-500 border border-lime-500/30' },
  sentinel: { label: 'Sentinel', class: 'bg-sky-500/15 text-sky-400 border border-sky-500/30' },
  qradar: { label: 'QRadar', class: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' },
  elastic: { label: 'Elastic', class: 'bg-teal-500/15 text-teal-400 border border-teal-500/30' },
};

export default function SiemLabCard({ lab }: { lab: SiemLabScenario }) {
  const progress = useProgress();
  const captured = progress.flagCount(lab.id);
  const done = captured >= lab.totalFlags;
  const tool = TOOL_STYLE[lab.tool];
  const url = `/siem-lab/${lab.id}`;

  return (
    <div className="group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_var(--color-accent)] transition-all duration-200 flex flex-col">
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className={`pill ${tool.class}`}>{tool.label}</span>
          <span className={`pill ${DIFFICULTY_CLASS[lab.difficulty]}`}>{lab.difficulty}</span>
          {done && (
            <span className="ml-auto w-6 h-6 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center shrink-0">
              <IconCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <Link to={url} className="font-semibold text-[var(--color-heading)] text-sm mb-1.5 hover:text-[var(--color-accent-dim)] transition-colors">
          {lab.title}
        </Link>

        <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3 line-clamp-2">{lab.briefing}</p>

        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] pt-3 mb-3 border-t border-[var(--color-border)]">
            <span className="font-mono">{captured}/{lab.totalFlags} flags</span>
          </div>
          <Link
            to={url}
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm text-center hover:brightness-110 transition flex items-center justify-center gap-1.5"
          >
            <IconFlag className="w-3.5 h-3.5" /> Launch lab &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
