import { pf, type ProjectTask } from '../../../projectTypes';
import { API_CLIENT, API_FAKE, API_HTTP, API_PARSE, API_TYPES, MESSAGES_SOLUTION } from '../../m4Shared';

const README = `# Week 16 Assignment: Frontend Engineering Review

A teammate opened a pull request: a **front desk dashboard** for reception staff. It renders, the demo looks fine — and
the senior reviewer left the comments below. You own the fix. Then prove your tests would catch the next mistake.

## Review comments to resolve

1. **useBookings.ts** — "A failed request shows *an empty list*. Staff will think the hotel is empty. Show an alert with
   \`messageFor(error)\` and a **Retry** button." Return \`{ state, reload }\` with \`state\` = \`loading | error {message} |
   success {data}\` (as in Week 14).
2. **useBookings.ts** — "Switch the Status filter quickly and an older, slower response replaces the newer one. Abort on
   change and ignore stale results."
3. **BookingTable.tsx** — "\`bookings.sort(…)\` sorts the array we were given — someone else's data. Sort a copy (by
   check-in, earliest first)."
4. **BookingTable.tsx** — "Index keys: open a card's notes, type in the search, and the open state jumps to another guest.
   Key by id."
5. **BookingTable.tsx** — "**XSS**: notes come from guests and are injected as HTML. Render them as text."
6. **BookingTable.tsx** — "'Cancel' is a clickable div. Make it a button named **Cancel booking for <guest>**, and only offer
   it when \`canCancel(booking, now)\` allows it." Each card also shows "Refund if cancelled now: <refundPercent>%".
7. **Dashboard.tsx** — "The search box has no label and is synced with an effect. Label it **Search guests**, filter during
   render, and show a status line **Showing 2 of 3 bookings**." Cancelling: \`client.get(id)\` for the ETag, then
   \`client.cancel(id, reason, etag)\`, then reload.
8. **tokenStore.ts** — "The token goes to localStorage, where any injected script can read it. Keep it in memory." (In
   production: an HttpOnly cookie via a BFF, as Week 15 discussed.)

## Prove your tests catch bugs

\`bookingRules.ts\` (given) holds the cancellation and refund rules. In \`bookingRules.cases.ts\` export at least 5
\`cases\`, each \`{ name, run(rules) }\` asserting with \`expect\`. They must pass against the real rules and catch six
mutants — wrong boundaries, wrong units, wrong statuses.

## The page

\`Dashboard({ client, now })\`: h1 **Front desk**; a **Status** select (\`all\`, \`pending\`, \`confirmed\`, \`cancelled\`, labelled "All
bookings", "Pending", "Confirmed", "Cancelled") that filters on the server; the **Search guests** box that filters by guest name
(case-insensitive) on the client; "Loading bookings…" (status) while loading; then the status line and \`BookingTable\`. Each card
(\`<ul aria-label="Bookings">\` items) has an h3 with the guest, "3 nights from 2026-12-24 · Confirmed", a **Show notes** toggle
(\`aria-expanded\`) revealing the notes or "No notes", the refund line, and the cancel button when allowed.
`;

const RULES = `// Given: the front desk's cancellation and refund rules. Do not change — your test cases target this file.
export interface RuleBooking {
  status: 'pending' | 'confirmed' | 'cancelled';
  checkIn: Date;
}

const HOUR = 3_600_000;

export function hoursUntilCheckIn(booking: RuleBooking, now: Date): number {
  return (booking.checkIn.getTime() - now.getTime()) / HOUR;
}

/** Bookings can be cancelled at the desk until 48 hours before check-in. */
export function canCancel(booking: RuleBooking, now: Date): boolean {
  return booking.status !== 'cancelled' && hoursUntilCheckIn(booking, now) > 48;
}

/** 100% refund from 7 days (168 hours) before check-in, 50% until 48 hours before, then nothing. */
export function refundPercent(booking: RuleBooking, now: Date): 0 | 50 | 100 {
  if (!canCancel(booking, now)) return 0;
  return hoursUntilCheckIn(booking, now) >= 168 ? 100 : 50;
}

export function nightsLabel(nights: number): string {
  return nights === 1 ? '1 night' : nights + ' nights';
}
`;

