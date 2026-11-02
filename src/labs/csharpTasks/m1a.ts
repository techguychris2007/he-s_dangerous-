import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 1 · C# Engineering';

/** Shared by tasks that need controllable time: a minimal TimeProvider the tests can move. */
const FIXED_TIME = `public sealed class FixedTime(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}
`;

/** Month 1, weeks 1–2 tasks (lessons dn1-1 … dn1-4). */
export const CSHARP_MONTH1_A_TASKS: CodeTask[] = [
  {
    id: 'cs-1-01',
    title: 'Loan Policies with Polymorphism',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Replace a type switch with polymorphism. Implement StudentPolicy (14 days, 3 books, 0.50 per day late, fines capped at 10.00), ' +
      'StaffPolicy (28 days, 10 books, never fined) and PublicPolicy (7 days, 2 books, 1.00 per day, capped at 15.00) — all implementing ' +
      'ILoanPolicy. Then implement FineCalculator.Fine(ILoanPolicy policy, DateOnly dueOn, DateOnly returnedOn), which charges only for ' +
      'whole days after the due date, never more than the policy\'s cap. FineCalculator must not mention any concrete policy type.',
    starterCode: `public interface ILoanPolicy
{
    int LoanDays { get; }
    int MaxBooks { get; }
    decimal DailyFine { get; }
    decimal MaxFine { get; }
}

public sealed class StudentPolicy : ILoanPolicy
{
    public int LoanDays => throw new NotImplementedException();
    public int MaxBooks => throw new NotImplementedException();
    public decimal DailyFine => throw new NotImplementedException();
    public decimal MaxFine => throw new NotImplementedException();
}

public sealed class StaffPolicy : ILoanPolicy
{
    // TODO: 28 days, 10 books, never fined
    public int LoanDays => throw new NotImplementedException();
    public int MaxBooks => throw new NotImplementedException();
    public decimal DailyFine => throw new NotImplementedException();
    public decimal MaxFine => throw new NotImplementedException();
}

public sealed class PublicPolicy : ILoanPolicy
{
    // TODO: 7 days, 2 books, 1.00 per day, capped at 15.00
    public int LoanDays => throw new NotImplementedException();
    public int MaxBooks => throw new NotImplementedException();
    public decimal DailyFine => throw new NotImplementedException();
    public decimal MaxFine => throw new NotImplementedException();
}

public static class FineCalculator
{
    public static decimal Fine(ILoanPolicy policy, DateOnly dueOn, DateOnly returnedOn) =>
        throw new NotImplementedException();
}
`,
    hints: [
      'Each policy is just four expression-bodied properties: public int LoanDays => 14;',
      'Days late: Math.Max(0, returnedOn.DayNumber - dueOn.DayNumber).',
      'Math.Min(daysLate * policy.DailyFine, policy.MaxFine) applies the cap. Staff: DailyFine 0 and MaxFine 0.',
    ],
    solution: `public interface ILoanPolicy
{
    int LoanDays { get; }
    int MaxBooks { get; }
    decimal DailyFine { get; }
    decimal MaxFine { get; }
}

public sealed class StudentPolicy : ILoanPolicy
{
    public int LoanDays => 14;
    public int MaxBooks => 3;
    public decimal DailyFine => 0.50m;
    public decimal MaxFine => 10.00m;
}

public sealed class StaffPolicy : ILoanPolicy
{
    public int LoanDays => 28;
    public int MaxBooks => 10;
    public decimal DailyFine => 0m;
    public decimal MaxFine => 0m;
}

public sealed class PublicPolicy : ILoanPolicy
{
    public int LoanDays => 7;
    public int MaxBooks => 2;
    public decimal DailyFine => 1.00m;
    public decimal MaxFine => 15.00m;
}

public static class FineCalculator
{
    public static decimal Fine(ILoanPolicy policy, DateOnly dueOn, DateOnly returnedOn)
    {
        int daysLate = Math.Max(0, returnedOn.DayNumber - dueOn.DayNumber);
        return Math.Min(daysLate * policy.DailyFine, policy.MaxFine);
    }
}
`,
    testCode: csTests(`
var due = new DateOnly(2026, 3, 10);
Check("student days", () => new StudentPolicy().LoanDays, 14);
Check("staff books", () => new StaffPolicy().MaxBooks, 10);
Check("public days", () => new PublicPolicy().LoanDays, 7);
Check("on time is free", () => FineCalculator.Fine(new StudentPolicy(), due, due), 0m);
Check("returned early is free", () => FineCalculator.Fine(new PublicPolicy(), due, due.AddDays(-3)), 0m);
Check("student 4 days late", () => FineCalculator.Fine(new StudentPolicy(), due, due.AddDays(4)), 2.00m);
Check("student cap", () => FineCalculator.Fine(new StudentPolicy(), due, due.AddDays(60)), 10.00m);
Check("public 3 days", () => FineCalculator.Fine(new PublicPolicy(), due, due.AddDays(3)), 3.00m);
Check("public cap", () => FineCalculator.Fine(new PublicPolicy(), due, due.AddDays(40)), 15.00m);
Check("staff never fined", () => FineCalculator.Fine(new StaffPolicy(), due, due.AddDays(90)), 0m);
Expect("all implement ILoanPolicy", () => new object[] { new StudentPolicy(), new StaffPolicy(), new PublicPolicy() }.All(p => p is ILoanPolicy), "every policy must implement ILoanPolicy");
`),
  },
  {
    id: 'cs-1-02',
    title: 'Inject the Clock',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement MembershipService, which receives a TimeProvider through its constructor and never reads DateTime.Now. Today is the ' +
      'UTC date of time.GetUtcNow(). IsExpired(expiresOn) is true when expiresOn is before today. DaysRemaining(expiresOn) is the ' +
      'number of days from today to expiresOn, or 0 if expired. Renew(expiresOn) returns a new expiry 365 days after whichever is later: ' +
      'today or the current expiry — so renewing early never loses days. The tests use a fake clock set to dates in 2031.',
    starterCode: `public sealed class MembershipService(TimeProvider time)
{
    public DateOnly Today => throw new NotImplementedException();

    public bool IsExpired(DateOnly expiresOn) => throw new NotImplementedException();

    public int DaysRemaining(DateOnly expiresOn) => throw new NotImplementedException();

    public DateOnly Renew(DateOnly expiresOn) => throw new NotImplementedException();
}
`,
    hints: [
      'DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime) gives today in UTC.',
      'DayNumber differences count days: expiresOn.DayNumber - Today.DayNumber.',
      'For Renew, pick the later date with a conditional, then AddDays(365).',
    ],
    solution: `public sealed class MembershipService(TimeProvider time)
{
    public DateOnly Today => DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

    public bool IsExpired(DateOnly expiresOn) => expiresOn < Today;

    public int DaysRemaining(DateOnly expiresOn) => Math.Max(0, expiresOn.DayNumber - Today.DayNumber);

    public DateOnly Renew(DateOnly expiresOn) => (expiresOn > Today ? expiresOn : Today).AddDays(365);
}
`,
    testCode: FIXED_TIME + csTests(`
var clock = new FixedTime(new DateTimeOffset(2031, 6, 1, 23, 30, 0, TimeSpan.Zero));
var svc = new MembershipService(clock);
Check("today from the clock", () => svc.Today, new DateOnly(2031, 6, 1));
Check("not expired on the day", () => svc.IsExpired(new DateOnly(2031, 6, 1)), false);
Check("expired yesterday", () => svc.IsExpired(new DateOnly(2031, 5, 31)), true);
Check("days remaining", () => svc.DaysRemaining(new DateOnly(2031, 6, 11)), 10);
Check("days remaining when expired", () => svc.DaysRemaining(new DateOnly(2030, 1, 1)), 0);
Check("renew early keeps days", () => svc.Renew(new DateOnly(2031, 7, 1)), new DateOnly(2032, 6, 30));
Check("renew after expiry starts today", () => svc.Renew(new DateOnly(2031, 1, 1)), new DateOnly(2032, 5, 31));
Check("clock moves", () => { clock.Now = clock.Now.AddDays(20); return svc.IsExpired(new DateOnly(2031, 6, 15)); }, true);
`),
  },
  {
    id: 'cs-1-03',
    title: 'A Money Value Object',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Money, a value object. Money.Of(amount, currency) validates: currency must be exactly three letters (stored upper-case) ' +
      'else ArgumentException; amount is rounded to 2 places (away from zero). Add and Subtract require the same currency (else ' +
      'InvalidOperationException). Times(int) multiplies. ToString gives "GHS 12.50". Split(int parts) divides the amount into parts ' +
      'that differ by at most one pesewa and add up exactly to the original — the first parts get the extra pesewas. Two Money values ' +
      'with the same amount and currency must be equal.',
    starterCode: `public readonly record struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    private Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public static Money Of(decimal amount, string currency) => throw new NotImplementedException();

    public Money Add(Money other) => throw new NotImplementedException();

    public Money Subtract(Money other) => throw new NotImplementedException();

    public Money Times(int factor) => throw new NotImplementedException();

    public IReadOnlyList<Money> Split(int parts) => throw new NotImplementedException();

    public override string ToString() => throw new NotImplementedException();
}
`,
    hints: [
      'Validate with currency.Length == 3 && currency.All(char.IsLetter), then store currency.ToUpperInvariant().',
      'Write a private EnsureSameCurrency(Money other) helper and call it from Add and Subtract.',
      'For Split, work in pesewas: long total = (long)(Amount * 100); long baseShare = total / parts; long remainder = total % parts; the first remainder parts get baseShare + 1.',
      'ToString: $"{Currency} {Amount:0.00}".',
    ],
    solution: `public readonly record struct Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    private Money(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public static Money Of(decimal amount, string currency)
    {
        if (currency is null || currency.Length != 3 || !currency.All(char.IsLetter))
            throw new ArgumentException("Currency must be a three-letter code.", nameof(currency));
        return new Money(Math.Round(amount, 2, MidpointRounding.AwayFromZero), currency.ToUpperInvariant());
    }

    public Money Add(Money other) { EnsureSameCurrency(other); return Of(Amount + other.Amount, Currency); }

    public Money Subtract(Money other) { EnsureSameCurrency(other); return Of(Amount - other.Amount, Currency); }

    public Money Times(int factor) => Of(Amount * factor, Currency);

    public IReadOnlyList<Money> Split(int parts)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(parts, 1);
        long total = (long)(Amount * 100);
        long share = total / parts, remainder = total % parts;
        var result = new List<Money>(parts);
        for (int i = 0; i < parts; i++)
            result.Add(new Money((share + (i < remainder ? 1 : 0)) / 100m, Currency));
        return result;
    }

    public override string ToString() => $"{Currency} {Amount:0.00}";

    private void EnsureSameCurrency(Money other)
    {
        if (other.Currency != Currency) throw new InvalidOperationException($"Cannot combine {Currency} with {other.Currency}.");
    }
}
`,
    testCode: csTests(`
Check("rounds", () => Money.Of(12.345m, "ghs").Amount, 12.35m);
Check("upper-cases currency", () => Money.Of(1m, "ghs").Currency, "GHS");
Throws<ArgumentException>("bad currency", () => Money.Of(1m, "CEDI"));
Check("add", () => Money.Of(10m, "GHS").Add(Money.Of(2.5m, "GHS")) == Money.Of(12.5m, "GHS"), true);
Check("subtract", () => Money.Of(10m, "GHS").Subtract(Money.Of(2.5m, "GHS")).Amount, 7.5m);
Throws<InvalidOperationException>("mixed currencies", () => Money.Of(1m, "GHS").Add(Money.Of(1m, "USD")));
Check("times", () => Money.Of(2.5m, "GHS").Times(3).Amount, 7.5m);
Check("to string", () => Money.Of(12.5m, "GHS").ToString(), "GHS 12.50");
Check("value equality", () => Money.Of(5m, "usd") == Money.Of(5.00m, "USD"), true);
CheckSeq("split 10.00 in 3", () => Money.Of(10m, "GHS").Split(3).Select(m => m.Amount), [3.34m, 3.33m, 3.33m]);
Check("split adds up", () => Money.Of(100.01m, "GHS").Split(7).Sum(m => m.Amount), 100.01m);
Throws<ArgumentOutOfRangeException>("split zero", () => Money.Of(1m, "GHS").Split(0));
`),
  },
  {
    id: 'cs-1-04',
    title: 'Reservation State Machine',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Reservation so it can only move through valid states. It starts Waiting. MarkReady(DateOnly readyOn) moves Waiting → Ready ' +
      'and sets PickupBy to readyOn + 3 days. Fulfil(DateOnly on) moves Ready → Fulfilled, but only on or before PickupBy. Cancel() moves ' +
      'Waiting or Ready → Cancelled. Expire(DateOnly today) moves Ready → Expired only when today is after PickupBy, and returns whether it ' +
      'did. Every other transition throws InvalidOperationException. Status and PickupBy cannot be set from outside.',
    starterCode: `public enum ReservationStatus { Waiting, Ready, Fulfilled, Cancelled, Expired }

public sealed class Reservation(string memberId, string isbn)
{
    public string MemberId { get; } = memberId;
    public string Isbn { get; } = isbn;
    public ReservationStatus Status { get; private set; } = ReservationStatus.Waiting;
    public DateOnly? PickupBy { get; private set; }

    public void MarkReady(DateOnly readyOn) => throw new NotImplementedException();

    public void Fulfil(DateOnly on) => throw new NotImplementedException();

    public void Cancel() => throw new NotImplementedException();

    public bool Expire(DateOnly today) => throw new NotImplementedException();
}
`,
    hints: [
      'Write a private Require(ReservationStatus expected, string action) helper that throws InvalidOperationException when Status is different.',
      'Fulfil after the pickup deadline is invalid too: throw InvalidOperationException.',
      'Expire on a Ready reservation that is still within its pickup window should return false, not throw.',
    ],
    solution: `public enum ReservationStatus { Waiting, Ready, Fulfilled, Cancelled, Expired }

public sealed class Reservation(string memberId, string isbn)
{
    public string MemberId { get; } = memberId;
    public string Isbn { get; } = isbn;
    public ReservationStatus Status { get; private set; } = ReservationStatus.Waiting;
    public DateOnly? PickupBy { get; private set; }

    public void MarkReady(DateOnly readyOn)
    {
        Require(ReservationStatus.Waiting, "mark ready");
        Status = ReservationStatus.Ready;
        PickupBy = readyOn.AddDays(3);
    }

    public void Fulfil(DateOnly on)
    {
        Require(ReservationStatus.Ready, "fulfil");
        if (on > PickupBy) throw new InvalidOperationException("The pickup window has passed.");
        Status = ReservationStatus.Fulfilled;
    }

    public void Cancel()
    {
        if (Status is not (ReservationStatus.Waiting or ReservationStatus.Ready))
            throw new InvalidOperationException($"Cannot cancel a reservation that is {Status}.");
        Status = ReservationStatus.Cancelled;
    }

    public bool Expire(DateOnly today)
    {
        Require(ReservationStatus.Ready, "expire");
        if (today <= PickupBy) return false;
        Status = ReservationStatus.Expired;
        return true;
    }

    private void Require(ReservationStatus expected, string action)
    {
        if (Status != expected) throw new InvalidOperationException($"Cannot {action} a reservation that is {Status}.");
    }
}
`,
    testCode: csTests(`
var day = new DateOnly(2026, 5, 1);
Reservation Ready() { var r = new Reservation("m1", "111"); r.MarkReady(day); return r; }
Check("starts waiting", () => new Reservation("m1", "111").Status, ReservationStatus.Waiting);
Check("pickup window", () => Ready().PickupBy, (DateOnly?)day.AddDays(3));
Check("fulfil on last day", () => { var r = Ready(); r.Fulfil(day.AddDays(3)); return r.Status; }, ReservationStatus.Fulfilled);
Throws<InvalidOperationException>("fulfil too late", () => Ready().Fulfil(day.AddDays(4)));
Throws<InvalidOperationException>("fulfil while waiting", () => new Reservation("m", "i").Fulfil(day));
Check("cancel waiting", () => { var r = new Reservation("m", "i"); r.Cancel(); return r.Status; }, ReservationStatus.Cancelled);
Throws<InvalidOperationException>("cancel fulfilled", () => { var r = Ready(); r.Fulfil(day); r.Cancel(); });
Throws<InvalidOperationException>("ready twice", () => Ready().MarkReady(day));
Check("expire too early", () => Ready().Expire(day.AddDays(3)), false);
Check("expire after window", () => { var r = Ready(); return r.Expire(day.AddDays(4)) && r.Status == ReservationStatus.Expired; }, true);
Expect("status has no public setter", () => typeof(Reservation).GetProperty("Status")!.SetMethod?.IsPublic != true, "Status must not be publicly settable");
`),
  },
  {
    id: 'cs-1-05',
    title: 'Generic Helpers and a Rule Pipeline',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement two generic tools. Seq.TopBy<T, TKey>(items, keySelector, n) returns the n items with the largest keys, highest first; ' +
      'items with equal keys keep their original order; n larger than the count returns everything; n < 0 throws ArgumentOutOfRangeException. ' +
      'Pipeline<T> collects rules (Func<T, T>) with Then(rule), which returns the same pipeline so calls can be chained, and Run(input) ' +
      'applies the rules in the order they were added. An empty pipeline returns its input unchanged.',
    starterCode: `public static class Seq
{
    public static List<T> TopBy<T, TKey>(IEnumerable<T> items, Func<T, TKey> keySelector, int n)
        where TKey : IComparable<TKey>
        => throw new NotImplementedException();
}

public sealed class Pipeline<T>
{
    public Pipeline<T> Then(Func<T, T> rule) => throw new NotImplementedException();

    public T Run(T input) => throw new NotImplementedException();
}
`,
    hints: [
      'OrderByDescending is a stable sort in LINQ, so equal keys keep their order; then Take(n).',
      'Pipeline keeps a private List<Func<T, T>>; Then adds and returns this.',
      'Run: rules.Aggregate(input, (value, rule) => rule(value)).',
    ],
    solution: `public static class Seq
{
    public static List<T> TopBy<T, TKey>(IEnumerable<T> items, Func<T, TKey> keySelector, int n)
        where TKey : IComparable<TKey>
    {
        ArgumentOutOfRangeException.ThrowIfNegative(n);
        return items.OrderByDescending(keySelector).Take(n).ToList();
    }
}

public sealed class Pipeline<T>
{
    private readonly List<Func<T, T>> _rules = [];

    public Pipeline<T> Then(Func<T, T> rule)
    {
        ArgumentNullException.ThrowIfNull(rule);
        _rules.Add(rule);
        return this;
    }

    public T Run(T input) => _rules.Aggregate(input, (value, rule) => rule(value));
}
`,
    testCode: csTests(`
CheckSeq("top 2 numbers", () => Seq.TopBy([5, 1, 9, 3], x => x, 2), [9, 5]);
CheckSeq("top by length, stable", () => Seq.TopBy(["bb", "a", "cc", "ddd"], s => s.Length, 3), ["ddd", "bb", "cc"]);
CheckSeq("n too large", () => Seq.TopBy([2, 1], x => x, 10), [2, 1]);
CheckSeq("n zero", () => Seq.TopBy([2, 1], x => x, 0), []);
Throws<ArgumentOutOfRangeException>("negative n", () => Seq.TopBy([1], x => x, -1));
Check("pipeline order", () => new Pipeline<decimal>().Then(p => p * 0.9m).Then(p => p - 5m).Run(100m), 85.0m);
Check("other order differs", () => new Pipeline<decimal>().Then(p => p - 5m).Then(p => p * 0.9m).Run(100m), 85.5m);
Check("empty pipeline", () => new Pipeline<string>().Run("same"), "same");
Check("chaining returns same instance", () => { var p = new Pipeline<int>(); return ReferenceEquals(p, p.Then(x => x)); }, true);
Check("strings", () => new Pipeline<string>().Then(s => s.Trim()).Then(s => s.ToUpperInvariant()).Run("  accra "), "ACCRA");
`),
  },
  {
    id: 'cs-1-06',
    title: 'Sales Report with LINQ',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement three report queries over orders using LINQ. RevenueByCustomer returns a Dictionary<string, decimal> of each customer\'s ' +
      'total (quantity × unit price over all their order lines). TopProducts(n) returns the n best-selling SKUs by units sold as ' +
      '(Sku, Units) tuples, ties broken by SKU alphabetically. AverageOrderValue returns the mean order total rounded to 2 places, ' +
      'or 0 when there are no orders.',
    starterCode: `public record OrderLine(string Sku, int Quantity, decimal UnitPrice);

public record Order(int Id, string Customer, List<OrderLine> Lines);

public static class Reports
{
    public static Dictionary<string, decimal> RevenueByCustomer(IEnumerable<Order> orders) => throw new NotImplementedException();

    public static List<(string Sku, int Units)> TopProducts(IEnumerable<Order> orders, int n) => throw new NotImplementedException();

    public static decimal AverageOrderValue(IEnumerable<Order> orders) => throw new NotImplementedException();
}
`,
    hints: [
      'GroupBy(o => o.Customer) then ToDictionary(g => g.Key, g => g.SelectMany(o => o.Lines).Sum(l => l.Quantity * l.UnitPrice)).',
      'For TopProducts, SelectMany to all lines, GroupBy Sku, Select (g.Key, g.Sum(...)), OrderByDescending units, ThenBy Sku, Take(n).',
      'Materialise orders with ToList() before checking Count — and remember Average throws on an empty sequence.',
    ],
    solution: `public record OrderLine(string Sku, int Quantity, decimal UnitPrice);

public record Order(int Id, string Customer, List<OrderLine> Lines);

public static class Reports
{
    private static decimal Total(Order o) => o.Lines.Sum(l => l.Quantity * l.UnitPrice);

    public static Dictionary<string, decimal> RevenueByCustomer(IEnumerable<Order> orders) =>
        orders.GroupBy(o => o.Customer).ToDictionary(g => g.Key, g => g.Sum(Total));

    public static List<(string Sku, int Units)> TopProducts(IEnumerable<Order> orders, int n) =>
        orders.SelectMany(o => o.Lines)
            .GroupBy(l => l.Sku)
            .Select(g => (Sku: g.Key, Units: g.Sum(l => l.Quantity)))
            .OrderByDescending(x => x.Units)
            .ThenBy(x => x.Sku, StringComparer.Ordinal)
            .Take(n)
            .ToList();

    public static decimal AverageOrderValue(IEnumerable<Order> orders)
    {
        var list = orders.ToList();
        return list.Count == 0 ? 0m : Math.Round(list.Average(Total), 2, MidpointRounding.AwayFromZero);
    }
}
`,
    testCode: csTests(`
List<Order> orders =
[
    new(1, "Ama", [new("PEN", 10, 2.50m), new("BOOK", 1, 40m)]),
    new(2, "Kofi", [new("PEN", 5, 2.50m), new("INK", 5, 3m)]),
    new(3, "Ama", [new("BAG", 1, 120m)]),
];
Check("Ama revenue", () => Reports.RevenueByCustomer(orders)["Ama"], 185.00m);
Check("Kofi revenue", () => Reports.RevenueByCustomer(orders)["Kofi"], 27.50m);
Check("customer count", () => Reports.RevenueByCustomer(orders).Count, 2);
CheckSeq("top products", () => Reports.TopProducts(orders, 2), [("PEN", 15), ("INK", 5)]);
CheckSeq("tie broken by sku", () => Reports.TopProducts(orders, 4).Skip(2), [("BAG", 1), ("BOOK", 1)]);
Check("average", () => Reports.AverageOrderValue(orders), 70.83m);
Check("average of none", () => Reports.AverageOrderValue([]), 0m);
Check("empty revenue", () => Reports.RevenueByCustomer([]).Count, 0);
`),
  },
  {
    id: 'cs-1-07',
    title: 'Concurrent Price Lookup',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'A price source is slow (each call waits). Implement PriceService.TotalAsync(skus, quantities, ct): look up the price of each distinct ' +
      'SKU once, with all lookups running concurrently (not one after another), then return the sum of price × quantity for every line. ' +
      'Pass the CancellationToken to every lookup. The tests count how many lookups were in flight at the same time and how many were made.',
    starterCode: `public interface IPriceSource
{
    Task<decimal> GetPriceAsync(string sku, CancellationToken ct);
}

public sealed class PriceService(IPriceSource source)
{
    /// <summary>lines: (sku, quantity) pairs; a SKU may appear on several lines.</summary>
    public Task<decimal> TotalAsync(IReadOnlyList<(string Sku, int Quantity)> lines, CancellationToken ct) =>
        throw new NotImplementedException();
}
`,
    hints: [
      'Get the distinct SKUs with lines.Select(l => l.Sku).Distinct().',
      'Start every lookup before awaiting any: build a Dictionary<string, Task<decimal>> of tasks, then await Task.WhenAll(tasks.Values).',
      'After WhenAll, read each completed task\'s result with await tasks[sku] (it completes instantly).',
    ],
    solution: `public interface IPriceSource
{
    Task<decimal> GetPriceAsync(string sku, CancellationToken ct);
}

public sealed class PriceService(IPriceSource source)
{
    public async Task<decimal> TotalAsync(IReadOnlyList<(string Sku, int Quantity)> lines, CancellationToken ct)
    {
        var lookups = lines.Select(l => l.Sku).Distinct().ToDictionary(sku => sku, sku => source.GetPriceAsync(sku, ct));
        await Task.WhenAll(lookups.Values);
        decimal total = 0m;
        foreach (var (sku, quantity) in lines) total += await lookups[sku] * quantity;
        return total;
    }
}
`,
    testCode: `public sealed class SlowPrices : IPriceSource
{
    public int Calls, InFlight, MaxInFlight;
    public CancellationToken LastToken;
    public async Task<decimal> GetPriceAsync(string sku, CancellationToken ct)
    {
        Calls++; InFlight++; MaxInFlight = Math.Max(MaxInFlight, InFlight); LastToken = ct;
        await Task.Delay(30, ct);
        InFlight--;
        return sku switch { "PEN" => 2.50m, "BOOK" => 40m, "INK" => 3m, _ => throw new KeyNotFoundException(sku) };
    }
}
` + csTests(`
var prices = new SlowPrices();
var svc = new PriceService(prices);
List<(string, int)> lines = [("PEN", 4), ("BOOK", 1), ("INK", 2), ("PEN", 2)];
await CheckAsync("total", () => svc.TotalAsync(lines, CancellationToken.None), 61.00m);
Check("each sku fetched once", () => prices.Calls, 3);
Expect("lookups ran concurrently", () => prices.MaxInFlight > 1, "lookups ran one at a time; start them all before awaiting");
using var cts = new CancellationTokenSource();
var tokenCheck = new SlowPrices();
await CheckAsync("token passed through", async () => { await new PriceService(tokenCheck).TotalAsync([("PEN", 1)], cts.Token); return tokenCheck.LastToken == cts.Token; }, true);
await ThrowsAsync<KeyNotFoundException>("unknown sku surfaces", () => new PriceService(new SlowPrices()).TotalAsync([("???", 1)], CancellationToken.None));
await CheckAsync("empty order", () => new PriceService(new SlowPrices()).TotalAsync([], CancellationToken.None), 0m);
`),
  },
  {
    id: 'cs-1-08',
    title: 'Retries with Per-Attempt Timeouts',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Implement Retry.ExecuteAsync<T>(operation, maxAttempts, attemptTimeout, ct). Call operation up to maxAttempts times, giving each ' +
      'attempt its own CancellationToken that is cancelled after attemptTimeout or when the caller\'s ct is cancelled. Return the first ' +
      'successful result. If an attempt fails or times out, try again. If the caller\'s ct is cancelled, stop immediately and let ' +
      'OperationCanceledException propagate — never retry the caller\'s own cancellation. After the last failed attempt, rethrow that ' +
      'attempt\'s exception (a timed-out attempt surfaces as TimeoutException). maxAttempts < 1 throws ArgumentOutOfRangeException.',
    starterCode: `public static class Retry
{
    public static Task<T> ExecuteAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        int maxAttempts,
        TimeSpan attemptTimeout,
        CancellationToken ct) =>
        throw new NotImplementedException();
}
`,
    hints: [
      'CancellationTokenSource.CreateLinkedTokenSource(ct) plus CancelAfter(attemptTimeout) gives a token that fires on either.',
      'catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; } — the caller cancelled: stop.',
      'catch (OperationCanceledException) when the attempt timed out: remember new TimeoutException(...) as the last error and continue.',
      'Use ExceptionDispatchInfo.Capture(last).Throw() or simply throw last; after the loop.',
    ],
    solution: `public static class Retry
{
    public static async Task<T> ExecuteAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        int maxAttempts,
        TimeSpan attemptTimeout,
        CancellationToken ct)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(maxAttempts, 1);
        Exception? last = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            ct.ThrowIfCancellationRequested();
            using var attemptCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            attemptCts.CancelAfter(attemptTimeout);
            try
            {
                return await operation(attemptCts.Token);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (OperationCanceledException)
            {
                last = new TimeoutException($"Attempt {attempt} timed out after {attemptTimeout.TotalMilliseconds} ms.");
            }
            catch (Exception e)
            {
                last = e;
            }
        }
        throw last!;
    }
}
`,
    testCode: csTests(`
var quick = TimeSpan.FromMilliseconds(200);
await CheckAsync("first try", () => Retry.ExecuteAsync(_ => Task.FromResult(42), 3, quick, CancellationToken.None), 42);
await CheckAsync("succeeds on third", async () => { int n = 0; return await Retry.ExecuteAsync(_ => ++n < 3 ? throw new InvalidOperationException("flaky") : Task.FromResult(n), 3, quick, CancellationToken.None); }, 3);
await ThrowsAsync<InvalidOperationException>("gives up after max", () => Retry.ExecuteAsync<int>(_ => throw new InvalidOperationException("down"), 2, quick, CancellationToken.None));
await CheckAsync("counts attempts", async () => { int n = 0; try { await Retry.ExecuteAsync<int>(_ => { n++; throw new IOException(); }, 4, quick, CancellationToken.None); } catch (IOException) { } return n; }, 4);
await ThrowsAsync<TimeoutException>("slow attempts time out", () => Retry.ExecuteAsync(async t => { await Task.Delay(5_000, t); return 1; }, 2, TimeSpan.FromMilliseconds(40), CancellationToken.None));
await CheckAsync("timeout then success", async () => { int n = 0; return await Retry.ExecuteAsync(async t => { if (++n == 1) await Task.Delay(5_000, t); return n; }, 3, TimeSpan.FromMilliseconds(40), CancellationToken.None); }, 2);
await CheckAsync("caller cancellation is not retried", async () =>
{
    int n = 0;
    using var cts = new CancellationTokenSource();
    try { await Retry.ExecuteAsync(async t => { n++; cts.Cancel(); await Task.Delay(5_000, t); return 0; }, 5, TimeSpan.FromSeconds(2), cts.Token); }
    catch (OperationCanceledException) { }
    return n;
}, 1);
Throws<ArgumentOutOfRangeException>("zero attempts", () => Retry.ExecuteAsync(_ => Task.FromResult(1), 0, quick, CancellationToken.None).GetAwaiter().GetResult());
`),
  },
];
