import type { RunResult } from './runResult';
import type { ProjectFile, RunTarget } from '../labs/projectTypes';
import { buildDomHarnessScript } from './domHarness';

const HARD_TIMEOUT_MS = 8000; // matches cppRunner's hard-timeout backstop pattern

/** A tight inline CSP on the assembled document itself, independent of the iframe sandbox — belt and
 *  suspenders. `style-src`/`script-src 'unsafe-inline'` are required since everything here is inlined
 *  rather than fetched (an opaque-origin srcdoc frame can't fetch relative URLs at all), and there is
 *  no legitimate reason for a Build Portal task's page to load anything external. */
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none';">`;

function byPath(files: ProjectFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.path, f.content]));
}

/** Resolves an href/src that's relative to `fromPath` (the HTML file referencing it) against the
 *  project's own file paths — e.g. `frontend/index.html` referencing plain `"app.js"` must resolve to
 *  the `frontend/app.js` ProjectFile, not a literal top-level `"app.js"` key. Same directory-relative
 *  join logic as jsModuleBundler.ts's `__dw_resolve__`, minus the module-extension guessing. */
function resolveAssetPath(fromPath: string, ref: string): string {
  if (/^([a-z]+:)?\/\//i.test(ref)) return ref; // absolute/external — left alone, CSP blocks it anyway
  const dir = fromPath.split('/');
  dir.pop();
  for (const part of ref.replace(/^\//, '').split('/')) {
    if (part === '' || part === '.') continue;
    else if (part === '..') dir.pop();
    else dir.push(part);
  }
  return dir.join('/');
}

/** Inlines <link rel="stylesheet" href="..."> and <script src="..."> tags against the project's own
 *  files — mandatory, not a nicety: an opaque-origin `srcdoc` iframe has no base URL to resolve a
 *  relative fetch against at all, so anything left as an external reference simply never loads. */
function inlineAssets(html: string, entryHtmlPath: string, files: Map<string, string>): string {
  let out = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (whole, href: string) => {
    const css = files.get(resolveAssetPath(entryHtmlPath, href));
    return css !== undefined ? `<style>\n${css}\n</style>` : whole;
  });
  out = out.replace(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi, (whole, src: string) => {
    const js = files.get(resolveAssetPath(entryHtmlPath, src));
    return js !== undefined ? `<script>\n${js}\n</script>` : whole;
  });
  return out;
}

/** Builds the full document a frontend task's files assemble into. Shared by the real sandboxed test
 *  run below AND by DomPreviewPane (called with `harnessScript` omitted) — same assembly logic for
 *  both, so what a learner previews is exactly what actually gets graded, not an approximation of it. */
export function assembleDomDocument(files: ProjectFile[], entryHtmlPath: string, harnessScript?: string): string {
  const map = byPath(files);
  const rawHtml = map.get(entryHtmlPath) ?? '<!doctype html><html><head></head><body></body></html>';
  const inlined = inlineAssets(rawHtml, entryHtmlPath, map);
  // The harness must run BEFORE any of the task's own inlined scripts — it stubs window.fetch/
  // localStorage/console that those scripts may call synchronously on load. Injecting into <head>
  // (not appended at the end of <body>, after the task's own body scripts already ran) guarantees
  // that ordering, since <head> always parses/executes before <body>.
  const headExtras = harnessScript ? `${CSP_META}\n<script>\n${harnessScript}\n</script>` : CSP_META;
  return /<head[^>]*>/i.test(inlined)
    ? inlined.replace(/<head[^>]*>/i, (m) => `${m}\n${headExtras}`)
    : `${headExtras}\n${inlined}`;
}

/** Runs a frontend project's real, rendered DOM against `target.testCode` inside a sandboxed iframe
 *  and resolves with the same RunResult shape every other runner produces.
 *
 *  Security posture (do not change without re-reading this): the iframe is
 *  `sandbox="allow-scripts"` and MUST NEVER also carry `allow-same-origin`. With both flags together
 *  the frame would share the parent's origin and could read `parent.document`, cookies, and
 *  `localStorage` — including this app's Supabase session token. `allow-scripts` alone makes the frame
 *  opaque-origin instead: no parent DOM access, no real cookies/localStorage/fetch (the harness shims
 *  the last two). The cost is that every assertion has to run INSIDE the frame and report out via
 *  postMessage, which is exactly what domHarness.ts does. `event.origin` is the literal string "null"
 *  for an opaque origin, so it's useless as a check — the nonce plus `event.source === iframe.
 *  contentWindow` identity check below is what actually guards against a spoofed/stale message. */
export function runDomProject(files: ProjectFile[], target: RunTarget): Promise<RunResult> {
  return new Promise((resolve) => {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const harness = buildDomHarnessScript({
      nonce,
      settleMs: target.settleMs ?? 50,
      fetchFixtures: target.fetchFixtures ?? {},
      testCode: target.testCode,
    });
    const html = assembleDomDocument(files, target.entry, harness);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts'); // see the security note above — never add allow-same-origin
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.srcdoc = html;

    let settled = false;
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ stdout: '', stderr: 'Timed out (possible infinite loop or a script that never finished loading).', ok: false });
    }, HARD_TIMEOUT_MS);

    function onMessage(e: MessageEvent) {
      const data = e.data as { __dw?: string; nonce?: string; stdout?: string; ok?: boolean; crash?: string | null } | null;
      if (!data || data.__dw !== 'result' || data.nonce !== nonce) return;
      if (e.source !== iframe.contentWindow) return; // origin is "null" here and useless as a check; identity is what matters
      const stdout = data.stdout ?? '';
      finish({ stdout, stderr: data.crash ? String(data.crash) : '', ok: !!data.ok });
    }
    window.addEventListener('message', onMessage);

    document.body.appendChild(iframe);
  });
}
