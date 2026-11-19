// The one price list for DarkWorld plans. Pure TypeScript with no runtime imports, so both the
// Paystack edge functions (Deno) and the web app (src/lib/billing.ts) import this same file: the
// prices a learner sees are always the prices the server charges. The server never trusts an
// amount sent by the browser; it looks the offer up here.
//
// Each offer has a US dollar list price (`usd`) and the cedi amount actually charged (`amount`, in
// pesewas = GHS × 100, the unit Paystack expects). The cedi amount is the dollar price at
// GHS_PER_USD rounded to a whole cedi. Both are fixed numbers, not calculated at run time: a
// Paystack subscription plan has a fixed cedi amount, so the charged price must not move by itself
// when the exchange rate changes. scripts/check-billing.cjs checks the two stay within 1% at
// GHS_PER_USD. To reprice, change both numbers (and the Paystack plans; see docs/billing-setup.md).

export type PaidPlan = 'pro' | 'max';
export type PlanId = 'free' | PaidPlan;

/** A one-time purchase: a fixed number of days of access, payable by card or mobile money. */
export interface PassOffer {
  id: string;
  plan: PaidPlan;
  label: string;
  days: number;
  amount: number;
  usd: number;
}

export const PLAN_RANK: Record<PlanId, number> = { free: 0, pro: 1, max: 2 };

export const PLAN_NAMES: Record<PlanId, string> = { free: 'Free', pro: 'Pro', max: 'Max' };

/** Monthly card subscription price per plan, in pesewas. The matching Paystack plan codes are server
 *  secrets (PAYSTACK_PLAN_PRO_MONTHLY, PAYSTACK_PLAN_MAX_MONTHLY) and must be created with these
 *  amounts: GH₵82 and GH₵152. */
export const MONTHLY_AMOUNT: Record<PaidPlan, number> = { pro: 8200, max: 15200 };

/** Monthly list price in US dollars, shown beside the cedi amount. */
export const MONTHLY_USD: Record<PaidPlan, number> = { pro: 6.99, max: 12.99 };

/** Days of access one paid month of a card subscription adds. */
export const SUBSCRIPTION_DAYS = 30;

export const PASS_OFFERS: PassOffer[] = [
  { id: 'pro-1m', plan: 'pro', label: '1 month', days: 30, amount: 8200, usd: 6.99 },
  { id: 'pro-3m', plan: 'pro', label: '3 months', days: 90, amount: 22800, usd: 19.49 },
  { id: 'pro-12m', plan: 'pro', label: '12 months', days: 365, amount: 81900, usd: 69.99 },
  { id: 'max-1m', plan: 'max', label: '1 month', days: 30, amount: 15200, usd: 12.99 },
  { id: 'max-3m', plan: 'max', label: '3 months', days: 90, amount: 42700, usd: 36.49 },
  { id: 'max-12m', plan: 'max', label: '12 months', days: 365, amount: 152100, usd: 129.99 },
];

export function findPass(id: string): PassOffer | undefined {
  return PASS_OFFERS.find(offer => offer.id === id);
}

/** When a learner holding one plan buys the other, remaining time is converted by price: one day of
 *  Pro is worth this fraction of a day of Max (GH₵82 / GH₵152 ≈ 0.54). Used by the webhook. */
export const PRO_TO_MAX_DAY_RATIO = MONTHLY_AMOUNT.pro / MONTHLY_AMOUNT.max;

/** Cedis per US dollar the cedi prices were set at. Mid-market rate on 17 November 2026
 *  (fxfeed.io: 1 USD = 11.70 GHS). Also converts payment-history amounts to dollars. */
export const GHS_PER_USD = 11.7;
export const RATE_DATE = '17 November 2026';

export function formatDollars(usd: number): string {
  return `US$${usd.toFixed(2)}`;
}

/** Dollar equivalent of a cedi amount in pesewas at GHS_PER_USD, e.g. 8200 → "US$7.01". */
export function formatUsd(pesewas: number): string {
  return formatDollars(pesewas / 100 / GHS_PER_USD);
}
