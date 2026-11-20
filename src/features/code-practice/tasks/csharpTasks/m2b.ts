import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 2 · APIs & Data';

const TEST_TIME = `public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}
`;

/** Month 2, weeks 7–8 tasks (lessons dn2-5 … dn2-8). */
export const CSHARP_MONTH2_B_TASKS: CodeTask[] = [
  {
    id: 'cs-2-09',
    title: 'A Password Hasher',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement PasswordHasher. Hash(password) uses PBKDF2-SHA256 with a fresh 16-byte random salt, Iterations rounds and a 32-byte key, and ' +
      'returns "v1.<iterations>.<base64 salt>.<base64 hash>". Verify(password, stored) recomputes with the stored salt and iteration count and ' +
      'compares in constant time; malformed stored strings return false (never throw). NeedsRehash(stored) is true when the stored iteration ' +
      'count is below the current Iterations — so you can raise the cost later and upgrade hashes as users log in. (The tests use a small ' +
      'iteration count to stay fast; production uses hundreds of thousands.)',
    starterCode: `using System.Security.Cryptography;

public sealed class PasswordHasher(int iterations)
{
    public int Iterations { get; } = iterations;

    public string Hash(string password) => throw new NotImplementedException();

    public bool Verify(string password, string stored) => throw new NotImplementedException();

    public bool NeedsRehash(string stored) => throw new NotImplementedException();
}
`,
    hints: [
      'RandomNumberGenerator.GetBytes(16) for the salt; Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, 32) for the key.',
      'Parse with Split(\'.\'): exactly 4 parts, parts[0] == "v1", int.TryParse the iterations; wrap Convert.FromBase64String in try/catch for FormatException.',
      'CryptographicOperations.FixedTimeEquals(actual, expected) — never ==/SequenceEqual for secrets.',
    ],
    solution: `using System.Security.Cryptography;

public sealed class PasswordHasher(int iterations)
{
    public int Iterations { get; } = iterations;

    public string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, 32);
        return $"v1.{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public bool Verify(string password, string stored)
    {
        if (!TryParse(stored, out int rounds, out byte[] salt, out byte[] expected)) return false;
        byte[] actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, rounds, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    public bool NeedsRehash(string stored) => !TryParse(stored, out int rounds, out _, out _) || rounds < Iterations;

    private static bool TryParse(string stored, out int rounds, out byte[] salt, out byte[] hash)
    {
        rounds = 0; salt = []; hash = [];
        string[] parts = stored.Split('.');
        if (parts.Length != 4 || parts[0] != "v1" || !int.TryParse(parts[1], out rounds) || rounds < 1) return false;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            hash = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException) { return false; }
        return salt.Length > 0 && hash.Length > 0;
    }
}
`,
    testCode: csTests(`
var hasher = new PasswordHasher(1_000);
string? storedCache = null;
string Stored() => storedCache ??= hasher.Hash("correct horse battery staple");
Check("format", () => Stored().Split('.').Length == 4 && Stored().StartsWith("v1.1000."), true);
Check("right password", () => hasher.Verify("correct horse battery staple", Stored()), true);
Check("wrong password", () => hasher.Verify("correct horse battery stapler", Stored()), false);
Check("salted: same password, different hashes", () => hasher.Hash("pw") != hasher.Hash("pw"), true);
Check("32-byte key", () => Convert.FromBase64String(Stored().Split('.')[3]).Length, 32);
Check("known vector", () => hasher.Verify("pw", "v1.1000.c2FsdHNhbHRzYWx0c2FsdA==." + Convert.ToBase64String(System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2("pw"u8, "saltsaltsaltsalt"u8, 1000, System.Security.Cryptography.HashAlgorithmName.SHA256, 32))), true);
Check("malformed is false", () => hasher.Verify("pw", "not-a-hash"), false);
Check("bad base64 is false", () => hasher.Verify("pw", "v1.1000.@@@.###"), false);
Check("needs rehash when cost raised", () => new PasswordHasher(2_000).NeedsRehash(Stored()), true);
Check("no rehash at same cost", () => hasher.NeedsRehash(Stored()), false);
`),
  },
  {
    id: 'cs-2-10',
    title: 'Validate a JWT (HS256)',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement JwtValidator.Validate(token) for HMAC-SHA256 tokens, to understand exactly what a JWT library protects you from. Return ' +
      'JwtResult.Valid(claims) only if: the token has three base64url parts; the header\'s "alg" is exactly "HS256" (reject "none" and anything ' +
      'else); the signature equals HMAC-SHA256(key, "<header>.<payload>") compared in constant time; "iss" equals the expected issuer; "aud" ' +
      'equals the expected audience; and now is before "exp" and not before "nbf" (if present), allowing ClockSkew either way. Otherwise ' +
      'return JwtResult.Invalid with a short reason. Never throw for bad input. Claims is the payload as a JsonObject.',
    starterCode: `using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;

public abstract record JwtResult
{
    public sealed record Valid(JsonObject Claims) : JwtResult;
    public sealed record Invalid(string Reason) : JwtResult;
}

public sealed class JwtValidator(byte[] key, string issuer, string audience, TimeProvider time)
{
    public static readonly TimeSpan ClockSkew = TimeSpan.FromMinutes(1);

    public JwtResult Validate(string? token) => throw new NotImplementedException();
}
`,
    hints: [
      'Base64url → bytes: replace - with + and _ with /, then pad with = to a multiple of 4 before Convert.FromBase64String (or use System.Buffers.Text.Base64Url.DecodeFromChars).',
      'Parse header and payload with JsonNode.Parse inside try/catch; check (string?)header["alg"] == "HS256".',
      'exp and nbf are seconds since the Unix epoch: DateTimeOffset.FromUnixTimeSeconds((long)payload["exp"]!).',
      'Compute HMACSHA256.HashData(key, Encoding.ASCII.GetBytes(parts[0] + "." + parts[1])) and compare with CryptographicOperations.FixedTimeEquals.',
    ],
    solution: `using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;

public abstract record JwtResult
{
    public sealed record Valid(JsonObject Claims) : JwtResult;
    public sealed record Invalid(string Reason) : JwtResult;
}

public sealed class JwtValidator(byte[] key, string issuer, string audience, TimeProvider time)
{
    public static readonly TimeSpan ClockSkew = TimeSpan.FromMinutes(1);

    public JwtResult Validate(string? token)
    {
        string[] parts = (token ?? "").Split('.');
        if (parts.Length != 3) return Fail("malformed");
        if (!TryJson(parts[0], out var header) || !TryJson(parts[1], out var payload)) return Fail("malformed");
        if ((string?)header["alg"] != "HS256") return Fail("algorithm not allowed");

        byte[] expected = HMACSHA256.HashData(key, Encoding.ASCII.GetBytes(parts[0] + "." + parts[1]));
        if (!TryDecode(parts[2], out byte[] signature) || !CryptographicOperations.FixedTimeEquals(signature, expected))
            return Fail("bad signature");

        if ((string?)payload["iss"] != issuer) return Fail("wrong issuer");
        if ((string?)payload["aud"] != audience) return Fail("wrong audience");

        var now = time.GetUtcNow();
        if (!TryTime(payload, "exp", out var exp) || now >= exp + ClockSkew) return Fail("expired");
        if (payload["nbf"] is not null && (!TryTime(payload, "nbf", out var nbf) || now < nbf - ClockSkew)) return Fail("not yet valid");
        return new JwtResult.Valid(payload);
    }

    private static JwtResult Fail(string reason) => new JwtResult.Invalid(reason);

    private static bool TryDecode(string part, out byte[] bytes)
    {
        bytes = [];
        string b64 = part.Replace('-', '+').Replace('_', '/');
        b64 = b64.PadRight(b64.Length + (4 - b64.Length % 4) % 4, '=');
        try { bytes = Convert.FromBase64String(b64); return true; } catch (FormatException) { return false; }
    }

    private static bool TryJson(string part, out JsonObject json)
    {
        json = [];
        if (!TryDecode(part, out byte[] bytes)) return false;
        try { json = JsonNode.Parse(bytes) as JsonObject ?? []; return json.Count > 0; } catch (Exception) { return false; }
    }

    private static bool TryTime(JsonObject payload, string name, out DateTimeOffset value)
    {
        value = default;
        try { value = DateTimeOffset.FromUnixTimeSeconds((long)payload[name]!); return true; } catch (Exception) { return false; }
    }
}
`,
    testCode: TEST_TIME + `public static class Tokens
{
    public static string B64(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    public static string Make(byte[] key, string headerJson, string payloadJson)
    {
        string head = B64(System.Text.Encoding.UTF8.GetBytes(headerJson)) + "." + B64(System.Text.Encoding.UTF8.GetBytes(payloadJson));
        return head + "." + B64(System.Security.Cryptography.HMACSHA256.HashData(key, System.Text.Encoding.ASCII.GetBytes(head)));
    }
}
` + csTests(`
byte[] key = System.Text.Encoding.UTF8.GetBytes("a-long-random-test-signing-key-0123456789");
var now = new DateTimeOffset(2026, 5, 1, 12, 0, 0, TimeSpan.Zero);
long t(int minutes) => now.AddMinutes(minutes).ToUnixTimeSeconds();
var v = new JwtValidator(key, "https://login.test", "tasks-api", new TestTime(now));
string Payload(string iss = "https://login.test", string aud = "tasks-api", int exp = 30, int? nbf = null) =>
    "{\\"sub\\":\\"u1\\",\\"iss\\":\\"" + iss + "\\",\\"aud\\":\\"" + aud + "\\",\\"exp\\":" + t(exp) + (nbf is null ? "" : ",\\"nbf\\":" + t(nbf.Value)) + "}";
string Good(string payload) => Tokens.Make(key, "{\\"alg\\":\\"HS256\\",\\"typ\\":\\"JWT\\"}", payload);
Check("valid token", () => v.Validate(Good(Payload())) is JwtResult.Valid ok ? (string?)ok.Claims["sub"] : "invalid", "u1");
Check("tampered payload", () => { var parts = Good(Payload()).Split('.'); parts[1] = Tokens.B64(System.Text.Encoding.UTF8.GetBytes(Payload().Replace("u1", "admin"))); return v.Validate(string.Join('.', parts)) is JwtResult.Invalid; }, true);
Check("wrong key", () => v.Validate(Tokens.Make(System.Text.Encoding.UTF8.GetBytes("another-key-entirely-0000000000000000"), "{\\"alg\\":\\"HS256\\"}", Payload())) is JwtResult.Invalid, true);
Check("alg none rejected", () => v.Validate(Tokens.B64("{\\"alg\\":\\"none\\"}"u8.ToArray()) + "." + Tokens.B64(System.Text.Encoding.UTF8.GetBytes(Payload())) + ".") is JwtResult.Invalid, true);
Check("other alg rejected", () => v.Validate(Tokens.Make(key, "{\\"alg\\":\\"HS512\\"}", Payload())) is JwtResult.Invalid, true);
Check("wrong issuer", () => v.Validate(Good(Payload(iss: "https://evil.test"))) is JwtResult.Invalid, true);
Check("wrong audience", () => v.Validate(Good(Payload(aud: "billing-api"))) is JwtResult.Invalid, true);
Check("expired", () => v.Validate(Good(Payload(exp: -5))) is JwtResult.Invalid, true);
Check("within clock skew", () => v.Validate(Good(Payload(exp: 0))) is JwtResult.Valid, true);
Check("not yet valid", () => v.Validate(Good(Payload(nbf: 10))) is JwtResult.Invalid, true);
Check("nbf within skew", () => v.Validate(Good(Payload(nbf: 1))) is JwtResult.Valid, true);
Check("garbage", () => v.Validate("not.a.jwt") is JwtResult.Invalid, true);
Check("null", () => v.Validate(null) is JwtResult.Invalid, true);
`),
  },
  {
    id: 'cs-2-11',
    title: 'Authorization Policies, Deny by Default',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Authorizer.IsAllowed(user, policy) for a ClaimsPrincipal. An unauthenticated user is never allowed. Policies: "Authenticated" ' +
      '(any authenticated user), "Staff" (role "staff" or "admin"), "Admin" (role "admin"), "Premium" (claim "plan" equal to "premium", case-insensitive). ' +
      'Any other policy name is denied — deny by default, never allow an unknown policy. Then implement CanViewBooking(user, ownerId): the ' +
      'user\'s NameIdentifier claim equals ownerId, or the user satisfies "Staff".',
    starterCode: `using System.Security.Claims;

public static class Authorizer
{
    public static bool IsAllowed(ClaimsPrincipal user, string policy) => throw new NotImplementedException();

    public static bool CanViewBooking(ClaimsPrincipal user, string ownerId) => throw new NotImplementedException();
}
`,
    hints: [
      'user.Identity?.IsAuthenticated == true is the first check.',
      'user.IsInRole("staff") works when the identity was created with a role claim type; user.FindFirst("plan")?.Value reads a claim.',
      'A switch expression on the policy name with a final _ => false arm is deny-by-default.',
    ],
    solution: `using System.Security.Claims;

public static class Authorizer
{
    public static bool IsAllowed(ClaimsPrincipal user, string policy)
    {
        if (user.Identity?.IsAuthenticated != true) return false;
        return policy switch
        {
            "Authenticated" => true,
            "Staff" => user.IsInRole("staff") || user.IsInRole("admin"),
            "Admin" => user.IsInRole("admin"),
            "Premium" => string.Equals(user.FindFirst("plan")?.Value, "premium", StringComparison.OrdinalIgnoreCase),
            _ => false,
        };
    }

    public static bool CanViewBooking(ClaimsPrincipal user, string ownerId) =>
        user.Identity?.IsAuthenticated == true
        && (user.FindFirst(ClaimTypes.NameIdentifier)?.Value == ownerId || IsAllowed(user, "Staff"));
}
`,
    testCode: csTests(`
ClaimsPrincipal User(string id, params (string Type, string Value)[] claims)
{
    var all = claims.Select(c => new Claim(c.Type, c.Value)).Append(new Claim(ClaimTypes.NameIdentifier, id));
    return new ClaimsPrincipal(new ClaimsIdentity(all, authenticationType: "test"));
}
var anonymous = new ClaimsPrincipal(new ClaimsIdentity());
var ama = User("u1");
var staff = User("s1", (ClaimTypes.Role, "staff"));
var admin = User("a1", (ClaimTypes.Role, "admin"));
var premium = User("p1", ("plan", "Premium"));
Check("anonymous denied", () => Authorizer.IsAllowed(anonymous, "Authenticated"), false);
Check("authenticated", () => Authorizer.IsAllowed(ama, "Authenticated"), true);
Check("member is not staff", () => Authorizer.IsAllowed(ama, "Staff"), false);
Check("staff is staff", () => Authorizer.IsAllowed(staff, "Staff"), true);
Check("admin is staff", () => Authorizer.IsAllowed(admin, "Staff"), true);
Check("staff is not admin", () => Authorizer.IsAllowed(staff, "Admin"), false);
Check("premium claim", () => Authorizer.IsAllowed(premium, "Premium"), true);
Check("unknown policy denied", () => Authorizer.IsAllowed(admin, "Superuser"), false);
Check("owner can view", () => Authorizer.CanViewBooking(ama, "u1"), true);
Check("other user cannot", () => Authorizer.CanViewBooking(ama, "u2"), false);
Check("staff can view any", () => Authorizer.CanViewBooking(staff, "u2"), true);
Check("anonymous cannot", () => Authorizer.CanViewBooking(anonymous, ""), false);
`),
  },
  {
    id: 'cs-2-12',
    title: 'Fix the Broken Object Level Authorization',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'BookingEndpoints has three handlers that currently trust the client. Fix them. Get(user, id): 404 if missing or if the caller is neither ' +
      'the owner nor staff (do not reveal existence). Update(user, id, request): same access rule; only Notes and Seats may change (the request ' +
      'type now only has those fields — map them, never copy the whole object); Seats must be 1–10 (400 otherwise). Mine(user): the caller\'s ' +
      'own bookings, taking the owner id from the authenticated principal — the old version took a customerId query parameter. Handlers ' +
      'return ApiResponse(Status, Body).',
    starterCode: `using System.Security.Claims;

public sealed class Booking(int id, string ownerId, string room, int seats, string notes)
{
    public int Id { get; } = id;
    public string OwnerId { get; } = ownerId;
    public string Room { get; } = room;
    public int Seats { get; set; } = seats;
    public string Notes { get; set; } = notes;
}

public sealed record UpdateBookingRequest(string? Notes, int? Seats);

public sealed record BookingDto(int Id, string Room, int Seats, string Notes);

public sealed record ApiResponse(int Status, object? Body = null);

public sealed class BookingEndpoints(Dictionary<int, Booking> bookings)
{
    public ApiResponse Get(ClaimsPrincipal user, int id) => throw new NotImplementedException();

    public ApiResponse Update(ClaimsPrincipal user, int id, UpdateBookingRequest request) => throw new NotImplementedException();

    public ApiResponse Mine(ClaimsPrincipal user) => throw new NotImplementedException();
}
`,
    hints: [
      'Write one private helper Booking? Accessible(user, id) that returns the booking only if it exists and the caller is the owner (NameIdentifier claim) or in role staff.',
      'Return 404 from Get and Update when the helper returns null.',
      'Validate before mutating: if request.Seats is not null and outside 1–10, return 400 and change nothing. Then apply only the non-null fields.',
      'Mine: filter bookings by OwnerId == user.FindFirst(ClaimTypes.NameIdentifier)?.Value and map each to BookingDto.',
    ],
    solution: `using System.Security.Claims;

public sealed class Booking(int id, string ownerId, string room, int seats, string notes)
{
    public int Id { get; } = id;
    public string OwnerId { get; } = ownerId;
    public string Room { get; } = room;
    public int Seats { get; set; } = seats;
    public string Notes { get; set; } = notes;
}

public sealed record UpdateBookingRequest(string? Notes, int? Seats);

public sealed record BookingDto(int Id, string Room, int Seats, string Notes);

public sealed record ApiResponse(int Status, object? Body = null);

public sealed class BookingEndpoints(Dictionary<int, Booking> bookings)
{
    public ApiResponse Get(ClaimsPrincipal user, int id) =>
        Accessible(user, id) is { } booking ? new ApiResponse(200, ToDto(booking)) : new ApiResponse(404);

    public ApiResponse Update(ClaimsPrincipal user, int id, UpdateBookingRequest request)
    {
        if (Accessible(user, id) is not { } booking) return new ApiResponse(404);
        if (request.Seats is < 1 or > 10) return new ApiResponse(400, "Seats must be between 1 and 10.");
        if (request.Notes is not null) booking.Notes = request.Notes;
        if (request.Seats is int seats) booking.Seats = seats;
        return new ApiResponse(200, ToDto(booking));
    }

    public ApiResponse Mine(ClaimsPrincipal user)
    {
        string? me = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (user.Identity?.IsAuthenticated != true || me is null) return new ApiResponse(401);
        return new ApiResponse(200, bookings.Values.Where(b => b.OwnerId == me).OrderBy(b => b.Id).Select(ToDto).ToList());
    }

    private Booking? Accessible(ClaimsPrincipal user, int id)
    {
        if (user.Identity?.IsAuthenticated != true || !bookings.TryGetValue(id, out var booking)) return null;
        bool owner = booking.OwnerId == user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return owner || user.IsInRole("staff") ? booking : null;
    }

    private static BookingDto ToDto(Booking b) => new(b.Id, b.Room, b.Seats, b.Notes);
}
`,
    testCode: csTests(`
ClaimsPrincipal User(string id, string? role = null)
{
    var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, id) };
    if (role is not null) claims.Add(new Claim(ClaimTypes.Role, role));
    return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
}
BookingEndpoints Api() => new(new Dictionary<int, Booking>
{
    [1] = new(1, "ama", "Accra", 2, ""),
    [2] = new(2, "kofi", "Kumasi", 4, "projector"),
    [3] = new(3, "ama", "Tamale", 1, ""),
});
Check("owner reads", () => Api().Get(User("ama"), 1).Status, 200);
Check("other user gets 404", () => Api().Get(User("ama"), 2).Status, 404);
Check("staff reads any", () => Api().Get(User("sam", "staff"), 2).Status, 200);
Check("missing is 404", () => Api().Get(User("ama"), 99).Status, 404);
Check("other user cannot update", () => { var api = Api(); var r = api.Update(User("ama"), 2, new("mine now", 10)); return (r.Status, ((BookingDto)api.Get(User("kofi"), 2).Body!).Seats); }, (404, 4));
Check("owner updates seats", () => ((BookingDto)Api().Update(User("ama"), 1, new(null, 5)).Body!).Seats, 5);
Check("partial update keeps notes", () => ((BookingDto)Api().Update(User("kofi"), 2, new(null, 3)).Body!).Notes, "projector");
Check("seats validated", () => { var api = Api(); var r = api.Update(User("ama"), 1, new("x", 11)); return (r.Status, ((BookingDto)api.Get(User("ama"), 1).Body!).Notes); }, (400, ""));
CheckSeq("mine uses the principal", () => ((List<BookingDto>)Api().Mine(User("ama")).Body!).Select(b => b.Id), [1, 3]);
Check("dto hides owner", () => typeof(BookingDto).GetProperty("OwnerId") is null, true);
`),
  },
  {
    id: 'cs-2-13',
    title: 'Complete Validation Errors',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement TaskValidator.Validate(request) returning a Dictionary<string, List<string>> with EVERY problem, keyed by property name ' +
      '(empty when valid). Rules: Title required (not blank) and at most 120 characters; DueOn, if given, not before today (UTC, from the ' +
      'injected TimeProvider); Priority one of "low", "normal", "high" (case-insensitive); Tags at most 5, each 1–20 characters, no duplicates ' +
      '(case-insensitive). Use these exact messages: "Title is required.", "Title must be at most 120 characters.", "Due date cannot be in the ' +
      'past.", "Priority must be low, normal or high.", "At most 5 tags are allowed.", "Tags must be 1-20 characters.", "Tags must be unique."',
    starterCode: `public sealed record CreateTaskRequest(string? Title, DateOnly? DueOn, string? Priority, List<string>? Tags);

public sealed class TaskValidator(TimeProvider time)
{
    public Dictionary<string, List<string>> Validate(CreateTaskRequest request) => throw new NotImplementedException();
}
`,
    hints: [
      'Write a local Add(field, message) that creates the list on first use: (errors.TryGetValue(field, out var l) ? l : errors[field] = []).Add(message).',
      'Do not return early: every rule runs, so the client sees all problems at once.',
      'Each tag rule adds its message at most once, even if several tags break it.',
    ],
    solution: `public sealed record CreateTaskRequest(string? Title, DateOnly? DueOn, string? Priority, List<string>? Tags);

public sealed class TaskValidator(TimeProvider time)
{
    private static readonly string[] Priorities = ["low", "normal", "high"];

    public Dictionary<string, List<string>> Validate(CreateTaskRequest request)
    {
        var errors = new Dictionary<string, List<string>>();
        void Add(string field, string message) => (errors.TryGetValue(field, out var list) ? list : errors[field] = []).Add(message);

        if (string.IsNullOrWhiteSpace(request.Title)) Add("Title", "Title is required.");
        else if (request.Title.Length > 120) Add("Title", "Title must be at most 120 characters.");

        var today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);
        if (request.DueOn is { } due && due < today) Add("DueOn", "Due date cannot be in the past.");

        if (request.Priority is null || !Priorities.Contains(request.Priority, StringComparer.OrdinalIgnoreCase))
            Add("Priority", "Priority must be low, normal or high.");

        var tags = request.Tags ?? [];
        if (tags.Count > 5) Add("Tags", "At most 5 tags are allowed.");
        if (tags.Any(t => t is null || t.Length is < 1 or > 20)) Add("Tags", "Tags must be 1-20 characters.");
        if (tags.Where(t => t is not null).Distinct(StringComparer.OrdinalIgnoreCase).Count() != tags.Count(t => t is not null)) Add("Tags", "Tags must be unique.");
        return errors;
    }
}
`,
    testCode: TEST_TIME + csTests(`
var v = new TaskValidator(new TestTime(new DateTimeOffset(2026, 6, 10, 23, 0, 0, TimeSpan.Zero)));
var ok = new CreateTaskRequest("Ship release", new DateOnly(2026, 6, 10), "High", ["work"]);
Check("valid", () => v.Validate(ok).Count, 0);
CheckSeq("blank title", () => v.Validate(ok with { Title = "  " })["Title"], ["Title is required."]);
CheckSeq("long title", () => v.Validate(ok with { Title = new string('x', 121) })["Title"], ["Title must be at most 120 characters."]);
Check("120 is fine", () => v.Validate(ok with { Title = new string('x', 120) }).Count, 0);
CheckSeq("past due", () => v.Validate(ok with { DueOn = new DateOnly(2026, 6, 9) })["DueOn"], ["Due date cannot be in the past."]);
Check("no due date is fine", () => v.Validate(ok with { DueOn = null }).Count, 0);
CheckSeq("bad priority", () => v.Validate(ok with { Priority = "urgent" })["Priority"], ["Priority must be low, normal or high."]);
CheckSeq("tag problems", () => v.Validate(ok with { Tags = ["a", "A", "", "b", "c", "d"] })["Tags"], ["At most 5 tags are allowed.", "Tags must be 1-20 characters.", "Tags must be unique."]);
CheckSeq("all fields at once", () => v.Validate(new CreateTaskRequest(null, new DateOnly(2020, 1, 1), null, null)).Keys.OrderBy(k => k), ["DueOn", "Priority", "Title"]);
`),
  },
  {
    id: 'cs-2-14',
    title: 'Idempotency Keys for POST',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement IdempotencyStore.Execute(key, requestBody, action). The first call with a key runs action and stores its StoredResponse ' +
      'together with a SHA-256 fingerprint of requestBody. A later call with the same key and identical body returns the stored response ' +
      'WITHOUT running action again. The same key with a different body returns new StoredResponse(422, "Idempotency key reused with a ' +
      'different request.") and does not run action. Entries expire after Retention (24 hours, by the injected TimeProvider); after that the ' +
      'key is treated as new. A missing or blank key simply runs the action without storing anything. If action throws, nothing is stored.',
    starterCode: `using System.Security.Cryptography;
using System.Text;

public sealed record StoredResponse(int Status, string Body);

public sealed class IdempotencyStore(TimeProvider time)
{
    public static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    public StoredResponse Execute(string? key, string requestBody, Func<StoredResponse> action) => throw new NotImplementedException();
}
`,
    hints: [
      'Fingerprint: Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requestBody))).',
      'Store (string Fingerprint, StoredResponse Response, DateTimeOffset StoredAt) in a Dictionary<string, ...>.',
      'Check expiry first: if now - storedAt >= Retention, remove the entry and treat the key as new.',
    ],
    solution: `using System.Security.Cryptography;
using System.Text;

public sealed record StoredResponse(int Status, string Body);

public sealed class IdempotencyStore(TimeProvider time)
{
    public static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly Dictionary<string, (string Fingerprint, StoredResponse Response, DateTimeOffset StoredAt)> _entries = new(StringComparer.Ordinal);

    public StoredResponse Execute(string? key, string requestBody, Func<StoredResponse> action)
    {
        if (string.IsNullOrWhiteSpace(key)) return action();
        string fingerprint = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requestBody)));
        var now = time.GetUtcNow();

        if (_entries.TryGetValue(key, out var entry))
        {
            if (now - entry.StoredAt >= Retention) _entries.Remove(key);
            else if (entry.Fingerprint == fingerprint) return entry.Response;
            else return new StoredResponse(422, "Idempotency key reused with a different request.");
        }

        var response = action();
        _entries[key] = (fingerprint, response, now);
        return response;
    }
}
`,
    testCode: TEST_TIME + csTests(`
var clock = new TestTime(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
int created = 0;
StoredResponse Create() { created++; return new StoredResponse(201, "order-" + created); }
var store = new IdempotencyStore(clock);
Check("first call runs", () => store.Execute("k1", "{\\"qty\\":1}", Create), new StoredResponse(201, "order-1"));
Check("repeat replays", () => store.Execute("k1", "{\\"qty\\":1}", Create), new StoredResponse(201, "order-1"));
Check("action ran once", () => created, 1);
Check("different body is 422", () => store.Execute("k1", "{\\"qty\\":2}", Create).Status, 422);
Check("still ran once", () => created, 1);
Check("other key runs", () => store.Execute("k2", "{\\"qty\\":1}", Create).Body, "order-2");
Check("no key always runs", () => { store.Execute(null, "x", Create); store.Execute("  ", "x", Create); return created; }, 4);
Check("expires after retention", () => { clock.Now += IdempotencyStore.Retention; return store.Execute("k1", "{\\"qty\\":1}", Create).Body; }, "order-5");
Check("failure not stored", () =>
{
    var s = new IdempotencyStore(clock);
    try { s.Execute("k9", "b", () => throw new IOException("db down")); } catch (IOException) { }
    return s.Execute("k9", "b", () => new StoredResponse(201, "retried")).Body;
}, "retried");
`),
  },
  {
    id: 'cs-2-15',
    title: 'Cursor Pagination',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Paginator.Page(items, cursor, pageSize). Items are ordered newest first by CreatedAt, then by Id descending as a tie-breaker. ' +
      'The cursor is opaque to clients: encode the last item\'s (CreatedAt ticks, Id) as base64url text. Page returns up to pageSize items ' +
      'strictly after the cursor position and a NextCursor (null on the last page). pageSize is clamped to 1–50. An invalid cursor throws ' +
      'ArgumentException. Unlike offset paging, inserting new items at the top must not shift later pages.',
    starterCode: `public sealed record Item(int Id, DateTime CreatedAt, string Title);

public sealed record Page(List<Item> Items, string? NextCursor);

public static class Paginator
{
    public const int MaxPageSize = 50;

    public static Page Page(IEnumerable<Item> items, string? cursor, int pageSize) => throw new NotImplementedException();
}
`,
    hints: [
      'Order with OrderByDescending(i => i.CreatedAt).ThenByDescending(i => i.Id).',
      'Cursor text: $"{createdAt.Ticks}:{id}" → UTF-8 bytes → base64url (replace + with -, / with _, trim =). Decode in reverse inside try/catch.',
      'An item comes after the cursor when its CreatedAt is earlier, or equal with a smaller Id.',
      'Take pageSize + 1 to know whether another page exists without counting everything.',
    ],
    solution: `public sealed record Item(int Id, DateTime CreatedAt, string Title);

public sealed record Page(List<Item> Items, string? NextCursor);

public static class Paginator
{
    public const int MaxPageSize = 50;

    public static Page Page(IEnumerable<Item> items, string? cursor, int pageSize)
    {
        int size = Math.Clamp(pageSize, 1, MaxPageSize);
        var ordered = items.OrderByDescending(i => i.CreatedAt).ThenByDescending(i => i.Id).AsEnumerable();
        if (cursor is not null)
        {
            var (ticks, id) = Decode(cursor);
            ordered = ordered.Where(i => i.CreatedAt.Ticks < ticks || (i.CreatedAt.Ticks == ticks && i.Id < id));
        }
        var window = ordered.Take(size + 1).ToList();
        bool more = window.Count > size;
        var page = window.Take(size).ToList();
        return new Page(page, more ? Encode(page[^1]) : null);
    }

    private static string Encode(Item last) =>
        Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{last.CreatedAt.Ticks}:{last.Id}")).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static (long Ticks, int Id) Decode(string cursor)
    {
        try
        {
            string b64 = cursor.Replace('-', '+').Replace('_', '/');
            b64 = b64.PadRight(b64.Length + (4 - b64.Length % 4) % 4, '=');
            string[] parts = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(b64)).Split(':');
            return (long.Parse(parts[0]), int.Parse(parts[1]));
        }
        catch (Exception e) when (e is FormatException or IndexOutOfRangeException or OverflowException)
        {
            throw new ArgumentException("Invalid cursor.", nameof(cursor), e);
        }
    }
}
`,
    testCode: csTests(`
var t0 = new DateTime(2026, 1, 1, 9, 0, 0);
var items = Enumerable.Range(1, 12).Select(i => new Item(i, t0.AddMinutes(i / 2), "T" + i)).ToList();   // pairs share timestamps
List<int> Ids(Page p) => p.Items.Select(i => i.Id).ToList();
CheckSeq("first page newest first", () => Ids(Paginator.Page(items, null, 5)), [12, 11, 10, 9, 8]);
CheckSeq("second page", () => Ids(Paginator.Page(items, Paginator.Page(items, null, 5).NextCursor, 5)), [7, 6, 5, 4, 3]);
Check("last page has no cursor", () => { var p1 = Paginator.Page(items, null, 5); var p2 = Paginator.Page(items, p1.NextCursor, 5); var p3 = Paginator.Page(items, p2.NextCursor, 5); return (Ids(p3).Count, p3.NextCursor); }, (2, (string?)null));
Check("exact fit has no cursor", () => Paginator.Page(items, null, 12).NextCursor, (string?)null);
Check("cursor is opaque base64url", () => Paginator.Page(items, null, 5).NextCursor!.All(c => char.IsLetterOrDigit(c) || c is '-' or '_'), true);
CheckSeq("stable when new items arrive", () =>
{
    string? next = Paginator.Page(items, null, 5).NextCursor;
    var withNew = items.Append(new Item(99, t0.AddHours(5), "new")).ToList();
    return Ids(Paginator.Page(withNew, next, 5));
}, [7, 6, 5, 4, 3]);
Check("page size clamped", () => Paginator.Page(Enumerable.Range(1, 200).Select(i => new Item(i, t0.AddMinutes(i), "")).ToList(), null, 1000).Items.Count, 50);
Throws<ArgumentException>("bad cursor", () => Paginator.Page(items, "%%%", 5));
`),
  },
  {
    id: 'cs-2-16',
    title: 'A Circuit Breaker',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement CircuitBreaker(failureThreshold, breakDuration, time). Closed: calls pass through; consecutive failures are counted and a ' +
      'success resets the count; reaching failureThreshold opens the circuit. Open: calls fail immediately with BrokenCircuitException without ' +
      'running the operation, until breakDuration has passed. Then it is HalfOpen: exactly one trial call is let through — success closes the ' +
      'circuit, failure opens it again for another breakDuration. Exceptions from the operation are rethrown to the caller. State reports the ' +
      'current state (evaluating the time).',
    starterCode: `public enum CircuitState { Closed, Open, HalfOpen }

public sealed class BrokenCircuitException() : Exception("The circuit is open; the call was not attempted.");

public sealed class CircuitBreaker(int failureThreshold, TimeSpan breakDuration, TimeProvider time)
{
    public CircuitState State => throw new NotImplementedException();

    public Task<T> ExecuteAsync<T>(Func<Task<T>> operation) => throw new NotImplementedException();
}
`,
    hints: [
      'Keep _failures, _openedAt (DateTimeOffset?) and a flag for "a half-open trial is in progress".',
      'State: if _openedAt is null → Closed; if now - _openedAt < breakDuration → Open; otherwise HalfOpen.',
      'In ExecuteAsync: Open → throw BrokenCircuitException. HalfOpen with a trial already running → throw too. Otherwise run, then on success reset everything; on failure increment, and open (set _openedAt = now) when in HalfOpen or when _failures reaches the threshold; rethrow.',
    ],
    solution: `public enum CircuitState { Closed, Open, HalfOpen }

public sealed class BrokenCircuitException() : Exception("The circuit is open; the call was not attempted.");

public sealed class CircuitBreaker(int failureThreshold, TimeSpan breakDuration, TimeProvider time)
{
    private int _failures;
    private DateTimeOffset? _openedAt;
    private bool _trialRunning;

    public CircuitState State =>
        _openedAt is null ? CircuitState.Closed
        : time.GetUtcNow() - _openedAt.Value < breakDuration ? CircuitState.Open
        : CircuitState.HalfOpen;

    public async Task<T> ExecuteAsync<T>(Func<Task<T>> operation)
    {
        var state = State;
        if (state == CircuitState.Open || (state == CircuitState.HalfOpen && _trialRunning)) throw new BrokenCircuitException();
        bool trial = state == CircuitState.HalfOpen;
        if (trial) _trialRunning = true;
        try
        {
            T result = await operation();
            _failures = 0;
            _openedAt = null;
            return result;
        }
        catch (Exception) when (Record(trial))
        {
            throw;
        }
        finally
        {
            if (trial) _trialRunning = false;
        }
    }

    private bool Record(bool trial)
    {
        _failures++;
        if (trial || _failures >= failureThreshold) _openedAt = time.GetUtcNow();
        return true;
    }
}
`,
    testCode: TEST_TIME + csTests(`
var clock = new TestTime(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
var brk = TimeSpan.FromSeconds(30);
int calls = 0;
Task<int> Ok() { calls++; return Task.FromResult(1); }
Task<int> Fail() { calls++; throw new IOException("down"); }
async Task Try(CircuitBreaker cb, Func<Task<int>> op) { try { await cb.ExecuteAsync(op); } catch (Exception) { } }
var cb = new CircuitBreaker(3, brk, clock);
await CheckAsync("closed passes through", () => cb.ExecuteAsync(Ok), 1);
await ThrowsAsync<IOException>("failures rethrown", () => cb.ExecuteAsync(Fail));
await CheckAsync("success resets count", async () => { await cb.ExecuteAsync(Ok); await Try(cb, Fail); await Try(cb, Fail); return cb.State; }, CircuitState.Closed);
await CheckAsync("opens at threshold", async () => { await Try(cb, Fail); return cb.State; }, CircuitState.Open);
await ThrowsAsync<BrokenCircuitException>("open fails fast", () => cb.ExecuteAsync(Ok));
Check("operation not run while open", () => { int before = calls; try { cb.ExecuteAsync(Ok).GetAwaiter().GetResult(); } catch (BrokenCircuitException) { } return calls - before; }, 0);
Check("half-open after break", () => { clock.Now += brk; return cb.State; }, CircuitState.HalfOpen);
await CheckAsync("failed trial reopens", async () => { await Try(cb, Fail); return cb.State; }, CircuitState.Open);
await CheckAsync("successful trial closes", async () => { clock.Now += brk; await cb.ExecuteAsync(Ok); return cb.State; }, CircuitState.Closed);
await CheckAsync("only one trial at a time", async () =>
{
    var c = new CircuitBreaker(1, brk, clock);
    await Try(c, Fail);
    clock.Now += brk;
    var gate = new TaskCompletionSource<int>();
    var trial = c.ExecuteAsync(() => gate.Task);
    bool secondRejected;
    try { await c.ExecuteAsync(Ok); secondRejected = false; } catch (BrokenCircuitException) { secondRejected = true; }
    gate.SetResult(7);
    return (secondRejected, await trial, c.State);
}, (true, 7, CircuitState.Closed));
`),
  },
];
