import { useEffect, useState } from 'react';
import type { ProjectFile } from '../../labs/projectTypes';
import { buildReactPage } from '../../lib/tsRunner';
import { REACT_SANDBOX } from '../../lib/reactHarness';

interface ReactPreviewPaneProps {
  files: ProjectFile[];
  entryPath: string;
}

/** Compiling is cheap once the compiler is warm, but rebuilding the frame reloads React; wait for a
 *  pause in typing. */
const PREVIEW_DEBOUNCE_MS = 700;

type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; html: string; typeErrors: number }
  | { status: 'error'; message: string };

/** Live preview of a React/TypeScript project: the entry module (usually src/main.tsx, wired to an
 *  in-memory fake API) compiled exactly as the grader compiles it and rendered in the same
 *  opaque-origin sandbox as the tests (see REACT_SANDBOX and domRunner.ts's security note). */
export default function ReactPreviewPane({ files, entryPath }: ReactPreviewPaneProps) {
  const [state, setState] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      buildReactPage(files, entryPath, undefined, `preview-${Date.now()}`)
        .then(({ html, prepared }) => {
          if (cancelled) return;
          const typeErrors = prepared.prelude.filter((l) => /error TS\d+/.test(l)).length;
          setState({ status: 'ready', html, typeErrors });
        })
        .catch((error: unknown) => {
          if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
        });
    }, PREVIEW_DEBOUNCE_MS);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, [files, entryPath]);

  return (
    <div className="flex h-full min-h-[260px] flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      {state.status === 'ready' && state.typeErrors > 0 && (
        <p className="m-0 border-b border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-900" role="status">
          {state.typeErrors} type error{state.typeErrors === 1 ? '' : 's'} — the preview still renders, but Run tests will fail the type check. Press Run to see them.
        </p>
      )}
      {state.status === 'ready' ? (
        <iframe title="Live preview" sandbox={REACT_SANDBOX} srcDoc={state.html} className="h-full w-full flex-1" />
      ) : state.status === 'error' ? (
        <p className="m-3 text-sm text-red-700">Preview unavailable: {state.message}</p>
      ) : (
        <p className="m-3 text-sm text-slate-500">Compiling preview&hellip; (the TypeScript compiler downloads on first use)</p>
      )}
    </div>
  );
}
