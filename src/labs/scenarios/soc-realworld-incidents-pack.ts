import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

export const socRealworldIncidentsLabs: LabScenario[] = [
  {
    id: 'soc-target-2013-alert-fatigue',
    title: 'SOC: The 2013 Target Breach — When Alerts Get Ignored',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'This recreates the mechanics of the real November-December 2013 Target breach, one of the most cited ' +
      'case studies in SOC training anywhere. Attackers who had compromised an HVAC vendor\'s credentials ' +
      'pivoted into Target\'s network and deployed memory-scraping point-of-sale malware, stealing roughly 40 ' +
      'million card numbers over about three weeks. The devastating detail: Target\'s own FireEye malware ' +
      'detection system genuinely flagged the malware — twice — in the days after it was first deployed, weeks ' +
      'before the breach became public. The alerts simply were not escalated in time, buried in a high-volume ' +
      'queue during a period when an auto-quarantine feature had reportedly been left disabled. This is the ' +
      'textbook illustration of "alert fatigue": having the right detection is worthless if the right alert ' +
      'never gets triaged.',
    objectives: [
      { text: 'cat fireeye-alert-queue.txt', why: 'A SOC queue is mostly noise — reviewing the full volume first is what makes the real signal-to-noise problem tangible instead of abstract.' },
      { text: 'grep "malware.binary" fireeye-alert-queue.txt', why: 'Filtering to the genuinely high-severity malware classification cuts straight through the policy/informational noise to the alerts that actually mattered.' },
      { text: 'Identify how many days passed between the first malware alert and public disclosure, and capture the flag', why: 'The gap between "detected" and "acted on" is the entire lesson of this incident — the technology worked exactly as designed, the triage process did not.' },
    ],
    hints: [
      'cat fireeye-alert-queue.txt',
      'grep "malware.binary" fireeye-alert-queue.txt — isolates the two real hits from dozens of policy/informational entries.',
      'Note the dates on those two alerts versus how long the breach continued afterward — the flag is on the analyst summary line.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'fireeye-alert-queue.txt': file(
          [
            '2013-11-27 09:02 alert_id=8801 severity=LOW category=policy source=10.20.4.03 msg="USB storage device inserted"',
            '2013-11-27 11:15 alert_id=8812 severity=INFO category=policy source=10.20.4.19 msg="Software update check completed"',
            '2013-11-28 14:40 alert_id=8830 severity=LOW category=policy source=10.20.4.22 msg="Failed login, account locked after 3 attempts"',
            '2013-11-30 14:12 alert_id=8841 severity=LOW category=policy source=10.20.4.12 msg="USB device inserted"',
            '2013-11-30 18:47 alert_id=8902 severity=HIGH category=malware.binary source=10.20.4.55 (POS-REGISTER-114) ' +
              'msg="Malware binary detected: memory-scraping process behavior matching a BlackPOS-family signature; ' +
              'attempted upload to an external FTP staging host was blocked"',
            '2013-12-01 08:03 alert_id=8955 severity=INFO category=policy source=10.20.4.30 msg="Scheduled antivirus definition update"',
            '2013-12-02 03:15 alert_id=9014 severity=HIGH category=malware.binary source=10.20.4.61 (POS-REGISTER-119) ' +
              'msg="Same malware family detected on a second point-of-sale register — lateral spread confirmed"',
            '2013-12-02 09:20 alert_id=9022 severity=LOW category=policy source=10.20.4.15 msg="Printer offline"',
            '2013-12-05 16:44 alert_id=9210 severity=INFO category=policy source=10.20.4.08 msg="VPN session established"',
            '2013-12-11 12:00 alert_id=9401 severity=LOW category=policy source=10.20.4.27 msg="Password changed by user"',
            '*** ANALYST NOTE (retrospective): FireEye correctly flagged this exact POS malware family on 2013-11-30 and ' +
              'again on 2013-12-02 — roughly two full weeks before the breach became public on 2013-12-18, and while the ' +
              'malware kept exfiltrating card data the entire time in between. The alerts were never escalated past the ' +
              'security operations team in time, a failure widely attributed afterward to alert-volume overload and an ' +
              'auto-quarantine feature that had reportedly been left disabled. Roughly 40 million card numbers were ' +
              'stolen in the gap between detection and action. ' +
              'flag{fireeye_flagged_blackpos_weeks_before_disclosure_alert_fatigue} ***',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'soc-bangladesh-bank-swift-heist',
    title: 'SOC: The 2016 Bangladesh Bank SWIFT Heist',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'This recreates the real February 2016 Bangladesh Bank heist — one of the largest attempted bank robberies ' +
      'in history. Attackers who had compromised the bank\'s SWIFT payment infrastructure submitted fraudulent ' +
      'transfer instructions attempting to move $951 million out through the Federal Reserve Bank of New York, ' +
      'timed deliberately around a weekend (Bangladesh\'s weekend falls on Friday-Saturday, delaying detection ' +
      'while the bank itself was closed). Most transfers were blocked by automated sanctions-list filters, but ' +
      'roughly $81 million reached accounts in the Philippines before being laundered through casinos. One ' +
      'transfer, however, was caught by a sharp-eyed compliance officer at a routing bank for a strikingly ' +
      'mundane reason: the beneficiary name was misspelled — "Shalika Fandation" instead of "Foundation" — which ' +
      'triggered a manual review that froze it. A billion-dollar heist very nearly succeeded, and the piece that ' +
      'stopped a chunk of it was a typo, not a technical control.',
    objectives: [
      { text: 'cat swift-transaction-log.txt', why: 'Fraud analysts review a batch of transfer requests the same way a SOC analyst reviews an alert queue — most look completely normal at a glance.' },
      { text: 'Note the timing pattern across all the requests', why: 'Submitting dozens of high-value transfers in a single tight window during a weekend/holiday closure is itself a red flag — it is designed specifically to buy the attacker time before anyone at the bank notices.' },
      { text: 'grep -i "fandation" swift-transaction-log.txt', why: 'This is the exact detail that broke the case in reality — a misspelled beneficiary name is a classic manual-review trigger, and it is worth internalizing that not every catch comes from a technical signature match.' },
      { text: 'Capture the flag on the compliance note explaining why this transfer specifically was frozen', why: 'Understanding exactly why one transfer among dozens got flagged is the actual transferable lesson — human review of anomalies still matters even inside a heavily automated payment system.' },
    ],
    hints: [
      'cat swift-transaction-log.txt',
      'Look at the timestamps across every request — they cluster in one unusually tight window.',
      'grep -i "fandation" swift-transaction-log.txt',
      'The flag is on the compliance-hold note attached to that specific transfer.',
    ],
    totalFlags: 1,
    attacker: analyst({
      root: dir({
        'swift-transaction-log.txt': file(
          [
            '--- SWIFT MT103 outbound transfer requests, Bangladesh Bank correspondent account, 2016-02-04/05 (Thu night into Fri) ---',
            'REF=TX10391 amount=$29,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=EXECUTED',
            'REF=TX10392 amount=$20,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=EXECUTED',
            'REF=TX10393 amount=$81,000,000 beneficiary="Shalika Fandation" bank="RCBC, Philippines" status=EXECUTED (later traced/laundered via casinos)',
            'REF=TX10394 amount=$870,000,000 beneficiary="Shalika Fandation" bank="Pan Asia Bank, Sri Lanka" status=BLOCKED — sanctions-list keyword match on beneficiary bank name',
            'REF=TX10395 amount=$36,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=BLOCKED — Fed compliance hold, request volume anomaly',
            'REF=TX10396 amount=$29,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=BLOCKED — same-day duplicate request pattern',
            '--- All 6 requests submitted within a single ~5-hour window overnight Thursday into Friday, Bangladesh\'s ' +
              'weekend — timed so the bank itself would not notice until Sunday, buying the attackers a two-day head start. ---',
            'COMPLIANCE NOTE (RCBC routing bank, on TX10393): "Beneficiary name \'Shalika Fandation\' does not match any ' +
              'known registered entity — likely misspelling of \'Foundation\'. Flagging for manual review is standard ' +
              'practice on any beneficiary name anomaly, regardless of transfer size or apparent legitimacy of the ' +
              'originating bank." This single spelling anomaly is the exact detail that alerted investigators after the ' +
              'fact — not a technical signature, a human noticing something that just looked slightly wrong.',
            'flag{misspelled_beneficiary_shalika_fandation_flagged_swift_fraud}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
