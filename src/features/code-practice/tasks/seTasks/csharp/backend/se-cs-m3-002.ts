import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';
import { CS_DEPENDENCY_SCAN } from '../../../csharpTasks/dependencyScan';

const README = `# Week 10 Assignment: Commerce Platform

Build a small commerce system as a **modular monolith**: one process, three modules with hard boundaries.

| Module | Owns | Talks to others through |
| --- | --- | --- |
| Catalogue (given) | products and prices | \`ICatalogueApi\` |
| Ordering (you) | orders and their lifecycle | reads \`ICatalogueApi\`; publishes \`OrderPlaced\` / \`OrderCancelled\` |
| Inventory (you) | stock on hand and reservations | reacts to Ordering's events; publishes \`StockReserved\` / \`StockReservationFailed\` |

Every module has a \`Contracts\` namespace (public API and integration events) and an \`Internal\` namespace
(everything else). **Catalogue.cs is complete — read it first; it is the shape to copy.**

## Requirements

1. **Money** (SharedKernel.cs) — an immutable value object: amount ≥ 0 with at most two decimals, a three-letter
   upper-case currency code (otherwise \`ArgumentException\`), \`+\` only within one currency
   (\`InvalidOperationException\` otherwise), \`* int\`, \`Zero(currency)\`, value equality and \`ToString()\` → \`GHS 12.50\`.
2. **The Order aggregate** (Ordering.Internal) protects its invariants — every rule broken throws \`DomainException\`
   and leaves the order unchanged:
   - an order has one currency, chosen at \`Start\`; every line must be priced in it;
   - lines change only while the order is a \`Draft\`; quantity ≥ 1; adding a SKU again merges into its line; at most
     **10** of one product per order;
   - \`Place()\` needs at least one line → \`Placed\` and raises the domain event \`OrderSubmitted\`;
   - \`Confirm()\` and \`Reject(reason)\` move a \`Placed\` order on; repeating the same one is a harmless no-op (messages can
     arrive twice); anything else throws;
   - \`Cancel()\` works for Draft, Placed and Confirmed orders and raises \`OrderWithdrawn\` unless it was still a Draft.
   \`Lines\` is read-only and no property has a public setter.
3. **The Ordering module** — \`AddLine\` looks the product up in the Catalogue (unknown → \`DomainException\`, unknown order →
   \`KeyNotFoundException\`) and **copies the price into the line**: later price changes do not affect existing orders.
   After \`PlaceAsync\` / \`CancelAsync\` it translates the aggregate's domain events into integration events and
   publishes them. Domain events never leave the module. It confirms or rejects orders when Inventory replies.
4. **The Inventory module** — reserves stock for a placed order **all or nothing**; if any item is short it publishes
   \`StockReservationFailed(orderId, "Insufficient stock for <SKU>.")\` and reserves nothing. A duplicate \`OrderPlaced\` must
   not reserve twice. \`OrderCancelled\` releases that order's reservation exactly once.
5. **Host** — \`CommercePlatform.Create()\` is the composition root: a fresh bus and fresh modules every time.

## Boundaries the grader enforces (with reflection over your compiled code)

- No module references another module's \`Internal\` namespace, and no \`Contracts\` type exposes an internal type.
- Ordering never calls \`IInventoryApi\`, and Inventory never calls \`IOrderingApi\` — they cooperate only through events.
`;

const BUILDING_BLOCKS = `namespace Shop.BuildingBlocks;

/// <summary>A business rule was broken. The message is safe to show to the caller.</summary>
public class DomainException(string message) : Exception(message);

public interface IDomainEvent;

/// <summary>Base class for aggregates: collects domain events until the module dispatches them.</summary>
public abstract class AggregateRoot
{
    private readonly List<IDomainEvent> _events = [];

    public IReadOnlyList<IDomainEvent> DomainEvents => _events.AsReadOnly();

    protected void Raise(IDomainEvent domainEvent) => _events.Add(domainEvent);

    public void ClearDomainEvents() => _events.Clear();
}

/// <summary>In-process publish/subscribe for integration events between modules. Handlers run in subscription
/// order; one failing handler does not stop the others, and the failures are rethrown together at the end.</summary>
public sealed class EventBus
{
    private readonly Dictionary<Type, List<Func<object, Task>>> _handlers = [];

    public IDisposable Subscribe<TEvent>(Func<TEvent, Task> handler)
    {
        Func<object, Task> wrapper = e => handler((TEvent)e);
        if (!_handlers.TryGetValue(typeof(TEvent), out var list)) _handlers[typeof(TEvent)] = list = [];
        list.Add(wrapper);
        return new Subscription(() => list.Remove(wrapper));
    }

    public async Task PublishAsync<TEvent>(TEvent @event) where TEvent : notnull
    {
        if (!_handlers.TryGetValue(@event.GetType(), out var list)) return;
        var failures = new List<Exception>();
        foreach (var handler in list.ToList())
        {
            try { await handler(@event); }
            catch (Exception e) { failures.Add(e); }
        }
        if (failures.Count > 0) throw new AggregateException(failures);
    }

    private sealed class Subscription(Action unsubscribe) : IDisposable
    {
        private Action? _unsubscribe = unsubscribe;
        public void Dispose() { _unsubscribe?.Invoke(); _unsubscribe = null; }
    }
}
`;

