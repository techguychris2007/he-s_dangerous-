/** Where to go after signing in or creating an account.
 *
 *  A visitor who presses Start on a lesson or lab is sent to sign up; this remembers that page so the
 *  new account lands exactly where they were, instead of on the Overview. Kept in sessionStorage, so
 *  it survives the OAuth round trip in the same tab but never leaks into a later visit.
 *
 *  Only in-app paths are accepted ("/lab/x", "/roadmap?track=defensive"): anything else, including
 *  protocol-relative "//host" values and the sign-in pages themselves, falls back to the Overview. */
const KEY = 'darkworld.afterLogin';
const ENTRY_PAGES = /^\/(login|welcome|reset-password)(\/|\?|$)/;

function safe(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  if (ENTRY_PAGES.test(path) || path.length > 512) return null;
  return path;
}

export function rememberReturnTo(path: string) {
  const value = safe(path);
  try { if (value) sessionStorage.setItem(KEY, value); else sessionStorage.removeItem(KEY); } catch { /* storage blocked: land on the Overview */ }
}

/** The remembered page without clearing it, for copy such as "you'll go straight back to it". */
export function peekReturnTo(): string | null {
  try { return safe(sessionStorage.getItem(KEY)); } catch { return null; }
}

/** The remembered page, cleared so it applies once. */
export function takeReturnTo(): string {
  const value = peekReturnTo();
  try { sessionStorage.removeItem(KEY); } catch { /* nothing stored */ }
  return value ?? '/';
}
