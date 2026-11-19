import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 23 Assignment: Design an African Booking Platform

**Kwaaba** lets travellers in Ghana, Nigeria and Kenya book guesthouse rooms from a phone and pay with mobile money.
Design the platform, then build and prove the part that must never be wrong: the **booking saga** between a room hold
and an asynchronous mobile-money payment.

Given (read-only): \`Contracts.cs\`, \`Infrastructure.cs\` — a \`ManualClock\`, a \`Catalogue\` of rooms and nightly
prices, a \`RoomInventory\` with expiring holds (task cs-6-09's design), and a simulated \`MobileMoneyProvider\` whose
customers approve, decline or ignore the prompt on their phone — and \`Program.cs\`. You write \`BookingService.cs\` and
\`DESIGN.md\`.

## BookingService

**Request(request)** — idempotent by \`RequestId\` (a phone retrying after a timeout gets the *same* result and is never
charged twice):
1. \`Invalid\` for an unknown room, \`CheckOut\` not after \`CheckIn\`, more than 30 nights, or a check-in before today
   (the clock's UTC date).
2. Hold the room for \`HoldTtl\` (15 minutes), using the booking id as the hold id. Not free → \`Unavailable\`.
3. Price = nights × the room's nightly price (minor units, GHS). Ask the provider: \`RequestToPay(bookingId, phone,
   amount, "GHS")\` — the booking id is the provider's idempotency key — and remember the provider reference.
4. Return \`Accepted(bookingId, amount, holdExpiresAt)\`. Booking ids are \`bk-1\`, \`bk-2\`, … in order of creation.

**Payment results** arrive by **callback** (\`OnCallback\`, possibly late, duplicated or never) and by **polling**
(\`Tick\` calls \`GetStatus\` for every booking whose payment is not yet final, at most once per \`PollInterval\`).
Treat both the same way:
- Unknown reference → ignore. A successful callback whose amount or currency differs → \`NeedsReview\`.
- **SUCCESSFUL** for an \`AwaitingPayment\` or \`Cancelled\` booking: hold the room again with the same id (still active,
  or free again) and confirm it → \`Confirmed\`. If the room has been taken meanwhile, \`Refund(reference)\` →
  \`Refunded\`. Exactly once, however many times success is reported.
- **FAILED**: an \`AwaitingPayment\` booking → \`Cancelled\` and its hold released at once.
- \`Tick\` also cancels an \`AwaitingPayment\` booking once its hold has expired (reason \`"payment not completed in
  time"\`) — but keeps polling, because the customer may still approve on their phone.

**Get(bookingId)** returns the \`BookingView\` (status, provider reference, reason).

The grader runs a seeded marketplace — dozens of customers competing for a few rooms, callbacks dropped, duplicated and
reordered, requests retried — and checks the invariants: no room is confirmed twice for the same night; every successful
payment ends in exactly one confirmed booking or a refund; every confirmed booking is paid; nobody is charged twice; and
no booking is left waiting.

## DESIGN.md

\`##\` sections: **Requirements**, **Estimates**, **API**, **Data model**, **Architecture**, **Payments** (mobile-money
flow, callbacks and polling, idempotency, reconciliation), **African context** (networks and devices, offline-first,
USSD/SMS, data protection and hosting region), **Trade-offs** (at least: holds and how you prevent double booking, and the
consistency of search versus booking), **Risks**.
`;

const CONTRACTS = `// Given: the service's public shapes.
public sealed record BookingRequest(string RequestId, string CustomerPhone, string RoomId, DateOnly CheckIn, DateOnly CheckOut);

public abstract record BookingResult
{
    public sealed record Accepted(string BookingId, long AmountMinor, DateTimeOffset HoldExpiresAt) : BookingResult;
    public sealed record Unavailable() : BookingResult;
    public sealed record Invalid(string Reason) : BookingResult;
}

public enum BookingStatus { AwaitingPayment, Confirmed, Cancelled, Refunded, NeedsReview }

public sealed record BookingView(
    string BookingId, string RoomId, DateOnly CheckIn, DateOnly CheckOut, long AmountMinor,
    BookingStatus Status, string ProviderReference, string? Reason);

public sealed record ProviderCallback(string Reference, string Status, long AmountMinor, string Currency);
`;

