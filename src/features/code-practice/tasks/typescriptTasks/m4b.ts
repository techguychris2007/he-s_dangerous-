import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 4 · TypeScript & React';

/** Month 4, week 15 tasks (lessons dn4-5, dn4-6). Week 16's tasks are appended from m4b-quality.ts. */
export const TS_MONTH4_B_WEEK15: CodeTask[] = [
  {
    id: 'ts-4-09',
    title: 'A Typed Session Reducer and useAuth',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Implement the session layer every page will share. sessionReducer(state, action) is pure: \'signed-in\' → { status: ' +
      '\'signed-in\', user, token }; \'signed-out\' → { status: \'signed-out\' }; \'expired\' → { status: \'signed-out\', reason: ' +
      '\'expired\' } when signed in, and the very same state object when already signed out. AuthProvider({ initial?, children }) runs ' +
      'it with useReducer (starting signed out) and provides useAuth(), which returns { session, signIn(user, token), signOut(), ' +
      'expire(), hasRole(role) } — hasRole is false when signed out. useAuth() outside a provider must throw an Error with the message ' +
      '"useAuth must be used inside <AuthProvider>". Type-level tests check the action union.',
    starterCode: `import { createContext, useContext, type ReactNode } from 'react';

export interface User { name: string; roles: string[] }

export type Session =
  | { status: 'signed-out'; reason?: 'expired' }
  | { status: 'signed-in'; user: User; token: string };

export type SessionAction = { type: string; user?: User; token?: string };

export function sessionReducer(state: Session, action: SessionAction): Session {
  return state;
}

interface AuthValue {
  session: Session;
  signIn(user: User, token: string): void;
  signOut(): void;
  expire(): void;
  hasRole(role: string): boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ initial, children }: { initial?: Session; children: ReactNode }) {
  void initial;
  return <>{children}</>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext)!;
}
`,
    hints: [
      'SessionAction = { type: \'signed-in\'; user: User; token: string } | { type: \'signed-out\' } | { type: \'expired\' }.',
      'In the reducer, case \'expired\': return state.status === \'signed-in\' ? { status: \'signed-out\', reason: \'expired\' } : state;',
      'const [session, dispatch] = useReducer(sessionReducer, initial ?? { status: \'signed-out\' }); then build the value object with the four functions.',
      'useAuth: const value = useContext(AuthContext); if (!value) throw new Error(\'useAuth must be used inside <AuthProvider>\'); return value;',
    ],
    solution: `import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

export interface User { name: string; roles: string[] }

export type Session =
  | { status: 'signed-out'; reason?: 'expired' }
  | { status: 'signed-in'; user: User; token: string };

export type SessionAction =
  | { type: 'signed-in'; user: User; token: string }
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

interface AuthValue {
  session: Session;
  signIn(user: User, token: string): void;
  signOut(): void;
  expire(): void;
  hasRole(role: string): boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ initial, children }: { initial?: Session; children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, initial ?? { status: 'signed-out' });
  const value = useMemo<AuthValue>(() => ({
    session,
    signIn: (user, token) => dispatch({ type: 'signed-in', user, token }),
    signOut: () => dispatch({ type: 'signed-out' }),
    expire: () => dispatch({ type: 'expired' }),
    hasRole: (role) => session.status === 'signed-in' && session.user.roles.includes(role),
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
`,
    testCode: `import { describe, it, expect, expectTypeOf } from 'vitest';
import { Component, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, sessionReducer, type Session, type SessionAction, type User } from './solution';

const ama: User = { name: 'Ama', roles: ['guest'] };
const signedIn: Session = { status: 'signed-in', user: ama, token: 't1' };

describe('sessionReducer', () => {
  it('signs in and out', () => {
    expect(sessionReducer({ status: 'signed-out' }, { type: 'signed-in', user: ama, token: 't1' })).toEqual(signedIn);
    expect(sessionReducer(signedIn, { type: 'signed-out' })).toEqual({ status: 'signed-out' });
  });
  it('marks an expired session, and leaves a signed-out one untouched', () => {
    expect(sessionReducer(signedIn, { type: 'expired' })).toEqual({ status: 'signed-out', reason: 'expired' });
    const out: Session = { status: 'signed-out' };
    expect(sessionReducer(out, { type: 'expired' })).toBe(out);
  });
  it('never mutates the previous state', () => {
    const before = JSON.stringify(signedIn);
    sessionReducer(signedIn, { type: 'signed-out' });
    sessionReducer(signedIn, { type: 'expired' });
    expect(JSON.stringify(signedIn)).toBe(before);
  });
});

function Panel() {
  const { session, signIn, signOut, expire, hasRole } = useAuth();
  return (
    <div>
      <p role="status">{session.status === 'signed-in' ? 'Signed in as ' + session.user.name : session.reason === 'expired' ? 'Session expired' : 'Signed out'}</p>
      <p>{hasRole('admin') ? 'Admin tools' : 'No admin tools'}</p>
      <button type="button" onClick={() => signIn({ name: 'Kofi', roles: ['admin'] }, 't2')}>Sign in</button>
      <button type="button" onClick={signOut}>Sign out</button>
      <button type="button" onClick={expire}>Expire</button>
    </div>
  );
}

class Catch extends Component<{ children: ReactNode }, { message: string | null }> {
  override state: { message: string | null } = { message: null };
  static getDerivedStateFromError(error: Error) { return { message: error.message }; }
  override render() { return this.state.message ? <p role="alert">{this.state.message}</p> : this.props.children; }
}

describe('AuthProvider and useAuth', () => {
  it('starts signed out unless given an initial session', () => {
    render(<AuthProvider><Panel /></AuthProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('Signed out');
  });
  it('accepts an initial session', () => {
    render(<AuthProvider initial={signedIn}><Panel /></AuthProvider>);
    expect(screen.getByRole('status')).toHaveTextContent('Signed in as Ama');
    expect(screen.getByText('No admin tools')).toBeInTheDocument();
  });
  it('signs in, checks roles, expires and signs out', async () => {
    const user = userEvent.setup();
    render(<AuthProvider><Panel /></AuthProvider>);
    expect(screen.getByText('No admin tools')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('status')).toHaveTextContent('Signed in as Kofi');
    expect(screen.getByText('Admin tools')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expire' }));
    expect(screen.getByRole('status')).toHaveTextContent('Session expired');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('status')).toHaveTextContent('Signed out');
  });
  it('fails loudly outside a provider', () => {
    render(<Catch><Panel /></Catch>);
    expect(screen.getByRole('alert')).toHaveTextContent('useAuth must be used inside <AuthProvider>');
  });
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(): void {
  expectTypeOf<SessionAction['type']>().toEqualTypeOf<'signed-in' | 'signed-out' | 'expired'>();
  // @ts-expect-error a signed-in action must carry the user and token
  const incomplete: SessionAction = { type: 'signed-in' };
  // @ts-expect-error 'logout' is not an action
  const unknownAction: SessionAction = { type: 'logout' };
  void incomplete; void unknownAction;
}
void typeTests;
`,
  },
  {
    id: 'ts-4-10',
    title: 'Protected Routes and Auth-Aware Navigation',
    difficulty: 'Hard',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Using React Router (import from \'react-router\') and the given AuthProvider/useAuth, build the app\'s routing. safeReturnTo(value) ' +
      'returns value only for internal paths — starting with a single "/" (not "//" or "/\\") — and "/" otherwise. RequireAuth({ role?, ' +
      'children }): signed out → <Navigate replace> to "/login?returnTo=" + encodeURIComponent(pathname + search); signed in without the ' +
      'role → <p role="alert">You don\'t have access to this page.</p>; else the children. NavBar: <nav aria-label="Main"> with NavLinks ' +
      '"Home" (/, end) always; "My bookings" (/bookings) when signed in; "Admin" (/admin) only for the admin role; "Sign in" (/login) when ' +
      'signed out; and when signed in a button "Sign out (Ama)" that signs out and navigates to "/". LoginPage: h1 "Sign in", a button ' +
      '"Sign in as demo user" that signs in DEMO_USER and navigates (replace) to safeReturnTo(returnTo). AppRoutes: NavBar plus routes / ' +
      '(h1 "Welcome"), /bookings (protected, h1 "My bookings"), /admin (protected, admin, h1 "Admin"), /login and * (h1 "Page not found").',
    starterCode: `import { createContext, useContext, useState, type ReactNode } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';

// ---- given: a minimal session (task ts-4-09 builds the full version) ----
export interface User { name: string; roles: string[] }
const AuthContext = createContext<{ user: User | null; signIn(user: User): void; signOut(): void } | null>(null);
export function AuthProvider({ initialUser = null, children }: { initialUser?: User | null; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);
  return <AuthContext.Provider value={{ user, signIn: setUser, signOut: () => setUser(null) }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
export const DEMO_USER: User = { name: 'Ama', roles: ['guest'] };
// ---- your code ----

export function safeReturnTo(value: string | null): string {
  return value ?? '/';
}

export function RequireAuth({ role, children }: { role?: string; children: ReactNode }) {
  void role;
  return <>{children}</>;
}

export function NavBar() {
  return <nav><NavLink to="/">Home</NavLink></nav>;
}

export function LoginPage() {
  return <h1>Sign in</h1>;
}

export function AppRoutes() {
  void Navigate; void useLocation; void useNavigate; void useSearchParams;
  return (
    <Routes>
      <Route path="/" element={<h1>Welcome</h1>} />
    </Routes>
  );
}
`,
    hints: [
      'safeReturnTo: value !== null && value.startsWith(\'/\') && !value.startsWith(\'//\') && !value.startsWith(\'/\\\\\') ? value : \'/\'.',
      'RequireAuth reads useAuth().user and useLocation(); build the login URL from location.pathname + location.search.',
      'In LoginPage: const [params] = useSearchParams(); const navigate = useNavigate(); … navigate(safeReturnTo(params.get(\'returnTo\')), { replace: true }).',
      'Wrap protected elements: <Route path="/admin" element={<RequireAuth role="admin"><h1>Admin</h1></RequireAuth>} />, and render <NavBar /> above <Routes> in AppRoutes.',
    ],
    solution: `import { createContext, useContext, useState, type ReactNode } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';

// ---- given: a minimal session (task ts-4-09 builds the full version) ----
export interface User { name: string; roles: string[] }
const AuthContext = createContext<{ user: User | null; signIn(user: User): void; signOut(): void } | null>(null);
export function AuthProvider({ initialUser = null, children }: { initialUser?: User | null; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);
  return <AuthContext.Provider value={{ user, signIn: setUser, signOut: () => setUser(null) }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
export const DEMO_USER: User = { name: 'Ama', roles: ['guest'] };
// ---- your code ----

export function safeReturnTo(value: string | null): string {
  return value !== null && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\\\') ? value : '/';
}

export function RequireAuth({ role, children }: { role?: string; children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={'/login?returnTo=' + encodeURIComponent(location.pathname + location.search)} replace />;
  if (role && !user.roles.includes(role)) return <p role="alert">You don't have access to this page.</p>;
  return <>{children}</>;
}

export function NavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <nav aria-label="Main">
      <NavLink to="/" end>Home</NavLink>
      {user && <NavLink to="/bookings">My bookings</NavLink>}
      {user?.roles.includes('admin') && <NavLink to="/admin">Admin</NavLink>}
      {user ? (
        <button type="button" onClick={() => { signOut(); navigate('/'); }}>Sign out ({user.name})</button>
      ) : (
        <NavLink to="/login">Sign in</NavLink>
      )}
    </nav>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <>
      <h1>Sign in</h1>
      <button type="button" onClick={() => { signIn(DEMO_USER); navigate(safeReturnTo(params.get('returnTo')), { replace: true }); }}>
        Sign in as demo user
      </button>
    </>
  );
}

export function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<h1>Welcome</h1>} />
        <Route path="/bookings" element={<RequireAuth><h1>My bookings</h1></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth role="admin"><h1>Admin</h1></RequireAuth>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<h1>Page not found</h1>} />
      </Routes>
    </>
  );
}
`,
    testCode: `import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AppRoutes, AuthProvider, safeReturnTo, type User } from './solution';

function Where() {
  const l = useLocation();
  return <output aria-label="Location">{l.pathname + l.search}</output>;
}

function show(path: string, user: User | null = null) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider initialUser={user}>
        <AppRoutes />
        <Where />
      </AuthProvider>
    </MemoryRouter>,
  );
}

const where = () => screen.getByRole('status', { name: 'Location' }).textContent;
const nav = () => within(screen.getByRole('navigation', { name: 'Main' }));
const ama: User = { name: 'Ama', roles: ['guest'] };
const kofi: User = { name: 'Kofi', roles: ['guest', 'admin'] };

describe('safeReturnTo', () => {
  it('keeps internal paths', () => {
    expect(safeReturnTo('/bookings?status=pending')).toBe('/bookings?status=pending');
    expect(safeReturnTo('/')).toBe('/');
  });
  it('rejects external, protocol-relative and missing values', () => {
    expect(safeReturnTo('https://evil.example')).toBe('/');
    expect(safeReturnTo('//evil.example/login')).toBe('/');
    expect(safeReturnTo('/\\\\evil.example')).toBe('/');
    expect(safeReturnTo(null)).toBe('/');
  });
});

describe('protected routes', () => {
  it('sends a signed-out visitor to sign in, remembering where they were going', () => {
    show('/bookings?status=pending');
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(where()).toBe('/login?returnTo=%2Fbookings%3Fstatus%3Dpending');
  });
  it('returns them there after signing in', async () => {
    const user = userEvent.setup();
    show('/bookings');
    await user.click(screen.getByRole('button', { name: 'Sign in as demo user' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My bookings' })).toBeInTheDocument();
    expect(where()).toBe('/bookings');
  });
  it('never follows an external returnTo', async () => {
    const user = userEvent.setup();
    show('/login?returnTo=' + encodeURIComponent('//evil.example'));
    await user.click(screen.getByRole('button', { name: 'Sign in as demo user' }));
    expect(where()).toBe('/');
  });
  it('blocks a signed-in user without the role', () => {
    show('/admin', ama);
    expect(screen.getByRole('alert')).toHaveTextContent("You don't have access to this page.");
    expect(screen.queryByRole('heading', { name: 'Admin' })).toBeNull();
  });
  it('lets an admin in', () => {
    show('/admin', kofi);
    expect(screen.getByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument();
  });
  it('shows a not-found page for unknown paths', () => {
    show('/no/such/page');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('offers Home and Sign in to visitors', () => {
    show('/');
    expect(nav().getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'Sign in']);
  });
  it('offers the right links to signed-in users, by role', () => {
    show('/', ama);
    expect(nav().getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'My bookings']);
    expect(nav().getByRole('button', { name: 'Sign out (Ama)' })).toBeInTheDocument();
  });
  it('shows Admin only to admins', () => {
    show('/', kofi);
    expect(nav().getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });
  it('marks the current page', () => {
    show('/bookings', ama);
    expect(nav().getByRole('link', { name: 'My bookings' })).toHaveAttribute('aria-current', 'page');
    expect(nav().getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });
  it('signs out to the home page', async () => {
    const user = userEvent.setup();
    show('/bookings', ama);
    await user.click(nav().getByRole('button', { name: 'Sign out (Ama)' }));
    expect(where()).toBe('/');
    expect(nav().getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
`,
  },
  {
    id: 'ts-4-11',
    title: 'Optimistic Cancel with Per-Item Rollback',
    difficulty: 'Hard',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'BookingTable({ initial, api }) lists bookings as "Ama — Confirmed" / "Ama — Cancelled" in <ul aria-label="Bookings">, with a ' +
      'button named "Cancel Ama\'s booking" on confirmed ones. Clicking it must update optimistically: the row shows Cancelled (and loses ' +
      'its button) before api.cancel(id) settles. On success, replace the row with the server\'s booking. On failure, roll back ONLY that ' +
      'booking and show <p role="alert">Couldn\'t cancel Ama\'s booking: {error}</p>. The starter rolls back by restoring a snapshot of the ' +
      'whole list — which silently undoes other cancellations that succeeded meanwhile. Fix it with functional, per-item updates.',
    starterCode: `import { useState } from 'react';

export interface Booking { id: string; guest: string; status: 'confirmed' | 'cancelled' }
export type CancelResult = { ok: true; value: Booking } | { ok: false; error: string };
export interface CancelApi { cancel(id: string): Promise<CancelResult> }

export function BookingTable({ initial, api }: { initial: Booking[]; api: CancelApi }) {
  const [items, setItems] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);

  async function cancel(booking: Booking) {
    const snapshot = items;
    setItems(items.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)));
    const result = await api.cancel(booking.id);
    if (!result.ok) {
      setItems(snapshot);
      setProblem('Cancel failed');
    }
  }

  return (
    <>
      {problem && <p role="alert">{problem}</p>}
      <ul aria-label="Bookings">
        {items.map((b) => (
          <li key={b.id}>
            {b.guest} — {b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
            {b.status === 'confirmed' && <button type="button" onClick={() => void cancel(b)}>Cancel {b.guest}'s booking</button>}
          </li>
        ))}
      </ul>
    </>
  );
}
`,
    hints: [
      'Every update must be functional — setItems((current) => …) — so it applies to the latest list, not the one captured when the click happened.',
      'Write a helper: const update = (id: string, change: (b: Booking) => Booking) => setItems((current) => current.map((b) => (b.id === id ? change(b) : b)));',
      'Remember the previous status of the one booking, and on failure restore just that: update(booking.id, (b) => ({ ...b, status: previous })).',
      'On success use the server\'s value: update(booking.id, () => result.value).',
    ],
    solution: `import { useState } from 'react';

export interface Booking { id: string; guest: string; status: 'confirmed' | 'cancelled' }
export type CancelResult = { ok: true; value: Booking } | { ok: false; error: string };
export interface CancelApi { cancel(id: string): Promise<CancelResult> }

export function BookingTable({ initial, api }: { initial: Booking[]; api: CancelApi }) {
  const [items, setItems] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);

  const update = (id: string, change: (b: Booking) => Booking) =>
    setItems((current) => current.map((b) => (b.id === id ? change(b) : b)));

  async function cancel(booking: Booking) {
    const previous = booking.status;
    setProblem(null);
    update(booking.id, (b) => ({ ...b, status: 'cancelled' }));
    const result = await api.cancel(booking.id);
    if (result.ok) {
      update(booking.id, () => result.value);
    } else {
      update(booking.id, (b) => ({ ...b, status: previous }));
      setProblem("Couldn't cancel " + booking.guest + "'s booking: " + result.error);
    }
  }

  return (
    <>
      {problem && <p role="alert">{problem}</p>}
      <ul aria-label="Bookings">
        {items.map((b) => (
          <li key={b.id}>
            {b.guest} — {b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
            {b.status === 'confirmed' && <button type="button" onClick={() => void cancel(b)}>Cancel {b.guest}'s booking</button>}
          </li>
        ))}
      </ul>
    </>
  );
}
`,
    testCode: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingTable, type Booking, type CancelResult } from './solution';

function deferred() {
  let resolve!: (value: CancelResult) => void;
  const promise = new Promise<CancelResult>((res) => { resolve = res; });
  return { promise, resolve };
}

const start: Booking[] = [
  { id: 'a', guest: 'Ama', status: 'confirmed' },
  { id: 'b', guest: 'Kofi', status: 'confirmed' },
  { id: 'c', guest: 'Esi', status: 'cancelled' },
];
const rows = () => screen.getAllByRole('listitem').map((li) => (li.firstChild?.textContent ?? '') + (li.childNodes[1]?.textContent ?? '') + (li.childNodes[2]?.textContent ?? ''));
const rowText = (guest: string) => screen.getAllByRole('listitem').find((li) => li.textContent?.startsWith(guest))?.textContent ?? '';

describe('BookingTable', () => {
  it('lists bookings with buttons only on confirmed ones', () => {
    render(<BookingTable initial={start} api={{ cancel: vi.fn() }} />);
    expect(rows()).toHaveLength(3);
    expect(screen.getByRole('button', { name: "Cancel Ama's booking" })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Cancel Esi's booking" })).toBeNull();
  });
  it('shows the cancellation before the server answers', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(<BookingTable initial={start} api={{ cancel: vi.fn(() => d.promise) }} />);
    await user.click(screen.getByRole('button', { name: "Cancel Ama's booking" }));
    expect(rowText('Ama')).toContain('Cancelled');
    expect(screen.queryByRole('button', { name: "Cancel Ama's booking" })).toBeNull();
    await act(async () => { d.resolve({ ok: true, value: { id: 'a', guest: 'Ama', status: 'cancelled' } }); });
  });
  it('replaces the row with the server version on success', async () => {
    const user = userEvent.setup();
    render(<BookingTable initial={start} api={{ cancel: vi.fn(async () => ({ ok: true as const, value: { id: 'a', guest: 'Ama Owusu', status: 'cancelled' as const } })) }} />);
    await user.click(screen.getByRole('button', { name: "Cancel Ama's booking" }));
    await act(async () => { await Promise.resolve(); });
    expect(rowText('Ama')).toContain('Ama Owusu — Cancelled');
  });
  it('rolls back a failed cancel and explains it', async () => {
    const user = userEvent.setup();
    render(<BookingTable initial={start} api={{ cancel: vi.fn(async () => ({ ok: false as const, error: 'Booking is locked' })) }} />);
    await user.click(screen.getByRole('button', { name: "Cancel Ama's booking" }));
    await act(async () => { await Promise.resolve(); });
    expect(rowText('Ama')).toContain('Confirmed');
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't cancel Ama's booking: Booking is locked");
  });
  it('does not undo another booking that was cancelled meanwhile', async () => {
    const user = userEvent.setup();
    const forA = deferred();
    const forB = deferred();
    const api = { cancel: vi.fn((id: string) => (id === 'a' ? forA.promise : forB.promise)) };
    render(<BookingTable initial={start} api={api} />);
    await user.click(screen.getByRole('button', { name: "Cancel Ama's booking" }));
    await user.click(screen.getByRole('button', { name: "Cancel Kofi's booking" }));
    await act(async () => { forB.resolve({ ok: true, value: { id: 'b', guest: 'Kofi', status: 'cancelled' } }); });
    await act(async () => { forA.resolve({ ok: false, error: 'Timeout' }); });
    expect(rowText('Ama')).toContain('Confirmed');
    expect(rowText('Kofi')).toContain('Cancelled');
  });
  it('keeps the first cancellation when a later one fails', async () => {
    const user = userEvent.setup();
    const forA = deferred();
    const forB = deferred();
    const api = { cancel: vi.fn((id: string) => (id === 'a' ? forA.promise : forB.promise)) };
    render(<BookingTable initial={start} api={api} />);
    await user.click(screen.getByRole('button', { name: "Cancel Ama's booking" }));
    await user.click(screen.getByRole('button', { name: "Cancel Kofi's booking" }));
    await act(async () => { forA.resolve({ ok: true, value: { id: 'a', guest: 'Ama', status: 'cancelled' } }); });
    await act(async () => { forB.resolve({ ok: false, error: 'Timeout' }); });
    expect(rowText('Ama')).toContain('Cancelled');
    expect(rowText('Kofi')).toContain('Confirmed');
  });
});
`,
  },
  {
    id: 'ts-4-12',
    title: 'An Error Summary with Focus Management',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Build RequestForm({ onSubmit }) with labelled fields "Guest name", "Email" (type="email") and "Nights" (starting at 1) and a "Request ' +
      'booking" button. Rules: blank guest → "Enter the guest\'s name"; email without text before an "@" and a "." after it → "Enter an ' +
      'email address like name@example.com"; nights not 1–30 → "Nights must be a whole number from 1 to 30". On a failed submit show an ' +
      'error summary — <div role="alert" tabIndex={-1}> with an h2 "There is a problem" and, in field order, one link per error whose ' +
      'text is the message and whose href is "#" + the field\'s id — and MOVE FOCUS TO IT, every failed submit. Clicking a link focuses its ' +
      'field (prevent the default jump). Each field also gets aria-invalid and an inline message via aria-describedby. A valid submit calls ' +
      'onSubmit({ guest, email, nights }) (trimmed, nights as a number), removes the summary and shows <p role="status">Request sent</p>.',
    starterCode: `export interface BookingRequest { guest: string; email: string; nights: number }

export function RequestForm({ onSubmit }: { onSubmit: (request: BookingRequest) => void }) {
  return (
    <form>
      <label htmlFor="guest">Guest name</label>
      <input id="guest" />
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />
      <label htmlFor="nights">Nights</label>
      <input id="nights" type="number" defaultValue={1} />
      <button type="submit" onClick={() => onSubmit({ guest: '', email: '', nights: 1 })}>Request booking</button>
    </form>
  );
}
`,
    hints: [
      'Keep a submitAttempt counter in state, increment it on every failed submit, and focus the summary in an effect that depends on it: useEffect(() => { if (errors.length) summaryRef.current?.focus(); }, [attempt]).',
      'Build the error list as an array of [fieldId, message] in field order — it drives both the summary and the inline messages.',
      'Email check: /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.trim()).',
      'Link click: onClick={(e) => { e.preventDefault(); document.getElementById(field)?.focus(); }}.',
    ],
    solution: `import { useEffect, useRef, useState, type FormEvent } from 'react';

export interface BookingRequest { guest: string; email: string; nights: number }

type Field = 'guest' | 'email' | 'nights';

export function RequestForm({ onSubmit }: { onSubmit: (request: BookingRequest) => void }) {
  const [guest, setGuest] = useState('');
  const [email, setEmail] = useState('');
  const [nights, setNights] = useState('1');
  const [errors, setErrors] = useState<[Field, string][]>([]);
  const [attempt, setAttempt] = useState(0);
  const [sent, setSent] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus();
  }, [attempt]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: [Field, string][] = [];
    const n = Number(nights);
    if (guest.trim() === '') next.push(['guest', "Enter the guest's name"]);
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.trim())) next.push(['email', 'Enter an email address like name@example.com']);
    if (nights.trim() === '' || !Number.isInteger(n) || n < 1 || n > 30) next.push(['nights', 'Nights must be a whole number from 1 to 30']);
    setErrors(next);
    if (next.length > 0) {
      setSent(false);
      setAttempt((a) => a + 1);
      return;
    }
    onSubmit({ guest: guest.trim(), email: email.trim(), nights: n });
    setSent(true);
  }

  const messageFor = (field: Field) => errors.find(([f]) => f === field)?.[1];
  const describe = (field: Field) => ({
    'aria-invalid': messageFor(field) ? true : undefined,
    'aria-describedby': messageFor(field) ? field + '-error' : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && (
        <div ref={summaryRef} role="alert" tabIndex={-1} aria-labelledby="error-summary-title">
          <h2 id="error-summary-title">There is a problem</h2>
          <ul>
            {errors.map(([field, message]) => (
              <li key={field}>
                <a href={'#' + field} onClick={(e) => { e.preventDefault(); document.getElementById(field)?.focus(); }}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sent && <p role="status">Request sent</p>}

      <label htmlFor="guest">Guest name</label>
      <input id="guest" value={guest} onChange={(e) => setGuest(e.target.value)} {...describe('guest')} />
      {messageFor('guest') && <p id="guest-error">{messageFor('guest')}</p>}

      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} {...describe('email')} />
      {messageFor('email') && <p id="email-error">{messageFor('email')}</p>}

      <label htmlFor="nights">Nights</label>
      <input id="nights" type="number" value={nights} onChange={(e) => setNights(e.target.value)} {...describe('nights')} />
      {messageFor('nights') && <p id="nights-error">{messageFor('nights')}</p>}

      <button type="submit">Request booking</button>
    </form>
  );
}
`,
    testCode: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestForm } from './solution';

const submit = () => screen.getByRole('button', { name: 'Request booking' });

describe('RequestForm', () => {
  it('moves focus to an error summary listing every problem in field order', async () => {
    const user = userEvent.setup();
    render(<RequestForm onSubmit={vi.fn()} />);
    await user.clear(screen.getByLabelText('Nights'));
    await user.click(submit());
    const summary = screen.getByRole('alert');
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument();
    expect(within(summary).getAllByRole('link').map((a) => a.textContent)).toEqual([
      "Enter the guest's name",
      'Enter an email address like name@example.com',
      'Nights must be a whole number from 1 to 30',
    ]);
  });
  it('links each problem to its field', async () => {
    const user = userEvent.setup();
    render(<RequestForm onSubmit={vi.fn()} />);
    await user.click(submit());
    const link = within(screen.getByRole('alert')).getByRole('link', { name: 'Enter an email address like name@example.com' });
    expect(link).toHaveAttribute('href', '#email');
    await user.click(link);
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });
  it('marks fields invalid with inline messages', async () => {
    const user = userEvent.setup();
    render(<RequestForm onSubmit={vi.fn()} />);
    await user.type(screen.getByLabelText('Guest name'), 'Ama');
    await user.type(screen.getByLabelText('Email'), 'ama@example');
    await user.click(submit());
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter an email address like name@example.com');
    expect(screen.getByLabelText('Guest name')).not.toHaveAttribute('aria-invalid');
    expect(within(screen.getByRole('alert')).getAllByRole('link')).toHaveLength(1);
  });
  it('focuses the summary again on every failed submit', async () => {
    const user = userEvent.setup();
    render(<RequestForm onSubmit={vi.fn()} />);
    await user.click(submit());
    await user.click(screen.getByLabelText('Guest name'));
    await user.type(screen.getByLabelText('Guest name'), 'Ama');
    await user.click(submit());
    expect(screen.getByRole('alert')).toHaveFocus();
  });
  it('submits valid values and confirms', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RequestForm onSubmit={onSubmit} />);
    await user.click(submit());
    await user.type(screen.getByLabelText('Guest name'), ' Ama ');
    await user.type(screen.getByLabelText('Email'), 'ama@example.com');
    await user.clear(screen.getByLabelText('Nights'));
    await user.type(screen.getByLabelText('Nights'), '4');
    await user.click(submit());
    expect(onSubmit).toHaveBeenCalledWith({ guest: 'Ama', email: 'ama@example.com', nights: 4 });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Request sent');
  });
});
`,
  },
];
