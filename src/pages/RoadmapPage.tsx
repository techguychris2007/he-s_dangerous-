import { Link } from 'react-router-dom';
import { ROADMAP, findModule } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { ModuleIcon, IconCheck, IconLock } from '../components/layout/icons';

export default function RoadmapPage() {
  const progress = useProgress();

  return (
    <div className="max-w-4xl mx-auto px-8 py-14">
      <div className="text-[var(--color-accent)] font-mono text-sm mb-2">// curriculum</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3">Learning Path</h1>
      <p className="text-[var(--color-text-dim)] mb-12 leading-relaxed max-w-2xl">
        The full curriculum, in the order it's meant to be taken — networking and Linux fundamentals up
        through red team, cloud, and bug bounty tradecraft. Follow the path top to bottom; each stop
        unlocks lessons with an embedded guided lab.
      </p>

      <div className="relative">
        <div className="absolute left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-[var(--color-border)] rounded-full hidden md:block" />
        <div className="absolute left-6 top-4 bottom-4 w-1 bg-[var(--color-border)] rounded-full md:hidden" />

        <div className="flex flex-col gap-8">
          {ROADMAP.map((stage, i) => {
            const mod = findModule(stage.moduleSlug);
            const totalLessons = mod?.lessons.length ?? 0;
            const doneLessons = mod ? mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length : 0;
            const complete = totalLessons > 0 && doneLessons === totalLessons;
            const available = stage.status === 'available';
            const leftSide = i % 2 === 0;

            const nodeColor = complete
              ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
              : available
              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-dim)]';

            return (
              <div key={i} className="relative md:flex md:items-center md:justify-center">
                <div
                  className={`absolute left-6 md:left-1/2 top-1/2 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${nodeColor}`}
                >
                  {complete ? (
                    <IconCheck className="w-5 h-5" />
                  ) : available ? (
                    <ModuleIcon icon={mod?.icon ?? 'flag'} className="w-5 h-5" />
                  ) : (
                    <IconLock className="w-4.5 h-4.5" />
                  )}
                </div>

                <div
                  className={`ml-16 md:ml-0 md:w-[calc(50%-3.5rem)] ${
                    leftSide ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:order-2'
                  }`}
                >
                  <div
                    className={`rounded-xl border p-4 transition-colors ${
                      available
                        ? 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50'
                        : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[var(--color-text-dim)]">Stop {i + 1}</span>
                      {complete && <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)]">Complete</span>}
                      {!available && <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">Coming soon</span>}
                    </div>
                    {stage.href || stage.moduleSlug ? (
                      <Link
                        to={stage.href ?? `/module/${stage.moduleSlug}`}
                        className="font-bold text-[var(--color-heading)] hover:text-[var(--color-accent-2)] block mb-1"
                      >
                        {stage.title}
                      </Link>
                    ) : (
                      <div className="font-bold text-[var(--color-text-dim)] mb-1">{stage.title}</div>
                    )}
                    {mod && totalLessons > 0 && (
                      <div className="text-xs text-[var(--color-text-dim)] mb-1.5 font-mono">
                        {doneLessons}/{totalLessons} lessons complete
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-text-dim)]">
                      Source: {stage.sourceBooks.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
