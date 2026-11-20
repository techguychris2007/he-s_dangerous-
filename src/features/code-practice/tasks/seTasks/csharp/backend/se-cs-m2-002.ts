import { pf, type ProjectTask } from '../../../projectTypes';
import { csTests } from '../../../csharpTasks/harness';

const README = `# Week 6 Assignment: Booking Data Platform

The data layer of a meeting-room booking platform, in two parts. Both are graded.

## Part 1 — SQL (runs on real SQLite in your browser)

### \`schema.sql\`
Design three tables so the database itself rejects bad data:

- **rooms** — \`id INTEGER PRIMARY KEY\`, \`name\` (required, unique), \`capacity\` (required, 1–500).
- **customers** — \`id INTEGER PRIMARY KEY\`, \`email\` (required, unique **ignoring case** — hint: \`COLLATE NOCASE\`),
  \`full_name\` (required).
- **bookings** — \`id INTEGER PRIMARY KEY\`, \`room_id\` and \`customer_id\` (required foreign keys), \`starts_at\` and
  \`ends_at\` (required text, \`'YYYY-MM-DD HH:MM'\`, and \`ends_at\` must be after \`starts_at\`), \`attendees\` (at least
  1), \`status\` (\`'confirmed'\` or \`'cancelled'\`).
- An **index** that serves the overlap check below — the grader reads SQLite's query plan.

\`\`\`sql
SELECT 1 FROM bookings WHERE room_id = ? AND starts_at < ? AND ends_at > ?;
\`\`\`

### Queries (named parameters such as \`:start\`)

- \`queries/available_rooms.sql\` — rooms with \`capacity >= :attendees\` and **no confirmed booking overlapping**
  \`[:start, :end)\`, ordered by capacity then name. Columns: \`name\`, \`capacity\`.
- \`queries/room_utilisation.sql\` — for **every** room: confirmed bookings starting in \`[:from, :to)\` and the hours
  they cover (\`ROUND(…, 1)\`; rooms with none show 0). Order by hours descending, then name. Columns:
  \`room\`, \`bookings\`, \`hours\`.
- \`queries/customer_history.sql\` — every booking of the customer whose email equals \`:email\` (any case), newest
  first. Columns: \`room\`, \`starts_at\`, \`status\`.

\`seed.sql\` contains the data the grader loads after your schema. **Run** executes \`schema.sql\`.

Hours in SQLite: \`(julianday(ends_at) - julianday(starts_at)) * 24\`.

## Part 2 — \`BookingService.cs\` (C#)

\`BookAsync\` must stay correct when many requests arrive at once. \`SlowBookingStore\` deliberately pauses between
operations, so a naive "check, then insert" lets two requests both see a free room and both insert.

- Invalid requests → \`BookResult.Invalid(reason)\`: end not after start, longer than 8 hours, or attendees < 1.
- An overlapping confirmed booking → \`BookResult.Conflict\`.
- Otherwise insert and return \`BookResult.Booked(id)\`.
- **Requests for the same room must not race**; requests for **different rooms must still run in parallel**
  (a single global lock fails the parallelism check). Hint: one \`SemaphoreSlim\` per room.

In production the database enforces this with a transaction and a lock or exclusion constraint (see the
lesson); in-process locking alone is not enough once you run more than one instance of the API.

## Working locally

Create the schema in PostgreSQL with Docker (\`docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:17\`),
port the SQL (\`TIMESTAMPTZ\` instead of text, an exclusion constraint for overlaps), and write a Testcontainers
test that fires two concurrent bookings at the real database — the challenge suggested in your study plan.
`;

const SEED = `INSERT INTO rooms (id, name, capacity) VALUES
  (1, 'Accra', 10), (2, 'Kumasi', 4), (3, 'Tamale', 20), (4, 'Ho', 6);

INSERT INTO customers (id, email, full_name) VALUES
  (1, 'ama@example.com', 'Ama Owusu'), (2, 'kofi@example.com', 'Kofi Mensah'), (3, 'esi@example.com', 'Esi Boateng');

INSERT INTO bookings (id, room_id, customer_id, starts_at, ends_at, attendees, status) VALUES
  (1, 1, 1, '2026-03-02 09:00', '2026-03-02 11:00', 8, 'confirmed'),
  (2, 1, 2, '2026-03-02 13:00', '2026-03-02 14:30', 5, 'confirmed'),
  (3, 2, 2, '2026-03-02 09:30', '2026-03-02 10:30', 3, 'confirmed'),
  (4, 3, 3, '2026-03-02 10:00', '2026-03-02 12:00', 15, 'cancelled'),
  (5, 3, 1, '2026-03-03 09:00', '2026-03-03 17:00', 18, 'confirmed'),
  (6, 4, 3, '2026-02-27 09:00', '2026-02-27 10:00', 4, 'confirmed'),
  (7, 2, 1, '2026-03-05 15:00', '2026-03-05 16:00', 2, 'confirmed');
`;

