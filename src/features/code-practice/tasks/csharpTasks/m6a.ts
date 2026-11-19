import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 6 · System Design';

/** Month 6, week 21 (lessons dn6-1, dn6-2): estimates, caching, ids and partitioning — the
 *  building blocks of the URL shortener, each small enough to test exactly. */
export const CSHARP_MONTH6_A_TASKS: CodeTask[] = [
  {
    id: 'cs-6-01',
    title: 'Back-of-the-Envelope Capacity and Availability',
    difficulty: 'Easy',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Turn the estimates every design review starts with into code. Capacity.For(workload) returns: WriteQps = NewItemsPerDay / 86 400; ' +
      'ReadQps = WriteQps × ReadsPerWrite; PeakReadQps = ReadQps × PeakFactor; StorageBytes = NewItemsPerDay × 365 × RetentionYears × ' +
      'BytesPerItem (a long, computed with checked arithmetic); CacheBytes = NewItemsPerDay × ReadsPerWrite × HotFraction × BytesPerItem ' +
      '(cache the hot share of a day\'s reads). Throw ArgumentOutOfRangeException when NewItemsPerDay, ReadsPerWrite, BytesPerItem or ' +
      'RetentionYears is not positive, PeakFactor is below 1, or HotFraction is not in (0, 1]. Capacity.Human(bytes) formats with decimal ' +
      'units (1 KB = 1000 B): below 1000 → "512 B"; otherwise one decimal place, invariant culture — "1.5 KB", "182.5 TB", up to PB. ' +
      'Availability.Serial(…) is the availability of components that must all work (the product); Availability.Parallel(…) of redundant ' +
      'copies where one is enough (1 − Π(1 − a)); Availability.DowntimePerYear(a) is (1 − a) × 365 days as a TimeSpan.',
    starterCode: `public sealed record Workload(long NewItemsPerDay, int ReadsPerWrite, int BytesPerItem, int RetentionYears, double PeakFactor, double HotFraction);

public sealed record Estimate(double WriteQps, double ReadQps, double PeakReadQps, long StorageBytes, long CacheBytes);

public static class Capacity
{
    public const int SecondsPerDay = 86_400;

    public static Estimate For(Workload w) => throw new NotImplementedException();

    public static string Human(long bytes) => throw new NotImplementedException();
}

public static class Availability
{
    public static double Serial(params double[] parts) => throw new NotImplementedException();
    public static double Parallel(params double[] copies) => throw new NotImplementedException();
    public static TimeSpan DowntimePerYear(double availability) => throw new NotImplementedException();
}
`,
    hints: [
      'checked(w.NewItemsPerDay * 365 * w.RetentionYears * w.BytesPerItem) throws OverflowException instead of silently wrapping.',
      'Human: string[] units = ["B", "KB", "MB", "GB", "TB", "PB"]; divide a double by 1000 while it is ≥ 1000 and a larger unit exists, then format with value.ToString("0.0", CultureInfo.InvariantCulture).',
      'Parallel: 1 - copies.Aggregate(1.0, (p, a) => p * (1 - a)). Two 99% copies give 99.99%.',
      'DowntimePerYear: TimeSpan.FromDays(365 * (1 - availability)) — 99.9% is about 8.76 hours.',
    ],
    solution: `using System.Globalization;

public sealed record Workload(long NewItemsPerDay, int ReadsPerWrite, int BytesPerItem, int RetentionYears, double PeakFactor, double HotFraction);

public sealed record Estimate(double WriteQps, double ReadQps, double PeakReadQps, long StorageBytes, long CacheBytes);

public static class Capacity
{
    public const int SecondsPerDay = 86_400;

    public static Estimate For(Workload w)
    {
        if (w.NewItemsPerDay <= 0) throw new ArgumentOutOfRangeException(nameof(w), "NewItemsPerDay must be positive.");
        if (w.ReadsPerWrite <= 0) throw new ArgumentOutOfRangeException(nameof(w), "ReadsPerWrite must be positive.");
        if (w.BytesPerItem <= 0) throw new ArgumentOutOfRangeException(nameof(w), "BytesPerItem must be positive.");
        if (w.RetentionYears <= 0) throw new ArgumentOutOfRangeException(nameof(w), "RetentionYears must be positive.");
        if (w.PeakFactor < 1) throw new ArgumentOutOfRangeException(nameof(w), "PeakFactor is at least 1.");
        if (w.HotFraction <= 0 || w.HotFraction > 1) throw new ArgumentOutOfRangeException(nameof(w), "HotFraction is in (0, 1].");

        double writeQps = (double)w.NewItemsPerDay / SecondsPerDay;
        double readQps = writeQps * w.ReadsPerWrite;
        long storage = checked(w.NewItemsPerDay * 365L * w.RetentionYears * w.BytesPerItem);
        long cache = checked((long)(w.NewItemsPerDay * (double)w.ReadsPerWrite * w.HotFraction * w.BytesPerItem));
        return new Estimate(writeQps, readQps, readQps * w.PeakFactor, storage, cache);
    }

    public static string Human(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB", "TB", "PB"];
        if (bytes < 1000) return bytes.ToString(CultureInfo.InvariantCulture) + " B";
        double value = bytes;
        int unit = 0;
        while (value >= 1000 && unit < units.Length - 1)
        {
            value /= 1000;
            unit++;
        }
        return value.ToString("0.0", CultureInfo.InvariantCulture) + " " + units[unit];
    }
}

public static class Availability
{
    public static double Serial(params double[] parts) => parts.Aggregate(1.0, (product, a) => product * a);

    public static double Parallel(params double[] copies) => 1 - copies.Aggregate(1.0, (product, a) => product * (1 - a));

    public static TimeSpan DowntimePerYear(double availability) => TimeSpan.FromDays(365 * (1 - availability));
}
`,
    testCode: csTests(`
var shortener = new Workload(NewItemsPerDay: 100_000_000, ReadsPerWrite: 10, BytesPerItem: 500, RetentionYears: 10, PeakFactor: 2, HotFraction: 0.2);
Check("write QPS", () => Math.Round(Capacity.For(shortener).WriteQps, 1), 1157.4);
Check("read QPS", () => Math.Round(Capacity.For(shortener).ReadQps, 1), 11574.1);
Check("peak read QPS", () => Math.Round(Capacity.For(shortener).PeakReadQps, 1), 23148.1);
Check("ten years of storage", () => Capacity.For(shortener).StorageBytes, 182_500_000_000_000L);
Check("cache for the hot fifth of a day's reads", () => Capacity.For(shortener).CacheBytes, 100_000_000_000L);
CheckSeq("human-readable sizes", () => new[] { Capacity.Human(0), Capacity.Human(999), Capacity.Human(1500), Capacity.Human(182_500_000_000_000L), Capacity.Human(100_000_000_000L), Capacity.Human(3_000_000_000_000_000L) },
    ["0 B", "999 B", "1.5 KB", "182.5 TB", "100.0 GB", "3.0 PB"]);
Throws<ArgumentOutOfRangeException>("rejects a peak factor below 1", () => Capacity.For(shortener with { PeakFactor = 0.5 }));
Throws<ArgumentOutOfRangeException>("rejects a hot fraction above 1", () => Capacity.For(shortener with { HotFraction = 1.5 }));
Throws<ArgumentOutOfRangeException>("rejects zero items per day", () => Capacity.For(shortener with { NewItemsPerDay = 0 }));
Throws<OverflowException>("overflow is an error, not a wrong answer", () => Capacity.For(shortener with { NewItemsPerDay = long.MaxValue / 1000 }));
Check("serial components multiply", () => Math.Round(Availability.Serial(0.999, 0.999, 0.9995), 5), 0.9975);
Check("redundancy: two 99% copies", () => Math.Round(Availability.Parallel(0.99, 0.99), 6), 0.9999);
Check("99.9% allows about 8.76 hours a year", () => Math.Round(Availability.DowntimePerYear(0.999).TotalHours, 2), 8.76);
Check("99.99% allows about 52.6 minutes a year", () => Math.Round(Availability.DowntimePerYear(0.9999).TotalMinutes, 1), 52.6);
`),
  },
  {
    id: 'cs-6-02',
    title: 'An LRU Cache with Expiry, and Cache-Aside Without a Stampede',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Most redirects in a URL shortener are for a small set of hot links, so they are served from memory. Implement LruCache<TKey, TValue>(capacity, ' +
      'ttl, clock): Set stores or replaces a value (resetting its expiry) and evicts the least recently used entry when over capacity; ' +
      'TryGet returns false for a missing or expired entry (removing an expired one) and otherwise marks the entry most recently used; Count, ' +
      'Hits and Misses report what happened. Use a Dictionary plus a LinkedList so every operation is O(1). Then CacheAside<TKey, TValue>(cache, ' +
      'load).GetAsync(key): return a cached value; on a miss, call load(key) and cache a non-null result (a null — "no such link" — is not ' +
      'cached). Concurrent misses for the same key must share one in-flight load (no stampede on the database); a failed load is not cached, ' +
      'its exception reaches every waiter, and the next call tries again. Throw ArgumentOutOfRangeException for capacity < 1 or a ' +
      'non-positive ttl.',
    starterCode: `public sealed class LruCache<TKey, TValue> where TKey : notnull
{
    public LruCache(int capacity, TimeSpan ttl, Func<DateTimeOffset> clock) => throw new NotImplementedException();

    public int Count => throw new NotImplementedException();
    public long Hits => throw new NotImplementedException();
    public long Misses => throw new NotImplementedException();

    public bool TryGet(TKey key, out TValue value) => throw new NotImplementedException();
    public void Set(TKey key, TValue value) => throw new NotImplementedException();
}

public sealed class CacheAside<TKey, TValue> where TKey : notnull where TValue : class
{
    public CacheAside(LruCache<TKey, TValue> cache, Func<TKey, Task<TValue?>> load) => throw new NotImplementedException();

    public Task<TValue?> GetAsync(TKey key) => throw new NotImplementedException();
}
`,
    hints: [
      'Keep Dictionary<TKey, LinkedListNode<Entry>> and a LinkedList<Entry> where the first node is the most recently used. Entry holds Key, Value and ExpiresAt.',
      'On a hit: list.Remove(node); list.AddFirst(node). On Set over capacity: remove list.Last from both structures.',
      'Single flight: Dictionary<TKey, Task<TValue?>> inFlight. On a miss, reuse an existing task if there is one; otherwise start LoadAndCacheAsync(key), store the task, and remove it in a finally block when it completes.',
      'TryGet must set value = default! on a miss to satisfy the out parameter.',
    ],
    solution: `public sealed class LruCache<TKey, TValue> where TKey : notnull
{
    private sealed record Entry(TKey Key, TValue Value, DateTimeOffset ExpiresAt);

    private readonly int _capacity;
    private readonly TimeSpan _ttl;
    private readonly Func<DateTimeOffset> _clock;
    private readonly Dictionary<TKey, LinkedListNode<Entry>> _index = new();
    private readonly LinkedList<Entry> _recency = new();   // first = most recently used

    public LruCache(int capacity, TimeSpan ttl, Func<DateTimeOffset> clock)
    {
        if (capacity < 1) throw new ArgumentOutOfRangeException(nameof(capacity));
        if (ttl <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(ttl));
        (_capacity, _ttl, _clock) = (capacity, ttl, clock);
    }

    public int Count => _index.Count;
    public long Hits { get; private set; }
    public long Misses { get; private set; }

    public bool TryGet(TKey key, out TValue value)
    {
        if (_index.TryGetValue(key, out var node))
        {
            if (node.Value.ExpiresAt > _clock())
            {
                _recency.Remove(node);
                _recency.AddFirst(node);
                Hits++;
                value = node.Value.Value;
                return true;
            }
            _recency.Remove(node);
            _index.Remove(key);
        }
        Misses++;
        value = default!;
        return false;
    }

    public void Set(TKey key, TValue value)
    {
        if (_index.TryGetValue(key, out var existing))
        {
            _recency.Remove(existing);
            _index.Remove(key);
        }
        _index[key] = _recency.AddFirst(new Entry(key, value, _clock() + _ttl));
        if (_index.Count > _capacity)
        {
            var oldest = _recency.Last!;
            _recency.RemoveLast();
            _index.Remove(oldest.Value.Key);
        }
    }
}

public sealed class CacheAside<TKey, TValue> where TKey : notnull where TValue : class
{
    private readonly LruCache<TKey, TValue> _cache;
    private readonly Func<TKey, Task<TValue?>> _load;
    private readonly Dictionary<TKey, Task<TValue?>> _inFlight = new();

    public CacheAside(LruCache<TKey, TValue> cache, Func<TKey, Task<TValue?>> load) => (_cache, _load) = (cache, load);

    public Task<TValue?> GetAsync(TKey key)
    {
        if (_cache.TryGet(key, out var cached)) return Task.FromResult<TValue?>(cached);
        if (_inFlight.TryGetValue(key, out var pending)) return pending;   // join the load already running
        var task = LoadAndCacheAsync(key);
        if (!task.IsCompleted) _inFlight[key] = task;
        return task;
    }

    private async Task<TValue?> LoadAndCacheAsync(TKey key)
    {
        try
        {
            var value = await _load(key);
            if (value is not null) _cache.Set(key, value);
            return value;
        }
        finally
        {
            _inFlight.Remove(key);
        }
    }
}
`,
    testCode: csTests(`
var now = DateTimeOffset.Parse("2026-11-08T10:00:00Z");
LruCache<string, string> Cache(int capacity = 3, int ttlSeconds = 60) => new(capacity, TimeSpan.FromSeconds(ttlSeconds), () => now);
Check("a stored value is returned", () => { var c = Cache(); c.Set("a", "1"); return c.TryGet("a", out var v) ? v : "miss"; }, "1");
Check("a missing key is a miss", () => { var c = Cache(); return c.TryGet("zz", out _); }, false);
CheckSeq("evicts the least recently used", () => { var c = Cache(); c.Set("a", "1"); c.Set("b", "2"); c.Set("c", "3"); c.TryGet("a", out _); c.Set("d", "4"); return new[] { "a", "b", "c", "d" }.Where(k => c.TryGet(k, out _)); }, ["a", "c", "d"]);
Check("replacing a value does not grow the cache", () => { var c = Cache(2); c.Set("a", "1"); c.Set("a", "2"); c.Set("b", "3"); return c.Count + ":" + (c.TryGet("a", out var v) ? v : "-"); }, "2:2");
Check("entries expire after the ttl", () => { var c = Cache(ttlSeconds: 30); c.Set("a", "1"); now = now.AddSeconds(31); var hit = c.TryGet("a", out _); now = now.AddSeconds(-31); return hit + ":" + c.Count; }, "False:0");
Check("setting again resets the expiry", () => { var c = Cache(ttlSeconds: 30); c.Set("a", "1"); now = now.AddSeconds(20); c.Set("a", "2"); now = now.AddSeconds(20); var hit = c.TryGet("a", out _); now = now.AddSeconds(-40); return hit; }, true);
Check("hits and misses are counted", () => { var c = Cache(); c.Set("a", "1"); c.TryGet("a", out _); c.TryGet("a", out _); c.TryGet("b", out _); return c.Hits + "/" + c.Misses; }, "2/1");
Throws<ArgumentOutOfRangeException>("capacity must be at least 1", () => Cache(0));
await CheckAsync("cache-aside loads once, then serves from memory", async () =>
{
    int loads = 0;
    var aside = new CacheAside<string, string>(Cache(), async k => { loads++; await Task.Yield(); return "https://example.com/" + k; });
    var first = await aside.GetAsync("abc");
    var second = await aside.GetAsync("abc");
    return first + "|" + second + "|" + loads;
}, "https://example.com/abc|https://example.com/abc|1");
await CheckAsync("a missing link is not cached", async () =>
{
    int loads = 0;
    var aside = new CacheAside<string, string>(Cache(), async k => { loads++; await Task.Yield(); return null; });
    await aside.GetAsync("nope");
    await aside.GetAsync("nope");
    return loads;
}, 2);
await CheckAsync("concurrent misses share one load (no stampede)", async () =>
{
    int loads = 0;
    var gate = new TaskCompletionSource<string?>();
    var aside = new CacheAside<string, string>(Cache(), k => { loads++; return gate.Task; });
    var waiters = Enumerable.Range(0, 5).Select(_ => aside.GetAsync("hot")).ToList();
    gate.SetResult("https://example.com/hot");
    var results = await Task.WhenAll(waiters);
    return loads + ":" + results.Distinct().Count();
}, "1:1");
await CheckAsync("a failed load reaches every waiter, is not cached, and is retried", async () =>
{
    int loads = 0;
    var gate = new TaskCompletionSource<string?>();
    var aside = new CacheAside<string, string>(Cache(), k => { loads++; return loads == 1 ? gate.Task : Task.FromResult<string?>("ok"); });
    var a = aside.GetAsync("k");
    var b = aside.GetAsync("k");
    gate.SetException(new TimeoutException("database timeout"));
    int failures = 0;
    foreach (var t in new[] { a, b }) { try { await t; } catch (TimeoutException) { failures++; } }
    var retried = await aside.GetAsync("k");
    return failures + ":" + retried + ":" + loads;
}, "2:ok:2");
`),
  },
  {
    id: 'cs-6-03',
    title: 'Short Codes: Base62 and Snowflake Ids',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Short links need ids that are unique across many servers without asking a database each time, and short to type. ' +
      'Base62.Encode(value) writes a non-negative long in the alphabet 0-9, a-z, A-Z (so 0 → "0", 61 → "Z", 62 → "10"); negative values throw ' +
      'ArgumentOutOfRangeException. Base62.Decode(text) reverses it, throwing FormatException for an empty string or a character outside the ' +
      'alphabet and OverflowException when the value does not fit in a long. SnowflakeIds(workerId, clockMs, epochMs) produces 63-bit ids: ' +
      '41 bits of milliseconds since epochMs, 10 bits of worker id (0–1023, else ArgumentOutOfRangeException) and a 12-bit sequence. Within one ' +
      'millisecond the sequence counts up; when it would pass 4095, Next() waits (re-reading the clock) for the next millisecond; a new ' +
      'millisecond resets it to 0. If the clock goes backwards, throw InvalidOperationException rather than risk a duplicate. ' +
      'SnowflakeIds.Parse(id, epochMs) returns (TimestampMs, WorkerId, Sequence).',
    starterCode: `public static class Base62
{
    public const string Alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static string Encode(long value) => throw new NotImplementedException();
    public static long Decode(string text) => throw new NotImplementedException();
}

public sealed class SnowflakeIds
{
    public SnowflakeIds(int workerId, Func<long> clockMs, long epochMs) => throw new NotImplementedException();

    public long Next() => throw new NotImplementedException();

    public static (long TimestampMs, int WorkerId, int Sequence) Parse(long id, long epochMs) => throw new NotImplementedException();
}
`,
    hints: [
      'Encode: repeatedly take value % 62 as the next digit (least significant first), then reverse.',
      'Decode: result = checked(result * 62 + digit), where digit = Alphabet.IndexOf(c) and -1 means a bad character.',
      'Layout: (elapsedMs << 22) | ((long)workerId << 12) | sequence. Parse with shifts and masks: (id >> 12) & 1023, id & 4095.',
      'In Next: read now; if now < last throw; if now == last, sequence = (sequence + 1) & 4095 and, when that wraps to 0, loop reading the clock until it passes last; otherwise sequence = 0.',
    ],
    solution: `public static class Base62
{
    public const string Alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public static string Encode(long value)
    {
        if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "Only non-negative values have a short code.");
        if (value == 0) return "0";
        var digits = new Stack<char>();
        while (value > 0)
        {
            digits.Push(Alphabet[(int)(value % 62)]);
            value /= 62;
        }
        return new string(digits.ToArray());
    }

    public static long Decode(string text)
    {
        if (string.IsNullOrEmpty(text)) throw new FormatException("A short code cannot be empty.");
        long result = 0;
        foreach (char c in text)
        {
            int digit = Alphabet.IndexOf(c);
            if (digit < 0) throw new FormatException($"'{c}' is not a base62 character.");
            result = checked(result * 62 + digit);
        }
        return result;
    }
}

public sealed class SnowflakeIds
{
    private const int WorkerBits = 10;
    private const int SequenceBits = 12;
    private const long MaxSequence = (1L << SequenceBits) - 1;

    private readonly int _workerId;
    private readonly Func<long> _clockMs;
    private readonly long _epochMs;
    private long _lastMs = -1;
    private long _sequence;

    public SnowflakeIds(int workerId, Func<long> clockMs, long epochMs)
    {
        if (workerId < 0 || workerId >= 1 << WorkerBits) throw new ArgumentOutOfRangeException(nameof(workerId));
        (_workerId, _clockMs, _epochMs) = (workerId, clockMs, epochMs);
    }

    public long Next()
    {
        long now = _clockMs();
        if (now < _lastMs) throw new InvalidOperationException($"Clock moved backwards by {_lastMs - now} ms; refusing to risk a duplicate id.");
        if (now == _lastMs)
        {
            _sequence = (_sequence + 1) & MaxSequence;
            if (_sequence == 0)
            {
                while ((now = _clockMs()) <= _lastMs) { }   // this millisecond is used up
            }
        }
        else
        {
            _sequence = 0;
        }
        _lastMs = now;
        return ((now - _epochMs) << (WorkerBits + SequenceBits)) | ((long)_workerId << SequenceBits) | _sequence;
    }

    public static (long TimestampMs, int WorkerId, int Sequence) Parse(long id, long epochMs) =>
        ((id >> (WorkerBits + SequenceBits)) + epochMs, (int)((id >> SequenceBits) & ((1 << WorkerBits) - 1)), (int)(id & MaxSequence));
}
`,
    testCode: csTests(`
CheckSeq("encodes small values", () => new[] { Base62.Encode(0), Base62.Encode(9), Base62.Encode(10), Base62.Encode(61), Base62.Encode(62), Base62.Encode(3843) }, ["0", "9", "a", "Z", "10", "ZZ"]);
Check("round-trips large values", () => Base62.Decode(Base62.Encode(long.MaxValue)), long.MaxValue);
Check("a 64-bit id needs at most 11 characters", () => Base62.Encode(long.MaxValue).Length, 11);
Check("seven characters already cover 3.5 trillion links", () => Base62.Decode("ZZZZZZZ") + 1, 3_521_614_606_208L);
Throws<FormatException>("rejects characters outside the alphabet", () => Base62.Decode("ab-c"));
Throws<FormatException>("rejects an empty code", () => Base62.Decode(""));
Throws<OverflowException>("rejects codes beyond a long", () => Base62.Decode("ZZZZZZZZZZZZ"));
Throws<ArgumentOutOfRangeException>("rejects negative values", () => Base62.Encode(-1));
const long Epoch = 1_700_000_000_000L;
Check("packs time, worker and sequence", () => { long t = Epoch + 5000; var g = new SnowflakeIds(7, () => t, Epoch); g.Next(); return SnowflakeIds.Parse(g.Next(), Epoch); }, (Epoch + 5000, 7, 1));
Check("a new millisecond resets the sequence", () => { long t = Epoch + 10; var g = new SnowflakeIds(1, () => t, Epoch); g.Next(); g.Next(); t++; return SnowflakeIds.Parse(g.Next(), Epoch).Sequence; }, 0);
Expect("ids from different workers never collide", () =>
{
    long t = Epoch + 42;
    var a = new SnowflakeIds(1, () => t, Epoch);
    var b = new SnowflakeIds(2, () => t, Epoch);
    var ids = Enumerable.Range(0, 1000).SelectMany(_ => new[] { a.Next(), b.Next() }).ToList();
    return ids.Distinct().Count() == 2000;
}, "two workers in the same millisecond produced the same id");
Expect("a full millisecond waits for the next one, and ids keep increasing", () =>
{
    long reads = 0;
    var g = new SnowflakeIds(3, () => ++reads <= 4097 ? Epoch + 1000 : Epoch + 1001, Epoch);
    var ids = Enumerable.Range(0, 4097).Select(_ => g.Next()).ToList();
    var last = SnowflakeIds.Parse(ids[^1], Epoch);
    bool increasing = ids.Zip(ids.Skip(1)).All(p => p.Second > p.First);
    return increasing && last == (Epoch + 1001, 3, 0) && SnowflakeIds.Parse(ids[4095], Epoch).Sequence == 4095;
}, "the 4097th id must move to the next millisecond with sequence 0, and ids must strictly increase");
Throws<InvalidOperationException>("a clock moving backwards is refused", () => { long t = Epoch + 100; var g = new SnowflakeIds(1, () => t, Epoch); g.Next(); t -= 5; g.Next(); });
Throws<ArgumentOutOfRangeException>("worker ids fit in 10 bits", () => new SnowflakeIds(1024, () => Epoch, Epoch));
`),
  },
  {
    id: 'cs-6-04',
    title: 'A Consistent Hash Ring with Virtual Nodes',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'The link table is split across cache servers. With hash(key) % n, adding a fifth server moves about 80% of keys and empties every cache ' +
      'at once; consistent hashing moves only about 1/n. Implement ConsistentHashRing(virtualNodes): Fnv1a(text) is 32-bit FNV-1a over the ' +
      'UTF-8 bytes (offset basis 2166136261, prime 16777619); Hash(text) passes that through the fmix32 finalizer from MurmurHash3 (h ^= h >> 16; ' +
      'h *= 0x85EBCA6B; h ^= h >> 13; h *= 0xC2B2AE35; h ^= h >> 16), because FNV alone spreads similar strings such as "a#1", "a#2" unevenly ' +
      'around the ring. AddNode(node) places virtualNodes points on the ring at Hash(node + "#" + i) for ' +
      'i = 0 … virtualNodes − 1 (ArgumentException if the node is already present); RemoveNode(node) removes them (ArgumentException if absent); ' +
      'GetNode(key) returns the node owning the first point clockwise from Hash(key) — the first point whose hash is ≥ the key\'s, wrapping ' +
      'to the lowest point — using binary search, not a scan; InvalidOperationException when the ring is empty. Nodes lists the members. ' +
      'The tests check placement, balance with many virtual nodes, and that adding or removing a node moves only the keys it should.',
    starterCode: `public sealed class ConsistentHashRing
{
    public ConsistentHashRing(int virtualNodes) => throw new NotImplementedException();

    public IReadOnlyCollection<string> Nodes => throw new NotImplementedException();

    public static uint Fnv1a(string text) => throw new NotImplementedException();
    public static uint Hash(string text) => throw new NotImplementedException();

    public void AddNode(string node) => throw new NotImplementedException();
    public void RemoveNode(string node) => throw new NotImplementedException();
    public string GetNode(string key) => throw new NotImplementedException();
}
`,
    hints: [
      'FNV-1a: uint h = 2166136261; foreach (byte b in Encoding.UTF8.GetBytes(text)) { h ^= b; h = unchecked(h * 16777619); }. The finalizer is five lines of shifts, XORs and unchecked multiplications on a uint.',
      'Keep the ring as a sorted List<uint> of points plus a Dictionary<uint, string> from point to node; rebuild or insert in order when nodes change.',
      'List<uint>.BinarySearch(hash) returns the index if found, otherwise the bitwise complement of the next larger element\'s index; an index equal to Count wraps to 0.',
      'Two virtual points can hash to the same value; skip a point that is already taken so the ring stays consistent.',
    ],
    solution: `using System.Text;

public sealed class ConsistentHashRing
{
    private readonly int _virtualNodes;
    private readonly List<uint> _points = new();                  // sorted
    private readonly Dictionary<uint, string> _owner = new();
    private readonly HashSet<string> _nodes = new();

    public ConsistentHashRing(int virtualNodes)
    {
        if (virtualNodes < 1) throw new ArgumentOutOfRangeException(nameof(virtualNodes));
        _virtualNodes = virtualNodes;
    }

    public IReadOnlyCollection<string> Nodes => _nodes;

    public static uint Fnv1a(string text)
    {
        uint hash = 2166136261;
        foreach (byte b in Encoding.UTF8.GetBytes(text))
        {
            hash ^= b;
            hash = unchecked(hash * 16777619);
        }
        return hash;
    }

    // MurmurHash3's finalizer: every input bit affects every output bit, so similar names spread out.
    public static uint Hash(string text)
    {
        uint h = Fnv1a(text);
        h ^= h >> 16;
        h = unchecked(h * 0x85EBCA6B);
        h ^= h >> 13;
        h = unchecked(h * 0xC2B2AE35);
        h ^= h >> 16;
        return h;
    }

    public void AddNode(string node)
    {
        if (!_nodes.Add(node)) throw new ArgumentException($"{node} is already on the ring.", nameof(node));
        for (int i = 0; i < _virtualNodes; i++)
        {
            uint point = Hash(node + "#" + i);
            if (_owner.ContainsKey(point)) continue;              // rare collision: first owner keeps it
            _owner[point] = node;
            int at = _points.BinarySearch(point);
            _points.Insert(~at, point);
        }
    }

    public void RemoveNode(string node)
    {
        if (!_nodes.Remove(node)) throw new ArgumentException($"{node} is not on the ring.", nameof(node));
        foreach (var point in _owner.Where(p => p.Value == node).Select(p => p.Key).ToList())
        {
            _owner.Remove(point);
            _points.RemoveAt(_points.BinarySearch(point));
        }
    }

    public string GetNode(string key)
    {
        if (_points.Count == 0) throw new InvalidOperationException("The ring has no nodes.");
        int at = _points.BinarySearch(Hash(key));
        if (at < 0) at = ~at;
        if (at == _points.Count) at = 0;                          // wrap around
        return _owner[_points[at]];
    }
}
`,
    testCode: csTests(`
CheckSeq("FNV-1a reference values", () => new[] { ConsistentHashRing.Fnv1a(""), ConsistentHashRing.Fnv1a("a"), ConsistentHashRing.Fnv1a("foobar") }, [2166136261u, 0xE40C292Cu, 0xBF9CF968u]);
CheckSeq("Hash finalizes FNV-1a with fmix32", () => new[] { ConsistentHashRing.Hash(""), ConsistentHashRing.Hash("a"), ConsistentHashRing.Hash("foobar") }, [0xAB3E7C0Bu, 0x1A80B1B3u, 0x0C0DA6DCu]);
ConsistentHashRing Ring(int vnodes, params string[] nodes) { var r = new ConsistentHashRing(vnodes); foreach (var n in nodes) r.AddNode(n); return r; }
var keys = Enumerable.Range(0, 20_000).Select(i => "link-" + i).ToList();
Check("a single node owns everything", () => keys.Take(50).Select(k => Ring(10, "cache-a").GetNode(k)).Distinct().Single(), "cache-a");
Expect("placement follows the first point clockwise", () =>
{
    var r = Ring(1, "x", "y");
    var px = ConsistentHashRing.Hash("x#0");
    var py = ConsistentHashRing.Hash("y#0");
    var (low, high, lowNode, highNode) = px < py ? (px, py, "x", "y") : (py, px, "y", "x");
    var probes = keys.Take(200).Select(k => (k, h: ConsistentHashRing.Hash(k))).ToList();
    return probes.All(p => r.GetNode(p.k) == (p.h > low && p.h <= high ? highNode : lowNode));
}, "a key belongs to the first virtual point at or after its hash, wrapping to the lowest point");
Expect("many virtual nodes balance the load", () =>
{
    var r = Ring(200, "a", "b", "c", "d");
    var counts = keys.GroupBy(r.GetNode).Select(g => g.Count()).ToList();
    return counts.Count == 4 && counts.All(c => c > 5000 * 0.75 && c < 5000 * 1.25);
}, "with 200 virtual nodes each of 4 nodes should own 3750–6250 of 20000 keys");
Expect("adding a node moves only keys to the new node, about 1/5 of them", () =>
{
    var r = Ring(200, "a", "b", "c", "d");
    var before = keys.ToDictionary(k => k, r.GetNode);
    r.AddNode("e");
    var moved = keys.Where(k => r.GetNode(k) != before[k]).ToList();
    double share = moved.Count / (double)keys.Count;
    return moved.All(k => r.GetNode(k) == "e") && share > 0.12 && share < 0.30;
}, "every moved key must now be on the new node, and roughly 20% of keys should move");
Expect("removing a node moves only that node's keys", () =>
{
    var r = Ring(200, "a", "b", "c", "d");
    var before = keys.ToDictionary(k => k, r.GetNode);
    r.RemoveNode("b");
    return keys.All(k => before[k] == "b" ? r.GetNode(k) != "b" : r.GetNode(k) == before[k]);
}, "keys on other nodes must not move when b leaves");
CheckSeq("tracks its members", () => { var r = Ring(5, "a", "b", "c"); r.RemoveNode("b"); return r.Nodes.OrderBy(n => n); }, ["a", "c"]);
Throws<ArgumentException>("rejects a duplicate node", () => Ring(5, "a", "a"));
Throws<ArgumentException>("rejects removing a stranger", () => Ring(5, "a").RemoveNode("zz"));
Throws<InvalidOperationException>("an empty ring has no owner", () => new ConsistentHashRing(5).GetNode("k"));
`),
  },
];
