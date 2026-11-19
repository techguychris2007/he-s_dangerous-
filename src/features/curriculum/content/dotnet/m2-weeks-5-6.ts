import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  mdnHttp: { title: 'MDN — An overview of HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview' },
  mdnStatus: { title: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status' },
  rfc9110: { title: 'RFC 9110 — HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
  rfc9457: { title: 'RFC 9457 — Problem Details for HTTP APIs', url: 'https://www.rfc-editor.org/rfc/rfc9457' },
  msApiGuidelines: { title: 'Microsoft REST API Guidelines', url: 'https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md' },
  aspnetDocs: { title: 'Microsoft Learn — ASP.NET Core documentation', url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
  minimalApis: { title: 'Microsoft Learn — Minimal APIs overview', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview' },
  middleware: { title: 'Microsoft Learn — ASP.NET Core middleware', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/' },
  configuration: { title: 'Microsoft Learn — Configuration in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/' },
  options: { title: 'Microsoft Learn — Options pattern in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options' },
  postgresTutorial: { title: 'PostgreSQL documentation — Tutorial (SQL language)', url: 'https://www.postgresql.org/docs/current/tutorial-sql.html' },
  postgresIndexes: { title: 'PostgreSQL documentation — Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
  postgresMvcc: { title: 'PostgreSQL documentation — Transaction isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
  useTheIndex: { title: 'Markus Winand — Use The Index, Luke (SQL indexing)', url: 'https://use-the-index-luke.com/' },
  efCore: { title: 'Microsoft Learn — Entity Framework Core', url: 'https://learn.microsoft.com/en-us/ef/core/' },
  efPerformance: { title: 'Microsoft Learn — EF Core efficient querying', url: 'https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying' },
  efConcurrency: { title: 'Microsoft Learn — Handling concurrency conflicts in EF Core', url: 'https://learn.microsoft.com/en-us/ef/core/saving/concurrency' },
  efMigrations: { title: 'Microsoft Learn — EF Core migrations overview', url: 'https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/' },
  dapper: { title: 'Dapper — GitHub repository and documentation', url: 'https://github.com/DapperLib/Dapper' },
} as const;

/** Month 2, weeks 5–6: HTTP and ASP.NET Core APIs (assignment: Task Management API), then relational
 *  database engineering with SQL, EF Core and Dapper (assignment: Booking Data Platform). */
export const DN_MONTH2_A: CurriculumLesson[] = [
  {
    id: 'dn2-1',
    slug: 'http-and-rest-for-api-engineers',
    title: 'HTTP and REST for API Engineers',
    summary: 'Design resource-oriented APIs with correct methods, status codes, headers and error bodies; understand safety and idempotency; and return RFC 9457 problem details.',
    minutes: 50,
    prerequisite: 'Month 1.',
    outcomes: [
      'Explain the request/response model, methods, headers and the role of status-code classes.',
      'Choose the right method and status code for create, read, update, delete and failure cases.',
      'Distinguish safe and idempotent methods and design retries accordingly.',
      'Return consistent, machine-readable errors using Problem Details (RFC 9457).',
    ],
    introduction:
      'This month you stop writing programs that run on one machine and start writing services other programs call over a network. The contract between them is HTTP, and the quality of an API is mostly the quality of that contract: whether clients can predict what happens, retry safely, and understand failures without reading your source code. Before touching ASP.NET Core, this lesson makes sure you can design that contract properly — the part of API engineering that outlives any framework.',
    keyTerms: [
      { term: 'Resource', meaning: 'A thing the API exposes, identified by a URL such as /tasks/42.' },
      { term: 'Method', meaning: 'The action requested on a resource: GET, POST, PUT, PATCH, DELETE.' },
      { term: 'Status code', meaning: 'A three-digit result: 2xx success, 3xx redirection, 4xx client error, 5xx server error.' },
      { term: 'Safe method', meaning: 'A method that should not change server state, such as GET.' },
      { term: 'Idempotent method', meaning: 'A method whose effect is the same whether it is sent once or many times, such as PUT and DELETE.' },
      { term: 'Problem Details', meaning: 'The RFC 9457 JSON format for API errors: type, title, status, detail, instance.' },
    ],
    sections: [
      {
        title: 'Requests, responses and resources',
        paragraphs: [
          'An HTTP request has a method, a target URL, headers and an optional body; a response has a status code, headers and an optional body. In a REST-style API, URLs name resources — nouns — and methods say what to do with them. /tasks is the collection; /tasks/42 is one task; /tasks/42/comments is a sub-collection. Verbs in URLs (/getTask, /createTask) are a sign the design has drifted into remote procedure calls.',
          'Headers carry metadata: Content-Type says what the body is (application/json), Accept says what the client wants back, Location points at a newly created resource, and ETag identifies a version of a resource — which you will use for optimistic concurrency in Week 8.',
        ],
        code: `POST /tasks HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "title": "Write release notes", "dueOn": "2026-04-10" }

HTTP/1.1 201 Created
Location: /tasks/42
Content-Type: application/json
ETag: "1"

{ "id": 42, "title": "Write release notes", "dueOn": "2026-04-10", "status": "Open" }`,
        label: 'Creating a resource',
      },
      {
        title: 'Choosing methods and status codes',
        paragraphs: [
          'GET reads. POST creates a new resource in a collection (or performs a non-idempotent action) and returns 201 Created with a Location header. PUT replaces a resource entirely; PATCH changes part of it; DELETE removes it and usually returns 204 No Content. 200 OK returns a body; 204 says "done, nothing to return".',
          'Client errors are 4xx and must tell the client what to fix: 400 Bad Request for malformed or invalid input, 401 Unauthorized when the caller is not authenticated, 403 Forbidden when they are authenticated but not allowed, 404 Not Found, 409 Conflict when the request clashes with current state (a duplicate, an invalid state transition), 412 Precondition Failed when an If-Match ETag no longer matches, 422 Unprocessable Content for semantically invalid input if you distinguish it from 400, and 429 Too Many Requests with a Retry-After header. 5xx means the server failed; never return 500 for a client\'s mistake.',
        ],
      },
      {
        title: 'Safety, idempotency and retries',
        paragraphs: [
          'Networks fail mid-request. If a client sends DELETE /tasks/42 and the connection drops before the response arrives, it does not know whether the delete happened — but because DELETE is idempotent, retrying is harmless. POST is not idempotent: retrying a "create payment" may charge twice. That is why payment APIs accept an Idempotency-Key header: the server remembers the result for that key and returns it again instead of repeating the work. You implemented exactly this rule in the Week 2 Order Engine.',
          'Design rule: make every operation either naturally idempotent or idempotent by key, and document which.',
        ],
      },
      {
        title: 'Errors as Problem Details',
        paragraphs: [
          'Clients need errors they can handle programmatically. RFC 9457 standardises a JSON shape with the media type application/problem+json: type (a URI identifying the kind of problem), title (a short human summary), status, detail (this occurrence), instance (which request), plus any extension members — for validation errors, typically an errors dictionary of field names to messages. ASP.NET Core produces this format natively, so learning it now means your APIs will match what .NET clients expect.',
        ],
        code: `HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "instance": "/tasks",
  "errors": {
    "title": ["The title is required."],
    "dueOn": ["The due date cannot be in the past."]
  }
}`,
        label: 'A validation problem response',
      },
      {
        title: 'Collections, filtering and pagination',
        paragraphs: [
          'A collection endpoint that returns every row works in development and fails in production. Paginate from day one. Offset pagination (?page=3&pageSize=50) is simple but slow on deep pages and unstable when rows are inserted. Cursor pagination returns a nextCursor token that encodes where the last page ended (for example the last id), giving stable, fast pages. Always cap pageSize on the server.',
          'Filtering and sorting use query parameters (?status=Open&sort=-dueOn). Validate them like any other input: an unknown sort field is a 400, not a 500 from the database.',
        ],
      },
      {
        title: 'Versioning and evolution',
        paragraphs: [
          'Published APIs have clients you do not control. Adding a new optional field or endpoint is safe; renaming or removing a field, changing a type or tightening validation breaks clients. When a breaking change is unavoidable, version it (/v2/tasks or an api-version query parameter) and run both versions until clients move. Hyrum\'s Law applies with full force here: every observable behaviour will be depended on by somebody.',
        ],
      },
    ],
    table: {
      headers: ['Operation', 'Method + path', 'Success / common failures'],
      rows: [
        ['List tasks', 'GET /tasks?status=Open', '200 · 400 bad filter'],
        ['Read one task', 'GET /tasks/42', '200 · 404'],
        ['Create', 'POST /tasks', '201 + Location · 400 validation · 409 duplicate'],
        ['Replace / change', 'PUT or PATCH /tasks/42', '200 or 204 · 400 · 404 · 412 stale ETag'],
        ['Delete', 'DELETE /tasks/42', '204 · 404'],
        ['Invalid state change', 'POST /tasks/42/complete', '409 Conflict'],
      ],
    },
    exercise: {
      scenario: 'An API returns 200 OK with { "success": false, "error": "Task not found" } for missing tasks, 500 for invalid JSON, and creates a new task every time a client retries a timed-out POST.',
      task: 'Redesign the three behaviours.',
      answer: 'Missing tasks return 404 with an application/problem+json body, so clients and proxies can react without parsing a custom envelope. Invalid JSON is the client\'s fault: 400 with a problem body naming the error, never 500. For safe retries of creation, accept an Idempotency-Key header (or let the client choose the id and use PUT); store the key with the created resource and return the original 201 response for repeats.',
      evidence: 'Correct status codes, RFC 9457 errors, and an idempotency mechanism for POST.',
    },
    misconceptions: [
      '200 with an error flag is fine. Status codes are what clients, proxies and monitoring understand.',
      '401 and 403 mean the same. 401: not authenticated; 403: authenticated but not allowed.',
      'POST is safe to retry. It is not idempotent unless you make it so with a key.',
      'Returning every row is simpler. Unbounded collections become outages; paginate and cap page size.',
    ],
    sources: [R.mdnHttp, R.mdnStatus, R.rfc9110, R.rfc9457, R.msApiGuidelines],
    labs: [],
    questions: [
      { prompt: 'Which status code means a resource was created?', answer: '201', accept: ['201 created'] },
      { prompt: 'Which RFC number standardises Problem Details for HTTP APIs?', answer: '9457', accept: ['rfc 9457', 'rfc9457'] },
    ],
    quiz: [
      { question: 'A logged-in user tries to delete someone else\'s task. Status?', options: ['401', '403', '404', '500'], answer: 1, explanation: 'Authenticated but not permitted is 403 (some APIs return 404 to avoid revealing existence).' },
      { question: 'Which method is idempotent?', options: ['POST', 'PUT', 'Both', 'Neither'], answer: 1, explanation: 'Repeating a PUT has the same effect as sending it once.' },
      { question: 'Completing an already-completed task should return…', options: ['200', '404', '409 Conflict', '500'], answer: 2, explanation: 'The request conflicts with current state.' },
      { question: 'Why prefer cursor pagination for large collections?', options: ['It is shorter', 'Stable and fast pages even as data changes', 'It needs no index', 'Clients prefer numbers'], answer: 1, explanation: 'Cursors avoid deep offsets and shifting pages.' },
    ],
  },
  {
    id: 'dn2-2',
    slug: 'aspnet-core-essentials',
    title: 'ASP.NET Core Essentials: Minimal APIs, Middleware, DI and Configuration',
    summary: 'Build an API with Minimal APIs, understand the middleware pipeline, bind and validate requests, wire services with DI, and configure the app per environment with the options pattern.',
    minutes: 55,
    prerequisite: 'Lesson: HTTP and REST for API Engineers.',
    outcomes: [
      'Create and run an ASP.NET Core Web API and map endpoints with route parameters and typed results.',
      'Explain the middleware pipeline and the order in which components run.',
      'Bind route, query, header and body values, and return correct results with TypedResults.',
      'Use configuration sources and the options pattern, and separate settings per environment.',
    ],
    introduction:
      'ASP.NET Core is Microsoft\'s cross-platform framework for web applications and APIs, and one of the fastest mainstream web frameworks available. Everything you learned in Month 1 shows up in it directly: dependency injection wires every service, middleware is the decorator pattern applied to requests, and async/await is how it serves thousands of concurrent requests on a handful of threads. This lesson covers the core you need for the Task Management API. In the browser you will implement the API\'s logic and handlers; on your own machine you host the same handlers in a real ASP.NET Core app.',
    keyTerms: [
      { term: 'Minimal API', meaning: 'Endpoints declared directly with app.MapGet/MapPost and lambdas, without controller classes.' },
      { term: 'Middleware', meaning: 'A component in the request pipeline that can handle a request or pass it to the next component.' },
      { term: 'Model binding', meaning: 'Turning parts of an HTTP request (route, query, headers, body) into method parameters.' },
      { term: 'TypedResults', meaning: 'Factory methods such as TypedResults.Ok(x) and TypedResults.NotFound() that produce strongly typed HTTP results.' },
      { term: 'Options pattern', meaning: 'Binding a configuration section to a class and injecting it as IOptions<T>.' },
      { term: 'Environment', meaning: 'Development, Staging or Production, selecting environment-specific configuration and behaviour.' },
    ],
    sections: [
      {
        title: 'A first API',
        paragraphs: [
          'dotnet new webapi creates a project; Program.cs builds a WebApplication, registers services, configures the pipeline and maps endpoints. Each MapX call ties a method and route template to a handler. Handlers can take dependencies as parameters — ASP.NET Core resolves them from DI — and return results.',
          'Return TypedResults rather than raw objects: Results<Ok<TaskDto>, NotFound> makes every possible response part of the method signature, which documents the endpoint and lets OpenAPI describe it accurately.',
        ],
        code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ITaskStore, InMemoryTaskStore>();
builder.Services.AddProblemDetails();            // RFC 9457 errors

var app = builder.Build();
app.UseExceptionHandler();                       // unhandled exceptions -> 500 problem details

var tasks = app.MapGroup("/tasks");
tasks.MapGet("/{id:int}", Results<Ok<TaskDto>, NotFound> (int id, ITaskStore store) =>
    store.Find(id) is { } task ? TypedResults.Ok(task) : TypedResults.NotFound());

tasks.MapPost("/", Results<Created<TaskDto>, ValidationProblem> (CreateTaskRequest request, ITaskStore store) =>
{
    var errors = request.Validate();
    if (errors.Count > 0) return TypedResults.ValidationProblem(errors);
    var created = store.Add(request);
    return TypedResults.Created($"/tasks/{created.Id}", created);
});

app.Run();`,
        label: 'Program.cs for a small API',
      },
      {
        title: 'The middleware pipeline',
        paragraphs: [
          'Every request flows through middleware in the order you add it, and the response flows back in reverse. Each component receives the HttpContext and a next delegate; it can do work before calling next, after it returns, or short-circuit by writing a response itself. This is exactly the decorator idea from Week 3, applied to a request handler.',
          'Order matters: exception handling first so it can catch everything; HTTPS redirection and static files early; authentication before authorization; then endpoints. Getting authorization before authentication is a classic, silent security bug.',
        ],
        code: `app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseAuthentication();     // who are you?
app.UseAuthorization();      // are you allowed?
app.MapControllers();

// A custom middleware: time every request
app.Use(async (context, next) =>
{
    var started = TimeProvider.System.GetTimestamp();
    await next(context);                                     // the rest of the pipeline
    var elapsed = TimeProvider.System.GetElapsedTime(started);
    context.RequestServices.GetRequiredService<ILogger<Program>>()
        .LogInformation("{Method} {Path} -> {Status} in {Ms} ms",
            context.Request.Method, context.Request.Path, context.Response.StatusCode, elapsed.TotalMilliseconds);
});`,
        label: 'Order is part of correctness',
      },
      {
        title: 'Binding and validating requests',
        paragraphs: [
          'Parameters bind from the route ({id}), the query string (?status=Open), headers ([FromHeader] or a header-named parameter) and the JSON body for complex types. Binding only converts types; it does not decide whether values make sense. Validate explicitly — with DataAnnotations attributes, a validation library, or your own Validate method — and return 400 with a problem body describing every invalid field at once, not just the first.',
          'Never bind request bodies directly onto your entities. Accept request DTOs that contain only the fields a client may set; otherwise a client can set fields such as Id, OwnerId or IsAdmin — the "mass assignment" vulnerability from the OWASP API Top 10.',
        ],
      },
      {
        title: 'Configuration and the options pattern',
        paragraphs: [
          'Configuration comes from layered sources, later ones overriding earlier: appsettings.json, appsettings.{Environment}.json, user secrets in development, environment variables and command-line arguments. Secrets never go in appsettings.json in source control; in Month 5 they will come from Azure Key Vault.',
          'Bind a section to a class with the options pattern and inject IOptions<T>. Add ValidateDataAnnotations and ValidateOnStart so a misconfigured deployment fails at startup, loudly, instead of on the first request at 3 a.m.',
        ],
        code: `// appsettings.json
// { "Tasks": { "MaxPageSize": 100, "DefaultPageSize": 20 } }

public sealed class TaskApiOptions
{
    [Range(1, 1000)] public int MaxPageSize { get; init; } = 100;
    [Range(1, 1000)] public int DefaultPageSize { get; init; } = 20;
}

builder.Services.AddOptions<TaskApiOptions>()
    .Bind(builder.Configuration.GetSection("Tasks"))
    .ValidateDataAnnotations()
    .ValidateOnStart();

tasks.MapGet("/", (IOptions<TaskApiOptions> options, int? pageSize) =>
    Math.Min(pageSize ?? options.Value.DefaultPageSize, options.Value.MaxPageSize));`,
        label: 'Typed, validated settings',
      },
      {
        title: 'Testing handlers without a server',
        paragraphs: [
          'Because handlers are ordinary methods taking parameters and returning results, the business behaviour behind them can be tested without HTTP at all — which is how this course grades your API logic in the browser. In Week 8 you will add integration tests that start the whole application in memory with WebApplicationFactory and send real HTTP requests to it.',
          'A useful architecture for the assignment: endpoint handlers stay thin — parse and validate input, call an application service, map the outcome to a status code. The service holds the rules and knows nothing about HTTP.',
        ],
      },
    ],
    table: {
      headers: ['Concern', 'ASP.NET Core feature', 'Remember'],
      rows: [
        ['Endpoints', 'MapGet / MapPost / MapGroup', 'Return TypedResults with explicit result types'],
        ['Cross-cutting behaviour', 'Middleware (app.Use...)', 'Order: exceptions → auth → authorization → endpoints'],
        ['Inputs', 'Model binding + explicit validation', 'Bind to DTOs, never to entities'],
        ['Errors', 'AddProblemDetails, UseExceptionHandler', 'RFC 9457 bodies everywhere'],
        ['Settings', 'IOptions<T> + ValidateOnStart', 'Secrets outside source control'],
      ],
    },
    exercise: {
      scenario: 'An API binds POST bodies directly to the Task entity, puts the database password in appsettings.json, calls app.UseAuthorization() before app.UseAuthentication(), and returns the first validation error only.',
      task: 'List the four problems and their fixes.',
      answer: 'Binding to the entity enables mass assignment — accept a CreateTaskRequest DTO with only client-settable fields and map it. The password in appsettings.json leaks through source control — use user secrets locally and a secret store (Key Vault) in production, read through configuration. Authorization before authentication runs without a user identity, so policies evaluate an anonymous user — call UseAuthentication first. Returning only the first error forces clients to fix one field at a time — collect all errors into a validation problem (400) with an errors dictionary.',
      evidence: 'Names mass assignment, secret management, middleware order and complete validation responses.',
    },
    misconceptions: [
      'Middleware order does not matter. It defines what runs before what, including security.',
      'Model binding validates input. It converts types; validation is a separate step.',
      'appsettings.json is a fine place for secrets. Source control is forever; use secret stores.',
      'Minimal APIs are only for demos. They are fully supported for production services.',
    ],
    sources: [R.aspnetDocs, R.minimalApis, R.middleware, R.configuration, R.options],
    labs: [],
    questions: [
      { prompt: 'Which middleware must run before UseAuthorization?', answer: 'UseAuthentication', accept: ['authentication'] },
      { prompt: 'Which interface do you inject to read options bound with the options pattern? Give its name without <T>.', answer: 'IOptions', accept: ['ioptions<t>'] },
    ],
    quiz: [
      { question: 'What does ValidateOnStart do?', options: ['Validates each request', 'Validates options when the app starts', 'Starts the database', 'Nothing in production'], answer: 1, explanation: 'Misconfiguration fails fast at startup.' },
      { question: 'Why accept a request DTO instead of the entity?', options: ['Performance', 'To prevent mass assignment of fields clients must not set', 'JSON cannot bind entities', 'Style only'], answer: 1, explanation: 'Only client-settable fields should bind.' },
      { question: 'A middleware writes a response without calling next. This is called…', options: ['Short-circuiting', 'Routing', 'Binding', 'Scoping'], answer: 0, explanation: 'Later middleware and the endpoint never run.' },
      { question: 'Which configuration source usually overrides appsettings.json in production?', options: ['None', 'Environment variables', 'Comments', 'The .csproj'], answer: 1, explanation: 'Later sources such as environment variables override earlier ones.' },
    ],
  },
  {
    id: 'dn2-3',
    slug: 'relational-database-engineering',
    title: 'Relational Database Engineering: Schemas, SQL, Indexes and Transactions',
    summary: 'Design normalised schemas with keys and constraints, write joins and aggregates, index for real queries, and use transactions and isolation levels to keep data correct under concurrency.',
    minutes: 60,
    prerequisite: 'Lesson: ASP.NET Core Essentials.',
    outcomes: [
      'Design tables with primary keys, foreign keys, unique and check constraints, and justify normalisation decisions.',
      'Write SELECT queries with joins, grouping, filtering and ordering, and read their results.',
      'Choose indexes from the queries an application actually runs, and explain their write cost.',
      'Use transactions and isolation levels to prevent lost updates and double bookings.',
    ],
    introduction:
      'Your course notes put it plainly: do not use an ORM as a substitute for learning relational databases. EF Core writes SQL for you, but it cannot choose your keys, your constraints or your indexes, and it cannot make two simultaneous bookings for the last seat safe unless you understand what the database guarantees. This lesson teaches the relational model as an engineer needs it: the schema as the last line of defence for data integrity, SQL as the language for asking questions, indexes as the difference between 2 milliseconds and 20 seconds, and transactions as the tool that keeps data correct when many requests arrive at once.',
    keyTerms: [
      { term: 'Primary key', meaning: 'A column (or columns) uniquely identifying each row.' },
      { term: 'Foreign key', meaning: 'A column referencing another table\'s key, enforced by the database.' },
      { term: 'Constraint', meaning: 'A rule the database enforces on every write: NOT NULL, UNIQUE, CHECK, FOREIGN KEY.' },
      { term: 'Normalisation', meaning: 'Organising tables so each fact is stored once, avoiding update anomalies.' },
      { term: 'Index', meaning: 'A data structure (usually a B-tree) that makes finding rows by certain columns fast.' },
      { term: 'Transaction', meaning: 'A group of statements that succeed or fail together (atomicity) and see a consistent view of data.' },
      { term: 'Isolation level', meaning: 'How much concurrent transactions can see of each other\'s changes: Read Committed, Repeatable Read, Serializable.' },
    ],
    sections: [
      {
        title: 'The schema is your last line of defence',
        paragraphs: [
          'Application code has bugs; several services may write to the same database; someone will run a script by hand. Constraints are checked on every write no matter where it comes from, so put the rules that must never be broken in the schema: NOT NULL for required columns, UNIQUE for natural keys such as email, CHECK for value ranges, FOREIGN KEY for relationships, and exclusion or unique constraints for business invariants where your database supports them.',
          'Normalise so each fact lives in one place: a customer\'s email is stored once in customers, not copied into every booking row, so it cannot be updated in one place and stale in another. Denormalise deliberately, later, for measured read performance — and document why.',
        ],
        code: `CREATE TABLE rooms (
    id          INT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    capacity    INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE customers (
    id          INT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(200) NOT NULL
);

CREATE TABLE bookings (
    id          INT PRIMARY KEY,
    room_id     INT NOT NULL REFERENCES rooms(id),
    customer_id INT NOT NULL REFERENCES customers(id),
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    status      VARCHAR(20) NOT NULL CHECK (status IN ('Confirmed', 'Cancelled')),
    CHECK (ends_at > starts_at)
);`,
        label: 'Rules enforced by the database',
      },
      {
        title: 'Asking questions with SQL',
        paragraphs: [
          'SELECT describes the result you want, not how to compute it. JOIN combines rows from related tables on matching keys; INNER JOIN keeps only matches, LEFT JOIN keeps every row from the left side. WHERE filters rows before grouping; GROUP BY collapses rows into groups; HAVING filters groups; ORDER BY sorts the result. Think in sets, not loops.',
          'Always use parameters for values — never build SQL by concatenating user input. Concatenation is SQL injection, still one of the most exploited vulnerabilities on the web, and parameters also let the database reuse query plans.',
        ],
        code: `-- Revenue-relevant bookings per room in March, busiest first
SELECT r.name, COUNT(*) AS bookings
FROM bookings b
JOIN rooms r ON r.id = b.room_id
WHERE b.status = 'Confirmed'
  AND b.starts_at >= @from AND b.starts_at < @to       -- parameters, not string concatenation
GROUP BY r.name
HAVING COUNT(*) >= 5
ORDER BY bookings DESC;

-- Two bookings overlap when each starts before the other ends
SELECT 1 FROM bookings
WHERE room_id = @roomId AND status = 'Confirmed'
  AND starts_at < @requestedEnd AND ends_at > @requestedStart;`,
        label: 'Joins, grouping and the overlap test',
      },
      {
        title: 'Indexes: designed from real queries',
        paragraphs: [
          'Without an index, finding rows means reading the whole table. A B-tree index keeps chosen columns sorted so the database can jump to matching rows in O(log n). Design indexes from the queries your application actually runs: the overlap check above filters by room_id and a time range, so an index on (room_id, starts_at) serves it. Column order matters — an index on (room_id, starts_at) helps queries filtering by room_id, but not queries filtering only by starts_at.',
          'Indexes are not free. Every insert and update must maintain every index, and indexes take space. Add them for real queries, check with the database\'s EXPLAIN that they are used, and remove ones nothing uses.',
        ],
        code: `CREATE INDEX ix_bookings_room_start ON bookings (room_id, starts_at);

EXPLAIN ANALYZE
SELECT 1 FROM bookings
WHERE room_id = 7 AND starts_at < '2026-03-02 12:00' AND ends_at > '2026-03-02 10:00';
-- Look for "Index Scan using ix_bookings_room_start" rather than "Seq Scan on bookings"`,
        label: 'An index for the overlap check',
      },
      {
        title: 'Transactions and the double-booking problem',
        paragraphs: [
          'Two customers request the last slot at the same moment. Each request checks "is the room free?", sees yes, and inserts a booking — and now the room is double-booked. This is a race condition, and no amount of application-level checking fixes it, because both checks happen before either insert.',
          'Transactions provide the tools. Run the check and the insert in one transaction at Serializable isolation, so the database detects the conflict and fails one of them; or lock the room row first (SELECT ... FOR UPDATE) so the second request waits for the first to finish; or, best of all, let a constraint make the conflict impossible — PostgreSQL\'s exclusion constraints can forbid overlapping ranges for the same room outright. Whichever you choose, the losing request must receive a clear 409 Conflict, not a 500.',
        ],
        code: `BEGIN;
SELECT id FROM rooms WHERE id = @roomId FOR UPDATE;        -- serialise bookings for this room
SELECT 1 FROM bookings
 WHERE room_id = @roomId AND status = 'Confirmed'
   AND starts_at < @end AND ends_at > @start;
-- if a row came back: ROLLBACK and return 409
INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, status)
VALUES (@roomId, @customerId, @start, @end, 'Confirmed');
COMMIT;

-- PostgreSQL: make overlaps impossible at the schema level
-- ALTER TABLE bookings ADD CONSTRAINT no_overlap
--   EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'Confirmed');`,
        label: 'Check-then-insert made safe',
      },
      {
        title: 'Isolation levels in practice',
        paragraphs: [
          'Read Committed (the default in PostgreSQL and SQL Server) prevents reading uncommitted data but allows another transaction\'s committed changes to appear between your statements — exactly what lets check-then-insert race. Repeatable Read keeps your snapshot stable. Serializable guarantees the result is as if transactions ran one at a time, at the cost of some transactions failing with serialization errors that the application must retry.',
          'Practical rule: keep transactions short, never wait for user input or an external HTTP call inside one, and know which isolation level each critical operation relies on.',
        ],
      },
    ],
    table: {
      headers: ['Problem', 'Database tool', 'Application responsibility'],
      rows: [
        ['Duplicate emails', 'UNIQUE constraint', 'Map the violation to 409 Conflict'],
        ['Orphaned bookings', 'FOREIGN KEY', 'Delete or archive in the right order'],
        ['Slow lookups', 'Index designed from the query', 'Check EXPLAIN; avoid N+1 queries'],
        ['Double booking', 'Lock, Serializable, or exclusion constraint', 'Retry or return 409 to the loser'],
        ['Partial updates', 'Transaction', 'Keep it short; no external calls inside'],
      ],
    },
    exercise: {
      scenario: 'A booking service checks availability with SELECT, then INSERTs if free, each statement auto-committed. Under a promotion, several rooms end up double-booked. The overlap query also takes 3 seconds on 5 million rows.',
      task: 'Fix both the correctness and the performance problem.',
      answer: 'Correctness: the check and insert must be atomic with respect to other bookings for the same room — wrap them in a transaction and either lock the room row (SELECT ... FOR UPDATE) or use Serializable isolation with retry on serialization failure; in PostgreSQL an exclusion constraint on (room_id, time range) makes overlaps impossible even for buggy callers. Return 409 when a booking loses. Performance: add an index on (room_id, starts_at) (or a GiST index on the range) matching the overlap query and confirm with EXPLAIN that it is used.',
      evidence: 'Explains the race, uses transactions/locking or constraints, and designs an index from the query.',
    },
    misconceptions: [
      'Checking in code before inserting prevents duplicates. Without a transaction or constraint, concurrent requests race.',
      'More indexes always help. Each index slows writes and must be justified by queries.',
      'The ORM handles SQL so schema design does not matter. Constraints and indexes are still your job.',
      'Serializable makes everything correct for free. It can abort transactions, which must be retried.',
    ],
    sources: [R.postgresTutorial, R.postgresIndexes, R.postgresMvcc, R.useTheIndex],
    labs: [],
    questions: [
      { prompt: 'Which kind of constraint guarantees that no two customers share an email? (one word)', answer: 'unique' },
      { prompt: 'Which SQL clause filters groups after GROUP BY?', answer: 'HAVING' },
    ],
    quiz: [
      { question: 'Two time ranges [s1, e1) and [s2, e2) overlap when…', options: ['s1 = s2', 's1 < e2 AND e1 > s2', 'e1 = e2', 's1 > e2'], answer: 1, explanation: 'Each starts before the other ends.' },
      { question: 'An index on (room_id, starts_at) helps which filter most?', options: ['starts_at only', 'room_id = ? AND starts_at < ?', 'customer_id = ?', 'status = ?'], answer: 1, explanation: 'Leading column first, then the range.' },
      { question: 'Why must you never concatenate user input into SQL?', options: ['It is slow', 'SQL injection', 'It does not compile', 'It breaks indexes'], answer: 1, explanation: 'Use parameters.' },
      { question: 'What does SELECT ... FOR UPDATE do inside a transaction?', options: ['Updates rows', 'Locks the selected rows until commit', 'Deletes rows', 'Creates an index'], answer: 1, explanation: 'Other writers wait until the lock is released.' },
    ],
  },
  {
    id: 'dn2-4',
    slug: 'ef-core-and-dapper',
    title: 'Data Access in .NET: EF Core, Migrations, Concurrency and Dapper',
    summary: 'Map entities with EF Core, evolve schemas with migrations, write efficient queries (no N+1, no over-fetching), handle optimistic concurrency, and use Dapper where hand-written SQL is clearer.',
    minutes: 60,
    prerequisite: 'Lesson: Relational Database Engineering.',
    outcomes: [
      'Configure a DbContext, entities, relationships and constraints with EF Core.',
      'Create and apply migrations, and review the SQL they generate.',
      'Write efficient EF Core queries using projection, AsNoTracking and eager loading, avoiding N+1.',
      'Detect concurrent updates with concurrency tokens, and use Dapper for reporting queries.',
    ],
    introduction:
      'EF Core is .NET\'s object-relational mapper: you work with C# objects and LINQ, and it generates SQL, tracks changes and saves them in a transaction. Used well it removes a mountain of boilerplate; used without understanding, it produces the slowest queries in your system without you ever seeing them. This lesson teaches EF Core with the SQL always in view, and ends with Dapper — a micro-ORM that runs SQL you write yourself — because the syllabus asks you to use both, each where it fits.',
    keyTerms: [
      { term: 'DbContext', meaning: 'EF Core\'s unit of work: tracks loaded entities and saves changes in a transaction.' },
      { term: 'Migration', meaning: 'A versioned, reviewable change to the database schema generated from your model.' },
      { term: 'Change tracking', meaning: 'EF Core remembers loaded entities and works out which UPDATE statements SaveChanges needs.' },
      { term: 'N+1 query', meaning: 'Loading a list, then issuing one more query per item — 101 queries instead of 1 or 2.' },
      { term: 'Projection', meaning: 'Selecting only the columns you need into a DTO, instead of whole entities.' },
      { term: 'Concurrency token', meaning: 'A version column checked on update so a stale write fails instead of silently overwriting.' },
      { term: 'Dapper', meaning: 'A lightweight library that maps the results of SQL you write to C# objects.' },
    ],
    sections: [
      {
        title: 'Model, context and configuration',
        paragraphs: [
          'Entities are classes; a DbContext exposes DbSet<T> properties and describes how they map to tables in OnModelCreating. Put constraints in the model — required properties, maximum lengths, unique indexes, relationships — so migrations create them in the database. Register the context with AddDbContext, which gives it a scoped lifetime: one per request.',
        ],
        code: `public sealed class BookingDb(DbContextOptions<BookingDb> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Room>(room =>
        {
            room.Property(r => r.Name).HasMaxLength(100).IsRequired();
            room.HasIndex(r => r.Name).IsUnique();
            room.ToTable(t => t.HasCheckConstraint("ck_room_capacity", "capacity > 0"));
        });
        model.Entity<Booking>(booking =>
        {
            booking.HasOne(b => b.Room).WithMany(r => r.Bookings).HasForeignKey(b => b.RoomId);
            booking.HasIndex(b => new { b.RoomId, b.StartsAt });
            booking.Property(b => b.Version).IsRowVersion();     // concurrency token
        });
    }
}

builder.Services.AddDbContext<BookingDb>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("Bookings")));`,
        label: 'Constraints and indexes in the model',
      },
      {
        title: 'Migrations: schema changes as code',
        paragraphs: [
          'dotnet ef migrations add CreateBookings compares your model with the last migration and generates C# describing the difference; dotnet ef database update applies pending migrations. Commit migrations to Git and review them like code — and review the SQL too (dotnet ef migrations script), because a migration that renames a column by dropping and re-adding it will delete production data.',
          'In production, apply migrations as a deliberate deployment step (a migration bundle or an idempotent SQL script in CI/CD), not automatically from every running instance at startup.',
        ],
        code: `$ dotnet tool install --global dotnet-ef
$ dotnet ef migrations add CreateBookings
$ dotnet ef migrations script --idempotent -o migrate.sql     # review this before production
$ dotnet ef database update`,
        label: 'Generate, review, apply',
      },
      {
        title: 'Queries that do not surprise you',
        paragraphs: [
          'LINQ against a DbSet is translated to SQL when enumerated. Three habits keep it fast. Project to DTOs with Select so only needed columns are read. Use AsNoTracking for read-only queries so EF Core does not spend time and memory tracking entities you will never save. And load related data deliberately — Include for eager loading, or a projection — rather than touching navigation properties in a loop, which (with lazy loading) causes N+1 queries.',
          'Turn on logging of generated SQL in development and read it. If a page issues 200 queries, you will see it immediately.',
        ],
        code: `// N+1: one query for rooms, then one per room for its bookings
foreach (var room in await db.Rooms.ToListAsync(ct))
    Console.WriteLine($"{room.Name}: {room.Bookings.Count}");    // with lazy loading, a query each time

// One query, only the columns needed
var summary = await db.Rooms
    .AsNoTracking()
    .Select(r => new RoomSummary(r.Name, r.Bookings.Count(b => b.Status == BookingStatus.Confirmed)))
    .ToListAsync(ct);`,
        label: 'From N+1 to one projected query',
      },
      {
        title: 'Saving and optimistic concurrency',
        paragraphs: [
          'Load an entity, change it, call SaveChangesAsync: EF Core generates the UPDATE and runs all pending changes in one transaction. With a concurrency token configured, the UPDATE includes WHERE Version = @originalVersion; if another request changed the row in the meantime, zero rows match and EF Core throws DbUpdateConcurrencyException. Catch it and return 409 or 412 so the client can reload and retry, instead of silently overwriting someone else\'s change — the "lost update" problem.',
          'This is optimistic concurrency: no locks are held while a user edits; conflicts are detected at save time. It suits web APIs, and pairs naturally with HTTP ETags: the version becomes the ETag, and If-Match carries it back.',
        ],
        code: `try
{
    var booking = await db.Bookings.SingleAsync(b => b.Id == id, ct);
    db.Entry(booking).Property(b => b.Version).OriginalValue = versionFromIfMatchHeader;
    booking.Reschedule(newStart, newEnd);
    await db.SaveChangesAsync(ct);
    return TypedResults.NoContent();
}
catch (DbUpdateConcurrencyException)
{
    return TypedResults.Problem(statusCode: 412, title: "The booking was changed by someone else. Reload and try again.");
}`,
        label: 'Detecting a lost update',
      },
      {
        title: 'Dapper for reporting queries',
        paragraphs: [
          'Some queries are clearer — and faster — written by hand: reports with several joins, window functions and aggregates. Dapper runs your SQL with parameters and maps rows to records with almost no overhead. Your notes give the right order: write the SQL yourself first, understand it, then use Dapper to execute it. Keep the SQL in one place per report and test it against a real database (Week 8 covers Testcontainers).',
        ],
        code: `public sealed record RoomUtilisation(string Room, int Bookings, decimal HoursBooked);

const string sql = """
    SELECT r.name AS Room,
           COUNT(b.id) AS Bookings,
           COALESCE(SUM(EXTRACT(EPOCH FROM (b.ends_at - b.starts_at)) / 3600), 0) AS HoursBooked
    FROM rooms r
    LEFT JOIN bookings b ON b.room_id = r.id AND b.status = 'Confirmed'
                         AND b.starts_at >= @From AND b.starts_at < @To
    GROUP BY r.name
    ORDER BY HoursBooked DESC;
    """;

await using var connection = new NpgsqlConnection(connectionString);
var report = await connection.QueryAsync<RoomUtilisation>(sql, new { From = from, To = to });`,
        label: 'Hand-written SQL, mapped by Dapper',
      },
    ],
    table: {
      headers: ['Situation', 'Prefer', 'Avoid'],
      rows: [
        ['Read-only list for an API', 'Select into DTO + AsNoTracking', 'Loading full entities with all columns'],
        ['Related data', 'Include or a projection', 'Lazy loading inside loops (N+1)'],
        ['Concurrent edits', 'Concurrency token → 409/412', 'Last write silently wins'],
        ['Complex report', 'Dapper with reviewed SQL', 'Huge LINQ chains no one can read'],
        ['Schema change', 'Reviewed migration + SQL script', 'Editing the database by hand'],
      ],
    },
    exercise: {
      scenario: 'A /rooms endpoint loads db.Rooms.ToList() and, for each room, reads room.Bookings to count upcoming bookings, returning full Room entities as JSON. It takes 4 seconds with 300 rooms. Two admins editing the same booking sometimes overwrite each other without noticing.',
      task: 'Fix the query and the lost updates.',
      answer: 'Replace the loop with one projected query: db.Rooms.AsNoTracking().Select(r => new RoomDto(r.Id, r.Name, r.Bookings.Count(b => b.StartsAt >= now && b.Status == Confirmed))).ToListAsync(), returning DTOs rather than entities (which also stops leaking internal fields). For edits, add a row-version concurrency token, expose it as an ETag, require If-Match on updates, set the original value from the header, and catch DbUpdateConcurrencyException to return 412 Precondition Failed so the second admin reloads.',
      evidence: 'Removes N+1 with a projection and introduces optimistic concurrency mapped to HTTP.',
    },
    misconceptions: [
      'EF Core makes SQL knowledge unnecessary. You must read the SQL it generates and design indexes.',
      'Tracking is free. For read-only queries AsNoTracking saves memory and time.',
      'Migrations can run automatically on every app start in production. Apply them deliberately as a deployment step.',
      'Using Dapper means abandoning EF Core. Many systems use EF Core for writes and Dapper for reports.',
    ],
    sources: [R.efCore, R.efMigrations, R.efPerformance, R.efConcurrency, R.dapper],
    labs: [],
    questions: [
      { prompt: 'Which EF Core exception signals that a concurrency token no longer matched?', answer: 'DbUpdateConcurrencyException' },
      { prompt: 'What is the name of the problem where loading a list triggers one extra query per item? Write it as letter-plus-number.', answer: 'N+1', accept: ['n plus 1', 'n+1 query', 'n 1'] },
    ],
    quiz: [
      { question: 'What does AsNoTracking do?', options: ['Disables SQL logging', 'Skips change tracking for read-only queries', 'Deletes rows', 'Removes indexes'], answer: 1, explanation: 'Entities are not tracked, saving memory and time.' },
      { question: 'Where should migrations be reviewed before production?', options: ['Nowhere', 'In code review, including the generated SQL', 'Only in production', 'In the database console'], answer: 1, explanation: 'Generated SQL can destroy data if wrong.' },
      { question: 'What lifetime does AddDbContext use by default?', options: ['Singleton', 'Scoped', 'Transient', 'Static'], answer: 1, explanation: 'One context per request.' },
      { question: 'When is Dapper a good choice?', options: ['Never', 'Complex reporting SQL you want to control', 'Only for inserts', 'Instead of transactions'], answer: 1, explanation: 'It executes hand-written SQL with minimal overhead.' },
    ],
  },
];