const CATALOGUE = `using Shop.BuildingBlocks;
using Shop.SharedKernel;

// The reference module. Contracts are what other modules may see; everything in Internal is private to Catalogue.

namespace Shop.Catalogue.Contracts
{
    public sealed record ProductInfo(string Sku, string Name, Money Price);

    public interface ICatalogueApi
    {
        /// <summary>Case-insensitive lookup; the returned Sku is the canonical upper-case one.</summary>
        ProductInfo? Find(string sku);
        void Upsert(string sku, string name, Money price);
    }
}

namespace Shop.Catalogue.Internal
{
    using Shop.Catalogue.Contracts;

    internal sealed class Product(string sku, string name, Money price)
    {
        public string Sku { get; } = sku;
        public string Name { get; private set; } = name;
        public Money Price { get; private set; } = price;

        public void Change(string name, Money price) { Name = name; Price = price; }

        public ProductInfo ToInfo() => new(Sku, Name, Price);
    }

    public sealed class CatalogueModule : ICatalogueApi
    {
        private readonly Dictionary<string, Product> _products = new(StringComparer.OrdinalIgnoreCase);

        public ProductInfo? Find(string sku) => _products.TryGetValue(sku, out var product) ? product.ToInfo() : null;

        public void Upsert(string sku, string name, Money price)
        {
            if (string.IsNullOrWhiteSpace(sku)) throw new DomainException("A product needs a SKU.");
            if (string.IsNullOrWhiteSpace(name)) throw new DomainException("A product needs a name.");
            if (_products.TryGetValue(sku, out var existing)) existing.Change(name, price);
            else _products[sku] = new Product(sku.ToUpperInvariant(), name, price);
        }
    }
}
`;

const MONEY_STARTER = `namespace Shop.SharedKernel;

/// <summary>An amount in one currency. Immutable, compared by value, never mixed across currencies.</summary>
public readonly record struct Money
{
    public Money(decimal amount, string currency) => throw new NotImplementedException();

    public decimal Amount { get; }
    public string Currency { get; }

    public static Money Zero(string currency) => throw new NotImplementedException();

    public static Money operator +(Money a, Money b) => throw new NotImplementedException();

    public static Money operator *(Money money, int quantity) => throw new NotImplementedException();

    public override string ToString() => throw new NotImplementedException();
}
`;

const MONEY_SOLUTION = `using System.Globalization;

namespace Shop.SharedKernel;

/// <summary>An amount in one currency. Immutable, compared by value, never mixed across currencies.</summary>
public readonly record struct Money
{
    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentException("Money cannot be negative.", nameof(amount));
        if (decimal.Round(amount, 2) != amount) throw new ArgumentException("Money has at most two decimal places.", nameof(amount));
        if (currency is not { Length: 3 } || !currency.All(char.IsAsciiLetterUpper))
            throw new ArgumentException("Currency must be a three-letter code such as GHS.", nameof(currency));
        Amount = amount;
        Currency = currency;
    }

    public decimal Amount { get; }
    public string Currency { get; }

    public static Money Zero(string currency) => new(0m, currency);

    public static Money operator +(Money a, Money b) =>
        a.Currency == b.Currency ? new(a.Amount + b.Amount, a.Currency) : throw new InvalidOperationException($"Cannot add {a.Currency} to {b.Currency}.");

    public static Money operator *(Money money, int quantity) =>
        quantity >= 0 ? new(money.Amount * quantity, money.Currency) : throw new ArgumentOutOfRangeException(nameof(quantity));

    public override string ToString() => Currency + " " + Amount.ToString("F2", CultureInfo.InvariantCulture);
}
`;

const ORDERING_CONTRACTS = `namespace Shop.Ordering.Contracts
{
    public sealed record OrderedItem(string Sku, int Quantity);

    /// <summary>Integration event: an order was placed and needs stock.</summary>
    public sealed record OrderPlaced(Guid OrderId, IReadOnlyList<OrderedItem> Items);

    /// <summary>Integration event: a placed or confirmed order was cancelled.</summary>
    public sealed record OrderCancelled(Guid OrderId);

    public sealed record OrderLineView(string Sku, int Quantity, Money UnitPrice);

    public sealed record OrderView(Guid Id, string Status, Money Total, IReadOnlyList<OrderLineView> Lines, string? RejectionReason);

    public interface IOrderingApi
    {
        Guid StartOrder(Guid customerId, string currency);
        void AddLine(Guid orderId, string sku, int quantity);
        Task PlaceAsync(Guid orderId);
        Task CancelAsync(Guid orderId);
        OrderView? Find(Guid orderId);
    }
}
`;

