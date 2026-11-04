import { pf, type ProjectTask } from '../../../projectTypes';
import { API_CLIENT, API_FAKE, API_HTTP, API_PARSE, API_TYPES, MESSAGES_SOLUTION, fileOf } from '../../m4Shared';
import week14 from './se-ts-m4-002';

const README = `# Week 15 Assignment: Production Features

Last week's screen becomes an application: pages with real URLs, people who sign in, sessions that expire, and actions
that stay correct when the server says no. The Week 13 client, Week 14's bookings screen and a fake sign-in API are
given; press **Run** and sign in as \`ama@example.com\` / \`password123\` in the preview.

## Requirements

1. **Session** (\`src/auth/session.tsx\`) — \`sessionReducer\`, \`AuthProvider({ initial?, children })\` and \`useAuth()\`
   returning \`{ session, signIn(user, token), signOut(), expire() }\` (task ts-4-09). Keep \`signIn\`, \`signOut\` and
   \`expire\` stable between renders (\`useCallback\`) — the API client is built from \`expire\`.
2. **Returning safely** (\`src/auth/returnTo.ts\`) — \`safeReturnTo(value)\`: internal paths only (task ts-4-10).
3. **Protected routes** (\`src/auth/RequireAuth.tsx\`) — signed out → \`<Navigate replace>\` to
   \`/login?returnTo=<encoded path + search>\`.
4. **Session expiry** (\`src/auth/withSessionExpiry.ts\`) — wrap a \`BookingsClient\` so any \`unauthorized\` result
   calls \`onUnauthorized()\` and is still returned unchanged.
5. **Sign-in page** (\`src/pages/LoginPage.tsx\`) — h1 **Sign in**; labelled **Email** and **Password**
   (\`type="password"\`) fields; a **Sign in** button reading **Signing in…** (disabled) while \`authApi.login\` runs. Wrong
   credentials → alert "Email or password is incorrect". After an expiry show a status "Your session has expired. Sign in
   again." Success → \`signIn\`, then navigate (replace) to \`safeReturnTo(returnTo)\`.
6. **Booking details** (\`src/pages/BookingDetailsPage.tsx\`, route \`/bookings/:id\`) — "Loading booking…" (status), then an
   h1 with the guest's name, "3 nights from 2026-12-24", "Status: Confirmed" and a **Back to bookings** link. A 404 → h1
   **Booking not found** with the same link. Other errors → an alert with \`messageFor\`.
7. **Cancelling** — a **Cancel booking** button opens \`ConfirmDialog\` (\`src/components/ConfirmDialog.tsx\`): role
   \`dialog\`, \`aria-modal\`, named by its heading **Cancel this booking?**, focus starts on **Keep booking**, Escape or Keep
   closes it and returns focus to **Cancel booking**. **Yes, cancel it** closes it and cancels **optimistically** (Status:
   Cancelled at once) with \`client.cancel(id, reason, etag)\`; on failure roll back and show an alert "Couldn't cancel this
   booking: <message>".
8. **Error boundary** (\`src/components/ErrorBoundary.tsx\`) — a render crash shows an alert with an h2 **Something went
   wrong** and a **Try again** button that renders the children again.
9. **App** (\`src/App.tsx\`) — \`App({ authApi, makeClient, initialEntries?, initialSession?, newKey? })\` renders a
   \`MemoryRouter\`, the provider, a header with \`<nav aria-label="Main">\` (signed in: NavLink **Your bookings** to \`/\` and a
   **Sign out (Ama)** button that signs out and goes to \`/login\`; signed out: NavLink **Sign in**), and inside \`<main>\` an
   \`ErrorBoundary\` around the routes: \`/\` (protected, the given \`BookingsPage\`), \`/bookings/:id\` (protected),
   \`/login\` and \`*\` (h1 **Page not found** with a **Go to your bookings** link). Build the client once per \`makeClient\`/
   \`expire\`: \`withSessionExpiry(makeClient(() => currentToken), expire)\`, where \`currentToken\` is read through a ref kept
   up to date in a layout effect (children's effects may fetch before a normal effect would run).

In a real app, use \`BrowserRouter\` (the preview's sandbox has no address bar, so the kit's version keeps history in memory).
`;

