import { pf, type ProjectTask } from '../../../projectTypes';
import { API_CLIENT, API_FAKE, API_HTTP, API_PARSE, API_TYPES, MESSAGES_SOLUTION } from '../../m4Shared';

const README = `# Week 14 Assignment: Build the Client

Build the first real screen of the booking frontend: list bookings, filter them, create one and cancel one — on top of
your Week 13 client (given, read-only, in \`src/api/\`). Press **Run** to see the app against an in-memory API with a
little latency; the preview updates as you type.

## Requirements

1. **\`src/messages.ts\`** — \`messageFor(error)\` turns every \`ApiError\` into one sentence. Exact texts:

   | kind | message |
   | --- | --- |
   | network | Can't reach the server. Check your connection and try again. |
   | timeout | The server took too long to respond. Try again. |
   | aborted | *(empty string)* |
   | unauthorized | Your session has expired. Sign in again. |
   | not-found | That booking no longer exists. |
   | conflict | *the error's detail* |
   | validation | Some fields need attention. |
   | server | The server had a problem (500). Try again. — *with the real status* |
   | invalid-response | The server sent data this app doesn't understand. |

   Make the switch exhaustive with \`never\`.
2. **\`src/hooks/useBookings.ts\`** — \`useBookings(client, filter)\` (\`filter\` is a status or \`'all'\`) returns
   \`{ state, reload }\`, \`state\` being \`loading | error {message} | success {data}\`. Call \`client.list({}, signal)\` for
   \`'all'\` and \`client.list({ status }, signal)\` otherwise; abort on change/unmount and ignore stale results.
3. **\`src/components/BookingList.tsx\`** — "No bookings yet" when empty; otherwise \`<ul aria-label="Bookings">\` with one
   item per booking showing \`Ama Owusu · 3 nights · 2026-12-24 · Confirmed\` and, unless cancelled, a **Cancel** button whose
   accessible name is \`Cancel booking for Ama Owusu\` (disabled while that booking is being cancelled).
4. **\`src/components/NewBookingForm.tsx\`** — labelled fields **Guest name**, **Nights** (starts at 1), **Check-in**
   (\`type="date"\`) and a **Create booking** button; the Week 14 task rules for client-side validation and accessible
   errors. \`onCreate(newBooking)\` returns a promise of \`ApiError | null\`. While it is pending the button reads
   **Creating…** and is disabled, and a second submit does nothing. \`null\` → reset the form. A \`validation\` error → show
   its \`fieldErrors\` (first message per field) on the matching fields and keep what was typed.
5. **\`src/components/BookingsPage.tsx\`** — a **Show** select (\`all\`, \`pending\`, \`confirmed\`, \`cancelled\` with labels
   "All bookings", "Pending", "Confirmed", "Cancelled"); the list's four states — *Loading bookings…* (role \`status\`), an
   error (role \`alert\`) with a **Retry** button, the empty state, the list; and the form. Creating calls
   \`client.create(input, newKey())\`: success → status message "Booking created for *guest*" and reload; a validation error
   goes back to the form; any other error → an alert with \`messageFor\`. Cancelling calls \`client.get(id)\` for the ETag,
   then \`client.cancel(id, reason, etag)\`: success → "Booking for *guest* cancelled" and reload; failure → an alert, and
   reload after a conflict or not-found (someone else changed it).
6. **\`src/App.tsx\`** — a \`<header>\` with the \`<h1>\` "Bookings" and a \`<main>\` containing the page.

## Locally

\`\`\`bash
npm create vite@latest booking-client -- --template react-ts
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
\`\`\`

Copy \`src/\` in, set \`test: { environment: 'jsdom' }\` in \`vite.config.ts\`, point the client at your Month 2 API
(\`VITE_API_URL\`) and allow the Vite origin in its CORS policy, exposing \`ETag\` and \`Location\`.
`;

const MESSAGES_STARTER = `import type { ApiError } from './api/types';

export function messageFor(error: ApiError): string {
  // TODO: one sentence per kind (see README), exhaustive with never.
  return error.kind;
}
`;

