import type { CodeTask } from '../codeTypes';
import { WEEK_14_TASKS } from './m4a-react';

const CATEGORY = 'Month 4 · TypeScript & React';

/** Month 4, week 13 tasks (lessons dn4-1, dn4-2). Each task's tests are a separate module that
 *  imports from './solution'; the strict type check of both files is itself one of the checks, so
 *  the type-level tests (@ts-expect-error, expectTypeOf) grade the types, not just the behaviour. */
export const TS_MONTH4_A_TASKS: CodeTask[] = [
  {
    id: 'ts-4-01',
    title: 'Model Booking States with a Discriminated Union',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Replace a loose "bag of optionals" with types that make illegal states unrepresentable. Export BookingStatus (exactly ' +
      '\'pending\' | \'confirmed\' | \'cancelled\') and Booking, a discriminated union on status: every booking has id and guest; a pending ' +
      'booking also has requestedAt; a confirmed one has room; a cancelled one has cancelledAt and reason — and no state has another state\'s ' +
      'fields. Then implement: describe(b) → "Ama — awaiting confirmation" / "Ama — room 12" / "Ama — cancelled (no show)"; ' +
      'cancel(b, reason, at) → a new cancelled booking (keeping id and guest), returning an already-cancelled booking unchanged and never ' +
      'mutating its input; countByStatus(bookings) → a Record with a count for every status, including zeros. Make the switch in describe ' +
      'exhaustive with never. Type-level tests check that a misspelt status, a confirmed booking with a reason, and a cancelled booking ' +
      'without one all fail to compile.',
    starterCode: `export type BookingStatus = string;

export interface Booking {
  status: BookingStatus;
  id: string;
  guest: string;
  requestedAt?: string;
  room?: string;
  cancelledAt?: string;
  reason?: string;
}

export function describe(b: Booking): string {
  throw new Error('TODO');
}

export function cancel(b: Booking, reason: string, at: string): Booking {
  throw new Error('TODO');
}

export function countByStatus(bookings: readonly Booking[]): Record<string, number> {
  throw new Error('TODO');
}
`,
    hints: [
      'type Booking = { status: \'pending\'; id: string; guest: string; requestedAt: string } | { status: \'confirmed\'; … } | { status: \'cancelled\'; … }.',
      'In describe, switch (b.status) and add default: { const unreachable: never = b; throw new Error(…) }.',
      'cancel: if (b.status === \'cancelled\') return b; otherwise return a new object literal — { status: \'cancelled\', id: b.id, guest: b.guest, cancelledAt: at, reason }.',
      'countByStatus: start from { pending: 0, confirmed: 0, cancelled: 0 } and increment counts[b.status].',
    ],
    solution: `export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type Booking =
  | { status: 'pending'; id: string; guest: string; requestedAt: string }
  | { status: 'confirmed'; id: string; guest: string; room: string }
  | { status: 'cancelled'; id: string; guest: string; cancelledAt: string; reason: string };

export function describe(b: Booking): string {
  switch (b.status) {
    case 'pending':
      return b.guest + ' — awaiting confirmation';
    case 'confirmed':
      return b.guest + ' — room ' + b.room;
    case 'cancelled':
      return b.guest + ' — cancelled (' + b.reason + ')';
    default: {
      const unreachable: never = b;
      throw new Error('Unhandled booking ' + JSON.stringify(unreachable));
    }
  }
}

export function cancel(b: Booking, reason: string, at: string): Booking {
  if (b.status === 'cancelled') return b;
  return { status: 'cancelled', id: b.id, guest: b.guest, cancelledAt: at, reason };
}

export function countByStatus(bookings: readonly Booking[]): Record<BookingStatus, number> {
  const counts: Record<BookingStatus, number> = { pending: 0, confirmed: 0, cancelled: 0 };
  for (const b of bookings) counts[b.status]++;
  return counts;
}
`,
    testCode: `import { describe as suite, it, expect, expectTypeOf } from 'vitest';
import { describe, cancel, countByStatus, type Booking, type BookingStatus } from './solution';

const pending: Booking = { status: 'pending', id: 'b1', guest: 'Ama', requestedAt: '2026-11-01T09:00:00Z' };
const confirmed: Booking = { status: 'confirmed', id: 'b2', guest: 'Kofi', room: '12' };
const cancelled: Booking = { status: 'cancelled', id: 'b3', guest: 'Esi', cancelledAt: '2026-11-02T10:00:00Z', reason: 'no show' };

suite('describe', () => {
  it('describes a pending booking', () => { expect(describe(pending)).toBe('Ama — awaiting confirmation'); });
  it('describes a confirmed booking', () => { expect(describe(confirmed)).toBe('Kofi — room 12'); });
  it('describes a cancelled booking', () => { expect(describe(cancelled)).toBe('Esi — cancelled (no show)'); });
});

suite('cancel', () => {
  it('cancels a confirmed booking without mutating it', () => {
    const before = JSON.stringify(confirmed);
    const result = cancel(confirmed, 'guest request', '2026-11-03T08:00:00Z');
    expect(result).toEqual({ status: 'cancelled', id: 'b2', guest: 'Kofi', cancelledAt: '2026-11-03T08:00:00Z', reason: 'guest request' });
    expect(JSON.stringify(confirmed)).toBe(before);
  });
  it('drops fields that belong to the old state', () => {
    expect(Object.keys(cancel(pending, 'x', 't')).sort()).toEqual(['cancelledAt', 'guest', 'id', 'reason', 'status']);
  });
  it('returns an already-cancelled booking unchanged', () => {
    expect(cancel(cancelled, 'again', 'later')).toBe(cancelled);
  });
});

suite('countByStatus', () => {
  it('counts every status, including zeros', () => {
    expect(countByStatus([pending, confirmed, confirmed])).toEqual({ pending: 1, confirmed: 2, cancelled: 0 });
    expect(countByStatus([])).toEqual({ pending: 0, confirmed: 0, cancelled: 0 });
  });
});

// ---- type-level tests (checked by the compiler) ----
// Checked by the compiler, never executed, so they cannot crash the run.
function typeTests(): void {
  expectTypeOf<BookingStatus>().toEqualTypeOf<'pending' | 'confirmed' | 'cancelled'>();
  expectTypeOf(countByStatus([])).toEqualTypeOf<Record<BookingStatus, number>>();

  // @ts-expect-error 'canceled' (one l) is not a booking status
  const misspelt: BookingStatus = 'canceled';

  // @ts-expect-error a confirmed booking has no reason
  const confirmedWithReason: Booking = { status: 'confirmed', id: 'x', guest: 'g', room: '1', reason: 'r' };

  // @ts-expect-error a cancelled booking must have a reason
  const cancelledWithoutReason: Booking = { status: 'cancelled', id: 'x', guest: 'g', cancelledAt: 't' };

  void misspelt; void confirmedWithReason; void cancelledWithoutReason;
}
void typeTests;
`,
  },
  {
    id: 'ts-4-02',
    title: 'Narrow Unknown Errors Safely',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Your ASP.NET Core API reports failures as RFC 9457 problem details, but a frontend receives errors as unknown — from response ' +
      'bodies, from catch clauses, from anywhere. Export ProblemDetails ({ title: string; status: number; type?: string; detail?: string; ' +
      'errors?: Record<string, string[]> }) and implement: isProblemDetails(x: unknown): x is ProblemDetails — true only for a non-null ' +
      'object whose title is a string, whose status is an integer from 100 to 599, and whose errors, if present, is an object mapping ' +
      'every key to an array of strings; errorMessage(e: unknown): string — a problem\'s detail if it has one, otherwise its title; an Error\'s ' +
      'message; a non-empty string itself; anything else "Something went wrong"; and fieldErrors(problem, field) — the messages for a ' +
      'field, matching the key case-insensitively (ASP.NET sends "Guest", your form uses "guest"), or [] when there are none. No any, ' +
      'and no "as" casts to ProblemDetails.',
    starterCode: `export interface ProblemDetails {
  title: string;
  status: number;
  type?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function isProblemDetails(x: unknown): boolean {
  return false;
}

export function errorMessage(e: unknown): string {
  return 'Something went wrong';
}

export function fieldErrors(problem: ProblemDetails, field: string): string[] {
  return [];
}
`,
    hints: [
      'The return type must be the predicate x is ProblemDetails, or callers get no narrowing.',
      'Narrow step by step: typeof x === \'object\' && x !== null, then \'title\' in x && typeof x.title === \'string\' — TypeScript narrows through in checks.',
      'For errors: Object.values(errors).every(v => Array.isArray(v) && v.every(m => typeof m === \'string\')).',
      'fieldErrors: find the key with Object.keys(errors).find(k => k.toLowerCase() === field.toLowerCase()).',
    ],
    solution: `export interface ProblemDetails {
  title: string;
  status: number;
  type?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

function isStringArrayRecord(x: unknown): x is Record<string, string[]> {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  return Object.values(x).every((v) => Array.isArray(v) && v.every((m) => typeof m === 'string'));
}

export function isProblemDetails(x: unknown): x is ProblemDetails {
  if (typeof x !== 'object' || x === null) return false;
  if (!('title' in x) || typeof x.title !== 'string') return false;
  if (!('status' in x) || typeof x.status !== 'number' || !Number.isInteger(x.status) || x.status < 100 || x.status > 599) return false;
  if ('errors' in x && x.errors !== undefined && !isStringArrayRecord(x.errors)) return false;
  return true;
}

export function errorMessage(e: unknown): string {
  if (isProblemDetails(e)) return e.detail ?? e.title;
  if (e instanceof Error) return e.message;
  if (typeof e === 'string' && e.length > 0) return e;
  return 'Something went wrong';
}

export function fieldErrors(problem: ProblemDetails, field: string): string[] {
  const errors = problem.errors ?? {};
  const key = Object.keys(errors).find((k) => k.toLowerCase() === field.toLowerCase());
  return key === undefined ? [] : errors[key] ?? [];
}
`,
    testCode: `import { describe, it, expect, expectTypeOf } from 'vitest';
import { isProblemDetails, errorMessage, fieldErrors, type ProblemDetails } from './solution';

const validation = {
  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
  title: 'One or more validation errors occurred.',
  status: 400,
  errors: { Guest: ['The Guest field is required.'], Nights: ['Must be between 1 and 30.', 'Must be a whole number.'] },
};

describe('isProblemDetails', () => {
  it('accepts a real ASP.NET Core validation problem', () => { expect(isProblemDetails(validation)).toBe(true); });
  it('accepts a minimal problem', () => { expect(isProblemDetails({ title: 'Not Found', status: 404 })).toBe(true); });
  it('rejects null, strings and arrays', () => {
    expect(isProblemDetails(null)).toBe(false);
    expect(isProblemDetails('Not Found')).toBe(false);
    expect(isProblemDetails([])).toBe(false);
  });
  it('rejects a missing or non-string title', () => {
    expect(isProblemDetails({ status: 404 })).toBe(false);
    expect(isProblemDetails({ title: 404, status: 404 })).toBe(false);
  });
  it('rejects a status that is not an integer HTTP status', () => {
    expect(isProblemDetails({ title: 'x', status: '404' })).toBe(false);
    expect(isProblemDetails({ title: 'x', status: 4.5 })).toBe(false);
    expect(isProblemDetails({ title: 'x', status: 99 })).toBe(false);
    expect(isProblemDetails({ title: 'x', status: 600 })).toBe(false);
  });
  it('rejects malformed field errors', () => {
    expect(isProblemDetails({ title: 'x', status: 400, errors: { guest: 'required' } })).toBe(false);
    expect(isProblemDetails({ title: 'x', status: 400, errors: { guest: [1] } })).toBe(false);
  });
});

describe('errorMessage', () => {
  it('prefers a problem\\'s detail, then its title', () => {
    expect(errorMessage({ title: 'Conflict', status: 409, detail: 'Room 12 is already booked.' })).toBe('Room 12 is already booked.');
    expect(errorMessage({ title: 'Conflict', status: 409 })).toBe('Conflict');
  });
  it('uses an Error\\'s message', () => { expect(errorMessage(new TypeError('Failed to fetch'))).toBe('Failed to fetch'); });
  it('uses a non-empty string as-is', () => { expect(errorMessage('Offline')).toBe('Offline'); });
  it('falls back for anything else', () => {
    expect(errorMessage(undefined)).toBe('Something went wrong');
    expect(errorMessage('')).toBe('Something went wrong');
    expect(errorMessage({ message: 'not an Error' })).toBe('Something went wrong');
  });
});

describe('fieldErrors', () => {
  it('matches field names case-insensitively', () => {
    expect(fieldErrors(validation, 'guest')).toEqual(['The Guest field is required.']);
    expect(fieldErrors(validation, 'NIGHTS')).toHaveLength(2);
  });
  it('returns [] for a field without errors or a problem without errors', () => {
    expect(fieldErrors(validation, 'email')).toEqual([]);
    expect(fieldErrors({ title: 'x', status: 400 }, 'guest')).toEqual([]);
  });
});

// ---- type-level tests ----
// Checked by the compiler, never executed, so they cannot crash the run.
function typeTests(): void {
  expectTypeOf(isProblemDetails).toEqualTypeOf<(x: unknown) => x is ProblemDetails>();
  const incoming: unknown = validation;
  if (isProblemDetails(incoming)) {
    expectTypeOf(incoming).toEqualTypeOf<ProblemDetails>();
  }
}
void typeTests;
`,
  },
  {
    id: 'ts-4-03',
    title: 'A Generic Result Toolkit',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Build the small generic toolkit this month\'s client uses to return failures as values. Export type Result<T, E> = ' +
      '{ ok: true; value: T } | { ok: false; error: E }, and implement: ok(value) and err(error) constructors (typed Result<T, never> and ' +
      'Result<never, E> so they fit any Result); map(r, f) — transform a success, pass an error through untouched; andThen(r, f) — chain a ' +
      'step that can itself fail, whose result type unions both error types; unwrapOr(r, fallback); all(results) — every value in order, ' +
      'or the first error; and partition(results) → { values, errors }. Inference must carry the types through: map(ok(2), n => String(n)) ' +
      'is a Result<string, never>, not a Result<any, any>. Type-level tests check exactly that.',
    starterCode: `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = (value: any): any => { throw new Error('TODO'); };
export const err = (error: any): any => { throw new Error('TODO'); };

export function map(r: any, f: (value: any) => any): any { throw new Error('TODO'); }
export function andThen(r: any, f: (value: any) => any): any { throw new Error('TODO'); }
export function unwrapOr(r: any, fallback: any): any { throw new Error('TODO'); }
export function all(results: readonly any[]): any { throw new Error('TODO'); }
export function partition(results: readonly any[]): { values: any[]; errors: any[] } { throw new Error('TODO'); }
`,
    hints: [
      'Signatures first: function map<T, U, E>(r: Result<T, E>, f: (value: T) => U): Result<U, E>.',
      'andThen<T, U, E, F>(r: Result<T, E>, f: (value: T) => Result<U, F>): Result<U, E | F>.',
      'Returning r itself from map when !r.ok does not type-check (its T is wrong); return err(r.error) instead.',
      'all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> — loop, return the first error you meet, else ok(values).',
    ],
    solution: `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function map<T, U, E>(r: Result<T, E>, f: (value: T) => U): Result<U, E> {
  return r.ok ? ok(f(r.value)) : err(r.error);
}

export function andThen<T, U, E, F>(r: Result<T, E>, f: (value: T) => Result<U, F>): Result<U, E | F> {
  return r.ok ? f(r.value) : err(r.error);
}

export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

export function all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const r of results) {
    if (!r.ok) return err(r.error);
    values.push(r.value);
  }
  return ok(values);
}

export function partition<T, E>(results: readonly Result<T, E>[]): { values: T[]; errors: E[] } {
  const values: T[] = [];
  const errors: E[] = [];
  for (const r of results) {
    if (r.ok) values.push(r.value);
    else errors.push(r.error);
  }
  return { values, errors };
}
`,
    testCode: `import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { ok, err, map, andThen, unwrapOr, all, partition, type Result } from './solution';

const parseNights = (s: string): Result<number, 'not-a-number'> => (/^\\d+$/.test(s) ? ok(Number(s)) : err('not-a-number'));
const checkRange = (n: number): Result<number, 'out-of-range'> => (n >= 1 && n <= 30 ? ok(n) : err('out-of-range'));

describe('constructors', () => {
  it('ok and err build the two shapes', () => {
    expect(ok(5)).toEqual({ ok: true, value: 5 });
    expect(err('boom')).toEqual({ ok: false, error: 'boom' });
  });
});

describe('map', () => {
  it('transforms a success', () => { expect(map(ok(2), (n) => n * 10)).toEqual({ ok: true, value: 20 }); });
  it('passes an error through without calling f', () => {
    const f = vi.fn((n: number) => n * 10);
    expect(map(err('nope') as Result<number, string>, f)).toEqual({ ok: false, error: 'nope' });
    expect(f).toHaveBeenCalledTimes(0);
  });
});

describe('andThen', () => {
  it('chains steps that can fail', () => {
    expect(andThen(parseNights('3'), checkRange)).toEqual({ ok: true, value: 3 });
    expect(andThen(parseNights('45'), checkRange)).toEqual({ ok: false, error: 'out-of-range' });
    expect(andThen(parseNights('three'), checkRange)).toEqual({ ok: false, error: 'not-a-number' });
  });
});

describe('unwrapOr / all / partition', () => {
  it('unwrapOr returns the value or the fallback', () => {
    expect(unwrapOr(ok(4), 0)).toBe(4);
    expect(unwrapOr(err('x') as Result<number, string>, 0)).toBe(0);
  });
  it('all collects values in order', () => { expect(all([ok(1), ok(2), ok(3)])).toEqual({ ok: true, value: [1, 2, 3] }); });
  it('all stops at the first error', () => {
    expect(all<number, string>([ok(1), err('first'), err('second')])).toEqual({ ok: false, error: 'first' });
  });
  it('all of nothing is an empty success', () => { expect(all([])).toEqual({ ok: true, value: [] }); });
  it('partition separates values and errors', () => {
    expect(partition<number, string>([ok(1), err('a'), ok(2), err('b')])).toEqual({ values: [1, 2], errors: ['a', 'b'] });
  });
});

// ---- type-level tests: types must flow through, never collapse to any ----
// Checked by the compiler, never executed, so they cannot crash the run.
function typeTests(): void {
  expectTypeOf(ok(1)).toEqualTypeOf<Result<number, never>>();
  expectTypeOf(err('e')).toEqualTypeOf<Result<never, string>>();
  expectTypeOf(map(ok(2), (n) => String(n))).toEqualTypeOf<Result<string, never>>();
  expectTypeOf(andThen(parseNights('1'), checkRange)).toEqualTypeOf<Result<number, 'not-a-number' | 'out-of-range'>>();
  expectTypeOf(all([parseNights('1'), parseNights('2')])).toEqualTypeOf<Result<number[], 'not-a-number'>>();
  expectTypeOf(partition([parseNights('1')])).toEqualTypeOf<{ values: number[]; errors: 'not-a-number'[] }>();
}
void typeTests;
`,
  },
  {
    id: 'ts-4-04',
    title: 'Parse, Don\'t Trust: Booking JSON',
    difficulty: 'Hard',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Write the parser that turns your Booking API\'s JSON into trusted values. parseBooking(input: unknown, path = \'booking\') returns ' +
      'Result<Booking, string[]> where Booking is { id: string; guest: string; nights: number; checkIn: Date; status: Status; notes: string | null } ' +
      'and Status is \'pending\' | \'confirmed\' | \'cancelled\'. Rules: input must be an object; id a non-empty string; guest a string that is ' +
      'non-empty after trimming (return it trimmed); nights an integer from 1 to 30; checkIn a "YYYY-MM-DD" string naming a real calendar ' +
      'date (2026-02-30 is not), returned as a Date at midnight UTC; status one of the three; notes a string or null, with a missing ' +
      'notes becoming null. Report EVERY problem, each as "<path>.<field>: <what was expected>" (e.g. "booking.nights: expected an ' +
      'integer from 1 to 30"); a non-object gives one "<path>: expected an object". parseBookingList(input) parses an array, using paths ' +
      '"bookings[0]", "bookings[1]"…, and collects the problems of every item ("bookings: expected an array" for a non-array). ' +
      'Never cast unknown data to Booking — build the value from checked fields.',
    starterCode: `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export type Status = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  guest: string;
  nights: number;
  checkIn: Date;
  status: Status;
  notes: string | null;
}

export function parseBooking(input: unknown, path = 'booking'): Result<Booking, string[]> {
  return { ok: true, value: input as Booking };
}

export function parseBookingList(input: unknown): Result<Booking[], string[]> {
  return { ok: true, value: input as Booking[] };
}
`,
    hints: [
      'Start with: if (typeof input !== \'object\' || input === null || Array.isArray(input)) return { ok: false, error: [path + \': expected an object\'] }; then const o = input as Record<string, unknown> is a safe view for reading fields.',
      'Check each field into a local variable and push a message for each failure; build the Booking only at the end, when errors is empty.',
      'Real dates: match /^(\\d{4})-(\\d{2})-(\\d{2})$/, build new Date(Date.UTC(y, m - 1, d)) and confirm getUTCFullYear/Month/Date give back the same numbers.',
      'For statuses, keep a const STATUSES = [\'pending\', \'confirmed\', \'cancelled\'] as const and a small type guard (s: unknown): s is Status.',
    ],
    solution: `export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export type Status = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  guest: string;
  nights: number;
  checkIn: Date;
  status: Status;
  notes: string | null;
}

const STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
const isStatus = (s: unknown): s is Status => typeof s === 'string' && (STATUSES as readonly string[]).includes(s);

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
`,
    testCode: `import { describe, it, expect, expectTypeOf } from 'vitest';
import { parseBooking, parseBookingList, type Booking } from './solution';

const good = { id: 'b-1', guest: '  Ama Owusu ', nights: 3, checkIn: '2026-12-24', status: 'confirmed', notes: 'Late arrival' };
const fieldsOf = (errors: string[]) => errors.map((e) => e.split(':')[0]).sort();

describe('parseBooking: valid input', () => {
  it('returns a trusted booking with a trimmed guest and a UTC date', () => {
    const r = parseBooking(good);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.guest).toBe('Ama Owusu');
    expect(r.value.checkIn).toBeInstanceOf(Date);
    expect(r.value.checkIn.toISOString()).toBe('2026-12-24T00:00:00.000Z');
    expect(r.value.notes).toBe('Late arrival');
  });
  it('treats missing notes as null and keeps explicit null', () => {
    const { notes, ...withoutNotes } = good;
    void notes;
    const r1 = parseBooking(withoutNotes);
    const r2 = parseBooking({ ...good, notes: null });
    expect(r1.ok && r1.value.notes).toBe(null);
    expect(r2.ok && r2.value.notes).toBe(null);
  });
  it('builds a fresh object with exactly the Booking fields', () => {
    const r = parseBooking({ ...good, isAdmin: true });
    expect(r.ok && Object.keys(r.value).sort()).toEqual(['checkIn', 'guest', 'id', 'nights', 'notes', 'status']);
  });
});

describe('parseBooking: invalid input', () => {
  it('rejects non-objects with one message at the path', () => {
    expect(parseBooking('nope')).toEqual({ ok: false, error: ['booking: expected an object'] });
    expect(parseBooking(null, 'item')).toEqual({ ok: false, error: ['item: expected an object'] });
    expect(parseBooking([good]).ok).toBe(false);
  });
  it('reports every bad field, each prefixed with its path', () => {
    const r = parseBooking({ id: '', guest: '   ', nights: 0, checkIn: '24/12/2026', status: 'canceled', notes: 5 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(fieldsOf(r.error)).toEqual(['booking.checkIn', 'booking.guest', 'booking.id', 'booking.nights', 'booking.notes', 'booking.status']);
  });
  it('rejects fractional and out-of-range nights', () => {
    for (const nights of [1.5, 31, -2, '3']) {
      const r = parseBooking({ ...good, nights });
      expect(r.ok ? [] : fieldsOf(r.error)).toEqual(['booking.nights']);
    }
  });
  it('rejects impossible calendar dates', () => {
    for (const checkIn of ['2026-02-30', '2026-13-01', '2026-1-05']) {
      const r = parseBooking({ ...good, checkIn });
      expect(r.ok ? [] : fieldsOf(r.error)).toEqual(['booking.checkIn']);
    }
    expect(parseBooking({ ...good, checkIn: '2028-02-29' }).ok).toBe(true);
  });
});

describe('parseBookingList', () => {
  it('parses every item', () => {
    const r = parseBookingList([good, { ...good, id: 'b-2', status: 'pending' }]);
    expect(r.ok && r.value.map((b) => b.id)).toEqual(['b-1', 'b-2']);
  });
  it('collects problems from every item with indexed paths', () => {
    const r = parseBookingList([good, { ...good, nights: 0 }, 'x']);
    expect(r).toEqual({ ok: false, error: ['bookings[1].nights: expected an integer from 1 to 30', 'bookings[2]: expected an object'] });
  });
  it('rejects a non-array', () => {
    expect(parseBookingList({ items: [] })).toEqual({ ok: false, error: ['bookings: expected an array'] });
  });
});

// ---- type-level tests ----
// Checked by the compiler, never executed, so they cannot crash the run.
function typeTests(): void {
  const parsed = parseBooking(good);
  if (parsed.ok) {
    expectTypeOf(parsed.value).toEqualTypeOf<Booking>();
    expectTypeOf(parsed.value.status).toEqualTypeOf<'pending' | 'confirmed' | 'cancelled'>();
  }
}
void typeTests;
`,
  },
  ...WEEK_14_TASKS,
];
