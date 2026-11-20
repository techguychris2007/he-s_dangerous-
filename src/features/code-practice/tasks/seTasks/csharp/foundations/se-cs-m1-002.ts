import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 2 Assignment: Order Processing Engine

Orders arrive, stock is reserved, discounts and tax are applied, and payment is taken from a provider
that is sometimes slow and sometimes fails. The engine must stay correct through all of it: never
charge twice, never leave stock reserved for an order that failed, and never let an order reach a
state the rules do not allow.

## Given

| File | Purpose |
| --- | --- |
| \`Models.cs\` | \`Product\`, \`OrderLine\`, \`Order\`, \`OrderStatus\`, \`PlaceResult\` |
| \`Ports.cs\` | \`IInventory\`, \`IPaymentGateway\`, \`PaymentResult\` — the outside world |
| \`Discounts.cs\` | \`IDiscountRule\` plus \`BulkDiscount\` and \`LoyaltyDiscount\` |
| \`Program.cs\` | a demo with in-memory fakes (press **Run**) |

## Implement \`OrderProcessor.cs\`

**PlaceOrderAsync(customerId, lines, ct)**
1. Reject (\`PlaceResult.Rejected\`) empty orders, quantities below 1 and SKUs not in the catalogue.
2. Subtotal = Σ quantity × unit price. Discount = sum of every rule's discount, **capped at 30% of the
   subtotal**. Tax = **15%** of (subtotal − discount). Total = subtotal − discount + tax.
   Round discount, tax and total to 2 places (away from zero).
3. Reserve stock for every line **concurrently**. If any reservation fails, release every reservation
   that succeeded and reject the order ("Out of stock: <sku>").
4. Otherwise store the order with status \`Placed\` and a new id (1, 2, 3 …).

**PayAsync(orderId, ct)** — only from \`Placed\` (else \`InvalidOperationException\`).
Call the gateway with idempotency key \`"order-<id>"\`, giving each attempt **500 ms**; make up to **3
attempts** on failure or timeout. Success → \`Paid\`. Failure after all attempts → \`PaymentFailed\` and
release the stock. Cancellation of the caller's token propagates and changes nothing.

**Cancel(orderId)** — allowed from \`Placed\` and \`PaymentFailed\` only; releases stock if still held.
`;

const MODELS = `public record Product(string Sku, string Name, decimal UnitPrice);

public record OrderLine(string Sku, int Quantity);

public enum OrderStatus { Placed, Paid, PaymentFailed, Cancelled }

public sealed class Order(int id, string customerId, IReadOnlyList<OrderLine> lines,
    decimal subtotal, decimal discount, decimal tax, decimal total)
{
    public int Id { get; } = id;
    public string CustomerId { get; } = customerId;
    public IReadOnlyList<OrderLine> Lines { get; } = lines;
    public decimal Subtotal { get; } = subtotal;
    public decimal Discount { get; } = discount;
    public decimal Tax { get; } = tax;
    public decimal Total { get; } = total;
    public OrderStatus Status { get; internal set; } = OrderStatus.Placed;
    public bool StockReleased { get; internal set; }
}

public abstract record PlaceResult
{
    public sealed record Accepted(Order Order) : PlaceResult;
    public sealed record Rejected(string Reason) : PlaceResult;
}
`;

const PORTS = `public interface IInventory
{
    Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct);
    Task ReleaseAsync(string sku, int quantity, CancellationToken ct);
}

public sealed record PaymentResult(bool Approved, string Reference);

public interface IPaymentGateway
{
    /// <summary>Charging twice with the same idempotency key must not take money twice.</summary>
    Task<PaymentResult> ChargeAsync(string idempotencyKey, decimal amount, CancellationToken ct);
}
`;

const DISCOUNTS = `public sealed record DiscountContext(string CustomerId, IReadOnlyList<OrderLine> Lines,
    IReadOnlyDictionary<string, Product> Catalogue, decimal Subtotal);

public interface IDiscountRule
{
    decimal DiscountFor(DiscountContext context);
}

/// <summary>10% off any line with 10 or more units.</summary>
public sealed class BulkDiscount : IDiscountRule
{
    public decimal DiscountFor(DiscountContext c) =>
        c.Lines.Where(l => l.Quantity >= 10).Sum(l => l.Quantity * c.Catalogue[l.Sku].UnitPrice * 0.10m);
}

/// <summary>A fixed 5.00 off for loyal customers.</summary>
public sealed class LoyaltyDiscount(IReadOnlySet<string> loyalCustomers) : IDiscountRule
{
    public decimal DiscountFor(DiscountContext c) => loyalCustomers.Contains(c.CustomerId) ? 5.00m : 0m;
}
`;

