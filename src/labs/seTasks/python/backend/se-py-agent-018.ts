import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-018', title: 'Data Volume Anomaly Monitor', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Detect material count changes in sample time windows and create evidence-backed alerts for human investigation.',
  prompt: 'Implement `detect_volume_changes(windows, threshold)`. Each window has a timestamp and non-negative row count. Compare each window with the previous valid window, calculate absolute and relative changes, flag drops/spikes above the threshold, and retain the exact pair of evidence windows. Handle a zero baseline explicitly and sort the results chronologically. This is a deterministic monitor over supplied records; do not connect to a warehouse or send alerts.',
  tags: ['agentic-ai', 'data-quality', 'anomaly-detection', 'monitoring'],
  hints: ['Do not divide by zero; label a positive count after a zero baseline separately.', 'Skip malformed windows with a warning rather than losing the report.', 'A detected anomaly is a review signal, not an identified root cause.'],
  fixtures: `{"windows":[{"time":"2026-01-01","rows":1000},{"time":"2026-01-02","rows":970},{"time":"2026-01-03","rows":120}]}`,
  starter: `"""Compare data-volume windows; findings are review alerts, not root-cause claims."""
def detect_volume_changes(windows, threshold):
    """Return chronological changes and warnings, including safe zero-baseline handling."""
    # TODO: validate counts, compare adjacent valid windows and calculate relative change.
    # TODO: retain pair evidence and avoid claiming a cause for a statistical signal.
    pass

def run_demo(): return detect_volume_changes([], 0.25)
`,
  solution: `"""Compare data-volume windows; findings are review alerts, not root-cause claims."""
def detect_volume_changes(windows,threshold):
    if not isinstance(windows,list) or not isinstance(threshold,(int,float)) or threshold<0: raise ValueError("invalid windows or threshold")
    valid=[]; warnings=[]
    for i,w in enumerate(windows):
        if not isinstance(w,dict) or not isinstance(w.get("time"),str) or not isinstance(w.get("rows"),int) or isinstance(w.get("rows"),bool) or w["rows"]<0: warnings.append(f"Window {i+1} ignored: invalid fields."); continue
        valid.append(w)
    valid.sort(key=lambda w:w["time"]); changes=[]
    for before,after in zip(valid,valid[1:]):
        old,new=before["rows"],after["rows"]; delta=new-old
        ratio=(None if old==0 else delta/old)
        anomalous=(new>0 if old==0 else abs(ratio)>=threshold)
        changes.append({"from":before["time"],"to":after["time"],"previous_rows":old,"current_rows":new,"delta":delta,"relative_change":ratio,"alert":anomalous,"interpretation":"volume change needs investigation; root cause is unknown" if anomalous else "within configured threshold"})
    return {"changes":changes,"warnings":warnings,"notifications_sent":False}
def run_demo(): return detect_volume_changes([],0.25)
`,
  testCode: `from project import detect_volume_changes
r=detect_volume_changes([{"time":"2026-01-01","rows":1000},{"time":"2026-01-02","rows":970},{"time":"2026-01-03","rows":120},{"time":"2026-01-04","rows":130}],.25)
checks=[("large drop flagged",r["changes"][1]["alert"]), ("small change not flagged",not r["changes"][0]["alert"]), ("change evidence retained",r["changes"][1]["previous_rows"]==970 and r["changes"][1]["current_rows"]==120), ("cause not asserted","root cause is unknown" in r["changes"][1]["interpretation"]), ("no external alert sent",r["notifications_sent"] is False)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
