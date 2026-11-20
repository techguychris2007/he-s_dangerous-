import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  archEbook: { title: 'Microsoft — Architect Modern Web Applications with ASP.NET Core and Azure (free e-book)', url: 'https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/' },
  commonArch: { title: 'Microsoft Learn — Common web application architectures', url: 'https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures' },
  hexagonal: { title: 'Alistair Cockburn — Hexagonal architecture (ports and adapters)', url: 'https://alistair.cockburn.us/hexagonal-architecture/' },
  verticalSlice: { title: 'Jimmy Bogard — Vertical Slice Architecture', url: 'https://www.jimmybogard.com/vertical-slice-architecture/' },
  cqrsFowler: { title: 'Martin Fowler — CQRS', url: 'https://martinfowler.com/bliki/CQRS.html' },
  cqrsAzure: { title: 'Azure Architecture Center — CQRS pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs' },
  dddMicroservices: { title: 'Microsoft — .NET Microservices: Architecture for Containerized .NET Applications (DDD chapters)', url: 'https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/' },
  boundedContext: { title: 'Martin Fowler — Bounded Context', url: 'https://martinfowler.com/bliki/BoundedContext.html' },
  aggregates: { title: 'Martin Fowler — DDD Aggregate', url: 'https://martinfowler.com/bliki/DDD_Aggregate.html' },
  dddReference: { title: 'Eric Evans — Domain-Driven Design Reference (free PDF)', url: 'https://www.domainlanguage.com/ddd/reference/' },
  modularMonolith: { title: 'kgrzybek/modular-monolith-with-ddd (GitHub)', url: 'https://github.com/kgrzybek/modular-monolith-with-ddd' },
  eShopOnWeb: { title: 'NimblePros/eShopOnWeb (GitHub)', url: 'https://github.com/NimblePros/eShopOnWeb' },
  netArchTests: { title: 'NetArchTest — architecture rules as unit tests (GitHub)', url: 'https://github.com/BenMorris/NetArchTest' },
} as const;

/** Month 3, weeks 9–10: application architecture and CQRS (assignment: Architecture Refactor), then
 *  domain-driven design and modular monoliths (assignment: Commerce Platform). */
