import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 11 Assignment: Event-Driven Order Workflow

Three services — Orders, Payments and Shipping — each with **its own database**, cooperate only through a message
broker. The broker is honest about the real world: delivery is **at least once** (a message can arrive twice), it
can be **unavailable**, and any process can **crash** between two lines of code. \`Infrastructure.cs\` simulates all of
that, and \`World.cs\` wires the services together and pumps messages until the system is quiet. Both are given.

## The workflow (an orchestrated saga, run by \`OrderSaga\` in the Orders service)

\`\`\`
PlaceOrder ─▶ OrderPlaced ─▶ Payments ─▶ PaymentSucceeded ─▶ saga: Paid, send ShipOrder ─▶ Shipping ─▶ ShipmentBooked ─▶ Completed
                                   └──▶ PaymentFailed ─▶ Cancelled ("Card declined")
                                                                         Shipping ─▶ ShipmentFailed ─▶ saga: Refunding, send RefundPayment
                                                                                      Payments ─▶ PaymentRefunded ─▶ Cancelled (shipping reason)
\`\`\`

## Requirements

1. **OrderService.PlaceOrder** validates its input (non-empty customer; amount > 0 with at most two decimals; an upper-case
   two-letter country — otherwise \`ArgumentException\` and nothing is written), then writes the order (\`Pending\`) **and**
   its \`OrderPlaced\` message to an outbox table **in one transaction**. It never talks to the broker.
2. **OutboxRelay.PublishPending** publishes a database's unsent outbox messages in the order they were written and marks
   each one sent. If publishing or marking throws, let the exception escape — whatever is unmarked is retried next run.
   A message keeps the **same MessageId** every time it is published.
3. **PaymentService** — on \`OrderPlaced\`: amounts over **1000.00** fail with \`"Card declined"\`; otherwise record a charge and
   reply \`PaymentSucceeded\`. On \`RefundPayment\`: refund the charge once and reply \`PaymentRefunded\`. **An order is never
   charged or refunded twice and no reply is ever sent twice**, however often a message arrives — even when the same
   order arrives again inside a brand-new message. \`Ledger()\` lists \`charged <orderId:N> <amount:F2>\` and
   \`refunded <orderId:N> <amount:F2>\` entries.
4. **ShippingService** — on \`ShipOrder\`: countries GH, NG and KE are booked (one shipment per order) and answered with
   \`ShipmentBooked\`; anything else is answered with \`ShipmentFailed("We do not ship to <XX>")\`.
5. **OrderSaga** moves the order through \`Pending → Paid → Completed\`, or to \`Cancelled\` with the reason shown above,
   sending commands through the Orders outbox. Duplicate or stale messages change nothing.

Every handler does its reads, writes and outgoing messages in **one** \`db.Transaction\`, so a crash leaves either
everything or nothing — and the redelivered message is then processed as if for the first time.

## How it is graded

Happy, declined and compensation paths; crashes at every commit while placing; a relay crash between publishing and
marking; the broker going down; a consumer crashing before commit; and a storm of 20 orders with 50 % duplicate delivery
where every order must end in the right state with exactly the right charges, refunds and shipments.
`;

