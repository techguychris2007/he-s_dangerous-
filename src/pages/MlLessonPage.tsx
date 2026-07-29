import { Navigate, useParams, Link } from 'react-router-dom';
import { ML_LESSONS, findMlLesson } from '../data/mlLessons';
import { ML_TASKS } from '../labs/mlTasks';
import { useProgress } from '../state/progressStore';
import LinearRegressionDemo from '../components/ml/LinearRegressionDemo';
import KMeansDemo from '../components/ml/KMeansDemo';
import { IconCheck, IconCode } from '../components/layout/icons';

export default function MlLessonPage() {
  const { lessonId } = useParams();
  const progress = useProgress();
  const lesson = lessonId ? findMlLesson(lessonId) : undefined;

  if (!lesson) return <Navigate to="/ml-portal" replace />;

  const challenge = lesson.challengeTaskId ? ML_TASKS.find((t) => t.id === lesson.challengeTaskId) : undefined;
  const challengeDone = challenge ? progress.isCodeTaskComplete(challenge.id) : false;

  const index = ML_LESSONS.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? ML_LESSONS[index - 1] : undefined;
  const next = index < ML_LESSONS.length - 1 ? ML_LESSONS[index + 1] : undefined;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
        <Link to="/ml-portal" className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-4 inline-block">
          &larr; Back to ML Portal
        </Link>

        <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-2">
          {lesson.source} &middot; lesson {index + 1} of {ML_LESSONS.length}
        </div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)] mb-6"
          dangerouslySetInnerHTML={{ __html: lesson.title }}
        />

        {lesson.sections.map((section) => (
          <div key={section.heading} className="mb-6">
            <h2 className="text-base font-bold text-[var(--color-heading)] border-l-2 border-[var(--color-accent)] pl-2.5 mb-2">
              {section.heading}
            </h2>
            <div
              className="prose-ml text-sm text-[var(--color-text)] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_li]:mb-1 [&_pre]:bg-[#0c0d10] [&_pre]:border [&_pre]:border-[var(--color-border)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-xs [&_strong]:text-[var(--color-heading)]"
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
          </div>
        ))}

        {lesson.demo === 'linear-regression' && <LinearRegressionDemo />}
        {lesson.demo === 'kmeans' && <KMeansDemo />}

        {challenge && (
          <Link
            to={`/code-task/${challenge.id}`}
            className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 p-4 hover:border-[var(--color-accent)] transition-colors"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                <IconCode className="w-3.5 h-3.5" /> Practice this concept
              </div>
              <div className="font-semibold text-[var(--color-heading)] text-sm">{challenge.title}</div>
            </div>
            {challengeDone ? (
              <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center gap-1 shrink-0">
                <IconCheck className="w-3 h-3" /> Solved
              </span>
            ) : (
              <span className="text-sm font-semibold text-[var(--color-accent)] shrink-0">Start &rarr;</span>
            )}
          </Link>
        )}

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
          {prev ? (
            <Link
              to={`/ml-lesson/${prev.id}`}
              className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-heading)] transition-colors"
              dangerouslySetInnerHTML={{ __html: `&larr; ${prev.title}` }}
            />
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/ml-lesson/${next.id}`}
              className="text-sm font-semibold text-[var(--color-accent)] hover:underline text-right"
              dangerouslySetInnerHTML={{ __html: `${next.title} &rarr;` }}
            />
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