const AUTH_API = `// Given: a stand-in for your API's sign-in endpoint (Month 2, Week 7).
import type { Result } from './types';

export interface AuthUser { name: string; email: string; roles: string[] }
export type LoginError = 'invalid-credentials' | 'network';

export interface AuthApi {
  login(email: string, password: string): Promise<Result<{ user: AuthUser; token: string }, LoginError>>;
}

const USERS = [
  { email: 'ama@example.com', password: 'password123', user: { name: 'Ama', email: 'ama@example.com', roles: ['guest'] } },
  { email: 'kofi@example.com', password: 'admin123', user: { name: 'Kofi', email: 'kofi@example.com', roles: ['guest', 'admin'] } },
];

export function createFakeAuthApi(token = 'demo-token'): AuthApi {
  return {
    async login(email, password) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const match = USERS.find((u) => u.email === email.toLowerCase() && u.password === password);
      return match ? { ok: true, value: { user: match.user, token } } : { ok: false, error: 'invalid-credentials' };
    },
  };
}
`;

const LIST_WITH_LINKS = `import { Link } from 'react-router';
import type { Booking } from '../api/types';

const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' } as const;
const nights = (n: number) => (n === 1 ? '1 night' : n + ' nights');

export function BookingList({ bookings, onCancel, cancellingId }: { bookings: readonly Booking[]; onCancel: (booking: Booking) => void; cancellingId: string | null }) {
  if (bookings.length === 0) return <p>No bookings yet</p>;
  return (
    <ul aria-label="Bookings" className="booking-list">
      {bookings.map((b) => (
        <li key={b.id}>
          <span>
            <Link to={'/bookings/' + encodeURIComponent(b.id)}>{b.guest}</Link>
            {' · ' + [nights(b.nights), b.checkIn.toISOString().slice(0, 10), STATUS_LABEL[b.status]].join(' · ')}
          </span>
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

const SESSION_STARTER = `import { createContext, useContext, type ReactNode } from 'react';
import type { AuthUser } from '../api/authApi';

export type Session =
  | { status: 'signed-out'; reason?: 'expired' }
  | { status: 'signed-in'; user: AuthUser; token: string };

export type SessionAction =
  | { type: 'signed-in'; user: AuthUser; token: string }
  | { type: 'signed-out' }
  | { type: 'expired' };

export function sessionReducer(state: Session, action: SessionAction): Session {
  // TODO (task ts-4-09)
  void action;
  return state;
}

export interface AuthValue {
  session: Session;
  signIn(user: AuthUser, token: string): void;
  signOut(): void;
  expire(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ initial, children }: { initial?: Session; children: ReactNode }) {
  // TODO: useReducer + stable callbacks + context provider
  void initial;
  return <>{children}</>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
`;

const SESSION_SOLUTION = `import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { AuthUser } from '../api/authApi';

export type Session =
  | { status: 'signed-out'; reason?: 'expired' }
  | { status: 'signed-in'; user: AuthUser; token: string };

export type SessionAction =
  | { type: 'signed-in'; user: AuthUser; token: string }
  | { type: 'signed-out' }
  | { type: 'expired' };

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'signed-in':
      return { status: 'signed-in', user: action.user, token: action.token };
    case 'signed-out':
      return { status: 'signed-out' };
    case 'expired':
      return state.status === 'signed-in' ? { status: 'signed-out', reason: 'expired' } : state;
  }
}

export interface AuthValue {
  session: Session;
  signIn(user: AuthUser, token: string): void;
  signOut(): void;
  expire(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ initial, children }: { initial?: Session; children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, initial ?? { status: 'signed-out' });
  const signIn = useCallback((user: AuthUser, token: string) => dispatch({ type: 'signed-in', user, token }), []);
  const signOut = useCallback(() => dispatch({ type: 'signed-out' }), []);
  const expire = useCallback(() => dispatch({ type: 'expired' }), []);
  const value = useMemo(() => ({ session, signIn, signOut, expire }), [session, signIn, signOut, expire]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
`;

const RETURN_STARTER = `export function safeReturnTo(value: string | null): string {
  // TODO: internal paths only
  return value ?? '/';
}
`;

const RETURN_SOLUTION = `/** Only internal paths: one leading "/" — never "//host" or "/\\\\host", which browsers treat as another site. */
export function safeReturnTo(value: string | null): string {
  return value !== null && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\\\') ? value : '/';
}
`;

const REQUIRE_STARTER = `import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  // TODO: redirect signed-out visitors to /login?returnTo=…
  return <>{children}</>;
}
`;

const REQUIRE_SOLUTION = `import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './session';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (session.status === 'signed-out') {
    return <Navigate to={'/login?returnTo=' + encodeURIComponent(location.pathname + location.search)} replace />;
  }
  return <>{children}</>;
}
`;

const EXPIRY_STARTER = `import type { BookingsClient } from '../api/bookingsClient';

