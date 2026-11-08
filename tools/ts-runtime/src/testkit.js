// A Vitest-compatible subset for the in-browser TypeScript runner. Tests written against it read
// exactly like real Vitest tests (`import { describe, it, expect, vi } from 'vitest'`), so what a
// learner practises here transfers unchanged to a real project. Only what is declared in
// types/testkit.d.ts exists; anything else is a type error, never a silent no-op.
//
// Runs in a dedicated Worker (no DOM) and inside the sandboxed grading iframe (with DOM, where
// dom-testing.js extends `expect` with jest-dom style matchers).

const realSetTimeout = globalThis.setTimeout.bind(globalThis);
const realClearTimeout = globalThis.clearTimeout.bind(globalThis);
const realSetInterval = globalThis.setInterval.bind(globalThis);
const realClearInterval = globalThis.clearInterval.bind(globalThis);
const RealDate = globalThis.Date;

// ---------------------------------------------------------------- formatting

function isElement(v) {
  return typeof Element !== 'undefined' && v instanceof Element;
}

export function format(value, depth = 0) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value._isMockFunction ? '[vi.fn()]' : `[Function ${value.name || 'anonymous'}]`;
  if (value && value.$$asymmetric) return value.toString();
  if (isElement(value)) {
    const attrs = Array.from(value.attributes).slice(0, 4).map((a) => ` ${a.name}="${a.value}"`).join('');
    const text = (value.textContent || '').replace(/\s+/g, ' ').trim();
    const tag = value.tagName.toLowerCase();
    return `<${tag}${attrs}>${text ? (text.length > 40 ? text.slice(0, 40) + '…' : text) + `</${tag}>` : ''}`;
  }
  if (value instanceof RealDate) return `Date(${isNaN(value.getTime()) ? 'Invalid' : value.toISOString()})`;
  if (value instanceof RegExp) return String(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (depth > 2) return Array.isArray(value) ? '[…]' : '{…}';
  if (Array.isArray(value)) return `[${value.slice(0, 10).map((v) => format(v, depth + 1)).join(', ')}${value.length > 10 ? ', …' : ''}]`;
  if (value instanceof Map) return `Map {${Array.from(value).slice(0, 8).map(([k, v]) => `${format(k, depth + 1)} => ${format(v, depth + 1)}`).join(', ')}}`;
  if (value instanceof Set) return `Set {${Array.from(value).slice(0, 10).map((v) => format(v, depth + 1)).join(', ')}}`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    const name = value.constructor && value.constructor !== Object && value.constructor.name ? `${value.constructor.name} ` : '';
    return `${name}{${keys.slice(0, 10).map((k) => `${k}: ${format(value[k], depth + 1)}`).join(', ')}${keys.length > 10 ? ', …' : ''}}`;
  }
  return String(value);
}

function clip(text, max = 300) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ---------------------------------------------------------------- equality

function asymmetricMatch(a, b) {
  if (a && a.$$asymmetric) return a.match(b);
  if (b && b.$$asymmetric) return b.match(a);
  return undefined;
}

export function equals(a, b, strict = false, seen = []) {
  const asym = asymmetricMatch(a, b);
  if (asym !== undefined) return asym;
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (seen.some(([x, y]) => x === a && y === b)) return true;
  const nextSeen = [...seen, [a, b]];
  if (a instanceof RealDate || b instanceof RealDate) return a instanceof RealDate && b instanceof RealDate && a.getTime() === b.getTime();
  if (a instanceof RegExp || b instanceof RegExp) return String(a) === String(b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !equals(v, b.get(k), strict, nextSeen)) return false;
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    for (const v of a) if (!Array.from(b).some((w) => equals(v, w, strict, nextSeen))) return false;
    return true;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => equals(v, b[i], strict, nextSeen));
  }
  const keysOf = (o) => Object.keys(o).filter((k) => strict || o[k] !== undefined);
  const ka = keysOf(a);
  const kb = keysOf(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equals(a[k], b[k], strict, nextSeen));
}

