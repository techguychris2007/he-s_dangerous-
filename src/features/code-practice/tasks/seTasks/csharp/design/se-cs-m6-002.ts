import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 22 Assignment: Design a Messaging Platform

Design a chat platform for Africa-first mobile users — patchy networks, several devices per person — then build the
protocol core and prove that, over a network that **loses, duplicates and reorders** messages, every device ends up with
**exactly the same conversation, in the same order, with nothing missing and nothing twice**.

Given (read-only): \`Protocol.cs\` (the messages devices and the server exchange), \`Infrastructure.cs\` (a seeded
\`SimNetwork\`, a \`PushService\` and a \`ManualClock\`) and \`Program.cs\`. You write \`ChatServer.cs\`, \`ChatDevice.cs\`
and \`DESIGN.md\`. Everything is synchronous: \`SimNetwork.Step()\` delivers whatever is due, and a device acts on its own
when its \`Tick()\` is called.

## ChatServer (address \`"server"\`)

- \`CreateConversation(id, members)\`; \`DeviceOnline(user, device)\` / \`DeviceOffline(device)\` track live connections;
  \`History(id)\` returns the stored log.
- **SendMessage** — from a non-member: reply \`SendRejected\` and store nothing. Otherwise the conversation is the
  **sequencer**: append with the next sequence number (1, 2, 3…) unless this (user, ClientMessageId) was already stored —
  a retry, which is acknowledged again with the original sequence and delivered to nobody. Always reply \`SendAck\` to the
  sending device. For a new message, send it as \`Delivered\` to every **online device of every member except the sending
  device** (the sender's other devices included).
- **Push**: a member with no online device gets \`PushService.Notify(user, conversation, now)\` — at most one per (user,
  conversation) per \`PushCollapse\` (one minute). Never push the sender; never push someone online.
- **SyncRequest** — from a non-member: ignore. Otherwise reply \`SyncPage\` with up to \`PageSize\` (50) messages after
  \`AfterSeq\` and \`More = true\` when there are more.

## ChatDevice (address = device id)

- \`Open(conversation)\` starts following a conversation (and syncs it from its cursor).
- \`Send(conversation, body)\` creates a ClientMessageId \`"<deviceId>-<n>"\` (n = 1, 2, 3… per device), keeps it pending
  and transmits it. \`Tick()\` re-transmits every pending send whose last transmission is \`RetryAfter\` (2 s) old or older.
- On **SendAck**: the send is no longer pending, and the message — at the acknowledged sequence — joins the timeline.
  Duplicate acks are ignored. On **SendRejected**: no longer pending; record the id in \`Rejected\`.
- **Timeline(conversation)** shows each sequence number **once, in order, with no gaps**: a message at cursor + 1 is
  shown (with any held successors); a later one is held; anything at or below the cursor is ignored. Holding messages
  means there is a gap: request a sync from the cursor.
- **Sync**: \`SyncRequest(cursor)\` per conversation — at most one per conversation per \`RetryAfter\` unless a page just
  arrived; follow \`More\` by requesting the next page at once. \`Tick()\` also syncs each open conversation every
  \`SyncInterval\` (10 s), which catches the *last* message of a burst if it was lost. \`Reconnected()\` re-syncs every open
  conversation immediately and re-transmits every pending send. \`HasGaps\` and \`PendingCount\` report state.

## DESIGN.md

\`##\` sections **Requirements**, **Estimates** (messages per second, storage per day, connections), **API** (the
real-time protocol: connection, send, ack, sync), **Data model** (partition key for messages), **Architecture**,
**Trade-offs** (at least: ordering scope, delivery guarantee and idempotency, fan-out), **Risks**.
`;

const PROTOCOL = `// Given: what devices and the server send each other over the network.
public sealed record SendMessage(string DeviceId, string UserId, string ConversationId, string ClientMessageId, string Body);
public sealed record SendAck(string ConversationId, string ClientMessageId, long Seq);
public sealed record SendRejected(string ConversationId, string ClientMessageId, string Reason);
public sealed record Delivered(string ConversationId, long Seq, string Sender, string ClientMessageId, string Body);
public sealed record SyncRequest(string DeviceId, string UserId, string ConversationId, long AfterSeq);
public sealed record SyncPage(string ConversationId, IReadOnlyList<Delivered> Messages, bool More);
`;

