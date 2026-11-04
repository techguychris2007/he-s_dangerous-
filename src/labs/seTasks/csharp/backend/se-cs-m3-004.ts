import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 12 Assignment: The Payment Failure Challenge

Your \`PaymentService\` sits between a shop and a card gateway that fails in every way real ones do. One rule beats
all others: **never charge a customer twice** — and never tell a customer a payment failed when it may have succeeded.

\`Gateway.cs\` (given) simulates the provider. It can be scripted call by call, or run in seeded chaos mode:

| Behaviour | What really happened | What your code sees |
| --- | --- | --- |
| \`Approve\` / \`Decline\` | charged / not charged | a \`ChargeResult\` |
| \`Unavailable\` | nothing | \`GatewayUnavailableException\` (503) |
| \`TimeoutBeforeCharge\` | nothing | \`TimeoutException\` |
| \`TimeoutAfterCharge\` | **charged** | \`TimeoutException\` — the same thing you saw above |
| \`CrashAfterCharge\` | **charged**, then your process died | \`SimulatedCrash\` escapes; a new \`PaymentService\` starts on the same store |

The gateway honours an **idempotency key for 24 hours** (a repeat returns the first result and charges nothing), and
\`LookupAsync(orderId)\` returns every charge ever made for an order — the source of truth, though it can be unavailable.
\`PaymentStore\` is your durable state: it survives restarts.

## Requirements

1. **PayAsync(orderId, amount)**
   - A known order with a different amount → \`InvalidOperationException\`. A \`Paid\` or \`Declined\` order returns its status
     without calling the gateway.
   - A new order is recorded as \`Pending\` (with a key derived from the order) **before** the gateway is called.
   - A \`Pending\`, \`Unknown\` or \`Failed\` order may already have been charged (a crash, a lost answer): **look it up first**.
     A charge found → \`Paid\`. Lookup unavailable → \`Unknown\` (do not charge).
   - Up to **4 attempts**. A 503 is safe to retry after **200 ms, 400 ms, 800 ms** (\`clock.SleepAsync\`). A **timeout is not a
     failure**: look the order up before anything else — found → \`Paid\`; not found → retry; lookup down → \`Unknown\` and stop.
   - Approved → \`Paid\` with the charge id. Declined → \`Declined\` (never retried). Attempts exhausted → \`Failed\`.
2. **ReconcileAsync()** resolves every \`Pending\` and \`Unknown\` record from \`LookupAsync\`: a charge → \`Paid\`, none →
   \`Failed\`, lookup down → leave it for next time. Returns how many it resolved.
3. **HandleWebhookAsync(body, signature)** returns an HTTP status. The signature is the lower-case hex
   HMAC-SHA256 of the body with the webhook secret — compare it in constant time; a bad one → **401** and no change.
   Each event id is processed **once** (record it in \`ProcessedWebhooks\`). A \`charge.succeeded\` event marks its payment \`Paid\`. A body that cannot be parsed,
   or names an unknown order, is a **poison message**: put the body in \`DeadLetters\` and return 200 so the provider stops
   retrying.
4. **Audit** — every status change appends \`"<orderId>: <from> -> <to>"\` (a new record comes from \`New\`).

## How it is graded

Scripted scenarios for each failure, a restart 25 hours after a crash (when the idempotency key has expired), webhooks
that are duplicated, forged or malformed, and a 100-order chaos run where every order must end \`Paid\`, \`Declined\` or
\`Failed\` with the gateway's ledger agreeing exactly.
`;

