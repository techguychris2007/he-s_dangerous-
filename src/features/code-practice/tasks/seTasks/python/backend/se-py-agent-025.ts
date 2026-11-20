import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-025',title:'Product Brief to PRD Outline',difficulty:'Medium',category:'Agentic AI / Business Workflows',
  summary:'Convert an unstructured product brief into traceable requirements and explicit open questions.',
  prompt:'Implement `draft_prd(brief)`. Use supplied problem, users, constraints, and capabilities to create numbered functional requirements with testable acceptance criteria. Preserve traceability to the brief; flag missing success metrics, security requirements, and operational constraints as questions instead of inventing answers. Return a draft for review.',
  tags:['agentic-ai','product-management','requirements','traceability'],hints:['Requirements should be testable and linked to supplied facts.','Put missing facts in open questions.','Do not invent dates, budget, or regulations.'],
  fixtures:`{"problem":"Teams miss expiring certificates","users":["platform engineers"],"capabilities":["track certificate expiry","send reminders"]}`,
  starter:`"""Create a reviewable PRD outline from user-supplied brief details."""
def draft_prd(brief):
    # TODO: add traceable requirements and surface missing details as questions.
    pass
def run_demo(): return draft_prd({})
`,
  solution:`def draft_prd(brief):
    if not isinstance(brief,dict): raise ValueError("brief must be an object")
    caps=brief.get("capabilities",[]) if isinstance(brief.get("capabilities",[]),list) else []
    req=[{"id":f"FR-{i:02d}","statement":f"The product shall {x.strip()}.","acceptance":"A reviewer can verify this capability in a documented test.","source":"capabilities"} for i,x in enumerate(caps,1) if isinstance(x,str) and x.strip()]
    questions=[q for key,q in (("success_metrics","What measurable outcome defines success?"),("security","What security and access requirements apply?"),("operations","Who operates the service and what availability is expected?")) if not brief.get(key)]
    return {"problem":brief.get("problem",""),"users":brief.get("users",[]),"requirements":req,"constraints":brief.get("constraints",[]),"open_questions":questions,"status":"draft_for_review"}
def run_demo(): return draft_prd({})
`,
  testCode:`from project import draft_prd
r=draft_prd({"problem":"x","users":["analyst"],"capabilities":["export reports","filter alerts"]})
checks=[("requirements created",len(r["requirements"])==2),("stable ids",r["requirements"][0]["id"]=="FR-01"),("acceptance supplied",bool(r["requirements"][0]["acceptance"])),("missing context questioned",len(r["open_questions"])==3),("draft marked",r["status"]=="draft_for_review")]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
