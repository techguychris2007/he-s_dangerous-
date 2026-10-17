import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-001', title: 'Pull Request Security Review Gate', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'A deterministic review service that merges static-analysis findings with changed-line metadata and produces a concise, reviewable PR report.',
  prompt: 'Implement `review_findings(changed_lines, findings)` and `render_report(review)`. Keep findings only when their file and line fall inside the changed ranges, validate required fields and severity values, normalize severities, remove duplicate tool reports using (path, line, rule), and sort deterministically by severity then path and line. The supplied finding records stand in for output from tools such as Bandit or Semgrep; do not launch scanners, inspect a real repository, or post comments anywhere. The report must state which checks ran and make clear that automated findings require human verification.',
  tags: ['code-review', 'static-analysis', 'security', 'deterministic'],
  hints: ['Represent changed lines as path-to-intervals and test inclusive boundaries.', 'Normalize data before deduplication so severity casing does not create duplicate entries.', 'Keep a finding that is malformed out of the report and include a safe validation warning rather than crashing the review.'],
  fixtures: `{"changed_lines":{"src/auth.py":[[10,18],[31,35]],"tests/test_auth.py":[[1,8]]},"findings":[{"path":"src/auth.py","line":12,"rule":"B105","severity":"HIGH","message":"Possible hard-coded credential"},{"path":"src/auth.py","line":12,"rule":"B105","severity":"high","message":"Possible hard-coded credential"},{"path":"src/auth.py","line":28,"rule":"S303","severity":"medium","message":"Use of weak hash"},{"path":"README.md","line":4,"rule":"S101","severity":"low","message":"Example assertion"}]}`,
  starter: `"""PR review aggregation over supplied, untrusted static-analysis records.

This module must remain deterministic and side-effect free. It does not connect to GitHub,
invoke scanners, execute changed source code, or make an approval decision for a human reviewer.
"""

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}

def _valid_changed_line(path, line, changed_lines):
    """Return whether the integer line belongs to a changed range for this exact path.

    Ignore path normalization tricks: this exercise consumes repository-relative paths supplied by
    the trusted fixture reader. Validate range shape and use inclusive start/end boundaries.
    """
    # TODO: reject invalid types and check each [start, end] interval safely.
    pass

def review_findings(changed_lines, findings):
    """Return {findings: [...], warnings: [...], checks: [...]} in stable order.

    Each accepted finding has path, line, rule, severity, and message. Normalize severity to lower
    case, reject unknown levels and incomplete records, suppress duplicate (path,line,rule) entries,
    and retain only findings on changed lines. Never infer that a clean report proves code is safe.
    """
    # TODO: validate the containers before iterating; malformed top-level inputs should fail clearly.
    pass

def render_report(review):
    """Render a plain-text report with summary counts, findings, warnings, and human-review note."""
    # TODO: escape or flatten newlines in tool-supplied messages to preserve report structure.
    pass

def run_demo():
    return render_report(review_findings({}, []))
`,
  solution: `"""PR review aggregation over supplied static-analysis records."""
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}

def _valid_changed_line(path, line, changed_lines):
    if not isinstance(path, str) or not isinstance(line, int) or isinstance(line, bool) or line < 1:
        return False
    ranges = changed_lines.get(path, []) if isinstance(changed_lines, dict) else []
    if not isinstance(ranges, list):
        return False
    for interval in ranges:
        if not isinstance(interval, (list, tuple)) or len(interval) != 2:
            continue
        start, end = interval
        if isinstance(start, int) and isinstance(end, int) and start <= line <= end and start > 0 and end >= start:
            return True
    return False

def review_findings(changed_lines, findings):
    if not isinstance(changed_lines, dict) or not isinstance(findings, list):
        raise ValueError("changed_lines must be an object and findings must be a list")
    accepted, warnings, seen = [], [], set()
    for index, item in enumerate(findings):
        if not isinstance(item, dict):
            warnings.append(f"Finding {index + 1}: record is not an object")
            continue
        path, line, rule, message = item.get("path"), item.get("line"), item.get("rule"), item.get("message")
        severity = item.get("severity")
        if not isinstance(path, str) or not path or not isinstance(rule, str) or not rule or not isinstance(message, str):
            warnings.append(f"Finding {index + 1}: required fields are missing or invalid")
            continue
        if not isinstance(severity, str) or severity.strip().lower() not in SEVERITY_ORDER:
            warnings.append(f"Finding {index + 1}: unknown severity")
            continue
        severity = severity.strip().lower()
        if not _valid_changed_line(path, line, changed_lines):
            continue
        key = (path, line, rule)
        if key in seen:
            continue
        seen.add(key)
        accepted.append({"path": path, "line": line, "rule": rule, "severity": severity, "message": message})
    accepted.sort(key=lambda f: (SEVERITY_ORDER[f["severity"]], f["path"], f["line"], f["rule"]))
    return {"findings": accepted, "warnings": warnings, "checks": ["supplied static-analysis findings", "changed-line filtering", "duplicate suppression"], "human_review_required": True}

def render_report(review):
    lines = ["Pull request security review", f"Findings: {len(review['findings'])}", f"Input warnings: {len(review['warnings'])}"]
    for item in review["findings"]:
        message = " ".join(item["message"].splitlines())
        lines.append(f"[{item['severity'].upper()}] {item['path']}:{item['line']} {item['rule']} — {message}")
    for warning in review["warnings"]:
        lines.append(f"[INPUT WARNING] {' '.join(warning.splitlines())}")
    lines.append("Automated output is advisory; a qualified reviewer must verify findings and disposition.")
    return "\\n".join(lines)

def run_demo():
    return render_report(review_findings({}, []))
`,
  testCode: `from project import review_findings, render_report
changed = {"src/auth.py": [[10, 18], [31, 35]]}
items = [
 {"path":"src/auth.py","line":12,"rule":"B105","severity":"HIGH","message":"Possible hard-coded credential"},
 {"path":"src/auth.py","line":12,"rule":"B105","severity":"high","message":"duplicate"},
 {"path":"src/auth.py","line":28,"rule":"S303","severity":"medium","message":"outside changed lines"},
 {"path":"docs/readme.md","line":2,"rule":"S101","severity":"low","message":"outside file"},
 {"path":"src/auth.py","line":31,"rule":"X1","severity":"critical","message":"changed boundary"},
 {"path":"src/auth.py","line":32,"rule":"X2","severity":"urgent","message":"unknown severity"},
 None,
]
r = review_findings(changed, items)
checks = [
 ("changed-line filter", len(r["findings"]) == 2),
 ("severity normalization", r["findings"][1]["severity"] == "high"),
 ("boundary and ordering", r["findings"][0]["line"] == 31),
 ("duplicate suppressed", sum(f["rule"] == "B105" for f in r["findings"]) == 1),
 ("malformed warnings", len(r["warnings"]) == 2),
 ("human review retained", r["human_review_required"] is True),
 ("report caveat", "must verify" in render_report(r)),
]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
