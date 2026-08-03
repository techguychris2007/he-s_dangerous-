import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Batch 20, part 2a: Active Directory (AD CS ESC8, ESC4). Written from established high-confidence
 *  technical knowledge -- WebSearch was unavailable for this batch (see NOTES.md batch 20). */
export const batch20MixedLabsA: LabScenario[] = [
  // 1 — Active Directory: ESC8 — AD CS Web Enrollment NTLM Relay to Domain Admin
  {
    id: 'ad-adcs-esc8-ntlm-relay-web-enrollment',
    title: 'Active Directory: ESC8 — AD CS Web Enrollment NTLM Relay to Domain Admin',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL\'s Certificate Authority has the HTTP-based Certificate Enrollment Web Service (CES) ' +
      'enabled -- a real, standard AD CS component installed on many domains for browser-based certificate ' +
      'requests -- and, critically, that web enrollment endpoint accepts NTLM authentication over plain ' +
      'HTTP with no Extended Protection for Authentication (EPA) and no channel binding enforced. This is ' +
      'ESC8, one of the real, publicly documented AD CS misconfiguration classes: coercing a domain ' +
      'controller\'s own machine account into authenticating to an attacker-controlled listener (the real, ' +
      'standard tool for this coercion is PetitPotam, abusing the MS-EFSRPC API) and relaying that captured ' +
      'NTLM authentication straight to the web enrollment endpoint issues a valid client authentication ' +
      'certificate FOR the domain controller\'s own machine account -- a certificate that can then be used ' +
      'to request a Kerberos TGT and fully impersonate the DC.',
    objectives: [
      { text: 'nmap -sV 10.10.300.2', why: 'Confirms the AD CS Certificate Enrollment Web Service is exposed over HTTP before checking whether it enforces the protections that would prevent NTLM relay.' },
      { text: 'cat adcs-web-enrollment-audit.txt', why: 'Confirms the web enrollment endpoint accepts NTLM auth over plain HTTP with no Extended Protection for Authentication and no channel binding -- the exact real precondition ESC8 requires.' },
      { text: 'exploit adcs-esc8-ntlm-relay 10.10.300.2', why: 'Represents the real chain: PetitPotam coerces the domain controller\'s machine account into authenticating to a listener, and that captured NTLM authentication is relayed to the web enrollment endpoint, issuing a valid client-auth certificate for the DC\'s own identity.' },
      { text: 'Once the session opens, check /root/root.txt', why: 'Confirms the issued certificate was actually used to obtain a TGT and impersonate the domain controller.' },
    ],
    hints: [
      'nmap -sV 10.10.300.2',
      'cat adcs-web-enrollment-audit.txt',
      'exploit adcs-esc8-ntlm-relay 10.10.300.2',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'adcs-web-enrollment-audit.txt': file(
        'AD CS Certificate Enrollment Web Service (CES) audit, CORP.LOCAL:\n' +
          '  Endpoint: http://ca01.corp.local/certsrv/ (HTTP, not HTTPS)\n' +
          '  NTLM authentication: accepted\n' +
          '  Extended Protection for Authentication (EPA): NOT enforced\n' +
          '  Channel binding: NOT enforced\n' +
          '  -- ESC8 precondition confirmed: relayed NTLM authentication to this endpoint is accepted with no\n' +
          '     binding check tying it to the original connection at all --\n',
      ),
    }),
    network: [
      {
        hostname: 'CA01',
        ip: '10.10.300.2',
        os: 'Windows Server 2019 (AD Certificate Services, web enrollment, EPA not enforced)',
        services: [{ port: 80, name: 'http', version: 'AD CS Certificate Enrollment Web Service (NTLM, no EPA)' }],
        users: [],
        exploitableAs: 'adcs-esc8-ntlm-relay',
        root: dir({
          root: dir({
            'root.txt': file(
              'ESC8 confirmed -- PetitPotam-coerced DC machine-account NTLM authentication relayed to AD CS web ' +
                'enrollment issued a valid client-auth certificate for the DC itself.\nflag{adcs_esc8_ntlm_relay_web_enrollment_dc_cert}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Active Directory: ESC4 — AD CS Certificate Template ACL Abuse
  {
    id: 'ad-adcs-esc4-template-acl-abuse',
    title: 'Active Directory: ESC4 — AD CS Certificate Template ACL Abuse',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A certificate template named "StandardUser" has an overly permissive ACL: svc_helpdesk holds ' +
      'WriteProperty over the template object itself -- not over any issued certificate, but over the ' +
      'TEMPLATE\'S OWN CONFIGURATION. This is ESC4, distinct from ESC1 (a template that already, by default, ' +
      'allows low-privileged enrollees to supply a Subject Alternative Name): here the attacker rewrites the ' +
      'template\'s own settings -- using a real tool like Certipy\'s template-write action -- to grant itself ' +
      'exactly the dangerous properties ESC1 already covers, then requests a certificate under the newly-' +
      'weakened template naming Administrator as the SAN.',
    objectives: [
      { text: 'cat certificate-template-acl-audit.txt', why: 'Confirms svc_helpdesk holds WriteProperty over the StandardUser template object itself -- the ability to rewrite the template\'s own configuration, not merely request certificates under its existing rules.' },
      { text: 'exploit adcs-esc4-template-rewrite 10.10.300.3', why: 'Represents the real chain: rewriting the template\'s own settings to enable SAN-supplying enrollment, then requesting a certificate naming Administrator, exactly the outcome ESC1 covers but reached by first weakening the template rather than finding one already misconfigured.' },
      { text: 'Once the session opens, check /root/root.txt', why: 'Confirms the forged certificate genuinely authenticates as Administrator.' },
    ],
    hints: [
      'cat certificate-template-acl-audit.txt',
      'exploit adcs-esc4-template-rewrite 10.10.300.3',
      'cat /root/root.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'certificate-template-acl-audit.txt': file(
        'Certificate template ACL audit, template "StandardUser", CORP.LOCAL:\n' +
          '  Principal: svc_helpdesk\n' +
          '  Right: WriteProperty (on the template object itself, not on issued certificates)\n' +
          '  -- ESC4: this lets svc_helpdesk rewrite the template\'s own configuration, including enabling\n' +
          '     the exact SAN-supplying enrollment behavior ESC1 already documents as dangerous by default --\n',
      ),
    }),
    network: [
      {
        hostname: 'CA01-ESC4',
        ip: '10.10.300.3',
        os: 'Windows Server 2019 (AD Certificate Services, template ACL misconfigured)',
        services: [{ port: 443, name: 'https', version: 'AD CS Certification Authority' }],
        users: [],
        exploitableAs: 'adcs-esc4-template-rewrite',
        root: dir({
          root: dir({
            'root.txt': file(
              'ESC4 confirmed -- WriteProperty on a certificate template let the attacker rewrite its own ' +
                'configuration to enable SAN-supplying enrollment, then forge an Administrator certificate.\nflag{adcs_esc4_template_acl_rewrite_admin_cert}\n',
            ),
          }),
        }),
      } as HostDef,
    ],
  },
];