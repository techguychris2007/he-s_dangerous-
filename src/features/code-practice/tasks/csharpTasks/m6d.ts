import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 6 · System Design';

/** Month 6, week 24 (lessons dn6-7, dn6-8): the tools a capstone needs to launch safely and to defend
 *  its claims with evidence. */
export const CSHARP_MONTH6_D_TASKS: CodeTask[] = [
  {
    id: 'cs-6-13',
    title: 'Feature Flags: Stable Rollouts and a Kill Switch',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Launch the capstone\'s riskiest feature to 5% of users, then 25%, then everyone — and switch it off in seconds if it misbehaves, ' +
      'without a deployment. FeatureFlags.Bucket(flag, userId) is 32-bit FNV-1a over the UTF-8 bytes of flag + ":" + userId, modulo 100, ' +
      'so a user always lands in the same bucket for a flag (no flickering between requests) and different flags get independent cohorts. ' +
      'Set(rule) stores a FlagRule (RolloutPercent outside 0–100 is an ArgumentOutOfRangeException). IsOn(flag, userId): an unknown flag is ' +
      'off; Enabled = false is the kill switch and turns the flag off for everyone, allow list included; a blocked user is off; an allowed ' +
      'user is on; everyone else is on when their bucket is below RolloutPercent. Raising the percentage must only ever add users.',
    starterCode: `public sealed record FlagRule(string Flag, bool Enabled, int RolloutPercent, IReadOnlyList<string> AllowList, IReadOnlyList<string> BlockList);

public sealed class FeatureFlags
{
    public void Set(FlagRule rule) => throw new NotImplementedException();
    public bool IsOn(string flag, string userId) => throw new NotImplementedException();
    public static int Bucket(string flag, string userId) => throw new NotImplementedException();
}
`,
    hints: [
      'FNV-1a: uint h = 2166136261; foreach (byte b in Encoding.UTF8.GetBytes(flag + ":" + userId)) { h ^= b; h = unchecked(h * 16777619); } return (int)(h % 100);',
      'Check in this order: unknown flag, kill switch, block list, allow list, bucket < RolloutPercent.',
      'Because a user\'s bucket never changes, everyone below 10 is also below 25: rollouts only grow.',
    ],
    solution: `using System.Text;

public sealed record FlagRule(string Flag, bool Enabled, int RolloutPercent, IReadOnlyList<string> AllowList, IReadOnlyList<string> BlockList);

public sealed class FeatureFlags
{
    private readonly Dictionary<string, FlagRule> _rules = new(StringComparer.Ordinal);

    public void Set(FlagRule rule)
    {
        if (rule.RolloutPercent is < 0 or > 100) throw new ArgumentOutOfRangeException(nameof(rule), "RolloutPercent is 0–100.");
        _rules[rule.Flag] = rule;
    }

    public bool IsOn(string flag, string userId)
    {
        if (!_rules.TryGetValue(flag, out var rule)) return false;
        if (!rule.Enabled) return false;                          // kill switch beats everything
        if (rule.BlockList.Contains(userId)) return false;
        if (rule.AllowList.Contains(userId)) return true;
        return Bucket(flag, userId) < rule.RolloutPercent;
    }

    public static int Bucket(string flag, string userId)
    {
        uint hash = 2166136261;
        foreach (byte b in Encoding.UTF8.GetBytes(flag + ":" + userId))
        {
            hash ^= b;
            hash = unchecked(hash * 16777619);
        }
        return (int)(hash % 100);
    }
}
`,
    testCode: csTests(`
FlagRule Rule(int percent, bool enabled = true, string[]? allow = null, string[]? block = null) => new("new-checkout", enabled, percent, allow ?? [], block ?? []);
FeatureFlags Flags(FlagRule rule) { var f = new FeatureFlags(); f.Set(rule); return f; }
var users = Enumerable.Range(0, 10_000).Select(i => "u" + i).ToList();
CheckSeq("buckets are stable FNV-1a values", () => new[] { FeatureFlags.Bucket("new-checkout", "user-1"), FeatureFlags.Bucket("new-checkout", "user-2"), FeatureFlags.Bucket("dark-mode", "user-1") }, [63, 82, 58]);
Check("an unknown flag is off", () => new FeatureFlags().IsOn("nope", "user-1"), false);
Check("0% is nobody, 100% is everybody", () => users.Count(u => Flags(Rule(0)).IsOn("new-checkout", u)) + ":" + users.Count(u => Flags(Rule(100)).IsOn("new-checkout", u)), "0:10000");
Check("10% reaches about a tenth of users", () => users.Count(u => Flags(Rule(10)).IsOn("new-checkout", u)), 992);
Expect("raising the rollout only adds users", () =>
{
    var at10 = Flags(Rule(10));
    var at25 = Flags(Rule(25));
    return users.All(u => !at10.IsOn("new-checkout", u) || at25.IsOn("new-checkout", u));
}, "someone in the 10% cohort lost the feature at 25%");
Check("a user gets the same answer every time", () => { var f = Flags(Rule(50)); return Enumerable.Range(0, 20).Select(_ => f.IsOn("new-checkout", "user-1")).Distinct().Count(); }, 1);
Check("different flags pick different cohorts", () =>
{
    var f = new FeatureFlags();
    f.Set(Rule(10));
    f.Set(new FlagRule("dark-mode", true, 10, [], []));
    return users.Count(u => f.IsOn("new-checkout", u) && f.IsOn("dark-mode", u));
}, 85);
Check("the allow list gets it early", () => Flags(Rule(0, allow: ["tester-ama"])).IsOn("new-checkout", "tester-ama"), true);
Check("the block list wins over the rollout and the allow list", () => Flags(Rule(100, allow: ["kofi"], block: ["kofi"])).IsOn("new-checkout", "kofi"), false);
Check("the kill switch turns it off for everyone", () => { var f = Flags(Rule(100, enabled: false, allow: ["tester-ama"])); return users.Any(u => f.IsOn("new-checkout", u)) || f.IsOn("new-checkout", "tester-ama"); }, false);
Throws<ArgumentOutOfRangeException>("percentages are 0–100", () => new FeatureFlags().Set(Rule(101)));
`),
  },
  {
    id: 'cs-6-14',
    title: 'A Readiness Check That Cannot Hang',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'The platform sends traffic to a replica only while /health/ready says so, so the readiness check itself must be fast and honest. ' +
      'Readiness.EvaluateAsync(checks, timeoutPerCheck) runs every DependencyCheck concurrently (not one after another) and gives each its own ' +
      'timeout. A probe that returns false fails; one that throws fails with the exception\'s message as Error; one that has not finished ' +
      'within the timeout fails with Error "timed out" (cancel its token). Report each check in the order given, as CheckResult(Name, Status, ' +
      'Duration, Error). Overall: any failed critical check → Unhealthy; otherwise any failed non-critical check → Degraded; otherwise Healthy. ' +
      'Readiness.HttpStatus(report) is 503 for Unhealthy and 200 otherwise — a degraded replica still serves traffic.',
    starterCode: `public enum HealthStatus { Healthy, Degraded, Unhealthy }

public sealed record DependencyCheck(string Name, bool Critical, Func<CancellationToken, Task<bool>> Probe);
public sealed record CheckResult(string Name, HealthStatus Status, TimeSpan Duration, string? Error);
public sealed record HealthReport(HealthStatus Status, IReadOnlyList<CheckResult> Checks);

public static class Readiness
{
    public static Task<HealthReport> EvaluateAsync(IEnumerable<DependencyCheck> checks, TimeSpan timeoutPerCheck) => throw new NotImplementedException();
    public static int HttpStatus(HealthReport report) => throw new NotImplementedException();
}
`,
    hints: [
      'Start every probe first (checks.Select(RunOneAsync).ToList()), then await Task.WhenAll — starting them inside a foreach with await would run them one by one.',
      'For one probe: using var cts = new CancellationTokenSource(); var probe = check.Probe(cts.Token); var winner = await Task.WhenAny(probe, Task.Delay(timeout)); if (winner != probe) { cts.Cancel(); … "timed out" }.',
      'Wrap the probe call and the await of the finished probe in try/catch: probes can throw synchronously or asynchronously.',
    ],
    solution: `using System.Diagnostics;

public enum HealthStatus { Healthy, Degraded, Unhealthy }

public sealed record DependencyCheck(string Name, bool Critical, Func<CancellationToken, Task<bool>> Probe);
public sealed record CheckResult(string Name, HealthStatus Status, TimeSpan Duration, string? Error);
public sealed record HealthReport(HealthStatus Status, IReadOnlyList<CheckResult> Checks);

public static class Readiness
{
    public static async Task<HealthReport> EvaluateAsync(IEnumerable<DependencyCheck> checks, TimeSpan timeoutPerCheck)
    {
        var list = checks.ToList();
        var results = await Task.WhenAll(list.Select(c => RunAsync(c, timeoutPerCheck)));   // all at once
        var failedCritical = list.Zip(results).Any(p => p.First.Critical && p.Second.Status != HealthStatus.Healthy);
        var failedAny = results.Any(r => r.Status != HealthStatus.Healthy);
        var overall = failedCritical ? HealthStatus.Unhealthy : failedAny ? HealthStatus.Degraded : HealthStatus.Healthy;
        return new HealthReport(overall, results);
    }

    private static async Task<CheckResult> RunAsync(DependencyCheck check, TimeSpan timeout)
    {
        var failed = check.Critical ? HealthStatus.Unhealthy : HealthStatus.Degraded;
        var watch = Stopwatch.StartNew();
        using var cts = new CancellationTokenSource();
        try
        {
            var probe = check.Probe(cts.Token);
            var winner = await Task.WhenAny(probe, Task.Delay(timeout));
            if (winner != probe)
            {
                cts.Cancel();
                return new CheckResult(check.Name, failed, watch.Elapsed, "timed out");
            }
            return await probe
                ? new CheckResult(check.Name, HealthStatus.Healthy, watch.Elapsed, null)
                : new CheckResult(check.Name, failed, watch.Elapsed, "probe reported unhealthy");
        }
        catch (Exception e)
        {
            return new CheckResult(check.Name, failed, watch.Elapsed, e.Message);
        }
    }

    public static int HttpStatus(HealthReport report) => report.Status == HealthStatus.Unhealthy ? 503 : 200;
}
`,
    testCode: csTests(`
DependencyCheck Ok(string name, bool critical = true) => new(name, critical, _ => Task.FromResult(true));
DependencyCheck Down(string name, bool critical = true) => new(name, critical, _ => Task.FromResult(false));
DependencyCheck Crashes(string name, bool critical = true) => new(name, critical, async _ => { await Task.Yield(); throw new InvalidOperationException("connection refused"); });
DependencyCheck Hangs(string name, bool critical, Action<bool>? cancelled = null) => new(name, critical, ct => { var tcs = new TaskCompletionSource<bool>(); ct.Register(() => cancelled?.Invoke(true)); return tcs.Task; });
var timeout = TimeSpan.FromMilliseconds(50);
string Summary(HealthReport r) => r.Status + "|" + string.Join(",", r.Checks.Select(c => c.Name + "=" + c.Status + (c.Error is null ? "" : "(" + c.Error + ")")));
await CheckAsync("all healthy", async () => Summary(await Readiness.EvaluateAsync([Ok("database"), Ok("cache", false)], timeout)), "Healthy|database=Healthy,cache=Healthy");
await CheckAsync("a failed critical dependency makes the replica unready", async () => (await Readiness.EvaluateAsync([Down("database"), Ok("cache", false)], timeout)).Status, HealthStatus.Unhealthy);
await CheckAsync("a failed optional dependency only degrades it", async () => (await Readiness.EvaluateAsync([Ok("database"), Down("email", false)], timeout)).Status, HealthStatus.Degraded);
await CheckAsync("a throwing probe reports its error", async () => Summary(await Readiness.EvaluateAsync([Crashes("payments", false)], timeout)), "Degraded|payments=Degraded(connection refused)");
await CheckAsync("a hanging probe times out and is cancelled", async () =>
{
    bool cancelled = false;
    var report = await Readiness.EvaluateAsync([Hangs("search", false, c => cancelled = c), Ok("database")], timeout);
    return Summary(report) + "|" + cancelled;
}, "Degraded|search=Degraded(timed out),database=Healthy|True");
await CheckAsync("a hanging critical dependency is unhealthy, not stuck", async () => (await Readiness.EvaluateAsync([Hangs("database", true)], timeout)).Status, HealthStatus.Unhealthy);
await CheckAsync("probes run concurrently", async () =>
{
    var gate = new TaskCompletionSource<bool>();
    int started = 0;
    DependencyCheck Waits(string n) => new(n, true, async _ => { started++; return await gate.Task; });
    var evaluation = Readiness.EvaluateAsync([Waits("a"), Waits("b"), Waits("c")], TimeSpan.FromSeconds(5));
    var startedBeforeRelease = started;
    gate.SetResult(true);
    var report = await evaluation;
    return startedBeforeRelease + ":" + report.Status;
}, "3:Healthy");
await CheckAsync("results keep the order of the checks", async () => string.Join(",", (await Readiness.EvaluateAsync([Hangs("slow", false), Ok("fast")], timeout)).Checks.Select(c => c.Name)), "slow,fast");
await CheckAsync("HTTP status: 503 only when unhealthy", async () =>
    Readiness.HttpStatus(await Readiness.EvaluateAsync([Ok("db")], timeout)) + "," +
    Readiness.HttpStatus(await Readiness.EvaluateAsync([Down("email", false)], timeout)) + "," +
    Readiness.HttpStatus(await Readiness.EvaluateAsync([Down("db")], timeout)), "200,200,503");
`),
  },
  {
    id: 'cs-6-15',
    title: 'An Error-Budget Policy That Decides Whether to Ship',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Turn the SLO into a release rule the whole team can see. ErrorBudget.Evaluate(hourly, slo, now) takes hourly request counts for the ' +
      'last 30 days and an SLO such as 0.999 (ArgumentOutOfRangeException unless 0 < slo < 1). Availability = 1 − failed / total over all ' +
      'windows (1 when there was no traffic). The budget is (1 − slo) × total allowed failures; BudgetRemaining = 1 − failed / allowed, as a ' +
      'fraction that goes negative when overspent (1 when nothing is allowed yet). BurnRate1h and BurnRate6h are the error ratio of the windows ' +
      'starting within the last 1 and 6 hours (Start ≥ now − window) divided by (1 − slo), 0 without traffic. Decision: Freeze when ' +
      'BudgetRemaining ≤ 0; ShipWithCare when BudgetRemaining < 0.25 or BurnRate1h > 2; otherwise Ship.',
    starterCode: `public sealed record WindowCount(DateTimeOffset Start, long Total, long Failed);

public enum ReleaseDecision { Ship, ShipWithCare, Freeze }

public sealed record BudgetStatus(double Availability, double BudgetRemaining, double BurnRate1h, double BurnRate6h, ReleaseDecision Decision);

public static class ErrorBudget
{
    public static BudgetStatus Evaluate(IReadOnlyList<WindowCount> hourly, double slo, DateTimeOffset now) => throw new NotImplementedException();
}
`,
    hints: [
      'Sum Total and Failed with LINQ (as long), then compute each ratio as a double.',
      'A helper Burn(TimeSpan window) can filter hourly.Where(w => w.Start >= now - window) and return (failed / total) / (1 - slo).',
      'Evaluate the decision rules in order: Freeze first, then ShipWithCare, then Ship.',
    ],
    solution: `public sealed record WindowCount(DateTimeOffset Start, long Total, long Failed);

public enum ReleaseDecision { Ship, ShipWithCare, Freeze }

public sealed record BudgetStatus(double Availability, double BudgetRemaining, double BurnRate1h, double BurnRate6h, ReleaseDecision Decision);

public static class ErrorBudget
{
    public static BudgetStatus Evaluate(IReadOnlyList<WindowCount> hourly, double slo, DateTimeOffset now)
    {
        if (slo <= 0 || slo >= 1) throw new ArgumentOutOfRangeException(nameof(slo), "The SLO is a fraction between 0 and 1.");
        long total = hourly.Sum(w => w.Total);
        long failed = hourly.Sum(w => w.Failed);
        double availability = total == 0 ? 1 : 1 - (double)failed / total;
        double allowed = (1 - slo) * total;
        double remaining = allowed == 0 ? 1 : 1 - failed / allowed;

        double Burn(TimeSpan window)
        {
            var recent = hourly.Where(w => w.Start >= now - window).ToList();
            long t = recent.Sum(w => w.Total);
            return t == 0 ? 0 : (double)recent.Sum(w => w.Failed) / t / (1 - slo);
        }

        double burn1h = Burn(TimeSpan.FromHours(1));
        double burn6h = Burn(TimeSpan.FromHours(6));
        var decision = remaining <= 0 ? ReleaseDecision.Freeze
            : remaining < 0.25 || burn1h > 2 ? ReleaseDecision.ShipWithCare
            : ReleaseDecision.Ship;
        return new BudgetStatus(availability, remaining, burn1h, burn6h, decision);
    }
}
`,
    testCode: csTests(`
var now = DateTimeOffset.Parse("2026-12-20T12:00:00Z");
// 720 hourly windows; the newest starts at now - 1h.
List<WindowCount> Month(long perHour, Func<int, long> failedInHoursAgo) =>
    Enumerable.Range(1, 720).Select(h => new WindowCount(now.AddHours(-h), perHour, failedInHoursAgo(h))).ToList();
string Round(BudgetStatus s) => Math.Round(s.Availability, 5) + "|" + Math.Round(s.BudgetRemaining, 3) + "|" + Math.Round(s.BurnRate1h, 2) + "|" + Math.Round(s.BurnRate6h, 2) + "|" + s.Decision;
Check("a quiet month: plenty of budget", () => Round(ErrorBudget.Evaluate(Month(10_000, h => 2), 0.999, now)), "0.9998|0.8|0.2|0.2|Ship");
Check("a bad hour right now: ship with care", () => Round(ErrorBudget.Evaluate(Month(10_000, h => h == 1 ? 300 : 2), 0.999, now)), "0.99976|0.759|30|5.17|ShipWithCare");
Check("most of the budget spent: ship with care", () => ErrorBudget.Evaluate(Month(10_000, h => 8), 0.999, now).Decision, ReleaseDecision.ShipWithCare);
Check("the budget is gone: freeze", () => Round(ErrorBudget.Evaluate(Month(10_000, h => h <= 100 ? 80 : 0), 0.999, now)), "0.99889|-0.111|8|8|Freeze");
Check("no traffic means nothing is spent", () => Round(ErrorBudget.Evaluate(Month(0, h => 0), 0.999, now)), "1|1|0|0|Ship");
Check("old windows do not count towards burn rates", () => Math.Round(ErrorBudget.Evaluate(Month(10_000, h => h > 6 ? 500 : 0), 0.999, now).BurnRate6h, 2), 0.0);
Throws<ArgumentOutOfRangeException>("the SLO is below 1", () => ErrorBudget.Evaluate(Month(1, h => 0), 1.0, now));
`),
  },
  {
    id: 'cs-6-16',
    title: 'Read a Load Test Like an Engineer',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'At Demo Day someone will ask: "how do you know it handles the load?" Answer with numbers. LoadTestAnalyzer.Percentile(latencies, p) ' +
      'uses the nearest-rank method — the ⌈p/100 × n⌉-th smallest value — on any order of input (TimeSpan.Zero for no samples; ' +
      'ArgumentOutOfRangeException unless 0 < p ≤ 100). Analyze(samples, duration, targets, baseline) returns Requests, ErrorRate (failed / ' +
      'requests), P50, P95 and P99 over all samples, ThroughputPerSecond (requests / duration in seconds) and Violations, in this order: ' +
      '"p95 412 ms > 300 ms" and "p99 … > …" when a percentile exceeds its target (milliseconds rounded to whole numbers), "error rate 2.0% > ' +
      '1.0%" (one decimal, invariant culture) when errors exceed the maximum, and — when a baseline report is given — "p95 regressed 25% vs ' +
      'baseline" when P95 is more than 10% above the baseline\'s (the increase rounded to a whole percent).',
    starterCode: `public sealed record Sample(TimeSpan Latency, bool Ok);
public sealed record Targets(TimeSpan P95, TimeSpan P99, double MaxErrorRate);
public sealed record LoadReport(int Requests, double ErrorRate, TimeSpan P50, TimeSpan P95, TimeSpan P99, double ThroughputPerSecond, IReadOnlyList<string> Violations);

public static class LoadTestAnalyzer
{
    public static TimeSpan Percentile(IEnumerable<TimeSpan> latencies, double p) => throw new NotImplementedException();
    public static LoadReport Analyze(IReadOnlyList<Sample> samples, TimeSpan duration, Targets targets, LoadReport? baseline = null) => throw new NotImplementedException();
}
`,
    hints: [
      'Nearest rank: sort, rank = (int)Math.Ceiling(p / 100 * n), return sorted[rank - 1].',
      'Format milliseconds with Math.Round(span.TotalMilliseconds).ToString(CultureInfo.InvariantCulture) and percentages with (rate * 100).ToString("0.0", CultureInfo.InvariantCulture).',
      'The regression is (current / baseline − 1) × 100, compared with 10 and then rounded for the message.',
    ],
    solution: `using System.Globalization;

public sealed record Sample(TimeSpan Latency, bool Ok);
public sealed record Targets(TimeSpan P95, TimeSpan P99, double MaxErrorRate);
public sealed record LoadReport(int Requests, double ErrorRate, TimeSpan P50, TimeSpan P95, TimeSpan P99, double ThroughputPerSecond, IReadOnlyList<string> Violations);

public static class LoadTestAnalyzer
{
    public static TimeSpan Percentile(IEnumerable<TimeSpan> latencies, double p)
    {
        if (p <= 0 || p > 100) throw new ArgumentOutOfRangeException(nameof(p));
        var sorted = latencies.OrderBy(x => x).ToList();
        if (sorted.Count == 0) return TimeSpan.Zero;
        int rank = (int)Math.Ceiling(p / 100 * sorted.Count);
        return sorted[Math.Max(rank, 1) - 1];
    }

    public static LoadReport Analyze(IReadOnlyList<Sample> samples, TimeSpan duration, Targets targets, LoadReport? baseline = null)
    {
        var latencies = samples.Select(s => s.Latency).ToList();
        int n = samples.Count;
        double errorRate = n == 0 ? 0 : (double)samples.Count(s => !s.Ok) / n;
        var p50 = Percentile(latencies, 50);
        var p95 = Percentile(latencies, 95);
        var p99 = Percentile(latencies, 99);
        double throughput = duration.TotalSeconds > 0 ? n / duration.TotalSeconds : 0;

        static string Ms(TimeSpan t) => Math.Round(t.TotalMilliseconds).ToString(CultureInfo.InvariantCulture) + " ms";
        static string Pct(double r) => (r * 100).ToString("0.0", CultureInfo.InvariantCulture) + "%";

        var violations = new List<string>();
        if (p95 > targets.P95) violations.Add("p95 " + Ms(p95) + " > " + Ms(targets.P95));
        if (p99 > targets.P99) violations.Add("p99 " + Ms(p99) + " > " + Ms(targets.P99));
        if (errorRate > targets.MaxErrorRate) violations.Add("error rate " + Pct(errorRate) + " > " + Pct(targets.MaxErrorRate));
        if (baseline is not null && baseline.P95 > TimeSpan.Zero)
        {
            double increase = (p95.TotalMilliseconds / baseline.P95.TotalMilliseconds - 1) * 100;
            if (increase > 10) violations.Add("p95 regressed " + Math.Round(increase).ToString(CultureInfo.InvariantCulture) + "% vs baseline");
        }
        return new LoadReport(n, errorRate, p50, p95, p99, throughput, violations);
    }
}
`,
    testCode: csTests(`
TimeSpan Ms(double ms) => TimeSpan.FromMilliseconds(ms);
// 1000 requests: latency i+1 ms for i = 0..999; every 50th request fails (2%).
var samples = Enumerable.Range(0, 1000).Select(i => new Sample(Ms(i + 1), i % 50 != 49)).Reverse().ToList();
var targets = new Targets(Ms(1000), Ms(1000), 0.05);
Check("nearest-rank percentiles on unsorted input", () => LoadTestAnalyzer.Percentile(samples.Select(s => s.Latency), 95), Ms(950));
CheckSeq("p50, p99 and p100", () => new[] { LoadTestAnalyzer.Percentile([Ms(5), Ms(1), Ms(3)], 50), LoadTestAnalyzer.Percentile(samples.Select(s => s.Latency), 99), LoadTestAnalyzer.Percentile([Ms(7), Ms(2)], 100) }, [Ms(3), Ms(990), Ms(7)]);
Check("no samples, no latency", () => LoadTestAnalyzer.Percentile([], 95), TimeSpan.Zero);
Throws<ArgumentOutOfRangeException>("p is in (0, 100]", () => LoadTestAnalyzer.Percentile([Ms(1)], 0));
Check("summary numbers", () => { var r = LoadTestAnalyzer.Analyze(samples, TimeSpan.FromSeconds(20), targets); return r.Requests + "|" + r.ErrorRate + "|" + r.P50.TotalMilliseconds + "|" + r.ThroughputPerSecond; }, "1000|0.02|500|50");
Check("within targets, no violations", () => LoadTestAnalyzer.Analyze(samples, TimeSpan.FromSeconds(20), targets).Violations.Count, 0);
CheckSeq("reports every violation, in order", () => LoadTestAnalyzer.Analyze(samples, TimeSpan.FromSeconds(20), new Targets(Ms(300), Ms(500), 0.01)).Violations,
    ["p95 950 ms > 300 ms", "p99 990 ms > 500 ms", "error rate 2.0% > 1.0%"]);
CheckSeq("flags a regression against the baseline", () =>
{
    var baseline = LoadTestAnalyzer.Analyze(samples.Select(s => s with { Latency = s.Latency * 0.8 }).ToList(), TimeSpan.FromSeconds(20), targets);
    return LoadTestAnalyzer.Analyze(samples, TimeSpan.FromSeconds(20), targets, baseline).Violations;
}, ["p95 regressed 25% vs baseline"]);
Check("small changes are not regressions", () =>
{
    var baseline = LoadTestAnalyzer.Analyze(samples.Select(s => s with { Latency = s.Latency * 0.95 }).ToList(), TimeSpan.FromSeconds(20), targets);
    return LoadTestAnalyzer.Analyze(samples, TimeSpan.FromSeconds(20), targets, baseline).Violations.Count;
}, 0);
`),
  },
];
