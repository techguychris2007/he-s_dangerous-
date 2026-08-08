import type { ProjectFile } from '../../labs/projectTypes';
import { IconLock } from '../layout/icons';

interface ProjectFileTabsProps {
  files: ProjectFile[];
  activePath: string;
  onSelect: (path: string) => void;
  dirtyPaths: Set<string>;
}

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

export default function ProjectFileTabs({ files, activePath, onSelect, dirtyPaths }: ProjectFileTabsProps) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-1 shrink-0">
      {files.map((f) => {
        const active = f.path === activePath;
        return (
          <button
            key={f.path}
            onClick={() => onSelect(f.path)}
            title={f.path}
            aria-current={active}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${
              active
                ? 'border-[var(--color-accent)] text-[var(--color-heading)] bg-[var(--color-surface)]'
                : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface)]/60'
            }`}
          >
            {!f.editable && <IconLock className="w-3 h-3 opacity-60 shrink-0" />}
            {basename(f.path)}
            {dirtyPaths.has(f.path) && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" aria-label="unsaved changes" />}
          </button>
        );
      })}
    </div>
  );
}
