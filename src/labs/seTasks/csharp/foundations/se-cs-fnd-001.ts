import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Checkpoint: Console Library System

The preparation stage's checkpoint. Build the core of a small library system that a librarian could
actually use from a terminal. It must:

- add books and members, rejecting invalid or duplicate data;
- lend and return books, enforcing the library's rules;
- search the catalogue;
- save everything to a JSON file and load it again next time;
- turn any typed command — including nonsense — into a helpful message, never a crash.

## Files

| File | You | Purpose |
| --- | --- | --- |
| \`Models.cs\` | read | \`Book\`, \`Member\` and \`Loan\` records |
| \`Result.cs\` | read | \`Result\`: success or failure plus a message |
| \`Library.cs\` | **implement** | the rules, search and persistence |
| \`CommandProcessor.cs\` | **implement** | turns a text command into a call on \`Library\` |
| \`Program.cs\` | read | runs a short demo script (press **Run**) |

## Library rules

1. A book needs a non-blank ISBN and title, a non-blank author, and at least 1 copy. ISBNs are unique.
2. A member needs a non-blank id and name. Member ids are unique.
3. Borrowing fails if the member or book is unknown, no copies are left, the member already has
   that book, or the member already has \`Library.MaxLoansPerMember\` (3) books.
4. Returning fails if that member does not have that book.
5. \`Search(text)\` matches title or author, ignoring case, ordered by title. Blank text returns nothing.
6. \`Save(path)\` writes JSON via a temporary file then replaces the real file;
   \`Load(path)\` returns an empty library when the file does not exist.

Every rule failure is a \`Result\` with \`Ok == false\` and a message — never an exception. Exceptions are
for programming mistakes such as passing \`null\`.

## Commands

Fields are separated by \`|\` so titles may contain spaces:

    add-book|<isbn>|<title>|<author>|<copies>
    add-member|<id>|<name>
    borrow|<memberId>|<isbn>
    return|<memberId>|<isbn>
    search|<text>
    available|<isbn>

## Working locally

Create a console app with \`dotnet new console\`, copy these files in, and replace the demo in
\`Program.cs\` with a loop over \`Console.ReadLine()\`. Commit to Git in small steps as you go — the
history is part of the work.
`;

const MODELS = `public record Book(string Isbn, string Title, string Author, int TotalCopies);

public record Member(string Id, string Name);

public record Loan(string MemberId, string Isbn);
`;

const RESULT = `public record Result(bool Ok, string Message)
{
    public static Result Success(string message) => new(true, message);
    public static Result Failure(string message) => new(false, message);

    public override string ToString() => (Ok ? "OK: " : "Error: ") + Message;
}
`;

const PROGRAM = `// A short demo script. The browser workspace has no interactive keyboard input, so Run plays these
// commands; on your own machine, replace this array with a loop over Console.ReadLine().
var library = Library.Load("library.json");
var commands = new CommandProcessor(library);

string[] script =
[
    "add-book|978-0132350884|Clean Code|Robert C. Martin|2",
    "add-book|978-0134757599|Refactoring|Martin Fowler|1",
    "add-member|m1|Ama Owusu",
    "borrow|m1|978-0134757599",
    "borrow|m1|978-0134757599",
    "available|978-0134757599",
    "search|martin",
    "return|m1|978-0134757599",
    "lend|m1|978-0132350884",
];

foreach (string line in script)
{
    Console.WriteLine($"> {line}");
    Console.WriteLine(commands.Execute(line));
}

library.Save("library.json");
`;

