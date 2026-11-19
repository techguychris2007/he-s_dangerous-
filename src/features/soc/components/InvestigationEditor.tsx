import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import Editor from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import '../../code-practice/runtimes/monacoLoader';
import { defineEditorTheme, THEME } from '../../code-practice/components/editorTheme';

const KEYWORDS = ['where', 'project', 'extend', 'summarize', 'by', 'count', 'dcount', 'distinct', 'sort', 'order', 'asc', 'desc', 'take', 'top', 'let', 'in', 'between', 'has', 'has_any', 'contains', 'startswith', 'and', 'or', 'not', 'ago', 'bin', 'stats', 'table', 'fields', 'dedup', 'head', 'limit', 'search', 'values', 'sum', 'avg', 'min', 'max', 'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'AND', 'OR', 'NOT', 'COUNT', 'AS', 'DESC', 'ASC'];

export interface InvestigationEditorHandle { getRunnableQuery(): string }
export default function InvestigationEditor({ ref, value, onChange, onRun, tables = [], fields = [] }: { ref?: Ref<InvestigationEditorHandle>; value: string; onChange: (value: string) => void; onRun: () => void; tables?: string[]; fields?: string[] }) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const completion = useRef<IDisposable | null>(null);
  const vocabulary = useRef({ tables, fields });
  vocabulary.current = { tables, fields };
  useEffect(() => () => completion.current?.dispose(), []);
  useImperativeHandle(ref, () => ({ getRunnableQuery() {
    const instance = editorRef.current, model = instance?.getModel(), selection = instance?.getSelection();
    if (!instance || !model || !selection) return value;
    if (!selection.isEmpty()) return model.getValueInRange(selection);
    let start = selection.startLineNumber, end = start;
    while (start > 1 && model.getLineContent(start - 1).trim()) start--;
    while (end < model.getLineCount() && model.getLineContent(end + 1).trim()) end++;
    return model.getValueInRange({ startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: model.getLineMaxColumn(end) });
  } }));
  return <Editor height="100%" value={value} language="dw-query" theme={THEME} onChange={next => onChange(next ?? '')} beforeMount={monaco => {
    defineEditorTheme(monaco);
    if (monaco.languages.getLanguages().some((language: { id: string }) => language.id === 'dw-query')) return;
    monaco.languages.register({ id: 'dw-query' });
    monaco.languages.setLanguageConfiguration('dw-query', { comments: { lineComment: '//' }, brackets: [['(', ')'], ['[', ']']], autoClosingPairs: [{ open: '(', close: ')' }, { open: '[', close: ']' }, { open: '"', close: '"' }, { open: "'", close: "'" }] });
    monaco.languages.setMonarchTokensProvider('dw-query', { tokenizer: { root: [
      [/\/\/.*$/, 'comment'], [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/, 'string'],
      [new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), 'keyword'],
      [/\b\d+(?:\.\d+)?(?:ms|s|m|h|d)?\b/, 'number'], [/\|/, 'delimiter'], [/[=><!~]+/, 'operator'],
    ] } });
  }} onMount={(instance, monaco) => {
    editorRef.current = instance;
    instance.addAction({ id: 'dw-run-query', label: 'Run investigation query', keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter, monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], run: onRun });
    completion.current?.dispose();
    completion.current = monaco.languages.registerCompletionItemProvider('dw-query', { provideCompletionItems(model: editor.ITextModel, position: { lineNumber: number; column: number }) {
      if (model !== instance.getModel()) return { suggestions: [] };
      const word = model.getWordUntilPosition(position as Parameters<editor.ITextModel['getWordUntilPosition']>[0]);
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      const { tables: sourceTables, fields: sourceFields } = vocabulary.current;
      return { suggestions: [
        ...sourceTables.map(label => ({ label, kind: monaco.languages.CompletionItemKind.Class, detail: 'Source table', insertText: label, range, sortText: '0' + label })),
        ...sourceFields.map(label => ({ label, kind: monaco.languages.CompletionItemKind.Field, detail: 'Field', insertText: label, range, sortText: '1' + label })),
        ...KEYWORDS.map(label => ({ label, kind: monaco.languages.CompletionItemKind.Keyword, detail: 'Operator', insertText: label, range, sortText: '2' + label })),
      ] };
    } });
  }} options={{ ariaLabel: 'Investigation query editor', fontSize: 14, lineHeight: 23, fontFamily: "'Ubuntu Mono', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace", fontLigatures: false, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, wordWrap: 'on', lineNumbersMinChars: 3, glyphMargin: false, folding: false, padding: { top: 14, bottom: 14 }, renderLineHighlight: 'all', tabSize: 2, quickSuggestions: { other: true, comments: false, strings: false }, suggestOnTriggerCharacters: false, matchBrackets: 'always', bracketPairColorization: { enabled: true }, cursorBlinking: 'smooth', cursorWidth: 2, smoothScrolling: true, overviewRulerLanes: 0, overviewRulerBorder: false, hideCursorInOverviewRuler: true, fixedOverflowWidgets: true, scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false } }} />;
}
