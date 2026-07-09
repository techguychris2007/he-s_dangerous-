import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LABS, LAB_CATEGORIES } from '../data/labs';
import { useProgress } from '../state/progressStore';
import { IconFlag, IconCheck } from '../components/layout/icons';
import ModuleBanner from '../components/layout/ModuleBanner';

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  Medium: 'bg-[var(--color-warn)]/15 text-[var(--color-warn)]',
  Hard: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
};

const CATEGORY_BANNER: Record<string, string> = {
  Linux: 'linux',
  Network: 'networking',
  Web: 'webapp',
  'Active Directory': 'redteam',
  'Bug Bounty': 'bugbounty',
  Cloud: 'cloud',
  SOC: 'soc',
  Forensics: 'forensics',
};

export default function LabsIndexPage() {
  const progress = useProgress();
  const [filter, setFilter] = useState<string>('All');

  const filtered = filter === 'All' ? LABS : LABS.filter((l) => l.scenario.category === filter);
  const totalDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;

  return (
    <div className="max-w-5xl mx-auto px-8 py-14">
      <div className="text-[var(--color-accent)] font-mono text-sm mb-2">// hands-on</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3">Lab Catalog</h1>
      <p className="text-[var(--color-text-dim)] mb-2 leading-relaxed max-w-2xl">
        {LABS.length} fully interactive, guided labs across Linux privilege escalation, network service
        exploitation, web application vulnerabilities, Active Directory, cloud security, SOC &amp; threat
        hunting, digital forensics, and bug bounty methodology — each one a real command-line environment
        with step-by-step instructions, not a video.
      </p>
      <p className="text-sm text-[var(--color-accent-dim)] font-semibold mb-8">
        {totalDone} / {LABS.length} labs completed
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {['All', ...LAB_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === cat
                ? 'bg-[var(--color-navy)] border-[var(--color-navy)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 opacity-70">{LABS.filter((l) => l.scenario.category === cat).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filtered.map((lab) => {
          const captured = progress.flagCount(lab.scenario.id);
          const done = captured >= lab.scenario.totalFlags;
          return (
            <Link
              key={lab.slug}
              to={`/lab/${lab.slug}`}
              className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:shadow-md transition-all flex flex-col"
            >
              <ModuleBanner icon="flag" moduleId={CATEGORY_BANNER[lab.scenario.category] ?? 'linux'} className="h-24 w-full" />
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={`pill ${DIFFICULTY_CLASS[lab.scenario.difficulty]}`}>{lab.scenario.difficulty}</span>
                  <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{lab.scenario.category}</span>
                  <span className="pill bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]">Guided</span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-[var(--color-heading)] text-sm">{lab.scenario.title}</span>
                  {done && <IconCheck className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />}
                </div>
                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3 flex-1 line-clamp-2">{lab.scenario.briefing}</p>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
                  <IconFlag className="w-3 h-3" />
                  {captured}/{lab.scenario.totalFlags} flags
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