function asymmetric(name, match, describe) {
  return { $$asymmetric: true, match, toString: () => `${name}(${describe})` };
}

// ---------------------------------------------------------------- expect

export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

const matchers = {
  toBe(actual, expected) {
    return { pass: Object.is(actual, expected), message: () => `expected ${format(actual)} to be ${format(expected)}${equals(actual, expected) && typeof actual === 'object' ? ' (same contents, but not the same object — use toEqual)' : ''}` };
  },
  toEqual(actual, expected) {
    return { pass: equals(actual, expected), message: () => `expected ${format(actual)} to equal ${format(expected)}` };
  },
  toStrictEqual(actual, expected) {
    return { pass: equals(actual, expected, true), message: () => `expected ${format(actual)} to strictly equal ${format(expected)}` };
  },
  toBeTruthy(actual) { return { pass: !!actual, message: () => `expected ${format(actual)} to be truthy` }; },
  toBeFalsy(actual) { return { pass: !actual, message: () => `expected ${format(actual)} to be falsy` }; },
  toBeNull(actual) { return { pass: actual === null, message: () => `expected ${format(actual)} to be null` }; },
  toBeUndefined(actual) { return { pass: actual === undefined, message: () => `expected ${format(actual)} to be undefined` }; },
  toBeDefined(actual) { return { pass: actual !== undefined, message: () => `expected value to be defined` }; },
  toBeNaN(actual) { return { pass: Number.isNaN(actual), message: () => `expected ${format(actual)} to be NaN` }; },
  toBeGreaterThan(actual, n) { return { pass: actual > n, message: () => `expected ${format(actual)} to be greater than ${format(n)}` }; },
  toBeGreaterThanOrEqual(actual, n) { return { pass: actual >= n, message: () => `expected ${format(actual)} to be >= ${format(n)}` }; },
  toBeLessThan(actual, n) { return { pass: actual < n, message: () => `expected ${format(actual)} to be less than ${format(n)}` }; },
  toBeLessThanOrEqual(actual, n) { return { pass: actual <= n, message: () => `expected ${format(actual)} to be <= ${format(n)}` }; },
  toBeCloseTo(actual, expected, digits = 2) {
    return { pass: Math.abs(actual - expected) < Math.pow(10, -digits) / 2, message: () => `expected ${format(actual)} to be close to ${format(expected)} (${digits} digits)` };
  },
  toBeInstanceOf(actual, ctor) {
    return { pass: actual instanceof ctor, message: () => `expected ${format(actual)} to be an instance of ${ctor && ctor.name}` };
  },
  toBeTypeOf(actual, type) {
    return { pass: typeof actual === type, message: () => `expected ${format(actual)} to be of type ${type} (got ${typeof actual})` };
  },
  toContain(actual, item) {
    const pass = typeof actual === 'string' ? actual.includes(item) : actual != null && Array.from(actual).includes(item);
    return { pass, message: () => `expected ${format(actual)} to contain ${format(item)}` };
  },
  toContainEqual(actual, item) {
    return { pass: actual != null && Array.from(actual).some((v) => equals(v, item)), message: () => `expected ${format(actual)} to contain an item equal to ${format(item)}` };
  },
  toHaveLength(actual, n) {
    const len = actual == null ? undefined : actual.length;
    return { pass: len === n, message: () => `expected length ${format(len)} to be ${n} (value: ${format(actual)})` };
  },
  toHaveProperty(actual, path, value) {
    const parts = Array.isArray(path) ? path : String(path).split('.');
    let cur = actual;
    let found = true;
    for (const p of parts) {
      if (cur != null && (typeof cur === 'object' || typeof cur === 'function') && p in cur) cur = cur[p];
      else { found = false; break; }
    }
    const pass = found && (arguments.length < 3 || equals(cur, value));
    return { pass, message: () => `expected ${format(actual)} to have property ${parts.join('.')}${arguments.length >= 3 ? ` equal to ${format(value)}` : ''}` };
  },
  toMatch(actual, pattern) {
    const pass = typeof actual === 'string' && (pattern instanceof RegExp ? pattern.test(actual) : actual.includes(pattern));
    return { pass, message: () => `expected ${format(actual)} to match ${format(pattern)}` };
  },
  toMatchObject(actual, expected) {
    const subset = (a, e) => {
      if (e && e.$$asymmetric) return e.match(a);
      if (typeof e !== 'object' || e === null) return equals(a, e);
      if (typeof a !== 'object' || a === null) return false;
      if (Array.isArray(e)) return Array.isArray(a) && a.length === e.length && e.every((v, i) => subset(a[i], v));
      return Object.keys(e).every((k) => subset(a[k], e[k]));
    };
    return { pass: subset(actual, expected), message: () => `expected ${format(actual)} to match object ${format(expected)}` };
  },
  toThrow(actual, expected) {
    if (typeof actual !== 'function') return { pass: false, message: () => 'toThrow needs a function: expect(() => code()).toThrow()' };
    let thrown = null;
    let didThrow = false;
    try { actual(); } catch (e) { didThrow = true; thrown = e; }
    let pass = didThrow;
    if (didThrow && expected !== undefined) {
      const msg = thrown && thrown.message !== undefined ? thrown.message : String(thrown);
      if (typeof expected === 'string') pass = msg.includes(expected);
      else if (expected instanceof RegExp) pass = expected.test(msg);
      else if (typeof expected === 'function') pass = thrown instanceof expected;
    }
    return {
      pass,
      message: () => didThrow
        ? `expected the thrown error ${format(thrown)} to match ${format(expected)}`
        : `expected the function to throw${expected !== undefined ? ` ${format(expected)}` : ''}, but it returned normally`,
    };
  },
  toHaveBeenCalled(actual) {
    assertMock(actual, 'toHaveBeenCalled');
    return { pass: actual.mock.calls.length > 0, message: () => `expected the mock to have been called (calls: ${actual.mock.calls.length})` };
  },
  toHaveBeenCalledTimes(actual, n) {
    assertMock(actual, 'toHaveBeenCalledTimes');
    return { pass: actual.mock.calls.length === n, message: () => `expected the mock to have been called ${n} times, but it was called ${actual.mock.calls.length} times` };
  },
  toHaveBeenCalledWith(actual, ...args) {
    assertMock(actual, 'toHaveBeenCalledWith');
    return {
      pass: actual.mock.calls.some((call) => equals(call, args)),
      message: () => `expected the mock to have been called with ${format(args)}; calls were ${format(actual.mock.calls)}`,
    };
  },
  toHaveBeenLastCalledWith(actual, ...args) {
    assertMock(actual, 'toHaveBeenLastCalledWith');
    const last = actual.mock.calls[actual.mock.calls.length - 1];
    return { pass: !!last && equals(last, args), message: () => `expected the last call to be ${format(args)}, got ${format(last)}` };
  },
};

