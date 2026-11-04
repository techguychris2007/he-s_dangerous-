import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Week 13 Assignment: TypeScript Client

Your Month 2 Booking API is finished. Now write the **typed client** every frontend screen will use to talk to it —
the one module that knows about URLs, headers, status codes and JSON, so React components never have to.

## The API contract

| Request | Success | Failures |
| --- | --- | --- |
| \`GET /api/bookings?status=&guest=\` | 200, array of bookings | 401 |
| \`GET /api/bookings/{id}\` | 200, booking + \`ETag\` header | 401, 404 |
| \`POST /api/bookings\` with \`Idempotency-Key\` | 201, booking + \`Location\` | 400 validation problem, 401 |
| \`POST /api/bookings/{id}/cancel\` with \`If-Match: <etag>\` and \`{ "reason": "…" }\` | 200, booking | 401, 404, 412 stale ETag |

Bookings are JSON: \`{ id, guest, nights, checkIn: "YYYY-MM-DD", status, notes }\`. Errors are RFC 9457 problem
details (\`application/problem+json\`); validation problems carry \`errors: { "Guest": ["…"], "Nights": ["…"] }\`.

## What to build

1. **\`types.ts\`** — \`BookingStatus\`, \`Booking\` (\`checkIn\` is a \`Date\`), \`NewBooking\` *derived from* \`Booking\`
   (no \`id\` or \`status\`; \`notes\` optional), \`BookingFilter\`, and \`ApiError\`, exactly this union:
   \`network {message}\` · \`timeout\` · \`aborted\` · \`unauthorized\` · \`not-found\` · \`conflict {detail}\` ·
   \`validation {fieldErrors: Record<string, string[]>}\` · \`server {status, title}\` · \`invalid-response {problems: string[]}\`.
2. **\`http.ts\`** — \`createHttp(options)\` returns one generic \`request<T>(options)\` function that:
   - builds \`baseUrl + path\` plus a query string, skipping \`undefined\` values (a trailing \`/\` on \`baseUrl\` is ignored);
   - sends \`Accept: application/json\`, \`Authorization: Bearer <token>\` when \`getToken()\` returns one, JSON bodies with
     \`Content-Type: application/json\`, the \`Idempotency-Key\` when given, and any extra headers;
   - parses 2xx bodies with the caller's \`parse\` function (204 or an empty body parse \`undefined\`; malformed JSON or a failed
     parse → \`invalid-response\`) and resolves \`{ data, status, headers }\`;
   - maps failures: 401 → \`unauthorized\`; 404 → \`not-found\`; 409 or 412 → \`conflict\` with the problem's \`detail\` (else its
     \`title\`); 400/422 with \`errors\` → \`validation\` with **camelCased** field names (\`Guest\` → \`guest\`); anything else →
     \`server\` with the problem's \`title\`, else the status text;
   - aborts after \`timeoutMs\` (default 10 000) → \`timeout\`; the caller's own \`signal\` → \`aborted\`; a thrown fetch → \`network\`;
   - **retries only safe requests** — \`GET\`, or any request with an \`idempotencyKey\` — after a network error, a timeout, or
     a 429/502/503/504, up to \`retries\` extra attempts (default 2). Wait with the injected \`sleep\`: the \`Retry-After\` header
     in seconds when present, otherwise 200 ms, then 400 ms, … (doubling). Never retry an aborted request or any other 4xx.
3. **\`bookingsClient.ts\`** — \`createBookingsClient(http)\` with \`list(filter?, signal?)\`, \`get(id, signal?)\` (returns the
   booking and its \`etag\`; a missing ETag is an \`invalid-response\`), \`create(newBooking, idempotencyKey)\` (sends
   \`checkIn\` as \`"YYYY-MM-DD"\` and \`notes\` as \`null\` when absent) and \`cancel(id, reason, etag)\`. Encode ids in paths.

\`parse.ts\` (your parser from task ts-4-04) and \`fakeApi.ts\` (an in-memory API for **Run**) are given.
Nothing may throw for an expected failure: every method resolves a \`Result\`.

## Run it locally (recommended)

\`\`\`bash
npm create vite@latest booking-client -- --template react-ts
cd booking-client && npm install && npm install -D vitest
# copy src/*.ts in, write your tests as src/*.test.ts, then:
npx tsc --noEmit && npx vitest
\`\`\`

Point \`baseUrl\` at your Month 2 API (enable CORS for the Vite dev origin) and try every failure for real.
`;

const TYPES_STARTER = `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  guest: string;
  nights: number;
  checkIn: Date;
  status: BookingStatus;
  notes: string | null;
}

// TODO: derive from Booking — no id or status, notes optional.
export type NewBooking = Partial<Booking>;

export interface BookingFilter {
  status?: BookingStatus;
  guest?: string;
}

// TODO: replace with the exact discriminated union in the README.
export type ApiError = { kind: string; [key: string]: unknown };
`;

