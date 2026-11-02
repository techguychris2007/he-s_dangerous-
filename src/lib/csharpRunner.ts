import type { RunResult } from './runResult';
import type { ProjectFile } from '../labs/projectTypes';

export type { RunResult };

interface Diagnostic { path: string; line: number; column: number; severity: 'error' | 'warning'; id: string; message: string }
interface RunResponse { compiled: boolean; ok: boolean; stdout: string; stderr: string; diagnostics: Diagnostic[] }
interface WorkerReply { id: number; ready?: boolean; response?: RunResponse; error?: string }

/** First use downloads ~20 MB and warms the compiler; later runs take well under a second. */
const BOOT_TIMEOUT_MS = 180_000;
const RUN_TIMEOUT_MS = 15_000;
/** Test code for C# tasks declares this class with the Main method that runs the checks. */
export const CSHARP_TEST_MAIN = 'TestRunner';

let worker: Worker | null = null;
let booted = false;
let nextId = 1;
let queue: Promise<unknown> = Promise.resolve();
const pending = new Map<number, (reply: WorkerReply) => void>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./csharpWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<WorkerReply>) => {
    pending.get(e.data.id)?.(e.data);
    pending.delete(e.data.id);
  };
  worker.onerror = (e) => {
    for (const [id, resolve] of pending) resolve({ id, error: e.message || 'The C# runtime stopped unexpectedly.' });
    pending.clear();
    reset();
  };
  return worker;
}

function reset() {
  worker?.terminate();
  worker = null;
  booted = false;
}

function send(request: unknown | undefined, timeoutMs: number): Promise<WorkerReply> {
  const id = nextId++;
  const target = ensureWorker();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      // A runaway program cannot be interrupted inside the runtime; replace the whole worker.
      reset();
      resolve({ id, error: request ? 'Timed out after 15 seconds (possible infinite loop).' : 'The C# runtime took too long to load. Check your connection and try again.' });
    }, timeoutMs);
    pending.set(id, (reply) => { clearTimeout(timer); resolve(reply); });
    target.postMessage({ id, base: document.baseURI, request });
  });
}

/** Serialises runs: the runtime handles one program at a time, and Console is process-wide. */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

export function isCSharpBooted(): boolean {
  return booted;
}

/** Starts the runtime ahead of the first run (e.g. when a C# task opens). Safe to call repeatedly. */
export function preloadCSharp(): Promise<void> {
  if (booted) return Promise.resolve();
  return enqueue(async () => {
    if (booted) return;
    const reply = await send(undefined, BOOT_TIMEOUT_MS);
    booted = Boolean(reply.ready);
  });
}

export function formatDiagnostic(d: Diagnostic): string {
  return `${d.path}(${d.line},${d.column}): ${d.severity} ${d.id}: ${d.message}`;
}

function toRunResult(reply: WorkerReply): RunResult {
  if (reply.error || !reply.response) return { stdout: '', stderr: reply.error ?? 'The C# runtime returned no result.', ok: false };
  const { compiled, ok, stdout, stderr, diagnostics } = reply.response;
  const errors = diagnostics.filter(d => d.severity === 'error').map(formatDiagnostic);
  const warnings = diagnostics.filter(d => d.severity === 'warning').map(formatDiagnostic);
  if (!compiled) {
    return { stdout: '', stderr: [`Build failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`, ...errors, ...warnings].join('\n'), ok: false };
  }
  return { stdout, stderr: [stderr, ...warnings].filter(Boolean).join('\n'), ok };
}

export function runCSharpFiles(files: { path: string; content: string }[], options: { mainType?: string; stdin?: string } = {}): Promise<RunResult> {
  return enqueue(async () => {
    const reply = await send({ files, mainType: options.mainType ?? null, stdin: options.stdin ?? '' }, booted ? RUN_TIMEOUT_MS : BOOT_TIMEOUT_MS + RUN_TIMEOUT_MS);
    if (reply.response) booted = true;
    return toRunResult(reply);
  });
}

/** Single-file Code Portal tasks: the console appends the task's test code (which declares
 *  TestRunner.Main) to the learner's code, so its presence decides the entry point. */
export function runCSharp(code: string): Promise<RunResult> {
  const hasTests = new RegExp(`\\bclass\\s+${CSHARP_TEST_MAIN}\\b`).test(code);
  return runCSharpFiles([{ path: 'Solution.cs', content: code }], { mainType: hasTests ? CSHARP_TEST_MAIN : undefined });
}

/** Build Portal projects: "Run" builds every .cs file and runs the entry file's program; "Run tests"
 *  swaps the entry file for the hidden test file, whose TestRunner.Main exercises the learner's types. */
export function runCSharpProject(files: ProjectFile[], entry: string, testCode?: string): Promise<RunResult> {
  const sources = files.filter(f => f.path.endsWith('.cs'));
  if (testCode === undefined) return runCSharpFiles(sources.map(({ path, content }) => ({ path, content })));
  const withoutEntry = sources.filter(f => f.path !== entry).map(({ path, content }) => ({ path, content }));
  return runCSharpFiles([...withoutEntry, { path: 'Tests.cs', content: testCode }], { mainType: CSHARP_TEST_MAIN });
}
