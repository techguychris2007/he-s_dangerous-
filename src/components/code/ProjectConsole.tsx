import { useMemo, useRef, useState } from 'react';
import type { ProjectTask } from '../../labs/projectTypes';
import MonacoProjectEditor from './MonacoProjectEditor';
import ProjectFileTabs from './ProjectFileTabs';
import ProjectFileTree from './ProjectFileTree';
import DomPreviewPane from './DomPreviewPane';
import { RUN_TARGET_RUNNERS } from '../../lib/projectRunners';
import { parseChecks, parseTestResult, type TestSummary } from '../../lib/testResult';
import { IconCheck, IconRefresh, IconX } from '../layout/icons';
import './code-workspace.css';

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
  const [contentsVersion, setContentsVersion] = useState(0);
  const contentsRef = useRef<Record<string, string>>(initialContents(task.files));
  // Tracked in a ref alongside targetStates (which is React state, batched/async) so "did every target
  // just pass" can be checked synchronously right after any one target's result comes back, instead of
  // racing a stale closure over the previous render's targetStates.
  const summariesRef = useRef<Record<string, TestSummary | null>>(Object.fromEntries(task.targets.map((t) => [t.id, null])));
  const firedRef = useRef(false);
  const revisionRef = useRef(0);

  const showTree = task.files.length > 4 || task.files.some((f) => f.path.includes('/'));
  const domTarget = task.targets.find((t) => t.kind === 'dom');

  // Memoized on contentsVersion (not recomputed on every unrelated re-render, e.g. a target's run
  // status changing) so DomPreviewPane below gets a genuinely stable array reference whenever nothing
  // was actually typed — without this, a brand-new array on every render defeated that pane's own
  // memoization and forced its preview iframe to fully rebuild constantly.
  const currentFiles = useMemo(
    () => task.files.map((f) => ({ ...f, content: contentsRef.current[f.path] ?? f.content })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task, contentsVersion],
  );

  const handleFileChange = (path: string, content: string) => {
    if (contentsRef.current[path] === content) return;
    revisionRef.current++;
    summariesRef.current = Object.fromEntries(task.targets.map(target => [target.id, null]));
    firedRef.current = false;
    setTargetStates(initialTargetStates(task));
    contentsRef.current[path] = content;
    onFilesChange?.(contentsRef.current);
    setContentsVersion((v) => v + 1);
  };

  const run = async (targetId: string, withTests: boolean) => {
    const target = task.targets.find((t) => t.id === targetId);
    if (!target) return;
    const revision = revisionRef.current;
    summariesRef.current[targetId] = null;
    if (withTests) onTestsAttempted?.();
    setTargetStates((s) => ({ ...s, [targetId]: { status: 'running', output: '', summary: null } }));
    const result = await RUN_TARGET_RUNNERS[target.kind](currentFiles, target, withTests).catch(error => ({
      stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false,
    }));
    if (revision !== revisionRef.current) return;
    const combined = [result.stdout, result.stderr].filter(Boolean).join(result.stdout && result.stderr ? '\n' : '');
    const summary = withTests && result.ok ? parseTestResult(result.stdout) : null;
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
    revisionRef.current++;
    contentsRef.current = initialContents(task.files);
    onFilesChange?.(contentsRef.current);
    setContentsVersion(version => version + 1);
    setTargetStates(initialTargetStates(task));
    summariesRef.current = Object.fromEntries(task.targets.map((t) => [t.id, null]));
    firedRef.current = false;
    setResetKey((k) => k + 1);
  };

  const dirtyPaths = new Set(task.files.filter((f) => contentsRef.current[f.path] !== f.content).map((f) => f.path));

  const passing = task.targets.filter((t) => {
    const sm = targetStates[t.id].summary;
    return !!sm && sm.total > 0 && sm.passed === sm.total;
  }).length;
  const anyBusy = task.targets.some((t) => targetStates[t.id].status === 'running');
  const editable = task.files.filter((f) => f.editable).length;

  return (
    <div className="dw-project">
      <div className="dw-ide dw-ide--project">
        <div className="dw-ide__bar">
          <ProjectFileTabs files={task.files} activePath={activePath} onSelect={setActivePath} dirtyPaths={dirtyPaths} />
          <div className="dw-ide__actions">
            <button type="button" className="dw-ide__btn dw-ide__btn--ghost" onClick={reset} title="Restore every file to its starting content">
              <IconRefresh className="h-3.5 w-3.5" /><span>Reset all</span>
            </button>
          </div>
        </div>
        <div className="dw-ide__workspace">
          {showTree && <ProjectFileTree files={task.files} activePath={activePath} onSelect={setActivePath} />}
          <div className="dw-ide__editor">
            <MonacoProjectEditor key={resetKey} initialFiles={task.files} activePath={activePath} onFileChange={handleFileChange} />
          </div>
        </div>

        <div className="dw-ide__targets">
          {task.targets.map((target) => {
            const st = targetStates[target.id];
            const busy = st.status === 'running';
            const checks = st.summary ? parseChecks(st.output) : [];
            const ok = !!st.summary && st.summary.total > 0 && st.summary.passed === st.summary.total;
            return (
              <section key={target.id} className="dw-ide__target" data-ok={st.summary ? ok : undefined}>
                <header>
                  <span className="dw-ide__dot" data-state={busy ? 'running' : st.summary ? (ok ? 'done' : 'error') : st.status} />
                  <strong>{target.label}</strong>
                  {st.summary && (
                    <span className="dw-ide__status-pill" data-ok={ok}>{st.summary.passed}/{st.summary.total} checks</span>
                  )}
                  <span className="dw-ide__target-actions">
                    <button type="button" className="dw-ide__btn" onClick={() => run(target.id, false)} disabled={busy}>
                      <span className="dw-ide__play" aria-hidden="true" /><span>Run</span>
                    </button>
                    <button type="button" className="dw-ide__btn dw-ide__btn--primary" onClick={() => run(target.id, true)} disabled={busy}>
                      <IconCheck className="h-3.5 w-3.5" /><span>Run tests</span>
                    </button>
                  </span>
                </header>
                <div className="dw-ide__panel-body" role="status" aria-live="polite">
                  {busy ? (
                    <p className="dw-ide__hint"><span className="dw-ide__spinner" aria-hidden="true" />Running {target.label}&hellip;</p>
                  ) : checks.length ? (
                    <>
                      {ok && <div className="dw-ide__win"><IconCheck className="h-4 w-4" />All {st.summary?.total} checks passed.</div>}
                      <ul className="dw-ide__checks">
                        {checks.map((c, i) => (
                          <li key={i} data-ok={c.ok}>
                            <span className="dw-ide__check-icon">{c.ok ? <IconCheck className="h-3 w-3" /> : <IconX className="h-3 w-3" />}</span>
                            <strong>{c.name}</strong>
                            {!c.ok && <code>{c.detail}</code>}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : st.output ? (
                    <pre className={st.status === 'error' ? 'is-error' : ''}>{st.output}</pre>
                  ) : (
                    <p className="dw-ide__hint">Press <kbd>Run</kbd> to execute or <kbd>Run tests</kbd> to grade this target.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="dw-ide__status">
          <span className="dw-ide__dot" data-state={anyBusy ? 'running' : passing === task.targets.length ? 'done' : 'idle'} />
          <span>{anyBusy ? 'Running…' : `${passing}/${task.targets.length} target${task.targets.length === 1 ? '' : 's'} passing`}</span>
          <span className="dw-ide__status-sep" />
          <span>{task.files.length} files · {editable} editable</span>
          {dirtyPaths.size > 0 && <><span className="dw-ide__status-sep" /><span>{dirtyPaths.size} modified</span></>}
        </div>
      </div>

      {domTarget && (
        <div className="dw-project__preview">
          <div className="dw-project__preview-head">Live preview</div>
          <DomPreviewPane files={currentFiles} entryPath={domTarget.entry} />
        </div>
      )}
    </div>
  );
}
