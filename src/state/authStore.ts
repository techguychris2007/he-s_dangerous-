import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthResult {
  error: string | null;
}

interface SignUpResult extends AuthResult {
  needsEmailConfirm: boolean;
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
      setSession(data.session);
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
    return () => subscription.subscription.unsubscribe();
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