const LIBRARY_STARTER = `using System.Text.Json;

public class Library
{
    public const int MaxLoansPerMember = 3;

    // TODO: choose collections. Hint: dictionaries keyed by ISBN and member id, plus a list of loans.

    public Result AddBook(Book book) => throw new NotImplementedException();

    public Result AddMember(Member member) => throw new NotImplementedException();

    public Result Borrow(string memberId, string isbn) => throw new NotImplementedException();

    public Result Return(string memberId, string isbn) => throw new NotImplementedException();

    /// <summary>Copies of the book currently on the shelf, or 0 for an unknown ISBN.</summary>
    public int Available(string isbn) => throw new NotImplementedException();

    /// <summary>The ISBNs this member currently has, in the order they were borrowed.</summary>
    public IReadOnlyList<string> LoansFor(string memberId) => throw new NotImplementedException();

    public IReadOnlyList<Book> Search(string text) => throw new NotImplementedException();

    public string ToJson() => throw new NotImplementedException();

    public static Library FromJson(string json) => throw new NotImplementedException();

    public void Save(string path) => throw new NotImplementedException();

    public static Library Load(string path) => throw new NotImplementedException();
}
`;

const LIBRARY_SOLUTION = `using System.Text.Json;

public class Library
{
    public const int MaxLoansPerMember = 3;

    private readonly Dictionary<string, Book> _books = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, Member> _members = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<Loan> _loans = [];

    public Result AddBook(Book book)
    {
        ArgumentNullException.ThrowIfNull(book);
        if (string.IsNullOrWhiteSpace(book.Isbn)) return Result.Failure("A book needs an ISBN.");
        if (string.IsNullOrWhiteSpace(book.Title)) return Result.Failure("A book needs a title.");
        if (string.IsNullOrWhiteSpace(book.Author)) return Result.Failure("A book needs an author.");
        if (book.TotalCopies < 1) return Result.Failure("A book needs at least one copy.");
        var clean = book with { Isbn = book.Isbn.Trim(), Title = book.Title.Trim(), Author = book.Author.Trim() };
        if (!_books.TryAdd(clean.Isbn, clean)) return Result.Failure($"A book with ISBN {clean.Isbn} already exists.");
        return Result.Success($"Added '{clean.Title}' ({clean.TotalCopies} copies).");
    }

    public Result AddMember(Member member)
    {
        ArgumentNullException.ThrowIfNull(member);
        if (string.IsNullOrWhiteSpace(member.Id)) return Result.Failure("A member needs an id.");
        if (string.IsNullOrWhiteSpace(member.Name)) return Result.Failure("A member needs a name.");
        var clean = new Member(member.Id.Trim(), member.Name.Trim());
        if (!_members.TryAdd(clean.Id, clean)) return Result.Failure($"Member {clean.Id} already exists.");
        return Result.Success($"Added member {clean.Name}.");
    }

    public Result Borrow(string memberId, string isbn)
    {
        if (!_members.TryGetValue(memberId.Trim(), out var member)) return Result.Failure($"No member with id {memberId}.");
        if (!_books.TryGetValue(isbn.Trim(), out var book)) return Result.Failure($"No book with ISBN {isbn}.");
        var current = LoansFor(member.Id);
        if (current.Contains(book.Isbn, StringComparer.OrdinalIgnoreCase)) return Result.Failure($"{member.Name} already has '{book.Title}'.");
        if (current.Count >= MaxLoansPerMember) return Result.Failure($"{member.Name} already has {MaxLoansPerMember} books.");
        if (Available(book.Isbn) == 0) return Result.Failure($"No copies of '{book.Title}' are available.");
        _loans.Add(new Loan(member.Id, book.Isbn));
        return Result.Success($"{member.Name} borrowed '{book.Title}'.");
    }

    public Result Return(string memberId, string isbn)
    {
        int index = _loans.FindIndex(l => string.Equals(l.MemberId, memberId.Trim(), StringComparison.OrdinalIgnoreCase)
                                          && string.Equals(l.Isbn, isbn.Trim(), StringComparison.OrdinalIgnoreCase));
        if (index < 0) return Result.Failure($"Member {memberId} does not have book {isbn}.");
        _loans.RemoveAt(index);
        return Result.Success("Returned.");
    }

    public int Available(string isbn)
    {
        if (!_books.TryGetValue(isbn.Trim(), out var book)) return 0;
        return book.TotalCopies - _loans.Count(l => string.Equals(l.Isbn, book.Isbn, StringComparison.OrdinalIgnoreCase));
    }

    public IReadOnlyList<string> LoansFor(string memberId) =>
        _loans.Where(l => string.Equals(l.MemberId, memberId.Trim(), StringComparison.OrdinalIgnoreCase)).Select(l => l.Isbn).ToList();

    public IReadOnlyList<Book> Search(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return [];
        string term = text.Trim();
        return _books.Values
            .Where(b => b.Title.Contains(term, StringComparison.OrdinalIgnoreCase) || b.Author.Contains(term, StringComparison.OrdinalIgnoreCase))
            .OrderBy(b => b.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private record Snapshot(List<Book> Books, List<Member> Members, List<Loan> Loans);

    public string ToJson() =>
        JsonSerializer.Serialize(new Snapshot([.. _books.Values], [.. _members.Values], [.. _loans]), new JsonSerializerOptions { WriteIndented = true });

    public static Library FromJson(string json)
    {
        var snapshot = JsonSerializer.Deserialize<Snapshot>(json) ?? new Snapshot([], [], []);
        var library = new Library();
        foreach (var book in snapshot.Books ?? []) library.AddBook(book);
        foreach (var member in snapshot.Members ?? []) library.AddMember(member);
        foreach (var loan in snapshot.Loans ?? []) library.Borrow(loan.MemberId, loan.Isbn);
        return library;
    }

    public void Save(string path)
    {
        string temp = path + ".tmp";
        File.WriteAllText(temp, ToJson());
        File.Move(temp, path, overwrite: true);
    }

    public static Library Load(string path) => File.Exists(path) ? FromJson(File.ReadAllText(path)) : new Library();
}
`;

