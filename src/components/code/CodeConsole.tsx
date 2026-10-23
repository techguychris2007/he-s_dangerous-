import { useEffect, useRef, useState } from 'react';
import CodeEditor from './CodeEditor';
import { runPython, runPythonTraced, isPyodideBooted, type TraceStep } from '../../lib/pyodideRunner';
import { runCpp } from '../../lib/cppRunner';
import { runJs } from '../../lib/jsRunner';
import type { CodeLanguage } from '../../labs/codeTypes';
import { parseChecks, parseTestResult, type CheckLine } from '../../lib/testResult';
import { IconCheck, IconCode, IconLightning, IconRefresh, IconX } from '../layout/icons';
import DebugTraceView from './DebugTraceView';
import './code-workspace.css';

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
type PanelTab = 'tests' | 'output';

const RUNNERS: Record<CodeLanguage, (code: string) => Promise<{ stdout: string; stderr: string; ok: boolean }>> = {
  python: runPython,
  cpp: runCpp,
  javascript: runJs,
};

const FILE: Record<CodeLanguage, { name: string; runtime: string }> = {
  python: { name: 'solution.py', runtime: 'Python 3 · Pyodide' },
  cpp: { name: 'solution.cpp', runtime: 'C++ · in-browser' },
  javascript: { name: 'solution.js', runtime: 'JavaScript · sandboxed' },
};

/** The coding workspace: a dark IDE frame with a file tab, run/debug/submit toolbar, the Monaco
 *  editor, a Tests/Output panel and a status bar. Ctrl/Cmd+Enter runs the tests. */