const TYPES_SOLUTION = `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  guest: string;
  nights: number;
  checkIn: Date;
  status: BookingStatus;
  notes: string | null;
}

export type NewBooking = Omit<Booking, 'id' | 'status' | 'notes'> & { notes?: string | null };

export interface BookingFilter {
  status?: BookingStatus;
  guest?: string;
}

export type ApiError =
  | { kind: 'network'; message: string }
  | { kind: 'timeout' }
  | { kind: 'aborted' }
  | { kind: 'unauthorized' }
  | { kind: 'not-found' }
  | { kind: 'conflict'; detail: string }
  | { kind: 'validation'; fieldErrors: Record<string, string[]> }
  | { kind: 'server'; status: number; title: string }
  | { kind: 'invalid-response'; problems: string[] };
`;

const PARSE = `// Given: the parser from task ts-4-04, adapted to this project's types.
import type { Booking, BookingStatus, Result } from './types';

const STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
const isStatus = (s: unknown): s is BookingStatus => typeof s === 'string' && (STATUSES as readonly string[]).includes(s);

function parseDate(s: unknown): Date | null {
  if (typeof s !== 'string') return null;
  const m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}

export function parseBooking(input: unknown, path = 'booking'): Result<Booking, string[]> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, error: [path + ': expected an object'] };
  const o = input as Record<string, unknown>;
  const errors: string[] = [];
  const id = o.id;
  if (typeof id !== 'string' || id === '') errors.push(path + '.id: expected a non-empty string');
  const guest = typeof o.guest === 'string' ? o.guest.trim() : '';
  if (guest === '') errors.push(path + '.guest: expected a non-empty string');
  const nights = o.nights;
  if (typeof nights !== 'number' || !Number.isInteger(nights) || nights < 1 || nights > 30) errors.push(path + '.nights: expected an integer from 1 to 30');
  const checkIn = parseDate(o.checkIn);
  if (checkIn === null) errors.push(path + '.checkIn: expected a real date as YYYY-MM-DD');
  const status = o.status;
  if (!isStatus(status)) errors.push(path + '.status: expected one of ' + STATUSES.join(', '));
  const notes = o.notes === undefined ? null : o.notes;
  if (notes !== null && typeof notes !== 'string') errors.push(path + '.notes: expected a string or null');
  if (errors.length > 0 || typeof id !== 'string' || typeof nights !== 'number' || checkIn === null || !isStatus(status) || (notes !== null && typeof notes !== 'string')) {
    return { ok: false, error: errors };
  }
  return { ok: true, value: { id, guest, nights, checkIn, status, notes } };
}

export function parseBookingList(input: unknown): Result<Booking[], string[]> {
  if (!Array.isArray(input)) return { ok: false, error: ['bookings: expected an array'] };
  const values: Booking[] = [];
  const errors: string[] = [];
  input.forEach((item: unknown, i) => {
    const r = parseBooking(item, 'bookings[' + i + ']');
    if (r.ok) values.push(r.value);
    else errors.push(...r.error);
  });
  return errors.length ? { ok: false, error: errors } : { ok: true, value: values };
}
`;

const HTTP_STARTER = `import type { ApiError, Result } from './types';

export interface HttpOptions {
  baseUrl: string;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  getToken: () => string | null;
  timeoutMs?: number;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<T> {
  method: Method;
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  parse: (json: unknown) => Result<T, string[]>;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export type Http = <T>(options: RequestOptions<T>) => Promise<Result<HttpResponse<T>, ApiError>>;

export function createHttp(options: HttpOptions): Http {
  // TODO: build the request, apply the timeout, map responses to Results, retry safe requests.
  return async () => ({ ok: false, error: { kind: 'network', message: 'TODO: implement createHttp' } });
}
`;

