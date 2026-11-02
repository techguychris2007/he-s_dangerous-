import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 3 Assignment: Rescue the Codebase

\`LegacyBilling.cs\` is real-world-shaped code: it works, customers are billed by it every month, and
nobody wants to touch it. One 70-line method mixes plan rules, discounts, proration, tax and formatting;
it reads \`DateTime.Now\` directly; it keeps a public mutable static log; and every number is magic.

Your job is to **rescue it without changing what it does**.

## Target design (implement in \`Billing.cs\`)

- \`IPlan\` — \`Name\`, \`MonthlyFee\`, \`IncludedClasses\`, \`ExtraClassFee\`, \`StudentDiscountEligible\`,
  with \`BasicPlan\`, \`PlusPlan\` and \`UnlimitedPlan\` implementations.
- \`PlanCatalog.Find(name)\` — case-insensitive lookup of the three standard plans (\`ArgumentException\` if
  unknown).
- \`InvoiceCalculator(TimeProvider time)\` with
  - \`Invoice Create(Member member, int classesAttended, int year, int month)\`
  - \`Invoice CreateForCurrentMonth(Member member, int classesAttended)\` — the month comes from the
    injected clock, never \`DateTime.Now\`.
- \`Invoice.ToLine()\` — the exact text the legacy code produces.

## Rules (all hidden inside the legacy method — read it carefully)

Write them down before you start. The grader compares your calculator with \`LegacyBilling.Invoice\` for
hundreds of members, plans, class counts and dates, so every quirk matters — including the order in
which things are rounded.

## Also graded

- A plan the tests invent (implementing \`IPlan\`) must work without changes to \`InvoiceCalculator\`.
- \`CreateForCurrentMonth\` must follow the injected clock.
- No public fields anywhere in your design (the legacy log is the anti-example).
- Invalid input (classes < 0, a member who joined after the billing month) throws \`ArgumentException\`.

## Suggested approach

1. Read the legacy method and list every rule.
2. Implement the plans and the calculator method by method, running the tests after each step —
   the parity tests are your characterisation safety net.
3. Leave \`LegacyBilling.cs\` exactly as it is; it is the reference.
`;

const LEGACY = `// Do not modify. This is the behaviour your new design must reproduce exactly.
public class LegacyBilling
{
    public static List<string> log = new List<string>();

    public static string Invoice(string name, string plan, int classes, bool student, DateTime joined, int year, int month)
    {
        decimal fee = 0; int inc = 0; decimal ext = 0; bool sd = false;
        if (plan.ToLower() == "basic") { fee = 150; inc = 4; ext = 20; sd = true; }
        else if (plan.ToLower() == "plus") { fee = 250; inc = 12; ext = 15; sd = true; }
        else if (plan.ToLower() == "unlimited") { fee = 400; inc = int.MaxValue; ext = 0; sd = false; }
        else { log.Add("bad plan " + plan); return "ERROR"; }
        if (classes < 0) { log.Add("bad classes"); return "ERROR"; }
        if (joined.Year > year || (joined.Year == year && joined.Month > month)) { log.Add("future member"); return "ERROR"; }
        int dim = DateTime.DaysInMonth(year, month);
        if (joined.Year == year && joined.Month == month)
        {
            fee = Math.Round(fee * (dim - joined.Day + 1) / dim, 2, MidpointRounding.AwayFromZero);
        }
        decimal extras = 0;
        if (classes > inc) { extras = (classes - inc) * ext; }
        decimal sub = fee + extras;
        decimal disc = 0;
        if (student && sd) { disc = Math.Round(fee * 0.15m, 2, MidpointRounding.AwayFromZero); }
        DateTime first = new DateTime(year, month, 1);
        if (joined <= first.AddYears(-2)) { disc = disc + 10; }
        if (disc > sub) { disc = sub; }
        decimal vat = Math.Round((sub - disc) * 0.15m, 2, MidpointRounding.AwayFromZero);
        decimal tot = sub - disc + vat;
        string line = "INVOICE|" + name + "|" + plan.ToLower() + "|" + sub.ToString("F2") + "|" + disc.ToString("F2") + "|" + vat.ToString("F2") + "|" + tot.ToString("F2");
        log.Add(line);
        return line;
    }

    public static string InvoiceThisMonth(string name, string plan, int classes, bool student, DateTime joined)
    {
        return Invoice(name, plan, classes, student, joined, DateTime.Now.Year, DateTime.Now.Month);
    }
}
`;