const INFRASTRUCTURE = `// Given: a deterministic, unreliable network and friends.
public sealed class ManualClock
{
    public DateTimeOffset Now { get; private set; } = DateTimeOffset.Parse("2026-11-08T09:00:00Z");
    public void Advance(TimeSpan by) => Now += by;
}

public interface IEndpoint
{
    string Address { get; }
    void Handle(object message);
}

/// <summary>Delivers messages after a random delay of 1..(1 + maxDelay) steps, dropping and duplicating some.
/// Messages to an address that is not registered when they arrive are lost.</summary>
public sealed class SimNetwork
{
    private readonly Random _random;
    private readonly double _dropRate;
    private readonly double _duplicateRate;
    private readonly int _maxDelay;
    private readonly Dictionary<string, IEndpoint> _endpoints = new(StringComparer.Ordinal);
    private readonly List<(long Due, int Order, string To, object Message)> _queue = [];
    private long _tick;
    private int _order;

    public SimNetwork(int seed = 1, double dropRate = 0, double duplicateRate = 0, int maxDelay = 0)
    {
        _random = new Random(seed);
        (_dropRate, _duplicateRate, _maxDelay) = (dropRate, duplicateRate, maxDelay);
    }

    /// <summary>While true, everything sent is lost.</summary>
    public bool Partitioned { get; set; }
    public int InFlight => _queue.Count;

    private readonly Dictionary<string, int> _received = new(StringComparer.Ordinal);
    /// <summary>How many messages have actually been handed to this address.</summary>
    public int ReceivedBy(string address) => _received.GetValueOrDefault(address);

    public void Register(IEndpoint endpoint) => _endpoints[endpoint.Address] = endpoint;
    public void Unregister(string address) => _endpoints.Remove(address);

    public void Send(string to, object message)
    {
        if (Partitioned || _random.NextDouble() < _dropRate) return;
        Enqueue(to, message);
        if (_random.NextDouble() < _duplicateRate) Enqueue(to, message);
    }

    /// <summary>Loses everything currently in flight (a dropped connection, a crashed proxy).</summary>
    public void DropInFlight() => _queue.Clear();

    public void Step()
    {
        _tick++;
        var due = _queue.Where(q => q.Due <= _tick).OrderBy(q => q.Order).ToList();
        if (_maxDelay > 0) due = due.OrderBy(_ => _random.Next()).ToList();
        _queue.RemoveAll(q => q.Due <= _tick);
        foreach (var item in due)
        {
            if (!_endpoints.TryGetValue(item.To, out var endpoint)) continue;
            _received[item.To] = _received.GetValueOrDefault(item.To) + 1;
            endpoint.Handle(item.Message);
        }
    }

    private void Enqueue(string to, object message) => _queue.Add((_tick + 1 + _random.Next(_maxDelay + 1), _order++, to, message));
}

public sealed class PushService
{
    public List<(string User, string ConversationId, DateTimeOffset At)> Sent { get; } = [];
    public void Notify(string user, string conversationId, DateTimeOffset at) => Sent.Add((user, conversationId, at));
}
`;

const PROGRAM = `// Run: two people, three devices, a lossy network.
var clock = new ManualClock();
var network = new SimNetwork(seed: 7, dropRate: 0.2, duplicateRate: 0.2, maxDelay: 3);
var server = new ChatServer(network, new PushService(), clock);
server.CreateConversation("family", "ama", "kofi");
var devices = new[] { new ChatDevice("ama", "ama-phone", network, clock), new ChatDevice("kofi", "kofi-phone", network, clock), new ChatDevice("kofi", "kofi-laptop", network, clock) };
foreach (var d in devices) { server.DeviceOnline(d.UserId, d.Address); d.Open("family"); }

devices[0].Send("family", "Akwaaba! Dinner at 7?");
devices[1].Send("family", "Yes — I'll bring kelewele.");
for (int i = 0; i < 80; i++) { network.Step(); clock.Advance(TimeSpan.FromMilliseconds(500)); foreach (var d in devices) d.Tick(); }

foreach (var d in devices)
    Console.WriteLine(d.Address + ": " + string.Join(" | ", d.Timeline("family").Select(m => m.Seq + " " + m.Sender + ": " + m.Body)));
`;

const SERVER_STARTER = `public sealed class ChatServer : IEndpoint
{
    public const int PageSize = 50;
    public static readonly TimeSpan PushCollapse = TimeSpan.FromMinutes(1);

    private readonly SimNetwork _network;
    private readonly PushService _push;
    private readonly ManualClock _clock;

    public ChatServer(SimNetwork network, PushService push, ManualClock clock)
    {
        (_network, _push, _clock) = (network, push, clock);
        network.Register(this);
    }

    public string Address => "server";

    public void CreateConversation(string id, params string[] members) => throw new NotImplementedException();
    public void DeviceOnline(string userId, string deviceId) => throw new NotImplementedException();
    public void DeviceOffline(string deviceId) => throw new NotImplementedException();
    public IReadOnlyList<Delivered> History(string conversationId) => throw new NotImplementedException();

    public void Handle(object message) => throw new NotImplementedException();
}
`;

