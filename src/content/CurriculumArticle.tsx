import Callout from '../components/lesson/Callout';
import CodeBlock from '../components/lesson/CodeBlock';
import type { CurriculumLesson } from './curriculumDefinition';

export default function CurriculumArticle({ lesson }: { lesson: CurriculumLesson }) {

  return (
    <article className="prose-hh curriculum-article">
      <p className="lesson-lede">{lesson.introduction}</p>
      {lesson.toolWorkflow?.length ? (
        <section className="lesson-tool-workflow" aria-labelledby={`${lesson.id}-workflow`}>
          <p className="lesson-panel-kicker">Tool workflow</p>
          <h2 id={`${lesson.id}-workflow`}>Tool procedure</h2>
          <div className="lesson-workflow-grid">
            {lesson.toolWorkflow.map(item => (
              <article key={item.tool} className="lesson-workflow-card">
                <div>
                  <p className="lesson-workflow-tool">{item.tool}</p>
                  <p className="lesson-workflow-when">{item.when}</p>
                </div>
                <ol>{item.actions.map(action => <li key={action}>{action}</li>)}</ol>
                <p><strong>Evidence to save:</strong> {item.evidence}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {lesson.keyTerms?.length ? (
        <section className="lesson-key-terms" aria-labelledby={`${lesson.id}-terms`}>
          <p className="lesson-panel-kicker">Vocabulary</p>
          <h2 id={`${lesson.id}-terms`}>Terms you should recognize in labs</h2>
          <dl>{lesson.keyTerms.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>
        </section>
      ) : null}
      {lesson.sections.map((section, index) => (
        <section key={section.title} aria-labelledby={`${lesson.id}-section-${index}`}>
          <h2 id={`${lesson.id}-section-${index}`}>{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.code && <CodeBlock label={section.label ?? 'Worked example'}>{section.code}</CodeBlock>}
        </section>
      ))}
      <section className="my-8 rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 p-5 sm:p-6">
        <p className="!mt-0 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-accent)]">Applied practice</p>
        <h2 className="!mt-2">Practice exercise</h2>
        <p>{lesson.exercise.scenario}</p><p><strong>Your task:</strong> {lesson.exercise.task}</p>
        <details className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <summary className="cursor-pointer font-semibold text-[var(--color-heading)]">Worked explanation</summary>
          <p>{lesson.exercise.answer}</p>
        </details>
      </section>
      {lesson.readinessChecklist?.length ? (
        <Callout variant="tip">
          <p><strong>Before you open the paired lab, make sure you can do this without guessing:</strong></p>
          <ul>{lesson.readinessChecklist.map(item => <li key={item}>{item}</li>)}</ul>
        </Callout>
      ) : null}
      <h2>Common misconceptions</h2>
      <ul>{lesson.misconceptions.map(item => <li key={item}>{item}</li>)}</ul>
      <h2>References and further practice</h2>
      <ul>{lesson.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
    </article>
  );
}