function assertMock(value, name) {
  if (!value || !value._isMockFunction) throw new AssertionError(`${name} needs a mock created with vi.fn() or vi.spyOn(), got ${format(value)}`);
}

function buildAssertions(actual, negate, mode, label) {
  const api = {};
  for (const name of Object.keys(matchers)) {
    api[name] = (...args) => {
      const evaluate = (value) => {
        const result = matchers[name](value, ...args);
        if (result.pass === negate) {
          const msg = result.message();
          const detail = negate ? msg.replace(/^expected (.*?) to /, 'expected $1 not to ') : msg;
          // expect(value, 'what this checks') — Vitest's optional message, shown before the detail.
          throw new AssertionError(label ? `${label} (${detail})` : detail);
        }
      };
      if (mode === 'resolves') {
        return Promise.resolve(actual).then(evaluate, (e) => { throw new AssertionError(`expected the promise to resolve, but it rejected with ${format(e)}`); });
      }
      if (mode === 'rejects') {
        return Promise.resolve(actual).then(
          (v) => { throw new AssertionError(`expected the promise to reject, but it resolved with ${format(v)}`); },
          (e) => {
            if (name === 'toThrow') return evaluate(() => { throw e; });
            return evaluate(e);
          },
        );
      }
      evaluate(actual);
      return undefined;
    };
  }
  return api;
}

