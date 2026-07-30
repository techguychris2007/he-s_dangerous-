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
    id: 'osint-shodan-exposed-rdp-ransomware-entry',
    title: 'Shodan: Finding Exposed RDP Before a Ransomware Affiliate Does',
    difficulty: 'Easy',
    tool: 'shodan',
    datasetLabel: 'shodan.io — 7 matching hosts',
    briefing:
      'Exposed Remote Desktop Protocol (port 3389) is consistently reported as the single most common ' +
      'initial-access vector in ransomware incidents — access brokers scan the internet with Shodan-style ' +
      'tools specifically to find open RDP, then sell that access on dark web markets to ransomware ' +
      'affiliates who never have to find the exposure themselves. This is the defensive mirror of that ' +
      'exact workflow: finding your own exposed RDP hosts before someone sells access to them.',
    objectives: [
      { text: 'Search Shodan for hosts with port 3389 open', why: 'Port 3389 is RDP\'s default — this is the very first filter an access broker runs, and the very first thing a defensive sweep should check for on its own IP ranges.' },
      { text: 'Narrow to hosts that allow NLA-less (Network Level Authentication disabled) connections', why: 'RDP with NLA disabled lets an attacker reach the full login screen — and any vulnerabilities behind it — before authenticating at all, which is what actually makes an exposed RDP host valuable to sell.' },
      { text: 'Capture the flag on the one host confirmed to have both NLA disabled and a default administrator account still enabled', why: 'This is the exact combination access brokers look for: reachable, unauthenticated up to the login screen, and a credential worth guessing — the full chain from "port open" to "sellable access."' },
    ],
    hints: ['port:3389', 'NLA disabled', 'Administrator'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-03-02', eventType: 'TCP/3389', line: 'IP 45.130.22.9 (Amsterdam, NL) — port:3389 RDP open, NLA enforced, connection requires authentication before login screen' },
      { timestamp: '2026-03-03', eventType: 'TCP/22', line: 'IP 88.212.4.19 (Berlin, DE) — OpenSSH 8.4, unrelated to RDP exposure' },
      { timestamp: '2026-03-05', eventType: 'TCP/3389', line: 'IP 154.72.9.201 (Accra, GH) — port:3389 RDP open, NLA disabled, full login screen reachable pre-auth, "Administrator" account visible and enabled' },
      { timestamp: '2026-03-05', eventType: 'TCP/3389', line: 'IP 197.211.60.4 (Kampala, UG) — port:3389 RDP open, NLA enforced' },
      { timestamp: '2026-03-06', eventType: 'TCP/443', line: 'IP 41.203.18.7 (Lagos, NG) — nginx 1.22.0, unrelated web host' },
      {
        timestamp: '2026-03-07',
        eventType: 'TCP/3389',
        line:
          'IP 154.72.9.201 (Accra, GH) — CONFIRMED: NLA disabled + default "Administrator" account enabled = exactly ' +
          'the combination initial-access brokers scan for and sell to ransomware affiliates. ' +
          'flag{shodan_exposed_rdp_nla_disabled_default_admin}',
      },
      { timestamp: '2026-03-08', eventType: 'TCP/3389', line: 'IP 102.67.140.22 (Johannesburg, ZA) — port:3389 RDP open, NLA enforced, no default accounts visible' },
    ],
  },
  {
    id: 'osint-shodan-botnet-c2-favicon-hash',
    title: 'Shodan: Tracking a Botnet\'s C2 Panels by Favicon Hash',
    difficulty: 'Hard',
    tool: 'shodan',
    datasetLabel: 'shodan.io — 6 matching hosts',
    briefing:
      'A distinctive login-panel favicon hashes to the same value on every server running that same panel ' +
      'software, anywhere on the internet — and Shodan indexes favicon hashes as a real, searchable field ' +
      '(http.favicon.hash:). Threat intel researchers have used exactly this technique for years to map an ' +
      'entire botnet or malware family\'s command-and-control infrastructure from a single known sample: ' +
      'hash its panel\'s favicon once, then search Shodan for every other server serving the identical icon.',
    objectives: [
      { text: 'Search Shodan for the known C2 panel favicon hash: http.favicon.hash:-1849482430', why: 'This is the entire technique in one query — a single favicon hash search surfaces every internet-facing server running the same distinctive control-panel software, all at once.' },
      { text: 'Review the resulting hosts and note which ones are freshly registered (within the last 30 days)', why: 'A newly-registered host serving the exact same C2 panel is far more likely to be live operator infrastructure than an old host that might just be a honeypot or a researcher\'s own copy.' },
      { text: 'Capture the flag on the host confirmed to be actively beaconing traffic', why: 'The favicon hash narrows a global search to a handful of candidates — confirming actual beacon traffic is what turns "matches the fingerprint" into "this is a live C2 server."' },
    ],
    hints: ['http.favicon.hash:-1849482430', 'registered', 'beaconing'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-01-11', eventType: 'TCP/443', line: 'IP 185.220.101.47 (Bucharest, RO) — http.favicon.hash:-1849482430 match, domain registered 2019, no recent traffic observed — likely an abandoned/decoy host' },
      { timestamp: '2026-01-14', eventType: 'TCP/80', line: 'IP 91.242.72.108 (Kyiv, UA) — http.favicon.hash:-1849482430 match, domain registered 6 days ago' },
      { timestamp: '2026-01-14', eventType: 'TCP/443', line: 'IP 194.36.191.53 (Sofia, BG) — unrelated favicon hash, standard corporate site' },
      {
        timestamp: '2026-01-15',
        eventType: 'TCP/80',
        line:
          'IP 91.242.72.108 (Kyiv, UA) — CONFIRMED: favicon hash match on a domain registered only 6 days ago, actively ' +
          'beaconing outbound traffic on a 60-second interval consistent with live C2 check-ins. ' +
          'flag{shodan_favicon_hash_c2_infrastructure_tracked}',
      },
      { timestamp: '2026-01-16', eventType: 'TCP/443', line: 'IP 45.130.22.9 (Amsterdam, NL) — http.favicon.hash:-1849482430 match, domain registered 2021, sinkholed by a known threat intel vendor' },
      { timestamp: '2026-01-17', eventType: 'TCP/22', line: 'IP 88.212.4.19 (Berlin, DE) — unrelated host, standard SSH banner' },
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
    id: 'osint-sherlock-insider-threat-background-check',
    title: 'Sherlock: Verifying a Job Applicant\'s Claimed Identity',
    difficulty: 'Easy',
    tool: 'sherlock',
    datasetLabel: 'sherlock — 8 platforms checked for handle "kdanquah_dev"',
    briefing:
      'A candidate for a privileged systems-administrator role listed a GitHub handle on their résumé as ' +
      'proof of their claimed five years of experience — but pre-employment identity verification is a ' +
      'real, standard part of insider-threat prevention for sensitive roles. Running the same handle ' +
      'across other platforms with Sherlock is exactly how a security team checks whether a candidate\'s ' +
      'claimed history actually holds together before handing them privileged access.',
    objectives: [
      { text: 'Run Sherlock against the handle "kdanquah_dev" across major platforms', why: 'A single username searched everywhere at once is far faster than manually checking each platform one at a time — and it surfaces accounts the candidate may not have expected to be found together.' },
      { text: 'Compare the account creation dates and activity history across platforms for consistency', why: 'A claimed five-year history should show five years of activity somewhere — accounts that all appeared within the same few weeks are a real, common red flag for a fabricated or purchased identity history.' },
      { text: 'Capture the flag on the finding that resolves whether the claimed history is genuine', why: 'This is the actual point of the check: not just "does this handle exist," but "does the evidence support what the candidate claimed."' },
    ],
    hints: ['kdanquah_dev', 'created', 'inconsistent'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-04-01', eventType: 'GitHub', line: 'kdanquah_dev — GitHub account created 2021-06-14, 340 commits across 12 public repos, consistent with 5 years of claimed experience' },
      { timestamp: '2026-04-01', eventType: 'LinkedIn', line: 'kdanquah_dev — LinkedIn profile matches résumé job history, employment dates line up with GitHub activity' },
      { timestamp: '2026-04-01', eventType: 'Twitter/X', line: 'kdanquah_dev — account created 2020-11-02, tech-focused posting history, consistent timeline' },
      {
        timestamp: '2026-04-01',
        eventType: 'StackOverflow',
        line:
          'kdanquah_dev — CONFIRMED: account created 2026-01-08, only 3 weeks before this candidate\'s résumé was ' +
          'submitted, with copy-pasted answers matching questions from a well-known "senior sysadmin interview prep" ' +
          'course — inconsistent with the claimed 5 years of hands-on experience the résumé describes. ' +
          'flag{sherlock_fabricated_experience_history_flagged}',
      },
      { timestamp: '2026-04-01', eventType: 'Reddit', line: 'kdanquah_dev — no matching account found on this platform' },
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
    id: 'osint-sherlock-password-spray-target-list',
    title: 'Sherlock: Building a Password-Spray Target List from Reused Handles',
    difficulty: 'Medium',
    tool: 'sherlock',
    datasetLabel: 'sherlock — 6 handles checked, cross-referenced against a breach corpus',
    briefing:
      'Password spraying — trying one common password against many usernames, staying under any single ' +
      'account\'s lockout threshold — only works if you have real usernames to spray against first. A ' +
      'real, common technique: run each employee\'s known handle through Sherlock, then cross-reference ' +
      'which platforms they\'re active on against a corpus of previously breached credentials, since ' +
      'people who reuse a handle across platforms very often reuse a password too.',
    objectives: [
      { text: 'Run Sherlock against each of the 6 known employee handles', why: 'Confirms which platforms each employee actually has live accounts on, before assuming any of them are useful targets.' },
      { text: 'Cross-reference the confirmed handles against known breach-corpus hits', why: 'A handle with a matching entry in a previous public breach dump is far more valuable than one without — it means there\'s a real, if outdated, password already associated with that identity to try variations of.' },
      { text: 'Capture the flag on the employee whose handle appears in a breach corpus AND is still active on the corporate SSO-linked platform', why: 'This is the exact combination that makes password spraying worth attempting against a specific account rather than guessing blindly — a real prior password to vary, on a platform that actually matters.' },
    ],
    hints: ['sherlock', 'breach corpus', 'SSO'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-05-02', eventType: 'Sherlock', line: 'jomari_t — active on 4 platforms, no breach corpus match found' },
      { timestamp: '2026-05-02', eventType: 'Sherlock', line: 'r.acheampong — active on 2 platforms, no breach corpus match found' },
      {
        timestamp: '2026-05-02',
        eventType: 'Sherlock',
        line:
          'sowusu_it — active on 5 platforms including the corporate SSO-linked Okta profile page, and appears in a ' +
          '2022 breach corpus with a password hash cracked to "Kumasi2019!" — a real prior password worth spraying ' +
          'targeted variations of against the current SSO login. flag{sherlock_breach_corpus_password_spray_target}',
      },
      { timestamp: '2026-05-02', eventType: 'Sherlock', line: 'lboateng — active on 3 platforms, breach corpus match found but on an unrelated personal forum account, not linked to SSO' },
      { timestamp: '2026-05-02', eventType: 'Sherlock', line: 'agyei.n — no accounts found on any checked platform' },
      { timestamp: '2026-05-02', eventType: 'Sherlock', line: 'tmensah_corp — active on 1 platform, no breach corpus match found' },
    ],
  },
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
    id: 'osint-maltego-ransomware-wallet-infra-link',
    title: 'Maltego: Linking a Ransomware Group\'s Wallet to Its Leak-Site Infrastructure',
    difficulty: 'Hard',
    tool: 'maltego',
    datasetLabel: 'maltego — 7-entity graph (wallets, domains, forum handles)',
    briefing:
      'Ransomware attribution investigations routinely combine on-chain analysis with infrastructure OSINT ' +
      '— exactly the kind of multi-entity link analysis Maltego is built for. A ransom payment\'s Bitcoin ' +
      'wallet address, a dark-web leak-site domain\'s registration footprint, and a forum handle used to ' +
      'negotiate with victims are three separate data types that, linked together, can point to the same ' +
      'operating group — the same approach real investigators used to help attribute several major 2020s ' +
      'ransomware operations.',
    objectives: [
      { text: 'Trace the ransom payment wallet address forward to its next hop', why: 'Ransomware operators rarely cash out directly from the receiving wallet — following the first hop is the standard first step in any on-chain tracing effort.' },
      { text: 'Cross-reference the destination wallet against known mixer/exchange clusters', why: 'A wallet clustering with a known non-compliant exchange or mixer is a real, publicly documented pattern investigators use to narrow down cash-out infrastructure.' },
      { text: 'Capture the flag on the forum handle linked to both the wallet cluster and the leak-site domain registration', why: 'This is the actual attribution moment — a financial link and an infrastructure link both pointing to the same handle is far stronger evidence than either one alone.' },
    ],
    hints: ['ransom payment', 'offshore exchange', 'writing-style fingerprint'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-02-01', eventType: 'Wallet', line: 'bc1qxy2...ransom — received 4.2 BTC ransom payment, forwarded entire balance to bc1qm3n...relay within 6 hours' },
      { timestamp: '2026-02-01', eventType: 'Wallet', line: 'bc1qm3n...relay — clusters with a known non-compliant offshore exchange flagged in prior investigations' },
      { timestamp: '2026-02-02', eventType: 'Domain', line: 'leaks-onion-mirror7[.]net — registered via a privacy-proxy registrar, hosting the group\'s victim leak site' },
      { timestamp: '2026-02-02', eventType: 'Forum', line: 'handle "night_broker" — negotiates ransom payments on a known cybercrime forum, wallet address in negotiation thread matches bc1qxy2...ransom' },
      {
        timestamp: '2026-02-03',
        eventType: 'Forum',
        line:
          'handle "night_broker" — CONFIRMED: same forum account also posted the registration renewal notice for ' +
          'leaks-onion-mirror7[.]net using an identical writing-style fingerprint, linking the financial trail and ' +
          'the infrastructure trail to the same individual. flag{maltego_wallet_leaksite_forum_handle_attribution}',
      },
      { timestamp: '2026-02-03', eventType: 'Wallet', line: 'bc1qk9p...decoy — unrelated wallet, red-herring cluster from an earlier, unrelated investigation' },
      { timestamp: '2026-02-04', eventType: 'Domain', line: 'unrelated-corp-site[.]com — registered by a legitimate business, appeared in initial search but not linked to any cluster' },
    ],
  },
  {
    id: 'osint-maltego-vendor-subdomain-supply-chain',
    title: 'Maltego: Mapping a Vendor\'s Subdomain Sprawl for a Supply-Chain Foothold',
    difficulty: 'Medium',
    tool: 'maltego',
    datasetLabel: 'maltego — 6-entity graph (vendor domains, subdomains, hosting)',
    briefing:
      'Direct attacks on a hardened primary target often fail — so real attackers (and red teams testing ' +
      'exactly this) instead map every third-party vendor a target company depends on, looking for the ' +
      'weakest link in. Maltego\'s domain-to-subdomain-to-hosting transforms make this kind of sprawl ' +
      'visible at a glance: one forgotten vendor subdomain on outdated infrastructure is often all it takes ' +
      'to get a foothold that eventually reaches the primary target through a trusted integration.',
    objectives: [
      { text: 'Enumerate the target company\'s known third-party vendor integrations', why: 'A company\'s security posture is only as strong as its weakest connected vendor — mapping the vendor list is the necessary first step before looking for the weak one.' },
      { text: 'Expand each vendor domain to its known subdomains', why: 'Vendors accumulate the exact same kind of forgotten, unmonitored subdomains their customers do — staging environments, old marketing microsites, decommissioned portals nobody remembered to remove.' },
      { text: 'Capture the flag on the vendor subdomain still running end-of-life software with a direct integration link back to the target', why: 'This is the actual finding that matters: not just "a vendor has an old subdomain," but one that both is genuinely vulnerable and has a real trust relationship reaching back into the primary target.' },
    ],
    hints: ['vendor', 'subdomain', 'end-of-life'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-06-01', eventType: 'Vendor', line: 'payroll-vendor.com — primary domain, modern infrastructure, no known integration with target beyond standard API' },
      { timestamp: '2026-06-01', eventType: 'Subdomain', line: 'api.payroll-vendor.com — current, actively maintained, TLS cert renewed 3 weeks ago' },
      { timestamp: '2026-06-02', eventType: 'Vendor', line: 'crm-integration-partner.com — primary domain, standard OAuth integration with target\'s customer database' },
      {
        timestamp: '2026-06-02',
        eventType: 'Subdomain',
        line:
          'legacy-staging.crm-integration-partner.com — CONFIRMED: still running a CRM platform version end-of-life ' +
          'since 2021, TLS cert expired 8 months ago, and still holds a valid OAuth client secret for the exact same ' +
          'production integration used to sync data into the primary target\'s customer database. ' +
          'flag{maltego_vendor_subdomain_supply_chain_foothold}',
      },
      { timestamp: '2026-06-03', eventType: 'Subdomain', line: 'marketing.crm-integration-partner.com — old campaign microsite, static content only, no integration access' },
      { timestamp: '2026-06-03', eventType: 'Vendor', line: 'analytics-saas.io — primary domain, read-only analytics integration, no write access to target systems' },
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
  // ───────────────────────── EyeWitness ─────────────────────────
  {
    id: 'osint-eyewitness-post-merger-legacy-portal',
    title: 'EyeWitness: Finding the Legacy Portal After a Merger',
    difficulty: 'Medium',
    tool: 'eyewitness',
    datasetLabel: 'eyewitness — 140 hosts screenshotted after network consolidation',
    briefing:
      'Sterling Group acquired a smaller competitor six months ago, and their two networks were merged with ' +
      'minimal cleanup — a very common, very real gap in post-acquisition security work. A full subnet scan ' +
      'of the newly-combined IP ranges, screenshotted in bulk with EyeWitness, is exactly how a security ' +
      'team (or an attacker who knows an acquisition just happened) finds what the acquired company brought ' +
      'in that nobody\'s looked at since the deal closed.',
    objectives: [
      { text: 'Review the screenshot grid from the post-merger subnet sweep', why: 'Scanning alone just gives you open ports and status codes — screenshots are what let a human instantly recognize "this looks like it\'s from a decade ago" in a way raw scan output never will.' },
      { text: 'Identify the host still displaying the acquired company\'s old branding', why: 'Old branding still showing is a strong signal the acquired company\'s own team stopped maintaining that host well before the deal even closed — a strong candidate for the most neglected system in the merged network.' },
      { text: 'Capture the flag on the host confirmed to still be running its original, never-updated login portal', why: 'This is the actual risk the screenshot triage was built to surface: not just an old-looking page, but a genuinely unpatched, unmonitored authentication portal now sitting inside the combined network\'s trust boundary.' },
    ],
    hints: ['old logo', 'login portal', 'last updated in 2016'],
    totalFlags: 1,
    entries: [
      { eventType: 'HTTP/200', line: '10.40.2.11 — Sterling Group current corporate portal, modern branding, TLS cert renewed last month' },
      { eventType: 'HTTP/200', line: '10.40.2.19 — Sterling Group HR self-service, current branding, standard SSO login' },
      { eventType: 'HTTP/200', line: '10.40.5.77 — screenshot shows the acquired company\'s old logo and a "circa 2016" visual design, unrelated to current Sterling Group branding' },
      { eventType: 'HTTP/200', line: '10.40.2.30 — Sterling Group internal wiki, current branding' },
      {
        eventType: 'HTTP/200',
        line:
          '10.40.5.77 — CONFIRMED: the old-branded host is running the acquired company\'s original admin login ' +
          'portal, software version last updated in 2016, with no SSO integration and no record of any security ' +
          'review since the merger closed six months ago. flag{eyewitness_postmerger_legacy_login_portal}',
      },
      { eventType: 'HTTP/403', line: '10.40.2.45 — Sterling Group VPN gateway, access forbidden without client cert, unrelated' },
    ],
  },
  // ───────────────────────── theHarvester ─────────────────────────
  {
    id: 'osint-theharvester-spearphishing-target-list',
    title: 'theHarvester: Harvesting Employee Emails for a Phishing Simulation',
    difficulty: 'Easy',
    tool: 'theharvester',
    datasetLabel: 'theharvester — sources: crt.sh, Bing, LinkedIn — target: fenwick-legal.example',
    briefing:
      'Fenwick Legal has approved an authorized phishing simulation to measure how many employees click a ' +
      'realistic lure — but building a real target list requires real employee emails first. This is the ' +
      'exact first step of any spear-phishing engagement (simulated or genuinely malicious): harvest every ' +
      'email address and name pattern search engines, LinkedIn, and public documents have indexed for the ' +
      'target domain, before writing a single lure.',
    objectives: [
      { text: 'Run theHarvester against fenwick-legal.example', why: 'A wide harvest across multiple sources at once surfaces far more real addresses than manually guessing a naming convention.' },
      { text: 'Identify the email naming convention the harvested addresses follow', why: 'Once the pattern is confirmed from real examples, it can be applied to the company\'s full staff directory to build addresses for people who never showed up in the harvest directly.' },
      { text: 'Capture the flag on the harvested address belonging to an executive assistant with calendar access to the managing partner', why: 'For a realistic phishing simulation (or a real attacker), the most valuable target is rarely the most senior person directly — it\'s whoever has trusted access to that person\'s schedule and inbox.' },
    ],
    hints: ['fenwick-legal.example', 'naming convention', 'executive assistant'],
    totalFlags: 1,
    entries: [
      { line: '[*] theHarvester 4.4.4 — target: fenwick-legal.example — sources: crt.sh, bing, linkedin' },
      { line: '[+] Emails found: 5' },
      { line: '    info@fenwick-legal.example' },
      { line: '    j.fenwick@fenwick-legal.example (managing partner, from LinkedIn profile)' },
      {
        line:
          '    r.addo@fenwick-legal.example (LinkedIn title: "Executive Assistant to the Managing Partner", ' +
          'confirmed calendar-management access from a job-posting description referencing "scheduling for J. Fenwick") ' +
          'flag{theharvester_executive_assistant_phishing_target}',
      },
      { line: '    careers@fenwick-legal.example' },
      { line: '    d.owusu@fenwick-legal.example (associate attorney, from a court filing PDF)' },
    ],
  },
];
