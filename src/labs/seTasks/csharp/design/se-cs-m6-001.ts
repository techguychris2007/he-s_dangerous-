import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 21 Assignment: Design a URL Shortener

Design it on paper, then build its core and prove the design holds. Two deliverables:

1. **\`DESIGN.md\`** — the design document a reviewer would read before any code.
2. **\`Shortener.cs\`** — the service core, graded against a simulated link store, id allocator and analytics sink
   (\`Infrastructure.cs\`, given) that count every read, write and batch your design causes.

## The problem

\`sho.rt\` turns long URLs into short codes. Expected scale: **100 million new links a day**, **10 redirects per link**,
links kept for **10 years**, about **500 bytes per link**. Redirects must be fast and almost always available; creation
can be a little slower. Clicks are counted for analytics.

## \`Shortener.cs\` (contracts in \`Contracts.cs\`, given)

**CreateAsync(request)**, in this order:
1. **Rate limit** per \`ClientId\`: a token bucket holding up to \`CreateBurst\` tokens, refilling at \`CreatesPerMinute\`.
   No token → \`RateLimited(retryAfter)\`, the time until the next token.
2. **Validate the target**: an absolute \`http\`/\`https\` URL of at most 2048 characters that does not point at
   \`OwnDomain\` or a subdomain of it (a link to a short link is a redirect loop) → otherwise \`Invalid(reason)\`.
   \`ExpiresIn\` must be positive when given.
3. **Custom alias** (when given): 4–30 characters of letters, digits and \`-\`, not in \`ShortenerOptions.Reserved\`
   (case-insensitive) → otherwise \`Invalid\`; already in the store → \`AliasTaken\`.
4. **Generated code**: base62 (\`0-9a-zA-Z\`) of the next id. Ids come from \`IdBlockAllocator\` in blocks of
   \`IdBlockSize\` — one allocator call per block, not per link. If a code is already taken (by a custom alias), move on
   to the next id.
5. Store with \`TryInsertAsync\` (the store's unique constraint is the final word) and return \`Created(link)\`.

**ResolveAsync(code)**:
- A code that is not 1–30 characters of letters, digits and \`-\` is \`NotFound\` **without touching the store**.
- **Cache-aside** over an LRU of at most \`CacheCapacity\` entries: links are cached for \`CacheTtl\`, *unknown* codes for
  \`NegativeTtl\` (so scans for random codes do not hammer the store). Concurrent misses for one code share **one**
  store read. A failed read is not cached: its exception reaches the caller and the next call tries again.
- An expired link is \`Gone\` (410) — even if it is cached. Otherwise \`Redirect(target, 302)\`: a 302, so every click
  comes back to be counted and expiry works.
- Count the click **in memory**; never write to the store or the sink on the redirect path.

**FlushClicksAsync()** writes every pending count to \`ClickSink\` as **one batch** and starts afresh. If the sink
fails, the counts are kept for the next flush (and the exception is rethrown). Nothing to flush → no batch.

## \`DESIGN.md\`

Sections (as \`##\` headings), each a real paragraph or more: **Requirements** (functional, non-functional, non-goals),
**Estimates** (write and read QPS, peak, storage over 10 years, cache size — with numbers and units), **API**
(create and redirect, with status codes), **Data model** (the link record and partition key), **Architecture** (the
components a request passes through), **Trade-offs** (at least: 301 vs 302, how ids are generated, consistency for
aliases vs redirects), and **Risks** (what could go wrong and how you would notice). The grader checks that each section
exists and says something substantial; your reviewer judges the rest.
`;

const CONTRACTS = `// Given: the shapes the service and the tests share.
public sealed record Link(string Code, string Target, string? Owner, DateTimeOffset CreatedAt, DateTimeOffset? ExpiresAt);

public sealed record CreateRequest(string Target, string? CustomAlias = null, TimeSpan? ExpiresIn = null, string ClientId = "anonymous");

public abstract record CreateResult
{
    public sealed record Created(Link Link) : CreateResult;
    public sealed record Invalid(string Reason) : CreateResult;
    public sealed record AliasTaken(string Alias) : CreateResult;
    public sealed record RateLimited(TimeSpan RetryAfter) : CreateResult;
}

public abstract record Resolution
{
    public sealed record Redirect(string Target, int StatusCode) : Resolution;
    public sealed record NotFound() : Resolution;
    public sealed record Gone() : Resolution;
}

public sealed class ShortenerOptions
{
    public string OwnDomain { get; init; } = "sho.rt";
    public int IdBlockSize { get; init; } = 1000;
    public int CacheCapacity { get; init; } = 10_000;
    public TimeSpan CacheTtl { get; init; } = TimeSpan.FromHours(1);
    public TimeSpan NegativeTtl { get; init; } = TimeSpan.FromMinutes(1);
    public int CreateBurst { get; init; } = 10;
    public double CreatesPerMinute { get; init; } = 60;

    public static readonly string[] Reserved = ["api", "admin", "login", "health", "static", "about"];
}
`;