const INFRASTRUCTURE = `// Given: the world the booking service lives in.
public sealed class ManualClock
{
    public DateTimeOffset Now { get; private set; } = DateTimeOffset.Parse("2026-12-01T08:00:00Z");
    public void Advance(TimeSpan by) => Now += by;
}

public sealed class Catalogue
{
    private readonly Dictionary<string, long> _nightlyMinor = new(StringComparer.Ordinal);
    public void Add(string roomId, long nightlyPriceMinor) => _nightlyMinor[roomId] = nightlyPriceMinor;
    public long? NightlyPrice(string roomId) => _nightlyMinor.TryGetValue(roomId, out var p) ? p : null;
}

/// <summary>Rooms by night, with holds that expire (half-open date ranges).</summary>
public sealed class RoomInventory
{
    private sealed class Stay(string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset placedAt)
    {
        public string RoomId { get; } = roomId;
        public DateOnly CheckIn { get; } = checkIn;
        public DateOnly CheckOut { get; } = checkOut;
        public DateTimeOffset PlacedAt { get; } = placedAt;
        public bool Confirmed { get; set; }
    }

    private readonly TimeSpan _ttl;
    private readonly Dictionary<string, Stay> _stays = new(StringComparer.Ordinal);

    public RoomInventory(TimeSpan holdTtl) => _ttl = holdTtl;

    private bool Blocks(Stay s, DateTimeOffset now) => s.Confirmed || now < s.PlacedAt + _ttl;

    private bool Free(string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now, string? except) =>
        !_stays.Any(s => s.Key != except && s.Value.RoomId == roomId && Blocks(s.Value, now) && s.Value.CheckIn < checkOut && checkIn < s.Value.CheckOut);

    /// <summary>Places (or, for an active hold with the same id, repeats) a hold. An expired hold with this id is replaced if the room is free.</summary>
    public bool Hold(string holdId, string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now)
    {
        if (_stays.TryGetValue(holdId, out var existing))
        {
            if (Blocks(existing, now)) return true;
            _stays.Remove(holdId);
        }
        if (!Free(roomId, checkIn, checkOut, now, holdId)) return false;
        _stays[holdId] = new Stay(roomId, checkIn, checkOut, now);
        return true;
    }

    public bool Confirm(string holdId, DateTimeOffset now)
    {
        if (!_stays.TryGetValue(holdId, out var s) || !Blocks(s, now)) return false;
        s.Confirmed = true;
        return true;
    }

    public void Release(string holdId)
    {
        if (_stays.TryGetValue(holdId, out var s) && !s.Confirmed) _stays.Remove(holdId);
    }

    public bool IsAvailable(string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now) => Free(roomId, checkIn, checkOut, now, null);

    /// <summary>Confirmed stays, for the grader's double-booking check.</summary>
    public IEnumerable<(string HoldId, string RoomId, DateOnly CheckIn, DateOnly CheckOut)> Confirmed() =>
        _stays.Where(s => s.Value.Confirmed).Select(s => (s.Key, s.Value.RoomId, s.Value.CheckIn, s.Value.CheckOut));
}

public enum PayerBehaviour { Approves, Declines, Ignores }

/// <summary>A mobile-money provider. RequestToPay is idempotent by externalId. The customer acts on their phone
/// after the scripted delay; a prompt that is ignored fails after 30 minutes. Each result produces one callback,
/// which the test decides to deliver, drop or duplicate.</summary>
public sealed class MobileMoneyProvider(ManualClock clock)
{
    private sealed record Payment(string Reference, string ExternalId, string Phone, long AmountMinor, string Currency, DateTimeOffset RequestedAt);

    private readonly Dictionary<string, (PayerBehaviour Behaviour, TimeSpan Delay)> _scripts = new(StringComparer.Ordinal);
    private readonly Dictionary<string, Payment> _byExternalId = new(StringComparer.Ordinal);
    private readonly Dictionary<string, Payment> _byReference = new(StringComparer.Ordinal);
    private readonly HashSet<string> _callbacksSent = new(StringComparer.Ordinal);
    private readonly List<string> _refunds = [];

    public int Requests => _byReference.Count;
    public IReadOnlyList<string> Refunds => _refunds;

    public void Script(string phone, PayerBehaviour behaviour, TimeSpan delay) => _scripts[phone] = (behaviour, delay);

    public string RequestToPay(string externalId, string phone, long amountMinor, string currency)
    {
        if (_byExternalId.TryGetValue(externalId, out var existing)) return existing.Reference;
        var payment = new Payment("MOMO-" + (_byReference.Count + 1).ToString("D5"), externalId, phone, amountMinor, currency, clock.Now);
        _byExternalId[externalId] = payment;
        _byReference[payment.Reference] = payment;
        return payment.Reference;
    }

    public string GetStatus(string reference)
    {
        if (!_byReference.TryGetValue(reference, out var p)) return "NOT_FOUND";
        var (behaviour, delay) = _scripts.TryGetValue(p.Phone, out var s) ? s : (PayerBehaviour.Approves, TimeSpan.FromSeconds(30));
        var elapsed = clock.Now - p.RequestedAt;
        return behaviour switch
        {
            PayerBehaviour.Approves when elapsed >= delay => "SUCCESSFUL",
            PayerBehaviour.Declines when elapsed >= delay => "FAILED",
            PayerBehaviour.Ignores when elapsed >= TimeSpan.FromMinutes(30) => "FAILED",
            _ => "PENDING",
        };
    }

    /// <summary>Callbacks whose moment has come and that have not been produced yet (each is produced once).</summary>
    public IReadOnlyList<ProviderCallback> DueCallbacks()
    {
        var due = new List<ProviderCallback>();
        foreach (var p in _byReference.Values)
        {
            var status = GetStatus(p.Reference);
            if (status == "PENDING" || !_callbacksSent.Add(p.Reference)) continue;
            due.Add(new ProviderCallback(p.Reference, status, p.AmountMinor, p.Currency));
        }
        return due;
    }

    public void Refund(string reference)
    {
        if (GetStatus(reference) != "SUCCESSFUL") throw new InvalidOperationException($"{reference} was not paid; nothing to refund.");
        if (_refunds.Contains(reference)) throw new InvalidOperationException($"{reference} was already refunded.");
        _refunds.Add(reference);
    }

    public IEnumerable<string> SuccessfulReferences() => _byReference.Keys.Where(r => GetStatus(r) == "SUCCESSFUL");
}
`;

