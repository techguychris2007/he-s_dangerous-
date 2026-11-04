/** TypeScript compile core shared by the browser worker (tsWorker.ts) and the Node check script
 *  (scripts/check-ts-tasks.cjs): a strict type check of the whole project followed by a per-file
 *  transpile to CommonJS for jsModuleBundler. Takes the compiler as a parameter so the browser can
 *  pass the copy it loaded from public/ts-runtime and Node can pass node_modules/typescript. */

// The compiler's API surface is large; only the members used here are typed, loosely.
/* eslint-disable @typescript-eslint/no-explicit-any */
type TsApi = any;

export interface TsTypeFs {
  version: string;
  /** root lib file names, e.g. lib.es2023.d.ts */
  libs: string[];
  /** virtual path → contents: /lib/*.d.ts, /node_modules/@types/react/…, /__dw__/testkit.d.ts */
  files: Record<string, string>;
}

export interface TsSource { path: string; content: string }

export interface TsDiagnostic {
  file: string | null;
  line: number;
  column: number;
  code: number;
  message: string;
}

export interface TsCompileResult {
  diagnostics: TsDiagnostic[];
  /** one CommonJS module per source, at the same path with a .js extension */
  outputs: TsSource[];
}

const PROJECT_ROOT = '/project/';
export const isTsSource = (path: string) => /\.(ts|tsx)$/.test(path) && !path.endsWith('.d.ts');
export const jsPathFor = (path: string) => path.replace(/\.(ts|tsx)$/, '.js');

/** Library .d.ts files are parsed once per compiler instance; lib.dom alone is ~2 MB. */
const libCache = new WeakMap<object, Map<string, unknown>>();

const isGraderFile = (path: string) => /(^|\/)grader\.test\.tsx?$/.test(path);

/** Errors inside the hidden test file are type-level tests failing, not mistakes in it. Quote the
 *  test line so the learner sees what was expected: an unused @ts-expect-error means their types
 *  accept something they should reject (the comment says what), and a failed expectTypeOf means an
 *  inferred type is not the one the task specifies. */
function explainTypeTest(text: string, line: number, code: number, message: string): string {
  const lines = text.split('\n');
  const source = (lines[line] ?? '').trim();
  if (code === 2578) {
    const intent = source.replace(/^\/\/\s*@ts-expect-error\s*/, '');
    const next = (lines[line + 1] ?? '').trim();
    return `Type test failed: your types accept something they must reject${intent ? ` (${intent})` : ''}: ${next}`;
  }
  if (/expectTypeOf|assertType/.test(source)) {
    // A mismatch surfaces as an argument-count error on the matcher; say what it means instead.
    const why = code === 2554 || code === 2345 ? 'the type is not the one the task specifies' : message.split('\n')[0];
    return `Type test failed: ${source} — ${why}`;
  }
  return `${message} — in the task's tests: ${source}`;
}

export function formatDiagnostic(d: TsDiagnostic): string {
  // Overload errors span several indented lines; keep each diagnostic on one line in the console.
  const message = d.message.replace(/\n\s*/g, ' ');
  return d.file ? `${d.file}(${d.line},${d.column}): error TS${d.code}: ${message}` : `error TS${d.code}: ${message}`;
}

export function compileTypeScript(ts: TsApi, typeFs: TsTypeFs, sources: TsSource[]): TsCompileResult {
  const projectFiles = new Map<string, string>();
  for (const s of sources) projectFiles.set(PROJECT_ROOT + s.path, s.content);
  const rootNames = [...sources.filter((s) => isTsSource(s.path)).map((s) => PROJECT_ROOT + s.path), '/__dw__/testkit.d.ts'];

  const options = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    lib: typeFs.libs,
    types: [],
    noEmit: true,
    isolatedModules: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noImplicitOverride: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
  };

  let cache = libCache.get(ts);
  if (!cache) { cache = new Map(); libCache.set(ts, cache); }
  const sharedCache = cache;

  const readFile = (name: string): string | undefined => projectFiles.get(name) ?? typeFs.files[name];
  const directoryExists = (dir: string) => {
    const prefix = dir.endsWith('/') ? dir : `${dir}/`;
    for (const k of projectFiles.keys()) if (k.startsWith(prefix)) return true;
    for (const k of Object.keys(typeFs.files)) if (k.startsWith(prefix)) return true;
    return false;
  };

  const host = {
    getSourceFile(fileName: string, languageVersion: unknown) {
      const shared = !fileName.startsWith(PROJECT_ROOT);
      if (shared && sharedCache.has(fileName)) return sharedCache.get(fileName);
      const text = readFile(fileName);
      if (text === undefined) return undefined;
      const sf = ts.createSourceFile(fileName, text, languageVersion, true);
      if (shared) sharedCache.set(fileName, sf);
      return sf;
    },
    getDefaultLibFileName: () => '/lib/lib.d.ts',
    getDefaultLibLocation: () => '/lib',
    writeFile: () => {},
    getCurrentDirectory: () => PROJECT_ROOT,
    getDirectories: () => [],
    fileExists: (name: string) => readFile(name) !== undefined,
    readFile,
    directoryExists,
    getCanonicalFileName: (name: string) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    realpath: (name: string) => name,
  };

  const program = ts.createProgram({ rootNames, options, host });
  const raw = [...program.getOptionsDiagnostics(), ...program.getSyntacticDiagnostics(), ...program.getGlobalDiagnostics(), ...program.getSemanticDiagnostics()];
  const diagnostics: TsDiagnostic[] = [];
  for (const d of raw) {
    if (d.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file && d.start !== undefined) {
      if (!d.file.fileName.startsWith(PROJECT_ROOT)) continue; // library internals are not the learner's concern
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      const file = d.file.fileName.slice(PROJECT_ROOT.length);
      diagnostics.push({ file, line: line + 1, column: character + 1, code: d.code, message: isGraderFile(file) ? explainTypeTest(d.file.text, line, d.code, message) : message });
    } else {
      diagnostics.push({ file: null, line: 0, column: 0, code: d.code, message });
    }
  }

  const outputs = sources.filter((s) => isTsSource(s.path)).map((s) => ({
    path: jsPathFor(s.path),
    content: ts.transpileModule(s.content, {
      fileName: s.path,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        isolatedModules: true,
      },
    }).outputText as string,
  }));

  return { diagnostics, outputs };
}

/** The type-check verdict as grader lines: one counted check, plus the individual errors as
 *  uncounted detail lines underneath it (capped so a cascade cannot flood the console). */
export function typeCheckReport(diagnostics: TsDiagnostic[]): { ok: boolean; lines: string[] } {
  if (!diagnostics.length) return { ok: true, lines: ['[PASS] Type check: strict mode, 0 errors'] };
  const shown = diagnostics.slice(0, 12).map((d) => `    ${formatDiagnostic(d)}`);
  if (diagnostics.length > 12) shown.push(`    … and ${diagnostics.length - 12} more`);
  // The first error goes on the counted line itself, because the Tests panel shows only that line.
  const first = diagnostics[0];
  const where = first.file ? `${first.file}(${first.line},${first.column}) ` : '';
  const more = diagnostics.length > 1 ? ` (+${diagnostics.length - 1} more — see Output)` : '';
  return { ok: false, lines: [`[FAIL] Type check: ${where}${first.message.split('\n')[0]}${more}`, ...shown] };
}
