import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-004', title: 'Conventional Commit Release Notes', difficulty: 'Medium', category: 'Software Engineering',
  summary: 'Transform a fixture list of commit subjects into deterministic, versioned release notes that reviewers can edit before publishing.',
  prompt: 'Implement `build_notes(version, commits)`. Recognize conventional commit prefixes `feat`, `fix`, `docs`, `refactor`, and `perf`; extract an optional scope and subject; mark `!` or `BREAKING CHANGE:` records as breaking; ignore merge commits and unrecognized housekeeping lines; escape newlines; deduplicate identical records; and order sections and items deterministically. Return structured data and a Markdown renderer. This task reads supplied commit records only and does not contact issue trackers or publish a release.',
  tags: ['git', 'release-engineering', 'markdown', 'deterministic'],
  hints: ['Parse the type/scope prefix separately from the subject and breaking marker.', 'Treat breaking changes as a prominent section even when the commit type is fix or feat.', 'Sort stable records by scope and subject after deduplication.'],
  fixtures: `{"version":"2.4.0","commits":["feat(api): add pagination","fix: handle empty response","feat(auth)!: require token rotation","Merge pull request #18","chore: update lock file"]}`,
  starter: `"""Release-note builder over supplied commit subjects; never publishes a release."""

SECTION_ORDER = ("Breaking Changes", "Features", "Fixes", "Performance", "Documentation", "Maintenance")
TYPE_SECTION = {"feat": "Features", "fix": "Fixes", "perf": "Performance", "docs": "Documentation", "refactor": "Maintenance"}

def parse_commit(subject):
    """Parse one conventional commit into a record or return None when irrelevant.

    Return keys: type, scope, subject, breaking. Do not trust embedded line breaks.
    """
    # TODO: handle optional (scope), the ! marker before colon, and invalid subjects.
    pass

def build_notes(version, commits):
    """Return {version, sections, breaking_changes}; each section maps to sorted bullet strings."""
    # TODO: validate inputs, suppress duplicates, group and sort entries predictably.
    pass

def render_markdown(notes):
    # TODO: render a stable heading and only non-empty sections.
    pass

def run_demo():
    return render_markdown(build_notes("0.0.0", []))
`,
  solution: `"""Release-note builder over supplied commit subjects."""
SECTION_ORDER = ("Breaking Changes", "Features", "Fixes", "Performance", "Documentation", "Maintenance")
TYPE_SECTION = {"feat": "Features", "fix": "Fixes", "perf": "Performance", "docs": "Documentation", "refactor": "Maintenance"}

def parse_commit(subject):
    if not isinstance(subject, str):
        return None
    clean = " ".join(subject.splitlines()).strip()
    if not clean or clean.lower().startswith("merge "):
        return None
    if clean.upper().startswith("BREAKING CHANGE:"):
        detail = clean.split(":", 1)[1].strip()
        return {"type": "breaking", "scope": "", "subject": detail, "breaking": True}
    if ":" not in clean:
        return None
    header, description = clean.split(":", 1)
    description = description.strip()
    marker = header.endswith("!")
    if marker:
        header = header[:-1]
    if "(" in header and header.endswith(")"):
        kind, scope = header[:-1].split("(", 1)
    else:
        kind, scope = header, ""
    kind, scope = kind.strip().lower(), scope.strip()
    if kind not in TYPE_SECTION or not description:
        return None
    return {"type": kind, "scope": scope, "subject": description, "breaking": marker}

def build_notes(version, commits):
    if not isinstance(version, str) or not version.strip() or isinstance(commits, (str, bytes)):
        raise ValueError("version and a sequence of commits are required")
    sections = {name: [] for name in SECTION_ORDER}
    seen = set()
    for raw in commits:
        record = parse_commit(raw)
        if record is None:
            continue
        label = f"**{record['scope']}**: {record['subject']}" if record["scope"] else record["subject"]
        if label in seen:
            continue
        seen.add(label)
        section = "Breaking Changes" if record["breaking"] else TYPE_SECTION[record["type"]]
        sections[section].append(label)
    for values in sections.values():
        values.sort(key=str.casefold)
    return {"version": version.strip(), "sections": sections, "breaking_changes": sections["Breaking Changes"]}

def render_markdown(notes):
    lines = [f"# Release {notes['version']}"]
    for section in SECTION_ORDER:
        entries = notes["sections"].get(section, [])
        if entries:
            lines.extend(["", f"## {section}"])
            lines.extend(f"- {entry}" for entry in entries)
    return "\\n".join(lines)

def run_demo():
    return render_markdown(build_notes("0.0.0", []))
`,
  testCode: `from project import parse_commit, build_notes, render_markdown
checks = []
checks.append(("scope parsed", parse_commit("feat(api): add paging")["scope"] == "api"))
checks.append(("breaking marker", parse_commit("feat(auth)!: rotate tokens")["breaking"] is True))
checks.append(("merge ignored", parse_commit("Merge pull request #2") is None))
n = build_notes("2.4.0", ["feat(api): add paging", "feat(api): add paging", "fix: handle empty", "feat(auth)!: rotate tokens", "chore: lock refresh"])
checks.append(("version retained", n["version"] == "2.4.0"))
checks.append(("deduplicated", len(n["sections"]["Features"]) == 1))
checks.append(("breaking grouped", len(n["breaking_changes"]) == 1))
m = render_markdown(n)
checks.append(("markdown headings", "## Breaking Changes" in m and "## Fixes" in m))
checks.append(("unsupported commit omitted", "lock refresh" not in m))
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
