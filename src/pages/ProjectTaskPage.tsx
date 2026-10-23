import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import JSZip from 'jszip';
import { getSeTask } from '../labs/seTasks';
import type { ProjectTask } from '../labs/projectTypes';
import { useProgress } from '../state/progressStore';
import ProjectConsole from '../components/code/ProjectConsole';
import CyberLabAI from '../components/labs/CyberLabAI';
import LabComments from '../components/labs/LabComments';
import CharacterSays from '../components/characters/CharacterSays';
import { IconCheck, IconLayers, IconLock, IconDownload } from '../components/layout/icons';
import { codeTaskXp } from '../data/xp';
import '../components/code/code-workspace.css';

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
  const [tab, setTab] = useState<'brief' | 'hints' | 'solution' | 'discuss'>('brief');
  const currentFilesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setTask(undefined);
    setHintIndex(0);
    setSolutionPath(null);
    setTab('brief');
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
  const hintsUsed = Math.max(hintIndex, progress.codeTaskHintsUsed[task.id] ?? 0);
  const revealed = solutionPath !== null || !!progress.codeTaskSolutionRevealed[task.id];
  const xp = codeTaskXp(hintsUsed, revealed);
  const attempted = (progress.codeTaskAttempts[task.id] ?? 0) > 0;
  const editable = task.files.filter((f) => f.editable);
  const goals = [
    { label: 'Read the brief and explore the given files', done: true },
    { label: `Edit ${editable.map((f) => basename(f.path)).join(', ') || 'the project'}`, done: attempted || done },
    { label: `Pass every check on ${task.targets.length === 1 ? 'the target' : `all ${task.targets.length} targets`}`, done },
    { label: 'Ship it without revealing the solution', done: done && !revealed },
  ];
  const revealHint = () => setHintIndex((i) => {
    const next = Math.min(i + 1, task.hints.length);
    progress.recordCodeTaskHintUsed(task.id, next);
    return next;
  });
  const download = async () => {
    setZipping(true);
    try {
      await downloadProjectFiles(task, currentFilesRef.current);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="dw-codetask">
      <header className="dw-codetask__head">
        <ol className="dw-codetask__crumbs">
          <li><Link to="/build-portal">Build Portal</Link></li>
          <li>{TRACK_LABEL[task.track]}</li>
          <li>{task.category}</li>
          <li aria-current="page">{task.title}</li>
        </ol>
        <div className="dw-codetask__title">
          <h1>{task.title}</h1>
          <div className="dw-codetask__meta">
            <span className="dw-codetask__chip" data-level={task.difficulty}>{task.difficulty}</span>
            <span className="dw-codetask__chip">{TRACK_LABEL[task.track]}</span>
            <span className="dw-codetask__chip"><IconLayers className="h-3 w-3" />{task.files.length} files</span>
            <span className="dw-codetask__chip dw-codetask__chip--xp" title="Each hint lowers the reward; revealing the solution leaves a small amount">+{xp} XP</span>
            {done && <span className="dw-codetask__chip dw-codetask__chip--solved"><IconCheck className="h-3 w-3" />Shipped</span>}
          </div>
        </div>
      </header>

      <div className="dw-codetask__body">
        <aside className="dw-codetask__brief">
          <div className="dw-codetask__tabs" role="tablist" aria-label="Project information">
            {([['brief', 'Brief'], ['hints', 'Hints'], ['solution', 'Solution'], ['discuss', 'Discussion']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}{id === 'hints' && <small>{hintIndex}/{task.hints.length}</small>}
              </button>
            ))}
          </div>
          <div className="dw-codetask__pane">
            {tab === 'brief' && (
              <>
                <section className="dw-codetask__task">
                  <header><span>Project</span>Your mission</header>
                  <p>{task.prompt}</p>
                </section>
                <ul className="dw-codetask__goals" aria-label="Objectives">
                  {goals.map((g, i) => <li key={g.label} data-done={g.done}><i>{g.done ? '✓' : i + 1}</i>{g.label}</li>)}
                </ul>
                <div className="dw-codetask__files">
                  <b>Project files</b>
                  <ul>
                    {task.files.map((f) => (
                      <li key={f.path} data-editable={f.editable}>
                        <code>{f.path}</code>
                        <span>{f.editable ? 'you edit' : <><IconLock className="h-3 w-3" />given</>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <CharacterSays id="cipher" size={44} className="dw-codetask__guide">
                  {done ? 'Shipped. Download the project and commit it to your own repo.' : 'Locked files are the framework — read them, then make the editable files pass every check.'}
                </CharacterSays>
                <button type="button" className="dw-codetask__action" onClick={download} disabled={zipping} title="Download the whole project as a .zip — ready to unpack and commit to your own repo">
                  <IconDownload className="mr-1.5 inline h-3.5 w-3.5" />{zipping ? 'Zipping…' : 'Download project (.zip)'}
                </button>
              </>
            )}
            {tab === 'hints' && (
              <>
                <p className="dw-codetask__cost">Hints unlock one at a time. Each one lowers this project's XP reward a little.</p>
                {revealedHints.map((h, i) => <div key={i} className="dw-codetask__hint"><b>Hint {i + 1}</b>{h}</div>)}
                <button type="button" className="dw-codetask__action" onClick={revealHint} disabled={hintIndex >= task.hints.length}>
                  {hintIndex === 0 ? 'Reveal the first hint' : hintIndex >= task.hints.length ? 'No more hints' : 'Reveal the next hint'}
                </button>
              </>
            )}
            {tab === 'solution' && (
              <>
                <p className="dw-codetask__cost">Open a reference file after an honest attempt. Revealing any file reduces the reward to the minimum.</p>
                <div className="dw-codetask__solfiles">
                  {task.solutionFiles.map((f) => (
                    <button
                      key={f.path}
                      type="button"
                      aria-pressed={solutionPath === f.path}
                      onClick={() => {
                        if (solutionPath !== f.path) progress.recordCodeTaskSolutionRevealed(task.id);
                        setSolutionPath((p) => (p === f.path ? null : f.path));
                      }}
                    >
                      {basename(f.path)}
                    </button>
                  ))}
                </div>
                {solutionPath && <pre className="dw-codetask__solution">{task.solutionFiles.find((f) => f.path === solutionPath)?.content}</pre>}
              </>
            )}
            {tab === 'discuss' && <LabComments labId={task.id} />}
          </div>
        </aside>

        <main className="dw-codetask__ide">
          <ProjectConsole
            key={task.id}
            task={task}
            onAllTestsPassed={() => progress.completeCodeTask(task.id)}
            onTestsAttempted={() => progress.recordCodeTaskAttempt(task.id)}
            onFilesChange={(files) => {
              currentFilesRef.current = files;
            }}
          />
        </main>

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
    </div>
  );
}