export function withSessionExpiry(client: BookingsClient, onUnauthorized: () => void): BookingsClient {
  // TODO: call onUnauthorized whenever a result is an 'unauthorized' error
  void onUnauthorized;
  return client;
}
`;

const EXPIRY_SOLUTION = `import type { BookingsClient } from '../api/bookingsClient';
import type { ApiError, Result } from '../api/types';

/** Decorates a client so a 401 from any call ends the session in one place. */
export function withSessionExpiry(client: BookingsClient, onUnauthorized: () => void): BookingsClient {
  async function watch<T>(pending: Promise<Result<T, ApiError>>): Promise<Result<T, ApiError>> {
    const result = await pending;
    if (!result.ok && result.error.kind === 'unauthorized') onUnauthorized();
    return result;
  }
  return {
    list: (filter, signal) => watch(client.list(filter, signal)),
    get: (id, signal) => watch(client.get(id, signal)),
    create: (input, key) => watch(client.create(input, key)),
    cancel: (id, reason, etag) => watch(client.cancel(id, reason, etag)),
  };
}
`;

const LOGIN_STARTER = `import type { AuthApi } from '../api/authApi';

export function LoginPage({ authApi }: { authApi: AuthApi }) {
  // TODO: labelled form, pending state, errors, expiry notice, safe redirect
  void authApi;
  return <h1>Sign in</h1>;
}
`;

const LOGIN_SOLUTION = `import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { AuthApi } from '../api/authApi';
import { useAuth } from '../auth/session';
import { safeReturnTo } from '../auth/returnTo';

export function LoginPage({ authApi }: { authApi: AuthApi }) {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const result = await authApi.login(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error === 'invalid-credentials' ? 'Email or password is incorrect' : "Can't reach the server. Check your connection and try again.");
      return;
    }
    signIn(result.value.user, result.value.token);
    navigate(safeReturnTo(params.get('returnTo')), { replace: true });
  }

  return (
    <section aria-labelledby="login-title" className="login">
      <h1 id="login-title">Sign in</h1>
      {session.status === 'signed-out' && session.reason === 'expired' && <p role="status">Your session has expired. Sign in again.</p>}
      {error && <p role="alert">{error}</p>}
      <form onSubmit={submit} noValidate aria-label="Sign in form">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </section>
  );
}
`;

const DIALOG_STARTER = `export function ConfirmDialog({ title, confirmLabel, cancelLabel, onConfirm, onCancel }: {
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // TODO: role="dialog", aria-modal, named by its heading, initial focus on the safe choice, Escape cancels
  return (
    <div>
      <p>{title}</p>
      <button onClick={onConfirm}>{confirmLabel}</button>
      <button onClick={onCancel}>{cancelLabel}</button>
    </div>
  );
}
`;

const DIALOG_SOLUTION = `import { useEffect, useId, useRef } from 'react';

export function ConfirmDialog({ title, confirmLabel, cancelLabel, onConfirm, onCancel }: {
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const safeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { safeRef.current?.focus(); }, []);
  return (
    <div className="dialog-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog"
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel(); } }}>
        <h2 id={titleId}>{title}</h2>
        <div className="dialog-actions">
          <button ref={safeRef} type="button" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
`;

const BOUNDARY_STARTER = `import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }> {
  // TODO: getDerivedStateFromError, a fallback with "Something went wrong" and "Try again"
  override render() {
    return this.props.children;
  }
}
`;

const BOUNDARY_SOLUTION = `import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; onError?: (error: Error, info: ErrorInfo) => void }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);   // Month 5: report to your monitoring here
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="crash">
        <h2>Something went wrong</h2>
        <p>This part of the page could not be shown.</p>
        <button type="button" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}
`;

const DETAILS_STARTER = `import type { BookingsClient } from '../api/bookingsClient';

export function BookingDetailsPage({ client }: { client: BookingsClient }) {
  // TODO: load by :id, not-found, details, confirm dialog, optimistic cancel with rollback
  void client;
  return <p>Booking details</p>;
}
`;

const DETAILS_SOLUTION = `import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { BookingsClient } from '../api/bookingsClient';
import type { Booking } from '../api/types';
import { messageFor } from '../messages';
import { ConfirmDialog } from '../components/ConfirmDialog';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; booking: Booking; etag: string };

