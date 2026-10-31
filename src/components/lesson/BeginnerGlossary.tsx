import { useEffect, useMemo, useState, type RefObject } from 'react';
import type { GlossaryEntry } from '../../data/glossary';
import { findGlossaryTerms } from '../../data/glossaryMatch';
import ResearchTerms from './ResearchTerms';

/** Finds relevant terms without displaying definitions. Each term opens a learner-controlled
 *  Cyber AI draft. Watches lazy content or scans supplied text; no question is sent here. */
export default function BeginnerGlossary({ targetRef, text, exclude = [], resetKey, domains = [] }: {
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
  return <ResearchTerms terms={shown.map(term => term.term)} />;
}
