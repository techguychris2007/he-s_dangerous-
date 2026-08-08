import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import JSZip from 'jszip';
import { getSeTask } from '../labs/seTasks';
import type { ProjectTask } from '../labs/projectTypes';
import { useProgress } from '../state/progressStore';
import ProjectConsole from '../components/code/ProjectConsole';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabComments from '../components/labs/LabComments';
import DifficultyPill from '../components/common/DifficultyPill';
import { IconCheck, IconLayers, IconLock, IconDownload } from '../components/layout/icons';

const TRACK_LABEL: Record<string, string> = { foundations: 'Foundations', backend: 'Backend', fullstack: 'Full-Stack', systems: 'Systems' };

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

/** Zips the task's real file tree (every path from task.files, with whatever the learner currently
 *  has typed for any they've touched) plus a short README with the task brief — the multi-file
 *  analogue of CodeTaskPage's single-file download, so a Build Portal project is just as commit-ready
 *  as a Code Portal one. Entirely client-side: JSZip builds the archive in memory, no backend involved. */
async function downloadProjectFiles(task: ProjectTask, currentFiles: Record<string, string>) {
  const zip = new JSZip();
  for (const f of task.files) {
    zip.file(f.path, currentFiles[f.path] ?? f.content);
  }
  const readme = [
    `# ${task.title}`,
    '',
    `${task.category} · ${task.difficulty}`,
    '',
    task.prompt,
    '',
    `Solved on DarkWorld (darkworld app) — ${new Date().toISOString().slice(0, 10)}`,
    '',
  ].join('\n');
  zip.file('README.md', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(task.title)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProjectTaskPage() {
  const { taskId } = useParams();
  const progress = useProgress();
  const [task, setTask] = useState<ProjectTask | null | undefined>(undefined); // undefined = loading, null = not found
  const [hintIndex, setHintIndex] = useState(0);
  const [solutionPath, setSolutionPath] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const currentFilesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setTask(undefined);
    setHintIndex(0);
    setSolutionPath(null);
    currentFilesRef.current = {};
    if (!taskId) {
      setTask(null);
      return;
    }
    getSeTask(taskId).then((t) => {
      if (!cancelled) setTask(t ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (task === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!task) return <Navigate to="/build-portal" replace />;

  const done = progress.isCodeTaskComplete(task.id);
  const revealedHints = task.hints.slice(0, hintIndex);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-6 overflow-y-auto">
        <Link to="/build-portal" className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-3 inline-block">
          &larr; Back to Build Portal
        </Link>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <DifficultyPill difficulty={task.difficulty} />
          <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{TRACK_LABEL[task.track]}</span>
          <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)] flex items-center gap-1">
            <IconLayers className="w-3 h-3" /> {task.files.length} files
          </span>
          {done && (
            <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)] flex items-center gap-1">
              <IconCheck className="w-3 h-3" /> Solved
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-heading)] mb-1">{task.title}</h1>
        <div className="text-xs text-[var(--color-text-dim)] mb-3">{task.category}</div>
        <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-5 whitespace-pre-line">{task.prompt}</p>

        <button
          onClick={() =>
            setHintIndex((i) => {
              const next = Math.min(i + 1, task.hints.length);
              progress.recordCodeTaskHintUsed(task.id, next);
              return next;
            })
          }
          disabled={hintIndex >= task.hints.length}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] disabled:opacity-50 transition-colors"
        >
          {hintIndex === 0 ? 'Show a hint' : hintIndex >= task.hints.length ? 'No more hints' : 'Next hint'}
        </button>
        {hintIndex > 0 && (
          <div className="mt-2 space-y-1.5">
            {revealedHints.map((h, i) => (
              <div key={i} className="text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-2.5 py-2 text-[var(--color-text)] leading-relaxed">
                {h}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="text-2xs font-mono font-bold uppercase tracking-wide text-[var(--color-text-dim)] mb-1.5">Reference solution</div>
          <div className="flex flex-wrap gap-1">
            {task.solutionFiles.map((f) => (
              <button
                key={f.path}
                onClick={() => {
                  if (solutionPath !== f.path) progress.recordCodeTaskSolutionRevealed(task.id);
                  setSolutionPath((p) => (p === f.path ? null : f.path));
                }}
                aria-pressed={solutionPath === f.path}
                className={`px-2 py-1 rounded text-2xs font-mono border transition-colors ${
                  solutionPath === f.path
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                {basename(f.path)}
              </button>
            ))}
          </div>
          {solutionPath && (
            <pre className="mt-2 text-2xs font-mono bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto text-[var(--color-text)]">
              {task.solutionFiles.find((f) => f.path === solutionPath)?.content}
            </pre>
          )}
        </div>

        <button
          onClick={async () => {
            setZipping(true);
            try {
              await downloadProjectFiles(task, currentFilesRef.current);
            } finally {
              setZipping(false);
            }
          }}
          disabled={zipping}
          className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          title="Download the whole project as a .zip — ready to unpack and commit to your own repo"
        >
          <IconDownload className="w-3.5 h-3.5" /> {zipping ? 'Zipping…' : 'Download project (.zip)'}
        </button>

        {task.files.some((f) => !f.editable) && (
          <div className="mt-4 flex items-start gap-1.5 text-2xs text-[var(--color-text-dim)] leading-relaxed">
            <IconLock className="w-3 h-3 mt-0.5 shrink-0" /> Files marked with a lock are given, read-only — you only edit the rest.
          </div>
        )}

        {done && (
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
            <IconCheck className="w-4 h-4" /> All targets passing — nice work!
          </div>
        )}

        <LabComments labId={task.id} />
      </div>

      <div className="flex-1 min-h-[420px] p-4">
        <ProjectConsole
          key={task.id}
          task={task}
          onAllTestsPassed={() => progress.completeCodeTask(task.id)}
          onTestsAttempted={() => progress.recordCodeTaskAttempt(task.id)}
          onFilesChange={(files) => {
            currentFilesRef.current = files;
          }}
        />
      </div>

      <CyberLabAI
        key={task.id}
        getContext={() => ({
          kind: 'lab',
          title: task.title,
          subtitle: `${task.difficulty} · ${task.category}`,
          bodyText: task.prompt,
          currentCode: Object.entries(currentFilesRef.current)
            .map(([path, content]) => `// ${path}\n${content}`)
            .join('\n\n'),
          revealedHints,
        })}
      />
    </div>
  );
}