const INFRASTRUCTURE = `// Given: simulated dependencies that count what your design costs them.
public sealed class ManualClock
{
    public DateTimeOffset Now { get; private set; } = DateTimeOffset.Parse("2026-11-08T09:00:00Z");
    public void Advance(TimeSpan by) => Now += by;
}

/// <summary>The partitioned link table. Every call is a network round trip.</summary>
public sealed class LinkStore
{
    private readonly Dictionary<string, Link> _links = new(StringComparer.Ordinal);

    public int Reads { get; private set; }
    public int Writes { get; private set; }
    public int Count => _links.Count;
    /// <summary>The next N reads time out.</summary>
    public int FailReads { get; set; }

    public async Task<Link?> FindAsync(string code)
    {
        Reads++;
        await Task.Yield();
        if (FailReads > 0)
        {
            FailReads--;
            throw new TimeoutException("link store timed out");
        }
        return _links.GetValueOrDefault(code);
    }

    /// <summary>False when the code already exists (the unique constraint).</summary>
    public async Task<bool> TryInsertAsync(Link link)
    {
        Writes++;
        await Task.Yield();
        return _links.TryAdd(link.Code, link);
    }
}

/// <summary>The central counter: hands out blocks of ids [Start, EndExclusive).</summary>
public sealed class IdBlockAllocator
{
    private long _next = 1_000_000;
    public int Calls { get; private set; }

    public async Task<(long Start, long EndExclusive)> NextBlockAsync(int size)
    {
        Calls++;
        await Task.Yield();
        long start = _next;
        _next += size;
        return (start, _next);
    }
}

/// <summary>The analytics store: accepts click counts in batches.</summary>
public sealed class ClickSink
{
    public List<IReadOnlyDictionary<string, long>> Batches { get; } = [];
    public bool FailNext { get; set; }

    public async Task WriteBatchAsync(IReadOnlyDictionary<string, long> counts)
    {
        await Task.Yield();
        if (FailNext)
        {
            FailNext = false;
            throw new IOException("analytics store unavailable");
        }
        Batches.Add(new Dictionary<string, long>(counts));
    }

    public long Total(string code) => Batches.Sum(b => b.GetValueOrDefault(code));
}
`;

const PROGRAM = `// Run: a short demonstration with the reference design.
var store = new LinkStore();
var clicks = new ClickSink();
var clock = new ManualClock();
var shortener = new Shortener(store, new IdBlockAllocator(), clicks, clock, new ShortenerOptions());

var created = await shortener.CreateAsync(new CreateRequest("https://example.com/articles/system-design-in-practice"));
Console.WriteLine(created);
if (created is CreateResult.Created c)
{
    for (int i = 0; i < 5; i++) Console.WriteLine(await shortener.ResolveAsync(c.Link.Code));
    await shortener.FlushClicksAsync();
    Console.WriteLine($"store reads: {store.Reads}, clicks recorded: {clicks.Total(c.Link.Code)}");
}
Console.WriteLine(await shortener.CreateAsync(new CreateRequest("https://sho.rt/abc")));
Console.WriteLine(await shortener.ResolveAsync("no-such-code"));
`;

const STARTER = `public sealed class Shortener
{
    private readonly LinkStore _store;
    private readonly IdBlockAllocator _ids;
    private readonly ClickSink _clicks;
    private readonly ManualClock _clock;
    private readonly ShortenerOptions _options;

    public Shortener(LinkStore store, IdBlockAllocator ids, ClickSink clicks, ManualClock clock, ShortenerOptions options)
    {
        (_store, _ids, _clicks, _clock, _options) = (store, ids, clicks, clock, options);
    }

    /// <summary>How many codes (found or not found) are cached right now.</summary>
    public int CachedCount => 0;

    public Task<CreateResult> CreateAsync(CreateRequest request) => throw new NotImplementedException();

    public Task<Resolution> ResolveAsync(string code) => throw new NotImplementedException();

    public Task FlushClicksAsync() => throw new NotImplementedException();
}
`;

