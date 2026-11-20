// Supabase Edge Function (Deno). Paystack calls this; learners never do. Deploy WITHOUT the JWT
// check, because Paystack cannot send a Supabase session:
//   supabase functions deploy paystack-webhook --no-verify-jwt
// then set https://<project-ref>.supabase.co/functions/v1/paystack-webhook as the webhook URL in
// the Paystack dashboard (Settings → API Keys & Webhooks).
//
// Every request is authenticated by Paystack's signature (HMAC-SHA512 of the raw body with the
// secret key). Each successful charge is also re-checked against Paystack's verify endpoint before
// any access is granted, and recording it is idempotent, so retried deliveries are harmless.

import { findPass, MONTHLY_AMOUNT, PRO_TO_MAX_DAY_RATIO, SUBSCRIPTION_DAYS, type PaidPlan } from '../_shared/billingPlans.ts';
import { env, paystack, planForCode, rpc } from '../_shared/paystack.ts';

interface Charge {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string;
  metadata?: unknown;
  customer?: { customer_code?: string; email?: string };
  plan?: { plan_code?: string } | string | null;
  plan_object?: { plan_code?: string } | null;
}

interface CheckoutMetadata { user_id?: string; offer?: string; plan?: string; days?: number; source?: string }

async function signatureMatches(raw: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env('PAYSTACK_SECRET_KEY')), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  const expected = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}

function metadataOf(value: unknown): CheckoutMetadata {
  if (typeof value === 'string') { try { return JSON.parse(value) as CheckoutMetadata; } catch { return {}; } }
  return (value && typeof value === 'object' ? value : {}) as CheckoutMetadata;
}

function planCodeOf(charge: Charge): string | undefined {
  if (charge.plan && typeof charge.plan === 'object') return charge.plan.plan_code;
  return charge.plan_object?.plan_code ?? undefined;
}

/** Works out what a verified charge pays for. Returns undefined for anything that does not match an
 *  offer exactly (wrong currency, short amount, unknown plan), which is then logged and ignored. */
async function purchaseFor(charge: Charge, event: Charge) {
  if (charge.status !== 'success' || charge.currency !== 'GHS') return undefined;
  const meta = metadataOf(charge.metadata ?? event.metadata);
  const customer = charge.customer?.customer_code ?? event.customer?.customer_code ?? null;
  const subscriptionPlan = planForCode(planCodeOf(event) ?? planCodeOf(charge));

  // First payment of a checkout started in the app: metadata says who and what.
  if (meta.user_id && meta.offer) {
    if (meta.offer === 'pro-monthly' || meta.offer === 'max-monthly') {
      const plan: PaidPlan = meta.offer === 'pro-monthly' ? 'pro' : 'max';
      if (charge.amount < MONTHLY_AMOUNT[plan]) return undefined;
      return { user: meta.user_id, plan, days: SUBSCRIPTION_DAYS, source: 'card_subscription' as const, customer };
    }
    const pass = findPass(meta.offer);
    if (!pass || charge.amount < pass.amount) return undefined;
    return { user: meta.user_id, plan: pass.plan, days: pass.days, source: 'pass' as const, customer };
  }

  // Monthly renewal of a card subscription: no app metadata, only the Paystack customer and plan.
  if (subscriptionPlan && customer) {
    if (charge.amount < MONTHLY_AMOUNT[subscriptionPlan]) return undefined;
    const user = await rpc<string | null>('billing_user_for_customer', { p_customer_code: customer });
    if (!user) return undefined;
    return { user, plan: subscriptionPlan, days: SUBSCRIPTION_DAYS, source: 'card_subscription' as const, customer };
  }
  return undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (!(await signatureMatches(raw, req.headers.get('x-paystack-signature')))) return new Response('Invalid signature', { status: 401 });

  let event: { event?: string; data?: Record<string, unknown> };
  try { event = JSON.parse(raw); } catch { return new Response('Bad payload', { status: 400 }); }
  const data = (event.data ?? {}) as Record<string, any>;

  try {
    switch (event.event) {
      case 'charge.success': {
        const reference = String(data.reference ?? '');
        if (!reference) break;
        const verified = await paystack<{ data: Charge }>(`/transaction/verify/${encodeURIComponent(reference)}`);
        const purchase = await purchaseFor(verified.data, data as Charge);
        if (!purchase) { console.warn('paystack-webhook: charge did not match an offer', reference); break; }
        await rpc<boolean>('apply_billing_purchase', {
          p_reference: reference,
          p_user: purchase.user,
          p_plan: purchase.plan,
          p_days: purchase.days,
          p_amount: verified.data.amount,
          p_currency: verified.data.currency,
          p_channel: verified.data.channel ?? null,
          p_source: purchase.source,
          p_customer_code: purchase.customer,
          p_subscription_code: null,
          p_paid_at: verified.data.paid_at ?? new Date().toISOString(),
          p_pro_to_max: PRO_TO_MAX_DAY_RATIO,
        });
        break;
      }
      case 'subscription.create': {
        const attached = await rpc<boolean>('attach_billing_subscription', {
          p_customer_code: data.customer?.customer_code ?? '',
          p_subscription_code: data.subscription_code ?? '',
          p_email_token: data.email_token ?? null,
        });
        // The first charge is not recorded yet; ask Paystack to deliver this event again later.
        if (!attached) return new Response('Subscription arrived before its first payment; retry', { status: 503 });
        break;
      }
      case 'subscription.not_renew':
        await rpc('end_billing_subscription', { p_subscription_code: data.subscription_code ?? '', p_status: 'active' });
        break;
      case 'subscription.disable':
        await rpc('end_billing_subscription', { p_subscription_code: data.subscription_code ?? '', p_status: 'canceled' });
        break;
      case 'invoice.payment_failed':
        await rpc('end_billing_subscription', { p_subscription_code: data.subscription?.subscription_code ?? '', p_status: 'past_due' });
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('paystack-webhook', event.event, error instanceof Error ? error.message : error);
    // A temporary failure: Paystack retries, and recording a charge twice is harmless.
    return new Response('Temporary failure', { status: 500 });
  }
  return new Response('ok', { status: 200 });
});