export function expect(actual, message) {
  const api = buildAssertions(actual, false, undefined, message);
  api.not = buildAssertions(actual, true, undefined, message);
  api.resolves = buildAssertions(actual, false, 'resolves', message);
  api.resolves.not = buildAssertions(actual, true, 'resolves', message);
  api.rejects = buildAssertions(actual, false, 'rejects', message);
  api.rejects.not = buildAssertions(actual, true, 'rejects', message);
  return api;
}

expect.extend = (more) => { Object.assign(matchers, more); };
expect.any = (ctor) => asymmetric('Any', (v) => v != null && (v.constructor === ctor || v instanceof ctor || (ctor === Number && typeof v === 'number') || (ctor === String && typeof v === 'string') || (ctor === Boolean && typeof v === 'boolean') || (ctor === Function && typeof v === 'function')), ctor && ctor.name);
expect.anything = () => asymmetric('Anything', (v) => v !== null && v !== undefined, '');
expect.objectContaining = (obj) => asymmetric('ObjectContaining', (v) => v != null && typeof v === 'object' && Object.keys(obj).every((k) => equals(v[k], obj[k])), format(obj));
expect.arrayContaining = (arr) => asymmetric('ArrayContaining', (v) => Array.isArray(v) && arr.every((item) => v.some((x) => equals(x, item))), format(arr));
expect.stringContaining = (s) => asymmetric('StringContaining', (v) => typeof v === 'string' && v.includes(s), format(s));
expect.stringMatching = (re) => asymmetric('StringMatching', (v) => typeof v === 'string' && new RegExp(re).test(v), format(re));

// expectTypeOf is checked by the compiler (see types/testkit.d.ts); at run time it does nothing.
export function expectTypeOf() {
  // Every property and every call returns the same chain, so .returns.toEqualTypeOf<T>() etc. work.
  // 'then' stays undefined so a test that returns the chain is not mistaken for a pending promise.
  const chain = new Proxy(function () {}, { get: (_t, key) => (key === 'then' ? undefined : chain), apply: () => chain });
  return chain;
}
export const assertType = () => {};

// ---------------------------------------------------------------- vi

function createMock(impl) {
  const state = { calls: [], results: [], instances: [], impl, once: [] };
  const mock = function (...args) {
    state.calls.push(args);
    state.instances.push(this);
    const f = state.once.length ? state.once.shift() : state.impl;
    try {
      const value = f ? f.apply(this, args) : undefined;
      state.results.push({ type: 'return', value });
      return value;
    } catch (error) {
      state.results.push({ type: 'throw', value: error });
      throw error;
    }
  };
  mock._isMockFunction = true;
  mock.mock = {
    get calls() { return state.calls; },
    get results() { return state.results; },
    get instances() { return state.instances; },
    get lastCall() { return state.calls[state.calls.length - 1]; },
  };
  mock.mockImplementation = (f) => { state.impl = f; return mock; };
  mock.mockImplementationOnce = (f) => { state.once.push(f); return mock; };
  mock.mockReturnValue = (v) => mock.mockImplementation(() => v);
  mock.mockReturnValueOnce = (v) => mock.mockImplementationOnce(() => v);
  mock.mockResolvedValue = (v) => mock.mockImplementation(() => Promise.resolve(v));
  mock.mockResolvedValueOnce = (v) => mock.mockImplementationOnce(() => Promise.resolve(v));
  mock.mockRejectedValue = (e) => mock.mockImplementation(() => Promise.reject(e));
  mock.mockRejectedValueOnce = (e) => mock.mockImplementationOnce(() => Promise.reject(e));
  mock.mockClear = () => { state.calls.length = 0; state.results.length = 0; state.instances.length = 0; return mock; };
  mock.mockReset = () => { mock.mockClear(); state.impl = undefined; state.once.length = 0; return mock; };
  return mock;
}

