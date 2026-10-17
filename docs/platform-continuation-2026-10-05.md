# Platform continuation — 5 October 2026

## Delivered in the working tree

- Six pre-security modules with 18 structured lessons, exercises, quizzes and appropriate linked practice.
- Five new defensive modules with 15 lessons. The separate defensive path includes existing SOC, SIEM, detection, response and forensic teaching, plus five cumulative learning milestones.
- Extended-study studios across the 26 original modules, with module-specific reasoning, applied briefs and portfolio acceptance criteria.
- The earlier five advanced offensive/post-exploitation modules, 20 lessons and 10 campaigns remain integrated.
- Two stateful website assessments and two visual directory assessments. Website responses, identity changes and graph relationships come from the terminal engine. Each includes repair/retest and engagement closeout.
- 414 existing labs have gated follow-on assessment, repair verification, evidence-report and cleanup phases. This is a reusable extension of their original scenarios, not 414 independently rebuilt target environments.
- Lesson typography, section navigation, reading progress, text sizing, focus mode, mobile navigation and lab layout improvements.
- Per-account progress isolation, hydrate-before-save synchronization and visible save status.
- Structured evidence notebook, per-account device drafts, Markdown/social exports, paginated PDF reports, completion-gated certificates and a platform SVG badge.

## Authorization and release state

The linked Supabase database successfully applied migration 0009_instructor_identity.sql. Instructor access requires the confirmed, nonanonymous account techguychris2007@gmail.com with trusted app metadata darkworld_username=chrisb and darkworld_role=instructor or admin. Editable user metadata cannot grant access. The protected dashboard function checks the same server-side conditions. Refresh the account session after this change.

Frontend changes are local and have not been deployed. Development previews use an in-memory fixture under scripts/preview-platform.html; this is not a production login bypass and is not included in the normal Vite build.

## Validation

- Production build passed outside the Windows filesystem sandbox, which otherwise prevents Vite resolving worker/font realpaths.
- Platform integrity: 42 modules, 194 lessons, 663 terminal labs, five cumulative defensive milestones; valid routes and new lesson mappings.
- Fourteen full campaign walkthroughs and all 414 follow-on depth extensions passed.
- Website checks cover invalid tokens, incorrect methods, premature repair, fresh state and repair verification. Directory checks cover segmentation, wrong credentials, wrong-principal retests and evidence reset.
- Account switching and offline snapshot restoration passed.
- PDF checks: incomplete certificates rejected, one-page sample certificate, three-page sample report, eight-page long-content pagination. All sample PDF pages were rendered and visually inspected.
- Browser review: lesson reader, website response reflected from terminal, directory evidence state, evidence-to-Markdown generation, locked incomplete certificate and narrow-screen lab layout. No console errors observed in the checked preview.

## Operational limits and further work

These labs remain deterministic browser simulations. They do not provision real websites, Linux VMs or Windows domain controllers. Real infrastructure labs require isolated orchestration, per-user environments, resource limits, reset/expiry, monitoring and server-side assessment validation.

Completion records are learner-managed training records, not independently verified professional credentials. Device report drafts are not synchronized to Supabase; export copies for durable storage. Career milestones indicate curriculum progress, not employment qualification.

Existing build warnings remain in the third-party JSCPP dependency (eval and browser-externalized Node modules), and several bundles exceed the default size advisory. Existing lint warnings are non-blocking. Live authentication/RLS behavior, production deployment, multi-device synchronization conflicts, every legacy exercise path and every platform route have not received exhaustive end-to-end testing in this pass.

Content emphasizes durable reasoning, identity, authorization, evidence, recovery and architecture. Vendor syntax, legal requirements and threat examples will still need periodic editorial review; no curriculum can be guaranteed unchanged for 10–15 years.

## Additional review fixes

SIEM consoles keep executed results stable while a query draft is edited and label their query inputs. SIEM and OSINT investigations now use the same evidence notebook and completion-gated document workflow. The SOC portal includes all SOC terminal campaigns and forensic teaching. The mobile guides collapse so investigators can reach the workspace directly, and terminal scrolling stays inside the terminal.

Completion timestamps are now recorded atomically when the final distinct proof is captured. Loading older records no longer invents a completion date. Tests cover threshold crossing, duplicate proofs and undated historical records.

The impossible-travel exercise was corrected to require verification of VPN/proxy context and device/session evidence instead of treating geolocation as conclusive compromise. Reference: https://learn.microsoft.com/en-us/defender-cloud-apps/investigate-anomaly-alerts

The browser check confirmed that typing a new Sentinel query preserves the last executed table until Run is selected, and a query with no matches then produces the empty state.