const PROGRAM = `// Run: one guest pays, one ignores the prompt.
var clock = new ManualClock();
var catalogue = new Catalogue();
catalogue.Add("osu-101", 45_000);
var provider = new MobileMoneyProvider(clock);
provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromSeconds(40));
provider.Script("+233200000002", PayerBehaviour.Ignores, TimeSpan.Zero);
var service = new BookingService(catalogue, new RoomInventory(BookingService.HoldTtl), provider, clock);

var today = DateOnly.FromDateTime(clock.Now.UtcDateTime);
Console.WriteLine(service.Request(new BookingRequest("req-1", "+233200000002", "osu-101", today.AddDays(3), today.AddDays(5))));
Console.WriteLine(service.Request(new BookingRequest("req-2", "+233200000001", "osu-101", today.AddDays(3), today.AddDays(5))));
for (int minute = 0; minute < 40; minute++)
{
    clock.Advance(TimeSpan.FromMinutes(1));
    foreach (var cb in provider.DueCallbacks()) service.OnCallback(cb);
    service.Tick();
}
Console.WriteLine(service.Get("bk-1"));
Console.WriteLine(service.Request(new BookingRequest("req-2", "+233200000001", "osu-101", today.AddDays(3), today.AddDays(5))));
`;

const STARTER = `public sealed class BookingService
{
    public static readonly TimeSpan HoldTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);
    public const int MaxNights = 30;

    private readonly Catalogue _catalogue;
    private readonly RoomInventory _inventory;
    private readonly MobileMoneyProvider _provider;
    private readonly ManualClock _clock;

    public BookingService(Catalogue catalogue, RoomInventory inventory, MobileMoneyProvider provider, ManualClock clock)
    {
        (_catalogue, _inventory, _provider, _clock) = (catalogue, inventory, provider, clock);
    }

    public BookingResult Request(BookingRequest request) => throw new NotImplementedException();
    public void OnCallback(ProviderCallback callback) => throw new NotImplementedException();
    public void Tick() => throw new NotImplementedException();
    public BookingView? Get(string bookingId) => throw new NotImplementedException();
}
`;