const RULE_MUTANTS: [string, string, string][] = [
  ['letting a booking be cancelled exactly 48 hours before check-in', 'hoursUntilCheckIn(booking, now) > 48', 'hoursUntilCheckIn(booking, now) >= 48'],
  ['letting an already-cancelled booking be cancelled again', "booking.status !== 'cancelled' && ", ''],
  ['refunding 100% only beyond 7 days', '>= 168 ? 100 : 50', '> 168 ? 100 : 50'],
  ['measuring time in minutes instead of hours', 'const HOUR = 3_600_000;', 'const HOUR = 60_000;'],
  ['refunding 50% after the cancellation deadline', 'if (!canCancel(booking, now)) return 0;', "if (booking.status === 'cancelled') return 0;"],
  ['writing "1 nights"', "nights === 1 ? '1 night'", "nights === 0 ? '1 night'"],
];

const CASES_STARTER = `import { expect } from 'vitest';
import * as rules from './bookingRules';

export type Rules = typeof rules;

export interface RuleCase {
  name: string;
  run: (r: Rules) => void;
}

const at = (iso: string) => new Date(iso);

export const cases: RuleCase[] = [
  {
    name: 'a confirmed booking ten days away can be cancelled',
    run: (r) => {
      expect(r.canCancel({ status: 'confirmed', checkIn: at('2026-12-25T14:00:00Z') }, at('2026-12-15T14:00:00Z'))).toBe(true);
    },
  },
  // TODO: at least 5 cases in total — aim them at the boundaries and the units.
];
`;

const CASES_SOLUTION = `import { expect } from 'vitest';
import * as rules from './bookingRules';

export type Rules = typeof rules;

export interface RuleCase {
  name: string;
  run: (r: Rules) => void;
}

const at = (iso: string) => new Date(iso);
const now = at('2026-12-15T12:00:00Z');
const inHours = (h: number) => new Date(now.getTime() + h * 3_600_000);

export const cases: RuleCase[] = [
  {
    name: 'exactly 48 hours before check-in is too late to cancel, 49 is not',
    run: (r) => {
      expect(r.canCancel({ status: 'confirmed', checkIn: inHours(48) }, now)).toBe(false);
      expect(r.canCancel({ status: 'confirmed', checkIn: inHours(49) }, now)).toBe(true);
    },
  },
  {
    name: 'a cancelled booking cannot be cancelled and refunds nothing',
    run: (r) => {
      expect(r.canCancel({ status: 'cancelled', checkIn: inHours(500) }, now)).toBe(false);
      expect(r.refundPercent({ status: 'cancelled', checkIn: inHours(500) }, now)).toBe(0);
    },
  },
  {
    name: 'exactly 7 days ahead refunds 100%, just under refunds 50%',
    run: (r) => {
      expect(r.refundPercent({ status: 'confirmed', checkIn: inHours(168) }, now)).toBe(100);
      expect(r.refundPercent({ status: 'confirmed', checkIn: inHours(167) }, now)).toBe(50);
    },
  },
  {
    name: 'after the 48-hour deadline the refund is 0',
    run: (r) => {
      expect(r.refundPercent({ status: 'pending', checkIn: inHours(30) }, now)).toBe(0);
    },
  },
  {
    name: 'hours are hours',
    run: (r) => {
      expect(r.hoursUntilCheckIn({ status: 'confirmed', checkIn: inHours(10) }, now)).toBe(10);
    },
  },
  {
    name: 'nights are pluralised correctly',
    run: (r) => {
      expect(r.nightsLabel(1)).toBe('1 night');
      expect(r.nightsLabel(2)).toBe('2 nights');
    },
  },
];
`;

const HOOK_STARTER = `import { useEffect, useState } from 'react';
import type { BookingsClient } from '../../api/bookingsClient';
import type { Booking, BookingStatus } from '../../api/types';

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useBookings(client: BookingsClient, filter: BookingStatus | 'all') {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.list(filter === 'all' ? {} : { status: filter }).then((r) => {
      setBookings(r.ok ? r.value : []);
      setLoading(false);
    });
  }, [client, filter]);

  return { bookings, loading };
}
`;