const INFRASTRUCTURE = `using System.Text.Json;

/// <summary>Thrown by the chaos hooks to simulate the process dying at the worst moment.</summary>
public sealed class SimulatedCrash(string where) : Exception("Simulated crash " + where + ".");

public sealed class BrokerUnavailableException() : Exception("The message broker is unavailable.");

/// <summary>A tiny transactional key-value database. Rows are immutable objects stored under (table, key).
/// Reads inside a transaction see its own uncommitted writes; a transaction commits all of its writes or none.</summary>
public sealed class Database
{
    private Dictionary<(string Table, string Key), object> _rows = [];
    private Dictionary<(string Table, string Key), object>? _pending;

    /// <summary>Chaos: when set to n, the n-th commit from now throws SimulatedCrash instead of committing.</summary>
    public int? CrashAtCommit { get; set; }

    /// <summary>Number of committed rows, across all tables.</summary>
    public int RowCount => _rows.Count;

    public void Transaction(Action work)
    {
        if (_pending is not null) throw new InvalidOperationException("Transactions cannot be nested.");
        _pending = new Dictionary<(string Table, string Key), object>(_rows);
        try
        {
            work();
            if (CrashAtCommit is int n)
            {
                CrashAtCommit = n > 1 ? n - 1 : null;
                if (n == 1) throw new SimulatedCrash("before commit");
            }
            _rows = _pending;
        }
        finally { _pending = null; }
    }

    public T? Get<T>(string table, string key) where T : class => (_pending ?? _rows).GetValueOrDefault((table, key)) as T;

    public List<T> All<T>(string table) where T : class =>
        (_pending ?? _rows).Where(r => r.Key.Table == table).Select(r => r.Value).OfType<T>().ToList();

    public void Put<T>(string table, string key, T row) where T : class => Writable()[(table, key)] = row;

    public void Delete(string table, string key) => Writable().Remove((table, key));

    private Dictionary<(string Table, string Key), object> Writable() =>
        _pending ?? throw new InvalidOperationException("Writes must happen inside db.Transaction(...).");
}

public sealed record Envelope(string MessageId, string Type, string Body);

public static class Messages
{
    /// <summary>Wraps a payload. Type is the payload's class name; MessageId is new unless you pass one.</summary>
    public static Envelope Wrap<T>(T payload, string? messageId = null) where T : notnull =>
        new(messageId ?? Guid.NewGuid().ToString("N"), typeof(T).Name, JsonSerializer.Serialize(payload));

    public static T Read<T>(Envelope message) => JsonSerializer.Deserialize<T>(message.Body)!;
}

/// <summary>An at-least-once broker. Every subscriber of a message type gets its own copy. A handler that throws gets
/// the message again later; after MaxAttempts it is dead-lettered. With DuplicateRate > 0 a successfully handled
/// message is sometimes delivered again, as if the acknowledgement was lost.</summary>
public sealed class MessageBroker(int seed = 1)
{
    private readonly Random _random = new(seed);
    private readonly Dictionary<string, List<(string Consumer, Func<Envelope, Task> Handler)>> _subscribers = [];
    private readonly Queue<(string Consumer, Func<Envelope, Task> Handler, Envelope Message, int Attempt)> _queue = new();

    public List<Envelope> Published { get; } = [];
    public List<(string Consumer, Envelope Message, string Error)> DeadLetters { get; } = [];
    public double DuplicateRate { get; set; }
    public int MaxAttempts { get; set; } = 5;

    /// <summary>Chaos: the next n Publish calls throw BrokerUnavailableException.</summary>
    public int FailNextPublishes { get; set; }

    public void Subscribe(string type, string consumer, Func<Envelope, Task> handler)
    {
        if (!_subscribers.TryGetValue(type, out var list)) _subscribers[type] = list = [];
        list.Add((consumer, handler));
    }

    public void Publish(Envelope message)
    {
        if (FailNextPublishes > 0) { FailNextPublishes--; throw new BrokerUnavailableException(); }
        Published.Add(message);
        foreach (var (consumer, handler) in _subscribers.GetValueOrDefault(message.Type) ?? [])
            _queue.Enqueue((consumer, handler, message, 1));
    }

    /// <summary>Delivers one queued message. Returns false when nothing was waiting.</summary>
    public async Task<bool> DeliverNextAsync()
    {
        if (!_queue.TryDequeue(out var item)) return false;
        try
        {
            await item.Handler(item.Message);
            if (_random.NextDouble() < DuplicateRate) _queue.Enqueue(item);
        }
        catch (Exception e)
        {
            if (item.Attempt >= MaxAttempts) DeadLetters.Add((item.Consumer, item.Message, e.Message));
            else _queue.Enqueue(item with { Attempt = item.Attempt + 1 });
        }
        return true;
    }
}

// ---- Message contracts ----
public sealed record OrderPlaced(Guid OrderId, string Customer, decimal Amount, string Country);
public sealed record PaymentSucceeded(Guid OrderId, string PaymentId);
public sealed record PaymentFailed(Guid OrderId, string Reason);
public sealed record ShipOrder(Guid OrderId, string Country);
public sealed record ShipmentBooked(Guid OrderId, string TrackingCode);
public sealed record ShipmentFailed(Guid OrderId, string Reason);
public sealed record RefundPayment(Guid OrderId);
public sealed record PaymentRefunded(Guid OrderId);
`;

