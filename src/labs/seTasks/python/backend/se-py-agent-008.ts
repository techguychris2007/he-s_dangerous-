import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-008', title: 'Cloud FinOps Recommendation Engine', difficulty: 'Medium', category: 'Agentic AI / Cloud Operations',
  summary: 'Estimate potential savings from fictional resource utilization records and produce review-only recommendations.',
  prompt: 'Implement `recommend_savings(resources, thresholds)`. Flag a resource only when it has a minimum observation window and utilization remains below the supplied threshold. Calculate a transparent monthly estimate from the supplied hourly cost and hours/month, label confidence from sample duration, and exclude protected/production-critical resources from automatic recommendations. Every recommendation must be `proposal_only`; never resize, stop, or delete a resource.',
  tags: ['agentic-ai', 'finops', 'cloud', 'human-approval'],
  hints: ['Check utilization bounds and cost values before calculations.', 'Missing observations should lower confidence or prevent a recommendation.', 'The output is a cost estimate, not a savings guarantee.'],
  fixtures: `{"resources":[{"id":"dev-1","environment":"development","avg_utilization":0.08,"observed_days":30,"hourly_cost":0.5,"protected":false},{"id":"prod-db","environment":"production","avg_utilization":0.04,"observed_days":30,"hourly_cost":2.0,"protected":true}]}`,
  starter: `"""FinOps estimator over sample records. It does not modify cloud resources."""
def recommend_savings(resources, thresholds):
    """Return review-only cost estimates; do not treat them as guaranteed savings."""
    # TODO: validate utilization, observation duration and hourly cost.
    # TODO: exclude protected production records and mark every result proposal_only.
    pass

def run_demo(): return recommend_savings([], {})
`,
  solution: `"""FinOps estimator over sample records. It does not modify cloud resources."""
def recommend_savings(resources,thresholds):
    if not isinstance(resources,list): raise ValueError("resources must be a list")
    threshold=thresholds.get("max_utilization",0.15) if isinstance(thresholds,dict) else 0.15
    min_days=thresholds.get("min_observed_days",14) if isinstance(thresholds,dict) else 14
    out=[]
    for r in resources:
        if not isinstance(r,dict): continue
        util,days,cost=r.get("avg_utilization"),r.get("observed_days"),r.get("hourly_cost")
        if not isinstance(util,(int,float)) or not 0 <= util <= 1 or not isinstance(days,int) or not isinstance(cost,(int,float)) or cost < 0: continue
        if r.get("protected") or days < min_days or util >= threshold: continue
        out.append({"resource_id":r.get("id"),"estimated_monthly_cost":round(cost*730,2),"confidence":"high" if days>=30 else "medium","reason":f"Average utilization {util:.0%} over {days} days is below {threshold:.0%}.","status":"proposal_only"})
    return sorted(out,key=lambda x:x["resource_id"] or "")
def run_demo(): return recommend_savings([], {})
`,
  testCode: `from project import recommend_savings
rows=[{"id":"dev","avg_utilization":.08,"observed_days":30,"hourly_cost":.5},{"id":"prod","avg_utilization":.01,"observed_days":30,"hourly_cost":2,"protected":True},{"id":"short","avg_utilization":.01,"observed_days":2,"hourly_cost":1}]
r=recommend_savings(rows,{"max_utilization":.15,"min_observed_days":14})
checks=[("low-use dev flagged",len(r)==1 and r[0]["resource_id"]=="dev"), ("monthly estimate computed",r[0]["estimated_monthly_cost"]==365), ("protected resource excluded",all(x["resource_id"]!="prod" for x in r)), ("short observation excluded",all(x["resource_id"]!="short" for x in r)), ("proposal only",r[0]["status"]=="proposal_only")]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
