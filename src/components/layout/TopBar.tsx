import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { findModule, findLesson } from '../../data/curriculum';
import { findLab } from '../../data/labs';
import { useProgress } from '../../state/progressStore';
import { useTheme } from '../../state/theme';
import { IconMenu, IconSun, IconMoon, IconBell, IconCheck, IconFlag } from './icons';

const PAGE_TITLES: Record<string, string> = {
  tasks: 'My tasks',
  schedule: 'Schedule',
  leaderboard: 'Leaderboard',
  resources: 'Resources',
  announcements: 'Announcements',
  profile: 'Profile',
  security: 'Security',
  help: 'Help & FAQ',
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return 'Dashboard';
  if (parts[0] === 'labs') return 'Labs';
  if (parts[0] === 'progress') return 'Progress';
  if (parts[0] === 'roadmap') return 'Roadmap';
  if (parts[0] === 'lab') return findLab(parts[1])?.scenario.title ?? 'Lab';
  if (parts[0] === 'module' && parts[3] === 'lesson') {
    return findLesson(parts[1], parts[3] ? parts[4] : undefined)?.lesson.title ?? 'Lesson';
  }
  if (parts[0] === 'module') return findModule(parts[1])?.title ?? 'Module';
  if (PAGE_TITLES[parts[0]]) return PAGE_TITLES[parts[0]];
  return 'DarkWorld';
}

interface Notification {
  key: string;
  text: string;
  icon: 'flag' | 'check';
}

function useRecentActivity(): Notification[] {
  const progress = useProgress();
  return useMemo(() => {
    const items: Notification[] = [];
    for (const [labId, flags] of Object.entries(progress.labFlags)) {
      for (const flag of flags) items.push({ key: `${labId}:${flag}`, text: `Captured a flag in ${labId}`, icon: 'flag' });
    }
    for (const lessonId of Object.keys(progress.completedLessons)) {
      if (progress.completedLessons[lessonId]) items.push({ key: `lesson:${lessonId}`, text: `Completed lesson ${lessonId}`, icon: 'check' });
    }
    return items.slice(-6).reverse();
  }, [progress.labFlags, progress.completedLessons]);
}

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const title = usePageTitle();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const activity = useRecentActivity();
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!notifOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        notifButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [notifOpen]);

  return (
    <header className="h-14 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3 px-5 relative">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
        aria-label="Toggle navigation"
      >
        <IconMenu className="w-5 h-5" />
      </button>
      <h1 className="text-sm font-bold text-[var(--color-heading)] truncate">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
        >
          {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            ref={notifButtonRef}
            onClick={() => setNotifOpen((o) => !o)}
            title="Notifications"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors relative"
          >
            <IconBell className="w-4 h-4" />
            {activity.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div role="menu" aria-label="Recent activity" className="absolute right-0 top-10 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-40 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-wide text-[var(--color-text-dim)]">
                  Recent activity
                </div>
                {activity.length === 0 ? (
                  <div className="px-3.5 py-6 text-xs text-[var(--color-text-dim)] text-center">
                    Nothing yet — complete a lesson or capture a flag to see it here.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {activity.map((a) => (
                      <div key={a.key} className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--color-text)] border-b border-[var(--color-border)] last:border-0">
                        {a.icon === 'flag' ? (
                          <IconFlag className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                        ) : (
                          <IconCheck className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                        )}
                        <span className="truncate">{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
