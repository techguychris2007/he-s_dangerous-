import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 8 Assignment: Production Readiness

\`OrdersEndpoints\` works on a developer's laptop. Make the service ready to run where nobody can attach a
debugger. Everything you add goes in \`ProductionApp.cs\`, which wraps the endpoints.

## Requirements

1. **Correlation id** — use the request's \`X-Correlation-ID\` if it is 1–64 characters of letters, digits and
   \`-\`; otherwise generate one (\`Guid.NewGuid().ToString("N")\`). Return it in the response's \`X-Correlation-ID\`
   header and attach it to every log entry for the request.
2. **Exception handling** — an unhandled exception becomes **500** \`application/problem+json\` with
   \`title: "An unexpected error occurred."\` and \`traceId\` = the correlation id. **Never** include the exception
   message (it may contain secrets). Log one \`Error\` entry whose properties include \`ExceptionType\`.
3. **Request log** — one \`Information\` entry per request with template
   \`"HTTP {Method} {Path} responded {Status} in {ElapsedMs} ms"\` and those properties plus \`CorrelationId\`.
   Never log the \`Authorization\` header or any request body.
4. **Health** — \`GET /health/live\` → 200 without touching dependencies. \`GET /health/ready\` → 200 if
   \`inventory.PingAsync\` succeeds within 200 ms, else **503**.
5. **Idempotency** — \`POST /orders\` with an \`Idempotency-Key\` header: a repeat with the same key and body returns
   the stored response without creating another order; the same key with a different body → 422.
6. **Resilience for the inventory call** — the endpoints call \`ReserveAsync\` through \`ProductionApp.Inventory\`
   (an \`IInventoryClient\` you implement as a decorator around the real client):
   - each attempt gets a **300 ms** timeout; up to **3 attempts** in total for timeouts and \`IOException\`s;
   - after **3 consecutive failed calls** (each after its retries), open a **circuit breaker for 30 s**: calls fail
     immediately with \`BrokenCircuitException\`; the next call after 30 s is a trial;
   - the endpoint (given) turns \`BrokenCircuitException\` into **503** with \`Retry-After: 30\`.

Time for the breaker comes from the injected \`TimeProvider\`.
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

    public static ApiResponse Json(int status, string body) =>
        new(status, new(StringComparer.OrdinalIgnoreCase) { ["Content-Type"] = "application/json" }, body);

    public static ApiResponse Problem(int status, string title, string? extraJson = null) =>
        new(status, new(StringComparer.OrdinalIgnoreCase) { ["Content-Type"] = "application/problem+json" },
            "{\\"title\\":\\"" + title + "\\",\\"status\\":" + status + (extraJson is null ? "" : "," + extraJson) + "}");
}
`;

const INFRA = `public enum LogLevel { Information, Warning, Error }

public sealed record LogEntry(LogLevel Level, string Template, IReadOnlyDictionary<string, object?> Properties);

public interface ILogSink { void Write(LogEntry entry); }

public sealed class MemoryLog : ILogSink
{
    public List<LogEntry> Entries { get; } = [];
    public void Write(LogEntry entry) => Entries.Add(entry);
}

public interface IInventoryClient
{
    Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct);
    Task PingAsync(CancellationToken ct);
}

public sealed class BrokenCircuitException() : Exception("The inventory circuit is open.");
`;

