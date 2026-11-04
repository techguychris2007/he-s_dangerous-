import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';
import { CS_DEPENDENCY_SCAN } from '../../../csharpTasks/dependencyScan';

const README = `# Week 9 Assignment: Architecture Refactor

\`LegacyOrdersController.cs\` is a real-world shape: one static class that parses JSON, prices products, applies the
discount and approval rules, stores orders in a static dictionary, "sends" e-mail and reads the clock. It works, and
customers depend on every detail of its behaviour — but nothing in it can be tested on its own, and every change risks
everything else.

Rebuild it as a **clean, layered architecture**. Behaviour must stay identical; the structure must not.

| Layer | File | May depend on |
| --- | --- | --- |
| \`Shop.Domain\` | Domain.cs | nothing but .NET |
| \`Shop.Application\` | Application.cs | Domain |
| \`Shop.Infrastructure\` | Infrastructure.cs | Application, Domain |
| \`Shop.Api\` | Api.cs | everything (it is the composition root) |

## Requirements

1. **Domain** — \`Order.Place\` enforces every business rule: a valid e-mail (contains \`@\`, not first or last),
   1–10 lines, quantities 1–99, a **10 % discount** (rounded to cents, away from zero) when the subtotal is **100.00 or
   more**, and \`OrderNeedsApprovalException\` when the total after discount is **over 500.00**. Other broken rules throw
   \`DomainException\` with the same message the legacy code returns. \`Lines\` is a read-only snapshot.
2. **Application** — \`PlaceOrderHandler\` looks prices up through \`IProductCatalogue\` (SKUs are matched in upper case;
   an unknown SKU throws \`ValidationException("Unknown SKU <SKU>.")\`), places the order with the time from the injected
   \`TimeProvider\`, saves it, and only **after** a successful save sends the confirmation through \`IEmailSender\`
   (subject \`Order <id> confirmed\`, body \`Total: <total with 2 decimals>\`). A rejected order is never saved.
   \`GetOrderHandler\` returns an \`OrderDetails\` or \`null\`.
3. **Infrastructure** — an in-memory \`IOrderRepository\` (ids start at 1 for each repository) and an
   \`IProductCatalogue\` with the legacy prices: PEN 2.50, BOOK 12.00, BAG 35.00, LAPTOP 480.00.
4. **Api** — \`OrdersApi\` only translates: JSON in → command, result or exception → status and JSON out. It returns
   exactly what the legacy controller returns for every request (status codes, titles, \`total\` as a string with two
   decimals, \`placedAt\` in UTC as \`yyyy-MM-ddTHH:mm:ssZ\`). \`Composition.Build\` wires the concrete classes.

## Rules the grader enforces

- Responses and e-mails match the legacy controller for a scripted sequence of valid and invalid requests.
- Domain and Application are tested **directly** with fakes — no HTTP, no in-memory database.
- Reflection checks the dependency table above, that handlers depend only on abstractions, that domain types have no
  public setters, that there is no mutable static state in \`Shop.*\`, and that nothing calls the legacy code.

The public types and signatures in the starter files are what the tests use — keep them. Everything else (private
helpers, extra types, constants) is your design.
`;