const HTTP_SOLUTION = `import type { ApiError, Result } from './types';

export interface HttpOptions {
  baseUrl: string;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  getToken: () => string | null;
  timeoutMs?: number;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<T> {
  method: Method;
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  parse: (json: unknown) => Result<T, string[]>;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export type Http = <T>(options: RequestOptions<T>) => Promise<Result<HttpResponse<T>, ApiError>>;

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function buildUrl(baseUrl: string, path: string, query: Record<string, string | number | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const qs = params.toString();
  return baseUrl.replace(/\\/+$/, '') + path + (qs ? '?' + qs : '');
}

const camelCase = (key: string) => key.charAt(0).toLowerCase() + key.slice(1);

function isFieldErrors(x: unknown): x is Record<string, string[]> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
    && Object.values(x).every((v) => Array.isArray(v) && v.every((m) => typeof m === 'string'));
}

interface Problem { title?: string; detail?: string; errors?: Record<string, string[]> }

async function readProblem(res: Response): Promise<Problem> {
  try {
    const body: unknown = await res.json();
    if (typeof body !== 'object' || body === null) return {};
    const o = body as Record<string, unknown>;
    return {
      title: typeof o.title === 'string' ? o.title : undefined,
      detail: typeof o.detail === 'string' ? o.detail : undefined,
      errors: isFieldErrors(o.errors) ? o.errors : undefined,
    };
  } catch {
    return {};
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const problem = await readProblem(res);
  if (res.status === 401) return { kind: 'unauthorized' };
  if (res.status === 404) return { kind: 'not-found' };
  if (res.status === 409 || res.status === 412) return { kind: 'conflict', detail: problem.detail ?? problem.title ?? 'The resource was changed by someone else.' };
  if ((res.status === 400 || res.status === 422) && problem.errors) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, messages] of Object.entries(problem.errors)) fieldErrors[camelCase(key)] = messages;
    return { kind: 'validation', fieldErrors };
  }
  return { kind: 'server', status: res.status, title: problem.title ?? (res.statusText || 'HTTP ' + res.status) };
}

async function readBody<T>(res: Response, parse: (json: unknown) => Result<T, string[]>): Promise<Result<HttpResponse<T>, ApiError>> {
  let json: unknown = undefined;
  if (res.status !== 204) {
    const text = await res.text();
    if (text !== '') {
      try {
        json = JSON.parse(text);
      } catch {
        return { ok: false, error: { kind: 'invalid-response', problems: ['body: not valid JSON'] } };
      }
    }
  }
  const parsed = parse(json);
  if (!parsed.ok) return { ok: false, error: { kind: 'invalid-response', problems: parsed.error } };
  return { ok: true, value: { data: parsed.value, status: res.status, headers: res.headers } };
}

type Attempt = { kind: 'response'; response: Response } | { kind: 'failed'; error: ApiError };

export function createHttp(options: HttpOptions): Http {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const sleep = options.sleep ?? defaultSleep;

  async function attempt(url: string, req: RequestOptions<unknown>): Promise<Attempt> {
    const headers = new Headers({ Accept: 'application/json' });
    const token = options.getToken();
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (req.body !== undefined) headers.set('Content-Type', 'application/json');
    if (req.idempotencyKey !== undefined) headers.set('Idempotency-Key', req.idempotencyKey);
    for (const [name, value] of Object.entries(req.headers ?? {})) headers.set(name, value);

    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = req.signal ? AbortSignal.any([timeout, req.signal]) : timeout;
    try {
      const response = await options.fetch(url, {
        method: req.method,
        headers,
        body: req.body === undefined ? undefined : JSON.stringify(req.body),
        signal,
      });
      return { kind: 'response', response };
    } catch (e) {
      if (req.signal?.aborted) return { kind: 'failed', error: { kind: 'aborted' } };
      if (timeout.aborted) return { kind: 'failed', error: { kind: 'timeout' } };
      return { kind: 'failed', error: { kind: 'network', message: e instanceof Error ? e.message : String(e) } };
    }
  }

  const backoff = (n: number) => 200 * 2 ** (n - 1);

  return async function request<T>(req: RequestOptions<T>): Promise<Result<HttpResponse<T>, ApiError>> {
    const url = buildUrl(options.baseUrl, req.path, req.query);
    const safe = req.method === 'GET' || req.idempotencyKey !== undefined;
    const attempts = safe ? retries + 1 : 1;
    let lastError: ApiError = { kind: 'network', message: 'No request was made' };

    for (let n = 1; n <= attempts; n++) {
      const outcome = await attempt(url, req);
      if (outcome.kind === 'response') {
        const res = outcome.response;
        if (res.ok) return readBody(res, req.parse);
        lastError = await toApiError(res);
        if (!RETRYABLE_STATUS.has(res.status) || n === attempts) return { ok: false, error: lastError };
        const retryAfter = Number(res.headers.get('Retry-After'));
        await sleep(res.headers.has('Retry-After') && Number.isFinite(retryAfter) ? retryAfter * 1000 : backoff(n));
      } else {
        lastError = outcome.error;
        if (lastError.kind === 'aborted' || n === attempts) return { ok: false, error: lastError };
        await sleep(backoff(n));
      }
    }
    return { ok: false, error: lastError };
  };
}
`;

const CLIENT_STARTER = `import type { Http } from './http';
import type { ApiError, Booking, BookingFilter, NewBooking, Result } from './types';
import { parseBooking, parseBookingList } from './parse';

export interface BookingsClient {
  list(filter?: BookingFilter, signal?: AbortSignal): Promise<Result<Booking[], ApiError>>;
  get(id: string, signal?: AbortSignal): Promise<Result<{ booking: Booking; etag: string }, ApiError>>;
  create(input: NewBooking, idempotencyKey: string): Promise<Result<Booking, ApiError>>;
  cancel(id: string, reason: string, etag: string): Promise<Result<Booking, ApiError>>;
}

const todo = { ok: false as const, error: { kind: 'network', message: 'TODO' } };

export function createBookingsClient(http: Http): BookingsClient {
  void http; void parseBooking; void parseBookingList;
  return {
    async list() { return todo; },
    async get() { return todo; },
    async create() { return todo; },
    async cancel() { return todo; },
  };
}
`;

