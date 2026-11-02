import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 2 · APIs & Data';

/** Month 2, weeks 5–6 tasks (lessons dn2-1 … dn2-4). */
export const CSHARP_MONTH2_A_TASKS: CodeTask[] = [
  {
    id: 'cs-2-01',
    title: 'Methods and Status Codes',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Http.IsSafe(method) (GET, HEAD, OPTIONS, TRACE) and Http.IsIdempotent(method) (the safe methods plus PUT and DELETE), ' +
      'case-insensitive. Then implement Http.StatusFor(Outcome) mapping application outcomes to status codes: Found → 200, Created → 201, ' +
      'Deleted → 204, Invalid → 400, NotAuthenticated → 401, Forbidden → 403, Missing → 404, Conflict → 409, StaleVersion → 412, ' +
      'VersionRequired → 428, RateLimited → 429, Crashed → 500.',
    starterCode: `public enum Outcome { Found, Created, Deleted, Invalid, NotAuthenticated, Forbidden, Missing, Conflict, StaleVersion, VersionRequired, RateLimited, Crashed }

public static class Http
{
    public static bool IsSafe(string method) => throw new NotImplementedException();

    public static bool IsIdempotent(string method) => throw new NotImplementedException();

    public static int StatusFor(Outcome outcome) => throw new NotImplementedException();
}
`,
    hints: [
      'method.ToUpperInvariant() is "GET" or "HEAD" or ... — a switch expression with or patterns reads well.',
      'IsIdempotent can reuse IsSafe: IsSafe(method) || upper is "PUT" or "DELETE".',
      'A switch expression over Outcome with one arm per value; the compiler warns if you miss one.',
    ],
    solution: `public enum Outcome { Found, Created, Deleted, Invalid, NotAuthenticated, Forbidden, Missing, Conflict, StaleVersion, VersionRequired, RateLimited, Crashed }

public static class Http
{
    public static bool IsSafe(string method) => method.ToUpperInvariant() is "GET" or "HEAD" or "OPTIONS" or "TRACE";

    public static bool IsIdempotent(string method) => IsSafe(method) || method.ToUpperInvariant() is "PUT" or "DELETE";

    public static int StatusFor(Outcome outcome) => outcome switch
    {
        Outcome.Found => 200,
        Outcome.Created => 201,
        Outcome.Deleted => 204,
        Outcome.Invalid => 400,
        Outcome.NotAuthenticated => 401,
        Outcome.Forbidden => 403,
        Outcome.Missing => 404,
        Outcome.Conflict => 409,
        Outcome.StaleVersion => 412,
        Outcome.VersionRequired => 428,
        Outcome.RateLimited => 429,
        Outcome.Crashed => 500,
        _ => throw new ArgumentOutOfRangeException(nameof(outcome)),
    };
}
`,
    testCode: csTests(`
Check("GET safe", () => Http.IsSafe("get"), true);
Check("POST not safe", () => Http.IsSafe("POST"), false);
Check("PUT not safe", () => Http.IsSafe("PUT"), false);
Check("PUT idempotent", () => Http.IsIdempotent("put"), true);
Check("DELETE idempotent", () => Http.IsIdempotent("DELETE"), true);
Check("POST not idempotent", () => Http.IsIdempotent("POST"), false);
Check("PATCH not idempotent", () => Http.IsIdempotent("PATCH"), false);
CheckSeq("all status codes", () => Enum.GetValues<Outcome>().Select(Http.StatusFor), [200, 201, 204, 400, 401, 403, 404, 409, 412, 428, 429, 500]);
`),
  },
  {
    id: 'cs-2-02',
    title: 'Problem Details (RFC 9457)',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Build RFC 9457 error bodies with System.Text.Json.Nodes. Problems.NotFound(instance, detail) returns a JsonObject with type ' +
      '"https://tools.ietf.org/html/rfc9110#section-15.5.5", title "Not Found", status 404, detail and instance. Problems.Validation(instance, errors) ' +
      'takes a Dictionary<string, List<string>> and returns type ".../rfc9110#section-15.5.1", title "One or more validation errors occurred.", ' +
      'status 400, instance, and an errors object mapping each field (camelCased: "DueOn" → "dueOn") to its array of messages, fields in ' +
      'alphabetical order. ContentType must be "application/problem+json".',
    starterCode: `using System.Text.Json.Nodes;

public static class Problems
{
    public const string ContentType = "";   // TODO

    public static JsonObject NotFound(string instance, string detail) => throw new NotImplementedException();

    public static JsonObject Validation(string instance, Dictionary<string, List<string>> errors) => throw new NotImplementedException();
}
`,
    hints: [
      'A JsonObject is built like a dictionary: new JsonObject { ["status"] = 404, ["title"] = "Not Found" }.',
      'For arrays: new JsonArray(messages.Select(m => (JsonNode?)JsonValue.Create(m)).ToArray()).',
      'camelCase: char.ToLowerInvariant(name[0]) + name[1..]. Sort with OrderBy(e => e.Key, StringComparer.Ordinal) after converting.',
    ],
    solution: `using System.Text.Json.Nodes;

public static class Problems
{
    public const string ContentType = "application/problem+json";

    public static JsonObject NotFound(string instance, string detail) => new()
    {
        ["type"] = "https://tools.ietf.org/html/rfc9110#section-15.5.5",
        ["title"] = "Not Found",
        ["status"] = 404,
        ["detail"] = detail,
        ["instance"] = instance,
    };

    public static JsonObject Validation(string instance, Dictionary<string, List<string>> errors)
    {
        var errorObject = new JsonObject();
        foreach (var (field, messages) in errors.Select(e => (Field: Camel(e.Key), Messages: e.Value)).OrderBy(e => e.Field, StringComparer.Ordinal))
            errorObject[field] = new JsonArray(messages.Select(m => (JsonNode?)JsonValue.Create(m)).ToArray());
        return new JsonObject
        {
            ["type"] = "https://tools.ietf.org/html/rfc9110#section-15.5.1",
            ["title"] = "One or more validation errors occurred.",
            ["status"] = 400,
            ["instance"] = instance,
            ["errors"] = errorObject,
        };
    }

    private static string Camel(string name) => name.Length == 0 ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
`,
    testCode: csTests(`
Check("content type", () => Problems.ContentType, "application/problem+json");
Check("not found json", () => Problems.NotFound("/tasks/9", "No task with id 9.").ToJsonString(),
    "{\\"type\\":\\"https://tools.ietf.org/html/rfc9110#section-15.5.5\\",\\"title\\":\\"Not Found\\",\\"status\\":404,\\"detail\\":\\"No task with id 9.\\",\\"instance\\":\\"/tasks/9\\"}");
var errors = new Dictionary<string, List<string>> { ["Title"] = ["The title is required."], ["DueOn"] = ["Too early.", "Must be a weekday."] };
Check("validation status", () => (int)Problems.Validation("/tasks", errors)["status"]!, 400);
Check("errors camelCased and sorted", () => Problems.Validation("/tasks", errors)["errors"]!.ToJsonString(),
    "{\\"dueOn\\":[\\"Too early.\\",\\"Must be a weekday.\\"],\\"title\\":[\\"The title is required.\\"]}");
Check("validation type", () => (string)Problems.Validation("/x", errors)["type"]!, "https://tools.ietf.org/html/rfc9110#section-15.5.1");
Check("no errors", () => Problems.Validation("/x", []).ToJsonString().Contains("\\"errors\\":{}"), true);
`),
  },
  {
    id: 'cs-2-03',
    title: 'Build a Middleware Pipeline',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Recreate the heart of ASP.NET Core. PipelineBuilder.Use(middleware) adds a component of type Func<RequestContext, Func<Task>, Task>: ' +
      'it receives the context and a "next" delegate, and may run code before and after calling next — or not call it at all (short-circuit). ' +
      'Build(endpoint) composes all components, in the order they were added, around the endpoint and returns a Func<RequestContext, Task>. ' +
      'Components added later run closer to the endpoint. Building with no components returns the endpoint itself.',
    starterCode: `public sealed class RequestContext(string path)
{
    public string Path { get; } = path;
    public int StatusCode { get; set; } = 200;
    public List<string> Log { get; } = [];
}

public sealed class PipelineBuilder
{
    public PipelineBuilder Use(Func<RequestContext, Func<Task>, Task> middleware) => throw new NotImplementedException();

    public Func<RequestContext, Task> Build(Func<RequestContext, Task> endpoint) => throw new NotImplementedException();
}
`,
    hints: [
      'Store the components in a List; Use adds and returns this.',
      'Build from the inside out: start with app = endpoint, then for each component from LAST to FIRST, wrap: var next = app; var m = component; app = ctx => m(ctx, () => next(ctx));',
      'Capture loop variables in locals inside the loop so each wrapper closes over its own values.',
    ],
    solution: `public sealed class RequestContext(string path)
{
    public string Path { get; } = path;
    public int StatusCode { get; set; } = 200;
    public List<string> Log { get; } = [];
}

public sealed class PipelineBuilder
{
    private readonly List<Func<RequestContext, Func<Task>, Task>> _components = [];

    public PipelineBuilder Use(Func<RequestContext, Func<Task>, Task> middleware)
    {
        _components.Add(middleware);
        return this;
    }

    public Func<RequestContext, Task> Build(Func<RequestContext, Task> endpoint)
    {
        Func<RequestContext, Task> app = endpoint;
        for (int i = _components.Count - 1; i >= 0; i--)
        {
            var component = _components[i];
            var next = app;
            app = context => component(context, () => next(context));
        }
        return app;
    }
}
`,
    testCode: csTests(`
Func<RequestContext, Task> endpoint = ctx => { ctx.Log.Add("endpoint"); return Task.CompletedTask; };
Func<RequestContext, Func<Task>, Task> Named(string name) => async (ctx, next) => { ctx.Log.Add(name + " in"); await next(); ctx.Log.Add(name + " out"); };
await CheckAsync("order in and out", async () =>
{
    var ctx = new RequestContext("/tasks");
    await new PipelineBuilder().Use(Named("A")).Use(Named("B")).Build(endpoint)(ctx);
    return string.Join(", ", ctx.Log);
}, "A in, B in, endpoint, B out, A out");
await CheckAsync("short-circuit", async () =>
{
    var ctx = new RequestContext("/admin");
    var auth = new Func<RequestContext, Func<Task>, Task>((c, next) => { if (c.Path.StartsWith("/admin")) { c.StatusCode = 403; return Task.CompletedTask; } return next(); });
    await new PipelineBuilder().Use(Named("log")).Use(auth).Build(endpoint)(ctx);
    return (ctx.StatusCode, string.Join(", ", ctx.Log));
}, (403, "log in, log out"));
await CheckAsync("no middleware", async () => { var ctx = new RequestContext("/"); await new PipelineBuilder().Build(endpoint)(ctx); return ctx.Log.Count; }, 1);
await CheckAsync("pipeline is reusable", async () =>
{
    var app = new PipelineBuilder().Use(Named("A")).Build(endpoint);
    var one = new RequestContext("/1"); var two = new RequestContext("/2");
    await app(one); await app(two);
    return one.Log.Count + two.Log.Count;
}, 6);
await CheckAsync("exception handler middleware", async () =>
{
    var ctx = new RequestContext("/boom");
    var handler = new Func<RequestContext, Func<Task>, Task>(async (c, next) => { try { await next(); } catch (InvalidOperationException) { c.StatusCode = 500; } });
    await new PipelineBuilder().Use(handler).Build(_ => throw new InvalidOperationException("bug"))(ctx);
    return ctx.StatusCode;
}, 500);
`),
  },
  {
    id: 'cs-2-04',
    title: 'Route Template Matching',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Route.Match(template, path). Templates are segments separated by "/": literal segments match case-insensitively; {name} ' +
      'captures any non-empty segment; {name:int} captures only whole numbers; {name:guid} only GUIDs. A trailing "/" on the path is ignored, ' +
      'and the query string (after "?") is not part of the path. Return a Dictionary<string, string> of captured values (case-insensitive ' +
      'keys), or null when the path does not match. Segment counts must be equal.',
    starterCode: `public static class Route
{
    public static Dictionary<string, string>? Match(string template, string path) => throw new NotImplementedException();
}
`,
    hints: [
      'Strip the query: int q = path.IndexOf(\'?\'); if (q >= 0) path = path[..q];',
      'Split both on \'/\' with StringSplitOptions.RemoveEmptyEntries — that also ignores leading and trailing slashes.',
      'For a parameter segment, take the text between { and }, split on \':\' into name and optional constraint, then test int.TryParse or Guid.TryParse.',
    ],
    solution: `public static class Route
{
    public static Dictionary<string, string>? Match(string template, string path)
    {
        int query = path.IndexOf('?');
        if (query >= 0) path = path[..query];
        string[] t = template.Split('/', StringSplitOptions.RemoveEmptyEntries);
        string[] p = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (t.Length != p.Length) return null;

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < t.Length; i++)
        {
            if (t[i].StartsWith('{') && t[i].EndsWith('}'))
            {
                string[] parts = t[i][1..^1].Split(':');
                string name = parts[0];
                string? constraint = parts.Length > 1 ? parts[1] : null;
                bool ok = constraint switch
                {
                    null => p[i].Length > 0,
                    "int" => int.TryParse(p[i], out _),
                    "guid" => Guid.TryParse(p[i], out _),
                    _ => throw new ArgumentException($"Unknown constraint '{constraint}'."),
                };
                if (!ok) return null;
                values[name] = p[i];
            }
            else if (!string.Equals(t[i], p[i], StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
        }
        return values;
    }
}
`,
    testCode: csTests(`
Check("literal", () => Route.Match("/tasks", "/tasks")?.Count, (int?)0);
Check("case-insensitive literal", () => Route.Match("/tasks", "/TASKS") is not null, true);
Check("int capture", () => Route.Match("/tasks/{id:int}", "/tasks/42")?["id"], "42");
Check("int rejects text", () => Route.Match("/tasks/{id:int}", "/tasks/abc") is null, true);
Check("trailing slash", () => Route.Match("/tasks/{id:int}", "/tasks/42/")?["ID"], "42");
Check("query ignored", () => Route.Match("/tasks/{id}", "/tasks/x1?expand=all")?["id"], "x1");
Check("two params", () => { var m = Route.Match("/users/{userId:int}/tasks/{taskId:int}", "/users/7/tasks/9"); return m is null ? "" : m["userId"] + "-" + m["taskId"]; }, "7-9");
Check("segment count", () => Route.Match("/tasks/{id}", "/tasks/1/comments") is null, true);
Check("guid ok", () => Route.Match("/files/{id:guid}", "/files/3f2504e0-4f89-11d3-9a0c-0305e82c3301") is not null, true);
Check("guid bad", () => Route.Match("/files/{id:guid}", "/files/123") is null, true);
Check("literal mismatch", () => Route.Match("/tasks/{id}", "/notes/1") is null, true);
`),
  },
  {
    id: 'cs-2-05',
    title: 'Booking Overlaps in O(log n)',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement BookingCalendar for one room. TryBook(start, end) adds a booking for the half-open range [start, end) unless it overlaps an ' +
      'existing one (ranges that only touch, such as 10:00–11:00 and 11:00–12:00, do not overlap). end must be after start, otherwise ' +
      'ArgumentException. Cancel(start) removes the booking that starts at that time. Bookings() lists them in start order. Keep the bookings ' +
      'sorted by start so that each TryBook needs only to check its neighbours — the grader counts comparisons on 20,000 bookings.',
    starterCode: `public sealed class BookingCalendar(IComparer<DateTime>? comparer = null)
{
    public bool TryBook(DateTime start, DateTime end) => throw new NotImplementedException();

    public bool Cancel(DateTime start) => throw new NotImplementedException();

    public IReadOnlyList<(DateTime Start, DateTime End)> Bookings() => throw new NotImplementedException();
}
`,
    hints: [
      'Use a SortedList<DateTime, DateTime> (start → end) created with the comparer (or Comparer<DateTime>.Default).',
      'Binary-search Keys for the first start >= the new start (a lower bound). The only bookings that can overlap are the one at that index and the one just before it.',
      'Two ranges overlap when a.Start < b.End && b.Start < a.End.',
    ],
    solution: `public sealed class BookingCalendar(IComparer<DateTime>? comparer = null)
{
    private readonly IComparer<DateTime> _comparer = comparer ?? Comparer<DateTime>.Default;
    private SortedList<DateTime, DateTime>? _bookings;
    private SortedList<DateTime, DateTime> Items => _bookings ??= new SortedList<DateTime, DateTime>(_comparer);

    public bool TryBook(DateTime start, DateTime end)
    {
        if (_comparer.Compare(end, start) <= 0) throw new ArgumentException("A booking must end after it starts.");
        var keys = Items.Keys;
        int i = LowerBound(keys, start);
        if (i < keys.Count && _comparer.Compare(keys[i], end) < 0) return false;             // next booking starts before we end
        if (i > 0 && _comparer.Compare(Items.Values[i - 1], start) > 0) return false;        // previous booking ends after we start
        Items.Add(start, end);
        return true;
    }

    public bool Cancel(DateTime start) => Items.Remove(start);

    public IReadOnlyList<(DateTime Start, DateTime End)> Bookings() => Items.Select(p => (p.Key, p.Value)).ToList();

    private int LowerBound(IList<DateTime> keys, DateTime value)
    {
        int low = 0, high = keys.Count;
        while (low < high)
        {
            int mid = low + (high - low) / 2;
            if (_comparer.Compare(keys[mid], value) < 0) low = mid + 1; else high = mid;
        }
        return low;
    }
}
`,
    testCode: `public sealed class CountingDates : IComparer<DateTime>
{
    public long Count;
    public int Compare(DateTime x, DateTime y) { Count++; return x.CompareTo(y); }
}
` + csTests(`
var day = new DateTime(2026, 3, 2);
DateTime At(int h, int m = 0) => day.AddHours(h).AddMinutes(m);
Check("first booking", () => new BookingCalendar().TryBook(At(10), At(11)), true);
Check("overlap refused", () => { var c = new BookingCalendar(); c.TryBook(At(10), At(11)); return c.TryBook(At(10, 30), At(11, 30)); }, false);
Check("inside refused", () => { var c = new BookingCalendar(); c.TryBook(At(9), At(12)); return c.TryBook(At(10), At(11)); }, false);
Check("covering refused", () => { var c = new BookingCalendar(); c.TryBook(At(10), At(11)); return c.TryBook(At(9), At(12)); }, false);
Check("touching allowed", () => { var c = new BookingCalendar(); c.TryBook(At(10), At(11)); return c.TryBook(At(11), At(12)) && c.TryBook(At(9), At(10)); }, true);
Throws<ArgumentException>("end before start", () => new BookingCalendar().TryBook(At(11), At(10)));
Check("cancel frees slot", () => { var c = new BookingCalendar(); c.TryBook(At(10), At(11)); c.Cancel(At(10)); return c.TryBook(At(10), At(11)); }, true);
CheckSeq("sorted listing", () => { var c = new BookingCalendar(); c.TryBook(At(14), At(15)); c.TryBook(At(9), At(10)); return c.Bookings().Select(b => b.Start.Hour); }, [9, 14]);
Expect("logarithmic checks", () =>
{
    var counter = new CountingDates();
    var c = new BookingCalendar(counter);
    for (int i = 0; i < 20_000; i++) c.TryBook(day.AddMinutes(i * 30), day.AddMinutes(i * 30 + 20));
    counter.Count = 0;
    bool refused = !c.TryBook(day.AddMinutes(15_000 * 30 + 5), day.AddMinutes(15_000 * 30 + 10));
    return refused && counter.Count < 200;
}, "a single TryBook compared thousands of dates — search the sorted bookings instead of scanning");
`),
  },
  {
    id: 'cs-2-06',
    title: 'A Unit of Work with Rollback',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement a tiny transactional store of customers keyed by id, with a UNIQUE constraint on email (case-insensitive). Outside a ' +
      'transaction, writes apply immediately. Begin() starts a transaction (nesting is not supported: InvalidOperationException). Inside it, ' +
      'Insert/Update/Delete are staged: Find sees the staged changes, but Committed(id) still shows the last committed value. Commit() ' +
      'applies everything atomically — if any staged change would break the unique-email constraint, nothing is applied and ' +
      'ConstraintViolationException is thrown (the transaction ends). Rollback() discards the staged changes.',
    starterCode: `public sealed record Customer(int Id, string Email, string Name);

public sealed class ConstraintViolationException(string message) : Exception(message);

public sealed class CustomerStore
{
    public void Begin() => throw new NotImplementedException();
    public void Commit() => throw new NotImplementedException();
    public void Rollback() => throw new NotImplementedException();
    public bool InTransaction => throw new NotImplementedException();

    public void Insert(Customer customer) => throw new NotImplementedException();
    public void Update(Customer customer) => throw new NotImplementedException();
    public void Delete(int id) => throw new NotImplementedException();

    /// <summary>The current view, including staged changes of an open transaction.</summary>
    public Customer? Find(int id) => throw new NotImplementedException();

    /// <summary>The last committed value only.</summary>
    public Customer? Committed(int id) => throw new NotImplementedException();
}
`,
    hints: [
      'Keep a committed Dictionary<int, Customer> and, during a transaction, a working copy that starts as a copy of it.',
      'Find reads the working copy when in a transaction, else the committed data. Mutations write to whichever is active.',
      'Commit validates the working copy first (duplicate emails with StringComparer.OrdinalIgnoreCase), then swaps it in. Insert of an existing id and Update/Delete of a missing id throw InvalidOperationException.',
      'Outside a transaction, validate the unique email immediately and throw ConstraintViolationException.',
    ],
    solution: `public sealed record Customer(int Id, string Email, string Name);

public sealed class ConstraintViolationException(string message) : Exception(message);

public sealed class CustomerStore
{
    private Dictionary<int, Customer> _committed = [];
    private Dictionary<int, Customer>? _working;

    public bool InTransaction => _working is not null;

    public void Begin()
    {
        if (InTransaction) throw new InvalidOperationException("A transaction is already open.");
        _working = new Dictionary<int, Customer>(_committed);
    }

    public void Commit()
    {
        var working = _working ?? throw new InvalidOperationException("No transaction is open.");
        _working = null;
        EnsureUniqueEmails(working);
        _committed = working;
    }

    public void Rollback()
    {
        if (!InTransaction) throw new InvalidOperationException("No transaction is open.");
        _working = null;
    }

    public void Insert(Customer customer)
    {
        if (!Active.TryAdd(customer.Id, customer)) throw new InvalidOperationException($"Customer {customer.Id} already exists.");
        AfterImmediateWrite(() => Active.Remove(customer.Id));
    }

    public void Update(Customer customer)
    {
        if (!Active.TryGetValue(customer.Id, out var previous)) throw new InvalidOperationException($"No customer {customer.Id}.");
        Active[customer.Id] = customer;
        AfterImmediateWrite(() => Active[customer.Id] = previous);
    }

    public void Delete(int id)
    {
        if (!Active.Remove(id)) throw new InvalidOperationException($"No customer {id}.");
    }

    public Customer? Find(int id) => Active.GetValueOrDefault(id);

    public Customer? Committed(int id) => _committed.GetValueOrDefault(id);

    private Dictionary<int, Customer> Active => _working ?? _committed;

    private void AfterImmediateWrite(Action undo)
    {
        if (InTransaction) return;
        try { EnsureUniqueEmails(_committed); }
        catch { undo(); throw; }
    }

    private static void EnsureUniqueEmails(Dictionary<int, Customer> rows)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in rows.Values)
            if (!seen.Add(c.Email)) throw new ConstraintViolationException($"Email {c.Email} is already used.");
    }
}
`,
    testCode: csTests(`
CustomerStore Seeded() { var s = new CustomerStore(); s.Insert(new(1, "ama@x.com", "Ama")); s.Insert(new(2, "kofi@x.com", "Kofi")); return s; }
Check("immediate insert", () => Seeded().Committed(2)?.Name, "Kofi");
Throws<ConstraintViolationException>("unique email outside transaction", () => Seeded().Insert(new(3, "AMA@x.com", "Other")));
Check("failed immediate insert leaves no row", () => { var s = Seeded(); try { s.Insert(new(3, "ama@x.com", "X")); } catch (ConstraintViolationException) { } return s.Find(3) is null; }, true);
Check("staged change visible to Find", () => { var s = Seeded(); s.Begin(); s.Update(new(1, "ama@x.com", "Ama Owusu")); return (s.Find(1)?.Name, s.Committed(1)?.Name); }, ("Ama Owusu", "Ama"));
Check("commit applies", () => { var s = Seeded(); s.Begin(); s.Insert(new(3, "esi@x.com", "Esi")); s.Delete(2); s.Commit(); return (s.Committed(3)?.Name, s.Committed(2) is null); }, ("Esi", true));
Check("rollback discards", () => { var s = Seeded(); s.Begin(); s.Delete(1); s.Rollback(); return s.Find(1)?.Name; }, "Ama");
Check("violation at commit applies nothing", () =>
{
    var s = Seeded();
    s.Begin(); s.Insert(new(3, "esi@x.com", "Esi")); s.Update(new(2, "AMA@X.COM", "Kofi"));
    try { s.Commit(); } catch (ConstraintViolationException) { }
    return (s.Committed(3) is null, s.Committed(2)?.Email, s.InTransaction);
}, (true, "kofi@x.com", false));
Check("swap emails within a transaction is fine", () =>
{
    var s = Seeded();
    s.Begin(); s.Update(new(1, "tmp@x.com", "Ama")); s.Update(new(2, "ama@x.com", "Kofi")); s.Update(new(1, "kofi@x.com", "Ama")); s.Commit();
    return s.Committed(1)?.Email;
}, "kofi@x.com");
Throws<InvalidOperationException>("no nesting", () => { var s = Seeded(); s.Begin(); s.Begin(); });
Throws<InvalidOperationException>("update missing", () => Seeded().Update(new(9, "a@b.c", "X")));
`),
  },
  {
    id: 'cs-2-07',
    title: 'Kill the N+1',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'A room report loads all rooms and then queries each room\'s bookings one by one: one query plus one per room. Implement ' +
      'RoomReport.Build(db, from, to) returning (RoomName, ConfirmedBookings) for every room — rooms with no bookings included with 0 — ' +
      'ordered by count descending then name, using at most two queries against IReportDb, whatever the number of rooms. IReportDb counts ' +
      'every call.',
    starterCode: `public sealed record Room(int Id, string Name);
public sealed record Booking(int Id, int RoomId, DateTime Start, bool Confirmed);

public interface IReportDb
{
    IReadOnlyList<Room> AllRooms();
    IReadOnlyList<Booking> BookingsForRoom(int roomId);
    IReadOnlyList<Booking> BookingsBetween(DateTime from, DateTime to);
}

public static class RoomReport
{
    public static List<(string Room, int Confirmed)> Build(IReportDb db, DateTime from, DateTime to)
    {
        // N+1: one query for rooms, then one per room. Fix this.
        var result = new List<(string Room, int Confirmed)>();
        foreach (var room in db.AllRooms())
        {
            int count = db.BookingsForRoom(room.Id).Count(b => b.Confirmed && b.Start >= from && b.Start < to);
            result.Add((room.Name, count));
        }
        throw new NotImplementedException("Then order the result and remove the N+1.");
    }
}
`,
    hints: [
      'Query 1: AllRooms(). Query 2: BookingsBetween(from, to) — one call for every room.',
      'Group the bookings in memory: bookings.Where(b => b.Confirmed).GroupBy(b => b.RoomId).ToDictionary(g => g.Key, g => g.Count()).',
      'For each room, counts.GetValueOrDefault(room.Id) gives 0 for rooms without bookings. Then OrderByDescending(count).ThenBy(name).',
    ],
    solution: `public sealed record Room(int Id, string Name);
public sealed record Booking(int Id, int RoomId, DateTime Start, bool Confirmed);

public interface IReportDb
{
    IReadOnlyList<Room> AllRooms();
    IReadOnlyList<Booking> BookingsForRoom(int roomId);
    IReadOnlyList<Booking> BookingsBetween(DateTime from, DateTime to);
}

public static class RoomReport
{
    public static List<(string Room, int Confirmed)> Build(IReportDb db, DateTime from, DateTime to)
    {
        var rooms = db.AllRooms();
        var counts = db.BookingsBetween(from, to)
            .Where(b => b.Confirmed)
            .GroupBy(b => b.RoomId)
            .ToDictionary(g => g.Key, g => g.Count());
        return rooms
            .Select(r => (Room: r.Name, Confirmed: counts.GetValueOrDefault(r.Id)))
            .OrderByDescending(x => x.Confirmed)
            .ThenBy(x => x.Room, StringComparer.Ordinal)
            .ToList();
    }
}
`,
    testCode: `public sealed class CountingDb(List<Room> rooms, List<Booking> bookings) : IReportDb
{
    public int Queries;
    public IReadOnlyList<Room> AllRooms() { Queries++; return rooms; }
    public IReadOnlyList<Booking> BookingsForRoom(int roomId) { Queries++; return bookings.Where(b => b.RoomId == roomId).ToList(); }
    public IReadOnlyList<Booking> BookingsBetween(DateTime from, DateTime to) { Queries++; return bookings.Where(b => b.Start >= from && b.Start < to).ToList(); }
}
` + csTests(`
var from = new DateTime(2026, 3, 1); var to = new DateTime(2026, 4, 1);
List<Room> rooms = [new(1, "Accra"), new(2, "Kumasi"), new(3, "Tamale"), new(4, "Ho")];
List<Booking> bookings =
[
    new(1, 1, from.AddDays(1), true), new(2, 1, from.AddDays(2), true), new(3, 2, from.AddDays(3), true),
    new(4, 2, from.AddDays(4), false), new(5, 3, from.AddDays(-1), true), new(6, 4, from.AddDays(9), true), new(7, 2, from.AddDays(40), true),
];
CheckSeq("report", () => RoomReport.Build(new CountingDb(rooms, bookings), from, to), [("Accra", 2), ("Ho", 1), ("Kumasi", 1), ("Tamale", 0)]);
Check("two queries", () => { var db = new CountingDb(rooms, bookings); RoomReport.Build(db, from, to); return db.Queries; }, 2);
Check("still two with 500 rooms", () =>
{
    var many = Enumerable.Range(1, 500).Select(i => new Room(i, "R" + i)).ToList();
    var db = new CountingDb(many, bookings);
    RoomReport.Build(db, from, to);
    return db.Queries;
}, 2);
`),
  },
  {
    id: 'cs-2-08',
    title: 'Optimistic Concurrency and ETags',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement VersionedStore<T>: every stored value has a version starting at 1. Get(id) returns (Value, Version) or null. Add(id, value) ' +
      'stores version 1 (InvalidOperationException if the id exists). Update(id, expectedVersion, newValue) returns UpdateResult.Updated(newVersion) ' +
      'only if the stored version equals expectedVersion; UpdateResult.Stale(currentVersion) if it differs; UpdateResult.NotFound if missing. ' +
      'Then implement ETags.Format(version) → "\\"7\\"" (quoted) and ETags.TryParse(header, out version), accepting a quoted number and rejecting ' +
      'anything else, including weak ETags (W/"7"), which must not be used for concurrency control.',
    starterCode: `public abstract record UpdateResult
{
    public sealed record Updated(long NewVersion) : UpdateResult;
    public sealed record Stale(long CurrentVersion) : UpdateResult;
    public sealed record NotFound : UpdateResult;
}

public sealed class VersionedStore<T>
{
    public (T Value, long Version)? Get(string id) => throw new NotImplementedException();

    public void Add(string id, T value) => throw new NotImplementedException();

    public UpdateResult Update(string id, long expectedVersion, T newValue) => throw new NotImplementedException();
}

public static class ETags
{
    public static string Format(long version) => throw new NotImplementedException();

    public static bool TryParse(string? header, out long version) => throw new NotImplementedException();
}
`,
    hints: [
      'Store (T Value, long Version) tuples in a Dictionary<string, (T, long)>.',
      'Update: compare versions first; only then replace and increment.',
      'TryParse: the header must start and end with \'"\' and have at least one character inside; then long.TryParse the inside. W/ prefixes fail the first check.',
    ],
    solution: `public abstract record UpdateResult
{
    public sealed record Updated(long NewVersion) : UpdateResult;
    public sealed record Stale(long CurrentVersion) : UpdateResult;
    public sealed record NotFound : UpdateResult;
}

public sealed class VersionedStore<T>
{
    private readonly Dictionary<string, (T Value, long Version)> _items = [];

    public (T Value, long Version)? Get(string id) => _items.TryGetValue(id, out var item) ? item : null;

    public void Add(string id, T value)
    {
        if (!_items.TryAdd(id, (value, 1))) throw new InvalidOperationException($"{id} already exists.");
    }

    public UpdateResult Update(string id, long expectedVersion, T newValue)
    {
        if (!_items.TryGetValue(id, out var current)) return new UpdateResult.NotFound();
        if (current.Version != expectedVersion) return new UpdateResult.Stale(current.Version);
        long next = current.Version + 1;
        _items[id] = (newValue, next);
        return new UpdateResult.Updated(next);
    }
}

public static class ETags
{
    public static string Format(long version) => $"\\"{version}\\"";

    public static bool TryParse(string? header, out long version)
    {
        version = 0;
        if (header is null || header.Length < 3 || header[0] != '"' || header[^1] != '"') return false;
        return long.TryParse(header[1..^1], out version);
    }
}
`,
    testCode: csTests(`
VersionedStore<string> Seeded() { var s = new VersionedStore<string>(); s.Add("t1", "draft"); return s; }
Check("starts at 1", () => Seeded().Get("t1")?.Version, (long?)1);
Check("update with right version", () => Seeded().Update("t1", 1, "final"), (UpdateResult)new UpdateResult.Updated(2));
Check("stale update refused", () => { var s = Seeded(); s.Update("t1", 1, "a"); return s.Update("t1", 1, "b"); }, (UpdateResult)new UpdateResult.Stale(2));
Check("stale leaves value", () => { var s = Seeded(); s.Update("t1", 1, "a"); s.Update("t1", 1, "b"); return s.Get("t1")?.Value; }, "a");
Check("missing", () => Seeded().Update("nope", 1, "x") is UpdateResult.NotFound, true);
Throws<InvalidOperationException>("duplicate add", () => Seeded().Add("t1", "again"));
Check("format", () => ETags.Format(7), "\\"7\\"");
Check("parse", () => ETags.TryParse("\\"42\\"", out long v) ? v : -1, 42L);
Check("weak rejected", () => ETags.TryParse("W/\\"42\\"", out _), false);
Check("unquoted rejected", () => ETags.TryParse("42", out _), false);
Check("garbage rejected", () => ETags.TryParse("\\"abc\\"", out _), false);
Check("null rejected", () => ETags.TryParse(null, out _), false);
`),
  },
];
