import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analystBox(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'malware-lab', user: 'root', root: dir(files) };
}

export const leakedNsaToolsLabs: LabScenario[] = [
  {
    id: 'malware-doublepulsar-implant-analysis',
    title: 'Malware Forensics: Identifying the DoublePulsar Implant',
    difficulty: 'Hard',
    category: 'Malware',
    briefing:
      'A suspicious, unsigned kernel driver was pulled from a compromised file server\'s memory. This recreates ' +
      'the publicly documented analysis of DoublePulsar — the covert, kernel-mode (ring-0) backdoor implant that ' +
      'the Shadow Brokers leaked to the public in April 2017 as part of a cache of NSA "Equation Group" tooling, ' +
      'alongside the EternalBlue SMB exploit used to deliver it. Within days of the leak, multiple security ' +
      'vendors (Countercept and Microsoft among the first) published full public technical breakdowns of how ' +
      'DoublePulsar hides: it hooks the SMB driver and responds to a specially crafted, otherwise-unremarkable ' +
      '"ping check" request over SMB with a fixed signature — reachable only by someone who already knows the ' +
      'exact check to send, which is precisely what made it stay undetected on infected hosts for so long ' +
      'before the leak. Everything referenced here is drawn from that now-public, extensively researched ' +
      'material — not anything non-public.',
    objectives: [
      { text: 'file suspicious-driver.sys', why: 'Confirming this is an unsigned kernel-mode driver — not a normal user-space process — is the first red flag; legitimate SMB functionality does not ship as an ad hoc, unsigned .sys file.' },
      {
        text: 'strings suspicious-driver.sys',
        why: 'The publicly-documented DoublePulsar ping-check signature is a static string/byte pattern extractable straight from the driver — exactly how independent researchers first fingerprinted it within days of the 2017 leak, without any insider knowledge.',
      },
      {
        text: 'yara the public detection rule against the driver',
        why: 'Multiple vendors published YARA rules for DoublePulsar within the same week as the leak — matching one immediately tells a response team this is a known, previously-analyzed implant with a well-documented removal procedure, not a novel unknown.',
      },
      {
        text: 'Read the incident write-up to confirm the delivery chain and remediation',
        why: 'DoublePulsar was never found alone in the wild — it was always delivered by EternalBlue first. Confirming that chain is what tells a responder the fix requires both patching MS17-010 AND sweeping for the implant itself, since patching the delivery exploit alone does not remove an already-installed backdoor.',
      },
    ],
    hints: [
      'file suspicious-driver.sys',
      'strings suspicious-driver.sys',
      'yara doublepulsar_public_rule.yar suspicious-driver.sys',
      'cat incident-writeup.txt',
    ],
    totalFlags: 2,
    attacker: analystBox({
      root: dir({
        'suspicious-driver.sys': file(
          '#FILETYPE: PE32+ executable (native) x86-64, kernel-mode driver, unsigned\n' +
            '#YARA_MATCH:rule DoublePulsar_SMB_Implant_Public MATCHED on suspicious-driver.sys\\nmatched: SMB trans2 ping-check response signature (publicly documented post-2017 Shadow Brokers leak)\\nclassification: NSA Equation Group implant, delivered via EternalBlue (CVE-2017-0144), confirmed\n' +
            'ntoskrnl.exe\n' +
            'srv.sys (SMB driver hook target)\n' +
            'SMB trans2 covert channel — responds only to a specific crafted "ping check" request, silent to everything else\n' +
            'Leaked 2017-04-14 by Shadow Brokers alongside EternalBlue (CVE-2017-0144) — publicly analyzed by Countercept and Microsoft within days\n' +
            'flag{doublepulsar_kernel_implant_identified_via_strings}\n',
        ),
        'doublepulsar_public_rule.yar': file(
          'rule DoublePulsar_SMB_Implant_Public {\n' +
            '  strings:\n' +
            '    $a = "trans2 ping-check"\n' +
            '    $b = "srv.sys"\n' +
            '  condition:\n' +
            '    all of them\n' +
            '}\n',
        ),
        'incident-writeup.txt': file(
          'Delivery chain: EternalBlue (CVE-2017-0144, MS17-010) opened the SMB RCE; DoublePulsar was the ' +
            'implant it dropped for persistent, stealthy re-access — never observed independently in the wild.\n' +
            'Remediation requires BOTH patching MS17-010 AND actively sweeping for the implant itself; patching ' +
            'the delivery exploit alone does nothing for a host already backdoored before the patch was applied.\n' +
            'flag{doublepulsar_delivered_by_eternalblue_patch_alone_is_not_remediation}\n',
        ),
      }),
    }),
    network: [],
  },
];
