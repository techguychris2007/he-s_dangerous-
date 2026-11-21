import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useAuth } from '../../account/state/authStore';
import { isOwnerEmail } from '../../account/lib/ownerSession';
import { PLAN_RANK, type PaidPlan, type PlanId } from '../../../../supabase/functions/_shared/billingPlans.ts';
import { labPlan, lessonPlan } from '../data/planTiers';

// One price list for the app and the Paystack functions.
export * from '../../../../supabase/functions/_shared/billingPlans.ts';

/** The launch switch for paid plans. Off (the default) means DarkWorld is entirely free: every lesson
 *  and lab is open, no Pro/Max badges, no Upgrade or Pricing links, and the build keeps all content
 *  in the bundle. Turn it on by building with VITE_PAID_PLANS=on (in Vercel: Project → Settings →
 *  Environment Variables) once Paystack is live and the paid content is published. */
export const PAID_PLANS_LIVE = import.meta.env.VITE_PAID_PLANS === 'on';

/** Which plan the app should require for a lab, lesson or module: the real tier from
 *  src/features/billing/data/planTiers.ts while paid plans are live, and always 'free' before launch. */
export function planForLab(slug: string): PlanId {
  return PAID_PLANS_LIVE ? labPlan(slug) : 'free';
}
export function planForLesson(moduleSlug: string, lessonIndex: number): PlanId {
  return PAID_PLANS_LIVE ? lessonPlan(moduleSlug, lessonIndex) : 'free';
}

/** The learner's paid plan as stored by the Paystack webhook. Learners can read it, never write it. */
export interface Entitlement {
  plan: PaidPlan;
  status: 'active' | 'past_due' | 'canceled';
  source: 'card_subscription' | 'pass';
  current_period_end: string;
  cancel_at_period_end: boolean;
  paystack_subscription_code: string | null;
}

export interface Payment {
  reference: string;
  plan: PaidPlan;
  days: number;
  amount: number;
  currency: string;
  channel: string | null;
  source: 'card_subscription' | 'pass';
  paid_at: string;
}

type Store = { userId: string | null; status: 'idle' | 'loading' | 'ready' | 'error'; row: Entitlement | null };
let store: Store = { userId: null, status: 'idle', row: null };
const listeners = new Set<() => void>();
const set = (next: Store) => { store = next; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const cacheKey = (userId: string) => `darkworld.plan.${userId}`;

function readCache(userId: string): Entitlement | null {
  try { const raw = localStorage.getItem(cacheKey(userId)); return raw ? JSON.parse(raw) as Entitlement : null; }
  catch { return null; }
}

async function load(userId: string) {
  const cached = readCache(userId);
  set({ userId, status: cached ? 'ready' : 'loading', row: cached });
  const { data, error } = await supabase
    .from('billing_entitlements')
    .select('plan,status,source,current_period_end,cancel_at_period_end,paystack_subscription_code')
    .eq('user_id', userId)
    .maybeSingle();
  if (store.userId !== userId) return;
  if (error) { set({ userId, status: cached ? 'ready' : 'error', row: cached }); return; }
  try {
    if (data) localStorage.setItem(cacheKey(userId), JSON.stringify(data));
    else localStorage.removeItem(cacheKey(userId));
  } catch { /* storage unavailable: the plan still works for this visit */ }
  set({ userId, status: 'ready', row: (data as Entitlement | null) ?? null });
}

export function isActive(row: Entitlement | null | undefined): row is Entitlement {
  return Boolean(row && new Date(row.current_period_end).getTime() > Date.now());
}

export function hasPlan(plan: PlanId, required: PlanId): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}

/** The signed-in learner's plan. Owner accounts always have everything. */
export function useEntitlement() {
  const auth = useAuth();
  const user = auth.user && !auth.user.is_anonymous ? auth.user : null;
  const owner = isOwnerEmail(user?.email);
  const state = useSyncExternalStore(subscribe, () => store);
  useEffect(() => {
    if (!user) { if (store.userId) set({ userId: null, status: 'idle', row: null }); return; }
    if (store.userId !== user.id) void load(user.id);
  }, [user]);
  const refresh = useCallback(async () => { if (user) await load(user.id); }, [user]);
  const mine = user && state.userId === user.id;
  const row = mine ? state.row : null;
  const plan: PlanId = owner ? 'max' : isActive(row) ? row.plan : 'free';
  const loading = auth.loading || Boolean(user && (!mine || state.status === 'loading' || state.status === 'idle'));
  return { plan, row, owner, loading, signedIn: Boolean(user), refresh };
}

/** Whether the learner may open something that needs `required`. While the plan is still loading
 *  `loading` is true, so paying learners never see a lock flash on screen. */
export function usePlanAccess(required: PlanId) {
  const entitlement = useEntitlement();
  return { allowed: hasPlan(entitlement.plan, required), loading: entitlement.loading && required !== 'free', plan: entitlement.plan };
}

async function functionError(error: unknown): Promise<string> {
  const response = (error as { context?: Response })?.context;
  if (response && typeof response.json === 'function') {
    const body = await response.json().catch(() => null);
    if (body?.error) return String(body.error);
  }
  return 'Could not reach the payment service. Check your connection and try again.';
}

/** Opens Paystack checkout. `offer` is 'pro-monthly' / 'max-monthly' (card subscription) or a pass
 *  id from PASS_OFFERS. Resolves only on failure, with the message to show. */
export async function startCheckout(offer: string, method: 'card' | 'mobile_money'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('paystack-checkout', { body: { action: 'checkout', offer, method, origin: window.location.origin } });
  if (error) return functionError(error);
  if (!data?.url) return 'Checkout could not start. Please try again.';
  window.location.assign(data.url as string);
  return '';
}

/** Opens Paystack's own page for updating the card or cancelling renewal. */
export async function openSubscriptionManager(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('paystack-checkout', { body: { action: 'manage' } });
  if (error) return functionError(error);
  if (!data?.url) return 'Could not open subscription settings. Please try again.';
  window.open(data.url as string, '_blank', 'noopener');
  return '';
}

export async function paymentHistory(): Promise<Payment[]> {
  const { data } = await supabase.from('billing_payments').select('reference,plan,days,amount,currency,channel,source,paid_at').order('paid_at', { ascending: false }).limit(24);
  return (data as Payment[] | null) ?? [];
}

// Choosing a plan while signed out ends on Pricing after sign-in (src/shared/lib/returnTo.ts).
export { rememberReturnTo, takeReturnTo } from '../../../shared/lib/returnTo';

export function formatCedis(pesewas: number): string {
  const cedis = pesewas / 100;
  return `GH₵${cedis.toLocaleString('en-GH', { minimumFractionDigits: cedis % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}