const SOLUTION = `public sealed class Shortener
{
    private const string Alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    private readonly LinkStore _store;
    private readonly IdBlockAllocator _ids;
    private readonly ClickSink _clicks;
    private readonly ManualClock _clock;
    private readonly ShortenerOptions _options;

    // Id block handed out by the allocator: [_nextId, _blockEnd)
    private long _nextId;
    private long _blockEnd;

    // Cache-aside: an LRU of found and not-found results, plus in-flight loads (single flight).
    private sealed record CacheEntry(string Code, Link? Link, DateTimeOffset ExpiresAt);
    private readonly Dictionary<string, LinkedListNode<CacheEntry>> _cache = new(StringComparer.Ordinal);
    private readonly LinkedList<CacheEntry> _recency = new();
    private readonly Dictionary<string, Task<Link?>> _inFlight = new(StringComparer.Ordinal);

    private readonly Dictionary<string, (double Tokens, DateTimeOffset At)> _buckets = new();
    private Dictionary<string, long> _pendingClicks = new(StringComparer.Ordinal);

    public Shortener(LinkStore store, IdBlockAllocator ids, ClickSink clicks, ManualClock clock, ShortenerOptions options)
    {
        (_store, _ids, _clicks, _clock, _options) = (store, ids, clicks, clock, options);
    }

    public int CachedCount => _cache.Count;

    // ------------------------------------------------------------------ create

    public async Task<CreateResult> CreateAsync(CreateRequest request)
    {
        if (!TryTakeToken(request.ClientId, out var retryAfter)) return new CreateResult.RateLimited(retryAfter);
        if (TargetProblem(request.Target) is { } problem) return new CreateResult.Invalid(problem);
        if (request.ExpiresIn is { } ttl && ttl <= TimeSpan.Zero) return new CreateResult.Invalid("ExpiresIn must be positive.");

        var now = _clock.Now;
        DateTimeOffset? expiresAt = request.ExpiresIn is { } d ? now + d : null;

        if (request.CustomAlias is { } alias)
        {
            if (AliasProblem(alias) is { } aliasProblem) return new CreateResult.Invalid(aliasProblem);
            var custom = new Link(alias, request.Target, request.ClientId, now, expiresAt);
            return await _store.TryInsertAsync(custom) ? new CreateResult.Created(custom) : new CreateResult.AliasTaken(alias);
        }

        while (true)
        {
            var link = new Link(Encode(await NextIdAsync()), request.Target, request.ClientId, now, expiresAt);
            if (await _store.TryInsertAsync(link)) return new CreateResult.Created(link);
            // The code collided with a custom alias: the unique constraint said no, so use the next id.
        }
    }

    private bool TryTakeToken(string client, out TimeSpan retryAfter)
    {
        var now = _clock.Now;
        var (tokens, at) = _buckets.TryGetValue(client, out var b) ? b : (_options.CreateBurst, now);
        tokens = Math.Min(_options.CreateBurst, tokens + (now - at).TotalSeconds * _options.CreatesPerMinute / 60);
        if (tokens >= 1)
        {
            _buckets[client] = (tokens - 1, now);
            retryAfter = TimeSpan.Zero;
            return true;
        }
        _buckets[client] = (tokens, now);
        retryAfter = TimeSpan.FromSeconds((1 - tokens) * 60 / _options.CreatesPerMinute);
        return false;
    }

    private string? TargetProblem(string target)
    {
        if (target.Length > 2048) return "The URL is longer than 2048 characters.";
        if (!Uri.TryCreate(target, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return "Only absolute http and https URLs can be shortened.";
        var host = uri.Host.ToLowerInvariant();
        var own = _options.OwnDomain.ToLowerInvariant();
        if (host == own || host.EndsWith("." + own)) return "Links to " + _options.OwnDomain + " would create a redirect loop.";
        return null;
    }

    private static bool IsCodeShaped(string code) =>
        code.Length is >= 1 and <= 30 && code.All(c => char.IsAsciiLetterOrDigit(c) || c == '-');

    private static string? AliasProblem(string alias)
    {
        if (alias.Length is < 4 or > 30 || !IsCodeShaped(alias)) return "An alias is 4–30 letters, digits or hyphens.";
        if (ShortenerOptions.Reserved.Contains(alias, StringComparer.OrdinalIgnoreCase)) return "'" + alias + "' is reserved.";
        return null;
    }

    private async Task<long> NextIdAsync()
    {
        if (_nextId >= _blockEnd) (_nextId, _blockEnd) = await _ids.NextBlockAsync(_options.IdBlockSize);
        return _nextId++;
    }

    private static string Encode(long value)
    {
        var chars = new Stack<char>();
        do
        {
            chars.Push(Alphabet[(int)(value % 62)]);
            value /= 62;
        } while (value > 0);
        return new string(chars.ToArray());
    }

    // ------------------------------------------------------------------ resolve

    public async Task<Resolution> ResolveAsync(string code)
    {
        if (!IsCodeShaped(code)) return new Resolution.NotFound();       // junk never reaches the store
        var link = await LookupAsync(code);
        if (link is null) return new Resolution.NotFound();
        if (link.ExpiresAt is { } expires && expires <= _clock.Now) return new Resolution.Gone();
        _pendingClicks[code] = _pendingClicks.GetValueOrDefault(code) + 1;  // counted in memory only
        return new Resolution.Redirect(link.Target, 302);
    }

    private Task<Link?> LookupAsync(string code)
    {
        if (TryGetCached(code, out var cached)) return Task.FromResult(cached);
        if (_inFlight.TryGetValue(code, out var pending)) return pending;
        var load = LoadAsync(code);
        if (!load.IsCompleted) _inFlight[code] = load;
        return load;
    }

    private async Task<Link?> LoadAsync(string code)
    {
        try
        {
            var link = await _store.FindAsync(code);
            Remember(code, link);
            return link;
        }
        finally
        {
            _inFlight.Remove(code);
        }
    }

    private bool TryGetCached(string code, out Link? link)
    {
        link = null;
        if (!_cache.TryGetValue(code, out var node)) return false;
        if (node.Value.ExpiresAt <= _clock.Now)
        {
            _recency.Remove(node);
            _cache.Remove(code);
            return false;
        }
        _recency.Remove(node);
        _recency.AddFirst(node);
        link = node.Value.Link;
        return true;
    }

    private void Remember(string code, Link? link)
    {
        if (_cache.TryGetValue(code, out var old))
        {
            _recency.Remove(old);
            _cache.Remove(code);
        }
        var ttl = link is null ? _options.NegativeTtl : _options.CacheTtl;
        _cache[code] = _recency.AddFirst(new CacheEntry(code, link, _clock.Now + ttl));
        if (_cache.Count > _options.CacheCapacity)
        {
            var oldest = _recency.Last!;
            _recency.RemoveLast();
            _cache.Remove(oldest.Value.Code);
        }
    }

    // ------------------------------------------------------------------ analytics

    public async Task FlushClicksAsync()
    {
        if (_pendingClicks.Count == 0) return;
        var batch = _pendingClicks;
        _pendingClicks = new(StringComparer.Ordinal);
        try
        {
            await _clicks.WriteBatchAsync(batch);
        }
        catch
        {
            // Keep the counts: merge them back so the next flush includes them.
            foreach (var (code, count) in batch) _pendingClicks[code] = _pendingClicks.GetValueOrDefault(code) + count;
            throw;
        }
    }
}
`;