const HOOK_SOLUTION = `import { useEffect, useState } from 'react';
import type { BookingsClient } from '../../api/bookingsClient';
import type { Booking, BookingStatus } from '../../api/types';
import { messageFor } from '../../messages';

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useBookings(client: BookingsClient, filter: BookingStatus | 'all'): { state: Remote<Booking[]>; reload: () => void } {
  const [state, setState] = useState<Remote<Booking[]>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void client.list(filter === 'all' ? {} : { status: filter }, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      setState(r.ok ? { status: 'success', data: r.value } : { status: 'error', message: messageFor(r.error) });
    });
    return () => controller.abort();
  }, [client, filter, attempt]);

  return { state, reload: () => setAttempt((n) => n + 1) };
}
`;

const TABLE_STARTER = `import { useState } from 'react';
import type { Booking } from '../../api/types';
import { canCancel, nightsLabel, refundPercent } from './bookingRules';

const STATUS = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' } as const;

function Card({ booking, now, onCancel }: { booking: Booking; now: Date; onCancel: (b: Booking) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="card">
      <h3>{booking.guest}</h3>
      <p>{nightsLabel(booking.nights) + ' from ' + booking.checkIn.toISOString().slice(0, 10) + ' · ' + STATUS[booking.status]}</p>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>Show notes</button>
      {open && <div dangerouslySetInnerHTML={{ __html: booking.notes ?? 'No notes' }} />}
      <p>Refund if cancelled now: {refundPercent(booking, now)}%</p>
      {booking.status !== 'cancelled' && <div className="link" onClick={() => onCancel(booking)}>Cancel</div>}
    </li>
  );
}

export function BookingTable({ bookings, now, onCancel }: { bookings: Booking[]; now: Date; onCancel: (b: Booking) => void }) {
  const sorted = bookings.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
  return (
    <ul aria-label="Bookings">
      {sorted.map((b, i) => <Card key={i} booking={b} now={now} onCancel={onCancel} />)}
    </ul>
  );
}
`;

const TABLE_SOLUTION = `import { useMemo, useState } from 'react';
import type { Booking } from '../../api/types';
import { canCancel, nightsLabel, refundPercent } from './bookingRules';

const STATUS = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' } as const;

function Card({ booking, now, onCancel }: { booking: Booking; now: Date; onCancel: (b: Booking) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="card">
      <h3>{booking.guest}</h3>
      <p>{nightsLabel(booking.nights) + ' from ' + booking.checkIn.toISOString().slice(0, 10) + ' · ' + STATUS[booking.status]}</p>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Show notes</button>
      {open && <p>{booking.notes ?? 'No notes'}</p>}
      <p>Refund if cancelled now: {refundPercent(booking, now)}%</p>
      {canCancel(booking, now) && (
        <button type="button" aria-label={'Cancel booking for ' + booking.guest} onClick={() => onCancel(booking)}>Cancel</button>
      )}
    </li>
  );
}

export function BookingTable({ bookings, now, onCancel }: { bookings: readonly Booking[]; now: Date; onCancel: (b: Booking) => void }) {
  const sorted = useMemo(() => [...bookings].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime()), [bookings]);
  return (
    <ul aria-label="Bookings">
      {sorted.map((b) => <Card key={b.id} booking={b} now={now} onCancel={onCancel} />)}
    </ul>
  );
}
`;

const DASHBOARD_STARTER = `import { useEffect, useState } from 'react';
import type { BookingsClient } from '../../api/bookingsClient';
import type { Booking, BookingStatus } from '../../api/types';
import { useBookings } from './useBookings';
import { BookingTable } from './BookingTable';

type Filter = BookingStatus | 'all';

export function Dashboard({ client, now }: { client: BookingsClient; now: Date }) {
  const [filter, setFilter] = useState<Filter>('all');
  const { bookings, loading } = useBookings(client, filter);
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState<Booking[]>([]);

  useEffect(() => {
    setVisible(bookings.filter((b) => b.guest.toLowerCase().includes(search.toLowerCase())));
  }, [bookings, search]);

  async function cancel(booking: Booking) {
    await client.cancel(booking.id, 'Cancelled at the front desk', '*');
  }

  return (
    <section>
      <h1>Front desk</h1>
      <label htmlFor="status">Status</label>
      <select id="status" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
        <option value="all">All bookings</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <input placeholder="Search guests" value={search} onChange={(e) => setSearch(e.target.value)} />
      {loading ? <p>Loading…</p> : <BookingTable bookings={visible} now={now} onCancel={(b) => void cancel(b)} />}
    </section>
  );
}
`;

