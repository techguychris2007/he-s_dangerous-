import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-019', title: 'Analytics Dashboard Specification', difficulty: 'Medium', category: 'Agentic AI / Data Engineering',
  summary: 'Choose a chart and data aggregation from a constrained analytics request without querying a database.',
  prompt: 'Implement `design_dashboard(request, schema)`. Support trend, category comparison, and relationship requests. Validate requested measures/dimensions against the schema, select line/bar/scatter appropriately, and produce a declarative chart specification with labels and aggregation. Reject ambiguous or unknown fields with clarification questions. Do not query a warehouse or render a dashboard.',
  tags: ['agentic-ai', 'analytics', 'visualization', 'schema-validation'],
  hints: ['A line chart requires an ordered time dimension.', 'Do not invent a field name when a request is ambiguous.', 'Keep the return value declarative and side-effect free.'],
  fixtures: `{"request":{"question":"Show daily revenue trend","measure":"revenue","dimension":"day"},"schema":{"revenue":"number","day":"date","region":"category"}}`,
  starter: `"""Create a chart plan from a request and schema; execute no data query."""
def design_dashboard(request, schema):
    """Return chart type, mapping, aggregation and clarification questions."""
    # TODO: validate dimensions/measures and choose a chart that matches the intent.
    # TODO: ask for clarification rather than inventing absent schema fields.
    pass

def run_demo(): return design_dashboard({}, {})
`,
  solution: `"""Create a chart plan from a request and schema; execute no data query."""
def design_dashboard(request,schema):
    if not isinstance(request,dict) or not isinstance(schema,dict): return {"chart":None,"questions":["Provide a request and schema."],"executed":False}
    measure,dimension=request.get("measure"),request.get("dimension"); questions=[]
    if measure not in schema: questions.append("Which available numeric measure should be shown?")
    elif schema[measure]!="number": questions.append("The selected measure is not numeric; choose a numeric field.")
    if dimension not in schema: questions.append("Which available dimension should group the result?")
    intent=str(request.get("question","")).lower()
    if questions: return {"chart":None,"questions":questions,"executed":False}
    if schema[dimension]=="date" or "trend" in intent: chart="line"
    elif schema[dimension]=="number": chart="scatter"
    else: chart="bar"
    return {"chart":{"type":chart,"x":dimension,"y":measure,"aggregation":"sum","title":request.get("question","Analytics result")},"questions":[],"executed":False}
def run_demo(): return design_dashboard({}, {})
`,
  testCode: `from project import design_dashboard
schema={"revenue":"number","day":"date","region":"category"}
r=design_dashboard({"question":"daily revenue trend","measure":"revenue","dimension":"day"},schema)
bad=design_dashboard({"measure":"profit","dimension":"region"},schema)
checks=[("trend uses line",r["chart"]["type"]=="line"), ("fields mapped",r["chart"]["x"]=="day" and r["chart"]["y"]=="revenue"), ("aggregation explicit",r["chart"]["aggregation"]=="sum"), ("unknown field asks",bad["chart"] is None and len(bad["questions"])>0), ("no query executed",r["executed"] is False)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
