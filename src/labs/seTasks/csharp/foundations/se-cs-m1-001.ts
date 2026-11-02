import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 1 Assignment: Library Management Engine

A professional-grade version of the preparation checkpoint. The engine is the core of a real library
system: no console, no database — just the rules, written so they can be tested with a fake clock and
a fake notifier.

## What you are given

| File | Purpose |
| --- | --- |
| \`Policies.cs\` | \`ILoanPolicy\` with \`StudentPolicy\`, \`StaffPolicy\`, \`PublicPolicy\` |
| \`Models.cs\` | \`Book\`, \`Member\`, \`Loan\`, \`OperationResult\` |
| \`Notifier.cs\` | \`INotifier\` — how the engine tells a member something |
| \`Program.cs\` | a demo using a fixed date and a console notifier (press **Run**) |

## What you implement: \`LibraryEngine.cs\`

The engine receives a \`TimeProvider\` and an \`INotifier\` through its constructor. "Today" is the UTC date
of the time provider. Never read \`DateTime.Now\`.

1. **AddBook / RegisterMember** — reject blank fields, copies below 1 and duplicate ids/ISBNs.
2. **Lend(memberId, isbn)** — refuse (with a reason) when: the member or book is unknown; the member
   already holds \`Policy.MaxBooks\` books; the member owes more than **5.00** in fines; the member already has
   that book; or no copy is free for this member (see reservations). On success the loan is due
   \`Policy.LoanDays\` after today.
3. **Return(memberId, isbn)** — refuse if there is no active loan. Otherwise close the loan, add the fine
   (\`days late × Policy.DailyFine\`, capped at \`Policy.MaxFine\`) to the member's outstanding fines, and, if
   anyone is waiting for that book, **hold** the copy for the first person in the queue and notify them:
   \`"'<Title>' is ready for pickup."\`
4. **Reserve(memberId, isbn)** — only allowed when no copy is free; a member may hold one reservation per
   book and cannot reserve a book they already have. Reservations are first come, first served.
5. **Held copies** — a held copy counts as unavailable to everyone except the member it is held for.
   When that member borrows it, the hold and their reservation are consumed.
6. **PayFine(memberId, amount)** — amount must be positive and no more than what is owed.
7. **Overdue()** — active loans past their due date, most overdue first.

Business-rule failures return \`OperationResult.Fail(reason)\`; only programming errors (null arguments,
negative payments) throw.
`;

const POLICIES = `public interface ILoanPolicy
{
    string Name { get; }
    int LoanDays { get; }
    int MaxBooks { get; }
    decimal DailyFine { get; }
    decimal MaxFine { get; }
}

public sealed class StudentPolicy : ILoanPolicy
{
    public string Name => "Student";
    public int LoanDays => 14;
    public int MaxBooks => 3;
    public decimal DailyFine => 0.50m;
    public decimal MaxFine => 10.00m;
}

public sealed class StaffPolicy : ILoanPolicy
{
    public string Name => "Staff";
    public int LoanDays => 28;
    public int MaxBooks => 10;
    public decimal DailyFine => 0m;
    public decimal MaxFine => 0m;
}

public sealed class PublicPolicy : ILoanPolicy
{
    public string Name => "Public";
    public int LoanDays => 7;
    public int MaxBooks => 2;
    public decimal DailyFine => 1.00m;
    public decimal MaxFine => 15.00m;
}
`;

const MODELS = `public record Book(string Isbn, string Title, string Author, int Copies);

public sealed class Member(string id, string name, ILoanPolicy policy)
{
    public string Id { get; } = id;
    public string Name { get; } = name;
    public ILoanPolicy Policy { get; } = policy;
    public decimal FinesOwed { get; internal set; }
}

public sealed class Loan(string memberId, string isbn, DateOnly borrowedOn, DateOnly dueOn)
{
    public string MemberId { get; } = memberId;
    public string Isbn { get; } = isbn;
    public DateOnly BorrowedOn { get; } = borrowedOn;
    public DateOnly DueOn { get; } = dueOn;
    public DateOnly? ReturnedOn { get; internal set; }
    public bool IsActive => ReturnedOn is null;
}

public sealed record OperationResult(bool Ok, string Message)
{
    public static OperationResult Success(string message) => new(true, message);
    public static OperationResult Fail(string reason) => new(false, reason);
}
`;

