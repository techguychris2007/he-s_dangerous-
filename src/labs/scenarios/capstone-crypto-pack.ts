import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Cryptography module capstone: one continuous five-flag chain from a cracked JWT signing secret,
 *  through a forged-admin-token vault export, an AES-CBC static-IV analysis, to a weak/factorable RSA
 *  modulus and the final decryption it enables — four genuinely different real cryptographic weakness
 *  classes in one narrative instead of four isolated labs. The JWT crack and forgery reuse this
 *  platform's already-established hashcat -m 16500 + curl+vulnRoutes mechanic; the AES-IV and RSA
 *  factorization steps present already-completed analysis (small, explicitly toy-sized values, the same
 *  convention this platform's other RSA-attack labs already use), since the underlying math is
 *  independently real but not something this in-browser engine computes live. */
export const cryptoCapstoneLabs: LabScenario[] = [
  {
    id: 'crypto-capstone-jwt-crack-to-rsa-factorization-vault-decrypt',
    title: 'Capstone: Cracked JWT to Factored RSA Key to Full Vault Decryption',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      "VaultKeep's internal secrets-management API chains four separate cryptographic weaknesses into one " +
      'full compromise: a JWT signed with a short, crackable secret; an admin export endpoint that trusts a ' +
      'forged token; an AES-CBC encryption scheme that reused the same IV across two messages (immediately ' +
      'leaking the XOR of both plaintexts); and, buried in the exported vault, an RSA-encrypted master key ' +
      'whose modulus turns out to be trivially factorable. None of these four bugs is exotic — each is a ' +
      'real, well-documented weakness class on its own. Chained together, they unlock the entire vault.',
    objectives: [
      { text: 'hashcat -m 16500 jwt-secret.hash wordlists/common-jwt-secrets.txt and capture the first flag', why: 'Mode 16500 cracks a JWT\'s HS256 signing secret entirely offline — recovering it means you can now sign your own tokens with any claims you want.' },
      { text: 'curl -H "Authorization: Bearer forged.hs256.cryptovault2024-signed-role-admin" http://10.10.260.5/admin/vault/export and capture the second flag', why: 'The forged admin token authenticates as though it were genuinely issued — this is what actually exposes the encrypted vault contents.' },
      { text: 'cat iv-reuse-analysis.txt and capture the third flag', why: 'AES-CBC with a reused IV leaks the XOR of the two plaintexts the instant both ciphertexts are compared — a classic, real weakness class (the exact mechanism behind several real disclosed vulnerabilities), not a theoretical concern.' },
      { text: 'cat weak-rsa-modulus-factored.txt and capture the fourth flag', why: 'An RSA modulus generated from two primes that are too close together (or otherwise poorly chosen) is factorable by classical methods far faster than brute force — recovering the private key entirely from the public modulus alone.' },
      { text: 'cat final-vault-secret-decrypted.txt and capture the final flag', why: 'This is the actual endpoint of the chain: the recovered RSA private key decrypts the vault\'s master secret, the payload every earlier step existed to reach.' },
    ],
    hints: [
      'cat captured-jwt-info.txt',
      'hashcat -m 16500 jwt-secret.hash wordlists/common-jwt-secrets.txt',
      'curl -H "Authorization: Bearer forged.hs256.cryptovault2024-signed-role-admin" http://10.10.260.5/admin/vault/export',
      'cat iv-reuse-analysis.txt',
      'cat weak-rsa-modulus-factored.txt',
      'cat final-vault-secret-decrypted.txt',
    ],
    totalFlags: 5,
    attacker: attacker({
      'captured-jwt-info.txt': file(
        'Intercepted Authorization header from a normal VaultKeep API request:\n' +
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.4a9pXz...\n' +
          'Algorithm: HS256 — same secret both signs and verifies every token this service issues.\n',
      ),
      'jwt-secret.hash': file(
        '#HASHCAT_HASH:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.4a9pXz\n' +
          '#HASHCAT_PLAINTEXT:cryptovault2024\n' +
          '#HASHCAT_FLAG:flag{jwt_hs256_secret_cracked_offline_wordlist_attack}\n',
      ),
      wordlists: dir({ 'common-jwt-secrets.txt': file('secret\nchangeme\njwtsecret\ncryptovault2024\nsupersecret\n') }),
      'iv-reuse-analysis.txt': file(
        [
          '--- AES-CBC static-IV analysis, two intercepted vault messages encrypted with the same key+IV ---',
          'C1 = AES-CBC-Encrypt(IV, K, "transfer:acct-4471:$500")',
          'C2 = AES-CBC-Encrypt(IV, K, "transfer:acct-9982:$5000000")   <-- same IV reused',
          'C1[block0] XOR C2[block0] = P1[block0] XOR P2[block0]   <-- the IV cancels out entirely',
          'Knowing P1 (a known-plaintext transaction format) recovers P2 directly, with zero knowledge of K or the real IV',
          '--- reused IVs turn CBC mode into a plaintext-recovery oracle the instant two ciphertexts are compared ---',
          'flag{aes_cbc_static_iv_reuse_leaks_plaintext_via_known_plaintext_xor}',
          '',
        ].join('\n'),
      ),
      'weak-rsa-modulus-factored.txt': file(
        [
          '--- RSA public key recovered from the vault export, factored offline (Fermat\'s method — the two primes were generated too close together) ---',
          'n = 100160063            (toy-sized modulus for this exercise — real RSA uses 2048+ bit moduli; independently verified with real BigInt arithmetic)',
          'p = 10007, q = 10009     (recovered factors — p and q differ by only 2, far inside Fermat factorization range)',
          'e = 65537',
          'd = 35910881             (recovered private exponent: the modular inverse of e mod (p-1)(q-1), confirmed e*d mod phi(n) = 1)',
          '--- once n is factored, the "public-key" half of RSA provides no security at all — d follows directly ---',
          'flag{rsa_modulus_factored_via_close_primes_fermat_method}',
          '',
        ].join('\n'),
      ),
      'final-vault-secret-decrypted.txt': file(
        [
          '--- vault master secret, RSA-decrypted using the recovered private key d=35910881 ---',
          'MASTER_SECRET=VK-MASTER-88213-ROOT-OF-TRUST',
          '--- full chain complete: cracked JWT -> forged admin token -> vault export -> IV-reuse plaintext',
          '    recovery -> factored RSA modulus -> master secret decrypted ---',
          'flag{full_crypto_chain_ends_in_vault_master_secret_decryption}',
          '',
        ].join('\n'),
      ),
    }),
    network: [
      {
        hostname: 'vaultkeep-api',
        ip: '10.10.260.5',
        os: 'Ubuntu 22.04 (secrets-management API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (VaultKeep API, JWT HS256)',
            http: {},
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/vault/export',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['cryptovault2024-signed-role-admin'],
                vulnerableResponse:
                  '{"status":"export_complete","note":"two AES-CBC messages exported with a reused IV, plus an RSA-encrypted master secret","flag":"flag{forged_admin_jwt_exposes_encrypted_vault_export}"}',
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
