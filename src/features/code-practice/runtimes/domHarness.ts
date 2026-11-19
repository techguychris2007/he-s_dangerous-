/** The test-assertion script injected into a frontend project's assembled document (see domRunner.ts).
 *  Runs INSIDE the sandboxed iframe — with `sandbox="allow-scripts"` and no `allow-same-origin`, the
 *  frame is opaque-origin, so this is the only place DOM assertions against the learner's rendered page
 *  can actually happen; there is no way for the parent to reach in and inspect it. Everything here
 *  (the `check*` family, `fetch`/`localStorage` shims, event helpers) exists so a testCode string can
 *  read like a normal assertion script rather than fighting the sandbox. */

export interface DomHarnessConfig {
  /** matched against on the parent side so a stale/duplicate message from a previous run can't be
   *  mistaken for the current one. */
  nonce: string;
  /** extra time after the document reaches 'complete' before assertions run, for init code that
   *  schedules a timer/microtask on load. */
  settleMs: number;
  /** stubs window.fetch(url) — the frontend half of a full-stack task can't reach its companion
   *  backend target over a real socket, so this stands in for the contract between them. */
  fetchFixtures: Record<string, unknown>;
  /** raw JS, spliced in verbatim (same "real code, not a stringified blob" approach as
   *  jsModuleBundler.ts) — calls check()/checkText()/click()/etc., which are in scope as closures. */
  testCode: string;
}

export function buildDomHarnessScript(config: DomHarnessConfig): string {
  return `
(function () {
  var __dw_nonce__ = ${JSON.stringify(config.nonce)};
  var __dw_stdout__ = [];
  var __dw_passed__ = 0;
  var __dw_total__ = 0;
  var __dw_crashed__ = null;

  var __dw_origConsole__ = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  ['log', 'error', 'warn', 'info'].forEach(function (level) {
    console[level] = function () {
      var parts = Array.prototype.slice.call(arguments).map(function (a) {
        try { return typeof a === 'string' ? a : JSON.stringify(a); } catch (e) { return String(a); }
      });
      __dw_stdout__.push(parts.join(' '));
      __dw_origConsole__[level].apply(console, arguments);
    };
  });

  // A stray alert()/confirm()/prompt() must never be able to block an automated run.
  window.alert = function (msg) { __dw_stdout__.push('[alert] ' + msg); };
  window.confirm = function () { return true; };
  window.prompt = function () { return null; };

  // Opaque-origin frames have no real localStorage at all — an in-memory shim so "persist to
  // localStorage" tasks still work, scoped to just this one run.
  var __dw_lsStore__ = {};
  window.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(__dw_lsStore__, k) ? __dw_lsStore__[k] : null; },
    setItem: function (k, v) { __dw_lsStore__[k] = String(v); },
    removeItem: function (k) { delete __dw_lsStore__[k]; },
    clear: function () { __dw_lsStore__ = {}; },
    key: function (i) { return Object.keys(__dw_lsStore__)[i] || null; },
  };

  // Stands in for the full-stack task's companion backend target, which this frame has no real way
  // to reach (opaque origin, no network at all under this CSP).
  var __dw_fixtures__ = ${JSON.stringify(config.fetchFixtures ?? {})};
  window.fetch = function (url) {
    var has = Object.prototype.hasOwnProperty.call(__dw_fixtures__, url);
    var body = has ? __dw_fixtures__[url] : null;
    if (!has) {
      return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve(null); }, text: function () { return Promise.resolve(''); } });
    }
    return Promise.resolve({
      ok: true, status: 200,
      json: function () { return Promise.resolve(body); },
      text: function () { return Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)); },
    });
  };

  window.onerror = function (message, source, lineno) {
    __dw_crashed__ = message + (lineno ? ' (line ' + lineno + ')' : '');
    return true;
  };
  window.addEventListener('unhandledrejection', function (e) {
    __dw_crashed__ = 'Unhandled promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason);
  });

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function check(name, actual, expected) {
    __dw_total__++;
    var ok = actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) __dw_passed__++;
    __dw_stdout__.push('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : (': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected))));
  }
  function checkExists(name, sel) { check(name, !!document.querySelector(sel), true); }
  function checkCount(name, sel, expected) { check(name, document.querySelectorAll(sel).length, expected); }
  function checkText(name, sel, expected) {
    var el = document.querySelector(sel);
    check(name, el ? el.textContent.trim() : undefined, expected);
  }
  function checkAttr(name, sel, attr, expected) {
    var el = document.querySelector(sel);
    check(name, el ? el.getAttribute(attr) : undefined, expected);
  }
  function checkStyle(name, sel, prop, expected) {
    var el = document.querySelector(sel);
    check(name, el ? getComputedStyle(el)[prop] : undefined, expected);
  }

  function dispatch(sel, type) {
    var el = document.querySelector(sel);
    if (!el) throw new Error((type === 'click' ? 'click' : 'fire') + ': no element matches ' + sel);
    el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    return el;
  }
  async function click(sel) { dispatch(sel, 'click'); await tick(); }
  async function type(sel, text) {
    var el = document.querySelector(sel);
    if (!el) throw new Error('type: no element matches ' + sel);
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
  }
  async function fire(sel, type_) { dispatch(sel, type_); await tick(); }

  function finish() {
    __dw_stdout__.push('__RESULT__ ' + __dw_passed__ + '/' + __dw_total__);
    try {
      parent.postMessage({
        __dw: 'result', nonce: __dw_nonce__, stdout: __dw_stdout__.join('\\n'),
        ok: !__dw_crashed__, passed: __dw_passed__, total: __dw_total__, crash: __dw_crashed__,
      }, '*');
    } catch (e) { /* parent frame is gone — nothing left to report to */ }
  }

  function whenReady() {
    return new Promise(function (resolve) {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', function () { resolve(); });
    });
  }

  whenReady()
    .then(function () { return new Promise(function (r) { setTimeout(r, ${config.settleMs}); }); })
    .then(async function () {
      if (__dw_crashed__) { finish(); return; }
      try {
        ${config.testCode}
      } catch (e) {
        __dw_crashed__ = e && e.message ? e.message : String(e);
        __dw_stdout__.push('[FAIL] test harness crashed: ' + __dw_crashed__);
      }
      finish();
    });
})();
`;
}