const NOTIFIER = `public interface INotifier
{
    void Notify(string memberId, string message);
}

public sealed class ConsoleNotifier : INotifier
{
    public void Notify(string memberId, string message) => Console.WriteLine($"  [notify {memberId}] {message}");
}
`;

const PROGRAM = `var time = new DemoTime(new DateTimeOffset(2026, 3, 1, 9, 0, 0, TimeSpan.Zero));
var engine = new LibraryEngine(time, new ConsoleNotifier());

engine.AddBook(new Book("111", "Clean Code", "Robert C. Martin", 1));
engine.RegisterMember(new Member("s1", "Ama", new StudentPolicy()));
engine.RegisterMember(new Member("p1", "Kofi", new PublicPolicy()));

Console.WriteLine(engine.Lend("s1", "111").Message);
Console.WriteLine(engine.Reserve("p1", "111").Message);

time.Now = time.Now.AddDays(18);                         // four days late
Console.WriteLine(engine.Return("s1", "111").Message);
Console.WriteLine($"Ama owes {engine.FindMember("s1")!.FinesOwed:0.00}");
Console.WriteLine(engine.Lend("p1", "111").Message);

sealed class DemoTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}
`;

const ENGINE_STARTER = `public sealed class LibraryEngine(TimeProvider time, INotifier notifier)
{
    public const decimal FineBlockThreshold = 5.00m;

    public DateOnly Today => DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

    public OperationResult AddBook(Book book) => throw new NotImplementedException();

    public OperationResult RegisterMember(Member member) => throw new NotImplementedException();

    public Member? FindMember(string memberId) => throw new NotImplementedException();

    public OperationResult Lend(string memberId, string isbn) => throw new NotImplementedException();

    public OperationResult Return(string memberId, string isbn) => throw new NotImplementedException();

    public OperationResult Reserve(string memberId, string isbn) => throw new NotImplementedException();

    public OperationResult PayFine(string memberId, decimal amount) => throw new NotImplementedException();

    /// <summary>Copies free for anyone (excludes active loans and held copies).</summary>
    public int Available(string isbn) => throw new NotImplementedException();

    public IReadOnlyList<Loan> ActiveLoans(string memberId) => throw new NotImplementedException();

    /// <summary>Member ids waiting for the book, first in line first.</summary>
    public IReadOnlyList<string> Queue(string isbn) => throw new NotImplementedException();

    public IReadOnlyList<Loan> Overdue() => throw new NotImplementedException();
}
`;

