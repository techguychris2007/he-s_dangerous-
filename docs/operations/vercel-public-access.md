# Public access to DarkWorld on Vercel

On 17 October 2026, an anonymous request to the supplied deployment returned
HTTP 302 to Vercel's SSO endpoint with a body saying “Protected by Vercel
Authentication.” This happens before the application loads. Changing React routes
or Supabase login code cannot remove that hosting restriction.

## Publish the learner-facing address

1. Open the hackerhub project in Vercel.
2. Find the current production deployment and its assigned production domain.
   Confirm that the intended Git commit was deployed.
3. Inspect Settings → Deployment Protection → Vercel Authentication. Configure
   the intended learner-facing production domain for public access; development
   previews can remain protected. Available choices depend on the project plan.
4. Save any change and verify without Vercel login cookies.
5. Share the stable production domain rather than a unique build URL.

A unique URL refers to one deployment and is subject to protection and retention.
A production domain follows its assigned production deployment. Do not distribute
an automation bypass token as a public learner link.

## Verify before sharing

    npm run check:deployment -- https://your-public-production-domain

The check sends anonymous requests, detects Vercel Authentication and unavailable
deployments, and verifies the app shell and entry script. Also test in a private
browser window and verify the platform's own sign-in separately.

For an unavailable/moved message, preserve the exact URL, status and Vercel error
code. Check whether the deployment was deleted or disabled and whether the domain
points to a ready deployment. The confirmed authentication redirect does not
establish the cause of every other message visitors may encounter.

## Account confirmation and password recovery

Once the permanent public origin is chosen, review Authentication → URL
Configuration in Supabase. The Site URL and allowed redirect URLs should include
the production origin so email confirmation and password recovery do not return
learners to obsolete previews. This is separate from Vercel deployment protection.

## References

- [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
- [Deployment and production URLs](https://vercel.com/docs/deployments/generated-urls)
