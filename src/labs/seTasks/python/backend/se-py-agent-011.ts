import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-011', title: 'Infrastructure Drift Review', difficulty: 'Hard', category: 'Agentic AI / Cloud Operations',
  summary: 'Compare fictional desired and observed infrastructure records and draft an auditable correction plan.',
  prompt: 'Implement `compare_state(desired, observed)`. Compare resources by stable id and field, distinguish missing, unexpected, and changed resources, and produce deterministic field-level diffs. Suggest a corrective change only for fields explicitly present in desired state. Every change is a draft requiring an operator review; never connect to a cloud account, apply Terraform, or overwrite state.',
  tags: ['agentic-ai', 'iac', 'drift-detection', 'cloud'],
  hints: ['Do not compare secret values in a way that prints them.', 'Sort resource ids and fields for a stable report.', 'Represent unexpected resources separately; do not silently delete them.'],
  fixtures: `{"desired":[{"id":"api","type":"service","region":"eu-west","replicas":3}],"observed":[{"id":"api","type":"service","region":"eu-west","replicas":1},{"id":"legacy","type":"database","region":"eu-west"}]}`,
  starter: `"""Compare supplied infrastructure snapshots without accessing or changing cloud state."""
def compare_state(desired, observed):
    """Return field diffs, missing/unexpected resources and review-only proposals."""
    # TODO: validate and index records by id, then compare stable fields.
    # TODO: create proposals with explicit review gates; never apply a change.
    pass

def run_demo(): return compare_state([], [])
`,
  solution: `"""Compare supplied infrastructure snapshots without accessing or changing cloud state."""
def compare_state(desired,observed):
    if not isinstance(desired,list) or not isinstance(observed,list): raise ValueError("snapshots must be lists")
    def index(rows):
        out={}
        for row in rows:
            if isinstance(row,dict) and isinstance(row.get("id"),str): out[row["id"]]=row
        return out
    want,have=index(desired),index(observed); diffs=[]; proposals=[]
    for rid in sorted(want.keys()|have.keys()):
        if rid not in have: diffs.append({"id":rid,"kind":"missing"}); proposals.append({"id":rid,"action":"create_from_desired","requires_review":True}); continue
        if rid not in want: diffs.append({"id":rid,"kind":"unexpected","observed_type":have[rid].get("type")}); continue
        fields=[]
        for key in sorted((want[rid].keys()|have[rid].keys())-{"id"}):
            if want[rid].get(key)!=have[rid].get(key): fields.append({"field":key,"desired":want[rid].get(key),"observed":have[rid].get(key)})
        if fields:
            diffs.append({"id":rid,"kind":"changed","fields":fields}); proposals.append({"id":rid,"action":"review_field_changes","fields":fields,"requires_review":True})
    return {"diffs":diffs,"proposals":proposals,"applied":False}
def run_demo(): return compare_state([], [])
`,
  testCode: `from project import compare_state
r=compare_state([{"id":"api","replicas":3},{"id":"new","type":"service"}],[{"id":"api","replicas":1},{"id":"old","type":"db"}])
kinds={x["kind"] for x in r["diffs"]}
checks=[("changed state detected","changed" in kinds), ("missing state detected","missing" in kinds), ("unexpected state detected","unexpected" in kinds), ("change proposals gated",all(x["requires_review"] for x in r["proposals"])), ("no apply performed",r["applied"] is False)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