const ENGINE_SOLUTION = `public sealed class LibraryEngine(TimeProvider time, INotifier notifier)
{
    public const decimal FineBlockThreshold = 5.00m;

    private readonly Dictionary<string, Book> _books = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, Member> _members = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<Loan> _loans = [];
    private readonly Dictionary<string, List<string>> _queues = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, List<string>> _holds = new(StringComparer.OrdinalIgnoreCase);

    public DateOnly Today => DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

    public OperationResult AddBook(Book book)
    {
        ArgumentNullException.ThrowIfNull(book);
        if (string.IsNullOrWhiteSpace(book.Isbn) || string.IsNullOrWhiteSpace(book.Title) || string.IsNullOrWhiteSpace(book.Author))
            return OperationResult.Fail("ISBN, title and author are required.");
        if (book.Copies < 1) return OperationResult.Fail("A book needs at least one copy.");
        if (!_books.TryAdd(book.Isbn, book)) return OperationResult.Fail($"ISBN {book.Isbn} already exists.");
        return OperationResult.Success($"Added '{book.Title}'.");
    }

    public OperationResult RegisterMember(Member member)
    {
        ArgumentNullException.ThrowIfNull(member);
        if (string.IsNullOrWhiteSpace(member.Id) || string.IsNullOrWhiteSpace(member.Name))
            return OperationResult.Fail("Member id and name are required.");
        if (!_members.TryAdd(member.Id, member)) return OperationResult.Fail($"Member {member.Id} already exists.");
        return OperationResult.Success($"Registered {member.Name} ({member.Policy.Name}).");
    }

    public Member? FindMember(string memberId) => _members.GetValueOrDefault(memberId);

    public OperationResult Lend(string memberId, string isbn)
    {
        if (!_members.TryGetValue(memberId, out var member)) return OperationResult.Fail($"No member {memberId}.");
        if (!_books.TryGetValue(isbn, out var book)) return OperationResult.Fail($"No book {isbn}.");
        var active = ActiveLoans(member.Id);
        if (active.Any(l => Same(l.Isbn, book.Isbn))) return OperationResult.Fail($"{member.Name} already has '{book.Title}'.");
        if (active.Count >= member.Policy.MaxBooks) return OperationResult.Fail($"{member.Name} has reached the limit of {member.Policy.MaxBooks} books.");
        if (member.FinesOwed > FineBlockThreshold) return OperationResult.Fail($"{member.Name} owes {member.FinesOwed:0.00} in fines.");

        var holds = HoldsFor(book.Isbn);
        bool holdingForMember = holds.Contains(member.Id, StringComparer.OrdinalIgnoreCase);
        if (!holdingForMember && Available(book.Isbn) == 0) return OperationResult.Fail($"No copy of '{book.Title}' is available.");
        if (holdingForMember)
        {
            holds.RemoveAt(holds.FindIndex(id => Same(id, member.Id)));
            QueueFor(book.Isbn).RemoveAll(id => Same(id, member.Id));
        }

        var loan = new Loan(member.Id, book.Isbn, Today, Today.AddDays(member.Policy.LoanDays));
        _loans.Add(loan);
        return OperationResult.Success($"{member.Name} borrowed '{book.Title}', due {loan.DueOn:yyyy-MM-dd}.");
    }

    public OperationResult Return(string memberId, string isbn)
    {
        var loan = _loans.FirstOrDefault(l => l.IsActive && Same(l.MemberId, memberId) && Same(l.Isbn, isbn));
        if (loan is null) return OperationResult.Fail($"Member {memberId} does not have book {isbn}.");
        var member = _members[loan.MemberId];
        var book = _books[loan.Isbn];
        loan.ReturnedOn = Today;

        int daysLate = Math.Max(0, Today.DayNumber - loan.DueOn.DayNumber);
        decimal fine = Math.Min(daysLate * member.Policy.DailyFine, member.Policy.MaxFine);
        member.FinesOwed += fine;

        var waiting = QueueFor(book.Isbn).Where(id => !HoldsFor(book.Isbn).Contains(id, StringComparer.OrdinalIgnoreCase)).ToList();
        if (waiting.Count > 0)
        {
            HoldsFor(book.Isbn).Add(waiting[0]);
            notifier.Notify(waiting[0], $"'{book.Title}' is ready for pickup.");
        }
        return OperationResult.Success(fine > 0 ? $"Returned {daysLate} days late; fine {fine:0.00}." : "Returned on time.");
    }

    public OperationResult Reserve(string memberId, string isbn)
    {
        if (!_members.TryGetValue(memberId, out var member)) return OperationResult.Fail($"No member {memberId}.");
        if (!_books.TryGetValue(isbn, out var book)) return OperationResult.Fail($"No book {isbn}.");
        if (Available(book.Isbn) > 0) return OperationResult.Fail($"'{book.Title}' is available now — borrow it instead.");
        if (ActiveLoans(member.Id).Any(l => Same(l.Isbn, book.Isbn))) return OperationResult.Fail($"{member.Name} already has '{book.Title}'.");
        var queue = QueueFor(book.Isbn);
        if (queue.Contains(member.Id, StringComparer.OrdinalIgnoreCase)) return OperationResult.Fail($"{member.Name} is already in the queue.");
        queue.Add(member.Id);
        return OperationResult.Success($"{member.Name} is number {queue.Count} in the queue for '{book.Title}'.");
    }

    public OperationResult PayFine(string memberId, decimal amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
        if (!_members.TryGetValue(memberId, out var member)) return OperationResult.Fail($"No member {memberId}.");
        if (amount > member.FinesOwed) return OperationResult.Fail($"{member.Name} only owes {member.FinesOwed:0.00}.");
        member.FinesOwed -= amount;
        return OperationResult.Success($"Paid {amount:0.00}; {member.FinesOwed:0.00} outstanding.");
    }

    public int Available(string isbn)
    {
        if (!_books.TryGetValue(isbn, out var book)) return 0;
        int onLoan = _loans.Count(l => l.IsActive && Same(l.Isbn, book.Isbn));
        return book.Copies - onLoan - HoldsFor(book.Isbn).Count;
    }

    public IReadOnlyList<Loan> ActiveLoans(string memberId) =>
        _loans.Where(l => l.IsActive && Same(l.MemberId, memberId)).ToList();

    public IReadOnlyList<string> Queue(string isbn) => QueueFor(isbn).ToList();

    public IReadOnlyList<Loan> Overdue() =>
        _loans.Where(l => l.IsActive && l.DueOn < Today).OrderBy(l => l.DueOn).ToList();

    private List<string> QueueFor(string isbn) => _queues.TryGetValue(isbn, out var q) ? q : _queues[isbn] = [];
    private List<string> HoldsFor(string isbn) => _holds.TryGetValue(isbn, out var h) ? h : _holds[isbn] = [];
    private static bool Same(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
}
`;