const LEGACY = `using System.Text.Json.Nodes;

// The original orders controller. Customers depend on every detail of its behaviour, but parsing, pricing,
// storage, e-mail and the clock are all tangled together in one static class.
// It stays in the project as the reference for the characterisation tests. Your new code must not call it.
public static class LegacyOrdersController
{
    public static Func<DateTimeOffset> Now = () => DateTimeOffset.UtcNow;
    public static Dictionary<int, (string Email, decimal Total, DateTimeOffset At)> Orders = new();
    public static List<string> SentMail = new();
    public static int NextId = 1;

    public static void Reset() { Orders.Clear(); SentMail.Clear(); NextId = 1; }

    public static (int Status, string Body) Handle(string method, string path, string? body)
    {
        if (method == "POST" && path == "/orders")
        {
            JsonObject? json;
            try { json = JsonNode.Parse(body ?? "") as JsonObject; } catch (Exception) { json = null; }
            if (json == null) return (400, Problem(400, "Body must be a JSON object."));
            string email = (string?)json["customerEmail"] ?? "";
            if (!email.Contains('@') || email.StartsWith('@') || email.EndsWith('@'))
                return (400, Problem(400, "A valid customerEmail is required."));
            var lines = json["lines"] as JsonArray;
            if (lines == null || lines.Count == 0 || lines.Count > 10) return (400, Problem(400, "An order needs 1 to 10 lines."));
            decimal subtotal = 0;
            foreach (var line in lines)
            {
                string sku = ((string?)line?["sku"] ?? "").ToUpperInvariant();
                int qty = (int?)line?["quantity"] ?? 0;
                if (qty < 1 || qty > 99) return (400, Problem(400, "Quantity must be between 1 and 99."));
                decimal price;
                if (sku == "PEN") price = 2.50m;
                else if (sku == "BOOK") price = 12.00m;
                else if (sku == "BAG") price = 35.00m;
                else if (sku == "LAPTOP") price = 480.00m;
                else return (400, Problem(400, "Unknown SKU " + sku + "."));
                subtotal += price * qty;
            }
            decimal discount = 0;
            if (subtotal >= 100) discount = Math.Round(subtotal * 0.10m, 2, MidpointRounding.AwayFromZero);
            decimal total = subtotal - discount;
            if (total > 500) return (422, Problem(422, "Orders over 500.00 need approval."));
            int id = NextId++;
            DateTimeOffset now = Now();
            Orders[id] = (email, total, now);
            SentMail.Add(email + "|Order " + id + " confirmed|Total: " + total.ToString("F2"));
            return (201, "{\\"id\\":" + id + ",\\"total\\":\\"" + total.ToString("F2") + "\\"}");
        }
        if (method == "GET" && path.StartsWith("/orders/"))
        {
            if (int.TryParse(path.Substring("/orders/".Length), out int id) && Orders.TryGetValue(id, out var o))
                return (200, "{\\"id\\":" + id + ",\\"customerEmail\\":\\"" + o.Email + "\\",\\"total\\":\\"" + o.Total.ToString("F2") +
                    "\\",\\"placedAt\\":\\"" + o.At.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'") + "\\"}");
            return (404, Problem(404, "Order not found."));
        }
        return (404, Problem(404, "Not Found"));
    }

    static string Problem(int status, string title) => "{\\"title\\":\\"" + title + "\\",\\"status\\":" + status + "}";
}
`;

const DOMAIN_STARTER = `namespace Shop.Domain;

// The Domain layer: business concepts and rules. It must not depend on any other layer.

public class DomainException(string message) : Exception(message);

public sealed class OrderNeedsApprovalException(string message) : DomainException(message);

public sealed record OrderLine(string Sku, int Quantity, decimal UnitPrice);

public sealed class Order
{
    public string CustomerEmail { get; } = "";
    public IReadOnlyList<OrderLine> Lines { get; } = [];
    public decimal Subtotal { get; }
    public decimal Discount { get; }
    public decimal Total { get; }
    public DateTimeOffset PlacedAt { get; }

    /// <summary>Creates a valid order or throws a DomainException naming the broken rule.</summary>
    public static Order Place(string customerEmail, IReadOnlyList<OrderLine> lines, DateTimeOffset placedAt) =>
        throw new NotImplementedException();
}
`;

const DOMAIN_SOLUTION = `namespace Shop.Domain;

// The Domain layer: business concepts and rules. It must not depend on any other layer.

/// <summary>A business rule was broken. The message is safe to show to the caller.</summary>
public class DomainException(string message) : Exception(message);

public sealed class OrderNeedsApprovalException(string message) : DomainException(message);

public sealed record OrderLine(string Sku, int Quantity, decimal UnitPrice)
{
    public decimal LineTotal => UnitPrice * Quantity;
}

public sealed class Order
{
    private const int MaxLines = 10, MaxQuantity = 99;
    private const decimal DiscountThreshold = 100m, DiscountRate = 0.10m, ApprovalLimit = 500m;

    private Order(string customerEmail, IReadOnlyList<OrderLine> lines, DateTimeOffset placedAt)
    {
        CustomerEmail = customerEmail;
        Lines = lines;
        PlacedAt = placedAt;
        Subtotal = lines.Sum(l => l.LineTotal);
        Discount = Subtotal >= DiscountThreshold ? Math.Round(Subtotal * DiscountRate, 2, MidpointRounding.AwayFromZero) : 0m;
    }

    public string CustomerEmail { get; }
    public IReadOnlyList<OrderLine> Lines { get; }
    public decimal Subtotal { get; }
    public decimal Discount { get; }
    public decimal Total => Subtotal - Discount;
    public DateTimeOffset PlacedAt { get; }

    /// <summary>Creates a valid order or throws a DomainException naming the broken rule.</summary>
    public static Order Place(string customerEmail, IReadOnlyList<OrderLine> lines, DateTimeOffset placedAt)
    {
        ArgumentNullException.ThrowIfNull(lines);
        if (!IsPlausibleEmail(customerEmail)) throw new DomainException("A valid customerEmail is required.");
        if (lines.Count is 0 or > MaxLines) throw new DomainException("An order needs 1 to 10 lines.");
        if (lines.Any(l => l.Quantity is < 1 or > MaxQuantity)) throw new DomainException("Quantity must be between 1 and 99.");

        var order = new Order(customerEmail, lines.ToList().AsReadOnly(), placedAt);
        if (order.Total > ApprovalLimit) throw new OrderNeedsApprovalException("Orders over 500.00 need approval.");
        return order;
    }

    private static bool IsPlausibleEmail(string? email) =>
        !string.IsNullOrEmpty(email) && email.Contains('@') && !email.StartsWith('@') && !email.EndsWith('@');
}
`;

