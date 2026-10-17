import { Link, useSearchParams } from 'react-router-dom';
import { ROADMAP, findModule } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import { useLabsData } from '../state/useLabsData';
import { SIEM_LABS } from '../labs/siemScenarios';
import { DEFENSIVE_MILESTONES } from '../data/defensiveCurriculum';
import { ModuleIcon, IconCheck } from '../components/layout/icons';
import type { RoadmapTrack } from '../types';
import './learning-pages.css';
import AcademyHero from '../components/common/AcademyHero';

const PATHS: { value: RoadmapTrack; label: string; title: string; blurb: string; focus: string }[] = [
  { value: 'presecurity', label: 'Pre-security', title: 'Pre-security roadmap', blurb: 'Understand computers, networks, operating systems, and safe lab practice. Build the habits and vocabulary you will use in every investigation.', focus: 'No prior experience needed' },
  { value: 'security', label: 'Offensive security', title: 'Learn to test. Learn to prove.', blurb: 'Move from reconnaissance and application testing to complete assessments, evidence, post-exploitation, and responsible handback.', focus: 'Start after pre-security foundations' },
  { value: 'defensive', label: 'Defensive security', title: 'From first alert to strategic defense.', blurb: 'Develop through SOC triage, investigation, threat hunting, detection engineering, incident leadership, and security architecture.', focus: 'Five progressive career milestones' },
  { value: 'programming', label: 'Programming', title: 'Build tools you understand.', blurb: 'Study practical Python, JavaScript, and C++ to automate work, inspect data, and reason about software.', focus: 'Practical coding exercises' },
  { value: 'ml', label: 'Machine learning', title: 'Explore data. Understand models.', blurb: 'A progression through data preparation, statistics, learning algorithms, evaluation, and production systems.', focus: 'Foundations through applied machine learning' },
];

