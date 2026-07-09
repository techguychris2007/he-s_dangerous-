import { Link, Navigate, useParams } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import { ModuleIcon, IconCheck, IconFlask } from '../components/layout/icons';

export default function ModulePage() {
  const { moduleSlug } = useParams();
  const progress = useProgress();
  const mod = findModule(moduleSlug);
  if (!mod) return <Navigate to="/" replace />;

  const doneCount = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
  const totalLabs = mod.lessons.reduce((n, l) => n + labsForLesson(l.id).length, 0);

  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-11 h-11 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-accent)] shrink-0">
          <ModuleIcon icon={mod.icon} className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-heading)]">{mod.title}</h1>
          <p className="text-sm text-[var(--color-text-dim)]">{mod.subtitle}</p>
        </div>
      </div>
      <p className="text-[var(--color-text-dim)] leading-relaxed mb-5">{mod.description}</p>

      <div className="flex items-center gap-4 mb-8 text-sm">
        <span className="text-[var(--color-text-dim)]">
          <strong className="text-[var(--color-heading)]">{doneCount}/{mod.lessons.length}</strong> lessons complete
        </span>
        <span className="text-[var(--color-text-dim)] flex items-center gap-1">
          <IconFlask className="w-3.5 h-3.5" /> <strong className="text-[var(--color-heading)]">{totalLabs}</strong> labs in this module
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {mod.lessons.map((lesson, i) => {
          const complete = progress.isLessonComplete(lesson.id);
          const labCount = labsForLesson(lesson.id).length;
          return (
            <Link
              key={lesson.id}
              to={`/module/${mod.slug}/lesson/${lesson.slug}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-accent)]/50 hover:shadow-sm transition-all"
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center ${
                  complete ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                }`}
              >
                {complete ? <IconCheck className="w-3 h-3" /> : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--color-heading)] truncate">{lesson.title}</div>
                <div className="text-xs text-[var(--color-text-dim)] truncate">{lesson.summary}</div>
              </div>
              {labCount > 0 && (
                <span className="pill bg-[var(--color-navy)]/10 text-[var(--color-navy)] shrink-0 flex items-center gap-1">
                  <IconFlask className="w-3 h-3" /> {labCount}
                </span>
              )}
              <span className="text-xs text-[var(--color-text-dim)] shrink-0">{lesson.minutes} min</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
