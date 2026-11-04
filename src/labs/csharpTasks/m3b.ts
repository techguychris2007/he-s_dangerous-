import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 3 · Architecture';

const OUTBOX_INFRASTRUCTURE = `public sealed record Order(Guid Id, string Customer, decimal Total);

public sealed record OutboxMessage(long Sequence, string Type, string Payload)
{
    public DateTimeOffset? SentAt { get; set; }
}

// Provided: a tiny database whose InTransaction either commits everything the work staged, or nothing.
public sealed class FakeDatabase
{
    private readonly List<Order> _orders = [];
    private readonly List<OutboxMessage> _outbox = [];
    private long _sequence;

    public bool FailNextCommit { get; set; }
    public IReadOnlyList<Order> Orders => _orders;
    public IReadOnlyList<OutboxMessage> Outbox => _outbox;

    public void InTransaction(Action<DbSession> work)
    {
        var session = new DbSession();
        work(session);
        if (FailNextCommit) { FailNextCommit = false; throw new IOException("commit failed: deadlock victim"); }
        _orders.AddRange(session.StagedOrders);
        foreach (var (type, payload) in session.StagedMessages) _outbox.Add(new OutboxMessage(++_sequence, type, payload));
    }

    public void MarkSent(long sequence, DateTimeOffset at) => _outbox.Single(m => m.Sequence == sequence).SentAt = at;
}

public sealed class DbSession
{
    internal List<Order> StagedOrders { get; } = [];
    internal List<(string Type, string Payload)> StagedMessages { get; } = [];
    public void Add(Order order) => StagedOrders.Add(order);
    public void AddOutboxMessage(string type, string payload) => StagedMessages.Add((type, payload));
}

public interface IPublisher
{
    Task PublishAsync(string type, string payload, CancellationToken ct);
}
`;

const SAGA_MESSAGES = `public enum OrderSagaState { AwaitingStock, AwaitingPayment, Completed, Cancelled }

public abstract record SagaEvent(string MessageId, Guid OrderId);
public sealed record StockReserved(string MessageId, Guid OrderId) : SagaEvent(MessageId, OrderId);
public sealed record StockUnavailable(string MessageId, Guid OrderId) : SagaEvent(MessageId, OrderId);
public sealed record PaymentTaken(string MessageId, Guid OrderId) : SagaEvent(MessageId, OrderId);
public sealed record PaymentFailed(string MessageId, Guid OrderId) : SagaEvent(MessageId, OrderId);
public sealed record SagaTimedOut(string MessageId, Guid OrderId) : SagaEvent(MessageId, OrderId);

public abstract record SagaCommand(Guid OrderId);
public sealed record ReserveStock(Guid OrderId) : SagaCommand(OrderId);
public sealed record TakePayment(Guid OrderId) : SagaCommand(OrderId);
public sealed record ConfirmOrder(Guid OrderId) : SagaCommand(OrderId);
public sealed record ReleaseStock(Guid OrderId) : SagaCommand(OrderId);
public sealed record CancelOrder(Guid OrderId, string Reason) : SagaCommand(OrderId);
public sealed record CheckPaymentStatus(Guid OrderId) : SagaCommand(OrderId);
`;

const PAYMENT_TYPES = `public sealed record ChargeRequest(string OrderId, decimal Amount, string Currency);
public sealed record ChargeResponse(string PaymentId, string Status);

public abstract record IdempotentResult
{
    public sealed record Completed(ChargeResponse Response, bool Replayed) : IdempotentResult;
    public sealed record Conflict(string Reason) : IdempotentResult;
    public sealed record InProgress : IdempotentResult;
}

public interface IPaymentGateway
{
    // The provider also deduplicates by key, so retrying with the SAME key is safe.
    Task<ChargeResponse> ChargeAsync(string idempotencyKey, ChargeRequest request, CancellationToken ct);
}
`;

const RECONCILIATION_TYPES = `public enum PaymentState { Pending, Captured, Failed, Unknown }

public sealed record LedgerEntry(string IntentKey, decimal Amount, PaymentState State);
public sealed record SettlementLine(string IntentKey, string ProviderReference, decimal Amount);

public sealed record ReconciliationReport(List<string> Issues, List<string> ResolveAsCaptured, List<string> SafeToRetry);
`;

