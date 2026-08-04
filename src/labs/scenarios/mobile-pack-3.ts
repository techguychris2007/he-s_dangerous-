import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'mobile-review-ws-3', user: 'root', root: dir({ root: dir(files) }) };
}

/** Mobile Security lab pack #3 — three labs pairing with the module's new lessons 6-8 (malware/banking
 *  trojans, MDM/enterprise security, and closing pentest methodology). All three are file-review scenarios,
 *  matching the established convention for techniques (Accessibility Service abuse, live Frida hooking,
 *  a MASVS-checklist audit) with no corresponding live engine simulation. */
export const mobileLabs3: LabScenario[] = [
  // 1 — Accessibility Service overlay attack fraud chain (Lesson 6)
  {
    id: 'mobile-accessibility-service-overlay-fraud-chain',
    title: 'Mobile: Accessibility Service Abuse Powers an Overlay Banking Fraud Chain',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'A sample disguised as a QR code scanner ("QuickScan Pro") was flagged after several users reported ' +
      'unauthorized bank transfers. Review its Accessibility Service usage and the resulting fraud incident ' +
      'timeline to confirm the full attack chain.',
    objectives: [
      { text: 'cat app_source/com/quickscan/service/AccessHelper.java', why: 'A QR scanner has no legitimate feature requiring Accessibility Service access at all — this is the first, immediate red flag from the lesson.' },
      { text: 'cat fraud-incident-timeline.txt', why: 'Confirms the full chain end to end: real-time screen reading detects the banking app opening, an overlay is drawn to capture credentials, and the intercepted SMS OTP completes a fraudulent transfer — combining Lesson 4\'s SMS interception with this lesson\'s overlay technique.' },
    ],
    hints: [
      'cat app_source/com/quickscan/service/AccessHelper.java',
      'cat fraud-incident-timeline.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          quickscan: dir({
            service: dir({
              'AccessHelper.java': file(
                'public class AccessHelper extends AccessibilityService {\n' +
                  '    public void onAccessibilityEvent(AccessibilityEvent event) {\n' +
                  '        String pkg = event.getPackageName().toString();\n' +
                  '        if (TARGET_BANKING_PACKAGES.contains(pkg)) {\n' +
                  '            drawOverlayOn(pkg);   // fake login screen, pixel-matched to the real app\n' +
                  '        }\n' +
                  '    }\n' +
                  '}\n' +
                  '-- a QR code scanner has no legitimate feature that requires reading the content of\n' +
                  '   OTHER apps\' screens in real time, let alone maintaining a list of banking package\n' +
                  '   names to watch for\n',
              ),
            }),
          }),
        }),
      }),
      'fraud-incident-timeline.txt': file(
        '14:02:11  victim opens com.regionalbank.app (real banking app)\n' +
          '14:02:11  QuickScan Pro AccessHelper detects foreground app change\n' +
          '14:02:12  fake overlay drawn over the real app, pixel-matched login screen\n' +
          '14:02:29  victim enters real banking credentials into the overlay\n' +
          '14:02:30  overlay dismissed -- real (already-loaded) banking app now visible underneath\n' +
          '14:03:05  SMS OTP intercepted via READ_SMS (Lesson 4 mechanism), forwarded silently\n' +
          '14:03:41  fraudulent transfer completed using stolen credentials + intercepted OTP\n' +
          '-- both authentication factors defeated entirely on-device, no bank-side compromise at all --\n' +
          'flag{accessibility_service_overlay_intercepts_banking_credentials_and_otp}\n',
      ),
    }),
    network: [],
  },

  // 2 — Frida-based root detection bypass defeating MDM compliance (Lesson 7)
  {
    id: 'mobile-frida-root-detection-bypass-mdm-compliance',
    title: 'Mobile: Frida Hooking Defeats an MDM Root-Compliance Check',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'corpmdm-agent blocks corporate email access on rooted devices. Review the captured Frida session that ' +
      'defeated this check on a test device, and confirm why a client-side compliance check can never be a ' +
      'fully reliable security boundary.',
    objectives: [
      { text: 'cat root-checker-source.txt', why: 'Reviewing the actual check first — a static su-binary/Magisk-file presence check, exactly the pattern the lesson described.' },
      { text: 'cat frida-bypass-session.log', why: 'Confirms the check\'s return value was hooked and forced to always report false, using the identical technique from the certificate-pinning bypass earlier in this module — any client-side security decision can be overridden once an attacker controls the device.' },
    ],
    hints: [
      'cat root-checker-source.txt',
      'cat frida-bypass-session.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'root-checker-source.txt': file(
        'public class RootChecker {\n' +
          '    public boolean isDeviceRooted() {\n' +
          '        return new File("/system/bin/su").exists() ||\n' +
          '               new File("/system/app/Superuser.apk").exists();\n' +
          '    }\n' +
          '}\n',
      ),
      'frida-bypass-session.log': file(
        '$ frida -U -f com.corp.mdmagent -l bypass.js\n' +
          'Java.perform(function () {\n' +
          '  var RootChecker = Java.use("com.corp.security.RootChecker");\n' +
          '  RootChecker.isDeviceRooted.implementation = function () { return false; };\n' +
          '});\n' +
          '[*] hook installed\n' +
          '[*] corpmdm-agent called isDeviceRooted() -> forced return: false\n' +
          '[*] compliance check PASSED -- corporate email access granted on a rooted test device\n' +
          '-- the device WAS rooted throughout -- only the CHECK\'S RETURN VALUE was ever altered --\n' +
          'flag{frida_hook_defeats_client_side_root_compliance_check}\n',
      ),
    }),
    network: [],
  },

  // 3 — MASVS checklist audit surfaces a missing resilience control (Lesson 8, capstone)
  {
    id: 'mobile-masvs-audit-missing-resilience-control',
    title: 'Mobile: A MASVS Checklist Audit Surfaces an Unaddressed Category',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'A completed assessment report for fieldopsapp is up for QA review before delivery. Cross-reference the ' +
      'evidence log against the OWASP MASVS category checklist from this module\'s closing lesson and confirm ' +
      'which category has NO test evidence recorded at all.',
    objectives: [
      { text: 'cat masvs-category-checklist.txt', why: 'The systematic, category-by-category pass this lesson described — not just testing for whatever comes to mind, but confirming coverage across every MASVS category.' },
      { text: 'cat assessment-evidence-log.txt', why: 'Cross-referencing the evidence log against the checklist reveals which category has zero corresponding test evidence — MASVS-RESILIENCE (root/jailbreak detection and anti-tampering testing) was never actually performed on this assessment, despite being listed as in-scope.' },
    ],
    hints: [
      'cat masvs-category-checklist.txt',
      'cat assessment-evidence-log.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'masvs-category-checklist.txt': file(
        'fieldopsapp assessment -- MASVS category scope (per engagement letter):\n' +
          '  [x] MASVS-STORAGE   [x] MASVS-CRYPTO    [x] MASVS-AUTH\n' +
          '  [x] MASVS-NETWORK    [x] MASVS-PLATFORM   [x] MASVS-CODE\n' +
          '  [ ] MASVS-RESILIENCE   [x] MASVS-PRIVACY\n',
      ),
      'assessment-evidence-log.txt': file(
        'Evidence index:\n' +
          '  storage-findings.pdf, crypto-review.pdf, auth-testing-notes.pdf,\n' +
          '  network-traffic-capture.pcap, manifest-review.pdf, static-analysis-report.pdf,\n' +
          '  permission-audit.pdf\n' +
          '-- no root-detection-bypass testing, no anti-tampering testing, and no resilience-\n' +
          '   category evidence of any kind appears anywhere in this index, despite\n' +
          '   MASVS-RESILIENCE being listed as in-scope on the checklist --\n' +
          'flag{masvs_audit_finds_untested_resilience_category}\n',
      ),
    }),
    network: [],
  },
];
