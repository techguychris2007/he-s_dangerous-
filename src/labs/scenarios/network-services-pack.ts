import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

const WORDLIST = '123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n';

function attacker(extra?: Record<string, ReturnType<typeof file>>) {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({ root: dir({ wordlists: dir({ 'mini-rockyou.txt': file(WORDLIST) }), ...(extra ?? {}) }) }),
  };
}

export const networkServiceLabs: LabScenario[] = [
  {
    id: 'net-redis-unauth',
    title: 'Unauthenticated Redis Exposure',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Meridian Cache Co. runs 10.10.102.1 (cache01), a Redis 6.0.9 instance deployed without ever setting ' +
      'requirepass. This is one of the most exploited real-world Redis misconfigurations — unauthenticated ' +
      'Redis has been used in the wild to write cron jobs and SSH keys for full remote code execution. Here, ' +
      'you will enumerate its exposed keyspace (via an HTTP debug proxy left on by the ops team) and pull a ' +
      'secret an engineer stored directly in the cache.',
    objectives: [
      { text: 'nmap -sV 10.10.102.1', why: 'Version-scan first — "Redis 6.0.9" tells you exactly which CVEs and default-config weaknesses to check, rather than guessing at the service behind port 6379.' },
      { text: 'curl 10.10.102.1:6379/', why: 'Unauthenticated Redis will happily hand over an INFO-style banner to anyone who connects — this proxy mirrors that, and its keyspace summary tells you what namespaces exist before you go fishing blind.' },
      { text: 'curl "10.10.102.1:6379/get?key=config:admin_notes"', why: 'Real attackers dump every key with KEYS * then GET each one — this targets the one namespace the banner just told you holds "config" data, exactly the kind of information engineers should never cache in plaintext.' },
    ],
    hints: [
      'nmap -sV 10.10.102.1 — confirm the exposed port and exact Redis version.',
      'curl 10.10.102.1:6379/ — the keyspace summary in the response tells you which key is worth reading.',
      'curl "10.10.102.1:6379/get?key=config:admin_notes" — GET that specific key to read its stored value.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'cache01', ip: '10.10.102.1', os: 'Ubuntu 20.04',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 7.9p1' },
          {
            port: 6379, name: 'redis', version: 'Redis 6.0.9 (no requirepass configured)',
            http: {
              '/': 'REDIS 6.0.9 — unauthenticated debug proxy\nkeyspace: db0 has 4 keys\nnamespaces: session:*, cart:*, config:admin_notes\nTry: GET config:admin_notes',
            },
            vulnRoutes: [{
              kind: 'idor', path: '/get', param: 'key',
              triggerSubstrings: ['config:admin_notes'],
              vulnerableResponse: '"admin_notes: rotate the shared deploy key quarterly (nobody has). flag{redis_with_no_auth_is_a_free_win}"',
              normalResponse: '(nil)',
            }],
          },
        ],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'net-elasticsearch-open',
    title: 'Open Elasticsearch Index',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Vantage Search Systems runs search02 (10.10.102.2), an Elasticsearch 6.4.2 cluster with no authentication ' +
      'plugin installed — a shockingly common finding on real internet-wide scans, and the same root cause ' +
      'behind several major historical Elasticsearch data breaches. Enumerate the cluster, list its indices, ' +
      'and search the one that should never have been internet-reachable.',
    objectives: [
      { text: 'nmap -sV 10.10.102.2', why: 'Confirms Elasticsearch and its exact version — 6.4.2 predates several security-plugin-by-default changes, which is exactly why it is exposed here.' },
      { text: 'curl 10.10.102.2:9200/', why: 'The cluster root endpoint (equivalent to a real GET / on Elasticsearch) freely returns cluster metadata to anyone, unauthenticated — this is the standard first recon step against any exposed ES cluster.' },
      { text: 'curl 10.10.102.2:9200/_cat/indices', why: 'This mirrors the real _cat/indices API, which lists every index by name — attackers use this to spot indices with sensitive-sounding names before deciding where to dig.' },
      { text: 'curl "10.10.102.2:9200/internal_employee_records/_search"', why: 'Once you know the sensitive index name from the previous step, querying it directly is the same technique used in real Elasticsearch breach disclosures to dump entire unauthenticated indices.' },
    ],
    hints: [
      'nmap -sV 10.10.102.2',
      'curl 10.10.102.2:9200/ — cluster name and version, exactly like a real unauthenticated ES root request.',
      'curl 10.10.102.2:9200/_cat/indices — lists every index; one name stands out as sensitive.',
      'curl "10.10.102.2:9200/internal_employee_records/_search" — search that index directly.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'search02', ip: '10.10.102.2', os: 'CentOS 8',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 7.9p1' },
          {
            port: 9200, name: 'elasticsearch', version: 'Elasticsearch 6.4.2 (no security plugin installed)',
            http: {
              '/': '{"cluster_name":"vantage-prod","version":{"number":"6.4.2"},"tagline":"You Know, for Search"}',
              '/_cat/indices': 'yellow open products              5 1  12043 0  8.1mb  8.1mb\nyellow open web_logs             5 1 220112 0 41.2mb 41.2mb\nyellow open internal_employee_records 1 1    340 0  1.4mb  1.4mb',
              '/internal_employee_records/_search': '{"hits":{"total":340,"hits":[{"_source":{"name":"Jordan Ellis","ssn":"REDACTED","role":"Finance"}}]},"note":"flag{elasticsearch_status_api_leaked_the_index}"}',
            },
          },
        ],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'net-jenkins-default',
    title: 'Jenkins Unauthenticated Script Console RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Fastlane CI/CD left the Jenkins 2.303.1 script console on ci03 (10.10.102.3) reachable without login. ' +
      'The script console executes arbitrary Groovy code with the same privileges as the Jenkins service — in ' +
      'the real world this is a critical, widely-abused misconfiguration that leads directly to full host ' +
      'compromise, since Groovy can shell out to the OS. Recon the console, then weaponize it.',
    objectives: [
      { text: 'nmap -sV 10.10.102.3', why: 'Confirms Jenkins and its version — CI servers are high-value targets because they usually hold deploy keys and cloud credentials for every project they build.' },
      { text: 'curl 10.10.102.3:8080/script', why: 'This mirrors browsing directly to /script on a real Jenkins instance — if it loads with no login redirect, the script console is unauthenticated and arbitrary Groovy execution is one POST request away.' },
      { text: 'exploit jenkins-script-console 10.10.102.3', why: 'This models submitting a Groovy payload like `"whoami".execute().text` (or a reverse shell one-liner) to the console — in the real world this is a single HTTP POST that returns a shell on the Jenkins host.' },
      { text: 'Once the session opens, read /root/root.txt to capture the flag', why: 'Confirms the script console gave you full OS-level command execution, not just information disclosure — the same impact a real Jenkins script-console RCE finding carries in a pentest report.' },
    ],
    hints: [
      'nmap -sV 10.10.102.3',
      'curl 10.10.102.3:8080/script — if this loads without redirecting to a login page, the console has no auth.',
      'exploit jenkins-script-console 10.10.102.3 — models POSTing a Groovy RCE payload to the console.',
      'Once the session opens you have a shell on ci03 — check /root/root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ci03', ip: '10.10.102.3', os: 'Ubuntu 22.04',
        exploitableAs: 'jenkins-script-console',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' },
          {
            port: 8080, name: 'jenkins', version: 'Jenkins 2.303.1 (script console unauthenticated)',
            http: { '/script': '<html><body><h1>Script Console</h1><textarea>// Groovy script goes here</textarea><p>No login required — misconfigured security realm.</p></body></html>' },
          },
        ],
        users: [],
        root: dir({ root: dir({ 'root.txt': file('Groovy script console RCE confirmed — arbitrary OS command execution as the jenkins service user.\nflag{jenkins_script_console_equals_rce}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'net-mongodb-open',
    title: 'MongoDB Bound to 0.0.0.0 with No Auth',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Datastream Analytics configured db04 (10.10.102.4) with MongoDB 4.4.1 bound to all interfaces and no ' +
      'authentication enabled — the exact misconfiguration behind the "MongoDB ransom" mass-extortion wave ' +
      'that hit tens of thousands of exposed databases in the real world. Enumerate the exposed databases, ' +
      'then read the collection an attacker would go straight for.',
    objectives: [
      { text: 'nmap -sV 10.10.102.4', why: 'MongoDB\'s default port (27017) with no auth banner is an instantly recognizable, high-value finding during any external recon sweep.' },
      { text: 'curl 10.10.102.4:27017/', why: 'This mirrors an unauthenticated MongoDB status page — it lists every database name on the server, exactly what a real "show dbs" would return with no credentials required.' },
      { text: 'curl 10.10.102.4:27017/admin_backup/find', why: 'Once you see a database named admin_backup in the listing, querying its collections directly is the same technique behind real-world unauthenticated MongoDB data theft.' },
    ],
    hints: [
      'nmap -sV 10.10.102.4',
      'curl 10.10.102.4:27017/ — lists every database on the server, no login required.',
      'curl 10.10.102.4:27017/admin_backup/find — one of the listed databases is worth reading directly.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'db04', ip: '10.10.102.4', os: 'Debian 11',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 8.4p1' },
          {
            port: 27017, name: 'mongodb', version: 'MongoDB 4.4.1 (bindIp 0.0.0.0, no auth)',
            http: {
              '/': 'MongoDB 4.4.1 — It looks like you are trying to access MongoDB over HTTP on the native driver port.\ndatabases: analytics, sessions, admin_backup',
              '/admin_backup/find': '{"collection":"credentials","documents":[{"service":"aws","access_key":"AKIA-SIMULATED","note":"flag{mongodb_no_bindip_no_auth_full_read}"}]}',
            },
          },
        ],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'net-rsync-anon',
    title: 'Anonymous rsync Module Leaks Backups, Then SSH Foothold',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Palisade Sync Services published an rsync module named "backup" on sync05 (10.10.102.5) without ' +
      'restricting anonymous access — a classic misconfiguration that exposes an entire backup tree to ' +
      'anyone who connects, no credentials required. One of those backups still contains a live SSH ' +
      'credential that was never rotated after it was archived.',
    objectives: [
      { text: 'nmap -sV 10.10.102.5', why: 'Confirms rsync (873) and SSH (22) are both open before deciding where to focus enumeration.' },
      { text: 'ftp 10.10.102.5 (standing in for the anonymous rsync module for this exercise), then list the module contents', why: 'Anonymous rsync modules behave exactly like anonymous FTP for enumeration purposes — always check unauthenticated file-transfer services before anything else.' },
      { text: 'ftp-get 10.10.102.5 backup-credentials.txt', why: 'Backup archives routinely contain stale-but-still-valid credentials because nobody remembers to rotate secrets baked into an old backup job — this is a very common real foothold vector.' },
      { text: 'ssh sync-svc@10.10.102.5 using the recovered credential and capture user.txt', why: 'Confirms the leaked credential actually grants a working shell rather than just "looking like" a password.' },
    ],
    hints: [
      'nmap -sV 10.10.102.5',
      'ftp 10.10.102.5 — anonymous access is allowed, exactly like the exposed rsync module.',
      'ftp-get 10.10.102.5 backup-credentials.txt — one of the backup files still has a live SSH password in it.',
      'ssh sync-svc@10.10.102.5 with the recovered password, then cat user.txt.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'sync05', ip: '10.10.102.5', os: 'Ubuntu 18.04',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 7.6p1' },
          { port: 873, name: 'rsync', version: 'rsync 3.1.2 (anonymous module "backup")' },
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3 (anonymous, standing in for the rsync module)', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
        ],
        users: [{ username: 'sync-svc', password: 'B4ckupRun2022!' }],
        root: dir({
          srv: dir({ ftp: dir({ 'backup-credentials.txt': file('Archived backup-job credentials — DELETE AFTER ROTATION (nobody did).\nsync-svc SSH password: B4ckupRun2022!\n') }) }),
          home: dir({ 'sync-svc': dir({ 'user.txt': file('Foothold established via a stale credential left in an anonymously-readable backup.\nflag{anonymous_rsync_module_leaks_backups}\n') }) }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'net-smb-null-session',
    title: 'SMB Null Session Enumeration Leads to Domain Foothold',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Corbin Manufacturing never disabled legacy SMB null-session support on fileshare06 (10.10.102.6). Null ' +
      'sessions allow unauthenticated enumeration of shares and files — a technique dating back to early ' +
      'Windows NT that is still found on real internal networks today. A share readable this way holds a ' +
      'password that unlocks the host directly.',
    objectives: [
      { text: 'nmap -sV 10.10.102.6', why: 'Confirms SMB (445) is exposed and fingerprints the OS/service banner before attempting a null session.' },
      { text: 'ftp 10.10.102.6 (standing in for a null-session SMB share listing for this exercise)', why: 'A null session lets you list shares and files with zero credentials — the same class of access this anonymous connection models.' },
      { text: 'ftp-get 10.10.102.6 share-notes.txt', why: 'IT staff routinely leave setup notes with real credentials on shares they assume nobody outside the domain can reach — null sessions prove that assumption wrong.' },
      { text: 'crackmapexec smb 10.10.102.6 -u itadmin -p <recovered-password>', why: 'Validating a found credential against SMB with crackmapexec before trying anything else confirms it is live without risking an account lockout from repeated guessing.' },
      { text: 'ssh itadmin@10.10.102.6 and capture the flag', why: 'Confirms the enumerated credential grants an actual interactive foothold on the file server.' },
    ],
    hints: [
      'nmap -sV 10.10.102.6',
      'ftp 10.10.102.6 then ftp-get 10.10.102.6 share-notes.txt — models a null-session SMB share listing/download.',
      'crackmapexec smb 10.10.102.6 -u itadmin -p <the password from the notes file>',
      'ssh itadmin@10.10.102.6 then cat user.txt.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'fileshare06', ip: '10.10.102.6', os: 'Windows Server 2016',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (null sessions enabled)' },
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3 (anonymous, standing in for the null-session share)', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1 (management interface)' },
        ],
        users: [{ username: 'itadmin', password: 'C0rbinIT!2023' }],
        root: dir({
          srv: dir({ ftp: dir({ 'share-notes.txt': file('IT admin setup notes — internal use only.\nitadmin account password: C0rbinIT!2023\nNote: null sessions should have been disabled years ago.\n') }) }),
          home: dir({ itadmin: dir({ 'user.txt': file('SMB null session enumeration led straight to a live credential.\nflag{smb_null_session_leaked_the_share}\n') }) }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'net-telnet-default',
    title: 'IoT Telnet with Default Vendor Credentials',
    difficulty: 'Easy',
    category: 'Network',
    briefing:
      'Greenfield Facilities never rotated the vendor-default credentials on router07 (10.10.102.7), an ' +
      'embedded-Linux facilities device with Telnet enabled — the exact combination behind the Mirai botnet\'s ' +
      'mass compromise of IoT devices in 2016. Confirm the exposed service, then get in with the credentials ' +
      'every device of this model ships with.',
    objectives: [
      { text: 'nmap -sV 10.10.102.7', why: 'Telnet (23) still open on an embedded/IoT device is an immediate red flag — the protocol transmits credentials in cleartext and has no place on a modern network.' },
      { text: 'hydra -l admin -P /root/wordlists/mini-rockyou.txt ssh://10.10.102.7', why: 'This model targets the device\'s exposed management account with a small credential list — vendor-default and top-100-password reuse is exactly how most real IoT compromises begin, Mirai included.' },
      { text: 'ssh admin@10.10.102.7 with the recovered password and capture the flag', why: 'Confirms the default credential grants a working session on the device, the same as a real IoT compromise.' },
    ],
    hints: [
      'nmap -sV 10.10.102.7',
      'hydra -l admin -P /root/wordlists/mini-rockyou.txt ssh://10.10.102.7 — the password is a very common default.',
      'ssh admin@10.10.102.7 then cat user.txt.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'router07', ip: '10.10.102.7', os: 'Embedded Linux (IoT)',
        services: [
          { port: 23, name: 'telnet', version: 'Telnet (default vendor credentials, never rotated)' },
          { port: 22, name: 'ssh', version: 'Dropbear sshd 2019.78 (management interface)' },
        ],
        users: [{ username: 'admin', password: 'admin123' }],
        root: dir({ home: dir({ admin: dir({ 'user.txt': file('Vendor-default credentials strike again — the same weakness Mirai exploited at internet scale.\nflag{telnet_plus_default_creds_equals_instant_access}\n') }) }) }),
      } as HostDef,
    ],
  },
  {
    id: 'net-postgres-weak',
    title: 'PostgreSQL Weak, Reused Credentials',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Ledgerbrook Finance\'s database service on pgdb08 (10.10.102.8) accepts a weak password that was reused ' +
      'from the application server\'s SSH account — password reuse across services remains one of the most ' +
      'consistently exploited weaknesses in real environments. Brute-force the exposed account and get in.',
    objectives: [
      { text: 'nmap -sV 10.10.102.8', why: 'Confirms PostgreSQL (5432) is exposed directly to your attack box — databases should almost never be internet- or flat-network-reachable, which is itself a finding worth reporting.' },
      { text: 'hydra -l dbadmin -P /root/wordlists/mini-rockyou.txt ssh://10.10.102.8', why: 'This models a credential-stuffing attempt against the exposed database account using a small common-password list — the same technique used against real internet-facing databases constantly scanned by automated bots.' },
      { text: 'ssh dbadmin@10.10.102.8 with the cracked password and capture the flag', why: 'Confirms the weak password actually works end-to-end, not just that it matched a wordlist entry.' },
    ],
    hints: [
      'nmap -sV 10.10.102.8',
      'hydra -l dbadmin -P /root/wordlists/mini-rockyou.txt ssh://10.10.102.8',
      'ssh dbadmin@10.10.102.8 then cat user.txt.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'pgdb08', ip: '10.10.102.8', os: 'Ubuntu 20.04',
        services: [
          { port: 5432, name: 'postgresql', version: 'PostgreSQL 12.5' },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' },
        ],
        users: [{ username: 'dbadmin', password: 'dragon' }],
        root: dir({ home: dir({ dbadmin: dir({ 'user.txt': file('Password reuse between the app server and the database strikes again.\nflag{postgres_weak_creds_found_via_bruteforce}\n') }) }) }),
      } as HostDef,
    ],
  },
  {
    id: 'net-snmp-public',
    title: 'SNMP "public" Community String Leaks Network Config',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Ashcroft Networks never changed the default "public" read-only SNMP community string on switch09 ' +
      '(10.10.102.9) — one of the oldest, most consistently-found misconfigurations in network security ' +
      'assessments. Confirm the default string works, then walk the device\'s MIB tree for the sensitive ' +
      'entry hiding in plain sight.',
    objectives: [
      { text: 'nmap -sV 10.10.102.9', why: 'SNMP (161) open on a network appliance is worth checking immediately — community strings are frequently left at vendor defaults.' },
      { text: 'curl "10.10.102.9:161/walk?community=public&oid=1.3.6.1.2.1.1"', why: 'This mirrors running snmpwalk with the guessed default "public" string — if it returns data instead of a timeout/auth error, read access is confirmed with zero real authentication.' },
      { text: 'curl "10.10.102.9:161/walk?community=public&oid=1.3.6.1.4.1.9.9.109"', why: 'Once basic system info confirms "public" works, walking a vendor-specific enterprise OID branch is exactly how real assessments pull configuration secrets SNMP was never meant to expose.' },
    ],
    hints: [
      'nmap -sV 10.10.102.9',
      'curl "10.10.102.9:161/walk?community=public&oid=1.3.6.1.2.1.1" — confirms the default community string works.',
      'curl "10.10.102.9:161/walk?community=public&oid=1.3.6.1.4.1.9.9.109" — walks a vendor-specific branch holding the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'switch09', ip: '10.10.102.9', os: 'Network Appliance',
        services: [{
          port: 161, name: 'snmp', version: 'SNMP v2c (community string "public", read access)',
          http: {},
          vulnRoutes: [{
            kind: 'idor', path: '/walk', param: 'oid',
            triggerSubstrings: ['1.3.6.1.4.1.9.9.109'],
            vulnerableResponse: 'SNMPv2-SMI::enterprises.9.9.109.1.1.1.1.6.1 = "admin-console-password: N3twork_Adm1n_2024" \nflag{snmp_public_string_leaks_network_config}',
            normalResponse: 'SNMPv2-MIB::sysDescr.0 = "Ashcroft Networks Managed Switch, v4.1"\nSNMPv2-MIB::sysUpTime.0 = 481221900',
          }],
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'net-ftp-backdoor',
    title: 'vsftpd 2.3.4 — The Infamous Backdoored Build (CVE-2011-2523)',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Oldstone Logistics still runs legacy10 (10.10.102.10) on vsftpd 2.3.4 — a build whose source was ' +
      'trojaned between 2011-06-30 and 2011-07-03 so that sending a smiley face `:)` in the FTP USER field ' +
      'triggers a backdoor listener on port 6200 with a root shell. This is CVE-2011-2523, one of the most ' +
      'famous backdoors in vulnerability-scanning history and a staple target for exactly this reason. ' +
      'Recognizing the version number from a banner grab is the entire skill this lab tests.',
    objectives: [
      { text: 'nmap -sV 10.10.102.10', why: 'The version string alone — "vsftpd 2.3.4" — is the single most important piece of information here; recognizing famous vulnerable version strings from a banner is a core, fast recon skill.' },
      { text: 'curl 10.10.102.10:21', why: 'Grabbing the raw service banner confirms the exact build before committing to an exploit — real engagements always verify the version before firing an exploit that could otherwise crash the service for no reason.' },
      { text: 'exploit vsftpd-234-backdoor 10.10.102.10', why: 'This models sending the `:)` smiley trigger in the USER field, which the trojaned code interprets as a command to spawn a root shell listener on port 6200 — the real, documented mechanism behind CVE-2011-2523.' },
      { text: 'Once the session opens, read /root/root.txt to capture the flag', why: 'Confirms full unauthenticated remote root — the maximum-impact outcome this famous backdoor is known for.' },
    ],
    hints: [
      'nmap -sV 10.10.102.10 — the version number is the whole lab.',
      'curl 10.10.102.10:21 to confirm the raw banner reads exactly "vsftpd 2.3.4".',
      'exploit vsftpd-234-backdoor 10.10.102.10 — models the famous `:)` smiley-face backdoor trigger (CVE-2011-2523).',
      'Once the session opens you are root — check /root/root.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy10', ip: '10.10.102.10', os: 'CentOS 6',
        exploitableAs: 'vsftpd-234-backdoor',
        services: [{ port: 21, name: 'ftp', version: 'vsftpd 2.3.4', banner: 'vsftpd 2.3.4 ready' }],
        users: [],
        root: dir({ root: dir({ 'root.txt': file('CVE-2011-2523 confirmed — the trojaned vsftpd 2.3.4 backdoor spawned a root shell on port 6200.\nflag{vsftpd_2_3_4_is_a_famous_backdoor_cve}\n') }) }),
      } as HostDef,
    ],
  },
];
