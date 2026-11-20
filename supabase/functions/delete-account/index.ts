// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy delete-account
// Lets a learner permanently delete their own DarkWorld account (Data Protection Act, 2012
// (Act 843) erasure requests, and the promise in the privacy policy).
//
// Order matters: a card subscription that still renews is cancelled at Paystack FIRST, so a deleted
// account can never be charged again. Only then is the auth user deleted, which removes every
// learner table through `on delete cascade` (progress, comments, ratings, feedback, plan). Payment
// records stay for tax law, with the link to the account removed (`on delete set null`).
// Owner accounts cannot be deleted here.

import { BILLING_CORS, env, paystack, reply } from '../_shared/paystack.ts';
import { verifiedUser } from '../_shared/auth.ts';

/** Owner and admin accounts (see admin_access() in supabase/migrations/0015_admin_dashboard.sql). */
const OWNER_EMAILS = new Set(['techguychris2007@gmail.com', 'christopherbondam@gmail.com', 'adjeibenedict010@gmail.com']);

function serviceHeaders() {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return { apikey: key, Authorization: `Bearer ${key}` };
}

interface PlanRow {
  paystack_subscription_code: string | null;
  paystack_email_token: string | null;
  cancel_at_period_end: boolean;
  status: string;
  current_period_end: string;
}

/** The learner's plan row, or null. A missing billing table (paid plans not set up yet) counts as
 *  no plan; any other failure stops the deletion. */
async function planFor(userId: string): Promise<PlanRow | null> {
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/billing_entitlements?user_id=eq.${encodeURIComponent(userId)}&select=paystack_subscription_code,paystack_email_token,cancel_at_period_end,status,current_period_end`, {
    signal: AbortSignal.timeout(15000),
    headers: serviceHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Could not read the plan (${response.status}).`);
  const rows = (await response.json()) as PlanRow[];
  return rows[0] ?? null;
}

async function cancelRenewal(plan: PlanRow | null) {
  if (!plan?.paystack_subscription_code || plan.cancel_at_period_end || plan.status === 'canceled') return;
  let token = plan.paystack_email_token;
  if (!token) {
    const found = await paystack<{ data: { email_token: string } }>(`/subscription/${encodeURIComponent(plan.paystack_subscription_code)}`);
    token = found.data.email_token;
  }
  await paystack('/subscription/disable', { method: 'POST', body: JSON.stringify({ code: plan.paystack_subscription_code, token }) });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: BILLING_CORS });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);

  const user = await verifiedUser(req).catch(() => null);
  if (!user) return reply({ error: 'Sign in again, then try deleting your account.' }, 401);
  if (user.email && OWNER_EMAILS.has(user.email)) return reply({ error: 'Owner accounts cannot be deleted from the app.' }, 403);

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  const expected = user.email ?? 'DELETE';
  if ((body.confirm ?? '').trim().toLowerCase() !== expected.toLowerCase()) {
    return reply({ error: user.email ? 'Type your account email exactly to confirm.' : 'Type DELETE to confirm.' }, 400);
  }

  try {
    await cancelRenewal(await planFor(user.id));
  } catch (error) {
    console.error('delete-account: renewal cancel failed', error instanceof Error ? error.message : error);
    return reply({ error: 'Your card subscription could not be cancelled, so your account was not deleted. Cancel it from the Billing page, then try again, or contact support.' }, 502);
  }

  const response = await fetch(`${env('SUPABASE_URL')}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(15000),
    headers: serviceHeaders(),
  });
  if (!response.ok && response.status !== 404) {
    console.error('delete-account: auth delete failed', response.status, (await response.text()).slice(0, 300));
    return reply({ error: 'Your account could not be deleted right now. Please try again, or contact support.' }, 502);
  }
  return reply({ deleted: true });
});
