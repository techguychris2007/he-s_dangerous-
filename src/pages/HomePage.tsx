import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, ROADMAP, findModule } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { useLabsData, retryLabsData } from '../state/useLabsData';
import { ACHIEVEMENTS } from '../data/achievements';
import { IconBook, IconFlask, IconFlag, IconArrowRight, ModuleIcon } from '../components/layout/icons';
import IsoBlock, { type IsoTone } from '../components/labs/IsoBlock';
import type { RoadmapTrack } from '../types';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import { ProfileHeader, ContinueCard, DailyOpCard, WeekCard, CrewPicker, type ContinueTarget } from '../components/dashboard/DashboardWidgets';
import { guideForArea, type CharacterId } from '../data/characters';
import AchievementShelf from '../components/common/AchievementShelf';
import { categoryIconKey } from '../data/labIcon';

const TOTAL_LESSONS = MODULES.reduce((n, m) => n + m.lessons.length, 0);
const MODULE_PREVIEW = 9;

const PATHS: { track: RoadmapTrack; label: string; title: string; icon: string; guide: CharacterId; tone: IsoTone }[] = [
  { track: 'presecurity', label: 'Start here', title: 'Pre-security', icon: 'network', guide: 'byte', tone: 'idle' },
  { track: 'security', label: 'Assess & discover', title: 'Offensive security', icon: 'crosshair', guide: 'vex', tone: 'offense' },
  { track: 'defensive', label: 'Investigate & protect', title: 'Defensive security', icon: 'soc', guide: 'sentinel', tone: 'defense' },
  { track: 'programming', label: 'Automate', title: 'Programming', icon: 'python', guide: 'cipher', tone: 'analysis' },
  { track: 'software', label: 'Build & ship', title: 'Software engineering', icon: 'engineering', guide: 'cipher', tone: 'analysis' },
];

