import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-024',title:'Competitive Intelligence Brief Builder',difficulty:'Medium',category:'Agentic AI / Business Workflows',
  summary:'Turn supplied competitor observations into a dated, source-attributed comparison brief.',
  prompt:'Implement `build_brief(observations)`. Normalize organization, topic, value, date, and source; group comparable facts; highlight changes between dated price observations; preserve source attribution and mark unsupported claims as unknown. Never scrape sites or present an observation as independently verified.',
  tags:['agentic-ai','research','provenance'],hints:['Keep facts attached to source and date.','Compare like-for-like units.','Treat source records as evidence to review.'],
  fixtures:`{"observations":[{"company":"Northstar","topic":"starter_price","value":20,"unit":"USD/month","date":"2026-01-01","source":"pricing-page"},{"company":"Northstar","topic":"starter_price","value":24,"unit":"USD/month","date":"2026-04-01","source":"pricing-page"}]}`,
  starter:`"""Summarize supplied observations; no browsing or scraping."""
def build_brief(observations):
    # TODO: validate, group source-attributed facts, and compare matching values.
    pass
def run_demo(): return build_brief([])
`,
  solution:`def build_brief(observations):
    if not isinstance(observations,list): raise ValueError("observations must be a list")
    groups={}; warnings=[]
    for row in observations:
        if not isinstance(row,dict) or not all(isinstance(row.get(k),str) for k in ("company","topic","date","source")) or "value" not in row: warnings.append("Invalid observation ignored."); continue
        key=(row["company"],row["topic"],row.get("unit","")); groups.setdefault(key,[]).append(row)
    facts=[]
    for (company,topic,unit),rows in sorted(groups.items()):
        rows=sorted(rows,key=lambda x:x["date"]); change=rows[-1]["value"]-rows[-2]["value"] if len(rows)>1 and all(isinstance(r["value"],(int,float)) for r in rows[-2:]) else None
        facts.append({"company":company,"topic":topic,"unit":unit,"latest":rows[-1]["value"],"sources":[{"date":r["date"],"source":r["source"]} for r in rows],"change":change})
    return {"facts":facts,"warnings":warnings,"verification":"Review each cited source before relying on this brief."}
def run_demo(): return build_brief([])
`,
  testCode:`from project import build_brief
r=build_brief([{"company":"N","topic":"price","value":20,"unit":"USD","date":"2026-01-01","source":"page"},{"company":"N","topic":"price","value":25,"unit":"USD","date":"2026-02-01","source":"page"}])
checks=[("change calculated",r["facts"][0]["change"]==5),("sources retained",len(r["facts"][0]["sources"])==2),("verification caveat",bool(r["verification"])),("bad record warned",len(build_brief([None])["warnings"])==1)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