const GATEWAY = `using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public enum GatewayBehaviour { Approve, Decline, Unavailable, TimeoutBeforeCharge, TimeoutAfterCharge, CrashAfterCharge }

public sealed record ChargeResult(bool Approved, string? ChargeId, string? DeclineReason);
public sealed record ChargeRecord(string ChargeId, string OrderId, decimal Amount);

public sealed class GatewayUnavailableException() : Exception("503 Service Unavailable");

/// <summary>Your process died. Whatever was in memory is gone; the PaymentStore survives.</summary>
public sealed class SimulatedCrash() : Exception("The payment service process crashed.");

public interface IPaymentGateway
{
    /// <summary>Charges the card. For 24 hours a repeat with the same key returns the first result and charges nothing.</summary>
    Task<ChargeResult> ChargeAsync(string idempotencyKey, string orderId, decimal amount);

    /// <summary>Every charge ever made for the order, whatever key was used. Can throw GatewayUnavailableException.</summary>
    Task<IReadOnlyList<ChargeRecord>> LookupAsync(string orderId);
}

/// <summary>Virtual time: sleeping advances the clock instantly and is recorded.</summary>
public sealed class VirtualClock(DateTimeOffset start) : TimeProvider
{
    public DateTimeOffset Now { get; private set; } = start;
    public List<TimeSpan> Sleeps { get; } = [];
    public override DateTimeOffset GetUtcNow() => Now;
    public Task SleepAsync(TimeSpan duration) { Sleeps.Add(duration); Now += duration; return Task.CompletedTask; }
    public void Advance(TimeSpan duration) => Now += duration;
}

public sealed class FakeGateway(VirtualClock clock, string webhookSecret, int? chaosSeed = null) : IPaymentGateway
{
    private static readonly TimeSpan KeyLifetime = TimeSpan.FromHours(24);
    private readonly Queue<GatewayBehaviour> _script = new();
    private readonly Random? _chaos = chaosSeed is int seed ? new Random(seed) : null;
    private readonly Dictionary<string, (DateTimeOffset At, string OrderId, decimal Amount, ChargeResult Result)> _keys = [];

    public List<ChargeRecord> Charges { get; } = [];
    public List<(string Body, string Signature)> Webhooks { get; } = [];
    public int ChargeCalls { get; private set; }

    /// <summary>The next n lookups throw GatewayUnavailableException.</summary>
    public int LookupFailures { get; set; }

    /// <summary>Queue the behaviour of the next charge calls. With no script and no chaos, charges are approved.</summary>
    public void Script(params GatewayBehaviour[] behaviours) { foreach (var b in behaviours) _script.Enqueue(b); }

    public string Sign(string body) => Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(webhookSecret), Encoding.UTF8.GetBytes(body)));

    public Task<ChargeResult> ChargeAsync(string idempotencyKey, string orderId, decimal amount)
    {
        ChargeCalls++;
        if (_keys.TryGetValue(idempotencyKey, out var seen) && clock.Now - seen.At < KeyLifetime)
        {
            if (seen.OrderId != orderId || seen.Amount != amount) throw new InvalidOperationException("Idempotency key reused with different parameters.");
            return Task.FromResult(seen.Result);
        }

        var behaviour = Next(amount);
        if (behaviour == GatewayBehaviour.Unavailable) throw new GatewayUnavailableException();
        if (behaviour == GatewayBehaviour.TimeoutBeforeCharge) throw new TimeoutException("The gateway did not answer in time.");
        if (behaviour == GatewayBehaviour.Decline) return Task.FromResult(Remember(idempotencyKey, orderId, amount, new ChargeResult(false, null, "Card declined")));

        var charge = new ChargeRecord("ch_" + (Charges.Count + 1).ToString("D4"), orderId, amount);
        Charges.Add(charge);
        var result = Remember(idempotencyKey, orderId, amount, new ChargeResult(true, charge.ChargeId, null));
        string body = JsonSerializer.Serialize(new { id = "evt_" + charge.ChargeId, type = "charge.succeeded", orderId, chargeId = charge.ChargeId, amount });
        Webhooks.Add((body, Sign(body)));

        if (behaviour == GatewayBehaviour.TimeoutAfterCharge) throw new TimeoutException("The gateway did not answer in time.");
        if (behaviour == GatewayBehaviour.CrashAfterCharge) throw new SimulatedCrash();
        return Task.FromResult(result);
    }

    public Task<IReadOnlyList<ChargeRecord>> LookupAsync(string orderId)
    {
        if (LookupFailures > 0) { LookupFailures--; throw new GatewayUnavailableException(); }
        if (_chaos is not null && _chaos.NextDouble() < 0.2) throw new GatewayUnavailableException();
        return Task.FromResult<IReadOnlyList<ChargeRecord>>(Charges.Where(c => c.OrderId == orderId).ToList());
    }

    private ChargeResult Remember(string key, string orderId, decimal amount, ChargeResult result)
    {
        _keys[key] = (clock.Now, orderId, amount, result);
        return result;
    }

    private GatewayBehaviour Next(decimal amount)
    {
        if (_script.TryDequeue(out var scripted)) return scripted;
        if (_chaos is null) return GatewayBehaviour.Approve;
        if (amount > 900m) return GatewayBehaviour.Decline;
        double roll = _chaos.NextDouble();
        return roll switch
        {
            < 0.15 => GatewayBehaviour.Unavailable,
            < 0.25 => GatewayBehaviour.TimeoutBeforeCharge,
            < 0.35 => GatewayBehaviour.TimeoutAfterCharge,
            < 0.40 => GatewayBehaviour.CrashAfterCharge,
            _ => GatewayBehaviour.Approve,
        };
    }
}
`;

