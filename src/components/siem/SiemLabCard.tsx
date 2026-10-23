import { Link } from 'react-router-dom';
import { useProgress } from '../../state/progressStore';
import { IconCheck, IconFlag, IconRadar } from '../layout/icons';

interface LabCardData {
  id: string;
  title: string;
  briefing: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tool: string;
  totalFlags: number;
}

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
  Hard: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
};

const TOOL_STYLE: Record<string, { label: string; short: string }> = {
  suricata: { label: 'Suricata', short: 'SUR' },
  chronicle: { label: 'Chronicle', short: 'CHR' },
  tcpdump: { label: 'tcpdump', short: 'TCP' },
  splunk: { label: 'Splunk', short: 'SPL' },
  sentinel: { label: 'Sentinel', short: 'SEN' },
  qradar: { label: 'QRadar', short: 'QRA' },
  elastic: { label: 'Elastic', short: 'ELA' },
  shodan: { label: 'Shodan', short: 'SHO' },
  sherlock: { label: 'Sherlock', short: 'SHR' },
  maltego: { label: 'Maltego', short: 'MAL' },
  eyewitness: { label: 'EyeWitness', short: 'EYE' },
  theharvester: { label: 'theHarvester', short: 'THV' },
};

export default function SiemLabCard({ lab }: { lab: LabCardData }) {
  const progress = useProgress();
  const captured = progress.flagCount(lab.id);
  const total = Math.max(lab.totalFlags, 1);
  const done = captured >= total;
  const progressPct = Math.min(100, Math.round((captured / total) * 100));
  const tool = TOOL_STYLE[lab.tool] ?? { label: lab.tool, short: lab.tool.slice(0, 3).toUpperCase() };
  const url = `/siem-lab/${lab.id}`;
  const status = done ? 'Complete' : captured > 0 ? 'In progress' : 'Not started';

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_8px_-5px_var(--color-heading)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/50 hover:shadow-[0_10px_24px_-16px_var(--color-accent)] motion-reduce:transform-none motion-reduce:transition-none">
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-accent)] opacity-70 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] font-mono text-xs font-bold text-[var(--color-accent)]">
              {tool.short}
            </div>
            <div className="min-w-0">
              <div className="truncate text-2xs font-semibold uppercase tracking-[.1em] text-[var(--color-text-dim)]">Investigation case</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-heading)]">{tool.label}</span>
                <span aria-hidden className="text-[var(--color-border)]">·</span>
                <span className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${DIFFICULTY_CLASS[lab.difficulty]}`}>{lab.difficulty}</span>
              </div>
            </div>
          </div>
          {done ? (
            <span aria-label="Completed" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-success)] text-white"><IconCheck className="h-4 w-4" /></span>
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)]"><IconRadar className="h-3.5 w-3.5" /></span>
          )}
        </div>

        <Link to={url} className="block min-h-[3.25rem] text-[17px] font-bold leading-snug tracking-[-.02em] text-[var(--color-heading)] transition-colors group-hover:text-[var(--color-accent)]">
          {lab.title}
        </Link>

        <p className="mt-2.5 line-clamp-3 min-h-[4.1rem] text-[13px] leading-[1.65] text-[var(--color-text-dim)]">{lab.briefing}</p>

        <div className="mt-auto pt-4" aria-label={`${progressPct}% complete`}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-semibold text-[var(--color-text-dim)]"><span className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-[var(--color-success)]' : captured > 0 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />{status}</span>
            <span className="font-mono text-2xs font-semibold text-[var(--color-text-dim)]">{captured}/{total} flags</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]" role="progressbar" aria-label={`${lab.title} completion`} aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full transition-all duration-300 motion-reduce:transition-none ${done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
        <Link to={url} className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
          <IconFlag className="mr-2 h-3.5 w-3.5" /> {done ? 'Review case' : captured > 0 ? 'Continue case' : 'Open case'} <span className="ml-1" aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
