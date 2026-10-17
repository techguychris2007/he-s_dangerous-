import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-023', title: 'Tabular Feature Engineering Pipeline', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Create transparent, leakage-aware derived features from a small tabular dataset.',
  prompt: 'Implement `engineer_features(rows, numeric_fields, categorical_fields)`. For each numeric field, add a missingness indicator and a deterministic centered value based on the training rows; for each categorical field, emit one-hot columns using a stable category order and an explicit unknown bucket. Return feature names, transformed rows, and the training statistics required to transform later data. Do not use the target column, fit on test rows, or claim that correlation proves predictive value.',
  tags: ['agentic-ai', 'feature-engineering', 'machine-learning', 'data-leakage'],
  hints: ['Calculate means from the provided training rows only.', 'Represent missing values explicitly rather than replacing them invisibly.', 'Persist category ordering and means for later inference.'],
  fixtures: `{"rows":[{"age":20,"city":"Accra"},{"age":null,"city":"Kumasi"},{"age":30,"city":"Accra"}],"numeric_fields":["age"],"categorical_fields":["city"]}`,
  starter: `"""Fit simple tabular transforms on training data and return reusable metadata."""
def engineer_features(rows, numeric_fields, categorical_fields):
    """Return features, transformed rows and fitted statistics without target leakage."""
    # TODO: compute training-only means, missing flags and stable one-hot columns.
    # TODO: retain the transform metadata required for future records.
    pass

def run_demo(): return engineer_features([], [], [])
`,
  solution: `"""Fit simple tabular transforms on training data and return reusable metadata."""
def engineer_features(rows,numeric_fields,categorical_fields):
    if not isinstance(rows,list): raise ValueError("rows must be a list")
    numeric=numeric_fields if isinstance(numeric_fields,list) else []; categorical=categorical_fields if isinstance(categorical_fields,list) else []
    means={}; categories={}; names=[]
    for field in numeric:
        values=[r.get(field) for r in rows if isinstance(r,dict) and isinstance(r.get(field),(int,float)) and not isinstance(r.get(field),bool)]
        means[field]=sum(values)/len(values) if values else 0.0; names.extend([field+"__centered",field+"__missing"])
    for field in categorical:
        values=sorted({r[field] for r in rows if isinstance(r,dict) and isinstance(r.get(field),str)})
        categories[field]=values
        names.extend(field+"="+v for v in values); names.append(field+"=<unknown>")
    output=[]
    for row in rows:
        if not isinstance(row,dict): continue
        feature={}
        for field in numeric:
            value=row.get(field); valid=isinstance(value,(int,float)) and not isinstance(value,bool)
            feature[field+"__centered"]=(value-means[field]) if valid else 0.0; feature[field+"__missing"]=0 if valid else 1
        for field in categorical:
            value=row.get(field); known=value in categories[field]
            for category in categories[field]: feature[field+"="+category]=int(known and value==category)
            feature[field+"=<unknown>"]=int(not known)
        output.append(feature)
    return {"feature_names":names,"rows":output,"fit":{"means":means,"categories":categories},"target_used":False}
def run_demo(): return engineer_features([],[],[])
`,
  testCode: `from project import engineer_features
r=engineer_features([{"age":20,"city":"Accra"},{"age":None,"city":"Kumasi"},{"age":30,"city":"Accra"}], ["age"],["city"])
checks=[("training mean stored",r["fit"]["means"]["age"]==25), ("missingness explicit",r["rows"][1]["age__missing"]==1), ("centered value correct",r["rows"][0]["age__centered"]==-5), ("one hot stable",r["rows"][0]["city=Accra"]==1 and r["rows"][1]["city=Kumasi"]==1), ("unknown bucket exists","city=<unknown>" in r["feature_names"]), ("target excluded",r["target_used"] is False)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
