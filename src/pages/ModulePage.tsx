import { Link, Navigate, useParams } from 'react-router-dom';
import { findModule, ROADMAP } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import { IconCheck, IconFlask } from '../components/layout/icons';
import AcademyHero from '../components/common/AcademyHero';
import './learning-pages.css';


export default function ModulePage() {
  const { moduleSlug } = useParams();
  const progress = useProgress();
  const mod = findModule(moduleSlug);
  if (!mod) return <Navigate to="/" replace />;

  const doneCount = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
  const moduleLessonLabs = mod.lessons.map(lesson => ({ lessonId: lesson.id, labs: labsForLesson(lesson.id) }));
  const totalLabs = new Set(moduleLessonLabs.flatMap(item => item.labs)).size;
  const lessonLabBadges = new Map<string, { newCount: number; reusedCount: number; totalCount: number }>();
  const seenLabs = new Set<string>();
  for (const item of moduleLessonLabs) {
    let newCount = 0;
    let reusedCount = 0;
    for (const labId of item.labs) {
      if (seenLabs.has(labId)) reusedCount++;
      else {
        seenLabs.add(labId);
        newCount++;
      }
    }
    lessonLabBadges.set(item.lessonId, { newCount, reusedCount, totalCount: item.labs.length });
  }
  const pct = mod.lessons.length ? Math.round((doneCount / mod.lessons.length) * 100) : 0;
  const nextLesson = mod.lessons.find(lesson => !progress.isLessonComplete(lesson.id));
  const studyMinutes = mod.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);

  const track = ROADMAP.find(stage => stage.moduleSlug === mod.slug)?.track ?? 'security';

  return (
    <div className="learning-page mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link
        to={`/roadmap?track=${track}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-accent)] mb-4"
      >
        &larr; Back to your learning path
      </Link>

      <AcademyHero eyebrow={'Module / ' + mod.subtitle} title={mod.title} description={mod.description}
        stats={[{label:'Lessons complete',value:doneCount + ' / ' + mod.lessons.length},{label:'Unique practice labs',value:totalLabs},{label:'Estimated study time',value:studyMinutes + ' min'}]}
        action={{title:nextLesson?.title ?? 'Make the knowledge stick',detail:nextLesson?.summary ?? 'Review your completed lessons or continue practicing in the lab catalog.',to:nextLesson ? '/module/' + mod.slug + '/lesson/' + nextLesson.slug : '/labs',label:nextLesson ? (doneCount ? 'Resume lesson' : 'Start first lesson') : 'Explore practice labs'}} />
      <div className="academy-section-heading"><div><h2>Inside this chapter</h2><p>Follow the sequence or return to a lesson whenever you need it.</p></div><span className="text-sm text-[var(--color-text-dim)]">{pct}% complete</span></div>
      <div role="progressbar" aria-label="Module lesson completion" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mb-6 h-1 bg-[var(--color-border)]"><div className="h-full bg-[var(--color-accent)]" style={{width:pct + '%'}} /></div>
      <div className="learning-module-list">
        {mod.lessons.map((lesson, i) => {
          const complete = progress.isLessonComplete(lesson.id);
          const labBadge = lessonLabBadges.get(lesson.id) ?? { newCount: 0, reusedCount: 0, totalCount: 0 };
          const day = Math.floor(i / 2) + 1;
          return (
            <Link
              key={lesson.id}
              to={`/module/${mod.slug}/lesson/${lesson.slug}`}
              className="learning-module-row"
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full text-2xs font-bold flex items-center justify-center ${
                  complete ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                }`}
              >
                {complete ? <IconCheck className="w-3 h-3" /> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="learning-module-title">{lesson.title}</div>
                <div className="learning-module-description">{lesson.summary}</div>
              </div>
              {labBadge.totalCount > 0 && (
                <span
                  title={labBadge.reusedCount > 0 ? `${labBadge.reusedCount} lab${labBadge.reusedCount === 1 ? '' : 's'} already counted earlier in this module` : undefined}
                  className={`pill shrink-0 flex items-center gap-1 ${labBadge.newCount > 0 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'}`}
                >
                  <IconFlask className="w-3 h-3" />
                  {labBadge.newCount > 0 ? `${labBadge.newCount} new` : 'reused'}
                </span>
              )}
              <span className="hidden sm:block text-xs text-[var(--color-text-dim)] shrink-0 font-mono">Day {day} &middot; {lesson.minutes} min</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