const BILLING_STARTER = `public interface IPlan
{
    string Name { get; }
    decimal MonthlyFee { get; }
    int IncludedClasses { get; }
    decimal ExtraClassFee { get; }
    bool StudentDiscountEligible { get; }
}

public sealed class BasicPlan : IPlan
{
    public string Name => "basic";
    public decimal MonthlyFee => throw new NotImplementedException();
    public int IncludedClasses => throw new NotImplementedException();
    public decimal ExtraClassFee => throw new NotImplementedException();
    public bool StudentDiscountEligible => throw new NotImplementedException();
}

public sealed class PlusPlan : IPlan
{
    public string Name => "plus";
    public decimal MonthlyFee => throw new NotImplementedException();
    public int IncludedClasses => throw new NotImplementedException();
    public decimal ExtraClassFee => throw new NotImplementedException();
    public bool StudentDiscountEligible => throw new NotImplementedException();
}

public sealed class UnlimitedPlan : IPlan
{
    public string Name => "unlimited";
    public decimal MonthlyFee => throw new NotImplementedException();
    public int IncludedClasses => throw new NotImplementedException();
    public decimal ExtraClassFee => throw new NotImplementedException();
    public bool StudentDiscountEligible => throw new NotImplementedException();
}

public static class PlanCatalog
{
    public static IPlan Find(string name) => throw new NotImplementedException();
}

public sealed record Member(string Name, IPlan Plan, bool IsStudent, DateOnly JoinedOn);

public sealed record Invoice(string MemberName, string PlanName, decimal Subtotal, decimal Discount, decimal Vat, decimal Total)
{
    public string ToLine() => throw new NotImplementedException();
}

public sealed class InvoiceCalculator(TimeProvider time)
{
    public Invoice Create(Member member, int classesAttended, int year, int month) => throw new NotImplementedException();

    public Invoice CreateForCurrentMonth(Member member, int classesAttended) => throw new NotImplementedException();
}
`;

