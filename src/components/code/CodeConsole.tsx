import { useEffect, useState } from 'react';
import CodeEditor from './CodeEditor';
import { runPython, runPythonTraced, isPyodideBooted, type TraceStep } from '../../lib/pyodideRunner';
import { runCpp } from '../../lib/cppRunner';
import { runJs } from '../../lib/jsRunner';
import type { CodeLanguage } from '../../labs/codeTypes';
import { parseTestResult } from '../../lib/testResult';
import { IconCheck, IconCode, IconLightning, IconRefresh } from '../layout/icons';
import DebugTraceView from './DebugTraceView';

interface CodeConsoleProps {
  language: CodeLanguage;
  starterCode: string;
  testCode: string;
  onAllTestsPassed?: () => void;
  /** fires on every keystroke — lets a parent (e.g. the AI lab tutor) see what the learner has
   *  actually written without CodeConsole giving up ownership of the editor's state */
  onCodeChange?: (code: string) => void;
  /** fires once per "Run tests" click, win or lose — the raw signal behind "how many tries did
   *  this actually take," independent of whether it eventually passed. */
  onTestsAttempted?: () => void;
}

type Status = 'idle' | 'booting' | 'running' | 'error' | 'done';

const RUNNERS: Record<CodeLanguage, (code: string) => Promise<{ stdout: string; stderr: string; ok: boolean }>> = {
  python: runPython,
  cpp: runCpp,
  javascript: runJs,
};

export default function CodeConsole({ language, starterCode, testCode, onAllTestsPassed, onCodeChange, onTestsAttempted }: CodeConsoleProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number } | null>(null);
  const [trace, setTrace] = useState<{ steps: TraceStep[]; stepLimitHit: boolean } | null>(null);

  useEffect(() => {
    onCodeChange?.(code);
    // onCodeChange is a plain callback prop, not reactive state — safe and correct to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    setCode(starterCode);
    setOutput('');
    setTestSummary(null);
    setTrace(null);
    setStatus('idle');
  }, [starterCode]);

  const run = async (withTests: boolean) => {
    if (withTests) onTestsAttempted?.();
    setStatus(language === 'python' && !isPyodideBooted() ? 'booting' : 'running');
    setOutput('');
    setTestSummary(null);
    setTrace(null);
    const fullCode = withTests ? `${code}\n\n${testCode}` : code;
    const result = await RUNNERS[language](fullCode).catch(error => ({
      stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false,
    }));
    const combined = [result.stdout, result.stderr].filter(Boolean).join(result.stdout && result.stderr ? '\n' : '');
    setOutput(combined || (result.ok ? '(no output)' : 'Something went wrong running your code.'));
    setStatus(result.ok ? 'done' : 'error');

    if (withTests) {
      const summary = parseTestResult(result.stdout);
      if (summary) {
        const { passed, total } = summary;
        setTestSummary({ passed, total });
        if (result.ok && passed === total && total > 0) onAllTestsPassed?.();
      }
    }
  };

  /** Runs just the learner's own code (never the test harness — a debugger for someone else's
   *  assertions isn't useful) through the real CPython line tracer instead of a plain run. */
  const debug = async () => {
    setStatus(!isPyodideBooted() ? 'booting' : 'running');
    setOutput('');
    setTestSummary(null);
    setTrace(null);
    const result = await runPythonTraced(code).catch(error => ({
      stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false,
      steps: [] as TraceStep[], stepLimitHit: false,
    }));
    const combined = [result.stdout, result.stderr].filter(Boolean).join(result.stdout && result.stderr ? '\n' : '');
    setOutput(combined || (result.ok ? '(no output)' : 'Something went wrong running your code.'));
    setTrace({ steps: result.steps, stepLimitHit: result.stepLimitHit });
    setStatus(result.ok ? 'done' : 'error');
  };

  const busy = status === 'booting' || status === 'running';

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-[360px] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </span>
            <span className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-[0.14em]">
              solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'js'}
            </span>
          </div>
          <span className="text-[11px] text-[var(--color-text-dim)]">Download your code to keep a copy</span>
        </div>
        <CodeEditor value={code} onChange={value => { setCode(value); setTestSummary(null); setTrace(null); }} disabled={busy} language={language} />
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 flex flex-wrap items-center gap-2 shadow-sm">
        <button
          onClick={() => run(false)}
          disabled={busy}
          className="px-4 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
        >
          <IconCode className="w-4 h-4" /> Run
        </button>
        <button
          onClick={() => run(true)}
          disabled={busy}
          className="px-5 py-2.5 rounded-2xl bg-[var(--color-accent)] text-white text-sm font-bold hover:brightness-110 disabled:opacity-50 transition shadow-[0_16px_35px_-22px_var(--color-accent)] inline-flex items-center gap-2"
        >
          <IconCheck className="w-4 h-4" /> Run tests
        </button>
        {language === 'python' && (
          <button
            onClick={debug}
            disabled={busy}
            title="Step through your code line by line with real variable state at each step"
            className="px-4 py-2.5 rounded-2xl border border-[var(--color-accent-2)]/40 bg-[var(--color-accent-2)]/5 text-sm font-bold text-[var(--color-accent-2)] hover:bg-[var(--color-accent-2)]/10 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            <IconLightning className="w-4 h-4" /> Debug
          </button>
        )}
        <button
          onClick={() => { setCode(starterCode); setTestSummary(null); setTrace(null); setOutput(''); setStatus('idle'); }}
          disabled={busy}
          className="px-3 py-2.5 rounded-2xl text-xs font-bold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
        >
          <IconRefresh className="w-3.5 h-3.5" /> Reset starter
        </button>
        {status === 'booting' && (
          <span className="text-xs text-[var(--color-text-dim)] font-mono">
            Downloading the Python runtime (~10-20MB, first run only)&hellip;
          </span>
        )}
        {status === 'running' && <span className="text-xs text-[var(--color-text-dim)] font-mono">Running&hellip;</span>}
        {testSummary && (
          <span
            role="status"
            aria-live="polite"
            className={`ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
              testSummary.passed === testSummary.total
                ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                : 'bg-[var(--color-warn)]/15 text-[var(--color-warn)]'
            }`}
          >
            {testSummary.passed === testSummary.total && <IconCheck className="w-3.5 h-3.5" />}
            {testSummary.passed}/{testSummary.total} tests passed
          </span>
        )}
      </div>

      {(output || busy) && (
        <pre
          role="status"
          aria-live="polite"
          className={`rounded-3xl border p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto shadow-sm ${
            status === 'error'
              ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]'
          }`}
        >
          {busy ? 'Working…' : output}
        </pre>
      )}

      {trace && !busy && <DebugTraceView code={code} steps={trace.steps} stepLimitHit={trace.stepLimitHit} />}
    </div>
  );
}
