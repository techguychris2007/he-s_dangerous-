interface CodeBlockProps {
  children: string;
  label?: string;
}

export default function CodeBlock({ children, label }: CodeBlockProps) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[var(--color-border)]">
      {label && (
        <div className="px-3 py-1.5 text-xs text-[var(--color-text-dim)] bg-[var(--color-surface-2)] border-b border-[var(--color-border)] font-mono">
          {label}
        </div>
      )}
      <pre className="bg-[#080b10] text-[var(--color-accent)] font-mono text-[0.85rem] p-4 overflow-x-auto leading-relaxed">
        {children}
      </pre>
    </div>
  );
}
