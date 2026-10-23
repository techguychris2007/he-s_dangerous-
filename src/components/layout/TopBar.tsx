import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULES, findModule, findLesson } from '../../data/curriculum';
import { useLabsData } from '../../state/useLabsData';
import { useProgress } from '../../state/progressStore';
import { useTheme } from '../../state/theme';
import { useSyncStatus } from '../../state/syncStatus';
import { IconMenu, IconSun, IconMoon, IconBell, IconCheck, IconFlag } from './icons';
import InstallAppButton from './InstallAppButton';
import LevelHud from '../common/LevelHud';

/** completedLessons is keyed by lesson id, not slug — there's no direct id lookup in curriculum.ts,
 *  so this scans once. Fine at this scale (a few hundred lessons total, called from a useMemo). */
function findLessonTitleById(lessonId: string): string | undefined {
  for (const mod of MODULES) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson.title;
  }
  return undefined;
}

const PAGE_TITLES: Record<string, string> = {
  'siem-lab': 'Investigation lab',
  'soc-portal': 'Security operations',
  'code-portal': 'Code Portal',
  'ml-portal': 'Machine Learning',
  'build-portal': 'Build Portal',
  library: 'Library',
  tasks: 'My tasks',
  schedule: 'Schedule',
  leaderboard: 'Leaderboard',
  resources: 'Resources',
  announcements: 'Announcements',
  profile: 'Profile',
  security: 'Security',
  help: 'Help & FAQ',
  feedback: 'Feedback',
  instructor: 'Instructor Dashboard',
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  const labsData = useLabsData();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return 'Dashboard';
  if (parts[0] === 'labs') return 'Rooms';
  if (parts[0] === 'progress') return 'Progress';
  if (parts[0] === 'roadmap') return 'Roadmap';
  if (parts[0] === 'my-learning') return 'My Learning';
  if (parts[0] === 'lab') return labsData?.findLab(parts[1])?.scenario.title ?? 'Room';
  if (parts[0] === 'module' && parts[2] === 'lesson') {
    return findLesson(parts[1], parts[3])?.lesson.title ?? 'Lesson';
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
  const labsData = useLabsData();
  return useMemo(() => {
    const items: Notification[] = [];
    for (const [labId, flags] of Object.entries(progress.labFlags)) {
      const labTitle = labsData?.findLab(labId)?.scenario.title ?? labId;
      for (const flag of flags) items.push({ key: `${labId}:${flag}`, text: `Captured a flag in ${labTitle}`, icon: 'flag' });
    }
    for (const lessonId of Object.keys(progress.completedLessons)) {
      if (progress.completedLessons[lessonId]) {
        items.push({ key: `lesson:${lessonId}`, text: `Completed "${findLessonTitleById(lessonId) ?? lessonId}"`, icon: 'check' });
      }
    }
    return items.slice(-6).reverse();
  }, [progress.labFlags, progress.completedLessons, labsData]);
}

export default function TopBar({ onMenuClick, menuOpen = false }: { onMenuClick: () => void; menuOpen?: boolean }) {
  const sync = useSyncStatus();
  const title = usePageTitle();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const activity = useRecentActivity();
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { document.title = `${title} · DarkWorld`; }, [title]);

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
    <header className="surface-glass h-16 shrink-0 border-b border-[var(--color-border)] flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 relative shadow-[0_14px_40px_-34px_var(--color-heading)]">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] shrink-0 touch-manipulation"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        aria-controls="platform-navigation"
      >
        <IconMenu className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="hidden sm:block text-2xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent-dim)]">DarkWorld Platform</div>
        <div className="text-base sm:text-lg font-bold tracking-[-0.02em] text-[var(--color-heading)] truncate">{title}</div>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
        <InstallAppButton />
        <LevelHud />
        {sync !== 'idle' && <span role="status" title={sync === 'local' ? 'Progress is saved on this device. Cloud sync will retry.' : 'Account progress sync'} className={`hidden md:inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 mr-2 text-2xs font-bold ${sync === 'local' ? 'text-[var(--color-warn)]' : 'text-[var(--color-text-dim)]'}`}>{sync === 'local' ? 'Saved locally' : sync === 'loading' ? 'Loading…' : sync === 'saving' ? 'Saving…' : 'Synced'}</span>}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-10 h-10 rounded-2xl premium-card flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors touch-manipulation"
        >
          {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            ref={notifButtonRef}
            onClick={() => setNotifOpen((o) => !o)}
            title="Notifications"
            aria-label="Notifications"
            aria-controls="recent-activity-panel"
            aria-expanded={notifOpen}
            className="w-10 h-10 rounded-2xl premium-card flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors relative touch-manipulation"
          >
            <IconBell className="w-4 h-4" />
            {activity.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div id="recent-activity-panel" role="region" aria-label="Recent activity" className="premium-card absolute right-0 top-12 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl z-40 overflow-hidden">
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
