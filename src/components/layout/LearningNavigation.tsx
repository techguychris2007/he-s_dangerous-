import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../state/theme';
import { IconDashboard, IconBook, IconFlask, IconLayers, IconTrophy, IconUser, IconSun, IconMoon } from './icons';
import Logo from './Logo';
import AcademySearch from './AcademySearch';
import DigAvatar from '../characters/DigAvatar';
import LevelHud from '../common/LevelHud';
import InstallAppButton from './InstallAppButton';
import CyberLabAI from '../labs/CyberLabAI';
import { isLearningWorkspace } from './learningWorkspace';
import { useAuth } from '../../state/authStore';
import { isInstructor } from '../../lib/instructorConfig';
import { findLesson, findModule } from '../../data/curriculum';
import './learning-navigation.css';

function LibrarySymbol() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="5" height="15" rx="1"/><rect x="9" y="3" width="5" height="17" rx="1"/><path d="m16 5 4-1 3 15-4 1zM4 9h3m3-2h3M2 21h21"/></svg>;
}

const DESTINATIONS: { href: string; title: string; icon: ComponentType<{className?: string}>; matches: (path: string) => boolean }[] = [
  { href: '/', title: 'Overview', icon: IconDashboard, matches: path => path === '/' },
  { href: '/my-learning', title: 'Learn', icon: IconBook, matches: path => /^\/(module|ml-lesson|ml-portal|my-learning|roadmap)(\/|$)/.test(path) },
  { href: '/labs', title: 'Practice', icon: IconFlask, matches: path => /^\/(lab|labs|siem-lab|code-task|code-portal|soc-portal)(\/|$)/.test(path) },
  { href: '/build-portal', title: 'Build', icon: IconLayers, matches: path => /^\/build-(portal|task)(\/|$)/.test(path) },
  { href: '/library', title: 'Library', icon: LibrarySymbol, matches: path => /^\/(library|resources)(\/|$)/.test(path) },
  { href: '/leaderboard', title: 'Rankings', icon: IconTrophy, matches: path => path === '/leaderboard' },
];
const MORE = [
  { title: 'Learning & practice', links: [['/roadmap', 'Learning paths'], ['/ml-portal', 'Machine learning'], ['/soc-portal', 'SOC casebooks'], ['/code-portal', 'Coding practice'], ['/resources', 'Resources']] },
  { title: 'Activity', links: [['/progress', 'Progress'], ['/tasks', 'My tasks'], ['/schedule', 'Schedule'], ['/announcements', 'Announcements']] },
  { title: 'Account & support', links: [['/profile', 'Profile'], ['/security', 'Account security'], ['/help', 'Help & FAQ'], ['/feedback', 'Send feedback']] },
];
const TITLES: Record<string, string> = { '': 'Overview', 'my-learning': 'My learning', roadmap: 'Learning paths', labs: 'Practice rooms', 'soc-portal': 'SOC casebooks', 'code-portal': 'Coding practice', 'code-task': 'Coding task', 'build-portal': 'Build projects', 'build-task': 'Build task', 'ml-portal': 'Machine learning', 'ml-lesson': 'Machine learning lesson', library: 'Library', leaderboard: 'Rankings', progress: 'Progress', tasks: 'My tasks', schedule: 'Schedule', announcements: 'Announcements', profile: 'Profile', security: 'Account security', help: 'Help & FAQ', feedback: 'Feedback', instructor: 'Instructor dashboard', resources: 'Resources', lab: 'Practice room', 'siem-lab': 'Investigation' };
export default function LearningNavigation({ onMenuClick, menuOpen = false }: { onMenuClick?: () => void; menuOpen?: boolean } = {}) {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();
  const menu = useRef<HTMLDetailsElement>(null);
  const overview = pathname === '/';
  const parts = pathname.split('/').filter(Boolean);
  const title = parts[0] === 'module' ? (parts[2] === 'lesson' ? findLesson(parts[1], parts[3])?.lesson.title : findModule(parts[1])?.title) ?? 'Learning' : TITLES[parts[0] ?? ''] ?? 'Academy';
  useEffect(() => { document.title = title + ' · DarkWorld'; if (menu.current) menu.current.open = false; }, [pathname, title]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  return <header className={`learning-navigation${onMenuClick ? ' learning-navigation--with-sidebar' : ''}${overview ? ' learning-navigation--overview' : ''}`}>
    <>{onMenuClick && <button type="button" className="learning-navigation__control learning-navigation__sidebar-toggle" aria-label="Open sidebar" aria-controls="platform-navigation" aria-expanded={menuOpen} onClick={onMenuClick}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>}</><Link to="/" className="learning-navigation__brand" aria-label="DarkWorld overview"><Logo className="h-11 w-11"/><span>DarkWorld<small>CYBERSECURITY ACADEMY</small></span></Link>
    <nav aria-label="Platform navigation">{DESTINATIONS.map(({ href, title, icon: Icon, matches }) => <Link key={href} to={href} className={`learning-navigation__link${matches(pathname) ? ' is-current' : ''}`} aria-current={matches(pathname) ? 'page' : undefined}><span className="learning-navigation__symbol" aria-hidden="true"><Icon /></span><span>{title}</span></Link>)}</nav>
    <div className="learning-navigation__tools">
      <AcademySearch compact />
      <InstallAppButton navigation />
      {!overview && <button type="button" className="learning-navigation__dig" onClick={() => window.dispatchEvent(new CustomEvent('darkworld:research-term', { detail: '' }))} aria-label="Ask dig, your learning assistant"><DigAvatar size={43}/><span>dig</span></button>}
      <LevelHud />
      <button type="button" className="learning-navigation__control" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggle}>{theme === 'dark' ? <IconSun/> : <IconMoon/>}</button>
      <details ref={menu} className="learning-navigation__more"><summary className="learning-navigation__control" aria-label="Account and more pages"><IconUser/></summary><div className="learning-navigation__menu">{MORE.map(group => <section key={group.title}><h2>{group.title}</h2>{group.links.map(([href, label]) => <Link key={href} to={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</section>)}{isInstructor(auth.user) && <Link to="/instructor">Instructor dashboard</Link>}<button type="button" onClick={async () => { await auth.signOut(); navigate('/welcome'); }}>Sign out</button></div></details>
    </div>
    {!isLearningWorkspace(pathname) && <CyberLabAI key={pathname} presentation="floating" floatingLauncher={overview} getContext={() => ({ kind: 'lesson', title, bodyText: 'Help the learner navigate DarkWorld, understand learning concepts, or search their prepared library. Do not claim to see private account information or unseen page contents.' })}/>}
  </header>;
}
export function LearningShell({ children }: { children: ReactNode }) {
  return <div className="learning-shell"><a href="#learning-workspace-content" className="learning-shell__skip">Skip to lesson</a><LearningNavigation/><main id="learning-workspace-content" tabIndex={-1} className="learning-shell__content">{children}</main></div>;
}