const HOOK_STARTER = `import { useState } from 'react';
import type { BookingsClient } from '../api/bookingsClient';
import type { Booking, BookingStatus } from '../api/types';

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useBookings(client: BookingsClient, filter: BookingStatus | 'all'): { state: Remote<Booking[]>; reload: () => void } {
  // TODO: load with client.list in an effect; abort and ignore stale results; reload re-runs it.
  void client; void filter;
  const [state] = useState<Remote<Booking[]>>({ status: 'loading' });
  return { state, reload: () => {} };
}
`;

const HOOK_SOLUTION = `import { useEffect, useState } from 'react';
import type { BookingsClient } from '../api/bookingsClient';
import type { Booking, BookingStatus } from '../api/types';
import { messageFor } from '../messages';

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

const LIST_STARTER = `import type { Booking } from '../api/types';

export function BookingList({ bookings, onCancel, cancellingId }: { bookings: readonly Booking[]; onCancel: (booking: Booking) => void; cancellingId: string | null }) {
  // TODO: empty state, labelled list, one item per booking, Cancel buttons.
  void bookings; void onCancel; void cancellingId;
  return null;
}
`;

const LIST_SOLUTION = `import type { Booking } from '../api/types';

const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' } as const;
const nights = (n: number) => (n === 1 ? '1 night' : n + ' nights');

