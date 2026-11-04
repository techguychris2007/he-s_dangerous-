/** Assembles the self-contained document a React/TypeScript target runs in: the React kit
 *  (public/ts-runtime/react-kit.js), the learner's compiled modules as one CommonJS bundle, their
 *  style sheets, and a small harness that runs the registered tests and reports the result.
 *
 *  Shared by reactRunner.ts (sandboxed srcdoc iframe, result via postMessage) and
 *  scripts/check-ts-tasks.cjs (headless Chrome --dump-dom, result read from #__dw_result). The
 *  document never fetches anything, so it works in an opaque-origin frame under a strict CSP. */

/** form-action 'none': the frames carry `allow-forms` (without it Chrome blocks form submission
 *  before the submit event fires, so React's onSubmit would never run), and this keeps any actual
 *  submission from navigating anywhere. */
export const REACT_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none';">`;

/** Sandbox for every React frame: scripts and form submit events, never allow-same-origin (the frame
 *  stays opaque-origin, unable to reach this app's storage or session). */
export const REACT_SANDBOX = 'allow-scripts allow-forms';

export interface ReactDocumentOptions {
  kitScript: string;
  /** output of bundleCommonJs — instantiates the entry module when run */
  bundle: string;
  styles: string[];
  mode: 'test' | 'preview';
  nonce: string;
  /** grader lines printed before the tests (the type-check verdict) and how many of them passed */
  preludeLines: string[];
  preludePassed: number;
  preludeTotal: number;
}

/** `</script` inside inlined code would close the tag early; this keeps every inlined script intact. */
function safeScript(code: string): string {
  return code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

export function buildReactDocument(o: ReactDocumentOptions): string {
  const config = JSON.stringify({ nonce: o.nonce, mode: o.mode, prelude: o.preludeLines, preludePassed: o.preludePassed, preludeTotal: o.preludeTotal });
  const harness = `
(function () {
  var cfg = ${config};
  var out = [];
  var crash = null;
  var original = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  function show(a) {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.name + ': ' + a.message;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      // printf-style substitution, as browser consoles do for React's "%s" warnings
      if (typeof args[0] === 'string' && /%[sdoO]/.test(args[0])) {
        var rest = args.slice(1);
        args = [args[0].replace(/%[sdoO]/g, function () { return rest.length ? show(rest.shift()) : ''; })].concat(rest);
      }
      var text = args.map(show).join(' ').replace(/\\s+$/, '');
      if (text.indexOf('React DevTools') !== -1) return;
      // React's development warnings are long and repeat per render; keep only their first line.
      if (level === 'error' && /^(Warning: |Each child in a list|An update to|React does not recognize|Invalid DOM property)/.test(text)) text = '[react warning] ' + text.replace(/\\s+/g, ' ').slice(0, 300);
      out.push(text);
      original[level].apply(console, arguments);
    };
  });
  window.alert = function (m) { out.push('[alert] ' + m); };
  window.confirm = function () { return true; };
  window.prompt = function () { return null; };
  var store = {};
  try {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; },
      clear: function () { store = {}; },
      key: function (i) { return Object.keys(store)[i] || null; },
      get length() { return Object.keys(store).length; }
    } });
  } catch (e) { /* keep the browser's own */ }
  window.fetch = function (url) { return Promise.reject(new TypeError('Network access is disabled here — inject a fetch function or API client into your code so tests can provide a fake. (' + url + ')')); };
  window.addEventListener('error', function (e) { if (!crash) crash = (e.error && e.error.message) || e.message; });
  window.addEventListener('unhandledrejection', function (e) { out.push('[unhandled rejection] ' + (e.reason && e.reason.message ? e.reason.message : e.reason)); });

  function emit(stdout, ok) {
    var pre = document.createElement('pre');
    pre.id = '__dw_result';
    pre.hidden = true;
    pre.textContent = stdout;
    document.documentElement.appendChild(pre);
    try { parent.postMessage({ __dw: 'result', nonce: cfg.nonce, stdout: stdout, ok: ok, crash: crash }, '*'); } catch (e) { /* no parent */ }
  }

  window.__dw_load = function (run) {
    // The kit enables act() checking for tests; a live preview renders like a normal app.
    if (cfg.mode === 'preview') window.IS_REACT_ACT_ENVIRONMENT = false;
    try { run(); } catch (e) { crash = (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : String(e)); }
  };

  window.__dw_finish = function () {
    if (cfg.mode === 'preview') {
      setTimeout(function () { emit(out.join('\\n') + (crash ? '\\n' + crash : ''), !crash); }, 400);
      return;
    }
    var lines = cfg.prelude.slice();
    var passed = cfg.preludePassed, total = cfg.preludeTotal;
    function report(line) { out.push(line); }
    if (crash) {
      lines = lines.concat(out);
      lines.push('[FAIL] Test file failed to load: ' + crash);
      lines.push('__RESULT__ ' + passed + '/' + (total + 1));
      emit(lines.join('\\n'), true);
      return;
    }
    window.__dw_runTests(report).then(function (r) {
      lines = lines.concat(out);
      if (r.total === 0) { lines.push('[FAIL] No tests ran'); total += 1; }
      lines.push('__RESULT__ ' + (passed + r.passed) + '/' + (total + r.total));
      emit(lines.join('\\n'), true);
    }, function (e) {
      lines = lines.concat(out);
      lines.push('[FAIL] Test run crashed: ' + (e && e.message ? e.message : e));
      lines.push('__RESULT__ ' + passed + '/' + (total + 1));
      emit(lines.join('\\n'), true);
    });
  };
})();`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${REACT_CSP}
<title>App</title>
${o.styles.map((css) => `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`).join('\n')}
<script>${safeScript(harness)}</script>
<script>${safeScript(o.kitScript)}</script>
</head>
<body>
<div id="root"></div>
<script>window.__dw_load(function () {
${safeScript(o.bundle)}
});</script>
<script>window.__dw_finish();</script>
</body>
</html>`;
}