const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' } as const;

export function BookingDetailsPage({ client }: { client: BookingsClient }) {
  const { id = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [confirming, setConfirming] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void client.get(id, controller.signal).then((r) => {
      if (controller.signal.aborted) return;
      if (r.ok) setState({ status: 'ready', booking: r.value.booking, etag: r.value.etag });
      else if (r.error.kind === 'not-found') setState({ status: 'not-found' });
      else setState({ status: 'error', message: messageFor(r.error) });
    });
    return () => controller.abort();
  }, [client, id]);

  const setBooking = (change: (b: Booking) => Booking) =>
    setState((s) => (s.status === 'ready' ? { ...s, booking: change(s.booking) } : s));

  async function cancelBooking() {
    if (state.status !== 'ready') return;
    const { booking, etag } = state;
    const previous = booking.status;
    setConfirming(false);
    setProblem(null);
    setBooking((b) => ({ ...b, status: 'cancelled' }));
    const result = await client.cancel(booking.id, 'Cancelled by the guest', etag);
    if (result.ok) {
      setBooking(() => result.value);
    } else {
      setBooking((b) => ({ ...b, status: previous }));
      setProblem("Couldn't cancel this booking: " + messageFor(result.error));
    }
  }

  if (state.status === 'loading') return <p role="status">Loading booking…</p>;
  if (state.status === 'not-found') {
    return (
      <>
        <h1>Booking not found</h1>
        <Link to="/">Back to bookings</Link>
      </>
    );
  }
  if (state.status === 'error') return <p role="alert">{state.message}</p>;

  const { booking } = state;
  return (
    <article aria-labelledby="booking-title" className="booking-details">
      <h1 id="booking-title">{booking.guest}</h1>
      <p>{(booking.nights === 1 ? '1 night' : booking.nights + ' nights') + ' from ' + booking.checkIn.toISOString().slice(0, 10)}</p>
      <p>Status: {STATUS_LABEL[booking.status]}</p>
      {problem && <p role="alert">{problem}</p>}
      {booking.status !== 'cancelled' && (
        <button ref={triggerRef} type="button" onClick={() => setConfirming(true)}>Cancel booking</button>
      )}
      {confirming && (
        <ConfirmDialog
          title="Cancel this booking?"
          confirmLabel="Yes, cancel it"
          cancelLabel="Keep booking"
          onConfirm={() => void cancelBooking()}
          onCancel={() => { setConfirming(false); triggerRef.current?.focus(); }}
        />
      )}
      <p><Link to="/">Back to bookings</Link></p>
    </article>
  );
}
`;

const APP_STARTER = `import { MemoryRouter, Routes, Route } from 'react-router';
import type { AuthApi } from './api/authApi';
import type { BookingsClient } from './api/bookingsClient';
import { BookingsPage } from './components/BookingsPage';
import type { Session } from './auth/session';

export interface AppProps {
  authApi: AuthApi;
  makeClient: (getToken: () => string | null) => BookingsClient;
  initialEntries?: string[];
  initialSession?: Session;
  newKey?: () => string;
}

export function App({ makeClient, initialEntries = ['/'], newKey = () => crypto.randomUUID() }: AppProps) {
  // TODO: provider, header + nav, ErrorBoundary, protected routes, login, details, not found, session expiry
  const client = makeClient(() => null);
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<BookingsPage client={client} newKey={newKey} />} />
      </Routes>
    </MemoryRouter>
  );
}
`;

const APP_SOLUTION = `import { useLayoutEffect, useMemo, useRef } from 'react';
import { MemoryRouter, Routes, Route, NavLink, Link, useLocation, useNavigate } from 'react-router';
import type { AuthApi } from './api/authApi';
import type { BookingsClient } from './api/bookingsClient';
import { BookingsPage } from './components/BookingsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth, type Session } from './auth/session';
import { RequireAuth } from './auth/RequireAuth';
import { withSessionExpiry } from './auth/withSessionExpiry';
import { LoginPage } from './pages/LoginPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';

export interface AppProps {
  authApi: AuthApi;
  makeClient: (getToken: () => string | null) => BookingsClient;
  initialEntries?: string[];
  initialSession?: Session;
  newKey?: () => string;
}

export function App(props: AppProps) {
  return (
    <MemoryRouter initialEntries={props.initialEntries ?? ['/']}>
      <AuthProvider initial={props.initialSession}>
        <Shell {...props} />
      </AuthProvider>
    </MemoryRouter>
  );
}