const DASHBOARD_SOLUTION = `import { useState } from 'react';
import type { BookingsClient } from '../../api/bookingsClient';
import type { Booking, BookingStatus } from '../../api/types';
import { messageFor } from '../../messages';
import { useBookings } from './useBookings';
import { BookingTable } from './BookingTable';

type Filter = BookingStatus | 'all';

export function Dashboard({ client, now }: { client: BookingsClient; now: Date }) {
  const [filter, setFilter] = useState<Filter>('all');
  const { state, reload } = useBookings(client, filter);
  const [search, setSearch] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  async function cancel(booking: Booking) {
    setProblem(null);
    const loaded = await client.get(booking.id);
    const result = loaded.ok ? await client.cancel(booking.id, 'Cancelled at the front desk', loaded.value.etag) : loaded;
    if (!result.ok) setProblem(messageFor(result.error));
    reload();
  }

  const needle = search.trim().toLowerCase();
  const all = state.status === 'success' ? state.data : [];
  const visible = all.filter((b) => b.guest.toLowerCase().includes(needle));

  return (
    <section aria-labelledby="desk-title" className="desk">
      <h1 id="desk-title">Front desk</h1>
      <label htmlFor="status">Status</label>
      <select id="status" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
        <option value="all">All bookings</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <label htmlFor="search">Search guests</label>
      <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      {problem && <p role="alert">{problem}</p>}
      {state.status === 'loading' && <p role="status">Loading bookings…</p>}
      {state.status === 'error' && (
        <div role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={reload}>Retry</button>
        </div>
      )}
      {state.status === 'success' && (
        <>
          <p role="status">Showing {visible.length} of {all.length} bookings</p>
          <BookingTable bookings={visible} now={now} onCancel={(b) => void cancel(b)} />
        </>
      )}
    </section>
  );
}
`;

const TOKEN_STARTER = `export interface TokenStore {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export function createTokenStore(): TokenStore {
  return {
    get: () => localStorage.getItem('token'),
    set: (token) => localStorage.setItem('token', token),
    clear: () => localStorage.removeItem('token'),
  };
}
`;

const TOKEN_SOLUTION = `export interface TokenStore {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

/** In memory only: scripts injected into the page cannot read it back from storage, and it is
 *  gone when the tab closes. (Production: keep tokens server-side behind an HttpOnly cookie.) */
export function createTokenStore(): TokenStore {
  let token: string | null = null;
  return {
    get: () => token,
    set: (value) => { token = value; },
    clear: () => { token = null; },
  };
}
`;

const MAIN = `// Given: the live preview of the dashboard against the in-memory API.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './features/bookings/Dashboard';
import { createTokenStore } from './features/auth/tokenStore';
import { createHttp } from './api/http';
import { createBookingsClient } from './api/bookingsClient';
import { createFakeApi } from './api/fakeApi';
import './styles.css';

const tokens = createTokenStore();
tokens.set('demo-token');
const api = createFakeApi('demo-token');
const client = createBookingsClient(createHttp({ baseUrl: 'https://bookings.example.test', fetch: api.fetch, getToken: tokens.get }));

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <main><Dashboard client={client} now={new Date('2026-12-15T12:00:00Z')} /></main>
    </StrictMode>,
  );
}
`;

const STYLES = `/* Given: a small baseline. */
:root { font-family: system-ui, sans-serif; color: #1f2933; background: #f7f8fa; }
body { margin: 0; }
main { max-width: 760px; margin: 0 auto; padding: 16px 24px 48px; }
label { display: block; font-weight: 600; margin: 12px 0 4px; }
input, select { font: inherit; padding: 6px 8px; border: 1px solid #9aa5b1; border-radius: 6px; min-width: 220px; }
button { font: inherit; padding: 4px 12px; border-radius: 6px; border: 1px solid #334e68; background: #fff; color: #102a43; cursor: pointer; margin-right: 8px; }
ul[aria-label="Bookings"] { list-style: none; padding: 0; display: grid; gap: 10px; }
.card { background: #fff; border: 1px solid #d9e2ec; border-radius: 10px; padding: 12px 16px; }
.card h3 { margin: 0 0 4px; }
[role="alert"] { color: #9b1c1c; background: #fdecec; border-radius: 6px; padding: 8px 12px; }
`;

