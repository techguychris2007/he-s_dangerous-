import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-005', title: 'SOC Incident Timeline Copilot', difficulty: 'Hard', category: 'Agentic AI / Security Operations',
  summary: 'Correlate synthetic alert records into a defensible incident timeline and propose containment actions for analyst approval.',
  prompt: 'Implement `build_incident(events)` over the supplied synthetic SIEM records. Parse ISO-8601 timestamps, normalize event types and entity identifiers, ignore malformed records with explicit warnings, and produce a stable chronological timeline. Correlate events that share an account or host within a 30-minute window; summarize indicators with event ids as evidence. You may propose `disable_account` or `isolate_host`, but all proposals must be marked `requires_approval: true` and include the evidence that triggered them. Do not connect to a SIEM, disable an account, or isolate a real host.',
  tags: ['agentic-ai', 'soc', 'incident-response', 'human-approval'],
  hints: ['Treat input events as untrusted; require an id, timestamp, type, and at least one entity.', 'Use timezone-aware datetime parsing and sort by timestamp then event id.', 'Keep proposed containment separate from execution and cite the supporting event ids.'],
  fixtures: `{"events":[{"id":"e3","time":"2026-03-01T10:25:00Z","type":"EDR_ALERT","account":"mira","host":"ws-14"},{"id":"e1","time":"2026-03-01T10:04:00Z","type":"LOGIN_FAILURE","account":"mira","host":"ws-14"},{"id":"e2","time":"2026-03-01T10:12:00Z","type":"LOGIN_SUCCESS","account":"mira","host":"ws-14"},{"id":"bad","time":"tomorrow","type":"UNKNOWN"}]}`,
  starter: `"""Offline incident correlation over synthetic events; no containment is executed."""

from datetime import datetime

def _parse_time(value):
    """Parse an ISO-8601 timestamp, accepting a trailing Z."""
    # TODO: return an aware datetime or None for invalid input.
    pass

def build_incident(events):
    """Return {timeline, warnings, proposals}; every proposal needs approval."""
    # TODO: validate, sort, correlate same-entity events within 30 minutes, and cite evidence.
    pass

def run_demo():
    return build_incident([])
`,
  solution: `"""Offline incident correlation over synthetic events; no containment is executed."""
from datetime import datetime, timezone

SUSPICIOUS = {"EDR_ALERT", "MALWARE_DETECTED", "IMPOSSIBLE_TRAVEL", "MFA_BYPASS"}

def _parse_time(value):
    if not isinstance(value, str): return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None: return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError: return None

def build_incident(events):
    if not isinstance(events, list): raise ValueError("events must be a list")
    valid, warnings = [], []
    for index, event in enumerate(events):
        if not isinstance(event, dict): warnings.append(f"Record {index + 1} ignored: expected object."); continue
        eid, kind = event.get("id"), event.get("type")
        when = _parse_time(event.get("time"))
        entities = {key: event.get(key) for key in ("account", "host") if isinstance(event.get(key), str) and event.get(key).strip()}
        if not isinstance(eid, str) or not eid or not isinstance(kind, str) or not when or not entities:
            warnings.append(f"Record {index + 1} ignored: required event fields are invalid."); continue
        normalized = dict(event); normalized["type"] = kind.strip().upper(); normalized["_time"] = when; normalized["_entities"] = entities
        valid.append(normalized)
    valid.sort(key=lambda event: (event["_time"], event["id"]))
    timeline = [{"id":e["id"],"time":e["_time"].isoformat().replace("+00:00","Z"),"type":e["type"],"entities":e["_entities"]} for e in valid]
    proposals = []
    for alert in valid:
        if alert["type"] not in SUSPICIOUS: continue
        related = []
        for candidate in valid:
            if abs((candidate["_time"] - alert["_time"]).total_seconds()) > 1800: continue
            if any(candidate["_entities"].get(key) == value for key, value in alert["_entities"].items()): related.append(candidate["id"])
        for key, value in alert["_entities"].items():
            action = "disable_account" if key == "account" else "isolate_host"
            proposals.append({"action":action,"entity":value,"evidence":sorted(set(related)),"requires_approval":True,"status":"proposal_only"})
    unique = {}
    for proposal in proposals: unique[(proposal["action"], proposal["entity"])] = proposal
    return {"timeline":timeline,"warnings":warnings,"proposals":list(unique.values())}

def run_demo():
    return build_incident([])
`,
  testCode: `from project import build_incident
events = [{"id":"e3","time":"2026-03-01T10:25:00Z","type":"EDR_ALERT","account":"mira","host":"ws-14"},{"id":"e1","time":"2026-03-01T10:04:00Z","type":"LOGIN_FAILURE","account":"mira","host":"ws-14"},{"id":"e2","time":"2026-03-01T10:12:00Z","type":"LOGIN_SUCCESS","account":"mira","host":"ws-14"},{"id":"bad","time":"tomorrow","type":"UNKNOWN"}]
r = build_incident(events)
checks = [("timeline chronological", [x["id"] for x in r["timeline"]] == ["e1","e2","e3"]), ("invalid event warning", len(r["warnings"]) == 1), ("proposal requires approval", all(p["requires_approval"] and p["status"] == "proposal_only" for p in r["proposals"])), ("account and host proposals", {p["action"] for p in r["proposals"]} == {"disable_account","isolate_host"}), ("evidence is cited", all(set(p["evidence"]) == {"e1","e2","e3"} for p in r["proposals"])), ("empty input safe", build_incident([])["timeline"] == [])]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
