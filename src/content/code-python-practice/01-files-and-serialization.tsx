import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function PythonFilesAndSerialization() {
  return <div className="prose-hh">
    <h1>Files, Paths, JSON &amp; CSV</h1>
    <p>A useful program often needs to preserve information after it exits. A log parser reads text, a model-training job reads records, and a command-line tool writes a report. File handling looks simple until a path differs between operating systems, a file uses a different encoding, data is malformed, or a process stops halfway through a write. This lesson builds a safe, testable workflow from paths to structured records.</p>
    <h2>Paths are data, not string fragments</h2>
    <p>A path names a location in a filesystem. Windows and Unix-like systems use different separators and drive conventions, so concatenating pieces with <code>"/"</code> or <code>"\\"</code> is fragile. <code>pathlib.Path</code> represents a path and joins components with <code>/</code> in a platform-aware way. A relative path is resolved from the process's current working directory, which may differ from the folder containing the script.</p>
    <CodeBlock label="Build paths, inspect files, and read text explicitly">{`from pathlib import Path

project_root = Path.cwd()
input_path = project_root / "data" / "events.log"

if not input_path.is_file():
    raise FileNotFoundError(f"Expected input file: {input_path}")

# Encoding matters: UTF-8 is a good explicit choice for modern text files.
with input_path.open("r", encoding="utf-8") as handle:
    for line_number, line in enumerate(handle, start=1):
        cleaned = line.rstrip("\\r\\n")
        if "FAILED_LOGIN" in cleaned:
            print(line_number, cleaned)`}</CodeBlock>
    <p>The <code>with</code> statement acquires a file resource and guarantees it is closed when the block exits, including if parsing raises an exception. Iterating over the handle reads one line at a time, keeping memory use bounded. <code>read_text()</code> is convenient for known-small files; streaming iteration is preferable for large logs. Do not use <code>Path.cwd()</code> when you specifically need a path relative to the Python source file: use <code>Path(__file__).resolve().parent</code> and make that contract clear.</p>
    <h2>Text encoding and newline boundaries</h2>
    <p>Bytes on disk do not inherently say which characters they represent. UTF-8 is the default for many modern data exchanges, but older files may use another encoding or contain invalid byte sequences. Choose an encoding at the boundary. If a forensic workflow must preserve original bytes, read bytes and record their hash before decoding; replacement characters can hide evidence of corruption. Use <code>newline=""</code> with the CSV module so it can handle line endings itself.</p>
    <h2>JSON: syntax validation is not schema validation</h2>
    <p>JSON encodes objects, arrays, strings, numbers, booleans, and null. Python maps these to <code>dict</code>, <code>list</code>, <code>str</code>, numeric values, <code>bool</code>, and <code>None</code>. <code>json.loads</code> proves only that text is valid JSON. It does not prove the top-level value is the expected type, that required keys exist, or that a port is in range. Validate the shape and meaning before using the values.</p>
    <CodeBlock label="Parse untrusted JSON in explicit stages">{`import json

def parse_service_record(raw_text):
    try:
        record = json.loads(raw_text)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON at line {error.lineno}, column {error.colno}") from error

    if not isinstance(record, dict):
        raise ValueError("A service record must be a JSON object")
    host = record.get("host")
    port = record.get("port")
    if not isinstance(host, str) or not host.strip():
        raise ValueError("host must be a non-empty string")
    # bool is a subclass of int in Python, so reject it explicitly here.
    if isinstance(port, bool) or not isinstance(port, int) or not 1 <= port <= 65535:
        raise ValueError("port must be an integer from 1 through 65535")
    return {"host": host.strip(), "port": port}

sample = '{"host": " lab.internal ", "port": 443}'
print(parse_service_record(sample))`}</CodeBlock>
    <p>Raising a clear validation error preserves the cause with <code>from error</code>. Callers can then decide whether to reject the whole input, skip one record, or report a row-specific problem. Avoid silently turning malformed values into defaults: a default can transform corrupt input into a plausible but incorrect result.</p>
    <h2>CSV: rows, headers, and predictable schemas</h2>
    <p>CSV is a family of delimiter-separated text formats, not one universal grammar. Commas can appear inside quoted fields, so splitting a row with <code>line.split(",")</code> is incorrect. The standard library's <code>csv</code> module handles quoting and escaping. Use <code>DictReader</code> when the first row names fields, then validate each row because CSV itself has no type system.</p>
    <CodeBlock label="Read CSV records without losing quoted commas">{`import csv
from pathlib import Path

def load_findings(path):
    findings = []
    with Path(path).open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"asset", "severity", "description"}
        if reader.fieldnames is None or not required.issubset(reader.fieldnames):
            raise ValueError(f"CSV must include columns: {sorted(required)}")
        for row_number, row in enumerate(reader, start=2):
            asset = (row.get("asset") or "").strip()
            severity = (row.get("severity") or "").strip().lower()
            description = (row.get("description") or "").strip()
            if not asset or not description:
                raise ValueError(f"Row {row_number}: asset and description are required")
            if severity not in {"critical", "high", "medium", "low", "info"}:
                raise ValueError(f"Row {row_number}: unknown severity {severity!r}")
            findings.append({"asset": asset, "severity": severity, "description": description})
    return findings`}</CodeBlock>
    <h2>Write safely: temporary file, then replace</h2>
    <p>Opening a destination with mode <code>"w"</code> truncates its previous contents immediately. If the process then crashes, the report may be empty or partial. For many local reporting tasks, write a temporary sibling file, flush and close it, and replace the final path only after serialization succeeds. Atomic replacement is generally supported within one filesystem; it is not a universal transaction across disks or network shares.</p>
    <CodeBlock label="Serialize deterministic JSON and replace the destination">{`import json
from pathlib import Path

def write_json_report(destination, report):
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp")
    try:
        with temporary.open("w", encoding="utf-8", newline="\\n") as handle:
            json.dump(report, handle, indent=2, sort_keys=True, ensure_ascii=False)
            handle.write("\\n")
            handle.flush()
        temporary.replace(destination)
    finally:
        # Cleanup is safe even when serialization or replacement fails.
        temporary.unlink(missing_ok=True)`}</CodeBlock>
    <Callout variant="warn"><p>Atomic replacement prevents readers from seeing a half-written file, but it does not make the report trustworthy or confidential. Set appropriate file permissions, avoid placing secrets in reports, and do not treat a filename extension as proof of content. For high-assurance evidence, hash the original input and preserve provenance separately.</p></Callout>
    <h2>Test file logic without relying on a developer's machine</h2>
    <p>Keep parsing functions separate from path selection and printing. This lets tests pass a small string or a temporary directory instead of depending on a particular home folder. Include empty files, missing fields, invalid encodings, malformed JSON, duplicate headers, unexpected extra columns, and large inputs in the test plan.</p>
    <PracticeTasksCallout tasks={[{ id: 'py-fund-14', title: 'Safe Config Parsing With Try/Except' }, { id: 'py-fund-06', title: 'Parse a CSV-Style Access Log Line' }]} />
    <p><strong>Further reading:</strong> <a href="https://docs.python.org/3/library/pathlib.html" target="_blank" rel="noreferrer">Python pathlib</a>, <a href="https://docs.python.org/3/library/json.html" target="_blank" rel="noreferrer">json</a>, and <a href="https://docs.python.org/3/library/csv.html" target="_blank" rel="noreferrer">csv</a> document the standard-library behavior used here.</p>
  </div>;
}
