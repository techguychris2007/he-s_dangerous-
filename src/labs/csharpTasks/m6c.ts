import type { CodeTask } from '../codeTypes';
import { csTests } from './harness';

const CATEGORY = 'Month 6 · System Design';

const VERSIONED_STORE = `public sealed record Departure(string Id, int Capacity, int Booked);

// Given: a key-value store with versions and conditional writes (like an ETag or a row version).
public sealed class VersionedStore
{
    private readonly Dictionary<string, (Departure Value, long Version)> _items = new();

    public int ConditionalWrites { get; private set; }
    /// <summary>Test hook: runs just before each conditional write, to simulate a competing request.</summary>
    public Action<string>? BeforeConditionalWrite { get; set; }

    public void Put(Departure value) =>
        _items[value.Id] = (value, _items.TryGetValue(value.Id, out var old) ? old.Version + 1 : 1);

    public (Departure Value, long Version) Get(string id) =>
        _items.TryGetValue(id, out var item) ? item : throw new KeyNotFoundException(id);

    public bool TryReplace(string id, long expectedVersion, Departure value)
    {
        BeforeConditionalWrite?.Invoke(id);
        ConditionalWrites++;
        if (!_items.TryGetValue(id, out var current) || current.Version != expectedVersion) return false;
        _items[id] = (value, current.Version + 1);
        return true;
    }
}
`;

