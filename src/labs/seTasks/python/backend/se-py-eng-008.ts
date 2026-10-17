import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-008', title: 'Bug Report Reproduction and Regression Plan', difficulty: 'Medium', category: 'Software Engineering',
  summary: 'Turn issue reports and stack traces into structured reproduction steps and a regression-test proposal.',
  prompt: 'Implement `analyze_issue(issue, ownership)`. Validate a bug report, extract stack frames from supplied trace lines, map the first known source path to its owning component, and return a minimal reproduction checklist based only on reported environment, input, and expected/actual behavior. Generate a regression test proposal that preserves the reported failing input and expected result. Never execute issue code, create a patch, or submit a pull request.',
  tags: ['debugging', 'regression-testing', 'issue-triage'],
  hints: ['Keep parsed trace evidence verbatim and preserve frame order.', 'A reproduction plan should not invent steps absent from the issue.', 'If no owner matches, return an explicit unassigned value.'],
  fixtures: JSON.stringify({"issue":{"title":"Parser crashes on empty input","environment":"Python 3.12","input":"empty string","expected":"empty result","actual":"IndexError","trace":["File \"src/parser.py\", line 18, in parse","File \"src/cli.py\", line 7, in main"]},"ownership":{"src/parser.py":"data-platform"}}),
  starter: `"""Issue triage helper. It analyzes supplied text and never runs reported code."""
import re

FRAME = re.compile(r'File "([^"]+)", line (\\d+), in (.+)')

def analyze_issue(issue, ownership):
    """Return validated summary, parsed frames, repro steps, owner and test proposal."""
    # TODO: validate required report fields and preserve the reported evidence.
    # TODO: parse stack frames, locate the first owned path, and build a regression case.
    pass

def run_demo(): return analyze_issue({}, {})
`,
  solution: `"""Issue triage helper. It analyzes supplied text and never runs reported code."""
import re
FRAME=re.compile(r'File "([^"]+)", line (\\d+), in (.+)')
def analyze_issue(issue, ownership):
    if not isinstance(issue,dict): raise ValueError("issue must be an object")
    required=("title","environment","input","expected","actual")
    missing=[key for key in required if not isinstance(issue.get(key),str) or not issue[key].strip()]
    if missing: raise ValueError("missing issue fields: "+", ".join(missing))
    frames=[]
    for line in issue.get("trace",[]):
        if isinstance(line,str):
            match=FRAME.search(line)
            if match: frames.append({"path":match.group(1),"line":int(match.group(2)),"function":match.group(3)})
    owner=next((ownership[f["path"]] for f in frames if isinstance(ownership,dict) and f["path"] in ownership),None)
    steps=[f"Use environment: {issue['environment']}.",f"Provide input: {issue['input']}.",f"Observe actual behavior: {issue['actual']}."]
    return {"title":issue["title"],"frames":frames,"owner":owner or "unassigned","reproduction_steps":steps,"regression_test":{"input":issue["input"],"expected":issue["expected"],"assertion":"observed result matches expected result"},"execution_performed":False}
def run_demo(): return analyze_issue({"title":"demo","environment":"local","input":"x","expected":"y","actual":"z"},{})
`,
  testCode: `from project import analyze_issue
issue={"title":"Empty parser input","environment":"py312","input":"''","expected":"[]","actual":"IndexError","trace":['File "src/parser.py", line 18, in parse',"noise"]}
r=analyze_issue(issue,{"src/parser.py":"platform"})
checks=[("stack parsed",r["frames"][0]["line"]==18), ("owner mapped",r["owner"]=="platform"), ("reported values retained",r["regression_test"]["input"]=="''" and r["regression_test"]["expected"]=="[]"), ("no code executed",r["execution_performed"] is False)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