const SOLUTION = `public sealed class BookingService
{
    public static readonly TimeSpan HoldTtl = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);
    public const int MaxNights = 30;

    private sealed class Booking
    {
        public required string Id { get; init; }
        public required BookingRequest Request { get; init; }
        public required long AmountMinor { get; init; }
        public required DateTimeOffset HoldExpiresAt { get; init; }
        public string Reference { get; set; } = "";
        public BookingStatus Status { get; set; } = BookingStatus.AwaitingPayment;
        public string? Reason { get; set; }
        public bool PaymentFinal { get; set; }                  // the provider has said SUCCESSFUL or FAILED
        public DateTimeOffset LastPolled { get; set; }
    }

    private readonly Catalogue _catalogue;
    private readonly RoomInventory _inventory;
    private readonly MobileMoneyProvider _provider;
    private readonly ManualClock _clock;
    private readonly Dictionary<string, BookingResult> _byRequestId = new(StringComparer.Ordinal);
    private readonly Dictionary<string, Booking> _bookings = new(StringComparer.Ordinal);
    private readonly Dictionary<string, Booking> _byReference = new(StringComparer.Ordinal);

    public BookingService(Catalogue catalogue, RoomInventory inventory, MobileMoneyProvider provider, ManualClock clock)
    {
        (_catalogue, _inventory, _provider, _clock) = (catalogue, inventory, provider, clock);
    }

    // ------------------------------------------------------------------ requests

    public BookingResult Request(BookingRequest request)
    {
        if (_byRequestId.TryGetValue(request.RequestId, out var earlier)) return earlier;   // a retry
        var result = Decide(request);
        _byRequestId[request.RequestId] = result;
        return result;
    }

    private BookingResult Decide(BookingRequest r)
    {
        if (_catalogue.NightlyPrice(r.RoomId) is not { } nightly) return new BookingResult.Invalid("Unknown room.");
        if (r.CheckOut <= r.CheckIn) return new BookingResult.Invalid("Check-out must be after check-in.");
        int nights = r.CheckOut.DayNumber - r.CheckIn.DayNumber;
        if (nights > MaxNights) return new BookingResult.Invalid($"At most {MaxNights} nights.");
        if (r.CheckIn < DateOnly.FromDateTime(_clock.Now.UtcDateTime)) return new BookingResult.Invalid("Check-in is in the past.");

        var id = "bk-" + (_bookings.Count + 1);
        if (!_inventory.Hold(id, r.RoomId, r.CheckIn, r.CheckOut, _clock.Now)) return new BookingResult.Unavailable();

        var booking = new Booking { Id = id, Request = r, AmountMinor = nights * nightly, HoldExpiresAt = _clock.Now + HoldTtl, LastPolled = _clock.Now };
        _bookings[id] = booking;
        // The booking id is the provider's idempotency key: a retried call cannot create a second charge.
        booking.Reference = _provider.RequestToPay(id, r.CustomerPhone, booking.AmountMinor, "GHS");
        _byReference[booking.Reference] = booking;
        return new BookingResult.Accepted(id, booking.AmountMinor, booking.HoldExpiresAt);
    }

    // ------------------------------------------------------------------ payment results

    public void OnCallback(ProviderCallback callback)
    {
        if (!_byReference.TryGetValue(callback.Reference, out var booking)) return;
        if (callback.Status == "SUCCESSFUL" && (callback.AmountMinor != booking.AmountMinor || callback.Currency != "GHS"))
        {
            if (booking.Status is BookingStatus.AwaitingPayment or BookingStatus.Cancelled)
            {
                booking.Status = BookingStatus.NeedsReview;
                booking.Reason = "amount mismatch";
                booking.PaymentFinal = true;
            }
            return;
        }
        Settle(booking, callback.Status);
    }

    private void Settle(Booking booking, string status)
    {
        if (status == "SUCCESSFUL")
        {
            booking.PaymentFinal = true;
            if (booking.Status is not (BookingStatus.AwaitingPayment or BookingStatus.Cancelled)) return;   // already handled
            var r = booking.Request;
            // Re-hold (a no-op for an active hold; re-placed if it expired and the room is still free), then confirm.
            if (_inventory.Hold(booking.Id, r.RoomId, r.CheckIn, r.CheckOut, _clock.Now) && _inventory.Confirm(booking.Id, _clock.Now))
            {
                booking.Status = BookingStatus.Confirmed;
                booking.Reason = null;
            }
            else
            {
                _provider.Refund(booking.Reference);
                booking.Status = BookingStatus.Refunded;
                booking.Reason = "room taken before payment completed";
            }
        }
        else if (status == "FAILED")
        {
            booking.PaymentFinal = true;
            if (booking.Status != BookingStatus.AwaitingPayment) return;
            _inventory.Release(booking.Id);
            booking.Status = BookingStatus.Cancelled;
            booking.Reason = "payment failed";
        }
    }

    public void Tick()
    {
        foreach (var booking in _bookings.Values)
        {
            if (booking.Status == BookingStatus.AwaitingPayment && _clock.Now >= booking.HoldExpiresAt)
            {
                booking.Status = BookingStatus.Cancelled;
                booking.Reason = "payment not completed in time";
            }
            if (!booking.PaymentFinal && _clock.Now - booking.LastPolled >= PollInterval)
            {
                booking.LastPolled = _clock.Now;
                Settle(booking, _provider.GetStatus(booking.Reference));
            }
        }
    }

    public BookingView? Get(string bookingId) =>
        _bookings.TryGetValue(bookingId, out var b)
            ? new BookingView(b.Id, b.Request.RoomId, b.Request.CheckIn, b.Request.CheckOut, b.AmountMinor, b.Status, b.Reference, b.Reason)
            : null;
}
`;

