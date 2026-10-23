import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconCopy } from '../layout/icons';

interface CodeBlockProps {
  children: string;
  label?: string;
}

/** One compact terminal-style panel: a slim header (label · line count · copy) above the numbered code.
 *  Colours come from the theme-invariant --term-* tokens, like a real terminal. */
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
    <figure className="lesson-code">
      <figcaption className="lesson-code-header">
        <span className="lesson-code-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="lesson-code-label">{label ?? 'Code example'}</span>
        <span className="lesson-code-status">{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
        <button type="button" onClick={copy} className="lesson-code-copy" aria-label={copied ? 'Copied to clipboard' : `Copy ${label ?? 'code'}`}>
          {copied ? <><IconCheck className="w-3.5 h-3.5" />Copied</> : <><IconCopy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </figcaption>
      <pre tabIndex={0} aria-label={label ?? 'Code example'}>
        {lines.map((line, index) => <span key={`${index}-${line}`} className="lesson-code-row"><span className="lesson-code-line-number" aria-hidden="true">{index + 1}</span><span>{line}</span></span>)}
      </pre>
      {copyError && <p role="status" className="lesson-code-error">Copy is unavailable. Select the code to copy it manually.</p>}
    </figure>
  );
}