const ENDPOINTS = `using System.Text.Json.Nodes;

/// <summary>The business endpoints (given). They know nothing about logging, correlation or resilience.</summary>
public sealed class OrdersEndpoints(IInventoryClient inventory)
{
    private readonly Dictionary<int, string> _orders = [];
    private int _nextId = 1;

    public async Task<ApiResponse> HandleAsync(ApiRequest request, CancellationToken ct)
    {
        string path = request.Path.Split('?')[0].TrimEnd('/');
        switch (request.Method.ToUpperInvariant(), path)
        {
            case ("POST", "/orders"):
                var body = JsonNode.Parse(request.Body ?? "{}") as JsonObject;
                string sku = (string?)body?["sku"] ?? "";
                int qty = (int?)body?["quantity"] ?? 0;
                if (sku.Length == 0 || qty < 1) return ApiResponse.Problem(400, "sku and a positive quantity are required.");
                try
                {
                    if (!await inventory.ReserveAsync(sku, qty, ct)) return ApiResponse.Problem(409, "Out of stock.");
                }
                catch (BrokenCircuitException)
                {
                    var unavailable = ApiResponse.Problem(503, "Inventory is temporarily unavailable.");
                    unavailable.Headers["Retry-After"] = "30";
                    return unavailable;
                }
                int id = _nextId++;
                _orders[id] = sku;
                var created = ApiResponse.Json(201, "{\\"id\\":" + id + ",\\"sku\\":\\"" + sku + "\\",\\"quantity\\":" + qty + "}");
                created.Headers["Location"] = "/orders/" + id;
                return created;
            case ("GET", var p) when p.StartsWith("/orders/") && int.TryParse(p["/orders/".Length..], out int orderId):
                return _orders.TryGetValue(orderId, out var s) ? ApiResponse.Json(200, "{\\"id\\":" + orderId + ",\\"sku\\":\\"" + s + "\\"}") : ApiResponse.Problem(404, "Not Found");
            case ("GET", "/debug/crash"):
                throw new InvalidOperationException("Database password=Sup3rS3cret! rejected");
            default:
                return ApiResponse.Problem(404, "Not Found");
        }
    }
}
`;

const APP_STARTER = `public sealed class ProductionApp
{
    public ProductionApp(IInventoryClient realInventory, ILogSink log, TimeProvider time)
    {
        throw new NotImplementedException();
    }

    /// <summary>The resilient inventory decorator the endpoints use.</summary>
    public IInventoryClient Inventory => throw new NotImplementedException();

    public Task<ApiResponse> HandleAsync(ApiRequest request, CancellationToken ct = default) => throw new NotImplementedException();
}
`;

const APP_SOLUTION = `using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

public sealed class ProductionApp
{
    private readonly IInventoryClient _real;
    private readonly ILogSink _log;
    private readonly OrdersEndpoints _endpoints;
    private readonly Dictionary<string, (string Fingerprint, ApiResponse Response)> _idempotency = new(StringComparer.Ordinal);

    public ProductionApp(IInventoryClient realInventory, ILogSink log, TimeProvider time)
    {
        _real = realInventory;
        _log = log;
        Inventory = new ResilientInventory(realInventory, time);
        _endpoints = new OrdersEndpoints(Inventory);
    }

    public IInventoryClient Inventory { get; }

    public async Task<ApiResponse> HandleAsync(ApiRequest request, CancellationToken ct = default)
    {
        string correlationId = request.Header("X-Correlation-ID") is { } incoming && Regex.IsMatch(incoming, "^[A-Za-z0-9-]{1,64}$")
            ? incoming : Guid.NewGuid().ToString("N");
        var watch = Stopwatch.StartNew();
        ApiResponse response;
        try
        {
            response = await RouteAsync(request, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _log.Write(new LogEntry(LogLevel.Error, "Unhandled exception for {Method} {Path}", new Dictionary<string, object?>
            {
                ["Method"] = request.Method, ["Path"] = request.Path, ["ExceptionType"] = ex.GetType().FullName, ["CorrelationId"] = correlationId,
            }));
            response = ApiResponse.Problem(500, "An unexpected error occurred.", "\\"traceId\\":\\"" + correlationId + "\\"");
        }
        response.Headers["X-Correlation-ID"] = correlationId;
        _log.Write(new LogEntry(LogLevel.Information, "HTTP {Method} {Path} responded {Status} in {ElapsedMs} ms", new Dictionary<string, object?>
        {
            ["Method"] = request.Method, ["Path"] = request.Path.Split('?')[0], ["Status"] = response.Status,
            ["ElapsedMs"] = watch.Elapsed.TotalMilliseconds, ["CorrelationId"] = correlationId,
        }));
        return response;
    }

    private async Task<ApiResponse> RouteAsync(ApiRequest request, CancellationToken ct)
    {
        string path = request.Path.Split('?')[0].TrimEnd('/');
        if (request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase) && path == "/health/live") return ApiResponse.Json(200, "{\\"status\\":\\"live\\"}");
        if (request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase) && path == "/health/ready")
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(TimeSpan.FromMilliseconds(200));
                await _real.PingAsync(cts.Token);
                return ApiResponse.Json(200, "{\\"status\\":\\"ready\\"}");
            }
            catch (Exception) when (!ct.IsCancellationRequested)
            {
                return ApiResponse.Problem(503, "Not ready.");
            }
        }

        string? key = request.Header("Idempotency-Key");
        bool idempotent = request.Method.Equals("POST", StringComparison.OrdinalIgnoreCase) && path == "/orders" && !string.IsNullOrWhiteSpace(key);
        if (!idempotent) return await _endpoints.HandleAsync(request, ct);

        string fingerprint = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Body ?? "")));
        if (_idempotency.TryGetValue(key!, out var stored))
            return stored.Fingerprint == fingerprint ? Copy(stored.Response) : ApiResponse.Problem(422, "Idempotency key reused with a different request.");
        var response = await _endpoints.HandleAsync(request, ct);
        if (response.Status < 500) _idempotency[key!] = (fingerprint, Copy(response));
        return response;
    }

    private static ApiResponse Copy(ApiResponse r) => r with { Headers = new Dictionary<string, string>(r.Headers, StringComparer.OrdinalIgnoreCase) };

    private sealed class ResilientInventory(IInventoryClient inner, TimeProvider time) : IInventoryClient
    {
        private const int Attempts = 3, FailuresToOpen = 3;
        private static readonly TimeSpan AttemptTimeout = TimeSpan.FromMilliseconds(300), BreakFor = TimeSpan.FromSeconds(30);
        private int _consecutiveFailures;
        private DateTimeOffset? _openedAt;

        public async Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct)
        {
            if (_openedAt is { } opened && time.GetUtcNow() - opened < BreakFor) throw new BrokenCircuitException();
            bool trial = _openedAt is not null;
            Exception? last = null;
            for (int attempt = 1; attempt <= Attempts; attempt++)
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(AttemptTimeout);
                try
                {
                    bool result = await inner.ReserveAsync(sku, quantity, cts.Token);
                    _consecutiveFailures = 0;
                    _openedAt = null;
                    return result;
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch (Exception e) when (e is IOException or OperationCanceledException)
                {
                    last = e is OperationCanceledException ? new TimeoutException("The inventory service timed out.") : e;
                    if (trial) break;
                }
            }
            _consecutiveFailures++;
            if (trial || _consecutiveFailures >= FailuresToOpen) _openedAt = time.GetUtcNow();
            throw last!;
        }

        public Task PingAsync(CancellationToken ct) => inner.PingAsync(ct);
    }
}
`;