const SCHEMA_STARTER = `-- TODO: add the constraints and the index described in README.md.
CREATE TABLE rooms (
    id INTEGER PRIMARY KEY,
    name TEXT,
    capacity INTEGER
);

CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    email TEXT,
    full_name TEXT
);

CREATE TABLE bookings (
    id INTEGER PRIMARY KEY,
    room_id INTEGER,
    customer_id INTEGER,
    starts_at TEXT,
    ends_at TEXT,
    attendees INTEGER,
    status TEXT
);
`;

const SCHEMA_SOLUTION = `CREATE TABLE rooms (
    id       INTEGER PRIMARY KEY,
    name     TEXT    NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500)
);

CREATE TABLE customers (
    id        INTEGER PRIMARY KEY,
    email     TEXT NOT NULL UNIQUE COLLATE NOCASE,
    full_name TEXT NOT NULL
);

CREATE TABLE bookings (
    id          INTEGER PRIMARY KEY,
    room_id     INTEGER NOT NULL REFERENCES rooms(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    starts_at   TEXT    NOT NULL,
    ends_at     TEXT    NOT NULL,
    attendees   INTEGER NOT NULL CHECK (attendees >= 1),
    status      TEXT    NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
    CHECK (ends_at > starts_at)
);

-- Serves the overlap check: equality on room_id, then a range on starts_at.
CREATE INDEX ix_bookings_room_start ON bookings (room_id, starts_at);
`;

const AVAILABLE_STARTER = `-- Rooms with capacity >= :attendees and no confirmed booking overlapping [:start, :end).
SELECT name, capacity FROM rooms WHERE 0;
`;
const AVAILABLE_SOLUTION = `SELECT r.name, r.capacity
FROM rooms r
WHERE r.capacity >= :attendees
  AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.room_id = r.id
        AND b.status = 'confirmed'
        AND b.starts_at < :end
        AND b.ends_at > :start)
ORDER BY r.capacity, r.name;
`;

const UTILISATION_STARTER = `-- Every room: confirmed bookings starting in [:from, :to) and the hours they cover.
SELECT name AS room, 0 AS bookings, 0 AS hours FROM rooms WHERE 0;
`;
const UTILISATION_SOLUTION = `SELECT r.name AS room,
       COUNT(b.id) AS bookings,
       ROUND(COALESCE(SUM((julianday(b.ends_at) - julianday(b.starts_at)) * 24), 0), 1) AS hours
FROM rooms r
LEFT JOIN bookings b
       ON b.room_id = r.id
      AND b.status = 'confirmed'
      AND b.starts_at >= :from
      AND b.starts_at < :to
GROUP BY r.id, r.name
ORDER BY hours DESC, r.name;
`;

const HISTORY_STARTER = `-- Every booking of the customer with email :email (any case), newest first.
SELECT '' AS room, '' AS starts_at, '' AS status WHERE 0;
`;
const HISTORY_SOLUTION = `SELECT r.name AS room, b.starts_at, b.status
FROM bookings b
JOIN customers c ON c.id = b.customer_id
JOIN rooms r ON r.id = b.room_id
WHERE c.email = :email
ORDER BY b.starts_at DESC;
`;