const BILLING_SOLUTION = `public interface IPlan
{
    string Name { get; }
    decimal MonthlyFee { get; }
    int IncludedClasses { get; }
    decimal ExtraClassFee { get; }
    bool StudentDiscountEligible { get; }
}

public sealed class BasicPlan : IPlan
{
    public string Name => "basic";
    public decimal MonthlyFee => 150m;
    public int IncludedClasses => 4;
    public decimal ExtraClassFee => 20m;
    public bool StudentDiscountEligible => true;
}

public sealed class PlusPlan : IPlan
{
    public string Name => "plus";
    public decimal MonthlyFee => 250m;
    public int IncludedClasses => 12;
    public decimal ExtraClassFee => 15m;
    public bool StudentDiscountEligible => true;
}

public sealed class UnlimitedPlan : IPlan
{
    public string Name => "unlimited";
    public decimal MonthlyFee => 400m;
    public int IncludedClasses => int.MaxValue;
    public decimal ExtraClassFee => 0m;
    public bool StudentDiscountEligible => false;
}

public static class PlanCatalog
{
    private static readonly Dictionary<string, IPlan> Plans = new(StringComparer.OrdinalIgnoreCase)
    {
        ["basic"] = new BasicPlan(),
        ["plus"] = new PlusPlan(),
        ["unlimited"] = new UnlimitedPlan(),
    };

    public static IPlan Find(string name) =>
        Plans.TryGetValue(name, out var plan) ? plan : throw new ArgumentException($"Unknown plan '{name}'.", nameof(name));
}

public sealed record Member(string Name, IPlan Plan, bool IsStudent, DateOnly JoinedOn);

public sealed record Invoice(string MemberName, string PlanName, decimal Subtotal, decimal Discount, decimal Vat, decimal Total)
{
    public string ToLine() =>
        string.Join('|', "INVOICE", MemberName, PlanName, Subtotal.ToString("F2"), Discount.ToString("F2"), Vat.ToString("F2"), Total.ToString("F2"));
}

public sealed class InvoiceCalculator(TimeProvider time)
{
    private const decimal StudentDiscountRate = 0.15m;
    private const decimal LoyaltyDiscount = 10m;
    private const int LoyaltyYears = 2;
    private const decimal VatRate = 0.15m;

    public Invoice Create(Member member, int classesAttended, int year, int month)
    {
        ArgumentNullException.ThrowIfNull(member);
        if (classesAttended < 0) throw new ArgumentException("Classes attended cannot be negative.", nameof(classesAttended));
        var billingStart = new DateOnly(year, month, 1);
        if (member.JoinedOn > billingStart.AddMonths(1).AddDays(-1))
            throw new ArgumentException("The member joined after this billing month.", nameof(member));

        decimal planFee = ProratedFee(member, billingStart);
        decimal subtotal = planFee + ExtraClasses(member.Plan, classesAttended);
        decimal discount = Math.Min(subtotal, Discount(member, planFee, billingStart));
        decimal vat = Round((subtotal - discount) * VatRate);
        return new Invoice(member.Name, member.Plan.Name.ToLowerInvariant(), subtotal, discount, vat, subtotal - discount + vat);
    }

    public Invoice CreateForCurrentMonth(Member member, int classesAttended)
    {
        var now = time.GetUtcNow();
        return Create(member, classesAttended, now.Year, now.Month);
    }

    private static decimal ProratedFee(Member member, DateOnly billingStart)
    {
        bool joinedThisMonth = member.JoinedOn.Year == billingStart.Year && member.JoinedOn.Month == billingStart.Month;
        if (!joinedThisMonth) return member.Plan.MonthlyFee;
        int daysInMonth = DateTime.DaysInMonth(billingStart.Year, billingStart.Month);
        int daysActive = daysInMonth - member.JoinedOn.Day + 1;
        return Round(member.Plan.MonthlyFee * daysActive / daysInMonth);
    }

    private static decimal ExtraClasses(IPlan plan, int attended) =>
        attended > plan.IncludedClasses ? (attended - plan.IncludedClasses) * plan.ExtraClassFee : 0m;

    private static decimal Discount(Member member, decimal planFee, DateOnly billingStart)
    {
        decimal student = member.IsStudent && member.Plan.StudentDiscountEligible ? Round(planFee * StudentDiscountRate) : 0m;
        decimal loyalty = member.JoinedOn <= billingStart.AddYears(-LoyaltyYears) ? LoyaltyDiscount : 0m;
        return student + loyalty;
    }

    private static decimal Round(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
`;

const PROGRAM = `var calculator = new InvoiceCalculator(TimeProvider.System);
var member = new Member("Ama", PlanCatalog.Find("plus"), IsStudent: true, JoinedOn: new DateOnly(2023, 1, 15));
Console.WriteLine(calculator.Create(member, classesAttended: 15, year: 2026, month: 3).ToLine());
Console.WriteLine(LegacyBilling.Invoice("Ama", "plus", 15, true, new DateTime(2023, 1, 15), 2026, 3));
`;

