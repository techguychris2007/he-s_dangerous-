# Owner review before publishing DarkWorld's policies

Prepared October 27, 2026. These documents are local drafts only. Standalone draft pages are prepared at `public/privacy.html` and `public/terms.html`, linked from the landing and sign-in pages for local review. They have not been deployed, registered as Google policy URLs, or made binding on learners.

## Decisions to confirm

1. **Operator identity and contact.** Confirm the legal person or organization that operates DarkWorld, its location, and the address/contact information that should appear publicly. The drafts use ChrisB and the support email already configured in Google Cloud; they do not infer a legal entity or governing jurisdiction.
2. **Audience and age.** Decide who may use the academy, including minors, school groups, and any parental/school authorization process. No numerical age threshold has been invented. The final privacy notice and terms must match the actual audience and applicable rules.
3. **Data requests.** Confirm that the listed support mailbox will accept access, correction, export, and deletion requests; decide how ownership will be verified and how requests will be handled. There is no self-service account-deletion flow in the inspected app. Do not promise a fixed response deadline until there is an operational process.
4. **Retention and processing locations.** Confirm actual Supabase/Vercel project regions, enabled logging/analytics products, backups, retention periods, and provider contracts. Source code alone cannot prove these live service settings. Set a practical deletion/retention schedule before public rollout.
5. **AI services.** Confirm whether both tutor functions are deployed, which providers are enabled, and their contracted request-retention/training settings. The drafts disclose Groq, Google Gemini, possible search grounding, and relevant submitted learning context. They do not claim zero retention or that providers never train on submitted requests.
6. **Sharing and identity.** Confirm instructor access and database migrations are actually deployed as intended. Comments and leaderboard entries resolve names from account metadata or an email prefix; generated cyber names do not currently guarantee anonymity in those features. The drafts disclose that behavior rather than claiming all learning data are private.
7. **Commercial and legal terms.** Confirm whether the service will charge fees, introduce subscriptions, promise service levels, or use additional licenses. The drafts do not create refund rules, arbitration, indemnities, a liability cap, a governing-law clause, or guaranteed legal compliance without those decisions.
8. **Data use commitments.** Confirm the proposed promise not to sell Google sign-in data or use it for targeted advertising. No advertising integration was found in the inspected source, but that is not an audit of all business practices or infrastructure.

## Evidence used to draft the text

| Topic | Inspected implementation |
| --- | --- |
| Account registration and social sign-in | `src/state/authStore.ts`, `src/lib/supabaseClient.ts` |
| Server-synchronized learning records | `src/lib/progressSync.ts`, `src/state/progressStore.ts` |
| Shared leaderboard | `supabase/migrations/0004_leaderboard.sql` |
| Instructor account and progress access | `supabase/migrations/0009_instructor_identity.sql` |
| Lab comments and account-derived names | `src/lib/labComments.ts`, `supabase/migrations/0008_lab_comments.sql` |
| Ratings and feedback | `src/lib/labRatings.ts`, `src/lib/feedback.ts`, `supabase/migrations/0005_feedback.sql` |
| AI request context and provider forwarding | `src/lib/aiTutor.ts`, `supabase/functions/ai-tutor/index.ts`, `supabase/functions/ai-lab-tutor/index.ts` |
| Device-local and offline records | `src/state/progressStore.ts`, `src/state/authStore.ts`, `src/state/pwa.ts` |

The repository has unrelated work in progress. The policy-page preparation adds links to the landing and sign-in pages. Database migrations describe intended behavior; their presence does not prove every live production database policy is installed.

## Google publication and deployment follow-up

Google's public-app requirements call for a public privacy policy accurately describing access, use, storage, and sharing of Google data. An unpublished Markdown draft is not a valid public policy URL.

After approving the text and resolving the decisions above:

- Finalize the prepared standalone privacy and terms pages. Resolve owner-review decisions, replace draft notices with the approved effective date, and regenerate them with `python scripts/prepare-policy-pages.py` after updating the renderer and approved source text.
- Deploy the approved pages and current OAuth UI; production was observed serving the October 23 `main` build rather than the newer OAuth branch.
- Register the actual public URLs in Google Auth Branding, review its remaining validation messages, then publish when eligible. Do not register nonexistent URLs or claim Google verification is complete merely because the provider is enabled.
- Separate development and production OAuth client configuration before public launch. The newly created client currently includes `http://localhost:5173` for testing; Google's production guidance calls for removing development-only origins from production clients.
- Verify a fresh complete login through the deployed button, the callback, the signed-in page, sign-out, and a returning-account login. A successful Google consent screen alone does not prove the app has stored its session.

## Official references

- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- [Google OAuth production policy guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
- [Supabase Google sign-in guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

These references informed the Google-data disclosures and publication checklist; the drafts are not a representation that all jurisdiction-specific legal requirements have been assessed.
