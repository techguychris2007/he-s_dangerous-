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
import LabComments from '../components/labs/LabComments';
import DifficultyPill from '../components/common/DifficultyPill';
import { IconCheck, IconCode, IconDownload, IconFlask, IconLightning } from '../components/layout/icons';
import type { CodeLanguage, CodeTask } from '../labs/codeTypes';

const ALL_CODE_TASKS = [...PYTHON_TASKS, ...CPP_TASKS, ...JS_TASKS, ...ML_TASKS, ...SECURITY_TASKS];
const ALL_CODE_TASKS_MAP = new Map<string, CodeTask>(ALL_CODE_TASKS.map((t) => [t.id, t]));

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
  const header = [`${c} ${task.title}`, `${c} ${task.category} · ${task.difficulty}`, `${c} Code exported from DarkWorld — ${new Date().toISOString().slice(0, 10)}`, ''].join('\n');
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
  const task = taskId ? ALL_CODE_TASKS_MAP.get(taskId) : undefined;
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

  const languageLabel = task.language === 'cpp' ? 'C++' : task.language === 'javascript' ? 'JavaScript' : 'Python';

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[var(--color-bg)]">
      <aside className="lg:w-[27rem] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto">
        <Link
          to={backHref}
          className="text-xs font-bold text-[var(--color-accent)] hover:underline mb-5 inline-block"
        >
          &larr; Back to {backLabel}
        </Link>

        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.9)] mb-5">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(37,99,235,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.6) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <DifficultyPill difficulty={task.difficulty} />
              <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/25 flex items-center gap-1">
                <IconCode className="w-3 h-3" /> {languageLabel}
              </span>
              {done && (
                <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/25 flex items-center gap-1">
                  <IconCheck className="w-3 h-3" /> Solved
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.04em] text-[var(--color-heading)] mb-3">{task.title}</h1>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-dim)]">
              <IconFlask className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              {task.category}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center">
              <IconLightning className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <div className="text-sm font-black text-[var(--color-heading)]">Your mission</div>
              <div className="text-[11px] text-[var(--color-text-dim)]">Read the brief, code the function, pass the tests.</div>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] leading-7 whitespace-pre-line">{task.prompt}</p>
        </div>

        <button
          onClick={() =>
            setHintIndex((i) => {
              const next = Math.min(i + 1, task.hints.length);
              progress.recordCodeTaskHintUsed(task.id, next);
              return next;
            })
          }
          disabled={hintIndex >= task.hints.length}
          className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-bold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] disabled:opacity-50 transition-colors"
        >
          {hintIndex === 0 ? 'Show a hint' : hintIndex >= task.hints.length ? 'No more hints' : 'Next hint'}
        </button>
        {hintIndex > 0 && (
          <div className="mt-3 space-y-2">
            {task.hints.slice(0, hintIndex).map((h, i) => (
              <div key={i} className="text-sm bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/15 rounded-2xl px-4 py-3 text-[var(--color-text)] leading-6">
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
          className="w-full mt-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-bold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
        >
          {showSolution ? 'Hide solution' : 'Reveal solution'}
        </button>
        {showSolution && (
          <pre className="mt-3 text-xs font-mono bg-[var(--term-bg)] border border-[var(--color-border)] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-y-auto text-white">
            {task.solution}
          </pre>
        )}

        <button
          onClick={() => downloadTaskCode(task, currentCodeRef.current || task.starterCode)}
          className="w-full mt-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-bold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors flex items-center justify-center gap-1.5"
          title={`Download your code as a .${EXTENSION_BY_LANGUAGE[task.language]} file — ready to commit to your own GitHub repo`}
        >
          <IconDownload className="w-3.5 h-3.5" /> Download code (.{EXTENSION_BY_LANGUAGE[task.language]})
        </button>

        {done && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--color-success)]/25 bg-[var(--color-success)]/10 px-4 py-3 text-sm font-bold text-[var(--color-success)]">
            <span className="w-8 h-8 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center shrink-0">
              <IconCheck className="w-4 h-4" />
            </span>
            All tests passing — nice work!
          </div>
        )}

        <LabComments labId={task.id} />
      </aside>

      <main className="flex-1 min-h-[420px] p-4 sm:p-6 bg-[linear-gradient(180deg,var(--color-bg)_0%,var(--color-surface)_100%)]">
        <div className="h-full max-w-[1500px] mx-auto flex flex-col gap-4">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Workspace</div>
              <div className="text-sm font-black text-[var(--color-heading)]">Implement, run, debug, and pass the tests</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
              <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{languageLabel}</span>
              <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">Auto-graded</span>
            </div>
          </div>
          <CodeConsole
            key={task.id}
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
      </main>

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