const WORLD = `/// <summary>Wires three services, their databases, their outbox relays and the broker, and runs the system.</summary>
public sealed class World
{
    private readonly OutboxRelay[] _relays;

    public World(int seed = 1)
    {
        Broker = new MessageBroker(seed);
        Orders = new OrderService(OrdersDb);
        Saga = new OrderSaga(OrdersDb);
        Payments = new PaymentService(PaymentsDb);
        Shipping = new ShippingService(ShippingDb);
        _relays = [new OutboxRelay(OrdersDb, Broker), new OutboxRelay(PaymentsDb, Broker), new OutboxRelay(ShippingDb, Broker)];

        Broker.Subscribe(nameof(OrderPlaced), "payments", Payments.HandleAsync);
        Broker.Subscribe(nameof(RefundPayment), "payments", Payments.HandleAsync);
        Broker.Subscribe(nameof(ShipOrder), "shipping", Shipping.HandleAsync);
        foreach (var type in new[] { nameof(PaymentSucceeded), nameof(PaymentFailed), nameof(ShipmentBooked), nameof(ShipmentFailed), nameof(PaymentRefunded) })
            Broker.Subscribe(type, "order-saga", Saga.HandleAsync);
    }

    public Database OrdersDb { get; } = new();
    public Database PaymentsDb { get; } = new();
    public Database ShippingDb { get; } = new();
    public MessageBroker Broker { get; }
    public OrderService Orders { get; }
    public OrderSaga Saga { get; }
    public PaymentService Payments { get; }
    public ShippingService Shipping { get; }

    /// <summary>Alternates relays and deliveries until nothing is left to publish or deliver. A crashed relay or an
    /// unavailable broker counts as activity: the "process" restarts and tries again on the next step.</summary>
    public async Task RunUntilQuietAsync(int maxSteps = 20_000)
    {
        for (int step = 0; step < maxSteps; step++)
        {
            int activity = 0;
            foreach (var relay in _relays)
            {
                try { activity += relay.PublishPending(); }
                catch (Exception e) when (e is SimulatedCrash or BrokerUnavailableException) { activity++; }
            }
            if (await Broker.DeliverNextAsync()) activity++;
            if (activity == 0) return;
        }
        throw new InvalidOperationException("The system never became quiet — is something republishing forever?");
    }
}
`;

const ORDERS_STARTER = `public sealed class OrderService(Database db)
{
    /// <summary>Validates, then stores the order and its OrderPlaced message in one transaction. Returns the new id.</summary>
    public Guid PlaceOrder(string customer, decimal amount, string country) => throw new NotImplementedException();

    /// <summary>The order's status (Pending, Paid, Refunding, Completed, Cancelled) and reason, or null if unknown.</summary>
    public (string Status, string? Reason)? StatusOf(Guid orderId) => throw new NotImplementedException();
}

/// <summary>Orchestrates one order's workflow. Handles PaymentSucceeded, PaymentFailed, ShipmentBooked,
/// ShipmentFailed and PaymentRefunded.</summary>
public sealed class OrderSaga(Database db)
{
    public Task HandleAsync(Envelope message) => throw new NotImplementedException();
}
`;

