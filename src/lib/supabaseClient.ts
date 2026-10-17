import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env file.');
}

/** The localStorage key the session is persisted under. Deliberately NOT set explicitly on the client
 *  below — this just reproduces supabase-js's own default derivation (`sb-<project-ref>-auth-token`,
 *  see its SupabaseClient constructor) so authStore.ts's offline fallback (see there) can read the
 *  exact same key an unconfigured client already uses. Pinning our own key instead would silently log
 *  out every already-signed-in user on deploy — their session sits under THIS key today, and a client
 *  configured with a different storageKey would simply never find it. */
export const AUTH_STORAGE_KEY = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

/** Only the anon/public key ever belongs in client code — it's designed to be exposed and relies on
 *  Row Level Security to keep data safe. The service_role key must never ship in a browser bundle. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