const PROGRAM = `var app = new ProductionApp(new DemoInventory(), new ConsoleLog(), TimeProvider.System);
var r = await app.HandleAsync(new ApiRequest("POST", "/orders", new() { ["Idempotency-Key"] = "demo-1" }, """{ "sku": "PEN", "quantity": 2 }"""));
Console.WriteLine($"{r.Status} {r.Header("X-Correlation-ID")} {r.Body}");
Console.WriteLine((await app.HandleAsync(new ApiRequest("GET", "/debug/crash"))).Body);

sealed class DemoInventory : IInventoryClient
{
    public Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct) => Task.FromResult(true);
    public Task PingAsync(CancellationToken ct) => Task.CompletedTask;
}

sealed class ConsoleLog : ILogSink
{
    public void Write(LogEntry e) => Console.WriteLine($"[{e.Level}] {e.Template} {string.Join(", ", e.Properties.Select(p => p.Key + "=" + p.Value))}");
}
`;

const TESTS = `public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}

public sealed class FakeInventory : IInventoryClient
{
    public int Reserves, Pings;
    public int FailNext;
    public bool SlowForever, Down;
    public async Task<bool> ReserveAsync(string sku, int quantity, CancellationToken ct)
    {
        Reserves++;
        if (SlowForever) await Task.Delay(10_000, ct);
        if (Down) throw new IOException("inventory unreachable");
        if (FailNext > 0) { FailNext--; throw new IOException("blip"); }
        return sku != "SOLD-OUT";
    }
    public async Task PingAsync(CancellationToken ct) { Pings++; if (SlowForever) await Task.Delay(10_000, ct); if (Down) throw new IOException("down"); }
}
` + csTests(`
var start = new DateTimeOffset(2026, 8, 1, 12, 0, 0, TimeSpan.Zero);
(ProductionApp App, FakeInventory Inv, MemoryLog Log, TestTime Time) Setup()
{
    var inv = new FakeInventory(); var log = new MemoryLog(); var t = new TestTime(start);
    return (new ProductionApp(inv, log, t), inv, log, t);
}
ApiRequest Order(string? key = null, string body = "{\\"sku\\":\\"PEN\\",\\"quantity\\":2}") =>
    new("POST", "/orders", key is null ? new() { ["Authorization"] = "Bearer secret-token" } : new() { ["Idempotency-Key"] = key, ["Authorization"] = "Bearer secret-token" }, body);

await CheckAsync("order created", async () => (await Setup().App.HandleAsync(Order())).Status, 201);
await CheckAsync("correlation id echoed", async () => (await Setup().App.HandleAsync(new ApiRequest("GET", "/orders/9", new() { ["X-Correlation-ID"] = "req-123" }))).Header("X-Correlation-ID"), "req-123");
await ExpectAsync("invalid correlation id replaced", async () => { var id = (await Setup().App.HandleAsync(new ApiRequest("GET", "/orders/9", new() { ["X-Correlation-ID"] = "<script>alert(1)</script>" }))).Header("X-Correlation-ID"); return id is { Length: 32 } && id.All(char.IsLetterOrDigit); }, "an unsafe incoming id must be replaced with a generated one");
await ExpectAsync("generated when missing", async () => (await Setup().App.HandleAsync(new ApiRequest("GET", "/health/live"))).Header("X-Correlation-ID") is { Length: > 0 }, "every response needs a correlation id");
await CheckAsync("crash becomes 500 problem", async () => { var r = await Setup().App.HandleAsync(new ApiRequest("GET", "/debug/crash")); return (r.Status, r.Header("Content-Type")); }, (500, "application/problem+json"));
await ExpectAsync("no secret leaked", async () => { var r = await Setup().App.HandleAsync(new ApiRequest("GET", "/debug/crash")); return !(r.Body ?? "").Contains("Sup3rS3cret") && (r.Body ?? "").Contains("An unexpected error occurred."); }, "the exception message must not reach the client");
await ExpectAsync("traceId matches correlation id", async () => { var r = await Setup().App.HandleAsync(new ApiRequest("GET", "/debug/crash", new() { ["X-Correlation-ID"] = "trace-77" })); return (r.Body ?? "").Contains("\\"traceId\\":\\"trace-77\\""); }, "the problem body needs traceId = correlation id");
await ExpectAsync("error logged with type", async () => { var s = Setup(); await s.App.HandleAsync(new ApiRequest("GET", "/debug/crash")); return s.Log.Entries.Any(e => e.Level == LogLevel.Error && (e.Properties.GetValueOrDefault("ExceptionType") as string ?? "").Contains("InvalidOperationException")); }, "log one Error entry with ExceptionType");
await ExpectAsync("request log entry", async () =>
{
    var s = Setup();
    await s.App.HandleAsync(new ApiRequest("GET", "/orders/5?x=1", new() { ["X-Correlation-ID"] = "c-1" }));
    var e = s.Log.Entries.LastOrDefault(e => e.Level == LogLevel.Information);
    return e is not null && e.Template == "HTTP {Method} {Path} responded {Status} in {ElapsedMs} ms"
        && Equals(e.Properties["Status"], 404) && (string?)e.Properties["Path"] == "/orders/5" && (string?)e.Properties["CorrelationId"] == "c-1" && e.Properties.ContainsKey("ElapsedMs");
}, "one Information entry per request with Method, Path (no query), Status, ElapsedMs and CorrelationId");
await ExpectAsync("no secrets in logs", async () =>
{
    var s = Setup();
    await s.App.HandleAsync(Order());
    await s.App.HandleAsync(new ApiRequest("POST", "/orders", new(), "{\\"sku\\":\\"PEN\\",\\"quantity\\":1,\\"password\\":\\"hunter2\\"}"));
    string all = string.Join(" ", s.Log.Entries.SelectMany(e => e.Properties.Values.Select(v => v?.ToString())));
    return !all.Contains("secret-token") && !all.Contains("hunter2");
}, "never log Authorization headers or request bodies");
await CheckAsync("liveness never touches inventory", async () => { var s = Setup(); s.Inv.Down = true; var r = await s.App.HandleAsync(new ApiRequest("GET", "/health/live")); return (r.Status, s.Inv.Pings); }, (200, 0));
await CheckAsync("ready when dependency healthy", async () => (await Setup().App.HandleAsync(new ApiRequest("GET", "/health/ready"))).Status, 200);
await CheckAsync("not ready when dependency down", async () => { var s = Setup(); s.Inv.Down = true; return (await s.App.HandleAsync(new ApiRequest("GET", "/health/ready"))).Status; }, 503);
await CheckAsync("not ready when dependency hangs", async () => { var s = Setup(); s.Inv.SlowForever = true; return (await s.App.HandleAsync(new ApiRequest("GET", "/health/ready"))).Status; }, 503);
await CheckAsync("idempotent replay", async () => { var s = Setup(); var a = await s.App.HandleAsync(Order("k1")); var b = await s.App.HandleAsync(Order("k1")); return (a.Status, b.Status, a.Body == b.Body, s.Inv.Reserves); }, (201, 201, true, 1));
await CheckAsync("key reused with other body", async () => { var s = Setup(); await s.App.HandleAsync(Order("k1")); return (await s.App.HandleAsync(Order("k1", "{\\"sku\\":\\"INK\\",\\"quantity\\":1}"))).Status; }, 422);
await CheckAsync("retries transient failures", async () => { var s = Setup(); s.Inv.FailNext = 2; var r = await s.App.HandleAsync(Order()); return (r.Status, s.Inv.Reserves); }, (201, 3));
await CheckAsync("times out slow attempts", async () => { var s = Setup(); s.Inv.SlowForever = true; var r = await s.App.HandleAsync(Order()); return (r.Status, s.Inv.Reserves); }, (500, 3));
await CheckAsync("breaker opens after 3 failed calls", async () =>
{
    var s = Setup(); s.Inv.Down = true;
    for (int i = 0; i < 3; i++) await s.App.HandleAsync(Order());
    int before = s.Inv.Reserves;
    var r = await s.App.HandleAsync(Order());
    return (r.Status, r.Header("Retry-After"), s.Inv.Reserves - before);
}, (503, "30", 0));
await CheckAsync("breaker lets a trial through after 30s", async () =>
{
    var s = Setup(); s.Inv.Down = true;
    for (int i = 0; i < 3; i++) await s.App.HandleAsync(Order());
    s.Inv.Down = false; s.Time.Now = start.AddSeconds(30);
    return (await s.App.HandleAsync(Order())).Status;
}, 201);
`);

