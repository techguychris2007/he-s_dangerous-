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
import CharacterSays from '../components/characters/CharacterSays';
import { IconCheck, IconCode, IconDownload } from '../components/layout/icons';
import { codeTaskXp } from '../data/xp';
import '../components/code/code-workspace.css';
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
  const [tab, setTab] = useState<'brief' | 'hints' | 'solution' | 'discuss'>('brief');
  const task = taskId ? ALL_CODE_TASKS_MAP.get(taskId) : undefined;
  const currentCodeRef = useRef('');
  const revealedHintsRef = useRef<string[]>([]);

  useEffect(() => {
    setHintIndex(0);
    setShowSolution(false);
    setTab('brief');
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
  const hintsUsed = Math.max(hintIndex, progress.codeTaskHintsUsed[task.id] ?? 0);
  const revealed = showSolution || !!progress.codeTaskSolutionRevealed[task.id];
  const xp = codeTaskXp(hintsUsed, revealed);
  const attempted = (progress.codeTaskAttempts[task.id] ?? 0) > 0;
  const siblings = ALL_CODE_TASKS.filter((t) => t.category === task.category);
  const siblingsDone = siblings.filter((t) => progress.isCodeTaskComplete(t.id)).length;
  const goals = [
    { label: 'Read the brief and plan your approach', done: true },
    { label: 'Run the automated tests at least once', done: attempted || done },
    { label: 'Pass every check', done },
    { label: 'Solve it without revealing the solution', done: done && !revealed },
  ];
  const revealHint = () => setHintIndex((i) => {
    const next = Math.min(i + 1, task.hints.length);
    progress.recordCodeTaskHintUsed(task.id, next);
    return next;
  });

  return (
    <div className="dw-codetask">
      <header className="dw-codetask__head">
        <ol className="dw-codetask__crumbs">
          <li><Link to={backHref}>{backLabel}</Link></li>
          <li>{task.category}</li>
          <li aria-current="page">{task.title}</li>
        </ol>
        <div className="dw-codetask__title">
          <h1>{task.title}</h1>
          <div className="dw-codetask__meta">
            <span className="dw-codetask__chip" data-level={task.difficulty}>{task.difficulty}</span>
            <span className="dw-codetask__chip"><IconCode className="h-3 w-3" />{languageLabel}</span>
            <span className="dw-codetask__chip dw-codetask__chip--xp" title="Each hint lowers the reward; revealing the solution leaves a small amount">+{xp} XP</span>
            {done && <span className="dw-codetask__chip dw-codetask__chip--solved"><IconCheck className="h-3 w-3" />Solved</span>}
          </div>
          <div className="dw-codetask__progress" title={`${siblingsDone} of ${siblings.length} solved in ${task.category}`}>
            {siblingsDone}/{siblings.length} in {task.category}<span><i style={{ width: `${siblings.length ? (100 * siblingsDone) / siblings.length : 0}%` }} /></span>
          </div>
        </div>
      </header>

      <div className="dw-codetask__body">
        <aside className="dw-codetask__brief">
          <div className="dw-codetask__tabs" role="tablist" aria-label="Task information">
            {([['brief', 'Brief'], ['hints', 'Hints'], ['solution', 'Solution'], ['discuss', 'Discussion']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}{id === 'hints' && <small>{hintIndex}/{task.hints.length}</small>}
              </button>
            ))}
          </div>
          <div className="dw-codetask__pane">
            {tab === 'brief' && (
              <>
                <section className="dw-codetask__task">
                  <header><span>Task 1</span>Your mission</header>
                  <p>{task.prompt}</p>
                </section>
                <ul className="dw-codetask__goals" aria-label="Objectives">
                  {goals.map((g, i) => <li key={g.label} data-done={g.done}><i>{g.done ? '✓' : i + 1}</i>{g.label}</li>)}
                </ul>
                <CharacterSays id="cipher" size={44} className="dw-codetask__guide">
                  {done ? 'Clean work. Download your code and keep it in your portfolio.' : 'Write it, then press Ctrl+Enter to run the tests. Each failing check tells you exactly what went wrong.'}
                </CharacterSays>
                <button type="button" className="dw-codetask__action" onClick={() => downloadTaskCode(task, currentCodeRef.current || task.starterCode)}>
                  <IconDownload className="mr-1.5 inline h-3.5 w-3.5" />Download code (.{EXTENSION_BY_LANGUAGE[task.language]})
                </button>
              </>
            )}
            {tab === 'hints' && (
              <>
                <p className="dw-codetask__cost">Hints unlock one at a time. Each one lowers this task's XP reward a little.</p>
                {task.hints.slice(0, hintIndex).map((h, i) => <div key={i} className="dw-codetask__hint"><b>Hint {i + 1}</b>{h}</div>)}
                <button type="button" className="dw-codetask__action" onClick={revealHint} disabled={hintIndex >= task.hints.length}>
                  {hintIndex === 0 ? 'Reveal the first hint' : hintIndex >= task.hints.length ? 'No more hints' : 'Reveal the next hint'}
                </button>
              </>
            )}
            {tab === 'solution' && (
              <>
                <p className="dw-codetask__cost">The reference solution is worth reading after an honest attempt. Revealing it reduces the reward to the minimum.</p>
                <button type="button" className="dw-codetask__action" onClick={() => setShowSolution((v) => { if (!v) progress.recordCodeTaskSolutionRevealed(task.id); return !v; })}>
                  {showSolution ? 'Hide solution' : 'Reveal solution'}
                </button>
                {showSolution && <pre className="dw-codetask__solution">{task.solution}</pre>}
              </>
            )}
            {tab === 'discuss' && <LabComments labId={task.id} />}
          </div>
        </aside>

        <main className="dw-codetask__ide">
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

    </div>
  );
}
