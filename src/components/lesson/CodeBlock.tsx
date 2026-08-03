import { useState } from 'react';
import { IconCheck } from '../layout/icons';

interface CodeBlockProps {
  children: string;
  label?: string;
}

export default function CodeBlock({ children, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[var(--color-border)]">
      {label && (
        <div className="px-3 py-1.5 text-xs text-[var(--color-text-dim)] bg-[var(--color-surface-2)] border-b border-[var(--color-border)] font-mono">
          {label}
        </div>
      )}
      <div className="relative group">
        <pre className="bg-[#080b10] text-[#8be9b8] font-mono text-code p-4 pr-16 overflow-x-auto leading-relaxed">
          {children}
        </pre>
        <button
          onClick={copy}
          className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-md text-2xs font-semibold bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <IconCheck className="w-3 h-3" /> Copied
            </>
          ) : (
            'Copy'
          )}
        </button>
      </div>
    </div>
  );
}
