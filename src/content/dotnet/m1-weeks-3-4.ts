import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  codingConventions: { title: 'Microsoft Learn — .NET coding conventions', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions' },
  identifierNames: { title: 'Microsoft Learn — C# identifier naming rules and conventions', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/identifier-names' },
  archPrinciples: { title: 'Microsoft Learn — Architectural principles (SOLID, separation of concerns)', url: 'https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles' },
  refactoringCatalog: { title: 'Martin Fowler — Catalog of refactorings', url: 'https://refactoring.com/catalog/' },
  di: { title: 'Microsoft Learn — Dependency injection in .NET', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection' },
  diGuidelines: { title: 'Microsoft Learn — Dependency injection guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection-guidelines' },
  refactoringGuru: { title: 'Refactoring.Guru — Design patterns catalogue', url: 'https://refactoring.guru/design-patterns' },
  unitTesting: { title: 'Microsoft Learn — Unit testing best practices for .NET', url: 'https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices' },
  xunit: { title: 'Microsoft Learn — Unit testing C# with xUnit', url: 'https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-csharp-with-xunit' },
  testPyramid: { title: 'Ham Vocke — The Practical Test Pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
  collectionsPerf: { title: 'Microsoft Learn — Selecting a collection class', url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/selecting-a-collection-class' },
  bigO: { title: 'Big-O Cheat Sheet — common data structure and algorithm complexities', url: 'https://www.bigocheatsheet.com/' },
  googleReview: { title: 'Google Engineering Practices — The code reviewer\'s guide', url: 'https://google.github.io/eng-practices/review/reviewer/' },
  googleAuthor: { title: 'Google Engineering Practices — The change author\'s guide', url: 'https://google.github.io/eng-practices/review/developer/' },
  githubFlow: { title: 'GitHub Docs — GitHub flow', url: 'https://docs.github.com/en/get-started/using-github/github-flow' },
  proGitBranching: { title: 'Pro Git — Git branching', url: 'https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell' },
} as const;

/** Month 1, weeks 3–4: clean code, SOLID and patterns (assignment: Rescue the Codebase), then testing,
 *  algorithms and the professional workflow (assignment: Tested Engineering Challenge). */
export const DN_MONTH1_B: CurriculumLesson[] = [
  {
    id: 'dn1-5',
    slug: 'clean-code-and-solid',
    title: 'Clean Code and SOLID: Code Other People Can Change',
    summary: 'Name things well, keep methods small and honest, spot code smells, apply the SOLID principles with judgement, and refactor safely in small steps behind tests.',
    minutes: 55,
    prerequisite: 'Weeks 1 and 2.',
    outcomes: [
      'Apply .NET naming and layout conventions and explain why consistency matters more than taste.',
      'Recognise common code smells: long methods, large classes, duplication, primitive obsession, feature envy, shotgun surgery.',
      'Explain each SOLID principle with a C# example and the problem it prevents.',
      'Refactor in small, behaviour-preserving steps protected by characterisation tests.',
    ],
    introduction:
      'Code is read far more often than it is written. Every hour spent untangling a 300-line method or guessing what a variable called d2 holds is an hour not spent shipping. "Clean code" is not a style preference; it is the set of habits that keeps the cost of change low as a codebase and a team grow. This week\'s assignment hands you a working but tangled codebase and asks you to rescue it without changing what it does. This lesson gives you the vocabulary to see what is wrong and the technique to fix it safely.',
    keyTerms: [
      { term: 'Code smell', meaning: 'A surface symptom that usually indicates a deeper design problem, such as a very long method.' },
      { term: 'Refactoring', meaning: 'Changing the structure of code without changing its behaviour.' },
      { term: 'Characterisation test', meaning: 'A test that records what existing code currently does, so a refactor can prove it changed nothing.' },
      { term: 'Single Responsibility (SRP)', meaning: 'A class should have one reason to change.' },
      { term: 'Open/Closed (OCP)', meaning: 'Extend behaviour by adding code, not by editing working code.' },
      { term: 'Dependency Inversion (DIP)', meaning: 'High-level policy depends on abstractions, not on low-level details such as files or HTTP.' },
      { term: 'Cohesion / coupling', meaning: 'How closely the parts of one module belong together / how much modules depend on each other.' },
    ],
    sections: [
      {
        title: 'Names are the first documentation',
        paragraphs: [
          'Follow the .NET conventions so code looks familiar to every C# developer: PascalCase for types, methods, properties and constants; camelCase for locals and parameters; _camelCase for private fields; interfaces prefixed with I; async methods suffixed with Async. Consistency is the point — tools such as an .editorconfig file and dotnet format can enforce it automatically.',
          'Beyond case, a good name says what something means in the domain: daysOverdue, not d; CalculateLateFee, not Process. If a name needs a comment to explain it, rename it instead. Booleans read as questions (isOverdue, hasStock), and methods that return something are named for what they return.',
        ],
        code: `// Before
public decimal Calc(List<Itm> l, bool f) { /* ... */ return 0; }

// After
public decimal CalculateOrderTotal(IReadOnlyList<OrderLine> lines, bool applyLoyaltyDiscount) { /* ... */ return 0; }`,
        label: 'The same signature, now self-explaining',
      },
      {
        title: 'Smells that predict pain',
        paragraphs: [
          'A long method does several things at different levels of detail; extract each step into a well-named method. A large class has several responsibilities; split it along them. Duplicated code means every bug fix must be applied in several places; extract the shared logic. Primitive obsession passes strings and decimals where small types belong. Feature envy is a method that uses another object\'s data more than its own — it probably belongs on that object. Shotgun surgery is when one small change forces edits across many classes: a sign that one concept has been scattered.',
          'Smells are heuristics, not laws. A 40-line method that reads top to bottom as a clear sequence may be fine; a 12-line method mixing three concerns is not.',
        ],
      },
      {
        title: 'SOLID, with the problem each principle solves',
        paragraphs: [
          'Single Responsibility: a class that formats invoices, calculates tax and sends emails changes whenever any of those rules change, and every change risks the others. Split it. Open/Closed: adding a payment method should mean adding a class, not editing a switch in six places — polymorphism from Week 1. Liskov Substitution: every implementation must honour its interface\'s contract. Interface Segregation: callers should not depend on methods they do not use — prefer small, focused interfaces to one giant IRepository with thirty members. Dependency Inversion: business rules should depend on abstractions such as IPaymentGateway, so the details (Stripe, a fake, a database) can change without touching the rules.',
          'Apply them when they solve a problem you can name. An interface with exactly one implementation and no test fake, created "because SOLID", adds indirection without benefit.',
        ],
        code: `// Violates SRP and DIP: one class, three reasons to change, welded to concrete details
public class InvoiceService
{
    public void Process(Order order)
    {
        decimal tax = order.Total * 0.15m;                               // tax rules
        string pdf = $"INVOICE {order.Id} ... {order.Total + tax}";      // formatting
        new SmtpClient("smtp.example.com").Send("billing@example.com", order.Email, "Invoice", pdf); // delivery
    }
}

// Each responsibility in its own place; the coordinator depends on abstractions
public sealed class InvoiceService(ITaxCalculator tax, IInvoiceFormatter formatter, IInvoiceSender sender)
{
    public void Process(Order order)
    {
        decimal amount = tax.WithTax(order.Total);
        sender.Send(order.Email, formatter.Format(order, amount));
    }
}`,
        label: 'SRP and DIP applied to a real tangle',
      },
      {
        title: 'Refactoring safely: characterisation first',
        paragraphs: [
          'Refactoring without tests is just editing and hoping. Before you touch legacy code, write characterisation tests: call the code with representative inputs — including odd ones — and assert whatever it currently returns, even if that looks wrong. Those tests are your safety net. If a "bug" turns up, record it and fix it in a separate, deliberate change; mixing behaviour changes into a refactor makes both impossible to review.',
          'Then move in small steps, running the tests after each: rename, extract method, extract class, introduce parameter object, replace conditional with polymorphism, inline a needless variable. Commit after each green step. If a step breaks a test, undo it rather than debugging a large change.',
        ],
        code: `// 1. Pin current behaviour (even the surprising parts)
Check("weekend surcharge on Sunday", () => Legacy.Price(100m, new DateOnly(2026, 3, 1)), 110m);
Check("negative quantity currently yields 0", () => Legacy.Price(-5m, new DateOnly(2026, 3, 2)), 0m);

// 2. Refactor in small steps: rename → extract method → extract class → ...
// 3. After each step, run the tests. Green? Commit. Red? Undo the step.`,
        label: 'Tests first, then tiny steps',
      },
      {
        title: 'Functions that tell the truth',
        paragraphs: [
          'A method should do what its name says and nothing else. Hidden side effects — a GetCustomer that also updates a last-seen timestamp, a Validate that also saves — surprise every caller. Keep commands (which change state) separate from queries (which return data); this command-query separation makes code predictable and is the seed of the CQRS pattern you will meet in Month 3.',
          'Prefer few parameters; when several always travel together, they are a missing type (a parameter object such as DateRange). Avoid boolean flag parameters that switch a method between two behaviours — two well-named methods are clearer than DoThing(true).',
        ],
      },
    ],
    table: {
      headers: ['Principle / smell', 'Symptom', 'Typical refactoring'],
      rows: [
        ['Long method', 'Scrolling, comments labelling sections', 'Extract Method'],
        ['Large class / SRP', 'Many unrelated reasons to change', 'Extract Class'],
        ['Duplication', 'Same fix needed in several places', 'Extract shared method or type'],
        ['Type switch / OCP', 'switch on a type code in several places', 'Replace Conditional with Polymorphism'],
        ['Concrete dependencies / DIP', 'new SmtpClient inside business logic', 'Extract interface, inject it'],
        ['Long parameter list', 'Values always passed together', 'Introduce Parameter Object'],
      ],
    },
    exercise: {
      scenario: 'A 220-line ReportGenerator.Run method reads a CSV file, filters rows with nested ifs, computes totals with a switch on region codes, builds HTML with string concatenation, and emails it. There are no tests, and a bug fix is needed in the region totals.',
      task: 'Plan the rescue: what do you do first, and in what order do you restructure it?',
      answer: 'First write characterisation tests around Run\'s observable output using a sample CSV (inject or wrap file and email access so tests can capture output without real I/O). Commit. Then refactor in small green steps: extract methods for read/filter/total/render/send; introduce an IReportSender and a reader abstraction (DIP); replace the region switch with a per-region strategy or lookup (OCP); extract RegionTotals into its own class (SRP). Only after the structure is clean, fix the region bug in a separate commit with a new test that proves it.',
      evidence: 'Tests before changes, small reversible steps, and the behaviour fix kept separate from the refactor.',
    },
    misconceptions: [
      'Clean code means short code. It means code whose intent is obvious; sometimes that is longer.',
      'SOLID means an interface for every class. Add abstractions when they remove a real problem.',
      'Refactoring is rewriting. Refactoring preserves behaviour, in small verified steps.',
      'Fix bugs while refactoring to save time. Mixing them makes both harder to review and verify.',
    ],
    sources: [R.codingConventions, R.identifierNames, R.archPrinciples, R.refactoringCatalog],
    labs: [],
    questions: [
      { prompt: 'What do we call a test that records what legacy code currently does before refactoring?', answer: 'characterisation test', accept: ['characterization test', 'characterisation tests', 'characterization tests'] },
      { prompt: 'Which SOLID principle says a class should have one reason to change? Give its full name.', answer: 'Single Responsibility Principle', accept: ['single responsibility', 'srp'] },
    ],
    quiz: [
      { question: 'What is refactoring?', options: ['Adding features', 'Changing structure without changing behaviour', 'Rewriting from scratch', 'Fixing bugs'], answer: 1, explanation: 'Behaviour stays the same; structure improves.' },
      { question: 'A method uses another object\'s data far more than its own. Which smell?', options: ['Feature envy', 'Long method', 'Dead code', 'Speculative generality'], answer: 0, explanation: 'The method probably belongs on the other object.' },
      { question: 'InvoiceService creates new SmtpClient(...) inside its logic. Which principle does that violate most directly?', options: ['Liskov', 'Dependency Inversion', 'Interface Segregation', 'None'], answer: 1, explanation: 'Policy depends on a concrete low-level detail.' },
      { question: 'During a refactor, a test turns red. Best response?', options: ['Debug the whole change', 'Undo the last small step', 'Delete the test', 'Commit anyway'], answer: 1, explanation: 'Small steps make undo cheap and safe.' },
    ],
  },
  {
    id: 'dn1-6',
    slug: 'design-patterns-and-dependency-injection',
    title: 'Design Patterns That Earn Their Place, and Dependency Injection',
    summary: 'Use Strategy, Factory, Decorator, Adapter, Observer and Template Method where they solve real problems, and wire objects with the .NET dependency injection container and correct lifetimes.',
    minutes: 55,
    prerequisite: 'Lesson: Clean Code and SOLID.',
    outcomes: [
      'Recognise the problem each of six common patterns solves and implement it idiomatically in C#.',
      'Use the Decorator pattern to add cross-cutting behaviour (caching, logging, retries) without editing a class.',
      'Register services with Microsoft.Extensions.DependencyInjection and choose transient, scoped or singleton lifetimes.',
      'Avoid pattern overuse and the service-locator anti-pattern.',
    ],
    introduction:
      'Design patterns are named solutions to problems that keep recurring. Their real value is the shared vocabulary: "wrap the repository in a caching decorator" tells a teammate a whole design in seven words. Their danger is enthusiasm — a codebase where every class is a factory producing a strategy for a visitor. The guidance from your course notes applies directly: learn a pattern when it solves a problem you have actually met. This lesson covers the handful you will genuinely use in the coming months, and the dependency injection container that ASP.NET Core is built on.',
    keyTerms: [
      { term: 'Strategy', meaning: 'Interchangeable algorithms behind one interface, chosen at runtime.' },
      { term: 'Factory', meaning: 'An object or method responsible for creating other objects, hiding which concrete type is built.' },
      { term: 'Decorator', meaning: 'A wrapper implementing the same interface that adds behaviour before or after delegating to the wrapped object.' },
      { term: 'Adapter', meaning: 'A wrapper that converts one interface into the one your code expects.' },
      { term: 'Observer', meaning: 'Objects subscribe to be told when something happens; in .NET, events and IObservable.' },
      { term: 'Service lifetime', meaning: 'How long a DI container keeps an instance: transient (new each time), scoped (one per request), singleton (one for the app).' },
    ],
    sections: [
      {
        title: 'Strategy and Factory',
        paragraphs: [
          'You have already used Strategy: ILoanPolicy and IDiscountRule are strategies — the algorithm varies, the caller does not. A Factory decides which strategy to create, keeping that decision in one place instead of scattering new StudentPolicy() across the codebase. In modern C#, a factory is often just a method or a dictionary of delegates rather than a class hierarchy.',
        ],
        code: `public static class ShippingCalculators
{
    private static readonly Dictionary<string, Func<IShippingCalculator>> Factories = new(StringComparer.OrdinalIgnoreCase)
    {
        ["standard"] = () => new StandardShipping(),
        ["express"] = () => new ExpressShipping(),
        ["pickup"] = () => new PickupShipping(),
    };

    public static IShippingCalculator Create(string method) =>
        Factories.TryGetValue(method, out var create)
            ? create()
            : throw new ArgumentException($"Unknown shipping method '{method}'.", nameof(method));
}`,
        label: 'A factory as a dictionary of delegates',
      },
      {
        title: 'Decorator: add behaviour without editing',
        paragraphs: [
          'A decorator implements an interface and holds another implementation of the same interface. It can do something before and after delegating — cache results, log timings, retry failures, check permissions — and the wrapped class never knows. Decorators stack: a logging decorator around a caching decorator around the real repository. This is how you keep cross-cutting concerns out of business code, and the same idea powers ASP.NET Core middleware in Month 2.',
        ],
        code: `public interface IExchangeRates { Task<decimal> GetRateAsync(string currency, CancellationToken ct); }

public sealed class CachingExchangeRates(IExchangeRates inner, TimeProvider time, TimeSpan ttl) : IExchangeRates
{
    private readonly Dictionary<string, (decimal Rate, DateTimeOffset Expires)> _cache = new();

    public async Task<decimal> GetRateAsync(string currency, CancellationToken ct)
    {
        if (_cache.TryGetValue(currency, out var hit) && hit.Expires > time.GetUtcNow()) return hit.Rate;
        decimal rate = await inner.GetRateAsync(currency, ct);          // delegate to the real thing
        _cache[currency] = (rate, time.GetUtcNow() + ttl);
        return rate;
    }
}

// Composition root: IExchangeRates rates = new CachingExchangeRates(new HttpExchangeRates(...), TimeProvider.System, TimeSpan.FromMinutes(5));`,
        label: 'A caching decorator',
      },
      {
        title: 'Adapter, Observer and Template Method',
        paragraphs: [
          'An Adapter wraps a third-party or legacy API so the rest of your code sees your own interface. When the payment provider changes its SDK, only the adapter changes. Observer lets one object announce something happened without knowing who cares; in C#, events (event EventHandler<T>) implement it directly, and in Month 3 you will scale the same idea up to message-based, event-driven architecture. Template Method, which you met in Week 1, fixes an algorithm\'s outline in a base class and lets subclasses fill in steps.',
        ],
        code: `// Observer with a C# event
public sealed class Inventory
{
    public event EventHandler<string>? StockLow;

    private readonly Dictionary<string, int> _stock = new();

    public void Remove(string sku, int qty)
    {
        _stock[sku] = _stock.GetValueOrDefault(sku) - qty;
        if (_stock[sku] < 5) StockLow?.Invoke(this, sku);   // announce; do not know who listens
    }
}

var inventory = new Inventory();
inventory.StockLow += (_, sku) => Console.WriteLine($"Reorder {sku}");`,
        label: 'Events are the built-in Observer',
      },
      {
        title: 'The .NET dependency injection container',
        paragraphs: [
          'Wiring objects by hand works for small programs. As they grow, a container does it for you: you register which implementation serves each interface, and the container builds whole object graphs, passing constructor dependencies automatically. ASP.NET Core uses Microsoft.Extensions.DependencyInjection for everything, so learning it now pays off in Month 2.',
          'Choose lifetimes carefully. Transient creates a new instance every time — fine for lightweight stateless services. Scoped creates one per scope, which in a web app means one per request — the right lifetime for a database context. Singleton creates one for the whole application — for thread-safe, stateless or cache-like services. Never inject a scoped service into a singleton: the singleton keeps the first scope\'s instance forever ("captive dependency").',
        ],
        code: `using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddSingleton(TimeProvider.System);
services.AddSingleton<IExchangeRates>(sp =>
    new CachingExchangeRates(new HttpExchangeRates(), sp.GetRequiredService<TimeProvider>(), TimeSpan.FromMinutes(5)));
services.AddScoped<IOrderRepository, SqlOrderRepository>();
services.AddTransient<OrderService>();

using var provider = services.BuildServiceProvider(new ServiceProviderOptions { ValidateScopes = true });
using var scope = provider.CreateScope();
var orders = scope.ServiceProvider.GetRequiredService<OrderService>();   // graph built for you`,
        label: 'Registrations and lifetimes',
      },
      {
        title: 'Anti-patterns to avoid',
        paragraphs: [
          'Service locator — passing the container (IServiceProvider) into classes so they can fetch what they need — hides dependencies and makes classes impossible to understand from their constructor. Inject what you need explicitly. Pattern-itis — introducing factories, abstract factories and strategies where a simple if would do — is the other failure mode. And a singleton holding mutable shared state is a global variable with extra steps, and a concurrency bug waiting to happen in a web server.',
        ],
      },
    ],
    table: {
      headers: ['Pattern', 'Solves', 'You will see it in'],
      rows: [
        ['Strategy', 'Algorithms that vary', 'Loan policies, discount rules, pricing'],
        ['Factory', 'Choosing which implementation to build', 'Shipping methods, parsers'],
        ['Decorator', 'Cross-cutting behaviour (cache, log, retry)', 'Repositories, HTTP handlers, middleware'],
        ['Adapter', 'Mismatched or third-party interfaces', 'Payment SDKs, legacy systems'],
        ['Observer', 'Announcing events to unknown listeners', 'C# events, domain events, message buses'],
        ['Template Method', 'Fixed algorithm, varying steps', 'Report generators, base handlers'],
      ],
    },
    exercise: {
      scenario: 'Every method of a ProductRepository starts with a Stopwatch, logs the elapsed time at the end, and catches SqlException to retry once. The code is duplicated across 14 methods and a new caching requirement has arrived.',
      task: 'Restructure it with patterns and DI so timing, retry and caching are each written once.',
      answer: 'Extract IProductRepository and keep SqlProductRepository purely about data access. Write decorators implementing IProductRepository: TimingProductRepository (stopwatch + log), RetryingProductRepository (retry transient failures) and CachingProductRepository (cache reads, invalidate on writes). Compose them at the composition root, e.g. new Timing(new Caching(new Retrying(new SqlProductRepository(...)))), or register the chain with the DI container. Each concern lives in one class and can be tested alone.',
      evidence: 'Uses decorators for cross-cutting concerns and composes them in one place.',
    },
    misconceptions: [
      'More patterns mean better design. Each pattern should answer a specific, present problem.',
      'Singleton lifetime is a safe default. Shared mutable state in singletons causes concurrency bugs; scoped services must never be captured by singletons.',
      'Injecting IServiceProvider is dependency injection. It is a service locator; it hides dependencies.',
      'Decorators require inheritance. They implement the same interface and wrap an instance (composition).',
    ],
    sources: [R.di, R.diGuidelines, R.refactoringGuru, R.archPrinciples],
    labs: [],
    questions: [
      { prompt: 'Which pattern wraps an object with the same interface to add behaviour such as caching?', answer: 'Decorator', accept: ['decorator pattern'] },
      { prompt: 'Which service lifetime gives one instance per web request?', answer: 'scoped' },
    ],
    quiz: [
      { question: 'Which pattern converts a third-party API to the interface your code expects?', options: ['Adapter', 'Observer', 'Strategy', 'Singleton'], answer: 0, explanation: 'An adapter translates between interfaces.' },
      { question: 'What goes wrong when a singleton depends on a scoped service?', options: ['Nothing', 'The singleton captures one scope\'s instance forever', 'It will not compile', 'It runs slower'], answer: 1, explanation: 'This captive dependency outlives its intended scope.' },
      { question: 'C# events are a built-in form of which pattern?', options: ['Factory', 'Observer', 'Decorator', 'Adapter'], answer: 1, explanation: 'Subscribers are notified without the publisher knowing them.' },
      { question: 'Why avoid injecting IServiceProvider into business classes?', options: ['It is slow', 'It hides the class\'s real dependencies (service locator)', 'It is not allowed', 'It leaks memory'], answer: 1, explanation: 'Constructors should declare dependencies explicitly.' },
    ],
  },
  {
    id: 'dn1-7',
    slug: 'testing-in-dotnet',
    title: 'Testing in .NET: xUnit, Test Design and Test Doubles',
    summary: 'Write xUnit tests with Arrange-Act-Assert, choose cases with equivalence classes and boundaries, use fakes, stubs and mocks appropriately, and practise test-driven development.',
    minutes: 55,
    prerequisite: 'Lessons on Clean Code and Patterns.',
    outcomes: [
      'Create an xUnit test project and write [Fact] and [Theory] tests with Arrange-Act-Assert.',
      'Choose test cases using equivalence partitioning and boundary values.',
      'Use fakes, stubs and mocks appropriately and prefer state verification where possible.',
      'Run the red-green-refactor TDD cycle and explain what makes a test trustworthy.',
    ],
    introduction:
      'The assessment rubric for every assignment in this programme gives testing 15% — as much as code quality — because untested code is a liability you cannot change safely. Testing is a design skill as much as a checking skill: code that is hard to test is usually hard to use, and the effort of testing it tells you something about its design. This lesson covers how professional .NET teams test: xUnit for unit tests, a disciplined way to choose cases, test doubles for collaborators, and the test-first rhythm that keeps designs small.',
    keyTerms: [
      { term: 'Unit test', meaning: 'A fast test of one small piece of behaviour in isolation from slow or external dependencies.' },
      { term: '[Fact] / [Theory]', meaning: 'xUnit attributes: a Fact is one test; a Theory runs once per set of [InlineData].' },
      { term: 'Arrange-Act-Assert', meaning: 'Structure each test as set up, perform the action, check the outcome.' },
      { term: 'Equivalence partition', meaning: 'A group of inputs the code should treat the same way; one test per group is usually enough.' },
      { term: 'Test double', meaning: 'A stand-in for a real dependency: fake, stub, mock or spy.' },
      { term: 'TDD', meaning: 'Test-driven development: write a failing test, make it pass simply, then refactor.' },
    ],
    sections: [
      {
        title: 'Setting up xUnit',
        paragraphs: [
          'A .NET solution usually holds the application project and a separate test project that references it. dotnet new xunit creates the test project; dotnet test builds and runs every test. Each test is a public method marked [Fact]. [Theory] with [InlineData] runs the same test for several inputs — ideal for boundary tables.',
          'In this course\'s browser workspace, tasks use a small built-in harness with the same ideas (Check, Throws); on your own machine you will write the same tests with xUnit.',
        ],
        code: `$ dotnet new sln -n Library
$ dotnet new classlib -o src/Library.Core
$ dotnet new xunit -o tests/Library.Core.Tests
$ dotnet add tests/Library.Core.Tests reference src/Library.Core
$ dotnet sln add src/Library.Core tests/Library.Core.Tests
$ dotnet test

// tests/Library.Core.Tests/FineCalculatorTests.cs
public class FineCalculatorTests
{
    [Fact]
    public void Returning_on_time_costs_nothing()
    {
        // Arrange
        var due = new DateOnly(2026, 3, 10);
        // Act
        decimal fine = FineCalculator.Fine(new StudentPolicy(), due, returnedOn: due);
        // Assert
        Assert.Equal(0m, fine);
    }

    [Theory]
    [InlineData(1, 0.50)]
    [InlineData(20, 10.00)]      // capped
    public void Student_fines_grow_daily_up_to_the_cap(int daysLate, decimal expected)
    {
        var due = new DateOnly(2026, 3, 10);
        Assert.Equal(expected, FineCalculator.Fine(new StudentPolicy(), due, due.AddDays(daysLate)));
    }
}`,
        label: 'A solution with a test project',
      },
      {
        title: 'Choosing the few tests that matter',
        paragraphs: [
          'You cannot test every input, so test one representative of each equivalence class — inputs the code should handle the same way — plus the boundaries between classes, where off-by-one errors live. For a grade function: one valid score per grade band, each band\'s exact edges, and the invalid classes below 0 and above 100.',
          'Name tests after the behaviour they protect, so a failure reads as a sentence: Returning_on_time_costs_nothing, Lending_fails_when_member_owes_more_than_five. One logical assertion per test makes failures easy to diagnose.',
        ],
      },
      {
        title: 'Test doubles: fakes, stubs and mocks',
        paragraphs: [
          'A stub returns canned answers ("the exchange rate is 15.2"). A fake is a working lightweight implementation — an in-memory repository, the FixedTime clock you used in Week 1. A mock records how it was called so the test can verify an interaction ("the notifier was told exactly once"). Libraries such as NSubstitute and Moq generate stubs and mocks; hand-written fakes are often clearer.',
          'Prefer checking state and outputs over verifying interactions: tests that assert "method X was called with Y" break whenever the implementation is refactored, even if behaviour is unchanged. Verify interactions only when the interaction is the behaviour — sending an email, charging a card.',
        ],
        code: `public sealed class RecordingNotifier : INotifier          // a hand-written spy
{
    public List<(string MemberId, string Message)> Sent { get; } = [];
    public void Notify(string memberId, string message) => Sent.Add((memberId, message));
}

[Fact]
public void Returning_a_reserved_book_notifies_the_first_member_in_the_queue()
{
    var time = new FixedTime(new DateTimeOffset(2026, 3, 1, 0, 0, 0, TimeSpan.Zero));
    var notes = new RecordingNotifier();
    var engine = new LibraryEngine(time, notes);
    // ... arrange a loan and two reservations ...
    engine.Return("s1", "111");
    Assert.Equal(("p1", "'Clean Code' is ready for pickup."), Assert.Single(notes.Sent));
}`,
        label: 'A spy verifying an interaction that IS the behaviour',
      },
      {
        title: 'Red, green, refactor',
        paragraphs: [
          'Test-driven development is a rhythm: write a small failing test for the next bit of behaviour (red); write the simplest code that passes it (green); then improve the design with the tests as a safety net (refactor). Repeat in minutes, not hours. The tests document the behaviour and the design stays small, because you only ever write code a test demanded.',
          'TDD is not mandatory for every line, but practise it until the rhythm is natural — especially for logic with many rules, such as pricing, fines and state machines.',
        ],
      },
      {
        title: 'Trustworthy tests',
        paragraphs: [
          'A good test is fast (milliseconds), isolated (no shared state between tests, no order dependence), repeatable (no real clock, network or random numbers without a seed), self-checking (it asserts, rather than printing for a human to read) and readable. A flaky test that sometimes fails is worse than none: people learn to ignore red.',
          'Coverage percentage tells you what code ran, not whether it was checked. Mutation testing — deliberately introducing bugs and seeing whether any test fails — measures what your tests actually catch. This week\'s Tested Engineering Challenge grades your tests exactly that way.',
        ],
      },
    ],
    table: {
      headers: ['Double', 'What it does', 'Typical use'],
      rows: [
        ['Stub', 'Returns canned answers', 'Exchange rate, config values'],
        ['Fake', 'Simple working implementation', 'In-memory repository, fixed clock'],
        ['Spy / mock', 'Records calls for verification', 'Was the email sent? Was the card charged once?'],
        ['Real object', 'The production implementation', 'Fast, deterministic collaborators'],
      ],
    },
    exercise: {
      scenario: 'A team\'s tests for a ShippingCalculator call the real courier API, use DateTime.Now to decide weekend surcharges, and assert with Assert.True(result > 0). The suite takes 4 minutes and fails randomly on Fridays.',
      task: 'Identify why the tests are untrustworthy and how to fix them.',
      answer: 'Calling a real external API makes tests slow and flaky — replace it with a stub or fake behind an interface. DateTime.Now makes results depend on the day — inject TimeProvider and use a fixed date per test (a weekday test and a weekend test). Assert.True(result > 0) checks almost nothing — assert exact expected amounts chosen from equivalence classes and boundaries, e.g. a [Theory] table of weights and dates with the precise fee each should produce.',
      evidence: 'Removes external and time dependencies with doubles, and replaces vague assertions with exact expected values at boundaries.',
    },
    misconceptions: [
      '100% coverage means well tested. Coverage shows execution, not verification.',
      'Mocks everywhere make tests better. Over-mocking couples tests to implementation details.',
      'Tests slow development down. They make change cheap and catch regressions early.',
      'One giant test checking everything is efficient. Small, named tests make failures diagnosable.',
    ],
    sources: [R.unitTesting, R.xunit, R.testPyramid],
    labs: [],
    questions: [
      { prompt: 'Which xUnit attribute runs a test once per [InlineData] row?', answer: 'Theory', accept: ['[Theory]'] },
      { prompt: 'Name the three-step TDD cycle\'s first step (a colour).', answer: 'red' },
    ],
    quiz: [
      { question: 'A clock returning a fixed time, used in tests, is a…', options: ['Mock', 'Fake', 'Spy', 'Production object'], answer: 1, explanation: 'A simple working implementation is a fake.' },
      { question: 'Grades: A at 80–100. Which values best test the A boundary?', options: ['50 and 90', '79, 80 and 100', 'Only 85', '0 and 1000'], answer: 1, explanation: 'Test both sides of the boundary and the top edge.' },
      { question: 'When should a test verify that a method was called?', options: ['Always', 'When the interaction itself is the behaviour, e.g. sending an email', 'Never', 'Only for private methods'], answer: 1, explanation: 'Otherwise prefer state-based assertions.' },
      { question: 'What does mutation testing measure?', options: ['Speed', 'Whether tests fail when bugs are introduced', 'Line coverage', 'Memory usage'], answer: 1, explanation: 'It measures the bug-catching power of tests.' },
    ],
  },
  {
    id: 'dn1-8',
    slug: 'algorithms-and-engineering-workflow',
    title: 'Algorithms, Complexity and the Professional Engineering Workflow',
    summary: 'Reason about Big-O, pick .NET collections by their costs, implement core searching and sorting ideas, and work like a professional team: branches, pull requests, code review and CI.',
    minutes: 55,
    prerequisite: 'Lesson: Testing in .NET.',
    outcomes: [
      'Estimate the time and space complexity of code and spot accidental quadratic behaviour.',
      'Choose List, Dictionary, HashSet, SortedDictionary, Queue, Stack and PriorityQueue by their operation costs.',
      'Implement binary search and explain when sorting first pays off.',
      'Use a branch-and-pull-request workflow, write reviewable changes, and review others\' code constructively.',
    ],
    introduction:
      'Two things separate code that works on your laptop from software a team can run in production: it must keep working as data grows, and it must be changed safely by many people. The first is about algorithms — not memorising sorting routines, but recognising when a design will collapse at ten thousand items instead of ten. The second is about workflow — branches, pull requests, review and automated checks. Both appear in every remaining month of this programme, and both are part of how your assignments are assessed.',
    keyTerms: [
      { term: 'Big-O', meaning: 'How an algorithm\'s cost grows with input size n, ignoring constants: O(1), O(log n), O(n), O(n log n), O(n²).' },
      { term: 'Binary search', meaning: 'Finding an item in sorted data by repeatedly halving the search range: O(log n).' },
      { term: 'PriorityQueue', meaning: 'A .NET collection that always dequeues the element with the smallest priority.' },
      { term: 'Pull request (PR)', meaning: 'A proposal to merge a branch, where changes are reviewed and checked before merging.' },
      { term: 'Continuous integration (CI)', meaning: 'Automatically building and testing every change, typically on each push and pull request.' },
    ],
    sections: [
      {
        title: 'Thinking in Big-O',
        paragraphs: [
          'Big-O describes how cost grows. O(1) is constant: a dictionary lookup takes about the same time for ten items or ten million. O(n) is linear: scanning a list. O(n log n) is efficient sorting. O(n²) — usually a loop inside a loop over the same data — is fine for 100 items (10,000 steps) and painful for 100,000 (10 billion steps).',
          'The most common real-world performance bug is accidental O(n²): calling list.Contains, list.Remove or IndexOf inside a loop over another large list. The fix is nearly always a better data structure, not cleverer code.',
        ],
        code: `// O(n × m): for each order, scan every blocked customer
var blocked = new List<string>(blockedIds);
var allowed = orders.Where(o => !blocked.Contains(o.CustomerId)).ToList();

// O(n + m): build a set once, then O(1) lookups
var blockedSet = blockedIds.ToHashSet();
var allowedFast = orders.Where(o => !blockedSet.Contains(o.CustomerId)).ToList();`,
        label: 'The everyday quadratic trap',
      },
      {
        title: 'Choosing collections by cost',
        paragraphs: [
          'Every .NET collection is a trade-off. List<T> gives O(1) index access and append but O(n) search and insert-at-front. Dictionary and HashSet give O(1) average lookup by key. SortedDictionary keeps keys ordered with O(log n) operations. Queue<T> is first-in-first-out — a reservation line; Stack<T> is last-in-first-out — undo history. PriorityQueue<TElement, TPriority> always gives you the most urgent item next — the next order to ship, the next job to retry.',
        ],
        code: `var dispatch = new PriorityQueue<string, DateOnly>();     // earliest due date first
dispatch.Enqueue("order-17", new DateOnly(2026, 3, 9));
dispatch.Enqueue("order-12", new DateOnly(2026, 3, 4));
dispatch.Enqueue("order-30", new DateOnly(2026, 3, 6));
while (dispatch.TryDequeue(out var order, out var due))
    Console.WriteLine($"{due}: {order}");    // 12, 30, 17`,
        label: 'PriorityQueue for "most urgent next"',
      },
      {
        title: 'Searching and sorting, and when sorting pays',
        paragraphs: [
          'Binary search finds an item in sorted data in O(log n) by comparing with the middle and discarding half the range each step — about 20 comparisons for a million items. Sorting costs O(n log n), so it pays off when you will search the same data many times. .NET provides Array.BinarySearch and List<T>.BinarySearch; implement it yourself once so you understand the boundary handling, which is notoriously easy to get wrong.',
          'Use the built-in Sort and OrderBy rather than writing your own sorts in production; their implementations are highly optimised. What you must know is the cost and stability: OrderBy is stable (equal keys keep their order), Array.Sort is not.',
        ],
        code: `static int BinarySearch(int[] sorted, int target)
{
    int low = 0, high = sorted.Length - 1;
    while (low <= high)
    {
        int mid = low + (high - low) / 2;          // avoids overflow of (low + high)
        if (sorted[mid] == target) return mid;
        if (sorted[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
        label: 'Binary search with correct boundaries',
      },
      {
        title: 'The branch and pull-request workflow',
        paragraphs: [
          'Professional teams keep main always releasable. Work happens on short-lived branches; each change is proposed as a pull request, automatically built and tested by CI, reviewed by a colleague, and merged only when green and approved. This is GitHub flow, and you should use it even when working alone: the PR description is where you explain your engineering decisions, which the rubric assesses.',
          'Good PRs are small — a few hundred lines at most — and do one thing. A PR that renames files, refactors a class and adds a feature cannot be reviewed properly. Write a description that says what changed, why, how you tested it, and anything the reviewer should look at closely.',
        ],
        code: `$ git switch -c feature/overdue-report
# ... small commits, tests green ...
$ git push -u origin feature/overdue-report
# open a pull request; CI runs dotnet build and dotnet test

# .github/workflows/ci.yml (you will build this properly in Month 5)
# on: [pull_request]
# jobs:
#   test:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-dotnet@v4
#         with: { dotnet-version: '10.0.x' }
#       - run: dotnet test`,
        label: 'Branch, push, pull request, CI',
      },
      {
        title: 'Reviewing and being reviewed',
        paragraphs: [
          'Google\'s published engineering practices put the standard clearly: approve a change once it definitely improves the overall health of the code, even if it is not perfect. As a reviewer, look first at design and correctness, then tests, then naming and readability; distinguish blocking issues from optional suggestions ("Nit:"); and explain why, so the author learns rather than just complies. Comment on the code, never the person.',
          'As an author, review your own diff before asking anyone else, keep changes small, respond to every comment, and do not take review personally — it is how teams share knowledge. The programme\'s graduation requirements include code-review participation for exactly this reason.',
        ],
      },
    ],
    table: {
      headers: ['Collection', 'Cost: lookup · add/remove', 'Use for'],
      rows: [
        ['List<T>', 'O(1) by index, O(n) by value · O(1) append, O(n) insert/remove', 'Ordered sequences'],
        ['Dictionary<K,V> / HashSet<T>', 'O(1) average · O(1) average', 'Lookup, uniqueness, counting'],
        ['SortedDictionary<K,V>', 'O(log n) · O(log n)', 'Ordered keys, range scans'],
        ['Queue<T> / Stack<T>', 'Peek O(1) · O(1)', 'FIFO lines / LIFO undo'],
        ['PriorityQueue<T,P>', 'Peek O(1) · O(log n)', 'Most urgent item next'],
      ],
    },
    exercise: {
      scenario: 'A nightly job deduplicates 200,000 customer records with: foreach (var c in customers) if (!unique.Any(u => u.Email == c.Email)) unique.Add(c); It now takes over an hour. The fix is ready on a branch with 1,900 changed lines including unrelated formatting.',
      task: 'Fix the algorithm and describe how to get the change reviewed properly.',
      answer: 'unique.Any(...) inside the loop is O(n²). Use a HashSet<string> of seen emails (with StringComparer.OrdinalIgnoreCase): if (seen.Add(c.Email)) unique.Add(c); — O(n). For review: split the branch so the algorithm fix is its own small PR with a test proving duplicates (including case differences) are removed and order is preserved; move the formatting into a separate PR. Describe the before/after complexity and timing in the PR description.',
      evidence: 'Replaces the nested scan with a HashSet and splits the change into small, reviewable PRs with tests and an explanation.',
    },
    misconceptions: [
      'Big-O is only for interviews. Accidental O(n²) is one of the most common production performance bugs.',
      'Faster hardware fixes slow algorithms. Doubling speed does not rescue a quadratic algorithm on 100× more data.',
      'Code review is about catching typos. It is mainly about design, correctness, tests and shared understanding.',
      'Big PRs are efficient. They get shallow reviews; small PRs get real ones.',
    ],
    sources: [R.collectionsPerf, R.bigO, R.googleReview, R.googleAuthor, R.githubFlow, R.proGitBranching],
    labs: [],
    questions: [
      { prompt: 'What is the Big-O time of looking up a key in a Dictionary on average? Answer like O(n).', answer: 'O(1)', accept: ['o 1', 'constant', 'o(1) constant'] },
      { prompt: 'Which .NET collection always dequeues the most urgent (smallest-priority) item?', answer: 'PriorityQueue' },
    ],
    quiz: [
      { question: 'list.Contains(x) inside a loop over another list of similar size is…', options: ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'], answer: 3, explanation: 'A linear scan inside a linear loop is quadratic.' },
      { question: 'About how many comparisons does binary search need for 1,000,000 sorted items?', options: ['1,000,000', '1,000', '20', '2'], answer: 2, explanation: 'log₂(1,000,000) ≈ 20.' },
      { question: 'Per Google\'s review guide, when should a reviewer approve?', options: ['Only when perfect', 'When the change definitely improves overall code health', 'Always', 'After 24 hours'], answer: 1, explanation: 'Progress over perfection, with no decline in health.' },
      { question: 'What does CI typically do on a pull request?', options: ['Deploys to production', 'Builds and runs the tests automatically', 'Merges the PR', 'Writes the code'], answer: 1, explanation: 'CI verifies every change automatically.' },
    ],
  },
];
