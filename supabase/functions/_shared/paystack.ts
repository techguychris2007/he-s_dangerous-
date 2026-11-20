// Shared helpers for the Paystack edge functions. Secrets live only in the function environment:
//   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_... \
//     PAYSTACK_PLAN_PRO_MONTHLY=PLN_... PAYSTACK_PLAN_MAX_MONTHLY=PLN_... \
//     BILLING_ALLOWED_ORIGINS=https://www.darkworldacademy.tech,https://darkworldacademy.tech
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.

import type { PaidPlan } from './billingPlans.ts';

const PAYSTACK_API = 'https://api.paystack.co';

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server setting ${name}.`);
  return value;
}

export async function paystack<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${env('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.status === false) throw new Error(body?.message || `Paystack request failed (${response.status}).`);
  return body as T;
}

/** Calls a billing SQL function with the service role. Only the server ever holds that key. */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Billing database call ${fn} failed (${response.status}): ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export interface EntitlementRow {
  user_id: string;
  plan: PaidPlan;
  status: 'active' | 'past_due' | 'canceled';
  source: 'card_subscription' | 'pass';
  current_period_end: string;
  cancel_at_period_end: boolean;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
}

export async function entitlementFor(userId: string): Promise<EntitlementRow | null> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/billing_entitlements?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
    signal: AbortSignal.timeout(15000),
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Could not read the current plan (${response.status}).`);
  const rows = (await response.json()) as EntitlementRow[];
  return rows[0] ?? null;
}

/** A card subscription that will still renew. While one exists, new purchases are refused so a
 *  learner is never charged twice for overlapping access. */
export function hasRenewingSubscription(row: EntitlementRow | null): boolean {
  return Boolean(row?.paystack_subscription_code && !row.cancel_at_period_end && row.status !== 'canceled' && new Date(row.current_period_end).getTime() > Date.now());
}

/** Paystack plan code → DarkWorld plan, for monthly card subscriptions. */
export function planForCode(code: string | undefined | null): PaidPlan | undefined {
  if (!code) return undefined;
  if (code === Deno.env.get('PAYSTACK_PLAN_PRO_MONTHLY')) return 'pro';
  if (code === Deno.env.get('PAYSTACK_PLAN_MAX_MONTHLY')) return 'max';
  return undefined;
}

export function codeForPlan(plan: PaidPlan): string {
  return env(plan === 'pro' ? 'PAYSTACK_PLAN_PRO_MONTHLY' : 'PAYSTACK_PLAN_MAX_MONTHLY');
}

export const BILLING_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BILLING_CORS, 'Content-Type': 'application/json' } });
}
