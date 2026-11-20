import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, ROADMAP, findModule } from '../data/curriculum';
import { useProgress } from '../../progress/state/progressStore';
import { useLabsData, retryLabsData } from '../../labs/state/useLabsData';
import { ACHIEVEMENTS } from '../../progress/data/achievements';
import { IconBook, IconFlask, IconFlag, ModuleIcon } from '../../../shared/components/layout/icons';
import IsoBlock, { type IsoTone } from '../../../shared/components/IsoBlock';
import type { RoadmapTrack } from '../../../shared/types/domain';
import CharacterAvatar from '../../../shared/characters/CharacterAvatar';
import { ProfileHeader, ContinueCard, DailyOpCard, WeekCard, CrewPicker, type ContinueTarget } from '../../progress/components/dashboard/DashboardWidgets';
import { guideForArea, type CharacterId } from '../../../shared/characters/characters';
import AchievementShelf from '../../progress/components/AchievementShelf';
import { categoryIconKey } from '../../labs/data/labIcon';
import { OWNER_TRACKS, useIsOwner } from '../../account/lib/ownerAccess';

const TOTAL_LESSONS = MODULES.reduce((n, m) => n + m.lessons.length, 0);
/** Skills shown before "Show all": enough to see what you're working on without a wall of rows. */
const SKILL_PREVIEW = 6;

const PATHS: { track: RoadmapTrack; label: string; title: string; icon: string; guide: CharacterId; tone: IsoTone }[] = [
  { track: 'presecurity', label: 'Start here', title: 'Foundations', icon: 'network', guide: 'byte', tone: 'idle' },
  { track: 'security', label: 'Assess & discover', title: 'Offensive security', icon: 'crosshair', guide: 'vex', tone: 'offense' },
  { track: 'defensive', label: 'Investigate & protect', title: 'Defensive security', icon: 'soc', guide: 'sentinel', tone: 'defense' },
  { track: 'programming', label: 'Automate', title: 'Programming', icon: 'python', guide: 'cipher', tone: 'analysis' },
  { track: 'software', label: 'Build & ship', title: 'Software engineering', icon: 'engineering', guide: 'cipher', tone: 'analysis' },
];

/** Sort key for the skills list: in progress (0), not started (1), finished (2). */
function skillRank({ done, total }: { done: number; total: number }): number {
  if (total > 0 && done >= total) return 2;
  return done > 0 ? 0 : 1;
}

export default function HomePage() {
  const progress = useProgress();
  const [showAllSkills, setShowAllSkills] = useState(false);
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
      })
        // What you're working on first, then what you haven't started, then what you've finished.
        .sort((a, b) => skillRank(a) - skillRank(b) || b.done / Math.max(b.total, 1) - a.done / Math.max(a.total, 1)),
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
        label: 'Resume lab',
        percent: (100 * (progress.labFlags[inProgressLab.scenario.id]?.length ?? 0)) / inProgressLab.scenario.totalFlags,
        guide: guideForArea(inProgressLab.scenario.category),
        icon: categoryIconKey(inProgressLab.scenario.category),
        kind: 'Lab',
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
      : { title: 'Put your knowledge to work', detail: 'Choose a practical challenge from the lab catalog.', to: '/labs', label: 'Explore labs', percent: 0, guide: 'vex', icon: 'flag', kind: 'Labs' };

  const owner = useIsOwner();
  const paths = useMemo(() => PATHS.filter((path) => owner || !OWNER_TRACKS.has(path.track)).map((path) => {
    const lessons = ROADMAP.filter((stage) => stage.track === path.track && stage.moduleSlug)
      .flatMap((stage) => findModule(stage.moduleSlug)?.lessons ?? []);
    const done = lessons.filter((l) => progress.completedLessons[l.id]).length;
    return { ...path, done, total: lessons.length };
  }), [progress.completedLessons, owner]);

  const shownSkills = showAllSkills ? skillProgress : skillProgress.slice(0, SKILL_PREVIEW);
  const numbers = [
    { label: 'Lessons completed', icon: <IconBook className="h-4 w-4" />, value: completedLessonCount, total: TOTAL_LESSONS },
    { label: 'Labs cleared', icon: <IconFlask className="h-4 w-4" />, value: labsDone, total: labsLoaded ? totalLabs : 0 },
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
              <Link to="/roadmap">View roadmap →</Link>
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
              <div><p>By topic</p><h2 id="dw-skills-title">Skills</h2></div>
              <Link to="/labs">All labs →</Link>
            </div>
            <div className="dw-skills">
              {!labsLoaded
                ? Array.from({ length: SKILL_PREVIEW }, (_, index) => <div key={index} className="dw-skill--ghost" />)
                : shownSkills.map(({ category, done, total }) => (
                  <Link key={category} to={`/labs?category=${encodeURIComponent(category)}`} className="dw-skill" data-done={total > 0 && done === total}>
                    <span className="dw-skill__icon"><ModuleIcon icon={categoryIconKey(category)} className="h-4 w-4" /></span>
                    <strong>{category}</strong>
                    <em>{done}/{total}</em>
                    <i><b style={{ width: `${total ? (100 * done) / total : 0}%` }} /></i>
                  </Link>
                ))}
            </div>
            {labsLoaded && skillProgress.length > SKILL_PREVIEW && (
              <button type="button" className="dw-more" aria-expanded={showAllSkills} onClick={() => setShowAllSkills((v) => !v)}>
                {showAllSkills ? 'Show fewer skills' : `Show all ${skillProgress.length} skills`}
              </button>
            )}
          </section>

          <AchievementShelf achievements={unlockedAchievements} total={ACHIEVEMENTS.length} />

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
        </aside>
      </div>
    </div>
  );
}