const ORDERING_STARTER = `using Shop.BuildingBlocks;
using Shop.SharedKernel;

${ORDERING_CONTRACTS}
namespace Shop.Ordering.Internal
{
    using Shop.Catalogue.Contracts;
    using Shop.Ordering.Contracts;

    public enum OrderStatus { Draft, Placed, Confirmed, Rejected, Cancelled }

    public sealed record OrderSubmitted(Guid OrderId) : IDomainEvent;
    public sealed record OrderWithdrawn(Guid OrderId) : IDomainEvent;

    public sealed record OrderLine(string Sku, int Quantity, Money UnitPrice);

    public sealed class Order : AggregateRoot
    {
        public Guid Id { get; }
        public Guid CustomerId { get; }
        public string Currency { get; } = "";
        public OrderStatus Status { get; private set; }
        public string? RejectionReason { get; private set; }
        public IReadOnlyList<OrderLine> Lines => throw new NotImplementedException();
        public Money Total => throw new NotImplementedException();

        public static Order Start(Guid id, Guid customerId, string currency) => throw new NotImplementedException();
        public void AddLine(string sku, Money unitPrice, int quantity) => throw new NotImplementedException();
        public void Place() => throw new NotImplementedException();
        public void Confirm() => throw new NotImplementedException();
        public void Reject(string reason) => throw new NotImplementedException();
        public void Cancel() => throw new NotImplementedException();
    }

    public sealed class OrderingModule : IOrderingApi
    {
        public OrderingModule(ICatalogueApi catalogue, EventBus bus) { }

        public Guid StartOrder(Guid customerId, string currency) => throw new NotImplementedException();
        public void AddLine(Guid orderId, string sku, int quantity) => throw new NotImplementedException();
        public Task PlaceAsync(Guid orderId) => throw new NotImplementedException();
        public Task CancelAsync(Guid orderId) => throw new NotImplementedException();
        public OrderView? Find(Guid orderId) => throw new NotImplementedException();
    }
}
`;

