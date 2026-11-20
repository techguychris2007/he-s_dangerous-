import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-015', title: 'Privacy-Safe Synthetic Records', difficulty: 'Hard', category: 'Agentic AI / Privacy Engineering',
  summary: 'Generate deterministic synthetic development records from a declared schema without copying source personal data.',
  prompt: 'Implement `generate_records(schema, count, seed)`. Support declared `integer`, `category`, `boolean`, and `synthetic_email` fields with explicit bounds or enumerated choices. Generate deterministic values for the same seed, validate field definitions and count limits, and return a schema-derived dataset plus a statement that statistical resemblance is not a privacy guarantee. Never accept production rows as seed values or claim formal anonymization.',
  tags: ['agentic-ai', 'synthetic-data', 'privacy', 'reproducibility'],
  hints: ['Use a local seeded random generator, not global random state.', 'Never include values copied from input data.', 'Distinguish synthetic test data from anonymized production data.'],
  fixtures: `{"schema":[{"name":"age","type":"integer","min":18,"max":90},{"name":"plan","type":"category","choices":["basic","pro"]},{"name":"active","type":"boolean"},{"name":"email","type":"synthetic_email"}]}`,
  starter: `"""Generate deterministic fictional data from schema declarations only."""
import random

def generate_records(schema, count, seed):
    """Return records plus explicit privacy limitations; never ingest production rows."""
    # TODO: validate count, field names, ranges and choice lists.
    # TODO: use a local seeded RNG to create only schema-derived synthetic values.
    pass

def run_demo(): return generate_records([], 0, 1)
`,
  solution: `"""Generate deterministic fictional data from schema declarations only."""
import random
def generate_records(schema,count,seed):
    if not isinstance(schema,list) or not isinstance(count,int) or isinstance(count,bool) or not 0<=count<=1000: raise ValueError("invalid schema or count")
    rng=random.Random(seed); rows=[]
    for field in schema:
        if not isinstance(field,dict) or not isinstance(field.get("name"),str) or not field["name"]: raise ValueError("invalid field")
        if field.get("type")=="integer" and (not isinstance(field.get("min"),int) or not isinstance(field.get("max"),int) or field["min"]>field["max"]): raise ValueError("invalid integer bounds")
        if field.get("type")=="category" and (not isinstance(field.get("choices"),list) or not field["choices"]): raise ValueError("category needs choices")
    for i in range(count):
        row={}
        for f in schema:
            kind=f["type"]
            if kind=="integer": value=rng.randint(f["min"],f["max"])
            elif kind=="category": value=rng.choice(f["choices"])
            elif kind=="boolean": value=bool(rng.getrandbits(1))
            elif kind=="synthetic_email": value=f"user{i+1}@example.test"
            else: raise ValueError(f"unsupported field type: {kind}")
            row[f["name"]]=value
        rows.append(row)
    return {"records":rows,"privacy_note":"Synthetic values are not copied from source rows. Statistical resemblance is not a formal privacy guarantee."}
def run_demo(): return generate_records([],0,1)
`,
  testCode: `from project import generate_records
schema=[{"name":"age","type":"integer","min":18,"max":90},{"name":"tier","type":"category","choices":["free","paid"]},{"name":"active","type":"boolean"},{"name":"email","type":"synthetic_email"}]
a=generate_records(schema,5,11); b=generate_records(schema,5,11)
checks=[("requested rows generated",len(a["records"])==5), ("seed is deterministic",a["records"]==b["records"]), ("bounds respected",all(18<=x["age"]<=90 for x in a["records"])), ("synthetic addresses",all(x["email"].endswith("@example.test") for x in a["records"])), ("privacy claim bounded","not a formal privacy guarantee" in a["privacy_note"])]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
