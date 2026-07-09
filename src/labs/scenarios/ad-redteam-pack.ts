import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

const WORDLIST = '123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n';

function attackerBox() {
  return {
    hostname: 'kali',
    user: 'root',
    root: dir({ root: dir({ wordlists: dir({ 'mini-rockyou.txt': file(WORDLIST) }) }) }),
  };
}

export const adRedteamLabs: LabScenario[] = [
  {
    id: 'ad-smb-anon-domain-creds',
    title: 'AD: SMB Share Leaks Domain Credentials',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL\'s file server (10.10.104.1) has an anonymous-readable SMB share left over from a migration. ' +
      'Somewhere in it is a config file with a service account password valid across the domain. That account, ' +
      '"svc_backup", is provisioned once and reused verbatim everywhere its function is needed — including a ' +
      'Linux backup relay (10.10.104.50) that nightly rsyncs the file server\'s shares offsite. A leaked domain ' +
      'credential is rarely a one-host problem; find out where else it opens doors.',
    objectives: [
      { text: 'Scan 10.10.104.1 and confirm SMB (445) and FTP (21) are open', why: 'Version/port scanning first tells you which protocol actually holds the leaked file before you go hunting blind — here the anonymous-FTP-accessible directory stands in for the misconfigured SMB share.' },
      { text: 'Pull the leaked config file via anonymous FTP (standing in for the SMB share for this exercise)', why: 'Anonymous read access on file shares is one of the most common real-world AD findings — engineers leave migration scaffolding readable long after the migration is "done."' },
      { text: 'Validate the recovered credential against FILESRV01 with crackmapexec', why: 'Confirms the credential is real and current before using it anywhere else — exactly what a careful operator does before risking an account lockout policy.' },
      { text: 'Validate the same svc_backup credential against the backup relay (10.10.104.50) and SSH in', why: 'Service accounts are almost never scoped to a single box — this relay is the account\'s actual job, and password reuse across heterogeneous infrastructure (Windows share + Linux backup host) is exactly how one small leak turns into a second foothold.' },
      { text: "Run 'sudo -l' on the relay and escalate to root through the NOPASSWD tar rule", why: 'A stale NOPASSWD rule on tar — almost certainly left behind so an unattended backup-verification cron job could run without prompting for a password — is a classic GTFOBins privilege escalation: tar can be told to run an arbitrary command via its --checkpoint-action hook.' },
      { text: 'Read /root/root.txt on the relay to capture the second flag', why: 'Root on the backup relay means full read access to every archive it stores — in a real engagement this is often where domain-wide backups of NTDS.dit or GPO data live, making this box far more valuable than the file server you started on.' },
    ],
    hints: [
      'nmap -sV 10.10.104.1',
      'enum4linux 10.10.104.1 or smbclient 10.10.104.1 lists what SMB shares exist on the box before you dive in.',
      'ftp 10.10.104.1 then ftp-get 10.10.104.1 migration-config.txt',
      'crackmapexec smb 10.10.104.1 -u svc_backup -p <password-you-found>',
      'crackmapexec smb 10.10.104.50 -u svc_backup -p <password-you-found>, then ssh svc_backup@10.10.104.50',
      "sudo -l once logged in — there's a NOPASSWD rule on /usr/bin/tar. Escalate with: sudo /usr/bin/tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh",
      'cat /root/root.txt',
    ],
    totalFlags: 2,
    attacker: attackerBox(),
    network: [
      {
        hostname: 'FILESRV01',
        ip: '10.10.104.1',
        os: 'Windows Server 2019',
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3 (temporary migration service)', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 445, name: 'microsoft-ds', version: 'SMB (Windows Server 2019)' },
        ],
        users: [{ username: 'svc_backup', password: 'B4ckupSvc2024!' }],
        root: dir({
          srv: dir({
            ftp: dir({
              'migration-config.txt': file(
                'Legacy migration script config — DELETE AFTER MIGRATION (nobody did).\n' +
                  'svc_backup domain service account password: B4ckupSvc2024!\n' +
                  'flag{smb_share_leaked_domain_service_account}\n',
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'BKUPLNX01',
        ip: '10.10.104.50',
        os: 'Ubuntu 20.04 (Linux backup relay, domain-joined via SSSD)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' }],
        users: [{ username: 'svc_backup', password: 'B4ckupSvc2024!', sudo: { nopasswdCommands: ['/usr/bin/tar'] } }],
        root: dir({
          home: dir({ svc_backup: dir({}) }),
          root: dir({
            'root.txt': file(
              'A leftover NOPASSWD tar rule (for an unattended backup-verification cron job) was root all along.\n' +
                'flag{tar_gtfobins_backup_relay_root}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-kerberoast-crack',
    title: 'AD: Kerberoasting a Service Account',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'You have a low-privilege domain account. A Kerberoasting attempt against CORP.LOCAL\'s domain controller ' +
      '(10.10.104.2) has already pulled a service ticket, and offline cracking recovered a candidate password — ' +
      'confirm it and use it to access the domain controller directly. Once you\'re in, remember that Kerberoasted ' +
      'SQL service accounts are frequently over-permissioned: DBAs troubleshooting AD-integrated login failures ' +
      'routinely get themselves added to groups with directory-replication rights just to make an error go away, ' +
      'and nobody ever revokes it afterward.',
    objectives: [
      { text: 'Scan 10.10.104.2 and identify it as a domain controller (SMB + SSH exposed for management)', why: 'Confirms the target role before attacking — Kerberoasting only makes sense against a domain controller\'s Kerberos services.' },
      { text: 'Review the cracked ticket notes on your attack box', why: 'In a real engagement this step is offline hashcat work against a captured TGS-REP; this lab starts you right after that cracking finished.' },
      { text: 'Validate the cracked service account password with crackmapexec, then SSH in to confirm access', why: 'Validate before connecting interactively — this is standard operator hygiene to avoid tripping lockout thresholds on an account you only get one shot at.' },
      { text: 'Run secretsdump svc_sql:SqlSvc2019!@10.10.104.2 to check svc_sql\'s replication rights', why: 'This mirrors the real Impacket secretsdump/DCSync technique — asking the DC to "replicate" its credential database to you. It only succeeds because svc_sql was mistakenly granted Replicating Directory Changes rights, exactly the kind of over-grant a BloodHound review would flag as a top attack path.' },
      { text: 'Locate the Administrator hash in the dump and capture the second flag', why: 'Walking away with the Administrator NT hash means pass-the-hash domain admin access from here on — no password cracking required at all, which is what makes DCSync-capable service accounts so dangerous when scoped incorrectly.' },
    ],
    hints: [
      'cat /root/kerberoast-notes.txt on your attack box — the cracked password is already there.',
      'crackmapexec smb 10.10.104.2 -u svc_sql -p <cracked-password>',
      'ssh svc_sql@10.10.104.2 then cat user.txt',
      'secretsdump svc_sql:SqlSvc2019!@10.10.104.2',
      'The Administrator line in the dump is the one that matters most — that\'s your second flag.',
    ],
    totalFlags: 2,
    attacker: {
      hostname: 'kali',
      user: 'root',
      root: dir({
        root: dir({
          wordlists: dir({ 'mini-rockyou.txt': file(WORDLIST) }),
          'kerberoast-notes.txt': file(
            'Kerberoasting run against CORP.LOCAL completed offline with hashcat.\n' +
              'SPN account: svc_sql\n' +
              'Cracked password: SqlSvc2019!\n',
          ),
        }),
      }),
    },
    network: [
      {
        hostname: 'DC01',
        ip: '10.10.104.2',
        os: 'Windows Server 2019 (Domain Controller)',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.1 (management access)' },
        ],
        users: [{ username: 'svc_sql', password: 'SqlSvc2019!', canDcsync: true }],
        ntdsHashes:
          'corp.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:flag{svc_sql_replication_rights_dcsync_admin_hash}:::\n' +
          'corp.local\\svc_sql:1108:aad3b435b51404eeaad3b435b51404ee:c8e7c1d9a5c3d0b1e7f5a9c2d4b6e8f0:::\n' +
          'corp.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::',
        root: dir({
          home: dir({
            svc_sql: dir({
              'user.txt': file('Kerberoasting confirmed — service account cracked offline.\nflag{kerberoasting_offline_crack_confirmed}\n'),
            }),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-credential-reuse-lateral',
    title: 'AD: Credential Reuse & Lateral Movement',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'You captured local admin credentials from a compromised workstation. CORP.LOCAL reuses the same local ' +
      'admin password across many machines — sweep the subnet to find where else it works, then move laterally. ' +
      'Once you\'re local admin on a workstation, check Windows Credential Manager: it caches passwords used for ' +
      'past RDP and network sessions so users don\'t have to retype them, and it\'s common for IT/domain-admin ' +
      'staff to have RDP\'d in at some point to resolve a ticket — leaving exactly that kind of cached credential ' +
      'behind for whoever gets local admin next.',
    objectives: [
      { text: 'Sweep 10.10.104.0/24-style hosts with crackmapexec using the captured credential', why: 'A single reused local-admin password is one of the most common real findings on an internal pentest — sweeping quickly reveals the true blast radius of one leaked credential.' },
      { text: 'Identify which host the credential also works on', why: 'Knowing exactly where a credential is valid (and where it is not) is what separates a targeted lateral move from noisy, lockout-risking guesswork.' },
      { text: 'SSH into that host and capture the first flag', why: 'Confirms interactive local-admin access on the second host — the actual foothold this stage of the attack was after.' },
      { text: 'Read the cached RDP session note in Credential Manager (cat saved-rdp-session.txt)', why: 'Local admin rights let you read the Credential Manager vault for every account that has ever logged on interactively — if a domain admin ever RDP\'d in here for support, their credential is sitting right there.' },
      { text: 'Validate the cached domain admin credential against the domain controller (10.10.104.10) with crackmapexec, then SSH in to capture the second flag', why: 'This is the exact moment lateral movement becomes full domain compromise — one careless RDP session for a help-desk ticket handed you the keys to the domain controller.' },
    ],
    hints: [
      'crackmapexec smb 10.10.104.3 -u administrator -p Winter2024!',
      'crackmapexec smb 10.10.104.4 -u administrator -p Winter2024!  (try each host)',
      'Whichever host accepts the credential, ssh administrator@<ip> and read user.txt',
      'cat saved-rdp-session.txt once logged in — it contains a cached domain admin credential.',
      'crackmapexec smb 10.10.104.10 -u svc_dcadmin -p <cached-password>, then ssh svc_dcadmin@10.10.104.10',
    ],
    totalFlags: 2,
    attacker: attackerBox(),
    network: [
      {
        hostname: 'WKSTN-014',
        ip: '10.10.104.3',
        os: 'Windows 10',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Windows 10)' }],
        users: [{ username: 'administrator', password: 'DifferentPassword1!' }],
        root: dir({}),
      } as HostDef,
      {
        hostname: 'WKSTN-027',
        ip: '10.10.104.4',
        os: 'Windows 10',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Windows 10)' },
          { port: 22, name: 'ssh', version: 'OpenSSH for Windows 8.1' },
        ],
        users: [{ username: 'administrator', password: 'Winter2024!' }],
        root: dir({
          home: dir({
            administrator: dir({
              'user.txt': file('Local admin password reuse confirmed across the fleet.\nflag{local_admin_password_reuse_lateral_movement}\n'),
              'saved-rdp-session.txt': file(
                'Credential Manager — cached generic credential (last used for an RDP support session):\n' +
                  'corp.local\\svc_dcadmin : Rdp_C4che_2024!\n',
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'DC-SUPPORT',
        ip: '10.10.104.10',
        os: 'Windows Server 2019 (Domain Controller)',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.6 (management access)' },
        ],
        users: [{ username: 'svc_dcadmin', password: 'Rdp_C4che_2024!' }],
        root: dir({
          home: dir({
            svc_dcadmin: dir({
              'root.txt': file(
                'A single cached RDP credential in a workstation\'s Credential Manager reached the domain controller.\n' +
                  'flag{cached_rdp_credential_reaches_domain_controller}\n',
              ),
            }),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-asrep-roast',
    title: 'AD: AS-REP Roasting a Weak Account',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A CORP.LOCAL account has Kerberos pre-authentication disabled — meaning its credential material can be ' +
      'requested and cracked offline with zero prior domain access. Confirm the cracked password and log in. ' +
      'From there, this domain controller (10.10.104.5) has never applied the 2021 fixes for the "noPac" chain ' +
      '(CVE-2021-42287 combined with CVE-2021-42278): any authenticated domain user — even one with no special ' +
      'rights at all — can rename a machine account to spoof a domain controller\'s identity and request a ' +
      'Kerberos ticket as Administrator. AS-REP roasting got you a valid domain credential with zero prior ' +
      'access; noPac is what turns that single low-privilege credential into full domain compromise.',
    objectives: [
      { text: 'Read the AS-REP roasting output already captured on your attack box', why: 'In a real intrusion this step is an offline hashcat crack of a captured AS-REP; this lab starts you right after that finished.' },
      { text: 'Validate the recovered credential against the domain controller', why: 'Confirms the cracked password is live and current before relying on it for anything further.' },
      { text: 'Access the account and capture the first flag', why: 'AS-REP roasting requires zero prior domain access to begin with — that is precisely what makes disabled Kerberos pre-authentication so dangerous.' },
      { text: 'Escalate with exploit nopac 10.10.104.5', why: 'The real noPac chain abuses the fact that any domain user can create/rename a machine account with a trailing "$" stripped from its name so it collides with the DC\'s own sAMAccountName, then requests a ticket that Kerberos resolves to the domain controller\'s identity instead — netting a ticket for Administrator from an account with otherwise zero privileges.' },
      { text: 'Confirm the resulting session and capture the second flag', why: 'This is why noPac was rated critical the moment it was disclosed: unlike Zerologon, it needs no unauthenticated network position at all, just any one valid (even a Kerberoast-weak or AS-REP-roastable) domain credential — exactly the kind this lab handed you first.' },
    ],
    hints: [
      'cat /root/asrep-output.txt',
      'crackmapexec smb 10.10.104.5 -u jsmith -p <cracked-password>',
      'ssh jsmith@10.10.104.5 then cat user.txt',
      'exploit nopac 10.10.104.5',
      'Once the session opens you are Administrator — check /root/root.txt for the second flag.',
    ],
    totalFlags: 2,
    attacker: {
      hostname: 'kali',
      user: 'root',
      root: dir({
        root: dir({
          wordlists: dir({ 'mini-rockyou.txt': file(WORDLIST) }),
          'asrep-output.txt': file(
            'AS-REP roast against CORP.LOCAL — account jsmith has preauth disabled.\n' +
              'Hash cracked offline: Password1!\n',
          ),
        }),
      }),
    },
    network: [
      {
        hostname: 'DC02',
        ip: '10.10.104.5',
        os: 'Windows Server 2016 (Domain Controller, missing Nov 2021 noPac fix)',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
          { port: 22, name: 'ssh', version: 'OpenSSH 7.6 (management access)' },
        ],
        users: [{ username: 'jsmith', password: 'Password1!' }],
        exploitableAs: 'nopac',
        root: dir({
          home: dir({
            jsmith: dir({
              'user.txt': file('AS-REP roasting requires zero prior credentials — and it worked.\nflag{asrep_roast_no_preauth_required}\n'),
            }),
          }),
          root: dir({
            'root.txt': file(
              'noPac (CVE-2021-42287 + CVE-2021-42278) turned one weak roastable account into Administrator.\n' +
                'flag{nopac_sam_spoofing_domain_admin}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-workstation-to-dc',
    title: 'AD Capstone: Workstation to Domain Admin',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'Full chain: start with a low-privilege foothold on a domain workstation, escalate locally via a sudo ' +
      'misconfiguration, recover a cached domain admin credential, then use it against the domain controller.',
    objectives: [
      { text: 'Scan 10.10.104.6 and gain SSH access as "helpdesk" using anonymous FTP-leaked credentials', why: 'Domain-joined workstations are usually softer targets than the domain controller itself — this is why real intrusions almost never start at the DC.' },
      { text: "Run 'sudo -l' and escalate to root via the NOPASSWD rule", why: 'Local root on a domain-joined box is valuable specifically because it can expose cached credentials from prior logons.' },
      { text: 'As root, read the cached domain admin credential', why: 'Windows and domain-joined Linux hosts often cache recent credentials for offline login — root access lets you read what a normal user never could.' },
      { text: 'Use crackmapexec/ssh to access 10.10.104.7 (the domain controller) as domain admin', why: 'This is the moment a single compromised workstation becomes full domain compromise — validate the credential with crackmapexec first, exactly as a real operator would, before using it to log in.' },
    ],
    hints: [
      'ftp 10.10.104.6 then ftp-get 10.10.104.6 notes.txt for the helpdesk SSH password.',
      "sudo -l once logged in as helpdesk — there's a NOPASSWD rule on /usr/bin/python3.",
      `sudo /usr/bin/python3 -c 'import os; os.system("/bin/sh")' to get root, then cat /root/cached-creds.txt`,
      'crackmapexec smb 10.10.104.7 -u domainadmin -p <cached-password>, then ssh domainadmin@10.10.104.7',
    ],
    totalFlags: 2,
    attacker: attackerBox(),
    network: [
      {
        hostname: 'WKSTN-HELPDESK',
        ip: '10.10.104.6',
        os: 'Ubuntu 20.04 (domain-joined via SSSD)',
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' },
        ],
        users: [{ username: 'helpdesk', password: 'H3lpD3sk2024', sudo: { nopasswdCommands: ['/usr/bin/python3'] } }],
        root: dir({
          srv: dir({ ftp: dir({ 'notes.txt': file('Helpdesk SSH password: H3lpD3sk2024\n') }) }),
          home: dir({
            helpdesk: dir({ 'user.txt': file('Foothold on the domain workstation established.\nflag{workstation_foothold_via_ftp_leak}\n') }),
          }),
          root: dir({
            'cached-creds.txt': file(
              'Cached domain admin credential (last interactive logon artifact):\n' +
                'domainadmin : DA_Cr3d2024!\n',
            ),
          }),
        }),
      } as HostDef,
      {
        hostname: 'DC-MAIN',
        ip: '10.10.104.7',
        os: 'Windows Server 2022 (Domain Controller)',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.6 (management access)' },
        ],
        users: [{ username: 'domainadmin', password: 'DA_Cr3d2024!' }],
        root: dir({
          home: dir({
            domainadmin: dir({
              'root.txt': file('Full domain compromise achieved via cached credential reuse.\nflag{cached_credential_equals_domain_admin}\n'),
            }),
          }),
        }),
      } as HostDef,
    ],
  },
];
