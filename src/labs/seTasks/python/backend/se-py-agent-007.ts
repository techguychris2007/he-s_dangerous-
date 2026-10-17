import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-007', title: 'Fixture-Based Secure Code Reviewer', difficulty: 'Hard', category: 'Agentic AI / Security Engineering',
  summary: 'Inspect supplied source snippets for a small, explainable set of risky coding patterns and produce line-specific findings.',
  prompt: 'Implement `review_sources(files)`. Analyze only the provided source strings using Python tokenization/AST where practical or carefully bounded patterns. Flag direct `eval`/`exec`, subprocess shell execution, SQL string interpolation, and hard-coded credential-like assignments. Include path, one-based line, rule id, severity, and an explanatory message. Ignore comments and ordinary safe examples where possible. State that this is a teaching ruleset, not a complete security scanner. Never read the filesystem or run the snippets.',
  tags: ['agentic-ai', 'secure-code-review', 'static-analysis', 'offline'],
  hints: ['Use `ast` for Python calls and assignments instead of matching every character with regex.', 'Keep rules explicit so learners can explain false positives and false negatives.', 'Do not execute an AST or import the scanned source.'],
  fixtures: `{"files":{"app.py":"query = f\\"SELECT * FROM users WHERE name={name}\\"\\nsubprocess.run(cmd, shell=True)\\n# eval(user_text)\\n"}}`,
  starter: `"""Tiny educational source reviewer over strings supplied by the caller."""
import ast

def review_sources(files):
    """Return sorted findings and a coverage limitation statement."""
    # TODO: parse each Python source independently; preserve parse errors as warnings.
    # TODO: identify risky calls and credential-shaped assignments without executing code.
    pass

def run_demo(): return review_sources({})
`,
  solution: `"""Tiny educational source reviewer over strings supplied by the caller."""
import ast,re
class Rules(ast.NodeVisitor):
    def __init__(self,path): self.path=path; self.findings=[]
    def add(self,node,rule,severity,message): self.findings.append({"path":self.path,"line":node.lineno,"rule":rule,"severity":severity,"message":message})
    def visit_Call(self,node):
        name=node.func.id if isinstance(node.func,ast.Name) else node.func.attr if isinstance(node.func,ast.Attribute) else ""
        if name in ("eval","exec"): self.add(node,"PY001","high","Dynamic code execution requires strict trust-boundary review.")
        if name=="run" and isinstance(node.func,ast.Attribute) and isinstance(node.func.value,ast.Name) and node.func.value.id=="subprocess":
            if any(k.arg=="shell" and isinstance(k.value,ast.Constant) and k.value.value is True for k in node.keywords): self.add(node,"PY002","high","Shell execution with constructed input can enable command injection.")
        if name in ("execute","executemany") and node.args and isinstance(node.args[0],(ast.JoinedStr,ast.BinOp)): self.add(node,"PY003","high","SQL appears to be assembled through string interpolation.")
        self.generic_visit(node)
    def visit_Assign(self,node):
        names=[t.id.lower() for t in node.targets if isinstance(t,ast.Name)]
        if any(any(word in n for word in ("password","secret","token","api_key")) for n in names) and isinstance(node.value,ast.Constant) and isinstance(node.value.value,str) and len(node.value.value)>=6:
            self.add(node,"PY004","medium","Credential-like variable has a literal string value; verify it is not a real secret.")
        self.generic_visit(node)
def review_sources(files):
    if not isinstance(files,dict): raise ValueError("files must be a mapping")
    findings=[]; warnings=[]
    for path,source in sorted(files.items()):
        if not isinstance(path,str) or not isinstance(source,str): warnings.append("Invalid path or source ignored."); continue
        try: tree=ast.parse(source,filename=path)
        except SyntaxError as error: warnings.append(f"{path}: syntax could not be parsed at line {error.lineno}."); continue
        visitor=Rules(path); visitor.visit(tree); findings.extend(visitor.findings)
    findings.sort(key=lambda f:(f["path"],f["line"],f["rule"]))
    return {"findings":findings,"warnings":warnings,"coverage":"Small educational ruleset; not a complete security scanner. Human review is required."}
def run_demo(): return review_sources({})
`,
  testCode: `from project import review_sources
src="cursor.execute(f\\"SELECT * FROM t WHERE id={x}\\")\\nsubprocess.run(cmd, shell=True)\\n# eval(user)\\n"
r=review_sources({"sample.py":src})
rules={f["rule"] for f in r["findings"]}
checks=[("SQL interpolation found","PY003" in rules), ("shell call found","PY002" in rules), ("comment ignored","PY001" not in rules), ("coverage limitation stated","not a complete" in r["coverage"]), ("malformed syntax isolated",len(review_sources({"bad.py":"def x(:"})["warnings"])==1)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
