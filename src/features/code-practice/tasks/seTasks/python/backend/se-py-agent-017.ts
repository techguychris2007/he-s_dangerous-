import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-017', title: 'Validated ETL Batch Builder', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Transform a fixture batch into normalized records with explicit validation errors and a reconciliation summary.',
  prompt: 'Implement `transform_batch(rows, required_fields)`. Validate each row independently, normalize whitespace in string values and parse declared numeric fields without silently coercing invalid values, quarantine bad rows with reasons, and return accepted records, rejects, and counts that reconcile to the input. Preserve input order and never write to a database or trigger an orchestration job.',
  tags: ['agentic-ai', 'etl', 'data-quality', 'validation'],
  hints: ['Do not discard rejected input silently.', 'Keep a stable source row number in both accepted and rejected outcomes.', 'Check the count invariant: accepted plus rejected equals rows received.'],
  fixtures: `{"required_fields":["customer_id","amount"],"rows":[{"customer_id":" c-1 ","amount":"12.50"},{"customer_id":"","amount":"bad"},{"customer_id":"c-3","amount":"9"}]}`,
  starter: `"""Offline ETL transform with row-level quarantine and reconciliation."""
def transform_batch(rows, required_fields):
    """Return accepted, rejected and counts; every input row must be accounted for."""
    # TODO: validate fields, normalize strings and parse amounts safely.
    # TODO: retain source row numbers and enforce the reconciliation invariant.
    pass

def run_demo(): return transform_batch([], [])
`,
  solution: `"""Offline ETL transform with row-level quarantine and reconciliation."""
def transform_batch(rows,required_fields):
    if not isinstance(rows,list) or not isinstance(required_fields,list): raise ValueError("rows and required_fields must be lists")
    accepted=[]; rejected=[]
    for number,row in enumerate(rows,1):
        if not isinstance(row,dict): rejected.append({"row":number,"reason":"record must be an object"}); continue
        item={k:(v.strip() if isinstance(v,str) else v) for k,v in row.items()}
        missing=[k for k in required_fields if item.get(k) in (None,"")]
        if missing: rejected.append({"row":number,"reason":"missing required fields: "+", ".join(missing)}); continue
        try: item["amount"]=float(item["amount"])
        except (KeyError,TypeError,ValueError): rejected.append({"row":number,"reason":"amount must be numeric"}); continue
        if item["amount"]<0: rejected.append({"row":number,"reason":"amount cannot be negative"}); continue
        accepted.append({"row":number,"data":item})
    return {"accepted":accepted,"rejected":rejected,"counts":{"received":len(rows),"accepted":len(accepted),"rejected":len(rejected)},"reconciles":len(rows)==len(accepted)+len(rejected)}
def run_demo(): return transform_batch([], [])
`,
  testCode: `from project import transform_batch
r=transform_batch([{"customer_id":" c-1 ","amount":"12.50"},{"customer_id":"","amount":"bad"},{"customer_id":"c-3","amount":"9"}], ["customer_id","amount"])
checks=[("valid rows accepted",len(r["accepted"])==2), ("strings normalized",r["accepted"][0]["data"]["customer_id"]=="c-1"), ("invalid row quarantined",len(r["rejected"])==1), ("counts reconcile",r["reconciles"] and r["counts"]["received"]==3), ("source row retained",r["rejected"][0]["row"]==2)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