const CLIENT_SOLUTION = `import type { Http } from './http';
import type { ApiError, Booking, BookingFilter, NewBooking, Result } from './types';
import { parseBooking, parseBookingList } from './parse';

export interface BookingsClient {
  list(filter?: BookingFilter, signal?: AbortSignal): Promise<Result<Booking[], ApiError>>;
  get(id: string, signal?: AbortSignal): Promise<Result<{ booking: Booking; etag: string }, ApiError>>;
  create(input: NewBooking, idempotencyKey: string): Promise<Result<Booking, ApiError>>;
  cancel(id: string, reason: string, etag: string): Promise<Result<Booking, ApiError>>;
}

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
const one = (json: unknown) => parseBooking(json);
const bookingPath = (id: string) => '/api/bookings/' + encodeURIComponent(id);

export function createBookingsClient(http: Http): BookingsClient {
  return {
    async list(filter = {}, signal) {
      const r = await http({ method: 'GET', path: '/api/bookings', query: { status: filter.status, guest: filter.guest }, signal, parse: parseBookingList });
      return r.ok ? { ok: true, value: r.value.data } : r;
    },
    async get(id, signal) {
      const r = await http({ method: 'GET', path: bookingPath(id), signal, parse: one });
      if (!r.ok) return r;
      const etag = r.value.headers.get('ETag');
      if (etag === null) return { ok: false, error: { kind: 'invalid-response', problems: ['ETag header missing'] } };
      return { ok: true, value: { booking: r.value.data, etag } };
    },
    async create(input, idempotencyKey) {
      const body = { guest: input.guest, nights: input.nights, checkIn: toIsoDate(input.checkIn), notes: input.notes ?? null };
      const r = await http({ method: 'POST', path: '/api/bookings', body, idempotencyKey, parse: one });
      return r.ok ? { ok: true, value: r.value.data } : r;
    },
    async cancel(id, reason, etag) {
      const r = await http({ method: 'POST', path: bookingPath(id) + '/cancel', body: { reason }, headers: { 'If-Match': etag }, parse: one });
      return r.ok ? { ok: true, value: r.value.data } : r;
    },
  };
}
`;

const FAKE_API = `// Given: an in-memory stand-in for your Month 2 Booking API, used by main.ts when you press Run.
type Status = 'pending' | 'confirmed' | 'cancelled';
interface Row { id: string; guest: string; nights: number; checkIn: string; status: Status; notes: string | null; version: number }

export function createFakeApi(token = 'demo-token') {
  const rows = new Map<string, Row>();
  const seed: Row[] = [
    { id: 'bk-1', guest: 'Ama Owusu', nights: 3, checkIn: '2026-12-20', status: 'confirmed', notes: null, version: 1 },
    { id: 'bk-2', guest: 'Kofi Boateng', nights: 1, checkIn: '2026-12-22', status: 'pending', notes: 'Late arrival', version: 1 },
    { id: 'bk-3', guest: 'Esi Mensah', nights: 5, checkIn: '2026-12-24', status: 'confirmed', notes: null, version: 1 },
  ];
  for (const row of seed) rows.set(row.id, row);
  const byKey = new Map<string, Row>();
  let nextId = 4;

  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
  const problem = (status: number, title: string, extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ type: 'about:blank', title, status, ...extra }), { status, headers: { 'Content-Type': 'application/problem+json' } });
  const etag = (row: Row) => 'W/"' + row.version + '"';
  const view = (row: Row) => ({ id: row.id, guest: row.guest, nights: row.nights, checkIn: row.checkIn, status: row.status, notes: row.notes });

  async function fetch(input: string, init: RequestInit = {}): Promise<Response> {
    const url = new URL(input);
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    if (headers.get('Authorization') !== 'Bearer ' + token) return problem(401, 'Unauthorized');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'api' || parts[1] !== 'bookings') return problem(404, 'Not Found');
    const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};

    if (parts.length === 2 && method === 'GET') {
      const status = url.searchParams.get('status');
      const guest = (url.searchParams.get('guest') ?? '').toLowerCase();
      return json(200, [...rows.values()].filter((r) => (!status || r.status === status) && r.guest.toLowerCase().includes(guest)).map(view));
    }
    if (parts.length === 2 && method === 'POST') {
      const key = headers.get('Idempotency-Key');
      const earlier = key ? byKey.get(key) : undefined;
      if (earlier) return json(201, view(earlier), { Location: '/api/bookings/' + earlier.id, ETag: etag(earlier) });
      const errors: Record<string, string[]> = {};
      if (typeof body.guest !== 'string' || body.guest.trim() === '') errors.Guest = ['The Guest field is required.'];
      if (typeof body.nights !== 'number' || body.nights < 1 || body.nights > 30) errors.Nights = ['Nights must be between 1 and 30.'];
      if (typeof body.checkIn !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(body.checkIn)) errors.CheckIn = ['CheckIn must be a date.'];
      if (Object.keys(errors).length) return problem(400, 'One or more validation errors occurred.', { errors });
      const row: Row = { id: 'bk-' + nextId++, guest: String(body.guest).trim(), nights: Number(body.nights), checkIn: String(body.checkIn), status: 'pending', notes: typeof body.notes === 'string' ? body.notes : null, version: 1 };
      rows.set(row.id, row);
      if (key) byKey.set(key, row);
      return json(201, view(row), { Location: '/api/bookings/' + row.id, ETag: etag(row) });
    }
    const row = rows.get(decodeURIComponent(parts[2] ?? ''));
    if (!row) return problem(404, 'Not Found', { detail: 'No booking ' + (parts[2] ?? '') });
    if (parts.length === 3 && method === 'GET') return json(200, view(row), { ETag: etag(row) });
    if (parts.length === 4 && parts[3] === 'cancel' && method === 'POST') {
      if (headers.get('If-Match') !== etag(row)) return problem(412, 'Precondition Failed', { detail: 'This booking was changed by someone else. Reload it and try again.' });
      if (row.status !== 'cancelled') {
        row.status = 'cancelled';
        row.notes = typeof body.reason === 'string' ? body.reason : null;
        row.version++;
      }
      return json(200, view(row), { ETag: etag(row) });
    }
    return problem(405, 'Method Not Allowed');
  }

  return { fetch };
}
`;