const task: ProjectTask = {
  id: 'se-cs-m2-004',
  title: 'Week 8: Production Readiness',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 2 · ASP.NET Core & API Engineering',
  tags: ['observability', 'health checks', 'idempotency', 'resilience', 'circuit breaker'],
  prompt:
    'Make a naive orders service production-ready without touching its business endpoints: correlation ids on every request and log line, ' +
    'a central exception handler that returns a safe 500 problem with a traceId and never leaks secrets, structured request logs without ' +
    'credentials, liveness and readiness probes that behave correctly when a dependency is down or hanging, idempotent POSTs, and a resilient ' +
    'inventory decorator with per-attempt timeouts, retries and a circuit breaker that turns into a fast 503 with Retry-After.',
  hints: [
    'Structure HandleAsync like middleware: pick the correlation id, start a Stopwatch, try { route } catch { log Error; safe 500 }, then add the header and write the Information log.',
    'Validate an incoming correlation id with Regex.IsMatch(value, "^[A-Za-z0-9-]{1,64}$") — anything else (including injected HTML) is replaced.',
    'Readiness calls the REAL client\'s PingAsync with a 200 ms CancellationTokenSource; liveness returns 200 without calling anything.',
    'Write the resilient client as a private class implementing IInventoryClient: a loop of up to 3 attempts with a linked token and CancelAfter(300 ms), then a consecutive-failure counter and an openedAt time from the TimeProvider for the breaker.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Http.cs', HTTP, { editable: false }),
    pf('Infrastructure.cs', INFRA, { editable: false }),
    pf('OrdersEndpoints.cs', ENDPOINTS, { editable: false }),
    pf('ProductionApp.cs', APP_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Http.cs', HTTP, { editable: false }),
    pf('Infrastructure.cs', INFRA, { editable: false }),
    pf('OrdersEndpoints.cs', ENDPOINTS, { editable: false }),
    pf('ProductionApp.cs', APP_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Production app', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