const TESTS = csTests(`
(ManualClock Clock, MobileMoneyProvider Provider, RoomInventory Inventory, BookingService Service) World()
{
    var clock = new ManualClock();
    var catalogue = new Catalogue();
    catalogue.Add("osu-101", 45_000);
    catalogue.Add("osu-102", 38_000);
    catalogue.Add("kumasi-7", 30_000);
    var provider = new MobileMoneyProvider(clock);
    var inventory = new RoomInventory(BookingService.HoldTtl);
    return (clock, provider, inventory, new BookingService(catalogue, inventory, provider, clock));
}
var today = DateOnly.Parse("2026-12-01");
BookingRequest Req(string id, string phone, string room = "osu-101", int from = 3, int to = 5) => new(id, phone, room, today.AddDays(from), today.AddDays(to));
string IdOf(BookingResult r) => r is BookingResult.Accepted a ? a.BookingId : r.ToString()!;
void Minutes((ManualClock Clock, MobileMoneyProvider Provider, RoomInventory Inventory, BookingService Service) w, int minutes, bool deliver = true)
{
    for (int i = 0; i < minutes * 2; i++)
    {
        w.Clock.Advance(TimeSpan.FromSeconds(30));
        foreach (var cb in w.Provider.DueCallbacks()) if (deliver) w.Service.OnCallback(cb);
        w.Service.Tick();
    }
}

// ---- requests
Check("prices nights and holds the room", () =>
{
    var w = World();
    var r = w.Service.Request(Req("r1", "+233200000001", from: 3, to: 6));
    return r is BookingResult.Accepted a ? a.BookingId + ":" + a.AmountMinor + ":" + (a.HoldExpiresAt - w.Clock.Now).TotalMinutes + ":" + w.Inventory.IsAvailable("osu-101", today.AddDays(4), today.AddDays(5), w.Clock.Now) : r.ToString()!;
}, "bk-1:135000:15:False");
Check("a retried request returns the same booking and charges once", () =>
{
    var w = World();
    var first = w.Service.Request(Req("r1", "+233200000001"));
    var again = w.Service.Request(Req("r1", "+233200000001"));
    return (first == again) + ":" + w.Provider.Requests;
}, "True:1");
Check("an overlapping request is unavailable and charges nobody", () =>
{
    var w = World();
    w.Service.Request(Req("r1", "+233200000001", from: 3, to: 6));
    var second = w.Service.Request(Req("r2", "+233200000002", from: 5, to: 7));
    return second + ":" + w.Provider.Requests;
}, "Unavailable { }:1");
Check("invalid requests are refused without a charge", () =>
{
    var w = World();
    BookingRequest[] bad = [Req("a", "p", room: "no-such-room"), Req("b", "p", from: 5, to: 5), Req("c", "p", from: 1, to: 40), Req("d", "p", from: -1, to: 2)];
    return bad.Count(b => w.Service.Request(b) is BookingResult.Invalid) + ":" + w.Provider.Requests;
}, "4:0");

// ---- payment results
Check("a successful callback confirms", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromSeconds(40));
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 2);
    return w.Service.Get(id)!.Status;
}, BookingStatus.Confirmed);
Check("duplicate callbacks change nothing", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromSeconds(40));
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    w.Clock.Advance(TimeSpan.FromMinutes(1));
    var callbacks = w.Provider.DueCallbacks();
    foreach (var cb in callbacks.Concat(callbacks).Concat(callbacks)) w.Service.OnCallback(cb);
    return w.Service.Get(id)!.Status + ":" + w.Provider.Refunds.Count + ":" + w.Inventory.Confirmed().Count();
}, "Confirmed:0:1");
Check("a declined payment releases the room at once", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Declines, TimeSpan.FromSeconds(30));
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 1);
    return w.Service.Get(id)!.Status + ":" + w.Inventory.IsAvailable("osu-101", today.AddDays(3), today.AddDays(5), w.Clock.Now);
}, "Cancelled:True");
Check("a lost callback is recovered by polling", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromSeconds(40));
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 3, deliver: false);
    return w.Service.Get(id)!.Status;
}, BookingStatus.Confirmed);
Check("an ignored prompt is cancelled when the hold expires", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Ignores, TimeSpan.Zero);
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 16);
    var view = w.Service.Get(id)!;
    return view.Status + ":" + view.Reason + ":" + w.Inventory.IsAvailable("osu-101", today.AddDays(3), today.AddDays(5), w.Clock.Now);
}, "Cancelled:payment not completed in time:True");
Check("a late payment still gets the room if it is free", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromMinutes(20));
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 16);
    var midway = w.Service.Get(id)!.Status;
    Minutes(w, 6);
    return midway + ":" + w.Service.Get(id)!.Status + ":" + w.Provider.Refunds.Count;
}, "Cancelled:Confirmed:0");
Check("a late payment for a room someone else booked is refunded", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromMinutes(20));
    w.Provider.Script("+233200000002", PayerBehaviour.Approves, TimeSpan.FromSeconds(30));
    var slow = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 16);
    var fast = IdOf(w.Service.Request(Req("r2", "+233200000002")));
    Minutes(w, 6);
    var s = w.Service.Get(slow)!;
    return s.Status + ":" + w.Service.Get(fast)!.Status + ":" + string.Join(",", w.Provider.Refunds) + "=" + s.ProviderReference;
}, "Refunded:Confirmed:MOMO-00001=MOMO-00001");
Check("a callback for someone else's payment is ignored", () =>
{
    var w = World();
    var id = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    w.Service.OnCallback(new ProviderCallback("MOMO-99999", "SUCCESSFUL", 90_000, "GHS"));
    return w.Service.Get(id)!.Status;
}, BookingStatus.AwaitingPayment);
Check("a wrong amount needs review, not a booking", () =>
{
    var w = World();
    var r = (BookingResult.Accepted)w.Service.Request(Req("r1", "+233200000001"));
    var reference = w.Service.Get(r.BookingId)!.ProviderReference;
    w.Service.OnCallback(new ProviderCallback(reference, "SUCCESSFUL", 1_000, "GHS"));
    w.Service.OnCallback(new ProviderCallback(reference, "SUCCESSFUL", r.AmountMinor, "GHS"));   // a person decides now, not a later callback
    return w.Service.Get(r.BookingId)!.Status + ":" + w.Inventory.Confirmed().Count();
}, "NeedsReview:0");
Check("a repeated success after a refund is not refunded again", () =>
{
    var w = World();
    w.Provider.Script("+233200000001", PayerBehaviour.Approves, TimeSpan.FromMinutes(20));
    w.Provider.Script("+233200000002", PayerBehaviour.Approves, TimeSpan.FromSeconds(30));
    var slow = IdOf(w.Service.Request(Req("r1", "+233200000001")));
    Minutes(w, 16);
    w.Service.Request(Req("r2", "+233200000002"));
    Minutes(w, 6);
    var view = w.Service.Get(slow)!;
    w.Service.OnCallback(new ProviderCallback(view.ProviderReference, "SUCCESSFUL", view.AmountMinor, "GHS"));
    return w.Service.Get(slow)!.Status + ":" + w.Provider.Refunds.Count;
}, "Refunded:1");

// ---- the marketplace
Expect("invariants hold in a chaotic marketplace", () =>
{
    foreach (int seed in new[] { 11, 22, 33 })
    {
        var w = World();
        var rng = new Random(seed);
        string[] rooms = ["osu-101", "osu-102", "kumasi-7"];
        var behaviours = new[] { PayerBehaviour.Approves, PayerBehaviour.Approves, PayerBehaviour.Approves, PayerBehaviour.Declines, PayerBehaviour.Ignores };
        var requests = new List<BookingRequest>();
        for (int c = 0; c < 40; c++)
        {
            var phone = "+2332000" + c.ToString("D5");
            w.Provider.Script(phone, behaviours[rng.Next(behaviours.Length)], TimeSpan.FromMinutes(rng.Next(0, 26)) + TimeSpan.FromSeconds(rng.Next(0, 60)));
            int from = 2 + rng.Next(0, 4);
            requests.Add(new BookingRequest("req-" + c, phone, rooms[rng.Next(rooms.Length)], today.AddDays(from), today.AddDays(from + 1 + rng.Next(0, 3))));
        }
        for (int step = 0; step < 240; step++)                          // two hours, in 30-second steps
        {
            w.Clock.Advance(TimeSpan.FromSeconds(30));
            if (step < 80 && step % 2 == 0) w.Service.Request(requests[step / 2]);
            if (rng.NextDouble() < 0.3) { var again = requests[rng.Next(Math.Min(requests.Count, step / 2 + 1))]; w.Service.Request(again); }
            var due = w.Provider.DueCallbacks().ToList();
            var delivered = due.Where(_ => rng.NextDouble() > 0.3).ToList();
            delivered.AddRange(delivered.Where(_ => rng.NextDouble() < 0.3).ToList());
            foreach (var cb in delivered.OrderBy(_ => rng.Next())) w.Service.OnCallback(cb);
            w.Service.Tick();
        }

        var views = Enumerable.Range(1, 200).Select(i => w.Service.Get("bk-" + i)).Where(v => v is not null).Select(v => v!).ToList();
        // 1. No room confirmed twice for the same night.
        var confirmed = w.Inventory.Confirmed().ToList();
        foreach (var a in confirmed)
            foreach (var b in confirmed)
                if (a.HoldId != b.HoldId && a.RoomId == b.RoomId && a.CheckIn < b.CheckOut && b.CheckIn < a.CheckOut) return false;
        // 2. Every successful payment ends in exactly one confirmed booking or a refund.
        foreach (var reference in w.Provider.SuccessfulReferences())
        {
            var v = views.Single(x => x.ProviderReference == reference);
            bool refunded = w.Provider.Refunds.Contains(reference);
            if ((v.Status == BookingStatus.Confirmed) == refunded) return false;
            if (!refunded && v.Status != BookingStatus.Confirmed) return false;
        }
        // 3. Every confirmed booking is paid and not refunded; inventory agrees.
        var paid = w.Provider.SuccessfulReferences().ToHashSet();
        if (views.Any(v => v.Status == BookingStatus.Confirmed && (!paid.Contains(v.ProviderReference) || w.Provider.Refunds.Contains(v.ProviderReference)))) return false;
        if (views.Count(v => v.Status == BookingStatus.Confirmed) != confirmed.Count) return false;
        // 4. Nobody charged twice: one provider request per booking.
        if (w.Provider.Requests != views.Count) return false;
        // 5. Nothing left waiting.
        if (views.Any(v => v.Status == BookingStatus.AwaitingPayment)) return false;
    }
    return true;
}, "in a seeded marketplace with lost, duplicated and late callbacks and retried requests, an invariant was broken (double booking, charge without booking or refund, booking without payment, double charge, or a booking left waiting)");
`);

