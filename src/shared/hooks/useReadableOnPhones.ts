import { useEffect, type RefObject } from 'react';
import '../styles/readable-on-phones.css';

const PHONE = '(max-width: 767px)';
const EXPANDABLE = 'pre, img, svg, table, .lesson-table-wrap';

/** Makes long-form content (lessons, articles) readable on a phone without pinch-zooming:
 *
 *  - Tables with three or more columns become stacked cards: each row is a card and each cell is
 *    labelled with its column header, so nothing is squeezed into 40px columns.
 *  - Anything still wider than the screen (code, ASCII diagrams, images, two-column tables) gets an
 *    "Expand" button that opens it full screen, where it can scroll both ways and be pinch-zoomed
 *    or read in landscape.
 *
 *  Works on rendered DOM, so it covers every lesson format without changing their markup. Content
 *  that renders later (tabs, reveal panels) is picked up by a MutationObserver. */
export function useReadableOnPhones(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof window === 'undefined') return;
    const phone = window.matchMedia(PHONE);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const labelTables = () => {
      root.querySelectorAll<HTMLTableElement>('table:not([data-dw-stack])').forEach(table => {
        const headers = [...table.querySelectorAll('thead th')].map(cell => cell.textContent?.trim() ?? '');
        const stack = headers.length >= 3 && !table.closest('[data-dw-no-stack]');
        table.dataset.dwStack = stack ? 'yes' : 'no';
        if (!stack) return;
        table.querySelectorAll('tbody tr').forEach(row => {
          [...row.children].forEach((cell, index) => { if (headers[index]) cell.setAttribute('data-label', headers[index]); });
        });
      });
    };

    const addExpandButtons = () => {
      if (!phone.matches) return;
      root.querySelectorAll<HTMLElement>(EXPANDABLE).forEach(element => {
        if (element.dataset.dwExpand || element.closest('[data-dw-expand], .dw-expand-dialog')) return;
        if (element instanceof HTMLTableElement && element.dataset.dwStack === 'yes') return;
        if (element.matches('svg') && (element.closest('button, a, pre') || element.getBoundingClientRect().width < 120)) return;
        if (element.matches('img') && element.getBoundingClientRect().width < 120) return;
        const wide = element.scrollWidth > element.clientWidth + 4 || element.matches('img, svg');
        if (!wide) return;
        element.dataset.dwExpand = 'yes';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dw-expand-button';
        button.textContent = 'Expand';
        button.setAttribute('aria-label', 'Open full screen');
        button.addEventListener('click', () => openFullScreen(element, root));
        const anchor = element.closest('figure') ?? element;
        anchor.insertAdjacentElement('afterend', button);
      });
    };

    const run = () => { clearTimeout(timer); timer = setTimeout(() => { labelTables(); addExpandButtons(); }, 60); };
    run();
    const observer = new MutationObserver(run);
    observer.observe(root, { childList: true, subtree: true });
    phone.addEventListener('change', run);
    return () => { clearTimeout(timer); observer.disconnect(); phone.removeEventListener('change', run); };
  }, [ref]);
}

function openFullScreen(source: HTMLElement, root: HTMLElement) {
  const dialog = document.createElement('dialog');
  dialog.className = 'dw-expand-dialog';
  dialog.setAttribute('aria-label', 'Full screen view');
  const bar = document.createElement('div');
  bar.className = 'dw-expand-dialog__bar';
  const hint = document.createElement('p');
  hint.textContent = 'Scroll sideways, pinch to zoom, or turn your phone.';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  bar.append(hint, close);
  const body = document.createElement('div');
  // Carry the reader's classes and text size so the copy is styled like the original.
  const reader = root.closest<HTMLElement>('.lesson-reader');
  body.className = ['dw-expand-dialog__body', reader?.className ?? '', root.className].join(' ');
  if (reader) body.style.setProperty('--reader-size', getComputedStyle(reader).getPropertyValue('--reader-size'));
  const copy = (source.closest('figure') ?? source).cloneNode(true) as HTMLElement;
  copy.querySelectorAll('.dw-expand-button, button').forEach(node => node.remove());
  copy.removeAttribute('data-dw-expand');
  body.append(copy);
  dialog.append(bar, body);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.body.append(dialog);
  dialog.showModal();
  close.focus();
}
