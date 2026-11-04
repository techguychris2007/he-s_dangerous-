import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  router: { title: 'React Router — Declarative mode: routing', url: 'https://reactrouter.com/start/declarative/routing' },
  routerNav: { title: 'React Router — Navigating (Link, NavLink, useNavigate)', url: 'https://reactrouter.com/start/declarative/navigating' },
  context: { title: 'React — Passing data deeply with context', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
  reducerContext: { title: 'React — Scaling up with reducer and context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context' },
  useReducer: { title: 'React — useReducer reference', url: 'https://react.dev/reference/react/useReducer' },
  errorBoundary: { title: 'React — Catching rendering errors with an error boundary', url: 'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary' },
  fso5: { title: 'Full Stack Open — Part 5: Testing React apps (login, token handling)', url: 'https://fullstackopen.com/en/part5' },
  fso6: { title: 'Full Stack Open — Part 6: Advanced state management', url: 'https://fullstackopen.com/en/part6' },
  fso7: { title: 'Full Stack Open — Part 7: React Router, custom hooks', url: 'https://fullstackopen.com/en/part7' },
  oauthBrowser: { title: 'IETF draft — OAuth 2.0 for Browser-Based Applications (BFF pattern)', url: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/' },
  owaspHtml5: { title: 'OWASP — HTML5 Security Cheat Sheet (local storage)', url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html' },
  openRedirect: { title: 'OWASP — Unvalidated Redirects and Forwards Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html' },
  govukErrors: { title: 'GOV.UK Design System — Error summary', url: 'https://design-system.service.gov.uk/components/error-summary/' },
  govukValidation: { title: 'GOV.UK Design System — Validation', url: 'https://design-system.service.gov.uk/patterns/validation/' },
  apgDialog: { title: 'WAI-ARIA Authoring Practices — Dialog (modal) pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
  dialogEl: { title: 'MDN — The <dialog> element', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog' },
  wcag: { title: 'W3C — WCAG 2.2 quick reference', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
  tanstack: { title: 'TanStack Query — Optimistic updates', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates' },
  chooseState: { title: 'React — Choosing the state structure', url: 'https://react.dev/learn/choosing-the-state-structure' },
  memo: { title: 'React — memo reference (when to skip re-rendering)', url: 'https://react.dev/reference/react/memo' },
  lazy: { title: 'React — lazy and code splitting', url: 'https://react.dev/reference/react/lazy' },
  webVitals: { title: 'web.dev — Web Vitals (LCP, INP, CLS)', url: 'https://web.dev/articles/vitals' },
  bulletproof: { title: 'Bulletproof React — project structure guide', url: 'https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md' },
  reduxStyle: { title: 'Redux — Style guide (state shape and reducers)', url: 'https://redux.js.org/style-guide/' },
  trophy: { title: 'Kent C. Dodds — The Testing Trophy and testing classifications', url: 'https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications' },
  rtlPrinciples: { title: 'Testing Library — Guiding principles', url: 'https://testing-library.com/docs/guiding-principles' },
  msw: { title: 'Mock Service Worker — mocking at the network level', url: 'https://mswjs.io/docs/' },
  playwright: { title: 'Playwright — Writing end-to-end tests', url: 'https://playwright.dev/docs/writing-tests' },
  stryker: { title: 'Stryker Mutator — mutation testing for JavaScript and TypeScript', url: 'https://stryker-mutator.io/docs/stryker-js/introduction/' },
  axe: { title: 'Deque — axe-core accessibility engine', url: 'https://github.com/dequelabs/axe-core' },
  actions: { title: 'GitHub Docs — Building and testing Node.js', url: 'https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-nodejs' },
  fso11: { title: 'Full Stack Open — Part 11: CI/CD', url: 'https://fullstackopen.com/en/part11' },
  reactXss: { title: 'React — dangerouslySetInnerHTML (security caveats)', url: 'https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html' },
  googleReview: { title: 'Google Engineering Practices — What to look for in a code review', url: 'https://google.github.io/eng-practices/review/reviewer/looking-for.html' },
} as const;

/** Month 4, weeks 15–16: production React (assignment: Production Features), then frontend
 *  architecture and quality (assignment: Frontend Engineering Review). */
export const DN_MONTH4_B: CurriculumLesson[] = [
  {
    id: 'dn4-5',
    slug: 'routing-auth-and-app-state',
    title: 'Production React I: Routing, Authentication and App-Wide State',
    summary: 'Make the URL the source of truth with React Router, keep a session in a typed reducer behind context, protect routes and adapt navigation to the signed-in user, handle expiry and return users safely to where they were.',
    minutes: 60,
    prerequisite: 'Week 14. Month 2\'s JWT authentication and authorization.',
    outcomes: [
      'Structure an app with nested routes, layouts, URL parameters, search parameters and a not-found route.',
      'Explain what a frontend can and cannot enforce about authorization, and the trade-offs of token storage options.',
      'Model session state with a typed reducer and share it through context with a custom hook.',
      'Protect routes, adapt navigation to the session, and return users to a validated internal path after sign-in.',
      'Wire the session into the API client so a 401 anywhere ends the session cleanly.',
    ],
    introduction:
      'A one-screen app can keep everything in a component. A product has pages people bookmark and share, a back button that must work, people who are signed in and people who are not, and sessions that expire mid-task. This lesson adds the three pieces every production React app needs on top of last week\'s screen: routing, so the URL describes what is on screen; a session shared across the whole app; and the rules that tie them together — who may see which page, what the navigation offers, and what happens when the server says "401".',
    keyTerms: [
      { term: 'Client-side routing', meaning: 'Changing the URL and the rendered screen without a full page load; the router maps paths to components.' },
      { term: 'Layout route', meaning: 'A parent route whose element renders shared chrome and an <Outlet/> where the matching child appears.' },
      { term: 'Route parameter', meaning: 'A named segment such as :id in /bookings/:id, read with useParams().' },
      { term: 'Context', meaning: 'A way to make a value available to every component below a provider without passing props through each level.' },
      { term: 'Reducer', meaning: 'A pure function (state, action) → next state; useReducer runs it for a component.' },
      { term: 'Open redirect', meaning: 'A vulnerability where a returnTo-style parameter can send users to an attacker\'s site.' },
    ],
    sections: [
      {
        title: 'The URL is state',
        paragraphs: [
          'If a screen can be reached, bookmarked, shared or restored with the back button, its identity belongs in the URL: /bookings/bk-42 rather than "selectedId in state". React Router maps URL paths to components. Routes nest: a layout route renders the header and navigation once and an <Outlet/> where the matching child page goes; an index route is the child shown at the parent\'s own path; a path of "*" catches everything else for a proper "Page not found". Inside a page, useParams() reads :id, useNavigate() moves programmatically (after a successful create, go to the new booking), and useSearchParams() keeps filters such as ?status=pending in the URL so a filtered view can be shared.',
          'Use <Link> and <NavLink> for navigation, never a button with an onClick that navigates: links are announced as links, can be opened in a new tab, and work with the keyboard as users expect. NavLink marks the current page with aria-current="page", which screen readers announce and your CSS can style.',
        ],
        code: `import { BrowserRouter, Routes, Route, Outlet, NavLink, useParams } from 'react-router';

function Layout() {
  return (
    <>
      <header><nav aria-label="Main">
        <NavLink to="/" end>Bookings</NavLink>
        <NavLink to="/bookings/new">New booking</NavLink>
      </nav></header>
      <main><Outlet /></main>
    </>
  );
}

function BookingDetails() {
  const { id } = useParams();            // string | undefined — the type admits it may be missing
  return <h1>Booking {id}</h1>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<BookingsPage />} />
          <Route path="bookings/new" element={<NewBookingPage />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}`,
        label: 'Nested routes with a layout',
      },
      {
        title: 'What the frontend can — and cannot — enforce',
        paragraphs: [
          'Everything in a browser bundle can be read and changed by the user. Hiding the Admin link from non-admins is good UX, but it is not security: the API you built in Month 2 must authorize every request, exactly as if no frontend existed. The frontend\'s job is to reflect the server\'s decisions helpfully.',
          'Where to keep the session is a real trade-off. A token in localStorage survives reloads but can be stolen by any script that runs on your page — one XSS bug, or one compromised npm dependency, exfiltrates every user\'s token. A token held only in memory disappears on reload, so it is usually paired with a refresh token in an HttpOnly cookie that scripts cannot read. The pattern current IETF guidance recommends for browser apps is the Backend-for-Frontend (BFF): a small server-side component holds the tokens and the browser only gets an HttpOnly, Secure, SameSite session cookie. In this course\'s exercises the token lives in memory in a React context, which keeps the client logic visible; in your capstone, prefer a BFF.',
        ],
      },
      {
        title: 'Session state: a typed reducer behind context',
        paragraphs: [
          'Model the session as a discriminated union — signed out, or signed in with a user and token — and change it only through a reducer: a pure function from (state, action) to the next state, with actions as another discriminated union. Reducers are easy to test without React and make every state transition explicit and searchable. useReducer runs it inside a provider component; context then exposes the state and a few named operations (signIn, signOut) to the whole tree.',
          'Wrap useContext in a custom hook — useAuth() — that throws a clear error when used outside the provider, so a missing provider fails loudly in development instead of rendering as "signed out". Keep context for genuinely app-wide, slowly changing values such as the session, theme or locale: every consumer re-renders when the value changes, so server data (bookings) stays in hooks or a server-state library, not in one giant context.',
        ],
        code: `type Session =
  | { status: 'signed-out'; reason?: 'expired' }
  | { status: 'signed-in'; user: { name: string; roles: string[] }; token: string };

type SessionAction =
  | { type: 'signed-in'; user: { name: string; roles: string[] }; token: string }
  | { type: 'signed-out' }
  | { type: 'expired' };

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'signed-in': return { status: 'signed-in', user: action.user, token: action.token };
    case 'signed-out': return { status: 'signed-out' };
    case 'expired': return state.status === 'signed-in' ? { status: 'signed-out', reason: 'expired' } : state;
  }
}

const AuthContext = createContext<{ session: Session; dispatch: Dispatch<SessionAction> } | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}`,
        label: 'Reducer + context + guard hook',
      },
      {
        title: 'Protected routes and auth-aware navigation',
        paragraphs: [
          'A RequireAuth wrapper decides per route: signed out → <Navigate to={"/login?returnTo=" + encodeURIComponent(location.pathname + location.search)} replace />; signed in but missing a role → a 403-style "You don\'t have access to this page" view; otherwise render the children. The navigation reads the same session: signed-out visitors see "Sign in"; signed-in users see their pages and a "Sign out" button with their name.',
          'After sign-in, navigate to returnTo — but validate it first. If any value is accepted, a phishing link such as /login?returnTo=https://evil.example sends users from your real sign-in page to an attacker\'s copy. Accept only internal paths: a value that starts with a single "/" (not "//", which browsers treat as another host, and not "/\\"), else fall back to "/".',
        ],
        code: `export function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\\\') ? value : '/';
}

export function RequireAuth({ role, children }: { role?: string; children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (session.status === 'signed-out') {
    return <Navigate to={'/login?returnTo=' + encodeURIComponent(location.pathname + location.search)} replace />;
  }
  if (role && !session.user.roles.includes(role)) return <p role="alert">You don't have access to this page.</p>;
  return <>{children}</>;
}`,
        label: 'Guarding routes; validating returnTo',
      },
      {
        title: 'When the session ends mid-task',
        paragraphs: [
          'Tokens expire while people work. Give the API client two hooks into the session: getToken, which reads the current token through a ref so the client never holds a stale copy, and onUnauthorized, called whenever a response is 401. That callback dispatches \'expired\', the protected route redirects to /login?returnTo=… with "Your session has expired" shown, and after signing in the user lands back where they were. One place handles expiry for every request — no screen needs its own 401 logic.',
        ],
      },
    ],
    table: {
      headers: ['Concern', 'Production approach', 'Anti-pattern'],
      rows: [
        ['Which screen is shown', 'Route in the URL (/bookings/:id)', 'selectedId in component state'],
        ['Navigation', '<Link>/<NavLink> with aria-current', 'Buttons or divs that call navigate()'],
        ['Session', 'Typed reducer + context + useAuth()', 'Globals or prop chains ten levels deep'],
        ['Authorization', 'Enforced by the API; UI only adapts', 'Hiding links as "security"'],
        ['Token storage', 'BFF cookie, or memory + HttpOnly refresh', 'Long-lived tokens in localStorage'],
        ['returnTo after login', 'Validated internal path', 'Any URL from the query string'],
      ],
    },
    exercise: {
      scenario: 'A team stores the JWT in localStorage, shows admin pages based on a role read from the token, accepts ?returnTo= anything after login, and handles 401 separately on four screens (two of which forget and show a blank page).',
      task: 'Review the design and propose fixes.',
      answer: 'localStorage exposes the token to any XSS or malicious dependency; move to a BFF with an HttpOnly session cookie, or keep the access token in memory with an HttpOnly refresh cookie. Role-based hiding is fine for UX but the API must authorize every admin endpoint; never trust the client\'s view of roles. Validate returnTo to internal paths (starts with one "/") to prevent open redirects. Centralise 401 handling: the API client calls an onUnauthorized callback that dispatches a session-expired action, and RequireAuth redirects to /login?returnTo=current path with an explanatory message, so every screen gets consistent behaviour.',
      evidence: 'Server-side authorization, safer token storage, validated returnTo, one 401 path.',
    },
    misconceptions: [
      'Hiding a route or link protects it. Only the API can enforce authorization.',
      'localStorage is a safe place for tokens because only my code reads it. Any script on the page can read it.',
      'Context is a state manager for everything. It suits app-wide, slowly changing values; server data belongs elsewhere.',
      'A returnTo parameter is harmless. Unvalidated, it is an open redirect for phishing.',
      'Navigation can be done with buttons and onClick. Links carry semantics, new-tab behaviour and accessibility.',
    ],
    sources: [R.router, R.routerNav, R.reducerContext, R.context, R.useReducer, R.fso5, R.fso7, R.oauthBrowser, R.owaspHtml5, R.openRedirect],
    labs: [],
    questions: [
      { prompt: 'Which React Router component renders a matching child route inside a layout? (one word)', answer: 'Outlet', accept: ['outlet', '<outlet/>', '<outlet />'] },
      { prompt: 'What vulnerability does an unvalidated returnTo parameter create? (two words)', answer: 'open redirect', accept: ['an open redirect', 'open redirects', 'unvalidated redirect'] },
    ],
    quiz: [
      { question: 'Where should "which booking is being viewed" live?', options: ['In a useState in the list', 'In the URL, e.g. /bookings/:id', 'In localStorage', 'In a global variable'], answer: 1, explanation: 'Linkable, shareable, back-button friendly.' },
      { question: 'A non-admin edits the bundle to show the Admin page. What stops them changing data?', options: ['Nothing', 'The API\'s authorization checks', 'The hidden link', 'Minification'], answer: 1, explanation: 'Only the server can enforce authorization.' },
      { question: 'Which returnTo value should be rejected?', options: ['/bookings/42', '/bookings?status=pending', '//evil.example/login', '/'], answer: 2, explanation: 'Protocol-relative URLs point to another host.' },
      { question: 'Why wrap useContext(AuthContext) in a useAuth() hook that throws without a provider?', options: ['Performance', 'A missing provider fails loudly instead of silently acting signed out', 'React requires it', 'To avoid re-renders'], answer: 1, explanation: 'Fail fast on wiring mistakes.' },
    ],
  },
  {
    id: 'dn4-6',
    slug: 'resilient-react-interactions',
    title: 'Production React II: Optimistic Updates, Focus and Failure',
    summary: 'Design interactions that stay correct and usable when things go wrong: error summaries and focus management, optimistic updates with per-item rollback, accessible confirmation dialogs, error boundaries, and keeping data on screen while it refreshes.',
    minutes: 60,
    prerequisite: 'Routing, Authentication and App-Wide State.',
    outcomes: [
      'Build forms that move focus to an error summary with links to each invalid field, and announce async results.',
      'Apply optimistic updates only where they are safe, rolling back just the affected item and reconciling with the server.',
      'Use an accessible modal dialog for destructive confirmations, with focus moved in and restored.',
      'Contain rendering crashes with error boundaries and know what they do not catch.',
      'Keep previous data visible during refreshes instead of flashing a loading state.',
    ],
    introduction:
      'Week 14\'s screen works when everything goes right. Production features are judged by what happens otherwise: a keyboard user who submits a form with three mistakes, a cancel that the server rejects after the UI already showed it as done, a component that throws on unexpected data, a list that blinks to "Loading…" every time anything changes. This lesson collects the patterns that make interactions robust and accessible — the core of this week\'s assignment, Production Features.',
    keyTerms: [
      { term: 'Error summary', meaning: 'A box at the top of a form listing each problem as a link to its field; focus moves to it on a failed submit.' },
      { term: 'Focus management', meaning: 'Deliberately moving keyboard focus after something changes, so keyboard and screen-reader users are not lost.' },
      { term: 'Live region', meaning: 'An element (role="status" or "alert") whose changes screen readers announce without moving focus.' },
      { term: 'Optimistic update', meaning: 'Showing the expected result immediately and reverting it if the server rejects the change.' },
      { term: 'Rollback', meaning: 'Undoing an optimistic change for exactly the item whose request failed.' },
      { term: 'Error boundary', meaning: 'A component that catches errors thrown while rendering its children and shows a fallback.' },
    ],
    sections: [
      {
        title: 'Forms that guide people to the problem',
        paragraphs: [
          'Inline messages under each field (aria-describedby, aria-invalid — Week 14) are necessary but not sufficient: after a failed submit, a sighted mouse user sees red text, while a keyboard or screen-reader user is left on the button with no idea what happened. The GOV.UK Design System\'s error summary pattern, tested with thousands of users, fixes this: render a summary at the top of the form with a heading ("There is a problem") and one link per error, give it tabIndex={-1} and move focus to it. Each link points at its field (href="#nights"); handle the click by focusing the input. Results of asynchronous actions that do not move focus — "Booking saved" — go in a role="status" live region so they are announced politely.',
        ],
        code: `const summaryRef = useRef<HTMLDivElement>(null);
useEffect(() => { if (submitCount > 0 && errorList.length > 0) summaryRef.current?.focus(); }, [submitCount]);

{errorList.length > 0 && (
  <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-title">
    <h2 id="error-summary-title">There is a problem</h2>
    <ul>
      {errorList.map(([field, message]) => (
        <li key={field}>
          <a href={'#' + field} onClick={(e) => { e.preventDefault(); document.getElementById(field)?.focus(); }}>{message}</a>
        </li>
      ))}
    </ul>
  </div>
)}`,
        label: 'An error summary that receives focus',
      },
      {
        title: 'Optimistic updates — and when not to use them',
        paragraphs: [
          'Waiting for the server before showing that a booking is cancelled makes the app feel slow. An optimistic update changes the UI immediately, sends the request, and reverts if it fails. Use it when the action is very likely to succeed, cheap to reverse and not high-stakes — cancelling, toggling, starring. Do not use it for payments or anything a user may act on irreversibly before the server confirms.',
          'The subtle part is rollback. Snapshotting the whole list before the request and restoring it on failure is wrong as soon as two actions overlap: if cancel A and cancel B are in flight and A fails, restoring the snapshot taken before A also undoes B. Roll back only the affected item, with a functional update — setItems(items => items.map(i => i.id === id ? { ...i, status: previous } : i)) — and when the server succeeds, replace the item with the server\'s version, which may differ from your guess. Tell the user about a rollback in a role="alert" message; silently flipping back looks like a bug.',
        ],
        code: `async function cancel(booking: Booking) {
  const previous = booking.status;
  setItems((items) => items.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)));   // optimistic
  const result = await api.cancel(booking.id);
  if (result.ok) {
    setItems((items) => items.map((b) => (b.id === booking.id ? result.value : b)));                  // reconcile
  } else {
    setItems((items) => items.map((b) => (b.id === booking.id ? { ...b, status: previous } : b)));    // roll back this one only
    setProblem("Couldn't cancel " + booking.guest + "'s booking: " + messageFor(result.error));
  }
}`,
        label: 'Per-item rollback with functional updates',
      },
      {
        title: 'Confirming destructive actions',
        paragraphs: [
          'For actions that are hard to undo, confirm first — in an accessible modal dialog, not window.confirm, which cannot be styled or tested well. The native <dialog> element opened with showModal() does most of the work: it traps focus inside, makes the rest of the page inert, closes on Escape and returns focus to the element that opened it. Give it an accessible name (aria-labelledby its heading), phrase the buttons as outcomes ("Cancel booking" / "Keep booking" rather than "OK" / "Cancel"), and put initial focus on the safe choice. For quick, reversible actions an "Undo" toast is often better than a confirmation.',
        ],
      },
      {
        title: 'When rendering itself fails',
        paragraphs: [
          'An exception thrown while rendering unmounts the whole React tree — a blank page. An error boundary limits the damage: a component that implements static getDerivedStateFromError (to switch to a fallback) and componentDidCatch (to report the error, e.g. to the monitoring you will set up in Month 5). Today error boundaries must be class components; wrap each route\'s content so one broken page leaves the navigation working, and give the fallback a "Try again" action that resets the boundary\'s state.',
          'Know their limits: boundaries catch errors during rendering and lifecycle methods of their children, not errors in event handlers, in async code such as a fetch callback, or in the boundary itself. Those still need try/catch or Result handling — which is why last week\'s client returns Results instead of throwing.',
        ],
        code: `export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  override componentDidCatch(error: Error, info: ErrorInfo) { reportError(error, info.componentStack); }
  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert">
        <h2>Something went wrong</h2>
        <button type="button" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}`,
        label: 'A minimal error boundary',
      },
      {
        title: 'Keep data on screen while it refreshes',
        paragraphs: [
          'Week 14\'s hook sets the state back to loading on every reload, so the list vanishes and reappears after each create or cancel. Users read that as flicker and lose their scroll position. Keep the previous data and add a separate refreshing flag — { status: \'success\', data, refreshing: true } — and show a small, polite "Updating…" indicator instead. Server-state libraries such as TanStack Query implement this stale-while-revalidate behaviour, request deduplication, caching and optimistic-update helpers; once you have written these patterns by hand you will recognise exactly what they save you.',
        ],
      },
    ],
    table: {
      headers: ['Situation', 'Pattern', 'Common failure'],
      rows: [
        ['Submit with several invalid fields', 'Error summary that receives focus, links to fields', 'Red text only near the fields'],
        ['Async result without navigation', 'role="status" live region', 'Silent change nobody hears'],
        ['Low-risk, likely action', 'Optimistic update + per-item rollback', 'Restoring a whole-list snapshot'],
        ['Destructive action', 'Modal <dialog>, outcome-named buttons', 'window.confirm("OK / Cancel")'],
        ['Render crash', 'Error boundary per route with reset', 'Blank white page'],
        ['Refetch after a change', 'Keep data, show "Updating…"', 'Flashing back to "Loading…"'],
      ],
    },
    exercise: {
      scenario: 'Support reports: (1) screen-reader users "can\'t submit the booking form" — it actually shows three inline errors they never hear; (2) cancelling two bookings quickly sometimes leaves both active though one cancel succeeded; (3) a booking with a missing guest name crashes the whole app to a white page.',
      task: 'Diagnose each and give the fix.',
      answer: '(1) Errors appear without focus or announcement; add an error summary (role="alert", tabIndex={-1}) that receives focus after a failed submit, with links that focus each field, while keeping aria-describedby on inputs. (2) The rollback restores a snapshot of the whole list taken before the failing request, undoing the other booking\'s successful optimistic change; roll back only the failed item with a functional update keyed by id, and reconcile successes with the server\'s response. (3) A render-time exception unmounts the tree; parse API data at the boundary so bad data becomes an invalid-response error, and wrap each route in an error boundary with a "Try again" fallback so a crash is contained and reported.',
      evidence: 'Focus + summary; per-item functional rollback; parsing plus error boundaries.',
    },
    misconceptions: [
      'Inline field errors are enough. Without focus management or announcements, many users never perceive them.',
      'Optimistic UI is always better. Not for high-stakes or irreversible actions.',
      'Rollback means restoring the state from before the request. With concurrent actions that undoes other successful changes.',
      'Error boundaries catch every error. Not event handlers, async callbacks or errors in the boundary itself.',
      'Showing "Loading…" on every refetch is harmless. It causes flicker and lost context; keep stale data visible.',
    ],
    sources: [R.govukErrors, R.govukValidation, R.tanstack, R.apgDialog, R.dialogEl, R.errorBoundary, R.wcag, R.fso6],
    labs: [],
    questions: [
      { prompt: 'Where should keyboard focus go after a form submit fails? (two words: the pattern\'s name)', answer: 'error summary', accept: ['the error summary', 'an error summary'] },
      { prompt: 'Which kind of React component catches errors thrown while rendering its children? (two words)', answer: 'error boundary', accept: ['an error boundary', 'error boundaries'] },
    ],
    quiz: [
      { question: 'Two optimistic cancels are in flight; the first fails. What should the UI do?', options: ['Restore the list from before the first cancel', 'Roll back only the first booking', 'Reload the page', 'Leave both cancelled'], answer: 1, explanation: 'Per-item rollback keeps the second, successful change.' },
      { question: 'Which action is a poor fit for an optimistic update?', options: ['Starring a booking', 'Cancelling a booking', 'Charging a card', 'Renaming a list'], answer: 2, explanation: 'High-stakes, irreversible actions should wait for the server.' },
      { question: 'An error is thrown inside an onClick handler. Does the nearest error boundary catch it?', options: ['Yes', 'No — handle it in the handler', 'Only in production', 'Only for class components'], answer: 1, explanation: 'Boundaries catch rendering errors, not event-handler errors.' },
      { question: 'What does <dialog>.showModal() provide?', options: ['Nothing beyond display', 'Focus containment, an inert page behind and Escape to close', 'Server validation', 'Automatic styling'], answer: 1, explanation: 'The native modal dialog handles core accessibility behaviour.' },
    ],
  },
  {
    id: 'dn4-7',
    slug: 'frontend-architecture',
    title: 'Frontend Architecture: State, Structure and Performance',
    summary: 'Give every kind of state the right home, model complex flows with reducers, organise code by feature with one-way dependencies, design component APIs, and make performance decisions from measurements — memoisation, code splitting and Web Vitals.',
    minutes: 60,
    prerequisite: 'Weeks 13–15. Month 3\'s architecture lessons (the same ideas, applied to the frontend).',
    outcomes: [
      'Classify state as server, URL, form, UI or session state, and choose the right home and tool for each.',
      'Model multi-step flows as a reducer over a discriminated union, with impossible transitions ignored.',
      'Organise a frontend by feature with a public surface per feature and dependencies that point one way.',
      'Explain why components re-render, and apply memo, useMemo and useCallback only where measurement justifies them.',
      'Split code by route with lazy(), and use Web Vitals (LCP, INP, CLS) to judge real-user performance.',
    ],
    introduction:
      'Month 3 taught you to keep a backend changeable: layers, boundaries, dependencies that point inwards. Frontends rot the same way, only faster — a growing pile of components that all fetch, all hold copies of the same data, and all import each other. This lesson applies the same discipline to React: decide where each piece of state lives, organise by feature with clear boundaries, design components that compose, and treat performance as an engineering question answered with measurements rather than sprinkled useMemo.',
    keyTerms: [
      { term: 'Server state', meaning: 'A cached copy of data owned by the server; it can be stale and needs refetching and invalidation.' },
      { term: 'UI state', meaning: 'Purely local presentation state: an open menu, a selected tab, a draft in an input.' },
      { term: 'Feature folder', meaning: 'Code grouped by business feature (bookings, auth) rather than by technical kind (components, hooks).' },
      { term: 'Re-render', meaning: 'React calling a component again; triggered by its own state, its parent re-rendering, or a context it reads changing.' },
      { term: 'Memoisation', meaning: 'Reusing a previous result (memo, useMemo, useCallback) when inputs have not changed.' },
      { term: 'Code splitting', meaning: 'Loading parts of the bundle on demand, typically per route, with lazy() and Suspense.' },
      { term: 'Web Vitals', meaning: 'Google\'s user-centred metrics: LCP (loading), INP (responsiveness), CLS (visual stability).' },
    ],
    sections: [
      {
        title: 'Every kind of state has a home',
        paragraphs: [
          'Most "state management" problems are state placed in the wrong home. Server state — bookings, the current user\'s profile — is a cache of someone else\'s data: it needs loading, error and staleness handling, deduplication and invalidation after mutations, which is why dedicated tools (TanStack Query, RTK Query) exist for it. URL state — which page, which booking, which filter — belongs in the route and search parameters (Week 15). Form state lives in the form while it is being edited. UI state such as "is this menu open" stays in the component that renders it. Session and app-wide settings go in context. What remains for a global client store (Redux Toolkit, Zustand) is genuinely shared, client-owned state such as a multi-screen editor — often surprisingly little.',
          'Within a component, prefer state that cannot contradict itself. Group values that change together, avoid duplicating data that can be derived, and when a component\'s state has several fields that must change in lockstep — a multi-step wizard, an editor with undo — move the transitions into a reducer over a discriminated union. A reducer is a pure function, so every transition is testable without rendering anything, and an action that makes no sense in the current state (submitting from the first step) simply returns the state unchanged.',
        ],
        code: `type Wizard =
  | { step: 'guest'; guest: string }
  | { step: 'dates'; guest: string; checkIn: string; nights: number }
  | { step: 'review'; draft: NewBooking }
  | { step: 'submitting'; draft: NewBooking }
  | { step: 'done'; bookingId: string }
  | { step: 'failed'; draft: NewBooking; message: string };

type WizardAction =
  | { type: 'guest-entered'; guest: string }
  | { type: 'dates-entered'; checkIn: string; nights: number }
  | { type: 'submitted' } | { type: 'succeeded'; id: string } | { type: 'failed'; message: string } | { type: 'back' };

function wizard(state: Wizard, action: WizardAction): Wizard {
  if (action.type === 'submitted' && state.step === 'review') return { step: 'submitting', draft: state.draft };
  // …one branch per legal transition…
  return state;                                   // anything else is ignored, not an exception
}`,
        label: 'Impossible states and transitions, ruled out by types',
      },
      {
        title: 'Organise by feature; let dependencies point one way',
        paragraphs: [
          'A src/components, src/hooks, src/utils layout works for ten files and collapses at two hundred: one feature\'s code is scattered across every folder and nothing stops anything importing anything. Group by feature instead — src/features/bookings/{api, components, hooks, index.ts}, src/features/auth/… — with shared, feature-agnostic building blocks in src/components/ui and app wiring (router, providers) in src/app. Each feature exposes a small public surface through its index.ts; other features import only from there, never from another feature\'s internals.',
          'Then apply Month 3\'s dependency rule to the frontend: app → features → shared, and within a feature, components → hooks → API client → the HTTP layer. Components never call fetch; the API client never imports React. Enforce it with tooling — eslint-plugin-boundaries or import restrictions in your lint config — because a rule that only lives in a wiki is not a rule.',
        ],
        code: `src/
  app/            router, providers, layout — the composition root
  features/
    bookings/
      api/        bookingsClient.ts (no React)
      hooks/      useBookings.ts (React, calls api/)
      components/ BookingList.tsx, NewBookingForm.tsx (call hooks/)
      index.ts    export { BookingsPage } — the feature's public surface
    auth/         session.tsx, RequireAuth.tsx, LoginPage.tsx, index.ts
  components/ui/  Button, Dialog, Field — no knowledge of bookings
  lib/            http.ts, result.ts — no knowledge of features`,
        label: 'A feature-oriented layout',
      },
      {
        title: 'Components with good APIs',
        paragraphs: [
          'Design props the way you would design a public method. Prefer a few meaningful props over many booleans (variant="danger" rather than isRed, isBig, isOutlined), pass data and callbacks rather than reaching into context deep in a leaf, and use composition — children and render slots — instead of threading props through layers that do not use them. Separate components that know about the domain and fetch data from components that only present what they are given: the latter are reusable, trivially testable and safe to render in isolation in a component workbench such as Storybook.',
        ],
      },
      {
        title: 'Performance: measure, then fix the cause',
        paragraphs: [
          'A component re-renders when its state changes, when its parent re-renders, or when a context it reads changes. Re-rendering is usually cheap; React only touches the DOM where output differs. When profiling (React DevTools Profiler) shows a real cost — a long list re-rendering on every keystroke in an unrelated input — the fixes, in order of preference, are: move the fast-changing state down into a smaller component so less re-renders; pass expensive children as props (children are created by the parent that owns them); and only then memoise. memo(Row) skips re-rendering a row whose props are shallow-equal, which only works if the callbacks you pass are stable — useCallback with functional state updates (setStarred(s => …)) so the callback does not depend on the state it changes. useMemo caches an expensive calculation between renders.',
          'Beyond re-renders, real-user performance is about loading and responsiveness. Split the bundle per route with lazy(() => import(\'./BookingDetailsPage\')) and a Suspense fallback so the first screen downloads less; virtualise lists with thousands of rows; size images. Judge the result with Web Vitals from real users — Largest Contentful Paint for loading, Interaction to Next Paint for responsiveness, Cumulative Layout Shift for stability — which you will report to monitoring in Month 5.',
        ],
        code: `const BookingRow = memo(function BookingRow({ booking, starred, onToggleStar }: RowProps) {
  return (
    <li>
      {booking.guest}
      <button type="button" aria-pressed={starred} onClick={() => onToggleStar(booking.id)}>Star</button>
    </li>
  );
});

function BookingBoard({ bookings }: { bookings: Booking[] }) {
  const [note, setNote] = useState('');                       // typing here must not re-render every row
  const [starred, setStarred] = useState<ReadonlySet<string>>(new Set());
  const toggleStar = useCallback((id: string) => {             // stable: reads no state directly
    setStarred((s) => { const next = new Set(s); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);
  const sorted = useMemo(() => [...bookings].sort(byCheckIn), [bookings]);
  /* … */
}

const BookingDetailsPage = lazy(() => import('./features/bookings/BookingDetailsPage'));`,
        label: 'Memoise deliberately; split by route',
      },
    ],
    table: {
      headers: ['State', 'Home', 'Tool'],
      rows: [
        ['Bookings from the API', 'Server cache', 'Custom hook or TanStack Query'],
        ['Current page, filters', 'URL', 'Routes and search params'],
        ['Values being typed', 'The form', 'useState / form library'],
        ['Menu open, tab selected', 'The component that renders it', 'useState'],
        ['Multi-step flow', 'The flow\'s component', 'useReducer over a union'],
        ['Session, theme, locale', 'App-wide', 'Context (+ reducer)'],
      ],
    },
    exercise: {
      scenario: 'An app keeps everything in one Redux store: bookings fetched once at start-up and never refreshed, the selected booking id, the open/closed state of every dropdown, and form drafts. Typing in any form re-renders the whole bookings table of 2,000 rows; every feature imports from every other.',
      task: 'Propose a restructuring.',
      answer: 'Split state by kind: move bookings to server-state handling (a data hook or TanStack Query) with refetching and invalidation after mutations; put the selected booking in the URL (/bookings/:id); move dropdown and draft state into the components that own them, so typing only re-renders the form. Keep the store (or context) for what is truly global, such as the session. Reorganise into feature folders with public index files and lint-enforced import boundaries. For the table, render rows through memo with stable callbacks, and virtualise if 2,000 rows remain slow after profiling. Measure before and after with the Profiler and Web Vitals.',
      evidence: 'State moved to its proper home; boundaries enforced; performance fixes justified by measurements.',
    },
    misconceptions: [
      'All shared state belongs in one global store. Server, URL, form and UI state each have better homes.',
      'useMemo and useCallback everywhere make apps fast. They cost memory and complexity; use them where profiling shows a need.',
      'memo(Row) works whatever you pass. A new callback or object each render defeats it.',
      'Folder structure is cosmetic. Without boundaries every feature becomes coupled to every other.',
      'Performance means Lighthouse scores on my laptop. Real-user Web Vitals tell you what users experience.',
    ],
    sources: [R.chooseState, R.useReducer, R.memo, R.lazy, R.webVitals, R.bulletproof, R.reduxStyle, R.fso6, R.tanstack],
    labs: [],
    questions: [
      { prompt: 'Which React function skips re-rendering a component when its props are unchanged? (one word)', answer: 'memo', accept: ['react.memo'] },
      { prompt: 'Which Web Vital measures responsiveness to user input? (three-letter abbreviation)', answer: 'INP', accept: ['inp', 'interaction to next paint'] },
    ],
    quiz: [
      { question: 'Where should "which booking am I viewing" live?', options: ['A global store', 'The URL', 'localStorage', 'A ref'], answer: 1, explanation: 'URL state is shareable and survives reloads.' },
      { question: 'memo(Row) is used, but every row still re-renders when typing in a note box. The most likely cause?', options: ['memo is broken', 'A new callback or object is passed to each row on every render', 'Keys are missing', 'Strict Mode'], answer: 1, explanation: 'Unstable props defeat memoisation.' },
      { question: 'What is the best first fix for an expensive subtree re-rendering on every keystroke?', options: ['Wrap everything in useMemo', 'Move the fast-changing state into a smaller component', 'Disable Strict Mode', 'Use class components'], answer: 1, explanation: 'Reduce what re-renders before memoising.' },
      { question: 'In a feature-folder structure, how should features depend on each other?', options: ['Freely', 'Only through each feature\'s public index', 'Never — duplicate code instead', 'Through global variables'], answer: 1, explanation: 'A small public surface keeps features decoupled.' },
    ],
  },
  {
    id: 'dn4-8',
    slug: 'frontend-quality',
    title: 'Frontend Quality: Testing Strategy, CI and Code Review',
    summary: 'Decide what to test and how — static checks, unit, integration and end-to-end — write tests that catch real bugs (and check that they do with mutation testing), automate it all in CI, audit accessibility, and review frontend code for the defects that matter.',
    minutes: 60,
    prerequisite: 'Weeks 13–15. Month 1\'s testing week.',
    outcomes: [
      'Plan a frontend test portfolio with the testing trophy: types and lint, unit, integration and a few end-to-end tests.',
      'Write behaviour-focused tests that survive refactoring, and fake dependencies at the right boundary.',
      'Use mutation testing to judge whether tests would catch real bugs.',
      'Build a CI pipeline that type-checks, lints, tests, builds and runs end-to-end tests on every pull request.',
      'Review frontend code for correctness, accessibility, security and maintainability defects.',
    ],
    introduction:
      'In Month 1 you learned that tests are only as good as the bugs they catch. Frontends add their own failure modes — race conditions, inaccessible markup, unescaped HTML, effects that drift out of sync — and their own tools. This lesson assembles the quality system for a React and TypeScript codebase, from the compiler to the code review, and prepares you for this week\'s assignment: reviewing and fixing a teammate\'s frontend and proving your tests would catch the next mistake.',
    keyTerms: [
      { term: 'Testing trophy', meaning: 'A portfolio shape: a base of static checks, some unit tests, mostly integration tests, a few end-to-end tests.' },
      { term: 'Integration test (frontend)', meaning: 'Rendering a feature with real child components and a fake API, and driving it like a user.' },
      { term: 'End-to-end test', meaning: 'A real browser driving the deployed or locally served app, often against a real API (Playwright).' },
      { term: 'Mutation testing', meaning: 'Automatically introducing small bugs (mutants) to see whether your tests fail; survivors reveal gaps.' },
      { term: 'Network-level mocking', meaning: 'Faking HTTP responses beneath the app (e.g. with MSW) so the real client code runs in tests.' },
      { term: 'XSS', meaning: 'Cross-site scripting: attacker-controlled data executed as script in your page.' },
    ],
    sections: [
      {
        title: 'What to test, and at which level',
        paragraphs: [
          'TypeScript in strict mode and ESLint (with the react-hooks and jsx-a11y plugins) catch whole classes of bugs before any test runs — the base of the testing trophy. Pure logic — reducers, parsers, price rules — gets fast unit tests. Most of your confidence should come from integration tests: render a page with its real components and a fake API, then use it the way a user does — find the field by its label, type, click the button by its name, wait for the result. A thin layer of end-to-end tests with Playwright covers the critical journeys (sign in, create a booking, cancel it) in a real browser against a real backend, run on every deploy.',
          'Test behaviour, not implementation. Assert what a user can perceive — text, roles, focus, what the API was asked to do — never a component\'s internal state or which hook it used, so a refactor that preserves behaviour keeps the tests green. Fake at a boundary you own: inject an API client (as this month\'s tasks do) or intercept requests at the network level with Mock Service Worker, so the real client code still runs. Make asynchronous tests deterministic with findBy and waitFor rather than sleeps, and with fake timers for debounces and retries.',
        ],
        code: `it('cancels a booking after confirmation', async () => {
  const user = userEvent.setup();
  const client = fakeClient({ bookings: [booking({ guest: 'Ama Owusu' })] });
  render(<App client={client} />);

  await user.click(await screen.findByRole('button', { name: 'Cancel booking for Ama Owusu' }));
  await user.click(screen.getByRole('button', { name: 'Yes, cancel it' }));

  expect(client.cancel).toHaveBeenCalledWith('b1', expect.any(String), 'W/"1"');
  expect(await screen.findByText(/Cancelled/)).toBeInTheDocument();
});`,
        label: 'An integration test that reads like the user\'s journey',
      },
      {
        title: 'Do your tests catch bugs? Mutation testing',
        paragraphs: [
          'Coverage tells you which lines ran, not whether any assertion would notice them being wrong. Mutation testing answers the real question: a tool such as Stryker changes your code in small, realistic ways — >= becomes >, a condition is negated, a + 1 disappears — and runs the tests against each mutant. A mutant that makes some test fail is "killed"; one that survives marks a behaviour nobody checks. You practised this by hand in Month 1\'s Tested Engineering Challenge; this week you do it for frontend logic, writing test cases that must pass against the correct code and fail against each planted mutant. Aim tests at boundaries (exactly 7 nights, the last day of a month), at every branch, and at the exact values users see.',
        ],
      },
      {
        title: 'Continuous integration for a frontend',
        paragraphs: [
          'Every pull request should prove itself automatically: install exactly what the lockfile says (npm ci), type-check (tsc --noEmit — Vite\'s build does not type-check), lint, run unit and integration tests, build, and run the end-to-end suite against the built app. Fail fast on the cheap checks, cache dependencies, upload the Playwright report on failure, and protect the main branch so nothing merges red. Full Stack Open part 11 walks through this with GitHub Actions; in Month 5 the same pipeline will go on to build containers and deploy.',
        ],
        code: `# .github/workflows/frontend.yml
name: frontend
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npx vitest run --coverage
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test`,
        label: 'Every check, on every pull request',
      },
      {
        title: 'Accessibility is tested, not hoped for',
        paragraphs: [
          'Automated checkers such as axe-core (in tests, in Playwright, or as a browser extension) find missing labels, low contrast and invalid ARIA — but only around a third of real accessibility problems. The rest needs people: operate every flow with the keyboard alone (can you reach it, see where focus is, get out of dialogs?), listen to it with a screen reader (NVDA on Windows, VoiceOver on macOS), zoom to 200%, and check that no information is conveyed by colour alone. Testing Library\'s role-and-label queries, which you have used all month, push you towards accessible markup by default.',
        ],
      },
      {
        title: 'Reviewing frontend code',
        paragraphs: [
          'A good review reads for correctness and design first, as Google\'s engineering practices recommend, then for the frontend-specific defects that tests often miss. Types at the boundary: is server data parsed, or cast with as? States: are loading, empty and error handled? Effects: do they have cleanup and complete dependencies, or are they syncing derived state? Lists: stable keys, no mutation of props when sorting. Accessibility: real buttons and links, labels, focus after changes. Security: anything rendered with dangerouslySetInnerHTML must never contain user-controlled data (React escapes text by default — opting out reopens XSS); no secrets in the bundle; tokens not in localStorage. Write review comments that explain the risk and suggest the fix, and approve once the change makes the codebase better, not perfect.',
        ],
      },
    ],
    table: {
      headers: ['Layer', 'Catches', 'Tools'],
      rows: [
        ['Static', 'Type errors, hook misuse, obvious a11y slips', 'tsc --strict, ESLint (react-hooks, jsx-a11y)'],
        ['Unit', 'Logic bugs in reducers, parsers, rules', 'Vitest'],
        ['Integration', 'Broken features and states, as users meet them', 'Vitest + Testing Library + fake API / MSW'],
        ['End-to-end', 'Wiring, deployment and real-backend problems', 'Playwright in CI'],
        ['Mutation', 'Tests that would not notice a bug', 'Stryker'],
        ['Manual a11y', 'Keyboard, screen reader, zoom problems', 'NVDA/VoiceOver, keyboard-only passes'],
      ],
    },
    exercise: {
      scenario: 'A team has 92% line coverage and still ships regressions: tests assert on component state via test IDs, mock every child component, and use setTimeout(…, 1000) to wait. CI runs only "npm run build". A recent bug displayed a guest\'s notes as HTML, and one PR stored the JWT in localStorage.',
      task: 'Write the improvement plan.',
      answer: 'Shift to behaviour-focused integration tests: render real children with a fake API, query by role and label, assert visible outcomes and API calls, and replace sleeps with findBy/waitFor and fake timers. Run mutation testing on core logic to find assertions that catch nothing; coverage is not a quality measure. Expand CI to npm ci, tsc --noEmit, ESLint with react-hooks and jsx-a11y, Vitest, build and a small Playwright suite of critical journeys, and require it to pass before merge. Add review checklist items for XSS (no dangerouslySetInnerHTML with user data; render text) and token storage (BFF/HttpOnly cookie or memory), plus an automated axe check and periodic keyboard/screen-reader passes.',
      evidence: 'Behaviour tests, mutation results, a complete CI gate and an explicit review checklist.',
    },
    misconceptions: [
      'High coverage means good tests. It measures execution, not whether failures would be noticed.',
      'Mocking every child makes tests faster and therefore better. It tests the mocks; integration tests catch real breakage.',
      'Vite\'s build type-checks the project. It strips types; run tsc --noEmit in CI.',
      'Automated accessibility tools are enough. They find roughly a third of issues; keyboard and screen-reader checks are essential.',
      'React prevents XSS everywhere. dangerouslySetInnerHTML opts out of escaping.',
    ],
    sources: [R.trophy, R.rtlPrinciples, R.msw, R.playwright, R.stryker, R.actions, R.fso11, R.axe, R.reactXss, R.googleReview],
    labs: [],
    questions: [
      { prompt: 'What kind of testing introduces small deliberate bugs to check that your tests fail? (one word, before "testing")', answer: 'mutation', accept: ['mutation testing'] },
      { prompt: 'Which React prop opts out of escaping and can reintroduce XSS? (one word)', answer: 'dangerouslySetInnerHTML', accept: ['dangerouslysetinnerhtml'] },
    ],
    quiz: [
      { question: 'Where should most of a React app\'s test confidence come from?', options: ['Snapshot tests', 'Integration tests that drive features like a user', 'Testing component state', 'Manual QA only'], answer: 1, explanation: 'The testing trophy weights integration tests most.' },
      { question: 'A mutant changing >= 7 to > 7 survives. What does that tell you?', options: ['The code is correct', 'No test checks exactly 7', 'Coverage is low', 'The mutant is invalid'], answer: 1, explanation: 'A boundary is untested.' },
      { question: 'Which CI step catches type errors that a Vite build would let through?', options: ['npm run build', 'npx tsc --noEmit', 'npm ci', 'npx playwright test'], answer: 1, explanation: 'Vite transpiles without type-checking.' },
      { question: 'A component renders booking notes with dangerouslySetInnerHTML. What should the review say?', options: ['Fine if notes are short', 'XSS risk: render the notes as text', 'Use innerHTML instead', 'Add a CSS class'], answer: 1, explanation: 'User-controlled HTML must not be injected.' },
    ],
  },
];
