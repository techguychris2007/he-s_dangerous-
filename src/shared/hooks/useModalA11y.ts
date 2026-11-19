import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/** Real dialog semantics for a modal that's otherwise just a styled div: Escape closes it, Tab
 *  cycles only within the panel instead of leaking focus into the page behind it, and focus is
 *  restored to whatever triggered the modal once it closes. Attach the returned ref to the modal's
 *  outer panel element (the one that should also carry role="dialog" aria-modal="true"). */
export function useModalA11y(onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
    // onClose deliberately omitted: it's always a fresh closure around a stable setState call, and
    // re-running this effect on every parent re-render would re-steal focus into the panel each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return panelRef;
}
