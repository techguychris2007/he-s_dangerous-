import { runCpp } from './cppRunner';
import type { RunResult } from './runResult';
import type { ProjectFile } from '../labs/projectTypes';

/** JSCPP (the in-browser C++ interpreter this whole app runs on) has no linker and no concept of a
 *  translation unit beyond "one string of source" — confirmed directly against its own source
 *  (node_modules/JSCPP/lib/preprocessor.js's local-#include handling only resolves to JS-native shim
 *  modules, never other C++ files) and it ships only 8 headers total (iostream/cctype/cstring/cmath/
 *  cstdio/cstdlib/ctime/iomanip — no <string>/<vector>/<algorithm>/<fstream>/<thread>). So "multi-file
 *  C++" here is real for AUTHORING and EDITING (separate files, a file tree, local #include "x.h"
 *  syntax that behaves the way a learner expects while writing it) but not for EXECUTION: every local
 *  include gets textually inlined into one combined translation unit before JSCPP ever sees it. This
 *  is a documented property of the interpreter, not a bug — see the note surfaced in ProjectConsole
 *  for C++ tasks.
 *
 *  A second, separately-confirmed limit (found while verifying the seed tasks, not in the initial
 *  source read): JSCPP's `Declaration` visitor (node_modules/JSCPP/lib/interpreter.js) never calls
 *  `rt.newClass()` for a parsed `struct`/`class` body — that call only happens from JS-side header
 *  shims (node_modules/JSCPP/lib/includes/*.js) for the interpreter's OWN built-in types. A learner's
 *  `struct Foo { ... };` parses without a syntax error but silently fails to register a usable type
 *  ("type struct Foo is not defined" the moment it's referenced). Every Build Portal C++ task must
 *  therefore stick to primitives/arrays/pointers — no user-defined struct or class, ever.
 *
 *  A third, narrower quirk (also confirmed empirically): a size-1 array with a fully-matching brace
 *  initializer — `unsigned char x[1] = {0x01};` — raises a spurious "overflow of -1" from JSCPP's
 *  unsigned-overflow check, even though the value is in range and every other array size is fine.
 *  Declare-then-assign (`unsigned char x[1]; x[0] = 0x01;`) sidesteps it; avoid the brace form for
 *  size-1 arrays in task content.
 *
 *  A fourth set of limits, confirmed by directly probing the parser before authoring the C++
 *  Foundations batch (node_modules/JSCPP's grammar simply has no rule for these, not a runtime
 *  restriction — every one below is a parse-time failure, not a raised C++ exception):
 *  - No references at all, in any position (`int &x` param, `int& x` param, `int& b = a;` local) —
 *    every form is a syntax error. Pointers are the only by-reference mechanism available.
 *  - No `new`/`delete`/`new[]`/`delete[]`, and `<cstdlib>` does not implement `malloc`/`free` either
 *    — there is no dynamic allocation of any kind. Every C++ task works with fixed-size arrays only.
 *  - No `enum` — same broken-registration failure mode as struct/class ("type enum Foo... is not
 *    defined"). Use `const int` constants instead.
 *  - Assigning a function's own name to a function-pointer variable ("cannot cast a function to a
 *    regular pointer") doesn't work — no function pointers.
 *  - `#define NAME <float-literal>` (e.g. `#define PI 3.14159`) corrupts parsing of everything after
 *    it in the file — integer `#define`s are fine (already used in se-cpp-sys-001), but any
 *    floating-point constant must be `const double NAME = ...;` instead.
 *  - Multi-dimensional arrays (`int grid[2][3]`, including as a function parameter written
 *    `int grid[][3]`) work fine — confirmed, not a limitation.
 *
 *  A fifth set of limits, found while VERIFYING (not authoring) the Foundations batch — these are
 *  runtime crashes with a raw JS TypeError, not a C++-flavored error message, which is what makes
 *  them easy to miss until something actually exercises the path:
 *  - Comparing two pointer VARIABLES with anything other than `==` — `p != end`, `p < end`, or
 *    subtracting one pointer from another (`end - start`) — crashes with "Cannot read properties of
 *    undefined (reading '...')" (JSCPP's binary-operator dispatch has no entry for pointer/pointer
 *    `!=`, `<`, or `-`). The common `for (int* p = start; p != end; p++)` idiom does NOT work here;
 *    pair `p++` with a plain `int` loop counter instead (see se-cpp-fnd-009).
 *  - Shifting a value that's still `unsigned char`/`unsigned short` typed (e.g. `unsigned char high;
 *    ... high << 8`) can raise a spurious unsigned-overflow error, because JSCPP does not perform C++'s
 *    usual integer promotion to `int` before evaluating the shift. Cast to `(int)` first.
 *  - A nested-array brace initializer whose OUTER dimension is 1 — `int grid[1][3] = {{5,5,5}};` —
 *    crashes the same way the size-1 flat-array case does (see the third quirk above). Declare then
 *    assign element-by-element instead.
 *
 *  A sixth limit, confirmed while authoring the Systems batch: an `int` or `unsigned char` array
 *  declared WITHOUT a brace initializer does NOT reliably zero-initialize the way real C++ requires
 *  for static/global storage duration — its elements come back as `NaN`, and casting a `NaN`
 *  `unsigned char` element to `int` crashes outright. Confirmed this is type-specific: a `bool` array
 *  left uninitialized DOES correctly come back all-`false`. Every C++ task must therefore either (a)
 *  fully brace-initialize any `int`/`unsigned char` array up front, or (b) guarantee every element is
 *  written before it's ever read (as every ring-buffer/arena task in this batch does — the backing
 *  array itself is intentionally left uninitialized, but the read/write discipline never lets a stale
 *  slot be read before something has written to it first). Never rely on a bare `int`/`unsigned char
 *  arr[N];` being zero-filled. */

