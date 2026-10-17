import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-013', title: 'Threat Bulletin Normalizer', difficulty: 'Medium', category: 'Agentic AI / Threat Intelligence',
  summary: 'Normalize fictional threat bulletins into deduplicated, source-attributed intelligence records.',
  prompt: 'Implement `normalize_bulletins(items, technology_stack)`. Parse supplied bulletin records, normalize CVE identifiers and dates, deduplicate by stable identifier, and match only explicit affected-product names against the provided technology inventory. Preserve source and confidence, label outdated/unknown data as requiring analyst verification, and do not infer that an organization is vulnerable from a product-name match alone. Use only supplied records; do not scrape feeds or access dark-web sources.',
  tags: ['agentic-ai', 'threat-intelligence', 'normalization', 'provenance'],
  hints: ['A matching product name is a lead, not proof of exposure.', 'Deduplicate while preserving all sources.', 'Normalize identifiers without discarding provenance fields.'],
  fixtures: `{"items":[{"id":"cve-2025-1234","product":"ExampleServer","published":"2025-04-01","source":"vendor-advisory","confidence":"high"},{"id":"CVE-2025-1234","product":"ExampleServer","published":"2025-04-02","source":"blog","confidence":"medium"}],"technology_stack":["ExampleServer"]}`,
  starter: `"""Normalize supplied threat records; no network or external feed access."""
import re

def normalize_bulletins(items, technology_stack):
    """Return normalized advisories, source provenance and verification caveats."""
    # TODO: validate, normalize CVE IDs, deduplicate and keep all source records.
    # TODO: match product names exactly and label matches as unverified leads.
    pass

def run_demo(): return normalize_bulletins([], [])
`,
  solution: `"""Normalize supplied threat records; no network or external feed access."""
import re
def normalize_bulletins(items,technology_stack):
    if not isinstance(items,list): raise ValueError("items must be a list")
    stack={x.casefold() for x in technology_stack if isinstance(x,str)} if isinstance(technology_stack,list) else set()
    grouped={}; warnings=[]
    for item in items:
        if not isinstance(item,dict) or not isinstance(item.get("id"),str): warnings.append("Invalid bulletin ignored."); continue
        ident=item["id"].upper()
        if not re.fullmatch(r"CVE-\\d{4}-\\d{4,7}",ident): warnings.append("Unsupported advisory identifier ignored."); continue
        row=grouped.setdefault(ident,{"id":ident,"sources":[],"products":set(),"published":item.get("published")})
        if isinstance(item.get("source"),str): row["sources"].append(item["source"])
        if isinstance(item.get("product"),str): row["products"].add(item["product"])
    results=[]
    for ident,row in sorted(grouped.items()):
        products=sorted(row["products"]); matches=sorted(p for p in products if p.casefold() in stack)
        results.append({"id":ident,"products":products,"sources":sorted(set(row["sources"])),"published":row["published"],"inventory_matches":matches,"status":"analyst_verification_required","exposure_confirmed":False})
    return {"advisories":results,"warnings":warnings}
def run_demo(): return normalize_bulletins([], [])
`,
  testCode: `from project import normalize_bulletins
items=[{"id":"cve-2025-1234","product":"ExampleServer","source":"vendor"},{"id":"CVE-2025-1234","product":"ExampleServer","source":"blog"}]
r=normalize_bulletins(items,["ExampleServer"])
checks=[("duplicate consolidated",len(r["advisories"])==1), ("CVE normalized",r["advisories"][0]["id"]=="CVE-2025-1234"), ("sources preserved",r["advisories"][0]["sources"]==["blog","vendor"]), ("product match is not confirmation",r["advisories"][0]["exposure_confirmed"] is False), ("match requires review",r["advisories"][0]["status"]=="analyst_verification_required")]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
