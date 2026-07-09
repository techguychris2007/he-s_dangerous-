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
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL\'s file server (10.10.104.1) has an anonymous-readable SMB share left over from a migration. ' +
      'Somewhere in it is a config file with a service account password valid across the domain.',
    objectives: [
      'Scan 10.10.104.1 and confirm SMB (445) and FTP (21) are open',
      'Pull the leaked config file via anonymous FTP (standing in for the SMB share for this exercise)',
      'Validate the recovered credential against SMB with crackmapexec',
    ],
    hints: [
      'nmap -sV 10.10.104.1',
      'ftp 10.10.104.1 then ftp-get 10.10.104.1 migration-config.txt',
      'crackmapexec smb 10.10.104.1 -u svc_backup -p <password-you-found>',
    ],
    totalFlags: 1,
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
      'confirm it and use it to access the domain controller directly.',
    objectives: [
      'Scan 10.10.104.2 and identify it as a domain controller (SMB + SSH exposed for management)',
      'Review the cracked ticket notes on your attack box',
      'Validate the cracked service account password with crackmapexec, then SSH in to confirm access',
    ],
    hints: [
      'cat /root/kerberoast-notes.txt on your attack box — the cracked password is already there.',
      'crackmapexec smb 10.10.104.2 -u svc_sql -p <cracked-password>',
      'ssh svc_sql@10.10.104.2 then cat user.txt',
    ],
    totalFlags: 1,
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
        users: [{ username: 'svc_sql', password: 'SqlSvc2019!' }],
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
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'You captured local admin credentials from a compromised workstation. CORP.LOCAL reuses the same local ' +
      'admin password across many machines — sweep the subnet to find where else it works, then move laterally.',
    objectives: [
      'Sweep 10.10.104.0/24-style hosts with crackmapexec using the captured credential',
      'Identify which host the credential also works on',
      'SSH into that host and capture the flag',
    ],
    hints: [
      'crackmapexec smb 10.10.104.3 -u administrator -p Winter2024!',
      'crackmapexec smb 10.10.104.4 -u administrator -p Winter2024!  (try each host)',
      'Whichever host accepts the credential, ssh administrator@<ip> and read user.txt',
    ],
    totalFlags: 1,
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
            }),
          }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'ad-asrep-roast',
    title: 'AD: AS-REP Roasting a Weak Account',
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'A CORP.LOCAL account has Kerberos pre-authentication disabled — meaning its credential material can be ' +
      'requested and cracked offline with zero prior domain access. Confirm the cracked password and log in.',
    objectives: [
      'Read the AS-REP roasting output already captured on your attack box',
      'Validate the recovered credential against the domain controller',
      'Access the account and capture the flag',
    ],
    hints: [
      'cat /root/asrep-output.txt',
      'crackmapexec smb 10.10.104.5 -u jsmith -p <cracked-password>',
      'ssh jsmith@10.10.104.5 then cat user.txt',
    ],
    totalFlags: 1,
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
        os: 'Windows Server 2016 (Domain Controller)',
        services: [
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' },
          { port: 22, name: 'ssh', version: 'OpenSSH 7.6 (management access)' },
        ],
        users: [{ username: 'jsmith', password: 'Password1!' }],
        root: dir({
          home: dir({
            jsmith: dir({
              'user.txt': file('AS-REP roasting requires zero prior credentials — and it worked.\nflag{asrep_roast_no_preauth_required}\n'),
            }),
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