export default function CodeConsole({ language, starterCode, testCode, onAllTestsPassed, onCodeChange, onTestsAttempted }: CodeConsoleProps) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [testSummary, setTestSummary] = useState<{ passed: number; total: number } | null>(null);
  const [checks, setChecks] = useState<CheckLine[]>([]);
  const [panel, setPanel] = useState<PanelTab>('tests');
  const [trace, setTrace] = useState<{ steps: TraceStep[]; stepLimitHit: boolean } | null>(null);
  const runTestsRef = useRef<() => void>(() => {});

  useEffect(() => {
    onCodeChange?.(code);
    // onCodeChange is a plain callback prop, not reactive state — safe and correct to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    setCode(starterCode);
    setOutput('');
    setTestSummary(null);
    setChecks([]);
    setTrace(null);
    setStatus('idle');
  }, [starterCode]);

  const clearResults = () => { setTestSummary(null); setChecks([]); setTrace(null); };

  const run = async (withTests: boolean) => {
    if (withTests) onTestsAttempted?.();
    setStatus(language === 'python' && !isPyodideBooted() ? 'booting' : 'running');
    setOutput('');
    clearResults();
    setPanel(withTests ? 'tests' : 'output');
    const fullCode = withTests ? `${code}\n\n${testCode}` : code;
    const result = await RUNNERS[language](fullCode).catch(error => ({
      stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false,
    }));
    const combined = [result.stdout, result.stderr].filter(Boolean).join(result.stdout && result.stderr ? '\n' : '');
    setOutput(combined || (result.ok ? '(no output)' : 'Something went wrong running your code.'));
    setStatus(result.ok ? 'done' : 'error');

    if (withTests) {
      const lines = parseChecks(result.stdout);
      setChecks(lines);
      const summary = parseTestResult(result.stdout);
      if (summary) {
        const { passed, total } = summary;
        setTestSummary({ passed, total });
        if (result.ok && passed === total && total > 0) onAllTestsPassed?.();
      }
      if (!lines.length) setPanel('output');
    }
  };
  runTestsRef.current = () => { if (status !== 'booting' && status !== 'running') void run(true); };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        runTestsRef.current();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  /** Runs just the learner's own code (never the test harness — a debugger for someone else's
   *  assertions isn't useful) through the real CPython line tracer instead of a plain run. */
  const debug = async () => {
    setStatus(!isPyodideBooted() ? 'booting' : 'running');
    setOutput('');
    clearResults();
    setPanel('output');
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
  const modified = code !== starterCode;
  const allPassed = !!testSummary && testSummary.total > 0 && testSummary.passed === testSummary.total;
  const statusText = status === 'booting' ? 'Downloading the Python runtime (first run only)…' : status === 'running' ? 'Running…' : status === 'error' ? 'Finished with errors' : status === 'done' ? 'Finished' : 'Ready';

  return (
    <div className="dw-ide">
      <div className="dw-ide__bar">
        <div className="dw-ide__tabs" role="tablist" aria-label="Open files">
          <span className="dw-ide__tab" role="tab" aria-selected="true">
            <IconCode className="h-3.5 w-3.5" />{FILE[language].name}
            {modified && <i className="dw-ide__dirty" title="Edited" aria-label="edited" />}
          </span>
        </div>
        <div className="dw-ide__actions">
          <button type="button" className="dw-ide__btn dw-ide__btn--ghost" onClick={() => { setCode(starterCode); clearResults(); setOutput(''); setStatus('idle'); }} disabled={busy} title="Reset to the starter code">
            <IconRefresh className="h-3.5 w-3.5" /><span>Reset</span>
          </button>
          {language === 'python' && (
            <button type="button" className="dw-ide__btn" onClick={debug} disabled={busy} title="Step through your code line by line with real variable state">
              <IconLightning className="h-3.5 w-3.5" /><span>Debug</span>
            </button>
          )}
          <button type="button" className="dw-ide__btn" onClick={() => run(false)} disabled={busy} title="Run your code without the tests">
            <span className="dw-ide__play" aria-hidden="true" /><span>Run</span>
          </button>
          <button type="button" className="dw-ide__btn dw-ide__btn--primary" onClick={() => run(true)} disabled={busy} title="Run the automated tests (Ctrl+Enter)">
            <IconCheck className="h-3.5 w-3.5" /><span>Run tests</span><kbd>Ctrl ↵</kbd>
          </button>
        </div>
      </div>

      <div className="dw-ide__editor">
        <CodeEditor value={code} onChange={value => { setCode(value); clearResults(); }} disabled={busy} language={language} />
      </div>

      <section className="dw-ide__panel" aria-label="Results">
        <div className="dw-ide__panel-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={panel === 'tests'} onClick={() => setPanel('tests')}>
            Tests{testSummary && <b data-ok={allPassed}>{testSummary.passed}/{testSummary.total}</b>}
          </button>
          <button type="button" role="tab" aria-selected={panel === 'output'} onClick={() => setPanel('output')}>Output</button>
        </div>
        <div className="dw-ide__panel-body" role="status" aria-live="polite">
          {busy ? <p className="dw-ide__hint"><span className="dw-ide__spinner" aria-hidden="true" />{statusText}</p>
            : panel === 'tests' ? (
              checks.length ? (
                <>
                  {allPassed && <div className="dw-ide__win"><IconCheck className="h-4 w-4" />All {testSummary?.total} checks passed — task solved.</div>}
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
              ) : <p className="dw-ide__hint">Press <kbd>Run tests</kbd> or <kbd>Ctrl ↵</kbd> to grade your solution. Each check appears here.</p>
            ) : output ? <pre className={status === 'error' ? 'is-error' : ''}>{output}</pre>
              : <p className="dw-ide__hint">Program output appears here when you press <kbd>Run</kbd>.</p>}
          {trace && !busy && <DebugTraceView code={code} steps={trace.steps} stepLimitHit={trace.stepLimitHit} />}
        </div>
      </section>

      <footer className="dw-ide__status">
        <span className="dw-ide__dot" data-state={status} />
        <span>{statusText}</span>
        <span className="dw-ide__status-sep" />
        <span>{FILE[language].runtime}</span>
        {testSummary && <span className="dw-ide__status-pill" data-ok={allPassed}>{testSummary.passed}/{testSummary.total} tests</span>}
        <span className="ml-auto">Auto-graded · runs in your browser</span>
      </footer>
    </div>
  );
}