/** Month 6, week 23 (lessons dn6-5, dn6-6): inventory, concurrency and money for a booking platform. */
export const CSHARP_MONTH6_C_TASKS: CodeTask[] = [
  {
    id: 'cs-6-09',
    title: 'Room Inventory with Expiring Holds',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'A guest choosing a room should not lose it while paying, but an abandoned checkout must not block the room for ever. Implement ' +
      'RoomInventory(holdTtl). Stays are half-open date ranges [checkIn, checkOut): a check-out on the 5th and a check-in on the 5th do not ' +
      'overlap (ArgumentException when checkOut is not after checkIn). Hold(holdId, roomId, checkIn, checkOut, now) succeeds when no ' +
      'confirmed booking and no unexpired hold on that room overlaps the stay; a hold expires holdTtl after it was placed. Repeating a Hold ' +
      'with the same id and the same stay is idempotent (true while it is active); the same id for a different stay is an ' +
      'InvalidOperationException. Confirm(holdId, now) turns an active hold into a permanent booking (true; confirming again is also true) ' +
      'and returns false for an expired or unknown hold. Release(holdId) frees an unconfirmed hold at once. IsAvailable and FreeRooms (in the ' +
      'order given) answer search queries.',
    starterCode: `public sealed class RoomInventory
{
    public RoomInventory(TimeSpan holdTtl) => throw new NotImplementedException();

    public bool Hold(string holdId, string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now) => throw new NotImplementedException();
    public bool Confirm(string holdId, DateTimeOffset now) => throw new NotImplementedException();
    public void Release(string holdId) => throw new NotImplementedException();
    public bool IsAvailable(string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now) => throw new NotImplementedException();
    public IReadOnlyList<string> FreeRooms(IEnumerable<string> roomIds, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now) => throw new NotImplementedException();
}
`,
    hints: [
      'Two half-open ranges overlap when a.CheckIn < b.CheckOut && b.CheckIn < a.CheckOut.',
      'Keep one record per hold id: room, dates, placedAt and a Confirmed flag. A record blocks the room when it is confirmed or now < placedAt + ttl.',
      'When checking availability for a repeated Hold, ignore the hold\'s own record.',
    ],
    solution: `public sealed class RoomInventory
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

    public RoomInventory(TimeSpan holdTtl)
    {
        if (holdTtl <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(holdTtl));
        _ttl = holdTtl;
    }

    private bool Blocks(Stay stay, DateTimeOffset now) => stay.Confirmed || now < stay.PlacedAt + _ttl;

    private static void Validate(DateOnly checkIn, DateOnly checkOut)
    {
        if (checkOut <= checkIn) throw new ArgumentException("checkOut must be after checkIn.");
    }

    private bool Free(string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now, string? ignoreHoldId = null) =>
        !_stays.Any(s => s.Key != ignoreHoldId && s.Value.RoomId == roomId && Blocks(s.Value, now)
                         && s.Value.CheckIn < checkOut && checkIn < s.Value.CheckOut);

    public bool Hold(string holdId, string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now)
    {
        Validate(checkIn, checkOut);
        if (_stays.TryGetValue(holdId, out var existing))
        {
            if (existing.RoomId != roomId || existing.CheckIn != checkIn || existing.CheckOut != checkOut)
                throw new InvalidOperationException($"Hold {holdId} already exists for a different stay.");
            if (Blocks(existing, now)) return true;                      // a repeated request
            _stays.Remove(holdId);                                       // expired: try again from scratch
        }
        if (!Free(roomId, checkIn, checkOut, now)) return false;
        _stays[holdId] = new Stay(roomId, checkIn, checkOut, now);
        return true;
    }

    public bool Confirm(string holdId, DateTimeOffset now)
    {
        if (!_stays.TryGetValue(holdId, out var stay) || !Blocks(stay, now)) return false;
        stay.Confirmed = true;
        return true;
    }

    public void Release(string holdId)
    {
        if (_stays.TryGetValue(holdId, out var stay) && !stay.Confirmed) _stays.Remove(holdId);
    }

    public bool IsAvailable(string roomId, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now)
    {
        Validate(checkIn, checkOut);
        return Free(roomId, checkIn, checkOut, now);
    }

    public IReadOnlyList<string> FreeRooms(IEnumerable<string> roomIds, DateOnly checkIn, DateOnly checkOut, DateTimeOffset now) =>
        roomIds.Where(r => IsAvailable(r, checkIn, checkOut, now)).ToList();
}
`,
    testCode: csTests(`
var now = DateTimeOffset.Parse("2026-12-01T10:00:00Z");
DateOnly D(int day) => new(2026, 12, day);
RoomInventory Inv() => new(TimeSpan.FromMinutes(15));
Check("a free room can be held", () => Inv().Hold("h1", "101", D(10), D(13), now), true);
Check("an overlapping hold is refused", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Hold("h2", "101", D(12), D(14), now); }, false);
Check("back-to-back stays do not overlap", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Hold("h2", "101", D(13), D(15), now) && i.Hold("h3", "101", D(8), D(10), now); }, true);
Check("other rooms are unaffected", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Hold("h2", "102", D(10), D(13), now); }, true);
Check("an abandoned hold expires", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Hold("h2", "101", D(10), D(13), now.AddMinutes(15)); }, true);
Check("a confirmed booking never expires", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); i.Confirm("h1", now.AddMinutes(5)); return i.IsAvailable("101", D(11), D(12), now.AddDays(3)); }, false);
Check("an expired hold cannot be confirmed", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Confirm("h1", now.AddMinutes(16)); }, false);
Check("confirming twice is fine", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Confirm("h1", now) && i.Confirm("h1", now.AddDays(1)); }, true);
Check("repeating the same hold is idempotent", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); return i.Hold("h1", "101", D(10), D(13), now.AddMinutes(1)); }, true);
Throws<InvalidOperationException>("the same hold id for another stay", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); i.Hold("h1", "102", D(10), D(13), now); });
Check("release frees a hold at once", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); i.Release("h1"); return i.IsAvailable("101", D(10), D(13), now); }, true);
Check("release does not cancel a confirmed booking", () => { var i = Inv(); i.Hold("h1", "101", D(10), D(13), now); i.Confirm("h1", now); i.Release("h1"); return i.IsAvailable("101", D(10), D(13), now); }, false);
CheckSeq("search lists free rooms in order", () => { var i = Inv(); i.Hold("h1", "102", D(10), D(13), now); return i.FreeRooms(["103", "102", "101"], D(11), D(12), now); }, ["103", "101"]);
Throws<ArgumentException>("check-out must follow check-in", () => Inv().Hold("h1", "101", D(13), D(13), now));
`),
  },
  {
    id: 'cs-6-10',
    title: 'Sell the Last Seats Once: Optimistic Concurrency',
    difficulty: 'Medium',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'A popular bus departure from Accra to Kumasi has a few seats left and many people booking at once. Locking the row for every request ' +
      'would serialise the whole system; instead, read the departure with its version and write back only if nobody changed it in between. ' +
      'VersionedStore (given) offers Get (value and version) and TryReplace(id, expectedVersion, value), which fails when the version moved on. ' +
      'Implement SeatBooking.TryBook(store, departureId, seats, maxAttempts = 5): seats must be at least 1 (ArgumentOutOfRangeException); ' +
      'read; if Booked + seats would exceed Capacity return SoldOut; otherwise try the conditional write; on a conflict re-read and decide ' +
      'again — the competitor may have taken the last seats — up to maxAttempts conditional writes, then TooBusy. Never oversell, and never ' +
      'write without the version you read.',
    starterCode: VERSIONED_STORE + `
public enum BookingOutcome { Booked, SoldOut, TooBusy }

public static class SeatBooking
{
    public static BookingOutcome TryBook(VersionedStore store, string departureId, int seats, int maxAttempts = 5) => throw new NotImplementedException();
}
`,
    hints: [
      'Loop for (int attempt = 0; attempt < maxAttempts; attempt++): var (departure, version) = store.Get(id); check capacity; if store.TryReplace(id, version, departure with { Booked = … }) return Booked.',
      'The capacity check must happen inside the loop, after every re-read — that is what stops the overselling.',
      'Records make the new value easy: departure with { Booked = departure.Booked + seats }.',
    ],
    solution: VERSIONED_STORE + `
public enum BookingOutcome { Booked, SoldOut, TooBusy }

public static class SeatBooking
{
    public static BookingOutcome TryBook(VersionedStore store, string departureId, int seats, int maxAttempts = 5)
    {
        if (seats < 1) throw new ArgumentOutOfRangeException(nameof(seats));
        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            var (departure, version) = store.Get(departureId);
            if (departure.Booked + seats > departure.Capacity) return BookingOutcome.SoldOut;
            if (store.TryReplace(departureId, version, departure with { Booked = departure.Booked + seats })) return BookingOutcome.Booked;
            // Someone else wrote first: re-read and decide again with the new numbers.
        }
        return BookingOutcome.TooBusy;
    }
}
`,
    testCode: csTests(`
VersionedStore Store(int capacity, int booked) { var s = new VersionedStore(); s.Put(new Departure("ACC-KSI-0700", capacity, booked)); return s; }
Check("books when seats remain", () => { var s = Store(50, 10); return SeatBooking.TryBook(s, "ACC-KSI-0700", 2) + ":" + s.Get("ACC-KSI-0700").Value.Booked; }, "Booked:12");
Check("refuses more seats than remain", () => { var s = Store(50, 49); return SeatBooking.TryBook(s, "ACC-KSI-0700", 2) + ":" + s.Get("ACC-KSI-0700").Value.Booked; }, "SoldOut:49");
Check("takes the very last seat", () => SeatBooking.TryBook(Store(50, 49), "ACC-KSI-0700", 1), BookingOutcome.Booked);
Check("retries after losing a race", () =>
{
    var s = Store(50, 10);
    int competitors = 2;
    s.BeforeConditionalWrite = id => { if (competitors-- > 0) { var d = s.Get(id).Value; s.Put(d with { Booked = d.Booked + 1 }); } };
    return SeatBooking.TryBook(s, "ACC-KSI-0700", 3) + ":" + s.Get("ACC-KSI-0700").Value.Booked + ":" + s.ConditionalWrites;
}, "Booked:15:3");
Check("re-checks capacity after a conflict", () =>
{
    var s = Store(50, 47);
    bool raced = false;
    s.BeforeConditionalWrite = id => { if (!raced) { raced = true; var d = s.Get(id).Value; s.Put(d with { Booked = 49 }); } };
    return SeatBooking.TryBook(s, "ACC-KSI-0700", 2) + ":" + s.Get("ACC-KSI-0700").Value.Booked;
}, "SoldOut:49");
Check("gives up after maxAttempts conflicts", () =>
{
    var s = Store(50, 0);
    s.BeforeConditionalWrite = id => { var d = s.Get(id).Value; s.Put(d); };   // always someone first
    return SeatBooking.TryBook(s, "ACC-KSI-0700", 1, maxAttempts: 4) + ":" + s.ConditionalWrites;
}, "TooBusy:4");
Expect("never oversells under heavy contention", () =>
{
    var s = Store(30, 0);
    var rng = new Random(7);
    s.BeforeConditionalWrite = id => { if (rng.NextDouble() < 0.4) { var d = s.Get(id).Value; if (d.Booked < d.Capacity) s.Put(d with { Booked = d.Booked + 1 }); } };
    for (int i = 0; i < 200; i++) SeatBooking.TryBook(s, "ACC-KSI-0700", 1 + i % 3);
    var final = s.Get("ACC-KSI-0700").Value;
    return final.Booked <= final.Capacity;
}, "booked seats exceeded capacity");
Throws<ArgumentOutOfRangeException>("seats must be positive", () => SeatBooking.TryBook(Store(50, 0), "ACC-KSI-0700", 0));
`),
  },
  {
    id: 'cs-6-11',
    title: 'A Mobile Money Payment State Machine',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'With mobile money (MTN MoMo, M-Pesa, Telecel Cash), "pay" means: the provider accepts the request, the customer gets a prompt on their ' +
      'phone, and the result arrives later — as a callback, by polling, sometimes twice, sometimes after you gave up. Model one payment. ' +
      'MobileMoneyPayment(paymentId, amountMinor, currency, createdAt, expiresAfter) starts Initiated. Accepted(reference) moves Initiated → ' +
      'Pending and records the provider reference (repeating the same reference is ignored; a different one is an InvalidOperationException). ' +
      'Apply(update, now) handles a provider update: ignore one whose ProviderReference is not ours, and status "PENDING". "SUCCESSFUL": if the ' +
      'amount or currency differs from ours → NeedsReview ("amount mismatch"); from Initiated/Pending → Succeeded; from Expired → NeedsReview ' +
      '("paid after expiry" — the customer was charged, so a person must refund or honour it); from Failed → NeedsReview ("conflicting results"); ' +
      'already Succeeded → nothing (a duplicate). "FAILED": Initiated/Pending → Failed; Succeeded → NeedsReview ("conflicting results"); ' +
      'otherwise nothing. Tick(now) expires an Initiated or Pending payment once expiresAfter has passed since createdAt. NeedsReview is final. ' +
      'Record every change in History as "From->To".',
    starterCode: `public enum PaymentState { Initiated, Pending, Succeeded, Failed, Expired, NeedsReview }

public sealed record ProviderUpdate(string ProviderReference, string Status, long AmountMinor, string Currency);

public sealed class MobileMoneyPayment
{
    public MobileMoneyPayment(string paymentId, long amountMinor, string currency, DateTimeOffset createdAt, TimeSpan expiresAfter) => throw new NotImplementedException();

    public string PaymentId => throw new NotImplementedException();
    public PaymentState State => throw new NotImplementedException();
    public string? ProviderReference => throw new NotImplementedException();
    public string? Reason => throw new NotImplementedException();
    public IReadOnlyList<string> History => throw new NotImplementedException();

    public void Accepted(string providerReference) => throw new NotImplementedException();
    public void Apply(ProviderUpdate update, DateTimeOffset now) => throw new NotImplementedException();
    public void Tick(DateTimeOffset now) => throw new NotImplementedException();
}
`,
    hints: [
      'Write one private MoveTo(PaymentState next, string? reason = null) that does nothing when the state is unchanged and otherwise records "From->To".',
      'Handle the update with a switch on (update.Status, State) tuples — every row of the prompt\'s rules becomes one case.',
      'Check the reference first: if ProviderReference is null or differs from the update\'s, the update is not about this payment.',
    ],
    solution: `public enum PaymentState { Initiated, Pending, Succeeded, Failed, Expired, NeedsReview }

public sealed record ProviderUpdate(string ProviderReference, string Status, long AmountMinor, string Currency);

public sealed class MobileMoneyPayment
{
    private readonly long _amountMinor;
    private readonly string _currency;
    private readonly DateTimeOffset _expiresAt;
    private readonly List<string> _history = [];

    public MobileMoneyPayment(string paymentId, long amountMinor, string currency, DateTimeOffset createdAt, TimeSpan expiresAfter)
    {
        if (amountMinor <= 0) throw new ArgumentOutOfRangeException(nameof(amountMinor));
        (PaymentId, _amountMinor, _currency, _expiresAt) = (paymentId, amountMinor, currency, createdAt + expiresAfter);
    }

    public string PaymentId { get; }
    public PaymentState State { get; private set; } = PaymentState.Initiated;
    public string? ProviderReference { get; private set; }
    public string? Reason { get; private set; }
    public IReadOnlyList<string> History => _history;

    public void Accepted(string providerReference)
    {
        if (ProviderReference is not null)
        {
            if (ProviderReference != providerReference)
                throw new InvalidOperationException($"Payment {PaymentId} already has provider reference {ProviderReference}.");
            return;
        }
        ProviderReference = providerReference;
        if (State == PaymentState.Initiated) MoveTo(PaymentState.Pending);
    }

    public void Apply(ProviderUpdate update, DateTimeOffset now)
    {
        if (ProviderReference is null || update.ProviderReference != ProviderReference) return;   // not ours
        if (State == PaymentState.NeedsReview) return;                                          // a person decides now
        switch (update.Status, State)
        {
            case ("SUCCESSFUL", _) when update.AmountMinor != _amountMinor || update.Currency != _currency:
                MoveTo(PaymentState.NeedsReview, "amount mismatch");
                break;
            case ("SUCCESSFUL", PaymentState.Initiated or PaymentState.Pending):
                MoveTo(PaymentState.Succeeded);
                break;
            case ("SUCCESSFUL", PaymentState.Expired):
                MoveTo(PaymentState.NeedsReview, "paid after expiry");
                break;
            case ("SUCCESSFUL", PaymentState.Failed):
            case ("FAILED", PaymentState.Succeeded):
                MoveTo(PaymentState.NeedsReview, "conflicting results");
                break;
            case ("FAILED", PaymentState.Initiated or PaymentState.Pending):
                MoveTo(PaymentState.Failed);
                break;
            // PENDING, duplicates and late failures after expiry change nothing.
        }
    }

    public void Tick(DateTimeOffset now)
    {
        if (State is PaymentState.Initiated or PaymentState.Pending && now >= _expiresAt) MoveTo(PaymentState.Expired);
    }

    private void MoveTo(PaymentState next, string? reason = null)
    {
        if (next == State) return;
        _history.Add(State + "->" + next);
        State = next;
        if (reason is not null) Reason = reason;
    }
}
`,
    testCode: csTests(`
var t0 = DateTimeOffset.Parse("2026-12-01T10:00:00Z");
MobileMoneyPayment Pay() => new("pay-1", 25_000, "GHS", t0, TimeSpan.FromMinutes(5));
MobileMoneyPayment Pending() { var p = Pay(); p.Accepted("MOMO-778"); return p; }
ProviderUpdate U(string status, long amount = 25_000, string currency = "GHS", string reference = "MOMO-778") => new(reference, status, amount, currency);
Check("accepted by the provider means pending", () => Pending().State + ":" + Pending().ProviderReference, "Pending:MOMO-778");
Check("a success callback completes it", () => { var p = Pending(); p.Apply(U("SUCCESSFUL"), t0.AddSeconds(40)); return p.State; }, PaymentState.Succeeded);
Check("a failure callback fails it", () => { var p = Pending(); p.Apply(U("FAILED"), t0.AddSeconds(40)); return p.State; }, PaymentState.Failed);
Check("PENDING updates change nothing", () => { var p = Pending(); p.Apply(U("PENDING"), t0.AddSeconds(10)); return p.State; }, PaymentState.Pending);
Check("duplicate callbacks are harmless", () => { var p = Pending(); p.Apply(U("SUCCESSFUL"), t0); p.Apply(U("SUCCESSFUL"), t0.AddSeconds(1)); return string.Join(",", p.History); }, "Initiated->Pending,Pending->Succeeded");
Check("updates for other payments are ignored", () => { var p = Pending(); p.Apply(U("SUCCESSFUL", reference: "MOMO-999"), t0); return p.State; }, PaymentState.Pending);
Check("an update before the provider accepted is ignored", () => { var p = Pay(); p.Apply(U("SUCCESSFUL"), t0); return p.State; }, PaymentState.Initiated);
Check("a wrong amount needs a person", () => { var p = Pending(); p.Apply(U("SUCCESSFUL", amount: 2_500), t0); return p.State + ":" + p.Reason; }, "NeedsReview:amount mismatch");
Check("a wrong currency needs a person", () => { var p = Pending(); p.Apply(U("SUCCESSFUL", currency: "NGN"), t0); return p.State + ":" + p.Reason; }, "NeedsReview:amount mismatch");
Check("silence expires the payment", () => { var p = Pending(); p.Tick(t0.AddMinutes(4)); var before = p.State; p.Tick(t0.AddMinutes(5)); return before + ":" + p.State; }, "Pending:Expired");
Check("money arriving after expiry needs a person", () => { var p = Pending(); p.Tick(t0.AddMinutes(6)); p.Apply(U("SUCCESSFUL"), t0.AddMinutes(7)); return p.State + ":" + p.Reason; }, "NeedsReview:paid after expiry");
Check("a late failure after expiry changes nothing", () => { var p = Pending(); p.Tick(t0.AddMinutes(6)); p.Apply(U("FAILED"), t0.AddMinutes(7)); return p.State; }, PaymentState.Expired);
Check("conflicting results need a person", () => { var p = Pending(); p.Apply(U("SUCCESSFUL"), t0); p.Apply(U("FAILED"), t0.AddSeconds(5)); return p.State + ":" + p.Reason; }, "NeedsReview:conflicting results");
Check("review is final", () => { var p = Pending(); p.Apply(U("SUCCESSFUL", amount: 1), t0); p.Apply(U("SUCCESSFUL"), t0); p.Tick(t0.AddHours(1)); return p.State + ":" + p.History.Count; }, "NeedsReview:2");
Check("a succeeded payment does not expire", () => { var p = Pending(); p.Apply(U("SUCCESSFUL"), t0); p.Tick(t0.AddHours(1)); return p.State; }, PaymentState.Succeeded);
Throws<InvalidOperationException>("a second, different reference", () => { var p = Pending(); p.Accepted("MOMO-779"); });
`),
  },
  {
    id: 'cs-6-12',
    title: 'Reconcile Your Ledger with the Provider\'s Settlement Report',
    difficulty: 'Hard',
    language: 'csharp',
    category: CATEGORY,
    prompt:
      'Every morning the payment provider sends a settlement CSV for yesterday. Callbacks get lost and systems disagree, so finance needs ' +
      'the differences, not a feeling. Reconciler.Reconcile(ledger, csv): the CSV has a header "reference,amount,currency,fee,status" with ' +
      'amounts and fees in major units ("250.00") — convert to minor units with InvariantCulture, rounding to the nearest unit; ignore blank ' +
      'lines and surrounding spaces; a line without five fields or with an unreadable number is a FormatException naming its line number ' +
      '(the header is line 1). Only rows with status SUCCESS count. Report, each list sorted ordinally: Matched — payment ids we marked ' +
      'Succeeded that the provider settled for the same amount and currency; AmountMismatches — payment ids settled for a different amount or ' +
      'currency; MissingAtProvider — payment ids we marked Succeeded that the provider did not settle; UnknownToUs — references the provider ' +
      'settled that we have no ledger entry for, or did not mark Succeeded; Duplicates — references settled more than once (count only the ' +
      'first). SettledMinor and FeesMinor total the counted SUCCESS rows.',
    starterCode: `public sealed record LedgerEntry(string PaymentId, string ProviderReference, long AmountMinor, string Currency, string Status);

public sealed record ReconciliationReport(
    IReadOnlyList<string> Matched,
    IReadOnlyList<string> AmountMismatches,
    IReadOnlyList<string> MissingAtProvider,
    IReadOnlyList<string> UnknownToUs,
    IReadOnlyList<string> Duplicates,
    long SettledMinor,
    long FeesMinor);

public static class Reconciler
{
    public static ReconciliationReport Reconcile(IEnumerable<LedgerEntry> ledger, string settlementCsv) => throw new NotImplementedException();
}
`,
    hints: [
      'Parse first into a Dictionary<string, (long Amount, string Currency)> of SUCCESS rows keyed by reference, adding repeats to a duplicates set instead.',
      'decimal.Parse(text, NumberStyles.Number, CultureInfo.InvariantCulture) then (long)Math.Round(value * 100, MidpointRounding.AwayFromZero).',
      'Walk our Succeeded entries against the settled dictionary (matched, mismatched or missing), then walk the dictionary for references we do not have as Succeeded.',
    ],
    solution: `using System.Globalization;

public sealed record LedgerEntry(string PaymentId, string ProviderReference, long AmountMinor, string Currency, string Status);

public sealed record ReconciliationReport(
    IReadOnlyList<string> Matched,
    IReadOnlyList<string> AmountMismatches,
    IReadOnlyList<string> MissingAtProvider,
    IReadOnlyList<string> UnknownToUs,
    IReadOnlyList<string> Duplicates,
    long SettledMinor,
    long FeesMinor);

public static class Reconciler
{
    public static ReconciliationReport Reconcile(IEnumerable<LedgerEntry> ledger, string settlementCsv)
    {
        var settled = new Dictionary<string, (long Amount, string Currency)>(StringComparer.Ordinal);
        var duplicates = new SortedSet<string>(StringComparer.Ordinal);
        long settledTotal = 0, fees = 0;

        var lines = settlementCsv.Replace("\\r\\n", "\\n").Split('\\n');
        for (int i = 1; i < lines.Length; i++)                     // line 1 is the header
        {
            var line = lines[i].Trim();
            if (line.Length == 0) continue;
            var f = line.Split(',').Select(x => x.Trim()).ToArray();
            if (f.Length != 5) throw new FormatException($"Line {i + 1}: expected 5 fields, found {f.Length}.");
            long amount = Minor(f[1], i + 1), fee = Minor(f[3], i + 1);
            if (f[4] != "SUCCESS") continue;
            if (!settled.TryAdd(f[0], (amount, f[2]))) { duplicates.Add(f[0]); continue; }
            settledTotal += amount;
            fees += fee;
        }

        var entries = ledger.ToList();
        var ours = entries.Where(e => e.Status == "Succeeded").ToList();
        var matched = new List<string>();
        var mismatched = new List<string>();
        var missing = new List<string>();
        foreach (var e in ours)
        {
            if (!settled.TryGetValue(e.ProviderReference, out var s)) missing.Add(e.PaymentId);
            else if (s.Amount == e.AmountMinor && s.Currency == e.Currency) matched.Add(e.PaymentId);
            else mismatched.Add(e.PaymentId);
        }
        var oursByReference = ours.Select(e => e.ProviderReference).ToHashSet(StringComparer.Ordinal);
        var unknown = settled.Keys.Where(r => !oursByReference.Contains(r)).ToList();

        static List<string> Sorted(List<string> items) { items.Sort(StringComparer.Ordinal); return items; }
        return new ReconciliationReport(Sorted(matched), Sorted(mismatched), Sorted(missing), Sorted(unknown), duplicates.ToList(), settledTotal, fees);
    }

    private static long Minor(string text, int line)
    {
        if (!decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
            throw new FormatException($"Line {line}: '{text}' is not an amount.");
        return (long)Math.Round(value * 100, MidpointRounding.AwayFromZero);
    }
}
`,
    testCode: csTests(`
LedgerEntry[] ledger =
[
    new("pay-1", "R1", 25_000, "GHS", "Succeeded"),
    new("pay-2", "R2", 10_000, "GHS", "Succeeded"),
    new("pay-3", "R3", 5_000, "GHS", "Succeeded"),
    new("pay-4", "R4", 7_500, "GHS", "Failed"),
    new("pay-5", "R5", 1_000, "KES", "Succeeded"),
];
const string Csv = """
reference,amount,currency,fee,status
R1,250.00,GHS,2.50,SUCCESS
R2, 99.99 ,GHS,1.00,SUCCESS

R4,75.00,GHS,0.75,SUCCESS
R9,12.00,GHS,0.12,SUCCESS
R1,250.00,GHS,2.50,SUCCESS
R5,10.00,KES,0.10,REVERSED
""";
ReconciliationReport Report() => Reconciler.Reconcile(ledger, Csv);
CheckSeq("matched", () => Report().Matched, ["pay-1"]);
CheckSeq("amount mismatches", () => Report().AmountMismatches, ["pay-2"]);
CheckSeq("we were paid, the provider says no", () => Report().MissingAtProvider, ["pay-3", "pay-5"]);
CheckSeq("the provider settled what we did not count", () => Report().UnknownToUs, ["R4", "R9"]);
CheckSeq("duplicates", () => Report().Duplicates, ["R1"]);
Check("settled total counts each reference once", () => Report().SettledMinor, 25_000L + 9_999 + 7_500 + 1_200);
Check("fees", () => Report().FeesMinor, 250L + 100 + 75 + 12);
Check("currency matters, not just the number", () => Reconciler.Reconcile([new("p", "R", 1000, "GHS", "Succeeded")], "reference,amount,currency,fee,status\\nR,10.00,NGN,0,SUCCESS").AmountMismatches.Single(), "p");
Check("rounds to the nearest minor unit", () => Reconciler.Reconcile([], "reference,amount,currency,fee,status\\nX,0.125,GHS,0.005,SUCCESS").SettledMinor + ":" + Reconciler.Reconcile([], "reference,amount,currency,fee,status\\nX,0.125,GHS,0.005,SUCCESS").FeesMinor, "13:1");
Check("Windows line endings are fine", () => Reconciler.Reconcile([], "reference,amount,currency,fee,status\\r\\nA,1.00,GHS,0,SUCCESS\\r\\n").SettledMinor, 100L);
Check("a malformed line names its line number", () => { try { Reconciler.Reconcile([], "reference,amount,currency,fee,status\\nA,1.00,GHS,0,SUCCESS\\nB,abc,GHS,0,SUCCESS"); return "no error"; } catch (FormatException e) { return e.Message.Contains("Line 3") ? "line 3" : e.Message; } }, "line 3");
Throws<FormatException>("a short line is malformed", () => Reconciler.Reconcile([], "reference,amount,currency,fee,status\\nA,1.00,GHS"));
`),
  },
];