const SQL_TESTS = `
exec(file('schema.sql'));
exec(file('seed.sql'));
const fails = (sql) => tryExec(sql) !== null;
check('capacity must be 1-500', fails("INSERT INTO rooms (name, capacity) VALUES ('Tiny', 0)") && fails("INSERT INTO rooms (name, capacity) VALUES ('Huge', 501)"), 'a room with capacity 0 or 501 was accepted');
check('room names unique', fails("INSERT INTO rooms (name, capacity) VALUES ('Accra', 5)"), 'a duplicate room name was accepted');
check('room name required', fails("INSERT INTO rooms (name, capacity) VALUES (NULL, 5)"), 'a room without a name was accepted');
check('emails unique ignoring case', fails("INSERT INTO customers (email, full_name) VALUES ('AMA@EXAMPLE.COM', 'Copy')"), 'AMA@EXAMPLE.COM was accepted alongside ama@example.com');
check('booking needs a real room', fails("INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, attendees, status) VALUES (99, 1, '2026-04-01 09:00', '2026-04-01 10:00', 1, 'confirmed')"), 'a booking for room 99 was accepted (foreign key missing)');
check('booking needs a real customer', fails("INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, attendees, status) VALUES (1, 99, '2026-04-01 09:00', '2026-04-01 10:00', 1, 'confirmed')"), 'a booking for customer 99 was accepted');
check('end after start', fails("INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, attendees, status) VALUES (1, 1, '2026-04-01 10:00', '2026-04-01 10:00', 1, 'confirmed')"), 'a zero-length booking was accepted');
check('status restricted', fails("INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, attendees, status) VALUES (1, 1, '2026-04-01 09:00', '2026-04-01 10:00', 1, 'pending')"), "status 'pending' was accepted");
check('attendees at least 1', fails("INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, attendees, status) VALUES (1, 1, '2026-04-01 09:00', '2026-04-01 10:00', 0, 'confirmed')"), 'attendees 0 was accepted');
check('valid booking accepted', tryExec("INSERT INTO bookings (room_id, customer_id, starts_at, ends_at, attendees, status) VALUES (4, 2, '2026-04-01 09:00', '2026-04-01 10:00', 2, 'confirmed')") === null, 'a valid booking was rejected');
exec('DELETE FROM bookings WHERE id > 7');

const plan = rows("EXPLAIN QUERY PLAN SELECT 1 FROM bookings WHERE room_id = 1 AND starts_at < '2026-03-02 12:00' AND ends_at > '2026-03-02 10:00'").map(r => r.detail).join(' ');
check('overlap check uses an index', /bookings USING (COVERING )?INDEX/.test(plan) && /room_id=/.test(plan), 'query plan: ' + plan);

const names = (rs) => rs.map(r => r.name).join(', ');
const avail = (start, end, attendees) => rows(file('queries/available_rooms.sql'), { ':start': start, ':end': end, ':attendees': attendees });
check('available: overlaps and cancelled', names(avail('2026-03-02 10:00', '2026-03-02 11:00', 4)) === 'Ho, Tamale', 'got ' + names(avail('2026-03-02 10:00', '2026-03-02 11:00', 4)));
check('available: capacity', names(avail('2026-03-02 12:00', '2026-03-02 13:00', 12)) === 'Tamale', 'got ' + names(avail('2026-03-02 12:00', '2026-03-02 13:00', 12)));
check('available: touching is free', names(avail('2026-03-02 11:00', '2026-03-02 12:00', 1)) === 'Kumasi, Ho, Accra, Tamale', 'got ' + names(avail('2026-03-02 11:00', '2026-03-02 12:00', 1)));

const util = rows(file('queries/room_utilisation.sql'), { ':from': '2026-03-01 00:00', ':to': '2026-04-01 00:00' });
const utilText = util.map(r => r.room + ' ' + r.bookings + ' ' + Number(r.hours).toFixed(1)).join(', ');
check('utilisation per room', utilText === 'Tamale 1 8.0, Accra 2 3.5, Kumasi 2 2.0, Ho 0 0.0', 'got ' + utilText);

const hist = rows(file('queries/customer_history.sql'), { ':email': 'AMA@example.com' });
const histText = hist.map(r => r.room + '@' + r.starts_at + ':' + r.status).join(', ');
check('customer history newest first', histText === 'Kumasi@2026-03-05 15:00:confirmed, Tamale@2026-03-03 09:00:confirmed, Accra@2026-03-02 09:00:confirmed', 'got ' + histText);
`;

