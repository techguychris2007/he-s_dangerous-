import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 5 Assignment: Task Management API

Build a complete, correct REST API for tasks. In this workspace the API is exercised through a small
request/response model (\`Http.cs\`) so every behaviour can be graded in the browser; the README's last
section shows how the same code runs as a real ASP.NET Core Minimal API on your machine.

## Endpoints

| Method + path | Success | Failures |
| --- | --- | --- |
| \`GET /tasks?status=open\\|done&limit=N\` | 200 \`{ "items": [...], "total": n }\`, ordered by id | 400 invalid status or limit |
| \`GET /tasks/{id}\` | 200 + \`ETag\` | 404 |
| \`POST /tasks\` | 201 + \`Location: /tasks/{id}\` + \`ETag: "1"\` | 400 malformed JSON or validation |
| \`PUT /tasks/{id}\` | 200 + new \`ETag\` | 404 · 428 no \`If-Match\` · 412 stale \`If-Match\` · 400 |
| \`DELETE /tasks/{id}\` | 204 | 404 |
| \`POST /tasks/{id}/complete\` | 200 (status becomes \`done\`) | 404 · 409 already done |

Anything else: **404**, except a known path with the wrong method, which is **405** with an \`Allow\`
header listing the permitted methods (e.g. \`GET, PUT, DELETE\`). A non-numeric id is a 404.

## Representations

Tasks are JSON with camelCase names: \`id\`, \`title\`, \`dueOn\` (\`"2026-05-01"\` or \`null\`), \`status\`
(\`open\`/\`done\`), \`createdAt\`, and \`version\`. Request bodies for POST and PUT are \`{ "title", "dueOn" }\`.

**Validation** (all problems reported at once): \`title\` required and at most 120 characters; \`dueOn\`, if
present, not before today (UTC, from the injected clock). \`limit\` defaults to 20 and must be 1–100.

**Errors** are RFC 9457 problem details with \`Content-Type: application/problem+json\`: \`type\`, \`title\`,
\`status\` and, for validation, \`errors\` mapping camelCase field names to message arrays. Success bodies
use \`application/json\`.

**Versions:** every task starts at version 1; each successful PUT or complete adds 1. The \`ETag\`
header is the version in quotes: \`"3"\`.

## Running it in ASP.NET Core

\`\`\`csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<TaskApi>();
var app = builder.Build();

// Forward every /tasks request to the same handler you built here.
app.Map("/tasks/{**rest}", async (HttpContext http, TaskApi api) =>
{
    using var reader = new StreamReader(http.Request.Body);
    var request = new ApiRequest(http.Request.Method, http.Request.Path + http.Request.QueryString,
        http.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString(), StringComparer.OrdinalIgnoreCase),
        await reader.ReadToEndAsync());
    var response = api.Handle(request);
    http.Response.StatusCode = response.Status;
    foreach (var (name, value) in response.Headers) http.Response.Headers[name] = value;
    if (response.Body is not null) await http.Response.WriteAsync(response.Body);
});
app.Run();
\`\`\`

A next step is to replace the single handler with \`MapGroup("/tasks")\` and one \`MapGet\`/\`MapPost\` per
endpoint returning \`TypedResults\` — the behaviour you built here is exactly what those endpoints must do.
`;

const HTTP = `public sealed record ApiRequest(string Method, string Path, Dictionary<string, string>? Headers = null, string? Body = null)
{
    public string? Header(string name) =>
        Headers is null ? null : Headers.FirstOrDefault(h => string.Equals(h.Key, name, StringComparison.OrdinalIgnoreCase)).Value;
}

public sealed record ApiResponse(int Status, Dictionary<string, string> Headers, string? Body)
{
    public string? Header(string name) =>
        Headers.FirstOrDefault(h => string.Equals(h.Key, name, StringComparison.OrdinalIgnoreCase)).Value;
}
`;

const API_STARTER = `using System.Text.Json;
using System.Text.Json.Nodes;

public sealed class TaskApi(TimeProvider time)
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>Routes and handles one request. Never throws for bad input.</summary>
    public ApiResponse Handle(ApiRequest request) => throw new NotImplementedException();
}
`;

const API_SOLUTION = `using System.Text.Json;
using System.Text.Json.Nodes;

public sealed class TaskApi(TimeProvider time)
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private sealed class TaskItem
    {
        public int Id { get; init; }
        public string Title { get; set; } = "";
        public DateOnly? DueOn { get; set; }
        public string Status { get; set; } = "open";
        public DateTimeOffset CreatedAt { get; init; }
        public long Version { get; set; } = 1;
    }

    private sealed record TaskBody(string? Title, DateOnly? DueOn);

    private readonly SortedDictionary<int, TaskItem> _tasks = [];
    private int _nextId = 1;

    public ApiResponse Handle(ApiRequest request)
    {
        string path = request.Path, query = "";
        int q = path.IndexOf('?');
        if (q >= 0) { query = path[(q + 1)..]; path = path[..q]; }
        string[] segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        string method = request.Method.ToUpperInvariant();

        if (segments is not ["tasks", ..]) return Problem(404, "Not Found");
        if (segments.Length == 1)
            return method switch { "GET" => List(query), "POST" => Create(request), _ => MethodNotAllowed("GET, POST") };
        if (!int.TryParse(segments[1], out int id)) return Problem(404, "Not Found");
        if (segments.Length == 2)
            return method switch { "GET" => Get(id), "PUT" => Replace(id, request), "DELETE" => Delete(id), _ => MethodNotAllowed("GET, PUT, DELETE") };
        if (segments.Length == 3 && segments[2] == "complete")
            return method == "POST" ? Complete(id) : MethodNotAllowed("POST");
        return Problem(404, "Not Found");
    }

    private ApiResponse List(string query)
    {
        var args = System.Web.HttpUtility.ParseQueryString(query);
        var errors = new Dictionary<string, string[]>();
        string? status = args["status"];
        if (status is not null && status is not ("open" or "done")) errors["status"] = ["Status must be open or done."];
        int limit = 20;
        if (args["limit"] is { } raw && (!int.TryParse(raw, out limit) || limit is < 1 or > 100)) errors["limit"] = ["Limit must be between 1 and 100."];
        if (errors.Count > 0) return ValidationProblem(errors);

        var matching = _tasks.Values.Where(t => status is null || t.Status == status).ToList();
        var body = new { items = matching.Take(limit).Select(Dto), total = matching.Count };
        return Ok(200, JsonSerializer.Serialize(body, Json));
    }

    private ApiResponse Get(int id) =>
        _tasks.TryGetValue(id, out var task) ? Ok(200, Serialize(task), ETag(task)) : Problem(404, "Not Found");

    private ApiResponse Create(ApiRequest request)
    {
        if (!TryRead(request, out var body, out var malformed)) return malformed!;
        var errors = Validate(body!);
        if (errors.Count > 0) return ValidationProblem(errors);
        var task = new TaskItem { Id = _nextId++, Title = body!.Title!.Trim(), DueOn = body.DueOn, CreatedAt = time.GetUtcNow() };
        _tasks[task.Id] = task;
        var response = Ok(201, Serialize(task), ETag(task));
        response.Headers["Location"] = $"/tasks/{task.Id}";
        return response;
    }

    private ApiResponse Replace(int id, ApiRequest request)
    {
        if (!_tasks.TryGetValue(id, out var task)) return Problem(404, "Not Found");
        string? ifMatch = request.Header("If-Match");
        if (ifMatch is null) return Problem(428, "Precondition Required");
        if (ifMatch != Quote(task.Version)) return Problem(412, "Precondition Failed");
        if (!TryRead(request, out var body, out var malformed)) return malformed!;
        var errors = Validate(body!);
        if (errors.Count > 0) return ValidationProblem(errors);
        task.Title = body!.Title!.Trim();
        task.DueOn = body.DueOn;
        task.Version++;
        return Ok(200, Serialize(task), ETag(task));
    }

    private ApiResponse Delete(int id) =>
        _tasks.Remove(id) ? new ApiResponse(204, new(StringComparer.OrdinalIgnoreCase), null) : Problem(404, "Not Found");

    private ApiResponse Complete(int id)
    {
        if (!_tasks.TryGetValue(id, out var task)) return Problem(404, "Not Found");
        if (task.Status == "done") return Problem(409, "Conflict", "The task is already done.");
        task.Status = "done";
        task.Version++;
        return Ok(200, Serialize(task), ETag(task));
    }

    private bool TryRead(ApiRequest request, out TaskBody? body, out ApiResponse? malformed)
    {
        malformed = null;
        try
        {
            body = JsonSerializer.Deserialize<TaskBody>(request.Body ?? "", Json);
            if (body is null) throw new JsonException();
            return true;
        }
        catch (JsonException)
        {
            body = null;
            malformed = Problem(400, "Malformed JSON body.");
            return false;
        }
    }

    private Dictionary<string, string[]> Validate(TaskBody body)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(body.Title)) errors["title"] = ["The title is required."];
        else if (body.Title.Trim().Length > 120) errors["title"] = ["The title must be at most 120 characters."];
        var today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);
        if (body.DueOn is { } due && due < today) errors["dueOn"] = ["The due date cannot be in the past."];
        return errors;
    }

    private static object Dto(TaskItem t) => new { id = t.Id, title = t.Title, dueOn = t.DueOn, status = t.Status, createdAt = t.CreatedAt, version = t.Version };
    private static string Serialize(TaskItem t) => JsonSerializer.Serialize(Dto(t), Json);
    private static string Quote(long version) => $"\\"{version}\\"";
    private static (string, string) ETag(TaskItem t) => ("ETag", Quote(t.Version));

    private static ApiResponse Ok(int status, string body, params (string Name, string Value)[] headers)
    {
        var h = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["Content-Type"] = "application/json" };
        foreach (var (name, value) in headers) h[name] = value;
        return new ApiResponse(status, h, body);
    }

    private static ApiResponse Problem(int status, string title, string? detail = null, Dictionary<string, string[]>? errors = null)
    {
        var problem = new JsonObject { ["type"] = $"https://httpstatuses.io/{status}", ["title"] = title, ["status"] = status };
        if (detail is not null) problem["detail"] = detail;
        if (errors is not null) problem["errors"] = JsonSerializer.SerializeToNode(errors);
        return new ApiResponse(status, new(StringComparer.OrdinalIgnoreCase) { ["Content-Type"] = "application/problem+json" }, problem.ToJsonString());
    }

    private static ApiResponse ValidationProblem(Dictionary<string, string[]> errors) =>
        Problem(400, "One or more validation errors occurred.", errors: errors);

    private static ApiResponse MethodNotAllowed(string allow)
    {
        var response = Problem(405, "Method Not Allowed");
        response.Headers["Allow"] = allow;
        return response;
    }
}
`;

const PROGRAM = `var api = new TaskApi(TimeProvider.System);
var created = api.Handle(new ApiRequest("POST", "/tasks", Body: """{ "title": "Write the release notes", "dueOn": null }"""));
Console.WriteLine($"{created.Status} {created.Header("Location")} {created.Body}");
var listed = api.Handle(new ApiRequest("GET", "/tasks?status=open"));
Console.WriteLine($"{listed.Status} {listed.Body}");
`;

const TESTS = `public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}
` + csTests(`
var now = new DateTimeOffset(2026, 5, 10, 8, 0, 0, TimeSpan.Zero);
TaskApi New() => new(new TestTime(now));
ApiResponse Send(TaskApi api, string method, string path, string? body = null, string? ifMatch = null) =>
    api.Handle(new ApiRequest(method, path, ifMatch is null ? null : new Dictionary<string, string> { ["If-Match"] = ifMatch }, body));
System.Text.Json.Nodes.JsonNode? J(ApiResponse r) => r.Body is null ? null : System.Text.Json.Nodes.JsonNode.Parse(r.Body);
TaskApi WithTwo() { var a = New(); Send(a, "POST", "/tasks", "{\\"title\\":\\"One\\"}"); Send(a, "POST", "/tasks", "{\\"title\\":\\"Two\\",\\"dueOn\\":\\"2026-06-01\\"}"); return a; }

Check("create 201", () => Send(New(), "POST", "/tasks", "{\\"title\\":\\"Ship it\\"}").Status, 201);
Check("location header", () => Send(New(), "POST", "/tasks", "{\\"title\\":\\"Ship it\\"}").Header("Location"), "/tasks/1");
Check("etag on create", () => Send(New(), "POST", "/tasks", "{\\"title\\":\\"Ship it\\"}").Header("ETag"), "\\"1\\"");
Check("camelCase body", () => (string?)J(Send(New(), "POST", "/tasks", "{\\"title\\":\\"  Ship it  \\"}"))!["title"], "Ship it");
Check("status open", () => (string?)J(Send(New(), "POST", "/tasks", "{\\"title\\":\\"x\\"}"))!["status"], "open");
Check("malformed json 400", () => Send(New(), "POST", "/tasks", "{title:").Status, 400);
Check("problem content type", () => Send(New(), "POST", "/tasks", "{title:").Header("Content-Type"), "application/problem+json");
Check("validation lists every field", () => { var e = J(Send(New(), "POST", "/tasks", "{\\"title\\":\\"\\",\\"dueOn\\":\\"2026-05-09\\"}"))!["errors"]!.AsObject(); return string.Join(",", e.Select(p => p.Key).OrderBy(k => k)); }, "dueOn,title");
Check("due today is fine", () => Send(New(), "POST", "/tasks", "{\\"title\\":\\"t\\",\\"dueOn\\":\\"2026-05-10\\"}").Status, 201);
Check("title too long", () => Send(New(), "POST", "/tasks", "{\\"title\\":\\"" + new string('x', 121) + "\\"}").Status, 400);
Check("get one with etag", () => { var r = Send(WithTwo(), "GET", "/tasks/2"); return (r.Status, r.Header("ETag"), (string?)J(r)!["dueOn"]); }, (200, "\\"1\\"", "2026-06-01"));
Check("missing 404 problem", () => { var r = Send(New(), "GET", "/tasks/9"); return (r.Status, r.Header("Content-Type")); }, (404, "application/problem+json"));
Check("non-numeric id 404", () => Send(New(), "GET", "/tasks/abc").Status, 404);
Check("unknown route 404", () => Send(New(), "GET", "/projects").Status, 404);
Check("405 with Allow", () => { var r = Send(WithTwo(), "PATCH", "/tasks/1"); return (r.Status, r.Header("Allow")); }, (405, "GET, PUT, DELETE"));
Check("list with total", () => { var j = J(Send(WithTwo(), "GET", "/tasks"))!; return ((int)j["total"]!, j["items"]!.AsArray().Count); }, (2, 2));
Check("filter by status", () => { var a = WithTwo(); Send(a, "POST", "/tasks/1/complete"); return (int)J(Send(a, "GET", "/tasks?status=open"))!["total"]!; }, 1);
Check("bad status filter 400", () => Send(New(), "GET", "/tasks?status=maybe").Status, 400);
Check("limit applied", () => J(Send(WithTwo(), "GET", "/tasks?limit=1"))!["items"]!.AsArray().Count, 1);
Check("limit over max 400", () => Send(New(), "GET", "/tasks?limit=500").Status, 400);
Check("put needs If-Match", () => Send(WithTwo(), "PUT", "/tasks/1", "{\\"title\\":\\"New\\"}").Status, 428);
Check("put with stale etag", () => Send(WithTwo(), "PUT", "/tasks/1", "{\\"title\\":\\"New\\"}", "\\"7\\"").Status, 412);
Check("put ok bumps etag", () => { var r = Send(WithTwo(), "PUT", "/tasks/1", "{\\"title\\":\\"New\\"}", "\\"1\\""); return (r.Status, r.Header("ETag"), (string?)J(r)!["title"]); }, (200, "\\"2\\"", "New"));
Check("second put with old etag fails", () => { var a = WithTwo(); Send(a, "PUT", "/tasks/1", "{\\"title\\":\\"A\\"}", "\\"1\\""); return Send(a, "PUT", "/tasks/1", "{\\"title\\":\\"B\\"}", "\\"1\\"").Status; }, 412);
Check("delete 204 then 404", () => { var a = WithTwo(); return (Send(a, "DELETE", "/tasks/1").Status, Send(a, "GET", "/tasks/1").Status); }, (204, 404));
Check("complete then conflict", () => { var a = WithTwo(); return (Send(a, "POST", "/tasks/2/complete").Status, Send(a, "POST", "/tasks/2/complete").Status); }, (200, 409));
Check("complete bumps version", () => { var a = WithTwo(); Send(a, "POST", "/tasks/2/complete"); return Send(a, "GET", "/tasks/2").Header("ETag"); }, "\\"2\\"");
`);

const task: ProjectTask = {
  id: 'se-cs-m2-001',
  title: 'Week 5: Task Management API',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 2 · ASP.NET Core & API Engineering',
  tags: ['REST', 'routing', 'validation', 'problem details', 'ETags'],
  prompt:
    'Build a complete REST API for tasks: routing with 404 and 405 + Allow, JSON binding with malformed-body handling, validation that ' +
    'reports every error as RFC 9457 problem details, 201 + Location on create, filtering with a capped limit, optimistic concurrency with ' +
    'ETag and If-Match (428 and 412), and 409 for an invalid state change. README.md specifies every endpoint and shows how to host the ' +
    'same code in ASP.NET Core.',
  hints: [
    'Split the path from the query first, then route on the segments with a pattern: segments is ["tasks"], ["tasks", id], ["tasks", id, "complete"].',
    'System.Web.HttpUtility.ParseQueryString(query) reads status and limit; Deserialize the body with JsonSerializerDefaults.Web (camelCase) inside try/catch for JsonException.',
    'Build two response helpers — Ok(status, body, headers) and Problem(status, title, detail, errors) — and use them everywhere so content types never drift.',
    'For PUT, check in this order: task exists (404), If-Match present (428), If-Match equals the current quoted version (412), body valid (400) — then update and bump the version.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Http.cs', HTTP, { editable: false }),
    pf('TaskApi.cs', API_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Http.cs', HTTP, { editable: false }),
    pf('TaskApi.cs', API_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Task API', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
