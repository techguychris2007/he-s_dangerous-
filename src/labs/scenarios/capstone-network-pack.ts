import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

/** Network module capstone: one continuous five-flag chain from an anonymous-FTP misconfiguration all
 *  the way to an internal database server, instead of five isolated single-service labs. Every mechanic
 *  (anonymous FTP, ssh, sudo NOPASSWD, crackmapexec, credential reuse) is already established elsewhere
 *  on this platform; the point of a capstone is chaining them into one continuous narrative. */
export const networkCapstoneLabs: LabScenario[] = [
  {
    id: 'network-capstone-anonymous-ftp-to-internal-database',
    title: 'Capstone: Anonymous FTP Misconfiguration to Internal Database Compromise',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      "Solstice Logistics's edge FTP server still allows anonymous login — a decades-old misconfiguration " +
      'class that remains one of the single most common findings in real external network penetration tests, ' +
      'precisely because it is so easy to set up correctly and so easy to forget was ever left open. Nothing ' +
      'about this engagement needs a novel exploit: a forgotten backup-automation credential sitting in plain ' +
      'text on that anonymous share is the entire initial-access vector. Follow it all the way from the edge ' +
      'to whatever it actually reaches internally.',
    objectives: [
      {
        text: 'ftp 10.10.170.2 to confirm anonymous login is accepted, then list what it exposes',
        why: 'Confirming anonymous access actually works — rather than assuming from the open port alone — is the first real finding here, and it costs nothing to check.',
      },
      {
        text: 'ftp-get 10.10.170.2 backup-config.txt and capture the first flag',
        why: 'Real backup-automation scripts routinely hardcode a service credential directly into a config file because "it only runs on the internal network anyway" — the same reasoning that makes an anonymous FTP share exactly the wrong place to leave it.',
      },
      {
        text: 'ftp-get 10.10.170.2 network-diagram-notes.txt to see where that credential is valid',
        why: "Knowing a credential leaked is only half the finding — knowing exactly which host it's valid against is what turns it into an actual next step instead of a loose end.",
      },
      {
        text: 'ssh svc-netbackup@10.10.170.10 with the leaked credential, then cat user.txt for the second flag',
        why: 'Confirms the leaked credential is a live foothold, not just a stale entry nobody rotated.',
      },
      {
        text: 'Run sudo -l, escalate through the NOPASSWD rule it reveals, and capture the third flag',
        why: 'A diagnostics tool with unrestricted NOPASSWD sudo is a textbook real-world finding — convenient for whoever set it up, and just as convenient for whoever compromises the account it was scoped to.',
      },
      {
        text: 'As root, read the credential note left behind, then crackmapexec + ssh into 10.10.170.20 and capture the fourth flag',
        why: 'This is the actual pivot: the jump host was never itself the target, only ever a stepping stone toward whatever it can reach that the FTP server never could directly.',
      },
      {
        text: 'Read shipment-records-export.csv and capture the final flag',
        why: 'The concrete impact statement the whole chain was building toward — a single forgotten credential on a public-facing anonymous share, followed to its actual endpoint.',
      },
    ],
    hints: [
      'ftp 10.10.170.2',
      'ftp-get 10.10.170.2 backup-config.txt',
      'ftp-get 10.10.170.2 network-diagram-notes.txt',
      'ssh svc-netbackup@10.10.170.10',
      'N3tB4ckup_Auto!',
      'cat user.txt',
      'sudo -l',
      'sudo /usr/local/bin/netdiag --shell',
      'cat /root/internal-cred-note.txt',
      'exit',
      'crackmapexec smb 10.10.170.20 -u svc-dbreplica -p C0reDB_Repl1ca!',
      'ssh svc-dbreplica@10.10.170.20',
      'C0reDB_Repl1ca!',
      'cat user.txt',
      'cat shipment-records-export.csv',
    ],
    totalFlags: 5,
    attacker: attacker(),
    network: [
      {
        hostname: 'edge-ftp01',
        ip: '10.10.170.2',
        os: 'Debian 11 (edge file transfer server)',
        services: [{ port: 21, name: 'ftp', version: 'vsftpd 3.0.5', banner: 'vsftpd 3.0.5 ready', ftpAnonymous: true }],
        users: [],
        root: dir({
          srv: dir({
            ftp: dir({
              'backup-config.txt': file(
                [
                  '# nightly-backup.sh automation config — left on the anonymous share "since it only runs internally"',
                  'BACKUP_USER=svc-netbackup',
                  'BACKUP_PASS=N3tB4ckup_Auto!',
                  'TARGET_HOST=10.10.170.10',
                  '--- flag: this is the actual leak, sitting on a share anyone can read with zero credentials ---',
                  'flag{anonymous_ftp_exposes_plaintext_backup_service_credential}',
                  '',
                ].join('\n'),
              ),
              'network-diagram-notes.txt': file(
                [
                  '--- informal network notes, last updated by an admin who has since left ---',
                  'jump-host01 (10.10.170.10) — the svc-netbackup account has SSH rights here for nightly automation',
                  'core-db01 (10.10.170.20) — internal only, NOT directly reachable from the edge segment',
                  '',
                ].join('\n'),
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'jump-host01',
        ip: '10.10.170.10',
        os: 'Ubuntu 20.04 LTS (internal jump host)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' }],
        users: [
          {
            username: 'svc-netbackup',
            password: 'N3tB4ckup_Auto!',
            sudo: { nopasswdCommands: ['/usr/local/bin/netdiag'] },
          },
        ],
        root: dir({
          home: dir({
            'svc-netbackup': dir({
              'user.txt': file(
                'SSH foothold confirmed on jump-host01 using the credential leaked from the anonymous FTP share.\n' +
                  'flag{ftp_leaked_credential_grants_jump_host_foothold}\n',
              ),
            }),
          }),
          root: dir({
            'internal-cred-note.txt': file(
              [
                'Root shell spawned via sudo /usr/local/bin/netdiag --shell (NOPASSWD, scoped for on-call diagnostics).',
                'flag{netdiag_nopasswd_sudo_gtfobins_root}',
                '',
                'Reminder to self: core-db01 (10.10.170.20) replica account — svc-dbreplica / C0reDB_Repl1ca!',
                '(only reachable from inside this segment, which is exactly why it was never rotated)',
                '',
              ].join('\n'),
            ),
          }),
        }),
      } as HostDef,
      {
        hostname: 'core-db01',
        ip: '10.10.170.20',
        os: 'Ubuntu 20.04 LTS (internal database replica)',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' },
          { port: 445, name: 'microsoft-ds', version: 'Samba 4.11 (SMB)' },
        ],
        users: [{ username: 'svc-dbreplica', password: 'C0reDB_Repl1ca!' }],
        root: dir({
          home: dir({
            'svc-dbreplica': dir({
              'user.txt': file(
                'Lateral movement confirmed onto core-db01, an internal-only host never reachable from the edge segment directly.\n' +
                  'flag{jump_host_pivot_reaches_internal_only_database_replica}\n',
              ),
              'shipment-records-export.csv': file(
                [
                  '# synthetic data — nightly replica export',
                  'shipment_id,customer,origin,destination,value_usd',
                  '88213,REDACTED,Rotterdam,Chicago,142000',
                  '88214,REDACTED,Busan,Long Beach,96500',
                  '--- 3,118 total shipment records exposed by following one forgotten anonymous-FTP credential ---',
                  'flag{anonymous_ftp_to_internal_database_full_chain_confirmed}',
                  '',
                ].join('\n'),
              ),
            }),
          }),
        }),
      } as HostDef,
    ],
  },
];
