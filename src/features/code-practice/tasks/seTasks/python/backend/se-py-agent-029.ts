import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-029',title:'Onboarding Stalled-Step Assistant',difficulty:'Medium',category:'Agentic AI / Business Workflows',summary:'Find the next incomplete setup milestone and draft contextual help for review.',
  prompt:'Implement `suggest_help(user_state, milestones)`. Find the earliest incomplete milestone and draft a message using its supplied help text. Suppress outreach for completed users and people who opted out. Do not infer sensitive traits or send messages.',
  tags:['agentic-ai','onboarding','privacy'],hints:['Use milestone order.','Respect opt-out before drafting.','Never claim an unrecorded action.'],fixtures:`{"user_state":{"completed":["workspace"],"opt_out":false},"milestones":[{"id":"workspace","help":"Workspace is ready."},{"id":"invite","help":"Invite a teammate from Settings."}]}`,
  starter:`"""Draft onboarding guidance from progress events; send nothing."""
def suggest_help(user_state, milestones):
    # TODO: honor opt-out and draft from the next incomplete milestone only.
    pass
def run_demo(): return suggest_help({}, [])
`,
  solution:`def suggest_help(user_state,milestones):
    if not isinstance(user_state,dict) or not isinstance(milestones,list): raise ValueError("invalid inputs")
    if user_state.get("opt_out"): return {"draft":None,"reason":"user opted out","sent":False}
    done=set(user_state.get("completed",[])) if isinstance(user_state.get("completed",[]),list) else set()
    step=next((m for m in milestones if isinstance(m,dict) and m.get("id") not in done),None)
    if not step: return {"draft":None,"reason":"all milestones complete","sent":False}
    help_text=step.get("help") if isinstance(step.get("help"),str) else "Review the setup guide for this step."
    return {"milestone":step.get("id"),"draft":f"Need a hand with {step.get('id')}? {help_text}","reason":"next recorded milestone is incomplete","sent":False}
def run_demo(): return suggest_help({}, [])
`,
  testCode:`from project import suggest_help
steps=[{"id":"a","help":"Start."},{"id":"b","help":"Open Settings."}]
r=suggest_help({"completed":["a"]},steps)
checks=[("next step found",r["milestone"]=="b"),("draft grounded","Open Settings" in r["draft"]),("not sent",not r["sent"]),("opt-out honored",suggest_help({"opt_out":True},steps)["draft"] is None),("completed user silent",suggest_help({"completed":["a","b"]},steps)["draft"] is None)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
