# ML Security and lab explanations release

Base: `9a1609c`. Selected additions from the local quality-improvement branch, merged onto the live release rather than publishing its older baseline.

Included:
- ML Portal Module 14, six lessons and three graded Python assignments.
- Six primary documentation/repository links for the new unit; all existing resource entries retained.
- Thirty-five expanded lab briefings and five explanation corrections across nineteen scenario files.

An AST comparison removed only briefing/why properties and compared the remaining code. All nineteen scenario files matched their live-release versions, confirming commands, hints, flags, objectives, fixtures, files and response logic were preserved.

Excluded: pre-security rewrite (changed IDs), certificate/PDF redesign, dependency upgrades, unregistered secure-engineering drafts and unresolved CVE environment/answer changes. No application components, page layouts, authentication, progress IDs, existing certificate flow, library or offline-runtime code changed.

Validation: production build, 52 guided-lab replays, seven supplied SSH accounts, platform integrity, dig shell and PWA checks passed. Full ML execution uses an isolated local Python environment; test dependencies are not added to the application or deployment.

ML execution passed: 41 independently executed examples and five assignment graders (including the three new assignments, 79 new checks); reference implementations pass and starters are rejected.