const STORE = `/// <summary>Durable state. It survives a SimulatedCrash: a restarted PaymentService gets the same instance.</summary>
public sealed record PaymentRecord(string OrderId, decimal Amount, string IdempotencyKey, string Status, string? ChargeId);

public sealed class PaymentStore
{
    public Dictionary<string, PaymentRecord> Records { get; } = [];
    public HashSet<string> ProcessedWebhooks { get; } = [];
    public List<string> DeadLetters { get; } = [];
    public List<string> Audit { get; } = [];
}
`;

const SERVICE_STARTER = `public sealed class PaymentService(IPaymentGateway gateway, PaymentStore store, VirtualClock clock, string webhookSecret)
{
    /// <summary>Returns the payment's status: Paid, Declined, Failed or Unknown.</summary>
    public Task<string> PayAsync(string orderId, decimal amount) => throw new NotImplementedException();

    /// <summary>Resolves Pending and Unknown payments from the gateway's lookup. Returns how many were resolved.</summary>
    public Task<int> ReconcileAsync() => throw new NotImplementedException();

    /// <summary>Returns the HTTP status to answer the provider with.</summary>
    public Task<int> HandleWebhookAsync(string body, string signature) => throw new NotImplementedException();
}
`;

const SERVICE_SOLUTION = `using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

public sealed class PaymentService(IPaymentGateway gateway, PaymentStore store, VirtualClock clock, string webhookSecret)
{
    private const int MaxAttempts = 4;
    private static readonly TimeSpan FirstBackoff = TimeSpan.FromMilliseconds(200);

    /// <summary>Returns the payment's status: Paid, Declined, Failed or Unknown.</summary>
    public async Task<string> PayAsync(string orderId, decimal amount)
    {
        if (store.Records.TryGetValue(orderId, out var existing))
        {
            if (existing.Amount != amount) throw new InvalidOperationException($"Order {orderId} was submitted for {existing.Amount:F2}, not {amount:F2}.");
            if (existing.Status is "Paid" or "Declined") return existing.Status;

            // An earlier attempt may have charged the card before its answer was lost (timeout, crash). Ask first:
            // the idempotency key alone is not enough, because it expires after 24 hours.
            var charges = await TryLookupAsync(orderId);
            if (charges is null) return Set(orderId, "Unknown");
            if (charges.Count > 0) return Set(orderId, "Paid", charges[0].ChargeId);
            Set(orderId, "Pending");
        }
        else
        {
            // Write down the intent before touching the gateway, so a crash leaves something to reconcile.
            store.Records[orderId] = new PaymentRecord(orderId, amount, "pay-" + orderId, "New", null);
            Set(orderId, "Pending");
        }
        return await ChargeWithRetriesAsync(store.Records[orderId]);
    }

    /// <summary>Resolves Pending and Unknown payments from the gateway's lookup. Returns how many were resolved.</summary>
    public async Task<int> ReconcileAsync()
    {
        int resolved = 0;
        foreach (var record in store.Records.Values.Where(r => r.Status is "Pending" or "Unknown").ToList())
        {
            var charges = await TryLookupAsync(record.OrderId);
            if (charges is null) continue; // still unknown: try again on the next run
            Set(record.OrderId, charges.Count > 0 ? "Paid" : "Failed", charges.FirstOrDefault()?.ChargeId);
            resolved++;
        }
        return resolved;
    }

    /// <summary>Returns the HTTP status to answer the provider with.</summary>
    public Task<int> HandleWebhookAsync(string body, string signature)
    {
        if (!SignatureIsValid(body, signature)) return Task.FromResult(401);

        string? eventId, type, orderId, chargeId;
        try
        {
            using var json = JsonDocument.Parse(body);
            var root = json.RootElement;
            eventId = root.GetProperty("id").GetString();
            type = root.GetProperty("type").GetString();
            orderId = root.GetProperty("orderId").GetString();
            chargeId = root.GetProperty("chargeId").GetString();
        }
        catch (Exception e) when (e is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            return DeadLetter(body);
        }

        if (eventId is null || orderId is null) return DeadLetter(body);
        if (!store.ProcessedWebhooks.Add(eventId)) return Task.FromResult(200); // already handled
        if (type != "charge.succeeded") return Task.FromResult(200);
        if (!store.Records.TryGetValue(orderId, out var record)) return DeadLetter(body);
        if (record.Status != "Paid") Set(orderId, "Paid", chargeId);
        return Task.FromResult(200);
    }

    private async Task<string> ChargeWithRetriesAsync(PaymentRecord record)
    {
        for (int attempt = 1; ; attempt++)
        {
            try
            {
                var result = await gateway.ChargeAsync(record.IdempotencyKey, record.OrderId, record.Amount);
                return result.Approved ? Set(record.OrderId, "Paid", result.ChargeId) : Set(record.OrderId, "Declined");
            }
            catch (GatewayUnavailableException)
            {
                // Nothing happened at the gateway, so another attempt is safe.
            }
            catch (TimeoutException)
            {
                // A timeout is not a failure: the charge may have gone through. Find out before doing anything else.
                var charges = await TryLookupAsync(record.OrderId);
                if (charges is null) return Set(record.OrderId, "Unknown");
                if (charges.Count > 0) return Set(record.OrderId, "Paid", charges[0].ChargeId);
            }
            if (attempt == MaxAttempts) return Set(record.OrderId, "Failed");
            await clock.SleepAsync(FirstBackoff * Math.Pow(2, attempt - 1));
        }
    }

    private async Task<IReadOnlyList<ChargeRecord>?> TryLookupAsync(string orderId)
    {
        try { return await gateway.LookupAsync(orderId); }
        catch (GatewayUnavailableException) { return null; }
    }

    private string Set(string orderId, string status, string? chargeId = null)
    {
        var record = store.Records[orderId];
        if (record.Status != status)
        {
            store.Audit.Add($"{orderId}: {record.Status} -> {status}");
            store.Records[orderId] = record with { Status = status, ChargeId = chargeId ?? record.ChargeId };
        }
        return status;
    }

    private bool SignatureIsValid(string body, string signature)
    {
        string expected = Convert.ToHexStringLower(HMACSHA256.HashData(Encoding.UTF8.GetBytes(webhookSecret), Encoding.UTF8.GetBytes(body)));
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(signature ?? ""));
    }

    private Task<int> DeadLetter(string body)
    {
        store.DeadLetters.Add(body);
        return Task.FromResult(200);
    }
}
`;

