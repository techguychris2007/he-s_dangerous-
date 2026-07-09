import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const capstoneBoxLab: LabScenario = {
  id: 'capstone-box',
  title: 'Capstone: Full Box Compromise',
  difficulty: 'Hard',
  category: 'Network',
  briefing:
    'Target 10.10.50.20 is a complete mini-engagement: recon, foothold, and privilege escalation. ' +
    'Run the full methodology from Module 3 — nmap, service enumeration, anonymous FTP, SSH access, ' +
    'and a sudo misconfiguration — to go from zero information to root.',
  objectives: [
    { text: 'Scan 10.10.50.20 with nmap -sV and enumerate every open service', why: 'This is the same first move on every engagement — you never assume what\'s running, you fingerprint it.' },
    { text: 'Use anonymous FTP (ftp / ftp-get) to find SSH credentials for user "sam"', why: 'Shared "deployment" passwords left in readme files are one of the most common real footholds — far more common than a zero-day exploit.' },
    { text: 'SSH in as sam and capture user.txt', why: 'Confirms the foothold actually works before you invest time in privilege escalation.' },
    { text: "Run 'sudo -l' to find a NOPASSWD misconfiguration", why: 'This is the single most important post-foothold command on Linux — it tells you exactly what you\'re allowed to run as root with no password, which is where most real privesc paths come from.' },
    { text: 'Escalate to root using the GTFOBins technique for the allowed binary (sudo /usr/bin/vim -c \':!/bin/sh\')', why: 'vim, like dozens of other common binaries, can spawn a shell — when sudo trusts it with NOPASSWD, that shell inherits root.' },
    { text: 'Capture root.txt', why: 'Proof of full compromise — in a real report, this is the evidence that turns "found a misconfiguration" into "achieved root."' },
  ],
  hints: [
    'nmap -sV 10.10.50.20 — start with a full version-scan, exactly like Module 3 taught.',
    'ftp 10.10.50.20 then ftp-get 10.10.50.20 <filename> to pull anything interesting from /srv/ftp.',
    'One of the FTP files contains an SSH password for the user "sam". ssh sam@10.10.50.20 to log in.',
    "Once logged in: cat user.txt, then run 'sudo -l' to see what sam can run as root.",
    "sam can run /usr/bin/vim as root with NOPASSWD. Check GTFOBins for vim's shell-escape technique: sudo /usr/bin/vim -c ':!/bin/sh'",
    'After escalating, you are root — read /root/root.txt to finish the lab.',
  ],
  totalFlags: 2,
  attacker: {
    hostname: 'kali',
    user: 'root',
    root: dir({
      root: dir({
        wordlists: dir({
          'mini-rockyou.txt': file('123456\npassword\nletmein\nadmin123\nqwerty\n'),
        }),
      }),
    }),
  },
  network: [
    {
      hostname: 'prodapp03',
      ip: '10.10.50.20',
      os: 'Ubuntu 18.04 LTS',
      services: [
        { port: 21, name: 'ftp', version: 'vsftpd 2.3.4', banner: 'vsftpd 2.3.4 ready', ftpAnonymous: true },
        { port: 22, name: 'ssh', version: 'OpenSSH 7.6p1 Ubuntu-4ubuntu0.7' },
        {
          port: 80,
          name: 'http',
          version: 'Apache httpd 2.4.29',
          http: { '/': '<html><body><h1>ProdApp — Internal Deployment Tool</h1></body></html>' },
        },
      ],
      users: [
        {
          username: 'sam',
          password: 'D3ploy!2018',
          sudo: { nopasswdCommands: ['/usr/bin/vim'] },
        },
      ],
      root: dir({
        srv: dir({
          ftp: dir({
            'deploy-readme.txt': file(
              'Deployment access for the ops team.\n' +
                'SSH in as sam using the shared deploy password: D3ploy!2018\n' +
                'Rotate this after the migration is finished (nobody ever does).\n',
            ),
          }),
        }),
        home: dir({
          sam: dir({
            'user.txt': file('Foothold established via leaked FTP credentials.\nflag{ftp_leaked_the_deploy_password}\n'),
          }),
        }),
        root: dir({
          'root.txt': file(
            'GTFOBins strikes again — a "harmless" sudo rule on vim is a full root compromise.\n' +
              'flag{sudo_vim_nopasswd_equals_root}\n',
          ),
        }),
      }),
    },
  ],
};
