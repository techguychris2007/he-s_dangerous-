import { useEffect, useRef, useState } from 'react';
import { IconCheck } from '../layout/icons';

interface CodeBlockProps {
  children: string;
  label?: string;
}

export default function CodeBlock({ children, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lines = children.trimEnd().split('\n');
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setCopyError(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch { setCopyError(true); }
  };

  return (
    <div className="lesson-code my-5 overflow-hidden">
      {(
        <div className="lesson-code-header flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="lesson-code-label text-xs font-semibold">{label ?? 'Code example'}</p>
            <p className="lesson-code-status mt-1 text-xs">{lines.length} {lines.length === 1 ? 'line' : 'lines'}</p>
          </div>
        </div>
      )}
      <div className="relative group">
        <pre tabIndex={0} aria-label={label ?? 'Code example'} className="max-h-[28rem] overflow-auto bg-[#111827] p-5 pr-16 font-mono text-code leading-relaxed text-[#f8fafc]">
          {lines.map((line, index) => <span key={`${index}-${line}`} className="block min-h-[1.65em]"><span className="lesson-code-line-number mr-4 inline-block w-7 select-none text-right">{index + 1}</span><span className="text-slate-50">{line}</span></span>)}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-2xs font-semibold text-white/75 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
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
      {copyError && <p role="status" className="px-3 py-2 text-xs text-[var(--color-text-dim)]">Copy is unavailable. Select the code to copy it manually.</p>}
    </div>
  );
}