const TESTS = csTests(`
(Shortener S, LinkStore Store, IdBlockAllocator Ids, ClickSink Clicks, ManualClock Clock) Make(ShortenerOptions? options = null)
{
    var store = new LinkStore();
    var ids = new IdBlockAllocator();
    var sink = new ClickSink();
    var clock = new ManualClock();
    return (new Shortener(store, ids, sink, clock, options ?? new ShortenerOptions { CreateBurst = 1_000_000 }), store, ids, sink, clock);
}
static string CodeOf(CreateResult r) => r is CreateResult.Created c ? c.Link.Code : "(" + r + ")";
const string Url = "https://example.com/a/very/long/path?with=query";

// ---- creating links
await CheckAsync("creates and stores a link", async () =>
{
    var t = Make();
    var r = await t.S.CreateAsync(new CreateRequest(Url));
    return r is CreateResult.Created c && c.Link.Target == Url && t.Store.Count == 1 && c.Link.Code.Length > 0;
}, true);
await CheckAsync("rejects targets that are not absolute http(s), too long, or loop back", async () =>
{
    var t = Make();
    string[] bad = ["ftp://example.com/file", "/relative/path", "not a url", "https://sho.rt/abc", "https://www.SHO.rt/x", "https://example.com/" + new string('a', 2100)];
    int invalid = 0;
    foreach (var target in bad) if (await t.S.CreateAsync(new CreateRequest(target)) is CreateResult.Invalid) invalid++;
    return invalid + "/" + bad.Length + ", stored " + t.Store.Count;
}, "6/6, stored 0");
await CheckAsync("rejects an expiry that is not in the future", async () => await Make().S.CreateAsync(new CreateRequest(Url, ExpiresIn: TimeSpan.Zero)) is CreateResult.Invalid, true);
await CheckAsync("asks the allocator once per block of ids", async () =>
{
    var t = Make(new ShortenerOptions { CreateBurst = 1_000_000, IdBlockSize = 1000 });
    for (int i = 0; i < 2500; i++) await t.S.CreateAsync(new CreateRequest(Url + "&n=" + i));
    return t.Ids.Calls;
}, 3);
await CheckAsync("generated codes are unique base62, starting from the allocator's ids", async () =>
{
    var t = Make();
    var codes = new List<string>();
    for (int i = 0; i < 300; i++) codes.Add(CodeOf(await t.S.CreateAsync(new CreateRequest(Url))));
    bool base62 = codes.All(c => c.All(char.IsAsciiLetterOrDigit));
    return codes[0] + "," + codes[1] + ":" + (codes.Distinct().Count() == 300) + ":" + base62;
}, "4c92,4c93:True:True");
await CheckAsync("skips a generated code that a custom alias already took", async () =>
{
    var t = Make();
    await t.S.CreateAsync(new CreateRequest("https://example.com/alias", CustomAlias: "4c92"));
    var generated = CodeOf(await t.S.CreateAsync(new CreateRequest(Url)));
    return generated + ":" + t.Store.Count;
}, "4c93:2");

// ---- custom aliases
await CheckAsync("a free alias is used; a taken one is refused", async () =>
{
    var t = Make();
    var first = await t.S.CreateAsync(new CreateRequest(Url, CustomAlias: "my-shop"));
    var second = await t.S.CreateAsync(new CreateRequest("https://example.com/other", CustomAlias: "my-shop"));
    return CodeOf(first) + ":" + (second is CreateResult.AliasTaken);
}, "my-shop:True");
await CheckAsync("aliases must be well formed and not reserved", async () =>
{
    var t = Make();
    string[] bad = ["ab", "Admin", "has space", "x/y/z", new string('a', 31), "emoji😀ok"];
    int invalid = 0;
    foreach (var alias in bad) if (await t.S.CreateAsync(new CreateRequest(Url, CustomAlias: alias)) is CreateResult.Invalid) invalid++;
    return invalid + "/" + bad.Length;
}, "6/6");

// ---- rate limiting
await CheckAsync("rate limits creation per client with a token bucket", async () =>
{
    var t = Make(new ShortenerOptions { CreateBurst = 3, CreatesPerMinute = 60 });
    var results = new List<string>();
    for (int i = 0; i < 4; i++) results.Add((await t.S.CreateAsync(new CreateRequest(Url, ClientId: "a"))).GetType().Name);
    var limited = await t.S.CreateAsync(new CreateRequest(Url, ClientId: "a")) as CreateResult.RateLimited;
    var other = (await t.S.CreateAsync(new CreateRequest(Url, ClientId: "b"))).GetType().Name;
    t.Clock.Advance(TimeSpan.FromSeconds(1));
    var refilled = (await t.S.CreateAsync(new CreateRequest(Url, ClientId: "a"))).GetType().Name;
    return string.Join(",", results) + "|" + limited?.RetryAfter.TotalSeconds + "|" + other + "|" + refilled;
}, "Created,Created,Created,RateLimited|1|Created|Created");

// ---- resolving
async Task<(Shortener S, LinkStore Store, ClickSink Clicks, ManualClock Clock, string Code)> WithLink(ShortenerOptions? options = null, TimeSpan? expiresIn = null)
{
    var t = Make(options);
    var code = CodeOf(await t.S.CreateAsync(new CreateRequest(Url, ExpiresIn: expiresIn)));
    return (t.S, t.Store, t.Clicks, t.Clock, code);
}
await CheckAsync("redirects with a 302", async () => { var t = await WithLink(); return await t.S.ResolveAsync(t.Code); }, new Resolution.Redirect(Url, 302));
await CheckAsync("serves repeat redirects from the cache", async () =>
{
    var t = await WithLink();
    for (int i = 0; i < 20; i++) await t.S.ResolveAsync(t.Code);
    return t.Store.Reads;
}, 1);
await CheckAsync("concurrent misses share one store read", async () =>
{
    var t = await WithLink();
    var all = await Task.WhenAll(Enumerable.Range(0, 50).Select(_ => t.S.ResolveAsync(t.Code)));
    return t.Store.Reads + ":" + all.All(r => r is Resolution.Redirect);
}, "1:True");
await CheckAsync("caches unknown codes briefly", async () =>
{
    var t = await WithLink(new ShortenerOptions { CreateBurst = 100, NegativeTtl = TimeSpan.FromMinutes(1) });
    var a = await t.S.ResolveAsync("zzzzzz");
    var b = await t.S.ResolveAsync("zzzzzz");
    var readsWhileCached = t.Store.Reads;
    t.Clock.Advance(TimeSpan.FromSeconds(61));
    await t.S.ResolveAsync("zzzzzz");
    return a + "|" + b + "|" + readsWhileCached + "|" + t.Store.Reads;
}, "NotFound { }|NotFound { }|1|2");
await CheckAsync("junk codes never reach the store", async () =>
{
    var t = await WithLink();
    string[] junk = ["", "../etc/passwd", "a b", new string('a', 100), "%00"];
    int notFound = 0;
    foreach (var code in junk) if (await t.S.ResolveAsync(code) is Resolution.NotFound) notFound++;
    return notFound + ":" + t.Store.Reads;
}, "5:0");
await CheckAsync("an expired link is gone, even while cached", async () =>
{
    var t = await WithLink(expiresIn: TimeSpan.FromHours(1));
    var before = await t.S.ResolveAsync(t.Code);
    t.Clock.Advance(TimeSpan.FromMinutes(61));
    var after = await t.S.ResolveAsync(t.Code);
    return (before is Resolution.Redirect) + ":" + after;
}, "True:Gone { }");
await CheckAsync("the cache is bounded", async () =>
{
    var t = Make(new ShortenerOptions { CreateBurst = 1000, CacheCapacity = 100 });
    var codes = new List<string>();
    for (int i = 0; i < 150; i++) codes.Add(CodeOf(await t.S.CreateAsync(new CreateRequest(Url))));
    foreach (var c in codes) await t.S.ResolveAsync(c);
    return t.S.CachedCount;
}, 100);
await ThrowsAsync<TimeoutException>("a store timeout reaches the caller", async () =>
{
    var t = await WithLink();
    t.Store.FailReads = 1;
    await t.S.ResolveAsync(t.Code);
});
await CheckAsync("a failed read is not cached: the next call succeeds", async () =>
{
    var t = await WithLink();
    t.Store.FailReads = 1;
    try { await t.S.ResolveAsync(t.Code); } catch (TimeoutException) { }
    return (await t.S.ResolveAsync(t.Code) is Resolution.Redirect) + ":" + t.Store.Reads;
}, "True:2");

// ---- analytics
await CheckAsync("clicks are counted in memory and flushed as one batch", async () =>
{
    var t = Make();
    var a = CodeOf(await t.S.CreateAsync(new CreateRequest(Url)));
    var b = CodeOf(await t.S.CreateAsync(new CreateRequest("https://example.com/b")));
    for (int i = 0; i < 100; i++) await t.S.ResolveAsync(a);
    for (int i = 0; i < 5; i++) await t.S.ResolveAsync(b);
    int batchesBeforeFlush = t.Clicks.Batches.Count;
    await t.S.FlushClicksAsync();
    await t.S.FlushClicksAsync();
    return batchesBeforeFlush + ":" + t.Clicks.Batches.Count + ":" + t.Clicks.Total(a) + ":" + t.Clicks.Total(b) + ":" + t.Store.Writes;
}, "0:1:100:5:2");
await CheckAsync("not-found and gone resolutions are not clicks", async () =>
{
    var t = await WithLink(expiresIn: TimeSpan.FromMinutes(5));
    await t.S.ResolveAsync("nothere");
    t.Clock.Advance(TimeSpan.FromMinutes(10));
    await t.S.ResolveAsync(t.Code);
    await t.S.FlushClicksAsync();
    return t.Clicks.Batches.Count;
}, 0);
await CheckAsync("counts survive a failed flush", async () =>
{
    var t = await WithLink();
    for (int i = 0; i < 3; i++) await t.S.ResolveAsync(t.Code);
    t.Clicks.FailNext = true;
    bool threw = false;
    try { await t.S.FlushClicksAsync(); } catch (IOException) { threw = true; }
    for (int i = 0; i < 2; i++) await t.S.ResolveAsync(t.Code);
    await t.S.FlushClicksAsync();
    return threw + ":" + t.Clicks.Total(t.Code) + ":" + t.Clicks.Batches.Count;
}, "True:5:1");
`);

