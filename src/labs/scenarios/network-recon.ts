import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const networkReconLab: LabScenario = {
  id: 'network-recon',
  title: 'Network Recon Challenge',
  difficulty: 'Easy',
  category: 'Network',
  briefing:
    'A single host, 10.10.20.5, sits in scope for this engagement. You have no other information. ' +
    'Scan it, identify every open service and its version, then use anonymous FTP access to retrieve ' +
    'a file left on the server containing the flag.',
  objectives: [
    { text: 'Scan 10.10.20.5 with nmap -sV to enumerate all open ports/services', why: '-sV fingerprints the exact software version behind each port instead of just the port number — that version string is what you\'d search for known CVEs against on a real engagement.' },
    { text: 'Connect to the FTP service anonymously with ftp 10.10.20.5', why: 'Anonymous FTP login is one of the most common real-world misconfigurations — always try it before anything else the moment you see port 21 open.' },
    { text: 'Retrieve and read the flag file with ftp-get 10.10.20.5 <filename>', why: 'This mirrors downloading a file over a real FTP session — attackers routinely find credentials, configs, or backups sitting in anonymous-accessible directories exactly like this.' },
  ],
  hints: [
    'nmap -sV 10.10.20.5 will show you every open port and fingerprint its version.',
    'Prefer speed first? masscan 10.10.20.5 or rustscan 10.10.20.5 finds open ports fast, then feed them into nmap -sV for the actual service/version detail.',
    "FTP (port 21) often allows anonymous login — try: ftp 10.10.20.5",
    "Once connected, use: ftp-get 10.10.20.5 <filename>  to pull and view a file's contents.",
    'Curious what filesrv01 resolves to by name? dig filesrv01 shows the DNS record DarkWorld tracks for this host.',
  ],
  totalFlags: 1,
  attacker: {
    hostname: 'kali',
    user: 'root',
    root: dir({
      root: dir({
        'wordlists': dir({
          'mini-rockyou.txt': file('123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\n'),
        }),
      }),
    }),
  },
  network: [
    {
      hostname: 'filesrv01',
      ip: '10.10.20.5',
      os: 'Ubuntu 20.04 LTS',
      services: [
        { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
        { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu-4ubuntu0.5' },
        { port: 80, name: 'http', version: 'Apache httpd 2.4.41', http: { '/': '<html><body><h1>File Server Co.</h1><p>Internal use only.</p></body></html>' } },
      ],
      users: [{ username: 'ftpuser', password: 'notused' }],
      root: dir({
        srv: dir({
          ftp: dir({
            'welcome.txt': file('Welcome to File Server Co. anonymous FTP.\nUpload/download for partners only.\n'),
            'backup-notes.txt': file(
              'Backup rotation moved to the new NAS as of last month.\n' +
                'Reminder: rotate the flag file quarterly.\n' +
                'flag{ftp_anonymous_login_strikes_again}\n',
            ),
          }),
        }),
      }),
    },
  ],
};
