import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { MODULES, findModule } from '../../data/curriculum';
import { LABS } from '../../data/labs';
import { useProgress } from '../../state/progressStore';
import { useAuth } from '../../state/authStore';
import { isInstructor } from '../../lib/instructorConfig';
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
  IconMail,
  IconExternal,
  IconCode,
  IconCrown,
  IconRoute,
} from './icons';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 ${
    isActive
      ? 'bg-[var(--color-surface-2)] text-[var(--color-heading)] border-[var(--color-accent)]'
      : 'text-[var(--color-text)] border-transparent hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]'
  }`;

function NavSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 mt-4 mb-1 text-2xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-dim)] first:mt-0">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const progress = useProgress();
  const auth = useAuth();
  const { moduleSlug } = useParams();
  const currentModule = findModule(moduleSlug);
  const navigate = useNavigate();
  const initial = (progress.learnerName ?? '?').trim().charAt(0).toUpperCase();
  const tasksRemaining = LABS.filter((l) => progress.flagCount(l.scenario.id) < l.scenario.totalFlags).length;

  return (
    <aside className="w-72 shrink-0 h-full overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 flex flex-col">
      <NavLink to="/" className="flex items-center gap-2.5 px-2 mb-1.5">
        <Logo className="w-7 h-7 shrink-0" />
        <span className="font-extrabold text-[var(--color-heading)] tracking-tight text-lg">DarkWorld</span>
      </NavLink>
      <div className="px-2 mb-5 text-xs text-[var(--color-text-dim)] leading-snug">
        Hands-on cybersecurity learning platform
      </div>

      <nav className="flex flex-col gap-1 mb-2">
        <NavSectionLabel>Learn</NavSectionLabel>
        <NavLink to="/" end className={navItemClass}>
          <IconDashboard className="w-4 h-4" /> Dashboard
        </NavLink>
        <NavLink to="/labs" className={navItemClass}>
          <IconFlask className="w-4 h-4" /> Labs
        </NavLink>
        <NavLink to="/code-portal" className={navItemClass}>
          <IconCode className="w-4 h-4" /> Code Portal
          <IconExternal className="w-3 h-3 ml-auto opacity-60" />
        </NavLink>
        <NavLink to="/ml-portal" className={navItemClass}>
          <IconChart className="w-4 h-4" /> ML Portal
          <IconExternal className="w-3 h-3 ml-auto opacity-60" />
        </NavLink>
        <NavLink to="/soc-portal" className={navItemClass}>
          <IconShieldCheck className="w-4 h-4" /> SOC Portal
          <IconExternal className="w-3 h-3 ml-auto opacity-60" />
        </NavLink>

        <NavSectionLabel>Track</NavSectionLabel>
        <NavLink to="/my-learning" className={navItemClass}>
          <IconRoute className="w-4 h-4" /> My Learning
        </NavLink>
        <NavLink to="/tasks" className={navItemClass}>
          <IconCheck className="w-4 h-4" /> My tasks
          {tasksRemaining > 0 && (
            <span className="ml-auto text-2xs font-bold bg-[var(--color-accent)] text-white rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
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
        <NavLink to="/leaderboard" className={navItemClass}>
          <IconTrophy className="w-4 h-4" /> Leaderboard
        </NavLink>

        <NavSectionLabel>Resources</NavSectionLabel>
        <NavLink to="/library" className={navItemClass}>
          <IconBook className="w-4 h-4" /> Library
          <IconExternal className="w-3 h-3 ml-auto opacity-60" />
        </NavLink>
        <NavLink to="/resources" className={navItemClass}>
          <IconBook className="w-4 h-4" /> Resources
        </NavLink>
        <NavLink to="/schedule" className={navItemClass}>
          <IconCalendar className="w-4 h-4" /> Schedule
        </NavLink>
        <NavLink to="/announcements" className={navItemClass}>
          <IconMegaphone className="w-4 h-4" /> Announcements
        </NavLink>

        <NavSectionLabel>Account</NavSectionLabel>
        <NavLink to="/profile" className={navItemClass}>
          <IconUser className="w-4 h-4" /> Profile
        </NavLink>
        <NavLink to="/security" className={navItemClass}>
          <IconShieldCheck className="w-4 h-4" /> Security
        </NavLink>
        <NavLink to="/help" className={navItemClass}>
          <IconHelp className="w-4 h-4" /> Help &amp; FAQ
        </NavLink>
        <NavLink to="/feedback" className={navItemClass}>
          <IconMail className="w-4 h-4" /> Feedback
        </NavLink>
        {isInstructor(auth.user?.email) && (
          <>
            <NavSectionLabel>Instructor</NavSectionLabel>
            <NavLink to="/instructor" className={navItemClass}>
              <IconCrown className="w-4 h-4" /> Instructor Dashboard
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-[var(--color-border)] pt-4 flex-1">
        {currentModule ? (
          <>
            <div className="px-2 mb-3">
              <div className="text-2xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-dim)] mb-0.5">
                {currentModule.title}
              </div>
              <div className="text-2xs font-mono font-bold uppercase tracking-widest text-[var(--color-accent)]">
                {Math.max(1, Math.ceil(currentModule.lessons.length / 3))} week{Math.max(1, Math.ceil(currentModule.lessons.length / 3)) > 1 ? 's' : ''}
              </div>
              <div className="flex items-center justify-between text-2xs text-[var(--color-text-dim)] mt-2 mb-1">
                <span>Your progress</span>
                <span className="font-mono font-bold text-[var(--color-heading)]">
                  {Math.round((currentModule.lessons.filter((l) => progress.isLessonComplete(l.id)).length / currentModule.lessons.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                  style={{
                    width: `${Math.round((currentModule.lessons.filter((l) => progress.isLessonComplete(l.id)).length / currentModule.lessons.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              {currentModule.lessons.map((lesson, i) => {
                const complete = progress.isLessonComplete(lesson.id);
                const day = Math.floor(i / 2) + 1;
                return (
                  <NavLink key={lesson.id} to={`/module/${currentModule.slug}/lesson/${lesson.slug}`} className={navItemClass}>
                    <span
                      className={`w-5 h-5 shrink-0 rounded-full text-2xs font-bold flex items-center justify-center ${
                        complete ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                      }`}
                    >
                      {complete ? <IconCheck className="w-2.5 h-2.5" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{lesson.title}</span>
                      <span className="block text-2xs text-[var(--color-text-dim)] font-mono">
                        {lesson.minutes} min &middot; Day {day}
                      </span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
            <button
              onClick={() => {
                if (window.confirm(`Reset your progress for "${currentModule.title}"? This clears completed lessons and quiz scores for this module only.`)) {
                  progress.resetModuleProgress(currentModule.lessons.map((l) => l.id));
                }
              }}
              className="mt-3 w-full text-center text-2xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-danger)] transition-colors py-1.5"
            >
              Reset this module's progress
            </button>
          </>
        ) : (
          <>
            <div className="px-2 mb-2 text-2xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-dim)]">
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
        <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 group">
          <span className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--color-heading)] truncate">{progress.learnerName}</div>
            <div className="text-2xs text-[var(--color-text-dim)] group-hover:text-[var(--color-accent)] transition-colors">View profile</div>
          </div>
        </NavLink>
        <button
          onClick={() => {
            auth.signOut();
            navigate('/welcome');
          }}
          title="Log out"
          aria-label="Log out"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] shrink-0"
        >
          <IconExternal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