const DEVICE_STARTER = `public sealed class ChatDevice : IEndpoint
{
    public static readonly TimeSpan RetryAfter = TimeSpan.FromSeconds(2);
    public static readonly TimeSpan SyncInterval = TimeSpan.FromSeconds(10);

    private readonly SimNetwork _network;
    private readonly ManualClock _clock;

    public ChatDevice(string userId, string deviceId, SimNetwork network, ManualClock clock)
    {
        (UserId, Address, _network, _clock) = (userId, deviceId, network, clock);
        network.Register(this);
    }

    public string UserId { get; }
    public string Address { get; }

    public int PendingCount => throw new NotImplementedException();
    public bool HasGaps => throw new NotImplementedException();
    public IReadOnlyList<string> Rejected => throw new NotImplementedException();
    public IReadOnlyList<Delivered> Timeline(string conversationId) => throw new NotImplementedException();

    public void Open(string conversationId) => throw new NotImplementedException();
    public string Send(string conversationId, string body) => throw new NotImplementedException();
    public void Tick() => throw new NotImplementedException();
    public void Reconnected() => throw new NotImplementedException();

    public void Handle(object message) => throw new NotImplementedException();
}
`;

const SERVER_SOLUTION = `public sealed class ChatServer : IEndpoint
{
    public const int PageSize = 50;
    public static readonly TimeSpan PushCollapse = TimeSpan.FromMinutes(1);

    private sealed class Conversation
    {
        public HashSet<string> Members { get; } = new(StringComparer.Ordinal);
        public List<Delivered> Messages { get; } = [];
        public Dictionary<(string User, string ClientId), Delivered> ByClientId { get; } = [];
    }

    private readonly SimNetwork _network;
    private readonly PushService _push;
    private readonly ManualClock _clock;
    private readonly Dictionary<string, Conversation> _conversations = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> _online = new(StringComparer.Ordinal);   // device → user
    private readonly Dictionary<(string User, string Conversation), DateTimeOffset> _lastPush = [];

    public ChatServer(SimNetwork network, PushService push, ManualClock clock)
    {
        (_network, _push, _clock) = (network, push, clock);
        network.Register(this);
    }

    public string Address => "server";

    public void CreateConversation(string id, params string[] members)
    {
        var conversation = new Conversation();
        conversation.Members.UnionWith(members);
        _conversations[id] = conversation;
    }

    public void DeviceOnline(string userId, string deviceId) => _online[deviceId] = userId;
    public void DeviceOffline(string deviceId) => _online.Remove(deviceId);

    public IReadOnlyList<Delivered> History(string conversationId) =>
        _conversations.TryGetValue(conversationId, out var c) ? c.Messages : [];

    public void Handle(object message)
    {
        switch (message)
        {
            case SendMessage send: OnSend(send); break;
            case SyncRequest sync: OnSync(sync); break;
        }
    }

    private void OnSend(SendMessage send)
    {
        if (!_conversations.TryGetValue(send.ConversationId, out var c) || !c.Members.Contains(send.UserId))
        {
            _network.Send(send.DeviceId, new SendRejected(send.ConversationId, send.ClientMessageId, "Not a member of this conversation."));
            return;
        }

        // Idempotent append: a retry gets the original sequence number and is delivered to nobody.
        if (c.ByClientId.TryGetValue((send.UserId, send.ClientMessageId), out var existing))
        {
            _network.Send(send.DeviceId, new SendAck(send.ConversationId, send.ClientMessageId, existing.Seq));
            return;
        }

        var stored = new Delivered(send.ConversationId, c.Messages.Count + 1, send.UserId, send.ClientMessageId, send.Body);
        c.Messages.Add(stored);
        c.ByClientId[(send.UserId, send.ClientMessageId)] = stored;
        _network.Send(send.DeviceId, new SendAck(send.ConversationId, send.ClientMessageId, stored.Seq));

        // Fan out on write to every live device of every member — except the one that sent it.
        foreach (var (device, user) in _online)
            if (device != send.DeviceId && c.Members.Contains(user)) _network.Send(device, stored);

        // Members with no live device get a push, collapsed per conversation.
        foreach (var member in c.Members)
        {
            if (member == send.UserId || _online.ContainsValue(member)) continue;
            var key = (member, send.ConversationId);
            if (_lastPush.TryGetValue(key, out var last) && _clock.Now - last < PushCollapse) continue;
            _lastPush[key] = _clock.Now;
            _push.Notify(member, send.ConversationId, _clock.Now);
        }
    }

    private void OnSync(SyncRequest sync)
    {
        if (!_conversations.TryGetValue(sync.ConversationId, out var c) || !c.Members.Contains(sync.UserId)) return;
        int start = (int)Math.Clamp(sync.AfterSeq, 0, c.Messages.Count);
        var page = c.Messages.Skip(start).Take(PageSize).ToList();
        _network.Send(sync.DeviceId, new SyncPage(sync.ConversationId, page, start + page.Count < c.Messages.Count));
    }
}
`;

