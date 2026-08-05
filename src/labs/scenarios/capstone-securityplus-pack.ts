import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Security+ module capstone: one continuous five-finding compliance audit spanning technical scanning
 *  (TLS version, default credentials, certificate chain) AND documentation review (logging retention,
 *  incident-response plan) — a real audit engagement covers both, not technical findings alone. Every
 *  mechanic (nmap -sV flag-in-version-string, ssh, file review) is already established elsewhere on this
 *  platform's Security+ labs. */
export const securityPlusCapstoneLabs: LabScenario[] = [
  {
    id: 'secplus-capstone-full-compliance-audit',
    title: 'Capstone: Full Compliance Audit — Vantage Municipal Services',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      "You're leading a PCI DSS and general-controls compliance audit of Vantage Municipal Services's IT " +
      'environment. A real audit engagement never stops at one technical scan — it combines infrastructure ' +
      'findings with a review of the documentation and processes that are supposed to back them up. Work ' +
      'through five independent findings across both categories and compile them into one audit report.',
    objectives: [
      {
        text: 'nmap -sV 10.10.240.5 to fingerprint the payment gateway\'s exact TLS configuration',
        why: 'PCI DSS compliance findings depend on the EXACT protocol version in use, not a general impression — the version banner is the audit evidence itself.',
      },
      {
        text: 'ssh admin@10.10.240.6 using the default credential still configured on the internal admin panel, then cat user.txt',
        why: 'CIS benchmarks explicitly require changing default credentials before production deployment — confirming one is still live and unchanged is one of the most common real audit findings across every framework.',
      },
      {
        text: 'nmap -sV 10.10.240.7 to identify the certificate chain issue on the internal application server',
        why: 'A broken or self-signed certificate chain on an internal application is exactly the kind of finding a technical scan surfaces that a policy review alone never would.',
      },
      {
        text: 'cat audit-logging-config.txt to review the log retention configuration against policy',
        why: "A technical control (logging) existing at all isn't the same as it meeting the RETENTION requirement a compliance framework actually specifies — this is a documentation-vs-configuration mismatch, a distinct finding class from a pure technical vulnerability.",
      },
      {
        text: 'cat incident-response-plan-review.txt and capture the final flag',
        why: 'A written incident-response plan that does not meet the regulatory notification timeline it is supposed to satisfy is a real, reportable compliance gap even though nothing about it is a technical vulnerability at all.',
      },
    ],
    hints: [
      'nmap -sV 10.10.240.5',
      'ssh admin@10.10.240.6',
      'ChangeMe123',
      'cat user.txt',
      'exit',
      'nmap -sV 10.10.240.7',
      'cat audit-logging-config.txt',
      'cat incident-response-plan-review.txt',
    ],
    totalFlags: 5,
    attacker: attacker({
      'audit-logging-config.txt': file(
        [
          '--- centralized logging configuration export, reviewed against Vantage\'s written retention policy ---',
          'Configured retention: 30 days',
          'Policy-required retention (per the written information security policy, section 4.2): 1 year',
          '--- the logging CONTROL exists and works correctly; it simply does not meet the RETENTION requirement the org\'s own policy specifies ---',
          'flag{log_retention_30_days_fails_1_year_policy_requirement}',
          '',
        ].join('\n'),
      ),
      'incident-response-plan-review.txt': file(
        [
          '--- Vantage Municipal Services written Incident Response Plan, v2.3 (reviewed against applicable breach-notification regulation) ---',
          "Plan's stated internal escalation timeline: within 5 business days of discovery",
          'Applicable regulatory notification requirement: within 72 hours of discovery',
          "--- the WRITTEN PLAN itself does not meet the regulatory timeline it is supposed to satisfy — a compliance gap that exists on paper, independent of any technical finding ---",
          'flag{incident_response_plan_timeline_fails_72_hour_regulatory_requirement}',
          '',
        ].join('\n'),
      ),
    }),
    network: [
      {
        hostname: 'payment-gw-legacy02',
        ip: '10.10.240.5',
        os: 'CentOS 6 (legacy, unpatched TLS stack)',
        services: [{ port: 443, name: 'https', version: 'Apache 2.2 mod_ssl (SSLv3 and TLS 1.0 still enabled — PCI DSS non-compliant — flag{sslv3_tls1_0_still_enabled_pci_dss_finding})' }],
        users: [],
        root: dir({}),
      } as HostDef,
      {
        hostname: 'internal-admin-panel',
        ip: '10.10.240.6',
        os: 'Ubuntu 20.04 (internal admin application)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH 8.2p1' }],
        users: [{ username: 'admin', password: 'ChangeMe123' }],
        root: dir({
          home: dir({
            admin: dir({
              'user.txt': file(
                'Default vendor credential still active on the internal admin panel — never rotated since initial deployment.\n' +
                  'flag{default_admin_credential_still_active_cis_benchmark_failure}\n',
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'internal-app-srv',
        ip: '10.10.240.7',
        os: 'Ubuntu 22.04 (internal application server)',
        services: [{ port: 443, name: 'https', version: 'nginx 1.24.0 (self-signed certificate, chain does not validate to a trusted root — flag{broken_certificate_chain_self_signed_internal_app})' }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
