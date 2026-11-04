import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  handbook: { title: 'TypeScript Handbook (official)', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
  forOop: { title: 'TypeScript Handbook — TypeScript for Java/C# programmers', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html' },
  everyday: { title: 'TypeScript Handbook — Everyday types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html' },
  narrowing: { title: 'TypeScript Handbook — Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' },
  generics: { title: 'TypeScript Handbook — Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
  typesFromTypes: { title: 'TypeScript Handbook — Creating types from types', url: 'https://www.typescriptlang.org/docs/handbook/2/types-from-types.html' },
  utility: { title: 'TypeScript Handbook — Utility types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' },
  tsconfig: { title: 'TypeScript — TSConfig reference (strict and friends)', url: 'https://www.typescriptlang.org/tsconfig/' },
  deepDive: { title: 'Basarat Ali Syed — TypeScript Deep Dive (free)', url: 'https://basarat.gitbook.io/typescript/' },
  conciseBook: { title: 'Simone Poggiali — The Concise TypeScript Book (free)', url: 'https://github.com/gibbok/typescript-book' },
  fso9: { title: 'Full Stack Open — Part 9: TypeScript', url: 'https://fullstackopen.com/en/part9' },
  fso0: { title: 'Full Stack Open — Part 0: Fundamentals of web apps', url: 'https://fullstackopen.com/en/part0' },
  parseDontValidate: { title: 'Alexis King — Parse, don\'t validate', url: 'https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/' },
  zod: { title: 'Zod — TypeScript-first schema validation', url: 'https://zod.dev/' },
  fetch: { title: 'MDN — Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
  abort: { title: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
  problemDetails: { title: 'RFC 9457 — Problem Details for HTTP APIs', url: 'https://www.rfc-editor.org/rfc/rfc9457' },
  vitest: { title: 'Vitest — Getting started', url: 'https://vitest.dev/guide/' },
  expectTypeOf: { title: 'Vitest — expectTypeOf (type-level tests)', url: 'https://vitest.dev/api/expect-typeof' },
  react: { title: 'React — Learn React (official)', url: 'https://react.dev/learn' },
  thinking: { title: 'React — Thinking in React', url: 'https://react.dev/learn/thinking-in-react' },
  state: { title: 'React — State: a component\'s memory', url: 'https://react.dev/learn/state-a-components-memory' },
  lists: { title: 'React — Rendering lists (and why keys matter)', url: 'https://react.dev/learn/rendering-lists' },
  sharing: { title: 'React — Sharing state between components', url: 'https://react.dev/learn/sharing-state-between-components' },
  reactTs: { title: 'React — Using TypeScript', url: 'https://react.dev/learn/typescript' },
  effects: { title: 'React — Synchronizing with effects', url: 'https://react.dev/learn/synchronizing-with-effects' },
  noEffect: { title: 'React — You might not need an effect', url: 'https://react.dev/learn/you-might-not-need-an-effect' },
  customHooks: { title: 'React — Reusing logic with custom hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
  fso1: { title: 'Full Stack Open — Part 1: Introduction to React', url: 'https://fullstackopen.com/en/part1' },
  fso2: { title: 'Full Stack Open — Part 2: Communicating with server', url: 'https://fullstackopen.com/en/part2' },
  vite: { title: 'Vite — Getting started', url: 'https://vite.dev/guide/' },
  rtlQueries: { title: 'Testing Library — Which query should I use?', url: 'https://testing-library.com/docs/queries/about/#priority' },
} as const;

/** Month 4, weeks 13–14: TypeScript engineering (assignment: TypeScript Client), then React
 *  fundamentals (assignment: Build the Client). Written for engineers who finished Months 1–3 in C#:
 *  every new idea is explained against the C# they already know. */
export const DN_MONTH4_A: CurriculumLesson[] = [
  {
    id: 'dn4-1',
    slug: 'typescript-for-csharp-engineers',
    title: 'TypeScript for C# Engineers: Structural Types, Unions and Narrowing',
    summary: 'Move from C#\'s nominal, runtime-enforced types to TypeScript\'s structural, compile-time-only types: inference, strict null checking, literal and union types, discriminated unions, narrowing and exhaustive checks with never.',
    minutes: 55,
    prerequisite: 'Months 1–3 (C#). Basic JavaScript syntax — if JavaScript is new to you, read Full Stack Open part 1\'s JavaScript section first.',
    outcomes: [
      'Explain what TypeScript checks and what it erases, and why runtime data still needs validating.',
      'Use structural typing deliberately, and know when two "different" types are interchangeable.',
      'Model states with literal and discriminated union types instead of booleans and nullable fields.',
      'Narrow unions with typeof, in, instanceof, equality and user-defined type guards, and make switches exhaustive with never.',
      'Turn on and read strict mode errors, and choose unknown over any.',
    ],
    introduction:
      'Months 1–3 built a C# backend; Month 4 builds the frontend that talks to it, and the frontend language of choice is TypeScript: JavaScript plus a static type system. Much will feel familiar — interfaces, generics, classes, async/await (TypeScript and C# share a designer, Anders Hejlsberg). The differences are deeper than the syntax, though. C# types are nominal and exist at run time; TypeScript types are structural and are erased before the code runs. Get that model right in this lesson and the rest of the month — typed API clients, typed React components — follows naturally.',
    keyTerms: [
      { term: 'Type erasure', meaning: 'TypeScript types are removed when compiling to JavaScript; nothing checks them at run time.' },
      { term: 'Structural typing', meaning: 'Compatibility is decided by shape (the members a value has), not by declared names.' },
      { term: 'Literal type', meaning: 'A type with exactly one value, such as \'cancelled\' or 404.' },
      { term: 'Union type', meaning: 'A value that is one of several types: \'pending\' | \'confirmed\' | \'cancelled\'.' },
      { term: 'Discriminated union', meaning: 'A union of object types that share a literal "tag" property used to tell them apart.' },
      { term: 'Narrowing', meaning: 'The compiler refining a union to a more specific type after a check such as typeof or a tag comparison.' },
      { term: 'never', meaning: 'The type with no values; reaching it proves a code path is impossible.' },
    ],
    sections: [
      {
        title: 'Types that exist only at compile time',
        paragraphs: [
          'A C# object always knows its own type: you can ask for GetType(), cast with a runtime check, and the CLR refuses a bad cast. A TypeScript program is compiled to plain JavaScript, and every type annotation, interface and generic parameter is deleted in the process. The compiler is a very good static analyser for your source code, but once the program runs there is nothing left to enforce types — which is why a value from outside your code (an HTTP response, localStorage, a form field) must be checked at run time before you trust it. The next lesson is about doing that well.',
          'TypeScript infers most local types, exactly like var in C#: let total = 0 is a number, const status = \'pending\' is the literal type \'pending\'. Annotate function parameters and exported return types — they are your module\'s contract — and let inference handle the rest. Turn on "strict": true in tsconfig.json for every new project. It enables strictNullChecks (null and undefined are no longer assignable to everything — the equivalent of C# nullable reference types, but enforced as errors), noImplicitAny and several other checks without which much of TypeScript\'s value disappears.',
        ],
        code: `// tsconfig.json (the options this course's grader uses)
{
  "compilerOptions": {
    "strict": true,                 // strictNullChecks, noImplicitAny, strictFunctionTypes, ...
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",  // how Vite and other bundlers resolve imports
    "jsx": "react-jsx",
    "isolatedModules": true,        // each file must compile on its own, as bundlers do
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}`,
        label: 'Strict mode is not optional',
      },
      {
        title: 'Structural typing: shape, not name',
        paragraphs: [
          'In C#, a class must declare that it implements an interface. In TypeScript, any value with the right members is compatible — the type\'s name is irrelevant. That makes it effortless to describe JSON (an interface is just a shape) and to write test fakes (any object with the right methods will do). It also means two types with identical shapes are interchangeable, so a CustomerId string and an OrderId string can be mixed up silently. When that matters, add a "brand" — an impossible extra property that only your constructor function can produce — to get nominal behaviour back.',
          'Prefer type aliases and interfaces to classes for data. A class instance from JSON.parse is impossible (JSON produces plain objects), so model API data as plain readonly shapes and keep classes for things with behaviour and private state.',
        ],
        code: `interface Guest { name: string; email: string }
const fromJson = { name: 'Ama', email: 'ama@example.com', vip: true };
const g: Guest = fromJson;            // fine: it has (at least) the right shape

// Branded ids: structurally different, so they cannot be swapped by accident
type BookingId = string & { readonly __brand: 'BookingId' };
type RoomId = string & { readonly __brand: 'RoomId' };
const bookingId = (raw: string) => raw as BookingId;

function cancel(id: BookingId) { /* ... */ }
const room = 'R-12' as RoomId;
cancel(room);                          // error: RoomId is not assignable to BookingId`,
        label: 'Structural compatibility, and brands when you need names',
      },
      {
        title: 'Make illegal states unrepresentable',
        paragraphs: [
          'A literal type has exactly one value, and a union combines alternatives: type Status = \'pending\' | \'confirmed\' | \'cancelled\'. Unlike a C# enum, a union of string literals is just strings at run time, so it matches JSON directly and needs no mapping. Assign \'canceled\' (one l) and the compiler stops you.',
          'The real power is the discriminated union: a union of object types that share a literal tag. Instead of one type with optional fields that are "only set when status is cancelled" (and a reader who must remember that rule), each state carries exactly the data that exists in that state. A booking that is cancelled has a cancelledAt and a reason; a confirmed one does not, and the compiler will not let you read a reason off a confirmed booking. The same technique models remote data (idle, loading, success, error) — a pattern you will use in every React component this month.',
        ],
        code: `type Booking =
  | { status: 'pending'; id: string; guest: string; requestedAt: string }
  | { status: 'confirmed'; id: string; guest: string; room: string }
  | { status: 'cancelled'; id: string; guest: string; cancelledAt: string; reason: string };

// Versus the "bag of optionals" it replaces — every reader must know the hidden rules:
interface LooseBooking { status: string; room?: string; cancelledAt?: string; reason?: string }`,
        label: 'One type per state',
      },
      {
        title: 'Narrowing, type guards and exhaustiveness',
        paragraphs: [
          'Given a union, TypeScript narrows it after checks it understands: typeof x === \'string\', \'room\' in booking, err instanceof Error, booking.status === \'cancelled\', and truthiness checks for null. Inside the branch, only the members of the narrowed type are available. For checks the compiler cannot see through, write a user-defined type guard — a function returning value is SomeType — but remember it is a promise you make to the compiler, not something it verifies, so test it.',
          'For a switch over a discriminated union, add a default branch that assigns the value to never. If someone later adds a fourth status, that assignment stops compiling and points at every switch that needs updating — the TypeScript equivalent of C#\'s exhaustive switch-expression warning, but as a hard error.',
        ],
        code: `function label(b: Booking): string {
  switch (b.status) {
    case 'pending':   return \`Awaiting confirmation since \${b.requestedAt}\`;
    case 'confirmed': return \`Room \${b.room}\`;
    case 'cancelled': return \`Cancelled: \${b.reason}\`;   // b.reason exists only here
    default: {
      const unreachable: never = b;   // compile error if a status is added and not handled
      throw new Error(\`Unhandled booking: \${JSON.stringify(unreachable)}\`);
    }
  }
}

// A user-defined type guard: the compiler trusts it, so it must be correct
function isProblem(x: unknown): x is { title: string; status: number } {
  return typeof x === 'object' && x !== null
    && typeof (x as Record<string, unknown>).title === 'string'
    && typeof (x as Record<string, unknown>).status === 'number';
}`,
        label: 'Narrow, then prove you handled every case',
      },
      {
        title: 'any, unknown, and asserting your way out of trouble',
        paragraphs: [
          'any switches type checking off for a value and everything it touches, spreading silently through a codebase. unknown is its safe counterpart: anything can be assigned to it, but you cannot use it until you narrow it. Type JSON.parse results, catch-clause errors (strict mode makes these unknown) and untrusted input as unknown and narrow them; never as any.',
          'Type assertions (value as Booking) and the non-null assertion (value!) are the compiler equivalent of a C# cast that cannot fail: you are overriding the checker. They are occasionally necessary — a brand constructor, a DOM element you know exists — but each one is a place where a bug can hide, and code review should question them. If you find yourself writing as any to silence an error, the error is usually right.',
        ],
      },
    ],
    table: {
      headers: ['C# concept', 'TypeScript counterpart', 'Key difference'],
      rows: [
        ['Class implements interface', 'Any value with the right shape', 'Structural, not nominal'],
        ['enum Status { ... }', '\'pending\' | \'confirmed\' | \'cancelled\'', 'Plain strings at run time; matches JSON'],
        ['Nullable reference types', 'strictNullChecks (strict: true)', 'Hard compile errors, not warnings'],
        ['Pattern matching on type', 'Narrowing via tags, typeof, in', 'Works on unions of plain objects'],
        ['object / dynamic', 'unknown / any', 'Prefer unknown; any disables checking'],
        ['(Booking)x runtime cast', 'x as Booking', 'No runtime check at all'],
      ],
    },
    exercise: {
      scenario: 'A frontend models a payment as { state: string; amount?: number; failureReason?: string; receiptUrl?: string }. A bug report: the UI showed "Payment failed: undefined" for a successful payment, and another screen crashed reading receiptUrl.length on a pending payment.',
      task: 'Redesign the type so both bugs become compile errors, and show the rendering function.',
      answer: 'Use a discriminated union: type Payment = { state: \'pending\'; amount: number } | { state: \'succeeded\'; amount: number; receiptUrl: string } | { state: \'failed\'; amount: number; failureReason: string }. A render function switches on payment.state; failureReason is only accessible in the failed branch and receiptUrl only in the succeeded branch, so "failed: undefined" and reading receiptUrl on a pending payment no longer compile. A default branch assigning payment to never keeps the switch exhaustive when a refunded state is added. Data arriving from the API is parsed into this union at the boundary rather than asserted.',
      evidence: 'Each state carries only its own data; exhaustive switch with never.',
    },
    misconceptions: [
      'TypeScript checks types at run time. All types are erased; untrusted data must be validated in code.',
      'An interface must be implemented explicitly. Any value with the right shape is compatible.',
      'A string-literal union is like a C# enum with numbers behind it. It is the strings themselves, which is why it maps cleanly to JSON.',
      'as Booking converts or checks a value. It only tells the compiler to trust you.',
      'any is a harmless shortcut while prototyping. It spreads, and silently disables checking wherever it reaches.',
    ],
    sources: [R.forOop, R.everyday, R.narrowing, R.tsconfig, R.handbook, R.deepDive, R.conciseBook, R.fso9],
    labs: [],
    questions: [
      { prompt: 'Which TypeScript type accepts any value but forces you to narrow it before use? (one word)', answer: 'unknown' },
      { prompt: 'Which type do you assign a value to in a default branch to prove a switch is exhaustive? (one word)', answer: 'never' },
    ],
    quiz: [
      { question: 'Two interfaces have different names but identical members. Can a value of one be assigned to the other?', options: ['No, names must match', 'Yes — compatibility is structural', 'Only with an explicit cast', 'Only for classes'], answer: 1, explanation: 'TypeScript compares shapes, not names.' },
      { question: 'What happens to type annotations when TypeScript compiles to JavaScript?', options: ['They become runtime checks', 'They are erased', 'They become JSDoc comments that are enforced', 'They are kept for reflection'], answer: 1, explanation: 'Types exist only at compile time.' },
      { question: 'Which is the safest type for the result of JSON.parse?', options: ['any', 'unknown', 'object', 'Record<string, any>'], answer: 1, explanation: 'unknown forces narrowing or parsing before use.' },
      { question: 'Why model states as a discriminated union instead of optional fields?', options: ['It is faster at run time', 'Each state carries only its data, so invalid combinations do not compile', 'JSON requires it', 'It avoids classes'], answer: 1, explanation: 'Illegal states become unrepresentable.' },
    ],
  },
  {
    id: 'dn4-2',
    slug: 'typescript-at-the-api-boundary',
    title: 'TypeScript at the Boundary: Generics, Parsing Unknown Data and Typed HTTP',
    summary: 'Write reusable generic code, derive types from types with utility and mapped types, parse untrusted JSON into trusted types, return errors as typed results, and wrap fetch in a typed client with timeouts and cancellation.',
    minutes: 60,
    prerequisite: 'TypeScript for C# Engineers. The Booking API you built in Month 2.',
    outcomes: [
      'Write generic functions and types with constraints, and keep type information flowing instead of collapsing to any.',
      'Derive request and view types from one source of truth with Pick, Omit, Partial, Readonly and Record.',
      'Parse unknown JSON into validated domain types ("parse, don\'t validate") and report every problem with a path.',
      'Return expected failures as a discriminated Result instead of throwing, and keep exceptions for bugs.',
      'Wrap fetch in a typed function with headers, problem-details errors, timeouts via AbortSignal and safe retries.',
    ],
    introduction:
      'The edges of a frontend — HTTP responses, form input, stored data — are where TypeScript\'s guarantees stop: whatever the server actually sends arrives as unknown bytes, whatever the type annotation claims. This lesson builds the tools for a trustworthy boundary. Generics and derived types keep your models consistent with little code; parsers turn unknown data into trusted types once, at the edge; typed results make every failure visible to the caller; and a small fetch wrapper applies timeouts, authentication and error mapping in one place. Together they are this week\'s assignment: a TypeScript client for your Booking API.',
    keyTerms: [
      { term: 'Generic', meaning: 'A function or type parameterised by a type, like List<T> in C#: function first<T>(xs: T[]): T | undefined.' },
      { term: 'Constraint', meaning: 'A bound on a type parameter (<T extends { id: string }>), like C#\'s where clause.' },
      { term: 'Utility type', meaning: 'A built-in type transformer such as Partial<T>, Pick<T, K>, Omit<T, K>, Readonly<T>, Record<K, V>.' },
      { term: 'Parse, don\'t validate', meaning: 'Convert unknown input into a precise type once, returning either the trusted value or errors.' },
      { term: 'Result type', meaning: 'A union of success and failure ({ ok: true; value } | { ok: false; error }) returned instead of throwing.' },
      { term: 'AbortSignal', meaning: 'The web platform\'s cancellation token — the equivalent of C#\'s CancellationToken.' },
    ],
    sections: [
      {
        title: 'Generics that keep their types',
        paragraphs: [
          'TypeScript generics look and behave much like C#\'s, with one difference that matters: type arguments are almost always inferred from the values you pass, so you rarely write them. Constrain a parameter with extends when your code needs members from it. The goal of a generic helper is to let type information flow through unchanged — groupBy over Booking[] should return Record<string, Booking[]>, not any. A useful habit: write a type-level test (Vitest\'s expectTypeOf, or a @ts-expect-error line) asserting the inferred type, because a helper that silently returns any compiles and passes runtime tests.',
        ],
        code: `function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;
  for (const item of items) (groups[key(item)] ??= []).push(item);
  return groups;
}

const byStatus = groupBy(bookings, (b) => b.status);   // Record<'pending' | 'confirmed' | 'cancelled', Booking[]>

// Type-level test: fails to compile if groupBy ever starts returning any
expectTypeOf(byStatus).toEqualTypeOf<Record<Booking['status'], Booking[]>>();`,
        label: 'Inference does the work; a type test guards it',
      },
      {
        title: 'One source of truth: deriving types from types',
        paragraphs: [
          'Your API has a Booking response, a create request without server-assigned fields, an update request where everything is optional, and a read-only view. Writing four interfaces by hand guarantees they drift apart. Derive them instead: Omit<Booking, \'id\' | \'createdAt\'> for the create request, Partial<…> for a patch, Readonly<…> for state you must not mutate, Pick for a summary row. indexed access (Booking[\'status\']) pulls out a member type, keyof gives the union of property names, and as const plus typeof turns a runtime array into a literal union, so a list of statuses used in a dropdown and the Status type can never disagree.',
        ],
        code: `const STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
type Status = (typeof STATUSES)[number];          // 'pending' | 'confirmed' | 'cancelled'

interface Booking { id: string; guest: string; nights: number; status: Status; createdAt: string }
type NewBooking = Omit<Booking, 'id' | 'createdAt' | 'status'>;
type BookingPatch = Partial<Pick<Booking, 'guest' | 'nights'>>;
type BookingRow = Readonly<Pick<Booking, 'id' | 'guest' | 'status'>>;
type CountByStatus = Record<Status, number>;`,
        label: 'Derived, so they cannot drift',
      },
      {
        title: 'Parse, don\'t validate',
        paragraphs: [
          'response.json() returns Promise<any>, and writing const b: Booking = await response.json() is an unchecked cast: if the server renames a field or returns an error page, the bad data flows deep into your UI before anything breaks, far from the cause. A parser is a function from unknown to a result: it checks every field, converts where needed (an ISO string to a Date, a string to a branded id) and returns either a value of the precise type or a list of problems with their paths (bookings[3].nights: expected a positive integer). Validation that merely returns true or false forces every caller to re-check; parsing does the work once and hands back a type that carries the guarantee.',
          'In production code you will usually describe the shape with a schema library such as Zod, which generates both the parser and the TypeScript type from one definition. Write a few parsers by hand first, as in this week\'s tasks: you will understand exactly what such libraries do, and know where they cannot help — business rules like "check-out after check-in" still belong in your own code.',
        ],
        code: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function parseBooking(input: unknown, path = 'booking'): Result<Booking, string[]> {
  if (typeof input !== 'object' || input === null) return { ok: false, error: [\`\${path}: expected an object\`] };
  const o = input as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof o.id !== 'string' || o.id === '') errors.push(\`\${path}.id: expected a non-empty string\`);
  if (typeof o.nights !== 'number' || !Number.isInteger(o.nights) || o.nights < 1) errors.push(\`\${path}.nights: expected a positive integer\`);
  if (!STATUSES.includes(o.status as Status)) errors.push(\`\${path}.status: expected one of \${STATUSES.join(', ')}\`);
  // ...guest, createdAt...
  return errors.length ? { ok: false, error: errors } : { ok: true, value: o as unknown as Booking };
}`,
        label: 'unknown in, a trusted type (or every problem) out',
      },
      {
        title: 'Errors as values',
        paragraphs: [
          'In C# you threw exceptions for failures and caught them at the edge. TypeScript has exceptions too, but their type is always unknown, nothing in a function signature says what it may throw, and a forgotten try/catch around an await becomes an unhandled rejection. For failures callers are expected to handle — validation problems, 404s, conflicts, the network being down — return a Result: the union forces every caller to check ok before touching value, and a discriminated error type ({ kind: \'not-found\' } | { kind: \'conflict\'; … } | { kind: \'network\' }) lets the UI show the right message for each. Keep throwing for genuine bugs and impossible states.',
        ],
      },
      {
        title: 'A typed fetch wrapper',
        paragraphs: [
          'fetch is deliberately low level: it resolves for every HTTP status (a 500 is not an exception), rejects only for network failures and aborts, has no timeout, and returns untyped JSON. Every application wraps it once. The wrapper sets the base URL and headers (Accept, Content-Type, Authorization: Bearer from an injected token source); applies a timeout with AbortSignal.timeout combined with the caller\'s own signal via AbortSignal.any; maps responses — 2xx through the parser, application/problem+json bodies (RFC 9457, which your ASP.NET Core API already returns) into a typed problem error, and thrown TypeErrors into a network error; and retries only when it is safe — GET requests, or a POST carrying an Idempotency-Key, after a 503 or a network failure, with backoff.',
          'Take fetch, the clock and the sleep function as dependencies, exactly as you injected TimeProvider and HttpClient in C#. Tests can then hand the client a fake fetch that returns scripted responses and assert on the requests it made — no network, no flakiness, and every failure path reachable.',
        ],
        code: `export function createHttp(deps: { baseUrl: string; fetch: typeof fetch; getToken: () => string | null; timeoutMs: number }) {
  return async function request<T>(method: string, path: string, parse: (x: unknown) => Result<T, string[]>, init: { body?: unknown; signal?: AbortSignal } = {}): Promise<Result<T, ApiError>> {
    const headers = new Headers({ Accept: 'application/json' });
    const token = deps.getToken();
    if (token) headers.set('Authorization', \`Bearer \${token}\`);
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    const signals = [AbortSignal.timeout(deps.timeoutMs), ...(init.signal ? [init.signal] : [])];
    let res: Response;
    try {
      res = await deps.fetch(deps.baseUrl + path, { method, headers, body: init.body === undefined ? undefined : JSON.stringify(init.body), signal: AbortSignal.any(signals) });
    } catch (e) {
      return { ok: false, error: { kind: 'network', message: e instanceof Error ? e.message : String(e) } };
    }
    if (!res.ok) return { ok: false, error: await toApiError(res) };   // reads problem+json when present
    const parsed = parse(res.status === 204 ? undefined : await res.json());
    return parsed.ok ? parsed : { ok: false, error: { kind: 'invalid-response', problems: parsed.error } };
  };
}`,
        label: 'The shape of this week\'s client',
      },
    ],
    table: {
      headers: ['Situation', 'Tool', 'Why'],
      rows: [
        ['Helper works for many types', 'Generic with inference', 'Keeps precise types; no any'],
        ['Request/patch/view models', 'Omit, Partial, Pick, Readonly', 'Derived from one source of truth'],
        ['JSON from the server', 'Parser: unknown → Result<T, problems>', 'Types are erased; trust nothing'],
        ['Expected failure (404, 409, offline)', 'Result with a discriminated error', 'Callers must handle it'],
        ['Slow or abandoned request', 'AbortSignal.timeout / AbortSignal.any', 'fetch has no timeout of its own'],
        ['Retrying a POST', 'Only with an Idempotency-Key', 'Otherwise a retry can double-book'],
      ],
    },
    exercise: {
      scenario: 'A teammate\'s client does: const res = await fetch(url); const data: Booking[] = await res.json(); return data;. In production the bookings page sometimes shows "Cannot read properties of undefined (reading \'toUpperCase\')" deep inside a component, and it hangs forever when the API is slow.',
      task: 'Explain both symptoms and outline the fix.',
      answer: 'fetch resolves for error statuses, so a 401 or 500 problem+json body (an object, not an array) is returned as if it were Booking[]; the annotation is an unchecked cast, and the mismatch only explodes later when a component reads a missing field. fetch also has no timeout, so a stalled server leaves the promise pending forever. Fix: check res.ok and map non-2xx responses (problem+json) to a typed ApiError; parse the body as unknown with a parser that returns Result<Booking[], problems>; return Result<Booking[], ApiError> so the page must handle errors; and pass AbortSignal.timeout(ms) (combined with the component\'s own signal via AbortSignal.any) so slow requests fail with a timeout error the UI can show.',
      evidence: 'Status checked, body parsed from unknown, typed errors, timeout signal.',
    },
    misconceptions: [
      'Annotating await res.json() as Booking[] makes it a Booking[]. It is an unchecked cast; parse it.',
      'fetch rejects on HTTP errors. It resolves for every status and rejects only for network failures and aborts.',
      'Any failed request can simply be retried. Retrying a non-idempotent POST can create duplicates unless it carries an idempotency key.',
      'Generics are only for library authors. Small generic helpers keep application types precise.',
      'Validation returning true/false is as good as parsing. Parsing returns a type that carries the guarantee, so nobody re-checks.',
    ],
    sources: [R.generics, R.typesFromTypes, R.utility, R.parseDontValidate, R.zod, R.fetch, R.abort, R.problemDetails, R.expectTypeOf, R.fso9],
    labs: [],
    questions: [
      { prompt: 'Which built-in utility type removes properties from a type, e.g. to build a create request? (one word)', answer: 'Omit', accept: ['omit'] },
      { prompt: 'What is the web platform\'s equivalent of C#\'s CancellationToken? (one word)', answer: 'AbortSignal', accept: ['abortsignal', 'abort signal', 'abortcontroller'] },
    ],
    quiz: [
      { question: 'fetch() returns a response with status 500. What does the promise do?', options: ['Rejects with an HTTP error', 'Resolves; you must check response.ok', 'Retries automatically', 'Throws synchronously'], answer: 1, explanation: 'fetch only rejects on network failure or abort.' },
      { question: 'Which type best represents a create-booking request derived from Booking?', options: ['Partial<Booking>', 'Omit<Booking, \'id\' | \'createdAt\' | \'status\'>', 'Booking & {}', 'Record<string, unknown>'], answer: 1, explanation: 'It removes server-assigned fields but keeps the rest required.' },
      { question: 'When is it safe for a client to retry a POST that may have reached the server?', options: ['Always', 'Never', 'When it carries an idempotency key the server honours', 'Only after a 400'], answer: 2, explanation: 'The key lets the server return the original result instead of repeating the effect.' },
      { question: 'A parser for API data should take…', options: ['any and return any', 'unknown and return a Result of the precise type or the problems', 'Booking and return boolean', 'string and return Booking'], answer: 1, explanation: 'Parse once at the edge into a trusted type.' },
    ],
  },
  {
    id: 'dn4-3',
    slug: 'thinking-in-react',
    title: 'Thinking in React: Components, Props, State and Rendering',
    summary: 'Build user interfaces as functions of data: typed components and props, JSX, state and immutable updates, how and when React re-renders, events, lists and keys, controlled forms, and lifting state to the right owner.',
    minutes: 60,
    prerequisite: 'Week 13 (TypeScript). HTML basics: forms, labels, buttons, lists.',
    outcomes: [
      'Describe a UI as a tree of components whose output is a function of props and state.',
      'Type component props, including children and callbacks, and keep components pure.',
      'Hold state with useState, update it immutably, and explain when React re-renders.',
      'Render lists with stable keys, conditional content, and controlled form inputs.',
      'Decide where state lives by finding the closest common owner, and pass data down and events up.',
    ],
    introduction:
      'In C# you might have built a console menu that printed text, waited for input and printed again. A browser UI is a long-lived document that has to stay in step with changing data, and doing that by hand — find this element, change its text, hide that one — becomes unmanageable fast. React flips the model: you describe what the screen should look like for the current data, and React works out the minimal changes to the real DOM. This lesson covers the mental model and the core API; Full Stack Open parts 1 and 2 and the official "Thinking in React" are the companions to read alongside it.',
    keyTerms: [
      { term: 'Component', meaning: 'A function that takes props and returns JSX describing part of the UI.' },
      { term: 'JSX', meaning: 'HTML-like syntax inside TypeScript (.tsx) that compiles to function calls creating React elements.' },
      { term: 'Props', meaning: 'Read-only inputs a parent passes to a child component.' },
      { term: 'State', meaning: 'Data a component remembers between renders, set with useState; changing it schedules a re-render.' },
      { term: 'Render', meaning: 'React calling your component to get its JSX; then it updates only the DOM that changed.' },
      { term: 'Key', meaning: 'A stable, unique identifier for each item in a list, so React can match items between renders.' },
      { term: 'Controlled input', meaning: 'A form field whose value comes from state and changes only through an onChange handler.' },
    ],
    sections: [
      {
        title: 'UI as a function of data',
        paragraphs: [
          'A React component is a TypeScript function whose name starts with a capital letter. It receives props — an object you type with an interface, like a constructor\'s parameters — and returns JSX. JSX looks like HTML but is TypeScript: attributes are camelCased (className, htmlFor, onClick), any expression goes inside braces, and the compiler type-checks every prop you pass. Components compose: an App renders a BookingList, which renders a BookingRow per booking.',
          'Components must be pure during rendering: given the same props and state they return the same JSX, and they do not change anything outside themselves while doing it — no API calls, no mutating props, no writing to variables declared outside. React may call your component often, twice in development (Strict Mode does this deliberately to expose impurities), or not at all. Side effects belong in event handlers or effects (next lesson).',
        ],
        code: `import type { ReactNode } from 'react';

interface Booking { id: string; guest: string; nights: number; status: 'pending' | 'confirmed' | 'cancelled' }

interface BookingRowProps {
  booking: Booking;
  onSelect: (id: string) => void;   // events flow up through callback props
  children?: ReactNode;             // anything renderable, passed between the tags
}

export function BookingRow({ booking, onSelect, children }: BookingRowProps) {
  const nights = booking.nights === 1 ? '1 night' : booking.nights + ' nights';
  return (
    <li>
      <button type="button" onClick={() => onSelect(booking.id)}>{booking.guest}</button>
      <span> — {nights}</span>
      {booking.status === 'cancelled' && <span className="badge">Cancelled</span>}
      {children}
    </li>
  );
}`,
        label: 'A typed component',
      },
      {
        title: 'State, immutability and re-rendering',
        paragraphs: [
          'useState gives a component memory: const [count, setCount] = useState(0). Calling the setter does not change the variable in the current render; it asks React to render the component again with the new value. That is why you must never mutate state in place — bookings.push(x) changes the array without telling React, and because the array is the same object React may skip the update entirely. Always create new values: [...bookings, x] to add, bookings.filter(b => b.id !== id) to remove, bookings.map(b => b.id === id ? { ...b, status: \'cancelled\' } : b) to update one item. This is the same discipline as C# records with with-expressions.',
          'When the next value depends on the previous one, pass a function: setCount(c => c + 1). React batches state updates in an event handler and renders once afterwards, so reading count right after setCount still gives the old value. A useful rule from the React docs: if a value can be calculated from props or other state, it is not state — compute it during render (the total nights, the filtered list, "is the form valid").',
        ],
        code: `const [bookings, setBookings] = useState<Booking[]>(initial);

function cancelLocally(id: string) {
  // new array, new object for the changed item — the old state is untouched
  setBookings((current) => current.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
}

const active = bookings.filter((b) => b.status !== 'cancelled');   // derived, not state
const totalNights = active.reduce((sum, b) => sum + b.nights, 0);`,
        label: 'Update immutably; derive what you can',
      },
      {
        title: 'Lists, keys and conditional rendering',
        paragraphs: [
          'Render a list by mapping data to elements: bookings.map(b => <BookingRow key={b.id} booking={b} … />). The key tells React which item is which between renders. Use the item\'s stable id; never the array index when items can be inserted, removed or reordered, because React would then reuse the wrong row\'s DOM and state (an input\'s typed text jumping to a different booking is the classic symptom). React warns in the console when keys are missing — treat that warning as a bug.',
          'Conditional content uses ordinary expressions: cond && <X/> for "show or nothing", cond ? <A/> : <B/> for alternatives, or an early return. Every list screen needs an explicit empty state ("No bookings yet") — an empty <ul> is not a message.',
        ],
      },
      {
        title: 'Forms: controlled inputs, labels and submission',
        paragraphs: [
          'A controlled input takes its value from state and reports changes through onChange; the state is the single source of truth, so you can validate, transform or reset it at will. Number inputs still give you strings (e.target.value), so convert explicitly. Handle the form\'s onSubmit (not the button\'s onClick) so pressing Enter works, and call event.preventDefault() or the browser will reload the page.',
          'Accessibility starts here, not in a later audit: every input needs a <label htmlFor> matching its id (a placeholder is not a label), buttons are <button type="button"> or type="submit" — never a clickable div — and validation messages are linked to their field with aria-describedby and flagged with aria-invalid. Testing Library\'s queries reward exactly this: getByRole(\'button\', { name: \'Create booking\' }) and getByLabelText(\'Guest name\') only find elements a screen-reader user could find.',
        ],
        code: `export function GuestForm({ onSubmit }: { onSubmit: (guest: string) => void }) {
  const [guest, setGuest] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();                       // no full-page reload
    if (guest.trim() === '') { setError('Enter the guest\\'s name'); return; }
    onSubmit(guest.trim());
    setGuest('');
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="guest">Guest name</label>
      <input id="guest" value={guest} onChange={(e) => setGuest(e.target.value)}
             aria-invalid={error ? true : undefined} aria-describedby={error ? 'guest-error' : undefined} />
      {error && <p id="guest-error">{error}</p>}
      <button type="submit">Add guest</button>
    </form>
  );
}`,
        label: 'A controlled, labelled form',
      },
      {
        title: 'Where should state live?',
        paragraphs: [
          'The "Thinking in React" method: sketch the UI, split it into components, build a static version from props, identify the minimal state, then decide which component owns each piece. A piece of state belongs to the closest common parent of every component that reads it. If the list and the "3 bookings selected" counter both need the selection, it lives in their parent, which passes the data down as props and a callback down so children can request changes — data flows down, events flow up. Lifting state too high causes needless re-renders and prop chains; keeping it too low duplicates it. When the chain becomes long, later lessons introduce context and reducers.',
        ],
      },
    ],
    table: {
      headers: ['Need', 'React tool', 'Common mistake'],
      rows: [
        ['Pass data to a child', 'Props (typed with an interface)', 'Mutating props in the child'],
        ['Remember a value between renders', 'useState', 'Mutating state in place (push, assignment)'],
        ['Value computable from others', 'Compute during render', 'Copying it into extra state'],
        ['Render a collection', 'array.map with key={item.id}', 'Index keys on lists that change'],
        ['Form input', 'Controlled value + onChange', 'Placeholder used instead of a label'],
        ['Two siblings share data', 'Lift state to the common parent', 'Keeping two copies in sync'],
      ],
    },
    exercise: {
      scenario: 'A booking list renders rows with key={index} and stores a "notes" text box inside each row. Deleting the first booking makes its notes appear in the next booking\'s box. A total at the top ("7 nights booked") is kept in its own useState and updated in every handler — and is sometimes wrong.',
      task: 'Explain both bugs and fix them.',
      answer: 'With index keys, removing item 0 makes React match the old row 0 (with its local notes state and DOM) to the new item 0, which is a different booking — state follows the position, not the booking. Use key={booking.id}. The total duplicates information derivable from the bookings array, so any handler that forgets to update it leaves it stale; delete that state and compute bookings.reduce((n, b) => n + b.nights, 0) during render.',
      evidence: 'Stable id keys; derived values computed, not stored.',
    },
    misconceptions: [
      'setState changes the variable immediately. It schedules a new render; the current render keeps the old value.',
      'Mutating an array in state and then calling setState with it is fine. Same reference — React may skip the update; always create new arrays and objects.',
      'Array indexes make fine keys. Only for static lists that never reorder, insert or delete.',
      'Placeholders are enough labels. They disappear while typing and are not reliable accessible names.',
      'Every changing value needs its own state. Derived values should be computed during render.',
    ],
    sources: [R.thinking, R.state, R.lists, R.sharing, R.reactTs, R.react, R.fso1, R.fso2, R.rtlQueries],
    labs: [],
    questions: [
      { prompt: 'Which prop must every item in a rendered list have, so React can match it between renders? (one word)', answer: 'key', accept: ['keys'] },
      { prompt: 'Which hook gives a component a value that survives re-renders? (one word)', answer: 'useState', accept: ['usestate', 'use state'] },
    ],
    quiz: [
      { question: 'What happens when you call setGuests(newArray)?', options: ['The variable changes immediately', 'React schedules a re-render with the new value', 'The DOM is rebuilt from scratch', 'Nothing until you call render()'], answer: 1, explanation: 'State setters request a new render.' },
      { question: 'Which update is correct for adding a booking to state?', options: ['bookings.push(b); setBookings(bookings)', 'setBookings([...bookings, b])', 'bookings[bookings.length] = b', 'setBookings(bookings.concat)'], answer: 1, explanation: 'Create a new array; never mutate state.' },
      { question: 'Two sibling components both need the selected booking id. Where should the state live?', options: ['In each sibling', 'In a global variable', 'In their closest common parent', 'In localStorage'], answer: 2, explanation: 'Lift state to the closest common owner.' },
      { question: 'Why handle onSubmit on the form rather than onClick on the button?', options: ['It is faster', 'Enter-to-submit and native semantics work', 'Buttons cannot have handlers', 'React requires it'], answer: 1, explanation: 'The form submit event covers every way of submitting.' },
    ],
  },
  {
    id: 'dn4-4',
    slug: 'react-effects-and-server-data',
    title: 'Talking to the Server: Effects, Loading States and Custom Hooks',
    summary: 'Load server data correctly: what effects are for, dependency arrays, cleanup and race conditions, modelling loading, empty, error and success states, moving logic into custom hooks, and setting up a Vite + TypeScript project against your ASP.NET Core API.',
    minutes: 60,
    prerequisite: 'Thinking in React. Week 13\'s typed client.',
    outcomes: [
      'Use useEffect only to synchronise with external systems, and recognise effects that should be render-time calculations or event handlers.',
      'Fetch data in an effect with correct dependencies and cleanup, so stale responses can never overwrite fresh ones.',
      'Model remote data as a discriminated union and render loading, empty, error and success states explicitly.',
      'Extract data-loading logic into a typed custom hook that takes its API client as a dependency.',
      'Create a Vite React-TypeScript project, configure the API URL, and allow it through CORS in ASP.NET Core.',
    ],
    introduction:
      'A bookings screen has to fetch data, show something useful while it waits, cope when the request fails, and never show the answer to a question the user is no longer asking. React\'s tool for keeping a component in step with something outside it — a server, a timer, a browser API — is the effect. Effects are also the most misused part of React: many bugs and much slowness come from effects that should not exist. This lesson teaches the narrow, correct use of effects for data loading, and the patterns — explicit remote-data states and custom hooks — that make the next two weeks\' features straightforward.',
    keyTerms: [
      { term: 'Effect', meaning: 'Code React runs after rendering, to synchronise a component with an external system (useEffect).' },
      { term: 'Dependency array', meaning: 'The values an effect reads; React re-runs the effect when any of them changes.' },
      { term: 'Cleanup', meaning: 'A function returned from an effect, run before the effect re-runs and on unmount.' },
      { term: 'Race condition', meaning: 'An older, slower response arriving after a newer one and overwriting it.' },
      { term: 'Custom hook', meaning: 'A function starting with "use" that packages stateful logic for reuse across components.' },
      { term: 'CORS', meaning: 'The browser rule that a page may only call another origin\'s API if that API allows it.' },
    ],
    sections: [
      {
        title: 'What effects are for — and what they are not for',
        paragraphs: [
          'useEffect(fn, deps) runs fn after React has updated the screen, and again whenever a value in deps has changed since the last render. Its job is synchronisation: "while this component shows bookings for filter F, it should be subscribed to the server\'s data for F". Connecting to a chat room, starting a timer, and fetching data a screen needs are all effects.',
          'Most other things are not. Values computed from props or state belong in the render (or in useMemo if measurably expensive). Things that happen because the user did something — submitting a form, clicking Cancel — belong in that event\'s handler, not in an effect watching some flag. The React team\'s guide "You might not need an effect" is required reading; a good review question for every effect is "what external system does this synchronise with?". In development, Strict Mode deliberately runs each effect, its cleanup and the effect again, to surface effects that are not cleaned up properly.',
        ],
      },
      {
        title: 'Fetching in an effect, without races',
        paragraphs: [
          'Type the filter quickly — "a", "am", "ama" — and three requests start. Nothing guarantees they finish in order; if the response for "a" arrives last, a naive effect shows "a" results while the box says "ama". The cleanup function fixes this: when the dependencies change (or the component unmounts) React runs the previous effect\'s cleanup, which aborts its request through an AbortController and marks it stale, so its response is ignored even if it arrives. Every value the effect reads — the filter, the client — goes in the dependency array; the linter rule react-hooks/exhaustive-deps catches omissions.',
          'Note what happens on success and failure: the effect sets one state value from a discriminated union, so "loading and error at the same time" is unrepresentable — the same technique as Week 13\'s ApiError.',
        ],
        code: `type Remote<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

const [state, setState] = useState<Remote<Booking[]>>({ status: 'loading' });

useEffect(() => {
  const controller = new AbortController();
  setState({ status: 'loading' });
  client.list({ guest: search }, controller.signal).then((result) => {
    if (controller.signal.aborted) return;                 // a newer request owns the screen
    setState(result.ok ? { status: 'success', data: result.value }
                       : { status: 'error', message: messageFor(result.error) });
  });
  return () => controller.abort();                        // runs before the next effect and on unmount
}, [client, search]);`,
        label: 'Abort on cleanup; ignore stale answers',
      },
      {
        title: 'Four states, every time',
        paragraphs: [
          'Every screen that loads data has at least four states, and each needs a deliberate design. Loading: show a placeholder or "Loading bookings…" in an element with role="status" so screen readers announce it. Error: say what failed in human terms and offer a way out — a Retry button that re-runs the request. Empty: a successful but empty result is a message and usually a call to action ("No bookings yet — create the first one"), not a blank table. Success: the data. Reviewers check for all four; so do this month\'s tests.',
          'A Retry button needs to re-run the effect. Add a counter to state (const [attempt, setAttempt] = useState(0)), include it in the dependency array, and increment it from the button\'s handler — the effect is still the only place that fetches.',
        ],
      },
      {
        title: 'Custom hooks: logic you can reuse and test',
        paragraphs: [
          'Once a component holds an effect, a remote-data state and a retry counter, extract them into a custom hook: function useBookings(client, filter) returns the state and a reload function. Hooks are ordinary functions that call other hooks; their names must start with use, and like all hooks they must be called unconditionally at the top level of a component (never inside if, loops or callbacks), because React identifies hook state by call order.',
          'Pass the API client into the hook (or provide it through context, Week 15) instead of importing a global — exactly the dependency injection you practised in C#. In tests you hand the component a fake client whose list method returns whatever the scenario needs, including promises you resolve by hand to reproduce races. Server-state libraries such as TanStack Query generalise this hook with caching, deduplication and background refresh; learn the hand-written version first so you know what they do for you.',
        ],
        code: `export function useBookings(client: BookingsClient, filter: BookingFilter) {
  const [state, setState] = useState<Remote<Booking[]>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const { status, guest } = filter;                       // primitives keep the deps stable

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    void client.list({ status, guest }, controller.signal).then((r) => {
      if (!controller.signal.aborted) setState(r.ok ? { status: 'success', data: r.value } : { status: 'error', message: messageFor(r.error) });
    });
    return () => controller.abort();
  }, [client, status, guest, attempt]);

  return { state, reload: () => setAttempt((n) => n + 1) };
}`,
        label: 'A data hook with retry',
      },
      {
        title: 'A real project: Vite, environment variables and CORS',
        paragraphs: [
          'Create the app with npm create vite@latest booking-client -- --template react-ts. Vite serves it on http://localhost:5173 with instant reloads and builds static files for production. Configuration that differs per environment, such as the API address, goes in .env files as VITE_API_URL=https://localhost:7001 and is read with import.meta.env.VITE_API_URL — remember that everything in a frontend bundle is public, so never put secrets there.',
          'The browser will block calls from localhost:5173 to your API on another port unless the API opts in. In ASP.NET Core, add a named CORS policy with builder.Services.AddCors(o => o.AddPolicy("frontend", p => p.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod().WithExposedHeaders("ETag", "Location"))) and app.UseCors("frontend"). Exposing ETag and Location matters: without it, JavaScript cannot read those headers even though they arrive.',
        ],
      },
    ],
    table: {
      headers: ['Situation', 'Right tool', 'Wrong tool'],
      rows: [
        ['Show data from the server', 'Effect with cleanup (or a data library)', 'Fetching during render'],
        ['Filtered list from props', 'Compute in render / useMemo', 'Effect that copies into state'],
        ['User clicked Cancel', 'Event handler calls the API', 'Effect watching a "cancelRequested" flag'],
        ['Responses may arrive out of order', 'AbortController in cleanup', 'Hoping they arrive in order'],
        ['Loading/error/data', 'One discriminated-union state', 'Three independent booleans'],
        ['Same loading logic in two screens', 'Custom hook taking the client', 'Copy-pasted effects'],
      ],
    },
    exercise: {
      scenario: 'A search page has useEffect(() => { fetch(\'/api/bookings?guest=\' + search).then(r => r.json()).then(setBookings) }, []). Users report the list never updates when they type, and when they fix the dependency array, results sometimes belong to an older search; the console also shows "Can\'t perform a React state update on an unmounted component"-style issues after navigating away.',
      task: 'List the problems and write the corrected effect.',
      answer: 'The empty dependency array means the effect runs once, so new search text never triggers a fetch — search must be a dependency. With it fixed, overlapping requests can resolve out of order, and responses can arrive after unmount; both are solved by a cleanup that aborts the request and ignores its result. The code also ignores HTTP errors and has no loading or error state. Corrected: useEffect(() => { const c = new AbortController(); setState({ status: \'loading\' }); client.list({ guest: search }, c.signal).then(r => { if (!c.signal.aborted) setState(r.ok ? { status: \'success\', data: r.value } : { status: \'error\', message: messageFor(r.error) }); }); return () => c.abort(); }, [client, search]); with the component rendering loading, error (with Retry), empty and success states.',
      evidence: 'Complete dependencies, abort in cleanup, explicit remote-data states.',
    },
    misconceptions: [
      'useEffect is where component logic goes. Effects are for synchronising with external systems only.',
      'An empty dependency array is a safe default. It freezes the effect on the first render\'s values.',
      'Responses come back in the order requests were sent. They can arrive in any order; cancel or ignore stale ones.',
      'Strict Mode running effects twice is a bug to work around. It reveals effects without proper cleanup.',
      'An empty array of results needs no special UI. Empty is its own state with its own message.',
    ],
    sources: [R.effects, R.noEffect, R.customHooks, R.abort, R.fso2, R.vite, R.react],
    labs: [],
    questions: [
      { prompt: 'What does an effect return to undo itself before it re-runs or the component unmounts? (one word)', answer: 'cleanup', accept: ['a cleanup', 'cleanup function', 'a cleanup function'] },
      { prompt: 'Custom hook names must start with which three letters? (one word)', answer: 'use' },
    ],
    quiz: [
      { question: 'Which of these belongs in an effect?', options: ['Filtering a list by a search string', 'Fetching the bookings the screen displays', 'Calling the API when Save is clicked', 'Formatting a date for display'], answer: 1, explanation: 'Synchronising with the server for what is displayed is an effect; the others are render calculations or event handling.' },
      { question: 'How do you stop an older, slower response overwriting a newer one?', options: ['Add a setTimeout', 'Abort it or mark it stale in the effect cleanup', 'Use an empty dependency array', 'Call setState twice'], answer: 1, explanation: 'Cleanup runs before the next effect, so the old request is cancelled or ignored.' },
      { question: 'Which state model is best for remote data?', options: ['isLoading, isError and data as three useState calls', 'One discriminated union: loading | error | success', 'A global variable', 'Only data, with null meaning loading'], answer: 1, explanation: 'Impossible combinations become unrepresentable.' },
      { question: 'Your Vite app cannot read the ETag header from your API even though the network tab shows it. Why?', options: ['ETags are not supported by fetch', 'The API\'s CORS policy does not expose the header', 'Vite strips headers', 'ETags only work with GET'], answer: 1, explanation: 'Cross-origin responses only expose safelisted headers unless the server lists others.' },
    ],
  },
];