const DEVICE_SOLUTION = `public sealed class ChatDevice : IEndpoint
{
    public static readonly TimeSpan RetryAfter = TimeSpan.FromSeconds(2);
    public static readonly TimeSpan SyncInterval = TimeSpan.FromSeconds(10);

    private sealed class PendingSend(string conversationId, string clientMessageId, string body)
    {
        public string ConversationId { get; } = conversationId;
        public string ClientMessageId { get; } = clientMessageId;
        public string Body { get; } = body;
        public DateTimeOffset LastSent { get; set; }
    }

    /// <summary>One conversation as this device sees it: a cursor, held out-of-order messages, and what is shown.</summary>
    private sealed class ConversationView
    {
        public long Cursor { get; set; }
        public SortedDictionary<long, Delivered> Held { get; } = new();
        public List<Delivered> Shown { get; } = [];
        public DateTimeOffset? LastSyncRequest { get; set; }
    }

    private readonly SimNetwork _network;
    private readonly ManualClock _clock;
    private readonly Dictionary<string, PendingSend> _pending = new(StringComparer.Ordinal);
    private readonly Dictionary<string, ConversationView> _streams = new(StringComparer.Ordinal);
    private readonly List<string> _rejected = [];
    private int _counter;

    public ChatDevice(string userId, string deviceId, SimNetwork network, ManualClock clock)
    {
        (UserId, Address, _network, _clock) = (userId, deviceId, network, clock);
        network.Register(this);
    }

    public string UserId { get; }
    public string Address { get; }

    public int PendingCount => _pending.Count;
    public bool HasGaps => _streams.Values.Any(s => s.Held.Count > 0);
    public IReadOnlyList<string> Rejected => _rejected;
    public IReadOnlyList<Delivered> Timeline(string conversationId) =>
        _streams.TryGetValue(conversationId, out var s) ? s.Shown : [];

    public void Open(string conversationId) => RequestSync(conversationId, StreamFor(conversationId), force: true);

    public string Send(string conversationId, string body)
    {
        StreamFor(conversationId);
        var pending = new PendingSend(conversationId, Address + "-" + (++_counter), body);
        _pending[pending.ClientMessageId] = pending;
        Transmit(pending);
        return pending.ClientMessageId;
    }

    public void Tick()
    {
        foreach (var pending in _pending.Values.ToList())
            if (_clock.Now - pending.LastSent >= RetryAfter) Transmit(pending);
        foreach (var (conversation, stream) in _streams)
        {
            bool stale = stream.LastSyncRequest is not { } last || _clock.Now - last >= SyncInterval;
            if (stream.Held.Count > 0 || stale) RequestSync(conversation, stream, force: false);
        }
    }

    public void Reconnected()
    {
        foreach (var (conversation, stream) in _streams) RequestSync(conversation, stream, force: true);
        foreach (var pending in _pending.Values.ToList()) Transmit(pending);
    }

    public void Handle(object message)
    {
        switch (message)
        {
            case SendAck ack:
                if (_pending.Remove(ack.ClientMessageId, out var sent))
                    Accept(new Delivered(ack.ConversationId, ack.Seq, UserId, ack.ClientMessageId, sent.Body));
                break;
            case SendRejected rejected:
                if (_pending.Remove(rejected.ClientMessageId)) _rejected.Add(rejected.ClientMessageId);
                break;
            case Delivered delivered:
                Accept(delivered);
                break;
            case SyncPage page:
                var stream = StreamFor(page.ConversationId);
                foreach (var m in page.Messages) Accept(m);
                if (page.More) RequestSync(page.ConversationId, stream, force: true);   // next page at once
                break;
        }
    }

    private void Transmit(PendingSend pending)
    {
        pending.LastSent = _clock.Now;
        _network.Send("server", new SendMessage(Address, UserId, pending.ConversationId, pending.ClientMessageId, pending.Body));
    }

    private ConversationView StreamFor(string conversationId)
    {
        if (!_streams.TryGetValue(conversationId, out var stream)) _streams[conversationId] = stream = new ConversationView();
        return stream;
    }

    /// <summary>Shows each sequence number once, in order; holds what arrives early.</summary>
    private void Accept(Delivered message)
    {
        var stream = StreamFor(message.ConversationId);
        if (message.Seq <= stream.Cursor) return;                    // already shown: a duplicate
        stream.Held.TryAdd(message.Seq, message);
        while (stream.Held.Remove(stream.Cursor + 1, out var next))
        {
            stream.Shown.Add(next);
            stream.Cursor++;
        }
        if (stream.Held.Count > 0) RequestSync(message.ConversationId, stream, force: false);   // a gap: ask for it
    }

    private void RequestSync(string conversationId, ConversationView stream, bool force)
    {
        if (!force && stream.LastSyncRequest is { } last && _clock.Now - last < RetryAfter) return;
        stream.LastSyncRequest = _clock.Now;
        _network.Send("server", new SyncRequest(Address, UserId, conversationId, stream.Cursor));
    }
}
`;

