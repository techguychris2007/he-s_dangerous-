# DarkWorld Academy Privacy Policy

**Draft for owner review — not published or effective. Prepared October 27, 2026.**

## Who this policy covers

This policy describes how DarkWorld Academy handles information when you use its website, installed web app, account services, lessons, and training labs. DarkWorld is operated by ChrisB. Contact us about privacy or your account at **techguychris2007@gmail.com**.

## Information we receive

**Account information.** When you register with an email address and password, our authentication provider, Supabase, processes your credentials. We receive your account identifier, email, profile information you supply, and account/session information. Your password is not shown to other learners.

**Google sign-in.** If you choose Google, Google supplies the basic identity information you authorize, including your name, email address, profile picture, and provider identifier. Supabase processes the sign-in and associates that identity with your DarkWorld account. DarkWorld uses these details for account creation, authentication, account recognition, and the profile-related features described below. The Google sign-in integration requests basic identity permissions; it does not request access to your Gmail messages, Google Drive files, contacts, or calendar.

**GitHub sign-in.** If you choose GitHub, GitHub and Supabase process authentication and provide the identity/profile information made available through that sign-in. This sign-in feature does not require access to your repository contents.

**Learning records.** We store records such as completed lessons and coding tasks, captured training flags, quiz scores, bookmarked labs, completion timestamps, activity dates, coding-attempt counts, hints used, and whether solutions were revealed. These records support progress restoration, learning feedback, achievements, and teaching features.

**Contributions and support.** We receive lab comments, ratings, difficulty feedback, and support messages that you submit. A feedback submission can include its category, the page from which you submitted it, your account identifier, and submission time.

**Device and service information.** The browser stores information needed for sessions, preferences, progress, saved work, and offline functionality. Our hosting and infrastructure providers also process network requests and operational information needed to deliver and protect their services, which can include IP addresses, request times, browser information, and service logs.

## How we use information

We use information to authenticate you, provide lessons and exercises, restore and synchronize learning progress, display achievements, respond to feedback, maintain the service, investigate abuse or failures, and support authorized teaching activities. We use Google identity information for the account and related features explained here, rather than to request unrelated access to your Google account.

We do not sell Google sign-in data or use it for targeted advertising. We do not request broader Google permissions simply because you use an AI tutor. If a future feature needs additional Google data or a materially different use of existing data, we will explain it and obtain the permission required for that feature before accessing it.

## What other people can see

**Lab discussions.** Comments you post are intended for other signed-in learners. They can include your account-derived display name, message, posting time, and an associated account identifier. A display name can come from your account's full name or the part of your email before the `@` sign. A generated cyber name elsewhere in the interface does not necessarily replace that name in shared features. Do not post private information in a comment. You can delete your own comments through the comment controls.

**Leaderboard.** Participation is off by default. If you opt in, other signed-in learners can see an account-derived name and training performance used for the leaderboard. You can turn participation off. Removing yourself from the leaderboard does not remove comments you posted separately.

**Teaching administration.** An authorized instructor can view account and learning information for teaching and administration, including names, email addresses, account creation dates, progress, and quiz results. Access is intended to be restricted to authorized staff; this is separate from public leaderboard participation.

**Ratings.** Learners can see aggregate lab ratings and difficulty feedback. Your individual rating remains associated with your account in the backend.

**Exports.** Certificates, lab reports, and other files you download can contain information you choose to include. You control whether you share these files and with whom.

## Optional AI tutoring

When you use an AI tutor, your question and relevant learning context are sent through a Supabase function to the configured AI service. The current integrations use **Groq** and **Google Gemini**, with fallback between providers when one is unavailable. Gemini can use Google Search grounding for some answers.

Depending on the feature, the context can include a lesson or lab title, selected book/page text, page number, your current editor code, recent simulated-terminal commands and output, and hints you have revealed. Normal lesson and lab use does not itself require sending a tutoring question. Do not submit passwords, access tokens, personal records, confidential code, or other material you are not authorized to share with these providers.

The account sign-in and AI tutoring integrations have different purposes. Basic Google sign-in does not grant the tutor access to your Gmail or Drive. AI providers process submitted requests under their applicable service terms and data practices; their processing and retention should not be assumed to match DarkWorld's own storage.

## Providers and external links

DarkWorld uses **Vercel** for website hosting and **Supabase** for authentication, database storage, and backend functions. Google and GitHub handle their respective sign-in flows. Groq and Google process optional AI requests as described above. These providers may process data outside your country. We may also disclose information when legally required or necessary to respond to a legitimate security incident.

External books, reference sites, and repositories have their own privacy practices. Following an external link takes you to that provider's service.

## Browser storage and offline use

DarkWorld uses browser storage and offline caches to remember sessions, preferences, learning progress, and downloaded resources. Some workspaces also save exercise state on the device. Some records synchronize to your account when connectivity is available; other saved work can remain device-local.

Signing out ends your active app session, but it should not be treated as a guarantee that every downloaded resource or locally saved record has been erased. On a shared computer, sign out and clear the site's browser data when finished. Clearing browser data may permanently remove work that has not synchronized. Uninstalling the web app is not a request to delete your server-side account.

## Retention, access, and deletion requests

We retain account and learning records for providing and administering the service, subject to applicable requirements and legitimate operational needs. DarkWorld does not currently apply a published automatic deletion schedule to every category of data.

Contact **techguychris2007@gmail.com** to ask about access, correction, export, or deletion of your account information. We may need to verify account ownership before acting. Deleting browser data alone does not delete server records; revoking Google or GitHub access alone also does not delete your DarkWorld account. Provider logs, backups, and previously shared exports may have separate retention limits or processing schedules.

You can revoke Google's permission through your [Google Account connections](https://myaccount.google.com/connections). You can manage GitHub authorization through your GitHub account settings. Revocation can prevent future sign-in using that provider; arrange another supported account-access method first if needed.

## Security and changes

DarkWorld uses authenticated sessions and account-scoped backend access controls intended to limit access to personal records. No service or browser-storage mechanism provides an absolute guarantee against loss or unauthorized access. Protect your device and sign-in credentials, and report suspected account misuse promptly.

If this policy changes, the published version will show its update date. Material changes to the use of Google data will be explained before that new use and additional consent will be requested where required.
