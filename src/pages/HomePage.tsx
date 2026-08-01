import { Link } from 'react-router-dom';
import { MODULES } from '../data/curriculum';
import { LABS, LAB_CATEGORIES, labsForCategory } from '../data/labs';
import { useProgress } from '../state/progressStore';
import { ACHIEVEMENTS, computeStreak } from '../data/achievements';
import { IconChart, IconFlask, IconCheck, IconFlag, IconArrowRight, ModuleIcon } from '../components/layout/icons';
import ModuleBanner from '../components/layout/ModuleBanner';
import StatCard from '../components/common/StatCard';
import { CATEGORY_BANNER } from '../components/labs/LabCard';

export default function HomePage() {
  const progress = useProgress();

  const totalLessons = MODULES.reduce((n, m) => n + m.lessons.length, 0);
  const completedLessons = MODULES.reduce(
    (n, m) => n + m.lessons.filter((l) => progress.isLessonComplete(l.id)).length,
    0,
  );
  const totalFlags = LABS.reduce((n, l) => n + l.scenario.totalFlags, 0);
  const capturedFlags = LABS.reduce((n, l) => n + progress.flagCount(l.scenario.id), 0);
  const labsDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
  const streak = computeStreak(progress.activityDates);
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.isUnlocked(progress));

  // "What skills am I building?" — real per-category lab completion, not a fabricated skill score.
  const skillProgress = LAB_CATEGORIES.map((category) => {
    const catLabs = labsForCategory(category);
    const done = catLabs.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
    return { category, done, total: catLabs.length };
  });

  // "What should I do next?" — an in-progress lab wins (you already have real momentum on it);
  // otherwise the next incomplete lesson in curriculum order; otherwise everything's done.
  const inProgressLab = LABS.find((l) => {
    const captured = progress.flagCount(l.scenario.id);
    return captured > 0 && captured < l.scenario.totalFlags;
  });
  const allLessonsInOrder = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug, moduleTitle: m.title })));
  const nextLesson = allLessonsInOrder.find((l) => !progress.isLessonComplete(l.id)) ?? null;

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-8 reveal flex items-start justify-between flex-wrap gap-3" style={{ '--reveal-delay': '0s' } as React.CSSProperties}>
        <div>
          <div className="gold-eyebrow mb-2">Learner Portal</div>
          <h1 className="text-3xl font-extrabold text-[var(--color-heading)] mb-2">
            Welcome back{progress.learnerName ? `, ${progress.learnerName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[var(--color-text-dim)] max-w-2xl leading-relaxed">
            A full offensive-security curriculum: networking, Linux, reconnaissance, Python tooling, web app
            hacking, red teaming/Active Directory, cloud security, SOC &amp; threat hunting, digital
            forensics, and bug bounty methodology — every lesson paired with a real interactive lab.
          </p>
        </div>
        {streak.current > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 shrink-0">
            <span className="text-lg leading-none">🔥</span>
            <span className="text-sm font-bold text-[var(--color-heading)]">{streak.current}</span>
            <span className="text-xs text-[var(--color-text-dim)]">day streak</span>
          </div>
        )}
      </div>

      {/* The single most important answer a dashboard should give: what do I do right now? */}
      {(inProgressLab || nextLesson) && (
        <Link
          to={inProgressLab ? `/lab/${inProgressLab.slug}` : `/module/${nextLesson!.moduleSlug}/lesson/${nextLesson!.slug}`}
          className="group block rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-surface)] p-6 mb-6 reveal hover:border-[var(--color-accent)]/60 transition-all"
          style={{ '--reveal-delay': '0.04s', boxShadow: 'var(--shadow-glow-accent)' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-accent-dim)] mb-2">
                {inProgressLab ? 'Continue where you left off' : 'Up next'}
              </div>
              <div className="text-xl font-bold text-[var(--color-heading)] mb-1 truncate">
                {inProgressLab ? inProgressLab.scenario.title : nextLesson!.title}
              </div>
              <div className="text-sm text-[var(--color-text-dim)]">
                {inProgressLab
                  ? `${progress.flagCount(inProgressLab.scenario.id)}/${inProgressLab.scenario.totalFlags} flags captured`
                  : `Next lesson in ${nextLesson!.moduleTitle}`}
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold shrink-0 group-hover:brightness-110 transition">
              {inProgressLab ? 'Resume lab' : 'Start lesson'} <IconArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 reveal" style={{ '--reveal-delay': '0.08s' } as React.CSSProperties}>
        <StatCard icon={<IconChart className="w-5 h-5" />} color="var(--color-accent-2)" label="Lessons completed" value={`${completedLessons} / ${totalLessons}`} />
        <StatCard icon={<IconFlask className="w-5 h-5" />} color="var(--color-accent)" label="Labs solved" value={`${labsDone} / ${LABS.length}`} />
        <StatCard icon={<IconCheck className="w-5 h-5" />} color="var(--color-success)" label="Flags captured" value={`${capturedFlags} / ${totalFlags}`} />
        <StatCard
          icon={<span className="text-lg leading-none">🔥</span>}
          color="var(--color-warn)"
          label={streak.current > 0 ? 'Current streak' : 'Longest streak'}
          value={`${streak.current > 0 ? streak.current : streak.longest} day${(streak.current > 0 ? streak.current : streak.longest) === 1 ? '' : 's'}`}
        />
      </div>

      <div className="flex items-center justify-between mb-4 reveal" style={{ '--reveal-delay': '0.12s' } as React.CSSProperties}>
        <h2 className="text-base font-bold text-[var(--color-heading)]">Achievements</h2>
        <Link to="/profile" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
          {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked &rarr;
        </Link>
      </div>
      {unlockedAchievements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 mb-10 text-sm text-[var(--color-text-dim)] reveal" style={{ '--reveal-delay': '0.14s' } as React.CSSProperties}>
          Capture your first flag or complete a lesson to unlock your first achievement.
        </div>
      ) : (
        <div className="flex gap-3 mb-10 overflow-x-auto pb-1 reveal" style={{ '--reveal-delay': '0.14s' } as React.CSSProperties}>
          {unlockedAchievements.map((a) => (
            <div
              key={a.id}
              title={a.description}
              className="flex items-center gap-2.5 shrink-0 rounded-xl border border-[var(--color-gold)]/30 bg-[var(--color-gold-soft)] px-4 py-2.5"
            >
              <span className="text-xl leading-none">{a.icon}</span>
              <span className="text-sm font-semibold text-[var(--color-gold-dim)] whitespace-nowrap">{a.title}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-base font-bold text-[var(--color-heading)] mb-4 reveal" style={{ '--reveal-delay': '0.16s' } as React.CSSProperties}>Skills</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10 reveal" style={{ '--reveal-delay': '0.18s' } as React.CSSProperties}>
        {skillProgress.map(({ category, done, total }) => (
          <Link
            key={category}
            to={`/labs?category=${encodeURIComponent(category)}`}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 hover:border-[var(--color-accent)]/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <ModuleIcon icon={CATEGORY_BANNER[category] ?? 'linux'} className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
              <span className="text-sm font-semibold text-[var(--color-heading)] truncate">{category}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full ${done === total && total > 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
                style={{ width: `${total ? (100 * done) / total : 0}%` }}
              />
            </div>
            <div className="text-xs text-[var(--color-text-dim)]">{done}/{total} labs</div>
          </Link>
        ))}
      </div>

      <h2 className="text-base font-bold text-[var(--color-heading)] mb-4 reveal" style={{ '--reveal-delay': '0.22s' } as React.CSSProperties}>Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {MODULES.map((mod, i) => {
          const done = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
          const labCount = mod.lessons.length;
          return (
            <Link
              key={mod.id}
              to={mod.lessons.length ? `/module/${mod.slug}/lesson/${mod.lessons[0].slug}` : '/roadmap'}
              className="group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50 hover:shadow-md transition-all flex flex-col reveal"
              style={{ '--reveal-delay': `${0.26 + Math.min(i, 5) * 0.05}s` } as React.CSSProperties}
            >
              <ModuleBanner icon={mod.icon} moduleId={mod.id} className="h-28 w-full" />
              <div className="p-4 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="pill bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]">{mod.lessons.length} lessons</span>
                </div>
                <div className="font-bold text-[var(--color-heading)] mb-1">{mod.title}</div>
                <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-3 flex-1">{mod.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full"
                      style={{ width: `${labCount ? (100 * done) / labCount : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-dim)] shrink-0">{done}/{labCount}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent)] p-6 flex items-center justify-between flex-wrap gap-3 reveal"
        style={{ '--reveal-delay': '0.4s' } as React.CSSProperties}
      >
        <div>
          <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <IconFlag className="w-4 h-4" /> Full curriculum roadmap
          </h2>
          <p className="text-sm text-white/70">
            All {MODULES.length} core modules and {LABS.length} labs are live — from Linux fundamentals through
            Active Directory, cloud, malware analysis, and binary exploitation.
          </p>
        </div>
        <Link to="/roadmap" className="px-4 py-2 rounded-lg bg-white text-[var(--color-accent)] text-sm font-semibold hover:bg-white/90 transition shrink-0">
          View roadmap &rarr;
        </Link>
      </div>
    </div>
  );
}