/** Month 3, weeks 11–12 tasks (lessons dn3-5 … dn3-8). */
export const CSHARP_MONTH3_B_TASKS: CodeTask[] = [
  {
    id: 'cs-3-09',
    title: 'At-Least-Once Queue with a Dead-Letter Queue',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Build the broker behaviour from the lesson. InMemoryQueue(maxDeliveryCount): Send appends a message. Receive returns the oldest message ' +
      'that is not locked, locks it, increments its delivery count and returns a Delivery — or null when nothing is available. Complete(id) removes ' +
      'a locked message. Abandon(id) unlocks it in its original position, unless its delivery count has reached maxDeliveryCount, in which case ' +
      'it moves to DeadLetters. Complete or Abandon of a message that is not locked throws InvalidOperationException. ActiveCount counts messages ' +
      'still in the queue (locked or not). Then implement MessagePump.ProcessNext(queue, handler): receive one message; return false if there is ' +
      'none; run the handler; Complete only after it succeeds, Abandon if it throws (do not rethrow); return true.',
    starterCode: `public sealed record Message(string Id, string Body);
public sealed record Delivery(Message Message, int DeliveryCount);

public sealed class InMemoryQueue(int maxDeliveryCount)
{
    public IReadOnlyList<Message> DeadLetters => throw new NotImplementedException();
    public int ActiveCount => throw new NotImplementedException();
    public void Send(Message message) => throw new NotImplementedException();
    public Delivery? Receive() => throw new NotImplementedException();
    public void Complete(string messageId) => throw new NotImplementedException();
    public void Abandon(string messageId) => throw new NotImplementedException();
}

public static class MessagePump
{
    public static bool ProcessNext(InMemoryQueue queue, Action<Message> handler) => throw new NotImplementedException();
}
`,
    hints: [
      'Keep a List of small mutable entries (Message, DeliveryCount, Locked). Receive = the first entry where !Locked; because abandoned entries stay where they were, order is preserved.',
      'Abandon: find the locked entry; if DeliveryCount >= maxDeliveryCount remove it and add its Message to the dead letters, otherwise set Locked = false.',
      'ProcessNext: try { handler(d.Message); } catch { queue.Abandon(id); return true; } queue.Complete(id); return true; — completing inside the try would also abandon on a Complete failure.',
    ],
    solution: `public sealed record Message(string Id, string Body);
public sealed record Delivery(Message Message, int DeliveryCount);

public sealed class InMemoryQueue(int maxDeliveryCount)
{
    private sealed class Entry(Message message)
    {
        public Message Message { get; } = message;
        public int DeliveryCount { get; set; }
        public bool Locked { get; set; }
    }

    private readonly List<Entry> _entries = [];
    private readonly List<Message> _deadLetters = [];

    public IReadOnlyList<Message> DeadLetters => _deadLetters;
    public int ActiveCount => _entries.Count;

    public void Send(Message message) => _entries.Add(new Entry(message));

    public Delivery? Receive()
    {
        var entry = _entries.FirstOrDefault(e => !e.Locked);
        if (entry is null) return null;
        entry.Locked = true;
        entry.DeliveryCount++;
        return new Delivery(entry.Message, entry.DeliveryCount);
    }

    public void Complete(string messageId) => _entries.Remove(Locked(messageId));

    public void Abandon(string messageId)
    {
        var entry = Locked(messageId);
        if (entry.DeliveryCount >= maxDeliveryCount)
        {
            _entries.Remove(entry);
            _deadLetters.Add(entry.Message);
        }
        else entry.Locked = false;
    }

    private Entry Locked(string messageId) =>
        _entries.FirstOrDefault(e => e.Locked && e.Message.Id == messageId)
        ?? throw new InvalidOperationException($"Message {messageId} is not locked by a receiver.");
}

public static class MessagePump
{
    public static bool ProcessNext(InMemoryQueue queue, Action<Message> handler)
    {
        var delivery = queue.Receive();
        if (delivery is null) return false;
        try { handler(delivery.Message); }
        catch
        {
            queue.Abandon(delivery.Message.Id);
            return true;
        }
        queue.Complete(delivery.Message.Id);
        return true;
    }
}
`,
    testCode: csTests(`
InMemoryQueue Queue(int max, params string[] ids) { var q = new InMemoryQueue(max); foreach (var id in ids) q.Send(new Message(id, "body-" + id)); return q; }
CheckSeq("first in, first out", () => { var q = Queue(5, "a", "b", "c"); return new[] { q.Receive()?.Message.Id, q.Receive()?.Message.Id, q.Receive()?.Message.Id }; }, ["a", "b", "c"]);
Check("locked messages are not handed out twice", () => { var q = Queue(5, "a"); q.Receive(); return q.Receive(); }, null);
Check("redelivery counts up and keeps position", () => { var q = Queue(5, "a", "b"); q.Receive(); q.Abandon("a"); return q.Receive(); }, new Delivery(new Message("a", "body-a"), 2));
Check("complete removes", () => { var q = Queue(5, "a", "b"); q.Receive(); q.Complete("a"); return q.ActiveCount; }, 1);
Check("locked still counts as active", () => { var q = Queue(5, "a"); q.Receive(); return q.ActiveCount; }, 1);
CheckSeq("dead-letters after max deliveries", () => { var q = Queue(3, "poison"); for (int i = 0; i < 3; i++) { q.Receive(); q.Abandon("poison"); } return q.DeadLetters.Select(m => m.Id).Append(q.ActiveCount.ToString()).Append((q.Receive() is null).ToString()); }, ["poison", "0", "True"]);
Throws<InvalidOperationException>("complete without a lock", () => Queue(3, "a").Complete("a"));
Throws<InvalidOperationException>("abandon of an unknown id", () => { var q = Queue(3, "a"); q.Receive(); q.Abandon("zzz"); });
Check("pump on an empty queue", () => MessagePump.ProcessNext(new InMemoryQueue(3), _ => { }), false);
CheckSeq("pump completes after success", () => { var q = Queue(3, "a"); var seen = new List<string>(); MessagePump.ProcessNext(q, m => seen.Add(m.Id + ":" + q.ActiveCount)); seen.Add("after:" + q.ActiveCount); return seen; }, ["a:1", "after:0"]);
CheckSeq("a poison message does not block the queue", () =>
{
    var q = Queue(2, "poison", "good");
    var handled = new List<string>();
    while (MessagePump.ProcessNext(q, m => { if (m.Id == "poison") throw new FormatException("corrupt"); handled.Add(m.Id); })) { }
    return handled.Concat(q.DeadLetters.Select(m => "dlq:" + m.Id));
}, ["good", "dlq:poison"]);
`),
  },
  {
    id: 'cs-3-10',
    title: 'Evolving a Message Contract',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'OrderPlaced events arrive as JSON envelopes {"type":"OrderPlaced","version":N,"data":{...}} from producers deployed at different times. ' +
      'Version 1 data is {"orderId":"o-1","totalCents":1250} (currency was always GHS, no channel). Version 2 data is {"orderId":"o-1","total":' +
      '{"amount":12.50,"currency":"GHS"},"channel":"web"} where channel is optional. Implement OrderPlacedContract.Read(json) as a tolerant reader: ' +
      'ignore unknown fields, upcast version 1 to the current model (Amount = cents / 100, Currency "GHS", Channel "unknown"), default a missing ' +
      'channel to "unknown". Throw NotSupportedException for another type or an unknown version, and FormatException when orderId is missing or ' +
      'blank. Write(evt) must produce a version 2 envelope that Read accepts.',
    starterCode: `using System.Text.Json;

public sealed record OrderPlaced(string OrderId, decimal Amount, string Currency, string Channel);

public static class OrderPlacedContract
{
    public static OrderPlaced Read(string json) => throw new NotImplementedException();
    public static string Write(OrderPlaced evt) => throw new NotImplementedException();
}
`,
    hints: [
      'using var doc = JsonDocument.Parse(json); var root = doc.RootElement; read root.GetProperty("type").GetString() and root.GetProperty("version").GetInt32().',
      'TryGetProperty handles optional fields: data.TryGetProperty("channel", out var c) ? c.GetString() : null.',
      'For Write, a nested anonymous object serialises cleanly: JsonSerializer.Serialize(new { type = "OrderPlaced", version = 2, data = new { ... } }).',
    ],
    solution: `using System.Text.Json;

public sealed record OrderPlaced(string OrderId, decimal Amount, string Currency, string Channel);

public static class OrderPlacedContract
{
    public static OrderPlaced Read(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        string? type = root.TryGetProperty("type", out var t) ? t.GetString() : null;
        if (type != "OrderPlaced") throw new NotSupportedException($"Unexpected message type '{type}'.");
        int version = root.GetProperty("version").GetInt32();
        var data = root.GetProperty("data");

        string? orderId = data.TryGetProperty("orderId", out var id) ? id.GetString() : null;
        if (string.IsNullOrWhiteSpace(orderId)) throw new FormatException("orderId is required.");
        string channel = data.TryGetProperty("channel", out var c) && c.GetString() is { Length: > 0 } ch ? ch : "unknown";

        return version switch
        {
            1 => new OrderPlaced(orderId, data.GetProperty("totalCents").GetInt64() / 100m, "GHS", "unknown"),
            2 => new OrderPlaced(
                orderId,
                data.GetProperty("total").GetProperty("amount").GetDecimal(),
                data.GetProperty("total").GetProperty("currency").GetString() ?? "GHS",
                channel),
            _ => throw new NotSupportedException($"OrderPlaced version {version} is not supported."),
        };
    }

    public static string Write(OrderPlaced evt) => JsonSerializer.Serialize(new
    {
        type = "OrderPlaced",
        version = 2,
        data = new { orderId = evt.OrderId, total = new { amount = evt.Amount, currency = evt.Currency }, channel = evt.Channel },
    });
}
`,
    testCode: csTests(`
Check("reads version 1 (upcast)", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":1,"data":{"orderId":"o-1","totalCents":1250}}"""), new OrderPlaced("o-1", 12.50m, "GHS", "unknown"));
Check("reads version 2", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":2,"data":{"orderId":"o-2","total":{"amount":99.95,"currency":"USD"},"channel":"mobile"}}"""), new OrderPlaced("o-2", 99.95m, "USD", "mobile"));
Check("optional channel defaults", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":2,"data":{"orderId":"o-3","total":{"amount":5,"currency":"GHS"}}}"""), new OrderPlaced("o-3", 5m, "GHS", "unknown"));
Check("unknown fields are ignored", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":2,"traceId":"x","data":{"orderId":"o-4","coupon":"SAVE5","total":{"amount":1,"currency":"GHS","tax":0},"channel":"web"}}"""), new OrderPlaced("o-4", 1m, "GHS", "web"));
Throws<NotSupportedException>("future version", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":3,"data":{"orderId":"o-5"}}"""));
Throws<NotSupportedException>("wrong type", () => OrderPlacedContract.Read("""{"type":"OrderShipped","version":1,"data":{"orderId":"o-6","totalCents":1}}"""));
Throws<FormatException>("missing order id", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":1,"data":{"totalCents":100}}"""));
Throws<FormatException>("blank order id", () => OrderPlacedContract.Read("""{"type":"OrderPlaced","version":2,"data":{"orderId":"  ","total":{"amount":1,"currency":"GHS"}}}"""));
Check("round trip", () => OrderPlacedContract.Read(OrderPlacedContract.Write(new OrderPlaced("o-7", 42.10m, "EUR", "web"))), new OrderPlaced("o-7", 42.10m, "EUR", "web"));
Check("writes version 2", () => JsonDocument.Parse(OrderPlacedContract.Write(new OrderPlaced("o-8", 1m, "GHS", "web"))).RootElement.GetProperty("version").GetInt32(), 2);
`),
  },
  {
    id: 'cs-3-11',
    title: 'Transactional Outbox and Relay',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Remove the dual write. FakeDatabase (provided) commits everything staged in one InTransaction call, or nothing. Implement ' +
      'OrderService.PlaceOrder(customer, total): throw ArgumentOutOfRangeException when total <= 0; otherwise, in ONE transaction, add the Order ' +
      'and an outbox message of type "OrderPlaced" whose payload is JSON containing "orderId" and "total"; return the new id. The service has no ' +
      'publisher at all. Then implement OutboxRelay.RelayAsync(batchSize): take unsent messages in Sequence order, at most batchSize; publish each ' +
      'and only after a successful publish call db.MarkSent(sequence, time.GetUtcNow()). If a publish throws, stop (leave that message and later ' +
      'ones unsent) and return how many were published in this run.',
    starterCode: `using System.Text.Json;

${OUTBOX_INFRASTRUCTURE}
public sealed class OrderService(FakeDatabase db)
{
    public Guid PlaceOrder(string customer, decimal total) => throw new NotImplementedException();
}

public sealed class OutboxRelay(FakeDatabase db, IPublisher publisher, TimeProvider time)
{
    public Task<int> RelayAsync(int batchSize, CancellationToken ct) => throw new NotImplementedException();
}
`,
    hints: [
      'db.InTransaction(session => { session.Add(order); session.AddOutboxMessage("OrderPlaced", payload); }); — both writes or neither.',
      'Payload: JsonSerializer.Serialize(new { orderId = id, total }).',
      'Relay: foreach over db.Outbox.Where(m => m.SentAt is null).OrderBy(m => m.Sequence).Take(batchSize).ToList(); wrap the publish in try/catch and return the count on failure.',
    ],
    solution: `using System.Text.Json;

${OUTBOX_INFRASTRUCTURE}
public sealed class OrderService(FakeDatabase db)
{
    public Guid PlaceOrder(string customer, decimal total)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(total);
        var order = new Order(Guid.NewGuid(), customer, total);
        string payload = JsonSerializer.Serialize(new { orderId = order.Id, total = order.Total });
        db.InTransaction(session =>
        {
            session.Add(order);
            session.AddOutboxMessage("OrderPlaced", payload);
        });
        return order.Id;
    }
}

public sealed class OutboxRelay(FakeDatabase db, IPublisher publisher, TimeProvider time)
{
    public async Task<int> RelayAsync(int batchSize, CancellationToken ct)
    {
        var batch = db.Outbox.Where(m => m.SentAt is null).OrderBy(m => m.Sequence).Take(batchSize).ToList();
        int published = 0;
        foreach (var message in batch)
        {
            try { await publisher.PublishAsync(message.Type, message.Payload, ct); }
            catch (Exception) { return published; }   // stays unsent; the next run retries it (at-least-once)
            db.MarkSent(message.Sequence, time.GetUtcNow());
            published++;
        }
        return published;
    }
}
`,
    testCode: `public sealed class SpyPublisher : IPublisher
{
    public List<string> Published { get; } = [];
    public Func<string, bool> FailWhen { get; set; } = _ => false;
    public Task PublishAsync(string type, string payload, CancellationToken ct)
    {
        string orderId = JsonDocument.Parse(payload).RootElement.GetProperty("orderId").GetString()!;
        if (FailWhen(orderId)) throw new IOException("broker unavailable");
        Published.Add(type + ":" + orderId);
        return Task.CompletedTask;
    }
}
public sealed class TestTime(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
` + csTests(`
var none = CancellationToken.None;
var at = new DateTimeOffset(2026, 10, 1, 9, 30, 0, TimeSpan.Zero);
Check("order and outbox commit together", () => { var db = new FakeDatabase(); var id = new OrderService(db).PlaceOrder("ama", 50m); return (db.Orders.Single().Id == id, db.Outbox.Single().Type); }, (true, "OrderPlaced"));
Check("payload carries the order", () => { var db = new FakeDatabase(); var id = new OrderService(db).PlaceOrder("ama", 50m); var p = JsonDocument.Parse(db.Outbox.Single().Payload).RootElement; return (p.GetProperty("orderId").GetGuid() == id, p.GetProperty("total").GetDecimal()); }, (true, 50m));
Check("failed commit leaves neither", () => { var db = new FakeDatabase { FailNextCommit = true }; try { new OrderService(db).PlaceOrder("ama", 50m); } catch (IOException) { } return (db.Orders.Count, db.Outbox.Count); }, (0, 0));
Throws<ArgumentOutOfRangeException>("rejects a zero total", () => new OrderService(new FakeDatabase()).PlaceOrder("ama", 0m));
Expect("service has no publisher dependency", () => typeof(OrderService).GetConstructors().Single().GetParameters().All(p => p.ParameterType == typeof(FakeDatabase)), "OrderService must not publish directly — that is the dual write");
await CheckAsync("relay publishes in order and marks sent", async () =>
{
    var db = new FakeDatabase(); var svc = new OrderService(db); var ids = new[] { svc.PlaceOrder("a", 1m), svc.PlaceOrder("b", 2m) };
    var spy = new SpyPublisher(); int n = await new OutboxRelay(db, spy, new TestTime(at)).RelayAsync(10, none);
    return (n, spy.Published.SequenceEqual(ids.Select(i => "OrderPlaced:" + i)), db.Outbox.All(m => m.SentAt == at));
}, (2, true, true));
await CheckAsync("batch size respected", async () => { var db = new FakeDatabase(); var svc = new OrderService(db); for (int i = 0; i < 5; i++) svc.PlaceOrder("c", 1m); return await new OutboxRelay(db, new SpyPublisher(), new TestTime(at)).RelayAsync(3, none) * 10 + db.Outbox.Count(m => m.SentAt is null); }, 32);
await CheckAsync("sent messages are not republished", async () => { var db = new FakeDatabase(); new OrderService(db).PlaceOrder("a", 1m); var spy = new SpyPublisher(); var relay = new OutboxRelay(db, spy, new TestTime(at)); await relay.RelayAsync(10, none); await relay.RelayAsync(10, none); return spy.Published.Count; }, 1);
await CheckAsync("publish failure stops and resumes later", async () =>
{
    var db = new FakeDatabase(); var svc = new OrderService(db); var a = svc.PlaceOrder("a", 1m); var b = svc.PlaceOrder("b", 1m); var c = svc.PlaceOrder("c", 1m);
    var spy = new SpyPublisher { FailWhen = id => id == b.ToString() }; var relay = new OutboxRelay(db, spy, new TestTime(at));
    int first = await relay.RelayAsync(10, none); int unsent = db.Outbox.Count(m => m.SentAt is null);
    spy.FailWhen = _ => false; int second = await relay.RelayAsync(10, none);
    return (first, unsent, second, spy.Published.SequenceEqual(new[] { a, b, c }.Select(i => "OrderPlaced:" + i)));
}, (1, 2, 2, true));
`),
  },
  {
    id: 'cs-3-12',
    title: 'Order Saga with an Inbox',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement OrderSaga(orderId) as an explicit state machine starting in AwaitingStock. Start() returns [ReserveStock]. Handle(event) returns ' +
      'the commands to send: AwaitingStock + StockReserved → AwaitingPayment, [TakePayment]; AwaitingStock + StockUnavailable → Cancelled, ' +
      '[CancelOrder("out of stock")]; AwaitingStock + SagaTimedOut → Cancelled, [CancelOrder("timed out")]; AwaitingPayment + PaymentTaken → ' +
      'Completed, [ConfirmOrder]; AwaitingPayment + PaymentFailed → Cancelled, [ReleaseStock, CancelOrder("payment failed")]; AwaitingPayment + ' +
      'SagaTimedOut → stay, [CheckPaymentStatus] (a payment timeout is unknown, not failed). Act as an inbox: a MessageId seen before returns [] ' +
      'and changes nothing. Any other combination (late or out-of-order events) returns []. An event for another order throws ArgumentException.',
    starterCode: `${SAGA_MESSAGES}
public sealed class OrderSaga(Guid orderId)
{
    public Guid OrderId => orderId;
    public OrderSagaState State => throw new NotImplementedException();
    public IReadOnlyList<SagaCommand> Start() => throw new NotImplementedException();
    public IReadOnlyList<SagaCommand> Handle(SagaEvent evt) => throw new NotImplementedException();
}
`,
    hints: [
      'Check the order id first, then the inbox: if (!_processed.Add(evt.MessageId)) return [];',
      'A switch on the tuple (State, evt) mirrors the transition table: (OrderSagaState.AwaitingStock, StockReserved) => Move(...).',
      'A Move(next, params SagaCommand[] commands) helper sets State and returns the commands; the default arm returns [].',
    ],
    solution: `${SAGA_MESSAGES}
public sealed class OrderSaga(Guid orderId)
{
    private readonly HashSet<string> _processed = [];

    public Guid OrderId => orderId;
    public OrderSagaState State { get; private set; } = OrderSagaState.AwaitingStock;

    public IReadOnlyList<SagaCommand> Start() => [new ReserveStock(orderId)];

    public IReadOnlyList<SagaCommand> Handle(SagaEvent evt)
    {
        if (evt.OrderId != orderId) throw new ArgumentException($"Event for order {evt.OrderId} sent to saga {orderId}.", nameof(evt));
        if (!_processed.Add(evt.MessageId)) return [];   // inbox: duplicates are harmless

        return (State, evt) switch
        {
            (OrderSagaState.AwaitingStock, StockReserved) => Move(OrderSagaState.AwaitingPayment, new TakePayment(orderId)),
            (OrderSagaState.AwaitingStock, StockUnavailable) => Move(OrderSagaState.Cancelled, new CancelOrder(orderId, "out of stock")),
            (OrderSagaState.AwaitingStock, SagaTimedOut) => Move(OrderSagaState.Cancelled, new CancelOrder(orderId, "timed out")),
            (OrderSagaState.AwaitingPayment, PaymentTaken) => Move(OrderSagaState.Completed, new ConfirmOrder(orderId)),
            (OrderSagaState.AwaitingPayment, PaymentFailed) => Move(OrderSagaState.Cancelled, new ReleaseStock(orderId), new CancelOrder(orderId, "payment failed")),
            (OrderSagaState.AwaitingPayment, SagaTimedOut) => [new CheckPaymentStatus(orderId)],
            _ => [],
        };
    }

    private SagaCommand[] Move(OrderSagaState next, params SagaCommand[] commands)
    {
        State = next;
        return commands;
    }
}
`,
    testCode: csTests(`
var id = Guid.Parse("11111111-2222-3333-4444-555555555555");
OrderSaga Saga() => new OrderSaga(id);
CheckSeq<SagaCommand>("start reserves stock", () => Saga().Start(), [new ReserveStock(id)]);
CheckSeq<SagaCommand>("stock reserved → take payment", () => Saga().Handle(new StockReserved("m1", id)), [new TakePayment(id)]);
Check("happy path completes", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); s.Handle(new PaymentTaken("m2", id)); return s.State; }, OrderSagaState.Completed);
CheckSeq<SagaCommand>("payment taken → confirm", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); return s.Handle(new PaymentTaken("m2", id)); }, [new ConfirmOrder(id)]);
CheckSeq<SagaCommand>("payment failed compensates", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); return s.Handle(new PaymentFailed("m2", id)); }, [new ReleaseStock(id), new CancelOrder(id, "payment failed")]);
CheckSeq<SagaCommand>("out of stock cancels without release", () => Saga().Handle(new StockUnavailable("m1", id)), [new CancelOrder(id, "out of stock")]);
CheckSeq<SagaCommand>("stock timeout cancels", () => Saga().Handle(new SagaTimedOut("t1", id)), [new CancelOrder(id, "timed out")]);
Check("payment timeout asks, never cancels", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); var cmds = s.Handle(new SagaTimedOut("t1", id)); return (s.State, cmds.SingleOrDefault()); }, (OrderSagaState.AwaitingPayment, (SagaCommand?)new CheckPaymentStatus(id)));
Check("duplicate message is a no-op", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); s.Handle(new PaymentFailed("m2", id)); return s.Handle(new PaymentFailed("m2", id)).Count; }, 0);
Check("redelivered StockReserved does not charge twice", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); return (s.Handle(new StockReserved("m1", id)).Count, s.State); }, (0, OrderSagaState.AwaitingPayment));
Check("late event after completion ignored", () => { var s = Saga(); s.Handle(new StockReserved("m1", id)); s.Handle(new PaymentTaken("m2", id)); return (s.Handle(new PaymentFailed("m3", id)).Count, s.State); }, (0, OrderSagaState.Completed));
Check("out-of-order payment before stock ignored", () => { var s = Saga(); return (s.Handle(new PaymentTaken("m9", id)).Count, s.State); }, (0, OrderSagaState.AwaitingStock));
Throws<ArgumentException>("event for another order", () => Saga().Handle(new StockReserved("m1", Guid.NewGuid())));
`),
  },
  {
    id: 'cs-3-13',
    title: 'Retry with Exponential Backoff and Jitter',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement RetryPolicy. BackoffWithFullJitter(attempt, baseDelay, maxDelay, random) returns random.NextDouble() × min(maxDelay, baseDelay × ' +
      '2^(attempt − 1)) — attempt is 1 for the first failure. The constructor throws ArgumentOutOfRangeException when maxAttempts < 1. ' +
      'ExecuteAsync(operation, ct) runs the operation up to maxAttempts times. Retry only TransientException and TimeoutException; any other ' +
      'exception propagates immediately. Between attempts await the injected delay function with the backoff for the attempt that failed. After ' +
      'the last attempt rethrow the last exception. Before every attempt, call ct.ThrowIfCancellationRequested().',
    starterCode: `public sealed class TransientException(string message) : Exception(message);

public sealed class RetryPolicy
{
    public RetryPolicy(int maxAttempts, TimeSpan baseDelay, TimeSpan maxDelay, Random random, Func<TimeSpan, CancellationToken, Task> delay)
        => throw new NotImplementedException();

    public static TimeSpan BackoffWithFullJitter(int attempt, TimeSpan baseDelay, TimeSpan maxDelay, Random random)
        => throw new NotImplementedException();

    public Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken ct)
        => throw new NotImplementedException();
}
`,
    hints: [
      'Use an exception filter: catch (Exception e) when (e is TransientException or TimeoutException && attempt < _maxAttempts) { await _delay(...); }',
      'A for loop from attempt = 1 works; when the filter is false on the last attempt the exception simply propagates with its original stack trace.',
      'The delay is injected so tests do not actually wait — never call Task.Delay directly.',
    ],
    solution: `public sealed class TransientException(string message) : Exception(message);

public sealed class RetryPolicy
{
    private readonly int _maxAttempts;
    private readonly TimeSpan _baseDelay, _maxDelay;
    private readonly Random _random;
    private readonly Func<TimeSpan, CancellationToken, Task> _delay;

    public RetryPolicy(int maxAttempts, TimeSpan baseDelay, TimeSpan maxDelay, Random random, Func<TimeSpan, CancellationToken, Task> delay)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(maxAttempts, 1);
        (_maxAttempts, _baseDelay, _maxDelay, _random, _delay) = (maxAttempts, baseDelay, maxDelay, random, delay);
    }

    public static TimeSpan BackoffWithFullJitter(int attempt, TimeSpan baseDelay, TimeSpan maxDelay, Random random)
    {
        double exponential = Math.Min(maxDelay.TotalMilliseconds, baseDelay.TotalMilliseconds * Math.Pow(2, attempt - 1));
        return TimeSpan.FromMilliseconds(random.NextDouble() * exponential);
    }

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken ct)
    {
        for (int attempt = 1; ; attempt++)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                return await operation(ct);
            }
            catch (Exception e) when (e is TransientException or TimeoutException && attempt < _maxAttempts)
            {
                await _delay(BackoffWithFullJitter(attempt, _baseDelay, _maxDelay, _random), ct);
            }
        }
    }
}
`,
    testCode: `public sealed class FixedRandom(double value) : Random { public override double NextDouble() => value; }
` + csTests(`
var none = CancellationToken.None;
TimeSpan ms(double v) => TimeSpan.FromMilliseconds(v);
Check("attempt 1 is jittered base", () => RetryPolicy.BackoffWithFullJitter(1, ms(100), ms(5000), new FixedRandom(0.5)), ms(50));
Check("doubles each attempt", () => RetryPolicy.BackoffWithFullJitter(4, ms(100), ms(5000), new FixedRandom(1.0)), ms(800));
Check("capped at max", () => RetryPolicy.BackoffWithFullJitter(10, ms(100), ms(2000), new FixedRandom(1.0)), ms(2000));
Check("zero jitter allowed", () => RetryPolicy.BackoffWithFullJitter(3, ms(100), ms(2000), new FixedRandom(0)), TimeSpan.Zero);
(RetryPolicy Policy, List<TimeSpan> Delays) Make(int max) { var d = new List<TimeSpan>(); return (new RetryPolicy(max, ms(100), ms(250), new FixedRandom(1.0), (t, _) => { d.Add(t); return Task.CompletedTask; }), d); }
await CheckAsync("succeeds after transient failures", async () => { var (p, d) = Make(5); int calls = 0; var r = await p.ExecuteAsync(_ => ++calls < 3 ? throw new TransientException("blip") : Task.FromResult("ok"), none); return (r, calls, string.Join(",", d.Select(x => x.TotalMilliseconds))); }, ("ok", 3, "100,200"));
await CheckAsync("timeouts are retried and delays capped", async () => { var (p, d) = Make(4); int calls = 0; try { await p.ExecuteAsync<int>(_ => { calls++; throw new TimeoutException(); }, none); } catch (TimeoutException) { } return (calls, string.Join(",", d.Select(x => x.TotalMilliseconds))); }, (4, "100,200,250"));
await ThrowsAsync<TransientException>("rethrows after the last attempt", async () => await Make(2).Policy.ExecuteAsync<int>(_ => throw new TransientException("still down"), none));
await CheckAsync("non-transient errors are not retried", async () => { var (p, d) = Make(5); int calls = 0; try { await p.ExecuteAsync<int>(_ => { calls++; throw new ArgumentException("bad input"); }, none); } catch (ArgumentException) { } return (calls, d.Count); }, (1, 0));
await CheckAsync("first success needs no delay", async () => { var (p, d) = Make(3); return (await p.ExecuteAsync(_ => Task.FromResult(7), none), d.Count); }, (7, 0));
await ThrowsAsync<OperationCanceledException>("honours cancellation", async () => { using var cts = new CancellationTokenSource(); cts.Cancel(); await Make(3).Policy.ExecuteAsync(_ => Task.FromResult(1), cts.Token); });
Throws<ArgumentOutOfRangeException>("max attempts must be positive", () => new RetryPolicy(0, ms(1), ms(1), new Random(1), (_, _) => Task.CompletedTask));
`),
  },
  {
    id: 'cs-3-14',
    title: 'Circuit Breaker',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement CircuitBreaker(failureThreshold, breakDuration, time). Closed: run the action; a success resets the consecutive-failure count; a ' +
      'failure rethrows and, on reaching the threshold, opens the circuit. Open: throw BrokenCircuitException without calling the action until ' +
      'breakDuration has passed since it opened (use time.GetUtcNow()). After that the circuit is HalfOpen: exactly one trial call is allowed — ' +
      'other calls while the trial is running throw BrokenCircuitException. A successful trial closes the circuit; a failed trial rethrows and opens ' +
      'it again for a fresh breakDuration. The State property must report HalfOpen as soon as the break has elapsed.',
    starterCode: `public enum CircuitState { Closed, Open, HalfOpen }

public sealed class BrokenCircuitException() : Exception("The circuit is open; the call was not attempted.");

public sealed class CircuitBreaker(int failureThreshold, TimeSpan breakDuration, TimeProvider time)
{
    public CircuitState State => throw new NotImplementedException();
    public Task<T> ExecuteAsync<T>(Func<Task<T>> action) => throw new NotImplementedException();
}
`,
    hints: [
      'Store _failures, _openedAt (DateTimeOffset?) and _trialRunning. State: _openedAt is null → Closed; now − _openedAt < breakDuration → Open; otherwise HalfOpen.',
      'In HalfOpen, set _trialRunning = true before awaiting the action and reset it in a finally block.',
      'Throw BrokenCircuitException when State is Open, or when it is HalfOpen and a trial is already running.',
    ],
    solution: `public enum CircuitState { Closed, Open, HalfOpen }

public sealed class BrokenCircuitException() : Exception("The circuit is open; the call was not attempted.");

public sealed class CircuitBreaker(int failureThreshold, TimeSpan breakDuration, TimeProvider time)
{
    private int _failures;
    private DateTimeOffset? _openedAt;
    private bool _trialRunning;

    public CircuitState State =>
        _openedAt is null ? CircuitState.Closed
        : time.GetUtcNow() - _openedAt.Value < breakDuration ? CircuitState.Open
        : CircuitState.HalfOpen;

    public async Task<T> ExecuteAsync<T>(Func<Task<T>> action)
    {
        var state = State;
        if (state == CircuitState.Open || (state == CircuitState.HalfOpen && _trialRunning)) throw new BrokenCircuitException();

        bool trial = state == CircuitState.HalfOpen;
        if (trial) _trialRunning = true;
        try
        {
            T result = await action();
            _failures = 0;
            _openedAt = null;
            return result;
        }
        catch (Exception)
        {
            if (trial || ++_failures >= failureThreshold) _openedAt = time.GetUtcNow();
            throw;
        }
        finally
        {
            if (trial) _trialRunning = false;
        }
    }
}
`,
    testCode: `public sealed class ManualTime : TimeProvider
{
    public DateTimeOffset Now { get; set; } = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
    public override DateTimeOffset GetUtcNow() => Now;
}
` + csTests(`
Task<int> Fail() => throw new IOException("dependency down");
Task<int> Ok() => Task.FromResult(1);
async Task Swallow(Func<Task> call) { try { await call(); } catch (Exception) { } }
(CircuitBreaker B, ManualTime T) Make() { var t = new ManualTime(); return (new CircuitBreaker(3, TimeSpan.FromSeconds(30), t), t); }
Check("starts closed", () => Make().B.State, CircuitState.Closed);
await ThrowsAsync<IOException>("failures are rethrown", async () => await Make().B.ExecuteAsync(Fail));
await CheckAsync("opens at the threshold", async () => { var (b, _) = Make(); for (int i = 0; i < 3; i++) await Swallow(() => b.ExecuteAsync(Fail)); return b.State; }, CircuitState.Open);
await CheckAsync("success resets the count", async () => { var (b, _) = Make(); await Swallow(() => b.ExecuteAsync(Fail)); await Swallow(() => b.ExecuteAsync(Fail)); await b.ExecuteAsync(Ok); await Swallow(() => b.ExecuteAsync(Fail)); await Swallow(() => b.ExecuteAsync(Fail)); return b.State; }, CircuitState.Closed);
await CheckAsync("open circuit does not call the dependency", async () =>
{
    var (b, _) = Make(); for (int i = 0; i < 3; i++) await Swallow(() => b.ExecuteAsync(Fail));
    int calls = 0; try { await b.ExecuteAsync(() => { calls++; return Ok(); }); } catch (BrokenCircuitException) { return calls; } return -1;
}, 0);
await CheckAsync("half-open after the break", async () => { var (b, t) = Make(); for (int i = 0; i < 3; i++) await Swallow(() => b.ExecuteAsync(Fail)); t.Now += TimeSpan.FromSeconds(29); var before = b.State; t.Now += TimeSpan.FromSeconds(1); return (before, b.State); }, (CircuitState.Open, CircuitState.HalfOpen));
await CheckAsync("successful trial closes", async () => { var (b, t) = Make(); for (int i = 0; i < 3; i++) await Swallow(() => b.ExecuteAsync(Fail)); t.Now += TimeSpan.FromSeconds(30); var r = await b.ExecuteAsync(Ok); return (r, b.State); }, (1, CircuitState.Closed));
await CheckAsync("failed trial reopens for a fresh break", async () =>
{
    var (b, t) = Make(); for (int i = 0; i < 3; i++) await Swallow(() => b.ExecuteAsync(Fail));
    t.Now += TimeSpan.FromSeconds(30); await Swallow(() => b.ExecuteAsync(Fail)); var afterTrial = b.State;
    t.Now += TimeSpan.FromSeconds(29); return (afterTrial, b.State);
}, (CircuitState.Open, CircuitState.Open));
await CheckAsync("only one trial at a time", async () =>
{
    var (b, t) = Make(); for (int i = 0; i < 3; i++) await Swallow(() => b.ExecuteAsync(Fail));
    t.Now += TimeSpan.FromSeconds(30);
    var gate = new TaskCompletionSource<int>();
    var trial = b.ExecuteAsync(() => gate.Task);
    bool rejected = false; try { await b.ExecuteAsync(Ok); } catch (BrokenCircuitException) { rejected = true; }
    gate.SetResult(5); int r = await trial;
    return (rejected, r, b.State);
}, (true, 5, CircuitState.Closed));
`),
  },
  {
    id: 'cs-3-15',
    title: 'Idempotency Keys for a Payment API',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'A customer double-clicks Pay and the mobile app retries after a timeout — both must charge once. Implement IdempotentPayments.ChargeAsync(' +
      'key, request): a blank key throws ArgumentException. For a new key, record the key as in flight BEFORE calling the gateway (passing the same ' +
      'key), store the response and return Completed(response, Replayed: false). The same key with an equal request returns the stored response ' +
      'with Replayed: true without calling the gateway. The same key with a different request returns Conflict. The same key while the first call ' +
      'is still in flight returns InProgress. If the gateway throws, forget the key (so the client can retry with the same key) and rethrow.',
    starterCode: `${PAYMENT_TYPES}
public sealed class IdempotentPayments(IPaymentGateway gateway)
{
    public Task<IdempotentResult> ChargeAsync(string idempotencyKey, ChargeRequest request, CancellationToken ct) => throw new NotImplementedException();
}
`,
    hints: [
      'Store Dictionary<string, (ChargeRequest Request, ChargeResponse? Response)>; a null Response means in flight.',
      'Compare requests with == — records give value equality, so the same order, amount and currency are equal.',
      'Add the in-flight entry, then try { var response = await gateway.ChargeAsync(...); store it; } catch { _entries.Remove(key); throw; }',
    ],
    solution: `${PAYMENT_TYPES}
public sealed class IdempotentPayments(IPaymentGateway gateway)
{
    private readonly Dictionary<string, (ChargeRequest Request, ChargeResponse? Response)> _entries = [];

    public async Task<IdempotentResult> ChargeAsync(string idempotencyKey, ChargeRequest request, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);

        if (_entries.TryGetValue(idempotencyKey, out var existing))
        {
            if (existing.Request != request) return new IdempotentResult.Conflict("This idempotency key was used with a different request.");
            return existing.Response is null
                ? new IdempotentResult.InProgress()
                : new IdempotentResult.Completed(existing.Response, Replayed: true);
        }

        _entries[idempotencyKey] = (request, null);
        try
        {
            var response = await gateway.ChargeAsync(idempotencyKey, request, ct);
            _entries[idempotencyKey] = (request, response);
            return new IdempotentResult.Completed(response, Replayed: false);
        }
        catch
        {
            _entries.Remove(idempotencyKey);
            throw;
        }
    }
}
`,
    testCode: `public sealed class FakeGateway : IPaymentGateway
{
    public List<string> KeysSeen { get; } = [];
    public int FailuresLeft { get; set; }
    public TaskCompletionSource? Gate { get; set; }
    public async Task<ChargeResponse> ChargeAsync(string idempotencyKey, ChargeRequest request, CancellationToken ct)
    {
        KeysSeen.Add(idempotencyKey);
        if (Gate is not null) await Gate.Task;
        if (FailuresLeft-- > 0) throw new TimeoutException("provider timed out");
        return new ChargeResponse("pay_" + KeysSeen.Count, "captured");
    }
}
` + csTests(`
var none = CancellationToken.None;
var req = new ChargeRequest("order-42", 120.00m, "GHS");
await CheckAsync("first call charges", async () => { var g = new FakeGateway(); var r = await new IdempotentPayments(g).ChargeAsync("k1", req, none); return (r, g.KeysSeen.Count); }, ((IdempotentResult)new IdempotentResult.Completed(new ChargeResponse("pay_1", "captured"), false), 1));
await CheckAsync("double click replays, charges once", async () => { var g = new FakeGateway(); var p = new IdempotentPayments(g); await p.ChargeAsync("k1", req, none); var r = await p.ChargeAsync("k1", req with { }, none); return (r, g.KeysSeen.Count); }, ((IdempotentResult)new IdempotentResult.Completed(new ChargeResponse("pay_1", "captured"), true), 1));
await ExpectAsync("same key, different amount conflicts", async () => { var p = new IdempotentPayments(new FakeGateway()); await p.ChargeAsync("k1", req, none); return await p.ChargeAsync("k1", req with { Amount = 1m }, none) is IdempotentResult.Conflict; }, "expected Conflict");
await CheckAsync("different keys are independent", async () => { var g = new FakeGateway(); var p = new IdempotentPayments(g); await p.ChargeAsync("k1", req, none); await p.ChargeAsync("k2", req, none); return g.KeysSeen.Count; }, 2);
await CheckAsync("in-flight duplicate gets InProgress", async () =>
{
    var g = new FakeGateway { Gate = new TaskCompletionSource() }; var p = new IdempotentPayments(g);
    var first = p.ChargeAsync("k1", req, none);
    var second = await p.ChargeAsync("k1", req, none);
    g.Gate.SetResult(); var done = await first;
    return (second is IdempotentResult.InProgress, done is IdempotentResult.Completed { Replayed: false }, g.KeysSeen.Count);
}, (true, true, 1));
await CheckAsync("failure releases the key; retry reuses it", async () =>
{
    var g = new FakeGateway { FailuresLeft = 1 }; var p = new IdempotentPayments(g);
    bool threw = false; try { await p.ChargeAsync("k1", req, none); } catch (TimeoutException) { threw = true; }
    var retry = await p.ChargeAsync("k1", req, none);
    return (threw, retry is IdempotentResult.Completed { Replayed: false }, string.Join(",", g.KeysSeen));
}, (true, true, "k1,k1"));
await ThrowsAsync<ArgumentException>("blank key rejected", async () => await new IdempotentPayments(new FakeGateway()).ChargeAsync(" ", req, none));
`),
  },
  {
    id: 'cs-3-16',
    title: 'Payment Reconciliation',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Compare your ledger with the provider\'s settlement report. Reconciler.Reconcile(ledger, settlement) returns a ReconciliationReport. ' +
      'Duplicate IntentKeys in the ledger throw ArgumentException. For each intent key: more than one settlement line → issue "DUPLICATE <key> x<n>"; ' +
      'settled but not in the ledger → "UNKNOWN_CHARGE <key>"; ledger Captured but not settled → "MISSING_AT_PROVIDER <key>"; ledger Captured with ' +
      'one line of a different amount → "AMOUNT_MISMATCH <key> expected <a> got <b>" (amounts with two decimals, invariant culture); ledger Failed ' +
      'but settled → "CHARGED_BUT_MARKED_FAILED <key>". Ledger Unknown or Pending intents are resolved, not reported: settled → ResolveAsCaptured, ' +
      'not settled → SafeToRetry. Sort all three lists ordinally.',
    starterCode: `using System.Globalization;

${RECONCILIATION_TYPES}
public static class Reconciler
{
    public static ReconciliationReport Reconcile(IEnumerable<LedgerEntry> ledger, IEnumerable<SettlementLine> settlement) => throw new NotImplementedException();
}
`,
    hints: [
      'Build a Dictionary from the ledger (ToDictionary throws on duplicates — but throw ArgumentException with a clear message yourself) and a lookup from settlement: settlement.ToLookup(s => s.IntentKey).',
      'Loop over the union of keys from both sides; a duplicate settlement is reported once and needs no further comparison.',
      'amount.ToString("0.00", CultureInfo.InvariantCulture) gives "120.00" on every machine.',
    ],
    solution: `using System.Globalization;

${RECONCILIATION_TYPES}
public static class Reconciler
{
    public static ReconciliationReport Reconcile(IEnumerable<LedgerEntry> ledger, IEnumerable<SettlementLine> settlement)
    {
        var entries = new Dictionary<string, LedgerEntry>();
        foreach (var entry in ledger)
            if (!entries.TryAdd(entry.IntentKey, entry)) throw new ArgumentException($"Ledger contains intent {entry.IntentKey} twice.", nameof(ledger));
        var lines = settlement.ToLookup(s => s.IntentKey);

        List<string> issues = [], resolve = [], retry = [];
        foreach (string key in entries.Keys.Union(lines.Select(g => g.Key)))
        {
            var settled = lines[key].ToList();
            entries.TryGetValue(key, out var entry);

            if (settled.Count > 1) { issues.Add($"DUPLICATE {key} x{settled.Count}"); continue; }
            if (entry is null) { issues.Add($"UNKNOWN_CHARGE {key}"); continue; }

            switch (entry.State)
            {
                case PaymentState.Captured when settled.Count == 0:
                    issues.Add($"MISSING_AT_PROVIDER {key}");
                    break;
                case PaymentState.Captured when settled[0].Amount != entry.Amount:
                    issues.Add($"AMOUNT_MISMATCH {key} expected {Money(entry.Amount)} got {Money(settled[0].Amount)}");
                    break;
                case PaymentState.Failed when settled.Count == 1:
                    issues.Add($"CHARGED_BUT_MARKED_FAILED {key}");
                    break;
                case PaymentState.Unknown or PaymentState.Pending:
                    (settled.Count == 1 ? resolve : retry).Add(key);
                    break;
            }
        }

        return new ReconciliationReport(Sorted(issues), Sorted(resolve), Sorted(retry));
    }

    private static string Money(decimal amount) => amount.ToString("0.00", CultureInfo.InvariantCulture);
    private static List<string> Sorted(List<string> items) => items.Order(StringComparer.Ordinal).ToList();
}
`,
    testCode: csTests(`
LedgerEntry L(string k, decimal a, PaymentState s) => new(k, a, s);
SettlementLine S(string k, decimal a) => new(k, "ch_" + k, a);
ReconciliationReport Run(LedgerEntry[] ledger, SettlementLine[] settlement) => Reconciler.Reconcile(ledger, settlement);
CheckSeq("clean books have no issues", () => Run([L("a", 10m, PaymentState.Captured), L("b", 5m, PaymentState.Failed)], [S("a", 10.00m)]).Issues, []);
CheckSeq("missing at provider", () => Run([L("a", 10m, PaymentState.Captured)], []).Issues, ["MISSING_AT_PROVIDER a"]);
CheckSeq("unknown charge", () => Run([], [S("zz", 3m)]).Issues, ["UNKNOWN_CHARGE zz"]);
CheckSeq("amount mismatch formatting", () => Run([L("a", 120m, PaymentState.Captured)], [S("a", 12.5m)]).Issues, ["AMOUNT_MISMATCH a expected 120.00 got 12.50"]);
CheckSeq("duplicate charge reported once", () => Run([L("a", 10m, PaymentState.Captured)], [S("a", 10m), S("a", 10m), S("a", 10m)]).Issues, ["DUPLICATE a x3"]);
CheckSeq("charged but marked failed", () => Run([L("a", 10m, PaymentState.Failed)], [S("a", 10m)]).Issues, ["CHARGED_BUT_MARKED_FAILED a"]);
Check("unknown intents are resolved", () => { var r = Run([L("u1", 1m, PaymentState.Unknown), L("u2", 1m, PaymentState.Unknown), L("p1", 1m, PaymentState.Pending)], [S("u2", 1m)]); return (string.Join(",", r.ResolveAsCaptured), string.Join(",", r.SafeToRetry), r.Issues.Count); }, ("u2", "p1,u1", 0));
CheckSeq("issues sorted ordinally", () => Run([L("b", 1m, PaymentState.Captured), L("a", 1m, PaymentState.Captured)], [S("C", 1m)]).Issues, ["MISSING_AT_PROVIDER a", "MISSING_AT_PROVIDER b", "UNKNOWN_CHARGE C"]);
Throws<ArgumentException>("duplicate ledger keys rejected", () => Run([L("a", 1m, PaymentState.Captured), L("a", 1m, PaymentState.Captured)], []));
`),
  },
];