const COMMANDS_STARTER = `public class CommandProcessor(Library library)
{
    /// <summary>Runs one command line and returns the message to show. Never throws.</summary>
    public string Execute(string? line)
    {
        // TODO: split on '|', trim each part, dispatch on the first part.
        // Unknown command  -> "Unknown command '<name>'. Commands: add-book, add-member, borrow, return, search, available"
        // Wrong field count -> "Usage: <the command's format from the README>"
        // Copies not a whole number -> "Copies must be a whole number."
        // search           -> "No matches." or one line per book: "<Title> by <Author> (<available>/<total>)"
        // available        -> "<n> available"
        // add/borrow/return -> the Result's ToString()
        throw new NotImplementedException();
    }
}
`;

const COMMANDS_SOLUTION = `public class CommandProcessor(Library library)
{
    private const string CommandList = "add-book, add-member, borrow, return, search, available";

    /// <summary>Runs one command line and returns the message to show. Never throws.</summary>
    public string Execute(string? line)
    {
        if (string.IsNullOrWhiteSpace(line)) return "Type a command. Commands: " + CommandList;
        string[] parts = line.Split('|').Select(p => p.Trim()).ToArray();
        string name = parts[0].ToLowerInvariant();

        return name switch
        {
            "add-book" when parts.Length == 5 => AddBook(parts),
            "add-book" => "Usage: add-book|<isbn>|<title>|<author>|<copies>",
            "add-member" when parts.Length == 3 => library.AddMember(new Member(parts[1], parts[2])).ToString(),
            "add-member" => "Usage: add-member|<id>|<name>",
            "borrow" when parts.Length == 3 => library.Borrow(parts[1], parts[2]).ToString(),
            "borrow" => "Usage: borrow|<memberId>|<isbn>",
            "return" when parts.Length == 3 => library.Return(parts[1], parts[2]).ToString(),
            "return" => "Usage: return|<memberId>|<isbn>",
            "search" when parts.Length == 2 => Search(parts[1]),
            "search" => "Usage: search|<text>",
            "available" when parts.Length == 2 => $"{library.Available(parts[1])} available",
            "available" => "Usage: available|<isbn>",
            _ => $"Unknown command '{parts[0]}'. Commands: {CommandList}",
        };
    }

    private string AddBook(string[] parts)
    {
        if (!int.TryParse(parts[4], out int copies)) return "Copies must be a whole number.";
        return library.AddBook(new Book(parts[1], parts[2], parts[3], copies)).ToString();
    }

    private string Search(string text)
    {
        var matches = library.Search(text);
        if (matches.Count == 0) return "No matches.";
        return string.Join("\\n", matches.Select(b => $"{b.Title} by {b.Author} ({library.Available(b.Isbn)}/{b.TotalCopies})"));
    }
}
`;

