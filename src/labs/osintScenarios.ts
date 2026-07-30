import type { OsintLabScenario } from './osintTerminalTypes';

/** OSINT/recon tool labs — Shodan, Sherlock, Maltego, EyeWitness, theHarvester.
 *
 *  Unlike the SIEM labs (a query-bar console), these run through a real Linux terminal: the learner
 *  types the actual CLI invocation for the tool (shodan search ..., sherlock <user>, theHarvester -d ...,
 *  a headless maltego-cli transform wrapper, eyewitness --web ...) and the tool's output streams back
 *  progressively — sometimes one result at a time (Sherlock genuinely checks sites sequentially; a live
 *  scan trickles in), sometimes a full batch at once (a single search API response), matching how each
 *  real tool actually behaves rather than dumping every result instantly. */
export const OSINT_LABS: OsintLabScenario[] = [
  // ───────────────────────── Shodan ─────────────────────────
  {
    id: 'osint-shodan-exposed-ics-hmi',
    title: 'Shodan: Hunting Exposed Industrial Control Panels',
    difficulty: 'Medium',
    tool: 'shodan',
    datasetLabel: 'shodan CLI',
    briefing:
      'Shodan indexes banners from every internet-facing device it can reach, and industrial control systems — ' +
      'water treatment HMIs, building automation panels, PLCs — turn up in it constantly, a pattern security ' +
      'researchers (Project SHINE\'s 2012-2014 census of exposed ICS being the best-known example) have ' +
      'documented for over a decade. This recreates that exact workflow using Shodan\'s real command-line ' +
      'client: sweeping for Modbus/TCP devices and finding one with full read/write access and no authentication.',
    objectives: [
      { text: 'Search Shodan for devices speaking Modbus/TCP on port 502', why: 'Port 502 is the default for Modbus, the most common industrial control protocol — it\'s one of the first filters any ICS-focused Shodan sweep starts with.' },
      { text: 'Narrow the results to hosts identifying as a Niagara supervisory HMI', why: 'A banner alone doesn\'t tell you the exposure level — narrowing to a specific product is how you go from "here are some PLCs" to "here is a specific vulnerable one."' },
      { text: 'Review the narrowed results and capture the flag on the host with no authentication at all', why: 'The gap between "port is open" and "port is open with zero access control" is the entire finding — that\'s what actually turns a Shodan hit into an incident.' },
    ],
    hints: ['shodan search port:502', 'shodan search port:502 Niagara'],
    totalFlags: 1,
    commands: [
      {
        match: /shodan\s+search\s+port:502\s*$/i,
        chunks: [
          { lines: ['Search query: port:502', '3 results'], delayMs: 350 },
          {
            lines: [
              '102.67.140.22  Johannesburg, ZA  Schneider Electric Modicon M340 PLC — Modbus/TCP, read-only register access',
              '41.190.88.51   Nairobi, KE       Niagara AX Framework v3.8 supervisory HMI — authentication required on write',
              '154.72.3.190   Accra, GH         Niagara AX Framework supervisory HMI — Modbus/TCP open',
            ],
            delayMs: 700,
          },
        ],
      },
      {
        match: /shodan\s+search\s+port:502\s+niagara\s*$/i,
        chunks: [
          { lines: ['Search query: port:502 Niagara', '2 results'], delayMs: 300 },
          { lines: ['41.190.88.51   Nairobi, KE  Niagara AX Framework v3.8 — write access requires authentication'], delayMs: 500 },
          {
            lines: [
              '154.72.3.190   Accra, GH    Niagara AX Framework — read/write register access confirmed, NO authentication ' +
                'challenge presented at any point in the session. This is exactly the pattern OSINT researchers ' +
                'cataloguing Shodan\'s ICS results have repeatedly documented — an internet-exposed, authentication-free ' +
                'industrial panel with full write access to live control registers. flag{shodan_modbus_niagara_hmi_no_auth_accra}',
            ],
            delayMs: 900,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-shodan-exposed-rdp-ransomware-entry',
    title: 'Shodan: Finding Exposed RDP Before a Ransomware Affiliate Does',
    difficulty: 'Easy',
    tool: 'shodan',
    datasetLabel: 'shodan CLI',
    briefing:
      'Exposed Remote Desktop Protocol (port 3389) is consistently reported as the single most common ' +
      'initial-access vector in ransomware incidents — access brokers scan the internet with Shodan-style ' +
      'tools specifically to find open RDP, then sell that access on dark web markets to ransomware ' +
      'affiliates who never have to find the exposure themselves. This is the defensive mirror of that ' +
      'exact workflow, run through Shodan\'s real CLI: finding your own exposed RDP hosts before someone ' +
      'sells access to them.',
    objectives: [
      { text: 'Search Shodan for hosts with port 3389 open', why: 'Port 3389 is RDP\'s default — this is the very first filter an access broker runs, and the very first thing a defensive sweep should check for on its own IP ranges.' },
      { text: 'Narrow to hosts that allow NLA-less (Network Level Authentication disabled) connections', why: 'RDP with NLA disabled lets an attacker reach the full login screen — and any vulnerabilities behind it — before authenticating at all, which is what actually makes an exposed RDP host valuable to sell.' },
      { text: 'Capture the flag on the one host confirmed to have both NLA disabled and a default administrator account still enabled', why: 'This is the exact combination access brokers look for: reachable, unauthenticated up to the login screen, and a credential worth guessing — the full chain from "port open" to "sellable access."' },
    ],
    hints: ['shodan search port:3389', 'shodan search port:3389 "NLA disabled"'],
    totalFlags: 1,
    commands: [
      {
        match: /shodan\s+search\s+port:3389\s*$/i,
        chunks: [
          { lines: ['Search query: port:3389', '4 results'], delayMs: 300 },
          { lines: ['45.130.22.9   Amsterdam, NL  RDP open, NLA enforced'], delayMs: 400 },
          { lines: ['154.72.9.201  Accra, GH      RDP open, NLA disabled, full login screen reachable pre-auth'], delayMs: 400 },
          { lines: ['197.211.60.4  Kampala, UG    RDP open, NLA enforced', '102.67.140.22 Johannesburg, ZA RDP open, NLA enforced'], delayMs: 500 },
        ],
      },
      {
        match: /shodan\s+search\s+port:3389\s+"?nla disabled"?\s*$/i,
        chunks: [
          { lines: ['Search query: port:3389 "NLA disabled"', '1 result'], delayMs: 400 },
          {
            lines: [
              '154.72.9.201  Accra, GH  RDP open, NLA disabled, "Administrator" account visible and enabled on the ' +
                'login screen — CONFIRMED: exactly the combination initial-access brokers scan for and sell to ' +
                'ransomware affiliates. flag{shodan_exposed_rdp_nla_disabled_default_admin}',
            ],
            delayMs: 700,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-shodan-botnet-c2-favicon-hash',
    title: 'Shodan: Tracking a Botnet\'s C2 Panels by Favicon Hash',
    difficulty: 'Hard',
    tool: 'shodan',
    datasetLabel: 'shodan CLI',
    briefing:
      'A distinctive login-panel favicon hashes to the same value on every server running that same panel ' +
      'software, anywhere on the internet — and Shodan indexes favicon hashes as a real, searchable field ' +
      '(http.favicon.hash:). Threat intel researchers have used exactly this technique for years to map an ' +
      'entire botnet or malware family\'s command-and-control infrastructure from a single known sample: ' +
      'hash its panel\'s favicon once, then search Shodan for every other server serving the identical icon.',
    objectives: [
      { text: 'Search Shodan for the known C2 panel favicon hash', why: 'This is the entire technique in one query — a single favicon hash search surfaces every internet-facing server running the same distinctive control-panel software, all at once.' },
      { text: 'Pull registration details for each match to see which domains are freshly registered', why: 'A newly-registered host serving the exact same C2 panel is far more likely to be live operator infrastructure than an old host that might just be a honeypot or a researcher\'s own copy.' },
      { text: 'Capture the flag on the host confirmed to be actively beaconing traffic', why: 'The favicon hash narrows a global search to a handful of candidates — confirming actual beacon traffic is what turns "matches the fingerprint" into "this is a live C2 server."' },
    ],
    hints: ['shodan search http.favicon.hash:-1849482430', 'shodan host 91.242.72.108'],
    totalFlags: 1,
    commands: [
      {
        match: /shodan\s+search\s+http\.favicon\.hash:-1849482430\s*$/i,
        chunks: [
          { lines: ['Search query: http.favicon.hash:-1849482430', '4 results'], delayMs: 400 },
          { lines: ['185.220.101.47  Bucharest, RO  domain registered 2019'], delayMs: 350 },
          { lines: ['91.242.72.108   Kyiv, UA       domain registered 6 days ago'], delayMs: 350 },
          { lines: ['194.36.191.53   Sofia, BG      unrelated favicon hash, filtered out'], delayMs: 300 },
          { lines: ['45.130.22.9     Amsterdam, NL  domain registered 2021, sinkholed by a known threat intel vendor'], delayMs: 350 },
        ],
      },
      {
        match: /shodan\s+host\s+91\.242\.72\.108\s*$/i,
        chunks: [
          { lines: ['91.242.72.108', 'Kyiv, UA'], delayMs: 400 },
          { lines: ['Ports: 80/tcp'], delayMs: 350 },
          {
            lines: [
              'CONFIRMED: favicon hash match on a domain registered only 6 days ago, actively beaconing outbound ' +
                'traffic on a 60-second interval consistent with live C2 check-ins. ' +
                'flag{shodan_favicon_hash_c2_infrastructure_tracked}',
            ],
            delayMs: 800,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-shodan-mongodb-ransom-wave',
    title: 'Shodan: The 2017 MongoDB Ransom Wave',
    difficulty: 'Medium',
    tool: 'shodan',
    datasetLabel: 'shodan CLI',
    briefing:
      'In January 2017, attackers used exactly this workflow — Shodan queries for unauthenticated MongoDB ' +
      'instances bound to 0.0.0.0 — to mass-wipe and ransom an estimated 45,000+ exposed databases in under a ' +
      'month, leaving a ransom-note document behind in place of the stolen data. No exploit was involved; the ' +
      'databases simply had no authentication enabled by default and were reachable from the open internet.',
    objectives: [
      { text: 'Search Shodan for hosts running MongoDB', why: 'product:"MongoDB" is the first move in reconstructing exactly what attackers searched for during the real 2017 wave.' },
      { text: 'Connect to an unauthenticated instance and list its databases', why: 'A MongoDB banner alone means nothing — bindIP 0.0.0.0 plus no auth challenge is the specific combination that made this wave possible at scale.' },
      { text: 'Capture the flag on the database already showing a ransom note', why: 'This is the exact artifact the 2017 attackers left behind — a single-collection database containing nothing but a payment demand, in place of the wiped original data.' },
    ],
    hints: ['shodan search product:"MongoDB"', 'shodan host 5.101.140.7'],
    totalFlags: 1,
    commands: [
      {
        match: /shodan\s+search\s+product:"?mongodb"?\s*$/i,
        chunks: [
          { lines: ['Search query: product:"MongoDB"', '4 results'], delayMs: 400 },
          { lines: ['45.32.98.4    Amsterdam, NL  v3.2.1, bindIP 127.0.0.1, requires authentication — not internet-reachable'], delayMs: 400 },
          { lines: ['185.61.148.22 Singapore, SG  v2.6.12, bindIP 0.0.0.0, unauthenticated, 4 databases visible'], delayMs: 400 },
          { lines: ['5.101.140.7   Kyiv, UA       v3.0.8, bindIP 0.0.0.0, unauthenticated, 1 database visible'], delayMs: 400 },
          { lines: ['91.200.14.88  Moscow, RU     v3.4.0, bindIP 0.0.0.0, unauthenticated, 12 databases visible'], delayMs: 400 },
        ],
      },
      {
        match: /shodan\s+host\s+5\.101\.140\.7\s*$/i,
        chunks: [
          { lines: ['5.101.140.7', 'Kyiv, UA — MongoDB 3.0.8, unauthenticated'], delayMs: 400 },
          { lines: ['Connecting... show dbs'], delayMs: 500 },
          {
            lines: [
              'Single collection present named "WARNING" containing one document: {"_id": "READ_ME_TO_RECOVER_YOUR_DATA", ' +
                '"note": "All your data has been backed up. You must pay 0.2 BTC to recover it."} — this is the real ' +
                'ransom-note pattern attackers left behind during the January 2017 mass-MongoDB-wipe wave, discovered ' +
                'through exactly this kind of routine Shodan sweep. flag{shodan_mongodb_ransom_wave_read_me_to_recover}',
            ],
            delayMs: 800,
          },
        ],
      },
    ],
  },

  // ───────────────────────── Sherlock ─────────────────────────
  {
    id: 'osint-sherlock-deanonymize-handle',
    title: 'Sherlock: De-anonymizing a Forum Threat Actor',
    difficulty: 'Medium',
    tool: 'sherlock',
    datasetLabel: 'sherlock CLI',
    briefing:
      'A near-universal step in real threat-actor attribution work: take a handle seen on a criminal forum or ' +
      'marketplace and run it across hundreds of other platforms, looking for the one place the same person got ' +
      'sloppy and reused it on something personal and non-anonymous. This is exactly how researchers and law ' +
      'enforcement have unmasked real ransomware-affiliate and carding-forum handles before — not through a ' +
      'technical exploit, just patient cross-platform correlation, using Sherlock\'s real command-line tool.',
    objectives: [
      { text: 'Run Sherlock against the handle "gh0st_ferryman"', why: 'A full sweep across every supported site is the baseline of this technique — most hits will be irrelevant, and that\'s expected.' },
      { text: 'Confirm the criminal-marketplace hit ties this handle to real illicit activity', why: 'Establishing that the handle is genuinely the threat actor\'s (not a coincidental namesake) is a necessary step before spending time correlating further.' },
      { text: 'Find the non-anonymous hobby-platform account where a real name leaked, and capture the flag', why: 'This is the actual payoff of the technique — a platform with zero connection to the criminal activity, used casually enough that operational security lapsed.' },
    ],
    hints: ['sherlock gh0st_ferryman'],
    totalFlags: 1,
    commands: [
      {
        match: /sherlock\s+gh0st_ferryman\s*$/i,
        chunks: [
          { lines: ['[*] Checking username gh0st_ferryman on:'], delayMs: 300 },
          { lines: ['[+] BreachForums: https://breachforums.example/user/gh0st_ferryman (account created 2021, 340 posts, selling database dumps)'], delayMs: 450 },
          { lines: ['[-] Instagram: Not Found'], delayMs: 220 },
          { lines: ['[+] Twitter: https://twitter.example/gh0st_ferryman (bio: "into infosec, chess, and vintage synths")'], delayMs: 400 },
          { lines: ['[-] Facebook: Not Found'], delayMs: 220 },
          {
            lines: [
              '[+] Chess.com: https://chess.example/member/gh0st_ferryman — real name field populated: "D. Okafor", ' +
                'location: "Lagos, NG", joined 2018 — same handle reused on a completely non-anonymous hobby platform, ' +
                'the exact kind of cross-platform username reuse that has unmasked real threat actors before. ' +
                'flag{sherlock_handle_reuse_chess_platform_deanon}',
            ],
            delayMs: 550,
          },
          { lines: ['[-] Reddit: Not Found'], delayMs: 220 },
          { lines: ['[*] 2 accounts found of interest'], delayMs: 300 },
        ],
      },
    ],
  },
  {
    id: 'osint-sherlock-insider-threat-background-check',
    title: 'Sherlock: Verifying a Job Applicant\'s Claimed Identity',
    difficulty: 'Easy',
    tool: 'sherlock',
    datasetLabel: 'sherlock CLI',
    briefing:
      'A candidate for a privileged systems-administrator role listed a GitHub handle on their résumé as ' +
      'proof of their claimed five years of experience — but pre-employment identity verification is a ' +
      'real, standard part of insider-threat prevention for sensitive roles. Running the same handle ' +
      'across other platforms with Sherlock is exactly how a security team checks whether a candidate\'s ' +
      'claimed history actually holds together before handing them privileged access.',
    objectives: [
      { text: 'Run Sherlock against the handle "kdanquah_dev"', why: 'A single username searched everywhere at once is far faster than manually checking each platform one at a time — and it surfaces accounts the candidate may not have expected to be found together.' },
      { text: 'Compare the account creation dates and activity history across platforms for consistency', why: 'A claimed five-year history should show five years of activity somewhere — accounts that all appeared within the same few weeks are a real, common red flag for a fabricated or purchased identity history.' },
      { text: 'Capture the flag on the finding that resolves whether the claimed history is genuine', why: 'This is the actual point of the check: not just "does this handle exist," but "does the evidence support what the candidate claimed."' },
    ],
    hints: ['sherlock kdanquah_dev'],
    totalFlags: 1,
    commands: [
      {
        match: /sherlock\s+kdanquah_dev\s*$/i,
        chunks: [
          { lines: ['[*] Checking username kdanquah_dev on:'], delayMs: 300 },
          { lines: ['[+] GitHub: account created 2021-06-14, 340 commits across 12 public repos, consistent with 5 years of claimed experience'], delayMs: 450 },
          { lines: ['[+] LinkedIn: profile matches résumé job history, employment dates line up with GitHub activity'], delayMs: 400 },
          { lines: ['[+] Twitter/X: account created 2020-11-02, tech-focused posting history, consistent timeline'], delayMs: 400 },
          {
            lines: [
              '[+] StackOverflow: account created 2026-01-08, only 3 weeks before this candidate\'s résumé was submitted, ' +
                'with copy-pasted answers matching questions from a well-known "senior sysadmin interview prep" course ' +
                '— CONFIRMED inconsistent with the claimed 5 years of hands-on experience the résumé describes. ' +
                'flag{sherlock_fabricated_experience_history_flagged}',
            ],
            delayMs: 550,
          },
          { lines: ['[-] Reddit: Not Found'], delayMs: 220 },
          { lines: ['[*] 4 accounts found of interest'], delayMs: 300 },
        ],
      },
    ],
  },
  {
    id: 'osint-sherlock-redteam-pretext',
    title: 'Sherlock: Building a Social-Engineering Pretext from an Employee Handle',
    difficulty: 'Easy',
    tool: 'sherlock',
    datasetLabel: 'sherlock CLI',
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
    hints: ['sherlock kpatel_eng'],
    totalFlags: 1,
    commands: [
      {
        match: /sherlock\s+kpatel_eng\s*$/i,
        chunks: [
          { lines: ['[*] Checking username kpatel_eng on:'], delayMs: 300 },
          { lines: ['[-] MySpace: Not Found'], delayMs: 220 },
          { lines: ['[-] Tumblr: Not Found'], delayMs: 220 },
          { lines: ['[+] LinkedIn: Senior DevOps Engineer at TargetCorp, 6 years'], delayMs: 400 },
          {
            lines: [
              '[+] Strava: public activity feed, most recent run logged from "Lisbon, Portugal" — 3 posts this week, ' +
                'this account is travelling out of the country right now, a real technique red teams use OSINT ' +
                'exactly like this to build a pretext around. flag{sherlock_strava_travel_pretext_kpatel}',
            ],
            delayMs: 500,
          },
          { lines: ['[-] Pinterest: Not Found'], delayMs: 220 },
          { lines: ['[*] 2 accounts found of interest'], delayMs: 300 },
        ],
      },
    ],
  },
  {
    id: 'osint-sherlock-password-spray-target-list',
    title: 'Sherlock: Building a Password-Spray Target List from Reused Handles',
    difficulty: 'Medium',
    tool: 'sherlock',
    datasetLabel: 'sherlock CLI',
    briefing:
      'Password spraying — trying one common password against many usernames, staying under any single ' +
      'account\'s lockout threshold — only works if you have real usernames to spray against first. A ' +
      'real, common technique: run each employee\'s known handle through Sherlock, then cross-reference ' +
      'which platforms they\'re active on against a corpus of previously breached credentials, since ' +
      'people who reuse a handle across platforms very often reuse a password too.',
    objectives: [
      { text: 'Run Sherlock against the handle "sowusu_it"', why: 'Confirms which platforms this employee actually has live accounts on, before assuming they\'re a useful target.' },
      { text: 'Cross-reference the confirmed handle against a known breach corpus', why: 'A handle with a matching entry in a previous public breach dump is far more valuable than one without — it means there\'s a real, if outdated, password already associated with that identity to try variations of.' },
      { text: 'Capture the flag confirming this employee is active on the corporate SSO-linked platform AND appears in a breach corpus', why: 'This is the exact combination that makes password spraying worth attempting against a specific account rather than guessing blindly — a real prior password to vary, on a platform that actually matters.' },
    ],
    hints: ['sherlock sowusu_it', 'breach-check sowusu_it'],
    totalFlags: 1,
    commands: [
      {
        match: /sherlock\s+sowusu_it\s*$/i,
        chunks: [
          { lines: ['[*] Checking username sowusu_it on:'], delayMs: 300 },
          { lines: ['[+] Okta (corporate SSO profile page): active'], delayMs: 400 },
          { lines: ['[+] GitHub: active', '[+] Twitter/X: active'], delayMs: 400 },
          { lines: ['[+] LinkedIn: active', '[+] Facebook: active'], delayMs: 400 },
          { lines: ['[*] 5 accounts found of interest — active on the corporate SSO-linked Okta profile page'], delayMs: 350 },
        ],
      },
      {
        match: /breach-check\s+sowusu_it\s*$/i,
        chunks: [
          { lines: ['[*] Cross-referencing sowusu_it against known breach corpora...'], delayMs: 400 },
          {
            lines: [
              'MATCH: 2022 breach corpus entry, password hash cracked to "Kumasi2019!" — a real prior password worth ' +
                'spraying targeted variations of against the current SSO login. CONFIRMED active on Okta + breach ' +
                'corpus match = a real password-spray target. flag{sherlock_breach_corpus_password_spray_target}',
            ],
            delayMs: 700,
          },
        ],
      },
    ],
  },

  // ───────────────────────── Maltego ─────────────────────────
  {
    id: 'osint-maltego-phishing-infra-cluster',
    title: "Maltego: Clustering a Phishing Kit's Domain Infrastructure",
    difficulty: 'Hard',
    tool: 'maltego',
    datasetLabel: 'maltego-cli (headless transform runner)',
    briefing:
      'A bread-and-butter threat-intel workflow: pivot from one confirmed phishing domain through its WHOIS ' +
      'registrant details, then run a "domains sharing this registrant" transform to surface sibling domains the ' +
      'same actor controls — often including ones nobody has reported yet. Maltego\'s whole design exists to make ' +
      'exactly this kind of graph pivot fast; maltego-cli runs the same transforms headlessly from a terminal.',
    objectives: [
      { text: 'Run the "to WHOIS Details" transform on the seed phishing domain', why: 'The registrant email is the pivot point — everything else in this investigation branches from it.' },
      { text: 'Run the "to Domains sharing this Registrant Email" transform to pivot outward', why: 'This is the actual clustering step — one registrant email frequently ties together an entire phishing campaign\'s infrastructure.' },
      { text: 'Find the sibling domain that is still live and unreported, and capture the flag', why: 'The other two domains were already caught — the value of this graph pivot is finding the one that slipped through.' },
    ],
    hints: [
      'maltego-cli --transform "to WHOIS Details" --target secure-0ffice365-login.com',
      'maltego-cli --transform "to Domains sharing this Registrant Email" --target k.morozov1988@protonmail.example',
    ],
    totalFlags: 1,
    commands: [
      {
        match: /maltego-cli\s+--transform\s+"to whois details"\s+--target\s+secure-0ffice365-login\.com\s*$/i,
        chunks: [
          { lines: ['Running transform: to WHOIS Details(secure-0ffice365-login.com)'], delayMs: 400 },
          { lines: ['→ registrant_email: k.morozov1988@protonmail.example', '→ registrar: NameSilo', '→ created: 2024-03-02'], delayMs: 700 },
        ],
      },
      {
        match: /maltego-cli\s+--transform\s+"to domains sharing this registrant email"\s+--target\s+k\.morozov1988@protonmail\.example\s*$/i,
        chunks: [
          { lines: ['Running transform: to Domains sharing this Registrant Email(k.morozov1988@protonmail.example)'], delayMs: 400 },
          {
            lines: [
              '→ secure-0ffice365-login.com (seed domain)',
              '→ portal-0utlook-verify.com — HTTP 200, phishing kit already reported to registrar, domain suspended 2024-03-19',
              '→ docusign-secure-view.net — HTTP 200, phishing kit already reported and taken down 2024-03-21',
            ],
            delayMs: 700,
          },
          {
            lines: [
              '→ adp-payroll-portal.com — HTTP 200, identical phishing kit fingerprint to the seed domain, still live and ' +
                'unreported as of this session — the exact kind of sibling-domain discovery Maltego\'s registrant-pivot ' +
                'transform is built for. flag{maltego_registrant_pivot_adp_payroll_portal_still_live}',
            ],
            delayMs: 600,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-maltego-ransomware-wallet-infra-link',
    title: 'Maltego: Linking a Ransomware Group\'s Wallet to Its Leak-Site Infrastructure',
    difficulty: 'Hard',
    tool: 'maltego',
    datasetLabel: 'maltego-cli (headless transform runner)',
    briefing:
      'Ransomware attribution investigations routinely combine on-chain analysis with infrastructure OSINT ' +
      '— exactly the kind of multi-entity link analysis Maltego is built for. A ransom payment\'s Bitcoin ' +
      'wallet address, a dark-web leak-site domain\'s registration footprint, and a forum handle used to ' +
      'negotiate with victims are three separate data types that, linked together, can point to the same ' +
      'operating group — the same approach real investigators used to help attribute several major 2020s ' +
      'ransomware operations.',
    objectives: [
      { text: 'Trace the ransom payment wallet address forward to its next hop', why: 'Ransomware operators rarely cash out directly from the receiving wallet — following the first hop is the standard first step in any on-chain tracing effort.' },
      { text: 'Pivot from the forum negotiation thread to the handle behind it', why: 'The wallet address alone is just a number — tying it to a real negotiating handle is what turns a financial trail into an identity trail.' },
      { text: 'Capture the flag on the forum handle linked to both the wallet cluster and the leak-site domain registration', why: 'This is the actual attribution moment — a financial link and an infrastructure link both pointing to the same handle is far stronger evidence than either one alone.' },
    ],
    hints: [
      'maltego-cli --transform "to Next Hop" --target bc1qxy2...ransom',
      'maltego-cli --transform "to Forum Handle from Wallet" --target bc1qxy2...ransom',
    ],
    totalFlags: 1,
    commands: [
      {
        match: /maltego-cli\s+--transform\s+"to next hop"\s+--target\s+bc1qxy2\.\.\.ransom\s*$/i,
        chunks: [
          { lines: ['Running transform: to Next Hop(bc1qxy2...ransom)'], delayMs: 400 },
          {
            lines: [
              '→ bc1qxy2...ransom received 4.2 BTC, forwarded entire balance to bc1qm3n...relay within 6 hours',
              '→ bc1qm3n...relay clusters with a known non-compliant offshore exchange flagged in prior investigations',
            ],
            delayMs: 700,
          },
        ],
      },
      {
        match: /maltego-cli\s+--transform\s+"to forum handle from wallet"\s+--target\s+bc1qxy2\.\.\.ransom\s*$/i,
        chunks: [
          { lines: ['Running transform: to Forum Handle from Wallet(bc1qxy2...ransom)'], delayMs: 400 },
          { lines: ['→ handle "night_broker" negotiates ransom payments on a known cybercrime forum, wallet address in thread matches bc1qxy2...ransom'], delayMs: 500 },
          { lines: ['→ pivoting: to Domain Registration Activity(night_broker)'], delayMs: 400 },
          {
            lines: [
              '→ CONFIRMED: handle "night_broker" also posted the registration renewal notice for leaks-onion-mirror7[.]net ' +
                '(the group\'s victim leak site) using an identical writing-style fingerprint, linking the financial trail ' +
                'and the infrastructure trail to the same individual. flag{maltego_wallet_leaksite_forum_handle_attribution}',
            ],
            delayMs: 700,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-maltego-vendor-subdomain-supply-chain',
    title: 'Maltego: Mapping a Vendor\'s Subdomain Sprawl for a Supply-Chain Foothold',
    difficulty: 'Medium',
    tool: 'maltego',
    datasetLabel: 'maltego-cli (headless transform runner)',
    briefing:
      'Direct attacks on a hardened primary target often fail — so real attackers (and red teams testing ' +
      'exactly this) instead map every third-party vendor a target company depends on, looking for the ' +
      'weakest link in. Maltego\'s domain-to-subdomain-to-hosting transforms make this kind of sprawl ' +
      'visible at a glance: one forgotten vendor subdomain on outdated infrastructure is often all it takes ' +
      'to get a foothold that eventually reaches the primary target through a trusted integration.',
    objectives: [
      { text: 'Enumerate the target company\'s known third-party vendor integrations', why: 'A company\'s security posture is only as strong as its weakest connected vendor — mapping the vendor list is the necessary first step before looking for the weak one.' },
      { text: 'Expand the CRM integration partner\'s domain to its known subdomains', why: 'Vendors accumulate the exact same kind of forgotten, unmonitored subdomains their customers do — staging environments, old marketing microsites, decommissioned portals nobody remembered to remove.' },
      { text: 'Capture the flag on the vendor subdomain still running end-of-life software with a direct integration link back to the target', why: 'This is the actual finding that matters: not just "a vendor has an old subdomain," but one that both is genuinely vulnerable and has a real trust relationship reaching back into the primary target.' },
    ],
    hints: [
      'maltego-cli --transform "to Vendor Integrations" --target target-corp.example',
      'maltego-cli --transform "to Subdomains" --target crm-integration-partner.com',
    ],
    totalFlags: 1,
    commands: [
      {
        match: /maltego-cli\s+--transform\s+"to vendor integrations"\s+--target\s+target-corp\.example\s*$/i,
        chunks: [
          { lines: ['Running transform: to Vendor Integrations(target-corp.example)'], delayMs: 400 },
          {
            lines: [
              '→ payroll-vendor.com — modern infrastructure, standard API integration only',
              '→ crm-integration-partner.com — OAuth integration with target\'s customer database',
              '→ analytics-saas.io — read-only analytics integration, no write access',
            ],
            delayMs: 700,
          },
        ],
      },
      {
        match: /maltego-cli\s+--transform\s+"to subdomains"\s+--target\s+crm-integration-partner\.com\s*$/i,
        chunks: [
          { lines: ['Running transform: to Subdomains(crm-integration-partner.com)'], delayMs: 400 },
          { lines: ['→ api.crm-integration-partner.com — current, actively maintained'], delayMs: 400 },
          { lines: ['→ marketing.crm-integration-partner.com — old campaign microsite, static content only, no integration access'], delayMs: 400 },
          {
            lines: [
              '→ legacy-staging.crm-integration-partner.com — CONFIRMED: still running a CRM platform version end-of-life ' +
                'since 2021, TLS cert expired 8 months ago, and still holds a valid OAuth client secret for the exact ' +
                'same production integration used to sync data into the primary target\'s customer database. ' +
                'flag{maltego_vendor_subdomain_supply_chain_foothold}',
            ],
            delayMs: 700,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-maltego-email-convention',
    title: "Maltego: Mapping a Target Company's Email Naming Convention",
    difficulty: 'Medium',
    tool: 'maltego',
    datasetLabel: 'maltego-cli (headless transform runner)',
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
    hints: [
      'maltego-cli --transform "to Domain" --target "Meridian Financial Group"',
      'maltego-cli --transform "to Email addresses found in search engines" --target meridianfin.example',
    ],
    totalFlags: 1,
    commands: [
      {
        match: /maltego-cli\s+--transform\s+"to domain"\s+--target\s+"meridian financial group"\s*$/i,
        chunks: [
          { lines: ['Running transform: to Domain(Meridian Financial Group)'], delayMs: 400 },
          { lines: ['→ meridianfin.example — primary corporate domain, confirmed via SSL certificate org field'], delayMs: 500 },
        ],
      },
      {
        match: /maltego-cli\s+--transform\s+"to email addresses found in search engines"\s+--target\s+meridianfin\.example\s*$/i,
        chunks: [
          { lines: ['Running transform: to Email addresses found in search engines(meridianfin.example)'], delayMs: 400 },
          { lines: ['→ press@meridianfin.example (press contact, from an old PR release)'], delayMs: 350 },
          { lines: ['→ j.ramirez@meridianfin.example (from a conference speaker bio: "Jorge Ramirez, VP Engineering")'], delayMs: 400 },
          { lines: ['→ s.chen@meridianfin.example (from a GitHub commit: "Sarah Chen, Platform Team")'], delayMs: 400 },
          {
            lines: [
              'ANALYSIS: two independently-sourced addresses (j.ramirez@, s.chen@) both follow ' +
                'first-initial.lastname@meridianfin.example — with a public org chart or LinkedIn employee list, this ' +
                'convention alone is enough to construct a plausible address for anyone else on staff, no breach ' +
                'dataset required. flag{maltego_email_convention_first_initial_lastname_meridianfin}',
            ],
            delayMs: 650,
          },
        ],
      },
    ],
  },

  // ───────────────────────── EyeWitness ─────────────────────────
  {
    id: 'osint-eyewitness-admin-panel-triage',
    title: 'EyeWitness: Finding the One Exposed Admin Panel in 200 Hosts',
    difficulty: 'Medium',
    tool: 'eyewitness',
    datasetLabel: 'eyewitness CLI',
    briefing:
      'After a subnet-wide scan returns 200+ live web services, EyeWitness screenshots and auto-categorizes every ' +
      'one by page title and login-form signature, turning an unmanageable firehose of URLs into a short, ' +
      'triageable report — exactly the step real pentesters rely on instead of manually opening hundreds of tabs.',
    objectives: [
      { text: 'Run EyeWitness against the target subnet\'s host list', why: 'A single bulk run screenshots and categorizes every live host at once — the standard way to turn 200+ raw URLs into something triageable.' },
      { text: 'Filter the generated report for anything categorized as a login panel', why: 'Login/admin panels are disproportionately where real findings live compared to default pages and redirects.' },
      { text: 'Capture the flag on the panel running known-vulnerable, outdated software', why: 'This is the actual triage outcome EyeWitness exists to produce: one real finding, isolated from 200 screenshots of noise.' },
    ],
    hints: ['eyewitness --web -f subnet_hosts.txt -d report/', 'cat report/report.txt | grep "Login Panel"'],
    totalFlags: 1,
    commands: [
      {
        match: /eyewitness\s+--web\s+-f\s+subnet_hosts\.txt\s+-d\s+report\/?\s*$/i,
        chunks: [
          { lines: ['[*] Starting EyeWitness — 200 hosts queued'], delayMs: 300 },
          { lines: ['[*] Attempting to screenshot 10.40.12.4 (1 of 200)...'], delayMs: 250 },
          { lines: ['[*] Attempting to screenshot 10.40.12.19 (2 of 200)...'], delayMs: 200 },
          { lines: ['[*] Attempting to screenshot 10.40.12.55 (3 of 200)...', '[*] ... 197 more hosts ...'], delayMs: 250 },
          { lines: ['[+] Report complete: report/report.txt (200 hosts categorized)'], delayMs: 500 },
        ],
      },
      {
        match: /cat\s+report\/report\.txt\s*\|\s*grep\s+"?login panel"?\s*$/i,
        chunks: [
          { lines: ['http://10.40.12.19 — "Grafana Login", category: Login Panel, version 10.2.3 (current, patched)'], delayMs: 350 },
          {
            lines: [
              'http://10.40.12.55 — "Jenkins — Sign in", category: Login Panel, version 2.60.1 (released 2019) — 7 major ' +
                'versions behind current, multiple public CVEs including unauthenticated RCE (CVE-2019-1003000 class) — ' +
                'this is exactly the kind of host EyeWitness triage is built to surface, one outdated panel hiding ' +
                'inside 200 screenshots of default pages and redirects. flag{eyewitness_jenkins_2_60_1_outdated_rce_panel}',
            ],
            delayMs: 600,
          },
          { lines: ['http://10.40.12.77 — "pfSense - Login", category: Login Panel, version 2.7.0 (current, patched)'], delayMs: 350 },
        ],
      },
    ],
  },
  {
    id: 'osint-eyewitness-post-merger-legacy-portal',
    title: 'EyeWitness: Finding the Legacy Portal After a Merger',
    difficulty: 'Medium',
    tool: 'eyewitness',
    datasetLabel: 'eyewitness CLI',
    briefing:
      'Sterling Group acquired a smaller competitor six months ago, and their two networks were merged with ' +
      'minimal cleanup — a very common, very real gap in post-acquisition security work. A full subnet scan ' +
      'of the newly-combined IP ranges, screenshotted in bulk with EyeWitness, is exactly how a security ' +
      'team (or an attacker who knows an acquisition just happened) finds what the acquired company brought ' +
      'in that nobody\'s looked at since the deal closed.',
    objectives: [
      { text: 'Run EyeWitness against the newly-merged IP range', why: 'Screenshots are what let a human instantly recognize "this looks like it\'s from a decade ago" in a way raw scan output never will.' },
      { text: 'Review the report for a host still displaying the acquired company\'s old branding', why: 'Old branding still showing is a strong signal the acquired company\'s own team stopped maintaining that host well before the deal even closed — a strong candidate for the most neglected system in the merged network.' },
      { text: 'Capture the flag on the host confirmed to still be running its original, never-updated login portal', why: 'This is the actual risk the screenshot triage was built to surface: not just an old-looking page, but a genuinely unpatched, unmonitored authentication portal now sitting inside the combined network\'s trust boundary.' },
    ],
    hints: ['eyewitness --web -x 10.40.0.0/24 -d merger_report/', 'cat merger_report/report.txt'],
    totalFlags: 1,
    commands: [
      {
        match: /eyewitness\s+--web\s+-x\s+10\.40\.0\.0\/24\s+-d\s+merger_report\/?\s*$/i,
        chunks: [
          { lines: ['[*] Starting EyeWitness — 140 hosts queued'], delayMs: 300 },
          { lines: ['[*] Attempting to screenshot 10.40.2.11 (1 of 140)...'], delayMs: 220 },
          { lines: ['[*] Attempting to screenshot 10.40.5.77 (2 of 140)...', '[*] ... 138 more hosts ...'], delayMs: 250 },
          { lines: ['[+] Report complete: merger_report/report.txt (140 hosts categorized)'], delayMs: 500 },
        ],
      },
      {
        match: /cat\s+merger_report\/report\.txt\s*$/i,
        chunks: [
          { lines: ['10.40.2.11 — Sterling Group current corporate portal, modern branding, TLS cert renewed last month'], delayMs: 300 },
          { lines: ['10.40.2.19 — Sterling Group HR self-service, current branding, standard SSO login'], delayMs: 300 },
          { lines: ['10.40.5.77 — screenshot shows the acquired company\'s old logo and a "circa 2016" visual design, unrelated to current Sterling Group branding'], delayMs: 400 },
          { lines: ['10.40.2.30 — Sterling Group internal wiki, current branding'], delayMs: 300 },
          {
            lines: [
              '10.40.5.77 — CONFIRMED: the old-branded host is running the acquired company\'s original admin login ' +
                'portal, software version last updated in 2016, with no SSO integration and no record of any security ' +
                'review since the merger closed six months ago. flag{eyewitness_postmerger_legacy_login_portal}',
            ],
            delayMs: 600,
          },
          { lines: ['10.40.2.45 — Sterling Group VPN gateway, access forbidden without client cert (403), unrelated'], delayMs: 300 },
        ],
      },
    ],
  },

  // ───────────────────────── theHarvester ─────────────────────────
  {
    id: 'osint-theharvester-attack-surface',
    title: 'theHarvester: Building an Attack Surface Before Touching the Target',
    difficulty: 'Easy',
    tool: 'theharvester',
    datasetLabel: 'theHarvester CLI',
    briefing:
      'theHarvester passively pulls emails, subdomains, and hosts for a domain from search engines and ' +
      'certificate transparency logs — zero packets ever sent to the target itself, which is exactly why it\'s a ' +
      'standard first step of almost every engagement\'s recon phase, well before any scanning begins.',
    objectives: [
      { text: 'Run theHarvester against the target domain across all sources', why: 'crt.sh (certificate transparency logs) in particular surfaces subdomains that were never meant to stay public — every TLS certificate ever issued for a domain is permanently logged.' },
      { text: 'Review the host/subdomain enumeration results as they come in', why: 'This is the actual attack-surface map — every one of these hostnames is a potential entry point worth scoping into the engagement.' },
      { text: 'Capture the flag on the stale subdomain the certificate log surfaced', why: 'A forgotten pre-production environment that still resolves is one of the most common real findings from passive recon alone.' },
    ],
    hints: ['theHarvester -d northgate-retail.example -b all'],
    totalFlags: 1,
    commands: [
      {
        match: /theharvester\s+-d\s+northgate-retail\.example\s+-b\s+all\s*$/i,
        chunks: [
          { lines: ['*******************************************************************', '*  _   _                                                            *', '*  theHarvester 4.4.4                                              *', '*******************************************************************'], delayMs: 250 },
          { lines: ['[*] Target: northgate-retail.example', '[*] Searching Google, Bing, crt.sh...'], delayMs: 400 },
          { lines: ['[*] Emails found: 3'], delayMs: 400 },
          { lines: ['    hr@northgate-retail.example'], delayMs: 250 },
          { lines: ['    support@northgate-retail.example'], delayMs: 250 },
          { lines: ['    d.owusu@northgate-retail.example (from a job-posting PDF)'], delayMs: 300 },
          { lines: ['[*] Hosts found: 5'], delayMs: 400 },
          { lines: ['    www.northgate-retail.example (203.0.113.10)'], delayMs: 250 },
          { lines: ['    shop.northgate-retail.example (203.0.113.11)'], delayMs: 250 },
          { lines: ['    mail.northgate-retail.example (203.0.113.12)'], delayMs: 250 },
          { lines: ['    cdn.northgate-retail.example (203.0.113.13)'], delayMs: 250 },
          {
            lines: [
              '    staging-2019.northgate-retail.example (203.0.113.44) — certificate transparency log entry from 2019, ' +
                'still resolves, almost certainly a forgotten pre-production environment never decommissioned, exactly ' +
                'the kind of stale subdomain theHarvester\'s crt.sh source is built to surface. ' +
                'flag{theharvester_forgotten_staging_subdomain_2019}',
            ],
            delayMs: 550,
          },
        ],
      },
    ],
  },
  {
    id: 'osint-theharvester-spearphishing-target-list',
    title: 'theHarvester: Harvesting Employee Emails for a Phishing Simulation',
    difficulty: 'Easy',
    tool: 'theharvester',
    datasetLabel: 'theHarvester CLI',
    briefing:
      'Fenwick Legal has approved an authorized phishing simulation to measure how many employees click a ' +
      'realistic lure — but building a real target list requires real employee emails first. This is the ' +
      'exact first step of any spear-phishing engagement (simulated or genuinely malicious): harvest every ' +
      'email address and name pattern search engines, LinkedIn, and public documents have indexed for the ' +
      'target domain, before writing a single lure.',
    objectives: [
      { text: 'Run theHarvester against fenwick-legal.example across crt.sh, Bing, and LinkedIn', why: 'A wide harvest across multiple sources at once surfaces far more real addresses than manually guessing a naming convention.' },
      { text: 'Identify the email naming convention the harvested addresses follow', why: 'Once the pattern is confirmed from real examples, it can be applied to the company\'s full staff directory to build addresses for people who never showed up in the harvest directly.' },
      { text: 'Capture the flag on the harvested address belonging to an executive assistant with calendar access to the managing partner', why: 'For a realistic phishing simulation (or a real attacker), the most valuable target is rarely the most senior person directly — it\'s whoever has trusted access to that person\'s schedule and inbox.' },
    ],
    hints: ['theHarvester -d fenwick-legal.example -b crtsh,bing,linkedin'],
    totalFlags: 1,
    commands: [
      {
        match: /theharvester\s+-d\s+fenwick-legal\.example\s+-b\s+crtsh,bing,linkedin\s*$/i,
        chunks: [
          { lines: ['[*] theHarvester 4.4.4 — target: fenwick-legal.example — sources: crt.sh, bing, linkedin'], delayMs: 300 },
          { lines: ['[*] Emails found: 5'], delayMs: 400 },
          { lines: ['    info@fenwick-legal.example'], delayMs: 250 },
          { lines: ['    j.fenwick@fenwick-legal.example (managing partner, from LinkedIn profile)'], delayMs: 300 },
          {
            lines: [
              '    r.addo@fenwick-legal.example — LinkedIn title: "Executive Assistant to the Managing Partner", ' +
                'confirmed calendar-management access from a job-posting description referencing "scheduling for ' +
                'J. Fenwick". flag{theharvester_executive_assistant_phishing_target}',
            ],
            delayMs: 450,
          },
          { lines: ['    careers@fenwick-legal.example'], delayMs: 250 },
          { lines: ['    d.owusu@fenwick-legal.example (associate attorney, from a court filing PDF)'], delayMs: 300 },
        ],
      },
    ],
  },
];
