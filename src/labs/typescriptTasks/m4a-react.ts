import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 4 · TypeScript & React';

/** Month 4, week 14 tasks (lessons dn4-3, dn4-4): React components and hooks in solution.tsx,
 *  graded by Testing Library-style tests in the sandboxed React frame (see src/lib/tsRunner.ts). */
export const WEEK_14_TASKS: CodeTask[] = [
  {
    id: 'ts-4-05',
    title: 'An Accessible Booking List',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Write BookingList({ bookings, onSelect }). With no bookings, render only a paragraph "No bookings yet". Otherwise render a heading ' +
      '"Bookings (N)" and a list labelled "Bookings" (<ul aria-label="Bookings">) with one item per booking. Each item has a real ' +
      '<button type="button"> whose name is the guest\'s name and which calls onSelect(booking.id), followed by " — 3 nights" (or ' +
      '" — 1 night"), and a "Pending" or "Cancelled" label for those statuses (confirmed bookings get none). Give every item a stable ' +
      'key: the tests fail if React logs a key warning. The starter "works" visually but uses clickable divs and no keys — exactly what ' +
      'a screen-reader user and React\'s reconciler cannot cope with.',
    starterCode: `export interface Booking {
  id: string;
  guest: string;
  nights: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export function BookingList({ bookings, onSelect }: { bookings: readonly Booking[]; onSelect: (id: string) => void }) {
  return (
    <div>
      {bookings.map((b) => (
        <div onClick={() => onSelect(b.id)}>{b.guest} {b.nights}</div>
      ))}
    </div>
  );
}
`,
    hints: [
      'Return early for the empty case: if (bookings.length === 0) return <p>No bookings yet</p>;',
      'Wrap the heading and list in a fragment: <><h2>Bookings ({bookings.length})</h2><ul aria-label="Bookings">…</ul></>.',
      'Use key={b.id} on the <li> — the element returned from map, not something inside it.',
      'Conditional labels: {b.status === \'pending\' && <span>Pending</span>}.',
    ],
    solution: `export interface Booking {
  id: string;
  guest: string;
  nights: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const nightsLabel = (n: number) => (n === 1 ? '1 night' : n + ' nights');

export function BookingList({ bookings, onSelect }: { bookings: readonly Booking[]; onSelect: (id: string) => void }) {
  if (bookings.length === 0) return <p>No bookings yet</p>;
  return (
    <>
      <h2>Bookings ({bookings.length})</h2>
      <ul aria-label="Bookings">
        {bookings.map((b) => (
          <li key={b.id}>
            <button type="button" onClick={() => onSelect(b.id)}>{b.guest}</button>
            <span> — {nightsLabel(b.nights)}</span>
            {b.status === 'pending' && <span> Pending</span>}
            {b.status === 'cancelled' && <span> Cancelled</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
`,
    testCode: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingList, type Booking } from './solution';

const bookings: Booking[] = [
  { id: 'b1', guest: 'Ama Owusu', nights: 3, status: 'confirmed' },
  { id: 'b2', guest: 'Kofi Boateng', nights: 1, status: 'pending' },
  { id: 'b3', guest: 'Esi Mensah', nights: 2, status: 'cancelled' },
];

describe('BookingList', () => {
  // First, because React reports a missing key only once per component.
  it('gives every item a key (no React key warning)', () => {
    const spy = vi.spyOn(console, 'error');
    render(<BookingList bookings={bookings} onSelect={vi.fn()} />);
    const warnings = spy.mock.calls.filter((args) => String(args[0]).includes('key'));
    expect(warnings).toHaveLength(0);
  });
  it('shows an empty state and no list when there are no bookings', () => {
    render(<BookingList bookings={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No bookings yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });
  it('shows a heading with the number of bookings', () => {
    render(<BookingList bookings={bookings} onSelect={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Bookings (3)' })).toBeInTheDocument();
  });
  it('renders one list item per booking in a labelled list', () => {
    render(<BookingList bookings={bookings} onSelect={vi.fn()} />);
    const list = screen.getByRole('list', { name: 'Bookings' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });
  it('uses singular and plural nights', () => {
    render(<BookingList bookings={bookings} onSelect={vi.fn()} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('3 nights');
    expect(items[1]).toHaveTextContent('1 night');
    expect(items[1]).not.toHaveTextContent('1 nights');
  });
  it('labels pending and cancelled bookings only', () => {
    render(<BookingList bookings={bookings} onSelect={vi.fn()} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).not.toHaveTextContent(/pending|cancelled/i);
    expect(items[1]).toHaveTextContent('Pending');
    expect(items[2]).toHaveTextContent('Cancelled');
  });
  it('selects a booking through a real button named after the guest', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BookingList bookings={bookings} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Kofi Boateng' }));
    expect(onSelect).toHaveBeenCalledWith('b2');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
`,
  },
  {
    id: 'ts-4-06',
    title: 'A Controlled, Validated Booking Form',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Write NewBookingForm({ onCreate }) as a controlled form with three labelled fields: "Guest name" (text), "Nights" (number, ' +
      'starting at 1) and "Check-in" (type="date"), and a "Create booking" submit button. Handle the form\'s submit (Enter must work too) ' +
      'and prevent the page reload. Validate on submit: a blank guest → "Enter the guest\'s name"; nights not a whole number from 1 to 30 → ' +
      '"Nights must be a whole number from 1 to 30"; no date → "Choose a check-in date". Show each message under its field in an element ' +
      'whose id the input references with aria-describedby, and set aria-invalid="true" on that input. If anything is invalid, do not ' +
      'call onCreate. Otherwise call onCreate({ guest (trimmed), nights (a number), checkIn ("YYYY-MM-DD") }), clear the errors and reset ' +
      'the fields to "", 1 and "".',
    starterCode: `export interface NewBooking {
  guest: string;
  nights: number;
  checkIn: string;
}

export function NewBookingForm({ onCreate }: { onCreate: (booking: NewBooking) => void }) {
  return (
    <form>
      <input placeholder="Guest name" />
      <input placeholder="Nights" />
      <input placeholder="Check-in" />
      <button onClick={() => onCreate({ guest: '', nights: 0, checkIn: '' })}>Create booking</button>
    </form>
  );
}
`,
    hints: [
      'Keep each field in useState as a string — even nights: inputs always give you strings; convert with Number() only when validating.',
      'Collect errors into an object: const next: Partial<Record<\'guest\' | \'nights\' | \'checkIn\', string>> = {}; then setErrors(next) and return if it has keys.',
      'Link an error: <input id="nights" aria-invalid={errors.nights ? true : undefined} aria-describedby={errors.nights ? \'nights-error\' : undefined} /> and {errors.nights && <p id="nights-error">{errors.nights}</p>}.',
      'Number.isInteger(n) && n >= 1 && n <= 30 rejects 0, 31, 2.5 and NaN (from an empty box).',
    ],
    solution: `import { useState, type FormEvent } from 'react';

export interface NewBooking {
  guest: string;
  nights: number;
  checkIn: string;
}

type Field = 'guest' | 'nights' | 'checkIn';

export function NewBookingForm({ onCreate }: { onCreate: (booking: NewBooking) => void }) {
  const [guest, setGuest] = useState('');
  const [nights, setNights] = useState('1');
  const [checkIn, setCheckIn] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    const n = Number(nights);
    if (guest.trim() === '') next.guest = "Enter the guest's name";
    if (nights.trim() === '' || !Number.isInteger(n) || n < 1 || n > 30) next.nights = 'Nights must be a whole number from 1 to 30';
    if (checkIn === '') next.checkIn = 'Choose a check-in date';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onCreate({ guest: guest.trim(), nights: n, checkIn });
    setGuest('');
    setNights('1');
    setCheckIn('');
  }

  const describe = (field: Field) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? field + '-error' : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="New booking">
      <label htmlFor="guest">Guest name</label>
      <input id="guest" value={guest} onChange={(e) => setGuest(e.target.value)} {...describe('guest')} />
      {errors.guest && <p id="guest-error">{errors.guest}</p>}

      <label htmlFor="nights">Nights</label>
      <input id="nights" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(e.target.value)} {...describe('nights')} />
      {errors.nights && <p id="nights-error">{errors.nights}</p>}

      <label htmlFor="checkIn">Check-in</label>
      <input id="checkIn" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} {...describe('checkIn')} />
      {errors.checkIn && <p id="checkIn-error">{errors.checkIn}</p>}

      <button type="submit">Create booking</button>
    </form>
  );
}
`,
    testCode: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewBookingForm } from './solution';

const fields = () => ({
  guest: screen.getByLabelText('Guest name'),
  nights: screen.getByLabelText('Nights'),
  checkIn: screen.getByLabelText('Check-in'),
  submit: screen.getByRole('button', { name: 'Create booking' }),
});

describe('NewBookingForm', () => {
  it('has three labelled fields, with nights starting at 1', () => {
    render(<NewBookingForm onCreate={vi.fn()} />);
    const f = fields();
    expect(f.guest).toHaveValue('');
    expect(f.nights).toHaveValue(1);
    expect(f.checkIn).toHaveAttribute('type', 'date');
  });
  it('blocks an empty submission and explains each problem accessibly', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<NewBookingForm onCreate={onCreate} />);
    await user.click(fields().submit);
    expect(onCreate).toHaveBeenCalledTimes(0);
    expect(fields().guest).toHaveAccessibleDescription("Enter the guest's name");
    expect(fields().guest).toHaveAttribute('aria-invalid', 'true');
    expect(fields().checkIn).toHaveAccessibleDescription('Choose a check-in date');
    expect(fields().nights).not.toHaveAttribute('aria-invalid');
  });
  it('rejects nights outside 1 to 30', async () => {
    const user = userEvent.setup();
    render(<NewBookingForm onCreate={vi.fn()} />);
    await user.clear(fields().nights);
    await user.type(fields().nights, '31');
    await user.click(fields().submit);
    expect(fields().nights).toHaveAccessibleDescription('Nights must be a whole number from 1 to 30');
  });
  it('creates a trimmed booking with numeric nights and resets', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<NewBookingForm onCreate={onCreate} />);
    await user.type(fields().guest, '  Ama Owusu ');
    await user.clear(fields().nights);
    await user.type(fields().nights, '3');
    fireEvent.change(fields().checkIn, { target: { value: '2026-12-24' } });
    await user.click(fields().submit);
    expect(onCreate).toHaveBeenCalledWith({ guest: 'Ama Owusu', nights: 3, checkIn: '2026-12-24' });
    expect(fields().guest).toHaveValue('');
    expect(fields().nights).toHaveValue(1);
    expect(fields().checkIn).toHaveValue('');
  });
  it('submits with Enter from a text field', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<NewBookingForm onCreate={onCreate} />);
    fireEvent.change(fields().checkIn, { target: { value: '2027-01-02' } });
    await user.type(fields().guest, 'Kofi{Enter}');
    expect(onCreate).toHaveBeenCalledWith({ guest: 'Kofi', nights: 1, checkIn: '2027-01-02' });
  });
  it('clears old errors after a successful submission', async () => {
    const user = userEvent.setup();
    render(<NewBookingForm onCreate={vi.fn()} />);
    await user.click(fields().submit);
    expect(screen.getByText("Enter the guest's name")).toBeInTheDocument();
    await user.type(fields().guest, 'Esi');
    fireEvent.change(fields().checkIn, { target: { value: '2027-01-05' } });
    await user.click(fields().submit);
    expect(screen.queryByText("Enter the guest's name")).toBeNull();
    expect(fields().guest).not.toHaveAttribute('aria-invalid');
  });
});
`,
  },
  {
    id: 'ts-4-07',
    title: 'A Race-Free Data Hook',
    difficulty: 'Hard',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'The starter useBookings(api, guest) hook has the classic effect bugs: it fetches once and never again, cannot retry, keeps ' +
      'stale answers and never cancels. Rewrite it. It returns { state, reload } where state is a Remote<Booking[]>: { status: ' +
      '\'loading\' } | { status: \'error\'; message } | { status: \'success\'; data }. On mount and whenever guest changes it goes to ' +
      'loading and calls api.list(guest, signal) with a fresh AbortSignal. A resolved list → success; a rejection → error with the ' +
      'Error\'s message (or "Something went wrong"). When guest changes or the component unmounts, abort the previous request and ' +
      'ignore its result even if it still arrives — an older, slower answer must never replace a newer one. reload() fetches again ' +
      'for the same guest.',
    starterCode: `import { useEffect, useState } from 'react';

export interface Booking { id: string; guest: string }

export interface BookingsApi {
  list(guest: string, signal: AbortSignal): Promise<Booking[]>;
}

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useBookings(api: BookingsApi, guest: string): { state: Remote<Booking[]>; reload: () => void } {
  const [state, setState] = useState<Remote<Booking[]>>({ status: 'loading' });

  useEffect(() => {
    api.list(guest, new AbortController().signal).then((data) => setState({ status: 'success', data }));
  }, []);

  return { state, reload: () => {} };
}
`,
    hints: [
      'Add an attempt counter: const [attempt, setAttempt] = useState(0); reload = () => setAttempt((n) => n + 1). Put api, guest and attempt in the dependency array.',
      'Inside the effect: const controller = new AbortController(); setState({ status: \'loading\' }); … return () => controller.abort();',
      'Handle both outcomes with .then(onData, onError) and check controller.signal.aborted at the start of each before calling setState.',
      'Rejections are unknown: message = error instanceof Error ? error.message : \'Something went wrong\'.',
    ],
    solution: `import { useEffect, useState } from 'react';

export interface Booking { id: string; guest: string }

export interface BookingsApi {
  list(guest: string, signal: AbortSignal): Promise<Booking[]>;
}

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useBookings(api: BookingsApi, guest: string): { state: Remote<Booking[]>; reload: () => void } {
  const [state, setState] = useState<Remote<Booking[]>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    api.list(guest, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', message: error instanceof Error ? error.message : 'Something went wrong' });
      },
    );
    return () => controller.abort();
  }, [api, guest, attempt]);

  return { state, reload: () => setAttempt((n) => n + 1) };
}
`,
    testCode: `import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useBookings, type Booking, type BookingsApi, type Remote } from './solution';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function Probe({ api, guest }: { api: BookingsApi; guest: string }) {
  const { state, reload } = useBookings(api, guest);
  const text = state.status === 'loading' ? 'Loading'
    : state.status === 'error' ? 'Error: ' + state.message
    : state.data.map((b) => b.guest).join(', ') || 'Empty';
  return (
    <div>
      <p role="status">{text}</p>
      <button type="button" onClick={reload}>Reload</button>
    </div>
  );
}

const status = () => screen.getByRole('status');
const settle = () => act(async () => { await Promise.resolve(); });
/** A request that never answers, so the test can inspect what was asked for. */
const hang = (guest: string, signal: AbortSignal) => { void guest; void signal; return new Promise<Booking[]>(() => {}); };

describe('useBookings', () => {
  it('shows loading, then the data', async () => {
    const d = deferred<Booking[]>();
    const api = { list: vi.fn(() => d.promise) };
    render(<Probe api={api} guest="ama" />);
    expect(status()).toHaveTextContent('Loading');
    await act(async () => { d.resolve([{ id: '1', guest: 'Ama' }]); });
    expect(status()).toHaveTextContent('Ama');
  });
  it('asks for the current guest with an AbortSignal', () => {
    const api = { list: vi.fn(hang) };
    render(<Probe api={api} guest="kofi" />);
    expect(api.list).toHaveBeenCalledTimes(1);
    expect(api.list.mock.calls[0]?.[0]).toBe('kofi');
    expect(api.list.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
  });
  it('shows the error message when the request fails', async () => {
    const api = { list: vi.fn(() => Promise.reject(new Error('Server unavailable'))) };
    render(<Probe api={api} guest="ama" />);
    await settle();
    expect(status()).toHaveTextContent('Error: Server unavailable');
  });
  it('refetches when the guest changes and ignores the stale answer', async () => {
    const first = deferred<Booking[]>();
    const second = deferred<Booking[]>();
    const api = { list: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise) };
    const { rerender } = render(<Probe api={api} guest="a" />);
    rerender(<Probe api={api} guest="am" />);
    expect(api.list).toHaveBeenCalledTimes(2);
    expect((api.list.mock.calls[0]?.[1] as AbortSignal).aborted).toBe(true);
    await act(async () => { second.resolve([{ id: '2', guest: 'Ama' }]); });
    await act(async () => { first.resolve([{ id: '9', guest: 'Abena (stale)' }]); });
    expect(status()).toHaveTextContent('Ama');
    expect(status()).not.toHaveTextContent('stale');
  });
  it('reload fetches again for the same guest', async () => {
    const user = userEvent.setup();
    const api = { list: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: '3', guest: 'Esi' }]) };
    render(<Probe api={api} guest="e" />);
    await settle();
    expect(status()).toHaveTextContent('Empty');
    await user.click(screen.getByRole('button', { name: 'Reload' }));
    await settle();
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent('Esi');
  });
  it('aborts the request when the component unmounts', () => {
    const api = { list: vi.fn(hang) };
    const { unmount } = render(<Probe api={api} guest="ama" />);
    unmount();
    expect(api.list.mock.calls[0]?.[1].aborted).toBe(true);
  });
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(): void {
  expectTypeOf(useBookings).returns.toEqualTypeOf<{ state: Remote<Booking[]>; reload: () => void }>();
}
void typeTests;
`,
  },
  {
    id: 'ts-4-08',
    title: 'Derive, Don\'t Sync: A Search Panel',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'The starter BookingSearch copies its bookings prop into state and keeps a filtered copy in sync with an effect — so new props ' +
      'are ignored, and every keystroke renders twice. Rewrite it with no effects and no copied props: keep only what the user ' +
      'controls (the search text and the status) in state and compute the rest during render. It shows a search box labelled "Search ' +
      'guests" (type="search"), a select labelled "Status" with options All (value "all"), Pending, Confirmed and Cancelled, a status line ' +
      '"Showing 2 of 5 bookings", and a list labelled "Results" with each matching guest\'s name, sorted alphabetically. Matching is a ' +
      'case-insensitive "contains" on the guest\'s name plus the status filter. With no matches, show "No bookings match your search" ' +
      'instead of the list.',
    starterCode: `import { useEffect, useState } from 'react';

export interface Booking { id: string; guest: string; status: 'pending' | 'confirmed' | 'cancelled' }

export function BookingSearch({ bookings }: { bookings: readonly Booking[] }) {
  const [items] = useState(bookings);
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState<readonly Booking[]>(items);

  useEffect(() => {
    setVisible(items.filter((b) => b.guest.includes(search)));
  }, [items, search]);

  return (
    <div>
      <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul>
        {visible.map((b) => <li key={b.id}>{b.guest}</li>)}
      </ul>
    </div>
  );
}
`,
    hints: [
      'State: const [search, setSearch] = useState(\'\') and const [status, setStatus] = useState<\'all\' | Booking[\'status\']>(\'all\'). Nothing else.',
      'During render: const matches = bookings.filter(…).sort((a, b) => a.guest.localeCompare(b.guest)) — copy before sorting ([...bookings] or filter first) so you never mutate the prop.',
      'Label the select with <label htmlFor="status">Status</label>, and read its value with e.target.value as the union type.',
      'Put the count in an element with role="status" so screen readers announce changes.',
    ],
    solution: `import { useState } from 'react';

export interface Booking { id: string; guest: string; status: 'pending' | 'confirmed' | 'cancelled' }

type StatusFilter = 'all' | Booking['status'];

export function BookingSearch({ bookings }: { bookings: readonly Booking[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const needle = search.trim().toLowerCase();
  const matches = bookings
    .filter((b) => (status === 'all' || b.status === status) && b.guest.toLowerCase().includes(needle))
    .sort((a, b) => a.guest.localeCompare(b.guest));

  return (
    <section aria-label="Booking search">
      <label htmlFor="search">Search guests</label>
      <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />

      <label htmlFor="status">Status</label>
      <select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <p role="status">Showing {matches.length} of {bookings.length} bookings</p>
      {matches.length === 0 ? (
        <p>No bookings match your search</p>
      ) : (
        <ul aria-label="Results">
          {matches.map((b) => <li key={b.id}>{b.guest}</li>)}
        </ul>
      )}
    </section>
  );
}
`,
    testCode: `import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingSearch, type Booking } from './solution';

const bookings: Booking[] = [
  { id: '1', guest: 'Kofi Boateng', status: 'confirmed' },
  { id: '2', guest: 'ama Owusu', status: 'pending' },
  { id: '3', guest: 'Esi Mensah', status: 'cancelled' },
  { id: '4', guest: 'Abena Asante', status: 'confirmed' },
  { id: '5', guest: 'Yaw Amoah', status: 'confirmed' },
];

const names = () => within(screen.getByRole('list', { name: 'Results' })).getAllByRole('listitem').map((li) => li.textContent);

describe('BookingSearch', () => {
  it('lists every booking, sorted by guest name, with a count', () => {
    render(<BookingSearch bookings={bookings} />);
    expect(names()).toEqual(['Abena Asante', 'ama Owusu', 'Esi Mensah', 'Kofi Boateng', 'Yaw Amoah']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 5 of 5 bookings');
  });
  it('does not mutate the bookings prop when sorting', () => {
    const original = bookings.map((b) => b.id).join();
    render(<BookingSearch bookings={bookings} />);
    expect(bookings.map((b) => b.id).join()).toBe(original);
  });
  it('filters by a case-insensitive guest search', async () => {
    const user = userEvent.setup();
    render(<BookingSearch bookings={bookings} />);
    await user.type(screen.getByRole('searchbox', { name: 'Search guests' }), 'AM');
    expect(names()).toEqual(['ama Owusu', 'Yaw Amoah']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 5 bookings');
  });
  it('filters by status and combines both filters', async () => {
    const user = userEvent.setup();
    render(<BookingSearch bookings={bookings} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'confirmed');
    expect(names()).toEqual(['Abena Asante', 'Kofi Boateng', 'Yaw Amoah']);
    await user.type(screen.getByRole('searchbox', { name: 'Search guests' }), 'a');
    expect(names()).toEqual(['Abena Asante', 'Kofi Boateng', 'Yaw Amoah']);
    await user.type(screen.getByRole('searchbox', { name: 'Search guests' }), 'b');
    expect(names()).toEqual(['Abena Asante']);
  });
  it('shows a message instead of an empty list', async () => {
    const user = userEvent.setup();
    render(<BookingSearch bookings={bookings} />);
    await user.type(screen.getByRole('searchbox', { name: 'Search guests' }), 'zzz');
    expect(screen.getByText('No bookings match your search')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Results' })).toBeNull();
  });
  it('reflects new bookings from its parent immediately', () => {
    const { rerender } = render(<BookingSearch bookings={bookings.slice(0, 2)} />);
    rerender(<BookingSearch bookings={bookings} />);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 5 of 5 bookings');
    expect(names()).toHaveLength(5);
  });
});
`,
  },
];
