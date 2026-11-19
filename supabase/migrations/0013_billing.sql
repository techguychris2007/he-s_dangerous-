-- Apply after 0012. Paid plans (Pro and Max) bought through Paystack by card or mobile money.
--
-- Learners can only READ their own plan and payment history. Every write goes through
-- apply_billing_purchase() and the subscription helpers below, which only the service role (the
-- Paystack webhook, supabase/functions/paystack-webhook) may call. A learner therefore cannot give
-- themselves a plan from the browser, even with a modified app.

create table if not exists public.billing_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('pro', 'max')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled')),
  -- 'card_subscription': renews monthly by card. 'pass': a one-time purchase that simply runs out.
  source text not null check (source in ('card_subscription', 'pass')),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  paystack_customer_code text,
  paystack_subscription_code text,
  paystack_email_token text,
  updated_at timestamptz not null default now()
);

create index if not exists billing_entitlements_customer_idx on public.billing_entitlements (paystack_customer_code);
create index if not exists billing_entitlements_subscription_idx on public.billing_entitlements (paystack_subscription_code);

create table if not exists public.billing_payments (
  reference text primary key,
  user_id uuid references auth.users (id) on delete set null,
  plan text not null check (plan in ('pro', 'max')),
  days integer not null check (days > 0),
  amount integer not null check (amount >= 0),
  currency text not null,
  channel text,
  source text not null check (source in ('card_subscription', 'pass')),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists billing_payments_user_idx on public.billing_payments (user_id, paid_at desc);

alter table public.billing_entitlements enable row level security;
alter table public.billing_payments enable row level security;

drop policy if exists "learners read their own plan" on public.billing_entitlements;
create policy "learners read their own plan" on public.billing_entitlements
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "learners read their own payments" on public.billing_payments;
create policy "learners read their own payments" on public.billing_payments
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.billing_entitlements from anon, authenticated;
revoke insert, update, delete on public.billing_payments from anon, authenticated;

-- Records one successful Paystack charge and extends the learner's access. Idempotent: Paystack
-- retries webhooks, and a reference that was already recorded changes nothing (returns false).
--
-- How time is added:
--  * no active plan          → the purchased plan starts now.
--  * same plan already active → the purchased days are added to the end of the current period.
--  * upgrade Pro → Max        → Max starts now; unused Pro time carries over converted by price.
--  * Pro bought while on Max  → stays on Max; the Pro days are added converted by price.
-- p_pro_to_max is what one day of Pro is worth in days of Max: the Pro monthly price divided by the
-- Max monthly price (PRO_TO_MAX_DAY_RATIO in supabase/functions/_shared/billingPlans.ts).
create or replace function public.apply_billing_purchase(
  p_reference text,
  p_user uuid,
  p_plan text,
  p_days integer,
  p_amount integer,
  p_currency text,
  p_channel text,
  p_source text,
  p_customer_code text default null,
  p_subscription_code text default null,
  p_paid_at timestamptz default now(),
  p_pro_to_max numeric default 0.5
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.billing_entitlements;
  started timestamptz := now();
  next_plan text;
  next_end timestamptz;
  purchased interval := make_interval(days => p_days);
begin
  if p_plan not in ('pro', 'max') or p_days <= 0 or p_pro_to_max <= 0 or p_pro_to_max > 1 then
    raise exception 'invalid billing purchase';
  end if;

  insert into public.billing_payments (reference, user_id, plan, days, amount, currency, channel, source, paid_at)
  values (p_reference, p_user, p_plan, p_days, p_amount, p_currency, p_channel, p_source, coalesce(p_paid_at, now()))
  on conflict (reference) do nothing;
  if not found then
    return false;
  end if;

  select * into current_row from public.billing_entitlements where user_id = p_user for update;

  if current_row.user_id is null or current_row.current_period_end <= started then
    next_plan := p_plan;
    next_end := started + purchased;
  elsif current_row.plan = p_plan then
    next_plan := p_plan;
    next_end := current_row.current_period_end + purchased;
  elsif p_plan = 'max' then
    next_plan := 'max';
    next_end := started + purchased + (current_row.current_period_end - started) * p_pro_to_max::double precision;
  else
    next_plan := 'max';
    next_end := current_row.current_period_end + purchased * p_pro_to_max::double precision;
  end if;

  insert into public.billing_entitlements as e (
    user_id, plan, status, source, current_period_end, cancel_at_period_end,
    paystack_customer_code, paystack_subscription_code, updated_at
  )
  values (
    p_user, next_plan, 'active', p_source, next_end, false,
    p_customer_code, p_subscription_code, now()
  )
  on conflict (user_id) do update set
    plan = excluded.plan,
    status = 'active',
    -- A pass bought on top of a card subscription must not hide that the card still renews.
    source = case when e.paystack_subscription_code is not null and e.status <> 'canceled' and p_source = 'pass' then e.source else excluded.source end,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = case when p_source = 'card_subscription' then false else e.cancel_at_period_end end,
    paystack_customer_code = coalesce(excluded.paystack_customer_code, e.paystack_customer_code),
    paystack_subscription_code = coalesce(excluded.paystack_subscription_code, e.paystack_subscription_code),
    updated_at = now();

  return true;
end;
$$;

-- Saves the subscription details Paystack sends after a card subscription is created. Returns false
-- when the first payment has not been recorded yet (the events can arrive in either order); the
-- webhook then answers with an error so Paystack delivers this event again a little later.
create or replace function public.attach_billing_subscription(
  p_customer_code text,
  p_subscription_code text,
  p_email_token text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.billing_entitlements
  set paystack_subscription_code = p_subscription_code,
      paystack_email_token = p_email_token,
      source = 'card_subscription',
      cancel_at_period_end = false,
      status = 'active',
      updated_at = now()
  where paystack_customer_code = p_customer_code;
  return found;
end;
$$;

-- Card renewal stopped (cancelled by the learner or by Paystack): access continues until the end of
-- the period already paid for, then simply lapses. 'past_due' only flags a failed renewal attempt.
create or replace function public.end_billing_subscription(p_subscription_code text, p_status text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.billing_entitlements
  -- A failed renewal is retried by Paystack, so it does not end the subscription by itself.
  set cancel_at_period_end = case when p_status = 'past_due' then cancel_at_period_end else true end,
      status = case when p_status in ('active', 'past_due', 'canceled') then p_status else status end,
      updated_at = now()
  where paystack_subscription_code = p_subscription_code;
$$;

-- Finds the learner a renewal charge belongs to. Renewal charges carry no app metadata, only the
-- Paystack customer, which was stored on the first payment.
create or replace function public.billing_user_for_customer(p_customer_code text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select user_id from public.billing_entitlements where paystack_customer_code = p_customer_code limit 1;
$$;

revoke all on function public.apply_billing_purchase(text, uuid, text, integer, integer, text, text, text, text, text, timestamptz, numeric) from public, anon, authenticated;
revoke all on function public.attach_billing_subscription(text, text, text) from public, anon, authenticated;
revoke all on function public.end_billing_subscription(text, text) from public, anon, authenticated;
revoke all on function public.billing_user_for_customer(text) from public, anon, authenticated;
grant execute on function public.apply_billing_purchase(text, uuid, text, integer, integer, text, text, text, text, text, timestamptz, numeric) to service_role;
grant execute on function public.attach_billing_subscription(text, text, text) to service_role;
grant execute on function public.end_billing_subscription(text, text) to service_role;
grant execute on function public.billing_user_for_customer(text) to service_role;
