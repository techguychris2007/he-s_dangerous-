-- Apply after 0013. Pro and Max content: full lab scenarios and lesson bodies live in the private
-- `paid-content` Storage bucket, not in the public app bundle (scripts/vite-paid-content.mjs strips
-- them from the build). Files are stored under the plan that unlocks them:
--   pro/labs/<slug>.json.gz   pro/lessons/<id>.json.gz   (gzipped JSON)
--   max/labs/<slug>.json.gz   max/lessons/<id>.json.gz
-- A file can be downloaded only by an account whose plan includes it, or by an owner account.
-- Nobody can upload from the app: scripts/publish-paid-content.cjs uses the Supabase CLI.

create or replace function public.paid_access(p_plan text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.owner_access() or exists (
    select 1 from public.billing_entitlements e
    where e.user_id = auth.uid()
      and e.current_period_end > now()
      and (e.plan = 'max' or (p_plan = 'pro' and e.plan = 'pro'))
  );
$$;

revoke all on function public.paid_access(text) from public, anon;
grant execute on function public.paid_access(text) to authenticated;

insert into storage.buckets (id, name, public)
values ('paid-content', 'paid-content', false)
on conflict (id) do update set public = false;

drop policy if exists "paid content follows the learner's plan" on storage.objects;
create policy "paid content follows the learner's plan" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'paid-content' and (
      name = 'manifest.json'
      or (name like 'pro/%' and (select public.paid_access('pro')))
      or (name like 'max/%' and (select public.paid_access('max')))
    )
  );