const PROGRAM = `var catalogue = new[] { new Product("PEN", "Pen", 2.50m), new Product("BOOK", "Notebook", 12.00m) };
var processor = new OrderProcessor(catalogue, new DemoInventory(), new DemoGateway(),
    [new BulkDiscount(), new LoyaltyDiscount(new HashSet<string> { "ama" })]);

var placed = await processor.PlaceOrderAsync("ama", [new("PEN", 10), new("BOOK", 2)], CancellationToken.None);
if (placed is PlaceResult.Accepted ok)
{
    Console.WriteLine($"Order {ok.Order.Id}: subtotal {ok.Order.Subtotal}, discount {ok.Order.Discount}, tax {ok.Order.Tax}, total {ok.Order.Total}");
    await processor.PayAsync(ok.Order.Id, CancellationToken.None);
    Console.WriteLine($"Status: {processor.Find(ok.Order.Id)!.Status}");
}

sealed class DemoInventory : IInventory
{
    public Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct) => Task.FromResult(true);
    public Task ReleaseAsync(string sku, int quantity, CancellationToken ct) => Task.CompletedTask;
}

sealed class DemoGateway : IPaymentGateway
{
    public Task<PaymentResult> ChargeAsync(string key, decimal amount, CancellationToken ct) =>
        Task.FromResult(new PaymentResult(true, "demo-" + key));
}
`;

const PROCESSOR_STARTER = `public sealed class OrderProcessor(
    IEnumerable<Product> catalogue,
    IInventory inventory,
    IPaymentGateway gateway,
    IReadOnlyList<IDiscountRule> discountRules)
{
    public const decimal TaxRate = 0.15m;
    public const decimal MaxDiscountShare = 0.30m;
    public const int PaymentAttempts = 3;
    public static readonly TimeSpan PaymentAttemptTimeout = TimeSpan.FromMilliseconds(500);

    public Task<PlaceResult> PlaceOrderAsync(string customerId, IReadOnlyList<OrderLine> lines, CancellationToken ct) =>
        throw new NotImplementedException();

    public Task PayAsync(int orderId, CancellationToken ct) => throw new NotImplementedException();

    public Task CancelAsync(int orderId, CancellationToken ct) => throw new NotImplementedException();

    public Order? Find(int orderId) => throw new NotImplementedException();
}
`;