const MAIN = `// Given: press Run to exercise your client against the in-memory API.
import { createHttp } from './http';
import { createBookingsClient } from './bookingsClient';
import { createFakeApi } from './fakeApi';

const api = createFakeApi();
const client = createBookingsClient(createHttp({ baseUrl: 'https://bookings.example.test', fetch: api.fetch, getToken: () => 'demo-token', timeoutMs: 2000 }));
const show = (e: unknown) => JSON.stringify(e);

async function main(): Promise<void> {
  const confirmed = await client.list({ status: 'confirmed' });
  console.log('Confirmed:', confirmed.ok ? confirmed.value.map((b) => b.guest + ' (' + b.nights + ' nights from ' + b.checkIn.toISOString().slice(0, 10) + ')').join('; ') : show(confirmed.error));

  const newBooking = { guest: 'Yaw Mensah', nights: 2, checkIn: new Date(Date.UTC(2026, 11, 28)) };
  const created = await client.create(newBooking, 'demo-key-1');
  console.log('Created:', created.ok ? created.value.id + ' (' + created.value.status + ')' : show(created.error));
  const again = await client.create(newBooking, 'demo-key-1');
  console.log('Same idempotency key returns the same booking:', created.ok && again.ok && again.value.id === created.value.id);

  const invalid = await client.create({ guest: ' ', nights: 0, checkIn: new Date(Date.UTC(2026, 11, 28)) }, 'demo-key-2');
  console.log('Invalid booking:', invalid.ok ? 'accepted?!' : show(invalid.error));

  if (created.ok) {
    const loaded = await client.get(created.value.id);
    if (loaded.ok) {
      const cancelled = await client.cancel(created.value.id, 'Plans changed', loaded.value.etag);
      console.log('Cancelled:', cancelled.ok ? cancelled.value.status : show(cancelled.error));
      const stale = await client.cancel(created.value.id, 'Again', loaded.value.etag);
      console.log('Cancel with a stale ETag:', stale.ok ? 'succeeded?!' : show(stale.error));
    } else {
      console.log('Get failed:', show(loaded.error));
    }
  }
  const missing = await client.get('does-not-exist');
  console.log('Missing booking:', missing.ok ? 'found?!' : show(missing.error));
}

void main();
`;