const TESTS = `public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}

public sealed class RecordingNotifier : INotifier
{
    public List<(string MemberId, string Message)> Sent { get; } = [];
    public void Notify(string memberId, string message) => Sent.Add((memberId, message));
}
` + csTests(`
var start = new DateTimeOffset(2026, 3, 1, 10, 0, 0, TimeSpan.Zero);
(LibraryEngine Engine, TestTime Time, RecordingNotifier Notes) Setup()
{
    var t = new TestTime(start);
    var n = new RecordingNotifier();
    var e = new LibraryEngine(t, n);
    e.AddBook(new Book("111", "Clean Code", "Robert C. Martin", 1));
    e.AddBook(new Book("222", "Refactoring", "Martin Fowler", 2));
    e.AddBook(new Book("333", "Code Complete", "Steve McConnell", 1));
    e.RegisterMember(new Member("s1", "Ama", new StudentPolicy()));
    e.RegisterMember(new Member("p1", "Kofi", new PublicPolicy()));
    e.RegisterMember(new Member("t1", "Esi", new StaffPolicy()));
    return (e, t, n);
}

Check("duplicate isbn", () => Setup().Engine.AddBook(new Book("111", "X", "Y", 1)).Ok, false);
Check("zero copies", () => Setup().Engine.AddBook(new Book("9", "X", "Y", 0)).Ok, false);
Check("duplicate member", () => Setup().Engine.RegisterMember(new Member("s1", "Other", new StaffPolicy())).Ok, false);
Check("due date from policy", () => { var s = Setup(); s.Engine.Lend("p1", "222"); return s.Engine.ActiveLoans("p1")[0].DueOn; }, new DateOnly(2026, 3, 8));
Check("staff loan length", () => { var s = Setup(); s.Engine.Lend("t1", "222"); return s.Engine.ActiveLoans("t1")[0].DueOn; }, new DateOnly(2026, 3, 29));
Check("public limit of 2", () => { var s = Setup(); s.Engine.Lend("p1", "111"); s.Engine.Lend("p1", "222"); return s.Engine.Lend("p1", "333").Ok; }, false);
Check("no copies", () => { var s = Setup(); s.Engine.Lend("s1", "111"); return s.Engine.Lend("p1", "111").Ok; }, false);
Check("available counts loans", () => { var s = Setup(); s.Engine.Lend("s1", "222"); return s.Engine.Available("222"); }, 1);
Check("fine on late return", () => { var s = Setup(); s.Engine.Lend("s1", "111"); s.Time.Now = start.AddDays(18); s.Engine.Return("s1", "111"); return s.Engine.FindMember("s1")!.FinesOwed; }, 2.00m);
Check("fine capped", () => { var s = Setup(); s.Engine.Lend("p1", "111"); s.Time.Now = start.AddDays(100); s.Engine.Return("p1", "111"); return s.Engine.FindMember("p1")!.FinesOwed; }, 15.00m);
Check("staff never fined", () => { var s = Setup(); s.Engine.Lend("t1", "111"); s.Time.Now = start.AddDays(100); s.Engine.Return("t1", "111"); return s.Engine.FindMember("t1")!.FinesOwed; }, 0m);
Check("blocked by fines", () => { var s = Setup(); s.Engine.Lend("p1", "111"); s.Time.Now = start.AddDays(20); s.Engine.Return("p1", "111"); return s.Engine.Lend("p1", "222").Ok; }, false);
Check("pay fine unblocks", () => { var s = Setup(); s.Engine.Lend("p1", "111"); s.Time.Now = start.AddDays(20); s.Engine.Return("p1", "111"); s.Engine.PayFine("p1", 13m); return s.Engine.Lend("p1", "222").Ok; }, true);
Check("overpay refused", () => { var s = Setup(); return s.Engine.PayFine("s1", 1m).Ok; }, false);
Throws<ArgumentOutOfRangeException>("negative payment", () => Setup().Engine.PayFine("s1", -1m));
Check("return without loan", () => Setup().Engine.Return("s1", "111").Ok, false);
Check("reserve when available refused", () => Setup().Engine.Reserve("p1", "222").Ok, false);
CheckSeq("queue order", () => { var s = Setup(); s.Engine.Lend("s1", "111"); s.Engine.Reserve("p1", "111"); s.Engine.Reserve("t1", "111"); return s.Engine.Queue("111"); }, ["p1", "t1"]);
Check("no double reservation", () => { var s = Setup(); s.Engine.Lend("s1", "111"); s.Engine.Reserve("p1", "111"); return s.Engine.Reserve("p1", "111").Ok; }, false);
Check("return notifies first in queue", () => { var s = Setup(); s.Engine.Lend("s1", "111"); s.Engine.Reserve("p1", "111"); s.Engine.Reserve("t1", "111"); s.Engine.Return("s1", "111"); return s.Notes.Sent.Count == 1 && s.Notes.Sent[0] == ("p1", "'Clean Code' is ready for pickup."); }, true);
Check("held copy blocks others", () => { var s = Setup(); s.Engine.Lend("s1", "111"); s.Engine.Reserve("p1", "111"); s.Engine.Return("s1", "111"); return s.Engine.Lend("t1", "111").Ok || s.Engine.Available("111") != 0; }, false);
Check("holder can borrow", () => { var s = Setup(); s.Engine.Lend("s1", "111"); s.Engine.Reserve("p1", "111"); s.Engine.Return("s1", "111"); return s.Engine.Lend("p1", "111").Ok && s.Engine.Queue("111").Count == 0; }, true);
CheckSeq("overdue most overdue first", () =>
{
    var s = Setup();
    s.Engine.Lend("p1", "111");                      // due 03-08
    s.Time.Now = start.AddDays(2);
    s.Engine.Lend("s1", "222");                      // due 03-17
    s.Time.Now = start.AddDays(30);
    return s.Engine.Overdue().Select(l => l.MemberId);
}, ["p1", "s1"]);
Expect("does not use DateTime.Now", () => { var s = Setup(); s.Time.Now = new DateTimeOffset(2040, 1, 1, 0, 0, 0, TimeSpan.Zero); s.Engine.Lend("s1", "111"); return s.Engine.ActiveLoans("s1")[0].BorrowedOn.Year == 2040; }, "Today must come from the injected TimeProvider");
`);