const TESTS = csTests(`
Library Fresh()
{
    var lib = new Library();
    lib.AddBook(new Book("111", "Clean Code", "Robert C. Martin", 2));
    lib.AddBook(new Book("222", "Refactoring", "Martin Fowler", 1));
    lib.AddBook(new Book("333", "The Pragmatic Programmer", "Hunt & Thomas", 1));
    lib.AddBook(new Book("444", "Code Complete", "Steve McConnell", 1));
    lib.AddMember(new Member("m1", "Ama"));
    lib.AddMember(new Member("m2", "Kofi"));
    return lib;
}

Check("add book ok", () => new Library().AddBook(new Book("1", "T", "A", 1)).Ok, true);
Check("duplicate isbn rejected", () => { var l = Fresh(); return l.AddBook(new Book("111", "Other", "X", 1)).Ok; }, false);
Check("blank title rejected", () => new Library().AddBook(new Book("1", " ", "A", 1)).Ok, false);
Check("zero copies rejected", () => new Library().AddBook(new Book("1", "T", "A", 0)).Ok, false);
Check("duplicate member rejected", () => Fresh().AddMember(new Member("m1", "Someone")).Ok, false);
Check("blank member name rejected", () => new Library().AddMember(new Member("x", "")).Ok, false);
Check("borrow ok", () => { var l = Fresh(); return l.Borrow("m1", "111").Ok && l.Available("111") == 1; }, true);
Check("unknown member", () => Fresh().Borrow("nobody", "111").Ok, false);
Check("unknown book", () => Fresh().Borrow("m1", "999").Ok, false);
Check("no copies left", () => { var l = Fresh(); l.Borrow("m1", "222"); return l.Borrow("m2", "222").Ok; }, false);
Check("same book twice", () => { var l = Fresh(); l.Borrow("m1", "111"); return l.Borrow("m1", "111").Ok; }, false);
Check("loan limit of 3", () => { var l = Fresh(); l.Borrow("m1", "111"); l.Borrow("m1", "222"); l.Borrow("m1", "333"); return l.Borrow("m1", "444").Ok; }, false);
Check("return frees a copy", () => { var l = Fresh(); l.Borrow("m1", "222"); return l.Return("m1", "222").Ok && l.Available("222") == 1; }, true);
Check("return without loan fails", () => Fresh().Return("m1", "111").Ok, false);
CheckSeq("loans in order", () => { var l = Fresh(); l.Borrow("m2", "333"); l.Borrow("m2", "111"); return l.LoansFor("m2"); }, ["333", "111"]);
Check("unknown isbn available", () => Fresh().Available("nope"), 0);
CheckSeq("search title and author", () => Fresh().Search("MARTIN").Select(b => b.Title), ["Clean Code", "Refactoring"]);
CheckSeq("search blank", () => Fresh().Search("  ").Select(b => b.Title), []);
Check("json round trip keeps loans", () => { var l = Fresh(); l.Borrow("m1", "222"); var copy = Library.FromJson(l.ToJson()); return copy.Available("222") == 0 && copy.LoansFor("m1").Count == 1; }, true);
Check("save and load", () => { string p = "lib-" + Guid.NewGuid() + ".json"; var l = Fresh(); l.Borrow("m2", "111"); l.Save(p); return Library.Load(p).Available("111"); }, 1);
Check("load missing file", () => Library.Load("missing-" + Guid.NewGuid() + ".json").Search("a").Count, 0);
Expect("no temp file left behind", () => { string p = "lib-" + Guid.NewGuid() + ".json"; Fresh().Save(p); return File.Exists(p) && !File.Exists(p + ".tmp"); }, "Save should replace the file via a temp file and leave no .tmp behind");

CommandProcessor Cp() => new(Fresh());
Check("command add-book", () => new CommandProcessor(new Library()).Execute("add-book|9|Domain-Driven Design|Eric Evans|2"), "OK: Added 'Domain-Driven Design' (2 copies).");
Check("command bad copies", () => Cp().Execute("add-book|9|T|A|two"), "Copies must be a whole number.");
Check("command usage", () => Cp().Execute("borrow|m1"), "Usage: borrow|<memberId>|<isbn>");
Expect("command unknown", () => Cp().Execute("lend|m1|111").StartsWith("Unknown command 'lend'."), "unknown commands should name the command");
Check("command available", () => new CommandProcessor(Fresh()).Execute("available|111"), "2 available");
Check("command search", () => new CommandProcessor(Fresh()).Execute("search|fowler"), "Refactoring by Martin Fowler (1/1)");
Check("command search none", () => Cp().Execute("search|zzz"), "No matches.");
Expect("command failure message", () => new CommandProcessor(Fresh()).Execute("borrow|ghost|111").StartsWith("Error: "), "rule failures are shown as 'Error: ...'");
Expect("never throws", () => { var c = Cp(); foreach (var s in new[] { "", "|||", "add-member", null, "search" }) c.Execute(s); return true; }, "Execute must handle any input without throwing");
`);

