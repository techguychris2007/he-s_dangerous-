import type { CodeTask } from '../codeTypes';

const CATEGORY = 'Month 4 · TypeScript & React';

/** The price rules used by ts-4-15 — the learner's copy (given in the starter) and the grader's own
 *  reference copy are generated from this one source so they can never drift. */
const QUOTE_SOURCE = `export interface Quote {
  nights: number;
  subtotal: number;
  weekendSurcharge: number;
  discount: number;
  total: number;
}

const DAY = 86_400_000;
const round = (x: number) => Math.round(x * 100) / 100;

/** Dates are "YYYY-MM-DD" (UTC). Friday and Saturday nights cost 20% more. Stays of 7 or more
 *  nights get 10% off (subtotal + surcharge). Money is rounded to 2 decimals at the end.
 *  Throws RangeError for unreadable dates, a non-positive rate, fewer than 1 or more than 30 nights. */
export function quote(checkIn: string, checkOut: string, nightlyRate: number): Quote {
  const start = Date.parse(checkIn + 'T00:00:00Z');
  const end = Date.parse(checkOut + 'T00:00:00Z');
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new RangeError('Dates must be YYYY-MM-DD');
  if (!(nightlyRate > 0)) throw new RangeError('The nightly rate must be positive');
  const nights = Math.round((end - start) / DAY);
  if (nights < 1) throw new RangeError('Check-out must be after check-in');
  if (nights > 30) throw new RangeError('A booking can be at most 30 nights');
  let weekendNights = 0;
  for (let i = 0; i < nights; i++) {
    const day = new Date(start + i * DAY).getUTCDay();
    if (day === 5 || day === 6) weekendNights++;
  }
  const subtotal = nights * nightlyRate;
  const weekendSurcharge = weekendNights * nightlyRate * 0.2;
  const discount = nights >= 7 ? (subtotal + weekendSurcharge) * 0.1 : 0;
  return { nights, subtotal: round(subtotal), weekendSurcharge: round(weekendSurcharge), discount: round(discount), total: round(subtotal + weekendSurcharge - discount) };
}
`;

/** Each mutant is a realistic bug: [description, text to find, replacement]. */
const MUTANTS: [string, string, string][] = [
  ['counting the check-out day as a night', 'const nights = Math.round((end - start) / DAY);', 'const nights = Math.round((end - start) / DAY) + 1;'],
  ['treating Saturday and Sunday nights as the weekend', 'if (day === 5 || day === 6) weekendNights++;', 'if (day === 6 || day === 0) weekendNights++;'],
  ['giving the long-stay discount only above 7 nights', 'nights >= 7', 'nights > 7'],
  ['discounting the subtotal but not the surcharge', '(subtotal + weekendSurcharge) * 0.1', 'subtotal * 0.1'],
  ['rounding money down instead of to the nearest cent', 'Math.round(x * 100) / 100', 'Math.floor(x * 100) / 100'],
  ['accepting a check-out on the check-in day', 'if (nights < 1)', 'if (nights < 0)'],
  ['accepting stays longer than 30 nights', 'if (nights > 30)', 'if (nights > 31)'],
  ['a 2% weekend surcharge instead of 20%', 'nightlyRate * 0.2', 'nightlyRate * 0.02'],
];

function mutantModules(): string {
  const strip = (src: string) => src.replace(/^export /gm, '');
  const make = (name: string, src: string) => `const ${name} = (() => {\n${strip(src)}\nreturn quote;\n})();`;
  const parts = [make('reference', QUOTE_SOURCE)];
  MUTANTS.forEach(([, from, to], i) => {
    if (!QUOTE_SOURCE.includes(from)) throw new Error(`ts-4-15 mutant ${i}: "${from}" not found`);
    parts.push(make(`mutant${i}`, QUOTE_SOURCE.replace(from, to)));
  });
  return parts.join('\n\n');
}

