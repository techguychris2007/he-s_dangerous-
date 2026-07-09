import { useLocation } from 'react-router-dom';
import { findModule, findLesson } from '../../data/curriculum';
import { findLab } from '../../data/labs';
import { IconMenu } from './icons';

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
  return 'HackerHub';
}

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const title = usePageTitle();

  return (
    <header className="h-14 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3 px-5">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
        aria-label="Toggle navigation"
      >
        <IconMenu className="w-5 h-5" />
      </button>
      <h1 className="text-sm font-bold text-[var(--color-heading)] truncate">{title}</h1>
    </header>
  );
}