const ORDERING_SOLUTION = `using Shop.BuildingBlocks;
using Shop.SharedKernel;

${ORDERING_CONTRACTS}
namespace Shop.Ordering.Internal
{
    using Shop.Catalogue.Contracts;
    using Shop.Inventory.Contracts;
    using Shop.Ordering.Contracts;

    public enum OrderStatus { Draft, Placed, Confirmed, Rejected, Cancelled }

    public sealed record OrderSubmitted(Guid OrderId) : IDomainEvent;
    public sealed record OrderWithdrawn(Guid OrderId) : IDomainEvent;

    public sealed record OrderLine(string Sku, int Quantity, Money UnitPrice)
    {
        public Money LineTotal => UnitPrice * Quantity;
    }

    public sealed class Order : AggregateRoot
    {
        private const int MaxQuantityPerProduct = 10;
        private readonly List<OrderLine> _lines = [];

        private Order(Guid id, Guid customerId, string currency)
        {
            Id = id;
            CustomerId = customerId;
            Currency = currency;
        }

        public Guid Id { get; }
        public Guid CustomerId { get; }
        public string Currency { get; }
        public OrderStatus Status { get; private set; } = OrderStatus.Draft;
        public string? RejectionReason { get; private set; }
        public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();
        public Money Total => _lines.Aggregate(Money.Zero(Currency), (sum, line) => sum + line.LineTotal);

        // Money.Zero validates the currency code, so an order can never start with a bad one.
        public static Order Start(Guid id, Guid customerId, string currency) => new(id, customerId, Money.Zero(currency).Currency);

        public void AddLine(string sku, Money unitPrice, int quantity)
        {
            if (Status != OrderStatus.Draft) throw new DomainException("Only draft orders can be changed.");
            if (quantity < 1) throw new DomainException("Quantity must be at least 1.");
            if (unitPrice.Currency != Currency) throw new DomainException($"This order is in {Currency} but {sku} is priced in {unitPrice.Currency}.");

            int index = _lines.FindIndex(l => l.Sku == sku);
            int merged = (index < 0 ? 0 : _lines[index].Quantity) + quantity;
            if (merged > MaxQuantityPerProduct) throw new DomainException($"At most {MaxQuantityPerProduct} of {sku} per order.");

            // Every check is done before the first change, so a failure leaves the aggregate untouched.
            if (index < 0) _lines.Add(new OrderLine(sku, quantity, unitPrice));
            else _lines[index] = _lines[index] with { Quantity = merged };
        }

        public void Place()
        {
            if (Status != OrderStatus.Draft) throw new DomainException("Only draft orders can be placed.");
            if (_lines.Count == 0) throw new DomainException("An order needs at least one line.");
            Status = OrderStatus.Placed;
            Raise(new OrderSubmitted(Id));
        }

        public void Confirm()
        {
            if (Status == OrderStatus.Confirmed) return; // a duplicate message: already done
            if (Status != OrderStatus.Placed) throw new DomainException($"A {Status} order cannot be confirmed.");
            Status = OrderStatus.Confirmed;
        }

        public void Reject(string reason)
        {
            if (Status == OrderStatus.Rejected) return;
            if (Status != OrderStatus.Placed) throw new DomainException($"A {Status} order cannot be rejected.");
            Status = OrderStatus.Rejected;
            RejectionReason = reason;
        }

        public void Cancel()
        {
            if (Status is OrderStatus.Rejected or OrderStatus.Cancelled) throw new DomainException($"A {Status} order cannot be cancelled.");
            bool submitted = Status != OrderStatus.Draft;
            Status = OrderStatus.Cancelled;
            if (submitted) Raise(new OrderWithdrawn(Id));
        }
    }

    public sealed class OrderingModule : IOrderingApi
    {
        private readonly Dictionary<Guid, Order> _orders = [];
        private readonly ICatalogueApi _catalogue;
        private readonly EventBus _bus;

        public OrderingModule(ICatalogueApi catalogue, EventBus bus)
        {
            _catalogue = catalogue;
            _bus = bus;
            bus.Subscribe<StockReserved>(e => Apply(e.OrderId, order => order.Confirm()));
            bus.Subscribe<StockReservationFailed>(e => Apply(e.OrderId, order => order.Reject(e.Reason)));
        }

        public Guid StartOrder(Guid customerId, string currency)
        {
            var order = Order.Start(Guid.NewGuid(), customerId, currency);
            _orders[order.Id] = order;
            return order.Id;
        }

        public void AddLine(Guid orderId, string sku, int quantity)
        {
            var order = Get(orderId);
            var product = _catalogue.Find(sku) ?? throw new DomainException($"Unknown product {sku}.");
            order.AddLine(product.Sku, product.Price, quantity); // the price is copied: a snapshot, not a reference
        }

        public Task PlaceAsync(Guid orderId)
        {
            var order = Get(orderId);
            order.Place();
            return DispatchAsync(order);
        }

        public Task CancelAsync(Guid orderId)
        {
            var order = Get(orderId);
            order.Cancel();
            return DispatchAsync(order);
        }

        public OrderView? Find(Guid orderId) =>
            _orders.TryGetValue(orderId, out var o)
                ? new OrderView(o.Id, o.Status.ToString(), o.Total, o.Lines.Select(l => new OrderLineView(l.Sku, l.Quantity, l.UnitPrice)).ToList(), o.RejectionReason)
                : null;

        private Order Get(Guid orderId) =>
            _orders.TryGetValue(orderId, out var order) ? order : throw new KeyNotFoundException($"Order {orderId} does not exist.");

        private Task Apply(Guid orderId, Action<Order> change)
        {
            if (_orders.TryGetValue(orderId, out var order) && order.Status != OrderStatus.Cancelled) change(order);
            return Task.CompletedTask;
        }

        // Domain events stay inside the module; only translated integration events cross the boundary.
        private async Task DispatchAsync(Order order)
        {
            var events = order.DomainEvents.ToList();
            order.ClearDomainEvents();
            foreach (var domainEvent in events)
            {
                object integrationEvent = domainEvent switch
                {
                    OrderSubmitted e => new OrderPlaced(e.OrderId, order.Lines.Select(l => new OrderedItem(l.Sku, l.Quantity)).ToList()),
                    OrderWithdrawn e => new OrderCancelled(e.OrderId),
                    _ => throw new InvalidOperationException($"No integration event for {domainEvent.GetType().Name}."),
                };
                await _bus.PublishAsync(integrationEvent);
            }
        }
    }
}
`;

const INVENTORY_CONTRACTS = `namespace Shop.Inventory.Contracts
{
    public sealed record StockReserved(Guid OrderId);
    public sealed record StockReservationFailed(Guid OrderId, string Reason);

    public interface IInventoryApi
    {
        void Restock(string sku, int quantity);
        int Available(string sku);
    }
}
`;

const INVENTORY_STARTER = `using Shop.BuildingBlocks;

${INVENTORY_CONTRACTS}
namespace Shop.Inventory.Internal
{
    using Shop.Inventory.Contracts;

    public sealed class InventoryModule : IInventoryApi
    {
        public InventoryModule(EventBus bus) { }

        public void Restock(string sku, int quantity) => throw new NotImplementedException();
        public int Available(string sku) => throw new NotImplementedException();
    }
}
`;