const APPLICATION_STARTER = `using Shop.Domain;

namespace Shop.Application;

// The Application layer: use cases. It orchestrates the domain through ports (interfaces) that
// Infrastructure implements. It must not know about HTTP, JSON or concrete storage.

/// <summary>The request itself is invalid, for example it names a product that does not exist.</summary>
public sealed class ValidationException(string message) : Exception(message);

public interface IOrderRepository
{
    /// <summary>Stores the order and returns its new id.</summary>
    Task<int> AddAsync(Order order);
    Task<Order?> GetAsync(int id);
}

public interface IProductCatalogue
{
    decimal? PriceOf(string sku);
}

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

public sealed record PlaceOrderLine(string Sku, int Quantity);
public sealed record PlaceOrder(string CustomerEmail, IReadOnlyList<PlaceOrderLine> Lines);
public sealed record OrderPlaced(int OrderId, decimal Total);

public sealed class PlaceOrderHandler(IOrderRepository orders, IProductCatalogue catalogue, IEmailSender email, TimeProvider time)
{
    public Task<OrderPlaced> HandleAsync(PlaceOrder command) => throw new NotImplementedException();
}

public sealed record OrderDetails(int Id, string CustomerEmail, decimal Total, DateTimeOffset PlacedAt);

public sealed class GetOrderHandler(IOrderRepository orders)
{
    public Task<OrderDetails?> HandleAsync(int id) => throw new NotImplementedException();
}
`;

const APPLICATION_SOLUTION = `using Shop.Domain;

namespace Shop.Application;

// The Application layer: use cases. It orchestrates the domain through ports (interfaces) that
// Infrastructure implements. It must not know about HTTP, JSON or concrete storage.

/// <summary>The request itself is invalid, for example it names a product that does not exist.</summary>
public sealed class ValidationException(string message) : Exception(message);

public interface IOrderRepository
{
    /// <summary>Stores the order and returns its new id.</summary>
    Task<int> AddAsync(Order order);
    Task<Order?> GetAsync(int id);
}

public interface IProductCatalogue
{
    decimal? PriceOf(string sku);
}

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

public sealed record PlaceOrderLine(string Sku, int Quantity);
public sealed record PlaceOrder(string CustomerEmail, IReadOnlyList<PlaceOrderLine> Lines);
public sealed record OrderPlaced(int OrderId, decimal Total);

public sealed class PlaceOrderHandler(IOrderRepository orders, IProductCatalogue catalogue, IEmailSender email, TimeProvider time)
{
    public async Task<OrderPlaced> HandleAsync(PlaceOrder command)
    {
        var lines = new List<OrderLine>(command.Lines.Count);
        foreach (var line in command.Lines)
        {
            string sku = line.Sku.ToUpperInvariant();
            decimal price = catalogue.PriceOf(sku) ?? throw new ValidationException($"Unknown SKU {sku}.");
            lines.Add(new OrderLine(sku, line.Quantity, price));
        }

        var order = Order.Place(command.CustomerEmail, lines, time.GetUtcNow());
        int id = await orders.AddAsync(order);
        // Only confirm what was actually stored: if saving throws, no e-mail goes out.
        await email.SendAsync(order.CustomerEmail, $"Order {id} confirmed", $"Total: {order.Total:F2}");
        return new OrderPlaced(id, order.Total);
    }
}

public sealed record OrderDetails(int Id, string CustomerEmail, decimal Total, DateTimeOffset PlacedAt);

public sealed class GetOrderHandler(IOrderRepository orders)
{
    public async Task<OrderDetails?> HandleAsync(int id) =>
        await orders.GetAsync(id) is { } order ? new OrderDetails(id, order.CustomerEmail, order.Total, order.PlacedAt) : null;
}
`;