const TESTS = `public sealed class TestTime(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}

public sealed class FamilyPlan : IPlan
{
    public string Name => "Family";
    public decimal MonthlyFee => 600m;
    public int IncludedClasses => 20;
    public decimal ExtraClassFee => 10m;
    public bool StudentDiscountEligible => false;
}
` + csTests(`
var calc = new InvoiceCalculator(TimeProvider.System);
int cases = 0, mismatches = 0;
string first = "";
var joinDates = new[] { new DateTime(2020, 5, 10), new DateTime(2024, 3, 1), new DateTime(2024, 3, 31), new DateTime(2025, 12, 20), new DateTime(2026, 2, 1), new DateTime(2026, 2, 14), new DateTime(2026, 2, 28) };
foreach (var plan in new[] { "basic", "plus", "unlimited", "PLUS" })
    foreach (var classes in new[] { 0, 3, 4, 5, 12, 13, 40 })
        foreach (var student in new[] { false, true })
            foreach (var joined in joinDates)
                foreach (var (y, m) in new[] { (2026, 2), (2026, 3), (2024, 3) })
                {
                    string expected = LegacyBilling.Invoice("Kofi", plan, classes, student, joined, y, m);
                    if (expected == "ERROR") continue;
                    cases++;
                    string actual;
                    try { actual = calc.Create(new Member("Kofi", PlanCatalog.Find(plan), student, DateOnly.FromDateTime(joined)), classes, y, m).ToLine(); }
                    catch (Exception e) { actual = "threw " + e.GetType().Name; }
                    if (actual != expected && mismatches++ == 0) first = $"{plan}, {classes} classes, student {student}, joined {joined:yyyy-MM-dd}, billed {y}-{m:00}: got {actual}, expected {expected}";
                }
Expect($"matches legacy on all {cases} valid cases", () => cases > 300 && mismatches == 0, $"{mismatches} cases differ. First: {first}");
Check("example invoice", () => calc.Create(new Member("Ama", new PlusPlan(), true, new DateOnly(2023, 1, 15)), 15, 2026, 3).ToLine(), "INVOICE|Ama|plus|295.00|47.50|37.13|284.63");
Check("plan lookup ignores case", () => PlanCatalog.Find("UnLimited").Name, "unlimited");
Throws<ArgumentException>("unknown plan", () => PlanCatalog.Find("platinum"));
Throws<ArgumentException>("negative classes", () => calc.Create(new Member("A", new BasicPlan(), false, new DateOnly(2025, 1, 1)), -1, 2026, 3));
Throws<ArgumentException>("joined after billing month", () => calc.Create(new Member("A", new BasicPlan(), false, new DateOnly(2026, 4, 2)), 0, 2026, 3));
Check("new plan without editing the calculator", () => calc.Create(new Member("Esi", new FamilyPlan(), true, new DateOnly(2025, 6, 1)), 22, 2026, 3).ToLine(), "INVOICE|Esi|family|620.00|0.00|93.00|713.00");
Check("current month from the injected clock", () => new InvoiceCalculator(new TestTime(new DateTimeOffset(2026, 2, 10, 9, 0, 0, TimeSpan.Zero))).CreateForCurrentMonth(new Member("Yaw", new BasicPlan(), false, new DateOnly(2026, 2, 15)), 0).Subtotal, 75.00m);
Expect("no public fields in the new design", () =>
{
    var types = new[] { typeof(IPlan), typeof(BasicPlan), typeof(PlusPlan), typeof(UnlimitedPlan), typeof(Member), typeof(Invoice), typeof(InvoiceCalculator), typeof(PlanCatalog) };
    return types.All(t => t.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Static).Length == 0);
}, "public fields expose mutable state — use properties or private fields");
`);

const task: ProjectTask = {
  id: 'se-cs-m1-003',
  title: 'Week 3: Rescue the Codebase',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'foundations',
  category: 'Month 1 · C# & Engineering Foundations',
  tags: ['refactoring', 'SOLID', 'characterisation tests', 'strategy', 'TimeProvider'],
  prompt:
    'A gym billing system works but is unmaintainable: one god method full of magic numbers and nested ifs, DateTime.Now buried inside, ' +
    'and a public mutable static log. Re-implement it as a clean design — plan strategies behind IPlan, a catalogue, an InvoiceCalculator ' +
    'with an injected TimeProvider and small, named methods — that produces exactly the same invoices as the legacy code, quirks and ' +
    'rounding included. The grader compares your output with the legacy code for hundreds of cases and checks the design properties ' +
    'listed in README.md.',
  hints: [
    'Before coding, write the rules out in plain English from LegacyBilling.Invoice: plan fees and included classes, proration in the joining month, extras, the student discount (on the prorated plan fee only, and not for unlimited), the loyalty discount after two years, the discount cap, then VAT.',
    'Rounding order matters: the prorated fee and the student discount are each rounded to 2 places when computed, VAT is rounded once, and the total is not rounded again.',
    'The loyalty rule compares the joining date with the first day of the billing month minus two years — a member who joined exactly on that date qualifies.',
    'Keep InvoiceCalculator free of plan names: everything plan-specific must come from IPlan, so a new plan works without edits.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('LegacyBilling.cs', LEGACY, { editable: false }),
    pf('Billing.cs', BILLING_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('LegacyBilling.cs', LEGACY, { editable: false }),
    pf('Billing.cs', BILLING_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Billing', kind: 'csharp', entry: 'Program.cs', testCode: TESTS }],
};

export default task;
