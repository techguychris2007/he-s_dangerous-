# Setting up paid plans (Paystack)

DarkWorld sells Pro and Max through **Paystack**, which takes cards and Ghanaian mobile money (MTN MoMo, Telecel Cash, AirtelTigo Money). Stripe does not accept Ghana-based businesses directly. In Ghana it works through Paystack, which Stripe owns, so this is the Stripe-backed route.

## How it works

| Piece | File |
| --- | --- |
| Prices and offers (one list for app and server) | `supabase/functions/_shared/billingPlans.ts` |
| Which labs and modules each plan unlocks | `src/data/planTiers.ts` |
| Plan and payment tables, and the only functions that can change them | `supabase/migrations/0013_billing.sql` |
| Starts a checkout or opens subscription management | `supabase/functions/paystack-checkout` |
| Receives Paystack events and grants access | `supabase/functions/paystack-webhook` |
| Pricing and Billing pages, gates on lessons and labs | `src/pages/PricingPage.tsx`, `src/pages/BillingPage.tsx`, `src/components/billing/` |

- **Card, monthly:** a Paystack subscription that renews every month until cancelled.
- **Card or mobile money, 1/3/12 months:** a one-time pass. Mobile money cannot renew automatically, so mobile money always buys a pass.
- Access is granted only by the webhook, after Paystack's signature is checked and the charge is re-verified with Paystack. The browser cannot grant itself a plan.
- Owner accounts always have everything.

### The launch switch: `VITE_PAID_PLANS`

Paid plans are **off** unless the site is built with `VITE_PAID_PLANS=on`. While off, DarkWorld is entirely free: every lesson and lab is open and stays in the bundle, there are no Pro/Max badges or locks, and the Pricing, Billing, Upgrade and Refunds links are hidden (`/pricing` and `/billing` redirect away). Deploying this code with the switch off changes nothing for learners.

To launch paid plans: finish the Paystack setup below, test it, publish the paid content, then add `VITE_PAID_PLANS` = `on` in Vercel → Project → Settings → Environment Variables (Production) and redeploy. To go back to free, remove it and redeploy.

### Paid content is not in the public app

With the switch on, the production build (`npm run build`) does not contain Pro or Max content. A build step (`scripts/vite-paid-content.mjs`) replaces each paid lab with a catalogue stub (title, category, difficulty, flag count) and removes each paid lesson's body, quiz and answers, keeping only its outline. `scripts/check-paid-build.cjs` then fails the build if any paid flag or lesson passage is found in `dist/`.

The full content is published to the private `paid-content` Storage bucket by `npm run publish:paid-content`. Its access rule (`supabase/migrations/0014_paid_content.sql`) lets an account download a file only while its plan includes it, and lets the owner accounts download everything. The app downloads a paid lab or lesson when it is opened (`src/lib/paidContent.ts`).

`npm run dev` still uses the full source, so local development is unchanged.

### Release order (important)

Once a build with the switch on is live, paid labs and lessons exist **only** in Storage, including for the owner accounts. Publish the content before turning the switch on, and republish whenever a paid lab or lesson changes:

1. Apply migrations `0013_billing.sql` and `0014_paid_content.sql`. *(Done on 17 November 2026.)*
2. `npm run publish:paid-content -- --project-ref <ref>` (try `-- --dry-run` first). *(First published 17 November 2026; republish after any paid-content change.)*
3. Set `VITE_PAID_PLANS=on` and deploy the site.

## One-time setup

1. **Paystack account.** Finish business verification and enable the Card and Mobile Money channels for GHS.
2. **Create two plans** in Paystack (Payments → Plans), interval *Monthly*, currency GHS:
   - DarkWorld Pro: GH₵82 (shown as ≈ US$6.99)
   - DarkWorld Max: GH₵152 (shown as ≈ US$12.99)

   The amounts must match `MONTHLY_AMOUNT` in `billingPlans.ts`. Note each plan code (`PLN_…`).
3. **Database.** Apply `supabase/migrations/0013_billing.sql` and `0014_paid_content.sql` (for example `supabase db push`), then publish the paid content: `npm run publish:paid-content -- --project-ref <ref>`.
4. **Secrets** (server only; never put these in `.env` or Vercel):

   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx PAYSTACK_PLAN_PRO_MONTHLY=PLN_xxx PAYSTACK_PLAN_MAX_MONTHLY=PLN_xxx BILLING_ALLOWED_ORIGINS=https://www.darkworldacademy.tech,https://darkworldacademy.tech
   ```

   The first origin is the default return address after paying. Add `http://localhost:5173` only on a test project.
5. **Deploy the functions:**

   ```bash
   supabase functions deploy paystack-checkout
   ```

   ```bash
   supabase functions deploy paystack-webhook --no-verify-jwt
   ```

   The webhook must skip the JWT check because Paystack cannot send a Supabase session; it checks Paystack's signature instead.

   Also deploy account deletion (Profile → Delete account), which cancels a renewing subscription before deleting:

   ```bash
   supabase functions deploy delete-account
   ```
6. **Webhook URL.** In Paystack → Settings → API Keys & Webhooks, set `https://<project-ref>.supabase.co/functions/v1/paystack-webhook`.
7. **Test first.** Do steps 2–6 with the Paystack *test* secret key and test plans, pay with Paystack's test card and test mobile money numbers, and confirm the plan appears on the Billing page. Then repeat with the live key and live plans.

## Changing prices

Edit `billingPlans.ts`. For monthly subscriptions, also create new Paystack plans at the new amount and update the plan-code secrets. Existing subscribers stay on their old Paystack plan until you migrate them, and the Terms require telling them before a renewal price changes.

## Changing what is included

Edit `src/data/planTiers.ts`. New labs are free until they are added to `PRO_LABS` or `MAX_LABS`. Run `npm run test:billing` afterwards, then republish the paid content (`npm run publish:paid-content`) before deploying, so newly paid items are in Storage when the build stops shipping them.

A lesson body that is a React component may only use the display components listed in `leafComponents()` in `scripts/paid-content.cjs` (CodeBlock, Callout, PracticeTasksCallout, CurriculumArticle) plus plain elements and hook-free components. `node scripts/check-paid-content.cjs` (part of `npm run test:platform`) checks every paid lesson renders identically after publishing.
