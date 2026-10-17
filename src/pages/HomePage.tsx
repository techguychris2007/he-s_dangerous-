import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { useLabsData, retryLabsData } from '../state/useLabsData';
import { ACHIEVEMENTS, computeStreak } from '../data/achievements';
import { IconChart, IconFlask, IconCheck, IconFlag, IconArrowRight, IconLightning, ModuleIcon } from '../components/layout/icons';
import './learning-pages.css';
import AcademyHero from '../components/common/AcademyHero';
import StatCard from '../components/common/StatCard';
import AchievementShelf from '../components/common/AchievementShelf';
import { CATEGORY_BANNER } from '../data/labCategoryBanner';

const TOTAL_LESSONS = MODULES.reduce((n, m) => n + m.lessons.length, 0);

export default function HomePage() {
  const progress = useProgress();
  const [moduleSearch, setModuleSearch] = useState('');
  const visibleModules = MODULES.filter(mod => (mod.title + ' ' + mod.description).toLowerCase().includes(moduleSearch.trim().toLowerCase()));
  const labsData = useLabsData();
  const labsLoaded = !!labsData;
  const totalLabs = labsData?.LABS.length ?? 0;
  const totalFlagsInCatalog = useMemo(
    () => labsData?.LABS.reduce((n, l) => n + l.scenario.totalFlags, 0) ?? 0,
    [labsData],
  );

  const completedLessonCount = useMemo(
    () => MODULES.reduce((count, module) => count + module.lessons.filter(lesson => progress.completedLessons[lesson.id]).length, 0),
    [progress.completedLessons],
  );

  const { totalFlags, capturedFlags, labsDone } = useMemo(() => {
    let captured = 0;
    let done = 0;
    for (const [labId, flags] of Object.entries(progress.labFlags)) {
      const lab = labsData?.findLab(labId);
      if (lab) captured += Math.min(flags.length, lab.scenario.totalFlags);
      if (lab && flags.length >= lab.scenario.totalFlags) {
        done++;
      }
    }
    return {
      totalFlags: totalFlagsInCatalog,
      capturedFlags: captured,
      labsDone: done,
    };
  }, [progress.labFlags, labsData, totalFlagsInCatalog]);

  const streak = useMemo(() => computeStreak(progress.activityDates), [progress.activityDates]);
  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.isUnlocked(progress)),
    [progress],
  );

  // Per-category skill progress — memoized so it doesn't recalculate unless labFlags changes
  const skillProgress = useMemo(
    () =>
      (labsData?.LAB_CATEGORIES ?? []).map((category) => {
        const catLabs = labsData?.labsForCategory(category) ?? [];
        const done = catLabs.filter((l) => (progress.labFlags[l.scenario.id]?.length ?? 0) >= l.scenario.totalFlags).length;
        return { category, done, total: catLabs.length };
      }),
    [progress.labFlags, labsData],
  );

  // In-progress lab — memoized by scanning active labFlags instead of all 1400 labs
  const inProgressLab = useMemo(() => {
    for (const [labId, flags] of Object.entries(progress.labFlags)) {
      const lab = labsData?.findLab(labId);
      if (lab && flags.length > 0 && flags.length < lab.scenario.totalFlags) {
        return lab;
      }
    }
    return null;
  }, [progress.labFlags, labsData]);

  const allLessonsInOrder = useMemo(
    () => MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug, moduleTitle: m.title }))),
    [],
  );

  const nextLesson = useMemo(
    () => allLessonsInOrder.find((l) => !progress.isLessonComplete(l.id)) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allLessonsInOrder, progress.completedLessons],
  );


  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
      <AcademyHero eyebrow="DarkWorld / The academy" title="Your academy dashboard" description="Understand the systems. Practice the techniques. Build the judgment. Your next chapter starts with one focused lesson."
        stats={[{label: 'Lessons complete', value: completedLessonCount + ' / ' + TOTAL_LESSONS}, {label: 'Labs solved', value: labsLoaded ? labsDone + ' / ' + totalLabs : 'Loading…'}, {label: 'Current streak', value: streak.current + ' days'}]}
        action={{ title: inProgressLab?.scenario.title ?? nextLesson?.title ?? 'Put your knowledge to work', detail: inProgressLab ? 'Return to your investigation and follow the evidence.' : nextLesson ? 'From ' + nextLesson.moduleTitle : 'Choose a practical challenge from the lab catalog.', to: inProgressLab ? '/lab/' + inProgressLab.slug : nextLesson ? '/module/' + nextLesson.moduleSlug + '/lesson/' + nextLesson.slug : '/labs', label: inProgressLab ? 'Resume investigation' : nextLesson ? 'Continue learning' : 'Explore labs' }} />
      {!labsLoaded && <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-dim)]"><span>Loading your lab catalog. If this takes longer than expected, check your connection.</span><button onClick={retryLabsData} className="font-semibold text-[var(--color-accent-dim)] underline">Retry loading</button></div>}
      <div className="academy-path-choices mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { track: 'presecurity', label: 'Start here', title: 'Pre-security', description: 'Computers, networks, systems, and safe practice.' },
          { track: 'security', label: 'Assess & discover', title: 'Offensive security', description: 'From reconnaissance to complete pentest engagements.' },
          { track: 'defensive', label: 'Investigate & protect', title: 'Defensive security', description: 'SOC Tier 1 through response and security leadership.' },
        ].map(path => <Link key={path.track} to={`/roadmap?track=${path.track}`} className="premium-card premium-card-hover group rounded-2xl p-5 overflow-hidden"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-dim)]">{path.label}</p><h2 className="mb-2 text-base font-bold text-[var(--color-heading)]">{path.title} →</h2><p className="text-xs leading-6 text-[var(--color-text-dim)]">{path.description}</p></Link>)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 reveal" style={{ '--reveal-delay': '0.08s' } as React.CSSProperties}>
        <StatCard icon={<IconChart className="w-5 h-5" />} color="var(--color-accent-2)" label="Lessons completed" value={`${completedLessonCount} / ${TOTAL_LESSONS}`} />
        <StatCard icon={<IconFlask className="w-5 h-5" />} color="var(--color-accent)" label="Labs solved" value={labsLoaded ? `${labsDone} / ${totalLabs}` : 'Loading…'} />
        <StatCard icon={<IconCheck className="w-5 h-5" />} color="var(--color-success)" label="Flags captured" value={labsLoaded ? `${capturedFlags} / ${totalFlags}` : `${capturedFlags} captured`} />
        <StatCard
          icon={<IconLightning className="w-5 h-5" />}
          color="var(--color-warn)"
          label={streak.current > 0 ? 'Current streak' : 'Longest streak'}
          value={`${streak.current > 0 ? streak.current : streak.longest} day${(streak.current > 0 ? streak.current : streak.longest) === 1 ? '' : 's'}`}
        />
      </div>

      <div className="reveal" style={{ '--reveal-delay': '0.12s' } as React.CSSProperties}>
        <AchievementShelf achievements={unlockedAchievements} total={ACHIEVEMENTS.length} />
      </div>

      <h2 className="text-base font-bold text-[var(--color-heading)] mb-4 reveal" style={{ '--reveal-delay': '0.16s' } as React.CSSProperties}>Skills</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10 reveal" style={{ '--reveal-delay': '0.18s' } as React.CSSProperties}>
        {!labsLoaded ? (
          Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="premium-card rounded-2xl p-4">
              <div className="mb-3 h-4 w-28 animate-pulse rounded bg-[var(--color-surface-2)]" />
              <div className="mb-2 h-1.5 rounded-full bg-[var(--color-surface-2)]" />
              <div className="h-3 w-14 animate-pulse rounded bg-[var(--color-surface-2)]" />
            </div>
          ))
        ) : skillProgress.map(({ category, done, total }) => (
          <Link
            key={category}
            to={`/labs?category=${encodeURIComponent(category)}`}
            className="premium-card premium-card-hover rounded-2xl p-4 overflow-hidden"
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

      <div className="academy-section-heading"><div><h2>The course collection</h2><p>Find the knowledge behind your next skill. {visibleModules.length} modules to explore.</p></div><input type="search" aria-label="Search learning modules" placeholder="Find a subject…" value={moduleSearch} onChange={event => setModuleSearch(event.target.value)} className="academy-catalog-search" /></div>
      {visibleModules.length === 0 && <p className="mb-6 text-sm text-[var(--color-text-dim)]">No modules match your search. Try another subject.</p>}
      <div className="module-catalog-grid grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {visibleModules.map((mod, i) => {
          const done = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
          const lessonCount = mod.lessons.length;
          return (
            <Link
              key={mod.id}
              to={`/module/${mod.slug}`}
              className="module-catalog-card group"
              style={{ '--reveal-delay': `${0.26 + Math.min(i, 5) * 0.05}s` } as React.CSSProperties}
            >
              <div className="module-catalog-heading"><span className="module-catalog-icon"><ModuleIcon icon={mod.icon} className="h-5 w-5" /></span><span className="text-xs font-medium text-[var(--color-text-dim)]">{mod.lessons.length} lessons</span><IconArrowRight className="ml-auto h-4 w-4 text-[var(--color-text-dim)]" /></div>
              <div className="module-catalog-body">
                <h3 className="learning-module-title">{mod.title}</h3>
                <p className="learning-module-description mb-6 flex-1">{mod.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full"
                      style={{ width: `${lessonCount ? (100 * done) / lessonCount : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-dim)] shrink-0">{done}/{lessonCount} complete</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div
        className="premium-card rounded-3xl p-6 flex items-center justify-between flex-wrap gap-3 reveal overflow-hidden"
        style={{ '--reveal-delay': '0.4s' } as React.CSSProperties}
      >
        <div>
          <h2 className="text-base font-bold text-[var(--color-heading)] mb-1 flex items-center gap-2">
            <IconFlag className="w-4 h-4 text-[var(--color-accent)]" /> Full curriculum roadmap
          </h2>
          <p className="text-sm text-[var(--color-text-dim)]">
            All {MODULES.length} core modules{labsLoaded ? ` and ${totalLabs} labs` : ''} are live — from Linux fundamentals through
            Active Directory, cloud, malware analysis, and binary exploitation.
          </p>
        </div>
        <Link to="/roadmap" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition shrink-0">
          View roadmap <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
