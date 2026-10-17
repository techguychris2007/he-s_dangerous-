import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-020', title: 'Server Log Fingerprint Clusterer', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Reduce repeated sample errors into stable message fingerprints while preserving counts and representative evidence.',
  prompt: 'Implement `cluster_logs(lines)`. Normalize timestamps, request ids, and numeric values into placeholders while preserving message structure; group identical fingerprints; retain the count and up to three original line numbers as evidence. Sort clusters by count descending and fingerprint. Malformed or non-string lines must be reported safely. Do not infer root cause from similarity alone.',
  tags: ['agentic-ai', 'logs', 'clustering', 'observability'],
  hints: ['Normalize only volatile tokens; keep meaningful error words.', 'Never discard line numbers used to support a cluster.', 'Describe a cluster as a similarity signal, not a verified cause.'],
  fixtures: `{"lines":["2026-01-02T10:00:00Z ERROR request=abc timeout after 30 seconds","2026-01-02T10:01:00Z ERROR request=def timeout after 30 seconds","2026-01-02T10:02:00Z WARN cache miss"]}`,
  starter: `"""Cluster similar log records deterministically without claiming root cause."""
import re

def cluster_logs(lines):
    """Return message fingerprints, counts, evidence line numbers, and warnings."""
    # TODO: normalize timestamps/request ids/numeric values while retaining message meaning.
    # TODO: group by fingerprint and sort deterministically.
    pass

def run_demo(): return cluster_logs([])
`,
  solution: `"""Cluster similar log records deterministically without claiming root cause."""
import re
def cluster_logs(lines):
    if not isinstance(lines,list): raise ValueError("lines must be a list")
    groups={}; warnings=[]
    for number,line in enumerate(lines,1):
        if not isinstance(line,str): warnings.append({"line":number,"reason":"not text"}); continue
        text=re.sub(r"\\b\\d{4}-\\d\\d-\\d\\dT\\S+","<TIME>",line)
        text=re.sub(r"(?i)request=[A-Za-z0-9_-]+","request=<ID>",text)
        text=re.sub(r"\\b\\d+\\b","<N>",text)
        fingerprint=" ".join(text.split()).strip()
        group=groups.setdefault(fingerprint,{"fingerprint":fingerprint,"count":0,"evidence_lines":[]})
        group["count"]+=1
        if len(group["evidence_lines"])<3: group["evidence_lines"].append(number)
    clusters=sorted(groups.values(),key=lambda x:(-x["count"],x["fingerprint"]))
    return {"clusters":clusters,"warnings":warnings,"interpretation":"Similarity helps triage; it does not establish a shared root cause."}
def run_demo(): return cluster_logs([])
`,
  testCode: `from project import cluster_logs
r=cluster_logs(["2026-01-02T10:00:00Z ERROR request=abc timeout after 30 seconds","2026-01-02T10:01:00Z ERROR request=def timeout after 30 seconds","WARN cache miss"])
checks=[("similar events grouped",r["clusters"][0]["count"]==2), ("evidence lines retained",r["clusters"][0]["evidence_lines"]==[1,2]), ("different message separate",len(r["clusters"])==2), ("root cause caveat stated","does not establish" in r["interpretation"]), ("malformed line warned",len(cluster_logs([None])["warnings"])==1)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