export default function HomePage() {
  const progress = useProgress();
  const [moduleSearch, setModuleSearch] = useState('');
  const [showAllModules, setShowAllModules] = useState(false);
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


  const nextModule = nextLesson ? MODULES.find((m) => m.slug === nextLesson.moduleSlug) : undefined;
  const continueTarget: ContinueTarget = inProgressLab
    ? {
        title: inProgressLab.scenario.title,
        detail: `${progress.labFlags[inProgressLab.scenario.id]?.length ?? 0} of ${inProgressLab.scenario.totalFlags} flags · ${inProgressLab.scenario.difficulty}`,
        to: '/lab/' + inProgressLab.slug,
        label: 'Resume room',
        percent: (100 * (progress.labFlags[inProgressLab.scenario.id]?.length ?? 0)) / inProgressLab.scenario.totalFlags,
        guide: guideForArea(inProgressLab.scenario.category),
        icon: categoryIconKey(inProgressLab.scenario.category),
        kind: 'Room',
      }
    : nextLesson && nextModule
      ? {
          title: nextLesson.title,
          detail: 'From ' + nextLesson.moduleTitle,
          to: '/module/' + nextLesson.moduleSlug + '/lesson/' + nextLesson.slug,
          label: 'Continue learning',
          percent: (100 * nextModule.lessons.filter((l) => progress.completedLessons[l.id]).length) / nextModule.lessons.length,
          guide: guideForArea(nextLesson.moduleSlug),
          icon: nextModule.icon,
          kind: 'Lesson',
        }
      : { title: 'Put your knowledge to work', detail: 'Choose a practical challenge from the lab catalog.', to: '/labs', label: 'Explore labs', percent: 0, guide: 'vex', icon: 'flag', kind: 'Rooms' };

  const paths = useMemo(() => PATHS.map((path) => {
    const lessons = ROADMAP.filter((stage) => stage.track === path.track && stage.moduleSlug)
      .flatMap((stage) => findModule(stage.moduleSlug)?.lessons ?? []);
    const done = lessons.filter((l) => progress.completedLessons[l.id]).length;
    return { ...path, done, total: lessons.length };
  }), [progress.completedLessons]);

  const shownModules = showAllModules || moduleSearch.trim() ? visibleModules : visibleModules.slice(0, MODULE_PREVIEW);
  const numbers = [
    { label: 'Lessons completed', icon: <IconBook className="h-4 w-4" />, value: completedLessonCount, total: TOTAL_LESSONS },
    { label: 'Rooms cleared', icon: <IconFlask className="h-4 w-4" />, value: labsDone, total: labsLoaded ? totalLabs : 0 },
    { label: 'Flags captured', icon: <IconFlag className="h-4 w-4" />, value: capturedFlags, total: labsLoaded ? totalFlags : 0 },
  ];

  return (
    <div className="dw-dash">
      <ProfileHeader name={progress.learnerName} badges={unlockedAchievements.length} badgeTotal={ACHIEVEMENTS.length} />
      {!labsLoaded && <div role="status" className="dw-dash__notice"><span>Loading your lab catalog. If this takes longer than expected, check your connection.</span><button onClick={retryLabsData}>Retry loading</button></div>}

      <div className="dw-dash__grid">
        <div className="dw-dash__main">
          <ContinueCard next={continueTarget} />
          <CrewPicker />

          <section className="dw-dash__section" aria-labelledby="dw-tracks-title">
            <div className="dw-dash__head">
              <div><p>Your journey</p><h2 id="dw-tracks-title">Learning paths</h2></div>
              <Link to="/my-learning">My learning →</Link>
            </div>
            <div className="dw-tracks">
              {paths.map((path) => {
                const pct = path.total ? Math.round((100 * path.done) / path.total) : 0;
                return (
                  <Link key={path.track} to={`/roadmap?track=${path.track}`} className="dw-track">
                    <span className="dw-track__art">
                      <IsoBlock width={70} depth={12} tone={pct === 100 ? 'done' : pct > 0 ? 'progress' : path.tone} crest={<ModuleIcon icon={path.icon} />} />
                      <CharacterAvatar id={path.guide} size={30} decorative className="dw-track__guide" />
                    </span>
                    <span className="dw-track__body">
                      <small>{path.label}</small>
                      <strong>{path.title}</strong>
                      <span className="dw-track__bar"><i><b style={{ width: `${pct}%` }} /></i>{path.done}/{path.total}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="dw-dash__section" aria-labelledby="dw-skills-title">
            <div className="dw-dash__head">
              <div><p>Room districts</p><h2 id="dw-skills-title">Skills</h2></div>
              <Link to="/labs">All rooms →</Link>
            </div>
            <div className="dw-skills">
              {!labsLoaded
                ? Array.from({ length: 8 }, (_, index) => <div key={index} className="dw-skill--ghost" />)
                : skillProgress.map(({ category, done, total }) => (
                  <Link key={category} to={`/labs?category=${encodeURIComponent(category)}`} className="dw-skill" data-done={total > 0 && done === total}>
                    <span className="dw-skill__icon"><ModuleIcon icon={categoryIconKey(category)} className="h-4 w-4" /></span>
                    <strong>{category}</strong>
                    <em>{done}/{total}</em>
                    <i><b style={{ width: `${total ? (100 * done) / total : 0}%` }} /></i>
                  </Link>
                ))}
            </div>
          </section>

          <AchievementShelf achievements={unlockedAchievements} total={ACHIEVEMENTS.length} />

          <section className="dw-dash__section" aria-labelledby="dw-courses-title">
            <div className="dw-dash__head">
              <div><p>Course collection</p><h2 id="dw-courses-title">{visibleModules.length} modules to explore</h2></div>
              <input type="search" aria-label="Search learning modules" placeholder="Find a subject…" value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} className="dw-search" />
            </div>
            {visibleModules.length === 0 && <p className="text-sm text-[var(--color-text-dim)]">No modules match your search. Try another subject.</p>}
            <div className="dw-courses">
              {shownModules.map((mod) => {
                const done = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
                const lessonCount = mod.lessons.length;
                return (
                  <Link key={mod.id} to={`/module/${mod.slug}`} className="dw-course" data-done={lessonCount > 0 && done === lessonCount}>
                    <header><span><ModuleIcon icon={mod.icon} className="h-4 w-4" /></span><small>{lessonCount} lessons</small></header>
                    <strong>{mod.title}</strong>
                    <p>{mod.description}</p>
                    <footer><i><b style={{ width: `${lessonCount ? (100 * done) / lessonCount : 0}%` }} /></i>{done}/{lessonCount}</footer>
                  </Link>
                );
              })}
            </div>
            {!moduleSearch.trim() && visibleModules.length > MODULE_PREVIEW && (
              <button type="button" className="dw-more" onClick={() => setShowAllModules((v) => !v)}>
                {showAllModules ? 'Show fewer modules' : `Show all ${visibleModules.length} modules`}
              </button>
            )}
          </section>
        </div>

        <aside className="dw-dash__side" aria-label="Today and this week">
          {labsLoaded && <DailyOpCard />}
          <WeekCard />
          <section className="dw-card" aria-labelledby="dw-numbers-title">
            <p id="dw-numbers-title" className="dw-card__label">Your numbers</p>
            <dl className="dw-numbers">
              {numbers.map((n) => (
                <div key={n.label}>
                  <span>{n.icon}</span>
                  <dt>{n.label}</dt>
                  <dd>{n.value}{n.total ? ` / ${n.total}` : ''}</dd>
                  <i><b style={{ width: `${n.total ? (100 * n.value) / n.total : 0}%` }} /></i>
                </div>
              ))}
            </dl>
          </section>
          <Link to="/roadmap" className="dw-roadmap-cta">
            <small>Full curriculum</small>
            <strong>Explore the roadmap</strong>
            <p>All {MODULES.length} modules{labsLoaded ? ` and ${totalLabs} rooms` : ''} — from Linux fundamentals through Active Directory, cloud, malware analysis and binary exploitation.</p>
            <b>View roadmap <IconArrowRight className="h-4 w-4" /></b>
          </Link>
        </aside>
      </div>
    </div>
  );
}
