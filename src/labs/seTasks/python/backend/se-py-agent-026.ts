import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-026',title:'Contract Clause Playbook Reviewer',difficulty:'Hard',category:'Agentic AI / Business Workflows',
  summary:'Compare fictional clause text with an explicit review playbook and return issues for counsel.',
  prompt:'Implement `review_clauses(clauses, playbook)`. Match clause categories against explicit playbook terms; return clause id, matched rule, severity, and a question for legal counsel. Flag missing categories for manual review. Do not decide enforceability, rewrite legal language, or provide legal advice.',
  tags:['agentic-ai','document-review','human-expert','explainability'],hints:['Report the rule causing each flag.','Never label a clause legally valid or invalid.','Retain source clause ids.'],
  fixtures:`{"clauses":[{"id":"c1","category":"liability","text":"Liability is unlimited."}],"playbook":{"liability":{"flag_terms":["unlimited"],"severity":"high"}}}`,
  starter:`"""Match sample clauses to explicit review rules; not legal advice."""
def review_clauses(clauses, playbook):
    # TODO: match terms case-insensitively and cite each clause and rule.
    pass
def run_demo(): return review_clauses([], {})
`,
  solution:`def review_clauses(clauses,playbook):
    if not isinstance(clauses,list) or not isinstance(playbook,dict): raise ValueError("invalid inputs")
    findings=[]
    for c in clauses:
        if not isinstance(c,dict) or not isinstance(c.get("id"),str): continue
        rule=playbook.get(c.get("category"))
        if not isinstance(rule,dict): findings.append({"clause_id":c["id"],"severity":"review","matched_terms":[],"question":"Ask qualified counsel to review this clause."}); continue
        text=str(c.get("text","" )).casefold(); terms=[t for t in rule.get("flag_terms",[]) if isinstance(t,str) and t.casefold() in text]
        if terms: findings.append({"clause_id":c["id"],"severity":rule.get("severity","review"),"matched_terms":terms,"question":"Does this wording meet the approved organizational position?"})
    return {"findings":findings,"disclaimer":"Training aid only; qualified counsel makes legal determinations."}
def run_demo(): return review_clauses([], {})
`,
  testCode:`from project import review_clauses
r=review_clauses([{"id":"c1","category":"liability","text":"Liability is unlimited."},{"id":"c2","category":"privacy","text":"Data is protected."}],{"liability":{"flag_terms":["unlimited"],"severity":"high"}})
checks=[("rule matched",r["findings"][0]["matched_terms"]==["unlimited"]),("clause cited",r["findings"][0]["clause_id"]=="c1"),("unknown category reviewed",r["findings"][1]["severity"]=="review"),("legal limitation explicit","legal determinations" in r["disclaimer"])]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
