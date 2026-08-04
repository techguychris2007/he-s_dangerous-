import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'wireless-review-ws-3', user: 'root', root: dir({ root: dir(files) }) };
}

/** Wireless & Wi-Fi Hacking lab pack #3 — three labs pairing with the module's new lessons 6-8 (enterprise
 *  802.1X/EAP/RADIUS, wireless IDS/defensive monitoring, and cellular/5G security). All three are file-review
 *  scenarios — no live RADIUS/WIDS/cellular-baseband simulation exists in this engine, matching the honest
 *  convention already established across this module's other file-review labs. */
export const wirelessLabs3: LabScenario[] = [
  // 1 — rogue RADIUS server captures domain credentials via EAP downgrade (Lesson 6)
  {
    id: 'wireless-rogue-radius-eap-credential-capture',
    title: 'Wireless: A Rogue RADIUS Server Captures Full Domain Credentials',
    difficulty: 'Hard',
    category: 'Wireless',
    briefing:
      'A red team engagement stood up a rogue AP cloning "MeridianCorp-Enterprise" alongside a hostapd-wpe ' +
      'rogue RADIUS server. Review the captured session log to confirm what a client with certificate ' +
      'validation disabled actually handed over.',
    objectives: [
      { text: 'cat rogue-radius-session.log', why: 'A client that skips RADIUS server certificate validation (Lesson 6\'s critical failure mode) will complete the EAP exchange against ANY server presenting ANY certificate — including one the attacker fully controls.' },
      { text: 'Confirm whether the captured credential is Wi-Fi-only or a broader domain credential', why: 'This is the finding that makes rogue-RADIUS attacks so consistently high-severity in real assessments: the captured credential is typically the SAME one used for VPN, email, and Active Directory — not a Wi-Fi-scoped password.' },
    ],
    hints: [
      'cat rogue-radius-session.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'rogue-radius-session.log': file(
        'hostapd-wpe -- rogue AP "MeridianCorp-Enterprise" + rogue RADIUS active\n' +
          '[+] client 9C:34:2A:B1:F0:22 associated, beginning EAP exchange\n' +
          '[+] client did NOT validate the RADIUS server certificate (cert validation disabled\n' +
          '    in this client\'s Wi-Fi profile -- likely a manually-configured BYOD device)\n' +
          '[+] EAP-PEAP inner method: MSCHAPv2\n' +
          '[+] captured MSCHAPv2 challenge/response for user: j.alvarez\n' +
          '$ asleap -C <challenge> -R <response> -W corp-wordlist.txt\n' +
          '[+] password recovered: Winter2025!\n' +
          '-- j.alvarez is a valid Active Directory domain account -- this credential grants VPN,\n' +
          '   email, and internal system access, not just Wi-Fi -- a single misconfigured client\n' +
          '   profile handed over full domain credentials --\n' +
          'flag{rogue_radius_eap_downgrade_captures_full_domain_credential}\n',
      ),
    }),
    network: [],
  },

  // 2 — WIDS alert triage: distinguishing a genuine rogue AP from a false positive (Lesson 7)
  {
    id: 'wireless-wids-alert-triage-rogue-ap',
    title: 'Wireless: Triaging a WIDS Alert — Rogue AP or False Positive?',
    difficulty: 'Medium',
    category: 'Wireless',
    briefing:
      'The Kismet WIDS fired an APSPOOF alert overnight. Review the alert details against the approved AP ' +
      'inventory to determine whether this is a genuine rogue access point or a legitimate device the ' +
      'inventory simply hasn\'t been updated to include yet.',
    objectives: [
      { text: 'cat kismet-alert.log', why: 'Read the actual alert details first — BSSID, vendor OUI, and the ESSID it\'s broadcasting — before jumping to a conclusion either way.' },
      { text: 'cat approved-ap-inventory-current.txt', why: 'Cross-referencing against the CURRENT (not stale) approved inventory is the actual triage step — this specific BSSID and vendor OUI do not match any approved device, and the vendor OUI resolves to consumer router hardware inconsistent with the enterprise-grade APs this organization deploys, confirming a genuine rogue device rather than an inventory gap.' },
    ],
    hints: [
      'cat kismet-alert.log',
      'cat approved-ap-inventory-current.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'kismet-alert.log': file(
        'ALERT: APSPOOF - 2026-08-04 02:14:07\n' +
          'BSSID: 7C:B0:C2:44:19:9E broadcasting SSID "MeridianCorp-Guest"\n' +
          'Vendor OUI: 7C:B0:C2 -> resolves to "TP-Link Technologies" (consumer-grade hardware)\n' +
          'Signal strength: -38 dBm (very strong -- likely close proximity, possibly inside the building)\n',
      ),
      'approved-ap-inventory-current.txt': file(
        'meridian-corp IT -- approved wireless AP inventory (updated this morning, current)\n' +
          '  All approved APs: Cisco/Aruba enterprise hardware only, vendor OUIs 00:1A:2B, 00:1A:2C\n' +
          '  Approved BSSIDs for "MeridianCorp-Guest": 00:1A:2B:3C:4D:5E, 00:1A:2B:3C:4D:5F\n' +
          '  -- 7C:B0:C2:44:19:9E does not match ANY approved BSSID or vendor OUI --\n' +
          '  -- consumer-grade TP-Link hardware is inconsistent with this org\'s enterprise-only\n' +
          '     deployment standard -- this is a GENUINE rogue AP, not an inventory gap --\n' +
          'flag{wids_alert_triage_confirms_genuine_rogue_ap_not_false_positive}\n',
      ),
    }),
    network: [],
  },

  // 3 — IMSI catcher detection via baseband/signal log analysis (Lesson 8)
  {
    id: 'wireless-imsi-catcher-downgrade-detection',
    title: 'Wireless: Baseband Log Analysis Reveals a Suspected IMSI Catcher',
    difficulty: 'Hard',
    category: 'Wireless',
    briefing:
      'A security-conscious executive\'s phone logged unusual cellular behavior near a public event venue. ' +
      'Review the baseband diagnostic log to confirm whether the pattern is consistent with IMSI catcher ' +
      'activity, per the indicators this module\'s cellular security lesson described.',
    objectives: [
      { text: 'cat baseband-diagnostic-log.txt', why: 'A forced downgrade to an older, weaker network generation, combined with a tower ID that disappears immediately after, is exactly the IMSI catcher pattern the lesson described — impersonating a legitimate tower to force a less-secure connection, then vanishing.' },
    ],
    hints: [
      'cat baseband-diagnostic-log.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'baseband-diagnostic-log.txt': file(
        '14:41:02  Connected: Tower ID 0x4F21A9, Cell Type: 5G-NSA, Carrier: [redacted]\n' +
          '14:41:55  Signal from Tower ID 0xFFFF01 detected, unusually strong (-42 dBm)\n' +
          '14:41:56  FORCED DOWNGRADE: connection dropped to 2G (GSM) -- no user action, no normal\n' +
          '          handoff reason logged\n' +
          '14:42:10  Connected: Tower ID 0xFFFF01, Cell Type: 2G-GSM\n' +
          '14:47:33  Tower ID 0xFFFF01 no longer broadcasting -- reconnected normally to\n' +
          '          Tower ID 0x4F21A9 (5G-NSA) with no further issues\n' +
          '-- Tower ID 0xFFFF01 does not appear in ANY public carrier tower registry for this --\n' +
          '   area, was active for only 6 minutes, and forced a downgrade to the weakest --\n' +
          '   available network generation with no legitimate handoff justification logged --\n' +
          'flag{baseband_log_pattern_consistent_with_imsi_catcher_downgrade}\n',
      ),
    }),
    network: [],
  },
];