const INVENTORY_SOLUTION = `using Shop.BuildingBlocks;

${INVENTORY_CONTRACTS}
namespace Shop.Inventory.Internal
{
    using Shop.Inventory.Contracts;
    using Shop.Ordering.Contracts;

    public sealed class InventoryModule : IInventoryApi
    {
        private readonly Dictionary<string, int> _onHand = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<Guid, IReadOnlyList<OrderedItem>> _reservations = [];
        private readonly EventBus _bus;

        public InventoryModule(EventBus bus)
        {
            _bus = bus;
            bus.Subscribe<OrderPlaced>(ReserveAsync);
            bus.Subscribe<OrderCancelled>(Release);
        }

        public void Restock(string sku, int quantity)
        {
            if (quantity < 1) throw new DomainException("Restock quantity must be positive.");
            _onHand[sku] = Available(sku) + quantity;
        }

        public int Available(string sku) => _onHand.GetValueOrDefault(sku);

        private Task ReserveAsync(OrderPlaced placed)
        {
            // At-least-once delivery: a repeat of an order we already reserved for just repeats the answer.
            if (_reservations.ContainsKey(placed.OrderId)) return _bus.PublishAsync(new StockReserved(placed.OrderId));

            var needed = placed.Items.GroupBy(i => i.Sku, StringComparer.OrdinalIgnoreCase).Select(g => (Sku: g.Key, Quantity: g.Sum(i => i.Quantity))).ToList();
            var shortfall = needed.FirstOrDefault(i => Available(i.Sku) < i.Quantity);
            if (shortfall.Sku is not null)
                return _bus.PublishAsync(new StockReservationFailed(placed.OrderId, $"Insufficient stock for {shortfall.Sku}."));

            foreach (var (sku, quantity) in needed) _onHand[sku] -= quantity;
            _reservations[placed.OrderId] = placed.Items;
            return _bus.PublishAsync(new StockReserved(placed.OrderId));
        }

        private Task Release(OrderCancelled cancelled)
        {
            if (_reservations.Remove(cancelled.OrderId, out var items))
                foreach (var item in items) _onHand[item.Sku] = Available(item.Sku) + item.Quantity;
            return Task.CompletedTask;
        }
    }
}
`;

const HOST_STARTER = `using Shop.BuildingBlocks;
using Shop.Catalogue.Contracts;
using Shop.Inventory.Contracts;
using Shop.Ordering.Contracts;

namespace Shop.Host;

/// <summary>The composition root: the only code allowed to know every module's internals.</summary>
public sealed class CommercePlatform
{
    public EventBus Bus => throw new NotImplementedException();
    public ICatalogueApi Catalogue => throw new NotImplementedException();
    public IOrderingApi Ordering => throw new NotImplementedException();
    public IInventoryApi Inventory => throw new NotImplementedException();

    public static CommercePlatform Create() => throw new NotImplementedException();
}
`;

const HOST_SOLUTION = `using Shop.BuildingBlocks;
using Shop.Catalogue.Contracts;
using Shop.Catalogue.Internal;
using Shop.Inventory.Contracts;
using Shop.Inventory.Internal;
using Shop.Ordering.Contracts;
using Shop.Ordering.Internal;

namespace Shop.Host;

/// <summary>The composition root: the only code allowed to know every module's internals.</summary>
public sealed class CommercePlatform
{
    private CommercePlatform(EventBus bus, ICatalogueApi catalogue, IOrderingApi ordering, IInventoryApi inventory)
    {
        Bus = bus;
        Catalogue = catalogue;
        Ordering = ordering;
        Inventory = inventory;
    }

    public EventBus Bus { get; }
    public ICatalogueApi Catalogue { get; }
    public IOrderingApi Ordering { get; }
    public IInventoryApi Inventory { get; }

    public static CommercePlatform Create()
    {
        var bus = new EventBus();
        var catalogue = new CatalogueModule();
        return new CommercePlatform(bus, catalogue, new OrderingModule(catalogue, bus), new InventoryModule(bus));
    }
}
`;

const PROGRAM = `using Shop.Host;
using Shop.SharedKernel;

var shop = CommercePlatform.Create();
shop.Catalogue.Upsert("PEN", "Gel pen", new Money(2.50m, "GHS"));
shop.Catalogue.Upsert("BOOK", "Notebook", new Money(12m, "GHS"));
shop.Inventory.Restock("PEN", 20);
shop.Inventory.Restock("BOOK", 1);

var first = shop.Ordering.StartOrder(Guid.NewGuid(), "GHS");
shop.Ordering.AddLine(first, "PEN", 4);
shop.Ordering.AddLine(first, "book", 1);
await shop.Ordering.PlaceAsync(first);

var second = shop.Ordering.StartOrder(Guid.NewGuid(), "GHS");
shop.Ordering.AddLine(second, "BOOK", 1);
await shop.Ordering.PlaceAsync(second);

foreach (var id in new[] { first, second })
{
    var view = shop.Ordering.Find(id)!;
    Console.WriteLine($"{view.Status,-10} {view.Total}  {view.RejectionReason}");
}
Console.WriteLine($"Stock left: PEN {shop.Inventory.Available("PEN")}, BOOK {shop.Inventory.Available("BOOK")}");
`;

