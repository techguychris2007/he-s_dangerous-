import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROADMAP, findModule } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { ModuleIcon, IconCheck, IconLock, IconCrosshair } from '../components/layout/icons';
import type { RoadmapTrack } from '../types';

const TABS: { value: RoadmapTrack; label: string; blurb: string }[] = [
  {
    value: 'security',
    label: 'Offensive Security',
    blurb: 'Networking and Linux fundamentals up through red team, cloud, and bug bounty tradecraft.',
  },
  {
    value: 'programming',
    label: 'Programming',
    blurb: 'Python, C++, and JavaScript — general-purpose programming practice, independent of any security or ML track.',
  },
  {
    value: 'ml',
    label: 'Machine Learning',
    blurb: 'The full ML Portal curriculum, from Python/statistics foundations through neural networks, NLP, and MLOps.',
  },
];

export default function RoadmapPage() {
  const progress = useProgress();
  const [track, setTrack] = useState<RoadmapTrack>('security');

  const stages = ROADMAP.filter((s) => s.track === track);
  const activeTab = TABS.find((t) => t.value === track)!;

  // Real per-stage numbers, computed once so both the summary bar and the node list agree.
  const stageInfo = stages.map((stage) => {
    const mod = findModule(stage.moduleSlug);
    const totalLessons = mod?.lessons.length ?? 0;
    const doneLessons = mod ? mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length : 0;
    const available = stage.status === 'available';
    const complete = available && totalLessons > 0 && doneLessons === totalLessons;
    return { stage, mod, totalLessons, doneLessons, available, complete };
  });

  // "You are here": the first available-but-not-yet-complete stop — a wayfinding suggestion, not a
  // gate. Every available stage is already reachable in any order (this platform is deliberately
  // self-paced — see the Schedule page), so this never blocks navigation, it just marks a sensible
  // next step. -1 once every available stop is complete.
  const currentIndex = stageInfo.findIndex((s) => s.available && !s.complete);
  const stagesComplete = stageInfo.filter((s) => s.complete).length;
  const availableCount = stageInfo.filter((s) => s.available).length;
  const lessonsTotal = stageInfo.reduce((sum, s) => sum + s.totalLessons, 0);
  const lessonsDone = stageInfo.reduce((sum, s) => sum + s.doneLessons, 0);

  return (
    <div className="max-w-4xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// curriculum</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3">Learning Path</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTrack(tab.value)}
            aria-pressed={track === tab.value}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              track === tab.value
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-[var(--color-text-dim)] mb-6 leading-relaxed max-w-2xl">
        {activeTab.blurb} Follow the path top to bottom; each stop unlocks lessons
        {track === 'security' ? ' with an embedded guided lab' : ''}. Every available stop is open in
        any order — the marker below just suggests where to pick up.
      </p>

      <div className="flex flex-wrap gap-3 mb-12">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-lg font-bold text-[var(--color-heading)]">{stagesComplete}/{availableCount}</div>
          <div className="text-2xs text-[var(--color-text-dim)] uppercase tracking-wide">Stops complete</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="text-lg font-bold text-[var(--color-heading)]">{lessonsDone}/{lessonsTotal}</div>
          <div className="text-2xs text-[var(--color-text-dim)] uppercase tracking-wide">Lessons complete</div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 bg-[var(--color-border)] rounded-full hidden md:block" />
        <div className="absolute left-6 top-4 bottom-4 w-1 bg-[var(--color-border)] rounded-full md:hidden" />
        {/* Progress fill over the spine, up to (but not past) the current stop — shows real distance
            traveled instead of just a series of independent node colors. */}
        {currentIndex > 0 && (
          <>
            <div
              className="absolute left-1/2 top-4 -translate-x-1/2 w-1 bg-[var(--color-accent)] rounded-full hidden md:block"
              style={{ height: `${(currentIndex / stages.length) * 100}%` }}
            />
            <div
              className="absolute left-6 top-4 w-1 bg-[var(--color-accent)] rounded-full md:hidden"
              style={{ height: `${(currentIndex / stages.length) * 100}%` }}
            />
          </>
        )}

        <div className="flex flex-col gap-8">
          {stageInfo.map(({ stage, mod, totalLessons, doneLessons, available, complete }, i) => {
            const leftSide = i % 2 === 0;
            const isHere = i === currentIndex;

            const nodeColor = complete
              ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
              : available
              ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-dim)]';

            return (
              <div key={stage.title} className="relative md:flex md:items-center md:justify-center">
                <div
                  className={`absolute left-6 md:left-1/2 top-1/2 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${nodeColor} ${
                    isHere ? 'here-pulse-ring' : ''
                  }`}
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
                      isHere
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                        : available
                        ? 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50'
                        : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[var(--color-text-dim)]">Stop {i + 1}</span>
                      {isHere && (
                        <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center gap-1">
                          <IconCrosshair className="w-3 h-3" /> You are here
                        </span>
                      )}
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