const ORDERS_SOLUTION = `public sealed record OrderRow(Guid Id, string Customer, decimal Amount, string Country, string Status, string? Reason, string? PaymentId);

public sealed class OrderService(Database db)
{
    /// <summary>Validates, then stores the order and its OrderPlaced message in one transaction. Returns the new id.</summary>
    public Guid PlaceOrder(string customer, decimal amount, string country)
    {
        if (string.IsNullOrWhiteSpace(customer)) throw new ArgumentException("A customer is required.", nameof(customer));
        if (amount <= 0 || decimal.Round(amount, 2) != amount) throw new ArgumentException("The amount must be positive with at most two decimals.", nameof(amount));
        if (country is not { Length: 2 } || !country.All(char.IsAsciiLetterUpper)) throw new ArgumentException("Use a two-letter country code such as GH.", nameof(country));

        var id = Guid.NewGuid();
        db.Transaction(() =>
        {
            db.Put(Tables.Orders, id.ToString(), new OrderRow(id, customer, amount, country, "Pending", null, null));
            Outbox.Add(db, new OrderPlaced(id, customer, amount, country));
        });
        return id;
    }

    /// <summary>The order's status (Pending, Paid, Refunding, Completed, Cancelled) and reason, or null if unknown.</summary>
    public (string Status, string? Reason)? StatusOf(Guid orderId) =>
        db.Get<OrderRow>(Tables.Orders, orderId.ToString()) is { } order ? (order.Status, order.Reason) : null;
}

/// <summary>Orchestrates one order's workflow. Handles PaymentSucceeded, PaymentFailed, ShipmentBooked,
/// ShipmentFailed and PaymentRefunded.</summary>
public sealed class OrderSaga(Database db)
{
    private const string Consumer = "order-saga";

    public Task HandleAsync(Envelope message)
    {
        db.Transaction(() =>
        {
            if (!Inbox.TryRecord(db, Consumer, message)) return;
            switch (message.Type)
            {
                case nameof(PaymentSucceeded):
                    var paid = Messages.Read<PaymentSucceeded>(message);
                    Advance(paid.OrderId, "Pending", order =>
                    {
                        Outbox.Add(db, new ShipOrder(order.Id, order.Country));
                        return order with { Status = "Paid", PaymentId = paid.PaymentId };
                    });
                    break;
                case nameof(PaymentFailed):
                    var declined = Messages.Read<PaymentFailed>(message);
                    Advance(declined.OrderId, "Pending", order => order with { Status = "Cancelled", Reason = declined.Reason });
                    break;
                case nameof(ShipmentBooked):
                    Advance(Messages.Read<ShipmentBooked>(message).OrderId, "Paid", order => order with { Status = "Completed" });
                    break;
                case nameof(ShipmentFailed):
                    var unshippable = Messages.Read<ShipmentFailed>(message);
                    Advance(unshippable.OrderId, "Paid", order =>
                    {
                        Outbox.Add(db, new RefundPayment(order.Id)); // compensate the step that already happened
                        return order with { Status = "Refunding", Reason = unshippable.Reason };
                    });
                    break;
                case nameof(PaymentRefunded):
                    Advance(Messages.Read<PaymentRefunded>(message).OrderId, "Refunding", order => order with { Status = "Cancelled" });
                    break;
            }
        });
        return Task.CompletedTask;
    }

    // State guards make stale and out-of-place messages harmless: only the expected state moves on.
    private void Advance(Guid orderId, string expected, Func<OrderRow, OrderRow> change)
    {
        if (db.Get<OrderRow>(Tables.Orders, orderId.ToString()) is { } order && order.Status == expected)
            db.Put(Tables.Orders, orderId.ToString(), change(order));
    }
}
`;

const OUTBOX_STARTER = `/// <summary>Publishes a database's unsent outbox messages to the broker, oldest first, and marks them sent.</summary>
public sealed class OutboxRelay(Database db, MessageBroker broker)
{
    /// <summary>Returns how many messages were published. Exceptions escape; unmarked messages are retried next run.</summary>
    public int PublishPending() => throw new NotImplementedException();
}
`;

const OUTBOX_SOLUTION = `public static class Tables
{
    public const string Orders = "orders", Payments = "payments", Shipments = "shipments", Outbox = "outbox", Inbox = "inbox";
}

public sealed record OutboxRow(long Sequence, Envelope Message, bool Sent);

public static class Outbox
{
    /// <summary>Call inside a transaction: the message is stored with the business change, or not at all.
    /// Its MessageId is fixed now, so every later publish of it carries the same id.</summary>
    public static void Add<T>(Database db, T payload) where T : notnull
    {
        long next = db.All<OutboxRow>(Tables.Outbox).Select(r => r.Sequence).DefaultIfEmpty(0).Max() + 1;
        db.Put(Tables.Outbox, Key(next), new OutboxRow(next, Messages.Wrap(payload), Sent: false));
    }

    public static string Key(long sequence) => sequence.ToString("D12");
}

public static class Inbox
{
    /// <summary>Call inside the handler's transaction. False means this consumer already processed the message.</summary>
    public static bool TryRecord(Database db, string consumer, Envelope message)
    {
        string key = consumer + ":" + message.MessageId;
        if (db.Get<string>(Tables.Inbox, key) is not null) return false;
        db.Put(Tables.Inbox, key, message.Type);
        return true;
    }
}

/// <summary>Publishes a database's unsent outbox messages to the broker, oldest first, and marks them sent.</summary>
public sealed class OutboxRelay(Database db, MessageBroker broker)
{
    /// <summary>Returns how many messages were published. Exceptions escape; unmarked messages are retried next run.</summary>
    public int PublishPending()
    {
        int published = 0;
        foreach (var row in db.All<OutboxRow>(Tables.Outbox).Where(r => !r.Sent).OrderBy(r => r.Sequence))
        {
            // Publish first, then mark. A crash in between means a duplicate publish (consumers dedupe by MessageId);
            // the other order would risk losing the message for good.
            broker.Publish(row.Message);
            db.Transaction(() => db.Put(Tables.Outbox, Outbox.Key(row.Sequence), row with { Sent = true }));
            published++;
        }
        return published;
    }
}
`;

