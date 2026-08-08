import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SE_TASK_INDEX } from '../labs/seTasks/taskIndex';
import { getSeTask } from '../labs/seTasks';
import { RUN_TARGET_RUNNERS } from '../lib/projectRunners';
import { parseTestResult } from '../lib/testResult';

interface VerifyRow {
  taskId: string;
  targetId: string;
  solutionStatus: 'pending' | 'running' | 'pass' | 'fail';
  solutionDetail: string;
  starterStatus: 'pending' | 'running' | 'ok' | 'warn';
  starterDetail: string;
}

function initialRows(): VerifyRow[] {
  const rows: VerifyRow[] = [];
  for (const meta of SE_TASK_INDEX) {
    rows.push({ taskId: meta.id, targetId: '(loading)', solutionStatus: 'pending', solutionDetail: '', starterStatus: 'pending', starterDetail: '' });
  }
  return rows;
}

/** Dev-only grading tool — loads every Build Portal task's real body and runs BOTH its solutionFiles
 *  (expected: every target reaches N/N) and its starter files (expected: NOT already N/N — a starter
 *  that already passes everything means the task was authored wrong) through the real runners. At 8
 *  seed tasks this is a nice-to-have; at hundreds it's the only way batches get graded at all, which is
 *  exactly why it's built in Phase 0 rather than deferred. Gated on Vite's own DEV flag — never shipped
 *  to a production build, no separate auth/flag mechanism needed for something this narrowly a build tool. */
export default function SeVerifyPage() {
  const [rows, setRows] = useState<VerifyRow[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (!import.meta.env.DEV) return <Navigate to="/" replace />;

  const setRow = (taskId: string, targetId: string, patch: Partial<VerifyRow>) => {
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.taskId === taskId && (r.targetId === targetId || r.targetId === '(loading)'));
      if (idx === -1) return [...rs, { taskId, targetId, solutionStatus: 'pending', solutionDetail: '', starterStatus: 'pending', starterDetail: '', ...patch }];
      const next = [...rs];
      next[idx] = { ...next[idx], targetId, ...patch };
      return next;
    });
  };

  const runAll = async () => {
    setRunning(true);
    setDone(false);
    setRows(initialRows());

    for (const meta of SE_TASK_INDEX) {
      const task = await getSeTask(meta.id);
      if (!task) {
        setRow(meta.id, '(load failed)', { solutionStatus: 'fail', solutionDetail: 'getSeTask() returned undefined', starterStatus: 'warn', starterDetail: '' });
        continue;
      }
      for (const target of task.targets) {
        setRow(task.id, target.id, { solutionStatus: 'running', starterStatus: 'running' });

        const solutionResult = await RUN_TARGET_RUNNERS[target.kind](task.solutionFiles, target, true);
        const solutionSummary = parseTestResult(solutionResult.stdout);
        const solutionPass = !!solutionSummary && solutionSummary.total > 0 && solutionSummary.passed === solutionSummary.total;
        setRow(task.id, target.id, {
          solutionStatus: solutionPass ? 'pass' : 'fail',
          solutionDetail: solutionSummary ? `${solutionSummary.passed}/${solutionSummary.total}` : solutionResult.stderr || 'no __RESULT__ line produced',
        });

        const starterResult = await RUN_TARGET_RUNNERS[target.kind](task.files, target, true);
        const starterSummary = parseTestResult(starterResult.stdout);
        const starterAlreadyPasses = !!starterSummary && starterSummary.total > 0 && starterSummary.passed === starterSummary.total;
        setRow(task.id, target.id, {
          starterStatus: starterAlreadyPasses ? 'warn' : 'ok',
          starterDetail: starterSummary ? `${starterSummary.passed}/${starterSummary.total}` : '(crashed/no result — expected for an unsolved starter)',
        });
      }
    }
    setRunning(false);
    setDone(true);
  };

  const allSolutionsPass = rows.length > 0 && rows.every((r) => r.solutionStatus === 'pass');
  const anyStarterWarn = rows.some((r) => r.starterStatus === 'warn');

  return (
    <div className="max-w-4xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// dev only — never shipped to production</div>
      <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-3">Build Portal Task Verifier</h1>
      <p className="text-sm text-[var(--color-text-dim)] mb-6 leading-relaxed max-w-2xl">
        Runs every registered task's <code className="text-[var(--color-accent-2)]">solutionFiles</code> through
        the real runners (expect every target to reach N/N) and its starter <code className="text-[var(--color-accent-2)]">files</code> too
        (expect NOT N/N — a starter that already passes means the task shipped with the answer baked in).
      </p>

      <button
        onClick={runAll}
        disabled={running}
        className="mb-6 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition"
      >
        {running ? 'Running…' : `Verify all ${SE_TASK_INDEX.length} tasks`}
      </button>

      {done && (
        <div
          className={`mb-6 rounded-lg border p-3 text-sm font-semibold ${
            allSolutionsPass && !anyStarterWarn
              ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5 text-[var(--color-success)]'
              : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
          }`}
        >
          {allSolutionsPass && !anyStarterWarn ? 'All solutions pass, no starter is pre-solved.' : 'Something needs fixing — see the table below.'}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Task</th>
                <th className="text-left px-3 py-2 font-semibold">Target</th>
                <th className="text-left px-3 py-2 font-semibold">Solution</th>
                <th className="text-left px-3 py-2 font-semibold">Starter</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.taskId}:${r.targetId}`} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2 font-mono">{r.taskId}</td>
                  <td className="px-3 py-2 font-mono text-[var(--color-text-dim)]">{r.targetId}</td>
                  <td className={`px-3 py-2 font-mono ${r.solutionStatus === 'pass' ? 'text-[var(--color-success)]' : r.solutionStatus === 'fail' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-dim)]'}`}>
                    {r.solutionStatus} {r.solutionDetail}
                  </td>
                  <td className={`px-3 py-2 font-mono ${r.starterStatus === 'ok' ? 'text-[var(--color-success)]' : r.starterStatus === 'warn' ? 'text-[var(--color-warn)]' : 'text-[var(--color-text-dim)]'}`}>
                    {r.starterStatus} {r.starterDetail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
