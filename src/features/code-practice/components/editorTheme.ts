import type { Monaco } from '@monaco-editor/react';

export const THEME = 'darkworld-ide';

/** The IDE always uses the platform's navy chrome (like the sidebar and room banners) in both site
 *  themes, so code looks the same everywhere. Syntax colours come from the platform palette:
 *  indigo for calls, violet for keywords, gold for strings, green for numbers. */
export function defineEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME, {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'comment', foreground: '6B7394', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'B79CFF' },
      { token: 'string', foreground: 'E9C98A' },
      { token: 'string.escape', foreground: 'F3DCA3' },
      { token: 'number', foreground: '6EE7B7' },
      { token: 'type', foreground: '8FD3FF' },
      { token: 'type.identifier', foreground: '8FD3FF' },
      { token: 'identifier', foreground: 'E4E8FF' },
      { token: 'delimiter', foreground: '98A1BF' },
      { token: 'operator', foreground: 'C4CAE0' },
      { token: 'predefined', foreground: 'A3AEFF' },
      { token: 'tag', foreground: 'A3AEFF' },
      { token: 'attribute.name', foreground: 'E9C98A' },
    ],
    colors: {
      'editor.background': '#0f1424',
      'editor.foreground': '#e4e8ff',
      'editorLineNumber.foreground': '#4d5679',
      'editorLineNumber.activeForeground': '#a3aeff',
      'editorGutter.background': '#0f1424',
      'editor.lineHighlightBackground': '#172036',
      'editor.lineHighlightBorder': '#172036',
      'editorCursor.foreground': '#a3aeff',
      'editor.selectionBackground': '#2b3480',
      'editor.inactiveSelectionBackground': '#222a55',
      'editor.selectionHighlightBackground': '#2b348066',
      'editor.wordHighlightBackground': '#2b348055',
      'editorIndentGuide.background1': '#1f2742',
      'editorIndentGuide.activeBackground1': '#3a4470',
      'editorBracketMatch.background': '#2b348055',
      'editorBracketMatch.border': '#c9a15f',
      'editorWhitespace.foreground': '#2a3352',
      'editorOverviewRuler.border': '#0f1424',
      'editorWidget.background': '#172036',
      'editorWidget.border': '#36405f',
      'editorSuggestWidget.background': '#172036',
      'editorSuggestWidget.selectedBackground': '#2b3480',
      'editorHoverWidget.background': '#172036',
      'scrollbarSlider.background': '#36405f88',
      'scrollbarSlider.hoverBackground': '#4d5679aa',
      'stickyScroll.background': '#121931',
    },
  });
}

/** Shared by the single-file and multi-file (Build Portal) editors. */
export const EDITOR_OPTIONS = {
  fontSize: 15,
  lineHeight: 23,
  fontFamily: "'Ubuntu Mono', 'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace",
  fontLigatures: false,
  minimap: { enabled: false },
  lineNumbers: 'on',
  lineNumbersMinChars: 3,
  glyphMargin: false,
  guides: { indentation: true, bracketPairs: true, highlightActiveIndentation: true },
  bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
  matchBrackets: 'always',
  automaticLayout: true,
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
} as const;
