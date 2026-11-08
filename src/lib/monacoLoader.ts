import { loader } from '@monaco-editor/react';
import * as monaco from '../../node_modules/monaco-editor/esm/vs/editor/editor.api.js';
// The editor contributions (suggest, code actions, code lens, inlay hints…) and the services they
// depend on. The language workers import this module too, but only after the first editor exists —
// by then the service collection is sealed and every contribution throws "UNKNOWN service".
import '../../node_modules/monaco-editor/esm/vs/internal/common/workers.js';
import EditorWorker from '../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker';
import TypeScriptWorker from '../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js?worker';
// Register only the languages DarkWorld uses. Their syntax grammars load on demand instead of
// pulling every language contribution into the first editor bundle.
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/python/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/cpp/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/javascript/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/csharp/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/xml/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/sql/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/typescript/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/dockerfile/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/yaml/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/hcl/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/shell/register.js';
// @ts-expect-error This runtime contribution does not ship a declaration file.
import { javascriptDefaults, typescriptDefaults, JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget } from '../../node_modules/monaco-editor/esm/vs/language/typescript/monaco.contribution.js';
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return label === 'typescript' || label === 'javascript'
      ? new TypeScriptWorker() : new EditorWorker();
  },
};
loader.config({ monaco });
export { javascriptDefaults };

let typeScriptConfigured: Promise<void> | null = null;

/** Gives the editor's TypeScript service the same strict options and the same React, react-dom and
 *  test-kit declarations the grader compiles against (public/ts-runtime/types.json), so squiggles and
 *  IntelliSense match what "Run tests" will report. Models must live under file:/// for
 *  `import 'react'` to resolve to file:///node_modules/@types/react. Safe to call repeatedly. */
export function configureTypeScriptEditor(): Promise<void> {
  typeScriptConfigured ??= (async () => {
    typescriptDefaults.setCompilerOptions({
      strict: true,
      target: ScriptTarget.ES2022,
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.NodeJs,
      jsx: JsxEmit.ReactJSX,
      esModuleInterop: true,
      isolatedModules: true,
      skipLibCheck: true,
      allowNonTsExtensions: true,
      noImplicitOverride: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      lib: ['es2023', 'dom', 'dom.iterable'],
    });
    typescriptDefaults.setEagerModelSync(true);
    const response = await fetch(new URL('ts-runtime/types.json', document.baseURI));
    if (!response.ok) throw new Error(`types.json: HTTP ${response.status}`);
    const types = await response.json() as { files: Record<string, string> };
    for (const [path, content] of Object.entries(types.files)) {
      if (!path.startsWith('/lib/')) typescriptDefaults.addExtraLib(content, `file://${path}`);
    }
  })();
  typeScriptConfigured.catch(() => { typeScriptConfigured = null; });
  return typeScriptConfigured;
}
export function preloadMonaco(): void {
  void loader.init().catch(() => {});
}