export const DN_MONTH3_A: CurriculumLesson[] = [
  {
    id: 'dn3-1',
    slug: 'application-architecture',
    title: 'Application Architecture: Layers, the Dependency Rule and Vertical Slices',
    summary: 'Organise an application so business rules do not depend on frameworks: layered, clean/hexagonal (ports and adapters) and vertical-slice architectures, and how to choose between them.',
    minutes: 55,
    prerequisite: 'Months 1 and 2.',
    outcomes: [
      'Explain the dependency rule and why business logic should not reference ASP.NET Core or EF Core.',
      'Describe layered, clean/hexagonal and vertical-slice architectures and their trade-offs.',
      'Define ports (interfaces owned by the core) and adapters (implementations at the edge).',
      'Choose an architecture for a given team size, domain complexity and change pattern.',
    ],
    introduction:
      'Month 2 produced working APIs. Month 3 is about keeping them changeable as they grow from five endpoints to two hundred and from one developer to a team. Architecture is the set of decisions that are expensive to change later — chief among them, which parts of the code are allowed to depend on which. Your study notes recommend reading Microsoft\'s free ASP.NET Core architecture e-book first; this lesson gives you the vocabulary and the reasoning to get the most from it, and prepares you for this week\'s Architecture Refactor.',
    keyTerms: [
      { term: 'Dependency rule', meaning: 'Source code dependencies point inward: business rules never depend on UI, frameworks or databases.' },
      { term: 'Port', meaning: 'An interface the core defines for something it needs (IOrderRepository, IPaymentGateway).' },
      { term: 'Adapter', meaning: 'An implementation of a port at the edge (an EF Core repository, a Stripe client, an HTTP endpoint).' },
      { term: 'Layered architecture', meaning: 'Presentation → application → domain → infrastructure, each layer using only the one below.' },
      { term: 'Vertical slice', meaning: 'Code organised by feature (PlaceOrder, CancelOrder), each slice containing everything it needs.' },
      { term: 'Composition root', meaning: 'The single place (Program.cs) where concrete adapters are wired to ports.' },
    ],
    sections: [
      {
        title: 'Why architecture is about dependencies',
        paragraphs: [
          'If your pricing rules call DbContext directly, changing the database means touching pricing, and testing pricing needs a database. If your domain classes are decorated with ASP.NET Core attributes, upgrading the framework ripples into business logic. The common cure across every modern architecture style is the same: keep the code that encodes business decisions independent of the code that talks to the outside world.',
          'The dependency rule makes this precise: dependencies point inward, towards policy. The domain knows nothing about the application layer; the application layer knows nothing about the web or the database. Infrastructure depends on the core by implementing the interfaces the core declares — dependency inversion from Week 3, applied to a whole system.',
        ],
      },
      {
        title: 'Layered and clean (hexagonal) architecture',
        paragraphs: [
          'A traditional layered architecture stacks presentation, business and data access, each calling downward. Its weakness is that the business layer often ends up depending on the data layer\'s types. Clean architecture and hexagonal (ports and adapters) architecture invert that edge: the core defines a port such as IOrderRepository, and the infrastructure project implements it. The web API and the database are both adapters plugged into the same core.',
          'In a .NET solution this usually becomes projects: Domain (entities, value objects, domain rules), Application (use cases, ports), Infrastructure (EF Core, external clients) and Web (endpoints, composition root). The compiler then enforces the dependency rule: Domain simply has no reference to Infrastructure.',
        ],
        code: `src/
  Shop.Domain/           // Order, Money, OrderLine — no package references at all
  Shop.Application/      // PlaceOrderHandler, IOrderRepository (port), IPaymentGateway (port)
  Shop.Infrastructure/   // EfOrderRepository : IOrderRepository, StripeGateway : IPaymentGateway
  Shop.Web/              // endpoints + Program.cs (composition root)

// Shop.Application — the port is owned by the core
public interface IOrderRepository
{
    Task<Order?> FindAsync(OrderId id, CancellationToken ct);
    Task AddAsync(Order order, CancellationToken ct);
}

// Shop.Infrastructure — the adapter depends inward
public sealed class EfOrderRepository(ShopDb db) : IOrderRepository { /* EF Core here only */ }`,
        label: 'Projects make the dependency rule a compile-time rule',
      },
      {
        title: 'Vertical slice architecture',
        paragraphs: [
          'Layered solutions organise code by technical role, so one feature is spread across five folders, and every feature is forced through the same layers whether it needs them or not. Vertical slice architecture organises by feature instead: everything for "place order" — request, validation, handler, endpoint mapping, response — lives together. Slices share the domain model and infrastructure, but each slice can choose the simplest approach for its own job: a rich domain model for complex writes, a direct SQL query for a report.',
          'Slices reduce coupling between features: changing one rarely touches another. The cost is that conventions must be agreed, or slices drift apart in style. Many teams combine the two ideas: a clean domain core, with the application layer organised as vertical slices.',
        ],
        code: `Features/
  Orders/
    PlaceOrder.cs        // Command, Validator, Handler, endpoint mapping — one file or one folder
    CancelOrder.cs
    GetOrderSummary.cs   // a query slice can read straight from the database with Dapper

public static class PlaceOrder
{
    public sealed record Command(Guid CustomerId, IReadOnlyList<Line> Lines);
    public sealed record Line(string Sku, int Quantity);

    public sealed class Handler(IOrderRepository orders, TimeProvider time)
    {
        public async Task<Guid> HandleAsync(Command command, CancellationToken ct)
        {
            var order = Order.Place(command.CustomerId, command.Lines.Select(l => (l.Sku, l.Quantity)), time.GetUtcNow());
            await orders.AddAsync(order, ct);
            return order.Id;
        }
    }

    public static void Map(IEndpointRouteBuilder app) =>
        app.MapPost("/orders", async (Command c, Handler h, CancellationToken ct) => TypedResults.Created($"/orders/{await h.HandleAsync(c, ct)}"));
}`,
        label: 'One feature, one place',
      },
      {
        title: 'Testing follows the architecture',
        paragraphs: [
          'When the core has no infrastructure dependencies, its tests are fast unit tests with fakes for the ports. Adapters get integration tests against the real thing (Testcontainers for the database). Endpoints get WebApplicationFactory tests. Architecture rules themselves can be tested: libraries such as NetArchTest fail the build if, say, the Domain assembly ever references EF Core — the "fitness function" idea from the Software Engineering track.',
        ],
        code: `[Fact]
public void Domain_does_not_depend_on_infrastructure()
{
    var result = Types.InAssembly(typeof(Order).Assembly)
        .ShouldNot().HaveDependencyOnAny("Microsoft.EntityFrameworkCore", "Microsoft.AspNetCore")
        .GetResult();
    Assert.True(result.IsSuccessful);
}`,
        label: 'An architecture rule as a test',
      },
      {
        title: 'Choosing — and not over-building',
        paragraphs: [
          'A small CRUD service does not need four projects and a mediator library; a single project with a few folders and clear boundaries is honest and fast to change. Introduce more structure when you can name the problem it solves: complex business rules that need isolation, several teams working in parallel, or infrastructure you expect to replace. Record the decision in an Architecture Decision Record, so the next engineer knows why the structure is the way it is.',
        ],
      },
    ],
    table: {
      headers: ['Style', 'Organised by', 'Best when'],
      rows: [
        ['Layered (N-tier)', 'Technical layer', 'Simple apps; teams new to the codebase'],
        ['Clean / hexagonal', 'Core vs adapters (ports)', 'Rich business rules; replaceable infrastructure'],
        ['Vertical slices', 'Feature', 'Many independent features; varied complexity per feature'],
        ['Clean core + slices', 'Domain core, features around it', 'Most growing business applications'],
      ],
    },
    exercise: {
      scenario: 'An API\'s OrdersController (900 lines) validates input, calculates discounts, writes to DbContext, calls the payment SDK and sends emails. Unit tests need a database and a payment sandbox, and a planned switch of payment provider looks like a month of work.',
      task: 'Propose the target structure and the first three refactoring steps.',
      answer: 'Target: a domain core (Order, pricing rules, invariants), an application layer of per-feature handlers (PlaceOrder, CancelOrder) depending on ports (IOrderRepository, IPaymentGateway, IEmailSender), infrastructure adapters for EF Core, the payment SDK and email, and thin endpoints. Steps: (1) add characterisation tests through HTTP; (2) extract the payment SDK calls behind IPaymentGateway with an adapter, so the provider switch becomes one new adapter; (3) move discount calculation into the domain as pure functions with unit tests, then extract one handler per action from the controller.',
      evidence: 'Names ports/adapters and the dependency rule, and sequences safe refactoring steps.',
    },
    misconceptions: [
      'Clean architecture means four projects and a mediator for everything. It means dependencies point inward; structure should match the problem.',
      'Vertical slices mean no shared code. Slices share the domain and infrastructure; they avoid sharing feature-specific logic.',
      'The repository pattern is required. It is one kind of port; query slices may read the database directly.',
      'Architecture is decided once at the start. It evolves; record decisions and revisit them as needs change.',
    ],
    sources: [R.archEbook, R.commonArch, R.hexagonal, R.verticalSlice, R.netArchTests],
    labs: [],
    questions: [
      { prompt: 'In ports and adapters, what do we call the interface the core defines for something it needs? (one word)', answer: 'port', accept: ['a port'] },
      { prompt: 'Which architecture style organises code by feature rather than by technical layer? (two words)', answer: 'vertical slice', accept: ['vertical slices', 'vertical slice architecture'] },
    ],
    quiz: [
      { question: 'Under the dependency rule, which may the domain reference?', options: ['EF Core', 'ASP.NET Core', 'Nothing outside itself', 'The web project'], answer: 2, explanation: 'Dependencies point inward toward policy.' },
      { question: 'Where are adapters wired to ports?', options: ['In the domain', 'In the composition root (Program.cs)', 'In every handler', 'In the database'], answer: 1, explanation: 'One place builds the object graph.' },
      { question: 'A key benefit of vertical slices is…', options: ['Fewer files', 'Changes to one feature rarely touch others', 'No tests needed', 'No database'], answer: 1, explanation: 'Feature-level cohesion reduces coupling.' },
      { question: 'How can an architecture rule be enforced automatically?', options: ['Code comments', 'Architecture tests such as NetArchTest in CI', 'Naming conventions only', 'It cannot'], answer: 1, explanation: 'Rules become failing tests when broken.' },
    ],
  },
  {
    id: 'dn3-2',
    slug: 'cqrs-in-practice',
    title: 'CQRS in Practice: Separating Commands from Queries',
    summary: 'Separate the write model that enforces rules from read models shaped for screens, implement command and query handlers with pipeline behaviours, and know when CQRS is overkill.',
    minutes: 50,
    prerequisite: 'Lesson: Application Architecture.',
    outcomes: [
      'Explain command-query separation and how CQRS extends it to separate models.',
      'Implement command handlers that enforce invariants and query handlers that return read-optimised DTOs.',
      'Add cross-cutting behaviour (validation, logging, transactions) as a handler pipeline.',
      'Decide when separate read stores and eventual consistency are justified.',
    ],
    introduction:
      'Your course notes point at the modular-monolith reference repository\'s description of CQRS: separating command processing from query processing. The idea is simple and its consequences are large. Writes need a model that protects business rules; reads need data shaped for a particular screen, often joining many tables, and usually far more frequent than writes. Forcing both through one model makes both worse. This lesson shows CQRS at the scale most systems need — separate handlers and models in one database — and when going further pays off.',
    keyTerms: [
      { term: 'Command', meaning: 'A request to change state (PlaceOrder); it may be rejected.' },
      { term: 'Query', meaning: 'A request for data (GetOrderSummary); it never changes state.' },
      { term: 'Write model', meaning: 'The domain model used by commands to enforce invariants.' },
      { term: 'Read model', meaning: 'Data shaped for reading — DTOs, views or a separate store — optimised for queries.' },
      { term: 'Pipeline behaviour', meaning: 'Code that wraps every handler (validation, logging, transactions) without changing handlers.' },
      { term: 'Eventual consistency', meaning: 'A read model may briefly lag behind the write model, then catch up.' },
    ],
    sections: [
      {
        title: 'From CQS to CQRS',
        paragraphs: [
          'Command-query separation, from Week 3, says a method should either change state or return data, not both. CQRS applies this at the architecture level: commands and queries travel different paths and may use different models. A command goes through validation and the domain model, which enforces invariants such as "an order cannot ship before it is paid". A query bypasses the domain entirely and reads exactly the columns a screen needs, often with a hand-written SQL projection.',
        ],
        code: `// Command side: rules live in the domain
public sealed record ShipOrder(Guid OrderId) : ICommand;

public sealed class ShipOrderHandler(IOrderRepository orders) : ICommandHandler<ShipOrder>
{
    public async Task HandleAsync(ShipOrder command, CancellationToken ct)
    {
        var order = await orders.GetAsync(command.OrderId, ct);
        order.Ship();                         // throws if not paid — the invariant is enforced here
        await orders.SaveAsync(order, ct);
    }
}

// Query side: no domain objects, just the shape the screen needs
public sealed record OrderSummary(Guid Id, string Customer, decimal Total, string Status, int Lines);

public sealed class GetOrderSummaries(IDbConnection db)
{
    public Task<IEnumerable<OrderSummary>> HandleAsync(Guid customerId) =>
        db.QueryAsync<OrderSummary>("""
            SELECT o.id, c.name AS customer, o.total, o.status, COUNT(l.id) AS lines
            FROM orders o JOIN customers c ON c.id = o.customer_id LEFT JOIN order_lines l ON l.order_id = o.id
            WHERE o.customer_id = @customerId GROUP BY o.id, c.name, o.total, o.status
            """, new { customerId });
}`,
        label: 'Two paths, two models',
      },
      {
        title: 'Handlers and a pipeline',
        paragraphs: [
          'When every use case is a handler with the same shape, cross-cutting concerns can wrap them all: a validation behaviour rejects invalid commands before the handler runs, a logging behaviour times every handler, a transaction behaviour wraps each command in a unit of work. This is the decorator and middleware idea once more. Libraries such as MediatR popularised it; you can build the same thing in a few dozen lines, as this week\'s task does, and avoid a dependency you do not need.',
        ],
        code: `public interface ICommandHandler<in TCommand> { Task HandleAsync(TCommand command, CancellationToken ct); }

public sealed class ValidatingHandler<TCommand>(ICommandHandler<TCommand> inner, IValidator<TCommand> validator)
    : ICommandHandler<TCommand>
{
    public async Task HandleAsync(TCommand command, CancellationToken ct)
    {
        var errors = validator.Validate(command);
        if (errors.Count > 0) throw new ValidationException(errors);
        await inner.HandleAsync(command, ct);
    }
}`,
        label: 'Validation as a decorator around every handler',
      },
      {
        title: 'Separate read stores and eventual consistency',
        paragraphs: [
          'The next step — a separate read database updated from events, such as a search index or a denormalised table per screen — scales reads independently and makes queries trivial. The price is eventual consistency: right after a command succeeds, a query may not see the change yet. User interfaces must handle that (show the result returned by the command; poll; or tell the user "processing"), and you need monitoring for read models that fall behind.',
          'Most applications never need this step. Start with separate handlers over one database; move a specific read model out only when you can measure the need.',
        ],
      },
      {
        title: 'When CQRS is overkill',
        paragraphs: [
          'For simple CRUD screens, where the "rules" are field validation and the read shape equals the write shape, separating models doubles the code for no benefit. Apply CQRS where reads and writes genuinely differ: complex invariants on the write side, rich aggregated views on the read side, or very different scaling needs. Like every pattern in this course, it should solve a problem you can name.',
        ],
      },
    ],
    table: {
      headers: ['Aspect', 'Command side', 'Query side'],
      rows: [
        ['Purpose', 'Change state, enforce rules', 'Return data for a use case'],
        ['Model', 'Domain entities and aggregates', 'DTOs, projections, views'],
        ['Data access', 'Repository / unit of work', 'Direct SQL, Dapper, read store'],
        ['Result', 'Success/failure (maybe an id)', 'Data; never changes state'],
        ['Consistency', 'Immediate within the transaction', 'Immediate (same DB) or eventual (separate store)'],
      ],
    },
    exercise: {
      scenario: 'An order dashboard loads full Order aggregates with all lines, payments and shipment history to show a table of 50 orders, and is slow. Separately, a "mark as shipped" endpoint updates the status column directly with SQL, and orders have been shipped before payment.',
      task: 'Apply CQRS to fix both.',
      answer: 'Queries: replace aggregate loading with a query handler returning OrderSummary DTOs from a single projected SQL query (only needed columns, aggregated line counts, paged). Commands: route "mark as shipped" through a ShipOrder command handler that loads the Order aggregate and calls order.Ship(), which enforces "must be paid first"; no direct status updates. Optionally add a validation/transaction pipeline around commands.',
      evidence: 'Read path uses projections; write path goes through the domain model that enforces the invariant.',
    },
    misconceptions: [
      'CQRS requires two databases. Separate models and handlers over one database is CQRS too.',
      'CQRS requires event sourcing. They combine well but are independent.',
      'Queries should go through the domain model. Queries can bypass it and read exactly what they need.',
      'Every project benefits from CQRS. Simple CRUD gets more complex for no gain.',
    ],
    sources: [R.cqrsFowler, R.cqrsAzure, R.modularMonolith, R.verticalSlice],
    labs: [],
    questions: [
      { prompt: 'In CQRS, what is a request that changes state called? (one word)', answer: 'command', accept: ['a command'] },
      { prompt: 'What term describes a read model that briefly lags behind writes? (two words)', answer: 'eventual consistency', accept: ['eventually consistent'] },
    ],
    quiz: [
      { question: 'Which side enforces business invariants?', options: ['Query', 'Command', 'Both equally', 'Neither'], answer: 1, explanation: 'Commands go through the domain model.' },
      { question: 'Does CQRS require a separate read database?', options: ['Yes', 'No — separate models over one database also counts', 'Only with Azure', 'Only with MediatR'], answer: 1, explanation: 'A separate store is an optional further step.' },
      { question: 'What is a pipeline behaviour?', options: ['A database trigger', 'A wrapper applied around every handler', 'A query', 'An HTTP verb'], answer: 1, explanation: 'Cross-cutting logic around handlers.' },
      { question: 'A command succeeded but the separate read model does not show it yet. This is…', options: ['A bug always', 'Eventual consistency', 'Data loss', 'A deadlock'], answer: 1, explanation: 'Expected with asynchronous read models.' },
    ],
  },
  {
    id: 'dn3-3',
    slug: 'domain-driven-design-fundamentals',
    title: 'Domain-Driven Design Fundamentals: Language, Contexts and Aggregates',
    summary: 'Model a complex domain with a ubiquitous language, split it into bounded contexts, design aggregates that protect invariants within one transaction, and raise domain events.',
    minutes: 60,
    prerequisite: 'Lesson: CQRS in Practice.',
    outcomes: [
      'Build a ubiquitous language with domain experts and reflect it in code.',
      'Identify bounded contexts and explain why the same word can mean different things in each.',
      'Design aggregates with a root, invariants and small transactional boundaries.',
      'Raise domain events from aggregates and use them to coordinate other parts of the system.',
    ],
    introduction:
      'Domain-driven design is a set of ideas for software whose difficulty lies in the business rules rather than the technology. You met its smallest building blocks in Week 1: entities and value objects. This lesson adds the strategic ideas that make large systems manageable — a shared language, bounded contexts — and the tactical idea that most affects correctness: the aggregate, a cluster of objects changed together under one set of rules in one transaction. Next week\'s Commerce Platform assignment is built from exactly these pieces.',
    keyTerms: [
      { term: 'Ubiquitous language', meaning: 'The shared vocabulary of developers and domain experts, used consistently in conversation and code.' },
      { term: 'Bounded context', meaning: 'A boundary within which a model and its language are consistent; the same word may mean something else outside it.' },
      { term: 'Aggregate', meaning: 'A cluster of entities and value objects treated as one unit for changes, accessed through its root.' },
      { term: 'Aggregate root', meaning: 'The single entity through which all changes to an aggregate happen.' },
      { term: 'Invariant', meaning: 'A rule that must be true after every change, enforced by the aggregate.' },
      { term: 'Domain event', meaning: 'A record that something meaningful happened in the domain, such as OrderPlaced.' },
    ],
    sections: [
      {
        title: 'A language shared with the business',
        paragraphs: [
          'Domain experts talk about "placing", "confirming" and "fulfilling" orders, about "backorders" and "allocations". If the code says CreateRecord and UpdateStatus, every conversation needs translating, and translations lose meaning. A ubiquitous language means the code uses the experts\' words — order.Confirm(), stock.Allocate() — and when a term turns out to be ambiguous, both the conversation and the code are corrected together.',
        ],
      },
      {
        title: 'Bounded contexts',
        paragraphs: [
          '"Product" means different things to different parts of a business. To the catalogue it has descriptions, images and categories. To inventory it has stock levels and warehouse locations. To shipping it has weight and dimensions. One giant Product class serving all three becomes a tangle that every team fights over. DDD instead draws bounded contexts — Catalogue, Inventory, Shipping — each with its own model of Product, its own language, and explicit contracts for how the contexts talk to each other.',
          'Bounded contexts are the natural seams for modules in a modular monolith (next lesson) and, if ever needed, for services.',
        ],
      },
      {
        title: 'Aggregates protect invariants',
        paragraphs: [
          'An aggregate is a group of objects that must be consistent together. An Order with its OrderLines is an aggregate: the rule "an order total never exceeds the customer\'s credit limit" or "a confirmed order cannot gain new lines" involves the whole group. All changes go through the root (Order); outside code never modifies an OrderLine directly. The aggregate is loaded and saved as a unit, in one transaction.',
          'Keep aggregates small. A rule that seems to span two aggregates — "stock must be reserved when an order is placed" — is usually better handled as eventual consistency between them via a domain event, rather than one huge aggregate locking both. Reference other aggregates by id, not by object reference.',
        ],
        code: `public sealed class Order
{
    private readonly List<OrderLine> _lines = [];
    private readonly List<IDomainEvent> _events = [];

    public Guid Id { get; } = Guid.NewGuid();
    public Guid CustomerId { get; }                       // another aggregate, referenced by id only
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;
    public IReadOnlyList<OrderLine> Lines => _lines;
    public IReadOnlyList<IDomainEvent> Events => _events;
    public Money Total => _lines.Aggregate(Money.Zero("GHS"), (sum, l) => sum.Add(l.Subtotal));

    public Order(Guid customerId) => CustomerId = customerId;

    public void AddLine(string sku, int quantity, Money unitPrice)
    {
        if (Status != OrderStatus.Draft) throw new InvalidOperationException("Only draft orders can change.");
        if (quantity < 1) throw new ArgumentOutOfRangeException(nameof(quantity));
        var existing = _lines.FirstOrDefault(l => l.Sku == sku);
        if (existing is null) _lines.Add(new OrderLine(sku, quantity, unitPrice));
        else existing.Increase(quantity);
    }

    public void Place()
    {
        if (_lines.Count == 0) throw new InvalidOperationException("An order needs at least one line.");
        Status = OrderStatus.Placed;
        _events.Add(new OrderPlaced(Id, CustomerId, Total));   // others react; the aggregate does not call them
    }
}`,
        label: 'The root guards every change',
      },
      {
        title: 'Domain events',
        paragraphs: [
          'When something meaningful happens — an order is placed, a payment fails — the aggregate records a domain event. After the aggregate is saved, the events are dispatched to handlers that perform the consequences: reserve stock, send an email, update a read model. The aggregate stays focused on its own invariants, and new reactions can be added without editing it. Inside one process, handlers can run in the same transaction or just after it; across modules or services, events travel as messages — the subject of Week 11.',
        ],
      },
      {
        title: 'Repositories and where DDD does not belong',
        paragraphs: [
          'A repository loads and saves whole aggregates: GetAsync(id), AddAsync(order) — never "update the status column of order 7". This keeps every change going through the root. Use DDD\'s tactical patterns where the domain is genuinely complex and valuable; a CRUD admin screen for reference data does not need aggregates and domain events. Even the strategic ideas — language and contexts — are valuable everywhere.',
        ],
      },
    ],
    table: {
      headers: ['Concept', 'Rule of thumb', 'Smell when ignored'],
      rows: [
        ['Ubiquitous language', 'Code uses the experts\' words', 'Constant translation; "status = 4"'],
        ['Bounded context', 'One model per context, explicit contracts', 'A Product class used by every team'],
        ['Aggregate', 'Small; one per transaction; changed via root', 'Child objects modified from anywhere'],
        ['Reference by id', 'Hold other aggregates\' ids, not objects', 'Loading half the database to change one order'],
        ['Domain event', 'Record what happened; react elsewhere', 'Aggregates calling email services'],
      ],
    },
    exercise: {
      scenario: 'A Customer class holds a List<Order>, each Order holds a List<Payment> and a Shipment, and saving a new order line saves the whole customer graph. Two clerks editing different orders of the same customer get concurrency conflicts, and the Customer class has 4,000 lines.',
      task: 'Redesign the aggregates.',
      answer: 'Customer, Order and Shipment become separate aggregates referenced by id: Order holds CustomerId, Shipment holds OrderId. Order (with its OrderLines) is one aggregate whose root enforces line and status rules; payments may be part of Order if rules span them, or a separate Payment aggregate linked by OrderId. Each aggregate is loaded and saved alone, so clerks editing different orders no longer conflict. Cross-aggregate reactions (create a shipment when an order is paid) happen through domain events.',
      evidence: 'Small aggregates, references by id, invariants per root, events for cross-aggregate effects.',
    },
    misconceptions: [
      'DDD is about entities and repositories. Its most valuable ideas are the language and bounded contexts.',
      'Bigger aggregates are safer. They cause contention and slow loads; keep them small.',
      'One shared model is simpler. Across contexts it becomes the hardest code in the system to change.',
      'Domain events must go through a message broker. In-process dispatch is fine inside one module.',
    ],
    sources: [R.dddReference, R.dddMicroservices, R.boundedContext, R.aggregates],
    labs: [],
    questions: [
      { prompt: 'Through which entity must all changes to an aggregate pass? (two words)', answer: 'aggregate root', accept: ['the aggregate root', 'root'] },
      { prompt: 'What DDD term means the shared vocabulary used by experts and code? (two words)', answer: 'ubiquitous language' },
    ],
    quiz: [
      { question: 'How should an Order refer to its Customer?', options: ['Hold the Customer object', 'By CustomerId', 'Through a static field', 'It should not'], answer: 1, explanation: 'Reference other aggregates by id.' },
      { question: 'Why keep aggregates small?', options: ['Fewer classes', 'Less contention and faster loads', 'C# requires it', 'No reason'], answer: 1, explanation: 'Each aggregate is a transactional unit.' },
      { question: 'What is a bounded context?', options: ['A database schema', 'A boundary within which a model is consistent', 'A namespace', 'A test fixture'], answer: 1, explanation: 'Models and language are consistent inside it.' },
      { question: 'An aggregate needs to trigger an email. It should…', options: ['Call the email service', 'Raise a domain event handled elsewhere', 'Write to a log', 'Ignore it'], answer: 1, explanation: 'Keep the aggregate focused on its invariants.' },
    ],
  },
  {
    id: 'dn3-4',
    slug: 'modular-monoliths',
    title: 'Modular Monoliths: Boundaries Without Distributed Systems',
    summary: 'Split one deployable application into modules aligned to bounded contexts, with public contracts, private data, in-process integration events and architecture tests that keep boundaries intact.',
    minutes: 55,
    prerequisite: 'Lesson: Domain-Driven Design Fundamentals.',
    outcomes: [
      'Explain why a modular monolith is usually the right first architecture before microservices.',
      'Define module boundaries with a public API, private internals and private data.',
      'Integrate modules through public contracts and in-process events, never through each other\'s tables.',
      'Study the reference implementations with clear questions about boundaries, CQRS and events.',
    ],
    introduction:
      'Your study notes give firm advice: do not begin by splitting everything into independently deployed services — first make the boundaries understandable. A modular monolith is how you do that. It is one application, deployed as one unit, internally divided into modules with strict boundaries. You get most of the design benefits of microservices — independent models, teams that can work in parallel, the option to extract a module later — without the network calls, distributed transactions and operational cost. The Commerce Platform assignment is a modular monolith.',
    keyTerms: [
      { term: 'Module', meaning: 'A self-contained part of the application aligned to a bounded context, with its own model and data.' },
      { term: 'Public contract', meaning: 'The small set of types and operations a module exposes to others.' },
      { term: 'Integration event', meaning: 'A published fact (OrderPlaced) other modules may react to, in their own way and transaction.' },
      { term: 'Module data ownership', meaning: 'Each module owns its tables (or schema); no other module reads or writes them.' },
      { term: 'Distributed monolith', meaning: 'Services that must be deployed together and call each other synchronously — the costs of both styles and the benefits of neither.' },
    ],
    sections: [
      {
        title: 'Why start with a modular monolith',
        paragraphs: [
          'Microservices solve organisational and scaling problems at a high price: network failures, data consistency across services, distributed tracing, versioned contracts, many deployment pipelines. Teams that split too early usually draw the boundaries wrongly — because the domain is not yet understood — and end up with a distributed monolith whose services cannot be deployed separately anyway.',
          'A modular monolith lets you discover and harden boundaries cheaply. Moving a class between modules is a refactor, not a migration. When a module genuinely needs independent scaling or deployment, its clean boundary makes extraction straightforward.',
        ],
      },
      {
        title: 'What a module boundary means',
        paragraphs: [
          'Each module has a public face and private internals. In .NET this is often one project per module plus a small contracts project, with internal visibility used aggressively so other modules cannot reach domain classes. Each module owns its data: separate tables or a separate database schema, accessed only by that module\'s code. No other module joins to them.',
          'Modules talk in two ways: synchronous calls through the public contract ("Catalogue, what is the price of SKU-1?") and asynchronous integration events ("Ordering: OrderPlaced" — Inventory reserves stock in response). Prefer events for anything that is a consequence rather than a question, so modules do not need each other to be available or consistent at the same instant.',
        ],
        code: `src/Modules/
  Catalogue/
    Catalogue.Contracts/    // ICatalogueApi, ProductPriceDto — the only thing others reference
    Catalogue/              // internal domain, EF Core DbContext with schema "catalogue"
  Ordering/
    Ordering.Contracts/     // OrderPlacedIntegrationEvent
    Ordering/
  Inventory/
    Inventory/              // subscribes to OrderPlacedIntegrationEvent

// Catalogue.Contracts
public interface ICatalogueApi { Task<ProductPriceDto?> GetPriceAsync(string sku, CancellationToken ct); }

// Ordering uses the contract, never Catalogue's internals or tables
public sealed class PlaceOrderHandler(ICatalogueApi catalogue, IOrderRepository orders, IEventBus bus) { /* ... */ }`,
        label: 'Contracts are the only doorway between modules',
      },
      {
        title: 'Integration events inside one process',
        paragraphs: [
          'An in-process event bus delivers integration events to subscribers in other modules. Even in-process, treat them like messages: they are immutable records, versioned, and handled in the subscriber\'s own transaction. Publishing after the publisher\'s transaction commits — or via an outbox table, as Week 11 covers — prevents subscribers reacting to changes that were then rolled back.',
          'Because subscribers run separately, the system becomes eventually consistent between modules: for a moment, an order exists before its stock is reserved. Design for it: the order shows "awaiting stock confirmation", and a failed reservation triggers a compensating event.',
        ],
      },
      {
        title: 'Keeping boundaries from eroding',
        paragraphs: [
          'Boundaries erode one convenient shortcut at a time: one module joins another\'s table "just for this report", or references its internal class. Make the rules executable. Architecture tests (NetArchTest or reflection-based checks) fail the build when Ordering references anything in Catalogue other than Catalogue.Contracts. Database permissions per module schema make cross-module SQL fail at runtime. Code review catches the rest.',
        ],
      },
      {
        title: 'Studying the reference implementations',
        paragraphs: [
          'Your notes recommend two repositories. kgrzybek/modular-monolith-with-ddd is a substantial .NET modular monolith using DDD and CQRS; eShopOnWeb is a simpler ASP.NET Core reference application. Read them with questions, not passively: Where are the module boundaries? Which business rules live in the domain? What may one module access in another? How do commands differ from queries? How do events connect workflows? Return to them in Month 6 — you will see far more the second time.',
        ],
      },
    ],
    table: {
      headers: ['Rule', 'Enforced by', 'Violation looks like'],
      rows: [
        ['Only contracts are public', 'internal types; architecture tests', 'Ordering uses Catalogue.Domain.Product'],
        ['Each module owns its data', 'Separate schema; DB permissions', 'A report joins ordering and inventory tables'],
        ['Consequences via events', 'Event bus; code review', 'Ordering calls Inventory.Reserve directly in its transaction'],
        ['Deploy together, design apart', 'One host; module registration', 'Modules that cannot be built separately'],
      ],
    },
    exercise: {
      scenario: 'A shop monolith has one DbContext with 140 tables. The order handler reads product prices from the catalogue tables, decrements inventory rows and inserts a loyalty-points row in the same transaction. Leadership proposes splitting into 12 microservices next quarter.',
      task: 'Recommend a path and the first boundaries.',
      answer: 'First move to a modular monolith: define modules (Catalogue, Ordering, Inventory, Loyalty) from bounded contexts, give each its own DbContext/schema, and expose small contracts (ICatalogueApi for prices). Ordering stops touching inventory and loyalty tables; it publishes OrderPlaced, and Inventory and Loyalty react in their own transactions with compensation for failures. Add architecture tests to keep boundaries. Only once boundaries are stable and a module has a measured need (independent scaling or deployment) extract it as a service.',
      evidence: 'Modules per bounded context, data ownership, events for consequences, extraction deferred until justified.',
    },
    misconceptions: [
      'A monolith is always a big ball of mud. A modular monolith has strict internal boundaries.',
      'Microservices are the modern default. They add heavy operational costs and are best extracted from proven boundaries.',
      'Modules may share tables if they are in the same database. Shared tables recreate coupling; each module owns its data.',
      'In-process events are always consistent. Subscribers run separately; design for eventual consistency.',
    ],
    sources: [R.modularMonolith, R.eShopOnWeb, R.archEbook, R.netArchTests],
    labs: [],
    questions: [
      { prompt: 'What do we call services that must be deployed together and call each other synchronously? (two words)', answer: 'distributed monolith', accept: ['a distributed monolith'] },
      { prompt: 'Which kind of event do modules publish for other modules to react to? (one word, before "event")', answer: 'integration', accept: ['integration event', 'integration events'] },
    ],
    quiz: [
      { question: 'How should Ordering get a product price from Catalogue?', options: ['Join Catalogue\'s tables', 'Through Catalogue\'s public contract', 'Copy the class', 'Via a static field'], answer: 1, explanation: 'Only the contract is shared.' },
      { question: 'Why prefer events for consequences such as reserving stock?', options: ['Faster CPU', 'Modules need not be available or consistent at the same instant', 'Less code always', 'Required by .NET'], answer: 1, explanation: 'Events decouple timing and failure.' },
      { question: 'What keeps module boundaries from eroding?', options: ['Good intentions', 'Architecture tests, schema permissions and review', 'More modules', 'Microservices'], answer: 1, explanation: 'Executable rules catch shortcuts.' },
      { question: 'When should a module be extracted into a service?', options: ['Immediately', 'When its boundary is stable and there is a measured need', 'Never', 'When it has many classes'], answer: 1, explanation: 'Extract for real scaling or deployment needs.' },
    ],
  },
];
