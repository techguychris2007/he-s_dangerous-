/** Removes student data from an error report before it leaves the browser. Kept free of imports so
 *  tests/check-monitoring.cjs can test it directly. Error reports keep what is needed to fix a bug
 *  (message, stack, page route, browser) and never carry who the learner is or what they typed. */

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT = /\beyJ[\w-]{6,}\.[\w-]{6,}\.[\w-]{6,}/g;
const SECRET_PARAM = /\b(access_token|refresh_token|id_token|token|code|password|apikey|api_key|key)=([^&#\s"']+)/gi;
const BEARER = /\bBearer\s+[\w.~+/-]+=*/gi;
const MAX_STRING = 1000;
const MAX_DEPTH = 8;

/** Redacts emails, tokens and secret-looking parameters in free text, and caps its length. */
export function scrubText(value: string): string {
  const cleaned = value
    .replace(JWT, '[token]')
    .replace(BEARER, 'Bearer [token]')
    .replace(SECRET_PARAM, '$1=[redacted]')
    .replace(EMAIL, '[email]');
  return cleaned.length > MAX_STRING ? cleaned.slice(0, MAX_STRING) + '…' : cleaned;
}

/** Keeps a URL's origin and route only: no query string, and no hash parameters (a sign-in redirect
 *  carries tokens in the hash). Hash routes such as `/#/labs/sqli` are kept, minus any `?query`. */
export function scrubUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = '';
    url.username = '';
    url.password = '';
    let hash = url.hash.split('?')[0];
    if (hash.includes('=')) hash = '';
    url.hash = hash;
    return scrubText(url.toString());
  } catch {
    return scrubText(value.split('?')[0]);
  }
}

function walk(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return /^https?:\/\//i.test(value) ? scrubUrl(value) : scrubText(value);
  if (depth >= MAX_DEPTH || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => walk(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) out[key] = walk(item, depth + 1);
  return out;
}

type Report = {
  user?: unknown;
  request?: { url?: string; headers?: unknown; cookies?: unknown; data?: unknown; query_string?: unknown; [key: string]: unknown };
  breadcrumbs?: { category?: string; [key: string]: unknown }[];
  [key: string]: unknown;
};

/** Scrubs a whole Sentry event: drops the user, cookies, headers, request bodies and typed-input
 *  breadcrumbs, then redacts every remaining string. */
export function scrubReport<T extends object>(event: T): T {
  const copy = { ...event } as Report;
  delete copy.user;
  if (copy.request) copy.request = copy.request.url ? { url: scrubUrl(copy.request.url) } : {};
  if (copy.breadcrumbs) copy.breadcrumbs = copy.breadcrumbs.filter(crumb => !isPrivateBreadcrumb(crumb));
  return walk(copy, 0) as T;
}

/** Keystroke and input breadcrumbs can hold lesson answers, code or passwords. */
export function isPrivateBreadcrumb(crumb: { category?: string }): boolean {
  return crumb.category === 'ui.input' || crumb.category === 'ui.keypress';
}
