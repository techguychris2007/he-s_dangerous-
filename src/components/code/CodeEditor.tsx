import Editor from '@monaco-editor/react';
import type { CodeLanguage } from '../../labs/codeTypes';
import '../../lib/monacoLoader';

function readVsTheme(): 'vs-dark' | 'vs' {
  return document.documentElement.dataset.theme === 'light' ? 'vs' : 'vs-dark';
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
  return (
    <div className="w-full h-full min-h-[280px] rounded-lg overflow-hidden border border-[var(--color-accent)]/30">
      <Editor
        height="100%"
        value={value}
        language={language}
        theme={readVsTheme()}
        onChange={(v) => onChange(v ?? '')}
        options={{
          fontSize: 13,
          fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, monospace",
          minimap: { enabled: false },
          automaticLayout: true,
          readOnly: disabled,
          scrollBeyondLastLine: false,
          renderLineHighlight: 'gutter',
          tabSize: language === 'python' ? 4 : 2,
        }}
        onMount={(_editor, monaco) => {
          // Same as MonacoProjectEditor: without this, every reference to a global the test harness
          // injects (check/checkText/etc.) that isn't declared in the file itself gets red-squiggled.
          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
          });
          // Repaint on theme toggle — watching the DOM attribute the app's useTheme() hook writes,
          // same reasoning as MonacoProjectEditor: it's the one source of truth every instance can
          // observe consistently without coupling to that hook directly.
          const observer = new MutationObserver(() => {
            monaco.editor.setTheme(readVsTheme());
          });
          observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
