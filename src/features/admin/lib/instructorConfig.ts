/** The one account allowed to view the Instructor Dashboard — checked here to control UI visibility
 *  (hide the nav link/route for everyone else) and, separately and authoritatively, inside the
 *  `instructor_dashboard_progress()` Postgres function (see supabase/migrations/0003_instructor_dashboard.sql).
 *  This constant alone is NOT what protects the data — a non-instructor calling the RPC directly still
 *  gets rejected server-side regardless of what the frontend does. */
import type { User } from '@supabase/supabase-js';

export const INSTRUCTOR_EMAIL = 'techguychris2007@gmail.com';
export const INSTRUCTOR_USERNAME = 'chrisb';

/** UI visibility only. app_metadata is assigned by a trusted server administrator; user_metadata
 * (including full_name, username and role) is learner-editable and must never authorize staff.
 * The database repeats this check against auth.users, not a client-supplied identity. */
export function isInstructor(user: Pick<User, 'email' | 'email_confirmed_at' | 'app_metadata' | 'is_anonymous'> | null | undefined): boolean {
  return Boolean(
    user && !user.is_anonymous && user.email_confirmed_at &&
    user.email?.trim().toLowerCase() === INSTRUCTOR_EMAIL &&
    user.app_metadata?.darkworld_username === INSTRUCTOR_USERNAME &&
    ['admin', 'instructor'].includes(user.app_metadata?.darkworld_role),
  );
}
