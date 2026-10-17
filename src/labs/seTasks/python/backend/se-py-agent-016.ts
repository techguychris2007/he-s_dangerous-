import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-016', title: 'Read-Only Natural Language Query Planner', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Map a narrow analytics request to a parameterized SELECT plan using a supplied schema catalog.',
  prompt: 'Implement `plan_query(request, schema)`. Support only an explicit allowlist of known request intents such as row counts by status and totals by customer. Resolve table and column identifiers from the schema, use placeholders for all values, reject unknown fields and all write/DDL requests, and return SQL plus bound parameters and validation warnings. This task builds a planner, not a database executor; never connect to a database or run generated SQL.',
  tags: ['agentic-ai', 'sql', 'read-only', 'query-safety'],
  hints: ['Keep SQL syntax in trusted templates; do not concatenate user values.', 'Allowlist identifiers because SQL parameters cannot bind column/table names.', 'Reject intent you do not explicitly support.'],
  fixtures: `{"schema":{"orders":["id","status","amount","customer_id"]},"request":{"intent":"count_by_status","table":"orders","field":"status","value":"paid"}}`,
  starter: `"""Translate a narrow set of requests to validated read-only query plans."""
SUPPORTED = {"count_by_status", "sum_by_customer"}

def plan_query(request, schema):
    """Return SQL and bound parameters, or a validation error; never execute SQL."""
    # TODO: resolve identifiers against the allowlisted schema.
    # TODO: build only supported SELECT templates with bound values.
    pass

def run_demo(): return plan_query({}, {})
`,
  solution: `"""Translate a narrow set of requests to validated read-only query plans."""
SUPPORTED={"count_by_status","sum_by_customer"}
def plan_query(request,schema):
    if not isinstance(request,dict) or not isinstance(schema,dict): return {"sql":None,"parameters":[],"error":"Request and schema must be objects.","executed":False}
    intent,table,field=request.get("intent"),request.get("table"),request.get("field")
    if intent not in SUPPORTED: return {"sql":None,"parameters":[],"error":"Unsupported or non-read-only intent.","executed":False}
    if table not in schema or not isinstance(schema.get(table),list): return {"sql":None,"parameters":[],"error":"Unknown table.","executed":False}
    cols=schema[table]
    if field not in cols: return {"sql":None,"parameters":[],"error":"Unknown field.","executed":False}
    if intent=="count_by_status":
        if field!="status" or "id" not in cols: return {"sql":None,"parameters":[],"error":"Required count fields are unavailable.","executed":False}
        sql=f"SELECT status, COUNT(id) AS total FROM {table} WHERE status = ? GROUP BY status"; params=[request.get("value")]
    else:
        if field!="amount" or "customer_id" not in cols: return {"sql":None,"parameters":[],"error":"Required sum fields are unavailable.","executed":False}
        sql=f"SELECT customer_id, SUM(amount) AS total FROM {table} GROUP BY customer_id"; params=[]
    return {"sql":sql,"parameters":params,"error":None,"executed":False}
def run_demo(): return plan_query({}, {})
`,
  testCode: `from project import plan_query
schema={"orders":["id","status","amount","customer_id"]}
r=plan_query({"intent":"count_by_status","table":"orders","field":"status","value":"paid"},schema)
bad=plan_query({"intent":"drop_table","table":"orders","field":"status"},schema)
checks=[("read query planned",r["sql"].startswith("SELECT")), ("value parameterized",r["parameters"]==["paid"] and "paid" not in r["sql"]), ("write intent rejected",bad["sql"] is None), ("not executed",r["executed"] is False), ("unknown field rejected",plan_query({"intent":"count_by_status","table":"orders","field":"secret"},schema)["sql"] is None)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
