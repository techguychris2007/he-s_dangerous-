import { useEffect, useMemo, useState, type RefObject } from 'react';
import type { GlossaryEntry } from '../../data/glossary';
import { findGlossaryTerms } from '../../data/glossaryMatch';
import { IconBook } from '../layout/icons';
import './beginner-glossary.css';

/** "New to this?" panel: lists the glossary terms a lesson or lab uses, with plain-English
 *  definitions, so a beginner can read it without stopping to search. Either watches a lazy-rendered
 *  body (`targetRef`) or scans a static string (`text`). Terms the content already defines are
 *  passed in `exclude` and skipped. */
export default function BeginnerGlossary({ targetRef, text, exclude = [], resetKey, title = 'New to this? Key terms here', domains = [] }: {
  targetRef?: RefObject<HTMLElement | null>;
  text?: string;
  exclude?: string[];
  resetKey?: string;
  title?: string;
  /** Opt into domain-scoped terms, e.g. ['ml'] on the ML lesson page. */
  domains?: string[];
}) {
  const [terms, setTerms] = useState<GlossaryEntry[]>([]);
  const excludeKey = exclude.join('|');
  const domainKey = domains.join('|');
  const staticTerms = useMemo(
    () => (text !== undefined ? findGlossaryTerms(text, excludeKey ? excludeKey.split('|') : [], 8, domainKey ? domainKey.split('|') : []) : []),
    [text, excludeKey, domainKey],
  );

  useEffect(() => {
    if (text !== undefined || !targetRef) return;
    const node = targetRef.current;
    if (!node) return;
    let timer = 0;
    const scan = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTerms(findGlossaryTerms(node.textContent ?? '', excludeKey ? excludeKey.split('|') : [], 8, domainKey ? domainKey.split('|') : [])), 120);
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(node, { childList: true, subtree: true });
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [targetRef, text, excludeKey, domainKey, resetKey]);

  const shown = text !== undefined ? staticTerms : terms;
  if (shown.length === 0) return null;
  return (
    <details className="dw-glossary" open>
      <summary>
        <span className="dw-glossary__icon"><IconBook className="h-4 w-4" /></span>
        <span><b>{title}</b><small>{shown.length} plain-English definitions · click to hide</small></span>
      </summary>
      <dl>
        {shown.map((t) => (
          <div key={t.term}><dt>{t.term}</dt><dd>{t.def}</dd></div>
        ))}
      </dl>
    </details>
  );
}
