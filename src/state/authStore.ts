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
  /** True until the initial session check resolves — gates render so a logged-in user never flashes the login page. */
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
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
      loading,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [session, loading, signUp, signIn, signOut, sendPasswordReset, updatePassword],
  );
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthContext.Provider');
  return ctx;
}
