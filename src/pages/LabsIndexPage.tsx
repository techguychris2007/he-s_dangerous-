import { useState } from 'react';
import { LABS, LAB_CATEGORIES, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';

export default function LabsIndexPage() {
  const progress = useProgress();
  const [filter, setFilter] = useState<string>('All');

  const filtered = filter === 'All' ? LABS_IN_ROADMAP_ORDER : LABS_IN_ROADMAP_ORDER.filter((l) => l.scenario.category === filter);
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
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((lab) => (
          <LabCard key={lab.slug} lab={lab} variant="catalog" />
        ))}
      </div>
    </div>
  );
}
