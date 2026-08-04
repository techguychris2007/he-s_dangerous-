import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { PYTHON_TASKS } from '../labs/pythonTasks';
import { CPP_TASKS } from '../labs/cppTasks';
import { JS_TASKS } from '../labs/jsTasks';
import { ML_TASKS } from '../labs/mlTasks';
import { SECURITY_TASKS } from '../labs/securityTasks';
import { useProgress } from '../state/progressStore';
import CodeConsole from '../components/code/CodeConsole';
import CyberLabAI from '../components/labs/CyberLabAI';
import DifficultyPill from '../components/common/DifficultyPill';
import { IconCheck, IconCode, IconDownload } from '../components/layout/icons';
import type { CodeLanguage, CodeTask } from '../labs/codeTypes';

const ALL_CODE_TASKS = [...PYTHON_TASKS, ...CPP_TASKS, ...JS_TASKS, ...ML_TASKS, ...SECURITY_TASKS];

const EXTENSION_BY_LANGUAGE: Record<CodeLanguage, string> = { python: 'py', cpp: 'cpp', javascript: 'js' };
const COMMENT_PREFIX_BY_LANGUAGE: Record<CodeLanguage, string> = { python: '#', cpp: '//', javascript: '//' };

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'solution';
}

/** Builds a ready-to-commit source file from whatever the learner currently has in the editor — a
 *  short, real-comment-syntax header (task name, category, difficulty) followed by their code exactly
 *  as written, nothing fabricated or added. Downloads client-side via a Blob URL; no backend involved. */
function downloadTaskCode(task: CodeTask, code: string) {
  const ext = EXTENSION_BY_LANGUAGE[task.language];
  const c = COMMENT_PREFIX_BY_LANGUAGE[task.language];
  const filename = `${slugify(task.title)}.${ext}`;
  const header = [`${c} ${task.title}`, `${c} ${task.category} · ${task.difficulty}`, `${c} Solved on DarkWorld (darkworld app) — ${new Date().toISOString().slice(0, 10)}`, ''].join('\n');
  const blob = new Blob([header + code.trimEnd() + '\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CodeTaskPage() {
  const { taskId } = useParams();
  const progress = useProgress();
  const [hintIndex, setHintIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const task = ALL_CODE_TASKS.find((t) => t.id === taskId);
  const currentCodeRef = useRef('');
  const revealedHintsRef = useRef<string[]>([]);

  useEffect(() => {
    setHintIndex(0);
    setShowSolution(false);
  }, [taskId]);

  useEffect(() => {
    revealedHintsRef.current = task ? task.hints.slice(0, hintIndex) : [];
  }, [task, hintIndex]);

  if (!task) return <Navigate to="/code-portal" replace />;

  const done = progress.isCodeTaskComplete(task.id);
  const isMlTask = task.category.startsWith('ML:');
  const isSecurityTask = task.category.startsWith('Security:');
  const backHref = isMlTask ? '/ml-portal' : isSecurityTask ? '/library' : '/code-portal';
  const backLabel = isMlTask ? 'ML Portal' : isSecurityTask ? 'Library' : 'Code Portal';

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 overflow-y-auto">
        <Link
          to={backHref}
          className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-3 inline-block"
        >
          &larr; Back to {backLabel}
        </Link>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <DifficultyPill difficulty={task.difficulty} />
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
          onClick={() =>
            setHintIndex((i) => {
              const next = Math.min(i + 1, task.hints.length);
              progress.recordCodeTaskHintUsed(task.id, next);
              return next;
            })
          }
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
          onClick={() =>
            setShowSolution((v) => {
              if (!v) progress.recordCodeTaskSolutionRevealed(task.id);
              return !v;
            })
          }
          className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
        >
          {showSolution ? 'Hide solution' : 'Reveal solution'}
        </button>
        {showSolution && (
          <pre className="mt-2 text-xs font-mono bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-y-auto text-[var(--color-text)]">
            {task.solution}
          </pre>
        )}

        <button
          onClick={() => downloadTaskCode(task, currentCodeRef.current || task.starterCode)}
          className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors flex items-center justify-center gap-1.5"
          title={`Download your code as a .${EXTENSION_BY_LANGUAGE[task.language]} file — ready to commit to your own GitHub repo`}
        >
          <IconDownload className="w-3.5 h-3.5" /> Download code (.{EXTENSION_BY_LANGUAGE[task.language]})
        </button>

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
          onTestsAttempted={() => progress.recordCodeTaskAttempt(task.id)}
          onCodeChange={(code) => {
            currentCodeRef.current = code;
          }}
        />
      </div>

      <CyberLabAI
        key={task.id}
        getContext={() => ({
          kind: 'lab',
          title: task.title,
          subtitle: `${task.difficulty} · ${task.category}`,
          bodyText: task.prompt,
          currentCode: currentCodeRef.current,
          revealedHints: revealedHintsRef.current,
        })}
      />
    </div>
  );
}