function Shell({ authApi, makeClient, newKey = () => crypto.randomUUID() }: AppProps) {
  const { session, signOut, expire } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Children fetch in their effects; a layout effect runs before those, so the token is current.
  const tokenRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    tokenRef.current = session.status === 'signed-in' ? session.token : null;
  }, [session]);
  const client = useMemo(() => withSessionExpiry(makeClient(() => tokenRef.current), expire), [makeClient, expire]);

  return (
    <>
      <header className="app-header">
        <p className="brand">Bookings</p>
        <nav aria-label="Main">
          {session.status === 'signed-in' ? (
            <>
              <NavLink to="/" end>Your bookings</NavLink>
              <button type="button" onClick={() => { signOut(); navigate('/login'); }}>Sign out ({session.user.name})</button>
            </>
          ) : (
            <NavLink to="/login">Sign in</NavLink>
          )}
        </nav>
      </header>
      <main>
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<RequireAuth><BookingsPage client={client} newKey={newKey} /></RequireAuth>} />
            <Route path="/bookings/:id" element={<RequireAuth><BookingDetailsPage client={client} /></RequireAuth>} />
            <Route path="/login" element={<LoginPage authApi={authApi} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </>
  );
}

function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <Link to="/">Go to your bookings</Link>
    </>
  );
}
`;

const MAIN = `// Given: the live preview. Sign in as ama@example.com / password123.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createHttp } from './api/http';
import { createBookingsClient } from './api/bookingsClient';
import { createFakeApi } from './api/fakeApi';
import { createFakeAuthApi } from './api/authApi';
import './styles.css';

const api = createFakeApi('demo-token');
const authApi = createFakeAuthApi('demo-token');
const makeClient = (getToken: () => string | null) =>
  createBookingsClient(createHttp({ baseUrl: 'https://bookings.example.test', fetch: api.fetch, getToken }));
