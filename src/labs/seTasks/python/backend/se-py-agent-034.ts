import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-034', title:'Sliding-Window Stream Anomaly Monitor', difficulty:'Hard', category:'Agentic AI / Data Engineering',
  summary:'Evaluate local event sequences with a prior-only moving baseline and evidence-backed alerts.',
  prompt:'Implement `analyze_stream(events, window_size, threshold)`. Calculate each baseline from prior events only, flag deviations above threshold, and return event ids plus compared sample ids. Do not publish webhooks or claim a root cause.',
  tags:['agentic-ai','stream-processing','statistics','monitoring'], hints:['Use prior observations only.','Do not alert before a baseline exists.','Tie findings to evidence ids.'],
  fixtures:`{"events":[{"id":"e1","value":10},{"id":"e2","value":11},{"id":"e3","value":9},{"id":"e4","value":30}],"window_size":3,"threshold":10}`,
  starter:`"""Analyze a local event sequence with a rolling historical baseline."""
def analyze_stream(events, window_size, threshold):
    # TODO: calculate prior-only baselines and retain compared sample ids.
    pass
def run_demo(): return analyze_stream([], 3, 10)
`,
  solution:`def analyze_stream(events,window_size,threshold):
    if not isinstance(events,list) or not isinstance(window_size,int) or window_size<1 or not isinstance(threshold,(int,float)) or threshold<0: raise ValueError("invalid inputs")
    history=[]; results=[]
    for event in events:
        if not isinstance(event,dict) or not isinstance(event.get("id"),str) or not isinstance(event.get("value"),(int,float)) or isinstance(event.get("value"),bool): continue
        prior=history[-window_size:]; baseline=sum(x["value"] for x in prior)/len(prior) if prior else None
        alert=baseline is not None and abs(event["value"]-baseline)>threshold
        results.append({"event_id":event["id"],"baseline":baseline,"baseline_event_ids":[x["id"] for x in prior],"value":event["value"],"alert":alert,"cause":"unknown" if alert else None}); history.append(event)
    return {"events":results,"webhooks_sent":0}
def run_demo(): return analyze_stream([],3,10)
`,
  testCode:`from project import analyze_stream
r=analyze_stream([{"id":"e1","value":10},{"id":"e2","value":11},{"id":"e3","value":9},{"id":"e4","value":30}],3,10)
checks=[("first has no baseline",r["events"][0]["baseline"] is None),("prior baseline correct",r["events"][3]["baseline"]==10),("evidence retained",r["events"][3]["baseline_event_ids"]==["e1","e2","e3"]),("outlier flagged",r["events"][3]["alert"]),("cause unknown",r["events"][3]["cause"]=="unknown"),("no webhook",r["webhooks_sent"]==0)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