const task: ProjectTask = {
  id: 'se-cs-fnd-001',
  title: 'Checkpoint: Console Library System',
  difficulty: 'Medium',
  language: 'csharp',
  track: 'foundations',
  category: 'Preparation Checkpoint',
  tags: ['classes', 'collections', 'validation', 'JSON', 'commands'],
  prompt:
    'Build the core of a console library system: books and members with validation, borrowing and returning under real rules ' +
    '(availability, one copy per member, a three-book limit), case-insensitive search, JSON save and load that survives a crash ' +
    'mid-save, and a command processor that turns any typed line — even nonsense — into a helpful message instead of a crash. ' +
    'Read README.md for the exact rules and command formats.',
  hints: [
    'Store books in a Dictionary<string, Book> keyed by ISBN (use StringComparer.OrdinalIgnoreCase) and loans in a List<Loan>. Availability is total copies minus current loans for that ISBN.',
    'Check every Borrow rule before adding the loan, so a refused borrow changes nothing — the "check first, then change" rule from the exceptions lesson.',
    'For JSON, serialise a private record such as Snapshot(List<Book> Books, List<Member> Members, List<Loan> Loans), then rebuild a Library from it by calling AddBook, AddMember and Borrow so loaded data passes the same validation.',
    'In CommandProcessor, split on |, trim the parts, and use a switch expression with when clauses on the part count — "borrow" when parts.Length == 3 — so each command has its own usage message.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Models.cs', MODELS, { editable: false }),
    pf('Result.cs', RESULT, { editable: false }),
    pf('Library.cs', LIBRARY_STARTER),
    pf('CommandProcessor.cs', COMMANDS_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Models.cs', MODELS, { editable: false }),
    pf('Result.cs', RESULT, { editable: false }),
    pf('Library.cs', LIBRARY_SOLUTION),
    pf('CommandProcessor.cs', COMMANDS_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Library System', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
