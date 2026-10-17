import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-027',title:'Skills-Based Candidate Role Matcher',difficulty:'Medium',category:'Agentic AI / Business Workflows',
  summary:'Compare declared role skills with candidate-provided skills using an explainable, sensitive-attribute-blind rubric.',
  prompt:'Implement `match_candidates(role, candidates)`. Score only required and preferred skills; return matched/missing skills and explain the score. Ignore age, gender, ethnicity, disability, photos, and other personal attributes even if present. Do not infer personality or make a hiring decision; this output is a skills-only aid for a human recruiter.',
  tags:['agentic-ai','recruiting','fairness','explainability'],hints:['Use only declared skill lists.','Explain score from skill overlap.','Avoid a final hiring recommendation.'],
  fixtures:`{"role":{"required":["python","sql"],"preferred":["airflow"]},"candidates":[{"id":"A","skills":["Python","SQL"],"age":22},{"id":"B","skills":["python"],"age":50}]}`,
  starter:`"""Create an explainable skill overlap report, not a hiring decision."""
def match_candidates(role, candidates):
    # TODO: normalize skills, score only declared requirements, and ignore other fields.
    pass
def run_demo(): return match_candidates({}, [])
`,
  solution:`def match_candidates(role,candidates):
    if not isinstance(role,dict) or not isinstance(candidates,list): raise ValueError("invalid inputs")
    req={x.casefold() for x in role.get("required",[]) if isinstance(x,str)}; pref={x.casefold() for x in role.get("preferred",[]) if isinstance(x,str)}; out=[]
    for c in candidates:
        if not isinstance(c,dict) or not isinstance(c.get("id"),str): continue
        skills={x.casefold() for x in c.get("skills",[]) if isinstance(x,str)}; matched=sorted(req&skills); optional=sorted(pref&skills); denom=max(1,len(req)+len(pref))
        out.append({"id":c["id"],"score":round((len(matched)+.5*len(optional))/denom,3),"matched_required":matched,"missing_required":sorted(req-skills),"matched_preferred":optional,"decision":"human_review_required"})
    return sorted(out,key=lambda x:(-x["score"],x["id"]))
def run_demo(): return match_candidates({}, [])
`,
  testCode:`from project import match_candidates
r=match_candidates({"required":["python","sql"],"preferred":["airflow"]},[{"id":"A","skills":["Python","SQL"],"age":22},{"id":"B","skills":["python"],"age":50}])
checks=[("skills order results",r[0]["id"]=="A"),("missing skill explained",r[1]["missing_required"]==["sql"]),("score uses skills only",r[0]["score"]==round(2/3,3)),("human decision retained",all(x["decision"]=="human_review_required" for x in r))]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