const DESIGN_STARTER = `# Kwaaba — Booking Platform Design

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

## Payments

TODO

## African context

TODO

## Trade-offs

TODO

## Risks

TODO
`;

const DESIGN_SOLUTION = `# Kwaaba — Booking Platform Design

## Requirements

Functional: travellers search guesthouse rooms by place, dates, price and amenities; hold a room and pay with mobile money
or card; receive a booking code by SMS; cancel within the property's policy. Hosts manage rooms, prices and blocked dates
from the app or by USSD, and see arrivals. Non-functional: no room is ever booked twice for a night; no customer is
charged without a booking or a refund; search answers in under one second on a 3G connection; the booking flow tolerates
dropped connections; personal data handled lawfully in each country. Non-goals for version one: flights, dynamic pricing,
loyalty points.

## Estimates

20 000 properties with an average of 8 rooms gives 160 000 rooms. If 300 000 travellers search 10 times a day, that is 3
million searches a day, about 35 searches per second on average and roughly 150 per second at the evening peak. With 2%
of searches leading to a booking, 60 000 bookings a day is under 1 booking per second — tiny for writes, but contended
on popular rooms at peak. A booking record is about 1 KB, so 60 000 per day is about 60 MB a day and 22 GB a year.
Room-night availability for one year ahead is 160 000 × 365 ≈ 58 million rows, and the search index holds 160 000
listing documents of about 5 KB each, roughly 800 MB.

## API

GET /api/search?near=lat,lon&radiusKm=5&checkIn=&checkOut=&maxPrice= returns listing summaries (paged, compressed).
POST /api/bookings with an Idempotency-Key header and { roomId, checkIn, checkOut, phone } returns 202 Accepted with the
booking id, amount and hold expiry, 409 when unavailable, 400 when invalid. GET /api/bookings/{id} returns its status
(AwaitingPayment, Confirmed, Cancelled, Refunded). POST /api/payments/callbacks/{provider} receives signed provider
callbacks. Hosts have equivalent endpoints and a USSD menu over the same services.

## Data model

Rooms belong to properties; availability is stored per room and night with a version for optimistic concurrency, and
holds carry an expiry. Bookings reference a room, a date range, the amount in minor units and currency, the provider
reference and a status history. Payments are a separate table keyed by provider reference with their own state machine.
Bookings are partitioned by property (most queries are a host's bookings or one booking by id); the search index is a
separate read model keyed by listing.

## Architecture

Clients (a lightweight PWA, an Android app, USSD and SMS) call an API gateway in front of stateless services on
Container Apps. The booking service owns inventory and the booking saga; the payment service talks to mobile-money
providers and receives their callbacks; the search service owns the search index. Services communicate through events
published with a transactional outbox: availability changes update the search index, and payment results drive the
booking saga. A daily reconciliation job compares the payment ledger with each provider's settlement report.

## Payments

Mobile money is asynchronous: we request a payment with the booking id as the provider's idempotency key, the customer
approves on their phone, and the result arrives by a signed callback — which may be late, duplicated or lost — so we
also poll the provider's status endpoint until the payment is final. The booking saga treats both the same way and is
idempotent. A success after the hold expired re-holds the room if it is still free, and otherwise triggers an automatic
refund. Every morning, reconciliation against the provider's settlement report finds missing callbacks, reversals and
duplicates, and routes them to the finance team with owners and deadlines.

## African context

Most users are on mid-range Android phones with intermittent connections and paid data, so the app has a 200 KB
JavaScript budget, screen-shaped endpoints and server-resized images, and works offline: drafts and host changes go into
a local outbox with idempotency keys and sync when the connection returns. Hosts without smartphones use USSD menus, and
every booking is confirmed by SMS. We host in the Azure South Africa North region with a CDN at the edge, measured against users in
Accra, Lagos and Nairobi, and we follow Ghana's Data Protection Act, Kenya's Data Protection Act and Nigeria's NDPA:
minimal personal data, encryption at rest, a data inventory, and legal review of cross-border transfers.

## Trade-offs

Double booking is prevented with expiring holds plus optimistic concurrency on availability rows; we chose optimistic over
pessimistic locking because contention is rare except on the most popular rooms, and we never hold a lock across a
payment. A 15-minute hold balances fairness to other guests against the time mobile-money approvals really take. Search
is eventually consistent — the index can be seconds behind — while the booking service is the strongly consistent
authority that re-checks availability when a hold is placed. Polling providers costs requests but recovers lost
callbacks.

## Risks

Provider outages or slow callbacks during holidays could expire many holds: we monitor payment latency per provider and
can extend holds dynamically. Fraudulent listings and fake reviews damage trust: hosts are verified and payouts are
delayed until after check-in. Regulatory change on data transfers could force a region move, so data location is
recorded per category. Reconciliation discrepancies above a threshold page the payments team.
`;

