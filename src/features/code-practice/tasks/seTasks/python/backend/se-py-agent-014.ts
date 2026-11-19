import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-014', title: 'Zero-Trust Policy Minimizer', difficulty: 'Hard', category: 'Agentic AI / Network Security',
  summary: 'Derive least-privilege service communication rules from observed sample flows and an explicit service inventory.',
  prompt: 'Implement `minimize_policy(services, flows)`. Validate that both ends of each observed flow exist in the inventory, aggregate repeated flows, and produce a proposed allow rule only for observed source/destination/port/protocol tuples. Unknown flows become review findings; unobserved service pairs stay denied. Return an explicit default-deny policy and require owner approval for every generated rule. Do not connect to a service mesh or apply firewall/mTLS configuration.',
  tags: ['agentic-ai', 'zero-trust', 'network-policy', 'least-privilege'],
  hints: ['Observed traffic is evidence for review, not proof that access is needed.', 'Normalize protocol names and deduplicate stable tuples.', 'Make default deny explicit in the returned structure.'],
  fixtures: `{"services":["web","api","db"],"flows":[{"source":"web","destination":"api","port":443,"protocol":"TCP"},{"source":"api","destination":"db","port":5432,"protocol":"tcp"}]}`,
  starter: `"""Draft a least-privilege service policy from fixture traffic; never apply it."""
def minimize_policy(services, flows):
    """Return default-deny policy, observed rule proposals, and unknown-flow findings."""
    # TODO: validate the inventory and observed flow tuple fields.
    # TODO: normalize/deduplicate rules and keep every proposal approval-gated.
    pass

def run_demo(): return minimize_policy([], [])
`,
  solution: `"""Draft a least-privilege service policy from fixture traffic; never apply it."""
def minimize_policy(services,flows):
    known=set(x for x in services if isinstance(x,str)) if isinstance(services,list) else set(); rules=set(); findings=[]
    if not isinstance(flows,list): raise ValueError("flows must be a list")
    for i,f in enumerate(flows):
        if not isinstance(f,dict): findings.append({"index":i,"reason":"invalid flow record"}); continue
        src,dst,port,proto=f.get("source"),f.get("destination"),f.get("port"),f.get("protocol")
        if src not in known or dst not in known: findings.append({"index":i,"reason":"flow references unknown service"}); continue
        if not isinstance(port,int) or isinstance(port,bool) or not 1<=port<=65535 or not isinstance(proto,str): findings.append({"index":i,"reason":"invalid port or protocol"}); continue
        rules.add((src,dst,port,proto.lower()))
    proposals=[{"source":s,"destination":d,"port":p,"protocol":proto,"requires_owner_approval":True} for s,d,p,proto in sorted(rules)]
    return {"default":"deny","allow_proposals":proposals,"findings":findings,"applied":False}
def run_demo(): return minimize_policy([], [])
`,
  testCode: `from project import minimize_policy
r=minimize_policy(["web","api","db"],[{"source":"web","destination":"api","port":443,"protocol":"TCP"},{"source":"web","destination":"api","port":443,"protocol":"tcp"},{"source":"ghost","destination":"db","port":5432,"protocol":"tcp"}])
checks=[("default deny",r["default"]=="deny"), ("duplicate flows collapsed",len(r["allow_proposals"])==1), ("rule gated",r["allow_proposals"][0]["requires_owner_approval"]), ("unknown flow surfaced",len(r["findings"])==1), ("policy not applied",not r["applied"])]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
