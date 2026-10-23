import { useImperativeHandle, useRef, type Ref } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import '../../lib/monacoLoader';

export interface InvestigationEditorHandle { getRunnableQuery(): string }
export default function InvestigationEditor({ ref, value, onChange, onRun }: { ref?: Ref<InvestigationEditorHandle>; value: string; onChange: (value: string) => void; onRun: () => void }) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  useImperativeHandle(ref, () => ({ getRunnableQuery() {
    const instance = editorRef.current, model = instance?.getModel(), selection = instance?.getSelection();
    if (!instance || !model || !selection) return value;
    if (!selection.isEmpty()) return model.getValueInRange(selection);
    let start = selection.startLineNumber, end = start;
    while (start > 1 && model.getLineContent(start - 1).trim()) start--;
    while (end < model.getLineCount() && model.getLineContent(end + 1).trim()) end++;
    return model.getValueInRange({ startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: model.getLineMaxColumn(end) });
  } }));
  return <Editor height="100%" value={value} language="dw-query" theme="vs" onChange={next => onChange(next ?? '')} beforeMount={monaco => {
    if (monaco.languages.getLanguages().some((language: { id: string }) => language.id === 'dw-query')) return;
    monaco.languages.register({ id: 'dw-query' });
    monaco.languages.setMonarchTokensProvider('dw-query', { tokenizer: { root: [
      [/\/\/.*$/, 'comment'], [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/, 'string'],
      [/\b(?:where|project|summarize|by|count|distinct|sort|order|take|let|in|between|has|has_any|contains|and|or|not|stats|table|head|search|SELECT|FROM|WHERE|GROUP|BY|ORDER|LIMIT|AND|OR|NOT)\b/, 'keyword'],
      [/\b\d+(?:\.\d+)?\b/, 'number'], [/[|=><!]+/, 'operator'],
    ] } });
  }} onMount={(instance, monaco) => {
    editorRef.current = instance;
    instance.addAction({ id: 'dw-run-query', label: 'Run investigation query', keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter, monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: onRun });
  }} options={{ ariaLabel: 'Investigation query editor', fontSize: 14, lineHeight: 23, fontFamily: "'Ubuntu Mono', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace", fontLigatures: false, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, wordWrap: 'on', lineNumbersMinChars: 3, padding: { top: 12 }, renderLineHighlight: 'line', tabSize: 2, quickSuggestions: false, suggestOnTriggerCharacters: false }} />;
}
