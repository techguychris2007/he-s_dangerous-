import type { CodeTask } from '../codeTypes';

const report = `
for name, ok in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _, ok in checks)}/{len(checks)}")
`;
export const CLOUD_PROTOCOL_TASKS: CodeTask[] = [
  {
    id: 'py-cloud-events', title: 'Build a Cloud Audit Event Analyzer', language: 'python', category: 'Advanced', difficulty: 'Hard',
    prompt: 'Implement analyze_cloud_events(events) yourself. Input must be a list; otherwise raise TypeError. Each record must be a dictionary containing nonempty string eventID, eventName and actor, and eventTime exactly formatted YYYY-MM-DDTHH:MM:SSZ. Reject whitespace-only identity fields without normalizing accepted values. Optional errorCode must be a string when present. Reject invalid records and duplicate eventIDs; the first valid record owns an ID, so an invalid record does not reserve it. Return {"timeline": accepted records sorted by (eventTime,eventID), "rejected": zero-based input indices in input order, "by_actor": counts of accepted events by actor, "denied": accepted eventIDs whose errorCode is exactly "AccessDenied", ordered as in the timeline}. Do not mutate input records. Build parsing, validation, deduplication, chronological ordering, aggregation and denial classification; all implementation belongs to you. Use only synthetic event data.',
    starterCode: 'def analyze_cloud_events(events):\n    pass\n',
    hints: ['Validate field types before parsing a timestamp; datetime parsing alone can accept representations outside your exact contract.', 'Reserve an event ID only after all of its fields pass validation.', 'Build the timeline before deriving the ordered denied IDs.'],
    solution: `from datetime import datetime

def analyze_cloud_events(events):
    if not isinstance(events, list):
        raise TypeError("events must be a list")
    timeline = []
    rejected = []
    seen = set()
    for index, record in enumerate(events):
        valid = isinstance(record, dict)
        if not valid:
            rejected.append(index)
            continue
        for key in ("eventID", "eventName", "actor"):
            value = record.get(key)
            if not isinstance(value, str) or not value.strip():
                valid = False
        stamp = record.get("eventTime")
        if not isinstance(stamp, str):
            valid = False
        else:
            try:
                parsed = datetime.strptime(stamp, "%Y-%m-%dT%H:%M:%SZ")
                if parsed.strftime("%Y-%m-%dT%H:%M:%SZ") != stamp:
                    valid = False
            except ValueError:
                valid = False
        if "errorCode" in record:
            if not isinstance(record["errorCode"], str):
                valid = False
        if valid and record["eventID"] in seen:
            valid = False
        if not valid:
            rejected.append(index)
            continue
        seen.add(record["eventID"])
        timeline.append(dict(record))
    timeline.sort(key=lambda row: (row["eventTime"], row["eventID"]))
    by_actor = {}
    denied = []
    for record in timeline:
        actor = record["actor"]
        by_actor[actor] = by_actor.get(actor, 0) + 1
        if record.get("errorCode") == "AccessDenied":
            denied.append(record["eventID"])
    return {
        "timeline": timeline,
        "rejected": rejected,
        "by_actor": by_actor,
        "denied": denied,
    }
`,
    testCode: `from copy import deepcopy
base = {"eventID":"a","eventName":"GetObject","actor":"training-role","eventTime":"2026-01-02T10:00:00Z"}
late = {**base,"eventID":"b","eventTime":"2026-01-02T10:01:00Z","errorCode":"AccessDenied"}
invalid = {**base,"eventID":"c","eventTime":"2026-02-30T10:00:00Z"}
source = [late, base, dict(base), invalid, None]
original = deepcopy(source)
result = analyze_cloud_events(source)
checks = [
    ("chronological order", [r["eventID"] for r in result["timeline"]] == ["a","b"]),
    ("duplicates and malformed records", result["rejected"] == [2,3,4]),
    ("actor aggregate", result["by_actor"] == {"training-role":2}),
    ("denial classification", result["denied"] == ["b"]),
    ("no input mutation", source == original),
    ("empty inventory", analyze_cloud_events([]) == {"timeline":[],"rejected":[],"by_actor":{},"denied":[]}),
    ("invalid ID not reserved", len(analyze_cloud_events([{**base,"actor":""},base])["timeline"]) == 1),
    ("reject non-string outcome", analyze_cloud_events([{**base,"errorCode":None}])["rejected"] == [0]),
    ("strict timestamp form", analyze_cloud_events([{**base,"eventTime":"2026-1-2T10:00:00Z"}])["rejected"] == [0]),
]
try:
    analyze_cloud_events(None)
    checks.append(("input type",False))
except TypeError:
    checks.append(("input type",True))
` + report,
  },
  {
    id: 'py-stream-frames', title: 'Implement a Bounded UTF-8 Frame Codec', language: 'python', category: 'Advanced', difficulty: 'Hard',
    prompt: 'Implement encode_frames(messages) and decode_frames(data, max_payload=4096), writing all code yourself. The wire format repeats a four-byte unsigned big-endian payload length followed by exactly that many UTF-8 bytes. encode_frames requires a list of strings, raises TypeError for wrong types and ValueError when any encoded payload exceeds 4096 bytes. decode_frames requires bytes and an exact integer max_payload in 0..4096 (bool is not allowed); raise TypeError for wrong types and ValueError for invalid bounds, truncated header/body, oversized advertised payload or invalid UTF-8. Return the decoded string list. Empty input returns [] and a zero-length frame represents "". Length is measured in encoded bytes, not Unicode characters. Reject a malformed trailing frame rather than returning partial success. Implement type checks, byte-length checks, encoding, big-endian headers, cursor bounds, strict decoding and complete-consumption behavior.',
    starterCode: 'def encode_frames(messages):\n    pass\n\ndef decode_frames(data, max_payload=4096):\n    pass\n',
    hints: ['Encode each string before calculating its wire length.', 'Check remaining bytes before every header/body read.', 'A valid earlier frame must not hide a malformed trailing frame.'],
    solution: `def encode_frames(messages):
    if not isinstance(messages, list):
        raise TypeError("messages must be a list")
    result = bytearray()
    for message in messages:
        if not isinstance(message, str):
            raise TypeError("every message must be a string")
        payload = message.encode("utf-8")
        length = len(payload)
        if length > 4096:
            raise ValueError("payload too large")
        header = length.to_bytes(4, "big")
        result.extend(header)
        result.extend(payload)
    return bytes(result)

def decode_frames(data, max_payload=4096):
    if not isinstance(data, bytes):
        raise TypeError("data must be bytes")
    if type(max_payload) is not int:
        raise TypeError("max_payload must be an integer")
    if not 0 <= max_payload <= 4096:
        raise ValueError("invalid payload bound")
    messages = []
    cursor = 0
    total = len(data)
    while cursor < total:
        remaining = total - cursor
        if remaining < 4:
            raise ValueError("truncated frame header")
        header_end = cursor + 4
        header = data[cursor:header_end]
        length = int.from_bytes(header, "big")
        if length > max_payload:
            raise ValueError("advertised payload too large")
        body_start = header_end
        body_end = body_start + length
        if body_end > total:
            raise ValueError("truncated frame body")
        payload = data[body_start:body_end]
        try:
            message = payload.decode("utf-8", errors="strict")
        except UnicodeDecodeError as error:
            raise ValueError("invalid UTF-8") from error
        messages.append(message)
        cursor = body_end
    return messages
`,
    testCode: `checks = [
 ("empty wire", decode_frames(b"") == []),
 ("round trip Unicode", decode_frames(encode_frames(["hello","é",""])) == ["hello","é",""]),
 ("wire byte length", encode_frames(["é"])[:4] == (2).to_bytes(4,"big")),
 ("known wire", decode_frames(b"\\x00\\x00\\x00\\x01A") == ["A"]),
 ("zero bound empty frame", decode_frames(bytes(4),0) == [""]),
]
for name, function, arguments, exception in [
 ("truncated header",decode_frames,(b"A",),ValueError),
 ("truncated body",decode_frames,(b"\\x00\\x00\\x00\\x02A",),ValueError),
 ("invalid UTF-8",decode_frames,(b"\\x00\\x00\\x00\\x01\\xff",),ValueError),
 ("malformed trailing frame",decode_frames,(encode_frames(["ok"])+b"A",),ValueError),
 ("oversized header",decode_frames,((4097).to_bytes(4,"big"),),ValueError),
 ("oversized encoding",encode_frames,(["A"*4097],),ValueError),
 ("wrong message type",encode_frames,([1],),TypeError),
 ("wrong wire type",decode_frames,("text",),TypeError),
 ("boolean bound",decode_frames,(b"",True),TypeError),
 ("invalid bound",decode_frames,(b"",-1),ValueError),
]:
 try:
    function(*arguments)
    checks.append((name,False))
 except exception:
    checks.append((name,True))
` + report,
  },
];