const spies = [];

let fake = null; // { now, timers: Map<id, {at, fn, args, interval}>, nextId }

function fakeSetTimeout(fn, ms = 0, ...args) {
  const id = fake.nextId++;
  fake.timers.set(id, { at: fake.now + Math.max(0, Number(ms) || 0), fn, args, interval: null, seq: id });
  return id;
}
function fakeSetInterval(fn, ms = 0, ...args) {
  const id = fake.nextId++;
  const every = Math.max(1, Number(ms) || 0);
  fake.timers.set(id, { at: fake.now + every, fn, args, interval: every, seq: id });
  return id;
}
function fakeClear(id) { if (fake) fake.timers.delete(id); }

function nextDueTimer(limit) {
  let best = null;
  for (const [id, t] of fake.timers) {
    if (t.at <= limit && (!best || t.at < best[1].at || (t.at === best[1].at && t.seq < best[1].seq))) best = [id, t];
  }
  return best;
}

function fireTimer(id, t) {
  fake.now = Math.max(fake.now, t.at);
  if (t.interval) {
    t.at += t.interval;
    t.seq = fake.nextId++;
  } else {
    fake.timers.delete(id);
  }
  if (typeof t.fn === 'function') t.fn(...t.args);
}

function makeFakeDate() {
  function FakeDate(...args) {
    if (!(this instanceof FakeDate)) return new RealDate(fake ? fake.now : RealDate.now()).toString();
    return args.length === 0 ? new RealDate(fake ? fake.now : RealDate.now()) : new RealDate(...args);
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = () => (fake ? fake.now : RealDate.now());
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  return FakeDate;
}

export const vi = {
  fn: (impl) => createMock(impl),
  isMockFunction: (f) => !!(f && f._isMockFunction),
  spyOn(obj, method) {
    const original = obj[method];
    if (typeof original !== 'function') throw new Error(`vi.spyOn: ${String(method)} is not a function`);
    const spy = createMock(function (...args) { return original.apply(this, args); });
    spy.mockRestore = () => { obj[method] = original; };
    obj[method] = spy;
    spies.push(spy);
    return spy;
  },
  restoreAllMocks() { while (spies.length) spies.pop().mockRestore(); },
  useFakeTimers(options) {
    const start = options && options.now !== undefined ? new RealDate(options.now).getTime() : RealDate.now();
    fake = { now: start, timers: new Map(), nextId: 1 };
    globalThis.setTimeout = fakeSetTimeout;
    globalThis.clearTimeout = fakeClear;
    globalThis.setInterval = fakeSetInterval;
    globalThis.clearInterval = fakeClear;
    globalThis.Date = makeFakeDate();
    return vi;
  },
  useRealTimers() {
    fake = null;
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
    globalThis.setInterval = realSetInterval;
    globalThis.clearInterval = realClearInterval;
    globalThis.Date = RealDate;
    return vi;
  },
  isFakeTimers: () => fake !== null,
  setSystemTime(time) {
    if (!fake) throw new Error('vi.setSystemTime needs vi.useFakeTimers() first');
    fake.now = new RealDate(time).getTime();
    return vi;
  },
  advanceTimersByTime(ms) {
    if (!fake) throw new Error('vi.advanceTimersByTime needs vi.useFakeTimers() first');
    const target = fake.now + ms;
    for (let guard = 0; guard < 10000; guard++) {
      const next = nextDueTimer(target);
      if (!next) break;
      fireTimer(next[0], next[1]);
    }
    fake.now = target;
    return vi;
  },
  async advanceTimersByTimeAsync(ms) {
    if (!fake) throw new Error('vi.advanceTimersByTimeAsync needs vi.useFakeTimers() first');
    const target = fake.now + ms;
    for (let guard = 0; guard < 10000; guard++) {
      await flushMicrotasks();
      const next = nextDueTimer(target);
      if (!next) break;
      fireTimer(next[0], next[1]);
    }
    fake.now = target;
    await flushMicrotasks();
    return vi;
  },
  runAllTimers() {
    if (!fake) throw new Error('vi.runAllTimers needs vi.useFakeTimers() first');
    for (let guard = 0; guard < 10000 && fake.timers.size; guard++) {
      const next = nextDueTimer(Infinity);
      fireTimer(next[0], next[1]);
    }
    return vi;
  },
  getTimerCount: () => (fake ? fake.timers.size : 0),
};

async function flushMicrotasks() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

// ---------------------------------------------------------------- registry & runner

function newSuite(name, parent) {
  return { name, parent, items: [], beforeEach: [], afterEach: [], beforeAll: [], afterAll: [] };
}
let root = newSuite('', null);
let current = root;
const globalAfterEach = [];

export function describe(name, fn) {
  const suite = newSuite(name, current);
  current.items.push({ suite });
  const prev = current;
  current = suite;
  try { fn(); } finally { current = prev; }
}

export function test(name, fn, timeout) {
  current.items.push({ test: { name, fn, timeout: timeout ?? 5000 } });
}
export const it = test;
export const beforeEach = (fn) => { current.beforeEach.push(fn); };
export const afterEach = (fn) => { current.afterEach.push(fn); };
export const beforeAll = (fn) => { current.beforeAll.push(fn); };
export const afterAll = (fn) => { current.afterAll.push(fn); };

/** Used by dom-testing.js to unmount rendered trees after every test, like Testing Library's auto-cleanup. */
export function registerGlobalAfterEach(fn) { globalAfterEach.push(fn); }

function withTimeout(promise, ms, name) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = realSetTimeout(() => reject(new Error(`Test timed out after ${ms} ms — an await that never resolves, or a timer that never fires? ("${name}")`)), ms); }),
  ]).finally(() => realClearTimeout(timer));
}

