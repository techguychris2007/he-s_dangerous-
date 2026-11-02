import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  authn: { title: 'Microsoft Learn — Overview of ASP.NET Core authentication', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/' },
  identitySpa: { title: 'Microsoft Learn — Use Identity to secure a Web API backend for SPAs', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization' },
  jwtBearer: { title: 'Microsoft Learn — Configure JWT bearer authentication in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication' },
  owaspPasswords: { title: 'OWASP — Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
  rfc8725: { title: 'RFC 8725 — JSON Web Token Best Current Practices', url: 'https://www.rfc-editor.org/rfc/rfc8725' },
  authz: { title: 'Microsoft Learn — Policy-based authorization in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies' },
  resourceAuthz: { title: 'Microsoft Learn — Resource-based authorization', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased' },
  owaspApi: { title: 'OWASP — API Security Top 10 (2023)', url: 'https://owasp.org/API-Security/editions/2023/en/0x11-t10/' },
  rateLimiting: { title: 'Microsoft Learn — Rate limiting middleware in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit' },
  dataProtection: { title: 'Microsoft Learn — ASP.NET Core security overview', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/' },
  errorHandling: { title: 'Microsoft Learn — Handle errors in ASP.NET Core APIs', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling-api' },
  openApi: { title: 'Microsoft Learn — Generate OpenAPI documents', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi' },
  conditionalRequests: { title: 'MDN — HTTP conditional requests (ETag, If-Match)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests' },
  healthChecks: { title: 'Microsoft Learn — Health checks in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks' },
  logging: { title: 'Microsoft Learn — Logging in .NET', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/logging' },
  resilience: { title: 'Microsoft Learn — Build resilient HTTP apps', url: 'https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience' },
  integrationTests: { title: 'Microsoft Learn — Integration tests in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests' },
  testcontainers: { title: 'Testcontainers for .NET — Getting started', url: 'https://dotnet.testcontainers.org/' },
  outputCaching: { title: 'Microsoft Learn — Output caching middleware', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output' },
} as const;

/** Month 2, weeks 7–8: authentication, authorization and API security (assignment: Secure the
 *  Platform), then production API engineering (assignment: Production Readiness). */
export const DN_MONTH2_B: CurriculumLesson[] = [
  {
    id: 'dn2-5',
    slug: 'authentication-in-aspnet-core',
    title: 'Authentication: Passwords, Cookies, Tokens and Identity',
    summary: 'Store passwords correctly, understand cookie and token authentication, validate JWTs properly, and use ASP.NET Core Identity — knowing which parts of the samples are not production-ready.',
    minutes: 55,
    prerequisite: 'Weeks 5 and 6.',
    outcomes: [
      'Explain why passwords are hashed with a slow, salted algorithm and verify them in constant time.',
      'Compare cookie and bearer-token authentication and choose between them for a browser SPA and a mobile client.',
      'List what a server must validate in a JWT (signature, algorithm, issuer, audience, expiry) and why.',
      'Configure ASP.NET Core Identity endpoints and identify the shortcuts in demonstration setups.',
    ],
    introduction:
      'Authentication answers "who is making this request?". Getting it wrong is catastrophic and, unfortunately, easy: storing passwords with a fast hash, accepting a token without checking its signature, or leaving a demo setting enabled in production. This lesson builds the concepts from the ground up — passwords, sessions, tokens — and then shows how ASP.NET Core implements them, so that when you secure the platform this week you understand what every line does. Your course notes rightly warn that Microsoft\'s Identity API sample uses an in-memory database for demonstration: treat samples as learning material, not deployment templates.',
    keyTerms: [
      { term: 'Authentication', meaning: 'Establishing who the caller is.' },
      { term: 'Password hashing', meaning: 'Storing a one-way, deliberately slow, salted transformation of a password instead of the password.' },
      { term: 'Salt', meaning: 'Random data stored with each hash so identical passwords produce different hashes.' },
      { term: 'Session cookie', meaning: 'A cookie identifying an authenticated session, sent automatically by the browser.' },
      { term: 'Bearer token', meaning: 'A token in the Authorization header; whoever bears it is treated as the authenticated user.' },
      { term: 'JWT', meaning: 'JSON Web Token: a signed, base64url-encoded set of claims with a header, payload and signature.' },
      { term: 'Claim', meaning: 'A statement about the user, such as their id, email or role.' },
    ],
    sections: [
      {
        title: 'Storing passwords',
        paragraphs: [
          'Never store passwords, and never store them with a fast hash such as plain SHA-256: attackers who steal the table can test billions of guesses per second. Use a password-hashing function designed to be slow and salted — PBKDF2 with a high iteration count, bcrypt, scrypt or Argon2id. OWASP\'s Password Storage Cheat Sheet gives current parameters; ASP.NET Core Identity\'s PasswordHasher uses PBKDF2 and stores the parameters with the hash so they can be raised later.',
          'Compare hashes with a constant-time comparison (CryptographicOperations.FixedTimeEquals) so the time a comparison takes does not reveal how many bytes matched.',
        ],
        code: `using System.Security.Cryptography;

static string HashPassword(string password, int iterations = 600_000)
{
    byte[] salt = RandomNumberGenerator.GetBytes(16);
    byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, 32);
    return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
}

static bool VerifyPassword(string password, string stored)
{
    string[] parts = stored.Split('.');
    int iterations = int.Parse(parts[0]);
    byte[] salt = Convert.FromBase64String(parts[1]);
    byte[] expected = Convert.FromBase64String(parts[2]);
    byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
    return CryptographicOperations.FixedTimeEquals(actual, expected);
}`,
        label: 'Salted, slow, constant-time',
      },
      {
        title: 'Cookies versus bearer tokens',
        paragraphs: [
          'With cookie authentication, the server sets an encrypted, HttpOnly, Secure cookie after login and the browser sends it automatically. It is simple and safe for a browser front end on the same site — HttpOnly stops JavaScript (and XSS) reading it — but automatic sending means you must defend against cross-site request forgery, which SameSite cookies largely do.',
          'With bearer tokens, the client stores a token and sends it in the Authorization header. That suits mobile apps and service-to-service calls, but a token stored where JavaScript can read it is exposed to XSS. A common modern pattern for SPAs is the backend-for-frontend: the browser uses a cookie with its own backend, which holds tokens for downstream APIs.',
        ],
      },
      {
        title: 'What validating a JWT really means',
        paragraphs: [
          'A JWT is three base64url parts: a header (algorithm), a payload (claims such as sub, exp, iss, aud) and a signature. Anyone can read the payload — it is encoded, not encrypted — so never put secrets in it. The signature is the only thing that makes it trustworthy, and a server must check all of: the signature with the expected key; the algorithm against an allow-list (never trust the header\'s alg, and never accept "none"); the issuer; the audience; and the expiry and not-before times with a small clock-skew allowance.',
          'ASP.NET Core\'s JWT bearer handler does these checks when configured, which is why you configure it rather than parsing tokens yourself. This week\'s assignment has you implement a minimal HS256 validator once, so you understand exactly what the library protects you from.',
        ],
        code: `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://login.example.com";       // issuer metadata and signing keys
        options.Audience = "tasks-api";                        // tokens must be meant for THIS api
        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            ValidAlgorithms = ["RS256"],                       // allow-list
        };
    });`,
        label: 'Configure validation; never hand-roll it in production',
      },
      {
        title: 'ASP.NET Core Identity',
        paragraphs: [
          'Identity provides user storage, password hashing, lockout, two-factor support and, since .NET 8, ready-made API endpoints (MapIdentityApi) for registering, logging in and refreshing tokens or cookies. It stores users through EF Core in your database.',
          'The official SPA sample uses an in-memory database so it runs without setup; in a real deployment you use a persistent database, require confirmed emails, configure lockout, enforce HTTPS, and decide deliberately between cookie and token mode. External identity providers (Microsoft Entra ID, Google, Auth0) via OpenID Connect are often the better choice: you never store a password at all.',
        ],
        code: `builder.Services.AddDbContext<AppDb>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("App")));
builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<IdentityUser>(o =>
{
    o.Password.RequiredLength = 12;
    o.Lockout.MaxFailedAccessAttempts = 5;
    o.SignIn.RequireConfirmedEmail = true;
}).AddEntityFrameworkStores<AppDb>();

var app = builder.Build();
app.MapGroup("/account").MapIdentityApi<IdentityUser>();   // /register, /login, /refresh, ...`,
        label: 'Identity with a real store and real policies',
      },
      {
        title: 'Login endpoints are attack surfaces',
        paragraphs: [
          'Attackers try leaked password lists against every login endpoint (credential stuffing). Defend with lockout after repeated failures, rate limiting per account and per IP, generic error messages that do not reveal whether an email exists, and multi-factor authentication for anything sensitive. Log authentication failures — they are some of the most valuable security signals you can send to a SIEM.',
        ],
      },
    ],
    table: {
      headers: ['Topic', 'Do', 'Never'],
      rows: [
        ['Password storage', 'PBKDF2/bcrypt/Argon2id with salt; constant-time compare', 'Plain text, MD5, SHA-256 alone'],
        ['Browser sessions', 'HttpOnly, Secure, SameSite cookies', 'Tokens in localStorage without a plan for XSS'],
        ['JWT validation', 'Signature, alg allow-list, iss, aud, exp', 'Trusting alg from the header or "none"'],
        ['Login endpoint', 'Lockout, rate limits, generic errors, MFA', 'Messages revealing which emails exist'],
        ['Samples', 'Learn from them', 'Deploy in-memory demo configuration'],
      ],
    },
    exercise: {
      scenario: 'A team stores SHA-256(password) without salt, issues JWTs signed with the secret "secret", validates them by decoding the payload and checking exp, and returns "No account with that email" on failed logins.',
      task: 'Identify every flaw and specify the fix.',
      answer: 'Unsalted fast SHA-256 is crackable at scale — migrate to PBKDF2/Argon2id with per-user salt, rehashing on next login. A guessable HMAC secret lets anyone forge tokens — use a long random key from a secret store (or asymmetric RS256 keys from an identity provider). Decoding without verifying the signature trusts attacker-supplied claims — validate signature, algorithm allow-list, issuer, audience and lifetime via the JWT bearer handler. The error message enables account enumeration — return a generic "invalid email or password" and add lockout and rate limiting.',
      evidence: 'Covers hashing, key strength, full token validation and enumeration.',
    },
    misconceptions: [
      'A JWT payload is secret. It is only base64url-encoded; anyone can read it.',
      'SHA-256 is fine for passwords because it is secure. It is too fast; use a slow password hash.',
      'Checking exp is enough to validate a token. Without signature, issuer and audience checks, tokens can be forged or misused.',
      'The Identity sample is production-ready. It uses demo settings such as an in-memory store.',
    ],
    sources: [R.authn, R.identitySpa, R.jwtBearer, R.owaspPasswords, R.rfc8725],
    labs: [],
    questions: [
      { prompt: 'Which method compares two byte arrays in constant time in .NET? Give the method name only.', answer: 'FixedTimeEquals', accept: ['cryptographicoperations.fixedtimeequals'] },
      { prompt: 'Which JWT claim states the intended recipient API? Give its three-letter name.', answer: 'aud', accept: ['audience'] },
    ],
    quiz: [
      { question: 'Why add a unique salt to each password hash?', options: ['To make hashes shorter', 'So identical passwords hash differently and precomputed tables fail', 'To encrypt the password', 'It is optional decoration'], answer: 1, explanation: 'Salts defeat rainbow tables and reveal nothing about reuse.' },
      { question: 'Which cookie flag stops JavaScript reading a session cookie?', options: ['Secure', 'HttpOnly', 'SameSite', 'Path'], answer: 1, explanation: 'HttpOnly hides the cookie from scripts.' },
      { question: 'A token\'s header says "alg": "none". The server should…', options: ['Accept it', 'Reject it — algorithms come from an allow-list', 'Ignore the signature', 'Re-sign it'], answer: 1, explanation: 'Never trust the header to choose the algorithm.' },
      { question: 'What does credential stuffing exploit?', options: ['Weak TLS', 'Passwords reused from other breaches', 'SQL injection', 'CORS'], answer: 1, explanation: 'Leaked credentials are replayed against your login.' },
    ],
  },
  {
    id: 'dn2-6',
    slug: 'authorization-and-api-security',
    title: 'Authorization and API Security: Policies, Ownership and the OWASP API Top 10',
    summary: 'Authorize with policies and claims, enforce object-level ownership checks, defend against the OWASP API Security Top 10, and configure rate limiting, CORS and security headers.',
    minutes: 55,
    prerequisite: 'Lesson: Authentication.',
    outcomes: [
      'Write role-, claim- and policy-based authorization rules in ASP.NET Core.',
      'Implement resource-based (object-level) authorization so users can only act on their own data.',
      'Recognise the OWASP API Top 10 risks in code — especially BOLA, broken authentication and mass assignment.',
      'Apply rate limiting, CORS and least-privilege principles to an API.',
    ],
    introduction:
      'Authorization answers "is this caller allowed to do this, to this particular thing?". The second half of that question is where most real API breaches happen. OWASP ranks Broken Object Level Authorization first in its API Security Top 10: the user is properly logged in, the endpoint properly requires login, and yet changing /orders/1001 to /orders/1002 returns someone else\'s order. This lesson connects the framework features — policies, claims, handlers — to the threats they exist to stop, which is exactly what this week\'s "Secure the Platform" assignment asks you to do.',
    keyTerms: [
      { term: 'Authorization', meaning: 'Deciding whether an authenticated caller may perform an action.' },
      { term: 'Role / claim', meaning: 'Statements about a user (role: admin, plan: premium) that rules can examine.' },
      { term: 'Policy', meaning: 'A named set of requirements, such as "CanManageBookings", applied to endpoints.' },
      { term: 'Resource-based authorization', meaning: 'A check that depends on the specific object, such as "is this the booking\'s owner?".' },
      { term: 'BOLA', meaning: 'Broken Object Level Authorization: accessing another user\'s objects by changing an id.' },
      { term: 'Least privilege', meaning: 'Granting every user and component only the access it needs.' },
    ],
    sections: [
      {
        title: 'Policies, roles and claims',
        paragraphs: [
          'Mark endpoints with RequireAuthorization and name a policy. A policy can require a role, a claim value, or any custom requirement evaluated by a handler. Prefer named policies to scattering role names across endpoints: when the rule changes, you change it in one place.',
          'Deny by default. Configure a fallback policy that requires an authenticated user, then explicitly allow anonymous access to the few endpoints that need it (login, health checks). A newly added endpoint is then protected even if its author forgets.',
        ],
        code: `builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())   // deny by default
    .AddPolicy("Staff", p => p.RequireRole("staff", "admin"))
    .AddPolicy("PremiumMember", p => p.RequireClaim("plan", "premium"));

app.MapGet("/reports/revenue", GetRevenue).RequireAuthorization("Staff");
app.MapPost("/account/login", Login).AllowAnonymous();`,
        label: 'Deny by default, allow deliberately',
      },
      {
        title: 'Object-level authorization: the check everyone forgets',
        paragraphs: [
          'Requiring login does not stop a logged-in user reading another user\'s data. Every endpoint that takes an object id must verify the caller may access that object: the booking belongs to them, or they are staff. Do it on the server for every request, using the id from the authenticated principal — never a user id supplied in the request body or query string.',
          'Returning 404 rather than 403 for objects the user may not see avoids confirming that the id exists; either is acceptable if applied consistently.',
        ],
        code: `app.MapGet("/bookings/{id:int}", async Task<Results<Ok<BookingDto>, NotFound>> (
    int id, ClaimsPrincipal user, IBookingStore store, CancellationToken ct) =>
{
    var booking = await store.FindAsync(id, ct);
    if (booking is null) return TypedResults.NotFound();

    string callerId = user.FindFirstValue(ClaimTypes.NameIdentifier)!;
    bool isStaff = user.IsInRole("staff");
    if (booking.CustomerId != callerId && !isStaff) return TypedResults.NotFound();   // BOLA check

    return TypedResults.Ok(BookingDto.From(booking));
});`,
        label: 'Ownership checked on every request',
      },
      {
        title: 'The OWASP API Security Top 10 in practice',
        paragraphs: [
          'Know the list well enough to spot it in a code review. Broken Object Level Authorization (the check above). Broken Authentication (weak tokens, missing lockout). Broken Object Property Level Authorization — returning fields the caller should not see, or letting them set fields they should not (mass assignment). Unrestricted Resource Consumption — no rate limits, unbounded page sizes, unlimited upload sizes. Broken Function Level Authorization — regular users reaching admin endpoints. Unrestricted Access to Sensitive Business Flows — automating a flow such as buying all the tickets. Server-Side Request Forgery — fetching attacker-supplied URLs. Security Misconfiguration — verbose errors, permissive CORS, debug endpoints in production. Improper Inventory Management — forgotten old API versions. Unsafe Consumption of APIs — trusting third-party responses without validation.',
        ],
      },
      {
        title: 'Rate limiting, CORS and headers',
        paragraphs: [
          'ASP.NET Core\'s rate-limiting middleware supports fixed window, sliding window, token bucket and concurrency limiters, partitioned by user or IP; rejected requests receive 429 Too Many Requests. You built a sliding-window limiter yourself in Week 4, so you know exactly what it does.',
          'CORS controls which browser origins may call your API from JavaScript. Allow specific origins; never combine AllowAnyOrigin with credentials. Remember CORS is a browser protection, not authorization: it does nothing against curl or a server. Send security headers (HSTS, X-Content-Type-Options: nosniff) and keep detailed exception pages for development only.',
        ],
        code: `builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("per-user", context => RateLimitPartition.GetSlidingWindowLimiter(
        context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        _ => new SlidingWindowRateLimiterOptions { PermitLimit = 100, Window = TimeSpan.FromMinutes(1), SegmentsPerWindow = 6 }));
});
builder.Services.AddCors(o => o.AddPolicy("web", p => p.WithOrigins("https://app.example.com").AllowAnyHeader().AllowAnyMethod()));

app.UseRateLimiter();
app.UseCors("web");`,
        label: 'Built-in protections, configured specifically',
      },
      {
        title: 'Least privilege and secrets',
        paragraphs: [
          'Least privilege applies to everything, not just users: the database account the API uses should not be able to drop tables; the API should not run as an administrator; a service that only reads a storage container should not hold a key that can delete it. Keep secrets out of code and logs, rotate them, and prefer managed identities (Month 5) so there is no secret to leak at all.',
        ],
      },
    ],
    table: {
      headers: ['Risk', 'Example', 'Control'],
      rows: [
        ['BOLA (API1)', 'GET /bookings/1002 returns another user\'s booking', 'Ownership check on every object access'],
        ['Property-level (API3)', 'PATCH sets "isAdmin": true', 'Request DTOs; explicit response DTOs'],
        ['Resource consumption (API4)', 'pageSize=1000000; no rate limit', 'Caps, rate limiting, timeouts'],
        ['Function-level (API5)', 'Customer calls /admin/refunds', 'Policies; deny-by-default fallback'],
        ['Misconfiguration (API8)', 'Stack traces and AllowAnyOrigin in production', 'Environment-specific config, strict CORS'],
      ],
    },
    exercise: {
      scenario: 'A booking API requires authentication on every endpoint. PUT /bookings/{id} loads the booking by id and applies the request body, which includes customerId and status, then saves. GET /bookings?customerId=... returns that customer\'s bookings. Admin endpoints check an isAdmin query parameter.',
      task: 'List the vulnerabilities and fixes.',
      answer: 'PUT has no ownership check (BOLA) — verify the booking\'s customer matches the authenticated user (or staff role). Applying the whole body allows changing customerId and status (mass assignment / property-level authorization) — accept a DTO with only the editable fields and enforce state transitions in the domain. The GET filter trusts a client-supplied customerId — derive it from the authenticated principal, or require staff to query others. The isAdmin query parameter is client-controlled — use a role/policy from the authenticated identity with RequireAuthorization("Admin").',
      evidence: 'Identifies BOLA, mass assignment, client-controlled identity and function-level authorization flaws.',
    },
    misconceptions: [
      'Requiring login on every endpoint makes an API secure. Object-level checks are still needed.',
      'CORS protects the API. It only restricts browsers; servers and scripts ignore it.',
      'Hiding admin links in the UI protects admin features. Endpoints must enforce authorization themselves.',
      '403 versus 404 for forbidden objects is a security hole. Either is fine if consistent; 404 avoids confirming existence.',
    ],
    sources: [R.authz, R.resourceAuthz, R.owaspApi, R.rateLimiting, R.dataProtection],
    labs: [],
    questions: [
      { prompt: 'What does the acronym BOLA stand for?', answer: 'Broken Object Level Authorization', accept: ['broken object level authorisation'] },
      { prompt: 'Which HTTP status code means a client sent too many requests?', answer: '429' },
    ],
    quiz: [
      { question: 'What is a fallback authorization policy for?', options: ['Logging', 'Protecting endpoints that do not specify a policy', 'Caching', 'CORS'], answer: 1, explanation: 'It makes protection the default.' },
      { question: 'Where should the current user\'s id come from?', options: ['The request body', 'A query parameter', 'The authenticated principal\'s claims', 'A cookie the client sets'], answer: 2, explanation: 'Client-supplied identity can be forged.' },
      { question: 'AllowAnyOrigin combined with credentials is…', options: ['Recommended', 'Insecure and rejected', 'Needed for mobile apps', 'Faster'], answer: 1, explanation: 'Never allow any origin with credentials.' },
      { question: 'A PATCH that lets a user set their own role is which OWASP API risk?', options: ['SSRF', 'Broken object property level authorization (mass assignment)', 'Inventory management', 'Unsafe consumption'], answer: 1, explanation: 'Users must not set properties they are not entitled to.' },
    ],
  },
  {
    id: 'dn2-7',
    slug: 'production-api-engineering-contracts',
    title: 'Production API Engineering I: Validation, Errors, ETags, Idempotency and OpenAPI',
    summary: 'Make an API predictable under real use: consistent validation and error responses, global exception handling, optimistic concurrency with ETags, idempotent creation, cursor pagination and an accurate OpenAPI document.',
    minutes: 55,
    prerequisite: 'Weeks 5–7.',
    outcomes: [
      'Return complete validation errors and a consistent ProblemDetails shape for every failure.',
      'Translate domain outcomes and exceptions into the right status codes in one place.',
      'Implement ETag/If-Match optimistic concurrency and Idempotency-Key handling for POST.',
      'Publish an accurate OpenAPI document and keep it in sync with the code.',
    ],
    introduction:
      'An API that works when used correctly is a prototype. A production API behaves predictably when clients send bad data, send the same request twice, edit the same resource at the same time, or hit a bug in your code at 3 a.m. Week 8\'s assignment, "Production Readiness", asks you to take an API to that standard. This first lesson covers the contract side — what clients see — and the next covers the operational side.',
    keyTerms: [
      { term: 'ValidationProblem', meaning: 'A 400 Problem Details response with an errors dictionary of field names to messages.' },
      { term: 'Exception handler', meaning: 'Central middleware that turns unhandled exceptions into consistent 500 problem responses.' },
      { term: 'ETag', meaning: 'A response header identifying a version of a resource.' },
      { term: 'If-Match', meaning: 'A request header saying "only apply this change if the resource is still at this version".' },
      { term: 'Idempotency key', meaning: 'A client-chosen key that makes repeated POSTs return the original result instead of repeating the work.' },
      { term: 'OpenAPI', meaning: 'A machine-readable description of an HTTP API used for docs, client generation and testing.' },
    ],
    sections: [
      {
        title: 'Validation that helps clients',
        paragraphs: [
          'Validate every field and report every problem in one response, keyed by field name, so a form can highlight all of them at once. Separate structural validation (required, length, format) from business rules that need data (the due date is after the start; the email is not already registered) — the first is a 400, the second often a 409 or 422 depending on your API\'s conventions. Whatever you choose, document it and apply it everywhere.',
        ],
      },
      {
        title: 'Errors in one place',
        paragraphs: [
          'Status-code decisions scattered through handlers drift apart. Model expected outcomes explicitly — NotFound, Conflict, ValidationFailed — in your application layer and map them to HTTP in one function. Let unexpected exceptions reach a single exception handler that logs them with a correlation id and returns a generic 500 problem without stack traces or internal messages; the client gets the trace id so support can find the log entry.',
        ],
        code: `builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx =>
    ctx.ProblemDetails.Extensions["traceId"] = Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier);

public sealed class ConflictExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext http, Exception ex, CancellationToken ct)
    {
        if (ex is not DbUpdateConcurrencyException) return false;          // let others fall through
        http.Response.StatusCode = StatusCodes.Status412PreconditionFailed;
        await http.Response.WriteAsJsonAsync(new ProblemDetails { Status = 412, Title = "The resource was modified by someone else." }, ct);
        return true;
    }
}
builder.Services.AddExceptionHandler<ConflictExceptionHandler>();`,
        label: 'Central, consistent error handling',
      },
      {
        title: 'Optimistic concurrency with ETags',
        paragraphs: [
          'Every representation of a resource carries its version as an ETag. A client that wants to update sends If-Match with the ETag it last saw. If the stored version still matches, the update proceeds and returns the new ETag; if not, the server returns 412 Precondition Failed and the client must reload. Requests without If-Match can be refused with 428 Precondition Required on resources where lost updates matter.',
          'Weak and strong ETags exist; for concurrency control use strong ETags derived from a version number or row version, quoted as the specification requires: ETag: "7".',
        ],
        code: `GET /tasks/42            → 200, ETag: "7"
PUT /tasks/42            If-Match: "7"   → 200, ETag: "8"
PUT /tasks/42            If-Match: "7"   → 412 Precondition Failed   (someone else saved version 8)
PUT /tasks/42            (no If-Match)   → 428 Precondition Required`,
        label: 'The conditional-update conversation',
      },
      {
        title: 'Idempotent creation',
        paragraphs: [
          'Clients retry POSTs after timeouts. With an Idempotency-Key header, the server records the key, a fingerprint of the request body and the response it produced. A repeat with the same key and same body returns the stored response; the same key with a different body is a client error (422 or 409) because the key is being misused. Keys expire after a retention period such as 24 hours. Store them atomically with the created resource, or a crash between the two reintroduces duplicates.',
        ],
      },
      {
        title: 'Pagination and OpenAPI',
        paragraphs: [
          'Return pages with a stable order and a nextCursor (opaque to the client, typically base64url of the last sort key) and cap pageSize. Include enough metadata for clients to iterate without guessing.',
          'ASP.NET Core generates an OpenAPI document from your endpoints (AddOpenApi, MapOpenApi). Typed results, explicit Produces declarations and XML comments make it accurate. Treat the document as part of the contract: generate clients from it, diff it in CI, and fail the build on unintended breaking changes.',
        ],
        code: `builder.Services.AddOpenApi();
app.MapOpenApi();                                   // /openapi/v1.json

tasks.MapGet("/", GetTasks)
    .WithName("ListTasks")
    .WithSummary("List tasks, newest first, with cursor pagination.")
    .Produces<TaskPage>(StatusCodes.Status200OK)
    .ProducesValidationProblem();`,
        label: 'The document is part of the contract',
      },
    ],
    table: {
      headers: ['Situation', 'Response', 'Header'],
      rows: [
        ['Invalid fields', '400 ValidationProblem with errors{}', 'Content-Type: application/problem+json'],
        ['Stale update', '412 Precondition Failed', 'If-Match mismatched the current ETag'],
        ['Update without version', '428 Precondition Required', 'If-Match missing'],
        ['Repeated POST, same key and body', 'The original 201 response', 'Idempotency-Key'],
        ['Same key, different body', '422 (or 409)', 'Idempotency-Key'],
        ['Unexpected exception', '500 problem with traceId only', '—'],
      ],
    },
    exercise: {
      scenario: 'Two support agents edit the same ticket; the second save silently overwrites the first. A mobile client double-submits orders on flaky networks. Unhandled exceptions return stack traces to clients.',
      task: 'Specify the HTTP contract and server behaviour that fixes all three.',
      answer: 'Expose a version as a strong ETag on GET/PUT responses; require If-Match on PUT/PATCH, return 412 when it does not match and 428 when it is missing; agents reload and reapply. Accept an Idempotency-Key on POST /orders, store key + body hash + response atomically with the order, replay the stored 201 for repeats, and return 422 for the same key with a different body. Add UseExceptionHandler with ProblemDetails so unexpected errors return a generic 500 with a traceId while the full exception is logged server-side.',
      evidence: 'ETag/If-Match concurrency, idempotency keys with body fingerprint, and centralised safe 500s.',
    },
    misconceptions: [
      'One validation error at a time is fine. Clients need all errors to fix a form in one pass.',
      'Concurrency only matters at high traffic. Two users editing the same record is enough.',
      'Idempotency keys only need the key. Without checking the body, a reused key can return the wrong result.',
      'Stack traces in error responses help clients. They leak internals; log them server-side.',
    ],
    sources: [R.errorHandling, R.conditionalRequests, R.openApi],
    labs: [],
    questions: [
      { prompt: 'Which request header carries the ETag a client last saw when updating?', answer: 'If-Match' },
      { prompt: 'Which status code means the If-Match precondition failed?', answer: '412' },
    ],
    quiz: [
      { question: 'A PUT arrives without If-Match on a resource that requires it. Status?', options: ['200', '409', '412', '428'], answer: 3, explanation: '428 Precondition Required.' },
      { question: 'Same Idempotency-Key, different request body. Best response?', options: ['Replay the old response', 'Create a new resource', '422 or 409 — the key is misused', '500'], answer: 2, explanation: 'Detect key reuse with a body fingerprint.' },
      { question: 'What should a production 500 response contain?', options: ['The stack trace', 'A generic message and a trace id', 'The SQL that failed', 'Nothing'], answer: 1, explanation: 'Details stay in server logs.' },
      { question: 'Why diff the OpenAPI document in CI?', options: ['Style', 'To catch unintended breaking changes', 'To speed builds', 'It is required by HTTP'], answer: 1, explanation: 'The document is the contract.' },
    ],
  },
  {
    id: 'dn2-8',
    slug: 'production-api-engineering-operations',
    title: 'Production API Engineering II: Logging, Health Checks, Resilience and Integration Tests',
    summary: 'Operate what you build: structured logging with correlation, liveness and readiness health checks, caching, resilient outbound calls, and integration tests with WebApplicationFactory and Testcontainers.',
    minutes: 55,
    prerequisite: 'Lesson: Production API Engineering I.',
    outcomes: [
      'Write structured logs with message templates, correlation ids and appropriate levels, without leaking secrets.',
      'Expose separate liveness and readiness health checks and explain how platforms use them.',
      'Add caching and resilience (timeouts, retries with backoff, circuit breakers) to outbound calls.',
      'Test the whole API in memory with WebApplicationFactory and against a real database with Testcontainers.',
    ],
    introduction:
      'Once your API runs somewhere you cannot attach a debugger, you see it only through what it tells you. Can you find every log line for one failing request? Will the platform stop sending traffic to an instance whose database connection died? Does one slow dependency take the whole service down with it? This lesson covers the operational half of production readiness. Month 5 extends the same ideas to metrics, distributed tracing and cloud monitoring.',
    keyTerms: [
      { term: 'Structured logging', meaning: 'Logs as events with named fields (OrderId=42) rather than free text, so they can be queried.' },
      { term: 'Correlation id', meaning: 'An id attached to every log line for one request, so its whole story can be found.' },
      { term: 'Liveness check', meaning: '"Is the process alive?" — failing means restart it.' },
      { term: 'Readiness check', meaning: '"Can it serve traffic now?" — failing means stop routing requests to it.' },
      { term: 'Circuit breaker', meaning: 'Stops calling a failing dependency for a while so it can recover and callers fail fast.' },
      { term: 'Testcontainers', meaning: 'A library that starts real dependencies (PostgreSQL, Redis) in Docker containers for tests.' },
    ],
    sections: [
      {
        title: 'Structured logging done right',
        paragraphs: [
          'Use ILogger with message templates, not string interpolation: logger.LogInformation("Booking {BookingId} confirmed for {CustomerId}", id, customerId) records BookingId and CustomerId as fields that a log platform can filter on. Interpolation bakes them into an unsearchable string and allocates even when the level is disabled.',
          'Choose levels deliberately: Information for significant business events, Warning for recoverable surprises, Error for failures that need attention, Debug/Trace for diagnostics off by default. Never log passwords, tokens, full card numbers or personal data you do not need; logs are copied widely and kept for a long time.',
        ],
        code: `public sealed class BookingService(IBookingStore store, ILogger<BookingService> logger)
{
    public async Task<BookingResult> BookAsync(BookRequest request, CancellationToken ct)
    {
        using var scope = logger.BeginScope(new Dictionary<string, object> { ["RoomId"] = request.RoomId });
        var result = await store.TryBookAsync(request, ct);
        if (result is BookingResult.Conflict)
            logger.LogWarning("Booking conflict for room {RoomId} from {Start} to {End}", request.RoomId, request.Start, request.End);
        else
            logger.LogInformation("Booking {BookingId} confirmed", ((BookingResult.Booked)result).Id);
        return result;
    }
}`,
        label: 'Message templates and scopes',
      },
      {
        title: 'Health checks: liveness versus readiness',
        paragraphs: [
          'Platforms such as Kubernetes and Azure Container Apps probe your service. A liveness endpoint should check only that the process can respond — if it checks the database, a database outage makes the platform restart every instance in a loop, turning a dependency problem into a total outage. A readiness endpoint checks dependencies the instance needs to serve requests (database, cache); failing it takes the instance out of rotation until it recovers.',
        ],
        code: `builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddNpgSql(builder.Configuration.GetConnectionString("Bookings")!, tags: ["ready"]);

app.MapHealthChecks("/health/live", new() { Predicate = c => c.Tags.Contains("live") }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") }).AllowAnonymous();`,
        label: 'Two probes with two purposes',
      },
      {
        title: 'Resilience for outbound calls',
        paragraphs: [
          'Every call to another service needs a timeout — the default HttpClient timeout of 100 seconds will exhaust your server under a slow dependency. Retries help with transient failures but must use exponential backoff with jitter, must be limited, and must only be applied to idempotent operations. A circuit breaker stops hammering a dependency that is clearly down. Microsoft.Extensions.Http.Resilience bundles these strategies; AddStandardResilienceHandler gives a sensible default pipeline. You implemented the core of this by hand in Week 2.',
          'Caching reduces load and latency: in-memory caching for per-instance data, distributed caching (Redis) when instances must share, and output caching for whole responses. Every cache needs an expiry and an invalidation story.',
        ],
        code: `builder.Services.AddHttpClient<IExchangeRates, HttpExchangeRates>(c => c.BaseAddress = new Uri("https://rates.example.com"))
    .AddStandardResilienceHandler(o =>
    {
        o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(2);
        o.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(10);
        o.Retry.MaxRetryAttempts = 3;                       // exponential backoff with jitter by default
    });`,
        label: 'Timeouts, retries and a circuit breaker in one call',
      },
      {
        title: 'Integration tests with WebApplicationFactory',
        paragraphs: [
          'Unit tests check pieces; integration tests check that the pieces work together through real HTTP: routing, model binding, validation, authorization, serialization, the error handler. WebApplicationFactory<Program> starts your whole application in memory and gives you an HttpClient. Override services for test doubles where needed, and assert on status codes, headers and bodies exactly as a client would see them.',
        ],
        code: `public sealed class TaskApiTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Creating_a_task_returns_201_with_location_and_etag()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/tasks", new { title = "Ship it", dueOn = "2030-01-01" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.NotNull(response.Headers.ETag);
    }
}`,
        label: 'The real pipeline, in memory',
      },
      {
        title: 'A real database in tests with Testcontainers',
        paragraphs: [
          'EF Core\'s in-memory provider does not behave like PostgreSQL — no constraints, no transactions, different SQL semantics — so tests against it can pass while production fails. Testcontainers starts a real PostgreSQL in Docker for the test run, applies your migrations, and throws it away afterwards. This is how you prove, for example, that two simultaneous bookings for the last slot cannot both succeed — the concurrency challenge your notes recommend for this month.',
        ],
        code: `public sealed class PostgresFixture : IAsyncLifetime
{
    public PostgreSqlContainer Container { get; } = new PostgreSqlBuilder().WithImage("postgres:17").Build();
    public Task InitializeAsync() => Container.StartAsync();
    public Task DisposeAsync() => Container.DisposeAsync().AsTask();
}

[Fact]
public async Task Two_concurrent_bookings_for_the_same_slot_cannot_both_succeed()
{
    var results = await Task.WhenAll(BookAsync(roomId: 1, slot), BookAsync(roomId: 1, slot));
    Assert.Single(results, r => r == HttpStatusCode.Created);
    Assert.Single(results, r => r == HttpStatusCode.Conflict);
}`,
        label: 'Proving the concurrency guarantee',
      },
    ],
    table: {
      headers: ['Concern', 'Tool', 'Common mistake'],
      rows: [
        ['Diagnosing requests', 'ILogger templates + correlation id', 'Interpolated strings; logging secrets'],
        ['Platform probes', 'Separate /health/live and /health/ready', 'Liveness checking the database'],
        ['Slow dependencies', 'Timeouts, backoff retries, circuit breaker', 'Retrying non-idempotent calls'],
        ['Whole-API behaviour', 'WebApplicationFactory', 'Only unit-testing handlers'],
        ['Database behaviour', 'Testcontainers (real PostgreSQL)', 'Trusting the EF in-memory provider'],
      ],
    },
    exercise: {
      scenario: 'During an incident, the exchange-rate provider becomes slow. All API instances fill up with waiting requests, their /health endpoint (which also queries the rate provider) fails, the platform restarts every instance repeatedly, and engineers cannot find which requests failed because logs are plain strings without ids.',
      task: 'Describe the changes that would have contained this incident.',
      answer: 'Give the outbound HttpClient a short attempt timeout and total timeout with limited backoff retries and a circuit breaker (AddStandardResilienceHandler), and cache rates so a provider outage degrades gracefully. Split health checks: liveness checks only the process; readiness checks the database, not an optional third party — so instances are not restarted for a dependency problem. Use structured logging with message templates, a correlation/trace id on every line and in problem responses, so failing requests can be queried.',
      evidence: 'Timeouts and circuit breaking, correct liveness/readiness separation, and structured correlated logs.',
    },
    misconceptions: [
      'Retries always improve reliability. Unbounded or immediate retries amplify outages; use backoff, jitter and limits.',
      'One /health endpoint is enough. Liveness and readiness answer different questions.',
      'The EF Core in-memory provider is a good database for tests. It lacks real constraints and transactions.',
      'Logging more is always better. Log meaningful events with fields, never secrets.',
    ],
    sources: [R.logging, R.healthChecks, R.resilience, R.outputCaching, R.integrationTests, R.testcontainers],
    labs: [],
    questions: [
      { prompt: 'Which health check should fail when the instance cannot serve traffic and should be taken out of rotation? (one word)', answer: 'readiness', accept: ['ready'] },
      { prompt: 'Which ASP.NET Core test class starts the whole app in memory? Give the class name without the <Program> part.', answer: 'WebApplicationFactory' },
    ],
    quiz: [
      { question: 'Why use logger.LogInformation("Order {Id}", id) instead of $"Order {id}"?', options: ['Shorter', 'Id becomes a queryable field and no allocation when disabled', 'Required by C#', 'It encrypts the log'], answer: 1, explanation: 'Message templates produce structured fields.' },
      { question: 'A liveness probe that checks the database causes what during a database outage?', options: ['Nothing', 'Every instance is restarted in a loop', 'Faster recovery', 'Better logs'], answer: 1, explanation: 'Restarts do not fix a dependency outage.' },
      { question: 'Which operations are safe to retry automatically?', options: ['All', 'Idempotent ones', 'Only POST', 'None'], answer: 1, explanation: 'Retrying non-idempotent calls can duplicate effects.' },
      { question: 'Why use Testcontainers?', options: ['To mock HTTP', 'To test against a real database engine', 'To deploy to Azure', 'To speed up unit tests'], answer: 1, explanation: 'Real constraints, SQL and transactions.' },
    ],
  },
];
