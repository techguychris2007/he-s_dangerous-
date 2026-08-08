import type { ProjectFile } from '../../labs/projectTypes';
import { IconLock } from '../layout/icons';

interface ProjectFileTreeProps {
  files: ProjectFile[];
  activePath: string;
  onSelect: (path: string) => void;
}

interface Group {
  dir: string; // '' = root
  files: ProjectFile[];
}

function groupByDirectory(files: ProjectFile[]): Group[] {
  const groups = new Map<string, ProjectFile[]>();
  for (const f of files) {
    const i = f.path.lastIndexOf('/');
    const dir = i === -1 ? '' : f.path.slice(0, i);
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir)!.push(f);
  }
  // Root files first, then subdirectories alphabetically — keeps entry points like index.html/main.py
  // visually first rather than buried under a directory listing.
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)))
    .map(([dir, dirFiles]) => ({ dir, files: dirFiles }));
}

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

/** A structurally read-only file list — no create/rename/delete. A task defines a fixed file set that
 *  its tests depend on existing at exact paths; letting a learner add/remove files would make grading
 *  unbounded, so the tree is navigation-only, same intent a real IDE's project explorer has minus the
 *  editing affordances that don't make sense for a fixed assignment. */
export default function ProjectFileTree({ files, activePath, onSelect }: ProjectFileTreeProps) {
  const groups = groupByDirectory(files);
  return (
    <nav className="w-44 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-y-auto py-1.5" aria-label="Project files">
      {groups.map((g) => (
        <div key={g.dir || '.'} className="mb-1">
          {g.dir && (
            <div className="px-2.5 pt-1.5 pb-0.5 text-2xs font-mono font-bold uppercase tracking-wide text-[var(--color-text-dim)]">
              {g.dir}/
            </div>
          )}
          {g.files.map((f) => {
            const active = f.path === activePath;
            return (
              <button
                key={f.path}
                onClick={() => onSelect(f.path)}
                title={f.path}
                className={`w-full flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-left truncate transition-colors ${
                  active ? 'bg-[var(--color-accent)]/15 text-[var(--color-heading)] font-semibold' : 'text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface)]'
                } ${g.dir ? 'pl-4' : ''}`}
              >
                {!f.editable && <IconLock className="w-2.5 h-2.5 opacity-60 shrink-0" />}
                <span className="truncate">{basename(f.path)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