const TESTS = csTests(`
(ManualClock Clock, SimNetwork Net, ChatServer Server, PushService Push) World(int seed = 1, double drop = 0, double dup = 0, int delay = 0)
{
    var clock = new ManualClock();
    var net = new SimNetwork(seed, drop, dup, delay);
    var push = new PushService();
    var server = new ChatServer(net, push, clock);
    server.CreateConversation("c", "ama", "kofi");
    return (clock, net, server, push);
}
ChatDevice Device((ManualClock Clock, SimNetwork Net, ChatServer Server, PushService Push) w, string user, string id)
{
    var d = new ChatDevice(user, id, w.Net, w.Clock);
    w.Server.DeviceOnline(user, id);
    d.Open("c");
    return d;
}
void Run((ManualClock Clock, SimNetwork Net, ChatServer Server, PushService Push) w, int rounds, params ChatDevice[] devices)
{
    for (int i = 0; i < rounds; i++)
    {
        w.Net.Step();
        w.Clock.Advance(TimeSpan.FromMilliseconds(500));
        foreach (var d in devices) d.Tick();
    }
}
string Shape(IEnumerable<Delivered> messages) => string.Join(",", messages.Select(m => m.Seq + ":" + m.ClientMessageId));
string Bodies(IEnumerable<Delivered> messages) => string.Join(",", messages.Select(m => m.Body));

Check("delivers to every member's devices, in order", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var kofi = Device(w, "kofi", "kofi-phone");
    var laptop = Device(w, "kofi", "kofi-laptop");
    ama.Send("c", "one"); ama.Send("c", "two"); ama.Send("c", "three");
    Run(w, 20, ama, kofi, laptop);
    return Bodies(kofi.Timeline("c")) + "|" + Bodies(laptop.Timeline("c"));
}, "one,two,three|one,two,three");
Check("the sender is acknowledged and sees its own messages at their sequence", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var kofi = Device(w, "kofi", "kofi-phone");
    kofi.Send("c", "first");
    Run(w, 4, ama, kofi);
    ama.Send("c", "second");
    Run(w, 10, ama, kofi);
    return ama.PendingCount + "|" + Shape(ama.Timeline("c"));
}, "0|1:kofi-phone-1,2:ama-phone-1");
Check("the sender's other devices receive it", () =>
{
    var w = World();
    var phone = Device(w, "ama", "ama-phone");
    var tablet = Device(w, "ama", "ama-tablet");
    phone.Send("c", "from my phone");
    Run(w, 6, phone, tablet);
    return Bodies(tablet.Timeline("c"));
}, "from my phone");
Check("the sending device gets its acknowledgement, not an echo", () =>
{
    var w = World();
    var phone = Device(w, "ama", "ama-phone");
    var kofi = Device(w, "kofi", "kofi-phone");
    Run(w, 3, phone, kofi);                       // the opening syncs are answered
    int before = w.Net.ReceivedBy("ama-phone");
    phone.Send("c", "hi");
    Run(w, 3, phone, kofi);
    return w.Net.ReceivedBy("ama-phone") - before;
}, 1);
Check("reconnecting re-sends pending messages at once", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    Run(w, 3, ama);
    w.Net.Partitioned = true;
    ama.Send("c", "sent in a tunnel");
    Run(w, 1, ama);
    w.Net.Partitioned = false;
    ama.Reconnected();
    Run(w, 2, ama);                               // well under RetryAfter
    return w.Server.History("c").Count;
}, 1);
Check("a non-member is refused, and can neither post nor read", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var esi = Device(w, "esi", "esi-phone");
    ama.Send("c", "private");
    var id = esi.Send("c", "let me in");
    Run(w, 30, ama, esi);                         // long enough for esi's periodic sync to be answered
    return string.Join(",", esi.Rejected) + "|" + esi.PendingCount + "|" + esi.Timeline("c").Count + "|" + w.Server.History("c").Count;
}, "esi-phone-1|0|0|1");
Check("a lost acknowledgement causes a retry, not a duplicate", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var kofi = Device(w, "kofi", "kofi-phone");
    Run(w, 3, ama, kofi);
    ama.Send("c", "hello");
    w.Net.Step();               // the server stores it and sends the ack...
    w.Net.DropInFlight();       // ...which is lost, along with the delivery
    Run(w, 30, ama, kofi);
    return w.Server.History("c").Count + "|" + ama.PendingCount + "|" + Bodies(ama.Timeline("c")) + "|" + Bodies(kofi.Timeline("c"));
}, "1|0|hello|hello");
Expect("under loss, duplication and reordering, every device converges on the server's log", () =>
{
    foreach (int seed in new[] { 1, 2, 3, 4, 5 })
    {
        var w = World(seed, drop: 0.25, dup: 0.25, delay: 4);
        var devices = new[] { Device(w, "ama", "ama-phone"), Device(w, "ama", "ama-laptop"), Device(w, "kofi", "kofi-phone") };
        for (int i = 0; i < 15; i++)
        {
            devices[0].Send("c", "a" + i);
            devices[2].Send("c", "k" + i);
            if (i % 3 == 0) devices[1].Send("c", "l" + i);
            Run(w, 1, devices);
        }
        Run(w, 160, devices);
        var expected = Shape(w.Server.History("c"));
        if (w.Server.History("c").Count != 35) return false;
        if (devices.Any(d => Shape(d.Timeline("c")) != expected || d.PendingCount != 0 || d.HasGaps)) return false;
    }
    return true;
}, "with 25% loss and duplication, each device must show exactly the server's 35 messages in order, with nothing pending");
Check("an offline device catches up when it reconnects", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var laptop = Device(w, "kofi", "kofi-laptop");
    ama.Send("c", "before");
    Run(w, 4, ama, laptop);
    w.Server.DeviceOffline("kofi-laptop");
    w.Net.Unregister("kofi-laptop");
    for (int i = 0; i < 3; i++) ama.Send("c", "while away " + i);
    Run(w, 10, ama);
    w.Net.Register(laptop);
    w.Server.DeviceOnline("kofi", "kofi-laptop");
    laptop.Reconnected();
    Run(w, 6, ama, laptop);
    return Bodies(laptop.Timeline("c"));
}, "before,while away 0,while away 1,while away 2");
Check("a long absence is synced page by page", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var laptop = Device(w, "kofi", "kofi-laptop");
    w.Server.DeviceOffline("kofi-laptop");
    w.Net.Unregister("kofi-laptop");
    for (int i = 0; i < 130; i++) ama.Send("c", "m" + i);
    Run(w, 6, ama);
    w.Net.Register(laptop);
    w.Server.DeviceOnline("kofi", "kofi-laptop");
    laptop.Reconnected();
    Run(w, 8, ama, laptop);
    var t = laptop.Timeline("c");
    return t.Count + "|" + t[0].Body + "|" + t[^1].Body;
}, "130|m0|m129");
Check("offline members get one push per conversation per minute", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    for (int i = 0; i < 5; i++) ama.Send("c", "quick " + i);
    Run(w, 6, ama);
    w.Clock.Advance(TimeSpan.FromSeconds(61));
    ama.Send("c", "later");
    Run(w, 4, ama);
    return string.Join(",", w.Push.Sent.Select(p => p.User + "/" + p.ConversationId));
}, "kofi/c,kofi/c");
Check("online members and the sender are never pushed", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var kofi = Device(w, "kofi", "kofi-phone");
    ama.Send("c", "hi");
    kofi.Send("c", "hello");
    Run(w, 6, ama, kofi);
    return w.Push.Sent.Count;
}, 0);
Check("sends made during a partition complete after it heals", () =>
{
    var w = World();
    var ama = Device(w, "ama", "ama-phone");
    var kofi = Device(w, "kofi", "kofi-phone");
    Run(w, 3, ama, kofi);
    w.Net.Partitioned = true;
    ama.Send("c", "x"); ama.Send("c", "y"); ama.Send("c", "z");
    Run(w, 10, ama, kofi);
    var stuck = ama.PendingCount;
    w.Net.Partitioned = false;
    Run(w, 12, ama, kofi);
    return stuck + "|" + ama.PendingCount + "|" + Bodies(kofi.Timeline("c"));
}, "3|0|x,y,z");
`);

