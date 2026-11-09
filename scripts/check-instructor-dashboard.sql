-- Run against the linked project with supabase db query --linked --file scripts/check-instructor-dashboard.sql.
-- Transaction rolls back all temporary session settings; only a verification message is returned.
begin;
select set_config('request.jwt.claim.sub', (select id::text from auth.users where lower(email)='techguychris2007@gmail.com'), true);
set local role authenticated;
do $$ begin
  if not public.instructor_access() then raise exception 'Expected designated instructor access'; end if;
  perform count(*) from public.instructor_dashboard_progress();
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$ begin
  begin
    perform count(*) from public.instructor_dashboard_progress();
    raise exception 'Unauthorized caller was not rejected';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  if has_function_privilege('anon','public.instructor_dashboard_progress()','EXECUTE') then
    raise exception 'Anonymous role must not have dashboard access';
  end if;
end $$;
rollback;
select 'Instructor RPC executes; unauthorized and anonymous access remain blocked' as verification;