const STORE = `public sealed record Booking(int Id, int RoomId, DateTime Start, DateTime End, int Attendees);

public interface IBookingStore
{
    Task<bool> HasOverlapAsync(int roomId, DateTime start, DateTime end, CancellationToken ct);
    Task<int> InsertAsync(int roomId, DateTime start, DateTime end, int attendees, CancellationToken ct);
    IReadOnlyList<Booking> All { get; }
}

/// <summary>An in-memory store that pauses inside every operation, like a real database round trip,
/// so concurrent requests interleave exactly where race conditions happen.</summary>
public sealed class SlowBookingStore : IBookingStore
{
    private readonly List<Booking> _bookings = [];
    private int _nextId = 1;
    private int _inFlight;
    public int MaxInFlight { get; private set; }
    public IReadOnlyList<Booking> All => _bookings;

    public async Task<bool> HasOverlapAsync(int roomId, DateTime start, DateTime end, CancellationToken ct)
    {
        Enter();
        try
        {
            await Task.Delay(5, ct);
            return _bookings.Any(b => b.RoomId == roomId && b.Start < end && b.End > start);
        }
        finally { _inFlight--; }
    }

    public async Task<int> InsertAsync(int roomId, DateTime start, DateTime end, int attendees, CancellationToken ct)
    {
        Enter();
        try
        {
            await Task.Delay(5, ct);
            var booking = new Booking(_nextId++, roomId, start, end, attendees);
            _bookings.Add(booking);
            return booking.Id;
        }
        finally { _inFlight--; }
    }

    private void Enter() { _inFlight++; MaxInFlight = Math.Max(MaxInFlight, _inFlight); }
}

public abstract record BookResult
{
    public sealed record Booked(int Id) : BookResult;
    public sealed record Conflict : BookResult;
    public sealed record Invalid(string Reason) : BookResult;
}

public sealed record BookRequest(int RoomId, DateTime Start, DateTime End, int Attendees);
`;

const SERVICE_STARTER = `public sealed class BookingService(IBookingStore store)
{
    public static readonly TimeSpan MaxDuration = TimeSpan.FromHours(8);

    public Task<BookResult> BookAsync(BookRequest request, CancellationToken ct) => throw new NotImplementedException();
}
`;

const SERVICE_SOLUTION = `using System.Collections.Concurrent;

public sealed class BookingService(IBookingStore store)
{
    public static readonly TimeSpan MaxDuration = TimeSpan.FromHours(8);

    private readonly ConcurrentDictionary<int, SemaphoreSlim> _roomLocks = new();

    public async Task<BookResult> BookAsync(BookRequest request, CancellationToken ct)
    {
        if (request.End <= request.Start) return new BookResult.Invalid("The booking must end after it starts.");
        if (request.End - request.Start > MaxDuration) return new BookResult.Invalid("Bookings can be at most 8 hours.");
        if (request.Attendees < 1) return new BookResult.Invalid("At least one attendee is required.");

        var gate = _roomLocks.GetOrAdd(request.RoomId, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(ct);
        try
        {
            if (await store.HasOverlapAsync(request.RoomId, request.Start, request.End, ct)) return new BookResult.Conflict();
            int id = await store.InsertAsync(request.RoomId, request.Start, request.End, request.Attendees, ct);
            return new BookResult.Booked(id);
        }
        finally
        {
            gate.Release();
        }
    }
}
`;

const PROGRAM = `var store = new SlowBookingStore();
var service = new BookingService(store);
var slot = new BookRequest(1, new DateTime(2026, 3, 2, 10, 0, 0), new DateTime(2026, 3, 2, 11, 0, 0), 4);
var results = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => service.BookAsync(slot, CancellationToken.None)));
Console.WriteLine(string.Join(", ", results.Select(r => r.GetType().Name)));
Console.WriteLine($"Bookings stored: {store.All.Count}");
`;