const TESTS = `using System.Reflection;
using Shop.BuildingBlocks;
using Shop.Host;
using Shop.Inventory.Contracts;
using Shop.Ordering.Contracts;
using Shop.Ordering.Internal;
using Shop.SharedKernel;

static class Modules
{
    static readonly string[] Names = ["Catalogue", "Ordering", "Inventory"];

    public static (string? Module, string? Area) Locate(Type t)
    {
        string[] parts = (t.Namespace ?? "").Split('.');
        return parts.Length == 3 && parts[0] == "Shop" && Names.Contains(parts[1]) ? (parts[1], parts[2]) : (null, null);
    }

    static IEnumerable<Type> All => typeof(Money).Assembly.GetTypes().Where(t => Locate(t).Module is not null);

    static List<string> Report(IEnumerable<(Type From, Type To)> edges) =>
        edges.Select(e => Dependencies.Outer(e.From).Name + " -> " + Dependencies.Named(e.To)).Distinct().OrderBy(s => s, StringComparer.Ordinal).ToList();

    public static List<string> InternalLeaks() => Report(All.SelectMany(t => Dependencies.Of(t).Select(d => (t, d))).Where(e =>
    {
        var (from, fromArea) = Locate(e.t);
        var (to, toArea) = Locate(e.d);
        return toArea == "Internal" && (to != from || fromArea == "Contracts");
    }));

    public static List<string> Uses(string module, params Type[] forbidden) =>
        Report(All.Where(t => Locate(t).Module == module).SelectMany(t => Dependencies.Of(t).Where(forbidden.Contains).Select(d => (t, d))));
}
` + CS_DEPENDENCY_SCAN + csTests(`
Money Ghs(decimal amount) => new(amount, "GHS");
Order Draft() => Order.Start(Guid.NewGuid(), Guid.NewGuid(), "GHS");
CommercePlatform Seeded()
{
    var p = CommercePlatform.Create();
    p.Catalogue.Upsert("PEN", "Gel pen", Ghs(2.50m));
    p.Catalogue.Upsert("BOOK", "Notebook", Ghs(12m));
    p.Catalogue.Upsert("MUG", "Mug", new Money(8m, "USD"));
    return p;
}
async Task<(CommercePlatform Shop, Guid Id)> Placed(int pens, int books, int penStock = 10, int bookStock = 5)
{
    var p = Seeded();
    if (penStock > 0) p.Inventory.Restock("PEN", penStock);
    if (bookStock > 0) p.Inventory.Restock("BOOK", bookStock);
    var id = p.Ordering.StartOrder(Guid.NewGuid(), "GHS");
    if (pens > 0) p.Ordering.AddLine(id, "PEN", pens);
    if (books > 0) p.Ordering.AddLine(id, "BOOK", books);
    await p.Ordering.PlaceAsync(id);
    return (p, id);
}
bool Fails<TException>(Action action) where TException : Exception { try { action(); return false; } catch (TException) { return true; } }

// ---- Money: a value object ----
Check("money: arithmetic", () => { var m = Ghs(12.50m) * 3 + Ghs(1m); return (m.Amount, m.Currency); }, (38.50m, "GHS"));
Throws<InvalidOperationException>("money: currencies never mix", () => { var mixed = Ghs(1m) + new Money(1m, "USD"); });
Expect("money: invalid amounts and currencies are rejected", () =>
    Fails<ArgumentException>(() => new Money(-1m, "GHS")) && Fails<ArgumentException>(() => new Money(1.005m, "GHS"))
    && Fails<ArgumentException>(() => new Money(1m, "ghs")) && Fails<ArgumentException>(() => new Money(1m, "CEDI")) && Fails<ArgumentException>(() => new Money(1m, null!)),
    "negative amounts, more than two decimals and anything but a three-letter upper-case code must throw ArgumentException");
Check("money: value equality and display", () => (new Money(5m, "USD") == new Money(5.00m, "USD"), new Money(5m, "USD").ToString()), (true, "USD 5.00"));

// ---- The Order aggregate ----
Check("aggregate: lines merge and total", () =>
{
    var o = Draft();
    o.AddLine("PEN", Ghs(2.50m), 2); o.AddLine("PEN", Ghs(2.50m), 3); o.AddLine("BOOK", Ghs(12m), 1);
    return (o.Lines.Count, o.Lines.First(l => l.Sku == "PEN").Quantity, o.Total.ToString());
}, (2, 5, "GHS 24.50"));
Expect("aggregate: per-product limit leaves the order unchanged", () =>
{
    var o = Draft(); o.AddLine("PEN", Ghs(2.50m), 6);
    return Fails<DomainException>(() => o.AddLine("PEN", Ghs(2.50m), 5)) && o.Lines.Single().Quantity == 6 && o.Total == Ghs(15m);
}, "adding 5 more pens to 6 must throw DomainException and keep the line at 6");
Expect("aggregate: currency and quantity rules", () =>
{
    var o = Draft();
    return Fails<DomainException>(() => o.AddLine("MUG", new Money(8m, "USD"), 1)) && Fails<DomainException>(() => o.AddLine("PEN", Ghs(2.50m), 0)) && o.Lines.Count == 0;
}, "a line in another currency or with quantity 0 must throw DomainException");
Expect("aggregate: placing", () =>
{
    var o = Draft();
    if (!Fails<DomainException>(o.Place)) return false;
    o.AddLine("PEN", Ghs(2.50m), 1);
    o.Place();
    return o.Status == OrderStatus.Placed && o.DomainEvents.OfType<OrderSubmitted>().Single().OrderId == o.Id
        && Fails<DomainException>(() => o.AddLine("BOOK", Ghs(12m), 1)) && Fails<DomainException>(o.Place);
}, "an empty order cannot be placed; placing raises one OrderSubmitted; a placed order cannot be changed or placed again");
Expect("aggregate: confirm, reject and duplicates", () =>
{
    var o = Draft(); o.AddLine("PEN", Ghs(2.50m), 1);
    if (!Fails<DomainException>(o.Confirm)) return false;
    o.Place(); o.Confirm(); o.Confirm();
    return o.Status == OrderStatus.Confirmed && Fails<DomainException>(() => o.Reject("late"));
}, "Confirm on a draft throws; confirming twice is a no-op; rejecting a confirmed order throws");
Expect("aggregate: cancelling", () =>
{
    var draft = Draft(); draft.Cancel();
    var confirmed = Draft(); confirmed.AddLine("PEN", Ghs(2.50m), 1); confirmed.Place(); confirmed.Confirm(); confirmed.ClearDomainEvents(); confirmed.Cancel();
    return draft.Status == OrderStatus.Cancelled && !draft.DomainEvents.OfType<OrderWithdrawn>().Any()
        && confirmed.DomainEvents.OfType<OrderWithdrawn>().Count() == 1 && Fails<DomainException>(confirmed.Cancel);
}, "cancelling a draft raises nothing; cancelling a confirmed order raises OrderWithdrawn; cancelling twice throws");
CheckSeq("aggregate: state changes only through methods", () =>
    new[] { typeof(Order), typeof(OrderLine) }.SelectMany(t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        .Where(p => p.SetMethod is { IsPublic: true } s && !s.ReturnParameter.GetRequiredCustomModifiers().Contains(typeof(System.Runtime.CompilerServices.IsExternalInit)))
        .Select(p => p.DeclaringType!.Name + "." + p.Name)
        .Concat(Draft().Lines is ICollection<OrderLine> { IsReadOnly: false } ? ["Order.Lines is writable"] : []), []);

// ---- Modules working together through events ----
await CheckAsync("modules: placing reserves stock and confirms", async () =>
{
    var (p, id) = await Placed(pens: 3, books: 1);
    return (p.Ordering.Find(id)!.Status, p.Inventory.Available("PEN"), p.Inventory.Available("BOOK"));
}, ("Confirmed", 7, 4));
await CheckAsync("modules: reservation is all or nothing", async () =>
{
    var (p, id) = await Placed(pens: 3, books: 1, bookStock: 0);
    var view = p.Ordering.Find(id)!;
    return (view.Status, view.RejectionReason, p.Inventory.Available("PEN"));
}, ("Rejected", "Insufficient stock for BOOK.", 10));
Check("modules: prices are snapshots", () =>
{
    var p = Seeded();
    var a = p.Ordering.StartOrder(Guid.NewGuid(), "GHS"); p.Ordering.AddLine(a, "pen", 2);
    p.Catalogue.Upsert("PEN", "Gel pen", Ghs(3m));
    var b = p.Ordering.StartOrder(Guid.NewGuid(), "GHS"); p.Ordering.AddLine(b, "PEN", 2);
    return (p.Ordering.Find(a)!.Total.ToString(), p.Ordering.Find(b)!.Total.ToString());
}, ("GHS 5.00", "GHS 6.00"));
Expect("modules: unknown products, orders and currencies", () =>
{
    var p = Seeded(); var id = p.Ordering.StartOrder(Guid.NewGuid(), "GHS");
    return Fails<DomainException>(() => p.Ordering.AddLine(id, "LAMP", 1)) && Fails<KeyNotFoundException>(() => p.Ordering.AddLine(Guid.NewGuid(), "PEN", 1))
        && Fails<DomainException>(() => p.Ordering.AddLine(id, "MUG", 1));
}, "unknown SKU or a USD product on a GHS order → DomainException; unknown order → KeyNotFoundException");
CheckSeq("modules: order view", () =>
{
    var p = Seeded(); var id = p.Ordering.StartOrder(Guid.NewGuid(), "GHS");
    p.Ordering.AddLine(id, "pen", 2); p.Ordering.AddLine(id, "BOOK", 1);
    var v = p.Ordering.Find(id)!;
    return v.Lines.Select(l => l.Sku + " " + l.Quantity + " " + l.UnitPrice).Append(v.Status + " " + v.Total).Append((p.Ordering.Find(Guid.NewGuid()) is null).ToString());
}, ["PEN 2 GHS 2.50", "BOOK 1 GHS 12.00", "Draft GHS 17.00", "True"]);
await CheckAsync("modules: cancelling releases stock exactly once", async () =>
{
    var (p, id) = await Placed(pens: 4, books: 0);
    await p.Ordering.CancelAsync(id);
    bool secondCancelRejected;
    try { await p.Ordering.CancelAsync(id); secondCancelRejected = false; } catch (DomainException) { secondCancelRejected = true; }
    return (p.Ordering.Find(id)!.Status, p.Inventory.Available("PEN"), secondCancelRejected);
}, ("Cancelled", 10, true));
await CheckAsync("modules: a duplicate OrderPlaced reserves nothing more", async () =>
{
    var (p, id) = await Placed(pens: 3, books: 0);
    await p.Bus.PublishAsync(new OrderPlaced(id, [new OrderedItem("PEN", 3)]));
    return (p.Ordering.Find(id)!.Status, p.Inventory.Available("PEN"));
}, ("Confirmed", 7));
await CheckAsync("modules: one integration event per placement; domain events stay inside", async () =>
{
    var p = Seeded(); p.Inventory.Restock("PEN", 10);
    var seen = new List<string>();
    p.Bus.Subscribe<OrderPlaced>(e => { seen.Add(string.Join(",", e.Items.Select(i => i.Sku + "x" + i.Quantity))); return Task.CompletedTask; });
    p.Bus.Subscribe<OrderSubmitted>(_ => { seen.Add("domain event leaked"); return Task.CompletedTask; });
    var id = p.Ordering.StartOrder(Guid.NewGuid(), "GHS");
    p.Ordering.AddLine(id, "PEN", 2); p.Ordering.AddLine(id, "PEN", 1);
    await p.Ordering.PlaceAsync(id);
    return string.Join(" | ", seen);
}, "PENx3");
Check("modules: every platform starts empty", () =>
{
    var a = CommercePlatform.Create(); a.Catalogue.Upsert("PEN", "Pen", Ghs(1m)); a.Inventory.Restock("PEN", 5);
    var b = CommercePlatform.Create();
    return (b.Inventory.Available("PEN"), b.Catalogue.Find("PEN") is null);
}, (0, true));

// ---- Boundaries ----
CheckSeq("boundaries: no module reaches into another module's internals", () => Modules.InternalLeaks(), []);
CheckSeq("boundaries: Ordering never calls Inventory directly", () => Modules.Uses("Ordering", typeof(IInventoryApi), typeof(Shop.Inventory.Internal.InventoryModule)), []);
CheckSeq("boundaries: Inventory never calls Ordering directly", () => Modules.Uses("Inventory", typeof(IOrderingApi), typeof(OrderingModule), typeof(Order)), []);
`);

