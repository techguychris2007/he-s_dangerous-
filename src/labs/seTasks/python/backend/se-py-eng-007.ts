import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-007', title: 'Legacy Migration Work Planner', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'Convert a legacy component inventory into a dependency-aware, testable migration plan without rewriting code automatically.',
  prompt: 'Implement `plan_migration(components, compatibility)`. Each component has a name, source runtime, dependencies, and criticality. Validate records, reject missing dependencies and cycles with actionable warnings, then produce dependency-first migration waves. Include a risk label derived from criticality and compatibility data, plus a verification checklist for each component (behavior tests, data compatibility, rollback rehearsal). This project produces a plan only: it does not translate or execute source code.',
  tags: ['migration', 'architecture', 'testing', 'change-management'],
  hints: ['Use a graph traversal or Kahn-style topological sort.', 'Validate the whole graph before assigning waves.', 'Keep output ordering stable when several components are independent.'],
  fixtures: `{"components":[{"name":"auth","runtime":"python2","depends_on":[],"criticality":"high"},{"name":"billing","runtime":"java8","depends_on":["auth"],"criticality":"critical"},{"name":"reports","runtime":"python2","depends_on":["auth"],"criticality":"low"}]}`,
  starter: `"""Build a dependency-aware migration plan; never rewrite or run legacy code."""
from collections import defaultdict

def plan_migration(components, compatibility):
    """Return ordered migration waves and warnings for invalid dependency graphs.

    Every planned component includes a risk label, its dependencies, and verification steps.
    """
    # TODO: validate unique names, missing edges and cycles before constructing the plan.
    # TODO: order dependencies before dependants and group independent work into waves.
    # TODO: derive risk from criticality plus the supplied compatibility matrix.
    pass

def run_demo():
    return plan_migration([], {})
`,
  solution: `"""Build a dependency-aware migration plan; never rewrite or run legacy code."""
def plan_migration(components, compatibility):
    if not isinstance(components,list): raise ValueError("components must be a list")
    by_name={}
    for c in components:
        if not isinstance(c,dict) or not isinstance(c.get("name"),str) or not c["name"]: raise ValueError("each component needs a name")
        if c["name"] in by_name: raise ValueError("component names must be unique")
        if not isinstance(c.get("depends_on",[]),list): raise ValueError("depends_on must be a list")
        by_name[c["name"]]=c
    for c in by_name.values():
        missing=sorted(set(c.get("depends_on",[]))-set(by_name))
        if missing: raise ValueError(f"{c['name']} has missing dependencies: {', '.join(missing)}")
    remaining=set(by_name); done=set(); waves=[]
    while remaining:
        ready=sorted(n for n in remaining if set(by_name[n].get("depends_on",[])) <= done)
        if not ready: raise ValueError("dependency cycle detected")
        wave=[]
        for name in ready:
            c=by_name[name]; criticality=c.get("criticality","medium").lower()
            compatibility_value=compatibility.get(c.get("runtime"),"unknown") if isinstance(compatibility,dict) else "unknown"
            risk="high" if criticality in ("high","critical") or compatibility_value in ("low","unknown") else "medium"
            wave.append({"name":name,"runtime":c.get("runtime","unknown"),"risk":risk,"depends_on":sorted(c.get("depends_on",[])),"verification":["behavior and regression tests","data and interface compatibility checks","rollback rehearsal"]})
        waves.append(wave); done.update(ready); remaining.difference_update(ready)
    return {"waves":waves,"warnings":[]}

def run_demo(): return plan_migration([], {})
`,
  testCode: `from project import plan_migration
cs=[{"name":"auth","runtime":"py2","depends_on":[],"criticality":"high"},{"name":"billing","runtime":"java8","depends_on":["auth"],"criticality":"low"},{"name":"reports","runtime":"py2","depends_on":["auth"],"criticality":"low"}]
def rejects_cycle():
    try: plan_migration([{"name":"a","depends_on":["b"]},{"name":"b","depends_on":["a"]}],{})
    except ValueError: return True
    return False
r=plan_migration(cs,{"py2":"medium","java8":"high"})
checks=[("dependency wave order", [x["name"] for x in r["waves"][0]]==["auth"] and {x["name"] for x in r["waves"][1]}=={"billing","reports"}), ("critical risk surfaced", r["waves"][0][0]["risk"]=="high"), ("verification included", len(r["waves"][0][0]["verification"])==3), ("cycle rejected", rejects_cycle())]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