const OUTLINE = `// Run (design target): the outline of DESIGN.md as the grader sees it.
import { readFile } from 'dw:project';

let current = '(preamble)';
const counts = new Map<string, number>();
for (const line of readFile('DESIGN.md').split(String.fromCharCode(10))) {
  if (line.startsWith('## ')) { current = line.slice(3).trim(); counts.set(current, 0); continue; }
  const words = line.split(' ').filter((w) => w.trim().length > 0 && w !== 'TODO').length;
  counts.set(current, (counts.get(current) ?? 0) + words);
}
for (const [name, n] of counts) console.log(name.padEnd(16) + n + ' words');
`;

const DESIGN_STARTER = `# sho.rt — URL Shortener Design

## Requirements

TODO

## Estimates

TODO

## API

TODO

## Data model

TODO

## Architecture

TODO

## Trade-offs

TODO

## Risks

TODO
`;

const DESIGN_SOLUTION = `# sho.rt — URL Shortener Design

## Requirements

Functional: anyone can shorten an absolute http or https URL, optionally choosing a custom alias and an expiry; following a
short link redirects to its target; owners can see click counts per link. Non-functional: redirects in under 50 ms at the
99th percentile from Africa and Europe; the redirect path available 99.99% of the time; a created link is never lost;
creation rate-limited per client to stop abuse. Non-goals for version one: editing a link's target, user accounts beyond
an API key, link previews and QR codes.

## Estimates

Writes: 100 million links per day ÷ 86 400 s ≈ 1 160 writes/s on average, about 2 300/s at a peak factor of two.
Reads: 10 redirects per link gives about 11 600 reads/s on average and roughly 23 000 reads/s at peak — a read-heavy
workload, ten reads for every write. Storage: 100 million × 365 × 10 years × 500 bytes ≈ 183 TB of link records, which
needs partitioning. Cache: 20% of a day's billion redirects × 500 bytes ≈ 100 GB, a small cluster of cache nodes.
Codes: seven base62 characters give 3.5 trillion codes, about 96 years at this rate.

## API

POST /api/links with { target, alias?, expiresInSeconds? } returns 201 Created with { code, shortUrl }, 400 for an invalid
target or alias, 409 Conflict when an alias is taken and 429 Too Many Requests with Retry-After when rate-limited.
GET /{code} returns 302 Found with a Location header, 404 for an unknown code and 410 Gone for an expired link.
GET /api/links/{code}/stats returns the click count, which may lag by up to a minute.

## Data model

One link record: code (partition key and primary key), target URL, owner, createdAt and an optional expiresAt — about
500 bytes. Every redirect is a lookup by code, so partitioning by a hash of the code spreads load evenly and keeps each
lookup on one partition. Click counts live in a separate analytics store, keyed by code and hour, written in batches.

## Architecture

Clients reach a global edge (Azure Front Door) that routes to the nearest region. Stateless API instances run behind it
on Container Apps. A redirect checks the in-process cache, then the shared Redis cache, and only then the partitioned link
store; concurrent misses for a hot code share one store read, and unknown codes are cached for a minute. Creation takes
an id from a locally held block of 1 000 ids (one call to the central allocator per block), encodes it in base62 and
inserts it; the store's unique constraint resolves any clash with a custom alias. Clicks are counted in memory and
flushed to the analytics store as one batch per instance per interval.

## Trade-offs

301 versus 302: a 301 would let browsers and CDNs cache redirects and cut our traffic sharply, but clicks would no longer
reach us and expiry would not work, so we use 302 and absorb the load with caching. Ids: block allocation keeps codes short
and avoids a database round trip per link, but codes are sequential and therefore guessable; links to private documents
should use a random custom alias. Consistency: claiming a custom alias must be strongly consistent (the unique insert),
while redirects tolerate eventual consistency and serve from caches and replicas. Analytics are approximate and up to a
minute late, in exchange for a redirect path that never writes.

## Risks

A viral link concentrates traffic on one key: the local cache absorbs it, and we watch per-partition request rates. Abuse
— phishing and malware targets — is the biggest product risk: we rate-limit creation, check targets against a blocklist
and can disable a code quickly. Losing in-memory click counts when an instance dies loses at most one flush interval of
analytics, which we accept. Alerts page on the redirect SLO's error-budget burn rate, not on individual errors.
`;