const PAYMENTS_STARTER = `/// <summary>Handles OrderPlaced (charge) and RefundPayment (refund).</summary>
public sealed class PaymentService(Database db)
{
    public Task HandleAsync(Envelope message) => throw new NotImplementedException();

    /// <summary>"charged <orderId:N> <amount:F2>" and "refunded <orderId:N> <amount:F2>" entries.</summary>
    public IReadOnlyList<string> Ledger() => throw new NotImplementedException();
}
`;

const PAYMENTS_SOLUTION = `public sealed record PaymentRow(Guid OrderId, string PaymentId, decimal Amount, bool Refunded);

/// <summary>Handles OrderPlaced (charge) and RefundPayment (refund).</summary>
public sealed class PaymentService(Database db)
{
    private const string Consumer = "payments";
    private const decimal CardLimit = 1000m;

    public Task HandleAsync(Envelope message)
    {
        db.Transaction(() =>
        {
            if (!Inbox.TryRecord(db, Consumer, message)) return;
            if (message.Type == nameof(OrderPlaced)) Charge(Messages.Read<OrderPlaced>(message));
            else if (message.Type == nameof(RefundPayment)) Refund(Messages.Read<RefundPayment>(message).OrderId);
        });
        return Task.CompletedTask;
    }

    public IReadOnlyList<string> Ledger() =>
        db.All<PaymentRow>(Tables.Payments)
            .SelectMany(p => p.Refunded ? new[] { Entry("charged", p), Entry("refunded", p) } : [Entry("charged", p)])
            .ToList();

    private void Charge(OrderPlaced order)
    {
        // The inbox stops a repeated message; this check stops a repeated *order* arriving in a new message.
        if (db.Get<PaymentRow>(Tables.Payments, order.OrderId.ToString()) is not null) return;
        if (order.Amount > CardLimit)
        {
            Outbox.Add(db, new PaymentFailed(order.OrderId, "Card declined"));
            return;
        }
        string paymentId = "PAY-" + order.OrderId.ToString("N")[..8].ToUpperInvariant();
        db.Put(Tables.Payments, order.OrderId.ToString(), new PaymentRow(order.OrderId, paymentId, order.Amount, Refunded: false));
        Outbox.Add(db, new PaymentSucceeded(order.OrderId, paymentId));
    }

    private void Refund(Guid orderId)
    {
        if (db.Get<PaymentRow>(Tables.Payments, orderId.ToString()) is not { Refunded: false } payment) return;
        db.Put(Tables.Payments, orderId.ToString(), payment with { Refunded = true });
        Outbox.Add(db, new PaymentRefunded(orderId));
    }

    private static string Entry(string kind, PaymentRow p) => $"{kind} {p.OrderId:N} {p.Amount:F2}";
}
`;

const SHIPPING_STARTER = `/// <summary>Handles ShipOrder.</summary>
public sealed class ShippingService(Database db)
{
    public Task HandleAsync(Envelope message) => throw new NotImplementedException();

    /// <summary>One entry per booked shipment: "booked <orderId:N> <trackingCode>".</summary>
    public IReadOnlyList<string> Shipments() => throw new NotImplementedException();
}
`;

const SHIPPING_SOLUTION = `public sealed record ShipmentRow(Guid OrderId, string TrackingCode);

/// <summary>Handles ShipOrder.</summary>
public sealed class ShippingService(Database db)
{
    private const string Consumer = "shipping";
    private static readonly string[] Countries = ["GH", "NG", "KE"];

    public Task HandleAsync(Envelope message)
    {
        db.Transaction(() =>
        {
            if (!Inbox.TryRecord(db, Consumer, message) || message.Type != nameof(ShipOrder)) return;
            var command = Messages.Read<ShipOrder>(message);
            if (db.Get<ShipmentRow>(Tables.Shipments, command.OrderId.ToString()) is not null) return;
            if (!Countries.Contains(command.Country))
            {
                Outbox.Add(db, new ShipmentFailed(command.OrderId, "We do not ship to " + command.Country));
                return;
            }
            string tracking = "TRK-" + command.OrderId.ToString("N")[..8].ToUpperInvariant();
            db.Put(Tables.Shipments, command.OrderId.ToString(), new ShipmentRow(command.OrderId, tracking));
            Outbox.Add(db, new ShipmentBooked(command.OrderId, tracking));
        });
        return Task.CompletedTask;
    }

    public IReadOnlyList<string> Shipments() =>
        db.All<ShipmentRow>(Tables.Shipments).Select(s => $"booked {s.OrderId:N} {s.TrackingCode}").ToList();
}
`;

