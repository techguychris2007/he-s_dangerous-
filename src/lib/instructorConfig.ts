/** The one account allowed to view the Instructor Dashboard — checked here to control UI visibility
 *  (hide the nav link/route for everyone else) and, separately and authoritatively, inside the
 *  `instructor_dashboard_progress()` Postgres function (see supabase/migrations/0003_instructor_dashboard.sql).
 *  This constant alone is NOT what protects the data — a non-instructor calling the RPC directly still
 *  gets rejected server-side regardless of what the frontend does. */
export const INSTRUCTOR_EMAIL = 'techguychris2007@gmail.com';

export function isInstructor(email: string | null | undefined): boolean {
  return email === INSTRUCTOR_EMAIL;
}
