import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 1 · C# Engineering';

/** Mutation grading for tasks where the learner writes the tests: the learner's checks must all pass
 *  against the correct implementation and at least one must fail against every planted bug. */
function mutationTests(subject: string, correct: string, mutants: [string, string][]): string {
  return csTests(`
${correct}
Expect("your checks pass on the correct ${subject}", () => ${'LearnerTests.Run(Correct)'}.ToList() is { Count: > 0 } r && r.All(ok => ok), "at least one of your checks fails on correct code, or you wrote none");
${mutants.map(([name, fn], i) => `Func<int, string> Mutant${i} = ${fn};
Expect("catches bug: ${name}", () => LearnerTests.Run(Mutant${i}).Any(ok => !ok), "none of your checks fails when ${name}");`).join('\n')}
`);
}

const GRADE_CORRECT = `string Correct(int s) => s switch { < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(s)), >= 80 => "A", >= 70 => "B", >= 60 => "C", >= 50 => "D", _ => "F" };`;

/** Month 1, weeks 3–4 tasks (lessons dn1-5 … dn1-8). */
export const CSHARP_MONTH1_B_TASKS: CodeTask[] = [
  {
    id: 'cs-1-09',
    title: 'Replace a Type Switch with Pluggable Rules',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Legacy.Fee(method, weightKg) prices shipping with a switch on a method name. Rebuild it so new methods can be added without editing ' +
      'existing code. Implement IShippingRule (Method name + Fee(weightKg)) for "standard" (5.00 + 1.20 per kg), "express" (12.00 + 2.00 per kg, ' +
      'minimum 15.00) and "pickup" (always 0). ShippingCalculator takes any IEnumerable<IShippingRule>; Fee(method, weightKg) finds the rule by ' +
      'name (case-insensitive) and throws ArgumentException for unknown methods or a negative weight. Results must match Legacy exactly, and a ' +
      'rule the tests invent must work without changes to your calculator.',
    starterCode: `public static class Legacy
{
    public static decimal Fee(string method, decimal weightKg)
    {
        if (weightKg < 0) throw new ArgumentException("negative weight");
        switch (method.ToLowerInvariant())
        {
            case "standard": return 5.00m + 1.20m * weightKg;
            case "express": return Math.Max(15.00m, 12.00m + 2.00m * weightKg);
            case "pickup": return 0m;
            default: throw new ArgumentException("unknown method " + method);
        }
    }
}

public interface IShippingRule
{
    string Method { get; }
    decimal Fee(decimal weightKg);
}

public sealed class StandardShipping : IShippingRule
{
    public string Method => "standard";
    public decimal Fee(decimal weightKg) => throw new NotImplementedException();
}

public sealed class ExpressShipping : IShippingRule
{
    public string Method => "express";
    public decimal Fee(decimal weightKg) => throw new NotImplementedException();
}

public sealed class PickupShipping : IShippingRule
{
    public string Method => "pickup";
    public decimal Fee(decimal weightKg) => throw new NotImplementedException();
}

public sealed class ShippingCalculator(IEnumerable<IShippingRule> rules)
{
    public decimal Fee(string method, decimal weightKg) => throw new NotImplementedException();
}
`,
    hints: [
      'Each rule is one line: public decimal Fee(decimal weightKg) => 5.00m + 1.20m * weightKg;',
      'Build a Dictionary<string, IShippingRule> from rules with StringComparer.OrdinalIgnoreCase in the constructor.',
      'Validate the weight and the lookup in the calculator, not in each rule.',
    ],
    solution: `public static class Legacy
{
    public static decimal Fee(string method, decimal weightKg)
    {
        if (weightKg < 0) throw new ArgumentException("negative weight");
        switch (method.ToLowerInvariant())
        {
            case "standard": return 5.00m + 1.20m * weightKg;
            case "express": return Math.Max(15.00m, 12.00m + 2.00m * weightKg);
            case "pickup": return 0m;
            default: throw new ArgumentException("unknown method " + method);
        }
    }
}

public interface IShippingRule
{
    string Method { get; }
    decimal Fee(decimal weightKg);
}

public sealed class StandardShipping : IShippingRule
{
    public string Method => "standard";
    public decimal Fee(decimal weightKg) => 5.00m + 1.20m * weightKg;
}

public sealed class ExpressShipping : IShippingRule
{
    public string Method => "express";
    public decimal Fee(decimal weightKg) => Math.Max(15.00m, 12.00m + 2.00m * weightKg);
}

public sealed class PickupShipping : IShippingRule
{
    public string Method => "pickup";
    public decimal Fee(decimal weightKg) => 0m;
}

public sealed class ShippingCalculator(IEnumerable<IShippingRule> rules)
{
    private readonly Dictionary<string, IShippingRule> _rules = rules.ToDictionary(r => r.Method, StringComparer.OrdinalIgnoreCase);

    public decimal Fee(string method, decimal weightKg)
    {
        if (weightKg < 0) throw new ArgumentException("Weight cannot be negative.", nameof(weightKg));
        return _rules.TryGetValue(method, out var rule)
            ? rule.Fee(weightKg)
            : throw new ArgumentException($"Unknown shipping method '{method}'.", nameof(method));
    }
}
`,
    testCode: `public sealed class DroneShipping : IShippingRule
{
    public string Method => "drone";
    public decimal Fee(decimal weightKg) => 20m + weightKg;
}
` + csTests(`
ShippingCalculator Calc() => new([new StandardShipping(), new ExpressShipping(), new PickupShipping()]);
foreach (var method in new[] { "standard", "express", "pickup", "EXPRESS" })
    foreach (var w in new[] { 0m, 0.5m, 1m, 1.5m, 2m, 7.25m, 30m })
        Check($"{method} {w}kg matches legacy", () => Calc().Fee(method, w), Legacy.Fee(method, w));
Throws<ArgumentException>("unknown method", () => Calc().Fee("teleport", 1m));
Throws<ArgumentException>("negative weight", () => Calc().Fee("standard", -1m));
Check("new rule without editing calculator", () => new ShippingCalculator([new StandardShipping(), new DroneShipping()]).Fee("Drone", 3m), 23m);
`),
  },
  {
    id: 'cs-1-10',
    title: 'Refactor Behind a Safety Net',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Legacy.Quote is a tangled ticket-pricing method with nested ifs and magic numbers. Rewrite it as CleanPricing.Quote — named constants, ' +
      'guard clauses, small methods — WITHOUT changing behaviour, including its quirks (study the legacy code: some of its rules are odd, ' +
      'and the business relies on them). The tests compare your version with Legacy for hundreds of input combinations. This is how real ' +
      'legacy rescues start: preserve behaviour first, improve later in separate changes.',
    starterCode: `public static class Legacy
{
    // Do not change this class. It is the behaviour you must preserve.
    public static decimal Quote(int age, bool student, DayOfWeek day, int groupSize)
    {
        decimal p = 0;
        if (groupSize <= 0) { return 0; }
        if (age < 3) { p = 0; }
        else
        {
            if (age < 12) { p = 6; }
            else
            {
                if (age >= 65) { p = 7; }
                else { if (student) { p = 9; if (day == DayOfWeek.Tuesday) p = p - 2; } else { p = 12; } }
            }
            if (day == DayOfWeek.Saturday || day == DayOfWeek.Sunday) { p = p + 2; }
        }
        decimal t = p * groupSize;
        if (groupSize >= 10) { t = t * 0.85m; }
        else if (groupSize >= 5 && age >= 12) { t = t * 0.9m; }
        return Math.Round(t, 2);
    }
}

public static class CleanPricing
{
    public static decimal Quote(int age, bool student, DayOfWeek day, int groupSize) =>
        throw new NotImplementedException();
}
`,
    hints: [
      'List the rules the legacy code really implements before writing anything: under 3 free; children 6; seniors (65+) 7; students 9, or 7 on Tuesdays; adults 12; weekend +2 for everyone except under-3s.',
      'Notice the quirks: the 10% group discount for 5–9 people only applies when age >= 12, but the 15% discount for 10+ applies to everyone. Keep them.',
      'Math.Round(t, 2) uses banker\'s rounding by default — use exactly the same call so results match to the last digit.',
    ],
    solution: `public static class Legacy
{
    // Do not change this class. It is the behaviour you must preserve.
    public static decimal Quote(int age, bool student, DayOfWeek day, int groupSize)
    {
        decimal p = 0;
        if (groupSize <= 0) { return 0; }
        if (age < 3) { p = 0; }
        else
        {
            if (age < 12) { p = 6; }
            else
            {
                if (age >= 65) { p = 7; }
                else { if (student) { p = 9; if (day == DayOfWeek.Tuesday) p = p - 2; } else { p = 12; } }
            }
            if (day == DayOfWeek.Saturday || day == DayOfWeek.Sunday) { p = p + 2; }
        }
        decimal t = p * groupSize;
        if (groupSize >= 10) { t = t * 0.85m; }
        else if (groupSize >= 5 && age >= 12) { t = t * 0.9m; }
        return Math.Round(t, 2);
    }
}

public static class CleanPricing
{
    private const int FreeUnderAge = 3, ChildUnderAge = 12, SeniorFromAge = 65;
    private const decimal ChildPrice = 6m, SeniorPrice = 7m, StudentPrice = 9m, StudentTuesdayReduction = 2m, AdultPrice = 12m;
    private const decimal WeekendSurcharge = 2m;
    private const int LargeGroup = 10, MediumGroup = 5;
    private const decimal LargeGroupFactor = 0.85m, MediumGroupFactor = 0.9m;

    public static decimal Quote(int age, bool student, DayOfWeek day, int groupSize)
    {
        if (groupSize <= 0) return 0m;
        decimal total = TicketPrice(age, student, day) * groupSize * GroupFactor(age, groupSize);
        return Math.Round(total, 2);
    }

    private static decimal TicketPrice(int age, bool student, DayOfWeek day)
    {
        if (age < FreeUnderAge) return 0m;
        return BasePrice(age, student, day) + (IsWeekend(day) ? WeekendSurcharge : 0m);
    }

    private static decimal BasePrice(int age, bool student, DayOfWeek day) => age switch
    {
        < ChildUnderAge => ChildPrice,
        >= SeniorFromAge => SeniorPrice,
        _ when student => day == DayOfWeek.Tuesday ? StudentPrice - StudentTuesdayReduction : StudentPrice,
        _ => AdultPrice,
    };

    // Quirk preserved: the medium-group discount only applies to tickets for ages 12 and over.
    private static decimal GroupFactor(int age, int groupSize) => groupSize switch
    {
        >= LargeGroup => LargeGroupFactor,
        >= MediumGroup when age >= ChildUnderAge => MediumGroupFactor,
        _ => 1m,
    };

    private static bool IsWeekend(DayOfWeek day) => day is DayOfWeek.Saturday or DayOfWeek.Sunday;
}
`,
    testCode: csTests(`
int cases = 0, mismatches = 0;
string firstMismatch = "";
foreach (int age in new[] { 0, 2, 3, 11, 12, 30, 64, 65, 90 })
    foreach (bool student in new[] { false, true })
        foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
            foreach (int group in new[] { -1, 0, 1, 4, 5, 9, 10, 13 })
            {
                cases++;
                decimal expected = Legacy.Quote(age, student, day, group);
                decimal actual;
                try { actual = CleanPricing.Quote(age, student, day, group); } catch { actual = -999m; }
                if (actual != expected && mismatches++ == 0) firstMismatch = $"age {age}, student {student}, {day}, group {group}: got {actual}, expected {expected}";
            }
Expect($"all {cases} combinations match legacy", () => mismatches == 0, $"{mismatches} combinations differ; first: {firstMismatch}");
Check("adult weekday", () => CleanPricing.Quote(30, false, DayOfWeek.Monday, 1), 12m);
Check("student tuesday", () => CleanPricing.Quote(20, true, DayOfWeek.Tuesday, 1), 7m);
Check("children medium group (quirk: no discount)", () => CleanPricing.Quote(8, false, DayOfWeek.Monday, 5), 30m);
Check("large group weekend", () => CleanPricing.Quote(40, false, DayOfWeek.Sunday, 10), 119m);
`),
  },
  {
    id: 'cs-1-11',
    title: 'A Caching Decorator with Expiry',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement CachingExchangeRates, a decorator around any IExchangeRates. It returns a cached rate when one was fetched for that currency ' +
      'less than ttl ago (according to the injected TimeProvider), otherwise calls the wrapped service and caches the answer. Currency codes are ' +
      'case-insensitive. Failures from the wrapped service must not be cached. Invalidate(currency) removes one entry. The wrapped class must ' +
      'not change — that is the point of a decorator.',
    starterCode: `public interface IExchangeRates
{
    Task<decimal> GetRateAsync(string currency, CancellationToken ct);
}

public sealed class CachingExchangeRates(IExchangeRates inner, TimeProvider time, TimeSpan ttl) : IExchangeRates
{
    public Task<decimal> GetRateAsync(string currency, CancellationToken ct) => throw new NotImplementedException();

    public void Invalidate(string currency) => throw new NotImplementedException();
}
`,
    hints: [
      'Store (decimal Rate, DateTimeOffset FetchedAt) per currency in a Dictionary with StringComparer.OrdinalIgnoreCase.',
      'A cache entry is fresh while time.GetUtcNow() - fetchedAt < ttl.',
      'Only store the rate after the inner call returns successfully; an exception skips the store automatically.',
    ],
    solution: `public interface IExchangeRates
{
    Task<decimal> GetRateAsync(string currency, CancellationToken ct);
}

public sealed class CachingExchangeRates(IExchangeRates inner, TimeProvider time, TimeSpan ttl) : IExchangeRates
{
    private readonly Dictionary<string, (decimal Rate, DateTimeOffset FetchedAt)> _cache = new(StringComparer.OrdinalIgnoreCase);

    public async Task<decimal> GetRateAsync(string currency, CancellationToken ct)
    {
        var now = time.GetUtcNow();
        if (_cache.TryGetValue(currency, out var entry) && now - entry.FetchedAt < ttl) return entry.Rate;
        decimal rate = await inner.GetRateAsync(currency, ct);
        _cache[currency] = (rate, now);
        return rate;
    }

    public void Invalidate(string currency) => _cache.Remove(currency);
}
`,
    testCode: `public sealed class CountingRates : IExchangeRates
{
    public int Calls;
    public bool Fail;
    public decimal Next = 15.2m;
    public Task<decimal> GetRateAsync(string currency, CancellationToken ct)
    {
        Calls++;
        if (Fail) throw new IOException("rates service down");
        return Task.FromResult(Next);
    }
}

public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}
` + csTests(`
var ttl = TimeSpan.FromMinutes(5);
var none = CancellationToken.None;
(CachingExchangeRates Cache, CountingRates Inner, TestTime Time) Setup()
{
    var inner = new CountingRates();
    var t = new TestTime(new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero));
    return (new CachingExchangeRates(inner, t, ttl), inner, t);
}
await CheckAsync("first call fetches", async () => { var s = Setup(); return (await s.Cache.GetRateAsync("USD", none), s.Inner.Calls); }, (15.2m, 1));
await CheckAsync("second call cached", async () => { var s = Setup(); await s.Cache.GetRateAsync("USD", none); await s.Cache.GetRateAsync("USD", none); return s.Inner.Calls; }, 1);
await CheckAsync("case-insensitive", async () => { var s = Setup(); await s.Cache.GetRateAsync("usd", none); await s.Cache.GetRateAsync("USD", none); return s.Inner.Calls; }, 1);
await CheckAsync("other currency fetched separately", async () => { var s = Setup(); await s.Cache.GetRateAsync("USD", none); await s.Cache.GetRateAsync("EUR", none); return s.Inner.Calls; }, 2);
await CheckAsync("expires after ttl", async () => { var s = Setup(); await s.Cache.GetRateAsync("USD", none); s.Time.Now += ttl; s.Inner.Next = 16m; return (await s.Cache.GetRateAsync("USD", none), s.Inner.Calls); }, (16m, 2));
await CheckAsync("fresh just before ttl", async () => { var s = Setup(); await s.Cache.GetRateAsync("USD", none); s.Time.Now += ttl - TimeSpan.FromSeconds(1); await s.Cache.GetRateAsync("USD", none); return s.Inner.Calls; }, 1);
await CheckAsync("failures not cached", async () => { var s = Setup(); s.Inner.Fail = true; try { await s.Cache.GetRateAsync("USD", none); } catch (IOException) { } s.Inner.Fail = false; return (await s.Cache.GetRateAsync("USD", none), s.Inner.Calls); }, (15.2m, 2));
await CheckAsync("invalidate", async () => { var s = Setup(); await s.Cache.GetRateAsync("USD", none); s.Cache.Invalidate("usd"); await s.Cache.GetRateAsync("USD", none); return s.Inner.Calls; }, 2);
Expect("is an IExchangeRates", () => typeof(IExchangeRates).IsAssignableFrom(typeof(CachingExchangeRates)), "a decorator implements the same interface it wraps");
`),
  },
  {
    id: 'cs-1-12',
    title: 'Observer: Low-Stock Events',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement StockMonitor with two C# events. LowStock (EventHandler<StockEventArgs>) fires when a SKU\'s quantity drops BELOW its ' +
      'threshold — but only at the moment it crosses, not on every further removal. Restocked fires when a SKU that was low rises back to ' +
      'its threshold or above. Remove(sku, qty) throws InvalidOperationException if it would make stock negative, without changing anything. ' +
      'Add, SetThreshold and Quantity complete the API. Unknown SKUs start at 0 with a threshold of 0.',
    starterCode: `public sealed class StockEventArgs(string sku, int quantity) : EventArgs
{
    public string Sku { get; } = sku;
    public int Quantity { get; } = quantity;
}

public sealed class StockMonitor
{
    public event EventHandler<StockEventArgs>? LowStock;
    public event EventHandler<StockEventArgs>? Restocked;

    public void SetThreshold(string sku, int threshold) => throw new NotImplementedException();

    public void Add(string sku, int quantity) => throw new NotImplementedException();

    public void Remove(string sku, int quantity) => throw new NotImplementedException();

    public int Quantity(string sku) => throw new NotImplementedException();
}
`,
    hints: [
      'Track quantities and thresholds in dictionaries. A SKU is "low" when quantity < threshold.',
      'Compute wasLow before the change and isLow after it; fire LowStock only when !wasLow && isLow, and Restocked only when wasLow && !isLow.',
      'Raise events with LowStock?.Invoke(this, new StockEventArgs(sku, newQuantity)).',
    ],
    solution: `public sealed class StockEventArgs(string sku, int quantity) : EventArgs
{
    public string Sku { get; } = sku;
    public int Quantity { get; } = quantity;
}

public sealed class StockMonitor
{
    private readonly Dictionary<string, int> _stock = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, int> _thresholds = new(StringComparer.OrdinalIgnoreCase);

    public event EventHandler<StockEventArgs>? LowStock;
    public event EventHandler<StockEventArgs>? Restocked;

    public void SetThreshold(string sku, int threshold)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(threshold);
        Change(sku, () => _thresholds[sku] = threshold);
    }

    public void Add(string sku, int quantity)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        Change(sku, () => _stock[sku] = Quantity(sku) + quantity);
    }

    public void Remove(string sku, int quantity)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        if (quantity > Quantity(sku)) throw new InvalidOperationException($"Only {Quantity(sku)} of {sku} in stock.");
        Change(sku, () => _stock[sku] = Quantity(sku) - quantity);
    }

    public int Quantity(string sku) => _stock.GetValueOrDefault(sku);

    private bool IsLow(string sku) => Quantity(sku) < _thresholds.GetValueOrDefault(sku);

    private void Change(string sku, Action change)
    {
        bool wasLow = IsLow(sku);
        change();
        bool isLow = IsLow(sku);
        if (!wasLow && isLow) LowStock?.Invoke(this, new StockEventArgs(sku, Quantity(sku)));
        if (wasLow && !isLow) Restocked?.Invoke(this, new StockEventArgs(sku, Quantity(sku)));
    }
}
`,
    testCode: csTests(`
(StockMonitor M, List<string> Log) Setup()
{
    var m = new StockMonitor();
    var log = new List<string>();
    m.LowStock += (_, e) => log.Add($"low {e.Sku} {e.Quantity}");
    m.Restocked += (_, e) => log.Add($"restocked {e.Sku} {e.Quantity}");
    m.Add("PEN", 20);
    m.SetThreshold("PEN", 5);
    return (m, log);
}
CheckSeq("no event above threshold", () => { var s = Setup(); s.M.Remove("PEN", 10); return s.Log; }, []);
CheckSeq("event when crossing below", () => { var s = Setup(); s.M.Remove("PEN", 16); return s.Log; }, ["low PEN 4"]);
CheckSeq("exactly at threshold is not low", () => { var s = Setup(); s.M.Remove("PEN", 15); return s.Log; }, []);
CheckSeq("only once while low", () => { var s = Setup(); s.M.Remove("PEN", 16); s.M.Remove("PEN", 1); s.M.Remove("PEN", 1); return s.Log; }, ["low PEN 4"]);
CheckSeq("restocked", () => { var s = Setup(); s.M.Remove("PEN", 16); s.M.Add("PEN", 10); return s.Log; }, ["low PEN 4", "restocked PEN 14"]);
CheckSeq("low again after restock", () => { var s = Setup(); s.M.Remove("PEN", 16); s.M.Add("PEN", 1); s.M.Add("PEN", 10); s.M.Remove("PEN", 12); return s.Log; }, ["low PEN 4", "restocked PEN 5", "low PEN 3"]);
CheckSeq("raising threshold can trigger", () => { var s = Setup(); s.M.SetThreshold("PEN", 25); return s.Log; }, ["low PEN 20"]);
Check("refused removal changes nothing", () => { var s = Setup(); try { s.M.Remove("PEN", 21); } catch (InvalidOperationException) { } return s.M.Quantity("PEN"); }, 20);
Throws<InvalidOperationException>("cannot go negative", () => Setup().M.Remove("PEN", 21));
Check("unknown sku is zero", () => new StockMonitor().Quantity("??"), 0);
`),
  },
  {
    id: 'cs-1-13',
    title: 'Write Tests That Catch Bugs (Mutation-Graded)',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'This time YOU write the tests. Grades.Letter(score) gives A (80–100), B (70–79), C (60–69), D (50–59), F (0–49) and throws ' +
      'ArgumentOutOfRangeException outside 0–100. Complete LearnerTests.Run(letter): return one bool per check you make on the function you ' +
      'are given. The grader runs your checks against the correct implementation (all must be true) and against six versions with planted ' +
      'bugs — each must make at least one of your checks false. Choose your cases with equivalence classes and boundary values.',
    starterCode: `public static class LearnerTests
{
    /// <summary>Return one bool per check: true means the function behaved correctly.</summary>
    public static IEnumerable<bool> Run(Func<int, string> letter)
    {
        // Example check (keep it, then add your own):
        yield return letter(95) == "A";

        // TODO: add checks that would expose off-by-one boundaries and missing validation.
        // Throws(() => letter(-1)) is true when calling letter(-1) throws ArgumentOutOfRangeException.
    }

    private static bool Throws(Action action)
    {
        try { action(); return false; }
        catch (ArgumentOutOfRangeException) { return true; }
        catch { return false; }
    }
}
`,
    hints: [
      'Each grade band has two edges. Test both sides of every edge: 79 and 80, 69 and 70, 59 and 60, 49 and 50.',
      'Test the outer edges too: 0 and 100 are valid; -1 and 101 must throw.',
      'Wrap a call that might throw in a lambda — yield return Throws(() => letter(101)); — so your checks never crash.',
    ],
    solution: `public static class LearnerTests
{
    public static IEnumerable<bool> Run(Func<int, string> letter)
    {
        yield return letter(95) == "A";
        yield return letter(100) == "A";
        yield return letter(80) == "A";
        yield return letter(79) == "B";
        yield return letter(70) == "B";
        yield return letter(69) == "C";
        yield return letter(60) == "C";
        yield return letter(59) == "D";
        yield return letter(50) == "D";
        yield return letter(49) == "F";
        yield return letter(0) == "F";
        yield return Throws(() => letter(-1));
        yield return Throws(() => letter(101));
    }

    private static bool Throws(Action action)
    {
        try { action(); return false; }
        catch (ArgumentOutOfRangeException) { return true; }
        catch { return false; }
    }
}
`,
    testCode: mutationTests('grade function', GRADE_CORRECT, [
      ['80 is graded B (> instead of >=)', 's => s switch { < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(s)), > 80 => "A", >= 70 => "B", >= 60 => "C", >= 50 => "D", _ => "F" }'],
      ['70 is graded C', 's => s switch { < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(s)), >= 80 => "A", > 70 => "B", >= 60 => "C", >= 50 => "D", _ => "F" }'],
      ['59 is graded C', 's => s switch { < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(s)), >= 80 => "A", >= 70 => "B", >= 59 => "C", >= 50 => "D", _ => "F" }'],
      ['the D band is missing', 's => s switch { < 0 or > 100 => throw new ArgumentOutOfRangeException(nameof(s)), >= 80 => "A", >= 70 => "B", >= 60 => "C", _ => "F" }'],
      ['101 is accepted as A', 's => s switch { < 0 => throw new ArgumentOutOfRangeException(nameof(s)), >= 80 => "A", >= 70 => "B", >= 60 => "C", >= 50 => "D", _ => "F" }'],
      ['negative scores are graded F', 's => s switch { > 100 => throw new ArgumentOutOfRangeException(nameof(s)), >= 80 => "A", >= 70 => "B", >= 60 => "C", >= 50 => "D", _ => "F" }'],
    ]),
  },
  {
    id: 'cs-1-14',
    title: 'Build Your Own Test Doubles',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Write the doubles a team needs to test ReminderService (given). FakeTime is a TimeProvider that starts at a chosen instant and moves ' +
      'only when Advance(TimeSpan) is called. SpyNotifier implements INotifier and records every message in Sent as (MemberId, Message) in ' +
      'order. StubLoans implements ILoanStore and returns whatever list of loans was given to its constructor. The grader uses your doubles to ' +
      'test ReminderService — so they must behave exactly as described.',
    starterCode: `// ---- Given: the code under test ----
public sealed record Loan(string MemberId, string Title, DateOnly DueOn);

public interface ILoanStore { IReadOnlyList<Loan> ActiveLoans(); }

public interface INotifier { void Notify(string memberId, string message); }

public sealed class ReminderService(ILoanStore loans, INotifier notifier, TimeProvider time)
{
    /// <summary>Reminds members whose loans are due tomorrow or are overdue. Returns how many were sent.</summary>
    public int SendReminders()
    {
        var today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);
        int sent = 0;
        foreach (var loan in loans.ActiveLoans())
        {
            if (loan.DueOn == today.AddDays(1)) { notifier.Notify(loan.MemberId, $"'{loan.Title}' is due tomorrow."); sent++; }
            else if (loan.DueOn < today) { notifier.Notify(loan.MemberId, $"'{loan.Title}' is overdue."); sent++; }
        }
        return sent;
    }
}

// ---- Yours: the test doubles ----
public sealed class FakeTime(DateTimeOffset start) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => throw new NotImplementedException();
    public void Advance(TimeSpan by) => throw new NotImplementedException();
}

public sealed class SpyNotifier : INotifier
{
    public List<(string MemberId, string Message)> Sent { get; } = [];
    public void Notify(string memberId, string message) => throw new NotImplementedException();
}

public sealed class StubLoans(IReadOnlyList<Loan> loans) : ILoanStore
{
    public IReadOnlyList<Loan> ActiveLoans() => throw new NotImplementedException();
}
`,
    hints: [
      'FakeTime needs one private field holding the current instant, initialised from start.',
      'Advance adds the TimeSpan to that field; GetUtcNow returns it.',
      'SpyNotifier.Notify appends (memberId, message) to Sent; StubLoans returns the list it was given.',
    ],
    solution: `public sealed record Loan(string MemberId, string Title, DateOnly DueOn);

public interface ILoanStore { IReadOnlyList<Loan> ActiveLoans(); }

public interface INotifier { void Notify(string memberId, string message); }

public sealed class ReminderService(ILoanStore loans, INotifier notifier, TimeProvider time)
{
    public int SendReminders()
    {
        var today = DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);
        int sent = 0;
        foreach (var loan in loans.ActiveLoans())
        {
            if (loan.DueOn == today.AddDays(1)) { notifier.Notify(loan.MemberId, $"'{loan.Title}' is due tomorrow."); sent++; }
            else if (loan.DueOn < today) { notifier.Notify(loan.MemberId, $"'{loan.Title}' is overdue."); sent++; }
        }
        return sent;
    }
}

public sealed class FakeTime(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset _now = start;
    public override DateTimeOffset GetUtcNow() => _now;
    public void Advance(TimeSpan by) => _now += by;
}

public sealed class SpyNotifier : INotifier
{
    public List<(string MemberId, string Message)> Sent { get; } = [];
    public void Notify(string memberId, string message) => Sent.Add((memberId, message));
}

public sealed class StubLoans(IReadOnlyList<Loan> loans) : ILoanStore
{
    public IReadOnlyList<Loan> ActiveLoans() => loans;
}
`,
    testCode: csTests(`
var start = new DateTimeOffset(2026, 4, 10, 8, 0, 0, TimeSpan.Zero);
Check("fake time starts", () => new FakeTime(start).GetUtcNow(), start);
Check("fake time advances", () => { var t = new FakeTime(start); t.Advance(TimeSpan.FromDays(2)); t.Advance(TimeSpan.FromHours(3)); return t.GetUtcNow(); }, start.AddDays(2).AddHours(3));
Check("fake time does not drift", () => { var t = new FakeTime(start); return t.GetUtcNow() == t.GetUtcNow() && t.GetUtcNow() == start; }, true);
CheckSeq("spy records in order", () => { var s = new SpyNotifier(); s.Notify("a", "1"); s.Notify("b", "2"); return s.Sent; }, [("a", "1"), ("b", "2")]);
Check("stub returns loans", () => new StubLoans([new("m", "T", new DateOnly(2026, 1, 1))]).ActiveLoans().Count, 1);
List<Loan> loans = [new("m1", "Clean Code", new DateOnly(2026, 4, 11)), new("m2", "Refactoring", new DateOnly(2026, 4, 9)), new("m3", "SICP", new DateOnly(2026, 4, 20))];
Check("service: due tomorrow and overdue", () => { var spy = new SpyNotifier(); return new ReminderService(new StubLoans(loans), spy, new FakeTime(start)).SendReminders(); }, 2);
CheckSeq("service: messages", () => { var spy = new SpyNotifier(); new ReminderService(new StubLoans(loans), spy, new FakeTime(start)).SendReminders(); return spy.Sent; }, [("m1", "'Clean Code' is due tomorrow."), ("m2", "'Refactoring' is overdue.")]);
Check("service: after advancing nine days", () => { var spy = new SpyNotifier(); var t = new FakeTime(start); t.Advance(TimeSpan.FromDays(9)); return new ReminderService(new StubLoans(loans), spy, t).SendReminders(); }, 3);
`),
  },
  {
    id: 'cs-1-15',
    title: 'Binary Search and Lower Bound',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Search.LowerBound<T>(sorted, target, comparer): the index of the first element that is not less than target (sorted.Count if ' +
      'every element is smaller). Then BinarySearch (index of any element equal to target, or -1) and CountEqual (how many elements equal ' +
      'target) using LowerBound — no linear scans. The grader counts comparisons: on a million items each call must use at most 50.',
    starterCode: `public static class Search
{
    public static int LowerBound<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer) =>
        throw new NotImplementedException();

    public static int BinarySearch<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer) =>
        throw new NotImplementedException();

    public static int CountEqual<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer) =>
        throw new NotImplementedException();
}
`,
    hints: [
      'Keep a half-open range [low, high) starting as [0, Count). While low < high: mid = low + (high - low) / 2; if sorted[mid] < target then low = mid + 1 else high = mid.',
      'BinarySearch: i = LowerBound(...); return i < Count && comparer.Compare(sorted[i], target) == 0 ? i : -1.',
      'CountEqual needs an "upper bound" (first element greater than target): the same loop with <= instead of <. The count is upper − lower.',
    ],
    solution: `public static class Search
{
    public static int LowerBound<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer)
    {
        int low = 0, high = sorted.Count;
        while (low < high)
        {
            int mid = low + (high - low) / 2;
            if (comparer.Compare(sorted[mid], target) < 0) low = mid + 1;
            else high = mid;
        }
        return low;
    }

    private static int UpperBound<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer)
    {
        int low = 0, high = sorted.Count;
        while (low < high)
        {
            int mid = low + (high - low) / 2;
            if (comparer.Compare(sorted[mid], target) <= 0) low = mid + 1;
            else high = mid;
        }
        return low;
    }

    public static int BinarySearch<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer)
    {
        int i = LowerBound(sorted, target, comparer);
        return i < sorted.Count && comparer.Compare(sorted[i], target) == 0 ? i : -1;
    }

    public static int CountEqual<T>(IReadOnlyList<T> sorted, T target, IComparer<T> comparer) =>
        UpperBound(sorted, target, comparer) - LowerBound(sorted, target, comparer);
}
`,
    testCode: `public sealed class CountingComparer : IComparer<int>
{
    public int Count;
    public int Compare(int x, int y) { Count++; return x.CompareTo(y); }
}
` + csTests(`
var cmp = Comparer<int>.Default;
int[] small = [1, 3, 3, 3, 7, 9];
Check("lower bound of 3", () => Search.LowerBound(small, 3, cmp), 1);
Check("lower bound of 4", () => Search.LowerBound(small, 4, cmp), 4);
Check("lower bound past end", () => Search.LowerBound(small, 10, cmp), 6);
Check("lower bound before start", () => Search.LowerBound(small, 0, cmp), 0);
Check("lower bound empty", () => Search.LowerBound(Array.Empty<int>(), 5, cmp), 0);
Check("found", () => small[Search.BinarySearch(small, 7, cmp)], 7);
Check("not found", () => Search.BinarySearch(small, 4, cmp), -1);
Check("count of 3", () => Search.CountEqual(small, 3, cmp), 3);
Check("count missing", () => Search.CountEqual(small, 5, cmp), 0);
var million = Enumerable.Range(0, 1_000_000).Select(i => i * 2).ToArray();
Check("big search", () => Search.BinarySearch(million, 1_234_566, cmp), 617_283);
Expect("logarithmic lower bound", () => { var c = new CountingComparer(); Search.LowerBound(million, 999_999, c); return c.Count <= 50; }, "more than 50 comparisons on a million items — is something scanning linearly?");
Expect("logarithmic count", () => { var c = new CountingComparer(); return Search.CountEqual(million, 777_778, c) == 1 && c.Count <= 50; }, "CountEqual must use binary searches, not a scan");
`),
  },
  {
    id: 'cs-1-16',
    title: 'Fix the Quadratic Dedupe and Find the Top K',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Two production-scale problems. Dedupe(customers) keeps the first customer for each email (case-insensitive) in original order — the ' +
      'current implementation scans the result list for every customer, which is O(n²); make it O(n). TopK(values, k) returns the k largest ' +
      'values, largest first, using a PriorityQueue of size at most k (O(n log k)) rather than sorting everything. The grader counts how many ' +
      'times Customer.Email is read and how many items your queue holds.',
    starterCode: `public sealed class Customer(string name, string email)
{
    public static int EmailReads;
    public string Name { get; } = name;
    public string Email { get { EmailReads++; return email; } }
}

public static class Scale
{
    public static List<Customer> Dedupe(IEnumerable<Customer> customers)
    {
        // Correct but O(n²): fix the complexity, keep the behaviour.
        var unique = new List<Customer>();
        foreach (var c in customers)
            if (!unique.Any(u => string.Equals(u.Email, c.Email, StringComparison.OrdinalIgnoreCase)))
                unique.Add(c);
        return unique;
    }

    /// <summary>maxQueueSize must report the largest number of items your PriorityQueue held.</summary>
    public static List<int> TopK(IEnumerable<int> values, int k, out int maxQueueSize) =>
        throw new NotImplementedException();
}
`,
    hints: [
      'Dedupe: a HashSet<string> with StringComparer.OrdinalIgnoreCase of emails seen; read each customer\'s Email once into a local.',
      'TopK: a min-heap PriorityQueue<int, int> keyed by the value itself. Enqueue each value; when Count exceeds k, Dequeue the smallest.',
      'At the end, dequeue everything (smallest first) and reverse to get largest first. Track the maximum Count you saw.',
    ],
    solution: `public sealed class Customer(string name, string email)
{
    public static int EmailReads;
    public string Name { get; } = name;
    public string Email { get { EmailReads++; return email; } }
}

public static class Scale
{
    public static List<Customer> Dedupe(IEnumerable<Customer> customers)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var unique = new List<Customer>();
        foreach (var c in customers)
            if (seen.Add(c.Email)) unique.Add(c);
        return unique;
    }

    public static List<int> TopK(IEnumerable<int> values, int k, out int maxQueueSize)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(k);
        var heap = new PriorityQueue<int, int>();
        maxQueueSize = 0;
        if (k == 0) return [];
        foreach (int v in values)
        {
            heap.Enqueue(v, v);
            if (heap.Count > k) heap.Dequeue();
            maxQueueSize = Math.Max(maxQueueSize, heap.Count);
        }
        var result = new List<int>(heap.Count);
        while (heap.Count > 0) result.Add(heap.Dequeue());
        result.Reverse();
        return result;
    }
}
`,
    testCode: csTests(`
List<Customer> sample = [new("Ama", "a@x.com"), new("Kofi", "k@x.com"), new("Ama 2", "A@X.com"), new("Esi", "e@x.com")];
CheckSeq("keeps first per email", () => Scale.Dedupe(sample).Select(c => c.Name), ["Ama", "Kofi", "Esi"]);
CheckSeq("empty", () => Scale.Dedupe([]).Select(c => c.Name), []);
var many = Enumerable.Range(0, 20_000).Select(i => new Customer("c" + i, "user" + (i % 15_000) + "@x.com")).ToList();
Expect("dedupe is linear", () => { Customer.EmailReads = 0; var r = Scale.Dedupe(many); return r.Count == 15_000 && Customer.EmailReads <= 2 * many.Count; }, "Email was read far more than twice per customer — the algorithm is still quadratic");
CheckSeq("top 3", () => Scale.TopK([5, 1, 9, 3, 7, 9], 3, out _), [9, 9, 7]);
CheckSeq("k larger than input", () => Scale.TopK([2, 1], 5, out _), [2, 1]);
CheckSeq("k zero", () => Scale.TopK([2, 1], 0, out _), []);
var rnd = new Random(42);
var big = Enumerable.Range(0, 100_000).Select(_ => rnd.Next(1_000_000)).ToList();
CheckSeq("top 5 of 100k", () => Scale.TopK(big, 5, out _), big.OrderByDescending(x => x).Take(5));
Expect("queue never exceeds k + 1", () => { Scale.TopK(big, 10, out int max); return max <= 11; }, "the priority queue grew beyond k items — evict the smallest as you go");
`),
  },
];
