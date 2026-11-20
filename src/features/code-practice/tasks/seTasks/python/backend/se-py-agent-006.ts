import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-006', title: 'Agent Trace and Loop Inspector', difficulty: 'Medium', category: 'Agentic AI / Observability',
  summary: 'Analyze a saved agent trace for repeated tool calls, failed steps, latency, token use, and budget anomalies.',
  prompt: 'Implement `inspect_trace(events, limits)`. Each synthetic event includes `run_id`, `step_id`, `kind`, `tool` (optional), `status`, `latency_ms`, and `tokens`. Validate each record, aggregate metrics per run, detect a tool called with the same normalized arguments more than once, identify failed steps and configured latency/token budget overruns, and produce deterministic findings with supporting step ids. Do not execute any event or transmit telemetry. Keep a malformed row from breaking the rest of the report.',
  tags: ['agentic-ai', 'observability', 'tracing', 'reliability'],
  hints: ['Use a canonical JSON serialization with sorted keys to compare tool arguments.', 'Aggregate only validated non-negative numeric metrics.', 'Keep findings ordered by run id, finding type, and step id.'],
  fixtures: `{"events":[{"run_id":"r1","step_id":"s1","kind":"tool","tool":"search","arguments":{"q":"docs"},"status":"ok","latency_ms":40,"tokens":0},{"run_id":"r1","step_id":"s2","kind":"tool","tool":"search","arguments":{"q":"docs"},"status":"error","latency_ms":260,"tokens":0},{"run_id":"r1","step_id":"s3","kind":"model","status":"ok","latency_ms":80,"tokens":900}]}`,
  starter: `"""Local-only analyzer for synthetic agent execution traces."""

import json

def inspect_trace(events, limits):
    """Return per-run metrics and deterministic findings with evidence step ids."""
    # TODO: validate rows, aggregate metrics, detect repeated calls/failures/budget overruns.
    pass

def run_demo():
    return inspect_trace([], {"max_latency_ms": 1000, "max_tokens": 2000})
`,
  solution: `"""Local-only analyzer for synthetic agent execution traces."""
import json

def inspect_trace(events, limits):
    if not isinstance(events, list): raise ValueError("events must be a list")
    if not isinstance(limits, dict): limits = {}
    max_latency = limits.get("max_latency_ms", float("inf")); max_tokens = limits.get("max_tokens", float("inf"))
    runs, warnings, calls = {}, [], {}
    for index, event in enumerate(events):
        if not isinstance(event, dict): warnings.append(f"Record {index + 1} ignored: expected object."); continue
        run, step, kind, status = event.get("run_id"), event.get("step_id"), event.get("kind"), event.get("status")
        latency, tokens = event.get("latency_ms", 0), event.get("tokens", 0)
        if not all(isinstance(x, str) and x for x in (run, step, kind, status)) or not isinstance(latency, (int,float)) or isinstance(latency,bool) or latency < 0 or not isinstance(tokens, (int,float)) or isinstance(tokens,bool) or tokens < 0:
            warnings.append(f"Record {index + 1} ignored: required fields are invalid."); continue
        aggregate = runs.setdefault(run, {"run_id":run,"steps":[],"latency_ms":0,"tokens":0,"findings":[]})
        aggregate["steps"].append(step); aggregate["latency_ms"] += latency; aggregate["tokens"] += tokens
        if status.lower() in ("error", "failed"):
            aggregate["findings"].append({"type":"failed_step","steps":[step],"detail":"Step reported failure."})
        if kind == "tool" and isinstance(event.get("tool"), str):
            try: args = json.dumps(event.get("arguments", {}), sort_keys=True, separators=(",", ":"))
            except (TypeError, ValueError): args = "<invalid>"
            key = (run, event["tool"].strip().lower(), args); calls.setdefault(key, []).append(step)
    for (run, tool, args), steps in calls.items():
        if len(steps) > 1: runs[run]["findings"].append({"type":"repeated_tool_call","steps":sorted(steps),"detail":f"Tool {tool} received identical arguments more than once."})
    output = []
    for run in sorted(runs):
        item = runs[run]
        if isinstance(max_latency, (int,float)) and item["latency_ms"] > max_latency: item["findings"].append({"type":"latency_budget_exceeded","steps":sorted(item["steps"]),"detail":"Run latency exceeds the configured budget."})
        if isinstance(max_tokens, (int,float)) and item["tokens"] > max_tokens: item["findings"].append({"type":"token_budget_exceeded","steps":sorted(item["steps"]),"detail":"Run token use exceeds the configured budget."})
        item["steps"] = sorted(item["steps"]); item["findings"].sort(key=lambda f: (f["type"], f["steps"]))
        output.append(item)
    return {"runs":output,"warnings":warnings}

def run_demo():
    return inspect_trace([], {"max_latency_ms": 1000, "max_tokens": 2000})
`,
  testCode: `from project import inspect_trace
events = [{"run_id":"r1","step_id":"s1","kind":"tool","tool":"search","arguments":{"q":"docs"},"status":"ok","latency_ms":40,"tokens":0},{"run_id":"r1","step_id":"s2","kind":"tool","tool":"search","arguments":{"q":"docs"},"status":"error","latency_ms":260,"tokens":0},{"run_id":"r1","step_id":"s3","kind":"model","status":"ok","latency_ms":80,"tokens":900},None]
r = inspect_trace(events, {"max_latency_ms":300,"max_tokens":800})
findings = r["runs"][0]["findings"]
checks = [("valid rows aggregated", r["runs"][0]["steps"] == ["s1","s2","s3"]), ("malformed row isolated", len(r["warnings"]) == 1), ("repeat detected", any(f["type"] == "repeated_tool_call" for f in findings)), ("failed step detected", any(f["type"] == "failed_step" and f["steps"] == ["s2"] for f in findings)), ("token budget detected", any(f["type"] == "token_budget_exceeded" for f in findings)), ("latency budget detected", any(f["type"] == "latency_budget_exceeded" for f in findings))]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
