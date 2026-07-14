import type { SiemLabScenario } from './siemTypes';

/** OSINT/recon tool labs — Shodan, Sherlock, Maltego, EyeWitness, theHarvester. Same generic
 *  branded-console pattern as the SIEM labs (query bar → filtered results → flag on match), just
 *  aimed at reconnaissance tradecraft instead of blue-team log triage. */
export const OSINT_LABS: SiemLabScenario[] = [
  // ───────────────────────── Shodan ─────────────────────────
  {
    id: 'osint-shodan-exposed-ics-hmi',
    title: 'Shodan: Hunting Exposed Industrial Control Panels',
    difficulty: 'Medium',
    tool: 'shodan',
    datasetLabel: 'shodan.io — 6 matching hosts',
    briefing:
      'Shodan indexes banners from every internet-facing device it can reach, and industrial control systems — ' +
      'water treatment HMIs, building automation panels, PLCs — turn up in it constantly, a pattern security ' +
      'researchers (Project SHINE\'s 2012-2014 census of exposed ICS being the best-known example) have ' +
      'documented for over a decade. This recreates that exact workflow: sweeping Shodan for Modbus/TCP devices ' +
      'and finding one with full read/write access and no authentication.',
    objectives: [
      { text: 'Search Shodan for devices speaking Modbus/TCP on port 502', why: 'Port 502 is the default for Modbus, the most common industrial control protocol — it\'s one of the first filters any ICS-focused Shodan sweep starts with.' },
      { text: 'Narrow the results to hosts identifying as a Niagara supervisory HMI', why: 'A banner alone doesn\'t tell you the exposure level — narrowing to a specific product is how you go from "here are some PLCs" to "here is a specific vulnerable one."' },
      { text: 'Capture the flag on the host confirmed to have no authentication at all', why: 'The gap between "port is open" and "port is open with zero access control" is the entire finding — that\'s what actually turns a Shodan hit into an incident.' },
    ],
    hints: ['port:502', 'Niagara', 'no authentication'],
    totalFlags: 1,
    entries: [
      { timestamp: '2024-01-14', eventType: 'TCP/22', line: 'IP 41.203.18.7 (Lagos, NG) — OpenSSH 7.4 banner, standard SSH service, no anomalies' },
      { timestamp: '2024-01-09', eventType: 'TCP/443', line: 'IP 88.212.4.19 (Berlin, DE) — nginx 1.18.0, generic corporate landing page' },
      { timestamp: '2024-02-02', eventType: 'TCP/502', line: 'IP 102.67.140.22 (Johannesburg, ZA) — port:502 Modbus/TCP open, device identifies as Schneider Electric Modicon M340 PLC, read-only register access' },
      { timestamp: '2024-02-02', eventType: 'TCP/502', line: 'IP 41.190.88.51 (Nairobi, KE) — port:502 Modbus/TCP open, banner: Niagara AX Framework v3.8 supervisory HMI, authentication required on write' },
      {
        timestamp: '2024-02-05',
        eventType: 'TCP/502',
        line:
          'IP 154.72.3.190 (Accra, GH) — port:502 Modbus/TCP open, Niagara AX Framework supervisory HMI, read/write ' +
          'register access confirmed with no authentication challenge presented at any point in the session. This is ' +
          'exactly the pattern OSINT researchers cataloguing Shodan\'s ICS results have repeatedly documented — an ' +
          'internet-exposed, authentication-free industrial panel with full write access to live control registers. ' +
          'flag{shodan_modbus_niagara_hmi_no_auth_accra}',
      },
      { timestamp: '2024-01-30', eventType: 'TCP/80', line: 'IP 197.211.52.3 (Kampala, UG) — Apache 2.4.41, default install page, unrelated to ICS' },
    ],
  },
  {
    id: 'osint-shodan-mongodb-ransom-wave',
    title: 'Shodan: The 2017 MongoDB Ransom Wave',
    difficulty: 'Medium',
    tool: 'shodan',
    datasetLabel: 'shodan.io — 5 matching hosts',
    briefing:
      'In January 2017, attackers used exactly this workflow — Shodan queries for unauthenticated MongoDB ' +
      'instances bound to 0.0.0.0 — to mass-wipe and ransom an estimated 45,000+ exposed databases in under a ' +
      'month, leaving a ransom-note document behind in place of the stolen data. No exploit was involved; the ' +
      'databases simply had no authentication enabled by default and were reachable from the open internet.',
    objectives: [
      { text: 'Search Shodan for hosts running MongoDB', why: 'product:"MongoDB" is the first move in reconstructing exactly what attackers searched for during the real 2017 wave.' },
      { text: 'Narrow to the instances confirmed unauthenticated', why: 'A MongoDB banner alone means nothing — bindIP 0.0.0.0 plus no auth challenge is the specific combination that made this wave possible at scale.' },
      { text: 'Capture the flag on the database already showing a ransom note', why: 'This is the exact artifact the 2017 attackers left behind — a single-collection database containing nothing but a payment demand, in place of the wiped original data.' },
    ],
    hints: ['product:"MongoDB"', 'unauthenticated', 'READ_ME_TO_RECOVER'],
    totalFlags: 1,
    entries: [
      { timestamp: '2017-01-03', eventType: 'TCP/27017', line: 'IP 45.32.98.4 (Amsterdam, NL) — product:"MongoDB" version 3.2.1, bindIP 127.0.0.1, requires authentication, not internet-reachable' },
      { timestamp: '2017-01-04', eventType: 'TCP/27017', line: 'IP 185.61.148.22 (Singapore, SG) — product:"MongoDB" version 2.6.12, bindIP 0.0.0.0, unauthenticated access confirmed, 4 databases visible: users, orders, sessions, analytics' },
      {
        timestamp: '2017-01-04',
        eventType: 'TCP/27017',
        line:
          'IP 5.101.140.7 (Kyiv, UA) — product:"MongoDB" version 3.0.8, bindIP 0.0.0.0, unauthenticated access ' +
          'confirmed, single collection present named "WARNING" containing one document: {"_id": ' +
          '"READ_ME_TO_RECOVER_YOUR_DATA", "note": "All your data has been backed up. You must pay 0.2 BTC to ' +
          'recover it."} — this is the real ransom-note pattern attackers left behind during the January 2017 ' +
          'mass-MongoDB-wipe wave, discovered through exactly this kind of routine Shodan sweep. ' +
          'flag{shodan_mongodb_ransom_wave_read_me_to_recover}',
      },
      { timestamp: '2017-01-05', eventType: 'TCP/27017', line: 'IP 91.200.14.88 (Moscow, RU) — product:"MongoDB" version 3.4.0, bindIP 0.0.0.0, unauthenticated access confirmed, 12 databases visible, no ransom note collection detected yet' },
      { timestamp: '2017-01-02', eventType: 'TCP/22', line: 'IP 45.32.98.4 (Amsterdam, NL) — unrelated SSH banner, OpenSSH 6.7' },
    ],
  },

  // ───────────────────────── Sherlock ─────────────────────────
  {
    id: 'osint-sherlock-deanonymize-handle',
    title: 'Sherlock: De-anonymizing a Forum Threat Actor',
    difficulty: 'Medium',
    tool: 'sherlock',
    datasetLabel: 'sherlock — 6 sites checked for "gh0st_ferryman"',
    briefing:
      'A near-universal step in real threat-actor attribution work: take a handle seen on a criminal forum or ' +
      'marketplace and run it across hundreds of other platforms, looking for the one place the same person got ' +
      'sloppy and reused it on something personal and non-anonymous. This is exactly how researchers and law ' +
      'enforcement have unmasked real ransomware-affiliate and carding-forum handles before — not through a ' +
      'technical exploit, just patient cross-platform correlation.',
    objectives: [
      { text: 'Run Sherlock against the handle "gh0st_ferryman"', why: 'A full sweep across every supported site is the baseline of this technique — most hits will be irrelevant, and that\'s expected.' },
      { text: 'Confirm the criminal-marketplace hit ties this handle to real illicit activity', why: 'Establishing that the handle is genuinely the threat actor\'s (not a coincidental namesake) is a necessary step before spending time correlating further.' },
      { text: 'Find the non-anonymous hobby-platform account where a real name leaked, and capture the flag', why: 'This is the actual payoff of the technique — a platform with zero connection to the criminal activity, used casually enough that operational security lapsed.' },
    ],
    hints: ['gh0st_ferryman', 'BreachForums', 'real name field populated'],
    totalFlags: 1,
    entries: [
      { line: '[+] BreachForums: https://breachforums.example/user/gh0st_ferryman (account created 2021, 340 posts, selling database dumps)' },
      { line: '[-] Instagram: Not Found' },
      { line: '[+] Twitter: https://twitter.example/gh0st_ferryman (bio: "into infosec, chess, and vintage synths")' },
      { line: '[-] Facebook: Not Found' },
      {
        line:
          '[+] Chess.com: https://chess.example/member/gh0st_ferryman (real name field populated: "D. Okafor", ' +
          'location: "Lagos, NG", joined 2018 — same handle reused on a completely non-anonymous hobby platform, ' +
          'the exact kind of cross-platform username reuse that has unmasked real threat actors before. ' +
          'flag{sherlock_handle_reuse_chess_platform_deanon})',
      },
      { line: '[-] Reddit: Not Found' },
    ],
  },
  {
    id: 'osint-sherlock-redteam-pretext',
    title: 'Sherlock: Building a Social-Engineering Pretext from an Employee Handle',
    difficulty: 'Easy',
    tool: 'sherlock',
    datasetLabel: 'sherlock — 5 sites checked for "kpatel_eng"',
    briefing:
      'Before a phishing or vishing engagement, red teams often run a target employee\'s known username through ' +
      'Sherlock looking for personal accounts that leak pretext material — employer confirmation, interests, or ' +
      'upcoming travel. This low-tech OSINT step precedes most successful social-engineering engagements, and ' +
      'costs nothing but time.',
    objectives: [
      { text: 'Run Sherlock against the employee handle "kpatel_eng"', why: 'The same broad sweep as any Sherlock run — most results will be dead ends, which is normal.' },
      { text: 'Confirm the LinkedIn hit ties the handle to the real target organization', why: 'Before trusting anything else this handle turns up, you need to know it\'s actually the right person at the right company.' },
      { text: 'Capture the flag on the account leaking a usable pretext detail', why: 'A public fitness-tracker feed showing someone is traveling this week is a textbook opening for a vishing call impersonating IT support "covering while they\'re out."' },
    ],
    hints: ['kpatel_eng', 'LinkedIn', 'Strava'],
    totalFlags: 1,
    entries: [
      { line: '[-] MySpace: Not Found' },
      { line: '[-] Tumblr: Not Found' },
      { line: '[+] LinkedIn: https://linkedin.example/in/kpatel_eng (Senior DevOps Engineer at TargetCorp, 6 years)' },
      {
        line:
          '[+] Strava: https://strava.example/athletes/kpatel_eng (public activity feed, most recent run logged ' +
          'from "Lisbon, Portugal" — 3 posts this week, this account is travelling out of the country right now, ' +
          'a real technique red teams use OSINT exactly like this to build a pretext around. ' +
          'flag{sherlock_strava_travel_pretext_kpatel})',
      },
      { line: '[-] Pinterest: Not Found' },
    ],
  },

  // ───────────────────────── Maltego ─────────────────────────
  {
    id: 'osint-maltego-phishing-infra-cluster',
    title: "Maltego: Clustering a Phishing Kit's Domain Infrastructure",
    difficulty: 'Hard',
    tool: 'maltego',
    datasetLabel: 'Maltego graph — 6 transform results on secure-0ffice365-login.com',
    briefing:
      'A bread-and-butter threat-intel workflow: pivot from one confirmed phishing domain through its WHOIS ' +
      'registrant details, then run a "domains sharing this registrant" transform to surface sibling domains the ' +
      'same actor controls — often including ones nobody has reported yet. Maltego\'s whole design exists to make ' +
      'exactly this kind of graph pivot fast.',
    objectives: [
      { text: 'Run the "to WHOIS Details" transform on the seed phishing domain', why: 'The registrant email is the pivot point — everything else in this investigation branches from it.' },
      { text: 'Run the "to Domains sharing this Registrant Email" transform to pivot outward', why: 'This is the actual clustering step — one registrant email frequently ties together an entire phishing campaign\'s infrastructure.' },
      { text: 'Find the sibling domain that is still live and unreported, and capture the flag', why: 'The other two domains were already caught — the value of this graph pivot is finding the one that slipped through.' },
    ],
    hints: ['to WHOIS Details', 'to Domains sharing this Registrant Email', 'still live and unreported'],
    totalFlags: 1,
    entries: [
      { eventType: 'WHOIS', line: 'to WHOIS Details(secure-0ffice365-login.com) → registrant_email: "k.morozov1988@protonmail.example", registrar: NameSilo, created: 2024-03-02' },
      { eventType: 'PIVOT', line: 'to Domains sharing this Registrant Email(k.morozov1988@protonmail.example) → secure-0ffice365-login.com, portal-0utlook-verify.com, docusign-secure-view.net, adp-payroll-portal.com' },
      { eventType: 'STATUS', line: 'to Live Host Check(portal-0utlook-verify.com) → HTTP 200, phishing kit already reported to registrar, domain suspended 2024-03-19' },
      { eventType: 'STATUS', line: 'to Live Host Check(docusign-secure-view.net) → HTTP 200, phishing kit already reported and taken down 2024-03-21' },
      {
        eventType: 'STATUS',
        line:
          'to Live Host Check(adp-payroll-portal.com) → HTTP 200, identical phishing kit fingerprint to the seed ' +
          'domain, still live and unreported as of this session — the exact kind of sibling-domain discovery ' +
          'Maltego\'s registrant-pivot transform is built for. flag{maltego_registrant_pivot_adp_payroll_portal_still_live}',
      },
      { eventType: 'PIVOT', line: 'to MX Records(secure-0ffice365-login.com) → mx1.protonmail.example (unrelated to the real target org, confirms this is not a legitimate Microsoft-owned domain)' },
    ],
  },
  {
    id: 'osint-maltego-email-convention',
    title: "Maltego: Mapping a Target Company's Email Naming Convention",
    difficulty: 'Medium',
    tool: 'maltego',
    datasetLabel: 'Maltego graph — 5 transform results on meridianfin.example',
    briefing:
      'Before a phishing engagement, red teams frequently pivot from a company\'s domain through an "emails ' +
      'found in search engines" transform, gathering just a handful of already-public addresses — enough to spot ' +
      'the organization\'s naming convention (first.last@, or f.last@) and construct a plausible-looking address ' +
      'for anyone else on staff, without ever touching a breach dataset.',
    objectives: [
      { text: 'Run the "to Domain" transform on the target company name', why: 'Confirming the real corporate domain first (not a lookalike) keeps every downstream pivot grounded in the correct entity.' },
      { text: 'Run the "to Email addresses found in search engines" transform on that domain', why: 'Public conference bios, GitHub commits, and press releases routinely leak a handful of real employee addresses for free.' },
      { text: 'Determine the naming convention from the results and capture the flag', why: 'Two independently-sourced addresses following the same pattern is enough to infer the convention for the entire company.' },
    ],
    hints: ['to Domain(Meridian Financial Group)', 'to Email addresses found in search engines', 'naming convention analysis'],
    totalFlags: 1,
    entries: [
      { eventType: 'PIVOT', line: 'to Domain(Meridian Financial Group) → meridianfin.example (primary corporate domain, confirmed via SSL certificate org field)' },
      { eventType: 'PIVOT', line: 'to Email addresses found in search engines(meridianfin.example) → press@meridianfin.example (press contact, from an old PR release)' },
      { eventType: 'PIVOT', line: 'to Email addresses found in search engines(meridianfin.example) → j.ramirez@meridianfin.example (from a conference speaker bio: "Jorge Ramirez, VP Engineering")' },
      { eventType: 'PIVOT', line: 'to Email addresses found in search engines(meridianfin.example) → s.chen@meridianfin.example (from a GitHub commit: "Sarah Chen, Platform Team")' },
      {
        eventType: 'ANALYSIS',
        line:
          'naming convention analysis: two independently-sourced addresses (j.ramirez@, s.chen@) both follow ' +
          'first-initial.lastname@meridianfin.example — with a public org chart or LinkedIn employee list, this ' +
          'convention alone is enough to construct a plausible address for anyone else on staff, no breach dataset ' +
          'required. flag{maltego_email_convention_first_initial_lastname_meridianfin}',
      },
    ],
  },

  // ───────────────────────── EyeWitness ─────────────────────────
  {
    id: 'osint-eyewitness-admin-panel-triage',
    title: 'EyeWitness: Finding the One Exposed Admin Panel in 200 Hosts',
    difficulty: 'Medium',
    tool: 'eyewitness',
    datasetLabel: 'EyeWitness report — 6 of 200+ hosts shown',
    briefing:
      'After a subnet-wide scan returns 200+ live web services, EyeWitness screenshots and auto-categorizes every ' +
      'one by page title and login-form signature, turning an unmanageable firehose of URLs into a short, ' +
      'triageable report — exactly the step real pentesters rely on instead of manually opening hundreds of tabs.',
    objectives: [
      { text: 'Filter the report for anything categorized as a login panel', why: 'Login/admin panels are disproportionately where real findings live compared to default pages and redirects.' },
      { text: 'Rule out the panels already running current, patched software', why: 'Most exposed login panels are boring and up to date — the goal is finding the exception, not flagging every one.' },
      { text: 'Capture the flag on the panel running known-vulnerable, outdated software', why: 'This is the actual triage outcome EyeWitness exists to produce: one real finding, isolated from 200 screenshots of noise.' },
    ],
    hints: ['Login Panel', 'current, patched', 'CVE-2019-1003000'],
    totalFlags: 1,
    entries: [
      { eventType: 'Default Page', line: 'http://10.40.12.4 — "Apache2 Ubuntu Default Page", category: default install, no custom content' },
      { eventType: 'Login Panel', line: 'http://10.40.12.19 — "Grafana Login", category: login panel, version 10.2.3 (current, patched)' },
      {
        eventType: 'Login Panel',
        line:
          'http://10.40.12.55 — "Jenkins — Sign in", category: login panel, version 2.60.1, released 2019 — 7 ' +
          'major versions behind current, multiple public CVEs including unauthenticated RCE (CVE-2019-1003000 ' +
          'class) — this is exactly the kind of host EyeWitness triage is built to surface, one outdated panel ' +
          'hiding inside 200 screenshots of default pages and redirects. flag{eyewitness_jenkins_2_60_1_outdated_rce_panel}',
      },
      { eventType: 'Redirect', line: 'http://10.40.12.61 — redirects to https://sso.corp.internal, category: SSO redirect, out of scope for direct access' },
      { eventType: 'Login Panel', line: 'http://10.40.12.77 — "pfSense - Login", category: login panel, version 2.7.0 (current, patched)' },
      { eventType: '404', line: 'http://10.40.12.90 — 404 Not Found, category: no content' },
    ],
  },

  // ───────────────────────── theHarvester ─────────────────────────
  {
    id: 'osint-theharvester-attack-surface',
    title: 'theHarvester: Building an Attack Surface Before Touching the Target',
    difficulty: 'Easy',
    tool: 'theharvester',
    datasetLabel: 'theHarvester — northgate-retail.example',
    briefing:
      'theHarvester passively pulls emails, subdomains, and hosts for a domain from search engines and ' +
      'certificate transparency logs — zero packets ever sent to the target itself, which is exactly why it\'s a ' +
      'standard first step of almost every engagement\'s recon phase, well before any scanning begins.',
    objectives: [
      { text: 'Run theHarvester against the target domain and watch which sources it queries', why: 'crt.sh (certificate transparency logs) in particular surfaces subdomains that were never meant to stay public — every TLS certificate ever issued for a domain is permanently logged.' },
      { text: 'Review the host/subdomain enumeration results', why: 'This is the actual attack-surface map — every one of these hostnames is a potential entry point worth scoping into the engagement.' },
      { text: 'Capture the flag on the stale subdomain the certificate log surfaced', why: 'A forgotten pre-production environment that still resolves is one of the most common real findings from passive recon alone.' },
    ],
    hints: ['crt.sh', 'Hosts found', 'staging-2019'],
    totalFlags: 1,
    entries: [
      { line: '[*] Target: northgate-retail.example' },
      { line: '[*] Searching Google, Bing, crt.sh...' },
      { line: '[+] Emails found: 3' },
      { line: '    hr@northgate-retail.example' },
      { line: '    support@northgate-retail.example' },
      { line: '    d.owusu@northgate-retail.example (from a job-posting PDF)' },
      { line: '[+] Hosts found: 5' },
      { line: '    www.northgate-retail.example (203.0.113.10)' },
      { line: '    shop.northgate-retail.example (203.0.113.11)' },
      { line: '    mail.northgate-retail.example (203.0.113.12)' },
      { line: '    cdn.northgate-retail.example (203.0.113.13)' },
      {
        line:
          '    staging-2019.northgate-retail.example (203.0.113.44) — certificate transparency log entry from ' +
          '2019, still resolves, almost certainly a forgotten pre-production environment never decommissioned, ' +
          'exactly the kind of stale subdomain theHarvester\'s crt.sh source is built to surface. ' +
          'flag{theharvester_forgotten_staging_subdomain_2019}',
      },
    ],
  },
];
