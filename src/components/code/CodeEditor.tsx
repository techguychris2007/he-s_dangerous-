import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import type { CodeLanguage } from '../../labs/codeTypes';
import { javascriptDefaults } from '../../lib/monacoLoader';

const DARK_THEME = 'darkworld-vscode-dark';
const LIGHT_THEME = 'darkworld-vscode-light';

function readVsTheme(): string {
  return document.documentElement.dataset.theme === 'light' ? LIGHT_THEME : DARK_THEME;
}

function defineEditorThemes(monaco: Monaco) {
  monaco.editor.defineTheme(DARK_THEME, {
    base: 'vs-dark', inherit: true, rules: [],
    colors: {
      'editor.background': '#0c0d10',
      'editor.foreground': '#f1f3f7',
      'editorLineNumber.foreground': '#777d89',
      'editorLineNumber.activeForeground': '#f2c46d',
      'editorGutter.background': '#0c0d10',
      'editor.lineHighlightBackground': '#171a20',
      'editorCursor.foreground': '#f2c46d',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#283341',
      'editorIndentGuide.background1': '#303640',
      'editorIndentGuide.activeBackground1': '#626b79',
      'editorBracketMatch.background': '#333944',
      'editorBracketMatch.border': '#c9a15f',
      'editorWhitespace.foreground': '#3b404a',
      'editorOverviewRuler.border': '#0c0d10',
    },
  });
  monaco.editor.defineTheme(LIGHT_THEME, {
    base: 'vs', inherit: true,
    rules: [{ token: 'comment', foreground: '737B88', fontStyle: 'italic' }],
    colors: {
      'editor.background': '#fbfcff',
      'editor.foreground': '#172033',
      'editorLineNumber.foreground': '#8993a3',
      'editorLineNumber.activeForeground': '#1d4ed8',
      'editorGutter.background': '#fbfcff',
      'editor.lineHighlightBackground': '#f0f4fb',
      'editorCursor.foreground': '#1d4ed8',
      'editor.selectionBackground': '#c8dcff',
      'editor.inactiveSelectionBackground': '#e1eaf8',
      'editorIndentGuide.background1': '#d8e0ec',
      'editorIndentGuide.activeBackground1': '#a5b5cc',
      'editorBracketMatch.background': '#dfe9fb',
      'editorBracketMatch.border': '#2563eb',
      'editorWhitespace.foreground': '#c8d1df',
      'editorOverviewRuler.border': '#fbfcff',
    },
  });
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  language: CodeLanguage;
}

/** Real Monaco editor for the Code Portal — syntax highlighting, bracket matching, real Tab/indent
 *  behavior, etc. Single controlled model (unlike the Build Portal's MonacoProjectEditor, which keeps
 *  one model per file so tabs can preserve cursor/scroll/undo independently) because a Code Portal
 *  task only ever has one file, and CodeConsole already owns `value` as the source of truth — task
 *  switches and "Reset to starter code" both flow through a prop change here, not a remount, exactly
 *  like the textarea this replaces. */
export default function CodeEditor({ value, onChange, disabled, language }: CodeEditorProps) {
  const themeObserver = useRef<MutationObserver | null>(null);
  useEffect(() => () => themeObserver.current?.disconnect(), []);
  return (
    <div className="w-full h-full min-h-[360px] rounded-sm overflow-hidden border border-[var(--color-border)] bg-[var(--term-bg)] ">
      <Editor
        height="100%"
        value={value}
        language={language}
        theme={readVsTheme()}
        onChange={(v) => onChange(v ?? '')}
        options={{
          fontSize: 15,
          lineHeight: 24,
          fontFamily: "'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace",
          fontLigatures: false,
          minimap: { enabled: false },
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          glyphMargin: false,
          guides: { indentation: true, bracketPairs: true, highlightActiveIndentation: true },
          bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
          matchBrackets: 'always',
          automaticLayout: true,
          readOnly: disabled,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          cursorBlinking: 'solid',
          cursorWidth: 2,
          wordWrap: 'off',
          stickyScroll: { enabled: true },
          padding: { top: 14, bottom: 18 },
          roundedSelection: false,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false,
          },
          tabSize: language === 'python' ? 4 : 2,
        }}
        onMount={(_editor, monaco) => {
          defineEditorThemes(monaco);
          monaco.editor.setTheme(readVsTheme());
          // Same as MonacoProjectEditor: without this, every reference to a global the test harness
          // injects (check/checkText/etc.) that isn't declared in the file itself gets red-squiggled.
          javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
          });
          // Repaint on theme toggle — watching the DOM attribute the app's useTheme() hook writes,
          // same reasoning as MonacoProjectEditor: it's the one source of truth every instance can
          // observe consistently without coupling to that hook directly.
          themeObserver.current?.disconnect();
          const observer = new MutationObserver(() => {
            monaco.editor.setTheme(readVsTheme());
          });
          observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
          themeObserver.current = observer;
        }}
        loading={
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-dim)] font-mono bg-[var(--term-bg)]">
            Loading editor&hellip;
          </div>
        }
      />
    </div>
  );
}
