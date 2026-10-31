import type { ComponentType, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../state/theme';
import { IconDashboard, IconBook, IconFlask, IconLayers, IconTrophy, IconUser, IconSun, IconMoon } from './icons';
import Logo from './Logo';
import AcademySearch from './AcademySearch';
import DigAvatar from '../characters/DigAvatar';
import LevelHud from '../common/LevelHud';
import './learning-navigation.css';

function LibrarySymbol() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="5" height="15" rx="1"/><rect x="9" y="3" width="5" height="17" rx="1"/><path d="m16 5 4-1 3 15-4 1zM4 9h3m3-2h3M2 21h21"/></svg>;
}

const DESTINATIONS: { href: string; title: string; icon: ComponentType<{className?: string}>; matches: (path: string) => boolean }[] = [
  { href: '/', title: 'Overview', icon: IconDashboard, matches: path => path === '/' },
  { href: '/my-learning', title: 'Learn', icon: IconBook, matches: path => /^\/(module|ml-lesson|my-learning)(\/|$)/.test(path) },
  { href: '/labs', title: 'Practice', icon: IconFlask, matches: path => /^\/(lab|labs|siem-lab|code-task)(\/|$)/.test(path) },
  { href: '/build-portal', title: 'Build', icon: IconLayers, matches: path => /^\/build-(portal|task)(\/|$)/.test(path) },
  { href: '/library', title: 'Library', icon: LibrarySymbol, matches: path => /^\/library(\/|$)/.test(path) },
  { href: '/leaderboard', title: 'Rankings', icon: IconTrophy, matches: path => path === '/leaderboard' },
];
export default function LearningNavigation() {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  return <header className="learning-navigation">
    <Link to="/" className="learning-navigation__brand" aria-label="DarkWorld overview"><Logo className="h-11 w-11"/><span>DarkWorld<small>LEARNING WORKSPACE</small></span></Link>
    <nav aria-label="Learning workspace navigation">{DESTINATIONS.map(({ href, title, icon: Icon, matches }) => <Link key={href} to={href} className={`learning-navigation__link${matches(pathname) ? ' is-current' : ''}`} aria-current={matches(pathname) ? 'page' : undefined}><span className="learning-navigation__symbol" aria-hidden="true"><Icon /></span><span>{title}</span></Link>)}</nav>
    <div className="learning-navigation__tools">
      <AcademySearch compact />
      <button type="button" className="learning-navigation__dig" onClick={() => window.dispatchEvent(new CustomEvent('darkworld:research-term', { detail: '' }))} aria-label="Ask dig, your learning assistant"><DigAvatar size={43}/><span>dig</span></button>
      <LevelHud />
      <button type="button" className="learning-navigation__control" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggle}>{theme === 'dark' ? <IconSun/> : <IconMoon/>}</button>
      <Link to="/profile" className="learning-navigation__control" aria-label="Your profile"><IconUser/></Link>
    </div>
  </header>;
}
export function LearningShell({ children }: { children: ReactNode }) {
  return <div className="learning-shell"><a href="#learning-workspace-content" className="learning-shell__skip">Skip to lesson</a><LearningNavigation/><main id="learning-workspace-content" tabIndex={-1} className="learning-shell__content">{children}</main></div>;
}
