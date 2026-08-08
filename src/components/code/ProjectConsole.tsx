import { useRef, useState } from 'react';
import type { ProjectTask } from '../../labs/projectTypes';
import MonacoProjectEditor from './MonacoProjectEditor';
import ProjectFileTabs from './ProjectFileTabs';
import ProjectFileTree from './ProjectFileTree';
import DomPreviewPane from './DomPreviewPane';
import { RUN_TARGET_RUNNERS } from '../../lib/projectRunners';
import { parseTestResult, type TestSummary } from '../../lib/testResult';
import { IconCheck } from '../layout/icons';

interface ProjectConsoleProps {
  task: ProjectTask;
  onAllTestsPassed?: () => void;
  /** fires on every keystroke across every file — mirrors CodeConsole's onCodeChange, lets a parent
   *  (the AI lab tutor) see the learner's real current files without owning any editor state itself. */
  onFilesChange?: (files: Record<string, string>) => void;
  onTestsAttempted?: () => void;
}

type TargetStatus = 'idle' | 'running' | 'error' | 'done';
interface TargetState {
  status: TargetStatus;
  output: string;
  summary: TestSummary | null;
}

function initialContents(files: ProjectTask['files']): Record<string, string> {
  return Object.fromEntries(files.map((f) => [f.path, f.content]));
}
function initialTargetStates(task: ProjectTask): Record<string, TargetState> {
  return Object.fromEntries(task.targets.map((t) => [t.id, { status: 'idle' as const, output: '', summary: null }]));
}

/** The multi-file analogue of CodeConsole — a file tree/tabs + Monaco editor, one Run/Run-tests control
 *  row per RunTarget (a full-stack task has 2: its backend half and its frontend half, graded and run
 *  independently — see projectTypes.ts for why they can't be one integrated run), and a live preview
 *  for any 'dom' target. `onAllTestsPassed` fires once, only once every target has independently
 *  reported a full pass. */
export default function ProjectConsole({ task, onAllTestsPassed, onFilesChange, onTestsAttempted }: ProjectConsoleProps) {
  const [resetKey, setResetKey] = useState(0);
  const [activePath, setActivePath] = useState(task.files[0]?.path ?? '');
  const [targetStates, setTargetStates] = useState<Record<string, TargetState>>(() => initialTargetStates(task));
  // Content itself lives in a ref (Monaco owns the actual editing, uncontrolled) — this counter exists
  // purely to trigger a re-render on every keystroke so the dirty-tab dots and the live DOM preview
  // (both computed straight from contentsRef.current during render) stay in sync with what's typed.
  const [, setContentsVersion] = useState(0);
  const contentsRef = useRef<Record<string, string>>(initialContents(task.files));
  // Tracked in a ref alongside targetStates (which is React state, batched/async) so "did every target
  // just pass" can be checked synchronously right after any one target's result comes back, instead of
  // racing a stale closure over the previous render's targetStates.
  const summariesRef = useRef<Record<string, TestSummary | null>>(Object.fromEntries(task.targets.map((t) => [t.id, null])));
  const firedRef = useRef(false);

  const showTree = task.files.length > 4 || task.files.some((f) => f.path.includes('/'));
  const domTarget = task.targets.find((t) => t.kind === 'dom');

  const currentFiles = () => task.files.map((f) => ({ ...f, content: contentsRef.current[f.path] ?? f.content }));

  const handleFileChange = (path: string, content: string) => {
    contentsRef.current[path] = content;
    onFilesChange?.(contentsRef.current);
    setContentsVersion((v) => v + 1);
  };

  const run = async (targetId: string, withTests: boolean) => {
    const target = task.targets.find((t) => t.id === targetId);
    if (!target) return;
    if (withTests) onTestsAttempted?.();
    setTargetStates((s) => ({ ...s, [targetId]: { status: 'running', output: '', summary: null } }));
    const result = await RUN_TARGET_RUNNERS[target.kind](currentFiles(), target, withTests);
    const combined = [result.stdout, result.stderr].filter(Boolean).join(result.stdout && result.stderr ? '\n' : '');
    const summary = withTests ? parseTestResult(result.stdout) : null;
    setTargetStates((s) => ({
      ...s,
      [targetId]: {
        status: result.ok ? 'done' : 'error',
        output: combined || (result.ok ? '(no output)' : 'Something went wrong running this.'),
        summary,
      },
    }));

    if (withTests) {
      summariesRef.current[targetId] = summary;
      const allPassed = task.targets.every((t) => {
        const s = summariesRef.current[t.id];
        return !!s && s.total > 0 && s.passed === s.total;
      });
      if (allPassed && !firedRef.current) {
        firedRef.current = true;
        onAllTestsPassed?.();
      }
    }
  };

  const reset = () => {
    contentsRef.current = initialContents(task.files);
    setTargetStates(initialTargetStates(task));
    summariesRef.current = Object.fromEntries(task.targets.map((t) => [t.id, null]));
    firedRef.current = false;
    setResetKey((k) => k + 1);
  };

  const dirtyPaths = new Set(task.files.filter((f) => contentsRef.current[f.path] !== f.content).map((f) => f.path));

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 min-h-[280px] rounded-lg border border-[var(--color-accent)]/30 overflow-hidden flex flex-col">
        <ProjectFileTabs files={task.files} activePath={activePath} onSelect={setActivePath} dirtyPaths={dirtyPaths} />
        <div className="flex-1 flex min-h-0">
          {showTree && <ProjectFileTree files={task.files} activePath={activePath} onSelect={setActivePath} />}
          <div className="flex-1 min-w-0">
            <MonacoProjectEditor
              key={resetKey}
              initialFiles={task.files}
              activePath={activePath}
              onFileChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={reset}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          Reset all files
        </button>
      </div>

      {task.targets.map((target) => {
        const st = targetStates[target.id];
        const busy = st.status === 'running';
        return (
          <div key={target.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[var(--color-heading)] uppercase tracking-wide">{target.label}</span>
              <button
                onClick={() => run(target.id, false)}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors"
              >
                Run
              </button>
              <button
                onClick={() => run(target.id, true)}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 transition"
              >
                Run tests
              </button>
              {busy && <span className="text-2xs text-[var(--color-text-dim)] font-mono">Running&hellip;</span>}
              {st.summary && (
                <span
                  className={`ml-auto flex items-center gap-1.5 text-2xs font-bold px-2.5 py-1 rounded-full ${
                    st.summary.passed === st.summary.total
                      ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                      : 'bg-[var(--color-warn)]/15 text-[var(--color-warn)]'
                  }`}
                >
                  {st.summary.passed === st.summary.total && <IconCheck className="w-3 h-3" />}
                  {st.summary.passed}/{st.summary.total} tests passed
                </span>
              )}
            </div>
            {(st.output || busy) && (
              <pre
                className={`rounded-lg border p-2.5 font-mono text-2xs leading-relaxed whitespace-pre-wrap break-words max-h-56 overflow-y-auto ${
                  st.status === 'error'
                    ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]'
                }`}
              >
                {busy ? 'Working…' : st.output}
              </pre>
            )}
          </div>
        );
      })}

      {domTarget && (
        <div>
          <div className="text-2xs font-mono font-bold uppercase tracking-wide text-[var(--color-text-dim)] mb-1.5">Live preview</div>
          <DomPreviewPane files={currentFiles()} entryPath={domTarget.entry} />
        </div>
      )}
    </div>
  );
}
