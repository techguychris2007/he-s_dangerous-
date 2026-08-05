import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Linux module capstone: one continuous five-flag chain (leaked credential -> foothold -> sudo-GTFOBins
 *  privesc -> credential-reuse lateral movement -> a SECOND, deliberately different privesc mechanism
 *  (SUID binary, not sudo) -> final sensitive-data access) across two hosts, instead of six isolated
 *  single-technique labs. Every mechanic reused as-is from already-established Linux-category labs. */
export const linuxCapstoneLabs: LabScenario[] = [
  {
    id: 'linux-capstone-ci-leak-to-database-compromise',
    title: 'Capstone: Leaked CI Credential to Full Database Server Compromise',
    difficulty: 'Hard',
    category: 'Linux',
    briefing:
      "Ferrowatt Manufacturing's build pipeline logged a deployment step's full command line, secrets and " +
      'all, to a build artifact that ended up in a public bucket for three weeks before anyone noticed — ' +
      'exactly the class of leak that shows up constantly in real breach post-mortems (Uber\'s 2022 breach ' +
      'started from a similarly mundane credential exposure). Starting from that one leaked SSH password, work ' +
      'the full chain a real engagement would: land the foothold, escalate to root through a misconfigured ' +
      'sudo rule, use what root reveals to move laterally onto a second box via password reuse, escalate again ' +
      'there through a completely different mechanism (a SUID binary, not sudo this time), and confirm exactly ' +
      "what's exposed at the end of the chain.",
    objectives: [
      {
        text: 'Review the leaked CI log on your attack box: cat leaked-ci-log.txt',
        why: 'This is the actual root cause of the whole chain — a routine deploy step logging its own full command line, secrets included, is one of the most common real-world initial-access vectors, far more common than a novel exploit.',
      },
      {
        text: 'ssh ci-runner@10.10.160.5 using the leaked password, then cat user.txt for the first flag',
        why: 'Confirms the leaked credential is a live, working foothold — not just theoretically bad practice sitting in a log file.',
      },
      {
        text: "Run sudo -l, then escalate through the NOPASSWD rule it reveals and capture the second flag",
        why: "A build box needs SOME elevated tooling to do its job — the problem is scoping it loosely enough that the tool itself becomes a root shell, the single most common real-world sudo misconfiguration.",
      },
      {
        text: 'As root, read internal-notes.txt and note the second host and credential it reveals',
        why: "Root access to one box is rarely the actual goal — it's a vantage point. Admins document infrastructure for their own convenience, and that documentation is exactly what a real intruder goes looking for first.",
      },
      {
        text: 'ssh svc-dbadmin@10.10.160.9 with the reused password, then cat user.txt for the third flag',
        why: 'Confirms the credential-reuse pattern the notes described actually works — the second most common way one compromised box becomes two, right after phishing.',
      },
      {
        text: 'Run /usr/bin/backup-snapshot directly to use its SUID-root bit, and capture the fourth flag',
        why: "A deliberately different privesc mechanism from the first host's sudo misconfiguration — SUID binaries are just as common a real-world finding, and treating every box as 'probably the same bug as last time' is exactly the assumption that makes engagements slower than they need to be.",
      },
      {
        text: 'Read customer-records-export.csv and capture the final flag',
        why: 'This is the actual impact statement a real engagement report ends on: not "we got root," but the specific, concrete data root access exposed.',
      },
    ],
    hints: [
      'cat leaked-ci-log.txt',
      'ssh ci-runner@10.10.160.5',
      'BuildPipeline#24',
      'cat user.txt',
      'sudo -l',
      'sudo /usr/local/bin/pkg-sync-tool --shell',
      'cat /root/root.txt',
      'cat /root/internal-notes.txt',
      'exit',
      'ssh svc-dbadmin@10.10.160.9',
      'DbAdm1n_Ferro24!',
      'cat user.txt',
      '/usr/bin/backup-snapshot',
      'cat /root/root.txt',
      'cat /root/customer-records-export.csv',
    ],
    totalFlags: 5,
    attacker: attacker({
      'leaked-ci-log.txt': file(
        [
          '--- build-srv01 deploy pipeline, run #4471 (publicly readable for ~3 weeks before rotation) ---',
          "[deploy] Executing: ssh ci-runner@10.10.160.5 -o BatchMode=no ... (password entered interactively, echoed to this log by a misconfigured verbose flag)",
          '[deploy] Password: BuildPipeline#24',
          '--- end of leaked fragment ---',
          '',
        ].join('\n'),
      ),
    }),
    network: [
      {
        hostname: 'build-srv01',
        ip: '10.10.160.5',
        os: 'Ubuntu 22.04 LTS (CI/CD build agent)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' }],
        users: [
          {
            username: 'ci-runner',
            password: 'BuildPipeline#24',
            sudo: { nopasswdCommands: ['/usr/local/bin/pkg-sync-tool'] },
          },
        ],
        root: dir({
          home: dir({
            'ci-runner': dir({
              'user.txt': file(
                'SSH foothold confirmed on build-srv01 using the credential leaked in a public CI build log.\n' +
                  'flag{ci_runner_ssh_foothold_via_leaked_pipeline_credential}\n',
              ),
            }),
          }),
          root: dir({
            'root.txt': file(
              "Root shell spawned via 'sudo /usr/local/bin/pkg-sync-tool --shell' — a NOPASSWD rule meant for " +
                "routine package syncing, never audited for what the tool itself is actually capable of.\n" +
                'flag{pkg_sync_tool_nopasswd_sudo_gtfobins_root}\n',
            ),
            'internal-notes.txt': file(
              [
                "Reminder for the next infra rotation (never actioned):",
                'db-srv02 (10.10.160.9) — svc-dbadmin / DbAdm1n_Ferro24!',
                '(password reused from the same rotation batch as this box\'s old root password — flag for next audit)',
                '',
              ].join('\n'),
            ),
          }),
        }),
      } as HostDef,
      {
        hostname: 'db-srv02',
        ip: '10.10.160.9',
        os: 'Ubuntu 22.04 LTS (internal database server)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' }],
        users: [{ username: 'svc-dbadmin', password: 'DbAdm1n_Ferro24!' }],
        suidBinary: '/usr/bin/backup-snapshot',
        root: dir({
          home: dir({
            'svc-dbadmin': dir({
              'user.txt': file(
                'Lateral movement confirmed on db-srv02 via the password reuse documented on build-srv01.\n' +
                  'flag{credential_reuse_lateral_movement_to_db_srv02}\n',
              ),
            }),
          }),
          root: dir({
            'root.txt': file(
              "Root shell spawned by directly executing /usr/bin/backup-snapshot — SUID-root, installed for an " +
                "unattended nightly backup job and never re-reviewed since.\n" +
                'flag{backup_snapshot_suid_root_binary_privesc}\n',
            ),
            'customer-records-export.csv': file(
              [
                '# synthetic data — nightly export staged by the same backup job whose SUID bit just granted root',
                'customer_id,name,email,plan',
                '10041,REDACTED,REDACTED,enterprise',
                '10042,REDACTED,REDACTED,enterprise',
                '--- 6,204 total records in this export — this is the full, concrete impact statement ---',
                'flag{full_chain_ends_in_customer_database_export_exposure}',
                '',
              ].join('\n'),
            ),
          }),
        }),
      } as HostDef,
    ],
  },
];
