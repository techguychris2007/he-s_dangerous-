import { Link, Navigate, useParams } from 'react-router-dom';
import { findModule, ROADMAP } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import AcademyHero from '../components/common/AcademyHero';
import LessonPath from '../components/learning/LessonPath';
import { guideForArea } from '../data/characters';
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
  const moduleNumber = ROADMAP.filter(stage => stage.track === track && stage.moduleSlug).findIndex(stage => stage.moduleSlug === mod.slug) + 1 || 1;

  return (
    <div className="learning-page mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link
        to={`/roadmap?track=${track}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-accent)] mb-4"
      >
        &larr; Back to your learning path
      </Link>

      <AcademyHero guide={guideForArea(mod.icon)} eyebrow={'Module / ' + mod.subtitle} title={mod.title} description={mod.description}
        stats={[{label:'Lessons complete',value:doneCount + ' / ' + mod.lessons.length},{label:'Unique practice labs',value:totalLabs},{label:'Estimated study time',value:studyMinutes + ' min'}]}
        action={{title:nextLesson?.title ?? 'Make the knowledge stick',detail:nextLesson?.summary ?? 'Review your completed lessons or continue practicing in the lab catalog.',to:nextLesson ? '/module/' + mod.slug + '/lesson/' + nextLesson.slug : '/labs',label:nextLesson ? (doneCount ? 'Resume lesson' : 'Start first lesson') : 'Explore practice labs'}} />
      <LessonPath
        eyebrow={`Module ${moduleNumber} · ${doneCount}/${mod.lessons.length} lessons · ${pct}% complete`}
        title={mod.title}
        guide={guideForArea(mod.icon)}
        nodes={mod.lessons.map((lesson, i) => {
          const badge = lessonLabBadges.get(lesson.id);
          const complete = progress.isLessonComplete(lesson.id);
          return {
            id: lesson.id,
            title: lesson.title,
            to: `/module/${mod.slug}/lesson/${lesson.slug}`,
            state: complete ? 'done' : lesson.id === nextLesson?.id ? 'current' : 'open',
            meta: `Task ${i + 1} · ${lesson.minutes} min${badge?.newCount ? ` · ${badge.newCount} new lab${badge.newCount === 1 ? '' : 's'}` : ''}`,
          };
        })}
      />
    </div>
  );
}