const DESIGN_STARTER = `# Chat — Messaging Platform Design

## Requirements

TODO

## Estimates

TODO

## API

TODO

## Data model

TODO

## Architecture

TODO

## Trade-offs

TODO

## Risks

TODO
`;

const DESIGN_SOLUTION = `# Chat — Messaging Platform Design

## Requirements

Functional: one-to-one and group conversations of up to 500 members; text messages with media by reference; delivery
and read ticks; presence and last seen; history on every device a user signs in to; push notifications when the app is
closed. Non-functional: a message appears on online recipients' screens in under 300 ms within a region; nothing a user
sends is lost once it shows one tick; no duplicates; every member sees the same order; works on slow and intermittent
mobile networks. Non-goals for version one: channels with millions of followers, message editing, end-to-end encryption
(planned, and the design keeps message content opaque to ordering and delivery).

## Estimates

50 million daily active users sending 40 messages a day is 2 billion messages a day, about 23 000 messages per second on
average and around 70 000 per second at peak. At 200 bytes of text and metadata each that is about 400 GB per day before
replication, roughly 146 TB a year. If 20% of users are connected at peak, that is 10 million concurrent WebSocket
connections; at 50 000 connections per gateway node we need about 200 gateway nodes. Fan-out averages perhaps 5
recipients per message, so about 115 000 deliveries per second.

## API

Devices hold one WebSocket (SignalR) connection, authenticated with a bearer token. send(conversationId, clientMessageId,
body) is answered by ack(clientMessageId, seq) — retried by the client until acknowledged. The server pushes
message(conversationId, seq, sender, body) to online devices. sync(conversationId, afterSeq) returns a page of up to 50
messages and a more flag; clients call it on reconnect, when they detect a gap, and periodically. read(conversationId,
seq) advances the reader's cursor. Rejections carry a reason (not a member, too long, rate limited).

## Data model

Messages are stored per conversation, partitioned by conversation id plus a monthly time bucket and clustered by
sequence number, so "messages of X after N" is one partition range read. Each conversation's metadata holds its members
and next sequence number. A per-user inbox lists conversations ordered by latest activity, and per-member cursors hold
delivered and read positions. Media lives in object storage; messages hold references.

## Architecture

Clients connect through a regional load balancer to stateless WebSocket gateway nodes. A send goes to the conversation's
owner — a sequencer chosen by consistent hashing of the conversation id — which deduplicates, assigns the sequence,
writes to the message store and publishes the stored message. The fan-out service looks up members' live connections in
the presence and routing store and forwards to their gateways; members with no live device get a push through the
notification service, collapsed to one per conversation per minute. Gateways keep bounded per-connection queues and
disconnect slow consumers, who resync on return.

## Trade-offs

Ordering scope: order is guaranteed per conversation by a single sequencer, not globally; that keeps writes partitionable
and is all users can observe. Delivery guarantee: at-least-once everywhere, made effectively-once by client message ids
(deduplicated on the server) and sequence numbers (deduplicated on devices); exactly-once delivery is not available on
real networks. Fan-out: fan-out on write to live devices suits groups of up to 500; very large channels would need
fan-out on read. Storage is the source of truth and the live connection is an optimisation, at the cost of an extra
sync round trip after reconnects.

## Risks

A hot group concentrates load on one sequencer partition; we watch per-partition latency and can split a huge group into
a channel with fan-out on read. Reconnect storms after a gateway restart could overload sync; clients back off with
jitter and sync starts from their cursors. Push providers throttle; collapsing protects us. Spam and abuse spread quickly
in groups: rate limits per user and per conversation, and reporting tools.
`;