const PROGRAM = `const string Secret = "whsec_demo";
var clock = new VirtualClock(new DateTimeOffset(2026, 11, 3, 9, 0, 0, TimeSpan.Zero));
var gateway = new FakeGateway(clock, Secret);
var store = new PaymentStore();
var payments = new PaymentService(gateway, store, clock, Secret);

gateway.Script(GatewayBehaviour.Unavailable, GatewayBehaviour.Unavailable, GatewayBehaviour.Approve);
Console.WriteLine($"order-1: {await payments.PayAsync("order-1", 120m)} after sleeping {string.Join(", ", clock.Sleeps.Select(s => s.TotalMilliseconds + " ms"))}");

gateway.Script(GatewayBehaviour.TimeoutAfterCharge);
Console.WriteLine($"order-2: {await payments.PayAsync("order-2", 80m)} (the timeout hid a successful charge)");

gateway.Script(GatewayBehaviour.CrashAfterCharge);
try { await payments.PayAsync("order-3", 45m); } catch (SimulatedCrash e) { Console.WriteLine("order-3: " + e.Message); }
clock.Advance(TimeSpan.FromHours(25));
payments = new PaymentService(gateway, store, clock, Secret);
Console.WriteLine($"order-3 after restart: {await payments.PayAsync("order-3", 45m)}");

Console.WriteLine($"Gateway charges: {gateway.Charges.Count}");
foreach (var line in store.Audit) Console.WriteLine(line);
`;

