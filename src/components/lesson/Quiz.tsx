import { useState } from 'react';
import type { QuizQuestion } from '../../types';
import { IconCheck, IconX } from '../layout/icons';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(score);
  };

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mt-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-1">Knowledge Check</h3>
      <p className="text-sm text-[var(--color-text-dim)] mb-6">
        Answer all questions to mark this lesson complete.
      </p>
      <div className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id}>
              <div className="text-sm font-medium text-[var(--color-heading)] mb-2">
                {qi + 1}. {q.prompt}
              </div>
              <div className="space-y-1.5">
                {q.choices.map((choice, ci) => {
                  const isChosen = chosen === ci;
                  const isCorrect = ci === q.correctIndex;
                  let cls = 'border-[var(--color-border)] hover:border-[var(--color-accent-2)]/50';
                  if (submitted) {
                    if (isCorrect) cls = 'border-[var(--color-success)] bg-[var(--color-success)]/10';
                    else if (isChosen) cls = 'border-[var(--color-danger)] bg-[var(--color-danger)]/10';
                  } else if (isChosen) {
                    cls = 'border-[var(--color-accent-2)] bg-[var(--color-accent-2)]/10';
                  }
                  return (
                    <button
                      key={ci}
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: ci }))}
                      className={`w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg border transition-colors ${cls} disabled:cursor-default`}
                    >
                      {/* Correctness must never be color-only — the icon (or reserved empty space
                          matching its width) carries the same information for colorblind users. */}
                      {submitted ? (
                        isCorrect ? (
                          <IconCheck className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                        ) : isChosen ? (
                          <IconX className="w-3.5 h-3.5 text-[var(--color-danger)] shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0" />
                        )
                      ) : null}
                      <span>{choice}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-2 text-xs text-[var(--color-text-dim)] italic">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="mt-6 px-5 py-2 rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition"
        >
          Submit Answers
        </button>
      ) : (
        <div className="mt-6 text-sm">
          Score: <span className="text-[var(--color-accent-dim)] font-semibold">{score}/{questions.length}</span>
        </div>
      )}
    </div>
  );
}
