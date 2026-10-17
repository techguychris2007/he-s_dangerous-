import { loader } from '@monaco-editor/react';
import * as monaco from '../../node_modules/monaco-editor/esm/vs/editor/editor.api.js';
import EditorWorker from '../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker';
import TypeScriptWorker from '../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js?worker';
// Register only the languages DarkWorld uses. Their syntax grammars load on demand instead of
// pulling every language contribution into the first editor bundle.
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/python/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/cpp/register.js';
import '../../node_modules/monaco-editor/esm/vs/languages/definitions/javascript/register.js';
// @ts-expect-error This runtime contribution does not ship a declaration file.
import { javascriptDefaults } from '../../node_modules/monaco-editor/esm/vs/language/typescript/monaco.contribution.js';
self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    return label === 'typescript' || label === 'javascript'
      ? new TypeScriptWorker() : new EditorWorker();
  },
};
loader.config({ monaco });
export { javascriptDefaults };
export function preloadMonaco(): void {
  void loader.init().catch(() => {});
}
