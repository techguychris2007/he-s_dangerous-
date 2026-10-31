import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import LearningNavigation from './LearningNavigation';
import Companion from '../companion/Companion';
import XpToaster from '../common/XpToaster';
import HandleWelcome from '../characters/HandleWelcome';
import '../common/academy.css';

export default function AppLayout() {
  const { pathname } = useLocation();
  const fixedWorkspace = /^\/(lab|siem-lab)\//.test(pathname);
  useEffect(() => {
    const main = document.getElementById('main-content');
    main?.scrollTo(0, 0);
    if (document.activeElement === document.body) main?.focus({ preventScroll: true });
  }, [pathname]);
  return <div className="app-shell-bg flex flex-col h-[100dvh] w-full max-w-full overflow-hidden academy-shell">
    <a href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }} className="learning-shell__skip">Skip to main content</a>
    <Companion/><XpToaster/><HandleWelcome/>
    <LearningNavigation/>
    <main id="main-content" tabIndex={-1} className={`flex-1 min-h-0 ${fixedWorkspace ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div key={pathname} className="page-transition h-full min-h-0"><Outlet/></div>
    </main>
  </div>;
}
