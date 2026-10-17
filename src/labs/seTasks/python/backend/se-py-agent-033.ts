import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-033', title:'SQL Data Lineage Mapper', difficulty:'Hard', category:'Agentic AI / Data Engineering',
  summary:'Extract table dependencies from a documented subset of SQL transformation strings.',
  prompt:'Implement `map_lineage(statements)`. Parse simple INSERT INTO destinations and FROM/JOIN sources, produce source-to-target edges with statement ids, and warn on unsupported SQL. This is a constrained parser, not a complete SQL grammar; never execute statements.',
  tags:['agentic-ai','data-lineage','sql','parsing'], hints:['Keep the accepted grammar narrow.','Never execute parsed SQL.','Preserve statement ids on edges.'],
  fixtures:`{"statements":[{"id":"s1","sql":"INSERT INTO daily SELECT * FROM orders JOIN customers ON orders.customer_id=customers.id"}]}`,
  starter:`"""Extract limited SQL lineage from supplied text; do not execute it."""
import re
def map_lineage(statements):
    # TODO: recognize INSERT target and FROM/JOIN sources; warn on unsupported SQL.
    pass
def run_demo(): return map_lineage([])
`,
  solution:`import re
def map_lineage(statements):
    if not isinstance(statements,list): raise ValueError("statements must be a list")
    edges=[]; warnings=[]
    for s in statements:
        if not isinstance(s,dict) or not isinstance(s.get("sql"),str): warnings.append("Invalid statement ignored."); continue
        sql=s["sql"]
        dest=re.search(r"(?i)\\binsert\\s+into\\s+([A-Za-z_][\\w.]*)",sql)
        sources=re.findall(r"(?i)\\b(?:from|join)\\s+([A-Za-z_][\\w.]*)",sql)
        if not sources: warnings.append(f"{s.get('id','?')}: no supported source found."); continue
        for source in sorted(set(sources)):
            edges.append({"source":source,"target":dest.group(1) if dest else "<query-result>","statement_id":s.get("id"),"executed":False})
        if not dest: warnings.append(f"{s.get('id','?')}: target not explicit.")
    return {"edges":edges,"warnings":warnings,"scope":"INSERT INTO ... SELECT ... FROM/JOIN only"}
def run_demo(): return map_lineage([])
`,
  testCode:`from project import map_lineage
r=map_lineage([{"id":"s1","sql":"INSERT INTO daily SELECT * FROM orders JOIN customers ON orders.id=customers.id"},{"id":"s2","sql":"SELECT 1"}])
checks=[("sources found",{x["source"] for x in r["edges"]}=={"orders","customers"}),("target linked",all(x["target"]=="daily" for x in r["edges"])),("statement cited",all(x["statement_id"]=="s1" for x in r["edges"])),("unsupported warned",len(r["warnings"])==1),("not executed",all(not x["executed"] for x in r["edges"]))]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
