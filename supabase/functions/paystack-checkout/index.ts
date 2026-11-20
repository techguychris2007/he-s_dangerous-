// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy paystack-checkout
// Starts a Paystack checkout for the signed-in learner, or opens Paystack's page for managing an
// existing card subscription. Deployed with verify_jwt on, so the gateway has already checked the
// session token; the caller is also confirmed with Supabase Auth (_shared/auth.ts), so the public
// anon key alone, or a forged token, is refused.
//
// The browser only names an offer. The price, the plan and the length of access all come from
// supabase/functions/_shared/billingPlans.ts, and the plan is granted only by the webhook after
// Paystack confirms the payment.

import { findPass, MONTHLY_AMOUNT, SUBSCRIPTION_DAYS, type PaidPlan } from '../_shared/billingPlans.ts';
import { BILLING_CORS, codeForPlan, entitlementFor, env, hasRenewingSubscription, paystack, reply } from '../_shared/paystack.ts';
import { verifiedUser } from '../_shared/auth.ts';

type Method = 'card' | 'mobile_money';

interface Body {
  action?: 'checkout' | 'manage';
  /** 'pro-monthly' / 'max-monthly' for a card subscription, or a pass id such as 'max-3m'. */
  offer?: string;
  method?: Method;
  /** The site origin to return to after paying; must be on the allow-list. */
  origin?: string;
}

function returnUrl(origin: string | undefined): string {
  const allowed = (Deno.env.get('BILLING_ALLOWED_ORIGINS') ?? 'https://www.darkworldacademy.tech')
    .split(',').map(value => value.trim().replace(/\/$/, '')).filter(Boolean);
  const chosen = origin && allowed.includes(origin.replace(/\/$/, '')) ? origin.replace(/\/$/, '') : allowed[0];
  return `${chosen}/#/billing`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: BILLING_CORS });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);

  const verified = await verifiedUser(req).catch(() => null);
  // Guests and accounts without an email cannot pay: Paystack needs an email to send the receipt to.
  const user = verified && !verified.isAnonymous && verified.email ? { id: verified.id, email: verified.email } : null;
  if (!user) return reply({ error: 'Sign in with a registered account to manage your plan.' }, 401);

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const current = await entitlementFor(user.id);

    if (body.action === 'manage') {
      if (!current?.paystack_subscription_code) return reply({ error: 'There is no card subscription on this account.' }, 404);
      const result = await paystack<{ data: { link: string } }>(`/subscription/${encodeURIComponent(current.paystack_subscription_code)}/manage/link`);
      return reply({ url: result.data.link });
    }

    const offer = body.offer ?? '';
    const method: Method = body.method === 'mobile_money' ? 'mobile_money' : 'card';
    if (hasRenewingSubscription(current)) {
      return reply({ error: 'Your card subscription is still renewing. Cancel it from the Billing page first, then choose a new plan; you keep the time you have already paid for.' }, 409);
    }

    let plan: PaidPlan;
    let days: number;
    let amount: number;
    let source: 'card_subscription' | 'pass';
    const init: Record<string, unknown> = {};

    if (offer === 'pro-monthly' || offer === 'max-monthly') {
      if (method !== 'card') return reply({ error: 'Monthly renewal works with cards only. With mobile money, choose a 1, 3 or 12 month pass.' }, 400);
      plan = offer === 'pro-monthly' ? 'pro' : 'max';
      days = SUBSCRIPTION_DAYS;
      amount = MONTHLY_AMOUNT[plan];
      source = 'card_subscription';
      init.plan = codeForPlan(plan);
    } else {
      const pass = findPass(offer);
      if (!pass) return reply({ error: 'That plan option is not available.' }, 400);
      plan = pass.plan;
      days = pass.days;
      amount = pass.amount;
      source = 'pass';
    }

    const reference = `dw_${plan}_${crypto.randomUUID().replace(/-/g, '')}`;
    const result = await paystack<{ data: { authorization_url: string; reference: string } }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        ...init,
        email: user.email,
        amount,
        currency: 'GHS',
        reference,
        channels: [method],
        callback_url: returnUrl(body.origin),
        metadata: { user_id: user.id, offer, plan, days, source, cancel_action: returnUrl(body.origin) },
      }),
    });
    return reply({ url: result.data.authorization_url, reference: result.data.reference });
  } catch (error) {
    console.error('paystack-checkout', error instanceof Error ? error.message : error);
    // Keep server details out of the browser; the log above has them.
    return reply({ error: 'Checkout could not start. Please try again in a moment.' }, 502);
  }
});

// Fails fast at deploy time if the secret is missing rather than on a learner's first click.
try { env('PAYSTACK_SECRET_KEY'); } catch (error) { console.error(error instanceof Error ? error.message : error); }
