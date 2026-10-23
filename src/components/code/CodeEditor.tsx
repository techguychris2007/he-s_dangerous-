import Editor from '@monaco-editor/react';
import type { CodeLanguage } from '../../labs/codeTypes';
import { javascriptDefaults } from '../../lib/monacoLoader';
import { EDITOR_OPTIONS, THEME, defineEditorTheme } from './editorTheme';

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
    <div className="w-full h-full min-h-[300px] overflow-hidden bg-[var(--chrome-bg)]">
      <Editor
        height="100%"
        value={value}
        language={language}
        theme={THEME}
        onChange={(v) => onChange(v ?? '')}
        options={{
          ...EDITOR_OPTIONS,
          readOnly: disabled,
          tabSize: language === 'python' ? 4 : 2,
        }}
        beforeMount={defineEditorTheme}
        onMount={(_editor, monaco) => {
          monaco.editor.setTheme(THEME);
          // Same as MonacoProjectEditor: without this, every reference to a global the test harness
          // injects (check/checkText/etc.) that isn't declared in the file itself gets red-squiggled.
          javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
          });
        }}
        loading={
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--chrome-muted)] font-mono bg-[var(--chrome-bg)]">
            Loading editor&hellip;
          </div>
        }
      />
    </div>
  );
}
