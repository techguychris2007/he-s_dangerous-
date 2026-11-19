import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-035',title:'Mock Browser Workflow Planner',difficulty:'Hard',category:'Agentic AI / Workflow Automation',
  summary:'Prepare a step-by-step plan against a local mock form without clicking or submitting anything.',
  prompt:'Implement `plan_form(schema, values)`. Match values to known fields, validate required values and declared types, return ordered fill steps, and identify missing or invalid inputs. Mark submission as human approval required. This task has no browser, network, or real transaction access.',
  tags:['agentic-ai','browser-automation','validation','human-approval'],hints:['Treat labels and values as untrusted.','Never invent a missing value.','Separate field planning from submission.'],fixtures:`{"schema":[{"name":"email","type":"email","required":true},{"name":"seats","type":"integer","required":true}],"values":{"email":"user@example.test","seats":"3"}}`,
  starter:`"""Plan data entry against a mock form; do not operate a browser."""
def plan_form(schema, values):
    # TODO: map fields, validate types/required values and gate submission.
    pass
def run_demo(): return plan_form([], {})
`,
  solution:`def plan_form(schema,values):
    if not isinstance(schema,list) or not isinstance(values,dict): raise ValueError("invalid inputs")
    steps=[]; issues=[]
    for field in schema:
        if not isinstance(field,dict) or not isinstance(field.get("name"),str): continue
        name=field["name"]; value=values.get(name)
        if value in (None,""):
            if field.get("required"): issues.append({"field":name,"reason":"required value missing"})
            continue
        kind=field.get("type"); valid=True; parsed=value
        if kind=="integer":
            try: parsed=int(value)
            except (ValueError,TypeError): valid=False
        elif kind=="email": valid=isinstance(value,str) and "@" in value and "." in value.split("@")[-1]
        if valid: steps.append({"field":name,"value":parsed,"action":"fill_mock_field"})
        else: issues.append({"field":name,"reason":f"value does not match {kind}"})
    return {"steps":steps,"issues":issues,"submit":{"status":"human_approval_required"},"browser_actions":0}
def run_demo(): return plan_form([], {})
`,
  testCode:`from project import plan_form
r=plan_form([{"name":"email","type":"email","required":True},{"name":"seats","type":"integer","required":True}],{"email":"u@example.test","seats":"3"})
checks=[("fields mapped",len(r["steps"])==2),("integer parsed",r["steps"][1]["value"]==3),("submit gated",r["submit"]["status"]=="human_approval_required"),("no browser actions",r["browser_actions"]==0),("required field reported",len(plan_form([{"name":"x","required":True}],{})["issues"])==1)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