const DESIGN_TESTS = `import { describe, it, expect } from 'vitest';
import { readFile } from 'dw:project';

const NL = String.fromCharCode(10);
const sections = new Map<string, string>();
let current = '';
for (const line of readFile('DESIGN.md').split(NL)) {
  if (line.startsWith('## ')) { current = line.slice(3).trim().toLowerCase(); sections.set(current, ''); continue; }
  if (current) sections.set(current, (sections.get(current) ?? '') + ' ' + line);
}
const section = (name: string): string => sections.get(name.toLowerCase()) ?? '';
const words = (s: string) => s.split(' ').map((w) => w.trim()).filter((w) => w.length > 0 && w !== 'TODO');
const has = (s: string, ...terms: string[]) => terms.every((t) => s.toLowerCase().includes(t.toLowerCase()));
const REQUIRED = ['Requirements', 'Estimates', 'API', 'Data model', 'Architecture', 'Trade-offs', 'Risks'];

describe('DESIGN.md', () => {
  it('has every section, each substantial', () => {
    expect(REQUIRED.filter((s) => !sections.has(s.toLowerCase())), 'add these ## sections').toEqual([]);
    expect(REQUIRED.filter((s) => words(section(s)).length < 40), 'sections with fewer than 40 words').toEqual([]);
  });
  it('estimates messages, storage and connections', () => {
    const e = section('Estimates');
    const numbers = e.split(' ').filter((w) => w.length > 0 && '0123456789'.includes(w[0])).length;
    expect(numbers, 'Estimates: show the arithmetic').toBeGreaterThanOrEqual(8);
    expect(has(e, 'per second') || has(e, '/s'), 'Estimates: messages per second').toBe(true);
    expect(has(e, 'GB') || has(e, 'TB'), 'Estimates: storage').toBe(true);
    expect(has(e, 'connection'), 'Estimates: concurrent connections').toBe(true);
  });
  it('describes the real-time protocol', () => {
    const a = section('API');
    expect(has(a, 'websocket') || has(a, 'signalr'), 'API: the connection').toBe(true);
    expect(has(a, 'ack') && has(a, 'sync') && has(a, 'clientMessageId'), 'API: send with a client message id, ack, and sync').toBe(true);
  });
  it('partitions messages by conversation', () => {
    expect(has(section('Data model'), 'partition') && has(section('Data model'), 'conversation'), 'Data model: partition by conversation').toBe(true);
  });
  it('argues ordering, delivery and fan-out', () => {
    const t = section('Trade-offs');
    expect(has(t, 'order'), 'Trade-offs: ordering scope').toBe(true);
    expect(has(t, 'at-least-once') || has(t, 'at least once'), 'Trade-offs: delivery guarantee').toBe(true);
    expect(has(t, 'idempot') || has(t, 'dedup'), 'Trade-offs: idempotency / deduplication').toBe(true);
    expect(has(t, 'fan-out') || has(t, 'fan out'), 'Trade-offs: fan-out').toBe(true);
  });
});
`;