export default function RoadmapPage() {
  const [params, setParams] = useSearchParams();
  const active = PATHS.find(path => path.value === params.get('track')) ?? PATHS[0];
  const progress = useProgress();
  const labsData = useLabsData();
  const stages = ROADMAP.filter(stage => stage.track === active.value);
  const lessons = stages.flatMap(stage => findModule(stage.moduleSlug)?.lessons ?? []);
  const lessonsDone = lessons.filter(lesson => progress.isLessonComplete(lesson.id)).length;
  const minutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const nextStage = stages.find(stage => {
    const mod = findModule(stage.moduleSlug);
    return mod && mod.lessons.some(lesson => !progress.isLessonComplete(lesson.id));
  });

  return <div className="learning-page roadmap-page mx-auto max-w-6xl px-4 py-8 sm:px-7 sm:py-12">
    <nav aria-label="Learning paths" className="learning-path-nav">
      {PATHS.map(path => <button key={path.value} onClick={() => setParams({ track: path.value })} aria-pressed={active.value === path.value} className={`rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition ${active.value === path.value ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'}`}>{path.label}</button>)}
    </nav>
    <AcademyHero eyebrow={'Learning path / ' + active.label} title={active.title} description={active.blurb}
      stats={[{label: 'Modules in this path', value: stages.length}, {label: 'Lessons complete', value: lessonsDone + ' / ' + lessons.length}, {label: 'Lesson study time', value: minutes ? Math.ceil(minutes / 60) + ' hours' : 'Self-paced'}]}
      action={{title: nextStage?.title ?? 'Keep your skills sharp', detail: active.focus, to: nextStage ? '/module/' + nextStage.moduleSlug : '/labs', label: nextStage ? (lessonsDone ? 'Continue learning' : 'Start this chapter') : 'Explore practice labs'}} />
    <div className="academy-section-heading"><h2 className="">The curriculum</h2><span className="text-xs text-[var(--color-text-dim)]">Self-paced · all modules open</span></div>
    <div className="learning-module-list">
      {stages.map((stage, index) => {
        const mod = findModule(stage.moduleSlug);
        const done = mod?.lessons.filter(lesson => progress.isLessonComplete(lesson.id)).length ?? 0;
        const complete = Boolean(mod?.lessons.length && done === mod.lessons.length);
        const milestone = DEFENSIVE_MILESTONES.find(item => item.moduleSlug === stage.moduleSlug);
        const requiredLessons = milestone?.requiredModuleSlugs.flatMap(slug => findModule(slug)?.lessons ?? []) ?? [];
        const requiredLabs = [...new Set(requiredLessons.flatMap(lesson => labsForLesson(lesson.id)))];
        const solvedLabs = requiredLabs.filter(id => { const total = labsData?.findLab(id)?.scenario.totalFlags ?? SIEM_LABS.find(lab => lab.id === id)?.totalFlags; return total !== undefined && progress.flagCount(id) >= total; }).length;
        const learned = requiredLessons.filter(lesson => progress.isLessonComplete(lesson.id) && (!lesson.quiz?.length || (progress.quizScores[lesson.id] ?? 0) >= 70)).length;
        const ready = Boolean(milestone && requiredLessons.length && learned === requiredLessons.length && solvedLabs === requiredLabs.length);
        return <section key={stage.title} className="roadmap-module">
          <Link to={stage.href ?? `/module/${stage.moduleSlug}`} className="learning-module-row group">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${complete ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-accent-dim)]'}`}>{complete ? <IconCheck className="h-4 w-4" /> : String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1"><div className="mb-1.5 flex flex-wrap items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">{stage === nextStage ? 'Up next' : complete ? 'Completed' : 'Learning module'}</span>{mod && <span className="text-[10px] text-[var(--color-text-dim)]">· {mod.lessons.length} lessons</span>}</div><h3 className="learning-module-title">{stage.title}</h3><p className="learning-module-description">{mod?.description ?? stage.sourceBooks.join(' · ')}</p>{mod && <div className="learning-module-progress"><progress className="h-1.5 w-28 accent-[var(--color-accent)]" value={done} max={mod.lessons.length} aria-label={`${stage.title} lesson completion`} /><span className="text-[10px] text-[var(--color-text-dim)]">{done}/{mod.lessons.length} complete</span></div>}</div>
            <ModuleIcon icon={mod?.icon ?? 'route'} className="mt-1 hidden h-5 w-5 text-[var(--color-text-dim)] sm:block" />
          </Link>
          {milestone && <div className="border-t border-[var(--color-border)] bg-[var(--color-accent)]/5 px-5 py-5 sm:px-6"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-bold text-[var(--color-accent-dim)]">{milestone.title}</h4><span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-heading)]">{ready ? 'Curriculum milestone achieved' : 'Milestone in progress'}</span></div><ul className="space-y-1 text-xs leading-6 text-[var(--color-text-dim)]">{milestone.criteria.map(criterion => <li key={criterion}>• {criterion}</li>)}</ul><p className="mt-3 text-[11px] text-[var(--color-text-dim)]">{learned}/{requiredLessons.length} prerequisite lessons and quizzes · {solvedLabs}/{requiredLabs.length} practice labs complete</p></div>}
        </section>;
      })}
    </div>
    {active.value === 'defensive' && <p className="mt-6 text-xs leading-6 text-[var(--color-text-dim)]">Milestones describe curriculum progress and practice outcomes. Real SOC responsibilities also depend on supervised experience, your employer’s role definitions, and assessment of your judgment.</p>}
    {active.value === 'presecurity' && <div className="mt-8 grid gap-4 sm:grid-cols-2">{[['security', 'Explore offensive security', 'Test systems and document their trust boundaries.'], ['defensive', 'Explore defensive security', 'Investigate alerts and protect critical services.']].map(([track, title, text]) => <Link key={track} to={`/roadmap?track=${track}`} className="learning-next-path"><h3 className="mb-2 font-semibold text-[var(--color-heading)]">{title} →</h3><p className="text-xs text-[var(--color-text-dim)]">{text}</p></Link>)}</div>}
  </div>;
}