const DESIGN_TESTS = `import { describe, it, expect } from 'vitest';
import { readFile } from 'dw:project';

const NL = String.fromCharCode(10);
const sections = new Map<string, string>();
let current = '';
for (const line of readFile('DESIGN.md').split(NL)) {
  if (line.startsWith('## ')) { current = line.slice(3).trim().toLowerCase(); sections.set(current, ''); continue; }
  if (current) sections.set(current, (sections.get(current) ?? '') + ' ' + line);
}
const section = (name: string): string => sections.get(name.toLowerCase()) ?? '';
const words = (s: string) => s.split(' ').map((w) => w.trim()).filter((w) => w.length > 0 && w !== 'TODO');
const has = (s: string, ...terms: string[]) => terms.every((t) => s.toLowerCase().includes(t.toLowerCase()));
const REQUIRED = ['Requirements', 'Estimates', 'API', 'Data model', 'Architecture', 'Payments', 'African context', 'Trade-offs', 'Risks'];

describe('DESIGN.md', () => {
  it('has every section, each substantial', () => {
    expect(REQUIRED.filter((s) => !sections.has(s.toLowerCase())), 'add these ## sections').toEqual([]);
    expect(REQUIRED.filter((s) => words(section(s)).length < 40), 'sections with fewer than 40 words').toEqual([]);
  });
  it('puts numbers on searches, bookings and data', () => {
    const e = section('Estimates');
    const numbers = e.split(' ').filter((w) => w.length > 0 && '0123456789'.includes(w[0])).length;
    expect(numbers, 'Estimates: show the arithmetic').toBeGreaterThanOrEqual(8);
    expect(has(e, 'per second') || has(e, '/s'), 'Estimates: rates per second').toBe(true);
  });
  it('specifies an idempotent booking API', () => {
    expect(has(section('API'), 'idempotency'), 'API: how booking requests are made idempotent').toBe(true);
  });
  it('explains the payment flow end to end', () => {
    const p = section('Payments');
    expect(['mobile money', 'callback', 'poll', 'idempot', 'refund', 'reconcil'].filter((t) => !has(p, t)), 'Payments: cover these').toEqual([]);
  });
  it('designs for the African context', () => {
    const c = section('African context');
    expect(has(c, 'offline'), 'African context: offline behaviour').toBe(true);
    expect(has(c, 'USSD') || has(c, 'SMS'), 'African context: channels beyond the app').toBe(true);
    expect(has(c, 'data protection') || has(c, 'NDPA') || has(c, 'POPIA'), 'African context: data-protection law').toBe(true);
    expect(has(c, 'region'), 'African context: hosting region').toBe(true);
  });
  it('argues the key trade-offs', () => {
    const t = section('Trade-offs');
    expect(has(t, 'hold'), 'Trade-offs: holds').toBe(true);
    expect(has(t, 'optimistic') || has(t, 'lock'), 'Trade-offs: how double booking is prevented').toBe(true);
    expect(has(t, 'consisten'), 'Trade-offs: search versus booking consistency').toBe(true);
  });
});
`;

