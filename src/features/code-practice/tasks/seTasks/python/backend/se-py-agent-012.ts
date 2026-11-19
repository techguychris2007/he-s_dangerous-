import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-012', title: 'Kubernetes Event Triage Copilot', difficulty: 'Hard', category: 'Agentic AI / Cloud Operations',
  summary: 'Summarize synthetic cluster events and recommend the next diagnostic check without changing workloads.',
  prompt: 'Implement `triage_events(events)`. Validate timestamp, namespace, workload, reason, and message; group repeated events by workload/reason; explain common CrashLoopBackOff, OOMKilled, ImagePullBackOff, and scheduling failures; and list the next read-only evidence to inspect. Include counts and evidence event ids. Any restart, scaling, or resource-limit change must appear only as an approval-gated proposal, and this task must never execute `kubectl`.',
  tags: ['agentic-ai', 'kubernetes', 'incident-triage', 'read-only'],
  hints: ['Use known reason codes; keep unknown reasons visible as unknown.', 'Group to reduce noise but preserve all event ids.', 'A remediation recommendation needs evidence and an approval requirement.'],
  fixtures: `{"events":[{"id":"k1","namespace":"payments","workload":"api-7","reason":"BackOff","message":"Back-off restarting failed container"},{"id":"k2","namespace":"payments","workload":"api-7","reason":"OOMKilled","message":"Container exceeded memory limit"}]}`,
  starter: `"""Read-only Kubernetes event triage over synthetic records."""
CAUSES = {"BackOff": "Inspect the previous container logs and startup probes.", "OOMKilled": "Compare memory use with the configured request and limit.", "ImagePullBackOff": "Verify the image reference and registry access configuration."}

def triage_events(events):
    """Group event evidence and return diagnostic checks plus gated proposals."""
    # TODO: validate rows, group by namespace/workload/reason, and retain event ids.
    # TODO: map known reasons to read-only checks; keep unknown reasons explicit.
    pass

def run_demo(): return triage_events([])
`,
  solution: `"""Read-only Kubernetes event triage over synthetic records."""
CAUSES={"BackOff":"Inspect previous container logs and startup probes.","OOMKilled":"Compare memory use with configured request and limit.","ImagePullBackOff":"Verify image reference and registry access configuration.","FailedScheduling":"Review node capacity, selectors, taints, and affinity."}
def triage_events(events):
    if not isinstance(events,list): raise ValueError("events must be a list")
    groups={}; warnings=[]
    for e in events:
        if not isinstance(e,dict) or not all(isinstance(e.get(k),str) and e[k] for k in ("id","namespace","workload","reason")):
            warnings.append("Invalid event ignored."); continue
        key=(e["namespace"],e["workload"],e["reason"]); groups.setdefault(key,[]).append(e)
    reports=[]
    for (ns,workload,reason),rows in sorted(groups.items()):
        reports.append({"namespace":ns,"workload":workload,"reason":reason,"count":len(rows),"event_ids":sorted(e["id"] for e in rows),"diagnosis":CAUSES.get(reason,"Unknown event reason; inspect related pod and controller events."),"next_checks":["Review timestamped events and pod status.","Inspect logs and metrics for this workload."],"proposal":{"action":"operator_review_before_any_change","requires_approval":True}})
    return {"groups":reports,"warnings":warnings,"commands_executed":[]}
def run_demo(): return triage_events([])
`,
  testCode: `from project import triage_events
r=triage_events([{"id":"1","namespace":"n","workload":"api","reason":"OOMKilled"},{"id":"2","namespace":"n","workload":"api","reason":"OOMKilled"},{"id":"3","namespace":"n","workload":"worker","reason":"NewReason"},None])
checks=[("events grouped",r["groups"][0]["count"]==2), ("evidence retained",r["groups"][0]["event_ids"]==["1","2"]), ("known reason explained","memory" in r["groups"][0]["diagnosis"].lower()), ("unknown reason surfaced",r["groups"][1]["diagnosis"].startswith("Unknown")), ("no commands executed",r["commands_executed"]==[]), ("bad event warning",len(r["warnings"])==1)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