const task: ProjectTask = {
  id: 'se-cs-m1-001',
  title: 'Week 1: Library Management Engine',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'foundations',
  category: 'Month 1 · C# & Engineering Foundations',
  tags: ['OOP', 'polymorphism', 'TimeProvider', 'dependency injection', 'state'],
  prompt:
    'Build the rules engine of a real library: member types with different loan lengths, limits and fines (polymorphism through ' +
    'ILoanPolicy), due dates from an injected TimeProvider, fines on late returns with a cap and a borrowing block above 5.00, a ' +
    'first-come-first-served reservation queue that holds a returned copy for the next member and notifies them through an injected ' +
    'INotifier, and an overdue report. README.md lists every rule; the hidden tests use a fake clock and a recording notifier.',
  hints: [
    'Keep state in dictionaries keyed by ISBN and member id (case-insensitive comparers), a list of loans, a queue (List<string>) per ISBN, and a list of held member ids per ISBN.',
    'Available = copies − active loans − held copies. The member a copy is held for may borrow even when Available is 0.',
    'In Return: close the loan, add the capped fine, then — if someone is waiting who does not already have a hold — add a hold for them and call notifier.Notify.',
    'Check every Lend rule before creating the loan, and consume the hold and the queue entry only once you know the loan will succeed.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Policies.cs', POLICIES, { editable: false }),
    pf('Models.cs', MODELS, { editable: false }),
    pf('Notifier.cs', NOTIFIER, { editable: false }),
    pf('LibraryEngine.cs', ENGINE_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Policies.cs', POLICIES, { editable: false }),
    pf('Models.cs', MODELS, { editable: false }),
    pf('Notifier.cs', NOTIFIER, { editable: false }),
    pf('LibraryEngine.cs', ENGINE_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Library Engine', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
