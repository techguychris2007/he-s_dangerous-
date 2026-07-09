import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { MODULES, findModule } from '../../data/curriculum';
import { LABS } from '../../data/labs';
import { useProgress } from '../../state/progressStore';
import Logo from './Logo';
import {
  ModuleIcon,
  IconDashboard,
  IconFlask,
  IconChart,
  IconMap,
  IconCheck,
  IconCalendar,
  IconTrophy,
  IconBook,
  IconMegaphone,
  IconUser,
  IconShieldCheck,
  IconHelp,
  IconExternal,
} from './icons';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 ${
    isActive
      ? 'bg-[var(--color-surface-2)] text-[var(--color-heading)] border-[var(--color-accent)]'
      : 'text-[var(--color-text)] border-transparent hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]'
  }`;

export default function Sidebar() {
  const progress = useProgress();
  const { moduleSlug } = useParams();
  const currentModule = findModule(moduleSlug);
  const navigate = useNavigate();
  const initial = (progress.learnerName ?? '?').trim().charAt(0).toUpperCase();
  const tasksRemaining = LABS.filter((l) => progress.flagCount(l.scenario.id) < l.scenario.totalFlags).length;

  return (
    <aside className="w-72 shrink-0 h-full overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 flex flex-col">
      <NavLink to="/" className="flex items-center gap-2.5 px-2 mb-1">
        <Logo className="w-7 h-7 shrink-0" />
        <span className="font-extrabold text-[var(--color-heading)] tracking-tight text-lg">HackerHub</span>
      </NavLink>
      <div className="px-2 mb-5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-accent)]">Intern Portal</div>
        <div className="text-xs font-semibold text-[var(--color-heading)] uppercase tracking-wide truncate">
          Cybersecurity &middot; Offensive Security
        </div>
      </div>

      <nav className="flex flex-col gap-1 mb-6">
        <NavLink to="/" end className={navItemClass}>
          <IconDashboard className="w-4 h-4" /> Dashboard
        </NavLink>
        <NavLink to="/labs" className={navItemClass}>
          <IconFlask className="w-4 h-4" /> Labs
        </NavLink>
        <NavLink to="/tasks" className={navItemClass}>
          <IconCheck className="w-4 h-4" /> My tasks
          {tasksRemaining > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-[var(--color-accent)] text-white rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
              {tasksRemaining}
            </span>
          )}
        </NavLink>
        <NavLink to="/progress" className={navItemClass}>
          <IconChart className="w-4 h-4" /> Progress
        </NavLink>
        <NavLink to="/roadmap" className={navItemClass}>
          <IconMap className="w-4 h-4" /> Roadmap
        </NavLink>
        <NavLink to="/schedule" className={navItemClass}>
          <IconCalendar className="w-4 h-4" /> Schedule
        </NavLink>
        <NavLink to="/leaderboard" className={navItemClass}>
          <IconTrophy className="w-4 h-4" /> Leaderboard
        </NavLink>
        <NavLink to="/resources" className={navItemClass}>
          <IconBook className="w-4 h-4" /> Resources
        </NavLink>
        <NavLink to="/announcements" className={navItemClass}>
          <IconMegaphone className="w-4 h-4" /> Announcements
        </NavLink>
        <NavLink to="/profile" className={navItemClass}>
          <IconUser className="w-4 h-4" /> Profile
        </NavLink>
        <NavLink to="/security" className={navItemClass}>
          <IconShieldCheck className="w-4 h-4" /> Security
        </NavLink>
        <NavLink to="/help" className={navItemClass}>
          <IconHelp className="w-4 h-4" /> Help &amp; FAQ
        </NavLink>
      </nav>

      <div className="border-t border-[var(--color-border)] pt-4 flex-1">
        {currentModule ? (
          <>
            <div className="px-2 mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-text-dim)]">
              {currentModule.title}
            </div>
            <div className="flex flex-col gap-0.5">
              {currentModule.lessons.map((lesson, i) => {
                const complete = progress.isLessonComplete(lesson.id);
                return (
                  <NavLink key={lesson.id} to={`/module/${currentModule.slug}/lesson/${lesson.slug}`} className={navItemClass}>
                    <span
                      className={`w-5 h-5 shrink-0 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        complete ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                      }`}
                    >
                      {complete ? <IconCheck className="w-2.5 h-2.5" /> : i + 1}
                    </span>
                    <span className="truncate">{lesson.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="px-2 mb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-text-dim)]">
              Modules
            </div>
            <div className="flex flex-col gap-0.5">
              {MODULES.map((mod) => (
                <NavLink key={mod.id} to={`/module/${mod.slug}`} className={navItemClass}>
                  <ModuleIcon icon={mod.icon} className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="truncate">{mod.title}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] pt-3 mt-3 flex items-center gap-2.5 px-2">
        <span className="w-8 h-8 rounded-full bg-[var(--color-navy)] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[var(--color-heading)] truncate">{progress.learnerName}</div>
          <div className="text-[11px] text-[var(--color-text-dim)] truncate">Cybersecurity &middot; Offensive Security</div>
        </div>
        <button
          onClick={() => {
            progress.logout();
            navigate('/login');
          }}
          title="Log out"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] shrink-0"
        >
          <IconExternal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