const TESTS = csTests(`
const string Secret = "whsec_test_8f2a";
var t0 = new DateTimeOffset(2026, 11, 3, 9, 0, 0, TimeSpan.Zero);
(PaymentService Service, FakeGateway Gateway, PaymentStore Store, VirtualClock Clock) Setup(params GatewayBehaviour[] script)
{
    var clock = new VirtualClock(t0); var gateway = new FakeGateway(clock, Secret); var store = new PaymentStore();
    gateway.Script(script);
    return (new PaymentService(gateway, store, clock, Secret), gateway, store, clock);
}
int ChargesFor(FakeGateway g, string orderId) => g.Charges.Count(c => c.OrderId == orderId);
string Ms(VirtualClock c) => string.Join(",", c.Sleeps.Select(s => s.TotalMilliseconds));

// ---- The normal paths ----
await CheckAsync("approved", async () =>
{
    var s = Setup();
    var status = await s.Service.PayAsync("o-1", 120m);
    return (status, s.Store.Records["o-1"].ChargeId, string.Join(" | ", s.Store.Audit));
}, ("Paid", "ch_0001", "o-1: New -> Pending | o-1: Pending -> Paid"));
await CheckAsync("declined is never retried", async () =>
{
    var s = Setup(GatewayBehaviour.Decline);
    return (await s.Service.PayAsync("o-1", 120m), s.Gateway.ChargeCalls, s.Clock.Sleeps.Count);
}, ("Declined", 1, 0));
await CheckAsync("a paid order is not charged again", async () =>
{
    var s = Setup();
    await s.Service.PayAsync("o-1", 120m);
    return (await s.Service.PayAsync("o-1", 120m), s.Gateway.ChargeCalls, s.Gateway.Charges.Count);
}, ("Paid", 1, 1));
await ThrowsAsync<InvalidOperationException>("same order, different amount", async () => { var s = Setup(); await s.Service.PayAsync("o-1", 120m); await s.Service.PayAsync("o-1", 99m); });
await CheckAsync("the intent is recorded before the gateway is called", async () =>
{
    var s = Setup(GatewayBehaviour.CrashAfterCharge);
    try { await s.Service.PayAsync("o-1", 50m); } catch (SimulatedCrash) { }
    return s.Store.Records.TryGetValue("o-1", out var r) ? r.Status : "no record";
}, "Pending");

// ---- Retries ----
await CheckAsync("503s are retried with exponential backoff", async () =>
{
    var s = Setup(GatewayBehaviour.Unavailable, GatewayBehaviour.Unavailable, GatewayBehaviour.Unavailable);
    return (await s.Service.PayAsync("o-1", 120m), Ms(s.Clock), s.Gateway.Charges.Count);
}, ("Paid", "200,400,800", 1));
await CheckAsync("four 503s: failed, not charged", async () =>
{
    var s = Setup(GatewayBehaviour.Unavailable, GatewayBehaviour.Unavailable, GatewayBehaviour.Unavailable, GatewayBehaviour.Unavailable);
    return (await s.Service.PayAsync("o-1", 120m), s.Gateway.ChargeCalls, Ms(s.Clock), s.Gateway.Charges.Count);
}, ("Failed", 4, "200,400,800", 0));

// ---- A timeout is not a failure ----
await CheckAsync("timeout after the charge: paid exactly once", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutAfterCharge);
    return (await s.Service.PayAsync("o-1", 120m), ChargesFor(s.Gateway, "o-1"), s.Store.Records["o-1"].ChargeId);
}, ("Paid", 1, "ch_0001"));
await CheckAsync("timeout before the charge: retried and paid", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutBeforeCharge);
    return (await s.Service.PayAsync("o-1", 120m), ChargesFor(s.Gateway, "o-1"));
}, ("Paid", 1));
await CheckAsync("timeout and lookup down: unknown, then reconciled to paid", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutAfterCharge);
    s.Gateway.LookupFailures = 1;
    var first = await s.Service.PayAsync("o-1", 120m);
    int callsBefore = s.Gateway.ChargeCalls;
    var resolved = await s.Service.ReconcileAsync();
    return (first, callsBefore, resolved, s.Store.Records["o-1"].Status, s.Store.Records["o-1"].ChargeId, ChargesFor(s.Gateway, "o-1"));
}, ("Unknown", 1, 1, "Paid", "ch_0001", 1));
await CheckAsync("unknown that never charged: reconciled to failed, then a retry pays once", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutBeforeCharge);
    s.Gateway.LookupFailures = 1;
    var first = await s.Service.PayAsync("o-1", 120m);
    await s.Service.ReconcileAsync();
    var reconciled = s.Store.Records["o-1"].Status;
    return (first, reconciled, await s.Service.PayAsync("o-1", 120m), ChargesFor(s.Gateway, "o-1"));
}, ("Unknown", "Failed", "Paid", 1));
await CheckAsync("reconcile leaves a record alone while lookups are down", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutAfterCharge);
    s.Gateway.LookupFailures = 2;
    await s.Service.PayAsync("o-1", 120m);
    return (await s.Service.ReconcileAsync(), s.Store.Records["o-1"].Status);
}, (0, "Unknown"));

// ---- Crashes ----
await CheckAsync("crash after charging, restart 25 hours later: never charged twice", async () =>
{
    var s = Setup(GatewayBehaviour.CrashAfterCharge);
    try { await s.Service.PayAsync("o-1", 50m); } catch (SimulatedCrash) { }
    s.Clock.Advance(TimeSpan.FromHours(25)); // the idempotency key has expired
    var restarted = new PaymentService(s.Gateway, s.Store, s.Clock, Secret);
    return (await restarted.PayAsync("o-1", 50m), ChargesFor(s.Gateway, "o-1"), s.Store.Records["o-1"].ChargeId);
}, ("Paid", 1, "ch_0001"));
await CheckAsync("crash before charging is resumed safely", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutBeforeCharge);
    s.Gateway.LookupFailures = 1;
    await s.Service.PayAsync("o-1", 50m);
    var restarted = new PaymentService(s.Gateway, s.Store, s.Clock, Secret);
    return (await restarted.PayAsync("o-1", 50m), ChargesFor(s.Gateway, "o-1"));
}, ("Paid", 1));

// ---- Webhooks ----
await CheckAsync("a webhook resolves an unknown payment", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutAfterCharge);
    s.Gateway.LookupFailures = 1;
    await s.Service.PayAsync("o-1", 120m);
    var (body, signature) = s.Gateway.Webhooks.Single();
    return (await s.Service.HandleWebhookAsync(body, signature), s.Store.Records["o-1"].Status, s.Store.Records["o-1"].ChargeId);
}, (200, "Paid", "ch_0001"));
await CheckAsync("forged and tampered webhooks are refused", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutAfterCharge);
    s.Gateway.LookupFailures = 1;
    await s.Service.PayAsync("o-1", 120m);
    var (body, signature) = s.Gateway.Webhooks.Single();
    int forged = await s.Service.HandleWebhookAsync(body, new string('0', 64));
    int tampered = await s.Service.HandleWebhookAsync(body.Replace("120", "1"), signature);
    return (forged, tampered, s.Store.Records["o-1"].Status);
}, (401, 401, "Unknown"));
await CheckAsync("duplicate webhooks are processed once", async () =>
{
    var s = Setup(GatewayBehaviour.TimeoutAfterCharge);
    s.Gateway.LookupFailures = 1;
    await s.Service.PayAsync("o-1", 120m);
    var (body, signature) = s.Gateway.Webhooks.Single();
    await s.Service.HandleWebhookAsync(body, signature);
    int auditBefore = s.Store.Audit.Count;
    return (await s.Service.HandleWebhookAsync(body, signature), s.Store.Audit.Count - auditBefore, string.Join(",", s.Store.ProcessedWebhooks));
}, (200, 0, "evt_ch_0001"));
await CheckAsync("poison webhooks are dead-lettered", async () =>
{
    var s = Setup();
    string garbage = "{\\"id\\": \\"evt_x\\", \\"type\\": ";
    string orphan = "{\\"id\\":\\"evt_y\\",\\"type\\":\\"charge.succeeded\\",\\"orderId\\":\\"nobody\\",\\"chargeId\\":\\"ch_9999\\",\\"amount\\":5}";
    var codes = (await s.Service.HandleWebhookAsync(garbage, s.Gateway.Sign(garbage)), await s.Service.HandleWebhookAsync(orphan, s.Gateway.Sign(orphan)));
    return (codes, string.Join(" || ", s.Store.DeadLetters) == garbage + " || " + orphan);
}, ((200, 200), true));

// ---- Chaos ----
await ExpectAsync("chaos: 100 orders, every failure mode, nobody charged twice", async () =>
{
    var clock = new VirtualClock(t0); var gateway = new FakeGateway(clock, Secret, chaosSeed: 42); var store = new PaymentStore();
    PaymentService Boot() => new(gateway, store, clock, Secret);
    var service = Boot();
    var amounts = Enumerable.Range(1, 100).ToDictionary(i => "order-" + i, i => i % 10 == 0 ? 950m : 10m + i);
    foreach (var (orderId, amount) in amounts)
        for (int tries = 0; tries < 3; tries++)
        {
            try { await service.PayAsync(orderId, amount); break; }
            catch (SimulatedCrash) { service = Boot(); clock.Advance(TimeSpan.FromHours(13)); }
        }
    var random = new Random(5);
    foreach (var (body, signature) in gateway.Webhooks.Concat(gateway.Webhooks).OrderBy(_ => random.Next()).ToList())
        await service.HandleWebhookAsync(body, signature);
    for (int run = 0; run < 25 && store.Records.Values.Any(r => r.Status is "Pending" or "Unknown"); run++)
    {
        clock.Advance(TimeSpan.FromHours(1));
        await service.ReconcileAsync();
    }
    foreach (var (orderId, amount) in amounts)
    {
        if (!store.Records.TryGetValue(orderId, out var record)) return false;
        var charges = gateway.Charges.Where(c => c.OrderId == orderId).ToList();
        bool consistent = record.Status switch
        {
            "Paid" => charges.Count == 1 && charges[0].ChargeId == record.ChargeId && charges[0].Amount == amount,
            "Declined" or "Failed" => charges.Count == 0,
            _ => false,
        };
        if (!consistent) return false;
    }
    return store.Records.Values.Count(r => r.Status == "Declined") == 10 && store.DeadLetters.Count == 0;
}, "every order must end Paid (with exactly one matching charge), Declined or Failed (with none); the 950.00 orders are declined");
`);

