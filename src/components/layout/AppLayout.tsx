import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Companion from '../companion/Companion';
import XpToaster from '../common/XpToaster';
import HandleWelcome from '../characters/HandleWelcome';
import '../common/academy.css';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const navRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const fixedWorkspace = /^\/(lab|siem-lab)\//.test(pathname);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => { setDesktop(media.matches); if (media.matches) setMobileOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = navRef.current;
    panel?.querySelector<HTMLElement>('button, a[href]')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      // A native modal above the drawer owns its keyboard and focus cycle.
      if (e.target instanceof Element && e.target.closest('dialog[open]')) return;
      if (e.key === 'Escape') setMobileOpen(false);
      if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button, summary, select, [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
        const first = items[0]; const last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [mobileOpen]);

  // <main> owns its own scroll (overflow-y-auto below), so the browser's native scroll restoration
  // never touches it — without this, navigating away from a page scrolled halfway down (a long
  // lesson, the lab catalog) lands the next page already scrolled to that same offset.
  useEffect(() => {
    const main = document.getElementById('main-content');
    main?.scrollTo(0, 0);
    if (document.activeElement === document.body) main?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={`app-shell-bg flex h-[100dvh] w-full max-w-full overflow-hidden academy-shell`}>
      {/* First focusable element in the app — invisible until it receives keyboard focus, so a
          keyboard user can jump straight past the full sidebar nav instead of tabbing through it
          on every single page. */}
      <a
        href="#main-content"
        onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--color-accent)] focus:text-black focus:font-semibold"
      >
        Skip to main content
      </a>
      <Companion />
      <XpToaster />
      <HandleWelcome />
      <div
        id="platform-navigation"
        ref={navRef}
        inert={!desktop && !mobileOpen}
        role={!desktop && mobileOpen ? 'dialog' : undefined}
        aria-modal={!desktop && mobileOpen ? true : undefined}
        aria-label="Platform navigation"
        className={`fixed lg:static inset-y-0 left-0 z-30 transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {mobileOpen && !desktop && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="dw-navigation-close"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button>}
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      {mobileOpen && (
        <div aria-hidden className="fixed inset-0 bg-black/40 backdrop-blur-xs z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <div inert={mobileOpen && !desktop} className="flex-1 flex flex-col min-w-0">
        <TopBar menuOpen={mobileOpen} onMenuClick={() => setMobileOpen((o) => !o)} />
        <main id="main-content" tabIndex={-1} className={`flex-1 min-h-0 ${fixedWorkspace ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* h-full passes main's height through to pages like LabPage/CodeTaskPage that render
              their own `h-full flex` workspace layout and need a definite height to fill. */}
          <div key={pathname} className="page-transition h-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