const task: ProjectTask = {
  id: 'se-cs-m3-002',
  title: 'Week 10: Commerce Platform',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 3 · Software Architecture & Distributed Thinking',
  tags: ['DDD', 'aggregates', 'value objects', 'modular monolith', 'integration events'],
  prompt:
    'Build a modular monolith with Catalogue (given as the reference module), Ordering and Inventory. Implement a Money value object, an Order ' +
    'aggregate that protects its invariants and raises domain events, an Ordering module that snapshots prices and translates domain events into ' +
    'integration events, and an Inventory module that reserves stock all-or-nothing, tolerates duplicate messages and releases reservations on ' +
    'cancellation. The grader unit-tests the value object and aggregate, runs the modules together over the event bus, and uses reflection to ' +
    'prove no module reaches into another module\'s internals and that Ordering and Inventory cooperate only through events.',
  hints: [
    'Read Catalogue.cs first: Contracts hold a record and an interface; Internal holds the entity and the module class. Ordering and Inventory follow the same shape.',
    'In Order.AddLine, do every check (status, quantity, currency, merged quantity ≤ 10) before changing anything; replace a merged line with `line with { Quantity = merged }` since OrderLine is an immutable record.',
    'OrderingModule.PlaceAsync: call order.Place(), copy order.DomainEvents, clear them, and publish an OrderPlaced (built from the lines) for each OrderSubmitted. Subscribe to StockReserved and StockReservationFailed in the constructor.',
    'InventoryModule keeps Dictionary<Guid, IReadOnlyList<OrderedItem>> of reservations: it makes a duplicate OrderPlaced harmless and tells Release exactly what to put back.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('BuildingBlocks.cs', BUILDING_BLOCKS, { editable: false }),
    pf('Catalogue.cs', CATALOGUE, { editable: false }),
    pf('SharedKernel.cs', MONEY_STARTER),
    pf('Ordering.cs', ORDERING_STARTER),
    pf('Inventory.cs', INVENTORY_STARTER),
    pf('Host.cs', HOST_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('BuildingBlocks.cs', BUILDING_BLOCKS, { editable: false }),
    pf('Catalogue.cs', CATALOGUE, { editable: false }),
    pf('SharedKernel.cs', MONEY_SOLUTION),
    pf('Ordering.cs', ORDERING_SOLUTION),
    pf('Inventory.cs', INVENTORY_SOLUTION),
    pf('Host.cs', HOST_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Commerce platform', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
