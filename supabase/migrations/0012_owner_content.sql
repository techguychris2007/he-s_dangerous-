-- Apply after 0011. Owner-only content: the machine learning, C# & .NET and software engineering
-- lessons, tasks and projects are served from a private Storage bucket that only the two owner
-- accounts can read. The app hides these tracks for everyone else (src/lib/ownerSession.ts); this
-- is the server-side check behind that. Nobody can upload from the app: content is published with
-- the service-role key, which bypasses these policies.

create or replace function public.owner_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) in ('techguychris2007@gmail.com', 'christopherbondam@gmail.com')
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
      and (u.banned_until is null or u.banned_until <= now())
  );
$$;

revoke all on function public.owner_access() from public, anon;
grant execute on function public.owner_access() to authenticated;

insert into storage.buckets (id, name, public)
values ('owner-content', 'owner-content', false)
on conflict (id) do update set public = false;

drop policy if exists "owner content is readable by owner accounts" on storage.objects;
create policy "owner content is readable by owner accounts" on storage.objects
  for select to authenticated
  using (bucket_id = 'owner-content' and (select public.owner_access()));
