import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-011', title: 'OpenAPI Client Method Generator', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'Generate reviewable Python client method signatures from a small OpenAPI-style operation catalog.',
  prompt: 'Implement `generate_methods(spec)`. Read the supplied paths and operations, validate HTTP methods, operation ids, path parameters, and request-body schemas, then emit deterministic Python method stubs with safe parameter identifiers and docstrings. Reject duplicate operation ids and unsupported parameter shapes. The output is source text for review only; do not execute generated code, publish a package, or contact an API.',
  tags: ['openapi', 'sdk', 'code-generation', 'validation'],
  hints: ['Preserve required parameters and mark optional parameters clearly.', 'Sanitize identifiers and guard against Python keywords.', 'Use stable path/method ordering for reproducible generation.'],
  fixtures: `{"paths":{"/users/{user_id}":{"get":{"operationId":"getUser","parameters":[{"name":"user_id","required":true}]},"delete":{"operationId":"deleteUser","parameters":[{"name":"user_id","required":true}]}}}}`,
  starter: `"""Generate inspectable client stubs from supplied API metadata only."""
import keyword
import re

def generate_methods(spec):
    """Return {source, errors}; generated source is never executed or published."""
    # TODO: validate spec shape, method names, and duplicate operation ids.
    # TODO: produce stable Python methods with sanitized path parameter names.
    pass

def run_demo(): return generate_methods({"paths": {}})
`,
  solution: `"""Generate inspectable client stubs from supplied API metadata only."""
import keyword,re
def generate_methods(spec):
    if not isinstance(spec,dict) or not isinstance(spec.get("paths"),dict): return {"source":"","errors":["paths must be an object"]}
    methods=[]; errors=[]; seen=set()
    for path,operations in sorted(spec["paths"].items()):
        if not isinstance(operations,dict): errors.append(f"invalid operations for {path}"); continue
        for verb,op in sorted(operations.items()):
            if verb.lower() not in {"get","post","put","patch","delete"} or not isinstance(op,dict): errors.append(f"unsupported operation {verb} {path}"); continue
            name=op.get("operationId")
            if not isinstance(name,str) or not re.fullmatch(r"[A-Za-z_]\\w*",name) or keyword.iskeyword(name): errors.append(f"invalid operationId for {verb} {path}"); continue
            if name in seen: errors.append(f"duplicate operationId {name}"); continue
            seen.add(name); params=[]
            for item in op.get("parameters",[]):
                if not isinstance(item,dict) or not isinstance(item.get("name"),str): errors.append(f"invalid parameter in {name}"); continue
                param=re.sub(r"\\W+","_",item["name"]).strip("_") or "param"
                if param[0].isdigit(): param="p_"+param
                if keyword.iskeyword(param): param+="_"
                params.append(param if item.get("required") else param+"=None")
            signature=", ".join(["self"]+params)
            methods.append(f"    def {name}({signature}):\\n        \\"\\"\\"Call {verb.upper()} {path}; generated stub requires review.\\"\\"\\"\\n        raise NotImplementedError")
    return {"source":"\\n\\n".join(methods),"errors":errors}
def run_demo(): return generate_methods({"paths": {}})
`,
  testCode: `from project import generate_methods
spec={"paths":{"/users/{id}":{"get":{"operationId":"get_user","parameters":[{"name":"id","required":True},{"name":"class","required":False}]}}}}
r=generate_methods(spec)
checks=[("method emitted","def get_user(self, id, class_=None)" in r["source"]), ("path documented","GET /users/{id}" in r["source"]), ("stub not executable", "NotImplementedError" in r["source"]), ("duplicate rejected", bool(generate_methods({"paths":{"/a":{"get":{"operationId":"same"}},"/b":{"get":{"operationId":"same"}}}})["errors"]))]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
