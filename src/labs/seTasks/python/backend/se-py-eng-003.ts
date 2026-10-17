import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-003', title: 'CI Failure Evidence Diagnoser', difficulty: 'Medium', category: 'Software Engineering',
  summary: 'Turn noisy build logs into evidence-linked diagnostic candidates while leaving pipeline edits and reruns to an engineer.',
  prompt: 'Implement `diagnose(log_lines)` to match known failure signatures (missing dependency, assertion failure, formatting check, permission denied, network timeout) and return unique findings with category, evidence line number, confidence, and a conservative next step. Preserve the original evidence text safely, handle empty/noisy logs, avoid guessing when the signature is unknown, and sort by first occurrence. This is a diagnostic assistant: it must never edit CI files or trigger another build.',
  tags: ['ci-cd', 'diagnostics', 'observability', 'human-review'],
  hints: ['Use a table of patterns and actions instead of a long fragile if/elif chain.', 'Keep line numbers one-based and store the exact matching line as evidence.', 'A low-confidence or unknown signature should produce an explicit unknown result, not an invented root cause.'],
  fixtures: `{"logs":["Installing dependencies","ModuleNotFoundError: No module named 'requests'","pytest: AssertionError in test_parser","ruff check failed: F401 unused import","retrying connection after timeout"]}`,
  starter: `"""CI log diagnostics from offline text fixtures. This module never edits or reruns a pipeline."""

SIGNATURES = [
    # (category, token, confidence, safe next step)
    ("dependency", "No module named", 0.92, "Check the declared dependency and lock file."),
    ("test", "AssertionError", 0.90, "Inspect the failing assertion and reproduce it locally."),
    ("format", "ruff check failed", 0.95, "Review the reported lint rule and fix source intentionally."),
    ("permission", "Permission denied", 0.82, "Check the job identity and least-privilege file permissions."),
    ("network", "timeout", 0.70, "Check dependency availability; retry only if the operation is safe."),
]

def diagnose(log_lines):
    """Return an ordered list of distinct evidence-backed diagnostic records."""
    # TODO: validate iterable input, match case-insensitively, retain one-based line and evidence.
    # Do not infer or execute a fix. Avoid duplicate category reports for repeated stack frames.
    pass

def summarize(findings):
    """Render findings and an explicit unknown/no-match state as readable text."""
    # TODO: preserve confidence and evidence, flatten unsafe embedded newlines.
    pass

def run_demo():
    return summarize(diagnose([]))
`,
  solution: `"""CI log diagnostics from offline text fixtures."""
SIGNATURES = [
    ("dependency", "no module named", 0.92, "Check the declared dependency and lock file."),
    ("test", "assertionerror", 0.90, "Inspect the failing assertion and reproduce it locally."),
    ("format", "ruff check failed", 0.95, "Review the reported lint rule and fix source intentionally."),
    ("permission", "permission denied", 0.82, "Check the job identity and least-privilege file permissions."),
    ("network", "timeout", 0.70, "Check dependency availability; retry only if the operation is safe."),
]

def diagnose(log_lines):
    if isinstance(log_lines, (str, bytes)):
        raise ValueError("log_lines must be a sequence of lines")
    try:
        lines = list(log_lines)
    except TypeError as error:
        raise ValueError("log_lines must be iterable") from error
    findings, seen = [], set()
    for number, raw in enumerate(lines, start=1):
        if not isinstance(raw, str):
            continue
        folded = raw.casefold()
        for category, token, confidence, next_step in SIGNATURES:
            if token in folded and category not in seen:
                seen.add(category)
                findings.append({"category": category, "line": number, "evidence": raw.strip(), "confidence": confidence, "next_step": next_step})
                break
    return findings or [{"category": "unknown", "line": None, "evidence": "", "confidence": 0.0, "next_step": "Collect a minimal reproduction and inspect surrounding logs; no known signature matched."}]

def summarize(findings):
    rows = ["CI diagnostic candidates (human review required)"]
    for item in findings:
        evidence = " ".join(item["evidence"].splitlines())
        rows.append(f"{item['category']} at line {item['line']}: {evidence} (confidence {item['confidence']:.2f})")
        rows.append(f"  Next: {item['next_step']}")
    rows.append("No pipeline change or rerun was performed.")
    return "\\n".join(rows)

def run_demo():
    return summarize(diagnose([]))
`,
  testCode: `from project import diagnose, summarize
logs = ["begin", "ModuleNotFoundError: No module named 'x'", "AssertionError in test_a", "AssertionError in test_b", "ruff check failed: F401"]
r = diagnose(logs)
checks = [("one report per category", [x["category"] for x in r] == ["dependency", "test", "format"]), ("one based evidence", r[0]["line"] == 2), ("evidence preserved", "ModuleNotFoundError" in r[0]["evidence"]), ("conservative advice", "Check the declared dependency" in r[0]["next_step"]), ("summary requires review", "human review" in summarize(r)), ("no auto mutation", "No pipeline change" in summarize(r)), ("no match explicit", diagnose(["unrecognized"])[0]["category"] == "unknown")]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
