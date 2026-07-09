import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'secreview-ws', user: 'root', root: dir(files) };
}

export const secEngineeringLabs: LabScenario[] = [
  {
    id: 'secengineering-stride-threat-model-audit',
    title: 'Security Engineering: STRIDE Threat Model Audit',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A design document for a new internal file-sharing feature is up for security review before it ' +
      'ships. Apply the STRIDE framework from the Threat Modeling lesson to the data flow description and ' +
      'identify which specific STRIDE category the reviewer\'s existing notes flag as unaddressed.',
    objectives: [
      { text: 'Review the design document\'s data flow description', why: 'Threat modeling starts with understanding how data actually moves and where trust boundaries sit — you can\'t apply STRIDE without this first.' },
      { text: 'Cross-reference each trust boundary against all six STRIDE categories', why: 'This is the actual mechanical process from the lesson — a systematic pass, not just intuition, is what catches threats a quick read-through would miss.' },
      { text: 'Identify the specific unaddressed category and capture the flag', why: 'Naming the exact category (not just "this seems risky") is what makes a threat-model finding actionable for engineering to actually fix, rather than a vague concern nobody owns.' },
    ],
    hints: [
      'cat ~/file-share-design-doc.txt',
      'Walk through Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege one at a time against the described data flow.',
      'One category has explicitly NO mitigating control described anywhere in the document — that\'s the gap.',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'file-share-design-doc.txt': file(
          [
            'FEATURE: Internal File Sharing v2',
            '',
            'DATA FLOW:',
            '  User Browser --(auth token)--> API Gateway --(validated request)--> File Service --> Object Storage',
            '',
            'CONTROLS IN PLACE:',
            '  - Spoofing: mitigated via signed JWT auth tokens, validated on every request',
            '  - Tampering: mitigated via TLS in transit + storage-layer checksums',
            '  - Information Disclosure: mitigated via per-object ACL checks in File Service',
            '  - Denial of Service: mitigated via API Gateway rate limiting',
            '  - Elevation of Privilege: mitigated via least-privilege IAM roles per service',
            '',
            'REVIEWER NOTE: No control is described anywhere for detecting or attributing WHO deleted a',
            'shared file after the fact — no audit log requirement is mentioned in this document at all.',
            'This is a Repudiation gap: a user (or compromised account) could delete a file with zero',
            'way to prove who did it or when.',
            'flag{repudiation_gap_no_audit_logging_requirement}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'secengineering-crypto-code-review',
    title: 'Security Engineering: Cryptographic Code Review',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A pull request implementing file encryption is up for security review. Apply the cryptographic ' +
      'engineering pitfalls from the module — specifically nonce/IV handling — to find the exact line that ' +
      'introduces a catastrophic vulnerability despite using a strong, modern cipher.',
    objectives: [
      { text: 'Review the code snippet under review', why: 'The cipher choice itself (AES-GCM) is modern and correct — the vulnerability, if any, has to be in how it\'s USED, exactly the lesson\'s core point.' },
      { text: 'Identify the nonce/IV handling pattern used across multiple encryption calls', why: 'AES-GCM catastrophically fails confidentiality guarantees if the same nonce is ever reused with the same key — this is the single most important thing to check in any GCM implementation.' },
      { text: 'Capture the flag identifying the exact line/pattern responsible', why: 'Precisely naming the vulnerable pattern (not just "crypto looks wrong") is what lets the actual fix (generate a fresh random nonce per encryption call) get implemented correctly.' },
    ],
    hints: [
      'cat ~/encryption-pr-diff.txt',
      'Check whether the nonce/IV value is generated fresh for every single encryption call, or reused.',
      'A hardcoded or static nonce value used across multiple messages under the same key is the vulnerability here.',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'encryption-pr-diff.txt': file(
          [
            '+ import { createCipheriv, randomBytes } from "crypto";',
            '+',
            '+ const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY;',
            '+ const STATIC_NONCE = Buffer.from("000000000000", "hex");  // <-- reused across every call, never regenerated',
            '+',
            '+ function encryptFile(plaintext) {',
            '+   const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, STATIC_NONCE);',
            '+   return Buffer.concat([cipher.update(plaintext), cipher.final()]);',
            '+ }',
            '',
            'REVIEWER FINDING: STATIC_NONCE is defined once and reused for EVERY encryptFile() call under the',
            'same key. AES-GCM security completely breaks down under nonce reuse — an attacker with two',
            'ciphertexts encrypted under the same key+nonce can recover the XOR of both plaintexts, and in',
            'GCM specifically, can also forge the authentication tag.',
            'flag{aes_gcm_static_nonce_reuse_breaks_confidentiality}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'secengineering-security-debt-rootcause',
    title: 'Security Engineering: Root-Cause Analysis of Compounding Security Debt',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A major incident just occurred. The post-incident review timeline shows a chain of individually ' +
      'small decisions, made over nearly two years, that compounded into the eventual breach — the exact ' +
      '"security debt compounds silently" pattern from the course\'s closing lesson. Identify the ORIGINAL ' +
      'root-cause decision, not just the final triggering event.',
    objectives: [
      { text: 'Review the full incident timeline from its earliest entry', why: 'Root-cause analysis requires reading backward from the trigger to the true origin — the final event is almost never the actual root cause, just the last domino.' },
      { text: 'Identify the original shortcut taken under time pressure, years before the incident', why: 'This is exactly the pattern the course\'s closing lesson describes — a deferred fix that had no immediate consequence, forgotten, until an unrelated trigger finally exercised it.' },
      { text: 'Capture the flag naming the true root cause', why: 'A post-incident report that only addresses the final trigger (and not the original decision) sets the organization up to repeat the same failure pattern with a different trigger next time.' },
    ],
    hints: [
      'cat ~/incident-postmortem-timeline.txt',
      'Read from the OLDEST entry forward, not the most recent one backward.',
      'The true root cause is a decision made long before anyone realized it would matter.',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'incident-postmortem-timeline.txt': file(
          [
            '2024-03-01  A temporary IAM role with wildcard S3 permissions was created for a one-week data',
            '            migration project. Ticket to remove it after the migration was never actioned.',
            '2024-06-15  The engineer who created the temporary role left the company.',
            '2025-02-10  An unrelated web application was deployed using an EC2 instance that, for convenience,',
            '            was assigned the same temporary role (nobody remembered its original narrow purpose).',
            '2026-07-01  That web application was found to have an SSRF vulnerability.',
            '2026-07-11  An attacker exploited the SSRF to reach the instance metadata service, inheriting the',
            '            temporary role\'s still-active wildcard S3 permissions, and exfiltrated production data.',
            '',
            'ROOT CAUSE: not the SSRF bug itself, and not the 2026 role reuse — the TRUE origin is the 2024',
            'temporary migration role that was never decommissioned after its one-week purpose ended.',
            'flag{root_cause_is_the_2024_never_decommissioned_temporary_role}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