export function BookingList({ bookings, onCancel, cancellingId }: { bookings: readonly Booking[]; onCancel: (booking: Booking) => void; cancellingId: string | null }) {
  if (bookings.length === 0) return <p>No bookings yet</p>;
  return (
    <ul aria-label="Bookings" className="booking-list">
      {bookings.map((b) => (
        <li key={b.id}>
          <span>{[b.guest, nights(b.nights), b.checkIn.toISOString().slice(0, 10), STATUS_LABEL[b.status]].join(' · ')}</span>
          {b.status !== 'cancelled' && (
            <button type="button" aria-label={'Cancel booking for ' + b.guest} disabled={cancellingId === b.id} onClick={() => onCancel(b)}>
              {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
`;

const FORM_STARTER = `import type { ApiError, NewBooking } from '../api/types';

export function NewBookingForm({ onCreate }: { onCreate: (booking: NewBooking) => Promise<ApiError | null> }) {
  // TODO: controlled, labelled, validated form (see README).
  void onCreate;
  return <form aria-label="New booking"></form>;
}
`;

const FORM_SOLUTION = `import { useState, type FormEvent } from 'react';
import type { ApiError, NewBooking } from '../api/types';

type Field = 'guest' | 'nights' | 'checkIn';
type Errors = Partial<Record<Field, string>>;
const FIELDS: readonly Field[] = ['guest', 'nights', 'checkIn'];

export function NewBookingForm({ onCreate }: { onCreate: (booking: NewBooking) => Promise<ApiError | null> }) {
  const [guest, setGuest] = useState('');
  const [nights, setNights] = useState('1');
  const [checkIn, setCheckIn] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const next: Errors = {};
    const n = Number(nights);
    if (guest.trim() === '') next.guest = "Enter the guest's name";
    if (nights.trim() === '' || !Number.isInteger(n) || n < 1 || n > 30) next.nights = 'Nights must be a whole number from 1 to 30';
    if (checkIn === '') next.checkIn = 'Choose a check-in date';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const error = await onCreate({ guest: guest.trim(), nights: n, checkIn: new Date(checkIn + 'T00:00:00Z') });
    setSubmitting(false);
    if (error === null) {
      setGuest('');
      setNights('1');
      setCheckIn('');
      return;
    }
    if (error.kind === 'validation') {
      const server: Errors = {};
      for (const field of FIELDS) {
        const first = error.fieldErrors[field]?.[0];
        if (first) server[field] = first;
      }
      setErrors(server);
    }
  }

  const describe = (field: Field) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? field + '-error' : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="New booking">
      <label htmlFor="guest">Guest name</label>
      <input id="guest" value={guest} onChange={(e) => setGuest(e.target.value)} {...describe('guest')} />
      {errors.guest && <p id="guest-error" className="field-error">{errors.guest}</p>}

      <label htmlFor="nights">Nights</label>
      <input id="nights" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(e.target.value)} {...describe('nights')} />
      {errors.nights && <p id="nights-error" className="field-error">{errors.nights}</p>}

      <label htmlFor="checkIn">Check-in</label>
      <input id="checkIn" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} {...describe('checkIn')} />
      {errors.checkIn && <p id="checkIn-error" className="field-error">{errors.checkIn}</p>}

      <button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create booking'}</button>
    </form>
  );
}
`;

const PAGE_STARTER = `import type { BookingsClient } from '../api/bookingsClient';

export function BookingsPage({ client, newKey }: { client: BookingsClient; newKey: () => string }) {
  // TODO: filter, the list's four states, create and cancel flows (see README).
  void client; void newKey;
  return <section aria-label="Your bookings"></section>;
}
`;

const PAGE_SOLUTION = `import { useState } from 'react';
import type { BookingsClient } from '../api/bookingsClient';
import type { ApiError, Booking, BookingStatus, NewBooking } from '../api/types';
import { messageFor } from '../messages';
import { useBookings } from '../hooks/useBookings';
import { BookingList } from './BookingList';
import { NewBookingForm } from './NewBookingForm';

type Filter = BookingStatus | 'all';

export function BookingsPage({ client, newKey }: { client: BookingsClient; newKey: () => string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const { state, reload } = useBookings(client, filter);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function create(input: NewBooking): Promise<ApiError | null> {
    setNotice(null);
    setProblem(null);
    const r = await client.create(input, newKey());
    if (r.ok) {
      setNotice('Booking created for ' + r.value.guest);
      reload();
      return null;
    }
    if (r.error.kind !== 'validation') setProblem(messageFor(r.error));
    return r.error;
  }

  async function cancel(booking: Booking) {
    setNotice(null);
    setProblem(null);
    setCancellingId(booking.id);
    const loaded = await client.get(booking.id);
    const r = loaded.ok ? await client.cancel(booking.id, 'Cancelled from the bookings page', loaded.value.etag) : loaded;
    setCancellingId(null);
    if (r.ok) {
      setNotice('Booking for ' + booking.guest + ' cancelled');
      reload();
      return;
    }
    setProblem(messageFor(r.error));
    if (r.error.kind === 'conflict' || r.error.kind === 'not-found') reload();
  }

  return (
    <section aria-labelledby="bookings-heading" className="bookings-page">
      <h2 id="bookings-heading">Your bookings</h2>
      <label htmlFor="filter">Show</label>
      <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
        <option value="all">All bookings</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {notice && <p role="status">{notice}</p>}
      {problem && <p role="alert">{problem}</p>}

      {state.status === 'loading' && <p role="status">Loading bookings…</p>}
      {state.status === 'error' && (
        <div role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={reload}>Retry</button>
        </div>
      )}
      {state.status === 'success' && <BookingList bookings={state.data} onCancel={(b) => void cancel(b)} cancellingId={cancellingId} />}

      <h2>New booking</h2>
      <NewBookingForm onCreate={create} />
    </section>
  );
}
`;

const APP_STARTER = `import type { BookingsClient } from './api/bookingsClient';
import { BookingsPage } from './components/BookingsPage';

export function App({ client, newKey = () => crypto.randomUUID() }: { client: BookingsClient; newKey?: () => string }) {
  // TODO: a header with the h1 "Bookings", and a main landmark containing the page.
  return <BookingsPage client={client} newKey={newKey} />;
}
`;

const APP_SOLUTION = `import type { BookingsClient } from './api/bookingsClient';
import { BookingsPage } from './components/BookingsPage';

export function App({ client, newKey = () => crypto.randomUUID() }: { client: BookingsClient; newKey?: () => string }) {
  return (
    <>
      <header className="app-header">
        <h1>Bookings</h1>
      </header>
      <main>
        <BookingsPage client={client} newKey={newKey} />
      </main>
    </>
  );
}
`;

const MAIN = `// Given: renders the app against the in-memory API (with a little latency) for the live preview.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createHttp } from './api/http';
import { createBookingsClient } from './api/bookingsClient';
import { createFakeApi } from './api/fakeApi';
import './styles.css';

const api = createFakeApi();
const client = createBookingsClient(createHttp({ baseUrl: 'https://bookings.example.test', fetch: api.fetch, getToken: () => 'demo-token' }));
let keys = 0;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App client={client} newKey={() => 'preview-key-' + ++keys} />
    </StrictMode>,
  );
}
`;

const STYLES = `/* Given: a small, readable baseline. Style freely. */
:root { font-family: system-ui, sans-serif; color: #1f2933; background: #f7f8fa; }
body { margin: 0; }
.app-header { background: #102a43; color: #fff; padding: 12px 24px; }
.app-header h1 { margin: 0; font-size: 1.25rem; }
main { max-width: 720px; margin: 0 auto; padding: 16px 24px 48px; }
h2 { font-size: 1.05rem; margin: 24px 0 8px; }
label { display: block; font-weight: 600; margin: 12px 0 4px; }
input, select { font: inherit; padding: 6px 8px; border: 1px solid #9aa5b1; border-radius: 6px; min-width: 220px; }
button { font: inherit; padding: 6px 14px; border-radius: 6px; border: 1px solid #334e68; background: #334e68; color: #fff; cursor: pointer; margin-top: 12px; }
button:disabled { opacity: 0.6; cursor: progress; }
.booking-list { list-style: none; padding: 0; }
.booking-list li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 12px; background: #fff; border: 1px solid #d9e2ec; border-radius: 8px; margin-bottom: 8px; }
.booking-list button { margin: 0; background: #fff; color: #9b1c1c; border-color: #e3b4b4; }
[role="alert"] { color: #9b1c1c; background: #fdecec; border-radius: 6px; padding: 8px 12px; }
[role="status"] { color: #1f5f3a; }
.field-error { color: #9b1c1c; margin: 4px 0 0; font-size: 0.9rem; }
[aria-invalid="true"] { border-color: #c81e1e; }
`;

const TESTS = `import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { messageFor } from './messages';
import { useBookings, type Remote } from './hooks/useBookings';
import type { BookingsClient } from './api/bookingsClient';
import type { ApiError, Booking, BookingStatus, Result } from './api/types';

const ok = <T,>(value: T): Result<T, ApiError> => ({ ok: true, value });
const fail = <T,>(error: ApiError): Result<T, ApiError> => ({ ok: false, error });
const booking = (id: string, guest: string, status: BookingStatus = 'confirmed', nights = 2): Booking =>
  ({ id, guest, nights, checkIn: new Date(Date.UTC(2026, 11, 24)), status, notes: null });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function fakeClient(lists: Booking[][] = [[]]) {
  let call = 0;
  return {
    list: vi.fn<BookingsClient['list']>(async () => ok(lists[Math.min(call++, lists.length - 1)] ?? [])),
    get: vi.fn<BookingsClient['get']>(async (id: string) => ok({ booking: booking(id, 'x'), etag: 'W/"' + id + '"' })),
    create: vi.fn<BookingsClient['create']>(async (input) => ok({ ...booking('new', input.guest, 'pending', input.nights), checkIn: input.checkIn })),
    cancel: vi.fn<BookingsClient['cancel']>(async (id: string) => ok(booking(id, 'x', 'cancelled'))),
  };
}

const keyMaker = () => { let n = 0; return () => 'key-' + ++n; };
const renderApp = (client: BookingsClient) => render(<App client={client} newKey={keyMaker()} />);
const items = () => within(screen.getByRole('list', { name: 'Bookings' })).getAllByRole('listitem');
const settle = () => act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });

async function fillForm(user: ReturnType<typeof userEvent.setup>, guest: string, nights: string, date: string) {
  await user.type(screen.getByLabelText('Guest name'), guest);
  await user.clear(screen.getByLabelText('Nights'));
  await user.type(screen.getByLabelText('Nights'), nights);
  fireEvent.change(screen.getByLabelText('Check-in'), { target: { value: date } });
}

describe('messageFor', () => {
  it('explains every kind of failure', () => {
    expect(messageFor({ kind: 'network', message: 'Failed to fetch' })).toBe("Can't reach the server. Check your connection and try again.");
    expect(messageFor({ kind: 'timeout' })).toBe('The server took too long to respond. Try again.');
    expect(messageFor({ kind: 'aborted' })).toBe('');
    expect(messageFor({ kind: 'unauthorized' })).toBe('Your session has expired. Sign in again.');
    expect(messageFor({ kind: 'not-found' })).toBe('That booking no longer exists.');
    expect(messageFor({ kind: 'conflict', detail: 'Reload and try again.' })).toBe('Reload and try again.');
    expect(messageFor({ kind: 'validation', fieldErrors: {} })).toBe('Some fields need attention.');
    expect(messageFor({ kind: 'server', status: 503, title: 'x' })).toBe('The server had a problem (503). Try again.');
    expect(messageFor({ kind: 'invalid-response', problems: [] })).toBe("The server sent data this app doesn't understand.");
  });
});

describe('App shell', () => {
  it('has a banner with the h1 and a main landmark', async () => {
    renderApp(fakeClient());
    expect(within(screen.getByRole('banner')).getByRole('heading', { level: 1, name: 'Bookings' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    await settle();
  });
});

describe('listing bookings', () => {
  it('shows a loading status, then the bookings', async () => {
    const d = deferred<Result<Booking[], ApiError>>();
    const client = fakeClient();
    client.list.mockImplementationOnce(() => d.promise);
    renderApp(client);
    expect(screen.getByRole('status', { name: 'Loading bookings…' })).toBeInTheDocument();
    await act(async () => { d.resolve(ok([booking('b1', 'Ama Owusu', 'confirmed', 3), booking('b2', 'Kofi Boateng', 'pending', 1)])); });
    expect(items()).toHaveLength(2);
    expect(items()[0]).toHaveTextContent('Ama Owusu · 3 nights · 2026-12-24 · Confirmed');
    expect(items()[1]).toHaveTextContent('Kofi Boateng · 1 night · 2026-12-24 · Pending');
    expect(screen.queryByText('Loading bookings…')).toBeNull();
  });
  it('shows the empty state', async () => {
    renderApp(fakeClient([[]]));
    expect(await screen.findByText('No bookings yet')).toBeInTheDocument();
  });
  it('shows an error with a Retry button that loads again', async () => {
    const user = userEvent.setup();
    const client = fakeClient([[booking('b1', 'Ama Owusu')]]);
    client.list.mockResolvedValueOnce(fail({ kind: 'server', status: 500, title: 'Boom' }));
    renderApp(client);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The server had a problem (500). Try again.');
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('list', { name: 'Bookings' })).toBeInTheDocument();
    expect(client.list).toHaveBeenCalledTimes(2);
  });
  it('filters by status through the Show select', async () => {
    const user = userEvent.setup();
    const client = fakeClient([[booking('b1', 'Ama Owusu')]]);
    renderApp(client);
    await settle();
    expect(client.list.mock.calls[0]?.[0]).toEqual({});
    await user.selectOptions(screen.getByRole('combobox', { name: 'Show' }), 'cancelled');
    await settle();
    expect(client.list.mock.calls.at(-1)?.[0]).toEqual({ status: 'cancelled' });
    expect(client.list.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
  });
  it('ignores a slow answer for a filter that is no longer selected', async () => {
    const user = userEvent.setup();
    const slow = deferred<Result<Booking[], ApiError>>();
    const client = fakeClient([[booking('b2', 'Kofi Boateng', 'pending')]]);
    client.list.mockImplementationOnce(() => slow.promise);
    renderApp(client);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Show' }), 'pending');
    await settle();
    await act(async () => { slow.resolve(ok([booking('b9', 'Stale Result')])); });
    expect(screen.queryByText(/Stale Result/)).toBeNull();
    expect(items()[0]).toHaveTextContent('Kofi Boateng');
  });
});

describe('creating a booking', () => {
  it('creates with the typed values and an idempotency key, then reloads', async () => {
    const user = userEvent.setup();
    const client = fakeClient([[], [booking('new', 'Ama Owusu', 'pending', 3)]]);
    renderApp(client);
    await settle();
    await fillForm(user, ' Ama Owusu ', '3', '2026-12-24');
    await user.click(screen.getByRole('button', { name: 'Create booking' }));
    expect(client.create).toHaveBeenCalledWith({ guest: 'Ama Owusu', nights: 3, checkIn: new Date(Date.UTC(2026, 11, 24)) }, 'key-1');
    expect(await screen.findByRole('status', { name: 'Booking created for Ama Owusu' })).toBeInTheDocument();
    expect(await screen.findByText(/Ama Owusu · 3 nights/)).toBeInTheDocument();
    expect(screen.getByLabelText('Guest name')).toHaveValue('');
  });
  it('shows Creating… and ignores a second submit while the request is pending', async () => {
    const user = userEvent.setup();
    const pending = deferred<Result<Booking, ApiError>>();
    const client = fakeClient();
    client.create.mockImplementationOnce(() => pending.promise);
    renderApp(client);
    await settle();
    await fillForm(user, 'Kofi', '1', '2027-01-02');
    await user.click(screen.getByRole('button', { name: 'Create booking' }));
    const busy = screen.getByRole('button', { name: 'Creating…' });
    expect(busy).toBeDisabled();
    fireEvent.submit(screen.getByRole('form', { name: 'New booking' }));
    expect(client.create).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(ok(booking('b5', 'Kofi', 'pending', 1))); });
    expect(screen.getByRole('button', { name: 'Create booking' })).toBeEnabled();
  });
  it('validates on the client before calling the API', async () => {
    const user = userEvent.setup();
    const client = fakeClient();
    renderApp(client);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Create booking' }));
    expect(client.create).toHaveBeenCalledTimes(0);
    expect(screen.getByLabelText('Guest name')).toHaveAccessibleDescription("Enter the guest's name");
  });
  it('shows server validation errors on the fields and keeps the input', async () => {
    const user = userEvent.setup();
    const client = fakeClient();
    client.create.mockResolvedValueOnce(fail({ kind: 'validation', fieldErrors: { nights: ['Nights must be between 1 and 14 in December.'] } }));
    renderApp(client);
    await settle();
    await fillForm(user, 'Esi', '20', '2026-12-20');
    await user.click(screen.getByRole('button', { name: 'Create booking' }));
    await settle();
    expect(screen.getByLabelText('Nights')).toHaveAccessibleDescription('Nights must be between 1 and 14 in December.');
    expect(screen.getByLabelText('Nights')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Guest name')).toHaveValue('Esi');
  });
  it('shows other failures as an alert and keeps the input', async () => {
    const user = userEvent.setup();
    const client = fakeClient();
    client.create.mockResolvedValueOnce(fail({ kind: 'unauthorized' }));
    renderApp(client);
    await settle();
    await fillForm(user, 'Yaw', '2', '2026-12-21');
    await user.click(screen.getByRole('button', { name: 'Create booking' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired. Sign in again.');
    expect(screen.getByLabelText('Guest name')).toHaveValue('Yaw');
  });
});

describe('cancelling a booking', () => {
  it('fetches the ETag, cancels, confirms and reloads', async () => {
    const user = userEvent.setup();
    const client = fakeClient([[booking('b1', 'Ama Owusu'), booking('b3', 'Esi Mensah', 'cancelled')], [booking('b1', 'Ama Owusu', 'cancelled'), booking('b3', 'Esi Mensah', 'cancelled')]]);
    renderApp(client);
    await settle();
    expect(screen.queryByRole('button', { name: 'Cancel booking for Esi Mensah' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel booking for Ama Owusu' }));
    await settle();
    expect(client.get).toHaveBeenCalledWith('b1');
    expect(client.cancel).toHaveBeenCalledWith('b1', expect.any(String), 'W/"b1"');
    expect(await screen.findByRole('status', { name: 'Booking for Ama Owusu cancelled' })).toBeInTheDocument();
    expect(await screen.findByText(/Ama Owusu · 2 nights · 2026-12-24 · Cancelled/)).toBeInTheDocument();
  });
  it('disables the button while cancelling', async () => {
    const user = userEvent.setup();
    const pending = deferred<Result<Booking, ApiError>>();
    const client = fakeClient([[booking('b1', 'Ama Owusu')]]);
    client.cancel.mockImplementationOnce(() => pending.promise);
    renderApp(client);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Cancel booking for Ama Owusu' }));
    await settle();
    expect(screen.getByRole('button', { name: 'Cancel booking for Ama Owusu' })).toBeDisabled();
    await act(async () => { pending.resolve(ok(booking('b1', 'Ama Owusu', 'cancelled'))); });
  });
  it('explains a conflict and reloads the list', async () => {
    const user = userEvent.setup();
    const client = fakeClient([[booking('b1', 'Ama Owusu')]]);
    client.cancel.mockResolvedValueOnce(fail({ kind: 'conflict', detail: 'This booking was changed by someone else.' }));
    renderApp(client);
    await settle();
    await user.click(screen.getByRole('button', { name: 'Cancel booking for Ama Owusu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This booking was changed by someone else.');
    await settle();
    expect(client.list).toHaveBeenCalledTimes(2);
  });
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(client: BookingsClient): void {
  expectTypeOf(messageFor).parameters.toEqualTypeOf<[ApiError]>();
  expectTypeOf(useBookings).parameters.toEqualTypeOf<[BookingsClient, BookingStatus | 'all']>();
  expectTypeOf(useBookings(client, 'all').state).toEqualTypeOf<Remote<Booking[]>>();
}
void typeTests;
`;

const files = (messages: string, hook: string, list: string, form: string, page: string, app: string) => [
  pf('README.md', README, { editable: false }),
  pf('src/App.tsx', app),
  pf('src/components/BookingsPage.tsx', page),
  pf('src/components/BookingList.tsx', list),
  pf('src/components/NewBookingForm.tsx', form),
  pf('src/hooks/useBookings.ts', hook),
  pf('src/messages.ts', messages),
  pf('src/main.tsx', MAIN, { editable: false }),
  pf('src/styles.css', STYLES),
  pf('src/api/types.ts', API_TYPES, { editable: false }),
  pf('src/api/http.ts', API_HTTP, { editable: false }),
  pf('src/api/bookingsClient.ts', API_CLIENT, { editable: false }),
  pf('src/api/parse.ts', API_PARSE, { editable: false }),
  pf('src/api/fakeApi.ts', API_FAKE, { editable: false }),
];

const task: ProjectTask = {
  id: 'se-ts-m4-002',
  title: 'Week 14: Build the Client',
  difficulty: 'Hard',
  language: 'typescript',
  track: 'fullstack',
  category: 'Month 4 · TypeScript & React Engineering',
  tags: ['React', 'hooks', 'forms', 'accessibility'],
  prompt:
    'Build the bookings screen of the frontend in React and TypeScript on top of your Week 13 client: a race-free data hook, a ' +
    'filterable list with explicit loading, empty and error-with-retry states, an accessible create form that blocks double ' +
    'submission and shows the server\'s validation errors on the right fields, and cancellation that fetches the ETag first and ' +
    'recovers from conflicts. A live preview renders your app against an in-memory API; the grader drives it the way a user would, ' +
    'by role and label.',
  hints: [
    'Reuse your work: ts-4-07 is useBookings, ts-4-05 and ts-4-06 are most of the list and form. Here the hook calls client.list and turns a failed Result into messageFor(error).',
    'Keep the page\'s action feedback separate from the list state: one notice (role="status") and one problem (role="alert"), both cleared at the start of each action.',
    'In the form, await onCreate inside the submit handler, with a submitting flag set before and cleared after; return early when it is already set.',
    'Cancel: const loaded = await client.get(id); const r = loaded.ok ? await client.cancel(id, reason, loaded.value.etag) : loaded; — then one success path and one failure path.',
    'Getting "Found 2 elements with role status"? Query by name: screen.findByRole(\'status\', { name: \'Booking created for Ama Owusu\' }) — and make sure each message lives in its own element.',
  ],
  files: files(MESSAGES_STARTER, HOOK_STARTER, LIST_STARTER, FORM_STARTER, PAGE_STARTER, APP_STARTER),
  solutionFiles: files(MESSAGES_SOLUTION, HOOK_SOLUTION, LIST_SOLUTION, FORM_SOLUTION, PAGE_SOLUTION, APP_SOLUTION),
  targets: [{ id: 'app', label: 'Booking app', kind: 'react', entry: 'src/main.tsx', testCode: TESTS }],
};

export default task;