const PROCESSOR_SOLUTION = `public sealed class OrderProcessor(
    IEnumerable<Product> catalogue,
    IInventory inventory,
    IPaymentGateway gateway,
    IReadOnlyList<IDiscountRule> discountRules)
{
    public const decimal TaxRate = 0.15m;
    public const decimal MaxDiscountShare = 0.30m;
    public const int PaymentAttempts = 3;
    public static readonly TimeSpan PaymentAttemptTimeout = TimeSpan.FromMilliseconds(500);

    private readonly Dictionary<string, Product> _catalogue = catalogue.ToDictionary(p => p.Sku, StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<int, Order> _orders = [];
    private int _nextId = 1;

    public async Task<PlaceResult> PlaceOrderAsync(string customerId, IReadOnlyList<OrderLine> lines, CancellationToken ct)
    {
        if (lines.Count == 0) return new PlaceResult.Rejected("An order needs at least one line.");
        foreach (var line in lines)
        {
            if (line.Quantity < 1) return new PlaceResult.Rejected($"Quantity for {line.Sku} must be at least 1.");
            if (!_catalogue.ContainsKey(line.Sku)) return new PlaceResult.Rejected($"Unknown product {line.Sku}.");
        }

        decimal subtotal = lines.Sum(l => l.Quantity * _catalogue[l.Sku].UnitPrice);
        var context = new DiscountContext(customerId, lines, _catalogue, subtotal);
        decimal discount = Round(Math.Min(discountRules.Sum(r => r.DiscountFor(context)), subtotal * MaxDiscountShare));
        decimal tax = Round((subtotal - discount) * TaxRate);
        decimal total = Round(subtotal - discount + tax);

        var reservations = lines.Select(l => (Line: l, Task: inventory.ReserveAsync(l.Sku, l.Quantity, ct))).ToList();
        await Task.WhenAll(reservations.Select(r => r.Task));
        var failed = reservations.FirstOrDefault(r => !r.Task.Result);
        if (failed.Task is not null)
        {
            await Task.WhenAll(reservations.Where(r => r.Task.Result).Select(r => inventory.ReleaseAsync(r.Line.Sku, r.Line.Quantity, ct)));
            return new PlaceResult.Rejected($"Out of stock: {failed.Line.Sku}");
        }

        var order = new Order(_nextId++, customerId, lines.ToList(), subtotal, discount, tax, total);
        _orders[order.Id] = order;
        return new PlaceResult.Accepted(order);
    }

    public async Task PayAsync(int orderId, CancellationToken ct)
    {
        var order = Get(orderId);
        if (order.Status != OrderStatus.Placed) throw new InvalidOperationException($"Order {orderId} is {order.Status}; only placed orders can be paid.");

        for (int attempt = 1; attempt <= PaymentAttempts; attempt++)
        {
            using var attemptCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            attemptCts.CancelAfter(PaymentAttemptTimeout);
            try
            {
                var result = await gateway.ChargeAsync($"order-{order.Id}", order.Total, attemptCts.Token);
                if (result.Approved)
                {
                    order.Status = OrderStatus.Paid;
                    return;
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception) when (attempt < PaymentAttempts)
            {
                // timed out or failed: try again with the same idempotency key
            }
            catch (Exception)
            {
                break;
            }
        }

        order.Status = OrderStatus.PaymentFailed;
        await ReleaseStockAsync(order, ct);
    }

    public async Task CancelAsync(int orderId, CancellationToken ct)
    {
        var order = Get(orderId);
        if (order.Status is not (OrderStatus.Placed or OrderStatus.PaymentFailed))
            throw new InvalidOperationException($"Order {orderId} is {order.Status} and cannot be cancelled.");
        await ReleaseStockAsync(order, ct);
        order.Status = OrderStatus.Cancelled;
    }

    public Order? Find(int orderId) => _orders.GetValueOrDefault(orderId);

    private Order Get(int orderId) => _orders.TryGetValue(orderId, out var o) ? o : throw new KeyNotFoundException($"No order {orderId}.");

    private async Task ReleaseStockAsync(Order order, CancellationToken ct)
    {
        if (order.StockReleased) return;
        await Task.WhenAll(order.Lines.Select(l => inventory.ReleaseAsync(l.Sku, l.Quantity, ct)));
        order.StockReleased = true;
    }

    private static decimal Round(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
`;

