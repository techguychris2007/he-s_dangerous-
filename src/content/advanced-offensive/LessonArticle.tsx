import CodeBlock from '../../components/lesson/CodeBlock';

export interface AdvancedLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  prerequisite: string;
  outcomes: string[];
  introduction: string;
  sections: { title: string; paragraphs: string[]; code?: string; codeLabel?: string }[];
  comparison: { columns: [string, string, string]; rows: [string, string, string][] };
  caseStudy: { scenario: string; analysis: string; decision: string };
  exercise: string;
  answer: string;
  mistakes: string[];
  sources: { title: string; url: string }[];
  labs: string[];
  quiz: { prompt: string; choices: string[]; correctIndex: number; explanation: string }[];
}

export default function LessonArticle({ lesson }: { lesson: AdvancedLesson }) {
  return (
    <article className="prose-hh">
      <p>{lesson.introduction}</p>
      {lesson.sections.map(section => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {section.code && <CodeBlock label={section.codeLabel ?? 'Worked example'}>{section.code}</CodeBlock>}
        </section>
      ))}
      <h2>Worked example</h2>
      <p>{lesson.caseStudy.scenario}</p><p>{lesson.caseStudy.analysis}</p><p>{lesson.caseStudy.decision}</p>
      <h2>Practice before the lab</h2>
      <p>{lesson.exercise}</p>
      <details className="my-4 rounded-lg border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer font-semibold text-[var(--color-heading)]">Worked explanation</summary>
        <p>{lesson.answer}</p>
      </details>
      <h2>Common mistakes to avoid</h2>
      <ul>{lesson.mistakes.map(mistake => <li key={mistake}>{mistake}</li>)}</ul>
      <h2>Primary references and continued study</h2>
      <ul>{lesson.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
    </article>
  );
}