const OUTLINE = `// Run (design target): the outline of DESIGN.md as the grader sees it.
import { readFile } from 'dw:project';

let current = '(preamble)';
const counts = new Map<string, number>();
for (const line of readFile('DESIGN.md').split(String.fromCharCode(10))) {
  if (line.startsWith('## ')) { current = line.slice(3).trim(); counts.set(current, 0); continue; }
  counts.set(current, (counts.get(current) ?? 0) + line.split(' ').filter((w) => w.trim().length > 0 && w !== 'TODO').length);
}
for (const [name, n] of counts) console.log(name.padEnd(18) + n + ' words');
`;

const given = [
  pf('README.md', README, { editable: false }),
  pf('Contracts.cs', CONTRACTS, { editable: false }),
  pf('Infrastructure.cs', INFRASTRUCTURE, { editable: false }),
  pf('Program.cs', PROGRAM, { editable: false }),
  pf('design-outline.ts', OUTLINE, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-cs-m6-003',
  title: 'Week 23: Design an African Booking Platform',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 6 · System Design & Capstone',
  tags: ['system design', 'saga', 'mobile money', 'idempotency', 'design document'],
  prompt:
    'Design a guesthouse booking platform for travellers paying with mobile money on intermittent networks, then build its booking ' +
    'saga: idempotent requests that hold a room and request payment with the booking id as the provider idempotency key, callbacks and ' +
    'polling handled alike, cancellation when payment stalls, and late payments that re-hold the room or are refunded. Graded by a seeded ' +
    'marketplace with lost, duplicated and late callbacks: no double booking, every charge ends in a booking or a refund, nobody charged ' +
    'twice — plus a design document covering payments and the African context.',
  hints: [
    'Tasks cs-6-09 (holds), cs-6-11 (payment state machine) and cs-6-12 (reconciliation) are the building blocks of this project.',
    'Store the result of every request by RequestId — including Unavailable and Invalid — and return it for retries.',
    'Write one Settle(booking, status) used by both OnCallback and the polling in Tick, so the two paths can never disagree.',
    'On success, call inventory.Hold(bookingId, …) again before Confirm: it is a no-op for an active hold and re-places an expired one if the room is still free.',
    'A booking can be Cancelled and still have an unfinished payment — keep polling until the provider says SUCCESSFUL or FAILED.',
  ],
  files: [
    ...given,
    pf('BookingService.cs', STARTER),
    pf('DESIGN.md', DESIGN_STARTER),
  ],
  solutionFiles: [
    ...given,
    pf('BookingService.cs', SOLUTION),
    pf('DESIGN.md', DESIGN_SOLUTION),
  ],
  targets: [
    { id: 'saga', label: 'Booking saga', kind: 'csharp', entry: 'Program.cs', testCode: TESTS },
    { id: 'design', label: 'Design document', kind: 'typescript', entry: 'design-outline.ts', testCode: DESIGN_TESTS },
  ],
};

export default task;
