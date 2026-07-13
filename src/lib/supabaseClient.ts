import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env file.');
}

/** Only the anon/public key ever belongs in client code — it's designed to be exposed and relies on
 *  Row Level Security to keep data safe. The service_role key must never ship in a browser bundle. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
