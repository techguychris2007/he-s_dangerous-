import type { CurriculumLesson } from '../curriculumDefinition';
import { DN_SOURCES as S } from './sources';

const M1 = {
  interfaces: { title: 'Microsoft Learn — Interfaces', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces' },
  inheritance: { title: 'Microsoft Learn — Inheritance in C#', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance' },
  polymorphism: { title: 'Microsoft Learn — Polymorphism', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism' },
  timeProvider: { title: 'Microsoft Learn — TimeProvider', url: 'https://learn.microsoft.com/en-us/dotnet/standard/datetime/timeprovider-overview' },
  enums: { title: 'Microsoft Learn — Enumeration types', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/enum' },
  generics: { title: 'Microsoft Learn — Generic type parameters and constraints', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/where-generic-type-constraint' },
  delegates: { title: 'Microsoft Learn — Delegates and lambdas', url: 'https://learn.microsoft.com/en-us/dotnet/standard/delegates-lambdas' },
  linqDeferred: { title: 'Microsoft Learn — Deferred execution and lazy evaluation in LINQ', url: 'https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation' },
  iterators: { title: 'Microsoft Learn — Iterators (yield return)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/iterators' },
  asyncOverview: { title: 'Microsoft Learn — Asynchronous programming with async and await', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/' },
  cancellation: { title: 'Microsoft Learn — Cancellation in managed threads', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads' },
  asyncGuidance: { title: 'David Fowler — ASP.NET Core diagnostic scenarios: async guidance', url: 'https://github.com/davidfowl/AspNetCoreDiagnosticScenarios/blob/master/AsyncGuidance.md' },
  ddd: { title: 'Microsoft Learn — Designing a DDD-oriented microservice (value objects and entities)', url: 'https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice' },
} as const;

/** Month 1, weeks 1–2: professional object-oriented C# and the advanced language features (generics,
 *  delegates, LINQ, async) that every later month builds on. Assignments: Library Management Engine
 *  and Order Processing Engine (Build Portal). */
export const DN_MONTH1_A: CurriculumLesson[] = [
  {
    id: 'dn1-1',
    slug: 'interfaces-composition-polymorphism',
    title: 'Professional OOP: Interfaces, Composition and Polymorphism',
    summary: 'Program to interfaces, prefer composition to inheritance, use polymorphism to remove conditionals, and know when an abstract class is the right tool.',
    minutes: 50,
    prerequisite: 'The preparation stage, especially Classes and Objects.',
    outcomes: [
      'Define and implement interfaces, and explain how they decouple callers from implementations.',
      'Replace type-checking conditionals with polymorphism.',
      'Choose between composition, inheritance and abstract classes, and justify the choice.',
      'Inject dependencies such as a clock through the constructor so code can be tested.',
    ],
    introduction:
      'In the preparation stage you wrote classes that protect their own data. Professional systems are built from many such classes working together, and the hard part is no longer any single class: it is how they depend on each other. If the code that calculates a late fee knows exactly which kind of membership it is dealing with, every new membership type means editing that code — and re-testing everything it touches. Interfaces and polymorphism let you write code that depends on what something can do rather than what it is. This lesson covers the object-oriented tools you will use in every project from now on, and the judgement about which one to reach for.',
    keyTerms: [
      { term: 'Interface', meaning: 'A named set of members a type promises to provide, with no state of its own: a contract.' },
      { term: 'Polymorphism', meaning: 'One call that behaves differently depending on the object\'s runtime type.' },
      { term: 'Composition', meaning: 'Building behaviour by holding other objects and delegating to them ("has a").' },
      { term: 'Inheritance', meaning: 'Deriving a class from a base class to reuse and specialise it ("is a").' },
      { term: 'Abstract class', meaning: 'A base class that cannot be instantiated and may leave some members for subclasses to implement.' },
      { term: 'Dependency injection', meaning: 'Giving an object its collaborators from outside (usually through the constructor) instead of creating them inside.' },
      { term: 'Liskov substitution', meaning: 'Any implementation must be usable wherever its interface or base type is expected, without surprises.' },
    ],
    sections: [
      {
        title: 'Interfaces are contracts',
        paragraphs: [
          'An interface lists members — methods, properties — without saying how they work. A class that implements it promises to provide them. Code that depends on the interface can then work with any implementation: today\'s in-memory version, tomorrow\'s database version, a fake in a test. By convention interface names start with I.',
          'This is "program to an interface, not an implementation", one of the oldest pieces of advice in object-oriented design. The caller below never learns which notifier it has; it only knows it can call Send.',
        ],
        code: `public interface INotifier
{
    void Send(string memberId, string message);
}

public class EmailNotifier : INotifier
{
    public void Send(string memberId, string message) => Console.WriteLine($"email to {memberId}: {message}");
}

public class SmsNotifier : INotifier
{
    public void Send(string memberId, string message) => Console.WriteLine($"sms to {memberId}: {message}");
}

public class OverdueReminder(INotifier notifier)        // depends on the contract only
{
    public void Remind(string memberId, string title) =>
        notifier.Send(memberId, $"'{title}' is overdue. Please return it.");
}

new OverdueReminder(new SmsNotifier()).Remind("m1", "Refactoring");`,
        label: 'One caller, any implementation',
      },
      {
        title: 'Polymorphism replaces conditionals',
        paragraphs: [
          'A tell-tale sign of missing polymorphism is a switch on a type code repeated in several places: if (member.Type == "student") ... else if (member.Type == "staff") .... Each new member type means finding and editing every one of those switches. Move the varying behaviour behind an interface and each type carries its own rules; adding a type means adding one class, and the existing code does not change.',
          'This is the Open/Closed Principle you will study in Week 3: open for extension, closed for modification.',
        ],
        code: `// Before: every rule switches on a type code
static int LoanDays(string memberType) => memberType switch
{
    "student" => 14,
    "staff" => 28,
    _ => 7,
};

// After: each policy knows its own rules
public interface ILoanPolicy
{
    int LoanDays { get; }
    int MaxBooks { get; }
    decimal DailyFine { get; }
}

public sealed class StudentPolicy : ILoanPolicy
{
    public int LoanDays => 14;
    public int MaxBooks => 3;
    public decimal DailyFine => 0.50m;
}

public sealed class StaffPolicy : ILoanPolicy
{
    public int LoanDays => 28;
    public int MaxBooks => 10;
    public decimal DailyFine => 0m;      // staff are never fined
}`,
        label: 'Adding a member type no longer edits existing code',
      },
      {
        title: 'Composition over inheritance',
        paragraphs: [
          'Inheritance says "a Derived is a Base": the derived class gets every member of the base and can override virtual ones. It is a strong coupling — changes to the base ripple into every subclass, and C# allows only one base class. Composition says "this object has a collaborator": it holds an interface and delegates. Composition can be changed at runtime, combined freely, and tested in isolation, which is why the advice is to prefer it.',
          'A useful test: if you find yourself creating subclasses such as PremiumMemberWithEmailNotifications, the combinations are multiplying, and composition — a Member that has a policy and a notifier — is the better model.',
        ],
        code: `// Composition: a Member HAS a policy; swap it without changing Member
public sealed class Member(string id, string name, ILoanPolicy policy)
{
    public string Id { get; } = id;
    public string Name { get; } = name;
    public ILoanPolicy Policy { get; private set; } = policy;

    public void ChangePolicy(ILoanPolicy newPolicy) => Policy = newPolicy;   // promotion: no new object
}`,
        label: 'Behaviour you can change at runtime',
      },
      {
        title: 'When inheritance and abstract classes are right',
        paragraphs: [
          'Inheritance is the right tool when there is a genuine "is a" relationship and shared implementation, not just a shared interface. An abstract class can provide common code and require subclasses to fill in the specific parts, a shape called the Template Method pattern. Mark methods virtual only when overriding them is part of the design, and mark classes sealed when they are not designed to be inherited from — it makes intent explicit and lets the compiler help.',
          'Whatever you choose, implementations must honour the contract they inherit. A subclass that throws NotSupportedException from a method its base promises to support breaks every caller that trusted the base type: a violation of the Liskov Substitution Principle.',
        ],
        code: `public abstract class Report
{
    // Template method: the overall shape is fixed here...
    public string Render() => $"{Title()}\\n{new string('=', Title().Length)}\\n{Body()}";

    // ...and subclasses supply the varying parts.
    protected abstract string Title();
    protected abstract string Body();
}

public sealed class OverdueReport(IReadOnlyList<string> lines) : Report
{
    protected override string Title() => "Overdue loans";
    protected override string Body() => string.Join("\\n", lines);
}`,
        label: 'An abstract base with a template method',
      },
      {
        title: 'Injecting dependencies, including time',
        paragraphs: [
          'A class that creates its own collaborators with new, or reads DateTime.Now directly, is welded to them. You cannot test "is this loan overdue?" without waiting fourteen days. Pass collaborators in through the constructor instead. .NET provides TimeProvider for exactly this: production code uses TimeProvider.System, and tests use a fake whose time they control.',
          'This is dependency injection. In Month 2, ASP.NET Core\'s built-in container will create and wire these objects for you; the design idea is the same whether a container or your own code does the wiring.',
        ],
        code: `public sealed class LoanClock(TimeProvider time)
{
    public DateOnly Today => DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);
}

// A simple fake for tests (the Microsoft.Extensions.TimeProvider.Testing package provides FakeTimeProvider).
public sealed class FixedTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}

var fake = new FixedTime(new DateTimeOffset(2026, 3, 1, 9, 0, 0, TimeSpan.Zero));
var clock = new LoanClock(fake);
Console.WriteLine(clock.Today);          // 3/1/2026
fake.Now = fake.Now.AddDays(15);         // travel in time, instantly
Console.WriteLine(clock.Today);          // 3/16/2026`,
        label: 'Time you control is time you can test',
      },
    ],
    table: {
      headers: ['Tool', 'Use when', 'Avoid when'],
      rows: [
        ['Interface', 'Callers need a capability, implementations vary', 'There will only ever be one implementation and no tests need a fake'],
        ['Composition', 'Behaviours combine or change at runtime', '—  (a safe default)'],
        ['Inheritance', 'True "is a" with shared implementation', 'Only to reuse a few methods; combinations multiply'],
        ['Abstract class', 'Shared algorithm with varying steps', 'You just need a contract: use an interface'],
        ['sealed', 'The class is not designed for extension', 'You deliberately provide extension points'],
      ],
    },
    exercise: {
      scenario: 'A FineCalculator has a method with a switch on member.Type ("student", "staff", "public") that returns daily fines, and it calls DateTime.Today to count overdue days. A fourth member type, "child", must be added, and the tests for fines take 14 real days to write.',
      task: 'Redesign FineCalculator so adding "child" changes no existing code and fines can be tested instantly.',
      answer: 'Introduce ILoanPolicy with DailyFine (and LoanDays/MaxBooks) and one sealed class per member type; Member holds an ILoanPolicy (composition). FineCalculator computes overdue days from an injected TimeProvider and multiplies by member.Policy.DailyFine. Adding ChildPolicy is a new class only. Tests construct a fake TimeProvider set to any date, so overdue scenarios run instantly.',
      evidence: 'Replaces the type switch with a policy interface and injects time instead of reading DateTime.Today.',
    },
    misconceptions: [
      'Inheritance is the main way to reuse code. Composition is usually more flexible; inheritance is for real "is a" relationships.',
      'Interfaces are only useful when there are many implementations. A second implementation — the test fake — exists from day one.',
      'Polymorphism is a performance trick. It is a design tool for removing duplicated conditionals.',
      'DateTime.Now is fine in business logic. It makes behaviour untestable and time-zone dependent; inject TimeProvider.',
    ],
    sources: [M1.interfaces, M1.inheritance, M1.polymorphism, M1.timeProvider, S.yellowBook],
    labs: [],
    questions: [
      { prompt: 'Which .NET abstract class lets you inject a controllable clock?', answer: 'TimeProvider' },
      { prompt: 'Which keyword stops other classes inheriting from a class?', answer: 'sealed' },
    ],
    quiz: [
      { question: 'A switch on member type appears in five methods. What is the usual fix?', options: ['Add a sixth method', 'Move the varying behaviour behind an interface implemented per type', 'Use more if statements', 'Make the class static'], answer: 1, explanation: 'Polymorphism removes duplicated type switches.' },
      { question: 'Why is composition generally preferred over inheritance?', options: ['It is faster', 'It couples less and can change at runtime', 'C# forbids inheritance', 'It needs less memory'], answer: 1, explanation: 'Held collaborators can be swapped, combined and faked.' },
      { question: 'A subclass throws NotSupportedException for a method its base type promises. Which principle does it break?', options: ['Single responsibility', 'Liskov substitution', 'DRY', 'YAGNI'], answer: 1, explanation: 'Subtypes must be usable wherever the base type is expected.' },
      { question: 'Why inject TimeProvider instead of calling DateTime.Now?', options: ['It is more accurate', 'Tests can control time', 'DateTime.Now is obsolete', 'It avoids exceptions'], answer: 1, explanation: 'Controllable time makes time-based rules testable instantly.' },
    ],
  },
  {
    id: 'dn1-2',
    slug: 'modelling-a-domain-in-csharp',
    title: 'Modelling a Domain: Value Objects, Entities and Invalid States',
    summary: 'Model business concepts with records, enums and small types; separate entities from value objects; and design types so invalid states cannot be represented.',
    minutes: 50,
    prerequisite: 'Lesson: Interfaces, Composition and Polymorphism.',
    outcomes: [
      'Distinguish entities (identity) from value objects (defined by their values) and implement both.',
      'Replace primitive obsession with small validated types such as Isbn and Money.',
      'Use enums and state checks so an object can only move through valid states.',
      'Return results for expected business failures and throw for programming errors.',
    ],
    introduction:
      'The Library Management Engine you build this week is mostly a model: books, copies, members, loans, reservations and fines, and the rules that connect them. A good model makes the rules obvious and the mistakes hard. A weak one passes strings and decimals everywhere and re-checks them in every method, until one method forgets. This lesson borrows a few ideas from domain-driven design — which you will study properly in Month 3 — that pay off immediately even in small programs.',
    keyTerms: [
      { term: 'Domain', meaning: 'The real-world area your software models: lending books, taking orders, booking rooms.' },
      { term: 'Entity', meaning: 'An object with an identity that persists while its data changes, such as a member or a loan.' },
      { term: 'Value object', meaning: 'An object defined entirely by its values, compared by value and usually immutable, such as Money or an ISBN.' },
      { term: 'Primitive obsession', meaning: 'Using raw strings and numbers for domain concepts, so validation is scattered or forgotten.' },
      { term: 'State machine', meaning: 'A model in which an object is in one named state at a time and only certain transitions are allowed.' },
      { term: 'Result type', meaning: 'A return value that says whether an operation succeeded and, if not, why.' },
    ],
    sections: [
      {
        title: 'Entities and value objects',
        paragraphs: [
          'A member is an entity: if Ama changes her phone number, she is still the same member. Entities have an identifier, and two entities are the same if their ids are the same. A sum of money is a value object: 10 cedis is 10 cedis, whichever note you hold. Value objects have no identity, compare by their values and should be immutable — to change one you create another.',
          'C# records are a natural fit for value objects because they provide value equality and with-expressions. Entities are usually classes whose behaviour protects their own invariants.',
        ],
        code: `public readonly record struct Money(decimal Amount, string Currency)
{
    public static Money Zero(string currency) => new(0m, currency);

    public Money Add(Money other) => other.Currency == Currency
        ? this with { Amount = Amount + other.Amount }
        : throw new InvalidOperationException($"Cannot add {other.Currency} to {Currency}.");
}

var fine = new Money(1.50m, "GHS").Add(new Money(0.50m, "GHS"));
Console.WriteLine(fine == new Money(2.00m, "GHS"));   // True — value equality`,
        label: 'A value object with rules of its own',
      },
      {
        title: 'Curing primitive obsession',
        paragraphs: [
          'If every method takes string isbn, every method must remember that an ISBN is not just any string. Wrap it once in a type whose factory validates and normalises, and the rest of the program can trust any Isbn it receives. The compiler now also stops you passing a member id where an ISBN was expected — a bug no amount of string validation catches.',
          'A static TryCreate (the Try pattern) or a Create that returns a result keeps validation failures out of exceptions when bad input is expected, for example when parsing user input.',
        ],
        code: `public readonly record struct Isbn
{
    public string Value { get; }
    private Isbn(string value) => Value = value;

    public static bool TryCreate(string? text, out Isbn isbn)
    {
        string digits = new((text ?? "").Where(char.IsDigit).ToArray());
        isbn = new Isbn(digits);
        return digits.Length is 10 or 13;
    }

    public override string ToString() => Value;
}

if (Isbn.TryCreate("978-0-13-235088-4", out var isbn)) Console.WriteLine(isbn);   // 9780132350884
// void Lend(Isbn isbn, MemberId member) — mixing the two up is now a compile error`,
        label: 'Validate once, trust everywhere',
      },
      {
        title: 'Making invalid states unrepresentable',
        paragraphs: [
          'A loan can be active, returned, or overdue-and-returned with a fine. Modelling that with a bool isReturned plus a nullable DateTime returnedOn plus a decimal fine allows nonsense combinations: returned but no return date, a fine on an active loan. Give the entity an explicit status and allow changes only through methods that check the current state first.',
          'When a transition is not allowed — returning a loan twice — that is a bug in the caller, so throw InvalidOperationException. The object can then never be in a state the rules do not describe.',
        ],
        code: `public enum LoanStatus { Active, Returned }

public sealed class Loan(Guid id, string isbn, string memberId, DateOnly borrowedOn, DateOnly dueOn)
{
    public Guid Id { get; } = id;
    public string Isbn { get; } = isbn;
    public string MemberId { get; } = memberId;
    public DateOnly BorrowedOn { get; } = borrowedOn;
    public DateOnly DueOn { get; } = dueOn;
    public LoanStatus Status { get; private set; } = LoanStatus.Active;
    public DateOnly? ReturnedOn { get; private set; }

    public void MarkReturned(DateOnly on)
    {
        if (Status != LoanStatus.Active) throw new InvalidOperationException("This loan was already returned.");
        if (on < BorrowedOn) throw new ArgumentOutOfRangeException(nameof(on), "Cannot return before borrowing.");
        Status = LoanStatus.Returned;
        ReturnedOn = on;
    }

    public int DaysOverdue(DateOnly asOf) => Math.Max(0, (ReturnedOn ?? asOf).DayNumber - DueOn.DayNumber);
}`,
        label: 'Status changes only through guarded methods',
      },
      {
        title: 'Expected failures versus bugs',
        paragraphs: [
          'Not every failure is exceptional. "No copies available" is an everyday outcome that the caller must handle and show to a user; throwing for it makes the normal path depend on exceptions. Return a result that carries success or a reason. Reserve exceptions for broken contracts: a null argument, an impossible transition, a corrupted store.',
          'The rule of thumb used throughout this course: if a correct program can trigger it through normal use, return a result; if only a bug can trigger it, throw.',
        ],
        code: `public abstract record LendResult
{
    public sealed record Lent(Loan Loan) : LendResult;
    public sealed record Refused(string Reason) : LendResult;
}

string Describe(LendResult result) => result switch
{
    LendResult.Lent ok => $"Due back on {ok.Loan.DueOn}",
    LendResult.Refused no => $"Sorry: {no.Reason}",
    _ => throw new InvalidOperationException("Unknown result."),
};`,
        label: 'A result type and pattern matching over it',
      },
      {
        title: 'Dates, money and other traps',
        paragraphs: [
          'Use DateOnly for calendar dates such as due dates — there is no time of day to confuse — and DateTimeOffset when you need an exact instant. Count days with DayNumber differences, not by subtracting DateTime values in local time, where daylight-saving changes can make a "day" 23 or 25 hours long.',
          'Money is decimal, with the currency carried alongside it. Round once, at a defined point, with an explicit MidpointRounding mode — never repeatedly inside a loop.',
        ],
        code: `var due = new DateOnly(2026, 3, 15);
var returned = new DateOnly(2026, 3, 19);
int daysLate = returned.DayNumber - due.DayNumber;          // 4
decimal fine = Math.Round(daysLate * 0.35m, 2, MidpointRounding.AwayFromZero);   // 1.40`,
        label: 'Calendar arithmetic without surprises',
      },
    ],
    table: {
      headers: ['Concept', 'C# shape', 'Equality'],
      rows: [
        ['Value object (Money, Isbn)', 'record / readonly record struct with validation', 'By value'],
        ['Entity (Member, Loan)', 'class with an Id and guarded methods', 'By id'],
        ['Fixed set of states', 'enum + transition methods', '—'],
        ['Expected business failure', 'Result type (record hierarchy or bool + reason)', '—'],
        ['Programming error', 'ArgumentException / InvalidOperationException', '—'],
      ],
    },
    exercise: {
      scenario: 'A Reservation class has public bool IsFulfilled, public bool IsCancelled, and public DateTime? FulfilledOn. Bugs show reservations that are both fulfilled and cancelled, and fulfilled ones with no date.',
      task: 'Redesign Reservation so those states cannot exist.',
      answer: 'Replace the two bools with an enum ReservationStatus { Waiting, ReadyForPickup, Fulfilled, Cancelled } and private setters. Add methods MarkReady(), Fulfil(DateOnly on) and Cancel() that check the current status (e.g. Fulfil only from ReadyForPickup, Cancel only from Waiting or ReadyForPickup) and throw InvalidOperationException otherwise. FulfilledOn is set only inside Fulfil, so a fulfilled reservation always has a date and can never also be cancelled.',
      evidence: 'Single status enum, private setters, and transition methods that validate the current state.',
    },
    misconceptions: [
      'Records are only for DTOs. They are ideal value objects because of value equality and immutability.',
      'Validation belongs in the UI. Validate where the type is created so every path is protected.',
      'Every failure should throw. Expected business outcomes are better as results.',
      'DateTime is fine for due dates. DateOnly avoids time-of-day and time-zone confusion.',
    ],
    sources: [M1.ddd, S.records, M1.enums, S.patterns],
    labs: [],
    questions: [
      { prompt: 'What do we call an object defined only by its values, such as Money?', answer: 'value object', accept: ['a value object'] },
      { prompt: 'Which .NET type represents a calendar date with no time of day?', answer: 'DateOnly' },
    ],
    quiz: [
      { question: 'Two Member objects have the same id but different phone numbers. Are they the same member?', options: ['No', 'Yes — entities are identified by id', 'Only if the names match', 'It depends on ToString'], answer: 1, explanation: 'Entity identity is the id, not the current data.' },
      { question: 'What is primitive obsession?', options: ['Overusing generics', 'Using raw strings/numbers for domain concepts', 'Using too many classes', 'Using structs'], answer: 1, explanation: 'Small types such as Isbn centralise validation.' },
      { question: '"No copies available" during lending should usually be…', options: ['An unhandled exception', 'A returned result the caller handles', 'A crash', 'Logged and ignored'], answer: 1, explanation: 'It is an expected business outcome.' },
      { question: 'Calling MarkReturned on an already returned loan should…', options: ['Silently do nothing', 'Throw InvalidOperationException', 'Return false', 'Create a new loan'], answer: 1, explanation: 'An impossible transition indicates a caller bug.' },
    ],
  },
  {
    id: 'dn1-3',
    slug: 'generics-delegates-and-linq',
    title: 'Advanced C#: Generics, Delegates, Lambdas and LINQ in Depth',
    summary: 'Write generic types with constraints, pass behaviour as delegates and lambdas, write iterators with yield, and use LINQ fluently — including grouping, joining and deferred execution.',
    minutes: 55,
    prerequisite: 'Week 1 lessons.',
    outcomes: [
      'Write generic methods and classes and constrain their type parameters.',
      'Use Func, Action and Predicate delegates and lambdas to pass behaviour as data.',
      'Write lazy sequences with yield return and explain deferred execution.',
      'Use GroupBy, Join, SelectMany, Aggregate and ToDictionary to answer real reporting questions.',
    ],
    introduction:
      'Week 2 is about the C# features that turn a working program into a concise, reusable one. Generics let one piece of code work safely with any type. Delegates let you pass behaviour — a discount rule, a validation check — as if it were data. LINQ combines both into a query language for any collection. Used well, they remove whole classes of boilerplate; used carelessly, they hide performance problems and surprising evaluation order. You will learn both sides, because the Order Processing Engine you build this week relies on them.',
    keyTerms: [
      { term: 'Generic type parameter', meaning: 'A placeholder type such as T that is filled in when the code is used.' },
      { term: 'Constraint', meaning: 'A where clause limiting what T can be, such as where T : IComparable<T>.' },
      { term: 'Delegate', meaning: 'A type that represents a method signature; a variable of that type holds a method.' },
      { term: 'Func / Action', meaning: 'Built-in delegate types: Func returns a value, Action returns nothing.' },
      { term: 'Lambda', meaning: 'An inline anonymous function: x => x * 2.' },
      { term: 'Deferred execution', meaning: 'A LINQ query runs only when its results are enumerated, not when it is written.' },
      { term: 'Iterator', meaning: 'A method using yield return that produces a sequence one item at a time.' },
    ],
    sections: [
      {
        title: 'Generic methods and types',
        paragraphs: [
          'Without generics you would write MaxOfInts, MaxOfDecimals and MaxOfDates — or one method taking object, losing type safety and boxing every value. A generic method declares a type parameter and lets the caller supply it, usually inferred from the arguments. Constraints say what the type must support: where T : IComparable<T> lets you call CompareTo.',
          'Generic classes work the same way. A Result<T> type, for example, can carry a value of any type on success and an error message on failure — you will use exactly this shape in Month 2\'s APIs.',
        ],
        code: `static T MaxBy<T>(IReadOnlyList<T> items) where T : IComparable<T>
{
    if (items.Count == 0) throw new ArgumentException("Empty list.", nameof(items));
    T best = items[0];
    foreach (T item in items)
        if (item.CompareTo(best) > 0) best = item;
    return best;
}

Console.WriteLine(MaxBy([3, 9, 4]));                       // 9
Console.WriteLine(MaxBy(["pear", "apple", "plum"]));       // plum

public readonly record struct Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Ok(T value) => new(true, value, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}`,
        label: 'One implementation, any comparable type',
      },
      {
        title: 'Delegates and lambdas: behaviour as data',
        paragraphs: [
          'A delegate type describes a method signature. Func<decimal, decimal> is "a method taking a decimal and returning a decimal"; Action<string> is "a method taking a string and returning nothing"; Predicate<T> and Func<T, bool> test a condition. A lambda such as price => price * 0.9m creates such a method inline.',
          'Passing behaviour lets you build pipelines from small, independently testable rules. A lambda can also capture variables from its surroundings — a closure — which is powerful and occasionally surprising: it captures the variable, not its value at that moment.',
        ],
        code: `Func<decimal, decimal> tenPercentOff = price => price * 0.90m;
Func<decimal, decimal> minusFive = price => Math.Max(0m, price - 5m);

List<Func<decimal, decimal>> rules = [tenPercentOff, minusFive];
decimal Apply(decimal price) => rules.Aggregate(price, (current, rule) => rule(current));

Console.WriteLine(Apply(100m));    // 85.0  (100 * 0.9 = 90, then -5)

int threshold = 50;
Func<int, bool> isLarge = n => n > threshold;   // captures the variable
threshold = 10;
Console.WriteLine(isLarge(20));    // True — sees the updated threshold`,
        label: 'A pipeline of rules and a closure',
      },
      {
        title: 'Iterators and deferred execution',
        paragraphs: [
          'A method that uses yield return produces items one at a time as the caller asks for them; nothing runs until the first item is requested. Most LINQ operators work this way. That means a query is a recipe, not a result: if the source changes before you enumerate, you see the change; if you enumerate twice, the work — and any side effects — happen twice.',
          'Materialise with ToList() or ToArray() when you need a stable snapshot or will enumerate more than once. Leave queries deferred when you want streaming over large or infinite sequences.',
        ],
        code: `static IEnumerable<int> Evens()
{
    for (int i = 0; ; i += 2)
    {
        Console.Write($"[{i}]");          // shows when work actually happens
        yield return i;
    }
}

var firstThree = Evens().Take(3);         // nothing printed yet
Console.WriteLine(string.Join(",", firstThree));   // [0][2][4]0,2,4

List<int> numbers = [1, 2, 3];
var big = numbers.Where(n => n > 1);      // a recipe
numbers.Add(10);
Console.WriteLine(big.Count());           // 3 — sees the item added later`,
        label: 'Lazy sequences and their consequences',
      },
      {
        title: 'LINQ for real reporting questions',
        paragraphs: [
          'GroupBy collects items with the same key; combine it with Select to compute per-group totals. Join matches two sequences on a key, like a database join. SelectMany flattens a sequence of sequences — every line item of every order. ToDictionary and ToLookup build lookup structures. Aggregate folds a sequence into one value.',
          'Read a LINQ chain top to bottom as a sentence. If it no longer reads clearly, split it into named variables; clarity beats cleverness.',
        ],
        code: `record Order(int Id, string Customer, List<Line> Lines);
record Line(string Sku, int Qty, decimal UnitPrice);

List<Order> orders =
[
    new(1, "Ama",  [new("PEN", 10, 2.5m), new("BOOK", 1, 40m)]),
    new(2, "Kofi", [new("PEN", 5, 2.5m)]),
    new(3, "Ama",  [new("BAG", 1, 120m)]),
];

var revenueByCustomer = orders
    .GroupBy(o => o.Customer)
    .Select(g => new { Customer = g.Key, Revenue = g.SelectMany(o => o.Lines).Sum(l => l.Qty * l.UnitPrice) })
    .OrderByDescending(x => x.Revenue);
// Ama 185.0, Kofi 12.5

var unitsBySku = orders.SelectMany(o => o.Lines)
    .GroupBy(l => l.Sku)
    .ToDictionary(g => g.Key, g => g.Sum(l => l.Qty));   // PEN 15, BOOK 1, BAG 1`,
        label: 'Grouping, flattening and summarising',
      },
      {
        title: 'Performance and correctness traps',
        paragraphs: [
          'Calling Count() or Any() on a deferred query re-runs it; calling list.Contains inside a Where over another large list is O(n × m) — build a HashSet first. First() throws on an empty sequence and Single() also throws when there is more than one match; choose deliberately. And LINQ over a database (Month 2) is translated into SQL, so not every C# method you can call in memory can be translated there.',
        ],
        code: `List<string> banned = ["x1", "x7", "x9"];
List<string> skus = Enumerable.Range(0, 100_000).Select(i => "x" + i).ToList();

var slow = skus.Where(s => !banned.Contains(s));      // fine for 3 banned; O(n*m) as banned grows
var bannedSet = banned.ToHashSet();
var fast = skus.Where(s => !bannedSet.Contains(s));   // O(n)`,
        label: 'Choose the right lookup structure',
      },
    ],
    table: {
      headers: ['Operator', 'Does', 'Watch out'],
      rows: [
        ['Where / Select', 'Filter / transform', 'Deferred'],
        ['GroupBy', 'Group items by key', 'Deferred; whole source read on first enumeration'],
        ['SelectMany', 'Flatten nested sequences', '—'],
        ['First / Single', 'One item', 'Throw on empty (and Single on many)'],
        ['ToList / ToDictionary', 'Materialise now', 'ToDictionary throws on duplicate keys'],
        ['Aggregate', 'Fold to one value', 'Needs a seed for empty input'],
      ],
    },
    exercise: {
      scenario: 'A report method builds var pending = orders.Where(o => o.Status == "Pending"); then calls pending.Count(), pending.Sum(...), and loops over pending to send emails — and the orders come from a slow web service call inside the Where.',
      task: 'Explain the performance and correctness problems and fix them.',
      answer: 'pending is deferred, so each Count, Sum and foreach re-runs the query — and the slow call — three times; if statuses change between enumerations the three results can even disagree. Materialise once: var pending = orders.Where(...).ToList(); then use pending.Count (the property), pending.Sum(...) and the loop over the same snapshot.',
      evidence: 'Identifies repeated enumeration of a deferred query and materialises it once.',
    },
    misconceptions: [
      'A LINQ query runs where it is written. It runs when enumerated, and again on each enumeration.',
      'Lambdas capture the value at creation. They capture the variable.',
      'Generics are only for collections. Result<T>, repositories and pipelines all use them.',
      'LINQ is always slower than loops. Usually comparable; the trap is algorithmic (nested Contains), not LINQ itself.',
    ],
    sources: [M1.generics, M1.delegates, M1.linqDeferred, M1.iterators, S.linq],
    labs: [],
    questions: [
      { prompt: 'Which built-in delegate type represents a method that returns nothing?', answer: 'Action' },
      { prompt: 'Which LINQ operator flattens a sequence of sequences?', answer: 'SelectMany' },
    ],
    quiz: [
      { question: 'What does where T : IComparable<T> allow inside the method?', options: ['Creating T with new()', 'Calling CompareTo on T values', 'Casting T to int', 'Nothing'], answer: 1, explanation: 'The constraint guarantees CompareTo exists.' },
      { question: 'var q = list.Where(x => x > 0); list.Add(5); q.Count() — does q see 5?', options: ['No', 'Yes, because execution is deferred', 'Only after ToList', 'It throws'], answer: 1, explanation: 'The query runs when Count enumerates it.' },
      { question: 'What does First() do on an empty sequence?', options: ['Returns null', 'Throws InvalidOperationException', 'Returns default', 'Returns an empty list'], answer: 1, explanation: 'Use FirstOrDefault for a default instead.' },
      { question: 'Best fix for skus.Where(s => banned.Contains(s)) with a large banned list?', options: ['Use a for loop', 'Convert banned to a HashSet first', 'Sort skus', 'Use Select'], answer: 1, explanation: 'HashSet lookups are O(1).' },
    ],
  },
  {
    id: 'dn1-4',
    slug: 'async-await-and-cancellation',
    title: 'Asynchronous C#: async, await, Tasks and Cancellation',
    summary: 'Understand what async/await does and does not do, run work concurrently with Task.WhenAll, add timeouts and cancellation, and avoid the classic deadlocks and fire-and-forget bugs.',
    minutes: 55,
    prerequisite: 'Lesson: Generics, Delegates and LINQ.',
    outcomes: [
      'Explain how await frees a thread while waiting for I/O, and why async is not the same as parallel.',
      'Write async methods returning Task and Task<T>, and compose them with WhenAll and WhenAny.',
      'Propagate CancellationToken and implement timeouts.',
      'Avoid async void, .Result/.Wait() blocking, and unobserved exceptions.',
    ],
    introduction:
      'An order processing system spends most of its time waiting: for a payment provider, for a database, for an email service. If each wait blocks a thread, a server runs out of threads long before it runs out of processor. C#\'s async and await let a method pause at a wait without blocking, and resume when the result arrives. The syntax is simple; the mental model takes a little care. This lesson builds that model, then covers the techniques the Order Processing Engine needs: running independent calls at the same time, timing out slow ones, and cancelling work nobody is waiting for any more.',
    keyTerms: [
      { term: 'Task / Task<T>', meaning: 'An object representing work that will complete in the future, optionally with a result of type T.' },
      { term: 'await', meaning: 'Pauses the async method until the task completes, without blocking the thread.' },
      { term: 'Concurrency', meaning: 'Several operations in progress over the same period; not necessarily running at the same instant.' },
      { term: 'CancellationToken', meaning: 'A signal passed into operations so they can stop early when the caller no longer needs the result.' },
      { term: 'Task.WhenAll', meaning: 'A task that completes when all of the given tasks complete.' },
      { term: 'async void', meaning: 'An async method with no Task to await; its exceptions cannot be caught by the caller. Only for event handlers.' },
    ],
    sections: [
      {
        title: 'What await actually does',
        paragraphs: [
          'When an async method reaches await on a task that has not finished, it returns to its caller immediately, handing back a Task that represents the rest of the method. The thread is free to do other work. When the awaited operation completes, the rest of the method is scheduled to continue, and when it finishes, its Task completes with the result.',
          'Async is about not wasting threads while waiting for I/O — network, disk, timers. It does not make CPU-heavy work faster; for that you use parallelism (Parallel.ForEach, Task.Run), which is a different tool for a different problem.',
        ],
        code: `static async Task<decimal> GetExchangeRateAsync(string currency, CancellationToken ct)
{
    await Task.Delay(200, ct);              // stands in for a network call
    return currency == "USD" ? 15.2m : 1m;
}

decimal rate = await GetExchangeRateAsync("USD", CancellationToken.None);
Console.WriteLine(rate);                    // 15.2`,
        label: 'An async method returning Task<T>',
      },
      {
        title: 'Sequential versus concurrent awaits',
        paragraphs: [
          'Awaiting one call after another takes the sum of their times. If the calls do not depend on each other, start them all and then await them together with Task.WhenAll — the total becomes roughly the slowest call. This one change is often the biggest performance win in service code.',
          'Start tasks deliberately: calling an async method starts its work. Store the tasks, then await WhenAll; do not await inside a loop when the iterations are independent.',
        ],
        code: `async Task<string> Fetch(string name, int ms) { await Task.Delay(ms); return name; }

var watch = System.Diagnostics.Stopwatch.StartNew();
await Fetch("stock", 300);
await Fetch("price", 300);
Console.WriteLine($"sequential ~{watch.ElapsedMilliseconds} ms");   // ~600

watch.Restart();
Task<string> stock = Fetch("stock", 300);   // both start now
Task<string> price = Fetch("price", 300);
string[] both = await Task.WhenAll(stock, price);
Console.WriteLine($"concurrent ~{watch.ElapsedMilliseconds} ms");   // ~300`,
        label: 'Independent calls, started together',
      },
      {
        title: 'Cancellation and timeouts',
        paragraphs: [
          'Accept a CancellationToken as the last parameter of every async method that does I/O, and pass it on to everything you call. When a user closes the page or a request times out, the token is cancelled and the whole chain can stop. Cancelled work throws OperationCanceledException, which callers usually let propagate.',
          'A CancellationTokenSource created with a delay — or CancelAfter — gives you a timeout. WaitAsync(timeout) is a concise alternative when you just need to stop waiting.',
        ],
        code: `async Task<string> ChargeCardAsync(decimal amount, CancellationToken ct)
{
    await Task.Delay(2_000, ct);    // a slow payment provider
    return "approved";
}

using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(500));
try
{
    string status = await ChargeCardAsync(99m, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Payment timed out — order left as PaymentPending");
}`,
        label: 'A timeout that actually stops the work',
      },
      {
        title: 'Exceptions in async code',
        paragraphs: [
          'An exception inside an async method is stored in its Task and rethrown at the await, so ordinary try/catch around await works. With WhenAll, awaiting rethrows the first exception, while the Task\'s Exception property holds all of them — inspect the individual tasks when you need every failure.',
          'async void methods have no Task, so their exceptions cannot be caught by the caller and can crash the process. Use async void only for UI event handlers; everywhere else, return Task.',
        ],
        code: `async Task<int> Fails() { await Task.Yield(); throw new InvalidOperationException("provider down"); }

try
{
    await Fails();
}
catch (InvalidOperationException e)
{
    Console.WriteLine($"caught: {e.Message}");   // caught: provider down
}`,
        label: 'try/catch works across await',
      },
      {
        title: 'The classic mistakes',
        paragraphs: [
          'Blocking on async code with .Result or .Wait() wastes the thread you were trying to save and, in environments with a synchronization context, can deadlock. "Async all the way" is the rule: if you call an async method, your method should be async too, up to the entry point.',
          'Fire-and-forget — calling an async method without awaiting or storing its task — silently loses exceptions and lets work outlive the request that started it. If background work is genuinely needed, hand it to something designed to own it (Month 3 covers queues and background services).',
          'Avoid async over sync: wrapping CPU work in Task.Run inside a library method only hides blocking. And when a method can often complete synchronously in a hot path, ValueTask<T> avoids an allocation — an optimisation, not a default.',
        ],
        code: `// ✗ blocks, can deadlock:        var rate = GetExchangeRateAsync("USD", ct).Result;
// ✗ fire-and-forget loses errors: SendConfirmationEmailAsync(order);
// ✗ async void outside handlers:  async void Process() { ... }

// ✓ async all the way, token passed through
async Task ConfirmAsync(int orderId, CancellationToken ct)
{
    await Task.Delay(10, ct);     // save the order
    await Task.Delay(10, ct);     // then send the email — awaited, so failures surface
}`,
        label: 'Recognise these in code review',
      },
    ],
    table: {
      headers: ['Need', 'Use', 'Avoid'],
      rows: [
        ['Wait for I/O without blocking', 'await', '.Result / .Wait()'],
        ['Several independent calls', 'Task.WhenAll', 'await inside a loop'],
        ['First of several to finish', 'Task.WhenAny', 'Polling'],
        ['Stop when no longer needed', 'CancellationToken passed through', 'Ignoring the token'],
        ['Time limit', 'CancellationTokenSource(timeout) / WaitAsync', 'Thread.Sleep loops'],
        ['CPU-bound work', 'Parallel / Task.Run at the app edge', 'async alone'],
      ],
    },
    exercise: {
      scenario: 'An order confirmation does: var stock = CheckStockAsync(order).Result; var fraud = await CheckFraudAsync(order); then calls SendEmailAsync(order); without await, and accepts no CancellationToken. Requests pile up under load and some customers never get emails, with no errors logged.',
      task: 'List each problem and rewrite the flow.',
      answer: '.Result blocks a thread (and risks deadlock); stock and fraud checks are independent but run sequentially; SendEmailAsync is fire-and-forget so its failures vanish; there is no cancellation so abandoned requests keep working. Rewrite: async Task ConfirmAsync(Order order, CancellationToken ct) { var stock = CheckStockAsync(order, ct); var fraud = CheckFraudAsync(order, ct); await Task.WhenAll(stock, fraud); if (await stock && !await fraud) { ...save...; await SendEmailAsync(order, ct); } } with a timeout source where appropriate.',
      evidence: 'Removes blocking, runs independent checks concurrently, awaits the email, and threads a CancellationToken through.',
    },
    misconceptions: [
      'async makes code run on another thread. It frees the current thread while waiting; it does not create parallelism.',
      '.Result is fine if you are careful. It blocks and can deadlock; await instead.',
      'Cancellation is automatic. Methods must accept and pass on the token, and check it.',
      'async void is just async without a return value. Its exceptions cannot be observed by callers.',
    ],
    sources: [M1.asyncOverview, M1.cancellation, M1.asyncGuidance],
    labs: [],
    questions: [
      { prompt: 'Which Task method waits for several tasks to all complete?', answer: 'WhenAll', accept: ['Task.WhenAll'] },
      { prompt: 'Which exception type signals that awaited work was cancelled?', answer: 'OperationCanceledException', accept: ['TaskCanceledException'] },
    ],
    quiz: [
      { question: 'What does await do when the task is not yet complete?', options: ['Blocks the thread', 'Returns control to the caller and resumes later', 'Starts a new thread', 'Throws'], answer: 1, explanation: 'The method suspends without blocking.' },
      { question: 'Two independent 300 ms calls awaited one after the other take about…', options: ['300 ms', '600 ms', '150 ms', '0 ms'], answer: 1, explanation: 'Sequential awaits add up; WhenAll overlaps them.' },
      { question: 'Why avoid async void?', options: ['It is slower', 'Callers cannot await it or catch its exceptions', 'It does not compile', 'It blocks'], answer: 1, explanation: 'There is no Task to observe.' },
      { question: 'Where should a CancellationToken parameter go?', options: ['First', 'Last, and passed to every async call made', 'Nowhere — use a static', 'Only in Main'], answer: 1, explanation: 'Convention is last, and it must flow through the chain.' },
    ],
  },
];