let keys = 0;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App authApi={authApi} makeClient={makeClient} newKey={() => 'preview-key-' + ++keys} />
    </StrictMode>,
  );
}
`;

const EXTRA_STYLES = `
nav[aria-label="Main"] { display: flex; gap: 16px; align-items: center; margin-top: 4px; }
nav[aria-label="Main"] a { color: #d9e2ec; }
nav[aria-label="Main"] a[aria-current="page"] { color: #fff; font-weight: 700; }
nav[aria-label="Main"] button { margin: 0; background: transparent; border-color: #829ab1; }
.brand { margin: 0; font-weight: 700; }
.dialog-backdrop { position: fixed; inset: 0; background: rgba(16, 42, 67, 0.45); display: grid; place-items: center; }
.dialog { background: #fff; border-radius: 10px; padding: 20px 24px; min-width: 300px; box-shadow: 0 12px 32px rgba(0,0,0,.25); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
button.danger { background: #b42318; border-color: #b42318; }
.crash { margin-top: 16px; }
`;

const TESTS = `import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { withSessionExpiry } from './auth/withSessionExpiry';
import { safeReturnTo } from './auth/returnTo';
import type { AuthApi } from './api/authApi';
import type { BookingsClient } from './api/bookingsClient';
import type { ApiError, Booking, Result } from './api/types';
import type { Session } from './auth/session';

const ok = <T,>(value: T): Result<T, ApiError> => ({ ok: true, value });
const fail = <T,>(error: ApiError): Result<T, ApiError> => ({ ok: false, error });
const booking = (id: string, guest: string, status: Booking['status'] = 'confirmed', nights = 3): Booking =>
  ({ id, guest, nights, checkIn: new Date(Date.UTC(2026, 11, 24)), status, notes: null });
const amaSession: Session = { status: 'signed-in', user: { name: 'Ama', email: 'ama@example.com', roles: ['guest'] }, token: 'tok-ama' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function setup(options: { path?: string; session?: Session; bookings?: Booking[] } = {}) {
  const bookings = options.bookings ?? [booking('b1', 'Ama Owusu')];
  const tokens: (string | null)[] = [];
  const authApi = {
    login: vi.fn<AuthApi['login']>(async (email: string, password: string) =>
      email === 'ama@example.com' && password === 'password123'
        ? { ok: true, value: { user: { name: 'Ama', email, roles: ['guest'] }, token: 'tok-ama' } }
        : { ok: false, error: 'invalid-credentials' }),
  };
  const client = {
    list: vi.fn<BookingsClient['list']>(async () => (tokens.push(current.getToken()), current.getToken() === 'tok-ama' ? ok(bookings) : fail({ kind: 'unauthorized' }))),
    get: vi.fn<BookingsClient['get']>(async (id: string) => {
      const found = bookings.find((b) => b.id === id);
      return found ? ok({ booking: found, etag: 'W/"' + id + '"' }) : fail({ kind: 'not-found' });
    }),
    create: vi.fn<BookingsClient['create']>(async () => fail({ kind: 'server', status: 500, title: 'x' })),
    cancel: vi.fn<BookingsClient['cancel']>(async (id: string) => ok({ ...booking(id, 'Ama Owusu'), status: 'cancelled' })),
  };
  const current = { getToken: (): string | null => null };
  const makeClient = vi.fn((getToken: () => string | null) => { current.getToken = getToken; return client; });
  render(<App authApi={authApi} makeClient={makeClient} initialEntries={[options.path ?? '/']} initialSession={options.session} newKey={() => 'k'} />);
  return { authApi, client, makeClient, tokens };
}

const settle = () => act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
const nav = () => within(screen.getByRole('navigation', { name: 'Main' }));

async function signInAs(user: ReturnType<typeof userEvent.setup>, email: string, password: string) {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  await settle();
}

describe('signing in', () => {
  it('sends visitors to the sign-in page', async () => {
    setup({ path: '/bookings/b1' });
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(nav().getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    await settle();
  });
  it('rejects wrong credentials with an alert', async () => {
    const user = userEvent.setup();
    setup();
    await signInAs(user, 'ama@example.com', 'wrong');
    expect(screen.getByRole('alert')).toHaveTextContent('Email or password is incorrect');
  });
  it('shows Signing in… while the request runs', async () => {
    const user = userEvent.setup();
    const { authApi } = setup();
    const pending = deferred<Awaited<ReturnType<AuthApi['login']>>>();
    authApi.login.mockImplementationOnce(() => pending.promise);
    await user.type(screen.getByLabelText('Email'), 'ama@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    await act(async () => { pending.resolve({ ok: false, error: 'invalid-credentials' }); });
  });
  it('returns to the page that was asked for, with the token sent to the API', async () => {
    const user = userEvent.setup();
    const { client, tokens } = setup({ path: '/bookings/b1' });
    await signInAs(user, 'ama@example.com', 'password123');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ama Owusu' })).toBeInTheDocument();
    expect(client.get).toHaveBeenCalledWith('b1', expect.anything());
    expect(nav().getByRole('button', { name: 'Sign out (Ama)' })).toBeInTheDocument();
    void tokens;
  });
  it('ignores an external returnTo after signing in', async () => {
    const user = userEvent.setup();
    setup({ path: '/login?returnTo=' + encodeURIComponent('//evil.example/phish') });
    await signInAs(user, 'ama@example.com', 'password123');
    expect(await screen.findByRole('list', { name: 'Bookings' })).toBeInTheDocument();
  });
  it('uses the current token for list requests', async () => {
    const user = userEvent.setup();
    const { tokens } = setup({ path: '/' });
    await signInAs(user, 'ama@example.com', 'password123');
    expect(await screen.findByRole('list', { name: 'Bookings' })).toBeInTheDocument();
    expect(tokens).toEqual(['tok-ama']);
  });
  it('builds the client once, not on every render', async () => {
    const user = userEvent.setup();
    const { makeClient } = setup({ path: '/' });
    await signInAs(user, 'ama@example.com', 'password123');
    expect(makeClient).toHaveBeenCalledTimes(1);
  });
  it('signs out to the sign-in page', async () => {
    const user = userEvent.setup();
    setup({ session: amaSession });
    await settle();
    expect(nav().getByRole('link', { name: 'Your bookings' })).toHaveAttribute('aria-current', 'page');
    await user.click(nav().getByRole('button', { name: 'Sign out (Ama)' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Your bookings' })).toBeNull();
  });
});

describe('session expiry', () => {
  it('ends the session on a 401 and explains why', async () => {
    setup({ session: { ...amaSession, token: 'tok-expired' } });
    await settle();
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Your session has expired. Sign in again.' })).toBeInTheDocument();
  });
  it('withSessionExpiry reports only unauthorized results and passes results through', async () => {
    const onUnauthorized = vi.fn();
    const inner: BookingsClient = {
      list: async () => fail({ kind: 'unauthorized' }),
      get: async () => fail({ kind: 'not-found' }),
      create: async () => ok(booking('n', 'New')),
      cancel: async () => fail({ kind: 'conflict', detail: 'Changed' }),
    };
    const wrapped = withSessionExpiry(inner, onUnauthorized);
    expect(await wrapped.get('x')).toEqual({ ok: false, error: { kind: 'not-found' } });
    expect(await wrapped.cancel('x', 'r', 'e')).toEqual({ ok: false, error: { kind: 'conflict', detail: 'Changed' } });
    expect(onUnauthorized).toHaveBeenCalledTimes(0);
    expect(await wrapped.list()).toEqual({ ok: false, error: { kind: 'unauthorized' } });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
  it('only returns to internal paths', () => {
    expect(safeReturnTo('/bookings/b1')).toBe('/bookings/b1');
    expect(safeReturnTo('//evil.example')).toBe('/');
    expect(safeReturnTo('https://evil.example')).toBe('/');
  });
});

describe('booking details', () => {
  it('shows the booking', async () => {
    setup({ path: '/bookings/b1', session: amaSession });
    expect(screen.getByRole('status', { name: 'Loading booking…' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Ama Owusu' })).toBeInTheDocument();
    expect(screen.getByText('3 nights from 2026-12-24')).toBeInTheDocument();
    expect(screen.getByText('Status: Confirmed')).toBeInTheDocument();
  });
  it('handles a booking that does not exist', async () => {
    const user = userEvent.setup();
    setup({ path: '/bookings/nope', session: amaSession });
    expect(await screen.findByRole('heading', { level: 1, name: 'Booking not found' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Back to bookings' }));
    expect(await screen.findByRole('list', { name: 'Bookings' })).toBeInTheDocument();
  });
  it('shows a not-found page for unknown paths', async () => {
    setup({ path: '/no/such/page', session: amaSession });
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to your bookings' })).toBeInTheDocument();
    await settle();
  });
});

describe('cancelling from the details page', () => {
  it('asks for confirmation in an accessible dialog', async () => {
    const user = userEvent.setup();
    setup({ path: '/bookings/b1', session: amaSession });
    await user.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel this booking?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('button', { name: 'Keep booking' })).toHaveFocus();
  });
  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const { client } = setup({ path: '/bookings/b1', session: amaSession });
    await user.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel booking' })).toHaveFocus();
    expect(client.cancel).toHaveBeenCalledTimes(0);
  });
  it('cancels optimistically with the ETag', async () => {
    const user = userEvent.setup();
    const { client } = setup({ path: '/bookings/b1', session: amaSession });
    const pending = deferred<Result<Booking, ApiError>>();
    client.cancel.mockImplementationOnce(() => pending.promise);
    await user.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel it' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Status: Cancelled')).toBeInTheDocument();
    expect(client.cancel).toHaveBeenCalledWith('b1', expect.any(String), 'W/"b1"');
    await act(async () => { pending.resolve(ok({ ...booking('b1', 'Ama Owusu'), status: 'cancelled' })); });
    expect(screen.queryByRole('button', { name: 'Cancel booking' })).toBeNull();
  });
  it('rolls back and explains a failed cancel', async () => {
    const user = userEvent.setup();
    const { client } = setup({ path: '/bookings/b1', session: amaSession });
    client.cancel.mockResolvedValueOnce(fail({ kind: 'conflict', detail: 'Someone changed this booking.' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel booking' }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel it' }));
    await settle();
    expect(screen.getByText('Status: Confirmed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't cancel this booking: Someone changed this booking.");
  });
});

describe('ErrorBoundary', () => {
  it('contains a crash and can try again', async () => {
    const user = userEvent.setup();
    let broken = true;
    function Fragile() {
      const [, rerender] = useState(0);
      if (broken) throw new Error('bad data');
      return <button type="button" onClick={() => rerender((n) => n + 1)}>Working</button>;
    }
    render(<ErrorBoundary><Fragile /></ErrorBoundary>);
    const alert = screen.getByRole('alert');
    expect(within(alert).getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    broken = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('button', { name: 'Working' })).toBeInTheDocument();
  });
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(client: BookingsClient): void {
  expectTypeOf(withSessionExpiry(client, () => {})).toEqualTypeOf<BookingsClient>();
  expectTypeOf(safeReturnTo).toEqualTypeOf<(value: string | null) => string>();
}
void typeTests;
`;

const shared = [
  pf('src/messages.ts', MESSAGES_SOLUTION, { editable: false }),
  pf('src/hooks/useBookings.ts', fileOf(week14, 'src/hooks/useBookings.ts'), { editable: false }),
  pf('src/components/BookingsPage.tsx', fileOf(week14, 'src/components/BookingsPage.tsx'), { editable: false }),
  pf('src/components/BookingList.tsx', LIST_WITH_LINKS, { editable: false }),
  pf('src/components/NewBookingForm.tsx', fileOf(week14, 'src/components/NewBookingForm.tsx'), { editable: false }),
  pf('src/main.tsx', MAIN, { editable: false }),
  pf('src/styles.css', fileOf(week14, 'src/styles.css') + EXTRA_STYLES),
  pf('src/api/types.ts', API_TYPES, { editable: false }),
  pf('src/api/http.ts', API_HTTP, { editable: false }),
  pf('src/api/bookingsClient.ts', API_CLIENT, { editable: false }),
  pf('src/api/parse.ts', API_PARSE, { editable: false }),
  pf('src/api/fakeApi.ts', API_FAKE, { editable: false }),
  pf('src/api/authApi.ts', AUTH_API, { editable: false }),
];

const files = (s: { session: string; ret: string; require: string; expiry: string; login: string; dialog: string; boundary: string; details: string; app: string }) => [
  pf('README.md', README, { editable: false }),
  pf('src/App.tsx', s.app),
  pf('src/auth/session.tsx', s.session),
  pf('src/auth/returnTo.ts', s.ret),
  pf('src/auth/RequireAuth.tsx', s.require),
  pf('src/auth/withSessionExpiry.ts', s.expiry),
  pf('src/pages/LoginPage.tsx', s.login),
  pf('src/pages/BookingDetailsPage.tsx', s.details),
  pf('src/components/ConfirmDialog.tsx', s.dialog),
  pf('src/components/ErrorBoundary.tsx', s.boundary),
  ...shared,
];

const task: ProjectTask = {
  id: 'se-ts-m4-003',
  title: 'Week 15: Production Features',
  difficulty: 'Hard',
  language: 'typescript',
  track: 'fullstack',
  category: 'Month 4 · TypeScript & React Engineering',
  tags: ['React Router', 'authentication', 'optimistic UI', 'accessibility'],
  prompt:
    'Turn the bookings screen into an application: React Router pages with a details route and a not-found page, a sign-in flow with ' +
    'a typed session reducer, protected routes that return users to a validated path, one place that ends the session on any 401, ' +
    'an accessible confirmation dialog with focus management, optimistic cancellation with rollback, and an error boundary that ' +
    'contains render crashes. The preview runs the whole app; the grader signs in, follows links and presses keys like a user.',
  hints: [
    'Reuse tasks ts-4-09 (session), ts-4-10 (RequireAuth, safeReturnTo, navigation), ts-4-11 (optimistic rollback) and ts-4-12 (focus).',
    'Make signIn/signOut/expire stable with useCallback(…, []) — dispatch never changes — so useMemo(() => withSessionExpiry(makeClient(…), expire), [makeClient, expire]) builds the client once.',
    'Read the token through a ref: const tokenRef = useRef<string | null>(null); useLayoutEffect(() => { tokenRef.current = … }, [session]); and pass () => tokenRef.current to makeClient.',
    'Details page state: loading | not-found | error | ready { booking, etag }. For the optimistic change use functional updates on the ready state.',
    'Dialog focus: focus the safe button in the dialog\'s mount effect; on Keep/Escape, close and call triggerRef.current?.focus() (the trigger stays rendered).',
  ],
  files: files({ session: SESSION_STARTER, ret: RETURN_STARTER, require: REQUIRE_STARTER, expiry: EXPIRY_STARTER, login: LOGIN_STARTER, dialog: DIALOG_STARTER, boundary: BOUNDARY_STARTER, details: DETAILS_STARTER, app: APP_STARTER }),
  solutionFiles: files({ session: SESSION_SOLUTION, ret: RETURN_SOLUTION, require: REQUIRE_SOLUTION, expiry: EXPIRY_SOLUTION, login: LOGIN_SOLUTION, dialog: DIALOG_SOLUTION, boundary: BOUNDARY_SOLUTION, details: DETAILS_SOLUTION, app: APP_SOLUTION }),
  targets: [{ id: 'app', label: 'Booking app', kind: 'react', entry: 'src/main.tsx', testCode: TESTS }],
};

export default task;