const INFRA_STARTER = `using Shop.Application;
using Shop.Domain;

namespace Shop.Infrastructure;

// The Infrastructure layer: concrete implementations of the Application's ports.

public sealed class InMemoryOrderRepository : IOrderRepository
{
    public Task<int> AddAsync(Order order) => throw new NotImplementedException();
    public Task<Order?> GetAsync(int id) => throw new NotImplementedException();
}

public sealed class InMemoryProductCatalogue : IProductCatalogue
{
    public decimal? PriceOf(string sku) => throw new NotImplementedException();
}
`;

const INFRA_SOLUTION = `using Shop.Application;
using Shop.Domain;

namespace Shop.Infrastructure;

// The Infrastructure layer: concrete implementations of the Application's ports.

public sealed class InMemoryOrderRepository : IOrderRepository
{
    private readonly Dictionary<int, Order> _orders = [];
    private int _lastId;

    public Task<int> AddAsync(Order order)
    {
        int id = ++_lastId;
        _orders[id] = order;
        return Task.FromResult(id);
    }

    public Task<Order?> GetAsync(int id) => Task.FromResult(_orders.GetValueOrDefault(id));
}

public sealed class InMemoryProductCatalogue : IProductCatalogue
{
    private readonly Dictionary<string, decimal> _prices = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PEN"] = 2.50m, ["BOOK"] = 12.00m, ["BAG"] = 35.00m, ["LAPTOP"] = 480.00m,
    };

    public decimal? PriceOf(string sku) => _prices.TryGetValue(sku, out var price) ? price : null;
}
`;

const API_STARTER = `using Shop.Application;

namespace Shop.Api;

// The Api layer: the HTTP edge and the composition root.

public sealed class OrdersApi(PlaceOrderHandler placeOrder, GetOrderHandler getOrder)
{
    public Task<(int Status, string Body)> HandleAsync(string method, string path, string? body) =>
        throw new NotImplementedException();
}

public static class Composition
{
    /// <summary>Builds a fully wired API with its own, empty storage.</summary>
    public static OrdersApi Build(IEmailSender email, TimeProvider time) => throw new NotImplementedException();
}
`;

const API_SOLUTION = `using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using Shop.Application;
using Shop.Domain;
using Shop.Infrastructure;

namespace Shop.Api;

// The Api layer: the HTTP edge and the composition root.

/// <summary>Translates requests into commands and queries, and results or exceptions into responses. No business rules.</summary>
public sealed class OrdersApi(PlaceOrderHandler placeOrder, GetOrderHandler getOrder)
{
    public async Task<(int Status, string Body)> HandleAsync(string method, string path, string? body)
    {
        if (method == "POST" && path == "/orders") return await PostAsync(body);
        if (method == "GET" && path.StartsWith("/orders/"))
        {
            if (int.TryParse(path["/orders/".Length..], out int id) && await getOrder.HandleAsync(id) is { } order)
                return (200, new JsonObject
                {
                    ["id"] = order.Id,
                    ["customerEmail"] = order.CustomerEmail,
                    ["total"] = Money(order.Total),
                    ["placedAt"] = order.PlacedAt.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture),
                }.ToJsonString());
            return Problem(404, "Order not found.");
        }
        return Problem(404, "Not Found");
    }

    private async Task<(int, string)> PostAsync(string? body)
    {
        if (ParseCommand(body) is not { } command) return Problem(400, "Body must be a JSON object.");
        try
        {
            var placed = await placeOrder.HandleAsync(command);
            return (201, new JsonObject { ["id"] = placed.OrderId, ["total"] = Money(placed.Total) }.ToJsonString());
        }
        catch (OrderNeedsApprovalException e) { return Problem(422, e.Message); }
        catch (DomainException e) { return Problem(400, e.Message); }
        catch (ValidationException e) { return Problem(400, e.Message); }
    }

    private static PlaceOrder? ParseCommand(string? body)
    {
        JsonObject? json;
        try { json = JsonNode.Parse(body ?? "") as JsonObject; }
        catch (JsonException) { return null; }
        if (json is null) return null;

        var lines = (json["lines"] as JsonArray ?? new JsonArray())
            .Select(l => new PlaceOrderLine((string?)l?["sku"] ?? "", (int?)l?["quantity"] ?? 0))
            .ToList();
        return new PlaceOrder((string?)json["customerEmail"] ?? "", lines);
    }

    private static string Money(decimal amount) => amount.ToString("F2", CultureInfo.InvariantCulture);

    private static (int, string) Problem(int status, string title) =>
        (status, new JsonObject { ["title"] = title, ["status"] = status }.ToJsonString());
}

/// <summary>The composition root: the only place that knows every concrete class.</summary>
public static class Composition
{
    public static OrdersApi Build(IEmailSender email, TimeProvider time)
    {
        var orders = new InMemoryOrderRepository();
        var placeOrder = new PlaceOrderHandler(orders, new InMemoryProductCatalogue(), email, time);
        return new OrdersApi(placeOrder, new GetOrderHandler(orders));
    }
}
`;

