import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-agent-022', title: 'Idempotent Data Sync Outbox', difficulty: 'Hard', category: 'Agentic AI / Data Engineering',
  summary: 'Project a batch of source changes into a search index payload using idempotent keys and explicit deletion markers.',
  prompt: 'Implement `build_sync_batch(events, indexed_ids)`. Validate event ids, entity ids, versions, and operation types; emit only the newest version per entity; ignore already indexed event ids; and return deterministic upsert/delete payloads plus a replay-safe checkpoint. Preserve tombstones rather than silently dropping deletes. This is a local transformation only: do not connect to MySQL, Elasticsearch, Qdrant, or another service.',
  tags: ['agentic-ai', 'data-sync', 'idempotency', 'event-processing'],
  hints: ['Idempotency is based on stable event ids, not batch position.', 'Use version numbers to resolve multiple changes for one entity.', 'A delete event should be represented explicitly as a tombstone.'],
  fixtures: `{"events":[{"event_id":"e1","entity_id":"u1","version":1,"operation":"upsert","payload":{"name":"A"}},{"event_id":"e2","entity_id":"u1","version":2,"operation":"delete"}],"indexed_ids":["e1"]}`,
  starter: `"""Create a deterministic sync payload from sample change events only."""
def build_sync_batch(events, indexed_ids):
    """Return latest entity actions, replay-safe event ids, and a checkpoint."""
    # TODO: validate records, skip processed events and resolve each entity's latest version.
    # TODO: preserve deletion tombstones and keep output order deterministic.
    pass

def run_demo(): return build_sync_batch([], [])
`,
  solution: `"""Create a deterministic sync payload from sample change events only."""
def build_sync_batch(events,indexed_ids):
    if not isinstance(events,list): raise ValueError("events must be a list")
    done=set(x for x in indexed_ids if isinstance(x,str)) if isinstance(indexed_ids,list) else set()
    latest={}; warnings=[]; accepted=[]
    for event in events:
        if not isinstance(event,dict) or not all(isinstance(event.get(k),str) and event[k] for k in ("event_id","entity_id")) or not isinstance(event.get("version"),int) or event.get("operation") not in ("upsert","delete"):
            warnings.append("Invalid event ignored."); continue
        if event["event_id"] in done: continue
        accepted.append(event["event_id"]); old=latest.get(event["entity_id"])
        if old is None or event["version"]>old["version"]: latest[event["entity_id"]]=event
    actions=[]
    for entity,event in sorted(latest.items()):
        action={"entity_id":entity,"version":event["version"],"operation":event["operation"]}
        if event["operation"]=="upsert": action["payload"]=event.get("payload",{})
        else: action["tombstone"]=True
        actions.append(action)
    return {"actions":actions,"processed_event_ids":sorted(accepted),"checkpoint":max(accepted) if accepted else None,"warnings":warnings,"external_writes":0}
def run_demo(): return build_sync_batch([], [])
`,
  testCode: `from project import build_sync_batch
events=[{"event_id":"e1","entity_id":"u1","version":1,"operation":"upsert","payload":{"name":"A"}},{"event_id":"e2","entity_id":"u1","version":2,"operation":"delete"}]
r=build_sync_batch(events,["e1"])
checks=[("processed event skipped",r["processed_event_ids"]==["e2"]), ("newest version selected",r["actions"][0]["version"]==2), ("delete tombstone preserved",r["actions"][0].get("tombstone") is True), ("checkpoint stable",r["checkpoint"]=="e2"), ("no external write",r["external_writes"]==0)]
for name,ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
