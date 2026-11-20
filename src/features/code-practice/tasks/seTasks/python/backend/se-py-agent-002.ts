import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-002', title: 'Agent Runaway and Budget Guard', difficulty: 'Hard', category: 'Agentic AI / Reliability',
  summary: 'Turn an untrusted sequence of proposed agent steps into a bounded execution plan with explicit stop reasons.',
  prompt: 'Implement `guard_plan(steps, limits, completed_ids=())`. Accept only a list of dictionaries with unique non-empty ids, a recognized kind (`model`, `tool`, `approval`), and a non-negative numeric cost. Preserve input order. Stop adding steps when max_steps or max_cost would be exceeded, report the stop reason, reject duplicate ids and malformed records without charging their cost, and skip ids already completed so a resumed run does not repeat work. Return `{accepted, rejected, total_cost, stop_reason}`. This is a planner only: never execute tools, call a model, sleep, or make network requests.',
  tags: ['agentic-ai', 'reliability', 'budgets', 'idempotency'],
  hints: ['Validate limits before processing; fail closed when a limit is missing or invalid.', 'Use a set for both completed and newly seen ids.', 'Check the next step against both limits before adding it.'],
  fixtures: `{"limits":{"max_steps":3,"max_cost":1.0},"steps":[{"id":"m1","kind":"model","cost":0.2},{"id":"t1","kind":"tool","cost":0.3},{"id":"t1","kind":"tool","cost":0.3},{"id":"a1","kind":"approval","cost":0},{"id":"m2","kind":"model","cost":0.7}]}`,
  starter: `"""Bounded agent planning over records; no model or tools are executed."""

VALID_KINDS = {"model", "tool", "approval"}

def guard_plan(steps, limits, completed_ids=()):
    """Return accepted/rejected records, their planned cost, and why planning stopped.

    Each rejected item is {id, reason}. Accepted items preserve the original step dictionaries.
    A resumed step whose id is complete is skipped and does not count against this run's budget.
    """
    # TODO: validate collection and budgets, then process each proposed step safely.
    pass

def run_demo():
    return guard_plan([], {"max_steps": 0, "max_cost": 0})
`,
  solution: `"""Bounded agent planning over records; no model or tools are executed."""
VALID_KINDS = {"model", "tool", "approval"}

def guard_plan(steps, limits, completed_ids=()):
    if not isinstance(steps, list): raise ValueError("steps must be a list")
    if not isinstance(limits, dict): raise ValueError("limits must be an object")
    max_steps, max_cost = limits.get("max_steps"), limits.get("max_cost")
    if not isinstance(max_steps, int) or isinstance(max_steps, bool) or max_steps < 0: raise ValueError("max_steps must be a non-negative integer")
    if not isinstance(max_cost, (int, float)) or isinstance(max_cost, bool) or max_cost < 0: raise ValueError("max_cost must be non-negative")
    done = {x for x in completed_ids if isinstance(x, str)}
    seen = set(done); accepted, rejected = [], []; total = 0.0; stop = None
    for index, step in enumerate(steps):
        if not isinstance(step, dict):
            rejected.append({"id": f"invalid-{index + 1}", "reason": "step must be an object"}); continue
        sid, kind, cost = step.get("id"), step.get("kind"), step.get("cost")
        if not isinstance(sid, str) or not sid.strip() or not isinstance(kind, str) or kind not in VALID_KINDS or not isinstance(cost, (int, float)) or isinstance(cost, bool) or cost < 0:
            rejected.append({"id": sid if isinstance(sid, str) else f"invalid-{index + 1}", "reason": "required fields are invalid"}); continue
        if sid in done: continue
        if sid in seen:
            rejected.append({"id": sid, "reason": "duplicate step id"}); continue
        seen.add(sid)
        if len(accepted) >= max_steps:
            stop = "max_steps"; rejected.append({"id": sid, "reason": "step limit reached"}); break
        if total + cost > max_cost:
            stop = "max_cost"; rejected.append({"id": sid, "reason": "cost limit reached"}); break
        accepted.append(step); total += cost
    return {"accepted": accepted, "rejected": rejected, "total_cost": round(total, 10), "stop_reason": stop}

def run_demo():
    return guard_plan([], {"max_steps": 0, "max_cost": 0})
`,
  testCode: `from project import guard_plan
steps = [{"id":"m1","kind":"model","cost":0.2},{"id":"t1","kind":"tool","cost":0.3},{"id":"t1","kind":"tool","cost":0.3},{"id":"a1","kind":"approval","cost":0},{"id":"m2","kind":"model","cost":0.7}]
r = guard_plan(steps, {"max_steps":5,"max_cost":0.9})
checks = [("bounded accepted steps", [x["id"] for x in r["accepted"]] == ["m1","t1","a1"]), ("duplicate rejected", any(x["reason"] == "duplicate step id" for x in r["rejected"])), ("budget stops plan", r["stop_reason"] == "max_cost"), ("cost exact", abs(r["total_cost"] - 0.5) < 1e-9), ("resume skips completed", [x["id"] for x in guard_plan(steps, {"max_steps":5,"max_cost":0.9}, {"m1"})["accepted"]] == ["t1","a1"]), ("invalid records isolated", guard_plan([None], {"max_steps":2,"max_cost":1})["rejected"][0]["id"] == "invalid-1")]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
