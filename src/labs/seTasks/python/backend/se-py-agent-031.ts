import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-031',title:'Invoice Duplicate and Policy Auditor',difficulty:'Hard',category:'Agentic AI / Business Workflows',summary:'Flag duplicate sample invoices and approval-threshold exceptions without moving money.',
  prompt:'Implement `audit_invoices(invoices, policy)`. Validate invoice id, vendor, number, amount, and currency; flag repeated vendor/invoice-number pairs and amounts over an approval threshold; retain evidence ids and totals by currency. Do not assume fraud, query a real bank, or initiate a payment or reversal.',
  tags:['agentic-ai','finance-operations','audit','human-review'],hints:['A duplicate is a review flag, not a fraud conclusion.','Never aggregate across currencies.','Keep invoice ids on findings.'],fixtures:`{"policy":{"approval_threshold":1000},"invoices":[{"id":"i1","vendor":"North","number":"A-1","amount":1250,"currency":"USD"},{"id":"i2","vendor":"North","number":"A-1","amount":1250,"currency":"USD"}]}`,
  starter:`"""Audit invoice fixtures for review signals; never initiate payments."""
def audit_invoices(invoices, policy):
    # TODO: validate invoices, detect duplicate keys, and group totals by currency.
    pass
def run_demo(): return audit_invoices([], {})
`,
  solution:`def audit_invoices(invoices,policy):
    if not isinstance(invoices,list): raise ValueError("invoices must be a list")
    threshold=policy.get("approval_threshold",float("inf")) if isinstance(policy,dict) else float("inf")
    seen={}; findings=[]; totals={}
    for row in invoices:
        if not isinstance(row,dict) or not all(isinstance(row.get(k),str) and row[k] for k in ("id","vendor","number","currency")) or not isinstance(row.get("amount"),(int,float)) or row["amount"]<0: continue
        key=(row["vendor"].casefold(),row["number"].casefold())
        if key in seen: findings.append({"type":"possible_duplicate","invoice_ids":[seen[key],row["id"]],"requires_review":True})
        else: seen[key]=row["id"]
        if row["amount"]>threshold: findings.append({"type":"approval_threshold","invoice_ids":[row["id"]],"requires_review":True})
        totals[row["currency"]]=totals.get(row["currency"],0)+row["amount"]
    return {"findings":findings,"totals_by_currency":totals,"payments_initiated":0,"fraud_determined":False}
def run_demo(): return audit_invoices([], {})
`,
  testCode:`from project import audit_invoices
rows=[{"id":"i1","vendor":"N","number":"A1","amount":1250,"currency":"USD"},{"id":"i2","vendor":"N","number":"A1","amount":1250,"currency":"USD"},{"id":"i3","vendor":"S","number":"B1","amount":5,"currency":"EUR"}]
r=audit_invoices(rows,{"approval_threshold":1000})
checks=[("duplicate flagged",any(x["type"]=="possible_duplicate" for x in r["findings"])),("threshold flagged",any(x["type"]=="approval_threshold" for x in r["findings"])),("currencies separate",set(r["totals_by_currency"])=={"USD","EUR"}),("no money movement",r["payments_initiated"]==0),("no fraud conclusion",r["fraud_determined"] is False)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
