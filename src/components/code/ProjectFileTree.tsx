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
    <nav className="dw-ide__tree" aria-label="Project files">
      <div className="dw-ide__tree-head">Explorer</div>
      {groups.map((g) => (
        <div key={g.dir || '.'}>
          {g.dir && <div className="dw-ide__tree-dir">{g.dir}/</div>}
          {g.files.map((f) => (
            <button
              key={f.path}
              type="button"
              onClick={() => onSelect(f.path)}
              title={f.path}
              aria-current={f.path === activePath}
              className={`dw-ide__tree-file${g.dir ? ' is-nested' : ''}`}
            >
              <span className="dw-ide__ext" data-ext={f.path.split('.').pop()} aria-hidden="true" />
              <span className="truncate">{basename(f.path)}</span>
              {!f.editable && <IconLock className="ml-auto h-2.5 w-2.5 shrink-0" />}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
