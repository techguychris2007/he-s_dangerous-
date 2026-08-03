import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';
import { makePrivescLab } from './linux-privesc-pack';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 14, built against an explicit "everything should be real" request. Every lab this time uses ONLY
 *  this engine's genuinely live, mechanically-real command handlers -- nmap, exploit, gobuster, curl, sqlmap,
 *  ssh/hydra/sudo -- with none of the "cat a captured-recon-file standing in for a command this engine can't
 *  run live" pattern used for a few labs in recent batches (Azure CLI, LDAP, crt.sh). Two labs reuse the
 *  `exploit <module> <ip>` mechanic already proven identical across this platform's ~13 existing CVE-RCE
 *  labs; one reuses the ssh-foothold-and-privesc factory already proven live twice. See NOTES.md batch 14
 *  for why one lab (SOC Golden Ticket detection) is legitimately real as a `cat`-based log review — that IS
 *  the actual, real workflow for that job function, not a simulation shortcut. */
export const batch14MixedLabs: LabScenario[] = [
  // 1 — Network: CVE-2024-1709 — ConnectWise ScreenConnect Authentication Bypass
  {
    id: 'cve-2024-1709-screenconnect-auth-bypass',
    title: 'CVE-2024-1709: ConnectWise ScreenConnect Authentication Bypass',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'rmm-relay19 runs ConnectWise ScreenConnect 23.9.7, the remote-monitoring-and-management tool MSPs use ' +
      'to remotely control client machines — meaning a compromise here doesn\'t just own this one box, it\'s ' +
      'a foothold into every endpoint this RMM instance manages. CVE-2024-1709 is a CVSS 10.0 authentication ' +
      'bypass: ScreenConnect\'s setup wizard, meant to run exactly once during initial installation, stays ' +
      'reachable at /SetupWizard.aspx afterward with no check that setup was already completed — hitting it ' +
      'again lets an unauthenticated attacker create a brand-new administrator account outright. This is a ' +
      'real, actively-exploited-in-the-wild vulnerability (34+ public PoCs, exploitation confirmed within ' +
      'days of disclosure in February 2024) that this session models via this platform\'s standard ' +
      '`exploit` mechanic, the same live mechanism behind every other CVE-RCE lab here.',
    objectives: [
      { text: 'nmap -sV 10.10.252.2', why: 'Confirms the exposed ScreenConnect version before attempting anything version-specific — CVE-2024-1709 affects 23.9.7 and earlier specifically.' },
      { text: 'exploit cve-2024-1709-screenconnect 10.10.252.2', why: 'Re-running the setup wizard against an already-configured instance is what lets an unauthenticated attacker create a new administrator account — the exact real CVE-2024-1709 mechanism, not a generic "RCE happened" abstraction.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms full administrative access to the RMM console — in the real incident, this was the exact foothold used to push malware to every endpoint a compromised MSP instance managed.' },
    ],
    hints: [
      'nmap -sV 10.10.252.2',
      'exploit cve-2024-1709-screenconnect 10.10.252.2',
      'Once the session opens you are an administrator on the RMM console — check /root/root.txt (this lab treats the elevated session\'s home as /root for simplicity).',
      'Real-world detail: this vulnerability was reported to have 34+ public PoC exploits within days, and was actively exploited in the wild before most organizations had even applied the patch.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'rmm-relay19',
        ip: '10.10.252.2',
        os: 'ConnectWise ScreenConnect 23.9.7 (unpatched, CVE-2024-1709)',
        services: [{ port: 8040, name: 'http', version: 'ConnectWise ScreenConnect 23.9.7 (SetupWizard.aspx reachable post-setup)' }],
        users: [],
        exploitableAs: 'cve-2024-1709-screenconnect',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2024-1709 confirmed — the ScreenConnect setup-wizard authentication bypass, CVSS 10.0, ' +
                'actively exploited in the wild from February 2024.\nflag{screenconnect_setupwizard_authbypass_cve_2024_1709}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Network: CVE-2024-3400 — Palo Alto PAN-OS GlobalProtect Command Injection
  {
    id: 'cve-2024-3400-panos-globalprotect-cmdinject',
    title: 'CVE-2024-3400: Palo Alto PAN-OS GlobalProtect Command Injection',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'edge-fw03 is a Palo Alto Networks firewall running PAN-OS with a GlobalProtect gateway configured — ' +
      'exactly the affected configuration for CVE-2024-3400, a CVSS 10.0 command injection reachable with no ' +
      'authentication at all. The real flaw: a malformed session ID value lets an attacker create an ' +
      'arbitrary file at an attacker-chosen path on the appliance via a crafted, unauthenticated HTTP POST, ' +
      'and that file-creation primitive is chained into full OS command injection running as root — no ' +
      'device telemetry setting needs to be enabled, and it affects the firewall itself, not just a ' +
      'management console. Palo Alto disclosed this April 12, 2024, and confirmed active exploitation before ' +
      'the disclosure was even public; a scan a few weeks later found over 143,000 internet-facing ' +
      'GlobalProtect devices, giving a sense of how large the real exposed surface was.',
    objectives: [
      { text: 'nmap -sV 10.10.253.2', why: 'Confirms the exposed PAN-OS/GlobalProtect version before attempting anything version-specific — this CVE only affects PAN-OS 10.2, 11.0, and 11.1 with a GlobalProtect gateway or portal configured.' },
      { text: 'exploit cve-2024-3400-panos-globalprotect 10.10.253.2', why: 'Chains the unauthenticated arbitrary-file-creation primitive (via a malformed session ID) into OS command injection running as root — the exact real CVE-2024-3400 mechanism.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms root-level code execution directly on the firewall itself — the single device every packet on this network already has to pass through.' },
    ],
    hints: [
      'nmap -sV 10.10.253.2',
      'exploit cve-2024-3400-panos-globalprotect 10.10.253.2',
      'Once the session opens you are root on the firewall itself — check /root/root.txt (this lab treats the elevated session\'s home as /root for simplicity).',
      'Real-world detail: a post-disclosure internet scan found 143,000+ publicly-facing GlobalProtect devices — Palo Alto confirmed active in-the-wild exploitation even before the public disclosure.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'edge-fw03',
        ip: '10.10.253.2',
        os: 'Palo Alto Networks PAN-OS 11.1 (GlobalProtect gateway enabled, unpatched, CVE-2024-3400)',
        services: [{ port: 443, name: 'https', version: 'PAN-OS 11.1 GlobalProtect portal/gateway (unpatched)' }],
        users: [],
        exploitableAs: 'cve-2024-3400-panos-globalprotect',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2024-3400 confirmed — unauthenticated arbitrary file creation chained into OS command ' +
                'injection as root on PAN-OS GlobalProtect, CVSS 10.0, disclosed April 2024.\nflag{panos_globalprotect_cmdinject_cve_2024_3400}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 3 — Bug Bounty: An Exposed .env File Leaks Full Application Secrets
  {
    id: 'bb-exposed-dotenv-laravel-app-key',
    title: 'Bug Bounty: An Exposed .env File Leaks Full Application Secrets',
    difficulty: 'Easy',
    category: 'Bug Bounty',
    briefing:
      'invoicing-app61 is a Laravel application, and Laravel — like Django, Rails, and most Node.js ' +
      'frameworks — reads its runtime configuration from a plain KEY=VALUE .env file sitting in the project ' +
      'root. That file is meant to be excluded from the public webroot entirely; here, the webroot was ' +
      'pointed at the base project directory instead of Laravel\'s own public/ subfolder, a genuinely common ' +
      'real misconfiguration, leaving .env directly fetchable over plain HTTP. This is one of the ' +
      'highest-impact, lowest-effort findings in real bug bounty work specifically because a single request ' +
      'yields everything at once: database credentials, third-party API keys, mail credentials, and ' +
      'Laravel\'s own APP_KEY — the master key Laravel uses to sign and encrypt session cookies and other ' +
      'application data, meaning its exposure additionally lets an attacker forge or decrypt anything the ' +
      'app protects with it, not just read the file\'s contents.',
    objectives: [
      { text: 'gobuster -u http://10.10.254.2 -w /root/wordlists/dotfiles.txt', why: 'Directory brute-forcing for exactly this class of forgotten dotfile is standard bug-bounty methodology — .env is never linked from anywhere in the rendered application.' },
      { text: 'curl http://10.10.254.2/.env', why: 'A single request yields the database password, third-party API keys, mail credentials, and the Laravel APP_KEY all at once — the concrete, complete impact of one misconfigured webroot.' },
    ],
    hints: [
      'gobuster -u http://10.10.254.2 -w /root/wordlists/dotfiles.txt',
      'curl http://10.10.254.2/.env',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({
        'dotfiles.txt': file('.env\n.env.backup\n.git/config\n.htaccess\nconfig.php.bak\n'),
      }),
    }),
    network: [
      {
        hostname: 'invoicing-app61',
        ip: '10.10.254.2',
        os: 'PHP 8.2 / Laravel 10 (webroot misconfigured to the base project directory)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24 + PHP-FPM (Laravel 10, webroot serves the project root, not public/)',
            http: {
              '/.env':
                'APP_NAME=InvoicingApp61\n' +
                'APP_ENV=production\n' +
                'APP_KEY=base64:8fJ2kX9vQ1mN4pR7sT0wZ3aC6eG5hK8jL2nP5rU8xB1yD4=\n' +
                'DB_CONNECTION=mysql\n' +
                'DB_HOST=10.10.254.10\n' +
                'DB_DATABASE=invoicing_prod\n' +
                'DB_USERNAME=laravel_app\n' +
                'DB_PASSWORD=Inv0icing_Pr0d_2026!\n' +
                'MAIL_USERNAME=notifications@invoicing-app61.example\n' +
                'MAIL_PASSWORD=SmtpRelay_9f3c\n' +
                'STRIPE_SECRET=sk_live_51NfG3aKEY_REDACTED_FOR_LAB\n' +
                '# webroot was pointed at the base project directory instead of Laravel\'s public/ subfolder --\n' +
                '# .env is never linked from the app itself, but a plain GET request reads it directly --\n' +
                '# flag{exposed_dotenv_laravel_app_key_full_secrets_leak}\n',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — Web: Blind Boolean-Based SQL Injection via sqlmap
  {
    id: 'web-sqli-blind-boolean-sqlmap',
    title: 'SQL Injection: Blind Boolean-Based, Extracted Live with sqlmap',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'directory-lookup22\'s employee search feature concatenates the "username" parameter directly into a ' +
      'WHERE clause with no sanitization — but unlike this session\'s existing UNION-based SQLi lab, this ' +
      'endpoint never reflects database content back in the response at all, only a generic "found" or "not ' +
      'found" message. That\'s a blind SQL injection: there\'s nothing to UNION into the response to read ' +
      'directly, so extraction instead relies on asking the database true/false questions one at a time and ' +
      'watching which response you get back — exactly the technique sqlmap automates when you point it at an ' +
      'injectable parameter with --batch (never prompt, assume the default answer) and --dump (actually ' +
      'extract and print the data once the injection is confirmed).',
    objectives: [
      { text: 'curl "http://10.10.255.2/lookup?username=admin"', why: 'Establishes the normal, expected response first — a known-good baseline is what lets you recognize a true/false difference later instead of guessing at one.' },
      { text: 'sqlmap -u "http://10.10.255.2/lookup?username=admin" --batch', why: 'sqlmap automates exactly the blind-injection workflow this endpoint requires: sending crafted true/false conditions and comparing responses to confirm the parameter is injectable, with no data reflected back to read directly.' },
      { text: 'sqlmap -u "http://10.10.255.2/lookup?username=admin\' AND 1=1--" --batch --dump', why: 'Once the injection is confirmed, --dump is what actually extracts the underlying data through the same blind true/false mechanism, condition by condition.' },
    ],
    hints: [
      'curl "http://10.10.255.2/lookup?username=admin"',
      'sqlmap -u "http://10.10.255.2/lookup?username=admin" --batch',
      'sqlmap -u "http://10.10.255.2/lookup?username=admin\' AND 1=1--" --batch --dump',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'directory-lookup22',
        ip: '10.10.255.2',
        os: 'Ubuntu 22.04 (Flask + SQLite, string-concatenated WHERE clause)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 3.0 (Python, no query parameterization on the employee lookup endpoint)',
            vulnRoutes: [
              {
                kind: 'sqli',
                path: '/lookup',
                param: 'username',
                triggerSubstrings: ["' and 1=1--"],
                vulnerableResponse:
                  '{"table":"employees","rows":[{"id":1,"name":"D. Okafor","role":"CFO","ssn_last4":"8841"},{"id":2,"name":"R. Vance","role":"CISO","ssn_last4":"2207"}],"note":"flag{blind_boolean_sqli_extracted_via_sqlmap_batch_dump}"}',
                normalResponse: '{"found":false}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Linux: Privesc via gdb (GTFOBins)
  makePrivescLab({
    id: 'privesc-sudo-gdb-gtfobins',
    title: 'Privesc: GDB (GTFOBins)',
    ip: '10.10.101.17',
    hostname: 'monitoring07',
    os: 'Debian 12',
    company: 'Northfield Observability',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'opsuser',
    password: 'dragon',
    privescKind: 'sudo',
    binary: '/usr/bin/gdb',
    binaryName: 'gdb',
    gtfobinsArgs: "-nx -ex '!sh' -ex quit",
    gtfobinsWhy:
      "gdb's '!' prefix runs an arbitrary shell command with gdb's own privileges, a real, documented " +
      "GTFOBins shell-escape -- so a NOPASSWD sudo rule on gdb, almost certainly left in place so an " +
      "on-call engineer could debug a crashing service without typing a password at 3am, hands over a root " +
      "shell in one line.",
    breakdown:
      "'-nx' tells gdb not to load any .gdbinit startup files, keeping the launch clean and fast. '-ex " +
      "\"!sh\"' runs a single gdb command immediately on startup -- the '!' prefix is gdb's own shell-escape " +
      "syntax, handing off directly to /bin/sh with gdb's current privileges (root, since sudo launched it). " +
      "'-ex quit' is a second immediate command queued to run right after -- in practice the spawned shell " +
      "is interactive and is used before gdb ever gets to process that second command.",
    userFlag: 'flag{monitoring07_opsuser_foothold_established}',
    rootFlag: 'flag{gdb_gtfobins_shell_escape_sudo_nopasswd_root}',
  }),

  // 6 — SOC: Golden Ticket Detection via an Anomalous 10-Year Ticket Lifetime
  {
    id: 'soc-golden-ticket-anomalous-lifetime-detection',
    title: 'SOC: Golden Ticket Detection via an Anomalous 10-Year Ticket Lifetime',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'This domain\'s configured maximum Kerberos ticket lifetime is 10 hours, renewable for 7 days — the ' +
      'standard, real Active Directory default. A SIEM correlation rule flags a TGT (Event ID 4768) issued ' +
      'to a service account with a lifetime of exactly 10 years, a number that has nothing to do with any AD ' +
      'group policy setting and everything to do with a real, well-known offensive-tooling default: both ' +
      'Mimikatz and Rubeus forge Golden Tickets with a 10-year lifetime unless an operator explicitly ' +
      'overrides it, because the forging tool has no idea what the real domain policy is and 10 years is ' +
      'simply its own hardcoded default. This is a distinct, complementary detection method from this ' +
      'session\'s existing Golden SAML lab, which catches a forged SAML assertion via a MISSING corroborating ' +
      'event trail — this instead catches a forged Kerberos ticket via a PRESENT but impossible value sitting ' +
      'directly in the ticket-issuance event itself.',
    objectives: [
      { text: 'cat domain-kerberos-policy.txt', why: 'Establishes the real baseline this event has to be compared against -- the domain\'s actual configured maximum ticket lifetime, not an assumption.' },
      { text: 'cat event-4768-anomalous-ticket.txt', why: 'The TGT request itself: a 10-year requested lifetime is 8,760x longer than the domain default, and this exact number is a well-known, hardcoded default in both Mimikatz and Rubeus\' Golden Ticket forging code -- not a coincidence or a misconfigured GPO.' },
    ],
    hints: [
      'cat domain-kerberos-policy.txt',
      'cat event-4768-anomalous-ticket.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'domain-kerberos-policy.txt': file(
          'CORP.LOCAL Default Domain Policy, Kerberos Policy settings:\n' +
            '  Maximum lifetime for user ticket (TGT):        10 hours\n' +
            '  Maximum lifetime for user ticket renewal:      7 days\n' +
            '  -- standard, unmodified Active Directory defaults -- no legitimate TGT on this domain should\n' +
            '     ever be issued with a lifetime anywhere close to years, let alone exactly 10 of them --\n',
        ),
        'event-4768-anomalous-ticket.txt': file(
          'Domain Controller Security Event Log, Event ID 4768 (A Kerberos authentication ticket (TGT) was requested):\n' +
            '  Account Name:        svc_sqlbackup\n' +
            '  Ticket Options:      0x40810010\n' +
            '  Ticket Encryption Type: 0x17 (RC4-HMAC)  -- this domain is AES-capable; every legitimate TGT\n' +
            '                                              issued in the last 18 months used 0x12 (AES256)\n' +
            '  Certificate Issuer Name:  -\n' +
            '  Requested Ticket Lifetime: 315360000 seconds (= 10 years exactly)\n' +
            '\n' +
            '--- ANALYST NOTE: 10 years is 8,760x this domain\'s real 10-hour maximum ticket lifetime, and is\n' +
            '    the well-known hardcoded default lifetime BOTH Mimikatz and Rubeus forge Golden Tickets with\n' +
            '    unless an operator explicitly overrides it -- combined with a fallback to RC4 encryption on an\n' +
            '    AES-capable domain (another common forging-tool default), this is a forged TGT, not a real one.\n' +
            '    flag{golden_ticket_10_year_lifetime_mimikatz_rubeus_default_detected} ---\n',
        ),
      }),
    }),
    network: [],
  },
];
