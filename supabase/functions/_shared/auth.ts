// Identifies the caller of an edge function by asking Supabase Auth about their access token, rather
// than decoding the token locally. This holds even if a function is deployed with
// `--no-verify-jwt`: a forged or expired token is rejected by Auth itself.
// SUPABASE_URL and SUPABASE_ANON_KEY are provided to every edge function by Supabase.

import { env } from './paystack.ts';

export interface VerifiedUser {
  id: string;
  /** Lower-cased, or null for accounts without one (guest sessions). */
  email: string | null;
  isAnonymous: boolean;
}

export async function verifiedUser(req: Request): Promise<VerifiedUser | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const response = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, {
    signal: AbortSignal.timeout(10000),
    headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as { id?: unknown; email?: unknown; is_anonymous?: unknown } | null;
  if (!user || typeof user.id !== 'string') return null;
  return {
    id: user.id,
    email: typeof user.email === 'string' && user.email ? user.email.toLowerCase() : null,
    isAnonymous: user.is_anonymous === true,
  };
}