const TESTS = `import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { createHttp, type HttpOptions } from './http';
import { createBookingsClient, type BookingsClient } from './bookingsClient';
import type { ApiError, Booking, Result } from './types';

type Call = { url: string; init: RequestInit };
type Reply = Response | Error | ((init: RequestInit) => Promise<Response>);

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json', ...headers } });
const empty = (status: number, statusText = '', headers: Record<string, string> = {}) => new Response(null, { status, statusText, headers });

function scripted(...replies: Reply[]) {
  const calls: Call[] = [];
  const fetch = vi.fn(async (url: string, init: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    const next = replies.shift();
    if (next === undefined) throw new Error('unexpected extra request to ' + url);
    if (next instanceof Error) throw next;
    if (typeof next === 'function') return next(init);
    return next;
  });
  return { fetch, calls };
}

function setup(replies: Reply[], extra: Partial<HttpOptions> = {}) {
  const { fetch, calls } = scripted(...replies);
  const sleep = vi.fn(async (ms: number) => { void ms; });
  const request = createHttp({ baseUrl: 'https://api.test/', fetch, getToken: () => 'tok-1', sleep, ...extra });
  return { request, calls, sleep, fetch };
}

const header = (c: Call | undefined, name: string) => (c ? new Headers(c.init.headers).get(name) : null);
const anything = (x: unknown): Result<unknown, string[]> => ({ ok: true, value: x });
const hangUntilAborted = (init: RequestInit) => new Promise<Response>((_, reject) => {
  init.signal?.addEventListener('abort', () => reject(init.signal?.reason ?? new Error('aborted')));
});
const sleepArgs = (sleep: { mock: { calls: unknown[][] } }) => sleep.mock.calls.map((c) => c[0]);

const BOOKING = { id: 'bk-1', guest: 'Ama', nights: 2, checkIn: '2026-12-24', status: 'confirmed', notes: null };

describe('http: building requests', () => {
  it('joins baseUrl, path and query, skipping undefined values', async () => {
    const { request, calls } = setup([json(200, {})]);
    await request({ method: 'GET', path: '/api/bookings', query: { status: 'confirmed', guest: 'Ama & Kofi', page: undefined }, parse: anything });
    expect(calls[0]?.url).toBe('https://api.test/api/bookings?status=confirmed&guest=Ama+%26+Kofi');
  });
  it('sends Accept and a bearer token, and no Authorization without a token', async () => {
    const a = setup([json(200, {})]);
    await a.request({ method: 'GET', path: '/x', parse: anything });
    expect(header(a.calls[0], 'Accept')).toBe('application/json');
    expect(header(a.calls[0], 'Authorization')).toBe('Bearer tok-1');
    const b = setup([json(200, {})], { getToken: () => null });
    await b.request({ method: 'GET', path: '/x', parse: anything });
    expect(header(b.calls[0], 'Authorization')).toBe(null);
  });
  it('sends JSON bodies, the idempotency key and extra headers', async () => {
    const { request, calls } = setup([json(201, {})]);
    await request({ method: 'POST', path: '/x', body: { a: 1 }, idempotencyKey: 'key-9', headers: { 'If-Match': 'W/"3"' }, parse: anything });
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.init.body).toBe('{"a":1}');
    expect(header(calls[0], 'Content-Type')).toBe('application/json');
    expect(header(calls[0], 'Idempotency-Key')).toBe('key-9');
    expect(header(calls[0], 'If-Match')).toBe('W/"3"');
  });
});

describe('http: responses', () => {
  it('resolves parsed data with status and headers', async () => {
    const { request } = setup([json(200, { n: 1 }, { ETag: 'W/"1"' })]);
    const r = await request({ method: 'GET', path: '/x', parse: (x) => ({ ok: true, value: (x as { n: number }).n * 10 }) });
    expect(r.ok && r.value.data).toBe(10);
    expect(r.ok && r.value.status).toBe(200);
    expect(r.ok && r.value.headers.get('ETag')).toBe('W/"1"');
  });
  it('parses undefined for 204 and empty bodies', async () => {
    const parse = vi.fn(anything);
    const { request } = setup([empty(204), empty(200)]);
    await request({ method: 'GET', path: '/a', parse });
    await request({ method: 'GET', path: '/b', parse });
    expect(parse.mock.calls).toEqual([[undefined], [undefined]]);
  });
  it('reports malformed JSON and failed parses as invalid-response', async () => {
    const { request } = setup([new Response('<html>oops</html>', { status: 200 }), json(200, { nope: true })]);
    const a = await request({ method: 'GET', path: '/a', parse: anything });
    const b = await request({ method: 'GET', path: '/b', parse: () => ({ ok: false, error: ['booking.id: expected a non-empty string'] }) });
    expect(a.ok ? null : a.error.kind).toBe('invalid-response');
    expect(b).toEqual({ ok: false, error: { kind: 'invalid-response', problems: ['booking.id: expected a non-empty string'] } });
  });
  it('maps 401 and 404', async () => {
    const { request } = setup([json(401, { title: 'Unauthorized', status: 401 }), json(404, { title: 'Not Found', status: 404 })]);
    expect(await request({ method: 'GET', path: '/a', parse: anything })).toEqual({ ok: false, error: { kind: 'unauthorized' } });
    expect(await request({ method: 'GET', path: '/b', parse: anything })).toEqual({ ok: false, error: { kind: 'not-found' } });
  });
  it('maps 409 and 412 to conflict with the problem detail, else its title', async () => {
    const { request } = setup([json(412, { title: 'Precondition Failed', status: 412, detail: 'Reload and try again.' }), json(409, { title: 'Conflict', status: 409 })]);
    expect(await request({ method: 'POST', path: '/a', parse: anything })).toEqual({ ok: false, error: { kind: 'conflict', detail: 'Reload and try again.' } });
    expect(await request({ method: 'POST', path: '/b', parse: anything })).toEqual({ ok: false, error: { kind: 'conflict', detail: 'Conflict' } });
  });
  it('maps validation problems with camelCased field names', async () => {
    const { request } = setup([json(400, { title: 'One or more validation errors occurred.', status: 400, errors: { Guest: ['The Guest field is required.'], CheckIn: ['Bad date.'] } })]);
    expect(await request({ method: 'POST', path: '/a', body: {}, parse: anything })).toEqual({
      ok: false, error: { kind: 'validation', fieldErrors: { guest: ['The Guest field is required.'], checkIn: ['Bad date.'] } },
    });
  });
  it('maps other failures to server errors with the problem title, else the status text', async () => {
    const { request } = setup([json(500, { title: 'Database unavailable', status: 500 }), empty(418, "I'm a teapot")]);
    expect(await request({ method: 'POST', path: '/a', parse: anything })).toEqual({ ok: false, error: { kind: 'server', status: 500, title: 'Database unavailable' } });
    expect(await request({ method: 'POST', path: '/b', parse: anything })).toEqual({ ok: false, error: { kind: 'server', status: 418, title: "I'm a teapot" } });
  });
});

describe('http: failures, timeouts and retries', () => {
  it('retries a GET after network errors with doubling backoff, then reports network', async () => {
    const { request, fetch, sleep } = setup([new TypeError('Failed to fetch'), new TypeError('Failed to fetch'), new TypeError('Failed to fetch')]);
    const r = await request({ method: 'GET', path: '/a', parse: anything });
    expect(r).toEqual({ ok: false, error: { kind: 'network', message: 'Failed to fetch' } });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sleepArgs(sleep)).toEqual([200, 400]);
  });
  it('retries a 503 and succeeds, honouring Retry-After', async () => {
    const { request, sleep } = setup([empty(503, 'Service Unavailable', { 'Retry-After': '2' }), empty(503, 'Service Unavailable'), json(200, { ok: 1 })]);
    const r = await request({ method: 'GET', path: '/a', parse: anything });
    expect(r.ok).toBe(true);
    expect(sleepArgs(sleep)).toEqual([2000, 400]);
  });
  it('never retries a POST without an idempotency key', async () => {
    const { request, fetch } = setup([empty(503, 'Service Unavailable'), json(201, {})]);
    const r = await request({ method: 'POST', path: '/a', body: {}, parse: anything });
    expect(r).toEqual({ ok: false, error: { kind: 'server', status: 503, title: 'Service Unavailable' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('retries a POST that carries an idempotency key', async () => {
    const { request, fetch } = setup([new TypeError('Failed to fetch'), json(201, { id: 1 })]);
    const r = await request({ method: 'POST', path: '/a', body: {}, idempotencyKey: 'k', parse: anything });
    expect(r.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('does not retry ordinary 4xx responses', async () => {
    const { request, fetch } = setup([json(400, { title: 'Bad Request', status: 400 })]);
    await request({ method: 'GET', path: '/a', parse: anything });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('times out a hung request', async () => {
    const { request } = setup([hangUntilAborted], { timeoutMs: 30, retries: 0 });
    expect(await request({ method: 'GET', path: '/slow', parse: anything })).toEqual({ ok: false, error: { kind: 'timeout' } });
  });
  it('reports a caller abort as aborted and does not retry it', async () => {
    const { request, fetch } = setup([hangUntilAborted, json(200, {})]);
    const controller = new AbortController();
    const pending = request({ method: 'GET', path: '/a', signal: controller.signal, parse: anything });
    controller.abort();
    expect(await pending).toEqual({ ok: false, error: { kind: 'aborted' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

function clientWith(...replies: Reply[]) {
  const { request, calls } = setup(replies);
  return { client: createBookingsClient(request), calls };
}

describe('bookings client', () => {
  it('lists with a filter and returns parsed bookings', async () => {
    const { client, calls } = clientWith(json(200, [BOOKING]));
    const r = await client.list({ status: 'confirmed', guest: 'ama' });
    expect(calls[0]?.url).toBe('https://api.test/api/bookings?status=confirmed&guest=ama');
    expect(r.ok && r.value[0]?.checkIn.toISOString()).toBe('2026-12-24T00:00:00.000Z');
  });
  it('lists everything without a filter', async () => {
    const { client, calls } = clientWith(json(200, []));
    expect(await client.list()).toEqual({ ok: true, value: [] });
    expect(calls[0]?.url).toBe('https://api.test/api/bookings');
  });
  it('gets one booking with its ETag, encoding the id', async () => {
    const { client, calls } = clientWith(json(200, BOOKING, { ETag: 'W/"7"' }));
    const r = await client.get('bk/1');
    expect(calls[0]?.url).toBe('https://api.test/api/bookings/bk%2F1');
    expect(r.ok && r.value.etag).toBe('W/"7"');
    expect(r.ok && r.value.booking.guest).toBe('Ama');
  });
  it('treats a missing ETag as an invalid response', async () => {
    const { client } = clientWith(json(200, BOOKING));
    const r = await client.get('bk-1');
    expect(r.ok ? null : r.error.kind).toBe('invalid-response');
  });
  it('creates with a serialized body and the idempotency key', async () => {
    const { client, calls } = clientWith(json(201, { ...BOOKING, status: 'pending' }));
    const r = await client.create({ guest: 'Ama', nights: 2, checkIn: new Date(Date.UTC(2026, 11, 24)) }, 'key-1');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ guest: 'Ama', nights: 2, checkIn: '2026-12-24', notes: null });
    expect(header(calls[0], 'Idempotency-Key')).toBe('key-1');
    expect(r.ok && r.value.status).toBe('pending');
  });
  it('passes validation errors through', async () => {
    const { client } = clientWith(json(400, { title: 'Invalid', status: 400, errors: { Nights: ['Too many.'] } }));
    const r = await client.create({ guest: 'Ama', nights: 99, checkIn: new Date(Date.UTC(2026, 11, 24)) }, 'key-2');
    expect(r).toEqual({ ok: false, error: { kind: 'validation', fieldErrors: { nights: ['Too many.'] } } });
  });
  it('cancels with If-Match and the reason', async () => {
    const { client, calls } = clientWith(json(200, { ...BOOKING, status: 'cancelled' }));
    const r = await client.cancel('bk-1', 'Plans changed', 'W/"7"');
    expect(calls[0]?.url).toBe('https://api.test/api/bookings/bk-1/cancel');
    expect(calls[0]?.init.method).toBe('POST');
    expect(header(calls[0], 'If-Match')).toBe('W/"7"');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ reason: 'Plans changed' });
    expect(r.ok && r.value.status).toBe('cancelled');
  });
  it('reports a stale ETag as a conflict', async () => {
    const { client } = clientWith(json(412, { title: 'Precondition Failed', status: 412, detail: 'Changed by someone else.' }));
    expect(await client.cancel('bk-1', 'x', 'W/"1"')).toEqual({ ok: false, error: { kind: 'conflict', detail: 'Changed by someone else.' } });
  });
});

// ---- type-level tests: checked by the compiler, never executed ----
function explain(e: ApiError): string {
  switch (e.kind) {
    case 'network': return e.message;
    case 'timeout': return 'The server took too long.';
    case 'aborted': return '';
    case 'unauthorized': return 'Please sign in again.';
    case 'not-found': return 'Not found.';
    case 'conflict': return e.detail;
    case 'validation': return Object.keys(e.fieldErrors).join(', ');
    case 'server': return e.status + ' ' + e.title;
    case 'invalid-response': return e.problems.join('; ');
    default: {
      const unreachable: never = e;
      return unreachable;
    }
  }
}

function typeTests(client: BookingsClient): void {
  expectTypeOf(client.list).returns.resolves.toEqualTypeOf<Result<Booking[], ApiError>>();
  expectTypeOf(client.get).returns.resolves.toEqualTypeOf<Result<{ booking: Booking; etag: string }, ApiError>>();
  // @ts-expect-error nights is required for a new booking
  void client.create({ guest: 'Ama', checkIn: new Date() }, 'key-1');
  // @ts-expect-error id and status are assigned by the server, not sent
  void client.create({ id: 'bk-9', status: 'confirmed', guest: 'Ama', nights: 1, checkIn: new Date() }, 'key-1');
  // @ts-expect-error 'canceled' is not a booking status
  void client.list({ status: 'canceled' });
}
void explain; void typeTests;
`;

