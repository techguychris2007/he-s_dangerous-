import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 18, part 2: three more real, famous CVEs via this platform's proven `exploit <module> <ip>`
 *  mechanic, plus five more real, well-documented techniques across Security+, SOC, Malware, Web, and
 *  Cloud. See NOTES.md batch 18 for full citations on all eight. */
export const batch18MixedLabs: LabScenario[] = [
  // 1 — Network: CVE-2024-6387 — regreSSHion OpenSSH Signal Handler Race Condition RCE
  {
    id: 'cve-2024-6387-regresshion-openssh-rce',
    title: 'CVE-2024-6387: regreSSHion — OpenSSH Signal Handler Race Condition RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'legacy-jumphost14 runs OpenSSH 9.6, squarely inside the affected range (8.5p1 through 9.8p1) for ' +
      'CVE-2024-6387, nicknamed regreSSHion because it\'s a regression of a bug patched back in 2006 ' +
      '(CVE-2006-5051) that quietly crept back into later OpenSSH releases. The real flaw: if a connecting ' +
      'client fails to authenticate within the LoginGraceTime window (120 seconds by default), sshd\'s ' +
      'SIGALRM handler fires asynchronously and calls functions that are not async-signal-safe -- including ' +
      'syslog() -- creating a genuine race condition in glibc\'s memory allocator on Linux systems ' +
      'specifically. Winning that race is not trivial (Qualys\' own research found it takes an average of ' +
      'roughly 10,000 attempts), but it requires no credentials and no user interaction at all, and a scan ' +
      'taken the same day this CVE was disclosed found over 7 million exposed OpenSSH instances in the ' +
      'vulnerable version range.',
    objectives: [
      { text: 'nmap -sV 10.10.262.2', why: 'Confirms the exposed OpenSSH version -- CVE-2024-6387 only affects glibc-based Linux systems running OpenSSH 8.5p1 through 9.8p1 (or unpatched pre-4.4p1 builds), and version fingerprinting is the first real step before attempting anything version-specific.' },
      { text: 'exploit cve-2024-6387-regresshion 10.10.262.2', why: 'Represents the real race-condition exploit: repeatedly triggering the async-signal-unsafe SIGALRM handler path until the race is won -- real-world research found this takes an average of ~10,000 attempts, unauthenticated, with no user interaction required at all.' },
      { text: 'Once the session opens you are root -- check /root/root.txt', why: 'Confirms full root-level code execution on the SSH server itself -- the exact real severity that made this CVE critical enough to warrant a CVSS 8.1 rating despite the exploitation complexity.' },
    ],
    hints: [
      'nmap -sV 10.10.262.2',
      'exploit cve-2024-6387-regresshion 10.10.262.2',
      'Once the session opens you are root -- check /root/root.txt (this lab treats the elevated session\'s home as /root for simplicity).',
      'Real-world detail: a scan taken the same day this CVE was disclosed (July 1, 2024) found over 7 million exposed OpenSSH instances in the vulnerable 8.5p1-9.7p1 range.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-jumphost14',
        ip: '10.10.262.2',
        os: 'Debian 12 (glibc-based, OpenSSH 9.6p1, unpatched, CVE-2024-6387)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 9.6p1 Debian (unpatched, vulnerable range 8.5p1-9.8p1)' }],
        users: [],
        exploitableAs: 'cve-2024-6387-regresshion',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2024-6387 (regreSSHion) confirmed -- a regression of CVE-2006-5051, an async-signal-unsafe ' +
                'SIGALRM handler race condition granting unauthenticated root RCE on glibc-based Linux OpenSSH ' +
                'servers.\nflag{regresshion_openssh_signal_handler_race_condition_cve_2024_6387}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Network: CVE-2023-46747 — F5 BIG-IP Configuration Utility AJP Request Smuggling RCE
  {
    id: 'cve-2023-46747-f5-bigip-ajp-smuggling-rce',
    title: 'CVE-2023-46747: F5 BIG-IP Configuration Utility AJP Request Smuggling RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'edge-lb02\'s F5 BIG-IP Configuration Utility (TMUI) is reachable on its management interface and ' +
      'carries CVE-2023-46747, a CVSS 9.8 unauthenticated remote code execution flaw discovered by ' +
      'Praetorian Security. The real root cause is a request-smuggling bug between Apache HTTPd and Tomcat\'s ' +
      'AJP (Apache JServ Protocol) processing, caused by inconsistent handling of Content-Length and ' +
      'Transfer-Encoding headers between the two -- crafting a request that the front-end HTTPd and the ' +
      'back-end AJP processor interpret differently lets an attacker smuggle a second, authenticated-looking ' +
      'request straight past the login the TMUI would normally require, landing directly on functionality ' +
      'that allows arbitrary system command execution. F5 shipped hotfixes in October 2023; this appliance ' +
      'never received them.',
    objectives: [
      { text: 'nmap -sV 10.10.263.2', why: 'Confirms the exposed BIG-IP TMUI management interface before attempting anything version-specific -- this CVE targets the Configuration Utility specifically, not the data-plane traffic-management functionality.' },
      { text: 'exploit cve-2023-46747-f5-bigip-ajp-smuggling 10.10.263.2', why: 'Represents the real AJP request-smuggling chain: a crafted request exploiting the Content-Length/Transfer-Encoding inconsistency between Apache HTTPd and Tomcat\'s AJP processing bypasses TMUI authentication entirely, landing on functionality that permits arbitrary command execution.' },
      { text: 'Once the session opens you are root -- check /root/root.txt', why: 'Confirms full unauthenticated root code execution on the load balancer\'s own management plane -- the device sitting in front of every application it fronts.' },
    ],
    hints: [
      'nmap -sV 10.10.263.2',
      'exploit cve-2023-46747-f5-bigip-ajp-smuggling 10.10.263.2',
      'Once the session opens you are root -- check /root/root.txt (this lab treats the elevated session\'s home as /root for simplicity).',
      'Real-world detail: this vulnerability was discovered and responsibly reported by Praetorian Security researchers Thomas Hendrickson and Michael Weber; F5 shipped hotfixes on October 26, 2023.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'edge-lb02',
        ip: '10.10.263.2',
        os: 'F5 BIG-IP 17.1.0 (Configuration Utility / TMUI, unpatched, CVE-2023-46747)',
        services: [{ port: 443, name: 'https', version: 'F5 BIG-IP TMUI (unpatched, AJP request smuggling)' }],
        users: [],
        exploitableAs: 'cve-2023-46747-f5-bigip-ajp-smuggling',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2023-46747 confirmed -- Apache HTTPd/Tomcat AJP request smuggling bypassing F5 BIG-IP TMUI ' +
                'authentication entirely, CVSS 9.8, hotfixed October 2023.\nflag{f5_bigip_tmui_ajp_smuggling_authbypass_cve_2023_46747}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 3 — Network: CVE-2024-4577 — PHP-CGI Windows "Best Fit" Argument Injection RCE
  {
    id: 'cve-2024-4577-php-cgi-argument-injection-rce',
    title: 'CVE-2024-4577: PHP-CGI Windows "Best Fit" Argument Injection RCE',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'xampp-legacy09 runs XAMPP for Windows with PHP-CGI, vulnerable by default to CVE-2024-4577 -- a ' +
      'CVSS 9.8 unauthenticated RCE that is, in the researcher\'s own words, a patch bypass of a much older ' +
      'flaw (CVE-2012-1823). The real root cause is specific to Windows\' character-encoding conversion: ' +
      'Windows\' "Best Fit" behavior silently maps certain Unicode characters to ASCII equivalents during ' +
      'encoding conversion, and PHP-CGI never accounted for that mapping when it decided which characters ' +
      'were safe to pass through as command-line arguments. A soft hyphen character, which Best Fit quietly ' +
      'converts to a literal ASCII hyphen, lets an attacker smuggle PHP-CGI command-line flags (like ' +
      '-d allow_url_include=1) into a request that was never supposed to be interpreted as arguments at ' +
      'all -- turning a normal-looking web request into full remote code execution on every default XAMPP ' +
      'install for Windows.',
    objectives: [
      { text: 'nmap -sV 10.10.264.2', why: 'Confirms the exposed PHP-CGI service on Windows before attempting anything version-specific -- this CVE affects PHP 8.3 before 8.3.8, 8.2 before 8.2.20, and 8.1 before 8.1.29, specifically on Windows.' },
      { text: 'exploit cve-2024-4577-php-cgi-argument-injection 10.10.264.2', why: 'Represents the real Best Fit character-conversion chain: a soft-hyphen character in the request gets silently converted to a literal hyphen by Windows\' encoding behavior, smuggling PHP-CGI flags into the request as if they were legitimate command-line arguments.' },
      { text: 'Once the session opens you are root -- check /root/root.txt', why: 'Confirms full unauthenticated code execution -- and this CVE affects EVERY default XAMPP for Windows installation, not a rare edge-case configuration, which is exactly what made it critical.' },
    ],
    hints: [
      'nmap -sV 10.10.264.2',
      'exploit cve-2024-4577-php-cgi-argument-injection 10.10.264.2',
      'Once the session opens you are root -- check /root/root.txt (this lab treats the elevated session\'s home as /root for simplicity).',
      'Real-world detail: this is a documented patch bypass of the much older CVE-2012-1823 -- the underlying argument-injection class was never fully closed, just re-opened by a Windows-specific character-encoding edge case Best Fit conversion introduces.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'xampp-legacy09',
        ip: '10.10.264.2',
        os: 'Windows Server 2019 + XAMPP (PHP 8.1.27, PHP-CGI, unpatched, CVE-2024-4577)',
        services: [{ port: 80, name: 'http', version: 'Apache 2.4 + PHP-CGI 8.1.27 (Windows, Best Fit argument injection unpatched)' }],
        users: [],
        exploitableAs: 'cve-2024-4577-php-cgi-argument-injection',
        root: dir({
          root: dir({
            'root.txt': file(
              'CVE-2024-4577 confirmed -- Windows "Best Fit" character conversion smuggling PHP-CGI command-line ' +
                'flags into an unauthenticated web request, CVSS 9.8, affects every default XAMPP for Windows ' +
                'install.\nflag{php_cgi_bestfit_argument_injection_cve_2024_4577}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 4 — Security+: IDN Homograph Domain Attack Uses Unicode Lookalikes to Impersonate a Trusted Brand
  {
    id: 'securityplus-idn-homograph-domain-attack',
    title: 'Security+: An IDN Homograph Attack Impersonates a Trusted Domain',
    difficulty: 'Easy',
    category: 'Security+',
    briefing:
      'A phishing campaign targeting meridiancorp customers links to a domain that renders, visually, ' +
      'completely identically to meridiancorp.example in every mainstream browser\'s address bar -- but is ' +
      'not the same domain at all. Internationalized Domain Names (IDN) allow non-ASCII Unicode characters ' +
      'in domain names, encoded internally as Punycode (an "xn--" prefixed ASCII string); the real problem ' +
      'is that many Unicode characters from other scripts are visually indistinguishable from ordinary Latin ' +
      'letters -- a Cyrillic "а" (U+0430) looks pixel-for-pixel identical to a Latin "a" (U+0061) in most ' +
      'fonts, but they are entirely different characters to a domain registrar, a certificate authority, and ' +
      'the DNS system itself. Registering "meridiаncorp.example" with that one Cyrillic "а" produces a ' +
      'completely distinct, independently-registerable domain that a victim has no realistic way to ' +
      'distinguish from the real one just by looking at it.',
    objectives: [
      { text: 'cat suspicious-domain-punycode-decode.txt', why: 'Decodes the phishing domain\'s real Punycode form, revealing the Cyrillic "а" substituted for the Latin "a" -- the domain the browser address bar displays and the domain DNS actually resolves are visually identical but structurally completely different.' },
      { text: 'cat certificate-issuance-log.txt', why: 'Confirms the attacker domain has its own genuinely valid TLS certificate -- the padlock icon and HTTPS itself provide zero protection against this attack, since the attacker legitimately owns the lookalike domain and can get it validly certified like any other.' },
    ],
    hints: [
      'cat suspicious-domain-punycode-decode.txt',
      'cat certificate-issuance-log.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'suspicious-domain-punycode-decode.txt': file(
        'Domain analysis, phishing link from the reported campaign:\n' +
          '  Displayed in browser address bar:  meridiancorp.example\n' +
          '  Actual Punycode-encoded domain:     xn--meridancorp-8mb.example\n' +
          '  Decoded:                             merid\\u0430ncorp.example  (the 5th character is CYRILLIC\n' +
          '                                        SMALL LETTER A, U+0430 -- not Latin "a", U+0061)\n' +
          '  -- visually identical to the real meridiancorp.example in every mainstream browser font --\n' +
          '     but a completely different domain to DNS, to the registrar, and to any certificate authority --\n',
      ),
      'certificate-issuance-log.txt': file(
        'Certificate Transparency log entry, xn--meridancorp-8mb.example:\n' +
          '  Issuer: R3 (Let\'s Encrypt)   Issued: 2026-07-22   Status: valid, not revoked\n' +
          '  -- a genuinely valid TLS certificate, issued exactly as it would be for any other legitimately\n' +
          '     owned domain -- the padlock icon and HTTPS provide zero protection against this attack,\n' +
          '     since the attacker legally and technically owns this lookalike domain --\n' +
          '  flag{idn_homograph_cyrillic_lookalike_domain_valid_tls_cert}\n',
      ),
    }),
    network: [],
  },

  // 5 — SOC: Encoded PowerShell Command Decodes to a C2 Beacon Configuration
  {
    id: 'soc-powershell-encodedcommand-c2-beacon-decode',
    title: 'SOC: An Encoded PowerShell Command Decodes to a C2 Beacon Configuration',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Sysmon Event ID 1 on ACCT-WKS-22 captures a powershell.exe process launched with -EncodedCommand, a ' +
      'legitimate PowerShell flag that accepts a Base64-encoded script -- a real, everyday feature for ' +
      'safely passing complex scripts through layers of shell quoting, and exactly why blocking ' +
      '-EncodedCommand outright isn\'t viable in most environments. Attackers rely on the same legitimate ' +
      'feature specifically because it defeats naive command-line-string signature matching: the malicious ' +
      'content never appears as readable text in the process command line at all, only as an opaque Base64 ' +
      'blob, until an analyst actually decodes it. Decoding this particular blob reveals it isn\'t an ' +
      'obfuscated version of some benign administrative task -- it\'s a hardcoded C2 beacon configuration: a ' +
      'callback URL, a check-in interval, and an operator-assigned implant identifier.',
    objectives: [
      { text: 'cat sysmon-event1-encodedcommand.txt', why: 'Captures the raw process creation event -- the Base64 blob passed via -EncodedCommand is opaque at this stage, exactly why decoding it is the necessary next step rather than dismissing the alert on command-line content alone.' },
      { text: 'cat decoded-powershell-payload.txt', why: 'The decoded script is a hardcoded C2 beacon configuration, not an obfuscated administrative task -- confirming genuine malicious intent rather than a false positive on legitimate encoded-command usage.' },
    ],
    hints: [
      'cat sysmon-event1-encodedcommand.txt',
      'cat decoded-powershell-payload.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'sysmon-event1-encodedcommand.txt': file(
          'Sysmon Event ID 1 (Process Creation), ACCT-WKS-22:\n' +
            '  Image: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\n' +
            '  CommandLine: powershell.exe -nop -w hidden -EncodedCommand JABjADIAdQByAGwAIAA9ACAAImh0dHA6Ly8xOTIuMTY4LjkzLjExMDo0NDQzL2JlYWNvbiI7ACQAaQBkACAAPQAgACIAaQBtAHAAbAAtADgANAA0ADEAIgA7ACQAaQBuAHQAZQByAHYAYQBsACAAPQAgADMAMAA=\n' +
            '  ParentImage: C:\\Windows\\System32\\wscript.exe\n' +
            '  -- the -EncodedCommand flag is a real, legitimate PowerShell feature for passing scripts safely\n' +
            '     through shell-quoting layers -- the malicious content is completely unreadable as plain text\n' +
            '     in the command line until this Base64 blob is actually decoded --\n',
        ),
        'decoded-powershell-payload.txt': file(
          'Decoded -EncodedCommand payload (UTF-16LE base64, ACCT-WKS-22):\n' +
            '  $c2url = "http://192.168.93.110:4443/beacon";\n' +
            '  $id = "impl-8441";\n' +
            '  $interval = 30\n' +
            '\n' +
            '--- ANALYST NOTE: this is not an obfuscated version of a legitimate administrative script -- it is\n' +
            '    a hardcoded C2 beacon configuration: a callback URL, a check-in interval in seconds, and an\n' +
            '    operator-assigned implant identifier. wscript.exe as the parent process (rather than a normal\n' +
            '    interactive session) is consistent with a phishing macro or HTA launching this stage.\n' +
            '    flag{powershell_encodedcommand_decoded_c2_beacon_config_confirmed} ---\n',
        ),
      }),
    }),
    network: [],
  },

  // 6 — Malware: MSBuild.exe Inline Task Bypasses Application Whitelisting
  {
    id: 'malware-msbuild-inline-task-applocker-bypass',
    title: 'Malware Analysis: MSBuild.exe Inline Task Bypasses Application Whitelisting',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'FIN-WKS-31 executed msbuild.exe against an attacker-supplied .csproj project file -- and MSBuild.exe ' +
      'is a legitimate, Microsoft-signed binary that ships with the .NET Framework, trusted by default under ' +
      'AppLocker and WDAC application-control policies specifically because build tooling is assumed benign. ' +
      'The real feature being abused, MITRE ATT&CK T1127.001, is MSBuild\'s "inline task" capability, ' +
      'introduced in .NET 4: a project file can embed raw C# or Visual Basic source code directly inside its ' +
      'XML, and MSBuild will compile and execute that code as part of building the project -- no external ' +
      'compiler invocation, no dropped DLL, nothing that looks like code execution from the outside at all, ' +
      'just msbuild.exe doing exactly what it was designed to do. Real malware families (PlugX among them) ' +
      'and post-exploitation frameworks (Empire ships a built-in module for this) have used exactly this ' +
      'technique to run arbitrary code through a trusted, signed process.',
    objectives: [
      { text: 'cat msbuild-process-execution-log.txt', why: 'Shows msbuild.exe -- a signed Microsoft binary application-control policies trust by default -- executing against an attacker-supplied project file, with AppLocker logging an ALLOWED verdict purely on the strength of that signature.' },
      { text: 'cat malicious-csproj-inline-task.txt', why: 'The project file itself: raw C# source embedded directly inside an MSBuild <Task> element, compiled and executed in-process the moment the build runs -- no external compiler call, no dropped file, nothing an file-based AV scan would ever see land on disk.' },
    ],
    hints: [
      'cat msbuild-process-execution-log.txt',
      'cat malicious-csproj-inline-task.txt',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'msbuild-process-execution-log.txt': file(
          'EDR process execution log, FIN-WKS-31:\n' +
            '  2026-08-01 13:04:22  msbuild.exe C:\\Users\\public\\update.csproj\n' +
            '  [AppLocker verdict: ALLOWED -- publisher rule: "Microsoft Corporation, .NET Framework"]\n' +
            '  -- MITRE ATT&CK T1127.001 (Trusted Developer Utilities Proxy Execution: MSBuild) -- msbuild.exe\n' +
            '     is a signed Microsoft binary trusted by application-control policies by default, precisely\n' +
            '     because build tooling is assumed benign -- AppLocker approved this run purely on the strength\n' +
            '     of that signature, never inspecting the inline code the project file itself contained --\n',
        ),
        'malicious-csproj-inline-task.txt': file(
          '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">\n' +
            '  <Target Name="Hack">\n' +
            '    <ClassExample />\n' +
            '  </Target>\n' +
            '  <UsingTask TaskName="ClassExample" TaskFactory="CodeTaskFactory"\n' +
            '    AssemblyFile="C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\Microsoft.Build.Tasks.v4.0.dll" >\n' +
            '    <Task>\n' +
            '      <Code Type="Class" Language="cs">\n' +
            '        <![CDATA[\n' +
            '          using System; using Microsoft.Build.Utilities;\n' +
            '          public class ClassExample : Task {\n' +
            '            public override bool Execute() {\n' +
            '              System.Diagnostics.Process.Start("powershell.exe", "-enc <redacted-stage2>");\n' +
            '              return true;\n' +
            '            }\n' +
            '          }\n' +
            '        ]]>\n' +
            '      </Code>\n' +
            '    </Task>\n' +
            '  </UsingTask>\n' +
            '</Project>\n' +
            '-- raw C# compiled and executed in-process the instant "msbuild update.csproj" runs -- no\n' +
            '   external compiler call, no DLL dropped to disk, nothing a file-based AV scan would ever catch --\n' +
            '  flag{msbuild_inline_task_t1127_001_applocker_bypass_signed_binary}\n',
        ),
      }),
    }),
    network: [],
  },

  // 7 — Web: SSRF via a PDF-Generation Service Reads Local Files and Cloud Metadata
  {
    id: 'web-ssrf-pdf-generation-service-local-file-read',
    title: 'Web: SSRF via a PDF-Generation Service Reads Local Files and Cloud Metadata',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'invoice-export88 converts user-supplied HTML into a downloadable PDF using a headless browser engine ' +
      'running server-side -- a genuinely common architecture, and a genuinely common source of SSRF, ' +
      'because that headless browser has to be able to fetch external resources (images, stylesheets, fonts) ' +
      'to render a normal document, and nothing here restricts what URLs those resource references are ' +
      'allowed to point at. An <iframe> or <img> tag pointing at a local file:// path gets its content ' +
      'included directly in the rendered PDF exactly as if it were a normal remote image; a tag pointing at ' +
      'the cloud metadata endpoint (169.254.169.254) gets treated exactly the same way -- the PDF renderer ' +
      'has no concept of "this destination is sensitive," it just fetches whatever the HTML asks it to.',
    objectives: [
      { text: 'curl -X POST http://10.10.265.2:80/export-pdf -d "html=<iframe src=file:///etc/passwd></iframe>"', why: 'Confirms the PDF renderer will fetch and embed local filesystem content exactly as it would any other remote resource -- the classic SSRF-to-local-file-read chain this architecture is specifically prone to.' },
      { text: 'curl -X POST http://10.10.265.2:80/export-pdf -d "html=<iframe src=http://169.254.169.254/latest/meta-data/iam/security-credentials/export-role></iframe>"', why: 'The same unrestricted fetch reaches the cloud metadata endpoint just as easily as a local file -- turning a document-export feature into live IAM credential theft for whatever role the export service itself runs as.' },
    ],
    hints: [
      'curl -X POST http://10.10.265.2:80/export-pdf -d "html=<iframe src=file:///etc/passwd></iframe>"',
      'curl -X POST http://10.10.265.2:80/export-pdf -d "html=<iframe src=http://169.254.169.254/latest/meta-data/iam/security-credentials/export-role></iframe>"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'invoice-export88',
        ip: '10.10.265.2',
        os: 'Ubuntu 22.04 (Node.js + headless Chromium PDF renderer, no local-file or metadata restriction)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, headless Chromium PDF export)',
            vulnRoutes: [
              {
                kind: 'ssrf',
                path: '/export-pdf',
                param: 'html',
                triggerSubstrings: ['169.254.169.254'],
                vulnerableResponse: '{"status":200,"pdf_rendered":true,"embedded_resource":"iam/security-credentials/export-role","note":"flag{ssrf_pdf_generation_headless_renderer_cloud_metadata_credential_theft}"}',
                normalResponse: '{"status":200,"pdf_rendered":true,"embedded_resource":"none"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 8 — Cloud: Exposed etcd Datastore Leaks Every Kubernetes Cluster Secret
  {
    id: 'cloud-exposed-etcd-kubernetes-secrets-leak',
    title: 'Cloud: An Exposed etcd Datastore Leaks Every Kubernetes Cluster Secret',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'etcd is Kubernetes\' actual backing datastore -- every Secret, every ConfigMap, every piece of cluster ' +
      'state the API server itself relies on lives here, not merely a cache of it. Access to etcd is meant ' +
      'to be restricted to the API server alone, normally enforced with mutual TLS client-certificate ' +
      'authentication, and it should never be reachable from outside the cluster network at all. ' +
      'k8s-etcd-node03 has neither protection: etcd\'s client port (2379, the real, standard port) is bound ' +
      'to a public interface with no client-certificate requirement configured, meaning literally anyone who ' +
      'can reach that port can read the cluster\'s entire secret store directly -- cloud provider ' +
      'credentials, service account tokens, TLS private keys, database passwords, all of it -- without ever ' +
      'going through the Kubernetes API server\'s own RBAC controls at all, since etcd itself has no concept ' +
      'of Kubernetes-level authorization.',
    objectives: [
      { text: 'nmap -sV 10.10.266.2', why: 'Confirms etcd\'s client port (2379, its real, standard, well-known port) is exposed before probing whether it actually requires authentication.' },
      { text: 'curl http://10.10.266.2:2379/v2/keys/registry/secrets/default?recursive=true', why: 'etcd\'s own key-value API answers this with zero authentication at all -- reading the Kubernetes secrets namespace directly, completely bypassing the API server and every RBAC rule bound to it, since etcd itself enforces no Kubernetes-level authorization whatsoever.' },
    ],
    hints: [
      'nmap -sV 10.10.266.2',
      'curl http://10.10.266.2:2379/v2/keys/registry/secrets/default?recursive=true',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'k8s-etcd-node03',
        ip: '10.10.266.2',
        os: 'etcd 3.5 (Kubernetes backing datastore, no client-certificate authentication configured)',
        services: [
          {
            port: 2379,
            name: 'http',
            version: 'etcd 3.5 (client port, bound to a public interface, no mTLS client-cert requirement)',
            http: {
              '/v2/keys/registry/secrets/default':
                '{"node":{"key":"/registry/secrets/default","nodes":[' +
                  '{"key":"/registry/secrets/default/prod-db-creds","value":"eyJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJQcm9kRGIhMjAyNiJ9"},' +
                  '{"key":"/registry/secrets/default/cloud-provider-key","value":"eyJhY2Nlc3Nfa2V5IjoiQUtJQVJFREFDVEVEIn0="}' +
                '],"note":"flag{etcd_exposed_no_auth_kubernetes_secrets_leaked_bypasses_rbac}"}}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
