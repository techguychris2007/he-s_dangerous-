import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { LabEntry } from '../../data/labs';
import { useLabProgress, useProgressActions } from '../../state/progressStore';
import { IconBookmark, IconCertificate, IconCheck, IconStar, ModuleIcon } from '../layout/icons';
import DifficultyPill from '../common/DifficultyPill';
import { getLabIconKey } from '../../data/labIcon';
import type { LabRatingSummary } from '../../lib/labRatings';
import '../common/workspace-header.css';

const POINTS: Record<string, number> = { Easy: 10, Medium: 20, Hard: 30 };

export default memo(function LabCard({
  lab,
  variant = 'catalog',
  ratingSummary,
}: {
  lab: LabEntry;
  variant?: 'catalog' | 'task';
  ratingSummary?: LabRatingSummary;
}) {
  const { flagCount: captured, isBookmarked: bookmarked } = useLabProgress(lab.scenario.id);
  const { toggleBookmark } = useProgressActions();
  const total = Math.max(lab.scenario.totalFlags, 1);
  const done = captured >= total;
  const pct = Math.min(100, Math.round((captured / total) * 100));
  const points = POINTS[lab.scenario.difficulty] ?? 10;
  const labUrl = `/lab/${lab.slug}`;
  const techIcon = getLabIconKey(lab);
  const status = done ? 'Complete' : captured > 0 ? 'In progress' : 'Not started';
  const ctaLabel = variant === 'task' ? (done ? 'Review task' : captured > 0 ? 'Continue task' : 'Start task') : done ? 'Review lab' : captured > 0 ? 'Continue lab' : 'Launch lab';

  if (variant === 'task') return <article className="task-lab-row">
    <span className="task-lab-icon" aria-hidden="true"><ModuleIcon icon={techIcon} className="h-5 w-5" /></span>
    <div className="task-lab-content"><div className="task-lab-meta"><span>{lab.scenario.category}</span><span>·</span><span>{lab.scenario.difficulty}</span><span>·</span><span>{points} points</span></div><Link to={labUrl} className="task-lab-title">{lab.scenario.title}</Link><p className="line-clamp-2">{lab.scenario.briefing}</p><div className="task-lab-status"><span>{status}</span><span>{Math.min(captured, total)} of {total} flags captured</span>{done && <span className="text-[var(--color-success)]">Completed ✓</span>}</div></div>
    <div className="task-lab-actions"><Link to={labUrl}>{ctaLabel} →</Link><button onClick={() => toggleBookmark(lab.scenario.id)} aria-pressed={bookmarked} aria-label={`${bookmarked ? 'Remove bookmark from' : 'Bookmark'} ${lab.scenario.title}`} className={bookmarked ? 'text-[var(--color-gold-dim)]' : 'text-[var(--color-text-dim)]'}><IconBookmark className="h-4 w-4" filled={bookmarked} /></button></div>
  </article>;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_8px_-5px_var(--color-heading)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/50 hover:shadow-[0_10px_24px_-16px_var(--color-accent)]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-accent)] opacity-70 transition-opacity group-hover:opacity-100" />

      <div className="p-4 pb-3.5 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-accent)]">
              <ModuleIcon icon={techIcon} className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--color-text-dim)]">{lab.scenario.category}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <DifficultyPill difficulty={lab.scenario.difficulty} />
                {(lab.scenario.webApplication || lab.scenario.directoryMap) && <span className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[.08em] text-[var(--color-accent)]">{lab.scenario.webApplication ? 'Website' : 'Map'}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleBookmark(lab.scenario.id);
            }}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark this lab'}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this lab'}
            aria-pressed={bookmarked}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${bookmarked ? 'border-[var(--color-gold)]/35 bg-[var(--color-gold-soft)] text-[var(--color-gold-dim)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'}`}
          >
            <IconBookmark className="h-4 w-4" filled={bookmarked} />
          </button>
        </div>

        <Link to={labUrl} className="block text-[17px] font-bold leading-snug tracking-[-.025em] text-[var(--color-heading)] transition-colors group-hover:text-[var(--color-accent)]">
          {lab.scenario.title}
        </Link>

        <p className="mt-2.5 line-clamp-3 min-h-[4.25rem] text-[13px] leading-[1.65] text-[var(--color-text-dim)]">
          {lab.scenario.briefing}
        </p>

        <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3" aria-label={`${pct}% complete`}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className={`font-black uppercase tracking-[.12em] ${done ? 'text-[var(--color-success)]' : captured > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-dim)]'}`}>{status}</span>
            <span className="font-mono font-bold text-[var(--color-text-dim)]">{captured}/{total} flags</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]/70" role="progressbar" aria-label={`${lab.scenario.title} completion`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full transition-all duration-300 motion-reduce:transition-none ${done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-bg)]/55 p-3.5 sm:px-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[var(--color-text-dim)]">
          <div className="flex items-center gap-2">
            {done ? <span className="inline-flex items-center gap-1.5 font-black text-[var(--color-gold-dim)]"><IconCertificate className="h-3.5 w-3.5" /> Certificate earned</span> : <span className="font-bold">{points} pts</span>}
          </div>
          {ratingSummary && ratingSummary.ratingCount > 0 && (
            <span title={`${ratingSummary.avgRating.toFixed(1)}/5 from ${ratingSummary.ratingCount} rating${ratingSummary.ratingCount === 1 ? '' : 's'}`} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-gold-soft)] px-2 py-1 font-black text-[var(--color-gold-dim)]">
              <IconStar className="h-3 w-3" filled /> {ratingSummary.avgRating.toFixed(1)}
            </span>
          )}
        </div>
        <Link to={labUrl} className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-accent-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
          {done && <IconCheck className="mr-2 h-4 w-4" />}{ctaLabel} →
        </Link>
      </div>
    </article>
  );
});
