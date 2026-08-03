import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'malware-lab', user: 'root', root: dir(files) };
}

/** Three more attack classes not yet represented: a classic DNS zone-transfer misconfiguration
 *  (the exact technique the Networking module's traffic lesson already names but never had a lab
 *  for), a BYOVD EDR-killer driver identification (static malware triage), and OAuth device-code
 *  phishing (the real technique documented by Microsoft/Volexity against several 2023-2025
 *  nation-state-linked phishing campaigns). */
export const offensiveFreshAttacksLabs4: LabScenario[] = [
  // 1 — Network: DNS Zone Transfer (AXFR) Misconfiguration
  {
    id: 'net-dns-zone-transfer-axfr',
    title: 'DNS Zone Transfer (AXFR) Misconfiguration Leaks Internal Hostnames',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'ns1.meridiancorp.local, the authoritative name server for meridiancorp.local, allows a full zone ' +
      'transfer (AXFR) to any client that asks — a legacy misconfiguration where DNS servers replicate an ' +
      'entire zone to secondary name servers with no restriction on which secondaries are actually ' +
      'authorized to ask. Any external attacker who requests a zone transfer instead of a normal single-name ' +
      'lookup receives the complete internal DNS zone in one response: every hostname, every internal IP, ' +
      'often including hosts never meant to be discoverable at all (a decommissioned VPN gateway, a ' +
      'staging database, an unpatched legacy admin panel). This is one of the oldest, most consistently-cited ' +
      'DNS misconfigurations in network security assessments, and remains common enough that it is a ' +
      'standard checklist item in every external recon methodology.',
    objectives: [
      { text: 'nmap -sV -p 53 10.10.182.2', why: 'Confirms the authoritative name server and its open DNS port before attempting a zone transfer against it.' },
      {
        text: 'curl "10.10.182.2:53/axfr?zone=meridiancorp.local"',
        why: 'A normal DNS lookup only returns the one record you asked for; requesting a full zone transfer against a misconfigured server returns every record in the zone at once — the entire internal hostname/IP map in a single unauthenticated request.',
      },
      { text: 'Identify the internal host that should never have been publicly discoverable and capture the flag', why: 'The real impact of a zone transfer leak is never the leak itself — it is the specific internal host it reveals that becomes the next reconnaissance target.' },
    ],
    hints: [
      'nmap -sV -p 53 10.10.182.2',
      'curl "10.10.182.2:53/axfr?zone=meridiancorp.local" — mirrors running dig axfr against the name server.',
      'One entry in the returned zone is a legacy VPN gateway with no business being publicly known — that is the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ns1',
        ip: '10.10.182.2',
        os: 'Ubuntu 22.04 (BIND 9, zone transfer restriction not configured)',
        services: [
          {
            port: 53,
            name: 'domain',
            version: 'BIND 9.18 (allow-transfer not restricted)',
            http: {},
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/axfr',
                param: 'zone',
                triggerSubstrings: ['meridiancorp.local'],
                vulnerableResponse:
                  'meridiancorp.local.       IN SOA   ns1.meridiancorp.local.\n' +
                  'www.meridiancorp.local.   IN A     198.51.100.10\n' +
                  'mail.meridiancorp.local.  IN A     198.51.100.11\n' +
                  'vpn-legacy.meridiancorp.local. IN A 10.20.30.40   ; decommissioned VPN gateway, never meant to be public\n' +
                  'staging-db.meridiancorp.local. IN A 10.20.30.41\n' +
                  '--- full zone transferred with zero authentication required ---\n' +
                  'flag{dns_axfr_zone_transfer_leaks_internal_hostnames}',
                normalResponse: '; connection timed out; no servers could be reached (transfer refused, not authorized)',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Malware: BYOVD EDR-Killer Driver Identification
  {
    id: 'malware-byovd-edr-killer',
    title: 'Malware Analysis: Identifying a BYOVD EDR-Killer Driver',
    difficulty: 'Hard',
    category: 'Malware',
    briefing:
      'A ransomware precursor sample dropped a signed but vulnerable kernel driver (rtcore64.sys, a real ' +
      'driver family repeatedly abused in the wild) immediately before EDR protection on the host went ' +
      'silent. This is BYOVD — "Bring Your Own Vulnerable Driver": rather than exploiting the EDR software ' +
      'directly, an attacker loads their own legitimately-signed-but-vulnerable driver (which Windows will ' +
      'happily load, since it carries a valid signature) and uses that driver\'s own vulnerable ' +
      'functionality to get arbitrary kernel-mode code execution, which is then used to terminate or blind ' +
      'the EDR process from a privilege level the EDR itself cannot defend against. CISA and multiple EDR ' +
      'vendors have published repeated advisories on this exact technique through 2023-2025, and it is now a ' +
      'standard step in several major ransomware playbooks specifically because it is far more reliable than ' +
      'trying to exploit modern, hardened EDR software directly.',
    objectives: [
      { text: 'ls -la ~/', why: 'Confirms what files actually landed on the host in the minutes around the EDR outage — the starting point for any triage.' },
      { text: 'cat ~/loaded-drivers-export.txt', why: 'A newly-loaded, legitimately-signed but unusual driver appearing at the exact moment EDR went silent is the core BYOVD tell — the driver itself is not malware in the traditional sense, which is exactly why signature-based defenses miss it.' },
      { text: 'cat ~/edr-process-log.txt', why: 'Correlating the driver load timestamp against the EDR process termination timestamp is what confirms causation, not just coincidence.' },
      { text: 'Identify the vulnerable driver and capture the flag', why: 'Naming the specific abused driver is what lets defenders add it to a driver blocklist (Microsoft\'s own vulnerable-driver blocklist is the real-world defense here) so the same technique cannot be reused against this same driver family again.' },
    ],
    hints: [
      'ls -la ~/',
      'cat ~/loaded-drivers-export.txt',
      'cat ~/edr-process-log.txt',
      'rtcore64.sys loads one second before the EDR process is killed -- that timing correlation plus the driver name is the flag.',
    ],
    totalFlags: 1,
    attacker: analystBox({
      root: dir({
        'loaded-drivers-export.txt': file(
          [
            '14:22:01  ntoskrnl.exe          (boot driver, expected)',
            '14:22:03  storport.sys           (boot driver, expected)',
            '19:47:12  rtcore64.sys            <-- loaded 19:47:12, NOT present at boot, signed by a legitimate but',
            '                                       unrelated hardware vendor -- a known vulnerable driver (real-world',
            '                                       CVE-tracked arbitrary read/write) repeatedly abused for BYOVD attacks',
            '19:47:19  (no new drivers after this point)',
          ].join('\n'),
          '-rw-r--r--',
        ),
        'edr-process-log.txt': file(
          [
            '19:46:58  edr-agent.exe  status=running   pid=4102',
            '19:47:13  edr-agent.exe  status=TERMINATED pid=4102  terminated_by=kernel-mode-handle (unusual -- normal',
            '                          shutdowns are user-mode/service-initiated, not kernel-privileged terminations)',
            '--- edr-agent.exe termination occurs exactly 1 second after rtcore64.sys loads ---',
            '--- no further EDR telemetry received from this host until manual reimaging ---',
            'flag{byovd_rtcore64_driver_used_to_kill_edr_agent}',
          ].join('\n'),
          '-rw-r--r--',
        ),
      }),
    }),
    network: [],
  },

  // 3 — Bug Bounty: OAuth Device Code Phishing
  {
    id: 'bb-oauth-device-code-phishing',
    title: 'OAuth Device Code Phishing Bypasses MFA Entirely',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'The OAuth 2.0 Device Authorization Grant exists for input-constrained devices (smart TVs, CLI tools) ' +
      'that can\'t open a browser themselves: the device displays a short code and a URL, the user visits ' +
      'that URL on ANY other device and enters the code, and the device receives a valid access token once ' +
      'they do. The phishing abuse: an attacker generates a real, legitimate device code from the real ' +
      'identity provider, then sends the victim a pretext ("join this Teams meeting," "verify your device") ' +
      'containing the real login URL and the real code. The victim completes a completely genuine login flow ' +
      '— correct domain, correct MFA prompt, nothing to visually distinguish it from a real request — and the ' +
      'ATTACKER\'s device silently receives the resulting access token, because the whole point of the flow is ' +
      'that the code-entering device and the token-receiving device are never the same one. This is a real, ' +
      'documented technique (Microsoft Threat Intelligence and Volexity have both published detailed ' +
      'writeups on nation-state-linked campaigns using exactly this method against Microsoft 365 accounts ' +
      'through 2023-2025) specifically valuable to attackers because it bypasses MFA without defeating it — ' +
      'the victim\'s own MFA completes the login legitimately, just for the wrong device.',
    objectives: [
      { text: 'cat device-code-request-log.txt', why: 'Confirms the attacker generated a real, valid device code from the real identity provider before ever contacting the victim -- nothing about the code itself is forged.' },
      {
        text: 'curl -X POST -d "device_code=devc_8f2a1c&user_code=BQPT-7XKL" 10.10.184.2/oauth/token/poll',
        why: 'Polling the token endpoint with the device code is the final step of a completely standard OAuth device flow -- the victim entering the code on the real login page is what authorizes it, and the attacker holding the matching device_code is what lets them redeem it for a token.',
      },
      { text: 'Confirm the victim completed MFA on a request the attacker actually controls, and capture the flag', why: 'This is the entire point of the technique: MFA succeeded, exactly as designed -- it authenticated the wrong session, not a broken one.' },
    ],
    hints: [
      'cat device-code-request-log.txt',
      'curl -X POST -d "device_code=devc_8f2a1c&user_code=BQPT-7XKL" 10.10.184.2/oauth/token/poll',
      'The token endpoint returns a fully valid access token once the victim has completed the real login+MFA flow with that user_code -- from the identity provider\'s perspective, this is a completely legitimate login.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'device-code-request-log.txt': file(
        'Attacker-initiated device authorization request against the real identity provider:\n' +
          'POST /oauth/device/authorize -> device_code=devc_8f2a1c, user_code=BQPT-7XKL, expires_in=900\n' +
          'Verification URL sent to victim via a "Join Teams meeting" pretext email: https://login.corp.example/device\n' +
          'Victim visits the REAL login page, enters user_code BQPT-7XKL, completes password + MFA push -- all genuine.\n',
      ),
    }),
    network: [
      {
        hostname: 'idp-corp',
        ip: '10.10.184.2',
        os: 'Ubuntu 22.04 (OAuth 2.0 identity provider, device authorization grant)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Corp IdP (OAuth 2.0 / OIDC, device authorization grant enabled)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/oauth/token/poll',
                param: 'user_code',
                triggerSubstrings: ['BQPT-7XKL'],
                vulnerableResponse:
                  '{"status":"authorized","access_token":"eyJhbGciOiJSUzI1NiJ9.victim-session-token","account":"victim@corp.example","mfa_completed":true,"note":"flag{oauth_device_code_phishing_bypasses_mfa_via_wrong_device}"}',
                normalResponse: '{"error":"authorization_pending","status":"waiting for user to enter code"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