function errorText(e) {
  if (e instanceof AssertionError) return e.message;
  if (e && e.name && e.message !== undefined) return `${e.name}: ${e.message}`;
  return format(e);
}

/** Runs every registered test in order. `report(line)` receives "[PASS] name" / "[FAIL] name: why". */
export async function runRegisteredTests(report) {
  let passed = 0;
  let total = 0;
  const chain = (suite) => { const out = []; for (let s = suite; s; s = s.parent) out.unshift(s); return out; };

  async function runSuite(suite) {
    try {
      for (const hook of suite.beforeAll) await hook();
    } catch (e) {
      report(`[FAIL] ${suite.name || 'setup'}: beforeAll failed — ${clip(errorText(e))}`);
      total++;
      return;
    }
    for (const item of suite.items) {
      if (item.suite) { await runSuite(item.suite); continue; }
      const t = item.test;
      const suites = chain(suite);
      const fullName = [...suites.map((s) => s.name).filter(Boolean), t.name].join(' › ');
      total++;
      let failure = null;
      try {
        for (const s of suites) for (const hook of s.beforeEach) await hook();
        await withTimeout(Promise.resolve().then(() => t.fn()), t.timeout, t.name);
      } catch (e) {
        failure = e;
      }
      for (const s of suites.slice().reverse()) {
        for (const hook of s.afterEach) {
          try { await hook(); } catch (e) { failure = failure || e; }
        }
      }
      for (const hook of globalAfterEach) {
        try { await hook(); } catch (e) { failure = failure || e; }
      }
      if (fake) vi.useRealTimers();
      vi.restoreAllMocks();
      if (failure) report(`[FAIL] ${fullName}: ${clip(errorText(failure))}`);
      else { passed++; report(`[PASS] ${fullName}`); }
    }
    for (const hook of suite.afterAll) {
      try { await hook(); } catch (e) { report(`[FAIL] ${suite.name || 'teardown'}: afterAll failed — ${clip(errorText(e))}`); total++; }
    }
  }

  await runSuite(root);
  root = newSuite('', null);
  current = root;
  return { passed, total };
}

export const __dw_internal = { realSetTimeout, realClearTimeout, RealDate, isFake: () => fake !== null, format, clip };
