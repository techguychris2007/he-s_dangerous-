# Defensive investigation chains

Three existing routes now contain eight ordered checkpoints each. They appear in the SOC portal's investigation casefiles section; their former single-search versions are replaced, not duplicated.

| Existing route | Expanded investigation | Passive OSINT workspace |
| --- | --- | --- |
| `/siem-lab/siem-sentinel-impossible-travel` | Travel anomaly, phishing destination, session/mailbox activity, business impact, account containment, persistence removal, recovery and detection testing | theHarvester |
| `/siem-lab/siem-qradar-capital-one-ssrf-metadata-2019` | Metadata/proxy correlation, role-session pivot, infrastructure context, policy authorization, object exposure, revocation, application repair and retesting | Shodan |
| `/siem-lab/siem-sentinel-moveit-cl0p-2023` | Web request/file correlation, transfer activity, public advisory and asset relationship, artifact preservation, exposure/coverage, containment, trusted build and recovery | Maltego |

Each case has 24 authored records: two supporting records and a decoy per checkpoint. Display order varies. Learners search the existing consoles, inspect evidence, select the necessary records and choose a supported conclusion. Uninspected records, unrelated evidence, incorrect decisions and skipped stages do not earn proof. Each eight-stage chain totals 100 points; previous five-stage cases retain their 20-point checkpoints.

The records are explicitly fictional reconstructions. They are informed by cited Microsoft, CISA/FBI, Capital One and AWS material, not presented as original victim logs. Table timestamps describe case-file collection; times inside a record refer to the incident or validation event. OSINT is a frozen passive snapshot, available offline, and does not contact suspicious infrastructure. Response receipts and tests model a response; no real endpoint or cloud tenant is changed.

The exercise may finish while accurately retaining unresolved privacy or fleet-hunt tasks. The interface labels this **training complete**, not proof that every real-world follow-up is closed.

Existing route IDs and earned proof identifiers are retained. Previously earned proofs count toward the expanded chain; the additional checkpoints require new work. Previously completed short labs may consequently appear in progress under the expanded requirements. Account-scoped proof persistence supports continuing later and prevents one account from inheriting another's progress.

Validation: `node scripts/check-defensive-investigations.cjs` checks all six chains (39 checkpoints), correct and incorrect evidence paths, original proofs, route uniqueness, account isolation, resuming, completion dates and duplicate-proof handling. The check is included in `npm run test:platform`. Netcat completion and device-access checks are also part of that suite.
