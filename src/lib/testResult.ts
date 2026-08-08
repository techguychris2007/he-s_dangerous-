// Anchored to a full line (^...$) and checked only against the LAST non-empty line of stdout — the
// harness's result line is always the final thing testCode prints (it runs after the learner's own
// code). Matching anywhere in stdout would let a learner "pass" by printing a fake matching line of
// their own before their real code runs; requiring it to be the trailing line means a real result
// from the harness always wins even if a fake one was printed earlier.
//
// Shared by every test-result-producing surface (the original single-file CodeConsole and the new
// multi-file ProjectConsole/domHarness) — one parsing rule, so a passing/failing task means the same
// thing everywhere.
export const RESULT_RE = /^__RESULT__ (\d+)\/(\d+)$/;

export function lastNonEmptyLine(text: string): string {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) return line;
  }
  return '';
}

export interface TestSummary {
  passed: number;
  total: number;
}

/** Parses a run's stdout for the trailing __RESULT__ N/M line, or null if the output doesn't end with
 *  one (a crash before the harness could print it, or tests genuinely never ran). */
export function parseTestResult(stdout: string): TestSummary | null {
  const m = lastNonEmptyLine(stdout).match(RESULT_RE);
  if (!m) return null;
  return { passed: Number(m[1]), total: Number(m[2]) };
}
