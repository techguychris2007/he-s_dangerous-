import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

export const secEngineeringAdvancedLabs: LabScenario[] = [
  {
    id: 'secengineering-padding-oracle',
    title: 'Security Engineering: CBC Padding Oracle Attack',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A legacy API (10.10.112.1) decrypts an AES-CBC encrypted session token and returns a distinctly ' +
      'different error message depending on whether the PKCS#7 padding was valid — the exact design flaw ' +
      'behind real padding oracle attacks (the class of vulnerability that broke early SSL/TLS CBC modes). ' +
      'Confirm the oracle exists, then use the known-correct padding value to decrypt the token.',
    objectives: [
      { text: 'Send a tampered token and observe the "padding error" response', why: 'This confirms the server leaks a distinguishable signal for invalid padding — the single design mistake a padding oracle attack depends on entirely.' },
      { text: 'Send a token with valid padding but invalid content and compare the error message', why: 'A real attacker automates this comparison across every byte position to decrypt the token one byte at a time without ever knowing the key — confirming the two distinct error paths is the proof-of-concept step.' },
      { text: 'Submit the pre-computed correctly-padded recovery token to fully decrypt it and capture the flag', why: 'This mirrors the final step of a real padding oracle exploit (as automated by tools like PadBuster): once every byte is recovered, the full plaintext is revealed with zero knowledge of the encryption key.' },
    ],
    hints: [
      'curl "http://10.10.112.1/session?token=tampered_bad_padding"',
      'curl "http://10.10.112.1/session?token=valid_padding_wrong_content"',
      'curl "http://10.10.112.1/session?token=recovered_via_oracle"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-api', ip: '10.10.112.1', os: 'Ubuntu 18.04 (legacy Java session API)',
        services: [{
          port: 80, name: 'http', version: 'Apache Tomcat 8.5 (custom AES-CBC session handler)',
          http: {},
          vulnRoutes: [{
            kind: 'auth-bypass', path: '/session', param: 'token',
            triggerSubstrings: ['recovered_via_oracle'],
            vulnerableResponse: '{"status":"decrypted","session_data":{"user":"admin","role":"superuser"},"flag":"flag{padding_oracle_decrypts_without_the_key}"}',
            normalResponse: '{"error":"padding_error: invalid PKCS7 padding"}',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'secengineering-insecure-deserialization',
    title: 'Security Engineering: Insecure Deserialization RCE',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'An internal HR portal (10.10.112.2) stores user preferences as a serialized object in a cookie and ' +
      'deserializes it directly on every request with no integrity check — the exact design failure behind ' +
      'real-world Java/PHP deserialization RCE chains. Submit a gadget-chain-shaped payload to trigger code ' +
      'execution during deserialization.',
    objectives: [
      { text: 'Send a normal request and observe the preferences cookie being trusted as-is', why: 'Confirming the server deserializes client-supplied data with no signature/integrity check is the entire vulnerability — everything after this is just constructing the right payload.' },
      { text: 'Submit a serialized gadget-chain payload in the cookie', why: 'Real deserialization exploits (like the ysoserial tool generates for Java) don\'t inject new code — they chain together classes ALREADY present on the server that have dangerous side effects when their methods run during deserialization.' },
      { text: 'Confirm code execution and capture the flag', why: 'This is exactly the technique behind several major real-world Java application server compromises — the fix is never deserializing untrusted data directly, or signing it so tampering is detected before deserialization even begins.' },
    ],
    hints: [
      'curl -H "Cookie: prefs=normal_base64_value" 10.10.112.2/dashboard',
      `curl -H "Cookie: prefs=rO0ABXNyAB..._gadget_chain_payload" 10.10.112.2/dashboard`,
      'The exact trigger string for this lab is: gadget_chain_payload',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'hr-portal', ip: '10.10.112.2', os: 'Ubuntu 20.04 (Java/Spring, custom cookie deserializer)',
        services: [{
          port: 80, name: 'http', version: 'Apache Tomcat 9.0',
          http: { '/dashboard': '<html><body><h1>HR Portal</h1></body></html>' },
          vulnRoutes: [{
            kind: 'ssrf', path: '/dashboard', param: 'cookie', location: 'header',
            triggerSubstrings: ['gadget_chain_payload'],
            vulnerableResponse: '<html><body><h1>HR Portal</h1><p>Deserialization gadget chain executed — remote command execution confirmed.</p><p>flag{insecure_deserialization_gadget_chain_rce}</p></body></html>',
            normalResponse: '<html><body><h1>HR Portal</h1><p>Preferences loaded normally.</p></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'secengineering-timing-side-channel',
    title: 'Security Engineering: Timing Side-Channel Analysis',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A login endpoint compares the submitted API key against the stored value character-by-character and ' +
      'returns as soon as it finds a mismatch — a naive string comparison instead of a constant-time one. ' +
      'A colleague already measured response times for each first-character guess. Analyze the timing data ' +
      'to recover the key one character at a time, exactly as a real timing-attack tool would automate.',
    objectives: [
      { text: 'Review the captured timing measurements for each character guess', why: 'A constant-time comparison should show no measurable timing difference between a correct and incorrect first character — this dataset shows the flawed implementation actually leaks that difference.' },
      { text: 'Identify the character with the measurably longer response time at each position', why: 'A naive comparison exits immediately on the first mismatched character — a correct character takes fractionally longer because comparison continues to the next position, which is exactly the leak a timing attack automates and measures statistically over thousands of requests to filter out network noise.' },
      { text: 'Reconstruct the full API key from the slowest response at each position and capture the flag', why: 'This is conceptually identical to how real early-return string comparison bugs (found in several real authentication libraries over the years) have been exploited to fully recover secrets without ever guessing correctly in a single request.' },
    ],
    hints: [
      'cat ~/timing-measurements.txt',
      'At each character position, the correct guess takes measurably longer (more comparison steps executed) than every incorrect guess.',
      'Read the position-by-position winning character to spell out the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'timing-measurements.txt': file(
        [
          'Position 1: a=12ms b=11ms c=13ms d=41ms(SLOWEST) e=12ms  -> correct char: d',
          'Position 2: a=11ms b=39ms(SLOWEST) c=12ms d=13ms e=11ms  -> correct char: b',
          'Position 3: a=40ms(SLOWEST) b=12ms c=11ms d=13ms e=12ms  -> correct char: a',
          '--- reconstructing the key from slowest-response characters at each position ---',
          '--- full recovered key spells: flag{timing_side_channel_recovers_secret_without_guessing} ---',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'secengineering-insecure-defaults-sweep',
    title: 'Security Engineering: Insecure Defaults at Scale',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'An IoT vendor shipped every unit with the identical factory default admin password — a textbook ' +
      'violation of the "secure defaults" design principle, and the exact root cause behind real-world IoT ' +
      'botnets like Mirai. Sweep the deployed device subnet to confirm how many units never had the default ' +
      'changed.',
    objectives: [
      { text: 'Sweep 10.10.112.10-13 with crackmapexec using the known factory default credential', why: 'A single, unchanging default credential shipped across an entire product line turns one leaked password into a mass-compromise vector — exactly how Mirai and similar IoT botnets scaled to hundreds of thousands of devices.' },
      { text: 'Identify which devices still use the factory default', why: 'A design that makes changing the default the customer\'s optional responsibility guarantees a large fraction never will — the "secure by default" principle exists specifically to remove that choice.' },
      { text: 'Capture the flag from the device that never had its credential rotated', why: 'This is the core lesson of the Secure Design Principles module applied concretely: defaults are what most real deployments actually run in production, not the hardened configuration in the vendor\'s documentation.' },
    ],
    hints: [
      'crackmapexec smb 10.10.112.10 -u admin -p admin1234',
      'crackmapexec smb 10.10.112.11 -u admin -p admin1234',
      'crackmapexec smb 10.10.112.12 -u admin -p admin1234',
      'crackmapexec smb 10.10.112.13 -u admin -p admin1234',
      'One of these four still accepts the untouched factory default — ssh into it once confirmed.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      { hostname: 'iot-cam-10', ip: '10.10.112.10', os: 'Embedded Linux', services: [{ port: 445, name: 'microsoft-ds', version: 'Samba (embedded)' }], users: [{ username: 'admin', password: 'CustomRotated_2026!' }], root: dir({}) } as HostDef,
      { hostname: 'iot-cam-11', ip: '10.10.112.11', os: 'Embedded Linux', services: [{ port: 445, name: 'microsoft-ds', version: 'Samba (embedded)' }], users: [{ username: 'admin', password: 'AnotherRotated!99' }], root: dir({}) } as HostDef,
      {
        hostname: 'iot-cam-12', ip: '10.10.112.12', os: 'Embedded Linux',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'Samba (embedded)' },
          { port: 22, name: 'ssh', version: 'Dropbear sshd 2019.78' },
        ],
        users: [{ username: 'admin', password: 'admin1234' }],
        root: dir({ home: dir({ admin: dir({ 'user.txt': file('Factory default credential never rotated on this unit.\nflag{factory_default_credential_never_rotated}\n') }) }) }),
      } as HostDef,
      { hostname: 'iot-cam-13', ip: '10.10.112.13', os: 'Embedded Linux', services: [{ port: 445, name: 'microsoft-ds', version: 'Samba (embedded)' }], users: [{ username: 'admin', password: 'Fleet_Managed_Pw3!' }], root: dir({}) } as HostDef,
    ],
  },
  {
    id: 'secengineering-single-point-of-failure',
    title: 'Security Engineering: Single Point of Failure Discovery',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'The primary database for a critical service is down. The architecture diagram claims a hot standby ' +
      'exists, but nobody remembers where it is or whether it was ever actually configured for failover — a ' +
      'real and extremely common resilience-design failure: redundancy that exists on paper but was never ' +
      'validated in practice.',
    objectives: [
      { text: 'Confirm the primary database host is unreachable', why: 'Establishing the outage is real (not a false alarm) is the first step of any incident response, resilience-focused or otherwise.' },
      { text: 'Scan the surrounding subnet for an undocumented standby host', why: '"We have redundancy" that was never tested or documented is functionally the same as having none — this step simulates exactly the scramble that happens during a real untested-failover incident.' },
      { text: 'Confirm the standby is reachable and capture the flag', why: 'A resilient architecture requires failover to be tested regularly, not just declared in a diagram — this lab makes that gap concrete rather than theoretical.' },
    ],
    hints: [
      'ping 10.10.112.20   (the documented primary — it is down)',
      'nmap -sn 10.10.112.16/28   to sweep the surrounding range for anything else alive',
      'ssh into whatever standby host you find, using the shared ops password: Standby_Ops_2026!',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'db-standby-undocumented', ip: '10.10.112.21', os: 'Ubuntu 22.04',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' }],
        users: [{ username: 'ops', password: 'Standby_Ops_2026!' }],
        root: dir({ home: dir({ ops: dir({ 'user.txt': file('Undocumented standby found and reachable — redundancy that was never validated is not real redundancy.\nflag{undocumented_standby_never_validated}\n') }) }) }),
      } as HostDef,
    ],
  },
  {
    id: 'secengineering-payment-api-threat-model',
    title: 'Security Engineering: Payment API Threat Model Review',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A new payment processing API is scheduled to launch next week. Apply STRIDE to its design document ' +
      'and identify the one threat category the design document never actually addresses — exactly the kind ' +
      'of gap a real pre-launch threat modeling review exists to catch.',
    objectives: [
      { text: 'Review the payment API design document', why: 'A structured design doc review is what a real threat modeling session works from — you cannot model threats against a system you have not read carefully.' },
      { text: 'Map each STRIDE category against what the document actually covers', why: 'STRIDE\'s value is in forcing systematic coverage — teams naturally think hard about the threats they already expect (like Spoofing/Tampering) and skip the ones they don\'t (frequently Repudiation and Denial of Service).' },
      { text: 'Identify the STRIDE category left completely unaddressed and capture the flag', why: 'A payment API with no non-repudiation logging (no way to prove which authenticated party initiated a given transaction) is a real and serious gap — disputes become unresolvable and fraud becomes deniable.' },
    ],
    hints: [
      'cat ~/payment-api-design-doc.txt',
      'Check each STRIDE letter against the document section by section: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.',
      'One category has zero corresponding control mentioned anywhere in the document.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'payment-api-design-doc.txt': file(
        [
          'Payment Processing API — Design Document v1.2',
          '',
          'Authentication: mTLS client certificates for all partner integrations (addresses Spoofing)',
          'Integrity: HMAC-signed request bodies, rejected on mismatch (addresses Tampering)',
          'Confidentiality: TLS 1.3 in transit, AES-256 at rest (addresses Information Disclosure)',
          'Availability: Auto-scaling group behind a load balancer, rate limiting per API key (addresses Denial of Service)',
          'Authorization: Scoped API keys per partner, least-privilege IAM roles (addresses Elevation of Privilege)',
          '',
          'NOTE FOR REVIEWERS: no section of this document describes transaction-level audit logging tied to',
          'the authenticated identity that initiated each request — Repudiation is not addressed anywhere.',
          'flag{stride_repudiation_category_left_completely_unaddressed}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'secengineering-dependency-confusion',
    title: 'Security Engineering: Dependency Confusion Supply Chain Attack',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'A build system resolves an internal package name from public package registries whenever no explicit ' +
      'internal registry is configured for it — the exact real-world "dependency confusion" attack class that ' +
      'compromised internal builds at several major companies once researchers demonstrated it publicly. ' +
      'Confirm the internal package name and then check whether an attacker-published public package with ' +
      'that same name would win dependency resolution.',
    objectives: [
      { text: 'Review the build configuration for internal package references', why: 'Dependency confusion exploits internal package NAMES that are guessable or leaked (often from public job postings, GitHub, or error messages) — you first need the exact name being resolved.' },
      { text: 'Query the public package registry for that same package name', why: 'If a build system checks public registries at all for a name that should only ever resolve internally, and picks whichever version number is HIGHER, an attacker can publish a public package with an inflated version number and win automatically.' },
      { text: 'Confirm the attacker-controlled version would be installed and capture the flag', why: 'This is precisely the mechanism that made dependency confusion attacks so effective — no compromise of internal infrastructure needed at all, just publishing a public package with the right name and a higher version number.' },
    ],
    hints: [
      'cat ~/build-config.txt',
      'curl "http://10.10.112.30/registry/internal-auth-utils"',
      'The public registry has version 9.9.9 of a package with the exact same internal name — compare it against the internal version.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'build-config.txt': file(
        'dependencies:\n  internal-auth-utils: "^1.2.0"   # internal package, no scoped/private registry configured\n' +
          '  express: "^4.18.0"\n' +
          'registry resolution order: [public-npm-registry, internal-registry]  <- public checked FIRST, higher version always wins\n',
      ),
    }),
    network: [
      {
        hostname: 'public-registry-mirror', ip: '10.10.112.30', os: 'Public package registry (simulated)',
        services: [{
          port: 80, name: 'http', version: 'npm registry API',
          http: {
            '/registry/internal-auth-utils': '{"name":"internal-auth-utils","versions":{"1.2.0":"legit internal version","9.9.9":"attacker-published — will win resolution due to higher version number"},"latest":"9.9.9","flag":"flag{dependency_confusion_public_package_wins_resolution}"}',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
];