const PROGRAM = `var world = new World(seed: 3) { Broker = { DuplicateRate = 0.3 } };
var orders = new[]
{
    world.Orders.PlaceOrder("Ama", 120.00m, "GH"),
    world.Orders.PlaceOrder("Kofi", 1500.00m, "GH"),
    world.Orders.PlaceOrder("Esi", 80.00m, "ZA"),
};
await world.RunUntilQuietAsync();

foreach (var id in orders) Console.WriteLine($"{id:N}  {world.Orders.StatusOf(id)}");
Console.WriteLine();
foreach (var entry in world.Payments.Ledger()) Console.WriteLine(entry);
foreach (var entry in world.Shipping.Shipments()) Console.WriteLine(entry);
Console.WriteLine($"{world.Broker.Published.Count} messages published, {world.Broker.DeadLetters.Count} dead-lettered");
`;

const TEST_BODY = `
async Task<World> Quiet(World w) { await w.RunUntilQuietAsync(); return w; }
List<string> Flow(World w, Guid id) => w.Broker.Published.Where(m => m.Body.Contains(id.ToString())).Select(m => m.Type).Distinct().ToList();
int Entries(IEnumerable<string> list, string kind, Guid id) => list.Count(e => e.StartsWith(kind + " " + id.ToString("N") + " "));
int Sent(World w, string type, Guid id) => w.Broker.Published.Where(m => m.Type == type && m.Body.Contains(id.ToString())).Select(m => m.MessageId).Distinct().Count();
string[] Types = ["OrderPlaced", "PaymentSucceeded", "PaymentFailed", "ShipOrder", "ShipmentBooked", "ShipmentFailed", "RefundPayment", "PaymentRefunded"];
string Status(World w, Guid id) => w.Orders.StatusOf(id) is { } s ? s.Status + (s.Reason is null ? "" : " (" + s.Reason + ")") : "unknown";

// ---- The three paths through the saga ----
await CheckAsync("happy path: paid, shipped, completed", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 120.00m, "GH");
    await Quiet(w);
    return (Status(w, id), string.Join(" > ", Flow(w, id)), Entries(w.Payments.Ledger(), "charged", id), w.Shipping.Shipments().Count);
}, ("Completed", "OrderPlaced > PaymentSucceeded > ShipOrder > ShipmentBooked", 1, 1));
await ExpectAsync("ledger format", async () => { var w = new World(); var id = w.Orders.PlaceOrder("Ama", 120m, "GH"); await Quiet(w); return w.Payments.Ledger().SequenceEqual([$"charged {id:N} 120.00"]); }, "expected exactly one entry: charged <orderId:N> 120.00");
await CheckAsync("declined card cancels without shipping", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Kofi", 1000.01m, "GH");
    await Quiet(w);
    return (Status(w, id), w.Payments.Ledger().Count, Flow(w, id).Contains("ShipOrder"));
}, ("Cancelled (Card declined)", 0, false));
await CheckAsync("1000.00 exactly is accepted", async () => { var w = new World(); var id = w.Orders.PlaceOrder("Yaw", 1000.00m, "NG"); await Quiet(w); return Status(w, id); }, "Completed");
await CheckAsync("failed shipment is compensated with a refund", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Esi", 80.00m, "ZA");
    await Quiet(w);
    var ledger = w.Payments.Ledger();
    return (Status(w, id), Entries(ledger, "charged", id), Entries(ledger, "refunded", id), w.Shipping.Shipments().Count);
}, ("Cancelled (We do not ship to ZA)", 1, 1, 0));

// ---- The outbox ----
Expect("invalid orders are rejected and write nothing", () =>
{
    var w = new World();
    bool Rejects(Action a) { try { a(); return false; } catch (ArgumentException) { return true; } }
    return Rejects(() => w.Orders.PlaceOrder(" ", 10m, "GH")) && Rejects(() => w.Orders.PlaceOrder("Ama", 0m, "GH")) && Rejects(() => w.Orders.PlaceOrder("Ama", 1.005m, "GH"))
        && Rejects(() => w.Orders.PlaceOrder("Ama", 10m, "gh")) && Rejects(() => w.Orders.PlaceOrder("Ama", 10m, "GHA")) && w.OrdersDb.RowCount == 0;
}, "blank customer, non-positive or 3-decimal amounts and bad country codes must throw ArgumentException before writing anything");
Expect("placing an order never talks to the broker", () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 50m, "GH");
    return w.Broker.Published.Count == 0 && Status(w, id) == "Pending";
}, "PlaceOrder must only write to the database; the relay publishes later");
await ExpectAsync("a crash at any commit while placing is all or nothing", async () =>
{
    for (int crashAt = 1; crashAt <= 3; crashAt++)
    {
        var w = new World(); w.OrdersDb.CrashAtCommit = crashAt;
        Guid? id = null;
        try { id = w.Orders.PlaceOrder("Ama", 50m, "GH"); } catch (SimulatedCrash) { }
        await Quiet(w);
        if (id is null && (w.OrdersDb.RowCount != 0 || w.Broker.Published.Count != 0)) return false; // a ghost order or event
        if (id is { } placed && Status(w, placed) != "Completed") return false;
    }
    return true;
}, "if PlaceOrder crashes, neither the order nor its event may survive; if it returns, the order must complete");
await CheckAsync("relay crash between publish and mark: duplicate publish, one charge", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 75m, "KE");
    w.OrdersDb.CrashAtCommit = 1;
    await Quiet(w);
    var placed = w.Broker.Published.Where(m => m.Type == "OrderPlaced").ToList();
    return (Status(w, id), placed.Count >= 1, placed.Select(m => m.MessageId).Distinct().Count(), Entries(w.Payments.Ledger(), "charged", id));
}, ("Completed", true, 1, 1));
await CheckAsync("broker outage: nothing lost, nothing doubled", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 75m, "GH");
    w.Broker.FailNextPublishes = 3;
    await Quiet(w);
    return (Status(w, id), w.Broker.Published.Count(m => m.Type == "OrderPlaced"), Entries(w.Payments.Ledger(), "charged", id));
}, ("Completed", 1, 1));
await CheckAsync("messages are published in the order they were written", async () =>
{
    var w = new World();
    var ids = Enumerable.Range(1, 6).Select(i => w.Orders.PlaceOrder("Customer " + i, 10m * i, "GH")).ToList();
    await Quiet(w);
    return w.Broker.Published.Where(m => m.Type == "OrderPlaced").Select(m => Messages.Read<OrderPlaced>(m).OrderId).SequenceEqual(ids);
}, true);
await CheckAsync("a quiet relay republishes nothing", async () =>
{
    var w = new World(); w.Orders.PlaceOrder("Ama", 10m, "GH");
    await Quiet(w);
    int before = w.Broker.Published.Count;
    return (new OutboxRelay(w.OrdersDb, w.Broker).PublishPending(), w.Broker.Published.Count - before);
}, (0, 0));

// ---- Idempotent consumers ----
await CheckAsync("consumer crash before commit: redelivered, charged once", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 75m, "GH");
    w.PaymentsDb.CrashAtCommit = 1;
    await Quiet(w);
    return (Status(w, id), Entries(w.Payments.Ledger(), "charged", id), w.Broker.DeadLetters.Count);
}, ("Completed", 1, 0));
await CheckAsync("the same order in a new message is not charged again", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 75m, "GH");
    await Quiet(w);
    await w.Payments.HandleAsync(Messages.Wrap(new OrderPlaced(id, "Ama", 75m, "GH")));
    await w.Payments.HandleAsync(Messages.Wrap(new RefundPayment(Guid.NewGuid())));
    await Quiet(w);
    return (Entries(w.Payments.Ledger(), "charged", id), w.Payments.Ledger().Count, Sent(w, "PaymentSucceeded", id), Sent(w, "PaymentRefunded", id));
}, (1, 1, 1, 0));
await CheckAsync("stale saga messages change nothing", async () =>
{
    var w = new World(); var id = w.Orders.PlaceOrder("Ama", 75m, "GH");
    await Quiet(w);
    await w.Saga.HandleAsync(Messages.Wrap(new PaymentSucceeded(id, "PAY-LATE")));
    await w.Saga.HandleAsync(Messages.Wrap(new ShipmentFailed(id, "late")));
    await Quiet(w);
    return (Status(w, id), w.Shipping.Shipments().Count, Entries(w.Payments.Ledger(), "refunded", id));
}, ("Completed", 1, 0));

// ---- Chaos ----
await ExpectAsync("storm: 20 orders, 50% duplicate delivery, crashes and an outage", async () =>
{
    var w = new World(seed: 7);
    w.Broker.DuplicateRate = 0.5;
    var orders = Enumerable.Range(0, 20).Select(i => (Amount: i % 5 == 0 ? 1200m : 40m + i, Country: i % 4 == 1 ? "FR" : "GH")).ToList();
    var ids = new List<Guid>();
    foreach (var (amount, country) in orders)
    {
        ids.Add(w.Orders.PlaceOrder("Customer", amount, country));
        if (ids.Count == 7) { w.PaymentsDb.CrashAtCommit = 2; w.ShippingDb.CrashAtCommit = 1; w.Broker.FailNextPublishes = 2; }
        if (ids.Count % 3 == 0) for (int i = 0; i < 5; i++) await w.Broker.DeliverNextAsync();
    }
    await Quiet(w);
    var ledger = w.Payments.Ledger(); var shipments = w.Shipping.Shipments();
    for (int i = 0; i < orders.Count; i++)
    {
        var (amount, country) = orders[i]; var id = ids[i];
        string expected = amount > 1000m ? "Cancelled (Card declined)" : country == "FR" ? "Cancelled (We do not ship to FR)" : "Completed";
        int charges = amount > 1000m ? 0 : 1, refunds = amount <= 1000m && country == "FR" ? 1 : 0, shipped = expected == "Completed" ? 1 : 0;
        if (Status(w, id) != expected || Entries(ledger, "charged", id) != charges || Entries(ledger, "refunded", id) != refunds
            || shipments.Count(s => s.StartsWith("booked " + id.ToString("N"))) != shipped || Types.Any(t => Sent(w, t, id) > 1))
            return false;
    }
    return w.Broker.DeadLetters.Count == 0;
}, "every order must reach its correct final state with exactly the right charges, refunds and shipments, no reply sent twice, and nothing dead-lettered");
`;

