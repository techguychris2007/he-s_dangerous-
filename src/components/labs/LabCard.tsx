import { Link } from 'react-router-dom';
import type { LabEntry } from '../../data/labs';
import { useProgress } from '../../state/progressStore';
import { IconBookmark, IconCertificate, IconCheck, ModuleIcon } from '../layout/icons';
import ModuleBanner from '../layout/ModuleBanner';
import DifficultyPill from '../common/DifficultyPill';
import { getLabIconKey } from '../../data/labIcon';

const POINTS: Record<string, number> = { Easy: 10, Medium: 20, Hard: 30 };

export const CATEGORY_BANNER: Record<string, string> = {
  Linux: 'linux',
  Network: 'networking',
  Web: 'webapp',
  'Active Directory': 'redteam',
  'Bug Bounty': 'bugbounty',
  Cloud: 'cloud',
  SOC: 'soc',
  Forensics: 'forensics',
  'Security+': 'securityplus',
  'Binary Analysis': 'binaryanalysis',
  Malware: 'malware',
  'Security Engineering': 'secengineering',
};

export default function LabCard({ lab, variant = 'catalog' }: { lab: LabEntry; variant?: 'catalog' | 'task' }) {
  const progress = useProgress();
  const captured = progress.flagCount(lab.scenario.id);
  const total = lab.scenario.totalFlags;
  const done = captured >= total;
  const pct = Math.round((captured / total) * 100);
  const points = POINTS[lab.scenario.difficulty] ?? 10;
  const bookmarked = progress.isBookmarked(lab.scenario.id);
  const labUrl = `/lab/${lab.slug}`;
  const techIcon = getLabIconKey(lab);

  const ctaLabel =
    variant === 'task' ? (done ? 'Review task' : captured > 0 ? 'Continue task' : 'Start task') : 'Launch lab';

  return (
    <div className="card-gold-accent group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_var(--color-accent)] transition-all duration-200 flex flex-col">
      <div className="relative">
        <Link to={labUrl}>
          <ModuleBanner icon="flag" moduleId={CATEGORY_BANNER[lab.scenario.category] ?? 'linux'} className="h-28 w-full" />
        </Link>
        <span
          title={`${lab.scenario.category} technique`}
          className="absolute bottom-2 left-2 w-8 h-8 rounded-lg bg-black/45 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ModuleIcon icon={techIcon} className="w-4 h-4" />
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            progress.toggleBookmark(lab.scenario.id);
          }}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark this lab'}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this lab'}
          aria-pressed={bookmarked}
          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/35 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/55 transition-colors"
        >
          <IconBookmark className="w-4 h-4" filled={bookmarked} />
        </button>
        {done && (
          <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center">
            <IconCheck className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{lab.scenario.category}</span>
          <DifficultyPill difficulty={lab.scenario.difficulty} />
          {variant === 'task' && <span className="pill bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]">Report</span>}
        </div>

        <Link to={labUrl} className="font-semibold text-[var(--color-heading)] text-sm mb-1.5 hover:text-[var(--color-accent-dim)] transition-colors">
          {lab.scenario.title}
        </Link>

        <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3 line-clamp-2">
          {lab.scenario.briefing}{' '}
          <Link to={labUrl} className="text-[var(--color-accent-2)] font-medium whitespace-nowrap hover:underline">
            Read More
          </Link>
        </p>

        {variant === 'task' && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className={`h-full rounded-full ${done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-2xs text-[var(--color-text-dim)] mt-1 text-right font-mono">{pct}%</div>
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] pt-3 mb-3 border-t border-[var(--color-border)]">
            {done ? (
              <span className="flex items-center gap-1.5 text-[var(--color-gold-dim)] font-semibold">
                <IconCertificate className="w-3.5 h-3.5" /> Certificate earned
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-3">
              <span className="font-mono">{captured}/{total} flags</span>
              <span className="font-mono font-bold text-[var(--color-accent-dim)]">{points} pts</span>
            </span>
          </div>
          <Link
            to={labUrl}
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm text-center hover:brightness-110 transition flex items-center justify-center gap-1.5"
          >
            {ctaLabel} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
