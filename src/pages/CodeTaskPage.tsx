import { useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { PYTHON_TASKS } from '../labs/pythonTasks';
import { CPP_TASKS } from '../labs/cppTasks';
import { JS_TASKS } from '../labs/jsTasks';
import { useProgress } from '../state/progressStore';
import CodeConsole from '../components/code/CodeConsole';
import { IconCheck, IconCode } from '../components/layout/icons';

const ALL_CODE_TASKS = [...PYTHON_TASKS, ...CPP_TASKS, ...JS_TASKS];

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  Medium: 'bg-[var(--color-warn)]/15 text-[var(--color-warn)]',
  Hard: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
};

export default function CodeTaskPage() {
  const { taskId } = useParams();
  const progress = useProgress();
  const [hintIndex, setHintIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const task = ALL_CODE_TASKS.find((t) => t.id === taskId);

  useEffect(() => {
    setHintIndex(0);
    setShowSolution(false);
  }, [taskId]);

  if (!task) return <Navigate to="/code-portal" replace />;

  const done = progress.isCodeTaskComplete(task.id);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 overflow-y-auto">
        <Link to="/code-portal" className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-3 inline-block">
          &larr; Back to Code Portal
        </Link>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`pill ${DIFFICULTY_CLASS[task.difficulty]}`}>{task.difficulty}</span>
          <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)] flex items-center gap-1">
            <IconCode className="w-3 h-3" /> {task.category}
          </span>
          {done && (
            <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center gap-1">
              <IconCheck className="w-3 h-3" /> Solved
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-3">{task.title}</h1>
        <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5 whitespace-pre-line">{task.prompt}</p>

        <button
          onClick={() => setHintIndex((i) => Math.min(i + 1, task.hints.length))}
          disabled={hintIndex >= task.hints.length}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] disabled:opacity-50 transition-colors"
        >
          {hintIndex === 0 ? 'Show a hint' : hintIndex >= task.hints.length ? 'No more hints' : 'Next hint'}
        </button>
        {hintIndex > 0 && (
          <div className="mt-2 space-y-1.5">
            {task.hints.slice(0, hintIndex).map((h, i) => (
              <div key={i} className="text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2.5 py-2 text-[var(--color-text)] leading-relaxed">
                {h}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowSolution((v) => !v)}
          className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
        >
          {showSolution ? 'Hide solution' : 'Reveal solution'}
        </button>
        {showSolution && (
          <pre className="mt-2 text-xs font-mono bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-y-auto text-[var(--color-text)]">
            {task.solution}
          </pre>
        )}

        {done && (
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
            <IconCheck className="w-4 h-4" /> All tests passing — nice work!
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[420px] p-4">
        <CodeConsole
          language={task.language}
          starterCode={task.starterCode}
          testCode={task.testCode}
          onAllTestsPassed={() => progress.completeCodeTask(task.id)}
        />
      </div>
    </div>
  );
}
