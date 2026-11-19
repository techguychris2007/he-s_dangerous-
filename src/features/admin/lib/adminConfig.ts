/** Accounts that may open the Admin Dashboard. This list only controls UI visibility (nav link and
 *  route gate). The data is protected server-side by admin_access() in
 *  supabase/migrations/0015_admin_dashboard.sql, which checks the caller's confirmed email in
 *  auth.users, so bypassing this check returns no data. Keep both lists in sync. */
import type { User } from '@supabase/supabase-js';

export const ADMIN_EMAILS: ReadonlySet<string> = new Set(['techguychris2007@gmail.com', 'adjeibenedict010@gmail.com']);

export function isAdmin(user: Pick<User, 'email' | 'email_confirmed_at' | 'is_anonymous'> | null | undefined): boolean {
  return Boolean(
    user && !user.is_anonymous && user.email_confirmed_at &&
    user.email && ADMIN_EMAILS.has(user.email.trim().toLowerCase()),
  );
}
