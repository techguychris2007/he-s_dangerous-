import { useEffect, useState } from 'react';
import CodeEditor from './CodeEditor';
import { runPython, isPyodideBooted } from '../../lib/pyodideRunner';
import { runCpp } from '../../lib/cppRunner';
import { runJs } from '../../lib/jsRunner';
import type { CodeLanguage } from '../../labs/codeTypes';
import { IconCheck } from '../layout/icons';

interface CodeConsoleProps {
  language: CodeLanguage;
  starterCode: string;
  testCode: string;
  onAllTestsPassed?: () => void;
  /** fires on every keystroke — lets a parent (e.g. the AI lab tutor) see what the learner has
   *  actually written without CodeConsole giving up ownership of the editor's state */
  onCodeChange?: (code: string) => void;
}

type Status = 'idle' | 'booting' | 'running' | 'error' | 'done';

const RESULT_RE = /__RESULT__ (\d+)\/(\d+)/;

const RUNNERS: Record<CodeLanguage, (code: string) => Promise<{ stdout: string; stderr: string; ok: boolean }>> = {
  python: runPython,
  cpp: runCpp,
  javascript: runJs,
};

export default function CodeConsole({ language, starterCode, testCode, onAllTestsPassed, onCodeChange }: CodeConsoleProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number } | null>(null);

  useEffect(() => {
    onCodeChange?.(code);
    // onCodeChange is a plain callback prop, not reactive state — safe and correct to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    setCode(starterCode);
    setOutput('');
    setTestSummary(null);
    setStatus('idle');
  }, [starterCode]);

  const run = async (withTests: boolean) => {
    setStatus(language === 'python' && !isPyodideBooted() ? 'booting' : 'running');
    setOutput('');
    setTestSummary(null);
    const fullCode = withTests ? `${code}\n\n${testCode}` : code;
    const result = await RUNNERS[language](fullCode);
    const combined = [result.stdout, result.stderr].filter(Boolean).join(result.stdout && result.stderr ? '\n' : '');
    setOutput(combined || (result.ok ? '(no output)' : 'Something went wrong running your code.'));
    setStatus(result.ok ? 'done' : 'error');

    if (withTests) {
      const m = result.stdout.match(RESULT_RE);
      if (m) {
        const passed = Number(m[1]);
        const total = Number(m[2]);
        setTestSummary({ passed, total });
        if (passed === total && total > 0) onAllTestsPassed?.();
      }
    }
  };

  const busy = status === 'booting' || status === 'running';

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 min-h-[260px]">
        <CodeEditor value={code} onChange={setCode} disabled={busy} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => run(false)}
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors"
        >
          Run
        </button>
        <button
          onClick={() => run(true)}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition"
        >
          Run tests
        </button>
        <button
          onClick={() => setCode(starterCode)}
          disabled={busy}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors"
        >
          Reset to starter code
        </button>
        {status === 'booting' && (
          <span className="text-xs text-[var(--color-text-dim)] font-mono">
            Downloading the Python runtime (~10-20MB, first run only)&hellip;
          </span>
        )}
        {status === 'running' && <span className="text-xs text-[var(--color-text-dim)] font-mono">Running&hellip;</span>}
        {testSummary && (
          <span
            className={`ml-auto flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
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
          className={`rounded-lg border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto ${
            status === 'error'
              ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]'
          }`}
        >
          {busy ? 'Working…' : output}
        </pre>
      )}
    </div>
  );
}
