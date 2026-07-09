import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

export const securityPlusAdvancedLabs: LabScenario[] = [
  {
    id: 'secplus-password-policy-audit',
    title: 'Security+: Password Policy Compliance Audit via Hash Cracking',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'An exported hash dump from the domain controller needs to be checked against the organization\'s ' +
      'stated password policy. Crack the sample hashes with hashcat using the standard wordlist and confirm ' +
      'whether the policy (minimum 12 characters, no dictionary words) is actually being enforced in practice.',
    objectives: [
      { text: 'Review the exported hash file', why: 'A password policy compliance audit always starts by confirming what you\'re actually testing against — the exact hash format tells you which cracking mode/approach applies.' },
      { text: 'Run hashcat against the hash using the standard wordlist', why: 'This is literally the standard real-world method security teams use to audit their OWN password policy compliance — cracking your own hashes with common wordlists is authorized, routine practice, distinct from attacking someone else\'s system.' },
      { text: 'Confirm the cracked password violates the stated policy and capture the flag', why: 'A "12 character minimum, no dictionary words" policy that a real employee account fails in under a second against rockyou.txt means the policy exists on paper but isn\'t technically enforced by the directory service — a very common real compliance gap.' },
    ],
    hints: [
      'cat ~/dc-hash-export.txt',
      'hashcat -m 1000 ~/dc-hash-export.txt ~/wordlists/mini-rockyou.txt',
      'The cracked password is a common dictionary word under 12 characters — a direct policy violation.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dc-hash-export.txt': file(
        '#HASHCAT_HASH:8846f7eaee8fb117ad06bdd830b7586c\n#HASHCAT_PLAINTEXT:dragon\n#HASHCAT_FLAG:flag{password_policy_violated_dragon_cracked_in_seconds}\nUser: jsmith\nHash type: NTLM (mode 1000)\n',
      ),
      wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\ndragon\nletmein\nqwerty\n') }),
    }),
    network: [],
  },
  {
    id: 'secplus-mfa-sms-bypass-analysis',
    title: 'Security+: MFA SMS OTP Interception Analysis',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'A customer reports their account was accessed despite having SMS-based MFA enabled. Review the ' +
      'carrier support ticket log to determine whether this matches the real-world "SIM swap" attack pattern ' +
      '— a well-documented weakness of SMS as an MFA factor specifically because it depends on the security ' +
      'of an entirely separate system (the mobile carrier) that the account owner doesn\'t control.',
    objectives: [
      { text: 'Review the carrier support ticket log for the affected phone number', why: 'SIM swap attacks succeed by social-engineering the CARRIER, not the target service — the evidence lives in telecom support logs, not the application\'s own logs.' },
      { text: 'Identify the fraudulent SIM transfer request timestamp', why: 'Correlating the SIM transfer timestamp against the account\'s login timestamp is what proves causation rather than coincidence.' },
      { text: 'Capture the flag confirming the SIM swap attack pattern', why: 'This is exactly why Security+ (and NIST guidance) now treats SMS as the WEAKEST acceptable MFA factor — authenticator apps and hardware keys don\'t depend on a third-party carrier\'s support desk being social-engineering-resistant.' },
    ],
    hints: [
      'cat ~/carrier-support-log.txt',
      'Compare the SIM transfer approval timestamp against the fraudulent login timestamp in the account log.',
      'cat ~/account-login-log.txt for the second half of the correlation.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'carrier-support-log.txt': file(
        'Ticket #88213: SIM transfer request for +1-555-0134, approved 2026-07-14 03:12:00\n' +
          'Agent notes: caller provided last 4 of SSN and DOB, transfer processed without additional verification\n',
      ),
      'account-login-log.txt': file(
        'Login attempt: user=jdoe, 2026-07-14 03:14:22, SMS OTP verified, login SUCCESSFUL\n' +
          '--- login occurred 2 minutes 22 seconds after the fraudulent SIM transfer was approved ---\n' +
          'flag{sim_swap_defeats_sms_based_mfa}\n',
      ),
    }),
    network: [],
  },
  {
    id: 'secplus-firewall-rule-audit',
    title: 'Security+: Firewall Rule Set Audit',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'Review an exported firewall rule set for the DMZ segment. Real security audits routinely find at ' +
      'least one overly permissive "ANY-ANY" rule left over from a troubleshooting session that was never ' +
      'removed — find it here.',
    objectives: [
      { text: 'Review the exported firewall rule set', why: 'Firewall rule audits are a standard, recurring compliance activity (required under PCI DSS and most other frameworks) precisely because rule sets accumulate cruft over years of ad-hoc troubleshooting changes.' },
      { text: 'Identify the rule permitting ANY source, ANY destination, ANY port', why: 'An ANY-ANY rule anywhere in a rule set effectively negates every more specific rule around it — it\'s one of the highest-severity single findings a firewall audit can produce.' },
      { text: 'Capture the flag identifying which rule number is the violation', why: 'Rule audits report exact rule numbers/names for remediation — "somewhere in the ruleset" isn\'t actionable, but "rule 47, added for a vendor troubleshooting session in March and never removed" is.' },
    ],
    hints: [
      'cat ~/dmz-firewall-rules.txt',
      'grep "any.*any.*any" ~/dmz-firewall-rules.txt',
      'Note the rule number and the comment explaining why it was added.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dmz-firewall-rules.txt': file(
        [
          'Rule 10: ALLOW  src=10.10.0.0/16  dst=10.10.112.5  port=443   # web app HTTPS',
          'Rule 20: ALLOW  src=10.10.0.0/16  dst=10.10.112.6  port=22    # admin SSH jump box',
          'Rule 47: ALLOW  src=ANY  dst=ANY  port=ANY   # TEMP for vendor troubleshooting 2024-03-02 - REMOVE AFTER',
          'Rule 50: DENY   src=ANY  dst=ANY  port=ANY   # default deny (never reached because of rule 47)',
          'flag{any_any_any_rule_47_never_removed_after_vendor_session}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'secplus-bcp-rto-rpo-calculation',
    title: 'Security+: Business Continuity RTO/RPO Gap Analysis',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'The business continuity plan states a Recovery Time Objective (RTO) of 4 hours and a Recovery Point ' +
      'Objective (RPO) of 1 hour for the order-processing system. Review the actual backup and recovery test ' +
      'log to determine whether the last disaster recovery test actually met those targets.',
    objectives: [
      { text: 'Review the DR test log', why: 'RTO/RPO figures written in a BCP document mean nothing until a real recovery test measures them — this is exactly why regular DR testing is a compliance requirement, not just documentation.' },
      { text: 'Calculate the actual time-to-recovery and data loss window from the test', why: 'RTO is how LONG recovery took; RPO is how much DATA was lost (measured by the age of the last successful backup at the moment of failure) — these are two distinct calculations that are frequently confused.' },
      { text: 'Capture the flag confirming which objective was missed', why: 'A BCP that looks compliant on paper but fails its own stated objectives during the ONE time it\'s actually tested is a very real, very common audit finding — and exactly why untested continuity plans can\'t be trusted.' },
    ],
    hints: [
      'cat ~/dr-test-log.txt',
      'RTO target: 4 hours. RPO target: 1 hour. Compare the actual measured values against both.',
      'One of the two targets was met; the other was missed — read carefully to see which.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dr-test-log.txt': file(
        [
          'DR Test — Order Processing System — 2026-07-01',
          'Failure simulated: 09:00:00',
          'Last successful backup before failure: 06:30:00  (2.5 hours of data at risk)',
          'System fully restored and verified: 12:15:00  (3 hours 15 minutes — within the 4-hour RTO)',
          '--- RTO of 4 hours: MET (3h15m actual) ---',
          '--- RPO of 1 hour: MISSED (2.5 hours of data loss window, target was 1 hour) ---',
          'flag{rpo_target_missed_2_5_hours_of_data_at_risk}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'secplus-pii-dlp-scan',
    title: 'Security+: PII Exposure Data Loss Prevention Scan',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'A shared file server may contain personally identifiable information (PII) stored in violation of ' +
      'data classification policy. Scan the exported file listing for social security number and credit ' +
      'card number patterns — exactly the pattern-matching approach real DLP (Data Loss Prevention) tools ' +
      'use to flag policy violations.',
    objectives: [
      { text: 'Review the exported file content sample', why: 'DLP scanning in practice is pattern-based (regex-style matching for SSN/credit-card formats) run across file shares on a schedule — this simulates exactly that scan output.' },
      { text: 'Search for SSN-pattern (XXX-XX-XXXX) and credit-card-pattern matches with grep', why: 'Recognizing these exact formats is the same technique both real DLP tooling and manual compliance reviews use to flag unencrypted PII sitting in the wrong location.' },
      { text: 'Capture the flag identifying the file and PII type found', why: 'Unencrypted PII on a general file share (rather than an access-controlled, encrypted system) is a direct violation of virtually every data protection framework (GDPR, PCI DSS, CCPA) and typically requires immediate remediation and sometimes breach notification review.' },
    ],
    hints: [
      'cat ~/fileshare-export-sample.txt',
      `grep -E "[0-9]{3}-[0-9]{2}-[0-9]{4}" ~/fileshare-export-sample.txt`,
      'The matching line names the file where this PII was found sitting unencrypted.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'fileshare-export-sample.txt': file(
        [
          'File: quarterly-summary.xlsx — no PII pattern detected',
          'File: employee_backup_2019.csv — CONTAINS: 245-11-8823 (SSN pattern match)',
          'File: meeting-notes.docx — no PII pattern detected',
          '--- employee_backup_2019.csv stored unencrypted on a general-access share, in violation of data classification policy ---',
          'flag{unencrypted_ssn_found_in_employee_backup_csv}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'secplus-cvss-triage',
    title: 'Security+: Vulnerability Scan Triage & CVSS Prioritization',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'A vulnerability scan returned five findings. With limited remediation time this sprint, determine ' +
      'which finding must be patched FIRST based on CVSS score, exploitability, and asset criticality — the ' +
      'exact triage process real vulnerability management programs run every cycle.',
    objectives: [
      { text: 'Review the vulnerability scan report', why: 'A raw scan report lists everything found with no prioritization — turning that list into an action plan is the actual job, not just running the scanner.' },
      { text: 'Compare CVSS scores, known-exploited status, and asset criticality across all five findings', why: 'CVSS score alone is not enough — a 9.8 CVSS finding on an isolated test server ranks below a 7.5 finding on a public-facing production system with a known exploit already circulating in the wild.' },
      { text: 'Capture the flag identifying the correct top-priority finding', why: 'This exact multi-factor triage (severity + exploitability + exposure + asset value) is what separates an effective vulnerability management program from one that just patches whatever has the highest number.' },
    ],
    hints: [
      'cat ~/vuln-scan-report.txt',
      'Look for the one finding that combines a HIGH CVSS score, a publicly known exploit, AND internet-facing exposure on a production asset.',
      'The other four findings each fail at least one of those three criteria.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'vuln-scan-report.txt': file(
        [
          'Finding 1: CVSS 9.8 | Internal test server | No known public exploit',
          'Finding 2: CVSS 6.4 | Production DB (internal only) | Known exploit exists',
          'Finding 3: CVSS 7.5 | Internet-facing production web server | Known public exploit actively used in the wild',
          'Finding 4: CVSS 8.9 | Decommissioned staging box scheduled for removal next week | No known exploit',
          'Finding 5: CVSS 5.0 | Internal-only print server | No known exploit',
          '--- Finding 3 is the correct top priority: internet-facing, production, actively-exploited-in-the-wild ---',
          'flag{finding_3_prioritized_internet_facing_actively_exploited}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'secplus-orphaned-account-audit',
    title: 'Security+: Orphaned Account Access Review',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'Quarterly access reviews are a standard IAM control. Cross-reference the active directory user export ' +
      'against the HR termination list to find an account that should have been disabled but wasn\'t — a ' +
      'consistently common real-world finding in access certification audits.',
    objectives: [
      { text: 'Review the active accounts export and the HR termination list', why: 'Access reviews are fundamentally a cross-referencing exercise between two systems that don\'t automatically stay in sync — IT provisioning and HR offboarding.' },
      { text: 'Identify the account that appears active despite its owner being terminated', why: 'An orphaned account with valid, unrevoked credentials is a real and serious risk — it can be used by the former employee, or its credentials can be compromised with nobody actively monitoring that identity.' },
      { text: 'Capture the flag identifying the orphaned account and how long it remained active post-termination', why: 'The GAP in days between termination and account disablement is exactly the metric access review audits report on — it quantifies how long the organization was exposed, not just whether the gap existed at all.' },
    ],
    hints: [
      'cat ~/active-accounts-export.txt',
      'cat ~/hr-termination-list.txt',
      'Cross-reference both lists by username to find the mismatch.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'active-accounts-export.txt': file(
        'jsmith    Status=Active   LastLogin=2026-07-10\nkjones    Status=Active   LastLogin=2026-07-13\nmwilson   Status=Active   LastLogin=2026-06-28\nadavis    Status=Disabled LastLogin=2026-05-01\n',
      ),
      'hr-termination-list.txt': file(
        'mwilson   TerminationDate=2026-06-01   Reason=Voluntary resignation\n' +
          '--- mwilson\'s account is still Active and was used to log in on 2026-06-28, 27 days AFTER termination ---\n' +
          'flag{orphaned_account_mwilson_active_27_days_post_termination}\n',
      ),
    }),
    network: [],
  },
];
