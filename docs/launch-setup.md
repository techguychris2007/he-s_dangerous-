# Launch setup: checks, error reports, analytics and domain

The code for all four is in the repo. Error reports and analytics stay off until the settings below
are added in Vercel, so nothing changes for learners until you switch them on.

## 1. Checks on every push (GitHub Actions)

`.github/workflows/checks.yml` runs lint, the type check and build, `test:platform` and the other
checks on every push to `main` and every pull request. It needs no secrets.

- Results: the **Actions** tab on GitHub, and a ✓ or ✗ next to each commit.
- Optional, recommended: GitHub → Settings → Branches → add a rule for `main` that requires the
  **Checks** job to pass before merging. This matters once more than one person pushes.

## 2. Error reports (Sentry)

1. Claim the Sentry student offer from the GitHub Student Pack and create a project of type
   **React**.
2. Copy the project's **DSN** (Settings → Client Keys).
3. In Vercel → Project → Settings → Environment Variables, add `VITE_SENTRY_DSN` with that value
   for **Production** (and Preview, if you want reports from preview deployments too).
4. Redeploy. Reports from preview deployments are tagged `preview`; the live site is `production`.
5. In Sentry → Project Settings → Security & Privacy, also turn on **Data Scrubber** and
   **Prevent Storing of IP Addresses**, a second layer behind the app's own scrubbing.

What is removed before a report leaves the browser: `src/lib/monitoringScrub.ts`, tested by
`scripts/check-monitoring.cjs`.

## 3. Analytics (SimpleAnalytics)

1. Claim the SimpleAnalytics student offer and add a website with the production hostname
   (for example `darkworld.dev`, or the current `*.vercel.app` production hostname until the
   domain is ready).
2. In Vercel, add `VITE_ANALYTICS_HOSTNAME` with exactly that hostname (no `https://`) for
   **Production**, and redeploy.
3. Analytics runs only on that hostname, never for the owner accounts, and never for visitors with
   Do Not Track on. Routes are counted in hash mode, so `/#/labs` and `/#/profile` are separate pages.

When you switch to the custom domain, change both the SimpleAnalytics website and
`VITE_ANALYTICS_HOSTNAME` to the new hostname.

## 4. Custom domain

The app builds every link and sign-in redirect from the address it is opened at, so no code
change is needed. In order:

1. Claim a free domain (Name.com: `.dev`, `.app`, `.software` and others; or .TECH). Check the
   **renewal price** first: some are free for one year only.
2. Vercel → Project → Settings → Domains → add the domain and follow its DNS instructions. Set it
   as the production domain, and redirect the old `*.vercel.app` address to it.
3. Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://<new-domain>`
   - **Redirect URLs**: add `https://<new-domain>` and `https://<new-domain>/`. Keep the old
     address until everyone has moved, then remove it.
4. Google sign-in: Google Cloud Console → the OAuth client → add the new domain under
   **Authorized JavaScript origins**, and update the app's homepage, privacy and terms links on
   the OAuth consent screen to the new domain.
5. GitHub sign-in: GitHub → Settings → Developer settings → OAuth Apps → update **Homepage URL**.
   The callback URL is Supabase's and does not change.
6. Check it: `npm run check:deployment -- https://<new-domain>`, then sign in with email, Google
   and GitHub, and request a password reset.

Learners on the old address keep their progress (it is synced to their account), but each
address has its own browser storage, so unsynced local work and offline downloads do not carry over.