const QUOTE_TESTS = `import { describe, it, expect, expectTypeOf } from 'vitest';
import { cases, type TestCase } from './solution';

// The grader's own copies of the price rules (so editing quote() in your file changes nothing).
${mutantModules()}

const MUTANTS: [string, typeof reference][] = [
${MUTANTS.map(([description], i) => `  [${JSON.stringify(description)}, mutant${i}],`).join('\n')}
];

function failures(fn: typeof reference): string[] {
  const failed: string[] = [];
  for (const c of cases) {
    try { c.run(fn); } catch { failed.push(c.name); }
  }
  return failed;
}

describe('your test cases', () => {
  it('there are at least 6, each with a name', () => {
    expect(cases.length).toBeGreaterThanOrEqual(6);
    for (const c of cases) expect(c.name.trim().length).toBeGreaterThan(0);
  });
  it('all pass against the correct price rules', () => {
    const wrong: string[] = [];
    for (const c of cases) {
      try { c.run(reference); } catch (e) { wrong.push(c.name + ' (' + (e instanceof Error ? e.message : String(e)) + ')'); }
    }
    expect(wrong).toEqual([]);
  });
});

describe('your test cases catch', () => {
  for (const [description, mutant] of MUTANTS) {
    it(description, () => {
      expect(failures(mutant).length).toBeGreaterThan(0);
    });
  }
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(): void {
  expectTypeOf(cases).toEqualTypeOf<TestCase[]>();
}
void typeTests;
`;

