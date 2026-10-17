import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-002', title: 'API Contract Compatibility Gate', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'Compare two compact API contracts and classify changes that could break existing clients before a release ships.',
  prompt: 'Implement `compare_contracts(old, new)`. Contracts map operation names to request and response field definitions. Report removed operations, removed response fields, changed response types, and newly required request fields as breaking. Report added optional response fields and new operations as compatible. Validate malformed definitions, return deterministic structured changes, and include a summary with `breaking` true or false. This is an offline contract checker over JSON-shaped data; do not inspect production traffic or publish SDKs.',
  tags: ['api', 'schema', 'compatibility', 'release-engineering'],
  hints: ['Compare each old operation against the new contract first; additions are a separate pass.', 'A newly required request field breaks callers that do not send it.', 'Sort changes by operation, field, and change kind so CI output is stable.'],
  fixtures: `{"old":{"GET /users":{"request":{"fields":{"page":"integer"},"required":[]},"response":{"fields":{"id":"integer","name":"string"}}}},"new":{"GET /users":{"request":{"fields":{"page":"integer","region":"string"},"required":["region"]},"response":{"fields":{"id":"integer","name":"string","email":"string"}}},"GET /health":{"request":{"fields":{},"required":[]},"response":{"fields":{"ok":"boolean"}}}}}`,
  starter: `"""Offline API contract comparison; no network or schema publication."""

def _validate_contract(contract):
    """Validate operation -> {request:{fields,required}, response:{fields}} shape."""
    # TODO: reject wrong container types and required fields absent from request.fields.
    pass

def compare_contracts(old, new):
    """Return {breaking: bool, changes: [...]} with stable, human-readable change records.

    Breaking changes: operation removed; response field removed or type changed; request field
    added to required. Compatible changes: a new operation or optional response field. Include kind,
    operation, field (empty string where irrelevant), and breaking boolean per change.
    """
    # TODO: validate both versions, compare removed/changed items, then compare additions.
    pass

def render_summary(result):
    # TODO: summarize breaking vs compatible counts without implying runtime behavior was tested.
    pass

def run_demo():
    return render_summary(compare_contracts({}, {}))
`,
  solution: `"""Offline API contract comparison; no network or schema publication."""

def _validate_contract(contract):
    if not isinstance(contract, dict):
        raise ValueError("contract must be an object")
    for operation, spec in contract.items():
        if not isinstance(operation, str) or not isinstance(spec, dict):
            raise ValueError("each operation must map to an object")
        for side in ("request", "response"):
            section = spec.get(side)
            if not isinstance(section, dict) or not isinstance(section.get("fields"), dict):
                raise ValueError(f"{operation}: {side}.fields must be an object")
        required = spec["request"].get("required", [])
        if not isinstance(required, list) or any(name not in spec["request"]["fields"] for name in required):
            raise ValueError(f"{operation}: required must name request fields")

def compare_contracts(old, new):
    _validate_contract(old)
    _validate_contract(new)
    changes = []
    def add(kind, operation, field="", breaking=False):
        changes.append({"kind": kind, "operation": operation, "field": field, "breaking": breaking})
    for operation, old_spec in old.items():
        if operation not in new:
            add("operation_removed", operation, breaking=True)
            continue
        new_spec = new[operation]
        old_response, new_response = old_spec["response"]["fields"], new_spec["response"]["fields"]
        for field, old_type in old_response.items():
            if field not in new_response:
                add("response_field_removed", operation, field, True)
            elif new_response[field] != old_type:
                add("response_type_changed", operation, field, True)
        old_required = set(old_spec["request"].get("required", []))
        new_required = set(new_spec["request"].get("required", []))
        for field in sorted(new_required - old_required):
            add("request_field_became_required", operation, field, True)
        for field in sorted(set(new_response) - set(old_response)):
            add("response_field_added", operation, field, False)
    for operation in sorted(set(new) - set(old)):
        add("operation_added", operation, breaking=False)
    changes.sort(key=lambda change: (change["operation"], change["field"], change["kind"]))
    return {"breaking": any(change["breaking"] for change in changes), "changes": changes}

def render_summary(result):
    breaking = sum(change["breaking"] for change in result["changes"])
    compatible = len(result["changes"]) - breaking
    status = "BLOCK RELEASE: breaking changes found" if breaking else "No breaking changes detected"
    return f"{status}\\nBreaking: {breaking}\\nCompatible: {compatible}\\nStatic contract comparison only; runtime compatibility was not tested."

def run_demo():
    return render_summary(compare_contracts({}, {}))
`,
  testCode: `from project import compare_contracts, render_summary
old = {"GET /u":{"request":{"fields":{"page":"int"},"required":[]},"response":{"fields":{"id":"int","name":"str"}}},"DELETE /u/{id}":{"request":{"fields":{},"required":[]},"response":{"fields":{"ok":"bool"}}}}
new = {"GET /u":{"request":{"fields":{"page":"int","region":"str"},"required":["region"]},"response":{"fields":{"id":"int","name":"str","email":"str"}}},"POST /u":{"request":{"fields":{},"required":[]},"response":{"fields":{"id":"int"}}}}
r = compare_contracts(old, new)
kinds = {c["kind"] for c in r["changes"]}
checks = [("breaking detected", r["breaking"] is True), ("operation removed", "operation_removed" in kinds), ("required request addition", "request_field_became_required" in kinds), ("optional response addition", "response_field_added" in kinds), ("new operation compatible", any(c["kind"] == "operation_added" and not c["breaking"] for c in r["changes"])), ("stable ordering", r["changes"] == sorted(r["changes"], key=lambda c:(c["operation"],c["field"],c["kind"]))), ("runtime caveat", "not tested" in render_summary(r))]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
try: compare_contracts({"x":{"request":{"fields":{},"required":["missing"]},"response":{"fields":{}}}}, {})
except ValueError: valid = True
else: valid = False
checks.append(("malformed contract rejected", valid))
for name, ok in checks[-1:]: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
