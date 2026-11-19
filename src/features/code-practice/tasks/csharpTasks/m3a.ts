import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 3 · Architecture';

/** Month 3, weeks 9–10 tasks (lessons dn3-1 … dn3-4). */
export const CSHARP_MONTH3_A_TASKS: CodeTask[] = [
  {
    id: 'cs-3-01',
    title: 'Ports and Adapters',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement the RegisterMember use case so it depends only on ports. RegisterMemberHandler receives IMemberRepository, IWelcomeSender and ' +
      'a TimeProvider. HandleAsync(email, name): reject a blank name or an email without "@" (Result.Invalid), reject an email already registered ' +
      'ignoring case (Result.Duplicate), otherwise save a Member with a new id, the email lower-cased, and JoinedOn = today (UTC), send the welcome, ' +
      'and return Result.Registered(id). Also implement InMemoryMemberRepository, an adapter for the port. The handler must not know any ' +
      'concrete adapter type.',
    starterCode: `public sealed record Member(Guid Id, string Email, string Name, DateOnly JoinedOn);

public interface IMemberRepository
{
    Task<Member?> FindByEmailAsync(string email, CancellationToken ct);
    Task AddAsync(Member member, CancellationToken ct);
}

public interface IWelcomeSender
{
    Task SendAsync(Member member, CancellationToken ct);
}

public abstract record Result
{
    public sealed record Registered(Guid Id) : Result;
    public sealed record Duplicate : Result;
    public sealed record Invalid(string Reason) : Result;
}

public sealed class RegisterMemberHandler(IMemberRepository members, IWelcomeSender welcome, TimeProvider time)
{
    public Task<Result> HandleAsync(string email, string name, CancellationToken ct) => throw new NotImplementedException();
}

public sealed class InMemoryMemberRepository : IMemberRepository
{
    public Task<Member?> FindByEmailAsync(string email, CancellationToken ct) => throw new NotImplementedException();
    public Task AddAsync(Member member, CancellationToken ct) => throw new NotImplementedException();
}
`,
    hints: [
      'The repository adapter can be a Dictionary<string, Member> keyed by email with StringComparer.OrdinalIgnoreCase.',
      'Validate first, then check for a duplicate, then build the Member, save it, and only then send the welcome.',
      'Today: DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime).',
    ],
    solution: `public sealed record Member(Guid Id, string Email, string Name, DateOnly JoinedOn);

public interface IMemberRepository
{
    Task<Member?> FindByEmailAsync(string email, CancellationToken ct);
    Task AddAsync(Member member, CancellationToken ct);
}

public interface IWelcomeSender
{
    Task SendAsync(Member member, CancellationToken ct);
}

public abstract record Result
{
    public sealed record Registered(Guid Id) : Result;
    public sealed record Duplicate : Result;
    public sealed record Invalid(string Reason) : Result;
}

public sealed class RegisterMemberHandler(IMemberRepository members, IWelcomeSender welcome, TimeProvider time)
{
    public async Task<Result> HandleAsync(string email, string name, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name)) return new Result.Invalid("A name is required.");
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return new Result.Invalid("A valid email is required.");
        string normalised = email.Trim().ToLowerInvariant();
        if (await members.FindByEmailAsync(normalised, ct) is not null) return new Result.Duplicate();
        var member = new Member(Guid.NewGuid(), normalised, name.Trim(), DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime));
        await members.AddAsync(member, ct);
        await welcome.SendAsync(member, ct);
        return new Result.Registered(member.Id);
    }
}

public sealed class InMemoryMemberRepository : IMemberRepository
{
    private readonly Dictionary<string, Member> _byEmail = new(StringComparer.OrdinalIgnoreCase);
    public Task<Member?> FindByEmailAsync(string email, CancellationToken ct) => Task.FromResult(_byEmail.GetValueOrDefault(email));
    public Task AddAsync(Member member, CancellationToken ct) { _byEmail.Add(member.Email, member); return Task.CompletedTask; }
}
`,
    testCode: `public sealed class SpyWelcome : IWelcomeSender
{
    public List<Member> Sent { get; } = [];
    public Task SendAsync(Member member, CancellationToken ct) { Sent.Add(member); return Task.CompletedTask; }
}
public sealed class TestTime(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
` + csTests(`
var none = CancellationToken.None;
var time = new TestTime(new DateTimeOffset(2026, 9, 1, 22, 0, 0, TimeSpan.Zero));
(RegisterMemberHandler H, InMemoryMemberRepository Repo, SpyWelcome Spy) Setup() { var r = new InMemoryMemberRepository(); var s = new SpyWelcome(); return (new RegisterMemberHandler(r, s, time), r, s); }
await ExpectAsync("registers", async () => await Setup().H.HandleAsync("Ama@Example.com", "Ama", none) is Result.Registered, "expected Registered");
await CheckAsync("email lower-cased and saved", async () => { var s = Setup(); await s.H.HandleAsync("Ama@Example.com", " Ama ", none); var m = await s.Repo.FindByEmailAsync("ama@example.com", none); return (m?.Email, m?.Name, m?.JoinedOn); }, ("ama@example.com", "Ama", (DateOnly?)new DateOnly(2026, 9, 1)));
await ExpectAsync("duplicate ignoring case", async () => { var s = Setup(); await s.H.HandleAsync("ama@example.com", "Ama", none); return await s.H.HandleAsync("AMA@EXAMPLE.COM", "Other", none) is Result.Duplicate; }, "expected Duplicate");
await ExpectAsync("invalid email", async () => await Setup().H.HandleAsync("not-an-email", "X", none) is Result.Invalid, "expected Invalid");
await ExpectAsync("blank name", async () => await Setup().H.HandleAsync("a@b.c", "  ", none) is Result.Invalid, "expected Invalid");
await CheckAsync("welcome sent once", async () => { var s = Setup(); await s.H.HandleAsync("a@b.c", "A", none); await s.H.HandleAsync("a@b.c", "A", none); return s.Spy.Sent.Count; }, 1);
await CheckAsync("no welcome when invalid", async () => { var s = Setup(); await s.H.HandleAsync("bad", "A", none); return s.Spy.Sent.Count; }, 0);
Expect("handler depends only on ports", () => typeof(RegisterMemberHandler).GetConstructors().Single().GetParameters().All(p => p.ParameterType.IsInterface || p.ParameterType == typeof(TimeProvider)), "constructor parameters must be interfaces (ports) or TimeProvider");
`),
  },
  {
    id: 'cs-3-02',
    title: 'Enforce the Dependency Rule',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Write an architecture checker. ArchitectureRules.Violations(references) takes project → referenced projects (e.g. "Shop.Domain" → []). ' +
      'Each project\'s layer is its last name segment: Domain may reference nothing; Application only Domain; Infrastructure only Application and ' +
      'Domain; Web anything. Report "<from> -> <to>" for every forbidden reference, sorted. Also report every reference cycle once as ' +
      '"cycle: A -> B -> A" starting from the alphabetically smallest project in the cycle (and listed in sorted order). Unknown layers are a ' +
      'violation "<project>: unknown layer".',
    starterCode: `public static class ArchitectureRules
{
    public static List<string> Violations(Dictionary<string, string[]> references) => throw new NotImplementedException();
}
`,
    hints: [
      'Layer = name[(name.LastIndexOf(\'.\') + 1)..]. Store the allowed target layers per layer in a dictionary.',
      'For cycles, run a depth-first search keeping the current path; when you reach a project already on the path, the cycle is the path from that project onward.',
      'Normalise each cycle by rotating it so the smallest name comes first, then de-duplicate with a HashSet<string>.',
    ],
    solution: `public static class ArchitectureRules
{
    private static readonly Dictionary<string, string[]> Allowed = new()
    {
        ["Domain"] = [],
        ["Application"] = ["Domain"],
        ["Infrastructure"] = ["Application", "Domain"],
        ["Web"] = ["Web", "Infrastructure", "Application", "Domain"],
    };

    private static string Layer(string project) => project[(project.LastIndexOf('.') + 1)..];

    public static List<string> Violations(Dictionary<string, string[]> references)
    {
        var problems = new List<string>();
        foreach (var (from, targets) in references)
        {
            if (!Allowed.TryGetValue(Layer(from), out var allowed)) { problems.Add($"{from}: unknown layer"); continue; }
            foreach (var to in targets)
                if (!allowed.Contains(Layer(to))) problems.Add($"{from} -> {to}");
        }
        problems.Sort(StringComparer.Ordinal);

        var cycles = new SortedSet<string>(StringComparer.Ordinal);
        var path = new List<string>();
        var onPath = new HashSet<string>();
        var done = new HashSet<string>();
        void Visit(string node)
        {
            if (done.Contains(node)) return;
            path.Add(node); onPath.Add(node);
            foreach (var next in references.GetValueOrDefault(node) ?? [])
            {
                if (onPath.Contains(next))
                {
                    var cycle = path.Skip(path.IndexOf(next)).ToList();
                    int start = cycle.IndexOf(cycle.Min(StringComparer.Ordinal)!);
                    var rotated = cycle.Skip(start).Concat(cycle.Take(start)).ToList();
                    cycles.Add("cycle: " + string.Join(" -> ", rotated.Append(rotated[0])));
                }
                else Visit(next);
            }
            path.RemoveAt(path.Count - 1); onPath.Remove(node); done.Add(node);
        }
        foreach (var project in references.Keys.OrderBy(k => k, StringComparer.Ordinal)) Visit(project);
        problems.AddRange(cycles);
        return problems;
    }
}
`,
    testCode: csTests(`
var clean = new Dictionary<string, string[]>
{
    ["Shop.Domain"] = [], ["Shop.Application"] = ["Shop.Domain"],
    ["Shop.Infrastructure"] = ["Shop.Application", "Shop.Domain"], ["Shop.Web"] = ["Shop.Infrastructure", "Shop.Application"],
};
CheckSeq("clean architecture", () => ArchitectureRules.Violations(clean), []);
CheckSeq("domain referencing infrastructure", () => ArchitectureRules.Violations(new() { ["Shop.Domain"] = ["Shop.Infrastructure"], ["Shop.Infrastructure"] = [] }),
    ["Shop.Domain -> Shop.Infrastructure"]);
CheckSeq("application referencing web", () => ArchitectureRules.Violations(new() { ["A.Application"] = ["A.Web", "A.Domain"], ["A.Web"] = [], ["A.Domain"] = [] }), ["A.Application -> A.Web"]);
CheckSeq("unknown layer", () => ArchitectureRules.Violations(new() { ["Shop.Utils"] = [] }), ["Shop.Utils: unknown layer"]);
CheckSeq("cycle reported once, smallest first", () => ArchitectureRules.Violations(new() { ["B.Web"] = ["A.Web"], ["A.Web"] = ["C.Web"], ["C.Web"] = ["B.Web"] }),
    ["cycle: A.Web -> C.Web -> B.Web -> A.Web"]);
CheckSeq("violations sorted then cycles", () => ArchitectureRules.Violations(new() { ["X.Domain"] = ["X.Application"], ["X.Application"] = ["X.Domain"] }),
    ["X.Domain -> X.Application", "cycle: X.Application -> X.Domain -> X.Application"]);
`),
  },
  {
    id: 'cs-3-03',
    title: 'A CQRS Dispatcher with Pipeline Behaviours',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Build a minimal mediator. Dispatcher.Register<TRequest, TResult>(handler) registers one handler per request type (a second registration ' +
      'throws InvalidOperationException). AddBehavior(behavior) adds a pipeline behaviour: a Func<object, Func<Task<object?>>, Task<object?>> that ' +
      'receives the request and a "next" delegate. SendAsync<TResult>(request) runs the behaviours in the order they were added around the handler ' +
      'and returns its result; an unregistered request type throws InvalidOperationException. Behaviours can short-circuit (e.g. validation).',
    starterCode: `public sealed class Dispatcher
{
    public void Register<TRequest, TResult>(Func<TRequest, Task<TResult>> handler) => throw new NotImplementedException();

    public void AddBehavior(Func<object, Func<Task<object?>>, Task<object?>> behavior) => throw new NotImplementedException();

    public Task<TResult> SendAsync<TResult>(object request) => throw new NotImplementedException();
}
`,
    hints: [
      'Store handlers as Dictionary<Type, Func<object, Task<object?>>>, wrapping the typed handler: async r => await handler((TRequest)r).',
      'Build the chain from the innermost handler outwards over the behaviours in reverse order — the same technique as the middleware pipeline in Month 2.',
      'Cast the final object back with (TResult)result!.',
    ],
    solution: `public sealed class Dispatcher
{
    private readonly Dictionary<Type, Func<object, Task<object?>>> _handlers = [];
    private readonly List<Func<object, Func<Task<object?>>, Task<object?>>> _behaviors = [];

    public void Register<TRequest, TResult>(Func<TRequest, Task<TResult>> handler)
    {
        if (!_handlers.TryAdd(typeof(TRequest), async request => await handler((TRequest)request)))
            throw new InvalidOperationException($"A handler for {typeof(TRequest).Name} is already registered.");
    }

    public void AddBehavior(Func<object, Func<Task<object?>>, Task<object?>> behavior) => _behaviors.Add(behavior);

    public async Task<TResult> SendAsync<TResult>(object request)
    {
        if (!_handlers.TryGetValue(request.GetType(), out var handler))
            throw new InvalidOperationException($"No handler for {request.GetType().Name}.");
        Func<Task<object?>> next = () => handler(request);
        for (int i = _behaviors.Count - 1; i >= 0; i--)
        {
            var behavior = _behaviors[i];
            var inner = next;
            next = () => behavior(request, inner);
        }
        return (TResult)(await next())!;
    }
}
`,
    testCode: `public sealed record PlaceOrder(string Sku, int Quantity);
public sealed record GetStock(string Sku);
public sealed class ValidationFailed(string message) : Exception(message);
` + csTests(`
Dispatcher Setup(List<string> log)
{
    var d = new Dispatcher();
    var stock = new Dictionary<string, int> { ["PEN"] = 10 };
    d.Register<PlaceOrder, int>(c => { log.Add("handler"); stock[c.Sku] -= c.Quantity; return Task.FromResult(stock[c.Sku]); });
    d.Register<GetStock, int>(q => Task.FromResult(stock.GetValueOrDefault(q.Sku)));
    return d;
}
await CheckAsync("command handled", async () => await Setup([]).SendAsync<int>(new PlaceOrder("PEN", 3)), 7);
await CheckAsync("query handled", async () => await Setup([]).SendAsync<int>(new GetStock("PEN")), 10);
await ThrowsAsync<InvalidOperationException>("unknown request", () => Setup([]).SendAsync<int>("nope"));
Throws<InvalidOperationException>("duplicate registration", () => Setup([]).Register<GetStock, int>(_ => Task.FromResult(0)));
await CheckAsync("behaviours wrap in order", async () =>
{
    var log = new List<string>();
    var d = Setup(log);
    d.AddBehavior(async (r, next) => { log.Add("log in"); var x = await next(); log.Add("log out"); return x; });
    d.AddBehavior(async (r, next) => { log.Add("tx in"); var x = await next(); log.Add("tx out"); return x; });
    await d.SendAsync<int>(new PlaceOrder("PEN", 1));
    return string.Join(", ", log);
}, "log in, tx in, handler, tx out, log out");
await CheckAsync("validation short-circuits", async () =>
{
    var log = new List<string>();
    var d = Setup(log);
    d.AddBehavior((r, next) => r is PlaceOrder { Quantity: < 1 } ? throw new ValidationFailed("quantity") : next());
    try { await d.SendAsync<int>(new PlaceOrder("PEN", 0)); } catch (ValidationFailed) { }
    return log.Count;
}, 0);
`),
  },
  {
    id: 'cs-3-04',
    title: 'A Read Model Projection',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Maintain an OrderSummary read model from events. Each event carries OrderId and a per-order Sequence starting at 1. Apply(event) must: ignore ' +
      'duplicates (a sequence already applied); hold events that arrive early (a gap) until the missing ones arrive, then apply them in order; ' +
      'and update the summary: OrderPlaced sets Customer and Status "Placed"; LineAdded adds Quantity × UnitPrice to Total and 1 to Lines; ' +
      'OrderShipped sets "Shipped"; OrderCancelled sets "Cancelled". Get(orderId) returns the current summary or null.',
    starterCode: `public abstract record OrderEvent(Guid OrderId, int Sequence);
public sealed record OrderPlaced(Guid OrderId, int Sequence, string Customer) : OrderEvent(OrderId, Sequence);
public sealed record LineAdded(Guid OrderId, int Sequence, string Sku, int Quantity, decimal UnitPrice) : OrderEvent(OrderId, Sequence);
public sealed record OrderShipped(Guid OrderId, int Sequence) : OrderEvent(OrderId, Sequence);
public sealed record OrderCancelled(Guid OrderId, int Sequence) : OrderEvent(OrderId, Sequence);

public sealed record OrderSummary(Guid OrderId, string Customer, string Status, decimal Total, int Lines);

public sealed class OrderSummaryProjection
{
    public void Apply(OrderEvent e) => throw new NotImplementedException();

    public OrderSummary? Get(Guid orderId) => throw new NotImplementedException();
}
`,
    hints: [
      'Per order, keep the summary, the last applied sequence and a SortedDictionary<int, OrderEvent> of pending events.',
      'On Apply: if Sequence <= lastApplied it is a duplicate; otherwise store it in pending, then loop while pending contains lastApplied + 1, applying and removing it.',
      'Use a switch on the event type with records\' with-expressions to update the summary.',
    ],
    solution: `public abstract record OrderEvent(Guid OrderId, int Sequence);
public sealed record OrderPlaced(Guid OrderId, int Sequence, string Customer) : OrderEvent(OrderId, Sequence);
public sealed record LineAdded(Guid OrderId, int Sequence, string Sku, int Quantity, decimal UnitPrice) : OrderEvent(OrderId, Sequence);
public sealed record OrderShipped(Guid OrderId, int Sequence) : OrderEvent(OrderId, Sequence);
public sealed record OrderCancelled(Guid OrderId, int Sequence) : OrderEvent(OrderId, Sequence);

public sealed record OrderSummary(Guid OrderId, string Customer, string Status, decimal Total, int Lines);

public sealed class OrderSummaryProjection
{
    private sealed class State
    {
        public OrderSummary? Summary;
        public int Applied;
        public readonly SortedDictionary<int, OrderEvent> Pending = [];
    }

    private readonly Dictionary<Guid, State> _orders = [];

    public void Apply(OrderEvent e)
    {
        if (!_orders.TryGetValue(e.OrderId, out var state)) _orders[e.OrderId] = state = new State();
        if (e.Sequence <= state.Applied) return;
        state.Pending[e.Sequence] = e;
        while (state.Pending.Remove(state.Applied + 1, out var next))
        {
            state.Summary = Project(state.Summary, next);
            state.Applied++;
        }
    }

    public OrderSummary? Get(Guid orderId) => _orders.GetValueOrDefault(orderId)?.Summary;

    private static OrderSummary? Project(OrderSummary? s, OrderEvent e) => e switch
    {
        OrderPlaced p => new OrderSummary(p.OrderId, p.Customer, "Placed", 0m, 0),
        LineAdded l when s is not null => s with { Total = s.Total + l.Quantity * l.UnitPrice, Lines = s.Lines + 1 },
        OrderShipped when s is not null => s with { Status = "Shipped" },
        OrderCancelled when s is not null => s with { Status = "Cancelled" },
        _ => s,
    };
}
`,
    testCode: csTests(`
var id = Guid.NewGuid();
OrderEvent[] events = [new OrderPlaced(id, 1, "Ama"), new LineAdded(id, 2, "PEN", 4, 2.5m), new LineAdded(id, 3, "BOOK", 1, 40m), new OrderShipped(id, 4)];
Check("in order", () => { var p = new OrderSummaryProjection(); foreach (var e in events) p.Apply(e); return p.Get(id); }, new OrderSummary(id, "Ama", "Shipped", 50m, 2));
Check("duplicates ignored", () => { var p = new OrderSummaryProjection(); foreach (var e in events.Concat(events)) p.Apply(e); return p.Get(id)?.Total; }, (decimal?)50m);
Check("out of order", () => { var p = new OrderSummaryProjection(); foreach (var e in events.Reverse()) p.Apply(e); return p.Get(id); }, new OrderSummary(id, "Ama", "Shipped", 50m, 2));
Check("gap holds later events", () => { var p = new OrderSummaryProjection(); p.Apply(events[0]); p.Apply(events[2]); p.Apply(events[3]); return (p.Get(id)?.Status, p.Get(id)?.Lines); }, ("Placed", (int?)0));
Check("gap filled", () => { var p = new OrderSummaryProjection(); p.Apply(events[0]); p.Apply(events[2]); p.Apply(events[3]); p.Apply(events[1]); return p.Get(id)?.Status; }, "Shipped");
Check("unknown order", () => new OrderSummaryProjection().Get(Guid.NewGuid()), (OrderSummary?)null);
Check("orders independent", () => { var p = new OrderSummaryProjection(); var other = Guid.NewGuid(); p.Apply(new OrderPlaced(other, 1, "Kofi")); p.Apply(new OrderCancelled(other, 2)); p.Apply(events[0]); return (p.Get(other)?.Status, p.Get(id)?.Status); }, ("Cancelled", "Placed"));
`),
  },
  {
    id: 'cs-3-05',
    title: 'An Order Aggregate',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement the Order aggregate root. While Draft: AddLine(sku, quantity, unitPrice) adds or merges a line (quantity 1–99 per line after ' +
      'merging, at most 20 distinct lines, unitPrice > 0); RemoveLine(sku). Place() requires at least one line, sets Placed and records ' +
      'OrderPlaced(Id, Total). Ship() only from Placed → Shipped, records OrderShipped. Cancel(reason) from Draft or Placed → Cancelled, records ' +
      'OrderCancelled only if the order had been placed. Rule breaches throw InvalidOperationException (state) or ArgumentOutOfRangeException ' +
      '(values). Lines and Events are read-only views; ClearEvents() empties the event list after they have been dispatched.',
    starterCode: `public enum OrderStatus { Draft, Placed, Shipped, Cancelled }

public interface IDomainEvent { }
public sealed record OrderPlaced(Guid OrderId, decimal Total) : IDomainEvent;
public sealed record OrderShipped(Guid OrderId) : IDomainEvent;
public sealed record OrderCancelled(Guid OrderId, string Reason) : IDomainEvent;

public sealed record OrderLine(string Sku, int Quantity, decimal UnitPrice)
{
    public decimal Subtotal => Quantity * UnitPrice;
}

public sealed class Order(Guid customerId)
{
    public Guid Id { get; } = Guid.NewGuid();
    public Guid CustomerId { get; } = customerId;
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;
    public IReadOnlyList<OrderLine> Lines => throw new NotImplementedException();
    public IReadOnlyList<IDomainEvent> Events => throw new NotImplementedException();
    public decimal Total => throw new NotImplementedException();

    public void AddLine(string sku, int quantity, decimal unitPrice) => throw new NotImplementedException();
    public void RemoveLine(string sku) => throw new NotImplementedException();
    public void Place() => throw new NotImplementedException();
    public void Ship() => throw new NotImplementedException();
    public void Cancel(string reason) => throw new NotImplementedException();
    public void ClearEvents() => throw new NotImplementedException();
}
`,
    hints: [
      'Keep private List<OrderLine> _lines and List<IDomainEvent> _events; expose them with .AsReadOnly() so callers cannot add to them.',
      'A RequireStatus(params OrderStatus[] allowed) helper keeps the state checks short.',
      'Merging a line: replace the existing record with existing with { Quantity = existing.Quantity + quantity } after checking the 99 limit.',
    ],
    solution: `public enum OrderStatus { Draft, Placed, Shipped, Cancelled }

public interface IDomainEvent { }
public sealed record OrderPlaced(Guid OrderId, decimal Total) : IDomainEvent;
public sealed record OrderShipped(Guid OrderId) : IDomainEvent;
public sealed record OrderCancelled(Guid OrderId, string Reason) : IDomainEvent;

public sealed record OrderLine(string Sku, int Quantity, decimal UnitPrice)
{
    public decimal Subtotal => Quantity * UnitPrice;
}

public sealed class Order(Guid customerId)
{
    public const int MaxLines = 20, MaxQuantity = 99;
    private readonly List<OrderLine> _lines = [];
    private readonly List<IDomainEvent> _events = [];

    public Guid Id { get; } = Guid.NewGuid();
    public Guid CustomerId { get; } = customerId;
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;
    public IReadOnlyList<OrderLine> Lines => _lines.AsReadOnly();
    public IReadOnlyList<IDomainEvent> Events => _events.AsReadOnly();
    public decimal Total => _lines.Sum(l => l.Subtotal);

    public void AddLine(string sku, int quantity, decimal unitPrice)
    {
        RequireStatus(OrderStatus.Draft);
        if (unitPrice <= 0) throw new ArgumentOutOfRangeException(nameof(unitPrice));
        int index = _lines.FindIndex(l => l.Sku == sku);
        int total = (index >= 0 ? _lines[index].Quantity : 0) + quantity;
        if (quantity < 1 || total > MaxQuantity) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (index >= 0) _lines[index] = _lines[index] with { Quantity = total };
        else
        {
            if (_lines.Count == MaxLines) throw new InvalidOperationException($"An order can have at most {MaxLines} lines.");
            _lines.Add(new OrderLine(sku, quantity, unitPrice));
        }
    }

    public void RemoveLine(string sku)
    {
        RequireStatus(OrderStatus.Draft);
        _lines.RemoveAll(l => l.Sku == sku);
    }

    public void Place()
    {
        RequireStatus(OrderStatus.Draft);
        if (_lines.Count == 0) throw new InvalidOperationException("An order needs at least one line.");
        Status = OrderStatus.Placed;
        _events.Add(new OrderPlaced(Id, Total));
    }

    public void Ship()
    {
        RequireStatus(OrderStatus.Placed);
        Status = OrderStatus.Shipped;
        _events.Add(new OrderShipped(Id));
    }

    public void Cancel(string reason)
    {
        RequireStatus(OrderStatus.Draft, OrderStatus.Placed);
        bool wasPlaced = Status == OrderStatus.Placed;
        Status = OrderStatus.Cancelled;
        if (wasPlaced) _events.Add(new OrderCancelled(Id, reason));
    }

    public void ClearEvents() => _events.Clear();

    private void RequireStatus(params OrderStatus[] allowed)
    {
        if (!allowed.Contains(Status)) throw new InvalidOperationException($"Not allowed while the order is {Status}.");
    }
}
`,
    testCode: csTests(`
Order Draft() { var o = new Order(Guid.NewGuid()); o.AddLine("PEN", 4, 2.5m); o.AddLine("BOOK", 1, 40m); return o; }
Check("total", () => Draft().Total, 50m);
Check("merge lines", () => { var o = Draft(); o.AddLine("PEN", 2, 2.5m); return (o.Lines.Count, o.Lines.First(l => l.Sku == "PEN").Quantity); }, (2, 6));
Throws<ArgumentOutOfRangeException>("quantity cap after merge", () => { var o = Draft(); o.AddLine("PEN", 96, 2.5m); });
Throws<ArgumentOutOfRangeException>("zero quantity", () => Draft().AddLine("INK", 0, 1m));
Throws<ArgumentOutOfRangeException>("free item", () => Draft().AddLine("INK", 1, 0m));
Throws<InvalidOperationException>("line limit", () => { var o = new Order(Guid.NewGuid()); for (int i = 0; i < 21; i++) o.AddLine("S" + i, 1, 1m); });
Throws<InvalidOperationException>("empty order cannot be placed", () => new Order(Guid.NewGuid()).Place());
Check("place raises event", () => { var o = Draft(); o.Place(); return o.Events.Single() is OrderPlaced { Total: 50m }; }, true);
Throws<InvalidOperationException>("no changes after placing", () => { var o = Draft(); o.Place(); o.AddLine("INK", 1, 3m); });
Throws<InvalidOperationException>("cannot ship a draft", () => Draft().Ship());
Check("ship", () => { var o = Draft(); o.Place(); o.Ship(); return (o.Status, o.Events.Count); }, (OrderStatus.Shipped, 2));
Throws<InvalidOperationException>("cannot cancel shipped", () => { var o = Draft(); o.Place(); o.Ship(); o.Cancel("late"); });
Check("cancel draft raises no event", () => { var o = Draft(); o.Cancel("changed mind"); return (o.Status, o.Events.Count); }, (OrderStatus.Cancelled, 0));
Check("cancel placed raises event", () => { var o = Draft(); o.Place(); o.Cancel("fraud"); return o.Events.Last() is OrderCancelled { Reason: "fraud" }; }, true);
Check("clear events", () => { var o = Draft(); o.Place(); o.ClearEvents(); return o.Events.Count; }, 0);
Expect("lines cannot be modified from outside", () => { var o = Draft(); try { ((IList<OrderLine>)o.Lines).Add(new("X", 1, 1m)); return false; } catch (NotSupportedException) { return true; } catch (InvalidCastException) { return true; } }, "Lines must be a read-only view");
`),
  },
  {
    id: 'cs-3-06',
    title: 'An Anti-Corruption Layer',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'The legacy CRM sends customer records in its own model. Translate them at the boundary so the Ordering context never sees the CRM\'s ' +
      'quirks. CrmTranslator.ToCustomer(record) returns an Ordering Customer or throws InvalidCrmRecordException: CUST_ID like "C-000123" → Id 123; ' +
      'NAME_LAST and NAME_FIRST (upper-case, padded) → Name "First Last" in title case; EMAIL_ADDR trimmed and lower-cased (required, must contain ' +
      '@); STATUS_CD "A" → Active, "S" → Suspended, "X" → Closed (anything else invalid); CREDIT_LMT_CENTS → CreditLimit in currency units; ' +
      'Suspended and Closed customers get CreditLimit 0.',
    starterCode: `public sealed record CrmCustomerRecord(string CUST_ID, string NAME_FIRST, string NAME_LAST, string EMAIL_ADDR, string STATUS_CD, long CREDIT_LMT_CENTS);

public enum CustomerStatus { Active, Suspended, Closed }

public sealed record Customer(int Id, string Name, string Email, CustomerStatus Status, decimal CreditLimit);

public sealed class InvalidCrmRecordException(string message) : Exception(message);

public static class CrmTranslator
{
    public static Customer ToCustomer(CrmCustomerRecord record) => throw new NotImplementedException();
}
`,
    hints: [
      'CUST_ID: check it starts with "C-" and int.TryParse the rest.',
      'Title case each name: lower-case it, then upper-case the first letter (System.Globalization.TextInfo would also work, but invariant culture keeps it predictable).',
      'A switch expression maps STATUS_CD, throwing for unknown codes.',
    ],
    solution: `public sealed record CrmCustomerRecord(string CUST_ID, string NAME_FIRST, string NAME_LAST, string EMAIL_ADDR, string STATUS_CD, long CREDIT_LMT_CENTS);

public enum CustomerStatus { Active, Suspended, Closed }

public sealed record Customer(int Id, string Name, string Email, CustomerStatus Status, decimal CreditLimit);

public sealed class InvalidCrmRecordException(string message) : Exception(message);

public static class CrmTranslator
{
    public static Customer ToCustomer(CrmCustomerRecord record)
    {
        if (!record.CUST_ID.StartsWith("C-") || !int.TryParse(record.CUST_ID[2..], out int id))
            throw new InvalidCrmRecordException($"Bad customer id '{record.CUST_ID}'.");
        string email = record.EMAIL_ADDR.Trim().ToLowerInvariant();
        if (!email.Contains('@')) throw new InvalidCrmRecordException("Bad email.");
        var status = record.STATUS_CD.Trim() switch
        {
            "A" => CustomerStatus.Active,
            "S" => CustomerStatus.Suspended,
            "X" => CustomerStatus.Closed,
            var code => throw new InvalidCrmRecordException($"Unknown status '{code}'."),
        };
        decimal limit = status == CustomerStatus.Active ? record.CREDIT_LMT_CENTS / 100m : 0m;
        string name = $"{Title(record.NAME_FIRST)} {Title(record.NAME_LAST)}".Trim();
        return new Customer(id, name, email, status, limit);
    }

    private static string Title(string raw)
    {
        string s = raw.Trim().ToLowerInvariant();
        return s.Length == 0 ? s : char.ToUpperInvariant(s[0]) + s[1..];
    }
}
`,
    testCode: csTests(`
var ok = new CrmCustomerRecord("C-000123", "AMA     ", "OWUSU   ", "  Ama.Owusu@Example.COM ", "A", 250_000);
Check("translates", () => CrmTranslator.ToCustomer(ok), new Customer(123, "Ama Owusu", "ama.owusu@example.com", CustomerStatus.Active, 2500m));
Check("suspended has no credit", () => CrmTranslator.ToCustomer(ok with { STATUS_CD = "S" }).CreditLimit, 0m);
Check("closed status", () => CrmTranslator.ToCustomer(ok with { STATUS_CD = "X" }).Status, CustomerStatus.Closed);
Throws<InvalidCrmRecordException>("unknown status", () => CrmTranslator.ToCustomer(ok with { STATUS_CD = "Q" }));
Throws<InvalidCrmRecordException>("bad id", () => CrmTranslator.ToCustomer(ok with { CUST_ID = "123" }));
Throws<InvalidCrmRecordException>("bad email", () => CrmTranslator.ToCustomer(ok with { EMAIL_ADDR = "none" }));
Check("odd cents", () => CrmTranslator.ToCustomer(ok with { CREDIT_LMT_CENTS = 12_345 }).CreditLimit, 123.45m);
`),
  },
  {
    id: 'cs-3-07',
    title: 'An In-Process Event Bus',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement EventBus for integration events between modules. Subscribe<TEvent>(handler) returns an IDisposable that unsubscribes. ' +
      'PublishAsync(event) calls every handler subscribed to that exact event type, in subscription order. One failing handler must not stop the ' +
      'others: collect the failures and, after all handlers ran, throw an AggregateException containing them (or return normally if none failed). ' +
      'Publishing an event nobody subscribed to does nothing.',
    starterCode: `public sealed class EventBus
{
    public IDisposable Subscribe<TEvent>(Func<TEvent, Task> handler) => throw new NotImplementedException();

    public Task PublishAsync<TEvent>(TEvent @event) where TEvent : notnull => throw new NotImplementedException();
}
`,
    hints: [
      'Store handlers in Dictionary<Type, List<Func<object, Task>>>, wrapping each typed handler.',
      'Subscribe returns a small class implementing IDisposable whose Dispose removes that exact wrapper from the list.',
      'In PublishAsync, iterate a copy of the list (ToList()) so unsubscribing during publish is safe; try/catch each handler.',
    ],
    solution: `public sealed class EventBus
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
`,
    testCode: `public sealed record OrderPlaced(int OrderId);
public sealed record OrderShipped(int OrderId);
` + csTests(`
await CheckAsync("all subscribers in order", async () =>
{
    var bus = new EventBus(); var log = new List<string>();
    bus.Subscribe<OrderPlaced>(e => { log.Add("inventory " + e.OrderId); return Task.CompletedTask; });
    bus.Subscribe<OrderPlaced>(e => { log.Add("loyalty " + e.OrderId); return Task.CompletedTask; });
    await bus.PublishAsync(new OrderPlaced(7));
    return string.Join(", ", log);
}, "inventory 7, loyalty 7");
await CheckAsync("only matching type", async () =>
{
    var bus = new EventBus(); int count = 0;
    bus.Subscribe<OrderShipped>(_ => { count++; return Task.CompletedTask; });
    await bus.PublishAsync(new OrderPlaced(1));
    return count;
}, 0);
await CheckAsync("unsubscribe", async () =>
{
    var bus = new EventBus(); int count = 0;
    var sub = bus.Subscribe<OrderPlaced>(_ => { count++; return Task.CompletedTask; });
    await bus.PublishAsync(new OrderPlaced(1)); sub.Dispose(); sub.Dispose();
    await bus.PublishAsync(new OrderPlaced(2));
    return count;
}, 1);
await CheckAsync("failures isolated and reported", async () =>
{
    var bus = new EventBus(); int reached = 0;
    bus.Subscribe<OrderPlaced>(_ => throw new InvalidOperationException("one"));
    bus.Subscribe<OrderPlaced>(_ => { reached++; return Task.CompletedTask; });
    bus.Subscribe<OrderPlaced>(_ => throw new IOException("two"));
    try { await bus.PublishAsync(new OrderPlaced(1)); return "no exception"; }
    catch (AggregateException e) { return $"{reached} {e.InnerExceptions.Count}"; }
}, "1 2");
await CheckAsync("no subscribers is fine", async () => { await new EventBus().PublishAsync(new OrderShipped(1)); return true; }, true);
`),
  },
  {
    id: 'cs-3-08',
    title: 'Module Boundary Checks with Reflection',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Modules live in namespaces Shop.<Module>.Contracts (public) and Shop.<Module>.Internal (private to the module). Implement ' +
      'BoundaryChecker.Violations(types): for every type, inspect the types of its public and non-public instance fields, properties, constructor ' +
      'parameters and method parameters/returns. A violation is a type in module A depending on a type in Shop.B.Internal where B ≠ A. Report ' +
      '"<TypeName> -> <DependencyName>" (short names), distinct and sorted. Generic arguments count (a List<Shop.B.Internal.X> field is a ' +
      'dependency on X). Dependencies on Contracts of any module are allowed.',
    starterCode: `using System.Reflection;

public static class BoundaryChecker
{
    public static List<string> Violations(IEnumerable<Type> types) => throw new NotImplementedException();
}
`,
    hints: [
      'Module of a type: split Namespace on \'.\'; for "Shop.Ordering.Internal" the module is parts[1] and the visibility is parts[2].',
      'Gather candidate types with BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.DeclaredOnly from GetFields, GetProperties, GetConstructors and GetMethods.',
      'Expand generics recursively: if t.IsGenericType, also inspect t.GetGenericArguments(); for arrays, t.GetElementType().',
    ],
    solution: `using System.Reflection;

public static class BoundaryChecker
{
    private const BindingFlags All = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.DeclaredOnly;

    public static List<string> Violations(IEnumerable<Type> types)
    {
        var found = new SortedSet<string>(StringComparer.Ordinal);
        foreach (var type in types)
        {
            var (module, _) = Locate(type);
            if (module is null) continue;
            foreach (var dependency in Referenced(type).SelectMany(Expand))
            {
                var (depModule, depArea) = Locate(dependency);
                if (depModule is not null && depModule != module && depArea == "Internal")
                    found.Add($"{type.Name} -> {dependency.Name}");
            }
        }
        return found.ToList();
    }

    private static (string? Module, string? Area) Locate(Type t)
    {
        string[] parts = (t.Namespace ?? "").Split('.');
        return parts.Length >= 3 && parts[0] == "Shop" ? (parts[1], parts[2]) : (null, null);
    }

    private static IEnumerable<Type> Referenced(Type t) =>
        t.GetFields(All).Select(f => f.FieldType)
            .Concat(t.GetProperties(All).Select(p => p.PropertyType))
            .Concat(t.GetConstructors(All).SelectMany(c => c.GetParameters()).Select(p => p.ParameterType))
            .Concat(t.GetMethods(All).Where(m => !m.IsSpecialName).SelectMany(m => m.GetParameters().Select(p => p.ParameterType).Append(m.ReturnType)));

    private static IEnumerable<Type> Expand(Type t)
    {
        if (t.HasElementType)
        {
            foreach (var x in Expand(t.GetElementType()!)) yield return x;
            yield break;
        }
        yield return t;
        if (t.IsGenericType) foreach (var arg in t.GetGenericArguments()) foreach (var x in Expand(arg)) yield return x;
    }
}
`,
    testCode: `namespace Shop.Catalogue.Contracts { public sealed record PriceDto(string Sku, decimal Price); public interface ICatalogueApi { PriceDto? Price(string sku); } }
namespace Shop.Catalogue.Internal { public sealed class Product { public string Sku { get; set; } = ""; } public sealed class ProductRepository { } }
namespace Shop.Ordering.Internal
{
    public sealed class GoodHandler(Shop.Catalogue.Contracts.ICatalogueApi catalogue) { private readonly Shop.Catalogue.Contracts.ICatalogueApi _c = catalogue; }
    public sealed class LeakyHandler { private readonly List<Shop.Catalogue.Internal.Product> _products = []; public Shop.Catalogue.Internal.ProductRepository? Repo { get; set; } }
    public sealed class SneakyService { public decimal Total(Shop.Catalogue.Internal.Product[] items) => 0; }
    public sealed class OwnModule { private readonly OwnHelper _h = new(); }
    public sealed class OwnHelper { }
}
` + csTests(`
CheckSeq("good handler", () => BoundaryChecker.Violations([typeof(Shop.Ordering.Internal.GoodHandler)]), []);
CheckSeq("own module is fine", () => BoundaryChecker.Violations([typeof(Shop.Ordering.Internal.OwnModule)]), []);
CheckSeq("fields, properties and generics", () => BoundaryChecker.Violations([typeof(Shop.Ordering.Internal.LeakyHandler)]), ["LeakyHandler -> Product", "LeakyHandler -> ProductRepository"]);
CheckSeq("method parameters and arrays", () => BoundaryChecker.Violations([typeof(Shop.Ordering.Internal.SneakyService)]), ["SneakyService -> Product"]);
CheckSeq("whole set sorted", () => BoundaryChecker.Violations(typeof(TestRunner).Assembly.GetTypes().Where(t => t.Namespace?.StartsWith("Shop.") == true)), ["LeakyHandler -> Product", "LeakyHandler -> ProductRepository", "SneakyService -> Product"]);
`),
  },
];
