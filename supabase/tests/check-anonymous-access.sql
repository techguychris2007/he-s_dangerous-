begin;
-- Run against a project with a retained anonymous account and the designated instructor.
select set_config('request.jwt.claim.sub',(select id::text from auth.users where is_anonymous=true order by created_at desc limit 1),true);
set local role authenticated;
do $$ begin
 if public.registered_user_access() then raise exception 'Guest must not be allowed'; end if;
 if exists(select 1 from public.user_progress) or exists(select 1 from public.lab_comments) then raise exception 'Guest can read application data'; end if;
 begin insert into public.user_progress(user_id) values(auth.uid());raise exception 'Guest progress write accepted';exception when insufficient_privilege then null;end;
 begin perform * from public.leaderboard_entries();raise exception 'Guest leaderboard access accepted';exception when insufficient_privilege then null;end;
 begin perform * from public.lab_rating_summary();raise exception 'Guest rating access accepted';exception when insufficient_privilege then null;end;
 begin perform * from public.lab_comments_for_lab('test');raise exception 'Guest comment access accepted';exception when insufficient_privilege then null;end;
 begin perform * from public.instructor_dashboard_progress();raise exception 'Guest instructor access accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from auth.users where lower(email)='techguychris2007@gmail.com'),true);
set local role authenticated;
do $$ begin
 if not public.registered_user_access() then raise exception 'Registered instructor access rejected';end if;
 if not exists(select 1 from public.user_progress) then raise exception 'Registered own progress unavailable';end if;
 perform * from public.leaderboard_entries();
 perform * from public.lab_rating_summary();
 perform * from public.lab_comments_for_lab('test');
 perform count(*) from public.instructor_dashboard_progress();
end $$;
reset role;
do $$ declare fn regprocedure;begin
 foreach fn in array array['public.leaderboard_entries()'::regprocedure,'public.lab_rating_summary()'::regprocedure,'public.lab_comments_for_lab(text)'::regprocedure,'public.instructor_dashboard_progress()'::regprocedure] loop
  if has_function_privilege('anon',fn,'EXECUTE') then raise exception 'Unexpected anonymous execution grant';end if;
 end loop;
 if exists(select 1 from auth.users where is_anonymous=true and (banned_until is null or banned_until<now())) then raise exception 'Unsuspended anonymous account';end if;
end $$;
rollback;
select 'Guest data and RPC access blocked; registered progress/community/instructor access preserved; all anonymous accounts suspended' as verification;