const DESIGN_TESTS = `import { describe, it, expect } from 'vitest';
import { readFile } from 'dw:project';

const NL = String.fromCharCode(10);
const text = readFile('DESIGN.md');
const sections = new Map<string, string>();
let current = '';
for (const line of text.split(NL)) {
  if (line.startsWith('## ')) { current = line.slice(3).trim().toLowerCase(); sections.set(current, ''); continue; }
  if (current) sections.set(current, (sections.get(current) ?? '') + ' ' + line);
}
const section = (name: string): string => sections.get(name.toLowerCase()) ?? '';
const words = (s: string) => s.split(' ').map((w) => w.trim()).filter((w) => w.length > 0 && w !== 'TODO');
const has = (s: string, ...terms: string[]) => terms.every((t) => s.toLowerCase().includes(t.toLowerCase()));
const REQUIRED = ['Requirements', 'Estimates', 'API', 'Data model', 'Architecture', 'Trade-offs', 'Risks'];

describe('DESIGN.md', () => {
  it('has every section', () => {
    expect(REQUIRED.filter((s) => !sections.has(s.toLowerCase())), 'add these ## sections').toEqual([]);
  });
  it('says something substantial in each section', () => {
    expect(REQUIRED.filter((s) => words(section(s)).length < 40), 'sections with fewer than 40 words').toEqual([]);
  });
  it('separates functional and non-functional requirements and names non-goals', () => {
    const r = section('Requirements');
    expect(has(r, 'functional') && has(r, 'non-functional') && has(r, 'non-goal'), 'Requirements: functional, non-functional, non-goals').toBe(true);
  });
  it('puts numbers on the load and the data', () => {
    const e = section('Estimates');
    const numbers = e.split(' ').filter((w) => w.length > 0 && '0123456789'.includes(w[0])).length;
    expect(numbers, 'Estimates: show the arithmetic, with numbers').toBeGreaterThanOrEqual(8);
    expect(has(e, '/s') || has(e, 'per second') || has(e, 'qps'), 'Estimates: requests per second').toBe(true);
    expect(has(e, 'TB') || has(e, 'PB'), 'Estimates: storage over ten years (TB)').toBe(true);
    expect(has(e, 'cache'), 'Estimates: cache size').toBe(true);
  });
  it('specifies the API with status codes', () => {
    const a = section('API');
    expect(['201', '302', '404', '410', '409', '429'].filter((c) => !a.includes(c)), 'API: name these status codes').toEqual([]);
  });
  it('names the partition key', () => {
    expect(has(section('Data model'), 'partition'), 'Data model: what is the partition key, and why?').toBe(true);
  });
  it('argues the key trade-offs', () => {
    const t = section('Trade-offs');
    expect(t.includes('301') && t.includes('302'), 'Trade-offs: 301 vs 302').toBe(true);
    expect(has(t, 'consisten'), 'Trade-offs: consistency for aliases vs redirects').toBe(true);
    expect(has(t, 'id'), 'Trade-offs: how ids are generated').toBe(true);
  });
});
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('Contracts.cs', CONTRACTS, { editable: false }),
  pf('Infrastructure.cs', INFRASTRUCTURE, { editable: false }),
  pf('Program.cs', PROGRAM, { editable: false }),
  pf('design-outline.ts', OUTLINE, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m6-001',
  title: 'Week 21: Design a URL Shortener',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 6 · System Design & Capstone',
  tags: ['system design', 'caching', 'id generation', 'rate limiting', 'design document'],
  prompt:
    'Design sho.rt for 100 million new links and a billion redirects a day, then build and prove its core: token-bucket rate limiting, ' +
    'strict target and alias validation, base62 codes from block-allocated ids that survive alias collisions, a bounded cache-aside ' +
    'redirect path with negative caching and single-flight loads that keeps junk away from the store, expiry, and click counting that ' +
    'never writes on the redirect path and never loses counts. Graded against simulated infrastructure that counts every read, write and ' +
    'batch — plus a design document with requirements, estimates, API, data model, architecture, trade-offs and risks.',
  hints: [
    'Tasks cs-6-01 to cs-6-04 cover estimates, cache-aside with single flight, base62, and the ring; this project combines the first three.',
    'Rate-limit first, then validate: a client hammering the endpoint with bad URLs still spends tokens.',
    'Cache found and not-found results in the same LRU with different expiry times; check a link\'s own ExpiresAt on every resolve, cached or not.',
    'Flush by swapping the pending dictionary for a new one before awaiting the sink; on failure merge the old counts back.',
    'Write DESIGN.md first: the numbers in Estimates explain every choice the code makes.',
  ],
  files: [
    ...given,
    pf('Shortener.cs', STARTER),
    pf('DESIGN.md', DESIGN_STARTER),
  ],
  solutionFiles: [
    ...given,
    pf('Shortener.cs', SOLUTION),
    pf('DESIGN.md', DESIGN_SOLUTION),
  ],
  targets: [
    { id: 'service', label: 'Shortener service', kind: 'csharp', entry: 'Program.cs', testCode: TESTS },
    { id: 'design', label: 'Design document', kind: 'typescript', entry: 'design-outline.ts', testCode: DESIGN_TESTS },
  ],
};

export default task;
