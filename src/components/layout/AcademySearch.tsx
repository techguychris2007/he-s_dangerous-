import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/authStore';
import { isInstructor } from '../../lib/instructorConfig';
import { searchAcademy } from './navigation';
import './navigation.css';

export default function AcademySearch({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const auth = useAuth();
  const navigate = useNavigate();
  const results = searchAcademy(query, isInstructor(auth.user));
  const show = () => { setQuery(''); setActive(0); setOpen(true); };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setQuery(''); setActive(0); setOpen(current => !current);
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) { node.showModal(); input.current?.focus(); }
    else if (!open && node?.open) node.close();
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(listId + '-' + active)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId, open]);
  function choose(index: number) {
    const result = results[index];
    if (!result) return;
    setOpen(false);
    navigate(result.to);
    onNavigate?.();
  }
  return <>
    <button type="button" className={'dw-search-trigger' + (compact ? ' dw-search-trigger-compact' : '')} onClick={show} aria-label="Search academy" aria-haspopup="dialog">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
      {!compact && <><span>Search academy</span><kbd>Ctrl K</kbd></>}
    </button>
    {createPortal(<dialog ref={dialog} className="dw-search-dialog" aria-labelledby={listId + '-title'} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation(); }}>
      <div className="dw-search-box">
        <header><div><p>QUICK NAVIGATION</p><h2 id={listId + '-title'}>Where would you like to go?</h2></div><button type="button" className="dw-search-close" aria-label="Close academy search" onClick={() => setOpen(false)}>Esc</button></header>
        <input ref={input} type="search" role="combobox" autoComplete="off" aria-label="Search pages, modules and lessons" aria-expanded={true} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={results[active] ? listId + '-' + active : undefined} placeholder="Try networking, Python, or SOC…" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setActive(current => Math.max(0, Math.min(current + 1, results.length - 1))); }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActive(current => Math.max(current - 1, 0)); }
          if (event.key === 'Enter') { event.preventDefault(); choose(active); }
        }}/>
        <p className="dw-search-caption">{query ? 'Matching destinations' : 'Start here'}</p>
        <ul id={listId} role="listbox" aria-label="Academy destinations">
          {results.map((result, index) => <li key={result.to} role="presentation"><button id={listId + '-' + index} type="button" role="option" aria-selected={index === active} tabIndex={-1} onMouseMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}><span><strong>{result.title}</strong><small>{result.description}</small></span><span className="dw-search-result-group">{result.group}<span aria-hidden="true"> ↗</span></span></button></li>)}
        </ul>
        {!results.length && <div className="dw-search-empty" role="status"><strong>No matching pages or lessons</strong><p>Try a topic such as Linux, networking or Python.</p></div>}
        <footer><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span>Pages · Modules · Lessons</span></footer>
      </div>
    </dialog>, document.body)}
  </>;
}

