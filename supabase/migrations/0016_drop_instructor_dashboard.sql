-- The Instructor Dashboard was replaced by the Admin Dashboard (0015). The web app no longer calls
-- these functions, so remove them rather than leave an unused, privileged RPC in the API surface.
drop function if exists public.instructor_dashboard_progress();
drop function if exists public.instructor_access();
