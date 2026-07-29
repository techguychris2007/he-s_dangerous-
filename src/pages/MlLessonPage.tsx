import { Navigate, useParams, Link } from 'react-router-dom';
import { findMlLesson } from '../data/mlLessons';
import LinearRegressionDemo from '../components/ml/LinearRegressionDemo';
import KMeansDemo from '../components/ml/KMeansDemo';

export default function MlLessonPage() {
  const { lessonId } = useParams();
  const lesson = lessonId ? findMlLesson(lessonId) : undefined;

  if (!lesson) return <Navigate to="/ml-portal" replace />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
        <Link to="/ml-portal" className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-4 inline-block">
          &larr; Back to ML Portal
        </Link>

        <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-2">
          {lesson.source}
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
      </div>
    </div>
  );
}
