# Legal checklist before charging for DarkWorld

Prepared November 17, 2026 for the owners. This is a working checklist, not legal advice. Have a Ghanaian lawyer or business adviser confirm each item before the first paid plan is sold.

## 1. Register the business

- [ ] Register a business with the **Office of the Registrar of Companies (ORC)**. A sole proprietorship is quickest; a private limited company (both founders as directors/shareholders) separates personal and business liability and suits two founders better.
- [ ] Get the business **Tax Identification Number (TIN)** / Ghana Card-linked TIN from the **Ghana Revenue Authority (GRA)**.
- [ ] Open a business bank account in the registered name. Paystack pays out to this account.
- [ ] Ask the adviser whether DarkWorld's expected revenue requires **VAT / NHIL / GETFund / COVID-19 levy** registration, and whether prices must be shown tax-inclusive. Update `supabase/functions/_shared/billingPlans.ts` if tax must be added.
- [ ] Write a short founders' agreement: ownership split, roles (CEO: Benedict Adjei; Co-Founder: Bondam Christopher Kweku), who controls the Paystack and bank accounts, and what happens if a founder leaves.

## 2. Data protection

- [ ] Register DarkWorld as a data controller with the **Data Protection Commission (DPC)**, as required by the Data Protection Act, 2012 (Act 843), and renew it as the DPC requires.
- [ ] Name a person responsible for data-protection requests (the privacy policy routes them to the support email).
- [ ] Decide a retention schedule for inactive accounts, and confirm how long payment records must be kept for tax purposes.
- [x] Self-service account deletion on the Profile page (`supabase/functions/delete-account`; deploy it with `supabase functions deploy delete-account`). It cancels a renewing card subscription first, then deletes the account and every linked record.

## 3. Payments (Paystack)

- [ ] Complete Paystack business verification (KYC) with the ORC documents, TIN and directors' IDs.
- [ ] Turn on the **Card** and **Mobile Money** channels for GHS.
- [ ] Follow `docs/billing-setup.md` to create the two monthly plans, set the secrets and register the webhook.
- [ ] Make one real low-value payment by card and one by mobile money, then refund them, before announcing paid plans.

## 4. Consumer and e-commerce disclosures

The Electronic Transactions Act, 2008 (Act 772) expects online sellers to show who they are and the terms of sale before payment. Already in place in this repository:

- [x] Pricing page with prices in GHS, what each plan includes, renewal rules and payment methods (`/#/pricing`).
- [x] Terms of Service with plans, renewal, cancellation, governing law (`public/terms.html`).
- [x] Refund Policy (`public/refunds.html`).
- [x] Privacy Policy covering Paystack and Act 843 rights (`public/privacy.html`).
- [x] Links to all three from the landing page footer and the pricing page.

Still to do:

- [ ] Replace every **[Registered business name]**, **[number]** and **[business address]** placeholder in `docs/legal/*.draft.md`.
- [ ] Confirm the age rule (18+, or a parent/guardian for a purchase) with the adviser.
- [ ] Consider a dedicated support address on the business domain (for example support@darkworldacademy.tech) instead of a personal Gmail.
- [ ] Regenerate the pages as final: `POLICY_EFFECTIVE_DATE="1 December 2026" python scripts/prepare-policy-pages.py` (the script refuses while placeholders remain).

## 5. Content and trademarks

- [x] The library is free on every plan, so no plan charges for Creative Commons NonCommercial books. Commercial books are listed as links only and are not hosted.
- [x] Marketing and lesson copy no longer names or compares DarkWorld to other training platforms (TryHackMe, Hack The Box, KC7, CyberDefenders, PentesterLab).
- [ ] Ask the adviser whether hosting CC BY-NC books on a site that also sells plans is acceptable, or whether those PDFs should become links to the authors' own sites. This is the one remaining licence risk.
- [ ] Check the "DarkWorld" name and logo are not already registered as a trademark in Ghana for education services; consider registering it with the Registrar-General.
- [ ] Real product names (Splunk, Kali Linux, Wireshark, Nmap and others) are used only to describe what a lesson teaches. Do not use their logos or imply partnership.

## 6. Google sign-in

- [ ] The items in `docs/legal/owner-review.md` (publish final policies, register them with Google, separate development and production OAuth clients) still apply.
