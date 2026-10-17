import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-009', title: 'CI Repair Proposal Generator', difficulty: 'Hard', category: 'Agentic AI / Developer Operations',
  summary: 'Map known CI failure evidence to small configuration proposals while preserving a human review and rerun boundary.',
  prompt: 'Implement `propose_ci_fixes(log_lines, workflow)`. Classify a bounded set of known failures (missing dependency, lint violation, flaky timeout, test assertion), cite the exact log line, and draft a minimal workflow change only when a deterministic fix is clear. Never edit workflow files or automatically rerun a pipeline. Mark uncertain failures for engineer investigation and include the reason the proposed change could be unsafe.',
  tags: ['agentic-ai', 'ci-cd', 'diagnostics', 'human-review'],
  hints: ['The workflow is evidence, not executable input.', 'Do not propose retry loops for deterministic assertion failures.', 'Every proposed edit needs a file/section and a human-review status.'],
  fixtures: `{"logs":["ModuleNotFoundError: No module named 'yaml'","pytest AssertionError: expected 2 got 1","timeout after 30 seconds"],"workflow":{"file":".github/workflows/test.yml","install":"pip install pytest"}}`,
  starter: `"""Diagnose sample CI failures and draft changes; never edit or rerun CI."""
def propose_ci_fixes(log_lines, workflow):
    """Return evidence-linked diagnoses and optional approval-gated proposals."""
    # TODO: classify only recognized evidence and cite its source line.
    # TODO: propose deterministic dependency/lint changes; investigate ambiguous failures.
    pass

def run_demo(): return propose_ci_fixes([], {})
`,
  solution: `"""Diagnose sample CI failures and draft changes; never edit or rerun CI."""
def propose_ci_fixes(log_lines,workflow):
    if not isinstance(log_lines,list): raise ValueError("log_lines must be a list")
    out=[]
    for number,line in enumerate(log_lines,1):
        if not isinstance(line,str): continue
        text=line.lower(); kind="unknown"; proposal=None; risk="Evidence is insufficient for a safe automatic change."
        if "modulenotfounderror" in text or "no module named" in text:
            kind="missing_dependency"; module=line.split("No module named",1)[-1].strip().strip("'.") if "No module named" in line else "unknown"
            proposal={"file":workflow.get("file") if isinstance(workflow,dict) else None,"suggestion":f"Add the confirmed dependency {module} to the project's declared dependency file."}; risk="Verify the dependency name and pinning policy before editing."
        elif "lint" in text and ("failed" in text or "error" in text): kind="lint_failure"
        elif "timeout" in text: kind="timeout"; risk="A retry could hide a real performance regression; inspect timing evidence first."
        elif "assertionerror" in text: kind="test_assertion"; risk="Update behavior only after confirming the product requirement; do not weaken the test."
        out.append({"line":number,"evidence":line,"category":kind,"proposal":proposal,"risk":risk,"status":"human_review_required"})
    return {"diagnoses":out,"edited_files":[],"pipeline_rerun":False}
def run_demo(): return propose_ci_fixes([], {})
`,
  testCode: `from project import propose_ci_fixes
r=propose_ci_fixes(["ModuleNotFoundError: No module named 'yaml'","pytest AssertionError","timeout after 30s"],{"file":"ci.yml"})
checks=[("dependency classified",r["diagnoses"][0]["category"]=="missing_dependency"), ("proposal points to workflow",r["diagnoses"][0]["proposal"]["file"]=="ci.yml"), ("assertion not weakened",r["diagnoses"][1]["proposal"] is None), ("uncertain timeout reviewed",r["diagnoses"][2]["status"]=="human_review_required"), ("no writes or reruns",r["edited_files"]==[] and not r["pipeline_rerun"])]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