interface LineMapEntry {
  path: string;
  /** 1-based line within that original file. */
  line: number;
}

const LOCAL_INCLUDE_RE = /^\s*#include\s+"([^"]+)"\s*$/;

/** Splices `path`'s content into `out`, recursively inlining ITS local includes first, tracking a
 *  `combined-line -> {path, original line}` entry for every line actually emitted — including a blank
 *  placeholder for an include statement itself (keeps every downstream line's number aligned) and for
 *  a repeat include of an already-inlined file (emulates `#pragma once`, the same guard real headers use). */
function inlineLocalIncludes(
  byPath: Map<string, string>,
  entryPath: string,
): { combined: string; lineMap: LineMapEntry[] } {
  const included = new Set<string>();
  const outLines: string[] = [];
  const lineMap: LineMapEntry[] = [];

  function emit(path: string, line: number, text: string) {
    outLines.push(text);
    lineMap.push({ path, line });
  }

  function inlineFile(path: string) {
    if (included.has(path)) return; // #pragma-once-style guard against a diamond/repeat include
    included.add(path);
    const content = byPath.get(path);
    if (content === undefined) {
      emit(path, 0, `#error "Build Portal: cannot find local include \\"${path}\\""`);
      return;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(LOCAL_INCLUDE_RE);
      if (m) inlineFile(m[1]);
      else emit(path, i + 1, line);
    }
  }

  inlineFile(entryPath);

  return { combined: outLines.join('\n'), lineMap };
}

/** JSCPP's own error messages come in two shapes (verified against node_modules/JSCPP/lib/rt.js and
 *  node_modules/pegjs-util/PEGUtil.js): a parse failure reads "line N (column C): ...", a runtime
 *  exception reads "N:C <message>" at the start of the line. Both get rewritten from a combined-TU
 *  line number back to the learner's actual file and line — without this, "line 214" is actively
 *  misleading when the file they're looking at is 12 lines long. */
function remapErrors(text: string, lineMap: LineMapEntry[]): string {
  const at = (n: number) => {
    const entry = lineMap[n - 1];
    return entry ? `${entry.path}:${entry.line}` : `line ${n}`;
  };
  return text
    .replace(/line (\d+) \(column (\d+)\)/g, (_all, n: string, col: string) => `${at(Number(n))} (column ${col})`)
    .replace(/^(\d+):(\d+)(\s)/, (_all, n: string, col: string, ws: string) => `${at(Number(n))}:${col}${ws}`);
}

export async function runCppProject(files: ProjectFile[], entryPath: string, testCode?: string): Promise<RunResult> {
  const byPath = new Map(files.map((f) => [f.path, f.content]));
  // "Run tests" inlines starting from testCode itself (which pulls in solution.cpp via its own local
  // #include), never from entryPath — entryPath's file (e.g. main.cpp) also defines main(), and JSCPP
  // can't have two main()s in one translation unit. See file header for why this split exists at all.
  let startPath = entryPath;
  if (testCode !== undefined) {
    startPath = '__dw_test__.cpp';
    byPath.set(startPath, testCode);
  }
  const { combined, lineMap } = inlineLocalIncludes(byPath, startPath);
  const result = await runCpp(combined);
  return {
    ...result,
    stdout: remapErrors(result.stdout, lineMap),
    stderr: remapErrors(result.stderr, lineMap),
  };
}
