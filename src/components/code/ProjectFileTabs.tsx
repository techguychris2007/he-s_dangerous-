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
    <div className="dw-ide__tabs dw-ide__tabs--scroll" role="tablist" aria-label="Open files">
      {files.map((f) => {
        const active = f.path === activePath;
        return (
          <button
            key={f.path}
            type="button"
            role="tab"
            onClick={() => onSelect(f.path)}
            title={f.editable ? f.path : `${f.path} (read-only)`}
            aria-selected={active}
            className="dw-ide__tab dw-ide__tab--file"
          >
            {!f.editable && <IconLock className="h-3 w-3 shrink-0" />}
            {basename(f.path)}
            {dirtyPaths.has(f.path) && <span className="dw-ide__dirty" aria-label="unsaved changes" />}
          </button>
        );
      })}
    </div>
  );
}