function ruleModules(): string {
  const strip = (src: string) => src.replace(/^export /gm, '').replace(/^\/\/.*\n/, '');
  const make = (name: string, src: string) => `const ${name} = (() => {\n${strip(src)}\nreturn { hoursUntilCheckIn, canCancel, refundPercent, nightsLabel };\n})();`;
  const parts = [make('reference', RULES)];
  RULE_MUTANTS.forEach(([, from, to], i) => {
    if (!RULES.includes(from)) throw new Error(`se-ts-m4-004 mutant ${i}: "${from}" not found`);
    parts.push(make(`mutant${i}`, RULES.replace(from, to)));
  });
  return parts.join('\n\n');
}

const TESTS = `import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './features/bookings/Dashboard';
import { BookingTable } from './features/bookings/BookingTable';
import { useBookings, type Remote } from './features/bookings/useBookings';
import { createTokenStore } from './features/auth/tokenStore';
import { cases, type RuleCase } from './features/bookings/bookingRules.cases';
import type { BookingsClient } from './api/bookingsClient';
import type { ApiError, Booking, Result } from './api/types';

const NOW = new Date('2026-12-15T12:00:00Z');
const ok = <T,>(value: T): Result<T, ApiError> => ({ ok: true, value });
const fail = <T,>(error: ApiError): Result<T, ApiError> => ({ ok: false, error });
const day = (iso: string) => new Date(iso + 'T14:00:00Z');
const B = {
  esi: { id: 'e', guest: 'Esi Mensah', nights: 2, checkIn: day('2026-12-24'), status: 'confirmed', notes: '<img src=x onerror="window.__pwned=1">Quiet room' } as Booking,
  kofi: { id: 'k', guest: 'Kofi Boateng', nights: 1, checkIn: day('2026-12-19'), status: 'pending', notes: null } as Booking,
  ama: { id: 'a', guest: 'Ama Owusu', nights: 3, checkIn: day('2026-12-16'), status: 'confirmed', notes: 'Late arrival' } as Booking,
  yaw: { id: 'y', guest: 'Yaw Amoah', nights: 4, checkIn: day('2026-12-30'), status: 'cancelled', notes: null } as Booking,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function fakeClient(data: Booking[]) {
  return {
    list: vi.fn<BookingsClient['list']>(async () => ok(data)),
    get: vi.fn<BookingsClient['get']>(async (id: string) => ok({ booking: data.find((b) => b.id === id) ?? B.esi, etag: 'W/"' + id + '"' })),
    create: vi.fn<BookingsClient['create']>(async () => fail({ kind: 'server', status: 500, title: 'x' })),
    cancel: vi.fn<BookingsClient['cancel']>(async (id: string) => ok({ ...(data.find((b) => b.id === id) ?? B.esi), status: 'cancelled' })),
  };
}

const settle = () => act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
const cards = () => within(screen.getByRole('list', { name: 'Bookings' })).getAllByRole('listitem');
const card = (guest: string) => cards().find((li) => within(li).queryByRole('heading', { name: guest })) as HTMLElement;
const guests = () => cards().map((li) => within(li).getByRole('heading').textContent);

describe('review 1–2: loading data', () => {
  it('shows loading, then the bookings sorted by check-in without reordering the client\\'s array', async () => {
    const data = [B.esi, B.kofi, B.ama];
    renderDashboard(fakeClient(data));
    expect(screen.getByRole('status', { name: 'Loading bookings…' })).toBeInTheDocument();
    await settle();
    expect(guests()).toEqual(['Ama Owusu', 'Kofi Boateng', 'Esi Mensah']);
    expect(data.map((b) => b.id)).toEqual(['e', 'k', 'a']);
  });
  it('shows an error with Retry instead of an empty list', async () => {
    const user = userEvent.setup();
    const client = fakeClient([B.esi]);
    client.list.mockResolvedValueOnce(fail({ kind: 'timeout' }));
    renderDashboard(client);
    await settle();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The server took too long to respond. Try again.');
    expect(screen.queryByRole('list', { name: 'Bookings' })).toBeNull();
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    await settle();
    expect(guests()).toEqual(['Esi Mensah']);
  });
  it('ignores a slow answer for a filter that is no longer selected', async () => {
    const user = userEvent.setup();
    const slow = deferred<Result<Booking[], ApiError>>();
    const client = fakeClient([B.kofi]);
    client.list.mockImplementationOnce(() => slow.promise);
    renderDashboard(client);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'pending');
    await settle();
    await act(async () => { slow.resolve(ok([B.esi, B.ama])); });
    expect(guests()).toEqual(['Kofi Boateng']);
    expect(client.list.mock.calls.at(-1)?.[0]).toEqual({ status: 'pending' });
  });
});

describe('review 3–6: the cards', () => {
  it('renders guest notes as text', async () => {
    const user = userEvent.setup();
    renderDashboard(fakeClient([B.esi]));
    await settle();
    await user.click(within(card('Esi Mensah')).getByRole('button', { name: 'Show notes' }));
    expect(within(card('Esi Mensah')).getByText(/Quiet room/)).toHaveTextContent('<img src=x');
    expect(card('Esi Mensah').querySelector('img')).toBeNull();
  });
  it('keeps a card open for the same guest while searching', async () => {
    const user = userEvent.setup();
    renderDashboard(fakeClient([B.esi, B.kofi, B.ama]));
    await settle();
    await user.click(within(card('Esi Mensah')).getByRole('button', { name: 'Show notes' }));
    await user.type(screen.getByLabelText('Search guests'), 'esi');
    expect(within(card('Esi Mensah')).getByRole('button', { name: 'Show notes' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('offers Cancel only when the rules allow it, as a real button', async () => {
    renderDashboard(fakeClient([B.esi, B.kofi, B.ama, B.yaw]));
    await settle();
    expect(within(card('Esi Mensah')).getByRole('button', { name: 'Cancel booking for Esi Mensah' })).toBeInTheDocument();
    expect(within(card('Kofi Boateng')).getByRole('button', { name: 'Cancel booking for Kofi Boateng' })).toBeInTheDocument();
    expect(within(card('Ama Owusu')).queryByRole('button', { name: /Cancel booking/ })).toBeNull();
    expect(within(card('Yaw Amoah')).queryByRole('button', { name: /Cancel booking/ })).toBeNull();
  });
  it('shows the refund each guest would get', async () => {
    renderDashboard(fakeClient([B.esi, B.kofi, B.ama]));
    await settle();
    expect(card('Esi Mensah')).toHaveTextContent('Refund if cancelled now: 100%');
    expect(card('Kofi Boateng')).toHaveTextContent('Refund if cancelled now: 50%');
    expect(card('Ama Owusu')).toHaveTextContent('Refund if cancelled now: 0%');
  });
  it('BookingTable never sorts the array it is given', () => {
    const data = [B.esi, B.ama];
    render(<BookingTable bookings={data} now={NOW} onCancel={vi.fn()} />);
    expect(data.map((b) => b.id)).toEqual(['e', 'a']);
  });
});

describe('review 7: search and cancelling', () => {
  it('has a labelled search, filtered during render, with a count', async () => {
    const user = userEvent.setup();
    renderDashboard(fakeClient([B.esi, B.kofi, B.ama]));
    await settle();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 3 bookings');
    await user.type(screen.getByRole('searchbox', { name: 'Search guests' }), 'O');
    expect(guests()).toEqual(['Ama Owusu', 'Kofi Boateng']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 3 bookings');
  });
  it('cancels with the current ETag, then reloads', async () => {
    const user = userEvent.setup();
    const client = fakeClient([B.esi, B.kofi]);
    renderDashboard(client);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Cancel booking for Esi Mensah' }));
    await settle();
    expect(client.get).toHaveBeenCalledWith('e');
    expect(client.cancel).toHaveBeenCalledWith('e', expect.any(String), 'W/"e"');
    expect(client.list).toHaveBeenCalledTimes(2);
  });
});

describe('review 8: the token', () => {
  it('lives in memory, not in storage', () => {
    localStorage.clear();
    localStorage.setItem('token', 'planted-by-someone-else');
    const store = createTokenStore();
    expect(store.get()).toBe(null);
    store.set('secret-token');
    expect(store.get()).toBe('secret-token');
    expect(localStorage.getItem('token')).toBe('planted-by-someone-else');
    expect(localStorage.length).toBe(1);
    store.clear();
    expect(store.get()).toBe(null);
    localStorage.clear();
  });
});

function renderDashboard(client: BookingsClient) {
  return render(<Dashboard client={client} now={NOW} />);
}

// ---- your test cases for the rules, against the grader's own copies ----
${ruleModules()}

const RULE_MUTANTS: [string, typeof reference][] = [
${RULE_MUTANTS.map(([d], i) => `  [${JSON.stringify(d)}, mutant${i}],`).join('\n')}
];

describe('your rule test cases', () => {
  it('there are at least 5, and all pass against the real rules', () => {
    expect(cases.length).toBeGreaterThanOrEqual(5);
    const wrong: string[] = [];
    for (const c of cases) {
      try { c.run(reference); } catch (e) { wrong.push(c.name + ' (' + (e instanceof Error ? e.message : String(e)) + ')'); }
    }
    expect(wrong).toEqual([]);
  });
  for (const [description, mutant] of RULE_MUTANTS) {
    it('catch ' + description, () => {
      const caught = cases.filter((c) => { try { c.run(mutant); return false; } catch { return true; } });
      expect(caught.length).toBeGreaterThan(0);
    });
  }
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(client: BookingsClient): void {
  expectTypeOf(useBookings(client, 'all').state).toEqualTypeOf<Remote<Booking[]>>();
  expectTypeOf(cases).toEqualTypeOf<RuleCase[]>();
}
void typeTests;
`;

