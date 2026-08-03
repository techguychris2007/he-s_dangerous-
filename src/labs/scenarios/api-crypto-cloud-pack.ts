import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'malware-lab', user: 'root', root: dir(files) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'review-ws', user: 'root', root: dir(files) };
}

/** Batch 5: API (OAuth audience confusion), Cryptography (ECDSA nonce reuse), Cloud (Lambda env-var
 *  secrets exposure), Malware Analysis (process hollowing detection), Security Engineering (a "removed"
 *  secret still live in git history). Two ideas researched but NOT attempted this batch, flagged in
 *  NOTES.md rather than faked: an S3 cross-account "confused deputy" lab (the engine's aws sts has no
 *  assume-role/ExternalId simulation at all, only get-caller-identity) and VLAN double-tagging (no
 *  Layer-2/802.1Q primitive the curl-based HTTP model can honestly represent). The Lambda lab uses the
 *  same curl-mirrors-the-real-CLI convention already established for SNMP/DNS-AXFR, since the engine's
 *  `aws` command has no `lambda` subcommand to extend safely within this batch's scope. */
export const apiCryptoCloudLabs: LabScenario[] = [
  // 1 — API: OAuth Token Audience Confusion (Confused Deputy)
  {
    id: 'api-oauth-audience-confusion',
    title: 'OAuth Token Audience Confusion Lets a Partner Token Reach the Admin API',
    difficulty: 'Hard',
    category: 'API',
    briefing:
      'Corp-idp61 issues OAuth access tokens for two very different consumers off the same identity ' +
      'provider: a low-privilege partner-integrations API meant only for third-party read access, and an ' +
      'internal admin API meant only for employees. Both APIs trust any token validly signed by corp-idp61 ' +
      '— neither one checks the token\'s "aud" (audience) claim to confirm it was actually issued FOR that ' +
      'specific API. A token legitimately obtained through the partner integration flow (real signature, ' +
      'real issuer, genuinely valid) still decodes with "aud":"partner-api" — but since the admin API never ' +
      'checks that field, presenting the exact same token there is accepted anyway. This is the textbook ' +
      '"confused deputy" pattern: a token doing exactly what it was designed to do, in a context it was ' +
      'never meant to be trusted in at all.',
    objectives: [
      { text: 'nmap -sV 10.10.215.2', why: 'Confirms the admin API before probing whether it actually validates which audience a presented token was issued for.' },
      { text: 'cat partner-oauth-token.txt', why: 'Confirms this is a genuinely valid, correctly-issued token for the partner-integrations flow -- decoding it shows "aud":"partner-api", not "aud":"admin-api".' },
      {
        text: 'curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJwYXJ0bmVyLWFwaSIsInN1YiI6InBhcnRuZXJfYWNtZSJ9.validsig" http://10.10.215.2/admin/export',
        why: 'The admin API validates the signature (genuinely valid, since corp-idp61 really did sign this token) and stops there -- it never checks that the "aud" claim inside says "partner-api", not "admin-api", which is the entire point of the audience claim existing at all.',
      },
    ],
    hints: [
      'nmap -sV 10.10.215.2',
      'cat partner-oauth-token.txt',
      'The admin API checks the token signature but never checks the "aud" claim -- a validly-signed token for a completely different API still gets accepted here.',
      'curl -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJwYXJ0bmVyLWFwaSIsInN1YiI6InBhcnRuZXJfYWNtZSJ9.validsig" http://10.10.215.2/admin/export',
    ],
    totalFlags: 1,
    attacker: attacker({
      'partner-oauth-token.txt': file(
        'Decoded partner-integrations OAuth token (obtained legitimately via the real partner OAuth flow):\n' +
          '  header:  {"alg":"RS256"}\n' +
          '  payload: {"aud":"partner-api","sub":"partner_acme","scope":"read:catalog"}\n' +
          '  signature: genuinely valid, signed by corp-idp61 -- nothing forged about this token at all\n' +
          '  -- this token was never meant to be presentable to any API other than partner-api --\n',
      ),
    }),
    network: [
      {
        hostname: 'adminapi-corp61',
        ip: '10.10.215.2',
        os: 'Ubuntu 22.04 (internal admin API, shared IdP with the partner API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, validates signature only, no audience check)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin/export',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['eyjhbgcioijsuzi1nij9.eyjhdwqioijwyxj0bmvylwfwasisinn1yii6inbhcnruzxjfywntzsj9.validsig'],
                vulnerableResponse: '{"status":200,"export":"full_customer_database","note":"flag{oauth_audience_confusion_partner_token_reaches_admin_api}"}',
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

  // 2 — Cryptography: ECDSA Nonce Reuse Leaks the Private Key
  {
    id: 'crypto-ecdsa-nonce-reuse-key-recovery',
    title: 'ECDSA Nonce Reuse Leaks the Signing Private Key',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'Firmwaresvc93 signs firmware updates with ECDSA — but its signing routine was implemented with a ' +
      'fixed, hardcoded nonce (k value) instead of generating a fresh cryptographically random one for ' +
      'every signature, the exact real-world mistake behind the infamous 2010 Sony PlayStation 3 firmware ' +
      'signing key recovery. ECDSA is mathematically sound only as long as its per-signature nonce is both ' +
      'random AND never reused — reuse it across two different signed messages under the same key, and the ' +
      'nonce (and from it, the entire private key) can be recovered through straightforward algebra alone, ' +
      'no brute force or cryptographic breakthrough required.',
    objectives: [
      { text: 'nmap -sV 10.10.216.2', why: 'Confirms the firmware-signing service before analyzing its ECDSA signature material.' },
      { text: 'cat captured-firmware-signatures.txt', why: 'Two different, legitimately captured firmware update signatures under the same signing key are exactly the raw material an ECDSA nonce-reuse recovery needs.' },
      { text: 'cat nonce-reuse-analysis.txt', why: 'Confirms both signatures share the same "r" value -- the unmistakable signature-level fingerprint of nonce reuse -- and walks through the algebraic recovery that follows from it.' },
      {
        text: 'curl -X POST -d "recovered_private_key=7f3a91e8c02b4471" http://10.10.216.2/firmware/sign-malicious-update',
        why: 'Submitting the algebraically-recovered private key to sign a new, attacker-chosen firmware image proves the recovery is real and complete -- the service now accepts a signature it never actually produced itself.',
      },
    ],
    hints: [
      'nmap -sV 10.10.216.2',
      'cat captured-firmware-signatures.txt',
      'cat nonce-reuse-analysis.txt',
      'curl -X POST -d "recovered_private_key=7f3a91e8c02b4471" http://10.10.216.2/firmware/sign-malicious-update',
    ],
    totalFlags: 1,
    attacker: attacker({
      'captured-firmware-signatures.txt': file(
        'Two firmware update signatures captured from firmwaresvc93 (same signing key, different updates):\n' +
          '  Update A: message=fw-v2.1.bin  signature=(r=4a3f91b8..., s=8e2c1d67...)\n' +
          '  Update B: message=fw-v2.2.bin  signature=(r=4a3f91b8..., s=c91a5f02...)\n' +
          '  -- notice: BOTH signatures share the identical "r" component --\n',
      ),
      'nonce-reuse-analysis.txt': file(
        'ECDSA nonce-reuse analysis:\n' +
          '  An identical "r" value across two different signed messages under the same key means the same\n' +
          '  nonce k was used for both -- this is the exact real mistake behind the 2010 Sony PS3 firmware\n' +
          '  signing key recovery (Sony used a CONSTANT k for every signature, not merely an unlucky repeat).\n' +
          '  Given two signatures (r, s1) and (r, s2) over known messages m1, m2 with the same k:\n' +
          '    k = (m1 - m2) / (s1 - s2) mod n\n' +
          '    private_key = (s1 * k - m1) / r mod n\n' +
          '  Working through both equations with the captured values above recovers:\n' +
          '    private_key = 7f3a91e8c02b4471\n',
      ),
    }),
    network: [
      {
        hostname: 'firmwaresvc93',
        ip: '10.10.216.2',
        os: 'Ubuntu 22.04 (firmware update signing service, ECDSA fixed-nonce bug)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, ecdsa library, hardcoded k value)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/firmware/sign-malicious-update',
                param: 'recovered_private_key',
                triggerSubstrings: ['7f3a91e8c02b4471'],
                vulnerableResponse: '{"status":"signed","update":"fw-malicious-v2.3.bin","note":"flag{ecdsa_nonce_reuse_private_key_recovered_algebraically}"}',
                normalResponse: '{"error":"invalid private key -- signature verification would fail"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Cloud: Lambda Environment Variables Leak Plaintext Secrets
  {
    id: 'cloud-lambda-env-secrets-exposure',
    title: 'Cloud: Lambda Function Configuration API Leaks Plaintext Secrets',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A read-only auditing role was granted broad "ViewOnlyAccess"-style permissions across the AWS ' +
      'account, including lambda:GetFunctionConfiguration — a permission that sounds harmless (it only ' +
      '"views configuration") but AWS automatically decrypts and returns a function\'s environment variables ' +
      'in full plaintext through that exact API call. A database password stored directly as a Lambda ' +
      'environment variable, instead of in a real secrets manager, is fully readable by anyone holding this ' +
      'single, commonly-granted read-only permission — the credential was never actually protected by ' +
      '"encryption at rest" in any way that mattered, because the API that reveals it requires no special ' +
      'decrypt permission at all.',
    objectives: [
      { text: 'nmap -sV 10.10.217.2', why: 'Confirms the Lambda control-plane API before probing what a read-only auditing credential can actually see through it.' },
      { text: 'cat readonly-role-permissions.txt', why: 'Confirms the held credential genuinely has ONLY read-only/view permissions, not any explicit "decrypt secrets" grant -- setting up why the following step is surprising.' },
      {
        text: 'curl "http://10.10.217.2/2015-03-31/functions/billing-processor/configuration"',
        why: 'This mirrors the real AWS API call behind `aws lambda get-function-configuration --function-name billing-processor` -- a request that requires only the broadly-granted GetFunctionConfiguration permission, yet returns every environment variable in fully decrypted plaintext, database password included.',
      },
    ],
    hints: [
      'nmap -sV 10.10.217.2',
      'cat readonly-role-permissions.txt',
      'curl "http://10.10.217.2/2015-03-31/functions/billing-processor/configuration" -- mirrors aws lambda get-function-configuration.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'readonly-role-permissions.txt': file(
        'IAM policy attached to the held credential (audit-readonly-role):\n' +
          '  lambda:GetFunction\n' +
          '  lambda:GetFunctionConfiguration\n' +
          '  lambda:ListFunctions\n' +
          '  -- part of a standard "ViewOnlyAccess"-style managed policy -- no explicit secrets-manager\n' +
          '     or KMS decrypt permission granted anywhere in this role --\n',
      ),
    }),
    network: [
      {
        hostname: 'lambda-control-plane',
        ip: '10.10.217.2',
        os: 'Cloud API endpoint (Lambda control plane, function configuration)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'AWS Lambda API (function configuration, environment variables encrypted at rest only)',
            http: {
              '/2015-03-31/functions/billing-processor/configuration':
                '{"FunctionName":"billing-processor","Environment":{"Variables":{"DB_HOST":"prod-billing-db.internal","DB_USER":"billing_svc","DB_PASSWORD":"Pr0d_B1lling_2026!"}},"note":"flag{lambda_getfunctionconfiguration_leaks_plaintext_env_secrets}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — Malware Analysis: Process Hollowing Detection
  {
    id: 'malware-process-hollowing-peb-mismatch',
    title: 'Malware Analysis: Detecting Process Hollowing via PEB/Image Mismatch',
    difficulty: 'Hard',
    category: 'Malware',
    briefing:
      'A memory capture from a compromised host shows a running svchost.exe process — completely normal on ' +
      'its own, since dozens of legitimate svchost.exe instances run on any Windows system at once. Process ' +
      'hollowing is what makes this one different: malware started a real, legitimate svchost.exe in a ' +
      'suspended state, then used ZwUnmapViewOfSection to unmap its original, legitimate code from memory ' +
      'and replaced it with a malicious payload before resuming execution — the process\'s name, PID, and ' +
      'on-disk path all still say "svchost.exe" throughout, but the code actually executing in memory is ' +
      'not what that binary on disk contains at all. Comparing the process\'s in-memory image against its ' +
      'own on-disk file is the direct way to catch this exact discrepancy.',
    objectives: [
      { text: 'cat process-list.txt', why: 'Establishes the full set of running processes first -- a hollowed process gives no outward sign in a basic process listing at all, which is exactly the point.' },
      { text: 'cat peb-vad-comparison.txt', why: 'Comparing the PEB (which still reports the legitimate on-disk path) against the VAD memory region type is the real, documented process-hollowing tell: a legitimate module should be backed by an Image-type VAD region, not Private.' },
      { text: 'Identify the specific PID with the PEB/VAD mismatch and capture the flag', why: 'Naming the exact hollowed PID is what turns "something looks off in this memory dump" into an actionable finding an incident responder can isolate and act on.' },
    ],
    hints: [
      'cat process-list.txt',
      'cat peb-vad-comparison.txt',
      'One PID reports a legitimate on-disk path in its PEB, but its main-module VAD region is marked Private instead of Image -- that mismatch is the flag.',
    ],
    totalFlags: 1,
    attacker: analystBox({
      root: dir({
        'process-list.txt': file(
          [
            'PID   Name          Path',
            '812   svchost.exe   C:\\Windows\\System32\\svchost.exe',
            '944   svchost.exe   C:\\Windows\\System32\\svchost.exe',
            '1288  svchost.exe   C:\\Windows\\System32\\svchost.exe   <-- flagged for deeper review below',
            '2004  explorer.exe  C:\\Windows\\explorer.exe',
          ].join('\n'),
          '-rw-r--r--',
        ),
        'peb-vad-comparison.txt': file(
          [
            'PEB vs VAD comparison (Volatility-style analysis) for each svchost.exe instance:',
            '',
            'PID 812:  PEB ImageBaseAddress -> VAD region type: Image   (matches -- legitimate)',
            'PID 944:  PEB ImageBaseAddress -> VAD region type: Image   (matches -- legitimate)',
            'PID 1288: PEB ImageBaseAddress -> VAD region type: Private (MISMATCH -- ZwUnmapViewOfSection',
            '          destroyed the original section mapping; PEB still reports the legitimate on-disk',
            '          path, but the executing code is no longer backed by that file at all)',
            '',
            '--- PID 1288 is a hollowed process -- legitimate svchost.exe hosting a malicious payload ---',
            'flag{process_hollowing_detected_via_peb_vad_image_mismatch}',
          ].join('\n'),
          '-rw-r--r--',
        ),
      }),
    }),
    network: [],
  },

  // 5 — Security Engineering: A "Removed" Secret Still Live in Git History
  {
    id: 'secengineering-secret-in-git-history',
    title: "Security Engineering: A \"Removed\" Secret That's Still Live in Git History",
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'A code review flags a config file that currently looks clean — no hardcoded credentials anywhere in ' +
      'the file as it exists today. But a repository\'s history is not the same thing as its current state: ' +
      'an earlier commit hardcoded a real database password directly into that same file, and a LATER ' +
      'commit "fixed" it by replacing the value with an environment-variable reference — without ever ' +
      'realizing that git preserves every prior version by design. The original plaintext password is still ' +
      'sitting, fully readable, in the repository\'s commit history, reachable by anyone with clone access, ' +
      'completely unaffected by the fact that the CURRENT file looks perfectly clean. This is one of the ' +
      'single most common real secret-leak root causes: treating "I edited the file" as equivalent to ' +
      '"the secret is gone."',
    objectives: [
      { text: 'cat current-config.txt', why: 'Confirms the file as it exists RIGHT NOW is genuinely clean -- establishing exactly why this is easy for a reviewer to miss without checking history.' },
      { text: 'cat git-log-config-file.txt', why: 'Reviewing the full commit history for this one file (git log -p --follow, conceptually) is what a thorough secret-scanning review actually requires -- not just reading the file\'s current content.' },
      { text: 'Identify the exact commit that introduced the plaintext password and capture the flag', why: 'Naming the specific commit and the leaked value is what turns "there might be a secret in history somewhere" into an actionable remediation: that credential must be rotated, not just re-hidden -- removing it from history alone does not undo the fact that it was already exposed.' },
    ],
    hints: [
      'cat current-config.txt',
      'cat git-log-config-file.txt',
      'An earlier commit hardcoded the real password in plaintext; a later commit replaced it with an env-var reference but never rotated the credential itself -- the flag is on that earlier commit\'s diff.',
    ],
    totalFlags: 1,
    attacker: reviewer({
      root: dir({
        'current-config.txt': file(
          'config/database.yml (current HEAD -- looks clean):\n' +
            'production:\n' +
            '  host: prod-db.internal\n' +
            '  username: app_service\n' +
            '  password: <%= ENV["DATABASE_PASSWORD"] %>\n',
        ),
        'git-log-config-file.txt': file(
          [
            'commit 9a2f1e8 (HEAD) "Move DB password to environment variable"',
            '  - password: "Cr0wnJewel_Prod_2024!"',
            '  + password: <%= ENV["DATABASE_PASSWORD"] %>',
            '',
            'commit 5c81b04 "Add production database config"',
            '  + production:',
            '  +   host: prod-db.internal',
            '  +   username: app_service',
            '  +   password: "Cr0wnJewel_Prod_2024!"   <-- plaintext password committed here, still fully',
            '                                              readable in this commit forever, regardless of',
            '                                              the later "fix" in 9a2f1e8',
            '',
            '--- ANALYST NOTE: commit 5c81b04 is reachable by anyone with clone access to this repo --',
            '    the credential was exposed the moment this commit was pushed and remains exposed today,',
            '    completely independent of what the CURRENT file looks like. Remediation requires rotating',
            '    the actual database password, not merely rewriting history.',
            '    flag{secret_still_live_in_git_history_despite_later_removal} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
