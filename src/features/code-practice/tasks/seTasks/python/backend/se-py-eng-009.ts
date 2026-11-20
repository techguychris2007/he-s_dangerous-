import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-009', title: 'Acceptance Criteria to Test Plan', difficulty: 'Medium', category: 'Software Engineering',
  summary: 'Convert explicit product acceptance examples into deterministic test cases, including boundaries and invalid inputs.',
  prompt: 'Implement `build_test_plan(stories)`. Each story has an id, a requirement, and example records with input, expected output, and optional boundary/invalid examples. Validate the stories, emit one test case for every supplied example, preserve expected values, assign stable names, and summarize counts by example type. Do not invent expected behavior; report missing examples as coverage gaps that a product owner must clarify.',
  tags: ['tdd', 'acceptance-tests', 'test-design'],
  hints: ['Keep examples as the source of truth for expected outcomes.', 'Stable ids and names make generated tests reviewable.', 'Treat missing edge cases as questions, not guessed assertions.'],
  fixtures: `{"stories":[{"id":"S-1","requirement":"Reject negative quantities","examples":[{"type":"valid","input":{"qty":2},"expected":"accepted"},{"type":"boundary","input":{"qty":0},"expected":"accepted"},{"type":"invalid","input":{"qty":-1},"expected":"rejected"}]}]}`,
  starter: `"""Generate a reviewable test plan from explicit acceptance examples."""
def build_test_plan(stories):
    """Return cases, coverage counts, and clarification gaps; do not infer behavior."""
    # TODO: validate story/example records and preserve all supplied input and outcomes.
    # TODO: create deterministic test names and report stories with no examples.
    pass

def run_demo(): return build_test_plan([])
`,
  solution: `"""Generate a reviewable test plan from explicit acceptance examples."""
def build_test_plan(stories):
    if not isinstance(stories,list): raise ValueError("stories must be a list")
    cases=[]; gaps=[]; counts={"valid":0,"boundary":0,"invalid":0,"other":0}
    for story in stories:
        if not isinstance(story,dict) or not isinstance(story.get("id"),str): continue
        examples=story.get("examples",[])
        if not isinstance(examples,list) or not examples:
            gaps.append({"story_id":story["id"],"question":"Which inputs and expected outcomes define acceptance?"}); continue
        for index,example in enumerate(examples,1):
            if not isinstance(example,dict) or "input" not in example or "expected" not in example: continue
            kind=example.get("type","other"); bucket=kind if kind in ("valid","boundary","invalid") else "other"
            counts[bucket]+=1
            cases.append({"id":f"{story['id']}-T{index:02d}","story_id":story["id"],"name":f"{story['id']} {kind} example {index}","type":kind,"input":example["input"],"expected":example["expected"]})
    return {"cases":cases,"counts":counts,"clarification_gaps":gaps}
def run_demo(): return build_test_plan([])
`,
  testCode: `from project import build_test_plan
r=build_test_plan([{"id":"S1","examples":[{"type":"valid","input":1,"expected":2},{"type":"boundary","input":0,"expected":0},{"type":"invalid","input":-1,"expected":"reject"}]},{"id":"S2","examples":[]}])
checks=[("all examples become cases",len(r["cases"])==3), ("case ids stable",r["cases"][0]["id"]=="S1-T01"), ("types counted",r["counts"]["valid"]==1 and r["counts"]["boundary"]==1 and r["counts"]["invalid"]==1), ("missing examples flagged",r["clarification_gaps"][0]["story_id"]=="S2")]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