const task: ProjectTask = {
  id: 'se-cs-m3-003',
  title: 'Week 11: Event-Driven Order Workflow',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 3 · Software Architecture & Distributed Thinking',
  tags: ['transactional outbox', 'idempotent consumers', 'saga', 'compensation', 'at-least-once delivery'],
  prompt:
    'Three services with separate databases cooperate through an at-least-once broker that duplicates messages, goes down, and lets processes ' +
    'crash mid-operation. Implement order placement with a transactional outbox, an outbox relay, idempotent Payments and Shipping consumers, ' +
    'and an orchestrated saga that completes orders or compensates a failed shipment with a refund. The grader drives every failure mode — ' +
    'crashes at each commit, a relay crash between publish and mark, a broker outage, consumer crashes and a 50% duplicate-delivery storm — ' +
    'and requires every order to end correctly with exactly one charge, refund and shipment where due.',
  hints: [
    'Write a small Outbox.Add(db, payload) used inside every transaction: it stores Messages.Wrap(payload) with an increasing sequence number. The MessageId is fixed when the row is written, so republishing keeps the same id.',
    'OutboxRelay: read unsent rows ordered by sequence; for each, broker.Publish first, then mark it sent in its own transaction. Never mark before publishing — a failed publish would then lose the message.',
    'Every handler: db.Transaction(() => { if the inbox already holds consumer:MessageId, return; record it; do the work; add replies to the outbox; }). A crash rolls the inbox entry back too, so the redelivery is processed normally.',
    'Give the saga state guards: PaymentSucceeded only moves a Pending order, ShipmentBooked only a Paid one, and so on. Payments should also refuse to charge an order that already has a payment row — the inbox stops repeated messages, not repeated orders.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Infrastructure.cs', INFRASTRUCTURE, { editable: false }),
    pf('World.cs', WORLD, { editable: false }),
    pf('Orders.cs', ORDERS_STARTER),
    pf('Outbox.cs', OUTBOX_STARTER),
    pf('Payments.cs', PAYMENTS_STARTER),
    pf('Shipping.cs', SHIPPING_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Infrastructure.cs', INFRASTRUCTURE, { editable: false }),
    pf('World.cs', WORLD, { editable: false }),
    pf('Orders.cs', ORDERS_SOLUTION),
    pf('Outbox.cs', OUTBOX_SOLUTION),
    pf('Payments.cs', PAYMENTS_SOLUTION),
    pf('Shipping.cs', SHIPPING_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Order workflow', kind: 'csharp', entry: 'Program.cs', testCode: csTests(TEST_BODY) }],
};

export default task;