const PROGRAM = `using Shop.Api;

var api = Composition.Build(new ConsoleEmailSender(), TimeProvider.System);
var placed = await api.HandleAsync("POST", "/orders", """{ "customerEmail": "ama@example.com", "lines": [ { "sku": "BOOK", "quantity": 9 } ] }""");
Console.WriteLine($"{placed.Status} {placed.Body}");
Console.WriteLine((await api.HandleAsync("GET", "/orders/1", null)).Body);
Console.WriteLine((await api.HandleAsync("POST", "/orders", """{ "customerEmail": "ama@example.com", "lines": [ { "sku": "LAPTOP", "quantity": 2 } ] }""")).Body);

sealed class ConsoleEmailSender : Shop.Application.IEmailSender
{
    public Task SendAsync(string to, string subject, string body)
    {
        Console.WriteLine($"mail to {to}: {subject} ({body})");
        return Task.CompletedTask;
    }
}
`;

const TESTS = `using System.Reflection;
using System.Text.Json.Nodes;
using Shop.Api;
using Shop.Application;
using Shop.Domain;

public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}

public sealed class RecordingEmail : IEmailSender
{
    public List<string> Sent { get; } = [];
    public Task SendAsync(string to, string subject, string body) { Sent.Add(to + "|" + subject + "|" + body); return Task.CompletedTask; }
}

public sealed class FakeOrders : IOrderRepository
{
    public List<Order> Saved { get; } = [];
    public bool Fail { get; set; }
    public Task<int> AddAsync(Order order)
    {
        if (Fail) throw new IOException("database unavailable");
        Saved.Add(order);
        return Task.FromResult(40 + Saved.Count);
    }
    public Task<Order?> GetAsync(int id) => Task.FromResult(id > 40 && id - 41 < Saved.Count ? Saved[id - 41] : null);
}

public sealed class FakeCatalogue : IProductCatalogue
{
    public decimal? PriceOf(string sku) => sku == "WIDGET" ? 60m : null;
}

static class Arch
{
    public static IEnumerable<Type> Layer(string name) => typeof(Order).Assembly.GetTypes().Where(t => t.Namespace == "Shop." + name);

    public static List<string> Violations(string layer, params string[] forbiddenLayers) =>
        Layer(layer)
            .SelectMany(t => Dependencies.Of(t)
                .Where(d => d == typeof(LegacyOrdersController) || forbiddenLayers.Any(f => d.Namespace == "Shop." + f))
                .Select(d => Dependencies.Outer(t).Name + " -> " + Dependencies.Named(d)))
            .Distinct().OrderBy(s => s, StringComparer.Ordinal).ToList();

    public static List<string> MutableStatics() =>
        typeof(Order).Assembly.GetTypes().Where(t => t.Namespace?.StartsWith("Shop.") == true)
            .SelectMany(t => t.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.DeclaredOnly)
                .Where(f => !f.IsInitOnly && !f.IsLiteral && !f.Name.Contains('<') && !Dependencies.Outer(t).Name.Contains('<'))
                .Select(f => Dependencies.Outer(t).Name + "." + f.Name))
            .ToList();
}
` + CS_DEPENDENCY_SCAN + csTests(`
var t0 = new DateTimeOffset(2026, 9, 14, 8, 30, 0, TimeSpan.Zero);
JsonObject L(string sku, int qty) => new() { ["sku"] = sku, ["quantity"] = qty };
string Body(string email, params JsonObject[] lines) => new JsonObject { ["customerEmail"] = email, ["lines"] = new JsonArray(lines) }.ToJsonString();
OrderLine Line(decimal price, int qty = 1) => new("SKU", qty, price);

// ---- Domain: plain unit tests, no infrastructure ----
Check("domain: subtotal, discount, total", () => { var o = Order.Place("ama@example.com", [new OrderLine("BOOK", 9, 12m)], t0); return (o.Subtotal, o.Discount, o.Total, o.PlacedAt); }, (108m, 10.80m, 97.20m, t0));
Check("domain: discount starts at exactly 100.00", () => Order.Place("a@b.c", [Line(100m)], t0).Discount, 10.00m);
Check("domain: no discount below 100.00", () => Order.Place("a@b.c", [Line(99.99m)], t0).Discount, 0m);
Check("domain: total of exactly 500.00 is allowed", () => Order.Place("a@b.c", [Line(555.56m)], t0).Total, 500.00m);
Throws<OrderNeedsApprovalException>("domain: total over 500.00 needs approval", () => Order.Place("a@b.c", [Line(555.57m)], t0));
Expect("domain: invalid orders throw DomainException", () =>
{
    var bad = new Action[]
    {
        () => Order.Place("no-at-sign", [Line(5m)], t0),
        () => Order.Place("@example.com", [Line(5m)], t0),
        () => Order.Place("a@b.c", [], t0),
        () => Order.Place("a@b.c", Enumerable.Range(0, 11).Select(_ => Line(1m)).ToList(), t0),
        () => Order.Place("a@b.c", [Line(1m, 0)], t0),
        () => Order.Place("a@b.c", [Line(1m, 100)], t0),
    };
    return bad.All(a => { try { a(); return false; } catch (OrderNeedsApprovalException) { return false; } catch (DomainException) { return true; } });
}, "bad e-mail, 0 or 11 lines and quantities 0 or 100 must each throw DomainException (not another exception type)");
Expect("domain: lines are a read-only snapshot", () =>
{
    var lines = new List<OrderLine> { Line(5m) };
    var o = Order.Place("a@b.c", lines, t0);
    lines.Add(Line(7m));
    return o.Lines.Count == 1 && o.Lines is not ICollection<OrderLine> { IsReadOnly: false };
}, "copy the lines when the order is placed and expose them read-only");

// ---- Application: handlers tested with fakes ----
await ExpectAsync("handler: places, saves and confirms", async () =>
{
    var repo = new FakeOrders(); var mail = new RecordingEmail(); var time = new TestTime(t0);
    var placed = await new PlaceOrderHandler(repo, new FakeCatalogue(), mail, time).HandleAsync(new PlaceOrder("ama@example.com", [new PlaceOrderLine("WIDGET", 2)]));
    return placed == new OrderPlaced(41, 108m) && repo.Saved.Count == 1 && repo.Saved[0].PlacedAt == t0
        && mail.Sent.SequenceEqual(["ama@example.com|Order 41 confirmed|Total: 108.00"]);
}, "expected OrderPlaced(41, 108), one saved order stamped with the injected time, and one confirmation e-mail");
await CheckAsync("handler: SKUs are matched in upper case", async () =>
    (await new PlaceOrderHandler(new FakeOrders(), new FakeCatalogue(), new RecordingEmail(), new TestTime(t0)).HandleAsync(new PlaceOrder("a@b.c", [new PlaceOrderLine("widget", 1)]))).Total, 60m);
await ExpectAsync("handler: unknown SKU", async () =>
{
    var repo = new FakeOrders(); var mail = new RecordingEmail();
    try { await new PlaceOrderHandler(repo, new FakeCatalogue(), mail, new TestTime(t0)).HandleAsync(new PlaceOrder("a@b.c", [new PlaceOrderLine("gadget", 1)])); return false; }
    catch (ValidationException e) { return e.Message == "Unknown SKU GADGET." && repo.Saved.Count == 0 && mail.Sent.Count == 0; }
}, "throw ValidationException(\\"Unknown SKU GADGET.\\") and save or send nothing");
await ExpectAsync("handler: rejected order is not saved", async () =>
{
    var repo = new FakeOrders(); var mail = new RecordingEmail();
    try { await new PlaceOrderHandler(repo, new FakeCatalogue(), mail, new TestTime(t0)).HandleAsync(new PlaceOrder("a@b.c", [new PlaceOrderLine("WIDGET", 10)])); return false; }
    catch (OrderNeedsApprovalException) { return repo.Saved.Count == 0 && mail.Sent.Count == 0; }
}, "an order needing approval must throw before anything is saved or sent");
await ExpectAsync("handler: no e-mail when saving fails", async () =>
{
    var mail = new RecordingEmail();
    try { await new PlaceOrderHandler(new FakeOrders { Fail = true }, new FakeCatalogue(), mail, new TestTime(t0)).HandleAsync(new PlaceOrder("a@b.c", [new PlaceOrderLine("WIDGET", 1)])); return false; }
    catch (IOException) { return mail.Sent.Count == 0; }
}, "let the repository's exception propagate and never confirm an order that was not stored");
await CheckAsync("query handler", async () =>
{
    var repo = new FakeOrders();
    await repo.AddAsync(Order.Place("kofi@example.com", [Line(20m)], t0));
    var handler = new GetOrderHandler(repo);
    return (await handler.HandleAsync(41), await handler.HandleAsync(42));
}, (new OrderDetails(41, "kofi@example.com", 20m, t0), (OrderDetails?)null));

// ---- Characterisation: the new system behaves exactly like the legacy controller ----
var script = new List<(string Method, string Path, string? Body)>
{
    ("POST", "/orders", Body("ama@example.com", L("PEN", 4))),
    ("POST", "/orders", Body("kofi@example.com", L("BOOK", 9))),
    ("POST", "/orders", Body("esi@example.com", L("pen", 2), L("Bag", 3))),
    ("POST", "/orders", Body("yaw@example.com", L("LAPTOP", 2))),
    ("POST", "/orders", Body("no-at-sign", L("PEN", 1))),
    ("POST", "/orders", Body("@example.com", L("PEN", 1))),
    ("POST", "/orders", Body("ama@example.com")),
    ("POST", "/orders", """{"customerEmail":"ama@example.com"}"""),
    ("POST", "/orders", Body("ama@example.com", Enumerable.Range(0, 11).Select(_ => L("PEN", 1)).ToArray())),
    ("POST", "/orders", Body("ama@example.com", L("PEN", 0))),
    ("POST", "/orders", Body("ama@example.com", L("PEN", 100))),
    ("POST", "/orders", """{"customerEmail":"ama@example.com","lines":[{"sku":"PEN"}]}"""),
    ("POST", "/orders", Body("ama@example.com", L("Pencil", 1))),
    ("POST", "/orders", "not json"),
    ("POST", "/orders", "[1, 2]"),
    ("POST", "/orders", Body("kwame@example.com", L("LAPTOP", 1), L("PEN", 1))),
    ("POST", "/orders", Body("adjoa@example.com", L("LAPTOP", 1), L("BAG", 2), L("PEN", 2))),
    ("GET", "/orders/1", null),
    ("GET", "/orders/4", null),
    ("GET", "/orders/5", null),
    ("GET", "/orders/6", null),
    ("GET", "/orders/abc", null),
    ("GET", "/products", null),
};

async Task<(List<(int Status, string Body)> Fresh, List<(int Status, string Body)> Legacy, List<string> FreshMail, List<string> LegacyMail, bool LegacyUntouched)> RunBoth()
{
    LegacyOrdersController.Reset();
    var mail = new RecordingEmail(); var time = new TestTime(t0);
    var api = Composition.Build(mail, time);
    var fresh = new List<(int, string)>();
    for (int i = 0; i < script.Count; i++)
    {
        time.Now = t0.AddMinutes(7 * i);
        fresh.Add(await api.HandleAsync(script[i].Method, script[i].Path, script[i].Body));
    }
    bool untouched = LegacyOrdersController.NextId == 1 && LegacyOrdersController.Orders.Count == 0 && LegacyOrdersController.SentMail.Count == 0;
    var legacy = new List<(int, string)>();
    for (int i = 0; i < script.Count; i++)
    {
        var at = t0.AddMinutes(7 * i);
        LegacyOrdersController.Now = () => at;
        legacy.Add(LegacyOrdersController.Handle(script[i].Method, script[i].Path, script[i].Body));
    }
    return (fresh, legacy, mail.Sent, LegacyOrdersController.SentMail.ToList(), untouched);
}
Task<(List<(int Status, string Body)> Fresh, List<(int Status, string Body)> Legacy, List<string> FreshMail, List<string> LegacyMail, bool LegacyUntouched)>? both = null;

bool SameJson(string a, string b) { try { return JsonNode.DeepEquals(JsonNode.Parse(a), JsonNode.Parse(b)); } catch (Exception) { return false; } }
async Task<string> FirstDifference(string method)
{
    var r = await (both ??= RunBoth());
    for (int i = 0; i < script.Count; i++)
    {
        if (script[i].Method != method) continue;
        if (r.Fresh[i].Status != r.Legacy[i].Status || !SameJson(r.Fresh[i].Body, r.Legacy[i].Body))
            return $"{script[i].Method} {script[i].Path} {script[i].Body}: got {r.Fresh[i].Status} {r.Fresh[i].Body}, legacy returns {r.Legacy[i].Status} {r.Legacy[i].Body}";
    }
    return "";
}

await CheckAsync("legacy parity: every POST", () => FirstDifference("POST"), "");
await CheckAsync("legacy parity: every GET", () => FirstDifference("GET"), "");
await ExpectAsync("legacy parity: confirmation e-mails", async () => { var r = await (both ??= RunBoth()); return r.FreshMail.SequenceEqual(r.LegacyMail); }, "the same e-mails, in the same order, as the legacy controller sends");
await ExpectAsync("new code never calls the legacy controller", async () => (await (both ??= RunBoth())).LegacyUntouched, "running your API changed the legacy controller's static state");
await CheckAsync("each composed API has its own storage", async () =>
{
    var a = Composition.Build(new RecordingEmail(), new TestTime(t0));
    var b = Composition.Build(new RecordingEmail(), new TestTime(t0));
    await a.HandleAsync("POST", "/orders", Body("ama@example.com", L("PEN", 1)));
    return (await b.HandleAsync("GET", "/orders/1", null)).Status;
}, 404);

// ---- Architecture: the dependency rule, checked with reflection ----
CheckSeq("architecture: Domain depends on no other layer", () => Arch.Violations("Domain", "Application", "Infrastructure", "Api"), []);
CheckSeq("architecture: Application does not depend on Infrastructure or Api", () => Arch.Violations("Application", "Infrastructure", "Api"), []);
CheckSeq("architecture: Infrastructure does not depend on Api", () => Arch.Violations("Infrastructure", "Api"), []);
CheckSeq("architecture: handlers depend only on abstractions", () =>
    Arch.Layer("Application").Where(t => t.Name.EndsWith("Handler"))
        .SelectMany(t => t.GetConstructors().SelectMany(c => c.GetParameters()))
        .Where(p => !p.ParameterType.IsInterface && !p.ParameterType.IsAbstract)
        .Select(p => p.Member.DeclaringType!.Name + "(" + p.ParameterType.Name + ")"), []);
CheckSeq("architecture: domain types have no public setters", () =>
    Arch.Layer("Domain").SelectMany(t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly))
        .Where(p => p.SetMethod is { IsPublic: true } s && !s.ReturnParameter.GetRequiredCustomModifiers().Contains(typeof(System.Runtime.CompilerServices.IsExternalInit)))
        .Select(p => p.DeclaringType!.Name + "." + p.Name), []);
CheckSeq("architecture: no mutable static state", () => Arch.MutableStatics(), []);
`);

