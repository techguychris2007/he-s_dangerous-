interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** A plain but code-editor-shaped textarea: monospace, 4-space Tab handling, no autocorrect/autocomplete
 *  noise. No syntax highlighting — keeping this dependency-free was worth more than a prettier editor. */
export default function CodeEditor({ value, onChange, disabled }: CodeEditorProps) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape is the standard keyboard-only escape hatch out of a textarea that otherwise captures
    // Tab — without it, a keyboard-only user who tabs in here can never tab back out.
    if (e.key === 'Escape') {
      e.currentTarget.blur();
      return;
    }
    // Only plain Tab inserts a soft indent; Shift+Tab is left alone so it does its native job of
    // moving focus to the previous control instead of also getting trapped.
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = value.slice(0, start) + '    ' + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 4;
    });
  };

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      className="w-full h-full min-h-[280px] resize-none bg-[#0c0d10] text-[#d8d0c0] font-mono text-code leading-relaxed p-4 outline-none rounded-lg border border-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/60 disabled:opacity-60"
      style={{ tabSize: 4 }}
    />
  );
}
