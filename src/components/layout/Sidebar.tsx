import type { ComponentType } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { findModule } from '../../data/curriculum';
import { useProgress } from '../../state/progressStore';
import { useAuth } from '../../state/authStore';
import { isInstructor } from '../../lib/instructorConfig';
import Logo from './Logo';
import { OperatorAvatar } from '../characters/CharacterAvatar';
import { useHandle } from '../../state/useHandle';
import AcademySearch from './AcademySearch';
import { LEARNING_PATHS } from './navigation';
import { IconDashboard, IconFlask, IconChart, IconMap, IconCheck, IconCalendar, IconTrophy, IconBook, IconMegaphone, IconUser, IconShieldCheck, IconHelp, IconMail, IconCode, IconCrown, IconRoute, IconLayers } from './icons';
import './navigation.css';

type NavIcon = ComponentType<{ className?: string }>;
const activityLinks: [string, string, NavIcon][] = [
  ['/progress', 'Progress', IconChart], ['/tasks', 'My tasks', IconCheck],
  ['/schedule', 'Schedule', IconCalendar], ['/leaderboard', 'Leaderboard', IconTrophy],
  ['/announcements', 'Announcements', IconMegaphone],
];
const accountLinks: [string, string, NavIcon][] = [
  ['/profile', 'Profile', IconUser], ['/security', 'Account security', IconShieldCheck],
  ['/help', 'Help & FAQ', IconHelp], ['/feedback', 'Send feedback', IconMail],
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const progress = useProgress();
  const auth = useAuth();
  const { moduleSlug } = useParams();
  const currentModule = findModule(moduleSlug);
  const location = useLocation();
  const navigate = useNavigate();
  const name = progress.learnerName?.trim() || 'Learner';
  const { seed: handleSeed, handle } = useHandle();
  const completed = currentModule?.lessons.filter(lesson => progress.isLessonComplete(lesson.id)).length ?? 0;
  const percent = currentModule?.lessons.length ? Math.round(completed / currentModule.lessons.length * 100) : 0;
  const activeTrack = new URLSearchParams(location.search).get('track') ?? 'presecurity';
  function link(to: string, label: string, Icon: NavIcon) {
    return <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} className={({ isActive }) => 'dw-nav-link' + (isActive ? ' is-active' : '')}><Icon className="dw-nav-icon"/><span>{label}</span></NavLink>;
  }
  return <aside className="dw-sidebar">
    <div className="dw-sidebar-header">
      <NavLink to="/" onClick={onNavigate} className="dw-sidebar-brand" aria-label="DarkWorld overview"><Logo className="h-11 w-11 shrink-0"/><span><strong>DarkWorld</strong><small>CYBER ACADEMY</small></span></NavLink>
      <AcademySearch onNavigate={onNavigate}/>
    </div>
    <div className="dw-sidebar-scroll">
      <nav aria-label="Academy navigation">
        <div className="dw-nav-section dw-nav-workspace">{link('/', 'Overview', IconDashboard)}{link('/my-learning', 'My learning', IconRoute)}</div>
        <div className="dw-nav-section"><p className="dw-nav-label">Learn</p>
          <details className="dw-nav-disclosure" open={location.pathname === '/roadmap'}>
            <summary><IconMap className="dw-nav-icon"/><span>Learning paths</span><span className="dw-nav-chevron" aria-hidden="true">⌄</span></summary>
            <div className="dw-nav-sublist">{LEARNING_PATHS.map(path => <NavLink key={path.track} to={path.to} onClick={onNavigate} className={'dw-nav-path' + (location.pathname === '/roadmap' && activeTrack === path.track ? ' is-active' : '')} aria-current={location.pathname === '/roadmap' && activeTrack === path.track ? 'page' : undefined}>{path.title}</NavLink>)}</div>
          </details>
          {link('/ml-portal', 'Machine learning', IconChart)}
        </div>
        <div className="dw-nav-section"><p className="dw-nav-label">Practice</p>
          {link('/labs', 'Rooms', IconFlask)}{link('/soc-portal', 'SOC casebooks', IconShieldCheck)}{link('/code-portal', 'Coding practice', IconCode)}{link('/build-portal', 'Build projects', IconLayers)}
        </div>
        <div className="dw-nav-section"><p className="dw-nav-label">Reference</p>{link('/library', 'Library', IconBook)}{link('/resources', 'Resources', IconBook)}</div>
        <details className="dw-nav-disclosure dw-nav-activity" open={activityLinks.some(([to]) => location.pathname === to)}><summary><IconTrophy className="dw-nav-icon"/><span>Activity & community</span><span className="dw-nav-chevron" aria-hidden="true">⌄</span></summary><div className="dw-nav-sublist">{activityLinks.map(([to, label, Icon]) => link(to, label, Icon))}</div></details>
        {isInstructor(auth.user) && <div className="dw-nav-section"><p className="dw-nav-label">Staff</p>{link('/instructor', 'Instructor dashboard', IconCrown)}</div>}
      </nav>
      {currentModule && <section className="dw-nav-module" aria-label="Current module">
        <p className="dw-nav-label">Currently learning</p><NavLink to={'/module/' + currentModule.slug} onClick={onNavigate} className="dw-nav-module-title">{currentModule.title}</NavLink>
        <div className="dw-nav-module-meta"><span>{completed} / {currentModule.lessons.length} lessons</span><strong>{percent}%</strong></div>
        <progress max={100} value={percent} aria-label="Current module progress"/>
        <details className="dw-nav-disclosure"><summary><span>Lesson outline</span><span className="dw-nav-chevron" aria-hidden="true">⌄</span></summary><ol className="dw-nav-outline">{currentModule.lessons.map((lesson, index) => <li key={lesson.id}><NavLink to={'/module/' + currentModule.slug + '/lesson/' + lesson.slug} onClick={onNavigate} className={({ isActive }) => 'dw-nav-lesson' + (isActive ? ' is-active' : '')}><span aria-label={progress.isLessonComplete(lesson.id) ? 'Completed' : undefined}>{progress.isLessonComplete(lesson.id) ? <IconCheck className="dw-nav-icon"/> : String(index + 1).padStart(2, '0')}</span><span>{lesson.title}</span></NavLink></li>)}</ol>
          <button type="button" className="dw-nav-reset" onClick={() => { if (window.confirm('Reset your progress for "' + currentModule.title + '"? This clears completed lessons and quiz scores for this module only.')) progress.resetModuleProgress(currentModule.lessons.map(lesson => lesson.id)); }}>Reset module progress</button>
        </details>
      </section>}
    </div>
    <div className="dw-sidebar-footer"><details className="dw-account-menu"><summary><OperatorAvatar seed={handleSeed} size={34} /><span className="dw-account-name"><strong>{handle}</strong><small>{auth.isGuest ? 'Guest workspace' : name}</small></span><span aria-hidden="true">⌃</span></summary><div className="dw-account-popover"><p>YOUR ACCOUNT</p>{accountLinks.map(([to, label, Icon]) => <NavLink key={to} to={to} className="dw-nav-link" onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); onNavigate?.(); }}><Icon className="dw-nav-icon"/><span>{label}</span></NavLink>)}<button type="button" className="dw-nav-link dw-sign-out" onClick={async () => { await auth.signOut(); navigate('/welcome'); onNavigate?.(); }}>Sign out <span aria-hidden="true">↗</span></button></div></details></div>
  </aside>;
}
