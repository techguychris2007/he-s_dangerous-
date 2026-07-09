import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

export const securityPlusLabs: LabScenario[] = [
  {
    id: 'secplus-weak-tls-identification',
    title: 'Security+: Identifying a Deprecated TLS Configuration',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'A legacy payment gateway (10.10.111.1) is in scope for a compliance review. PCI DSS explicitly ' +
      'prohibits SSLv3 and early TLS versions. Your job is to confirm via banner/version scanning exactly ' +
      'which protocol version is in use and determine whether this system is currently out of compliance.',
    objectives: [
      { text: 'Scan 10.10.111.1 with nmap -sV to fingerprint the exact service and protocol version', why: 'PCI DSS compliance findings are based on the EXACT protocol version in use — "probably fine" isn\'t an acceptable finding in a compliance report; you need the specific version string.' },
      { text: 'Compare the identified version against the PCI DSS-prohibited list (SSLv3, TLS 1.0, TLS 1.1)', why: 'This is literally the compliance check itself — Security+ tests your ability to apply a specific regulatory requirement to a specific technical finding, not just recognize the requirement exists.' },
      { text: 'Capture the flag confirming the non-compliant finding', why: 'A finding like this typically requires immediate remediation with a defined timeline under most compliance frameworks — correctly identifying it is the first step in a real audit report.' },
    ],
    hints: [
      'nmap -sV 10.10.111.1',
      'The version banner will show the exact TLS/SSL version this service still accepts.',
      'PCI DSS has required disabling SSLv3 and TLS 1.0/1.1 for years — any of those three found here is a compliance failure.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'payment-gw-legacy', ip: '10.10.111.1', os: 'CentOS 6 (legacy, unpatched TLS stack)',
        services: [{ port: 443, name: 'https', version: 'Apache 2.2 mod_ssl (SSLv3 and TLS 1.0 enabled — PCI DSS non-compliant)' }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'secplus-pki-chain-misconfiguration',
    title: 'Security+: Broken Certificate Chain Investigation',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'Users report intermittent "certificate not trusted" warnings on an internal application ' +
      '(10.10.111.2). Investigate the certificate chain configuration to determine the root cause — a ' +
      'classic PKI misconfiguration where the server presents its own certificate but fails to include the ' +
      'required intermediate CA certificate in the chain.',
    objectives: [
      { text: 'Request the certificate chain metadata endpoint on 10.10.111.2', why: 'A "not trusted" error can mean several different things — expired cert, wrong hostname, or (as here) a missing intermediate. You have to actually inspect the chain to know which.' },
      { text: 'Identify that the intermediate CA certificate is missing from the served chain', why: 'Browsers cache intermediate certificates from other sites and often mask this exact misconfiguration intermittently — which is exactly why some users see the error and others don\'t, the "intermittent" clue in the briefing.' },
      { text: 'Capture the flag confirming the root cause', why: 'This is one of the most common real-world PKI misconfigurations — the fix is simple (serve the full chain, not just the leaf certificate) but only once correctly diagnosed.' },
    ],
    hints: [
      'curl 10.10.111.2/cert-chain-status',
      'A correctly configured server serves: leaf certificate + intermediate CA certificate together, not the leaf alone.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'internal-app', ip: '10.10.111.2', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.22.0',
          http: {
            '/cert-chain-status': '{"leaf_cert":"present","intermediate_ca":"MISSING","root_ca":"present","note":"clients without the intermediate cached separately will fail trust validation","flag":"flag{missing_intermediate_ca_breaks_chain_of_trust}"}',
          },
        }],
        users: [], root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'secplus-breach-notification-timeline',
    title: 'Security+: GDPR Breach Notification Timeline Audit',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'A data breach was discovered and the incident response team needs to confirm whether the ' +
      'organization met its GDPR 72-hour breach notification obligation. Review the incident timeline log ' +
      'to calculate the actual time-to-notification and determine compliance.',
    objectives: [
      { text: 'Review the incident timeline log', why: 'GDPR\'s clock starts at DISCOVERY, not at confirmation or remediation — a common point of confusion this exercise tests directly.' },
      { text: 'Calculate the exact hours between discovery and regulator notification', why: 'This is a precise compliance calculation, not a subjective judgment call — the exam (and real audits) expect an exact number compared against the 72-hour requirement.' },
      { text: 'Capture the flag confirming whether the organization was compliant', why: 'Missing this deadline carries its own regulatory penalty completely independent of the severity of the breach itself — which is exactly why this timeline gets audited as its own finding.' },
    ],
    hints: [
      'cat ~/incident-timeline.log',
      'Discovery time vs. regulator notification time — subtract to get the actual elapsed hours.',
      '72 hours is the GDPR threshold — compare your calculated value against it.',
    ],
    totalFlags: 1,
    attacker: attacker({
      'incident-timeline.log': file(
        [
          '2026-07-10 09:00:00  Breach DISCOVERED by SOC analyst reviewing alert queue',
          '2026-07-10 09:15:00  Incident declared, response team activated',
          '2026-07-11 14:00:00  Root cause identified (leaked API key)',
          '2026-07-13 08:30:00  Regulator notification SENT',
          '--- elapsed time from discovery to notification: 71 hours 30 minutes ---',
          '--- 71.5 hours is UNDER the 72-hour GDPR threshold: COMPLIANT, but with very little margin ---',
          'flag{gdpr_72_hour_notification_met_with_30_minutes_to_spare}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
];
