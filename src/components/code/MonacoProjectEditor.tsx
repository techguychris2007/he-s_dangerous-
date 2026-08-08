import { useEffect, useRef } from 'react';
import Editor, { loader, type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditorNs } from 'monaco-editor';
import type { ProjectFile } from '../../labs/projectTypes';

// Loaded from the jsDelivr CDN on demand — same pattern as Pyodide (src/lib/pyodideRunner.ts) and for
// the same reason: bundling Monaco's ~5MB core + language workers would force every visitor's PWA
// install to download it, including everyone who never opens the Build Portal. Pinned to the exact
// version installed as a devDependency (package.json) so the runtime always matches the types this
// file was checked against — see vite.config.ts for the matching runtimeCaching rule that keeps this
// usable offline after the first load.
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs' } });

function readVsTheme(): 'vs-dark' | 'vs' {
  return document.documentElement.dataset.theme === 'light' ? 'vs' : 'vs-dark';
}

interface MonacoProjectEditorProps {
  /** The files to load when this component MOUNTS. Deliberately not re-read after mount — the parent
   *  (ProjectConsole) is expected to force a remount (via a `key` covering task id + a reset counter)
   *  rather than pass updated files in-place, so this component never has to reconcile "did the user
   *  type this, or did a reset just overwrite it" itself. Simpler and much harder to get subtly wrong
   *  than a fully-controlled multi-model editor would be. */
  initialFiles: ProjectFile[];
  activePath: string;
  onFileChange: (path: string, content: string) => void;
  disabled?: boolean;
}

/** Multi-file Monaco editor: one real model per file (Monaco's own multi-model API, not N separate
 *  editor instances), switched via `activePath` while preserving cursor/scroll/undo per file. */
export default function MonacoProjectEditor({ initialFiles, activePath, onFileChange, disabled }: MonacoProjectEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null);
  const modelsRef = useRef<Map<string, MonacoEditorNs.ITextModel>>(new Map());
  const viewStatesRef = useRef<Map<string, MonacoEditorNs.ICodeEditorViewState | null>>(new Map());
  const editableRef = useRef<Map<string, boolean>>(new Map());
  // Unique per mount (not just per task) so a rapid unmount/remount during a task-key change can never
  // collide on a Monaco model URI, which throws "model already exists" if reused while still alive.
  const instanceIdRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const switchTo = (path: string) => {
    const editor = editorRef.current;
    const model = modelsRef.current.get(path);
    if (!editor || !model) return;
    const prevPath = [...modelsRef.current.entries()].find(([, m]) => m === editor.getModel())?.[0];
    if (prevPath) viewStatesRef.current.set(prevPath, editor.saveViewState());
    editor.setModel(model);
    editor.updateOptions({ readOnly: !editableRef.current.get(path) });
    const saved = viewStatesRef.current.get(path);
    if (saved) editor.restoreViewState(saved);
    editor.focus();
  };

  useEffect(() => {
    // Switch models whenever the active tab changes (mount handles the first one in onMount below).
    if (editorRef.current) switchTo(activePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePath]);

  useEffect(() => {
    // Repaint on theme toggle — deliberately NOT calling this app's own useTheme() hook here (it's
    // local component state, not a shared store; a second instance would just drift out of sync with
    // the header's, not stay in sync with it). Watching the DOM attribute the hook itself writes is
    // the one source of truth every consumer can observe consistently.
    const observer = new MutationObserver(() => {
      monacoRef.current?.editor.setTheme(readVsTheme());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Dispose every model this instance created — skipping this leaks memory across a browsing
    // session and is exactly what causes a later "model already exists" error if a URI got reused.
    // The Map's identity never changes after this ref is created, so capturing it here (rather than
    // reading modelsRef.current again inside the cleanup) is just to satisfy the lint rule, not to
    // work around any real staleness.
    const models = modelsRef.current;
    return () => {
      for (const model of models.values()) model.dispose();
      models.clear();
    };
  }, []);

  return (
    <Editor
      theme={readVsTheme()}
      options={{
        fontSize: 13,
        fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace",
        minimap: { enabled: false },
        automaticLayout: true,
        readOnly: disabled,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'gutter',
        tabSize: initialFiles.find((f) => f.path === activePath)?.language === 'python' ? 4 : 2,
      }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // JS/TS diagnostics would otherwise red-squiggle every reference to a global the test harness
        // provides (check/checkText/require/etc.) that isn't declared anywhere in the file itself.
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });

        for (const file of initialFiles) {
          editableRef.current.set(file.path, file.editable);
          const uri = monaco.Uri.parse(`inmemory://dw/${instanceIdRef.current}/${file.path}`);
          const model = monaco.editor.createModel(file.content, file.language, uri);
          model.onDidChangeContent(() => onFileChange(file.path, model.getValue()));
          modelsRef.current.set(file.path, model);
        }
        switchTo(activePath);
      }}
    />
  );
}