const task: ProjectTask = {
  id: 'se-ts-m4-001',
  title: 'Week 13: TypeScript Client',
  difficulty: 'Hard',
  language: 'typescript',
  track: 'fullstack',
  category: 'Month 4 · TypeScript & React Engineering',
  tags: ['TypeScript', 'fetch', 'discriminated unions', 'retries'],
  prompt:
    'Write the typed client for your Booking API that every screen of next week\'s React app will use: precise request and response ' +
    'types derived from one Booking model, a discriminated ApiError union, one generic request function that applies auth headers, ' +
    'timeouts and cancellation, maps problem details to typed errors and retries only requests that are safe to repeat, and a bookings ' +
    'client with list, get (with ETag), create (with an idempotency key) and cancel (with If-Match). Graded by a strict type check, ' +
    'type-level tests and about 25 behaviour tests driven by a scripted fake fetch.',
  hints: [
    'Start with types.ts: NewBooking = Omit<Booking, \'id\' | \'status\' | \'notes\'> & { notes?: string | null }, and ApiError as nine object types joined with |, each with a literal kind.',
    'In createHttp, write one attempt() that builds Headers, combines AbortSignal.timeout(timeoutMs) with the caller\'s signal via AbortSignal.any, and returns either the Response or an ApiError — checking req.signal?.aborted before timeout.aborted when fetch throws.',
    'The retry loop: safe = method === \'GET\' || idempotencyKey !== undefined; attempts = safe ? retries + 1 : 1. Retry on a failed attempt (unless aborted) or a 429/502/503/504; sleep for Retry-After seconds × 1000 or 200 × 2^(n-1).',
    'For problem bodies, read res.json() inside try/catch and pull title, detail and errors out of the unknown value with typeof checks.',
    'In the client, return r unchanged when !r.ok — after narrowing it is { ok: false; error: ApiError }, which fits every Result<_, ApiError>.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('src/types.ts', TYPES_STARTER),
    pf('src/http.ts', HTTP_STARTER),
    pf('src/bookingsClient.ts', CLIENT_STARTER),
    pf('src/parse.ts', PARSE, { editable: false }),
    pf('src/fakeApi.ts', FAKE_API, { editable: false }),
    pf('src/main.ts', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('src/types.ts', TYPES_SOLUTION),
    pf('src/http.ts', HTTP_SOLUTION),
    pf('src/bookingsClient.ts', CLIENT_SOLUTION),
    pf('src/parse.ts', PARSE, { editable: false }),
    pf('src/fakeApi.ts', FAKE_API, { editable: false }),
    pf('src/main.ts', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Booking client', kind: 'typescript', entry: 'src/main.ts', testCode: TESTS }],
};

export default task;
