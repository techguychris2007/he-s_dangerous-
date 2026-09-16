import { useEffect, useMemo, useState } from 'react';
import type { ProjectFile } from '../../labs/projectTypes';
import { assembleDomDocument } from '../../lib/domRunner';

interface DomPreviewPaneProps {
  files: ProjectFile[];
  entryPath: string;
}

// Rebuilding the assembled document and handing the iframe a new srcDoc is NOT free — it's a full
// reload (re-parse HTML/CSS, re-run every inlined <script> from scratch), which is expensive enough
// that doing it synchronously on every single keystroke visibly stalls the main thread: typing feels
// laggy and, because the browser is busy with the reload, CSS transitions/hovers elsewhere on the
// page stutter too. Debouncing means the preview only actually rebuilds once typing pauses.
const PREVIEW_DEBOUNCE_MS = 400;

/** A live-rendered preview of a frontend task's page — the exact same assembly logic domRunner.ts uses
 *  for the real graded run, just without the test harness spliced in, so what's previewed here is what
 *  actually gets graded, not an approximation of it. Same sandbox posture as the real test run — see
 *  domRunner.ts's security note. */
export default function DomPreviewPane({ files, entryPath }: DomPreviewPaneProps) {
  const [debouncedFiles, setDebouncedFiles] = useState(files);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedFiles(files), PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [files]);

  const html = useMemo(() => assembleDomDocument(debouncedFiles, entryPath), [debouncedFiles, entryPath]);
  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-white h-full min-h-[220px]">
      <iframe title="Live preview" sandbox="allow-scripts" srcDoc={html} className="w-full h-full" />
    </div>
  );
}
