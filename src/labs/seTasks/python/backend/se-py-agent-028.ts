import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-028',title:'Research Evidence Synthesis',difficulty:'Hard',category:'Agentic AI / Business Workflows',summary:'Compare supplied research summaries and preserve citations, limitations, and disagreements.',
  prompt:'Implement `synthesize_papers(papers)`. Validate source identifiers, topic, claim, and limitations; group claims by topic; list agreements or conflicts without resolving them by guesswork. Every statement must cite supplied source ids. Do not fetch papers or invent results.',
  tags:['agentic-ai','research','citations'],hints:['Cite only supplied source ids.','Keep conflicting claims visible.','Treat absent methods as unknown.'],fixtures:`{"papers":[{"id":"P1","topic":"latency","claim":"Caching reduced p95 latency","limitations":"single region"},{"id":"P2","topic":"latency","claim":"Caching had no material effect","limitations":"small sample"}]}`,
  starter:`"""Synthesize supplied paper records without fetching sources."""
def synthesize_papers(papers):
    # TODO: group claims, retain citations and limitations, and do not choose a winner.
    pass
def run_demo(): return synthesize_papers([])
`,
  solution:`def synthesize_papers(papers):
    if not isinstance(papers,list): raise ValueError("papers must be a list")
    groups={}; warnings=[]
    for p in papers:
        if not isinstance(p,dict) or not all(isinstance(p.get(k),str) and p[k] for k in ("id","topic","claim")): warnings.append("Paper record missing evidence."); continue
        groups.setdefault(p["topic"],[]).append(p)
    topics=[]
    for topic,rows in sorted(groups.items()):
        rows=sorted(rows,key=lambda x:x["id"]); topics.append({"topic":topic,"claims":[{"source_id":p["id"],"claim":p["claim"],"limitations":p.get("limitations","not provided")} for p in rows],"synthesis":"Compare these claims; supplied evidence does not establish which is correct."})
    return {"topics":topics,"warnings":warnings,"sources_used":[p["source_id"] for g in topics for p in g["claims"]]}
def run_demo(): return synthesize_papers([])
`,
  testCode:`from project import synthesize_papers
r=synthesize_papers([{"id":"P1","topic":"latency","claim":"improved","limitations":"one region"},{"id":"P2","topic":"latency","claim":"no change"}])
checks=[("topic grouped",len(r["topics"])==1),("claims preserved",len(r["topics"][0]["claims"])==2),("citations present",r["sources_used"]==["P1","P2"]),("limitations retained",r["topics"][0]["claims"][0]["limitations"]=="one region"),("uncertainty retained","does not establish" in r["topics"][0]["synthesis"])]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
