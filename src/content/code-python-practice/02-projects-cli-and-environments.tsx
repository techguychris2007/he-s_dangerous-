import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function PythonProjectsAndCli() {
  return <div className="prose-hh">
    <h1>Modules, Environments &amp; Command-Line Programs</h1>
    <p>A script becomes a dependable tool when another person can install it, understand its inputs, run it from any directory, and receive useful errors. This lesson explains Python imports, project boundaries, virtual environments, command-line arguments, configuration, and the difference between importing a module and executing a program.</p>
    <h2>Modules and imports</h2>
    <p>Every <code>.py</code> file can act as a module. Importing executes the module's top-level statements once and binds names into the importing module. Put reusable functions and classes at module scope, but avoid performing scans, deleting files, or contacting services just because a module was imported. That side effect makes testing and reuse unpredictable.</p>
    <CodeBlock label="Separate reusable logic from the executable entry point">{`# report.py
from collections import Counter

def count_events(lines):
    """Count non-empty event labels from an iterable of lines."""
    counts = Counter()
    for line in lines:
        event = line.strip()
        if event:
            counts[event] += 1
    return dict(counts)

def main():
    sample = ["LOGIN_FAILED", "LOGIN_OK", "LOGIN_FAILED"]
    print(count_events(sample))

if __name__ == "__main__":
    main()`}</CodeBlock>
    <p>The <code>if __name__ == "__main__"</code> guard is true when Python runs the file directly, and false when another file imports it. This makes the same code usable as a small command-line program and as a tested module. For larger applications, the entry point should call functions that contain the real behavior rather than becoming a second implementation.</p>
    <h2>Packages and import boundaries</h2>
    <p>A package groups related modules under a directory. A small project might have <code>src/audit_tool/</code> containing <code>cli.py</code>, <code>parsers.py</code>, and <code>reporting.py</code>. Keep dependencies flowing in one direction: the CLI coordinates parsing and reporting, while lower-level parsing code should not import the CLI. Avoid naming your file after a standard-library module such as <code>json.py</code>, <code>logging.py</code>, or <code>typing.py</code>, because it can shadow the real module during import.</p>
    <CodeBlock label="An illustrative project tree">{`audit-tool/
├── pyproject.toml       # project metadata and tool configuration
├── README.md            # setup, examples, limits, and support
├── src/
│   └── audit_tool/
│       ├── __init__.py
│       ├── cli.py        # argument parsing and exit status
│       ├── parsing.py   # pure transformations from text to records
│       └── reporting.py # validated output formats
└── tests/
    ├── test_parsing.py
    └── test_reporting.py`}</CodeBlock>
    <h2>Virtual environments and reproducible dependencies</h2>
    <p>A virtual environment gives a project its own Python package installation. Without one, two projects may silently depend on incompatible versions installed globally. Create it with <code>python -m venv .venv</code>, activate it for your shell, and use <code>python -m pip install ...</code> so pip belongs to the interpreter you intend. Track project dependencies and document the supported Python version. A lock file or pinned versions improve repeatability, but updates still need testing.</p>
    <CodeBlock label="Check the interpreter and installed package provenance">{`python --version
python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS / Linux:      source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip list
python -c "import sys; print(sys.executable)"`}</CodeBlock>
    <p>Never install a package simply because an error message suggests an unknown package name. Check the project's documented dependencies and package identity first. Dependencies execute code with the permissions of the running process, so dependency review, updates, and avoiding unnecessary packages are software supply-chain controls.</p>
    <h2>Command-line arguments are a public interface</h2>
    <p>Command-line tools receive strings, even when an option represents a number or path. <code>argparse</code> parses arguments, converts common types, validates choices, produces consistent help output, and returns a non-zero exit status for invalid usage. Separate configuration parsing from the action so the behavior can be tested without launching a subprocess.</p>
    <CodeBlock label="Build a small read-only event summary command">{`import argparse
from pathlib import Path

def build_parser():
    parser = argparse.ArgumentParser(description="Summarize a local event log")
    parser.add_argument("input", type=Path, help="UTF-8 text log to inspect")
    parser.add_argument("--contains", default="", help="only count lines containing this text")
    parser.add_argument("--limit", type=int, default=1000, help="maximum lines to read")
    return parser

def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.limit < 1:
        raise SystemExit("--limit must be greater than zero")
    if not args.input.is_file():
        raise SystemExit(f"input file does not exist: {args.input}")
    counts = {}
    with args.input.open(encoding="utf-8") as handle:
        for number, line in enumerate(handle, start=1):
            if number > args.limit:
                break
            event = line.strip()
            if event and args.contains in event:
                counts[event] = counts.get(event, 0) + 1
    for event, count in sorted(counts.items()):
        print(f"{count:>5}  {event}")

if __name__ == "__main__":
    main()`}</CodeBlock>
    <p>Consider how empty filters behave, whether output ordering should be deterministic, what happens when a file is unreadable, and whether exposing a full path in an error is acceptable in the environment. A production CLI should define a stable exit-code contract: zero for success, a documented non-zero code for invalid input or operational failure. Send diagnostics to standard error and machine-readable results to standard output when composing tools in a shell pipeline.</p>
    <h2>Shell and Git are part of programming practice</h2>
    <p>The shell lets you run programs, connect their input and output, inspect files, and automate repeated steps. Git records snapshots of source changes so a learner can compare behavior before and after a change, review a diff, and return to a known state. A small commit should explain one change. Generated virtual environments, secrets, caches, and local data usually belong in <code>.gitignore</code>; credentials should not be committed even to a private repository.</p>
    <CodeBlock label="A conservative development loop">{`git status
python -m pytest
git diff --check
git diff
git add src/audit_tool tests
git commit -m "Add bounded event log summary"`}</CodeBlock>
    <Callout variant="info"><p>Shell quoting and path rules vary across PowerShell, Bash, and other shells. Learn the shell you actually use, quote paths that contain spaces, and avoid passing untrusted text into a command string. Prefer an API's argument list to building a shell command from user-controlled pieces.</p></Callout>
    <PracticeTasksCallout tasks={[{ id: 'py-fund-14', title: 'Safe Config Parsing With Try/Except' }, { id: 'py-fund-15', title: 'Find UID-0 Accounts in a passwd-Style String' }]} />
    <p><strong>Further reading:</strong> <a href="https://docs.python.org/3/tutorial/modules.html" target="_blank" rel="noreferrer">Python modules</a>, <a href="https://docs.python.org/3/library/argparse.html" target="_blank" rel="noreferrer">argparse</a>, <a href="https://packaging.python.org/en/latest/" target="_blank" rel="noreferrer">Python Packaging User Guide</a>, and <a href="https://git-scm.com/book/en/v2" target="_blank" rel="noreferrer">Pro Git</a>.</p>
  </div>;
}