const task: ProjectTask = {
  id: 'se-cs-m3-001',
  title: 'Week 9: Architecture Refactor',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 3 · Software Architecture & Distributed Thinking',
  tags: ['clean architecture', 'dependency rule', 'ports and adapters', 'characterisation tests', 'CQRS'],
  prompt:
    'A static orders controller mixes JSON parsing, pricing, discount and approval rules, storage, e-mail and the clock in one class. ' +
    'Rebuild it as Domain, Application, Infrastructure and Api layers: business rules inside the Order aggregate, use-case handlers that ' +
    'talk to ports, in-memory adapters, and a thin HTTP edge with a composition root. The grader replays a scripted conversation against ' +
    'your API and the legacy controller and requires identical responses and e-mails, unit-tests the domain and handlers with fakes, and ' +
    'uses reflection to enforce the dependency rule, abstraction-only handlers, no public domain setters and no mutable static state.',
  hints: [
    'Start in the domain: move the validation, discount and approval rules from the legacy method into Order.Place, keeping the legacy messages word for word. Make the constructor private so Place is the only way to create an order.',
    'PlaceOrderHandler upper-cases each SKU, looks up its price (unknown → ValidationException), calls Order.Place with time.GetUtcNow(), saves, then sends the e-mail. Saving last-but-one means a rejected order never consumes an id — exactly like the legacy NextId++.',
    'OrdersApi catches the exceptions and maps them: OrderNeedsApprovalException → 422, DomainException and ValidationException → 400. A missing "lines" array becomes an empty list and a missing quantity becomes 0, so the domain reports the legacy message.',
    'Build JSON with JsonObject { ... }.ToJsonString() rather than string concatenation; the parity check compares parsed JSON, so property order and spacing do not matter but values and types do (totals are strings with two decimals).',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('LegacyOrdersController.cs', LEGACY, { editable: false }),
    pf('Domain.cs', DOMAIN_STARTER),
    pf('Application.cs', APPLICATION_STARTER),
    pf('Infrastructure.cs', INFRA_STARTER),
    pf('Api.cs', API_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('LegacyOrdersController.cs', LEGACY, { editable: false }),
    pf('Domain.cs', DOMAIN_SOLUTION),
    pf('Application.cs', APPLICATION_SOLUTION),
    pf('Infrastructure.cs', INFRA_SOLUTION),
    pf('Api.cs', API_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Orders API', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
