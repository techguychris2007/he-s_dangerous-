import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 7 Assignment: Secure the Platform

The booking API works — and is wide open. Secure it end to end. The hidden tests behave like an attacker:
they forge tokens, change ids, replay old tokens, brute-force passwords, and probe for which emails exist.

## Given (reviewed, correct — use them, do not modify)

- \`Http.cs\` — the request/response model from Week 5.
- \`Jwt.cs\` — \`Jwt.Create(...)\` and \`Jwt.Validate(...)\` for HS256 tokens (signature, algorithm allow-list,
  issuer, audience and lifetime are all checked).
- \`Passwords.cs\` — PBKDF2 \`Hash\` / \`Verify\` with constant-time comparison.

## Implement \`SecureApi.cs\`

**Accounts**
- \`POST /auth/register\` \`{ email, password }\` → 201. Passwords need at least 12 characters and must not be in
  \`CommonPasswords\`; otherwise 400 problem. Duplicate email → 409. Store only the hash. Everyone registers as
  role \`customer\`; staff accounts are created with \`AddStaff\`.
- \`POST /auth/login\` \`{ email, password }\` → 200 \`{ "token": "..." }\` (15-minute token with \`sub\` = user id and
  \`role\`). Any failure → **401 with exactly the same body** whether the email exists or not (no enumeration).
- **Lockout:** 5 consecutive failures lock the account for 15 minutes (even the right password fails); a
  success resets the counter.

**Bookings** (all require \`Authorization: Bearer <token>\`)
- \`GET /bookings\` → the caller's own bookings only.
- \`GET /bookings/{id}\` → owner or staff; anyone else gets **404** (do not reveal existence).
- \`PATCH /bookings/{id}\` \`{ notes }\` → owner only; only \`notes\` may change. A body containing any other field
  (such as \`ownerId\`) → 400.
- \`GET /admin/report\` → role \`staff\` only: 403 for other authenticated users.

**Everywhere**
- Missing or invalid token on a protected endpoint → 401 with \`WWW-Authenticate: Bearer\`.
- Every response carries \`X-Content-Type-Options: nosniff\`; auth responses also \`Cache-Control: no-store\`.
- Booking JSON never contains password hashes or other users' data.
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

const JWT = `using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;

public static class Jwt
{
    public static string Create(byte[] key, string issuer, string audience, string subject, string role, DateTimeOffset expires)
    {
        string header = B64(Encoding.UTF8.GetBytes("""{"alg":"HS256","typ":"JWT"}"""));
        var claims = new JsonObject { ["sub"] = subject, ["role"] = role, ["iss"] = issuer, ["aud"] = audience, ["exp"] = expires.ToUnixTimeSeconds() };
        string payload = B64(Encoding.UTF8.GetBytes(claims.ToJsonString()));
        string signature = B64(HMACSHA256.HashData(key, Encoding.ASCII.GetBytes(header + "." + payload)));
        return header + "." + payload + "." + signature;
    }

    /// <summary>The verified claims, or null if the token must not be trusted.</summary>
    public static JsonObject? Validate(string? token, byte[] key, string issuer, string audience, DateTimeOffset now)
    {
        try
        {
            string[] parts = (token ?? "").Split('.');
            if (parts.Length != 3) return null;
            var header = JsonNode.Parse(Decode(parts[0])) as JsonObject;
            if ((string?)header?["alg"] != "HS256") return null;
            byte[] expected = HMACSHA256.HashData(key, Encoding.ASCII.GetBytes(parts[0] + "." + parts[1]));
            if (!CryptographicOperations.FixedTimeEquals(Decode(parts[2]), expected)) return null;
            var claims = JsonNode.Parse(Decode(parts[1])) as JsonObject;
            if (claims is null || (string?)claims["iss"] != issuer || (string?)claims["aud"] != audience) return null;
            if (now >= DateTimeOffset.FromUnixTimeSeconds((long)claims["exp"]!)) return null;
            return claims;
        }
        catch (Exception) { return null; }
    }

