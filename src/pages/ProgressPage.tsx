import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, ROADMAP, findModule } from '../data/curriculum';
import { LABS, findLab } from '../data/labs';
import { useProgress } from '../state/progressStore';
import { ACHIEVEMENTS, computeStreak } from '../data/achievements';
import { PYTHON_TASKS } from '../labs/pythonTasks';
import { CPP_TASKS } from '../labs/cppTasks';
import { JS_TASKS } from '../labs/jsTasks';
import { SECURITY_TASKS } from '../labs/securityTasks';
import { ML_TASKS } from '../labs/mlTasks';
import { IconCheck, IconChart, IconFlask, IconCode, IconTrophy, IconArrowRight, ModuleIcon } from '../components/layout/icons';
import StatCard from '../components/common/StatCard';
import DifficultyPill from '../components/common/DifficultyPill';

/** Every code-portal task registry combined, mirroring how CodePortalPage + MlPortalPage already
 *  compute their own totals — this is the same real task list, not a new invented count. */
const ALL_CODE_TASKS = [...PYTHON_TASKS, ...CPP_TASKS, ...JS_TASKS, ...SECURITY_TASKS, ...ML_TASKS];

const TRACK_LABEL: Record<string, string> = {
  security: 'Offensive Security Track',
  programming: 'Programming Track',
};

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProgressPage() {
  const progress = useProgress();

  const allLessons = useMemo(
    () => MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug, moduleTitle: m.title }))),
    [],
  );
  const totalLessons = allLessons.length;
  const completedLessons = useMemo(
    () => allLessons.filter((l) => progress.isLessonComplete(l.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allLessons, progress.completedLessons],
  );

  const { totalFlags, capturedFlags, labsDone } = useMemo(() => {
    let captured = 0;
    let done = 0;
    for (const [labId, flags] of Object.entries(progress.labFlags)) {
      captured += flags.length;
      const lab = findLab(labId);
      if (lab && flags.length >= lab.scenario.totalFlags) {
        done++;
      }
    }
    return {
      totalFlags: LABS.reduce((n, l) => n + l.scenario.totalFlags, 0),
      capturedFlags: captured,
      labsDone: done,
    };
  }, [progress.labFlags]);

  const codeTasksDone = useMemo(
    () => ALL_CODE_TASKS.filter((t) => progress.isCodeTaskComplete(t.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress.completedCodeTasks],
  );

  const { quizzesTaken, avgQuizScore } = useMemo(() => {
    const taken = Object.keys(progress.quizScores).length;
    const avg = taken ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / taken) : 0;
    return { quizzesTaken: taken, avgQuizScore: avg };
  }, [progress.quizScores]);

  const streak = useMemo(() => computeStreak(progress.activityDates), [progress.activityDates]);
  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.isUnlocked(progress)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress.labFlags, progress.completedLessons, progress.activityDates],
  );

  // Overall completion folds in every real, trackable unit of work — not just lessons/labs like the
  // old ring did — so it actually reflects the Code Portal effort visible in the stats right next to it.
  const overallDone = completedLessons + labsDone + codeTasksDone;
  const overallTotal = totalLessons + LABS.length + ALL_CODE_TASKS.length;
  const scorePct = Math.round((100 * overallDone) / Math.max(1, overallTotal));
  const circumference = 2 * Math.PI * 54;
  const dash = (scorePct / 100) * circumference;

  const recentLabs = LABS
    .filter((l) => progress.labCompletedAt[l.scenario.id])
    .sort((a, b) => progress.labCompletedAt[b.scenario.id] - progress.labCompletedAt[a.scenario.id])
    .slice(0, 5);

  // Last 12 weeks of real activity, oldest first — grid-auto-flow: column below lays these out as
  // one column per week (7 rows each), the same shape as a GitHub-style contribution graph.
  const activitySet = new Set(progress.activityDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const heatmapDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    const key = toLocalDateStr(d);
    return { date: key, active: activitySet.has(key) };
  });

  // Real per-module, per-track breakdown — reuses the same ROADMAP + findModule pairing RoadmapPage
  // relies on, so "which module does this stage represent" can never drift between the two pages.
  const trackModules = ROADMAP
    .filter((stage) => stage.moduleSlug && findModule(stage.moduleSlug))
    .map((stage) => {
      const mod = findModule(stage.moduleSlug)!;
      const done = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
      return { stage, mod, done, total: mod.lessons.length };
    });
  const securityModules = trackModules.filter((m) => m.stage.track === 'security');
  const programmingModules = trackModules.filter((m) => m.stage.track === 'programming');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6 sm:mb-8">
        <div>
          <div className="gold-eyebrow mb-1.5 sm:mb-2">// your progress</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)] mb-2">Progress</h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-dim)] max-w-xl leading-relaxed">
            Real numbers pulled straight from your lessons, labs, code tasks, and quizzes — nothing here is
            simulated.
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

      {/* Overview: overall completion ring + the two highest-signal counts beside it. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold text-[var(--color-heading)]">{scorePct}%</div>
              <div className="text-xs text-[var(--color-text-dim)]">Overall</div>
            </div>
          </div>
          <div className="text-2xs text-[var(--color-text-dim)] mt-3 text-center">Lessons + labs + code tasks</div>
        </div>
        <StatCard icon={<IconChart className="w-5 h-5" />} color="var(--color-accent-2)" label="Lessons completed" value={`${completedLessons} / ${totalLessons}`} />
        <StatCard icon={<IconFlask className="w-5 h-5" />} color="var(--color-accent)" label="Labs solved" value={`${labsDone} / ${LABS.length}`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon={<IconCheck className="w-5 h-5" />} color="var(--color-success)" label="Flags captured" value={`${capturedFlags} / ${totalFlags}`} />
        <StatCard icon={<IconCode className="w-5 h-5" />} color="var(--color-accent)" label="Code tasks done" value={`${codeTasksDone} / ${ALL_CODE_TASKS.length}`} />
        <StatCard label="Quizzes taken" value={quizzesTaken} />
        <StatCard label="Avg. quiz score" value={`${avgQuizScore}%`} />
        <Link to="/profile" className="block">
          <StatCard icon={<IconTrophy className="w-5 h-5" />} color="var(--color-gold)" label="Achievements" value={`${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`} />
        </Link>
        <StatCard
          icon={<span className="text-lg leading-none">🔥</span>}
          color="var(--color-warn)"
          label={streak.current > 0 ? 'Current streak' : 'Longest streak'}
          value={`${streak.current > 0 ? streak.current : streak.longest} day${(streak.current > 0 ? streak.current : streak.longest) === 1 ? '' : 's'}`}
        />
      </div>

      {/* Achievements teaser — only the unlocked ones, so this never turns into a wall of locked
          icons; the full grid (locked + unlocked) already lives on the Profile page. */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-[var(--color-heading)]">Achievements</h2>
        <Link to="/profile" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
          View all &rarr;
        </Link>
      </div>
      {unlockedAchievements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 mb-10 text-sm text-[var(--color-text-dim)]">
          Capture your first flag or complete a lesson to unlock your first achievement.
        </div>
      ) : (
        <div className="flex gap-3 mb-10 overflow-x-auto pb-1">
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

      {/* Activity: a real 12-week contribution graph off activityDates, plus the most recently
          completed labs off labCompletedAt — both raw signals already recorded by progressStore. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[var(--color-heading)]">Activity, last 12 weeks</h2>
            <span className="text-xs font-mono text-[var(--color-text-dim)]">Longest streak: {streak.longest}d</span>
          </div>
          {progress.activityDates.length === 0 ? (
            <div className="text-sm text-[var(--color-text-dim)]">
              No activity recorded yet. Complete a lesson or capture a flag to start your streak.
            </div>
          ) : (
            <div
              className="grid gap-[3px] w-full"
              style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', height: '84px' }}
            >
              {heatmapDays.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}${day.active ? ' — active' : ''}`}
                  className="rounded-sm"
                  style={{
                    backgroundColor: day.active ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    aspectRatio: '1 / 1',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-bold text-[var(--color-heading)] mb-3">Recently completed labs</h2>
          {recentLabs.length === 0 ? (
            <div className="text-sm text-[var(--color-text-dim)]">
              No labs completed yet.{' '}
              <Link to="/labs" className="text-[var(--color-accent)] hover:underline">
                Browse the lab catalog &rarr;
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentLabs.map((l) => (
                <Link
                  key={l.slug}
                  to={`/lab/${l.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <span className="text-sm text-[var(--color-heading)] truncate min-w-0">{l.scenario.title}</span>
                  <DifficultyPill difficulty={l.scenario.difficulty} className="shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-module, per-track breakdown — the real detail behind the summary numbers above. */}
      {([
        ['security', securityModules],
        ['programming', programmingModules],
      ] as const).map(([track, modules]) =>
        modules.length === 0 ? null : (
          <section key={track} className="mb-10">
            <h2 className="text-base font-bold text-[var(--color-heading)] mb-3">{TRACK_LABEL[track]}</h2>
            <div className="flex flex-col gap-2">
              {modules.map(({ mod, done, total }) => (
                <details key={mod.slug} className="progress-accordion rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-[var(--color-surface-2)] transition-colors">
                    <ModuleIcon icon={mod.icon} className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                    <span className="text-sm font-semibold text-[var(--color-heading)] flex-1 min-w-0 truncate">{mod.title}</span>
                    <div className="w-24 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden hidden sm:block shrink-0">
                      <div
                        className={`h-full rounded-full ${done === total && total > 0 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
                        style={{ width: `${total ? (100 * done) / total : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[var(--color-text-dim)] shrink-0">{done}/{total}</span>
                    <IconArrowRight className="progress-accordion-chevron w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
                  </summary>
                  <div className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
                    {mod.lessons.map((lesson) => {
                      const lessonDone = progress.isLessonComplete(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          to={`/module/${mod.slug}/lesson/${lesson.slug}`}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors"
                        >
                          <span className="text-sm text-[var(--color-text)] truncate min-w-0">{lesson.title}</span>
                          <span
                            className={`pill shrink-0 ${
                              lessonDone ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                            }`}
                          >
                            {lessonDone ? <span className="flex items-center gap-1"><IconCheck className="w-3 h-3" /> Done</span> : 'Not started'}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ),
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-dim)] leading-relaxed">
        Lessons, labs, quizzes, your streak, activity history, and achievements all sync to your account
        across devices — see your{' '}
        <Link to="/profile" className="text-[var(--color-accent)] hover:underline">
          profile
        </Link>{' '}
        for the full achievement list and Code Portal learning stats.
      </div>
    </div>
  );
}
