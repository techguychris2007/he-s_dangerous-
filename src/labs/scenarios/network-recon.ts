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
    { text: 'Scan 10.10.20.5 with nmap -sV to enumerate all open ports/services', scene: 'The scope gives you one IP address and no service inventory. Choosing a web or login attack now would be guesswork.', question: 'Which TCP services answer on the target, and what software does each response appear to identify?', why: 'Version detection converts open port numbers into service and software hypotheses. That lets you choose the next protocol-aware action; it does not mean every returned version is vulnerable.', observe: 'Record port, state, service and version for every result. Notice that FTP, SSH and HTTP are different attack surfaces and that only one currently advertises a low-friction access path.', decision: 'Prioritise the service that exposes data with the least privilege, while retaining the other services as documented leads.' },
    { text: 'Connect to the FTP service anonymously with ftp 10.10.20.5', scene: 'Reconnaissance found an FTP listener. Before testing passwords or exploits, you need to determine whether the service intentionally or accidentally permits guest access.', question: 'Does the server accept anonymous access, and which files can that identity see?', why: 'Anonymous authentication is the least invasive, protocol-correct check for an FTP service. A successful login proves guest access; only the directory contents can establish whether that access exposes anything sensitive.', observe: 'Read the server response and file listing. Separate the harmless welcome file from a filename that suggests operational notes or backups.', decision: 'Choose the most relevant exposed file for retrieval and explain why listing access alone is not yet proof of sensitive-data exposure.' },
    { text: 'Retrieve and read the flag file with ftp-get 10.10.20.5 <filename>', scene: 'The anonymous directory listing contains an operational notes file. You must inspect it to determine whether the exposure has security impact.', question: 'Does the retrievable object contain information that should not be available to an unauthenticated user?', why: 'Retrieving a specifically identified file validates read access and reveals impact. On a real engagement you would minimise collection, document the exact object and stop once sufficient proof exists.', observe: 'Read both the business context and proof token. The token validates the lab; the security finding is unauthenticated access to an operational file.', decision: 'Conclude with the affected service, access condition, exposed object and a remediation that removes anonymous read access or separates public content.' },
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
