import { Link, Navigate, useParams } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import Quiz from '../components/lesson/Quiz';
import LessonLabCard from '../components/lesson/LessonLabCard';
import { IconCheck } from '../components/layout/icons';

export default function LessonPage() {
  const { moduleSlug, lessonSlug } = useParams();
  const progress = useProgress();
  const mod = findModule(moduleSlug);
  if (!mod) return <Navigate to="/" replace />;
  const idx = mod.lessons.findIndex((l) => l.slug === lessonSlug);
  const lesson = mod.lessons[idx];
  if (!lesson) return <Navigate to="/" replace />;

  const prev = mod.lessons[idx - 1];
  const next = mod.lessons[idx + 1];
  const complete = progress.isLessonComplete(lesson.id);
  const { Content } = lesson;
  const labSlugs = labsForLesson(lesson.id);

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="text-xs text-[var(--color-text-dim)] mb-3 font-mono">
        {mod.title} &middot; {lesson.minutes} min read
      </div>

      <Content />

      {labSlugs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-[var(--color-heading)] mb-1">
            {labSlugs.length > 1 ? 'Practice labs' : 'Practice lab'}
          </h2>
          <p className="text-sm text-[var(--color-text-dim)] mb-4">
            Apply what you just read in a real interactive terminal — solve it to capture the flag.
          </p>
          {labSlugs.map((slug) => (
            <LessonLabCard key={slug} labSlug={slug} />
          ))}
        </div>
      )}

      {lesson.quiz ? (
        <Quiz
          questions={lesson.quiz}
          onComplete={(score) => {
            progress.recordQuizScore(lesson.id, score);
            progress.completeLesson(lesson.id);
          }}
        />
      ) : (
        <button
          onClick={() => progress.completeLesson(lesson.id)}
          disabled={complete}
          className="mt-10 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-navy)] text-white font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition"
        >
          {complete ? (
            <>
              <IconCheck className="w-4 h-4" /> Completed
            </>
          ) : (
            'Mark lesson complete'
          )}
        </button>
      )}

      <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <Link to={`/module/${mod.slug}/lesson/${prev.slug}`} className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-heading)]">
            &larr; {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/module/${mod.slug}/lesson/${next.slug}`} className="text-sm text-[var(--color-accent-2)] hover:underline">
            {next.title} &rarr;
          </Link>
        ) : (
          <Link to="/roadmap" className="text-sm text-[var(--color-accent-2)] hover:underline">
            Module complete — view roadmap &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