const OUTLINE = `// Run (design target): the outline of DESIGN.md as the grader sees it.
import { readFile } from 'dw:project';

let current = '(preamble)';
const counts = new Map<string, number>();
for (const line of readFile('DESIGN.md').split(String.fromCharCode(10))) {
  if (line.startsWith('## ')) { current = line.slice(3).trim(); counts.set(current, 0); continue; }
  counts.set(current, (counts.get(current) ?? 0) + line.split(' ').filter((w) => w.trim().length > 0 && w !== 'TODO').length);
}
for (const [name, n] of counts) console.log(name.padEnd(16) + n + ' words');
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('Protocol.cs', PROTOCOL, { editable: false }),
  pf('Infrastructure.cs', INFRASTRUCTURE, { editable: false }),
  pf('Program.cs', PROGRAM, { editable: false }),
  pf('design-outline.ts', OUTLINE, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m6-002',
  title: 'Week 22: Design a Messaging Platform',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 6 · System Design & Capstone',
  tags: ['system design', 'real-time', 'ordering', 'idempotency', 'sync', 'design document'],
  prompt:
    'Design a chat platform for patchy mobile networks, then build both ends of its protocol: a server that authorises, sequences each ' +
    'conversation idempotently, fans out to live devices, collapses push notifications for offline members and serves paged sync; and a ' +
    'device that retries until acknowledged, shows every message once and in order through a reorder buffer, detects gaps and syncs ' +
    'from its cursor. Graded over a seeded network that loses, duplicates and reorders traffic — every device must converge on the ' +
    'exact log on the server — plus a design document.',
  hints: [
    'Tasks cs-6-06 (fan-out), cs-6-07 (idempotent sequencer) and cs-6-08 (reorder buffer) are the three hardest pieces on their own.',
    'An acknowledgement carries the sequence number, so the sender adds its own message to its timeline from the ack — the server never echoes it back.',
    'Treat every incoming message the same way, whichever path it came by: live delivery, ack, or a sync page all go through one Accept method.',
    'A lost final message leaves no gap to notice. The periodic sync in Tick (every SyncInterval) is what recovers it.',
    'Throttle sync requests per conversation (one per RetryAfter), except that a page with More = true asks for the next page immediately.',
  ],
  files: [
    ...given,
    pf('ChatServer.cs', SERVER_STARTER),
    pf('ChatDevice.cs', DEVICE_STARTER),
    pf('DESIGN.md', DESIGN_STARTER),
  ],
  solutionFiles: [
    ...given,
    pf('ChatServer.cs', SERVER_SOLUTION),
    pf('ChatDevice.cs', DEVICE_SOLUTION),
    pf('DESIGN.md', DESIGN_SOLUTION),
  ],
  targets: [
    { id: 'protocol', label: 'Chat protocol', kind: 'csharp', entry: 'Program.cs', testCode: TESTS },
    { id: 'design', label: 'Design document', kind: 'typescript', entry: 'design-outline.ts', testCode: DESIGN_TESTS },
  ],
};

export default task;