const TESTS = `public sealed class FakeInventory : IInventory
{
    public Dictionary<string, int> Stock { get; } = new(StringComparer.OrdinalIgnoreCase) { ["PEN"] = 100, ["BOOK"] = 10, ["BAG"] = 1 };
    public int InFlight, MaxInFlight;
    public async Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct)
    {
        InFlight++; MaxInFlight = Math.Max(MaxInFlight, InFlight);
        await Task.Delay(20, ct);
        InFlight--;
        if (Stock.GetValueOrDefault(sku) < quantity) return false;
        Stock[sku] -= quantity;
        return true;
    }
    public Task ReleaseAsync(string sku, int quantity, CancellationToken ct) { Stock[sku] += quantity; return Task.CompletedTask; }
}

public sealed class FakeGateway : IPaymentGateway
{
    public int FailuresBeforeSuccess;
    public bool SlowFirstAttempt;
    public bool AlwaysDecline;
    public List<string> Keys { get; } = [];
    public HashSet<string> Charged { get; } = [];
    public async Task<PaymentResult> ChargeAsync(string key, decimal amount, CancellationToken ct)
    {
        Keys.Add(key);
        if (SlowFirstAttempt && Keys.Count == 1) await Task.Delay(5_000, ct);
        if (FailuresBeforeSuccess-- > 0) throw new IOException("gateway unavailable");
        if (AlwaysDecline) return new PaymentResult(false, "declined");
        Charged.Add(key);
        return new PaymentResult(true, "ref-" + key);
    }
}
` + csTests(`
Product[] catalogue = [new("PEN", "Pen", 2.50m), new("BOOK", "Notebook", 12.00m), new("BAG", "Bag", 100.00m)];
var none = CancellationToken.None;
(OrderProcessor P, FakeInventory Inv, FakeGateway Pay) Setup(params IDiscountRule[] rules)
{
    var inv = new FakeInventory();
    var pay = new FakeGateway();
    return (new OrderProcessor(catalogue, inv, pay, rules), inv, pay);
}
async Task<Order> Place(OrderProcessor p, params (string Sku, int Quantity)[] lines) =>
    ((PlaceResult.Accepted)await p.PlaceOrderAsync("ama", lines.Select(l => new OrderLine(l.Sku, l.Quantity)).ToList(), none)).Order;

await ExpectAsync("empty order rejected", async () => await Setup().P.PlaceOrderAsync("ama", [], none) is PlaceResult.Rejected, "an order with no lines must be rejected");
await ExpectAsync("zero quantity rejected", async () => await Setup().P.PlaceOrderAsync("ama", [new("PEN", 0)], none) is PlaceResult.Rejected, "quantity 0 must be rejected");
await ExpectAsync("unknown sku rejected", async () => await Setup().P.PlaceOrderAsync("ama", [new("???", 1)], none) is PlaceResult.Rejected, "unknown SKUs must be rejected");
await CheckAsync("subtotal, tax, total", async () => { var o = await Place(Setup().P, ("BOOK", 2)); return (o.Subtotal, o.Discount, o.Tax, o.Total); }, (24.00m, 0m, 3.60m, 27.60m));
await CheckAsync("bulk discount", async () => (await Place(Setup(new BulkDiscount()).P, ("PEN", 10), ("BOOK", 1))).Discount, 2.50m);
await CheckAsync("discount capped at 30%", async () => (await Place(Setup(new LoyaltyDiscount(new HashSet<string> { "ama" }), new LoyaltyDiscount(new HashSet<string> { "ama" })).P, ("PEN", 2))).Discount, 1.50m);
await CheckAsync("tax after discount", async () => (await Place(Setup(new BulkDiscount()).P, ("PEN", 10))).Total, 25.88m);
await CheckAsync("stock reserved", async () => { var s = Setup(); await Place(s.P, ("BOOK", 3)); return s.Inv.Stock["BOOK"]; }, 7);
await ExpectAsync("reservations run concurrently", async () => { var s = Setup(); await Place(s.P, ("PEN", 1), ("BOOK", 1), ("BAG", 1)); return s.Inv.MaxInFlight > 1; }, "reserve every line before awaiting any of them");
await CheckAsync("out of stock releases others", async () =>
{
    var s = Setup();
    var r = await s.P.PlaceOrderAsync("ama", [new("PEN", 5), new("BAG", 2)], none);
    return r is PlaceResult.Rejected { Reason: "Out of stock: BAG" } && s.Inv.Stock["PEN"] == 100;
}, true);
await CheckAsync("ids increase", async () => { var s = Setup(); await Place(s.P, ("PEN", 1)); return (await Place(s.P, ("PEN", 1))).Id; }, 2);
await CheckAsync("pay succeeds", async () => { var s = Setup(); var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); return s.P.Find(o.Id)!.Status; }, OrderStatus.Paid);
await CheckAsync("idempotency key", async () => { var s = Setup(); var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); return s.Pay.Keys[0]; }, "order-1");
await CheckAsync("retries transient failures", async () => { var s = Setup(); s.Pay.FailuresBeforeSuccess = 2; var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); return (s.P.Find(o.Id)!.Status, s.Pay.Keys.Count); }, (OrderStatus.Paid, 3));
await CheckAsync("retry uses same key", async () => { var s = Setup(); s.Pay.FailuresBeforeSuccess = 1; var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); return s.Pay.Keys.Distinct().Count(); }, 1);
await CheckAsync("slow attempt times out and retries", async () => { var s = Setup(); s.Pay.SlowFirstAttempt = true; var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); return s.P.Find(o.Id)!.Status; }, OrderStatus.Paid);
await CheckAsync("gives up after 3", async () => { var s = Setup(); s.Pay.FailuresBeforeSuccess = 10; var o = await Place(s.P, ("BOOK", 2)); await s.P.PayAsync(o.Id, none); return (s.P.Find(o.Id)!.Status, s.Pay.Keys.Count, s.Inv.Stock["BOOK"]); }, (OrderStatus.PaymentFailed, 3, 10));
await CheckAsync("decline fails payment", async () => { var s = Setup(); s.Pay.AlwaysDecline = true; var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); return s.P.Find(o.Id)!.Status; }, OrderStatus.PaymentFailed);
await ThrowsAsync<InvalidOperationException>("cannot pay twice", async () => { var s = Setup(); var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); await s.P.PayAsync(o.Id, none); });
await CheckAsync("cancel releases stock", async () => { var s = Setup(); var o = await Place(s.P, ("BOOK", 4)); await s.P.CancelAsync(o.Id, none); return (s.P.Find(o.Id)!.Status, s.Inv.Stock["BOOK"]); }, (OrderStatus.Cancelled, 10));
await ThrowsAsync<InvalidOperationException>("cannot cancel paid", async () => { var s = Setup(); var o = await Place(s.P, ("PEN", 1)); await s.P.PayAsync(o.Id, none); await s.P.CancelAsync(o.Id, none); });
await CheckAsync("cancel after failed payment does not double-release", async () => { var s = Setup(); s.Pay.AlwaysDecline = true; var o = await Place(s.P, ("BOOK", 4)); await s.P.PayAsync(o.Id, none); await s.P.CancelAsync(o.Id, none); return s.Inv.Stock["BOOK"]; }, 10);
await CheckAsync("caller cancellation propagates", async () =>
{
    var s = Setup(); s.Pay.SlowFirstAttempt = true;
    var o = await Place(s.P, ("PEN", 1));
    using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(100));
    try { await s.P.PayAsync(o.Id, cts.Token); return "no exception"; }
    catch (OperationCanceledException) { return s.P.Find(o.Id)!.Status.ToString(); }
}, "Placed");
`);