/** Month 4, week 16 tasks (lessons dn4-7, dn4-8). */
export const TS_MONTH4_B_WEEK16: CodeTask[] = [
  {
    id: 'ts-4-13',
    title: 'A Booking Wizard as a Reducer',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'Model a three-step booking wizard as a pure reducer over discriminated unions. Steps: guest { guest } → dates { guest } → review ' +
      '{ draft } → submitting { draft } → done { bookingId } or failed { draft, message }, where draft is { guest, checkIn, nights }. ' +
      'Actions: guest-entered { guest } (only in guest; a blank name after trimming changes nothing; store it trimmed); dates-entered ' +
      '{ checkIn, nights } (only in dates; needs "YYYY-MM-DD" and whole nights 1–30); back (dates → guest keeping the name, review → ' +
      'dates, failed → review); submitted (review → submitting); succeeded { bookingId } and failed { message } (only from submitting); ' +
      'retried (failed → submitting). Every action that is not legal in the current step returns the SAME state object. Never mutate. ' +
      'Also export initialWizard ({ step: \'guest\', guest: \'\' }). Type-level tests check the unions.',
    starterCode: `export interface Draft { guest: string; checkIn: string; nights: number }

export interface Wizard {
  step: string;
  guest?: string;
  draft?: Draft;
  bookingId?: string;
  message?: string;
}

export interface WizardAction {
  type: string;
  guest?: string;
  checkIn?: string;
  nights?: number;
  bookingId?: string;
  message?: string;
}

export const initialWizard: Wizard = { step: 'guest', guest: '' };

export function wizardReducer(state: Wizard, action: WizardAction): Wizard {
  return state;
}
`,
    hints: [
      'Wizard = { step: \'guest\'; guest: string } | { step: \'dates\'; guest: string } | { step: \'review\'; draft: Draft } | … and WizardAction likewise, one member per action.',
      'Switch on action.type, and inside each case check state.step before acting — that check also narrows state so its fields are available.',
      'Validate dates with /^\\d{4}-\\d{2}-\\d{2}$/.test(checkIn) and Number.isInteger(nights) && nights >= 1 && nights <= 30.',
      'End every case with return state; for the illegal paths, so the same object comes back.',
    ],
    solution: `export interface Draft { guest: string; checkIn: string; nights: number }

export type Wizard =
  | { step: 'guest'; guest: string }
  | { step: 'dates'; guest: string }
  | { step: 'review'; draft: Draft }
  | { step: 'submitting'; draft: Draft }
  | { step: 'done'; bookingId: string }
  | { step: 'failed'; draft: Draft; message: string };

export type WizardAction =
  | { type: 'guest-entered'; guest: string }
  | { type: 'dates-entered'; checkIn: string; nights: number }
  | { type: 'back' }
  | { type: 'submitted' }
  | { type: 'succeeded'; bookingId: string }
  | { type: 'failed'; message: string }
  | { type: 'retried' };

export const initialWizard: Wizard = { step: 'guest', guest: '' };

export function wizardReducer(state: Wizard, action: WizardAction): Wizard {
  switch (action.type) {
    case 'guest-entered': {
      const guest = action.guest.trim();
      if (state.step === 'guest' && guest !== '') return { step: 'dates', guest };
      return state;
    }
    case 'dates-entered': {
      const { checkIn, nights } = action;
      const valid = /^\\d{4}-\\d{2}-\\d{2}$/.test(checkIn) && Number.isInteger(nights) && nights >= 1 && nights <= 30;
      if (state.step === 'dates' && valid) return { step: 'review', draft: { guest: state.guest, checkIn, nights } };
      return state;
    }
    case 'back':
      if (state.step === 'dates') return { step: 'guest', guest: state.guest };
      if (state.step === 'review') return { step: 'dates', guest: state.draft.guest };
      if (state.step === 'failed') return { step: 'review', draft: state.draft };
      return state;
    case 'submitted':
      return state.step === 'review' ? { step: 'submitting', draft: state.draft } : state;
    case 'succeeded':
      return state.step === 'submitting' ? { step: 'done', bookingId: action.bookingId } : state;
    case 'failed':
      return state.step === 'submitting' ? { step: 'failed', draft: state.draft, message: action.message } : state;
    case 'retried':
      return state.step === 'failed' ? { step: 'submitting', draft: state.draft } : state;
  }
}
`,
    testCode: `import { describe, it, expect, expectTypeOf } from 'vitest';
import { wizardReducer, initialWizard, type Wizard, type WizardAction } from './solution';

const draft = { guest: 'Ama', checkIn: '2026-12-24', nights: 3 };
const run = (...actions: WizardAction[]) => actions.reduce(wizardReducer, initialWizard);

describe('the happy path', () => {
  it('walks guest → dates → review → submitting → done', () => {
    let s: Wizard = initialWizard;
    s = wizardReducer(s, { type: 'guest-entered', guest: '  Ama ' });
    expect(s).toEqual({ step: 'dates', guest: 'Ama' });
    s = wizardReducer(s, { type: 'dates-entered', checkIn: '2026-12-24', nights: 3 });
    expect(s).toEqual({ step: 'review', draft });
    s = wizardReducer(s, { type: 'submitted' });
    expect(s).toEqual({ step: 'submitting', draft });
    s = wizardReducer(s, { type: 'succeeded', bookingId: 'bk-9' });
    expect(s).toEqual({ step: 'done', bookingId: 'bk-9' });
  });
});

describe('validation', () => {
  it('ignores a blank guest', () => {
    const s = wizardReducer(initialWizard, { type: 'guest-entered', guest: '   ' });
    expect(s).toBe(initialWizard);
  });
  it('ignores invalid dates and nights', () => {
    const dates = run({ type: 'guest-entered', guest: 'Ama' });
    expect(wizardReducer(dates, { type: 'dates-entered', checkIn: '24/12/2026', nights: 3 })).toBe(dates);
    expect(wizardReducer(dates, { type: 'dates-entered', checkIn: '2026-12-24', nights: 0 })).toBe(dates);
    expect(wizardReducer(dates, { type: 'dates-entered', checkIn: '2026-12-24', nights: 31 })).toBe(dates);
    expect(wizardReducer(dates, { type: 'dates-entered', checkIn: '2026-12-24', nights: 2.5 })).toBe(dates);
  });
});

describe('going back and recovering', () => {
  it('goes back from dates and review, keeping what was entered', () => {
    const review = run({ type: 'guest-entered', guest: 'Ama' }, { type: 'dates-entered', checkIn: '2026-12-24', nights: 3 });
    expect(wizardReducer(review, { type: 'back' })).toEqual({ step: 'dates', guest: 'Ama' });
    expect(run({ type: 'guest-entered', guest: 'Ama' }, { type: 'back' })).toEqual({ step: 'guest', guest: 'Ama' });
  });
  it('fails, goes back to review, or retries', () => {
    const failed = run({ type: 'guest-entered', guest: 'Ama' }, { type: 'dates-entered', checkIn: '2026-12-24', nights: 3 }, { type: 'submitted' }, { type: 'failed', message: 'Room taken' });
    expect(failed).toEqual({ step: 'failed', draft, message: 'Room taken' });
    expect(wizardReducer(failed, { type: 'back' })).toEqual({ step: 'review', draft });
    expect(wizardReducer(failed, { type: 'retried' })).toEqual({ step: 'submitting', draft });
  });
});

describe('illegal actions', () => {
  it('return the very same state object', () => {
    expect(wizardReducer(initialWizard, { type: 'submitted' })).toBe(initialWizard);
    expect(wizardReducer(initialWizard, { type: 'back' })).toBe(initialWizard);
    const dates = run({ type: 'guest-entered', guest: 'Ama' });
    expect(wizardReducer(dates, { type: 'succeeded', bookingId: 'x' })).toBe(dates);
    expect(wizardReducer(dates, { type: 'guest-entered', guest: 'Kofi' })).toBe(dates);
    const done = run({ type: 'guest-entered', guest: 'Ama' }, { type: 'dates-entered', checkIn: '2026-12-24', nights: 3 }, { type: 'submitted' }, { type: 'succeeded', bookingId: 'b' });
    expect(wizardReducer(done, { type: 'retried' })).toBe(done);
    expect(wizardReducer(done, { type: 'back' })).toBe(done);
  });
  it('never mutate the previous state', () => {
    const review = run({ type: 'guest-entered', guest: 'Ama' }, { type: 'dates-entered', checkIn: '2026-12-24', nights: 3 });
    const before = JSON.stringify(review);
    wizardReducer(review, { type: 'submitted' });
    wizardReducer(review, { type: 'back' });
    expect(JSON.stringify(review)).toBe(before);
  });
});

// ---- type-level tests: checked by the compiler, never executed ----
function typeTests(): void {
  expectTypeOf<Wizard['step']>().toEqualTypeOf<'guest' | 'dates' | 'review' | 'submitting' | 'done' | 'failed'>();
  expectTypeOf<WizardAction['type']>().toEqualTypeOf<'guest-entered' | 'dates-entered' | 'back' | 'submitted' | 'succeeded' | 'failed' | 'retried'>();
  // @ts-expect-error a review step must carry its draft
  const reviewWithoutDraft: Wizard = { step: 'review' };
  // @ts-expect-error a done step has a booking id, not a draft
  const doneWithDraft: Wizard = { step: 'done', draft };
  void reviewWithoutDraft; void doneWithDraft;
}
void typeTests;
`,
  },
  {
    id: 'ts-4-14',
    title: 'Render Only What Changed',
    difficulty: 'Hard',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'BookingBoard({ bookings, onRowRender }) shows a "Notes" textarea, a status line "N starred", and a list labelled "Bookings" sorted by ' +
      'checkIn (without mutating the prop). Each row is a BookingRow showing the guest and a button "Star Ama" with aria-pressed. ' +
      'BookingRow must call onRender(booking.id) every time it renders — that is how the grader counts renders. The requirements are about ' +
      'performance: typing in Notes must re-render NO rows, and starring one booking must re-render ONLY that row. Use memo for the row, ' +
      'a stable toggle callback (useCallback with a functional state update), and useMemo for the sorted list.',
    starterCode: `import { useState } from 'react';

export interface Booking { id: string; guest: string; checkIn: string }

export function BookingRow({ booking, starred, onToggleStar, onRender }: {
  booking: Booking;
  starred: boolean;
  onToggleStar: (id: string) => void;
  onRender: (id: string) => void;
}) {
  onRender(booking.id);
  return (
    <li>
      {booking.guest}
      <button type="button" aria-pressed={starred} onClick={() => onToggleStar(booking.id)}>Star {booking.guest}</button>
    </li>
  );
}

export function BookingBoard({ bookings, onRowRender }: { bookings: Booking[]; onRowRender: (id: string) => void }) {
  const [notes, setNotes] = useState('');
  const [starred, setStarred] = useState<string[]>([]);
  const sorted = bookings.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  return (
    <section>
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p>{starred.length} starred</p>
      <ul aria-label="Bookings">
        {sorted.map((b) => (
          <BookingRow key={b.id} booking={b} starred={starred.includes(b.id)} onRender={onRowRender}
            onToggleStar={(id) => setStarred(starred.includes(id) ? starred.filter((s) => s !== id) : [...starred, id])} />
        ))}
      </ul>
    </section>
  );
}
`,
    hints: [
      'export const BookingRow = memo(function BookingRow(props: RowProps) { … }) — memo skips a render when every prop is shallow-equal to last time.',
      'The inline onToggleStar arrow is a new function on every render, which defeats memo. Use useCallback((id: string) => setStarred((s) => …), []) — the functional update means the callback needs no dependencies.',
      'bookings.sort(…) sorts the prop in place. Use useMemo(() => [...bookings].sort(…), [bookings]).',
      'Keep starred in a Set or array, but derive starred={…} per row as a boolean so unchanged rows get identical props.',
    ],
    solution: `import { memo, useCallback, useMemo, useState } from 'react';

export interface Booking { id: string; guest: string; checkIn: string }

interface RowProps {
  booking: Booking;
  starred: boolean;
  onToggleStar: (id: string) => void;
  onRender: (id: string) => void;
}

export const BookingRow = memo(function BookingRow({ booking, starred, onToggleStar, onRender }: RowProps) {
  onRender(booking.id);
  return (
    <li>
      {booking.guest}
      <button type="button" aria-pressed={starred} onClick={() => onToggleStar(booking.id)}>Star {booking.guest}</button>
    </li>
  );
});

export function BookingBoard({ bookings, onRowRender }: { bookings: Booking[]; onRowRender: (id: string) => void }) {
  const [notes, setNotes] = useState('');
  const [starred, setStarred] = useState<ReadonlySet<string>>(() => new Set());

  const toggleStar = useCallback((id: string) => {
    setStarred((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sorted = useMemo(() => [...bookings].sort((a, b) => a.checkIn.localeCompare(b.checkIn)), [bookings]);

  return (
    <section>
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p>{starred.size} starred</p>
      <ul aria-label="Bookings">
        {sorted.map((b) => (
          <BookingRow key={b.id} booking={b} starred={starred.has(b.id)} onRender={onRowRender} onToggleStar={toggleStar} />
        ))}
      </ul>
    </section>
  );
}
`,
    testCode: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingBoard, type Booking } from './solution';

const bookings: Booking[] = [
  { id: 'k', guest: 'Kofi', checkIn: '2026-12-22' },
  { id: 'a', guest: 'Ama', checkIn: '2026-12-20' },
  { id: 'e', guest: 'Esi', checkIn: '2026-12-24' },
];

describe('BookingBoard', () => {
  it('lists bookings by check-in date without mutating the prop', () => {
    const input = [...bookings];
    render(<BookingBoard bookings={input} onRowRender={vi.fn()} />);
    const names = within(screen.getByRole('list', { name: 'Bookings' })).getAllByRole('listitem').map((li) => li.firstChild?.textContent);
    expect(names).toEqual(['Ama', 'Kofi', 'Esi']);
    expect(input.map((b) => b.id)).toEqual(['k', 'a', 'e']);
  });
  it('renders each row once to begin with', () => {
    const onRowRender = vi.fn();
    render(<BookingBoard bookings={bookings} onRowRender={onRowRender} />);
    expect(onRowRender).toHaveBeenCalledTimes(3);
  });
  it('re-renders no rows while typing notes', async () => {
    const user = userEvent.setup();
    const onRowRender = vi.fn();
    render(<BookingBoard bookings={bookings} onRowRender={onRowRender} />);
    onRowRender.mockClear();
    await user.type(screen.getByLabelText('Notes'), 'VIP guests');
    expect(screen.getByLabelText('Notes')).toHaveValue('VIP guests');
    expect(onRowRender).toHaveBeenCalledTimes(0);
  });
  it('re-renders only the starred row', async () => {
    const user = userEvent.setup();
    const onRowRender = vi.fn();
    render(<BookingBoard bookings={bookings} onRowRender={onRowRender} />);
    onRowRender.mockClear();
    await user.click(screen.getByRole('button', { name: 'Star Kofi' }));
    expect(onRowRender.mock.calls).toEqual([['k']]);
    expect(screen.getByRole('button', { name: 'Star Kofi' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 starred')).toBeInTheDocument();
  });
  it('toggles stars on and off', async () => {
    const user = userEvent.setup();
    render(<BookingBoard bookings={bookings} onRowRender={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Star Ama' }));
    await user.click(screen.getByRole('button', { name: 'Star Esi' }));
    await user.click(screen.getByRole('button', { name: 'Star Ama' }));
    expect(screen.getByText('1 starred')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Star Ama' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Star Esi' })).toHaveAttribute('aria-pressed', 'true');
  });
});
`,
  },
  {
    id: 'ts-4-15',
    title: 'Tests That Catch Bugs (Mutation-Graded)',
    difficulty: 'Hard',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'This time you write the tests. The file gives you quote(checkIn, checkOut, nightlyRate) — read its rules carefully — and you export ' +
      'cases: TestCase[], each { name, run(q) } where run calls q and asserts with expect (from \'vitest\'), throwing when something is ' +
      'wrong. The grader runs your cases against its own correct copy (every case must pass) and against eight mutants — realistic bugs ' +
      'such as an off-by-one in nights, the wrong weekend days, the long-stay discount at the wrong boundary, rounding down, or a missing ' +
      'RangeError. Each mutant your cases catch is a passing check. Write at least 6 cases. Think about boundaries: exactly 7 nights, ' +
      'exactly 30 and 31, a Friday, a Sunday, an amount whose cents round up.',
    starterCode: `import { expect } from 'vitest';

// ---- given: the price rules under test (the grader uses its own copy of this code) ----
${QUOTE_SOURCE}
// ---- your test cases ----
export interface TestCase {
  name: string;
  run: (q: typeof quote) => void;
}

export const cases: TestCase[] = [
  {
    name: 'one weekday night costs the nightly rate',
    run: (q) => {
      expect(q('2026-12-01', '2026-12-02', 100).total).toBe(100);   // 1 Dec 2026 is a Tuesday
    },
  },
];
`,
    hints: [
      'Use a calendar: 4 Dec 2026 is a Friday, 5 Dec a Saturday, 6 Dec a Sunday. A Sunday-night stay distinguishes Fri+Sat from Sat+Sun weekends.',
      'Check the parts, not just the total: expect(q(…).nights).toBe(…), weekendSurcharge, discount.',
      'For errors: expect(() => q(\'2026-12-01\', \'2026-12-01\', 100)).toThrow(RangeError). Test 30 nights is accepted and 31 is not.',
      'Rounding: pick a stay whose exact total has a third decimal of 5 or more, work it out by hand, and assert the rounded total — e.g. 7 nights from Mon 7 Dec at 33.33 come to 221.9778 before rounding, so 221.98 (rounding down would give 221.97).',
      'A stay with a weekend AND 7+ nights shows whether the discount includes the surcharge.',
    ],
    solution: `import { expect } from 'vitest';

// ---- given: the price rules under test (the grader uses its own copy of this code) ----
${QUOTE_SOURCE}
// ---- your test cases ----
export interface TestCase {
  name: string;
  run: (q: typeof quote) => void;
}

// December 2026: the 1st is a Tuesday, the 4th a Friday, the 5th a Saturday, the 6th a Sunday.
export const cases: TestCase[] = [
  {
    name: 'one weekday night costs the nightly rate',
    run: (q) => {
      expect(q('2026-12-01', '2026-12-02', 100)).toEqual({ nights: 1, subtotal: 100, weekendSurcharge: 0, discount: 0, total: 100 });
    },
  },
  {
    name: 'Friday and Saturday nights carry a 20% surcharge',
    run: (q) => {
      const r = q('2026-12-04', '2026-12-06', 100);
      expect(r.nights).toBe(2);
      expect(r.weekendSurcharge).toBe(40);
      expect(r.total).toBe(240);
    },
  },
  {
    name: 'a Sunday night is not a weekend night',
    run: (q) => {
      expect(q('2026-12-06', '2026-12-07', 100).weekendSurcharge).toBe(0);
    },
  },
  {
    name: 'exactly 7 nights get 10% off, including the surcharge',
    run: (q) => {
      const r = q('2026-12-01', '2026-12-08', 100);   // Tue..Mon: Fri and Sat inside
      expect(r.nights).toBe(7);
      expect(r.weekendSurcharge).toBe(40);
      expect(r.discount).toBe(74);
      expect(r.total).toBe(666);
    },
  },
  {
    name: '6 nights get no discount',
    run: (q) => {
      expect(q('2026-12-07', '2026-12-13', 100).discount).toBe(0);
    },
  },
  {
    name: 'money is rounded to the nearest cent',
    run: (q) => {
      // Mon 7 .. Mon 14 Dec: 233.31 + 13.332 surcharge - 24.6642 discount = 221.9778 → 221.98 (not 221.97)
      expect(q('2026-12-07', '2026-12-14', 33.33).total).toBe(221.98);
    },
  },
  {
    name: 'check-out on the check-in day is rejected',
    run: (q) => {
      expect(() => q('2026-12-01', '2026-12-01', 100)).toThrow(RangeError);
    },
  },
  {
    name: '30 nights are allowed, 31 are not',
    run: (q) => {
      expect(q('2026-12-01', '2026-12-31', 100).nights).toBe(30);
      expect(() => q('2026-12-01', '2027-01-01', 100)).toThrow(RangeError);
    },
  },
];
`,
    testCode: QUOTE_TESTS,
  },
  {
    id: 'ts-4-16',
    title: 'Review and Fix: Unsafe, Inaccessible Cards',
    difficulty: 'Medium',
    language: 'typescript',
    category: CATEGORY,
    prompt:
      'A teammate\'s BookingCards({ bookings, onArchive }) "works" — and fails review. Fix every defect: (1) notes are injected with ' +
      'dangerouslySetInnerHTML — a guest can put a script in their notes; render them as text. (2) "Archive" is a clickable div; make it a ' +
      'real button named "Archive Ama\'s booking". (3) Photos have no alt text; use "Photo of Ama". (4) Overdue bookings are shown only by a ' +
      'red border; also show the word "Overdue". (5) The search box has only a placeholder; label it "Search guests" and keep the filtered ' +
      'list derived during render (no effect), with a status line "2 bookings". (6) Cards use index keys, so each card\'s "Show notes" ' +
      'toggle sticks to a position instead of a booking when the list is filtered; key cards by id. Keep the list as <ul aria-label="Bookings">.',
    starterCode: `import { useEffect, useState } from 'react';

export interface Booking { id: string; guest: string; notes: string; overdue: boolean; photoUrl: string }

function Card({ booking, onArchive }: { booking: Booking; onArchive: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li style={{ border: booking.overdue ? '2px solid red' : '1px solid #ccc' }}>
      <img src={booking.photoUrl} />
      <h3>{booking.guest}</h3>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>Show notes</button>
      {open && <div dangerouslySetInnerHTML={{ __html: booking.notes }} />}
      <div className="link" onClick={() => onArchive(booking.id)}>Archive</div>
    </li>
  );
}

export function BookingCards({ bookings, onArchive }: { bookings: Booking[]; onArchive: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(bookings);
  useEffect(() => {
    setVisible(bookings.filter((b) => b.guest.toLowerCase().includes(search.toLowerCase())));
  }, [bookings, search]);
  return (
    <section>
      <input placeholder="Search guests" value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul aria-label="Bookings">
        {visible.map((b, i) => <Card key={i} booking={b} onArchive={onArchive} />)}
      </ul>
    </section>
  );
}
`,
    hints: [
      'React escapes text for you: {open && <p>{booking.notes}</p>} can never run a script.',
      'A real button: <button type="button" onClick={…} aria-label={\'Archive \' + booking.guest + "\'s booking"}>Archive</button>.',
      'const visible = bookings.filter(…) during render replaces both the extra state and the effect.',
      'The status line: <p role="status">{visible.length === 1 ? \'1 booking\' : visible.length + \' bookings\'}</p>.',
    ],
    solution: `import { useState } from 'react';

export interface Booking { id: string; guest: string; notes: string; overdue: boolean; photoUrl: string }

function Card({ booking, onArchive }: { booking: Booking; onArchive: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={booking.overdue ? 'card overdue' : 'card'}>
      <img src={booking.photoUrl} alt={'Photo of ' + booking.guest} />
      <h3>{booking.guest}</h3>
      {booking.overdue && <p className="badge">Overdue</p>}
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Show notes</button>
      {open && <p>{booking.notes}</p>}
      <button type="button" aria-label={'Archive ' + booking.guest + "'s booking"} onClick={() => onArchive(booking.id)}>Archive</button>
    </li>
  );
}

export function BookingCards({ bookings, onArchive }: { bookings: Booking[]; onArchive: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const visible = bookings.filter((b) => b.guest.toLowerCase().includes(needle));
  return (
    <section>
      <label htmlFor="guest-search">Search guests</label>
      <input id="guest-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      <p role="status">{visible.length === 1 ? '1 booking' : visible.length + ' bookings'}</p>
      <ul aria-label="Bookings">
        {visible.map((b) => <Card key={b.id} booking={b} onArchive={onArchive} />)}
      </ul>
    </section>
  );
}
`,
    testCode: `import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingCards, type Booking } from './solution';

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const bookings: Booking[] = [
  { id: 'a', guest: 'Ama', notes: 'Late arrival', overdue: false, photoUrl: PIXEL },
  { id: 'k', guest: 'Kofi', notes: '<img src=x onerror="window.__pwned = true">Allergic to nuts', overdue: true, photoUrl: PIXEL },
  { id: 'e', guest: 'Esi', notes: 'Quiet room', overdue: false, photoUrl: PIXEL },
];

const card = (guest: string) => within(screen.getByRole('list', { name: 'Bookings' })).getAllByRole('listitem').find((li) => within(li).queryByRole('heading', { name: guest })) as HTMLElement;

describe('BookingCards review fixes', () => {
  it('renders guest notes as text, never as HTML', async () => {
    const user = userEvent.setup();
    render(<BookingCards bookings={bookings} onArchive={vi.fn()} />);
    await user.click(within(card('Kofi')).getByRole('button', { name: 'Show notes' }));
    expect(within(card('Kofi')).getByText(/Allergic to nuts/)).toHaveTextContent('<img src=x onerror=');
    expect(card('Kofi').querySelectorAll('img')).toHaveLength(1);
  });
  it('archives through a real, named button', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    render(<BookingCards bookings={bookings} onArchive={onArchive} />);
    await user.click(screen.getByRole('button', { name: "Archive Esi's booking" }));
    expect(onArchive).toHaveBeenCalledWith('e');
  });
  it('describes every photo', () => {
    render(<BookingCards bookings={bookings} onArchive={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Photo of Ama' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });
  it('says "Overdue" instead of relying on colour', () => {
    render(<BookingCards bookings={bookings} onArchive={vi.fn()} />);
    expect(card('Kofi')).toHaveTextContent('Overdue');
    expect(card('Ama')).not.toHaveTextContent('Overdue');
  });
  it('has a labelled search with a live count', async () => {
    const user = userEvent.setup();
    render(<BookingCards bookings={bookings} onArchive={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('3 bookings');
    await user.type(screen.getByLabelText('Search guests'), 'a');
    expect(screen.getByRole('status')).toHaveTextContent('1 booking');
  });
  it('keeps each card\\'s state with its booking when filtering', async () => {
    const user = userEvent.setup();
    render(<BookingCards bookings={bookings} onArchive={vi.fn()} />);
    await user.click(within(card('Esi')).getByRole('button', { name: 'Show notes' }));
    await user.type(screen.getByLabelText('Search guests'), 'e');
    expect(within(card('Esi')).getByRole('button', { name: 'Show notes' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(card('Esi')).getByText('Quiet room')).toBeInTheDocument();
  });
  it('reflects new bookings from the parent immediately', () => {
    const { rerender } = render(<BookingCards bookings={bookings.slice(0, 1)} onArchive={vi.fn()} />);
    rerender(<BookingCards bookings={bookings} onArchive={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('3 bookings');
  });
});
`,
  },
];
