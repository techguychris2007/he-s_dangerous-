import type { MlLesson } from './types';

/**
 * Python is taught here as executable engineering knowledge, not a list of syntax names.
 * Every lesson connects the language feature to the data and model work learners will build next.
 */
export const PYTHON_ML_ENGINEERING_LESSONS: MlLesson[] = [
  {
    id: 'py-ml-vars-types', title: 'Variables, Types, and Memory Models', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-01',
    sections: [
      { heading: 'A name refers to a value', body: `<p>In Python, a variable is a <em>name</em> bound to an object. In <code>age = 32</code>, the integer object <code>32</code> exists and the name <code>age</code> refers to it. Python does not require a declaration such as “age is an integer” first; the type belongs to the value. You can inspect it with <code>type(age)</code>, and convert only when the input contract makes that conversion valid.</p><p>Raw values arrive from CSV files, JSON APIs, SQL drivers, forms, and event streams. A number in JSON might arrive as a number, while the same field in a CSV arrives as text. <code>int("32")</code> succeeds; <code>int("unknown")</code> raises <code>ValueError</code>. A missing value is a separate case: Python uses <code>None</code>, while pandas and NumPy also have their own missing-value representations. These values are not interchangeable with zero.</p>` },
      { heading: 'Types are part of a feature contract', body: `<p>A model usually receives a numeric matrix, but an application often starts with human-readable records. Before training, each field needs a defined meaning and representation: an age may be an integer, an amount a floating-point value, a country a category, and an outcome a label. The feature contract should state units, allowed ranges, null behavior, and whether coercion is allowed. For example, “amount in USD, finite and non-negative; missing is rejected” is safer than “amount is a number.”</p><pre><code>raw = {"amount": "19.95", "is_member": "true"}
amount = float(raw["amount"])
is_member = raw["is_member"].strip().lower() == "true"
assert amount >= 0
print(type(amount).__name__, type(is_member).__name__)</code></pre><p>The conversion is explicit, and the assertion expresses a small invariant. In production code, raise a descriptive <code>ValueError</code> rather than relying on an assertion for external input validation.</p>` },
      { heading: 'Assignment, identity, and mutation', body: `<p>Assignment binds another name; it does not necessarily copy an object. If <code>a</code> and <code>b</code> refer to the same list, mutating the list through either name is visible through both. This matters when a preprocessing function modifies a record supplied by its caller. Prefer constructing a new result when the function should not alter source data.</p><pre><code>source = {"features": [2.0, 4.0]}
alias = source
alias["features"].append(6.0)
print(source["features"])  # [2.0, 4.0, 6.0]

copy = {**source, "features": list(source["features"])}
copy["features"].append(8.0)
print(source["features"])  # unchanged by the last append</code></pre><p>The dictionary expansion makes a shallow copy: nested mutable values still need deliberate copying. Understanding this prevents one training example from silently changing data used by another step.</p>` },
      { heading: 'Missing values, numeric precision, and safe checks', body: `<p>Never test a possibly missing numeric value with <code>if value</code>: zero is false-like but may be a legitimate measurement. Test missingness explicitly with <code>value is None</code>. Floating-point numbers approximate many decimal fractions, so equality checks such as <code>0.1 + 0.2 == 0.3</code> are unreliable. For computed results, use a tolerance such as <code>math.isclose</code>. Also reject <code>NaN</code> and infinity when the downstream model requires finite features.</p><p>After this lesson, you should be able to explain the value/type distinction, trace an aliasing bug, convert a raw field with useful failure behavior, and state the type and missing-value contract for each feature in a small training row.</p>` },
    ],
  },
  {
    id: 'py-ml-strings-text', title: 'Strings, Text Cleaning, and Parsing', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-02',
    sections: [
      { heading: 'Strings are immutable sequences of Unicode text', body: `<p>A Python <code>str</code> is an immutable sequence of Unicode code points. Indexing and slicing create new strings: <code>text[0]</code> reads one position and <code>text[2:6]</code> reads positions 2 through 5. Negative indices count from the end. Because strings are immutable, methods such as <code>strip()</code>, <code>lower()</code>, and <code>replace()</code> return new strings; they do not edit the original.</p><pre><code>raw = "  Ghana\u00a0"  # includes a non-breaking space
clean = raw.strip().casefold()
print(repr(raw))
print(repr(clean))</code></pre><p><code>repr</code> makes invisible whitespace visible while debugging. <code>casefold</code> is a stronger Unicode-aware case normalization than <code>lower</code>; for English-only identifiers either can work, but text pipelines should define their language and normalization assumptions.</p>` },
      { heading: 'Normalize deliberately; preserve meaning', body: `<p>Whitespace cleanup and consistent casing often help when matching labels or parsing machine-generated fields. Removing punctuation or accents can change meaning, however, and tokenization decisions affect downstream features. Do not apply one universal cleaner to every column. A customer ID, an email address, a free-text review, and a natural-language sentence have different rules.</p><pre><code>event = "  PAYMENT_FAILED: user=U-104  "
normalized = event.strip().casefold()
kind, payload = normalized.split(":", maxsplit=1)
fields = dict(part.split("=", maxsplit=1) for part in payload.strip().split())
print(kind, fields["user"])</code></pre><p><code>maxsplit=1</code matters: it prevents later delimiters from breaking a value into unexpected pieces. Real parsers should validate that the delimiter and expected keys exist before indexing into the result.</p>` },
      { heading: 'Formatting, parsing, and regular expressions', body: `<p>Use f-strings for readable output, and keep display formatting separate from stored values. Formatting a numeric value to two decimal places is suitable for a report, but rounding a feature before model input may discard useful information. Use regular expressions when the input follows a pattern, not as a substitute for a parser when the format has nesting or escaping rules.</p><pre><code>score = 0.87342
print(f"Validation score: {score:.3f}")

import re
match = re.search(r"request_id=([A-Za-z0-9-]+)", "status=500 request_id=ab-19")
request_id = match.group(1) if match else None</code></pre><p>The regular expression uses a capture group to return the part of interest. A missing match is expected input behavior and should be handled, rather than calling <code>group()</code> on <code>None</code>.</p>` },
      { heading: 'Text data needs provenance and privacy care', body: `<p>Text often contains names, email addresses, account identifiers, or other personal information. Before creating features, decide what data is necessary, whether identifiers should be removed or transformed, how long raw text is retained, and who may inspect it. A model can memorize rare strings, so “we only train on text” is not a privacy control. Keep original text available only when there is a justified operational need and access controls.</p><p>You should now be able to normalize a known format, parse fields safely, preserve information required by the task, test malformed and Unicode input, and avoid leaking raw text into logs.</p>` },
    ],
  },
  {
    id: 'py-ml-control-flow', title: 'Conditionals, Loops, and Data Validation', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-03',
    sections: [
      { heading: 'Branching makes data rules explicit', body: `<p><code>if</code>, <code>elif</code>, and <code>else</code> select a path based on a Boolean expression. Comparisons can be combined with <code>and</code>, <code>or</code>, and <code>not</code>. Python evaluates <code>and</code> and <code>or</code> from left to right and short-circuits: in <code>value is not None and value &gt; 0</code>, the comparison is skipped when the value is missing. This is a useful way to express safe validation rules.</p><pre><code>def valid_amount(value):
    return value is not None and value >= 0

for raw in [12.5, 0, -3, None]:
    print(raw, valid_amount(raw))</code></pre><p>Zero is valid here. A truthiness check such as <code>if value</code> would incorrectly reject it.</p>` },
      { heading: 'Loops process records one at a time', body: `<p>A <code>for</code> loop visits each element of an iterable. Use <code>enumerate(rows, start=1)</code> when you need both a record and its human-readable row number. A <code>while</code> loop repeats while a condition remains true; it is common in retry logic, but it needs a clear exit condition. For ordinary dataset processing, a <code>for</code> loop is usually easier to reason about.</p><pre><code>accepted, rejected = [], []
for row_number, row in enumerate(rows, start=1):
    if "label" not in row:
        rejected.append((row_number, "missing label"))
        continue
    if row["label"] not in {0, 1}:
        rejected.append((row_number, "label must be 0 or 1"))
        continue
    accepted.append(row)</code></pre><p><code>continue</code> skips the rest of the current iteration. Recording why a row was rejected creates an auditable data-quality report; silently dropping rows hides distribution changes.</p>` },
      { heading: 'Exceptions distinguish bad data from broken programs', body: `<p>Use a return value for an ordinary expected outcome, such as a validator returning <code>False</code>. Raise an exception when a caller cannot safely continue, and catch only exceptions you know how to handle. Broad <code>except Exception</code> blocks can turn a real programming bug into a warning and produce a misleadingly successful dataset.</p><pre><code>def parse_score(raw):
    try:
        score = float(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"score must be numeric; got {raw!r}") from exc
    if not 0.0 <= score <= 1.0:
        raise ValueError("score must be between 0 and 1")
    return score</code></pre><p>The exception chain preserves the original cause, while the message tells the data producer which contract failed.</p>` },
      { heading: 'Validation order and data quality', body: `<p>Validate before expensive work. Check schema, required fields, allowed categories, numeric ranges, duplicate identifiers, timestamp order, and finite values before fitting. Report counts and representative examples for each failure type. Do not automatically “fix” a field unless the correction is justified; clipping invalid values or inventing labels can make the training set appear cleaner while making it less truthful.</p><p>Mastery means you can write a validation loop that preserves good rows, explains rejected rows, and fails loudly when a contract-level assumption is violated.</p>` },
    ],
  },
  {
    id: 'py-ml-data-structures', title: 'Lists, Tuples, Dictionaries, Sets, and Records', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-04',
    sections: [
      { heading: 'Choose a container for the job', body: `<p>A <code>list</code> is ordered and mutable, which suits a sequence of examples. A <code>tuple</code> is ordered and immutable, useful for a fixed coordinate or a stable pair. A <code>dict</code> maps unique keys to values, making it a natural representation for one named record. A <code>set</code> stores unique hashable values and supports fast membership checks. The choice is not cosmetic: it affects mutation, lookup, ordering, and what data can be represented.</p><pre><code>row = {"customer_id": "c-17", "amount": 42.0, "region": "north"}
rows = [row, {"customer_id": "c-18", "amount": 9.0, "region": "west"}]
known_regions = {item["region"] for item in rows}
coordinate = (4, 7)</code></pre><p>Dictionary insertion order is preserved in modern Python, but model feature order should still be explicit: never rely on incidental iteration order to align values with model columns.</p>` },
      { heading: 'Indexing, slicing, and iteration', body: `<p>Sequences use zero-based indices. A slice <code>values[start:stop]</code> includes <code>start</code> and excludes <code>stop</code>; this makes adjacent slices fit together without overlap. Negative indices count from the end. Iteration is usually safer than indexing when the position is not itself part of the calculation.</p><pre><code>amounts = [12.0, 25.5, 9.0, 41.2]
first_two = amounts[:2]
last = amounts[-1]
total = sum(amounts)
mean = total / len(amounts)
print(first_two, last, mean)</code></pre><p>For an empty sequence, <code>len(amounts)</code> is zero, so the mean calculation needs a defined empty-input policy. In a dataset pipeline, the honest response may be an error rather than an invented mean.</p>` },
      { heading: 'Records and tabular data', body: `<p>A list of dictionaries is easy to understand for small examples, but each lookup is dynamic and column consistency is not enforced. A record can omit a key or use a different type without warning. As data grows, a DataFrame or typed schema provides better inspection and column-wise operations. NumPy arrays are efficient when values share a numeric type and shape; an object array of mixed types usually gives away much of that benefit.</p><pre><code>feature_names = ["amount", "days_active"]
row = {"amount": 42.0, "days_active": 18}
vector = [row[name] for name in feature_names]
print(vector)  # order follows the declared schema</code></pre><p>That explicit list is the feature order contract. The same order must be used during training and inference.</p>` },
      { heading: 'Membership, counting, and safe mutation', body: `<p>Use sets for “have I seen this ID?” checks, dictionaries for counts and mappings, and lists when order or duplicates matter. A common pattern is counting category frequency with <code>dict.get</code>. Avoid sharing mutable defaults such as <code>def add_row(row, rows=[])</code>; that single list persists between calls. Create the list inside the function or use <code>None</code> as a sentinel.</p><p>You should be able to explain the trade-offs of these core containers and convert a list of named records into a stable, validated feature matrix.</p>` },
    ],
  },
  {
    id: 'py-ml-functions', title: 'Functions, Scope, Modules, and Reusable Pipelines', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-05',
    sections: [
      { heading: 'A function is a named input-to-output contract', body: `<p><code>def</code> creates a function. Parameters name the inputs, the body computes a result, and <code>return</code> sends that result to the caller. If execution reaches the end without a return statement, Python returns <code>None</code>. A good data function documents its accepted types, units, missing-value behavior, and output shape, so a caller can use it without inspecting implementation details.</p><pre><code>def add_ratio(row):
    """Return a copy with spend_per_visit; zero visits produce None."""
    visits = row["visits"]
    ratio = None if visits == 0 else row["spend"] / visits
    return {**row, "spend_per_visit": ratio}

original = {"spend": 30.0, "visits": 3}
print(add_ratio(original))
print(original)  # function did not mutate caller data</code></pre>` },
      { heading: 'Arguments, defaults, and scope', body: `<p>Positional arguments bind by order; keyword arguments bind by name. Defaults are evaluated once when the function is defined, so mutable defaults are a classic source of hidden shared state. Local names exist inside a function call; global state makes functions harder to test because the output can depend on state the signature does not show. Pass configuration and dependencies explicitly.</p><pre><code>def clean_country(value, *, missing="unknown"):
    if value is None or not str(value).strip():
        return missing
    return str(value).strip().casefold()

print(clean_country(" Ghana "))
print(clean_country(None, missing="not-reported"))</code></pre><p>The <code>*</code> forces <code>missing</code> to be passed by keyword, which makes calls clearer.</p>` },
      { heading: 'Compose small transformations into a pipeline', body: `<p>One function should have one reason to change. Separate parsing, validation, feature creation, and serialization so each step has a small test surface. A deterministic pipeline applies the same transformation to training and inference data. If a feature function reads the current time or random state implicitly, the same input may produce different output.</p><pre><code>def transform_record(raw):
    parsed = parse_record(raw)
    validate_record(parsed)
    return make_features(parsed)

features = [transform_record(row) for row in incoming_rows]</code></pre><p>The names above describe the pipeline boundaries; each function should be implemented and tested as a separate unit.</p>` },
      { heading: 'Modules, imports, and testable boundaries', body: `<p>A module is a Python file that groups related definitions. Put reusable transformation functions in importable modules and keep notebook cells for exploration, plots, and narrative. Avoid doing network calls, training, or file writes merely because a module is imported. Put executable work behind a <code>if __name__ == "__main__":</code> guard so tests can import functions without launching a full job.</p><p>Mastery means you can turn a notebook transformation into a pure function, write a docstring with the input/output contract, and call it from both a test and a training script.</p>` },
    ],
  },
  {
    id: 'py-ml-comprehensions-iterators', title: 'Comprehensions, Iterators, and Generator Thinking', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-06',
    sections: [
      { heading: 'Comprehensions express simple transformations', body: `<p>A list comprehension creates a list from an iterable and optional condition: <code>[expression for item in source if condition]</code>. A dictionary comprehension creates key/value pairs; a set comprehension removes duplicates. They are useful when the operation remains easy to read on one line. If the expression contains multiple branches or nested loops, a regular loop communicates intent better.</p><pre><code>rows = [{"amount": 4}, {"amount": None}, {"amount": 9}]
valid_amounts = [row["amount"] for row in rows if row["amount"] is not None]
amount_by_index = {i: amount for i, amount in enumerate(valid_amounts)}
print(valid_amounts, amount_by_index)</code></pre><p>Here the filter distinguishes a missing value from zero, preserving valid zero-valued measurements.</p>` },
      { heading: 'Iterables and iterators', body: `<p>An iterable can produce an iterator; an iterator returns the next value and remembers where it is. Lists are reusable iterables. A generator expression or generator function yields values lazily, so it does not need to hold the full transformed dataset in memory. Iterators are generally single-pass: once consumed, they are exhausted. If a pipeline needs two passes, it must recreate the iterator or persist the data.</p><pre><code>def read_valid_amounts(records):
    for record in records:
        amount = record.get("amount")
        if amount is not None:
            yield float(amount)

stream = read_valid_amounts(rows)
print(sum(stream))</code></pre><p><code>yield</code> pauses the function and resumes it on the next request. It supports bounded-memory processing when the input itself is streamable.</p>` },
      { heading: 'Batching and memory-aware processing', body: `<p>Large datasets should often be processed in chunks. Loading a multi-gigabyte CSV into a Python list may exhaust memory; reading a file or database in batches lets the pipeline validate, transform, and write bounded portions. Laziness alone does not make a pipeline fast: the work may still be CPU-bound, and repeated iteration over a generator is impossible without recreating it.</p><pre><code>def batches(items, size):
    batch = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch</code></pre><p>For production use, validate that <code>size</code> is positive and decide how to handle a final partial batch.</p>` },
      { heading: 'Choose clarity before compactness', body: `<p>A list comprehension, generator, pandas vectorized expression, and NumPy operation are different tools. Use vectorized operations when they express the transformation clearly and the data fits their memory model. Use streaming for large sequential input. Use a loop when a record needs several validation decisions. Profile before optimizing; obscure code is expensive to debug and not automatically faster.</p><p>After this lesson, you should be able to explain whether your pipeline materializes data, identify when an iterator is exhausted, and select a chunk size that respects memory constraints.</p>` },
    ],
  },
  {
    id: 'py-ml-files-exceptions', title: 'Files, Paths, JSON, CSV, and Exceptions', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-07',
    sections: [
      { heading: 'Paths and text files', body: `<p>Use <code>pathlib.Path</code> to build paths without hard-coding operating-system separators. Open text files with an explicit encoding such as UTF-8 and use a context manager so the file closes even when parsing fails. Relative paths are resolved from the process working directory, which may differ between a notebook, test runner, and deployed job; make the data location an explicit configuration value.</p><pre><code>from pathlib import Path

data_path = Path("data") / "events.jsonl"
with data_path.open(encoding="utf-8") as handle:
    first_line = handle.readline()</code></pre><p>Do not overwrite raw source data during cleaning. Keep raw inputs immutable and write derived outputs to a separate, versioned location.</p>` },
      { heading: 'CSV and JSON have different data contracts', body: `<p>CSV is a flat text format. Values are text until parsed; quoting, delimiters, newlines, and missing-value conventions matter. Prefer the standard <code>csv</code> module or pandas over splitting a line on commas. JSON represents nested arrays, objects, strings, numbers, booleans, and null. JSON Lines stores one JSON value per line and is convenient for streaming event records.</p><pre><code>import json

record = {"user_id": "u-12", "features": {"visits": 4}}
encoded = json.dumps(record, ensure_ascii=False)
decoded = json.loads(encoded)
assert decoded["features"]["visits"] == 4</code></pre><p>JSON object keys are strings, and JSON cannot represent Python-specific objects such as a set or a datetime without an explicit serialization format.</p>` },
      { heading: 'Handle parse errors with context', body: `<p>Input files can be truncated, malformed, or incompatible with the expected schema. Catch a narrow exception such as <code>json.JSONDecodeError</code>, add context such as file and line number, and preserve the original exception with <code>raise ... from error</code>. Do not convert every failure into an empty list: a job that reports success with zero records is often more dangerous than one that stops.</p><pre><code>def parse_json_line(line, line_number):
    try:
        value = json.loads(line)
    except json.JSONDecodeError as error:
        raise ValueError(f"invalid JSON on line {line_number}") from error
    if not isinstance(value, dict):
        raise ValueError(f"line {line_number} must contain an object")
    return value</code></pre>` },
      { heading: 'Safe automation and sensitive data', body: `<p>File automation becomes useful in ML when collecting reports, joining exports, converting formats, and validating incoming batches. Treat paths from users as untrusted input, avoid blindly deleting or overwriting files, and avoid placing credentials in scripts or logs. For batch jobs, record counts, schema versions, checksums where practical, and a clear failure summary so an operator can tell whether the output is complete.</p><p>You should now be able to read a structured file safely, distinguish syntax errors from schema errors, and make a pipeline fail with enough context to fix the source.</p>` },
    ],
  },
  {
    id: 'py-ml-oop', title: 'Object-Oriented Python for ML Components', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-08',
    sections: [
      { heading: 'Objects group state and behavior', body: `<p>A class defines how objects are created and what operations they support. An instance holds state; methods define behavior that acts on that state. <code>self</code> is the instance passed to an instance method. <code>__init__</code> initializes it. Object-oriented design is useful when a component needs state across calls, such as a scaler that learns a mean during training and reuses it during inference.</p><pre><code>class MeanCenterer:
    def fit(self, values):
        self.mean_ = sum(values) / len(values)
        return self

    def transform(self, values):
        if not hasattr(self, "mean_"):
            raise RuntimeError("fit must be called before transform")
        return [value - self.mean_ for value in values]</code></pre><p>The trailing underscore convention often marks attributes learned from data. It is a convention, not special Python syntax.</p>` },
      { heading: 'Fit and transform prevent train/inference mismatch', body: `<p>Scikit-learn transformers commonly implement <code>fit</code>, <code>transform</code>, and <code>fit_transform</code>. During <code>fit</code>, the transformer learns parameters from training data. During <code>transform</code>, it applies those already learned parameters. You must not fit a scaler independently on the validation or production batch; doing so changes the coordinate system and can leak information from held-out data.</p><pre><code>centerer = MeanCenterer().fit(training_values)
train_centered = centerer.transform(training_values)
validation_centered = centerer.transform(validation_values)</code></pre><p>Both datasets use the training mean. In a real pipeline, scikit-learn's <code>Pipeline</code> chains transformations and the estimator so cross-validation fits each step only on its training fold.</p>` },
      { heading: 'Composition is often better than inheritance', body: `<p>Inheritance can share a stable interface, but deep class hierarchies make data flow difficult to trace. Prefer small objects that can be composed: a validator, a text normalizer, a scaler, and an estimator. Keep side effects such as database writes or network calls outside numerical transformations where possible. This makes model components easier to test and safer to reuse.</p>` },
      { heading: 'State, serialization, and lifecycle', body: `<p>Fitted objects contain learned state and may be serialized as model artifacts. A saved artifact must be loaded only from a trusted source: formats based on Python pickle can execute code during loading. Store a versioned artifact with metadata describing training data, feature order, package versions, and model configuration. Do not assume a Python object remains compatible across arbitrary library upgrades.</p><p>Mastery means you can explain what a class stores, when its state is learned, how it is reused, and what risks arise when it is serialized.</p>` },
    ],
  },
  {
    id: 'py-ml-dataclasses-typing', title: 'Dataclasses, Type Hints, and Configuration Objects', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-09',
    sections: [
      { heading: 'Type hints describe intended interfaces', body: `<p>An annotation such as <code>def score(features: list[float]) -&gt; float:</code> communicates the expected input and output to readers, editors, and static analyzers. Python does not normally enforce annotations at runtime. They are executable documentation and tooling signals, not input validation. At system boundaries, validate values even if a type hint says they should be valid.</p><pre><code>def normalize(values: list[float], scale: float = 1.0) -&gt; list[float]:
    if scale == 0:
        raise ValueError("scale must not be zero")
    return [value / scale for value in values]</code></pre>` },
      { heading: 'Optional values and structured configuration', body: `<p><code>str | None</code> means a value may be text or absent; it does not mean every string should be accepted. A dataclass creates a clear structure for related settings and supplies an initializer and readable representation.</p><pre><code>from dataclasses import dataclass

@dataclass(frozen=True)
class TrainConfig:
    test_fraction: float = 0.2
    random_seed: int = 42
    max_depth: int | None = None

config = TrainConfig(max_depth=8)
print(config)</code></pre><p><code>frozen=True</code> prevents accidental field reassignment. Validate that fractions are between zero and one and that random seeds and model parameters meet their own constraints.</p>` },
      { heading: 'Configuration is part of reproducibility', body: `<p>Experiments should not depend on hidden constants scattered through a notebook. Put meaningful choices—split strategy, seed, feature list, model parameters, threshold, and input locations—in a configuration object or explicit command-line arguments. Save the resolved configuration with the model artifact. When a result changes, you can then tell whether the data, code, dependency versions, or configuration changed.</p>` },
      { heading: 'Avoid turning types into ceremony', body: `<p>Annotate public functions and data structures where the information helps. Do not annotate every temporary variable merely to appear formal. Keep the runtime contract precise: a parameter called <code>learning_rate: float</code> still needs range validation and a clear unit. Use <code>TypedDict</code>, dataclasses, or validation libraries according to whether you need static shape documentation, immutable settings, or runtime parsing.</p><p>You should be able to explain the difference between a hint and a check, define a validated experiment configuration, and persist settings with results.</p>` },
    ],
  },
  {
    id: 'py-ml-testing-debugging', title: 'Testing, Debugging, and Reproducibility', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-10',
    sections: [
      { heading: 'Test data code before model code', body: `<p>A model metric cannot tell you whether a parser swapped two columns, a join duplicated customers, or a feature was calculated with future events. Unit tests check small deterministic functions; integration tests check that multiple components work together; data validation checks assumptions about an incoming batch. These tests answer different questions and all matter for a trustworthy ML result.</p><pre><code>def positive_rate(labels):
    if not labels:
        raise ValueError("labels must not be empty")
    return sum(label == 1 for label in labels) / len(labels)

assert positive_rate([1, 0, 1, 0]) == 0.5</code></pre><p>Test the normal case, boundaries, missing fields, wrong types, and invalid values. Include tests for the behavior you require, not just lines you happened to write.</p>` },
      { heading: 'Reproducible randomness', body: `<p>Many ML operations use randomness: data shuffling, initialization, sampling, augmentation, and randomized search. A seed makes a pseudorandom sequence repeatable within a defined software environment, which helps compare code changes. It does not guarantee bit-for-bit results across different hardware, parallel execution, or library versions. Record the seed and environment alongside results instead of claiming a seed makes a run universally deterministic.</p><pre><code>import random

rng = random.Random(17)
sample = rng.sample(["a", "b", "c", "d"], k=2)
print(sample)</code></pre><p>A local random generator avoids changing unrelated code that uses Python's global random state.</p>` },
      { heading: 'Debug shape, schema, and intermediate values', body: `<p>When a result looks wrong, inspect the smallest useful evidence: shape, column names, dtypes, null counts, class distribution, a few representative rows, and the value range before and after each transformation. For NumPy, shape mismatches and unintended broadcasting are common; for pandas, index alignment can silently reorder or produce missing values. A compact diagnostic is more useful than printing an entire dataset.</p><pre><code>print(X.shape)
print(feature_names)
print(y.value_counts(dropna=False))
print(X.isna().sum().sort_values(ascending=False).head())</code></pre>` },
      { heading: 'Track runs as evidence', body: `<p>For each experiment, record the dataset snapshot or version, code revision, configuration, split definition, random seed, metrics, and artifact identifier. A notebook output alone is not a reproducibility record. Keep tests small and fast in ordinary development; reserve full training or expensive GPU checks for appropriate integration runs. When a model result changes, this record helps isolate the cause.</p><p>Mastery means you can reproduce a small experiment, explain the limits of deterministic seeds, and use tests to distinguish a data bug from a modeling choice.</p>` },
    ],
  },
  {
    id: 'py-ml-async-concurrency', title: 'Async, Concurrency, and Batch I/O', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-11',
    sections: [
      { heading: 'Waiting and computing are different bottlenecks', body: `<p>Network requests and database calls spend much of their time waiting. Asynchronous code lets one thread make progress on other I/O while a request is pending. CPU-heavy model training is different: running many Python coroutines does not make matrix multiplication faster. Training usually relies on NumPy, BLAS, a GPU framework, multiprocessing, or distributed compute, each with its own resource and synchronization behavior.</p><p>Use concurrency only after identifying the bottleneck. A sequential process with clear retries and limits is often safer than an uncontrolled burst of parallel requests.</p>` },
      { heading: 'Understand async and await', body: `<p>An <code>async def</code> function returns a coroutine object. It does not run to completion when called; an event loop schedules it. <code>await</code> pauses that coroutine until an awaitable result is ready, allowing other scheduled work to run. <code>asyncio.gather</code> can run several coroutines concurrently, but a robust client should bound concurrency and handle timeouts and partial failures.</p><pre><code>import asyncio

async def fetch_one(item_id):
    await asyncio.sleep(0.01)  # represents asynchronous I/O
    return {"id": item_id, "available": True}

async def main():
    records = await asyncio.gather(*(fetch_one(i) for i in range(3)))
    print(records)

asyncio.run(main())</code></pre>` },
      { heading: 'Backpressure, retries, and service limits', body: `<p>If a job launches thousands of calls at once, it can exhaust sockets, overload a service, or trigger rate limits. Use a semaphore or worker queue to bound in-flight requests, add timeouts, and apply retries only to transient failures. Retries need a limit and backoff; retrying a non-idempotent operation may duplicate a side effect. Preserve per-record error information so one unavailable feature source does not silently become a fabricated default.</p>` },
      { heading: 'Where concurrency belongs in an ML system', body: `<p>Async can help a prediction service gather independent remote features, publish results, or coordinate I/O. It is less appropriate inside a small local preprocessing function. Do not use async merely because the service is called an AI service. Keep the feature contract and failure policy explicit: can the prediction continue without one source, should it use a cache, or must it fail closed?</p><p>You should now be able to describe what the event loop does, identify I/O-bound versus CPU-bound work, and add bounded concurrency with timeout and failure behavior.</p>` },
    ],
  },
  {
    id: 'py-ml-packaging-envs', title: 'Packages, Virtual Environments, and Project Layout', source: 'Python for ML Engineering', unit: 'python-ml-engineering', challengeTaskId: 'ml-py-12',
    sections: [
      { heading: 'A virtual environment isolates dependencies', body: `<p>A Python environment contains an interpreter and installed packages. A virtual environment isolates project dependencies from the operating system and from other projects. This matters because two projects may require different compatible versions of NumPy, pandas, or a deep-learning framework. A lock file or pinned dependency set helps teammates reproduce an environment; it does not by itself guarantee reproducible results if data and hardware also change.</p><pre><code>python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
# macOS/Linux:       source .venv/bin/activate
python -m pip install --upgrade pip</code></pre><p>Use the project's documented package manager and Python version. Do not mix global packages and project dependencies without a reason.</p>` },
      { heading: 'Move from exploration to a maintainable project', body: `<p>Notebooks are excellent for exploration because they combine code, output, plots, and notes. Once a transformation stabilizes, move reusable logic into importable modules. A simple project might contain <code>src/project_name/data.py</code>, <code>features.py</code>, <code>train.py</code>, <code>evaluate.py</code>, and <code>tests/</code>. Keep credentials and large private data outside source control. Document how to install, test, train, and reproduce the result.</p><pre><code>project/
  pyproject.toml
  README.md
  src/modeling/features.py
  src/modeling/train.py
  tests/test_features.py
  configs/baseline.toml</code></pre>` },
      { heading: 'Imports should be predictable', body: `<p>Imports should define functions, classes, and constants without starting a long training job, downloading a dataset, or changing files. Put command behavior in a <code>main()</code> function and call it only inside the main guard. Prefer package-relative imports inside a package and a single documented way to launch scripts; import behavior that changes with the current working directory is a common source of “works on my machine” failures.</p>` },
      { heading: 'Version the whole experiment', body: `<p>A model artifact is more than a weight file. Preserve the feature schema, target definition, preprocessing pipeline, training-data version, code revision, configuration, dependency environment, evaluation results, and artifact format. Model loading can be unsafe when using serialization formats that execute Python code; accept model artifacts only from trusted, verified sources. Separate secrets from configuration files and rotate exposed credentials.</p><p>Mastery means another person can create the environment, run tests, execute a small training command, and identify exactly which data and settings produced a model.</p>` },
    ],
  },
];
