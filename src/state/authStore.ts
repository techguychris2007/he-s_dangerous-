import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, AUTH_STORAGE_KEY } from '../lib/supabaseClient';

interface AuthResult {
  error: string | null;
}

interface SignUpResult extends AuthResult {
  needsEmailConfirm: boolean;
}

/** Reads whatever session is currently sitting in localStorage, without going through
 *  supabase.auth.getSession() — which, when the access token has fully expired AND the device is
 *  offline (so it can't refresh), returns `session: null` even though a perfectly valid refresh token
 *  is sitting right there in storage; it just can't be verified with no network. This is a raw,
 *  best-effort read of that same storage entry for exactly that situation: trust the last-known
 *  identity until we're back online and the SDK's own refresh logic can re-verify for real. Shape-
 *  checked the same way supabase-js's own _isValidSession does — this never invents a session, it just
 *  reads the one already sitting there. */
function readCachedSessionForOfflineUse(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'access_token' in parsed && 'refresh_token' in parsed && 'user' in parsed) {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

interface AuthApi {
  session: Session | null;
  user: User | null;
  /** True for a session created via signInAsGuest() — a real Supabase Auth user (so RLS/progress
   *  sync work exactly as for any other account), just one with no email/password yet. Convenience
   *  derived from `user.is_anonymous` so call sites don't need to know that field exists. */
  isGuest: boolean;
  /** True until the initial session check resolves — gates render so a logged-in user never flashes the login page. */
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** Starts an anonymous session — a real, RLS-scoped Supabase Auth account with no credentials, so
   *  the same progress-sync path every other account uses works immediately. There is no password to
   *  sign back in with afterward, so this identity only survives as long as this browser's session
   *  does unless the learner later calls upgradeGuestAccount(). */
  signInAsGuest: () => Promise<AuthResult>;
  /** Converts the current anonymous session into a permanent one with the same user id (so every row
   *  of already-synced progress carries over untouched) by attaching an email + password to it.
   *  Supabase sends a confirmation link to the new email — the account only fully upgrades ("is_anonymous"
   *  flips false) once that link is clicked. Only meaningful to call while `isGuest` is true. */
  upgradeGuestAccount: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthApi | null>(null);

export function useAuthState(): AuthApi {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // See readCachedSessionForOfflineUse above: a null session while fully offline doesn't
      // necessarily mean "logged out" — it can mean "couldn't verify, no network." Falling back to
      // the raw cached value here only ever runs when the SDK itself couldn't establish a session, so
      // it can never override or race a real, verified one.
      const resolved = data.session ?? (navigator.onLine ? null : readCachedSessionForOfflineUse());
      setSession(resolved);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Fired once the recovery link's one-time token has been exchanged for a real (temporary)
      // session — this is the ONLY reliable signal that "the visitor just clicked a password-reset
      // email link," since the token itself arrives as a URL fragment/query param that HashRouter
      // would otherwise misinterpret as a route and silently redirect away from before React ever
      // gets a chance to show a reset form. Force the hash straight to the real route.
      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '#/reset-password';
      }
    });

    // The moment connectivity returns, ask the SDK to authoritatively re-check: if we were running on
    // the offline fallback above, this either confirms it (refresh succeeds, onAuthStateChange fires
    // TOKEN_REFRESHED) or correctly signs out a session that was never coming back (refresh token
    // itself was revoked/invalid — a genuine logout, not an offline artifact).
    const onOnline = () => {
      supabase.auth.getSession();
    };
    window.addEventListener('online', onOnline);
    return () => {
      subscription.subscription.unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message, needsEmailConfirm: false };
    return { error: null, needsEmailConfirm: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signInAsGuest = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error ? error.message : null };
  }, []);

  const upgradeGuestAccount = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({
      email,
      password,
      data: { full_name: fullName },
    });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    // redirectTo must be added to this Supabase project's Auth → URL Configuration → Redirect URLs
    // allow-list (both the local dev origin and the production origin), or Supabase silently falls
    // back to the project's default Site URL instead of honoring this.
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/' });
    return { error: error ? error.message : null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? error.message : null };
  }, []);

  return useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isGuest: Boolean(session?.user?.is_anonymous),
      loading,
      signUp,
      signIn,
      signInAsGuest,
      upgradeGuestAccount,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [session, loading, signUp, signIn, signInAsGuest, upgradeGuestAccount, signOut, sendPasswordReset, updatePassword],
  );
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthContext.Provider');
  return ctx;
}
