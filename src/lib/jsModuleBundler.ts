import type { ProjectFile } from '../labs/projectTypes';

/** Turns a set of files into one CommonJS-style module registry as real, spliced-in JS source (not a
 *  stringified/escaped blob — each file's content is embedded verbatim as a function body, exactly
 *  the way real bundlers like Browserify do it, so nothing about backticks/quotes/regex literals in
 *  learner code needs escaping). The result is one plain script string, still executed by the
 *  existing, untouched `runJs()`/Worker — this module only produces its input.
 *
 *  Backend (Node-flavored) Build Portal tasks standardize on CommonJS (`require`/`module.exports`),
 *  not ESM `import` — real `import` is a syntax error inside the `new Function(code)` the JS runner
 *  uses, and CJS is exactly the idiom this kind of teaching material would use anyway. */
export function bundleCommonJs(files: ProjectFile[], entryPath: string): string {
  // Only actual JS files become modules — a task's non-code files (README.md, package.json, ...) are
  // real ProjectFiles for the editor/tree but aren't valid JS bodies and must never reach the registry.
  const registry = files
    .filter((f) => f.language === 'javascript')
    .map((f) => `__dw_files__[${JSON.stringify(f.path)}] = function (module, exports, require) {\n${f.content}\n};`)
    .join('\n\n');

  return `
var __dw_files__ = {};
var __dw_cache__ = {};

function __dw_resolve__(fromPath, req) {
  if (!req.startsWith('.')) return req;
  var dir = fromPath.split('/');
  dir.pop();
  var parts = req.split('/');
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p === '.' || p === '') continue;
    else if (p === '..') dir.pop();
    else dir.push(p);
  }
  var joined = dir.join('/');
  var candidates = [joined, joined + '.js', joined + '/index.js'];
  for (var j = 0; j < candidates.length; j++) {
    if (__dw_files__[candidates[j]]) return candidates[j];
  }
  return joined;
}

function __dw_instantiate__(path) {
  if (__dw_cache__[path]) return __dw_cache__[path].exports;
  var factory = __dw_files__[path];
  if (!factory) throw new Error("Cannot find module '" + path + "'");
  var mod = { exports: {} };
  __dw_cache__[path] = mod;
  factory(mod, mod.exports, function (req) { return __dw_require__(path, req); });
  return mod.exports;
}

function __dw_require__(fromPath, req) {
  return __dw_instantiate__(__dw_resolve__(fromPath, req));
}

${registry}

__dw_instantiate__(${JSON.stringify(entryPath)});
`;
}