const task: ProjectTask = {
  id: 'se-cs-m3-004',
  title: 'Week 12: The Payment Failure Challenge',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 3 · Software Architecture & Distributed Thinking',
  tags: ['idempotency keys', 'retries', 'timeouts', 'reconciliation', 'webhooks', 'dead letters'],
  prompt:
    'Build a payment service in front of a card gateway that returns 503s, times out before and after charging, lets your process crash ' +
    'after a successful charge, and sends duplicated, forged and malformed webhooks. Record intent before calling out, retry only what is ' +
    'safe with exponential backoff, treat timeouts as unknown and resolve them with the gateway\'s lookup, reconcile what is left, verify ' +
    'webhook signatures in constant time, process each event once and dead-letter poison messages, and audit every status change. The ' +
    'grader scripts each failure, restarts your service 25 hours after a crash, and runs 100 orders through seeded chaos: nobody may be ' +
    'charged twice and every order must end in a state the gateway\'s ledger agrees with.',
  hints: [
    'Keep one Set(orderId, status, chargeId) helper that updates the record and writes the audit line only when the status actually changes; every path goes through it.',
    'Create the Pending record (key "pay-" + orderId) before the first gateway call. If PayAsync finds a Pending, Unknown or Failed record, call LookupAsync before charging — the key expires after 24 hours, the lookup does not.',
    'In the retry loop: GatewayUnavailableException → sleep 200 ms × 2^(attempt-1) and retry; TimeoutException → lookup immediately (charge found → Paid, none → retry, lookup unavailable → Unknown and stop).',
    'Webhook: compute the expected HMAC hex and compare UTF-8 bytes with CryptographicOperations.FixedTimeEquals; parse with JsonDocument inside try/catch (a parse failure is a poison message); then use ProcessedWebhooks.Add(eventId) — it returns false for an event you have already seen.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Gateway.cs', GATEWAY, { editable: false }),
    pf('PaymentStore.cs', STORE, { editable: false }),
    pf('PaymentService.cs', SERVICE_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Gateway.cs', GATEWAY, { editable: false }),
    pf('PaymentStore.cs', STORE, { editable: false }),
    pf('PaymentService.cs', SERVICE_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Payment service', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