const CS_TESTS = csTests(`
var day = new DateTime(2026, 3, 2);
BookRequest Req(int room, int startHour, int endHour, int attendees = 2) => new(room, day.AddHours(startHour), day.AddHours(endHour), attendees);
var none = CancellationToken.None;
await CheckAsync("books a free slot", async () => await new BookingService(new SlowBookingStore()).BookAsync(Req(1, 9, 10), none) is BookResult.Booked, true);
await CheckAsync("end before start invalid", async () => await new BookingService(new SlowBookingStore()).BookAsync(Req(1, 10, 9), none) is BookResult.Invalid, true);
await CheckAsync("too long invalid", async () => await new BookingService(new SlowBookingStore()).BookAsync(Req(1, 8, 17), none) is BookResult.Invalid, true);
await CheckAsync("eight hours is fine", async () => await new BookingService(new SlowBookingStore()).BookAsync(Req(1, 8, 16), none) is BookResult.Booked, true);
await CheckAsync("no attendees invalid", async () => await new BookingService(new SlowBookingStore()).BookAsync(Req(1, 9, 10, 0), none) is BookResult.Invalid, true);
await CheckAsync("sequential overlap conflicts", async () => { var s = new BookingService(new SlowBookingStore()); await s.BookAsync(Req(1, 9, 11), none); return await s.BookAsync(Req(1, 10, 12), none) is BookResult.Conflict; }, true);
await CheckAsync("touching is allowed", async () => { var s = new BookingService(new SlowBookingStore()); await s.BookAsync(Req(1, 9, 10), none); return await s.BookAsync(Req(1, 10, 11), none) is BookResult.Booked; }, true);
await CheckAsync("20 concurrent requests, one winner", async () =>
{
    var store = new SlowBookingStore();
    var s = new BookingService(store);
    var results = await Task.WhenAll(Enumerable.Range(0, 20).Select(_ => s.BookAsync(Req(1, 14, 15), none)));
    return (results.Count(r => r is BookResult.Booked), results.Count(r => r is BookResult.Conflict), store.All.Count);
}, (1, 19, 1));
await ExpectAsync("different rooms run in parallel", async () =>
{
    var store = new SlowBookingStore();
    var s = new BookingService(store);
    var results = await Task.WhenAll(Enumerable.Range(1, 8).Select(room => s.BookAsync(Req(room, 9, 10), none)));
    return results.All(r => r is BookResult.Booked) && store.MaxInFlight > 1;
}, "bookings for different rooms were serialised — lock per room, not globally");
await ThrowsAsync<OperationCanceledException>("cancellation propagates", async () =>
{
    using var cts = new CancellationTokenSource();
    cts.Cancel();
    await new BookingService(new SlowBookingStore()).BookAsync(Req(1, 9, 10), cts.Token);
});
`);

const task: ProjectTask = {
  id: 'se-cs-m2-002',
  title: 'Week 6: Booking Data Platform',
  difficulty: 'Hard',
  language: 'csharp',
  track: 'backend',
  category: 'Month 2 · ASP.NET Core & API Engineering',
  tags: ['SQL', 'constraints', 'indexes', 'reporting queries', 'concurrency'],
  prompt:
    'Build the data layer of a room-booking platform. In SQL (graded on real SQLite in your browser): a schema whose constraints reject ' +
    'invalid rooms, duplicate emails in any case, orphaned and impossible bookings; an index the query planner actually uses for the overlap ' +
    'check; and three reporting queries — availability, utilisation with a LEFT JOIN and aggregates, and customer history. In C#: a booking ' +
    'service that never double-books when twenty requests arrive at once, while bookings for different rooms still run in parallel.',
  hints: [
    'Constraints go on the columns: NOT NULL, UNIQUE, CHECK (capacity BETWEEN 1 AND 500), REFERENCES rooms(id), and a table-level CHECK (ends_at > starts_at). The text format sorts correctly, so comparing timestamps as text works.',
    'The overlap test is b.starts_at < :end AND b.ends_at > :start; availability is NOT EXISTS over that, plus status = \'confirmed\'.',
    'Utilisation must include rooms with no bookings: start FROM rooms, LEFT JOIN bookings with the status and date filters in the ON clause (in WHERE they would remove the empty rooms), then GROUP BY the room.',
    'In C#, keep a ConcurrentDictionary<int, SemaphoreSlim> of per-room gates; await WaitAsync(ct) before the overlap check and Release in finally after the insert.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('schema.sql', SCHEMA_STARTER),
    pf('seed.sql', SEED, { editable: false }),
    pf('queries/available_rooms.sql', AVAILABLE_STARTER),
    pf('queries/room_utilisation.sql', UTILISATION_STARTER),
    pf('queries/customer_history.sql', HISTORY_STARTER),
    pf('Store.cs', STORE, { editable: false }),
    pf('BookingService.cs', SERVICE_STARTER),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('schema.sql', SCHEMA_SOLUTION),
    pf('seed.sql', SEED, { editable: false }),
    pf('queries/available_rooms.sql', AVAILABLE_SOLUTION),
    pf('queries/room_utilisation.sql', UTILISATION_SOLUTION),
    pf('queries/customer_history.sql', HISTORY_SOLUTION),
    pf('Store.cs', STORE, { editable: false }),
    pf('BookingService.cs', SERVICE_SOLUTION),
    pf('Program.cs', PROGRAM, { editable: false }),
  ],
  targets: [
    { id: 'sql', label: 'SQL schema & queries', kind: 'sql', entry: 'schema.sql', testCode: SQL_TESTS },
    { id: 'service', label: 'Booking service', kind: 'csharp', entry: 'Program.cs', testCode: CS_TESTS },
  ],
};

export default task;