const files = (s: { cases: string; hook: string; table: string; dashboard: string; token: string }) => [
  pf('README.md', README, { editable: false }),
  pf('src/features/bookings/Dashboard.tsx', s.dashboard),
  pf('src/features/bookings/BookingTable.tsx', s.table),
  pf('src/features/bookings/useBookings.ts', s.hook),
  pf('src/features/bookings/bookingRules.cases.ts', s.cases),
  pf('src/features/bookings/bookingRules.ts', RULES, { editable: false }),
  pf('src/features/auth/tokenStore.ts', s.token),
  pf('src/main.tsx', MAIN, { editable: false }),
  pf('src/styles.css', STYLES),
  pf('src/messages.ts', MESSAGES_SOLUTION, { editable: false }),
  pf('src/api/types.ts', API_TYPES, { editable: false }),
  pf('src/api/http.ts', API_HTTP, { editable: false }),
  pf('src/api/bookingsClient.ts', API_CLIENT, { editable: false }),
  pf('src/api/parse.ts', API_PARSE, { editable: false }),
  pf('src/api/fakeApi.ts', API_FAKE, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-ts-m4-004',
  title: 'Week 16: Frontend Engineering Review',
  difficulty: 'Hard',
  language: 'typescript',
  track: 'fullstack',
  category: 'Month 4 · TypeScript & React Engineering',
  tags: ['code review', 'XSS', 'mutation testing', 'accessibility'],
  prompt:
    'Act on a senior engineer\'s review of a teammate\'s front desk dashboard: errors swallowed as empty lists, a race between filters, ' +
    'a sort that mutates someone else\'s data, index keys that move state between guests, guest notes injected as HTML, clickable ' +
    'divs, an unlabelled search synced by an effect, and a token in localStorage. Then write test cases for the cancellation and ' +
    'refund rules that pass against the real rules and catch six planted mutants. Graded by behaviour tests, mutation results and a ' +
    'strict type check.',
  hints: [
    'Work through REVIEW items in order; each has its own test group. The Week 14 hook (ts-4-07) is review items 1–2 almost exactly.',
    'For the table: [...bookings].sort(…) inside useMemo, key={b.id}, <p>{notes}</p> instead of dangerouslySetInnerHTML, and {canCancel(b, now) && <button aria-label=…>}.',
    'In the dashboard, compute visible = all.filter(…) in the render; delete the visible state and its effect.',
    'Rule cases: build check-in times relative to now — inHours(48), inHours(49), inHours(168), inHours(167) — and assert exact values. One case per boundary is enough.',
    'tokenStore: a closure variable (let token: string | null = null) is all you need.',
  ],
  files: files({ cases: CASES_STARTER, hook: HOOK_STARTER, table: TABLE_STARTER, dashboard: DASHBOARD_STARTER, token: TOKEN_STARTER }),
  solutionFiles: files({ cases: CASES_SOLUTION, hook: HOOK_SOLUTION, table: TABLE_SOLUTION, dashboard: DASHBOARD_SOLUTION, token: TOKEN_SOLUTION }),
  targets: [{ id: 'app', label: 'Front desk', kind: 'react', entry: 'src/main.tsx', testCode: TESTS }],
};

export default task;
