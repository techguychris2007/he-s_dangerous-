import { useMemo } from 'react';
import type { ProjectFile } from '../../labs/projectTypes';
import { assembleDomDocument } from '../../lib/domRunner';

interface DomPreviewPaneProps {
  files: ProjectFile[];
  entryPath: string;
}

/** A live-rendered preview of a frontend task's page — the exact same assembly logic domRunner.ts uses
 *  for the real graded run, just without the test harness spliced in, so what's previewed here is what
 *  actually gets graded, not an approximation of it. Re-renders on every keystroke (files updates via
 *  MonacoProjectEditor's onFileChange), which comes essentially free once the assembler exists. Same
 *  sandbox posture as the real test run — see domRunner.ts's security note. */
export default function DomPreviewPane({ files, entryPath }: DomPreviewPaneProps) {
  const html = useMemo(() => assembleDomDocument(files, entryPath), [files, entryPath]);
  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-white h-full min-h-[220px]">
      <iframe title="Live preview" sandbox="allow-scripts" srcDoc={html} className="w-full h-full" />
    </div>
  );
}