const task: ProjectTask = {
  id: 'se-cs-m1-002',
  title: 'Week 2: Order Processing Engine',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'foundations',
  category: 'Month 1 · C# & Engineering Foundations',
  tags: ['async/await', 'Task.WhenAll', 'cancellation', 'retries', 'idempotency', 'state machine'],
  prompt:
    'Build an order engine that stays correct when the outside world misbehaves: validate orders, apply a capped pipeline of discount ' +
    'rules and tax in decimal, reserve stock for every line concurrently and release it all if any line fails, take payment through a ' +
    'flaky gateway with per-attempt timeouts, retries and an idempotency key so a customer is never charged twice, and allow only the ' +
    'state transitions the rules describe. README.md has the exact rules; the hidden tests use fakes that are slow, fail and decline.',
  hints: [
    'Compute money in decimal and round discount, tax and total once each with MidpointRounding.AwayFromZero. Cap the discount with Math.Min(sum, subtotal * 0.30m).',
    'Start every ReserveAsync call before awaiting any (keep the tasks with their lines), await Task.WhenAll, then release the ones that returned true if any returned false.',
    'For payment, reuse the Week 2 retry pattern: a linked CancellationTokenSource with CancelAfter(500 ms) per attempt, the same "order-<id>" key every attempt, and rethrow OperationCanceledException only when the caller\'s token is cancelled.',
    'Remember whether stock was already released (Order.StockReleased) so a failed payment followed by Cancel does not release twice.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Models.cs', MODELS, { editable: false }),
    pf('Ports.cs', PORTS, { editable: false }),
    pf('Discounts.cs', DISCOUNTS, { editable: false }),
    pf('OrderProcessor.cs', PROCESSOR_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Models.cs', MODELS, { editable: false }),
    pf('Ports.cs', PORTS, { editable: false }),
    pf('Discounts.cs', DISCOUNTS, { editable: false }),
    pf('OrderProcessor.cs', PROCESSOR_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Order Engine', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