    private static string B64(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Decode(string part)
    {
        string b64 = part.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(b64.PadRight(b64.Length + (4 - b64.Length % 4) % 4, '='));
    }
}
`;

const PASSWORDS = `using System.Security.Cryptography;

public static class Passwords
{
    private const int Iterations = 1_000;   // kept low so the browser tests are fast; use 600,000+ in production

    public static string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public static bool Verify(string password, string stored)
    {
        string[] parts = stored.Split('.');
        byte[] salt = Convert.FromBase64String(parts[0]);
        byte[] expected = Convert.FromBase64String(parts[1]);
        byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
`;

const API_STARTER = `using System.Text.Json;
using System.Text.Json.Nodes;

public sealed class SecureApi(byte[] signingKey, TimeProvider time)
{
    public const string Issuer = "https://bookings.test";
    public const string Audience = "bookings-api";
    public static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
        { "password1234", "123456789012", "qwertyuiop12", "letmein12345", "iloveyou1234" };

    /// <summary>Creates a staff account directly (staff never self-register).</summary>
    public void AddStaff(string email, string password) => throw new NotImplementedException();

    /// <summary>Test/demo helper: adds a booking owned by the account with this email. Returns its id.</summary>
    public int SeedBooking(string ownerEmail, string room, string notes) => throw new NotImplementedException();

    /// <summary>The stored password record for an email, so tests can confirm no plain text is kept.</summary>
    public string? StoredPasswordFor(string email) => throw new NotImplementedException();

    public ApiResponse Handle(ApiRequest request) => throw new NotImplementedException();
}
`;

const API_SOLUTION = `using System.Text.Json;
using System.Text.Json.Nodes;

public sealed class SecureApi(byte[] signingKey, TimeProvider time)
{
    public const string Issuer = "https://bookings.test";
    public const string Audience = "bookings-api";
    public static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
        { "password1234", "123456789012", "qwertyuiop12", "letmein12345", "iloveyou1234" };

    private const int MaxFailures = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(15);

    private sealed class User
    {
        public required string Id { get; init; }
        public required string Email { get; init; }
        public required string PasswordHash { get; init; }
        public required string Role { get; init; }
        public int Failures { get; set; }
        public DateTimeOffset? LockedUntil { get; set; }
    }

    private sealed class Booking
    {
        public required int Id { get; init; }
        public required string OwnerId { get; init; }
        public required string Room { get; init; }
        public string Notes { get; set; } = "";
    }

    private readonly Dictionary<string, User> _usersByEmail = new(StringComparer.OrdinalIgnoreCase);
    private readonly SortedDictionary<int, Booking> _bookings = [];
    private int _nextUser = 1, _nextBooking = 1;

    public void AddStaff(string email, string password) => AddUser(email, password, "staff");

    public int SeedBooking(string ownerEmail, string room, string notes)
    {
        var booking = new Booking { Id = _nextBooking++, OwnerId = _usersByEmail[ownerEmail].Id, Room = room, Notes = notes };
        _bookings[booking.Id] = booking;
        return booking.Id;
    }

    public string? StoredPasswordFor(string email) => _usersByEmail.GetValueOrDefault(email)?.PasswordHash;

    public ApiResponse Handle(ApiRequest request)
    {
        string path = request.Path.Split('?')[0].TrimEnd('/');
        string method = request.Method.ToUpperInvariant();
        string[] seg = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (seg is ["auth", "register"] && method == "POST") return NoStore(Register(request));
        if (seg is ["auth", "login"] && method == "POST") return NoStore(Login(request));

        bool known = seg is ["bookings"] or ["bookings", _] or ["admin", "report"];
        if (!known) return Problem(404, "Not Found");

        var caller = Authenticate(request);
        if (caller is null)
        {
            var unauthorized = Problem(401, "Unauthorized");
            unauthorized.Headers["WWW-Authenticate"] = "Bearer";
            return unauthorized;
        }

        return (seg, method) switch
        {
            (["bookings"], "GET") => Json(200, _bookings.Values.Where(b => b.OwnerId == caller.Id).Select(Dto).ToList()),
            (["bookings", var id], "GET") => GetBooking(caller, id),
            (["bookings", var id], "PATCH") => PatchBooking(caller, id, request),
            (["admin", "report"], "GET") => caller.Role == "staff"
                ? Json(200, new { bookings = _bookings.Count, users = _usersByEmail.Count })
                : Problem(403, "Forbidden"),
            _ => Problem(405, "Method Not Allowed"),
        };
    }

    private ApiResponse Register(ApiRequest request)
    {
        var body = ReadObject(request.Body);
        string? email = (string?)body?["email"], password = (string?)body?["password"];
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return Problem(400, "A valid email is required.");
        if (password is null || password.Length < 12 || CommonPasswords.Contains(password)) return Problem(400, "Choose a password of at least 12 characters that is not a common password.");
        if (_usersByEmail.ContainsKey(email)) return Problem(409, "An account with that email already exists.");
        AddUser(email, password, "customer");
        return Json(201, new { email });
    }

    private ApiResponse Login(ApiRequest request)
    {
        var body = ReadObject(request.Body);
        string email = (string?)body?["email"] ?? "", password = (string?)body?["password"] ?? "";
        var now = time.GetUtcNow();
        if (!_usersByEmail.TryGetValue(email, out var user)) return Problem(401, "Invalid email or password.");
        if (user.LockedUntil is { } until && now < until) return Problem(401, "Invalid email or password.");
        if (!Passwords.Verify(password, user.PasswordHash))
        {
            user.Failures++;
            if (user.Failures >= MaxFailures) { user.LockedUntil = now + LockoutDuration; user.Failures = 0; }
            return Problem(401, "Invalid email or password.");
        }
        user.Failures = 0;
        user.LockedUntil = null;
        string token = Jwt.Create(signingKey, Issuer, Audience, user.Id, user.Role, now + TokenLifetime);
        return Json(200, new { token });
    }

    private ApiResponse GetBooking(User caller, string id) =>
        Visible(caller, id) is { } booking ? Json(200, Dto(booking)) : Problem(404, "Not Found");

    private ApiResponse PatchBooking(User caller, string id, ApiRequest request)
    {
        if (!int.TryParse(id, out int bookingId) || !_bookings.TryGetValue(bookingId, out var booking) || booking.OwnerId != caller.Id)
            return Problem(404, "Not Found");
        var body = ReadObject(request.Body);
        if (body is null || body.Count == 0 || body.Any(p => p.Key != "notes") || body["notes"] is not JsonValue notes || !notes.TryGetValue(out string? text))
            return Problem(400, "Only notes can be changed.");
        booking.Notes = text;
        return Json(200, Dto(booking));
    }

    private Booking? Visible(User caller, string id) =>
        int.TryParse(id, out int bookingId) && _bookings.TryGetValue(bookingId, out var b) && (b.OwnerId == caller.Id || caller.Role == "staff") ? b : null;

    private User? Authenticate(ApiRequest request)
    {
        string? header = request.Header("Authorization");
        if (header is null || !header.StartsWith("Bearer ", StringComparison.Ordinal)) return null;
        var claims = Jwt.Validate(header["Bearer ".Length..], signingKey, Issuer, Audience, time.GetUtcNow());
        string? sub = (string?)claims?["sub"];
        // The role comes from our own store, not from the token, so a demoted user loses access immediately.
        return sub is null ? null : _usersByEmail.Values.FirstOrDefault(u => u.Id == sub);
    }

    private void AddUser(string email, string password, string role)
    {
        var user = new User { Id = $"u{_nextUser++}", Email = email, PasswordHash = Passwords.Hash(password), Role = role };
        _usersByEmail[email] = user;
    }

    private static object Dto(Booking b) => new { id = b.Id, room = b.Room, notes = b.Notes };

    private static JsonObject? ReadObject(string? body)
    {
        try { return JsonNode.Parse(body ?? "") as JsonObject; } catch (JsonException) { return null; }
    }

    private static Dictionary<string, string> BaseHeaders(string contentType) =>
        new(StringComparer.OrdinalIgnoreCase) { ["Content-Type"] = contentType, ["X-Content-Type-Options"] = "nosniff" };

    private static ApiResponse Json(int status, object body) =>
        new(status, BaseHeaders("application/json"), JsonSerializer.Serialize(body, new JsonSerializerOptions(JsonSerializerDefaults.Web)));

    private static ApiResponse Problem(int status, string title) =>
        new(status, BaseHeaders("application/problem+json"), new JsonObject { ["title"] = title, ["status"] = status }.ToJsonString());

    private static ApiResponse NoStore(ApiResponse response)
    {
        response.Headers["Cache-Control"] = "no-store";
        return response;
    }
}
`;

const PROGRAM = `var api = new SecureApi(System.Text.Encoding.UTF8.GetBytes("demo-signing-key-that-is-long-enough-123"), TimeProvider.System);
Console.WriteLine(api.Handle(new ApiRequest("POST", "/auth/register", Body: """{ "email": "ama@example.com", "password": "a long passphrase" }""")).Status);
var login = api.Handle(new ApiRequest("POST", "/auth/login", Body: """{ "email": "ama@example.com", "password": "a long passphrase" }"""));
Console.WriteLine($"{login.Status} {login.Body}");
`;

const TESTS = `public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}
` + csTests(`
byte[] key = System.Text.Encoding.UTF8.GetBytes("a-long-random-test-signing-key-0123456789");
var start = new DateTimeOffset(2026, 7, 1, 9, 0, 0, TimeSpan.Zero);
const string pw = "correct horse battery";
ApiResponse Post(SecureApi api, string path, string body) => api.Handle(new ApiRequest("POST", path, Body: body));
string Login(SecureApi api, string email, string password = pw) =>
    (string)System.Text.Json.Nodes.JsonNode.Parse(Post(api, "/auth/login", "{\\"email\\":\\"" + email + "\\",\\"password\\":\\"" + password + "\\"}").Body!)!["token"]!;
ApiResponse Call(SecureApi api, string method, string path, string? token, string? body = null) =>
    api.Handle(new ApiRequest(method, path, token is null ? null : new Dictionary<string, string> { ["Authorization"] = "Bearer " + token }, body));
(SecureApi Api, TestTime Time, int AmaBooking, int KofiBooking) Setup()
{
    var t = new TestTime(start);
    var api = new SecureApi(key, t);
    Post(api, "/auth/register", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"" + pw + "\\"}");
    Post(api, "/auth/register", "{\\"email\\":\\"kofi@example.com\\",\\"password\\":\\"" + pw + "\\"}");
    api.AddStaff("sam@example.com", pw);
    return (api, t, api.SeedBooking("ama@example.com", "Accra", "projector"), api.SeedBooking("kofi@example.com", "Kumasi", ""));
}

Check("register 201", () => Post(new SecureApi(key, new TestTime(start)), "/auth/register", "{\\"email\\":\\"esi@example.com\\",\\"password\\":\\"" + pw + "\\"}").Status, 201);
Check("short password 400", () => Post(Setup().Api, "/auth/register", "{\\"email\\":\\"x@example.com\\",\\"password\\":\\"short\\"}").Status, 400);
Check("common password 400", () => Post(Setup().Api, "/auth/register", "{\\"email\\":\\"x@example.com\\",\\"password\\":\\"Password1234\\"}").Status, 400);
Check("duplicate email 409", () => Post(Setup().Api, "/auth/register", "{\\"email\\":\\"AMA@example.com\\",\\"password\\":\\"" + pw + "\\"}").Status, 409);
Expect("password not stored in plain text", () => { var s = Setup().Api.StoredPasswordFor("ama@example.com"); return s is not null && !s.Contains(pw) && s.Length > 20; }, "the stored password record must be a hash");
Check("login returns token", () => Login(Setup().Api, "ama@example.com").Split('.').Length, 3);
Check("auth responses not cached", () => Post(Setup().Api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"" + pw + "\\"}").Header("Cache-Control"), "no-store");
Check("no account enumeration", () =>
{
    var api = Setup().Api;
    var unknown = Post(api, "/auth/login", "{\\"email\\":\\"nobody@example.com\\",\\"password\\":\\"whatever-123456\\"}");
    var wrong = Post(api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"whatever-123456\\"}");
    return unknown.Status == 401 && wrong.Status == 401 && unknown.Body == wrong.Body;
}, true);
Check("lockout after five failures", () =>
{
    var api = Setup().Api;
    for (int i = 0; i < 5; i++) Post(api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"wrong-password!\\"}");
    return Post(api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"" + pw + "\\"}").Status;
}, 401);
Check("lockout expires", () =>
{
    var s = Setup();
    for (int i = 0; i < 5; i++) Post(s.Api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"wrong-password!\\"}");
    s.Time.Now = start.AddMinutes(16);
    return Post(s.Api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"" + pw + "\\"}").Status;
}, 200);
Check("success resets failures", () =>
{
    var api = Setup().Api;
    for (int i = 0; i < 4; i++) Post(api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"wrong-password!\\"}");
    Login(api, "ama@example.com");
    for (int i = 0; i < 4; i++) Post(api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"wrong-password!\\"}");
    return Post(api, "/auth/login", "{\\"email\\":\\"ama@example.com\\",\\"password\\":\\"" + pw + "\\"}").Status;
}, 200);
Check("anonymous 401 with challenge", () => { var r = Call(Setup().Api, "GET", "/bookings", null); return (r.Status, r.Header("WWW-Authenticate")); }, (401, "Bearer"));
Check("forged signature 401", () => { var s = Setup(); var t = Login(s.Api, "ama@example.com"); return Call(s.Api, "GET", "/bookings", t[..^4] + "AAAA").Status; }, 401);
Check("alg none 401", () => { var s = Setup(); var parts = Login(s.Api, "ama@example.com").Split('.'); string none = Convert.ToBase64String("{\\"alg\\":\\"none\\"}"u8.ToArray()).TrimEnd('='); return Call(s.Api, "GET", "/bookings", none + "." + parts[1] + ".").Status; }, 401);
Check("token from another issuer 401", () => { var s = Setup(); return Call(s.Api, "GET", "/bookings", Jwt.Create(key, "https://evil.test", SecureApi.Audience, "u1", "staff", start.AddHours(1))).Status; }, 401);
Check("expired token 401", () => { var s = Setup(); var t = Login(s.Api, "ama@example.com"); s.Time.Now = start.AddMinutes(16); return Call(s.Api, "GET", "/bookings", t).Status; }, 401);
CheckSeq("list only own bookings", () => { var s = Setup(); var j = System.Text.Json.Nodes.JsonNode.Parse(Call(s.Api, "GET", "/bookings", Login(s.Api, "ama@example.com")).Body!)!.AsArray(); return j.Select(b => (int)b!["id"]!); }, [1]);
Check("BOLA: other user's booking is 404", () => { var s = Setup(); return Call(s.Api, "GET", "/bookings/" + s.KofiBooking, Login(s.Api, "ama@example.com")).Status; }, 404);
Check("owner can read", () => { var s = Setup(); return Call(s.Api, "GET", "/bookings/" + s.AmaBooking, Login(s.Api, "ama@example.com")).Status; }, 200);
Check("staff can read any", () => { var s = Setup(); return Call(s.Api, "GET", "/bookings/" + s.KofiBooking, Login(s.Api, "sam@example.com")).Status; }, 200);
Check("PATCH other user's booking 404", () => { var s = Setup(); return Call(s.Api, "PATCH", "/bookings/" + s.KofiBooking, Login(s.Api, "ama@example.com"), "{\\"notes\\":\\"mine\\"}").Status; }, 404);
Check("PATCH notes", () => { var s = Setup(); var r = Call(s.Api, "PATCH", "/bookings/" + s.AmaBooking, Login(s.Api, "ama@example.com"), "{\\"notes\\":\\"two screens\\"}"); return (r.Status, (string?)System.Text.Json.Nodes.JsonNode.Parse(r.Body!)!["notes"]); }, (200, "two screens"));
Check("mass assignment rejected", () => { var s = Setup(); return Call(s.Api, "PATCH", "/bookings/" + s.AmaBooking, Login(s.Api, "ama@example.com"), "{\\"notes\\":\\"x\\",\\"ownerId\\":\\"u2\\"}").Status; }, 400);
Check("admin report forbidden for customers", () => { var s = Setup(); return Call(s.Api, "GET", "/admin/report", Login(s.Api, "ama@example.com")).Status; }, 403);
Check("admin report for staff", () => { var s = Setup(); return Call(s.Api, "GET", "/admin/report", Login(s.Api, "sam@example.com")).Status; }, 200);
Check("tampered role claim is useless", () =>
{
    var s = Setup();
    var parts = Login(s.Api, "ama@example.com").Split('.');
    string payload = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(parts[1].Replace('-', '+').Replace('_', '/').PadRight(parts[1].Length + (4 - parts[1].Length % 4) % 4, '='))).Replace("customer", "staff");
    string forged = parts[0] + "." + Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(payload)).TrimEnd('=').Replace('+', '-').Replace('/', '_') + "." + parts[2];
    return Call(s.Api, "GET", "/admin/report", forged).Status;
}, 401);
Expect("nosniff on every response", () => { var s = Setup(); return new[] { Call(s.Api, "GET", "/bookings", null), Call(s.Api, "GET", "/nowhere", null), Post(s.Api, "/auth/login", "{}") }.All(r => r.Header("X-Content-Type-Options") == "nosniff"); }, "every response needs X-Content-Type-Options: nosniff");
Expect("no hashes in booking json", () => { var s = Setup(); var body = Call(s.Api, "GET", "/bookings/" + s.AmaBooking, Login(s.Api, "sam@example.com")).Body ?? ""; return !body.Contains(s.Api.StoredPasswordFor("ama@example.com")!) && !body.Contains("password", StringComparison.OrdinalIgnoreCase); }, "booking responses must not include credentials");
`);

const task: ProjectTask = {
  id: 'se-cs-m2-003',
  title: 'Week 7: Secure the Platform',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 2 · ASP.NET Core & API Engineering',
  tags: ['authentication', 'JWT', 'authorization', 'BOLA', 'lockout', 'OWASP'],
  prompt:
    'Secure a booking API against a hostile client: registration with a password policy and hashed storage; login that issues short-lived ' +
    'JWTs, never reveals which emails exist, and locks accounts after five failures; bearer authentication that rejects forged, "alg none", ' +
    'tampered, foreign and expired tokens; object-level authorization (no reading or editing other people\'s bookings); protection against mass ' +
    'assignment; staff-only reporting (401 versus 403); and security headers. The hidden tests attack every one of these.',
  hints: [
    'Route first, then authenticate: for every protected path, parse "Authorization: Bearer <token>", call Jwt.Validate, and look the user up by the token\'s sub. If any step fails, return 401 with WWW-Authenticate: Bearer.',
    'Read the role from your own user record, not from the token — then even a perfectly signed old token cannot keep a demoted user\'s privileges.',
    'For login, return the identical 401 response for "no such email", "wrong password" and "locked" — compare the bodies in your head.',
    'For PATCH, parse the body as a JsonObject and reject it unless its only key is "notes"; load the booking and check the owner BEFORE looking at the body, so outsiders always get 404.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('Http.cs', HTTP, { editable: false }),
    pf('Jwt.cs', JWT, { editable: false }),
    pf('Passwords.cs', PASSWORDS, { editable: false }),
    pf('SecureApi.cs', API_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('Http.cs', HTTP, { editable: false }),
    pf('Jwt.cs', JWT, { editable: false }),
    pf('Passwords.cs', PASSWORDS, { editable: false }),
    pf('SecureApi.cs', API_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Secure API', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
