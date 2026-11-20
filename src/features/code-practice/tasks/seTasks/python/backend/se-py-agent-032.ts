import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-032', title:'Evidence-Linked Knowledge Graph Builder', difficulty:'Hard', category:'Agentic AI / Business Workflows',
  summary:'Build a deduplicated graph from explicit entity and relationship records with traceable provenance.',
  prompt:'Implement `build_graph(entities, relations)`. Validate entity ids and edge endpoints, deduplicate repeated facts, and attach source ids to every edge. Return deterministic nodes and edges with warnings for unresolved entities. Do not infer or scrape relationships.',
  tags:['agentic-ai','knowledge-graphs','data-modeling','provenance'], hints:['Keep stable ids separate from labels.','Reject edges with missing endpoints.','Preserve all source ids after deduplication.'],
  fixtures:`{"entities":[{"id":"u1","type":"team"},{"id":"d1","type":"document"}],"relations":[{"source":"u1","target":"d1","type":"owns","source_id":"row-4"}]}`,
  starter:`"""Build a provenance-aware graph from supplied records."""
def build_graph(entities, relations):
    # TODO: validate ids, deduplicate nodes/edges, and preserve source references.
    pass
def run_demo(): return build_graph([], [])
`,
  solution:`def build_graph(entities,relations):
    if not isinstance(entities,list) or not isinstance(relations,list): raise ValueError("inputs must be lists")
    nodes={}; warnings=[]
    for e in entities:
        if isinstance(e,dict) and isinstance(e.get("id"),str) and isinstance(e.get("type"),str): nodes.setdefault(e["id"],{"id":e["id"],"type":e["type"],"name":e.get("name",e["id"])})
    edges={}
    for r in relations:
        if not isinstance(r,dict) or r.get("source") not in nodes or r.get("target") not in nodes: warnings.append("Relation with unresolved endpoint ignored."); continue
        key=(r["source"],r["target"],r.get("type","related_to")); edge=edges.setdefault(key,{"source":key[0],"target":key[1],"type":key[2],"sources":[]})
        if isinstance(r.get("source_id"),str): edge["sources"].append(r["source_id"])
    links=list(edges.values())
    for edge in links: edge["sources"]=sorted(set(edge["sources"]))
    return {"nodes":[nodes[k] for k in sorted(nodes)],"edges":links,"warnings":warnings,"inferred_edges":0}
def run_demo(): return build_graph([], [])
`,
  testCode:`from project import build_graph
r=build_graph([{"id":"a","type":"team"},{"id":"b","type":"doc"}],[{"source":"a","target":"b","type":"owns","source_id":"x"},{"source":"a","target":"b","type":"owns","source_id":"y"},{"source":"b","target":"z"}])
checks=[("nodes indexed",len(r["nodes"])==2),("edge deduplicated",len(r["edges"])==1),("provenance retained",r["edges"][0]["sources"]==["x","y"]),("bad endpoint warned",len(r["warnings"])==1),("no inferred edges",r["inferred_edges"]==0)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
