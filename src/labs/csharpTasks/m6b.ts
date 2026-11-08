import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 6 · System Design';

/** Month 6, week 22 (lessons dn6-3, dn6-4): the moving parts of a real-time messaging platform. */
export const CSHARP_MONTH6_B_TASKS: CodeTask[] = [
  {
    id: 'cs-6-05',
    title: 'Presence Across Devices, Without Flapping',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Show who is online. Every connected device sends a heartbeat every few seconds; a device whose last heartbeat is heartbeatTimeout or ' +
      'more in the past is gone. A user is online while any of their devices is alive. Implement PresenceTracker(heartbeatTimeout): ' +
      'Heartbeat(user, device, now) records a beat; Disconnect(user, device) removes a device at once (a clean sign-out); IsOnline(user, now); ' +
      'OnlineAmong(users, now) returns the online ones in the order given. Sweep(now) reports changes since the previous sweep as ' +
      'PresenceEvents, ordered by user id (ordinal): CameOnline for a user who is online now but was not at the last sweep, WentOffline for ' +
      'the reverse — and nothing for a user who connected and disconnected between two sweeps, so a phone dropping in and out of a tunnel ' +
      'does not spam every contact. Sweep also forgets expired devices.',
    starterCode: `public enum PresenceChange { CameOnline, WentOffline }

public sealed record PresenceEvent(string UserId, PresenceChange Change, DateTimeOffset At);

public sealed class PresenceTracker
{
    public PresenceTracker(TimeSpan heartbeatTimeout) => throw new NotImplementedException();

    public void Heartbeat(string userId, string deviceId, DateTimeOffset now) => throw new NotImplementedException();
    public void Disconnect(string userId, string deviceId) => throw new NotImplementedException();
    public bool IsOnline(string userId, DateTimeOffset now) => throw new NotImplementedException();
    public IReadOnlyList<string> OnlineAmong(IEnumerable<string> userIds, DateTimeOffset now) => throw new NotImplementedException();
    public IReadOnlyList<PresenceEvent> Sweep(DateTimeOffset now) => throw new NotImplementedException();
}
`,
    hints: [
      'Keep Dictionary<string, Dictionary<string, DateTimeOffset>>: user → device → last heartbeat. A device is alive when now - last < timeout.',
      'Keep a HashSet<string> of users reported online at the last sweep. Sweep compares it with who is online now.',
      'In Sweep, first remove expired devices (and users with no devices), then compute the events, then replace the reported set.',
    ],
    solution: `public enum PresenceChange { CameOnline, WentOffline }

public sealed record PresenceEvent(string UserId, PresenceChange Change, DateTimeOffset At);

public sealed class PresenceTracker
{
    private readonly TimeSpan _timeout;
    private readonly Dictionary<string, Dictionary<string, DateTimeOffset>> _devices = new(StringComparer.Ordinal);
    private HashSet<string> _reportedOnline = new(StringComparer.Ordinal);

    public PresenceTracker(TimeSpan heartbeatTimeout)
    {
        if (heartbeatTimeout <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(heartbeatTimeout));
        _timeout = heartbeatTimeout;
    }

    public void Heartbeat(string userId, string deviceId, DateTimeOffset now)
    {
        if (!_devices.TryGetValue(userId, out var devices)) _devices[userId] = devices = new(StringComparer.Ordinal);
        devices[deviceId] = now;
    }

    public void Disconnect(string userId, string deviceId)
    {
        if (_devices.TryGetValue(userId, out var devices) && devices.Remove(deviceId) && devices.Count == 0) _devices.Remove(userId);
    }

    public bool IsOnline(string userId, DateTimeOffset now) =>
        _devices.TryGetValue(userId, out var devices) && devices.Values.Any(last => now - last < _timeout);

    public IReadOnlyList<string> OnlineAmong(IEnumerable<string> userIds, DateTimeOffset now) =>
        userIds.Where(u => IsOnline(u, now)).ToList();

    public IReadOnlyList<PresenceEvent> Sweep(DateTimeOffset now)
    {
        foreach (var (user, devices) in _devices.ToList())
        {
            foreach (var (device, last) in devices.ToList())
                if (now - last >= _timeout) devices.Remove(device);
            if (devices.Count == 0) _devices.Remove(user);
        }
        var online = new HashSet<string>(_devices.Keys, StringComparer.Ordinal);
        var events = online.Except(_reportedOnline).Select(u => new PresenceEvent(u, PresenceChange.CameOnline, now))
            .Concat(_reportedOnline.Except(online).Select(u => new PresenceEvent(u, PresenceChange.WentOffline, now)))
            .OrderBy(e => e.UserId, StringComparer.Ordinal)
            .ToList();
        _reportedOnline = online;
        return events;
    }
}
`,
    testCode: csTests(`
var t0 = DateTimeOffset.Parse("2026-11-08T12:00:00Z");
PresenceTracker Tracker() => new(TimeSpan.FromSeconds(30));
string Events(IEnumerable<PresenceEvent> e) => string.Join(",", e.Select(x => x.UserId + ":" + x.Change));
Check("a heartbeat makes a user online", () => { var p = Tracker(); p.Heartbeat("ama", "phone", t0); return p.IsOnline("ama", t0.AddSeconds(10)); }, true);
Check("silence for the timeout means offline", () => { var p = Tracker(); p.Heartbeat("ama", "phone", t0); return p.IsOnline("ama", t0.AddSeconds(29)) + ":" + p.IsOnline("ama", t0.AddSeconds(30)); }, "True:False");
Check("any live device keeps a user online", () => { var p = Tracker(); p.Heartbeat("ama", "phone", t0); p.Heartbeat("ama", "laptop", t0.AddSeconds(25)); return p.IsOnline("ama", t0.AddSeconds(40)); }, true);
Check("a clean sign-out of the last device is immediate", () => { var p = Tracker(); p.Heartbeat("ama", "phone", t0); p.Disconnect("ama", "phone"); return p.IsOnline("ama", t0); }, false);
Check("signing out one device keeps the other", () => { var p = Tracker(); p.Heartbeat("ama", "phone", t0); p.Heartbeat("ama", "laptop", t0); p.Disconnect("ama", "phone"); return p.IsOnline("ama", t0); }, true);
CheckSeq("filters a contact list, keeping its order", () => { var p = Tracker(); foreach (var u in new[] { "kofi", "ama", "esi" }) p.Heartbeat(u, "d", t0); p.Disconnect("esi", "d"); return p.OnlineAmong(["esi", "kofi", "yaw", "ama"], t0); }, ["kofi", "ama"]);
Check("sweeps report who came online, sorted", () => { var p = Tracker(); p.Heartbeat("kofi", "d", t0); p.Heartbeat("ama", "d", t0); return Events(p.Sweep(t0)); }, "ama:CameOnline,kofi:CameOnline");
Check("nothing changed, nothing reported", () => { var p = Tracker(); p.Heartbeat("ama", "d", t0); p.Sweep(t0); p.Heartbeat("ama", "d", t0.AddSeconds(10)); return p.Sweep(t0.AddSeconds(10)).Count; }, 0);
Check("timeouts are reported as went offline", () => { var p = Tracker(); p.Heartbeat("ama", "d", t0); p.Heartbeat("kofi", "d", t0.AddSeconds(20)); p.Sweep(t0.AddSeconds(20)); return Events(p.Sweep(t0.AddSeconds(35))); }, "ama:WentOffline");
Check("in and out between sweeps is not reported", () => { var p = Tracker(); p.Sweep(t0); p.Heartbeat("ama", "phone", t0.AddSeconds(1)); p.Disconnect("ama", "phone"); return p.Sweep(t0.AddSeconds(5)).Count; }, 0);
Check("an online user who blips is not reported offline", () => { var p = Tracker(); p.Heartbeat("ama", "phone", t0); p.Sweep(t0); p.Disconnect("ama", "phone"); p.Heartbeat("ama", "phone", t0.AddSeconds(3)); return p.Sweep(t0.AddSeconds(5)).Count; }, 0);
Check("event times are the sweep time", () => { var p = Tracker(); p.Heartbeat("ama", "d", t0); return p.Sweep(t0.AddSeconds(2)).Single().At; }, t0.AddSeconds(2));
`),
  },
  {
    id: 'cs-6-06',
    title: 'Fan-Out with Bounded Queues: Never Let One Slow Client Stall a Room',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'A chat server pushes each room message to every member\'s connection. A connection that stops reading (a phone on a bad network) must ' +
      'not make the server buffer without limit or slow down everyone else. Implement RoomBroadcaster(queueCapacity): Connect(id), ' +
      'Join(id, room) and Leave(id, room) (InvalidOperationException for an unknown connection), Disconnect(id) (removes it from every room ' +
      'and drops its queue). Publish(room, body) assigns the room\'s next sequence number (1, 2, 3… per room, even when nobody is in the room) ' +
      'and enqueues an Envelope on every member connection; a member whose queue is already full is disconnected as a slow consumer instead of ' +
      'blocking — it will reconnect and catch up from storage. It returns PublishReport(Sequence, Delivered, Dropped) with dropped connection ' +
      'ids in ordinal order. Drain(id, max) dequeues up to max envelopes in order (empty for an unknown connection); Pending(id) and ' +
      'IsConnected(id) report state.',
    starterCode: `public sealed record Envelope(string Room, long Sequence, string Body);

public sealed record PublishReport(long Sequence, int Delivered, IReadOnlyList<string> Dropped);

public sealed class RoomBroadcaster
{
    public RoomBroadcaster(int queueCapacity) => throw new NotImplementedException();

    public void Connect(string connectionId) => throw new NotImplementedException();
    public void Join(string connectionId, string room) => throw new NotImplementedException();
    public void Leave(string connectionId, string room) => throw new NotImplementedException();
    public void Disconnect(string connectionId) => throw new NotImplementedException();
    public bool IsConnected(string connectionId) => throw new NotImplementedException();
    public int Pending(string connectionId) => throw new NotImplementedException();

    public PublishReport Publish(string room, string body) => throw new NotImplementedException();
    public IReadOnlyList<Envelope> Drain(string connectionId, int max) => throw new NotImplementedException();
}
`,
    hints: [
      'State: Dictionary<string, Queue<Envelope>> queues per connection, Dictionary<string, HashSet<string>> members per room, Dictionary<string, long> sequence per room.',
      'Publish: increment the room sequence first; then, for each member (copy the set — you may remove members while iterating), either enqueue or collect it as dropped.',
      'Disconnect must also remove the connection from every room\'s member set.',
    ],
    solution: `public sealed record Envelope(string Room, long Sequence, string Body);

public sealed record PublishReport(long Sequence, int Delivered, IReadOnlyList<string> Dropped);

public sealed class RoomBroadcaster
{
    private readonly int _capacity;
    private readonly Dictionary<string, Queue<Envelope>> _queues = new(StringComparer.Ordinal);
    private readonly Dictionary<string, HashSet<string>> _members = new(StringComparer.Ordinal);
    private readonly Dictionary<string, long> _sequences = new(StringComparer.Ordinal);

    public RoomBroadcaster(int queueCapacity)
    {
        if (queueCapacity < 1) throw new ArgumentOutOfRangeException(nameof(queueCapacity));
        _capacity = queueCapacity;
    }

    public void Connect(string connectionId) => _queues.TryAdd(connectionId, new Queue<Envelope>());

    public void Join(string connectionId, string room)
    {
        Require(connectionId);
        if (!_members.TryGetValue(room, out var members)) _members[room] = members = new(StringComparer.Ordinal);
        members.Add(connectionId);
    }

    public void Leave(string connectionId, string room)
    {
        Require(connectionId);
        if (_members.TryGetValue(room, out var members)) members.Remove(connectionId);
    }

    public void Disconnect(string connectionId)
    {
        _queues.Remove(connectionId);
        foreach (var members in _members.Values) members.Remove(connectionId);
    }

    public bool IsConnected(string connectionId) => _queues.ContainsKey(connectionId);

    public int Pending(string connectionId) => _queues.TryGetValue(connectionId, out var q) ? q.Count : 0;

    public PublishReport Publish(string room, string body)
    {
        long sequence = _sequences[room] = _sequences.GetValueOrDefault(room) + 1;
        var envelope = new Envelope(room, sequence, body);
        int delivered = 0;
        var dropped = new List<string>();
        if (_members.TryGetValue(room, out var members))
        {
            foreach (var connection in members.ToList())
            {
                var queue = _queues[connection];
                if (queue.Count >= _capacity)
                {
                    dropped.Add(connection);   // slow consumer: cut it loose, it will resync from storage
                    Disconnect(connection);
                    continue;
                }
                queue.Enqueue(envelope);
                delivered++;
            }
        }
        dropped.Sort(StringComparer.Ordinal);
        return new PublishReport(sequence, delivered, dropped);
    }

    public IReadOnlyList<Envelope> Drain(string connectionId, int max)
    {
        var drained = new List<Envelope>();
        if (!_queues.TryGetValue(connectionId, out var queue)) return drained;
        while (drained.Count < max && queue.Count > 0) drained.Add(queue.Dequeue());
        return drained;
    }

    private void Require(string connectionId)
    {
        if (!_queues.ContainsKey(connectionId)) throw new InvalidOperationException($"Unknown connection {connectionId}.");
    }
}
`,
    testCode: csTests(`
RoomBroadcaster Hub(int capacity, params (string Conn, string Room)[] joins)
{
    var hub = new RoomBroadcaster(capacity);
    foreach (var (conn, room) in joins) { hub.Connect(conn); hub.Join(conn, room); }
    return hub;
}
string Bodies(IEnumerable<Envelope> e) => string.Join(",", e.Select(x => x.Room + "#" + x.Sequence + ":" + x.Body));
Check("delivers to every member of the room only", () => { var h = Hub(10, ("a", "general"), ("b", "general"), ("c", "random")); var r = h.Publish("general", "hi"); return r.Delivered + ":" + h.Pending("a") + h.Pending("b") + h.Pending("c"); }, "2:110");
Check("each connection receives in publish order", () => { var h = Hub(10, ("a", "general")); h.Publish("general", "1"); h.Publish("general", "2"); h.Publish("general", "3"); return Bodies(h.Drain("a", 10)); }, "general#1:1,general#2:2,general#3:3");
Check("sequences are per room and count even empty rooms", () => { var h = Hub(10, ("a", "x")); h.Publish("y", "lost"); h.Publish("x", "1"); return h.Publish("y", "2").Sequence + ":" + h.Publish("x", "2").Sequence; }, "2:2");
Check("drain takes at most max", () => { var h = Hub(10, ("a", "r")); for (int i = 0; i < 5; i++) h.Publish("r", "m" + i); return h.Drain("a", 2).Count + ":" + h.Pending("a"); }, "2:3");
Check("a slow consumer is dropped, not waited for", () =>
{
    var h = Hub(2, ("fast", "r"), ("slow", "r"));
    var reports = new List<PublishReport>();
    for (int i = 0; i < 4; i++) { reports.Add(h.Publish("r", "m" + i)); h.Drain("fast", 10); }
    return string.Join("|", reports.Select(r => r.Delivered + "/" + string.Join("+", r.Dropped))) + ":" + h.IsConnected("slow");
}, "2/|2/|1/slow|1/:False");
Check("the others keep every message", () =>
{
    var h = Hub(2, ("fast", "r"), ("slow", "r"));
    var got = new List<Envelope>();
    for (int i = 0; i < 6; i++) { h.Publish("r", "m" + i); got.AddRange(h.Drain("fast", 10)); }
    return string.Join(",", got.Select(e => e.Sequence));
}, "1,2,3,4,5,6");
CheckSeq("dropped connections are reported in order", () => { var h = Hub(1, ("c3", "r"), ("c1", "r"), ("c2", "r")); h.Publish("r", "fills"); return h.Publish("r", "overflows").Dropped; }, ["c1", "c2", "c3"]);
Check("disconnect removes a connection from every room", () => { var h = Hub(10, ("a", "x"), ("b", "x")); h.Join("a", "y"); h.Disconnect("a"); return h.Publish("x", "1").Delivered + ":" + h.Publish("y", "1").Delivered + ":" + h.Drain("a", 10).Count; }, "1:0:0");
Check("leave stops delivery", () => { var h = Hub(10, ("a", "x")); h.Leave("a", "x"); return h.Publish("x", "1").Delivered; }, 0);
Throws<InvalidOperationException>("joining with an unknown connection", () => new RoomBroadcaster(5).Join("ghost", "r"));
`),
  },
  {
    id: 'cs-6-07',
    title: 'An Idempotent Message Sequencer with Cursor Paging',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Every conversation is an append-only log, and the server is the single place that orders it. Implement ConversationLog(clock): ' +
      'Append(conversationId, clientMessageId, sender, body) gives the message the conversation\'s next sequence number (1, 2, 3…) and the ' +
      'current time. Mobile clients retry when an acknowledgement is lost, so a second Append with the same conversation, sender and ' +
      'clientMessageId returns the originally stored message — same sequence, same body — and appends nothing. Two senders may use the same ' +
      'clientMessageId independently. A blank body or one over 4000 characters is an ArgumentException. ReadSince(conversationId, afterSeq, ' +
      'limit) returns up to limit messages with Seq > afterSeq in order, and NextAfter: the last returned Seq when more remain, otherwise null ' +
      '(limit must be 1–100, else ArgumentOutOfRangeException). LatestSeq(conversationId) is 0 for an empty conversation.',
    starterCode: `public sealed record StoredMessage(string ConversationId, long Seq, string ClientMessageId, string Sender, string Body, DateTimeOffset At);

public sealed record Page(IReadOnlyList<StoredMessage> Messages, long? NextAfter);

public sealed class ConversationLog
{
    public ConversationLog(Func<DateTimeOffset> clock) => throw new NotImplementedException();

    public StoredMessage Append(string conversationId, string clientMessageId, string sender, string body) => throw new NotImplementedException();
    public Page ReadSince(string conversationId, long afterSeq, int limit) => throw new NotImplementedException();
    public long LatestSeq(string conversationId) => throw new NotImplementedException();
}
`,
    hints: [
      'Per conversation keep a List<StoredMessage> (index i holds Seq i + 1) and a Dictionary<(string Sender, string ClientId), StoredMessage> for deduplication.',
      'Because Seq is the list index plus one, ReadSince can start at index afterSeq instead of scanning.',
      'NextAfter is non-null exactly when the page is full and the log has messages beyond it.',
    ],
    solution: `public sealed record StoredMessage(string ConversationId, long Seq, string ClientMessageId, string Sender, string Body, DateTimeOffset At);

public sealed record Page(IReadOnlyList<StoredMessage> Messages, long? NextAfter);

public sealed class ConversationLog
{
    private sealed class Conversation
    {
        public List<StoredMessage> Messages { get; } = [];
        public Dictionary<(string Sender, string ClientId), StoredMessage> ByClientId { get; } = [];
    }

    private readonly Func<DateTimeOffset> _clock;
    private readonly Dictionary<string, Conversation> _conversations = new(StringComparer.Ordinal);

    public ConversationLog(Func<DateTimeOffset> clock) => _clock = clock;

    public StoredMessage Append(string conversationId, string clientMessageId, string sender, string body)
    {
        if (string.IsNullOrWhiteSpace(body)) throw new ArgumentException("A message needs a body.", nameof(body));
        if (body.Length > 4000) throw new ArgumentException("A message body is at most 4000 characters.", nameof(body));
        if (!_conversations.TryGetValue(conversationId, out var c)) _conversations[conversationId] = c = new Conversation();
        if (c.ByClientId.TryGetValue((sender, clientMessageId), out var existing)) return existing;   // a retry
        var stored = new StoredMessage(conversationId, c.Messages.Count + 1, clientMessageId, sender, body, _clock());
        c.Messages.Add(stored);
        c.ByClientId[(sender, clientMessageId)] = stored;
        return stored;
    }

    public Page ReadSince(string conversationId, long afterSeq, int limit)
    {
        if (limit is < 1 or > 100) throw new ArgumentOutOfRangeException(nameof(limit));
        if (!_conversations.TryGetValue(conversationId, out var c)) return new Page([], null);
        int start = (int)Math.Clamp(afterSeq, 0, c.Messages.Count);
        var page = c.Messages.Skip(start).Take(limit).ToList();
        long? next = page.Count == limit && start + limit < c.Messages.Count ? page[^1].Seq : null;
        return new Page(page, next);
    }

    public long LatestSeq(string conversationId) => _conversations.TryGetValue(conversationId, out var c) ? c.Messages.Count : 0;
}
`,
    testCode: csTests(`
var now = DateTimeOffset.Parse("2026-11-08T12:00:00Z");
ConversationLog Log() => new(() => now);
Check("assigns sequence numbers per conversation", () => { var l = Log(); l.Append("c1", "m1", "ama", "hi"); l.Append("c2", "m1", "ama", "yo"); return l.Append("c1", "m2", "kofi", "hey").Seq + ":" + l.LatestSeq("c2"); }, "2:1");
Check("stamps the server time", () => Log().Append("c", "m", "ama", "hi").At, now);
Check("a retried send returns the original and appends nothing", () =>
{
    var l = Log();
    var first = l.Append("c", "m-123", "ama", "hello");
    now = now.AddSeconds(5);
    var retry = l.Append("c", "m-123", "ama", "hello (resent)");
    now = now.AddSeconds(-5);
    return (retry == first) + ":" + l.LatestSeq("c");
}, "True:1");
Check("two senders may reuse a client id", () => { var l = Log(); l.Append("c", "1", "ama", "a"); return l.Append("c", "1", "kofi", "b").Seq; }, 2L);
Throws<ArgumentException>("blank bodies are refused", () => Log().Append("c", "m", "ama", "   "));
Throws<ArgumentException>("oversized bodies are refused", () => Log().Append("c", "m", "ama", new string('x', 4001)));
CheckSeq("reads after a cursor, in order", () => { var l = Log(); for (int i = 1; i <= 5; i++) l.Append("c", "m" + i, "ama", "b" + i); return l.ReadSince("c", 2, 10).Messages.Select(m => m.Body); }, ["b3", "b4", "b5"]);
Check("pages carry a cursor while more remain", () =>
{
    var l = Log();
    for (int i = 1; i <= 7; i++) l.Append("c", "m" + i, "ama", "b" + i);
    var seen = new List<long>();
    long after = 0;
    int pages = 0;
    while (true)
    {
        var page = l.ReadSince("c", after, 3);
        pages++;
        seen.AddRange(page.Messages.Select(m => m.Seq));
        if (page.NextAfter is not { } next) break;
        after = next;
    }
    return pages + ":" + string.Join(",", seen);
}, "3:1,2,3,4,5,6,7");
Check("an exact final page has no cursor", () => { var l = Log(); for (int i = 1; i <= 6; i++) l.Append("c", "m" + i, "ama", "b"); return l.ReadSince("c", 3, 3).NextAfter; }, (long?)null);
Check("an unknown conversation is empty", () => Log().ReadSince("nope", 0, 10).Messages.Count + ":" + Log().LatestSeq("nope"), "0:0");
Throws<ArgumentOutOfRangeException>("page size is bounded", () => Log().ReadSince("c", 0, 500));
`),
  },
  {
    id: 'cs-6-08',
    title: 'Reassemble an Ordered Stream on the Client',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Messages reach a device over several paths — the live connection, a resync after reconnecting, a push wake-up — so they arrive out of ' +
      'order and sometimes twice. The client must show them exactly once, in sequence order, and know what to ask for. Implement ' +
      'ReorderBuffer(lastDelivered = 0, window = 1000): Receive(message) returns the messages that become deliverable, in order (often none, ' +
      'sometimes several). Duplicates and anything at or below Delivered are ignored. A message more than window ahead of Delivered ' +
      '(Seq > Delivered + window) is dropped rather than buffered — memory stays bounded and the server will resend it. Delivered is the ' +
      'highest contiguous sequence handed to the UI (what the client acknowledges); Buffered counts held messages; Missing() lists the gaps ' +
      'between Delivered + 1 and the highest buffered sequence as inclusive (From, To) ranges, for a targeted resend request.',
    starterCode: `public sealed record Incoming(long Seq, string Body);

public sealed class ReorderBuffer
{
    public ReorderBuffer(long lastDelivered = 0, int window = 1000) => throw new NotImplementedException();

    public long Delivered => throw new NotImplementedException();
    public int Buffered => throw new NotImplementedException();

    public IReadOnlyList<Incoming> Receive(Incoming message) => throw new NotImplementedException();
    public IReadOnlyList<(long From, long To)> Missing() => throw new NotImplementedException();
}
`,
    hints: [
      'Hold out-of-order messages in a SortedDictionary<long, Incoming> (or a Dictionary plus a scan from Delivered + 1).',
      'After storing a message, deliver in a loop: while the buffer contains Delivered + 1, remove it, add it to the result and advance Delivered.',
      'Missing: walk from Delivered + 1 to the highest buffered key; a run of absent numbers is one range.',
    ],
    solution: `public sealed record Incoming(long Seq, string Body);

public sealed class ReorderBuffer
{
    private readonly int _window;
    private readonly SortedDictionary<long, Incoming> _held = new();

    public ReorderBuffer(long lastDelivered = 0, int window = 1000)
    {
        if (lastDelivered < 0) throw new ArgumentOutOfRangeException(nameof(lastDelivered));
        if (window < 1) throw new ArgumentOutOfRangeException(nameof(window));
        (Delivered, _window) = (lastDelivered, window);
    }

    public long Delivered { get; private set; }
    public int Buffered => _held.Count;

    public IReadOnlyList<Incoming> Receive(Incoming message)
    {
        var ready = new List<Incoming>();
        if (message.Seq <= Delivered || message.Seq > Delivered + _window) return ready;   // old, duplicate, or too far ahead
        _held.TryAdd(message.Seq, message);
        while (_held.Remove(Delivered + 1, out var next))
        {
            ready.Add(next);
            Delivered++;
        }
        return ready;
    }

    public IReadOnlyList<(long From, long To)> Missing()
    {
        var gaps = new List<(long, long)>();
        long expected = Delivered + 1;
        foreach (var seq in _held.Keys)
        {
            if (seq > expected) gaps.Add((expected, seq - 1));
            expected = seq + 1;
        }
        return gaps;
    }
}
`,
    testCode: csTests(`
string Seqs(IEnumerable<Incoming> items) => string.Join(",", items.Select(i => i.Seq));
Incoming M(long seq) => new(seq, "m" + seq);
Check("in-order messages are delivered at once", () => { var b = new ReorderBuffer(); return Seqs(b.Receive(M(1))) + "|" + Seqs(b.Receive(M(2))) + "|" + b.Delivered; }, "1|2|2");
Check("an early message waits for the gap", () => { var b = new ReorderBuffer(); var early = b.Receive(M(3)); return Seqs(early) + "|" + b.Buffered + "|" + b.Delivered; }, "|1|0");
Check("filling the gap releases everything in order", () => { var b = new ReorderBuffer(); b.Receive(M(3)); b.Receive(M(2)); b.Receive(M(5)); return Seqs(b.Receive(M(1))) + "|" + b.Delivered + "|" + b.Buffered; }, "1,2,3|3|1");
Check("duplicates are shown once", () =>
{
    var b = new ReorderBuffer();
    var shown = new List<Incoming>();
    foreach (var s in new long[] { 1, 1, 3, 2, 3, 2, 1, 4 }) shown.AddRange(b.Receive(M(s)));
    return Seqs(shown);
}, "1,2,3,4");
Check("a resumed client ignores what it already has", () => { var b = new ReorderBuffer(lastDelivered: 40); return Seqs(b.Receive(M(39))) + "|" + Seqs(b.Receive(M(41))); }, "|41");
CheckSeq("missing ranges describe the gaps", () => { var b = new ReorderBuffer(); foreach (var s in new long[] { 1, 4, 5, 9 }) b.Receive(M(s)); return b.Missing(); }, [(2L, 3L), (6L, 8L)]);
Check("no gaps, nothing missing", () => { var b = new ReorderBuffer(); b.Receive(M(1)); b.Receive(M(2)); return b.Missing().Count; }, 0);
Check("messages beyond the window are dropped", () => { var b = new ReorderBuffer(window: 10); b.Receive(M(10)); var far = b.Receive(M(12)); return b.Buffered + ":" + far.Count + ":" + b.Missing().Count; }, "1:0:1");
Expect("any arrival order shows everything exactly once, in order", () =>
{
    var rng = new Random(2026);
    for (int round = 0; round < 50; round++)
    {
        var arrivals = Enumerable.Range(1, 40).Select(i => (long)i).Concat(Enumerable.Range(1, 15).Select(_ => (long)rng.Next(1, 41))).OrderBy(_ => rng.Next()).ToList();
        var b = new ReorderBuffer();
        var shown = arrivals.SelectMany(s => b.Receive(M(s))).Select(i => i.Seq).ToList();
        if (!shown.SequenceEqual(Enumerable.Range(1, 40).Select(i => (long)i)) || b.Buffered != 0) return false;
    }
    return true;
}, "a shuffled stream with duplicates must come out as 1..40 exactly once");
`),
  },
];
